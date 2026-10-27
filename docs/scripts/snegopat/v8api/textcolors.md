## `snegopat/v8api/textcolors.v`

- Язык: **v8api (.v)**, строк: **127**, объявлений: **46**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 4, method — 11, meths — 2, prop — 15, props — 4, slot-skip — 2, struct — 4, virt — 4

- `:struct Color`

### внутри `Color`

- `:props`
- `int kind`
- `CompositeID value`
- `:meths`
- `void ctor(size_t r, size_t g, size_t b)`

### верхний уровень

- `:iface IV8Color {9CD510C3-ABFC-11D4-9434-004095E12FC7}`

### внутри `IV8Color`

- `:virt`
- `void setColor(const Color& color)`
- `void getColor(Color& color)`

### верхний уровень

- `:struct SyntaxItemInfo`

### внутри `SyntaxItemInfo`

- `:props`
- `uint start`
- `uint len`
- `Color color`
- `BlockMarker isBlock`
- `uint blockKind`
- `uint blockMode`
- `uint lexemCategory`
- `uint lexemType`
- `:meths`
- `void ctor()`
- `void ctor(const SyntaxItemInfo&in si)`
- `void copy(const SyntaxItemInfo& si)`

### верхний уровень

- `:struct SyntaxItemInfos`

### внутри `SyntaxItemInfos`

- `:props`
- `uint refCount`
- `пропуск слотов: +4`
- `Vector infos`

### верхний уровень

- `:struct BackColorsItem`

### внутри `BackColorsItem`

- `:props`
- `uint start`
- `uint len`
- `uint color`

### верхний уровень

- `:iface ITextExtBackColors {89578B27-C06D-4cb5-AA5A-7C5A90D79D66}` — Интерфейс текстового расширения для задания цвета фона строки текста в редакторе

### внутри `ITextExtBackColors`

- `:virt`
- `bool hasCustomBackground(size_t nLineNo, const TextPosition& first, const TextPosition& last, SyntaxItemInfos& items)`
- `bool hasCustomBackground(size_t nLineNo, SyntaxItemInfos& items)`
- `void getColorInfo(size_t currentBGColor, SyntaxItemInfos& items, Vector& res)` — Получить инфу о цветах фона

### верхний уровень

- `:iface ITextExtColors {6A93A252-50F8-11d5-B0B3-008048DA0765}` — Интерфейс текстового расширения для раскрашивания слов в строке текста в редакторе

### внутри `ITextExtColors`

- `:virt`
- `пропуск слотов: +2`
- `void getColors(const v8string&in sourceLine, Vector& items)`

### верхний уровень

- `:iface ITextExtention {6A93A253-50F8-11d5-B0B3-008048DA0765}`

### внутри `ITextExtention`

- `:virt`
- `v8string name()`
