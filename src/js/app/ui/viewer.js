
(function(depgraphlib){
    
    /**
     * GraphViewer.js
     * This part of the library contains functions utilities to create
     * a viewer frame for a the graph display integration in html dom page
     * 
     * Author : Paul Bui-Quang
     * INRIA
     */

    /**
     * @method init
     * @desc Create a new instance of a viewer
     * @param container
     * @param uid
     * 
     * @memberof DepGraphLib.GraphViewer#
     */
      depgraphlib.GraphViewer.prototype.init = function (container,uid){
      
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
      
      // toolbar params
      this.toolbaritems = {};
      this.toolbarindex = 0;
      
      if(depgraphlib.GraphViewer.instances[uid]){
        uid += "_";
      }
      var uid = this.uid = uid; // uid
      
      if(typeof container == 'string'){
        container = jQuery(depgraphlib.jQuerizeID(container));
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
              if(me.toolbar.queue('depgraph_toolbar_hiding_bufferqueue').length == 0){
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
              if(me.toolbar.queue('depgraph_toolbar_hiding_bufferqueue').length == 0){
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
     * @return {object} the GraphViewer instance related to the selection
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
     * @return {object} the jquery selection of the debug panel
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
     * @return {object} the jquery selection of the tooltip panel
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
      if(this.tooltip.draggable){
        this.tooltip.draggable();  
      }
      this.tooltipContainer = this.createDiv('tooltip-container');
      maincontainer.append(this.tooltipContainer);
      return this.tooltip;
    };

    /**
     * append the viewer uid to the id of an element
     * @param {string} id
     * @return {string} the id suffixed by the uid of the graph
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
     * @return {object} the jquery selection of the wrapper created
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
     * @return {object} the jquery selection of the newly div created
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
      if(!width){
        width = this.mainpanel.width();
      }
      this._width = width;
      this.mainpanel.css('width',width);
      if(this.ajaxLoader){
        this.ajaxLoader.width(width);
      }
      // here is a magical number 50 : a height not to be greater than
      /*if(this.toolbar){
        while(this.toolbar.height()>50){
          width = parseInt(width) + 50;
          this.setWidth(width);
        }
      }*/
      //
    };

    /**
     * set the height of the viewer
     * @param height
     */
    depgraphlib.GraphViewer.prototype.setHeight = function(height){
      height = 30 + parseInt(height);
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
      this.removeToolbarItem('back');
      executeCallbacks(this.callbacks.hidealtpanel);
    };

    depgraphlib.GraphViewer.prototype.showAltPanel = function(callbacks){
      this.chart.hide();
      this.altpanel.show();
      this.addToolbarItem({name:'back',callback:function(){depgraphlib.GraphViewer.getInstance(this.id).hideAltPanel();},style:'back',tooltip:'back'});
      executeCallbacks(this.callbacks.showaltpanel);

    };

    depgraphlib.GraphViewer.prototype.addContentToAltPanel = function(divid,title){
      this.altpanelcontent.html(jQuery('#'+this.appendOwnID(divid)).html());
      if(title!=null){
        this.addToolbarItem({name:title,callback:function(){depgraphlib.GraphViewer.getInstance(this.id).addContentOnAltPanel(divid);},tooltip:title});
      }
    };

    depgraphlib.GraphViewer.prototype.resetAltPanel = function(){
      this.altpanelcontent.html('');
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
      var button = graphviewer.getToolbarItem('fullscreen').button;
      button.colorbox(
          {
            inline:true,
            href:'#'+"gv-main-panel"+graphviewer.appendOwnID(''),
            width:'95%',
            height:'95%',
            onLoad:function(){
              graphviewer.setToolbarItemActive('fullscreen',false,true);
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
              graphviewer.setToolbarItemActive('fullscreen',true,true);
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

  
}(window.depgraphlib));

