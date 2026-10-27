## `snegopat/v8api/debugger.v`

- Язык: **v8api (.v)**, строк: **49**, объявлений: **20**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 5, method — 6, slot-skip — 3, virt — 6

- `:iface ICalcValueCreator {77BABCB2-0E4A-4B4D-B218-F28B3A74A5CC}` — debugger.v - интерфейсы для работы с отладчиком 1С

### внутри `ICalcValueCreator`

- `:virt`
- `uint create(IUnknown@&, const v8string&in)`

### верхний уровень

- `:iface IExecutionStateMediumInStream {BE1E3DC5-1FF6-4120-993E-6A0F9EF3AFA9}`

### внутри `IExecutionStateMediumInStream`

- `:virt`
- `void setFile(IFileEx& pIFileEx)`
- `пропуск слотов: +1`
- `uint getInStorage(IInPersistenceStorage@&)`

### верхний уровень

- `:iface IExternalCalculatorDebugger {1A7E4120-9F11-43C5-AF53-F0ED888D86C9}` — DWORD pad[5]; IFileExPtr m_pIFileEx_storage;

### внутри `IExternalCalculatorDebugger`

- `:virt`
- `void f()`

### верхний уровень

- `:iface IExternalCalculatorOwner {673CF811-F9B3-4747-8407-AA30A25E8413}`

### внутри `IExternalCalculatorOwner`

- `:virt`
- `void setExternalCalculator(IUnknown& pIExternalCalculator)`

### верхний уровень

- `:iface IDebugger {6CA6815D-DC3C-42BC-A46A-35C3C59B831C}`

### внутри `IDebugger`

- `:virt`
- `пропуск слотов: +1`
- `uint getBigObject(IUnknown@&)`
- `:virt`
- `пропуск слотов: +1`
