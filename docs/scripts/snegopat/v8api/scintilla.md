## `snegopat/v8api/scintilla.v`

- Язык: **v8api (.v)**, строк: **64**, объявлений: **48**
- Назначение: �������� ����������� Scintilla.
- Состав: prop — 36, props — 6, struct — 6

- `:struct Sci_CharacterRange`

### внутри `Sci_CharacterRange`

- `:props`
- `Sci_PositionCR cpMin`
- `Sci_PositionCR cpMax`

### верхний уровень

- `:struct Sci_TextRange`

### внутри `Sci_TextRange`

- `:props`
- `Sci_CharacterRange chrg`
- `int_ptr lpstrText`

### верхний уровень

- `:struct Sci_TextToFind`

### внутри `Sci_TextToFind`

- `:props`
- `Sci_CharacterRange chrg`
- `int_ptr lpstrText`
- `Sci_CharacterRange chrgText`

### верхний уровень

- `:struct Sci_Rectangle`

### внутри `Sci_Rectangle`

- `:props`
- `int left`
- `int top`
- `int right`
- `int bottom`

### верхний уровень

- `:struct Sci_NotifyHeader`

### внутри `Sci_NotifyHeader`

- `:props`
- `HWND hwndFrom`
- `uptr_t idFrom`
- `uint code`

### верхний уровень

- `:struct SCNotification`

### внутри `SCNotification`

- `:props`
- `Sci_NotifyHeader nmhdr`
- `Sci_Position position`
- `int ch`
- `int modifiers`
- `int modificationType`
- `int_ptr text`
- `Sci_Position length`
- `Sci_Position linesAdded`
- `int message`
- `uptr_t wParam`
- `sptr_t lParam`
- `Sci_Position line`
- `int foldLevelNow`
- `int foldLevelPrev`
- `int margin`
- `int listType`
- `int x`
- `int y`
- `int token`
- `Sci_Position annotationLinesAdded`
- `int updated`
- `int listCompletionMethod`
