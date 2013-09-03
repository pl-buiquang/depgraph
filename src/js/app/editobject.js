(function(depgraphlib, $, undefined){ 
/************************************************************/
  /**                      Edition                           **/
  /************************************************************/

  /**
   * Object handling event callbacks and misc attributes for editing purpose
   * @param depgraph
   * @returns {EditObject}
   */
  depgraphlib.EditObject = function (depgraph){
    this.depgraph = depgraph; // reference to the graph
    
    this.editMode = false; // on/off boolean for edition
    this.mode = [];
    this.highlightMode = false;
    this.dataModel = {};
    
    this.previousSelectedObject = null; // last selected object
    this.actionsLog = []; // action log for rollback purposes
    this.currentPtr = -1; // pointer to the log if undo commands have been used
    this.lastSavedPtr = -1;
    
    this.defaultMode = {
        name : 'default',
        onWordSelect : addLinkClick,
        onLinkSelect : selectObject,
        onChunkSelect : selectObject,
        onWordContext : {
          'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
            showEditPanel(depgraph,element);
          },
          'Add Node to the left':function(depgraph,element){
            addWordSettings(depgraph,element[0],0);
          },
          'Add Node to the right':function(depgraph,element){
            addWordSettings(depgraph,element[0],1);
          },
          'Delete':function(depgraph,element){
            var word = clone(element[0].__data__);
            var affectedLinks = removeWord(depgraph,element[0].__data__['#id']);
            depgraph.editObject.previousSelectedObject = null;
            return {baseAction:'wordRemoval',word:word,affectedLinks:affectedLinks};
          }
        },
        onLinkContext : {
          'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
            showEditPanel(depgraph,element);
          },
          'Delete' : function(depgraph,element){
            var link = clone(element[0]);
            link.color = getStyleElement(element[0],'link-color','black');
            var success = removeLink(depgraph, element[0].__data__['#id']);
            depgraph.editObject.previousSelectedObject = null;
            if(success){
              return {baseAction:'linkRemoval',link:link};
            }
          }
        },
        onChunkContext : null,
        keyHandler : editKeyDownDefault,
        save : null,
        undo:defaultUndo,
        redo:null,
    };
    
    this.addEditMode(this.defaultMode);
  };
  
  /**
   * Set a data model to the edit object.
   * 
   * The data model must be an object with one or all of the following properties arrays :
   * - links
   * - words
   * - chunks
   * Each of these arrays (except links which is an array containing exactly 1 element) contains
   * objects that define labels model as following :
   * - name : name of the label
   * - values : (optional) array of possible values for label
   * - value-restrict : (optional, default false) boolean indicating if the user input is restricted to defined possible values
   * - onchange : (optional) user callback called after user submitted new value to this label field
   * 
   */
  depgraphlib.EditObject.prototype.setDataModel = function(dataModel){
    this.dataModel = dataModel;
  };

  /**
   * returns true if data is different from original 
   * difference is computed by watching if edit actions has been logged
   * and if the current pointer on the action is equal to the pointer of the last saved state
   */
  depgraphlib.EditObject.prototype.dataChanged = function(){
    if(this.needToSaveState){
      return true;
    }
    if(this.actionsLog.length == 0){
      return false;
    }
    else{
      if(this.currentPtr != this.lastSavedPtr){
        return true;
      }else{
        return false;
      }
    }
  };

  /**
   * Enable or disable the edit mode
   * @param value
   */
  depgraphlib.EditObject.prototype.setEditMode = function(value){
    var me = this;

    if(value == null){
      value = 'default';
    }else{
      editModeExist = false;
      for(i in this.mode){
        if(this.mode[i].name == value){
          editModeExist = true;
          break;
        }
      }
      if(!editModeExist){
        alert('this edition mode does not exist! switching to default mode');
        value = 'default';
      }
    }
    
    this.editMode = value;
    this.needToSaveState = false;
    
    if(value){
      window.onbeforeunload = function (e) {
        
        if(!me.dataChanged()){
          return;
        }
        
        var message = "Changes made to the graph are not saved. If you leave this page all modifications will be lost.";
        e = e || window.event;
        // For IE and Firefox
        if (e) {
          e.returnValue = message;
        }
        // For Safari
        return message;
      };
    }else{
      window.onbeforeunload = null;
    }
    this.init();
    this.initToolbar();
    
  };

  /**
   * init the toolbar with the current edit mode
   */
  depgraphlib.EditObject.prototype.initToolbar = function(){
    var depgraph = this.depgraph;
    depgraph.viewer.resetToolbarButtons();
    var buttons = [['save',save,'right','saved'],
                   ['undo',undo,'left','undo'],
                   ['redo',redo,'left','redo'],
                   ['highlight',highlightmode,'left','highlightoff'],
                   ['export',exportData,'right','export']
                   ];

    if(this.mode[this.editMode].buttons != null){
      for(button in this.mode[this.editMode].buttons){
        buttons.push(button);
      }
    }
    
    depgraph.viewer.setToolbarButtons(buttons);
    if(this.currentPtr < 0 || this.mode[this.editMode].undo == null){
      depgraph.viewer.getToolbarButton('undo').hide();
    }
    if(this.currentPtr == this.actionsLog.length-1 || this.mode[this.editMode].redo == null){
      depgraph.viewer.getToolbarButton('redo').hide();
    }/*
    if(this.mode[this.editMode].save == null){
      depgraph.viewer.getToolbarButton('redo').hide();
    }*/
    
    /**
     * switch on/off the sub edit mode : highlight mode
     */
    function highlightmode(){
      var me = depgraph.editObject;
      me.highlightMode = !me.highlightMode;
      if(me.highlightMode){
        me.clearSelection();
        depgraph.viewer.getToolbarButton('highlight').removeClass('tab').addClass('tab_on');
      }else{
        depgraph.viewer.getToolbarButton('highlight').removeClass('tab_on').addClass('tab');
      }
    }
    
    /**
     * call the current editmode save callback
     */
    function save(){
      var me = depgraph.editObject;
      if(me.mode[me.editMode].save != null){
        me.mode[me.editMode].save(depgraph);
      }
    }
    
    /**
     * call the current editmode undo callback
     */
    function undo(){
      var me = depgraph.editObject;
      if(depgraph.editObject.currentPtr == 0){
        depgraph.viewer.getToolbarButton('undo').hide();
      }
      var action = depgraph.editObject.actionsLog[depgraph.editObject.currentPtr];
      if(me.mode[action.mode].undo != null){
        me.mode[action.mode].undo.call(me,depgraph,action.rollbackdata);
      }
      depgraph.editObject.currentPtr--;
      if(me.mode[action.mode].redo != null){
        depgraph.viewer.getToolbarButton('redo').show();
      }
      me.updateSaveState();
    }
    
    /**
     * call the current editmode redo callback
     */
    function redo(){
      var me = depgraph.editObject;
      depgraph.editObject.currentPtr++;
      if(depgraph.editObject.currentPtr == depgraph.editObject.actionsLog.length-1){
        depgraph.viewer.getToolbarButton('redo').hide();
      }
      var action = depgraph.editObject.actionsLog[depgraph.editObject.currentPtr];
      if(me.mode[action.mode].redo != null){
        me.mode[action.mode].redo.call(me,depgraph,action.rollbackdata);
      }
      depgraph.viewer.getToolbarButton('undo').show();
      me.updateSaveState();
      // TODO !!!!!!!! Change callback so that work (every callbacks should be on the form func(depgraph,params))
    }
    
    /**
     * export the data
     * TODO(paul) add callback to handle the action of this function
     */
    function exportData(){
      var coords = this.getBoundingClientRect();
      var point = {x:coords.left,y:coords.top + coords.height + 2};
      var div ='<div>';
  /*    if(depgraph.gid != null){
        div += 'Wiki reference (copy paste to create a reference to this graph):<br> &lt;st uid="'+depgraph.gid+'"&gt;&lt;/st&gt;<br>';
      }*/
      div += 'Export Format : '
        + '<select name="type">'
      +'<option value="png">png</option>'
      +'<option value="json" selected>json</option>'
      +'<option value="depxml">depxml</option>'
      +'<option value="dep2pict">dep2pict</option>'
      +'<option value="conll">conll</option>'
      +'</select><br/>'
      +'<input id="export-data'+depgraph.viewer.appendOwnID('')+'"  type="button" value="Export"></div>';
      div = jQuery(div);
      var box = depgraph.viewer.createBox({closeButton:true,autodestroy:true});
      box.setContent(jQuery(div));
      jQuery('#export-data'+depgraph.viewer.appendOwnID('')).click(function(){
        var select = jQuery('select',this.parentNode);
        var format = select[0].options[select[0].selectedIndex].value;
        if(format == 'png'){
          exportPng();
        }else{
          //TODO(paul) : send raw parameter if not in custom edit mode
          depgraph.cleanData();
          depgraphlib.windowOpenPost(
              {'action':'export',
                'data':depgraph.data,
                'source_format':'json',
                'target_format':format},
              depgraph.wsurl);
//          window.open('edit/export/'+format);
        }
        box.destroy();
      });
      
      box.open(point);
    }
    
    function exportPng(){
      d3.select('rect.export_bg').attr('width','100%').attr('height','100%');
      var svgBBox = depgraph.svg.node().getBBox();
      depgraph.svg.attr('width',svgBBox.width);
      depgraph.svg.attr('height',svgBBox.height);
      var svg_xml = (new XMLSerializer).serializeToString(depgraph.svg.node());

      /*
      var form = document.getElementById("export_png");
      if(!form){
        depgraph.viewer.chart.append('<form id="export_png" method="post" action="edit/export/png" target="_blank">'+
            '<input type="hidden" name="data" value="" />'+
            '</form>');
        form = document.getElementById("export_png");
      }
      form['data'].value = svg_xml ;
      form.submit();*/
      depgraphlib.windowOpenPost(
          {'action':'export',
            'data':svg_xml,
            'source_format':'json',
            'target_format':'png'},
          depgraph.wsurl);
      
      d3.select('rect.export_bg').attr('width','0').attr('height','0');
    };

  };

  /**
   * set the need the save icon to display a unsaved state
   */
  depgraphlib.EditObject.prototype.setNeedToSave = function(){
    this.needToSaveState = true;
    this.updateSaveState();
  };

  /**
   * update the save state depending on the last saved pointer and the current pointer in the actions log
   */
  depgraphlib.EditObject.prototype.updateSaveState =function(){
    if(this.lastSavedPtr == this.currentPtr && !this.needToSaveState){
      this.depgraph.viewer.getToolbarButton('save').removeClass('save').addClass('saved');
    }else{
      this.depgraph.viewer.getToolbarButton('save').removeClass('saved').addClass('save');
    }
  };

  /**
   * init the edit object according to the current edit mode
   */
  depgraphlib.EditObject.prototype.init = function(){
    var depgraph = this.depgraph;

    if(!this.editMode){
      this.depgraph.vis.selectAll('g.word').on("click",null);
      this.depgraph.vis.selectAll('g.link').on("click",null);
      this.depgraph.vis.selectAll('g.chunk').on("click",null);
      d3.select(document).on('keydown.edit'+this.depgraph.viewer.uid,null);
      this.depgraph.viewer.resetToolbarButtons();
      jQuery('.link',this.depgraph.vis.node()).contextMenu('', {
       });
      jQuery('.word',this.depgraph.vis.node()).contextMenu('', {
      });
      jQuery('.chunk',this.depgraph.vis.node()).contextMenu('', {
      });
      return;
    }
    
    this.depgraph.vis.selectAll('g.word').on("click",onWordClick);
    this.depgraph.vis.selectAll('g.link').on("click",onLinkClick);
    this.depgraph.vis.selectAll('g.chunk').on("click",onChunkClick);
    d3.select(document).on('keydown.edit'+this.depgraph.viewer.uid,onKeyDown);
    if(this.mode[this.editMode].onLinkContext != null){
      var def = {};
      for(menu in this.mode[this.editMode].onLinkContext){
        def[menu] = {
          menu : menu,
          click: function(element) {  // element is the jquery obj clicked on when context menu launched
            onContextClick('onLinkContext',this,element);
          },
          klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
        };
      }
      jQuery('.link',this.depgraph.vis.node()).contextMenu('link-context-menu', def);
    }
    if(this.mode[this.editMode].onWordContext != null){
      var def = {};
      for(menu in this.mode[this.editMode].onWordContext){
        def[menu] = {
            menu : menu,
          click: function(element) {  // element is the jquery obj clicked on when context menu launched
            onContextClick('onWordContext',this,element);
          },
          klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
        };
      }
      jQuery('.word',this.depgraph.vis.node()).contextMenu('word-context-menu', def);
    }
    if(this.mode[this.editMode].onChunkContext != null){
      var def = {};
      for(menu in this.mode[this.editMode].onChunkContext){
        def[menu] = {
          menu : menu,
          click: function(element) {  // element is the jquery obj clicked on when context menu launched
            onContextClick('onChunkContext',this,element);
          },
          klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
        };
      }
      jQuery('.chunk',this.depgraph.vis.node()).contextMenu('chunk-context-menu', def);
    }
    
    jQuery(this.depgraph.svg.node()).contextMenu('main-menu', {
      'add word' : {
        menu:'add word',
        click:function(obj){
          var coords = depgraph.viewer.screenCoordsForElt(obj[0]);
          var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
          var div = jQuery(addWordPanel(depgraph));
          
          depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
        } 
      }
    }
    );

    
    function onContextClick(object_type,menu,object){
      var me = depgraph.editObject;
      var menu = menu.menu;
      if(me.mode[me.editMode][object_type][menu] != null){
        var action = me.mode[me.editMode][object_type][menu].call(this,depgraph,object);
        me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onContextClick',params:{object_type:object_type,menu:menu,object:object}}});
      }
    }
    
    function onWordClick(d,i){
      var me = depgraph.editObject;
      if(me.mode[me.editMode].onWordSelect != null){
        var action = me.mode[me.editMode].onWordSelect.call(this,depgraph,{d:d,i:i});
        me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onWordSelect',params:{d :d,i:i}}});
      }
    }
    
    function onLinkClick(d,i){
      var me = depgraph.editObject;
      if(me.mode[me.editMode].onLinkSelect!=null){
        var action = me.mode[me.editMode].onLinkSelect.call(this,depgraph,{d:d,i:i});
        me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onLinkSelect',params:{d :d,i:i}}});
      }
    }
    
    function onChunkClick(d,i){
      var me = depgraph.editObject;
      if(me.mode[me.editMode].onChunkSelect != null){
        var action = me.mode[me.editMode].onChunkSelect.call(this,depgraph,{d:d,i:i});
        me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onChunkSelect',params:{d :d,i:i}}});
      }
    }
    
    function onKeyDown(e){
      var me = depgraph.editObject;
      if(me.mode[me.editMode].keyHandler != null){
        var action = me.mode[me.editMode].keyHandler.call(this,depgraph,{keyCode :d3.event.keyCode});
        me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'keyHandler',params:{keyCode :d3.event.keyCode}}});
      }
    }
  };

  /**
   * add an edit mode
   * @param mode
   */
  depgraphlib.EditObject.prototype.addEditMode = function(mode){
    this.mode[mode.name] = mode;
  };

  /**
   * push an action to the action log
   * the action must contain sufficient information for the undo/redo callback of the edit mode to
   * perform rollback actions
   * if the rollbackdata isn't set, the action won't be registered
   * @param action
   */
  depgraphlib.EditObject.prototype.pushAction = function(action){
    if(action.rollbackdata != null && this.mode[action.mode].undo != null){
      this.depgraph.viewer.getToolbarButton('redo').hide();
      var button = this.depgraph.viewer.getToolbarButton('undo');
      button.show(); // TODO not to do everytime!
      this.actionsLog.splice(++this.currentPtr,this.actionsLog.length-this.currentPtr,action);
      this.updateSaveState();
    }
  };

  /**
   * clear current selection
   */
  depgraphlib.EditObject.prototype.clearSelection = function(){
    if(this.previousSelectedObject != null){
      try {
        this.previousSelectedObject.selected = false;
        highlightObject(this.previousSelectedObject,false); // sometimes the object doesn't exist anymore.
      }catch(e){
        
      }
      this.previousSelectedObject = null;
    }
  };

  /**
   * select an object node (word, chunk or link)
   * @param obj
   */
  depgraphlib.EditObject.prototype.selectObject =function(obj){
    if(this.previousSelectedObject == obj){
      this.clearSelection();
      return;
    }
    this.clearSelection();
    this.previousSelectedObject = obj;
    highlightObject(this.previousSelectedObject,true);
    obj.selected = true;
  };

  /**
   * change attributes of a object (link, chunk or word)
   * push the change in the action log
   * @param obj
   * @param attrs
   * @param pushAction
   */
  depgraphlib.EditObject.prototype.changeAttributes = function(obj,attrs,pushAction){
    var backup = clone(obj);
    var oldAttrs = [];
    for(var i = 0; i < attrs.length ; i ++){
      var oldVal = setAttrPath(obj,attrs[i].path,attrs[i].value);
      oldAttrs.push({path:attrs[i].path,value:oldVal});
    }
    if(pushAction != null && pushAction){
      var action = {mode:this.editMode,rollbackdata:{baseAction:'changeAttr',obj:backup,attrs:attrs,oldAttrs:oldAttrs}};
      this.pushAction(action);
    }
  };

  /**
   * return a reference of a value from a path in an object
   * @param obj
   * @param path
   * @param value
   * @returns
   */
  function setAttrPath(obj,path,value){
    var pathComponents = path.split('/');
    var attr = obj;
    for(var k = 0 ; k< pathComponents.length-1; k++){
      var tmp = attr[pathComponents[k]];
      if(typeof tmp == 'object'){
        if(tmp == null){
          attr[pathComponents[k]] = new Object();
        }
        attr = null;
        attr = tmp;
      }else{
        // Error;
      }
    }
    var oldVal = clone(attr[pathComponents[pathComponents.length-1]]);
    attr[pathComponents[pathComponents.length-1]] = value;
    return oldVal;
  }

  /**
   * select an object node word, link or chunk)
   * @param depgraph
   * @param params
   */
  function selectObject(depgraph,params){
    if(depgraph.editObject.highlightMode){
      var value = !isObjectPermanentHighlighted(this);
      highlightObject(this,value,true);
      depgraph.editObject.setNeedToSave();
      return;
    }
    depgraph.editObject.selectObject(this);
  };
  
  depgraphlib.selectObject = function(depgraph,params){return selectObject(depgraph,params);};

  /**
   * undo callback for the default edit mode
   * @param depgraph
   * @param rollbackdata
   */
  function defaultUndo(depgraph,rollbackdata){
    if(rollbackdata.baseAction == 'linkRemoval'){
      var link = rollbackdata.link;
      var source = depgraph.getWordNodeByOriginalId(link.__data__['source']);
      var target = depgraph.getWordNodeByOriginalId(link.__data__['target']);
      addLink(depgraph,source,target,link.__data__.label,link.color,link.__data__['#id']);
    }else if(rollbackdata.baseAction == 'linkAddition'){
      removeLink(depgraph,rollbackdata.addedLink['#id']);
    }else if(rollbackdata.baseAction == 'wordAddition'){
      removeWord(depgraph,rollbackdata.addedWord['#id']);
    }else if(rollbackdata.baseAction == 'wordRemoval'){
      var word = rollbackdata.word;
      addWord(depgraph,word);
      if(rollbackdata.affectedLinks!=null){
        for(var i=0;i<rollbackdata.affectedLinks.length;i++){
          var link = rollbackdata.affectedLinks[i];
          var source = depgraph.getWordNodeByOriginalId(link['source']);
          var target = depgraph.getWordNodeByOriginalId(link['target']);
          link.color = link['#style']['link-color']?link['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];
          addLink(depgraph,source,target,link.label,link.color,link['#id']);
        }
      }
    }else if(rollbackdata.baseAction == 'changeAttr'){
      var id = rollbackdata.obj['#id'];
      var obj = depgraph.getObjectById(id);
      depgraph.editObject.changeAttributes(obj,rollbackdata.oldAttrs);
      depgraph.update();
      depgraph.postProcesses();
    }
  }

  /**
   * redo callback for the default edit mode
   * TODO(paul) implement this
   * @param depgraph
   * @param actionData
   */
  function defaultRedo(depgraph,actionData){
  }

  /**
   * key down handler callback for the default edit mode
   * @param depgraph
   * @param params
   * @returns
   */
  function editKeyDownDefault (depgraph,params){
    if(params.keyCode == 46){
      if(depgraph.editObject.previousSelectedObject!= null){
        if(isALink(depgraph.editObject.previousSelectedObject)){
          var link = clone(depgraph.editObject.previousSelectedObject);
          link.color = getStyleElement(depgraph.editObject.previousSelectedObject,'link-color','black');
          var success = removeLink(depgraph, depgraph.editObject.previousSelectedObject.__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          if(success){
            return {baseAction:'linkRemoval',link:link};
          }
        }else if(isAWord(depgraph.editObject.previousSelectedObject)){
          var word = clone(depgraph.editObject.previousSelectedObject.__data__);
          var affectedLinks = removeWord(depgraph,depgraph.editObject.previousSelectedObject.__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          return {baseAction:'wordRemoval',word:word,affectedLinks:affectedLinks};
        }
      }
    }

  }

  /**
   * show edit properties panel for an object node (word, link or chunk)
   * @param depgraph
   * @param obj
   */
  function showEditPanel(depgraph,obj){
    var coords = depgraph.viewer.screenCoordsForElt(obj[0]);
    var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
    var div = createEditPanel(depgraph,obj[0]);
    depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
  }
  
  depgraphlib.showEditPanel = function(depgraph,obj){return showEditPanel(depgraph,obj);};

  /**
   * fill in the edit properties panel for a link object
   * @param depgraph
   * @param editDiv
   * @param linkData
   * @returns
   */
  function populateLinkEditPanel(depgraph,editDiv,linkData){
    var color = (linkData['#style']!= null && linkData['#style']['link-color']!=null)?linkData['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];
    editDiv += '<tr><td>label</td><td><input type="text" name="label" value="'+linkData.label+'"></td></tr>';
    editDiv += '<tr><td>source</td><td>'+getOptionsListWords(depgraph,linkData.source)+'</td></tr>';
    editDiv += '<tr><td>target</td><td>'+getOptionsListWords(depgraph,linkData.target)+'</td></tr>';
    editDiv += '<tr><td>color</td><td>'+simpleColorPicker('colorPicker',color)+'</td></tr>';
    return editDiv;
  }

  /**
   * fill in the edit properties panel for a word object 
   * @param depgraph
   * @param editDiv
   * @param wordData
   * @returns
   */
  function populateWordEditPanel(depgraph,editDiv,wordData){
    var dataModel = depgraph.editObject.dataModel;
    if(!dataModel.words){
      dataModel.words = [];
      dataModel.words[0] = {name:'label'};
      for(var i =0 ;i< wordData.sublabel.length ; i++){
        dataModel.words[i+1] = {name: 'sublabel'+i};
      }
    }
    
    editDiv += '<tr><td>'+dataModel.words[0].name+'</td><td><input id="word-edit-' + dataModel.words[0].name + '" type="text" name="'+dataModel.words[0].name+'" value="'+wordData.label+'"></td></tr>';
/*    if(dataModel.words[0].values){
      $(document).ready(function(){
        $("#word-edit-" + dataModel.words[0].name).autocomplete({source: dataModel.words[0].values});}
      );
    }*/
    for(var i=1;i<dataModel.words.length ; i++){
      editDiv += '<tr><td>'+dataModel.words[i].name+'</td><td><input id="word-edit-' + dataModel.words[i].name + '" type="text" name="'+dataModel.words[i].name+'" value="'+wordData.sublabel[i-1]+'"></td></tr>';
    }
    return editDiv;
  }

  /**
   * simple color picker form
   * @param name
   * @param defaultColor
   * @returns {String}
   */
  function simpleColorPicker(name,defaultColor){
    var colorPicker = '<table><tr><td><input type="text" name="'+name+'" value="'+defaultColor+'" onkeydown="jQuery(jQuery(jQuery(this).parent().parent().children()[1]).children()[0]).css(\'background-color\',this.value+String.fromCharCode(event.keyCode));"></td><td><div style="display:inline-block; width:30px; height:30px; background-color:'+defaultColor+';"></div></td></tr></table>';
    return colorPicker;
  }

  /**
   * return a form of list of words
   * @param depgraph
   * @param selectedOriginalId
   * @returns {String}
   */
  function getOptionsListWords(depgraph,selectedOriginalId){
    var optionList = '<select>';
    for(var i=0;i<depgraph.data.graph.words.length;i++){
      var wordData = depgraph.data.graph.words[i];
      optionList += '<option value="'+wordData.id+'" ';
      optionList += ((wordData.id==selectedOriginalId)?'selected="true"':'');
      optionList += '>#' + wordData['#position'] + ' ' + wordData['label'] + ' (' + wordData.id +')';
      optionList += '</option>';
    }
    optionList += '</select>';
    
    return optionList;
  }
  
  /**
   * return a form of list of position for a newly added word
   */
  function getOptionsPosition(depgraph){
    var optionList = '<select>';
    for(var i=0;i<depgraph.data.graph.words.length+1;i++){
      var wordData = (i>0 && i<depgraph.data.graph.words.length+1)?depgraph.data.graph.words[i-1]:{label:'^'};
      var nextWordData = (i<depgraph.data.graph.words.length)?depgraph.data.graph.words[i]:{label:'$'};
      optionList += '<option value="'+i+'" ';
      optionList += '>#' + i + ' (' + wordData['label'] + ' x ' + nextWordData['label'] +')';
      optionList += '</option>';
    }
    optionList += '</select>';
    
    return optionList;
  }
  
  /**
   * create a panel to add a new word
   */
  function addWordPanel(depgraph){
    var html = '';
    html += '<div><h3>Add a new word</h3>';
    html += '<table><tr>';
    html += '<td><label>Label</label></td>';
    html += '<td><input type="text" name="label"></td></tr>';
    html += '<tr><td><label>Sublabels (separated by commas, use \\, for commas)</label></td>';
    html += '<td><input type="text" name="sublabels"></td></tr>';
    html += '<tr><td><label>Position</label></td>';
    html += '<td>'+getOptionsPosition(depgraph)+'</td></tr>';
    html += '</table></div>';
    return html;
  }

  /**
   * create the form allowing edition of properties of an object (word, link or chunk)
   * @param depgraph
   * @param obj
   * @returns
   */
  function createEditPanel(depgraph,obj){
    var data = obj.__data__;
    var klass = '';
    if(obj.classList != null && obj.classList.length > 0){
      klass = obj.classList[0];
    }
    
    var div = '<div>'
      +'<h3 id="edit-info-title">Edit '+klass+' (original id: '+data.id+')</h3>'
      +'<table class="main-properties-table" ref="'+data['#id']+'">';
    
    if(klass == 'word'){
      div = populateWordEditPanel(depgraph,div,data);
    }else if(klass == 'link'){
      div = populateLinkEditPanel(depgraph,div,data);
    }else{
      // TODO(paul) chunk case and error case
    }
    
    div += '</table>';
    div += '<input id="'+depgraph.viewer.appendOwnID(klass+'-save-properties')+'" type="button" value="Save" onclick="depgraphlib.saveProperties.call(this,arguments);">';
    div += '</div>';
    
    /*var div = '<div>'
      +'<h3 id="edit-info-title">Edit %Type (original id: %id)</h3>'
      +'<form name="input" action="">'
      +'Label: <input type="text" name="label" value="%label"><br>'
      +'Sublabels (split by comma or space): <input type="text" name="sublabel" value="%sublabel"><br>'
      +'Type : <select name="type">'
      +'<option value="volvo">Adj</option>'
      +'<option value="saab">Lex</option>'
      +'<option value="fiat" selected>Subst</option>'
      +'<option value="audi">Anchor</option>'
      +'<option value="audi">CoAnchor</option>'
      +'</select><br>'
      +'<input type="button" value="Save" onclick="GraphViewer.getInstance(this).hideToolTip();">'
      +'</form>'
      +'</div>';*/
    
    var jdiv = jQuery(div);
    return jdiv;
  }

  /**
   * save the properties entered in the edit properties panel of an object
   * update the graph
   */
  function saveProperties(){
    var type = this.id.substring(0,this.id.indexOf('-'));
    var depgraph = depgraphlib.DepGraph.getInstance(this);
    var viewer = depgraph.viewer;
    var form = jQuery(this).parent().find('table.main-properties-table');
    
    if(type == 'link'){
      saveLinkProperties(depgraph,form);
    }else if(type == 'word'){
      saveWordProperties(depgraph,form);
    }else {
      // TODO(paul) error or chunk case
    }
    
    depgraph.update();
    depgraph.postProcesses();
    var box = depgraphlib.Box.getBox(this);
    box.destroy();
  }
  
  depgraphlib.saveProperties = saveProperties;
  
  

  /**
   * save the properties for a link
   * @param depgraph
   * @param form
   */
  function saveLinkProperties(depgraph,form){
    var link = depgraph.getLinkById(form.attr('ref'));
    var rows = form[0].rows;
    var attrs = [];
    for(var i = 0 ; i < rows.length ; i++){
      var tr = rows[i];
      var cells = tr.cells;
      var label = cells[0].innerHTML;
      var value = cells[1];
      if(label == 'label'){
        attrs.push({path:'label',value:value.firstChild.value});
      }else if(label == 'color'){
        attrs.push({path:'#style/link-color',value:value.firstChild.rows[0].cells[0].firstChild.value});
      }else if(label == 'source'){
        attrs.push({path:'source',value:value.childNodes[0].options[value.childNodes[0].options.selectedIndex].value});
      }else if(label == 'target'){
        attrs.push({path:'target',value:value.childNodes[0].options[value.childNodes[0].options.selectedIndex].value});
      }else{
        // TODO(paul) handle error or extra field
      }
    }
    depgraph.editObject.changeAttributes(link,attrs,true);
  }

  /**
   * save the properties for a word
   * @param depgraph
   * @param form
   */
  function saveWordProperties(depgraph,form){
    var word = depgraph.getWordNodeById(form.attr('ref')).__data__;
    var rows = form[0].rows;
    var attrs = [];
    for(var i = 0 ; i < rows.length ; i++){
      var tr = rows[i];
      var cells = tr.cells;
      var label = cells[0].innerHTML;
      var value = cells[1];
      if(i == 0){
        attrs.push({path:'label',value:value.firstChild.value});
      }else {
        attrs.push({path:'sublabel/'+(i-1),value:value.firstChild.value});
      }
    }
    depgraph.editObject.changeAttributes(word,attrs,true);
  }

  /**
   * on word click callback for default edit mode
   * @param depgraph
   * @param params
   */
  function addLinkClick(depgraph,params){
    if(depgraph.editObject.previousSelectedObject == null || isALink(depgraph.editObject.previousSelectedObject)){
      selectObject.call(this,depgraph,params);
    }
    else{
      if(this.__data__['#id'] == depgraph.editObject.previousSelectedObject.__data__['#id']){ // don't create link when selecting twice the same node
        depgraph.editObject.clearSelection();
        return;
      }
      addLinkSettings(depgraph,depgraph.editObject.previousSelectedObject,this,params);
    }
  }

  /**
   * open a link creation panel
   * @param depgraph
   * @param obj1
   * @param obj2
   * @param params
   */
  function addLinkSettings(depgraph,obj1,obj2,params){
    var coords = depgraph.viewer.screenCoordsForElt(obj2);
    var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
    var div = '<div><table style="margin:5px 0px 0px 0px;">'
      + '<tr><td>Link name : </td>'
      +'<td><input type="text" name="link-name" value=""></td></tr>'
      + '<tr><td>Link color : </td>'
      +'<td><input type="text" name="link-color" value="black"></td></tr>'
    +'<tr><td colspant="2"><input id="link-settings'+depgraph.viewer.appendOwnID('')+'"  type="button" style="margin:0" value="Create Link"></td></tr>'
    +'</table></div>';
    div = jQuery(div);
    
    var box = depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
    
    depgraph.editObject.clearSelection();
    
    jQuery('#link-settings'+depgraph.viewer.appendOwnID('')).click(function(){
      var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
      var color = this.parentNode.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0].value;
      var link = addLink(depgraph,obj1,obj2,value,color);
      var action = {baseAction:'linkAddition',addedLink:link};
      depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordSelect',params:params}});
      box.destroy();
    });
    
  }

  /**
   * add a word
   * @param depgraph
   * @param wordData
   * @returns
   */
  function addWord(depgraph,wordData){
    var position = wordData['#position'];
    depgraph.insertWord(wordData,position);
    depgraph.editObject.init();
    depgraph.autoHighLightOnMouseOver();
    return clone(wordData);
  }

  /**
   * open a word creation panel
   * @param depgraph
   * @param element
   * @param offset
   */
  function addWordSettings(depgraph,element,offset){
    var coords = depgraph.viewer.screenCoordsForElt(element);
    var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
    var div = '<div><table style="margin:5px 0px 0px 0px;">'
      + '<tr><td>Word label : </td>'
      +'<td><input type="text" name="word-label" value=""></td></tr>'
    +'<tr><td colspant="2"><input id="word-settings'+depgraph.viewer.appendOwnID('')+'"  type="button" style="margin:0" value="Insert Word"></td></tr>'
    +'</table></div>';
    div = jQuery(div);
    var box = depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);

    depgraph.editObject.clearSelection();
    
    jQuery('#word-settings'+depgraph.viewer.appendOwnID('')).click(function(){
      var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
      if(value==null || value ==''){
        alert('you must fill all required fields');
        return;
      }
      var wordData = {label:value,sublabel:[],'#position':element.__data__['#position']+offset};
      var word = addWord(depgraph,wordData);
      var action = {baseAction:'wordAddition',addedWord:word};
      depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordContext',params:element}});
      box.destroy();
    });
    
  }

  /**
   * remove a word
   * @param depgraph
   * @param id
   * @returns
   */
  function removeWord(depgraph,id){
    var result = depgraph.removeWord(id);
    return result;
  }

  /**
   * add a link
   * @param depgraph
   * @param d1
   * @param d2
   * @param label
   * @param color
   * @param id
   * @returns {___link1}
   */
  function addLink(depgraph,d1,d2,label,color,id){
    if(color == null){
      color = 'black';
    }
    if(id == null){
      id = depgraph.id++;
    }
    d1 = d1.__data__;
    d2 = d2.__data__;
    var link = new Object();
    link.source = d1.id;
    link.target = d2.id;
    link['#style'] = {'link-color' :color};  
    link.label = label;
    link['#id'] = id;
    depgraph.addLink(link);
    depgraph.editObject.init();
    depgraph.autoHighLightOnMouseOver();
    return link;
  }

  /**
   * remove a link
   * @param depgraph
   * @param id
   * @returns
   */
  function removeLink(depgraph,id){
    var result = depgraph.removeLink(id);
    return result;
  }

  function isALink(obj){
    return obj.__data__.target != null && obj.__data__.source != null;
  }
  
  depgraphlib.isALink = function(obj){
    return isALink(obj);
  };

  function isAWord(obj){
    return obj.__data__['#position'] != null;
  }

  depgraphlib.isAWord = function(obj){
    return isAWord(obj);
  };
  
  function isAChunk(obj){
    return obj.elements != null;
  }

  depgraphlib.isAChunk = function(obj){
    return isAChunk(obj);
  };

}(window.depgraphlib = window.depgraphlib || {}, jQuery));