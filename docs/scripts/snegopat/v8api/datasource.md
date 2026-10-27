## `snegopat/v8api/datasource.v`

- Язык: **v8api (.v)**, строк: **211**, объявлений: **49**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 4, method — 18, meths — 2, prop — 9, props — 3, slot-skip — 6, struct — 3, virt — 4

- `:struct LineInfo`

### внутри `LineInfo`

- `:props`
- `bool hasChild`
- `int level`
- `bool expandable`

### верхний уровень

- `:iface IV8DataSource {8E7D2FE9-E045-4032-8CF3-3AAC9071AD01}`

### внутри `IV8DataSource`

- `:virt`
- `DataSource_SourceType getSourceType()`
- `bool getLineInfo(IV8Bookmark& bkmk, LineInfo& lineInfo)`
- `bool getCellValue(IV8Bookmark& bkmk, uint colId, Value& val)`
- `uint getLinkedBookmark(IV8Bookmark@&out, IV8Bookmark@ bkmk, LinkType lt)`

### верхний уровень

- `:iface IGridUISource {01CC8CDD-A3B3-4fa3-AFD5-7FE636FF4BB2}`

### внутри `IGridUISource`

- `:virt`
- `bool getCellFormat(IV8Bookmark& bkmk, uint colId, Value& value, CellFormat& cellFormat)`

### верхний уровень

- `:iface IGrid {3E93994E-5ED7-4D28-9B45-13193B37888E}`

### внутри `IGrid`

- `:virt`
- `пропуск слотов: +3`
- `пропуск слотов: +2`
- `bool setDataSource(IV8DataSource& dataSource, uint gridUISource = 0)`
- `void setCurrentColumnId(uint id)`
- `uint getCurrentColumnId()`
- `пропуск слотов: +1`
- `bool setActiveCell(IV8Bookmark&, uint id, bool show, RowActivateType at, int, int)`
- `uint getCurrentLine(IV8Bookmark@&)`
- `bool expandLine(IV8Bookmark& bkmk, bool expand, bool expandChildren, bool show = true)`
- `bool expandLine(IV8Bookmark& bkmk, bool expand, bool expandChildren, bool show = true, bool p = true)`
- `bool isExpandedLine(IV8Bookmark& bkmk)`
- `CheckState getCellCheck(IV8Bookmark& bkmk, uint id)`
- `void setCellCheck(IV8Bookmark& bkmk, uint id, CheckState st)`
- `пропуск слотов: +1`
- `uint columnsCount()`

### верхний уровень

- `:struct ImageInfo`

### внутри `ImageInfo`

- `:props`
- `uint image`
- `Point posInPicture`
- `uint paintStyle`
- `:meths`
- `void init()`

### верхний уровень

- `:struct CellFormat`

### внутри `CellFormat`

- `:props`
- `v8string text`
- `CheckState state`
- `uint16 validFields`
- `пропуск слотов: +256`
- `:meths`
- `void init()`

### верхний уровень

- `:iface IV8Bookmark {379295BF-7FC0-4B26-9B8B-B14505719EDC}`

### внутри `IV8Bookmark`

- `:virt`
- `пропуск слотов: +1`
