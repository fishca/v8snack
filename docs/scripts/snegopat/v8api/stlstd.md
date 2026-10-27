## `snegopat/v8api/stlstd.v`

- Язык: **v8api (.v)**, строк: **77**, объявлений: **14**
- Назначение: Описание интерфейсов 1С.
- Состав: class — 1, method — 7, meths — 2, prop — 3, props — 1

- `:class Vector` — Вектор

### внутри `Vector`

- `:props`
- `int_ptr start`
- `int_ptr end`
- `int_ptr allocated`
- `:meths`
- `void ctor()`
- `void dtor()`
- `size_t size()`
- `int_ptr alloc(size_t count, size_t size)`
- `size_t count(size_t s)`
- `:meths`
- `int_ptr v8malloc(size_t count)`
- `void v8free(int_ptr ptr, size_t allocked)`
