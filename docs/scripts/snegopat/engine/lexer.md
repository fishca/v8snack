## `snegopat/engine/lexer.as`

- Язык: **AngelScript**, строк: **631**, объявлений: **23**
- Назначение: Лексеры и парсеры Как скриптовые, так и встроенные в снегопат /
- Состав: class — 3, func — 20

- `bool isLineEndWithOpenQuote(const string& line)` — Проверка, завершается ли строка текста открытым литералом
- `bool fileReadBytes(HANDLE h, int_ptr buf, uint size)` — ReadFile/WriteFile обязательно получают указатель на число переданных байт: Windows 7 при нулевом указателе падает с 0xC0000005 (Windows 8 и новее его допускают). Обёртка winapi.v по умолчанию передаёт 0, поэтому в движке читаем и пишем только через эти функции.
- `bool fileWriteBytes(HANDLE h, int_ptr buf, uint size)`
- `string readUtf8File(const string& path)`
- `void fromUtf8(int_ptr buffer, uint size, string& result)`
- `bool readTextFile(string& result, const string& path, const string& encoding = "")`
- `class ValueParamsVector`
- `class ILexem`

### внутри `ILexem`

- `Lexems get_type()`
- `uint get_start()`
- `uint get_length()`
- `uint get_line()`
- `string get_text()`

### верхний уровень

- `class IV8Lexer`

### внутри `IV8Lexer`

- `uint get_lexemCount()`
- `ILexem&& lexem(uint idx)`
- `uint get_namesCount()`
- `string name(uint idx)`
- `int idxOfName(const string& name)`
- `int posToLexem(uint posInReStream)`
- `string strNameIdx(const string& name)`
- `Lexems lexType(uint t)`
- `LexemTypes getMethodText(TextManager& pTextManager, uint& line, uint col, bool bOnlyMeths, string&out methodText, execContextTypes&out directive)` — Метод получает текст текущего метода до текущей позиции каретки. Началом метода считаются либо ключевые слова Процедура/Функция, либо текст после слов КонецПроцуры/КонецФункции, либо всё от начала модуля. После нахождения начала метода к нему также ищется директива, а также определяется первая виртуальная лексема для парсера текста.
