/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Перехват штатной контекстной подсказки 1С и подмена ее списком снегопата
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

Packet stdListIntercept("stdListIntercept", hookStdList, piOnMainEnter);

string tpstr(const TextPosition& tp) {
    return "[" + tp.line + ", " + tp.col + "]";
}

bool enableHookStdList;
OptionsEntry oeEnableHookStdList("HookStdList", function(v){v = true; },
    function(v){v.getBoolean(enableHookStdList); },
    function(v){v.getBoolean(enableHookStdList); hookStdList(); return false; });
bool enableHidingRemark;
OptionsEntry oeEnableHidingRemark("EnableHidingRemark", function(v){v = true; },
    function(v){v.getBoolean(enableHidingRemark); },
    function(v){v.getBoolean(enableHidingRemark); hookStdList(); return false; });

// Перехватчик запроса состава списка
TrapVirtualStdCall trStdListIntercept;
TrapVirtualStdCall trSourceSplitLexems;

CellFormat cellFormat;

// Замеры показа списка подсказки (для поиска «тормозов»): платформа строит список, Снегопат разбирает элементы и показывает свой.
// Медленные показы (>= SLOW_LIST_MS) пишутся в журнал всегда (категория slow), остальные — при трассировке.
const uint SLOW_LIST_MS = 200;
uint lastListItems = 0, lastListLoopMs = 0, lastListShowMs = 0;
void logListTiming(const string& where, uint platformMs, uint totalMs) {
    string t = where + ": платформа " + platformMs + " мс, разбор элементов " + lastListLoopMs + " мс (" + lastListItems + " шт.), показ " + lastListShowMs
        + " мс, всего " + totalMs + " мс";
    if (totalMs >= SLOW_LIST_MS)
        diagAlways("slow", "ПОДСКАЗКА МЕДЛЕННО: " + t);
    else
        dbgLog(t);
}

// Установка перехвата
bool hookStdList() {
    if (!enableHookStdList && !enableHidingRemark) {
        if (trStdListIntercept.state == trapEnabled)
            trStdListIntercept.swap();
        return true;
    }
    if (trStdListIntercept.state == trapNotActive) {
        if (!diagHook("list", true)) {
            doLog("Перехват списка подсказки отключён (logs/diag.ini «hook.list=off» или флаг logs/nohook-list.on)");
            return true;
        }

      #if (ver >= 8.3.24 & ver < 8.3.28)
        listStaleCheck = diagHook("liststale", true);
      #endif
        IAssistList&& al;
        currentProcess().createByClsid(CLSID_AssistList, IID_IAssistList, al);
        //dumpVtable(&&al);
      #if (ver >= 8.3.24 & ver < 8.3.28)
        trStdListIntercept.setTrap(al, IAssistList_getDataSource, IAssistList_getDataSourceTrapRaw);
      #else
        trStdListIntercept.setTrap(al, IAssistList_getDataSource, IAssistList_getDataSourceTrap);
      #endif

        // Теперь ставим перехват на разбор исходников 1Сом на лексемы.
        ISourceLexer&& lexer;
        currentProcess().createByClsid(CLSID_SourceLexer, IID_ISourceLexer, lexer);
        //dumpVtable(&&lexer);
        trSourceSplitLexems.setTrap(&&lexer, ISourceLexer_splitToLexems, splitToLexemsTrap);
        // И временно отключаем его
        trSourceSplitLexems.swap();
    } else if (trStdListIntercept.state == trapDisabled)
        trStdListIntercept.swap();
    return true;
}

uint trapCallNo = 0;
#if (ver >= 8.3.24 & ver < 8.3.28)
IV8DataSource&& pendingListDs;
IAssistList&& pendingListAl;
TextWnd&& pendingListWnd;
uint pendingCaretLine = 0, pendingCaretCol = 0;     // позиция курсора на момент перехвата: если к показу (простой) она другая — список устарел
bool pendingCaretKnown = false;
uint pendingPlatformMs = 0, pendingTick = 0;     // замер: сколько строила список платформа и когда мы его забрали (до показа на простое)
bool listStaleCheck = true;       // проверка устаревания списка (отключается hook.liststale=off в diag.ini); читается один раз при установке перехвата
// Список устарел (пока ждали простоя, пользователь набрал ещё буквы) — запрашиваем у платформы заново, уже для набранного префикса.
// Без этого меню в таком случае вообще не появлялось (журнал «Лонмади» 2026-10-13: 625 мс ожидания простоя, набрано «поль», список отброшен).
// Пока человек печатает, каждый запрос (~50 мс) успевает устареть из-за следующей буквы, поэтому повторяем, пока набор не остановится:
// не больше 40 повторов подряд (около 3 с непрерывного набора) (счётчик сбрасывается после успешного показа или через 3 с без повторов).
const uint STALE_RETRIES_MAX = 40;
uint staleRetries = 0, staleRetryTick = 0;
void retryStaleList() {
    if (activeTextWnd is null)
        return;
    sendCommandToMainFrame(CommandID(cmdFrameGroup, cmdFrameShowAssist));
}

// Отложенный показ списка Снегопата (вызывается на простое, вне перехватчика платформы)
void showPendingList() {
    if (pendingListDs is null)
        return;
    IV8DataSource&& ds = pendingListDs;
    IAssistList&& al = pendingListAl;
    TextWnd&& wnd = pendingListWnd;
    &&pendingListDs = null;
    &&pendingListAl = null;
    &&pendingListWnd = null;
    if (wnd is null || activeTextWnd is null || !(activeTextWnd is wnd))
        return;
    // 8.3.27: пока ждали простоя, пользователь мог продолжить набор — платформа освободила модель списка, и getCellFormat падал
    // (frntend.dll, 0xC0000005, 2026-10-08, «Лонмади»). Курсор сдвинулся → список устарел: не показываем (на новый ввод платформа запросит свежий).
    if (pendingCaretKnown && listStaleCheck) {
        TextPosition cur;
        wnd.ted.getCaretPosition(cur, false);
        if (cur.line != pendingCaretLine || cur.col != pendingCaretCol) {
            uint nowTick = GetTickCount();
            if (nowTick - staleRetryTick > 3000)
                staleRetries = 0;
            // курсор ушёл вперёд по той же строке — это набор букв: просим список заново
            if (staleRetries < STALE_RETRIES_MAX && cur.line == pendingCaretLine && cur.col > pendingCaretCol && cur.col - pendingCaretCol <= 64) {
                staleRetries++;
                staleRetryTick = nowTick;
                diagAlways("stale", "список устарел (курсор был " + pendingCaretLine + ":" + pendingCaretCol + ", стал " + cur.line + ":" + cur.col
                    + ", ожидание простоя " + (nowTick - pendingTick) + " мс) — запрашиваем заново, попытка " + staleRetries);
                idleHandlersSingle.insertLast(PVV(retryStaleList));
                wakeIdle();
            } else if (staleRetries >= STALE_RETRIES_MAX)
                diagAlways("stale", "список устарел и лимит повторов (" + STALE_RETRIES_MAX + ") исчерпан — меню не показано (курсор " + cur.line + ":" + cur.col + ")");
            else
                dbgLog("showPendingList: список устарел (курсор был " + pendingCaretLine + ":" + pendingCaretCol + ", стал " + cur.line + ":" + cur.col + ") — не показываем");
            return;
        }
    }
    IV8Bookmark&& nobk;
    dbgLog("showPendingList: показываем список снегопата");
    uint tIdleWait = GetTickCount() - pendingTick;
    staleRetries = 0;
    showAssistList(al, wnd, ds, nobk);
    logListTiming("showPendingList (ожидание простоя " + tIdleWait + " мс)", pendingPlatformMs, pendingPlatformMs + GetTickCount() - pendingTick);
}

// 8.3.27: перехватчик «сырой» — все 15 аргументов как size_t, без типизированных ссылок и копирования AngelScript (copy-in/copy-out ссылок
// затирал выходные параметры платформы, и вызывающий получал пустой источник данных → падение). Оригинал вызывается напрямую тем же набором.
funcdef size_t GDS_raw(size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t, size_t);
size_t IAssistList_getDataSourceTrapRaw(size_t pThis, size_t result, size_t editor, size_t i10, size_t bkmk, size_t itemsCount, size_t i1,
    size_t method, size_t i3, size_t i4, size_t i5, size_t i6, size_t i7, size_t i8, size_t i9) {
    trapCallNo++;
    if (enableHidingRemark)
        trSourceSplitLexems.swap();
    GDS_raw&& orig;
    trStdListIntercept.getOriginal(&&orig);
    uint tOrig = GetTickCount();
    size_t ures = orig(pThis, result, editor, i10, bkmk, itemsCount, i1, method, i3, i4, i5, i6, i7, i8, i9);
    pendingPlatformMs = GetTickCount() - tOrig;
    pendingTick = GetTickCount();    // ures — 64-битное значение (в 27 это не код ошибки): uint обрезал старшую половину
    if (enableHidingRemark)
        trSourceSplitLexems.swap();
    if (dbgOn())
        dbgLog("getDataSourceTrapRaw #" + trapCallNo + ": method=" + uint(method) + " items=" + mem::dword[itemsCount] + " result=" + dbgHex(mem::int_ptr[result])
            + " bkmk=" + dbgHex(mem::int_ptr[bkmk]) + " ures=" + dbgHex(ures));
    // Раскладка в 27 (по дизассемблеру): result (2-й аргумент) — скрытый указатель возвращаемого значения, функция его же и возвращает;
    // [result] — указатель на источник данных списка (0 — списка нет), [itemsCount] — число элементов, [bkmk] — указатель на закладку-выбор.
    // Если запрос состава списка (method 0..3), список непустой и окно текущее — показываем свой список и отдаём платформе пустой.
    if (uint(method) <= 3 && enableHookStdList) {
        size_t dsPtr = mem::int_ptr[result];
        if (dsPtr != 0 && mem::dword[itemsCount] > 0 && activeTextWnd !is null && activeTextWnd.ted.self == editor) {
            IUnknown&& h = toIUnknown(dsPtr);
            h.AddRef();                          // свой счётчик: handle отпустит его при выходе из блока
            IV8DataSource&& ds = h;
            IUnknown&& ua = toIUnknown(pThis);
            ua.AddRef();
            IAssistList&& al = ua;
            dbgLog("getDataSourceTrapRaw #" + trapCallNo + ": забираем список у платформы, элементов " + mem::dword[itemsCount] + " (показ — на простое)");
            // Сам показ откладываем на ближайший простой: из перехватчика платформа ещё обрабатывает сообщения, и вложенный вход в скрипты
            // (таймеры, idle) у Core.As падает с asCONTEXT_ACTIVE.
            &&pendingListDs = ds;
            &&pendingListAl = al;
            &&pendingListWnd = activeTextWnd;
            pendingCaretKnown = false;
            if (listStaleCheck) {
                TextPosition cp;
                activeTextWnd.ted.getCaretPosition(cp, false);
                pendingCaretLine = cp.line; pendingCaretCol = cp.col; pendingCaretKnown = true;
            }
            idleHandlersSingle.insertLast(PVV(showPendingList));
            wakeIdle();                          // без этого при пустой очереди показ ждал клика или мигания курсора (до 1,7 с)
            // забираем источник данных у платформы: обнуляем выходные поля и отпускаем её ссылку
            mem::int_ptr[result] = 0;
            mem::dword[itemsCount] = 0;
            h.Release();
            size_t bkPtr = bkmk != 0 ? mem::int_ptr[bkmk] : 0;
            if (bkPtr != 0) {
                IUnknown&& hb = toIUnknown(bkPtr);
                hb.AddRef();
                mem::int_ptr[bkmk] = 0;
                hb.Release();
            }
        }
    }
    return ures;
}
#endif

// Функция-перехватчик запроса состава списка
uint IAssistList_getDataSourceTrap(IAssistList& pThis, IV8DataSource&&& result,
    ITextEditor& editor,
#if ver >= 8.3.8
    size_t i10,
#endif
    IV8Bookmark&&& bkmk,
    uint& itemsCount,
    size_t i1,
    size_t method, size_t i3
#if ver >= 8.3
    , size_t i4, size_t i5, size_t i6, size_t i7, size_t i8, size_t i9
#endif
) {
    if (dbgOn()) {
        // значения аргументов, как их принял перехватчик (8.3.27: разбираем раскладку параметров getDataSource)
        string d = "getDataSourceTrap ВХОД: this=" + dbgHex(pThis.self) + " editor=" + dbgHex(editor.self) + " i10=" + dbgHex(i10) + " i1=" + dbgHex(i1)
            + " method=" + method + " i3=" + dbgHex(i3) + " i4=" + dbgHex(i4) + " i5=" + dbgHex(i5) + " i6=" + dbgHex(i6) + " i7=" + dbgHex(i7)
            + " i8=" + dbgHex(i8) + " i9=" + dbgHex(i9);
        dbgLog(d);
        dbgLog("  [i3]=" + dbgHex(dbgSafeQword(i3)) + " [i4]=" + dbgHex(dbgSafeQword(i4)) + " [i5]=" + dbgHex(dbgSafeQword(i5)) + " [i6]=" + dbgHex(dbgSafeQword(i6))
            + " [i7]=" + dbgHex(dbgSafeQword(i7)) + " [i1]=" + dbgHex(dbgSafeQword(i1)) + " [i10]=" + dbgHex(dbgSafeQword(i10)));
    }
    trapCallNo++;
    //Message("Intercept list " + method + " i1=" + i1 + " i3=" + i3);
    // Сначала включим перехват парсинга строк
    if (enableHidingRemark)
        trSourceSplitLexems.swap();
    // Вызовем настоящую функцию и получим состав списка
    trStdListIntercept.swap();
    uint tStart = GetTickCount();
    dbgLog("getDataSourceTrap #" + trapCallNo + ": перед оригиналом, method=" + uint(method) + " i3=" + dbgHex(i3) + " editor=" + dbgHex(editor.self));
    uint ures = pThis.getDataSource(result,
        editor,
    #if ver >= 8.3.8
        i10,
    #endif
        bkmk,
        itemsCount,
        i1,
        method, i3
    #if ver >= 8.3
        , i4, i5, i6, i7, i8, i9
    #endif
    );
    trStdListIntercept.swap();
    uint tPlatform = GetTickCount() - tStart;
    // Отключим перехват парсинга строк
    if (enableHidingRemark)
        trSourceSplitLexems.swap();
    dbgLog("getDataSourceTrap #" + trapCallNo + ": после оригинала: method=" + uint(method) + " items=" + itemsCount + " result=" + (result is null ? "null" : "ok")
        + " окно=" + (activeTextWnd is null ? "нет" : (activeTextWnd.ted is editor ? "то же" : "другое")) + " enable=" + enableHookStdList);
    if (uint(method) > 3 || !enableHookStdList)    // метод — int в младших 32 битах ячейки (старшая половина — мусор)
        return ures;    // Запрос при показе параметров функции

    // Если есть список и он не пуст и установлено активое текстовое окно и редакторы совпадают
    if (result !is null && itemsCount > 0 && activeTextWnd !is null && activeTextWnd.ted is editor) {
        // Если мы смогли вытащить состав и показать свой список
        dbgLog("getDataSourceTrap: список из " + itemsCount + " элементов, method=" + method);
        bool shown = showAssistList(pThis, activeTextWnd, result, bkmk);
        logListTiming("getDataSourceTrap #" + trapCallNo + " method=" + method, tPlatform, GetTickCount() - tStart);
        if (shown) {
            &&result = null;    // вернем вызывающему пустой список
            &&bkmk = null;      // чтобы не мешался
          #if (ver >= 8.3.24 & ver < 8.3.28)
            // 8.3.27: платформа разыменовывает пустой источник данных, если ей сказали, что элементы есть (падение в frntend.dll) —
            // отдаём ещё и нулевое количество
            itemsCount = 0;
          #endif
        }
    }
    return ures;
}

// Это перехват разбиения одинэсом исходников на лексемы.
// Наша цель - заменить комментарии вида "//:" на пробелы.
// Таким образом, можно будет задавать типизацию комментариями вида
//: Парам = Новый Структура
// Заменять будем простым реплэйсом, нам не страшно, если и где-то внутри кавычек
// заменим, это только для контекстной подсказки
void splitToLexemsTrap(ISourceLexer& pThis, const v8string& source, Vector& lexems) {
    if (diagTraceOn("lex"))
        diag("lex", "splitToLexemsTrap: поток " + GetCurrentThreadId() + (GetCurrentThreadId() == mainThreadId ? " (главный)" : " (ЧУЖОЙ, главный " + mainThreadId + ")"));
    trSourceSplitLexems.swap();
    v8string newSource = source.str.replace("//:", "   ");
    pThis.splitToLexems(newSource, lexems);
    trSourceSplitLexems.swap();
}

// Вытащим состав из стокового списка и создадим свой
bool showAssistList(IAssistList& lst, TextWnd&& wnd, IV8DataSource&& ds, IV8Bookmark&& bkmk) {
    // Получение сайта списка выносим в начало, так как в его конструкторе инициализируются
    // typeContextInfoItem
    IntelliSite&& site = getIntelliSite();

    array<SmartBoxItem&&> itemsV8;
    IGridUISource&& uisrc = cast<IUnknown>(ds);
    IAssistListInfo&& ali = cast<IUnknown>(ds);
    ITypeContextInfo&& tci = cast<IUnknown>(ali);

    if (diagTraceOn("vt")) {
        dbgLog("showAssistList: dump IGridUISource");
        dumpVtable(&&uisrc, "IGridUISource");
    }
    Value val;
    // Это для свёртки одинаковых названий
    NoCaseSet templates, methods, props;
    IV8Bookmark&& item;
    uint tLoop = GetTickCount();
    lastListItems = 0;
    for (ds.getLinkedBookmark(&&item, item, ltFirstChild); item !is null; ds.getLinkedBookmark(&&item, item, ltNext)) {
      #if (ver >= 8.3.24 & ver < 8.3.28)
        // 8.3.27: общий объект cellFormat между вызовами падал в платформе при освобождении прежнего текста (frntend.dll, функция
        // освобождения строки) — для каждого элемента берём свежий, полностью проинициализированный, и сами освобождаем его текст
        CellFormat cf;
        cf.init();
        cf.validFields = cfText;
        uisrc.getCellFormat(item, 0, val, cf);
        string name = cf.text;
        cf.text = "";
      #else
        cellFormat.text = "";
        cellFormat.validFields = cfText;
        uisrc.getCellFormat(item, 0, val, cellFormat);
        string name = cellFormat.text;
      #endif
        imagesIdx imgidx = imgType;
        SmartBoxItem&& newItem;

        if (ali !is null && tci !is null) {
            uint realIdx;
            ali.realIndex(ali.indexFromBkmk(item), realIdx);
            tci.info(realIdx, typeContextInfoItem, 0);
            if (typeContextInfoItem.isMethod) {
                if (!methods.insert(name))  // ключ уже был в наборе
                    continue;
                &&newItem = V8StockMethod(typeContextInfoItem.from, name, typeContextInfoItem.haveRetVal, item, lst, ds);
            } else if (typeContextInfoItem.from == tcfKeyword) {
                &&newItem = V8StockKeyword(name, item, lst, ds);
            } else if (typeContextInfoItem.from == tcfTemplate) {
                templates.insert(name);
                continue;
            } else {
                if (!props.insert(name)) // Ключ уже был в наборе
                    continue;
                if (typeContextInfoItem.from == tcfGlobal && sysEnums.contains(name))
                    &&newItem = V8StockEnum(name, item, lst, ds);
                else
                    &&newItem = V8StockProp(typeContextInfoItem.from, name, item, lst, ds);
            }
        }
        itemsV8.insertLast(newItem !is null ? newItem : V8StockItemBase(name, imgidx, item, lst, ds));
        lastListItems++;
    }
    lastListLoopMs = GetTickCount() - tLoop;
    // Пока вставка шаблонов не очень работает, не будем их показывать
    /*
    for (auto t = templates.begin(); !t.isEnd(); t++) {
        itemsV8.insertLast(V8TemplateItem(t.key));
    }
    */

    TextPosition caretPos;
    wnd.ted.getCaretPosition(caretPos, false);
    uint symbolsToCaret = caretPos.col - 1;
    string beginOfLine = getTextLine(wnd.textDoc.tm, caretPos.line).rtrim("\r\n").padRight(' ', symbolsToCaret);
    beginOfLine.setLength(symbolsToCaret);
    string start, selected;
    int idx = caretPos.col - 2;
    while (idx >= 0) {
        wchar_t symb = beginOfLine[idx];
        if (!is_name_symbol(symb))
            break;
        start.insert(0, symb);
        idx--;
    }
    /*
    Позиционироваться на пункте, на котором стоит 1С не будем, ибо у нас свой hotOrder для
    элементов, которые недавно вставлялись
    if (bkmk !is null) {
        uisrc.getCellFormat(bkmk, 0, val, cellFormat);
        selected = cellFormat.text;
    }*/
    uint tShow = GetTickCount();
    site.addItemGroup(itemsV8);
    site.show(wnd, start, selected, false);
    lastListShowMs = GetTickCount() - tShow;
    return true;
}

// используется в числе прочих при обработке выбора типа данных для глобального метода Тип()
class V8StockItemBase : SmartBoxInsertableItem {
    string insert;
    TextPosition tpStart;

    V8StockItemBase(const string& d, imagesIdx img, IV8Bookmark&& b, IAssistList&& l, IV8DataSource&& vd) {
        super(d, img);
        uint caretPos;
        v8string ins;
        l.textByBookmark(vd, b, ins, tpStart, caretPos);
        insert = ins;
        if (caretPos < insert.length)
            insert.insert(caretPos, symbCaret);
    }
    void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent) override {
        start = tpStart;

        TextPosition caretPos;
        wnd.ted.getCaretPosition(caretPos, false);

        string currleft = getTextLine(wnd.textDoc.tm, caretPos.line).substr(0, caretPos.col - 1);
        string currright = getTextLine(wnd.textDoc.tm, caretPos.line).substr(caretPos.col - 1);

        // Message("V8StockItemBase updateInsertPosition currleft " + currleft);
        // Message("V8StockItemBase updateInsertPosition currright " + currright);

        if(currleft.match(typeMethodOnLeft).matches > 0){
            end.col ++; //убираем лишнюю кавычку справа при вставке
            insert = insert.substr(0, insert.length - 1) + "¦\"" ;//имена вставки всегда приходят в кавычках, поэтому сейчас вставляю курсор внутрь
            if(currright.match(quoteOnRight).matches == 0){ // если не внутри Тип("¦")
                insert += ")";
                //выкинуть правую скобку, если она есть, чтобы правая скобка в разных кейсах ставилась верно всегда
                bool haveBracketOnRight = currright.match(closedBracketOnRight).matches > 0; 
                if (haveBracketOnRight){
                    end.col ++;
                }

                if (getTextLine(wnd.textDoc.tm, end.line).substr(end.col - 1).replace(indentRex, "").isEmpty())   // Если остаток строки пустой,
                    insert += ";";
            }
        }
    }
    void textForInsert(string&out text) {
        text = insert;
        // Message("V8StockItemBase textForInsert text " + text);
    }
    void textForTooltip(string& text)  // Получить тултип элемента
    {
        text = getCategory() + " " + d.descr;
    }
    string getCategory() {
        return "Элемент списка";
    }
};

class V8StockKeyword : V8StockItemBase {
    V8StockKeyword(const string& d, IV8Bookmark&& b, IAssistList&& l, IV8DataSource&& vd) {
        super(d, imgKeyword, b, l, vd);
    }
    string getCategory() { return "Ключевое слово"; }
    void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent) override {
        V8StockItemBase::updateInsertPosition(wnd, start, end, notIndent);
        if (d.key == "если") {
            insert = "Если ¦ Тогда\nКонецЕсли;";
        } else if (d.key == "для") {
            insert = "Для ¦ Цикл\nКонецЦикла;";
        } else if (d.key == "пока") {
            insert = "Пока ¦ Цикл\nКонецЦикла;";
        } else if (d.key == "попытка") {
            insert = "Попытка\n\t¦\nИсключение\nКонецПопытки;";
        } else if (d.key == "процедура") {
            insert = "Процедура ¦()\nКонецПроцедуры";
        } else if (d.key == "функция") {
            insert = "Функция ¦()\nКонецФункции";
        } else if (d.key == "возврат") {
            insert = "Возврат ¦;";
        } else if (d.key == "иначеесли")
            insert = "ИначеЕсли ¦ Тогда";
        notIndent = true;
    }
    void afterInsert(TextWnd&& editor) {
        if ("\nконецесли\nтогда\nиначе\nиначеесли\nконеццикла\nконецпроцедуры\nконецфункции\nвозврат\n"
            "исключение\nконецпопытки\n".find("\n" + d.key + "\n") != badStrIdx) {
            // выделим текущую строку и пошлем команду форматирования блока,
            // после чего вернем каретку в прежнее место
            TextPosition caretPos;
            editor.ted.getCaretPosition(caretPos, false);
            string lineOfText = getTextLine(editor.textDoc.tm, caretPos.line);
            int indent = lineOfText.match(indentRex).text(0, 0).length;
            TextPosition begSel = caretPos, endSel = caretPos;
            endSel.col = 1;
            endSel.line++;
            editor.ted.setSelection(begSel, endSel, true, false);
            sendCommandToMainFrame(CommandID(cmdGroupTxtEdt, cmdTxtFormatBlock));
            lineOfText = getTextLine(editor.textDoc.tm, caretPos.line);
            indent -= lineOfText.match(indentRex).text(0, 0).length;
            caretPos.col -= indent;
            editor.ted.setCaretPosition(caretPos, false);
        } else if ("новый" == d.key)
            showV8Assist();
    }
};

class V8StockMethod : V8StockItemBase {
    bool isFunction;
    
    V8StockMethod(int from, const string& d, bool isFunc, IV8Bookmark&& b, IAssistList&& l, IV8DataSource&& vd) {
        imagesIdx idx;
        if (from == tcfModuleSelf)
            idx = imgPublicMethod;
        else if (from == tcfCmnModule)
            idx = imgCmnModule;
        else if (from == tcfContext)
            idx = imgCtxMethod;
        else
            idx = imgMethodWithKey;
        super(d, idx, b, l, vd);

        isFunction = isFunc;

        // Message("V8StockMethod " + getCategory() + ", " + d + ", isFunction " + isFunction); 
    }
    string getCategory() {
        string type = "Процедура";
        if (isFunction)
            type = "Функция";
        switch (d.image) {
            case imgPublicMethod:
                return type + " модуля";
            case imgCtxMethod:
                return type + " контекста";
            case imgCmnModule:
                return type + " общего модуля";
        }
        if (builtinFuncs.contains(d.descr))
            return "Встроенная функция";
        if (isFunction)
            return "Глобальная функция";
        else
            return "Глобальный метод";
    }
    void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent) override {

        // Message("before V8StockItemBase::updateInsertPosition insert " + insert);
        V8StockItemBase::updateInsertPosition(wnd, start, end, notIndent);

        // TODO есть пересечение кода с MethodInsertable::updateInsertPosition
        TextPosition caretPos;
        wnd.ted.getCaretPosition(caretPos, false);

        wchar_t lastSymbol = insert[insert.length - 1];
        if (lastSymbol == '(')
            insert += "¦";
        if (lastSymbol == '(' || lastSymbol == ')') {
            if (getTextLine(wnd.textDoc.tm, end.line).substr(end.col - 1).replace(indentRex, "").isEmpty())   // Если остаток строки пустой,
                if (lastSymbol == '(')
                    insert += ");";
                else
                    insert += ";";
            else {
                string lastExpr = getTextLine(wnd.textDoc.tm, caretPos.line).substr(caretPos.col - 1)
                    .replace(endLineRex, "");
                array<string>&& tail = lastExpr.split(whiteSpaceRex);
                if (tail.length > 0) {
                    lastExpr = tail[0];
                }
                insert += lastExpr + ")";
                end.col += lastExpr.length;
    
                // Message("in V8StockMethod::updateInsertPosition lastExpr " + lastExpr);
            }
        }

    }

#if ver >= 8.3.4
    void afterInsert(TextWnd&& editor) {
        showV8MethodsParams();
    }
#endif
};

class V8StockProp : V8StockItemBase {
    V8StockProp(int from, const string& d, IV8Bookmark&& b, IAssistList&& l, IV8DataSource&& vd) {
        imagesIdx idx;
        if (from == tcfModuleSelf)
            idx = imgPublicVar;
        else if (from == tcfCmnModule)
            idx = imgCmnModule;
        else if (from == tcfContext)
            idx = imgCtxVar;
        else
            idx = imgVarWithKey;
        super(d, idx, b, l, vd);
    }
    string getCategory() {
        switch (d.image) {
        case imgPublicVar:
            return "Переменная модуля";
        case imgCmnModule:
            return "Общий модуль";
        case imgCtxVar:
            return "Свойство контекста";
        }
        return "Глобальное свойство";
    }
    void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent) override {
        V8StockItemBase::updateInsertPosition(wnd, start, end, notIndent);
        if (d.image == imgCmnModule)
            insert += ".";
    }
    void afterInsert(TextWnd&& editor) {
        if (d.image == imgCmnModule)
            showV8Assist();
    }
}

class V8StockEnum : V8StockItemBase {
    V8StockEnum(const string& d, IV8Bookmark&& b, IAssistList&& l, IV8DataSource&& vd) {
        super(d, imgEnums, b, l, vd);
    }
    string getCategory() {
        return "Системное перечисление";
    }
    void updateInsertPosition(TextWnd& wnd, TextPosition& start, TextPosition& end, bool& notIndent) override {
        V8StockItemBase::updateInsertPosition(wnd, start, end, notIndent);
        insert += ".";
    }
    void afterInsert(TextWnd&& editor) {
        showV8Assist();
    }
}

class V8TemplateItem : SmartBoxInsertableItem {
    V8TemplateItem(const string& d) {
        super(d, imgType);
    }
    void textForInsert(string&out text) {
        text = d.descr.dup().replace("[", "").replace("]", "");
    }
    void textForTooltip(string& text) {
        text = "Шаблон §" + d.descr;
    }
};
