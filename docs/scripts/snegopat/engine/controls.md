## `snegopat/engine/controls.as`

- Язык: **AngelScript**, строк: **522**, объявлений: **47**
- Назначение: Перехват модальных окон, работа с формами и контролами /
- Состав: class — 6, func — 35, funcdef — 6

- `class IExtControl {};`
- `class IV8Control`

### внутри `IV8Control`

- `void _detach()`
- `Variant get_value()`
- `void set_value(Variant newVal)`
- `uint get_id()`
- `string get_name()`
- `int get_hwnd()`
- `IExtControl&& get_extInterface()`
- `IObjectProperties&& get_props()`

### верхний уровень

- `class IV8Form`

### внутри `IV8Form`

- `IV8Control&& _getControl(uint ctrlId)`
- `void detach()`
- `uint get_controlsCount()`
- `IV8Control&& getControl(Variant IdxOrCode)`
- `bool get_trapDialogEvents()`
- `void put_trapDialogEvents(bool newVal)`
- `void sendEvent(uint ctrlID, uint eventID, array<Variant>& args)`
- `ICmdUpdateResult&& getCmdState(string cmdGroupUUID, uint cmdNumber, Variant subCommandIdx = -1)`
- `bool sendCommand(string cmdGroupUUID, uint cmdNumber, uint subCommandIdx=-1)`
- `ICmdUpdateResult&& getCtrlCmdState(uint ctrlID, string cmdGroupUUID, uint cmdNumber, Variant subCommandIdx = -1)`
- `bool sendCtrlCommand(uint ctrlID, string cmdGroupUUID, uint cmdNumber, uint subCommandIdx)`
- `IV8Control&& get_activeControl()`
- `void set_activeControl(IV8Control&& val)`
- `funcdef bool POnInitialUpdate(IFramedView&);` — Реализация перехвата открытия модальных окон
- `funcdef void POnFinalOpen(IFramedView&);`

### верхний уровень

- `class DoModalPatchedTables`
- `class ModalDialogInfo`

### внутри `ModalDialogInfo`

- `void doFinalOpen()`

### верхний уровень

- `class IDoModalHook`

### внутри `IDoModalHook`

- `string get_caption()`
- `IV8Form&& get_form()`
- `void _reset()`
- `bool onFrameViewInitialUpdate_trap(IFramedView& pView)`
- `void onFrameViewFinalOpen_trap(IFramedView& pView)`
- `DoModalPatchedTables&& findPatchedTable(IFramedView& view)` — Функция направляет view на копию vtable, в которой перехвачены два метода. для каждого типа создаётся своя копия vtable, запоминая оригинальные адреса этих методов.
- `bool generateModalEvent(IFramedView&& pView, int& result, bool& bCreated)` — / с флагом afterDoModal, убираем view из списка. После в обеих функциях вызываем оригинальные методы. При возврате бросаем событие его вызов был через первую функцию, событие не генерим. Иначе всё как в первой функции. Во второй функции предварительно ищем view в списке - если он там есть, значит, две функции - onInitialUpdate и onFinalOpen. Сам view заносим в список. у view указатель на vtable, поменяв его на копию vtable, в которой перехвачены сразу возвращаем результат, установленный обработчиком. В противном случае изменяем Если кто-то из обработчиков отменил показ диалога - оригинальную функцию не вызываем, состоянием beforeDoModal. Перехватим обе. В первой функции сначала сгенерим событие onDoModal с для некоторых - сначала первая, а из неё - вторая. Таких функций две. Для некоторых диалогов вызывается сразу вторая функция, Перехват функций, вызываемых для показа модальных диалогов.
- `void afterModal(IFramedView& pView, int result)` — После закрытия модального диалога
- `funcdef int DoModal1Func(IBkEndUI&, IFramedView&, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr);`
- `int doModal1_trap(IBkEndUI& pThis, IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7, int_ptr i8)`
- `funcdef int DoModal1Func(IBkEndUI&, IFramedView&, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr);`
- `int doModal1_trap(IBkEndUI& pThis, IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7, int_ptr i8, int_ptr i9)`
- `funcdef int DoModal2Func(IBkEndUI&, IFramedView&, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr);`
- `int doModal2_trap(IBkEndUI& pThis, IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7)`
- `funcdef int DoModal2Func(IBkEndUI&, IFramedView&, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr, int_ptr);`
- `int doModal2_trap(IBkEndUI& pThis, IFramedView& pView, int_ptr i1, int_ptr i2, int_ptr i3, int_ptr i4, int_ptr i5, int_ptr i6, int_ptr i7, int_ptr i8)`
- `bool setTrapOnDoModal()`
