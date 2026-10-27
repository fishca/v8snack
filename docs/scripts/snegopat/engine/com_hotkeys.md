## `snegopat/engine/com_hotkeys.as`

- Язык: **AngelScript**, строк: **131**, объявлений: **20**
- Назначение: Работа с коллекцией хоткеев из скриптов. /
- Состав: class — 3, func — 17

- `class IHotKey` — Хоткей

### внутри `IHotKey`

- `string get_presentation()` — [propget, helpstring("Строковое представление хоткея")]
- `uint get_key()`
- `void set_key(uint newVal)` — [propput, helpstring("Код клавиши")]
- `void setCommand(const string& newAddin, const string& Macros)` — [helpstring("Задать команду хоткея")]
- `uint _setTempHotKey(uint key)`
- `bool handler()`

### верхний уровень

- `class IHotKeys` — Коллекция хоткеев

### внутри `IHotKeys`

- `IHotKey&& item(uint Idx)` — [propget, helpstring("Получить хоткей")]
- `uint get_count()` — [propget, helpstring("Количество хоткеев")]
- `void remove(uint Idx)` — [helpstring("Удалить хоткей")]
- `IHotKey&& add(uint Key, const string& addinName, const string& Macros)` — [helpstring("Добавить хоткей")]
- `void clearAll()` — [helpstring("Очистить все хоткеи")]
- `uint addTemp(uint Key, const string& addinName, const string& Macros)` — Добавить временный хоткей
- `void removeTemp(uint hkID)` — Удалить временный хоткей
- `uint addTempFunction(uint Key, IDispatch&& disp, const string& name = "")`
- `string hotKeyToString(uint code)`

### верхний уровень

- `class TempHotKeyFunction`

### внутри `TempHotKeyFunction`

- `uint assignKey(uint Key, IDispatch&& disp, const string& n)`
- `bool handler()`
