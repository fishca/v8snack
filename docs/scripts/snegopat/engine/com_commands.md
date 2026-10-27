## `snegopat/engine/com_commands.as`

- Язык: **AngelScript**, строк: **103**, объявлений: **21**
- Назначение: Работа с командами из скриптов. /
- Состав: class — 3, func — 18

- `class ICmdUpdateResult`

### внутри `ICmdUpdateResult`

- `bool get_enabled()` — [propget, helpstring("Доступна")]
- `bool get_checked()` — [propget, helpstring("Помечена")]
- `string get_text()` — [propget, helpstring("Текст")]
- `string get_description()` — [propget, helpstring("Описание")]
- `string get_tooltip()` — [propget, helpstring("Тултип")]
- `uint get_subCommands()` — [propget, helpstring("Состав подкоманд")]
- `ICmdUpdateResult&& getCommandState(const CommandID& cmd, int subCommand)`
- `ICmdUpdateResult&& getCommandStateRecv(const CommandID& cmd, int subCommand, ICommandReceiver&& recv)`

### верхний уровень

- `class CommandService`

### внутри `CommandService`

- `CommandDescription&& getCommandDescription(string groupUuid, uint number)`
- `string groupPresentation(string groupID)`

### верхний уровень

- `class CommandDescription`

### внутри `CommandDescription`

- `string get_group()`
- `uint get_num()`
- `string get_text()`
- `string get_accel()`
- `Variant get_picture()`
- `string get_description()`
- `string get_tooltip()`
- `string get_presentation()`
