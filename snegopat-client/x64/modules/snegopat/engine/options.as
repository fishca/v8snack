/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Работа с настройками
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

funcdef bool OnApplyOption(const Value& newVal);
funcdef void OptionDefVal(Value& val);

class OptionsEntry {
    OptionsEntry&& _next;
    string _name;
    string _profile;
    bool doApply(Variant& newVal) {
        Value val;
        var2val(newVal, val);
        optionWrite(_profile, val);
        return apply(val);
    }
    private OptionDefVal&& defval;
    private OptionDefVal&& init;
    private OnApplyOption&& apply;

    OptionsEntry(const string& n, OptionDefVal&& dv, OptionDefVal&& i, OnApplyOption&& ap) {
        _name = n;
        _profile = "Snegopat/Settings/" + n;
        &&defval = dv;
        &&init = i;
        &&apply = ap;
        &&_next = optionList;
        &&optionList = this;
    }
};

OptionsEntry&& optionList;

// Настройки движка лежат в своих файлах (settings_store.as), раздел Snegopat/Settings
void optionWrite(const string& key, const Value& val) {
    v8string text;
    val.toString(text);
    string internalText = text;
    settingsPut(key, internalText);
}

bool optionRead(const string& key, Value& val) {
    string text;
    if (!settingsGetInternal(key, text))
        return false;
    v8string vs = text;
    valueFromString(vs, val);
    return true;
}

void initAllOption() {
    Value val;
    OptionsEntry&& ptr = optionList;
    while (ptr !is null) {
        if (!optionRead(ptr._profile, val)) {
            ptr.defval(val);
            optionWrite(ptr._profile, val);
        }
        ptr.init(val);
        &&ptr = ptr._next;
    }
}
