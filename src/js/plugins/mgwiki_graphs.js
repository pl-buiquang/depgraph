/**
 * mgwiki_graphs.js
 * This file contains javascript ajax function that will interact with FrMGWiki server functions,
 * and others convenient functions.
 */
(function(depgraphlib){

  
  depgraphlib.allowNotes = function(graph_id){
    var depgraph = depgraphlib.DepGraph.getInstance(graph_id);
    depgraph.viewer.addToolbarItem({name:'add note',callback:depgraphlib.addNote,style:'add-note','static':true});
    jQuery(document).on("click","#note-submit-"+depgraph.options.uid,function(){depgraphlib.submitNote(depgraph);});
  };
  
  depgraphlib.addNote = function(){
    var me = depgraphlib.DepGraph.getInstance(this);
    var coords = this.getBoundingClientRect();
    var point = {x:coords.left,y:coords.top + coords.height + 2};
    var form = '<form id="note-form-'+me.options.uid+'">';
    form += '<textarea id="note-text-'+me.options.uid+'" name="note" rows="4" cols="50"></textarea><br>';
    form += '<input id="note-submit-'+me.options.uid+'" name="note-submit" type="button" value="Add note">';
    form +='</form>';
    var div ='<div></div>';
    div = jQuery(div);
    div.append(form);
    me.viewer.createBox({closeButton:true,position:point,autodestroy:false,forceToolbar:true}).setContent(div).open();
  };
  
  depgraphlib.submitNote = function(depgraph){
    var textarea = jQuery("#note-text-"+depgraph.options.uid);
    var data = textarea.val();
    var box = depgraphlib.Box.getBox(textarea[0]);
    jQuery.ajax({
      type: 'POST', 
      url: depgraph.wsurl,
      data: {
        gnid:depgraph.gnid,
        action:'add note',
        data:data
      },
      dataType : 'json',
      success: function(data, textStatus, jqXHR) {
        console.log(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(textStatus);
      }
    });
    box.close(true);
  };

  depgraphlib.default_save = function(depgraph){
    depgraph.cleanData();
    jQuery.ajax({
      type: 'POST', 
      url: 'edit/save',
      data: {
        format:depgraph.dataFormat,
        options: '',
        data:depgraph.data,
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

  };
  
    /**
     * Callback to use in a toolbar button.
     * Display a box containing informations about the current graph.
     */
    depgraphlib.showRefs = function(){
      var me = depgraphlib.DepGraph.getInstance(this);
      var coords = this.getBoundingClientRect();
      var point = {x:coords.left,y:coords.top + coords.height + 2};
      var div ='<div>Reference Infos : <br>';
      div += 'Sentence : ' + fix_missing_a_closing_tag(me.sentenceLink) + '<br>'
      + 'Back Links : ' + me.refs
      +'</div>';
      div = jQuery(div);
      me.viewer.createBox({closeButton:true,position:point,autodestroy:true,forceToolbar:true}).setContent(div).open();
    };

    function fix_missing_a_closing_tag(link){
      if(link.indexOf('</a>', link.length - 4) !== -1){
        return link;
      }else{
        return link + '</a>';
      }
    }


    depgraphlib.mgwiki_d3js_module_action = function(action,gid,wsurl){
      jQuery.ajax({
        type: 'POST', 
        url: wsurl,
        data: {
          gid:gid,
          action:action,
        },
        dataType : 'json',
        success: function(data, textStatus, jqXHR) {
          console.log(data);
          if(data.success){
            window.location = '';
          }else{
            alert(data.error);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          alert(textStatus);
        }
      });
    };
    
    depgraphlib.promote = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('promote',gid,url);
    };
    
    depgraphlib.reload = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('reload',gid,url);
    };

    depgraphlib.remove = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('remove',gid,url);
    };
  
}(window.depgraphlib));

