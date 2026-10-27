## `snegopat/engine/dllloader.as`

- Язык: **AngelScript**, строк: **145**, объявлений: **17**
- Назначение: Загрузчик аддинов-длл /
- Состав: class — 2, func — 10, funcdef — 5

- `funcdef int_ptr GetAddinInfo(int_ptr&, int_ptr&);`
- `funcdef void InitAddin(IDispatch&&);`
- `funcdef int_ptr GetMacroses();`
- `funcdef void InvokeMacros(int_ptr, Variant&);`
- `funcdef void GetObject(IUnknown&&&);`
- `class AddinDll : Addin` — Аддин - длл

### внутри `AddinDll`

- `bool init()`
- `Variant invokeMacros(const string& macros)` — выполнить макрос
- `IUnknown&& object()` — получить Dispatch объект

### верхний уровень

- `class DllLoader : AddinLoader` — Загрузчик скриптов

### внутри `DllLoader`

- `string proto()`
- `bool canUnload(Addin&& addin)`
- `Addin&& load(const string& uri)`
- `bool run(Addin&& addin)`
- `bool unload(Addin&& addin)`
- `string nameOfLoadCommand()`
- `string selectLoadURI()`
