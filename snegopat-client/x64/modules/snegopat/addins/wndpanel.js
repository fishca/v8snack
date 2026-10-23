//engine: JScript
//uname: wndpanel
//dname: Панель окон
//author: Александр Орефков, Пушин Владимир <vladnet@gmail.com>
//help: inplace
//addin: global
//addin: stdlib
//addin: stdcommands

/*jslint todo: true, vars: true, indent: 4*/

/*@
Скрипт для показа "панели окон".

В отличии от штатной панели окон показывает список окон в табличном поле, сортируя
их не в порядке открытия окон, а по объектам метаданных, к которым они относятся +
по алфавиту. Также как всегда поддерживается фильтрация списка по подстроке.

Переработка для показа в дереве: Пушин Владимир <vladnet@gmail.com>
@*/

// Переменные модуля (раньше создавались неявно как глобальные при первом присваивании)
var WndListItem, WndList, settingsForm, sessionManager, md;

global.connectGlobals(SelfScript)

var form
var needActivate, needHide
//var api = stdlib.require('winapi.js');
var maxSortKey = 1000;
var treeView = true;
var dontSortWindows = false;

// Вставка строки в таблицу значений: индекс за пределами или сбой Insert (8.3.24) дают пустой результат — тогда добавляем в конец
function insertRowSafe(rows, idx) {
    var r = null;
    try {
        if (idx >= 0 && idx < rows.Count())
            r = rows.Insert(idx);
    } catch (e) {}
    return r ? r : rows.Add();
}

function getFullMDName(mdObj, mdProp) {
    var names = []; while (true) {
        names.unshift(mdObj.name)
        var className = mdObj.mdclass.name(1).substring(0, 3)
            if (!mdObj.parent)
                className = ""
                    names.unshift(className)
                    if (!className.length)
                        break
                        mdObj = mdObj.parent
    }
    return names.join('.') + "#" + (mdProp ? mdProp.name(1) : "")
}

WndListItem = stdlib.Class.extend({
        construct : function (view) {
            this.view = view
                this.rowInVt = null
                this.color = 0;
                this.historyKey = 0;
                this.makeSortKey();
                this.makeHistoryKey();
        },
        isAlive : function () {
            try {
                if (this.view.isAlive())
                    return true
            } catch (e) {}
            return false
        },
        makeTitle : function () {
            var result = {
                title : '',
                info : ''
            }
            if (this.isAlive()) {
                result.title = this.view.title;
                var mdObj = this.view.mdObj
                if (mdObj) {
                    var mdname = mdObj.container.identifier
                        if (result.title.indexOf(mdname) < 0)
                            result.info += mdname + " "
                }
                var obj = this.view.getObject()
                if (obj){
                    result.info += toV8Value(obj).typeName(1) + " "
                }
            }
            return result
        },
        makeHistoryKey : function(){
            maxSortKey++;
            this.historyKey = maxSortKey;
        },
        makeSortKey : function () {
            var mdname, mdIndex;
            // Основной алгоритм упорядочивания окон
            var md = this.view.mdObj
                if (md) {
                    // Если окно относится к объекту метаданных. Сначала пусть идут окна
                    // основной конфигурации, далее конфигурации ИБ, затем внешние отчеты/обработки и cf-ники.
                    // При закрытой основной конфигурации metadata.current равно metadata.ib, поэтому сначала
                    // проверяем на metadata.ib
                    if(!md.parent || !md.parent.parent)
                        mdname = md.name;
                    else
                        mdname = md.parent.name
                    mdIndex = 0;
                    //debugger
                    mdIndex = getMetadataList().Получить(mdname);
                    //Если объекта не нашли в списке, значит он новый. Перезаполним список еще раз
                    // if(ИндексОбъектаМД == undefined){
                        // СписокМетаданных = ПолучитьСписокМетаданных();
                        // ДлинаНомераМД = СписокМетаданных.Количество().toString().length;
                        // ИндексОбъектаМД = СписокМетаданных.Найти(mdname)
                    // }
                    //Если и сейчас не нашли то просто присвоим ему самый большой номер
                    if(mdIndex == undefined)
                        mdIndex = getMetadataList().Количество();
                    mdIndex = mdIndex.toString();
                    while(mdIndex.length < mdIndexWidth)
                        mdIndex = "0" + mdIndex;
                    if (md.container == metadata.ib)
                        this.sortkey = "2" + mdIndex + "#"
                    else if (md.container == metadata.current)
                            this.sortkey = "1" + mdIndex +"#"
                        else
                            this.sortkey = "3#" + md.container.identifier + "#";
                        this.sortkey += getFullMDName(md, this.view.mdProp)
                } else // Дальше пусть идут всякие файлы по алфавиту
                    this.sortkey = "4#" + this.view.title
                        this.sortkey = this.sortkey.toLowerCase()
        }
    })

WndList = stdlib.Class.extend({
        construct : function () {
            this.list = []// Массив - список окон
            this.find = {}
            // Для поиска окна по его id
            this.lastFilter = ''
                this.activeView = null
        },
        // Функция для удаления устаревших, закрытых окон из нашего списка
        removeOldViews : function (vt) {
            var parentRow, tTtitle;
            var removed = false
                for (var i = this.list.length; i--; ) {
                    var item = this.list[i]

                        if (!item.isAlive()) {
                            //debugger
                            try { // попытаемся получить Родителя если не сможем значит строки уже нет
                                var test = item.rowInVt.Родитель
                            } catch (e) {
                                this.list.splice(i, 1)
                                removed = true
                                continue
                            }
                            if (item.rowInVt) {
                                if (item.rowInVt.Rows.Count() == 0)
                                    if (item.rowInVt.Родитель == undefined)
                                        vt.Rows.Delete(item.rowInVt)
                                    else {
                                            parentRow = item.rowInVt.Родитель;
                                            parentRow.Rows.Delete(item.rowInVt);
                                            if (parentRow.Rows.Count() == 0 && (!parentRow.Окно || !parentRow.Окно.view.visible))
                                                vt.Rows.Delete(parentRow)
                                        }

                            }

                            delete this.find[item.view.id]
                            this.list.splice(i, 1)
                            removed = true
                        }
                        else
                            try{
                            //debugger
                            if(!item.rowInVt){}
                            else if(item.rowInVt!=undefined){
                                        if (item.rowInVt.Родитель == undefined){
                                            tTtitle = item.rowInVt.Окно.view.title;
                                            if (item.rowInVt.Заголовок != tTtitle)
                                            //debugger
                                                item.rowInVt.Заголовок = tTtitle
                                        }
                                }
                            } catch(e) {
                                //debugger
                            }
                }
                return removed
        },
        // Функция для добавления новых окон в список.
        // Перебирает все MDI-окна, и те, которых нет в списке, добавляет туда
        // Также определяет активное окно
        addNewViews : function () {
            //debugger
            var views = []// Массив всех конечных отображений

            var childs = windows.mdiView.enumChilds(); // Получим список MDI-окон
            (function (views, list) // Далее надо каждое MDI-окно "раскрутить" до конечных отображений,
            { // т.к. MDI-окно может быть контейнером для одного или нескольких отображений
                for (var i = 0; i < views.count; i++) {
                    var v = views.item(i);
                    if (v.isContainer != vctNo) // Окно - контейнер. Рекурсивно раскрутим его потомков
                        arguments.callee(v.enumChilds(), list)
                    else // Окно не контейнер. Добавим в общий список
                        list.push(v)
                }
            })(childs, views)
            var added = false
                // Перебираем весь список окон
                for (var idx in views) {
                    var v = views[idx]
                        if (!this.find.hasOwnProperty(v.id)) {
                            var item = new WndListItem(v)
                                this.list.push(item)
                                this.find[v.id] = item
                                added = true
                        }
                }
                if (added) // Что-то добавилось, отсортируем список
                    if (dontSortWindows){
                        // this.list.sort(function (i1, i2) {
                        //  return i1.historyKey.localeCompare(i2.historyKey)
                        // });

                    } else {
                        this.list.sort(function (i1, i2) {
                            return i1.sortkey.localeCompare(i2.sortkey)
                        });
                    }

                    var activeView = null
                    if (childs.count > 0) {
                            activeView = childs.item(0)
                            while (activeView.activeChild)
                                activeView = activeView.activeChild
                            activeView = this.find[activeView.id]
                    }
                    return {
                        added : added,
                        activeView : activeView
                    }
        },
        filterList : function (filterString, vtControl) {
            var parentRow, vt, windowTitle, colonPos, groupRow, searchTitle, mname, oldActiveView;
            vt = vtControl.Value
            needUpdateColors = false;
            //needUpdateColors = this.removeOldViews(vt)
            this.removeOldViews(vt);
            filterString = filterString.toLowerCase()
            var addedResults = this.addNewViews()
            if (addedResults.added || filterString != this.lastFilter) {
                needUpdateColors = true
                this.lastFilter = filterString
                var filters = filterString.split(/\s+/)
                var idxInVt = 0
                for (var vidx in this.list) {
                    var item = this.list[vidx]
                    var needAdd = true
                    var titleText = item.makeTitle().title      // заголовок строится по COM (getObject, typeName) — считаем один раз на элемент
                    var title = titleText.toLowerCase()
                    for (var idx in filters) {
                        if (title.indexOf(filters[idx]) < 0) {
                            needAdd = false
                            break
                        }
                    }
                if (needAdd) {
                    if (!item.rowInVt) {
                        windowTitle = titleText;
                        colonPos = windowTitle.indexOf(': ')
                        //debugger
                        if (colonPos == -1 || item.view.mdObj == undefined) {
                            if (treeView){
                                groupRow = vt.Rows.Найти(windowTitle, "Заголовок", true)
                                if (!groupRow) {
                                    if (windowTitle.indexOf('Общий модуль') == -1 && treeView) {
                                        groupRow = insertRowSafe(vt.Rows, idxInVt)
                                        groupRow.ПолеСортировки = item.sortkey;
                                        item.rowInVt = groupRow
                                    }

                                } else {
                                    groupRow.Окно = item;
                                    item.rowInVt = groupRow;
                                }
                            }
                            else {
                                item.rowInVt = vt.Rows.Add();
                                windowTitle = windowTitle;
                            }
                        } else {
                            //debugger
                            if(item.view.title.indexOf("Общий реквизит")+1){
                                searchTitle = "Общий реквизит"
                                colonPos = -1;
                                windowTitle = treeView?windowTitle.replace("Общий реквизит ", ""):windowTitle;
                                windowTitle = windowTitle.replace(": Состав", "");
                            }
                            else {
                                mname = item.view.mdObj.parent.name
                                if (mname.indexOf("ВнешняяОбработка") == -1 && mname.indexOf("ВнешнийОтчет") == -1)
                                    searchTitle = windowTitle.substr(0, colonPos);
                                else
                                    searchTitle = mname;
                            }

                            if(searchTitle.indexOf("Общий модуль")+1){
                                searchTitle = "Общий модуль";
                                colonPos = -1;
                                windowTitle = treeView?windowTitle.replace("Общий модуль ", ""):windowTitle;
                                windowTitle = windowTitle.replace(": Модуль", "");
                            }
                            if(treeView){
                                parentRow = vt.Rows.Найти(searchTitle, "Заголовок", true)
                                if (parentRow == undefined){
                                    parentRow = vt.Rows.Найти(searchTitle + " *", "Заголовок", true)
                                    if (parentRow == undefined) {
                                        parentRow = insertRowSafe(vt.Rows, idxInVt)
                                        parentRow.Заголовок = searchTitle;
                                        parentRow.ПолеСортировки = item.sortkey;
                                    }
                                }

                                item.rowInVt = insertRowSafe(parentRow.Rows, idxInVt)
                                windowTitle = windowTitle.substr(colonPos + 1)
                            }
                            else {
                                item.rowInVt = vt.Rows.Add();
                                windowTitle = windowTitle.substr(colonPos + 1)
                            }
                        }
                        item.rowInVt.Окно = item
                        item.rowInVt.Заголовок = windowTitle;
                        item.rowInVt.ПолеСортировки = dontSortWindows?item.historyKey:item.sortkey;
                    }
                    idxInVt++;

                } else if (item.rowInVt) {
                    try {
                        vt.Rows.Delete(item.rowInVt)
                    } catch (e) {}
                        item.rowInVt = null
                }
            }

        }
        if(needUpdateColors && vt.Rows.Count()) {
            vt.Rows.Сортировать("ПолеСортировки");
        }

        // Теперь отследим активное окно
        oldActiveView = this.activeView
        if (addedResults.activeView != oldActiveView) {
            this.activeView = addedResults.activeView
                if (oldActiveView && oldActiveView.rowInVt)
                    //vtControl.RefreshRows(oldActiveView.rowInVt)
                    if (addedResults.activeView && addedResults.activeView.rowInVt) {
                        //vtControl.RefreshRows(addedResults.activeView.rowInVt)
                        if(vtControl.ТекущаяСтрока != undefined && vtControl.ТекущаяСтрока.Окно){
                            if(vtControl.ТекущаяСтрока.Окно.sortkey != addedResults.activeView.sortkey)
                                vtControl.ТекущаяСтрока = addedResults.activeView.rowInVt}
                        else
                            vtControl.ТекущаяСтрока = addedResults.activeView.rowInVt
                    }
        }
            //needUpdateColors = false;
    }
})

function macrosПоказать() {
    form.Filter = ""

    form.Открыть();
    form.CurrentControl = form.Controls.WndList
    if (activateSearchElement) {
        form.CurrentControl = form.Controls.Filter;
    }
}

function macrosПоказатьСкрыть() {
    form.Filter = ""

    if (form.Открыта())
        if (form.ВводДоступен())
        {
            form.Закрыть();
            return;
        }
        else
            form.Активизировать();
    else
        form.Открыть();
    form.CurrentControl = form.Controls.WndList
    if (activateSearchElement) {
        form.CurrentControl = form.Controls.Filter;
    }
}

function macrosПереключитьВидимостьОкнаСвойств() {
    windows.propsVisible = !windows.propsVisible
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Показать';
}

function updateWndList() {
    // Получим текущий текст из поля ввода
    var newText = windows.getInputFieldText(form.Controls.Filter).replace(/^\s*|\s*$/g, '')
    WndList.One.filterList(newText, form.Controls.WndList)
}

// Окна опрашиваются (COM по каждому окну) по событию смены заголовка главного окна — оно меняется при открытии, закрытии и переключении
// окон — и страховочно раз в windowPollPeriod мс. Раньше опрос шёл на каждый простой платформы (десятки раз в секунду).
var windowTitlesChanged = false
function onTitlesChanged(param) {
    windowTitlesChanged = true      // тяжёлого здесь не делаем: обработчик вызывается изнутри платформы, опрос — на ближайшем простое
}
var windowPollPeriod = 2000
var lastWindowPoll = 0
function onIdle() {
    // В модальном режиме (конструктор запроса, диалоги редактора форм) окна платформы не опрашиваем: падение в mngcore.dll (дамп 2026-10-03)
    if (windows.modalMode != msNone)
        return
    var now = new Date().getTime()
    if (windowTitlesChanged || now - lastWindowPoll >= windowPollPeriod) {
        windowTitlesChanged = false
        lastWindowPoll = now
        updateWndList()
    }
    if (needHide) {
        needHide = false
            // Теперь спрячем наше окно.
            // Для прячущегося окна нельзя делать form.Close, т.к. тогда оно пропадет совсем, не оставив кнопки на панели
            if (form.СостояниеОкна != ВариантСостоянияОкна.Прячущееся)
                form.Close()
    }
    if (needActivate) {
        try {
            needActivate.activate()
        } catch (e) {
            try { snegopat.diagLog("addin", "wndpanel: активация окна: " + e.description) } catch (e2) {}
        }
        needActivate = null
    }
}

function withSelected(func) {
    for (var rows = new Enumerator(form.Controls.WndList.ВыделенныеСтроки); !rows.atEnd(); rows.moveNext()) {
        var windowItem = rows.item().Окно
        if (windowItem) // у строк-групп окна нет
            func(windowItem)
    }
}

function WndListВыбор(control, selectedRow, column, standardProcessing) {
    standardProcessing.val = false;
    if (control.val.ТекущаяСтрока != undefined && control.val.ТекущаяСтрока.Окно != undefined && control.val.ТекущаяСтрока.Окно.view.visible) {
        if(!activateOnSelect)
            needActivate = selectedRow.val.Окно.view
    }
    else {
        // двойной щелчок по группе: открываем редактор объекта (все проверки — окно/объект могли исчезнуть, пока строка была в списке)
        if(control.val.ТекущаяСтрока != undefined && control.val.ТекущаяСтрока.Строки.Количество()>0){
            var childRow = control.val.ТекущаяСтрока.Строки.Получить(0)
            if(!childRow.Окно || !childRow.Окно.view)
                return
            var currentView=childRow.Окно.view
            if(!currentView.isAlive()) return
            var mdObject = currentView.mdObj
            if(!mdObject) return
            if(mdObject.parent) mdObject.parent.openEditor()
            mdObject.openEditor()
        }
    }

}

function WndListПриАктивизацииСтроки(control) {
    if(activateOnSelect)
        if (control.val.ТекущаяСтрока != undefined && control.val.ТекущаяСтрока.Окно != undefined) {
            needActivate = control.val.ТекущаяСтрока.Окно.view
        }
}

var boldFontV8, fontWin, boldFontWin

function extractFileName(path, withExtension) {
    if (withExtension)
        var expr = /.*\\([\W\w\-\.]+)/;
    else
        var expr = /.*\/([\W\w\-\.]+)\.[^#?\s]+?$/;
    if (path.match(expr))
        return RegExp.$1
        return path
}

function WndListПриВыводеСтроки(control, rowAppearanceRef, rowDataRef) {
    var rowData, rowAppearance, objectType, titlestr2;
    //function WndListПриПолученииДанных(Элемент, ОформлениеСтрок) {

    //debugger
    //for(di=0; di<ОформлениеСтрок.val.Количество();di++){
    //  ОформлениеСтроки = ОформлениеСтрок.val.Получить(di);
    //  ДанныеСтроки = ОформлениеСтроки.ДанныеСтроки;

    rowData = rowDataRef.val;
    rowAppearance = rowAppearanceRef.val;

    if (!rowData || !rowData.Заголовок)
        return;
    var cell = rowAppearance.Ячейки.Окно
    var item = rowData.Окно
    if (!item || !item.view || !item.view.isAlive()) {
        cell.УстановитьТекст(rowData.Заголовок);
        objectType = rowData.Заголовок.substr(0, 3);
        if (objectType.indexOf("Док") + 1)
            TypePicture = БиблиотекаКартинок.Документ;
        else if (objectType.indexOf("Отч") + 1)
            TypePicture = БиблиотекаКартинок.Отчет;
        else if (objectType.indexOf("Обр") + 1)
            TypePicture = БиблиотекаКартинок.Обработка;
        else if (objectType.indexOf("Спр") + 1)
            TypePicture = БиблиотекаКартинок.Справочник;
        try {
            cell.УстановитьКартинку(TypePicture)
        } catch (e) {};
        return
    }
    if (item.view.icon != undefined)
        cell.УстановитьКартинку(item.view.icon)

    var cellinfo = rowAppearance.Ячейки.Инфо;
    var TypePicture = v8New("Картинка");
    var strwindow = item.view.title;
    if (strwindow.indexOf("Документ ") + 1)
        TypePicture = БиблиотекаКартинок.Документ;
    else if (strwindow.indexOf("Отчет ") + 1)
        TypePicture = БиблиотекаКартинок.Отчет;
    else if (strwindow.indexOf("Обработка ") + 1)
        TypePicture = БиблиотекаКартинок.Обработка;
    else if (strwindow.indexOf("Справочник ") + 1)
        TypePicture = БиблиотекаКартинок.Справочник;

    try {
        cellinfo.УстановитьКартинку(TypePicture)
    } catch (e) {}

    var title = item.makeTitle()
    var titlestr = title.title
    titlestr2 = extractFileName(titlestr, true)
    if (rowData.Родитель != undefined)
        cell.УстановитьТекст(rowData.Заголовок)
    else
        cell.УстановитьТекст(titlestr2)
    if (titlestr2 != titlestr)
        cellinfo.УстановитьТекст("[" + titlestr + "]")
    else
        cellinfo.УстановитьТекст(title.info)
}

function FilterРегулирование(control, direction, standardProcessing) {
    var curRow = form.Controls.WndList.ТекущаяСтрока;
    var wndList = form.Controls.WndList.Value;
    if (!curRow) {
        if (form.WndList.Rows.Количество())
            form.Controls.WndList.ТекущаяСтрока = form.WndList.Rows.Получить(-1 == direction.val ? 0 : form.WndList.Rows.Количество() - 1)
                return
    }
    var curRowIdx = form.WndList.Rows.Индекс(curRow),
    newRowIdx = curRowIdx

        if (-1 == direction.val) {
            if (curRowIdx != form.WndList.Rows.Количество() - 1)
                newRowIdx++
        } else {
            if (curRowIdx > 0)
                newRowIdx--
        }
        if (newRowIdx != curRowIdx)
            form.Controls.WndList.ТекущаяСтрока = form.WndList.Rows.Получить(newRowIdx)
                standardProcessing.val = false
}

function ПриОткрытии() {
    updateWndList()
    events.connect(Designer, "onIdle", SelfScript.self)
    events.connect(windows, "onChangeTitles", SelfScript.self, "onTitlesChanged")
    form.Controls.Cmds.Кнопки.SaveSession.Доступность = useSessions;
    form.Controls.Cmds.Кнопки.RestoreSession.Доступность = useSessions;
    form.Controls.Cmds.Кнопки.TreeView.Check = treeView;

}
function ПриЗакрытии() {
    events.disconnect(Designer, "onIdle", SelfScript.self)
    try { events.disconnect(windows, "onChangeTitles", SelfScript.self, "onTitlesChanged") } catch (e) {}
}

function find1LevelMdObj(mdObj) {
    if (mdObj.mdclass.name(1).length) {
        while (mdObj.parent && mdObj.parent.parent)
            mdObj = mdObj.parent
    }
    return mdObj
}

function CmdsActivate(button) {
    if (form.Controls.WndList.ТекущаяСтрока && form.Controls.WndList.ТекущаяСтрока.Окно)
        needActivate = form.Controls.WndList.ТекущаяСтрока.Окно.view
}

function closeSelected() {

    try{withSelected(function(item){item.view.close()})} catch (e){}

}

function closewindows() {
    var parentRow, selectedRows, selectedCount, i, row, i1, innerRow;
    //debugger
    selectedRows = form.Controls.WndList.ВыделенныеСтроки;
    selectedCount = selectedRows.Количество();
    for (i = selectedCount - 1; i >= 0; i--) {
        try{row = selectedRows.Получить(i)} catch(e) {continue}

        for (i1 = row.Строки.Количество() - 1; i1 >= 0; i1--) {
            innerRow = row.Строки.Получить(i1);
            try {
                innerRow.Окно.view.close()
            } catch (e) {}
            try {
                row.Строки.Удалить(innerRow);
            } catch (e) {}

        }
        try {
            row.Окно.view.close()} catch(e){}
        try{
            if(row.Родитель == undefined)
                form.WndList.Строки.Удалить(row);
            else
                {
                parentRow = row.Родитель;
                parentRow.Строки.Удалить(row);
                if((parentRow.Строки.Количество() == 0 && !parentRow.Окно) || (parentRow.Строки.Количество() == 0 && parentRow.Окно.view && !parentRow.Окно.view.isAlive()))
                    form.WndList.Строки.Удалить(parentRow);
                }
        } catch (e) {}

        try{
            withSelected(function(item){item.view.close()})
        } catch (e){}
    }
}

function CmdsClose(button) {
    closewindows()
}

function CmdsOpenModule(button) {
    if (!form.Controls.WndList.ТекущаяСтрока)
        return;
    try {
        form.Controls.WndList.ТекущаяСтрока.Окно.view.mdObj.openModule("МодульОбъекта");
        return
    } catch (e) {}
    try {
        form.Controls.WndList.ТекущаяСтрока.Окно.view.mdObj.parent.openModule("МодульОбъекта");
        return
    } catch (e) {}
    try {
        form.Controls.WndList.ТекущаяСтрока.Строки.Получить(0).Окно.view.mdObj.parent.openModule("МодульОбъекта");
        return
    } catch (e) {}
    try {
        form.Controls.WndList.ТекущаяСтрока.Строки.Получить(0).Окно.view.mdObj.openModule("МодульОбъекта");
        return
    } catch (e) {}
}

function CmdsOpenManagerModule(button) {
    if (!form.Controls.WndList.ТекущаяСтрока)
        return;
    try {
        form.Controls.WndList.ТекущаяСтрока.Окно.view.mdObj.openModule("МодульМенеджера");
        return
    } catch (e) {}
    try {
        form.Controls.WndList.ТекущаяСтрока.Окно.view.mdObj.parent.openModule("МодульМенеджера")
        return
    } catch (e) {}
    try {
        form.Controls.WndList.ТекущаяСтрока.Строки.Получить(0).Окно.view.mdObj.parent.openModule("МодульМенеджера");
        return
    } catch (e) {}
    try {
        form.Controls.WndList.ТекущаяСтрока.Строки.Получить(0).Окно.view.mdObj.openModule("МодульМенеджера");
        return
    } catch (e) {}
}

function CmdsOpenForm(button) {
    var item, mdObj, childRows;
    if (!form.Controls.WndList.ТекущаяСтрока)
        return;
    item = form.Controls.WndList.ТекущаяСтрока.Окно;
    try {
        mdObj = item.view.mdObj;
        mdObj.childObject("Формы", stdlib.getUuidFomMDRef(mdObj.property("ОсновнаяФормаОбъекта"))).openModule("Форма");
        return
    } catch (e) {}
    try {
        mdObj = item.view.mdObj;
        mdObj.childObject("Формы", stdlib.getUuidFomMDRef(mdObj.property("ОсновнаяФорма"))).openModule("Форма");
        return
    } catch (e) {}
    try {
        form.Controls.WndList.ТекущаяСтрока.Окно.view.mdObj.openModule("Форма");
        return
    } catch (e) {}

    childRows = form.Controls.WndList.ТекущаяСтрока.Строки;
    try {
        mdObj = childRows.Получить(0).Окно.view.mdObj;
        mdObj.childObject("Формы", stdlib.getUuidFomMDRef(mdObj.property("ОсновнаяФормаОбъекта"))).openModule("Форма");
        return
    } catch (e) {}
    try {
        mdObj = childRows.Получить(0).Окно.view.mdObj;
        mdObj.childObject("Формы", stdlib.getUuidFomMDRef(mdObj.property("ОсновнаяФорма"))).openModule("Форма");
        return
    } catch (e) {}
    try {
        childRows.Получить(0).Окно.view.mdObj.openModule("Форма");
        return
    } catch (e) {}

}

function CmdsSave(button) {
    withSelected(function (item) {
        stdcommands.Frame.FileSave.sendToView(item.view)
        form.Controls.WndList.ОбновитьСтроки(item.rowInVt)
    })
}

function CmdsFindInTree(button) {
    var mdObj;
    if (form.Controls.WndList.ТекущаяСтрока) {
        if (!form.Controls.WndList.ТекущаяСтрока.Окно)
            mdObj = form.Controls.WndList.ТекущаяСтрока.Строки.Получить(0).Окно.view.mdObj.parent;
        else
            mdObj = form.Controls.WndList.ТекущаяСтрока.Окно.view.mdObj;
        if (mdObj)
            mdObj.activateInTree()
    }
}
function CmdsMinimizeAll(button) {
    var views = windows.mdiView.enumChilds()
        for (var k = 0; k < views.count; k++)
            views.item(k).sendCommand("{c9d3c390-1eb4-11d5-bf52-0050bae2bc79}", 6)
}

function CmdsPrint(button) {
    withSelected(function (item) {
        stdcommands.Frame.Print.sendToView(item.view)
    })
}

function CmdsSaveSession(button) {
    var nameSession;
    if (!sessionManager)
        return
        nameSession = sessionManager.choiceSessionName();
    if (!nameSession)
        return;
    var views = {};
    for (var rows = new Enumerator(form.Controls.WndList.ВыделенныеСтроки); !rows.atEnd(); rows.moveNext()) {
        var item = rows.item().Окно;
        if (!item)
            continue;
        views[item.view.id] = item;
    }
    sessionManager.saveSession(nameSession, views, 'SessionSaved');
}

function CmdsRestoreSession(button) {
    var nameSession;
    if (!sessionManager)
        return
        nameSession = sessionManager.choiceSessionName();
    if (!nameSession)
        return;
    sessionManager.restoreSession(nameSession, 'SessionSaved');
}

function НастройкиПриОткрытии() {
    settingsForm.ДляВнешнихФайловОтображатьТолькоИмяФайла = onlyNameForExtFiles
    settingsForm.ИспользоватьСессии = useSessions;
    settingsForm.ОткрыватьПриСтарте = openOnStart;
    settingsForm.ПриОткрытииФормыАктивизироватьСтрокуПоиска = activateSearchElement;
    settingsForm.АктивироватьОкноПриВыбореСтроки = activateOnSelect;
}

function CmdsConfig(button) {
        settingsForm = loadFormForScript(SelfScript, "ФормаНастройки") // Обработку событий формы привяжем к самому скрипту
        settingsForm.ОткрытьМодально()
}

function saveSettings() {
    onlyNameForExtFiles = settingsForm.ДляВнешнихФайловОтображатьТолькоИмяФайла
    useSessions = settingsForm.ИспользоватьСессии;
    openOnStart = settingsForm.ОткрыватьПриСтарте;
    activateSearchElement = settingsForm.ПриОткрытииФормыАктивизироватьСтрокуПоиска;
    activateOnSelect = settingsForm.АктивироватьОкноПриВыбореСтроки;

    profileRoot.setValue(pflOnlyNameForExtFiles, onlyNameForExtFiles);
    profileRoot.setValue(pflUseSessions, useSessions);
    profileRoot.setValue(pflOpenAtStart, openOnStart);
    profileRoot.setValue(pflActivateSearch, activateSearchElement);
    profileRoot.setValue(pflActivateOneClick, activateOnSelect);

    if (!sessionManager && useSessions) {
        //Message("test load settings")
        loadSessionManager();
    }
}

function CmdsConfigSaveClose(button) {
    saveSettings()
    settingsForm.Закрыть()
}

function CmdsConfigSave(button) {
    saveSettings()
}

function InvisiblePanelSelectAndHide(button) {
    if (form.Controls.WndList.ТекущаяСтрока && form.Controls.WndList.ТекущаяСтрока.Окно) {
        needActivate = form.Controls.WndList.ТекущаяСтрока.Окно.view
            needHide = true
    }
}

function WndListПередНачаломДобавления(control, cancel, isCopy) {
    cancel.val = true
}

function WndListПередУдалением(control, cancel) {
    //Отказ.val = true
    closewindows();
}

function CmdsTreeView(Button){
    var vt;
    treeView = !treeView;
    Button.val.Check = treeView;
    for (var i = WndList.One.list.length; i--; ) {
        var item = WndList.One.list[i];
        item.rowInVt = null;
    };
    if (treeView){
        dontSortWindows = false;
    }

    vt = form.Controls.WndList.Value;

    if (vt.Rows.Count()){
        vt.Rows.Clear();
    }
    WndList.One.lastFilter = "abracadabra";

    updateWndList();
    //form.Controls.WndList.ОбновитьСтроки();
}

function CmdshistorySort(Button){
    var vt, oldteeView;
    dontSortWindows = !dontSortWindows;
    Button.val.Check = dontSortWindows;
    oldteeView = treeView;

    if (dontSortWindows && oldteeView){
        treeView = false;
    }
    form.Controls.Cmds.Кнопки.TreeView.Check = treeView;


    for (var i = WndList.One.list.length; i--; ) {
        var item = WndList.One.list[i];
        item.rowInVt = null;
    };

    vt = form.Controls.WndList.Value;

    if (vt.Rows.Count()){
        vt.Rows.Clear();
    }
    WndList.One.lastFilter = "abracadabra";

    updateWndList();
}

(function () {
    // Инициализация скрипта
    WndList.One = new WndList
        form = loadFormForScript(SelfScript)
        form.КлючСохраненияПоложенияОкна = "wndpanel"
        // Положение по умолчанию: прикреплено справа; «Панель окон» и «Внешние файлы» встают рядом закладками одной панели.
        // Задавать нужно до первого Открыть(). Применяется один раз (флаг в профиле Снегопата) — дальше платформа восстанавливает положение по ключу выше.
        try {
            var dockKey = "DockDefault/wndpanel"
            profileRoot.createValue(dockKey, false, pflSnegopat)
            if (!profileRoot.getValue(dockKey)) {   // только один раз: дальше положение окна определяет пользователь
                form.СостояниеОкна = ВариантСостоянияОкна.Прикрепленное
                form.ПоложениеПрикрепленногоОкна = ВариантПрикрепленияОкна.Право
                profileRoot.setValue(dockKey, true)
            }
        } catch (e) {}
        form.WndList.Columns.Окно.ТипЗначения = v8New("ОписаниеТипов")
        var hk = [
            ["Activate", 13, 0],
            ["Close", 115, 8],
            ["Save", "S".charCodeAt(0), 8],
            ["Print", "P".charCodeAt(0), 8],
            ["FindInTree", "T".charCodeAt(0), 8]
        ]
        for (var k in hk)
            form.Controls.Cmds.Кнопки.Найти(hk[k][0]).СочетаниеКлавиш = stdlib.v8hotkey(hk[k][1], hk[k][2])
                form.Controls.InvisiblePanel.Кнопки.SelectAndHide.СочетаниеКлавиш = stdlib.v8hotkey(13, 8)
})()

function loadSessionManager() {
    try {
        sessionManager = stdlib.require(env.pathes.addins + "SessionManager.js").GetSessionManager();
    } catch (e) {
        Message("Невозможно загрузить Менеджер сессий " + e.description);
    };
}

// Совместимость: макрос раньше был остатком копипаста из другого аддина и просто открывал окно
function macrosОткрытьОкно() {
    macrosПоказать()
}

function addMdObjects(result, i1, mdClass){
    var i, objectName;

    for (i=0; i<md.childObjectsCount(mdClass);i++){
        objectName = md.childObject(mdClass, i).name;
        result.Вставить(objectName, result.Количество());
        i1++
        //Message("" +i1 + ":  " + КлассОбъектов + ":" +  ИмяОбъекта);
    }

}

function collectMetadataList(){
    var mdclass, result;

    md = Designer.metadata.current.rootObject;
    mdclass = md.mdclass;
    result = v8New("Соответствие");
    var i1 = 1;

    addMdObjects(result, i1, "ОбщиеМодули")
    addMdObjects(result, i1, "Роли")
    addMdObjects(result, i1, "ПланыОбмена")
    addMdObjects(result, i1, "КритерииОтбора")
    addMdObjects(result, i1, "ПодпискиНаСобытия")
    addMdObjects(result, i1, "ОбщиеФормы")
    addMdObjects(result, i1, "ОбщиеКоманды")
    addMdObjects(result, i1, "ГруппыКоманд")
    addMdObjects(result, i1, "Интерфейсы")
    addMdObjects(result, i1, "ОбщиеМакеты")
    addMdObjects(result, i1, "Справочники")
    addMdObjects(result, i1, "Документы")
    addMdObjects(result, i1, "ЖурналыДокументов")
    addMdObjects(result, i1, "Перечисления")
    addMdObjects(result, i1, "Отчеты")
    addMdObjects(result, i1, "Обработки")
    addMdObjects(result, i1, "ПланыВидовХарактеристик")
    addMdObjects(result, i1, "ПланыСчетов")
    addMdObjects(result, i1, "ПланыВидовРасчета")
    addMdObjects(result, i1, "РегистрыСведений")
    addMdObjects(result, i1, "РегистрыНакопления")
    addMdObjects(result, i1, "РегистрыБухгалтерии")
    addMdObjects(result, i1, "РегистрыРасчета")
    addMdObjects(result, i1, "БизнесПроцессы")
    addMdObjects(result, i1, "Задачи")

    return result;

}

var pflOnlyNameForExtFiles = "WndPanel/OnlyNameForExtFiles"
var pflUseSessions = "WndPanel/UseSessions";
var pflOpenAtStart = "WndPanel/OpenAtStart";
var pflActivateSearch = "WndPanel/ActivateSearch";
var pflActivateOneClick = "WndPanel/ActivateOneClick";

profileRoot.createValue(pflOnlyNameForExtFiles, false, pflSnegopat)
profileRoot.createValue(pflUseSessions, false, pflSnegopat)
profileRoot.createValue(pflOpenAtStart, false, pflSnegopat)
profileRoot.createValue(pflActivateSearch, false, pflSnegopat)
profileRoot.createValue(pflActivateOneClick, false, pflSnegopat)

var onlyNameForExtFiles = profileRoot.getValue(pflOnlyNameForExtFiles);
var useSessions = profileRoot.getValue(pflUseSessions);
var openOnStart= profileRoot.getValue(pflOpenAtStart);
var activateSearchElement = profileRoot.getValue(pflActivateSearch);
var activateOnSelect = profileRoot.getValue(pflActivateOneClick);

// Список объектов метаданных (порядок сортировки окон) строится при первом обращении, а не при загрузке аддина: обход всех объектов
// конфигурации по COM на старте задерживал загрузку на больших конфигурациях.
var mdList = null;
var mdIndexWidth = 0;
function getMetadataList() {
    if (!mdList) {
        mdList = collectMetadataList();
        mdIndexWidth = mdList.Количество().toString().length;
    }
    return mdList;
}
sessionManager = null;

var needUpdateColors = true;

if (useSessions) {
    loadSessionManager();
}

// Открытие панели на старте откладываем: в момент загрузки скриптов платформа (8.3.27) ещё не готова к созданию форм — падение в nuke83.dll
// и каскад ошибок движка. Ждём 3 с и выхода из модального режима.
function openAfterStart(action) {
    var timer = null
    var handler = {
        tick : function () {
            try { if (windows.modalMode != msNone) return } catch (e) {}
            killTimer(timer)
            action()
        }
    }
    timer = createTimer(3000, handler, "tick")
}

if (openOnStart) {
    openAfterStart(macrosПоказать);
}
