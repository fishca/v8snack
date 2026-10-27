## `snegopat/v8api/profile.v`

- Язык: **v8api (.v)**, строк: **101**, объявлений: **50**
- Назначение: Описание интерфейсов 1С.
- Состав: base — 1, iface — 2, method — 43, meths — 1, virt — 3

- `:iface IProfileFolder {154EF4A0-5965-11d4-9418-008048DA11F9}` — Описание интерфейсов для работы с профайлом

### внутри `IProfileFolder`

- `:virt`
- `v8string getName()` — получить название данного раздела
- `void createValue(const v8string&in path, const Guid&in sourceID, const Value&in value)` — создать значение в профайле
- `void createAndSetValue(const v8string&in path, const Guid&in sourceID, const Value&in value)` — создать и установить значение по ключу
- `bool getULong(const v8string&in path, uint&out value)` — получить значение по ключу
- `bool getLong(const v8string&in path, int&out value)`
- `bool getUInt(const v8string&in path, uint&out value)`
- `bool getInt(const v8string&in path, int&out value)`
- `bool getUShort(const v8string&in path, uint16&out value)`
- `bool getShort(const v8string&in path, int16&out value)`
- `bool getBool(const v8string&in path, bool&out value)`
- `bool getDate(const v8string&in path, Date&out value)`
- `bool getNumeric(const v8string&in path, Numeric&out value)`
- `bool getString(const v8string&in path, v8string&out value)`
- `bool getValue(const v8string&in path, Value&out value)`
- `bool setValue(const v8string&in path, const Value&in value)` — установить значение по ключу
- `void deleteValue(const v8string&in path)` — удалить значение по ключу
- `uint32 valuesCount()` — количество значений данного раздела
- `bool getULongAt(uint32 index, uint32&out value)` — получить значение данного раздела по индексу
- `bool getLongAt(uint32 index, int&out value)`
- `bool getUIntAt(uint32 index, uint32&out value)`
- `bool getIntAt(uint32 index, int&out value)`
- `bool getUShortAt(uint32 index, uint16&out value)`
- `bool getShortAt(uint32 index, int16&out value)`
- `bool getBoolAt(uint32 index, bool&out value)`
- `bool getDateAt(uint32 index, Date&out value)`
- `bool getNumericAt(uint32 index, Numeric&out value)`
- `bool getStringAt(uint32 index, v8string&out value)`
- `bool getValueAt(uint32 index, Value&out value)`
- `bool getValueKeyAt(uint32 index, v8string&out key)` — получить название значения
- `bool setValueAt(uint32 index, const Value&in value)` — установить значение данного раздела по индексу
- `bool deleteValueAt(uint32 index)` — удалить значение по индексу
- `void createFolder(const v8string&in path, const Guid& sourceID)` — создать подраздел
- `void getFolder(IProfileFolder@&out, const v8string&in path)` — получить подраздел по ключу
- `void deleteFolder(const v8string&in path)` — удалить раздел по ключу
- `uint32 foldersCount()` — количество подразделов данного раздела
- `void getFolderAt(IProfileFolder@& out, uint32 index)` — получить подраздел данного раздела по ключу
- `bool deleteFolderAt(uint32 index)` — удалить подраздел данного раздела по индексу
- `:base IProfileFolder`
- `:virt`
- `void attachSource(IProfileSource@ profileSource, const Guid&in)`
- `void detachSource(const Guid&in)` — отсоединить источник данных профайла
- `void open()` — открыть профайл. тут надо поставить перехват: после открытия читаются настройки движка и запускаются пакеты (snegopat.pfl больше не присоединяется)
- `void flush()` — записать все изменения  в профайле
- `void close()` — закрыть

### верхний уровень

- `:iface IProfileSource {9CD0CA00-5BC0-11d4-9418-008048DA11F9}` — Описание интерфейса объекта файлового хранилища профайла

### внутри `IProfileSource`

- `:virt`
- `void init(const v8string&in path)`
- `:meths`
