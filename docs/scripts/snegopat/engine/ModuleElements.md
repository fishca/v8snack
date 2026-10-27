## `snegopat/engine/ModuleElements.as`

- Язык: **AngelScript**, строк: **350**, объявлений: **31**
- Назначение: Класс для работы с элементами структуры модуля /
- Состав: class — 7, func — 22, interface — 1, namespace — 1

- `interface ModuleTextSource` — Интерфейс, через который парсер структуры модуля получает его текст
- `class ModuleElements`

### внутри `ModuleElements`

- `int_ptr textForParser()` — snegopat.dll принимает указатель на текст как uint; кучевые адреса платформы 8.3.20+ выше 4 ГБ
- `void freeLowText()`
- `void clearResults()`
- `void parse()`
- `uint preprocContextForLine(uint line)`
- `void processParseResultForCurrentModule(ParseMethodResult&& res, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)`
- `void processParseResultForOtherModule(ParseMethodResult&& res, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)`

### верхний уровень

- `class MDModuleTextSource : ModuleTextSource`

### внутри `MDModuleTextSource`

- `void getModuleSourceText(v8string& text)`
- `string moduleName(IMDObject&& obj, const Guid& mdProp)`
- `ModuleElements&& findModuleElementsParser(IMDObject&& obj, const Guid& mdProp)`
- `ModuleElements&& getModuleElementsParser(IMDObject&& obj, const Guid& mdProp, ModuleTextSource&& src = null)`
- `void removeModuleElementsParser(ModuleElements&& me, IMDObject&& obj, const Guid& mdProp)`

### верхний уровень

- `class ModuleMethodItem : SmartBoxInsertableItem, MethodInsertable`

### внутри `ModuleMethodItem`

- `void textForTooltip(string& text)`

### верхний уровень

- `class ModuleVarItem : SmartBoxInsertableItem`

### внутри `ModuleVarItem`

- `void textForTooltip(string& text)`

### верхний уровень

- `class LocalVarSmartItem: SmartBoxInsertableItem`

### внутри `LocalVarSmartItem`

- `void textForTooltip(string& text)`

### верхний уровень

- `class CommonModuleItem : SmartBoxInsertableItem`

### внутри `CommonModuleItem`

- `void textForTooltip(string& text)`
- `void textForInsert(string&out text)`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `namespace Delimeters`
- `class Item : SmartBoxInsertableItem`

### внутри `Item`

- `void textForTooltip(string& text)`
- `void textForInsert(string&out text)`
- `void afterInsert(TextWnd&& editor)`
- `Item&& getDelimeter(Types type)`
