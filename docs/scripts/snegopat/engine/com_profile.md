## `snegopat/engine/com_profile.as`

- Язык: **AngelScript**, строк: **282**, объявлений: **22**
- Назначение: Обёртка для работы с деревом настроек 1С из аддинов. /
- Состав: class — 1, func — 21

- `Guid& guidOfStore(ProfileStoreType pfs)`
- `void profileTouched(const string& what)` — Любое изменение профиля через обёртку: счётчик + запись в журнал (категория prof) — кто и что пишет; нужно, чтобы находить источники лишних записей профиля (каждая запись заставляет profile_autosave делать flush платформы, а он блокирует главный поток на секунды).
- `class ProfileStore`

### внутри `ProfileStore`

- `string fullPath(const string& rel)`
- `bool ownHas(const string& full)` — Значение лежит в своих файлах настроек
- `string get_name()` — [propget, helpstring("Название раздела")]
- `void createValue(const string& path2value, const Variant& defaultValue, ProfileStoreType storeType)` — [helpstring("Создать значение")]
- `Variant getValue(const string& path2value)` — [helpstring("Получить значение")]
- `void setValue(const string& path2value, Variant value)` — [helpstring("Установить значение")]
- `uint get_changeCount()` — [propget, helpstring("Счётчик изменений профиля через обёртку (общий для всех разделов)")]
- `uint get_valuesCount()` — [propget, helpstring("Количество значений")]
- `string valueName(uint idx)` — [helpstring("Название значения по номеру")]
- `Variant getValueAt(uint idx)` — [helpstring("Получить значение по номеру")]
- `void setValueAt(uint idx, Variant value)` — [helpstring("Установить значение по номеру")]
- `void deleteValue(const string& name)` — [helpstring("Удалить значение по имени")]
- `void deleteValueAt(uint idx)` — [helpstring("Удалить значение по номеру")]
- `void createFolder(const string& folderName, ProfileStoreType storeType)` — [helpstring("Создать раздел")]
- `uint get_foldersCount()` — [propget, helpstring("Количество разделов")]
- `ProfileStore&& getFolder(const string& path2folder)` — [helpstring("Получить раздел по имени")]
- `ProfileStore&& getFolderAt(uint idx)` — [helpstring("Получить раздел по номеру")]
- `void deleteFolder(const string& name)` — [helpstring("Удалить раздел по имени")]
- `void deleteFolderAt(uint idx)` — [helpstring("Удалить раздел по номеру")]
