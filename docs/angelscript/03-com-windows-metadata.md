# COM-обёртки для аддинов: окна Конфигуратора, текстовое окно, метаданные, type info, значения 1С, SQLite

Документ описывает 6 файлов группы «COM-обёртки данных» движка Снегопата (папка `snegopat-client/x64/modules/snegopat/engine/`):
`com_windows.as`, `com_textwindow.as`, `com_metadata.as`, `com_v8ti.as`, `com_v8value.as`, `com_sqlite.as`.

Это второй эшелон SnegAPI: если файлы группы 02 (`com_designer.as` и соседи) образуют «корень» (`Designer` и его непосредственные поля), то здесь — обёртки над **данными и окнами платформы**, которые аддин получает через этот корень: `windows` и `metadata` — поля `Designer` (read-only свойства без подчёркивания: `_windows` → `windows`, com_designer.as:41-42), `snegopat.activeTextWindow()` (com_snegopat.as:107) и событие `createTextWindow` (com_designer.as:375-379) отдают `ITextWindow`, `Designer.toV8Value(...)` (com_designer.as:190-192) отдаёт `V8Value`, `Designer.sqliteOpen(...)` (com_designer.as:346-357) отдаёт `SqliteBase`. Объекты этих файлов создаются **в конструкторе `Designer`** (com_designer.as:58-59: `&&_windows = IV8Windows(); &&_metadata = IV8MetaData(0);`), т.е. внутри пакета `pkAddinMgr` уровня `piOnFirstIdle` — собственных пакетов `Packet(...)` ни один из 6 файлов не имеет.

Маршалинг AngelScript ↔ IDispatch подчиняется правилам из шапки com_designer.as:5-26 (дословно воспроизведены в 02-com-designer.md): `get_XXX`/`set_XXX` отдаются как свойства `XXX`; protected/private члены и члены, начинающиеся с `_` (методы) или `__` (свойства), скриптам не видны; public-свойства с начальным `_` видны как read-only без подчёркивания; `array<T>` на выходе превращается в IDispatch со свойством `length` и методом `item(idx)`. Ниже для каждого класса перечислены имена, **как их видит JScript-аддин**.

Все файлы начинаются строками `#pragma once` + `#include "../all.h"` — `all.h` собирается препроцессором из всех `.as` движка (в репозитории его нет), поэтому свободные функции любого файла видны всем остальным без явных объявлений.

---

## com_windows.as (873 строки)
**Назначение.** Работы из аддинов с окнами 1С (шапка, com_windows.as:3). Реализует объект `windows` SnegAPI (класс `IV8Windows`, виден аддинам как `windows` / `designer.windows`) — управление заголовками главного окна, видимостью окна свойств, доступ к MDI-дереву отображений (`IV8View`), текущему модальному режиму, активному/фокусному отображению. Дополнительно файл содержит три перехвата платформенных вызовов (смена заголовка, `MsgBox`, `Message`), превращающие их в события для аддинов, и утилиты извлечения объекта метаданных из отображения (`getMdObjFromView`, `getMdPropIDFromView`), которыми пользуется и подсистема md-обёрток. «Пока частичная» реализация — комментарий com_windows.as:12.

**Инициализация.**
- Пакетов `Packet(...)` нет. Объект создаётся в конструкторе `Designer` (com_designer.as:58).
- Конструктор `IV8Windows()` (com_windows.as:14-21): создаёт глобальный диспетчер `IDispatch&& dspWindows = createDispatchFromAS(&&this)` (глобальная переменная com_windows.as:10 — он же источник событий, см. ниже); ставит перехваты `setTrapOnChangeTitle()`, `setTrapOnMsgBox()`, `setTrapOnMessage()`; регистрирует `clearViewMap` в `idleHandlers` (mainframe.as:154) — периодическая чистка кэша обёрток закрытых окон.
- `OptionsEntry` в файле нет.

**Типы.**

### `class IV8Windows` (com_windows.as:13)
Наследования нет. Все члены public, кроме перечисленных `get_/set_`-свойств — они тоже видны, но как свойства. Виден аддинам как объект `windows`.
- `IV8View&& get_mainView()` (23) — основное окно: `mdiView.parent`.
- `IV8View&& get_mdiView()` (27) — контейнер MDI-окон: `getViewWrapper(gMDIClientID)` (GUID-константа gMDIClientID {33ECE94C-5FB9-4540-9B97-C874FD45AE08}, window.v:405).
- `ModalStates get_modalMode()` (31-36) — текущий модальный режим платформы `getBkEndUI().currentModalState()`, **с частным случаем**: если открыт диалог «Методы модуля» (`methodsDialog !is null && methodsDialog.opened`, глобальная из mlist.as:315), возвращает `msModal` — диалог для платформы не модален, но аддины (textEditorExt и др.) по этому признаку не трогают модуль под ним.
- `string get_caption()` / `void set_caption(const string&)` (38-57) — полный заголовок основного окна через WinAPI `GetWindowTextLength`/`GetWindowText`/`SetWindowText` на `mainFrame.unk`→`IWindow.hwnd()`; пустая строка, если `mainFrame` ещё не пойман.
- `string get_mainTitle()` / `set_mainTitle` (59-68) — основная часть заголовка: `mainFrame.getTitle()/setTitle()`.
- `string get_additionalTitle()` / `set_additionalTitle` (70-79) — дополнительная часть заголовка: `mainFrame.getAdditionalTitle()/setAdditionalTitle()`.
- `bool get_propsVisible()` / `set_propsVisible(bool)` (81-88) — видимость окна свойств: `currentProcess().getService(IID_IPropertyService)` → `IPropertyService.isPropWndVisible()/showPropWnd(bVisible)`.
- `IV8View&& getActiveView()` (90) — активное отображение: `frameView(ActiveViewInCoreFrame)`.
- `IV8View&& getFocusedView()` (94) — отображение в фокусе: `frameView(FocusedViewInCoreFrame)`.
- `string getInputFieldText(const Variant& ctrl)` (100-119) — текущий текст поля ввода на форме **без ожидания потери фокуса**. На вход — ЭУ (например, `Форма.ЭлементыФормы.ИмяКонтрола`): `var2val` → `IControlContext` из `Value.pValue` → `ctx.getControl(unk, IID_IFldEdit)` → `IDataControl.getValue(val)` → `val.getString(res)`.

### `enum ViewContainerType` (com_windows.as:137-144)
`vctNo = 0`, `vctTabbed = 1`, `vctTwoViewsHorz = 2`, `vctTwoViewsVert = 3`, `vctMdiContainer = 4`, `vctUnknown = 5` — тип контейнера, возвращаемый `IV8View.isContainer`.

### `class IV8View` (com_windows.as:285)
Обёртка одного отображения (view) платформы. Поле `Guid __id` (286) — идентификатор `IFramedView` (два подчёркивания — наружу не отдаётся). Конструктор `IV8View(const Guid& i)` (287).
- `IFramedView&& _getView(bool throwComError = true)` (290) — внутренний метод (имя с `_` — аддинам не виден): `mainFrame.getView(view, __id)`; если view нет и `throwComError` — `setComException("Отображение уже не существует")`.
- `bool isAlive()` (297) — живо ли отображение (`_getView(false) !is null`).
- `string probe()` (301) — диагностика (редактор форм): адрес view + `probeIfaces(v.unk)` (probe_ifaces.as:5), затем для документа (`IDocumentView.document`) — адрес и интерфейсы документа + `dbgDumpVT(doc.self, 41)` (diag.as:467, тег 41).
- `string get_id()` (317) — `__id` как строка.
- `string get_title()` (320) — `v.title().str`.
- `uint get_hwnd()` (324) — **только до 8.3.12**: через `IWindowView.hwnd()` или `IWindow.hwnd()`; на 8.3.12+ всегда возвращает 0 (ветка `#if ver < 8.3.12`, 325-335).
- `IV8ViewPosition&& position()` (338) — позиция отображения: `IContainedObject.getSite()` → `IFramedViewSite.getViewPosition(vp.vp)`; возвращает обёртку.
- `IV8View&& get_parent()` (352) — родитель: `getViewParentID(v, pid)` → `getViewWrapper(pid)`.
- `array<IV8View&&>&& enumChilds()` (361-466) — непосредственные потомки. Берёт `IViewLayouter` из view и разбирает три частных случая: `ITabbedLayouter` (перебор `pagesCount()`/`page(i)`, страницы, за которыми уже закрывается окно, пропускаются — платформа отдаёт пустой указатель, комментарий 377); `IViewSplitter` (`first()`/`second()`); `IMDIClient` (обход вектора гуидов `mdi.childsIds.start..end` через `toGuid`, добавление `insertAt(0, ...)` — т.е. в обратном порядке). Для неизвестного контейнера (417-461) — перебор **всех** потомков через `vl.enumAllChilds(views, true)` с ручным обходом списка `ViewContextList` (узлы `ViewContextListNodeRef`, память узлов освобождается `free(del)`, 457-459) и фильтрацией: потомок добавляется, только если его родитель (`getViewContext(pContext).ref.parent`) равен данному view; дубликаты отсекаются `NoCaseSet ids`. Обильно instrumentировано диагностикой `diag("mdi", ...)`/`dbgLog` с чтением памяти `mem::int_ptr` (подозрительные векторы гуидов, 400-409).
- `void merge(IV8View&& other, ViewPlacements place)` (467) — пристыковать другое отображение: `site.canSplit()` → `site.split(vo, place, true, -1)`.
- `ViewContainerType get_isContainer()` (481) — по наличию `ITabbedLayouter`/`IViewSplitter` (с учётом `isHorizontal()`)/`IMDIClient` у layouter'а.
- `string get_wndClass()` (505) — класс окна WinAPI: `GetClassName(hWnd, ...)` от `get_hwnd()` (на 8.3.12+ всегда пусто).
- `bool get_visible()` / `set_visible(bool)` (512-517) — `mainFrame.isViewVisible(__id)` / `mainFrame.showView(__id, vis)`.
- `IV8View&& get_activeChild()` (518) — активный потомок: `IViewLayouter.activeView()`, при неудаче `vl.activeTarget(at)` → `IViewContext` → `getID` → `getViewWrapper`.
- `void activate()` (549) — `mainFrame.activateView(__id)`.
- `void close(bool forceClose = false)` (552) — `mainFrame.closeView(__id, forceClose)`.
- `ICmdUpdateResult&& getCmdState(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = -1)` (555) — состояние команды у отображения: `ICommandReceiver recv = view.unk` → `getCommandStateRecv(CommandID(Guid(cmdGroupUUID), cmdNumber), subCommandIdx, recv)`.
- `bool sendCommand(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = 0)` (564) — выполнить команду у отображения: `sendCommandToCmdRecv(...)`.
- `IViewDocument&& getDocument()` (572) — документ отображения: `IDocumentView.document(doc)` → `getDocWrapper(doc)`.
- `Variant getObject()` (584) — 1С-объект отображения: `IDocument` как `Value.pValue` → `val2var` (например, открытый ТабличныйДокумент/макет).
- `IV8Form&& getInternalForm()` (602) — если view — форма: `IForm form = view.unk` → `IV8Form(form)` (класс из controls.as:124).
- `protected Variant pict; Variant get_icon()` (611-622) — иконка вкладки: `view.icon(unk)` → `image2pict(unk)` (com_metadata.as:1032), кэшируется в поле `pict`.
- `protected IV8MDObject&& myMdObj; IV8MDObject&& get_mdObj()` (623-631) — объект метаданных, редактируемый в этом окне: `getMDObjectWrapper(getMdObjFromView(view))`, кэшируется.
- `protected IV8MDProperty&& myMdProp; IV8MDProperty&& get_mdProp()` (632-640) — свойство метаданных: `getMDPropWrapper(mdService.mdProp(getMdPropIDFromView(view)))`.

### `class IV8ViewPosition` (com_windows.as:673)
Обёртка `ViewPosition vp` (window.v:282: `ViewStates state`, `ViewPlacements area`, `bool MDI_maxed`).
- `int get_state()` (676) — состояние (комментарий: «в документации свойства есть, но не были портированы (скрипты получали ошибку)»).
- `int get_area()` (680) — сторона прикрепления (ViewPlacements: 1 слева, 2 сверху, 4 справа, 8 снизу, 16 по центру, 32 закладками).
- `bool get_mdiMax()` (683) — максимизировано в MDI.

### `class IViewDocument` (com_windows.as:692)
Обёртка `IDocument` (создаётся `getDocWrapper`, 688-690).
- `bool saveToFile(const string& path)` (697) — сохранить документ в файл: открывает `IV8DataFile` через `oneDesigner._v8files.open("file://" + path, fomTruncate|fomIn|fomOut)` (V8Files из com_files.as), ставит C++-ловушку `CppCatch c("class core::Exception", ExceptionCatcher(catcher.handle))` и вызывает `doc.save(file.file)`; при исключении — `setComException(catcher.errStr)`, false.
- `bool loadFromFile(const string& path)` (711) — аналогично, `doc.load(file.file)` с `fomIn|fomShareRead`.

### `class ISetMainTitleHook` (com_windows.as:767)
Параметры события `onChangeTitles`: `string _mainTitle`, `string _additionalTitle` (public-поля с `_` → read-only свойства `mainTitle`/`additionalTitle`), `bool cancel = false` (отказ).

### `class IMsgBoxHook` (com_windows.as:819)
Параметры события `onMessageBox`: `string _caption`, `string _text`, `uint _type` (см. MsgBoxStyles), `uint _timeout`, `bool cancel = false`, `MsgBoxAnswers result` (результат при отказе).

### `class IMessageParams` (com_windows.as:869)
Параметры события `onMessage`: `string _text`, `MessageMarker _marker`, `bool cancel = false`.

**Функции файла.**
- `IV8View&& frameView(uint offset)` (122-135) — достать обёртку активного/фокусного отображения **через память**: `ITopLevelFrameCore tlc = coreMainFrame.unk`; `addrOfViewCont = mem::int_ptr[tlc.self + offset]` (смещения ActiveViewInCoreFrame/FocusedViewInCoreFrame — версионные константы window.v:377-395: 44/48 у старых, 52/56 у 8.3.x, 96/104 у новых); затем `ViewContextRef pCont = toViewContext(addrOfViewCont + ViewContextInView)` и `getViewWrapper(pCont.ref.id)`. Закомментированные `doLog`/`MsgBox` (124-129) — инструмент поиска этих смещений.
- `IV8View&& getViewWrapper(const Guid& id)` (148-156) — фабрика обёрток с кэшем `NoCaseMap<IV8View&&> viewWrappers` (147, ключ — строковое представление гуида); повторные запросы возвращают тот же объект.
- `void clearViewMap()` (158-166) — удаляет из `viewWrappers` записи, чьи `isAlive()` стали false; вызывается из `idleHandlers` (зарегистрирован в конструкторе IV8Windows, com_windows.as:20).
- `IMDObject&& getMdObjFromView(IFramedView&& view)` (168-245) — извлечь редактируемый объект метаданных из окна. Путь 1: view — `IDocumentView` → `IDocument doc`; `IConfigMngrUI ui = doc.unk`, при неудаче — `IConfigMngrUIOwner ow = doc.unk; ui = ow.getUI()`; если ui есть — вернуть `ui.getMDCont()` (IMDContainer наследует IMDObject — корневой объект конфигурации). Иначе, если `doc.getConfigMode()`: `IConnectionPointContainer.FindConnectionPoint(IID_IDocumentSink, pCP)`, из памяти точки подключения читаются `pdata = mem::int_ptr[pCP.self + sizeof_ptr]` и `size = mem::dword[pCP.self + 2 * sizeof_ptr]`; по элементам (в 8.3.27 — один sink прямо по `[pCP+8]`, см. «Версионные ветки») берётся `DocSinkRef` (struct из document.v:60: vtab/refCount/editHelper/propId), у которого `refCount < 10` (фильтр мусорных записей), у его `IMDEditHelper editHelper` — `getMDObj()`. Путь 2 (view — не документ, например дерево конфигурации): view приводится к `IEventRecipient` и `ICommandTarget`, проверяется `er.self < view.self` и ответ на `CommandID(cmdFrameGroup, cmdFindInTree)`; объект читается из памяти: `toIUnknown(mem::int_ptr[er.self + MetaDataObjInEventRecipientOffset])` + `obj.AddRef()` (смещение — версионная константа metadata.v:429-440: x86 32/24, x64 64/48 до/после 8.3.11). Обе ветки плотно instrumentированы `dbgLog`/`dbgOn` дампами памяти (193-206, 235-238).
- `Guid getMdPropIDFromView(IFramedView&& view)` (248-282) — UUID редактируемого свойства (например, модуля) тем же способом через `DocSinkRef.ref.propId`; вне конфигурационного режима возвращает `IID_NULL`.
- `ViewContextRef&& getViewContext(IViewContext&& ctx)` (643) — `toViewContext(ctx.self + ViewContextOffset)` (версионное смещение window.v:376-393: 64/56/112).
- `bool getViewParentID(IFramedView&& view, Guid& pid)` (651) — гуид родителя через `frameViewParent`.
- `IFramedView&& frameViewParent(IFramedView&& view)` (660) — родительский view: `IContainedObject.getSite()` → `IViewContext` → `getViewContext(ctx).ref.parent`.
- `IViewDocument&& getDocWrapper(IDocument&& d)` (688) — фабрика `IViewDocument` (без кэша).
- `void setTrapOnChangeTitle()` (729) — см. «Перехваты».
- `bool fireFrameTitleChanged(const string& mainTitle, const string& additionalTitle)` (754-762) — заполняет `ISetMainTitleHook`, оборачивает в диспетчер и вызывает `oneDesigner._events.fireEvent(dspWindows, "onChangeTitles", args)`; возвращает `param.cancel` — подписчик может сам изменить заголовок через `windows.caption` и отменить штатную установку (комментарий 764-766).
- `void setTrapOnMsgBox()` (779) / `int msgBoxTrap(...)` (783-817) — см. «Перехваты».
- `void setTrapOnMessage()` (836) / `int doMsgLineTrap(...)` (843-867) — см. «Перехваты».

**Перехваты.**
- `TrapVirtualStdCall trMainFrame_setTitle` (733) — `trMainFrame_setTitle.setTrap(coreMainFrame, ITopLevelFrame_setTitle, MainFrame_setTitle)` (730). Хук `void MainFrame_setTitle(ITopLevelFrame& frame, const v8string& str)` (737): вызывает `fireFrameTitleChanged(str, frame.getAdditionalTitle())`; если подписчики не отменили (`!cancel`) — вызывает оригинал через `trMainFrame_setTitle.getOriginal(&&original)`.
- `TrapVirtualStdCall trMainFrame_setAddTitle` (734) — слот `ITopLevelFrame_setAdditionalTitle`, хук `MainFrame_setAdditionalTitle` (745) — аналогично, но с переставленными аргументами (`frame.getTitle(), str`).
- `TrapVirtualStdCall trMsgBox` (778) — `trMsgBox.setTrap(getBkEndUI(), IBkEndUI_messageBox, msgBoxTrap)` (780). Хук `int msgBoxTrap(IBkEndUI& pUI, const v8string& text, int_ptr type, int_ptr timeout, int_ptr caption, int_ptr parent, mbp&inout param, int_ptr i1, i2, i3 [, i4, i5])` (783): **сначала снимает перехват** (`trMsgBox.swap()`) — иначе обработчики события, вызывающие MsgBox, зациклились бы (комментарий 789); если есть подписчики `onMessageBox` (`oneDesigner._events._hasHandlers(dspWindows, "onMessageBox")`) — заполняет `IMsgBoxHook` (строку заголовка достаёт `stringFromAddress(caption)`) и шлёт событие; при `params.cancel` — возвращает `params.result` без показа; иначе вызывает штатный `pUI.messageBox(...)` и возвращает результат; перехват восстанавливается обратным `swap()`.
- `TrapVirtualStdCall trMessage` (841) — `trMessage.setTrap(getBkEndUI(), IBkEndUI_doMsgLine, doMsgLineTrap)` (838). Хук `int doMsgLineTrap(IBkEndUI& pUI, const v8string&in text, int_ptr marker, const Guid&in g, int_ptr i1, IUnknown& pUnkObject, const V8Picture&in customMarker)` (843) — та же схема для `Сообщить()`/вывода в строку сообщений: событие `onMessage` с `IMessageParams` (`params._marker = MessageMarker(marker)`); при `cancel` возвращает 0; иначе штатный `pUI.doMsgLine(...)`.

**Используемые API.**
- Интерфейсы/константы v8api: `ITopLevelFrame`, `ITopLevelFrameCore`, `ITopLevelFrame_setTitle`, `ITopLevelFrame_setAdditionalTitle` (window.v:173-174, слоты генерируются из .v-описаний); `IBkEndUI_messageBox` (bkendui.v:49-56), `IBkEndUI_doMsgLine` (bkendui.v:103); `IFramedView`, `IFramedViewSite`, `IViewLayouter`, `ITabbedLayouter`, `IViewSplitter`, `IMDIClient`, `IViewContext`, `IContainedObject`, `IDocumentView`, `IDocument`, `ICommandReceiver`, `ICommandTarget`, `IForm`; `IWindow`/`IWindowView` (до 8.3.12); `IID_IPropertyService` {944F4464-B9FF-11D4-9436-004095E12FC7} (properties.v:4); `IID_IFldEdit` {4F663FCF-8942-4475-9E36-4D2ED7405F40} (text.v:171); `IID_IDocumentSink` {E7D5C730-A01E-11D4-84AF-008048DA06DF} (document.v:56); `IID_IMDObject` {12BFDDD0-36CC-11D4-940F-008048DA11F9} (metadata.v:108); `gMDIClientID` {33ECE94C-5FB9-4540-9B97-C874FD45AE08} (window.v:405); `CommandID(cmdFrameGroup, cmdFindInTree)`.
- Смещения/структуры памяти: `ActiveViewInCoreFrame`, `FocusedViewInCoreFrame`, `ViewContextInView`, `ViewContextOffset` (window.v:376-395), `MetaDataObjInEventRecipientOffset` (metadata.v:440), `DocSinkRef` (document.v:60), `ViewContextRef`/`ViewContextList`/`ViewContextListNodeRef`, `mem::int_ptr`/`mem::dword`, `free()`.
- Нативные хост-функции: `createDispatchFromAS`, `getBkEndUI()`, `currentProcess().getService()`, `getViewContext`, `setComException`, `getCommandStateRecv`/`sendCommandToCmdRecv`, `stringFromAddress`, `probeIfaces` (probe_ifaces.as:5), `dbgHex`/`dbgDumpVT`/`dbgLog`/`dbgOn` (diag.as), `diag` (diag.as).
- WinAPI: `GetWindowTextLength`, `GetWindowText`, `SetWindowText`, `GetClassName`.
- Объекты движка: `mainFrame`, `coreMainFrame` (mainframe.as:14,25), `methodsDialog` (mlist.as:315), `oneDesigner._events` (com_events.as), `idleHandlers` (mainframe.as:154).

**Взаимодействия.**
- Предоставляет аддинам: объект `windows` (поле `Designer._windows`) с событиями `onChangeTitles`, `onMessageBox`, `onMessage` (источник — `dspWindows`); классы `IV8View`, `IV8ViewPosition`, `IViewDocument` (доступны как возвращаемые значения), `IV8Form` возвращается из `getInternalForm`.
- Предоставляет движку: `getViewWrapper` (используется внутри файла), `getMdObjFromView`/`getMdPropIDFromView` — база для `IV8View.mdObj/mdProp` (com_windows.as:629,638) — md-обёртки из com_metadata.as; перехват `modalMode` используется `Snegopat.showMethodsList` (com_snegopat.as:131).
- Потребляет: com_metadata.as (`getMDObjectWrapper`, `getMDPropWrapper`, `mdService`, `image2pict`), controls.as (`IV8Form`), mainframe.as (`mainFrame`, `coreMainFrame`, `idleHandlers`), mlist.as (`methodsDialog`), com_events.as (`fireEvent`, `_hasHandlers`), diag.as/probe_ifaces.as (диагностика).

**Версионные ветки.**
- `#if ver < 8.3.12` в `IV8View.get_hwnd` (325-335) — до 12 релиза hwnd достаётся из `IWindowView`/`IWindow`, после — всегда 0 (хэндл окна стал указателем на объект `wbase::Window`, см. комментарий textwnd.as:496-497).
- `#if (ver >= 8.3.27 & ver < 8.3.28)` в `getMdObjFromView` (207-224) и `getMdPropIDFromView` (260-276) — в 8.3.27 точка подключения хранит **единственный sink прямо по `[pCP+8]`** (читается как `pdata`, `toDocSink(pdata)`); в остальных версиях `[pCP+8]` — указатель на массив из `size` сink'ов, перебираемых циклом.
- `#if ver >= 8.3` в сигнатуре `msgBoxTrap` и вызове `messageBox` (785-787, 810-812) — у `IBkEndUI.messageBox` с 8.3 два дополнительных параметра `i4`, `i5` (bkendui.v:49-56).

**Особенности.**
- Активное и фокусное отображения платформа наружу не отдаёт — они вычисляются чтением памяти по версионным смещениям (`frameView`, com_windows.as:122); комментарии-«искалки» смещений (124-129, 235-238) оставлены в коде.
- Фильтр `refCount < 10` при переборе `DocSinkRef` (210, 218) — эмпирический отсев невалидных записей точки подключения.
- В `enumChilds` для неизвестного контейнера память узлов, отработанных `enumAllChilds`, освобождается вручную `free(del)` (457-459), а сами элементы вставляются в начало массива — порядок обхода инвертируется.
- `get_modalMode` намеренно врёт про модальность при открытом диалоге методов (32-34) — поведенческий хак совместимости с аддинами.
- Кэш `viewWrappers` чистится только по idle; `IV8View` держит кэшированные `pict`, `myMdObj`, `myMdProp` (611-640) — устаревают молча при закрытии окна (спасает `isAlive`-чистка).
- Куча мёртвого диагностического кода (закомментированные `doLog`/`MsgBox`, дампы `mem::int_ptr` под `dbgOn()`).

---

## com_textwindow.as (219 строк)
**Назначение.** Обёртка для работы из аддинов с текстовым окном 1С (шапка, com_textwindow.as:3) — класс `ITextWindow` над внутренним `TextWnd` из textwnd.as. Это тот объект, который аддины получают как «окно модуля»: через `snegopat.activeTextWindow()` (com_snegopat.as:107-109), через событие `createTextWindow` (com_designer.as:375-379 — туда уходит `wnd.getComWrapper()`, textwnd.as:595-598) и через `metadata...openModule()` (com_metadata.as:578-617). Владелец данных — textwnd.as (`TextDoc`/`TextWnd`); файл содержит только COM-фасад.

**Инициализация.** Пакетов нет, глобальных объектов нет. Обёртка создаётся лениво: `TextWnd.getComWrapper()` (textwnd.as:595) при первом запросе кэширует её в поле `TextWnd.iwnd`. `OptionsEntry` нет.

**Типы.**

### `class Selection` (com_textwindow.as:10)
Простой value-объект позиции/выделения, отдаётся аддинам как результат `getSelection()`/`getCaretPos()`. Поля: `int beginRow`, `int beginCol`, `int endRow`, `int endCol`. Конструктор `Selection(const TextPosition& begin, const TextPosition& end)` (15) раскладывает `TextPosition.line/col` в поля (нумерация строк в TextPosition — с 0, но см. `setSelection` ниже).

### `class ITextWindow` (com_textwindow.as:24)
Поле `private TextWnd&& wnd` (25) — скрыто от аддинов. Конструктор `ITextWindow(TextWnd&& w)` (26). Методы (имена для JScript):
- `void _disconnect()` (29-36) — скрытый метод (`_`-префикс): отвязывает окно (`&&wnd = null`) и уведомляет аддинов: создаёт диспетчер себя, `oneDesigner._events.fireEvent(me, "TextWindowClosed", args)` с самим собой в аргументе, затем `removeMyListeners(me)` — снимает все подписки на события этого объекта. Вызывается из `TextWnd.onDestroy()` (textwnd.as:604-606).
- `bool get_isAlive()` (37) — окно ещё живо (`wnd !is null`).
- `string get_text()` (41) — полный текст: `wnd.textDoc.tm.save(text)` (TextManager.save в v8string).
- `Selection&& getSelection()` (50) — границы выделения: `wnd.ted.getSelection(begin, end, false)` (ted — `ITextEditor`).
- `void setSelection(int beginRow, int beginCol, int endRow, int endCol)` (59-86) — установить выделение: нормализует координаты (если начало после конца — меняет местами и запоминает `caretInStart = true`, 63-75), ставит каретку дважды (`setCaretPosition(begin/end, false)`), `ITextEditor.setSelection(begin, end, caretInStart, false)`, затем `ITextManager_Operations.updateAllViews()` на `wnd.textDoc.itm` — перерисовать все окна документа.
- `string get_selectedText()` (88) — `wnd.ted.getSelectionText(res)`.
- `void set_selectedText(const string& text)` (97) — `wnd.ted.setSelectionText(text)` + сброс кэша парсера: `ITextParserCache cache = wnd.textDoc.itm; cache.clearCache()` (100-103).
- `Selection&& getCaretPos()` (106) — `wnd.ted.getCaretPosition(tp, false)`, возвращается `Selection(tp, tp)`.
- `void setCaretPos(int row, int col)` (115) — `setCaretPosition(TextPosition(row, col), false)` + `scrollToCaretPos()`.
- `uint get_linesCount()` (122) — `wnd.textDoc.tm.getLinesCount()`.
- `string line(int lineNumber)` (128) — текст строки по номеру (нумерация **с 1**): `getTextLine(wnd.textDoc.tm, lineNumber).rtrim("\n")`.
- `bool get_readOnly()` (134-152) — только чтение. Два пути: если `wnd.isControl` (текстовый контрол, например поле ввода) — через `IContext ctx = wnd.textDoc.itm; ctx.getPropVal(0, val)` — свойство №0 «ТолькоЧтение» (комментарий 140); иначе `IDocument doc = wnd.textDoc.itm; doc.getReadOnly()`. Если окно мертво — true.
- `uint get_hwnd()` (154) — `wnd.hWnd` (0, если окно мертво). Внимание: до 8.3.12 это WinAPI HWND, после — указатель на объект `wbase::Window` (комментарий textwnd.as:497).
- `uint get_textMgr()` (158) — адрес внутреннего менеджера текста: `wnd.textDoc.tm.self`.
- `string extName()` (162-176) — имя выбранного расширения редактора: `ITextManager_Operations.getExtenderCLSID(extGuid)` → `getTxtEdtService().getExtender(ext, wnd.textDoc.itm, extGuid)` → `ext.getName()` (ITxtEdtExtender).
- `Variant get_textDocument()` (178-186) — проба: возвращает 1С-ный объект `ТекстовыйДокумент` (`wnd.textDoc.itm` как `Value.pValue` → `val2var`).
- `bool _multyEdit` (188) — public-поле с `_` → read-only свойство `multyEdit`; заглушка «todo Пока не делаю, присутствует для совместимости».
- `IV8MDContainer&& get_mdCont()` (191) — контейнер метаданных, если текст редактируется в составе метаданных: `getContainerWrapper(wnd.textDoc.mdInfo.container)`; иначе null.
- `IV8MDObject&& get_mdObj()` (197) — `getMDObjectWrapper(wnd.textDoc.mdInfo.object)`.
- `IV8MDProperty&& get_mdProp()` (203) — `getMDPropWrapper(mdService.mdProp(wnd.textDoc.mdInfo.mdPropUuid))`.
- `Variant get_extObject()` (209) — внешний объект из `wnd.textDoc.mdInfo.extObject` (Value → Variant). Поля `TextDocMdInfo` — textwnd.as:235-253 (object/container/extObject/mdPropUuid).

**Функции файла.** Свободных функций нет — файл состоит из двух классов.

**Перехваты.** Нет (все перехваты текстового редактора — в textwnd.as).

**Используемые API.** `TextWnd` (поля `ted` — ITextEditor, `textDoc` — TextDoc, `isControl`, `hWnd`; textwnd.as:492-502), `TextDoc` (`tm` — TextManager, `itm` — ITextManager, `mdInfo` — TextDocMdInfo; textwnd.as:268-274); интерфейсы `ITextEditor` (getSelection/setCaretPosition/setSelection/getSelectionText/setSelectionText/getCaretPosition/scrollToCaretPos), `ITextManager_Operations` (updateAllViews/getExtenderCLSID), `ITextParserCache` (clearCache), `IContext.getPropVal`, `IDocument.getReadOnly`, `ITxtEdtExtender.getName`, `ITxtEdtService getTxtEdtService()` (text.v:246); md-фабрики из com_metadata.as (`getContainerWrapper`, `getMDObjectWrapper`, `getMDPropWrapper`, глобальная `mdService`); `oneDesigner._events.fireEvent/removeMyListeners` (com_events.as); `createDispatchFromAS`, `val2var`/`var2val`, `getTextLine`, `load_module_wstring` — не используется здесь; `TextPosition`.

**Взаимодействия.**
- Предоставляет аддинам: `ITextWindow` (имя в SnegAPI — возвращаемое значение `snegopat.activeTextWindow()` и параметр события `createTextWindow`); события объекта: `TextWindowClosed`.
- Предоставляет движку: класс `ITextWindow` для `TextWnd.getComWrapper` (textwnd.as:595) и `Snegopat.activeTextWindow` (com_snegopat.as:107); метод `_disconnect` вызывается из `TextWnd.onDestroy`.
- Потребляет: textwnd.as (TextWnd/TextDoc/textDocStorage — косвенно), com_metadata.as (md-обёртки и `mdService`), com_designer.as (oneDesigner._events), com_snegopat.as/com_metadata.as возвращают его объекты (в т.ч. `IV8MDObject.openModule`, com_metadata.as:609).

**Версионные ветки.** Нет.

**Особенности.**
- Полная синхронизация всех окон документа после `setSelection` (`updateAllViews`) и сброс кэша парсера после замены текста — иначе редактор 1С показывает устаревшее.
- `line()` обрезает хвостовой `\n` (`rtrim("\n")`).
- `readOnly` для контролов читает «свойство №0» контекста — завязка на порядок свойств контекста контрола.
- После `_disconnect` все методы возвращают пустые значения/null, не падают — аддины обязаны проверять `isAlive`.
- `_multyEdit` и `mdCont/mdObj/mdProp/extObject` существуют «для совместимости» со старым Snegopat (комментарии 188-189).

---

## com_metadata.as (1101 строк)
**Назначение.** Работа с метаданными из аддинов (шапка, com_metadata.as:3). Реализует объект `metadata` SnegAPI (класс `IV8MetaData`, поле `Designer._metadata` → `metadata`) и всю иерархию md-обёрток: контейнер конфигурации (`IV8MDContainer`), объект (`IV8MDObject`), класс (`IV8MDClass`), описание свойства (`IV8MDProperty`), внешнее свойство (`IV8ExtProp`); события метаданных (`MetaDataEvent` → событие `MetaDataEvent`), конвертацию картинок 1С в VARIANT-картинки (`image2pict`), сериализацию объектов в файлы (`saveObject`/`loadObject`). Это самый большой файл группы.

**Инициализация.**
- Пакетов нет; объект создаётся в конструкторе `Designer` (com_designer.as:59: `&&_metadata = IV8MetaData(0);` — фиктивный параметр `int` для выбора конструктора).
- Конструктор `IV8MetaData(int)` (com_metadata.as:14-31): `&&mdService = getMDService()` (глобальная `IMDService&& mdService`, com_metadata.as:58); `oneMDTreeItemInfo.init()` (глобальная `MDTreeItemInfo oneMDTreeItemInfo`, com_metadata.as:675); сразу добавляет в список контейнер метаданных ИБ — `getContainerWrapper(getIBMDCont())`; контейнер редактируемой конфигурации — `getContainerWrapper(editedMetaDataCont())` (если конфигурация уже открыта); ставит перехват открытия конфигураций `setTrapOnOpenConfig()`; подписывается на события метаданных: `getEventService().subscribe(eventMetaData, AStoIUnknown(MetaDataEvent(), IID_IEventRecipient))` (GUID eventMetaData {2282FCC8-BF58-47F6-A420-3FFEB8F193E5}, metadata.v:564). Закомментированный замер производительности обхода дерева (26-30).
- `OptionsEntry` нет.

**Типы.**

### `class IV8MetaData` (com_metadata.as:13)
Корень. Виден аддинам как `metadata`.
- `IV8MDContainer&& get_ib()` (33) — конфигурация ИБ: `getContainerWrapper(getIBMDCont())`.
- `IV8MDContainer&& get_current()` (37) — текущая (редактируемая) конфигурация: `getContainerWrapper(editedMetaDataCont())`.
- `IV8MDClass&& mdClass(const string& uuid)` (41) — описание класса метаданных: `getMDClassWrapper(mdService.mdClass(Guid(uuid)))`.
- `IV8MDProperty&& mdProp(const string& uuid)` (45) — описание свойства: `getMDPropWrapper(mdService.mdProp(Guid(uuid)))`.
- `uint get_openedCount()` (49) — количество открытых контейнеров (`contWrappers.length`).
- `IV8MDContainer&& getContainer(uint idx)` (53) — открытый контейнер по индексу (открытые cf/epf/erf тоже попадают сюда — через перехват `openConfig`).

### `class IV8MDContainer` (com_metadata.as:61)
Обёртка `IMDContainer`. Поля: `protected IMDContainer&& container` (63), `bool _closed = false` (65 — признак закрытости, выставляется при обработке события закрытия; public-поле с `_` → read-only свойство `closed`).
- `IMDContainer&& _container()` (70) и `void _setClosed()` (71-74, обнуляет container) — скрытые служебные методы (используются `MetaDataEvent` и внешними файлами, напр. com_textwindow.as через `_container()` внутри getContainerWrapper-цепочек).
- `IV8MDObject&& get_rootObject()` (76) — «контейнер сам и есть корневой объект»: `getMDObjectWrapper(container)`.
- `array<V8TypeInfo&&>&& typeList(const string& typeCategories, int lang)` (80-109) — список типов (для палитр/выбора типа): `IMDEditService.getConfigMngrUI(uicfgmngr, container)` → `IConfigMngrUI.getTypesInfoProvider(tip)` → `tip.typesInfo(g, lang, ti)` (категория — гуид из строки `typeCategories`, при непарсинге — IID_NULL); каждый элемент `Vector` разбирается через `toTypeInfo` в обёртку `V8TypeInfo` (`_name`, `_clsid`, `_order1` = priority, `_order2` = order, `_picture` = `image2pict(pti.ref.image)`), после чего **вызывается `pti.ref.dtor()`** — ручное освобождение v8string внутри структуры платформы.
- `IV8MDContainer&& get_masterContainer()` (110) — корневой мастер-контейнер (для расширений конфигурации): `getMasterContainer(container)`.
- `bool get_isModified()` (113) — `uicfgmngr.isModified()`.
- `bool get_treeVisible()` / `void set_treeVisible(bool)` (121-135) — `uicfgmngr.mdTreeIsVisible()` / `mdTreeShow(visible)`.
- `IV8MDObject&& findByUUID(const string& uuid)` (136) — `container.objById(Guid(uuid))`.
- `IV8MDObject&& findByTypeUUID(const string& uuid)` (139) — `container.objByTypeId(Guid(uuid))`.
- `string get_identifier()` (143) — `uicfgmngr.identifier()`.
- `bool saveToFile(const string& path)` (152-171) — выгрузка конфигурации в файл (пример в комментарии: `metadata.current.saveToFile("e:\\test.cf")`): создаёт временный файл `oneDesigner._v8files.createTempFile()`, открывает целевой `oneDesigner._v8files.open("file://" + path, fomTruncate|fomIn|fomOut)`; `IConfigMngr cfgMgr = container.getConfigMngr()`; `IInfoBaseService ibservice = currentProcess().getService(IID_IInfoBaseService)`; `ibservice.connectConfig(copyMgr, tempFile.file, 1)` (подключить пустую конфигурацию во временный файл); `cfgMgr.extractConfig(copyMgr)` (выгрузить в неё текущую); `copy_file(file.file, tempFile.file, uint64(-1))` — скопировать временный в целевой.

### `class V8TypeInfo` (com_metadata.as:189)
Простой контейнер элемента списка типов: `string _name`, `string _clsid`, `int _order1`, `int _order2`, `Variant _picture` (все с `_` → read-only свойства `name`, `clsid`, `order1`, `order2`, `picture`).

### `class IV8MDClass` (com_metadata.as:197)
Обёртка `IMDClass` — описание вида объектов метаданных («Справочник», «Документ»...). Поля: `protected IMDClass&& mdClass`, `protected NoCaseMap<Guid> names2props`, `protected NoCaseMap<Guid> names2childs`.
- Конструктор (201-218) строит словари: для каждого дочернего класса (`childClassesCount()`/`childClassIDAt(i)`) запоминает его **русское и английское имена** (`pClass.getClassName(0/1)`) → гуид класса в `names2childs`; для каждого свойства (`propCount()`/`getPropIDAt(i)`) — `pProp.ref.nameEng/nameRus` → гуид свойства в `names2props`.
- `bool _findPropId(Variant& v, Guid&out id)` (219) — скрытый служебный: `v` — строка (гуид или имя свойства, рус/англ) или число (индекс); возвращает найденный гуид.
- `bool _findChildId(Variant& v, Guid&out id)` (244) — то же для дочерних классов.
- `string get_id()` (270), `string name(int langAliase, bool pluralForm = false)` (273 — `getClassName` для множественной формы, иначе `getName`), `string presentation(bool pluralForm = false)` (276 — `classPresentation`/`presentation`), `uint get_propertiesCount()` (284), `IV8MDProperty&& propertyAt(uint idx)` (287), `uint get_childsClassesCount()` (290), `IV8MDClass&& childClassAt(uint idx)` (293).

### `class IV8MDProperty` (com_metadata.as:311)
Обёртка `MDPropertyRef` (структура описания свойства — metadata.v:441-456: id/nameEng/nameRus/resMod1/resID/resMod2/resCatID...). Поля: `protected MDPropertyRef&& mdProp`.
- `string get_id()` (317), `string name(int langAliase)` (320 — 0 = английское, иначе русское), `string get_description()` (323 — `load_module_wstring(mdProp.ref.resMod1, mdProp.ref.resID)` — строка из ресурсов платформы), `string get_category()` (326 — `resMod2/resCatID`).

### `class IV8MDObject` (com_metadata.as:352)
Обёртка `IMDObject` — **каждый вызов `getMDObjectWrapper` создаёт новую обёртку** (комментарий 345-347: соответствие 1С-объект↔обёртка не хранится, чтобы не следить за временем жизни; для сравнения есть `isSame`). Поля: `protected IMDObject&& object`, `protected IV8MDClass&& myClass`, `protected Variant pict`.
- Конструктор (356-361): `&&object = obj.unk`; при неудаче — `doLog("No md object")`.
- `bool isSame(IV8MDObject&& other)` (362) — сравнение по внутреннему указателю.
- `string get_id()` (365) — `object.id`.
- `IV8MDClass&& get_mdclass()` (368) — `getMDClassWrapper(object.get_mdClass())`, кэшируется в `myClass`.
- `IV8MDObject&& get_parent()` (373) — родитель по `object.mdParentLink` → `p.getMDObject()`.
- `Variant property(Variant propID)` (377) — значение свойства: `mdclass._findPropId(propID, propUuid)` → `object.mdPropVal(propUuid, val)` → `val2var`. propID — имя (рус/англ), гуид-строка или индекс.
- `bool setProperty(Variant propID, Variant value)` (387) — запись свойства: если у объекта есть `IMDEditHelper` (`getMDEditService().getEditHelper(peh, object)`) — `peh.changeProperty(propUuid, val)` (идёт через UI-слой), иначе напрямую `object.setMdPropVal(propUuid, val)`.
- `uint childObjectsCount(Variant childClassID)` (397) — `object.childCount(childUuid)` после `_findChildId`.
- `IV8MDObject&& childObject(Variant childClassID, Variant idx)` (401-437) — дочерний объект: idx — индекс, гуид-строка или **имя объекта** (перебор всех детей: `IMDBaseObj bo = child.unk; bo.getName().str == str`, либо сравнение `child.id == id` для гуида).
- `IV8MDContainer&& get_container()` (438-468) — контейнер-владелец: основной путь — `getMDEditService().getConfigMngrUI(mngui, object)` → `mngui.getMDCont()` → `getContainerWrapper(cont)`; резервный (для корневого контейнера) — подъём по `mdParentLink` до корня и `IMDContainer cont = obj.unk`. Путь усыпан диагностикой `doLog("Bad test IConfigMngrUI")` и т.п.
- `void activateInTree()` (469) — активизировать в дереве конфигурации: `mngui.activateObjInTree(object.id, IID_NULL, true)`.
- `void editProperty(Variant propID)` (475) — открыть редактор свойства: `peh.editProperty(propUuid)`; обёрнуто диагностикой `diagCtx`/`diagAlways("md", ...)`.
- `void openEditor()` (488) — открыть редактор объекта: `peh.openEditor()`; та же диагностика.
- `string get_name()` (498) — `mdObjName(object)` (см. функции файла).
- `array<string>&& types()` (501) — гуиды типов объекта: `IMDTypedObj to = object.unk; to.typeDomain().types(t)`; перебор `toGuid(t.start..t.end)`.
- `string synonym(const string& langCode)` (514) — синоним по коду языка: если `IMDBaseObj bo = object.unk` есть — `bo.getSynonym(langCode)`; иначе (для корня) свойство `synmPropUuid` {CF4ABEA3-37B2-11D4-940F-008048DA11F9} — `ILocalString.localStrings().getString(langCode)`.
- `string get_comment()` (527) — комментарий: `bo.getDescr()` или свойство `descPropUuid` {CF4ABEA4-37B2-11D4-940F-008048DA11F9}.
- `bool isPropModule(Variant propIdx)` (538) — есть ли модуль у свойства: `IMDEditHelper` → `IMDEditModuleHelper emh = peh.unk` → `emh.hasModule(propUuid, v)` — непустой `Vector` = true.
- `string getModuleText(Variant propIdx)` (556) — текст модуля: как isPropModule + `emh.textOfModule(propUuid, true, res)`.
- `void setModuleText(Variant propIdx, const string& text)` (575) — **пустая заглушка** (не реализовано).
- `ITextWindow&& openModule(Variant propIdx)` (578-617) — открыть модуль в редакторе и вернуть его COM-обёртку (пример в комментарии: `metadata.current.rootObject.childObject("Документы", 0).childObject("Формы", 0).openModule("Форма")`): `peh` → `emh` → `hasModule` → `emh.openModule(textMan, propUuid, ..., textEditor)` (сигнатура зависит от версии, см. «Версионные ветки») → по `textMan` ищется наш `TextDoc` в `textDocStorage.find(textMan)` → по редактору окно `tdoc.findWnd(textEditor)` → `wnd.getComWrapper()` (textwnd.as:595). Обильно отлажено `dbgLog` (584-607).
- `string extPropUUID(Variant propIdx)` (618) — гуид внешнего свойства: `peh.extPropCLSID(propUuid)`.
- `IV8ExtProp&& getExtProp(Variant propIdx)` (628-653) — обёртка внешнего свойства (например, форма объекта, макет табличного документа): гуиды данных/редактора (`extPropCLSID`/`extPropEditorCLSID`), `peh.extProp(extProp.object, propUuid)` — сам объект; из значения свойства (`object.mdPropVal`) берётся `IMDExtObj raw = val.pValue.unk` и его `url(u)` → `extProp._url = u.url` (у управляемой формы object пуст — комментарий 684).
- `IV8DataFile&& saveToFile(IV8DataFile&& fileIn = null)` (654) — сериализация объекта: `saveObject(fileIn, object)`.
- `bool loadFromFile(IV8DataFile&& file)` (657) — `loadObject(file, object)`.
- `Variant get_picture()` (660) — картинка объекта для дерева: `peh.getTreeItemInfo(object.mdClass.id, oneMDTreeItemInfo)` → `image2pict(oneMDTreeItemInfo.image)`; кэшируется в `pict`.
- `IObjectProperties&& get_props()` (671) — всегда null (заглушка).

### `class IV8ExtProp` (com_metadata.as:677)
Обёртка внешнего свойства. Поля: `protected Guid dataID, editorID`, `IUnknown&& object` (объект-редактор/документ), `IUnknown&& raw` (значение свойства `IMDExtObj`, «у управляемой формы object пуст», 684), `string _url` (→ read-only `url`).
- Конструктор `IV8ExtProp(const Guid& did, const Guid& eid)` (678).
- `string get_url()` (686), `string probe()` (688 — диагностика: `probeIfaces(object)` + `probeIfaces(raw)`), `string get_idData()` (689), `string get_idEditor()` (690), `string get_title()` (691 — `IDocument doc = object.unk; doc.getTitle()`, пусто если object null), `bool get_isReadOnly()` (700 — `doc.getReadOnly()`, true если object null), `IV8DataFile&& saveToFile(...)` (706)/`bool loadFromFile(...)` (709) — через `saveObject`/`loadObject` от `object`, `Variant getForm()` (712-728): `ICustomFormDesigner dsn = object.unk` → `dsn.getForm(form)` → Variant; если dsn нет — сам object как Value.

### `class IObjectProperties` (com_metadata.as:799)
Заглушка «свойства объекта» (нужна для совместимости интерфейса): `get_count() = 0`, пустые `propName/getValue/setValue/activateProperty`.

### `enum MetaDataEvents` (com_metadata.as:957-974)
Коды события для аддинов: `mdeAdd = 0`, `mdeChangeProp`, `mdeDelete`, `mdeChange`, `mdeSave`, `mdeClose`, `mdeAfterSave`, `mdeOpen`. Проецируются на платформенный `EventMetaDataKind` (metadata.v:458-466: emdAddChild, emdPropChanged, emdDeleteChild, emdChanged, emdSave, emdClose, emdAfterSave) — обратите внимание: коды 0..4 совпадают, `mdeOpen` (7) платформенному виду не соответствует (см. Особенности).

### `class IV8MetaDataEvent` (com_metadata.as:976-984)
Параметры события `MetaDataEvent` (public-поля с `_` → read-only свойства): `MetaDataEvents _kind`, `bool _request` (это запрос или уведомление), `IV8MDObject&& _obj`, `IV8MDObject&& _parentObj`, `IV8MDProperty&& _prop`, `bool result` (аддин может изменить — возвращается платформе), `IV8MDContainer&& _container`.

### `class MetaDataEvent` (com_metadata.as:986)
Получатель платформенных событий метаданных (подписан как `IID_IEventRecipient`).
- `void onEvent(const Guid&in eventID, MDEventInfo& info, IUnknown& obj)` (987-1027): если есть подписчики (`oneDesigner._events._hasHandlers(mdd, "MetaDataEvent")`, где `mdd = createDispatchFromAS(&&oneDesigner._metadata)`) — заполняет `IV8MetaDataEvent` (`_kind = MetaDataEvents(info.kind)`, `_obj`/`_parentObj` через `getMDObjectWrapper(info.object/parent)`, `_prop` через `getMDPropWrapper(mdService.mdProp(info.changedPropId))`, контейнер берётся у объекта или родителя) и вызывает `oneDesigner._events.fireEvent(mdd, "MetaDataEvent", args)`; результат подписчиков возвращается платформе: `info.result = mde.result` (1008). Отдельно обрабатывает **закрытие контейнера** (`info.kind == emdClose && !info.request`, 1011-1024): `contFind.remove(container.self)` и удаление обёртки из `contWrappers` с вызовом `cont._setClosed()`.

**Функции файла.**
- `IV8MDContainer&& getContainerWrapper(IMDContainer&& container)` (176-187) — фабрика с двойным кэшем: `UintMap<IV8MDContainer&&> contFind` (ключ — адрес контейнера) + список `array<IV8MDContainer&&> contWrappers` (для `openedCount`/`getContainer`); null на входе → null (проверка добавлена «+ mike_a», 177).
- `IV8MDClass&& getMDClassWrapper(IMDClass&& mdc)` (300-309) — кэш `UintMap<IV8MDClass&&> mdClasses` по адресу.
- `IV8MDProperty&& getMDPropWrapper(MDPropertyRef&& mdp)` (332-343) — кэш `UintMap<IV8MDProperty&&> mdProps`.
- `IV8MDObject&& getMDObjectWrapper(IMDObject&& obj)` (348-350) — **без кэша**, новая обёртка каждый раз (см. IV8MDObject.isSame).
- `IV8DataFile&& saveObject(IV8DataFile&& file, IUnknown&& obj)` (731-764) — сериализация в файл: если файл не задан — создаётся в памяти (`currentProcess().createByClsid(CLSID_MemoryFile, IID_IFileEx, f)` → `IV8DataFile`); если объект — `IPersistableDocument` → `pdoc.save(file.file)`; иначе `IPersistableObject` → создаётся `CLSID_StreamOutPersistenceStorage` {E3DDF5CD-4150-41B9-9D92-8B2E7CF39DD5} (`IID_IStreamPersistenceStorage`), `stg.setFile(file.file)`, `pobj.serialize(s)`, `stg.close()`. Ошибки C++ (`class core::Exception`) перехватываются `CppCatch` и превращаются в `setComException`.
- `bool loadObject(IV8DataFile&& file, IUnknown&& obj)` (766-797) — обратное: `pdoc.load` или `CLSID_StreamInPersistenceStorage` {25802095-C067-4AD9-B340-B23A2349FEC3} + `pobj.deserialize(s)`.
- `int_ptr variantPtr(const Variant& v)` (818-824) — извлечение указателя (BSTR и т.п.) из VARIANT: на x86 `v.dword`, на x64 `v.qword` (комментарий: на x64 dword давал только младшие 32 бита — падение при чтении строки).
- `IConfigMngr&& getConfigMgrOf(IInfoBase&& ib)` (827-835) — в 8.3.27 и 8.5.x слот `getConfigMgr` возвращает общий объект, нужный `IConfigMngr` получаем явным приведением через `IUnknown` (комментарий 826).
- `IMDContainer&& getIBMDCont()` (837-875) — контейнер метаданных ИБ: `getDefaultInfoBase()` → `getConfigMgrOf(ib)` → `mng.getMDCont()`; каждый шаг проверяется `checkInterface`, при отсутствии менеджера конфигурации на старте — тихий null (комментарий 858); при `diagTraceOn("vt")` — `dbgDumpVT` (теги 1,2,3) и штатный `dumpVtable` (методика tools/ADAPT.md: дамп vtable в `dump/<алиас>.vtable`).
- `IMDContainer&& editedMetaDataCont()` (877-901) — контейнер редактируемой конфигурации: `getMDEditService()` → `mdes.getTemplatesMainConfigMngrUI(pmdUI)` → `pmdUI.getMDCont()`; всё под `checkInterface`. Ветка `#if test = 0` (878-887) — старый вариант с комментариями «на старте Конфигуратора сервис/интерфейс ещё не готовы — null вместо исключения».
- `string mdObjName(IMDObject&& object)` (903-914) — имя объекта: через `IMDBaseObj.getName()` либо (для корневых, у которых нет IMDBaseObj) свойство `namePropUuid` {CF4ABEA2-37B2-11D4-940F-008048DA11F9} (metadata.v:569).
- `string mdObjFullName(IMDObject&& object)` (916-934) — полный путь «Класс.Имя.Класс.Имя...» вверх по `mdParentLink` (сбор с конца через `names.reverse()` + `join(names, ".")`); для корня — имя класса. Используется ModuleElements.as.
- `string mdPropName(const Guid& mdPropID)` (936) — русское имя свойства по гуиду.
- `void setTrapOnOpenConfig()` (941) — см. «Перехваты».
- `Variant image2pict(IUnknown&& img)` (1032-1073) — конвертация картинки 1С (`IImage`) в VARIANT-картинку: если под IImage есть `IGlyph` — `toGlyph`, ключ кэша `"адрес,ширина,высота,x,y"`, указатель на IV8Picture берётся из памяти `mem::int_ptr[gl.ref.block.self + pictOffset]` (версионное смещение picture.v:64-79: x86 64/68/64, x64 0x68/0x70); иначе `mem::int_ptr[image.self + pictOffset]`. Кэш `NoCaseMap<Variant> pictCache` (1030) по ключу «адрес картинки + параметры глифа». Создаётся 1С-объект `CLSID_V8PictureValue` {85D76168-7B84-4321-89CC-E04A68E81047} (`IID_IV8PictureValue`), ему `setPicture(v8pict)` с заполнением `V8Picture` (kind = 3, isGlyph, szGlyph/ptGlyph), затем `val2var`. Используется также grid.as и com_commands.as.
- `IMDContainer&& getMasterContainer(IMDContainer&& cont)` (1075-1080) — подъём по цепочке `masterContainer()` до корня (расширения конфигураций).
- `void walkMD(IV8MDObject&& obj)` (1084-1100) — тестовый рекурсивный обход дерева метаданных со счётчиком `mdObjCount` (1083); вызывался из закомментированного замера в конструкторе IV8MetaData.

**Перехваты.**
- `TrapVirtualStdCall trOpenConfig` (940) — `trOpenConfig.setTrap(getMDEditService(), IMDEditService_openConfig, trapOpenConfig)` (942; слот из metadata.v:10). Хук `void trapOpenConfig(IMDEditService& pService, IConfigMngrUI& mngr, IMDContainer& container)` (944-955): **до** вызова оригинала создаёт обёртку `getContainerWrapper(container)` и добавляет её в список открытых; комментарий (945-947): перехват ловит не только конфигурацию ИБ и рабочую базу, но и **все открываемые cf, epf, erf файлы**, так как они содержат свои контейнеры метаданных; оригинал вызывается со снятым/восстановленным перехватом (`trOpenConfig.swap()` вокруг).

**Используемые API.**
- Сервисы платформы: `IMDService` {5BB3A551-35F7-11D4-940F-008048DA11F9} (metadata.v:22, глобальная `mdService`), `IMDEditService` {9EAEF404-78D2-4841-8332-3C3166212DCD} (metadata.v:1), `IInfoBaseService` {F7399BD5-100E-4D0A-A5CE-F97810ACFEE9} (metadata.v:10), `IConfigMngrUI` {B725F668-13C8-4BFF-90B9-33E19AA42E06} (metadata.v:25), `ITypesInfoProvider` {936EFFDE-1F59-4498-816F-8D495E205838} (metadata.v:71), `IMDEditHelper` {888744F9-B616-11D4-9436-004095E12FC7} (metadata.v:325), `IMDEditModuleHelper` {963CE56B-FCF9-4E6D-8EBC-374721B63ABA} (metadata.v:395), `IMDObject` {12BFDDD0-36CC-11D4-940F-008048DA11F9}, `IMDExtObj` {E80EA0D4-FE4C-446F-9567-9833A72DD396} (metadata.v:417), `IMDContainer`/`IMDClass`/`IMDParentLink`/`IMDBaseObj`/`IMDTypedObj`, `IEventService.subscribe` + `eventMetaData` {2282FCC8-BF58-47F6-A420-3FFEB8F193E5}, `IID_IEventRecipient`, `MDEventInfo` (metadata.v:487), `MDTreeItemInfo`, `TypeInfo` (metadata.v:499).
- CLSID: `CLSID_MemoryFile` {C1AF3F04-620A-40BC-8CA8-F6089B4A46F5} (file.v:90), `CLSID_StreamOutPersistenceStorage` / `CLSID_StreamInPersistenceStorage` (document.v:70-71), `CLSID_V8PictureValue` (picture.v:83); UUID свойств-заглушек `namePropUuid`/`synmPropUuid`/`descPropUuid` (metadata.v:569-573).
- Хост/натива: `getMDService()`, `getMDEditService()`, `getDefaultInfoBase()`, `getEventService()`, `currentProcess().getService/createByClsid`, `createDispatchFromAS`, `AStoIUnknown`, `var2val`/`val2val`→`val2var`, `stringFromAddress`, `load_module_wstring`, `setComException`, `checkInterface`, `copy_file`, `ExceptionCatcher`/`CppCatch`, `dumpVtable` (встроенный дамп Core.As), `diagTraceOn`/`dbgDumpVT`/`dbgLog`/`dbgOn`/`doLog` (diag.as), `diagAlways`/`diagCtx` (diag.as:36,379).
- Память: `toTypeInfo`/`toGlyph`/`toGuid`/`toIUnknown`/`toDocSink`/`toViewContext`-стиль приведения, `mem::int_ptr`, `Vector`/`GuidRef`/`TypeInfoRef`/`GlyphRef`.
- Объекты движка: `oneDesigner._events`, `oneDesigner._metadata`, `oneDesigner._v8files` (V8Files, com_files.as:10 — `open`, `createTempFile`).

**Взаимодействия.**
- Предоставляет аддинам: объект `metadata` (поле `Designer._metadata`) с событием `MetaDataEvent`; классы `IV8MDContainer`, `IV8MDObject`, `IV8MDClass`, `IV8MDProperty`, `IV8ExtProp`, `V8TypeInfo`, `IV8MetaDataEvent` (возвращаются из методов); `IV8MDObject.openModule` возвращает `ITextWindow` (com_textwindow.as).
- Предоставляет движку: глобальную `mdService` (com_windows.as:638, com_textwindow.as:205); фабрики `getContainerWrapper`/`getMDObjectWrapper`/`getMDClassWrapper`/`getMDPropWrapper` (com_textwindow.as:193-205, com_windows.as:629,638, textwnd.as:253); `image2pict` (com_windows.as:618, grid.as, com_commands.as); `editedMetaDataCont` (com_designer.as:107 — `ISettingsConsumer.setSettings` при `v8New`; ModuleTextProcessor.as); `mdObjName` (ModuleTextProcessor.as), `mdObjFullName`/`mdPropName` (ModuleElements.as); `variantPtr` (colorer.as, controls.as); `IV8MDObject`/`IV8MetaData` типы (colorer.as).
- Потребляет: textwnd.as (`textDocStorage.find`, `TextDoc.findWnd`, `TextWnd.getComWrapper` — в openModule), com_designer.as (`oneDesigner._events`, `_v8files`), diag.as.

**Версионные ветки.**
- `#if ver < 8.3.10` в `IV8MDObject.openModule` (595-600): старая сигнатура `emh.openModule(textMan, propUuid, true, true, textEditor)` (bool-параметры), новая — `uint32 o = 0x10101; emh.openModule(textMan, propUuid, o, textEditor)` (битовая маска, metadata.v:408-412).
- `#if (ver >= 8.3.27 & ver < 8.3.28) | ver >= 8.5` в `getConfigMgrOf` (828-834): явный QueryInterface-приведение результата `_getConfigMgr()`.
- `#if (ver >= 8.3.27 & ver < 8.3.28)` в `getIBMDCont` (846-848) — пустой блок с пометкой «tools/slotprobe.py временно вставляет вызов пробы слота» (инструментарий адаптации).
- `#if test = 0` в `editedMetaDataCont` (878-900) — отладочная компиляция старого тела функции.
- (Версионная адаптация `TypeInfo.dtor` — 8.3.27-специфичная раскладка структуры — лежит в metadata.v, не здесь.)

**Особенности.**
- `MDPropertyRef`, `MDTreeItemInfo`, `TypeInfo` — это **структуры памяти платформы**: поля читаются напрямую (`pProp.ref.nameEng` — сырые адреса), строки достаются `stringFromAddress`/`load_module_wstring`, а после `typeList` каждый элемент обязательно `dtor()`-ится (105) — иначе утечка v8string платформы.
- Обёртки контейнеров/классов/свойств кэшируются по адресам объектов (`contFind`, `mdClasses`, `mdProps`), но **очищаются только контейнеры** — при событии закрытия; кэши классов и свойств живут до конца сессии (риск устаревания адресов после закрытия конфигурации — ограничение принято сознательно).
- `IV8MDObject` не кэшируется вовсе — `isSame` вместо сравнения обёрток (комментарий 345-347).
- `mdeOpen = 7` в `MetaDataEvents` не имеет пары в платформенном `EventMetaDataKind` (там 7 значений 0..6) — код события маппится как есть (`MetaDataEvents(info.kind)`), значение 7 у аддина может появиться только если платформа вернёт kind вне диапазона.
- `image2pict` читает указатель на `IV8Picture` **из памяти** картинки по версионному смещению `pictOffset` и вручную `AddRef()` (1049) — обход отсутствующего в описаниях интерфейса доступа к картинке глифа.
- Обширная диагностическая обвязка (dbgLog-дампы, `diagCtx` в `editProperty`/`openEditor`, `dumpVtable` в `getIBMDCont`) — наследие адаптации под новые версии платформы; включается только при трассировке (`diagTraceOn`/`dbgOn`).
- `setModuleText` — незаполненная заглушка; `get_props()` всегда null.

---

## com_v8ti.as (137 строк)
**Назначение.** Реализация `ITypeInfo` для объектов 1С, преобразованных в IDispatch, «чтобы можно было нормально их просматривать при отладке скриптов» (шапка, com_v8ti.as:4-5). Файл перехватывает у диспетчера 1С-объекта методы `GetTypeInfoCount`/`GetTypeInfo` COM-интерфейса `IDispatch` и подсовывает собственную реализацию `IV8TypeInfo`, синтезирующую TYPEATTR/FUNCDESC из контекста объекта (`IContextDef` — список методов и свойств 1С). **Важно: в настоящее время функциональность не активна** — регистрация пакета закомментирована (com_v8ti.as:12: `//Packet v8TypeInfo("v8TypeInfo", initV8TypeInfo, piOnDesignerInit);`), а `initV8TypeInfo` больше никем не вызывается.

**Инициализация.**
- Пакет `v8TypeInfo` (уровень `piOnDesignerInit`) закомментирован (12); глобальных объектов нет; `OptionsEntry` нет.
- `bool initV8TypeInfo()` (18-27) — тело инициализации: создаёт произвольный 1С-объект с IValue (`currentProcess().createByClsid(CLSID_TxtEdtDoc {5C84ACF4-DB1C-11d4-B008-004095E12DE6}, IID_IValue, val.pValue)`), конвертирует в Variant и берёт `IDispatch`; на нём ставит ловушки: `trGetTypeInfoCount.setTrap(pDisp, 3, Trap_GetTypeInfoCount)` и `trGetTypeInfo.setTrap(pDisp, 4, Trap_GetTypeInfo)` — **числовые слоты 3 и 4** vtable IDispatch (после трёх слотов IUnknown): GetTypeInfoCount=3, GetTypeInfo=4.

**Типы.**

### `class IV8TypeInfo` (com_metadata... com_v8ti.as:62)
Реализация COM-интерфейса `ITypeInfo` «вручную» — порядок и сигнатуры методов соответствуют vtable, поэтому объявление «Порядок функций НЕ МЕНЯТЬ!!!» (com_v8ti.as:60). Поле `IContext&& ctx` (66) — контекст 1С-объекта. Параметры-указатели объявлены `int_ptr`: «на x64 uint обрезал адреса COM-клиента до 32 бит» (комментарий 61).
- `int GetTypeAttr(int_ptr ppTypeAttr)` (67-79) — выделить `TYPEATTR` (`malloc(TYPEATTR_size)`, `mem::memset` нулями): `guid = IID_IDispatch`, `memidConstructor/memidDestructor = -1`, `typekind = TKIND_DISPATCH`, `cFuncs = def.methsCount() + def.propsCount()` (число методов + свойств контекста), `cImplTypes = 1`; адрес записывается в `mem::int_ptr[ppTypeAttr]`; возврат 0 (S_OK). Структура TYPEATTR описана в com.v (см. `:struct` блок с cScodes и др.).
- `int GetTypeComp(uint)` (80) — `E_NOTIMPL`.
- `int GetFuncDesc(uint idx, int_ptr pRet)` (81-92) — описание функции №idx: если `idx < methsCount()` — это метод (`memid = idx`, `invkind = INVOKE_FUNC`), иначе свойство (`memid = maxMethCount + idx - metCount`, `invkind = INVOKE_PROPERTYGET`); `funckind = FUNC_DISPATCH`; память `malloc(FUNCDESC_size)` + memset, адрес — в `mem::int_ptr[pRet]`.
- `int GetVarDesc(uint, uint)` (93) — `E_NOTIMPL`.
- `int GetNames(int memid, int_ptr rgBstrNames, uint cMaxNames, int_ptr pcNames)` (94-116) — имя по memid: для `memid < maxMethCount` — `SysAllocString(def.methName(memid, 1))` (алиас 1 — русский), для свойств — индекс `memid - maxMethCount` → `def.propName(propIdx, 1)`; возвращает одно имя (`mem::dword[pcNames] = 1`); вне диапазона — `E_FAIL`.
- Остальные методы — `E_NOTIMPL`: `GetRefTypeOfImplType`, `GetImplTypeFlags`, `GetIDsOfNames`, `Invoke`, `GetDocumentation`, `GetDllEntry`, `GetRefTypeInfo`, `AddressOfMember`, `CreateInstance`, `GetMops`, `GetContainingTypeLib` (117-127).
- `void ReleaseTypeAttr/ReleaseFuncDesc/ReleaseVarDesc(int_ptr)` (128-136) — `free()` выделенных malloc-блоков.

### `enum ComConst` (com_v8ti.as:54-58)
`E_NOTIMPL = 0x80004001`, `E_FAIL = 0x80004005`, `maxMethCount = 100001` (граница между memid методов и свойств).

**Функции файла.**
- `bool initV8TypeInfo()` (18-27) — см. «Инициализация».
- `int Trap_GetTypeInfoCount(IDispatch& pDisp, uint& res)` (30-38) — всегда возвращает 1 (S_OK, «тип-инфо есть»); закомментированный вариант (32-37) сначала вызывал оригинал и заменял нулевой результат единицей.
- `int Trap_GetTypeInfo(IDispatch& pDisp, uint iTInfo, uint lcid, IUnknown&&& ppTInfo)` (41-52) — приводит диспетчер к `ICtx2Disp` (нативный интерфейс snegopat.dll поверх диспетчера 1С-объекта), получает `IContext ctx = iface.getContext()`, создаёт `&&ppTInfo = AStoIUnknown(IV8TypeInfo(ctx), IID_ITypeInfo)` {00020401-0000-0000-C000-000000000046} (com.v:67) и `ppTInfo.AddRef()`. Закомментированный вариант сначала пробовал оригинальный GetTypeInfo. Закомментированная отладка: `Print("meths=" + ctx.staticContextDef().methsCount() + ...)` (48).

**Перехваты.**
- `TrapVirtualStdCall trGetTypeInfoCount` (13) — слот 3 IDispatch → `Trap_GetTypeInfoCount`.
- `TrapVirtualStdCall trGetTypeInfo` (14) — слот 4 IDispatch → `Trap_GetTypeInfo`.
- Оба ставятся в `initV8TypeInfo` на диспетчер конкретного (тестового) 1С-объекта — но так как пакет отключён, в рантайме не работают.

**Используемые API.** `CLSID_TxtEdtDoc` {5C84ACF4-DB1C-11d4-B008-004095E12DE6} (text.v:253), `IID_IValue`, `IID_ITypeInfo` {00020401-0000-0000-C000-000000000046} (com.v:67), `ICtx2Disp` (нативный интерфейс snegopat.dll), `IContext`/`IContextDef` (methsCount/propsCount/methName/propName), `AStoIUnknown`, `currentProcess().createByClsid`, `val2var`/`getDispatch`, `mem::memset`/`mem::int_ptr`/`mem::dword`, `malloc`/`free`, `SysAllocString` (OleAut32.dll, com.v:64), константы `TYPEATTR_size`/`FUNCDESC_size`/`TKIND_DISPATCH`/`FUNC_DISPATCH`/`INVOKE_FUNC`/`INVOKE_PROPERTYGET` (com.v:40-62), `TrapVirtualStdCall.setTrap/getOriginal`.

**Взаимодействия.** Файл автономен: ничего не экспортирует в движок и не потребляет из других файлов (кроме общих хост-функций); при включении давал бы отладчику/браузеру объектов COM-клиентов тип-инфо для любых 1С-объектов, обёрнутых `createDispatchFromAS`/`val2var`.

**Версионные ветки.** Нет (кроме упомянутого выше x64-комментария о `int_ptr`).

**Особенности.**
- Реализация интерфейса «рукописной vtable» — жёсткое требование порядка методов (60); единственный в группе файл, где COM-интерфейс реализуется целиком на AngelScript.
- `maxMethCount = 100001` — синтетическая граница memid, чтобы отличать методы от свойств.
- Параметры-указатели `int_ptr` вместо `uint` — фикс обрезания 64-битных адресов (61).
- Весь механизм в настоящий момент отключён (закомментированный пакет) — мёртвый код, оставленный как заготовка для отладчика.

---

## com_v8value.as (75 строк)
**Назначение.** Обёртка для работы из аддинов со значениями 1С (шапка, com_v8value.as:3) — класс `V8Value`, дающий интроспекцию произвольного значения 1С (имя типа, гуид, список методов/свойств контекста, строковые представления). Виден аддинам как результат `Designer.toV8Value(variantValue)` (com_designer.as:190-192), т.е. `designer.toV8Value(...)` или глобальное `toV8Value(...)`.

**Инициализация.** Пакетов нет, глобальных объектов нет, `OptionsEntry` нет; объект создаётся только по запросу из скрипта (`toV8Value`).

**Типы.**

### `class V8Value` (com_v8value.as:10)
Поле `Value value` (11) — 1С-значение. Конструктор `V8Value(Variant& v)` (12) конвертирует входной VARIANT в `Value` (`var2val`).
- `string typeName(long language = 0)` (16) — название типа: `value.pValue.getType().getTypeString(language)` (0 — английский, 1 — русский); пустая строка для пустого значения.
- `string presentation()` (22) — строковое представление значения: `value.getString(res)`.
- `bool get_isObject()` (28) — является ли значение объектом: `IContext ctx = cast<IUnknown>(value.pValue)` (наличие контекста).
- `string contextInfo()` (33-62) — «список методов/свойств» — человекочитаемая справка: имя типа (`getTypeString(1)`), гуид типа (`type.getClsid()`), при `IPersistableObject` — гуид сериализации (`pers.getCLSID()`); если есть `IContext` — блоки «Методы:» (для каждого: `функция`/`процедура` по `ctx.hasRetVal(idx)`, имя `ctx.methName(idx, 1)`, число параметров `ctx.paramsCount(idx)`) и «Свойства:» (`ctx.propName(idx, 1)`); всё склеивается `join(result, "\n")`.
- `string toStringInternal()` (64) — `ЗначениеВСтрокуВнутр`: `value.toString(res)`.
- `string typeUUID()` (70) — гуид типа: `value.pValue.getType().getClsid()`.

**Функции файла.** Свободных функций нет.

**Перехваты.** Нет.

**Используемые API.** `var2val`/`val2var` (нативные конвертеры Variant↔Value), `IType.getTypeString/getClsid`, `IPersistableObject.getCLSID`, `IContext`/`IContextDef` (methsCount/propsCount/hasRetVal/methName/propName/paramsCount), `Value.getString/toString/getBoolean`.

**Взаимодействия.** Единственный потребитель — `Designer.toV8Value` (com_designer.as:190); файл ни у кого из движка ничего не берёт и ничего не предоставляет, кроме класса `V8Value` (его тип упоминается в com_designer.as).

**Версионные ветки.** Нет.

**Особенности.** Поле `value` — public-поле типа `Value`, который не маршалится в COM (аддину недоступно как свойство, фактически скрыто); все методы безопасны при пустом значении (возвращают пустые строки/false).

---

## com_sqlite.as (372 строки)
**Назначение.** Работа с sqlite-базами из аддинов (шапка, com_sqlite.as:3): классы `SqliteBase` (открытая база) и `SqliteQuery` (подготовленный запрос) поверх нативных функций `sqlite3_*` (объявлены в `main/api/sqlite.v`, DLL `_sqlite3.dll`). `SqliteBase` виден аддинам как результат `Designer.sqliteOpen(baseName, flags)` (com_designer.as:346-357), `SqliteQuery` — как результат `SqliteBase.prepare(...)`. Результаты запросов возвращаются **родными 1С-типами**: `ТаблицаЗначений`, `Структура`, примитивы.

**Инициализация.** Пакетов нет, глобальных объектов нет, `OptionsEntry` нет. Соединение создаётся в `Designer.sqliteOpen` (не в этом файле): `sqlite3_open_v2(baseName.toUtf8().ptr, db, flags)` с флагами по умолчанию `SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE`, при ошибке `setComException(stringFromAddress(sqlite3_errmsg16(db)))`.

**Типы.**

### `interface QueryResultProcessor` (com_sqlite.as:69)
Интерфейс приёмника результата запроса (стратегия, куда складываются строки): `bool needColumns()`, `void setColumns(array<string>& colNames)`, `AddResultRowAnswers addResultRow()`, `void setResultValue(uint col, const Value& val)`, `void setAnswer(Value& val, int_ptr db)`.

### `enum AddResultRowAnswers` (com_sqlite.as:62)
`addRowError`, `addRowSuccess`, `addRowBreak` (прекратить чтение строк).

### `class EmptyQueryResultProcessor : QueryResultProcessor` (com_sqlite.as:78)
Пустой обработчик — для промежуточных запросов пачки, результаты которых не нужны (всё в no-op, `addResultRow` возвращает `addRowSuccess`).

### `class ValueTableQueryResultProcessor : QueryResultProcessor` (com_sqlite.as:87)
Укладывает результат в **ТаблицуЗначений**. Поля: `IValueTableColumns&& pIValueTable`, `IVTRow&& addedRow`, `bool answerIsID` (конструктор (91) — «ответом считать rowid последней вставки, а не число изменённых строк»).
- `setColumns` (93): создаёт таблицу `currentProcess().createByClsid(CLSID_ValueTable {F24E186B-AB33-447F-B813-08AB49F126F2}, IID_IValueTableColumns, ...)`; для каждой колонки: заголовок = имя поля запроса, идентификатор — то же имя, где все недопустимые символы (`!is_name_symbol`) заменены на `'_'` (102-105); `pIValueTable.addColumn(unk, info, newId)` с `VTColumnInfo info`.
- `addResultRow` (112): `pIValueTable.addRow(row)`, `addedRow = cast<IUnknown>(row)` (IVTRowRO → IVTRow).
- `setResultValue` (118): `addedRow.setValueAt(col, val)`.
- `setAnswer` (121): если таблица не создана (запрос без колонок, напр. INSERT) — `val = answerIsID ? sqlite3_last_insert_rowid(db) : int64(sqlite3_changes(db))`; иначе `val = cast<IValue>(cast<IUnknown>(pIValueTable))` — сама ТЗ.

### `class OneRowQueryResultProcessor : QueryResultProcessor` (com_sqlite.as:132)
Первая строка результата → **Структура** («названия полей результата запроса становятся названиями свойств структуры, недопустимые символы заменяются на '_'», комментарий 129-131). `setColumns` (136) только копит ключи (с той же заменой символов); `addResultRow` (147) создаёт `CLSID_ValueStruct {C6BDAE87-2280-4624-AF03-2C1B4371B2E4}` (`IID_IValueStructure`) и возвращает `addRowBreak` (одна строка); `setResultValue` (151) — `valueStruct.set(keys[col], val)`; `setAnswer` (154) — структура как `IValue` (или null).

### `class OneValueQueryResultProcessor : QueryResultProcessor` (com_sqlite.as:160)
Результат — **первое поле первой строки**. `addResultRow` сразу возвращает `addRowBreak`; `setResultValue` (165) запоминает только колонку 0; `setAnswer` — сохранённое значение.

### `class SqliteBase` (com_sqlite.as:175)
Поле `int_ptr _db` (176) — хэндл соединения (скрыт от аддинов).
- `Variant exec(const string& strQuery, bool answerIsID = false, Variant resArray = 0)` (189-217) — выполнить один или несколько запросов, разделённых `';'` (полная семантика описана в комментарии 180-188): цикл по тексту через `sqlite3_prepare16_v2(_db, pSqlText, -1, pStmt, pSqlText)` (хвостовой указатель `pzTail` продвигает `pSqlText`); ошибка подготовки → `setComException("Ошибка в запросе № " + iQuery + ": " + get_lastError())`; признак последнего запроса — `pSqlText == 0 || mem::word[pSqlText] == 0` (203); каждый запрос обрабатывается `processOneQuery` с обработчиком: для промежуточных запросов пачки, если `resArray` не задан — `EmptyQueryResultProcessor`, для последнего (или если задан массив) — `ValueTableQueryResultProcessor(answerIsID)` (205); после каждого — `sqlite3_finalize`; если передан Массив (`IValueArray` из `resArray`) — каждый результат добавляется `resultArray.insertAt(count++, val)`; результат функции — результат **последнего** запроса (`val2var(val, result)`).
- `string get_lastError()` (219) — `stringFromAddress(sqlite3_errmsg16(_db))`.
- `void close()` (223) — `sqlite3_close_v2(_db)`, `_db = 0`.
- `SqliteQuery&& prepare(const string& strQuery)` (228) — подготовить один запрос (`sqlite3_prepare16_v2`), вернуть `SqliteQuery(pStmt)`; ошибка → `setComException(get_lastError())`, null.
- `uint changes()` (238) — `sqlite3_changes(_db)` — строк обработано последним запросом.
- `uint totalChanges()` (242) — `sqlite3_total_changes(_db)` — всего строк с учётом триггеров.
- `uint64 lastInsertedID()` (246) — `sqlite3_last_insert_rowid(_db)`.

### `class SqliteQuery` (com_sqlite.as:252)
Поле `int_ptr _stmt` (253) — хэндл statement.
- `SqliteQuery&& bind(Variant idx, Variant val)` (258-313) — привязать параметр по имени или номеру, возвращает `this` (цепочка вызовов): индекс — если строка (`getTypeKind() == tkString`) — `sqlite3_bind_parameter_index(_stmt, nameOfParam.str.toUtf8().ptr)` (имя с `@`/`:`), иначе `Numeric` → `int`; проверки `0 == idxOfParam || idxOfParam > sqlite3_bind_parameter_count(_stmt)` → `setComException("Неправильный индекс")`. Тип значения по `getTypeKind()`: `tkNull`/`tkUndefined` → `sqlite3_bind_null`; `tkBoolean` → `sqlite3_bind_int(0/1)`; `tkNumeric` → при `prec == 0` (`num.lengthAndPrecision(len, prec)`) целое `sqlite3_bind_int64`, иначе `sqlite3_bind_double`; всё остальное — строкой `sqlite3_bind_text16(..., text.length * 2, SQLITE_TRANSIENT)`. Ошибка → `setComException(stringFromAddress(sqlite3_errmsg16(sqlite3_db_handle(_stmt))))`.
- `Variant exec(bool isAnswerID = false)` (315) — выполнить: `processOneQueryAndReset(_stmt, val, ValueTableQueryResultProcessor(isAnswerID))` → ТаблицаЗначений / rowid|changes; ошибка → `setComException(errmsg16)`.
- `Variant queryRow()` (325) — первая строка как Структура (`OneRowQueryResultProcessor`).
- `Variant queryValue()` (335) — первое поле первой строки (`OneValueQueryResultProcessor`).
- `void close()` (344) — `sqlite3_finalize(_stmt)`, `_stmt = 0`.

**Функции файла.**
- `bool processOneQuery(int_ptr pStmt, Value& result, QueryResultProcessor& qp)` (11-54) — ядро выполнения: `sqlite3_column_count`; если есть колонки — при `qp.needColumns()` передать имена (`sqlite3_column_name16` → `stringFromAddress` → `qp.setColumns`); цикл `sqlite3_step()`: `SQLITE_ROW` → `qp.addResultRow()` (ошибка → false; break → прекратить), для каждой колонки по `sqlite3_column_type`: `SQLITE_INTEGER` → `sqlite3_column_int64`, `SQLITE_FLOAT` → `sqlite3_column_double`, `SQLITE_NULL` → `valOfColumn.clear()`, остальное → строка `sqlite3_column_text16`; `qp.setResultValue(i, val)`; `SQLITE_DONE` → выход; иные коды → false. Без колонок — просто дождаться `SQLITE_DONE`. Финал: `qp.setAnswer(result, sqlite3_db_handle(pStmt))`.
- `bool processOneQueryAndReset(int_ptr pStmt, Value& result, QueryResultProcessor& qp)` (56-60) — то же + `sqlite3_reset(pStmt)` (statement остаётся пригодным для повторного `exec`).

**Перехваты.** Нет.

**Используемые API.** Нативные функции sqlite3 из `main/api/sqlite.v` (`:dlls _sqlite3.dll`, sqlite.v:63): `sqlite3_open_v2`, `sqlite3_close`/`sqlite3_close_v2`, `sqlite3_errmsg16`, `sqlite3_prepare16_v2`, `sqlite3_step`, `sqlite3_reset`, `sqlite3_finalize`, `sqlite3_db_handle`, `sqlite3_changes`, `sqlite3_total_changes`, `sqlite3_last_insert_rowid`, `sqlite3_column_count/name16/type/int64/double/text16`, `sqlite3_bind_parameter_count/index`, `sqlite3_bind_null/int/int64/double/text16`, константы `SQLITE_OK`, `SQLITE_ROW`, `SQLITE_DONE`, `SQLITE_INTEGER`, `SQLITE_FLOAT`, `SQLITE_NULL`, `SQLITE_OPEN_READWRITE`, `SQLITE_OPEN_CREATE`, `SQLITE_TRANSIENT` (sqlite.v:2-101). Объекты 1С: `CLSID_ValueTable`, `IID_IValueTableColumns`, `VTColumnInfo`, `CLSID_ValueStruct`, `IID_IValueStructure`, `IValueArray`, `IVTRow`/`IVTRowRO`. Хост: `currentProcess().createByClsid`, `setComException`, `stringFromAddress`, `var2val`/`val2var`, `is_name_symbol`, `mem::word`.

**Взаимодействия.**
- Предоставляет аддинам: `SqliteBase` (через глобальную функцию `sqliteOpen` Designer — com_designer.as:346) и `SqliteQuery` (через `prepare`); результаты — 1С-объекты ТаблицаЗначений/Структура.
- Предоставляет движку: класс `SqliteBase` (используется только com_designer.as). Остальные классы файла используются только внутри него.
- Потребляет: com_designer.as (создание соединения), нативный прелюд sqlite.v.

**Версионные ветки.** Нет.

**Особенности.**
- Проверочный код в хвостовом комментарии (350-372): примеры `exec` с `answerIsID`, связки `prepare().bind().exec()` с `ВыбратьСтроку()`, пачка запросов с массивом результатов, **полнотекстовый поиск через fts4** (`create virtual table ... using fts4(tokenize=unicode61)` и `where content match 'зи* дро*'`).
- Имена колонок ТЗ/полей Структуры санитизируются заменой недопустимых символов идентификаторов 1С на `'_'`; заголовок колонки ТЗ сохраняет оригинальное имя.
- `bind` различает целые и дробные Numeric по точности (`prec == 0`) — иначе дробные числа терялись бы.
- `SQLITE_TRANSIENT` — sqlite копирует строку сам (в .v есть опечатка `SQLITE_TRANSIEN`, sqlite.v:100-101, но по значению 0x0103 это то же).
- Ошибки sqlite пробрасываются в скрипт как COM-исключения (`setComException`), включая номер запроса в пачке.

---

## Связи внутри группы

**Создание и корень.** Все объекты группы создаются в конструкторе `Designer` (com_designer.as:58-59): `IV8Windows` и `IV8MetaData` — сразу при старте `Designer` (внутри пакета `pkAddinMgr`, уровень `piOnFirstIdle`); их конструкторы в этот момент ставят перехваты (com_windows.as:17-19 — заголовок/MsgBox/Message; com_metadata.as:22-24 — открытие конфигураций и подписка на события метаданных) и регистрируют idle-обработчики. `ITextWindow`, `V8Value`, `SqliteBase`/`SqliteQuery` — ленивые/по запросу. Аддины видят: `windows` и `metadata` как поля `Designer`, `ITextWindow` — через `snegopat.activeTextWindow()`/`createTextWindow`/`openModule()`, `V8Value` — через `toV8Value()`, `SqliteBase` — через `sqliteOpen()`.

**com_windows.as ↔ com_metadata.as.** `IV8View.mdObj`/`mdProp` (com_windows.as:624-640) — это md-обёртки из com_metadata.as (`getMDObjectWrapper`, `getMDPropWrapper`, глобальная `mdService`), а сырые данные достаются файловыми функциями `getMdObjFromView`/`getMdPropIDFromView` (док-синки, память); иконки view (`IV8View.icon`, com_windows.as:612) конвертируются `image2pict` из com_metadata.as. Обратно — md-мир не знает про окна.

**com_windows.as ↔ com_textwindow.as.** Прямой связи нет; их объединяет textwnd.as: `TextWnd` (владелец текстового окна) отдаёт `ITextWindow` (com_textwindow.as:24) через `getComWrapper` (textwnd.as:595), а `IV8View.getInternalForm` (com_windows.as:602) уводит в controls.as (`IV8Form`). Модальность `IV8Windows.modalMode` учитывается `Snegopat.showMethodsList` (com_snegopat.as:131) и аддинами-редакторами.

**com_textwindow.as ↔ com_metadata.as.** `ITextWindow.mdCont/mdObj/mdProp` (com_textwindow.as:191-207) — прямые вызовы фабрик com_metadata.as над `TextDocMdInfo` (textwnd.as:235), заполненным при подключении расширения модуля. Обратная связь сильнее: `IV8MDObject.openModule` (com_metadata.as:578) — мост «метаданные → текстовое окно»: открывает модуль через `IMDEditModuleHelper.openModule`, находит наш `TextDoc` в `textDocStorage` и окно `tdoc.findWnd(textEditor)`, возвращает `TextWnd.getComWrapper()` — тот самый `ITextWindow`. `IV8MDContainer._container()` используется textwnd.as (через `getMDObjectWrapper(...).get_container()._container()`, textwnd.as:253).

**com_metadata.as ↔ остальной движок.** Поставляет движку утилиты: `editedMetaDataCont` (com_designer.as:107 — настройки новых объектов 1С из `v8New`; ModuleTextProcessor.as — контекст модуля), `image2pict` (grid.as, com_commands.as — иконки), `mdObjName`/`mdObjFullName`/`mdPropName` (ModuleTextProcessor.as, ModuleElements.as — построение имён методов), `variantPtr` (colorer.as, controls.as — x64-безопасное чтение BSTR из VARIANT), событие `MetaDataEvent` — главный канал уведомления аддинов об изменениях конфигурации (по нему, например, перестраивают деревья/кэши аддины).

**com_v8value.as и com_sqlite.as — терминальные потребители.** Оба зависят только от нативного прелюда (`var2val`/`val2val`, sqlite.v) и root-слоя: `V8Value` создаётся методом `Designer.toV8Value`, `SqliteBase` — методом `Designer.sqliteOpen` (само соединение открывается там же, com_designer.as:346-357). Ни один из них не вызывается из остальных файлов группы.

**com_v8ti.as — изолированная заготовка.** Единственный файл группы без действующей инициализации (пакет закомментирован, com_v8ti.as:12). Его потребителем был бы отладчик/браузер COM-объектов; механика (`TrapVirtualStdCall` на слоты 3/4 IDispatch + рукописный `ITypeInfo`) не пересекается с остальной группой — роднит его с com_windows.as/com_metadata.as только использование `AStoIUnknown`/`createDispatchFromAS` и констант com.v.

**Общие паттерны группы:** (1) обёртки-фабрики с кэшами по адресам объектов платформы (`viewWrappers`, `contFind`/`contWrappers`, `mdClasses`, `mdProps`, `pictCache`) либо сознательно без кэша (`getMDObjectWrapper`) с методом `isSame`; (2) чтение недокументированных данных платформы из памяти по версионным смещениям из v8api/*.v (`ActiveViewInCoreFrame`, `ViewContextOffset`, `ViewContextInView`, `MetaDataObjInEventRecipientOffset`, `pictOffset`, поля `DocSinkRef`); (3) превращение низкоуровневых перехватов в COM-события через `oneDesigner._events.fireEvent` + объект-параметр (`ISetMainTitleHook`, `IMsgBoxHook`, `IMessageParams`, `IV8MetaDataEvent`) с полем `cancel`/`result` для обратной связи; (4) C++-исключения платформы → `setComException` через `ExceptionCatcher`/`CppCatch`; (5) плотная диагностическая обвязка (`diagAlways`/`dbgLog`/`dbgDumpVT`/`dumpVtable`), включаемая трассировкой из diag.as.
