## `snegopat/engine/com_textwindow.as`

- Язык: **AngelScript**, строк: **219**, объявлений: **22**
- Назначение: Обёртка для работы из аддинов с текстовым окном 1С. /
- Состав: class — 2, func — 20

- `class Selection`
- `class ITextWindow` — Класс для скриптов

### внутри `ITextWindow`

- `void _disconnect()`
- `bool get_isAlive()`
- `string get_text()` — [propget, helpstring("Возвращает текст этого окна")]
- `Selection&& getSelection()` — [helpstring("Получить границы выделенного текста")]
- `void setSelection(int beginRow, int beginCol, int endRow, int endCol)` — [helpstring("Установить границы выделенного текста")]
- `string get_selectedText()` — [propget, helpstring("Получить/установить выделенный текст")]
- `void set_selectedText(const string& text)` — [propput, helpstring("Получить/установить выделенный текст")]
- `Selection&& getCaretPos()` — [helpstring("Получить положение курсора")]
- `void setCaretPos(int row, int col)` — [helpstring("Установить положение курсора")]
- `uint get_linesCount()` — [propget, helpstring("Количество строк")]
- `string line(int lineNumber)` — [helpstring("Текст строки по номеру (нумерация с 1)")]
- `bool get_readOnly()` — [propget, helpstring("Текст только для чтения")]
- `uint get_hwnd()` — [propget, helpstring("HWND окна")]
- `uint get_textMgr()` — [propget, helpstring("Адрес внутреннего менеджера текста")]
- `string extName()` — [propget, helpstring("Выбранное расширение редактора")]
- `Variant get_textDocument()` — Это на пробу, что выйдет. Возвращает одинэсный объект ТекстовыйДокумент
- `IV8MDContainer&& get_mdCont()` — Это пока не делаем, это метаданные. Присутствуют для совместимости [propget, helpstring("Контейнер метаданных, если есть")]
- `IV8MDObject&& get_mdObj()` — [propget, helpstring("Объект метаданных, если есть")]
- `IV8MDProperty&& get_mdProp()` — [propget, helpstring("Свойство объекта метаданных, если есть")]
- `Variant get_extObject()` — [propget, helpstring("Внешний объект")]
