(function(depgraphlib){

    depgraphlib.save_default = function(depgraph){
      depgraph.cleanData();
      jQuery.ajax({
        type: 'POST', 
        url: depgraph.wsurl,
        data: {
          action:'save',
          format:depgraph.dataFormat,
          options: '',
          data:depgraph.data,
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
    };
  
  
}(window.depgraphlib));