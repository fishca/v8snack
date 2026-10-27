## `snegopat/engine/addins.as`

- Язык: **AngelScript**, строк: **311**, объявлений: **33**
- Назначение: addins.as
- Состав: class — 5, func — 28

- `bool initAddins()`
- `class Addin` — Класс, представляющий загруженный аддин. Загрузчик аддинов должен возвращать наследника от этого класса

### внутри `Addin`

- `string& get_uniqueName()`
- `string& get_displayName()`
- `string& get_fullPath()`
- `Variant invokeMacros(const string& macros)` — выполнить макрос
- `void invokeMenu(uint idx)` — Выполнить команду меню
- `IUnknown&& object()` — получить Dispatch объект

### верхний уровень

- `class AddinLoader` — Интерфейс загрузчика аддинов. Остальные загрузчики должны наследоваться от него

### внутри `AddinLoader`

- `string proto()`
- `Addin&& load(const string& uri)`
- `bool run(Addin&& addin)`
- `bool canUnload(Addin&& addin)`
- `bool unload(Addin&& addin)`
- `string nameOfLoadCommand()`
- `string selectLoadURI()`

### верхний уровень

- `class AddinGroup`

### внутри `AddinGroup`

- `AddinGroup&& addGroup(const string& nameOfChild)`
- `void addAddin(Addin&& addin)`
- `uint get_addinsCount()`
- `Addin&& addin(uint idx)`
- `void removeGroup(AddinGroup&& g)`

### верхний уровень

- `class AddinMgr`

### внутри `AddinMgr`

- `uint get_count()`
- `Addin&& loadAddin(const string& uri, AddinGroup&& group)`
- `void remove(Addin&& addin, const string& uniqueName)`
- `bool unloadAddin(Addin&& addin)`
- `Addin&& selectAndLoad(const string& loaderCommand, AddinGroup&& group)` — [helpstring("Выбрать и загрузить аддин. Передавать часть команды загрузчика после '|'")]
- `bool isAddinUnloadable(Addin&& addin)` — [helpstring("Можно ли выгружать аддин")]
- `void enterInAddinRun(Addin&& addin)`
- `void leaveAddinRun(Addin&& addin)`

### верхний уровень

- `class BuiltinAddin : Addin`

### внутри `BuiltinAddin`

- `void removeAddinFromArray(array<Addin&&>&& arr, Addin&& a)`
