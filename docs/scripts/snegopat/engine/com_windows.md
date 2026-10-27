## `snegopat/engine/com_windows.as`

- Язык: **AngelScript**, строк: **873**, объявлений: **67**
- Назначение: Работы из аддинов с окнами 1С. /
- Состав: class — 7, func — 59, funcdef — 1

- `class IV8Windows` — Реализация объекта windows. Пока частичная.

### внутри `IV8Windows`

- `IV8View&& get_mainView()` — Основное окно
- `IV8View&& get_mdiView()` — Контейнер MDI-окон
- `ModalStates get_modalMode()` — Текущий модальный режим
- `string get_caption()` — Заголовок основного окна
- `void set_caption(const string& str)`
- `string get_mainTitle()` — Основная часть заголовка
- `void set_mainTitle(const string& str)`
- `string get_additionalTitle()` — Дополнительная часть заголовка
- `void set_additionalTitle(const string& str)`
- `bool get_propsVisible()` — Видимость окна свойств
- `void set_propsVisible(bool bVisible)`
- `IV8View&& getActiveView()` — Активное отображение
- `IV8View&& getFocusedView()` — Отображение в фокусе
- `string getInputFieldText(const Variant& ctrl)` — Данный метод позволяет получить текущий текст из поля ввода на форме, не дожидаясь перехода фокуса из поля. На вход надо подать ЭУ (Форма.ЭлементыФормы.ИмяКонтрола)
- `IV8View&& frameView(uint offset)`
- `IV8View&& getViewWrapper(const Guid& id)`
- `void clearViewMap()`
- `IMDObject&& getMdObjFromView(IFramedView&& view)`
- `Guid getMdPropIDFromView(IFramedView&& view)`

### верхний уровень

- `class IV8View` — Реализация объекта представления окна.

### внутри `IV8View`

- `IFramedView&& _getView(bool throwComError = true)`
- `bool isAlive()`
- `string probe()` — Диагностика (редактор форм): какие описанные интерфейсы поддерживает отображение и его адрес
- `string get_id()`
- `string get_title()`
- `uint get_hwnd()`
- `IV8ViewPosition&& position()`
- `IV8View&& get_parent()`
- `void merge(IV8View&& other, ViewPlacements place)`
- `ViewContainerType get_isContainer()`
- `string get_wndClass()`
- `bool get_visible()`
- `void set_visible(bool vis)`
- `IV8View&& get_activeChild()`
- `void activate()`
- `void close(bool forceClose = false)`
- `ICmdUpdateResult&& getCmdState(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = -1)`
- `bool sendCommand(string cmdGroupUUID, uint cmdNumber, int subCommandIdx = 0)`
- `IViewDocument&& getDocument()`
- `Variant getObject()`
- `IV8Form&& getInternalForm()`
- `Variant get_icon()`
- `IV8MDObject&& get_mdObj()`
- `IV8MDProperty&& get_mdProp()`
- `ViewContextRef&& getViewContext(IViewContext&& ctx)`
- `bool getViewParentID(IFramedView&& view, Guid& pid)`
- `IFramedView&& frameViewParent(IFramedView&& view)`

### верхний уровень

- `class IV8ViewPosition`

### внутри `IV8ViewPosition`

- `int get_state()` — в документации свойства есть, но не были портированы (скрипты получали ошибку)
- `int get_area()` — Сторона прикрепления (ViewPlacements: 1 слева, 2 сверху, 4 справа, 8 снизу, 16 по центру, 32 закладками)
- `bool get_mdiMax()`
- `IViewDocument&& getDocWrapper(IDocument&& d)`

### верхний уровень

- `class IViewDocument`

### внутри `IViewDocument`

- `bool saveToFile(const string& path)`
- `bool loadFromFile(const string& path)`
- `void setTrapOnChangeTitle()` — Перехват и оповещение о смене заголовка основного окна
- `funcdef void MainFrame_st(ITopLevelFrame&, const v8string&in);`
- `void MainFrame_setTitle(ITopLevelFrame&frame, const v8string&in str)`
- `void MainFrame_setAdditionalTitle(ITopLevelFrame&frame, const v8string&in str)`
- `bool fireFrameTitleChanged(const string&in mainTitle, const string&in additionalTitle)` — Оповещение о событии изменения заголовка основного окна.

### верхний уровень

- `class ISetMainTitleHook` — Объект с параметрами оповещения об изменении заголовка основного окна. Подписчик может сам изменить заголовок окна через windows.caption, и установить cancel в true, чтобы отменить штатную обработку события

### внутри `ISetMainTitleHook`

- `void setTrapOnMsgBox()`

### верхний уровень

- `class IMsgBoxHook` — Объект с параметрами оповещения о Предупреждении

### внутри `IMsgBoxHook`

- `void setTrapOnMessage()` — Перехват и оповещение о Сообщить
- `int doMsgLineTrap(IBkEndUI& pUI, const v8string&in text, int_ptr marker, const Guid&in g, int_ptr i1, IUnknown& pUnkObject, const V8Picture&in customMarker)`

### верхний уровень

- `class IMessageParams`
