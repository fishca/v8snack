## `snegopat/engine/keywords.as`

- Язык: **AngelScript**, строк: **339**, объявлений: **18**
- Назначение: keywords.as
- Состав: class — 4, func — 12, funcdef — 2

- `Keywords&& getKeywordsGroup()`
- `class Keywords`

### внутри `Keywords`

- `void processParseResult(ParseMethodResult&& result, IntelliSite&& isite)`
- `funcdef void FMakeInsert(KeywordItem&, string&);`
- `funcdef void FAfterInsert(KeywordItem&, TextWnd&&);`

### верхний уровень

- `class KeywordItem : SmartBoxInsertableItem`

### внутри `KeywordItem`

- `void textForTooltip(string& text)`
- `void textForInsert(string&out text)`
- `void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent)`
- `void afterInsert(TextWnd&& editor)`
- `void formatAfterInsert(KeywordItem& item, TextWnd&& editor)`
- `void insertForReturn(KeywordItem& item, string& text)`
- `void selectTypeAfterInsert(KeywordItem& item, TextWnd&& editor)`

### верхний уровень

- `class DirectiveItem : SmartBoxInsertableItem`

### внутри `DirectiveItem`

- `void textForTooltip(string& text)`
- `void textForInsert(string&out text)`

### верхний уровень

- `class DirecivesSet`

### внутри `DirecivesSet`

- `void processResult(ParseMethodResult&& parseResult, DirectivesSet ds, IntelliSite&& isite)`
