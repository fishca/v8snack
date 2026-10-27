# Раскраска кода: colorer.as и sqlcolors.as

Группа файлов движка «Снегопата» (папка `snegopat-client/x64/modules/snegopat/engine/`), отвечающая за альтернативный текстовый редактор модулей на базе Scintilla и за раскраску многострочных строк в цвета языка запросов. Документация составлена по исходникам AngelScript; номера строк указаны как `файл:строка`.

Ключевая архитектурная мысль группы:

- **colorer.as** — это не «раскраска» в узком смысле, а **полноценная замена штатного редактора модулей Конфигуратора на Scintilla** (через механизм альтернативных редакторов `EditorInfo`/`TextEditorDocument`/`TextEditorWindow` из `textwnd.as`), вместе с собственной раскраской (лексер `lex_provider` + стили Scintilla), свёрткой блоков (`FoldingProcessor`), точками останова, закладками, стрелкой отладчика, автопереводом строки, подсветкой парной скобки и выделенного слова, маркерами изменённых строк.
- **sqlcolors.as** — перехват штатного механизма раскраски строк платформы (`ITextExtColors.getColors` и `ITextExtBackColors`): группирующие комментарии `//{ //}` / `#Удаление` / `#Вставка`, разбор строковых констант «языком запросов» (раскраска содержимого строк-запросов и фон многострочных литералов), плюс настраиваемая свёртка многострочных литералов. На x64 перехват выполняется «нативными воротами» (`snegopat_colors.dll` / `snegopat_colors85.dll`, см. `v8api/colors_gate.v`), чтобы не пускать фоновый поток редактора в скриптовый движок Core.As.

---

## colorer.as (3882 строк)

**Назначение.** Внедрение текстового редактора «Scintilla» (SciLexer.dll, http://www.scintilla.org) в окна редактирования модулей Конфигуратора вместо штатного редактора 1С (заголовок файла, colorer.as:1-5). Файл реализует: регистрацию альтернативного редактора в `editorsManager`, создание и субклассирование окон, полный цикл раскраски кода «Встроенного языка» собственным лексическим проходом (`stylishText`, colorer.as:1910), вычисление уровней свёртки (`FoldingProcessor`, colorer.as:2156), работу с маркерами (точки останова, закладки, стрелка отладчика, изменённые строки), двустороннюю синхронизацию выделения/текста/каретки между Scintilla и штатным текстовым менеджером платформы (`TextManager`/`ITextEditor`), автоперевод строки (автоотступ), подсветку парной скобки и всех вхождений выделенного слова. Весь файл обёрнут в препроцессорную проверку `#if ver < 8.3.12` (colorer.as:11 … `#endif` на colorer.as:3882) — то есть компилируется **только для платформ младше 8.3.12**; на 8.3.12+ содержимое файла полностью вырезается, и используется штатный редактор с перехватами из других файлов.

**Инициализация.**

- Пакет: `Packet piScintilla("scintilla", function() { editorsManager._registerEditor(ScintillaInfo()); return true; }, piOnMainEnter);` (colorer.as:13). Имя пакета `scintilla`, уровень `piOnMainEnter` (при входе в главное меню), зависимостей нет. Регистрирует описание редактора `ScintillaInfo` в менеджере редакторов.
- Глобальные объекты/переменные:
  - `int_ptr hSciDll = 0;` — хэндл загруженной SciLexer.dll (colorer.as:15);
  - `funcdef LRESULT ScintillaFunc(int_ptr, uint, WPARAM, LPARAM);` и `ScintillaFunc&& sciFunc;` — прямой указатель на `Scintilla_DirectFunction` (colorer.as:16-17);
  - `typedef uint color;`, `color clrNone = color(-1);`, функция `rgb(r,g,b)` (colorer.as:19-24);
  - `ScintillaDesignerEventsHandler oneSciEventsHandler;` и `IDispatch&& sciEventsHandlerDisp;` (colorer.as:81-82) — обработчик команд Конфигуратора и его IDispatch-обёртка;
  - `NoCaseMap<BreakPointDef> breakpoints;` — глобальная карта точек останова, ключ `<guid объекта метаданных><guid свойства><номер строки>` (colorer.as:83);
  - `NoCaseMap<uint> bookmarks;` — закладки, тот же ключ → номер строки (colorer.as:84);
  - `array<ScintillaEditor&&> openedSciEditors;` — все открытые Scintilla-редакторы (colorer.as:85);
  - `ScintillaEditor&& lastActiveScintillaEditor = null;` — последний редактор, потерявший фокус (нужен для команд тулбара, colorer.as:86);
  - `ScintillaSetup sciSetup;` (colorer.as:1261) — глобальная конфигурация стилей и параметров редактора, экспортируется наружу как COM-объект;
  - `ScintillaInternalAddin oneSciAddin;` (colorer.as:586) — встроенный аддин-обёртка;
  - `int_ptr enumFontCallback = 0;` — кэш thunk-а для колбэка перечисления шрифтов (colorer.as:2325);
  - массивы XPM-иконок маркеров: `xpm_breakpoint`, `xpm_breakpoint_disabled`, `xpm_breakpoint_condition`, `xpm_debug_arrow`, `xpm_bookmark` (colorer.as:2355-2729).
- Объекты `OptionsEntry` — в этом файле **нет**: настройки редактора (шрифты/цвета/поведение) читает внешний JS-аддин `script:<core>scripts\scintilla.js`, который через COM-объект `sciSetup` (аддин `scintilla_int`) вызывает `setStyle` и другие методы (см. `ScintillaInfo.activate`, colorer.as:428-436). Точки останова и закладки читаются из профиля Конфигуратора (`Debug/Breakpoints`, `Debug/Bookmarks`), а не из настроек Снегопата.

### Типы colorer.as

#### Перечисления

- `enum SciMarkers` (colorer.as:26-35) — номера маркеров Scintilla: `markBookmark` (0, закладка), `markBreakPoint` (1), `markBreakPointConditional` (2), `markBreakPointDisabled` (3), `markDebugArrow` (4), `markModifiedLine` (5, изменённая строка), `markModifiedLineSaved` (6, изменённая и сохранённая).
- `enum SciMargins` (colorer.as:39-43) — номера полей: `smLineNumbers` = 0, `smMarks` = 1, `smFolding` = 2.
- `enum SciIndicators` (colorer.as:45-48) — индикаторы: `indFolding = INDIC_CONTAINER` (подсветка заголовка свёрнутого блока), `indSelectedWordHighlight` (подсветка вхождений выделенного слова).
- `enum SciStyles` (colorer.as:50-64) — стили раскраски, начиная с `STYLE_LASTPREDEFINED + 1`: `stKeyword`, `stNumber`, `stString`, `stDate`, `stIdentifier`, `stOperator`, `stRemark`, `stPreproc`, `stLabel`, `stDirective`, `stPairedBrace`, `stCurrentLine`, `stSelectionHighlight`.
- `enum SciLineStates` (colorer.as:66-78) — битовые состояния строк (хранятся в SCI line state, используются для свёртки): `LS_CUSTOMBLOCK = 1`, `LS_COMMENTLINE = 2`, `LS_METHOD = 4`, `LS_CONDITION = 8`, `LS_LOOP = 16`, `LS_METHODBODY = 32`, `LS_SUBCONDITION = 64`, `LS_CUSTOMBLOCKEND = 128`, `LS_MULTILINESTRING = 256`, `LS_TRY = 512`, `LS_PREPROC = 1024`.
- `enum SciEnums` (colorer.as:2732-3881) — монолитная таблица всех констант Scintilla: номера сообщений `SCI_*`, стили `STYLE_*`, символы маркеров `SC_MARK_*`, номера фолдинга `SC_MARKNUM_*` и `SC_MASK_FOLDERS`, поля `SC_MARGIN_*`, уровни `SC_FOLDLEVEL*`/`SC_FOLDACTION_*`/`SC_FOLDFLAG_*`, индикаторы `INDIC_*`, флаги поиска `SCFIND_*`, флаги модификаций `SC_MOD_*`/`SC_UPDATE_*`, уведомления `SCN_*`, технологии рендера `SC_TECHNOLOGY_*`, лексеры `SCLEX_*` и т.д. Используется повсеместно вместо «магических чисел».

#### class BreakPointDef (colorer.as:88-96)

Описание точки останова. Поля: `uint line` (номер строки модуля, **с 1**), `bool isEnabled` (включена/отключена), `bool isCondition` (условная/обычная). Конструкторы: пустой и `BreakPointDef(uint _line, bool _isEnabled, bool _isCondition)`.

#### function activeScintillaEditor() (colorer.as:98-101)

`ScintillaEditor&& activeScintillaEditor()` — возвращает `cast<ScintillaEditor>(activeTextWnd.editor)`, если есть активное текстовое окно, иначе null. Используется всеми обработчиками команд.

#### class ScintillaDesignerEventsHandler (colorer.as:103-403)

Приёмник событий команд Конфигуратора и отладчика; в конструкторе создаёт свой IDispatch (`createDispatchFromAS(&&this)`), через который подключается к `oneDesigner._events`. Поля-флаги: `bool commandCancelled` (команда была отменена), `bool toggleAllBreakpointsState`, `bool breakPointConditionIsEmpty`, `bool debugMode` (сейчас идёт сеанс отладки), `bool afterDebugStep` (только что выполнен шаг), `bool debugStopProcessed` (останов в точке уже отмечен).

Методы (все — обработчики команд, `CmdHandlerParam& cmd, array<Variant>& params`; различают `_isBefore`):

- `OnToggleBreakPoint` (colorer.as:113-130) — по завершении команды «точка останова уст/снять» (GUID `{DE680E96-5826-4E22-834D-692E307A1D9C}`, номер 11): удаляет все брейкпоинт-маркеры с текущей строки, смотрит состояние штатной команды 13 («отключить точку»): если она доступна — на строке есть точка, ставит `markBreakPoint` и вносит запись в `breakpoints` (`breakPointKey + (curSciLine+1)`), иначе удаляет запись.
- `OnDeleteAllBreakPoints` (colorer.as:132-143) — команда 14: у всех открытых редакторов удаляет маркеры трёх типов, очищает `breakpoints`.
- `OnToggleBreakPointState` (colorer.as:145-166) — команда 13: переключает `isEnabled` у точки на текущей строке; выбирает маркер `markBreakPointDisabled` / `markBreakPoint` / `markBreakPointConditional` и перерисовывает.
- `OnToggleAllBreakPointsState` (colorer.as:168-181) — команда 15: всем точкам в `breakpoints` ставит `isEnabled = toggleAllBreakpointsState`, вызывает `updateBreakPoints()` у всех редакторов, инвертирует флаг.
- `OnToggleBreakPointCondition` (colorer.as:183-201) — команда 12: перед командой подключается к событию `onDoModal` (`oneDesigner._events.connect(dspWindows, ...)`) для перехвата диалога «Условие останова»; после — по `breakPointConditionIsEmpty` ставит обычную или условную точку, учитывая `isEnabled`.
- `OnToggleBookmark` (colorer.as:203-215) — команда 1 GUID `{FFE26CB2-322B-11D5-B096-008048DA0765}` (закладка уст/снять): по биту `markerGet & (1 << markBookmark)` удаляет/добавляет маркер и запись в `bookmarks`.
- `OnDeleteAllBookmarks` (colorer.as:217-226) — команда 4 того же GUID: удаляет все закладки.
- `OnDebugStep` (colorer.as:228-237) — команды 6-10 (`шагнуть в/через/из`, `идти до курсора`, `текущая строка`): ставит `afterDebugStep = true`, сбрасывает `debugStopProcessed`, позиционирует каретку Scintilla на позицию штатного редактора (`getPosition(tpCaret)`).
- `OnDebugContinue` (colorer.as:239-244) — команда 2 «продолжить»: сбрасывает `debugStopProcessed`, убирает стрелку отладчика во всех редакторах.
- `OnGotoDefinition` (colorer.as:246-258) — команды 21/83 GUID `{6B7291BF-BCD2-41AF-BAC7-414D47CC6E6A}`: если есть выделение и его первая строка выше видимой — скроллит редактор (`SCI_LINESCROLL`), чтобы сохранить видимость при прыжке.
- `OnGlobalSearch` (colorer.as:260-273) — команды 68/69 GUID `{00000000-...}`: трюк с фокусом — перед командой устанавливает фокус на `txtWnd.hWnd` (`needFocus = true`), чтобы штатный поиск подхватил выделенный в модуле текст, после команды возвращает фокус в Scintilla.
- `OnWindowsMessageBox(IMsgBoxHook&, array<Variant>&)` (colorer.as:276) — пустой заглушечный обработчик.
- `OnWindowsDoModal(IDoModalHook& dlgInfo, ...)` (colorer.as:278-300) — анализ закрытого диалога «Условие останова»: при `dlgInfo.result == 2` — отмена (`commandCancelled = true`), иначе читает контрол формы (`form.getControl`, `control.get_value()`), при пустом тексте условия ставит `breakPointConditionIsEmpty = true`.
- `clearDebugArrowInAllScintillaEditors()` (colorer.as:302-308) — `markerDeleteAll(markDebugArrow)` у всех открытых редакторов.
- `OnIdle(array<Variant>&)` (colorer.as:310-348) — подписан на `onIdle` дизайнера: по доступности команды 4 GUID отладчика («Завершить отладку») определяет вход/выход из режима отладки; в режиме отладки следит за доступностью команды 10 («Текущая строка») — при останове ставит `markerAdd(-1, markDebugArrow)`; при `afterDebugStep` — убирает стрелку везде, позиционирует каретку и рисует стрелку заново.
- `OnFoldUnfold` (colorer.as:350-376) — команды 101-106 GUID `{00000000-...}`: маппинг на `foldUnfoldAll(true/false)` и `foldUnfoldCurrent(fold, withChilds)` (105/106 — все, 103/104 — группа, 102/101 — группа с вложенными).
- `OnMetaDataEvent(IV8MetaDataEvent&& mde)` (colorer.as:387-402) — вызывается из JS-аддина через `ScintillaSetup.callOnMetaDataEvent` (прямое подключение к `MetaDataEvent` через `connect` не сработало — см. закомментированный код colorer.as:378-388): при `mdeAfterSave` находит окна редакторов, принадлежащие сохранённому корневому объекту метаданных (`getComWrapper().get_mdObj()` → `get_container().get_rootObject()`, сравнение `isSame`) и вызывает `swnd.changeModifiedLineMarkers()`.

#### class ScintillaInfo : EditorInfo (colorer.as:405-584)

Описание альтернативного редактора (интерфейс `EditorInfo` из textwnd.as). Методы:

- `string name() override` — `"Scintilla"`.
- `string extention() override` — `"Встроенный язык"` (название расширения текста, для которого редактор применим).
- `array<string>&& extGuids() override` — `{ string(gTextExtModule), string(gTextExtModule1) }` — GUID расширений «Встроенный язык» платформы ({3FF80E32-…} и {24CE9616-…}, v8api/text.v:256-257).
- `void activate() override` (colorer.as:415-441) — однократная инициализация: `LoadLibraryEx(pathes._tools + "scilexer.dll", LOAD_WITH_ALTERED_SEARCH_PATH)`; `GetProcAddress(hSciDll, "Scintilla_DirectFunction")` → `initFuncDefFromAddress(ptr, &&sciFunc)`; при неудачах — `Message(...)`. Затем загружает скриптовый аддин настроек: `oneDesigner._addins.byUniqueName("scintilla")`, если нет — `loadAddin("script:<core>scripts\\scintilla.js", oneDesigner._addins._libs)` и вызов его макроса `_getSettings` (аддин читает настройки редактора и через COM-объект `sciSetup` задаёт стили). Далее `loadBreakPointsFromProfile()`, `loadBookmarksFromProfile()`, `connectEvents()`.
- `void doSetup() override` (colorer.as:442-448) — вызывает макрос `_setup` аддина `scintilla` (применение настроек к уже открытым окнам через `sciSetup.Preview`).
- `TextEditorDocument&& create() override` — создаёт `ScintillaDocument()`.
- `bool supportsNewWindowSystem()` — `false` (редактор не поддерживает систему «новых окон» платформы).
- `void connectEvents()` (colorer.as:456-489) — регистрирует ~20 обработчиков через `oneDesigner._events.addCommandHandler( GUID, номер, sciEventsHandlerDisp, "ИмяМетода" )`: точки останова (11-15), закладки (1, 4), шаги отладчика (6-10) и «продолжить» (2), список процедур/перейти к определению (21, 83), глобальный поиск/замена (68, 69), свёртка (101-106); плюс `oneDesigner._events.connect(oneDesigner._me(), "onIdle", ..., "OnIdle")`.
- `void loadBreakPointsFromProfile()` (colorer.as:491-538) — парсит значение профиля `getProfileRoot().getValue("Debug/Breakpoints", val)` — это сериализованный текст точек останова платформы. Формат: строки вида `{"",0},<guidObj>,<guidProp>,0}` (модули конфигурации) или `{"file://C:/...epf", 0},<guidObj>,<guidProp>,0}` (внешние обработки), затем строка количества `{N,`, затем N строк вида `{<строка>,<активность>,"<условие>",0,2},`. Ключ записи: `"{guidObj}{guidProp}<line>"` (GUID в нижнем регистре, конкатенация без разделителей).
- `void loadBookmarksFromProfile()` (colorer.as:540-582) — аналогичный парсер профиля `Debug/Bookmarks`, заполняет `bookmarks` (номер строки).

#### class ScintillaInternalAddin : BuiltinAddin (colorer.as:587-598)

Встроенный аддин `super("scintilla_int", "Внутренний аддин для scintilla", 0)`; метод `IUnknown&& object()` лениво создаёт `createDispatchFromAS(&&sciSetup)` — то есть **публикует глобальный `sciSetup` как COM-объект**, через который JS-аддин `scintilla.js` управляет стилями.

#### class ScintillaWindow (colorer.as:600-957)

Тонкая обёртка над окном элемента управления Scintilla. Поля: `HWND hEditor`, `int_ptr editor_ptr` (direct pointer).

- `void create(HWND hWndParent, uint dwStyle, uint dwExStyle = 0, uint ctrlId = 0, int X = 0, int Y = 0, int nWidth = 0, int nHeight = 0)` (colorer.as:604-607) — `CreateWindowEx` с классом `"Scintilla"` и hInstance = hSciDll, затем `SendMessage(hEditor, SCI_GETDIRECTPOINTER)`; прямой указатель запоминается для вызовов без сообщений.
- `void destroy()` — `DestroyWindow`.
- `LRESULT callSciMsg(uint msg, WPARAM w = 0, LPARAM l = 0)` — прямой вызов `sciFunc(editor_ptr, msg, w, l)` (минуя оконные сообщения).

Далее — обёртки SCI-сообщений (все через `callSciMsg`):

| Метод | Сообщение / поведение |
|---|---|
| `int length() const` | SCI_GETLENGTH — длина документа в байтах |
| `uint textHeight(int line = 0) const` | SCI_TEXTHEIGHT — высота строки в пикселях |
| `uint textWidth(const string& text, int styleIdx = STYLE_DEFAULT) const` | SCI_TEXTWIDTH — ширина текста (UTF-8), для расчёта ширины поля номеров строк |
| `void goToPos(int pos)` | SCI_GOTOPOS |
| `int xFromPos(int pos) const` / `int yFromPos(int pos) const` | SCI_POINTXFROMPOSITION / SCI_POINTYFROMPOSITION — экранные координаты позиции |
| `void setSelection(int from, int to)` | SCI_SETSEL |
| `void scrollToCaret()` | SCI_SCROLLCARET |
| `int anchorPos() const` / `void setAnchorPos(int pos)` | SCI_GETANCHOR / SCI_SETANCHOR |
| `int currentPos() const` / `void setCurrentPos(int pos)` | SCI_GETCURRENTPOS / SCI_SETCURRENTPOS |
| `void setModEventMask(uint mask)` | SCI_SETMODEVENTMASK |
| `void setLexer(int lexer)` | SCI_SETLEXER (используется SCLEX_CONTAINER) |
| `void setMarginType(int margin, int type)` | SCI_SETMARGINTYPEN |
| `void setMarginMask(int margin, uint set, uint reset = 0)` | читает SCI_GETMARGINMASKN, накладывает set/reset, пишет SCI_SETMARGINMASKN |
| `void setTechnology(int tech)` | SCI_SETTECHNOLOGY (DirectWrite) |
| `void setBufferedDraw(int flag)` | SCI_SETBUFFEREDDRAW |
| `void setStyleFont(int styleIdx, const string& fontName)` | SCI_STYLESETFONT (UTF-8) |
| `void setStyleSize(int styleIdx, int size)` | SCI_STYLESETSIZEFRACTIONAL (сотые доли пункта) |
| `void setStyleWeight(int styleIdx, int weight)` | SCI_STYLESETWEIGHT |
| `void setStyleUnderline(int styleIdx, int underline)` | SCI_STYLESETUNDERLINE |
| `void setStyleItalic(int styleIdx, int italic)` | SCI_STYLESETITALIC |
| `void setStyleEolFilled(int styleIdx, int eolfill)` | SCI_STYLESETEOLFILLED |
| `void setStyleFore(int styleIdx, color fore)` / `void setStyleBack(int styleIdx, color back)` | SCI_STYLESETFORE / SCI_STYLESETBACK |
| `void styleClearAll()` | SCI_STYLECLEARALL |
| `void setCaretWidth(int caretWidth)` | SCI_SETCARETWIDTH |
| `void setMarginWidth(int margin, int width)` | SCI_SETMARGINWIDTHN |
| `void setMarkerFore(int marker, color clr)` / `void setMarkerBack(int marker, color clr)` | SCI_MARKERSETFORE / SCI_MARKERSETBACK |
| `void setTabWidth(int tabWidth)` / `void setUseTabs(int flag)` / `void setIndentGuides(int flag)` | SCI_SETTABWIDTH / SCI_SETUSETABS / SCI_SETINDENTATIONGUIDES |
| `void insertText(int pos, int_ptr text)` | SCI_INSERTTEXT |
| `void replaceSel(int_ptr text)` | SCI_REPLACESEL |
| `void setCodePage(int cp)` | SCI_SETCODEPAGE (SC_CP_UTF8) |
| `void setText(int_ptr text)` | SCI_SETTEXT |
| `int_ptr docPointer()` / `void setDocPointer(int_ptr doc)` | SCI_GETDOCPOINTER / SCI_SETDOCPOINTER — общий документ между окнами |
| `int posFromLine(int line) const` / `int lineFromPos(int pos) const` | SCI_POSITIONFROMLINE / SCI_LINEFROMPOSITION |
| `int posEndStyled() const` | SCI_GETENDSTYLED — до какой позиции уже раскрашено |
| `int lineLength(int line) const` | SCI_LINELENGTH (с EOL) |
| `uint charAt(int pos) const` | SCI_GETCHARAT |
| `MemoryBuffer&& textRange(int from, int len) const` | SCI_GETTEXTRANGE через структуру `Sci_TextRange`; буфер `MemoryBuffer(len+1)` |
| `string text(int from, int len)` | `string(utf8string(textRange(...).bytes, len))` — чтение диапазона в AngelScript-строку |
| `void startStyling(int pos)` / `void setStyle(int len, int style)` | SCI_STARTSTYLING / SCI_SETSTYLING — «протяжка» стилей |
| `int lineFromMarkHandle(int_ptr markHandle) const` / `void deleteMarkHandle(int_ptr markHandle)` | SCI_MARKERLINEFROMHANDLE / SCI_MARKERDELETEHANDLE |
| `int_ptr markerAdd(int line, int marker)` | SCI_MARKERADD; при `line == -1` берётся текущая строка |
| `void defineMarker(int mark, int symbol)` | SCI_MARKERDEFINE |
| `void setFoldMarginColour(int useSettings, color clr)` | SCI_SETFOLDMARGINCOLOUR |
| `void setProperty(const string& name, const string& val)` | SCI_SETPROPERTY (например `fold=1`) |
| `void setAutoFold(int val)` | SCI_SETAUTOMATICFOLD |
| `void foldSetLevel(int line, int level)` / `int foldLevel(int line) const` | SCI_SETFOLDLEVEL / SCI_GETFOLDLEVEL |
| `void foldSetFlag(int flag)` | SCI_SETFOLDFLAGS |
| `void toggleFold(int line = -1, bool withChilds = false)` (colorer.as:800-813) | собственная реализация: `foldIsExpanded` → SCI_FOLDLINE/SCI_FOLDCHILDREN с `SC_FOLDACTION_CONTRACT`/`SC_FOLDACTION_EXPAND` (прямой SCI_TOGGLEFOLD закомментирован); при `line == -1` — текущая строка |
| `void foldExpandSet(int line, int expanded)` / `bool foldIsExpanded(int line)` | SCI_SETFOLDEXPANDED / SCI_GETFOLDEXPANDED |
| `void marginSetClickable(int margin, int clickable)` | SCI_SETMARGINSENSITIVEN |
| `void indStyleSet(int, int)` … `void indEnd(int indicator, int position)` (colorer.as:823-870) | серия обёрток индикаторов: SCI_INDICSETSTYLE, SCI_INDICSETFORE, SCI_INDICSETALPHA, SCI_INDICSETOUTLINEALPHA, SCI_INDICSETUNDER, SCI_INDICSETHOVERSTYLE, SCI_INDICSETHOVERFORE, SCI_INDICSETFLAGS, SCI_SETINDICATORCURRENT, SCI_SETINDICATORVALUE, SCI_INDICATORFILLRANGE, SCI_INDICATORCLEARRANGE, SCI_INDICATORALLONFOR, SCI_INDICATORVALUEAT, SCI_INDICATORSTART, SCI_INDICATOREND |
| `string lineOfText(int line)` (colorer.as:871-874) | читает строку через textRange, `fromUtf8`, `rtrim("\r\n")` |
| `int linesOnScreen()` / `int firstVisibleLine()` / `int docLineFromVisibleLine(int line)` / `int lineEndPosition(int line)` | SCI_LINESONSCREEN / SCI_GETFIRSTVISIBLELINE / SCI_DOCLINEFROMVISIBLE / SCI_GETLINEENDPOSITION |
| `int selectionStart()` / `int selectionEnd()` | SCI_GETSELECTIONSTART / SCI_GETSELECTIONEND |
| `int findText(int searchFlags, LPARAM textToFindStructPtr)` | SCI_FINDTEXT через структуру `Sci_TextToFind` |
| `bool isRangeWord(int start, int end)` | SCI_ISRANGEWORD |
| `void setUsePopup(int allowPopUp)` | SCI_USEPOPUP (отключён) |
| `int markerGet(int line)` / `void markerDelete(int line, int markerNumber)` / `void markerDeleteAll(int markerNumber)` | SCI_MARKERGET / SCI_MARKERDELETE (line == -1 → текущая) / SCI_MARKERDELETEALL |
| `int currentLine()` | `lineFromPos(currentPos())` |
| `void deleteAllBreakPointMarks(int line)` (colorer.as:915-919) | удаляет markBreakPoint, markBreakPointDisabled, markBreakPointConditional со строки |
| `void markerDefinePixMaps()` (colorer.as:920-926) | SCI_MARKERDEFINEPIXMAP для 5 маркеров; адрес XPM через `mem::addressOf(xpm_...[0])` |
| `void setLineState(int line, int state)` / `int getLineState(int line)` | SCI_SETLINESTATE / SCI_GETLINESTATE (line < 0 → 0) |
| `int getLineCount()` | SCI_GETLINECOUNT |
| `int getStyleAt(int pos)` | SCI_GETSTYLEAT |
| `void ensureLineVisible(int line = -1)` | SCI_ENSUREVISIBLE |
| `void changeModifiedLineMarkers()` (colorer.as:945-956) | цикл SCI_MARKERNEXT с маской `(1 << markModifiedLine)`: каждый маркер «изменена» заменяется на `markModifiedLineSaved` (используется после сохранения) |

#### class SciStyleDefinition (colorer.as:960-1016)

Описание одного стиля. Поля: `int _index` (номер стиля Scintilla), `string _name` (русское имя для аддина настроек), `string fontName` (пустое — унаследовать базовый), `int size` (сотые доли пункта, 0 — не задано), `int weight`, `int underline` (0 — не задано, 1 — нет, 2 — да), `int italic` (аналогично), `int eolfill`, `uint fore = uint(-1)`, `uint back = uint(-1)`. Конструкторы: `(idx, n)`, `(idx, n, uint f, uint b)`, `(idx, n, string fn, int s, uint f, uint b)`.

- `void _apply(ScintillaWindow& swnd, const NoCaseMap<int>& fonts)` (colorer.as:989-1015) — применение к окну: имя шрифта ищется в списке моноширинных шрифтов системы (`fonts`), перебором через `fontName + ",Courier"` с fallback на Courier; применяются только заданные атрибуты; булевы флаги передаются как `value - 1` (схема 0/1/2 → пропустить/0/1).

#### class ScintillaSetup (colorer.as:1018-1260, глобальный экземпляр `sciSetup`)

Центральная конфигурация редактора. В конструкторе (colorer.as:1022-1056) создаётся список стилей по умолчанию (имена русских подписей используются JS-аддином настроек):

| Стиль | Значение по умолчанию |
|---|---|
| `STYLE_DEFAULT` «Базовый стиль» | шрифт `Consolas,Courier New`, 1100 (11 пт), цвет фона 0xF0FBFF |
| `stKeyword` «Ключевые слова» | 0xA55104 |
| `stRemark` «Комментарии» | 0x008000 |
| `stNumber` «Числа» | 0x5a8809 |
| `stString` «Строки» | 0x1515a3 |
| `stDate` «Даты» | 0x5a8809 |
| `stIdentifier` «Идентификаторы» | 0x033E6B |
| `stOperator` «Операторы» | 0x050505 |
| `stPreproc` «Препроцессоры» | 0x0E4AAB |
| `stLabel` «Метка» | 0x09885a |
| `stDirective` «Директива» | 0x2E75D9 |
| `STYLE_BRACELIGHT` «Парная скобка» | фон rgb(155,155,255) |
| `STYLE_LINENUMBER` «Номера строк» | 900 (9 пт), 0xBBBBBB |
| `STYLE_INDENTGUIDE` «Линии выравнивания» | 0xCCCCCC |
| `stCurrentLine` «Цвет фона текущей линии» | 0xF7E8D7 |
| `stSelectionHighlight` «Цвет фона подсветки выделенного слова» | rgb(0,0,255) |

И заполняется карта `NoCaseMap<uint> stylesByName` — английские имена стилей для аддина: `default, keyword, comment, number, string, date, identifier, operator, preprocessor, label, directive, brace, linenumber, indentguide, currentline, selectionhighlight`.

Поля настроек (читаются аддином и меняются им): `uint caretWidth = 2`, `uint indentGuide = SC_IV_LOOKBOTH`, `bool highlightCurrentLine = true`, `bool showLineNumbers = true`, `int useTabs = 1`, `uint tabWidth = 4`, `bool useFolding = true`, `NoCaseMap<uint> stylesByName`, `color clrCurrentLine`, `color clrSelectedWordHighlight`, `bool highlightFoldHeader = false`; флаги автосворачивания: `foldComment = true`, `foldCond = false`, `foldLoop = false`, `foldMultiString = false`, `foldPreproc = false`, `foldProc = true`, `foldTry = false`.

Методы:

- `uint get_stylesCount() const`, `SciStyleDefinition&& style(uint idx) const`, `SciStyleDefinition&& styleByNum(int num) const`, `SciStyleDefinition&& styleByName(string name) const` (с `Message` об ошибке) — доступ к стилям; префикс `get_/style` нужен для IDispatch-экспорта.
- `void setStyle(string styleName, string name = "", int size = 0, bool bold = 0, bool italic = 0, bool underline = 0, int color = clrNone, int bgColor = clrNone)` (colorer.as:1097-1107) — главный метод настройки из JS: `size * 100`, `weight = bold ? SC_WEIGHT_SEMIBOLD : SC_WEIGHT_NORMAL`, `italic/underline = 2/1` (схема «задано»).
- `void callOnMetaDataEvent(IV8MetaDataEvent&& mde)` — мост к `oneSciEventsHandler.OnMetaDataEvent` (вызывается из JS-аддина).
- `void callOnFoldUnfold(bool fold)` (colorer.as:1111-1115) — синтезирует `CmdHandlerParam` команды 103/104 и вызывает `OnFoldUnfold` (мост от JS).
- `void callToggleFold(bool withChilds = false)`, `void callResetModifiedLineStates()`, `void callLineScroll(int cnt)`, `void callGotoModifiedLine(int direction = 1)` (colorer.as:1116-1135) — обёртки над методами активного `ScintillaEditor` для вызова из JS/макросов.
- `void _apply(ScintillaWindow& swnd)` (colorer.as:1137-1175) — применение всей конфигурации к окну: `enumMonoFonts` → `styleClearAll()` → применение каждого стиля; вычисление `clrCurrentLine`/`clrSelectedWordHighlight`; **автоотключение** подсветки текущей строки, если её цвет совпал с фоном редактора; `setStyleEolFilled(stString, 1)` (заливка фона строковых литералов до конца строки — основа «полос» многострочных строк); `SCI_SETEOLMODE = SC_EOL_LF`; ширина каретки; `_setupMarks`; номера строк и свёртка по флагам; ширина табуляции/табы/направляющие/отключение popup; настройка индикатора подсветки слова (`INDIC_ROUNDBOX`, цвет, альфа 125); `SCI_SETENDATLASTLINE`; включение подсветки текущей строки (`SCI_SETCARETLINEVISIBLE`, `SCI_SETCARETLINEBACK`).
- `void Preview(bool msg)` (colorer.as:1176-1186) — повторное применение `_apply` ко всем открытым редакторам (предпросмотр настроек); иначе `Message("Для предпросмотра откройте любое окно редактора модуля")`.
- `array<string>&& enumMonoSpaceFonts()` — отсортированный список моноширинных шрифтов (для выпадающего списка в настройках).
- `void _setupMarks(ScintillaWindow& swnd)` (colorer.as:1197-1207) — поле маркеров: `SC_MARGIN_SYMBOL`, ширина 24, маска «всё, кроме фолдинга», кликабельно, XPM-иконки; маркеры изменённых строк — `SC_MARK_LEFTRECT` (жёлтый/зелёный).
- `void _setupLineNumbers(...)` (colorer.as:1208-1211) — `SC_MARGIN_NUMBER`, ширина по `textWidth("_99999", STYLE_LINENUMBER)`.
- `void _setupFolding(...)` (colorer.as:1212-1258) — свойство `fold=1`, поле свёртки шириной 14 с маской `SC_MASK_FOLDERS`, кликабельно; индикатор `indFolding = INDIC_ROUNDBOX` цветом 0xBB0000; маркеры «Box tree»-темы (`SC_MARK_BOXMINUS/BOXPLUS/VLINE/LCORNER` + connected-варианты, таблица тем в комментарии colorer.as:1225-1235); цвета маркеров — серые линии на фоне базового стиля.

#### class ScintillaDocument : TextEditorDocument, TextModifiedReceiver (colorer.as:1264-1327)

Документ для одного `TextDoc` (текст менеджера платформы). Поля: `int_ptr sciDoc = 0` (указатель на Scintilla-документ, общий для всех окон одного модуля), `bool inTextModified` (защита от рекурсии).

- `void attach(TextDoc&& td)` / `void detach()` — плюс подписка `editorsManager._subscribeToTextChange(td.tm, this)` / отписка.
- `TextEditorWindow&& createEditor()` — создаёт `ScintillaEditor(this)`.
- `void onTextModified(TextManager& tm, const TextPosition& tpStart, const TextPosition& tpEnd, const string& newText)` (colorer.as:1279-1307) — отражение **программных** изменений текста (сделанных не через редактор, например скриптами Снегопата) в Scintilla: вставка (`insertText`) или замена выделения (`setAnchorPos`+`setCurrentPos`+`replaceSel`), перенос каретки и `SetCaretPos`, пометка затронутых строк маркером `markModifiedLine` (с удалением `markModifiedLineSaved`).
- `ScintillaEditor&& firstEditor()` (colorer.as:1308-1315) — редактор активного окна либо `owner.views[0].editor`.
- `void connect(ScintillaWindow&& swnd)` (colorer.as:1317-1326) — при первом подключении: `owner.tm.save(text)` → `setCodePage(SC_CP_UTF8)` → `setText(...)` → запоминает `sciDoc = docPointer()`; в следующие разы просто `setDocPointer(sciDoc)` — несколько окон одного документа разделяют содержимое (сценарий «окно модуля в нескольких видах»).

#### class ScintillaEditor : TextEditorWindow, SelectionChangedReceiver (colorer.as:1329-2154)

Главный класс — окно редактора. Поля: `ScintillaDocument&& owner`, `ASWnd&& wnd` (subclassed-окно), `ScintillaWindow swnd`, `bool inReflection` (блокировка взаимных отражений изменений), `int_ptr curLineMarkerHandle`, `bool selectedWordHighlighted`, `string breakPointKey`, `bool needFocus`, `bool inStylish` (защита реентерабельности раскраски).

Жизненный цикл и оконная обработка:

- `void attach(TextWnd&& tw) override` (colorer.as:1342-1364) — перехват родительских сообщений (`tw.wnd.setMessages({WM_SETFOCUS, WM_DESTROY, WM_SIZE, WM_NOTIFY, WM_NCCALCSIZE, WM_CHAR, WM_KEYDOWN, WM_SYSKEYDOWN, 0x0084, 0x0085})`); создание дочернего Scintilla (`WS_CHILD | WS_VISIBLE | WS_CLIPCHILDREN | WS_CLIPSIBLINGS`); если окно уже имеет размер — форс пересчёта (`SetWindowPos` c `SWP_FRAMECHANGED` + `onSizeParent`); `owner.connect(swnd)`; `breakPointKey = getBreakPointKey()`; `initWindowSettings()`; `stylishText(swnd.length())` — раскраска всего модуля; режим «только чтение» (`SCI_SETREADONLY`); субклассирование окна Scintilla через `attachWndToFunction(swnd.hEditor, WndFunc(this.wndProcScn), {WM_SETFOCUS, WM_KILLFOCUS, WM_CHAR, WM_KEYDOWN, WM_SYSKEYDOWN, WM_RBUTTONDOWN, WM_LBUTTONDOWN})`; подписка `editorsManager._subscribeToSelChange(tw.ted, this)`; добавление в `openedSciEditors`; `initialFolding()`.
- `void detach() override` (colorer.as:1366-1374) — восстановление сообщений, отписка, уничтожение окна, очистка `lastActiveScintillaEditor`, удаление из `openedSciEditors` (`findByRef`).
- `LRESULT wndProc(uint msg, WPARAM w, LPARAM l) override` (colorer.as:1376-1400) — процедура **родительского** окна 1С: `WM_SETFOCUS` → перенаправление фокуса в Scintilla (кроме случая `needFocus`); `WM_SIZE` → `onSizeParent`; `WM_NCCALCSIZE` → `return 0` (**удаляет штатные скроллеры 1С**); `0x0084/0x0085` (WM_NCHITTEST/WM_NCPAINT) → 0; `WM_NOTIFY` → `onNotifyParent(toSCNotification(l).ref)`; `WM_CHAR/WM_KEYDOWN/WM_SYSKEYDOWN` → форвард в Scintilla.
- `void createCaret(uint lineHeight) override` / `void showCaret() override` — каретка создаётся/показывается в окне Scintilla (для штатной подсказки 1С).
- `void getFontSize(Size&) override` / `uint getTextWidth(const string&, const Size&) override` — метрики из Scintilla (используются штатным IntelliSense).
- Реализации `SelectionChangedReceiver` (colorer.as:1414-1475): `onSelectionChanged` — отражение программного изменения выделения штатного редактора в Scintilla (каретка или выделение, `ensureLineVisible`+`scrollToCaret`); `onScrollToCaretPos` — `swnd.scrollToCaret()`; `getCaretPosForIS(ITEIntelliSence&, Point&, uint&)` — `GetCaretPos` + высота строки для штатной подсказки; `checkSelectionInIdle` — сверка выделения в idle-цикле (в т.ч. направление выделения: если каретка в начале — меняет границы местами).
- `LRESULT wndProcScn(uint msg, WPARAM w, LPARAM l)` (colorer.as:1477-1549) — процедура **окна Scintilla**: `WM_SETFOCUS` → `&&activeTextWnd = txtWnd`, сброс `lastActiveScintillaEditor`; `WM_KILLFOCUS` → `&&activeTextWnd = null`, запоминание `lastActiveScintillaEditor = this` (для команд с тулбара); `WM_CHAR` → блокировка Enter/Space в режиме отражения, `doDefault`, затем при Enter — `autoIndent()` и `txtWnd.afterChar(w)`; `WM_KEYDOWN` (с провалом в `WM_SYSKEYDOWN`) → стрелки влево/вправо в начале строки-заголовка свёртки разворачивают/сворачивают блок (colorer.as:1516-1528), затем `checkForSubst(w) || txtWnd.onKeyDown(w, l)`; `WM_LBUTTONDOWN` с `MK_CONTROL` — **Ctrl+Click = перейти к определению**: `calcPosition` → `setCaretPosition` → `sendCommandToMainFrame(CommandID(cmdFrntend, 83))` (F12, colorer.as:1533-1545).
- `bool checkForSubst(WPARAM w)` (colorer.as:1550-1579) — в текущем виде всегда `false`; тело проверки шаблонов (`ITemplateProcessor.needSubstitute`, команда `cmdProcessTemplate`) закомментировано, с примечанием о проблеме вставки пробела при срабатывании шаблона.
- `void autoIndent()` (colorer.as:1580-1656) — автоотступ при Enter: лексический анализ предыдущей непустой строки (`lex_provider` + `nextWithKeyword`): `ltIf/ltFor/ltWhile/ltTry/ltProcedure/ltFunction/ltElsIf/ltElse/ltExcept` дают +1, `ltEndIf/ltEndDo/ltEndTry/ltEndProcedure/ltEndFunction` −1; первое ключевое слово текущей строки (`ltElsIf…ltEndFunction`) даёт −1; базовый отступ берётся из предыдущей строки `prevLine.match(indentRex)` (глобальный `RegExp indentRex("^\\s*")`, lexer.as:158); добавление `\t × currentLevel` или пробелов `× currentLevel * tabWidth` (по `sciSetup.useTabs`), при отрицательном уровне — вырезание по regexp `\\t{N}` / ` {N×ширина}`; замена текущего отступа через `setSelection`+`replaceSel`.

Раскраска и внешний вид:

- `void initWindowSettings()` (colorer.as:1658-1666) — `setModEventMask(SC_MOD_INSERTTEXT | SC_MOD_DELETETEXT)`, `setLexer(SCLEX_CONTAINER)` (лексер — наш скриптовый код), `setTechnology(SC_TECHNOLOGY_DIRECTWRITE)`, `sciSetup._apply(swnd)`, `updateBreakPoints()`, `updateBookMarks()`.
- `void onSizeParent()` — `MoveWindow(swnd.hEditor, 0, 0, rc.right, rc.bottom, 1)`.
- `void highlightSelectedWord()` (colorer.as:1673-1723) — если выделено целое слово в одной строке (`swnd.isRangeWord`), по всем видимым строкам (`firstVisibleLine`+`linesOnScreen`) ищутся вхождения `SCI_FINDTEXT` с `SCFIND_WHOLEWORD` и заливаются индикатором `indSelectedWordHighlight` (`indFillRange`); само выделенное слово не красится; при снятии условия — `indClearRange(0, length)`.
- `void highlightPairBracket()` (colorer.as:1725-1733) — `SCI_BRACEMATCH`/`SCI_BRACEHIGHLIGHT` для символа слева от каретки.
- `void onNotifyParent(SCNotification& scn)` (colorer.as:1789-1826) — обработка уведомлений Scintilla: `SCN_STYLENEEDED` → `stylishText(scn.position)`; `SCN_UPDATEUI` (при `SC_UPDATE_SELECTION`) → `updateSelectionInParent()`, затем всегда `highlightSelectedWord()` и `highlightPairBracket()`; `SCN_MODIFIED` (вставка/удаление) → `updateTextInParent(scn)`; `SCN_MARGINCLICK` — клик по полю свёртки → `toggleFold(line, ctrlPressed)`, клик по полю маркеров → установка каретки и `sendCommandToMainFrame(CommandID(Guid("{DE680E96-…}"), 11))` (переключить точку останова); `SCN_MARGINRIGHTCLICK` — пусто.
- `void toggleFold(int line = -1, bool withChilds = false)` (colorer.as:1827-1846) — свёртка + опциональная подсветка заголовка индикатором `indFolding`, если `sciSetup.highlightFoldHeader` (заливка от первого до последнего непробельного символа при сворачивании, очистка при разворачивании).
- `void stylishText(int position)` (colorer.as:1910-2066) — **ядро раскраски**; вызывается Scintilla по `SCN_STYLENEEDED` на диапазон от `posEndStyled()` до `position`:
  1. защита `inStylish`; стартовая строка — строка `posEndStyled` минус одна (захват предыдущей строки для контекста);
  2. создаётся `FoldingProcessor(this, line)`;
  3. текст диапазона `swnd.text(startPos, len)` отдаётся `lex_provider lp(text.cstr, line)` — встроенному лексеру «Встроенного языка» (lexer.as);
  4. цикл `lp.nextWithKeyword(lex)`: защита от глюка лексера на пустом модуле (`lex.line > linesCount` → break, colorer.as:1934);
  5. на переходе к новой строке: если предыдущая строка была `LS_MULTILINESTRING` и стиль — `stString`, символы перевода строки (`\r\n` или `\n`) окрашиваются в `stString` (байты UTF-8), чтобы сработала заливка `SCI_STYLESETEOLFILLED` (colorer.as:1939-1954); сброс `lexemIdxInLine`, `setLineState(lex.line, 0)`;
  6. первый лексем строки (`lexemIdxInLine == 0`) задаёт line state: `ltRemark → LS_COMMENTLINE`, `ltTry → LS_TRY`, `ltIf/ltElse/ltElsIf → LS_CONDITION`, `ltWhile/ltFor → LS_LOOP`, `ltProcedure/ltFunction → LS_METHOD`, `ltPreproc → LS_PREPROC` (и для `#если`/`#область` → `foldingProcessor.preprocType = 1`, для `#конецесли`/`#конецобласти` → 2, colorer.as:1982-1993);
  7. лексема `ltQuote`: если начинается с `|` — `LS_MULTILINESTRING`; иначе подсчёт кавычек до `\n` — нечётное число означает незакрытую строку → `LS_MULTILINESTRING` (colorer.as:1997-2018);
  8. `foldingProcessor.process(lex.line, type)` — обновление уровней свёртки;
  9. стиль лексемы: `type > ltName` → ключевое слово (но `stIdentifier`, если предыдущей лексемой была точка — доступ к члену); `type < ltName` → `stOperator` (для операторов), `stRemark`, `stString`, `stDate`, `stNumber`, `stPreproc`, `stDirective`, иначе `stLabel`; `type == ltName` → `stIdentifier`; пробелы перед лексемой — `STYLE_DEFAULT` (длина в байтах `/2`, т.к. строка UTF-16);
  10. `swnd.setStyle(len, style)`; завершение — доливка стиля до `position` (`swnd.setStyle(position - swnd.posEndStyled(), style)`); при `lex.type == 0 || lp.atEnd()` — `setLevelForProcessedLine()` и выход.
- Синхронизация «Scintilla → штатный редактор»: `updateSelectionInParent()` (colorer.as:1847-1865) — каретка/выделение через `txtWnd.ted.setCaretPosition`/`setSelection`; `updateTextInParent(SCNotification&)` (colorer.as:1866-1908) — только если фокус в Scintilla и не идёт `owner.inTextModified`: позиция перевода `calcPosition`, пересчёт конечной позиции по числу `\n`, для вставки — `setCaretPosition(tpEnd)` + `setSelectionText(text)`, для удаления — `setSelection(tpStart, tpEnd, false)` + `setSelectionText("")`; пометка строк `markModifiedLine`.
- Координатные пересчёты: `int getPosition(const TextPosition& tp)` (colorer.as:2068-2079) — строка/колонка (с 1) → байтовая позиция UTF-8 (сумма `utf16ToUt8Length` по символам строки из `getTextLine`); `void calcPosition(int pos, TextPosition& tp)` (colorer.as:2081-2095) — обратно.
- Точки останова/закладки: `string getBreakPointKey()` (colorer.as:1735-1752) — GUID объекта метаданных через `txtWnd.getComWrapper().get_mdObj().get_id()`; для модулей приложения берётся GUID корня конфигурации (сравнение имён `mdoThis.get_name() == mdoRoot.get_name()`); ключ = GUID + `txtWnd.textDoc.mdInfo.mdPropUuid`, в нижнем регистре; `void updateBreakPoints()` (colorer.as:1754-1770) — перерисовка маркеров из `breakpoints` по префиксу ключа (строка `bpDef.line - 1`); `void updateBookMarks()` (colorer.as:1772-1780); `BreakPointDef&& getBreakPointAtLine(int line)` (colorer.as:1782-1787).
- Свёртка: `void initialFolding()` (colorer.as:2097-2120) — по всем строкам-заголовкам свёртки свернуть те, чей line state соответствует включённым флагам `sciSetup.foldComment/foldProc/foldCond/foldLoop/foldMultiString/foldTry/foldPreproc`; `void foldUnfoldAll(bool fold)` (свернуть — `initialFolding()`, развернуть — `SCI_FOLDALL EXPAND`); `void foldUnfoldCurrent(bool fold, bool withChilds = false)`; `void resetModifiedLineStates()`; `void gotoModifiedLine(int direction = 1)` (colorer.as:2137-2152) — навигация по блокам изменённых строк через `SCI_MARKERNEXT`/`SCI_MARKERPREVIOUS` с маской обоих маркеров: идёт по маркерам, пока предыдущая строка тоже модифицирована, и прыгает на начало блока.

#### class FoldingProcessor (colorer.as:2156-2299)

Инкрементальный вычислитель уровней свёртки Scintilla. Поля: `int line` (текущая строка), `int level` (уровень), `int currentLineLevel`, `bool needHeader` (строка — заголовок свёртки), `ScintillaEditor&& edt`, `ScintillaWindow&& swnd`, `int lexemIdxInLine`, `int initLine`, `uint preprocType` (1 — открывающий `#Если`/`#Область`, 2 — закрывающий), `int lastProcessedMultiline = -1`.

- Конструктор `FoldingProcessor(ScintillaEditor& e, uint& _line)` (colorer.as:2168-2178) — начальный уровень берётся из текущего `foldLevel(line) & SC_FOLDLEVELNUMBERMASK` (преемственность с предыдущим проходом раскраски).
- `void setLevelForProcessedLine()` (colorer.as:2179-2194) — фиксирует уровень строки: флаг `SC_FOLDLEVELHEADERFLAG`, если `currentLineLevel > level` или `needHeader`; `needHeader` уменьшает уровень на 1 и сбрасывается; ограничение снизу `SC_FOLDLEVELBASE`; `foldSetLevel(line, l | flag)`; `level = currentLineLevel`.
- `void setLevelForEmptyLines(int currentLexemLine)` (colorer.as:2195-2202) — пустым строкам между лексемами присваивается текущий уровень и сбрасывается line state.
- `void calcLevelChange(int lexType)` (colorer.as:2203-2291) — правила изменения уровня: `ltIf/ltFor/ltWhile/ltTry/ltProcedure/ltFunction` → +1; `ltElsIf/ltElse/ltExcept` → `needHeader = true` (и если строка == `initLine` — сразу +1 к обоим уровням); `ltEndIf/ltEndDo/ltEndTry/ltEndProcedure/ltEndFunction` → −1; `ltRemark` (только в начале строки) → +1, если предыдущая строка не комментарий (`getLineState(line-1) & LS_COMMENTLINE`), −1, если следующая строка не начинается с `//` (читается `swnd.lineOfText(line+1)`); `ltPreproc` → ±1 по `preprocType`; `ltQuote` → группировка многострочных литералов: +1, если предыдущая строка не `LS_MULTILINESTRING`, −1, если следующая не начинается с `|`; защита от повторной обработки через `lastProcessedMultiline`.
- `void process(int lexLine, int lexType)` (colorer.as:2292-2298) — при смене строки фиксирует уровень предыдущей (`setLevelForProcessedLine`), заполняет пустые строки, пересчитывает уровень по типу лексемы.

#### Функции файла colorer.as

- `color rgb(uint r, uint g, uint b)` (colorer.as:22-24) — упаковка цвета `BGR` для Scintilla.
- `uint utf16ToUt8Length(int_ptr& ptr)` (colorer.as:2301-2323) — читает UTF-16 кодовую единицу (`mem::word[ptr]`, сдвиг указателя), возвращает длину в байтах UTF-8 (1/2/3), с полной обработкой суррогатных пар (4/5/6 байт — «на всякий случай, ни сцинтилла, ни штатный редактор полноценный UTF-16 не умеют», комментарий colorer.as:2309).
- `void enumMonoFonts(NoCaseMap<int>& fonts)` (colorer.as:2327-2337) — перечисление моноширинных шрифтов: `LOGFONT` с `lfCharSet = 1 (DEFAULT_CHARSET)`, `lfPitchAndFamily = 1 (FIXED_PITCH)`, `EnumFontFamiliesEx` на DC экрана; колбэк — thunk `ThunkToFunc(&&FontNameProc)`.
- `int FontNameProc(LOGFONT& lf, int_ptr lpntme, int_ptr FontType, NoCaseMap<int>& names)` (colorer.as:2339-2343) — колбэк: добавляет имя шрифта, если `(lf.lfPitchAndFamily & 1) != 0`.
- `uint WideStringToAnsiString(string str)` (colorer.as:2346-2353) — `WideCharToMultiByte(CP_ACP, ...)` в `malloc`-буфер с терминальным нулём; **память надо освобождать вызывающему** (комментарий в коде).
- Массивы XPM-иконок (colorer.as:2355-2729) — `xpm_breakpoint` (красный круг), `xpm_breakpoint_disabled` (серый), `xpm_breakpoint_condition` (круг с галочкой-крестом), `xpm_debug_arrow` (жёлтая стрелка), `xpm_bookmark` (синяя закладка); каждая строка конвертируется `WideStringToAnsiString` при инициализации массива.

#### Перехваты colorer.as

Собственных `TrapVirtualStdCall` в файле нет. Вместо этого используются:

- **Субклассирование окон** через `attachWndToFunction` (общий механизм движка): оконная процедура родительского окна 1С (`wndProc`, colorer.as:1376) с перехватом `WM_SETFOCUS, WM_DESTROY, WM_SIZE, WM_NOTIFY, WM_NCCALCSIZE, WM_CHAR, WM_KEYDOWN, WM_SYSKEYDOWN, 0x0084 (WM_NCHITTEST), 0x0085 (WM_NCPAINT)` и оконная процедура самого Scintilla (`wndProcScn`, colorer.as:1477) с перехватом `WM_SETFOCUS, WM_KILLFOCUS, WM_CHAR, WM_KEYDOWN, WM_SYSKEYDOWN, WM_RBUTTONDOWN, WM_LBUTTONDOWN`. Ключевой хак — `WM_NCCALCSIZE → return 0`, убирающий штатные скроллеры 1С (colorer.as:1387-1388).
- **Обработчики команд дизайнера** — ~20 привязок `oneDesigner._events.addCommandHandler(...)` (colorer.as:456-489) на GUID отладчика `{DE680E96-5826-4E22-834D-692E307A1D9C}`, закладок `{FFE26CB2-322B-11D5-B096-008048DA0765}`, навигации `{6B7291BF-BCD2-41AF-BAC7-414D47CC6E6A}` (это же `cmdFrntend`) и нулевого GUID (команды свёртки/поиска); событие `onIdle`.
- **Перехват модального диалога** `onDoModal` через `oneDesigner._events.connect(dspWindows, ...)` для чтения условия точки останова (colorer.as:187-189).

#### Используемые API colorer.as

- **Scintilla** (SciLexer.dll из `pathes._tools`): прямая функция `Scintilla_DirectFunction` (`funcdef ScintillaFunc`), все `SCI_*` сообщения из `enum SciEnums`; структуры `Sci_TextRange`, `Sci_TextToFind`, `SCNotification` (v8api/scintilla.v).
- **Интерфейсы платформы (v8api)**: `ITextEditor` (`txtWnd.ted` — getSelection/getCaretPosition/setCaretPosition/setSelection/setSelectionText), `ITextEditor`-менеджеры (`editorsManager._subscribeToSelChange/_subscribeToTextChange`), `ITEIntelliSence`, `ITxtEdtOptions` (в базовом классе), `IV8MDObject` (`get_id/get_name/get_container().get_rootObject()/isSame`), `IV8MetaDataEvent` (`_kind`, `_obj`), `IV8Color`, `IMsgBoxHook`/`IDoModalHook`/`IV8Form`/`IV8Control` (диалог условия точки останова), `IProfileFolder` (`getProfileRoot().getValue("Debug/Breakpoints"|"Debug/Bookmarks")`).
- **WinAPI** (v8api/winapi.v): `LoadLibraryEx`, `GetProcAddress`, `CreateWindowEx`, `SendMessage`, `DestroyWindow`, `SetFocus`, `SetCaretPos`, `CreateCaret`, `ShowCaret`, `GetClientRect`, `MoveWindow`, `SetWindowPos`, `GetFocus`, `GetDC`/`ReleaseDC`, `EnumFontFamiliesEx`, `WideCharToMultiByte`, `GetCaretPos`.
- **mem::** — `memset`, `addressOf`, `word`, `byte`, `memcpy` (в этом файле — addressOf/word/byte).
- **Механика движка**: `initFuncDefFromAddress`, `ThunkToFunc`, `attachWndToFunction`/`WndFunc`, `createDispatchFromAS`, `AStoIUnknown`-подобная экспортная инфраструктура, `editorsManager`, `oneDesigner._events/_addins/_metadata/_me`, `getMainFrameCommandState`, `sendCommandToMainFrame`, `activeTextWnd`, `pathes._tools`.
- **Лексер**: `lex_provider` (`nextWithKeyword`, `setSource`, `atEnd`), `lexem` (`type/text/line/start/length`), `lexType()`, константы `lt*` — всё из lexer.as; `RegExp indentRex("^\\s*")` (lexer.as:158).

#### Взаимодействия colorer.as

- **Предоставляет**: редактор «Scintilla» для окон модулей (`ScintillaInfo`); глобальный `sciSetup` как COM-объект (аддин `scintilla_int`) для JS-аддина `scintilla.js` (методы `setStyle`, `Preview`, `enumMonoSpaceFonts`, `styleByName`, `callOnMetaDataEvent`, `callOnFoldUnfold`, `callToggleFold`, `callResetModifiedLineStates`, `callLineScroll`, `callGotoModifiedLine`, доступ к списку стилей); глобальные `breakpoints`, `bookmarks`, `openedSciEditors`, `activeScintillaEditor()`.
- **Потребляет**: `editorsManager._registerEditor` (textwnd.as), базовые классы `TextEditorDocument`/`TextEditorWindow` и интерфейсы `TextModifiedReceiver`/`SelectionChangedReceiver`/`EditorInfo` (textwnd.as:636-700), `TextWnd` (`afterChar`, `onKeyDown`, `getComWrapper`, `defaultMessages`), `activeTextWnd`, события дизайнера (`com_designer.as`), профиль (`getProfileRoot`), команды (`getMainFrameCommandState`, `sendCommandToMainFrame`, `CommandID`, `CommandState`), лексер (`lexer.as`).

#### Версионные ветки colorer.as

- `#if ver < 8.3.12` (colorer.as:11) — **весь файл**; на 8.3.12+ он не компилируется (альтернативный редактор Scintilla доступен только на платформах до 8.3.12 включительно в младших ветках).
- Также в базовом классе `TextEditorWindow` (textwnd.as:657) метод `wndProc` объявлен под тем же условием `#if ver < 8.3.12` — виртуальная пара согласована.

#### Особенности colorer.as

- **Двусторонняя синхронизация с защитой от циклов**: флаги `inReflection`/`inTextModified`/`inStylish` блокируют эхо-уведомления (изменение в Scintilla → штатный редактор → уведомление → …). Часть синхронизации откладывается на idle (`checkSelectionInIdle`).
- **Раскраска ленивая и потоковая**: Scintilla запрашивает стили по мере надобности (`SCN_STYLENEEDED`), скрипт красит от `posEndStyled` до запрошенной позиции, начиная со строки выше (контекст свёртки). Уровни свёртки и line states хранятся в самом документе Scintilla (fold level / line state) — «кэш» между проходами.
- **Хак с удалением скроллеров**: `WM_NCCALCSIZE → 0` и `WM_NCHITTEST/WM_NCPAINT → 0` — штатная рамка 1С полностью убирается.
- **Общий документ для нескольких окон**: `ScintillaDocument.connect` использует `SCI_GETDOCPOINTER`/`SCI_SETDOCPOINTER`.
- **Осторожная работа с UTF-8/UTF-16**: текст в Scintilla — UTF-8, во внутренних строках AngelScript — UTF-16; все пересчёты позиций идут через `utf16ToUt8Length`; длины в `setStyle` считаются в байтах (`/2` для пробельных групп).
- **Многосточные строки**: заливка фона работает через трюк — перевод строки окрашивается тем же стилем (`stString`), и включён `SCI_STYLESETEOLFILLED` для `stString`; состояние «строка внутри литерала» хранится в `LS_MULTILINESTRING`.
- **Защита от глюка лексера**: `if (lex.line > linesCount) break;` — «на пустом модуле лексер глючит и выдаёт случайный номер строки» (colorer.as:1934).
- **Отладка без API отладчика**: вход/выход из режима отладки и остановы определяются эвристически — по доступности штатных команд отладчика (`getMainFrameCommandState` в `OnIdle`), а стрелка ставится маркером `markDebugArrow` на строку каретки.
- **Ограничение**: `supportsNewWindowSystem() = false` — редактор не поддерживает «новую» оконную систему платформы; потому и порог `ver < 8.3.12`.
- XPM-иконки маркеров заданы прямо в коде массивами ANSI-строк, выделяемых `WideStringToAnsiString` в кучу (утечка не критична — массивы живут всё время процесса).

---

## sqlcolors.as (652 строки)

**Назначение.** Функционал по группированию строк в редакторе с помощью комментариев `//{ //}` (и блоков `#Удаление`/`#Вставка`), а также раскраска многострочных строковых литералов в цвета языка запросов (заголовок, sqlcolors.as:1-5). Работает перехватом штатного синтакс-разбора строки `ITextExtColors.getColors` текстового расширения «Встроенный язык»: после штатного разбора строка дополнительно проверяется на группирующие комментарии и строковые константы (начинающиеся с `|` или незакрытые), которые дополнительно разбираются текстовым расширением «Язык запросов» (`CLSID_TextExtSQL`), и токены запроса вливаются в общий вектор раскраски. Дополнительно через `ITextExtBackColors` задаётся собственный цвет фона для многострочных литералов. На x86 используется классическая ловушка `TrapVirtualStdCall`; на x64 — «нативные ворота» `snegopat_colors.dll`/`snegopat_colors85.dll` (v8api/colors_gate.v), которые могут выполнять разбор без входа в скрипт (см. «Особенности»).

**Инициализация.**

- Пакет: `Packet sqlColorsAndGrouping("sqlColorsAndGrouping", initSafeColorPacket, piOnMainEnter);` (sqlcolors.as:11), где `bool initSafeColorPacket() { return initGroupingAndColoring(); }` (sqlcolors.as:12). Уровень `piOnMainEnter`, зависимостей нет.
- Перехватчики (глобальные, sqlcolors.as:16-24): `TrapVirtualStdCall trITextExtColors_getColors` (слот `ITextExtColors_getColors`), `TrapVirtualStdCall trTextExtModule_QI` (слот 0 — QueryInterface расширения «Встроенный язык»; нужен на 8.2, где расширение не реализовывало раскраску фона), `TrapVirtualStdCall trTxtExt_hasBG` и `trTxtExt_getBG` (слоты `ITextExtBackColors_hasCustomBackground`/`ITextExtBackColors_getColorInfo`; с 8.3 расширение само поддерживает фон, поэтому перехватываются сами функции).
- Состояния натinвых ворот (только x64, `#if x86 = 0`, sqlcolors.as:26-66): `int colorGateState = trapNotActive;`, `int backGateState = trapNotActive;`; funcdef-и оригиналов: `TE_gc&& originalSafeColors;` (сигнатура `void TE_gc(ITextExtColors&, const v8string&, Vector&)`, sqlcolors.as:303), `SafeBGHas&& originalSafeBGHas` (две версии сигнатуры: на 8.3.27 — с параметрами `const TextPosition& first, const TextPosition& last`, sqlcolors.as:31-35), `SafeBGGet&& originalSafeBGGet`.
- Основные глобальные переменные:
  - `IUnknown&& myBGHandler;` — собственный обработчик фона (sqlcolors.as:69);
  - `ITextExtColors&& sqlColors;` — единственный экземпляр текстового расширения «Язык запросов» (создаётся по `CLSID_TextExtSQL`), им разбираются строки в кавычках (sqlcolors.as:73);
  - `bool usersGrouping;` — пользовательские группировки `//{ //}`;
  - `bool colorizedMultiLines;` — раскрашивать многострочные литералы в цвета запросов;
  - `bool enableBkColorForMultiLine;` — менять фон многострочных литералов;
  - `uint colorBgForMultiLine = 0xE0E0E0;` — цвет фона многострочников;
  - `bool groupMultiLine = true;` — сворачивать многострочные литералы;
  - `uint colorForPipe = 0xBBBBBB;` — цвет символа `|`;
  - `const uint bgMagic = 0xDEADBEEF;` — маркер в поле цвета токена, сигнализирующий «для этого токена нужен наш фон» (sqlcolors.as:127);
  - `int bgColorTrapType = 0;` — 0: тип перехвата фона не выяснен, 1: через подмену QueryInterface, 2: прямые перехваты/ворота.
- Объекты `OptionsEntry` (все при применении вызывают `initGroupingAndColoring()` и возвращают `false` — повторное применение не нужно):
  - `oeEnableCustomGrouping("EnableCustomGrouping")` → `usersGrouping` (sqlcolors.as:77-79);
  - `oeQueryColors("QueryColors")` → `colorizedMultiLines` (sqlcolors.as:83-85);
  - `oeEnableBkColorForMultyLine("EnableBkColorForMultyLine")` → `enableBkColorForMultiLine` (sqlcolors.as:89-91);
  - `oeMultiLineBackground("MultiLineBackground", &&defvalBgColorForMultiLine, ...)` → `colorBgForMultiLine`, с функтором значения по умолчанию (sqlcolors.as:95-97);
  - `oeGroupMultiLine("GroupMultiLine")` → `groupMultiLine` (sqlcolors.as:101-103).
  Все опции лежат в разделе `Snegopat/Settings/` (механика options.as).

### Типы sqlcolors.as

#### class SQLBlockInfo (sqlcolors.as:511-546)

Хранение массивов токенов от разбора строковых литералов парсером языка запросов.

- Поле `Vector tokens` — сырой вектор структур `SyntaxItemInfo`.
- `SyntaxItemInfoRef&& setSyntaxBlock(SyntaxItemInfo& si)` — аллоцирует вектор на один элемент (`tokens.alloc(1, SyntaxItemInfo_size)`) и копирует в него токен; возвращает ссылку-обёртку для правки.
- `uint fixupStartPositions(uint shift, const string& srcLine)` — корректирует токены после разбора: сдвигает `start` на `shift`; для каждой позиции проверяет символ `"` — если в оригинале была **сдвоенная кавычка**, увеличивает `len` и `shift` (в тексте, отданном SQL-парсеру, `""` был заменён на `"`); каждому токену выставляет `lexemCategory = vlUnknown`, `lexemType += 1001`, `isBlock = bmNone`, `blockKind = 0`, `blockMode = 0`; возвращает число токенов.

#### class MyTextExtBackColors (sqlcolors.as:622-635)

Собственная реализация `ITextExtBackColors` (для 8.2, где расширение «Встроенный язык» не имело этого интерфейса; отдаётся через перехваченный QueryInterface).

- `bool hasCustomBackground(...)` — две сигнатуры по версии (на x64/8.3.27 — с `first/last`); возвращает `processHasCustomBackground(items.infos)`.
- `void getColorInfo(COLORREF currentBGColor, SyntaxItemInfos& items, Vector& res)` — `processGetColorInfo(items.infos, res)`.

#### Функции файла sqlcolors.as

- `void defvalBgColorForMultiLine(Value& val)` (sqlcolors.as:105-111) — функтор значения по умолчанию для опции: создаёт `IV8Color` через `currentProcess().createByClsid(V8Color, IID_IV8Color)`, ставит `Color(0xE0, 0xE0, 0xE0)`, кладёт в `val.pValue`.
- `void colorFromV8(const Value& val, uint&out res)` (sqlcolors.as:113-121) — извлекает RGB из `Value`, содержащей `IV8Color` (только если `clr.kind == 0` — RGB-цвет; берётся `clr.value.id`).
- `void swapSafeColors()` (sqlcolors.as:41-44, x64) — переключает `colorGateState` между `trapEnabled`/`trapDisabled` и вызывает `colorsGateEnable(0, ...)` (kind 0 — ворота раскраски).
- `void swapSafeBackground()` (sqlcolors.as:46-53, x64) — переключает `backGateState`, вызывает `colorsGateEnable(1, ...)` и `colorsGateEnable(2, ...)` (два слота фона), а на 8.3.27 ещё и `colorsLineBgEnable(...)` (фон всей строки до правого края).
- `bool configureNativeColors()` (sqlcolors.as:55-65, x64) — конфигурация нативного разбора в snegopat_colors.dll: `mode = 1` для `ver >= 8.3.20`, битовые `flags = (usersGrouping ? 1 : 0) | (colorizedMultiLines ? 2 : 0) | (enableBkColorForMultiLine ? 4 : 0) | (groupMultiLine ? 8 : 0)`; передаёт ABI-макеты структур — `SyntaxItemInfo_size`, `SyntaxItemInfo_color_offset`, `SyntaxItemInfo_isBlock_offset`, `SyntaxItemInfo_lexemCategory_offset`, `SyntaxItemInfos_infos_offset` (значения генерируются из v8api/textcolors.v) — а также `colorBgForMultiLine`, `colorForPipe`; вызывает `colorsNativeConfigure(sqlColors, mode, ...)`. Возвращает успех; при неудаче в лог пишется «Native colors ABI/allocator is not supported; hook remains disabled».
- `bool initGroupingAndColoring(bool forceForProbe = false)` (sqlcolors.as:131-289) — центральная функция установки/снятия перехватов:
  1. `getEventService().notify(eTxtEdtOptionChanged)` — оповещение редакторов о смене опций;
  2. если ни `usersGrouping`, ни `colorizedMultiLines` — все перехваты/ворота снимаются (ворота — `swapSafeColors`/`swapSafeBackground`, ловушки — `.swap()` по состоянию `.state`);
  3. иначе (x64-ветка, `#if x86 = 0`): при `colorGateState == trapNotActive` — проверка `diagHook("colors", defaultNativeColors)` (diag.as; включение по умолчанию на 8.3.17.x / 8.3.27.x / 8.5, иначе только через `logs/diag.ini` `hook.colors=on`), создание расширения `currentProcess().createByClsid(gTextExtModule, IID_IUnknown, ext)`, установка ворот `installColorsGate(colorsExt, ITextExtColors_getColors, ThunkToFunc(&&ITextExtColors_getColorsTrap), mainThreadId, 0)` (native-функция из colors_gate.v), сохранение оригинала `initFuncDefFromAddress(original, &&originalSafeColors, asCALL_STDCALL)`, создание `sqlColors` по `CLSID_TextExtSQL`, `configureNativeColors()`; затем `swapSafeColors()`. При повторных вызовах — просто переконфигурация и включение.
     x86-ветка (sqlcolors.as:190-209): та же логика, но ловушкой `trITextExtColors_getColors.setTrap(colorsExt, ITextExtColors_getColors, ITextExtColors_getColorsTrap)`. **Хук по умолчанию выключен на всех версиях** (`diagHook("colors", false)`): платформа вызывает `getColors` из фонового потока редактора (txtedt) параллельно с главным, а Core.As не допускает параллельного входа в скрипты — на 8.3.27 зависания и падения, на 8.3.17 падение в core_as.dll (комментарий sqlcolors.as:191-194; подробности в tools/DISABLED-27.md).
  4. если `colorizedMultiLines && enableBkColorForMultiLine` — организация фона: сначала выясняется `bgColorTrapType`: у расширения запрашивается `ITextExtBackColors`; если платформа его не отдаёт — создаётся `myBGHandler = AStoIUnknown(MyTextExtBackColors(), IID_ITextExtBackColors)` и ставится ловушка на QueryInterface расширения (`trTextExtModule_QI.setTrap(tExt, 0, TextExtModule_QI)`), тип 1; если отдаёт — на x64 ставятся нативные ворота `installBackColorsGate(bgHandler, ITextExtBackColors_hasCustomBackground, ..., mainThreadId, 1)` и `installBackColorsGate(bgHandler, ITextExtBackColors_getColorInfo, ..., mainThreadId, 2)` с сохранением оригиналов (`originalSafeBGHas`/`originalSafeBGGet`), на 8.3.27 дополнительно `colorsLineBgInstall(lineBgExt, mainThreadId)` под диагностическим хуком `diagHook("linebg", ...)` (по умолчанию включён только на 8.3.27.1859), тип 2; на x86 — прямые ловушки `trTxtExt_hasBG`/`trTxtExt_getBG`, тип 2. При `!enableBkColorForMultiLine` — все фоновые перехваты снимаются.
- `void printSyntaxInfos(const string& text, Vector& infos)` (sqlcolors.as:291-300) — отладочный дамп токенов через `doLog(..., 3)`: текст лексемы, `blockKind`, `blockMode`, `isBlock`, `cat`, `lexType`.
- `void ITextExtColors_getColorsTrap(ITextExtColors& pThis, const v8string& sourceLine, Vector& infos)` (sqlcolors.as:304-351) — хук разбора строки:
  1. вызов оригинала (`originalSafeColors` на x64 / `getOriginal` на x86); при отладке `dbgLog` пишет идентификатор потока и главный ли он;
  2. если вектор пуст или строка многострочная (`sourceLine.str.find("\n") != badStrIdx`) — выход («парсинг нескольких строк вызывается не для раскраски»);
  3. `usersGrouping` → `checkForGroupingRemark(srcLine, infos)` — если строка оказалась группирующим комментарием, выход;
  4. если выключены и раскраска, и группировка многостроков — выход;
  5. SQL-разбор нужен только если первый токен — строка, начинающаяся с `|` (`vlString == sInfo.ref.lexemCategory && '|' == srcLine[sInfo.ref.start]`), либо строка заканчивается открытой кавычкой (`isLineEndWithOpenQuote(srcLine)`, функция из lexer.as);
  6. при `colorizedMultiLines` — `parseQuoteLexemAsSQL`, затем вектор `infos` пересобирается: `infos.dtor()`, `infos.alloc(newCount, SyntaxItemInfo_size)` и `mem::memcpy` блоков по очереди; иначе — только `checkForGroupingMultiLine`.
- `RegExp reGroupComment("(?i)(//\\{|#Удаление|#Вставка)|(//\\}|#КонецУдаления|#КонецВставки)");` и `bool checkForGroupingRemark(const string& srcLine, Vector& infos)` (sqlcolors.as:353-376) — ищет в строке первый токен-комментарий (`vlRemark`/`vlUnknown`), матчит его хвост на `reGroupComment`; при совпадении токен превращается в маркер блока: `isBlock = groupBlockBegin` (для `//{`, `#Удаление`, `#Вставка`) или `groupBlockEnd`, `blockKind = groupBlockKind`, `blockMode = 0`, `lexemCategory = vlUnknown`, `lexemType = 999`.
- `array<SQLBlockInfo&&>&& parseQuoteLexemAsSQL(const string& srcLine, Vector& tokens, uint&out newCount)` (sqlcolors.as:381-475) — основной алгоритм раскраски многостроков:
  - для каждого токена-строки: `withoutBegin = (первый символ '|')`, `withoutEnd = isLineEndWithOpenQuote(...)`; если хоть одно — токен обрабатывается;
  - создаётся блок **открывающей кавычки** (копия токена с `len = 1`, `lexemType = 1000`, `vlUnknown`); для символа `|` задаётся цвет `colorForPipe`;
  - метки блока: токен с открывающей, но без закрывающей кавычки — `groupBlockBegin` (при `groupMultiLine`), но только если строка не начинается с `|` и содержимое непусто (иначе фон не меняем, `needChangeBG = false`); токен с `|` без открывающей — `groupBlockEnd`;
  - при `enableBkColorForMultiLine && needChangeBG` в цвет токена записывается магия: `color.value.uuid.data1 = bgMagic`, `color.value.uuid.data2 = withoutEnd ? 777 : len - 2` (длина фона);
  - из токена вырезается внутренний текст (`len - (withoutEnd ? 1 : 2)`), сдвоенные кавычки `""` заменяются на `"`, и текст отдаётся `sqlColors.getColors(text, blockInfo.tokens)` — парсеру языка запросов; `fixupStartPositions(start+1, srcLine)` поправляет позиции/длины;
  - при `!withoutEnd` добавляется отдельный токен **закрывающей кавычки** (`start + len - 1`);
  - обычные токены копируются как есть. `newCount` — суммарное число токенов для пересборки вектора.
- `void checkForGroupingMultiLine(const string& srcLine, Vector& infos)` (sqlcolors.as:478-507) — упрощённая версия того же прохода без SQL-разбора: только расставляет `groupBlockBegin`/`groupBlockEnd` на многострочных литералах (используется при `!colorizedMultiLines && groupMultiLine`).
- `bool processHasCustomBackground(Vector& items)` (sqlcolors.as:548-558) — true, если в векторе токенов есть цвет с `uuid.data1 == bgMagic`.
- `void processGetColorInfo(Vector& items, Vector& res)` (sqlcolors.as:560-592) — формирование фоновых диапазонов: подсчёт магических токенов, `v8malloc((old + new) * BackColorsItem_size)`, заполнение `BackColorsItemRef`-ов (`start = токен.start + 1`, `len = uuid.data2`, `color = colorBgForMultiLine`), копирование прежних элементов `res`, подмена `res.start/end/allocated`.
- `bool TxtExt_hasCustomBackground(ITextExtBackColors& pThis, ...)` (sqlcolors.as:594-608) — хук `hasCustomBackground`: вызов оригинала (нативные ворота или `trTxtExt_hasBG` с временным `swap()`), результат `OR processHasCustomBackground(items.infos)`.
- `void TxtExt_getColorInfo(ITextExtBackColors& pThis, size_t currentBGColor, SyntaxItemInfos& items, Vector& res)` (sqlcolors.as:610-619) — хук `getColorInfo`: вызов оригинала + `processGetColorInfo`.
- `uint TextExtModule_QI(IUnknown& pThis, const Guid& g, IUnknown&&& res)` (sqlcolors.as:638-652) — хук QueryInterface: на `IID_ITextExtBackColors` возвращает `myBGHandler` (с `AddRef()`), остальное — оригиналу.

#### Перехваты sqlcolors.as

- `trITextExtColors_getColors` — слот `ITextExtColors_getColors` расширения «Встроенный язык» (`gTextExtModule`): хук `ITextExtColors_getColorsTrap`. На x64 вместо него (или вместе с ним) — нативные ворота `installColorsGate(..., 0)`.
- `trTextExtModule_QI` — слот 0 (`QueryInterface`) расширения «Встроенный язык»: хук `TextExtModule_QI`, подсовывающий свой `ITextExtBackColors` (режим 8.2).
- `trTxtExt_hasBG` / `trTxtExt_getBG` — слоты `ITextExtBackColors_hasCustomBackground` / `ITextExtBackColors_getColorInfo`: хуки `TxtExt_hasCustomBackground` / `TxtExt_getColorInfo`. На x64 вместо них — ворота `installBackColorsGate(..., 1/2)`, а на 8.3.27 — ещё и `colorsLineBgInstall` (фон всей строки).
- Нативные ворота остаются установленными всегда после первой инициализации; переключение — `colorsGateEnable(kind, on/off)`, о чём говорит комментарий sqlcolors.as:27-29: «The native gate remains installed when disabled. It never enters Core.As on editor workers, including during option changes».

#### Используемые API sqlcolors.as

- **v8api/textcolors.v** — типы раскраски: `struct SyntaxItemInfo` (поля `start`, `len`, `Color color`, `BlockMarker isBlock`, `blockKind`, `blockMode`, `lexemCategory`, `lexemType`; методы `ctor`, `copy`; константы смещений `SyntaxItemInfo_color_offset` и т.п.), `struct SyntaxItemInfos` (поле `Vector infos` и `refCount` с версионной поправкой +4 на 8.3.5-8.3.6), `struct BackColorsItem` (`start`, `len`, `color`) и обёртки `SyntaxItemInfoRef`/`BackColorsItemRef` (`toSyntaxItemInfo`, `toBackColorsItem`), enum `BlockMarker` (`bmNone`, `bmBegin`, `bmInner`, `bmEnd`; `groupBlockBegin = 2/16`, `groupBlockEnd = 8/32`, `groupBlockKind = 2/4` в зависимости от `ver < 8.3.3`), enum `V8LexCategory` (`vlKeyword`, `vlNumeric`, `vlString`, `vlDate`, `vlName`, `vlOperator`, `vlRemark`, `vlUnknown`), интерфейсы `ITextExtColors` ({6A93A252-…}, метод `getColors(const v8string&in, Vector&)`), `ITextExtBackColors` ({89578B27-…}), `ITextExtention`, `CLSID_TextExtSQL` ({2B4A2CFC-…}), `Color`/`ckRGB`.
- **v8api/colors_gate.v** — нативные функции `snegopat_colors.dll` (`:dlls snegopat_colors.dll`; для 8.5 — `snegopat_colors85.dll`, потому что в 8.5 аллокатор резолвится по имени модуля nuke85.dll, а в snegopat_colors.dll зашито nuke83.dll — комментарий colors_gate.v:4-9): `installColorsGate`, `installBackColorsGate`, `colorsLineBgInstall`/`colorsLineBgEnable`/`colorsLineBgCount` (8.3.27), `colorsGateEnable`, `colorsGateCount(kind, script)`, `colorsGateAddress(kind, field)`, `colorsWorkerProbe`, `colorsNativeConfigure`, `colorsNativeSwitch`, `colorsWorkerStress`, `nativeBackgroundProbe`.
- **Прочие интерфейсы**: `ITextExtention` (QI-хук), `IV8Color` (`setColor`/`getColor`), `IProcess` (`currentProcess().createByClsid`), `IProfileFolder` здесь не используется — опции идут через `OptionsEntry`.
- **Инфраструктура движка**: `TrapVirtualStdCall` (`setTrap`, `swap`, `state`, `getOriginal`), `initFuncDefFromAddress(..., asCALL_STDCALL)`, `ThunkToFunc`, `getEventService().notify(eTxtEdtOptionChanged)` (v8api/text.v:258), `diagHook`/`doLog`/`dbgOn`/`dbgLog` (diag.as; `mainThreadId` — diag.as:149), `mem::memcpy`, `v8malloc`, `isLineEndWithOpenQuote` (lexer.as), `AStoIUnknown`, `GetCurrentThreadId`.

#### Взаимодействия sqlcolors.as

- **Предоставляет другим**: функцию `initGroupingAndColoring` (вызывается из `com_snegopat.as` методами диагностики `coloringBackgroundProbe`/`coloringStress`/`coloringProbe` с `forceForProbe = true`), глобальные `sqlColors`, `colorGateState`/`backGateState`, `usersGrouping`/`colorizedMultiLines`/`enableBkColorForMultiLine`/`groupMultiLine`, `colorBgForMultiLine`/`colorForPipe`, `bgMagic`; сами хуки (`ITextExtColors_getColorsTrap` передаётся в `installColorsGate` как скриптовый thunk).
- **Потребляет**: систему опций (`options.as`: `OptionsEntry`, профиль `Snegopat/Settings/*`), диагностику (`diag.as`: `diagHook`, `doLog`, `dbgLog`), событие `eTxtEdtOptionChanged` (подписчики в `textwnd.as`/редакторах перечитывают опции), лексер (`lexer.as`: `isLineEndWithOpenQuote`), объект `snegopat` для аддинов (`com_snegopat.as`): `coloringBackgroundCounts()` (счётчики входов в ворота: `has`/`get`/`line`/`script`), `coloringGateInfo()` (адреса ворот), `coloringBackgroundProbe(text, worker)`, `coloringStress(text, workers, iterations)`, `coloringProbe(text, worker, native)`.
- ВАЖНО: sqlcolors.as работает независимо от colorer.as — раскраска запросов в многострочниках действует и в штатном редакторе, и в Scintilla (до 8.3.12), т.к. перехватывается платформенный разбор, а не редактор.

#### Версионные ветки sqlcolors.as

- `#if x86 = 0` (sqlcolors.as:26-66, 136-141, 156-188, 227-258, 264-272, 275-277, 594-604, 611-617, 624-628) — на x64 используются нативные ворота `snegopat_colors.dll`, на x86 — ловушки `TrapVirtualStdCall` со `swap()` на время вызова оригинала.
- `#if ver >= 8.3.27 & ver < 8.3.28` — иная сигнатура `hasCustomBackground` (добавлены `first`/`last`), включение `colorsLineBgEnable`/`colorsLineBgInstall` (фон всей строки; подтверждено на сборке 8.3.27.1859, на остальных сборках 27 включается флагом `hook.linebg=on`).
- `#if ver >= 8.3.20` — `mode = 1` в `colorsNativeConfigure` (современная схема токенов).
- `#if (ver >= 8.3.17 & ver < 8.3.18) | (ver >= 8.3.27 & ver < 8.3.28) | ver >= 8.5` — `defaultNativeColors = true`: хук раскраски включён по умолчанию (только на x64; на остальных версиях — только через `logs/diag.ini` `hook.colors=on` или флаг `logs/hook-colors.on`).
- `#if ver < 8.3.19 | (x86 = 0 & ver >= 8.3.27 & ver < 8.3.28)` — путь организации фона через собственный объект/ворота (для 8.2 и особых 27-х).
- `#if ver >= 8.3.27.1859 & ver < 8.3.27.1860` — точечное включение line-bg по номеру сборки.

#### Особенности sqlcolors.as

- **Магия в поле цвета**: диапазон фона кодируется в неиспользуемых полях `Color.value.uuid` (`data1 = 0xDEADBEEF` — маркер, `data2` — длина), потому что протокол `getColors` не позволяет передать ничего, кроме токенов; `getColorInfo` позже декодирует эти токены в `BackColorsItem`. Значение `777` в `data2` означает «фон на весь остаток строки» для незакрытых литералов.
- **Сдвоенные кавычки**: текст литерала передаётся SQL-парсеру с заменой `"" → "`, а `fixupStartPositions` возвращает длинам токенов исходные значения, проходя по строке и удлиняя токены на каждую встреченную кавычку.
- **Слияние векторов токенов**: результат платформенного разбора уничтожается (`infos.dtor()`) и пересобирается через `infos.alloc(newCount, SyntaxItemInfo_size)` + `mem::memcpy` — прямая работа с сырой памятью платформы.
- **Потокобезопасность — главная боль**: платформа вызывает раскраску из фонового потока редактора; вход в Core.As из чужого потока недопустим. Отсюда архитектура x64: нативные ворота перехватывают вызов в snegopat_colors.dll и по умолчанию выполняют разбор **нативно** (`colorsNativeConfigure` передаёт алгоритму все флаги опций, размеры и смещения структур `SyntaxItemInfo`), не заходя в скрипт; скриптовый хук остаётся как эталонная реализация (x86) и для диагностики (`coloringProbe` переключает режимы через `colorsNativeSwitch`).
- **Счётчики диагностики**: `colorsGateCount(kind, script)` — kind 0/1/2 = раскраска/has-фон/get-фон, второй параметр различает подсчёты по исполнителям (в `coloringProbe`: 0 — worker, 1 — script, 2 — native; выводится в `coloringBackgroundCounts`).
- **Отказоустойчивость**: если `configureNativeColors` не смогла (несовместимый ABI/аллокатор) — хук остаётся выключенным (`colorGateState = trapDisabled`), лог: «Native colors ABI/allocator is not supported; hook remains disabled».
- `checkForSubst`-аналог группировки: `lexemType = 999` для маркеров блоков и `1000/1001` для кавычек/SQL-токенов — служебные номера, не пересекающиеся с настоящими типами лексем платформы.
-RegExp-разбор группирующих комментариев регистронезависим (`(?i)`), поддерживает и `#Удаление`/`#Вставка`/`#КонецУдаления`/`#КонецВставки` как маркеры блоков.

---

## Связи внутри группы и с движком

- **Пакеты**: `piScintilla("scintilla", piOnMainEnter)` (colorer.as:13) регистрирует альтернативный редактор; `sqlColorsAndGrouping("sqlColorsAndGrouping", piOnMainEnter)` (sqlcolors.as:11) ставит перехваты раскраски. Оба пакета не зависят друг от друга и могут работать по отдельности.
- **textwnd.as** — фундамент для colorer.as: `EditorsManager editorsManager` (`_registerEditor`, `_subscribeToTextChange/_unsubsribeFromTextChange`, `_subscribeToSelChange/_unsubsribeFromSelChange`), базовые классы `TextEditorDocument` (textwnd.as:636), `TextEditorWindow` (textwnd.as:646), интерфейсы `TextModifiedReceiver`/`SelectionChangedReceiver`/`EditorInfo` (textwnd.as:665-700), `TextWnd` (`afterChar`, `onKeyDown`, `getComWrapper`, `wnd.setMessages`, `defaultMessages`), глобальный `activeTextWnd`. Scintilla-редактор подставляется именно через механизм альтернативных редакторов для GUID расширений `gTextExtModule`/`gTextExtModule1`.
- **lexer.as** — лексер «Встроенного языка» (`lex_provider`, `lexem`, `lexType`, константы `lt*`), regexp отступа `indentRex` (lexer.as:158), функция `isLineEndWithOpenQuote`. Используется colorer.as для раскраски (`stylishText`) и автоотступа, sqlcolors.as — для определения «незакрытой кавычки».
- **v8api/textcolors.v** — контракт раскраски платформы (`SyntaxItemInfo`, `SyntaxItemInfos`, `BackColorsItem`, `ITextExtColors`, `ITextExtBackColors`, `ITextExtention`, `CLSID_TextExtSQL`, enum `BlockMarker`, `V8LexCategory`); sqlcolors.as — его основной потребитель, а сгенерированные константы `SyntaxItemInfo_*_offset` уходят в нативную конфигурацию `colorsNativeConfigure`.
- **v8api/colors_gate.v + snegopat_colors.dll/snegopat_colors85.dll** — нативный слой перехвата для x64: установка ворот, включение/выключение, счётчики, диагностические пробы, стресс-тесты; для 8.5 используется отдельная DLL с исправленным именем аллокатора (nuke85.dll).
- **diag.as** — `diagHook("colors"|"linebg", default)` управляет включением перехватов, `doLog`/`dbgLog`/`dbgOn` — логирование, `mainThreadId` — проверка потока.
- **options.as** — пять опций sqlcolors.as (`EnableCustomGrouping`, `QueryColors`, `EnableBkColorForMultyLine`, `MultiLineBackground`, `GroupMultiLine`) регистрируются через `OptionsEntry` и хранятся в разделе `Snegopat/Settings/`; любое изменение вызывает `initGroupingAndColoring()`.
- **com_snegopat.as** — методы объекта `snegopat` для диагностики раскраски (только x64): `coloringBackgroundCounts`, `coloringGateInfo`, `coloringBackgroundProbe`, `coloringStress`, `coloringProbe`; они вызывают `initGroupingAndColoring(true)` и нативные `colorsGateCount`/`colorsGateAddress`/`colorsWorkerProbe`/`colorsWorkerStress`/`nativeBackgroundProbe`/`colorsNativeSwitch`.
- **com_designer.as** — `oneDesigner._events` (обработчики команд/`onIdle`/`onDoModal`), `oneDesigner._addins` (загрузка `scintilla.js`), `oneDesigner._metadata` (GUID модулей для ключей точек останова), `oneDesigner._me`.
- **Профиль Конфигуратора** (`getProfileRoot()`): colorer.as читает `Debug/Breakpoints` и `Debug/Bookmarks` — те же данные, что пишет штатный отладчик, поэтому точки и закладки одинаково показываются и в штатном редакторе, и в Scintilla.
- **Командная система**: colorer.as отправляет штатные команды (`sendCommandToMainFrame`) — «переключить точку останова» (11 GUID отладчика), «перейти к определению» (83 `cmdFrntend`); и слушает их состояние (`getMainFrameCommandState`).
- **SciLexer.dll** (в `pathes._tools`, рядом в lib/x64) — загружается вручную, вызовы идут напрямую через `Scintilla_DirectFunction`, минуя оконные сообщения.
- **main.as / packets.as** — оба пакета инициализируются при входе в главное меню (`piOnMainEnter`); colorer.as дополнительно требует, чтобы окно редактора было создано (`textwnd.as` вызывает `editorsManager._createEditor(g)` → `ScintillaInfo.create()`).
- **Ограничение совместимости**: colorer.as целиком под `#if ver < 8.3.12`; sqlcolors.as работает на всех поддерживаемых версиях, но режимы (нативные ворота против скриптовых ловушек, line-bg 8.3.27) зависят от версии — см. «Версионные ветки» выше.
