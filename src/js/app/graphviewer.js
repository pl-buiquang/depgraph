(function(depgraphlib, $, undefined){

  // Check if required library are present
  if(typeof jQuery == 'undefined'){
    alert('DepGraph : Error. This library needs jQuery!');
  }
  
  
  /**
   * GraphViewer.js
   * This part of the library contains functions utilities to create
   * a viewer frame for a the graph display integration in html dom page
   * 
   * Author : Paul Bui-Quang
   * INRIA
   */

  /**
   * Create a new instance of a viewer
   * @param container
   * @param uid
   * @returns
   */
  depgraphlib.GraphViewer = function (container,uid){
    
    if(uid == null){
      uid = Math.floor(Math.random() * 10000000000000001).toString();
    }
    
    this.allowFullScreen = true;
    this.imagemode = false;
    this.debugPanelActive = false;
    this.fixedToolbar = false;
    this._height = '600px';
    this._width = "100%";
    this.basemargin = 10;
    this.margin = {top:100,left:0,right:0,bottom:10};
    this.borders = true;
    
    if(depgraphlib.GraphViewer.instances[uid]){
      uid += "_";
    }
    var uid = this.uid = uid; // uid
    
    if(typeof container == 'string'){ // check if jquery selection or id. id must be prepend a '#'!
      container = jQuery(container);
    }
    var container = this.container = container;
    container.css('display','inline-block');
    
    var mainpanel = this.mainpanel = this.createDiv("gv-main-panel","gv-main-panel");
    container.append(mainpanel);
    
    var chart = this.chart = this.createDiv("gv-chart","gv-chart");
    mainpanel.append(chart);

    var toolbar = this.toolbar = this.initToolBar();
    var debugpanel = this.debugpanel = this.createDebugPanel();

    this.tooltip = this.createToolTipPanel();
    this.tooltip.hide();
    this.altpanel = this.createDiv("gv-alt-panel","gv-alt-panel");
    this.altpanelcontent = this.createDiv("alt-panel-content","alt-panel-content");
    
    this.ajaxLoader = this.createDiv('ajax-loader','ajax-loader');
    this.ajaxLoader.hide();
    this.mainpanel.append(this.ajaxLoader);
    
    this.extraDiv = this.createDiv("gv-extra","gv-extra");
    this.extraDiv.hide();
    this.mainpanel.append(this.extraDiv);
    
    
    mainpanel.append(this.tooltip);
    mainpanel.append(this.altpanel);
    this.altpanel.append(this.altpanelcontent);
    
    depgraphlib.GraphViewer.instances[uid]=this;
    
    this.callbacks = new Object();
    this.callbacks.fullscreen = new Object();
    this.callbacks.fullscreen.oncomplete = [];
    this.callbacks.fullscreen.onclose = [];
    this.callbacks.showaltpanel = [];
    this.callbacks.hidealtpanel = [];
    
    
    
    this.toolbar.hide();

    this.toolbar_landing_area.hover(
        function(){
          var me = depgraphlib.GraphViewer.getInstance(this);
          if(!me.fixedToolbar){
            if(me.toolbar.queue().length == 0){
              me.toolbar.slideDown(100,function(){
                if(me.toolbar.queue('depgraph_toolbar_hiding_bufferqueue').length %2 == 1){
                  me.toolbar.dequeue('depgraph_toolbar_hiding_bufferqueue');
                }
              });
              me.mainpanel.css("border","1px solid grey");
            }else{
              me.toolbar.slideDown({duration:100,queue:'depgraph_toolbar_hiding_bufferqueue'});
            }

          }
        },
        function(){
          var me = depgraphlib.GraphViewer.getInstance(this);
          if(!me.fixedToolbar){
            if(me.toolbar.queue().length == 0){
              me.toolbar.slideUp(100,function(){
                if(me.toolbar.queue('depgraph_toolbar_hiding_bufferqueue').length %2 == 1){
                  me.toolbar.dequeue('depgraph_toolbar_hiding_bufferqueue');
                }
              });
              if(!me.borders){
                me.mainpanel.css("border","none");
              }
            }else{
              me.toolbar.slideUp({duration:100,queue:'depgraph_toolbar_hiding_bufferqueue'});
            }
          }
        }
     );
    
  };

  depgraphlib.GraphViewer.instances = depgraphlib.GraphViewer.instances || [];

  /**
   * Retrieve the viewer instance from :
   * - id of a div
   * - svg element
   * - jquery div selection
   * @param fromdiv
   * @returns
   */
  depgraphlib.GraphViewer.getInstance = function(fromdiv){
    var id = "";
    if(depgraphlib.GraphViewer.prototype.isPrototypeOf(fromdiv)){
      return fromdiv;
    }else if(fromdiv.ownerSVGElement != null){
      id = fromdiv.ownerSVGElement.parentNode.id;
    }else if(typeof fromdiv == 'object' && fromdiv.id != null){
      id = fromdiv.id;
    }else{
      id = fromdiv;
    }
    
    regex = /.*-(\w+)/;
    var match = regex.exec(id);
    var viewer = null;
    if(match != null){
       viewer = depgraphlib.GraphViewer.instances[match[1]];
    }
    if(viewer == null){
      viewer = depgraphlib.GraphViewer.getInstance(fromdiv.parentNode);
    }
    return viewer;
  };

  /***********************************************************/
  /**                   Builders                             */
  /***********************************************************/

  /**
   * init the toolbar
   */
  depgraphlib.GraphViewer.prototype.initToolBar = function(){
    var landing_area = this.toolbar_landing_area = this.createDiv("gv-toolbar-landing-area","gv-toolbar-landing-area");
    var toolbar = this.createDiv("gv-toolbar", "gv-toolbar");
    landing_area.append(toolbar);
    this.mainpanel.append(this.toolbar_landing_area);
    var toolbarbuttons = this.toolbarbuttons = this.createDiv("gv-toolbarbuttons","gv-toolbarbuttons");
    toolbar.append(toolbarbuttons);
    // use colorbox for fullscreen mode
    this.addFullScreenButton();
    return toolbar;
  };

  /**
   * create the debug panel
   * @returns
   */
  depgraphlib.GraphViewer.prototype.createDebugPanel = function(){
    var debugpanel = this.debugpanel = this.createDiv("gv-debug-panel","gv-debug-panel");
    this.debugpanelinfo = this.createDiv("debug-panel-info","debug-panel-info");
    debugpanel.append(this.debugpanelinfo);
    var slider = this.createDiv("debug-panel-slider","debug-panel-slider slider-button slide-up");
    slider.click(toggleSlider);
    debugpanel.append(slider);
    var maximize = this.createDiv("debug-panel-fullscreen","debug-panel-fullscreen slider-button maximize");
    maximize.click(
        function(e){
          var graph = depgraphlib.GraphViewer.getInstance(this);
          if(graph!=null){
            graph.viewAltContent('debug-panel-content'+graph.appendOwnID(''));
            var slider = jQuery('#debug-panel-slider'+graph.appendOwnID(''));
            if(slider.hasClass('slide-down')){
              debugSlideDown.call(slider);
            }
          }
        }
      );
    debugpanel.append(maximize);
    var debugcontentcontainer = this.debugcontentcontainer = this.createDiv("debug-panel-container","debug-panel-container");
    debugpanel.append(debugcontentcontainer);
    this.debugpanelcontent = this.createDiv("debug-panel-content","debug-panel-content");
    debugcontentcontainer.append(this.debugpanelcontent);
    this.mainpanel.append(debugpanel);
    this.adjustDebugHeight();
    debugpanel.hide();

    return debugpanel;
  };

  /**
   * append msg to the debug log panel
   * @param msg
   */
  depgraphlib.GraphViewer.prototype.debugLog = function(msg){
    this.debugpanelcontent.append(msg + '<br/>');
  };

  /**
   * create tooltip panel
   * @returns
   */
  depgraphlib.GraphViewer.prototype.createToolTipPanel = function(){
    var me = this;
    this.tooltip = this.createDiv("gv-tooltip","gv-tooltip");
    var maincontainer = jQuery('<div style="display:inline-block;"></div>');
    this.tooltip.append(maincontainer);
    this.tooltipExitButton = this.createDiv('tooltip-exit-button','tooltip-exit-button');
    this.tooltipExitButton.css('float','right');
    this.tooltipExitButton.css('display','block');
    this.tooltipExitButton.click(function(){me.hideToolTip();});
    maincontainer.append(this.tooltipExitButton);
    this.tooltipExitButton.hide();
    this.tooltip.draggable();
    this.tooltipContainer = this.createDiv('tooltip-container');
    maincontainer.append(this.tooltipContainer);
    return this.tooltip;
  };

  /**
   * append the viewer uid to the id of an element
   * @param id
   * @returns
   */
  depgraphlib.GraphViewer.prototype.appendOwnID = function(id){
    if(id.endsWith(this.uid)){
      return id;
    }else{
      return id + "-" + this.uid;
    }
  };

  /**
   * create a wrapper that will allow (un/)folding of the viewer
   * @param title
   * @returns
   */
  depgraphlib.GraphViewer.prototype.addWrapper = function(title){
    var me = this;
    var elt = this.wrapper = me.createElement("a", 'gv-wrapper','gv-wrapper');
    elt.html(title);
    me.container.prepend(elt);
    me.mainpanel.hide();
    elt.click(function(e){
      me.mainpanel.toggle();
    });
    return elt;
  };

  /**
   * create a div with the viewer id appended
   * @param id
   * @param classes
   * @returns
   */
  depgraphlib.GraphViewer.prototype.createDiv = function(id,classes){
    return this.createElement('div',id,classes);
  };

  depgraphlib.GraphViewer.prototype.createElement = function(eltname,id,classes){
    classes = (classes!=null)?('class="'+classes+'"'):'';
    var div = '<'+eltname+' id="'+this.appendOwnID(id)
      +'" '+classes+'></'+eltname+'>';
    
    return jQuery(div); 
  };


  /***********************************************************/
  /**                   Modes / Modifiers                    */
  /***********************************************************/

  /**
   * set up the debug panel proper height according to the viewer height
   */
  depgraphlib.GraphViewer.prototype.adjustDebugHeight = function(){
    var height = this.mainpanel.height() - this.toolbar.height();
    this.debugpanel.css('height',height);
    this.debugcontentcontainer.css('height',height-20);
    this.debugpanel.css('bottom',-height+20);
  };

  /**
   * adjust height to the content of the viewer
   * @param marginBottom
   */
  depgraphlib.GraphViewer.prototype.shrinkHeightToContent = function(marginBottom){
    if(marginBottom == null){
      marginBottom=0;
    }
    var vis = d3.select(this.chart.children()[0]).select('g');
    var bbox = vis.node().getBBox();
    var transform = depgraphlib.getTransformValues(vis);
    this.setHeight(transform.translate[1]+bbox.y*transform.scale[0]+bbox.height*transform.scale[0]+marginBottom*transform.scale[0]);
  };

  /**
   * adjust width to the content of the viewer
   * @param marginRight
   */
  depgraphlib.GraphViewer.prototype.shrinkWidthToContent = function(marginRight){
    if(marginRight == null){
      marginRight=0;
    }
    var vis = d3.select(this.chart.children()[0]).select('g');
    var bbox = vis.node().getBBox();
    var transform = depgraphlib.getTransformValues(vis);
    this.setWidth(transform.translate[0]+bbox.x+bbox.width+marginLeft);
  };

  /**
   * adjust width and height to the content of the viewer
   * @param marginRight
   * @param marginBottom
   */
  depgraphlib.GraphViewer.prototype.shrinkToContent = function(marginRight,marginBottom){
    if(marginBottom == null){
      marginBottom=0;
    }
    if(marginRight == null){
      marginRight=0;
    }
    var vis = d3.select(this.chart.children()[0]).select('g');
    var bbox = vis.node().getBBox();
    var transform = depgraphlib.getTransformValues(vis);
    var maxWidth = this.mainpanel.width();
    var newWidth = transform.translate[0]+bbox.x+bbox.width+marginRight;
    //if(newWidth>maxWidth)
      //newWidth = maxWidth-10;
    this.setSize(newWidth,transform.translate[1]+bbox.y+bbox.height+marginBottom);
  };

  /**
   * set width and height of the viewer
   * @param width
   * @param height
   */
  depgraphlib.GraphViewer.prototype.setSize = function(width,height){
    this.setWidth(width);
    this.setHeight(height);
  };

  /**
   * remove toolbar, debugpanel and tooltip
   * @param value
   */
  depgraphlib.GraphViewer.prototype.setImageMode = function(value){
    if(value == null){
      value = true;
    }
    this.imagemode = value;
    if(value){
      this.toolbar.detach();
      this.debugpanel.detach();
      this.tooltip.detach();
    }else{
      this.mainpanel.append(this.toolbar);
      this.mainpanel.append(this.debugpanel);
      this.mainpanel.append(this.tooltip);
    }
    this.margin.top = this.chart.height()/10 + this.basemargin + ((this.imagemode)?0:20);
    this.margin.bottom = this.basemargin + ((this.imagemode)?0:20);
  };

  /**
   * remove border of the viewer
   */
  depgraphlib.GraphViewer.prototype.noBorders = function(){
      this.borders = false;
      this.mainpanel.css("border","none");
  };

  /**
   * switch on/off the debug mode (display or not the debug panel)
   * @param value
   */
  depgraphlib.GraphViewer.prototype.debugMode = function(value){
    if(value == null){
      value = true;
    }
    this.debugPanelActive = value;
    if(value){
      this.debugpanel.show();
    }else{
      this.debugpanel.hide();
    }
  };

  /**
   * set the width of the viewer
   * @param width
   */
  depgraphlib.GraphViewer.prototype.setWidth = function(width){
    this._width = width;
    this.mainpanel.css('width',width);
    this.ajaxLoader.width(width);
  };

  /**
   * set the height of the viewer
   * @param height
   */
  depgraphlib.GraphViewer.prototype.setHeight = function(height){
    height += 30;
    this._height = height;
    this.mainpanel.css('height',height);
    this.margin.top = this.chart.height()/10 + this.basemargin + ((this.imagemode)?0:20);
    this.margin.bottom = this.basemargin + (this.imagemode)?0:20;
    this.ajaxLoader.height(height-this.toolbar.height());
    this.ajaxLoader.css('top',this.toolbar.height());
    if(this.debugPanelActive){
      this.adjustDebugHeight();
    }
  };

  /**
   * enable or disable the toolbar auto hiding
   * @param value
   */
  depgraphlib.GraphViewer.prototype.setFixedToolbar = function(value){
    if(value == null){
      value = true;
    }
    this.fixedToolbar = value;
    if(value){
      this.toolbar.show();
    }else{
      this.toolbar.hide();
    }
  };

  /***********************************************************/
  /**                    ToolBar                             */
  /***********************************************************/

  /**
   * add the fullscreen mode button to the toolbar
   */
  depgraphlib.GraphViewer.prototype.addFullScreenButton = function(){
    if(!this.allowFullScreen){
      return;
    }
    if(typeof this.container.colorbox != 'undefined'){
      this.addToolbarButton('fullscreen',null,'right','fullscreen','View in fullscreen');
      this.initFullscreenMode();
    }
  };

  /**
   * returns true if found a toolbar button with the name 'name'
   * @param name
   * @returns {Boolean}
   */
  depgraphlib.GraphViewer.prototype.existToolbarButton = function(name){
    return jQuery('#button-'+this.appendOwnID(name)).length > 0;
  };

  /**
   * return the div element corresponding to the tool bar button with name 'name'
   * @param name
   * @returns
   */
  depgraphlib.GraphViewer.prototype.getToolbarButton = function(name){
    return jQuery('#button-'+this.appendOwnID(name));
  };

  /**
   * set toolbar buttons from a array definition of buttons
   * 0 : name, 1 : callback on click, 2: position (left or right), 3 : style (css classes)
   * @param definition
   */
  depgraphlib.GraphViewer.prototype.setToolbarButtons = function(definition){
    this.tmpLeft = [];
    definition.forEach(function(item,index){
      if(item[2] == 'left'){
        this.tmpLeft.push(item);
      }else{
        this.addToolbarButton(item[0], item[1], item[2], item[3], item[4]);
      }
    },this);
    this.tmpLeft.forEach(function(item,index){
      this.addToolbarButton(item[0], item[1], item[2], item[3], item[4]);
    },this);
    this.tmpLeft = null;
  };

  /**
   * remove all toolbar buttons
   */
  depgraphlib.GraphViewer.prototype.resetToolbarButtons = function(){
    var children = this.toolbarbuttons.children();
    children.remove();
    this.addFullScreenButton();
  };

  /**
   * add a button to the toolbar
   * the button is a div that will be put either on left, or right side of the toolbar
   * @param elt
   * @param position
   */
  depgraphlib.GraphViewer.prototype.addToolbarElement = function(elt,position){
    elt.css('float',position);
    this.toolbarbuttons.append(elt);
  };

  /**
   * create and add a button to the toolbar from minimal information
   * @param name
   * @param callback
   * @param position
   * @param style
   */
  depgraphlib.GraphViewer.prototype.addToolbarButton = function(name,callback,position,style,tooltip){
    var text = '';
    if(style == null){
      style = 'tab white';
      text = name;
    }else{
      style += " icon";
    }
    if(position == null){
      position = 'left';
    }
    
    var button='<div id="button-'+this.appendOwnID(name)+'" title="'+(tooltip || name)+'" class="'+style+' tab '+position+'">'+text+'</div>';
    button = jQuery(button);
    button.click(callback);
    this.toolbarbuttons.append(button);
  };

  /**
   * remove a toolbar button given its name
   * @param name
   */
  depgraphlib.GraphViewer.prototype.removeToolbarButton = function(name){
    jQuery('#button-'+this.appendOwnID(name)).remove();
  };

  /**
   * create a dropdown menu given items that compose the menu
   * items is an object of objects with at least the property 'cb' defining the callback when the item
   * is clicked.
   */
  depgraphlib.createDropDownMenu = function(name,items,autoslidedown,tooltip){
    var div = jQuery('<div class="gv-menu"><div class="gv-menu-header"></div><div class="gv-menu-body"></div></div>');
    var header = jQuery('.gv-menu-header',div);
    var body = jQuery('.gv-menu-body',div);
    body.hide();
    header.html(name);
    header.attr('title',tooltip||name);
    header.addClass('white');
    for(i in items){
      var item = jQuery('<div>'+i+'</div>');
      item.attr('title',items[i].tt || i);
      body.append(item);
      jQuery(item).click(items[i].cb);
    }
    if(autoslidedown === false){
      jQuery('.gv-menu-header',div).click(function(event){jQuery('.gv-menu-body',event.currentTarget.parentNode).slideDown();});
      jQuery(div).mouseleave(function(event){
        jQuery('.gv-menu-body',event.currentTarget).slideUp();
        });
    }else{
      div.hover(
          function(event){jQuery('.gv-menu-body',event.currentTarget).slideDown();},
          function(event){jQuery('.gv-menu-body',event.currentTarget).slideUp();}
      );
    }
    return div;
  };

  /***********************************************************/
  /**                   Alt Content                          */
  /***********************************************************/

  depgraphlib.GraphViewer.prototype.viewAltContent = function(divid){
    this.resetAltPanel();
    this.addContentToAltPanel(divid);
    this.showAltPanel();
  };

  depgraphlib.GraphViewer.prototype.hideAltPanel = function(){
    this.chart.show();
    this.altpanel.hide();
    this.removeToolbarButton('back');
    executeCallbacks(this.callbacks.hidealtpanel);
  };

  depgraphlib.GraphViewer.prototype.showAltPanel = function(callbacks){
    this.chart.hide();
    this.altpanel.show();
    this.addToolbarButton('back',function(){depgraphlib.GraphViewer.getInstance(this.id).hideAltPanel();},'left','back');
    executeCallbacks(this.callbacks.showaltpanel);

  };

  depgraphlib.GraphViewer.prototype.addContentToAltPanel = function(divid,title){
    this.altpanelcontent.html(jQuery('#'+this.appendOwnID(divid)).html());
    if(title!=null){
      this.addToolbarButton(title,function(){depgraphlib.GraphViewer.getInstance(this.id).addContentOnAltPanel(divid);},'left');
    }
  };

  depgraphlib.GraphViewer.prototype.resetAltPanel = function(){
    this.altpanelcontent.html('');
  };

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
   * {draggable : bool, 
   * position : {float,float}, 
   * title : string, # displat a title
   * closeButton : bool # true display a close button,
   * autodestroy : bool # destroy the box when click away
   * } 
   * @param viewer [optional] a viewer to bind the box with
   * @returns {depgraphlib.Box}
   */
  depgraphlib.Box = function(options){
    var me = this;
    
    if(options.viewer != null){
      depgraphlib.Box.instances.push(this);
      this.viewer = options.viewer;
    }
    
    this.object = jQuery('<div class="depgraphlib-box"><div class="depgraphlib-box-header"></div><div class="depgraphlib-box-content"></div><div class="depgraphlib-box-footer"></div></div>');

    if(options.id){
      this.object.attr('id',options.id);
    }

    if(options.closeButton){
      var tooltipExitButton = jQuery('<div class="tooltip-exit-button"/>');
      tooltipExitButton.css('float','right');
      tooltipExitButton.css('display','block');
      tooltipExitButton.click(function(){me.close(true);});
      jQuery('.depgraphlib-box-header',this.object).append(tooltipExitButton);
    }
    
    if(options.position){
      this.object.css('top',options.position.y);
      this.object.css('left',options.position.x);
    }
    
    
    if(options.draggable){
      this.object.draggable();
    }
    
    if(options.autodestroy){
      this.tooltipCreationBug = true;
      d3.select(document).on('click.box_'+depgraphlib.Box.instances.length,function(e){
        if(!me.tooltipCreationBug && !jQuery.contains( me.object[0], d3.event.originalTarget )){
          me.destroy();
        }
        delete me.tooltipCreationBug;
      });
    }
    
    
    jQuery('body').append(this.object);
    
    return this;
  };
  
  depgraphlib.Box.prototype.setContent = function(content){
    var boxcontent = jQuery('.depgraphlib-box-content',this.object);
    boxcontent.html(content.html());
    return this;
  };
  
  depgraphlib.Box.prototype.setHeader = function(content){
    return this;
  };
  
  depgraphlib.Box.prototype.setFooter = function(content){
    return this;
  };

  /**
   * Instances of boxes
   */
  depgraphlib.Box.instances = depgraphlib.Box.instances || [];

  depgraphlib.Box.prototype.open = function(position){
    if(position){
      this.object.css('top',position.y);
      this.object.css('left',position.x);
    }
    this.object.show();
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
      if(jQuery.contains( depgraphlib.Box.instances[i], elt)){
        return depgraphlib.Box.instances[i];
      }
    }
  };
  
  /**
   * Close the window
   * @param destroy if true, destroy the window, else just hide it
   */
  depgraphlib.Box.prototype.close = function(destroy){
    if(destroy){
      this.destroy();
    }else{
      this.object.hide();
    }
  };
  
  
  /**
   * Close and destroy the window
   */
  depgraphlib.Box.prototype.destroy = function(){
    this.object.remove();
  };
  
  /***********************************************************/
  /**                   ToolTip                              */
  /***********************************************************/

  depgraphlib.GraphViewer.prototype.loadTooltipContent = function(divid){
    var div; 
    var me = depgraphlib.GraphViewer.getInstance(this);
    if(typeof divid == 'string'){
      div = jQuery('#'+me.appendOwnID(divid));
    }else{
      div = divid;
    }
    me.tooltipContainer.html(div.html());
  };

  depgraphlib.GraphViewer.prototype.showTooltip = function(position){
    var me = depgraphlib.GraphViewer.getInstance(this);
    me.tooltip.css('left',position.x);
    me.tooltip.css('top',position.y);
    me.tooltip.show();
  };

  depgraphlib.GraphViewer.prototype.hideToolTip = function(){
    var me = depgraphlib.GraphViewer.getInstance(this);
    me.tooltip.hide();
  };


  /***********************************************************/
  /**                      Misc                              */
  /***********************************************************/
  /**
   * show an ajax throbber
   */
  depgraphlib.GraphViewer.prototype.ajaxStart = function(){
    this.ajaxLoader.show();
  };

  /**
   * hide the ajax throbber
   */
  depgraphlib.GraphViewer.prototype.ajaxFinished = function(){
    this.ajaxLoader.hide();
  };

  /**
   * init full screen mode callbacks
   */
  depgraphlib.GraphViewer.prototype.initFullscreenMode = function(){
    var graphviewer = this;
    var button = jQuery('#button-fullscreen'+this.appendOwnID(''));
    button.colorbox(
        {
          inline:true,
          href:'#'+"gv-main-panel"+graphviewer.appendOwnID(''),
          width:'95%',
          height:'95%',
          onLoad:function(){
            graphviewer.removeToolbarButton('fullscreen');
            graphviewer.mainpanel.width('99%');
            graphviewer.mainpanel.height('99%');
          },
          onComplete:function(){
            graphviewer.adjustDebugHeight();
            executeCallbacks(graphviewer.callbacks.fullscreen.oncomplete);
          },
          onClosed:function(){
            graphviewer.mainpanel.width(graphviewer._width);
            graphviewer.mainpanel.height(graphviewer._height);
            graphviewer.addToolbarButton('fullscreen',null,'right','fullscreen');
            graphviewer.adjustDebugHeight();
            graphviewer.initFullscreenMode();
            executeCallbacks(graphviewer.callbacks.fullscreen.onclose);
          }
       }
    );
  };

  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  function debugSlideUp(){
    var elt = jQuery(this);
    var viewer = depgraphlib.GraphViewer.getInstance(elt[0].id);
    elt.parent().animate({bottom:'0px'});
    elt.removeClass('slide-up');
    elt.addClass('slide-down');
    viewer.mainpanel.css("border","1px solid grey");
  }

  function debugSlideDown(){
    var elt = jQuery(this);
    var viewer = depgraphlib.GraphViewer.getInstance(elt[0].id);
    var debugpanel = elt.parent();
    debugpanel.animate({bottom:(-debugpanel.height()+20)+'px'});
    elt.removeClass('slide-down');
    elt.addClass('slide-up');
    viewer.mainpanel.css("border","none");
  }

  function toggleSlider(){
    var elt = jQuery(this);
    if(elt.hasClass('slide-up')){
      debugSlideUp.call(elt);
    }else{
      debugSlideDown.call(elt);
    }
  }

  function executeCallbacks(callbacks){
    for(var i=0;i<callbacks.length;i++){
      callbacks[i].method.call(callbacks[i].caller,callbacks[i].args);
    }
  }

  /***********************************************************/
  /**                         Utils                          */
  /***********************************************************/

  depgraphlib.GraphViewer.prototype.screenCoordsForElt = function(elt){
    while(Object.prototype.toString.call( elt ) === '[object Array]'){
      elt = elt[0];
    }
    var rect = elt.getBBox();
    var svg = this.chart[0].querySelector('svg');
    var pt  = svg.createSVGPoint();
    var corners = {};
    var matrix  = elt.getScreenCTM();
    pt.x = rect.x;
    pt.y = rect.y;
    corners.nw = pt.matrixTransform(matrix);
    pt.x += rect.width;
    corners.ne = pt.matrixTransform(matrix);
    pt.y += rect.height;
    corners.se = pt.matrixTransform(matrix);
    pt.x -= rect.width;
    corners.sw = pt.matrixTransform(matrix);
    return corners;
  };

}(window.depgraphlib = window.depgraphlib || {}, jQuery));