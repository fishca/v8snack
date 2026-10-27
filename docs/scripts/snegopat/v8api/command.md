## `snegopat/v8api/command.v`

- Язык: **v8api (.v)**, строк: **123**, объявлений: **56**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 6, method — 24, meths — 2, prop — 9, props — 4, slot-skip — 1, struct — 3, virt — 7

- `:struct CommandID` — Описание интерфейсов работы с командами

### внутри `CommandID`

- `:props`
- `Guid group`
- `uint num`
- `:meths`
- `void ctor(const Guid&in group, size_t num)`

### верхний уровень

- `:struct Command`

### внутри `Command`

- `:props`
- `CommandID id`
- `int param`
- `int_ptr object`
- `:meths`
- `void ctor(const CommandID&in _id, size_t p)`

### верхний уровень

- `:iface ICommandState {E4328FC0-D97B-11d3-8A57-008048DA06DF}`

### внутри `ICommandState`

- `:virt`
- `long param()`
- `void enable(bool enable)`
- `void setCheck(bool check)`
- `void setText(const v8string&in text)`
- `пропуск слотов: +1`
- `void setDescription(const v8string&in text)`
- `void setTooltipText(const v8string&in text)`

### верхний уровень

- `:iface ICommandTarget {9A76B5C0-D992-11d3-8A57-008048DA06DF}`

### внутри `ICommandTarget`

- `:virt`
- `bool onExecute(const Command&in command)` — вызов обработчика команды
- `bool onQueryStatus(ICommandState@ state)` — запрос статуса команды
- `bool request(const CommandID& id)` — поиск обработчика команды без вызова

### верхний уровень

- `:iface ICommandReceiver {377A2018-C51B-4cf5-AC03-A1509266DF2D}`

### внутри `ICommandReceiver`

- `:virt`
- `void transmitCommand(const Command&in command, bool deactivate = true)` — передача команды на выполнение
- `void updateState(ICommandState@ state)` — запрос обновления команды
- `bool hasHandler(const CommandID&in id)` — определяет наличие обработчика

### верхний уровень

- `:iface IListCmdState {8F8095EE-3DF3-4B90-BD15-C06CFF6149AC}`

### внутри `IListCmdState`

- `:virt`
- `void setCount(uint count)`

### верхний уровень

- `:iface ICmdStateImpl {70A10FE2-2D9D-4B4F-B157-75F15557BE9D}`

### внутри `ICmdStateImpl`

- `:virt`
- `void setCommand(const CommandID& id, IUnknown@+ state)`
- `:props`
- `CommandID id`

### верхний уровень

- `:struct KeyAccel`

### внутри `KeyAccel`

- `:props`
- `v8string text`
- `uint vkCode`
- `uint8 flags`

### верхний уровень

- `:iface ICmdDescription {3A3AA3A0-DE39-11D3-8A57-008048DA06DF}`

### внутри `ICmdDescription`

- `:virt`
- `void id(CommandID&)`
- `v8string text()`
- `uint image(IImage@&)`
- `v8string accelText()`
- `v8string description()`
- `v8string tooltip()`
- `v8string presentation()`
- `:virt`
- `uint commandDescription(ICmdDescription@&, const CommandID& id)`
