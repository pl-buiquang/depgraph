(function(depgraphlib){
  
  /***********************************************************/
  /**                   Quick Windows                        */
  /***********************************************************/
  
  /**
   * Create a new box and bind it with the viewer
   * @see Box for parameters description
   * @return the new box created
   */
  depgraphlib.GraphViewer.prototype.createBox = function(options){
    options.viewer = this;
    return new depgraphlib.Box(options);
  };
  
  /**
   * Box class
   * @param id the id of the box window
   * @param options the options for the box are : 
   * - draggable : bool, 
   * - position : float,float, 
   * - title : string, # displat a title
   * - closeButton : bool # true display a close button,
   * - autodestroy : bool # destroy the box when click away
   * @param viewer [optional] a viewer to bind the box with
   * @return {depgraphlib.Box}
   */
  depgraphlib.Box.prototype.init = function(options){
    var me = this;
    
    me.options = options;
    
    depgraphlib.Box.instances.push(this);

    if(options.viewer != null){
      this.viewer = options.viewer;
    }

    var resizablebox = '<div class="depgraphlib-box">'+
      '<div class="resizableborder-top-left"></div>'+
      '<div class="resizableborder-top-center"></div>'+
      '<div class="resizableborder-top-right"></div>'+
      '<div class="resizableborder-middle-left"></div>'+
      '<div class="resizableborder-content"></div>'+
      '<div class="resizableborder-middle-right"></div>'+
      '<div class="resizableborder-bottom-left"></div>'+
      '<div class="resizableborder-bottom-center"></div>'+
      '<div class="resizableborder-right"></div>'+
      '</div>';
    
    this.object = jQuery('<div class="depgraphlib-box"><div class="depgraphlib-box-header"></div><div class="depgraphlib-box-content"></div><div class="depgraphlib-box-footer"></div></div>');


    //jQuery('.depgraphlib-box-content',this.object).resizable();

    if(options.id){
      this.object.attr('id',options.id);
    }

    if(options.closeButton){
      var tooltipExitButton = jQuery('<div class="tooltip-exit-button"/>');
      tooltipExitButton.css('float','right');
      tooltipExitButton.css('display','block');
      tooltipExitButton.click(function(){me.close(true); });

      jQuery('.depgraphlib-box-header',this.object).append(tooltipExitButton);
    }
    
    if(options.position){
      this.object.css('top',options.position.y);
      this.object.css('left',options.position.x);
    }
    
    
    if(options.autodestroy){
      this.tooltipCreationBug = true;
      d3.select(document).on('click.box_'+depgraphlib.Box.instances.length,function(e){
        if(!me.tooltipCreationBug && !jQuery.contains( me.object[0], d3.event.target )){
          me.close(true);
        }
        delete me.tooltipCreationBug;
      });
    }
    
    
    jQuery('body').append(this.object);

    if(options.draggable){
      if(this.object.draggable){
        this.object.draggable({ handle: ".depgraphlib-box-header" });
      }

      var tooltipMinimizeButton = jQuery('<div class="tooltip-minimize-button"/>');
      tooltipMinimizeButton.css('float','right');
      tooltipMinimizeButton.css('display','block');
      tooltipMinimizeButton.click(function(){me.minimize();});
      jQuery('.depgraphlib-box-header',this.object).append(tooltipMinimizeButton);
      
    }

    depgraphlib.Box.zindextop = depgraphlib.Box.zindextop+1;
    jQuery(this.object).css("z-index",depgraphlib.Box.zindextop);
    jQuery(this.object).on("click",function(e){
      if(jQuery(e.target).hasClass('depgraphlib-box-content') || jQuery(e.target).hasClass('depgraphlib-box-footer') || jQuery(e.target).hasClass('depgraphlib-box-header')){
        var zindex = jQuery(this).css("z-index");
        if(zindex<depgraphlib.Box.zindextop){
          depgraphlib.Box.zindextop = depgraphlib.Box.zindextop+1;
          zindex = depgraphlib.Box.zindextop;
          jQuery(this).css("z-index",zindex);
        }
      }
      

      
    });
    
    return this;
  };
  
  depgraphlib.Box.prototype.setContent = function(content){
    var boxcontent = jQuery('.depgraphlib-box-content',this.object);
    boxcontent.append(content);
    return this;
  };

  depgraphlib.Box.prototype.setFixedSize = function(width,height){
    var content = this.object.find('.depgraphlib-box-content');
    if(height){
      content.height(height);  
    }
    if(width){
      content.width(width);
    }
    return this;
  };

  depgraphlib.Box.prototype.setMaxSize = function(width,height){
    var content = this.object.find('.depgraphlib-box-content');
    if(height){
      content.css('max-height',height);  
    }
    if(width){
      content.css('max-width',width);
    }
    return this;
  };

  depgraphlib.Box.prototype.resetContent = function(){
    var boxcontent = jQuery('.depgraphlib-box-content',this.object);
    boxcontent.html("");
    return this;
  };
  
  depgraphlib.Box.prototype.setHeader = function(content){
    jQuery('.depgraphlib-box-header',this.object).append('<div style="margin-left:5px; float:left; color:white;">'+content+'</div>');
    return this;
  };
  
  depgraphlib.Box.prototype.setFooter = function(content){
    return this;
  };

  /**
   * Instances of boxes
   */
  depgraphlib.Box.instances = depgraphlib.Box.instances || [];

  depgraphlib.Box.zindextop = 6000;

  /**
  * Instances of boxes that are minimized
  */
  depgraphlib.Box.minimized = depgraphlib.Box.minimized || [];

  /**
   * @function open
   * @param {DOMObject|object.<number,number>} position
   * @returns {DepGraphLib.Box}
   * 
   * @memberof DepGraphLib.Box#
   */
  depgraphlib.Box.prototype.open = function(position){
    this.move(position);
    if(this.options.forceToolbar){
      if(this.viewer){
        this.oldFixedToolbarValue = this.viewer.fixedToolbar; 
        this.viewer.fixedToolbar = true;
        this.viewer.toolbar.show();
      }
    }
    this.object.show();
    return this;
  };

  depgraphlib.Box.prototype.move = function(position){
    if(position){
      var point = position;
      if(typeof position.getBoundingClientRect == 'function'){
        var coords = this.getBoundingClientRect();
        point = {x:coords.left,y:coords.top + coords.height + 2};
      }
      this.object.css('top',point.y);
      this.object.css('left',point.x);
    }
    return this;
  };

  depgraphlib.Box.prototype.defaultInit = function(){
    var divloader = '<div style="width:300px; height:150px;"><div class="depgraphlib-box-loading"></div></div>';
    var width = jQuery(window).width()-50;
    var height = jQuery(window).height()-50;
    this.object.css('top',height/2-100);
    this.object.css('left',width/2-100);
    this.setContent(divloader);
    return this;
  };
  
  /**
   * 
   * @param raw if true, returns the dom element, else the jquery selection
   * @return the dom object corresponding to this box (jquery object or dom element depending of parameter)
   */
  depgraphlib.Box.prototype.getDOM = function(raw){
    if(raw){
      return this.dom;
    }
    else{
      return this.object;
    }
  };
  
  depgraphlib.Box.getBox = function(elt){
    for(var i=0; i< depgraphlib.Box.instances.length; ++i){
      if(jQuery.contains( depgraphlib.Box.instances[i].object[0], elt)){
        return depgraphlib.Box.instances[i];
      }
    }
  };
  
  /**
   * Close the window
   * @param destroy if true, destroy the window, else just hide it
   */
  depgraphlib.Box.prototype.close = function(destroy){
    if(this.options.onclose){
      this.options.onclose.call(this);
    }
    if(this.options.forceToolbar){
      if(this.viewer){
        this.viewer.fixedToolbar = this.oldFixedToolbarValue; 
      }
    }
    for(var i=0; i< depgraphlib.Box.instances.length; ++i){
      if(depgraphlib.Box.instances[i]==this){
        depgraphlib.Box.instances.splice(i,1);
        break;
      }
    }
    if(destroy){
      this.destroy();
    }else{
      this.object.hide();
    }
  };

  depgraphlib.Box.prototype.minimize = function(){
    var me = this;
    var top = jQuery(window).height();
    var left = jQuery(window).width();
    var position = this.object.offset();
    position.top -= jQuery(window).scrollTop();
    position.left -= jQuery(window).scrollLeft();
    jQuery('.depgraphlib-box-content',this.object).toggle();
    depgraphlib.Box.minimized.push(this);
    for(var i=0; i<depgraphlib.Box.minimized.length;++i){
      top -= depgraphlib.Box.minimized[i].object.height();
    }
    left -= this.object.width();
    this.prevPosition = position;
    jQuery('.tooltip-minimize-button',this.object).removeClass('tooltip-minimize-button').addClass('tooltip-restore-button').unbind('click').on("click",function(){
      me.restore();
    });
    this.object.animate({top:top,left:left},500);
  };

  depgraphlib.Box.prototype.restore = function(){
    var me = this;
    var position = this.prevPosition;
    jQuery('.depgraphlib-box-content',this.object).toggle();
    var index = depgraphlib.Box.minimized.indexOf(this);
    if(index != -1){
      depgraphlib.Box.minimized.splice(index,1);
    }
    jQuery('.tooltip-restore-button',this.object).addClass('tooltip-minimize-button').removeClass('tooltip-restore-button').unbind('click').on("click",function(){
      me.minimize();
    });
    this.object.animate({top:position.top,left:position.left},500);
  }
  
  
  /**
   * Close and destroy the window
   */
  depgraphlib.Box.prototype.destroy = function(){
    for(var i=0; i< depgraphlib.Box.instances.length; ++i){
      if(depgraphlib.Box.instances[i]==this){
        depgraphlib.Box.instances.splice(i,1);
        break;
      }
    }
    this.object.remove();
  };
  
  
  
  
  
  
  
  
  
  
  
}(window.depgraphlib));
