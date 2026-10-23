//engine: JScript
//uname: extfiles
//dname: Внешние файлы
//descr: Добавляет окно из которого можно открывать внешние файлы.
//author: Пушин Владимир <vladnet@gmail.com>, Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog, Сосна Евгений <shenja@sosna.zp.ua>
//version: 1.40
//www: https://snegopat.ru/scripts/wiki?name=extfiles.js  
//help: inplace
//addin: global
//addin: stdcommands
//addin: stdlib


/* Скрипт для открытия внешних файлов для Снегопата
 * Автор        : Пушин Владимир <vladnet@gmail.com>
                  Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
                  Сосна Евгений <shenja@sosna.zp.ua>
 * Дата создания: 24.08.2011
 * Описание     : Добавляет окно из которого можно открывать внешние файлы
 */
// Переменные модуля (раньше создавались неявно как глобальные при первом присваивании)
var scriptForm, settingsForm;

var scriptVersion = 1.40

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

// Макрос для вызова окна
function macrosОткрытьОкноВнешнихФайлов() {

    if(!scriptForm){
        scriptForm = loadFormForScript(SelfScript) // Обработку событий формы привяжем к самому скрипту
        scriptForm.КлючСохраненияПоложенияОкна = SelfScript.uniqueName;
        // Положение по умолчанию: прикреплено справа; «Панель окон» и «Внешние файлы» встают рядом закладками одной панели.
        // Задавать нужно до первого Открыть(). Применяется один раз (флаг в профиле Снегопата) — дальше платформа восстанавливает положение по ключу выше.
        try {
            var dockKey = "DockDefault/extfiles"
            profileRoot.createValue(dockKey, false, pflSnegopat)
            if (!profileRoot.getValue(dockKey)) {   // только один раз: дальше положение окна определяет пользователь
                scriptForm.СостояниеОкна = ВариантСостоянияОкна.Прикрепленное
                scriptForm.ПоложениеПрикрепленногоОкна = ВариантПрикрепленияОкна.Право
                profileRoot.setValue(dockKey, true)
            }
        } catch (e) { logAddinError("положение окна по умолчанию", e) }
        scriptForm.Заголовок="Внешние файлы" //+мВерсияСкрипта        
        scriptForm.УстановитьДействие("ПриЗакрытии", v8New("Действие", "ПриЗакрытии"));
        fileTypePictures = buildPictureCache(scriptForm);
        loadDiffBackends();
        loadDvcsBackends();
        scriptForm.ЭлементыФормы.КпШапка.Кнопки.ПоискВыводитСписком.Пометка = searchAsList;
    }
    scriptForm.Открыть()
}

function macrosСвернутьДеревоВнешнихФайлов() {

    if(isFileTreeActive()==false) return false
    var currentTreeRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока
    if(!currentTreeRow) return false   // дерево пусто (например, пока открывается конфигурация) — «Отсутствует строка данных»
    
    if(scriptForm.ЭлементыФормы.ДеревоФайлов.Развернут(currentTreeRow)==false)
    {
        if(currentTreeRow.Родитель != undefined)
            scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока=currentTreeRow.Родитель
    }
    else
        scriptForm.ЭлементыФормы.ДеревоФайлов.Свернуть(currentTreeRow)
}

function macrosРазвернутьДеревоВнешнихФайлов() {

    if(isFileTreeActive()==false) return false
    var currentTreeRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока
    if(!currentTreeRow) return false
    scriptForm.ЭлементыФормы.ДеревоФайлов.Развернуть(currentTreeRow)
}

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ ФормаСкрипта - обработчики событий.
////

function КпШапкаОбновить(control) {
    clearDirCache()
    refreshFiles()
}

function КпШапкаОбновитьТекущуюВетку(control) {
    refreshCurrentBranch()
}

// Пока человек печатает, дерево не перестраиваем на каждую букву: обновление через 350 мс после последнего изменения
var filterTimer = 0
var filterTimerHandler = {
    tick : function () {
        try { killTimer(filterTimer) } catch (e) {}
        filterTimer = 0
        try { refreshFiles() } catch (e) { Message("Внешние файлы: " + e.description) }
    }
}
// Неожиданная ошибка: в журнал движка (категория addin), чтобы потом можно было разобраться; пользователю сообщение не показываем
function logAddinError(where, error) {
    try { snegopat.diagLog("addin", "extfiles: " + where + ": " + (error && error.description ? error.description : error)) } catch (e) {}
}

function ФильтрПриИзменении(control) {
    if (filterTimer) {
        try { killTimer(filterTimer) } catch (e) {}
    }
    filterTimer = createTimer(350, filterTimerHandler, "tick")
}

function ПриЗакрытии() {
    if(filterTimer) {
        killTimer(filterTimer)
        filterTimer = 0
    }
}

function ПриОткрытии() {
    updateVisibility()
    clearDirCache()
    refreshFiles()
}

function КпШапкаЗакрыть(control) {
    scriptForm.Закрыть()
}

function isFileTreeActive() {
    if(scriptForm==null) return false
    if(scriptForm.ВводДоступен()!=true) return false
    return scriptForm.ТекущийЭлемент==scriptForm.ЭлементыФормы.ДеревоФайлов
}

function КпШапкаРазвернуть(control) {
    macrosРазвернутьДеревоВнешнихФайлов();
}

function КпШапкаСправка(button) {
    RunApp('http://snegopat.ru/scripts/wiki?name=extfiles.js');
}

function КпШапкаСвернуть(control) {
    macrosСвернутьДеревоВнешнихФайлов()
}

function ДеревоФайловПередНачаломИзменения(control, cancel) {
    var treeRow;

    cancel.val = true
    treeRow=control.val.ТекущаяСтрока
    if(treeRow.ЭтоКаталог) return
    
    if (canOpenInConfigurator(treeRow.ИмяФайла))
        stdlib.openFileIn1C(treeRow.ИмяФайла)
    else 
        ЗапуститьПриложение(treeRow.ИмяФайла);
}

function ДеревоФайловПриВыводеСтроки(control, rowAppearance, rowData) {
    var nameCell;

    nameCell=rowAppearance.val.Ячейки.Имя
    nameCell.ОтображатьКартинку=true
    if(ValueIsFilled(rowData.val.Родитель)==false)
    {
        nameCell.Картинка = scriptForm.ЭлементыФормы.КартинкаПапка.Картинка;
    }
    else if(rowData.val.ЭтоКаталог==true)
    {
        nameCell.Картинка = scriptForm.ЭлементыФормы.КартинкаПапка.Картинка;
    }
    else
    {
        var extensionPicture = getPictureByExtension(rowData.val.Тип);
        nameCell.Картинка = extensionPicture ? extensionPicture : БиблиотекаКартинок.Форма;
    }
    
    // Версионный контроль. 
    if (useVersioning) {
        var color = statusColor(rowData.val.Статус)
        if (color!=undefined){ 
            rowAppearance.val.Ячейки.Имя.ЦветФона = color;
        } else {
            if (rowData.val.Статус.length > 0) {
                rowAppearance.val.Ячейки.Имя.Текст = rowAppearance.val.Ячейки.Имя.Текст + "(" + rowData.val.Статус+")";
            }
        }
    }
}

function ДеревоФайловПриАктивизацииСтроки(control) {
    var buttons;
    if (useVersioning) { 
        var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
        if (currentRow) 
        {
            buttons=scriptForm.ЭлементыФормы.КонтекстноеМеню.Кнопки.DVCS.Кнопки;
            
            buttons.КнDvcsОтменитьИзменения.Доступность = false;
            buttons.КнDvcsПоказатьРазличия.Доступность = false;
            buttons.КнDvcsДобавить.Доступность = true;
            buttons.КнDvcsПоказатьЖурнал.Доступность = true;
            buttons.КнDvcsУдалить.Доступность = false;
            buttons.КнDvcsCommit.Доступность = true;
            buttons.КнDvcsЗапустить.Доступность = true;
            buttons.КнDvcsSwitchBranch.Доступность = true;
            
            if (!currentRow.ЭтоКаталог) {
                switch (currentRow.Статус) 
                {
                    case "EDITED":
                        buttons.КнDvcsПоказатьРазличия.Доступность = true;
                        buttons.КнDvcsОтменитьИзменения.Доступность = true;
                        buttons.КнDvcsCommit.Доступность = true;
                        buttons.КнDvcsДобавить.Доступность = false;
                        break;
                    case "ADDED":
                        buttons.КнDvcsCommit.Доступность = true;
                        break
                    case "DELETED":
                        buttons.КнDvcsCommit.Доступность = true;
                        buttons.КнDvcsОтменитьИзменения.Доступность = true;
                        buttons.КнDvcsУдалить.Доступность = true;
                        buttons.КнDvcsДобавить.Доступность = false;
                        break
                    case "NOTVERSIONED":
                        buttons.КнDvcsДобавить.Доступность = true;
                        break
                }
            } 
        }
    }
}

function КонтекстноеМенюОткрытьПроводник (button) {
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) 
    {
        var commandLine = 'explorer.exe "' + getRowCatalog(currentRow) + '"';
        ЗапуститьПриложение(commandLine);
    }
}

function КонтекстноеМенюОткрытьКонсоль (button) {
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) 
    {
        var directory = getRowCatalog(currentRow);
        var commandLine = getConsoleCommand(directory);
        ЗапуститьПриложение(commandLine, directory);
    }
}

function КнШапкаПоискСписком(control) {
    scriptForm.ЭлементыФормы.КпШапка.Кнопки.ПоискВыводитСписком.Пометка = !scriptForm.ЭлементыФормы.КпШапка.Кнопки.ПоискВыводитСписком.Пометка;
    searchAsList = scriptForm.ЭлементыФормы.КпШапка.Кнопки.ПоискВыводитСписком.Пометка;
    profileRoot.setValue(pflExtViewSearchInList, searchAsList); // И здесь прийдеться сохраняем значение, не будем же ради этой настройки открывать форму настройки и закрывать ее?
} //КнШапкаПоискСписком

function КонтекстноеМенюДобавитьКСравнению (button) {
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if ((currentRow) && (!currentRow.ЭтоКаталог)) 
    {
        var i = compareQueue.length > 0 ? 1 : 0; //номер индекса в массиве.
        compareQueue[i] = currentRow.ИмяФайла;
        if (i>0) {
            //вызовем сравнение файлов... 
            СравнитьФайлы(compareQueue[0], compareQueue[1])
            compareQueue = [];
        }
    }
} //КонтекстноеМенюДобавитьКСравнению

function КонтекстноеМенюДополнительноСоздатьКопию(button) {
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if ((currentRow) && (!currentRow.ЭтоКаталог)) 
    {
        var file = v8New("File", currentRow.ИмяФайла);
        var copyName = file.ИмяБезРасширения + "-"+snegopat.parseTemplateString("<?\"\", ДатаВремя,\"ДФ=yyyyMMdd-HHmmss\">")+file.Расширение;
        try {
            FileCopy(currentRow.ИмяФайла, file.Путь+"\\"+copyName);
        } catch (e) {
            logAddinError("копия файла " + currentRow.ИмяФайла, e)
            Message("Не удалось создать копию файла: " + e.description)
        }
        refreshCurrentBranch();
    }
} //КонтекстноеМенюДополнительноСоздатьКопию

function КонтекстноеМенюКнDvcsПоказатьРазличия(button) {
    var caller;
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        caller = getDvcsBackendForPath(currentRow.ИмяФайла);
        if (caller!=null) {
        var pathsToFiles = v8New("Structure");
        if (!caller("SHOWDIFF", currentRow.ИмяФайла, pathsToFiles)) {return};
            СравнитьФайлы(pathsToFiles["path1"], pathsToFiles["path2"])
        }
    }
} //КонтекстноеМенюКнDvcsПоказатьРазличия

function КонтекстноеМенюКнDvcsПоказатьЖурнал(button) {
    var caller, logViewAddin;
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        caller = getDvcsBackendForPath(currentRow.ИмяФайла);
        if (caller!=null){
            var pathToLog = env.pathes.addins + "dvcs\\logview.js";
            var f = v8New("File", pathToLog);
            if (!f.Exist()) return
            
            logViewAddin = stdlib.require(f.FullName);
            if (logViewAddin) {
                var logView = logViewAddin.CreateLogViewForm();
                logView.open(caller, currentRow.ИмяФайла);
            }
        }
    }
} //КонтекстноеМенюКнDvcsПоказатьЖурнал

function КонтекстноеМенюКнDvcsДобавить(button) {
    var caller;
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        caller = getDvcsBackendForPath(currentRow.ИмяФайла);
        if (caller!=null) caller("ADD", currentRow.ИмяФайла, "");
        refreshCurrentBranch()
    }
} //КонтекстноеМенюКнDvcsДобавить

function КонтекстноеМенюКнDvcsОтменитьИзменения(button) {
    var caller;
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        caller = getDvcsBackendForPath(currentRow.ИмяФайла);
        if (caller!=null) caller("REVERT", currentRow.ИмяФайла, "");
    }
    refreshCurrentBranch();
} //КонтекстноеМенюКнDvcsОтменитьИзменения

function КонтекстноеМенюКнDvcsУдалить(button) {
    var caller;
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        if (currentRow.Родитель!=undefined)  {
            caller = getDvcsBackendForPath(currentRow.Родитель.ИмяФайла);
            if (caller!=null) caller("DELETE", currentRow.Имя, "");
            refreshCurrentBranch();
        }
    }
} //КонтекстноеМенюКнDvcsУдалить

function КонтекстноеМенюКнDvcsSwitchBranch() {
    var caller, result, choice;

    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        caller = getDvcsBackendForPath(currentRow.ИмяФайла);
        if (caller!=null){
            result = caller("GETLISTBRANCH", currentRow.ИмяФайла, "");
            if (result==false) return;
            if ((result["valuelist"].Count() > 0) && (result["index"] !=-1)) {
                choice = result["valuelist"].ChooseItem("Выберете ветку ", result["valuelist"].Get(result["index"]));
                if (choice!=undefined) {
                    caller("SWITHBRANCH", currentRow.ИмяФайла, choice.value);
                    
                }
            }
        }
        refreshCurrentBranch();
    }
}

function КонтекстноеМенюКнDvcsCommit(button) {
    var caller;
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        caller = getDvcsBackendForPath(currentRow.ИмяФайла);
        if (caller == null) {
            Message("Для файла не найдена система версионного контроля");
            return;
        }
        var vbs = addins.byUniqueName("vbs").object
        vbs.var0 = ""; vbs.var1 = "Введите комментарий"; vbs.var2 = 0, vbs.var3 = true;
        if (vbs.DoEval("InputString(var0, var1, var2, var3)")) {
            var message  = vbs.var0;
            if (message.length!=0) {
                    if (caller!=null) {caller("COMMIT", currentRow.ИмяФайла, message);}
            }
        }
    }
    refreshCurrentBranch();
} //КонтекстноеМенюКнDvcsCommit

function КонтекстноеМенюКнDVCSЗапустить(button) {
    var caller;
    var currentRow = scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущиеДанные;
    if (currentRow) {
        caller = getDvcsBackendForPath(currentRow.ИмяФайла);
        if (caller!=null) caller("RUN", currentRow.ИмяФайла, "");
    }
} //КонтекстноеМенюКнDVCSЗапустить

function updateVisibility() {
    var buttons;
    if (!useVersioning) { 
        buttons=scriptForm.ЭлементыФормы.КонтекстноеМеню.Кнопки.DVCS.Кнопки;
        buttons.КнDvcsОтменитьИзменения.Доступность = false;
        buttons.КнDvcsПоказатьРазличия.Доступность = false;
        buttons.КнDvcsДобавить.Доступность = false;
        buttons.КнDvcsПоказатьЖурнал.Доступность = false;
        buttons.КнDvcsУдалить.Доступность = false;
        buttons.КнDvcsCommit.Доступность = false;
        buttons.КнDvcsЗапустить.Доступность = false;
        buttons.КнDvcsSwitchBranch.Доступность = false;
    } else {
        buttons=scriptForm.ЭлементыФормы.КонтекстноеМеню.Кнопки.DVCS.Кнопки;
        buttons.КнDvcsОтменитьИзменения.Доступность = false;
        buttons.КнDvcsПоказатьРазличия.Доступность = false;
        buttons.КнDvcsДобавить.Доступность = true;
        buttons.КнDvcsПоказатьЖурнал.Доступность = true;
        buttons.КнDvcsУдалить.Доступность = false;
        buttons.КнDvcsCommit.Доступность = true;
        buttons.КнDvcsЗапустить.Доступность = true;
        buttons.КнDvcsSwitchBranch.Доступность = true;
        
    }
} //УстановитьВидимость

////
////} ФормаСкрипта - обработчики событий.
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные процедуры и функции.
////

function initCatalogsTable(catalogs) {
    var catalogsTable, tableRow;

    try{
        catalogs = ValueFromStringInternal(catalogs)
    }
    catch(e){
        catalogs = v8New("ТаблицаЗначений")
    }
    try{ /*тут проверяем не старые ли настройки, раньше хранились в массиве, конвертируем, в будущем удалить*/
        var probe=catalogs.ВГраница()
        catalogsTable = v8New("ТаблицаЗначений")
        catalogsTable.Колонки.Добавить("ИмяКаталога");
        catalogsTable.Колонки.Добавить("Развернуть");
        
        for (var index=0; index<catalogs.Количество(); index++)
        {
            tableRow=catalogsTable.Добавить()
            tableRow.ИмяКаталога=catalogs.Получить(index)
            tableRow.Развернуть=true
        }
        return catalogsTable
    }
    catch(e){
    }
    return catalogs
}

function getAbsolutePath(path) {

    // Путь относительный?
    if (path.match(/^\.{1,2}[\/\\]/))
    {
        // Относительные пути должны задаваться относительно главного каталога Снегопата.
        return mainFolder + path;
    }
    
    return path;
}

function ExpandTreeForFile(treeRow, expand) {
    
    while(treeRow.Родитель != undefined) { //Проверим до первого родителя, в теории самый первый раз должен до начала дойти.
        treeRow=treeRow.Родитель;
        if (treeRow.Развернут != expand) {
            treeRow.Развернуть = expand;
        } else {
            break;
        }
    }
}

// Статус каталога и список удалённых файлов запрашиваются у внешней программы (git, fossil — отдельный процесс, главный поток ждёт),
// поэтому результат хранится dirCacheTtl мс и сбрасывается вместе с кэшем каталогов («Обновить», открытие окна, действия с файлами).
var dvcsStatusTime = {}
var dvcsMissingCache = {}

function dvcsGetCatalogStatus(catalog) { // Проверим находиться ли каталого под версионным контролем.
    if (!useVersioning)
        return
    var now = new Date().getTime()
    if (dvcsStatusTime[catalog] && now - dvcsStatusTime[catalog] < dirCacheTtl)
        return
    dvcsStatusTime[catalog] = now
    for (var key in DvcsBackends) {
        if (DvcsBackends[key]("TEST", catalog, "")) {
            dvcsByCatalog[catalog] = DvcsBackends[key];
            dvcsByCatalog[catalog]("CATALOGSTATUS", catalog, "")
            break;
        }
    }
} //dvcsGetCatalogStatus

function dvcsGetMissingFiles(catalog, catalogRow) {
    if (!useVersioning || dvcsByCatalog[catalog] == undefined)
        return
    // получим отсутствующие файлы. Писать будем Имя = путь, т.к. каталога уже может и не существовать.
    var missing = dvcsMissingCache[catalog]
    if (missing === undefined) {
        missing = dvcsByCatalog[catalog]("GETFILESDELETED", catalog, "")
        dvcsMissingCache[catalog] = missing
    }
    if (typeof(missing) != 'boolean') {
        //простой массив.
        for (var i = 0; i < missing.length; i++) {
            var row = catalogRow.Строки.Добавить();
            row.Имя = missing[i];
            row.Статус = "DELETED";
            row.ИмяФайла = ""; //Оставим пустым, т.е. файл удалили теперь
        }
    }
} //dvcsGetMissingFiles

function dvcsGetFileStatus(pathToFile) {
    var result = "";
    for (var key in dvcsByCatalog) {
        if (pathToFile.indexOf(key) >=0) {
            var result = dvcsByCatalog[key]("FILESTATUS", key, pathToFile);
            break
        }
    }
    return result;
}

// Все слова фильтра (разделитель — пробелы) входят в имя
function nameContainsWords(name, filter) {
    var lowerName = String(name).toLowerCase()
    var words = String(filter).toLowerCase().split(/\s+/)
    for (var index = 0; index < words.length; index++)
        if (words[index] != "" && lowerName.indexOf(words[index]) == -1)
            return false
    return true
}

// Содержимое каталогов кэшируется (на сетевых папках каждый обход диска — секунды): набор буквы в фильтре больше не читает диск.
// Кэш сбрасывается кнопкой «Обновить», при открытии окна, после действий с файлами и сам через dirCacheTtl мс.
var dirCache = {}
var dirCacheTtl = 60000
var missingReported = {}     // каталоги, о которых уже сообщили «не существует» (сбрасывается вместе с кэшем, то есть по «Обновить»)

function clearDirCache() {
    dirCache = {}
    missingReported = {}
    dvcsStatusTime = {}
    dvcsMissingCache = {}
}

// Служебные каталоги репозиториев в дереве не нужны и содержат тысячи файлов
function isServiceDir(name) {
    var lower = String(name).toLowerCase()
    return lower == ".git" || lower == ".svn" || lower == ".hg" || lower == "node_modules"
}

// Список содержимого каталога обычными объектами JS (те же свойства и методы, что у 1С-файла, которые использует дерево)
function getDirFiles(path) {
    var now = new Date().getTime()
    var entry = dirCache[path]
    if (entry && now - entry.time < dirCacheTtl)
        return entry.files
    var found = FindFiles(path, '*.*', false)
    var list = []
    for (var i = 0; i < found.Количество(); i++) {
        var sysFile = found.Получить(i)
        var isDir = sysFile.ЭтоКаталог() == true
        if (isDir && isServiceDir(sysFile.Имя))
            continue
        list.push({
            Имя: sysFile.Имя,
            ИмяБезРасширения: sysFile.ИмяБезРасширения,
            Расширение: sysFile.Расширение,
            ПолноеИмя: sysFile.ПолноеИмя,
            isDir: isDir,
            mtime: sysFile.ПолучитьВремяИзменения(),
            ЭтоКаталог: function () { return this.isDir },
            ПолучитьВремяИзменения: function () { return this.mtime }
        })
    }
    dirCache[path] = { time: now, files: list }
    return list
}

// Дерево без фильтра: каталоги рекурсивно, у файлов — тип и (при включённом версионном контроле) статус
function addFiles(path, node) {
    if (scriptForm.Фильтр != '') {
        addFilteredFiles(path, node)
        return
    }
    var files = getDirFiles(path)
    for (var i = 0; i < files.length; i++) {
        var file = files[i]
        var row = node.Строки.Добавить()
        row.ЭтоКаталог = file.ЭтоКаталог()
        row.ИмяФайла = file.ПолноеИмя
        row.ДатаИзменения = file.ПолучитьВремяИзменения()
        if (file.ЭтоКаталог()) {
            row.Имя = file.Имя        // у каталога имя целиком (с точками)
            addFiles(file.ПолноеИмя, row)
        } else {
            row.Имя = showExtInName == true ? file.Имя : file.ИмяБезРасширения
            if (useVersioning)
                row.Статус = dvcsGetFileStatus(row.ИмяФайла)
            row.Тип = file.Расширение.substr(1)
        }
    }
}

// Дерево по фильтру. Подходящие файлы (все слова фильтра входят в имя, в любом порядке, без учёта регистра; это не регулярное
// выражение — «(» или «+» в строке поиска не вызывают ошибку) сразу кладутся в нужном виде: деревом по каталогам или плоским
// списком с путём от корня. Раньше сначала строился плоский список, затем он перестраивался в дерево поиском строк по каждому
// сегменту пути (много COM-вызовов), а при выключенном показе расширений перестройка зацикливалась.
function addFilteredFiles(rootPath, rootRow) {
    var asList = searchAsList == true
    var showExtension = showExtInName == true
    var filter = scriptForm.Фильтр
    var dirRows = {}                     // полный путь каталога → строка дерева
    var rootName = String(rootRow.Имя)
    var prefixLength = rootName.length + (rootName.substr(rootName.length - 1) == '\\' ? 0 : 1)

    function dirRow(dir, parent) {
        var row = dirRows[dir.ПолноеИмя]
        if (!row) {
            row = parent.Строки.Добавить()
            row.ЭтоКаталог = true
            row.ИмяФайла = dir.ПолноеИмя
            row.ДатаИзменения = dir.ПолучитьВремяИзменения()
            row.Имя = dir.Имя
            dirRows[dir.ПолноеИмя] = row
        }
        return row
    }

    function walk(path, chain) {
        var files = getDirFiles(path)
        for (var i = 0; i < files.length; i++) {
            var file = files[i]
            if (file.ЭтоКаталог()) {
                walk(file.ПолноеИмя, chain.concat([file]))
                continue
            }
            if (!nameContainsWords(showExtension ? file.Имя : file.ИмяБезРасширения, filter))
                continue
            var parent = rootRow
            if (!asList) {
                for (var k = 0; k < chain.length; k++)
                    parent = dirRow(chain[k], parent)
            }
            var row = parent.Строки.Добавить()
            row.ЭтоКаталог = false
            row.ИмяФайла = file.ПолноеИмя
            row.ДатаИзменения = file.ПолучитьВремяИзменения()
            row.Тип = file.Расширение.substr(1)
            if (asList) {
                var name = file.ПолноеИмя.substr(prefixLength)
                row.Имя = showExtension ? name : name.substr(0, name.length - file.Расширение.length)
            } else {
                row.Имя = showExtension ? file.Имя : file.ИмяБезРасширения
            }
            ExpandTreeForFile(row, true)
        }
    }

    walk(rootPath, [])
}

// Сообщение о недоступном каталоге — один раз до «Обновить»
function reportMissingCatalog(path) {
    if (missingReported[path])
        return
    missingReported[path] = true
    Message("Каталог не существует, пропускаем: " + path)
}

// Добавляет в дерево корневые каталоги из таблицы настроек (общие или каталоги базы)
function addCatalogs(catalogs) {
    for (var i = 0; i < catalogs.Количество(); i++) {
        var catalog = catalogs.Получить(i).ИмяКаталога
        // Каталог можно задать относительно каталога Снегопата (путь начинается с «.» или «..»)
        if (catalog == ".git")
            continue
        var absolute = getAbsolutePath(catalog)
        if (!v8New("File", absolute).Exist()) {
            reportMissingCatalog(absolute)
            continue
        }
        catalog = absolute
        var rootRow = scriptForm.ДеревоФайлов.Строки.Добавить()
        rootRow.Имя = catalog
        rootRow.ИмяФайла = catalog
        rootRow.Развернуть = catalogs.Получить(i).Развернуть
        if (useVersioning) {
            dvcsGetCatalogStatus(catalog)
            dvcsGetMissingFiles(catalog, rootRow)
            rootRow.Статус = dvcsGetFileStatus(rootRow.ИмяФайла)
        }
        addFiles(catalog, rootRow)
        rootRow.Строки.Сортировать("ЭтоКаталог Убыв, Имя", true)
    }
    scriptForm.ДеревоФайлов.Строки.Сортировать("ЭтоКаталог Убыв, Имя", true)
}

function refreshFiles() {
    var treeRow, currentFileName, foundRow;
    treeRow=scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока
    
    // Запомним текущую строку
    currentFileName=""
    if(treeRow!=undefined) currentFileName=treeRow.ИмяФайла
    
    scriptForm.ДеревоФайлов.Строки.Очистить()
    
    addCatalogs(commonCatalogs)
    addCatalogs(baseCatalogs)
    for (var index=0; index<scriptForm.ДеревоФайлов.Строки.Количество(); index++)
    {
        if(scriptForm.ДеревоФайлов.Строки.Получить(index).Развернуть == false) continue
        var Str1=scriptForm.ДеревоФайлов.Строки.Получить(index)
        scriptForm.ЭлементыФормы.ДеревоФайлов.Развернуть(Str1, scriptForm.Фильтр != '');
    }
    
    // Восстановим текущую строку
    if(currentFileName != ""){
        foundRow=scriptForm.ДеревоФайлов.Строки.Найти(currentFileName, "ИмяФайла", true)
        if(foundRow != undefined)
            scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока=foundRow
    }
}

function refreshCurrentBranch() {
    var treeRow, currentFileName, foundRow;
    clearDirCache()

    treeRow=scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока
    if(treeRow==undefined) return
    
    // Запомним текущую строку
    currentFileName=treeRow.ИмяФайла
    
    while(treeRow.Родитель != undefined) treeRow=treeRow.Родитель
    treeRow.Строки.Очистить()
    if (useVersioning){ 
        dvcsGetCatalogStatus(treeRow.Имя);
        dvcsGetMissingFiles(treeRow.Имя, treeRow);
        treeRow.Статус = dvcsGetFileStatus(treeRow.ИмяФайла);
    }
    addFiles(treeRow.Имя, treeRow)
    
    treeRow.Строки.Сортировать("ЭтоКаталог Убыв, Имя", true)
    
    // Восстановим текущую строку
    foundRow=scriptForm.ДеревоФайлов.Строки.Найти(currentFileName, "ИмяФайла", true)
    if(foundRow != undefined)
        scriptForm.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока=foundRow
}

function getRowCatalog(node) {
    var fileInfo = v8New('Файл', node.ИмяФайла);
    return fileInfo.ЭтоФайл() ? fileInfo.Путь : fileInfo.ПолноеИмя;
}

function getConsoleCommand(directory) {
    return consoleCommand.replace(/%1/, directory);
}

function defaultExtensionsTable() {

    var table = v8New("ТаблицаЗначений");
    table.Колонки.Добавить("Расширение");

    function addExtension(extension) { table.Добавить().Расширение = extension; }
    
    // Стандартные файлы 1С:Предприятия 8.
    addExtension("txt"); addExtension("bmp"); addExtension("dib"); addExtension("png"); addExtension("rle"); 
    addExtension("jpg"); addExtension("jpeg"); addExtension("tif"); addExtension("ico"); addExtension("mxl"); 
    addExtension("epf"); addExtension("erf"); addExtension("htm"); addExtension("html"); addExtension("grs"); 
    addExtension("geo"); addExtension("st"); addExtension("lgf"); addExtension("elf"); addExtension("cf"); addExtension("pff");

    // Файлы Снегопата.
    addExtension("ssf"); addExtension("js"); addExtension("vbs");
    
    return table;
}

function canOpenInConfigurator(fileName)  {
    if (!RE_EXTENSIONS) 
    {
        var ext = new Array();
        for (var i=0; i<openableExtensions.Количество(); i++)
            ext.push(openableExtensions.Get(i).Расширение);
            
        RE_EXTENSIONS = new RegExp('\\.(?:' + ext.join('|') + ')$', 'i');
    }
    
    return RE_EXTENSIONS.test(fileName);
}

function buildPictureCache(form) {
    var formElements = form.ЭлементыФормы;  
    var cache = {};
  
    function add(estr, pic) {
        var exts = estr.split('|');
        for (var i=0; i<exts.length; i++)
            cache[exts[i].toLowerCase()] = pic; 
    }
  
    add('doc|docx|dot|odf', formElements.КартинкаТипФайлаDoc.Картинка);
    add('xls|xlsx|csv', formElements.КартинкаТипФайлаXls.Картинка);
    
    add('pps|ppsx', formElements.КартинкаТипФайлаPps.Картинка);
    add('pdf|ps', formElements.КартинкаТипФайлаPdf.Картинка);
        
    add('png|jpg|jpeg|bmp|tif|dib|ico', formElements.КартинкаТипФайлаPng.Картинка);

    add('xml', formElements.КартинкаТипФайлаXml.Картинка);
    add('zip', formElements.КартинкаТипФайлаZip.Картинка);
    add('rar', formElements.КартинкаТипФайлаRar.Картинка);
    
    add('exe|cmd|bat', formElements.КартинкаТипФайлаExe.Картинка);

    add('txt', formElements.КартинкаТипФайлаTxt.Картинка);    
    add('geo', formElements.КартинкаТипФайлаGeo.Картинка);
    add('grs', formElements.КартинкаТипФайлаGrs.Картинка);
    add('erf', formElements.КартинкаТипФайлаErf.Картинка);
    add('epf', formElements.КартинкаТипФайлаEpf.Картинка);
    add('mxl', formElements.КартинкаТипФайлаMxl.Картинка);
    
    add('ssf', formElements.КартинкаТипФайлаSsf.Картинка);
    add('js', formElements.КартинкаТипФайлаTxt.Картинка);
    add('vbs', formElements.КартинкаТипФайлаTxt.Картинка);
    
    add('unknown', formElements.КартинкаТипФайлаUnknown.Картинка);

    return cache;

}

function getPictureByExtension(fileExtension) {

    if (fileTypePictures) {
        var pic = fileTypePictures[fileExtension.toLowerCase()];
        return pic ? pic : fileTypePictures['unknown'];
    }    
    return null;
}

function hookCompareFiles(dlgInfo){

    if (Path1 == null) return
    if (Path2 == null) return
    if(dlgInfo.stage == openModalWnd && dlgInfo.caption == "Сравнить файлы")
    {
        events.disconnect(windows, "onDoModal", SelfScript.self, "hookCompareFiles")
        dlgInfo.form.getControl("FirstFile").value = Path1
        dlgInfo.form.getControl("SecondFile").value = Path2
        // закрыть диалог как «ОК» (так же делает CfgStore.js); раньше нажимался Ctrl+Enter через SendKeys, что зависело от фокуса окна
        dlgInfo.cancel = true
        dlgInfo.result = mbaOK
    }
} //hookCompareFiles

function СравнитьФайлы (firstPath, secondPath) {

    if (firstPath == null || secondPath == null) return
    Path1 = firstPath; Path2 = secondPath;
    var ext = v8New("File", firstPath).Extension;
    ext = ext.substr(1).toLowerCase(); //Уберем первый символ, там точка.
    var caller = DiffBackends[ext.toLowerCase()]
    if (caller) {
        caller(Path1, Path2)
    } else {
        //для обработок 
        try { //сделаем возможность работы в демо режиме снегопата. 
            try { events.disconnect(windows, "onDoModal", SelfScript.self, "hookCompareFiles") } catch (e0) {}
            events.connect(windows, "onDoModal", SelfScript.self, "hookCompareFiles")
            stdcommands.Frame.CompareFiles.send()
        } catch (e) {
            Message("Возможно демо режим снегопата... все возможности извините не получиться использовать. ")
        }
        
    }
    Path1 = null; Path2 = null;
} //СравнитьФайлы

function getDvcsBackendForPath(path) {
    var file = v8New("File", path);
    var result = null
    if (file.Существует()) {
        for (var key in dvcsByCatalog) {
            if (path.indexOf(key) >=0) {
                result = dvcsByCatalog[key]
                break
            }
        }
    }
    return result
}

function registerDiffBackend(description, caller) {
    // тут расширение файла будет использоваться для определения инструмента сравнения. 
    
    DiffBackends[description.toLowerCase()] = caller;
}

function registerDvcsBackend(description, caller) {
    // кто последний, того и тапки. 
    DvcsBackends[description.toLowerCase()] = caller;
}

function loadDiffBackends() {
    //TODO: добавить на форму, таблицу значений с настройками. Что бы можно было выбрать какие diff и для каких файлов можно использовать, а какие нет. 
    DiffBackends = {}
        
    var fileList = НайтиФайлы(env.pathes.addins + "dvcs\\", "diff*.js");
    for (var i =0; i<fileList.Количество(); i++) {
        var file = fileList.Get(i);
        function add(estr, caller) {
            var exts = estr.split('|');
            for (var i=0; i<exts.length; i++)
                registerDiffBackend(exts[i].toLowerCase(), caller); 
        }
        var extensions = stdlib.require(file.ПолноеИмя).GetExtension()
        add(extensions, stdlib.require(file.ПолноеИмя).GetBackend())
    }
} //loadDiffBackends

function loadDvcsBackends() {
    DvcsBackends = {}
    if (!useVersioning) return 
    var fileList = НайтиФайлы(env.pathes.addins + "dvcs\\", "dvcs*.js");
    for (var i =0; i<fileList.Количество(); i++) {
        var file = fileList.Get(i);
        try { 
            registerDvcsBackend(file.ИмяБезРасширения, stdlib.require(file.ПолноеИмя).GetBackend());
        } catch (e) {
            Message("Не удалось подключить модуль версионного контроля " + file.ИмяБезРасширения + ": " + e.description);
        }
    }
} //loadDvcsBackends

////
////} Вспомогательные процедуры и функции.
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
////{ ФормаНастройки - обработчики событий.
////

function КпШапкаНастройки(control) {
    settingsForm=loadFormForScript(SelfScript, "ФормаНастройки") // Обработку событий формы привяжем к самому скрипту
    settingsForm.ЭлементыФормы.НадписьВерсия.Заголовок=getSettingsVersionCaption()
    settingsForm.ЭлементыФормы.НадписьВерсия.Подсказка="Версия файлов Снегопата на диске; при отсутствии version.json показана версия аддина"
    tuneSettingsButtons()
    try { settingsForm.ОткрытьМодально() }
    finally { settingsForm = null }
}

function getSettingsVersionCaption() {
    var stream = null
    try {
        var root = String(env.snMainFolder).replace(/[\\\/]+$/, "").replace(/[\\\/]modules[\\\/][^\\\/]+$/i, "")
        stream = new ActiveXObject("Scripting.FileSystemObject").OpenTextFile(root + "/version.json", 1)
        var match = /"ours"\s*:\s*"([^"]+)"/.exec(stream.ReadAll())
        if(match) return "Сборка: " + match[1]
    } catch(e) { logAddinError("версия поставки", e) }
    finally { if(stream) stream.Close() }
    return "Аддин: " + scriptVersion
}

function tuneSettingsButtons() {
    var panels = ["КпКаталогиОбщие", "КпКаталогиБазы"]
    var captions = ["Добавить каталог", "Скопировать", "Изменить", "Удалить", "Закончить редактирование", "Переместить вверх", "Переместить вниз"]
    for(var i = 0; i < panels.length; i++) {
        var buttons = settingsForm.ЭлементыФормы[panels[i]].Кнопки
        for(var j = 0; j < captions.length; j++) {
            var name = "Действие" + (j ? j : "")
            var button = buttons.Найти(name)
            if(button) {
                button.Текст = captions[j]
                button.Подсказка = captions[j]
            }
        }
    }
}

function saveSettings() {

    commonCatalogs=settingsForm.КаталогиОбщие.Скопировать()
    baseCatalogs=settingsForm.КаталогиБазы.Скопировать()
    openOnStart=settingsForm.ОткрыватьФормуПриЗагрузке
    openableExtensions = settingsForm.РасширенияФайлов.Скопировать();
    consoleCommand = settingsForm.КомандаЗапускаКонсоли;
    showExtInName = settingsForm.ОтображатьРасширениеФайлаВПредставлении;
    useVersioning = settingsForm.ИспользоватьВерсионирование;
    colorEdited        = settingsForm.ЦветФонаИзмененные
    colorDeleted        = settingsForm.ЦветФонаУдаленный
    colorNotVersioned    = settingsForm.ЦветФонаНеВерсионный

    RE_EXTENSIONS = null; // Регулярку надо переформировать.
    rebuildStatusColors()
    
    profileRoot.setValue(pflExtFilesOpenOnStart, openOnStart)
    profileRoot.setValue(pflExtShowExtInName, showExtInName)
    profileRoot.setValue(pflExtFilesPath, ValueToStringInternal(commonCatalogs))
    profileRoot.setValue(pflExtFilesPathBase, ValueToStringInternal(baseCatalogs))
    profileRoot.setValue(pflExtOpen1CExtensions, openableExtensions)
    profileRoot.setValue(pflExtRunConsoleCommand, consoleCommand)
    profileRoot.setValue(pflExtViewSearchInList, searchAsList)
    
    profileRoot.setValue(pflVersionControl, useVersioning)
    profileRoot.setValue(pfColorModiefed, colorEdited)
    profileRoot.setValue(pfColorDeleted, colorDeleted)
    profileRoot.setValue(pfColorNotVersioned, colorNotVersioned)
    
    loadDvcsBackends()
    clearDirCache()
    refreshFiles()
    updateVisibility()
}

function loadCatalogsSetting(catalogs, catalogsRows) {
    var tableRow;
    catalogsRows.Очистить()

    for (var index=0; index<catalogs.Количество(); index++)
    {
        tableRow=catalogsRows.Добавить()
        tableRow.ИмяКаталога=catalogs.Получить(index).ИмяКаталога
        tableRow.Развернуть=catalogs.Получить(index).Развернуть
    }
}

function НастройкиПриОткрытии() {
    tuneSettingsButtons()
    settingsForm.ОткрыватьФормуПриЗагрузке=openOnStart
    settingsForm.ОтображатьРасширениеФайлаВПредставлении=showExtInName
    loadCatalogsSetting(commonCatalogs, settingsForm.КаталогиОбщие);
    loadCatalogsSetting(baseCatalogs, settingsForm.КаталогиБазы);
    settingsForm.РасширенияФайлов = openableExtensions.Скопировать();
    settingsForm.КомандаЗапускаКонсоли = consoleCommand;
    settingsForm.ИспользоватьВерсионирование = useVersioning;
    settingsForm.ЦветФонаИзмененные = colorEdited;
    settingsForm.ЦветФонаНеВерсионный = colorNotVersioned;
    settingsForm.ЦветФонаУдаленный = colorDeleted;
    settingsForm.ЭлементыФормы.ПанельНастроекВерсионныйКонтроль.Видимость = useVersioning;
}

function КпШапкаЗаписатьИЗакрыть(button) {
    saveSettings()
    settingsForm.Закрыть()
}

function КпШапкаЗаписать(button) {
    saveSettings()
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'ОткрытьОкноВнешнихФайлов';
}

function chooseCatalog() {
    var fileDialog;
    fileDialog=v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.ВыборКаталога)
    fileDialog.ПолноеИмяФайла = ""
    fileDialog.Заголовок = "Выберите каталог"
    if(fileDialog.Выбрать()==false) return ""
    return fileDialog.Каталог
}

function addSettingsCatalog(control, cancel, copy) {
    if(copy && copy.val) return
    cancel.val = true
    var catalog = chooseCatalog()
    if(!catalog) return
    var rows = control.val.Значение
    for(var i = 0; i < rows.Количество(); i++) {
        var existing = rows.Получить(i)
        var path = String(existing.ИмяКаталога).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase()
        if(path == String(catalog).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase()) {
            control.val.ТекущаяСтрока = existing
            return
        }
    }
    var row = rows.Добавить()
    row.ИмяКаталога = catalog
    row.Развернуть = true
    control.val.ТекущаяСтрока = row
}

function КаталогиОбщиеПередНачаломДобавления(control, cancel, copy) {
    addSettingsCatalog(control, cancel, copy)
}

function КаталогиБазыПередНачаломДобавления(control, cancel, copy) {
    addSettingsCatalog(control, cancel, copy)
}

function КаталогиОбщиеИмяКаталогаНачалоВыбора(control, standardProcessing) {
    standardProcessing.val = false
    var catalog;
    catalog=chooseCatalog()
    if(catalog=="") return
    control.val.Значение=catalog
}

function КаталогиБазыИмяКаталогаНачалоВыбора(control, standardProcessing) {
    standardProcessing.val = false
    var catalog;
    catalog=chooseCatalog()
    if(catalog=="") return
    control.val.Значение=catalog
}

function НадписьCmdExeНажатие (control) {
    settingsForm.КомандаЗапускаКонсоли = control.val.Заголовок;
}

function НадписьFarExeНажатие (control) {
    settingsForm.КомандаЗапускаКонсоли = control.val.Заголовок;
}

function ИспользоватьВерсионированиеПриИзменении(control) {
    settingsForm.ЭлементыФормы.ПанельНастроекВерсионныйКонтроль.Видимость = settingsForm.ИспользоватьВерсионирование;
}

////
////} ФормаНастройки - обработчики событий.
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
////{ Инициализация скрипта
////

// Зададим путь в профайле
var pflExtFilesOpenOnStart  = "ExtFiles/OpenOnStart"
var pflExtShowExtInName     = "ExtFiles/ShowExtInName"
var pflExtFilesPath         = "ExtFiles/Path"
var pflExtFilesPathBase     = "ExtFiles/PathBase"
var pflExtOpen1CExtensions  = "ExtFiles/Open1CExtensions"
var pflExtRunConsoleCommand = "ExtFiles/RunConsoleCommand"
var pflExtViewSearchInList  = "ExtFiles/ViewSearchInList"
var pflVersionControl       = "ExtFiles/VersionControl"
var pfColorModiefed         = "ExtFiles/ColorModiefed"
var pfColorDeleted          = "ExtFiles/ColorDeleted"
var pfColorNotVersioned     = "ExtFiles/ColorNotVersioned"


// Восстановим настройки
profileRoot.createValue(pflExtFilesOpenOnStart, false, pflSnegopat)
profileRoot.createValue(pflExtShowExtInName, true, pflSnegopat)
profileRoot.createValue(pflExtFilesPath, false, pflSnegopat)
profileRoot.createValue(pflExtFilesPathBase, false, pflBase)
profileRoot.createValue(pflExtOpen1CExtensions, defaultExtensionsTable(), pflSnegopat)
profileRoot.createValue(pflExtRunConsoleCommand, 'cmd.exe /K cd /D "%1"', pflSnegopat)
profileRoot.createValue(pflExtViewSearchInList, false, pflSnegopat)
profileRoot.createValue(pflVersionControl, false, pflSnegopat)
profileRoot.createValue(pfColorModiefed, false, pflSnegopat)
profileRoot.createValue(pfColorDeleted, false, pflSnegopat)
profileRoot.createValue(pfColorNotVersioned, false, pflSnegopat)



var openOnStart = profileRoot.getValue(pflExtFilesOpenOnStart)
var showExtInName = profileRoot.getValue(pflExtShowExtInName)
var commonCatalogs = profileRoot.getValue(pflExtFilesPath)
var baseCatalogs = profileRoot.getValue(pflExtFilesPathBase)
var openableExtensions = profileRoot.getValue(pflExtOpen1CExtensions);
var consoleCommand = profileRoot.getValue(pflExtRunConsoleCommand);
var searchAsList = profileRoot.getValue(pflExtViewSearchInList)
var useVersioning = profileRoot.getValue(pflVersionControl)
var colorEdited = profileRoot.getValue(pfColorModiefed)
var colorNotVersioned = profileRoot.getValue(pfColorNotVersioned)
var colorDeleted = profileRoot.getValue(pfColorDeleted)

var RE_EXTENSIONS = null;

var fileTypePictures = {};

var DvcsBackends = {};
var DiffBackends = {}; 
var dvcsByCatalog = {};

var compareQueue = [];

var Path1 = null
var Path2 = null

var mainFolder = stdlib.getSnegopatMainFolder();

global.connectGlobals(SelfScript)

if (!colorEdited)  colorEdited = v8New("Цвет", 255, 255, 0);
if (!colorDeleted)  colorDeleted = v8New("Цвет", 255, 0, 0);
if (!colorNotVersioned)  colorNotVersioned = v8New("Цвет", 192, 192, 192);

// Карта «статус → цвет фона»; пересобирается при сохранении настроек (раньше собиралась один раз при загрузке — новые цвета требовали перезапуска)
var statusColors = {}
// Цвет фона для статуса версионного контроля (undefined, если для статуса цвета нет)
function statusColor(status) {
    return statusColors[status]
}
function rebuildStatusColors() {
    statusColors = {"DELETED":colorDeleted, "NOTVERSIONED":colorNotVersioned, "EDITED":colorEdited}
    return statusColors
}
rebuildStatusColors()

commonCatalogs = initCatalogsTable(commonCatalogs)
baseCatalogs = initCatalogsTable(baseCatalogs)

scriptForm=null
settingsForm=null

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

if(openOnStart==true)
    openAfterStart(macrosОткрытьОкноВнешнихФайлов)

////} Инициализация скрипта


