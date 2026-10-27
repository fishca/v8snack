# COM-обёртки для аддинов: объект snegopat, дизайнер, команды, события, файлы, горячие клавиши, профиль

Документ описывает 7 файлов группы «COM-обёртки SnegAPI» движка Снегопата (папка `snegopat-client/x64/modules/snegopat/engine/`):
`com_snegopat.as`, `com_designer.as`, `com_commands.as`, `com_events.as`, `com_files.as`, `com_hotkeys.as`, `com_profile.as`.

Эти файлы образуют **корень SnegAPI** — ту поверхность, которую движок отдаёт JScript-аддинам (папка `snegopat-client/x64/modules/snegopat/addins/`). Ключевой объект — класс `Designer` (com_designer.as): он создаётся из пакета `pkAddinMgr` (addins.as:5,23 — `initAddins()`, уровень `piOnFirstIdle`) и подключается каждому скрипту как **глобальный именованный элемент `"Designer"`** (scriptLoader.as:37 — `script.addNamedItem("Designer", oneDesigner._me(), true)`; флаг `global=true` означает, что члены объекта доступны аддину как глобальные имена). Поэтому в JScript работают «голые» имена `addins`, `profileRoot`, `snegopat`, `hotkeys`, `events`, `windows`, `metadata`, `v8files`, `develop`, `env`, `cmdService`, `winApi` — это **поля Designer**, начинающиеся с `_` и отдаваемые обёрткой IDispatch как read-only свойства без начального подчёркивания (правила маршалинга сформулированы в шапке com_designer.as:5-26).

Правила маршалинга AngelScript ↔ IDispatch (com_designer.as:5-26, воспроизводятся дословно по смыслу):
- числовые типы передаются как есть; `string` конвертируется в/из `BSTR`; `bool` — в/из `VARIANT_BOOL`; `Variant` — обёртка над `VARIANT`;
- объекты AngelScript автоматически отдаются наружу как `IDispatch`; на входе, если параметр имеет тип объекта AngelScript, из переданного `IDispatch` пытаются извлечь исходный объект AngelScript (при неудаче — ошибка); параметры типов `IDispatch`/`IUnknown` принимаются как есть;
- `array<T>` на выходе превращается в `IDispatch` со свойством `length` и методом `item(idx)`, на вход не принимаются;
- если последний параметр метода имеет тип `array<Variant>`, snegopat.dll сам создаёт массив и наполняет его всеми оставшимися аргументами (вариадичность);
- значения по умолчанию поддерживаются только для чисел, простых строк и перечислений AngelScript; передачу по ссылке лучше считать передачей по значению;
- protected/private методы, а также методы, начинающиеся с `_`, скриптам не отдаются; методы `get_XXX`/`set_XXX` отдаются как свойства `XXX`; protected/private свойства и свойства с `__` не отдаются; public свойства с начальным `_` отдаются как read-only без подчёркивания.

Все файлы начинаются строками `#pragma once` + `#include "../all.h"` — `all.h` собирается препроцессором из всех `.as` движка (в репозитории его нет), поэтому свободные функции любого файла видны всем остальным без явных объявлений. Пакетов `Packet(...)` ни один из 7 файлов сам не объявляет — инициализация идёт через конструктор `Designer` (внутри пакета `pkAddinMgr`).

---

## com_snegopat.as (219 строк)
**Назначение.** Реализует объект `snegopat` из SnegAPI (шапка файла, com_snegopat.as:3): диагностико-сервисные методы уровня «сам Снегопат», доступные аддинам как `designer.snegopat.<метод>` (а через глобальный именованный элемент Designer — просто `snegopat.<метод>`, см. addins/std/snegopat.js:73-97, addins/vtcreator.js:24). Часть файла — диагностический блок раскраски/группировки текстового редактора (только x64), часть — утилиты редактора и мосты к подсистемам движка (диагностика, файловые настройки, лексер, опции).

**Инициализация.** Пакетов нет. Объект создаётся в конструкторе `Designer` (com_designer.as:55: `&&_snegopat = Snegopat();`). Глобальных переменных файл не объявляет. `OptionsEntry` здесь нет, но есть поле-ссылка `_optionEntries = optionList` (com_snegopat.as:203) — голова списка опций из options.as:38, отдаётся аддинам как read-only свойство `optionEntries`.

**Типы.**

### `class Snegopat` (com_snegopat.as:10)
Наследования нет. Все методы public — отдаются скриптам.

Диагностический блок раскраски (только x64, см. «Версионные ветки»):
- `string coloringBackgroundCounts()` (com_snegopat.as:13-21) — возвращает JSON со счётчиками срабатываний «цветовых вентилей» (color gates): `has`, `get`, `line`, `script`. Счётчики берутся у нативных функций `colorsGateCount(1, 2)`, `colorsGateCount(2, 2)`, `colorsGateCount(1, 1) + colorsGateCount(2, 1)`; поле `line` — `colorsLineBgCount()` только на 8.3.27, на прочих версиях -1.
- `string coloringGateInfo()` (com_snegopat.as:23-35) — JSON-матрица 3×6 адресов вентилей (`colorsGateAddress(kind, field)` в hex через `formatInt(..., "0x", 16)`): kind — тип вентиля (0/1/2), field — поля (script-хук, оригинал и т.п.).
- `string coloringBackgroundProbe(const string& text, bool worker = false)` (com_snegopat.as:36-62) — диагностический прогон фоновой раскраски строки. При необходимости включает вентили (`initGroupingAndColoring(true)`, sqlcolors.as:131); если фоновый вентиль не включён (`backGateState != trapEnabled`) — ошибка JSON. Требует открытого редактора модуля (`activeTextWnd is null` → `{"error":"open a module editor first"}`): комментарий в коде (com_snegopat.as:41-42) поясняет, что штатный обработчик фона платформы требует настроек документа, и «голый» CoCreateInstance падает в 8.3.17. Берёт расширение `ITxtEdtExtender` через `getTxtEdtService().getExtender(object, activeTextWnd.textDoc.itm, gTextExtModule)`, приводит к `ITextExtColors` и `ITextExtBackColors`, получает токены `colors.getColors(line, items)`, зовёт нативный `::nativeBackgroundProbe(background, items, output, worker)` и собирает JSON `[start,len,color]` для каждого `BackColorsItem` (шаг `BackColorsItem_size`, разбор через `toBackColorsItem`).
- `bool coloringStress(const string& text, uint workers = 8, uint iterations = 100)` (com_snegopat.as:63-70) — стресс-тест воркеров раскраски: создаёт `ITextExtColors` по CLSID `gTextExtModule` (`currentProcess().createByClsid`) и вызывает `colorsWorkerStress(ext, line, workers, iterations)`.
- `string coloringProbe(const string& text, bool worker = false, bool native = true)` (com_snegopat.as:72-104) — «чистый» прогон парсера без изменения документа: создаёт `ITextExtColors` по CLSID, переключает нативный раскрасчик `colorsNativeSwitch(native)`, запоминает счётчики `colorsGateCount(0, 1|0|2)`, выполняет `colorsWorkerProbe` (worker) или `ext.getColors` (обычный путь), затем собирает JSON со списком токенов `[start,len,lexemCategory,isBlock,lexemType,color.kind,color.value.id,color.value.uuid.data1,color.value.uuid.data2,blockKind,blockMode]` (шаг `SyntaxItemInfo_size`, разбор через `toSyntaxItemInfo`) и дельтами счётчиков `script`/`worker`/`native`.

Сервисные методы (доступны на всех версиях, включая x86):
- `ITextWindow&& activeTextWindow()` (com_snegopat.as:107-109) — COM-обёртка активного текстового окна: `activeTextWnd.getComWrapper()` (текстwnd.as:10,595) или `null`.
- `string parseTemplateString(const string& text, const string& name = "")` (com_snegopat.as:112-124) — обрабатывает строку шаблона редактора штатным процессором шаблонов 1С: `getTxtEdtService().getTemplateProcessor(tp)` → `tp.processTemplate(wName, wText, wResult, caret, "")`; пустое имя заменяется на `"Снегопат"`; в результат в позицию `caret` вставляется символ `symbCaret`.
- `bool showMethodsList()` (com_snegopat.as:127-156) — диалог «список методов модуля» (макрос «Ctrl+1»): прячет IntelliSite (`getIntelliSite().hide()`), требует активное текстовое окно и `oneDesigner._windows.get_modalMode() == msNone`; приводит `activeTextWnd.textDoc.tp` к `ModuleTextProcessor`, при первом вызове создаёт единственный `methodsDialog` (`&&methodsDialog = MethodsDialog()`, класс из mlist.as:18); показывает список `methodsDialog.show(mtp.moduleElements, curPos.line)`; при выборе строки (`line > 0`) ставит каретку сначала на `line+1`, потом на `line` (трюк, чтобы свернутый метод развернулся — комментарий com_snegopat.as:142), скроллит (`scrollToCaretPos`), выделяет строку (`setSelection(curPos, TextPosition(line, len+1), false)`) и `updateView()`.
- `bool showSmartBox()` (com_snegopat.as:159-178) — принудительный вызов выпадающего списка Снегопата: сбрасывает `lastMethodBeginLine = 0` у всех `ModuleTextProcessor` из `textDocStorage.openedDocs` и `parsed = false` у всех `allModuleElements` (принудительный перепарсинг), прячет IntelliSite и активирует процессор активного окна (`tp.activate(activeTextWnd)`).
- `void diagFlush()` (com_snegopat.as:181-183) — сброс накопленных строк журнала на диск (`::diagFlush()` из diag.as); вызывается по таймеру из аддина errorlog.js.
- `void settingsTick()` (com_snegopat.as:185), `void settingsFlush()` (188), `string settingsInfo()` (191) — мосты к файловому механизму настроек settings_store.as:378/338/384 (таймер, принудительная запись, состояние).
- `void diagLog(const string& cat, const string& text)` (com_snegopat.as:195-197) — запись в журнал движка из скриптов **всегда**, независимо от trace (`::diagAlways(cat, text)` из diag.as).
- `IV8Lexer&& parseSources(const string& strSource, uint startLine = 1)` (com_snegopat.as:199-201) — отдаёт лексер исходников 1С: конструктор `IV8Lexer(strSource, startLine)` (класс в lexer.as:290).
- `OptionsEntry&& _optionEntries = optionList` (com_snegopat.as:203) — поле-инициализатор, отдаётся как read-only свойство `optionEntries`.
- `void updateAllEditorsSettings()` (com_snegopat.as:204-206) — оповещает все редакторы об изменении настроек: `getEventService().notify(eTxtEdtOptionChanged)`.
- `string getStockTextIndent()` (com_snegopat.as:208-218) — возвращает «штатный» отступ редактора: читает платформенный профиль напрямую `getProfileService().getBool("ModuleTextEditor/ReplaceTabOnInput")`; если включена замена таба — `getInt("ModuleTextEditor/TabSize")` и строка из `i` пробелов, иначе `"\t"`.

**Функции файла.** Нет свободных функций.

**Перехваты.** Нет (файл пользуется вентилем раскраски, установленным sqlcolors.as, только читая `colorGateState`/`backGateState`).

**Используемые API.**
- v8api: `getTxtEdtService()` (text.v), `ITxtEdtExtender`, `ITextExtColors`, `ITextExtBackColors`, `ITemplateProcessor` (text.v:147), `ITextWindow`, `ITextEditor`, `IProfileFolder` (profile.v:5), `getProfileService()`, `IEventService.notify`, GUID `gTextExtModule {3FF80E32-091C-436E-90A8-308CD4A510E4}` (text.v:256), событие `eTxtEdtOptionChanged {1B93C2C2-5A8E-11D5-B0BA-008048DA0765}` (text.v:258); структуры `SyntaxItemInfo` (textcolors.v:49) и `BackColorsItem` (textcolors.v:95) с константами размеров `SyntaxItemInfo_size`/`BackColorsItem_size` и конвертерами `toSyntaxItemInfo`/`toBackColorsItem`; enum `msNone` (window.v:57).
- Нативные функции `:dlls snegopat_colors.dll` / `snegopat_colors85.dll` (colors_gate.v, только x64): `colorsGateCount`, `colorsGateAddress`, `colorsLineBgCount` (8.3.27), `colorsWorkerStress`, `colorsNativeSwitch`, `colorsWorkerProbe`, `nativeBackgroundProbe` (алиас `colorsBackgroundProbe`); состояния вентилей `colorGateState`/`backGateState` и `initGroupingAndColoring` — из sqlcolors.as:29-47,131.
- Прочее: `IntelliSite`/`getIntelliSite` (intellisite.as:12,79), `MethodsDialog` (mlist.as:18), `ModuleTextProcessor`, `textDocStorage`, `allModuleElements` (ModuleElements.as:192), `IV8Lexer` (lexer.as:290), `symbCaret`, `optionList` (options.as:38).

**Взаимодействия.**
- Предоставляет аддинам объект `snegopat` (поле `Designer._snegopat`); фактически используемые аддинами методы: `snegopat.activeTextWindow()`, `snegopat.parseTemplateString()`, `snegopat.showMethodsList()`, `snegopat.showSmartBox()`, `snegopat.diagLog()`, `snegopat.diagFlush()` (errorlog.js:452) и диагностики `coloring*`.
- Потребляет: sqlcolors.as (вентили), diag.as, settings_store.as, options.as (optionList), intellisite.as, mlist.as, lexer.as, textwnd.as (`activeTextWnd`, `TextWnd.getComWrapper`), ModuleElements.as/ModuleTextProcessor.as.

**Версионные ветки.**
- `#if x86 = 0` (com_snegopat.as:11-105) — весь диагностический блок раскраски компилируется **только для x64** (на x86 вентили раскраски не ставятся, путь там другой).
- Внутри него `#if ver >= 8.3.27 & ver < 8.3.28` (com_snegopat.as:12-22) — в `coloringBackgroundCounts` используется `colorsLineBgCount()` (фон всей строки появился/менялся в 8.3.27, см. colors_gate.v:18-22); в остальных версиях поле `line` = `-1`.

**Особенности.** «Идиома `&&obj = ClassName()`» — создание объекта AngelScript с присваиванием ссылки (`&&methodsDialog = MethodsDialog()`); трюк с двойной установкой каретки для разворота свёрнутого метода; принудительный перепарсинг всех открытых модулей при showSmartBox (дорого, но гарантирует актуальность); фоновый проб требует открытого редактора (падение CoCreateInstance без провайдера настроек в 8.3.17); диагностический JSON собирается вручную конкатенацией строк.

---

## com_designer.as (610 строк)
**Назначение.** Объект `Designer` — корень SnegAPI, который подключается к аддинам (шапка com_designer.as:3-4): он агрегирует все подсистемы движка и отдаётся аддинам как `IDispatch` под именем `"Designer"` (scriptLoader.as:37). Здесь же — «грязные детали»: перехват счётчика COM-ссылок при закрытии процесса, конвертация глобальных контекстов 1С в `Variant` через перехват `QueryInterface`, перехват диалога выбора файлов, обработчики таймеров/кликов по сообщениям, IPC со стартером, события Designer для аддинов (`beforeExitApp`, `onIdle`, `onLoadAddin` и др.).

**Инициализация.** Пакетов нет; конструктор `Designer()` (com_designer.as:51-83) вызывается из `initAddins()` пакета `pkAddinMgr("AddinManager", initAddins, piOnFirstIdle)` (addins.as:5,13-25) и делает по порядку:
1. `&&oneDesigner = this` — глобальная ссылка на единственный экземпляр (com_designer.as:53,387);
2. создаёт все подсистемы: `ProfileStore(getProfileRoot())`, `Snegopat()`, `IHotKeys()`, `IEventConnector()`, `IV8Windows()`, `IV8MetaData(0)`, `V8Files()`, `Develop()`, `EnvironmentData()`, `CommandService()`, `WinApi()`, `StarterInterProcess("Snegopat", &&onStarterNotify)` (com_designer.as:54-65);
3. `setTrapOnComExportCount()` (67), `fillTypeNames()` (68), `initConvertContextToVariant()` (69), `trSelectFileName.setTrap(&&getBkEndUI(), IBkEndUI_GetFileName, GetFileNameTrap)` (70);
4. подписки: `exitAppHandlers.insertLast(PVV(this._onExitApp))`, `beforeExitAppHandlers.insertLast(PCancelExitApp(this._beforeExitApp))`, `idleHandlers.insertLast(PVV(this._onIdle))` (72-74; списки из exitApp.as:14-15 и mainframe.as:154);
5. `&&_addins = AddinMgr()` (76) — менеджер аддинов создаётся последним перед пакетами;
6. `initPackets(piOnDesignerInit)` (78) — запускает пакеты уровня `piOnDesignerInit`;
7. подписка на платформенные события: `IEventService es.subscribe(IID_MyMessageHandler, AStoIUnknown(MessageClickNotifier(), IID_IEventRecipient))` и `es.subscribe(eventSaveModules, AStoIUnknown(SaveModulesNotifier(), IID_IEventRecipient))` (80-82).

`OptionsEntry` в файле нет.

**Типы.**

### `class Designer` (com_designer.as:34-385)
Наследования нет. Поля (все отдаются аддинам как read-only свойства без `_`):
- `AddinMgr&& _addins` — менеджер аддинов (addins.as) → аддинское `addins`;
- `ProfileStore&& _profileRoot` — корень дерева настроек (com_profile.as) → `profileRoot`;
- `Snegopat&& _snegopat` — объект snegopat (com_snegopat.as) → `snegopat`;
- `IHotKeys&& _hotkeys` — коллекция хоткеев (com_hotkeys.as) → `hotkeys`;
- `IEventConnector&& _events` — события (com_events.as) → `events`;
- `IV8Windows&& _windows` — окна (com_windows.as) → `windows`;
- `IV8MetaData&& _metadata` — метаданные (com_metadata.as) → `metadata`;
- `V8Files&& _v8files` — файлы (com_files.as) → `v8files`;
- `Develop&& _develop` — инструменты разработки (develop.as:29) → `develop`;
- `EnvironmentData&& _env` — сведения об окружении → `env`;
- `CommandService&& _cmdService` — команды (com_commands.as) → `cmdService`;
- `WinApi&& _winApi` — WinAPI-обёртки → `winApi`;
- `StarterInterProcess&& _starterIpc` — IPC со стартером (starter/src/ipc/ipc.as:31) → `starterIpc`.

Методы, видимые аддинам (без `_`, часть — vararg через замыкающий `array<Variant>&`):
- `Variant v8New(const string& name, array<Variant>& params)` (com_designer.as:85-113) — создать объект 1С: `currentProcess().createByName(name, IID_IType, type)`, при неудаче поиск CLSID в кэше `__mapTypeNames` и `createByClsid`; параметры конвертируются `var2val` в `ValueParamsVector`, вызывается `type.create(pVal, args)` либо `type.createValue(pVal)`; если у созданного значения есть `ISettingsConsumer` — `setSettings(editedMetaDataCont(), IID_IMDContainer)`; результат — `Value` → `val2var` → `Variant`.
- `void Message(const string& text, Variant markerOrPict = mNone, IDispatch&& clickHandler = null, Variant handlerArg = 0)` (com_designer.as:115-136) — строка в окно сообщений с маркером или картинкой: если `markerOrPict.vt == VT_DISPATCH` — из `Value` извлекается `IV8PictureValue` и `getPicture(pict)`; если `VT_UI4` — это `MessageMarker`. Если передан `clickHandler`, он заворачивается в `MessageClickHandler`, оборачивается `AStoIUnknown(&&ho, IID_MyMessageHandler)`, и всё уходит в `getBkEndUI().doMsgLine(text, marker, g, 0, h, pict)`.
- `MsgBoxAnswers MessageBox(const string& text, MsgBoxStyles style = mbOK, const string& caption = "", uint timeout = 0)` (com_designer.as:138-140) — обёртка глобального `MsgBox` (bkendui.v:229), результат приводится к enum `MsgBoxAnswers`.
- `Variant globalContext(const string& uuidStr)` (com_designer.as:142-162) — глобальный контекст 1С по UUID с кэшем в `__globalContextes`: `createByClsid(Guid(uuidStr), IID_IGlobalContext, gc)`; если контекст поддерживает `IGlobalContextInit` — `init(getDefaultInfoBase())` с запоминанием в `reinitGlobalContextes` (для переинициализации после сохранения модулей); результат — через `convertContextToVariant` (см. ниже). Используется аддином global (add_global.as:73-79).
- `void designInternalForm(const string path = "")` (163) и `void designScriptForm(const string& path = "")` (166) — открытие дизайнера форм (forms.as:108,11).
- `Variant loadFormForScript(SelfScript&& selfScript, string formName = "", IDispatch&& eventHandler = null, const string& eventPrefix = "")` (169-175), `Variant loadScriptForm(string path, IDispatch&& eventHandler, const string& eventPrefix = "")` (176-182), `Variant loadScriptFormEpf(string path, string formName, IDispatch&& eventHandler, const string& eventPrefix = "")` (183-189) — загрузка форм из скрипта/файла/.epf (forms.as), результат `Value` → `val2var` → `Variant`. В JScript доступны как глобальные `loadFormForScript(SelfScript)` (vtcreator.js:26) и т.п.
- `V8Value&& toV8Value(Variant varValue)` (190-192) — обёртка над значением 1С (com_v8value.as:10).
- `ICmdUpdateResult&& getCmdState(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = -1)` (194-196) — состояние команды по UUID группы и номеру: `getCommandState(CommandID(Guid(cmdGroupUUID), cmdNumber), subCommandIdx)` (com_commands.as:41).
- `bool sendCommand(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = 0)` (198-200) — выполнить команду платформы: `sendCommandToMainFrame(CommandID(...), subCommandIdx)` (mainframe.as:145).
- `int_ptr createTimer(uint msec, IDispatch&& pDisp, const string& member = "")` (201-206) — таймер: создаёт `TimerHandler`, возвращает `setTimer(msec, TimerProc(th.handler))` (нативные таймеры snegopat.dll); через `member` задаётся имя вызываемого метода обработчика (пустое — вызов диспетчера по умолчанию).
- `string takeScriptError()` (208-214) — извлекает по одной записи из очереди необработанных ошибок скриптов `scriptErrorQueue` (scriptLoader.as:90); пустая строка — очередь пуста.
- `void killTimer(uint timerID)` (215-217) — `removeTimer(timerID)`.
- `void saveProfile()` (218-220) — `getProfileService().flush()`.
- `void setCmdTrace(bool on)` (222-224) — включает трассировку команд платформы (`_develop.cmdTrace`, develop.as:30): каждая команда главного окна печатается в окно сообщений («Команда: группа … номер …»), нужно для выяснения id команд меню для `sendCommand`.
- `void snPrint(const string& msg)` (225-227) — `Print(msg)`; `void snLog(const string& msg)` (228-230) — `doLog(msg)`.
- `EditorsManager&& get_editorsManager()` (232-234) — геттер → свойство `editorsManager` (класс textwnd.as:720, глобальный textwnd.as:868).
- `string loadResourceString(const string& moduleName, const string& stringID)` (256-260) — строковый ресурс модуля платформы: `load_module_wstring` с utf8-конвертацией аргументов.
- `Variant builtin_require(string addinFile)` (262-284) — `require()` для TypeScript-аддинов: имя — файл (может быть относительным, с папками, расширение по умолчанию `.js`); перебирает все загруженные аддины (`_addins.get_count()`, `_addins.byIdx(i)`) и сравнивает суффикс `get_fullPath()` без учёта регистра (`extractFileNameRex`/`extractFileExtRex` — RegExp из lexer.as:160-161); если не нашли — `_addins.loadAddin("script:" + pathes._addins + addinFile.replace("/", "\\") + ".js", _addins._users)`; возвращает `IDispatch` объекта аддина.
- `uint processId()` (320-322) — PID процесса 1С (`GetCurrentProcessId`); используется, например, errorlog.js:49.
- `int hideLogWindows()` (325-344) — прячет окна логов ошибок своего процесса с заголовками `"Core.As"` (x64) и `"Snegopat log window"` (x32) через `FindWindowEx`/`GetWindowThreadProcessId`/`ShowWindow(h, 0)`; возвращает число скрытых; ошибки не теряются — они в файлах logs\, errorlog.js выводит их в окно сообщений (комментарий com_designer.as:323-324).
- `SqliteBase&& sqliteOpen(const string& baseName = ":memory:", int flags = -1)` (346-357) — открыть базу sqlite: `sqlite3_open_v2`; при `flags == -1` — `SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE`; при ошибке `setComException(stringFromAddress(sqlite3_errmsg16(db)))` и `sqlite3_close`. Возвращает объект com_sqlite.as:175.

Внутренние методы (не отдаются скриптам — начинаются с `_` или private):
- `IUnknown&& _createValue(const string& name, ValueParamsVector&& params = ValueParamsVector())` (237-255) — то же, что `v8New`, но на уровне нативных значений и возвращает `IUnknown`.
- `IDispatch&& _me()` (314-318) — `createDispatchFromAS(&&this)`: диспетчер создаётся один раз и привязывается к объекту (комментарий com_designer.as:315-316).
- `private void fillTypeNames()` (289-313) — заполняет кэш `__mapTypeNames`: перебирает все классы категории `IID_IType` (`proc.getCategoryClasses(vec, IID_IType)`), создаёт каждый, проверяет наличие конструкторов `type.hasCtor(i)` для i = 0..14 и заносит оба строковых имени (`type.getTypeString(alias)`, alias 0..1) в `NoCaseMap<Guid>`.
- `void _beforeExitApp(ExitAppCancel&& cancel)` (359-363) — событие аддинам `"beforeExitApp"` с диспетчером `ExitAppCancel` (можно отменить выход).
- `void _onExitApp()` (364-366) — событие `"onExitApp"`.
- `void _fireAddinChanges(Addin&& a, bool load)` (367-371) — события `"onLoadAddin"` / `"onUnLoadAddin"` (вызывается менеджером аддинов).
- `void _onIdle()` (372-374) — событие `"onIdle"` (из idleHandlers mainframe.as).
- `void _fireCreateTextWindow(TextWnd&& wnd)` (375-379) — событие `"createTextWindow"` с обёрткой окна (`wnd.getComWrapper()`).
- `void _reinitGlobalContextes()` (380-384) — переинициализация всех запомненных `IGlobalContextInit` с `getDefaultInfoBase()`.

Приватные данные класса: `NoCaseMap<Guid> __mapTypeNames` (286) — имена типов 1С → CLSID; `NoCaseMap<Variant> __globalContextes` (287) — кэш глобальных контекстов; `private array<IGlobalContextInit&&> reinitGlobalContextes` (288).

### `class EnvironmentData` (com_designer.as:555-570)
Простой контейнер сведений об окружении, отдаваемый аддинам как свойство `env` (используется, например, std.js:47 `env.v8Version`). Поля (read-only свойства без `_`): `_sVersion = snegoVersion` → свойство `sVersion`; `_v8Version = sv8ver` → `v8Version` (строка вида «8.3.x.y.y», заполняется в main.as:30-31); `_v8ver = v8ver` → `v8ver` (uint64, main.as:21,26); `_snMainFolder = myFolder` → `snMainFolder`; `_ownerName = ownerName` → `ownerName`; `_BuildDateTime = BuildDateTime` → `BuildDateTime`; `_x64`/`_arch` → `x64`/`arch` (`"x86"`/`"x64"` по условию компиляции); `_pathes = pathes` → `pathes` (pathes.as).

### `class TimerHandler` (com_designer.as:465-478)
Обработчик таймера для `createTimer`: поля `IDispatch&& pDisp`, `string name`; `void handler(int_ptr timerID)` — разрешает dispid через `pDisp.findMember(name, id)` (пустое имя — dispid 0), готовит `args = [timerID]` и зовёт `pDisp.call(id, args)`.

### `class MessageClickHandler` / `class MessageClickNotifier` (com_designer.as:480-495)
Пара для кликов по строке окна сообщений: `MessageClickHandler` хранит `IDispatch&& handler` и `Variant arg`, `process()` зовёт `handler.call(0, {arg})`. `MessageClickNotifier` — получатель платформенного события `IID_MyMessageHandler`: `onEvent(const Guid&in, long, IUnknown& obj)` приводит `obj` к `MyMessageHandler&&` (bkendui.v:128, GUID `{AA7D47D7-FBFB-489E-ACF0-5F90A7AE4744}`) и вызывает `process()`. Так JScript-обработчик, переданный в `Designer.Message`, срабатывает при клике по сообщению.

### `class SaveModulesNotifier` (com_designer.as:497-502)
Получатель платформенного события `eventSaveModules {9C023C90-0144-497D-9ED9-B2949DD557C4}` (metadata.v:565): по сохранению модулей зовёт `oneDesigner._reinitGlobalContextes()` — открытые глобальные контексты нужно инициализировать заново.

### `enum SelectFileResult` / `class ISelectFileData` (com_designer.as:504-535)
`SelectFileResult { sfrNormal = 0, sfrSelected = 1, sfrCanceled = 2 }` — решение обработчика `onSelectFile`. `ISelectFileData` — обёртка над нативной структурой `SelectFileName` (bkendui.v:204; хранит `SelectFileNameRef&& data`), отдаётся аддинам в событии `onSelectFile`. Свойства/методы (как их видит аддин): `mode` (SelectFileMode, bkendui.v:191), `flags`, `filtersCount`, `filterDescr(idx)`, `filterVal(idx)` (пары строк фильтра), `filter` (get/set — индекс фильтра), `defExt`, `initialFileName`, `folder` (get/set), `title` (get/set), `filesCount`, `selectedFile(idx)`, `addSelectedFile(fileName)`, поле `result` (SelectFileResult, по умолчанию `sfrNormal`).

### `class StarterBroadcast` (com_designer.as:593-596)
`string source; string data;` — полезная нагрузка события `"Broadcast"` от стартера.

**Функции файла.**
- `TrapSwap trComExportCount` (395) + `int_ptr com_export_count() { return 0; }` (396) + `void setTrapOnComExportCount()` (397-411) — «обман» платформы при закрытии: различные объекты 1С были отданы наружу как IDispatch, поэтому 1С не завершает процесс, считая, что есть внешние ссылки (комментарий com_designer.as:391-394). Перехват по имени нативной функции `?com_exported_count@core@@YAIXZ` (x86) / `?com_exported_count@core@@YA_KXZ` (x64) из `core82.dll`/`core83.dll` всегда возвращает 0; в `exitAppHandlers` вставлена функция, снимающая перехват перед выходом (410).
- `void initConvertContextToVariant()` (424-436) — подготовка конвертера глобальных контекстов: создаёт любой объект с `IValue` и `IContext` (`createByClsid(CLSID_TxtEdtDoc, IID_IValue, ...)`, CLSID_TxtEdtDoc `{5C84ACF4-DB1C-11d4-B008-004095E12DE6}`, text.v:253) и ставит перехват его `QueryInterface` (слот 0); перехват сразу убирается `swap()` (435).
- `uint IGlobcalContext_QI(IUnknown& pThis, const Guid& g, IUnknown&&& res)` (438-448) — хук QI: при запросе `IID_IContext` отдаёт `contextForConvertToVariant` (с `AddRef`), иначе вызывает оригинал через `trValQueryIface.getOriginal`.
- `void convertContextToVariant(IContext&& ctx, Variant& var)` (450-462) — штатная конвертация Value→Variant для глобального контекста: подменяет глобальный `contextForConvertToVariant`, создаёт свежий CLSID_TxtEdtDoc-IValue, включает перехват QI (`swap()`), зовёт штатный `val2var(val, var)`, снимает перехват, обнуляет контекст. Комментарий com_designer.as:414-422 объясняет, почему так: глобальные контексты не поддерживают `IValue`, поэтому штатно их нельзя положить в `Value`.
- `void VectorV8StringPushBack(Vector& v, const v8string&in str)` (537-553) — ручной push_back в нативный вектор строк 1С: при нехватке места перевыделяет `v8malloc(newSize)` (+3 элемента), копирует память `mem::memcpy`, вызывает `v.dtor()` для старого блока (строки V8 можно перемещать простым копированием памяти — комментарий 540-541), конструирует строку на месте `tov8string(v.end).ref.ctor1(str)` и двигает `v.end`.
- `void onStarterNotify(const string& msg)` (598-610) — обратный вызов IPC стартера: разбирает `msg.split("\xB")` (разделитель 0x0B); если 3 части и получатель не наше окно (`data[1] != "" + oneDesigner._starterIpc.hMyWnd`) — собирает `StarterBroadcast(source=data[0], data=data[2])` и на диспетчере `oneDesigner._starterIpc` стреляет событием `"Broadcast"` через `oneDesigner._events.fireEvent(...)`.

**Перехваты.**
- `trComExportCount` (TrapSwap, com_designer.as:395-411) — перехват по **имени** экспорта `?com_exported_count@core@@YA…` в core82/core83.dll на функцию `com_export_count()` (всегда 0); снимается в `exitAppHandlers` при выходе.
- `trValQueryIface` (TrapVirtualStdCall, com_designer.as:421,433) — слот 0 (QueryInterface) временно создаваемого объекта `CLSID_TxtEdtDoc`-IValue; хук `IGlobcalContext_QI` подменяет `IID_IContext`.
- `trSelectFileName` (TrapVirtualStdCall, com_designer.as:70,572-591) — слот `IBkEndUI_GetFileName` (метод `IBkEndUI.GetFileName`, bkendui.v:116) объекта `getBkEndUI()`; хук `GetFileNameTrap(IBkEndUI&, SelectFileName&, size_t timeout, HWND parent)`: на время обработки события снимает перехват (чтобы можно было вызвать штатный диалог), оповещает аддинов событием `"onSelectFile"` с диспетчером `ISelectFileData`; затем по `fd.result`: `sfrNormal` → оригинальный `pBkEndUI.GetFileName(...)`, `sfrCanceled` → `false`, `sfrSelected` → `true` (файл уже добавлен аддином через `addSelectedFile`); восстанавливает перехват. Именно через это событие std.js:54-58 подставляет путь в диалог «Открыть документ» на 8.3.27+.

**Используемые API.**
- v8api: `currentProcess()` (`SCOM_Process.createByName`, `createByClsid`, `getService`, `getCategoryClasses`), `IType`/`IValue`/`IContext`/`IGlobalContext`/`IGlobalContextInit`/`ISettingsConsumer`/`IImage`/`IV8PictureValue`, `getBkEndUI()` и `IBkEndUI.doMsgLine`/`GetFileName` (bkendui.v:103,116), `getEventService()` (`IEventService.subscribe/notify`, event.v:15,25), `getProfileService()` (`IProfileService.flush`), `getDefaultInfoBase()`, `editedMetaDataCont()`, GUID-и: `IID_MyMessageHandler {AA7D47D7-FBFB-489E-ACF0-5F90A7AE4744}`, `IID_IEventRecipient {D15F2BB0-BD08-11d3-B950-008048DA0334}` (event.v:5), `eventSaveModules {9C023C90-0144-497D-9ED9-B2949DD557C4}`, `CLSID_TxtEdtDoc {5C84ACF4-DB1C-11d4-B008-004095E12DE6}`, `IID_IContext`, `IID_IType`, `IID_IGlobalContext`, `IID_IMDContainer`, `IID_NULL`.
- Механизмы движка/нативного прелюда: `createDispatchFromAS` (создание IDispatch из объекта AngelScript), `AStoIUnknown` (AS-объект → IUnknown с заданным IID), `var2val`/`val2var` (Variant↔Value), `TrapSwap.setTrapByName`, `TrapVirtualStdCall.setTrap/getOriginal/swap`, `setTimer`/`removeTimer`/`TimerProc` (нативные таймеры snegopat.dll), winapi `GetCurrentProcessId`, `FindWindowEx`, `GetWindowThreadProcessId`, `IsWindowVisible`, `ShowWindow`, `HWND`, `DWORD`.
- sqlite: `sqlite3_open_v2`, `sqlite3_errmsg16`, `sqlite3_close`, `SQLITE_OK`, `SQLITE_OPEN_READWRITE|SQLITE_OPEN_CREATE`.
- Прочее: `load_module_wstring` (ресурсы платформы), `v8malloc`/`mem::memcpy`, `stringFromAddress`, `setComException`, `Print`, `doLog`.

**Взаимодействия.**
- Создаётся пакетом `pkAddinMgr` (addins.as:23) и создаёт внутри себя `AddinMgr`; сам является единственным местом вызова `initPackets(piOnDesignerInit)`.
- Отдаёт аддинам: глобальный именованный элемент `Designer` и через него всё SnegAPI (`addins`, `profileRoot`, `snegopat`, `hotkeys`, `events`, `windows`, `metadata`, `v8files`, `develop`, `env`, `cmdService`, `winApi`, `starterIpc`, `editorsManager`, а также глобальные функции `v8New`, `Message`, `MessageBox`, `globalContext`, `sendCommand`, `getCmdState`, `createTimer`, `killTimer`, `saveProfile`, `setCmdTrace`, `snPrint`, `snLog`, `processId`, `hideLogWindows`, `sqliteOpen`, `loadResourceString`, `builtin_require`, `takeScriptError`, `toV8Value`, `loadFormForScript`, `loadScriptForm`, `loadScriptFormEpf`, `designInternalForm`, `designScriptForm`).
- События Designer для аддинов (через `_events.fireEvent(_me(), ...)`): `beforeExitApp`, `onExitApp`, `onLoadAddin`, `onUnLoadAddin`, `onIdle`, `createTextWindow`, `onSelectFile`, `Broadcast`.
- Потребляет: com_commands/com_events/com_files/com_hotkeys/com_profile/com_snegopat/com_windows/com_metadata/com_sqlite (создаёт их объекты), develop.as (Develop.cmdTrace), forms.as, textwnd.as, scriptLoader.as (scriptErrorQueue), exitApp.as/mainframe.as (списки обработчиков), packets.as, starter/src/ipc/ipc.as (StarterInterProcess, класс не входит в группу engine/).

**Версионные ветки.**
- `#if ver < 8.3` → `core82.dll`, иначе `core83.dll` (com_designer.as:399-403) — имя библиотеки для перехвата `com_exported_count`.
- `#if x86` → декорированное имя `?com_exported_count@core@@YAIXZ`, иначе `?com_exported_count@core@@YA_KXZ` (com_designer.as:404-408) — разница декорации из-за типа возвращаемого значения (unsigned int vs unsigned __int64).
- `#if x86`/`#else` в `EnvironmentData` (com_designer.as:562-568) — значения полей `_x64`/`_arch`.

**Особенности.** Глобальный кэш `contextForConvertToVariant` + временный объект с перехваченным QI — хак, позволяющий «просунуть» глобальный контекст 1С через штатный конвертер Value→Variant; перехват `com_exported_count` — прямой хак завершения процесса (рискованно: возвращает ложь платформе, поэтому перехват снимается перед выходом); `fillTypeNames` перебирает **все** классы категории IType (до 15 слотов конструкторов) — заметная работа при старте; диспетчер объекта кэшируется нативно, поэтому `_me()` можно звать многократно; `builtin_require` сопоставляет файлы аддинов по суффиксу полного пути без учёта регистра — работает и для вложенных папок; обработка `onSelectFile` синхронна и может «съесть» штатный диалог (result != sfrNormal).

---

## com_commands.as (103 строки)
**Назначение.** Работа с командами платформы из скриптов (шапка com_commands.as:3): чтение описания команды (группа/номер/текст/картинка/акселератор) и состояния команды (доступность, пометка, тексты, подкоманды). Объект `CommandService` отдаётся аддинам как `designer.cmdService`, а `ICmdUpdateResult` возвращается также из глобального `Designer.getCmdState`.

**Инициализация.** Пакетов нет; объект `CommandService` создаётся в конструкторе `Designer` (com_designer.as:63). Глобальных объектов и `OptionsEntry` нет.

**Типы.**

### `class ICmdUpdateResult` (com_commands.as:10-39)
Обёртка над `CommandState&&` (private `state`; класс CommandState из mainframe.as:84). Свойства (как видит аддин):
- `enabled` — `state.cmdState.bEnable` (доступна);
- `checked` — `state.cmdState.bChecked` (помечена);
- `text` — `state.cmdState.text`;
- `description` — `state.cmdState.descr`;
- `tooltip` — `state.cmdState.tooltip`;
- `subCommands` — `state.lstState.count` (состав подкоманд).

### `class CommandService` (com_commands.as:51-71)
- `CommandDescription&& getCommandDescription(string groupUuid, uint number)` (53-64) — получает `ICommandService` платформы (`currentProcess().getService(IID_ICommandService)`), запрашивает `pCmdServ.commandDescription(descr, id)` для `CommandID(Guid(groupUuid), number)`; при успехе возвращает обёртку `CommandDescription`, иначе `null`. (Закомментированный метод `groupPresentation` — com_commands.as:65-70 — остался как черновик.)

### `class CommandDescription` (com_commands.as:73-103)
Обёртка над `ICmdDescription&& __cmdDescr`. Свойства:
- `group` (75-83) и `num` (84-92) — идентификатор команды; на `ver < 8.3.4` через двухшаговый вызов `__cmdDescr.id(id)` с заполнением структуры `CommandID`, на новых версиях — напрямую `__cmdDescr.id().group` / `.num`;
- `text`, `accel` (текст акселератора, `accelText()`), `picture` (`image()` → `image2pict(img)` → Variant-картинка), `description`, `tooltip`, `presentation`.

**Функции файла.**
- `ICmdUpdateResult&& getCommandState(const CommandID& cmd, int subCommand)` (41-44) — состояние команды главного окна: `getMainFrameCommandState(cmd, subCommand)` (mainframe.as:116); `null`, если состояния нет.
- `ICmdUpdateResult&& getCommandStateRecv(const CommandID& cmd, int subCommand, ICommandReceiver&& recv)` (46-49) — то же, но с явным приёмником команд: трёхаргументный `getCommandState` из mainframe.as:125.

**Перехваты.** Нет (перехват выполнения команд — в com_events.as).

**Используемые API.** `currentProcess().getService(IID_ICommandService)`; интерфейсы `ICmdDescription` (методы `id()`, `text()`, `accelText()`, `image()`, `description()`, `tooltip()`, `presentation()`), `ICommandReceiver`; `CommandID` (compositeid.v), `CommandState`, `getMainFrameCommandState`/`getCommandState` (mainframe.as), `image2pict`.

**Взаимодействия.** Предоставляет `CommandService` (поле `Designer._cmdService`) и `ICmdUpdateResult` для `Designer.getCmdState`; использует mainframe.as (CommandState, getMainFrameCommandState/getCommandState) и константы command.v. `ICmdUpdateResult` используется и com_events.as (косвенно — через mainframe).

**Версионные ветки.** `#if ver < 8.3.4` (com_commands.as:76-82, 85-91) — изменение сигнатуры `ICmdDescription.id()` (до 8.3.4 метод принимал выходной параметр, после — возвращает значение).

**Особенности.** Файл тонкий: реальная работа — в mainframe.as; `picture` возвращается как Variant-картинка 1С (удобно для меню аддинов).

---

## com_events.as (247 строк)
**Назначение.** Реализует объект `events` из SnegAPI (шапка com_events.as:3): собственная шина событий движка — подключение/отключение обработчиков JScript-аддинов к произвольным источникам (в т.ч. к самому Designer), вызов событий, а также **перехват выполнения команд платформы** (`ICommandReceiver.transmitCommand`), превращающий каждую команду главного окна в пару событий аддинов «до/после». Объект отдаётся как `designer.events` (глобальное `events` для аддинов).

**Инициализация.** Пакетов нет; объект `IEventConnector` создаётся в конструкторе `Designer` (com_designer.as:57), его конструктор (com_events.as:11-13) сразу вызывает `setCmdTrap()` — перехват команд ставится в момент создания Designer (то есть ещё до пакетов уровня `piOnDesignerInit`). Глобальных переменных уровня файла нет (кроме самих классов и перехватчиков).

**Типы.**

### `class IEventConnector` (com_events.as:10-173)
Методы, видимые аддинам:
- `HandlerNode&& connect(IDispatch&& pSource, const string& eventName, IDispatch&& handler, string handlerName = "")` (15-23) — подключить обработчик: пустые источник/handler/имя события отклоняются; пустое `handlerName` заменяется на `eventName`; нода `HandlerNode(handler, handlerName)` добавляется в `getEventNode(pSource, eventName, true).handlers`; возвращает ноду.
- `void disconnect(IDispatch&& pSource, const string& eventName, IDispatch&& handler, string handlerName = "")` (25-31) — отключить (парный к connect, те же правила подстановки имени).
- `void disconnectNode(HandlerNode&& node)` (32-38) — отключение по ноде: помечает `_removed`; если внутри `fireEvent` — откладывает удаление (`hasRemovedNodes = true`).
- `void fireEvent(IDispatch&& pSource, const string& eventName, array<Variant>&& args)` (40-62) — вызвать событие (вариадичное): перед каждым обработчиком в **начало** args вставляется диспетчер самой ноды (`Variant(createDispatchFromAS(&&pHN))`) — поэтому обработчик получает `this`-подобный первый параметр (так `d.result` в std.js:55 работает с нодой-обёрткой); имя обработчика `"-"` означает dispid 0 (метод по умолчанию JScript-объекта); ноды с `_removed` пропускаются; счётчик `fireEventEnters` защищает от изменения списка во время оповещения, отложенный `deleteRemoved()` выполняется на выходе из самого внешнего `fireEvent`. (Закомментированная строка 55 — отозванный хак для `onDoModal`.)
- `HandlerNode&& addCommandHandler(const string& cmdGroupUUID, uint cmdNumber, IDispatch&& handler, string handlerName)` (64-70) — подписка на команду 1С: событие хранится с источником `null` и именем `"<uuid>-<номер>"`.
- `void delCommandHandler(const string& cmdGroupUUID, uint cmdNumber, IDispatch&& handler, string handlerName)` (72-76).
- `string _getCmdEventName(const string&in uuid, int num)` (77-79) — `uuid + "-" + num` (метод с `_`, аддинам не виден, но используется хуком transmitCommandTrap).
- `bool _hasHandlers(IDispatch&& source, const string& eventName)` (80-83) — есть ли хоть один обработчик.
- `void removeMyListeners(IDispatch&& pSource)` (84-103) — помечает удалёнными **все** обработчики данного источника (используется при уничтожении скрипта-источника).
Приватное состояние: `NoCaseMap<array<EventNode&&>&&> events` (104) — реестр «имя события → массив нод по источникам»; `getEventNode(pSrc, eventName, create=false)` (105-124); `disconnectImpl` (125-144) — при активном оповещении помечает ноду `_removed = hasRemovedNodes = true`, иначе удаляет сразу и чистит пустые ноды; `deleteRemoved()` (145-170) — трёхуровневая уборка (обработчики → ноды → имена событий); `uint fireEventEnters = 0` (171), `bool hasRemovedNodes = false` (172).

### `class HandlerNode` (com_events.as:175-183)
`IDispatch&& handler; string nameOfHandler; bool _removed = false;` — один обработчик; отдаётся наружу из `connect`/`addCommandHandler` (и передаётся обработчикам первым аргументом).

### `class EventNode` (com_events.as:185-191)
`IDispatch&& pSource; array<HandlerNode&&> handlers;` — событие конкретного источника.

### `class CmdHandlerParam` (com_events.as:236-247)
Параметр, передаваемый обработчикам команд: `string _groupID; uint _cmdNumber; int _cmdParam; bool _isBefore = true; bool cancel = false;` (свойства `groupID`, `cmdNumber`, `cmdParam`, `isBefore`, `cancel`). Конструктор заполняет из `Command`. Обработчик может выставить `cancel = true`, чтобы запретить выполнение команды; после выполнения штатной обработки `_isBefore` сбрасывается и событие стреляет второй раз.

**Функции файла.**
- `void transmitCommandTrap(ICommandReceiver& cmdRecv, const CommandRef&& command, bool deactivate)` (195-223) — хук `transmitCommand`: если движок ещё не стартовал (`oneDesigner is null || _develop is null || _events is null`) — команды проходят без событий аддинов (комментарий 198); пункты собственного меню Снегопата (`mainMenuOnCommand(command.ref)`, mainmenu.as:290) в платформу не уходят; при `oneDesigner._develop.cmdTrace` печатается «Команда: группа … номер … Параметр: … obj=…»; если обработчиков события `"<uuid>-<num>"` нет — сразу оригинал (без накладных расходов); иначе создаётся `CmdHandlerParam`, событие стреляет до (`_isBefore = true`), при отсутствии `cancel` вызывается штатная обработка `original(cmdRecv, command.ref, deactivate)` и событие стреляет ещё раз с `_isBefore = false`.
- `void setCmdTrap()` (225-234) — ставит перехват: `ICommandReceiver&& cmdReceiver = coreMainFrame.unk` → `trSendCommand.setTrap(&&cmdReceiver, ICommandReceiver_transmitCommand, transmitCommandTrap)`; при неудаче — `Message("Не удалось установить перехват на обработку команд основного окна")`.

**Перехваты.**
- `TrapVirtualStdCall trSendCommand` (com_events.as:193) — слот `ICommandReceiver_transmitCommand` (метод `transmitCommand`, command.v:55) объекта `coreMainFrame.unk` (`ICommandReceiver {377A2018-C51B-4cf5-AC03-A1509266DF2D}`, command.v:52). Хук — `transmitCommandTrap` (см. выше). Ставится в конструкторе `IEventConnector` → при создании Designer. funcdef оригинала: `FTransmitCommand(ICommandReceiver&, const Command&, bool)` (194).

**Используемые API.** `coreMainFrame` (mainframe.as), `TrapVirtualStdCall.setTrap/getOriginal`, `createDispatchFromAS`, `IDispatch.findMember/call`, `NoCaseMap`, `mainMenuOnCommand` (mainmenu.as:290), `Command`/`CommandRef` (command.v), `Message`.

**Взаимодействия.**
- Предоставляет: объект `events` (поле `Designer._events`); события Designer (`beforeExitApp`, `onExitApp`, `onLoadAddin`/`onUnLoadAddin`, `onIdle`, `createTextWindow`, `onSelectFile`, `Broadcast` — стреляются из com_designer.as через `_events.fireEvent`); события команд платформы `"<uuid группы>-<номер>"` (аддины подписываются через `events.addCommandHandler`, см. std/commands.js); `mainmenu.as` пользуется тем, что его пункты не уходят в платформу (`mainMenuOnCommand`).
- Потребляет: com_designer.as (`oneDesigner._develop.cmdTrace`, `_events`, `_getCmdEventName`), mainframe.as, mainmenu.as.

**Версионные ветки.** Нет.

**Особенности.** Первым аргументом обработчик получает диспетчер ноды `HandlerNode` (нестандартно, но позволяет обработчику отключиться через ноду); реентерабельность решена счётчиком `fireEventEnters` с отложенной уборкой; `"-"` как имя обработчика = вызов метода по умолчанию; в `removeMyListeners` при активном оповещении ветка `hasRemovedNodes = false` (com_events.as:101) выглядит как потенциальная опечатка (по смыслу ожидалось `= true`) — удалённые ноды в этом случае могут быть убраны только последующим `fireEvent`; перехват команд гарантирует, что при отсутствии подписчиков накладные расходы — один lookup в `NoCaseMap`.

---

## com_files.as (314 строк)
**Назначение.** Работа из аддинов с файлами (шапка com_files.as:3): обёртки над файловой подсистемой платформы — открытие файлов по URL (в т.ч. ftp/http-схемы платформы), файлы в памяти и временные файлы, контейнер-хранилище 1С (Storage), побайтовые буферы и строковые преобразования в кодировках ANSI/UTF-8/UTF-16. Объект `V8Files` отдаётся аддинам как `designer.v8files`.

**Инициализация.** Пакетов нет; объект `V8Files` создаётся в конструкторе `Designer` (com_designer.as:60). Глобальных объектов и `OptionsEntry` нет.

**Типы.**

### `class V8Files` (com_files.as:10-65)
- `IV8DataFile&& open(const string& path, FileOpenModes mode)` (13-28) — открыть файл: `URL url(path)`, `IFileSystem fs = getFSService()`, `fs.openURL(file, url, mode)`; вызов обёрнут в `ExceptionCatcher` + `CppCatch("class core::Exception", ...)` — пойманное исключение платформы превращается в `setComException(catcher.errStr)` и `null`; из `IFile` извлекается `IFileEx` и оборачивается в `IV8DataFile`.
- `IV8DataFile&& createMemoryFile()` (29-33) — файл в памяти: `createByClsid(CLSID_MemoryFile, IID_IFileEx, fex)`; `CLSID_MemoryFile {C1AF3F04-620A-40BC-8CA8-F6089B4A46F5}` (file.v:90).
- `IV8DataFile&& createTempFile(uint memLimit = 0)` (34-42) — временный файл с выгрузкой на диск после лимита: `CLSID_TempFile {4FBE2375-4CED-4038-A89A-1C772F305CBE}` (file.v:91); при `memLimit != 0` — `ITempFile.setMemLimit(memLimit)`.
- `IV8StorageFile&& attachStorage(IV8DataFile&& file, bool createNew = false)` (43-61) — контейнер 1С поверх файла: `CLSID_StorageRW {1E87FC1E-F03C-44D3-B87E-1DB84EF2C70C}` (file.v:92); `stg.createNewFromFile(file.file)` или `stg.initFromFile(file.file)` (с ловлей исключений).
- `MemoryBuffer&& newMemoryBuffer(uint size)` (62-64) — новый байтовый буфер.

### `enum StringDataMode` (com_files.as:67-71)
`dsAnsi = 1, dsUtf8 = 2, dsUtf16 = 3`.

### `class MemoryBuffer` (com_files.as:73-90)
Байтовый буфер: `int_ptr bytes; uint _length;`. Конструктор выделяет `malloc(l)` (0 — без выделения), деструктор освобождает. Методы: `uint8 byte(uint pos)` / `void set_byte(uint pos, uint8 val)` — прямой доступ через `mem::byte[bytes + pos]`. Отдаётся аддинам из `read()`/`newMemoryBuffer()`.

### `class IV8DataFile` (com_files.as:140-252)
Обёртка над `IFileEx&& file`. Все операции проверяют закрытие (`file is null` → `setComException("Файл закрыт")`) и ловят исключения платформы той же парой `ExceptionCatcher`/`CppCatch`. Методы (как видит аддин):
- `MemoryBuffer&& read(uint length)` (145-160) — читает до `length` байт; фактическое количество пишется в `buf._length` (при исключении обнуляется);
- `void write(MemoryBuffer&& bytes)` (161-172);
- `uint32 seek(int64 pos, FileSeekMode fsMode)` (173-184);
- `string getString(StringDataMode mode, int length = -1)` (185-187) — делегирует свободной `file_getString`;
- `void putString(StringDataMode mode, const string& str, int length = -1)` (188-211) — запись строки: UTF-16 — `f.write(str.cstr, length * 2)`; ANSI/UTF-8 — конвертация `WideCharToMultiByteNull` (CP_UTF8/CP_ACP) через промежуточный `MemoryBuffer`;
- `void flush()` (212-223), `void setEOF()` (224-234);
- `string get_url()` (235-248) — URL файла (`f.url(u)` → `u.url`);
- `void close()` (249-251) — отпускает `IFileEx`.

### `class IV8StorageFile` (com_files.as:254-296)
Обёртка над `IStorageRW&& stg` (контейнер 1С):
- `array<string>&& files()` (259-270) — список элементов: `stg.find(flist, "*")`, обход `StorageFileInfoRef` с обязательным `ptr.ref.dtor()`;
- `IV8DataFile&& open(const string& name, FileOpenModes mode)` (271-281);
- `void rename(const string& oldName, const string& newName)` (282-288), `void remove(const string& name)` (289-295).

### `class ExceptionCatcher` (com_files.as:303-314)
Класс отлова C++ исключения типа `core::Exception`: поля `bool hasException`, `bool bypass`, `string errStr`; `bool handle(Exception& exc)` — при `bypass` возвращает false (исключение пробрасывается дальше), иначе запоминает `exc.descr` и возвращает true (обработано). Используется всегда в паре с `CppCatch c("class core::Exception", ExceptionHandler(catcher.handle))`. funcdef `bool ExceptionHandler(Exception&)` объявлен на com_files.as:298.

**Функции файла.**
- `string file_getString(IFileEx&& file, StringDataMode mode, int length = -1)` (92-138) — прочитать строку из файла: при `length == -1` размер вычисляется seek-ами (`seek(0, fsCurrent)` → `seek(0, fsEnd)` → возврат); UTF-16 — длина выравнивается на чётность (`length &= ~1`) и читается сразу в `string`; ANSI/UTF-8 — читается в `MemoryBuffer` и конвертируется `MultiByteToWideChar` (CP_UTF8/CP_ACP). Отладочные `dbgLog`-вставки (104-127) — из diag.as.

**Перехваты.** Нет.

**Используемые API.** `getFSService()` / `IFileSystem.openURL` / `URL` (url.v), `IFile`/`IFileEx`/`ITempFile`/`IStorageRW`, `FileOpenModes`/`FileSeekMode` (fsBegin/fsCurrent/fsEnd), CLSID-и `CLSID_MemoryFile`, `CLSID_TempFile`, `CLSID_StorageRW` (см. выше), winapi `MultiByteToWideChar`, `WideCharToMultiByteNull` (CP_UTF8 = 65001, CP_ACP), `malloc`/`free`, `mem::byte`, `setComException`, `dbgLog`.

**Взаимодействия.** Предоставляет `V8Files` (поле `Designer._v8files`), классы `IV8DataFile`/`IV8StorageFile`/`MemoryBuffer` и `ExceptionCatcher` (используется и в forms.as для работы с временными файлами). Потребляет: diag.as (dbgLog).

**Версионные ветки.** Нет.

**Особенности.** Каждый вызов COM-метода платформы окружён парой `ExceptionCatcher`+`CppCatch` — исключения `core::Exception` превращаются в COM-ошибки AngelScript (`setComException`), не разрывая скрипт; `MemoryBuffer` — сырая память с ручным управлением (риск порчи памяти при неверном `pos`); `putString`/`getString` для UTF-16 пишут/читают «сырые» двухбайтовые данные без BOM; `length` в `putString` — в символах, а не байтах.

---

## com_hotkeys.as (131 строк)
**Назначение.** Работа с коллекцией хоткеев из скриптов (шапка com_hotkeys.as:3): регистрация постоянных и временных горячих клавиш, привязанных к макросам аддинов или произвольным JScript-функциям. Объект `IHotKeys` отдаётся аддинам как `designer.hotkeys` (глобальное `hotkeys`, см. addins/std/hotkeys.js:85-110).

**Инициализация.** Пакетов нет; объект `IHotKeys` создаётся в конструкторе `Designer` (com_designer.as:56). Сама механика перехвата клавиатуры (нативные `addHotKey`/`addTempHotKey`/…) реализована в snegopat.dll; файл — только обёртка. `OptionsEntry` нет.

**Типы.**

### `class IHotKey` (com_hotkeys.as:11-53)
Один хоткей. Поля: `protected uint hotKey = 0, id = 0; string _addin; string _macros;` (видимые аддину свойства: `_addin`/`_macros` отдаются как read-only `addin`/`macros`). Методы:
- `string get_presentation()` (16-18) — строковое представление хоткея: `hotKeyPresentation(hotKey)` (нативная функция snegopat.dll);
- `uint get_key()` (19-21) — код клавиши;
- `void set_key(uint newVal)` (23-31) — смена клавиши: снимает старую (`removeHotKey(id)`, `id = 0`), запоминает новую и регистрирует `id = addHotKey(hotKey, HotKeyHandler(this.handler))` при `newVal > 0`;
- `void setCommand(const string& newAddin, const string& Macros)` (33-36) — задать команду хоткея (уникальное имя аддина + имя макроса);
- `uint _setTempHotKey(uint key)` (37-41) — регистрация как временного (`addTempHotKey`); имя начинается с `_` — аддинам не отдаётся, используется `addTemp`;
- `protected bool handler()` (42-52) — вызов по нажатию: ищет аддин `oneAddinMgr.byUniqueName(_addin)` (при неудаче `Message("Аддин … не найден")` и false), выполняет `addin.invokeMacros(_macros)`; если результат — `VT_BOOL` со значением `VARIANT_FALSE`, возвращает false (иначе true — флаг «клавиша обработана»).

### `class IHotKeys` (com_hotkeys.as:56-105)
Коллекция. Поле `protected array<IHotKey&&> hotkeys`. Методы:
- `IHotKey&& item(uint Idx)` (59-63) — хоткей по индексу (или `null`);
- `uint get_count()` (65-67);
- `void remove(uint Idx)` (69-74) — снимает клавишу (`hotkeys[Idx].set_key(0)`) и удаляет элемент;
- `IHotKey&& add(uint Key, const string& addinName, const string& Macros)` (76-82) — добавить постоянный хоткей;
- `void clearAll()` (84-87) — очистить коллекцию и снять все хоткеи (`clearAllHotKeys()`);
- `uint addTemp(uint Key, const string& addinName, const string& Macros)` (89-93) — временный хоткей (до `removeTemp`), возвращает id;
- `void removeTemp(uint hkID)` (95-97) — `removeHotKey(hkID)`;
- `uint addTempFunction(uint Key, IDispatch&& disp, const string& name = "")` (98-101) — временный хоткей на произвольную JScript-функцию (через `TempHotKeyFunction`), `name` — имя метода (пустое — метод по умолчанию);
- `string hotKeyToString(uint code)` (102-104) — код клавиши → строка.

### `class TempHotKeyFunction` (com_hotkeys.as:107-131)
Временный хоткей на диспетчер-функцию: поля `IDispatch&& pDisp; string name;`; `uint assignKey(uint Key, IDispatch&& disp, const string& n)` (110-114) — регистрирует `addTempHotKey(Key, HotKeyHandler(this.handler))` и возвращает id; `bool handler()` (115-130) — разрешает dispid (`findMember` или 0), вызывает `pDisp.call(dispid, {})`, конвертирует результат через `var2val` + `Value.getBoolean` и возвращает его как «обработано».

**Функции файла.** Нет свободных функций.

**Перехваты.** Нет (клавиатура перехватывается нативной частью; файл лишь регистрирует обработчики).

**Используемые API.** Нативные функции snegopat.dll: `addHotKey`, `removeHotKey`, `addTempHotKey`, `clearAllHotKeys`, `hotKeyPresentation`, класс-функтор `HotKeyHandler`; `oneAddinMgr` (addins.as:7), `Addin.invokeMacros`, `Message`, `Variant` (`VT_BOOL`/`VARIANT_FALSE`), `var2val`.

**Взаимодействия.** Предоставляет `IHotKeys` (поле `Designer._hotkeys`) и `IHotKey`/`TempHotKeyFunction`; главный потребитель — стандартный аддин hotkeys.js (загрузка хоткеев из настроек: `hotkeys.add(KeyCodes.codeFromString(...), ...)`, `hotkeys.clearAll()`). Макросы вызываются через менеджер аддинов (addins.as).

**Версионные ветки.** Нет.

**Особенности.** `set_key` при перерегистрации сначала снимает старую клавишу — иначе дублирование; временные хоткеи идентифицируются числовым id, постоянные — объектом в коллекции; результат макроса `false` «проглатывает» нажатие (возврат false из хука клавиатуры).

---

## com_profile.as (282 строки)
**Назначение.** Обёртка для работы с деревом настроек 1С из аддинов (шапка com_profile.as:3): единый интерфейс `ProfileStore` над платформенными хранилищами настроек (профиль 1С) и собственным файловым хранилищем Снегопата (settings_store.as). Объект отдаётся аддинам как `designer.profileRoot` (глобальное `profileRoot`, см. std.js:19 `profileRoot.getValue("CmdLine/OriginalCmdLine")`).

**Инициализация.** Пакетов нет; корневой объект создаётся в конструкторе `Designer`: `&&_profileRoot = ProfileStore(getProfileRoot())` (com_designer.as:54) — папка профиля из `IProfileService.getProfileRoot()` (profile.v:97). Глобальные переменные файла: `uint profileChangeCounter = 0` (com_profile.as:48). `OptionsEntry` нет.

**Типы.**

### `enum ProfileStoreType` (com_profile.as:19-27)
`pflSeanse = 0, pflComputer = 1, pflBase = 2, pflBaseUser = 3, pflCompBase = 4, pflCompBaseUser = 5, pflSnegopat = 6`.
Шапка файла (com_profile.as:10-18) документирует, **куда реально попадают значения** (проверено на 8.3.27 записью новых ключей + flush + перезапуск, 2026-10-12):
- `pflSeanse` — только на время сеанса, не сохраняется;
- `pflComputer` — файл `%APPDATA%\1C\1cv8\1cv8.pfl` (компьютер + пользователь Windows, общий для всех Конфигураторов и баз);
- `pflBase` — не в файле: в самой информационной базе (SQL), переживает перезапуск; одно на базу для всех компьютеров;
- `pflBaseUser` — в информационной базе, на пользователя базы;
- `pflCompBase` — файл `%APPDATA%\1C\1cv8\<id базы>\1cv8.pfl` (свои у каждого Конфигуратора/базы: протокол отладки, пути);
- `pflCompBaseUser` — файл `%APPDATA%\1C\1cv8\<id базы>\<id>\1cv8.pfl` (точки останова, закладки);
- `pflSnegopat` — свои файлы `data\Snegopat\settings\*.set` (settings_store.as), общие для всех Конфигураторов и баз этой установки; платформенный профиль не участвует.
Рекомендация из комментария: настройки «свои у каждой базы на этом компьютере» → `pflCompBase`; общие для всех баз → `pflSnegopat` или `pflComputer`.

### `class ProfileStore` (com_profile.as:57-282)
Поля: `protected IProfileFolder&& folder` (платформенная папка, может быть `null` для корня собственных настроек); `protected string prefix` — путь этой папки от корня профиля (com_profile.as:59; по нему значения направляются в свои файлы настроек).

Методы (как видит аддин; у корня `prefix == ""`):
- `string get_name()` (72-76) — имя раздела: для `null`-folder — `prefix`, иначе `folder.getName()`;
- `void createValue(const string& path2value, const Variant& defaultValue, ProfileStoreType storeType)` (78-103) — создать значение: для `pflSnegopat` пишется только в свои файлы (`settingsPut` c внутренним представлением `Value.toString`; если значение уже есть — не трогается) и платформенный профиль не помечается изменённым; иначе: если значение уже существует — оно **удаляется и переиспользуется** (`folder.deleteValue` + сохранение старого `existVal`, т.е. повторное создание не затирает значение по умолчанию), если нет — конвертация `var2val(defaultValue)`; затем `folder.createAndSetValue(strPath, guidOfStore(storeType), val)`; `profileTouched("createValue …")`;
- `Variant getValue(const string& path2value)` (105-124) — сначала свои файлы (`ownHas` → `settingsGetInternal` → `valueFromString` → `val2var`), иначе платформенная папка (`folder.getValue` → `val2var`); пустой Variant, если нет;
- `void setValue(const string& path2value, Variant value)` (126-141) — симметрично: свои файлы (`val.toString` + `settingsPut`) или `folder.setValue` + `profileTouched`;
- `uint get_changeCount()` (143-145) — счётчик изменений профиля через обёртку (общий для всех разделов); аддин profile_autosave.js пишет профиль на диск только когда счётчик растёт (и спустя паузу после последнего изменения) — см. комментарий com_profile.as:47;
- `uint get_valuesCount()` (192-194), `string valueName(uint idx)` (196-199), `Variant getValueAt(uint idx)` (201-207), `void setValueAt(uint idx, Variant value)` (209-213) — перечисление значений;
- `void deleteValue(const string& name)` (215-223) — удаляет и из своих файлов (`settingsRemove`), и из платформы; `void deleteValueAt(uint idx)` (225-229);
- `void createFolder(const string& folderName, ProfileStoreType storeType)` (231-238) — для `pflSnegopat` no-op (в своих файлах папки существуют неявно — по ключам, комментарий 233); иначе `folder.createFolder` + `profileTouched`;
- `uint get_foldersCount()` (240-242), `ProfileStore&& getFolder(const string& path2folder)` (244-256) — вложенная папка: `folder.getFolder`; если платформенной нет, проверяется наличие детей в своих файлах (`settingsChildren`), иначе `null`; `ProfileStore&& getFolderAt(uint idx)` (258-263);
- `void deleteFolder(const string& name)` (265-275) — удаляет значения своих файлов внутри раздела (`settingsRemove` по списку `settingsChildren`) и платформенный раздел; `void deleteFolderAt(uint idx)` (277-281);
- protected `array<string>&& valueNames()` (147-167) и `array<string>&& folderNames()` (168-190) — объединённые списки: сначала свои (из `settingsChildren(prefix, vs, fs)`), затем платформенные (`folder.valuesCount()`/`getValueKeyAt(i)` и `folder.foldersCount()`/`getFolderAt` → `getName()`), дубли отфильтровываются сравнением без учёта регистра (`diagLower`).

**Функции файла.**
- `const Guid& guidOfStore(ProfileStoreType pfs)` (29-45) — маппинг типа хранилища на GUID платформенных хранилищ: `gpflComputer {E98B896D-2869-4A03-9E8A-AA5D2DBC3BD8}`, `gpflBase {934D1821-2523-4BD7-931C-AF004304A04C}`, `gpflBaseUser {620610F5-6E66-4324-B873-F5A6C0B41CA8}`, `gpflCompBase {4F3C15E7-6D26-4329-B0B9-D949EB88EF81}`, `gpflCompBaseUser {9198936F-CF98-4479-A644-3892A8691B52}`, `gpflSnegopat {1C0D6B14-76F4-49d7-AC4E-77948702D9A1}` (profile.v:83-88); для `pflSeanse` и неизвестных — `IID_NULL`.
- `void profileTouched(const string& what)` (51-55) — любое изменение профиля через обёртку: инкремент `profileChangeCounter` + при включённой трассировке `diagTraceOn("prof")` запись `dbgLog("профиль изменён: " + what)` (категория prof — «кто и что пишет»; нужно, чтобы находить источники лишних записей профиля: каждая запись заставляет profile_autosave делать flush платформы, а он блокирует главный поток на секунды — комментарий com_profile.as:49-50).

**Перехваты.** Нет (перехват открытия профиля платформы — в main.as, `IProfileService_openTrap`).

**Используемые API.** `IProfileFolder` (profile.v:5; методы `getName`, `getValue`, `setValue`, `deleteValue`, `createAndSetValue`, `createFolder`, `deleteFolder`, `getFolder`, `getFolderAt`, `valuesCount`, `getValueKeyAt`, `foldersCount`), `getProfileRoot()` (profile.v:97), GUID-константы хранилищ (см. выше), `valueFromString` (value.v:262-266), функции settings_store.as: `settingsHas` (268), `settingsGetInternal` (272), `settingsPut` (281), `settingsRemove` (286), `settingsChildren` (292), `var2val`/`val2var`, `diagTraceOn`/`diagLower`/`dbgLog` (diag.as).

**Взаимодействия.**
- Предоставляет: класс `ProfileStore` (поле `Designer._profileRoot` → аддинское `profileRoot`); счётчик `profileChangeCounter` (его читает свойство `profileRoot.changeCount`, использует addins/std/profile_autosave.js); `profileTouched` вызывается только внутри самого класса.
- Потребляет: settings_store.as (все `settings*`), options.as (косвенно — движковые опции лежат в разделе `Snegopat/Settings` тех же файлов), diag.as, com_designer.as (создание корня).
- Отличие от com_snegopat.getStockTextIndent: тот читает платформенный профиль напрямую через `IProfileService` в обход обёртки.

**Версионные ветки.** Нет.

**Особенности.** Гибридная модель: каждое значение сначала ищется в собственных файлах Снегопата и только потом в платформенном профиле — так миграция/переопределение настроек не трогает профиль 1С; `createValue` при существующем значении сохраняет старое (защита от затирания настроек при обновлении аддина); значения в своих файлах хранятся во внутреннем представлении 1С (`Value.toString` / `valueFromString`); фильтр дублей имён регистронезависимый, но возвращаются имена в оригинальном регистре; `profileTouched` намеренно не вызывается для `pflSnegopat` (свои файлы не требуют flush платформы).

---

## com_debug.as (173 строки)

**Назначение.** Исследовательский/экспериментальный файл работы с отладчиком 1С (шапка: «Реализация работы с отладчиком 1С»). Функционально это **черновик**: классы-заготовки результатов вычисления отладочного выражения, зондирование событий отладчика, перехват установки внешнего вычислителя и dump'ы vtable; ключевой метод `eval()` реализован только наполовину — рабочая цепочка вычисления закомментирована, метод всегда возвращает `null`. В продакшн-поверхности SnegAPI объект не участвует.

**Инициализация.** Пакетов и OptionsEntry нет; глобальные объекты не создаются (класс `IV8Debugger` нигде не инстанцируется в движке).

**Типы.**

- `class IDebugEvalProp` (строки 11-17) — описание свойства результата вычисления: поля `_name` (имя), `_value` (значение), `_typeCode` (код типа), `_type` (название типа), `_expandable` (можно развернуть дальше). Методов нет — структура данных.
- `class IDebugEvalResult` (20-30) — результат вычисления отладочного выражения: `_sucessed` (успех; опечатка «sucessed» из оригинала), `_value`, `_typeCode`, `_type`, `_propCount`; единственный метод `IDebugEvalProp&& prop(int idx)` (27-29) — **заглушка, всегда возвращает `null`**.
- `class IDebugEventReceiver` (32-43) — приёмник событий отладчика: `void onEvent(const Guid&in eventID, long val, IUnknown& obj)` (33-42) — приводит `obj` к `IExternalCalculatorDebugger&&`, пишет в журнал `doLog("Debug event " + eventID + " val=" + val + " obj=" + _obj + (…have calc…))`; вызов `DebugBreak()` закомментирован.

**Функции/перехваты файла.**
- `TrapVirtualStdCall trSetCalc` (45) и хук `IExternalCalculatorOwner_setExternalCalculatorTrap(IExternalCalculatorOwner& pThis, IUnknown& calc)` (46-56): печатает «Set calc»/«Has debug calc»/«No debug calc», пытается привести `calc` к `IExternalCalculatorDebugger`, вокруг вызова оригинала `pThis.setExternalCalculator(calc)` — пара `trSetCalc.swap()`. Ловит момент, когда платформа устанавливает внешний вычислитель отладчика.
- `class IV8Debugger` (59-116):
  - Конструктор (60-94) — сплошное зондирование: подписывает `IDebugEventReceiver` (через `AStoIUnknown(…, IID_IEventRecipient)`) в `IEventService` (`getEventService()`) на 10 событий: `kExecutionStateEvent`, `kExecutionStateMediumOpen`, `kExecutionStateMediumClose`, `kRestartApplication`, `kDebuggerAppWaitStart`, `kDebuggerAppWaitStop`, `kDebuggerGetDebugProcessMode`, `kDebuggerStopDebugMode`, `kSomeEvent3`, `kSomeEvent6`; получает `IDebugService` (`currentProcess().getService(IID_IDebugService)`), достаёт отладчик `serv.getDebugger()` (печать vtable-указателя `mem::dword[u.self]` и `dumpVtable(&&u, "dbg")`); создаёт объект `CLSID_Watch` («Has watch vt=…»/«No watch»); пытается получить `IExternalCalculatorOwner` и на нём ставит перехват `IExternalCalculatorOwner_setExternalCalculator` → `IExternalCalculatorOwner_setExternalCalculatorTrap` (91).
  - `IDebugEvalResult&& eval(const string& expression)` (96-115) — «Вычислить отладочное выражение»: готовит `Vector` на один указатель (`vec.alloc(1, sizeof_ptr)`, слот обнулён целиком под x64, комментарий 99), создаёт `ICalcValueCreator` (`createByClsid(CalcValueCreator, IID_ICalcValueCreator, cv)`), вызывает `cv.create(uk, expression)` — и на этом заканчивается: блок с `calculateBig` → `IDebugParser` → `IPersistableObject::deserialize` → заполнение `DebugEvalResult` закомментирован (104-113), возвращается `null`.

**Используемые API.** `getEventService()`/`IEventService::subscribe`, `currentProcess().getService/createByClsid`, интерфейсы `IDebugService`, `ICalcValueCreator`, `IExternalCalculatorOwner`/`IExternalCalculatorDebugger`, `IEventRecipient`; константы `CLSID_Watch`, `CalcValueCreator`, `IID_IDebugService`, `IID_ICalcValueCreator`; `AStoIUnknown`, `dumpVtable`, `mem::dword`, `doLog` (diag.as), `Print`.

**Взаимодействия.** Ни один другой файл движка не использует `IV8Debugger`/`IDebugEvalResult`; файл замкнут на себя и на инфраструктуру (diag, dumpVtable).

**Версионные ветки.** Нет.

**Особенности.** (1) Незавершённая функциональность: `eval()` всегда `null`, `prop()` всегда `null` — реальная цепочка (включая `IExternalCalculatorDebugger::calculateBig` и десериализацию результата) оставлена в комментарии с расшифровкой интерфейсов и вектора вызовов (118-142). (2) В хвосте файла — заметки реверса: дампы `.rdata` GUID-ов отладчика 1С (DebugTarget, сервис, выдающий `IDebugger`, объект `IExecutionStateMediumOutStream`) и мангл-подобные описания интерфейсов `IExternalCalculator` `{B18EF1A3-…}` / `IExternalCalculatorDebugger` `{1A7E4120-…}` — рабочий материал для будущего переноса. (3) Подписка на события и перехваты в конструкторе выполняются при создании объекта — но объект никем не создаётся, т.е. файл безопасно «спит»; включение работ — создать экземпляр (сейчас это приведёт и к диагностическим `Print`-ам, и к живому перехвату вычислителя).

---

## Связи внутри группы

**Каркас: com_designer.as.** Единственный экземпляр `Designer` создаётся пакетом `pkAddinMgr` (piOnFirstIdle, addins.as:23) и:
- создаёт объекты всех остальных файлов группы: `Snegopat` (com_snegopat.as), `IHotKeys` (com_hotkeys.as), `IEventConnector` (com_events.as), `V8Files` (com_files.as), `CommandService` (com_commands.as), `ProfileStore` (com_profile.as), а также `IV8Windows`, `IV8MetaData`, `Develop`, `WinApi` из соседних файлов группы SnegAPI (com_windows.as, com_metadata.as, develop.as);
- подключает их аддинам как глобальный именованный элемент `Designer` (scriptLoader.as:37) — поля с `_` становятся read-only свойствами `snegopat`, `hotkeys`, `events`, `v8files`, `cmdService`, `profileRoot` и т.д., а через флаг `global=true` — просто глобальными именами в JScript;
- запускает финальный уровень пакетов `initPackets(piOnDesignerInit)` (com_designer.as:78) — после этого уровня работает пользовательский слой аддинов (`std/main.js` и далее);
- стреляет событиями аддинам через `IEventConnector.fireEvent`: `beforeExitApp`, `onExitApp`, `onLoadAddin`/`onUnLoadAddin`, `onIdle`, `createTextWindow`, `onSelectFile`, `Broadcast`.

**com_events.as ↔ com_designer.as.** `IEventConnector` — шина, через которую Designer рассылает свои события; при этом сам конструктор `IEventConnector` ставит перехват `trSendCommand` на `ICommandReceiver.transmitCommand`, превращающий команды платформы в события `"<uuid>-<номер>"` (подписка — `events.addCommandHandler`). Хук пользуется полями Designer (`_develop.cmdTrace`) и `mainmenu.as` (`mainMenuOnCommand` — пункты собственного меню не уходят в платформу). Функции `getCommandState`/`getCommandStateRecv` из com_commands.as (обёртки над mainframe.as) — «читающая» половина той же командной подсистемы: их результат `ICmdUpdateResult` возвращает и `Designer.getCmdState`.

**com_snegopat.as.** Самодостаточный сервисный объект, но завязан на состояние редактора (`activeTextWnd`, `textDocStorage`, `allModuleElements` — textwnd.as/ModuleElements.as), интеллисенс (`intellisite.as`, `mlist.as`), опции (`optionList` из options.as), диагностику (diag.as) и файловые настройки (settings_store.as). Диагностический блок `coloring*` — клиент вентилей раскраски, установленных sqlcolors.as (нативные dll snegopat_colors*.dll); сам перехватов не ставит. Аддины дёргают его как `snegopat.activeTextWindow()`, `snegopat.showMethodsList()` и т.п.

**com_files.as.** Обёртки над файловой подсистемой платформы (file.v/url.v); класс `ExceptionCatcher` из него переиспользуется в forms.as; `MemoryBuffer` — общий байтовый тип между `V8Files` и `IV8DataFile`.

**com_hotkeys.as.** Тонкая обёртка над нативным реестром хоткеев snegopat.dll; макросы исполняются через менеджер аддинов (`oneAddinMgr.byUniqueName(...).invokeMacros(...)`, addins.as), т.е. замыкается на com_designer.as → AddinMgr. Пользователь — аддин hotkeys.js.

**com_profile.as.** Гибрид платформенного профиля (`IProfileFolder`, profile.v) и собственного файлового хранилища settings_store.as; корень создаётся в Designer. Счётчик `profileChangeCounter` — контракт с аддином profile_autosave.js (запись профиля по изменению с паузой, а не по таймеру). Диагностика изменений — через diag.as (`diagTraceOn("prof")`).

**Общие точки с остальным движком:** конструктор `Designer` подписывается на списки exitApp.as (`exitAppHandlers`, `beforeExitAppHandlers`) и mainframe.as (`idleHandlers`), устанавливает три перехвата (com_exported_count в core82/83.dll, QueryInterface для конвертации глобальных контекстов, `IBkEndUI.GetFileName`), заполняет кэш имён типов 1С (`fillTypeNames`) и держит IPC-канал со стартером (`StarterInterProcess`, файл starter/src/ipc/ipc.as — вне группы engine/). Из группы наружу аддинам дополнительно видны объекты com_windows.as (`windows`), com_metadata.as (`metadata`), develop.as (`develop`) — они входят в ту же «корневую» поверхность SnegAPI, но документируются в своих группах.
