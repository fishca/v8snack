//engine: JScript
//uname: snegopatwnd
//dname: Показ окна Снегопата
//addin: global
//debug: no
//author: orefkov
//descr: Скрипт для работы с окном снегопата
//help: inplace
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Показ окна снегопата
 */
/// <reference path="../snegopat.d.ts"/>
/// <reference path="../v8.d.ts"/>
/*@
Скрипт обеспечивает работу основного окна снегопата.
@*/
global.connectGlobals(SelfScript);
var helpsys = require("./help");
var hks = require("./hotkeys");
var macroswnd = require("./macroswnd");
var wndStateProfilePath = "Snegopat/WndOpened";
var clrLoadedAddin = v8New("Color", 0, 150, 0);
// Данное значение устанавливается основным загрузчиком аддинов и указывает раздел,
// где сохраняется список загружаемых аддинов
var addinsProfileKey;
;
var FormDriver = (function () {
    var currentPage;
    var instances = {};
    var form;
    return {
        switchPage: function (pageNum) {
            if (currentPage) {
                var i = instances[currentPage];
                if (i)
                    i.exit();
            }
            currentPage = form.Panel.Pages.Get(pageNum).Name;
            if (currentPage in instances)
                i = instances[currentPage];
            else {
                i = instances[currentPage] = new SelfScript.self[currentPage + "Page"];
                for (var p in i) {
                    if (/^handler(.+)/.exec(p))
                        this[RegExp.$1] = (function (obj, met) { return function () { obj[met].apply(obj, arguments); }; })(i, p);
                }
                i.connect(form);
            }
            i.enter();
        },
        open: function () {
            if (!form) {
                form = loadScriptFormEpf(env.pathes.addins + "\\std\\forms\\sn_forms.epf", "MainWindow", this);
                form.UniqueKey = form.WindowOptionsKey = "SnegopatMainForm";
                this.switchPage(0);
                events.connect(Designer, "beforeExitApp", function () { profileRoot.setValue(wndStateProfilePath, form.IsOpen()); }, "-");
            }
            form.Open();
        },
        selectPage: function (name) {
            for (var i = 0, k = form.Panel.Pages.Count(); i < k; i++) {
                var page = form.Panel.Pages.Get(i);
                if (page.Name == name) {
                    form.Panel.CurrentPage = page;
                    break;
                }
            }
        },
        OnCurrentPageChange: function (Control, CurrentPage) {
            this.switchPage(CurrentPage.val);
        }
    };
})();
function openWnd() {
    FormDriver.open();
}
exports.openWnd = openWnd;
function openPage(name) {
    FormDriver.open();
    FormDriver.selectPage(name);
}
exports.openPage = openPage;
// Базовый класс обработчика параметра настроек снегопата
var Param = /** @class */ (function () {
    function Param(control) {
        this.control = control;
    }
    Param.prototype.fromForm = function (form) {
        return form[this.control];
    };
    Param.prototype.toForm = function (form, val) {
        form[this.control] = val;
    };
    Param.prototype.validate = function (val) {
        return true;
    };
    Param.prototype.isEqual = function (val1, val2) {
        return val1 == val2;
    };
    Param.prototype.needReboot = function () {
        return false;
    };
    return Param;
}());
;
// Параметр, хранящийся в значении элемента формы (элемент добавлен программно — реквизита формы у него нет)
var ParamCtrl = /** @class */ (function (_super) {
    __extends(ParamCtrl, _super);
    function ParamCtrl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ParamCtrl.prototype.fromForm = function (form) {
        return !!form.Controls[this.control].Value;
    };
    ParamCtrl.prototype.toForm = function (form, val) {
        form.Controls[this.control].Value = !!val;
    };
    ParamCtrl.prototype.isEqual = function (val1, val2) {
        return !!val1 == !!val2;
    };
    return ParamCtrl;
}(Param));
;
// Данный обработчик параметра раскидывает параметр-битовый набор флагов по отдельным флажкам на форме
var ParamFlags = /** @class */ (function (_super) {
    __extends(ParamFlags, _super);
    function ParamFlags() {
        var ctrls = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            ctrls[_i] = arguments[_i];
        }
        var _this = _super.call(this, '') || this;
        _this.controls = ctrls;
        return _this;
    }
    ParamFlags.prototype.fromForm = function (form) {
        var v = 0, flag = 1;
        for (var k in this.controls) {
            v |= form[this.controls[k]] ? flag : 0;
            flag <<= 1;
        }
        return v;
    };
    ParamFlags.prototype.toForm = function (form, v) {
        var flag = 1;
        for (var k in this.controls) {
            form[this.controls[k]] = 0 != (v & flag);
            flag <<= 1;
        }
    };
    return ParamFlags;
}(Param));
;
var ParamColor = /** @class */ (function (_super) {
    __extends(ParamColor, _super);
    function ParamColor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ParamColor.prototype.validate = function (val) {
        if (ValueToStringInternal(val.Type) != '{"#",7c626d2b-6cc1-4f6c-9367-352a9da94a2e,0}') {
            MessageBox("Параметр " + this.control + ". Для цвета можно задавать только абсолютные значения!");
            return false;
        }
        return true;
    };
    ParamColor.prototype.isEqual = function (val1, val2) {
        return ValueToStringInternal(val1) == ValueToStringInternal(val2);
    };
    return ParamColor;
}(Param));
;
var SettingsPage = /** @class */ (function () {
    function SettingsPage() {
        this.optMap = {};
        this.params = {
            // Название опции в движке снегопата : связь с полем формы
            EnableCustomGrouping: new Param("ПользовательскиеГруппировки"),
            QueryColors: new Param("РаскрашиватьСтроки"),
            EnableTextWork: new Param("EnableTextWork"),
            Autoreplace: new Param("Автозамены"),
            EnableSmartEnter: new Param("SmartEnter"),
            EnableSmartList: new Param("SmartList"),
            HookStdList: new Param("ПерехватШтатногоСписка"),
            EnableHidingRemark: new Param("HidingRemark"),
            ListWidth: new Param("ШиринаСписка"),
            QuickActivateCharsCount: new Param("СимволовДляАктивации"),
            //ParamsAutoShow: new Param("ParamsAutoShow"),
            AllowFilterInSmartList: new Param("AllowFilterInSmartList"),
            InsertTextOnDot: new Param("InsertTextOnDot"),
            UseLangs: new ParamFlags("фАнглийский", "фРусский"),
            EnableBkColorForMultyLine: new Param("EnableBkColorForMultyLine"),
            MultiLineBackground: new ParamColor("ЦветФонаМногострочныхСтрок"),
            GroupMultiLine: new Param("GroupMultiLine"),
            UseCtrlClicks: new Param("UseCtrlClicks"),
            ShowNotifyOnStartup: new Param("ShowNotifyOnStartup"),
            CamelSearchOnUpperOnly: new Param("CamelSearchOnUpperOnly"),
            MaximizeWindows: new ParamCtrl("MaximizeWindows")
        };
    }
    // Флажки, которых нет в sn_forms.epf: добавляются на страницу настроек при подключении
    // (правка epf возможна только в редакторе форм). Действие «при изменении» — то же, что у соседнего флажка.
    SettingsPage.prototype.addExtraControls = function (form) {
        var ref = form.Controls.ShowNotifyOnStartup;
        if (form.Controls.Find("MaximizeWindows"))
            return;
        var cbType = v8New("ОписаниеТипов", "Флажок").Типы().Получить(0);
        var cb = form.Controls.Add(cbType, "MaximizeWindows", true, form.Panel);
        cb.Caption = "Открывать окна развёрнутыми";
        cb.Top = ref.Top + 22;
        cb.Left = ref.Left;
        cb.Width = ref.Width;
        cb.Height = ref.Height;
        try { cb.SetAction("OnChange", ref.GetAction("OnChange")); } catch (e) { }
    };
    SettingsPage.prototype.connect = function (form) {
        this.form = form;
        this.addExtraControls(form);
        this.optFolder = profileRoot.getFolder("Snegopat/Settings");
        var op = snegopat.optionEntries;
        while (op) {
            this.optMap[op.name] = op;
            op = op.next;
        }
        this.readParams();
    };
    SettingsPage.prototype.enableButtons = function (e) {
        var b = this.form.Controls.SettingsCmdBar.Buttons;
        b.SaveSettings.Enabled = b.RestoreSettings.Enabled = e;
    };
    SettingsPage.prototype.readParams = function () {
        for (var k in this.params) {
            var p = this.params[k];
            var sp = this.optMap[k];
            p.toForm(this.form, sp ? profileRoot.getValue(sp.profile) : this.optFolder.getValue(k));
        }
        this.handlerПользовательскиеГруппировкиПриИзменении();
        this.enableButtons(false);
    };
    SettingsPage.prototype.isParamChanged = function () {
        for (var k in this.params) {
            var p = this.params[k];
            var sp = this.optMap[k];
            if (!p.isEqual(sp ? profileRoot.getValue(sp.profile) : this.optFolder.getValue(k), p.fromForm(this.form)))
                return true;
        }
        return false;
    };
    SettingsPage.prototype.applyParams = function () {
        var reboot = false;
        for (var k in this.params) {
            var p = this.params[k];
            var onform = p.fromForm(this.form);
            if (!p.validate(onform))
                return false;
        }
        for (var k in this.params) {
            var p = this.params[k];
            var onform = p.fromForm(this.form);
            var sp = this.optMap[k];
            var saved = sp ? profileRoot.getValue(sp.profile) : this.optFolder.getValue(k);
            if (!p.isEqual(onform, saved)) {
                if (sp) {
                    if (sp.doApply(onform))
                        reboot = true;
                }
                else {
                    this.optFolder.setValue(k, onform);
                    if (p.needReboot())
                        reboot = true;
                }
            }
        }
        saveProfile();
        if (reboot)
            MessageBox("Необходимо перезапустить Конфигуратор для вступления изменений в силу.", mbIconWarning, "Снегопат");
        return true;
    };
    SettingsPage.prototype.enter = function () {
    };
    SettingsPage.prototype.exit = function () {
    };
    SettingsPage.prototype.handlerSettingsCmdBarSelectScripts = function () {
        addins.byUniqueName("select_scripts").object().openForm();
    };
    SettingsPage.prototype.handlerSettingsCmdBarSaveSettings = function () {
        if (this.applyParams())
            this.enableButtons(false);
    };
    SettingsPage.prototype.handlerSettingsCmdBarRestoreSettings = function () {
        this.readParams();
    };
    SettingsPage.prototype.handlerфРусскийПриИзменении = function () {
        this.form.фАнглийский = true;
        this.enableButtons(this.isParamChanged());
    };
    SettingsPage.prototype.handlerфАнглийскийПриИзменении = function () {
        this.form.фРусский = true;
        this.enableButtons(this.isParamChanged());
    };
    SettingsPage.prototype.handlerПользовательскиеГруппировкиПриИзменении = function () {
        var form = this.form;
        if (!form.РаскрашиватьСтроки)
            form.EnableBkColorForMultyLine = false;
        form.ЭлементыФормы.EnableBkColorForMultyLine.Доступность = form.РаскрашиватьСтроки;
        form.ЭлементыФормы.ЦветФонаМногострочныхСтрок.Доступность = form.EnableBkColorForMultyLine;
        if (!form.EnableTextWork) {
            form.Автозамены = false;
            form.SmartEnter = false;
            form.SmartList = false;
        }
        var ctrls = ['Автозамены', 'SmartEnter', 'SmartList'];
        for (var k in ctrls)
            form.ЭлементыФормы[ctrls[k]].Доступность = form.EnableTextWork;
        ctrls = ['ШиринаСписка', 'СимволовДляАктивации', 'AllowFilterInSmartList', 'фРусский', 'фАнглийский', 'InsertTextOnDot'];
        for (var k in ctrls)
            form.ЭлементыФормы[ctrls[k]].Доступность = form.SmartList;
        this.enableButtons(this.isParamChanged());
    };
    SettingsPage.prototype.handlerCheckChanges = function () {
        this.enableButtons(this.isParamChanged());
    };
    SettingsPage.prototype.handlerAltEditorsНажатие = function () {
        addins.byUniqueName('alteditors').object().setup();
    };
    return SettingsPage;
}());
var HotkeysPage = /** @class */ (function () {
    function HotkeysPage() {
    }
    HotkeysPage.prototype.connect = function (form) {
        this.form = form;
        this.form.HKTable.Columns.Add("RealCmd");
        this.fillTable();
    };
    HotkeysPage.prototype.enter = function () {
    };
    HotkeysPage.prototype.exit = function () {
    };
    HotkeysPage.prototype.fillTable = function () {
        this.form.HKTable.Clear();
        // Заполняем текущими хоткеями
        for (var i = 0; i < hotkeys.count; i++) {
            var hk = hotkeys.item(i);
            var row = this.form.HKTable.Add();
            row.RealCmd = hk.addin + "::" + hk.macros;
            row.HotKey = hks.KeyCodes.stringFromCode(hk.key);
            var a = addins.byUniqueName(hk.addin);
            row.Command = a ? a.displayName + "::" + hk.macros : row.RealCmd;
        }
    };
    HotkeysPage.prototype.handlerHKTableКомандаStartChoice = function (Элемент, СтандартнаяОбработка) {
        var macrosSelect = macroswnd.MacrosWnd();
        var res = macrosSelect.selectMacros();
        if (res) {
            var row = this.form.Controls.HKTable.CurrentRow;
            row.RealCmd = res.addin + "::" + res.macros;
            var a = addins.byUniqueName(res.addin);
            row.Command = a ? a.displayName + "::" + res.macros : row.RealCmd;
        }
    };
    HotkeysPage.prototype.handlerHkCmdBarApply = function () {
        var vt = hks.ProfileExchanger.loadHotkeys();
        var myvt = this.form.HKTable;
        vt.Clear();
        for (var idx = 0; idx < myvt.Count(); idx++) {
            var from = myvt.Get(idx);
            var to = vt.Add();
            to.Команда = from.RealCmd;
            to.СочетаниеКлавиш = from.HotKey;
        }
        // Установим все хоткееи
        hks.applyKeysFromValueTable(vt);
        // Сохраним таблицу хоткеев в профайл
        hks.ProfileExchanger.saveHotkeys(vt);
        saveProfile();
    };
    HotkeysPage.prototype.handlerHkCmdBarCancel = function () {
        this.fillTable();
    };
    HotkeysPage.prototype.handlerHKTableСочетаниеКлавишStartChoice = function (Control, StandardProcessing) {
        var selector = new hks.SelectHotKey(this.form.Controls.HKTable);
        var result = selector.select(this.form.Controls.HKTable.CurrentRow.HotKey);
        if (result)
            this.form.Controls.HKTable.CurrentRow.HotKey = result;
    };
    HotkeysPage.prototype.handlerHKTableOnActivateRow = function (Control) {
        var info = this.getCommandDescr(this.form.Controls.HKTable.CurrentRow);
        this.form.Controls.CommandDescription.Caption = info ? info.descr.replace(/&/g, "&&") : "";
    };
    HotkeysPage.prototype.handlerHKTableOnRowOutput = function (Control, RowAppearance, RowData) {
        var info = this.getCommandDescr(RowData.val);
        if (info) {
            var ca = RowAppearance.val.Cells.Command;
            ca.ShowPicture = true;
            if (info.picture)
                ca.Picture = info.picture;
            else
                ca.PictureIndex = 1;
        }
    };
    HotkeysPage.prototype.getCommandDescr = function (row) {
        if (row.RealCmd && typeof (row.RealCmd) == "string") {
            var info = { picture: undefined, hotkey: "", descr: "" };
            var cmd = row.RealCmd.split("::");
            var a = addins.byUniqueName(cmd[0]);
            if (a && a.object && a.object["getMacrosInfo"])
                a.object["getMacrosInfo"](cmd[1], info);
            return info;
        }
        return null;
    };
    return HotkeysPage;
}());
var UpdatePage = /** @class */ (function () {
    function UpdatePage() {
        this.wsh = new ActiveXObject("WScript.Shell");
        this.pathToFossil = '';
        this.pathToFecho = '';
        this.profilePath = env.pathes.data + "proxy.cmd";
    }
    UpdatePage.prototype.connect = function (form) {
        this.form = form;
        var buttons = this.form.Controls.cmdBarUpdate.Buttons;
        this.btnDownloadSnegopat = buttons.Find("btnDownloadSnegopat");
        this.btnRefreshRepo = buttons.Find("btnRefreshRepo");
        this.btnSubscribePage = buttons.Find("btnSubscribePage");
        var pf = env.pathes.tools + 'fossil.exe';
        var file = v8New("File", pf);
        if (file.Существует()) {
            this.pathToFossil = '"' + file.FullName + '" ';
            this.pathToFecho = '| "' + file.Path + 'fecho.exe" ';
        }
        else
            Message("Не найден путь к fossil");
        file = v8New("File", env.pathes.core + "_fossil_");
        this.form.localRepoPath = file.Path;
        this.localRepoExist = file.Существует();
        if (!this.localRepoExist) {
            MessageBox('Нет синхронизации локального и внешнего репозитария. Заполните данные для подключения и нажмите "Обновить репозитарий"');
        }
        this.pathToCmd = GetTempFileName(".cmd");
        this.pathToOut = GetTempFileName();
        this.form.Controls.snLocalVersion.Caption = env.sVersion + ' ' + env.BuildDateTime;
        this.remoteRepoRow = this.form.vtRepoList.Rows.Add();
        this.localRepoRow = this.form.vtRepoList.Rows.Add();
        this.remoteRepoRow.content = "Внешний репозитарий снегопата";
        this.localRepoRow.content = "Локальный репозитарий";
        if (this.localRepoExist) {
            this.runFossilLocal('settings autosync on', false, false);
            var res = this.runFossilLocal("remote", false, false).split('\n')[0];
            if (res.match(/^http:/)) {
                var login = res.match(/\/\/([^@]+)@/);
                if (login)
                    this.form.snegopatLogin = login[1];
                this.form.remoteRepoURL = res.replace(/\/\/[^@]+@/, '//') + '/';
            }
        }
        else
            this.form.remoteRepoURL = "http://snegopat.ru/new/";
        if (!this.form.remoteRepoURL.length) {
            Message("Не удалось получить URL внешнего репозитария снегопата");
        }
        this.readSettings();
        file = v8New("File", env.pathes.data + "cntlm.ini");
        this.ntlmIni = file.FullName;
        if (!file.Существует()) {
            var td = v8New("TextDocument");
            td.Write(this.ntlmIni);
        }
        this.fillRepoList();
        this.updateVersionInfo();
    };
    UpdatePage.prototype.updateVersionInfo = function () {
        this.form.VersionsForReport = "[" + env.sVersion + " | " + env.v8Version + " | " + (this.lastLocalDate.toLocaleDateString() + " " + this.lastLocalDate.toLocaleTimeString()) + "]";
    };
    UpdatePage.prototype.enter = function () {
    };
    UpdatePage.prototype.exit = function () {
    };
    UpdatePage.prototype.readSettings = function () {
        var td = v8New("TextDocument");
        try {
            td.Read(this.profilePath);
            td.LineSeparator = '\n';
            var lines = td.GetText().split('\n');
            for (var k in lines) {
                var m = lines[k].match(/^set\s+([^=]+)=(.*)/i);
                if (m) {
                    if (m[1] in this.form) {
                        var field = this.form[m[1]];
                        if ('boolean' == typeof field)
                            this.form[m[1]] = m[2] == 'true';
                        else
                            this.form[m[1]] = m[2];
                    }
                }
            }
        }
        catch (e) { }
    };
    UpdatePage.prototype.storeSettings = function () {
        var td = v8New("TextDocument");
        var fields = ['useProxy', 'notStorePass', 'proxyAddress', 'proxyUser', 'proxyNtlm', 'ntlmAuth', 'ntlmPort'];
        if (!this.form.notStorePass)
            fields.push('proxyPass');
        for (var k in fields)
            td.AddLine("set " + fields[k] + "=" + this.form[fields[k]]);
        td.Write(this.profilePath, "cp866");
    };
    UpdatePage.prototype.fillRepoList = function () {
        try {
            var td = v8New('TextDocument');
            td.Read(env.pathes.core + 'snegopat.dll.version');
            this.form.Controls.snRemoteVersion.Caption = td.GetText();
        }
        catch (e) { }
        var lastLocalTime = this.readLocalTimeline();
        this.readRemoteTimeline(lastLocalTime);
    };
    UpdatePage.prototype.startNtlm = function () {
        this.killNtlm();
        this.wsh.Run("\"" + env.pathes.tools + "cntlm\\cntlm.exe\" -c \"" + this.ntlmIni + "\" -s -a " + this.form.ntlmAuth + " -l " + this.form.ntlmPort + " " +
            (this.form.proxyPass.length ? "-p \"" + this.form.proxyPass + "\"" : '') + (" -u \"" + this.form.proxyUser + "\" " + this.form.proxyAddress), 0, 1);
    };
    UpdatePage.prototype.killNtlm = function () {
        this.wsh.Run("taskkill /f /IM cntlm.exe", 0, 1);
    };
    UpdatePage.prototype.runFossilLocal = function (command, visible, needConnect) {
        if (this.pathToFossil.length) {
            var td = v8New("TextDocument");
            td.Write(this.pathToOut, 'UTF-8');
            td.AddLine("@echo off");
            var ntlmStarted = false;
            if (needConnect && this.form.useProxy) {
                var hp = "set http_proxy=http://";
                if (this.form.proxyNtlm) {
                    this.startNtlm();
                    hp += '127.0.0.1:' + this.form.ntlmPort;
                    ntlmStarted = true;
                }
                else {
                    if (this.form.proxyUser.length) {
                        hp += this.form.proxyUser;
                        if (this.form.proxyPass)
                            hp += ':' + this.form.proxyPass;
                        hp += '@';
                    }
                    hp += this.form.proxyAddress;
                }
                td.AddLine(hp);
            }
            td.AddLine('cd /d "' + this.form.localRepoPath + '"');
            var cmd = this.pathToFossil + command;
            if (visible)
                cmd += this.pathToFecho;
            td.AddLine(cmd + (" >> \"" + this.pathToOut + "\""));
            td.Write(this.pathToCmd, "cp866");
            this.wsh.Run(this.pathToCmd, visible ? 1 : 0, 1);
            if (ntlmStarted)
                this.killNtlm();
            td.Read(this.pathToOut);
            DeleteFiles(this.pathToCmd);
            DeleteFiles(this.pathToOut);
            td.LineSeparator = '\n';
            return td.GetText();
        }
        return "";
    };
    UpdatePage.prototype.runFossilRemote = function (command, handler) {
        var _this = this;
        if (!this.form.remoteRepoURL)
            return;
        var http;
        try {
            http = new ActiveXObject('MSXML2.ServerXMLHTTP.6.0');
        }
        catch (e) {
            Message("Не удалось создать объект MSXML2.ServerXMLHTTP.6.0 для запроса данных из внешнего репозитария");
        }
        if (http) {
            var url = this.form.remoteRepoURL;
            if (url.slice(-1) != '/')
                url += '/';
            url += command;
            if (this.form.useProxy) {
                if (this.form.proxyAddress.length == 0) // Адрес прокси должен быть задан
                    return;
                var hp, ntlmStarted = false;
                if (this.form.proxyNtlm) {
                    this.startNtlm();
                    hp = '127.0.0.1:' + this.form.ntlmPort;
                    ntlmStarted = true;
                }
                else {
                    hp = this.form.proxyAddress;
                }
                http.setProxy(2, hp);
                http.open('get', url);
                if (!ntlmStarted) {
                    var uname = this.form.proxyUser;
                    if (uname.length) {
                        var dog = uname.indexOf('@');
                        if (dog >= 0)
                            uname = uname.substr(dog + 1) + '\\' + uname.substr(0, dog);
                        http.setProxyCredentials(uname, this.form.proxyPass);
                    }
                }
            }
            else
                http.open('get', url);
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    if (ntlmStarted)
                        _this.killNtlm();
                    //Message(http.getAllResponseHeaders());
                    //Message(http.responseText);
                    try {
                        var r = JSON.parse(http.responseText);
                        r.error = false;
                        handler(r);
                    }
                    catch (e) {
                        handler({ error: true });
                    }
                }
            };
            try {
                http.send(null);
            }
            catch (e) {
                if (ntlmStarted)
                    this.killNtlm();
                handler({ error: true });
            }
        }
    };
    UpdatePage.prototype.readLocalTimeline = function () {
        try {
            if (this.localRepoExist) {
                var res = JSON.parse(this.runFossilLocal("json timeline checkin --tag trunk --limit 20 --files 1", false, false));
                this.fillRepoRow(this.localRepoRow, res);
                var dt = new Date(res.payload.timeline[0].timestamp * 1000);
                this.lastLocalDate = dt;
                var a2 = function (p) { return (p < 10 ? '0' : '') + p; };
                return '' + dt.getFullYear() + '-' + a2(dt.getMonth() + 1) + '-' + a2(dt.getDate()) + '%20' + a2(dt.getHours()) + ':' + a2(dt.getMinutes()) + ':' + a2(dt.getSeconds());
            }
            else {
                this.fillRepoRow(this.localRepoRow, { payload: { timeline: [{ timestamp: 0, comment: "История локального репозитария отсутствует" }] } });
            }
        }
        catch (e) {
            this.fillRepoRow(this.localRepoRow, { payload: { timeline: [{ timestamp: 0, comment: e.description }] } });
        }
        return '2010-01-01';
    };
    UpdatePage.prototype.readRemoteTimeline = function (after) {
        var _this = this;
        this.remoteRepoRow.Rows.Clear();
        var c = this.remoteRepoRow.Rows.Add();
        c.content = "данные не получены...";
        this.runFossilRemote("json/timeline/checkin?tag=trunk&after=" + after + "&files=1", function (res) {
            _this.fillRepoRow(_this.remoteRepoRow, res);
        });
    };
    UpdatePage.prototype.fillRepoRow = function (row, res) {
        if (res && res.payload && res.payload.timeline) {
            if (res.payload.timeline.length == 0) {
                var r = row.Rows.Get(0);
                r.content = "Обновлений нет";
            }
            else {
                row.Rows.Clear();
                for (var k in res.payload.timeline) {
                    var ci = res.payload.timeline[k];
                    var r = row.Rows.Add();
                    var dt = new Date(ci.timestamp * 1000);
                    r.checkinDate = dt.toLocaleDateString() + " " + dt.toLocaleTimeString();
                    r.content = ci.comment;
                    if (ci.files) {
                        for (var l in ci.files) {
                            var f = ci.files[l];
                            var sr = r.Rows.Add();
                            sr.content = f.state + " " + f.name;
                        }
                    }
                }
            }
        }
        else if (res && res.resultCode && res.resultText) {
            var r = row.Rows.Get(0);
            r.content = "Ошибка " + res.resultCode + ": " + res.resultText;
        }
        this.form.Controls.vtRepoList.Expand(row);
    };
    UpdatePage.prototype.handlerCmdBarUpdatebtnRefreshRepo = function () {
        if (!this.pathToFossil) {
            Message("fossil не найден!");
        }
        else {
            if (this.localRepoExist) {
                Message(this.runFossilLocal("update", true, true));
            }
            else {
                if (!this.form.snegopatLogin.length) {
                    MessageBox("Не задан логин на snegopat.ru");
                    return;
                }
                /*CreateDirectory(env.pathes.repo);
                var remoteUrl = this.form.remoteRepoURL.replace("://", `://${this.form.snegopatLogin}@`);
                this.runFossilLocal(`clone "${remoteUrl}" -A ${this.form.snegopatLogin} "${env.pathes.repo}sn.fossil"`, true, true);
                this.runFossilLocal(`open "${env.pathes.repo}sn.fossil"`, true, true);
                var file = v8New("File", env.pathes.core + "_fossil_");
                this.localRepoExist = file.Существует();
                if (this.localRepoExist) {
                    this.handlerCmdBarUpdatebtnRefreshRepo();
                    return;
                }*/
            }
            this.fillRepoList();
            this.updateVersionInfo();
        }
    };
    UpdatePage.prototype.handlerCmdBarUpdatebtnDownloadSnegopat = function () {
        RunApp('https://snegopat.ru/spnew.php?login=' + this.form.snegopatLogin);
    };
    UpdatePage.prototype.handlerCmdBarUpdateBugsForum = function () {
        RunApp('https://snegopat.ru/forum/viewforum.php?f=8');
    };
    UpdatePage.prototype.handlerbtnFillRepoНажатие = function () {
        this.fillRepoList();
    };
    UpdatePage.prototype.handlerntlmDetectНажатие = function () {
        if (!this.form.proxyAddress) {
            MessageBox("Не задан адрес прокси сервера");
            return;
        }
        var td = v8New("TextDocument");
        td.Write(this.pathToOut, 'UTF-8');
        td.AddLine("@echo off");
        td.AddLine("set CYGWIN=nodosfilewarning");
        td.AddLine("echo \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C: " + this.form.proxyUser);
        td.AddLine("<nul set /p strt=Введите пароль: ");
        td.AddLine("\"" + env.pathes.tools + "cntlm\\cntlm.exe\" -c \"" + this.ntlmIni + "\" -I -M " + this.form.remoteRepoURL + " -u \"" + this.form.proxyUser + "\" " + this.form.proxyAddress +
            (" " + this.pathToFecho + " >> \"" + this.pathToOut + "\""));
        //td.AddLine("pause");
        td.Write(this.pathToCmd, "cp866");
        //Message(td.GetText());
        this.wsh.Run(this.pathToCmd, 1, 1);
        td.Read(this.pathToOut);
        DeleteFiles(this.pathToCmd);
        DeleteFiles(this.pathToOut);
        td.LineSeparator = '\n';
        var text = td.GetText();
        var found = text.match(/Config profile\s+\d\/\d... OK \(.+\)\n-{3,}.+\n([\s\S]+)\n-{3,}/);
        if (found) {
            text = found[1];
            found = text.match(/^Auth\s+(.+)$/m);
            if (found) {
                this.form.ntlmAuth = found[1];
                td.SetText(text);
                td.Write(this.ntlmIni);
                Message("Режим прокси-сервера определён как " + this.form.ntlmAuth, mInfo);
                Message("\u0425\u0435\u0448 \u043F\u0430\u0440\u043E\u043B\u044F \u0431\u044B\u043B \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u0432 \u0444\u0430\u0439\u043B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u043F\u0440\u043E\u043C\u0435\u0436\u0443\u0442\u043E\u0447\u043D\u043E\u0433\u043E \u0441\u0435\u0440\u0432\u0435\u0440\u0430 " + this.ntlmIni + ":");
                Message('    ' + text.replace(/\n/g, "\n    "));
                Message("Теперь пароль в настройках можно не указывать и не хранить");
                return;
            }
        }
        Message("Не удалось определить режим сервера. Программа выдала:\n" + text, mExc1);
        Message("Возможно, прокси-сервер не запущен или вы ввели неверные имя/пароль", mInfo);
    };
    UpdatePage.prototype.handlerbtnProxyReadНажатие = function () {
        var key = '';
        try {
            key = this.wsh.RegRead("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ProxyServer");
        }
        catch (e) { }
        if (key.length) {
            var keys = key.split(';');
            key = '';
            for (var i = 0; i < keys.length; i++) {
                var tt = keys[i].match(/^(?:https?:\/\/|)([A-Za-z0-9_\.\-]+:\d+)$/);
                if (tt) {
                    key = tt[1];
                    break;
                }
            }
        }
        if (key.length) {
            this.form.proxyAddress = key;
            try {
                var http = new ActiveXObject('MSXML2.ServerXMLHTTP.6.0');
            }
            catch (e) {
                Message("Не удалось создать объект MSXML2.ServerXMLHTTP.6.0 для проверки прокси-сервера");
            }
            var url = this.form.remoteRepoURL;
            if (!url)
                url = 'https://snegopat.ru';
            try {
                http.setProxy(2, key);
                http.open('get', url);
            }
            catch (e) {
                return;
            }
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    if (http.status == 200 || http.status == 301 || http.status == 302) {
                        MessageBox("Прокси-сервер ответил, авторизации не требует");
                    }
                    else if (http.status == 407) {
                        var authMetods = [];
                        var headers = http.getAllResponseHeaders().split('\n');
                        for (var i in headers) {
                            var h = headers[i].match(/^Proxy-Authenticate:\s+(\S+)/i);
                            if (h)
                                authMetods.push(h[1]);
                        }
                        MessageBox("Прокси-сервер ответил, требует авторизации, поддерживает " + authMetods.join(', '));
                    }
                    else {
                        MessageBox("Прокси-сервер ответил " + http.status + ": " + http.statusText);
                    }
                }
            };
            try {
                http.send(null);
            }
            catch (e) {
                MessageBox("Не удалось проверить прокси-сервер: " + e.description);
            }
        }
        else {
            MessageBox("Адрес прокси сервера в реестре не найден");
        }
    };
    UpdatePage.prototype.handlerCmdBarUpdatebtnSaveSettings = function () {
        this.storeSettings();
        MessageBox("Настройки сохранены");
    };
    UpdatePage.prototype.handlervtRepoListПриВыводеСтроки = function (Control, RowAppearance, RowData) {
        if (!RowData.val.Parent) {
            RowAppearance.val.Font = v8New("Font", RowAppearance.val.Font, undefined, undefined, true);
        }
    };
    return UpdatePage;
}());
var HelpPage = /** @class */ (function () {
    function HelpPage() {
        this.helpDir = "";
    }
    HelpPage.prototype.connect = function (form) {
        HelpPage.helpPage = this;
        this.form = form;
        this.stdButtonsCount = this.form.Controls.HelpBar.Buttons.Count();
        this.form.HelpTree.Columns.Add("data");
        this.fillHelpTree();
        this.helpDir = env.pathes.help.toLocaleLowerCase();
    };
    HelpPage.prototype.enter = function () {
    };
    HelpPage.prototype.exit = function () {
    };
    HelpPage.prototype.fillHelpTree = function () {
        var hs = helpsys.getHelpSystem();
        function process(folder, rows) {
            var row = rows.Add();
            row.data = folder;
            row.topic = folder.name;
            folder.row = row;
            for (var i in folder.childs)
                process(folder.childs[i], row.Rows);
        }
        ;
        // Нет справки (не открылась help\help.db) — дерево пустое, а не ошибка скрипта
        if (!hs.root || !hs.root.childs) {
            Message("Снегопат: справка не найдена (" + env.pathes.help + "help.db)", mExc2);
            return;
        }
        process(hs.root.childs[0], this.form.HelpTree.Rows);
        process(hs.root.childs[1], this.form.HelpTree.Rows);
    };
    HelpPage.prototype.getCurrentUrl = function () {
        var url = this.form.Controls.HelpHtml.Document.location.href;
        if (/^file:\/\/\/([^#]+)/i.exec(url)) {
            var file = RegExp.$1.replace(/\//g, "\\").replace(/%20/g, ' ').toLocaleLowerCase();
            if (file.indexOf(this.helpDir) == 0) {
                return "help\\" + file.substr(this.helpDir.length);
            }
        }
        return "";
    };
    HelpPage.prototype.activate = function (topic) {
        var url = this.getCurrentUrl();
        if (url && url == topic.path)
            return;
        if (topic.path)
            this.form.Controls.HelpHtml.Navigate(env.pathes.main + topic.path);
        else
            this.form.Controls.HelpHtml.SetText("<html><body></body><html>");
        for (var idx = this.form.Controls.HelpBar.Buttons.Count() - 1; idx >= this.stdButtonsCount; idx--)
            this.form.Controls.HelpBar.Buttons.Delete(idx);
        idx = 0;
        this.breadCrumbs = {};
        for (var r = topic.row.Parent; r && r.data.helpId; r = r.Parent) {
            var name = "btn" + idx;
            var button = this.form.Controls.HelpBar.Buttons.Insert(this.stdButtonsCount, name, CommandBarButtonType.Action, r.topic, v8New("Действие", "OnBreadCrumbsClick"));
            button.ToolTip = "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0440\u0430\u0437\u0434\u0435\u043B\u0443 \"" + r.topic + "\"";
            this.form.Controls.HelpBar.Buttons.Insert(this.stdButtonsCount, "bcsep" + idx, CommandBarButtonType.Separator);
            this.breadCrumbs[name] = r;
            idx++;
        }
    };
    HelpPage.prototype.activateByPath = function (path) {
        try {
            this.form.Controls.HelpTree.CurrentRow = helpsys.getHelpSystem().allFiles[path].row;
        }
        catch (e) { }
    };
    HelpPage.prototype.handlerHelpTreeПриАктивизацииСтроки = function () {
        this.activate(this.form.Controls.HelpTree.CurrentRow.data);
    };
    HelpPage.prototype.handlerHelpTreeПриВыводеСтроки = function (Control, RowAppearance, RowData) {
        var ra = RowAppearance.val.Cells.topic;
        ra.ShowPicture = true;
        if (!RowData.val.data.helpId)
            ra.PictureIndex = 0;
        else
            ra.Picture = PictureLib.ListViewModeList;
    };
    HelpPage.prototype.handlerOnBreadCrumbsClick = function (button) {
        this.form.Controls.HelpTree.CurrentRow = this.breadCrumbs[button.val.Name];
    };
    HelpPage.prototype.handlerHelpSearchOpening = function (Control, StandardProcessing) {
        StandardProcessing.val = false;
        if (this.form.HelpSearch.length) {
            var hs = helpsys.getHelpSystem();
            var search = hs.searchTopics(this.form.HelpSearch);
            var resultCount = search.Count();
            if (0 == resultCount)
                MessageBox("Ничего не найдено");
            else if (1 == resultCount)
                this.activate(hs.allTopics[search.Get(0).docid]);
            else {
                var vl = v8New("ValueList");
                for (var i = 0; i < search.Count(); i++) {
                    var row = search.Get(i);
                    var ti = hs.allTopics[row.docid], tc = ti;
                    var names = [];
                    while (tc && tc.helpId) {
                        names.unshift(tc.name);
                        tc = tc.parent;
                    }
                    vl.Add(ti, names.join('::'), false, PictureLib.ListViewModeList);
                }
                var choise = vl.ChooseItem("Выберите раздел справки");
                if (choise)
                    this.activate(choise.Value);
            }
        }
    };
    HelpPage.prototype.handlerHelpHtmlonhelp = function (Control, pEvtObj) {
        try {
            RunApp(this.form.Controls.HelpHtml.Document.getElementById('wwwsite').innerText);
        }
        catch (e) { }
    };
    HelpPage.prototype.handlerHelpHtmlДокументСформирован = function (control) {
        var url = this.getCurrentUrl();
        if (url) {
            var helpInfo = helpsys.getHelpSystem().allFiles[url];
            if (helpInfo && this.form.Controls.HelpTree.CurrentRow && !(this.form.Controls.HelpTree.CurrentRow.data === helpInfo))
                this.form.Controls.HelpTree.CurrentRow = helpInfo.row;
        }
    };
    HelpPage.helpPage = null;
    return HelpPage;
}());
;
var AboutPage = /** @class */ (function () {
    function AboutPage() {
    }
    AboutPage.prototype.connect = function (form) {
        this.form = form;
    };
    AboutPage.prototype.enter = function () {
        this.form.Controls.AboutHtml.Navigate(env.pathes.core + "www\\about.html");
    };
    AboutPage.prototype.exit = function () {
        this.form.Controls.AboutHtml.Navigate("about:blank");
    };
    AboutPage.prototype.handlerAboutHtmlDocumentComplete = function () {
        //debugger
        try {
            this.form.Controls.AboutHtml.Document.parentWindow.setDesigner(Designer);
        }
        catch (e) {
            var data = JSON.stringify({
                "BuildDateTime": env.BuildDateTime,
                "sVersion": env.sVersion,
                "ownerName": env.ownerName,
                "snMainFolder": env.snMainFolder,
                "v8Version": env.v8Version
            });
            try {
                this.form.Controls.AboutHtml.Document.defaultView.setData(data);
            }
            catch (e) { }
        }
    };
    AboutPage.prototype.handlerAboutHtmlonhelp = function (Control, pEvtObj) {
        RunApp("https://snegopat.ru");
    };
    return AboutPage;
}());
// Функция вызывается основным загрузчиком после загрузки стартовых аддинов
function restoreWindowState() {
    // Восстановим состояние окна
    profileRoot.createValue(wndStateProfilePath, true, pflSnegopat);
    var isWndOpened = profileRoot.getValue(wndStateProfilePath);
    if (isWndOpened) {
        if (windows.modalMode != msNone) {
            var nd = events.connect(Designer, "onIdle", function () {
                if (windows.modalMode == msNone) {
                    openWnd();
                    events.disconnectNode(nd);
                }
            }, "-");
        }
        else
            openWnd();
    }
}
function getLocation(htmlDoc) {
    try {
        return htmlDoc.parentWindow.location;
    }
    catch (e) {
        return htmlDoc.defaultView.location;
    }
}
