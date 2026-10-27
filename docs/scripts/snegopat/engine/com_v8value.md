## `snegopat/engine/com_v8value.as`

- Язык: **AngelScript**, строк: **75**, объявлений: **7**
- Назначение: Обёртка для работы из аддинов со значениями 1С. /
- Состав: class — 1, func — 6

- `class V8Value`

### внутри `V8Value`

- `string typeName(long language = 0)` — [helpstring("Название типа")]
- `string presentation()` — [helpstring("Строковое представление")]
- `bool get_isObject()` — [propget, helpstring("Это объект?")]
- `string contextInfo()` — [helpstring("Список методов/свойств")]
- `string toStringInternal()` — [helpstring("ЗначениеВСтрокуВнутр")]
- `string typeUUID()` — [propget, helpstring("UUID типа")]
