//engine: JScript
//uname: SnegopatMainScript
//dname: Снегопат
//debug: no
//addin: global
//descr: Скрипт с основными макросами снегопата
//author: orefkov
//help: inplace
exports.__esModule = true;
/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Основной скрипт снегопата.
 */
/// <reference path="../snegopat.d.ts"/>
/// <reference path="../v8.d.ts"/>
/*@
В этом скрипте находятся основные макросы, которые предоставляет сам снегопат.
Он загружается из стартового скрипта предпоследним из служебных аддинов.
@*/
global.connectGlobals(SelfScript);
var macroswnd = require("./macroswnd");
var stdlib = require("./std");
var stdcommands = require("./commands");
stdlib.createMacros(SelfScript.self, "ВыбратьИВыполнитьМакрос", "Выбрать макрос из списка и выполнить его", stdcommands.CDebug.Start.info.picture, function () {
    var macrosesWnd = macroswnd.MacrosWnd();
    if (macrosesWnd.isOpened())
        return false;
    var res = macrosesWnd.selectMacros();
    if (res) {
        var a = addins.byUniqueName(res.addin);
        if (a)
            return a.invokeMacros(res.macros);
        Message("Аддин с именем " + res.addin + " не найден");
    }
});
// Создадим макросы для вставок текста
(function (textBefore, textAfter, hotKey, activateHint) {
    var nameOfinsert = textBefore;
    if (textAfter.length)
        nameOfinsert += "..." + textAfter;
    var nameOfMacros = "Редактирование\\Вставить " + nameOfinsert;
    stdlib.createMacros(SelfScript.self, nameOfMacros, "Вставить " + nameOfinsert + " в текущей позиции редактируемого текста", stdcommands.TextEdit.Templates.info.picture, (function (txtBefore, txtAfter, aHint) {
        return function () {
            return replaceSelInTxtWnd(txtBefore, txtAfter, aHint);
        };
    })(textBefore, textAfter, activateHint), hotKey);
    return arguments.callee;
})("<", "", "Alt + ,")(">", "", "Alt + .")("@", "", "Alt + 2")("#", "", "Alt + 3", false)("$", "", "Alt + 4")("^", "", "Alt + 6")("&", "", "Alt + 7", false)("Null", "", "Alt + N")("~", "", "Alt + ~")("[", "]", "Alt + [")("{", "}", "Alt + Shift + [")("]", "", "Alt + ]")("}", "", "Alt + Shift + ]")("'", "'", "Alt + '")('"', '"', "Alt + Shift + '")("=", "", "Alt + =");
stdlib.createMacros(SelfScript.self, "Разработка\\Сдампить SnegAPI в snegopat.d.ts", "Сформировать файл описания SnegAPI в формате TypeScript", undefined, function () {
    develop.dumpSnegApiToDts();
    MessageBox("Готово");
});
stdlib.createMacros(SelfScript.self, "Разработка\\Сдампить типы 1С в v8.d.ts", "Сформировать файл описания типов 1С в формате TypeScript", undefined, function () {
    develop.dumpV8typesToDts();
    MessageBox("Готово");
});
stdlib.createMacros(SelfScript.self, "Разработка\\Переключить трассировку команд", "Включает/выключает вывод отладочных сообщений при прохождении команд в главном окне 1С", undefined, function () {
    develop.cmdTrace = !develop.cmdTrace;
    MessageBox("Трассировка команд в" + (develop.cmdTrace ? "" : "ы") + "ключена", mbOK, "Снегопат", 1);
});
/*stdlib.createMacros(SelfScript.self, "Разработка\\TestCommand",
    "Открыть форму для исследования команд", undefined,
    function () {
        stdcommands.TestForm.open();
    });
*/
stdlib.createMacros(SelfScript.self, "Открыть окно Снегопата", "Открытие основного окна Снегопата", PictureLib.НастройкаСписка, function () {
    var a = addins.byUniqueName("snegopatwnd");
    if (!a)
        a = addins.loadAddin("script:addins\\std\\snegopatwnd.js", addins.sys);
    a.object().openWnd();
});
stdlib.createMacros(SelfScript.self, "Показать список методов модуля", "Открыть диалог со списком методов редактируемого модуля", stdcommands.Frntend.MDReport.info.picture, function () { snegopat.showMethodsList; }, "Ctrl + 1|Ctrl + Alt + P");
stdlib.createMacros(SelfScript.self, "Вернуться назад", "Перейти назад по истории окон", stdcommands.Frame.GotoBack.info.picture, function () { stdcommands.Frame.GotoBack.send(); }, "Alt+Left");
stdlib.createMacros(SelfScript.self, "Перейти вперёд", "Перейти вперёд по истории окон", stdcommands.Frame.GotoForward.info.picture, function () { stdcommands.Frame.GotoForward.send; }, "Alt+Right");
stdlib.createMacros(SelfScript.self, "ПоказатьВыпадающийСписокСнегопата", "Принудительно вызвать список снегопата, всё перепарсив", stdcommands.Config.SyntaxHelper.info.picture, function () { return snegopat.showSmartBox(); }, "Ctrl+Alt+Space");
function replaceSelInTxtWnd(textBefore, textAfter, activateHint) {
    var txtWnd = snegopat.activeTextWindow();
    if (!txtWnd) {
        if (textBefore.length > 0 && !textAfter) {
            var h = winApi.getFocus();
            for (var i = 0; i < textBefore.length; i++)
                winApi.sendMessage(h, WM_CHAR, textBefore.charCodeAt(i), 0);
        }
        return false;
    }
    var oldText = txtWnd.selectedText;
    var newText = textBefore;
    if (textAfter.length)
        newText += oldText + textAfter;
    txtWnd.selectedText = newText;
    if (textAfter.length) {
        var cp = txtWnd.getCaretPos();
        txtWnd.setCaretPos(cp.beginRow, cp.beginCol - textAfter.length);
    }
    if (activateHint)
        snegopat.showSmartBox();
    return true;
}
stdlib.createMacros(SelfScript.self, "Перейти к определению", "Перейти к определению символа под курсором (аналог F12)", stdcommands.Frntend.GoToDefinition.info.picture, function () {
    if (snegopat.activeTextWindow() && windows.modalMode == msNone) {
        var st = stdcommands.Frntend.GoToDefinition.getState();
        if (st && st.enabled) {
            // Будем также подавлять появление дополнительного диалога
            var handler = events.connect(windows, "onDoModal", function (dlgInfo) {
                if (dlgInfo.stage == beforeDoModal) {
                    dlgInfo.cancel = true;
                    dlgInfo.result = 1;
                }
            }, "-");
            var res = stdcommands.Frntend.GoToDefinition.send();
            events.disconnectNode(handler);
            return res;
        }
    }
    return false;
}, "Ctrl + Enter");
stdlib.createMacros(SelfScript.self, "Выбрать подключаемые скрипты", "Открыть диалог для выбора загружаемых скриптов", undefined, function () {
    addins.byUniqueName("select_scripts").object().openForm();
});
stdlib.createMacros(SelfScript.self, "Приостановить стартер", "Временно приостанавливает подключение Core.As модулей к запускаемым программам", undefined, function () {
    starterIpc.setInjectStatus(false);
});
stdlib.createMacros(SelfScript.self, "Возобновить cтартер", "Возобновляет подключение Core.As модулей к запускаемым программам", undefined, function () {
    starterIpc.setInjectStatus(true);
});
// Метод вызывается при регистрации хоткеев аддина
function getPredefinedHotkeys(predef) {
    predef.setVersion(7);
    stdlib.getAllPredefHotKeys(SelfScript.self, predef);
}
// Настройка «Открывать окна развёрнутыми» (Snegopat/Settings/MaximizeWindows, галка на странице настроек):
// при смене активного окна обычное MDI-окно документа разворачивается командой «Развернуть» (группа окна, №7)
(function () {
    // ключ создаётся один раз (по умолчанию выключено) — setValue на несуществующий ключ ничего не пишет
    profileRoot.createValue("Snegopat/Settings/MaximizeWindows", false, pflSnegopat);
    var lastViewId = "";
    events.connect(Designer, "onIdle", function () {
        var view = null;
        try { view = windows.getActiveView(); } catch (e) { return; }
        if (!view)
            return;
        var id = "";
        try { id = String(view.id); } catch (e) { }
        if (id == lastViewId)
            return;
        lastViewId = id;
        if (!profileRoot.getValue("Snegopat/Settings/MaximizeWindows"))
            return;
        try {
            // «Развернуть» — только через главное окно (оно адресует активное MDI-окно; дерево и панели
            // остаются на месте). Команда, посланная самому окну редактора объекта, включает у него режим
            // «на всё окно Конфигуратора» поверх панелей — так не надо.
            // mdiMax у текстовых окон не обновляется — не проверяем, повторное «Развернуть» безвредно.
            var pos = view.position();
            if (pos && pos.state == 4 /* vsMDI */)
                sendCommand("{c9d3c390-1eb4-11d5-bf52-0050bae2bc79}", 7);
        } catch (e) { }
    }, "-");
})();
var starterNotifyTimer = 0
function hideStartNotify() {
    try { killTimer(starterNotifyTimer) } catch (e) { }
    try { starterIpc.showNotify("", "") } catch (e) { }
}
(function () {
    if (profileRoot.getValue("Snegopat/Settings/ShowNotifyOnStartup")) {
        starterIpc.showNotify("\u0421\u043D\u0435\u0433\u043E\u043F\u0430\u0442 Core " + env.sVersion + " (" + env.arch + ")", "\u041A " + stdlib.ibName() + " \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D \u0421\u043D\u0435\u0433\u043E\u043F\u0430\u0442");
        // Уведомление о подключении Снегопата показывает стартер (всплывающая подсказка системы), оно висит несколько секунд —
        // через 1 секунду гасим: пустое уведомление убирает текущее
        starterNotifyTimer = createTimer(1000, SelfScript.self, "hideStartNotify")
    }
    /*events.connect(starterIpc, "Broadcast", function (sbc) {
        Message("Получена рассылка. От=" + sbc.source + " Данные=" + sbc.data);
    }, "-");*/
})();
