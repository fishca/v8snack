//engine: JScript
//uname: git_blame
//dname: Показ git blame
//descr: Скрипт показывает git blame для текущего окна
//author: orefkov
//help: inplace
//addin: global
//addin: vbs
exports.__esModule = true;
/// <reference path="./snegopat.d.ts" />
/// <reference path="./v8.d.ts" />
/*@
@*/
var stdlib = require("./std/std");
var git_common = require("./git_common");
var openedForms = {};
global.connectGlobals(SelfScript);
function macrosПоказатьBlame() {
    var wnd = snegopat.activeTextWindow();
    if (!wnd) {
        MessageBox("Нет активного окна");
        return;
    }
    if (!wnd.mdObj || !wnd.mdProp) {
        MessageBox("Это не окно модуля метаданных");
        return;
    }
    var sel = wnd.getSelection();
    var form = processBlame(wnd.mdObj, wnd.mdProp, windows.getFocusedView().title);
    if (!form)
        return;
    form.Controls.Module.SetTextSelectionBounds(sel.beginRow, sel.beginCol + form.data.shift, sel.endRow, sel.endCol + form.data.shift);
}
function processBlame(mdObj, mdProp, title) {
    var pathes = git_common.pathes();
    if (!pathes)
        return null;
    var fullPath = pathes.repo + pathes.src + git_common.mdObjToPath(mdObj, mdProp);
    if (!stdlib.isFileExist(fullPath)) {
        MessageBox("\u0424\u0430\u0439\u043B " + fullPath + " \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D.");
        return null;
    }
    var split = /^(.+)\\([^\\]+)$/.exec(fullPath);
    var res = git_common.runGit(split[1], "blame --date=unix " + split[2]);
    if (res.err) {
        Message("Произошла ошибка git: " + res.err);
        return null;
    }
    var form = findOrLoadForm(mdObj, mdProp);
    form.Open();
    var blameText = blameToText(parseGitBlame(res.out));
    form.data.shift = blameText.shift;
    form.data.fullPath = fullPath;
    form.Controls.Module.SetText(blameText.text);
    form.Controls.Module.InsertLine(form.Controls.Module.LineCount() + 1, "");
    form.Caption = "Git Blame: " + title;
    form.Controls.Title.Caption = title + " ( " + fullPath + " )";
    return form;
}
function findOrLoadForm(mdObj, mdProp) {
    var key = mdObj.container.identifier + '\t' + mdObj.id + '\t' + mdProp.id;
    var form = openedForms[key];
    if (!form) {
        form = git_common.loadGitForm("ПоказBlame", {
            Refresh: function () {
                processBlame(form.data.mdObj, form.data.mdProp, '');
            },
            GotoModule: function () {
                var wnd = form.data.mdObj.openModule(form.data.mdProp.id);
                var shift = form.data.shift;
                vbs.var0 = form.Controls.Module;
                vbs.DoExecute("var0.GetTextSelectionBounds var1, var2, var3, var4");
                wnd.setCaretPos(vbs.var1, vbs.var2 - shift);
                wnd.setSelection(vbs.var1, vbs.var2 - shift, vbs.var3, vbs.var4 - shift);
            },
            GotoModuleClose: function () {
                this.GotoModule();
                form.Close();
            },
            OnClose: function () {
                delete openedForms[key];
            }
        });
        form.WindowState = WindowStateVariant.Normal;
        form.Controls.CmdBar.Buttons.Goto.СочетаниеКлавиш = stdlib.v8hotkey(13, 0);
        form.Controls.CmdBar.Buttons.GotoClose.СочетаниеКлавиш = stdlib.v8hotkey(13, 8);
        form.data = { mdObj: mdObj, mdProp: mdProp };
        openedForms[key] = form;
    }
    return form;
}
function padRight(text, len) {
    var k = len - text.length;
    if (k > 0)
        text += new Array(k + 1).join(' ');
    return text;
}
function blameToText(blame) {
    var l = [];
    var maxNameLen = 0, maxCommitLen = 0;
    for (var i in blame) {
        var b = blame[i];
        if (b.author.length > maxNameLen)
            maxNameLen = b.author.length;
        if (b.commit.length > maxCommitLen)
            maxCommitLen = b.commit.length;
    }
    // │ 2502
    for (var i in blame) {
        var b = blame[i];
        l.push("\u2502 " + padRight(b.commit, maxCommitLen) + " \u2502 " + formatTime(b.timestamp) + " \u2502 " + padRight(b.author, maxNameLen) + " \u2502\t" + b.text);
    }
    return { text: l.join('\n'), shift: 28 + maxCommitLen + maxNameLen };
}
function twoZeroes(n) {
    return (n < 10 ? '0' : '') + n;
}
function formatTime(d) {
    return twoZeroes(d.getDay()) + '.' + twoZeroes(d.getMonth()) + '.' + d.getFullYear() + ' ' + twoZeroes(d.getHours()) + ':' + twoZeroes(d.getMinutes());
}
function parseGitBlame(text) {
    var lines = text.split(/\r?\n/);
    var reParse = /^\^?(\S+)\s+\((.+) (\d{10})\s+(\d+)\)(.*)/;
    var res = [];
    for (var i in lines) {
        var lineParse = reParse.exec(lines[i]);
        if (lineParse) {
            res.push({
                commit: lineParse[1],
                author: lineParse[2],
                timestamp: new Date(parseInt(lineParse[3]) * 1000),
                line: parseInt(lineParse[4]),
                text: lineParse[5]
            });
        }
    }
    return res;
}
events.connect(Designer, "onChangeTextManager", function (s1, s2, s3) {
    //MessageBox("Text area changed");
}, '-');
