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



  /************************************************************/
  /**                    Links folding                       **/
  /************************************************************/


  depgraphlib.DepGraph.prototype.displayFullLinkSpan = function(link){
    
    if(link.onGoingAnimation){
      return;
    }

    var data = link.animationData;
    if(!data){
      data = link.animationData = computeUsefulData(this,link);
    }

    if(data == "impossibru!"){ // can't shrink the link because it's already too small
      return;
    }

    console.log(data);

    var node = d3.select(link);
    var p = this.getLinkProperties(node.node());

    var offsetStart = 0;
    var animationSpeed = 2000;
    var step = data.reductionLength/(animationSpeed/100);
    var i = 0;
    


    if(link.folded){

      data.newnode.remove();

      offsetStart = -data.reductionLength;
      step = -step;

      var prevTVals = {};

      d3.selectAll(data.elements.toMoveNodes).each(function(d,i){
        prevTVals[i]=(depgraphlib.getTransformValues(d3.select(this)));
      });

      for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
        jQuery(data.elements.crossinglinks[j].link).css("display","none");
      }

      link.onGoingAnimation = setInterval(animation,100);
      
      setTimeout(function(){
        clearInterval(link.onGoingAnimation);
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
          redirectCrossingLinks(data.elements.crossinglinks[j],offsetStart,data.newnodeLinkAnchor,data.reductionLength,true);
        }
        animationStep(-data.reductionLength);
        link.onGoingAnimation=false;
      },animationSpeed);
      
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


      if(!data.newnode){
        var margin = p.nodeStart.getStyle("margin");
        var newnode = data.newnode = this.vis.append("g")
          .attr("transform","translate("+data.leftX+","+(depgraphlib.removeUnit(margin.top)+10)+")");
        newnode.append("text")
          .text("( . . . )")
          .style('font-size',"25px")
          .style('font-weight',"bold");
        var bbox = newnode.node().getBBox();
        data.reductionLength -= depgraphlib.removeUnit(depgraphlib.addPxs(bbox.width,margin.right,margin.left));
        data.newnodeLinkAnchor = data.leftX + bbox.width/2;
      }else{
        var margin = p.nodeStart.getStyle("margin");
        var newnode = data.newnode = this.vis.append("g")
          .attr("transform","translate("+data.leftX+","+(depgraphlib.removeUnit(margin.top)+10)+")");
        newnode.append("text")
          .text("( . . . )")
          .style('font-size',"25px")
          .style('font-weight',"bold");
      }

      step = data.reductionLength/(animationSpeed/100);





      var prevTVals = {};

      d3.selectAll(data.elements.toMoveNodes).each(function(d,i){
        prevTVals[i]=(depgraphlib.getTransformValues(d3.select(this)));
      });

      data.prevTVals = prevTVals;

      link.onGoingAnimation = setInterval(animation,100);
      
      setTimeout(function(){
        clearInterval(link.onGoingAnimation);
        for (var j = data.elements.crossinglinks.length - 1; j >= 0; j--) {
          jQuery(data.elements.crossinglinks[j].link).css("display","block");
          redirectCrossingLinks(data.elements.crossinglinks[j],data.newnodeLinkAnchor,data.reductionLength);
        }
        animationStep(data.reductionLength);
        link.onGoingAnimation=false;
      },animationSpeed);

      link.folded = true;
    }

    function animation(){
      i += step;
      animationStep(i);
    };

    function animationStep(i){
      reduceLink(link,i,offsetStart);
      d3.selectAll(data.elements.upperlinks).each(function(d,index){
        reduceLink(this,i,offsetStart);
      });
      d3.selectAll(data.elements.toMoveLinks).each(function(d,index){
        if(!this.hidden){
          var d = this.drawingData;
          this.components.highlightPath.attr('d',"M "+(offsetStart+d.x0-i)+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+d.h+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);  
          this.components.path.attr('d',"M "+(offsetStart+d.x0-i)+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+d.h+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);        
          var textBBox = this.components.label.node().getBBox();
          this.components.label.attr('x',-textBBox.width/2+(offsetStart+d.x0-i)+(d.h)/2+d.hdir*d.arcSize);
        }
      });
      d3.selectAll(data.elements.toMoveNodes).attr("transform",function(d,index){
        if(!this.hidden){
          var x = prevTVals[index].translate[0]-i;
          return "translate("+x+","+prevTVals[index].translate[1]+")";  
        }
      });

    }

    

    
    
  };

  function moveLink(link,i){

  }

  function move(word,i){

  }

  function reduceLink(link,i,offsetStart){
    if(!offsetStart){
      offsetStart = 0;
    }
    var d = link.drawingData;
    var offsetAnchor = 0;
    var r = d.hdir*i;
    if(d.hdir<0){
      offsetAnchor=(r+offsetStart);
    }
    link.components.highlightPath.attr('d',"M "+(d.x0+offsetAnchor)+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+(d.hdir*offsetStart+d.h-r)+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);  
    link.components.path.attr('d',"M "+(d.x0+offsetAnchor)+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+(d.hdir*offsetStart+d.h-r)+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);        
    var textBBox = link.components.label.node().getBBox();
    link.components.label.attr('x',-textBBox.width/2+d.x0+offsetAnchor+(d.hdir*offsetStart+d.h-r)/2+d.hdir*d.arcSize);
  }

  function redirectCrossingLinks(crossingLinkData,newanchorX,reduceLength,reset){
    var link = crossingLinkData.link;
    var offset = newanchorX - crossingLinkData.anchorX;
    
    var d = link.drawingData;
    var offsetSource = 0;
    if(!crossingLinkData.insideNodeIsTarget){
      offsetSource = offset;
    }else if(d.hdir<0){
      offsetSource =(d.hdir*reduceLength);
    }

    if(crossingLinkData.mustMoveReduce){
      offset += reduceLength;
    }

    if(reset){
      offsetSource = 0;
      offset = 0;
    }


    
    link.components.highlightPath.attr('d',"M "+(d.x0+offsetSource)+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+(offset+d.h)+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);  
    link.components.path.attr('d',"M "+(d.x0+offsetSource)+","+d.y0+" v "+d.v0+" a 5 5 0 0 "+d.laf0+" "+d.hdir*d.arcSize+" "+(-d.vdir*d.arcSize)+" h "+(offset+d.h)+" a 5 5 0 0 "+d.laf1+" "+d.hdir*d.arcSize+" "+d.vdir*d.arcSize+" v "+d.v1);        
    var textBBox = link.components.label.node().getBBox();
    link.components.label.attr('x',-textBBox.width/2+(d.x0+offsetSource)+(offset+d.h)/2+d.hdir*d.arcSize);
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
      reductionLength:0
    };

    
    var contextSize = 1;
    var p = depgraph.getLinkProperties(link);
    var leftBoundary = p.min + contextSize;
    var rightBoundary = p.max - contextSize;

    if(rightBoundary - leftBoundary <= 2){
      return "impossibru!";
    }
    
    var nodes = depgraph.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      var position = nodes[0][i].__data__['#position'];
      if(position > leftBoundary && position < rightBoundary){
        data.elements.insidenodes.push(nodes[0][i]);  
      }else if(position >= rightBoundary){
        data.elements.toMoveNodes.push(nodes[0][i]);
      }
      
      if(position == leftBoundary){
        var margin = nodes[0][i].getStyle('margin');
        var transform = depgraphlib.getTransformValues(d3.select(nodes[0][i]));
        var bbox = nodes[0][i].getBBox();
        var x = depgraphlib.removeUnit(depgraphlib.addPxs(transform.translate[0],bbox.width,margin.right,margin.left));
        data.leftX = x;
        data.reductionLength -= x;
      }

      if(position == rightBoundary){
        var margin = nodes[0][i].getStyle('margin');
        var transform = depgraphlib.getTransformValues(d3.select(nodes[0][i]));
        var bbox = nodes[0][i].getBBox();
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



}(window.depgraphlib));

