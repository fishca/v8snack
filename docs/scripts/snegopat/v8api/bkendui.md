## `snegopat/v8api/bkendui.v`

- Язык: **v8api (.v)**, строк: **233**, объявлений: **46**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 1, method — 17, meths — 3, prop — 14, props — 2, slot-skip — 5, struct — 2, virt — 2

- `:virt`
- `void openView(IFramedView& view, const ViewPosition& pos=ViewPosition(), int openIn=0, bool activate=true, const Guid& g=IID_NULL)`
- `void openView(IFramedView& view, const ViewPosition& pos=ViewPosition(), int openIn=0, bool activate=true, const Guid& g=IID_NULL, const Rect& r=kEmptyRect)`
- `пропуск слотов: +1`
- `int doModal1(IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7, int_ptr i8)`
- `int doModal1(IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7, int_ptr i8, int_ptr i9)`
- `int messageBox(const v8string&in text, int_ptr type=0, int_ptr timeout=0, int_ptr caption=0, HWND parent=uint(-1), mbp& param=mbp(), int_ptr i1=0, int_ptr i2=0, int_ptr i3=0)`
- `int messageBox(const v8string&in text, int_ptr type=0, int_ptr timeout=0, int_ptr caption=0, HWND parent=uint(-1), mbp& param=mbp(), int_ptr i1=0, int_ptr i2=0, int_ptr i3=0, int_ptr i4=0, int_ptr i5=0)`
- `пропуск слотов: +1`
- `int messageBox(const v8string&in text, int_ptr type=0, int_ptr timeout=0, int_ptr caption=0, HWND parent=0, mbp& param=mbp(), int_ptr i1=0, int_ptr i2=0, int_ptr i3=0, int_ptr i4=0, int_ptr i5=0)`
- `пропуск слотов: +1`
- `int doModal2(IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7)`
- `int doModal2(IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7, int_ptr i8)`
- `ModalStates currentModalState()` — Модальное состояние
- `int doMsgLine(const v8string&in text, int_ptr marker=mNone, const Guid&in g=IID_NULL, int_ptr i1=0, IUnknown@ pUnkObject=null, const V8Picture&in customMarker=V8Picture())`
- `пропуск слотов: +21`
- `пропуск слотов: +22`
- `bool GetFileName(SelectFileName& data, int_ptr timeout, HWND parent)`
- `:iface MyMessageHandler {AA7D47D7-FBFB-489E-ACF0-5F90A7AE4744}` — Это мой интерфейс для организации клика на строке в окне сообщений

### внутри `MyMessageHandler`

- `:virt`
- `void process()`

### верхний уровень

- `:struct mbp`

### внутри `mbp`

- `:props`
- `int i1`
- `int i2`
- `int p1`
- `int p2`
- `int i3`
- `uint8 c1`
- `:meths`
- `void ctor()`
- `:meths`
- `void ctor()`

### верхний уровень

- `:struct SelectFileName`

### внутри `SelectFileName`

- `:props`
- `SelectFileMode mode`
- `uint flags`
- `v8string filterString`
- `uint filterIndex`
- `v8string defExt`
- `v8string initialFileName`
- `v8string directory`
- `v8string title`
- `:meths`
- `void Message(const string& text, MessageMarker mm=mNone)`
- `int MsgBox(const string& text, int type=mbOK, const string& caption="", uint timeout=0)`
