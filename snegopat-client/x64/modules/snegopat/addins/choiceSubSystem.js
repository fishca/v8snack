//engine: JScript
//uname: choiseSubSystem
//dname: Выбрать подсистему
//addin: stdlib
//addin: stdcommands
//addin: global
global.connectGlobals(SelfScript);
stdlib.require("ScriptForm.js",SelfScript);
stdlib.require("TextChangesWatcher.js",SelfScript);

function createSelectionModel(entries,allSelected) {
    var model={entries:entries,checked:{}};
    for(var i=0;i<entries.length;i++) model.checked[entries[i].key]=!!(allSelected || entries[i].checked);
    return model;
}
function selectionResult(model,singleKey) {
    if(singleKey) return {keys:[singleKey],clear:false,single:true};
    var keys=[];
    for(var i=0;i<model.entries.length;i++) if(model.checked[model.entries[i].key]) keys.push(model.entries[i].key);
    return {keys:keys,clear:keys.length===0 || keys.length===model.entries.length};
}
function markSubsystemBranch(model,key,marked) {
    for(var i=0;i<model.entries.length;i++){
        var candidate=model.entries[i].key;
        if(!key || candidate===key || candidate.indexOf(key+".")===0)model.checked[candidate]=!!marked;
    }
}
function updateRecentKeys(oldKeys,selectedKeys,limit) {
    var result=[],seen={},combined=selectedKeys.concat(oldKeys);
    for(var i=0;i<combined.length && result.length<limit;i++) {
        if(!seen["$"+combined[i]]) {seen["$"+combined[i]]=true;result.push(combined[i]);}
    }
    return result;
}

var SubsystemDialog=ScriptForm.extend({
    construct:function(model,recent,parents,children) {
        this._super(SelfScript,"Форма");
        this.model=model;this.recent=recent;this.tab="All";this.mode="filter";
        this.parents=parents;this.children=children;
        var f=this.form;
        this.tree=v8New("ДеревоЗначений");this.rows=[];this.expanded={};
        this.tree.Columns.Add("Name");this.tree.Columns.Add("Key");
        this.tree.Columns.Add("Marked",v8New("ОписаниеТипов","Булево"));
        f.ValuesList=this.tree;
        this.recentTable=v8New("ТаблицаЗначений");
        this.recentTable.Columns.Add("Name");this.recentTable.Columns.Add("Key");
        this.recentTable.Columns.Add("Marked",v8New("ОписаниеТипов","Булево"));
        f.RecentItems=this.recentTable;
        this.tabs=f.Controls.Tabs;
        this.treeRows=[];this.recentRows=[];
        this.setupMarks(f.Controls.ValuesList);this.setupMarks(f.Controls.RecentList);
        this.updateOptions();
        var owner=this;
        this.watcher=new TextChangesWatcher(f.Controls.SearchText,3,function(text){if(owner.tab==="All")owner.refresh(text);});
        this.recentWatcher=new TextChangesWatcher(f.Controls.RecentSearchText,3,function(text){if(owner.tab==="Recent")owner.refresh(text);});
        this.refresh("");
    },
    Form_OnOpen:function(){
        this.watcher.start();this.recentWatcher.start();
    },
    Form_BeforeClose:function(cancel,standard){this.stopWatcher();},
    stopWatcher:function(){
        var watchers=[this.watcher,this.recentWatcher];
        for(var i=0;i<watchers.length;i++)if(watchers[i] && watchers[i].timerID){watchers[i].stop();watchers[i].timerID=0;}
    },
    currentGrid:function(){return this.tab==="Recent"?this.form.Controls.RecentList:this.form.Controls.ValuesList;},
    currentSearchText:function(){return String(this.tab==="Recent"?this.form.RecentSearchText:this.form.SearchText);},
    setupMarks:function(grid){
        for(var i=0;i<grid.Columns.Count();i++)grid.Columns.Получить(i).ДанныеФлажка="";
        grid.SetAction("ПриВыводеСтроки",v8New("Action","drawMark"));
        grid.SetAction("ПриИзмененииФлажка",v8New("Action","onMarksChanged"));
    },
    drawMark:function(control,appearance,data){
        var cell=appearance.val.Cells.Получить(0);cell.ОтображатьФлажок=true;cell.Флажок=!!data.val.Marked;
    },
    syncMarks:function(){
        for(var i=0;i<this.rows.length;i++){var r=this.rows[i];if(String(r.Key)!=="")this.model.checked[String(r.Key)]=!!r.Marked;}
    },
    onMarksChanged:function(control,column){
        var row=this.currentGrid().CurrentRow;
        if(!row)return;
        var key=String(row.Key),wasMarked=!!this.model.checked[key];
        if(!key){wasMarked=true;for(var i=0;i<this.model.entries.length;i++)if(!this.model.checked[this.model.entries[i].key])wasMarked=false;}
        this.syncMarks();
        markSubsystemBranch(this.model,key,!wasMarked);
        this.refresh(this.currentSearchText());
    },
    onTabChanged:function(control,page){
        this.syncMarks();this.tab=String(this.tabs.ТекущаяСтраница.Имя);
        this.rows=this.tab==="Recent"?this.recentRows:this.treeRows;
        this.refresh(this.currentSearchText());
    },
    refresh:function(text){
        if(this.tab==="Recent"){this.refreshRecent(text);return;}
        var g=this.form.Controls.ValuesList,expanded=this.expanded;
        var currentKey=g.CurrentRow?String(g.CurrentRow.Key):null,previousText=this.lastText;
        if(this.tab==="All" && !this.lastText)for(var ri=0;ri<this.rows.length;ri++){
            var old=this.rows[ri];if(old.Rows.Count())expanded["$"+String(old.Key)]=!!g.Развернут(old);
        }
        text=String(text||"").toLowerCase().replace(/^\s+|\s+$/g,"");
        var words=text?text.split(/\s+/):[],entries=this.model.entries,visible=[];
        if(this.tab==="Recent") {
            for(var i=0;i<this.recent.length;i++)for(var j=0;j<entries.length;j++)if(entries[j].key===this.recent[i]){visible.push(entries[j]);break;}
        } else visible=entries;
        this.tree.Rows.Clear();this.rows=[];
        var all=true;
        for(var i=0;i<entries.length;i++)if(!this.model.checked[entries[i].key])all=false;
        var root=this.tree.Rows.Add();root.Key="";root.Name="Все подсистемы";root.Marked=all;this.rows.push(root);
        var first=null,nodes={"$":root},keep={};
        if(this.tab==="All" && this.mode==="filter" && text)for(var i=0;i<visible.length;i++){
            var key=visible[i].key,match=true;
            for(var j=0;j<words.length;j++)if(key.toLowerCase().indexOf(words[j])<0)match=false;
            if(match){while(key){keep["$"+key]=true;var dot=key.lastIndexOf(".");key=dot<0?"":key.substr(0,dot);}}
        }
        for(var i=0;i<visible.length;i++) {
            var entry=visible[i],match=true;
            for(var j=0;j<words.length;j++)if(entry.key.toLowerCase().indexOf(words[j])<0)match=false;
            if(this.mode==="filter" && !match && !(this.tab==="All" && keep["$"+entry.key]))continue;
            var dot=entry.key.lastIndexOf("."),parentKey=dot<0?"":entry.key.substr(0,dot);
            var parent=this.tab==="Recent"?root:(nodes["$"+parentKey] || root);
            var r=parent.Rows.Add();r.Key=entry.key;r.Marked=!!this.model.checked[entry.key];
            r.Name=this.tab==="Recent"?entry.key:entry.name;nodes["$"+entry.key]=r;this.rows.push(r);
            if(match && !first)first=r;
        }
        for(var i=0;i<this.rows.length;i++){
            var r=this.rows[i];if(r.Rows.Count()){
                if(text || expanded["$"+String(r.Key)]!==false)g.Развернуть(r,false);else g.Свернуть(r);
            }
        }
        if(!text)for(var i=this.rows.length-1;i>=0;i--){var r=this.rows[i];if(r.Rows.Count() && expanded["$"+String(r.Key)]===false)g.Свернуть(r);}
        var target=text===previousText && currentKey!==null?nodes["$"+currentKey]:null;target=target || first || root;
        var parentKey=String(target.Key);
        while(parentKey){var dot=parentKey.lastIndexOf(".");parentKey=dot<0?"":parentKey.substr(0,dot);var ancestor=nodes["$"+parentKey];if(ancestor && !g.Развернут(ancestor))target=ancestor;}
        this.lastText=text;g.CurrentRow=target;this.treeRows=this.rows;
    },
    refreshRecent:function(text){
        var g=this.form.Controls.RecentList,currentKey=g.CurrentRow?String(g.CurrentRow.Key):null;
        text=String(text||"").toLowerCase().replace(/^\s+|\s+$/g,"");
        var words=text?text.split(/\s+/):[],entries=this.model.entries,first=null,current=null;
        this.recentTable.Clear();this.rows=[];
        for(var i=0;i<this.recent.length;i++)for(var j=0;j<entries.length;j++){
            var entry=entries[j];if(entry.key!==this.recent[i])continue;
            var match=true;for(var k=0;k<words.length;k++)if(entry.key.toLowerCase().indexOf(words[k])<0)match=false;
            if(this.mode==="filter" && !match)break;
            var row=this.recentTable.Add();row.Name=entry.key;row.Key=entry.key;row.Marked=!!this.model.checked[entry.key];
            this.rows.push(row);if(match && !first)first=row;if(entry.key===currentKey)current=row;break;
        }
        this.recentRows=this.rows;
        if(this.rows.length)g.CurrentRow=text===this.recentLastText && current?current:(first || this.rows[0]);
        this.recentLastText=text;
    },
    updateOptions:function(){
        this.form.Фильтровать=this.mode==="filter";
        this.form.СРодителями=!!this.parents;
        this.form.СПотомками=!!this.children;
    },
    Фильтровать_OnChange:function(control){
        this.syncMarks();this.mode=this.form.Фильтровать?"filter":"search";
        this.refresh(this.currentSearchText());
    },
    СРодителями_OnChange:function(control){this.parents=!!this.form.СРодителями;},
    СПотомками_OnChange:function(control){this.children=!!this.form.СПотомками;},
    finish:function(result){this.result=result;this.form.Close(1);},
    CmdBarMain_ОК:function(b){this.syncMarks();var r=selectionResult(this.model);r.parents=!!this.form.СРодителями;r.children=!!this.form.СПотомками;this.finish(r);},
    ValuesList_Selection:function(control,row,column,standard){standard.val=false;var key=String(row.val.Key);this.finish(key?selectionResult(this.model,key):{clear:true,keys:[]});},
    RecentList_Selection:function(control,row,column,standard){this.ValuesList_Selection(control,row,column,standard);},
    clearSelection:function(b){this.finish({clear:true,keys:[]});},
    showStandard:function(b){this.finish({standard:true});},
    SearchText_Tuning:function(control,direction,standard){
        var g=this.currentGrid(),visible=[];
        function walk(rows){for(var i=0;i<rows.Count();i++){var r=rows.Get(i);visible.push(r);if(r.Rows.Count() && g.Развернут(r))walk(r.Rows);}}
        if(this.tab==="Recent")visible=this.rows;else walk(this.tree.Rows);var index=0;
        for(var i=0;i<visible.length;i++)if(visible[i]===g.CurrentRow)index=i;
        index=Math.max(0,Math.min(visible.length-1,index-direction.val));if(visible.length)g.CurrentRow=visible[index];standard.val=false;
    },
    RecentSearchText_Tuning:function(control,direction,standard){this.SearchText_Tuning(control,direction,standard);},
    select:function(){this.result=null;try{this.form.DoModal();return this.result;}finally{this.stopWatcher();}}
});

function SubSystemFilter(){this.pending=null;events.connect(windows,"onDoModal",this);}
SubSystemFilter.prototype.historyKey=function(){return "SubSystemFilter/RecentV2/"+String(metadata.current.rootObject.id);};
SubSystemFilter.prototype.loadRecent=function(){
    var key=this.historyKey();profileRoot.createValue(key,v8New("СписокЗначений"),pflSnegopat);
    var list=profileRoot.getValue(key),result=[];for(var i=0;i<list.Count();i++)result.push(String(list.Get(i).Value));return result;
};
SubSystemFilter.prototype.saveRecent=function(keys){
    var recent=updateRecentKeys(this.loadRecent(),keys,20),list=v8New("СписокЗначений");
    for(var i=0;i<recent.length;i++)list.Add(recent[i]);profileRoot.setValue(this.historyKey(),list);
};
SubSystemFilter.prototype.buildModel=function(control){
    var grid=control.extInterface,root=grid.dataSource.root.firstChild,entries=[];
    function walk(parent,prefix,indent){
        for(var row=parent.firstChild;row;row=row.next){
            var name=String(row.getCellAppearance(0).text),key=prefix?prefix+"."+name:name;
            entries.push({key:key,name:name,indent:indent,row:row,checked:grid.isCellChecked(row,0)===1});walk(row,key,indent+"    ");
        }
    }
    if(root)walk(root,"","");this.nativeRoot=root;return createSelectionModel(entries,root && grid.isCellChecked(root,0)===1);
};
SubSystemFilter.prototype.onDoModal=function(d){
    if(!/Отбор\sпо\sподсистемам/i.test(d.Caption))return;
    if(d.stage===afterDoModal){this.pending=null;return;}
    var form=d.form,control;try{control=form.getControl("eMDTreeCtrl");}catch(e){return;}
    if(d.stage===afterInitial){
        this.pending=null;
        if(this.DisableSelection){this.pending={clear:true};delete this.DisableSelection;return;}
        var model=this.buildModel(control),dialog=new SubsystemDialog(model,this.loadRecent(),!!form.getControl("eParentCheck").value,!!form.getControl("eChildCheck").value),result;
        this.dialog=dialog;try{result=dialog.select();}finally{this.dialog=null;}
        if(!result){d.cancel=true;d.result=0;return;}
        if(result.standard)return;
        if(result.clear){this.pending=result;return;}
        form.getControl("eParentCheck").value=!!result.parents;form.getControl("eChildCheck").value=!!result.children;
        var grid=control.extInterface;
        if(this.nativeRoot){grid.currentRow=this.nativeRoot;grid.checkCell(this.nativeRoot,0,0);form.sendEvent(control.id,17,0);}
        for(var i=0;i<model.entries.length;i++){
            var entry=model.entries[i],selected=false;
            for(var j=0;j<result.keys.length;j++)if(entry.key===result.keys[j])selected=true;
            if(selected){grid.currentRow=entry.row;grid.checkCell(entry.row,0,1);form.sendEvent(control.id,17,1);}
        }
        this.pending=result;
    }else if(d.stage===openModalWnd && this.pending){
        var pending=this.pending;this.pending=null;form.sendEvent(form.getControl(pending.clear?"eClear":"eOK").id,0);
        if(pending.keys && pending.keys.length)this.saveRecent(pending.keys);
    }
};
var subsystemFilter=null;
function GetSubSystemFilter(){if(!subsystemFilter)subsystemFilter=new SubSystemFilter();return subsystemFilter;}
function activateSubSystemSelect(clear){
    var filter=GetSubSystemFilter();if(clear)filter.DisableSelection=true;
    try{stdcommands.Config.Window.send();return stdcommands.Frntend.SelectSubSystem.send();}finally{delete filter.DisableSelection;}
}
SelfScript.self['macrosВключить отбор по подсистемам']=function(){return activateSubSystemSelect(false);};
SelfScript.self['macrosОтключить отбор по подсистемам']=function(){return activateSubSystemSelect(true);};
function getDefaultMacros(){return 'Включить отбор по подсистемам';}
GetSubSystemFilter();
