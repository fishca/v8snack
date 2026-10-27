## `snegopat/v8api/string.v`

- Язык: **v8api (.v)**, строк: **238**, объявлений: **33**
- Назначение: Описание интерфейсов 1С.
- Состав: class — 1, method — 13, meths — 3, prop — 12, props — 3, struct — 1

- `:struct v8strData`

### внутри `v8strData`

- `:props`
- `uint refCount`
- `int pad`
- `uint8 text`

### верхний уровень

- `:class v8string`

### внутри `v8string`

- `:props`
- `uint len`
- `int_ptr data`
- `int_ptr pEnd`
- `int i1`
- `int i2`
- `:meths`
- `void ctor()`
- `void ctor1(const v8string& other)`
- `void ctor3(int_ptr text, size_t l)`
- `void dtor()`
- `:props` — 8.3.20
- `int_ptr data`
- `int_ptr len`
- `int_ptr capacity`
- `uint16 flag`
- `:meths`
- `void ctor()`
- `void ctor1(const v8string&in other)`
- `void ctor3(int_ptr text, size_t l)`
- `void dtor()`
- `string opImplConv()const|int_ptr v8string__opImplConv(v8string& obj, string& ret)`
- `void opAssign(const v8string&in s)`
- `void opAssign(const string&in s)`
- `string get_str()const|int_ptr v8string__get_str(v8string& obj, string& ret)`
- `:meths`
- `v8string opImplConv()const|int_ptr string__opImplConv(string& obj, v8string& ret)`
