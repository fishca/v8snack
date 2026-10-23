/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Обёртка для работы с деревом настроек 1С из аддинов.
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

// Хранилища настроек. Куда реально попадает значение (проверено на 8.3.27 записью новых ключей + flush + перезапуск, 2026-10-12):
//   pflSeanse       — только на время сеанса, не сохраняется
//   pflComputer     — файл %APPDATA%\1C\1cv8\1cv8.pfl: компьютер + пользователь Windows, общий для всех Конфигураторов и баз
//   pflBase         — НЕ в файле: хранится в самой информационной базе (SQL), пережило перезапуск; одно на базу для всех компьютеров
//   pflBaseUser     — НЕ в файле: в информационной базе, на пользователя базы
//   pflCompBase     — файл %APPDATA%\1C\1cv8\<id базы>\1cv8.pfl: компьютер + база — настройки, СВОИ У КАЖДОГО Конфигуратора/базы (протокол отладки, пути)
//   pflCompBaseUser — файл %APPDATA%\1C\1cv8\<id базы>\<id>\1cv8.pfl: компьютер + база + пользователь (точки останова, закладки)
//   pflSnegopat     — свои файлы data\Snegopat\settings\*.set (settings_store.as): общие для всех Конфигураторов и баз этой установки Снегопата; платформенный профиль не участвует
// Для настроек, которые должны быть своими у каждой базы на этом компьютере, использовать pflCompBase; общие для всех баз — pflSnegopat или pflComputer.
enum ProfileStoreType {
    pflSeanse = 0,
    pflComputer = 1,
    pflBase = 2,
    pflBaseUser = 3,
    pflCompBase = 4,
    pflCompBaseUser = 5,
    pflSnegopat = 6
};

const Guid& guidOfStore(ProfileStoreType pfs) {
    switch (pfs) {
    case pflComputer:
        return gpflComputer;
    case pflBase:
        return gpflBase;
    case pflBaseUser:
        return gpflBaseUser;
    case pflCompBase:
        return gpflCompBase;
    case pflCompBaseUser:
        return gpflCompBaseUser;
    case pflSnegopat:
        return gpflSnegopat;
    }
    return IID_NULL;
}

// Счётчик изменений профиля через обёртку: profile_autosave пишет профиль на диск только когда он растёт (и спустя паузу после последнего изменения)
uint profileChangeCounter = 0;
// Любое изменение профиля через обёртку: счётчик + запись в журнал (категория prof) — кто и что пишет; нужно, чтобы находить источники лишних записей профиля
// (каждая запись заставляет profile_autosave делать flush платформы, а он блокирует главный поток на секунды).
void profileTouched(const string& what) {
    profileChangeCounter++;
    if (diagTraceOn("prof"))
        dbgLog("профиль изменён: " + what);
}

class ProfileStore {
    protected IProfileFolder&& folder;
    protected string prefix;        // путь этой папки от корня профиля («» — корень): по нему значения направляются в свои файлы настроек (settings_store.as)
    ProfileStore(IProfileFolder&& f, const string& pfx = "") {
        &&folder = f;
        prefix = pfx;
    }
    string fullPath(const string& rel) {
        return prefix.isEmpty() ? rel : prefix + "/" + rel;
    }
    // Значение лежит в своих файлах настроек
    bool ownHas(const string& full) {
        return settingsHas(full);
    }
    //[propget, helpstring("Название раздела")]
    string get_name() {
        if (folder is null)
            return prefix;
        return folder.getName();
    }
    //[helpstring("Создать значение")]
    void createValue(const string& path2value, const Variant& defaultValue, ProfileStoreType storeType) {
        string full = fullPath(path2value);
        if (storeType == pflSnegopat) {
            // Свои файлы настроек: платформенный профиль не трогаем (и не помечаем изменённым — не будет остановок на сохранение)
            if (!settingsHas(full)) {
                Value dv;
                var2val(defaultValue, dv);
                v8string text;
                dv.toString(text);
                string internalText = text;
                settingsPut(full, internalText);
            }
            return;
        }
        if (folder is null)
            return;
        v8string strPath = path2value;
        Value val, existVal;
        if (folder.getValue(strPath, existVal)) {
            folder.deleteValue(strPath);
            val = existVal;
        } else
            var2val(defaultValue, val);
        folder.createAndSetValue(strPath, guidOfStore(storeType), val);
        profileTouched("createValue " + path2value);
    }
    //[helpstring("Получить значение")]
    Variant getValue(const string& path2value) {
        Variant res;
        string full = fullPath(path2value);
        if (ownHas(full)) {
            string text;
            if (settingsGetInternal(full, text)) {
                v8string vs = text;
                Value v;
                valueFromString(vs, v);
                val2var(v, res);
            }
            return res;
        }
        if (folder is null)
            return res;
        Value val;
        if (folder.getValue(path2value, val))
            val2var(val, res);
        return res;
    }
    //[helpstring("Установить значение")]
    void setValue(const string& path2value, Variant value) {
        string full = fullPath(path2value);
        Value val;
        var2val(value, val);
        if (ownHas(full)) {
            v8string text;
            val.toString(text);
            string internalText = text;
            settingsPut(full, internalText);
            return;
        }
        if (folder is null)
            return;
        folder.setValue(path2value, val);
        profileTouched("setValue " + path2value);
    }
    //[propget, helpstring("Счётчик изменений профиля через обёртку (общий для всех разделов)")]
    uint get_changeCount() {
        return profileChangeCounter;
    }
    // Имена значений этой папки: сначала свои (файловый механизм), затем платформенные, которых среди своих нет
    protected array<string>&& valueNames() {
        array<string> names;
        array<string> vs, fs;
        settingsChildren(prefix, vs, fs);
        for (uint i = 0; i < vs.length; i++)
            names.insertLast(vs[i]);
        if (folder !is null) {
            for (uint i = 0, n = folder.valuesCount(); i < n; i++) {
                v8string nm;
                folder.getValueKeyAt(i, nm);
                string sn = nm;
                bool dup = false;
                for (uint k = 0; k < names.length; k++)
                    if (diagLower(names[k]) == diagLower(sn))
                        dup = true;
                if (!dup)
                    names.insertLast(sn);
            }
        }
        return names;
    }
    protected array<string>&& folderNames() {
        array<string> names;
        array<string> vs, fs;
        settingsChildren(prefix, vs, fs);
        for (uint i = 0; i < fs.length; i++)
            names.insertLast(fs[i]);
        if (folder !is null) {
            for (uint i = 0, n = folder.foldersCount(); i < n; i++) {
                IProfileFolder&& sub;
                folder.getFolderAt(sub, i);
                if (sub is null)
                    continue;
                string sn = sub.getName();
                bool dup = false;
                for (uint k = 0; k < names.length; k++)
                    if (diagLower(names[k]) == diagLower(sn))
                        dup = true;
                if (!dup)
                    names.insertLast(sn);
            }
        }
        return names;
    }
    //[propget, helpstring("Количество значений")]
    uint get_valuesCount() {
        return valueNames().length;
    }
    //[helpstring("Название значения по номеру")]
    string valueName(uint idx) {
        array<string>&& names = valueNames();
        return idx < names.length ? names[idx] : string();
    }
    //[helpstring("Получить значение по номеру")]
    Variant getValueAt(uint idx) {
        Variant res;
        array<string>&& names = valueNames();
        if (idx < names.length)
            return getValue(names[idx]);
        return res;
    }
    //[helpstring("Установить значение по номеру")]
    void setValueAt(uint idx, Variant value) {
        array<string>&& names = valueNames();
        if (idx < names.length)
            setValue(names[idx], value);
    }
    //[helpstring("Удалить значение по имени")]
    void deleteValue(const string&  name) {
        string full = fullPath(name);
        if (settingsHas(full))
            settingsRemove(full);
        if (folder is null)
            return;
        folder.deleteValue(name);
        profileTouched("deleteValue " + name);
    }
    //[helpstring("Удалить значение по номеру")]
    void deleteValueAt(uint idx) {
        array<string>&& names = valueNames();
        if (idx < names.length)
            deleteValue(names[idx]);
    }
    //[helpstring("Создать раздел")]
    void createFolder(const string&  folderName, ProfileStoreType storeType) {
        if (storeType == pflSnegopat)
            return;                 // в своих файлах папки существуют неявно — по ключам
        if (folder is null)
            return;
        folder.createFolder(folderName, guidOfStore(storeType));
        profileTouched("createFolder " + folderName);
    }
    //[propget, helpstring("Количество разделов")]
    uint get_foldersCount() {
        return folderNames().length;
    }
    //[helpstring("Получить раздел по имени")]
    ProfileStore&& getFolder(const string&  path2folder) {
        string full = fullPath(path2folder);
        IProfileFolder&& ptr;
        if (folder !is null)
            folder.getFolder(ptr, path2folder);
        if (ptr is null) {
            array<string> vs, fs;
            settingsChildren(full, vs, fs);
            if (vs.length == 0 && fs.length == 0)
                return null;
        }
        return ProfileStore(ptr, full);
    }
    //[helpstring("Получить раздел по номеру")]
    ProfileStore&& getFolderAt(uint idx) {
        array<string>&& names = folderNames();
        if (idx < names.length)
            return getFolder(names[idx]);
        return null;
    }
    //[helpstring("Удалить раздел по имени")]
    void deleteFolder(const string&  name) {
        array<string> vs, fs;
        string full = fullPath(name);
        settingsChildren(full, vs, fs);
        for (uint i = 0; i < vs.length; i++)
            settingsRemove(full + "/" + vs[i]);
        if (folder is null)
            return;
        folder.deleteFolder(name);
        profileTouched("deleteFolder " + name);
    }
    //[helpstring("Удалить раздел по номеру")]
    void deleteFolderAt(uint idx) {
        array<string>&& names = folderNames();
        if (idx < names.length)
            deleteFolder(names[idx]);
    }
};
