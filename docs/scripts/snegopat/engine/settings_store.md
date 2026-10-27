## `snegopat/engine/settings_store.as`

- Язык: **AngelScript**, строк: **390**, объявлений: **28**
- Назначение: Файловый механизм настроек Снегопата — единственное хранилище pflSnegopat (прежний файл data\Snegopat\snegopat.pfl вырезан полностью, с 1.6.0). Настройки лежат в небольших файлах data\Snegopat\settings\<верхняя папка>.set: по одному на «раздел» (Snegopat, ExtFiles, BookMarkers, …), запись атомарная (временный файл + замена), перед записью файл перечитывается и накладываются только наши изменённые 
- Состав: class — 1, func — 27

- `string settingsDir()`
- `string settingsDefaultsDir()`
- `string settingsEsc(const string& s)`
- `string settingsUnesc(const string& s)`
- `string settingsFileName(const string& key)` — Имя файла по первому сегменту ключа; запрещённые в имени файла символы заменяются на «_»
- `bool settingsWriteFile(const string& path, const string& text)`
- `class SettingsFile`

### внутри `SettingsFile`

- `string path()`
- `int find(const string& lk)`
- `void rawSet(const string& key, const string& lk, const string& val)`
- `void rawDel(const string& lk)`
- `void load()` — Прочитать файл с диска, затем наложить локальные несохранённые изменения
- `uint seed()` — Добавить ключи из начальных настроек владельца (data\Snegopat\defaults\<раздел>.set), которых в разделе нет; они уйдут на диск первой же записью. Возвращает число добавленных ключей
- `void setLocal(const string& key, const string& lk, const string& val, bool del)`
- `bool hasPending()`
- `bool save()` — Слияние и запись: файл перечитывается как он сейчас на диске, поверх накладываются наши изменённые ключи, результат пишется атомарно
- `void settingsMarkDirty()`
- `SettingsFile&& settingsFileByName(const string& nm)`
- `SettingsFile&& settingsFileFor(const string& key)`
- `bool settingsHas(const string& key)`
- `bool settingsGetInternal(const string& key, string& result)`
- `void settingsPut(const string& key, const string& internal)`
- `void settingsRemove(const string& key)`
- `void settingsChildren(const string& prefix, array<string>& values, array<string>& folders)` — Прямые значения (leaf) и вложенные папки внутри prefix («» — корень). Для корня перебираются все файлы каталога settings.
- `void settingsFlush()` — Записать накопленные локальные изменения на диск (слияние с тем, что уже лежит в файле)
- `void settingsPoll()` — Опрос файла-метки: чужая запись → перечитываем открытые файлы (свои несохранённые изменения накладываются сверху)
- `void settingsTick()` — Вызывается скриптом по таймеру (errorlog.js, раз в ~0,4 с)
- `string settingsInfo()`
