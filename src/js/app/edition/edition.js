/************************************************************/
/**                      Edition                           **/
/************************************************************/

/**
 * EditMode objects are bundles of callbacks used in edit mode.
 * @desc For more information see {@link DepGraphLib.EditObject.DefaultMode}
 * @typedef EditMode
 * 
 */

(function(depgraphlib){

      /**
       * @function init
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.init = function (depgraph){
        this.depgraph = depgraph; // reference to the graph
        
        this.editMode = false; // on/off boolean for edition
        this.mode = [];
        this.highlightMode = false;
        this.dataModel = {};
        
        this.previousSelectedObject = null; // last selected object
        this.actionsLog = []; // action log for rollback purposes
        this.currentPtr = -1; // pointer to the log if undo commands have been used
        this.lastSavedPtr = -1;
        this.keysDown = []; // array of key that are currently down
        
        this.addEditMode(depgraphlib.EditObject.DefaultMode);
      };
      
      /**
       * @function setDataModel
       * @desc
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
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.setDataModel = function(dataModel){
        this.dataModel = dataModel;
      };

      /**
       * @function dataChanged
       * @desc returns true if data is different from original 
       * difference is computed by watching if edit actions has been logged
       * and if the current pointer on the action is equal to the pointer of the last saved state
       * @memberof DepGraphLib.EditObject#
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
       * @function addEditMode
       * @desc add an edit mode
       * @param {object} mode - an edit mode
       * @see DepGraphLib.EditObject.DefaultMode
       * @memberof DepGraphLib.EditMode#
       */
      depgraphlib.EditObject.prototype.addEditMode = function(mode){
        this.mode[mode.name] = mode;
      };

      /**
       * @function setEditMode
       * @desc Enable or disable an edit mode.
       * @param {string} value - the name of an editmode defined in a editmode object
       * that was previously added (see {@link DepGraphLib.EditMode#addEditMode})
       * @memberof DepGraphLib.EditMode#
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
        this.editModeInit();
        this.initToolbar();
        
      };

      /**
       * @function initToolbar
       * @desc init the toolbar with the current edit mode
       * @memberof DepGraphLib.EditMode#
       */
      depgraphlib.EditObject.prototype.initToolbar = function(){
        var depgraph = this.depgraph;
        depgraph.viewer.resetToolbarItems();
        var buttons = [
                       {name:'undo',callback:undo,style:'undo',group:'control'},
                       {name:'redo',callback:redo,style:'redo',group:'control'},
                       {name:'highlight',callback:highlightmode,style:'highlightoff'},
                       {name:'export',callback:exportData,style:'export',group:'0'},
                       {name:'save',callback:save,style:'saved',group:'0'},
                       ];

        if(this.mode[this.editMode].buttons != null){
          for(button in this.mode[this.editMode].buttons){
            buttons.push(button);
          }
        }
        
        depgraph.viewer.addToolbarItems(buttons);
        if(this.currentPtr < 0 || this.mode[this.editMode].undo == null){
          depgraph.viewer.setToolbarItemActive('undo',false);
        }
        if(this.currentPtr == this.actionsLog.length-1 || this.mode[this.editMode].redo == null){
          depgraph.viewer.setToolbarItemActive('redo',false);
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
            depgraph.viewer.setToolbarItemState('highlight',true);
          }else{
            depgraph.viewer.setToolbarItemState('highlight',false);
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
            depgraph.viewer.setToolbarItemActive('undo',false);
          }
          var action = depgraph.editObject.actionsLog[depgraph.editObject.currentPtr];
          if(me.mode[action.mode].undo != null){
            me.mode[action.mode].undo.call(me,depgraph,action.rollbackdata);
          }
          depgraph.editObject.currentPtr--;
          if(me.mode[action.mode].redo != null){
            depgraph.viewer.setToolbarItemActive('redo',true);
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
            depgraph.viewer.setToolbarItemActive('redo',false);
          }
          var action = depgraph.editObject.actionsLog[depgraph.editObject.currentPtr];
          if(me.mode[action.mode].redo != null){
            me.mode[action.mode].redo.call(me,depgraph,action.rollbackdata);
          }
          depgraph.viewer.setToolbarItemActive('undo',true);
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
//              window.open('edit/export/'+format);
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
       * @function setNeedToSave
       * @desc set the need the save icon to display a unsaved state
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.setNeedToSave = function(){
        this.needToSaveState = true;
        this.updateSaveState();
      };

      /**
       * @function updateSaveState
       * @desc
       * update the save state depending on the last saved pointer and the current pointer in the actions log
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.updateSaveState =function(){
        if(this.lastSavedPtr == this.currentPtr && !this.needToSaveState){
          this.depgraph.viewer.getToolbarItem('save').button.removeClass('save').addClass('saved');
        }else{
          this.depgraph.viewer.getToolbarItem('save').button.removeClass('saved').addClass('save');
        }
      };
      
      /**
       * @function editModeInit
       * @desc
       * init the edit object according to the current edit mode
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.editModeInit = function(){
        var depgraph = this.depgraph;

        if(this.mode[this.editMode].onInit){
          this.mode[this.editMode].onInit.call(this,depgraph);
        }
        
        if(!this.editMode){
          this.depgraph.vis.selectAll('g.word').on("click",null);
          this.depgraph.vis.selectAll('g.link').on("click",null);
          this.depgraph.vis.selectAll('g.chunk').on("click",null);
          d3.select(document).on('keydown.edit'+this.depgraph.viewer.uid,null);
          this.depgraph.viewer.resetToolbarItems();
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
        d3.select(document).on('keypress.edit'+this.depgraph.viewer.uid,onKeyPress);
        d3.select(document).on('keyup.edit'+this.depgraph.viewer.uid,onKeyUp);
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
        if(this.mode[this.editMode].onGlobalContext != null){
          var def = {};
          for(menu in this.mode[this.editMode].onGlobalContext){
            def[menu] = {
              menu : menu,
              click: function(element) {  // element is the jquery obj clicked on when context menu launched
                onContextClick('onGlobalContext',this,element);
              },
              klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
            };
          }
          jQuery(this.depgraph.svg.node()).contextMenu('main-menu',def);
        }

        
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
          me.keysDown.push(d3.event.keyCode);
          if(me.mode[me.editMode].onKeyDown != null){
            var action = me.mode[me.editMode].onKeyDown.call(this,depgraph,{keyCode :d3.event.keyCode});
            me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onKeyDown',params:{keyCode :d3.event.keyCode}}});
          }
        }
        
        function onKeyPress(e){
          var me = depgraph.editObject;
          if(me.mode[me.editMode].onKeyPress != null){
            var action = me.mode[me.editMode].onKeyPress.call(this,depgraph,{keyCode :d3.event.keyCode});
            me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onKeyPress',params:{keyCode :d3.event.keyCode}}});
          }
        }
        
        function onKeyUp(e){
          var me = depgraph.editObject;
          var index = me.keysDown.indexOf(d3.event.keyCode);
          if(index != -1){
            me.keysDown.splice(index,1);
          }
          if(me.mode[me.editMode].onKeyUp != null){
            var action = me.mode[me.editMode].onKeyUp.call(this,depgraph,{keyCode :d3.event.keyCode});
            me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onKeyUp',params:{keyCode :d3.event.keyCode}}});
          }
        }
      };


      /**
       * @function pushAction
       * @desc push an action to the action log
       * the action must contain sufficient information for the undo/redo callback of the edit mode to
       * perform rollback actions
       * if the rollbackdata isn't set, the action won't be registered
       * @param {object} action
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.pushAction = function(action){
        if(action.rollbackdata != null && this.mode[action.mode].undo != null){
          this.depgraph.viewer.setToolbarItemActive('redo',false);
          this.depgraph.viewer.setToolbarItemActive('undo',true);// TODO not to do everytime!
           
          this.actionsLog.splice(++this.currentPtr,this.actionsLog.length-this.currentPtr,action);
          this.updateSaveState();
        }
      };

      /**
       * @function clearSelection
       * @desc clear current selection
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.clearSelection = function(){
        if(this.previousSelectedObject != null){
          try {
            this.previousSelectedObject.selected = false;
            depgraphlib.DepGraph.highlightObject(this.previousSelectedObject,false); // sometimes the object doesn't exist anymore.
          }catch(e){
            
          }
          this.previousSelectedObject = null;
        }
      };

      /**
       * @funciton selectObject
       * @desc select an object node (word, chunk or link)
       * @param obj
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.selectObject =function(obj){
        if(this.previousSelectedObject == obj){
          this.clearSelection();
          return;
        }
        this.clearSelection();
        this.previousSelectedObject = obj;
        depgraphlib.DepGraph.highlightObject(this.previousSelectedObject,true);
        obj.selected = true;
      };

      /**
       * @function changeAtrributes
       * @desc change attributes of a object (link, chunk or word)
       * push the change in the action log
       * @param obj
       * @param attrs
       * @param pushAction
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.changeAttributes = function(obj,attrs,pushAction){
        var backup = depgraphlib.clone(obj);
        var oldAttrs = [];
        for(var i = 0; i < attrs.length ; i ++){
          var oldVal = depgraphlib.setAttrPath(obj,attrs[i].path,attrs[i].value);
          oldAttrs.push({path:attrs[i].path,value:oldVal});
        }
        if(pushAction != null && pushAction){
          var action = {mode:this.editMode,rollbackdata:{baseAction:'changeAttr',obj:backup,attrs:attrs,oldAttrs:oldAttrs,newAttrs:attrs}};
          this.pushAction(action);
        }
      };

      
      /**
       * @function addEditModeSwitcher
       * @desc Append a toolbar button allowing user to choose an edit mode among those registered
       * @todo rework this!
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.addEditModeSwitcher = function(){
        var me = this;
        this.depgraph.viewer.addToolbarItem({name:'Custom Edit Mode',callback:function(){
          var r=confirm("You will not be able to get back to frmg edit mode, are you sure you want to edit manually the graph?");
          if (r==true){
            depgraphlib.hideAltLinks(me.depgraph,me.depgraph.editObject.previousSelectedObject);
            me.setEditMode('default');
          }
        },style:'default-edit'});
      };

      
      /**
       * This callback is displayed as part of the EditObject class.
       * @callback DepGraphLib.EditObject~objectselect
       * @param {DepGraphLib.DepGraph} depgraph - The current graph being edited  
       * @param {object<DepGraphWord,number>|object<DepGraphLink,number>|object<DepGraphChunk,number>} params - the object being selected and its index
       */


      
      
  
}(window.depgraphlib));
