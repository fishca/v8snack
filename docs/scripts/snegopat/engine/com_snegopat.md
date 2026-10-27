## `snegopat/engine/com_snegopat.as`

- Язык: **AngelScript**, строк: **219**, объявлений: **19**
- Назначение: Реализует объект snegopat из SnegAPI. /
- Состав: class — 1, func — 18

- `class Snegopat`

### внутри `Snegopat`

- `string coloringBackgroundCounts()`
- `string coloringBackgroundCounts()`
- `string coloringGateInfo()`
- `string coloringBackgroundProbe(const string& text, bool worker = false)`
- `bool coloringStress(const string& text, uint workers = 8, uint iterations = 100)`
- `string coloringProbe(const string& text, bool worker = false, bool native = true)` — Diagnostic parser probe, no editor document or configuration is changed.
- `ITextWindow&& activeTextWindow()` — Получить активное текстовое окно
- `string parseTemplateString(const string& text, const string& name = "")` — Обработать строку шаблонов
- `bool showMethodsList()` — Показать список методов модуля
- `bool showSmartBox()` — Показать выпадающий список снегопата
- `void diagFlush()` — Сбросить накопленные строки журнала на диск (вызывается по таймеру из errorlog.js)
- `void settingsTick()` — Свой файловый механизм настроек (settings_store.as): таймер, принудительная запись, состояние
- `void settingsFlush()`
- `string settingsInfo()`
- `void diagLog(const string& cat, const string& text)` — Запись в журнал движка из скриптов (всегда, независимо от trace): snegopat.diagLog("категория", "текст")
- `IV8Lexer&& parseSources(const string& strSource, uint startLine = 1)`
- `void updateAllEditorsSettings()`
- `string getStockTextIndent()`
