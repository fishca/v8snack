//engine: JScript
//uname: git_common
//dname: Общий функционал для работы с git
//descr: Скрипт содержит общий функционал для работы с git
//author: orefkov
//help: inplace
//addin: global
exports.__esModule = true;
/// <reference path="./snegopat.d.ts" />
/// <reference path="./v8.d.ts" />
/*@
@*/
var stdlib = require("./std/std");
global.connectGlobals(SelfScript);
var settingsPath = "snegopat/git_common/";
var repoKey = settingsPath + "repo";
var srcKey = settingsPath + "src";
function createAndReadPathes() {
    profileRoot.createValue(repoKey, "", pflCompBase);
    profileRoot.createValue(srcKey, "", pflCompBase);
    return { repo: profileRoot.getValue(repoKey), src: profileRoot.getValue(srcKey) };
}
function addTrailSlash(base) {
    if (base.substr(base.length - 1) != '\\')
        base += '\\';
    return base;
}
function loadGitForm(name, handler) {
    return loadScriptFormEpf(SelfScript.fullPath.replace(/js$/i, "epf"), name, handler);
}
exports.loadGitForm = loadGitForm;
function inputPathes(pathes) {
    var form = loadGitForm("ВводПутей", {
        selectRepo: function () {
            var sel = v8New("FileDialog", FileDialogMode.ChooseDirectory);
            sel.Directory = form.Repo;
            sel.Title = "Укажите каталог репозитария";
            if (sel.Choose())
                form.Repo = sel.Directory + "\\";
        },
        selectSrc: function () {
            if (!form.Repo || !stdlib.isFolderExist(form.Repo))
                return;
            var sel = v8New("FileDialog", FileDialogMode.ChooseDirectory);
            sel.Directory = form.Repo;
            sel.Title = "Укажите каталог выгрузки конфигурации";
            if (sel.Choose()) {
                var base = addTrailSlash(form.Repo);
                if (sel.Directory.substr(0, base.length).toLocaleLowerCase() != base.toLocaleLowerCase())
                    MessageBox("Каталог выгрузки конфигурации должен быть в каталоге репозитария");
                else
                    form.Src = sel.Directory.substr(base.length) + '\\';
            }
        },
        OnOk: function () {
            pathes.repo = addTrailSlash(form.Repo);
            pathes.src = addTrailSlash(form.Src);
            profileRoot.setValue(repoKey, pathes.repo);
            profileRoot.setValue(srcKey, pathes.src);
            form.Close();
        }
    });
    form.Repo = pathes.repo;
    form.Src = pathes.src;
    form.DoModal();
}
stdlib.createMacros(SelfScript.self, "Настройка путей", "Настроить пути к репозитарию и выгрузке конфигурации", null, function () { inputPathes(createAndReadPathes()); });
function pathes() {
    var pathes = createAndReadPathes();
    if (!pathes.repo) {
        inputPathes(pathes);
        if (!pathes.repo)
            return null;
    }
    if (!stdlib.isFolderExist(pathes.repo)) {
        MessageBox("Каталог репозитария не найден");
        return null;
    }
    if (pathes.src && !stdlib.isFolderExist(pathes.repo + pathes.src)) {
        MessageBox("Каталог выгрузки конфигурации не найден");
        return null;
    }
    return pathes;
}
exports.pathes = pathes;
function mdObjToPath(mdObj, mdProp) {
    var names = [];
    while (mdObj.parent) {
        // Получим название класса метаданных объекта на английском во множественном числе
        var mdClassName = mdObj.mdclass.name(0, true);
        if (!mdClassName) {
            // Дошли до объекта Конфигурация
            break;
        }
        else {
            //  Вставим в начало массива имен класс объекта на английском во множественном числе и имя объекта
            names.unshift(mdObj.name);
            names.unshift(mdClassName);
        }
        mdObj = mdObj.parent;
    }
    // Объединим все имена в путь
    var path = names.join('\\');
    if (mdProp) {
        if (path)
            path += "\\";
        path += "Ext\\" + mdProp.name(0); // + "(" + wnd.mdProp.id + ")";
        if (mdProp.name(0) == "Form") {
            // Тут надо бы выяснить, управляемая это форма или обычная.
            // Однако для обычной формы смотреть текст модуля "в лоб" нет смысла, поэтому
            // просто предположим, что это управляемая форма и путь к файлу пропишем как для
            // управляемой. Если файла не найдётся, значит, и не покажет ничего.
            path += "\\Module.bsl";
        }
        else {
            // Это просто модуль
            path += ".bsl";
        }
    }
    else {
        path += ".xml";
    }
    return path;
}
exports.mdObjToPath = mdObjToPath;
function runGit(folder, params) {
    var tmpFile = GetTempFileName(), errFile = GetTempFileName();
    System("git " + params + " >\"" + tmpFile + "\" 2>\"" + errFile + "\"", folder);
    var td = v8New("TextDocument");
    td.Read(tmpFile, "UTF-8");
    var res = { out: td.GetText(), err: '' };
    DeleteFiles(tmpFile);
    td.Read(errFile, "UTF-8");
    res.err = td.GetText();
    DeleteFiles(errFile);
    return res;
}
exports.runGit = runGit;
