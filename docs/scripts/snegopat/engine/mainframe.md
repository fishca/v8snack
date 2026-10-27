## `snegopat/engine/mainframe.as`

- Язык: **AngelScript**, строк: **189**, объявлений: **31**
- Назначение: Тут часть кода, работающая с основным окном /
- Состав: class — 5, func — 26

- `void initWorkWithMainFrame()`
- `class EventTopLevelFrame`

### внутри `EventTopLevelFrame`

- `void onEvent(const Guid&in eventID, int_ptr val, IUnknown& obj)`

### верхний уровень

- `class MyCommandState` — Класс-приемник информации о состоянии команды, для реализации ICommandState

### внутри `MyCommandState`

- `int_ptr id()` — x64: адреса — int_ptr; uint обрезал указатели, и 1С падала в frame.dll на «списочных» командах
- `int param()`
- `int_ptr object(int_ptr i)`
- `void enable(bool enable)`
- `void setCheck(bool check)`
- `void setText(const v8string& str)`
- `void u1(int_ptr u)`
- `void setDescription(const v8string& str)`
- `void setTooltipText(const v8string& str)`
- `void u2(int_ptr u)`
- `void t1()`
- `void t2()`
- `void t3()`
- `void t4()`
- `void t5()`

### верхний уровень

- `class MyCommandStateList`

### внутри `MyCommandStateList`

- `void setCount(uint c)`

### верхний уровень

- `class CommandState`

### внутри `CommandState`

- `uint commandState(const CommandID& cmd, int subCommand = -1)`
- `CommandState&& getMainFrameCommandState(const CommandID& cmd, int subCommand = -1)`
- `CommandState&& getCommandState(const CommandID& cmd, int subCommand, ICommandReceiver&& cmdReceiver)`
- `bool sendCommandToCmdRecv(const CommandID& cmd, int subCommandIdx, ICommandReceiver&& pCmdRcv)`
- `bool sendCommandToMainFrame(const CommandID& cmd, int subCommandIdx = 0)`
- `void wakeIdle()` — Разбудить цикл сообщений платформы. «Простой» (onIdle) наступает только после обработки очередного сообщения: если очередь пуста и ничего не приходит, отложенные на простой дела (первый простой при старте — загрузка аддинов и окон, показ списка подсказки) ждут следующего события: клика или мигания курсора, то есть секунду и дольше (Лонмади 2026-10-13: «ожидание простоя 1735 мс», окна не разворачивались, пока не кликнешь в окно). Сообщение WM_NULL в очередь потока ничего не делает, но заставляет цикл сделать оборот и вызвать простой.

### верхний уровень

- `class IdleHandler`

### внутри `IdleHandler`

- `bool onIdle(size_t count)`
- `int unknown()`
