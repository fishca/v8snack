## `snegopat/engine/intellisite.as`

- Язык: **AngelScript**, строк: **684**, объявлений: **41**
- Назначение: Реализация работы со списком снегопата /
- Состав: class — 2, func — 37, funcdef — 2

- `IntelliSite&& getIntelliSite()`
- `class SmartBoxInsertableItem : SmartBoxItem` — Элементы, которые вставляются из списка, должны наследоваться от этого класса

### внутри `SmartBoxInsertableItem`

- `void textForInsert(string&out text)`
- `void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent)`
- `void afterInsert(TextWnd&& editor)`
- `uint getBoxWidth()`
- `bool isAllowMultyFilter()`
- `uint maxHotOrderItems()`
- `OptionsEntry oeUseLangs("UseLangs", function(v)`
- `OptionsEntry oeListWidth("ListWidth", function(v)`
- `OptionsEntry oeAllowMultyFilter("AllowFilterInSmartList", function(v)`
- `OptionsEntry oeInsertTextOnDot("InsertTextOnDot", function(v)`
- `OptionsEntry oeCamelSearchOnUpperOnly("CamelSearchOnUpperOnly", function(v)`
- `funcdef void AfterSelect(bool bCancel);`

### верхний уровень

- `class IntelliSite : SmartBoxSite`

### внутри `IntelliSite`

- `void clearAllItems()` — Очистка элементов
- `void addItemGroup(array<SmartBoxItem&&>&& group)` — Добавление группы элементов для показа в списке
- `void addItem(SmartBoxItem&& item)` — Добавление одного элемента для показа в списке
- `bool isActive()` — Активен ли сейчас список
- `bool show(TextWnd&& twnd, const string& beginOfWord, const string& selected = "", bool snegoList = true)` — Показать список. Вызывается после заполнения его необходимыми элементами. Указывается начальная строка для первой фильтрации. Возвращает true, если список показан, false - не показан
- `void setBoxPosition(uint itemsCount)`
- `void readSettings()`
- `void onDoSelect(SmartBoxItemBaseIface&& pSelected)` — Реализация интерфейса взаимодействия со списком
- `bool onKeydown(WPARAM wParam, LPARAM lParam)`
- `void onChar(WPARAM wParam, LPARAM lParam)`
- `bool onKillFocus(HWND hNewWnd)`
- `HWND hide(SmartBoxInsertableItem&& insert = null)`
- `void hideAndSend(uint msg, uint wParam, uint lParam)`
- `void moveCaret(int step, int removeSymbols)`
- `void setHotOrderForItems()`
- `void updateHotOrder(SmartBoxItem&& item)`
- `void loadHotOrder()`
- `void saveHotOrder()`
- `bool isLineTailEmpty()`
- `string getCurrentLine()`
- `void testForTemplate()`
- `void textForInsert(string&out text)`
- `void afterInsert(TextWnd&& editor)`
- `bool compareUcaseLetters(const string& test, const string& pattern)`
- `funcdef bool TE_onExecute(ICommandTarget&, const Command&);` — Метод-перехватчик обработки команд текстовым окном.
- `bool checkCommandAndHideSmartBox(ICommandTarget& tgt, const Command& command, TrapVirtualStdCall& trap)`
