(function(depgraphlib, $, undefined){
  

  depgraphlib.promote = function(gid,url){
    jQuery.ajax({
      type: 'POST', 
      url: url,
      data: {
        gid:gid,
        action:'promote',
      },
      dataType : 'json',
      success: function(data, textStatus, jqXHR) {
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
  
  depgraphlib.reload = function(gid,url){
    jQuery.ajax({
      type: 'POST', 
      url: url,
      data: {
        gid:gid,
        action:'reload',
      },
      dataType : 'json',
      success: function(data, textStatus, jqXHR) {
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

  depgraphlib.remove = function(gid,url){
    jQuery.ajax({
      type: 'POST', 
      url: url,
      data: {
        gid:gid,
        action:'delete',
      },
      dataType : 'json',
      success: function(data, textStatus, jqXHR) {
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

  
}(window.depgraphlib=window.depgraphlib||{},jQuery));