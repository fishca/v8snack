/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Функционал по группированию строк в редакторе с помощью //{ //},
 * а также раскраске многострочных строк в цвета запросов
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

Packet sqlColorsAndGrouping("sqlColorsAndGrouping", initSafeColorPacket, piOnMainEnter);
bool initSafeColorPacket() { return initGroupingAndColoring(); }

// Перехватчик функции синтакс-разбора строки текста редактором 1С для
// текстового расширения "Встроенный язык"
TrapVirtualStdCall trITextExtColors_getColors;
// Перехватчик QueryInterface текстового расширения "Встроенный язык"
// Нужен для 8.2, где расширение не реализовывало раскраску фона, и приходилось
// отдавать свою реализацию интерфейса
TrapVirtualStdCall trTextExtModule_QI;
// с 8.3 расширение стало само поддерживать расцветку фона, и теперь надо
// перехватывать сами функции.
TrapVirtualStdCall trTxtExt_hasBG;
TrapVirtualStdCall trTxtExt_getBG;

#if x86 = 0
// The native gate remains installed when disabled. It never enters Core.As
// on editor workers, including during option changes.
int colorGateState = trapNotActive;
int backGateState = trapNotActive;
#if ver >= 8.3.27 & ver < 8.3.28
funcdef bool SafeBGHas(ITextExtBackColors&, size_t, const TextPosition&, const TextPosition&, SyntaxItemInfos&);
#else
funcdef bool SafeBGHas(ITextExtBackColors&, size_t, SyntaxItemInfos&);
#endif
funcdef void SafeBGGet(ITextExtBackColors&, size_t, SyntaxItemInfos&, Vector&);
TE_gc&& originalSafeColors;
SafeBGHas&& originalSafeBGHas;
SafeBGGet&& originalSafeBGGet;

void swapSafeColors() {
    colorGateState = colorGateState == trapEnabled ? trapDisabled : trapEnabled;
    colorsGateEnable(0, colorGateState == trapEnabled ? 1 : 0);
}

void swapSafeBackground() {
    backGateState = backGateState == trapEnabled ? trapDisabled : trapEnabled;
    colorsGateEnable(1, backGateState == trapEnabled ? 1 : 0);
    colorsGateEnable(2, backGateState == trapEnabled ? 1 : 0);
  #if ver >= 8.3.27 & ver < 8.3.28
    colorsLineBgEnable(backGateState == trapEnabled ? 1 : 0);   // фон всей строки (27)
  #endif
}

bool configureNativeColors() {
    uint mode = 0;
  #if ver >= 8.3.20
    mode = 1;
  #endif
    uint flags = (usersGrouping ? 1 : 0) | (colorizedMultiLines ? 2 : 0) |
        (enableBkColorForMultiLine ? 4 : 0) | (groupMultiLine ? 8 : 0);
    return sqlColors !is null && colorsNativeConfigure(sqlColors, mode, SyntaxItemInfo_size,
        SyntaxItemInfo_color_offset, SyntaxItemInfo_isBlock_offset, SyntaxItemInfo_lexemCategory_offset,
        flags, colorBgForMultiLine, colorForPipe, SyntaxItemInfos_infos_offset) != 0;
}
#endif

// Мой экземпляр обработчика цвета фона
IUnknown&& myBGHandler;

// Один экземпляр текстового расширения "Язык запросов". Он и будет
// парсить строки в кавычках
ITextExtColors&& sqlColors;

// Использовать пользовательские группировки
bool usersGrouping;
OptionsEntry oeEnableCustomGrouping("EnableCustomGrouping", function(v) {v = true; },
    function(v){v.getBoolean(usersGrouping); },
    function(v){v.getBoolean(usersGrouping); initGroupingAndColoring(); return false; });

// Раскрашивать мульти-строки в цвета запросов.
bool colorizedMultiLines;
OptionsEntry oeQueryColors("QueryColors", function(v) {v = true; },
    function(v){v.getBoolean(colorizedMultiLines); },
    function(v){v.getBoolean(colorizedMultiLines); initGroupingAndColoring(); return false; });

// Менять фон для мульти-строк при раскраске в цвета запроса.
bool enableBkColorForMultiLine;
OptionsEntry oeEnableBkColorForMultyLine("EnableBkColorForMultyLine", function(v) {v = true; },
    function(v){v.getBoolean(enableBkColorForMultiLine); },
    function(v){v.getBoolean(enableBkColorForMultiLine); initGroupingAndColoring(); return false; });

// Цвет фона для мульти-строк при смене фона при их раскраске в цвета запроса.
uint colorBgForMultiLine = 0xE0E0E0;
OptionsEntry oeMultiLineBackground("MultiLineBackground", &&defvalBgColorForMultiLine,
    function(v){colorFromV8(v, colorBgForMultiLine); },
    function(v){colorFromV8(v, colorBgForMultiLine); initGroupingAndColoring(); return false; });

// Сворачивать многострочные литералы.
bool groupMultiLine = true;
OptionsEntry oeGroupMultiLine("GroupMultiLine", function(v) {v = true; },
    function(v){v.getBoolean(groupMultiLine); },
    function(v){v.getBoolean(groupMultiLine); initGroupingAndColoring(); return false; });

void defvalBgColorForMultiLine(Value& val) {
    IV8Color&& clr;
    currentProcess().createByClsid(V8Color, IID_IV8Color, clr);
    Color c(0xE0, 0xE0, 0xE0);
    clr.setColor(c);
    &&val.pValue = cast<IUnknown>(clr);
}

void colorFromV8(const Value& val, uint&out res) {
    IV8Color&& color = cast<IUnknown>(val.pValue);
    if (color !is null) {
        Color clr;
        color.getColor(clr);
        if (clr.kind == 0)
            res = clr.value.id;
    }
}

// Цвет символа |
uint colorForPipe = 0xBBBBBB;
// Этим мы будем сигнализировать процедуре определения фона текста о необходимости
// применения нашего алгоритма
const uint bgMagic = 0xDEADBEEF;
int bgColorTrapType = 0;

// Инициализация перехвата
bool initGroupingAndColoring(bool forceForProbe = false) {
    getEventService().notify(eTxtEdtOptionChanged);
    if (!usersGrouping && !colorizedMultiLines) {
        // Не нужны ни группировки, ни раскраска запросов
        // Поверим, если перехваты уже установлены, снимем их
      #if x86 = 0
        if (colorGateState == trapEnabled)
            swapSafeColors();
        if (backGateState == trapEnabled)
            swapSafeBackground();
      #endif
        if (trITextExtColors_getColors.state == trapEnabled)
            trITextExtColors_getColors.swap();
        if (trTextExtModule_QI.state == trapEnabled)
            trTextExtModule_QI.swap();
        if (trTxtExt_hasBG.state == trapEnabled)
            trTxtExt_hasBG.swap();
        if (trTxtExt_getBG.state == trapEnabled)
            trTxtExt_getBG.swap();
        return true;
    }
    // Хотя бы одна из опций "группировка" или "раскраска" активна.
    // значит, надо по-любому устанавливать/восстанавливать перехват на парсинг строки
    // Создаем текстовое расширение "Встроенный язык"
    IUnknown&& ext;
  #if x86 = 0
    if (colorGateState == trapNotActive) {
        bool defaultNativeColors = false;
      #if (ver >= 8.3.17 & ver < 8.3.18) | (ver >= 8.3.27 & ver < 8.3.28)
        defaultNativeColors = true;
      #endif
        if (!forceForProbe && !diagHook("colors", defaultNativeColors))
            return true;
        currentProcess().createByClsid(gTextExtModule, IID_IUnknown, ext);
        ITextExtColors&& colorsExt = ext;
        if (colorsExt is null)
            return true;
        int_ptr original = installColorsGate(colorsExt, ITextExtColors_getColors,
            ThunkToFunc(&&ITextExtColors_getColorsTrap), mainThreadId, 0);
        if (original == 0) {
            doLog("Cannot install native colors gate");
            return true;
        }
        initFuncDefFromAddress(original, &&originalSafeColors, asCALL_STDCALL);
        currentProcess().createByClsid(CLSID_TextExtSQL, IID_ITextExtColors, sqlColors);
        if (!configureNativeColors()) {
            doLog("Native colors ABI/allocator is not supported; hook remains disabled");
            colorGateState = trapDisabled;
            return true;
        }
        colorGateState = trapDisabled;
        swapSafeColors();
    } else {
        if (!configureNativeColors())
            return true;
        if (colorGateState == trapDisabled)
            swapSafeColors();
    }
  #else
    if (trITextExtColors_getColors.state == trapNotActive) {
        // Платформа вызывает раскраску строки (ITextExtColors.getColors) из фонового потока редактора (txtedt), параллельно с главным потоком,
        // а Core.As не допускает параллельного входа в скрипты: на 8.3.27 — зависания и нативные падения при наборе, на 8.3.17 — падение
        // в core_as.dll (разбор дампа 2026-10-03, поток не главный, стек txtedt → getColors → ловушка). Поэтому перехват по умолчанию выключен
        // на всех версиях (tools/DISABLED-27.md, п. 1.1); включить: logs/diag.ini «hook.colors=on» (или флаг logs/hook-colors.on).
        if (!diagHook("colors", false))
            return true;
        currentProcess().createByClsid(gTextExtModule, IID_IUnknown, ext);
        // Получаем его интерфейс для синтакс-разбора строки
        ITextExtColors&& colorsExt = ext;
        if (colorsExt !is null) {
            // Ставим перехват на функцию разбора строки
            trITextExtColors_getColors.setTrap(colorsExt, ITextExtColors_getColors, ITextExtColors_getColorsTrap);
            // Создаем текстовое расширение "Язык запросов" 
            currentProcess().createByClsid(CLSID_TextExtSQL, IID_ITextExtColors, sqlColors);
        } else {
            doLog("Not have colorsExt in initGroupingAndColoring");
        }
    } else if (trITextExtColors_getColors.state == trapDisabled)
        trITextExtColors_getColors.swap();
  #endif
    // Если включена раскраска строк в цвета запросов, надо разобраться с фоном
    if (colorizedMultiLines) {
        if (enableBkColorForMultiLine) {
            // Надо устанавливать или восстанавливать перехват на получение фона строки
            // Для начала выясним, какой тип перехвата нужно делать
            if (bgColorTrapType == 0) {	// Еще не выясняли, надо узнать
                if (ext is null)
                    currentProcess().createByClsid(gTextExtModule, IID_IUnknown, ext);
                ITextExtBackColors&& bgHandler = ext;
                if (bgHandler is null) {
                    &&myBGHandler = AStoIUnknown(MyTextExtBackColors(), IID_ITextExtBackColors);
                    // Ставим перехват на QueryInterface расширения "Встроенный язык"
                    ITextExtention&& tExt = ext;
                    trTextExtModule_QI.setTrap(tExt, 0, TextExtModule_QI);
                    bgColorTrapType = 1;
                } else {
                    #if ver < 8.3.19 | (x86 = 0 & ver >= 8.3.27 & ver < 8.3.28)
                  #if x86 = 0
                    int_ptr hasOriginal = installBackColorsGate(bgHandler, ITextExtBackColors_hasCustomBackground,
                        ThunkToFunc(&&TxtExt_hasCustomBackground), mainThreadId, 1);
                    int_ptr getOriginal = installBackColorsGate(bgHandler, ITextExtBackColors_getColorInfo,
                        ThunkToFunc(&&TxtExt_getColorInfo), mainThreadId, 2);
                    if (hasOriginal != 0 && getOriginal != 0) {
                        initFuncDefFromAddress(hasOriginal, &&originalSafeBGHas, asCALL_STDCALL);
                        initFuncDefFromAddress(getOriginal, &&originalSafeBGGet, asCALL_STDCALL);
                        #if ver >= 8.3.27 & ver < 8.3.28
                        // 8.3.27: фон ВСЕЙ строки (заливка до правого края) задаётся отдельным интерфейсом редактора; свой нативный
                        // объект, AS не участвует. Подтверждено только на 8.3.27.1859 (разбор txtedui.dll), на остальных сборках 27
                        // включается явно: logs/diag.ini «hook.linebg=on» (выключить: «hook.linebg=off»).
                        bool lineBgDefault = false;
                        #if ver >= 8.3.27.1859 & ver < 8.3.27.1860
                        lineBgDefault = true;
                        #endif
                        if (diagHook("linebg", lineBgDefault)) {
                            ITextExtention&& lineBgExt = ext;
                            if (lineBgExt !is null)
                                colorsLineBgInstall(lineBgExt, mainThreadId);
                        }
                        #endif
                        backGateState = trapDisabled;
                        swapSafeBackground();
                    }
                  #else
                    trTxtExt_hasBG.setTrap(bgHandler, ITextExtBackColors_hasCustomBackground, TxtExt_hasCustomBackground);
                    trTxtExt_getBG.setTrap(bgHandler, ITextExtBackColors_getColorInfo, TxtExt_getColorInfo);
                  #endif
                    bgColorTrapType = 2;
                    #endif
                }
            } else if (bgColorTrapType == 1) {
                if (trTextExtModule_QI.state != trapEnabled)
                    trTextExtModule_QI.swap();
            } else if (bgColorTrapType == 2) {
              #if x86 = 0
                if (backGateState == trapDisabled)
                    swapSafeBackground();
              #else
                if (trTxtExt_getBG.state != trapEnabled) {
                    trTxtExt_getBG.swap();
                    trTxtExt_hasBG.swap();
                }
              #endif
            }
        } else {
          #if x86 = 0
            if (backGateState == trapEnabled)
                swapSafeBackground();
          #endif
            // Надо отключить перехваты на фон строки
            if (trTextExtModule_QI.state == trapEnabled)
                trTextExtModule_QI.swap();
            if (trTxtExt_hasBG.state == trapEnabled)
                trTxtExt_hasBG.swap();
            if (trTxtExt_getBG.state == trapEnabled)
                trTxtExt_getBG.swap();
        }
    }
    return true;
}

void printSyntaxInfos(const string& text, Vector& infos) {
    SyntaxItemInfoRef&& s = toSyntaxItemInfo(infos.start);
    doLog("----->> lexem=" + infos.count(SyntaxItemInfo_size), 3);
    while (s < infos.end) {
        doLog(text.substr(s.ref.start, s.ref.len) + "  blockKind=" + s.ref.blockKind + " blockMode=" + s.ref.blockMode + " isBlock=" + int(s.ref.isBlock)
            + " cat=" + s.ref.lexemCategory + " lexType=" + s.ref.lexemType, 3);
        &&s = s + 1;
    }
    doLog("<<-----", 3);
}

// Обработчик перехваченной функции синтакс-разбора строки
funcdef void TE_gc(ITextExtColors&, const v8string&, Vector&);
void ITextExtColors_getColorsTrap(ITextExtColors& pThis, const v8string& sourceLine, Vector& infos) {
    // Вызовем штатную процедуру
    TE_gc&& orig;
  #if x86 = 0
    &&orig = originalSafeColors;
  #else
    trITextExtColors_getColors.getOriginal(&&orig);
  #endif
    if (dbgOn())
        dbgLog("getColorsTrap: поток " + GetCurrentThreadId() + (GetCurrentThreadId() == mainThreadId ? " (главный)" : " (ЧУЖОЙ, главный " + mainThreadId + ")"));
    orig(pThis, sourceLine, infos);
    // На нет и суда нет. А парсинг нескольких строк вызывается не для раскраски
    if (infos.end == infos.start || sourceLine.str.find("\n") != badStrIdx)
        return;
    // Проверим на группирующие комментарии
    string srcLine = sourceLine.str;
    SyntaxItemInfoRef&& sInfo = toSyntaxItemInfo(infos.start);
    if (usersGrouping && checkForGroupingRemark(srcLine, infos))
        return;
    if (!colorizedMultiLines && !groupMultiLine)
        return;
    
    // Дополнительно парсить языком запросов будем, если первый токен - строковая константа, начинающаяся с |,
    // либо последний токен - открытая строковая константа
    if (!((vlString == sInfo.ref.lexemCategory && '|' == srcLine[sInfo.ref.start])
        || isLineEndWithOpenQuote(srcLine)))
        return;
    if (colorizedMultiLines) {
        // распарсим дополнительно все строковые константы в строке текста языком запросов
        // При этом если включена группировка, то там еще сгруппирует
        uint newCount;
        array<SQLBlockInfo&&>&& newBlocks = parseQuoteLexemAsSQL(srcLine, infos, newCount);
        // Теперь все полученные блоки нужно слить в один вектор
        infos.dtor();
        int_ptr pWrite = infos.alloc(newCount, SyntaxItemInfo_size);
        for (uint idx = 0, m = newBlocks.length; idx < m; idx++) {
            SQLBlockInfo&& pBlock = newBlocks[idx];
            int_ptr size = pBlock.tokens.size();
            if (size != 0) {
                mem::memcpy(pWrite, pBlock.tokens.start, size);
                pWrite += size;
            }
        }
    } else {
        // Просто группировка, без раскраски
        checkForGroupingMultiLine(srcLine, infos);
    }
}

RegExp reGroupComment("(?i)(//\\{|#Удаление|#Вставка)|(//\\}|#КонецУдаления|#КонецВставки)");
// Проверка на группирующий комментарий
bool checkForGroupingRemark(const string& srcLine, Vector& infos) {
    if (infos.start > 0) {
        SyntaxItemInfoRef&& sInfo = toSyntaxItemInfo(infos.start);
        while (sInfo < infos.end) {
            // Если строка - коментарий, проверим на символы группировки
            if (vlRemark == sInfo.ref.lexemCategory || vlUnknown == sInfo.ref.lexemCategory) {
                auto res = reGroupComment.match(srcLine.substr(sInfo.ref.start));
                if (res.matches > 0) {
                    sInfo.ref.isBlock = res.text(0, 1).isEmpty() ? groupBlockEnd : groupBlockBegin;
                    sInfo.ref.blockKind = groupBlockKind;
                    sInfo.ref.blockMode = 0;
                    sInfo.ref.lexemCategory = vlUnknown;
                    sInfo.ref.lexemType = 999;
                    return true;
                }
                return false;
            }
            &&sInfo = sInfo + 1;
        }
    }
    return false;
}

// Процедура перебирает все токены в массиве, дополнительно обрабатывая
// строковые константы языком запросов. Обрабатываются те, которые либо начинаются с |,
// либо без закрывающей кавычки
array<SQLBlockInfo&&>&& parseQuoteLexemAsSQL(const string& srcLine, Vector& tokens, uint&out newCount) {
    SyntaxItemInfoRef&& sInfo = toSyntaxItemInfo(tokens.start);
    uint tokensCount = tokens.count(SyntaxItemInfo_size);
    array<SQLBlockInfo&&> sqlBlocks;
    newCount = 0;
    //printSyntaxInfos(srcLine, tokens);
    for (uint idx = 0; idx < tokensCount; idx++) {
        // Один блок по-любому войдет в новый вектор, либо как есть, либо как открывающая кавычка
        newCount++;
        bool needProcess = false, withoutBegin, withoutEnd;
        if (vlString == sInfo.ref.lexemCategory) {
            withoutBegin = srcLine[sInfo.ref.start] == '|';
            withoutEnd = isLineEndWithOpenQuote(srcLine.substr(sInfo.ref.start, sInfo.ref.len));
            if ((withoutBegin || withoutEnd) /*&& !(sInfo.ref.len == 2 && !withoutEnd)*/)
                needProcess = true;
        }
        if (needProcess) {
            // Добавим блок для открывающей кавычки
            SQLBlockInfo&& blockInfo = SQLBlockInfo();
            SyntaxItemInfoRef&& sCopy = blockInfo.setSyntaxBlock(sInfo.ref);
            sCopy.ref.len = 1;
            sCopy.ref.lexemCategory = vlUnknown;
            sCopy.ref.lexemType = 1000;
            if (withoutBegin) {
                sCopy.ref.color.kind = ckRGB;
                sCopy.ref.color.value.id = colorForPipe;
            }
            bool needChangeBG = true;
            BlockMarker isBlock = bmNone;
            int blockKind = 0;
            if (withoutEnd && !withoutBegin) {
                // Текст с открывающей, но без закрывающей кавычки.
                // Для него цвет фона будем менять только если он не пустой,
                // либо первый токен в строке - |
                if (srcLine[toSyntaxItemInfo(tokens.start).ref.start] != '|') {
                    isBlock = groupMultiLine ? groupBlockBegin : bmNone;
                    blockKind = groupBlockKind;
                    if (sInfo.ref.len == 1 ||
                        srcLine.substr(sInfo.ref.start + 1, sInfo.ref.len - 1).trim().isEmpty()) {
                        needChangeBG = false;
                    }
                }
            }
            if (withoutBegin && !withoutEnd && !isLineEndWithOpenQuote(srcLine)) {
                isBlock = groupMultiLine ? groupBlockEnd : bmNone;
                blockKind = groupBlockKind;
            }
            if (enableBkColorForMultiLine && needChangeBG) {
                sCopy.ref.color.value.uuid.data1 = bgMagic;
                sCopy.ref.color.value.uuid.data2 = withoutEnd ? uint(777) : sInfo.ref.len - 2;
            }
            sCopy.ref.isBlock = isBlock;
            sCopy.ref.blockKind = blockKind;

            sqlBlocks.insertLast(blockInfo);

            // Вытащим текст из кавычек и заменим в нем сдвоенные кавычки на обычные,
            // чтобы они нормально обработались языком запросов
            int innerLen = sInfo.ref.len - (withoutEnd ? 1 : 2);
            if (innerLen > 0) {
                string text = srcLine.substr(sInfo.ref.start + 1, innerLen);
                text.replace("\"\"", "\"");
                // Теперь такой текст можно отдавать парсеру цветов sql-запросов
                &&blockInfo = SQLBlockInfo();
                sqlColors.getColors(text, blockInfo.tokens);
                if (blockInfo.tokens.size() != 0) {
                    // Пофиксим позиции и длины
                    newCount += blockInfo.fixupStartPositions(sInfo.ref.start + 1, srcLine);
                    sqlBlocks.insertLast(&&blockInfo);
                }
            } else if (innerLen < 0) {
                Print("Bad inner len: " + innerLen);
            }

            // Учтем отдельный токен для закрывающей кавычки
            if (!withoutEnd) {
                newCount++;
                SQLBlockInfo&& blockInfo1 = SQLBlockInfo();
                SyntaxItemInfoRef&& sCopy1 = blockInfo1.setSyntaxBlock(sInfo.ref);
                sCopy1.ref.len = 1;
                sCopy1.ref.start = sInfo.ref.start + sInfo.ref.len - 1;
                sCopy1.ref.lexemCategory = vlUnknown;
                sCopy1.ref.lexemType = 1000;
                sqlBlocks.insertLast(blockInfo1);
            }
        } else {
            // Просто копируем блок
            SQLBlockInfo&& blockInfo = SQLBlockInfo();
            blockInfo.setSyntaxBlock(sInfo.ref);
            sqlBlocks.insertLast(&&blockInfo);
        }
        &&sInfo = sInfo + 1;
    }
    return sqlBlocks;
}

// Проверка на группирующий комментарий
void checkForGroupingMultiLine(const string& srcLine, Vector& infos) {
    if (infos.start > 0) {
        SyntaxItemInfoRef&& sInfo = toSyntaxItemInfo(infos.start);
        while (sInfo < infos.end) {
            bool needProcess = false, withoutBegin, withoutEnd;
            if (vlString == sInfo.ref.lexemCategory) {
                withoutBegin = srcLine[sInfo.ref.start] == '|';
                withoutEnd = isLineEndWithOpenQuote(srcLine.substr(sInfo.ref.start, sInfo.ref.len));
                if ((withoutBegin || withoutEnd) /*&& !(sInfo.ref.len == 2 && !withoutEnd)*/)
                    needProcess = true;
            }
            if (needProcess) {
                BlockMarker isBlock = bmNone;
                if (withoutEnd && !withoutBegin) {
                    if (srcLine[toSyntaxItemInfo(infos.start).ref.start] != '|')
                        isBlock = groupBlockBegin;
                }else if (withoutBegin && !withoutEnd && !isLineEndWithOpenQuote(srcLine))
                    isBlock = groupBlockEnd;
                if (isBlock != bmNone) {
                    sInfo.ref.isBlock = isBlock;
                    sInfo.ref.blockKind = groupBlockKind;
                    sInfo.ref.blockMode = 0;
                    sInfo.ref.lexemCategory = vlUnknown;
                    sInfo.ref.lexemType = 999;
                }
            }
            &&sInfo = sInfo + 1;
        }
    }
}


// Для хранения массивов токенов от разбора строковых литералов парсером языка запросов
class SQLBlockInfo {
    Vector tokens;
    // Создает вектор для одного элемента и копирует в него элемент
    SyntaxItemInfoRef&& setSyntaxBlock(SyntaxItemInfo& si) {
        tokens.alloc(1, SyntaxItemInfo_size);
        SyntaxItemInfoRef&& p = toSyntaxItemInfo(tokens.start);
        p.ref.copy(si);
        return p;
    }
    // Исправляет стартовые позиции токенов после их разбора парсером языка запросов
    // также правится длина токенов, если в них встречаются кавычки, так как в
    // оригинальном тексте это сдвоенные кавычки.
    // возвращает количество токенов
    uint fixupStartPositions(uint shift, const string& srcLine) {
        uint tokensCount = Vector__count(tokens, SyntaxItemInfo_size);
        SyntaxItemInfoRef&& pS = toSyntaxItemInfo(tokens.start);
        for (uint idx = 0; idx < tokensCount; idx++) {
            pS.ref.start += shift;
            for (uint kk = pS.ref.start, kEnd = pS.ref.start + pS.ref.len; kk < kEnd; kk++) {
                if (srcLine[kk] == '\"') {
                    shift++;
                    kk++;
                    kEnd++;
                    pS.ref.len++;
                }
            }
            pS.ref.lexemCategory = vlUnknown;
            pS.ref.lexemType += 1001;
            pS.ref.isBlock = bmNone;
            pS.ref.blockKind = 0;
            pS.ref.blockMode = 0;
            &&pS = pS + 1;
        }
        return tokensCount;
    }
};

bool processHasCustomBackground(Vector& items) {
    if (items.start != 0) {
        SyntaxItemInfoRef&& p = toSyntaxItemInfo(items.start);
        while (p < items.end) {
            if (p.ref.color.value.uuid.data1 == bgMagic)
                return true;
            &&p = p + 1;
        }
    }
    return false;
}

void processGetColorInfo(Vector& items, Vector& res) {
    if (items.start != 0) {
        uint newCount = 0;
        SyntaxItemInfoRef&& p = toSyntaxItemInfo(items.start);
        while (p < items.end) {
            if (p.ref.color.value.uuid.data1 == bgMagic)
                newCount++;
            &&p = p + 1;
        }
        if (newCount > 0) {
            uint oldBGCount = res.count(BackColorsItem_size),
                newSize = (oldBGCount + newCount) * BackColorsItem_size,
                newSpace = v8malloc(newSize);
            BackColorsItemRef&& ptr = toBackColorsItem(newSpace);
            &&p = toSyntaxItemInfo(items.start);
            while (p < items.end) {
                if (p.ref.color.value.uuid.data1 == bgMagic) {
                    ptr.ref.start = p.ref.start + 1;
                    ptr.ref.len = p.ref.color.value.uuid.data2;
                    ptr.ref.color = colorBgForMultiLine;
                    &&ptr = ptr + 1;
                }
                &&p = p + 1;
            }
            if (oldBGCount > 0) {   // надо скопировать прошлые значения
                mem::memcpy(ptr.self, res.start, oldBGCount * BackColorsItem_size);
                res.dtor();
            }
            res.start = newSpace;
            res.end = res.allocated = res.start + newSize;
        }
    }
}

#if x86 = 0 & ver >= 8.3.27 & ver < 8.3.28
bool TxtExt_hasCustomBackground(ITextExtBackColors& pThis, size_t nLineNo, const TextPosition& first, const TextPosition& last, SyntaxItemInfos& items) {
    bool res = originalSafeBGHas(pThis, nLineNo, first, last, items);
#else
bool TxtExt_hasCustomBackground(ITextExtBackColors& pThis, size_t nLineNo, SyntaxItemInfos& items) {
  #if x86 = 0
    bool res = originalSafeBGHas(pThis, nLineNo, items);
  #else
    trTxtExt_hasBG.swap();
    bool res = pThis.hasCustomBackground(nLineNo, items);
    trTxtExt_hasBG.swap();
  #endif
#endif
    return res || processHasCustomBackground(items.infos);
}

void TxtExt_getColorInfo(ITextExtBackColors& pThis, size_t currentBGColor, SyntaxItemInfos& items, Vector& res) {
  #if x86 = 0
    originalSafeBGGet(pThis, currentBGColor, items, res);
  #else
    trTxtExt_getBG.swap();
    pThis.getColorInfo(currentBGColor, items, res);
    trTxtExt_getBG.swap();
  #endif
    processGetColorInfo(items.infos, res);
}

// Класс для обработки запросов о цвете фона
class MyTextExtBackColors {
    // Определить, нужно ли будет менять фон слов в строке
  #if x86 = 0 & ver >= 8.3.27 & ver < 8.3.28
    bool hasCustomBackground(size_t nLineNo, const TextPosition& first, const TextPosition& last, SyntaxItemInfos& items) {
  #else
    bool hasCustomBackground(int nLineNo, SyntaxItemInfos& items) {
  #endif
        return processHasCustomBackground(items.infos);
    }
    // Получить инфу о цветах фона
    void getColorInfo(COLORREF currentBGColor, SyntaxItemInfos& items, Vector& res) {
        processGetColorInfo(items.infos, res);
    }
};

funcdef uint IUnk_QI(IUnknown&, const Guid&, IUnknown&&&);
uint TextExtModule_QI(IUnknown& pThis, const Guid& g, IUnknown&&& res) {
    //Print("" + g);
    
    if (g == IID_ITextExtBackColors) {
        &&res = myBGHandler;
        res.AddRef();
        return 0;
    }
    
    //Print("" + toGuid(p2).ref);
    IUnk_QI&& orig;
    trTextExtModule_QI.getOriginal(&&orig);
    return orig(pThis, g, res);
    //return orig(p1, p2, p3);
}
