/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Реализует объект snegopat из SnegAPI.
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

class Snegopat {
  #if x86 = 0
  #if ver >= 8.3.27 & ver < 8.3.28
    string coloringBackgroundCounts() {
        return "{\"has\":" + colorsGateCount(1, 2) + ",\"get\":" + colorsGateCount(2, 2) +
            ",\"line\":" + colorsLineBgCount() + ",\"script\":" + (colorsGateCount(1, 1) + colorsGateCount(2, 1)) + "}";
    }
  #else
    string coloringBackgroundCounts() {
        return "{\"has\":" + colorsGateCount(1, 2) + ",\"get\":" + colorsGateCount(2, 2) +
            ",\"line\":-1,\"script\":" + (colorsGateCount(1, 1) + colorsGateCount(2, 1)) + "}";
    }
  #endif
    string coloringGateInfo() {
        string result = "[";
        for (uint kind = 0; kind < 3; kind++) {
            if (kind != 0) result += ",";
            result += "[";
            for (uint field = 0; field < 6; field++) {
                if (field != 0) result += ",";
                result += "\"" + formatInt(colorsGateAddress(kind, field), "0x", 16) + "\"";
            }
            result += "]";
        }
        return result + "]";
    }
    string coloringBackgroundProbe(const string& text, bool worker = false) {
        if (colorGateState != trapEnabled)
            initGroupingAndColoring(true);
        if (backGateState != trapEnabled)
            return "{\"error\":\"background gate unavailable\"}";
        // The platform background handler requires the document's settings.
        // A bare CoCreateInstance has no settings provider and crashes in 8.3.17.
        if (activeTextWnd is null)
            return "{\"error\":\"open a module editor first\"}";
        ITxtEdtExtender&& object;
        getTxtEdtService().getExtender(object, activeTextWnd.textDoc.itm, gTextExtModule);
        ITextExtColors&& colors = object.unk;
        ITextExtBackColors&& background = object.unk;
        if (colors is null || background is null)
            return "{\"error\":\"no text extension\"}";
        v8string line = text;
        Vector items, output;
        colors.getColors(line, items);
        int has = ::nativeBackgroundProbe(background, items, output, worker ? 1 : 0);
        string result = "{\"has\":" + has + ",\"background\":[";
        for (uint i = 0; i < output.count(BackColorsItem_size); i++) {
            BackColorsItemRef&& item = toBackColorsItem(output.start + i * BackColorsItem_size);
            if (i != 0) result += ",";
            result += "[" + item.ref.start + "," + item.ref.len + "," + item.ref.color + "]";
        }
        return result + "]}";
    }
    bool coloringStress(const string& text, uint workers = 8, uint iterations = 100) {
        if (colorGateState != trapEnabled)
            initGroupingAndColoring(true);
        ITextExtColors&& ext;
        currentProcess().createByClsid(gTextExtModule, IID_ITextExtColors, ext);
        v8string line = text;
        return ext !is null && colorsWorkerStress(ext, line, workers, iterations) != 0;
    }
    // Diagnostic parser probe, no editor document or configuration is changed.
    string coloringProbe(const string& text, bool worker = false, bool native = true) {
        if (colorGateState != trapEnabled)
            initGroupingAndColoring(true);
        if (colorGateState != trapEnabled)
            return "{\"error\":\"gate not enabled\"}";
        ITextExtColors&& ext;
        currentProcess().createByClsid(gTextExtModule, IID_ITextExtColors, ext);
        if (ext is null)
            return "{\"error\":\"no text extension\"}";
        colorsNativeSwitch(native ? 1 : 0);
        v8string line = text;
        Vector infos;
        int64 beforeScript = colorsGateCount(0, 1);
        int64 beforeWorker = colorsGateCount(0, 0);
        int64 beforeNative = colorsGateCount(0, 2);
        if (worker) {
            if (colorsWorkerProbe(ext, line, infos) == 0) {
                colorsNativeSwitch(1);
                return "{\"error\":\"worker failed\"}";
            }
        } else
            ext.getColors(line, infos);
        colorsNativeSwitch(1);
        string result = "{\"tokens\":[";
        for (uint i = 0; i < infos.count(SyntaxItemInfo_size); i++) {
            SyntaxItemInfoRef&& token = toSyntaxItemInfo(infos.start + i * SyntaxItemInfo_size);
            if (i != 0) result += ",";
            result += "[" + token.ref.start + "," + token.ref.len + "," + token.ref.lexemCategory + "," + token.ref.isBlock + "," +
                token.ref.lexemType + "," + token.ref.color.kind + "," + token.ref.color.value.id + "," +
                token.ref.color.value.uuid.data1 + "," + token.ref.color.value.uuid.data2 + "," + token.ref.blockKind + "," + token.ref.blockMode + "]";
        }
        return result + "],\"script\":" + (colorsGateCount(0, 1) - beforeScript) + ",\"worker\":" + (colorsGateCount(0, 0) - beforeWorker) + ",\"native\":" + (colorsGateCount(0, 2) - beforeNative) + "}";
    }
  #endif
    // Получить активное текстовое окно
    ITextWindow&& activeTextWindow() {
        return activeTextWnd is null ? null : activeTextWnd.getComWrapper();
    }

    // Обработать строку шаблонов
    string parseTemplateString(const string& text, const string& name = "") {
        v8string wText = text;
        v8string wName = name.isEmpty() ? "Снегопат" : name;
        uint caret;
        v8string wResult;
        ITemplateProcessor&& tp;
        getTxtEdtService().getTemplateProcessor(tp);
        tp.processTemplate(wName, wText, wResult, caret, "");
        string result = wResult;
        if (caret <= result.length)
            result.insert(caret, symbCaret);
        return result;
    }

    // Показать список методов модуля
    bool showMethodsList() {
        IntelliSite&& ist = getIntelliSite();
        if (ist.isActive())
            ist.hide();
        if (activeTextWnd !is null && oneDesigner._windows.get_modalMode() == msNone) {
            ModuleTextProcessor&& mtp = cast<ModuleTextProcessor>(activeTextWnd.textDoc.tp);
            if (mtp !is null) {
                if (methodsDialog is null)
                    &&methodsDialog = MethodsDialog();
                TextPosition curPos;
                ITextEditor&& editor = activeTextWnd.ted;
                editor.getCaretPosition(curPos);
                int line = methodsDialog.show(mtp.moduleElements, curPos.line);
                if (line > 0) {
                    int len = activeTextWnd.textDoc.tm.getLineLength(line, false);
                    // сначала надо установить каретку на следующую строку, чтобы метод развернулся, если он был свёрнут
                    curPos.line = line + 1;
                    curPos.col = 1;
                    editor.setCaretPosition(curPos);
                    curPos.line = line;
                    editor.setCaretPosition(curPos);
                    editor.scrollToCaretPos();
                    editor.setSelection(curPos, TextPosition(line, len + 1), false);
                    editor.updateView();
                }
                return true;
            }
        }
        return false;
    }

    // Показать выпадающий список снегопата
    bool showSmartBox() {
        // При принудительном вызове списка снегопата надо всё перепарсить
        for (uint i = 0, im = textDocStorage.openedDocs.length; i < im; i++) {
            ModuleTextProcessor&& tp = cast<ModuleTextProcessor>(textDocStorage.openedDocs[i].tp);
            if (tp !is null)
                tp.lastMethodBeginLine = 0;
        }
        for (auto it = allModuleElements.begin(); !it.isEnd(); it++)
            it.value.parsed = false;

        IntelliSite&& isite = getIntelliSite();
        if (isite.isActive())
            isite.hide();
        if (activeTextWnd !is null) {
            ModuleTextProcessor&& tp = cast<ModuleTextProcessor>(activeTextWnd.textDoc.tp);
            if (tp !is null)
                tp.activate(activeTextWnd);
        }
        return true;
    }

    // Сбросить накопленные строки журнала на диск (вызывается по таймеру из errorlog.js)
    void diagFlush() {
        ::diagFlush();
    }
    // Свой файловый механизм настроек (settings_store.as): таймер, принудительная запись, состояние
    void settingsTick() {
        ::settingsTick();
    }
    void settingsFlush() {
        ::settingsFlush();
    }
    string settingsInfo() {
        return ::settingsInfo();
    }
    // Запись в журнал движка из скриптов (всегда, независимо от trace): snegopat.diagLog("категория", "текст")
    void diagLog(const string& cat, const string& text) {
        ::diagAlways(cat, text);
    }

    IV8Lexer&& parseSources(const string& strSource, uint startLine = 1) {
        return IV8Lexer(strSource, startLine);
    }

    OptionsEntry&& _optionEntries = optionList;
    void updateAllEditorsSettings() {
        getEventService().notify(eTxtEdtOptionChanged);
    }

    string getStockTextIndent() {
        IProfileFolder&& pf = getProfileService();
        bool bval;
        pf.getBool("ModuleTextEditor/ReplaceTabOnInput", bval);
        if (bval) {
            int i;
            pf.getInt("ModuleTextEditor/TabSize", i);
            return string(" ", i);
        } else
            return "\t";
    }
};
