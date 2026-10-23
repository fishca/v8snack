//engine: JScript
//uname: select_scripts
//dname: Выбор подключаемых скриптов
//debug: yes
//author: orefkov
//descr: Скрипт для настройки состава подключаемых скриптов Снегопата
//help: inplace
exports.__esModule = true;
/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Выбор подключаемых скриптов.
 */
/// <reference path="../snegopat.d.ts"/>
/// <reference path="../v8.d.ts"/>
/*@
Скрипт позволяет выбрать, какие скрипты Снегопата подключать при его запуске.

Настройка осуществляется расстановкой галочек на сриптах - какие загружать, какие нет.
После нажатия "Запомнить и применить" - запоминается расстановка галочек, закрывается форма,
и те скрипты, которые нужно запустить, и не запущены - запускаются, а какие не нужно запустить,
а они работают, соответственно, выгружаются.

Если окно просто закрыть - ничего не происходит.

Можно сразу снять выбор со всех скриптов. Можно включить те, авторы которых посчитали нужным
внести их в рекомендуемые для разных уровней опыта пользования Снегопатом.
Гуру могут одной кнопкой включить все скрипты.
@*/
//global.connectGlobals(SelfScript);
var stdlib = require("./std");
var helpsys = require("./help");
var profileKey = "Snegopat/LoadAddins";
var SelectScriptsForm = /** @class */ (function () {
    function SelectScriptsForm() {
        this.form = loadScriptFormEpf(env.pathes.addins + "std\\forms\\sn_forms.epf", "SelectScripts", this);
        this.form.AddinsTree.Columns.Add("ScriptInfo");
    }
    SelectScriptsForm.openForm = function () {
        if (!this.oneForm)
            this.oneForm = new SelectScriptsForm();
        this.oneForm.form.Open();
    };
    SelectScriptsForm.prototype.ПриОткрытии = function () {
        this.form.AddinsTree.Rows.Clear();
        var repo = stdlib.allAddins();
        (function (category, rows) {
            for (var catIdx in category.childs) {
                var cat = category.childs[catIdx];
                var r = rows.Add();
                r.Addin = cat.name;
                r.Picture = 0;
                r.OnOff = false;
                arguments.callee(cat, r.Rows);
            }
            for (var i in category.scripts) {
                var uname = category.scripts[i];
                var scr = repo.scripts[uname];
                var r = rows.Add();
                r.Addin = scr.name;
                r.Descr = scr.tags.descr;
                r.Picture = 2;
                r.ScriptInfo = scr;
                r.OnOff = !!addins.byUniqueName(uname);
            }
        })(repo.categories, this.form.AddinsTree.Rows);
    };
    SelectScriptsForm.prototype.AddinsTreeПриВыводеСтроки = function (Элемент, ОформлениеСтроки, ДанныеСтроки) {
        var data = ДанныеСтроки.val;
        ОформлениеСтроки.val.Cells.Addin.ОтображатьФлажок = data.Picture != 0;
        ОформлениеСтроки.val.Cells.Addin.Флажок = data.OnOff;
    };
    SelectScriptsForm.prototype.AddinsTreeПриИзмененииФлажка = function (Элемент, Колонка) {
        Элемент.val.ТекущаяСтрока.OnOff = !Элемент.val.ТекущаяСтрока.OnOff;
    };
    SelectScriptsForm.prototype.forAllRows = function (func) {
        (function (rows) {
            for (var i = 0; i < rows.Count(); i++) {
                var r = rows.Get(i);
                arguments.callee(r.Rows);
                func(r);
            }
        })(this.form.AddinsTree.Rows);
    };
    SelectScriptsForm.prototype.selectByLevel = function (level) {
        this.forAllRows(function (r) { if (r.ScriptInfo && r.ScriptInfo.autoLevel > 0 && r.ScriptInfo.autoLevel <= level)
            r.OnOff = true; });
    };
    SelectScriptsForm.prototype.CmdBarallOff = function (button) {
        this.forAllRows(function (a) { a.OnOff = false; });
    };
    SelectScriptsForm.prototype.CmdBarallForAll = function (button) {
        this.forAllRows(function (a) { if (a.ScriptInfo)
            a.OnOff = true; });
    };
    SelectScriptsForm.prototype.CmdBarallForBeginner = function (button) {
        this.selectByLevel(1);
    };
    SelectScriptsForm.prototype.CmdBarallForMid = function (button) {
        this.selectByLevel(2);
    };
    SelectScriptsForm.prototype.CmdBarallForTop = function (button) {
        this.selectByLevel(3);
    };
    SelectScriptsForm.prototype.CmdBarcmdApply = function (button) {
        var vt = profileRoot.getValue(profileKey);
        if (!vt) {
            vt = v8New("ValueTree");
            vt.Columns.Add("Addin");
            vt.Columns.Add("isGroup");
            profileRoot.createValue(profileKey, vt, pflSnegopat);
        }
        else
            vt.Rows.Clear();
        (function (srcTreeRows, destTreeRows, parentGroup) {
            for (var i = 0; i < srcTreeRows.Count(); i++) {
                var r = srcTreeRows.Get(i);
                if (r.ScriptInfo) {
                    var addin = addins.byUniqueName(r.ScriptInfo.tags.uname);
                    if (r.OnOff) {
                        var destRow = destTreeRows.Add();
                        destRow.Addin = r.ScriptInfo.load;
                        destRow.isGroup = false;
                        if (!addin)
                            loadAddin(r.ScriptInfo.load, parentGroup);
                    }
                    else if (addin)
                        addins.unloadAddin(addin);
                }
                else {
                    var aGroup = parentGroup.addGroup(r.Addin);
                    var destRow = destTreeRows.Add();
                    arguments.callee(r.Rows, destRow.Rows, aGroup);
                    if (destRow.Rows.Count()) {
                        destRow.Addin = r.Addin;
                        destRow.isGroup = true;
                    }
                    else {
                        destTreeRows.Delete(destRow);
                        parentGroup.removeGroup(aGroup);
                    }
                }
            }
        })(this.form.AddinsTree.Rows, vt.Rows, addins.users);
        profileRoot.setValue(profileKey, vt);
        saveProfile();
        this.form.Close();
    };
    SelectScriptsForm.prototype.CmdBarHelp = function (button) {
        var row = this.form.Controls.AddinsTree.CurrentRow;
        if (row && row.ScriptInfo) {
            helpsys.getHelpSystem().openHelp(row.ScriptInfo);
        }
    };
    SelectScriptsForm.prototype.AddinsTreeПриАктивизацииСтроки = function (control) {
        var row = this.form.Controls.AddinsTree.CurrentRow;
        if (row && row.ScriptInfo && row.ScriptInfo.helpPath)
            this.form.Controls.AddinInfo.Navigate(env.pathes.main + row.ScriptInfo.helpPath);
        else {
            //this.form.Controls.AddinInfo.Navigate(env.pathes.main + "help\\docs_firststep.md0.html");
            //this.form.Controls.AddinInfo.Navigate("about:blank");
            this.form.Controls.AddinInfo.SetText("<html><body></body></html>");
        }
    };
    SelectScriptsForm.prototype.КонтекстноеМенюbtnReload = function (button) {
        var row = this.form.Controls.AddinsTree.CurrentRow;
        if (row && row.ScriptInfo) {
            var addin = addins.byUniqueName(row.ScriptInfo.tags.uname);
            if (addin && addins.isAddinUnloadable(addin)) {
                try {
                    addins.unloadAddin(addin);
                    addins.loadAddin(row.ScriptInfo.load, addin.group);
                }
                catch (e) {
                    Message("Произошла ошибка: " + e.description);
                }
            }
        }
    };
    SelectScriptsForm.oneForm = null;
    return SelectScriptsForm;
}());
function openForm() {
    SelectScriptsForm.openForm();
}
function loadAddin(loaderStr, group) {
    //Message("Load " + loaderStr);
    if (!addins.loadAddin(loaderStr, group)) {
        Message("Ошибка загрузки аддина '" + loaderStr + "': " + addins.lastAddinError);
        return false;
    }
    return true;
}
function loadUserScripts() {
    // Список загружаемых аддинов хранится в виде дерева значений в настройках снегопата
    var vt = profileRoot.getValue(profileKey);
    if (!vt || !vt.Rows.Count()) {
        openForm();
    }
    else {
        (function (rows, parentGroup) {
            for (var i = 0, c = rows.Count(); i < c; i++) {
                var row = rows.Get(i);
                if (row.isGroup)
                    arguments.callee(row.Rows, parentGroup.addGroup(row.Addin));
                else
                    loadAddin(row.Addin, parentGroup);
            }
        })(vt.Строки, addins.users);
    }
}
