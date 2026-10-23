/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Класс для работы с элементами структуры модуля
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

// Типы групп элементов, на которые разделим элементы модуля
enum ElementStoreKind {
    elProcEx,   // экспортные процедуры
    elFuncEx,   // экспортные функции
    elVarEx,    // экспортные переменные модуля
    elProc,     // процедуры
    elFunc,     // функции
    elVar,      // переменные модуля
    elLast
};

// Интерфейс, через который парсер структуры модуля получает его текст
interface ModuleTextSource {
    void getModuleSourceText(v8string& text);
};

ModuleElements&& currentModule; // Модуль, для которого показываем подсказку

class ModuleElements {
    ModuleTextSource&&              source;     // Источник текста модуля
    ModuleStruct&&                  modStruct;  // Результат разбора модуля
    v8string                        moduleText; // текст модуля. Должен сохранятся, пока используется результат разбора модуля
    string                          moduleName; // название модуля
    array<array<SmartBoxItem&&>>    smartItems; // Хранилище элементов для списка снегопата
    uint                            allowedPreprocContextes = uint(-1);
    bool                            parsed = false;
    int_ptr                         lowText = 0; // копия текста в памяти ниже 4 ГБ (для x64 с адресами кучи выше 4 ГБ)

    // snegopat.dll принимает указатель на текст как uint; кучевые адреса платформы 8.3.20+ выше 4 ГБ
    int_ptr textForParser() {
      #if x86
        return moduleText.cstr;
      #else
        int_ptr src = moduleText.cstr;
        if (src < int_ptr(0x80000000))
            return src;
        uint bytes = (moduleText.length + 1) * 2;
        uint size = (bytes + 16 + 0xFFFF) & ~0xFFFF; // +16: парсер читает символ перед началом текста
        for (int_ptr hint = 0x10000000; hint < int_ptr(0x7F000000) && lowText == 0; hint += 0x1000000)
            lowText = VirtualAlloc(hint, size, 0x3000, 4); // MEM_COMMIT|MEM_RESERVE, PAGE_READWRITE
        if (lowText == 0 || lowText >= int_ptr(0x80000000)) {
            dbgLog("parse: не удалось выделить память ниже 4 ГБ");
            return src;
        }
        mem::memcpy(lowText + 16, src, bytes - 2);
        mem::word[lowText + 16 + bytes - 2] = 0;
        return lowText + 16;
      #endif
    }
    void freeLowText() {
      #if x86
      #else
        if (lowText != 0) {
            VirtualFree(lowText, 0, 0x8000); // MEM_RELEASE
            lowText = 0;
        }
      #endif
    }

    ModuleElements() {
        smartItems.resize(elLast);
    }

    void clearResults() {
        for (uint i = 0; i < elLast; i++)
            smartItems[i].resize(0);
        &&modStruct = null;
        freeLowText();
        moduleText = "";
        parsed = false;
    }

    void parse() {
        if (parsed)
            return;
        clearResults();
        source.getModuleSourceText(moduleText);
        if (dbgOn())
            dbgLog("parse: len=" + moduleText.length + " cstr=" + formatInt(moduleText.cstr, "0x", 16) + " ctx=" + formatInt(allowedPreprocContextes, "0x", 8) + " name=" + moduleName);
        &&modStruct = parseModuleText(textForParser(), allowedPreprocContextes);
        for (uint i = 0, im = modStruct.varsCount(); i < im; i++) {
            ModuleStructVar&& var = modStruct.var(i);
            smartItems[var.isExport ? elVarEx : elVar].insertLast(ModuleVarItem(this, var));
        }
        for (uint i = 0, im = modStruct.methsCount(); i < im; i++) {
            ModuleStructMethod&& meth = modStruct.meth(i);
            uint idx = meth.isExport ? (meth.isFunction ? elFuncEx : elProcEx) : (meth.isFunction ? elFunc : elProc);
            smartItems[idx].insertLast(ModuleMethodItem(this, meth));
        }
        parsed = true;
    }
    uint preprocContextForLine(uint line) {
        return modStruct.preprocContextForLine(line);
    }
    void processParseResultForCurrentModule(ParseMethodResult&& res, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames) {
        if (res.isFlagSet(allowProcedure)) {
            isite.addItemGroup(checkAccess(resetExclude(smartItems[elProc]), res.allowedAccesses));
            isite.addItemGroup(checkAccess(resetExclude(smartItems[elProcEx]), res.allowedAccesses));
        }
        if (res.isFlagSet(allowFunction)) {
            isite.addItemGroup(checkAccess(resetExclude(smartItems[elFunc]), res.allowedAccesses));
            isite.addItemGroup(checkAccess(resetExclude(smartItems[elFuncEx]), res.allowedAccesses));
        }
        if (res.isFlagSet(allowModuleVar)) {
            // Имена переменных модуля надо проверять - возможно их перекрывают имена параметров и явных локальных переменных
            isite.addItemGroup(checkAccess(checkNamesInSet(resetExclude(smartItems[elVar]), propNames), res.allowedAccesses));
            isite.addItemGroup(checkAccess(checkNamesInSet(resetExclude(smartItems[elVarEx]), propNames), res.allowedAccesses));
        }
        // Добавим в имена все методы и переменные модуля
        for (uint i = 0, im = modStruct.methsCount(); i < im; i++)
            methNames.insert(modStruct.meth(i).name);
        for (uint i = 0, im = modStruct.varsCount(); i < im; i++)
            propNames.insert(modStruct.var(i).name);
    }
    void processParseResultForOtherModule(ParseMethodResult&& res, IntelliSite&& isite, NoCaseSet& methNames, NoCaseSet& propNames) {
        if (currentModule is this)
            return;
        if (res.isFlagSet(allowProcedure))
            isite.addItemGroup(checkAccess(checkNamesInSet(resetExclude(smartItems[elProcEx]), methNames), res.allowedAccesses));
        if (res.isFlagSet(allowFunction))
            isite.addItemGroup(checkAccess(checkNamesInSet(resetExclude(smartItems[elFuncEx]), methNames), res.allowedAccesses));
        if (res.isFlagSet(allowGCProp))
            isite.addItemGroup(checkAccess(checkNamesInSet(resetExclude(smartItems[elVarEx]), propNames), res.allowedAccesses));
    }
    string nameOfModule() const
    {
        return currentModule is this ? "Этот модуль" : moduleName;
    }
};

array<SmartBoxItem&&>&& resetExclude(array<SmartBoxItem&&>&& items) {
    for (uint i = 0, im = items.length; i < im; i++)
        items[i].d.exclude = false;
    return items;
}


array<SmartBoxItem&&>&& checkAccess(array<SmartBoxItem&&>&& items, uint access) {
    // Тут должен быть цикл, устанавливающий exclude взависимости от доступности метода/переменной
    return items;
}

array<SmartBoxItem&&>&& checkNamesInSet(array<SmartBoxItem&&>&& items, NoCaseSet& set) {
    for (uint i = 0, im = items.length; i < im; i++) {
        SmartBoxItem&& it = items[i];
        if (set.contains(it.d.descr))
            it.d.exclude = true;
        else
            set.insert(it.d.descr);
    }
    return items;
}

class MDModuleTextSource : ModuleTextSource {
    IMDObject&& mdObj;
    Guid mdProp;
    MDModuleTextSource(IMDObject&& obj, const Guid& g) {
        &&mdObj = obj;
        mdProp = g;
    }
    void getModuleSourceText(v8string& text) {
        IMDEditHelper&& peh;
        getMDEditService().getEditHelper(peh, mdObj);
        if (peh !is null) {
            IMDEditModuleHelper&& emh = peh.unk;
            if (emh !is null) {
                Vector v;
                emh.hasModule(mdProp, v);
                if (v.end > v.start) {
                    emh.textOfModule(mdProp, true, text);
                    return;
                }
            }
        }
        text = "";
    }
};

string moduleName(IMDObject&& obj, const Guid& mdProp) {
    return mdObjFullName(obj) + "." + mdPropName(mdProp);
}

NoCaseMap<ModuleElements&&> allModuleElements;

ModuleElements&& findModuleElementsParser(IMDObject&& obj, const Guid& mdProp) {
    auto find = allModuleElements.find(keyForSearchOpenedMD(obj, mdProp));
    return find.isEnd() ? null : find.value;
}

ModuleElements&& getModuleElementsParser(IMDObject&& obj, const Guid& mdProp, ModuleTextSource&& src = null) {
    ModuleElements&& me = findModuleElementsParser(obj, mdProp);
    if (me is null) {
        &&me = ModuleElements();
        me.moduleName = moduleName(obj, mdProp);
        allModuleElements.insert(keyForSearchOpenedMD(obj, mdProp), me);
    }
    &&me.source = src is null ? cast<ModuleTextSource>(MDModuleTextSource(obj, mdProp)) : src;
    return me;
}

void removeModuleElementsParser(ModuleElements&& me, IMDObject&& obj, const Guid& mdProp) {
    &&me.source = null;
    allModuleElements.remove(keyForSearchOpenedMD(obj, mdProp));
}

class ModuleMethodItem : SmartBoxInsertableItem, MethodInsertable {
    ModuleElements&& owner;
    ModuleStructMethod&& info;
    ModuleMethodItem(ModuleElements&& o, ModuleStructMethod&& i) {
        super(i.name, imgPublicMethod);
        &&owner = o;
        &&info = i;
        paramsCount = i.paramsCount();
        isFunction = i.isFunction;
    }
    void textForTooltip(string& text) {
        text = (isFunction ? "Функция " : "Процедура ") + info.name + "(";
        if (paramsCount > 0) {
            for (uint i = 0, im = paramsCount - 1; i < im; i++)
                text += info.param(i) + ", ";
            text += info.param(paramsCount - 1);
        }
        text += ")";
        if (info.isExport)
            text += " Экспорт";
        text += "\n" + owner.nameOfModule() + ", строка " + info.line;
        string comment = getPreviousCommentBlock(info.beginPos, owner.moduleText.cstr);
        if (!comment.isEmpty())
            text += "\n" + comment;
    }
};

class ModuleVarItem : SmartBoxInsertableItem {
    ModuleElements&& owner;
    ModuleStructVar&& info;
    ModuleVarItem(ModuleElements&& o, ModuleStructVar&& i) {
        super(i.name, imgPublicVar);
        &&owner = o;
        &&info = i;
    }
    void textForTooltip(string& text) {
        text = "Перем " + info.name;
        if (info.isExport)
            text += " Экспорт";
        text += "\n" + owner.nameOfModule() + ", строка " + info.line;
        string comment = getPreviousCommentBlock(info.beginPos, owner.moduleText.cstr);
        if (!comment.isEmpty())
            text += "\n" + comment;
    }
};

class LocalVarSmartItem: SmartBoxInsertableItem {
    LocalVarItem&& info;
    LocalVarSmartItem(LocalVarItem&& i) {
        super(i.name, imgLocalVar);
        &&info = i;
    }
    void textForTooltip(string& text) {
        if (info.type == lvParam)
            text = "Параметр ";
        else if (info.type == lvVar)
            text = "Перем ";
        else
            text = "Локальная переменная ";
        text += info.name;
    }
};

class CommonModuleItem : SmartBoxInsertableItem {
    CommonModuleItem(const string& name) {
        super(name, imgCmnModule);
    }
    void textForTooltip(string& text) {
        text = "Общий модуль " + d.descr;
    }
    void textForInsert(string&out text) {
        text = d.descr + ".";
    }
    void afterInsert(TextWnd&& editor) {
        showV8Assist();
    }
};

namespace Delimeters {

enum Types {
    parenthesis,
    parenthesisWithBackSpace,
    squareBracket,
    quote,
    date,
    question,
    lastType,
};

class Item : SmartBoxInsertableItem {
    string tt;
    string ins;
    bool noActivate;
    bool needSemicolon;

    Item(const string& name, const string& t, const string& i, bool na = false, bool ns = false) {
        super(name, imgParenthesis);
        d.hotOrder = uint(-1);
        tt = t;
        ins = i;
        noActivate = na;
        needSemicolon = ns;
    }

    void textForTooltip(string& text) {
        text = tt;
    }
    void textForInsert(string&out text) {
        text = ins;
        if (needSemicolon && getIntelliSite().isLineTailEmpty())
            text += ";";
    }
    void afterInsert(TextWnd&& editor) {
        if (!noActivate)
            showV8Assist();
    }
};

array<Item&&>&& items;

Item&& getDelimeter(Types type) {
    if (items is null) {
        &&items = array<Item&&> = {
            Item("(...)",	"Вставить скобки", "(¦)"),
            Item("(...)",	"Вставить скобки", "\x8(\"¦)"),
            Item("[...]",	"Вставить квадратные скобки", "[¦]"),
            Item("\"...\"", "Вставить кавычки", "\"¦\""),
            Item("'...'",	"Вставить дату", "'¦'"),
            Item("(, , )",	"Вставить после знака вопроса", "(¦, , )", true, true)
        };
    }
    return items[type];
}

}//namespace Delimeters
