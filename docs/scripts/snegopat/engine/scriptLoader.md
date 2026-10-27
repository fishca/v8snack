## `snegopat/engine/scriptLoader.as`

- Язык: **AngelScript**, строк: **271**, объявлений: **24**
- Назначение: Загрузчик скриптов /
- Состав: class — 3, func — 21

- `bool initScripts()`
- `class AddinScript : Addin, ScriptSite` — Аддин - скрипт

### внутри `AddinScript`

- `void _connectSelf()`
- `ActiveScript&& _script()`
- `Variant invokeMacros(const string& macros)` — выполнить макрос
- `IUnknown&& object()` — получить Dispatch объект
- `bool onScriptError(const ScriptError& err)` — Вызывается из snegopat.dll при ошибке в скрипте
- `void enter()` — Вызывается из snegopat.dll при входе в выполнение скрипта
- `void leave()` — Вызывается из snegopat.dll при выходе из выполнения скрипта
- `void _unload()`

### верхний уровень

- `class SelfScript`

### внутри `SelfScript`

- `string get_uniqueName()`
- `string get_displayName()`
- `IUnknown&& get_self()`
- `void addNamedItem(const string& name, IDispatch&& unk, bool global = false)`

### верхний уровень

- `class ScriptLoader : AddinLoader` — Загрузчик скриптов

### внутри `ScriptLoader`

- `string proto()`
- `bool canUnload(Addin&& addin)`
- `Addin&& load(const string& uri)`
- `bool run(Addin&& addin)`
- `bool unload(Addin&& addin)`
- `string nameOfLoadCommand()`
- `string selectLoadURI()`
- `void extractTags(array<array<string>&&>& tags, string& sources, uint& firstLineIdx)`
