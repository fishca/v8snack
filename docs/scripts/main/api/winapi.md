## `main/api/winapi.v`

- Язык: **v8api (.v)**, строк: **414**, объявлений: **76**
- Назначение: Работа с WinAPI
- Состав: class — 1, method — 4, meths — 3, prop — 49, props — 9, slot-skip — 2, struct — 8

- `:struct LOGFONT`

### внутри `LOGFONT`

- `:props`
- `int lfHeight`
- `int lfWidth`
- `int lfEscapement`
- `int lfOrientation`
- `int lfWeight`
- `uint8 lfItalic`
- `uint8 lfUnderline`
- `uint8 lfStrikeOut`
- `uint8 lfCharSet`
- `uint8 lfOutPrecision`
- `uint8 lfClipPrecision`
- `uint8 lfQuality`
- `uint8 lfPitchAndFamily`
- `uint16 lfFaceNameStart`
- `пропуск слотов: +60`
- `uint16 lfFaceNameEnd`

### верхний уровень

- `:struct MONITORINFO`

### внутри `MONITORINFO`

- `:props`
- `uint cbSize`
- `Rect rcMonitor`
- `Rect rcWork`
- `uint dwFlags`

### верхний уровень

- `:struct MSG`

### внутри `MSG`

- `:props`
- `HWND hwnd`
- `UINT message`
- `WPARAM wParam`
- `LPARAM lParam`
- `DWORD time`
- `Point pt`

### верхний уровень

- `:struct Rect`

### внутри `Rect`

- `:props`
- `int32 left`
- `int32 top`
- `int32 right`
- `int32 bottom`
- `:meths`
- `void ctor()`

### верхний уровень

- `:struct Point`

### внутри `Point`

- `:props`
- `int32 x`
- `int32 y`
- `:meths`
- `void ctor()`

### верхний уровень

- `:class Size`

### внутри `Size`

- `:props`
- `int32 cx`
- `int32 cy`
- `:meths`
- `void ctor()`
- `void dtor()`

### верхний уровень

- `:struct MINMAXINFO`

### внутри `MINMAXINFO`

- `:props`
- `Point ptReserved`
- `Point ptMaxSize`
- `Point ptMaxPosition`
- `Point ptMinTrackSize`
- `Point ptMaxTrackSize`

### верхний уровень

- `:struct FILETIME`

### внутри `FILETIME`

- `:props`
- `DWORD dwLowDateTime`
- `DWORD dwHighDateTime`

### верхний уровень

- `:struct WIN32_FIND_DATA`

### внутри `WIN32_FIND_DATA`

- `:props`
- `DWORD dwFileAttributes`
- `FILETIME ftCreationTime`
- `FILETIME ftLastAccessTime`
- `FILETIME ftLastWriteTime`
- `DWORD nFileSizeHigh`
- `DWORD nFileSizeLow`
- `DWORD dwReserved0`
- `DWORD dwReserved1`
- `int cFileName`
- `пропуск слотов: +600`
