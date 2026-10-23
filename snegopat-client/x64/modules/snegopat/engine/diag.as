/*
 * Единая диагностика движка (tools/ADAPT.md, tools/DISABLED-27.md).
 *
 * Настройки — файл logs/diag.ini (строки «ключ=значение», «;» — комментарий), перечитывается не чаще раза в 2 с, перезапуск 1С не нужен:
 *   trace=on (или log=on)     подробный журнал (то, что раньше включал файл logs/vt.on): аргументы перехватчиков, клавиши, потоки, дампы vtable
 *   cat.<категория>=on|off    выборочно включить/выключить категорию подробного журнала (list, colors, keys, vt, ...); без ключа — как trace
 *   hook.<имя>=on|off         принудительно включить/выключить перехват платформы (list, colors); без ключа — решение по умолчанию для версии
 * Старые флаги-файлы logs/vt.on, logs/nohook-<имя>.on, logs/hook-<имя>.on продолжают работать.
 *
 * Журнал — logs/script-log.txt (UTF-16): «секунды.мс pPID tПОТОК #номер [категория] текст». Суточная ротация: вчерашнее уходит в
 * script-log-ГГГГ-ММ-ДД.txt (при >32 МБ — ещё и -N), хранятся последние 3 суток; так же чистятся журналы Core.As в logs/Snegopat (*.log, *.trace). Строки уровня diagAlways пишутся всегда
 * (запуск, состояние перехватов, чужие потоки), остальные — только при включённой трассировке. Последние строки держатся в памяти
 * (diagTail) — их отдаёт snegopat.diagTail() для диагностики и tools/crashinfo.py.
 */
#pragma once
#include "../all.h"

class DiagState {
    uint lastRead = 0;
    bool loaded = false;
    bool trace = false;
    array<string> keys;
    array<string> vals;
    array<string> ring;
    uint ringPos = 0;
    uint seq = 0;
    uint startTick = GetTickCount();
    bool bannerDone = false;
    int day = 0;            // текущий день (дней от 1970 по местному времени) для суточной ротации журнала
};
DiagState diagSt;

const uint diagRingSize = 300;

// Что делал движок перед открытием окна (editProperty/openEditor объекта метаданных…): попадает в запись «до оригинала» createWindow
string diagCtx;

string diagLower(const string& s) {
    string r = s;
    r.makeLower();
    return r;
}

string diagDir() {
    return myFolder + "../../logs/";
}

bool diagFileExists(const string& path) {
    HANDLE g = CreateFile(path.cstr, 0x80000000, 3, 0, 3, 0x80, 0);
    if (g == 0 || g + 1 == 0)
        return false;
    CloseHandle(g);
    return true;
}

// Прочитать logs/diag.ini в словарь (не чаще раза в 2 секунды)
void diagReload() {
    uint now = GetTickCount();
    if (diagSt.loaded && now - diagSt.lastRead < 2000)
        return;
    diagSt.lastRead = now;
    diagSt.loaded = true;
    diagSt.keys.resize(0);
    diagSt.vals.resize(0);
    string text = readUtf8File(diagDir() + "diag.ini");
    array<string>&& lines = text.split("\n");
    for (uint i = 0; i < lines.length; i++) {
        string ln = lines[i].trim(" \t\r");
        if (ln.isEmpty() || ln.substr(0, 1) == ";" || ln.substr(0, 1) == "#")
            continue;
        uint eq = ln.find("=");
        if (eq == badStrIdx || eq == 0)
            continue;
        diagSt.keys.insertLast(diagLower(ln.substr(0, eq).trim(" \t")));
        diagSt.vals.insertLast(diagLower(ln.substr(eq + 1).trim(" \t")));
    }
    diagSt.trace = diagIniIs("trace") || diagIniIs("log") || diagFileExists(diagDir() + "vt.on");
}

string diagGet(const string& key) {
    for (uint i = 0; i < diagSt.keys.length; i++)
        if (diagSt.keys[i] == key)
            return diagSt.vals[i];
    return "";
}

bool diagIniIs(const string& key) {
    string v = diagGet(key);
    return v == "on" || v == "1" || v == "true" || v == "yes";
}

// Режим перехвата <name>: 0 — по умолчанию, 1 — принудительно включён, 2 — принудительно выключен
int diagHookMode(const string& name) {
    diagReload();
    string v = diagGet("hook." + name);
    if (!v.isEmpty()) {
        if (v == "on" || v == "1")
            return 1;
        if (v == "off" || v == "0")
            return 2;
    }
    if (diagFileExists(diagDir() + "nohook-" + name + ".on"))
        return 2;
    if (diagFileExists(diagDir() + "hook-" + name + ".on"))
        return 1;
    return 0;
}

// Включён ли перехват: defaultOn — решение по умолчанию для этой версии платформы; результат логируется один раз за вызов установки
bool diagHook(const string& name, bool defaultOn) {
    int m = diagHookMode(name);
    bool on = m == 1 ? true : (m == 2 ? false : defaultOn);
    diagAlways("hook", "перехват '" + name + "': " + (on ? "ВКЛ" : "выкл") + (m == 0 ? " (по умолчанию)" : (m == 1 ? " (принудительно, diag.ini/флаг)" : " (отключён, diag.ini/флаг)")));
    return on;
}

// Совместимость со старыми вызовами
bool hookDisabled(const string& name) {
    return diagHookMode(name) == 2;
}
bool hookForced(const string& name) {
    return diagHookMode(name) == 1;
}

// Включена ли подробная трассировка (категория cat — необязательно)
bool diagTraceOn(const string& cat = "") {
    diagReload();
    if (!cat.isEmpty()) {
        string v = diagGet("cat." + cat);
        if (!v.isEmpty()) {
            if (v == "off" || v == "0")
                return false;
            if (v == "on" || v == "1")
                return true;
        }
    }
    // тяжёлые дампы vtable (dumpVtable падает внутри Core.As на этой платформе) — и опрос окон MDI (мусор раз в секунду, 90% журнала) — только по явному cat.vt=on / cat.mdi=on, а не по общему trace
    // lex — строка на каждый вызов разбора лексем платформой (сотни за один показ списка), key — строка на каждую набранную букву в списке:
    // каждая запись в журнал открывает файл, на сетевой папке это ~18 мс, и подсказка замирала на 3–5 с (Лонмади, 2026-10-13) — только явно cat.lex=on / cat.key=on
    if (cat == "vt" || cat == "mdi" || cat == "lex" || cat == "key")
        return false;
    return diagSt.trace;
}
bool dbgOn() {
    return diagTraceOn();
}

// Поток, в котором загружен движок (главный поток 1С): вызовы перехватчиков из других потоков Core.As обслужить не может
uint mainThreadId = GetCurrentThreadId();

// Вызов из главного потока? Чужой поток логируется (категория thread) и должен обойтись без входа в скрипты.
bool diagIsMainThread(const string& where = "") {
    uint t = GetCurrentThreadId();
    if (t == mainThreadId)
        return true;
    if (!where.isEmpty())
        diagAlways("thread", where + ": вызов из чужого потока " + t + " (главный " + mainThreadId + ")");
    return false;
}

string diagStamp() {
    uint t = GetTickCount() - diagSt.startTick;
    string ms = "" + (t % 1000);
    while (ms.length < 3)
        ms = "0" + ms;
    return "" + (t / 1000) + "." + ms + " p" + GetCurrentProcessId() + " t" + GetCurrentThreadId() + " #" + (++diagSt.seq);
}

// ---- Ротация журналов: храним только последние diagKeepDays суток (сегодня + предыдущие) ----
const int diagKeepDays = 3;
const uint diagMaxPart = 33554432;      // 32 МБ: больше — текущий файл уходит в архив дня, пишем в новый

// Дни от 1970-01-01 по гражданской дате
int diagDayNumber(int y, int m, int d) {
    if (m <= 2)
        y--;
    int era = y / 400;
    int yoe = y - era * 400;
    int doy = (153 * ((m + 9) % 12) + 2) / 5 + d - 1;
    int doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    return era * 146097 + doe - 719468;
}

string diagPad2(int v) {
    return v < 10 ? "0" + v : "" + v;
}

// Дата «ГГГГ-ММ-ДД» по числу дней от 1970
string diagDayName(int dn) {
    int z = dn + 719468;
    int era = z / 146097;
    int doe = z - era * 146097;
    int yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    int y = yoe + era * 400;
    int doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    int mp = (5 * doy + 2) / 153;
    int d = doy - (153 * mp + 2) / 5 + 1;
    int m = mp < 10 ? mp + 3 : mp - 9;
    if (m <= 2)
        y++;
    return "" + y + "-" + diagPad2(m) + "-" + diagPad2(d);
}

int diagToday() {
    int_ptr st = malloc(16);
    GetLocalTime(st);
    int r = diagDayNumber(mem::word[st], mem::word[st + 2], mem::word[st + 6]);
    free(st);
    return r;
}

// День последней записи в файл (местное время); 0 — файла нет или он пуст
int diagFileDay(const string& path) {
    int_ptr fd = malloc(600);
    HANDLE h = FindFirstFile(path.cstr, fd);
    int res = 0;
    if (h != 0 && h + 1 != 0) {
        if (mem::dword[fd + 32] != 0 || mem::dword[fd + 28] != 0) {
            int_ptr lft = malloc(16);
            FileTimeToLocalFileTime(fd + 20, lft);
            uint64 ticks = (uint64(mem::dword[lft + 4]) << 32) | uint64(mem::dword[lft]);
            res = int(ticks / 864000000000) - 134774;
            free(lft);
        }
        FindClose(h);
    }
    free(fd);
    return res;
}

// Имена в каталоге по маске (dirs — каталоги или файлы)
array<string> diagListDir(const string& pattern, bool dirs) {
    array<string> res;
    int_ptr fd = malloc(600);
    HANDLE h = FindFirstFile(pattern.cstr, fd);
    if (h != 0 && h + 1 != 0) {
        do {
            uint n = 0;
            while (n < 260 && mem::word[fd + 44 + 2 * n] != 0)
                n++;
            string nm;
            int_ptr p = nm.setLength(n);
            for (uint i = 0; i < n; i++)
                mem::word[p + 2 * i] = mem::word[fd + 44 + 2 * i];
            bool isDir = (mem::dword[fd] & 0x10) != 0;
            if (nm != "." && nm != ".." && isDir == dirs)
                res.insertLast(nm);
        } while (FindNextFile(h, fd) != 0);
        FindClose(h);
    }
    free(fd);
    return res;
}

// Унести текущий script-log.txt в архив script-log-<день>[-N].txt
bool diagArchiveLog(int day) {
    string cur = diagDir() + "script-log.txt";
    string base = diagDir() + "script-log-" + diagDayName(day);
    for (int n = 0; n < 10; n++) {
        string dst = base + (n == 0 ? "" : "-" + n) + ".txt";
        if (GetFileAttributes(dst.cstr) == 0xFFFFFFFF)
            return MoveFile(cur.cstr, dst.cstr) != 0;
    }
    return DeleteFile(cur.cstr) != 0;
}

// Удалить журналы старше diagKeepDays суток: архивы script-log-*.txt, старый script-log.1.txt и per-process журналы Core.As (*.log и *.trace)
void diagCleanOld(int today) {
    string dir = diagDir();
    DeleteFile((dir + "script-log.1.txt").cstr);
    for (int dn = today - diagKeepDays; dn >= today - 60; dn--) {
        string base = dir + "script-log-" + diagDayName(dn);
        DeleteFile((base + ".txt").cstr);
        for (int n = 1; n < 10; n++)
            DeleteFile((base + "-" + n + ".txt").cstr);
    }
    // logs/Snegopat/<процесс>/<версия>/<разрядность>/ГГГГ-ММ-ДД-чч-мм-сс.log — имя начинается с даты
    string cutoff = diagDayName(today - diagKeepDays + 1);
    array<string> procs = diagListDir(dir + "Snegopat/*", true);
    for (uint i = 0; i < procs.length; i++) {
        array<string> vers = diagListDir(dir + "Snegopat/" + procs[i] + "/*", true);
        for (uint j = 0; j < vers.length; j++) {
            array<string> bits = diagListDir(dir + "Snegopat/" + procs[i] + "/" + vers[j] + "/*", true);
            for (uint k = 0; k < bits.length; k++) {
                string sub = dir + "Snegopat/" + procs[i] + "/" + vers[j] + "/" + bits[k] + "/";
                for (int t = 0; t < 2; t++) {           // *.log и *.trace (трассы по 5–10 МБ на каждый запуск)
                    array<string> files = diagListDir(sub + (t == 0 ? "*.log" : "*.trace"), false);
                    for (uint f = 0; f < files.length; f++)
                        if (files[f].length >= 10 && files[f].substr(0, 10) < cutoff)
                            DeleteFile((sub + files[f]).cstr);
                }
            }
        }
    }
}

// Суточная ротация: при смене дня (и на старте процесса) вчерашний script-log.txt уходит в архив, старое чистится
void diagRotateDaily() {
    int today = diagToday();
    if (today == diagSt.day)
        return;
    int fday = diagFileDay(diagDir() + "script-log.txt");
    if (fday != 0 && fday != today && !diagArchiveLog(fday))
        return;                         // файл занят другим процессом — повторим на следующей записи
    diagSt.day = today;
    diagCleanOld(today);
}

// Накопление строк журнала. Каждая запись «открыть файл — дописать — закрыть» на сетевой папке стоит ~18 мс (главный поток стоит), поэтому:
//  - строки частых событий (категории key и lex — набор текста) и ВСЕ строки при журнале на сетевой папке сначала копятся в памяти,
//    на диск уходят одной записью не чаще раза в diagFlushMs (или при diagFlushLines строк);
//  - немедленно (вместе со всем накопленным, порядок сохраняется) пишутся: diagAlways (важные события, медленные случаи), строки со словом «оригинал»
//    (вызов в платформу — если она упадёт, всё, что было до вызова, уже на диске) и всё при diagFlush() (по таймеру из errorlog.js);
//  - кольцо diagSt.ring (последние 300 строк) пополняется сразу, оно доступно через snegopat.diagTail.
const uint diagFlushMs = 250;
const uint diagFlushLines = 400;
string diagBuf;
uint diagBufLines = 0;
uint diagLastFlush = 0;
int diagUncState = -1;          // журнал на сетевой папке (путь начинается с двух слэшей): -1 не определено, 0 нет, 1 да

bool diagIsUnc() {
    if (diagUncState < 0) {
        string d = diagDir();
        diagUncState = (d.length > 2 && (d[0] == 92 || d[0] == 47) && (d[1] == 92 || d[1] == 47)) ? 1 : 0;
    }
    return diagUncState == 1;
}

// Запись данных (строки уже с переводом строки) в файл журнала: ротация по размеру, открытие на дозапись
void diagWriteRaw(const string& data) {
    diagRotateDaily();
    string path = diagDir() + "script-log.txt";
    HANDLE h = CreateFile(path.cstr, 4, 3, 0, 4, 0x80, 0);
    if (h == 0 || h + 1 == 0)
        return;
    if (GetFileSize(h, 0) > diagMaxPart) {
        CloseHandle(h);
        diagArchiveLog(diagSt.day);
        h = CreateFile(path.cstr, 4, 3, 0, 4, 0x80, 0);
        if (h == 0 || h + 1 == 0)
            return;
    }
    fileWriteBytes(h, data.cstr, data.length * 2);
    CloseHandle(h);
}

// Сбросить накопленное на диск (безопасно вызывать в любой момент)
void diagFlush() {
    if (diagBuf.isEmpty())
        return;
    string data = diagBuf;
    diagBuf = "";
    diagBufLines = 0;
    diagLastFlush = GetTickCount();
    diagWriteRaw(data);
}

void diagWrite(const string& line, bool deferred = false) {
    if (diagSt.ring.length < diagRingSize)
        diagSt.ring.insertLast(line);
    else {
        diagSt.ring[diagSt.ringPos] = line;
        diagSt.ringPos = (diagSt.ringPos + 1) % diagRingSize;
    }
    string outLine = line + "\r\n";
    if (!deferred && diagBuf.isEmpty()) {
        diagWriteRaw(outLine);              // быстрый путь прежнего поведения: строка сразу на диск
        diagLastFlush = GetTickCount();
        return;
    }
    diagBuf += outLine;
    diagBufLines++;
    if (!deferred || diagBufLines >= diagFlushLines || GetTickCount() - diagLastFlush >= diagFlushMs)
        diagFlush();
}

// Запись всегда (важные события)
void diagAlways(const string& cat, const string& text) {
    diagWrite(diagStamp() + " [" + cat + "] " + text);
}

// Запись при включённой трассировке (категория cat)
void diag(const string& cat, const string& text) {
    if (!diagTraceOn(cat))
        return;
    // копим в памяти: частые категории набора и любой журнал на сетевой папке; вызов в платформу («оригинал») — пишем сразу
    bool deferred = (cat == "key" || cat == "lex" || diagIsUnc()) && text.find("оригинал") == badStrIdx;
    diagWrite(diagStamp() + " [" + cat + "] " + text, deferred);
}

// Старый интерфейс
void dbgLog(const string& text) {
    diag("dbg", text);
}

// Последние n строк журнала (в порядке записи)
string diagTail(uint n = 60) {
    uint len = diagSt.ring.length;
    if (n > len)
        n = len;
    string res;
    uint start = len < diagRingSize ? 0 : diagSt.ringPos;
    for (uint i = len - n; i < len; i++)
        res += diagSt.ring[(start + i) % len] + "\n";
    return res;
}

// Записать значение в diag.ini (ключ=значение; пустое значение удаляет ключ)
void diagSet(const string& key, const string& value) {
    string text = readUtf8File(diagDir() + "diag.ini");
    array<string>&& lines = text.split("\n");
    string outText;
    string k = diagLower(key);
    for (uint i = 0; i < lines.length; i++) {
        string ln = lines[i].trim("\r");
        uint eq = ln.find("=");
        if (eq != badStrIdx && eq > 0 && diagLower(ln.substr(0, eq).trim(" \t")) == k)
            continue;
        if (!ln.trim(" \t").isEmpty())
            outText += ln + "\r\n";
    }
    if (!value.isEmpty())
        outText += k + "=" + value + "\r\n";
    string path = diagDir() + "diag.ini";
    HANDLE h = CreateFile(path.cstr, 0x40000000, 3, 0, 2, 0x80, 0);
    if (h == 0 || h + 1 == 0)
        return;
    int len = WideCharToMultiByteNull(65001, 0, outText.cstr, outText.length, 0, 0, 0, 0);
    int_ptr buf = malloc(len + 4);
    WideCharToMultiByteNull(65001, 0, outText.cstr, outText.length, buf, len, 0, 0);
    fileWriteBytes(h, buf, len);
    free(buf);
    CloseHandle(h);
    diagSt.loaded = false;
}

// Текущее состояние диагностики для отчёта
string diagState() {
    diagReload();
    string r = "trace=" + (diagSt.trace ? "on" : "off") + "; mainThread=" + mainThreadId + "; ver=" + sv8ver + "; ini:";
    for (uint i = 0; i < diagSt.keys.length; i++)
        r += " " + diagSt.keys[i] + "=" + diagSt.vals[i];
    return r;
}

// Безопасное чтение 8 байт по произвольному адресу (0 — нельзя прочитать): для диагностики значений аргументов перехватчиков
int_ptr dbgSafeQword(int_ptr addr) {
    if (addr < 0x10000)
        return 0;
    int_ptr buf = malloc(16);
    mem::int_ptr[buf] = 0;
    int_ptr nread = malloc(16);
    mem::int_ptr[nread] = 0;
    ReadProcessMemory(int_ptr(-1), addr, buf, 8, nread);
    int_ptr r = mem::int_ptr[nread] == 8 ? mem::int_ptr[buf] : 0;
    free(buf);
    free(nread);
    return r;
}

string dbgHex(int_ptr v) {
    return formatInt(v, "0x", 16);
}

// Сброс в logs/vt-dump.bin начала vtable объекта (при трассировке, категория vt). Запись: [tag, адрес объекта, адрес vtable, маркер] + 130 слотов.
void dbgDumpVT(int_ptr obj, int tag) {
    if (!diagTraceOn("vt"))
        return;
    string path = diagDir() + "vt-dump.bin";
    HANDLE h = CreateFile(path.cstr, 4, 3, 0, 4, 0x80, 0);
    if (h == 0 || h + 1 == 0)
        return;
    int_ptr buf = malloc(32 + 8 * 130);
    int_ptr vt = 0;
    int n = 0;
    HANDLE self = GetCurrentProcess();
    // чтение через ReadProcessMemory: мусорный указатель даёт ошибку, а не падение
    if (obj > 0x10000 && ReadProcessMemory(self, obj, buf + 16, 8, 0) != 0) {
        vt = mem::int_ptr[buf + 16];
        if (vt > 0x10000 && ReadProcessMemory(self, vt, buf + 32, 8 * 130, 0) != 0)
            n = 130;
        else
            vt = 0;
    }
    mem::int_ptr[buf] = tag;
    mem::int_ptr[buf + 8] = obj;
    mem::int_ptr[buf + 16] = vt;
    mem::int_ptr[buf + 24] = 0x4242424242424242;
    fileWriteBytes(h, buf, 32 + 8 * n);
    CloseHandle(h);
    free(buf);
}

// Заголовок сеанса: версия платформы, потоки, настройки диагностики (вызывается из main.as после инициализации)
void diagBanner() {
    if (diagSt.bannerDone)
        return;
    diagSt.bannerDone = true;
    diagAlways("start", "Снегопат запущен, платформа " + sv8ver + ", главный поток " + mainThreadId + ", " + diagState());
}

// Прочитать len байт (кратно 8) по адресу как строку из 16-значных hex-слов через пробел; недоступная память — пустая строка.
// Для реверса структур платформы (tools/dumpvt.py, tools/objscan.py).
string diagReadHex(int_ptr addr, uint len) {
    if (addr < 0x10000 || len == 0 || len > 65536)
        return "";
    int_ptr buf = malloc(len + 16);
    int_ptr nread = malloc(16);
    mem::int_ptr[nread] = 0;
    ReadProcessMemory(int_ptr(-1), addr, buf, len, nread);
    string r;
    if (mem::int_ptr[nread] == int_ptr(len)) {
        for (uint i = 0; i < len; i += 8) {
            if (i > 0)
                r += " ";
            r += formatInt(mem::int_ptr[buf + i], "0x", 16);
        }
    }
    free(buf);
    free(nread);
    return r;
}

// Разбор шестнадцатеричной строки (с префиксом 0x или без) в число
uint64 diagParseHex(const string& s) {
    uint64 r = 0;
    for (uint i = 0; i < s.length; i++) {
        uint c = s[i];
        uint d = 99;
        if (c >= 48 && c <= 57)
            d = c - 48;
        else if (c >= 97 && c <= 102)
            d = c - 87;
        else if (c >= 65 && c <= 70)
            d = c - 55;
        if (d == 99)
            continue;
        r = (r << 4) | d;
    }
    return r;
}
