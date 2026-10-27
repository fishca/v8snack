## `snegopat/v8api/value.v`

- Язык: **v8api (.v)**, строк: **268**, объявлений: **43**
- Назначение: Описание интерфейсов 1С.
- Состав: class — 3, iface — 3, method — 16, meths — 1, prop — 11, props — 4, slot-skip — 1, struct — 1, virt — 3

- `:iface IType {FD7B6CC0-DC8E-11D2-B8D0-008048DA0335}` — Тип, описывающий тип значения 1С

### внутри `IType`

- `:virt`
- `int getTypeKind()`
- `void getString(v8string& out)`
- `bool isComType()`
- `bool isMutable()`
- `void createValue(IValue@& out)`
- `bool hasCtor(uint)`
- `void create(IValue@&out, Vector&)`

### верхний уровень

- `:iface IValue {FD7B6CC3-DC8E-11D2-B8D0-008048DA0335}` — Интерфейс значения 1С

### внутри `IValue`

- `:virt`
- `пропуск слотов: +1`
- `bool getBool(bool& out)`
- `bool getNumeric(Numeric& out)`
- `bool getString(v8string& out)`
- `bool getDate(Date& out)`
- `bool isEqual(IValue& in)`

### верхний уровень

- `:iface IEnumValCreator {A89A27EA-9190-4F45-BA27-B6A3287E26A8}`

### внутри `IEnumValCreator`

- `:virt`
- `uint create(Value&out val, int eval)`
- `void getAll(Vector& vals)`

### верхний уровень

- `:struct Date` — Простые типы значений Дата

### внутри `Date`

- `:props`
- `uint64 ticks`

### верхний уровень

- `:class Numeric` — Число

### внутри `Numeric`

- `:props`
- `uint allocked`
- `uint length`
- `uint prec`
- `uint _sign`
- `int_ptr data`
- `uint inplace1`
- `uint inplace2`
- `uint inplace3`
- `uint inplace4`
- `:meths`
- `void ctor()`
- `void dtor()`

### верхний уровень

- `:class Value` — Value

### внутри `Value`

- `:props`
- `int_ptr vtable`

### верхний уровень

- `:class Type` — Type

### внутри `Type`

- `:props`
