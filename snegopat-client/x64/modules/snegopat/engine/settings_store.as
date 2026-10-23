/*
 * Файловый механизм настроек Снегопата — единственное хранилище pflSnegopat (прежний файл data\Snegopat\snegopat.pfl вырезан полностью, с 1.6.0).
 *
 * Настройки лежат в небольших файлах data\Snegopat\settings\<верхняя папка>.set: по одному на «раздел» (Snegopat, ExtFiles, BookMarkers, …),
 * запись атомарная (временный файл + замена), перед записью файл перечитывается и накладываются только наши изменённые ключи (слияние),
 * чужие изменения подхватываются опросом файла-метки _version раз в ~1,5 с. Платформенный профиль не участвует и остановок на сохранение не вызывает.
 *
 * Начальные настройки. Ключи, которых нет в файле раздела (первый запуск Конфигуратора, чистая установка, файл удалён или создан неполным),
 * добавляются из data\Snegopat\defaults\<раздел>.set — это «семя» владельца (автозагрузка аддинов, горячие клавиши, макросы, настройки аддинов);
 * оно едет клиентам вместе с поставкой. Существующие в файле ключи семя не трогает. Семя накладывается при первом обращении к разделу в сеансе
 * и уходит на диск обычной записью. Готовое семя собирает tools/pfl2set.py из мастер-профиля.
 *
 * Значения хранятся во «внутренней строке» 1С (то же, что ЗначениеВСтрокуВнутр): {"B",1}, {"N",5}, {"S","текст"}, {"#",…} (таблицы).
 *
 * Формат файла .set (UTF-8): строки «ключ<TAB>значение», в значении \ → \, перевод строки → \n, \r → \r, TAB → \t.
 */

string settingsVersionSeen;             // последний прочитанный токен _version
string settingsVersionMine;             // токен, который записали мы (чтобы не перечитывать свои же изменения)
uint settingsDirtySince = 0;            // когда появилось первое несохранённое изменение (0 — нет)
uint settingsLastPoll = 0;
uint settingsExternalChanges = 0;       // сколько раз подхватывали изменения других Конфигураторов
uint settingsWrites = 0;                // сколько записей на диск сделано
uint settingsSeeded = 0;                // сколько ключей добавлено из начальных настроек
bool settingsExitHooked = false;
bool settingsDirReady = false;

string settingsDir() {
    return pathes._data + "settings/";
}

string settingsDefaultsDir() {
    return pathes._data + "defaults/";
}

string settingsEsc(const string& s) {
    string r = s;
    r = r.replace("\\", "\\\\");
    r = r.replace("\n", "\\n");
    r = r.replace("\r", "\\r");
    r = r.replace("\t", "\\t");
    return r;
}

string settingsUnesc(const string& s) {
    string r;
    uint n = s.length;
    for (uint i = 0; i < n; i++) {
        wchar_t c = s[i];
        if (c == 92 && i + 1 < n) {
            i++;
            wchar_t d = s[i];
            if (d == 110)
                d = 10;
            else if (d == 114)
                d = 13;
            else if (d == 116)
                d = 9;
            r.insert(r.length, d);
        } else
            r.insert(r.length, c);
    }
    return r;
}

// Имя файла по первому сегменту ключа; запрещённые в имени файла символы заменяются на «_»
string settingsFileName(const string& key) {
    uint slash = key.find("/");
    string top = (slash == badStrIdx) ? string("_root") : key.substr(0, slash);
    string r;
    for (uint i = 0; i < top.length; i++) {
        wchar_t c = top[i];
        if (c == 92 || c == 47 || c == 58 || c == 42 || c == 63 || c == 34 || c == 60 || c == 62 || c == 124)
            c = 95;
        r.insert(r.length, c);
    }
    return diagLower(r);
}

bool settingsWriteFile(const string& path, const string& text) {
    string tmp = path + ".tmp";
    HANDLE h = CreateFile(tmp.cstr, 0x40000000, 0, 0, 2, 0x80, 0);
    if (h == 0 || h + 1 == 0)
        return false;
    int len = WideCharToMultiByteNull(65001, 0, text.cstr, text.length, 0, 0, 0, 0);
    int_ptr buf = malloc(len + 4);
    WideCharToMultiByteNull(65001, 0, text.cstr, text.length, buf, len, 0, 0);
    fileWriteBytes(h, buf, len);
    free(buf);
    CloseHandle(h);
    if (MoveFileEx(tmp.cstr, path.cstr, 1) != 0)        // MOVEFILE_REPLACE_EXISTING: атомарная замена
        return true;
    DeleteFile(path.cstr);
    return MoveFile(tmp.cstr, path.cstr) != 0;
}

class SettingsFile {
    string name;
    array<string> keys;         // ключи как их задавали (путь через /)
    array<string> lkeys;        // они же в нижнем регистре (поиск без учёта регистра)
    array<string> vals;         // значения — внутренние строки 1С
    array<string> pendKeys;     // локальные изменения, ещё не записанные на диск: ключ (нижний регистр)
    array<string> pendOrig;     //   ключ как задан
    array<string> pendVals;     //   новое значение
    array<bool> pendDel;        //   true — ключ удалить

    SettingsFile(const string& nm) {
        name = nm;
        load();
    }

    string path() {
        return settingsDir() + name + ".set";
    }

    int find(const string& lk) {
        for (uint i = 0; i < lkeys.length; i++)
            if (lkeys[i] == lk)
                return int(i);
        return -1;
    }

    void rawSet(const string& key, const string& lk, const string& val) {
        int i = find(lk);
        if (i >= 0)
            vals[i] = val;
        else {
            keys.insertLast(key);
            lkeys.insertLast(lk);
            vals.insertLast(val);
        }
    }

    void rawDel(const string& lk) {
        int i = find(lk);
        if (i >= 0) {
            keys.removeAt(i);
            lkeys.removeAt(i);
            vals.removeAt(i);
        }
    }

    // Прочитать файл с диска, затем наложить локальные несохранённые изменения
    void load() {
        keys.resize(0);
        lkeys.resize(0);
        vals.resize(0);
        string text = readUtf8File(path());
        if (!text.isEmpty()) {
            array<string>&& lines = text.split("\n");
            for (uint i = 0; i < lines.length; i++) {
                string ln = lines[i].trim("\r");
                if (ln.isEmpty())
                    continue;
                uint tab = ln.find("\t");
                if (tab == badStrIdx)
                    continue;
                string k = ln.substr(0, tab);
                rawSet(k, diagLower(k), settingsUnesc(ln.substr(tab + 1)));
            }
        }
        for (uint p = 0; p < pendKeys.length; p++) {
            if (pendDel[p])
                rawDel(pendKeys[p]);
            else
                rawSet(pendOrig[p], pendKeys[p], pendVals[p]);
        }
    }

    // Добавить ключи из начальных настроек владельца (data\Snegopat\defaults\<раздел>.set), которых в разделе нет; они уйдут на диск первой же записью.
    // Возвращает число добавленных ключей
    uint seed() {
        string text = readUtf8File(settingsDefaultsDir() + name + ".set");
        if (text.isEmpty())
            return 0;
        uint added = 0;
        array<string>&& lines = text.split("\n");
        for (uint i = 0; i < lines.length; i++) {
            string ln = lines[i].trim("\r");
            if (ln.isEmpty())
                continue;
            uint tab = ln.find("\t");
            if (tab == badStrIdx)
                continue;
            string k = ln.substr(0, tab);
            string lk = diagLower(k);
            if (find(lk) >= 0)
                continue;
            setLocal(k, lk, settingsUnesc(ln.substr(tab + 1)), false);
            added++;
        }
        return added;
    }

    void setLocal(const string& key, const string& lk, const string& val, bool del) {
        if (del)
            rawDel(lk);
        else
            rawSet(key, lk, val);
        for (uint p = 0; p < pendKeys.length; p++) {
            if (pendKeys[p] == lk) {
                pendVals[p] = val;
                pendDel[p] = del;
                return;
            }
        }
        pendKeys.insertLast(lk);
        pendOrig.insertLast(key);
        pendVals.insertLast(val);
        pendDel.insertLast(del);
    }

    bool hasPending() {
        return pendKeys.length > 0;
    }

    // Слияние и запись: файл перечитывается как он сейчас на диске, поверх накладываются наши изменённые ключи, результат пишется атомарно
    bool save() {
        if (!settingsDirReady) {
            CreateDirectory(settingsDir().cstr);
            settingsDirReady = true;
        }
        load();
        string text;
        for (uint i = 0; i < keys.length; i++)
            text += keys[i] + "\t" + settingsEsc(vals[i]) + "\n";
        if (!settingsWriteFile(path(), text))
            return false;
        pendKeys.resize(0);
        pendOrig.resize(0);
        pendVals.resize(0);
        pendDel.resize(0);
        settingsWrites++;
        return true;
    }
};

array<SettingsFile&&> settingsFileList;

void settingsMarkDirty() {
    if (settingsDirtySince == 0)
        settingsDirtySince = GetTickCount();
    if (!settingsExitHooked) {
        settingsExitHooked = true;
        exitAppHandlers.insertLast(PVV(settingsFlush));
    }
}

SettingsFile&& settingsFileByName(const string& nm) {
    for (uint i = 0; i < settingsFileList.length; i++)
        if (settingsFileList[i].name == nm)
            return settingsFileList[i];
    SettingsFile&& f = SettingsFile(nm);
    settingsFileList.insertLast(f);
    uint added = f.seed();
    if (added > 0) {
        settingsSeeded += added;
        diagAlways("settings", "раздел «" + nm + "»: добавлено ключей из начальных настроек: " + added);
        settingsMarkDirty();
    }
    return f;
}

SettingsFile&& settingsFileFor(const string& key) {
    return settingsFileByName(settingsFileName(key));
}

bool settingsHas(const string& key) {
    return settingsFileFor(key).find(diagLower(key)) >= 0;
}

bool settingsGetInternal(const string& key, string& result) {
    SettingsFile&& f = settingsFileFor(key);
    int i = f.find(diagLower(key));
    if (i < 0)
        return false;
    result = f.vals[i];
    return true;
}

void settingsPut(const string& key, const string& internal) {
    settingsFileFor(key).setLocal(key, diagLower(key), internal, false);
    settingsMarkDirty();
}

void settingsRemove(const string& key) {
    settingsFileFor(key).setLocal(key, diagLower(key), "", true);
    settingsMarkDirty();
}

// Прямые значения (leaf) и вложенные папки внутри prefix («» — корень). Для корня перебираются все файлы каталога settings.
void settingsChildren(const string& prefix, array<string>& values, array<string>& folders) {
    array<string> files;
    if (prefix.isEmpty()) {
        array<string> names = diagListDir(settingsDir() + "*.set", false);
        for (uint i = 0; i < names.length; i++)
            files.insertLast(names[i].substr(0, names[i].length - 4));
        array<string> defNames = diagListDir(settingsDefaultsDir() + "*.set", false);      // разделы, которых ещё нет на диске, но есть начальные настройки
        for (uint i = 0; i < defNames.length; i++) {
            string dn = defNames[i].substr(0, defNames[i].length - 4);
            bool have = false;
            for (uint k = 0; k < files.length; k++)
                if (files[k] == dn)
                    have = true;
            if (!have)
                files.insertLast(dn);
        }
    } else
        files.insertLast(settingsFileName(prefix + "/x"));      // файл определяется первым сегментом пути; у «ZZTest» без слэша это не _root
    string lp = diagLower(prefix);
    for (uint fi = 0; fi < files.length; fi++) {
        SettingsFile&& f = settingsFileByName(files[fi]);
        for (uint i = 0; i < f.keys.length; i++) {
            string rest;
            if (prefix.isEmpty())
                rest = f.keys[i];
            else if (f.lkeys[i].length > lp.length + 1 && f.lkeys[i].substr(0, lp.length + 1) == lp + "/")
                rest = f.keys[i].substr(prefix.length + 1);
            else
                continue;
            uint slash = rest.find("/");
            if (slash == badStrIdx) {
                values.insertLast(rest);
            } else {
                string fn = rest.substr(0, slash);
                bool have = false;
                for (uint k = 0; k < folders.length; k++)
                    if (diagLower(folders[k]) == diagLower(fn))
                        have = true;
                if (!have)
                    folders.insertLast(fn);
            }
        }
    }
}

// Записать накопленные локальные изменения на диск (слияние с тем, что уже лежит в файле)
void settingsFlush() {
    if (settingsDirtySince == 0)
        return;
    bool allOk = true, anyOk = false;
    for (uint i = 0; i < settingsFileList.length; i++) {
        if (settingsFileList[i].hasPending()) {
            if (settingsFileList[i].save())
                anyOk = true;
            else
                allOk = false;
        }
    }
    settingsDirtySince = allOk ? 0 : GetTickCount();         // при ошибке записи — повтор через паузу
    if (anyOk) {
        settingsVersionMine = "" + GetTickCount() + "-" + GetCurrentThreadId() + "-" + settingsWrites;
        settingsVersionSeen = settingsVersionMine;
        string vp = settingsDir() + "_version";
        settingsWriteFile(vp, settingsVersionMine);
    }
}

// Опрос файла-метки: чужая запись → перечитываем открытые файлы (свои несохранённые изменения накладываются сверху)
void settingsPoll() {
    uint now = GetTickCount();
    if (now - settingsLastPoll < 1500)
        return;
    settingsLastPoll = now;
    string tok = readUtf8File(settingsDir() + "_version").trim(" \r\n");
    if (tok == settingsVersionSeen)
        return;
    settingsVersionSeen = tok;
    if (tok == settingsVersionMine)
        return;
    for (uint i = 0; i < settingsFileList.length; i++)
        settingsFileList[i].load();
    settingsExternalChanges++;
    diagAlways("settings", "настройки изменены другим Конфигуратором — перечитаны (" + settingsFileList.length + " файлов)");
}

// Вызывается скриптом по таймеру (errorlog.js, раз в ~0,4 с)
void settingsTick() {
    if (settingsDirtySince != 0 && GetTickCount() - settingsDirtySince >= 500)
        settingsFlush();
    settingsPoll();
}

string settingsInfo() {
    uint n = 0;
    for (uint i = 0; i < settingsFileList.length; i++)
        n += settingsFileList[i].keys.length;
    return "mode=file; dir=" + settingsDir() + "; files=" + settingsFileList.length + "; keys=" + n + "; writes=" + settingsWrites
        + "; seeded=" + settingsSeeded + "; external=" + settingsExternalChanges + "; dirty=" + (settingsDirtySince != 0 ? "yes" : "no");
}
