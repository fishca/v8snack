## `snegopat/v8api/file.v`

- Язык: **v8api (.v)**, строк: **117**, объявлений: **50**
- Назначение: Описание интерфейсов 1С.
- Состав: base — 1, iface — 6, method — 22, meths — 2, prop — 6, props — 2, slot-skip — 3, struct — 2, virt — 6

- `:iface IFileSystem {3A6C2186-45C3-11D4-985D-008048DA1252}`

### внутри `IFileSystem`

- `:virt`
- `пропуск слотов: +5` — 8.3.24.1586 и 8.3.27: openURL — индекс 8 (core83.dll, vtable 0x3D7270 / 0x3DEEA0: одинаковая форма функций 3..8, байт в байт тело openURL) 8.5.1: предполагается та же раскладка (8.3.24+); уточнить дампами vtable
- `пропуск слотов: +3`
- `uint openURL(IFile@&, const URL& url, int mode)`

### верхний уровень

- `:iface IFile {F85A2E9A-37AB-11D4-985A-008048DA1252}`

### внутри `IFile`

- `:virt`
- `uint url(URL&)`
- `uint read(int_ptr buffer, uint count)`
- `void write(int_ptr buffer, uint count)`
- `void flush()`

### верхний уровень

- `:iface IFileEx {BC354E75-3C37-11D4-985C-008048DA1252}`

### внутри `IFile`

- `:base IFile`
- `:virt`
- `uint64 seek(int64 pos, FileSeekMode mode)`
- `uint64 setEOF()`

### верхний уровень

- `:struct StorageFileInfo`

### внутри `StorageFileInfo`

- `:props`
- `v8string name`
- `пропуск слотов: +4`
- `:meths`
- `void dtor()`

### верхний уровень

- `:iface IStorageRW {C6A8E687-B22A-476D-94A8-58F40BCB4710}`

### внутри `IStorageRW`

- `:virt`
- `void initFromPath(const URL& path, FileOpenModes mode)`
- `void initFromFile(IFileEx@+ file, StorageCreateFlags flags = scfNone)`
- `void createNewFromPath(const URL& path, FileOpenModes mode, StorageCreateFlags flags = scfTruncate, uint blockSize = 512)`
- `void createNewFromFile(IFile@+ file, StorageCreateFlags flags = scfTruncate, uint blockSize = 512)`
- `uint find(Vector& res, int_ptr pPattern)`
- `uint open(IFileEx@& res, const v8string&in fileName, FileOpenModes mode)`
- `void remove(int_ptr pPattern)`
- `void rename(const v8string&in oldFileName, const v8string&in newFileName)`

### верхний уровень

- `:struct FileException` — void compressToFile(IFileEx@+ file, uint blockSize = 512) void compressToPath(const URL& path, FileOpenModes mode, uint blockSize = 512)

### внутри `FileException`

- `:props` — :base Exception
- `Guid id`
- `v8string descr`
- `uint ptr`
- `int code`
- `URL url`

### верхний уровень

- `:iface IUnpackFile {F10901A0-3BAC-11D4-8A57-008048DA06DF}`

### внутри `IUnpackFile`

- `:virt`
- `void init(IFile&& dest)`
- `void init(IFile&& dest, int t=0)`

### верхний уровень

- `:iface ITempFile {0C6E9F49-A3CA-4C45-B078-5871639BF726}`

### внутри `ITempFile`

- `:virt`
- `uint detach(URL&)`
- `void attach(const URL& url)`
- `void setMemLimit(uint limit)`
- `uint getMemLimit()`
- `:meths`
