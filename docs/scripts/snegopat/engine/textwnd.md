## `snegopat/engine/textwnd.as`

- Язык: **AngelScript**, строк: **1035**, объявлений: **100**
- Назначение: Тут часть кода, работающая с текстовыми окнами /
- Состав: class — 9, func — 79, funcdef — 7, interface — 5

- `OptionsEntry oeUseCtrlClicks("UseCtrlClicks", function(v)`
- `OptionsEntry oeShowNotifyOnStartup("ShowNotifyOnStartup", function(v)`
- `interface TextProcessor` — Это интерфейс обработчика событий в тексте. В-зависимости от назначенного текстовому документу расширения (встроенный язык, язык запросов и т.п.) создается соответствующий расширению текстовый процессор. Именно он и обрабатывает события в текстовом окне
- `interface EditorData {};` — Просто базовый интерфейс для хранения текстовым процессором данных для конкретного редактора
- `class EmptyTextProcessor : TextProcessor` — Реализация пустого текстового процессора, ничего не делает

### внутри `EmptyTextProcessor`

- `void setTextDoc(TextDoc&& textDoc)`
- `void connectEditor(TextWnd&& editor)`
- `void afterChar(TextWnd&& editor, uint16 symbol)`
- `bool onKeyDown(TextWnd&& editor, WPARAM wParam, LPARAM lParam)`
- `bool onChar(TextWnd&& editor, uint16 symbol)`
- `void itemInserted(TextWnd&& editor, SmartBoxInsertableItem&& item)`
- `void insertInSelection(ITextEditor&& pEditor, TextManager&& pTM, ITextManager&& pITM, const string& txt, bool bClearCache, bool needIndent)` — / кэш можно сбросить только после последней вставки. иначе очень весёлые глюки. Хотя когда нужно сделать несколько вставок подряд, В-принципе, необходимость возникает всегда :) При необходимости сбрасывает кэш парсера строк 1С. взависимости от вставляемого положения. При необходимости дополняет многострочный текст нужным отступом, Вставляет в текущее положение редактора (как-будто нажали Ctrl+V) Основная функция вставки текста в текстовый редактор.
- `TextProcessor&& createTextProcessor(const Guid& g)`

### верхний уровень

- `class TextDocStorage`

### внутри `TextDocStorage`

- `TextDoc&& find(ITextManager&& itm)`
- `TextDoc&& find(TextManager&& tm)`
- `void store(TextDoc&& tdoc)`
- `void remove(TextDoc&& doc)`
- `void disableTextWork()`
- `void enableTextWork()`
- `TextWnd&& find(HWND hwnd)`
- `void onCreateTextWnd(IWindowView&& pWnd, bool bControl, HWND parent)` — Вызывается из перехвата при создании окна текстового редактора
- `void changeTextExtender(ITextManager&& itm, const Guid& textExtender)` — Вызывается из перехвата при смене расширения текстового редактора (т.е. в меню текст выбрали тип текста - Встроеный язык, язык запросов, и т.п.)
- `string keyForSearchOpenedMD(IMDObject&& obj, const Guid& propUuid)`

### верхний уровень

- `class TextDocMdInfo`

### внутри `TextDocMdInfo`

- `void detach()`

### верхний уровень

- `class TextDoc` — Класс, который хранит различную инфу о текстовом документе. Важно, у одного текстового документа может быть открыто несколько окон

### внутри `TextDoc`

- `void attachView(TextWnd&& wnd)`
- `void detachView(TextWnd&& wnd)`
- `void setTextExtenderType(const Guid& g)`
- `TextWnd&& findWnd(ITextEditor&& editor)`
- `HWND getHwnd(TextWnd&& tw)`
- `HWND getHwnd(TextWnd&& tw)`
- `funcdef void FuncDispatchMessagesTrap(MSG&, int_ptr);`
- `void DispatchMessagesTrap(MSG& msg, int_ptr p1)`
- `funcdef void FuncTextWnd_Activate(IFramedView&& view, int_ptr action, IFramedView&& otherView);`
- `void TextWnd_Activate(IFramedView&& view, int_ptr action, IFramedView&& otherView)`
- `funcdef void FuncWindowDetach(HWND);`
- `void Window_DetachTrap(HWND wnd)`

### верхний уровень

- `class TextWnd`

### внутри `TextWnd`

- `LRESULT WndProc(uint msg, WPARAM w, LPARAM l)`
- `bool onKeyDown(WPARAM w, LPARAM l)` — / } Print("delete TextWnd"); ~TextWnd() {
- `bool beforeChar(uint16 symb)`
- `void afterChar(uint16 symb)`
- `ITextWindow&& getComWrapper()`
- `void onDestroy()`
- `void onActivate()`
- `void onDeactivate()`
- `void afterClick()`
- `bool onContextMenu(bool up)`

### верхний уровень

- `class TextEditorDocument` — Интерфейс для связи с текстовым документом.

### внутри `TextEditorDocument`

- `void attach(TextDoc&& td)`
- `void detach()`
- `TextEditorWindow&& createEditor()`

### верхний уровень

- `class TextEditorWindow` — Интерфейс для взаимодействия с окном редактора. Один текстовый документ может одновременно иметь несколько окон редакторов. Снегопат сабклассирует окно штатного редактора и отдаёт обработку оконных сообщений назначенному редактору

### внутри `TextEditorWindow`

- `void attach(TextWnd&& tw)`
- `void detach()`
- `LRESULT wndProc(uint msg, WPARAM w, LPARAM l)`
- `void getFontSize(Size& fontSize)` — Функции для работы снегопатовского списка контекстной подсказки
- `void createCaret(uint lineHeight)`
- `void showCaret()`
- `uint getTextWidth(const string& text, const Size& fontSize)`
- `void onActivate()`
- `void onDeactivate()`
- `void onDestroy()`
- `bool dispatchMessage(MSG& msg, int_ptr p1)`

### верхний уровень

- `interface TextModifiedReceiver` — Интерфейс получателя уведомлений об изменениях в тексте документа Позволяет редактору реагировать на изменения текста, сделанными программно, не через редактор
- `interface SelectionChangedReceiver` — Интерфейс получателя уведомлений об изменениях в окне редактора, сделанных программно
- `interface EditorInfo` — Описание альтернативного редактора
- `class ComEditorInfo` — Обёртка вокруг EditorInfo для работы через SnegAPI
- `class EditorsManager` — Менеджер альтернативных редакторов

### внутри `EditorsManager`

- `void checkSelectionInIdle()`
- `TextEditorDocument&& _createEditor(const Guid& extGuid)` — Создание редактора для указанного расширения текстового редактора
- `void _registerEditor(EditorInfo&& editorInfo)` — Регистрация вида редактора
- `void _subscribeToSelChange(ITextEditor& editor, SelectionChangedReceiver& receiver)` — Подписка на изменения в окне редактора
- `void _unsubsribeFromSelChange(ITextEditor&& editor, SelectionChangedReceiver& receiver)` — Отписка от изменений в окне редактора
- `void _subscribeToTextChange(TextManager& tm, TextModifiedReceiver& receiver)` — Подписка на изменения в тексте документа
- `void _unsubsribeFromTextChange(TextManager& tm, TextModifiedReceiver& receiver)` — Отписка от изменений в тексте документа
- `uint count()` — Количество зарегистрированных редакторов
- `ComEditorInfo&& editor(uint idx)`
- `bool setActiveEditor(const string& extName, const string& editorName)` — Назначение активного редактора для текстового расширения
- `void setup(const string& editorName)`
- `void initSelChangeTrap(ITextEditor&& ted)`
- `void disableSelChangeTrap()`
- `void initTextModifiedTraps()`
- `void disableTextModifiedTrap()`
- `void logSubscriber(const string& what, uint idx, uint count, uint ms)`
- `void notifyTextChange(TextManager& tm, const string& text)`
- `void setSelectText_trap(TextManager& tm, int_ptr pText, bool b)`
- `void clearTextSelection_trap(TextManager& tm)`
- `void notifyChangeSelection(ITextEditor& ted)`
- `funcdef void ITextEditorV(ITextEditor&);`
- `void setSelectionNull_trap(ITextEditor& pEd)`
- `funcdef void SCP_func(ITextEditor&, const TextPosition&, int_ptr);`
- `void setCaretPosition_trap(ITextEditor& pEd, const TextPosition& tp, int_ptr bInScreenCoords)`
- `funcdef void SS_func(ITextEditor&, const TextPosition&, const TextPosition&, int_ptr, int_ptr);`
- `void setSelection_trap(ITextEditor& pEd, const TextPosition& tpStart, const TextPosition& tpStop, int_ptr bCaretToStart, int_ptr bInScreenCoords)`
- `void scrollToCaretPos_trap(ITextEditor& pEd)`
- `funcdef void ContextListPos_func(ITEIntelliSence&, Point&, uint&);`
- `void getContextListPos_trap(ITEIntelliSence& teis, Point& caretPos, uint& lineHeight)`
