## `snegopat/engine/typereader.as`

- Язык: **AngelScript**, строк: **467**, объявлений: **39**
- Назначение: Чтение инфы из типов /
- Состав: class — 9, func — 29, funcdef — 1

- `class BuiltinFuncItem : SmartBoxInsertableItem, MethodInsertable`

### внутри `BuiltinFuncItem`

- `void textForTooltip(string& text)`

### верхний уровень

- `class TypeNameItem : SmartBoxInsertableItem`

### внутри `TypeNameItem`

- `void textForInsert(string&out text)`
- `void textForTooltip(string& text)`

### верхний уровень

- `class ItemAfterType : SmartBoxInsertableItem`

### внутри `ItemAfterType`

- `void textForTooltip(string& text)`
- `void textForInsert(string& out text)`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `class ItemAfterQueryType : SmartBoxInsertableItem`

### внутри `ItemAfterQueryType`

- `void textForTooltip(string& text)`
- `void textForInsert(string& out text)`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `class GlobalContextMethod : SmartBoxInsertableItem, MethodInsertable`

### внутри `GlobalContextMethod`

- `void textForTooltip(string& text)`

### верхний уровень

- `class GlobalContextProp : SmartBoxInsertableItem`

### внутри `GlobalContextProp`

- `void textForTooltip(string& text)`

### верхний уровень

- `class SysEnum : SmartBoxInsertableItem`

### внутри `SysEnum`

- `void textForTooltip(string& text)`
- `void textForInsert(string&out text)`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `class ExtContextMethod : SmartBoxInsertableItem, MethodInsertable`

### внутри `ExtContextMethod`

- `void textForTooltip(string& text)`

### верхний уровень

- `class ExtContextProp : SmartBoxInsertableItem`

### внутри `ExtContextProp`

- `void textForTooltip(string& text)`
- `void addStockGroups(IntelliSite& site, typeOfStockGroups ts)`
- `void addAllStock(IntelliSite& site)`
- `void addBuiltinFunc(IntelliSite& site)`
- `void addTypeNames(IntelliSite& site)`
- `void prepareV8StockItems()`
- `void readBuiltinFuncs()` — Получение информации о встроенных функциях
- `void readTypeNames()` — Чтение названий имен типов для Новый
- `void readGlobals()`
- `funcdef SmartBoxItem&& CreateSmartBoxItem(const string& name);`
- `SmartBoxItem&& createGlobalPropItem(const string& name)`
- `SmartBoxItem&& createSysEnumItem(const string& name)`
- `void readContextDef(IContextDef&& pDef, array<array<SmartBoxItem&&>>& store, const string& context)` — Функция чтения состава какого-либо стокового контекста и создания для него групп элементов для списка
- `void readUnknown(IUnknown&& pUnk, array<array<SmartBoxItem&&>>& store, const string& context)` — Функция пробует заполучить из неизвестного интерфейса контекстные интерфейсы и прочитать их
- `void readType(const Guid& clsid, ITypesInfoProvider& pTIP, array<array<SmartBoxItem&&>>& store, const string& context)`
