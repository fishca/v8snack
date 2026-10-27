## `snegopat/engine/colorer.as`

- Язык: **AngelScript**, строк: **3882**, объявлений: **195**
- Назначение: Внедрение текстового редактора "Scintilla" http://www.scintilla.org/index.html /
- Состав: class — 10, func — 184, funcdef — 1

- `Packet piScintilla("scintilla", function()`
- `funcdef LRESULT ScintillaFunc(int_ptr, uint, WPARAM, LPARAM);`
- `color rgb(uint r, uint g, uint b)`
- `class BreakPointDef`

### внутри `BreakPointDef`

- `ScintillaEditor&& activeScintillaEditor()`

### верхний уровень

- `class ScintillaDesignerEventsHandler`

### внутри `ScintillaDesignerEventsHandler`

- `void OnToggleBreakPoint(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnDeleteAllBreakPoints(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnToggleBreakPointState(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnToggleAllBreakPointsState(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnToggleBreakPointCondition(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnToggleBookmark(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnDeleteAllBookmarks(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnDebugStep(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnDebugContinue(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnGotoDefinition(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnGlobalSearch(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnWindowsMessageBox(IMsgBoxHook& mbh, array<Variant>& params)`
- `void OnWindowsDoModal(IDoModalHook& dlgInfo, array<Variant>& params)`
- `void clearDebugArrowInAllScintillaEditors()`
- `void OnIdle(array<Variant>& params)`
- `void OnFoldUnfold(CmdHandlerParam& cmd, array<Variant>& params)`
- `void OnMetaDataEvent(IV8MetaDataEvent&& mde)` — void OnMetaDataEvent(array<Variant>& params) { IV8MetaDataEvent&& mde = cast<IUnknown>(params[0].getDispatch()); //не работает IV8MetaDataEvent&& mde = params[0].getDispatch(); } void OnSave(CmdHandlerParam& cmd, array<Variant>& params) { if (!cmd._isBefore) { } }

### верхний уровень

- `class ScintillaInfo : EditorInfo`

### внутри `ScintillaInfo`

- `bool supportsNewWindowSystem()`
- `void connectEvents()`
- `void loadBreakPointsFromProfile()`
- `void loadBookmarksFromProfile()`

### верхний уровень

- `class ScintillaInternalAddin : BuiltinAddin`

### внутри `ScintillaInternalAddin`

- `IUnknown&& object()`

### верхний уровень

- `class ScintillaWindow`

### внутри `ScintillaWindow`

- `void create(HWND hWndParent, uint dwStyle, uint dwExStyle = 0, uint ctrlId = 0, int X = 0, int Y = 0, int nWidth = 0, int nHeight = 0)`
- `void destroy()`
- `LRESULT callSciMsg(uint msg, WPARAM w = 0, LPARAM l = 0)`
- `int length()`
- `uint textHeight(int line = 0)`
- `uint textWidth(const string& text, int styleIdx = STYLE_DEFAULT)`
- `void goToPos(int pos)`
- `int xFromPos(int pos)`
- `int yFromPos(int pos)`
- `void setSelection(int from, int to)`
- `void scrollToCaret()`
- `int anchorPos()`
- `void setAnchorPos(int pos)`
- `int currentPos()`
- `void setCurrentPos(int pos)`
- `void setModEventMask(uint mask)`
- `void setLexer(int lexer)`
- `void setMarginType(int margin, int type)`
- `void setMarginMask(int margin, uint set, uint reset = 0)`
- `void setTechnology(int tech)`
- `void setBufferedDraw(int flag)`
- `void setStyleFont(int styleIdx, const string& fontName)`
- `void setStyleSize(int styleIdx, int size)`
- `void setStyleWeight(int styleIdx, int weight)`
- `void setStyleUnderline(int styleIdx, int underline)`
- `void setStyleItalic(int styleIdx, int italic)`
- `void setStyleEolFilled(int styleIdx, int eolfill)`
- `void setStyleFore(int styleIdx, color fore)`
- `void setStyleBack(int styleIdx, color back)`
- `void styleClearAll()`
- `void setCaretWidth(int caretWidth)`
- `void setMarginWidth(int margin, int width)`
- `void setMarkerFore(int marker, color clr)`
- `void setMarkerBack(int marker, color clr)`
- `void setTabWidth(int tabWidth)`
- `void setUseTabs(int flag)`
- `void setIndentGuides(int flag)`
- `void insertText(int pos, int_ptr text)`
- `void replaceSel(int_ptr text)`
- `void setCodePage(int cp)`
- `void setText(int_ptr text)`
- `int_ptr docPointer()`
- `void setDocPointer(int_ptr doc)`
- `int posFromLine(int line)`
- `int lineFromPos(int pos)`
- `int posEndStyled()`
- `int lineLength(int line)`
- `uint charAt(int pos)`
- `MemoryBuffer&& textRange(int from, int len)`
- `string text(int from, int len)`
- `void startStyling(int pos)`
- `void setStyle(int len, int style)`
- `int lineFromMarkHandle(int_ptr markHandle)`
- `void deleteMarkHandle(int_ptr markHandle)`
- `int_ptr markerAdd(int line, int marker)`
- `void defineMarker(int mark, int symbol)`
- `void setFoldMarginColour(int useSettings, color clr)`
- `void setProperty(const string& name, const string& val)`
- `void setAutoFold(int val)`
- `void foldSetLevel(int line, int level)`
- `int foldLevel(int line)`
- `void foldSetFlag(int flag)`
- `void toggleFold(int line = -1, bool withChilds = false)`
- `void foldExpandSet(int line, int expanded)`
- `bool foldIsExpanded(int line)`
- `void marginSetClickable(int margin, int clickable)`
- `void indStyleSet(int indicatorNumber, int indicatorStyle)`
- `void indForeSet(int indicatorNumber, color clr)`
- `void indAlphaSet(int indicatorNumber, int alpha)`
- `void indAlphaOutlineSet(int indicatorNumber, int alpha)`
- `void indUnderSet(int indicatorNumber, int under)`
- `void indHoverStyleSet(int indicatorNumber, int indicatorStyle)`
- `void indHovreForeSet(int indicatorNumber, color clr)`
- `void indFlagSet(int indicatorNumber, int flags)`
- `void indCurrentSet(int indicator)`
- `void indValueSet(int value)`
- `void indFillRange(int position, int fillLength)`
- `void indClearRange(int position, int clearLength)`
- `int indAllOnFor(int position)`
- `int indValueAt(int indicator, int position)`
- `int indStart(int indicator, int position)`
- `int indEnd(int indicator, int position)`
- `string lineOfText(int line)`
- `int linesOnScreen()`
- `int firstVisibleLine()`
- `int docLineFromVisibleLine(int line)`
- `int lineEndPosition(int line)`
- `int selectionStart()`
- `int selectionEnd()`
- `int findText(int searchFlags, LPARAM textToFindStructPtr)`
- `bool isRangeWord(int start, int end)`
- `void setUsePopup(int allowPopUp)`
- `int markerGet(int line)`
- `void markerDelete(int line, int markerNumber)`
- `void markerDeleteAll(int markerNumber)`
- `int currentLine()`
- `void deleteAllBreakPointMarks(int line)`
- `void markerDefinePixMaps()`
- `void setLineState(int line, int state)`
- `int getLineState(int line)`
- `int getLineCount()`
- `int getStyleAt(int pos)`
- `void ensureLineVisible(int line = -1)`
- `void changeModifiedLineMarkers()`

### верхний уровень

- `class SciStyleDefinition`

### внутри `SciStyleDefinition`

- `void _apply(ScintillaWindow& swnd, const NoCaseMap<int>& fonts)`

### верхний уровень

- `class ScintillaSetup`

### внутри `ScintillaSetup`

- `void addStyle(SciStyleDefinition&& d)`
- `uint get_stylesCount()`
- `SciStyleDefinition&& style(uint idx)`
- `SciStyleDefinition&& styleByNum(int num)`
- `SciStyleDefinition&& styleByName(string name)`
- `void setStyle(string styleName, string name = "", int size = 0, bool bold = 0, bool italic = 0, bool underline = 0, int color = clrNone, int bgColor = clrNone)`
- `void callOnMetaDataEvent(IV8MetaDataEvent&& mde)`
- `void callOnFoldUnfold(bool fold)`
- `void callToggleFold(bool withChilds = false)`
- `void callResetModifiedLineStates()`
- `void callLineScroll(int cnt)`
- `void callGotoModifiedLine(int direction = 1)`
- `void _apply(ScintillaWindow& swnd)`
- `void Preview(bool msg)`
- `void _setupMarks(ScintillaWindow& swnd)`
- `void _setupLineNumbers(ScintillaWindow& swnd)`
- `void _setupFolding(ScintillaWindow& swnd)`

### верхний уровень

- `class ScintillaDocument : TextEditorDocument, TextModifiedReceiver`

### внутри `ScintillaDocument`

- `void attach(TextDoc&& td)`
- `void detach()`
- `TextEditorWindow&& createEditor()`
- `void onTextModified(TextManager& tm, const TextPosition& tpStart, const TextPosition& tpEnd, const string& newText)`
- `ScintillaEditor&& firstEditor()`
- `void connect(ScintillaWindow&& swnd)`

### верхний уровень

- `class ScintillaEditor : TextEditorWindow, SelectionChangedReceiver`

### внутри `ScintillaEditor`

- `LRESULT wndProcScn(uint msg, WPARAM w, LPARAM l)`
- `bool checkForSubst(WPARAM w)`
- `void autoIndent()`
- `void initWindowSettings()`
- `void onSizeParent()`
- `void highlightSelectedWord()`
- `void highlightPairBracket()`
- `string getBreakPointKey()`
- `void updateBreakPoints()`
- `void updateBookMarks()`
- `BreakPointDef&& getBreakPointAtLine(int line)`
- `LRESULT onNotifyParent(SCNotification& scn)`
- `void toggleFold(int line = -1, bool withChilds = false)`
- `void updateSelectionInParent()`
- `void updateTextInParent(SCNotification& scn)`
- `void stylishText(int position)`
- `int getPosition(const TextPosition& tp)` — Пересчёт из координат штатного редактора в позицию документа сцинтиллы
- `void calcPosition(int pos, TextPosition& tp)` — Пересчёт из позиции документа сцинтиллы в текстовые координаты штатного редактора
- `void initialFolding()`
- `void foldUnfoldAll(bool fold)`
- `void foldUnfoldCurrent(bool fold, bool withChilds = false)`
- `void resetModifiedLineStates()`
- `void gotoModifiedLine(int direction = 1)`

### верхний уровень

- `class FoldingProcessor`

### внутри `FoldingProcessor`

- `void setLevelForProcessedLine()`
- `void setLevelForEmptyLines(int currentLexemLine)`
- `void calcLevelChange(int lexType)`
- `void process(int lexLine, int lexType)`
- `uint utf16ToUt8Length(int_ptr& ptr)`
- `void enumMonoFonts(NoCaseMap<int>& fonts)`
- `int FontNameProc(LOGFONT& lf, int_ptr lpntme, int_ptr FontType, NoCaseMap<int>& names)`
- `uint WideStringToAnsiString(string str)`
