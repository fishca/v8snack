## `snegopat/engine/StockListInterceptor.as`

- Язык: **AngelScript**, строк: **641**, объявлений: **28**
- Назначение: Перехват штатной контекстной подсказки 1С и подмена ее списком снегопата /
- Состав: class — 6, func — 21, funcdef — 1

- `string tpstr(const TextPosition& tp)`
- `OptionsEntry oeEnableHookStdList("HookStdList", function(v)`
- `OptionsEntry oeEnableHidingRemark("EnableHidingRemark", function(v)`
- `void logListTiming(const string& where, uint platformMs, uint totalMs)`
- `bool hookStdList()` — Установка перехвата
- `void retryStaleList()`
- `void showPendingList()` — Отложенный показ списка Снегопата (вызывается на простое, вне перехватчика платформы)
- `funcdef size_t GDS_raw(size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t);` — 8.3.27: перехватчик «сырой» — все 15 аргументов как size_t, без типизированных ссылок и копирования AngelScript (copy-in/copy-out ссылок затирал выходные параметры платформы, и вызывающий получал пустой источник данных → падение). Оригинал вызывается напрямую тем же набором.
- `void splitToLexemsTrap(ISourceLexer& pThis, const v8string& source, Vector& lexems)` — Это перехват разбиения одинэсом исходников на лексемы. Наша цель - заменить комментарии вида "//:" на пробелы. Таким образом, можно будет задавать типизацию комментариями вида : Парам = Новый Структура Заменять будем простым реплэйсом, нам не страшно, если и где-то внутри кавычек заменим, это только для контекстной подсказки
- `bool showAssistList(IAssistList& lst, TextWnd&& wnd, IV8DataSource&& ds, IV8Bookmark&& bkmk)` — Вытащим состав из стокового списка и создадим свой
- `class V8StockItemBase : SmartBoxInsertableItem` — используется в числе прочих при обработке выбора типа данных для глобального метода Тип()

### внутри `V8StockItemBase`

- `void textForInsert(string&out text)`
- `string getCategory()`

### верхний уровень

- `class V8StockKeyword : V8StockItemBase`

### внутри `V8StockKeyword`

- `string getCategory()`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `class V8StockMethod : V8StockItemBase`

### внутри `V8StockMethod`

- `string getCategory()`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `class V8StockProp : V8StockItemBase`

### внутри `V8StockProp`

- `string getCategory()`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `class V8StockEnum : V8StockItemBase`

### внутри `V8StockEnum`

- `string getCategory()`
- `void afterInsert(TextWnd&& editor)`

### верхний уровень

- `class V8TemplateItem : SmartBoxInsertableItem`

### внутри `V8TemplateItem`

- `void textForInsert(string&out text)`
- `void textForTooltip(string& text)`
