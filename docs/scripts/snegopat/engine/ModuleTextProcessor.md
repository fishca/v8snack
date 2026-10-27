## `snegopat/engine/ModuleTextProcessor.as`

- Язык: **AngelScript**, строк: **726**, объявлений: **40**
- Назначение: Логика работы с текстом модуля /
- Состав: class — 3, func — 37

- `OptionsEntry oeEnableAutoReplaces("Autoreplace", function(v)`
- `OptionsEntry oeEnableSmartEnter("EnableSmartEnter", function(v)`
- `OptionsEntry oeEnableSnegoList("EnableSmartList", function(v)`
- `OptionsEntry oeQACharsCount("QuickActivateCharsCount", function(v)`
- `class ModuleEditorData : EditorData` — Данные редактора для текстового процессора модулей. Пока хранит только флаг нужности показа списка

### внутри `ModuleEditorData`

- `string getTextLine(TextManager&& tm, uint line)`
- `void getTextLine(TextManager&& tm, uint line, v8string& s)`
- `bool my_is_alpha(wchar_t symbol)`
- `bool my_is_alnum(wchar_t symbol)`
- `bool is_first_name_symbol(wchar_t symbol)`
- `bool is_name_symbol(wchar_t symbol)`
- `ActivateModes getActivateMode(TextManager&& tm, const TextPosition&in caretPos, string& beginOfLine, string& lastLexem)` — Выяснить контекст вызова подсказки также возвращает начало текущей строки до каретки и последнюю лексему в ней.

### верхний уровень

- `class ModuleTextProcessor : TextProcessor, ModuleTextSource`

### внутри `ModuleTextProcessor`

- `void getModuleSourceText(v8string& text)`
- `void setTextDoc(TextDoc&& textDoc)` — Подключение к и отключение от текстового документа
- `void checkIsOnlyMeths(TextDocMdInfo&& mdInfo)` — Метод проверяет, допустимы ли в модуле только методы (без переменых и операторов тела модуля), а также допустимый набор директив методов
- `void connectEditor(TextWnd&& editor)`
- `bool onChar(TextWnd&& editor, wchar_t symbol)`
- `void afterChar(TextWnd&& editor, wchar_t symbol)`
- `bool onKeyDown(TextWnd&& editor, WPARAM wParam, LPARAM lParam)`
- `bool beforeSmartEnter(TextWnd&& editor)`
- `void itemInserted(TextWnd&& editor, SmartBoxInsertableItem&& item)`
- `void smartEnter(TextPosition& caretPos, TextWnd&& editor)` — Вызывается при нажатии Enter'а.
- `bool doAutoReplace(wchar_t symbol, const string&in lineBegin, TextPosition&in caretPos, TextWnd&& pTxtWnd)`
- `void activateInModule(TextWnd&& editor, const string&in lastLexem, TextPosition& caretPos, ActivateModes mode, wchar_t symbol)`
- `void activate(TextWnd&& editor)`
- `IMDContainer&& myMainContainer()`
- `void addCommonModules(ParseMethodResult&& result, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)`

### верхний уровень

- `class ExtContextData` — Класс для разбора информации о назначенном модулю объекте метаданных и объекте-расширении модуля. Цель - вытащить методы и свойства этих объектов, которые становятся доступными в модуле напрямую, без указания имён объектов. Также получить список модулей, чьи методы также становятся доступными напрямую.

### внутри `ExtContextData`

- `void addExtModule(IMDObject&& mdObj, const Guid& mdProp)`
- `void processParseResult(ParseMethodResult&& res, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)`
- `uint fixupAccessModes(uint currentModes, execContextTypes direcrive)`
- `bool getRunModeIsManaged(IMDObject&& mdRoot)`
- `void addLocalVariables(ParseMethodResult&& result, IntelliSite&& isite, NoCaseSet& propNames)`
- `void addAutoLocalVariables(ParseMethodResult&& result, IntelliSite&& isite, NoCaseSet& propNames)`
- `void addV8stock(ParseMethodResult&& result, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)`
- `void addTypes(ParseMethodResult&& result, IntelliSite&& isite)`
- `void addTypeStores(IntelliSite&& isite, uint allowedAccesses)`
- `void showV8Assist()`
- `void showV8MethodsParams()`
