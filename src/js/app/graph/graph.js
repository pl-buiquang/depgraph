/**
 * @file This part of the library contains the class DepGraph core definition for displaying a graph.
 * @author Paul Bui-Quang
 */

(function(depgraphlib){

    /**
     * @method init
     * 
     * @desc Create a new instance of a graph
     * 
     * @param viewer The viewer in which the graph will be displayed
     * @param json_data The graph data in json
     * @param options :
     * uid : id
     * viewmode : streched | cropped | full
     * viewsize : auto/null (for full viewmode) | width (in px or %) 
     * 
     * 
     * 1. set attributes
     * 2. set and preprocess data
     * 3. backup data
     * 4. create svg layout
     * 5. build the graph from the current data
     * 6. apply post processing
     * 7. set viewer additional settings
     * 8. instanciate edit object
     * 
     * @memberof DepGraphLib.DepGraph#
     */
    depgraphlib.DepGraph.prototype.init = function (container, json_data, options) {
      this.options = options || {};
      this.viewer = new depgraphlib.GraphViewer(container,this.options.uid);
      
      depgraphlib.DepGraph.instances[this.viewer.uid] = this;

      this.callbacks = new Object();

      this.setData(json_data);
      this.original_data = depgraphlib.clone(this.data);
      this.createLayout();
      this.update();

      this.postProcesses();
      
      this.autoHighLightOnMouseOver();
      this.viewerSettings();
      
      this.editObject = new depgraphlib.EditObject(this);
    }; 

    depgraphlib.DepGraph.prototype.getOriginalUID = function(){
      return this.viewer.uid.replace(/_*$/g, '');
    };
    
    
    /**
     * @function viewerSettings
     * 
     * @desc Set up viewer callbacks and settings :
     * - callback when fullscreen open and close
     * @memberof DepGraph#
     */
    depgraphlib.DepGraph.prototype.viewerSettings = function(){
      this.viewer.callbacks.fullscreen.oncomplete.push({
        method:this.centerGraph,
        caller:this
        }
      );
      this.viewer.callbacks.fullscreen.onclose.push({
        method:this.centerGraph,
        caller:this
        }
      );
    };

    /**
     * Center the graph within its container (used when in fullscreen mode).
     * If container is smaller than the content graph, graph position is set in accordance with
     * margins parameters (see #style)
     */
    depgraphlib.DepGraph.prototype.centerGraph = function(){
      var chart = this.viewer.chart;
      var chartBBox = chart[0].getBoundingClientRect();
      var visBBox = this.vis.node().getBBox();
      var previousValues = depgraphlib.getTransformValues(this.vis);
      var x  = (chartBBox.width-visBBox.width)/2;
      var y = (chartBBox.height-visBBox.height)/2;
      y = y>0?y:depgraphlib.removeUnit(this.data.graph['#style'].margin.top);
      x = x>0?x:depgraphlib.removeUnit(this.data.graph['#style'].margin.left);
      this.vis.attr("transform","translate(" + 
          (x-visBBox.x) + "," + 
          (y-visBBox.y)+") scale("+previousValues.scale[0]+")");
      this.createScrollBar();
    };

    /**
     * Switch on or off the highlight on mouseover (link and words)
     */
    depgraphlib.DepGraph.prototype.autoHighLightOnMouseOver = function(value){
      var me = this;
      
      if(value==null || value){
        this.vis.selectAll('g.link').on("mouseover.autohighlight",function(){depgraphlib.DepGraph.highlightLink(this, true); });
        this.vis.selectAll('g.link').on("mouseout.autohighlight",function(){depgraphlib.DepGraph.highlightLink(this, false); });
        this.vis.selectAll('g.word').on("mouseover.autohighlight",function(){depgraphlib.DepGraph.highlightWord(this, true); if(me.options.onObjectMouseOver){
        me.options.onObjectMouseOver.call(this,this,true);
      };});
        this.vis.selectAll('g.word').on("mouseout.autohighlight",function(){depgraphlib.DepGraph.highlightWord(this, false); if(me.options.onObjectMouseOver){
        me.options.onObjectMouseOver.call(this,this,false);
      };});
      }else{
        this.vis.selectAll('g.link').on("mouseover.autohighlight",null);
        this.vis.selectAll('g.link').on("mouseout.autohighlight",null);
        this.vis.selectAll('g.word').on("mouseover.autohighlight",null);
        this.vis.selectAll('g.word').on("mouseout.autohighlight",null);

      }
    };

    /**
     * Static variable containing all instances of depgraphs on the page (keyed by their viewer uid)
     * @memberof depgraphlib.DepGraph
     */
    depgraphlib.DepGraph.instances = depgraphlib.DepGraph.instances || [];

    /**
     * Retrieve the depgraph instance from :
     * - id of a div
     * - svg element
     * - jquery div selection
     * @param fromdiv
     * @return {object|null} a instance of the class DepGraph 
     */
    depgraphlib.DepGraph.getInstance = function(fromdiv) {
      if(fromdiv){
        try{
          if (depgraphlib.DepGraph.prototype.isPrototypeOf(fromdiv)) {
            return fromdiv;
          } else if (fromdiv.ownerSVGElement != null) {
            fromdiv = fromdiv.ownerSVGElement.parentNode.id;
          } else if(fromdiv.nodeName && fromdiv.nodeName == 'svg'){
            fromdiv = fromdiv.parentNode.id;
          } else if (typeof fromdiv == 'object' && fromdiv.id != null) {
            fromdiv = fromdiv.id;
          }

          regex = /.*-(\w+)/;
          var match = regex.exec(fromdiv);
          if (match != null) {
            return depgraphlib.DepGraph.instances[match[1]];
          }
          return null;

        }catch(err){
          console.log(err);
          return null;
        }
      }
    };
    

    /**
     * Initial set up and preprocess of graph data
     * @param json_data
     */
    depgraphlib.DepGraph.prototype.setData = function(json_data){
      this.data = json_data;
      this.prepareData();
    };

    /**
     * Reset data and run immediatly an update
     * @param json_data
     */
    depgraphlib.DepGraph.prototype.resetData = function(json_data){
      this.setData(json_data);
      this.createLayout();
      this.update();

      this.postProcesses();
      
      this.autoHighLightOnMouseOver();
      if(this.editObject.editMode){
        this.editObject.editModeInit();  
      }
    };

    /**
     * Clean added data (used for graph svg layout creation)
     * TODO(paul) clean other added data (#id)
     */
    depgraphlib.DepGraph.prototype.cleanData = function(){
      var links = this.vis.selectAll("g.link");
      this.resetLinksProperties(links);
      var data = depgraphlib.clone(this.data);

      removeDataModelBindingsForType('words',data);
      removeDataModelBindingsForType('links',data);
      removeDataModelBindingsForType('chunks',data);

      return data;
    };


    function removeDataModelBindingsForType(type,data){
      for(var j = 0; j<data.graph[type].length ; ++j){
        var entity = data.graph[type][j];
        entity.label = depgraphlib.getValue(entity,entity.label);
        if(entity.sublabel){
          for(var i in entity.sublabel){
            entity.sublabel[i] = depgraphlib.getValue(entity,entity.sublabel[i]);
          }  
        }
      }
    };


    /**
     * Apply post processing to the graph :
     * - set the graph position according to margin global style
     * - apply viewer view mode (shrinkToContent is default)
     * TODO(paul) : add parameter or attributes to depgraph in order to control which view mode to apply
     */
    depgraphlib.DepGraph.prototype.postProcesses = function(){
      var visBBox = this.vis.node().getBBox();
      this.vis.attr("transform","translate(" + 
          (depgraphlib.removeUnit(this.data.graph['#style'].margin.left)-visBBox.x) + "," + 
          (depgraphlib.removeUnit(this.data.graph['#style'].margin.top)-visBBox.y)+") scale(1)");
      
      this.setViewMode();
    };

    depgraphlib.DepGraph.prototype.postProcessesFixHeight = function(){
      var visBBox = this.vis.node().getBBox();
      var prevValues = depgraphlib.getTransformValues(this.vis);
      this.vis.attr("transform","translate(" + 
          prevValues.translate[0] + "," + 
          (depgraphlib.removeUnit(this.data.graph['#style'].margin.top)-visBBox.y)+") scale(1)");
      
      this.viewer.shrinkHeightToContent(depgraphlib.removeUnit(this.data.graph['#style']['margin'].bottom)+20);
      if(this.scrollbar){
        this.scrollbar.attr('y',this.viewer.mainpanel.height()-40);
      }
    };

    /**
     * Set the view mode (full | strechted | cropped)
     * Apply viewer mode and add scrollbar or proper scale if necessary
     * 
     * For values in %, make sure that the container wrapping the viewer is displayed as block and a size is set.
     */
    depgraphlib.DepGraph.prototype.setViewMode = function(){
      if(this.options.viewmode && this.options.viewmode != 'full'){
        this.setWidthLimitedViewMode(this.options.maxwidth||this.viewer.container.parent().width());  
      }else{
        var visBBox = this.vis.node().getBBox();
        if(this.options.maxwidth && this.options.maxwidth<visBBox.width){
          this.options.viewmode = 'cropped';
          this.setWidthLimitedViewMode(this.options.maxwidth,true);
        }else{
          this.options.viewmode = 'full';
          this.setFullViewMode();
        }
      }
    };
    
    
    depgraphlib.DepGraph.prototype.setFullViewMode = function(){
      this.viewer.shrinkToContent(depgraphlib.removeUnit(this.data.graph['#style']['margin'].right),depgraphlib.removeUnit(this.data.graph['#style']['margin'].bottom)+20);
    };
    
    
    /**
     * Set the view mode to a limited width (cropped or strechted)
     * @param defaultWidth
     * @param forceCrop
     */
    depgraphlib.DepGraph.prototype.setWidthLimitedViewMode = function(defaultWidth,forceCrop){
      this.viewer.shrinkHeightToContent(depgraphlib.removeUnit(this.data.graph['#style']['margin'].bottom)+20);
      if(defaultWidth){
        this.options.viewsize = defaultWidth;
      }
      this.viewer.setWidth(this.options.viewsize);
      if(forceCrop || this.options.viewmode == 'cropped'){
        this.createScrollBar();
      }else {// if(this.options.viewmode == 'stretched'){
        var visBBox = this.vis.node().getBBox();
        var scale = this.viewer.chart.width() / (visBBox.width + depgraphlib.removeUnit(this.data.graph['#style']['margin'].right)*2);
        this.scale(scale);
        this.viewer.shrinkHeightToContent(depgraphlib.removeUnit(this.data.graph['#style']['margin'].bottom)+20);
      }
    };

    depgraphlib.DepGraph.scrollBarWidth = 30;
    
    depgraphlib.DepGraph.prototype.setUpScrollBarView = function(graphWidth,viewerWidth,x){
      
      var k = (graphWidth-viewerWidth)/(viewerWidth-depgraphlib.DepGraph.scrollBarWidth);
      this.scrollbar = this.svg.select('.scrollbar');
      if(this.scrollbar.node() == null){
        this.scrollbar = this.svg.append('rect').classed('scrollbar',true);
      }
      this.scrollbar.attr('x',0)
      .attr('y',this.viewer.mainpanel.height()-40)
      .attr('rx',1)
      .attr('ry',1)
      .attr('width',depgraphlib.DepGraph.scrollBarWidth)
      .attr('height',5)
      .style('stroke',"grey")
      .style('fill',"lightgrey")
      .style('stroke-width',1)
      .__info__ = {maxX:viewerWidth - depgraphlib.DepGraph.scrollBarWidth,k:k};
      if(x!=null){
        return this.scrollbarTranslate(x);
      }
    };

    depgraphlib.DepGraph.prototype.scrollbarTranslate = function(x){
      var sx = parseFloat(this.scrollbar.attr('x'));
      var kx = x / this.scrollbar.__info__.k;
      if(this.scrollbar.__info__.maxX < (sx + kx)){
        kx = this.scrollbar.__info__.maxX - sx;
      }else if(sx + kx < 0){
        kx = -sx;
      }
      x = this.scrollbar.__info__.k*kx;
      this.scrollbar.attr('x',sx+kx);
      return x;
    };

    depgraphlib.DepGraph.prototype.scale = function(scale){
      var me = depgraphlib.DepGraph.getInstance(this);
      var previousValues = depgraphlib.getTransformValues(me.vis);
      me.vis.attr("transform",
          "translate(" + (previousValues.translate[0])*scale + "," + (previousValues.translate[1])*scale + ")" + " scale("+scale+")");
    };
    
    /**
     * translate the graph relative to parameters x and y
     * @param x
     * @param y
     */
    depgraphlib.DepGraph.prototype.translateGraph = function(x,y){
      
      var me = depgraphlib.DepGraph.getInstance(this);
      var previousValues = depgraphlib.getTransformValues(me.vis);
      
      if(me.scrollbar){
        x = me.scrollbarTranslate(x);  
      }

      var newx = previousValues.translate[0]-parseFloat(x);
      newx = Math.round(newx*1000000)/1000000;

      me.vis.attr("transform",
          "translate(" + newx + "," + (previousValues.translate[1]-y) + ")" + " scale("+previousValues.scale[0]+")");

      if(me.hyperbolicView){
        me.hyperbolicViewCompute();
      }
      
    };

    /**
     * Create the scrollbar and set up the callbacks for scrolling the view
     */
    depgraphlib.DepGraph.prototype.createScrollBar = function(){
      var me = this;
      
      var graphBBox = this.vis.node().getBBox();
      var graphWidth = graphBBox.width + 2*depgraphlib.removeUnit(this.data.graph['#style']['margin'].right); 
      var viewerWidth = this.viewer.mainpanel.width();
      
      if(this.scrollbar){
        jQuery(this.scrollbar.node()).remove();
      }
      if(graphWidth > viewerWidth){
        
        this.setUpScrollBarView(graphWidth,viewerWidth);

        this.scrollMouseSelected = null;
        
        this.scrollbar.on('mousedown',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(this);
          depgraphlib.DepGraph.depgraphActive = '-' + depgraph.viewer.uid;
          depgraph.scrollMouseSelected = d3.event.clientX;
          d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
        });
        
        this.viewer.addToolbarItem({name:'resetView',callback:function(){me.resetData(me.data);},style:'reset-view',group:'-1',static:true});
        /*
        d3.select(this.viewer.chart[0]).on('mouseover',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(d3.event.originalTarget);
          depgraph.setFullViewMode();
        });
        
        d3.select(this.viewer.chart[0]).on('mouseout',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(d3.event.originalTarget);
          depgraph.setViewMode();
        });*/
        this.vis.selectAll('g.link').on("click",function(){
          me.displayFullLinkSpan(this);
        });
        this.vis.selectAll('g.word').on("click",function(){
          me.hideChildren(this);
        });


        d3.select(document).on('click.focus',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(d3.event.originalTarget || d3.event.srcElement || d3.event.target);
          if(depgraph){
            depgraphlib.DepGraph.depgraphActive = '-' + depgraph.viewer.uid;
          }else{
            depgraphlib.DepGraph.depgraphActive = null;
          }
        });
        
        d3.select(document).on('mousedown.scrollbar',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(d3.event.originalTarget || d3.event.srcElement || d3.event.target);
          if(depgraph){
            depgraphlib.DepGraph.depgraphActive = '-' + depgraph.viewer.uid;
            if(d3.event.ctrlKey){
              depgraph.scrollMouseSelected = d3.event.clientX;
              d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
            }
          }else{
            depgraphlib.DepGraph.depgraphActive = null;
          }
        });
        
        // chrome
        d3.select(document).on('mousewheel.scrollbar',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(depgraphlib.DepGraph.depgraphActive);
          if(depgraph && depgraph.scrollbar){
            if(d3.event.ctrlKey){
              depgraph.zoom(3*d3.event.wheelDeltaY/(-40));
            }else if(d3.event.altKey){
              //depgraph.linkDepthZoom(3*d3.event.wheelDeltaY/(-40));
            }else{
              depgraph.translateGraph(3*d3.event.wheelDeltaY/(-40),0);  
            }
            
            d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
          }
        });
        
        // FF
        d3.select(document).on('wheel.scrollbar',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(depgraphlib.DepGraph.depgraphActive);
          if(depgraph && depgraph.scrollbar){
            if(d3.event.ctrlKey){
              depgraph.zoom(3*d3.event.deltaY);
            }else if(d3.event.altKey){
              //depgraph.linkDepthZoom(3*d3.event.deltaY);
            }else{
              depgraph.translateGraph(3*d3.event.deltaY,0);
            }
            d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
          }
        });

        d3.select(document).on('mousemove.scrollbar'+me.viewer.uid,function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(depgraphlib.DepGraph.depgraphActive);
          if(depgraph && (depgraph.scrollMouseSelected || depgraph.scrollMouseSelected === 0)){
            var xoffset = d3.event.clientX - depgraph.scrollMouseSelected;
            if(depgraph.scrollbar){
              xoffset = xoffset * depgraph.scrollbar.__info__.k; 
            }
            depgraph.translateGraph(xoffset,0);
            depgraph.scrollMouseSelected = d3.event.clientX;
          }
        });
        
        d3.select(document).on('mouseup.scrollbar'+me.viewer.uid,function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(depgraphlib.DepGraph.depgraphActive);
          if(depgraph){
            depgraph.scrollMouseSelected = null;
          }
        });
        
      }
      
      d3.select(document).on('keydown.move'+me.viewer.uid,function(e){
        var translateSpeed = 10;
        if(depgraphlib.DepGraph.depgraphActive){
          var depgraph = depgraphlib.DepGraph.getInstance(depgraphlib.DepGraph.depgraphActive);
          if(d3.event.keyCode==37){ // left
            depgraph.translateGraph(-translateSpeed,0);
          }else if(d3.event.keyCode==39){ // right
            depgraph.translateGraph(translateSpeed,0);
          }else if(d3.event.keyCode == 72){
            depgraph.hyperbolicView = !depgraph.hyperbolicView;
          }
        }
      });
    };

    depgraphlib.DepGraph.prototype.displayHelp = function(elt){
      var me = this;
      var coords = elt.getBoundingClientRect();
      var point = {x:coords.left,y:coords.top + coords.height + 2};
      var div ='<div></div>';
      div = jQuery(div);
      jQuery.ajax({
        type: 'POST', 
        url: depgraphlib.helpurl,
        data: {
          app:"depgraph"
        },
        dataType : 'html',
        success: function(data, textStatus, jqXHR) {
          div.html(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          alert(textStatus);
        }
      });
      var box = this.viewer.createBox({draggable:true,closeButton:true,autodestroy:true});
      box.setFixedSize(600,500);
      box.setContent(jQuery(div)).setHeader('DepGraph Help');
      
      box.open(point);
    };
    
    /**
     * (Re-)Create the svg element, apply background color, enter svg definitions, and attach some
     * events handler
     * TODO(paul) : refactor this function
     */
    depgraphlib.DepGraph.prototype.createLayout = function() {
      if(this.svg != null){
        this.svg.remove();
      }
      
      this.svg = d3.select(this.viewer.chart[0]).append("svg")
      .attr("width", "100%").attr("height", "100%").style('margin-top','30px');
      
      this.viewer.chart.css('background-color',this.data.graph['#style']['background-color']);
      this.svg.append('rect').classed('export_bg',true).attr('width','0').attr('height','0').style('fill',this.data.graph['#style']['background-color']);
      
      this.setSVGDefs();
      
      this.vis = this.svg.append("g").attr("transform","translate(" + 
          depgraphlib.removeUnit(this.data.graph['#style'].margin.left) + "," + 
          depgraphlib.removeUnit(this.data.graph['#style'].margin.top)+") scale(1)");

      this.viewer.addToolbarItem({name:'export',callback:exportData,style:'export',group:'0',static:true});
      this.viewer.addToolbarItem({name:'help',callback:function(){me.displayHelp(this);},style:'main-help',group:'99',static:true});
      
      var me = this;
      /**
       * export the data
       * TODO(paul) add callback to handle the action of this function
       */
      function exportData(){
        var coords = this.getBoundingClientRect();
        var point = {x:coords.left,y:coords.top + coords.height + 2};
        var div ='<div>';
      /*    if(depgraph.gid != null){
          div += 'Wiki reference (copy paste to create a reference to this graph):<br> &lt;st uid="'+depgraph.gid+'"&gt;&lt;/st&gt;<br>';
        }*/

        if(!me.options.exportFormats){
          me.options.exportFormats = {
            'json':'json',
            'image':'png',
            'dep2pict':'dep2pict'
          };
        }

        if(depgraphlib.plugins && depgraphlib.plugins.tikzdep){
          me.options.exportFormats['tikz-dep'] = 'tikz-dep';
        }

        div += 'Export Format : '
          + '<select name="type">';
        for(var availableFormat in me.options.exportFormats){
          div += '<option value="'+me.options.exportFormats[availableFormat]+'">'+availableFormat+'</option>';
        }
        div += '</select><br/>'
        +'<input id="export-data'+me.viewer.appendOwnID('')+'"  type="button" value="Export"></div>';
        div = jQuery(div);
        var box = me.viewer.createBox({closeButton:true,autodestroy:true});
        box.setContent(jQuery(div));
        jQuery('#export-data'+me.viewer.appendOwnID('')).click(function(){
          var select = jQuery('select',this.parentNode);
          var format = select[0].options[select[0].selectedIndex].value;
          if(format == 'png'){
            exportPng();
          }else{
            //TODO(paul) : send raw parameter if not in custom edit mode
            var ddata = me.cleanData();
            depgraphlib.windowOpenPost(
                {'action':'export',
                  'data':ddata,
                  'gid':me.options.gid,
                  'source_format':'json',
                  'target_format':format},
                me.wsurl);
//              window.open('edit/export/'+format);
          }
          box.close(true);
        });
        
        box.open(point);
      }
      
      function exportPng(){
        d3.select('rect.export_bg').attr('width','100%').attr('height','100%');
        var svgBBox = me.svg.node().getBBox();
        me.svg.attr('width',svgBBox.width);
        me.svg.attr('height',svgBBox.height);
        if(me.scrollbar){
          me.scrollbar.style("display","none");  
        }
        

        var svg_xml = (new XMLSerializer).serializeToString(me.svg.node());
        if(me.scrollbar){
          me.scrollbar.style("display","block");
        }
        /*
        var form = document.getElementById("export_png");
        if(!form){
          depgraph.viewer.chart.append('<form id="export_png" method="post" action="edit/export/png" target="_blank">'+
              '<input type="hidden" name="data" value="" />'+
              '</form>');
          form = document.getElementById("export_png");
        }
        form['data'].value = svg_xml ;
        form.submit();*/
        depgraphlib.windowOpenPost(
            {'action':'export',
              'data':svg_xml,
              'source_format':'json',
              'target_format':'png'},
            me.wsurl);
        
        d3.select('rect.export_bg').attr('width','0').attr('height','0');
      };

    };



    
    

    /**
     * @function update
     * @desc Read data and construct the graph layout (update and init)
     * 
     * @memberof DepGraphLib.DepGraph#
     */
    depgraphlib.DepGraph.prototype.update = function(){
      

      var words = this.words = this.vis.selectAll("g.word")
      .data(this.data.graph.words,function(d){return d['#id'];});
      words.enter().append("g").classed("word",true);
      var words_exit = words.exit();
      words_exit.remove();
      words.each(setWordMaterials);
      
      var chunks = this.chunks = this.vis.selectAll("g.chunk")
      .data(this.data.graph.chunks,function(d){return d['#id'];});
      chunks.enter().insert("g",'g.word').classed("chunk",true);
      var chunks_exit = chunks.exit();
      chunks_exit.remove();
      chunks.each(setChunkMaterials);

      var links = this.links = this.vis.selectAll("g.link")
        .data(this.data.graph.links,function(d){return d['#id'];}); 
      links.enter().append("g").classed("link",true);
      var links_exit = links.exit();
      links_exit.remove();
      this.resetLinksProperties(links);
      this.preprocessLinksPosition(links);
      links.each(setLinkMaterials);
      
    };

    /**
     * Insert a word from its data and update the graph 
     * @param word
     * @param position
     */
    depgraphlib.DepGraph.prototype.insertWord = function(word,position){
      if(word['#id']==null){
        word['#id'] = this.id++;
      }
      if(word['id']==null){
        word['id'] = '_w' + word['#id'];
      }
      this.data.graph.words.splice(position,0,word);
      for(var i=position+1;i<this.data.graph.words.length;++i){
        this.data.graph.words[i]['#position']++;
      }
      this.update();
      this.postProcesses();
      this.editObject.editModeInit();
      this.autoHighLightOnMouseOver();
    };

    /**
     * Add a link and update the graph
     * @param link
     */
    depgraphlib.DepGraph.prototype.insertLink = function(link) {
      if(link['#id']==null){
        link['#id'] = this.id++;
      }
      this.data.graph.links.push(link);
      this.update();
      this.postProcesses();
      this.editObject.editModeInit();
      this.autoHighLightOnMouseOver();
    };

    /**
     * Add a chunk and update the graph
     * TODO(paul) : add chunk implementation
     * @param chunk
     */
    depgraphlib.DepGraph.prototype.insertChunk = function(chunk) {
      this.data.graph.chunks.push(chunk);
      this.update();
      this.postProcesses();
      this.editObject.editModeInit();
      this.autoHighLightOnMouseOver();
    };

    /**
     * Remove a word by its #id and perform update
     * @param id
     * @returns list of obsolete links data that were removed during the process
     */
    depgraphlib.DepGraph.prototype.removeWord = function(id){
      var affectedLinks = [];
      var index = this.getWordIndexById(id);
      if(index == null){
        return false;
      }
      
      var position = this.data.graph.words[index]['#position'];
      var affectedID = this.data.graph.words[index].id;

      this.data.graph.words.splice(index,1);
      
      for(var i=position;i<this.data.graph.words.length;++i){
        this.data.graph.words[i]['#position']--;
      }
      
      for(var i=0;i<this.data.graph.links.length;i++){
        var link = this.data.graph.links[i];
        if(link.source == affectedID || link.target == affectedID){
          affectedLinks.push(depgraphlib.clone(link));
          this.data.graph.links.splice(i,1);
          i--;
        }
      }
      
      this.update();
      this.postProcesses();
      return affectedLinks;
    };

    /**
     * Remove a link by its #id and perform graph update
     * @param id
     * @returns {Boolean} true if success
     */
    depgraphlib.DepGraph.prototype.removeLink = function(id){
      var index = this.getLinkIndexById(id);
      if(index == null){
        return false;
      }
      this.data.graph.links.splice(index,1);
      this.update();
      this.postProcesses();
      return true;
    };

    /**
     * Remove a chunk by its #id an perform graph update
     * @param id
     * @returns the list of deleted obsolete links
     * TODO(paul) à implémenter
     */
    depgraphlib.DepGraph.prototype.removeChunk = function(id){
      var index = this.getChunkIndexById(id);
      if(index == null){
        return false;
      }

      var affectedLinks = [];
      var affectedID = this.data.graph.chunks[index].id;

      this.data.graph.chunks.splice(index,1);

      for(var i=0;i<this.data.graph.links.length;i++){
        var link = this.data.graph.links[i];
        if(link.source == affectedID || link.target == affectedID){
          affectedLinks.push(depgraphlib.clone(link));
          this.data.graph.links.splice(i,1);
          i--;
        }
      }
      
      this.update();
      this.postProcesses();
      return affectedLinks;
    };


    /************************************************************/
    /**                   Layout Creation                      **/
    /************************************************************/

    /**
     * @function setWordMaterials
     * @private
     * @desc set up or update a node svg element (style, content and position) for a word data
     * @param {object} d - the link data
     * @param {number} i - the link index
     * @memberof DepGraphLib.DepGraph#
     */
    function setWordMaterials(d,i){
      var node = d3.select(this);
      var elt = node.node();
      
      var fontSize = elt.getStyle('font-size');
      var subfontSize = elt.getStyle('sub-font-size');
      var color = elt.getStyle('color');
      var subColor = elt.getStyle('sub-color');
      var fontWeight = elt.getStyle('font-weight');
      var subfontWeight = elt.getStyle('sub-font-weight');
      var fontStyle = elt.getStyle('font-style');
      var subfontStyle = elt.getStyle('sub-font-style');
      
      var rect = elt.components!= null ? elt.components.rect : node.append("rect");
      var text = elt.components!= null ? elt.components.text : node.append("text");
      var label = elt.components!= null ? elt.components.label : text.append("tspan");
      var sublabels = elt.components!= null ? elt.components.sublabels : [];
      label.text(depgraphlib.getValue(d,d.label))
        .style('fill',color)
        .style('font-style',fontStyle)
        .style('font-weight',fontWeight)
        .style('font-size',fontSize);
      if(d.sublabel){
        for(var i=0;i<d.sublabel.length;++i){
          var sublabel = null;
          if(sublabels[i]!=null){
            sublabel = sublabels[i];
          }else{
            sublabel = text.append("tspan");
            sublabels.push(sublabel);
          }
          sublabel.text(depgraphlib.getValue(d,d.sublabel[i]))
          .style('font-size',subfontSize)
          .style('font-style',subfontStyle)
          .style('font-weight',subfontWeight)
          .style('fill',subColor)
          .attr('x','0px')
          .attr('dy','1.25em');
        }
      }
      
      var highlight = 'none';
      if(d.selected != null || elt.getStyle('highlighted',false)){
        highlight = 'yellow';
      }
      
      var bbox = text.node().getBBox();
      rect.attr('x',0)
      .attr('y',bbox.y)
      .attr('rx',10)
      .attr('ry',10)
      .attr('width',bbox.width)
      .attr('height',bbox.height)
      .style('stroke',"transparent")
      .style('fill',highlight)
      .style('stroke-width',1);
      
      var me = depgraphlib.DepGraph.getInstance(this);
      var previousSibling = me.getWordNodeByPosition(node.datum()['#position']-1);
      var margin = elt.getStyle('margin');
      if(previousSibling != null){
        var transform = depgraphlib.getTransformValues(d3.select(previousSibling));
        var bbox = previousSibling.getBBox();
        var x = depgraphlib.removeUnit(depgraphlib.addPxs(transform.translate[0],bbox.width,margin.right,margin.left));
        var y = depgraphlib.removeUnit(margin.top);
        depgraphlib.setGroupPosition(node,x,y);
      }
      else{
        var x = depgraphlib.removeUnit(margin.left);
        var y = depgraphlib.removeUnit(margin.top);
        depgraphlib.setGroupPosition(node,x,y);
      }

      node.node().components = {text:text,label:label,rect:rect,sublabels:sublabels};
    }

    /**
     * @function setChunkMaterial
     * @desc set up or update a node svg element (style, content and position) for a chunk data
     * @todo update not implemented. Recreation of new chunk ev time!
     * @param {object} d - the link data
     * @param {number} i - the link index
     * @private
     * @memberof DepGraphLib.DepGraph#
     */
    function setChunkMaterials(d,i){
      var node = d3.select(this);
      var me = depgraphlib.DepGraph.getInstance(node.node());
      var elt = node.node();
      elt.components = elt.components || {};
      
      var rect = elt.components.rect || node.append("rect");
      var min = {x : 99999, y : 99999};
      var max = {x:0,y:0};
      for(var i=0;i<d.elements.length;i++){
        var word = me.getWordNodeByOriginalId(d.elements[i]);
        var transform = depgraphlib.getTransformValues(d3.select(word));
        var coord = {x:transform.translate[0],y:transform.translate[1]};
        var bbox = word.getBBox();
        if(coord.x+bbox.x<min.x){
          min.x=coord.x+bbox.x;
        }
        if(coord.y+bbox.y<min.y){
          min.y=coord.y+bbox.y;
        }
        if(coord.x+bbox.width+bbox.x>max.x){
          max.x = coord.x+bbox.width+bbox.x;
        }
        if(coord.y+bbox.height+bbox.y>max.y){
          max.y =coord.y+bbox.height+bbox.y;
        }
      }
      
      var margin = elt.getStyle('margin');
      var fontSize = elt.getStyle('font-size');
      var subfontSize = elt.getStyle('sub-font-size');
      var color = elt.getStyle('color');
      var subColor = elt.getStyle('sub-color');
      var fontWeight = elt.getStyle('font-weight');
      var subfontWeight = elt.getStyle('sub-font-weight');
      var fontStyle = elt.getStyle('font-style');
      var subfontStyle = elt.getStyle('sub-font-style');
      var backgroundColor = elt.getStyle('background-color');
      var borderColor = elt.getStyle('border-color');
      var borderSize = elt.getStyle('border-size');
      
      var line = elt.components.line || node.append('line');
      line.attr('y1',depgraphlib.addPxs(max.y,2*depgraphlib.removeUnit(margin.top)))
        .attr('x1',0)
        .attr('y2',depgraphlib.addPxs(max.y,2*depgraphlib.removeUnit(margin.top)))
        .attr('x2',max.x-min.x+depgraphlib.removeUnit(margin.left)+depgraphlib.removeUnit(margin.right))
        .style('stroke',borderColor)
        .style('stroke-width',borderSize);

      var text = elt.components.text || node.append("text");
      var label = elt.components.label || text.append("tspan");
      var sublabels = elt.components.sublabels || [];
      text.attr('y',depgraphlib.addPxs(20,max.y,2*depgraphlib.removeUnit(margin.top)));
      label.text(depgraphlib.getValue(d,d.label))
         .style('fill',color)
        .style('font-style',fontStyle)
        .style('font-weight',fontWeight)
        .style('font-size',fontSize);
      if(d.sublabel){
        for(var i=0;i<d.sublabel.length;++i){
          var sublabel = null;
          if(sublabels[i]!=null){
            sublabel = sublabels[i];
          }else{
            sublabel = text.append("tspan");
            sublabels.push(sublabel);
          }
          sublabel
          .text(depgraphlib.getValue(d,d.sublabel[i]))
          .style('font-size',subfontSize)
          .style('font-style',subfontStyle)
          .style('font-weight',subfontWeight)
          .style('fill',subColor)
          .attr('dx',-(d.sublabel[i].length-1)*depgraphlib.removeUnit(subfontSize))
          .attr('dy','1.25em');
        }
      }

      var offset = text.node().getBBox().height;
      rect.attr('x',0)
      .attr('y',0)
      .attr('rx',10)
      .attr('ry',10)
      .attr('width',max.x-min.x+depgraphlib.removeUnit(margin.left)+depgraphlib.removeUnit(margin.right))
      .attr('height',depgraphlib.addPxs(max.y,-min.y,offset,2*depgraphlib.removeUnit(margin.top),20))
      .style('fill',backgroundColor)
      .style('stroke',borderColor)
      .style('stroke-width',borderSize);

      depgraphlib.center(text,rect);
      node.node().components = {text:text,rect:rect,line:line,sublabels:sublabels,label:label};

      depgraphlib.setGroupPosition(node,min.x-depgraphlib.removeUnit(margin.left),min.y-depgraphlib.removeUnit(margin.top));
    }

    /**
     * @function setLinkMaterials
     * @desc set up or update a node svg element (style, content and position) for a link data
     * @param {object} d - the link data
     * @param {number} i - the link index
     * @private
     * @memberof DepGraphLib.DepGraph#
     */
    function setLinkMaterials(d,i){
      var node = d3.select(this);
      var me = depgraphlib.DepGraph.getInstance(this);
      var elt = this;
      var p = me.getLinkProperties(node.node());
      
      // Style
      var margin = elt.getStyle('margin');
      var fontSize = elt.getStyle('font-size');
      var color = elt.getStyle('color');
      var linkColor = elt.getStyle('link-color');
      var linkSize = elt.getStyle('link-size');
      var fontWeight = elt.getStyle('font-weight');
      var fontStyle = elt.getStyle('font-style');
      var oriented = elt.getStyle('oriented');
      var align = elt.getStyle('align');
      var highlighted = elt.getStyle('highlighted',false);
      var strokeDasharray = elt.getStyle('stroke-dasharray','none');
      
      var isEllipse = (d['#data'])?(d['#data'].type == "ellipsis"):false;
      var isSegmentation = (d['#data'])?(d['#data'].type == "segmentation"):false;

      var tokenbound = isEllipse || isSegmentation;

      if(tokenbound){
        p.strate = -1;
      }

      // for origin arcs (nodestart == null)
      var originArc = false;
      if(!p.nodeStart || p.rootEdge){
        p.nodeStart = p.nodeEnd;
        originArc = true;
      }
      
      // Positionning
      var hdir = (depgraphlib.getNodePosition(p.nodeEnd)-depgraphlib.getNodePosition(p.nodeStart)>0)?1:-1;
      var vdir = (p.strate>0)?1:-1;
      var X0 = depgraphlib.getTransformValues(d3.select(p.nodeStart)).translate;
      var X1 = depgraphlib.getTransformValues(d3.select(p.nodeEnd)).translate;
      var SBBox = p.nodeStart.getBBox();
      var EBBox = p.nodeEnd.getBBox();
      var Sdx = SBBox.width/2;
      var Edx = EBBox.width/2;
      var minOffset = 3;
      var SxOffset = (hdir>0)?5*p.offsetXmin+minOffset:-5*p.offsetXmax-minOffset;
      var ExOffset = (hdir>0)?-5*p.offsetXmax-minOffset:5*p.offsetXmin+minOffset;
      var arcSize = 0;
      var x0 = X0[0]+Sdx+SxOffset;
      var x1 = X1[0]+Edx+ExOffset;
      var h = x1-x0-hdir*2*arcSize;
      //For missing main label and constant labels height
      if(me.wordY==null){
        var words = me.vis.selectAll('g.word');
        me.wordY=0;
        me.wordHeight=0;
        for(var i=0;i<words[0].length;++i){
          var bbox = words[0][i].getBBox();
          if(me.wordY>bbox.y){
            me.wordY=bbox.y;
          }
          if(me.wordHeight<bbox.height){
            me.wordHeight=bbox.height;
          }
        }
      }
      // end of dirty code 
      var SchunkCase0 = (p.nodeStart.className.animVal=='chunk')?SBBox.height:SBBox.height+me.wordY;
      var EchunkCase0 = (p.nodeEnd.className.animVal=='chunk')?EBBox.height:EBBox.height+me.wordY;
      var SchunkCase1 = (p.nodeStart.className.animVal=='chunk')?0:me.wordY;
      var EchunkCase1 = (p.nodeEnd.className.animVal=='chunk')?0:me.wordY;
      var Syanchor = (vdir>0)?SchunkCase1:SchunkCase0;
      var Eyanchor = (vdir>0)?EchunkCase1:EchunkCase0;
      var y0 = X0[1]+Syanchor;
      var y1 = X1[1]+Eyanchor;
      var height = 15;
      var strateOffset = 30;
      if(tokenbound){
        strateOffset = 0;
      }
      var v0 = -vdir*height-strateOffset*p.strate;//-SchunkCase;
      if(originArc){
        v0 = -vdir*height-strateOffset*vdir*(me.maxLinksStrate+1);
      }
      var v1 = -(v0+y0-y1);//vdir*height+strateOffset*p.strate+EchunkCase+SchunkCase;
      while(v1*v0 > 0){
        if(v0 < 0){
          v0 -= 10;
        }else{
          v0 += 10;
        }
        v1 = -(v0+y0-y1);
      }
      var laf0 = (1+hdir*vdir)/2;
      var laf1 = (1+hdir*vdir)/2;
      var color2 = "transparent";
      if(highlighted){
        color2 = getHighlightColor(linkColor);
      }
      var highlightPath = elt.components!= null ? elt.components.highlightPath : node.append('path');
      var path = elt.components != null ? elt.components.path : node.append('path');
      elt.drawingData = {
        x0:x0,
        y0:y0,
        v0:v0,
        laf0:laf0,
        hdir:hdir,
        arcSize:arcSize,
        h:h,
        laf1:laf1,
        vdir:vdir,
        v1:v1
      };
      if(originArc){
        highlightPath
        .attr('d',"M "+x0+","+(y0+v0)+" v "+(-v0));
        path
        .attr('d',"M "+x0+","+(y0+v0)+" v "+(-v0));
      }else{
        highlightPath
        //.attr('d',"M "+x0+","+y0+" v "+v0+" a 5 5 0 0 "+laf0+" "+hdir*arcSize+" "+(-vdir*arcSize)+" h "+h+" a 5 5 0 0 "+laf1+" "+hdir*arcSize+" "+vdir*arcSize+" v "+v1);
        .attr('d',"M "+x0+","+y0+" a "+h/2+" "+v0+" 0 0 "+laf0+" "+h+" 0");
        path
        //.attr('d',"M "+x0+","+y0+" v "+v0+" a "+arcSize+" "+arcSize+" 0 0 "+laf0+" "+hdir*arcSize+" "+(-vdir*arcSize)+" h "+h+" a "+arcSize+" "+arcSize+" 0 0 "+laf1+" "+hdir*arcSize+" "+vdir*arcSize+" v "+v1);
        .attr('d',"M "+x0+","+y0+" a "+h/2+" "+v0+" 0 0 "+laf0+" "+h+" 0");
      }
      highlightPath.attr('stroke',color2)
      .attr('stroke-width',depgraphlib.removeUnit(linkSize)+3)
      .attr('fill','none');
      path.attr('stroke',linkColor)
        .attr('stroke-dasharray',strokeDasharray)
        .attr('stroke-width',linkSize)
        .attr('fill','none');
      if(oriented){
        path.attr('marker-end','url(#'+me.viewer.appendOwnID('arrow')+')');
      }
      
      // Label
      var text = elt.components != null ? elt.components.label : node.append('text');
      text
        .text(depgraphlib.getValue(d,d.label))
        .style('fill',color)
        .style('font-weight',fontWeight)
        .style('font-style',fontStyle)
        .style('font-size',fontSize);
      var textBBox = text.node().getBBox();
      text.attr('x',-textBBox.width/2+x0+h/2+hdir*arcSize)
        .attr('y',depgraphlib.removeUnit(depgraphlib.addPxs(-depgraphlib.removeUnit(margin.top),y0,v0,-vdir*arcSize)));
      
      // to access easily to link components
      elt.drawingData.textBBox = textBBox;
      elt.components = {highlightPath:highlightPath,path:path,label:text};
    }

    /**
     * switch highlight property of a link node
     * (permanently or not <=> set highlighted = true or false in data or not)
     */
    depgraphlib.DepGraph.highlightLink = function(link,value,permanent){
      if(!permanent && (link.selected || link.getStyle('highlighted',false))){
        return;
      }
      
      if(permanent){
        depgraphlib.setStyle(link,'highlighted',value);
      } 

      var linkColor = link.getStyle('link-color');
      var fontWeight = link.getStyle('font-weight');
      if(value!==false){
        link.components.highlightPath.attr('stroke',getHighlightColor(linkColor));
        link.components.label.style('font-weight','bold');
      }
      else {
        link.components.highlightPath.attr('stroke',"transparent");
        link.components.label.style('font-weight',fontWeight);
      }
    };

    /**
     * switch highlight property of a word node
     * (permanently or not <=> set highlighted = true or false in data or not)
     */
    depgraphlib.DepGraph.highlightWord = function(word,value,permanent){
      if(!permanent && (word.selected || word.getStyle('highlighted',false))){
        return;
      }
      
      if(permanent){
        depgraphlib.setStyle(word,'highlighted',value);
      } 
      
      word.components.rect
      .style('fill',value?'yellow':'none');
    };
    
    depgraphlib.DepGraph.highlightChunk = function(object,value,permanent){
      
    };

    /**
     * switch highlight property of an object node (chunk, link or word) 
     * (permanently or not <=> set highlighted = true or false in data or not)
     */
    depgraphlib.DepGraph.highlightObject = function(object,value,permanent){
      if(object.classList != null && object.classList.length > 0){
        var klass = object.classList[0];
        if(klass == 'link'){
          depgraphlib.DepGraph.highlightLink(object,value,permanent);
        }else if (klass == 'word'){
          depgraphlib.DepGraph.highlightWord(object,value,permanent);
        }else if (klass == 'chunk'){
          depgraphlib.DepGraph.highlightChunk(object,value,permanent);
        }
      }
    };

    /**
     * return if object is permanently highlighted
     */
    depgraphlib.isObjectPermanentHighlighted = function(object){
      return object.getStyle('highlighted',false);
    };

    /**
     * compute the proper highlighting color for a hex color (otherwise, the color is yellow)
     */
    function getHighlightColor(color){
      if(color == '#000000' || color.slice(0, 1) != '#')
        return 'yellow';
      
      var deltaValue = -0.30;
      var rgb = depgraphlib.hexToRgb(color);
      var hsl = depgraphlib.rgbToHsl(rgb.r,rgb.g,rgb.b);
      hsl.l+=deltaValue;
      hsl.l=(hsl.l<0)?0:((hsl.l>1)?1:hsl.l);
      rgb = depgraphlib.hslToRgb(hsl.h,hsl.s,hsl.l);
      return depgraphlib.rgbToHex(rgb.r,rgb.g,rgb.b);
    }

    /**
     * set up svg needed definitions
     */
    depgraphlib.DepGraph.prototype.setSVGDefs = function(){
      this.defs = this.svg.append("defs");
      this.defs.append('marker')
        .attr('id',this.viewer.appendOwnID('arrow'))
        .attr('viewBox',"0 0 10 10")
        .attr('refX','8')
        .attr('refY','5')
        .attr('markerUnits','strokeWidth')
        .attr('orient','auto')
        .attr('markerWidth','3')
        .attr('markerHeight','3')
        .append('polyline')
          .attr('points','0,0 10,5 0,10');
    };


    /**
     * Returns the position of the node (word or chunk).
     * For the non trivial case of chunk, the node in middle of the chunk
     * is taken for the reference positon in the computing of links positionning
     * @param node
     * @returns integer (position of the node or -1 if origin : [node = null])
     */
    depgraphlib.getNodePosition = function(node){
      if(node){
        if(node.__data__['#position']!=null)
          return node.__data__['#position'];
        else{ // we are dealing with a chunk
          var me = depgraphlib.DepGraph.getInstance(node);
          var range = me.getChunkRange(node.__data__);
          var middle = Math.floor(range.firstElement['#position'] + range.lastElement['#position'])/2;
          return middle;
        }
      }else{
        return -1;
      }
    };

  
}(window.depgraphlib));


