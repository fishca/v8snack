## `snegopat/v8api/document.v`

- Язык: **v8api (.v)**, строк: **72**, объявлений: **48**
- Назначение: Описание интерфейсов 1С.
- Состав: base — 1, iface — 7, method — 21, prop — 5, props — 1, slot-skip — 5, struct — 1, virt — 7

- `:iface IPersistableDocument {39D1961C-1881-4E3F-8453-16AD0A648B05}` — Описание интерфейсов работы с документами

### внутри `IPersistableDocument`

- `:virt`
- `void save(IFile@+ file)`
- `void load(IFile@+ file)`

### верхний уровень

- `:iface IDocument {425EE300-9DD3-11d4-84AE-008048DA06DF}`

### внутри `IPersistableDocument`

- `:base IPersistableDocument`
- `:virt`
- `uint createView(IUnknown@&)`
- `void enumAllViews(Vector& views)` — void enumAllViews(DocumentViews& views)
- `пропуск слотов: +1`
- `bool isModified()`
- `bool canClose()`
- `пропуск слотов: +1`
- `v8string getTitle()`
- `пропуск слотов: +2`
- `void setTitle(const v8string&in title)`
- `void setConfigMode(bool configMode)`
- `bool getConfigMode()`
- `void getKey(v8string&out key)`
- `пропуск слотов: +1`
- `void setReadOnly(bool bFlag)`
- `bool getReadOnly()`

### верхний уровень

- `:iface IPersistableObject {45B81B41-9540-11D4-9427-008048DA11F9}`

### внутри `IPersistableObject`

- `:virt`
- `void serialize(IOutPersistenceStorage@+ storage)`
- `void deserialize(IInPersistenceStorage@+ storage)`

### верхний уровень

- `:iface IOutPersistenceStorage {24865123-AB36-11D4-B9A4-008048DA0334}`

### внутри `IOutPersistenceStorage`

- `:virt`
- `void f()`

### верхний уровень

- `:iface IInPersistenceStorage {24865124-AB36-11D4-B9A4-008048DA0334}`

### внутри `IInPersistenceStorage`

- `:virt`
- `void f()`

### верхний уровень

- `:iface IStreamPersistenceStorage {86EB9CD0-FFA0-4E4C-8134-05DCF57C253C}`

### внутри `IStreamPersistenceStorage`

- `:virt`
- `void setFile(IFile@+ file)`
- `void open(const URL& url)`
- `void close()`

### верхний уровень

- `:iface IDocumentSink {E7D5C730-A01E-11D4-84AF-008048DA06DF}`

### внутри `IDocumentSink`

- `:virt`
- `void f()`

### верхний уровень

- `:struct DocSink`

### внутри `DocSink`

- `:props`
- `int_ptr vtab`
- `int refCount`
- `size_t i1`
- `size_t i2`
- `Guid propId`
- `пропуск слотов: +12`
