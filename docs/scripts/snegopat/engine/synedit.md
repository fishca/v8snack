## `snegopat/engine/synedit.as`

- Язык: **AngelScript**, строк: **567**, объявлений: **49**
- Назначение: Внедрение текстового редактора "SynEdit" /
- Состав: class — 7, func — 36, funcdef — 6

- `class SynEditInfo : EditorInfo`

### внутри `SynEditInfo`

- `bool supportsNewWindowSystem()`
- `SynEditEditor&& activeEditor()`
- `Variant activeSynEditEditor()`
- `bool showSmartBox()`
- `Variant editorWindowRect(HWND hwnd)`
- `HWND twHwnd()`

### верхний уровень

- `class strWrapper` — Обертка для передачи строки в массиве Variant Там, похоже, только IDispatch можно передавать...
- `class textManagerWrapper` — Обертка над TextManager
- `class ITextPos` — Обертка над TextPosition
- `class IRect` — Обертка над Rect
- `class SynEditDocument : TextEditorDocument, TextModifiedReceiver`

### внутри `SynEditDocument`

- `void attach(TextDoc&& td)`
- `void detach()`
- `TextEditorWindow&& createEditor()`
- `void onTextModified(TextManager& tm, const TextPosition& tpStart, const TextPosition& tpEnd, const string& newText)`
- `funcdef long FuncSynEditWndProc(HWND hWnd, UINT msg, long wParam, long lParam);`

### верхний уровень

- `class SynEditEditor : TextEditorWindow, SelectionChangedReceiver`

### внутри `SynEditEditor`

- `void setSynEditHwnd(HWND hwnd, HWND editorHwnd, uint wndProc)`
- `bool isEditorFocused()`
- `void onFocused()`
- `void onUnfocused()`
- `void selectionChanged()`
- `void onActivate()`
- `void onDeactivate()`
- `void handleReposition()`
- `void onDestroy()`
- `void doFocus()`
- `bool dispatchMessage(MSG& msg, int_ptr p1)`
- `long synEditWindowProc(HWND hWnd, UINT msg, long wParam, long lParam)`
- `funcdef void FuncSetFocus(IWindow& w);`
- `funcdef int_ptr FuncGetFocus();`
- `void initFocusTrap()`
- `void SetFocusTrap(IWindow& w)`
- `int_ptr GetFocusTrap()`
- `funcdef void FuncTopLevelWindowOnSize(HWND w, int_ptr zPos, Rect& r, int i1);`
- `funcdef void FuncReposition(HWND w, int_ptr zPos, Rect& r, int i1);`
- `void initResizeTraps()`
- `void V8RepositionTrap(HWND w, int_ptr zPos, Rect& r, int i1)`
- `void TopLevelWindowOnSize(HWND w, int_ptr zPos, Rect& r, int i1)`
- `void initTextAreaModifiedTraps()`
- `void disableTextAreaModifiedTrap()`
- `void textAreaModified_trap(TextManager& tm, int_ptr _b, TextPosition& beforeStart, TextPosition& beforeEnd, TextPosition& afterStart, TextPosition& afterEnd)`
- `void notifyTextAreaModified(TextManager& tm, bool b, Selection&& before, Selection&& after)`
- `funcdef int FuncSetCaretPos(HWND w, int i1, int i2);`
- `void initCaretSelectionTraps()`
- `void disableCaretSelectionTrap()`
- `void onSelectionRecalculateFinished_trap(TextManager& tm)`
- `int SetCaretPos_trap(HWND w, int i1, int i2)`
