## `snegopat/engine/com_designer.as`

- Язык: **AngelScript**, строк: **610**, объявлений: **70**
- Назначение: Объект Designer, который подключается к аддинам и служит корнем для SnegAPI. Его публичные свойства и методы доступны аддинам. Отдаётся им в виде IDispatch. Маршрутизация между IDispatch и AngelScript - осуществляется автоматически
- Состав: class — 8, func — 62

- `class Designer` — Чистый и красивый интерфейс

### внутри `Designer`

- `Variant v8New(const string& name, array<Variant>& params)` — Создать объект 1С
- `void Message(const string& text, Variant markerOrPict = mNone, IDispatch&& clickHandler = null, Variant handlerArg=0)` — Сообщить
- `MsgBoxAnswers MessageBox(const string& text, MsgBoxStyles style = mbOK, const string& caption = "", uint timeout = 0)` — Предупреждение
- `Variant globalContext(const string& uuidStr)` — Получить указанный глобальный контекст
- `void designInternalForm(const string path = "")`
- `void designScriptForm(const string& path = "")`
- `Variant loadFormForScript(SelfScript&& selfScript, string formName = "", IDispatch&& eventHandler = null, const string& eventPrefix="")`
- `Variant loadScriptForm(string path, IDispatch&& eventHandler, const string& eventPrefix="")`
- `Variant loadScriptFormEpf(string path, string formName, IDispatch&& eventHandler, const string& eventPrefix = "")`
- `V8Value&& toV8Value(Variant varValue)`
- `ICmdUpdateResult&& getCmdState(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = -1)` — [helpstring("Получить состояние команды")]
- `bool sendCommand(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = 0)` — [helpstring("Выполнить команду")]
- `int_ptr createTimer(uint msec, IDispatch&& pDisp, const string& member = "")`
- `string takeScriptError()` — Очередная необработанная ошибка скрипта (пустая строка — очередь пуста); для диагностики
- `void killTimer(uint timerID)`
- `void saveProfile()`
- `void setCmdTrace(bool on)` — Трассировка команд платформы: каждая команда главного окна выводится в окно сообщений («Команда: группа … номер …»). Нужна, чтобы узнать id команд меню для sendCommand
- `void snPrint(const string& msg)`
- `void snLog(const string& msg)`
- `EditorsManager&& get_editorsManager()`
- `IUnknown&& _createValue(const string& name, ValueParamsVector&& params = ValueParamsVector())` — Это из скриптов не вызвать
- `string loadResourceString(const string& moduleName, const string& stringID)`
- `Variant builtin_require(string addinFile)`
- `void fillTypeNames()`
- `IDispatch&& _me()`
- `uint processId()` — PID процесса 1С
- `int hideLogWindows()` — спрятать окна логов ошибок своего процесса («Core.As» — x64, «Snegopat log window» — x32). Ошибки не теряются: они в файлах logs\, errorlog.js выводит их в окно сообщений.
- `SqliteBase&& sqliteOpen(const string& baseName = ":memory:", int flags = -1)` — Открыть базу данных sqlite
- `void _beforeExitApp(ExitAppCancel&& cancel)`
- `void _onExitApp()`
- `void _fireAddinChanges(Addin&& a, bool load)`
- `void _onIdle()`
- `void _fireCreateTextWindow(TextWnd&& wnd)`
- `void _reinitGlobalContextes()`
- `int_ptr com_export_count()`
- `void setTrapOnComExportCount()`
- `void initConvertContextToVariant()`
- `uint IGlobcalContext_QI(IUnknown& pThis, const Guid& g, IUnknown&&& res)`
- `void convertContextToVariant(IContext&& ctx, Variant& var)`

### верхний уровень

- `class TimerHandler` — обработчик событий таймера

### внутри `TimerHandler`

- `void handler(int_ptr timerID)`

### верхний уровень

- `class MessageClickHandler`

### внутри `MessageClickHandler`

- `void process()`

### верхний уровень

- `class MessageClickNotifier`

### внутри `MessageClickNotifier`

- `void onEvent(const Guid&in eventID, long val, IUnknown& obj)`

### верхний уровень

- `class SaveModulesNotifier`

### внутри `SaveModulesNotifier`

- `void onEvent(const Guid&in eventID, long val, IUnknown& obj)`

### верхний уровень

- `class ISelectFileData`

### внутри `ISelectFileData`

- `SelectFileMode get_mode()`
- `uint get_flags()`
- `uint get_filtersCount()`
- `string filterDescr(uint idx)`
- `string filterVal(uint idx)`
- `int get_filter()`
- `void set_filter(int idx)`
- `string get_defExt()`
- `string get_initialFileName()`
- `string get_folder()`
- `void set_folder(string fld)`
- `string get_title()`
- `void set_title(string ttl)`
- `uint get_filesCount()`
- `string selectedFile(uint idx)`
- `void addSelectedFile(string fileName)`
- `void VectorV8StringPushBack(Vector& v, const v8string&in str)`

### верхний уровень

- `class EnvironmentData`

### внутри `EnvironmentData`

- `bool GetFileNameTrap(IBkEndUI& pBkEndUI, SelectFileName& data, size_t timeout, HWND parent)`

### верхний уровень

- `class StarterBroadcast`

### внутри `StarterBroadcast`

- `void onStarterNotify(const string& msg)`
