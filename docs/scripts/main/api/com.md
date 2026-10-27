## `main/api/com.v`

- Язык: **v8api (.v)**, строк: **67**, объявлений: **37**
- Назначение: Некоторые вещи для COM
- Состав: iface — 1, method — 1, prop — 28, props — 2, slot-skip — 2, struct — 2, virt — 1

- `:iface IConnectionPointContainer {B196B284-BAB4-101A-B69C-00AA00341D07}` — Некоторые вещи для COM

### внутри `IConnectionPointContainer`

- `:virt`
- `пропуск слотов: +1`
- `uint FindConnectionPoint(const Guid& riid, IUnknown@&)`

### верхний уровень

- `:struct TYPEATTR`

### внутри `TYPEATTR`

- `:props`
- `Guid guid`
- `uint lcid`
- `uint dwReserved`
- `int memidConstructor`
- `int memidDestructor`
- `uint lpstrSchema`
- `uint cbSizeInstance`
- `uint typekind`
- `uint16 cFuncs`
- `uint16 cVars`
- `uint16 cImplTypes`
- `uint16 cbSizeVft`
- `uint16 cbAlignment`
- `uint16 wTypeFlags`
- `uint16 wMajorVerNum`
- `uint16 wMinorVerNum`
- `uint64 tdescAlias`
- `uint64 idldescType`

### верхний уровень

- `:struct FUNCDESC`

### внутри `FUNCDESC`

- `:props`
- `uint memid`
- `uint lprgscode`
- `uint lprgelemdescParam`
- `uint funckind`
- `uint invkind`
- `uint callconv`
- `uint16 cParams`
- `uint16 cParamsOpt`
- `uint16 oVft`
- `uint16 cScodes`
- `пропуск слотов: +32`
