  /************************************************************/
  /**                    Visual Tricks                       **/
  /************************************************************/

(function(depgraphlib){


  /************************************************************/
  /**                      Zooming                           **/
  /************************************************************/

  depgraphlib.DepGraph.prototype.zoom = function(delta){
    var transformValues = depgraphlib.getTransformValues(this.vis);
    var scaleStep = 0.1;
    var minScale = 0.5;
    var maxScale = 2;
    var scale = transformValues.scale[0];
    if(delta<0){ // zooming
      scale += scaleStep;
      if(scale>maxScale){
        scale = maxScale;
      }
    }else{ // dezooming
      scale -= scaleStep;
      if(scale < minScale){
        scale = minScale;
      }
    }

    var S = scale/transformValues.scale;
    var M = {x:d3.event.layerX,y:d3.event.layerY};
    var G0 = this.svg[0][0].getBBox(); 
    var G00 = {x:G0.x-transformValues.translate[0],y:G0.y-transformValues.translate[1]};
    var G1 = {
        x:G0.x*S,
        y:G0.y*S,
        w:G0.width*S,
        h:G0.height*S
    };
    var G11 = {
        x:G00.x*S,
        y:G00.y*S
    };
    var diff = {
        x:M.x*(S-1),
        y:M.y*(S-1)
    };
     
    var diff3 = {
        x:G1.x-diff.x-G11.x,
        y:G1.y-diff.y-G11.y
    };


    var x = diff3.x;
    if(S!=1){
      var graphBBox = this.vis.node().getBBox();
      var graphWidth = (graphBBox.width + 2*depgraphlib.removeUnit(this.data.graph['#style']['margin'].right))*scale; 
      var viewerWidth = this.viewer.mainpanel.width();  
      var changedX = this.setUpScrollBarView(graphWidth,viewerWidth,(depgraphlib.removeUnit(this.data.graph['#style'].margin.left))-diff3.x);
      if(changedX != null){
        x = -changedX;
      }
    }

    x = Math.round(x*1000000)/1000000;

    this.vis.attr("transform",
          "translate(" + x + "," + transformValues.translate[1] + ")" + " scale("+scale+")");

  };


  depgraphlib.DepGraph.prototype.linkDepthZoom = function(delta){
    if(this.onGoingLinkDepthZoomTransform){
      return;
    }else{
      this.onGoingLinkDepthZoomTransform = true;
    }
    if(!this.depthStructData){
      this.depthStructData = this.getMaxLinkDepth();
      this.linkDepthThresh = this.depthStructData.length-1;
    }
    if(delta<0){
      this.linkDepthThresh--;
      this.linkDepthThresh = this.linkDepthThresh>=0?this.linkDepthThresh:0;
    }else{
      this.linkDepthThresh++;
      this.linkDepthThresh = this.linkDepthThresh<this.depthStructData.length?this.linkDepthThresh:this.depthStructData.length-1;
    }
    var nodes = this.depthStructData[this.linkDepthThresh].nodes;
    for (var i = nodes.length - 1; i >= 0; i--) {
      this.hideChildren(nodes[i]);
    };
    this.onGoingLinkDepthZoomTransform = false;
  }

  depgraphlib.DepGraph.prototype.getMaxLinkDepth = function(data,depth){
    if(!this.rootsNodes){
      this.rootsNodes = this.getRootNodes();  
    }

    if(!data){
      data = [];
      data.push({nodes:this.rootsNodes,links:[]});
      depth = 0;
    }

    depth++;
    data.push({nodes:[],links:[]});

    var nodes = data[depth-1].nodes;

    var links = this.vis.selectAll('g.link');
    for(var j = 0; j < links[0].length ; ++j){
      var nodelink = links[0][j];
      var p = this.getLinkProperties(nodelink);
      
      if(p.rootEdge && depth==1){
        data[0].links.push(nodelink);
        continue;
      }

      for (var i = nodes.length - 1; i >= 0; i--) {
        if(nodes[i].__data__.id == nodelink.__data__.source){
          data[depth].nodes.push(p.nodeEnd);
          data[depth].links.push(nodelink);
        }
      };
    }

    if(data[depth].nodes.length > 0){
      this.getMaxLinkDepth(data,depth);
    }

    return data;
  }

  depgraphlib.DepGraph.prototype.getRootNodes = function(){
    var list = [];
    var nlist = [];
    var links = this.vis.selectAll('g.link');
    for(var j = 0; j < links[0].length ; ++j){
      var nodelink = links[0][j];
      var p = this.getLinkProperties(nodelink);
      if(p.rootEdge){
        continue;
      }
      var index = list.indexOf(p.nodeEnd);
      if(index!=-1){
        list.splice(index,1);
      }
      nlist.push(p.nodeEnd);

      index = nlist.indexOf(p.nodeStart);
      if(index==-1){
        if(list.indexOf(p.nodeStart)==-1){
          list.push(p.nodeStart);  
        }
      }
      
    }
    return list;
  }


  /************************************************************/
  /**                    Links folding                       **/
  /************************************************************/


  depgraphlib.DepGraph.prototype.displayFullLinkSpan = function(link,noanimation){
    var me = this;

    if(link.onGoingAnimation){
      return;
    }

    //var containFoldedLinkOrFolded = containFoldedLink(this,link);
    var enclosedFoldedLinks = null;
    if(!link.folded && !noanimation){
      enclosedFoldedLinks = openEnclosedFoldedLinks(me,link);
    }

    var data = link.animationData;
    if(!data){ // this link never folded => first time trying folding
      /*if(containFoldedLinkOrFolded){ // contain folded link => prevent error of computeUsefulData
        return;
      }*/
      data = link.animationData = computeUsefulData(this,link);
    }

    if(enclosedFoldedLinks !== null){
      data.enclosedFoldedLinks = enclosedFoldedLinks;  
    }
    

    if(data == "impossibru!"){ // can't shrink the link because it's already too small
      return;
    }

    var node = d3.select(link);
    var p = this.getLinkProperties(node.node());

    var animationDuration = 500;
    var animationSpeed = 100;
    var totalSteps = animationDuration/animationSpeed;
    if(noanimation){
      totalSteps = 1;
    }
    var step = data.reductionLength/totalSteps;
    var i = 0;
    


    if(link.folded){

      delete this.newnodes[link.__data__['#id']] ;
      data.newnode.remove();

      step = -step;

      for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
        jQuery(data.elements.crossinglinks[j].link).css("display","none");
      }

      if(!noanimation){
        link.onGoingAnimation = setInterval(function(){
          animation(function(){
            for (var i = data.elements.insidelinks.length - 1; i >= 0; i--) {
              jQuery(data.elements.insidelinks[i]).css("display","block");
              data.elements.insidelinks[i].hidden = false;
            }
            for (var i = data.elements.insidenodes.length - 1; i >= 0; i--) {
              jQuery(data.elements.insidenodes[i]).css("display","block");
              data.elements.insidenodes[i].hidden = false;
            }
            for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
              jQuery(data.elements.crossinglinks[j].link).css("display","block");
              redirectCrossingLinks(data.elements.crossinglinks[j],data.newnodeLinkAnchor,data.reductionLength,true);
            }
            if(data.enclosedFoldedLinks){
              for (var i = data.enclosedFoldedLinks.length - 1; i >= 0; i--) {
                me.displayFullLinkSpan(me.getLinkNodeById(data.enclosedFoldedLinks[i]),true);
              };
            }
            me.adjustScroll();
          })
        },animationSpeed);
      }else{
        animation();
        animation(function(){
          for (var i = data.elements.insidelinks.length - 1; i >= 0; i--) {
            jQuery(data.elements.insidelinks[i]).css("display","block");
            data.elements.insidelinks[i].hidden = false;
          }
          for (var i = data.elements.insidenodes.length - 1; i >= 0; i--) {
            jQuery(data.elements.insidenodes[i]).css("display","block");
            data.elements.insidenodes[i].hidden = false;
          }
          for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
            jQuery(data.elements.crossinglinks[j].link).css("display","block");
            redirectCrossingLinks(data.elements.crossinglinks[j],data.newnodeLinkAnchor,data.reductionLength,true);
          }
          me.adjustScroll();
        });
      }
      
      
      link.folded = false;

    }else{

      for (var i = data.elements.insidelinks.length - 1; i >= 0; i--) {
        jQuery(data.elements.insidelinks[i]).css("display","none");
        data.elements.insidelinks[i].hidden = true;
      }
      for (var i = data.elements.insidenodes.length - 1; i >= 0; i--) {
        jQuery(data.elements.insidenodes[i]).css("display","none");
        data.elements.insidenodes[i].hidden = true;
      };
      for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
        jQuery(data.elements.crossinglinks[j].link).css("display","none");
      }

      // Begin New node creation
      var margin = p.nodeStart.getStyle("margin");
      var newnode = this.vis.append("g").classed('dummy',true)
        .attr("transform","translate("+getLeftX(data.nodeLeftX)+","+(depgraphlib.removeUnit(margin.top)+10)+")");
      newnode.append("text")
        .text("( . . . )")
        .style('font-size',"25px")
        .style('font-weight',"bold");
      newnode[0][0].__data__ = {'#position': data.position,id:-2};

      if(!data.newnode){
        var bbox = newnode.node().getBBox();
        data.reductionLength -= depgraphlib.removeUnit(depgraphlib.addPxs(bbox.width,margin.right,margin.left));
        data.newnodeLinkAnchor = getLeftX(data.nodeLeftX) + bbox.width/2;
      }

      data.newnode = newnode;

      if(!this.newnodes){
        this.newnodes = {};
      }
      this.newnodes[link.__data__['#id']] = newnode;

      newnode.on("click",function(){
        me.displayFullLinkSpan(link);
      });
      // End New node creation

      step = data.reductionLength/totalSteps;

      me.adjustScroll(data.newnodeLinkAnchor,data.reductionLength);

      if(!noanimation){
        link.onGoingAnimation = setInterval(function(){
          animation(function(){
            for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
              jQuery(data.elements.crossinglinks[j].link).css("display","block");
              redirectCrossingLinks(data.elements.crossinglinks[j],data.newnodeLinkAnchor,data.reductionLength);
            }
          })
        },animationSpeed);
      }else{
        animation();
        animation(function(){
            for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
              jQuery(data.elements.crossinglinks[j].link).css("display","block");
              redirectCrossingLinks(data.elements.crossinglinks[j],data.newnodeLinkAnchor,data.reductionLength);
            }
          });
      }


      link.folded = true;
    }

    function animation(func){
      if(totalSteps--){
        animationStep(step);  
      }else{
        clearInterval(link.onGoingAnimation);
        func.call(this);
        link.onGoingAnimation = false;
      }
    };

    function animationStep(i){
      //reduceLink(link,i);
      d3.selectAll(data.elements.upperlinks).each(function(d,index){
        reduceLink(this,i);
      });
      d3.selectAll(data.elements.toMoveLinks).each(function(d,index){
        var d = this.drawingData;
        changeLinkPositionAndSize(this,-i,0);
      });
      d3.selectAll(data.elements.toMoveNodes).attr("transform",function(d,index){
        var prevVals = depgraphlib.getTransformValues(d3.select(this))
        var x = prevVals.translate[0]-i;
        return "translate("+x+","+prevVals.translate[1]+")";  
      });
      for (var k in me.newnodes) {
        var position = me.newnodes[k][0][0].__data__['#position'];
        if(position >= data.rightBoundary){
          me.newnodes[k].attr("transform",function(){
            var prevVals = depgraphlib.getTransformValues(d3.select(this))
            var x = prevVals.translate[0]-i;
            return "translate("+x+","+prevVals.translate[1]+")";     
          })
        }
      };
    }
  };

  depgraphlib.DepGraph.prototype.adjustScroll = function(newposition,reduceLength){
    reduceLength = reduceLength || 0;
    var transformValues = depgraphlib.getTransformValues(this.vis);
    var graphBBox = this.vis.node().getBBox();
    var graphWidth = (graphBBox.width - reduceLength + 2*depgraphlib.removeUnit(this.data.graph['#style']['margin'].right))*transformValues.scale[0]; 
    var viewerWidth = this.viewer.mainpanel.width();
    var k = (graphWidth-viewerWidth)/(viewerWidth-depgraphlib.DepGraph.scrollBarWidth);
    var x = k * this.scrollbar.attr('x');
    if(newposition){
      x = newposition*transformValues.scale[0] - viewerWidth/2;
    }
    var changedX = this.setUpScrollBarView(graphWidth,viewerWidth,x);
    if(changedX != null){
      x = -changedX;
    }

    x = Math.round(x*1000000)/1000000;

    this.vis.attr("transform",
          "translate(" + x + "," + transformValues.translate[1] + ")" + " scale("+transformValues.scale[0]+")");
  }

  function reduceLink(link,i){
    var d = link.drawingData;
    var offsetAnchor = 0;
    var r = d.hdir*i;
    var dx = 0;
    if(d.hdir<0){
      dx = r;
    }

    changeLinkPositionAndSize(link,dx,-r);
  }

  function redirectCrossingLinks(crossingLinkData,newanchorX,reduceLength,reset){
    var link = crossingLinkData.link;
    var offset = newanchorX - crossingLinkData.anchorX;
    
    var d = link.drawingData;
    /*
    * There is 4 cases (see sheet)
    * case 1 : insideNodeIsTarget
    * case 2 : -
    * case 3 : insideNodeIsTarget + mustMoveReduce
    * case 4 : mustMoveReduce
    */

    var dx,dh;

    if(crossingLinkData.insideNodeIsTarget){
      dx = 0;
      dh = offset;
      if(crossingLinkData.mustMoveReduce){ // links that cross to the right
        dx -= reduceLength;
        dh += reduceLength;
      }
    }else{
      dh = -offset;
      dx = offset;
      if(crossingLinkData.mustMoveReduce){ // links that cross to the right
        dh -= reduceLength;
      }
    }

    


    
    if(reset){
      dx = -dx
      dh = -dh;
    }

    changeLinkPositionAndSize(link,dx,dh);
  }

  function openEnclosedFoldedLinks(depgraph,link){
    var contextSize = 1;
    var p = depgraph.getLinkProperties(link);
    var leftBoundary = p.min + contextSize;
    var rightBoundary = p.max - contextSize;

    var foldedLinks = [];

    for (var i in depgraph.newnodes) {
      var position = depgraph.newnodes[i][0][0].__data__['#position'];
      if(position >= leftBoundary && position <= rightBoundary){
        depgraph.displayFullLinkSpan(depgraph.getLinkNodeById(i),true);
        foldedLinks.push(i);
      }
    };

    return foldedLinks;
  }

  function containFoldedLink(depgraph,link){
    var contextSize = 1;
    var p = depgraph.getLinkProperties(link);
    var leftBoundary = p.min + contextSize;
    var rightBoundary = p.max - contextSize;

    var nodes = depgraph.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      var node = nodes[0][i];
      var position = node.__data__['#position'];
      if(position > leftBoundary && position < rightBoundary){
        if(node.hidden){
          return true;
        }  
      }
    }
    return false;
  }

  function computeUsefulData(depgraph,link){
    var data = {
      elements:{
        insidenodes:[],
        toMoveNodes:[],
        toMoveLinks:[],
        insidelinks:[],
        crossinglinks:[],
        upperlinks:[],
      },
      leftX:0,
      rightX:0,
      reductionLength:0,
      position:0
    };

    
    var contextSize = 1;
    var p = depgraph.getLinkProperties(link);
    var leftBoundary = data.leftBoundary = p.min + contextSize;
    var rightBoundary = data.rightBoundary = p.max - contextSize;
    data.position = leftBoundary;

    if(rightBoundary - leftBoundary <= 2){
      return "impossibru!";
    }
    
    var nodes = depgraph.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      var node = nodes[0][i];
      var position = node.__data__['#position'];
      if(position > leftBoundary && position < rightBoundary){
        data.elements.insidenodes.push(node);  
      }else if(position >= rightBoundary){
        data.elements.toMoveNodes.push(node);
      }
      
      if(position == leftBoundary){
        var margin = node.getStyle('margin');
        var transform = depgraphlib.getTransformValues(d3.select(node));
        var bbox = node.getBBox();
        var x = depgraphlib.removeUnit(depgraphlib.addPxs(transform.translate[0],bbox.width,margin.right,margin.left));
        data.leftX = x;
        data.nodeLeftX = node;
        data.reductionLength -= x;
      }

      if(position == rightBoundary){
        var margin = node.getStyle('margin');
        var transform = depgraphlib.getTransformValues(d3.select(node));
        var x = depgraphlib.removeUnit(depgraphlib.addPxs(transform.translate[0],margin.left));
        data.rightX = x;
        data.reductionLength += x;
      }
    }
    

    var links = depgraph.vis.selectAll('g.link');
    for(var j = 0; j < links[0].length ; ++j){
      var nodelink = links[0][j];
      var p = depgraph.getLinkProperties(nodelink);
      if(p.min > leftBoundary){
        if(p.max < rightBoundary){
          data.elements.insidelinks.push(nodelink);
        }else if(p.min < rightBoundary){
          var insideNode = p.hdir>0?p.nodeStart:p.nodeEnd;
          var anchorX = getNodeAnchorPosition(insideNode);
          data.elements.crossinglinks.push({link:nodelink,anchorX:anchorX,insideNodeIsTarget:p.hdir<0,mustMoveReduce:true});
        }else{
          data.elements.toMoveLinks.push(nodelink);
        }
      }else if(p.max > rightBoundary){
        data.elements.upperlinks.push(nodelink);
      }else if(p.max > leftBoundary){
        var insideNode = p.hdir>0?p.nodeEnd:p.nodeStart;
        var anchorX = getNodeAnchorPosition(insideNode);
        data.elements.crossinglinks.push({link:nodelink,anchorX:anchorX,insideNodeIsTarget:p.hdir>0});
      }
    }

    return data;
  };


  function getNodeAnchorPosition(replacedNode){
    var margin = replacedNode.getStyle('margin');
    var transform = depgraphlib.getTransformValues(d3.select(replacedNode));
    var bbox = replacedNode.getBBox();
    return depgraphlib.removeUnit(depgraphlib.addPxs(transform.translate[0],bbox.width/2));

  }

  function getLeftX(node){
    var margin = node.getStyle('margin');
    var transform = depgraphlib.getTransformValues(d3.select(node));
    var bbox = node.getBBox();
    var x = depgraphlib.removeUnit(depgraphlib.addPxs(transform.translate[0],bbox.width,margin.right,margin.left));
    return x;
  }


  depgraphlib.DepGraph.prototype.hideChildren = function(word){
    var list = collectChildren(this,word);
    var display = "none";
    var reset = false;
    if(word.hiddenChild){
      display = "block";
      reset = true;
      depgraphlib.DepGraph.highlightWord(word,false,true);
    }else{
      depgraphlib.DepGraph.highlightWord(word,true,true);
    }
    for (var i = list.nodes.length - 1; i >= 0; i--) {
      list.nodes[i].toHide = true;  
    };
    for (var i = list.links.length - 1; i >= 0; i--) {
      jQuery(list.links[i]).css("display",display);
    };

    moveNodes(this,reset);

    word.hiddenChild = !word.hiddenChild;

    var tval = depgraphlib.getTransformValues(d3.select(word));
    this.adjustScroll(tval.translate[0]);
  };

  function moveNodes(depgraph,reset){
    var words = depgraph.vis.selectAll('g.word, g.dummy');
    var offset = 0;
    for(var j = 0; j < words[0].length ; ++j){
      var node = words[0][j];
      if(node.toHide){
        node.toHide = false;
        if(reset){
          jQuery(node).css("display","block");
          node.hidden = false;
        }
        if(!node.hidden){
          var margin = node.getStyle('margin');
          var bbox = node.getBBox();
          if(!reset){
            jQuery(node).css("display","none");
            node.hidden = true;
            offset += depgraphlib.removeUnit(depgraphlib.addPxs(bbox.width,margin.right,margin.left));  
          }else{
            offset -= depgraphlib.removeUnit(depgraphlib.addPxs(bbox.width,margin.right,margin.left));  
          }
        }
      }else{
        var dnode = d3.select(node);
        var prevVals = depgraphlib.getTransformValues(dnode);
        var x = prevVals.translate[0]-offset;
        dnode.attr("transform","translate("+x+","+prevVals.translate[1]+")"); 
        //--
        var links = depgraph.vis.selectAll('g.link');
        for(var k = 0; k< links[0].length ; ++k){
          var nodelink = links[0][k];
          var p = depgraph.getLinkProperties(nodelink);
          if(p.rootEdge){ // origin arc
            if(nodelink.__data__.source == node.__data__.id || nodelink.__data__.target == node.__data__.id){
              changeLinkPositionAndSize(nodelink,-offset,0);
            }
            continue;
          }
          if(nodelink.__data__.source == node.__data__.id){
            if(p.hdir<0){
              // case 1
              changeLinkPositionAndSize(nodelink,-offset,offset);
            }else{
              // case 3
              changeLinkPositionAndSize(nodelink,-offset,offset);
            }
          }else if(nodelink.__data__.target == node.__data__.id){
            if(p.hdir<0){
              // case 4
              changeLinkPositionAndSize(nodelink,0,-offset);
            }else{
              // case 2
              changeLinkPositionAndSize(nodelink,0,-offset);
            }
          }
        }
        //--
      }
    }
  }

  function collectChildren(depgraph,word){
    var list = {nodes:[],links:[]};
    var links = depgraph.vis.selectAll('g.link');
    for(var j = 0; j < links[0].length ; ++j){
      var nodelink = links[0][j];
      var p = depgraph.getLinkProperties(nodelink);
      if(p.rootEdge && nodelink.__data__.target == word.__data__.id){
        list.links.push(nodelink);
        continue;
      }
      if(nodelink.__data__.source == word.__data__.id){
        list.nodes.push(p.nodeEnd);
        list.links.push(nodelink);
        if(p.nodeEnd.hiddenChild){
          continue;
        }
        var sublist = collectChildren(depgraph,p.nodeEnd);
        list.nodes = list.nodes.concat(sublist.nodes);
        list.links = list.links.concat(sublist.links);
      }
    }
    return list;
  }

  function changeLinkPositionAndSize(link,dx,dh){
    var d = link.drawingData;
    var originArc = link.__data__['#properties'].rootEdge;

    d.x0 += dx;
    d.h += dh;

    if(originArc){
      link.components.highlightPath.attr('d',"M "+d.x0+","+(d.y0+d.v0)+" v "+(-d.v0));
      link.components.path.attr('d',"M "+d.x0+","+(d.y0+d.v0)+" v "+(-d.v0));
    }else{
      link.components.highlightPath
      //.attr('d',"M "+d.x0+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+d.h+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);  
      .attr('d',"M "+d.x0+","+d.y0+" a "+d.h/2+" "+d.v0+" 0 0 "+d.laf0+" "+d.h+" 0");
      link.components.path
      //.attr('d',"M "+d.x0+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+d.h+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);        
      .attr('d',"M "+d.x0+","+d.y0+" a "+d.h/2+" "+d.v0+" 0 0 "+d.laf0+" "+d.h+" 0");
    }

    link.components.label.attr('x',-d.textBBox.width/2+d.x0+d.h/2+d.hdir*d.arcSize);
    
  }


}(window.depgraphlib));

