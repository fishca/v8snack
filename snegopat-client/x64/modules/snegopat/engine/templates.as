/*
 * Автоподключение файла шаблонов текста 1С, поставляемого со Снегопатом (x64/templates/ТсРазработкаШаблоны1с8.st).
 * При запуске Конфигуратора: если файл есть и в списке файлов шаблонов 1С (профиль 1С, раздел TxtEdt, ключ AutoPlacementFilesRU1)
 * его ещё нет — дописывается. Файл с таким же именем из другого места считается уже подключённым (шаблоны не дублируются).
 * Одновременно с подключением (один раз, пока файла в списке нет — дальше настройки остаются за пользователем):
 *   - отключаются стандартные шаблоны платформы (Настройка шаблонов → «Использовать стандартные шаблоны»: TxtEdt/AutoSearchTemplateFiles=Ложь);
 *   - Сервис → Параметры → Модули → Редактировать → «Автозамена» = «Включить с подсказкой» (ModuleTextEditor/AutoPlacement=2:
 *     0 «Отключить», 1 «Включить», 2 «Включить с подсказкой», 3 «Только подсказка»).
 */
#pragma once
#include "../all.h"

const string tplFileName = "ТсРазработкаШаблоны1с8.st";
const string tplProfileKeyDefault = "TxtEdt/AutoPlacementFilesRU1";

Packet pktTemplates("RegisterTemplates", registerTemplateFile, piOnMainEnter);

// Корень Снегопата (на два уровня выше папки модуля: <корень>\modules\snegopat\) с прямыми слэшами и без завершающего
string tplRootDir() {
    string s = myFolder;
    s.replace("\\", "/");
    for (int k = 0; k < 2; k++) {
        while (s.length > 0 && s[s.length - 1] == '/')
            s.setLength(s.length - 1);
        while (s.length > 0 && s[s.length - 1] != '/')
            s.setLength(s.length - 1);
    }
    while (s.length > 0 && s[s.length - 1] == '/')
        s.setLength(s.length - 1);
    return s;
}

// Записать значение в профиль платформы (нет ключа — создать в базовом хранилище, как для списка файлов шаблонов)
void tplSetPlatformValue(IProfileFolder&& pf, const string& key, const Value& val) {
    if (!pf.setValue(key, val))
        pf.createAndSetValue(key, gpflBase, val);
}

// Настройки, которые выставляются вместе с подключением нашего файла шаблонов
void tplApplyPlatformOptions(IProfileFolder&& pf) {
    Value noStd;
    noStd = false;
    tplSetPlatformValue(pf, "TxtEdt/AutoSearchTemplateFiles", noStd);
    Value autoRepl;
    autoRepl = 2;
    tplSetPlatformValue(pf, "ModuleTextEditor/AutoPlacement", autoRepl);
    diagAlways("templates", "стандартные шаблоны отключены, Автозамена = «Включить с подсказкой»");
}

bool registerTemplateFile() {
    string root = tplRootDir();
    string path = root + "/templates/" + tplFileName;
    if (!diagFileExists(path)) {
        diag("templates", "файл шаблонов не найден: " + path);
        return true;
    }
    // для проверки без вмешательства в рабочие настройки: logs/diag.ini «templates.key=TxtEdt/AutoPlacementFilesRU9»
    diagReload();
    string tplProfileKey = diagGet("templates.key");
    if (tplProfileKey.isEmpty())
        tplProfileKey = tplProfileKeyDefault;
    IProfileFolder&& pf = getProfileService();
    v8string cur;
    pf.getString(tplProfileKey, cur);
    string text = cur;
    string low = diagLower(text);
    if (low.find(diagLower(tplFileName)) != badStrIdx) {
        diagAlways("templates", "файл шаблонов уже подключён в 1С: " + tplFileName);
        return true;
    }
    string entry = "{\"file://" + path + "\",0}";
    string t = text.trim(" \r\n\t");
    string res;
    // «{N,» — число записей; пустой/неразобранный список — начинаем заново
    uint i = 1;
    uint n = 0;
    while (t.length > i && t[i] >= '0' && t[i] <= '9') {
        n = n * 10 + (t[i] - '0');
        i++;
    }
    if (t.length < 3 || t[0] != '{' || i == 1 || t[i] != ',' || t[t.length - 1] != '}') {
        res = "{1,\n" + entry + "\n}";
    } else {
        string body = t.substr(i, t.length - i - 1);
        body = body.rtrim(" \r\n\t");
        res = "{" + (n + 1) + body + ",\n" + entry + "\n}";
    }
    bool ok = pf.setValue(tplProfileKey, Value(v8string(res)));
    if (!ok)
        pf.createAndSetValue(tplProfileKey, gpflBase, Value(v8string(res)));
    // flush и уведомление об изменении настроек здесь не вызываем: на старте (piOnMainEnter) это подвешивало загрузку Конфигуратора;
    // значение попадает в профиль 1С и сохраняется платформой при выходе, шаблоны подхватываются при ближайшем чтении настроек
    diagAlways("templates", "файл шаблонов подключён в 1С: " + path + " (было записей: " + n + ")");
    if (diagGet("templates.key").isEmpty())     // в режиме проверки (templates.key=…) рабочие настройки не трогаем
        tplApplyPlatformOptions(pf);
    return true;
}
