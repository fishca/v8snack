//engine: JScript
//uname: my_macros
//dname: Мои макросы
//author: Пушин Владимир <vladnet@gmail.com>
//addin: global
//addin: stdlib
//addin: stdcommands

//var мВызовИзМакроса = false

//events.connect(windows, "onDoModal", SelfScript.self, "onMessageBoxSetPassword");

//////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////
function macrosОткрытьМодульОбъекта() {
    try
    {
        лОбъект=windows.getActiveView().mdObj;
		if(лОбъект.parent!=undefined) лОбъект=лОбъект.parent
		лОбъект.editProperty("МодульОбъекта")
		
		//debugger
        return true
    }catch(e){}
    return false
}

function macrosОткрытьОсновнуюФорму() {
    try
    {
        var mdObj = windows.getActiveView().mdObj
        лОсновнаяФорма=mdObj.property("ОсновнаяФорма")
    	if(лОсновнаяФорма==undefined) return false
        
        var mainForm = mdObj.container.findByUUID(stdlib.getUuidFomMDRef(лОсновнаяФорма))
        mainForm.editProperty("Форма")  // откроет форму (редактор формы)
        mainForm.openModule("Форма")    // и сразу переключит её на вкладку модуля формы
        return true
    }catch(e){ try { snegopat.diagLog("macro", "ОткрытьОсновнуюФорму: ошибка " + e.message) } catch (e2) {} }
    return false
}

/*
function macrosОткрытьОкноНастройкиСкрипта() {
    var pathToForm=SelfScript.fullPath.replace(/.js$/, '.ssf')
    мФормаНастройки=loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
    мФормаНастройки.ОткрытьМодально()
}

function ФормаНастройкиПриОткрытии() {
	мФормаНастройки.ПарольНаМодули=мПарольНаМодульПоУмолчанию
}

function КпШапкаСохранитьИЗакрыть() {
	мПарольНаМодульПоУмолчанию=мФормаНастройки.ПарольНаМодули
	
	profileRoot.setValue(pflMyModulePass, мПарольНаМодульПоУмолчанию)
	мФормаНастройки.Закрыть()
}

function macrosУстановитьПароль() {
    мВызовИзМакроса = true
    sendCommand("{EF6D156B-12FB-4CE7-A0E9-7F0C2EDC7D06}", 0)
    мВызовИзМакроса = false
}

function onMessageBoxSetPassword(dlgInfo) {
	Message(dlgInfo.Caption)
	
	if (мПарольНаМодульПоУмолчанию == ""){
		return macrosОткрытьОсновнуюФорму()
	}
	
	debugger
    if ((dlgInfo.stage==openModalWnd) && (dlgInfo.Caption=="Защита модуля") && (мВызовИзМакроса==true)){
        dlgInfo.form.getControl("Password").value=мПарольНаМодульПоУмолчанию;
        dlgInfo.form.getControl("ConfirmPassword").value=мПарольНаМодульПоУмолчанию;
        
        new ActiveXObject("WScript.Shell").SendKeys("^~"); // Ctrl+Enter
    }
}

var grid

stdcommands.CDebug.EvalExpr.addHandler(SelfScript.self, "onEvalExpr")

function onEvalExpr(cmd) {
    if(cmd.isBefore)    // Вызывается до обработки команды 1С
        events.connect(windows, "onDoModal", SelfScript.self)
    else                // вызывается после обработки команды 1С
    {
        events.disconnect(windows, "onDoModal", SelfScript.self)
        grid = null
    }
}

function onDoModal(dlgInfo) {
    try{
        if(dlgInfo.stage == afterInitial){
            grid = dlgInfo.form.getControl('ResultGrid').extInterface
        }
    }catch(e){
        //Message(e)
    }
}

function macrosКопироватьЗначениеИзОкнаВычисленияВыраженияВБуфер() {
    if(!grid) return false
    
    var row = grid.currentRow
    if(!row) row = grid.dataSource.root.firstChild;
    var value = row.getCellValue(1)
    
	Clipboard=stdlib.require(stdlib.getSnegopatMainFolder()+'scripts\\Clipboard.js');
	Clipboard.CopyToClipboard(value);
}

events.connect(snegopat, "onProcessInsert", SelfScript.self)

// правка шаблонов снегопата
function onProcessInsert(param)
{
	//Message(param.type)
	//Message(param.name)
	//Message(param.text)
	if(itKeyword == param.type)
	{
		if(param.name == "Возврат")
			param.text = param.text.replace(/\r\n|\r|\n/g, ""); 
		else if(param.name == "Прервать")
			param.text = param.text.replace(/\r\n|\r|\n/g, ""); 
		else if(param.name == "Продолжить")
			param.text = param.text.replace(/\r\n|\r|\n/g, ""); 
		else if(param.name == "Экспорт")
			param.text = param.text.replace(/\r\n|\r|\n/g, ""); 
	}
}

мФормаНастройки=null

// Зададим путь в профайле
var pflMyModulePass = "MyScript/ModulePass"

// Восстановим настройки
profileRoot.createValue(pflMyModulePass, "", pflSnegopat)

var мПарольНаМодульПоУмолчанию = profileRoot.getValue(pflMyModulePass)

profileRoot.setValue("Launch/ShowServerCallCounter", false); // Уберем показатели производительности навсегда

*/