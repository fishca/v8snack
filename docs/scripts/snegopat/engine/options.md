## `snegopat/engine/options.as`

- Язык: **AngelScript**, строк: **68**, объявлений: **7**
- Назначение: Работа с настройками /
- Состав: class — 1, func — 4, funcdef — 2

- `funcdef bool OnApplyOption(const Value& newVal);`
- `funcdef void OptionDefVal(Value& val);`
- `class OptionsEntry`

### внутри `OptionsEntry`

- `bool doApply(Variant& newVal)`
- `void optionWrite(const string& key, const Value& val)` — Настройки движка лежат в своих файлах (settings_store.as), раздел Snegopat/Settings
- `bool optionRead(const string& key, Value& val)`
- `void initAllOption()`
