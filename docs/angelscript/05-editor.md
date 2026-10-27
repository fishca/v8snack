# Текстовый редактор: lexer.as, synedit.as, textwnd.as

Группа файлов подсистемы текстового редактора «Снегопата» (папка `snegopat-client/x64/modules/snegopat/engine/`):

| Файл | Строк | Роль |
|---|---|---|
| `lexer.as` | 631 | Лексеры/парсеры встроенного языка 1С над нативным лексером snegopat.dll, утилиты чтения файлов, разбор «текущего метода» для интеллисенса |
| `synedit.as` | 567 | Внедрение альтернативного редактора SynEdit (внешний аддин `SynEditV8.dll`) в качестве замены штатного текстового редактора |
| `textwnd.as` | 1035 | Ядро работы с текстовыми окнами: перехват создания окон, `TextDoc`/`TextWnd`, текстовые процессоры, менеджер альтернативных редакторов, ловушки изменений текста и выделения |

---

## lexer.as (631 строк)

**Назначение.** Реализует слой лексического анализа встроенного языка 1С поверх **нативного** лексера snegopat.dll (класс `lex_provider`, структура `lexem`, константы `kw*`/`lex*` — все они приходят из хоста, в скриптах не описаны). Строит «строку лексем» (`_reStream`) — компактное текстовое представление модуля, удобное для регэксп-поиска конструкций интеллисенсом. Сюда же вынесены вспомогательные утилиты, не относящиеся к лексеру напрямую: безопасное чтение/запись файлов через WinAPI (обёртки над `ReadFile`/`WriteFile`), чтение UTF-8, чтение текстового файла средствами объекта 1С «ТекстовыйДокумент», и функция `getMethodText` — извлечение текста текущего метода до каретки для парсера интеллисенса. Заголовок файла: «Лексеры и парсеры. Как скриптовые, так и встроенные в снегопат» (lexer.as:3-4).

**Инициализация.** Пакетов `Packet(...)` файл не создаёт (регистрация не требуется — функциональность пассивная). Глобальные объекты:

- Регэкспы (lexer.as:157-168), создаваемые при загрузке скрипта:
  - `quotesRex` — `["\|][^"]*(?:["\n]|$)` — поиск открытых строковых литералов;
  - `indentRex` — `^\s*` — отступ строки;
  - `endLineRex` — `\s*;*\s*$` — завершение строки (пробелы и точки с запятой);
  - `extractFileNameRex` — `[^\\/]+$` — имя файла из пути;
  - `extractFileExtRex` — `(?<\.)[^\.]*$` — расширение файла;
  - `whiteSpaceRex` — `\s+`;
  - `ucaseLetterRex` — `\p{Upper}`;
  - `scriptTagsRex` — `^(?://(\w+)\:|\$(\w+))[ \t]*(.*?)\s*?\n` — теги скриптов (`//тег:` или `$тег`);
  - `newlines` — `\n`;
  - `typeMethodOnLeft` — `Тип\s*\(\s*"$|Тype\s*\(\s*"$` — незакрытый вызов `Тип(` в конце строки;
  - `closedBracketOnRight` — `^\s*\)`; `quoteOnRight` — `^\s*"`.
- `oneTextDoc` (lexer.as:223) — кешированный `IContext&&` объекта `CLSID_TxtEdtDoc` (1С «ТекстовыйДокумент»), создаётся лениво в `readTextFile`.

**Типы.**

### `enum Lexems` (lexer.as:12-79)
Совместимость со SnegAPI: перечисление типов лексем `ltUnknown, ltRemark, ltQuote, ltDate, ltNumber, ltPreproc, ltDirective, ltLabel, ltLPar, ltRPar, ltLBrt, ltRBrt, ltEqual, ltComma, ltSemicolon, ltPlus, ltMinus, ltMult, ltDivide, ltMod, ltQuestion, ltPeriod, ltLess, ltLessEq, ltGrat, ltGratEq, ltNotEq, ltName`, ключевые слова (`ltIf…ltVal`: `ltIf, ltThen, ltElsIf, ltEndIf, ltElse, ltFor, ltEach, ltIn, ltTo, ltWhile, ltDo, ltEndDo, ltProcedure, ltFunction, ltEndProcedure, ltEndFunction, ltVar, ltGoto, ltReturn, ltContinue, ltBreak, ltAnd, ltOr, ltNot, ltTry, ltExcept, ltRaise, ltEndTry, ltNew, ltExecute, ltTrue, ltFalse, ltAddHandler, ltRemoveHandler, ltExport, ltNull, ltUndefined, ltVal`). В комментариях у каждого элемента — двухбуквенный код (`Un, Rm, Qt, Dt, Nu, Pr, Dr, Lb, Lp, Rp, Lr, Rr, Eq, Cm, Sc, Pl, Mn, Mu, Dv, Mo, Qs, Pd, Ls, Le, Gt, Ge, Ne, Nm, If, Th, …`), используемый в `_reStream`.

### `enum PreprocContextTypes` (lexer.as:82-96)
Варианты запуска программы, влияющие на состав символов препроцессора: `pctServer=1, pctExtConnect=2, pctThickClientOrdinaryApplication=4, pctThickClientManagedApplication=8, pctThinClient=16, pctWebClient=32, pctFS_Server_ThickOrdinary=64, pctFS_Server_ThickManaged=128, pctFS_Server_ExtCnn=256, pctMobServer=512, pctMobClient=1024`, а также `pctCount=11, pctLast=pctMobClient`.

### `enum AccessModes` (lexer.as:99-108)
Виды доступности методов: `amSrv=1, amThk=2, amThn=4, amWeb=8, amExt=16, amMSr=32, amMCl=64, amCount=7`.

### `enum ParseMethodFlags` (lexer.as:110-139)
Побитовые флаги парсинга метода (используются нативным/внешним парсером): `allowProcedure, allowFunction, allowModuleVar, allowGCProp, allowNewTypes, allowObjMethods, allowObjProps, nothingToDone, inExpression, inFunction, inProcedure, inSelectHandler, wantCollection, wantHandlers, wantProcName, wantFuncName, wantMVarName, wantLVarName, wantParamName, wantTypeName, wantDefVal, inIndex, afterCompare, needFastReparse, allowDirective, hasParam, hasParamNew, noSemicolon` (биты 0…27).

### `enum LocalVarType` (lexer.as:141-145)
`lvParam, lvVar, lvAuto` — вид локальной переменной.

### `enum execContextTypes` (lexer.as:147-154)
Контексты исполнения (директивы компиляции): `ecNone, ecAtServer, ecAtClient, ecAtClientAtServer, ecAtServerNoContext, ecAtClientAtServerNoContext`.

### `class ValueParamsVector` (lexer.as:250-263)
Обёртка для вызова методов 1С через `callMeth`.
- Поля: `args` (Vector — массив указателей на Value), `values` (`array<Value>&&`), `retVal` (Value).
- Конструктор `ValueParamsVector(uint argsCount = 0)`: создаёт `array<Value>(argsCount)`, выделяет `args.alloc(argsCount, sizeof_ptr)` и записывает в слоты `mem::int_ptr[args.start + i * sizeof_ptr] = values[i].self` — т.е. формирует нативный массив указателей на `Value` для передачи в `IContext::callMeth`.

### `class ILexem` (lexer.as:265-288)
Обёртка одной лексемы над нативной структурой `lexem`.
- Поля: `protected lexem lex`, `protected IV8Lexer&& owner`.
- Конструктор `ILexem(const lexem& l, IV8Lexer&& o)`.
- Свойства: `get_type()` → `Lexems(lex.type)`, `get_start()` → `lex.start`, `get_length()` → `lex.length`, `get_line()` → `lex.line`, `get_text()` → `lex.text` — позиция (смещение/длина) в исходном тексте, строка и сам текст лексемы.

### `class IV8Lexer` (lexer.as:290-362)
Скриптовый «лексер модуля» (экспонируется в SnegAPI через `com_snegopat.as:199` — `parseSources`).
- Конструктор `IV8Lexer(const string& t, uint sl)` — принимает полный текст и номер начальной строки:
  1. создаёт нативный `lex_provider lp(_text.cstr, sl)` и в цикле `nextWithKeyword(lex)` получает все лексемы;
  2. каждую лексему мапит через `lexType()` и кладёт в `lexems` как `ILexem`;
  3. комментарии в поток не попадают;
  4. для имён (`ltName`) ведёт словарь: массив `names` + регистронезависимая карта `findNames` (`NoCaseMap<uint>`), в поток пишет `Nm` + номер имени в 6 цифрах (`formatInt(idxOfName, "0", 6)`), на поток уходит 8 символов;
  5. для остальных лексем — двухбуквенный код из `lexAbbr` (`lexAbbr.substr(2 * lex.type, 2)`), 2 символа на лексему;
  6. собирает поток: `_reStream = join(reParts, "")`.
- Поля: `protected array<ILexem&&> lexems`, `protected array<string> names`, `protected NoCaseMap<uint> findNames`, `protected UintMap<uint> lexemPos` (смещение в `_reStream` → номер лексемы), публичные `string _text`, `string _reStream`.
- Методы:
  - `uint get_lexemCount()` — число лексем;
  - `ILexem&& lexem(uint idx)` — лексема по индексу или `null`;
  - `uint get_namesCount()` / `string name(uint idx)` — словарь имён;
  - `int idxOfName(const string& name)` — индекс имени или −1;
  - `int posToLexem(uint posInReStream)` — по смещению в потоке возвращает номер лексемы или −1 (позволяет после регэксп-матча по `_reStream` получить реальные позиции в тексте);
  - `string strNameIdx(const string& name)` — токен вида `Nm%06d` для имени (для конструирования регэкспов по потоку).

**Функции файла.**

- `bool isLineEndWithOpenQuote(const string& line)` (lexer.as:171-174) — определяет, заканчивается ли строка текста открытым литералом (без завершающей кавычки): матчит `quotesRex`; true, если последний матч имеет длину 1 (одиночная кавычка или `|`) либо его последний символ не `"`. Используется раскраской SQL-запросов (`sqlcolors.as:329,393,424,485,494`).
- `bool fileReadBytes(HANDLE h, int_ptr buf, uint size)` (lexer.as:178-184) и `bool fileWriteBytes(...)` (lexer.as:186-192) — обёртки над `ReadFile`/`WriteFile`, обязательные для этих WinAPI-функций: они требуют указатель на счётчик байтов; Windows 7 падает с `0xC0000005` при нулевом указателе (Windows 8+ допускает), а обёртка `winapi.v` по умолчанию передаёт 0. Поэтому выделяется 16 байт через `mem::malloc`, туда пишется 0, после вызова — `mem::free`. Комментарий прямо в коде (lexer.as:176-177).
- `string readUtf8File(const string& path)` (lexer.as:194-208) — чтение файла в строку: `CreateFile` (GENERIC_READ, FILE_SHARE_READ), `GetFileSize`, `mem::malloc`, `fileReadBytes`, `fromUtf8`, `mem::free`, `CloseHandle`. При ошибке возвращает пустую строку. Используется `settings_store.as:148,173,365` и `diag.as:65,411`.
- `void fromUtf8(int_ptr buffer, uint size, string& result)` (lexer.as:210-218) — конвертация UTF-8 в строку движка: пропускает BOM (`0xBFBBEF` в младших 3 байтах первого dword), затем два прохода `MultiByteToWideChar(CP_UTF8, …)` — замер длины и запись в буфер `result.setLength(len)`.
- `bool readTextFile(string& result, const string& path, const string& encoding = "")` (lexer.as:224-248) — чтение текстового файла **встроенным объектом 1С**: лениво создаёт `CLSID_TxtEdtDoc` через `currentProcess().createByClsid(..., IID_IContext, oneTextDoc)`; через `IContextDef.findMethod("Read")` находит метод `Read`; заполняет `ValueParamsVector(3)` (значение 0 — путь, 1 — кодировка либо дефолтное значение параметра через `getParamDefValue`, 2 — дефолт); вызывает `oneTextDoc.callMeth(methPos, params.retVal, params.args)`; затем `ITextManager&& itm = oneTextDoc.unk; itm.getTextManager().save(text)` — забирает содержимое. Возвращает true при успехе. Используется загрузчиком скриптов (`scriptLoader.as:122`). Закомментированный вариант — чтение через `readUtf8File` (lexer.as:246).
- `Lexems lexType(uint t)` (lexer.as:364-501) — большой `switch`-маппинг нативных кодов лексера (`lexRemark, lexQuote, lexQuoteOpen, lexDate, lexDateOpen, lexNumber, lexPreproc, lexDirective, lexLabel, lexLPar…lexNotEq, lexName`, ключевые слова `kwIf…kwVal`) в элементы `Lexems`; открытые кавычки/даты (`lexQuoteOpen`, `lexDateOpen`) сводятся к `ltQuote`/`ltDate`; всё прочее — `ltUnknown`.
- `const string lexAbbr` (lexer.as:503) — конкатенация двухбуквенных кодов `"UnRmQtDtNuPrDrLbLpRpLrRrEqCmScPlMnMuDvMoQsPdLsLeGtGeNeNmIfThEsEiElFoEaInToWlDoEdPcFuEpEfVaGoReCoBrAnOrNtTrEcRsEtNwEuTuFlAhRhExNlUfVl"` — таблица для кодирования потока.
- `LexemTypes getMethodText(TextManager& pTextManager, uint& line, uint col, bool bOnlyMeths, string&out methodText, execContextTypes&out directive)` (lexer.as:508-631) — ключевая функция для интеллисенса. Возвращает `LexemTypes` (нативный enum: `onlyMeths`, `onlyMethsAndStatements`, `onlyVarsAndMethods`, `lexUnknown`). Алгоритм:
  1. Берёт строку `line` через `pTextManager.getLineFast` (для `ver < 8.3.19` — с кеш-объектом из `getCashObject`, иначе без), обрезает её до колонки каретки (`col--`, `rtrim("\r\n").padRight(' ', col)`, `setLength(col)`).
  2. Идёт **вверх** по строкам, каждая парсится `lex_provider.nextWithKeyword`: если найдено `kwProcedure`/`kwFunction` — `typeOfMethodBegin = 1`, строки после ключевого слова запоминаются отдельно (начало метода найдено); если `kwEndProcedure`/`kwEndFunction` — `typeOfMethodBegin = 2`, берётся текст **после** конца метода; на начале модуля (`--line == 0`) — выход.
  3. Если метод начинается с `Процедура/Функция` (тип 1) — дополнительно ищет **директиву** выше: поднимается по строкам, пока в них нет значимых лексем (накапливая `textBeforeMethod`); если последняя значимая лексема строки — `lexDirective` и `parseDirective(lastLexem)` даёт не `ecNone`, строка директивы + накопленный текст вставляются перед методом, `line = testLine` (lexer.as:563-599).
  4. `lines.reverse(); methodText = join(lines, "")` — собранный текст метода до каретки.
  5. Возвращаемое значение: `onlyMeths`, если `bOnlyMeths` (в модуле всё равно возможны только методы); `lexUnknown`, если мы внутри метода (тип 1); если тип 2 (за концом метода) — сканирует следующие строки: первая значимая лексема `kwProcedure`/`kwFunction`/`lexDirective` → `onlyMeths`, иначе → `onlyMethsAndStatements`; при старте модуля → `onlyVarsAndMethods`.
  Используется `ModuleTextProcessor.as:380` для построения контекста парсинга при подсказке.

**Перехваты.** Нет — файл не ставит `TrapVirtualStdCall`/`TrapSwap`.

**Используемые API.** Нативные сущности snegopat.dll: `lex_provider` (методы `setSource`, `nextWithKeyword(lexem&)`), `lexem`, константы `lex*`/`kw*`, тип `LexemTypes`, функция `parseDirective`. WinAPI: `CreateFile, ReadFile, WriteFile, GetFileSize, CloseHandle, MultiByteToWideChar`. Память: `mem::malloc`, `mem::free`, `mem::dword`, `mem::int_ptr`. Платформа 1С: `currentProcess().createByClsid`, `IContext`, `IContextDef` (`findMethod`, `getParamDefValue`), `ITextManager` (`getTextManager().save`), `CLSID_TxtEdtDoc`, `IID_IContext`. Скриптовые: `RegExp`, `NoCaseMap`, `UintMap`, `formatInt`, `join`, `fromUtf8` (строковый метод также используется в `colorer.as`).

**Взаимодействия.** Отдаёт: `IV8Lexer`/`parseSources` для SnegAPI (`com_snegopat.as:199-200`), `getMethodText` — интеллисенсу (`ModuleTextProcessor.as:380`), `isLineEndWithOpenQuote` — раскраске SQL (`sqlcolors.as`), `readTextFile` — загрузчику скриптов (`scriptLoader.as:122`), `readUtf8File` — хранилищу настроек и диагностике (`settings_store.as`, `diag.as`), регэкспы (`indentRex` — `textwnd.as:81`) и типы `execContextTypes`/`Lexems` — остальному движку.

**Версионные ветки.** `#if ver < 8.3.19` в `getMethodText` (lexer.as:513-516, 520-524, 556-560, 592-596, 613-617): до 8.3.19 у `TextManager` есть кеш объектов — `getCashObject(cashObject)` и `getLineFast(line, wline, cashObject)`; с 8.3.19 кеша «больше нет» (комментарий lexer.as:514) — вызовы без него.

**Особенности.**
- Сам лексический анализ делегирован нативному `lex_provider` — скриптовый слой только мапит типы и строит поток `_reStream`.
- Идея `_reStream`: модуль кодируется строкой фиксированной ширины на лексему (8 символов на имя, 2 на остальное), имена выносятся в регистронезависимый словарь; по такому потоку удобно искать конструкции регэкспами (например, незакрытый `Тип(`), а `posToLexem` восстанавливает привязку к реальным позициям текста.
- Хак с `fileReadBytes`/`fileWriteBytes` — обход падения Windows 7 при `lpNumberOfBytesRead = NULL`; в комментарии явно сказано, что движок обязан читать/писать только через эти функции (lexer.as:176-177).
- `getMethodText` оперирует «виртуальными лексемами» (что разрешено в текущей позиции: только методы / методы+стейтменты / переменные+методы) — это основа контекстной подсказки.
- Измерение времени парсинга (закрытый `GetTickCount`-код в комментарии lexer.as:292, 326-327) — отладочный след разработки.

---

## synedit.as (567 строк)

**Назначение.** Внедрение альтернативного текстового редактора **SynEdit** (порт Lazarus SynEdit, внешний аддин `SynEditV8.dll`) вместо штатного редактора 1С (заголовок: «Внедрение текстового редактора "SynEdit"», synedit.as:3). Реализует интерфейсы альтернативных редакторов из `textwnd.as` (`EditorInfo`, `TextEditorDocument`, `TextEditorWindow`) и ставит набор ловушек на нативные классы платформы (`TextManager`, `BaseWindow`, `wbase::set_focus/get_focus`), чтобы синхронизировать внешний редактор с изменениями текста, выделения, фокуса и геометрии окон.

**Инициализация.**
- `SynEditInfo seInfo = SynEditInfo()` (synedit.as:10) — глобальный дескриптор редактора.
- `Packet piSynEdit("synedit", function() { editorsManager._registerEditor(seInfo); return true; }, piOnMainEnter);` — **закомментирован** (synedit.as:11): в текущем коде SynEdit автоматически не регистрируется в `editorsManager`; регистрация альтернативного редактора выполняется только пактом `piScintilla` в `colorer.as:13`. (Для включения SynEdit нужно раскомментировать пакт.)
- Глобальные объекты: `IDispatch&& addinObj` (synedit.as:13) — COM-объект аддина SynEditV8; `array<TextWnd&&> synEditEditors` (synedit.as:15) — все открытые текстовые окна с SynEdit-редактором; `FuncSynEditWndProc&& synEditWndProc` + `bool synEditWndProcInitDone` (synedit.as:204-206) — указатель на оконную процедуру SynEdit; `int_ptr focusedWindow` (synedit.as:207).
- Константы сообщений (synedit.as:17-21) — протокол между движком и окном аддина: `WM_USER = 0x400`, `WM_TEXTWND_CHANGED = WM_USER + 665`, `WM_ACTIVE_CHANGED = WM_USER + 667`, `WM_DO_DESTROY = WM_USER + 668`, `LM_DO_RESIZE = WM_USER + 2004`.

**Типы.**

### `class SynEditInfo : EditorInfo` (synedit.as:23-133)
Дескриптор редактора для `EditorsManager`.
- `string name()` → `"SynEdit"`; `string extention()` → `"Встроенный язык"`; `array<string>&& extGuids()` → `{gTextExtModule, gTextExtModule1}` (оба GUID расширения «встроенный язык»).
- `void activate()` (synedit.as:33-58) — вызывается при назначении редактора активным:
  1. ищет аддин `oneDesigner._addins.byUniqueName("SynEdit")`; если нет — загружает `dll:<addins>SynEdit\SynEditV8.dll` (`loadAddin(..., oneDesigner._addins._libs)`); при неудаче `Message("Не удалось загрузить SynEditV8")`;
  2. берёт `a.object()` в `addinObj`, находит метод `findMember("setASMainObj", meth)` и вызывает его, передавая `createDispatchFromAS(&&this)` — аддин получает ссылку на этот скриптовый объект как главный;
  3. ставит ловушки: `initTextAreaModifiedTraps()`, `initCaretSelectionTraps()`, а для `ver >= 8.3.12` — ещё `initResizeTraps()` и `initFocusTrap()`.
- `void doSetup()` — пусто.
- `TextEditorDocument&& create()` → `SynEditDocument()` (synedit.as:61-63).
- `bool supportsNewWindowSystem()` → `true` (synedit.as:64-66) — влияет на `_registerEditor` при `ver > 8.3.12`.
- `SynEditEditor&& activeEditor()` (synedit.as:67-76) — приводит `activeTextWnd.editor` к `SynEditEditor`.
- `Variant activeSynEditEditor()` (synedit.as:77-86) — возвращает `Variant` с IDispatch активного редактора (для вызовов из аддина/скриптов).
- `bool showSmartBox()` (synedit.as:87-97) — скрывает список `IntelliSite` (`getIntelliSite().isActive() → hide()`), затем, если активное окно — модульный текст (`cast<ModuleTextProcessor>(activeTextWnd.textDoc.tp)`), вызывает `tp.activate(activeTextWnd)` — открывает снегопатовский SmartBox.
- `Variant editorWindowRect(HWND hwnd)` (synedit.as:99-128, только `ver >= 8.3.12`) — для окна `wbase::Window` (`toWindow(hwnd)`) вычисляет `getWindowRects(r1, r2, r3)`, `calcShadowRect(sr)`, `calcInBorderRect(ibr, r1)` и возвращает `IRect` с `left/right` из `r1` и `top/bottom` из `sr.top-4 / sr.bottom-4` — геометрия для позиционирования всплывающих списков.
- `HWND twHwnd()` (synedit.as:130-132) → `getHwnd(activeTextWnd)`.

### Вспомогательные обёртки для передачи данных через `Variant` (только IDispatch)
- `class strWrapper` (synedit.as:137-142) — хранит `string _val` («Там, похоже, только IDispatch можно передавать…»).
- `class textManagerWrapper` (synedit.as:145-150) — хранит `uint _id = tm.self` (идентификатор TextManager).
- `class ITextPos` (synedit.as:153-160) — `int line; int col;` из `TextPosition`.
- `class IRect` (synedit.as:163-174) — `long left/right/top/bottom` из `Rect`.

### `class SynEditDocument : TextEditorDocument, TextModifiedReceiver` (synedit.as:176-202)
Документ-редактор SynEdit (один на TextDoc).
- Поля: `int_ptr sciDoc = 0`, `bool inTextModified = false`, `SynEditEditor&& sEditor`.
- `void attach(TextDoc&& td)` — базовый `attach` + `editorsManager._subscribeToTextChange(td.tm, this)` (подписка на программные изменения текста).
- `void detach()` — отписка `editorsManager._unsubsribeFromTextChange(owner.tm, this)` + базовый `detach`.
- `TextEditorWindow&& createEditor()` → `SynEditEditor(this)`.
- `void onTextModified(TextManager& tm, const TextPosition& tpStart, const TextPosition& tpEnd, const string& newText)` (synedit.as:193-201) — формирует `array<Variant>` `[strWrapper(newText), ITextPos(tpEnd), ITextPos(tpStart), textManagerWrapper(tm)]` и шлёт событие аддину: `oneDesigner._events.fireEvent(oneDesigner._me(), "SynEditonTextModified", args)`.

### `class SynEditEditor : TextEditorWindow, SelectionChangedReceiver` (synedit.as:209-331)
Окно-редактор (одно на TextWnd).
- Поля: `HWND synEditHwnd` (окно SynEdit-фрейма), `HWND synEditEditorHwnd` (сам контрол редактора). Конструктор `SynEditEditor(SynEditDocument&& o)` пуст.
- `void attach(TextWnd&& tw)` — базовый attach, `editorsManager._subscribeToSelChange(tw.ted, this)`, событие `oneDesigner._events.fireEvent(oneDesigner._me(), "SynEditcreateTextWindow", [this, tw.getComWrapper()])` и `synEditEditors.insertLast(tw)` (synedit.as:216-224).
- `void detach()` — удаляет окно из `synEditEditors`, отписка `_unsubsribeFromSelChange`, базовый detach (synedit.as:225-234).
- `void setSynEditHwnd(HWND hwnd, HWND editorHwnd, uint wndProc)` (synedit.as:235-242) — аддин сообщает хэндлы и адрес своей оконной процедуры; однократно `initFuncDefFromAddress(wndProc, &&synEditWndProc)` — скрипт получает вызываемый указатель на нативную WndProc SynEdit.
- `bool isEditorFocused()` — `focusedWindow == activeTextWnd.hWnd` (synedit.as:243-250).
- `void onFocused()/onUnfocused()` — ставят/сбрасывают глобальный `activeTextWnd` (synedit.as:251-256).
- `void onSelectionChanged(ITextEditor&, const TextPosition& tpStart, const TextPosition& tpEnd)` — событие `"SynEditOnSelectionChanged"` с `[ITextPos(tpStart), ITextPos(tpEnd)]` (synedit.as:258-263).
- `void onScrollToCaretPos(ITextEditor&)` — пусто (synedit.as:264-266).
- `bool getCaretPosForIS(ITEIntelliSence& teis, Point& caretPos, uint& lineHeight)` — `GetCaretPos(caretPos)`, `lineHeight = 24` (жёстко), `true` (synedit.as:267-272).
- `void checkSelectionInIdle(ITextEditor&)` — тело закомментировано (synedit.as:273-275).
- `void selectionChanged()` — `SendMessage(..., WM_TEXTWND_CHANGED, 0)`: до 8.3.12 — в `txtWnd.hWnd`, с 8.3.12 — в `synEditHwnd` (synedit.as:276-282).
- `void onActivate()/onDeactivate()` — `WM_ACTIVE_CHANGED` 1/0 в `synEditHwnd` (synedit.as:283-288).
- `void handleReposition()` — `LM_DO_RESIZE` (synedit.as:289-291); `void onDestroy()` — `WM_DO_DESTROY` (synedit.as:292-294).
- `void doFocus()` — событие `"SynEditDoFocusEditor"` с этим объектом (synedit.as:295-300).
- `bool dispatchMessage(MSG& msg, int_ptr p1)` (synedit.as:301-327) — фильтр клавиатуры перед отдачей в SynEdit:
  - `Ctrl+Shift+Space` — `return false` (клавиша оставлена штатной обработке);
  - сообщение адресовано `synEditEditorHwnd` → передавать редактору; либо редактор в фокусе (`isEditorFocused()`) — тогда ещё `PostMessage(synEditHwnd, WM_SETFOCUS, 0, 0)`;
  - `VK_APPS` (клавиша меню) — фокус возвращается в главное окно (`SendMessage(hRealMainWnd, WM_SETFOCUS, ...)`, `sendToEditor = false`);
  - для `WM_CHAR/WM_KEYDOWN/WM_KEYUP` при `sendToEditor` вызывается напрямую `synEditWindowProc(synEditEditorHwnd, msg.message, msg.wParam, msg.lParam)`; если вернул > 0 — сообщение съедено.
- `long synEditWindowProc(HWND, UINT, long, long)` — прямой вызов `synEditWndProc` (synedit.as:328-330).

**Функции файла (свободные).** Все значимые — хуки и их инициализаторы, см. «Перехваты».

**Перехваты.**

1. **`trTextAreaModified`** — `TrapSwap` на `TextManager::onTextAreaModified` в `core82.dll`/`core83.dll` (x86: `?onTextAreaModified@TextManager@core@@UAEX_NABVTextPosition@2@111@Z`, x64: `@@UEAAX_NAEBVTextPosition@2@111@Z`, `asCALL_THISCALL`) — synedit.as:458-475. Хук `textAreaModified_trap(tm, b, beforeStart, beforeEnd, afterStart, afterEnd)` (synedit.as:483-489): сначала `notifyTextAreaModified(tm, b, Selection(beforeStart, beforeEnd), Selection(afterStart, afterEnd))`, затем оригинал через `swap()`. Класс `Selection` определён в `com_textwindow.as:10`.
2. **`notifyTextAreaModified`** (synedit.as:491-499) — при `oneDesigner !is null` шлёт аддин-событие `"onChangeTextManager"` с аргументами `[after, before, before]` (третий слот — задел под TextManager, см. комментарий synedit.as:496). Это главный канал уведомления аддинов об изменениях текста.
3. **`disableTextAreaModifiedTrap()`** (synedit.as:477-481) — выключение ловушки (`swap` при `trapEnabled`).
4. **`trCaretSelection`** — `TrapSwap` на `TextManager::onSelectionRecalculateFinished` (core dll, `?onSelectionRecalculateFinished@TextManager@core@@UAEXXZ`, `asCALL_THISCALL`) — synedit.as:507-517. Хук `onSelectionRecalculateFinished_trap(tm)` (synedit.as:534-546): для всех окон `synEditEditors`, чей `textDoc.tm` совпадает (сравнение `&&tw.textDoc.tm == &&tm`), вызывает `editor.selectionChanged()`; затем оригинал.
5. **`trSetCaretPos`** (только `ver >= 8.3.12`) — `BaseWindow::SetCaretPos` (`wbase83.dll`, `?SetCaretPos@BaseWindow@wbase@@QAEHHH@Z`, `asCALL_THISCALL`). Хук `SetCaretPos_trap(w, i1, i2)` (synedit.as:549-566): после оригинала шлёт `PostMessage(editor.synEditHwnd, WM_TEXTWND_CHANGED, 1, 0)` окнам, чей `hWnd == w`.
6. **`trFocusTrap`** — глобальная `wbase::set_focus` (`wbase83.dll`, `?set_focus@wbase@@YAXPAVIWindow@1@@Z`, `asCALL_CDECL`); хук `SetFocusTrap` — чистый passthrough (вариант с подменой фокуса закомментирован, synedit.as:355-375).
7. **`trGetFocusTrap`** — `wbase::get_focus` (`?get_focus@wbase@@YAPAVIWindow@1@XZ`); хук `GetFocusTrap` — passthrough + запоминает результат в `focusedWindow` (synedit.as:377-388) — так определяется, в фокусе ли редактор.
8. **`trResizeTrap`** — `BaseWindow::reposition` (`?reposition@BaseWindow@wbase@@QAEXABVZPos@2@PBURect@core@@H@Z`, `asCALL_THISCALL`, dll `wbase82.dll`/`wbase83.dll` по `ver<8.3`); хук `TopLevelWindowOnSize` — после оригинала вызывает `editor.handleReposition()` для окон, чей `TextWnd.hWnd == w` (synedit.as:436-453).
9. **`trReposition`** — тот же метод; хук `V8RepositionTrap` — после оригинала `handleReposition()` для **всех** `synEditEditors` (комментарий: «HWND is some other window here... so just resize'em all», synedit.as:420-434).
10. Инициализация: `initFocusTrap()`/`initResizeTraps()` — synedit.as:339-353, 395-418 (ставят при `trapNotActive`, включают при `trapDisabled`); `disableCaretSelectionTrap()` (synedit.as:528-532).

**Используемые API.** `oneDesigner._addins` (`byUniqueName`, `loadAddin`), `oneDesigner._events.fireEvent(oneDesigner._me(), ...)`, `Addin.object()`, `createDispatchFromAS`, `Variant` (`setDispatch`), `IDispatch.findMember/call`, `initFuncDefFromAddress` (вызов нативной функции по адресу), `TrapSwap.setTrapByName/getOriginal/swap`, WinAPI: `SendMessage, PostMessage, GetKeyState, GetCaretPos`, окна `wbase` (через `toWindow`: `getWindowRects, calcShadowRect, calcInBorderRect`), `editorsManager`, `getIntelliSite()`, `activeTextWnd`, `getHwnd`, `hRealMainWnd`, `Message`.

**Взаимодействия.** Реализует базовые классы `EditorInfo`/`TextEditorDocument`/`TextEditorWindow` из `textwnd.as`; использует `textDocStorage.find(wv.hwnd())` (synedit.as:360), глобальные `activeTextWnd` (textwnd.as:10), `getHwnd` (textwnd.as:381/387), `hRealMainWnd` (textwnd.as:377). Даёт аддину SynEditV8 события: `SynEditcreateTextWindow`, `SynEditonTextModified`, `SynEditOnSelectionChanged`, `SynEditDoFocusEditor`, `onChangeTextManager`. Через `ModuleTextProcessor.activate` открывает SmartBox (`showSmartBox`).

**Версионные ветки.**
- `#if ver >= 8.3.12`: вызовы `initResizeTraps()/initFocusTrap()` в `activate()` (synedit.as:53-56), метод `editorWindowRect` (synedit.as:98-129), блок ловушек фокуса/ресайза (synedit.as:333-454), `trSetCaretPos` (synedit.as:502-505, 518-525, 548-567), цель `SendMessage` в `selectionChanged` (synedit.as:277-281).
- `#if ver < 8.3` / `#else`: выбор dll `wbase82.dll`/`core82.dll` против `wbase83.dll`/`core83.dll` (synedit.as:397-401, 408-412, 462-466, 509-513).
- `#if x86` / `#else`: разные декорированные имена x86/x64 для `onTextAreaModified` (synedit.as:467-471).

**Особенности.**
- SynEdit — полноценная замена штатного редактора: текст 1С хранится в `TextManager`, а отрисовка/редактирование делает внешний контрол; синхронизация — через события и `WM_USER`-сообщения.
- Оконная процедура SynEdit вызывается из скрипта по «сырому» адресу (`initFuncDefFromAddress`) — приём для работы с нативным кодом без vtable-ловушек.
- `getCaretPosForIS` возвращает жёсткую высоту строки 24 px — потенциальная рассинхронизация при другом шрифте.
- Пакт регистрации закомментирован — синтаксический «выключатель» функциональности без удаления кода.
- Множественные `swap()` вокруг вызова оригинала — стандартный безопасный паттерн рекурсивного вызова перехваченного метода в этой кодовой базе.

---

## textwnd.as (1035 строк)

**Назначение.** Центральная подсистема текстовых окон: перехват создания окон текстового редактора 1С (`onCreateTextWnd`), учёт открытых документов и их окон (`TextDocStorage`, `TextDoc`, `TextWnd`), выбор текстового процессора по расширению текста (`TextProcessor`, `createTextProcessor`), каркас альтернативных редакторов (`EditorInfo`, `TextEditorDocument`, `TextEditorWindow`, `EditorsManager`) и ловушки, транслирующие нативные события (изменение текста, выделения, позиции каретки, активация окна, маршрутизация сообщений) в скриптовые уведомления. Заголовок: «Тут часть кода, работающая с текстовыми окнами» (textwnd.as:3).

**Инициализация.** Пакетов нет — вся инициализация происходит по хукам из `main.as`. Глобальные объекты и опции:
- `TextWnd&& activeTextWnd` (textwnd.as:10) — текущее активное текстовое окно (используется интеллисенсом, synedit, com-обёртками).
- `bool useCtrlClicks = false` + `OptionsEntry oeUseCtrlClicks("UseCtrlClicks", …)` (textwnd.as:11-15) — опция «Ctrl+клик» (профиль `Snegopat/Settings/UseCtrlClicks`): defval-функция кладёт текущее значение, init-функция читает через `v.getBoolean(useCtrlClicks)`, apply-функция пишет и возвращает `false` (без перезапуска). Влияет на `TextWnd.afterClick`/`onContextMenu`.
- `bool showNotifyOnStartup = false` + `OptionsEntry oeShowNotifyOnStartup("ShowNotifyOnStartup", …)` (textwnd.as:17-20) — показ уведомления при старте, по умолчанию выключено («просьба пользователей; включается флажком в настройках»).
- `TextDocStorage textDocStorage` (textwnd.as:122) — реестр открытых текстовых документов.
- `NoCaseMap<TextDocMdInfo&&> openedMdObjects` (textwnd.as:230) — карта открытых объектов метаданных (ключ — `"" + obj.self + "|" + propUuid`, см. `keyForSearchOpenedMD`, textwnd.as:231-233).
- `HWND hRealMainWnd` (textwnd.as:377) — хэндл главного окна (для `getHwnd` при `ver >= 8.3.12`).
- `EditorsManager editorsManager` (textwnd.as:868) — глобальный менеджер редакторов.

**Типы.**

### `interface TextProcessor` (textwnd.as:25-38)
Обработчик событий в тексте; назначается документу по расширению текста («Встроенный язык», «язык запросов» и т.п.). Методы:
- `void setTextDoc(TextDoc&& textDoc)` — подключение/отключение к документу;
- `void connectEditor(TextWnd&& editor)` — подключение нового окна редактора;
- `void afterChar(TextWnd&& editor, uint16 symbol)` — обработка после `WM_CHAR`;
- `bool onKeyDown(TextWnd&& editor, WPARAM wParam, LPARAM lParam)` — обработка `WM_KEYDOWN`/`WM_SYSKEYDOWN`;
- `bool onChar(TextWnd&& editor, uint16 symbol)` — обработка `WM_CHAR` (true — съесть символ);
- `void itemInserted(TextWnd&& editor, SmartBoxInsertableItem&& item)` — из списка снегопата вставлен элемент.

### `interface EditorData` (textwnd.as:41)
Пустой базовый интерфейс: хранилище данных текстового процессора для конкретного редактора (`TextWnd.editorData`).

### `class EmptyTextProcessor : TextProcessor` (textwnd.as:44-51)
Пустой процессор: все методы не делают ничего, `connectEditor` лишь обнуляет `editor.editorData`.

### `class TextDocStorage` (textwnd.as:124-179)
- Поле: `array<TextDoc&&> openedDocs`.
- `TextDoc&& find(ITextManager&& itm)` — поиск документа по идентичности `ITextManager` (textwnd.as:127-133).
- `TextDoc&& find(TextManager&& tm)` — поиск по `TextManager` (textwnd.as:134-140).
- `void store(TextDoc&& tdoc)` / `void remove(TextDoc&& doc)` — добавление/удаление (textwnd.as:141-149).
- `void disableTextWork()` — всем документам `td.setTextExtenderType(IID_NULL)` — отключение снегопатовской обработки текстов (textwnd.as:150-155); вызывается из `main.as:87`.
- `void enableTextWork()` — каждому документу читает фактический CLSID расширения через `ITextManager_Operations.getExtenderCLSID` и заново применяет `setTextExtenderType` (textwnd.as:156-164); вызывается из `main.as:134`.
- `TextWnd&& find(HWND hwnd)` (только `ver > 8.3.12`, textwnd.as:165-178) — поиск окна по `tw.hWnd` или `tw.parent` среди всех видов всех документов; используется `synedit.as:360`.

### `class TextDocMdInfo` (textwnd.as:235-264)
Информация о связанном объекте метаданных для модульного текста.
- Поля: `TextDoc&& owner`, `IMDObject&& object`, `IMDContainer&& container`, `IUnknown&& extObject`, `Guid mdPropUuid`.
- Конструктор `TextDocMdInfo(IAssistantData&& data, TextDoc&& doc)`: берёт `data.object()` → `object`, `data.extObject()`, `data.propUuid()`; проверяет `IMDObject` (`Print("Assist data not mdobject!!!")` при неудаче); получает контейнер: `getMDObjectWrapper(object).get_container()._container()`; регистрирует себя в `openedMdObjects`.
- `void detach()` — удаляет себя из `openedMdObjects` и обнуляет ссылки.

### `class TextDoc` (textwnd.as:268-375)
Хранит всю информацию о текстовом документе; «у одного текстового документа может быть открыто несколько окон» (textwnd.as:266-267).
- Поля: `ITextManager&& itm`, `TextManager&& tm`, `TextProcessor&& tp`, `array<TextWnd&&> views`, `TextDocMdInfo&& mdInfo`, `TextEditorDocument&& editorDoc`.
- `void attachView(TextWnd&& wnd)` (textwnd.as:278-284): `wnd.textDoc = this`; добавить в `views`; `tp.connectEditor(wnd)`; `wnd.editor = editorDoc.createEditor()`; `wnd.editor.attach(wnd)`.
- `void detachView(TextWnd&& wnd)` (textwnd.as:285-307): сброс `activeTextWnd`, если закрывается активное; удаление из `views`; `wnd.editor.detach()`; при закрытии **последнего** окна — `tp.setTextDoc(null)`, `tp = null`, `mdInfo.detach()`, `editorDoc.detach()`, `textDocStorage.remove(this)`.
- `void setTextExtenderType(const Guid& g)` (textwnd.as:308-366) — смена типа текста (расширения):
  1. если `mdInfo` ещё нет и `g == gTextExtModule || g == gTextExtModule1` (модульный текст): получает расширитель `ITxtEdtExtender` через `getTxtEdtService().getExtender(ext, itm, g)`, приводит к `ISettingsConsumer st = ext.unk` (с диагностикой `dumpVtable` при `diagTraceOn("vt")`, textwnd.as:315) и **сырым обходом памяти** внутренней карты настроек ищет интерфейс `IID_IAssistantData`:
     - `ver < 8.3.11`: односвязный список от `mem::int_ptr[st.self + ModuleTxtExtSettingsMap]`, `GuidRef` на `node + 4`, данные на `mem::int_ptr[node + 20]` (textwnd.as:319-326);
     - `ver >= 8.3.11`: кольцевой список от `mapBegin = mem::int_ptr[st.self + ModuleTxtExtSettingsMap]`, узел `mem::int_ptr[mapBegin]` до `== mapBegin`, `GuidRef` на `node + 2 * sizeof_ptr`, данные на `node + 2 * sizeof_ptr + 16` (textwnd.as:328-336); смещение `ModuleTxtExtSettingsMap` зависит от версии (таблица в `v8api/text.v:282-299`);
     - найденные данные — `data.AddRef()`; если это `IAssistantData` — создаётся `mdInfo = TextDocMdInfo(data, this)`.
  2. Смена процессора: `tp.setTextDoc(null)`; `tp = createTextProcessor(g)`; `tp.setTextDoc(this)`.
  3. Смена редакторского документа: `editorDoc.detach()`; `editorDoc = editorsManager._createEditor(g)`; `editorDoc.attach(this)`.
  4. Пересоздание редакторов во всех открытых окнах: для каждого `views[k]` — `tp.connectEditor(tw)`, `tw.editor.detach()`, `tw.editor = editorDoc.createEditor()`, `tw.editor.attach(tw)` (textwnd.as:359-365).
- `TextWnd&& findWnd(ITextEditor&& editor)` (textwnd.as:367-374) — поиск окна по идентичности `ITextEditor`.

### `class TextWnd` (textwnd.as:492-628)
Окно текстового редактора.
- Поля:
  - `ver < 8.3.12`: `ASWnd&& wnd` — сабклассер текстового окна («перенаправляет указанные события оконной процедуры в скриптовый обработчик»);
  - `ver >= 8.3.12`: `HWND parent` — родительское окно;
  - `HWND hWnd` — «До 12 релиза WinAPI хэндл окна, после — указатель на объект wbase::Window» (textwnd.as:498);
  - `ITextEditor&& ted` — интерфейс редактора 1С; `TextDoc&& textDoc`; `EditorData&& editorData`; `bool isControl` — окно-контрол или полноценный view; `ITextWindow&& iwnd` — скриптовая обёртка; `TextEditorWindow&& editor` — реализация окна-редактора.
- Конструктор `TextWnd(IWindowView&& v, bool isCtrl)` (textwnd.as:506-538): `isControl = isCtrl`; `hWnd = v.hwnd()`; `ted = v.unk` (QI `ITextEditor`). Далее по версии:
  - `ver < 8.3.12`: сабклассирование — `attachWndToFunction(hWnd, WndFunc(this.WndProc), defaultMessages())`;
  - `ver >= 8.3.12` (однократно, при `trFrameViewActivate.state == trapNotActive`): `trFrameViewActivate.setTrap(&&fv, IFramedView_onActivate, TextWnd_Activate)` (перехват уведомления об активации — отслеживание активного редактора); `trWindowDetach.setTrapByName("wbase83.dll", "?detach@Window@wbase@@QAEXXZ"/"QEAAXXZ", asCALL_THISCALL, Window_DetachTrap)`; `trDispatchMsg.setTrapByName("wbase83.dll", "?dispatch_msg@wbase@@YAXABUtagMSG@@PAVIMsgDispHook@1@@Z"/"AEBUtagMSG@@PEAVIMsgDispHook@1@@Z", asCALL_CDECL, DispatchMessagesTrap)` («перехват на роутинг виндовых сообщений для работы контекстной подсказки», textwnd.as:527).
- `array<uint>&& defaultMessages()` (textwnd.as:539-541) — список сообщений для сабклассинга: `WM_KEYDOWN, WM_SYSKEYDOWN, WM_CHAR, WM_DESTROY, WM_SETFOCUS, WM_KILLFOCUS, WM_LBUTTONDOWN, WM_RBUTTONDOWN, WM_RBUTTONUP`.
- `LRESULT WndProc(uint msg, WPARAM w, LPARAM l)` (только `ver < 8.3.12`, textwnd.as:543-579):
  - `WM_SETFOCUS` → `activeTextWnd = this`; `WM_KILLFOCUS` → `activeTextWnd = null`;
  - `WM_DESTROY` → `onDestroy()` + `wnd.doDefault()`;
  - `WM_KEYDOWN/WM_SYSKEYDOWN` → `onKeyDown(w, l)`, при true — `return 0`;
  - `WM_CHAR` → если `beforeChar(w)` — `return 0`, иначе `wnd.doDefault()` и `afterChar(w)`;
  - `WM_LBUTTONDOWN` → `wnd.doDefault()` + `afterClick()`;
  - `WM_RBUTTONDOWN/WM_RBUTTONUP` → `onContextMenu(msg == WM_RBUTTONUP)`, при true — `return 0`;
  - остальное → `editor.wndProc(msg, w, l)`.
- Делегирование процессору: `bool onKeyDown` → `textDoc.tp.onKeyDown(this, w, l)` (textwnd.as:586-588); `bool beforeChar(uint16 symb)` → `textDoc.tp.onChar` (textwnd.as:589-591); `void afterChar(uint16 symb)` → `textDoc.tp.afterChar` (textwnd.as:592-594).
- `ITextWindow&& getComWrapper()` (textwnd.as:595-599) — ленивое создание скриптовой обёртки `ITextWindow(this)`; используется `com_textwindow.as` и `synedit.as:221`.
- `void onDestroy()` (textwnd.as:600-607): `editor.onDestroy()`; `textDoc.detachView(this)`; если есть обёртка — `iwnd._disconnect()`; `ted = null`.
- `void onActivate()/onDeactivate()` — проброс в `editor` (textwnd.as:608-613).
- `void afterClick()` (textwnd.as:614-619): при `useCtrlClicks` и зажатом Ctrl — `SendMessage(getHwnd(this), WM_LBUTTONUP, 0, 0)` и вызов макроса `oneAddinMgr.byUniqueName("SnegopatMainScript").invokeMacros("Перейти к определению")`.
- `bool onContextMenu(bool up)` (textwnd.as:620-627): при `useCtrlClicks` + Ctrl на отпускании правой кнопки — `sendCommandToMainFrame(CommandID(cmdFrameGroup, 324))` и `true` (контекстное меню подавлено); иначе `false`.

### Каркас альтернативных редакторов
- `class TextEditorDocument` (textwnd.as:636-641): поле `TextDoc&& owner`; `attach(TextDoc&&)`/`detach()`; `TextEditorWindow&& createEditor()` → базовый `TextEditorWindow()`.
- `class TextEditorWindow` (textwnd.as:646-678): поле `TextWnd&& txtWnd`; `attach`/`detach`; `LRESULT wndProc(uint, WPARAM, LPARAM)` (только `ver < 8.3.12`) → `txtWnd.wnd.doDefault()`; хелперы для снегопатовского списка подсказки: `void getFontSize(Size& fontSize)` (через `ITxtEdtOptions` QI `txtWnd.ted.unk`, `getFont`, `getLogFontSizes`), `void createCaret(uint lineHeight)` → `CreateCaret(getHwnd(txtWnd), 0, 2, lineHeight)`, `void showCaret()` → `ShowCaret(getHwnd(txtWnd))`, `uint getTextWidth(const string&, const Size&)` → `fontSize.cx * text.length`; пустые `onActivate/onDeactivate/onDestroy`; `bool dispatchMessage(MSG&, int_ptr)` → `false`.
- `interface TextModifiedReceiver` (textwnd.as:682-684): `onTextModified(TextManager&, tpStart, tpEnd, newText)` — уведомление об изменениях текста, сделанных программно.
- `interface SelectionChangedReceiver` (textwnd.as:687-696): `onSelectionChanged(ITextEditor&, tpStart, tpEnd)`, `onScrollToCaretPos(ITextEditor&)`, `bool getCaretPosForIS(ITEIntelliSence&, Point&, uint&)` (координаты для штатного списка подсказки 1С), `checkSelectionInIdle(ITextEditor&)`.
- `interface EditorInfo` (textwnd.as:699-707): `name()`, `extention()`, `extGuids()`, `activate()`, `doSetup()`, `create()`, `supportsNewWindowSystem()`.
- `class ComEditorInfo` (textwnd.as:710-717) — обёртка `EditorInfo` для SnegAPI (копирует `name`/`extention`).

### `class EditorsManager` (textwnd.as:720-867)
- Приватные поля: `array<EditorInfo&&> editors`; `NoCaseMap<EditorInfo&&> editorForExtNames`; `NoCaseMap<EditorInfo&&> editorForExtGuids`; `UintMap<array<SelectionChangedReceiver&&>&&> selChangeSubscribers` (ключ — `ITextEditor.self`); `UintMap<array<TextModifiedReceiver&&>&&> textChangeSubscribers` (ключ — `TextManager.self`).
- `void checkSelectionInIdle()` (textwnd.as:727-735) — обработчик простоя: для всех подписчиков по каждому редактору (`toITextEditor(it.key)` + `AddRef`) вызывает `checkSelectionInIdle(ted)`.
- `TextEditorDocument&& _createEditor(const Guid& extGuid)` (textwnd.as:738-743) — поиск по `editorForExtGuids`; если нет — базовый `TextEditorDocument`.
- `void _registerEditor(EditorInfo&& editorInfo)` (textwnd.as:745-753): при `ver <= 8.3.12` — всегда; иначе только если `supportsNewWindowSystem()`.
- `void _subscribeToSelChange(ITextEditor& editor, SelectionChangedReceiver& receiver)` (textwnd.as:755-767): при первой подписке (`trSS.state == trapNotActive`) добавляет `idleHandlers.insertLast(PVV(this.checkSelectionInIdle))` (очередь простоя объявлена в `mainframe.as:154`); вызов `initSelChangeTrap(editor)` **закомментирован** (textwnd.as:758) — vtable-ловушки выделения в текущем коде автоматически не ставятся; подписчики хранятся по `editor.self`.
- `void _unsubsribeFromSelChange(...)` (textwnd.as:769-784) — отписка; при пустом списке — `disableSelChangeTrap()`.
- `void _subscribeToTextChange(TextManager& tm, TextModifiedReceiver& receiver)` (textwnd.as:786-796) — сначала `initTextModifiedTraps()`, затем подписка по `tm.self`.
- `void _unsubsribeFromTextChange(...)` (textwnd.as:798-813) — при пустом списке — `disableTextModifiedTrap()`.
- `array<...>&& _getSelChangeSubscribers(ITextEditor&)` / `_getTextChangeSubscribers(TextManager&)` (textwnd.as:815-822).
- `uint count()`, `ComEditorInfo&& editor(uint idx)` (textwnd.as:824-831).
- `bool setActiveEditor(const string& extName, const string& editorName)` (textwnd.as:833-855): снимает прежнюю привязку расширения; пустое `editorName` = «штатный редактор» (`true`); иначе ищет `EditorInfo` по имени и расширению, вызывает `ei.activate()` и мапит все `extGuids`.
- `void setup(const string& editorName)` (textwnd.as:856-866) — вызов `doSetup()` названного редактора.

**Функции файла.**

- `void insertInSelection(ITextEditor&& pEditor, TextManager&& pTM, ITextManager&& pITM, const string& txt, bool bClearCache, bool needIndent)` (textwnd.as:63-113) — **основная функция вставки текста** в редактор («как будто нажали Ctrl+V»):
  1. `pEditor.getSelection(tpStart, tpCaretAfter, false)`;
  2. однострочный текст: позиция каретки = начало + длина текста; спецсимвол `symbCaret` внутри текста задаёт позицию каретки после вставки (удаляется из текста);
  3. многострочный текст: при `needIndent` вычисляется отступ текущей строки (`getTextLine(pTM, tpStart.line).rtrim("\r\n").padRight(' ', tpStart.col - 1).match(indentRex).text(0, 0)`) и добавляется после каждого `\n` (`text.replace("\n", "\n" + indent)`); далее посимвольный проход — вычисление конечной позиции каретки (переводы строк, остановка на `symbCaret`);
  4. `pEditor.setSelectionText(text)`; `pEditor.setCaretPosition(tpCaretAfter, false)`; `pEditor.scrollToCaretPos()`;
  5. при `bClearCache`: `ITextParserCache&& pCache = pITM.unk; pCache.clearCache()` — «иначе очень весёлые глюки» (комментарий textwnd.as:58-61); кеш можно сбрасывать после последней из серии вставок;
  6. `ITextManager_Operations&& vu = pITM.unk; vu.updateAllViews()` — обновить все окна этого текста.
  Используется `intellisite.as:316,457` (вставка из списков) и `ModuleTextProcessor.as:299,306,371` (автоотступ, комментирование, шаблоны).
- `TextProcessor&& createTextProcessor(const Guid& g)` (textwnd.as:115-120) — фабрика: `ModuleTextProcessor()` для `gTextExtModule`/`gTextExtModule1`, иначе `EmptyTextProcessor()`.
- `void onCreateTextWnd(IWindowView&& pWnd, bool bControl, HWND parent)` (textwnd.as:182-219) — **вызывается из перехвата при создании окна текстового редактора** (см. «Перехваты» и раздел «Связи»): см. ниже.
- `void changeTextExtender(ITextManager&& itm, const Guid& textExtender)` (textwnd.as:223-228) — вызывается из перехвата смены расширения (пункт меню «Текст» — тип текста): находит `TextDoc` и перевызывает `setTextExtenderType`. Вызывается из `main.as:234`.
- `string keyForSearchOpenedMD(IMDObject&& obj, const Guid& propUuid)` (textwnd.as:231-233) — ключ карты `openedMdObjects`.
- `HWND getHwnd(TextWnd&& tw)` (textwnd.as:381-383 для `ver < 8.3.12` → `tw.hWnd`; textwnd.as:387-389 для `ver >= 8.3.12` → `hRealMainWnd`) — единая точка получения HWND; активно используется интеллисенсом (`intellisite.as:169,396,420,457,466,575,585`) и synedit.
- `void DispatchMessagesTrap(MSG& msg, int_ptr p1)` (textwnd.as:394-453) — см. «Перехваты».
- `void TextWnd_Activate(IFramedView&& view, int_ptr action, IFramedView&& otherView)` (textwnd.as:457-473) — см. «Перехваты».
- `void Window_DetachTrap(HWND wnd)` (textwnd.as:479-488) — см. «Перехваты».
- Уведомители (см. «Перехваты»): `notifyTextChange` (textwnd.as:940-953), `notifyChangeSelection` (textwnd.as:969-981), `logSubscriber` (textwnd.as:935-938).

**Перехваты.**

*Перехваты, обеспечивающие создание/жизненный цикл окон (`ver >= 8.3.12`):*
- **`trFrameViewActivate`** — `TrapVirtualStdCall` на виртуальный метод **конкретного объекта** `IFramedView` (слот `IFramedView_onActivate`, берётся QI от `ted`), хук `TextWnd_Activate(view, action, otherView)` (textwnd.as:455-473): при `atDeactivate` — `activeTextWnd.onDeactivate()`, `activeTextWnd = null`; при `atActivate` — поиск `TextWnd` через `textDocStorage.find(wv.hwnd())` и `activeTextWnd.onActivate()`. Оригинал вызывается всегда. Ставится в конструкторе `TextWnd` (textwnd.as:514-517).
- **`trWindowDetach`** — `TrapSwap` на `wbase83.dll` `Window::detach` (x86 `?detach@Window@wbase@@QAEXXZ`, x64 `QEAAXXZ`, `asCALL_THISCALL`), хук `Window_DetachTrap(HWND)` (textwnd.as:475-488): после оригинала находит `TextWnd` по хэндлу и вызывает `tw.onDestroy()` — освобождение ресурсов при разрушении окна.
- **`trDispatchMsg`** — `TrapSwap` на `wbase83.dll` `dispatch_msg` (x86 `?dispatch_msg@wbase@@YAXABUtagMSG@@PAVIMsgDispHook@1@@Z`, x64 `AEBUtagMSG@@PEAVIMsgDispHook@1@@Z`, `asCALL_CDECL`), хук `DispatchMessagesTrap(MSG&, int_ptr)` (textwnd.as:394-453) — центральный маршрутизатор ввода:
  1. пока открыт диалог «Методы модуля» (`methodsDialog !is null && methodsDialog.opened`, textwnd.as:398; глобальная из `mlist.as:315`) — клавиши и клики принадлежат диалогу, всё уходит в оригинал;
  2. при активном текстовом окне для `WM_KEYDOWN/WM_KEYUP/WM_SYSKEYDOWN/WM_SYSKEYUP/WM_CHAR` вызывается `activeTextWnd.editor.dispatchMessage(msg, p1)`; при `WM_KEYDOWN` пишется diag-лог `"key"` (состояние снегопатовского списка: `getIntelliSite().isActive()`); если сообщение обработано — выход без оригинала;
  3. клавиши вне текстового окна логируются для диагностики «горячая клавиша не сработала» (textwnd.as:417-419);
  4. далее (для `activeTextWnd !is null`): `WM_KEYDOWN/WM_SYSKEYDOWN` → `activeTextWnd.onKeyDown(w, l)` — при true выход; `WM_CHAR` → если список снегопата активен (`getIntelliSite().isActive()`), символ уходит в оригинал без хуков; иначе `beforeChar(w)`: true — выход; иначе оригинал + `afterChar(w)`; `WM_LBUTTONDOWN` → оригинал + `afterClick()`; `WM_RBUTTONDOWN/WM_RBUTTONUP` → `onContextMenu(msg.message == WM_RBUTTONUP)` — при true выход.

*Ловушки изменений текста документа (ставятся менеджером подписок):*
- **`trSetSelText`** — `TrapSwap` на `TextManager::setSelectText` (core82/core83.dll; до 8.3.11 `?setSelectText@TextManager@core@@QAEXPB_W_N@Z`, после — `PB_S`), хук `setSelectText_trap(tm, pText, b)` (textwnd.as:955-960): `notifyTextChange(tm, stringFromAddress(pText))`, затем оригинал.
- **`trClearTextSel`** — `TextManager::clearTextSelection` (`?clearTextSelection@TextManager@core@@QAEXXZ`), хук `clearTextSelection_trap(tm)` (textwnd.as:962-967): `notifyTextChange(tm, string())`, затем оригинал.
- `notifyTextChange(tm, text)` (textwnd.as:940-953): берёт подписчиков `_getTextChangeSubscribers(tm)`, читает `tm.getSelectRange(t1, t2)`; пропускает тривиальный случай (`t1 == t2 && text.isEmpty()`); каждому — `onTextModified(tm, t1, t2, text)` с замером времени.
- Инициализация/выключение: `initTextModifiedTraps()` (textwnd.as:906-923), `disableTextModifiedTrap()` (textwnd.as:925-930).

*Ловушки выделения в редакторе (vtable `ITextEditor`; в текущем коде автоматически не ставятся — вызов закомментирован):*
- **`trSSN`** — слот `ITextEditor_setSelectionNull`, хук `setSelectionNull_trap(pEd)` (textwnd.as:985-990): оригинал + `notifyChangeSelection(pEd)`.
- **`trSCP`** — слот `ITextEditor_setCaretPosition`, хук `setCaretPosition_trap(pEd, tp, bInScreenCoords)` (textwnd.as:993-999): оригинал + `notifyChangeSelection`.
- **`trSTCP`** — слот `ITextEditor_scrollToCaretPos`, хук `scrollToCaretPos_trap(pEd)` (textwnd.as:1009-1018): оригинал + каждому подписчику `onScrollToCaretPos(pEd)`.
- **`trSS`** — слот `ITextEditor_setSelection`, хук `setSelection_trap(pEd, tpStart, tpStop, bCaretToStart, bInScreenCoords)` (textwnd.as:1002-1007): оригинал + `notifyChangeSelection`.
- **`trGetListPos`** — `TrapVirtualStdCall` на **`ITEIntelliSence`** слот `ITEIntelliSence_getContextListPos`, хук `getContextListPos_trap(teis, caretPos, lineHeight)` (textwnd.as:1021-1035): получает `ITextEditor` от списка (`teis.unk`) и спрашивает каждого `SelectionChangedReceiver.getCaretPosForIS(...)`; первый, кто вернул `true`, задаёт позицию (так альтернативный редактор указывает, где показать штатный список подсказки 1С); иначе — оригинал.
- `initSelChangeTrap(ted)` (textwnd.as:878-895): ставит все пять ловушек; для `ITEIntelliSence` — с защитой: `if (teis !is null) // вылетает в окне сравнения модулей` (textwnd.as:884-886). `disableSelChangeTrap()` (textwnd.as:897-904). Установка вызывалась бы из `_subscribeToSelChange`, но строка закомментирована (textwnd.as:758).
- `notifyChangeSelection(ted)` (textwnd.as:969-981): `ted.getSelection(t1, t2)`, каждому подписчику `onSelectionChanged(ted, t1, t2)` с замером времени.

*Диагностика медленных подписчиков:* `const uint SLOW_SUBSCRIBER_MS = 20`; `logSubscriber(what, idx, count, ms)` (textwnd.as:932-938) — каждое нажатие клавиши проходит через подписчиков (скрипты-аддины), поэтому всё, что дольше 20 мс, попадает в журнал (`diagAlways("slow", "ПОДПИСЧИК МЕДЛЕННО: …")`).

**Используемые API.** Платформа: `IWindowView`, `IControlDesign` (`getMode`, `ctrlRunning`), `IFramedView`, `ITextEditor` (`getSelection`, `setSelectionText`, `setCaretPosition`, `scrollToCaretPos`, `getITextManager`), `ITextManager`, `TextManager` (`getLineFast`, `getCashObject`, `getSelectRange`, `setSelectText`, `clearTextSelection`, `onTextAreaModified`, `onSelectionRecalculateFinished`), `ITextManager_Operations` (`getExtenderCLSID`, `updateAllViews`), `ITextParserCache.clearCache`, `ITxtEdtExtender`, `ISettingsConsumer`, `IAssistantData` (`object`, `extObject`, `propUuid`), `IMDObject`/`IMDContainer`, `ITEIntelliSence`, `ITxtEdtOptions`, `getTxtEdtService()`, `getMDObjectWrapper`, `currentProcess().createByClsid`, GUID-константы `gTextExtModule`, `gTextExtModule1`, `IID_IAssistantData`, `IID_NULL`, `ModuleTxtExtSettingsMap` (v8api/text.v:282-299). Перехваты: `TrapVirtualStdCall.setTrap/setTrapByName/getOriginal/swap`, `TrapSwap`. Память: `mem::int_ptr`, `toGuid`, `toIUnknown`, `toITextEditor`, `stringFromAddress`, `dumpVtable`. WinAPI: `SendMessage`, `GetKeyState`, `CreateCaret`, `ShowCaret`, `MSG`/`WM_*`. Сабклассинг (нативный): `attachWndToFunction`, `WndFunc`, `ASWnd.doDefault` (для `ver < 8.3.12`). Движок: `oneDesigner._fireCreateTextWindow`, `oneAddinMgr.byUniqueName(...).invokeMacros`, `sendCommandToMainFrame(CommandID(cmdFrameGroup, 324))`, `editorsManager`, `idleHandlers`/`PVV` (mainframe.as:154, exitApp.as:12), диагностика `dbgLog`, `diag`, `diagAlways`, `diagTraceOn("vt")`, `dbgHex`.

**Взаимодействия.** Принимает от `main.as` вызовы `onCreateTextWnd` (main.as:194,208), `changeTextExtender` (main.as:234), `disableTextWork`/`enableTextWork` (main.as:87,134). Отдаёт: `activeTextWnd`, `textDocStorage`, `getHwnd`, `insertInSelection` — интеллисенсу (`intellisite.as`); `TextProcessor`/`createTextProcessor` — `ModuleTextProcessor.as` (его и возвращает для модульных текстов); `getComWrapper()` — `com_textwindow.as` (строит `ITextWindow` над `TextWnd`); базовые классы `EditorInfo`/`TextEditorDocument`/`TextEditorWindow` и `EditorsManager` — реализациям редакторов `colorer.as` (пакт `piScintilla` регистрирует `ScintillaInfo`, colorer.as:13) и `synedit.as`; `methodsDialog` (mlist.as:315) опрашивается в `DispatchMessagesTrap`; `notifyTextAreaModified`/`onChangeTextManager` — событие аддинам (само определено в synedit.as:491). Класс `Selection` из `com_textwindow.as:10` используется в `textAreaModified_trap`.

**Версионные ветки.**
- `ver >= 8.3.12` (новая оконная система wbase): проверка `IFramedView` в `onCreateTextWnd` (textwnd.as:189-194), `wnd.parent = parent` (textwnd.as:196-198), `getHwnd` → `hRealMainWnd` (textwnd.as:385-389), все три ловушки окна (dispatch/detach/activate, textwnd.as:391-535), поле `TextWnd.parent`; для окон старше 8.3.12 — сабклассинг через `ASWnd` и `WndProc` (textwnd.as:493-494, 510-512, 542-580).
- `ver > 8.3.12`: `TextDocStorage.find(HWND)` (textwnd.as:165-178).
- `ver < 8.3.11` / `#else`: два разных макета памяти карты настроек расширителя в `setTextExtenderType` (textwnd.as:318-337); декорированное имя `setSelectText` (`PB_W` vs `PB_S`, textwnd.as:913-917).
- `ver < 8.3` / `#else`: dll `core82.dll`/`core83.dll` в `initTextModifiedTraps` (textwnd.as:908-912).
- `x86`/x64: декорированные имена `detach` и `dispatch_msg` (textwnd.as:520-534).

**Особенности.**
- `onCreateTextWnd` (textwnd.as:182-219) подробно: логирует вход (`dbgLog`); для окон-контролов (`bControl`) получает `IControlDesign` и выходит, если `getMode() != ctrlRunning` («с контролами на формах не работаем», textwnd.as:184-188); для `ver >= 8.3.12` требует ненулевой QI `IFramedView` (textwnd.as:190-193); создаёт `TextWnd(pWnd, bControl)`; получает `ITextManager` (`wnd.ted.getITextManager(itm)`); находит `TextDoc` в `textDocStorage` или создаёт новый (`tdoc.itm`, `tdoc.tm = itm.getTextManager()`, чтение текущего CLSID расширителя через `ITextManager_Operations.getExtenderCLSID` и `tdoc.setTextExtenderType(...)`); `tdoc.attachView(wnd)`; уведомление аддинов — `oneDesigner._fireCreateTextWindow(wnd)` (textwnd.as:217-218).
- Смешанная техника перехвата: vtable-ловушки на конкретных COM-объектах (`setTrap` по слоту интерфейса) и ловушки по декорированным именам экспорта dll (`setTrapByName`) — вплоть до обхода приватных структур в памяти (`setTextExtenderType`) и вызова чужой оконной процедуры по адресу (synedit).
- Один `TextDoc` — много окон (`views`); смена типа текста пересоздаёт и процессор, и редакторский документ во всех окнах сразу.
- Идентичность объектов отслеживается по `.self` (`UintMap`) или оператору `is` — скриптовые «указатели».
- Риски: жёсткие смещения `ModuleTxtExtSettingsMap` (таблица по версиям в v8api/text.v:282-299), обход списков в памяти, закомментированные vtable-ловушки выделения (функциональность частично «спит»), жёсткая высота строки подсказки, зависимость от недокументированных декорированных имён платформы.

---

## Связи внутри группы и с движком

### Цепочка создания текстового окна (main.as → textwnd.as → …)

1. **main.as: `run()` → `setTextHooks()`** — при старте (вызов из нативного snegopat.dll на окне заставки 1С) создаются пробные объекты и ставятся ловушки создания:
   - `CLSID_TxtEdtCtrl` + `IID_IWindowView` → `trTxtEdtCtrl_createWnd.setTrap(&&wnd, IWindowView_createWindow, TxtEdtCtrl_createWindow)` (main.as:92-100);
   - `CLSID_TxtEdtDoc` + `IID_IDocument` → `trTxtEdtDoc_createView.setTrap(&&doc, IDocument_createView, TxtDoc_createView)` — нужен, чтобы единожды получить готовый объект `TxtEdtView` и повесить `trTxtEdtView_createWnd` на его `IWindowView_createWindow` (main.as:109-123), плюс `trTxtEdtCommand_onExecute` на `ICommandTarget_onExecute` (main.as:148-154).
2. **Платформа создаёт окно редактора** → хуки `TxtEdtCtrl_createWindow`/`TxtEdtView_createWindow` вызывают **`onCreateTextWnd(view, true/false, parentWindow)`** (main.as:194, 208).
3. **textwnd.as: `onCreateTextWnd`** (textwnd.as:182) — фильтры (контролы в режиме дизайна; `IFramedView` при `ver >= 8.3.12`) → создание `TextWnd` (при `ver >= 8.3.12` в его конструкторе ставятся ловушки `IFramedView_onActivate`, `Window::detach`, `wbase::dispatch_msg`) → поиск/создание **`TextDoc`** в `textDocStorage` (`ITextManager` → `TextManager` → CLSID расширителя → `setTextExtenderType`) → `tdoc.attachView(wnd)`.
4. **`TextDoc.setTextExtenderType`** (textwnd.as:308): извлечение `IAssistantData` из карты настроек расширителя → `TextDocMdInfo`; **`createTextProcessor(g)`** (textwnd.as:115) — `ModuleTextProcessor` для модульных текстов (интеллисенс, SmartBox, подсветка), иначе `EmptyTextProcessor`; **`editorsManager._createEditor(g)`** (textwnd.as:738) — по карте `editorForExtGuids` выбирается зарегистрированный альтернативный редактор (`ScintillaInfo` из `colorer.as:13` — пакт `piScintilla`, или `SynEditInfo` из `synedit.as` при включённом пакте; иначе базовый `TextEditorDocument`); затем для каждого окна — `editorDoc.createEditor()` + `editor.attach(wnd)`.
5. **Уведомление аддинов**: `oneDesigner._fireCreateTextWindow(wnd)` (textwnd.as:218); SynEdit-редактор дополнительно шлёт `"SynEditcreateTextWindow"` (synedit.as:222).
6. **Смена типа текста** в редакторе → ловушка `main.as:234` → **`changeTextExtender`** (textwnd.as:223) → `TextDoc.setTextExtenderType` — пересоздание процессора и редактора.
7. **Ввод пользователя** (при `ver >= 8.3.12`): `wbase::dispatch_msg` → `DispatchMessagesTrap` (textwnd.as:394) → `activeTextWnd.editor.dispatchMessage` (фильтр SynEdit) → `TextWnd.onKeyDown/beforeChar/afterChar/afterClick/onContextMenu` → **`TextProcessor`** (`ModuleTextProcessor` — интеллисенс, автодополнение, SmartBox, Ctrl+клик «Перейти к определению»).
8. **Активация/деактивация окна**: `IFramedView_onActivate` → `TextWnd_Activate` → `activeTextWnd` (textwnd.as:457-473); до 8.3.12 — `WM_SETFOCUS`/`WM_KILLFOCUS` в `WndProc`.
9. **Закрытие окна**: `wbase Window::detach` → `Window_DetachTrap` → `TextWnd.onDestroy()` → `editor.onDestroy()` → `TextDoc.detachView()`; при последнем окне — отвязка процессора, `TextDocMdInfo.detach`, `editorDoc.detach`, удаление из `textDocStorage`. До 8.3.12 — `WM_DESTROY` в `WndProc`.
10. **Изменения текста**: `TextManager::onTextAreaModified` → `textAreaModified_trap` (synedit.as:483) → событие `"onChangeTextManager"` аддинам; программные правки (`setSelectText`/`clearTextSelection`) → `notifyTextChange` (textwnd.as:940) → `TextModifiedReceiver.onTextModified` (например, `SynEditDocument.onTextModified`, synedit.as:193).

### Матрица зависимостей группы

- **lexer.as** ← `ModuleTextProcessor` (метод `getMethodText` для контекста парсинга, ModuleTextProcessor.as:380), `com_snegopat` (`parseSources` → `IV8Lexer`), `sqlcolors` (`isLineEndWithOpenQuote`), `scriptLoader` (`readTextFile`), `settings_store`/`diag` (`readUtf8File`), `textwnd` (регэксп `indentRex` в `insertInSelection`).
- **textwnd.as** ← `main.as` (хуки создания окон и смены расширителя, вкл/выкл обработки текста), `intellisite` (`insertInSelection`, `getHwnd`, `activeTextWnd`), `ModuleTextProcessor` (реализует `TextProcessor`, использует `insertInSelection`), `com_textwindow` (`getComWrapper` → `ITextWindow`; класс `Selection`), `mlist` (глобальная `methodsDialog` в `DispatchMessagesTrap`), `colorer`/`synedit` (реализации `EditorInfo`/`TextEditorDocument`/`TextEditorWindow` поверх менеджера).
- **synedit.as** ← `textwnd.as` (базовые классы, `activeTextWnd`, `getHwnd`, `textDocStorage`, `hRealMainWnd`), `intellisite` (`getIntelliSite` в `showSmartBox`), `ModuleTextProcessor` (`tp.activate`), внешняя dll `SynEditV8.dll`; опирается на ловушки `TextManager`/`BaseWindow`/`wbase`, дублируя часть схемы textwnd для новой оконной системы 8.3.12+.

### Замечание о ловушках в группе

В группе сосуществуют три механизма внедрения: (1) vtable-ловушки на конкретных COM-объектах (`TrapVirtualStdCall.setTrap` — слоты `IWindowView_createWindow`, `IDocument_createView`, `ICommandTarget_onExecute`, `IFramedView_onActivate`, `ITextEditor_*`, `ITEIntelliSence_getContextListPos`); (2) ловушки по экспортным именам (`TrapSwap.setTrapByName` — `TextManager::onTextAreaModified/onSelectionRecalculateFinished/setSelectText/clearTextSelection`, `wbase::set_focus/get_focus/dispatch_msg`, `BaseWindow::reposition/SetCaretPos/detach`); (3) сабклассинг окон (`attachWndToFunction`, до 8.3.12) и вызов нативной оконной процедуры по адресу (`initFuncDefFromAddress` в synedit). Включение/выключение — через состояния `trapNotActive/trapEnabled/trapDisabled` и метод `swap()`, оригинал всегда вызывается через `getOriginal` + двойной `swap`.
