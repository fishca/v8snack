//engine: JScript
//uname: profile_autosave
//dname: Автосохранение настроек Снегопата
//debug: no
//addin: global
//descr: Записывает настройки Снегопата на диск после каждого изменения (с паузой 2 с), чтобы при вылете 1С не пропадали настройки, и хранит копии папки настроек
//author: Пушин Владимир
//help: inplace

/*@
Встроенный аддин. Настройки Снегопата (настройки аддинов, автозагрузка, горячие клавиши, положение и состав открытых окон, списки и т. п.) лежат в своих файлах
data\Snegopat\settings\*.set (engine/settings_store.as) — прежний файл snegopat.pfl вырезан. Платформа пишет профиль (свои файлы 1cv8*.pfl) только при штатном выходе
из Конфигуратора, поэтому при вылете изменения с начала сеанса терялись. Аддин следит за счётчиком изменений profileRoot.changeCount и значениями debug/* и вызывает
saveProfile(), когда профиль изменился и 2 с не менялся (не в модальном режиме и не в секунды 57–05 каждой минуты, где flush платформы подвисает); плюс запись при выходе,
если есть несохранённые изменения. Свои файлы настроек пишет сам движок (слияние по ключам, раз в ~0,5 с); здесь только вызывается принудительная запись settingsFlush().
Принцип «пишем только своё» (2026-10-12): безусловной записи раз в 5 минут нет. flush платформы переписывает ВСЕ файлы профиля (1cv8.pfl, 1cv8cmn.pfl…) из памяти этого процесса,
и при нескольких Конфигураторах безусловная запись затирала бы чужие свежие изменения. Перед каждой записью проверяется, не менял ли общий файл другой процесс: если менял —
его версия сохраняется в data\Snegopat\backup\foreign-*.pfl (в журнал, без окна сообщений).
Привязка файлов: 1cv8.pfl, 1cv8cmn.pfl, 1cv8u.pfl общие для всех Конфигураторов (последняя запись побеждает); <база>\1cv8.pfl, <база>\<id>\1cv8.pfl и Local\…\dbg.pfl у каждой базы свои.

Защита от потери настроек Снегопата: при каждом старте Конфигуратора папка settings копируется в data\Snegopat\backup\settings-<время>\ (хранятся последние 10).
Восстановление: закрыть Конфигураторы и скопировать файлы .set из нужной копии в data\Snegopat\settings\. Если раздела нет вообще — он заполнится начальными
настройками владельца из data\Snegopat\defaults\.
@*/

global.connectGlobals(SelfScript)

var SAVE_PERIOD = 2000          // мс между проверками «профиль изменился?»
var SETTLE_MS = 2000            // профиль пишем, когда он не менялся столько мс (не на каждый символ)
var KEEP_START = 10             // сколько копий папки настроек (по одной на старт Конфигуратора) хранить
var tickNo = 0
var fso = null

function log(text, cat) {
    try { snegopat.diagLog(cat || "profile", text) } catch (e) { }
}

function pad(n) { return n < 10 ? "0" + n : "" + n }

function stamp(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
}

function backupDir() {
    if (!fso) fso = new ActiveXObject("Scripting.FileSystemObject")
    var d = env.pathes.data + "backup"
    if (!fso.FolderExists(d)) fso.CreateFolder(d)
    return d + "\\"
}

// Оставить последние keep файлов с именем prefix*.pfl (имена содержат дату/время — сортировка по имени)
function prune(dir, prefix, keep) {
    try {
        var names = []
        for (var e = new Enumerator(fso.GetFolder(dir).Files); !e.atEnd(); e.moveNext()) {
            var n = e.item().Name
            if (n.indexOf(prefix) == 0) names.push(n)
        }
        names.sort()
        for (var i = 0; i < names.length - keep; i++)
            fso.DeleteFile(dir + names[i], true)
    } catch (e) { }
}

// Оставить последние keep папок с именем prefix* (имена содержат дату/время — сортировка по имени)
function pruneDirs(dir, prefix, keep) {
    try {
        var names = []
        for (var e = new Enumerator(fso.GetFolder(dir).SubFolders); !e.atEnd(); e.moveNext()) {
            var n = e.item().Name
            if (n.indexOf(prefix) == 0) names.push(n)
        }
        names.sort()
        for (var i = 0; i < names.length - keep; i++)
            fso.DeleteFolder(dir + names[i], true)
    } catch (e) { }
}

// Копия папки настроек Снегопата на момент запуска (до первой записи этим процессом)
function startSnapshot() {
    try {
        var src = env.pathes.data + "settings"
        var dir = backupDir()
        if (!fso.FolderExists(src)) { log("старт: папки настроек " + src + " ещё нет"); return }
        var d = new Date()
        var dst = dir + "settings-" + stamp(d) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
        fso.CopyFolder(src, dst, true)
        pruneDirs(dir, "settings-", KEEP_START)
        log("старт: копия настроек в " + dst)
    } catch (e) { log("startSnapshot: " + e.message) }
}

var lastTick = 0
var startedAt = new Date().getTime()
var lastChange = -1         // последнее прочитанное значение profileRoot.changeCount
var dirtySince = 0          // с какого момента профиль изменён и не записан (0 — записан)
var lastFlush = 0

// flush платформы иногда блокируется на 0,4–4 с около начала каждой минуты (замеры 2026-10-04) — в эти секунды не пишем
function inFlushDanger() {
    var s = new Date().getSeconds()
    return s >= 57 || s <= 5
}

// Ключи настроек отладки («Сервис → Параметры → Отладка»: протокол, адрес сервера отладки…) платформа под Снегопатом объявляет в хранилище, которое не пишется
// на диск: выбор терялся и при flush, и при штатном выходе, пока в файле профиля базы (<база>\1cv8.pfl) не было раздела debug (проверено 2026-10-12, задача №414;
// без Снегопата платформа пишет эти ключи именно в этот файл). Ключи, уже лежащие в файле, загружаются и сохраняются нормально.
// Поэтому один раз после старта переносим ключи в хранилище «компьютер+база» (pflCompBase = файл <база>\1cv8.pfl): обёртка createValue для существующего
// значения удаляет его и создаёт заново в указанном хранилище с тем же значением (тип сохраняется). Несуществующие ключи не трогаем.
var DEBUG_KEYS = ["debuggerType", "debugServerType", "localDebugServerAddr", "localDebugServerPortRanges", "remoteDebugServer", "remoteDebugServerHistory",
    "remoteDebugUseSpecifiedInfobaseAlias", "remoteDebugInfobaseAlias", "DbgsUserName", "DbgsPassword"]
var debugRelocated = false

function relocateDebugKeys() {
    debugRelocated = true
    try {
        var f = profileRoot.getFolder("debug"), have = {}
        for (var i = 0, n = f.valuesCount; i < n; i++) have[f.valueName(i)] = true
        var moved = []
        for (var j = 0; j < DEBUG_KEYS.length; j++)
            if (have[DEBUG_KEYS[j]]) { profileRoot.createValue("debug/" + DEBUG_KEYS[j], "", pflCompBase); moved.push(DEBUG_KEYS[j]) }
        log("настройки отладки перенесены в хранилище файла базы: " + moved.length + " ключей")
    } catch (e) { log("relocateDebugKeys: " + e.message) }
}

// «Применить» в диалоге параметров отладки меняет значения мимо обёртки — счётчик changeCount не растёт. Следим за самими значениями debug/*,
// чтобы настройка уходила на диск через ~2 с, а не при выходе.
var lastDebugSig = null

function debugSignature() {
    try {
        var f = profileRoot.getFolder("debug"), r = []
        for (var j = 0; j < DEBUG_KEYS.length; j++)
            r.push(String(f.getValue(DEBUG_KEYS[j])))
        return r.join("|")
    } catch (e) { return "" }
}

// ── Защита общих файлов от затирания ──
// «Общий» — файл, который пишут и другие Конфигураторы. Подпись файла = размер и время изменения.
var seenStamp = {}
var sharedList = null

function sharedFiles() {
    if (sharedList) return sharedList
    sharedList = []
    try {
        var roam = new ActiveXObject("WScript.Shell").ExpandEnvironmentStrings("%APPDATA%") + "\\1C\\1cv8\\"
        sharedList.push(roam + "1cv8.pfl", roam + "1cv8cmn.pfl", roam + "1cv8u.pfl")
    } catch (e) { }
    return sharedList
}

function stampOf(f) {
    try {
        if (!fso) fso = new ActiveXObject("Scripting.FileSystemObject")
        if (!fso.FileExists(f)) return ""
        var fl = fso.GetFile(f)
        return fl.Size + "|" + fl.DateLastModified
    } catch (e) { return "" }
}

function rememberStamps() {
    var l = sharedFiles()
    for (var i = 0; i < l.length; i++) seenStamp[l[i]] = stampOf(l[i])
}

// До flush: если с момента нашей последней записи общий файл изменил другой процесс, flush затрёт его изменения копией из памяти этого процесса.
// Поэтому чужая версия сохраняется рядом с резервными копиями — её можно вернуть или слить руками.
function guardForeignWrites() {
    var l = sharedFiles(), dir = null
    for (var i = 0; i < l.length; i++) {
        var f = l[i], st = stampOf(f)
        if (st === "" || seenStamp[f] === undefined || st === seenStamp[f]) continue
        try {
            if (!dir) dir = backupDir()
            var name = f.split("\\").pop().replace(/\.pfl$/i, "")
            var d = new Date()
            var copy = dir + "foreign-" + name + "-" + stamp(d) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + ".pfl"
            fso.CopyFile(f, copy, true)
            prune(dir, "foreign-" + name + "-", 5)
            var msg = "Файл настроек " + f + " изменён другим процессом 1С с момента последней записи; его версия сохранена: " + copy
            log(msg)                              // только в журнал: окно сообщений 1С — для настоящих ошибок (правило 6)
        } catch (e) { log("guardForeignWrites: " + e.message) }
    }
}

function doFlush(why) {
    var t0 = new Date().getTime()
    try { snegopat.settingsFlush() } catch (e) {}
    guardForeignWrites()
    saveProfile()
    rememberStamps()
    var dt = new Date().getTime() - t0
    lastFlush = new Date().getTime()
    dirtySince = 0
    if (dt > 200)
        log("saveProfile (" + why + ") занял " + dt + " мс", "freeze")
}

// Замер зависаний: таймер срабатывает в главном потоке, поэтому опоздание тика = главный поток был занят (или заморожен)
function tick() {
    try {
        var now = new Date().getTime()
        if (lastTick && now - lastTick > SAVE_PERIOD + 1500)
            log("тик опоздал на " + (now - lastTick - SAVE_PERIOD) + " мс (главный поток был занят)", "freeze")
        lastTick = now
        // в модальном режиме (диалоги платформы) профиль не трогаем
        if (windows.modalMode != msNone)
            return
        if (!debugRelocated && now - startedAt > 5000) relocateDebugKeys()
        var sig = debugSignature()
        if (lastDebugSig === null) lastDebugSig = sig
        else if (sig !== lastDebugSig) { lastDebugSig = sig; if (!dirtySince) dirtySince = now; return }
        var c = profileRoot.changeCount
        if (c !== lastChange) {                 // профиль менялся: ждём паузу SETTLE_MS без новых изменений
            lastChange = c
            if (!dirtySince) dirtySince = now
            return
        }
        if (dirtySince && now - dirtySince >= SETTLE_MS && !inFlushDanger()) {
            doFlush("изменения")
            return
        }
    } catch (e) { }
}

// Штатный выход: платформа 8.3.27 при выходе профиль Снегопата не записывает — пишем сами, но только если у этого процесса есть несохранённые изменения
// (безусловная запись затёрла бы изменения других Конфигураторов)
function beforeExitApp() {
    try {
        if (dirtySince || profileRoot.changeCount !== lastChange || debugSignature() !== lastDebugSig)
            doFlush("выход")
    } catch (e) { }
}

// Раскладка окон. Платформа 8.3.27 переносит положение прикреплённых окон (окно расширения, «Панель окон», «Внешние файлы», группы закладок)
// в профиль в памяти уже ПОСЛЕ beforeExitApp — к событию onExitApp, а на диск общий профиль при выходе под Снегопатом не записывает
// (проверено 2026-10-16 на Кьютеке, 8.3.27.1936: файл 1cv8cmn.pfl за 17 секунд выхода не менялся ни разу; после saveProfile() в onExitApp в нём
// появились верные позиции). Поэтому в onExitApp пишем профиль сами. Безусловная запись здесь допустима: идёт выход процесса, как и у платформы без Снегопата.
function onExitApp() {
    try { snegopat.settingsFlush() } catch (e) { }
    try { saveProfile() } catch (e) { log("onExitApp: " + e.message) }
}

startSnapshot()
rememberStamps()
lastFlush = new Date().getTime()
createTimer(SAVE_PERIOD, SelfScript.self, "tick")
events.connect(Designer, "beforeExitApp", SelfScript.self)
events.connect(Designer, "onExitApp", SelfScript.self)
