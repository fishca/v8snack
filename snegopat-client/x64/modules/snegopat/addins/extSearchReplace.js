//engine: JScript
//uname: ExtendedSearch
//dname: Расширенный поиск и замена
//descr: Реализация удобного и мощного поиска и замены по модулям.
//author: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
//www: https://snegopat.ru/scripts/wiki?name=extSearch.js
//help: inplace
//addin: global
//addin: stdcommands
//addin: stdlib
//addin: hotkeys hks

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Расширенный поиск и замена" (extSearchReplace.js) для проекта "Снегопат"
////
//// Описание: Реализует поиск текста при помощи регулярных выражений в активном окне редактора и замену найденного при необходимости.
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
//// Модификатор: Павлюков Семён <pavlyukoff@gmail.com>, https://t.me/pavlyukoff
////}
////////////////////////////////////////////////////////////////////////////////////////

/*@
Скрипт организует удобный поиск как по текущему модулю, так и глобальный поиск по конфигурации.
Глобальный поиск выполняется порциями. Закрытие окна результатов останавливает поиск.

Поддерживается поиск с помощью регулярных выражений.
Интегрирован со скриптом "Редактор регулярных выражений".

Добавлена поддержка поиска с делением по Клиент\Сервер.
Реализована настройка количества потоков фонового поиска.
Добавлен поиск при забытой смене языка (английского).
Добавлен режим замены.

@*/

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('ScriptForm.js', SelfScript);
global.connectGlobals(SelfScript);

function getPredefinedHotkeys(predef){
	predef.setVersion(1);
	predef.add("Найти текст в текущем модуле (с диалогом)", "Alt + F");
	predef.add("Глобальный поиск (с диалогом)", "Ctrl + Alt + F");
	predef.add("Отменить глобальный поиск", "Ctrl + Shift + BkSpace");
}

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНайти текст'] = function() {

	var w = GetTextWindow();
	if (!w) return false;

	var es = GetExtSearch();

	var selText = w.GetSelectedText();
	if (selText == '')
		selText = w.GetWordUnderCursor();

	es.setSimpleQuery(selText);
	es.show();

	if (selText == '')
	{
		es.clearSearchResults();
		es.setDefaultSearchQuery();
	}
	else
		es.searchActiveDoc(true);

	return true;
}

SelfScript.self['macrosНайти во всех открытых документах'] = function() {

	var w = GetTextWindow();
	if (!w) return false;

	var es = GetExtSearch();

	var selText = w.GetSelectedText();
	if (selText == '')
		selText = w.GetWordUnderCursor();

	es.setSimpleQuery(selText);
	es.show();

	if (selText == '')
	{
		es.clearSearchResults();
		es.setDefaultSearchQuery();
	}
	else
		es.searchOpenedWindows(true);

	return true;
}

SelfScript.self['macrosГлобальный поиск'] = function() {

	var es = GetExtSearchGlobal();

	var w = GetTextWindow();
	if (!w) {
		var selText = '';
	} else {
		var selText = w.GetSelectedText();
		if (selText == '')
			selText = w.GetWordUnderCursor();
	}

	es.isGlobalFind = true;
	es.activeView = windows.getActiveView();
	es.isInCurrentMdConteinerFind = false;
	es.setSimpleQuery(selText);
	es.show();

	if (selText == '')
	{
		es.clearSearchResults();
		es.setDefaultSearchQuery();
	}
	else
		es.searchInMetadata(true);

	return true;
}

SelfScript.self['macrosГлобальный поиск по текущему контейнеру'] = function() {
	//Текущий контейнер метаданных определяем по активному окну.
	//будет открыта внешняя обработка, занчит ищем глобально только по этой обработке.
	//открыт cf файл или же cf базы данных и мы находимся в текстовом модуле определенной
	//конфигурации, значит искать будет по текущей контейнеру.


	var es = GetExtSearchGlobal();


	var w = GetTextWindow();
	if (!w) {
		var selText = '';
	} else {
		var selText = w.GetSelectedText();
		if (selText == '')
			selText = w.GetWordUnderCursor();
	}


	es.isGlobalFind = true;
	es.activeView = windows.getActiveView();
	es.isInCurrentMdConteinerFind = true;
	es.setSimpleQuery(selText);
	es.show();

	if (selText == '')
	{
		es.clearSearchResults();
		es.setDefaultSearchQuery();
	}
	else
		es.searchInMetadata(true);

	return true;
}

SelfScript.self['macrosГл поиск фильтр по метаданным'] = function() {

	var es = GetExtSearchGlobal();
	if (es.isGlobalFind){
		md = stdlib.require(env.pathes.addins + 'mdNavigator.js');
		if (es.filterByUUID){
			es.filterByUUID = null;
		}
		es.filterByUUID = md.SelectMdUUID();
	}
	es.show();

	return true;
}

SelfScript.self['macrosОтменить глобальный поиск'] = function() {
	var es = GetExtSearchGlobal();
	if (es.startGlobalSearch){
		es.finishSearch(true);
	}
}

//// МАКРОСЫ С ПРЕДВАРИТЕЛЬНЫМ ОТКРЫТИЕМ ДИАЛОГА ДЛЯ НАСТРОЙКИ ПАРАМЕТРОВ ПОИСКА

SelfScript.self['macrosНайти текст в текущем модуле (с диалогом)'] = function() {
	openSearchDialog(SearchAreas.ActiveWindow);
	return true;
}

SelfScript.self['macrosНайти текст в открытых окнах (с диалогом)'] = function() {
	openSearchDialog(SearchAreas.AllOpenedWindows);
	return true;
}

SelfScript.self['macrosГлобальный поиск (с диалогом)'] = function() {
	openSearchDialog(SearchAreas.Global);
	return true;
}

//// МАКРОСЫ ДЛЯ УПРАВЛЕНИЯ ОКНОМ РЕЗУЛЬТАТОВ ПОИСКА

SelfScript.self['macrosОткрыть окно поиска'] = function() {
	GetExtSearch().show();
}

SelfScript.self['macrosОткрыть окно глобального поиска'] = function() {
	GetExtSearchGlobal().show();
}

SelfScript.self['macrosЗакрыть окно поиска'] = function() {
	var es = GetExtSearch();
	if (es.isOpen()) {
		es.close();
		return true;
	}
	es = GetExtSearchGlobal();
	if (es.isOpen()) {
		es.close();
		return true;
	}
	return false;
}

SelfScript.self['macrosПерейти к следующему совпадению'] = function() {
	var es = GetExtSearch();
	es.show();
	es.moveRowCursor(true);
}

SelfScript.self['macrosПерейти к предыдущему совпадению'] = function() {
	var es = GetExtSearch();
	es.show();
	es.moveRowCursor(false);
}

SelfScript.self['macrosСвернуть группировки'] = function() {
	var es = GetExtSearch();
	es.expandTree(true);
}

SelfScript.self['macrosРазвернуть группировки'] = function() {
	var es = GetExtSearch();
	es.expandTree(false);
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
	return 'Открыть окно поиска';
}

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ ExtSearch - Расширенный поиск и замена в тексте модуля.
////

var RowTypes = {
	'SearchResult'	: 0, // Строка результата поиска.
	'ProcGroup'		: 1, // Строка группы-процедуры (в режиме группировки по процедурам и функциям).
	'FuncGroup'		: 2, // Строка группы-функции (в режиме группировки по процедурам и функциям).
	'SearchDoc'		: 3  // Строка документа, в котором производится поиск.
}

var RE = {
	METHOD_START	: /^\s*((?:procedure)|(?:function)|(?:процедура)|(?:функция))\s+([\wА-яёЁ\d]+)\s*\(/i,
	METHOD_END		: /((?:EndProcedure)|(?:EndFunction)|(?:КонецПроцедуры)|(?:КонецФункции))/i
}

var ProcessAreas = {
	PROCESS_DIRECTIVE			: /^\s*&/i,
	PROCESS_ATCLIENT			: /^\s*(&AtClient|&НаКлиенте)\s*$/i,
	PROCESS_ATSERVER			: /^\s*(&AtServer|&НаСервере)\s*$/i,
	PROCESS_ATSERVERNC			: /^\s*(&AtServerNoContext|&НаСервереБезКонтекста)\s*$/i,
	PROCESS_ATCLIENTATSERVER	: /^\s*(&AtClientAtServer|&НаКлиентеНаСервере)\s*$/i,
	PROCESS_ATCLIENTATSERVERNC	: /^\s*(&AtClientAtServerNoContext|&НаКлиентеНаСервереБезКонтекста)\s*$/i,
	PROCESS_OTHER				: /^\s*(&Перед|&После|&Вместо|&ИзмениениеИКонтроль)\s*$/i
}

var ProcessAreaValues = {
	'AnyWhere'		: 0, // Везде
	'AtClient'		: 1, // НаКлиенте
	'AtServer'		: 2, // НаСервере
	'AtServerNC'	: 3  // НаСервереБезКонекста
}

var SearchAreas = {
	'ActiveWindow'		: 0, // В текущем модуле
	'AllOpenedWindows'	: 1, // Во всех открытых окнах
	'Global'			: 2, // Глобально (во всех модулях основной конфигурации)
	'CurrentContainer'	: 3  // В текущем открытом контейнере (внешней обработке, конфигурации ИБ и т.п.)
};

//[+] СофтЛаб:Brad  (19.02.2015)
function getCurrentTask() {

	var pflCurTask = 'Задачи/ТекущаяЗадача';

	var s = v8New("Структура","Задача,Описание","","");
	profileRoot.createValue(pflCurTask, s, pflSnegopat)
	s = profileRoot.getValue(pflCurTask);

	return s.Задача;
}
// СофтЛаб:Brad  (19.02.2015)

// TODO: доделать определение текущего метаданного
function getCurrentMdName() {
	//не искать те, у кого родитель = корень
	return "";
}

/* Осуществляет поиск с предварительным открытием диалогового окна. */
function openSearchDialog(initSearchArea) {

	if (!initSearchArea)
		initSearchArea = SearchAreas.ActiveWindow;

	var w = GetTextWindow();
	// Артур
	//if (!w) return false;
	//
	// var selText = w.GetSelectedText();
	var selText = '';
	if(w) {
		selText = w.GetSelectedText();
		if (selText == '')
			selText = w.GetWordUnderCursor();
	}

	// поиск по текущему элементу в дереве конфигурации
	if (selText == '')
		selText = getCurrentMdName();

	//[+] СофтЛаб:Brad  (19.02.2015)
	if (selText == '')
		selText = getCurrentTask();
	// СофтЛаб:Brad  (19.02.2015)

	var sDlg = new ExtSearchDialog(selText, initSearchArea);

	if (sDlg.show(true) == true)
	{
		var searchQuery = sDlg.getSearchQueryParams();

		if (searchQuery.Query == '')
		{
			var es = GetExtSearch();
			es.clearSearchResults();
			es.setDefaultSearchQuery();
		}
		else
		{
			switch(sDlg.getSearchArea())
			{
			case SearchAreas.AllOpenedWindows:
				var es = GetExtSearch();
				es.setQuery(searchQuery);
				es.show();
				es.searchOpenedWindows(true);
				break;

			case SearchAreas.CurrentContainer:
				var es = GetExtSearchGlobal();
				es.isGlobalFind = true;
				es.activeView = windows.getActiveView();
				es.isInCurrentMdConteinerFind = true;
				es.setQuery(searchQuery);
				es.show();
				es.searchInMetadata(true);
				break;

			case SearchAreas.Global:
				var es = GetExtSearchGlobal();
				es.isGlobalFind = true;
				es.activeView = windows.getActiveView();
				es.isInCurrentMdConteinerFind = false;
				es.setQuery(searchQuery);
				es.show();
				es.searchInMetadata(true);
				break;

			case SearchAreas.ActiveWindow:
			default:
				var es = GetExtSearch();
				es.setQuery(searchQuery);
				es.show();
				es.searchActiveDoc(true);
				break;
			}
		}
	}
}

/* Реализует диалог настройки параметров поиска.*/
ExtSearchDialog = ScriptForm.extend({

	settingsRootPath : SelfScript.uniqueName,

	reEditorPresent : false,

	settings : {
		pflSnegopat : {
			'IsRegExp'			: false, // Поиск регулярными выражениями.
			'CaseSensetive'		: false, // Учитывать регистр при поиске.
			'WholeWords'		: false, // Поиск слова целиком.
			'SearchHistory'		: v8New('ValueList'), // История поиска.
			'HistoryDepth'		: 15, // Количество элементов истории поиска.
			'ProcessArea'		: 0, // Область поиска (0 - везде).
			'threadCount'		: 25, // К-во потоков : не стал менять логику автора по к-ву по-умолчанию
			'TreeView'			: false, // Группировать результаты поиска по методам.
			'ShowReplace'		: false,  // Показывать замену
			'IsVertical'		: false, //показывать ли вертикально
			'mdFilterHistory'	: v8New('ValueList'), // История отбора по именам.
			'mdFilter'			: '', // Фильтр метаданных при поиске
			'mdFilterUse'		: false //Использовать ли фильтр
		}
	},

	construct : function (query, initSearchArea) {
		this._super(SelfScript, 'ФормаПоиска');

		this.form.КлючСохраненияПоложенияОкна = "extSearchReplace.dialog.js"
		this.loadSettings();
		this.form.Query = query;
		this.form.HistoryDepth = (this.form.HistoryDepth==0)?15:this.form.HistoryDepth;//защита от сбоя
		this.form.SearchArea = initSearchArea;
		this.form.threadCount = this.settings.pflSnegopat.current.threadCount;
	},

	getSearchQueryParams: function () {
		var params = v8New('Structure');
		params.Insert('Query',			this.form.Query);
		params.Insert('WholeWords',		this.form.WholeWords);
		params.Insert('CaseSensetive',	this.form.CaseSensetive);
		params.Insert('IsRegExp',		this.form.IsRegExp);
		params.Insert('ProcessArea',	this.form.ProcessArea);
		params.Insert('mdFilter',		this.form.mdFilter);
		params.Insert('mdFilterUse',	this.form.mdFilterUse);
		params.Insert('threadCount',	this.form.threadCount);
		params.Insert('IsVertical',		this.form.IsVertical);
		params.Insert('ShowReplace',	this.form.ShowReplace);
		params.Insert('HistoryDepth',	this.form.HistoryDepth);
		return params;
	},

	getSearchArea: function () {
		return this.form.SearchArea;
	},

	getRegExpEditorScriptPath : function () {
		var scriptPath = env.pathes.addins + "RegExpEditor.js";
		var f = v8New('File', scriptPath);
		if (f.Exist())
			return scriptPath;
		return '';
	},

	//почему бы и в основном окне регулярки не использовать
	Form_OnOpen : function () {
		this.reEditorPresent = (this.getRegExpEditorScriptPath() != '');
		this.form.Controls.Query.ChoiceButton = (this.form.IsRegExp ? this.reEditorPresent : false);
		this.SearchArea0_OnChange(null);
	},

	Form_OnClose : function () {
		this.saveSettings();
		saveProfile();
	},

	SearchArea0_OnChange : function (Элемент) {
		this.form.Controls.mdFilter.Enabled 	= (this.form.SearchArea == 2);
		this.form.Controls.mdFilterUse.Enabled 	= (this.form.SearchArea == 2);
	},
	
	mdFilter_OnChange : function (control) {
		this.form.mdFilterUse = !(this.form.mdFilter.length === 0 || /^\s*$/.test(this.form.mdFilter));
	},
	
	Query_StartListChoice : function (control, defaultHandler) {
		control.val.ChoiceList = this.form.SearchHistory;
	},

	ReplaceStr_StartListChoice : function (control, defaultHandler) {
		control.val.ChoiceList = this.form.ReplaceHistory;
	},

	mdFilter_StartListChoice : function (control, defaultHandler) {
		control.val.ChoiceList = this.form.mdFilterHistory;
	},

	//открыть форму RegExp
	Query_StartChoice : function (Control, DefaultHandler) {
		var reEditorPath = this.getRegExpEditorScriptPath();
		if (reEditorPath)
		{
			DefaultHandler.val = false;
			reEditorAddin = stdlib.require(reEditorPath);
			if (reEditorAddin)
			{
				var reEditor = reEditorAddin.CreateRegExpEditor();
				reEditor.open(Control.val);
			}
		}
	},

	btFind_Click: function (btn) {
		this.close(true);
	},

	btCancel_Click: function (btn) {
		this.close(false);
	},

	IsRegExp_OnChange : function(Элемент) {
		if (this.form.IsRegExp)
			this.form.WholeWords = false;
		this.form.Controls.Query.ChoiceButton = (this.form.IsRegExp ? this.reEditorPresent : false);
	},

	WholeWords_OnChange : function(Элемент) {
		if (this.form.WholeWords)
			this.form.IsRegExp = false;
		this.form.Controls.Query.ChoiceButton = (this.form.IsRegExp ? this.reEditorPresent : false);
	}
}); // end of ExtSearchDialog

ExtSearch = ScriptForm.extend({

	settingsRootPath : SelfScript.uniqueName,

	reEditorPresent : false,
	lastVertical : undefined,

	settings : {
		pflSnegopat : {
			'IsRegExp'			: false, // Поиск регулярными выражениями.
			'CaseSensetive'		: false, // Учитывать регистр при поиске.
			'WholeWords'		: false, // Поиск слова целиком.
			'SearchHistory'		: v8New('ValueList'), // История поиска.
			'ReplaceHistory'	: v8New('ValueList'), // История замены.
			'HistoryDepth'		: 15, // Количество элементов истории поиска.
			'ProcessArea'		: 0, // Область поиска (0 - везде).
			'threadCount'		: 25, // к-во потоков
			'TreeView'			: false, // Группировать результаты поиска по методам.
			'ShowReplace'		: false,  // Показывать замену
			'IsVertical'		: false, //показывать ли вертикально
			'mdFilterHistory'	: v8New('ValueList'), // История отбора по именам.
			'mdFilter'			: '', // Фильтр метаданных при поиске
			'mdFilterUse'		: false //Использовать ли фильтр
		}
	},

	construct : function (isExtend) {

		if (isExtend == undefined) isExtend = false;

		//debugger
		if (this.IsVertical == undefined) {
			this.loadSettings();
			this.IsVertical = this.settings.pflSnegopat.current.IsVertical;
		}

		if (this.IsVertical == true) {
			this.lastVertical  = true;
			this._super(SelfScript, 'ФормаРезультатовВерт');
			this.form.КлючСохраненияПоложенияОкна = "extSearchReplaceVert.js"
		} else if (this.IsVertical == false) {
			this.lastVertical  = false;
			this._super(SelfScript, 'ФормаРезультатов');
			this.form.КлючСохраненияПоложенияОкна = "extSearchReplace.js"
		}

		this.form.HistoryDepth = (this.form.HistoryDepth==0)?15:this.form.HistoryDepth;//защита от сбоя
		this.results = this.form.Controls.SearchResults.Value;
		this.results.Columns.Add('_method');
		this.results.Columns.Add('groupsCache');
		this.results.Columns.Add('_object');
		this.results.Columns.Add('_match');
		this.results.Columns.Add('_matchNum');
		this.results.Columns.Add('SortMetadata');

		this.watcher = new TextWindowsWatcher();
		this.watcher.startWatch();

		this.loadSettings();
		
		this.targetWindow = null;

		this.Icons = {
			'Func': this.form.Controls.PicFunc.Picture,
			'Proc': this.form.Controls.PicProc.Picture
		}

		this.SearchDocRowFont = v8New('Font', undefined, undefined, true);
		this.isGlobalFind = false;

		this.SetControlsVisible();
		if (!isExtend) ExtSearch._instance = this;

	},

	setSimpleQuery : function (query) {
		this.form.Query = query;
		this.form.IsRegExp = false;
		this.form.CaseSensetive = false;
		this.addToHistory(query);
	},

	setQuery : function (searchQueryParams) {
		if (this.lastVertical != searchQueryParams.IsVertical) {
			this.lastVertical = searchQueryParams.IsVertical;
			if (this.form.IsOpen())
				this.form.Close();

			// никак не хочет переназначать кнопки в CmdBar -  шо делать ?
			//this.form = null;
			//this.handlers = {};
			
			if (searchQueryParams.IsVertical) {
				this.loadForm(SelfScript.fullPath, 'ФормаРезультатовВерт');
				this.form.КлючСохраненияПоложенияОкна = "extSearchReplaceVert.js"
			} else {
				this.loadForm(SelfScript.fullPath, 'ФормаРезультатов');
				this.form.КлючСохраненияПоложенияОкна = "extSearchReplace.js"
			}
			
			this.results = this.form.Controls.SearchResults.Value;
			this.results.Columns.Add('_method');
			this.results.Columns.Add('groupsCache');
			this.results.Columns.Add('_object');
			this.results.Columns.Add('_match');
			this.results.Columns.Add('_matchNum');
			this.results.Columns.Add('SortMetadata');
			this.SetControlsVisible();
		}

		this.form.Query 		= searchQueryParams.Query;
		this.form.IsRegExp 		= searchQueryParams.IsRegExp;
		this.form.CaseSensetive = searchQueryParams.CaseSensetive;
		this.form.WholeWords	= searchQueryParams.WholeWords;
		this.form.ProcessArea	= searchQueryParams.ProcessArea;
		this.form.mdFilter		= searchQueryParams.mdFilter;
		this.form.mdFilterUse	= searchQueryParams.mdFilterUse;
		this.form.threadCount	= searchQueryParams.threadCount;
		this.form.IsVertical	= searchQueryParams.IsVertical;
		this.form.ShowReplace	= searchQueryParams.ShowReplace;
		this.form.HistoryDepth	= searchQueryParams.HistoryDepth;
		this.addToHistory(this.form.Query);
		this.addTomdFilterHistory(this.form.mdFilter);
	},

	expandTree : function (collapse) {
		var tree = this.form.Controls.SearchResults;
		for (var i=0; i < this.results.Rows.Count(); i++)
		{
			var docRow = this.results.Rows.Get(i);
			if (this.form.TreeView)
			{
				for (var j=0; j < docRow.Rows.Count(); j++)
				{
					var row = docRow.Rows.Get(j);
					collapse ? tree.Collapse(row) : tree.Expand(row, true);
				}
			}
			else
			{
				collapse ? tree.Collapse(docRow) : tree.Expand(docRow, true);
			}
		}
	},

	getTextObject : function (obj, title) {
		
        if (obj && toV8Value(obj).typeName(0) == 'TextDocument')
			return new TextDocObject(obj, title);

		if (obj) Message('Неподдерживаемый тип объекта для поиска: ' + toV8Value(obj).typeName(0));

		return null;
	},

	getWindowObject : function (view) {
		try {
			if (!view || !view.isAlive())
				return null;
		} catch(e){}
       
        if (view.mdProp && view.mdObj)
			return new MdObject(view.mdObj, view.mdProp, view.title);

		var obj = view.getObject();
		if (obj && toV8Value(obj).typeName(0) == 'TextDocument')
			return new TextDocObject(obj, view.title);

		if (obj) Message('Неподдерживаемый тип объекта для поиска: ' + toV8Value(obj).typeName(0));

		return null;
	},

	searchOpenedWindows: function (fromHotKey) {

		var activeWindow = this.watcher.getActiveTextWindow();
		if (!activeWindow) return;

		var activeView = activeWindow.GetView();
		if (!activeView) return;

		this.clearSearchResults();

		this.re = this.buildSearchRegExpObject();
		if (!this.re) return;

		var activeWndResRow = null;

		var es = this;
		(function (views) {
			for(var i = 0; i < views.count; i++)
			{
				var v = views.item(i);
				if(v.isContainer != vctNo)
				{
					// Если окно - контейнер, то обходим рекурсивно его потомков.
					arguments.callee(v.enumChilds());
					continue;
				}

				var obj = es.getWindowObject(v);
				if (!obj) continue;

				var docRow = es.search(obj, es.re);
				if (v == activeView)
					activeWndResRow = docRow;
			}
		})(windows.mdiView.enumChilds());

		this.showSearchResult(activeWndResRow, fromHotKey);
	},

	searchActiveDoc : function (fromHotKey) {

		this.clearSearchResults();

		var activeWindow = this.watcher.getActiveTextWindow();
		if (!activeWindow) return;

		this.re = this.buildSearchRegExpObject();
		if (!this.re) return;

		var aView = activeWindow.GetView();
		var obj = this.getWindowObject(aView);
		if (!obj) {
			obj = this.getTextObject(activeWindow.textWindow.textDocument, aView.title);
			if (!obj)
			return;
		}

		var docRow = this.search(obj, this.re);

		this.showSearchResult(docRow, fromHotKey);
	},

	makeTranslit : function (str) {
		var Chars = {
			'Q': 'Й', 'q': 'й', 'W': 'Ц', 'w': 'ц', 'E': 'У', 'e': 'у', 'R': 'К', 'r': 'к', 'T': 'Е', 't': 'е', 'Y': 'Н', 'y': 'н', 'U': 'Г', 'u': 'г', 'I': 'Ш', 'i': 'ш', 'O': 'Щ', 'o': 'щ', 'P': 'З', 'p': 'з', '{': 'Х', '\\[': 'х', '}': 'Ъ', '\\]': 'ъ', 'A': 'Ф', 'a': 'ф', 'S': 'Ы', 's': 'ы', 'D': 'В', 'd': 'в', 'F': 'А', 'f': 'а', 'G': 'П', 'g': 'п', 'H': 'Р', 'h': 'р', 'J': 'О', 'j': 'о', 'K': 'Л', 'k': 'л', 'L': 'Д', 'l': 'д', ':': 'Ж', ';': 'ж', '"': 'Э', '\'': 'э', 'Z': 'Я', 'z': 'я', 'X': 'Ч', 'x': 'ч', 'C': 'С', 'c': 'с', 'V': 'М', 'v': 'м', 'B': 'И', 'b': 'и', 'N': 'Т', 'n': 'т', 'M': 'Ь', 'm': 'ь', '<': 'Б', ',': 'б', '>': 'Ю', '\\.': 'ю'
		}
		for (var i in Chars) { str = str.replace(new RegExp(i, 'g'), Chars[i]); }
		return str;
	},

	buildSearchRegExpObject : function () {

		var pattern = this.form.Query;
		var reFlags = '';

		if (!this.form.IsRegExp)
		{
			//добавить транслитерацию как вариант
			translitPattern = this.makeTranslit(pattern);

			pattern = StringUtils.addSlashes(pattern);

			translitPattern = StringUtils.addSlashes(translitPattern);
			if (pattern !=  translitPattern)
				pattern = pattern + "|" + translitPattern;

			if (this.form.WholeWords)
				pattern = "([^\\w\\dА-яЁё]|^)(?:" + pattern + ")([^\\w\\dА-яЁё]|$)";
			reFlags += 'g';//иначе при простом поиске находит только первое
		}
		else
		{
			if(pattern.replace("\\\\", "").search(/\\r|\\n/) != -1)
				reFlags = 'gm';
		}
		if(!this.form.CaseSensetive)
			reFlags += 'i';

		var re = null;

		try
		{
			re = new RegExp(pattern, reFlags);
		}
		catch (e)
		{
			DoMessageBox("В регулярном выражении допущена ошибка: \n" + e.message);
			return null;
		}

		return re;
	},

	//функция определения подходящей области
	isLineSuitable : function (line, curArea, curProps, isSuitableArea) {

		currProcessArea = this.form.ProcessArea;
		rez = {
				'isSuitableArea'	: isSuitableArea,
				'curArea'			: curArea
		}

		var matches = line.match(ProcessAreas.PROCESS_DIRECTIVE);
		if (matches && matches.length)
		{
			var matches = line.match(ProcessAreas.PROCESS_OTHER);
			if (matches && matches.length)
			{
				return rez;
			}
			if (curProps.FormMan) {
				if (this.form.ProcessArea == ProcessAreaValues.AtServerNC) {
					var matches = line.match(ProcessAreas.PROCESS_ATSERVERNC);
					if (matches && matches.length)
					{
						rez.isSuitableArea = (this.form.ProcessArea == ProcessAreaValues.AtServerNC);
						if (rez.isSuitableArea) rez.curArea = "НаСервереБезКонтекста";
						return rez;
					}
					var matches = line.match(ProcessAreas.PROCESS_ATCLIENTATSERVERNC);
					if (matches && matches.length)
					{
						rez.isSuitableArea = (this.form.ProcessArea == ProcessAreaValues.AtServerNC);
						if (rez.isSuitableArea) rez.curArea = "НаКлиентеНаСервереБезКонтекста";
						return rez;
					}
				}
			}
			if (curProps.FormMan || (curProps.Client && curProps.Server)) {
				var matches = line.match(ProcessAreas.PROCESS_ATSERVER);
				if (matches && matches.length)
				{
					rez.isSuitableArea = (this.form.ProcessArea == ProcessAreaValues.AtServer);
					if (rez.isSuitableArea) rez.curArea = "НаСервере";
					return rez;
				}
				var matches = line.match(ProcessAreas.PROCESS_ATCLIENT);
				if (matches && matches.length)
				{
					rez.isSuitableArea = (this.form.ProcessArea == ProcessAreaValues.AtClient);
					if (rez.isSuitableArea) rez.curArea = "НаКлиенте";
					return rez;
				}
				var matches = line.match(ProcessAreas.PROCESS_ATCLIENTATSERVER);
				if (matches && matches.length)
				{
					rez.isSuitableArea = ((this.form.ProcessArea == ProcessAreaValues.AtClient)||(this.form.ProcessArea == ProcessAreaValues.AtServer));
					if (rez.isSuitableArea) rez.curArea = "НаКлиентеНаСервере";
					return rez;
				}
				rez.isSuitableArea = (curProps.Client && curProps.Server);//false;//(this.form.ProcessArea == ProcessAreaValues.AtServer);
				if (curProps.Client && curProps.Server)
					rez.curArea = "Клиент\Сервер";
			}
		}

		return rez;

	},
	
	defArea : function (Props) {
		if (Props.FormOrd || (Props.Client && !Props.Server))
			return "На клиенте"
		else if (Props.Client && Props.Server)
			return "Клиент\Сервер";
		return "На сервере";
	},

	search : function (obj, re) {

		var docRow = this.results.Rows.Add();
		docRow.FoundLine = obj.getTitle();
		docRow._object = obj;
		docRow.RowType = RowTypes.SearchDoc;
		if (!obj.sort) obj.sort = 999;
		var strSort = "0000000000"+(obj.sort + this.results.Rows.Count());
		strSort = strSort.substr(strSort.length-10);
		docRow.SortMetadata = strSort;

		docRow.groupsCache = v8New('Map');
		if(!re.multiline)
		{
			var curArea = "В общем";
			var curMethod = {
				'Name'	  : 'Раздел описания переменных',
				'IsProc'	: undefined,
				'StartLine' : 0,
				'Area'	  : curArea
			}

			//определение области и свойств модуля
			checkModule	= true;
			checkArea	= false;
			defSuit		= true;
			if (this.form.ProcessArea != ProcessAreaValues.AnyWhere) {
				var curProps = {
						'Client'	: ( (obj.obj.Property("ClientManagedApplication") == true) 
										|| (obj.obj.Property("ClientOrdinaryApplication") == true) ),
						'Server'	: (obj.obj.Property("Server") != false), // сервер когда или Истина или Неопределено
						'FormOrd'	: (obj.obj.Property("FormType") == Метаданные.СвойстваОбъектов.ТипФормы.Обычная),
						'FormMan'	: ( (obj.obj.Property("FormType") == Метаданные.СвойстваОбъектов.ТипФормы.Управляемая) 
										|| (obj.obj.Property("CommandModule") != undefined) )
				}
				if (curProps.FormOrd || curProps.FormMan) curProps.Server = false;
				curArea = this.defArea(curProps);
				curMethod.Area = curArea;
				
				switch (this.form.ProcessArea)
				{
				case ProcessAreaValues.AtServerNC:
					checkModule	= curProps.FormMan;
					checkArea	= curProps.FormMan;
					defSuit		= false;
					break;
				case ProcessAreaValues.AtServer:
					checkModule	= (curProps.FormMan || curProps.Server);
					checkArea	= (curProps.FormMan || (curProps.Client && curProps.Server));
					defSuit		= (curProps.FormMan || curProps.Server);
					break;
				case ProcessAreaValues.AtClient:
					checkModule	= (curProps.FormMan || curProps.FormOrd || curProps.Client);
					checkArea	= (curProps.FormMan || (curProps.Client && curProps.Server));
					defSuit		= (curProps.FormOrd || curProps.Client);
					break;
				default:
					break;
				}
			}

			if (checkModule)
			{
				isSuitableArea = defSuit;
				isInside = false;
				var lines = StringUtils.toLines(obj.getText());
				for(var lineIx=0; lineIx < lines.length; lineIx++)
				{
					var line = lines[lineIx];

					if (checkArea && !isInside) {
						resSuite = this.isLineSuitable(line, curArea, curProps, isSuitableArea);
						isSuitableArea = resSuite.isSuitableArea;
						curArea = resSuite.curArea;
					}

					// Проверим, не встретилось ли начало метода.
					var matches = line.match(RE.METHOD_START);
					if (matches && matches.length)
					{
						curMethod = {
							'Name'	  : matches[2],
							'IsProc'	: matches[1].toLowerCase() == 'процедура' || matches[1].toLowerCase() == 'procedure',
							'StartLine' : lineIx,
							'Area'	  : curArea
						};
						isInside = true;
					}

					matches = line.match(re);
					if (matches && matches.length && isSuitableArea) 
						this.addSearchResult(docRow, line, lineIx + 1, matches, curMethod);

					// Проверим, не встретился ли конец метода.
					matches = line.match(RE.METHOD_END);
					if (matches && matches.length)
					{
						curMethod = {
							'Name'	  : '<Текст вне процедур и функций>',
							'IsProc'	: undefined,
							'StartLine' : lineIx,
							'Area'	  : curArea
						};
						isSuitableArea = defSuit;//надо сбросить на по-умолчанию
						curArea = (curProps == undefined ? curArea : this.defArea(curProps));
						curMethod.Area = curArea;
						isInside = false;
					}
				}
			}
		}
		else
		{
			//debugger
			// Это многострочный поиск
			// Для начала надо вообще проверить, находится ли что-нибудь
			var text = obj.getText()
			var results = [], r
			while(r = re.exec(text)) {
				results.push(r);
				if (!r[0].length) re.lastIndex++;
			}
			if(results.length)  // Что-то нашли. Теперь надо получить номера строк для каждого вхождения
			{
				this.form.TreeView = false;
				var idx = 0, lineNum = 0, currentRes = results[idx], beginIdx = currentRes.index
				// Для исключение ситуации, когда текст найден в последней строке, не заканчивающейся переводом строки,
				// добавим к тексту перевод строки
				text += '\n';
				re = /.*\n/g
				while(r = re.exec(text))
				{
					lineNum++
					if(r.index <= beginIdx && r.lastIndex > beginIdx)
					{
						currentRes.index -= r.index
						currentRes.lastIndex -= r.index
						// Для отображения результата многострочного поиска преобразуем строку
						currentRes.realResult = currentRes[0]
						currentRes[0] = currentRes[0].replace(/^\s+/, '').replace(/\n\s*/g, ' \u00BB ').substr(0, 50) + '\n'
						this.addSearchResult(docRow, r[0], lineNum, results[idx]);
						idx++;
						if(idx == results.length)
							break;
						currentRes = results[idx]
						beginIdx = currentRes.index
					}
				}
			}
		}

		if (this.form.TreeView && docRow.Rows.Count() > 0)
		{
			var lastGroup = this.results.Rows.Get(this.results.Rows.Count() - 1);
			if (lastGroup.FoundLine == '<Текст вне процедур и функций>')
				lastGroup.FoundLine = "Раздел основной программы";
		}

		if (!docRow.Rows.Count())
		{
			this.results.Rows.Delete(docRow);
			docRow = null;
		}

		return docRow;
	},

	showResult: function(docRow, fromHotKey){
		this.results.Rows.Sort('SortMetadata, FoundLine', false);
		// Запомним строку поиска в истории.
		this.addToHistory(this.form.Query);
		this.addTomdFilterHistory(this.form.mdFilter);

		if (fromHotKey == true)
		{
			// Для того чтобы курсор не прыгал при поиске текущего слова,
			// тут бы еще добавить чтобы активизировалась именно текущая строка
			this.form.Open();
			this.form.CurrentControl=this.form.Controls.SearchResults;
			if (docRow)
			{
				var curLineRow = this.getRowForTheCurrentLine(docRow);
				if (curLineRow)
					this.form.Controls.SearchResults.CurrentRow = curLineRow;
			}
		}
		else if (docRow)
		{
			if (this.form.TreeView)
				this.goToLine(docRow.Rows.Get(0).Rows.Get(0));
			else
				this.goToLine(docRow.Rows.Get(0));
		}

	},

	showSearchResult: function (docRow, fromHotKey) {

		this.showResult(docRow, fromHotKey);
		this.expandTree();

		if (this.results.Rows.Count() == 0)
		{
			DoMessageBox('Совпадений не найдено!');
			return;
		}

		this.SetControlsVisible();
	},

	getRowForTheCurrentLine: function(docRow) {
		var twnd = docRow._object.activate();
		return docRow.Rows.Find(twnd.GetCaretPos().beginRow, "LineNo", true);
	},

	getGroupRow: function (docRow, methodData) {

		if (!this.form.TreeView || this.re.multiline)
			return docRow;

		var groupRow = docRow.groupsCache.Get(methodData);
		if (!groupRow)
		{
			groupRow = docRow.Rows.Add();
			groupRow.FoundLine = (!methodData.Name)?"":methodData.Name;
			groupRow.Method = (!methodData.Name)?"":methodData.Name;
			groupRow._object = docRow._object;

			if (methodData.IsProc !== undefined)
				groupRow.RowType = methodData.IsProc ? RowTypes.ProcGroup : RowTypes.FuncGroup;

			groupRow.lineNo = methodData.StartLine + 1;
			groupRow._method = methodData;
			groupRow.SortMetadata = methodData.SortMetadata;

			docRow.groupsCache.Insert(methodData, groupRow);
		}
		return groupRow;
	},

	addSearchResult : function (docRow, line, lineNo, matches, methodData) {

		var groupRow = this.getGroupRow(docRow, methodData);

		for (i = 0; i < matches.length; i++) {
			var resRow = groupRow.Rows.Add();
			resRow.FoundLine = line;
			resRow.lineNo = lineNo;
			resRow._object = docRow._object;
			if(undefined != methodData)
			{
				resRow.Method = methodData.Name;
				resRow.Area = methodData.Area;
			}

			resRow._method = methodData;
			resRow._match = matches;
			resRow._matchNum = matches.length - 1 - i;//с конца для замены по порядку

			if (this.form.WholeWords)
				resRow.ExactMatch = matches[i].replace(/^[^\w\dА-я]/, '').replace(/[^\w\dА-я]$/, '');
			else
				resRow.ExactMatch = matches[i];
		}
	},

	goToLine : function (row) {

		this.form.Controls.SearchResults.CurrentRow = row;

		// Откроем и/или активируем окно объекта, в котором выполнялся поиск.
		var targetWindow = row._object.activate();

		if (!targetWindow) {
			DoMessageBox("Не удалось открыть текстовое окно");
			return;
		}

		if (!targetWindow.IsActive())
		{
			DoMessageBox("Окно, для которого выполнялся поиск, было закрыто!\nОкно поиска с результатами стало не актуально и будет закрыто.");
			this.clearSearchResults();
			this.Close();
			return;
		}

		// Найдем позицию найденного слова в строке.
		var lineStart = row.LineNo, colStart, lineEnd = lineStart, colEnd
		if(row.ExactMatch.substr(row.ExactMatch.length - 1) == '\n')
		{
			// результат многострочного поиска
			var text = row._match.realResult
			colStart = row._match.index + 1
			colEnd = colStart
			for(var k = 0; k < text.length; k++)
			{
				if(text.charAt(k) == '\n')
				{
					lineEnd++
					colEnd = 1;
				}
				else
					colEnd++
			}
		}
		else
		{
			var searchPattern = this.form.WholeWords ? "(?:[^\\w\\dА-я]|^)" + StringUtils.addSlashes(row.ExactMatch) + "([^\\w\\dА-я]|$)" : StringUtils.addSlashes(row.ExactMatch);
			var re = new RegExp(searchPattern, 'g');

			//debugger
			colStart = 1;
			var curIndex = -1;
			while ( (matches = re.exec(row.FoundLine)))
			{
				curIndex++;
				if (curIndex != row._matchNum)
					continue;
				colStart = re.lastIndex - row.ExactMatch.length + 1;

				if (this.form.WholeWords && matches.length > 1)
					colStart -= matches[1].length;
			}
			colEnd = colStart + row.ExactMatch.length
		}

		// Установим выделение на найденное совпадение со строкой поиска.
		targetWindow.SetCaretPos(lineStart, colEnd);
		targetWindow.SetSelection(lineStart, colStart, lineEnd, colEnd);
	},

	moveRowCursor : function (forward) {

		if (!this.results.Rows.Count())
			return;

		var row = this.form.Controls.SearchResults.CurrentRow;

		if (!row)
		{
			row = this.results.Rows.Get(0).Get(0);
			if (this.form.TreeView)
				row = row.Rows.Get(0);

			this.goToLine(row);
			return;
		}

		if (forward)
		{
			if (row.RowType == RowTypes.SearchResult)
			{
				while (row)
				{
					var rows = row.Parent ? row.Parent.Rows : this.results.Rows;
					var index = rows.IndexOf(row);

					if (index < rows.Count() - 1)
					{
						row = rows.Get(index + 1);
						break;
					}

					if (!row.Parent)
						break;

					row = row.Parent;
				 }
			}

			while (row.Rows.Count() > 0)
				row = row.Rows.Get(0);
		}
		else
		{
			if (row.RowType == RowTypes.SearchResult)
			{
				while (row)
				{
					var rows = row.Parent ? row.Parent.Rows : this.results.Rows;
					var index = rows.IndexOf(row);

					if (index > 0)
					{
						row = rows.Get(index - 1);
						break;
					}

					if (!row.Parent)
						break;

					row = row.Parent;
				 }
			}

			while (row.Rows.Count() > 0)
				row = row.Rows.Get(row.Rows.Count() - 1);
		}

		this.goToLine(row);
	},

	clearSearchResults : function () {
		this.results.Rows.Clear();
	},

	setDefaultSearchQuery : function () {
		this.form.CurrentControl=this.form.Controls.Query;
	},

	addToHistory : function (query) {

		if (!query)
			return;

		// Добавляем в историю только если такой поисковой строки там нет.
		var history = this.form.SearchHistory;
		if (history.FindByValue(query))
			return;

		if (history.Count())
			history.Insert(0, query);
		else
			history.Add(query);

		// Не позволяем истории расти более заданной глубины.
		while (history.Count() > this.form.HistoryDepth)
			history.Delete(history.Count() - 1);
	},

	addToReplaceHistory : function (query) {
		if (!query) 
			return;

		// Добавляем в историю только если такой поисковой строки там нет.
		var history = this.form.ReplaceHistory;
		if (history.FindByValue(query))
			return;

		if (history.Count())
			history.Insert(0, query);
		else
			history.Add(query);

		// Не позволяем истории расти более заданной глубины.
		while (history.Count() > this.form.HistoryDepth)
			history.Delete(history.Count() - 1);
	},

	addTomdFilterHistory : function (query) {
		if (!query) 
			return;

		// Добавляем в историю только если такой поисковой строки там нет.
		var history = this.form.mdFilterHistory;
		if (history.FindByValue(query))
			return;

		if (history.Count())
			history.Insert(0, query);
		else
			history.Add(query);

		// Не позволяем истории расти более заданной глубины.
		while (history.Count() > this.form.HistoryDepth)
			history.Delete(history.Count() - 1);
	},

	getRegExpEditorScriptPath : function () {
		var scriptPath = env.pathes.addins + "RegExpEditor.js";
		var f = v8New('File', scriptPath);
		if (f.Exist())
			return scriptPath;
		return '';
	},

	Form_OnOpen : function () {
		this.reEditorPresent = (this.getRegExpEditorScriptPath() != '');
		this.form.Controls.Query.ChoiceButton = (this.form.IsRegExp ? this.reEditorPresent : false);
		this.form.Controls.CmdBar.Buttons.btShowReplace.Check = this.form.ShowReplace;
		this.form.Controls.CmdBar.Buttons.btShowReplace.СочетаниеКлавиш = stdlib.v8hotkey("H".charCodeAt(0), 16);

		this.SetControlsVisible();
	},

	Form_OnClose : function () {
		this.saveSettings();
		saveProfile();
	},

	CmdBar_BtPrev : function (control) {
		this.moveRowCursor(false);
	},

	CmdBar_BtNext : function (control) {
		this.moveRowCursor(true);
	},

	Query_OnChange : function (control) {
		if (this.form.Query != '')
				this.searchActiveDoc();
	},

	Query_StartListChoice : function (control, defaultHandler) {
		control.val.ChoiceList = this.form.SearchHistory;
	},

	ReplaceStr_StartListChoice : function (control, defaultHandler) {
		control.val.ChoiceList = this.form.ReplaceHistory;
	},

	mdFilter_StartListChoice : function (control, defaultHandler) {
		control.val.ChoiceList = this.form.mdFilterHistory;
	},
	
	BtSearch_Click : function (control) {

		if (this.form.Query == '')
		{
			DoMessageBox('Не задана строка поиска');
			return;
		}

		this.searchActiveDoc();
	},

	DoReplace : function(newStr) {
		// Откроем и/или активируем окно объекта, в котором выполнялся поиск.
		var targetWindow = this.form.Controls.SearchResults.CurrentRow._object.activate();
		try
		{
			if (targetWindow==undefined)
			{
				row._object.obj.editProperty(row._object.prop.id);
				row._object.obj.openModule(row._object.prop.id);
				targetWindow = GetTextWindow();
			}
		}
		catch (e){}

		if (targetWindow==undefined || !targetWindow.IsActive())
		{
			return;
		}

		var selText = targetWindow.GetSelectedText();
		if (selText != '')
		{
			targetWindow.SetSelectedText(newStr);
		}
	},

	moveRowCursor : function (forward) {

		if (!this.results.Rows.Count())
			return false;

		var toReturn = true;

		var row = this.form.Controls.SearchResults.CurrentRow;

		if (!row)
		{
			row = this.results.Rows.Get(0).Rows.Get(0);
			if (this.form.TreeView)
				row = row.Rows.Get(0);
				
			this.goToLine(row);    
			return true;
		}

		if (forward) 
		{
			if (row.RowType == RowTypes.SearchResult)
			{    
				while (row)
				{

					var rows = row.Parent ? row.Parent.Rows : this.results.Rows;
					var index = rows.IndexOf(row);
			
					if (index < rows.Count() - 1)
					{
						row = rows.Get(index + 1);
						break;
					}
					
					if (!row.Parent)
					{
						toReturn = false;
						break;
					}
					row = row.Parent;
				 }
			}

			if (!toReturn)
			{
				row = this.results.Rows.Get(0).Rows.Get(0);
				if (this.form.TreeView)
					row = row.Rows.Get(0);
			}
			else
				while (row.Rows.Count() > 0)
					row = row.Rows.Get(0);

		}
		else
		{
			if (row.RowType == RowTypes.SearchResult)
			{
				while (row) 
				{

					var rows = row.Parent ? row.Parent.Rows : this.results.Rows;
					var index = rows.IndexOf(row);

					if (index > 0)
					{
						row = rows.Get(index - 1);
						break;
					}

					if (!row.Parent)
					{
						toReturn = false;
						break;
					}

					row = row.Parent;
				 }
			}

			if (!toReturn)
			{
				var row1 = this.results.Rows.Get(this.results.Rows.Count()-1);
				var row = row1.Rows.Get(row1.Rows.Count()-1);
				if (this.form.TreeView)
					row = row.Rows.Get(row.Rows.Count()-1);
			}
			else
				while (row.Rows.Count() > 0)
					row = row.Rows.Get(row.Rows.Count() - 1);                        
		}

		this.goToLine(row);
		
		return toReturn;
	},

	resetRowCursor : function () {

		if (!this.results.Rows.Count())
			return false;

		var row = this.results.Rows.Get(0);

		while (row.Rows.Count() > 0)
			row = row.Rows.Get(0);

		this.goToLine(row);

		if (!row)
			return false;
		else
			return true;

	},

	BtReplace_Click : function (control) {

		if (this.form.Query == '')
		{
			DoMessageBox('Не задана строка поиска');
			return;
		}

		var newStr = this.form.ReplaceStr;

		var spChoice = v8New("СписокЗначений");
		spChoice.Add('Заменить');
		spChoice.Add('Пропустить');
		spChoice.Add('Заменить ВСЕ');
		spChoice.Add('ОТМЕНА');

		var askMore = true;
		var askRes = '';

		if (this.resetRowCursor())
		{
			askRes = Вопрос("Заменить текущее вхождение ?", spChoice)

			if ((askRes == 'Заменить') || (askRes == 'Заменить ВСЕ')) {
				if (askRes == 'Заменить ВСЕ')
					askMore = false;
				this.DoReplace(newStr);
			}
		}

		if (askRes != 'ОТМЕНА')
		while (this.moveRowCursor(true))
		{
			if (askMore) {
				askRes = Вопрос("Заменить текущее вхождение ?", spChoice);
				if (askRes == 'ОТМЕНА') {
					break;
				} else if (askRes == 'Пропустить') {
					continue;
				} else if (askRes == 'Заменить ВСЕ') {
					askMore = false;
				}
			}

			this.DoReplace(newStr);
		}

		//this.clearSearchResults();//нужно ли чистить результаты

		this.addToReplaceHistory(newStr);

		DoMessageBox('Замена окончена. Результаты поиска НЕ очищены исключительно для сверки.');

	},

	CmdBar_BtAbout : function (control) {
		RunApp('http://snegopat.ru/scripts/wiki?name=extSearch.js');
	},

	SearchResults_Selection : function (control, selectedRow, selectedCol, defaultHandler) {
		this.goToLine(selectedRow.val);
		defaultHandler.val = false; // Это для того чтобы после нажатия на строку курсор не уходит с табличного поля, и при новой активизации формы можно было курсором посмотреть другие значения
	},

	beforeExitApp : function () {
		this.watcher.stopWatch();
	},

	IsRegExp_OnChange : function(Элемент) {
		if (this.form.IsRegExp)
			this.form.WholeWords = false;
		this.form.Controls.Query.ChoiceButton = (this.form.IsRegExp ? this.reEditorPresent : false);

		this.SetControlsVisible()
	},

	WholeWords_OnChange : function(Элемент) {
		if (this.form.WholeWords)
			this.form.IsRegExp = false;
		this.form.Controls.Query.ChoiceButton = (this.form.IsRegExp ? this.reEditorPresent : false);

		this.SetControlsVisible();
	},

	Query_StartChoice : function (Control, DefaultHandler) {
		var reEditorPath = this.getRegExpEditorScriptPath();
		if (reEditorPath)
		{
			DefaultHandler.val = false;
			reEditorAddin = stdlib.require(reEditorPath);
			if (reEditorAddin)
			{
				var reEditor = reEditorAddin.CreateRegExpEditor();
				reEditor.open(Control.val);
			}
		}
	},

	SearchResults_OnRowOutput : function (Control, RowAppearance, RowData) {

		var cell = RowAppearance.val.Cells.FoundLine;

		switch (RowData.val.RowType)
		{
		case RowTypes.FuncGroup:
			cell.SetPicture(this.Icons.Func);
			break;

		case RowTypes.ProcGroup:
			cell.SetPicture(this.Icons.Proc);
			break;

		case RowTypes.SearchDoc:
			RowAppearance.val.Cells.LineNo.SetText('');
			RowAppearance.val.Font = this.SearchDocRowFont;
			RowAppearance.val.TextColor = WebColors.DarkBlue;
			break;

		default:
			break;
		}

		if (RowData.val._method && RowData.val._method.IsProc !== undefined)
			RowAppearance.val.Cells.Method.SetPicture(RowData.val._method.IsProc ? this.Icons.Proc : this.Icons.Func);

	},

	switchView : function (setTreeView) {

		var results = this.results.Copy();

		this.clearSearchResults();

		for (var docRowIx = 0; docRowIx < results.Rows.Count(); docRowIx++)
		{
			var oldDocRow = results.Rows.Get(docRowIx);
			var docRow = this.results.Rows.Add();
			FillPropertyValues(docRow, oldDocRow);
			docRow.groupsCache = v8New('Map');

			if (setTreeView)
			{
				for (var i=0; i<oldDocRow.Rows.Count(); i++)
				{
					var row = oldDocRow.Rows.Get(i);
					var groupRow = this.getGroupRow(docRow, row._method);
					var resRow = groupRow.Rows.Add();
					FillPropertyValues(resRow, row);
				}
			}
			else
			{
				for (var i=0; i<oldDocRow.Rows.Count(); i++)
				{
					var groupRow = oldDocRow.Rows.Get(i);
					for (var j=0; j<groupRow.Rows.Count(); j++)
					{
						var row = groupRow.Rows.Get(j);
						var resRow = docRow.Rows.Add();
						FillPropertyValues(resRow, row);
					}
				}
			}
		}
		this.expandTree();
		this.SetControlsVisible();
	},

	CmdBar_TreeView : function (Button) {
		this.form.TreeView = !this.form.TreeView;
		Button.val.Check = this.form.TreeView;
		//this.form.Controls.SearchResults.Columns.FoundLine.ShowHierarchy = this.form.TreeView;
		this.switchView(this.form.TreeView);
	},

	CmdBar_ExpandAll : function (Button) {
		this.expandTree(false);
	},

	CmdBar_CollapseAll : function (Button) {
		this.expandTree(true);
	},

	fShowReplace : function () {
		this.SetControlsVisible();
	},

	CmdBar_btShowReplace : function (Button) {
		this.form.ShowReplace = !this.form.ShowReplace;
		Button.val.Check = this.form.ShowReplace;
		this.fShowReplace();
	},

	SetControlsVisible : function() {

		var ctr = this.form.Controls;
		//ctr.SearchResults.Columns.FoundLine.ShowHierarchy = this.form.TreeView;
		ctr.CmdBar.Buttons.TreeView.Check = this.form.TreeView;
		this.form.Controls.SearchResults.Columns.Method.Visible = !this.form.TreeView;
		this.form.Controls.SearchResults.Columns.ExactMatch.Visible = this.form.IsRegExp;
		if (this.form.IsRegExp)
			this.form.Controls.SearchResults.Columns.Area.Location = this.form.Controls.SearchResults.Columns.Method.Location//в той же
		else
			this.form.Controls.SearchResults.Columns.Area.Location = this.form.Controls.SearchResults.Columns.RowType.Location;//
		
		this.form.Controls.mdFilter.Enabled		= this.isGlobalFind;
		this.form.Controls.mdFilterUse.Enabled	= this.isGlobalFind;

		if (this.form.ShowReplace)
		{
			if (this.form.Открыта())
				try {
					//Вылетает но работает - разобраться бы почему
					ctr.PnlReplace.Collapse = ControlCollapseMode.None;
				} catch(e){}
		}
		else
		{
			if (this.form.Открыта())
				try {
					//Вылетает но работает - разобраться бы почему
					ctr.PnlReplace.Collapse = ControlCollapseMode.Top;
				} catch(e){}
		}

		var buttons = this.form.Controls.CmdBar.Buttons;
		buttons.ExpandAll.Enabled = this.form.TreeView;
		buttons.Actions.Buttons.ExpandAll.Enabled = this.form.TreeView;
		buttons.CollapseAll.Enabled = this.form.TreeView;
		buttons.Actions.Buttons.CollapseAll.Enabled = this.form.TreeView;

		this.form.caption = "Расширенный поиск и замена в модуле";
	}
	,
	
	mdFilter_OnChange : function (control) {
		this.form.mdFilterUse = !(this.form.mdFilter.length === 0 || /^\s*$/.test(this.form.mdFilter));
	},

}); // end of ExtSearch class

ExtSearchGlobal = ExtSearch.extend({

	settingsRootPath : SelfScript.uniqueName+"Global", // тест, пускай у нас и настройки будут глобальными.

	settings : {
		pflSnegopat : {
			'IsRegExp'			: false, // Поиск регулярными выражениями.
			'CaseSensetive'		: false, // Учитывать регистр при поиске.
			'WholeWords'		: false, // Поиск слова целиком.
			'SearchHistory'		: v8New('ValueList'), // История поиска.
			'ReplaceHistory'	: v8New('ValueList'), // История замены.
			'HistoryDepth'		: 15, // Количество элементов истории поиска.
			'ProcessArea'		: 0, // текущая область
			'threadCount'		: 25, // к-во потоков
			'TreeView'			: false, // Группировать результаты поиска по методам.
			'IsVertical'		: false, //показывать ли вертикально
			'mdFilter'			: "", // Фильтр метаданных при поиске
			'mdFilterUse'		: false //Использовать ли фильтр
		}
	},

	construct : function () {

		this._super(true);

		this._instance = null;

		this.form.КлючСохраненияПоложенияОкна = "extGlobalSearch.js";

		this.loadSettings();

		this.isGlobalFind = true;
		//TODO: признак автоматически назначаемого хоткей, если уже назначен на отмену поиска, автоматом не будет назначаться.
		this.dynamicHotKey = true;
		for(var i = 0; i < hotkeys.count; i++)
		{
			var hk = hotkeys.item(i);
			Команда = hk.addin + "::" + hk.macros
			if (Команда.indexOf("ExtendedSearch::Отменить глобальный поиск")!=-1){
				this.dynamicHotKey = false;
				break;
			}
		}

		this.expandetRows = {};

		this.SetControlsVisible();
		this.form.HistoryDepth = (this.form.HistoryDepth==0)?15:this.form.HistoryDepth;//защита от сбоя
		this.countRowsInIdleSearch = this.settings.pflSnegopat.current.threadCount;
		//debugger
		this.re = new RegExp(/(([а-яa-z0-9]{1,})\s[а-яa-z0-9]{1,})(\.|\:)/i);

		this.filterByUUID = null;

		ExtSearchGlobal._instance = this;
	},

	isNeedToCheckObject : function (testString, filters) {

		if (!filters.length)
			return true;

		var lowString = testString.toLowerCase();

		for(var i = 0; i < filters.length; i ++)
		{
			var index = lowString.indexOf(filters[i])
			
			if( index < 0 )
				return false;
		}

		return true;
	},
	
	searchByUuid: function(row, sort) {
		this.searchStage = "lookup: " + row.title;
		var mdObj = findMdObj(this.currentMdContainer, row.UUID);
		if (sort == undefined) sort = 999;
		var docRow = null;
		if (mdObj){
			this.searchStage = "object: " + row.title;
			var obj = this.getWindowObject({
								mdObj:mdObj,
								mdProp:row.mdProp,
								title:row.title});
			obj.sort = sort+1;
			this.searchStage = "text/search: " + row.title;
			docRow = this.search(obj, this.re);
		}
		return docRow;
	},

	searchInMetadata : function(fromHotKey){
		this.finishSearch(false);
		try {

		var md = null;
		var objTitle = "";
		var activeWindow = this.watcher.getActiveTextWindow();
		if (!activeWindow) {
		} else {
			var activeView = activeWindow.GetView();
			var obj = this.getWindowObject(activeView);
			if (obj!=null){
				objTitle = obj.getTitle();
				var colon = objTitle.indexOf(":");
				if (colon >= 0) objTitle = objTitle.substr(0, colon);
			}
		}

		md = this.getCurrentMd();
		if (!md) return;

		this.currentMdContainer = md;
		this.clearSearchResults();
		this.re = this.buildSearchRegExpObject();

		if (!this.re) return;

		var filters = new Array();
		if (this.form.mdFilterUse) {
			var filtersToUpdate = this.form.mdFilter.split(' ');
			for(var i = 0; i < filtersToUpdate.length; i ++)
			{ 
				filters.push(filtersToUpdate[i].toLowerCase());
			}
		}

		this.mdFilter = filters;

		this.curCaption = windows.caption; //а вдруг, еще кто-то не пользуется configCaption...

		this.startGlobalSearch = true;
		this.countRowsInIdleSearch = Math.max(1, Number(this.form.threadCount) || 25);
		this.reatingMdObjects = {"ОбщийМодуль":2,
								"Конфигурация":3,
								"ПланОбмена":4,
								"ОбщаяФорма":5
							};
		if (objTitle.length>0){
			this.reatingMdObjects[objTitle]=1; //Самый высокий рейтинг...
		}


		this.prepareSearchQueue(this.currentMdContainer);
		this.expandetRows = {};
		this.curId = 0;
		if (this.dynamicHotKey)
			{
			hks.AddHotKey("Ctrl+Shift+BkSpace", "ExtendedSearch", "Отменить глобальный поиск");
			this.searchHotkeyAdded = true;
		}
		this.searchConnected = true;
		this.searchTimer = createTimer(50, this, "onSearchTimer");
		this.lastSearchRender = 0;
		} catch (e) { this.finishSearch(false); this.reportSearchError(e); }

		//this.showSearchResult(docRow, fromHotKey);
		//windows.caption = curCaption;
	},

	getCurrentMd:function(){
		var md ;
		if (this.isInCurrentMdConteinerFind ) {
			if (!this.activeView){
				var activeWindow = this.watcher.getActiveTextWindow();
				if (!activeWindow){
				} else {
					var activeView = activeWindow.GetView();
				}
			} else {

				var activeView = this.activeView;
			}
			//Определим объект конфигурации по текущему окну.
			if (!activeView) {
			} else {
				if (activeView.mdObj && activeView.mdProp) {
					md = activeView.mdObj.container;
				} else if (activeView.mdObj) {
					md = activeView.mdObj.container;
				}
			}

		}

		if (!md) {
			md = metadata.current;
		}

		return md;
	},

	// Одинаковая очистка для завершения, отмены, закрытия и ошибки.
	finishSearch : function(render) {
		this.startGlobalSearch = false;
		if (this.searchConnected) {
			this.searchConnected = false;
			try { if (this.searchTimer) killTimer(this.searchTimer); this.searchTimer = 0; }
			catch (e) { Message("Не удалось отключить обработчик поиска: " + e.message); }
		}
		if (this.searchHotkeyAdded) {
			this.searchHotkeyAdded = false;
			for (var i = hotkeys.count - 1; i >= 0; i--) {
				try {
				var hk = hotkeys.item(i);
				if (hk.addin == "ExtendedSearch" && hk.macros == "Отменить глобальный поиск") {
					try { hotkeys.remove(i); }
					catch (e) { Message("Не удалось снять клавишу поиска: " + e.message); }
				}
				} catch (e) { Message("Не удалось проверить клавишу поиска: " + e.message); }
			}
		}
		if (this.curCaption !== undefined) { windows.caption = this.curCaption; this.curCaption = undefined; }
		this.mdWalk = null;
		this.form.caption = "Расширенный поиск и замена в модуле (глобальный)";
		if (render && this.form.IsOpen()) this.showSearchResult(null, false);
	},

	Form_OnClose : function() {
		this.finishSearch(false);
		this.saveSettings();
		saveProfile();
	},

	beforeExitApp : function() {
		this.finishSearch(false);
		this.watcher.stopWatch();
	},

	reportSearchError : function(e) {
		Message("Ошибка глобального поиска [" + (this.searchStage || "prepare") + "]: " + String(e.description || e.message || e) + " (" + e.number + ")");
	},

	onSearchTimer : function() { this.onIdle(); },

	onIdle : function() {
		if (this.searchBusy) { this.searchReentries = (this.searchReentries || 0) + 1; return; }
		this.searchBusy = true;
		try {
			if (!this.startGlobalSearch) { this.finishSearch(true); return; }
			var started = new Date().getTime(), count = 0;
			var limit = Math.max(1, Number(this.countRowsInIdleSearch) || 25);
			while (count < limit && new Date().getTime() - started < 30) {
				if (this.mdWalk) {
					try { this.readMdStep(); }
					catch (e) {
						var frame = this.mdWalk && this.mdWalk[this.mdWalk.length - 1];
						if (!frame || findMdObj(this.currentMdContainer, frame.id)) throw e;
						this.mdWalk.pop();
						Message("Объект удалён во время поиска: " + frame.id);
					}
					continue;
				}
				if (this.curId >= this.searchQueue.length) { this.finishSearch(true); return; }
				var row = this.searchQueue[this.curId++];
				if (this.isNeedToCheckObject(row.title, this.mdFilter)) {
					this.searchByUuid(row, this.curId - 1);
					windows.caption = row.mdName;
				}
				count++;
			}
			var now = new Date().getTime();
			if (!this.mdWalk && now - this.lastSearchRender >= 200 && this.form.IsOpen()) {
				this.lastSearchRender = now;
				// Значение дерева уже содержит новые строки. Полную сортировку и
				// разворачивание выполняем один раз при завершении поиска.
				this.form.caption = "Глобальный поиск: " + this.curId + " / " + this.searchQueue.length;
			}
		} catch (e) {
			this.finishSearch(false);
			this.reportSearchError(e);
		} finally { this.searchBusy = false; }
	},

	// Новый список на каждый запуск: добавленные и удалённые модули учитываются,
	// фильтр применяется к очереди, прежний список не используется.
	prepareSearchQueue : function(container) {
		this.searchQueue = [];
		this.mdWalk = [{obj:container.rootObject, id:container.rootObject.id, prop:0, cls:0, child:0}];
	},

	readMdStep : function() {
		var stack = this.mdWalk;
		if (!stack.length) {
			this.searchQueue.sort(function(a,b) { return a.sort - b.sort || a.order - b.order; });
			this.mdWalk = null;
			return;
		}
		var frame = stack[stack.length - 1], obj = frame.obj, cls = obj.mdClass;
		if (frame.name === undefined) {
			var names = [], parent = obj;
			while (parent) {
				var kind = parent.mdClass.name(1);
				names.unshift((kind ? kind + " " : "") + parent.name);
				parent = parent.parent;
				if (parent && parent.mdClass.name(1) == "Конфигурация") break;
			}
			frame.name = names.join(".");
		}
		if (frame.prop < cls.propertiesCount) {
			var prop = cls.propertyAt(frame.prop++);
			if (obj.isPropModule(prop.id)) {
				if (this.filterByUUID) {
					var any = false, selected = false;
					for (var uuid in this.filterByUUID) { any = true; if (uuid == obj.id) selected = true; }
					if (any && !selected) return;
				}
				var title = frame.name + ": " + prop.name(1);
				var rank = this.reatingMdObjects[frame.name] || this.reatingMdObjects[cls.name(1)] || 9;
				this.searchQueue.push({UUID:obj.id, mdProp:prop, mdName:frame.name, title:title, sort:rank, order:this.searchQueue.length});
			}
			return;
		}
		if (frame.cls >= cls.childsClassesCount) { stack.pop(); return; }
		var childClass = cls.childClassAt(frame.cls);
		var ignored = {"Реквизиты":1,"Макеты":1,"ОбщиеКартинки":1,"Элементы стиля":1,"Подсистемы":1,"Языки":1,"Стили":1,"Интерфейсы":1,"ПараметрыСеанса":1,"Роли":1,"ОбщиеМакеты":1,"КритерииОтбора":1,"ОбщиеРеквизиты":1,"ТабличныеЧасти":1,"Параметры":1};
		if (ignored[childClass.name(1,true)] || frame.child >= obj.childObjectsCount(frame.cls)) {
			frame.cls++; frame.child = 0; return;
		}
		var child = obj.childObject(frame.cls, frame.child++);
		stack.push({obj:child, id:child.id, prop:0, cls:0, child:0});
	},

	Query_OnChange : function(Control){

		return;

	},

	BtSearch_Click : function (control) {

		if (this.form.Query == '')
		{
			DoMessageBox('Не задана строка поиска');
			return;
		}

		this.searchInMetadata(true);
	},

	SetControlsVisible : function(){
		this._super();
		if (this.isGlobalFind){
			this.form.caption = "Расширенный поиск и замена в модуле (глобальный)";
		}
	},

	showSearchResult: function (docRow, fromHotKey) {
		this.showResult(docRow, fromHotKey);
		this.expandTree();
	},

	expandTree : function (collapse) {
		var tree = this.form.Controls.SearchResults;
		for (var i=0; i < this.results.Rows.Count(); i++)
		{
			var docRow = this.results.Rows.Get(i);
			if (this.form.TreeView)
			{
				for (var j=0; j < docRow.Rows.Count(); j++)
				{
					var row = docRow.Rows.Get(j);
					if (this.expandetRows[""+row.LineNo+row.FoundLine]){
						continue;
					}
					collapse ? tree.Collapse(row) : tree.Expand(row, true);
					if (this.startGlobalSearch){
						this.expandetRows[""+row.LineNo+row.FoundLine] = "1";
					}
				}
			}
			else
			{
				if (this.expandetRows[""+docRow.LineNo+docRow.FoundLine]){
					continue;
				}
				collapse ? tree.Collapse(docRow) : tree.Expand(docRow, true);

				if (this.startGlobalSearch){
					this.expandetRows[""+docRow.LineNo+docRow.FoundLine] = "1";
				}
			}
		}
	}



})

////} ExtSearch

////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные объекты.
////

MdObject = stdlib.Class.extend({
	construct: function (obj, prop, title) {
		this.obj = obj;
		this.prop = prop;
		this.title = title;
	},
	getText: function() {
		return this.obj.getModuleText(this.prop.id);
	},
	activate: function() {
		this.obj.openModule(this.prop.id);
		return GetTextWindow();
	},
	getTitle: function() {
		if (!this.title)
		{
			function getMdName(mdObj) {
				if (mdObj.parent && mdObj.parent.mdClass.name(1) != 'Конфигурация')
					return getMdName(mdObj.parent) + '.' + mdObj.mdClass.name(1) + ' ' + mdObj.name;
				var cname = mdObj.mdClass.name(1);
				return  (cname ? cname + ' ' : '') + mdObj.name;
			}
			this.title = getMdName(this.obj) + ': ' + this.prop.name(1);
		}
		return this.title;
	}
});

TextDocObject = stdlib.Class.extend({
	construct: function (txtDoc, title) {
		this.obj = txtDoc;
		this.title = title;
	},
	getText: function() {
		return this.obj.GetText();
	},
	activate: function() {
		this.obj.Show();
		return GetTextWindow();
	},
	getTitle: function() {
		if (!this.title)
			this.title = this.obj.UsedFileName;
		return this.title;
	}
});

function findMdObj(currentmd, uuid) {
	if(uuid == currentmd.rootObject.id)
		return currentmd.rootObject
	return currentmd.findByUUID(uuid);
}
////
////} Вспомогательные объекты.
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
////{ TextWindowsWatcher - отслеживает активизацию текстовых окон и запоминает последнее.
////

TextWindowsWatcher = stdlib.Class.extend({

	construct : function() {
		this.timerId = 0;
		this.lastActiveTextWindow = null;
		this.startWatch();
	},

	getActiveTextWindow : function () {
		if (this.lastActiveTextWindow && this.lastActiveTextWindow.IsActive())
			return this.lastActiveTextWindow;
		return null;
	},

	startWatch : function () {
		if (this.timerId)
			this.stopWatch();
		this.timerId = createTimer(500, this, 'onTimer');
	},

	stopWatch : function () {
		if (!this.timerId)
			return;
		killTimer(this.timerId);
		this.timerId = 0;
	},

	onTimer : function (timerId) {
		var wnd = GetTextWindow();
		if (wnd)
			this.lastActiveTextWindow = wnd;
		else if (this.lastActiveTextWindow && !this.lastActiveTextWindow.IsActive())
			this.lastActiveTextWindow = null;
	}

}); // end of TextWindowsWatcher class

//} TextWindowsWatcher

////////////////////////////////////////////////////////////////////////////////////////
////{ StartUp
////
function GetExtSearch() {
	if (!ExtSearch._instance)
		new ExtSearch();

	return ExtSearch._instance;
}

function GetExtSearchGlobal() {
	if (!ExtSearchGlobal._instance)
		new ExtSearchGlobal();

	return ExtSearchGlobal._instance;
}


// Ленивая инициализация: экземпляры (а с ними загрузка форм из extSearchReplace.epf, ~1 с на старте) создаются при первом поиске.
// На выходе останавливаем наблюдатель только у уже созданных экземпляров.
events.connect(Designer, "beforeExitApp", {
	beforeExitApp : function () {
		if (ExtSearch._instance) ExtSearch._instance.beforeExitApp();
		if (ExtSearchGlobal._instance) ExtSearchGlobal._instance.beforeExitApp();
	}
});
////}

function getMacrosInfo(name, info) {
	if (name == "Найти текст") {
		info.descr =  "Поиск текста в открытом документе";
		info.picture = stdcommands.Frame.Search.info.picture;
	} else if (name == "Глобальный поиск") {
		info.descr =  "Запустить поиск по конфигурации";
		info.picture = stdcommands.Frame.SearchGlobal.info.picture;
	}
}
