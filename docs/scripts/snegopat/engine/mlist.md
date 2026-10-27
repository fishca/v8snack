## `snegopat/engine/mlist.as`

- Язык: **AngelScript**, строк: **315**, объявлений: **21**
- Назначение: Отображение списка методов модуля /
- Состав: class — 1, func — 19, funcdef — 1

- `funcdef int_ptr DlgProc(HWND, int_ptr, WPARAM, LPARAM);`
- `class MethodsDialog: SmartBoxSite`

### внутри `MethodsDialog`

- `int show(ModuleElements&& elements, int _currentLine)`
- `void onDoSelect(SmartBoxItemBaseIface&& selItem)`
- `bool onKeydown(WPARAM wParam, LPARAM lParam)`
- `bool onKillFocus(HWND newWnd)`
- `void onChar(WPARAM wParam, LPARAM lParam)`
- `int_ptr mainDialogProc(HWND hWnd, int_ptr msg, WPARAM wParam, LPARAM lParam)`
- `LRESULT EditProc(uint msg, WPARAM w, LPARAM l)`
- `void initDialog()`
- `void initSizes()`
- `void createControls()`
- `int prepareItems()`
- `void onSize()`
- `void onSizing(DWORD side, Rect& pRect)`
- `void onMinMaxInfo(MINMAXINFO& mmi)`
- `void onMove()`
- `void onCommand(WPARAM w, LPARAM l)`
- `void onChangeEdit()`
- `void endDialog(int res)`
- `void clear()`
