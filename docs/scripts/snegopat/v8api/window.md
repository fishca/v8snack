## `snegopat/v8api/window.v`

- Язык: **v8api (.v)**, строк: **470**, объявлений: **188**
- Назначение: Описание интерфейсов 1С.
- Состав: base — 2, iface — 17, method — 73, meths — 3, prop — 39, props — 6, slot-skip — 26, struct — 5, virt — 17

- `:iface IView {B105A780-F121-11d3-93F7-008048DA11F9}` — Описание интерфейсов работы с окнами

### внутри `IView`

- `:virt`
- `void drawView(HDC dc, const Rect& rect, const Rect& updateRect)`
- `bool setViewEnable(bool enable)`
- `bool isViewEnable()`
- `Size getViewExtent()`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IWindowView {E3F69D70-0188-11d4-9400-008048DA11F9}`

### внутри `IView`

- `:base IView`
- `:virt`
- `пропуск слотов: +1`
- `bool createWindow(HWND parentWindow)`
- `void destroyWindow()`
- `bool showWindow(bool show)`
- `bool isWindowVisible()`
- `void moveAfter(HWND wnd)`
- `void invalidateRect(const Rect& rect, bool eraseBkgnd = true)`
- `HWND hwnd()`
- `void windowRect(Rect& rect)`
- `COLORREF getWindowBackgroundColor()`

### верхний уровень

- `:iface IFramedView {7C27C850-A0F4-11D4-84AF-008048DA06DF}`

### внутри `IFramedView`

- `:virt`
- `void setID(const Guid&in id)`
- `uint getID(Guid&out)`
- `CloseAction closeAction()`
- `void localFrame(WndType type, Guid& id, uint& style)`
- `v8string title()` — Заголовок
- `uint icon(IUnknown@&out)` — Иконка
- `void onActivate(ActivateType action, IFramedView@ otherView)` — извещение об активизации
- `void setViewFocus()` — установка фокуса
- `bool onInitialUpdate()` — окончание создания
- `void onFinalOpen()` — окончание создания и показ окна
- `void onFinalClose()`
- `void onCancelClose()`
- `bool canCloseView()`
- `void onShow(bool show)`
- `пропуск слотов: +1`
- `пропуск слотов: +2`
- `:meths`
- `void getID(Guid& guid)`

### верхний уровень

- `:iface IDocumentView {425EE301-9DD3-11D4-84AE-008048DA06DF}`

### внутри `IFramedView`

- `:base IFramedView`
- `:virt`
- `пропуск слотов: +1`
- `uint document(IDocument@&)`

### верхний уровень

- `:iface ITopLevelFrame {DE300901-A120-11d4-9429-008048DA11F9}`

### внутри `ITopLevelFrame`

- `:virt`
- `void init(const v8string&in title, HICON icon, HWND parent, const Rect&in rect, int nCmdShow)`
- `bool close(bool testAbility = false)`
- `bool canClose()`
- `void cancelClose()`
- `int frameType()`
- `пропуск слотов: +1`
- `bool closeView(Guid id, bool b = false)`
- `uint getView(IFramedView@&, Guid id)`
- `void activateView(Guid id)`
- `bool showView(Guid id, bool show)`
- `bool isViewVisible(Guid id)`
- `bool closeView(const Guid& id, bool b = false)`
- `uint getView(IFramedView@&, const Guid& id)`
- `void activateView(const Guid& id)`
- `bool showView(const Guid& id, bool show)`
- `bool isViewVisible(const Guid& id)`
- `void enumAllViews(Vector& views)`
- `uint getCoreTopLevelFrame(ITopLevelFrame@&out)`
- `uint getShellTopLevelFrame(ITopLevelFrame@&out)`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `v8string getCaption()`
- `v8string getTitle()`
- `void setTitle(const v8string&in str)`
- `void setAdditionalTitle(const v8string&in str)`
- `v8string getAdditionalTitle()`
- `пропуск слотов: +1`
- `uint commandReceiver(ICommandReceiver@&out)`

### верхний уровень

- `:iface IWindow {904BC445-3226-11D4-9859-008048DA1252}`

### внутри `IWindow`

- `:virt`
- `bool createWindow(HWND parent, const Rect&in rect, bool visible)`
- `void destroyWindow()`
- `HWND hwnd()`

### верхний уровень

- `:iface ITopLevelFrameCore {3F4ED7C1-A343-11D4-84B0-008048DA06DF}`

### внутри `ITopLevelFrameCore`

- `:virt`
- `void f()`

### верхний уровень

- `:iface IContainedObject {22D22380-87E3-11D4-9425-008048DA11F9}`

### внутри `IContainedObject`

- `:virt`
- `void setSite(IClientSite@+ site)`

### верхний уровень

- `:iface IClientSite {22D22381-87E3-11D4-9425-008048DA11F9}`

### внутри `IClientSite`

- `:virt`

### верхний уровень

- `:iface IContainer {22D22382-87E3-11D4-9425-008048DA11F9}`

### внутри `IContainer`

- `:virt`
- `uint objectsCount()`

### верхний уровень

- `:iface IFramedViewSite {547B35A0-A8E2-11D4-84B2-008048DA06DF}`

### внутри `IFramedViewSite`

- `:virt`
- `пропуск слотов: +7`
- `void split(IFramedView@+ other, ViewPlacements place, bool outside, int tabPos, int t = 0)`
- `bool canSplit()`
- `пропуск слотов: +1`
- `void getViewPosition(ViewPosition&out vp)`

### верхний уровень

- `:iface IViewContext {72B8C79E-ABD1-4FA2-8C3D-7E7F05A0F3ED}`

### внутри `IViewContext`

- `:virt`
- `uint getID(Guid&out id)`
- `:meths`
- `void getID(Guid& guid)`

### верхний уровень

- `:iface IViewLayouter {3A1DACE0-8AD3-11D4-84A6-008048DA06DF}`

### внутри `IViewLayouter`

- `:virt`
- `пропуск слотов: +5`
- `void enumAllChilds(ViewContextList& childs, bool b = false)`
- `пропуск слотов: +5`
- `uint activeTarget(ICommandTarget@&)`

### верхний уровень

- `:iface ITabbedLayouter {34F5E170-40BF-11D6-B229-0050BAE2BC79}`

### внутри `ITabbedLayouter`

- `:virt`
- `uint pagesCount()`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IViewSplitter {59077081-A106-11D5-B1DF-0050BAE2BC79}`

### внутри `IViewSplitter`

- `:virt`
- `пропуск слотов: +2`
- `bool isHorizontal()`

### верхний уровень

- `:iface IMDIClient {1CE1F0EE-56AF-4AE3-B56C-D89EEECEBBC3}`

### внутри `IMDIClient`

- `:virt`
- `пропуск слотов: +10`
- `uint childrensCount()`
- `:props`
- `Vector childsIds`

### верхний уровень

- `:iface IFormViewCore {B1C6A8A6-BC9F-11D4-9437-004095E12FC7}`

### внутри `IFormViewCore`

- `:virt`
- `пропуск слотов: +1`
- `bool updateData(bool save, int controlId)`
- `void endDialog(int result)`
- `void setFormSize(const Size& size, bool inDLU = true)`

### верхний уровень

- `:struct ViewContextListNode`

### внутри `ViewContextListNode`

- `:props`
- `int_ptr next`
- `int_ptr prev`

### верхний уровень

- `:struct ViewContextList`

### внутри `ViewContextList`

- `:props`
- `int_ptr head`
- `int_ptr end`
- `пропуск слотов: +4`

### верхний уровень

- `:struct ViewPosition` — Для уточнения смотреть IBkEndUI::OpenView и IFramedViewSite_getViewPosition

### внутри `ViewPosition`

- `:props`
- `ViewStates state`
- `int unk1`
- `bool unk2`
- `ViewPlacements area`
- `int dockLine`
- `int dockOffset`
- `Size dockSize`
- `bool canSplit`
- `Rect floatRect`
- `Rect MDI_Rect`
- `bool MDI_maxed`
- `Size autoHideSize`
- `int stateAbility`
- `int areaAbility`
- `bool splitAbility`
- `v8string MDI_ViewData`
- `v8string floatViewData`
- `v8string dockViewData`
- `v8string autoHideViewData`
- `bool center`
- `bool unk3`
- `Rect unk4`
- `size_t unk5`
- `Size unk6`
- `bool unk7`
- `:meths`
- `void ctor()`

### верхний уровень

- `:struct ViewContext`

### внутри `ViewContext`

- `:props`
- `Guid id`
- `пропуск слотов: +28`
- `пропуск слотов: +32`
- `пропуск слотов: +56`
- `пропуск слотов: +64`
- `ViewPosition vpCurrent`
- `пропуск слотов: +12`
- `ViewPosition vpOriginal`
- `Size sizeOriginal`
- `size_t s0`

### верхний уровень

- `:struct tagRECT`

### внутри `tagRECT`

- `:props`
- `long left`
- `long top`
- `long right`
- `long bottom`
