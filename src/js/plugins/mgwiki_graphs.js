/**
 * mgwiki_graphs.js
 * This file contains javascript ajax function that will interact with FrMGWiki server functions,
 * and others convenient functions.
 */
(function(depgraphlib){

  /**
   * try to guess the format of the graph between two type (conll and depconll), this is used for getting signature for format agnostic graphs
   * @param  {Depgraphlib.DepGraph} depgraph
   * @return {string} the format class (conll or depconll)
   */
  depgraphlib.guessFormat = function(depgraph){
    for(var i in depgraph.data.graph.words){
      if(depgraph.data.graph.words[i]['#data']){
        if(depgraph.data.graph.words[i]['#data']['pos']){
          return "conll";
        }else{
          return "depconll";
        }
      }
    }
  };


  depgraphlib.allowNotes = function(graph_id){
    var depgraph = depgraphlib.DepGraph.getInstance(graph_id);
    depgraph.viewer.addToolbarItem({name:'add-note',callback:depgraphlib.addNote,style:'add-note','static':true});
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
    me.viewer.createBox({closeButton:true,position:point,autodestroy:false,forceToolbar:true}).setContent(div).setHeader("Add note").open();
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
        jQuery.ajax({
          type: 'POST', 
          url: depgraph.wsurl,
          data: {
            gnid:depgraph.gnid,
            action:'get notes'          },
          dataType : 'json',
          success: function(data, textStatus, jqXHR) {
            console.log(data);
            depgraphlib.tpl.notesRender(data,depgraph.options.uid);
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
          }
        });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(textStatus);
      }
    });
    box.close(true);
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
      if(me.options.frmgparserparams!=''){
        div += '(FRMG options:'+me.options.frmgparserparams+')<br>';
      }
      div += 'UID: '+me.options.uid+'<br>';
      div += me.revision_node_link || '';
      if(me.sentenceLink && me.sentenceLink != "#"){
        div += 'Sentence : ' + fix_missing_a_closing_tag(me.sentenceLink) + '<br>'
      }else{
        if(!me.sentence){
          me.sentence = me.computeSentence();
        }
        div += 'Sentence : ' + me.sentence + '<br>'
      }
      if(me.refs){
        div += 'Back Links : ' + me.refs
      }
      div +='</div>';
      div = jQuery(div);
      if(me.wsurl){
        var ddata = me.cleanData();
        jQuery.ajax({
          type: 'POST', 
          url: me.wsurl,
          data: {
            uid:me.options.uid,
            action:"_getSig",
            data:ddata,
            format:me.options.format || depgraphlib.guessFormat(me)
          },
          dataType:'text',
          success: function(data, textStatus, jqXHR) {
            console.log(data);
            div.append("<div>Signature : "+data+"</div>");
            me.viewer.createBox({closeButton:true,position:point,autodestroy:true,forceToolbar:true}).setContent(div).open();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            me.viewer.createBox({closeButton:true,position:point,autodestroy:true,forceToolbar:true}).setContent(div).open();
          }
        });      
      }else{
        me.viewer.createBox({closeButton:true,position:point,autodestroy:true,forceToolbar:true}).setContent(div).open();
      }
    };

    function fix_missing_a_closing_tag(link){
      if(link.indexOf('</a>', link.length - 4) !== -1){
        return link;
      }else{
        return link + '</a>';
      }
    }


    depgraphlib.mgwiki_d3js_module_action = function(action,gid,wsurl,reload){
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
            if(reload){
              window.location = '';
            }
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
      depgraphlib.mgwiki_d3js_module_action('promote',gid,url,true);
    };
    
    depgraphlib.reload = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('reload',gid,url,true);
    };

    depgraphlib.remove = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('remove',gid,url,true);
    };
  
}(window.depgraphlib));

