//engine: JScript
//uname: help
//dname: Справка снегопата
//debug: yes
//descr: Скрипт для организации работы справочной системы снегопата
//author: orefkov
//help: inplace
//addin: global
exports.__esModule = true;
/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Работа справочной подсистемы
 */
/// <reference path="../snegopat.d.ts"/>
/// <reference path="../v8.d.ts"/>
var stdlib = require("./std");
global.connectGlobals(SelfScript);
/**
 * Обёртка над поисковой базой данных
 */
var Store = (function () {
    var db;
    var queries = {
        sSearch: { q: null, t: 'select search.docid as docid from search where search match @text' }
    };
    function prepareQueries() {
        for (var k in queries)
            queries[k].q = db.prepare(queries[k].t);
    }
    function closeQueries() {
        for (var k in queries) {
            if (queries[k].q) {
                queries[k].q.close();
                queries[k].q = null;
            }
        }
    }
    return {
        isOpen: function () {
            return !!db;
        },
        open: function (path) {
            this.close();
            try {
                db = sqliteOpen(path);
                //db.exec(cStruct);
                prepareQueries();
                return true;
            }
            catch (e) {
                Message(e.description);
                this.close();
                return false;
            }
        },
        close: function () {
            if (db) {
                closeQueries();
                db.close();
                db = null;
            }
        },
        begin: function () {
            db.exec("begin");
        },
        end: function () {
            db.exec("end");
        },
        searchTopics: function (text) {
            return queries.sSearch.q.bind(1, text).exec();
        }
    };
})();
/*
 * Данный класс предназначен для работы со справочной системой снегопата.
 */
var HelpSystem = /** @class */ (function () {
    function HelpSystem() {
        this.root = null;
        this.allFiles = {};
        this.allTopics = {};
        if (!Store.open(env.pathes.help + "help.db"))
            return;
        var repoAddin = addins.byUniqueName("all.js");
        if (!repoAddin)
            repoAddin = addins.loadAddin("script:addins\\std\\all.js", addins.sys);
        this.root = stdlib.allAddins().help;
        this.walkHelp(this.root, null);
    }
    HelpSystem.prototype.walkHelp = function (folder, parent) {
        folder.parent = parent;
        folder.row = null;
        for (var i in folder.childs)
            this.walkHelp(folder.childs[i], folder);
        if (folder.helpId)
            this.allTopics[folder.helpId] = folder;
        if (folder.path)
            this.allFiles[folder.path] = folder;
    };
    HelpSystem.prototype.searchTopics = function (text) {
        return Store.searchTopics(text);
    };
    HelpSystem.prototype.openHelp = function (ai) {
        var a = addins.byUniqueName("snegopatwnd");
        if (!a)
            a = addins.loadAddin("script:addins\\std\\snegopatwnd.js", addins.sys);
        a.object().openPage("Help");
        a.object().HelpPage.helpPage.activateByPath(ai.helpPath);
    };
    HelpSystem.hs = null;
    return HelpSystem;
}());
;
function getHelpSystem() {
    if (!HelpSystem.hs)
        HelpSystem.hs = new HelpSystem;
    return HelpSystem.hs;
}
exports.getHelpSystem = getHelpSystem;
