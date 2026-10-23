//engine: JScript
//uname: errorlog
//dname: Журнал ошибок Снегопата
//debug: no
//addin: global
//descr: Единое место для ошибок Снегопата: в окно сообщений 1С — коротко, подробности — в файлах logs\
//author: Пушин Владимир
//help: inplace

/*@
Встроенный аддин (загружается стартовым скриптом вместе с остальными служебными).
Собирает ошибки из трёх источников и выводит их в окно сообщений 1С одной строкой, без отдельных окон:
  1. ошибки движка Core.As (исключения AngelScript и платформы) — по файлам logs\...\*.log; окно «Core.As» прячется;
  2. ошибки скриптов-аддинов (JScript/VBScript) — очередь Designer.takeScriptError(); копия каждой строки — в logs\script-errors.txt;
  3. повторы подряд сворачиваются, всплеск ошибок не заваливает окно сообщений (не больше 6 строк за такт).
Полный текст остаётся в logs\ (там же, где пишет Core.As). Недавние ошибки доступны скриптам:
    var el = addins.byUniqueName("errorlog").object
    el.recent(20)      — последние записи: [{seq, time, source, text, detail}]
    el.since(seq)      — записи новее номера seq (так забирает диагностика); el.scanNow() — просмотреть логи сразу
Макросы: ПоказатьНедавниеОшибки, ОткрытьПапкуЖурналов.
@*/

global.connectGlobals(SelfScript)

var MAX_PER_TICK = 6        // сколько строк за один такт выводим в окно сообщений
var KEEP = 300              // сколько записей храним в памяти
var HIDE_PERIOD = 400       // мс: как часто прячем окно «Core.As»
var SCAN_EVERY = 8          // сканировать логи раз в SCAN_EVERY тактов (≈3 с)
var SCAN_MAX_TICKS = 150     // потолок паузы между проходами (≈1 мин)
var nextScanTick = 0

var logRoot = String(env.snMainFolder).replace(/[\\\/]+$/, "").replace(/[\\\/]modules[\\\/][^\\\/]+$/i, "") + "\\logs"
var fsoObj = new ActiveXObject("Scripting.FileSystemObject")
var logSeen = {}            // путь файла → сколько символов уже разобрано
var logMeta = {}            // путь файла → размер на момент последнего чтения (файл, размер которого не изменился, не копируем и не читаем)
var knownLogs = {}          // путь файла → true: кандидаты на разбор (дерево logs\ обходим редко, а не при каждом проходе)
var lastWalkAt = 0
var WALK_PERIOD = 60000     // мс: как часто заново обходить дерево логов (новый лог появляется при первой ошибке процесса)
var records = []            // кольцо последних записей
var seq = 0
var tickNo = 0
var lastText = ""           // для сворачивания повторов
var repeats = 0
var startedAt = new Date().getTime()

// Файл лога открыт Core.As на запись, прямое чтение из ADODB упирается в блокировку — читаем копию (CopyFile открывает с общим доступом)
var tmpName = null
function readUtf8(path) {
    if (!tmpName) tmpName = fsoObj.GetSpecialFolder(2).Path + String.fromCharCode(92) + "snegopat-errorlog-" + Designer.processId() + ".tmp"
    fsoObj.CopyFile(path, tmpName, true)
    var st = new ActiveXObject("ADODB.Stream")
    st.Type = 2
    st.Charset = "utf-8"
    st.Open()
    st.LoadFromFile(tmpName)
    var t = st.ReadText()
    st.Close()
    return t
}

// Файлы логов за последние сутки (по всем подпапкам logs\)
function logFiles() {
    var out = [], since = new Date().getTime() - 24 * 3600 * 1000
    ;(function walk(path, depth) {
        if (depth > 6 || !fsoObj.FolderExists(path)) return
        var fl = fsoObj.GetFolder(path)
        for (var en = new Enumerator(fl.Files); !en.atEnd(); en.moveNext()) {
            var f = en.item()
            if (/\.log$/i.test(f.Name) && new Date(f.DateLastModified).getTime() >= since)
                out.push(f)
        }
        for (var en2 = new Enumerator(fl.SubFolders); !en2.atEnd(); en2.moveNext())
            walk(en2.item().Path, depth + 1)
    })(logRoot, 0)
    return out
}

// Разбор записей лога Core.As: запись начинается строкой с |!!!| и продолжается строками « |  .|»
function parseLogErrors(text) {
    var lines = text.split(/\r?\n/), res = [], cur = null
    for (var i = 0; i < lines.length; i++) {
        var l = lines[i]
        if (/\|!!!\|/.test(l)) {
            if (cur) res.push(cur)
            cur = { head: l.replace(/^﻿/, ""), lines: [l] }
        } else if (cur && /^\s+\|\s*\.\|/.test(l)) {
            cur.lines.push(l)
        } else if (cur) {
            res.push(cur); cur = null
        }
    }
    if (cur) res.push(cur)
    var out = []
    for (var j = 0; j < res.length; j++) {
        var body = res[j].lines.join("\n")
        var field = function (name) {
            var m = new RegExp(name + ":\\s*(.*)").exec(body)
            return m ? m[1].replace(/\s+$/, "") : ""
        }
        var descr = field("Описание")
        if (!descr) {
            // Запись без разбора на поля (ошибка самого Core.As, например «Failed in call to function…»): берём её первую строку.
            // Хвосты предыдущей записи («Bad AngelScript result code…», «No prepare AngelScript context…») отдельной информации не несут.
            var head = res[j].head.replace(/^.*\|!!!\|\s*/, "").replace(/\s+$/, "")
            if (!head || /^(Bad AngelScript result code|No prepare AngelScript context)/.test(head)) continue
            out.push({ summary: "Ошибка движка Снегопата: " + head.substr(0, 300), text: body.substr(0, 4000) })
            continue
        }
        var summary = "Ошибка движка Снегопата: " + descr +
            (field("Функция") ? " — " + field("Функция") : "") +
            (field("Файл") ? " (" + field("Файл").split(/[\\\/]/).pop() + ":" + field("Строка") + ")" : "")
        out.push({ summary: summary, text: body.substr(0, 4000) })
    }
    return out
}

var pendingOut = []         // строки, ждущие вывода в окно сообщений

function add(source, text, detail) {
    var rec = { seq: ++seq, time: new Date().getTime(), source: source, text: text, detail: detail || "" }
    records.push(rec)
    if (records.length > KEEP) records.shift()
    if (text == lastText) { repeats++; return }       // повторы подряд сворачиваем
    flushRepeats()
    lastText = text
    pendingOut.push(text)
}

function flushRepeats() {
    if (repeats > 0) {
        pendingOut.push("   (предыдущая ошибка повторилась ещё " + repeats + " раз)")
        repeats = 0
    }
}

// Обход дерева logs\ — дорогой на сетевой папке (~1 с главного потока), поэтому не чаще раза в WALK_PERIOD (или minAge);
// между обходами на каждом проходе проверяем только размер уже известных файлов (одно обращение на файл).
function scanLogs(first, minAge) {
    var now = new Date().getTime()
    if (first || now - lastWalkAt >= (minAge === undefined ? WALK_PERIOD : minAge)) {
        lastWalkAt = now
        try {
            var found = logFiles()
            for (var k = 0; k < found.length; k++) knownLogs[found[k].Path] = true
        } catch (e) {}
    }
    for (var p in knownLogs) {
        var f
        try { f = fsoObj.GetFile(p) } catch (e) { delete knownLogs[p]; continue }
        var text, size = f.Size
        if (logMeta[p] === size) continue
        try { text = readUtf8(p) } catch (e) { continue }
        logMeta[p] = size
        var seen = logSeen[p]
        if (seen === undefined) {
            // на первом проходе пропускаем старые логи прошлых запусков, но берём файлы, созданные прямо перед загрузкой аддина
            // (ошибки старта: лог создаётся при первой ошибке процесса)
            var fresh = new Date(f.DateCreated).getTime() >= startedAt - 90 * 1000
            seen = (first && !fresh) ? text.length : 0
        }
        logSeen[p] = text.length
        if (text.length <= seen) continue
        var errs = parseLogErrors(text.substr(seen))
        for (var j = 0; j < errs.length; j++)
            add("engine", errs[j].summary, errs[j].text)
    }
}

// Ошибки скриптов-аддинов дублируются в logs\script-errors.txt (UTF-16): так они сохраняются и после закрытия окна сообщений.
// Файл не больше ~2 МБ: при превышении переименовывается в script-errors.old.txt.
var SCRIPT_ERRORS_MAX = 2 * 1024 * 1024
function saveScriptError(text) {
    try {
        var f = logRoot + String.fromCharCode(92) + "script-errors.txt"
        if (!fsoObj.FolderExists(logRoot)) fsoObj.CreateFolder(logRoot)
        if (fsoObj.FileExists(f) && fsoObj.GetFile(f).Size > SCRIPT_ERRORS_MAX) {
            var old = logRoot + String.fromCharCode(92) + "script-errors.old.txt"
            if (fsoObj.FileExists(old)) fsoObj.DeleteFile(old, true)
            fsoObj.MoveFile(f, old)
        }
        var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n }
        var stamp = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds())
        var ts = fsoObj.OpenTextFile(f, 8, true, -1)
        ts.WriteLine(stamp + "  " + text)
        ts.Close()
    } catch (e) {}
}

function drainScriptErrors() {
    try {
        for (var m = Designer.takeScriptError(), n = 0; m && n < 50; m = Designer.takeScriptError(), n++) {
            add("script", String(m), "")
            saveScriptError(String(m))
        }
    } catch (e) {}
}

function emit() {
    flushRepeats()
    var shown = 0
    while (pendingOut.length && shown < MAX_PER_TICK) {
        try { Message(pendingOut.shift(), mExc2) } catch (e) {}
        shown++
    }
    if (pendingOut.length > 0 && shown >= MAX_PER_TICK) {
        var rest = pendingOut.length
        pendingOut = []
        try { Message("   … ещё " + rest + " сообщений об ошибках — см. журналы в папке logs", mExc2) } catch (e) {}
    }
}

var ticker = {
    tick: function () {
        // окно «Core.As» (log window движка) показывать не нужно — всё идёт в окно сообщений
        try { Designer.hideLogWindows() } catch (e) {}
        // накопленные строки журнала движка (diag.as копит их в памяти для набора текста и журнала на сетевой папке) — на диск не реже раза в период таймера
        try { snegopat.diagFlush() } catch (e) {}
        try { snegopat.settingsTick() } catch (e) {}
        drainScriptErrors()
        if (tickNo >= nextScanTick) {
            // Папка логов на сетевом ресурсе: один проход (обход дерева + перечитывание выросшего лога) занимает ~1 с главного потока
            // (замер на «Лонмади», 8.3.27, Снегопат на UNC), каждые 3 с это давало лаги при наборе. Следующий проход — не раньше чем через 30 длительностей прохода.
            var t0 = new Date().getTime()
            scanLogs(tickNo == 0)
            var dt = new Date().getTime() - t0
            nextScanTick = tickNo + Math.min(SCAN_MAX_TICKS, Math.max(SCAN_EVERY, Math.ceil(dt * 30 / HIDE_PERIOD)))
        }
        tickNo++
        if (pendingOut.length) emit()
    }
}

// ── API для скриптов ──
function recent(n) {
    n = n || 20
    return records.slice(Math.max(0, records.length - n))
}

function since(afterSeq) {
    var r = []
    for (var i = 0; i < records.length; i++) if (records[i].seq > afterSeq) r.push(records[i])
    return r
}

function lastSeq() {
    return seq
}

exports.recent = recent
exports.since = since
exports.lastSeq = lastSeq
// внеочередной просмотр
exports.scanNow = function () { drainScriptErrors(); scanLogs(false, 10000) }

function macrosПоказатьНедавниеОшибки() {
    var r = recent(15)
    if (!r.length) { Message("Ошибок Снегопата с момента запуска не было"); return }
    for (var i = 0; i < r.length; i++) Message(r[i].text, mExc2)
}

function macrosОткрытьПапкуЖурналов() {
    new ActiveXObject("WScript.Shell").Run('explorer.exe "' + logRoot + '"')
}

function getDefaultMacros() {
    return 'ПоказатьНедавниеОшибки'
}

scanLogs(true)                          // запомнить уже имеющиеся логи (и сразу показать свежие ошибки старта)
emit()
createTimer(HIDE_PERIOD, ticker, "tick")
