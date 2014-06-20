/**
 * frmg_parser_custom.js
 * Defines FrMGWiki custom editobject
 */
(function(depgraphlib){



    depgraphlib.FRMGEditMode = function(urlFRMGServer){
      this.mode = {
          name : 'frmg',
          onWordSelect : showAltOnNodeClick,
          onLinkSelect : selectAlternative,
          onChunkSelect : depgraphlib.EditObject.DefaultModeLib.selectObject,
          onWordContext : {
            'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              depgraphlib.EditObject.DefaultModeLib.showEditPanel(depgraph,element);
            },
            'HighLight' : function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              processhighlightmode(depgraph,element);
            }
          },
          onLinkContext : {
            'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              depgraphlib.EditObject.DefaultModeLib.showEditPanel(depgraph,element);
            },
            'HighLight' : function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              processhighlightmode(depgraph,element);
            }
          },
          onChunkContext : null,
          keyHandler : editKeyDownFRMG,
          undo : frmgUndo,
          save:frmg_save,
          highlightInfos:null,
          onGetNewResult:null,
        };
      
      function frmg_save(depgraph){
        var params = getPreviousParams(depgraph);
        var highlightInfos = depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos;
        jQuery.ajax({
          type: 'POST', 
          url: depgraph.wsurl,
          data: {
            action:'save',
            format:'frmgserver',
            options: params,
            highlighting:highlightInfos,
            data:depgraph.sentence,
            uid:depgraph.options.uid
          },
          dataType : 'json',
          success: function(data, textStatus, jqXHR) {
            if(data.success){
              depgraph.editObject.lastSavedPtr = depgraph.editObject.currentPtr;
              depgraph.editObject.needToSaveState = false;
              depgraph.editObject.updateSaveState();
            }else{
              alert("error happened, couldn't save the modifications");
            }
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
          }
        });
      }
      
      function showAltOnNodeClick(depgraph,params){
        if(depgraph.editObject.previousSelectedObject != null && !depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
          hideAltLinks(depgraph,depgraph.editObject.previousSelectedObject);
        }
        
        if(processhighlightmode(depgraph,this)){
          return;
        }
        
        if(this == depgraph.editObject.previousSelectedObject){
          depgraph.editObject.clearSelection();
          return;
        }
        depgraph.editObject.selectObject(this);
        showAltLinks(depgraph,this);
      }

      function frmgUndo(depgraph,rollbackdata){
        if(rollbackdata.baseAction == 'removeEdge' || rollbackdata.baseAction == 'selectAlternative'){
          var param = rollbackdata.previousParams;
          if(param == ''){
            param = depgraph.original_data.graph.params;
          }
          getNewData(depgraph,depgraph.sentence,param);
        }
      }

      function editKeyDownFRMG (depgraph,params){
        if(params.keyCode == 46){
          if(depgraph.editObject.previousSelectedObject!= null){
            if(depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
              var params = removeLinkForNewData(depgraph,depgraph.sentence,depgraph.editObject.previousSelectedObject.__data__);
              return {baseAction:'removeEdge',previousParams:getPreviousParams(depgraph),currentParams:params};
            }
          }
        }
      }

      function selectAlternative(depgraph,params){
        /*if(depgraph.editObject.previousSelectedObject != null && !depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
          hideAltLinks(depgraph,depgraph.editObject.previousSelectedObject);
        }*/
        
        if(processhighlightmode(depgraph,this)){
          return;
        }
        
        if(depgraph.frmg_disamb_status && depgraphlib.isALink(this)){
          if(true == this.__data__['#data'].virtual){
            var params = "";
            for(id  in this.__data__['ref_ids']){
              params += depgraphlib.getOriginalFRMGMode(depgraph) + getSideParams(depgraph) + getLinkInfo(depgraph,this)+"+9999";//"eid=" + this.__data__['ref_ids'][id] + "&+99999";
              getNewData(depgraph,depgraph.sentence,params);
              return {baseAction:'selectAlternative',previousParams:getPreviousParams(depgraph),currentParams:params};
            }  
          }else{ // change frmg_disamb status (neutral, keep, remove)
            if(d3.event.ctrlKey){ // remove / neutral
              if(this.__data__.disamb_status == 2){ // remove
                removeEdge(depgraph,this,false);
              }else{ // neutral
                removeEdge(depgraph,this,true);
              }
            }else{ // select / neutral
              if(this.__data__.disamb_status == 1){ // keep
                keepEdge(depgraph,this,false);
              }else{ // neutral
                keepEdge(depgraph,this,true);
              }
            }
          }
        }
      }

      /**
       * Return the option mode of frmg parse (exotic, transform or robust)
       * @param  {depgraphlib.DepGraph} depgraph
       * @return {string} the option string to prepend to any disambiguation alternative
       */
      depgraphlib.getOriginalFRMGMode = function(depgraph){
        var baseOptions = depgraph.options.frmgparserparams || '';
        var possibleOptions = ['robust','exotic','transform'];
        var originalMode = '';
        for(var i=0;i<possibleOptions.length;++i){
          var regex = new RegExp(".*("+possibleOptions[i]+").*","g");
          var match = regex.exec(baseOptions);
          if (match != null) {
            originalMode += match[1] + " ";
          }   
        }
        return originalMode;
      };

      function getPreviousParams(depgraph){
        var eo = depgraph.editObject;
        if(eo.currentPtr == -1){
          return depgraph.options.frmgparserparams||'';
        }else{
          var action = eo.actionsLog[eo.currentPtr];
          return action.rollbackdata.currentParams;
        }
      }
      
      depgraphlib.getPreviousParams = getPreviousParams;
      
      function processhighlightmode(depgraph,currentobj){
        if(depgraph.editObject.highlightMode){
          depgraph.editObject.clearSelection();
          var value = !depgraphlib.isObjectPermanentHighlighted(currentobj);
          depgraphlib.DepGraph.highlightObject(currentobj,value,true);
          
          if(depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos == null){
            depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos = depgraph.data.graph.highlighting?depgraph.data.graph.highlighting:[];
          }
          var infos = depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos;
          var index = infos.indexOf(currentobj.__data__.id);
          if(index != -1 && !value){
            infos.splice(index,1);
          }else if(index == -1 && value){
            infos.push(currentobj.__data__.id);
          }
          depgraph.editObject.setNeedToSave();
          return true;
        }else{
          return false;
        }
      }

      function initFrmgDisamb(depgraph){
        depgraph.frmg_disamb = depgraph.frmg_disamb || {};
        depgraph.frmg_disamb.keep = depgraph.frmg_disamb.keep || {};
        depgraph.frmg_disamb.remove = depgraph.frmg_disamb.remove || {};
      }

      function keepEdge(depgraph,link,value){
        initFrmgDisamb(depgraph);
        if(value){
          link.components.path.attr('stroke','green');
          link.__data__.disamb_status = 1;
          depgraph.frmg_disamb.keep[link.__data__.id] = getLinkInfo(depgraph,link)+"+9999";
          delete depgraph.frmg_disamb.remove[link.__data__.id];  
        }else{
          link.components.path.attr('stroke','grey');
          link.__data__.disamb_status = 0;
          delete depgraph.frmg_disamb.keep[link.__data__.id];
          delete depgraph.frmg_disamb.remove[link.__data__.id];
        }
      }

      function removeEdge(depgraph,link,value){
        initFrmgDisamb(depgraph);
        if(value){
          link.components.path.attr('stroke','red');
          link.__data__.disamb_status = 2;
          depgraph.frmg_disamb.remove[link.__data__.id] = getLinkInfo(depgraph,link)+"-9999";
          delete depgraph.frmg_disamb.keep[link.__data__.id];
        }else{
          link.components.path.attr('stroke','grey');
          link.__data__.disamb_status = 0;
          delete depgraph.frmg_disamb.remove[link.__data__.id];
          delete depgraph.frmg_disamb.keep[link.__data__.id];
        }
      }

      function getSideParams(depgraph){
        initFrmgDisamb(depgraph);
        var params = "";
        for(var i in depgraph.frmg_disamb.keep){
          params += depgraph.frmg_disamb.keep[i]+ " ";
        }
        for(var i in depgraph.frmg_disamb.remove){
          params += depgraph.frmg_disamb.remove[i]+ " ";
        }
        return params;
      }

      function getLinkInfo(depgraph,link){
        var source = depgraph.getWordByOriginalId(link.__data__.source);
        var target = depgraph.getWordByOriginalId(link.__data__.target);
        var source_data = source['#data'];
        var target_data = target['#data'];
        /*var param = "edge=" + 
          source_data['lemma'] + 
          "&" + source_data['cat'] + 
          "&" + link.label +
          "&" + target_data['lemma'] + 
          "&" + target_data['cat'] + 
          "&";*/
        var regex = /E(?:\d+)e(\d+)/g;
        var id = link.__data__.id;
        var match = regex.exec(link.__data__.id);
        if(match){
          id = match[1];
        }
        var param = "eid="+id+"&";
        return param;
      }

      function removeLinkForNewData(depgraph,sentence,link){
        var source = depgraph.getWordByOriginalId(link.source);
        var target = depgraph.getWordByOriginalId(link.target);
        var source_data = source.__data__['#data'];
        var target_data = target.__data__['#data'];
        var param = "edge=" + 
          source_data['lemma'] + 
          "&" + source_data['cat'] + 
          "&" + link.label +
          "&" + target_data['lemma'] + 
          "&" + target_data['cat'] + 
          "&-8000";
        getNewData(depgraph,sentence,param);
        return param;
      }


      function createFRMGServerOptionData(sentence,desambigParams){
        if( Object.prototype.toString.call( desambigParams ) === '[object Array]' ) {
          desambigParams = desambigParams.join(" ");
        }
        return {
          sentence : sentence,
          options: 'xml ' + desambigParams,
          schema : 'dep',
          view: 'text',
          };
      }

      function getNewData(depgraph,sentence,options){
        var newdata;
        delete depgraph.frmg_disamb;
        depgraph.viewer.ajaxStart();
        jQuery.ajax({
          type: 'GET', 
          url: urlFRMGServer,
          data: {
            sentence: sentence, 
            options: options,
            schema : 'dep',
            view : 'txt'
          },
          dataType : 'json',
          success: function(data, textStatus, jqXHR) {
            if(!data.error){
              if(depgraph.editObject.mode['frmg'].onGetNewResult){
                depgraph.editObject.mode['frmg'].onGetNewResult.call(depgraph,data);
              }
              depgraph.resetData(data);
            }else{
              alert("Error happened");
            }
            depgraph.viewer.ajaxFinished();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
            depgraph.viewer.ajaxFinished();
          }
        });
      }
      
      depgraphlib.getNewData = getNewData;

      function showAltLinks(depgraph,node){
        for(link in node.__data__['#data']['alternatives']){
          depgraph.data.graph.links.push(node.__data__['#data']['alternatives'][link]);
        }
        depgraph.update();
        depgraph.postProcessesFixHeight();
        depgraph.editObject.editModeInit();
        depgraph.autoHighLightOnMouseOver();
        depgraph.frmg_disamb_status = true;
        var prevParams = getPreviousParams(depgraph);
        var exceptions = [];
        /*for(var i in node.__data__['#data']['alternatives']){
          exceptions.push(node.__data__['#data']['alternatives'][i]);
        }*/
        var regex = /eid=(\d+)&/g;
        var match;
        while (match = regex.exec(prevParams)) {
          exceptions.push({'id':match[1]});
        }
        console.log(exceptions);
        
        
        allLinksToGrey(depgraph,exceptions);
      }


      function allLinksToGrey(depgraph,exceptions){
        if(exceptions == null){
          exceptions = [];
        }
        depgraph.vis.selectAll('g.link').each(function(d,i){
          if(!d['#id'] && d['#id']!==0){ // new alternative added 
            this.components.path.attr('stroke-dasharray',"5,5");
          }else{
            var found = false;
            for(i in exceptions){
              var regex = /E(?:\d+)e(\d+)/g;
              var match;
              if (match = regex.exec(d['id'])) {
                if(match[1]==exceptions[i]['id']){
                  keepEdge(depgraph,this,true);
                  found = true;
                  break;
                }
              }
            }
            if(!found){
              this.components.path.attr('stroke','grey');
            }  
          }
        });
      }


      function hideAltLinks(depgraph,node){
        if(!node){
          return;
        }
        for(i in node.__data__['#data']['alternatives']){
          var link = node.__data__['#data']['alternatives'][i];
          var index = depgraph.getLinkIndexByOriginalId(link.id);
          if(index == null){
            return false;
          }
          depgraph.data.graph.links.splice(index,1);
        }
        depgraph.update();
        depgraph.postProcessesFixHeight();
      }
      
      depgraphlib.hideAltLinks = hideAltLinks;

      
    };
    
  
  
}(window.depgraphlib));

