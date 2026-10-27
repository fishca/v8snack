## `snegopat/engine/forms.as`

- Язык: **AngelScript**, строк: **522**, объявлений: **33**
- Назначение: Работа с формами /
- Состав: class — 3, func — 29, funcdef — 1

- `void designScriptForm(const string& path)` — Открытие ssf для конструирования
- `void designInternalForm(const string path)`
- `IStorageRW&& attachStorage(IFileEx&& file)`
- `IFileEx&& openFromStorage(IStorageRW&& stg, const string& name)`
- `IFileEx&& unpackFile(IFileEx&& file)`
- `IFileEx&& findForm(IFile&& form, const string& name)`
- `IFile&& loadFormFile(string path, string formName)`
- `class RuLangSettings` — Объект, который будем передавать как языковые настройки открываемой форме скрипта.

### внутри `RuLangSettings`

- `int_ptr currentLanguage(v8string& str)`
- `int_ptr defaultLanguage(v8string& str)`
- `int mainLang()`
- `void languages(Vector& langs)`
- `bool loadScriptForm(IFile&& file, IDispatch&& eventHandler, const string& eventPrefix, Value& out result, bool epf)`
- `bool loadFormForScript(SelfScript&& selfScript, string formName, IDispatch&& eventHandler, const string& eventPrefix, Value& out result)` — загрузка формы по скрипту и имени формы (если не стандартная)
- `bool loadScriptFormEpf(string path, string formName, IDispatch&& eventHandler, const string& eventPrefix, Value& out result)`
- `bool loadScriptForm(string path, IDispatch&& eventHandler, const string& eventPrefix, Value&out result)`

### верхний уровень

- `class ScriptRuntimeModule` — Реализация интерфейса IRuntimeModule. Объект назначается форме в качестве рантайм-модуля и пробрасывает вызовы событий из формы в объект-обработчик событий.

### внутри `ScriptRuntimeModule`

- `void init(IContext&)`
- `int findProp(const v8string&)` — Свойства не пробрасываем, только методы
- `void setPropVal(size_t, const Value&)`
- `void getPropVal(size_t, Value&)`
- `int findMeth(const v8string& name)` — Поиск номера метода
- `int getParamsCount(size_t meth)` — получение количества параметров. Не все IDispatch поддерживают это. JScript и VBScript - поддерживают.
- `int_ptr context(int_ptr p)` — uint context(IContext&&& ctx) x64: адрес ячейки ответа — int_ptr, иначе обрезался и обнулялась только половина указателя

### верхний уровень

- `class ParamsWrapper` — Обёртка для имитации передачи аргументов в скрипты по-ссылке

### внутри `ParamsWrapper`

- `Variant get_val()`
- `void set_val(Variant& newVal)`
- `uint FileSystem_openURL(IFileSystem& fs, IFile&&&file, const URL& url, int mode)`
- `void checkSaveFormTrapped()`
- `funcdef void FlocalFrame(IFramedView&, size_t, Guid&, uint&);` — Покер
- `void localFrameTrap(IFramedView& v, size_t type, Guid& id, uint& style)`
- `int mdiTypeTrap(IFramedView&)` — Куртизанки
- `void patchMyFormVtable(IFramedView&& view)`
