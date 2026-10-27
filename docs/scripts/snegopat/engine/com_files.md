## `snegopat/engine/com_files.as`

- Язык: **AngelScript**, строк: **314**, объявлений: **27**
- Назначение: Работы из аддинов с файлами. /
- Состав: class — 5, func — 21, funcdef — 1

- `class V8Files`

### внутри `V8Files`

- `IV8DataFile&& open(const string& path, FileOpenModes mode)`
- `IV8DataFile&& createMemoryFile()`
- `IV8DataFile&& createTempFile(uint memLimit = 0)`
- `IV8StorageFile&& attachStorage(IV8DataFile&& file, bool createNew = false)`
- `MemoryBuffer&& newMemoryBuffer(uint size)`

### верхний уровень

- `class MemoryBuffer`

### внутри `MemoryBuffer`

- `uint8 byte(uint pos)`
- `void set_byte(uint pos, uint8 val)`
- `string file_getString(IFileEx&& file, StringDataMode mode, int length = -1)`

### верхний уровень

- `class IV8DataFile`

### внутри `IV8DataFile`

- `MemoryBuffer&& read(uint length)`
- `void write(MemoryBuffer&& bytes)`
- `uint32 seek(int64 pos, FileSeekMode fsMode)`
- `string getString(StringDataMode mode, int length=-1)`
- `void putString(StringDataMode mode, const string& str, int length = -1)`
- `void flush()`
- `void setEOF()`
- `string get_url()`
- `void close()`

### верхний уровень

- `class IV8StorageFile`

### внутри `IV8StorageFile`

- `IV8DataFile&& open(const string& name, FileOpenModes mode)`
- `void rename(const string& oldName, const string& newName)`
- `void remove(const string& name)`
- `funcdef bool ExceptionHandler(Exception&);`

### верхний уровень

- `class ExceptionCatcher` — Класс для отлова С++ исключения с типом core::Exception Если установлен bypass - исключение пробрасывается дальше, иначе запоминает факт произошедшего исключения и описание ошибки

### внутри `ExceptionCatcher`

- `bool handle(Exception& exc)`
