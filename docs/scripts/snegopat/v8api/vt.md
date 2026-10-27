## `snegopat/v8api/vt.v`

- Язык: **v8api (.v)**, строк: **153**, объявлений: **105**
- Назначение: Описание интерфейсов 1С.
- Состав: base — 10, iface — 15, method — 47, meths — 1, prop — 7, props — 2, slot-skip — 6, struct — 2, virt — 15

- `:iface IIndexedCollectionRO {920E4923-2CAF-4E62-9618-C80B9C3D75EC}` — vt.v - интерфейсы для работы с ТаблицейЗначений, Массивом, ДеревомЗначений

### внутри `IIndexedCollectionRO`

- `:virt`
- `uint count()`
- `uint at(Value&out val, uint idx)`

### верхний уровень

- `:iface IIndexedCollectionFS {0D4B9A60-A032-4AFD-8E5A-C7FA10D1CA2C}`

### внутри `IIndexedCollectionRO`

- `:base IIndexedCollectionRO`
- `:virt`
- `void setAt(uint idx, const Value& value)`

### верхний уровень

- `:iface IValueArray {B98D9CE2-D69F-4A6A-B49E-B25416CD866F}`

### внутри `IIndexedCollectionFS`

- `:base IIndexedCollectionFS`
- `:virt`
- `void setCount(uint count)`
- `void insertAt(uint idx, const Value& value)`
- `void remove(uint idx)`

### верхний уровень

- `:iface IVTColumnRO {90D6BA06-6962-4EFC-ABAF-7F010DF91864}`

### внутри `IVTColumnRO`

- `:virt`
- `uint index()`
- `uint name(int alias)`
- `uint type(TypeDomainPattern&out)`
- `v8string title()`
- `uint width()`
- `bool colInfo(VTColumnInfo&out info)`

### верхний уровень

- `:iface IVTColumn {775383C9-59D7-496E-84AC-4FE30DFD3A38}` — uint columnContainer(IValueTableBaseRO@&)

### внутри `IVTColumnRO`

- `:base IVTColumnRO`
- `:virt`
- `void setName(const v8string& name)`
- `void setType(const TypeDomainPattern& type)`
- `void setTitle(const v8string& title)`
- `void setWidth(uint width)`
- `void setColumnInfo(const VTColumnInfo& info)`

### верхний уровень

- `:iface IVTRowRO {F72AB106-96DB-4CE0-80B0-50D6DE1BEEA3}`

### внутри `IVTRowRO`

- `:virt`
- `uint index()`
- `uint columnCount()`
- `пропуск слотов: +1`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IVTRow {68F3330B-9CDB-4DFD-8702-FF38F90C10EE}`

### внутри `IVTRowRO`

- `:base IVTRowRO`
- `:virt`
- `bool setValue(const int& columnId, const Value& value)`
- `bool setValueAt(uint column, const Value& value)`
- `void load(IVTRowRO@+ src)`

### верхний уровень

- `:iface IValueTableBaseRO {7920ABFF-B178-4575-9263-4B9BA79ABADF}`

### внутри `IValueTableBaseRO`

- `:virt`
- `uint columnCount()`
- `пропуск слотов: +16`

### верхний уровень

- `:iface IValueTableBase {A1DBEEE1-03E5-40D7-9BD6-C8763F7D8CB0}`

### внутри `IValueTableBaseRO`

- `:base IValueTableBaseRO`
- `:virt`
- `void setRowCount(uint count)`
- `uint addRow(IVTRowRO@&)`
- `uint insertRow(IVTRowRO@+, uint index)`
- `void deleteRow(uint index)`
- `void deleteRows()`
- `void moveRow(uint index, int offset)`
- `bool setValue(uint row, const int& id, const Value& value)`
- `bool setValueAt(uint row, uint column, const Value& value)`
- `пропуск слотов: +2`

### верхний уровень

- `:iface IValueTableColumns {E17D31E5-14C3-4A66-83B1-1B943B542A4C}`

### внутри `IValueTableBase`

- `:base IValueTableBase`
- `:virt`
- `void setColumnCount(uint count)`
- `uint addColumn(IVTColumnRO@&, const VTColumnInfo& info, const int& id)`
- `uint insertColumn(IVTColumnRO@&, uint index, const VTColumnInfo& info, const int& id)`
- `пропуск слотов: +4`

### верхний уровень

- `:iface IValueTable {B7C66F56-E802-4B6C-BE2E-733E40AC6A3C}`

### внутри `IValueTableColumns`

- `:base IValueTableColumns`
- `:virt`
- `void f()`

### верхний уровень

- `:iface IValueSubTree {2B3C14FE-F864-414A-B27F-252D72CCED32}`

### внутри `IValueTableBase`

- `:base IValueTableBase`
- `:virt`
- `uint parentRow(IVTRowRO@&)`

### верхний уровень

- `:iface IValueTreeRow {93E2A4CE-5E45-4A25-9601-3DC3103AF140}`

### внутри `IVTRow`

- `:base IVTRow`
- `:virt`
- `uint parentRow(IValueTreeRow@&)`
- `uint parentTree(IValueTableBaseRO@&)`
- `bool hasChild()`
- `uint subTree(IValueSubTree@&)`
- `uint level()`

### верхний уровень

- `:iface IValueTree {108B9848-B862-4DC3-A906-E2CE6326870F}`

### внутри `IValueTableColumns`

- `:base IValueTableColumns`
- `:virt`
- `void f()`

### верхний уровень

- `:struct VTColumnInfo`

### внутри `VTColumnInfo`

- `:props`
- `v8string name1`
- `v8string name2`
- `TypeDomainPattern type`
- `v8string title`
- `uint width`
- `:meths`
- `void ctor()`
- `void dtor()`

### верхний уровень

- `:struct StructKeys`

### внутри `StructKeys`

- `:props`
- `uint key1`
- `uint key2`

### верхний уровень

- `:iface IValueStructure {D55C9347-9320-49E1-B2E6-A1D2B87C1193}`

### внутри `IValueStructure`

- `:virt`
- `uint count()`
- `bool find(const StructKeys& key, Value& val)`
- `пропуск слотов: +2`
- `bool set(const v8string& key, const Value& val)`
