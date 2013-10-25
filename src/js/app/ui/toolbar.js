(function(depgraphlib){

  /**
   * This callback is displayed as part of the GraphViewer class.
   * @callback DepGraphLib.GraphViewer~toolbarbuttonaction
   * @param {DepGraphLib.DepGraph} depgraph - The current graph within the viewer  
   * @param {DepGraphLib.GraphViewer} viewer - The viewer allowing the use of methods like changeState, getState
   */
  
  /**
   * The format of button for the toolbar
   * @typedef DepGraphLib.GraphViewer.ToolBarButton
   * @property {string} name - the name displayed if no image or class style is set for the button.
   * it is also an id to retrieve the button
   * @property {DepGraphLib.GraphViewer~toolbarbuttonaction} callback - the callback used when the button is clicked
   * @property {string} style
   * @property {boolean} [active=true]
   * @property {boolean} [state=false]
   * @property {string} image 
   */
  
  /**
   * The format of item that can be added to the toolbar 
   * @typedef DepGraphLib.GraphViewer.ToolBarItem
   * @property {string} name - the name of the item
   * @property {array.<DepGraphLib.GraphViewer.ToolBarButton>|DepGraphLib.GraphViewer.ToolBarButton} element - the button or array of button defining this item
   * @property {string} [group] - the group of the button 
   * @property {boolean} [active=true]
   * @property {boolean} [state=false]
   * @property {string} [tooltip] - tooltip displayed on mouseover
   * @property {string} style 
   */
  
  /**
   * @function addToolbarItem
   * @desc add an item to the toolbar
   * @param {DepGraphLib.GraphViewer.ToolBarItem} item
   * @param {boolean} [apply=false] - apply immediatly the change made to the toolbar
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.addToolbarItem = function(item){
    if(this.getToolbarItem(item.name)!=null){
      console.log('warning : adding twice a button of name "'+item.name+'"');
    }

    item.state = item.state || false;
    item.active = item.active || true;
    item.group = item.group || 'default'+this.toolbarindex++;
    
    if(!this.toolbaritems[item.group]){
      this.toolbaritems[item.group] = [];
    }
    
    this.toolbaritems[item.group].push(item);
    
    this.applyToolbarConf();
  };
  
  /**
   * @function addToolbarItems
   * @desc add an array of items to the toolbar
   * @param {array.<DepGraphLib.GraphViewer.ToolBarItem>} items
   * @param {boolean} [apply=false] - apply immediatly the change made to the toolbar
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.addToolbarItems = function(items){
    for(var i=0; i< items.length; i++){
      this.addToolbarItem(items[i]);
    }
    
    this.applyToolbarConf();
  };
  
  /**
   * @function removeToolbarItems
   * @desc remove an array of items to the toolbar
   * @param {array.<DepGraphLib.GraphViewer.ToolBarItem>} items
   * @param {boolean} [apply=false] - apply immediatly the change made to the toolbar
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.removeToolbarItems = function(items){
    for(var i = 0; i<items.length; i++){
      this.removeToolbarItem(items[i],false);
    }
    
    this.applyToolbarConf();
  };
  
  /**
   * @function removeToolbarItem
   * @desc remove a item to the toolbar
   * @param {array.<DepGraphLib.GraphViewer.ToolBarItem>} items
   * @param {boolean} [apply=false] - apply immediatly the change made to the toolbar
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.removeToolbarItem = function(item){
    var index = null;
    for(var i in this.toolbaritems){
      for(var j=0;j<this.toolbaritems[i].length;j++){
        if(this.toolbaritems[i][j].name == name){
          index =  this.toolbaritems[i][j];
          break;
        }
      }
      if(index){
        this.toolbaritems[i].splice(j,1);
        break;
      }
    }
    
    
    this.applyToolbarConf();
  };
  
  /**
   * @function getToolbarItem
   * @param {string} name - the name of the toolbar item
   * @returns {DepGraphLib.GraphViewer.ToolBarItem|null} the toolbar item
   * 
   *  @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.getToolbarItem = function(name){
    for(var i in this.toolbaritems){
      for(var j=0;j<this.toolbaritems[i].length;j++){
        if(this.toolbaritems[i][j].name == name){
          return this.toolbaritems[i][j];
        }
      }
    }
  };
  
  /**
   * @function setToolbarItemActive
   * @desc set active or unactive a toolbar item
   * @param {string} name - the name of the item
   * @param {boolean} active
   * @param {boolean} [apply=false] 
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.setToolbarItemActive = function(name,active){
    if(!active){
      this.getToolbarItem(name).active = false;
    }else{
      this.getToolbarItem(name).active = true;
    }
    
    this.applyToolbarConf();
  };
  
  /**
   * @function applyToolbarConf
   * @desc this function is called anytime a button is added, removed, or buttons active state changed
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.applyToolbarConf = function(){
    for(var i in this.toolbaritems){
      var group = jQuery('#tb-group-'+this.appendOwnID(i));
      if(!group || !group.length){
        group = jQuery('<div id="tb-group-'+this.appendOwnID(i)+'" class="tab"></div>');
      }
      var hideGroup = true;
      for(var j = 0 ; j< this.toolbaritems[i].length;j++){
        var item = this.toolbaritems[i][j];
        var button = null;
        if(Object.prototype.toString.call( item.elements ) === '[object Array]'){
          button = this.createDropDownMenu(item);
        }else{
          button = jQuery('#button-'+this.appendOwnID(item.name));
          if(!button || !button.length){
            button = jQuery('<div id="button-'+this.appendOwnID(item.name)+'"></div>');
            button.attr('title',item.tooltip || item.name);
            button.attr('class','');
            button.addClass('button');
            button.addClass('button_off');
            if(item.style){
              button.addClass(item.style).addClass('icon');
            }else{
              button.html(item.name);
            }
            
            if(item.callback){
              button.click(item.callback);
            }
          }
          if(!item.active){
            button.hide();
          }else{
            hideGroup = false;
            button.show();
          }
        }
        
        item.button = button;
        group.append(button);
        
      }
      if(group.children().length){
        this.toolbarbuttons.append(group);
      }else{
        group.remove();
      }
      if(hideGroup){
        group.hide();
      }else{
        group.show();
      }
    }
    

    this.setWidth();
  };
  
  /**
   * @function
   * @param name
   * @returns {object}
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.getButton = function(name){
    return jQuery('#button-'+this.appendOwnID(name));
  };

  /**
   * @function setToolbarItemState
   * @param name
   * @param value
   * 
   * @memberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.setToolbarItemState = function(name,value){
    if(value){
      jQuery('#button-'+this.appendOwnID(name)).addClass('button_on').removeClass('button_off');
    }else{
      jQuery('#button-'+this.appendOwnID(name)).removeClass('button_on').removeClass('button_on');      
    }
  };
 
  
  /**
   * @function addFullScreenButton
   * @desc add the fullscreen mode button to the toolbar
   * @memeberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.addFullScreenButton = function(){
    if(!this.allowFullScreen){
      return;
    }
    if(typeof this.container.colorbox != 'undefined'){
      if(this.getToolbarItem('fullscreen')){
        this.setToolbarItemActive('fullscreen',true,true);
      }else{
        this.addToolbarItem({name:'fullscreen',callback:null,style:'fullscreen',tooltip:'View in fullscreen'});
      }
      this.initFullscreenMode();
    }
  };


  /**
   * @function resetToolbarItems
   * @desc remove all toolbar buttons
   * 
   * @memeberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.resetToolbarItems = function(forceall){
    var newtoolbaritems = {};
    if(!forceall){
      var toolbaritems = this.toolbaritems;
      for(var group in toolbaritems){
        for(var i =0 ;i<toolbaritems[group].length;i++){
          if(toolbaritems[group][i]['static']){
            if(!newtoolbaritems[group]){
              newtoolbaritems[group] = [];
            }
            newtoolbaritems[group].push(toolbaritems[group][i]);
          }
        }
      }
    }
    this.toolbaritems = newtoolbaritems;
    var children = this.toolbarbuttons.children();
    children.remove();
    this.addFullScreenButton();
  };


   /**
   * @function createDropDownMenu
   * @desc create a dropdown menu given items that compose the menu
   * items is an object of objects with at least the property 'cb' defining the callback when the item
   * is clicked.
   * 
   * @memeberof DepGraphLib.GraphViewer#
   */
  depgraphlib.GraphViewer.prototype.createDropDownMenu = function(menuitem){
    var name = menuitem.name;
    var items = menuitem.elements;
    var tooltip = menuitem.tooltip;
    
    var div = jQuery('<div><div class="gv-menu"><div class="gv-menu-header"></div><div class="gv-menu-body"></div></div></div>');
    var header = jQuery('.gv-menu-header',div);
    var body = jQuery('.gv-menu-body',div);
    body.hide();
    header.html(name);
    header.attr('title',tooltip||name);
    header.addClass('white');
    for(i in items){
      var item = jQuery('<div>'+i+'</div>');
      item.attr('title',items[i].tooltip || items[i].name);
      body.append(item);
      jQuery(item).click(items[i].callback);
    }
    jQuery('.gv-menu-header',div).click(function(event){jQuery('.gv-menu-body',event.currentTarget.parentNode).slideDown();});
    jQuery(div).mouseleave(function(event){
        jQuery('.gv-menu-body',event.currentTarget).slideUp();
      }
    );
    return div;
  };

  
  
}(window.depgraphlib));
