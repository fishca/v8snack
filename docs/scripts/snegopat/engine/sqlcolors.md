## `snegopat/engine/sqlcolors.as`

- Язык: **AngelScript**, строк: **652**, объявлений: **33**
- Назначение: Функционал по группированию строк в редакторе с помощью //{ //}, а также раскраске многострочных строк в цвета запросов /
- Состав: class — 2, func — 26, funcdef — 5

- `bool initSafeColorPacket()`
- `funcdef bool SafeBGHas(ITextExtBackColors&, size_t, const TextPosition&, const TextPosition&, SyntaxItemInfos&);`
- `funcdef bool SafeBGHas(ITextExtBackColors&, size_t, SyntaxItemInfos&);`
- `funcdef void SafeBGGet(ITextExtBackColors&, size_t, SyntaxItemInfos&, Vector&);`
- `void swapSafeColors()`
- `void swapSafeBackground()`
- `bool configureNativeColors()`
- `OptionsEntry oeEnableCustomGrouping("EnableCustomGrouping", function(v)`
- `OptionsEntry oeQueryColors("QueryColors", function(v)`
- `OptionsEntry oeEnableBkColorForMultyLine("EnableBkColorForMultyLine", function(v)`
- `OptionsEntry oeGroupMultiLine("GroupMultiLine", function(v)`
- `void defvalBgColorForMultiLine(Value& val)`
- `void colorFromV8(const Value& val, uint&out res)`
- `bool initGroupingAndColoring(bool forceForProbe = false)` — Инициализация перехвата
- `void printSyntaxInfos(const string& text, Vector& infos)`
- `funcdef void TE_gc(ITextExtColors&, const v8string&, Vector&);` — Обработчик перехваченной функции синтакс-разбора строки
- `void ITextExtColors_getColorsTrap(ITextExtColors& pThis, const v8string& sourceLine, Vector& infos)`
- `bool checkForGroupingRemark(const string& srcLine, Vector& infos)` — Проверка на группирующий комментарий
- `void checkForGroupingMultiLine(const string& srcLine, Vector& infos)` — Проверка на группирующий комментарий
- `class SQLBlockInfo` — Для хранения массивов токенов от разбора строковых литералов парсером языка запросов

### внутри `SQLBlockInfo`

- `SyntaxItemInfoRef&& setSyntaxBlock(SyntaxItemInfo& si)` — Создает вектор для одного элемента и копирует в него элемент
- `uint fixupStartPositions(uint shift, const string& srcLine)` — Исправляет стартовые позиции токенов после их разбора парсером языка запросов также правится длина токенов, если в них встречаются кавычки, так как в оригинальном тексте это сдвоенные кавычки. возвращает количество токенов
- `bool processHasCustomBackground(Vector& items)`
- `void processGetColorInfo(Vector& items, Vector& res)`
- `bool TxtExt_hasCustomBackground(ITextExtBackColors& pThis, size_t nLineNo, const TextPosition& first, const TextPosition& last, SyntaxItemInfos& items)`
- `bool TxtExt_hasCustomBackground(ITextExtBackColors& pThis, size_t nLineNo, SyntaxItemInfos& items)`
- `void TxtExt_getColorInfo(ITextExtBackColors& pThis, size_t currentBGColor, SyntaxItemInfos& items, Vector& res)`

### верхний уровень

- `class MyTextExtBackColors` — Класс для обработки запросов о цвете фона

### внутри `MyTextExtBackColors`

- `bool hasCustomBackground(size_t nLineNo, const TextPosition& first, const TextPosition& last, SyntaxItemInfos& items)`
- `bool hasCustomBackground(int nLineNo, SyntaxItemInfos& items)`
- `void getColorInfo(COLORREF currentBGColor, SyntaxItemInfos& items, Vector& res)` — Получить инфу о цветах фона
- `funcdef uint IUnk_QI(IUnknown&, const Guid&, IUnknown&&&);`
- `uint TextExtModule_QI(IUnknown& pThis, const Guid& g, IUnknown&&& res)`
