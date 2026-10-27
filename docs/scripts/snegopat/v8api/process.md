## `snegopat/v8api/process.v`

- Язык: **v8api (.v)**, строк: **107**, объявлений: **23**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 2, method — 7, prop — 3, props — 1, slot-skip — 6, struct — 1, virt — 3

- `:virt`
- `пропуск слотов: +1`
- `bool createByName(const v8string&in clsName, const Guid&in iid, IUnknown@&out ppObject)`
- `bool createByClsid(const Guid&in clsid, const Guid&in iid, IUnknown@&out ppObject)`
- `bool aggregateInstance(const Guid&in clsid, IUnknown@ pOuter, IUnknown@&out ptr)`
- `пропуск слотов: +1`
- `int getCategoryClasses(Vector& clsids, const Guid& clsid)`
- `пропуск слотов: +3`
- `bool registerService(const Guid&in, const Guid&in)`
- `пропуск слотов: +1`
- `пропуск слотов: +2`
- `uint32 loadComponent(uint32 name)`
- `:struct Exception`

### внутри `Exception`

- `:props`
- `Guid id`
- `v8string descr`
- `uint ptr`

### верхний уровень

- `:iface IGlobalContext {151C4C40-37A4-48EA-990C-14B584EF8A6C}`

### внутри `IGlobalContext`

- `:virt`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IGlobalContextInit {845491E6-70AF-4495-B4E2-D77AC794E797}`

### внутри `IGlobalContextInit`

- `:virt`
- `void init(IInfoBase& infoBase)`
