# Подсистема контекстных подсказок и обработки текста модулей

Файлы: `intellisite.as`, `mlist.as`, `smartboxitems.as`, `keywords.as`, `StockListInterceptor.as`, `ModuleTextProcessor.as`, `ModuleElements.as`, `typereader.as` (папка `snegopat-client/x64/modules/snegopat/engine/`).

Группа файлов реализует «умную» подсказку Снегопата: подмену штатного списка автодополнения 1С собственным списком (SmartBox), разбор структуры модулей конфигурации, словари стоковых элементов платформы, «умный» Enter и автозамены, а также диалог «Методы модуля» (Ctrl+1).

---

## intellisite.as (684 строки)

**Назначение.** Ядро пользовательского списка подсказок Снегопата. Класс `IntelliSite` владеет окном списка (`SmartBoxWindow`), хранит все группы элементов, выполняет фильтрацию по мере набора (включая поиск по нескольким подстрокам и по заглавным буквам CamelCase), позиционирует POPUP-окно у каретки, обрабатывает клавиатуру при открытом списке и выполняет вставку выбранного элемента в текст. Также ведёт «список горячих слов» (частота недавних вставок, `HotWords` в профиле) и содержит mixin `MethodInsertable` для вставки методов. Файл — «хаб»: практически все остальные файлы группы добавляют сюда элементы и вызывают `show()`.

**Инициализация.** Пакетов `Packet(...)` в файле нет — синглтон `oneIntelliSite` создаётся лениво при первом `getIntelliSite()` (intellisite.as:11-16). Конструктор `IntelliSite()` (intellisite.as:114-119) вызывает `clearAllItems()`, `prepareV8StockItems()` (из typereader.as — первичное чтение словарей платформы), `loadHotOrder()` и регистрирует сохранение горячих слов через `exitAppHandlers.insertLast(PVV(this.saveHotOrder))` (обработчики из exitApp.as).

OptionsEntry (все читаются при каждом `show()` через `readSettings()`):
- `oeUseLangs("UseLangs")` — intellisite.as:56, какие языки использовать; дефолт `uint(useLangRus)`; пишется в глобальную `useLangs`.
- `oeListWidth("ListWidth")` — intellisite.as:60, ширина окна списка, дефолт 250, пишется в `boxWidth` (глобальная, строка 39).
- `oeAllowMultyFilter("AllowFilterInSmartList")` — intellisite.as:64, дефолт true, разрешает фильтрацию по нескольким подстрокам через пробел (`allowMultyFilter`).
- `oeInsertTextOnDot("InsertTextOnDot")` — intellisite.as:68, дефолт true (`insertOnDot`) — по точке выбирать текущий элемент и вызывать штатную подсказку.
- `oeCamelSearchOnUpperOnly("CamelSearchOnUpperOnly")` — intellisite.as:72, дефолт false (`camelSearchOnUpperOnly`) — искать по CamelCase только если весь шаблон состоит из заглавных.

Прочие глобальные: `hotOrderDataPath = "Snegopat/HotWords"` (строка 18) — путь в профиле; `spaceSymbol = '∙'` (строка 19, U+2219) — служебный символ многословного фильтра; `maxItems = 12` (строка 37) — максимум строк в списке; `maxHotOrderItems()` = 100 (строки 46-48); `enum UseLangFlags { useLangEng = 1, useLangRus = 2 }` и `useLangs = useLangRus`, `insertOnDot = true`, `camelSearchOnUpperOnly = false` (строки 51-54); `funcdef void AfterSelect(bool bCancel)` (строка 77) — объявлена, но в файле не используется.

**Типы.**

`class SmartBoxInsertableItem : SmartBoxItem` (строки 22-34) — базовый класс всех вставляемых из списка элементов.
- Конструктор `SmartBoxInsertableItem(const string& descr, imagesIdx img)` — пробрасывает в `SmartBoxItem`.
- `void textForInsert(string&out text)` — возвращает `d.descr` (переопределяется наследниками).
- `void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent)` — пустой; наследники корректируют диапазон замены набранного текста и флаг «не делать автоотступ».
- `void afterInsert(TextWnd&& editor)` — пустой; пост-обработка после вставки.

`class IntelliSite : SmartBoxSite` (строки 79-599). Поля:
- `SmartBoxWindow smartBox` — окно списка (нативный объект snegopat.dll).
- `array<array<SmartBoxItem&&>&&> itemsGroup` — группы элементов; группа 0 — одиночные элементы (`addItem`).
- `array<array<string>&&> ucaseCache` — кэш «заглавных букв» описаний для CamelCase-поиска (строка 86: раньше регулярка выполнялась для каждого элемента на каждую букву и ввод тормозил на списках в тысячи элементов; заполняется лениво один раз на элемент).
- `string buffer`, `uint posInBuffer` — набранный текст и позиция в нём.
- `TextWnd&& textWnd`, `ITextEditor&& editor` — окно и редактор, с которыми открыт список.
- `Size fontSize` — размер шрифта редактора; `int xCaret, yCaret` — экранные координаты каретки; `Point boxCornerPosition`; `uint boxWidth`.
- `TextPosition caretPos` — позиция каретки в тексте на момент открытия.
- `bool boxIsUnderLine` (список снизу строки), `bCaretCreated`, `bInHide` (защита от реентерабельности `hide`), `bAllowMultyFilter`.
- `array<string>&& hotItems` — ключи недавно вставленных элементов.
- `ToolTipWindow templateToolTip` — всплывающая подсказка шаблонов.
- `#if ver >= 8.3.12 bool updownPressed` — фиксирует нажатие вверх/вниз (см. `onKillFocus`).
- Служебные: `array<SmartBoxItem&&>&& currentList` (последний результат `filter`), тайминги `kmFilter, kmSetItems, kmPlace, kmView, kmEdit`.

Методы:
- `IntelliSite()` — 114-119, см. «Инициализация».
- `void clearAllItems()` — 121-125: обнуляет `itemsGroup` и `ucaseCache`, вставляет пустую группу 0 для отдельных элементов.
- `void addItemGroup(array<SmartBoxItem&&>&& group)` — 127-129: добавить группу.
- `void addItem(SmartBoxItem&& item)` — 131-133: добавить одиночный элемент в группу 0.
- `bool isActive() const` — 135-137: список активен, если `editor !is null`.
- `bool show(TextWnd&& twnd, const string& beginOfWord, const string& selected = "", bool snegoList = true)` — 141-212: главный метод показа. Запоминает `buffer = beginOfWord`; `setHotOrderForItems()`; `filter()` — если пусто, сразу `clearAllItems()` и false. Сохраняет `textWnd`/`editor`, читает опции, запоминает `caretPos` и координаты каретки `GetCaretPos`; угол списка = каретка + `fontSize.cy + 3` (ниже текста), пересчёт в экранные `ClientToScreen` (окно POPUP). Создаёт окно `smartBox.createWindow(this, WS_POPUP | (snegoList ? WS_DLGFRAME : WS_BORDER), 0, hWnd)` (174). Если список не влезает вниз по `screenGeometry` — рисуется над текстом: `boxIsUnderLine = false`, `y -= fontSize.cy + 6`, `items.reverse()` (178-183). Ширина поджимается к границам монитора с отступом 10 (185-188). `setItems`, `setBoxPosition`; если параметр `selected` не пуст — ищется элемент с `d.key == selected.dup().makeLower()` и делается текущим, иначе `smartBox.navigate(boxIsUnderLine ? navFirst : navLast)`. Создаёт каретку редактора `createCaret(fontSize.cy)`, `SetCaretPos`, `showCaret`.
- `void setBoxPosition(uint itemsCount)` — 213-217: `SetWindowPos(smartBox.hwnd, HWND_TOPMOST, ...)` с высотой `smartBox.fullHeight(min(itemsCount, maxItems))` и `SWP_SHOWWINDOW`; при `!boxIsUnderLine` y уменьшается на высоту.
- `private void readSettings()` — 218-222: `boxWidth = getBoxWidth()`, `bAllowMultyFilter`, `textWnd.editor.getFontSize(fontSize)`.
- `array<SmartBoxItem&&>&& filter()` — 226-278: если окно уже создано — `testForTemplate()`. При `posInBuffer == 0` возвращает все не-`exclude` элементы. Иначе: `pattern = buffer.substr(0, posInBuffer)`, `pattern.ltrim("&\"'")`; если в шаблоне есть `spaceSymbol` — `StringComparator::setPattern(pattern.replace(spaceSymbol, ' '), cmContain)`, иначе `cmBeginWithOtherLangs` (начало слова на любом из языков). `checkCamelCase` — при `camelSearchOnUpperOnly` только если `pattern.extract(ucaseLetterRex) == pattern` (весь шаблон из заглавных). Далее по группам: прямой матч по `d.key`; иначе ленивое заполнение `ucaseCache[g][i] = descr.extract(ucaseLetterRex)` и сравнение `uc[i].beginFrom(pattern)` (pattern в верхнем регистре). Результат сортируется `sortItemsArray(result, boxIsUnderLine)` и запоминается в `currentList`.
- `void onDoSelect(SmartBoxItemBaseIface&& pSelected)` — 281-324: обработка выбора. Если открыт tooltip шаблонов и зажат Shift — `hide()` и выполнение `Command(CommandID(cmdGroupTxtEdt, 61))` через `ICommandTarget` (подстановка шаблона, см. текст подсказки в `testForTemplate` «Shift+Enter или пробел для выбора»). Для `SmartBoxInsertableItem`: `tpStart.col -= posInBuffer`, `tpEnd.col += buffer.length` — диапазон замены набранного; `updateInsertPosition`; `textForInsert`; ведущие символы `'\x8'` (backspace) сдвигают `tpStart.col--` и удаляются из текста (302-307); при зажатом Ctrl к тексту добавляется `";"` и `"\n"`, `notIndent = false` (308-313). Затем `editor.setSelection`, `insertInSelection(editor, textWnd.textDoc.tm, textWnd.textDoc.itm, text, true, !notIndent)`, `updateHotOrder(ins)`, `buffer.makeEmpty()`, `hide(ins)`, `ins.afterInsert(tw)`.
- `bool onKeydown(WPARAM wParam, LPARAM lParam)` — 325-376: ESC — `hide()`; VK_BACK — при `posInBuffer == 0` `hideAndSend(WM_KEYDOWN, ...)`, иначе удаление символа(ов) слева (с Ctrl — весь буфер до `posInBuffer`) через правку редактора и `moveCaret(-c, c)`; VK_LEFT/VK_RIGHT — на границе буфера `hideAndSend`, иначе `moveCaret(±1, 0)`; VK_DELETE — аналог вправо; VK_TAB — `SendMessage(smartBox.hwnd, WM_KEYDOWN, VK_RETURN, 0)` (Tab = выбор); `#if ver >= 8.3.12` VK_DOWN/VK_UP — `updownPressed = true` (373).
- `void onChar(WPARAM wParam, LPARAM lParam)` — 377-411: при Ctrl или VK_BACK — выход. Пробел: при `bAllowMultyFilter` и (Shift или `spaceSymbol` уже в буфере) вставляется `spaceSymbol` (разделитель слов фильтра), иначе `hideAndSend(WM_CHAR, ...)`. Точка при `insertOnDot`: `onDoSelect(currentList[smartBox.currentIdx])`; если после этого список не активен и символ перед кареткой — `is_name_symbol`, то `PostMessage(getHwnd(tw), WM_CHAR, '.', 0)` — точка пробрасывается платформе, чтобы сработала её подсказка после точки (394-400). Остальные символы вставляются в редактор (`setSelectionText`), `buffer.insert(posInBuffer, symbol)`, `moveCaret(1, 0)`; длительность вставки замеряется в `kmEdit`.
- `bool onKillFocus(HWND hNewWnd)` — 412-434: если фокус уходит в `smartBox.hwnd` — false (не мешать). Для ver < 8.3.12 при уходе в окно текста фокус насильно возвращается `SetFocus(smartBox.hwnd)` (комментарий: срабатывает при нажатии вверх/вниз при открытой подсказке о параметрах); для ver >= 8.3.12 то же делается только если был `updownPressed`. Иначе — `hide()`.
- `HWND hide(SmartBoxInsertableItem&& insert = null)` — 435-470: защита `bInHide`; уничтожение окна `DestroyWindow(smartBox.hwnd)`, `smartBox.setItems(пусто)`, уничтожение `templateToolTip`; сброс кэша парсера строк `ITextParserCache` (получается как `cast<IUnknown>(textWnd.textDoc.itm)`, `clearCache()`); если шла многословная фильтрация (в тексте есть `spaceSymbol`) — диапазон набора заменяется обратно: `buffer.replace(spaceSymbol, ' ')` через `insertInSelection`, каретка возвращается `setCaretPosition(caretPos, false)`; `clearAllItems()`; вызов `tw.textDoc.tp.itemInserted(tw, insert)` — уведомление текстового процессора; `SetFocus(hWnd)`; `&&activeTextWnd = tw`; возвращает HWND текстового окна.
- `private void hideAndSend(uint msg, uint wParam, uint lParam)` — 471-474: `hide()` + `PostMessage(hWnd, msg, ...)` — «прозрачное» пропускание клавиши платформе.
- `private void moveCaret(int step, int removeSymbols)` — 477-527: двигает `caretPos.col` и экранный `xCaret` на ширину символов (`getTextWidth(sm, fontSize)`), правит `buffer`; затем полный цикл обновления списка с поэтапными замерами `GetTickCount`: `kmFilter` (filter), `kmSetItems` (setItems + navigate), `kmPlace` (setBoxPosition), `kmView` (выделение остатка буфера в редакторе + `updateView`); если `itemsCount == 0` — `hide()`. Итоговая строка «ввод в списке: всего N мс (фильтр…, setItems+navigate…, позиция окна…, правка в редакторе+updateView…; вставка символа…)» пишется `diagAlways("slow", "НАБОР МЕДЛЕННО: …")` при `tmAll + kmEdit >= 50` либо `diag("key", …)` при трассировке (520-526).
- `private void setHotOrderForItems()` — 528-537: каждому элементу `d.hotOrder = hotItems.find(d.key) + 1` (0 — не вставлялся недавно); элементы с `hotOrder == uint(-1)` (например, разделители) не трогаются.
- `private void updateHotOrder(SmartBoxItem&& item)` — 538-544: удаляет ключ из `hotItems`, добавляет в конец, обрезает до `maxHotOrderItems()`.
- `private void loadHotOrder()` — 545-550: `getProfileRoot().getString("Snegopat/HotWords", data)`, `hotItems = data.str.split("\n")`.
- `private void saveHotOrder()` — 551-557: `root.createAndSetValue(hotOrderDataPath, gpflBaseUser, Value(v8string(join(hotItems, "\n"))))`.
- `bool isLineTailEmpty()` — 558-560: хвост строки после каретки пуст после `replace(indentRex, "")`.
- `string getCurrentLine()` — 561-563.
- `private void testForTemplate()` — 565-598: `getTxtEdtService().getTemplateProcessor(tp)`; если `tp.needSubstitute(cline, tm, line)` — текст начала строки совпал с шаблоном 1С: создаётся/обновляется `templateToolTip` (привязан к `smartBox.hwnd`) с текстом `"  Шаблоны:\n" + line + "\n  Shift+Enter или пробел для выбора"`; ширина — по более широкой стороне экрана; позиционирование: над кареткой, а при `!boxIsUnderLine` — справа от списка (`rightWidth > width + 4`) или слева; `SetWindowPos(..., SWP_NOACTIVATE | SWP_SHOWWINDOW)`. Если шаблона нет — tooltip уничтожается.

`mixin class MethodInsertable` (строки 602-650) — примесь для вставки метода/функции. Поля: `bool isFunction`, `uint paramsCount`, `string insertingString`, `string addingString`.
- `void updateInsertPosition(...) override` — 608-632: если хвост строки в точке вставки пуст — добавляет `";"`; иначе берёт текст после каретки, чистит `endLineRex`, `split(whiteSpaceRex)` и первый токен `lastExpr` добавляет: `insert += lastExpr + ")"`, `end.col += lastExpr.length`, запоминает `addingString` (хвост «приклеивается» внутрь скобок).
- `void textForInsert(string&out text)` — 634-643: `d.descr + "("` + (`"¦"` при `paramsCount > 0`) + `addingString + ")"` + (`";"` если не функция); спецслучай `d.key == "нстр"` — `"¦"` заменяется на `"\"ru='¦'\""` (заготовка НСтр).
- `#if ver >= 8.3.4 void afterInsert(TextWnd&& editor)` — 645-649: `showV8MethodsParams()` (вызов подсказки параметров платформы).

Свободная функция `bool compareUcaseLetters(const string& test, const string& pattern)` — 651-653: `test.extract(ucaseLetterRex).beginFrom(pattern)` — используется фильтрами intellisite и mlist.

**Функции файла.**
- `IntelliSite&& getIntelliSite()` — 12-16: ленивый синглтон.
- `uint maxHotOrderItems()` — 46-48.
- `uint getBoxWidth()` / `bool isAllowMultyFilter()` — геттеры опций (40, 44).
- `compareUcaseLetters` — см. выше.
- `bool checkCommandAndHideSmartBox(ICommandTarget& tgt, const Command& command, TrapVirtualStdCall& trap)` — 657-684: см. «Перехваты».

**Перехваты.**
Сам файл хуков не ставит, но содержит тело хука `checkCommandAndHideSmartBox` (funcdef `TE_onExecute(ICommandTarget&, const Command&)`, строка 656), который main.as подключает к `ICommandTarget_onExecute` двух командных целей текстового редактора — `trTxtEdtCommand_onExecute` (main.as:216, trap ставится main.as:153) и `trTxtCtrCommand_onExecute` (main.as:223, trap main.as:105). Поведение (657-684): при открытом списке (`oneIntelliSite.isActive()`): команда `(IID_NULL, 600)` — показ штатной подсказки — пропускается без скрытия; для остальных запрашивается состояние `commandState(command.id)` (в 8.3.24–8.3.27 запрос пропускается — платформа падает, записывая в состояние раскладку, которую ещё не разобрали, — принимается `cs = cmdStateEnabled`) и при `cmdStateEnabled` список прячется `oneIntelliSite.hide()`. Далее через `trap.getOriginal(&&orig)` вызывается оригинальный обработчик команды.

**Используемые API.** Нативные объекты: `SmartBoxWindow`, `SmartBoxSite`, `SmartBoxItem(иSureItemData)`, `sortItemsArray`, `ToolTipWindow`, `StringComparator` (cmBeginWithOtherLangs/cmContain), `NoCaseSet`-подобные не используются здесь; интерфейсы 1С: `ITextEditor` (getCaretPosition/setSelection/setSelectionText/setCaretPosition/getFontSize/getTextWidth/createCaret/showCaret/updateView), `TextManager`/`ITextManager` (tm/itm в `insertInSelection`), `ICommandTarget::onExecute`, `ITextParserCache`, `ITemplateProcessor` (через `getTxtEdtService()`), `IProfileFolder` (`getProfileRoot()`); WinAPI: `GetCaretPos`, `ClientToScreen`, `SetWindowPos`, `SetCaretPos`, `GetKeyState`, `SendMessage`/`PostMessage`, `SetFocus`, `DestroyWindow`, `GetTickCount`, `screenGeometry`; утилиты движка: `insertInSelection` (textwnd.as:63), `getTextLine`, `is_name_symbol`, `sendCommandToMainFrame`, `commandState`, `sortItemsArray`, `diagAlways`/`diag`/`diagTraceOn`/`dbgLog` (diag.as).

**Взаимодействия.** Потребляет: `prepareV8StockItems()` и элементы из typereader.as; `textWnd.textDoc.tp.itemInserted` (ModuleTextProcessor); `activeTextWnd`, `insertInSelection` (textwnd.as); `hotItems` хранит в профиле. Поставляет: `getIntelliSite()` и API `addItem/addItemGroup/show/hide/isLineTailEmpty/getCurrentLine` — используются StockListInterceptor.as (showAssistList:298), ModuleTextProcessor.as (activateInModule:375, doAutoReplace:318, showV8Assist-цепочки), keywords.as (selectTypeAfterInsert:267), typereader.as (TypeNameItem.afterInsert:65), ModuleElements.as (Delimeters::Item). `checkCommandAndHideSmartBox` вызывается из main.as. `MethodInsertable` примешивается в ModuleElements.as (`ModuleMethodItem`:215) и typereader.as (`BuiltinFuncItem`:20, `GlobalContextMethod`:156, `ExtContextMethod`:192).

**Версионные ветки.** `#if ver >= 8.3.12` — поле `updownPressed` (110-112), обработка VK_DOWN/VK_UP в `onKeydown` (368-373) и соответствующая ветка `onKillFocus` (424-429): в новых версиях удержание фокуса в списке выполняется только после нажатия стрелок, иначе фокус отдаётся тексту. `#if ver >= 8.3.4` — `MethodInsertable::afterInsert` с `showV8MethodsParams()` (645-649). `#if (ver >= 8.3.24 & ver < 8.3.28)` — отказ от `commandState` в `checkCommandAndHideSmartBox` (667-673).

**Особенности.** (1) Многословный фильтр технически вставляет в текст символ `'∙'` (U+2219) вместо пробела, чтобы пробел не закрыл список, а при `hide()` текст восстанавливается на настоящие пробелы (450-459) — нестандартный приём. (2) Кэш заглавных букв `ucaseCache` — оптимизация, устранившая тормоза фильтрации (intellisite.as:84-86). (3) Позиционирование списка — ручная работа с экранными координатами POPUP-окна, разворот элементов при показе сверху (`items.reverse()`), подгон под границы монитора. (4) `hide()` обязателен к вызову через `bInHide`-защиту — предотвращает рекурсию (hide → itemInserted → …). (5) Приём «`\x8` в начале вставляемого текста» — эмуляция backspace при вставке. (6) Подробная диагностика производительности набора (категории `slow`, `key`) и горячих слов (`HotWords`, максимум 100). (7) Риски: прямая работа с координатами/кареткой чужого редактора; при `onChar('.')` «точка» после вставки отправляется платформе через `PostMessage` — логика завязана на порядок сообщений.

---

## mlist.as (315 строк)

**Назначение.** Модальное окно «Методы модуля» (вызывается по Ctrl+1 из com_snegopat.as): диалог со строкой поиска и встроенным `SmartBoxWindow`, в котором перечислены все процедуры/функции модуля; выбор элемента возвращает строку, на которую нужно перейти. Класс наследует `SmartBoxSite` — окно списка переиспользует ту же нативную инфраструктуру, что и подсказка.

**Инициализация.** Пакетов и OptionsEntry нет. Глобальный объект `MethodsDialog&& methodsDialog;` (mlist.as:315) создаётся лениво в com_snegopat.as:134-135.

**Типы.**

`funcdef int_ptr DlgProc(HWND, int_ptr, WPARAM, LPARAM)` (строка 10) — тип функции диалога.

`enum MethDialogConsts` (11-16): `editFontDelta = 8` (запас высоты поля), `ctrlDelta = 2` (зазор между контролами), `editID = 100`, `boxID = 101` (идентификаторы контролов).

`class MethodsDialog : SmartBoxSite` (18-314). Поля:
- `int_ptr dlgTemplate` — шаблон диалога, собранный вручную в памяти (24 байта из массива `dt`, копируется `malloc` + `mem::byte` в конструкторе, 36-47); `int_ptr dlgFunc`; `DlgProc&& dp` — функтор-обёртка, `dlgFunc = ThunkToFunc(&&dp)` — преобразование в адрес функции.
- `Rect lastPos` — последняя позиция окна (восстанавливается между показами); `Point minSize, maxSize` — ограничения размеров.
- `HWND hMainWnd; HWND edit; ASWnd&& hEdit` — окно диалога, поле ввода и объект-обёртка с подклассированием.
- `SmartBoxWindow smartBox; array<SmartBoxItem&&>&& items; array<SmartBoxItem&&>&& fItems` — список и полный/отфильтрованный наборы.
- `uint editHeight; int currentLine; bool opened` — `opened` защищает от повторного Ctrl+1 при уже открытом окне (комментарий к 48-52: второй показ затёр бы состояние, закрытие любого обнуляло общее состояние и оставшееся окно висло с Null pointer access).

Методы:
- `MethodsDialog()` — 36-47: создаёт функтор `DlgProc(this.mainDialogProc)`, `ThunkToFunc`, копирует двоичный шаблон диалога.
- `int show(ModuleElements&& elements, int _currentLine)` — 48-65: если `opened` — возврат 0. `&&currentModule = elements` (глобальная из ModuleElements.as:26); `elements.parsed = false; elements.parse()` — принудительный перепарсинг; `DialogBoxIndirectParam(GetModuleHandle(0), dlgTemplate, mainFrame.unk.hwnd(), dlgFunc, 0)`; возвращает код конца диалога (строку метода).
- `array<SmartBoxItem&&>&& filter()` — 66-115: текст поля разбивается на слова по `is_space` («мягкий поиск»: каждое слово должно входить в имя в любом порядке без учёта регистра — «пол кат» находит «ПолучитьКаталог»; раньше пробелы выбрасывались и «пол кат» превращалось в «полкат»); параллельно `joined` — все слова подряд, `makeUpper()` для поиска по заглавным буквам через `compareUcaseLetters(item.d.descr, joined)` («пк» → «ПолучитьКаталог»). Матчинг — `StringComparator::setPattern(words[w], cmContain)` c булевым массивом `match`. Лог через `dbgLog` (113).
- `void onDoSelect(SmartBoxItemBaseIface&& selItem)` — 117-120: `cast<ModuleMethodItem>` → `endDialog(item.info.line)`.
- `bool onKeydown(...) { return false; }`, `bool onKillFocus(...) { return false; }`, `void onChar(...) {}` — 121-123: пустые (клавиатуру обрабатывает подкласс поля).
- `int_ptr mainDialogProc(HWND, int_ptr msg, WPARAM, LPARAM)` — 125-156: WM_INITDIALOG → `initDialog`; WM_CLOSE → `endDialog(0)`; WM_SIZE → `onSize`; WM_SIZING → `onSizing(DWORD(wParam), toRect(lParam).ref)`; WM_DESTROY → `clear`; WM_GETMINMAXINFO → `onMinMaxInfo(toMINMAXINFO(lParam).ref)`; WM_COMMAND → `onCommand`; WM_MOVE → `onMove`.
- `LRESULT EditProc(uint msg, WPARAM w, LPARAM l)` — 158-169: подкласс поля ввода (включён только на WM_KEYDOWN). Защита `if (hEdit is null) return 0;` (после WM_DESTROY `clear()` обнуляет `hEdit`, а подкласс ещё жив). VK_UP/VK_DOWN → `smartBox.navigate(navPrev/navNext)`, возврат 1; иначе `hEdit.doDefault()`.
- `private void initDialog()` — 171-178: `initSizes()` при первом показе; заголовок `"Методы модуля"`; `createControls()`; `SetWindowPos(TOPMOST, lastPos…)`; `onSize()`.
- `private void initSizes()` — 180-194: по `screenGeometry`: min = 1/5 ширины × 1/6 высоты экрана, max = 4/5 × 4/5; стартовая геометрия — левая граница на 3/8 ширины, ширина 1/4, верх на 1/6, высота 2/3.
- `private void createControls()` — 195-221: шрифт `GetStockObject(DEFAULT_GUI_FONT)`, `LOGFONT` с `lfHeight *= 10`, `getLogFontSizes(lf, sz)` → `editHeight = sz.cy + editFontDelta`; `CreateWindowEx(WS_EX_CLIENTEDGE, "Edit", … ES_NOHIDESEL | ES_AUTOHSCROLL | WS_TABSTOP, …, editID)`; `WM_SETFONT`; `attachWndToFunction(edit, WndFunc(this.EditProc), array<uint> = {WM_KEYDOWN})`; `smartBox.createWindow(this, WS_VISIBLE | WS_CHILD | …, WS_EX_CLIENTEDGE, hMainWnd, boxID)` (дочерний режим, в отличие от POPUP у подсказки); `AdjustWindowRectEx` + подгон высоты окна под целое число строк (`lastPos.bottom -= d`); `prepareItems()` → индекс текущего метода; `smartBox.setItems(filter())`; `setCurrentIdx(curentIdx)`.
- `private int prepareItems()` — 223-248: собирает `items` из `currentModule.smartItems` в порядке `idxs = {elProcEx, elFuncEx, elProc, elFunc}` (только методы); находит метод с максимальной `info.line <= currentLine` (метод, в котором стоит курсор); `sortItemsArray(items, true)`; возвращает индекс текущего метода либо -1.
- `private void onSize()` — 250-256: `MoveWindow(edit, 0, 0, rc.right, editHeight, 1)`; список — под полем с зазором `ctrlDelta`.
- `private void onSizing(DWORD side, Rect& pRect)` — 257-272: при интерактивном изменении размера подрезает высоту (`side >= WMSZ_BOTTOM` → снизу, иначе сверху) до кратности `rowHeight`.
- `private void onMinMaxInfo(MINMAXINFO& mmi)` — 274-279: `ptMinTrackSize/ptMaxTrackSize`.
- `private void onMove()` — 281-283: `smartBox.onParentPosChange()`.
- `private void onCommand(WPARAM w, LPARAM l)` — 285-297: `mbaCancel` → `endDialog(0)`; `mbaOK` → текущий элемент списка → `endDialog(item.info.line)`; `edit == l && EN_CHANGE == (w >> 16)` → `onChangeEdit`.
- `private void onChangeEdit()` — 298-301: `smartBox.setItems(filter()); smartBox.setCurrentIdx(0)`.
- `private void endDialog(int res)` — 303-306: запоминает `lastPos` (`GetWindowRect`), `EndDialog`.
- `private void clear()` — 308-313: обнуляет `hMainWnd`, `hEdit`, `items`, `fItems`.

**Функции файла.** Кроме методов класса — только глобальная ссылка `methodsDialog` (315).

**Перехваты.** Нет. (Команда Ctrl+1 обрабатывается в com_snegopat.as:132-139, который создаёт диалог и вызывает `show(mtp.moduleElements, curPos.line)`; com_windows.as:33 и textwnd.as:398 проверяют `methodsDialog.opened`.)

**Используемые API.** WinAPI: `DialogBoxIndirectParam`, `GetModuleHandle`, `CreateWindowEx`, `GetStockObject`, `GetObjectW`, `SendMessage`, `SetWindowPos`, `MoveWindow`, `GetClientRect`, `GetWindowRect`, `AdjustWindowRectEx`, `GetWindowLong`, `GetWindowText(Length)`, `EndDialog`, `SetWindowText`; движковые: `ThunkToFunc`, `attachWndToFunction`/`WndFunc`/`ASWnd`, `SmartBoxWindow`, `sortItemsArray`, `getLogFontSizes`, `screenGeometry`, `StringComparator`, `toRect`/`toMINMAXINFO`, `mainFrame`, `dbgLog`.

**Взаимодействия.** Использует `currentModule` и `ModuleElements.smartItems`/`ModuleMethodItem.info.line` из ModuleElements.as; `compareUcaseLetters` из intellisite.as. Предоставляет `methodsDialog` для com_snegopat.as (открытие), com_windows.as и textwnd.as (проверка открытости).

**Версионные ветки.** Нет.

**Особенности.** (1) Шаблон диалога собирается вручную побайтово в куче (36-47) — вместо ресурса. (2) Переиспользование `SmartBoxWindow` внутри обычного диалога (дочернее окно, а не POPUP). (3) Подгон высоты диалога под целое число строк списка — и при создании, и в WM_SIZING. (4) Защиты от повторного показа (`opened`) и от «запаздывающей» клавиши после WM_DESTROY (`hEdit is null`). (5) Позиция окна и минимальные размеры сохраняются между показами в течение сессии (не персистентны).

---

## smartboxitems.as (119 строк)

**Назначение.** Файл-описание контрактной стороны нативного списка Снегопата: документирует (в комментарии, строки 13-84) интерфейсы, которые snegopat.dll регистрирует в скриптовом движке до запуска скриптов — `SmartBoxItemData`, `SmartBoxItemBaseIface`, `SmartBoxSite`, `SmartBoxWindow`, `enum NavigateType`, глобальный `sortItemsArray` — и определяет скриптовые `enum imagesIdx` и базовый класс `SmartBoxItem`, от которого наследуются все элементы списков во всей группе.

**Инициализация.** Нет (ни пакетов, ни опций, ни глобальных объектов).

**Типы.**

Документированные в комментарии нативные контракты (строки 13-84):
- `class SmartBoxItemData` — поля: `string descr` (отображаемый текст), `string key` (ключ сортировки, окном не используется; сравнение в `sortItemsArray` регистрозависимое, поэтому владелец сам приводит ключи к одному регистру), `uint hotOrder` (дополнительный ключ сортировки, см. HotWords), `uint8 image` (индекс пиктограммы снегопата), `bool exclude` (временно не выводить элемент).
- `interface SmartBoxItemBaseIface` — `SmartBoxItemData& data()`, `void textForTooltip(string& text)`; реальный элемент должен наследоваться от интерфейса и иметь поле `SmartBoxItemData` первым — для оптимизации доступа нативного движка к данным.
- `interface SmartBoxSite` — `void onDoSelect(SmartBoxItemBaseIface@ pSelected)`, `bool onKeydown(uint wParam, uint lParam)`, `void onChar(uint wParam, uint lParam)`, `bool onKillFocus()`; false — дефолтная обработка.
- `class SmartBoxWindow` — `createWindow(SmartBoxSite&& site, uint styles, uint exStyles, uint hWndParent = 0, uint ctrlID = 0)`, `setItems(?& items)` (окно отображает элементы как есть; фильтрацию и сортировку делает владелец), `setCurrentIdx(uint)`, `fullHeight(int items = -1)`, `onParentPosChange()`, `navigate(NavigateType to)`, свойства `hwnd`, `rowHeight`, `currentIdx`.
- `enum NavigateType` — `navFirst = 0, navLast = 1, navNext = 2, navPrev = 3, navNextPage = 4, navPrevPage = 5`.
- `void sortItemsArray(?& itemsArrray, bool asc)` — глобальная сортировка массива `array<SmartBoxItem>` по `hotOrder` и `key`; нужна, так как универсальная скриптовая сортировка медленна.

`enum imagesIdx` (87-102) — индексы стандартных пиктограмм: `imgNone, imgPublicMethod, imgPublicVar, imgKeyword, imgType, imgParenthesis, imgMethodWithKey, imgVarWithKey, imgLocalVar, imgEvent, imgCmnModule, imgEnums, imgCtxMethod, imgCtxVar`.

`class SmartBoxItem : SmartBoxItemBaseIface` (104-119):
- Поле `SmartBoxItemData d` — первое свойство класса (требование контракта).
- `SmartBoxItemData& data()` — 106-108: возвращает `d`.
- `void textForTooltip(string& text)` — 109-111: тултип = `d.descr`.
- Конструктор `SmartBoxItem(const string& descr, imagesIdx img)` — 112-118: `d.descr = descr`, `d.key = descr.dup().makeLower()` (ключ — нижний регистр описания), `d.exclude = false`, `d.hotOrder = 0`, `d.image = img`.

**Функции файла.** Нет свободных функций.

**Перехваты.** Нет.

**Используемые API.** Только нативные типы snegopat.dll (`SmartBoxItemBaseIface`, `SmartBoxItemData`).

**Взаимодействия.** `SmartBoxItem` — общий предок: `SmartBoxInsertableItem` (intellisite.as:22), `KeywordItem`/`DirectiveItem` (keywords.as), `V8StockItemBase` и все его наследники (StockListInterceptor.as), `ModuleMethodItem`/`ModuleVarItem`/`LocalVarSmartItem`/`CommonModuleItem`/`Delimeters::Item` (ModuleElements.as), `BuiltinFuncItem`/`TypeNameItem`/`ItemAfterType`/`ItemAfterQueryType`/`GlobalContextMethod`/`GlobalContextProp`/`SysEnum`/`ExtContextMethod`/`ExtContextProp` (typereader.as), `V8TemplateItem`. `imagesIdx` используется во всей группе.

**Версионные ветки.** Нет.

**Особенности.** Файл фактически — «заголовочный»: главный смысл — закомментированное описание нативного API (единственное место, где описан контракт `SmartBox*`), плюс конструктор, гарантирующий нижнерегистровые ключи (на этом держится регистрозависимое сравнение в `sortItemsArray`).

---

## keywords.as (339 строк)

**Назначение.** Словари ключевых слов языка 1С (английские и русские) с шаблонами вставки, механизмом обратных вызовов до/после вставки (`formatAfterInsert`, `insertForReturn`, `selectTypeAfterInsert`), и наборы директив компиляции (`&НаСервере` и т.п.) для разных типов модулей. Класс `Keywords` умеет по результату парсинга (`ParseMethodResult`) помечать недопустимые грамматикой слова через `d.exclude`.

**Инициализация.** Пакетов/OptionsEntry нет. Синглтоны: `oneKeywords`/`getKeywordsGroup()` (keywords.as:5-10), глобальный `DirecivesSet direcivesSet;` (строка 339). Читает глобальную `useLangs` из intellisite.as и глобальную `lastParseMethodResult` из ModuleTextProcessor.as.

**Типы.**

`class Keywords` (12-214):
- `array<SmartBoxItem&&> keywordsEng` (13-61) — фиксированный список от `If_EndIf` до `Val`; комментарий (14-19): порядок и состав менять нельзя — парсер снегопата выдаёт номера допустимых ключевых слов (`kwIf..kwVal`) именно в этом порядке; можно менять только шаблоны вставки; дополнительные варианты добавляются после `Val` с ручной правкой `processParseResult`. Каждый элемент — `KeywordItem(name, шаблон[, afterInsert][, makeInsert])`; символ `¦` — позиция каретки. Последний элемент массива — `null` со комментарием «Странный глюк, вместо последнего элемента добавляет null» (60). Дополнительный вариант: `For_To_Do` (59).
- `array<SmartBoxItem&&> keywordsRus` (62-169) — аналогично от `Если_КонецЕсли` до `Знач`; дополнения: `Для_По_Цикл` (102) и два расширенных шаблона обработки исключений по стандарту 1С (ссылка its.1c.ru/db/v8std/content/499/hdoc в комментариях шаблонов): `Попытка_сервер` (103-124) и `Попытка_клиент_сервер` (125-167, с серверной процедурой `&НаСервере Процедура ВыполнитьОперациюСервер()`); завершающий `null` (168).
- Конструктор `Keywords()` — 170-174: `keywordsEng.resize(length - 1)` и то же для русских — убирает «глючный» последний null.
- `void processParseResult(ParseMethodResult&& result, IntelliSite&& isite)` — 175-213: обходит `iKeyVal` от `kwIf` до `kwVal`, для каждого спрашивает `result.isKeywordAllowed(iKeyVal)`; допустимо — снимает `exclude` у пары eng/rus (по одному индексу `idx`), иначе ставит. Если `allExclude` — выход без добавления групп. Дополнительные варианты: `idxOfFor = kwFor - kwIf`, `idxOfExtFor = kwVal - kwIf + 1` — копирует `exclude` обычного «Для» на «Для_По_Цикл» (194-195); при `useLangs & useLangRus` — копирует `exclude` «Попытки» на два русских дополнения (`idxOfExtTry = kwVal - kwIf + 2`, 198-202); при обоих языках русский `Null` всегда исключается (`keywordsRus[kwNull - kwIf].d.exclude = true`, 206-207); в конце `isite.addItemGroup(keywordsEng/Rus)` по флагам `useLangs` (209-212).

`funcdef void FMakeInsert(KeywordItem&, string&)` и `funcdef void FAfterInsert(KeywordItem&, TextWnd&&)` (216-217).

`class KeywordItem : SmartBoxInsertableItem` (219-243): поля `string insertStr`, `FMakeInsert&& fInsert`, `FAfterInsert&& fAfterInsert`; конструктор `(name, ins, fai = null, fi = null)` с `imgKeyword`; `textForTooltip` — `"Вставка ключевого слова §" + d.descr` (§ — символ каретки symbCaret в тексте подсказки); `textForInsert` — `insertStr` + вызов `fInsert(this, text)`; `updateInsertPosition` пустой; `afterInsert` — вызов `fAfterInsert`.

Свободные функции-колбэки:
- `void formatAfterInsert(KeywordItem& item, TextWnd&& editor)` — 245-261: после вставки блочного ключевого слова выделяет текущую строку (при многострочной вставке — строку выше: `if (item.insertStr.find('\n') >= 0) begSel.line--`), шлёт `sendCommandToMainFrame(CommandID(cmdGroupTxtEdt, cmdTxtFormatBlock))` (форматирование блока платформой), затем восстанавливает каретку с поправкой на изменившийся отступ (`indentRex`).
- `void insertForReturn(KeywordItem& item, string& text)` — 263-265: для «Возврат» — внутри процедуры без добавок (`lastParseMethodResult.isFlagSet(inProcedure)` → без курсора), иначе `" ¦"`, всегда + `";"`.
- `void selectTypeAfterInsert(KeywordItem& item, TextWnd&& editor)` — 267-271: для «Новый» — `addTypeStores(ist, lastParseMethodResult.allowedAccesses)` и повторный `ist.show(editor, "")` (список имён типов).

`class DirectiveItem : SmartBoxInsertableItem` (273-284): конструктор обрезает первый символ ключа — `d.key = d.key.substr(1)` (изначально ключ = "&НаСервере" с амперсандом); `textForTooltip` — `"Вставка директивы §…"`, `textForInsert` — `d.descr + "\n"`.

`enum DirectivesSet { dirSetNone, dirSetForm, dirSetCommand, dirSetCommonModule }` (286-291).

`class DirecivesSet` (293-337; имя класса с опечаткой — одной «r»):
- Поля — предсозданные `DirectiveItem` в обоих языках: `atServerE "&AtServer"`, `atClientE "&AtClient"`, `atClientAtServerE "&AtClientAtServer"`, `atServerNoContextE "&AtServerNoContext"`, `atClientAtServerNoContextE "&AtClientAtServerNoContext"` и русские пары (294-303); наборы: `formsEng/formsRus` — 4 директивы (клиент, сервер, сервер/клиент без контекста), `cmdsEng/cmdsRus` — 3, `cmnmEng/cmnmRus` — 2 (304-309).
- `void processResult(ParseMethodResult&& parseResult, DirectivesSet ds, IntelliSite&& isite)` — 311-336: при `parseResult.isFlagSet(allowDirective)` добавляет группы, соответствующие `ds`, с учётом `useLangs`.

**Функции файла.** Перечислены выше (formatAfterInsert, insertForReturn, selectTypeAfterInsert, getKeywordsGroup).

**Перехваты.** Нет.

**Используемые API.** `IntelliSite` (addItemGroup), `TextWnd`/`ITextEditor` (getCaretPosition, setSelection, setCaretPosition), `getTextLine`, `indentRex`, `sendCommandToMainFrame`, `CommandID(cmdGroupTxtEdt, cmdTxtFormatBlock)`, `lastParseMethodResult` (`isFlagSet(inProcedure)`, `allowedAccesses`), `addTypeStores` (ModuleTextProcessor.as:700), `SmartBoxInsertableItem`.

**Взаимодействия.** Вызывается из ModuleTextProcessor.activateInModule (строка 426: `getKeywordsGroup().processParseResult(parseResult, isite)`) и `direcivesSet.processResult` (435). Сам вызывает `IntelliSite.show` (через selectTypeAfterInsert) и `addTypeStores`.

**Версионные ветки.** Нет.

**Особенности.** (1) Жёсткая связь порядка массивов с нумерацией `kwIf..kwVal` нативного парсера — перестановка слов ломает разметку `exclude`; индексы дополнений вычисляются как смещения от `kwIf`/`kwVal` (194, 199). (2) Workaround с `null` в конце инициализирующих массивов (60, 168). (3) Три больших «стандартных» шаблона Попытки по std 1С. (4) Опечатка имени класса `DirecivesSet` (у enum имя корректное `DirectivesSet`). (5) `#include "../../all.h"` (строка 3) — на уровень глубже, чем в остальных файлах группы (`../all.h`); безопасно лишь потому, что включения вырезаются препроцессором.

---

## StockListInterceptor.as (641 строк)

**Назначение.** Перехват штатной контекстной подсказки 1С: ловится `IAssistList::getDataSource` объекта-списка платформы, состав списка вычитывается через закладки источника данных, преобразуется в элементы Снегопата (`V8Stock*`) и показывается собственным списком `IntelliSite`; платформе взамен отдаётся пустой результат. Дополнительно — перехват `ISourceLexer::splitToLexems` для подмены комментариев `//:` пробелами (типизация переменных комментариями). Содержит механизм отложенного показа на простое и проверку устаревания списка для 8.3.24–8.3.27.

**Инициализация.** Единственный в группе файл с настоящим пакетом:
- `Packet stdListIntercept("stdListIntercept", hookStdList, piOnMainEnter)` (строка 10) — инициализация на входе главного цикла, без зависимостей.
- `OptionsEntry oeEnableHookStdList("HookStdList", дефолт true)` — 17-19: включает подмену списка; сеттер дополнительно вызывает `hookStdList()` для немедленного применения.
- `OptionsEntry oeEnableHidingRemark("EnableHidingRemark", дефолт true)` — 21-23: включает перехват лексера (скрытие `//:` из разбора); сеттер тоже вызывает `hookStdList()`.
- Глобальные: `TrapVirtualStdCall trStdListIntercept` (26), `TrapVirtualStdCall trSourceSplitLexems` (27), `CellFormat cellFormat` (29), `bool enableHookStdList`, `enableHidingRemark`, `uint trapCallNo` (81), замеры `SLOW_LIST_MS = 200`, `lastListItems`, `lastListLoopMs`, `lastListShowMs` (33-34).

**Типы.**

Классов-неэлементов нет; все классы — элементы списка:

`class V8StockItemBase : SmartBoxInsertableItem` (399-451) — базовый элемент «стокового» списка. Поле `string insert` — готовый текст вставки, `TextPosition tpStart` — точка замены.
- Конструктор `(const string& d, imagesIdx img, IV8Bookmark&& b, IAssistList&& l, IV8DataSource&& vd)` — 403-411: получает текст вставки через `l.textByBookmark(vd, b, ins, tpStart, caretPos)`; если `caretPos < insert.length`, в `insert` вставляется `symbCaret` (позиция каретки, которую задумала платформа).
- `void updateInsertPosition(...) override` — 412-439: `start = tpStart`; если слева от каретки матчится `typeMethodOnLeft` («Тип("»/«Type("») — сдвигает `end.col++`, перестраивает `insert` так, чтобы курсор встал внутрь кавычек (`insert.substr(0, len-1) + "¦\""`); если справа нет кавычки (`quoteOnRight`) — добавляет `")"`, при наличии справа закрывающей скобки (`closedBracketOnRight`) — ещё `end.col++`; если хвост строки пуст — `";"`.
- `void textForInsert(string&out text)` — 440-443: `insert`.
- `void textForTooltip(string& text)` — 444-447: `getCategory() + " " + d.descr`; `string getCategory()` — 448-450: `"Элемент списка"` (переопределяется).

`class V8StockKeyword : V8StockItemBase` (453-499):
- `getCategory()` — «Ключевое слово» (457).
- `updateInsertPosition` — 458-477: вызывает базовый и затем для русских ключей подменяет `insert` блочным шаблоном: `"если"` → `"Если ¦ Тогда\nКонецЕсли;"`, `"для"` → `"Для ¦ Цикл\nКонецЦикла;"`, `"пока"`, `"попытка"`, `"процедура"`, `"функция"`, `"возврат"` → `"Возврат ¦;"`, `"иначеесли"`; всегда `notIndent = true`.
- `afterInsert(TextWnd&& editor)` — 478-498: если ключ из списка закрывающих (`конецесли, тогда, иначе, иначеесли, конеццикла, конецпроцедуры, концаункции, возврат, исключение, конецпопытки`) — выделить строку и послать `cmdTxtFormatBlock` (идентично `formatAfterInsert`); иначе для `"новый"` — `showV8Assist()`.

`class V8StockMethod : V8StockItemBase` (501-578):
- Поле `bool isFunction`; конструктор `(int from, const string& d, bool isFunc, IV8Bookmark&& b, IAssistList&& l, IV8DataSource&& vd)` — 504-519: пиктограмма по `from`: `tcfModuleSelf` → `imgPublicMethod`, `tcfCmnModule` → `imgCmnModule`, `tcfContext` → `imgCtxMethod`, иначе `imgMethodWithKey`.
- `getCategory()` — 520-538: «Процедура/Функция модуля | контекста | общего модуля» по `d.image`; если `builtinFuncs.contains(d.descr)` — «Встроенная функция»; иначе «Глобальная функция/Глобальный метод».
- `updateInsertPosition` — 539-571: базовый + (комментарий TODO: пересечение кода с `MethodInsertable::updateInsertPosition`): если последний символ `insert` — `(`, добавить `"¦"`; при `(` или `)` — если хвост строки пуст, добавить `");"`/`";"`, иначе приклеить `lastExpr` (первый токен после каретки) + `")"` и `end.col += lastExpr.length`.
- `#if ver >= 8.3.4 afterInsert` — 573-577: `showV8MethodsParams()`.

`class V8StockProp : V8StockItemBase` (580-613): пиктограммы `imgPublicVar/imgCmnModule/imgCtxVar/imgVarWithKey` по `from`; `getCategory()` — «Переменная модуля / Общий модуль / Свойство контекста / Глобальное свойство»; `updateInsertPosition` — базовый, для `imgCmnModule` — `insert += "."`; `afterInsert` — для `imgCmnModule` — `showV8Assist()`.

`class V8StockEnum : V8StockItemBase` (615-629): `imgEnums`, `getCategory()` — «Системное перечисление», `insert += "."`, `afterInsert` → `showV8Assist()`.

`class V8TemplateItem : SmartBoxInsertableItem` (631-641): элемент шаблонов (`textForInsert` убирает `[`/`]`); в показе не участвует — вставка шаблонов отключена (см. закомментированный цикл в `showAssistList`, 364-368).

**Функции файла.**
- `string tpstr(const TextPosition& tp)` — 12-14: форматирование `"[line, col]"`.
- `void logListTiming(const string& where, uint platformMs, uint totalMs)` — 35-42: строка «платформа N мс, разбор элементов N мс (шт.), показ N мс, всего N мс»; при `totalMs >= SLOW_LIST_MS` — `diagAlways("slow", "ПОДСКАЗКА МЕДЛЕННО: …")`, иначе `dbgLog`.
- `bool hookStdList()` — 45-79: установка/снятие перехватов. Если обе опции выключены — при `trapEnabled` снимает `trStdListIntercept` (`swap()`). Если `trapNotActive`: проверка `diagHook("list", true)` — перехват можно отключить через logs/diag.ini «hook.list=off» или флаг logs/nohook-list.on (53); `#if (8.3.24–8.3.27) listStaleCheck = diagHook("liststale", true)` (57-59); создание объектов: `currentProcess().createByClsid(CLSID_AssistList, IID_IAssistList, al)` (61) и `currentProcess().createByClsid(CLSID_SourceLexer, IID_ISourceLexer, lexer)` (71); `trStdListIntercept.setTrap(al, IAssistList_getDataSource, <raw или обычный хук по версии>)` (63-67); `trSourceSplitLexems.setTrap(&&lexer, ISourceLexer_splitToLexems, splitToLexemsTrap)` и немедленное отключение `swap()` (73-75) — лексер включается только на время `getDataSource`. Если `trapDisabled` — включение обратным `swap()`.
- `void retryStaleList()` — 96-100 (только 8.3.24–8.3.27): `sendCommandToMainFrame(CommandID(cmdFrameGroup, cmdFrameShowAssist))` — повторный запрос списка.
- `void showPendingList()` — 103-144 (только 8.3.24–8.3.27): отложенный показ на простое. Забирает `pendingListDs/Al/Wnd`; если `activeTextWnd` не тот — выход. Проверка устаревания: если каретка сдвинулась с момента перехвата (`pendingCaretLine/Col`): при движении вперёд по той же строке не более чем на 64 колонки и `staleRetries < STALE_RETRIES_MAX (=40)` — `idleHandlersSingle.insertLast(PVV(retryStaleList)); wakeIdle()` и выход (сброс счётчика через 3 с: `nowTick - staleRetryTick > 3000`); иначе — отказ без показа (131-134). Устаревание — потому что пока ждём простоя, пользователь печатает, и каждый запрос (~50 мс) успевает устареть (комментарий 91-93, инцидент «Лонмади» 2026-10-13: 625 мс ожидания). При успехе — `showAssistList(al, wnd, ds, nobk)` и `logListTiming("showPendingList (ожидание простоя …)")`.
- `void splitToLexemsTrap(ISourceLexer& pThis, const v8string& source, Vector& lexems)` — 288-295: замена `"//:"` на `"   "` в исходнике и вызов оригинала `pThis.splitToLexems(newSource, lexems)`; вокруг — `trSourceSplitLexems.swap()`. Трассировка `lex` с проверкой потока (`GetCurrentThreadId() == mainThreadId`).
- `bool showAssistList(IAssistList& lst, TextWnd&& wnd, IV8DataSource&& ds, IV8Bookmark&& bkmk)` — 298-396: преобразование стокового списка. Первым делом `getIntelliSite()` (комментарий: в его конструкторе инициализируется `typeContextInfoItem`). Приведения: `IGridUISource&& uisrc = cast<IUnknown>(ds)`, `IAssistListInfo&& ali = cast<IUnknown>(ds)`, `ITypeContextInfo&& tci = cast<IUnknown>(ali)`. Обход дерева закладок: `ds.getLinkedBookmark(&&item, item, ltFirstChild)` … `ltNext`; для каждого: имя через `uisrc.getCellFormat(item, 0, val, cellFormat)` (`validFields = cfText`); в 8.3.24–8.3.27 — свежий `CellFormat cf` на каждый элемент с ручным освобождением текста (`cf.text = ""`), т.к. общий `cellFormat` падал во frntend.dll (319-333). Классификация: `ali.realIndex(ali.indexFromBkmk(item), realIdx)`, `tci.info(realIdx, typeContextInfoItem, 0)`; `isMethod` → дедуп через `methods` и `V8StockMethod(typeContextInfoItem.from, name, haveRetVal, …)`; `from == tcfKeyword` → `V8StockKeyword`; `from == tcfTemplate` → в набор `templates` и `continue` (не показываются); иначе дедуп `props` и `V8StockEnum` (при `from == tcfGlobal && sysEnums.contains(name)`) или `V8StockProp`; фолбэк — `V8StockItemBase(name, imgType, …)`. Далее вычисление начального фильтра: `symbolsToCaret = caretPos.col - 1`, `beginOfLine` из строки, назад по `is_name_symbol` собирается `start`; `selected` сознательно не используется (комментарий 385-390: свой hotOrder вместо выбора платформы). Финал: `site.addItemGroup(itemsV8); site.show(wnd, start, selected, false)` (392-393; `snegoList=false` → рамка WS_BORDER), замеры `lastListLoopMs/lastListShowMs`.

**Перехваты.**
- `IAssistList_getDataSource` объекта `IAssistList` (CLSID `CLSID_AssistList`):
  - Для 8.3.24–8.3.27 — «сырой» хук `IAssistList_getDataSourceTrapRaw` (148-205): funcdef `GDS_raw` с 15 аргументами `size_t` — типизированные ссылки в AngelScript (copy-in/copy-out) затирали выходные параметры платформы, и вызывающий получал пустой источник данных → падение (комментарий 146-147). Хук: включает `trSourceSplitLexems` (если `enableHidingRemark`), вызывает оригинал тем же набором через `trStdListIntercept.getOriginal`, замеряет `pendingPlatformMs`. Раскладка 8.3.27 (комментарий 165-167): `result` — скрытый указатель возвращаемого значения (функция возвращает его же), `[result]` — указатель на источник данных (0 — списка нет), `[itemsCount]` — число элементов, `[bkmk]` — закладка выбора, `ures` — 64-битное значение (не код ошибки). Если `method <= 3 && enableHookStdList`, список непуст и `activeTextWnd.ted.self == editor` — данные оборачиваются (`toIUnknown(dsPtr)` + `AddRef`), запоминаются в `pendingList*`, показ планируется `idleHandlersSingle.insertLast(PVV(showPendingList)); wakeIdle()` (вложенный вход в скрипты из перехватчика падал с `asCONTEXT_ACTIVE` в Core.As, 178-179); затем платформе обнуляются `[result]`, `[itemsCount]` (иначе платформа разыменовывала пустой источник — падение frntend.dll, 272-276 в typed-хuke и 192-193 здесь) и `[bkmk]`.
  - Для остальных версий — типизированный хук `IAssistList_getDataSourceTrap(IAssistList& pThis, IV8DataSource&&& result, ITextEditor& editor, [8.3.8+] size_t i10, IV8Bookmark&&& bkmk, uint& itemsCount, size_t i1, size_t method, size_t i3 [, 8.3+ i4..i9])` (209-280): лог входа при `dbgOn` (включая чтение памяти `dbgSafeQword(i3..i10)`), включение лексер-хука, `trStdListIntercept.swap()` (off), вызов оригинала `pThis.getDataSource(...)`, обратные swap; `method > 3` — запрос параметров функции, не трогаем; если список непуст и редактор совпадает — `showAssistList(...)`, при успехе `&&result = null; &&bkmk = null` и (8.3.24–8.3.27) `itemsCount = 0`.
- `ISourceLexer_splitToLexems` → `splitToLexemsTrap` (см. выше) — включается только на время `getDataSource` и при `enableHidingRemark`.

**Используемые API.** Интерфейсы платформы: `IAssistList` (`getDataSource`, `textByBookmark`), `IV8DataSource` (`getLinkedBookmark`), `IV8Bookmark`, `IGridUISource` (`getCellFormat`), `IAssistListInfo` (`realIndex`, `indexFromBkmk`), `ITypeContextInfo` (`info`, приёмник `typeContextInfoItem`), `ISourceLexer`, `ITextEditor`; создание через `currentProcess().createByClsid` (CLSID `CLSID_AssistList`, `CLSID_SourceLexer`); mem::*: `mem::int_ptr[result]`, `mem::dword[itemsCount]` (чтение/запись памяти), `toIUnknown` + `AddRef`/`Release`; `TrapVirtualStdCall` (setTrap/getOriginal/swap/state: `trapEnabled`/`trapNotActive`/`trapDisabled`); WinAPI: `GetTickCount`, `GetCurrentThreadId`; diag: `diagHook`, `diagTraceOn`, `diagAlways`, `dbgOn`, `dbgLog`, `dbgHex`, `dbgSafeQword`, `dumpVtable`; команды: `CommandID(cmdFrameGroup, cmdFrameShowAssist)`, `commandState`, `sendCommandToMainFrame`; idle: `idleHandlersSingle`, `wakeIdle` (mainframe.as:155,161).

**Взаимодействия.** Использует `getIntelliSite()`, `site.show(..., snegoList=false)`; `activeTextWnd`, `getTextLine`, `is_name_symbol` (ModuleTextProcessor.as); `sysEnums`, `builtinFuncs`, `typeContextInfoItem` (typereader.as); `cellFormat` инициализируется в `prepareV8StockItems()` (typereader.as:277). Пакет `stdListIntercept` — единственная точка входа группы, работающая без участия текстового процессора.

**Версионные ветки.** `#if (ver >= 8.3.24 & ver < 8.3.28)` — блок строк 57-59, 63-67, 82-206 (raw-хук, pending/idle, stale-retry), 272-276 (`itemsCount = 0`), а также свежий `CellFormat` на элемент (319-333). `#if ver >= 8.3.8` — параметр `i10` (211-213, 242-244). `#if ver >= 8.3` — параметры `i4..i9` (218-220, 249-251).

**Особенности.** (1) Подмена списка через «кражу» источника данных: платформе отдаётся null-источник с нулевым количеством — серия падений frntend.dll задокументирована в комментариях и закрыта версионными ветками. (2) Отложенный показ через idle-очередь + повтор запроса при устаревании (лимит 40 повторов ≈ 3 с) — обход `asCONTEXT_ACTIVE` и race с печатью. (3) Дедупликация одинаковых имён (`methods`, `props`, `templates` — `NoCaseSet`) — платформа отдаёт дубли из разных контекстов. (4) Свёртка/типизация через `tcfKeyword/tcfTemplate/tcfGlobal/tcfContext/tcfModuleSelf/tcfCmnModule`. (5) `//:`-комментарии: подмена на пробелы только в потоке лексем — «нам не страшно, если и где-то внутри кавычек заменим, это только для контекстной подсказки» (285-287). (6) Возможность полного отключения хуков через diag.ini (`hook.list`, `hook.liststale`) и опции.

---

## ModuleTextProcessor.as (726 строк)

**Назначение.** Текстовый процессор модулей: реализация интерфейса `TextProcessor` (textwnd.as:25) для расширения «Встроенный язык». Принимает события редактора (символы, клавиши), выполняет «умный» Enter (перемещение каретки в заголовках циклов/условий), автозамены (`?`, `++`, `--`, `+=` и т.п.), и главную функцию — сборку полного списка подсказки Снегопата: метод/переменные текущего метода, элементы модуля, расширения контекста (метаданные/форма), стоковые глобальные методы/свойства, общие модули, ключевые слова, разделители, типы, директивы. Также файл содержит утилиты работы со строками текста и набор глобальных «добавляторов» элементов.

**Инициализация.** Пакетов нет — процессор создаётся фабрикой `createTextProcessor` в textwnd.as:115-119 при подключении документа с расширением `gTextExtModule`/`gTextExtModule1`. Опции:
- `oeEnableAutoReplaces("Autoreplace", дефолт true)` — 12-14 → `enableAutoReplaces`.
- `oeEnableSmartEnter("EnableSmartEnter", дефолт true)` — 17-19 → `enableSmartEnter`.
- `oeEnableSnegoList("EnableSmartList", дефолт true)` — 22-24 → `enableSnegoList`.
- `oeQACharsCount("QuickActivateCharsCount", дефолт 1)` — 27-29 → `qaCharsCount` — после скольких символов лексемы автоподсказка активируется.
- Глобальные: `ParseMethodResult&& lastParseMethodResult` (10) — последний результат парсинга (используется keywords.as при вставке); `enableSnegoList` и др.

**Типы.**

`class ModuleEditorData : EditorData` (32-37) — данные редактора: `bool needQuickActivate = true` (флаг «показать список при следующем допустимом вводе»).

`enum ActivateModes` (40-45): `modeNone` (нет контекста), `modeQuote` (внутри кавычек), `modeName` (в идентификаторе), `modePreproc` (в инструкции препроцессора).

`class ModuleTextProcessor : TextProcessor, ModuleTextSource` (112-486). Поля: `uint lastMethodBeginLine = 0`, `ModuleElements&& moduleElements`, `TextDoc&& td`, `DirectivesSet dirSet = dirSetNone`, `bool bOnlyMeths = false` (в модуле допустимы только методы — общий модуль/команда).

Методы:
- `void getModuleSourceText(v8string& text)` — 119-121: `td.tm.save(text)` — реализация `ModuleTextSource` (текст берётся из редактора, а не из метаданных — важно для несохранённых изменений).
- `void setTextDoc(TextDoc&& textDoc)` — 123-145: подключение/отключение к документу. Сброс `bOnlyMeths`, `dirSet`; если `textDoc.mdInfo is null` — «просто текст с расширением Встроенный язык» → новый `ModuleElements`, `source = this`; иначе — существующий/новый парсер через `getModuleElementsParser(textDoc.mdInfo.object, textDoc.mdInfo.mdPropUuid, this)` и `checkIsOnlyMeths`; при отключении (`textDoc is null`) — `removeModuleElementsParser(...)` для документа с mdInfo; `&&td = textDoc`.
- `void checkIsOnlyMeths(TextDocMdInfo&& mdInfo)` — 148-161: имя класса метаданных через `stringFromAddress(mdInfo.object.mdClass.getName(1))`: `"ОбщийМодуль"` → `bOnlyMeths + dirSetCommonModule`; `"Команда"`/`"ОбщаяКоманда"` → `bOnlyMeths + dirSetCommand`; `"Форма"` → `dirSetForm`; `mdPropUuid == gModSeance || gModOfMgr` → `bOnlyMeths`.
- `void connectEditor(TextWnd&& editor)` — 163: `&&editor.editorData = ModuleEditorData()`.
- `bool onChar(TextWnd&& editor, wchar_t symbol)` — 164-166: перехват Enter — `enableSmartEnter && symbol == '\r' && Shift не зажат && beforeSmartEnter(editor)` (true = Enter «съеден»).
- `void afterChar(TextWnd&& editor, wchar_t symbol)` — 167-201: главный диспетчер. Выход, если `editor !is activeTextWnd`. Ранний выход, если ничего не включено. `bItsNameSymbol = is_name_symbol(symbol)`; не-именной символ сбрасывает `needQuickActivate = true`. `'\r'` → `smartEnter(caretPos, editor)`. `getActivateMode(...)`; в `modeName` — `doAutoReplace(...)`, при успехе выход. Если `enableSnegoList` и (`symbol == 0` — принудительный вызов, или `qaCharsCount > 0`): при (`modeName` && имя-символ && `needQuickActivate` && `lastLexem.length >= qaCharsCount`) или `symbol == 0` → `activateInModule(...)`. Закомментированные ветки: `activateInString`, `activateInPreproc`, `ParamShow` (194-200).
- `bool onKeyDown(TextWnd&& editor, WPARAM wParam, LPARAM lParam)` — 202-220: навигационные клавиши (стрелки, Priro/Next, Home/End, Return, Back) → `needQuickActivate = true`; VK_DELETE → `moduleElements.parsed = false` (текст изменился — структура модуля устарела). Возврат false всегда.
- `bool beforeSmartEnter(TextWnd&& editor)` — 221-265: «умный» Enter. Срабатывает, если строка непуста до и после каретки и по краям каретки пробелы. Лексический разбор начала строки (`lex_provider.nextWithKeyword`): `kwFor` → mode 2 (если дальше `kwEach`) или 1; `kwIf`/`kwElsIf` → 3; `kwWhile` → 4. Затем слово после каретки: (mode 3 && `kwThen`) || (mode ≠ 3 && `kwDo`) → `newCol = strLine.length` (каретка в конец строки); (mode 1 && `lexEqual|kwTo`) || (mode 2 && `kwIn`) → `newCol = caretPos.col + (lex.start - lexSrc.start)/2 + lex.length + 1` и `eatEnter = true` (перенос за служебное слово, Enter не вставляется).
- `void itemInserted(TextWnd&& editor, SmartBoxInsertableItem&& item)` — 266-269: после вставки из списка `needQuickActivate = true`.
- `void smartEnter(TextPosition& caretPos, TextWnd&& editor)` — 272-310: разбор строки над кареткой: лексема `lexQuoteOpen` → если текущая строка не начинается с `|` (после ltrim) — вставить `"|" + indent` (отступ вычисляется из строки над: после `|` или `"` через `indentRex`) через `insertInSelection`; иначе `caretPos.col++` (каретка за уже стоящий `|`); лексема `lexRemark` при зажатом Shift → вставить `"// "` (продолжение комментария).
- `bool doAutoReplace(wchar_t symbol, const string&in lineBegin, TextPosition&in caretPos, TextWnd&& pTxtWnd)` — 312-373: автозамены. `'?'` → `ist.addItem(Delimeters::getDelimeter(Delimeters::question)); ist.show(pTxtWnd, "")` (список с вариантом `(, , )`). `len >= 3`; `"++"` → `replSymbol1="+"`, `replSymbol2="1"`; `"--"` → `"-","1"`; `"="` после одного из `+-*/%` → `replSymbol1 = prevSymbol`, `replSymbol2 = symbCaret`. Далее выделяется идентификатор слева (пропуск пробелов → `spaceSymbol = " "`, поиск начала по `is_first_name_symbol`, `;` — граница), формируется `replace = "=" + spaceSymbol + id + spaceSymbol + replSymbol1 + spaceSymbol + replSymbol2`; если хвост строки пуст — добавляется `";"`; замена выполняется `setSelection(caretPos-2, caretPos)` + `insertInSelection(..., replace, true, false)`.
- `void activateInModule(TextWnd&& editor, const string&in lastLexem, TextPosition& caretPos, ActivateModes mode, wchar_t symbol)` — 375-440: конвейер сборки списка (см. «Связи»): `getMethodText(editor.textDoc.tm, line, col, bOnlyMeths, methodText, directive)` (lexer.as:508) — текст текущего метода и его директива выполнения; при смене строки начала метода — `moduleElements.parsed = false`; `moduleElements.parse()`; `parseMethodText(methodText.cstr, line, firstLexem, moduleElements.preprocContextForLine(line))` → `ParseMethodResult` (нативный парсер snegopat.dll); `needQuickActivate = false`; `nothingToDone` → выход; `allowObjMethods | allowObjProps` → `showV8Assist()` («после точки пока не работаем, вызовем штатную подсказку», 395-399); `parseResult.allowedAccesses = fixupAccessModes(preprocContextesToAccessModes(parseResult.allowedPreprocContextes), directive)`; `&&currentModule = moduleElements`; `getIntelliSite()` (комментарий: должно быть первым — инициализирует глобальные структуры); наполнение при флагах `allowProcedure|allowFunction|allowModuleVar|allowGCProp`: `addLocalVariables` → `moduleElements.processParseResultForCurrentModule` → `ExtContextData(td.mdInfo).processParseResult` → `addV8stock` → `addCommonModules` → `addAutoLocalVariables`; `getKeywordsGroup().processParseResult`; при `wantDefVal` — разделители `Delimeters::quote` и `Delimeters::date`; `addTypes`; `direcivesSet.processResult(parseResult, dirSet, isite)`; `&&lastParseMethodResult = parseResult`; `isite.show(editor, lastLexem)`.
- `void activate(TextWnd&& editor)` — 441-449: принудительная активация (symbol=0) — `needQuickActivate = true; afterChar(editor, 0)`.
- `IMDContainer&& myMainContainer()` — 450-452: `editedMetaDataCont()` или `getMasterContainer(td.mdInfo.container)`.
- `void addCommonModules(ParseMethodResult&& result, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)` — 453-485: `getRunModeIsManaged(rootObj)`; если текущий модуль — не один из `gModStdApp/gModMngApp/gModExtCon/gModSeance`, добавляются методы глобального модуля приложения (`getModuleElementsParser(rootObj, managed ? gModMngApp : gModStdApp)` → `processParseResultForOtherModule`); перебор `rootObj.childCount(mdClassCmnModule)`: глобальные (`gcmIsGlobal`) — `getModuleElementsParser(obj, gModule).processParseResultForOtherModule`, остальные — `isite.addItem(CommonModuleItem(nameOfModule))` с дедупом через `propNames`.

`class ExtContextData` (493-597) — «методы и свойства, доступные в модуле напрямую» (расширение модуля метаданными/формой).
- Поля: `array<array<SmartBoxItem&&>> store` (по `scgProcedure/scgFunction/scgProperty`), `array<array<any>&&> extModules` (пары объект+свойство для последующего чтения их модулей).
- Конструктор `(TextDocMdInfo&& mdInfo)` — 497-573: `store.resize(scgLast)`; цепочка: `getMDEditService().getConfigMngrUI(uicfgmngr, mdInfo.object)` → `uicfgmngr.getTypesInfoProvider(tip)`; если `mdInfo.extObject` — `readUnknown(extObject, store, "Форма")`; как `IDataProviderInfo` — `defaultField(fieldId)`, `fieldInfo(fieldId, oneFieldInfo)` → типы основного реквизита (`oneFieldInfo.typeDomain.types(types)`): для каждого — `readType(pType.ref, tip, store, "ОсновнойРеквизитФормы")` и поиск объекта метаданных этого типа (`mdInfo.container.objByTypeId`) с перебором свойств `pClass.propCount()/getPropIDAt(x)` и `mdemh.moduleExpandType(propID) == pType.ref` → `addExtModule(pObj, propID)`; для формы — `ICustomForm.getFormController(pControlExt, fieldId)` → `readUnknown(..., "РасширениеЭУОсновногоРеквизитаФормы")`; для самого объекта — `mdemh.moduleExpandType(mdInfo.mdPropUuid) != IID_NULL` → `readType(typeID, tip, store, "Объект")`.
- `protected void addExtModule(IMDObject&& mdObj, const Guid& mdProp)` — 574-576: `extModules.insertLast(array<any> = {any(&&mdObj), any(mdProp)})`.
- `void processParseResult(ParseMethodResult&& res, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)` — 577-596: по флагам `allowProcedure/allowFunction/allowGCProp` — группы `store[scgProcedure/scgFunction/scgProperty]` через `resetExclude`/`checkNamesInSet`/`checkAccess`; затем для каждого `extModules[i]` — `getModuleElementsParser(obj, prop).parse()` + `processParseResultForOtherModule`.

**Функции файла.**
- `string getTextLine(TextManager&& tm, uint line)` и `void getTextLine(TextManager&& tm, uint line, v8string& s)` — 47-68: быстрое чтение строки; для ver < 8.3.19 — через `tm.getCashObject(u)` + `getLineFast(line, s, u)`, иначе `getLineFast(line, s)` («вроде в 19 кеша больше нет», 51).
- `bool my_is_alpha(wchar_t symbol)` — 70-72: `mem::byte[symbolClassTable + symbol] == symbAlpha` (таблица классов символов строится в main.as:51-56).
- `my_is_alnum`, `is_first_name_symbol` (alpha или `_`), `is_name_symbol` (alnum или `_`) — 74-84.
- `ActivateModes getActivateMode(TextManager&& tm, const TextPosition&in caretPos, string& beginOfLine, string& lastLexem)` — 88-110: формирует `beginOfLine` (строка до каретки: `rtrim("\r\n")`, `padRight(' ', symbolsToCaret)`, `setLength`), лексический разбор до последней лексемы (`lex_provider`/`lexem` из lexer.as): `lexPreproc` → `modePreproc`; `lexRemark|lexNumber|lexDateOpen|lexDate` → `modeNone`; `lexQuoteOpen` → `modeQuote`; иначе `modeName` (+ `lastLexem` для `lexName|lexDirective`).
- `uint fixupAccessModes(uint currentModes, execContextTypes direcrive)` — 599-615: по директиве метода маскирует режимы доступа: `ecAtServer`/`ecAtServerNoContext` → `& amSrv`; `ecAtClient` → `& (amThn | amThk | amWeb)`; `ecAtClientAtServer`/`ecAtClientAtServerNoContext` → `& (amSrv | amThn | amThk | amWeb)`; `ecNone` — без изменений.
- `bool getRunModeIsManaged(IMDObject&& mdRoot)` — 617-628: `mdRoot.mdPropVal(gMainRunMode, val)`; `val.toString` (ЗначениеВСтрокуВнутр) — предпоследний символ `== '1'`; строковое сравнение `"Управляемое приложение"` забраковано как неработающее при не-русской локализации (621-625).
- `void addLocalVariables(...)` — 630-640: не-авто локальные (`lv.type != lvAuto`) → `propNames.insert(lv.name)` + `LocalVarSmartItem` (при `allowModuleVar`); их имена перекрывают всё.
- `void addAutoLocalVariables(...)` — 642-650: авто-переменные (`lvAuto`), не перекрытые ранее добавленными именами.
- `void addV8stock(ParseMethodResult&& result, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)` — 652-693: стоковые группы из `v8stock`: `allowProcedure` → `stockGlobalProc`; `allowFunction` → `stockGlobalFunc` (+ при `inExpression` — `stockGlobalFuncInExpr` и `stockBuiltin`); `allowGCProp` → `stockGlobalProps` (+ при `inExpression` — `stockSysEnums`); каждая группа добавляется в `langCmn` всегда и в `langEng`/`langRus` по `useLangs`, через `resetExclude`/`checkNamesInSet`/`checkAccess`.
- `void addTypes(...)` — 695-698 и `void addTypeStores(IntelliSite&& isite, uint allowedAccesses)` — 700-707: при `allowNewTypes` — три группы `stockTypeNames` + `Delimeters::parenthesisWithBackSpace`.
- `void showV8Assist()` — 709-713: `CommandID(cmdFrameGroup, cmdFrameShowAssist)`; если `commandState & cmdStateEnabled` — `sendCommandToMainFrame`.
- `#if ver >= 8.3.4 void showV8MethodsParams()` — 716-726: если в профиле `TextAssist/BracketAutoAssist` включено авто-показывание параметров — `cmdFrameShowParams`.

**Перехваты.** Нет (класс получает события от textwnd.as:587-593 через `textDoc.tp`).

**Используемые API.** `ITextEditor`, `TextManager` (`save`, `getLineFast`, `getCashObject`), `lex_provider`/`lexem` (lexer.as), `getMDEditService()`/`IMDEditService`/`IConfigMngrUI`/`ITypesInfoProvider`/`IMDEditHelper`/`IMDEditModuleHelper`/`IMDObject`/`IMDClass`/`IMDContainer` (com_metadata.as), `IDataProviderInfo`/`ICustomForm`/`CompositeID`/`FieldInfo` (`oneFieldInfo`), `Value`/`v8string`, `GuidRef`/`Vector`, `insertInSelection`, `GetKeyState`, `regex`-глобалы lexer.as (158-168: `indentRex`, `endLineRex`, `whiteSpaceRex`, `typeMethodOnLeft`, `quoteOnRight`, `closedBracketOnRight`, `ucaseLetterRex`), нативные `parseMethodText`/`getMethodText`, `stringFromAddress`, `editedMetaDataCont`/`getMasterContainer`/`mdObjName`/`keyForSearchOpenedMD` (com_metadata.as).

**Взаимодействия.** Реализует `TextProcessor` (textwnd.as:25) и `ModuleTextSource` (ModuleElements.as:22); создаётся в textwnd.as:117. Использует: ModuleElements.as (`getModuleElementsParser`, `removeModuleElementsParser`, `currentModule`, `preprocContextForLine`, `processParseResultForCurrentModule/ForOtherModule`, элементы `ModuleVarItem/ModuleMethodItem/LocalVarSmartItem/CommonModuleItem/Delimeters`), keywords.as (`getKeywordsGroup`, `direcivesSet`), typereader.as (`addStockGroups`-данные `v8stock`, `prepareV8StockItems` косвенно), intellisite.as (`getIntelliSite`). Поставляет наружу: `lastParseMethodResult` (keywords.as:264,269), `getTextLine`/`is_name_symbol` (intellisite.as, StockListInterceptor.as), `addTypeStores` (keywords.as:269), `showV8Assist`/`showV8MethodsParams` (весь код afterInsert), `fixupAccessModes`, `getRunModeIsManaged`, `addCommonModules`-логика. Используется также com_snegopat.as:132 (доступ к `mtp.moduleElements` для Ctrl+1), synedit.as:92.

**Версионные ветки.** `#if ver < 8.3.19` — кэш `TextManager` в `getTextLine` (50-57, 62-67) и `smartEnter` (277-291). `#if ver >= 8.3.4` — `showV8MethodsParams` (715-726).

**Особенности.** (1) `needQuickActivate` — «одноразовый» флаг: список показывается на первом же символе идентификатора после навигационной клавиши, затем отключается до следующего события; длина лексемы сравнивается с `qaCharsCount`. (2) После точки подсказка Снегопата сознательно не работает — вызывается штатная (`showV8Assist`, комментарий «После точки пока не работаем», 396). (3) Определение режима запуска через 1С-сериализацию (ЗначениеВСтрокуВнутр) вместо локализуемых строк. (4) `checkAccess`-фильтрация по режиму исполнения (`amSrv/amThn/amThk/amWeb`) применяется к `parseResult.allowedAccesses`, но сама по-элементная проверка в ModuleElements.checkAccess — заглушка. (5) VK_DELETE инвалидирует кэш структуры модуля, но другие правки — нет (перепарсинг триггерится сменой `lastMethodBeginLine`).

---

## ModuleElements.as (350 строк)

**Назначение.** Разбор структуры модуля (процедуры/функции/переменные) с кэшированием парсеров по объектам метаданных и хранением готовых `SmartBoxItem`-элементов в группах. Даёт текст модуля нативному парсеру (включая хак с аллокацией ниже 4 ГБ на x64), наполняет список подсказки элементами текущего и «чужих» модулей, строит тултипы с комментариями-описаниями, и содержит пространство `Delimeters` (вставка скобок/кавычек).

**Инициализация.** Пакетов/опций нет. Глобальные: `currentModule` (строка 26) — модуль, для которого показывается подсказка (устанавливается в ModuleTextProcessor.activateInModule:404 и MethodsDialog.show:55); кэш `NoCaseMap<ModuleElements&&> allModuleElements` (192).

**Типы.**

`enum ElementStoreKind` (11-19): `elProcEx, elFuncEx, elVarEx, elProc, elFunc, elVar, elLast` — группы хранилища `smartItems`.

`interface ModuleTextSource` (22-24): `void getModuleSourceText(v8string& text)` — источник текста модуля.

`class ModuleElements` (28-138). Поля: `ModuleTextSource&& source`, `ModuleStruct&& modStruct` (результат нативного `parseModuleText`), `v8string moduleText` (должен жить, пока используется результат разбора), `string moduleName`, `array<array<SmartBoxItem&&>> smartItems` (по `elLast`), `uint allowedPreprocContextes = uint(-1)`, `bool parsed`, `int_ptr lowText` (копия текста ниже 4 ГБ).

Методы:
- `int_ptr textForParser()` — 39-58: на x86 — `moduleText.cstr`; на x64, если указатель уже < 0x80000000 — как есть; иначе `VirtualAlloc` под 4 ГБ: перебор подсказок адресов от `0x10000000` шагом `0x1000000` до `0x7F000000`, флаги `0x3000` (MEM_COMMIT|MEM_RESERVE), защита `PAGE_READWRITE` (4); размер `(bytes + 16 + 0xFFFF) & ~0xFFFF` (+16, потому что «парсер читает символ перед началом текста»); копирование `mem::memcpy(lowText + 16, src, bytes - 2)` + нуль-терминатор `mem::word`; комментарий: «snegopat.dll принимает указатель на текст как uint; кучевые адреса платформы 8.3.20+ выше 4 ГБ». При неудаче — `dbgLog` и исходный указатель (парсинг, вероятно, не удастся).
- `void freeLowText()` — 59-67: `VirtualFree(lowText, 0, 0x8000)` (MEM_RELEASE), только x64.
- Конструктор — 69-71: `smartItems.resize(elLast)`.
- `void clearResults()` — 73-80: очистка `smartItems`, `modStruct`, `freeLowText()`, `moduleText = ""`, `parsed = false`.
- `void parse()` — 82-100: защита `parsed`; `clearResults()`; `source.getModuleSourceText(moduleText)`; `&&modStruct = parseModuleText(textForParser(), allowedPreprocContextes)` (нативная функция snegopat.dll); переменные → `ModuleVarItem(this, var)` в `elVarEx`/`elVar` по `isExport`; методы → `ModuleMethodItem(this, meth)` в `elFuncEx/elProcEx/elFunc/elProc` по `isExport`/`isFunction`; `parsed = true`.
- `uint preprocContextForLine(uint line)` — 101-103: проброс в `modStruct`.
- `void processParseResultForCurrentModule(ParseMethodResult&& res, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames)` — 104-123: `allowProcedure` → группы `elProc` + `elProcEx`; `allowFunction` → `elFunc` + `elFuncEx`; `allowModuleVar` → `elVar`/`elVarEx` через `checkNamesInSet(..., propNames)` («имена переменных модуля надо проверять — возможно их перекрывают имена параметров и явных локальных переменных», 114); в конце все имена методов и переменных модуля добавляются в `methNames`/`propNames`.
- `void processParseResultForOtherModule(ParseMethodResult&& res, ...)` — 124-133: если `currentModule is this` — выход; только экспортные группы `elProcEx`/`elFuncEx`/`elVarEx`, причём всё через `checkNamesInSet` (не дублировать имена, уже добавленные из текущего модуля).
- `string nameOfModule() const` — 134-137: `"Этот модуль"` или `moduleName`.

Свободные функции:
- `array<SmartBoxItem&&>&& resetExclude(array<SmartBoxItem&&>&& items)` — 140-144: снимает `exclude` у всех (кэш-группы переиспользуются между показами).
- `array<SmartBoxItem&&>&& checkAccess(array<SmartBoxItem&&>&& items, uint access)` — 147-150: заглушка — «Тут должен быть цикл, устанавливающий exclude взависимости от доступности метода/переменной».
- `array<SmartBoxItem&&>&& checkNamesInSet(array<SmartBoxItem&&>&& items, NoCaseSet& set)` — 152-161: если имя уже в наборе — `exclude = true`, иначе `set.insert` — сквозная дедупликация между группами.
- `string moduleName(IMDObject&& obj, const Guid& mdProp)` — 188-190: `mdObjFullName(obj) + "." + mdPropName(mdProp)`.
- `ModuleElements&& findModuleElementsParser(IMDObject&& obj, const Guid& mdProp)` — 194-197: поиск в `allModuleElements` по `keyForSearchOpenedMD(obj, mdProp)`.
- `ModuleElements&& getModuleElementsParser(IMDObject&& obj, const Guid& mdProp, ModuleTextSource&& src = null)` — 199-208: создаёт при отсутствии (`me.moduleName = moduleName(...)`), вставляет в кэш; `source` — переданный или `MDModuleTextSource(obj, mdProp)`.
- `void removeModuleElementsParser(ModuleElements&& me, IMDObject&& obj, const Guid& mdProp)` — 210-213: `source = null`, удаление из кэша.

`class MDModuleTextSource : ModuleTextSource` (163-186): поля `IMDObject&& mdObj; Guid mdProp`; `getModuleSourceText` — `getMDEditService().getEditHelper(peh, mdObj)` → `IMDEditModuleHelper emh = peh.unk` → `emh.hasModule(mdProp, v)` → `emh.textOfModule(mdProp, true, text)`; иначе `text = ""`.

Элементы списка:
- `class ModuleMethodItem : SmartBoxInsertableItem, MethodInsertable` (215-240): `owner`, `info` (`ModuleStructMethod`); конструктор — `super(i.name, imgPublicMethod)`, `paramsCount = i.paramsCount()`, `isFunction = i.isFunction`; `textForTooltip` — `"Функция/Процедура имя(" + параметры через ", " + ")"` (+`" Экспорт"`) + `"\n" + owner.nameOfModule() + ", строка " + info.line` + блок комментария перед методом `getPreviousCommentBlock(info.beginPos, owner.moduleText.cstr)` (нативная функция).
- `class ModuleVarItem : SmartBoxInsertableItem` (242-259): `imgPublicVar`; тултип `"Перем имя[ Экспорт]\n<модуль>, строка N"` + комментарий.
- `class LocalVarSmartItem : SmartBoxInsertableItem` (261-276): `imgLocalVar`, хранит `LocalVarItem&& info` (из ParseMethodResult); тултип по `info.type`: `lvParam` → `"Параметр"`, `lvVar` → `"Перем"`, иначе `"Локальная переменная"` + имя.
- `class CommonModuleItem : SmartBoxInsertableItem` (278-291): `imgCmnModule`; вставка `d.descr + "."`; `afterInsert` → `showV8Assist()`.

`namespace Delimeters` (293-350):
- `enum Types` — `parenthesis, parenthesisWithBackSpace, squareBracket, quote, date, question, lastType`.
- `class Item : SmartBoxInsertableItem` (305-332): поля `string tt` (тултип), `string ins` (вставка), `bool noActivate`, `bool needSemicolon`; в конструкторе `d.hotOrder = uint(-1)` — разделители исключены из hot-сортировки; `textForInsert` — при `needSemicolon && getIntelliSite().isLineTailEmpty()` добавляет `";"`; `afterInsert` — `showV8Assist()` при `!noActivate`.
- `array<Item&&>&& items;` и `Item&& getDelimeter(Types type)` (334-348): ленивая инициализация шести элементов: `"(...)"`→`"(¦)"`; `"(...)"`→`"\x8(\"¦)"` (backspace перед скобкой — для вставки после уже набранного имени); `"[...]"`; `"\"...\""`; `"'...'"` (дата); `"(, , )"` → `"(¦, , )"` с `noActivate=true, needSemicolon=true`.

**Перехваты.** Нет.

**Используемые API.** Нативные: `parseModuleText`, `ModuleStruct`/`ModuleStructMethod`/`ModuleStructVar`, `getPreviousCommentBlock`, `keyForSearchOpenedMD`; метаданные: `getMDEditService`, `IMDEditHelper`/`IMDEditModuleHelper` (`hasModule`, `textOfModule`), `mdObjFullName`, `mdPropName`, `mdObjName`; WinAPI: `VirtualAlloc`/`VirtualFree`; `mem::memcpy`, `mem::word`, `mem::byte`; `NoCaseMap`/`NoCaseSet`, `dbgLog`, `formatInt`.

**Взаимодействия.** Используется ModuleTextProcessor.as (создание/кэш/parse/process*, `currentModule`), mlist.as (`currentModule.smartItems`, `parsed`, `parse`), keywords.as не использует, typereader.as не использует напрямую. Сам использует `showV8Assist` (ModuleTextProcessor.as:709) в `CommonModuleItem`/`Delimeters::Item`. `smartItems` наполняется элементами, наследующими `SmartBoxInsertableItem`/`MethodInsertable` из intellisite.as.

**Версионные ветки.** `#if x86 / #else` в `textForParser` (40-57) и `freeLowText` (60-67) — низкоадресная копия текста только для x64.

**Особенности.** (1) Хак `textForParser`: VirtualAlloc ниже 4 ГБ из-за усечения указателя до uint внутри snegopat.dll при адресах кучи 1С выше 4 ГБ (8.3.20+); +16 байт к копии, потому что парсер читает символ перед текстом; перебор подсказок адреса. (2) Кэш парсеров `allModuleElements` — один `ModuleElements` на пару (объект метаданных, guid свойства модуля): общий модуль с «Глобальный» и модуль объекта не парсятся заново при переключении окон (комментарий в ModuleTextProcessor.setTextDoc:129-131). (3) Группы `smartItems` переиспользуются между показами списка, поэтому везде `resetExclude` перед наполнением. (4) `checkAccess` — незавершённая функциональность (заглушка). (5) `Delimeters::parenthesisWithBackSpace` использует `\x8`-backspace — второй вариант скобок «вплотную» к набранному тексту.

---

## typereader.as (467 строк)

**Назначение.** Чтение информации о «стоковых» сущностях платформы 1С и подготовка предсобранных групп элементов списка: встроенные функции языка (`BuiltinFuncInfo`), имена типов для `Новый` (`TypeNameInfoSource`), методы и свойства глобального контекста (все классы категории `IID_IGlobalContextDef`, с распознаванием системных перечислений), а также чтение произвольных контекстов (`IContextDef`/`IContext`) для расширений модулей. Здесь же — элементы, показываемые после вставки типа (`ItemAfterType`, конструктор запроса `ItemAfterQueryType`).

**Инициализация.** Пакетов/опций нет. Глобальные приёмники данных (16-18): `TypeContextInfoItem typeContextInfoItem`, `ContextValueInfo contextValueInfo`, `FieldInfo oneFieldInfo` — «один глобальный приёмник… чтобы не дёргать каждый раз конструктор/деструктор»; инициализировать сразу нельзя, так как модуль с кодом инициализации ещё не готов; «Устройство смотреть в дизасме ITypeContextInfo::info, открыть модуль, нажать Ctrl+Пробел» (10-15). Хранилища: `grid<array<SmartBoxItem&&>> v8stock(stockLast, langLast)` (239), `NoCaseSet existingGlobalProps, sysEnums, builtinFuncs` (242-246). Вся подготовка — `prepareV8StockItems()`, вызываемая из конструктора `IntelliSite` (intellisite.as:116).

**Типы.**

- `class BuiltinFuncItem : SmartBoxInsertableItem, MethodInsertable` (20-30): `imgPublicMethod`, `isFunction = true`, `insertingString = name`, `paramsCount = pc`; тултип `"Встроенная функция §имя"`.
- `class TypeNameItem : SmartBoxInsertableItem` (32-77): поле `int hasCtorParams = -1` (не вычислено). `textForInsert` (38-61): лениво через `oneDesigner.__mapTypeNames.find(d.descr)` → `currentProcess().createByClsid(fnd.value, IID_IType, type)` → `type.hasCtor(i)` для i = 1..9 → `hasCtorParams = 1`; текст = имя + (`"¦"` при наличии конструктора) + (`";"` если `isLineTailEmpty()`). `textForTooltip` — `"Тип §имя"`. `afterInsert(TextWnd&& editor) override` (65-76): если есть конструктор — `isite.addItem(ItemAfterType())`; для `"Запрос"` — три `ItemAfterQueryType(0/1/2)`; `isite.show(editor, "")`.
- `class ItemAfterType : SmartBoxInsertableItem` (79-95): `"(...)"` → `"(¦)"`, `hotOrder = uint(-1)`; `#if ver >= 8.3.4 afterInsert` → `showV8MethodsParams()`.
- `class ItemAfterQueryType : SmartBoxInsertableItem` (97-154): поле `int type` (0/1/2), названия `"Конструктор запроса"` / `"+ Выполнить + Выбрать"` / `"+ Выполнить.Выгрузить"`. `textForInsert` — пустой текст, `d.descr = getIntelliSite().getCurrentLine()` (запоминает текущую строку). `afterInsert` (116-153): `queryText = oneDesigner._snegopat.parseTemplateString("<?"", ТекстЗапроса>", "Введите запрос")` — вызов конструктора запросов платформы; регэксп `"(?i)^\\s*(\\S+)\\s*=\\s*(?:Новый|New)\\s+(?:Запрос|Query)"` по текущей строке извлекает `varName`; параметры запроса ищутся регэкспом `"&(\\w+)"` (дедуп через `NoCaseMap<int> params`) и превращаются в `setParams` = цепочка `varName.УстановитьПараметр("имя", имя)` с `"¦"` после первого; для type 1 добавляется цикл `ВыборкаvarName = varName.Выполнить().Выбрать(); Пока ВыборкаvarName.Следующий() Цикл … КонецЦикла`, для type 2 — `РезультатvarName = varName.Выполнить().Выгрузить()`; подстановки `setParams/varName/%query%`; вставка `insertInSelection(..., text, true, true)`.
- `class GlobalContextMethod : SmartBoxInsertableItem, MethodInsertable` (156-166): `imgMethodWithKey`; тултип `"Метод глобального контекста §имя"`.
- `class GlobalContextProp : SmartBoxInsertableItem` (168-175): `imgVarWithKey`; тултип `"Свойство глобального контекста §имя"`.
- `class SysEnum : SmartBoxInsertableItem` (177-190): `imgEnums`; вставка `descr + "."`; `afterInsert` → `showV8Assist()`.
- `class ExtContextMethod : SmartBoxInsertableItem, MethodInsertable` (192-204): `imgCtxMethod`, поле `string context`; тултип `"Метод context::имя()"`.
- `class ExtContextProp : SmartBoxInsertableItem` (206-215): `imgCtxVar`, `context`; тултип `"Свойство context::имя"`.

`enum typeOfStockGroups` (217-226): `stockBuiltin` (встроенные методы), `stockTypeNames` (имена типов для Новый), `stockGlobalProc`, `stockGlobalFunc`, `stockGlobalFuncInExpr` («имеющие смысл только в выражениях, пока пусто»), `stockGlobalProps`, `stockSysEnums`, `stockLast`.

`enum langGroups` (228): `langEng, langRus, langCmn, langLast`.

`enum StockContextGroups` (230-235): `scgProcedure, scgFunction, scgProperty, scgLast` — индексы `store` в `ExtContextData` (ModuleTextProcessor.as).

**Функции файла.**
- `void addStockGroups(IntelliSite& site, typeOfStockGroups ts)` — 248-254: добавляет группу `ts` в `langEng`/`langRus` по `useLangs` и `langCmn` всегда.
- `void addAllStock(IntelliSite& site)` — 256-262: все группы всех языков.
- `void addBuiltinFunc(IntelliSite& site)` — 264-266; `void addTypeNames(IntelliSite& site)` — 268-270.
- `void prepareV8StockItems()` — 272-287: `typeContextInfoItem.init()`, `contextValueInfo.init()`, `cellFormat.init()`, `oneFieldInfo.init()`, затем `readBuiltinFuncs()`, `readTypeNames()`, `readGlobals()`.
- `void readBuiltinFuncs()` — 290-313: `currentProcess().createByClsid(BuiltinFuncInfo, IID_ITypeContextInfo, taInfo)`; для i < `taInfo.count()`: `taInfo.info(i, typeContextInfoItem, 0)` (англ.) и `1` (рус.); проверка `typeContextInfoItem.isMethod` обязательна — «если в настройках 1С включено "Отображать ключевые слова в списке", то сюда приходят и все ключевые слова» (296-298); `builtinFuncs.insert` обоих имён; одинаковые → `langCmn`, разные → `langEng` + `langRus`; элементы `BuiltinFuncItem(name, params)`.
- `void readTypeNames()` — 316-331: `createByClsid(TypeNameInfoSource, IID_ITypeNameInfo, tInfo)`; `tInfo.name(i, 0/1)`; аналогичное разделение по языкам, элементы `TypeNameItem`.
- `void readGlobals()` — 333-407: `currentProcess().getCategoryClasses(vecs, IID_IGlobalContextDef)`; обход всех CLSID (`GuidRef&& pClsid = toGuid(vecs.start)`): `createByClsid(pClsid.ref, IID_IContextDef, ctx)`, `IContextDefExt&& ext = ctx.unk`; методы: `ctx.methsCount()`, `hasRetVal(i)` → `stockGlobalFunc`/`stockGlobalProc`, `paramsCount(i)`, `methName(i, 0/1)`; дедуп `NoCaseSet allMethods` («некоторые методы и свойства дублируются в разных контекстах — разные реализации для разных режимов», 339-341); свойства: выбор создателя — если `!contextValueInfo.isMutable && 1 == typeDomainPattern.typesCount()`, создаётся значение типа (`IType.createValue`) и у него берётся `IEnumValCreator val.unk` → тогда `creator = createSysEnumItem`, `ts = stockSysEnums`, имена в `sysEnums` (367-392); дедуп `existingGlobalProps`; элементы через `funcdef SmartBoxItem&& CreateSmartBoxItem(const string& name)` (409-411: `createGlobalPropItem`/`createSysEnumItem`).
- `void readContextDef(IContextDef&& pDef, array<array<SmartBoxItem&&>>& store, const string& context)` — 414-440: методы → `ExtContextMethod` в `store[scgFunction/scgProcedure]`, свойства → `ExtContextProp` в `store[scgProperty]`; язык: если русское имя пусто или равно английскому — `lang = 1` (langCmn), иначе по `useLangs`.
- `void readUnknown(IUnknown&& pUnk, array<array<SmartBoxItem&&>>& store, const string& context)` — 444-453: пробует `IContextDef`, иначе `IContext` → `readContextDef`.
- `void readType(const Guid& clsid, ITypesInfoProvider& pTIP, ...)` — 455-467: `pTIP.dataProviderInfo(dpi, clsid)` → `readUnknown(dpi)`; иначе `currentProcess().createByClsid(clsid, IID_IUnknown, pUnk)` → `readUnknown`.

**Перехваты.** Нет.

**Используемые API.** `currentProcess().createByClsid` с CLSID `BuiltinFuncInfo`, `TypeNameInfoSource` и гуидами типов; интерфейсы: `ITypeContextInfo`, `ITypeNameInfo`, `IContextDef`/`IContextDefExt` (`propInfo`, приёмник `contextValueInfo`), `IType` (`hasCtor`, `createValue`), `IValue` → `IEnumValCreator`, `ITypesInfoProvider`/`IDataProviderInfo`; `TypeContextInfoItem`/`ContextValueInfo`/`FieldInfo` (нативные структуры-приёмники); `Vector`/`GuidRef`/`toGuid`; `oneDesigner.__mapTypeNames`, `oneDesigner._snegopat.parseTemplateString` (com_designer.as); `RegExp` (движковые регулярки); `grid`, `NoCaseSet`/`NoCaseMap`; `getIntelliSite()`, `showV8Assist`, `showV8MethodsParams`, `insertInSelection`.

**Взаимодействия.** Поставляет: `v8stock` (используется ModuleTextProcessor.addV8stock:652 и addTypeStores:700), множества `sysEnums` (StockListInterceptor.showAssistList:353, ModuleTextProcessor), `builtinFuncs` (StockListInterceptor.getCategory:532), `typeContextInfoItem`/`contextValueInfo`/`oneFieldInfo` (StockListInterceptor:340, ModuleTextProcessor.ExtContextData:520), `prepareV8StockItems` (intellisite.as:116), `readUnknown`/`readType` (ModuleTextProcessor.ExtContextData:514,527,556,570), `addBuiltinFunc`/`addTypeNames`/`addAllStock`. Использует: `useLangs` (intellisite.as), `SmartBoxInsertableItem`/`MethodInsertable` (intellisite.as), `IntelliSite.show`.

**Версионные ветки.** `#if ver >= 8.3.4` — `ItemAfterType::afterInsert` (90-94).

**Особенности.** (1) Однократная инициализация глобальных приёмников (`init()`) лениво, при первом `getIntelliSite()` — комментарии объясняют проблемы времени жизни и отсылку к дизассемблеру `ITypeContextInfo::info`. (2) Распознавание системных перечислений — «пробное» создание значения типа и проверка `IEnumValCreator`; признак — `!isMutable` и ровно один тип в домене. (3) `stockGlobalFuncInExpr` заведомо пуст («пока пусто»). (4) `ItemAfterQueryType` — генерация кода обхода выборки по шаблону с подстановкой имени переменной, параметров `&Параметр` и текста запроса из конструктора платформы. (5) Фильтр ключевых слов в `readBuiltinFuncs` зависит от настройки 1С «Отображать ключевые слова в списке».

---

## Связи внутри группы и с движком

**Контракт списка.** Нативный snegopat.dll до запуска скриптов регистрирует типы `SmartBoxItemData`, `SmartBoxItemBaseIface`, `SmartBoxSite`, `SmartBoxWindow`, `NavigateType`, `sortItemsArray` (описаны в smartboxitems.as:13-84). Все элементы — наследники `SmartBoxItem` (первое поле — `SmartBoxItemData d`); все «сайты» — наследники `SmartBoxSite` (`IntelliSite` в intellisite.as:79, `MethodsDialog` в mlist.as:18).

**Конвейер собственной подсказки (по вводу):**
1. `textwnd.as` при подключении документа с расширением `gTextExtModule`/`gTextExtModule1` создаёт `ModuleTextProcessor` (textwnd.as:115-119) и назначает его `textDoc.tp`; события редактора (textwnd.as:587-593) идут в `onKeyDown`/`onChar`/`afterChar`.
2. `afterChar` (ModuleTextProcessor.as:167) определяет контекст `getActivateMode` (лексер lexer.as), делает автозамены `doAutoReplace` (которые тоже могут открыть список — `?` → `Delimeters::question`) и при условиях вызывает `activateInModule` (375).
3. `activateInModule` разбирает текст: `getMethodText` (lexer.as:508) выделяет текст текущего метода, `ModuleElements.parse()` (ModuleElements.as:82) строит структуру модуля нативным `parseModuleText` (с копией текста ниже 4 ГБ на x64, ModuleElements.as:39), нативный `parseMethodText` даёт `ParseMethodResult` с флагами допустимости.
4. Наполнение `IntelliSite` слоями: локальные переменные (`addLocalVariables`) → методы/переменные модуля (`ModuleElements.processParseResultForCurrentModule`) → расширение контекста (`ExtContextData` → `readUnknown`/`readType` из typereader.as) → стоковые глобальные методы/свойства/перечисления/встроенные функции (`addV8stock` из `v8stock`, подготовленных typereader.readBuiltinFuncs/readTypeNames/readGlobals) → глобальные и общие модули (`addCommonModules`) → авто-локальные переменные → ключевые слова (`getKeywordsGroup().processParseResult`, пометка `exclude` по `isKeywordAllowed`) → разделители (`wantDefVal`) → типы (`addTypes`/`addTypeStores`) → директивы (`direcivesSet.processResult`).
5. `isite.show(editor, lastLexem)` (intellisite.as:141) фильтрует (`filter()`, 226), создаёт POPUP `SmartBoxWindow`, дальше ввод обслуживают `IntelliSite.onKeydown/onChar/onKillFocus`.
6. Выбор: `onDoSelect` (281) → `textForInsert`/`updateInsertPosition` элемента → `insertInSelection` (textwnd.as:63) → `updateHotOrder` → `hide()` → `textDoc.tp.itemInserted` (ModuleTextProcessor.as:266) → пост-обработка `afterInsert` элемента (форматирование блока `cmdTxtFormatBlock`, `showV8Assist`, `showV8MethodsParams`, повторный показ списка для типов).

**Конвейер перехвата штатной подсказки:** пакет `stdListIntercept` (StockListInterceptor.as:10, `piOnMainEnter`) ставит ловушки на `IAssistList_getDataSource` и `ISourceLexer_splitToLexems`. Платформа строит список → хук вычитывает элементы через `IV8DataSource`/`IGridUISource`/`IAssistListInfo`/`ITypeContextInfo` (`showAssistList`, 298) → создаёт `V8Stock*`-элементы и отдаёт их `getIntelliSite().show(wnd, start, selected, false)`; платформе возвращается пустой источник. При открытых ловушках лексер-хук обеспечивает видимость `//:`-комментариев как кода — что связывает перехват с типизацией комментариев в собственной подсказке.

**Скрытие списка при командах:** `checkCommandAndHideSmartBox` (intellisite.as:657), подключённый в main.as:216/223 к `ICommandTarget_onExecute` текстового редактора и текстового контрола, прячет `IntelliSite` перед любой разрешённой командой, кроме штатного показа подсказки `(IID_NULL, 600)`.

**Диалог методов:** команда Ctrl+1 (com_snegopat.as:132-139) берёт `ModuleTextProcessor.moduleElements` текущего окна и открывает `MethodsDialog.show` (mlist.as:48), который переиспользует `ModuleElements.smartItems` и `SmartBoxWindow`.

**Общие данные группы:** `useLangs` (intellisite.as) — какие языковые группы добавлять; `v8stock`/`sysEnums`/`builtinFuncs`/приёмники (typereader.as) — словари платформы; `lastParseMethodResult` (ModuleTextProcessor.as:10) — контекст для вставки (`insertForReturn`, `selectTypeAfterInsert`); `currentModule` (ModuleElements.as:26) — активный парсер модуля; кэш парсеров `allModuleElements`; `activeTextWnd` (textwnd.as:10) — окно, с которым сверяются перехватчик и `afterChar`; `hotItems` (профиль `Snegopat/HotWords`) — приоритет недавних вставок, применяемый `sortItemsArray` через `hotOrder`.

Таким образом, ядро группы — пара «`ModuleTextProcessor` (что и когда показывать) + `IntelliSite` (как показывать и вставлять)», окружённая поставщиками элементов: собственный парсер модулей (`ModuleElements`), словари платформы (`typereader`), словари языка (`keywords`) и перехватчик штатного списка (`StockListInterceptor`), а `mlist` — отдельный потребитель структур модуля.
