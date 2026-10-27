## `snegopat/engine/develop.as`

- Язык: **AngelScript**, строк: **262**, объявлений: **13**
- Назначение: Разные штуки для разработчиков и исследователей /
- Состав: class — 2, func — 11

- `void _dumpSnegApi()` — Объект этого класса будет доступен как свойство develop объекта Designer
- `void _dumpV8Api()`
- `class Develop`

### внутри `Develop`

- `void dumpV8typesToDts()`
- `void dumpSnegApiToDts()`
- `string undecorate(const string& mangled)`

### верхний уровень

- `class V8Dumper`

### внутри `V8Dumper`

- `void write(const string& content)`
- `void dump(const string& path)`
- `void dumpContextDef(IContextDef&& ctx, const string& name0, const string& name1)`
- `void dumpV8New()`
- `void getTypeName(TypeDomainPattern& types, string& typeName)`
- `string getGuidTypeName(const Guid& guid)`
