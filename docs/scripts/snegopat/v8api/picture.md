## `snegopat/v8api/picture.v`

- Язык: **v8api (.v)**, строк: **83**, объявлений: **33**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 4, method — 2, prop — 16, props — 2, slot-skip — 3, struct — 2, virt — 4

- `:struct V8Picture` — тип V8Picture

### внутри `V8Picture`

- `:props`
- `int kind`
- `CompositeID cid`
- `URL url`
- `Point pxForTransparent`
- `bool withTransparent`
- `bool isGlyph`
- `Size szGlyph`
- `Point ptGlyph`
- `Point ptGlyph`
- `Size szGlyph` — #if x86 = 1

### верхний уровень

- `:iface IImage {1646CCC0-E876-11D3-8A57-008048DA06DF}`

### внутри `IImage`

- `:virt`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IV8Picture {A642A571-E2E8-11D4-A8FB-0050BA849130}`

### внутри `IV8Picture`

- `:virt`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IGlyph {36ABA6D0-DA61-11D4-84C5-008048DA06DF}`

### внутри `IGlyph`

- `:virt`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IV8PictureValue {A94DED2B-D473-4394-AC44-51501435CCEF}`

### внутри `IV8PictureValue`

- `:virt`
- `void setPicture(const V8Picture& picture)`
- `void getPicture(V8Picture& picture)`

### верхний уровень

- `:struct Glyph`

### внутри `Glyph`

- `:props`
- `size_t p1`
- `size_t p2`
- `size_t p3`
- `size_t p4`
- `Size size`
- `Point point`
