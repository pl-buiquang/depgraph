(function(depgraphlib){

  depgraphlib.tpl = {
      
  };
  
  depgraphlib.tpl.notes = function(comments,uid){
    var container = jQuery("#notes-"+uid);
    container.on("click",function(){
      var content = jQuery('.notes-content',this);
      content.toggle();
    });
    var div = '<div class="notes-content hidden"><table title="comments">';
    for(var i=0;i<comments.length;i++){
      div += "<tr><td>"+comments[i].comment_body_value+"</td></tr>";
    }
    div += "</tr></table>";
    container.append(div);
  };
  
  depgraphlib.tpl.base = function(){
    
  };
  
  depgraphlib.tpl.editmode = function(graphInfo,format_origin,frmgserver_url){
    depGraph = depgraphlib.tpl.full(graphInfo);
    viewer.removeToolbarItem('edit');
    depGraph.sentence = '$sentence';
    depGraph.editObject.mode['default'].save = depgraphlib.default_save;
    depGraph.dataFormat = 'json';
    depGraph.viewer.setFixedToolbar();
    if(format_origin == 'depxml'){
      frmgEditMode = new depgraphlib.FRMGEditMode(frmgserver_url);
      depGraph.editObject.addEditMode(frmgEditMode.mode);
      depGraph.editObject.setEditMode('frmg');
      depGraph.editObject.addEditModeSwitcher();
    }else{
      depGraph.editObject.setEditMode('default');
    }
  };
  
  /**
   * @desc
   * graphInfo must contain :
   * - uid
   * - json_data
   * - json_options
   * - wsurl
   * - sentence_link
   * - refs
   * - title
   * - base_url
   * - gid
   */
  depgraphlib.tpl.full = function(graphInfo){
    var depGraph = new depgraphlib.DepGraph(jQuery("#graph-container-"+graphInfo.uid),graphInfo.json_data,graphInfo.json_options);
    var viewer = depGraph.viewer;
    depGraph.wsurl = graphInfo.ws_url;
      
    if(depGraph.options.viewmode == 'full'){
      viewer.noBorders();
    }  
    
    depGraph.sentenceLink = graphInfo.sentence_link;
    depGraph.refs = graphInfo.refs;
    
    if(graphInfo.json_options.wrapped){
      var wrapper = viewer.addWrapper(graphInfo.title);
      var div ='<div>'
      + depGraph.refs
      +'</div>';
      div = jQuery(div);
        
      depGraph.viewer.container.append(div);
    }else{
      viewer.addToolbarItem({name:'refs',callback:depgraphlib.showRefs,style:'refs','static':true});
  }

    
        if(graphInfo.json_options.gid){
          viewer.addToolbarItem({name:'edit',style:'edit',callback:function(){window.location = base_url + "/d3js/" + graphInfo.json_options.gid + '/edit';}});
        }

      var promote_button = jQuery('#graph-star-'+graphInfo.uid);
      if(promote_button.hasClass('graph-star-off')){
        promote_button.on('click',function(){
          depgraphlib.promote(graphInfo.gid,graphInfo.ws_url);
          }
        );
      }

      jQuery('#graph-reload-'+graphInfo.uid).on('click',function(){
        depgraphlib.reload(graphInfo.gid,graphInfo.ws_url);
        }
    );

    jQuery('#graph-delete-'+graphInfo.uid).on('click',function(){
      var r=confirm("Deletion of the graph is irreversible. Confirm deletion?");
      if (r==true)
        {
        depgraphlib.remove(graphInfo.gid,graphInfo.ws_url);
        }
    }
    );
    
    return depGraph;
    
  };
  
  
}(window.depgraphlib));