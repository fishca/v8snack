## `snegopat/engine/grid.as`

- Язык: **AngelScript**, строк: **165**, объявлений: **29**
- Назначение: Работа с табличным полем /
- Состав: class — 4, func — 25

- `class IDataRow`

### внутри `IDataRow`

- `IDataRow&& _getRow(LinkType lt)`
- `IDataRow&& get_parent()`
- `IDataRow&& get_firstChild()`
- `IDataRow&& get_lastChild()`
- `IDataRow&& get_next()`
- `IDataRow&& get_prev()`
- `Variant getCellValue(int columnID)`
- `ICellAppearance&& getCellAppearance(long columnID)`

### верхний уровень

- `class IDataSource`

### внутри `IDataSource`

- `DataSourceType get_type()`
- `bool get_hasCellAppearance()`

### верхний уровень

- `class ICellAppearance`

### внутри `ICellAppearance`

- `string get_text()`
- `int get_checked()`
- `Variant get_picture()`
- `Variant get_addPicture()`
- `Variant get_value()`

### верхний уровень

- `class IGridCtrl : IExtControl`

### внутри `IGridCtrl`

- `IDataRow&& get_rootRow()` — корень строк, чтобы обходить таблицу/дерево без текущей строки
- `int get_columnCount()`
- `IDataRow&& get_currentRow()`
- `void set_currentRow(IDataRow&& val)`
- `int get_currentColID()`
- `void set_currentColID(int val)`
- `bool isExpanded(IDataRow&& row)`
- `void expand(IDataRow&& row, bool bExpand, bool withChilds = false)`
- `int isCellChecked(IDataRow&& row, int columnID)`
- `void checkCell(IDataRow&& row, int columnID, CheckState mark = 0)`
