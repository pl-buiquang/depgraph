(function(depgraphlib){
  /**
   * @namespace DefaultModeLib
   * 
   * @desc the default edit mode function library.
   * 
   * @memberof DepGraphLib.EditObject
   */
  depgraphlib.EditObject.DefaultModeLib = {
      
      /**
       * @function init
       * @memberof DepGraphLib.EditObject.DefaultModeLib 
       */
      init : null,
  
      /**
       * @function save
       * @desc on save callback for default mode (implemented for mgwiki).
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      save : function(depgraph){
        var ddata = depgraph.cleanData();
        jQuery.ajax({
          type: 'POST', 
          url: depgraph.wsurl,
          data: {
            action:'save',
            format:depgraph.dataFormat,
            options: '',
            data:ddata,
            uid:depgraph.options.uid
          },
          dataType : 'json',
          success: function(data, textStatus, jqXHR) {
            depgraph.editObject.lastSavedPtr = depgraph.editObject.currentPtr;
            depgraph.editObject.needToSaveState = false;
            depgraph.editObject.updateSaveState();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
          }
        });
      },
      
      
      
      /**
       * @function addLinkClick
       * @desc on word click callback for default edit mode
       * add a link if a previous selection was a word,
       * select a word otherwise
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {object.<object,number>} params - the graph data of the selected link and its index
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addLinkClick : function(depgraph,params){
        if(depgraph.editObject.previousSelectedObject == null || depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
          depgraphlib.EditObject.DefaultModeLib.selectObject.call(this,depgraph,params);
        }
        else{
          if(d3.event.ctrlKey){ // ctrl key is pressed 
            if(depgraphlib.isAWord(depgraph.editObject.previousSelectedObject) && depgraphlib.isAWord(this)){
              depgraphlib.EditObject.DefaultModeLib.addChunkSettings(depgraph,depgraph.editObject.previousSelectedObject,this,params);
            }
          }else{
            if(this.__data__['#id'] == depgraph.editObject.previousSelectedObject.__data__['#id']){ // don't create link when selecting twice the same node
              depgraph.editObject.clearSelection();
              return;
            }
            depgraphlib.EditObject.DefaultModeLib.addLinkSettings(depgraph,depgraph.editObject.previousSelectedObject,this,params);
          }
        }
      },
      
      /**
       * @function selectObject
       * @desc select an object node word, link or chunk
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {object.<object,number>} params - the graph data of the selected link and its index
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      selectObject : function(depgraph,params){
        if(depgraph.editObject.highlightMode){
          var value = !depgraphlib.isObjectPermanentHighlighted(this);
          depgraphlib.DepGraph.highlightObject(this,value,true);
          depgraph.editObject.setNeedToSave();
          return;
        }
        depgraph.editObject.selectObject(this);
      },
      
      /**
       * @function editKeyDownDefault
       * @desc key down handler callback for the default edit mode
       * @param depgraph
       * @param params
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      editKeyDownDefault  : function(depgraph,params){
        if(depgraph.editObject.keysDown.indexOf(17) != -1){
          if(params.keyCode == 90){
            depgraph.editObject.undo();
          }
        }
        if(params.keyCode == 46){
          if(depgraph.editObject.previousSelectedObject!= null){
            if(depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
              var link = depgraphlib.clone(depgraph.editObject.previousSelectedObject.__data__);
              link.color = depgraphlib.getStyleElement(depgraph.editObject.previousSelectedObject,'link-color','black');
              var success = depgraph.removeLink(depgraph.editObject.previousSelectedObject.__data__['#id']);
              depgraph.editObject.previousSelectedObject = null;
              if(success){
                return {baseAction:'linkRemoval',link:link};
              }
            }else if(depgraphlib.isAWord(depgraph.editObject.previousSelectedObject)){
              var word = depgraphlib.clone(depgraph.editObject.previousSelectedObject.__data__);
              var affectedLinks = depgraph.removeWord(depgraph.editObject.previousSelectedObject.__data__['#id']);
              depgraph.editObject.previousSelectedObject = null;
              return {baseAction:'wordRemoval',word:word,affectedLinks:affectedLinks};
            }else if(depgraphlib.isAChunk(depgraph.editObject.previousSelectedObject)){
              var chunk = depgraphlib.clone(depgraph.editObject.previousSelectedObject.__data__);
              var affectedLinks = depgraph.removeChunk(depgraph.editObject.previousSelectedObject.__data__['#id']);
              depgraph.editObject.previousSelectedObject = null;
              return {baseAction:'chunkRemoval',chunk:chunk,affectedLinks:affectedLinks};
            }
          }
        }

      },
      
      
      /**
       * @function defaultUndo
       * @desc undo callback for the default edit mode
       * @param depgraph
       * @param rollbackdata
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      defaultUndo : function(depgraph,rollbackdata){
        if(rollbackdata.baseAction == 'linkRemoval'){
          var link = rollbackdata.link;
          var source = depgraph.getObjectNodeByOriginalId(link['source']);
          var target = depgraph.getObjectNodeByOriginalId(link['target']);
          depgraph.addLink(source,target,link.label,link.color,link['#id']);
        }else if(rollbackdata.baseAction == 'linkAddition'){
          depgraph.removeLink(rollbackdata.addedLink['#id']);
        }else if(rollbackdata.baseAction == 'wordAddition'){
          depgraph.removeWord(rollbackdata.addedWord['#id']);
        }else if(rollbackdata.baseAction == 'wordRemoval'){
          var word = rollbackdata.word;
          depgraph.addWord(word);
          if(rollbackdata.affectedLinks!=null){
            for(var i=0;i<rollbackdata.affectedLinks.length;i++){
              var link = rollbackdata.affectedLinks[i];
              var source = depgraph.getObjectNodeByOriginalId(link['source']);
              var target = depgraph.getObjectNodeByOriginalId(link['target']);
              link.color = (link['#style'] && link['#style']['link-color'])?link['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];
              depgraph.addLink(source,target,link.label,link.color,link['#id']);
            }
          }
        }else if(rollbackdata.baseAction == 'changeAttr'){
          var id = rollbackdata.obj['#id'];
          var obj = depgraph.getObjectById(id);
          depgraph.editObject.changeAttributes(obj,rollbackdata.oldAttrs);
          depgraph.update();
        }else if(rollbackdata.baseAction == 'chunkAddition'){
          depgraph.removeChunk(rollbackdata.addedChunk['#id']);
        }else if(rollbackdata.baseAction == 'chunkRemoval'){
          var chunk = rollbackdata.chunk;
          chunk.color = (chunk['#style'] && chunk['#style']['background-color'])?chunk['#style']['background-color']:depgraph.data.graph['#chunk-style']['background-color'];
          depgraph.addChunk(chunk.label,chunk.elements,chunk.sublabels,chunk.color,chunk.id,chunk['#id']);
          if(rollbackdata.affectedLinks!=null){
            for(var i=0;i<rollbackdata.affectedLinks.length;i++){
              var link = rollbackdata.affectedLinks[i];
              var source = depgraph.getObjectNodeByOriginalId(link['source']);
              var target = depgraph.getObjectNodeByOriginalId(link['target']);
              link.color = (link['#style'] && link['#style']['link-color'])?link['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];
              depgraph.addLink(source,target,link.label,link.color,link['#id']);
            }
          }
        }
      },

      /**
       * @function defaultRedo
       * @desc redo callback for the default edit mode
       * TODO(paul) implement this
       * @param depgraph
       * @param actionData
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       defaultRedo : function(depgraph,actionData){
         if(actionData.baseAction == 'linkAddition'){
           var link = actionData.addedLink;
           depgraph.insertLink(link);
         }else if(actionData.baseAction == 'linkRemoval'){
           depgraph.removeLink(actionData.link['#id']);
         }else if(actionData.baseAction == 'wordRemoval'){
           depgraph.removeWord(actionData.word['#id']);
         }else if(actionData.baseAction == 'wordAddition'){
           var word = actionData.addedWord;
           depgraph.addWord(word);
         }else if(actionData.baseAction == 'changeAttr'){
           var id = actionData.obj['#id'];
           var obj = depgraph.getObjectById(id);
           depgraph.editObject.changeAttributes(obj,actionData.newAttrs);
           depgraph.update();
         }else if(actionData.baseAction == 'chunkRemoval'){
           depgraph.removeChunk(actionData.chunk['#id']);
         }else if(actionData.baseAction == 'chunkAddition'){
           var chunk = actionData.addedChunk;
           chunk.color = (chunk['#style'] && chunk['#style']['background-color'])?chunk['#style']['background-color']:depgraph.data.graph['#chunk-style']['background-color'];
           depgraph.addChunk(chunk.label,chunk.elements,chunk.sublabels,chunk.color,chunk.id,chunk['#id']);
         }
      },

      
      /**
       * @function addNewWord
       * @param depgraph
       * @param obj
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addNewWord : function(depgraph,obj){
        var coords = depgraph.viewer.screenCoordsForElt(obj[0]);
        var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
        var div = jQuery(depgraphlib.EditObject.DefaultModeLib.addWordPanel(depgraph));
        
        depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
      },
      
      /**
       * @function showEditPanel
       * @desc show edit properties panel for an object node (word, link or chunk)
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param obj
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      showEditPanel : function(depgraph,obj,viewonly){
        var coords = depgraph.viewer.screenCoordsForElt(obj[0]);
        var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
        var div = depgraphlib.EditObject.DefaultModeLib.createEditPanel(depgraph,obj[0],viewonly);
        depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
      },
      

      /**
       * @function createCreationPanel
       * @param  {[type]} depgraph [description]
       * @param  {[type]} type     [description]
       * @return {[type]}          [description]
       */
      createCreationPanel : function(depgraph,type){
        var data = {};
        var klass = type;
        if(obj.classList != null && obj.classList.length > 0){
          klass = obj.classList[0];
        }
        
        var div = '<div><div id="'+depgraph.viewer.appendOwnID(klass+'-save-properties-div')+'" onkeydown="if (event.keyCode == 13) {depgraphlib.EditObject.DefaultModeLib.saveProperties.call(this,arguments);}">'
          +'<h3 id="edit-info-title">Edit '+klass+' (original id: '+data.id+')</h3>'
          +'<table class="main-properties-table" ref="'+data['#id']+'">';
        
        if(klass == 'word'){
          div = depgraphlib.EditObject.DefaultModeLib.populateWordEditPanel(depgraph,div,data);
        }else if(klass == 'link'){
          div = depgraphlib.EditObject.DefaultModeLib.populateLinkEditPanel(depgraph,div,data);
        }else if(klass == 'chunk'){
          div = depgraphlib.EditObject.DefaultModeLib.populateChunkEditPanel(depgraph,div,data);
        }else{
          throw 'unknown object type : "' + klass + '"';
        }
        
        div += '</table>';
        div += '<input id="'+depgraph.viewer.appendOwnID(klass+'-save-properties')+'" type="button" value="Save" onclick="depgraphlib.EditObject.DefaultModeLib.saveProperties.call(this,arguments);">';
        div += '</div></div>';
        
        
        var jdiv = jQuery(div);

        return jdiv;
      },

      /**
       * @function createEditPanel
       * @desc create the form allowing edition of properties of an object (word, link or chunk)
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {object} obj - the d3js node element
       * @return {object} a jquery selection of an edition panel
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       createEditPanel : function(depgraph,obj,viewonly){
        var data = obj.__data__;
        var klass = '';
        if(obj.classList != null && obj.classList.length > 0){
          klass = obj.classList[0];
        }
        
        var div = '<div><div id="'+depgraph.viewer.appendOwnID(klass+'-save-properties-div')+'" onkeydown="if (event.keyCode == 13) {depgraphlib.EditObject.DefaultModeLib.saveProperties.call(this,arguments);}">'
          +'<h3 id="edit-info-title">Edit '+klass+' (original id: '+data.id+')</h3>'
          +'<table class="main-properties-table" ref="'+data['#id']+'">';
        
        if(klass == 'word'){
          div = depgraphlib.EditObject.DefaultModeLib.populateWordEditPanel(depgraph,div,data);
        }else if(klass == 'link'){
          div = depgraphlib.EditObject.DefaultModeLib.populateLinkEditPanel(depgraph,div,data);
        }else if(klass == 'chunk'){
          div = depgraphlib.EditObject.DefaultModeLib.populateChunkEditPanel(depgraph,div,data);
        }else{
          throw 'unknown object type : "' + klass + '"';
        }
        
        div += '</table>';
        if(!viewonly){
          div += '<input id="'+depgraph.viewer.appendOwnID(klass+'-save-properties')+'" type="button" value="Save" onclick="depgraphlib.EditObject.DefaultModeLib.saveProperties.call(this,arguments);">';
        }
        div += '</div></div>';
        
        
        var jdiv = jQuery(div);
        if(viewonly){
          jdiv.find('select,input').attr('disabled',true);
        }
        // typeahead autocomplete
        /*var substringMatcher = function(strs) {
          return function findMatches(q, cb) {
          var matches, substringRegex;
           
          // an array that will be populated with substring matches
          matches = [];
           
          // regex used to determine if a string contains the substring `q`
          substrRegex = new RegExp(q, 'i');
           
          // iterate through the pool of strings and for any string that
          // contains the substring `q`, add it to the `matches` array
          jQuery.each(strs, function(i, str) {
          if (substrRegex.test(str)) {
          // the typeahead jQuery plugin expects suggestions to a
          // JavaScript object, refer to typeahead docs for more info
          matches.push({ value: str });
          }
          });
           
          cb(matches);
          };
        };
        for (var i = dataModel.length - 1; i >= 0; i--) {
          if(dataModel[i].values){
            var vals = depgraphlib.clone(dataModel[i].values);
            jdiv.find('#'+klass+'-edit-'+dataModel[i].name).typeahead({
            hint: true,
            highlight: true,
            minLength: 1
            },
            {
            name: dataModel[i].name,
            displayKey: 'value',
            source: substringMatcher(vals)
            });
          }
        };*/

        return jdiv;
      },

      /**
       * @function populateLinkEditPanel
       * @desc fill in the edit properties panel for a link object
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {string} editDiv - the html string that will become a panel
       * @param {DepGraphLink} linkData - the link
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       populateLinkEditPanel : function(depgraph,editDiv,linkData){
        var color = (linkData['#style']!= null && linkData['#style']['link-color']!=null)?linkData['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];

        var dataModel = depgraph.editObject.dataModel;
        if(!dataModel){
          depgraph.editObject.setDefaultDataModel();
          dataModel = depgraph.editObject.dataModel;
        }
        
        if(dataModel.links && dataModel.links[0].name == 'label' && dataModel.links[0].values){
          editDiv += depgraphlib.ui.addCustomField('label',depgraphlib.EditObject.DefaultModeLib.getOptionsListValues(depgraph,depgraphlib.getValue(linkData,linkData.label),'#data/label',dataModel.links[0].values));  
        }else{
          editDiv += depgraphlib.ui.addTextField('label',{id:'link-edit-label',name:'label',value:depgraphlib.getValue(linkData,linkData.label),'data-rel':'#data/label'});  
        }
        
        editDiv += depgraphlib.ui.addCustomField('source',depgraphlib.EditObject.DefaultModeLib.getOptionsListWordsAndChunks(depgraph,linkData.source,'source'));
        editDiv += depgraphlib.ui.addCustomField('target',depgraphlib.EditObject.DefaultModeLib.getOptionsListWordsAndChunks(depgraph,linkData.target,'target'));
        editDiv += depgraphlib.ui.addCustomField('color',depgraphlib.ui.simpleColorPicker('colorPicker',color,'#style/link-color'));
        return editDiv;
      },
      
      /**
       * @function populateWordEditPanel
       * @desc fill in the edit properties panel for a word object 
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {string} editDiv - the html string that will become a panel
       * @param {DepGraphWord} wordData - the word
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       populateWordEditPanel : function(depgraph,editDiv,wordData){
        var dataModel = depgraph.editObject.dataModel;
        if(!dataModel){
          depgraph.editObject.setDefaultDataModel();
          dataModel = depgraph.editObject.dataModel;
        }
        
        
        for(var i=0;i<dataModel.words.length ; i++){
          var value;
          var data_rel;
          value = (wordData['#data'])?(wordData['#data'][dataModel.words[i].name] || ''):'';
          data_rel = '#data/'+dataModel.words[i].name;
          if(dataModel.words[i].values){
            editDiv += depgraphlib.ui.addCustomField(dataModel.words[i].name,depgraphlib.EditObject.DefaultModeLib.getOptionsListValues(depgraph,value,data_rel,dataModel.words[i].values));
          }else{
            editDiv += depgraphlib.ui.addTextField(dataModel.words[i].name,{
              'id' : 'word-edit-' + dataModel.words[i].name,
              'data-rel':data_rel,
              'name':dataModel.words[i].name,
              'value':value,
            });  
          }
        }
        return editDiv;
      },


      populateChunkEditPanel : function (depgraph,editDiv,chunkData){
        var dataModel = depgraph.editObject.dataModel;
        if(!dataModel){
          depgraph.editObject.setDefaultDataModel();
          dataModel = depgraph.editObject.dataModel;
        }
        
        
        
        var chunkRange = depgraph.getChunkRange(chunkData);
        var chunkRangeField = depgraphlib.ui.addCustomField('first element',depgraphlib.EditObject.DefaultModeLib.getOptionsListWords(depgraph,chunkRange.firstElement.id,'first-element'));
        chunkRangeField += depgraphlib.ui.addCustomField('last element',depgraphlib.EditObject.DefaultModeLib.getOptionsListWords(depgraph,chunkRange.lastElement.id,'last-element'));
        editDiv += depgraphlib.ui.groupFields('Elements Range',{'name':'chunkRange','data-rel':'elements'},chunkRangeField);
        
        var bgcolor = (chunkData['#style'] && chunkData['#style']['background-color'])?chunkData['#style']['background-color']:depgraph.data.graph['#chunk-style']['background-color'];
        editDiv += depgraphlib.ui.addCustomField('color',depgraphlib.ui.simpleColorPicker('colorPicker',bgcolor,'#style/background-color'));

    /*    if(dataModel.words[0].values){
          $(document).ready(function(){
            $("#word-edit-" + dataModel.words[0].name).autocomplete({source: dataModel.words[0].values});}
          );
        }*/
        for(var i=0;i<dataModel.chunks.length ; i++){
          var value;
          var data_rel;
          value = (wordData['#data'])?chunkData['#data'][dataModel.chunks[i].name]:'';
          data_rel = '#data/'+dataModel.chunks[i].name;
          /*if(dataModel.chunks[i].hidden){
            
          }else{
            value = depgraphlib.getValue((chunkData.sublabel[sublabel_index]) || '';
            data_rel = 'sublabel/'+sublabel_index;
            sublabel_index++;
          }*/
          editDiv += depgraphlib.ui.addTextField(dataModel.chunks[i].name,{
            'id' : 'chunk-edit-' + dataModel.chunks[i].name,
            'data-rel':data_rel,
            'name':dataModel.chunks[i].name,
            'value':value,
          });
        }
        return editDiv;
      },






      /**
       * @function saveProperties
       * 
       * @desc save the properties entered in the edit properties panel of an object
       * update the graph
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      saveProperties : function(){
        var depgraph = depgraphlib.DepGraph.getInstance(this);
        var form = jQuery(this).parent().find('table.main-properties-table');
        var obj = depgraph.getObjectById(form.attr('ref'));
        var rows = form[0].rows;
        var attrs = [];
        for(var i = 0 ; i < rows.length ; i++){
          var tr = rows[i];
          var cells = tr.cells;
          //var label = cells[0].firstChild.innerHTML;
          var value_form = cells[1].firstChild;
          var value;
          var path;
          var inputType = value_form.nodeName.toUpperCase();
          if(!value_form.getAttribute('data-rel')){
            throw 'missing attribute data-rel in edit form';
          }else{
            path = value_form.getAttribute('data-rel');
          }
          if(inputType == 'SELECT'){
            value = value_form.options[value_form.options.selectedIndex].value;
          }else if(inputType == 'INPUT'){
            value = value_form.value;
          }else {
            if(value_form.getAttribute('name') == 'simpleColorPicker'){
              value = value_form.firstChild.rows[0].cells[0].firstChild.value;
            }else if(value_form.getAttribute('name') == 'chunkRange'){
              var i1 = value_form.firstChild.rows[0].cells[1].firstChild.options.selectedIndex;
              var firstElement = value_form.firstChild.rows[0].cells[1].firstChild.options[i1].value;
              var i2 = value_form.firstChild.rows[1].cells[1].firstChild.options.selectedIndex;
              var lastElement = value_form.firstChild.rows[1].cells[1].firstChild.options[i2].value;
              value = [firstElement,lastElement];
            }
            else{
              throw 'unknown form element';
            }
          }
          attrs.push({path:path,value:value});
        }
        depgraph.editObject.changeAttributes(obj,attrs,true);
        depgraph.update();
        var box = depgraphlib.Box.getBox(this);
        box.close(true);
      },
      
 

      /**
       * @function addChunkSettings
       * @param depgraph
       * @param obj1
       * @param obj2
       * @param params
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addChunkSettings : function(depgraph,obj1,obj2,params){
        var coords = depgraph.viewer.screenCoordsForElt(obj2);
        var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
        var div = '<div><table style="margin:5px 0px 0px 0px;">';
        div += depgraphlib.ui.addTextField('Chunk name :',{
          name:'chunk-name',
          'data-ref':'label',
        });
        div += '<tr><td colspant="2"><input id="chunk-settings'+depgraph.viewer.appendOwnID('')+'"  type="button" style="margin:0" value="Create Chunk"></td></tr>';
        div +='</table></div>';
        div = jQuery(div);
        
        var box = depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
        
        depgraph.editObject.clearSelection();
        
        jQuery('#chunk-settings'+depgraph.viewer.appendOwnID('')).click(function(){
          var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
          var chunk = depgraph.addChunk(value,[obj1.__data__.id,obj2.__data__.id]);
          var action = {baseAction:'chunkAddition',addedChunk:chunk};
          depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordSelect',params:params}});
          box.close(true);
        });
        
        
      },

      /**
       * @function getOptionsListValues
       * @desc return a form of list of defined values
       * @param  {[type]} depgraph           [description]
       * @param  {[type]} selectedOriginalId [description]
       * @param  {[type]} data_rel           [description]
       * @param {string} values [description]
       * @return {[type]}                    [description]
       */
      getOptionsListValues : function(depgraph,selectedOriginalValue,data_rel,values){
        var optionList = '<select data-rel="'+data_rel+'">';
        optionList += '<option '+((!selectedOriginalValue)?'selected="true"':'')+'></option>'
        for(var i=0;i<values.length;i++){
          var selected = values[i]==selectedOriginalValue;
          optionList += '<option value="'+values[i]+'" ';
          optionList += ((selected)?'selected="true"':'');
          optionList += '>'+values[i];
          optionList += '</option>';
        }
        optionList += '</select>';
        
        return optionList;
      },
      
      /**
       * @function getOptionsListWords
       * @desc return a form of list of words
       * @param depgraph
       * @param selectedOriginalId
       * @returns {String}
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      getOptionsListWords : function(depgraph,selectedOriginalId,data_rel){
        var optionList = '<select data-rel="'+data_rel+'">';
        for(var i=0;i<depgraph.data.graph.words.length;i++){
          var wordData = depgraph.data.graph.words[i];
          optionList += '<option value="'+wordData.id+'" ';
          optionList += ((wordData.id==selectedOriginalId)?'selected="true"':'');
          optionList += '>#' + wordData['#position'] + ' ' + depgraphlib.getValue(wordData,wordData['label']) + ' (' + wordData.id +')';
          optionList += '</option>';
        }
        optionList += '</select>';
        
        return optionList;
      },
      
      /**
       * @function getOptionsListWordsAndChunks
       * @desc return the form select element listing all words and chunks
       * @param depgraph
       * @param selectedOriginalId
       * @param data_rel
       * @returns {String}
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      getOptionsListWordsAndChunks : function(depgraph,selectedOriginalId,data_rel){
        var optionList = '<select data-rel="'+data_rel+'">';
        for(var i=0;i<depgraph.data.graph.words.length;i++){
          var wordData = depgraph.data.graph.words[i];
          optionList += '<option value="'+wordData.id+'" ';
          optionList += ((wordData.id==selectedOriginalId)?'selected="true"':'');
          optionList += '>#' + wordData['#position'] + ' ' + depgraphlib.getValue(wordData,wordData['label']) + ' (' + wordData.id +')';
          optionList += '</option>';
        }
        for(var i=0;i<depgraph.data.graph.chunks.length;i++){
          var chunkData = depgraph.data.graph.chunks[i];
          optionList += '<option value="'+chunkData.id+'" ';
          optionList += ((chunkData.id==selectedOriginalId)?'selected="true"':'');
          optionList += '>c#' + i + ' ' + depgraphlib.getValue(chunkData,chunkData['label']) + ' (' + chunkData.id +')';
          optionList += '</option>';
        }
        optionList += '</select>';
        
        return optionList;
      },
      
      /**
       * @function getOptionsPosition
       * @desc return a form of list of position for a newly added word
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      getOptionsPosition : function(depgraph,data_rel){
        var optionList = '<select data-rel="'+data_rel+'">';
        for(var i=0;i<depgraph.data.graph.words.length+1;i++){
          var wordData = (i>0 && i<depgraph.data.graph.words.length+1)?depgraph.data.graph.words[i-1]:{label:'^'};
          var nextWordData = (i<depgraph.data.graph.words.length)?depgraph.data.graph.words[i]:{label:'$'};
          optionList += '<option value="'+i+'" ';
          optionList += '>#' + i + ' (' + depgraphlib.getValue(wordData,wordData['label']) + ' x ' + depgraphlib.getValue(nextWordData,nextWordData['label']) +')';
          optionList += '</option>';
        }
        optionList += '</select>';
        
        return optionList;
      },
      
      /**
       * @function addWordPanel
       * @desc create a panel to add a new word
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addWordPanel : function(depgraph){
        var html = '';
        html += '<div><h3>Add a new word</h3>';
        html += '<table><tr>';
        html += '<td><label>Label</label></td>';
        html += '<td><input type="text" name="label"></td></tr>';
        html += '<tr><td><label>Sublabels (separated by commas, use \\, for commas)</label></td>';
        html += '<td><input type="text" name="sublabels"></td></tr>';
        html += '<tr><td><label>Position</label></td>';
        html += '<td>'+depgraphlib.EditObject.DefaultModeLib.getOptionsPosition(depgraph,'#position')+'</td></tr>';
        html += '</table></div>';
        return html;
      },
      

      /**
       * @function addLinkSettings
       * @desc open a link creation panel
       * @param depgraph
       * @param obj1
       * @param obj2
       * @param params
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addLinkSettings : function(depgraph,obj1,obj2,params){
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
          var link = depgraph.addLink(obj1,obj2,value,color);
          var action = {baseAction:'linkAddition',addedLink:link};
          depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordSelect',params:params}});
          box.close(true);
        });
        
      },

      

      /**
       * @function addWordSettings
       * @desc open a word creation panel
       * @param depgraph
       * @param element
       * @param offset
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addWordSettings : function(depgraph,element,offset){
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
          var word = depgraph.addWord(wordData);
          var action = {baseAction:'wordAddition',addedWord:word};
          depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordContext',params:element}});
          box.close(true);
        });
        
      },


      addRootEdge : function(depgraph,element){
        var color = 'black';
        var id = this.id++;
        var link = new Object();
        link.target = element.__data__.id;
        link['#style'] = {'link-color' :color};  
        link.label = "root";
        link['#id'] = id;
        depgraph.insertLink(link);
        var action = {baseAction:'linkAddition',addedLink:link};
        depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordContext',params:element}});
      },
      
      
  };
  
  
}(window.depgraphlib));