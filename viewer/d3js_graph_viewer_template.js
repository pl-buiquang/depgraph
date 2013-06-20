if(typeof jQuery == 'undefined'){
  alert('Viewer : Error. This library needs jQuery!');
}


var gv_mainpanel = "gv-main-panel";
var gv_chart = "gv-chart";
var gv_toolbar = "gv-toolbar";
var gv_toolbar_landing_area = "gv-toolbar-landing-area";
var gv_debugpanel = "gv-debug-panel";
var gv_tooltip = "gv-tooltip";
var gv_altpanel = "gv-alt-panel";

function GraphViewer(container,uid){
  
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
  var uid = this.uid = uid; // uid
  
  if(typeof container == 'string'){ // check if jquery selection or id. id must be prepend a '#'!
    container = jQuery(container);
  }
  var container = this.container = container;
  container.css('display','inline-block');
  
  var mainpanel = this.mainpanel = this.createDiv(gv_mainpanel,"gv-main-panel");
  container.append(mainpanel);
  
  var chart = this.chart = this.createDiv(gv_chart,"gv-chart");
  mainpanel.append(chart);

  var toolbar = this.toolbar = this.initToolBar();
  var debugpanel = this.debugpanel = this.createDebugPanel();

  this.tooltip = this.createToolTipPanel();
  this.tooltip.hide();
  this.altpanel = this.createDiv(gv_altpanel,"gv-alt-panel");
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
  
  GraphViewer.instances[uid]=this;
  
  this.callbacks = new Object();
  this.callbacks.fullscreen = new Object();
  this.callbacks.fullscreen.oncomplete = [];
  this.callbacks.fullscreen.onclose = [];
  this.callbacks.showaltpanel = [];
  this.callbacks.hidealtpanel = [];
  
  
  
  this.toolbar.hide();

  this.toolbar_landing_area.hover(
      function(){
        var me = GraphViewer.getInstance(this);
        if(!me.fixedToolbar){
          me.toolbar.slideDown(100);
          //me.toolbar.show();
        }
      },
      function(){
        var me = GraphViewer.getInstance(this);
        if(!me.fixedToolbar){
          me.toolbar.slideUp(100);
          //me.toolbar.hide();
        }
      }
   );
  
}

GraphViewer.instances = [];

GraphViewer.getInstance = function(fromdiv){
  var id = "";
  if(GraphViewer.prototype.isPrototypeOf(fromdiv)){
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
     viewer = GraphViewer.instances[match[1]];
  }
  if(viewer == null){
    viewer = GraphViewer.getInstance(fromdiv.parentNode);
  }
  return viewer;
};

/***********************************************************/
/**                   Builders                             */
/***********************************************************/

GraphViewer.prototype.initToolBar = function(){
  var landing_area = this.toolbar_landing_area = this.createDiv(gv_toolbar_landing_area,gv_toolbar_landing_area);
  var toolbar = this.createDiv(gv_toolbar, gv_toolbar);
  landing_area.append(toolbar);
  this.mainpanel.append(this.toolbar_landing_area);
  // use colorbox for fullscreen mode
  this.addFullScreenButton();
  return toolbar;
};

GraphViewer.prototype.createDebugPanel = function(){
  var debugpanel = this.debugpanel = this.createDiv(gv_debugpanel,"gv-debug-panel");
  this.debugpanelinfo = this.createDiv("debug-panel-info","debug-panel-info");
  debugpanel.append(this.debugpanelinfo);
  var slider = this.createDiv("debug-panel-slider","debug-panel-slider slider-button slide-up");
  slider.click(toggleSlider);
  debugpanel.append(slider);
  var maximize = this.createDiv("debug-panel-fullscreen","debug-panel-fullscreen slider-button maximize");
  maximize.click(
      function(e){
        var graph = GraphViewer.getInstance(this);
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

GraphViewer.prototype.debugLog = function(msg){
  this.debugpanelcontent.append(msg + '<br/>');
};

GraphViewer.prototype.createToolTipPanel = function(){
  var me = this;
  this.tooltip = this.createDiv(gv_tooltip,"gv-tooltip");
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

GraphViewer.prototype.appendOwnID = function(id){
  if(id.endsWith(this.uid)){
    return id;
  }else{
    return id + "-" + this.uid;
  }
};

GraphViewer.prototype.addWrapper = function(title){
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

GraphViewer.prototype.createDiv = function(id,classes){
  return this.createElement('div',id,classes);
};

GraphViewer.prototype.createElement = function(eltname,id,classes){
  classes = (classes!=null)?('class="'+classes+'"'):'';
  var div = '<'+eltname+' id="'+this.appendOwnID(id)
    +'" '+classes+'></'+eltname+'>';
  
  return jQuery(div); 
};


/***********************************************************/
/**                   Modes / Modifiers                    */
/***********************************************************/


GraphViewer.prototype.adjustDebugHeight = function(){
  var height = this.mainpanel.height() - this.toolbar.height();
  this.debugpanel.css('height',height);
  this.debugcontentcontainer.css('height',height-20);
  this.debugpanel.css('bottom',-height+20);
};

GraphViewer.prototype.shrinkHeightToContent = function(marginBottom){
  if(marginBottom == null){
    marginBottom=0;
  }
  var vis = d3.select(this.chart.children()[0]).select('g');
  var bbox = vis.node().getBBox();
  var transform = getTransformValues(vis);
  this.setHeight(transform.translate[1]+bbox.y+bbox.height+marginBottom);
};

GraphViewer.prototype.shrinkWidthToContent = function(marginRight){
  if(marginRight == null){
    marginRight=0;
  }
  var vis = d3.select(this.chart.children()[0]).select('g');
  var bbox = vis.node().getBBox();
  var transform = getTransformValues(vis);
  this.setWidth(transform.translate[0]+bbox.x+bbox.width+marginLeft);
};

GraphViewer.prototype.shrinkToContent = function(marginRight,marginBottom){
  if(marginBottom == null){
    marginBottom=0;
  }
  if(marginRight == null){
    marginRight=0;
  }
  var vis = d3.select(this.chart.children()[0]).select('g');
  var bbox = vis.node().getBBox();
  var transform = getTransformValues(vis);
  var maxWidth = this.mainpanel.width();
  var newWidth = transform.translate[0]+bbox.x+bbox.width+marginRight;
  //if(newWidth>maxWidth)
    //newWidth = maxWidth-10;
  this.setSize(newWidth,transform.translate[1]+bbox.y+bbox.height+marginBottom);
};


GraphViewer.prototype.setContainer = function(){
  if(this.container != null){
    this.container.remove(this.appendOwnID(gv_mainpanel));
  }
};

GraphViewer.prototype.setSize = function(width,height){
  this.setWidth(width);
  this.setHeight(height);
};

GraphViewer.prototype.setImageMode = function(value){
  if(value == null){
    value = true;
  }
  this.imagemode = value;
  if(value){
    this.toolbar.detach();
    this.debugpanel.detach();
    this.tooltip.detach();
  }else{
    mainpanel.append(this.toolbar);
    mainpanel.append(this.debugpanel);
    mainpanel.append(this.tooltip);
  }
  this.margin.top = this.chart.height()/10 + this.basemargin + ((this.imagemode)?0:20);
  this.margin.bottom = this.basemargin + ((this.imagemode)?0:20);
};

GraphViewer.prototype.noBorders = function(){
  if(this.imagemode){
    this.mainpanel.css("border","none");
  }
};

GraphViewer.prototype.debugMode = function(value){
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

GraphViewer.prototype.setWidth = function(width){
  this._width = width;
  this.mainpanel.css('width',width);
  this.ajaxLoader.width(width);
};

GraphViewer.prototype.setHeight = function(height){
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

GraphViewer.prototype.setFixedToolbar = function(value){
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


GraphViewer.prototype.addFullScreenButton = function(){
  if(!this.allowFullScreen){
    return;
  }
  if(typeof this.container.colorbox != 'undefined'){
    this.addToolbarButton('fullscreen',null,'right','fullscreen');
    this.initFullscreenMode();
  }
};

GraphViewer.prototype.existToolbarButton = function(name){
  return jQuery('#button-'+this.appendOwnID(name)).length > 0;
};


GraphViewer.prototype.getToolbarButton = function(name){
  return jQuery('#button-'+this.appendOwnID(name));
};

GraphViewer.prototype.setToolbarButtons = function(definition){
  this.tmpLeft = [];
  definition.forEach(function(item,index){
    if(item[2] == 'left'){
      this.tmpLeft.push(item);
    }else{
      this.addToolbarButton(item[0], item[1], item[2], item[3]);
    }
  },this);
  this.tmpLeft.forEach(function(item,index){
    this.addToolbarButton(item[0], item[1], item[2], item[3]);
  },this);
  this.tmpLeft = null;
};

GraphViewer.prototype.resetToolbarButtons = function(){
  var children = jQuery("#"+this.appendOwnID(gv_toolbar)).children();
  children.remove();
  this.addFullScreenButton();
};

GraphViewer.prototype.addToolbarElement = function(elt,position){
  elt.css('float',position);
  jQuery("#"+this.appendOwnID(gv_toolbar)).append(elt);
};

GraphViewer.prototype.addToolbarButton = function(name,callback,position,style){
  var text = '';
  if(style == null){
    style = 'button white';
    text = name;
  }else{
    style += " icon";
  }
  if(position == null){
    position = 'left';
  }
  
  var button='<div id="button-'+this.appendOwnID(name)+'" title="'+name+'" class="'+style+' tab '+position+'">'+text+'</div>';
  button = jQuery(button);
  button.click(callback);
  jQuery("#"+this.appendOwnID(gv_toolbar)).append(button);
};

GraphViewer.prototype.removeToolbarButton = function(name){
  jQuery('#button-'+this.appendOwnID(name)).remove();
};

function createDropDownMenu(name,items){
  var div = jQuery('<div class="gv-menu"><div class="gv-menu-header"></div><div class="gv-menu-body"></div></div>');
  var header = jQuery('.gv-menu-header',div);
  var body = jQuery('.gv-menu-body',div);
  body.hide();
  header.html(name);
  for(i in items){
    var item = jQuery('<div>'+i+'</div>');
    body.append(item);
    jQuery(item).click(items[i]);
  }
  div.hover(
      function(event){jQuery('.gv-menu-body',event.currentTarget).slideDown();},
      function(event){jQuery('.gv-menu-body',event.currentTarget).slideUp();}
  );
  return div;
}

/***********************************************************/
/**                   Alt Content                          */
/***********************************************************/

GraphViewer.prototype.viewAltContent = function(divid){
  this.resetAltPanel();
  this.addContentToAltPanel(divid);
  this.showAltPanel();
};

GraphViewer.prototype.hideAltPanel = function(){
  this.chart.show();
  this.altpanel.hide();
  this.removeToolbarButton('back');
  executeCallbacks(this.callbacks.hidealtpanel);
};

GraphViewer.prototype.showAltPanel = function(callbacks){
  this.chart.hide();
  this.altpanel.show();
  this.addToolbarButton('back',function(){GraphViewer.getInstance(this.id).hideAltPanel();},'left','back');
  executeCallbacks(this.callbacks.showaltpanel);

};

GraphViewer.prototype.addContentToAltPanel = function(divid,title){
  this.altpanelcontent.html(jQuery('#'+this.appendOwnID(divid)).html());
  if(title!=null){
    this.addToolbarButton(title,function(){GraphViewer.getInstance(this.id).addContentOnAltPanel(divid);},'left');
  }
};

GraphViewer.prototype.resetAltPanel = function(){
  this.altpanelcontent.html('');
};

/***********************************************************/
/**                   ToolTip                              */
/***********************************************************/

GraphViewer.prototype.loadTooltipContent = function(divid){
  var div; 
  var me = GraphViewer.getInstance(this);
  if(typeof divid == 'string'){
    div = jQuery('#'+me.appendOwnID(divid));
  }else{
    div = divid;
  }
  me.tooltipContainer.html(div.html());
  me.tooltip.draggable();
};

GraphViewer.prototype.lockTooltip = function(){
  var me = GraphViewer.getInstance(this);
  me.tooltip.draggable('destroy');
};

GraphViewer.prototype.showTooltip = function(position){
  var me = GraphViewer.getInstance(this);
  me.tooltip.css('left',position.x);
  me.tooltip.css('top',position.y);
  me.tooltip.show();
};

GraphViewer.prototype.hideToolTip = function(){
  var me = GraphViewer.getInstance(this);
  me.tooltip.hide();
};


/***********************************************************/
/**                      Misc                              */
/***********************************************************/

function createDropDownMenu(name,items){
  var div = jQuery('<div class="gv-menu"><div class="gv-menu-header"></div><div class="gv-menu-body"></div></div>');
  var header = jQuery('.gv-menu-header',div);
  var body = jQuery('.gv-menu-body',div);
  body.hide();
  header.html(name);
  for(i in items){
    body.append('<div onclick="'+items[i]+'">'+i+'</div>');
  }
  div.hover(
      function(event){jQuery('.gv-menu-body',event.currentTarget).show();},
      function(event){jQuery('.gv-menu-body',event.currentTarget).hide();}
  );
  return div;
}

GraphViewer.prototype.ajaxStart = function(){
  this.ajaxLoader.show();
};

GraphViewer.prototype.ajaxFinished = function(){
  this.ajaxLoader.hide();
};

GraphViewer.prototype.initFullscreenMode = function(){
  var graphviewer = this;
  var button = jQuery('#button-fullscreen'+this.appendOwnID(''));
  button.colorbox(
      {
        inline:true,
        href:'#'+gv_mainpanel+graphviewer.appendOwnID(''),
        width:'95%',
        height:'95%',
        onLoad:function(){
          graphviewer.removeToolbarButton('fullscreen');
          graphviewer.mainpanel.width('99%');
          graphviewer.mainpanel.height('99%');
          graphviewer.adjustDebugHeight();
        },
        onComplete:function(){
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
  elt.parent().animate({bottom:'0px'});
  elt.removeClass('slide-up');
  elt.addClass('slide-down');
}

function debugSlideDown(){
  var elt = jQuery(this);
  var debugpanel = elt.parent();
  debugpanel.animate({bottom:(-debugpanel.height()+20)+'px'});
  elt.removeClass('slide-down');
  elt.addClass('slide-up');
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

GraphViewer.prototype.screenCoordsForElt = function(elt){
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

