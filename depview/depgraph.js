if(typeof jQuery == 'undefined'){
  alert('DepGraph : Error. This library needs jQuery!');
}

/**
 * 
 * @param viewer
 * @param json_data
 * @param options
 * 
 * @returns
 */
function DepGraph(viewer, json_data, options) {
  DepGraph.instances[viewer.uid] = this;
  this.viewer = viewer;
  //viewer.setImageMode(true);
  this.options = options;

  this.callbacks = new Object();

  this.setData(json_data);
  this.original_data = clone(this.data);
  this.createLayout();
  this.update();

  this.postProcesses();
  
  this.autoHighLightOnMouseOver();
  this.viewerSettings();
  
  this.editObject = new EditObject(this);
  /*this.vis.selectAll('g.word').on("click.bits",this.test0);
  this.vis.selectAll('g.link').on("click.bits",this.test0);*/
}

DepGraph.prototype.viewerSettings = function(){
  this.viewer.callbacks.fullscreen.oncomplete.push({
    method:this.rescale,
    caller:this
    }
  );
  this.viewer.callbacks.fullscreen.onclose.push({
    method:this.rescale,
    caller:this
    }
  );
};

DepGraph.prototype.rescale = function(){
  var chart = this.viewer.chart;
  var chartBBox = chart[0].getBoundingClientRect();
  var visBBox = this.vis.node().getBBox();
  var x  = (chartBBox.width-visBBox.width)/2;
  var y = (chartBBox.height-visBBox.height)/2;
  y = y>0?y:removeUnit(this.data.graph['#style'].margin.top);
  x = x>0?x:removeUnit(this.data.graph['#style'].margin.left);
  this.vis.attr("transform","translate(" + 
      (x-visBBox.x) + "," + 
      (y-visBBox.y)+") scale(1)");
};


DepGraph.prototype.autoHighLightOnMouseOver = function(){
  var me = this;
  this.vis.selectAll('g.link').on("mouseover",function(){highlightLink(this, true); });
  this.vis.selectAll('g.link').on("mouseout",function(){highlightLink(this, false); });
  this.vis.selectAll('g.word').on("mouseover",function(){highlightWord(this, true); });
  this.vis.selectAll('g.word').on("mouseout",function(){highlightWord(this, false); });
};

DepGraph.instances = [];

DepGraph.getInstance = function(fromdiv) {
  if (DepGraph.prototype.isPrototypeOf(fromdiv)) {
    return fromdiv;
  } else if (fromdiv.ownerSVGElement != null) {
    fromdiv = fromdiv.ownerSVGElement.parentNode.id;
  } else if (typeof fromdiv == 'object' && fromdiv.id != null) {
    fromdiv = fromdiv.id;
  }

  regex = /.*-(\w+)/;
  var match = regex.exec(fromdiv);
  if (match != null) {
    return DepGraph.instances[match[1]];
  }
  return null;
};

DepGraph.prototype.setData = function(json_data){
  this.data = json_data;
  this.prepareData();
};

DepGraph.prototype.resetData = function(json_data){
  this.setData(json_data);
  this.createLayout();
  this.update();

  this.postProcesses();
  
  this.autoHighLightOnMouseOver();
  this.editObject.init();
};

DepGraph.prototype.cleanData = function(){
  var links = this.vis.selectAll("g.link");
  this.resetLinksProperties(links);
};

/**
 * Fill all requiered values to data with default/auto-generated values
 */
DepGraph.prototype.prepareData = function() {
  // Resolve references
  JSONresolveReferences(this.data,'@');
  
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
 * Verify that data contains no errors Called in prepareData
 */
DepGraph.prototype.validateData = function() {

};

DepGraph.prototype.postProcesses = function(){
  var visBBox = this.vis.node().getBBox();
  this.vis.attr("transform","translate(" + 
      (removeUnit(this.data.graph['#style'].margin.left)-visBBox.x) + "," + 
      (removeUnit(this.data.graph['#style'].margin.top)-visBBox.y)+") scale(1)");
  this.viewer.shrinkToContent(removeUnit(this.data.graph['#style']['margin'].right),removeUnit(this.data.graph['#style']['margin'].bottom)+20);

};

/**
 * Parse the data and construct the svg, adding element according to data
 * specification
 */
DepGraph.prototype.createLayout = function() {
  if(this.svg != null){
    this.svg.remove();
  }
  
  this.svg = d3.select(this.viewer.chart[0]).append("svg")
  .attr("width", "100%").attr("height", "100%");
  
  this.viewer.chart.css('background-color',this.data.graph['#style']['background-color']);
  
  this.setSVGDefs();
  
  this.vis = this.svg.append("g").attr("transform","translate(" + 
      removeUnit(this.data.graph['#style'].margin.left) + "," + 
      removeUnit(this.data.graph['#style'].margin.top)+") scale(1)");
  
  //this.svg.call(d3.behavior.zoom().on("zoom", this.redraw));
  
  var me = this;
  d3.select(document).on('keydown.move'+me.viewer.uid,function(e){
    var translateSpeed = 10;
    if(d3.event.keyCode==37){ // left
      me.translateGraph(-translateSpeed,0);
    }else if(d3.event.keyCode==39){ // right
      me.translateGraph(translateSpeed,0);
    }
  });
  
};

DepGraph.prototype.translateGraph = function(x,y){
  var me = DepGraph.getInstance(this);
  var previousValues = getTransformValues(me.vis); 
  me.vis.attr("transform",
      "translate(" + (previousValues.translate[0]+x) + "," + (previousValues.translate[1]+y) + ")" + " scale("+previousValues.scale[0]+")");
};

DepGraph.prototype.redraw = function(){
  var me = DepGraph.getInstance(this.parentNode);
  var previousValues = getTransformValues(me.vis); 
  me.vis.attr("transform",
      "translate(" + d3.event.translate[0] + "," + previousValues.translate[1] + ")" + " scale("+d3.event.scale+")");
};

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
  //words.each(setWordProperties);
  
  if(this.data.graph.chunks!=null){
    chunks_enter.each(setChunkMaterials);
    //chunks.each(setChunkProperties);
  }

  var links = this.links = this.vis.selectAll("g.link")
    .data(this.data.graph.links,function(d){return d['#id'];}); 
  var links_enter = links.enter().append("g").classed("link",true);
  var links_exit = links.exit();
  links_exit.remove();
  this.resetLinksProperties(links);
  this.preprocessLinksPosition(links);
  links.each(setLinkMaterials);
  //links.each(setLinkProperties);
    
};

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

DepGraph.prototype.addLink = function(link) {
  if(link['#id']==null){
    link['#id'] = this.id++;
  }
  this.data.graph.links.push(link);
  this.update();
  this.postProcesses();
};

DepGraph.prototype.addChunk = function(chunk) {
  
};

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
      affectedLinks.push(clone(link));
      this.data.graph.links.splice(i,1);
      i--;
    }
  }
  
  this.update();
  this.postProcesses();
  return affectedLinks;
};

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

DepGraph.prototype.removeChunk = function(id){
  
};

DepGraph.prototype.getWordByPosition = function(position){
  var nodes = this.vis.selectAll('g.word');
  for(var i = 0; i<nodes[0].length; i++){
    if(nodes[0][i].__data__['#position'] == position)
      return nodes[0][i];
  }
  return null;
};

DepGraph.prototype.getWordNodeByOriginalId = function(id){
  var nodes = this.vis.selectAll('g.word');
  for(var i = 0; i<nodes[0].length; i++){
    if(nodes[0][i].__data__['id'] == id)
      return nodes[0][i];
  }
};

DepGraph.prototype.getChunkByOriginalId = function(id){
  var nodes = this.vis.selectAll('g.chunk');
  for(var i = 0; i<nodes[0].length; i++){
    if(nodes[0][i].__data__['id'] == id)
      return nodes[0][i];
  }
};

DepGraph.prototype.getWordNodeById = function(id){
  var nodes = this.vis.selectAll('g.word');
  for(var i = 0; i<nodes[0].length; i++){
    if(nodes[0][i].__data__['#id'] == id)
      return nodes[0][i];
  }
};

DepGraph.prototype.getWordIndexById = function(id){
  for(var i in this.data.graph.words){
    if(this.data.graph.words[i]['#id'] == id){
      return i;
    }
  }
};

DepGraph.prototype.getLinkById = function(id){
  for(var i in this.data.graph.links){
    if(this.data.graph.links[i]['#id'] == id){
      return this.data.graph.links[i];
    }
  }
};

DepGraph.prototype.getLinkIndexById = function(id){
  for(var i in this.data.graph.links){
    if(this.data.graph.links[i]['#id'] == id){
      return i;
    }
  }
};

DepGraph.prototype.getLinkIndexByOriginalId = function(id){
  for(var i in this.data.graph.links){
    if(this.data.graph.links[i].id == id){
      return i;
    }
  }
};

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

DepGraph.prototype.getOrignialIDs = function(type){
  if(type != 'words' && type != 'links'){
    this.viewer.debugLog('called getOriginalIDs with incorrect parameter (possible values are "links" or "words"): ' + type);
    return null;
  }
  var list = [];
  for(var i in this.data.graph[type]){
    list.push(this.data.graph[type][i].id);
  }
  return list;
};


function getStyleElement(elt,property,defaultValue){
  if(elt.__data__['#style']!=null && elt.__data__['#style'][property] != null){
    return elt.__data__['#style'][property];
  };
  return defaultValue;
}

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

function setStyle(element,property,value){
  if(element.__data__['#style'] == null){
    element.__data__['#style'] = {};
  }
  element.__data__['#style'][property] = value;
}

/************************************************************/
/**                   Layout Creation                      **/
/************************************************************/

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
  
  var highlight = 'transparent';
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
  var previousSibling = me.getWordByPosition(node.datum()['#position']-1);
  var margin = elt.getStyle('margin');
  if(previousSibling != null){
    var transform = getTransformValues(d3.select(previousSibling));
    var bbox = previousSibling.getBBox();
    var x = removeUnit(addPxs(transform.translate[0],bbox.width,margin.right,margin.left));
    var y = removeUnit(margin.top);
    setGroupPosition(node,x,y);
  }
  else{
    var x = removeUnit(margin.left);
    var y = removeUnit(margin.top);
    setGroupPosition(node,x,y);
  }
  
  node.node().components = {text:text,label:label,rect:rect,sublabels:sublabels};
}

function setChunkMaterials(d,i){
  var node = d3.select(this);
  var me = DepGraph.getInstance(node.node());
  var elt = node.node();

  var rect = node.append("rect");
  var min = {x : 99999, y : 99999};
  var max = {x:0,y:0};
  for(var i=0;i<d.elements.length;i++){
    var word = me.getWordNodeByOriginalId(d.elements[i]);
    var transform = getTransformValues(d3.select(word));
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
  line.attr('y1',addPxs(max.y,2*removeUnit(margin.top)))
    .attr('x1',0)
    .attr('y2',addPxs(max.y,2*removeUnit(margin.top)))
    .attr('x2',max.x-min.x+removeUnit(margin.left)+removeUnit(margin.right))
    .style('stroke',borderColor)
    .style('stroke-width',borderSize);

  var text = node.append("text");
  text.attr('y',addPxs(20,max.y,2*removeUnit(margin.top)));
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
      .attr('dx',-(d.sublabel[i].length-1)*removeUnit(subfontSize))
      .attr('dy','1.25em');
    }
  }
  center(text,node);

  var offset = text.node().getBBox().height;
  rect.attr('x',0)
  .attr('y',0)
  .attr('rx',10)
  .attr('ry',10)
  .attr('width',max.x-min.x+removeUnit(margin.left)+removeUnit(margin.right))
  .attr('height',addPxs(max.y,-min.y,offset,2*removeUnit(margin.top),20))
  .style('fill',backgroundColor)
  .style('stroke',borderColor)
  .style('stroke-width',borderSize);
  
  node.node().components = {text:text,rect:rect};

  setGroupPosition(node,min.x-removeUnit(margin.left),min.y-removeUnit(margin.top));
}

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

  // Positionning
  var hdir = (getNodePosition(p.nodeEnd)-getNodePosition(p.nodeStart)>0)?1:-1;
  var vdir = (p.strate>0)?1:-1;
  var X0 = getTransformValues(d3.select(p.nodeStart)).translate;
  var X1 = getTransformValues(d3.select(p.nodeEnd)).translate;
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
  var v1 = -(v0+y0-y1);//vdir*height+strateOffset*p.strate+EchunkCase+SchunkCase;
  var laf0 = (1+hdir*vdir)/2;
  var laf1 = (1+hdir*vdir)/2;
  var color1 = linkColor;
  var color2 = "transparent";
  if(highlighted){
    color2 = getHighlightColor(linkColor);
    /*color1 = color2;
    color2 = linkColor;*/
  }
  var highlightPath = elt.components!= null ? elt.components.highlightPath : node.append('path');
  highlightPath
  .attr('d',"M "+x0+","+y0+" v "+v0+" a 5 5 0 0 "+laf0+" "+hdir*arcSize+" "+(-vdir*arcSize)+" h "+h+" a 5 5 0 0 "+laf1+" "+hdir*arcSize+" "+vdir*arcSize+" v "+v1)
  .attr('stroke',color2)
  .attr('stroke-width',removeUnit(linkSize)+3)
  .attr('fill','none');
  var path = elt.components != null ? elt.components.path : node.append('path');
  path
    .attr('d',"M "+x0+","+y0+" v "+v0+" a 5 5 0 0 "+laf0+" "+hdir*arcSize+" "+(-vdir*arcSize)+" h "+h+" a 5 5 0 0 "+laf1+" "+hdir*arcSize+" "+vdir*arcSize+" v "+v1)
    .attr('stroke',linkColor)
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
    .attr('y',removeUnit(addPxs(-removeUnit(margin.top),y0,v0,-vdir*arcSize)));
  
  // to access easily to link components
  elt.components = {highlightPath:highlightPath,path:path,label:text};
}

function highlightLink(link,value,permanent){
  if(link.selected || (!permanent && link.getStyle('highlighted',false))){
    return;
  }
  
  if(permanent){
    setStyle(link,'highlighted',value);
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

function highlightWord(word,value,permanent){
  if(word.selected || (!permanent && word.getStyle('highlighted',false))){
    return;
  }
  
  if(permanent){
    setStyle(word,'highlighted',value);
  } 
  
  word.components.rect
  .style('fill',value?'yellow':'transparent');
}

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

function isObjectPermanentHighlighted(object){
  return object.getStyle('highlighted',false);
}

function getHighlightColor(color){
  if(color == '#000000' || color.slice(0, 1) != '#')
    return 'yellow';
  
  var deltaValue = -0.30;
  var rgb = hexToRgb(color);
  var hsl = rgbToHsl(rgb.r,rgb.g,rgb.b);
  hsl.l+=deltaValue;
  hsl.l=(hsl.l<0)?0:((hsl.l>1)?1:hsl.l);
  rgb = hslToRgb(hsl.h,hsl.s,hsl.l);
  return rgbToHex(rgb.r,rgb.g,rgb.b);
}

function setWordProperties(d,i){
  
}

function setChunkProperties(d,i){
  
}

function setLinkProperties(d,i){
  
}

function getWordBBox(node){
  var bbox = {height:0,x:0,y:0,width:0};
  for(var i=0;i<node.childNodes.length;i++){
    var elt = node.childNodes[i];
    var eltBBox = elt.getBBox();
    bbox.x = (bbox.x<eltBBox.x)?bbox.x:eltBBox.x;
    bbox.y = (bbox.y<eltBBox.y)?bbox.y:eltBBox.y;
    bbox.height += eltBBox.height;
    bbox.width = (bbox.width>eltBBox.width)?bbox.width:eltBBox.width;
  }
  return bbox;
}

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
      .attr('points','0,0 10,5 0,10 1,5')
      .attr('fill','inherit');
};

function isOutside(position,properties){
  // factor 2, in order to take into account left and right in the positions
  return getNodePosition(position)*2< properties.min*2 || getNodePosition(position)*2> properties.max*2;
}

function isInside(position,properties){
  // factor 2, in order to take into account left and right in the positions
  return getNodePosition(position)*2> properties.min*2 && getNodePosition(position)*2< properties.max*2;
}

DepGraph.prototype.crossed = function(link1,link2){
  var p1 = this.getLinkProperties(link1);
  var p2= this.getLinkProperties(link2);
  return (isInside(p1.nodeStart,p2) && isOutside(p1.nodeEnd,p2))
    || (isInside(p1.nodeEnd,p2) && isOutside(p1.nodeStart,p2));
};

DepGraph.prototype.preprocessLinksPosition = function(links){
  // factor 2, in order to take into account left and right in the positions
  this.sortLinksByLength(links[0]);
  var n = links[0].length;
  var table = [];
  for(var i=0;i<n;++i){
    var link = links[0][i];
    var p = this.getLinkProperties(link);
    var k = 1;
    while(true){
      if(table[k]==null){ // nothing exist at this strate : fill it and break
        table[k]=new Array();
        for(var j=p.min*2;j<p.max*2;j++){
          table[k][j]=link;
        }
        p.strate = k;
        break;
      }
      var crossing = null;
      for(var j=p.min*2;j<p.max*2;j++){ // see if there is something where the link lies
        if(table[k][j]!=null){
          crossing = table[k][j];
          if(this.crossed(link,crossing)){
            break;
          }
        }
      }
      if(crossing!=null){ // if there is something
        var p2 = this.getLinkProperties(crossing);
        if(this.crossed(link,crossing)){ // real crossing
          k=-1;
          while(true){
            if(table[k]==null){ // nothing exist at this strate : fill it and break
              table[k]=new Array();
              for(var j=p.min*2;j<p.max*2;j++){ // fill in the strate
                table[k][j]=link;
              }
              p.strate = k; // set the strate
              break;
            }
            var dcrossing = null;
            for(var j=p.min*2;j<p.max*2;j++){ // see if there is something where the link lies
              if(table[k][j]!=null){
                dcrossing = table[k][j];
                break;
              }
            }
            if(dcrossing!=null){ // even if real cross, just jump next line
              k--;
            }else{
              for(var j=p.min*2;j<p.max*2;j++){
                table[k][j]=link;
              }
              p.strate = k;
              break;
            }
          }
          break;
        }else{
          k++;
        }
      }else{
        for(var j=p.min*2;j<p.max*2;j++){ // fill in the table
          table[k][j]=link;
        }
        p.strate = k; // set the strate
        break;
      }
    }
  }
  
  for(var i =0;i<n;i++){
    var link = links[0][i];
    var p = this.getLinkProperties(link);
    var kstep;
    if(p.strate>0){
      kstep = -1;
    }else{
      kstep = 1;
    }
    for(var k = p.strate ; k!=0 ; k+=kstep){
      var altLink = table[k][p.min*2];
      if(altLink!=null && altLink!=link){
        var p2 = this.getLinkProperties(altLink);
        if(p2.min == p.min){
          p2.offsetXmin++;
        }
      }
      altLink = table[k][p.max*2-1];
      if(altLink!=null && altLink!=link){
        var p2 = this.getLinkProperties(altLink);
        if(p2.max == p.max){
          p2.offsetXmax++;
        }
      }
    }
  }
};


DepGraph.prototype.sortLinksByLength = function(links){
  var me = this;
  links.sort(function(a,b){
    return me.getLinkProperties(a).length-me.getLinkProperties(b).length;
  });
};

DepGraph.prototype.getLinkProperties = function(link){
  var d = link.__data__;
  if(d['#properties'] == null){
    var properties = new Object();
    properties.nodeStart = this.getWordNodeByOriginalId(d.source);
    if(properties.nodeStart == null){
      properties.nodeStart = this.getChunkByOriginalId(d.source);
    }
    properties.nodeEnd = this.getWordNodeByOriginalId(d.target);
    if(properties.nodeEnd == null){
      properties.nodeEnd = this.getChunkByOriginalId(d.target);
    }
    if(getNodePosition(properties.nodeStart)<getNodePosition(properties.nodeEnd)){
      properties.min = getNodePosition(properties.nodeStart);
      properties.max = getNodePosition(properties.nodeEnd);
      properties.hdir = 1;
    }else{
      properties.max = getNodePosition(properties.nodeStart);
      properties.min = getNodePosition(properties.nodeEnd);
      properties.hdir = -1;
    }
    properties.vdir = 1; // oriented top
    properties.offsetXmax = 0;
    properties.offsetXmin = 0;
    properties.strate = 0;
    properties.length = properties.max-properties.min;
    properties.outer=0;
    d['#properties'] = properties;
  }
  return d['#properties'];
};

DepGraph.prototype.resetLinksProperties = function(links){
  links.each(function(d,i){
    d['#properties'] = null;
  });
};


function getNodePosition(node){
  if(node.__data__['#position']!=null)
    return node.__data__['#position'];
  else{ // we are dealing with a chunk
    var me = DepGraph.getInstance(node);
    var middle = Math.floor(node.__data__['elements'].length/2);
    var middleNode = me.getWordNodeByOriginalId(node.__data__['elements'][middle]);
    return middleNode.__data__['#position'];
  }
}

function setWordPosition(){

}

function setLinkPosition(d,i){

}

function setWordCallbacks(node){
  var me = DepGraph.getInstance(node.node());
  node.on("click",me.callbacks.wordClick);
}


/************************************************************/
/**                      Edition                           **/
/************************************************************/

EditObject.prototype.dataChanged = function(){
  if(this.actionsLog.length == 0){
    return false;
  }
  else{
    if(this.currentPtr == this.lastSavedPtr){
      return true;
    }else{
      return false;
    }
  }
};


function EditObject(depgraph){
  this.depgraph = depgraph; // reference to the graph
  
  this.editMode = false; // on/off boolean for edition
  this.mode = [];
  this.highlightMode = false;
  
  this.previousSelectedObject = null; // last selected object
  this.actionsLog = []; // action log for rollback purposes
  this.currentPtr = -1; // pointer to the log if undo commands have been used
  this.lastSavedPtr = -1;
  
  this.defaultMode = {
      name : 'default',
      onWordSelect : addLinkClick,
      onLinkSelect : selectObject,
      onChunkSelect : selectObject,
      onWordContext : {
        'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
          showToolTip(depgraph,element);
        },
        'Add Node to the left':function(depgraph,element){
          addWordSettings(depgraph,element[0],0);
        },
        'Add Node to the right':function(depgraph,element){
          addWordSettings(depgraph,element[0],1);
        },
        'Delete':function(depgraph,element){
          var word = clone(element[0]);
          var affectedLinks = removeWord(depgraph,element[0].__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          return {baseAction:'wordRemoval',word:word,affectedLinks:affectedLinks};
        }
      },
      onLinkContext : {
        'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
          showToolTip(depgraph,element);
        },
        'Delete' : function(depgraph,element){
          var link = clone(element[0]);
          link.color = getStyleElement(element[0],'link-color','black');
          var success = removeLink(depgraph, element[0].__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          if(success){
            return {baseAction:'linkRemoval',link:link};
          }
        }
      },
      onChunkContext : null,
      keyHandler : editKeyDownDefault,
      save : null,
      undo:defaultUndo,
      redo:null,
  };
  
  this.addEditMode(this.defaultMode);
}

EditObject.prototype.setEditMode = function(value){
  var me = this;

  if(value == null){
    value = 'default';
  }else{
    editModeExist = false;
    for(i in this.mode){
      if(this.mode[i].name == value){
        editModeExist = true;
        break;
      }
    }
    if(!editModeExist){
      alert('this edition mode does not exist! switching to default mode');
      value = 'default';
    }
  }
  
  this.editMode = value;
  
  if(value){
    window.onbeforeunload = function (e) {
      var message = "Changes made to the graph are not saved. If you leave this page all modifications will be lost.";
      e = e || window.event;
      // For IE and Firefox
      if (e) {
        e.returnValue = message;
      }

      // For Safari
      return message;
    };
  }else{
    window.onbeforeunload = null;
  }
  this.init();
  this.initToolbar();
  
};




EditObject.prototype.initToolbar = function(){
  var depgraph = this.depgraph;
  depgraph.viewer.resetToolbarButtons();
  var buttons = [['save',save,'right','saved'],
                 ['undo',undo,'left','undo'],
                 ['redo',redo,'left','redo'],
                 ['highlight',highlightmode,'left','highlightoff'],
                 ['export',exportData,'right','export']
                 ];

  if(this.mode[this.editMode].buttons != null){
    for(button in this.mode[this.editMode].buttons){
      buttons.push(button);
    }
  }
  
  depgraph.viewer.setToolbarButtons(buttons);
  if(this.currentPtr < 0 || this.mode[this.editMode].undo == null){
    depgraph.viewer.getToolbarButton('undo').hide();
  }
  if(this.currentPtr == this.actionsLog.length-1 || this.mode[this.editMode].redo == null){
    depgraph.viewer.getToolbarButton('redo').hide();
  }/*
  if(this.mode[this.editMode].save == null){
    depgraph.viewer.getToolbarButton('redo').hide();
  }*/
  
  function highlightmode(){
    var me = depgraph.editObject;
    me.highlightMode = !me.highlightMode;
    if(me.highlightMode){
      depgraph.viewer.getToolbarButton('highlight').removeClass('highlightoff').addClass('highlighton');
    }else{
      depgraph.viewer.getToolbarButton('highlight').removeClass('highlighton').addClass('highlightoff');
    }
  }
  
  
  function save(){
    var me = depgraph.editObject;
    if(me.mode[me.editMode].save != null){
      me.mode[me.editMode].save(depgraph);
    }
  }
  
  function undo(){
    var me = depgraph.editObject;
    if(depgraph.editObject.currentPtr == 0){
      depgraph.viewer.getToolbarButton('undo').hide();
    }
    var action = depgraph.editObject.actionsLog[depgraph.editObject.currentPtr];
    if(me.mode[action.mode].undo != null){
      me.mode[action.mode].undo.call(me,depgraph,action.rollbackdata);
    }
    depgraph.editObject.currentPtr--;
    if(me.mode[action.mode].redo != null){
      depgraph.viewer.getToolbarButton('redo').show();
    }
    me.updateSaveState();
  }
  
  function redo(){
    var me = depgraph.editObject;
    depgraph.editObject.currentPtr++;
    if(depgraph.editObject.currentPtr == depgraph.editObject.actionsLog.length-1){
      depgraph.viewer.getToolbarButton('redo').hide();
    }
    var action = depgraph.editObject.actionsLog[depgraph.editObject.currentPtr];
    if(me.mode[action.mode].redo != null){
      me.mode[action.mode].redo.call(me,depgraph,action.rollbackdata);
    }
    depgraph.viewer.getToolbarButton('undo').show();
    me.updateSaveState();
    // TODO !!!!!!!! Change callback so that work (every callbacks should be on the form func(depgraph,params))
  }
  
  function exportData(){
    var coords = this.getBoundingClientRect();
    var point = {x:coords.left,y:coords.top + coords.height + 2};
    var div ='<div>';
/*    if(depgraph.gid != null){
      div += 'Wiki reference (copy paste to create a reference to this graph):<br> &lt;st uid="'+depgraph.gid+'"&gt;&lt;/st&gt;<br>';
    }*/
    div += 'Export Format : '
      + '<select name="type">'
    +'<option value="json" selected>json</option>'
    +'<option value="depxml">depxml</option>'
    +'<option value="dep2pict">dep2pict</option>'
    +'<option value="conll">conll</option>'
    +'</select><br/>'
    +'<input id="export-data'+depgraph.viewer.appendOwnID('')+'"  type="button" value="Export"></div>';
    div = jQuery(div);
    depgraph.viewer.loadTooltipContent(div);
    depgraph.viewer.lockTooltip();
    jQuery('#export-data'+depgraph.viewer.appendOwnID('')).click(function(){
      var select = jQuery('select',this.parentNode);
      var format = select[0].options[select[0].selectedIndex].value;
      window.open('edit/export/'+format);
      depgraph.viewer.hideToolTip();
    });
    
    depgraph.viewer.tooltipExitButton.show();
    depgraph.viewer.showTooltip(point);
  }
};

EditObject.prototype.setNeedToSave = function(){
  this.depgraph.viewer.getToolbarButton('save').removeClass('saved').addClass('save');
};

EditObject.prototype.updateSaveState =function(){
  if(this.lastSavedPtr == this.currentPtr){
    this.depgraph.viewer.getToolbarButton('save').removeClass('save').addClass('saved');
  }else{
    this.depgraph.viewer.getToolbarButton('save').removeClass('saved').addClass('save');
  }
};

EditObject.prototype.init = function(){
  var depgraph = this.depgraph;

  if(!this.editMode){
    this.depgraph.vis.selectAll('g.word').on("click",null);
    this.depgraph.vis.selectAll('g.link').on("click",null);
    this.depgraph.vis.selectAll('g.chunk').on("click",null);
    d3.select(document).on('keydown.edit'+this.depgraph.viewer.uid,null);
    this.depgraph.viewer.resetToolbarButtons();
    jQuery('.link',this.depgraph.vis.node()).contextMenu('', {
     });
    jQuery('.word',this.depgraph.vis.node()).contextMenu('', {
    });
    jQuery('.chunk',this.depgraph.vis.node()).contextMenu('', {
    });
    return;
  }
  
  this.depgraph.vis.selectAll('g.word').on("click",onWordClick);
  this.depgraph.vis.selectAll('g.link').on("click",onLinkClick);
  this.depgraph.vis.selectAll('g.chunk').on("click",onChunkClick);
  d3.select(document).on('keydown.edit'+this.depgraph.viewer.uid,onKeyDown);
  if(this.mode[this.editMode].onLinkContext != null){
    var def = {};
    for(menu in this.mode[this.editMode].onLinkContext){
      def[menu] = {
        menu : menu,
        click: function(element) {  // element is the jquery obj clicked on when context menu launched
          onContextClick('onLinkContext',this,element);
        },
        klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
      };
    }
    jQuery('.link',this.depgraph.vis.node()).contextMenu('link-context-menu', def);
  }
  if(this.mode[this.editMode].onWordContext != null){
    var def = {};
    for(menu in this.mode[this.editMode].onWordContext){
      def[menu] = {
          menu : menu,
        click: function(element) {  // element is the jquery obj clicked on when context menu launched
          onContextClick('onWordContext',this,element);
        },
        klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
      };
    }
    jQuery('.word',this.depgraph.vis.node()).contextMenu('word-context-menu', def);
  }
  if(this.mode[this.editMode].onChunkContext != null){
    var def = {};
    for(menu in this.mode[this.editMode].onChunkContext){
      def[menu] = {
        menu : menu,
        click: function(element) {  // element is the jquery obj clicked on when context menu launched
          onContextClick('onChunkContext',this,element);
        },
        klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
      };
    }
    jQuery('.chunk',this.depgraph.vis.node()).contextMenu('chunk-context-menu', def);
  }
  
  
/*  jQuery('.link',this.depgraph.vis.node()).contextMenu('link-context-menu', {
    'Show Infos': {
        click: function(element) {  // element is the jquery obj clicked on when context menu launched
          showToolTip(depgraph,element);
        },
        klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
    },
   }
  );
  
  jQuery('.word',this.depgraph.vis.node()).contextMenu('word-context-menu', {
    'Show Infos': {
        click: function(element) {  // element is the jquery obj clicked on when context menu launched
          showToolTip(depgraph,element);
        },
        klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
    },
   });
  */
  function onContextClick(object_type,menu,object){
    var me = depgraph.editObject;
    var menu = menu.menu;
    if(me.mode[me.editMode][object_type][menu] != null){
      var action = me.mode[me.editMode][object_type][menu].call(this,depgraph,object);
      me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onContextClick',params:{object_type:object_type,menu:menu,object:object}}});
    }
  }
  
  function onWordClick(d,i){
    var me = depgraph.editObject;
    if(me.mode[me.editMode].onWordSelect != null){
      var action = me.mode[me.editMode].onWordSelect.call(this,depgraph,{d:d,i:i});
      me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onWordSelect',params:{d :d,i:i}}});
    }
  }
  
  function onLinkClick(d,i){
    var me = depgraph.editObject;
    if(me.mode[me.editMode].onLinkSelect!=null){
      var action = me.mode[me.editMode].onLinkSelect.call(this,depgraph,{d:d,i:i});
      me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onLinkSelect',params:{d :d,i:i}}});
    }
  }
  
  function onChunkClick(d,i){
    var me = depgraph.editObject;
    if(me.mode[me.editMode].onChunkSelect != null){
      var action = me.mode[me.editMode].onChunkSelect.call(this,depgraph,{d:d,i:i});
      me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'onChunkSelect',params:{d :d,i:i}}});
    }
  }
  
  function onKeyDown(e){
    var me = depgraph.editObject;
    if(me.mode[me.editMode].keyHandler != null){
      var action = me.mode[me.editMode].keyHandler.call(this,depgraph,{keyCode :d3.event.keyCode});
      me.pushAction({mode:me.editMode,rollbackdata:action,data:{event:'keyHandler',params:{keyCode :d3.event.keyCode}}});
    }
  }
};

EditObject.prototype.addEditMode = function(mode){
  this.mode[mode.name] = mode;
};

EditObject.prototype.pushAction = function(action){
  if(action.rollbackdata != null && this.mode[action.mode].undo != null){
    this.depgraph.viewer.getToolbarButton('redo').hide();
    var button = this.depgraph.viewer.getToolbarButton('undo');
    button.show(); // TODO not to do everytime!
    this.actionsLog.splice(++this.currentPtr,this.actionsLog.length-this.currentPtr,action);
    this.updateSaveState();
  }
};

EditObject.prototype.clearSelection = function(){
  if(this.previousSelectedObject != null){
    try {
      this.previousSelectedObject.selected = false;
      highlightObject(this.previousSelectedObject,false); // sometimes the object doesn't exist anymore.
    }catch(e){
      
    }
    this.previousSelectedObject = null;
  }
};

EditObject.prototype.selectObject =function(obj){
  this.clearSelection();
  this.previousSelectedObject = obj;
  highlightObject(this.previousSelectedObject,true);
  obj.selected = true;
};

EditObject.prototype.changeAttributes = function(obj,attrs,pushAction){
  var backup = clone(obj);
  var oldAttrs = [];
  for(var i = 0; i < attrs.length ; i ++){
    var oldVal = setAttrPath(obj,attrs[i].path,attrs[i].value);
    oldAttrs.push({path:attrs[i].path,value:oldVal});
  }
  if(pushAction != null && pushAction){
    var action = {mode:this.editMode,rollbackdata:{baseAction:'changeAttr',obj:backup,attrs:attrs,oldAttrs:oldAttrs}};
    this.pushAction(action);
  }
};

function setAttrPath(obj,path,value){
  var pathComponents = path.split('/');
  var attr = obj;
  for(var k = 0 ; k< pathComponents.length-1; k++){
    var tmp = attr[pathComponents[k]];
    if(typeof tmp == 'object'){
      if(tmp == null){
        attr[pathComponents[k]] = new Object();
      }
      attr = null;
      attr = tmp;
    }else{
      // Error;
    }
  }
  var oldVal = clone(attr[pathComponents[pathComponents.length-1]]);
  attr[pathComponents[pathComponents.length-1]] = value;
  return oldVal;
}

function selectObject(depgraph,params){
  if(depgraph.editObject.highlightMode){
    var value = !isObjectPermanentHighlighted(this);
    highlightObject(this,value,true);
  }
  depgraph.editObject.selectObject(this);
};

function defaultUndo(depgraph,rollbackdata){
  if(rollbackdata.baseAction == 'linkRemoval'){
    var link = rollbackdata.link;
    var source = depgraph.getWordNodeByOriginalId(link.__data__['source']);
    var target = depgraph.getWordNodeByOriginalId(link.__data__['target']);
    addLink(depgraph,source,target,link.__data__.label,link.color,link.__data__['#id']);
  }else if(rollbackdata.baseAction == 'linkAddition'){
    removeLink(depgraph,rollbackdata.addedLink['#id']);
  }else if(rollbackdata.baseAction == 'wordAddition'){
    removeWord(depgraph,rollbackdata.addedWord['#id']);
  }else if(rollbackdata.baseAction == 'wordRemoval'){
    var word = rollbackdata.word;
    addWord(depgraph,word);
  }else if(rollbackdata.baseAction == 'changeAttr'){
    var id = rollbackdata.obj['#id'];
    var obj = depgraph.getObjectById(id);
    depgraph.editObject.changeAttributes(obj,rollbackdata.oldAttrs);
    depgraph.update();
    depgraph.postProcesses();
  }
}

function defaultRedo(depgraph,actionData){
}

function editKeyDownDefault (depgraph,params){
  if(params.keyCode == 46){
    if(depgraph.editObject.previousSelectedObject!= null){
      if(isALink(depgraph.editObject.previousSelectedObject)){
        var link = clone(depgraph.editObject.previousSelectedObject);
        link.color = getStyleElement(depgraph.editObject.previousSelectedObject,'link-color','black');
        var success = removeLink(depgraph, depgraph.editObject.previousSelectedObject.__data__['#id']);
        depgraph.editObject.previousSelectedObject = null;
        if(success){
          return {baseAction:'linkRemoval',link:link};
        }
      }
    }
  }

}

function showToolTip(depgraph,obj){
  var coords = depgraph.viewer.screenCoordsForElt(obj[0]);
  var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
  var div = createEditPanel(depgraph,obj[0]);
  depgraph.viewer.loadTooltipContent(div);
  depgraph.viewer.tooltipExitButton.show();
  depgraph.viewer.showTooltip(point);
}


function populateLinkEditPanel(depgraph,editDiv,linkData){
  var color = (linkData['#style']!= null && linkData['#style']['link-color']!=null)?linkData['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];
  editDiv += '<tr><td>label</td><td><input type="text" name="label" value="'+linkData.label+'"></td></tr>';
  editDiv += '<tr><td>source</td><td>'+getOptionsListWords(depgraph,linkData.source)+'</td></tr>';
  editDiv += '<tr><td>target</td><td>'+getOptionsListWords(depgraph,linkData.target)+'</td></tr>';
  editDiv += '<tr><td>color</td><td>'+simpleColorPicker('colorPicker',color)+'</td></tr>';
  return editDiv;
}

function populateWordEditPanel(depgraph,editDiv,wordData){
  editDiv += '<tr><td>label</td><td><input type="text" name="label" value="'+wordData.label+'"></td></tr>';
  for(var i =0 ;i< wordData.sublabel.length ; i++){
    editDiv += '<tr><td>sublabel'+i+'</td><td><input type="text" name="sublabel'+i+'" value="'+wordData.sublabel[i]+'"></td></tr>';
  }
  return editDiv;
}


function simpleColorPicker(name,defaultColor){
  var colorPicker = '<table><tr><td><input type="text" name="'+name+'" value="'+defaultColor+'" onkeydown="jQuery(jQuery(jQuery(this).parent().parent().children()[1]).children()[0]).css(\'background-color\',this.value+String.fromCharCode(event.keyCode));"></td><td><div style="display:inline-block; width:30px; height:30px; background-color:'+defaultColor+';"></div></td></tr></table>';
  return colorPicker;
}

function getOptionsListWords(depgraph,selectedOriginalId){
  var optionList = '<select>';
  for(var i in depgraph.data.graph.words){
    var wordData = depgraph.data.graph.words[i];
    optionList += '<option value="'+wordData.id+'" ';
    optionList += ((wordData.id==selectedOriginalId)?'selected="true"':'');
    optionList += '>#' + wordData['#position'] + ' ' + wordData['label'] + ' (' + wordData.id +')';
    optionList += '</option>';
  }
  optionList += '</select>';
  
  return optionList;
}

function createEditPanel(depgraph,obj){
  var data = obj.__data__;
  var klass = '';
  if(obj.classList != null && obj.classList.length > 0){
    klass = obj.classList[0];
  }
  
  var div = '<div>'
    +'<h3 id="edit-info-title">Edit '+klass+' (original id: '+data.id+')</h3>'
    +'<table class="main-properties-table" ref="'+data['#id']+'">';
  
  if(klass == 'word'){
    div = populateWordEditPanel(depgraph,div,data);
  }else if(klass == 'link'){
    div = populateLinkEditPanel(depgraph,div,data);
  }else{
    // TODO(paul) chunk case and error case
  }
  
  div += '</table>';
  div += '<input id="'+depgraph.viewer.appendOwnID(klass+'-save-properties')+'" type="button" value="Save" onclick="saveProperties.call(this,arguments);">';
  div += '</div>';
  
  /*var div = '<div>'
    +'<h3 id="edit-info-title">Edit %Type (original id: %id)</h3>'
    +'<form name="input" action="">'
    +'Label: <input type="text" name="label" value="%label"><br>'
    +'Sublabels (split by comma or space): <input type="text" name="sublabel" value="%sublabel"><br>'
    +'Type : <select name="type">'
    +'<option value="volvo">Adj</option>'
    +'<option value="saab">Lex</option>'
    +'<option value="fiat" selected>Subst</option>'
    +'<option value="audi">Anchor</option>'
    +'<option value="audi">CoAnchor</option>'
    +'</select><br>'
    +'<input type="button" value="Save" onclick="GraphViewer.getInstance(this).hideToolTip();">'
    +'</form>'
    +'</div>';*/
  
  var jdiv = jQuery(div);
  return jdiv;
}

function saveProperties(){
  var type = this.id.substring(0,this.id.indexOf('-'));
  var depgraph = DepGraph.getInstance(this);
  var viewer = depgraph.viewer;
  var form = jQuery(this).parent().find('table.main-properties-table');
  
  if(type == 'link'){
    saveLinkProperties(depgraph,form);
  }else if(type == 'word'){
    saveWordProperties(depgraph,form);
  }else {
    // TODO(paul) error or chunk case
  }
  
  depgraph.update();
  depgraph.postProcesses();
  viewer.hideToolTip();
}

function saveLinkProperties(depgraph,form){
  var link = depgraph.getLinkById(form.attr('ref'));
  var rows = form[0].rows;
  var attrs = [];
  for(var i = 0 ; i < rows.length ; i++){
    var tr = rows[i];
    var cells = tr.cells;
    var label = cells[0].innerHTML;
    var value = cells[1];
    if(label == 'label'){
      attrs.push({path:'label',value:value.firstChild.value});
    }else if(label == 'color'){
      attrs.push({path:'#style/link-color',value:value.firstChild.rows[0].cells[0].firstChild.value});
    }else if(label == 'source'){
      attrs.push({path:'source',value:value.childNodes[0].options[value.childNodes[0].options.selectedIndex].value});
    }else if(label == 'target'){
      attrs.push({path:'target',value:value.childNodes[0].options[value.childNodes[0].options.selectedIndex].value});
    }else{
      // TODO(paul) handle error or extra field
    }
  }
  depgraph.editObject.changeAttributes(link,attrs,true);
}

function saveWordProperties(depgraph,form){
  var word = depgraph.getWordNodeById(form.attr('ref')).__data__;
  var rows = form[0].rows;
  var attrs = [];
  for(var i = 0 ; i < rows.length ; i++){
    var tr = rows[i];
    var cells = tr.cells;
    var label = cells[0].innerHTML;
    var value = cells[1];
    if(label == 'label'){
      attrs.push({path:'label',value:value.firstChild.value});
    }else if(label.substring(0,8) == 'sublabel'){
      attrs.push({path:'sublabel/'+label.substring(8),value:value.firstChild.value});
    }else{
      // TODO(paul) handle error or extra field
    }
  }
  depgraph.editObject.changeAttributes(word,attrs,true);
}

function addField(name,datum){
  if(name.substr(0,1) == '#'){
    if(name != '#data' && name!='#style'){
      return '';
    }
  }
  var field = '<tr><td>' + name + ' :</td>';
  if(typeof datum == 'string'){
    field += '<td><input type="text" name="'+name+'" value="'+datum+'">';
  }else{
    for(item in datum){
      field += addField(item,datum[item]);
    }
  }
  return field;
}

function addLinkClick(depgraph,params){
  if(depgraph.editObject.previousSelectedObject == null || isALink(depgraph.editObject.previousSelectedObject)){
    selectObject.call(this,depgraph,params);
  }
  else{
    if(this.__data__['#id'] == depgraph.editObject.previousSelectedObject.__data__['#id']){ // don't create link when selecting twice the same node
      depgraph.editObject.clearSelection();
      return;
    }
    addLinkSettings(depgraph,depgraph.editObject.previousSelectedObject,this,params);
  }
}

function addLinkSettings(depgraph,obj1,obj2,params){
  var coords = depgraph.viewer.screenCoordsForElt(obj2);
  var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
  var div = '<div><table style="margin:5px 0px 0px 0px;">'
    + '<tr><td>Link name : </td>'
    +'<td><input type="text" name="link-name" value=""></td></tr>'
    + '<tr><td>Link color : </td>'
    +'<td><input type="text" name="link-color" value="black"></td></tr>'
  +'<tr><td colspant="2"><input id="link-settings'+depgraph.viewer.appendOwnID('')+'"  type="button" style="margin:0" value="Create Link"></td></tr>'
  +'</table></div>';
  div = jQuery(div);
  depgraph.viewer.loadTooltipContent(div);
  depgraph.editObject.clearSelection();
  
  jQuery('#link-settings'+depgraph.viewer.appendOwnID('')).click(function(){
    var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
    var color = this.parentNode.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0].value;
    var link = addLink(depgraph,obj1,obj2,value,color);
    var action = {baseAction:'linkAddition',addedLink:link};
    depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordSelect',params:params}});
    depgraph.viewer.hideToolTip();
  });
  
  depgraph.viewer.tooltipExitButton.show();
  depgraph.viewer.showTooltip(point);
}

function addWord(depgraph,wordData){
  var position = wordData['#position'];
  depgraph.insertWord(wordData,position);
  depgraph.editObject.init();
  depgraph.autoHighLightOnMouseOver();
}

function addWordSettings(depgraph,element,offset){
  var coords = depgraph.viewer.screenCoordsForElt(element);
  var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
  var div = '<div><table style="margin:5px 0px 0px 0px;">'
    + '<tr><td>Word label : </td>'
    +'<td><input type="text" name="word-label" value=""></td></tr>'
  +'<tr><td colspant="2"><input id="word-settings'+depgraph.viewer.appendOwnID('')+'"  type="button" style="margin:0" value="Insert Word"></td></tr>'
  +'</table></div>';
  div = jQuery(div);
  depgraph.viewer.loadTooltipContent(div);
  depgraph.editObject.clearSelection();
  
  jQuery('#word-settings'+depgraph.viewer.appendOwnID('')).click(function(){
    var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
    var wordData = {label:value,'#position':element.__data__['#position']+offset};
    var word = addWord(depgraph,wordData);
    var action = {baseAction:'wordAddition',addedWord:word};
    depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordContext',params:element}});
    depgraph.viewer.hideToolTip();
  });
  
  depgraph.viewer.tooltipExitButton.show();
  depgraph.viewer.showTooltip(point);
}

function removeWord(depgraph,id){
  var result = depgraph.removeWord(id);
  return result;
}

function addLink(depgraph,d1,d2,label,color,id){
  if(color == null){
    color = 'black';
  }
  if(id == null){
    id = depgraph.id++;
  }
  d1 = d1.__data__;
  d2 = d2.__data__;
  var link = new Object();
  link.source = d1.id;
  link.target = d2.id;
  link['#style'] = {'link-color' :color};  
  link.label = label;
  link['#id'] = id;
  depgraph.addLink(link);
  depgraph.editObject.init();
  depgraph.autoHighLightOnMouseOver();
  return link;
}

function removeLink(depgraph,id){
  var result = depgraph.removeLink(id);
  return result;
}

function isALink(obj){
  return obj.__data__.target != null && obj.__data__.source != null;
}



/************************************************************/
/**                      Utils                             **/
/************************************************************/

function clone(obj) {
  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj)
    return obj;

  // Handle Date
  if (obj instanceof Date) {
    var copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    var copy = [];
    for ( var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    var copy = {};
    for ( var attr in obj) {
      if (obj.hasOwnProperty(attr))
        copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}

/**
 * Set the position for a d3 selection of an SVGElement
 * @param x
 * @param y
 */
function setGroupPosition(node,x,y){
  node.attr("transform","translate("+x+","+y+")");
};

function center(node,refNode){
  var refbbox = refNode.node().getBBox();
  var bbox = node.node().getBBox();
  node.attr('x',-bbox.width/2+refbbox.width/2);
}

function getTransformValues(elt){
  var value = elt.attr("transform");
  var pairRegex = /(\w+)\((.*?)\)/g;
  var result = new Object();
  var tmp;
  while((tmp = pairRegex.exec(value)) != null){
    var valuesRegex = /(-*\w+\.*\w*)/g;
    result[tmp[1]] = [];
    var values;
    while((values= valuesRegex.exec(tmp[2]))!=null){
      result[tmp[1]].push(parseFloat(values[1]));
    }
  }
  
  return result;
}

function JSONresolveReferences(obj,refPrefix){
  var refids = [];
  var queue = [];
  subResolveRef(obj,refPrefix,refids,queue);
  for(elt in queue){
    if(refids[elt] == null){
      throw "This object has missing references!";
    }else{
      elt = refids[elt];
    }
  }
  
  function subResolveRef(obj,refPrefix,refids,queue){
    for(var property in obj){
      if(!obj.hasOwnProperty(property)){
        continue;
      } 
      if(property == 'id'){
        refids[obj[property]]=obj;
        continue;
      }
      var type = typeof obj[property];
      if(type == 'object'){
        subResolveRef(obj[property],refPrefix,refids,queue);
      }else if(type == 'string'){
        if(obj[property].indexOf(refPrefix) == 0){
          var refid = obj[property].substring(1);
          if(refids[refid] != null){
            //TODO resolve for uri rdf type
            obj[property] = refids[refid];
            subResolveRef(obj[property],refPrefix,refids,queue);
          }else{
            queue.push[obj[property]];
          }
        }
      }
    }
  }
};

function removeUnit(value){
  var regex_px = /(-*)(\d+\.*\d*)px/;
  var match = regex_px.exec(value);
  if(match != null){
    var sign = (match[1].length%2==0)?'':'-';
    value = sign+match[2];
  }
  return parseFloat(value);
}

function addPxs(){
  var sum = 0;
  for(var i=0; i<arguments.length;i++){
    var arg = removeUnit(arguments[i]);
    sum += parseInt(arg);
  }
  return sum+'px';
}

/************************************************************/
/**                      Colors                            **/
/************************************************************/


function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b){
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  }else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  return {h:h ,s: s ,l: l };
}

function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  }else{
      function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return {r:Math.floor(r * 255),g: Math.floor(g * 255),b: Math.floor(b * 255)};
}
