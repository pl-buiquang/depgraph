/**
 * DepGraph.js
 * This part of the library contains the function
 * for displaying a graph.
 * It comes along with a default editing mode.
 * 
 * 
 * Author : Paul Bui-Quang
 * INRIA
 */

define("app/graphlayout",['app/graphviewer','app/utils','app/editobject'],function(GraphViewer,depgraphlib){
  
  
  EditObject = require('app/editobject');
  /**
   * Create a new instance of a graph
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
   */
  var DepGraph = function (container, json_data, options) {
    this.options = options || {};
    this.viewer = new GraphViewer(container,this.options.uid);
    
    DepGraph.instances[this.viewer.uid] = this;

    this.callbacks = new Object();

    this.setData(json_data);
    this.original_data = depgraphlib.clone(this.data);
    this.createLayout();
    this.update();

    this.postProcesses();
    
    this.autoHighLightOnMouseOver();
    this.viewerSettings();
    
    this.editObject = new EditObject(this);
  }; 

  DepGraph.prototype.getOriginalUID = function(){
    return this.viewer.uid.replace(/_*$/g, '');
  };
  
  
  /**
   * Set up viewer callbacks and settings :
   * - callback when fullscreen open and close
   */
  DepGraph.prototype.viewerSettings = function(){
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
  DepGraph.prototype.centerGraph = function(){
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
  };

  /**
   * Switch on or off the highlight on mouseover (link and words)
   */
  DepGraph.prototype.autoHighLightOnMouseOver = function(value){
    if(value==null || value){
      this.vis.selectAll('g.link').on("mouseover.autohighlight",function(){highlightLink(this, true); });
      this.vis.selectAll('g.link').on("mouseout.autohighlight",function(){highlightLink(this, false); });
      this.vis.selectAll('g.word').on("mouseover.autohighlight",function(){highlightWord(this, true); });
      this.vis.selectAll('g.word').on("mouseout.autohighlight",function(){highlightWord(this, false); });
    }else{
      this.vis.selectAll('g.link').on("mouseover.autohighlight",null);
      this.vis.selectAll('g.link').on("mouseout.autohighlight",null);
      this.vis.selectAll('g.word').on("mouseover.autohighlight",null);
      this.vis.selectAll('g.word').on("mouseout.autohighlight",null);

    }
  };

  /**
   * Static variable containing all instances of depgraphs on the page (keyed by their viewer uid)
   */
  DepGraph.instances = DepGraph.instances || [];

  /**
   * Retrieve the depgraph instance from :
   * - id of a div
   * - svg element
   * - jquery div selection
   * @param fromdiv
   * @returns
   */
  DepGraph.getInstance = function(fromdiv) {
    if(fromdiv){
      if (DepGraph.prototype.isPrototypeOf(fromdiv)) {
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
        return DepGraph.instances[match[1]];
      }
      return null;
    }
  };

  /**
   * Initial set up and preprocess of graph data
   * @param json_data
   */
  DepGraph.prototype.setData = function(json_data){
    this.data = json_data;
    this.prepareData();
  };

  /**
   * Reset data and run immediatly an update
   * @param json_data
   */
  DepGraph.prototype.resetData = function(json_data){
    this.setData(json_data);
    this.createLayout();
    this.update();

    this.postProcesses();
    
    this.autoHighLightOnMouseOver();
    this.editObject.init();
  };

  /**
   * Clean added data (used for graph svg layout creation)
   * TODO(paul) clean other added data (#id)
   */
  DepGraph.prototype.cleanData = function(){
    var links = this.vis.selectAll("g.link");
    this.resetLinksProperties(links);
  };

  /**
   * - Fill all requiered values to data with default/auto-generated values
   * - resolve json references (@)
   * - set up #id and #position, reset #properties
   * TODO(paul) validate data => set error message if failed validation
   */
  DepGraph.prototype.prepareData = function() {
    // Resolve references
    depgraphlib.JSONresolveReferences(this.data,'@');
    
    // Assign #id (and #position for words)
    this.id = 0;
    for(var i = 0 ; this.data.graph.words && i<this.data.graph.words.length ; i++){
      var word = this.data.graph.words[i]; 
      word['#id']=this.id++;
      word['#position']=i;
    }
    for(var i = 0 ; this.data.graph.links && i<this.data.graph.links.length ; i++){
      this.data.graph.links[i]['#id']=this.id++;
      this.data.graph.links[i]['#properties']=null;
    }
    for(var i = 0 ; this.data.graph.chunks && i<this.data.graph.chunks.length ; i++){
      this.data.graph.chunks[i]['#id']=this.id++;
    }
    
    // Create style object if not defined
    var globalStyle = (this.data.graph['#style'])?this.data.graph['#style']:this.data.graph['#style']=new Object();
    var wordStyle = (this.data.graph['#word-style'])?this.data.graph['#word-style']:this.data.graph['#word-style']=new Object();
    var linkStyle = (this.data.graph['#link-style'])?this.data.graph['#link-style']:this.data.graph['#link-style']=new Object();
    var chunkStyle = (this.data.graph['#chunk-style'])?this.data.graph['#chunk-style']:this.data.graph['#chunk-style']=new Object();
    
    // Set default value for requiered fields
    // Global Style
    globalStyle['margin'] = globalStyle['margin']?globalStyle['margin']:{top:'50px',right:'20px',bottom:'20px',left:'20px'};
    globalStyle['margin'].top = globalStyle['margin-top']?globalStyle['margin-top']:globalStyle['margin'].top;
    globalStyle['margin'].right = globalStyle['margin-right']?globalStyle['margin-right']:globalStyle['margin'].right;
    globalStyle['margin'].left = globalStyle['margin-left']?globalStyle['margin-left']:globalStyle['margin'].left;
    globalStyle['margin'].bottom = globalStyle['margin-bottom']?globalStyle['margin-bottom']:globalStyle['margin'].bottom;
    globalStyle['background-color'] = globalStyle['background-color']?globalStyle['background-color']:'white';
    globalStyle['font-family'] = globalStyle['font-family']?globalStyle['font-family']:'inherit';
    
    // Words Style
    wordStyle['margin'] = wordStyle['margin']?wordStyle['margin']:{top:'10px',right:'15px',bottom:'10px',left:'15px'};
    wordStyle['sub-margin'] = wordStyle['sub-margin']?wordStyle['sub-margin']:{top:'4px',right:'4px',bottom:'4px',left:'4px'};
    wordStyle['font-size'] = wordStyle['font-size']?wordStyle['font-size']:'14px';
    wordStyle['sub-font-size'] = wordStyle['sub-font-size']?wordStyle['sub-font-size']:'10px';
    wordStyle['color'] = wordStyle['color']?wordStyle['color']:'black';
    wordStyle['sub-color'] = wordStyle['sub-color']?wordStyle['sub-color']:'black';
    wordStyle['font-weight']=wordStyle['font-weight']?wordStyle['font-weight']:'normal';
    wordStyle['sub-font-weight']=wordStyle['sub-font-weight']?wordStyle['sub-font-weight']:'normal';
    wordStyle['font-style']=wordStyle['font-style']?wordStyle['font-style']:'normal';
    wordStyle['sub-font-style']=wordStyle['sub-font-style']?wordStyle['sub-font-style']:'normal';
    
    // Links Style
    linkStyle['margin'] = linkStyle['margin']?linkStyle['margin']:{top:'5px',right:'10px',bottom:'10px',left:'10px'};
    linkStyle['font-size'] = linkStyle['font-size']?linkStyle['font-size']:'12px';
    linkStyle['color'] = linkStyle['color']?linkStyle['color']:'black';
    linkStyle['link-color'] = linkStyle['link-color']?linkStyle['link-color']:'#000000';
    linkStyle['link-size'] = linkStyle['link-size']?linkStyle['link-size']:'2px';
    linkStyle['font-weight']= linkStyle['font-weight']?linkStyle['font-weight']:'normal';
    linkStyle['font-style']=linkStyle['font-style']?linkStyle['font-style']:'normal';
    linkStyle['oriented']=linkStyle['oriented']?linkStyle['oriented']:true;
    linkStyle['align']=linkStyle['align']?linkStyle['align']:'center';
    linkStyle['higlighted'] = false;
    
    // Chunks Style
    chunkStyle['margin'] = chunkStyle['margin']?chunkStyle['margin']:{top:'10px',right:'10px',bottom:'10px',left:'10px'};
    chunkStyle['sub-margin'] = chunkStyle['sub-margin']?chunkStyle['sub-margin']:{top:'4px',right:'4px',bottom:'4px',left:'4px'};
    chunkStyle['font-size'] = chunkStyle['font-size']?chunkStyle['font-size']:'12px';
    chunkStyle['sub-font-size'] = chunkStyle['sub-font-size']?chunkStyle['sub-font-size']:'10px';
    chunkStyle['background-color'] = chunkStyle['background-color']?chunkStyle['background-color']:'transparent';
    chunkStyle['color'] = chunkStyle['color']?chunkStyle['color']:'black';
    chunkStyle['sub-color'] = chunkStyle['sub-color']?chunkStyle['sub-color']:'black';
    chunkStyle['border-color'] = chunkStyle['border-color']?chunkStyle['border-color']:'black';
    chunkStyle['font-weight']=chunkStyle['font-weight']?chunkStyle['font-weight']:'normal';
    chunkStyle['sub-font-weight']=chunkStyle['sub-font-weight']?chunkStyle['sub-font-weight']:'normal';
    chunkStyle['font-style']=chunkStyle['font-style']?chunkStyle['font-style']:'normal';
    chunkStyle['sub-font-style']=chunkStyle['sub-font-style']?chunkStyle['sub-font-style']:'normal';
    chunkStyle['border-size']=chunkStyle['border-size']?chunkStyle['border-size']:'1px';
  };


  /**
   * Apply post processing to the graph :
   * - set the graph position according to margin global style
   * - apply viewer view mode (shrinkToContent is default)
   * TODO(paul) : add parameter or attributes to depgraph in order to control which view mode to apply
   */
  DepGraph.prototype.postProcesses = function(){
    var visBBox = this.vis.node().getBBox();
    this.vis.attr("transform","translate(" + 
        (depgraphlib.removeUnit(this.data.graph['#style'].margin.left)-visBBox.x) + "," + 
        (depgraphlib.removeUnit(this.data.graph['#style'].margin.top)-visBBox.y)+") scale(1)");
    
    this.setViewMode();
  };

  /**
   * Set the view mode (full | strechted | cropped)
   * Apply viewer mode and add scrollbar or proper scale if necessary
   * 
   * For values in %, make sure that the container wrapping the viewer is displayed as block and a size is set.
   */
  DepGraph.prototype.setViewMode = function(){
    if(this.options.viewmode && this.options.viewmode != 'full'){
      this.setWidthLimitedViewMode('600px');
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
  
  
  DepGraph.prototype.setFullViewMode = function(){
    this.viewer.shrinkToContent(depgraphlib.removeUnit(this.data.graph['#style']['margin'].right),depgraphlib.removeUnit(this.data.graph['#style']['margin'].bottom)+20);
  };
  
  
  /**
   * Set the view mode to a limited width (cropped or strechted)
   * @param defaultWidth
   * @param forceCrop
   */
  DepGraph.prototype.setWidthLimitedViewMode = function(defaultWidth,forceCrop){
    this.viewer.shrinkHeightToContent(depgraphlib.removeUnit(this.data.graph['#style']['margin'].bottom)+20);
    if(!this.options.viewsize){
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
  
  /**
   * Create the scrollbar and set up the callbacks for scrolling the view
   */
  DepGraph.prototype.createScrollBar = function(){
    var me = this;

    var graphBBox = this.vis.node().getBBox();
    var graphWidth = graphBBox.width + 2*depgraphlib.removeUnit(this.data.graph['#style']['margin'].right); 
    var viewerWidth = this.viewer.mainpanel.width();
    
    if(graphWidth > viewerWidth){
      var scrollBarWidth = 2*viewerWidth - graphWidth;
      var k = 1;
      if(scrollBarWidth<=0){
        scrollBarWidth = 20;
        k = (graphWidth-viewerWidth)/(viewerWidth-scrollBarWidth);
      }
      this.scrollbar = this.svg.select('.scrollbar');
      if(this.scrollbar.node() == null){
        this.scrollbar = this.svg.append('rect').classed('scrollbar',true);
      }
      this.scrollbar.attr('x',0)
      .attr('y',this.viewer.mainpanel.height()-40)
      .attr('rx',1)
      .attr('ry',1)
      .attr('width',scrollBarWidth)
      .attr('height',5)
      .style('stroke',"grey")
      .style('fill',"lightgrey")
      .style('stroke-width',1)
      .__info__ = {maxX:viewerWidth - scrollBarWidth,k:k};

      this.scrollMouseSelected = null;
      
      this.scrollbar.on('mousedown',function(e){
        var depgraph = DepGraph.getInstance(this);
        DepGraph.depgraphActive = '-' + depgraph.viewer.uid;
        depgraph.scrollMouseSelected = d3.event.clientX;
        d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
      });
      
      /*
      d3.select(this.viewer.chart[0]).on('mouseover',function(e){
        var depgraph = DepGraph.getInstance(d3.event.originalTarget);
        depgraph.setFullViewMode();
      });
      
      d3.select(this.viewer.chart[0]).on('mouseout',function(e){
        var depgraph = DepGraph.getInstance(d3.event.originalTarget);
        depgraph.setViewMode();
      });*/

      
      d3.select(document).on('click.focus',function(e){
        var depgraph = DepGraph.getInstance(d3.event.originalTarget);
        if(depgraph){
          DepGraph.depgraphActive = '-' + depgraph.viewer.uid;
        }else{
          DepGraph.depgraphActive = null;
        }
      });
      
      d3.select(document).on('wheel.scrollbar',function(e){
        var depgraph = DepGraph.getInstance(DepGraph.depgraphActive);
        if(depgraph && depgraph.scrollbar){
          depgraph.translateGraph(3*d3.event.deltaY,0);
          d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
        }
      });
      
      d3.select(document).on('mousemove.scrollbar'+me.viewer.uid,function(e){
        var depgraph = DepGraph.getInstance(DepGraph.depgraphActive);
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
        var depgraph = DepGraph.getInstance(DepGraph.depgraphActive);
        if(depgraph){
          depgraph.scrollMouseSelected = null;
        }
      });
      
    }
    
    d3.select(document).on('keydown.move'+me.viewer.uid,function(e){
      var translateSpeed = 10;
      if(DepGraph.depgraphActive){
        var depgraph = DepGraph.getInstance(DepGraph.depgraphActive);
        if(d3.event.keyCode==37){ // left
          depgraph.translateGraph(-translateSpeed,0);
        }else if(d3.event.keyCode==39){ // right
          depgraph.translateGraph(translateSpeed,0);
        }
      }
    });
  };
  
  /**
   * (Re-)Create the svg element, apply background color, enter svg definitions, and attach some
   * events handler
   * TODO(paul) : refactor this function
   */
  DepGraph.prototype.createLayout = function() {
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
    
  };

  
  DepGraph.prototype.scale = function(scale){
    var me = DepGraph.getInstance(this);
    var previousValues = depgraphlib.getTransformValues(me.vis);
    me.vis.attr("transform",
        "translate(" + (previousValues.translate[0])*scale + "," + (previousValues.translate[1])*scale + ")" + " scale("+scale+")");
  };
  
  /**
   * translate the graph relative to parameters x and y
   * @param x
   * @param y
   */
  DepGraph.prototype.translateGraph = function(x,y){
    var me = DepGraph.getInstance(this);
    var previousValues = depgraphlib.getTransformValues(me.vis);
    
    if(me.scrollbar){
      var sx = parseFloat(me.scrollbar.attr('x'));
      var kx = x / me.scrollbar.__info__.k;
      if(me.scrollbar.__info__.maxX < (sx + kx)){
        kx = me.scrollbar.__info__.maxX - sx;
      }else if(sx + kx < 0){
        kx = -sx;
      }
      x = me.scrollbar.__info__.k*kx;
      me.scrollbar.attr('x',sx+kx);
    }
    
    me.vis.attr("transform",
        "translate(" + (previousValues.translate[0]-x) + "," + (previousValues.translate[1]-y) + ")" + " scale("+previousValues.scale[0]+")");
    
  };

  /**
   * Read data and construct the graph layout (update and init)
   */
  DepGraph.prototype.update = function(){
    
    var chunks;
    var chunks_enter;
    if(this.data.graph.chunks!=null){
       chunks = this.chunks = this.vis.selectAll("g.chunk")
        .data(this.data.graph.chunks,function(d){return d['#id'];});
       chunks_enter = chunks.enter().append("g").classed("chunk",true);
    }

    var words = this.words = this.vis.selectAll("g.word")
    .data(this.data.graph.words,function(d){return d['#id'];});
    var words_enter = words.enter().append("g").classed("word",true);
    var words_exit = words.exit();
    words_exit.remove();
    words.each(setWordMaterials);
    
    if(this.data.graph.chunks!=null){
      chunks_enter.each(setChunkMaterials);
    }

    var links = this.links = this.vis.selectAll("g.link")
      .data(this.data.graph.links,function(d){return d['#id'];}); 
    var links_enter = links.enter().append("g").classed("link",true);
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
  DepGraph.prototype.insertWord = function(word,position){
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
  };

  /**
   * Add a link and update the graph
   * @param link
   */
  DepGraph.prototype.addLink = function(link) {
    if(link['#id']==null){
      link['#id'] = this.id++;
    }
    this.data.graph.links.push(link);
    this.update();
    this.postProcesses();
  };

  /**
   * Add a chunk and update the graph
   * TODO(paul) : add chunk implementation
   * @param chunk
   */
  DepGraph.prototype.addChunk = function(chunk) {
    
  };

  /**
   * Remove a word by its #id and perform update
   * @param id
   * @returns list of obsolete links data that were removed during the process
   */
  DepGraph.prototype.removeWord = function(id){
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
  DepGraph.prototype.removeLink = function(id){
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
  DepGraph.prototype.removeChunk = function(id){
    
  };

  /**
   * Search and returns a word by its position
   * @param position
   * @returns a word svg element
   */
  DepGraph.prototype.getWordNodeByPosition = function(position){
    var nodes = this.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['#position'] == position)
        return nodes[0][i];
    }
    return null;
  };

  /**
   * Search and returns a word by its original id (id)
   * @param id
   * @returns a word svg element
   */
  DepGraph.prototype.getWordNodeByOriginalId = function(id){
    var nodes = this.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['id'] == id)
        return nodes[0][i];
    }
  };

  /**
   * Search and return a chunk by its original id (id)
   * @param id
   * @returns a chunk svg element
   */
  DepGraph.prototype.getChunkNodeByOriginalId = function(id){
    var nodes = this.vis.selectAll('g.chunk');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['id'] == id)
        return nodes[0][i];
    }
  };

  /**
   * Search and return a word by its #id
   * @param id
   * @returns a word svg element
   */
  DepGraph.prototype.getWordNodeById = function(id){
    var nodes = this.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['#id'] == id)
        return nodes[0][i];
    }
  };

  /**
   * Search and return a word index from its #id
   * @param id
   * @returns the index of the word in the words data list
   */
  DepGraph.prototype.getWordIndexById = function(id){
    for(var i in this.data.graph.words){
      if(this.data.graph.words[i]['#id'] == id){
        return i;
      }
    }
  };

  /**
   * Search and return a link by its #id
   * @param id
   * @returns the link
   */
  DepGraph.prototype.getLinkById = function(id){
    for(var i in this.data.graph.links){
      if(this.data.graph.links[i]['#id'] == id){
        return this.data.graph.links[i];
      }
    }
  };

  /**
   * Search and return a link index by its #id
   * @param id
   * @returns the link index in the links data list
   */
  DepGraph.prototype.getLinkIndexById = function(id){
    for(var i in this.data.graph.links){
      if(this.data.graph.links[i]['#id'] == id){
        return i;
      }
    }
  };

  /**
   * Search and return a link by its original id (id), provided there is one set.
   * (Original id for link is not required)
   * @param id
   * @returns a link in the links data list
   */
  DepGraph.prototype.getLinkIndexByOriginalId = function(id){
    for(var i in this.data.graph.links){
      if(this.data.graph.links[i].id == id){
        return i;
      }
    }
  };

  /**
   * Search and return an object (link, word or chunk) by its #id
   * @param id
   * @returns an object data from the links,words or chunks data list
   */
  DepGraph.prototype.getObjectById = function(id){
    for(var i in this.data.graph.words){
      if(this.data.graph.words[i]['#id'] == id){
        return this.data.graph.words[i];
      }
    }
    for(var i in this.data.graph.links){
      if(this.data.graph.links[i]['#id'] == id){
        return this.data.graph.links[i];
      }
    }
    for(var i in this.data.graph.chunks){
      if(this.data.graph.chunks[i]['#id'] == id){
        return this.data.graph.chunks[i];
      }
    }
  };

  /**
   * Search and return an object node (link node, word node or chunk node) by its #id
   * @param id
   * @returns an object svg element from the links,words or chunks nodes selections
   */
  DepGraph.prototype.getObjectNodeFromObject = function(obj){
    //TODO (check object type (isALink, isAChunk, isAWord, else) then search in corresponding
    // lists the #id
  };

  /**
   * return the style of an svg element, looking in data.#style, or a default value or null 
   */
  depgraphlib.getStyleElement = function(elt,property,defaultValue){
    if(elt.__data__['#style']!=null && elt.__data__['#style'][property] != null){
      return elt.__data__['#style'][property];
    };
    return defaultValue;
  };

  /**
   * get style class method for svg element
   * return a property searching for embed style, or class style or a default value or null
   * @param property
   * @param defaultValue
   * @returns
   */
  SVGElement.prototype.getStyle = function(property,defaultValue){
    var me = DepGraph.getInstance(this);
    if(this.__data__['#style']!=null && this.__data__['#style'][property] != null){
      return this.__data__['#style'][property];
    };
    var value = null;
    if(this.className != null){
      value = me.data.graph['#'+this.className.animVal+'-style'][property];
    }
    if(value==null && defaultValue!=null){
      return defaultValue;
    }else{
      return value;
    }
  };

  /**
   * set a property style in data.#style
   */
  depgraphlib.setStyle = function(element,property,value){
    if(element.__data__['#style'] == null){
      element.__data__['#style'] = {};
    }
    if(value){
      element.__data__['#style'][property] = value;
    }else{
      delete element.__data__['#style'][property];
    }
    
  };

  /************************************************************/
  /**                   Layout Creation                      **/
  /************************************************************/

  /**
   * set up or update a node svg element (style, content and position) for a word data
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
    label.text(d.label)
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
        sublabel.text(d.sublabel[i])
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
    
    var me = DepGraph.getInstance(this);
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
   * set up or update a node svg element (style, content and position) for a chunk data
   * TODO(paul) update not implemented. Recreation of new chunk ev time!
   */
  function setChunkMaterials(d,i){
    var node = d3.select(this);
    var me = DepGraph.getInstance(node.node());
    var elt = node.node();

    var rect = node.append("rect");
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
    
    var line = node.append('line');
    line.attr('y1',depgraphlib.addPxs(max.y,2*depgraphlib.removeUnit(margin.top)))
      .attr('x1',0)
      .attr('y2',depgraphlib.addPxs(max.y,2*depgraphlib.removeUnit(margin.top)))
      .attr('x2',max.x-min.x+depgraphlib.removeUnit(margin.left)+depgraphlib.removeUnit(margin.right))
      .style('stroke',borderColor)
      .style('stroke-width',borderSize);

    var text = node.append("text");
    text.attr('y',depgraphlib.addPxs(20,max.y,2*depgraphlib.removeUnit(margin.top)));
    text.append("tspan")
      .text(d.label)
       .style('fill',color)
      .style('font-style',fontStyle)
      .style('font-weight',fontWeight)
      .style('font-size',fontSize);
    if(d.sublabel){
      for(var i=0;i<d.sublabel.length;++i){
        var tspan = text.append("tspan")
        .text(d.sublabel[i])
        .style('font-size',subfontSize)
        .style('font-style',subfontStyle)
        .style('font-weight',subfontWeight)
        .style('fill',subColor)
        .attr('dx',-(d.sublabel[i].length-1)*depgraphlib.removeUnit(subfontSize))
        .attr('dy','1.25em');
      }
    }
    depgraphlib.center(text,node);

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
    
    node.node().components = {text:text,rect:rect};

    depgraphlib.setGroupPosition(node,min.x-depgraphlib.removeUnit(margin.left),min.y-depgraphlib.removeUnit(margin.top));
  }

  /**
   * set up or update a node svg element (style, content and position) for a link data
   */
  function setLinkMaterials(d,i){
    var node = d3.select(this);
    var me = DepGraph.getInstance(this);
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

    // for origin arcs (nodestart == null)
    var originArc = false;
    if(!p.nodeStart){
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
    var arcSize = 5;
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
    var v0 = -vdir*height-strateOffset*p.strate;//-SchunkCase;
    if(originArc){
      v0 = -vdir*height-strateOffset*vdir*me.maxLinksStrate;
    }
    var v1 = -(v0+y0-y1);//vdir*height+strateOffset*p.strate+EchunkCase+SchunkCase;
    var laf0 = (1+hdir*vdir)/2;
    var laf1 = (1+hdir*vdir)/2;
    var color2 = "transparent";
    if(highlighted){
      color2 = getHighlightColor(linkColor);
    }
    var highlightPath = elt.components!= null ? elt.components.highlightPath : node.append('path');
    var path = elt.components != null ? elt.components.path : node.append('path');
    if(originArc){
      highlightPath
      .attr('d',"M "+x0+","+(y0+v0)+" v "+(-v0));
      path
      .attr('d',"M "+x0+","+(y0+v0)+" v "+(-v0));
    }else{
      highlightPath
      .attr('d',"M "+x0+","+y0+" v "+v0+" a 5 5 0 0 "+laf0+" "+hdir*arcSize+" "+(-vdir*arcSize)+" h "+h+" a 5 5 0 0 "+laf1+" "+hdir*arcSize+" "+vdir*arcSize+" v "+v1);
      path
      .attr('d',"M "+x0+","+y0+" v "+v0+" a 5 5 0 0 "+laf0+" "+hdir*arcSize+" "+(-vdir*arcSize)+" h "+h+" a 5 5 0 0 "+laf1+" "+hdir*arcSize+" "+vdir*arcSize+" v "+v1);
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
      .text(d.label)
      .style('fill',color)
      .style('font-weight',fontWeight)
      .style('font-style',fontStyle)
      .style('font-size',fontSize);
    var textBBox = text.node().getBBox();
    text.attr('x',-textBBox.width/2+x0+h/2+hdir*arcSize)
      .attr('y',depgraphlib.removeUnit(depgraphlib.addPxs(-depgraphlib.removeUnit(margin.top),y0,v0,-vdir*arcSize)));
    
    // to access easily to link components
    elt.components = {highlightPath:highlightPath,path:path,label:text};
  }

  /**
   * switch highlight property of a link node
   * (permanently or not <=> set highlighted = true or false in data or not)
   */
  function highlightLink(link,value,permanent){
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
  }

  /**
   * switch highlight property of a word node
   * (permanently or not <=> set highlighted = true or false in data or not)
   */
  function highlightWord(word,value,permanent){
    if(!permanent && (word.selected || word.getStyle('highlighted',false))){
      return;
    }
    
    if(permanent){
      depgraphlib.setStyle(word,'highlighted',value);
    } 
    
    word.components.rect
    .style('fill',value?'yellow':'none');
  }

  /**
   * switch highlight property of an object node (chunk, link or word) 
   * (permanently or not <=> set highlighted = true or false in data or not)
   */
  function highlightObject(object,value,permanent){
    if(object.classList != null && object.classList.length > 0){
      var klass = object.classList[0];
      if(klass == 'link'){
        highlightLink(object,value,permanent);
      }else if (klass ='word'){
        highlightWord(object,value,permanent);
      }
    }
  }
  
  depgraphlib.highlightObject = function(object,value,permanent){
    return highlightObject(object,value,permanent);
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
  DepGraph.prototype.setSVGDefs = function(){
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
        .attr('points','0,0 10,5 0,10 1,5');
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
        var me = DepGraph.getInstance(node);
        var middle = Math.floor(node.__data__['elements'].length/2);
        var middleNode = me.getWordNodeByOriginalId(node.__data__['elements'][middle]);
        return middleNode.__data__['#position'];
      }
    }else{
      return -1;
    }
  };

 return DepGraph;
  
});

  

