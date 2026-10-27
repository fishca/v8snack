## `snegopat/engine/com_events.as`

- Язык: **AngelScript**, строк: **247**, объявлений: **19**
- Назначение: Реализует объект events из SnegAPI. /
- Состав: class — 4, func — 14, funcdef — 1

- `class IEventConnector`

### внутри `IEventConnector`

- `HandlerNode&& connect(IDispatch&& pSource, const string& eventName, IDispatch&& handler, string handlerName = "")` — [helpstring("Подключить обработчик события")]
- `void disconnect(IDispatch&& pSource, const string& eventName, IDispatch&& handler, string handlerName = "")` — [helpstring("Отключить обработчик события")]
- `void disconnectNode(HandlerNode&& node)`
- `void fireEvent(IDispatch&& pSource, const string& eventName, array<Variant>&& args)` — [vararg, helpstring("Вызвать событие")]
- `HandlerNode&& addCommandHandler(const string& cmdGroupUUID, uint cmdNumber, IDispatch&& handler, string handlerName)` — [helpstring("Подключить обработчик команд 1С")]
- `void delCommandHandler(const string& cmdGroupUUID, uint cmdNumber, IDispatch&& handler, string handlerName)` — [helpstring("Отключить обработчик команд 1С")]
- `string _getCmdEventName(const string&in uuid, int num)`
- `bool _hasHandlers(IDispatch&& source, const string& eventName)`
- `void removeMyListeners(IDispatch&& pSource)`
- `EventNode&& getEventNode(IDispatch&& pSrc, const string& eventName, bool create = false)`
- `void disconnectImpl(IDispatch&& pSource, const string& eventName, IDispatch&& handler, string handlerName = "")`
- `void deleteRemoved()`

### верхний уровень

- `class HandlerNode`
- `class EventNode`

### внутри `EventNode`

- `funcdef void FTransmitCommand(ICommandReceiver&, const Command&, bool);`
- `void transmitCommandTrap(ICommandReceiver& cmdRecv, const CommandRef&& command, bool deactivate)`
- `void setCmdTrap()`

### верхний уровень

- `class CmdHandlerParam`
