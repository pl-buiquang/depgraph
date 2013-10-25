  /************************************************************/
  /**                      Crossing Algo                     **/
  /************************************************************/

(function(depgraphlib){

    /**
     * returns true if a node (word or chunk) is outside a frame defined by a link set of properties,
     * false otherwise
     */
    function isOutside(object,properties){
      // factor 2, in order to take into account left and right in the positions
      return depgraphlib.getNodePosition(object)*2< properties.min*2 || depgraphlib.getNodePosition(object)*2> properties.max*2;
    }

    /**
     * returns true if a node (word or chunk) is inside a frame defined by a link set of properties,
     * false otherwise
     */
    function isInside(object,properties){
      // factor 2, in order to take into account left and right in the positions
      return depgraphlib.getNodePosition(object)*2> properties.min*2 && depgraphlib.getNodePosition(object)*2< properties.max*2;
    }

    /**
     * returns true if two link cross each other, false otherwise
     * @param link1
     * @param link2
     * @returns {Boolean}
     */
    depgraphlib.DepGraph.prototype.crossed = function(link1,link2){
      var p1 = this.getLinkProperties(link1);
      var p2= this.getLinkProperties(link2);
      return (isInside(p1.nodeStart,p2) && isOutside(p1.nodeEnd,p2))
        || (isInside(p1.nodeEnd,p2) && isOutside(p1.nodeStart,p2));
    };

    /**
     * set up the links position and strate (height of the edge and "innerness")
     * @param links
     */
    depgraphlib.DepGraph.prototype.preprocessLinksPosition = function(links){
      var me = this;
      // factor 2, in order to take into account left and right in the positions
      this.sortLinksByLength(links[0]);
      var n = links[0].length;
      var table = [];
      for(var i=0;i<n;++i){
        var link = links[0][i];
        var p = this.getLinkProperties(link);
        if(p.min == p.max){ // this is the special case when the link is the root
          p.strate = 1;
          setMaxStrate(1);
          table[1]=new Array();
          table[1][(p.min*2)+1]=link;
          continue;
        }
        var k = 1;
        while(true){
          if(table[k]==null){ // nothing exist at this strate : fill it and break
            table[k]=new Array();
            p.strate = k;
            setMaxStrate(k);
            for(var l=k;l>0;l--){
              for(var j=(p.min*2)+1;j<(p.max*2)+1;j++){
                if(!table[l][j]){
                  table[l][j]=link;
                }
              }
            }
            break;
          }
          var crossing = null;
          for(var j=(p.min*2)+1;j<(p.max*2)+1;j++){ // see if there is something where the link lies
            if(table[k][j]!=null){
              crossing = table[k][j];
              if(this.crossed(link,crossing)){
                break;
              }
            }
          }
          if(crossing!=null){ // if there is something
            if(this.crossed(link,crossing)){ // real crossing
              k=-1;
              while(true){
                if(table[k]==null){ // nothing exist at this strate : fill it and break
                  table[k]=new Array();
                  for(var l=k;l<0;l++){
                    for(var j=(p.min*2)+1;j<(p.max*2)+1;j++){ // fill in the strate
                      if(!table[l][j]){
                        table[l][j]=link;
                      }
                    }
                  }
                  p.strate = k; // set the strate
                  setMaxStrate(k);
                  break;
                }
                var dcrossing = null;
                for(var j=(p.min*2)+1;j<(p.max*2)+1;j++){ // see if there is something where the link lies
                  if(table[k][j]!=null){
                    dcrossing = table[k][j];
                    break;
                  }
                }
                if(dcrossing!=null){ // even if real cross, just jump next line
                  k--;
                }else{
                  for(var l=k;l<0;l++){
                    for(var j=(p.min*2)+1;j<(p.max*2)+1;j++){ // fill in the strate
                      if(!table[l][j]){
                        table[l][j]=link;
                      }
                    }
                  }
                  p.strate = k;
                  setMaxStrate(k);
                  break;
                }
              }
              break;
            }else{
              k++;
            }
          }else{
            for(var l=k;l>0;l--){
              for(var j=(p.min*2)+1;j<(p.max*2)+1;j++){
                if(!table[l][j]){
                  table[l][j]=link;
                }
              }
            }
            p.strate = k; // set the strate
            setMaxStrate(k);
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
        var prevLeftLink = null;
        var prevRightLink = null;
        for(var k = p.strate ; k!=0 ; k+=kstep){
          var altLink = table[k][(p.min*2)+1];
          if(altLink != prevLeftLink && altLink!=null && altLink!=link){
            var p2 = this.getLinkProperties(altLink);
            if(p2.min == p.min){
              p2.offsetXmin++;
            }
          }
          prevLeftLink = altLink;
          altLink = table[k][p.max*2];
          if(altLink != prevRightLink && altLink!=null && altLink!=link){
            var p2 = this.getLinkProperties(altLink);
            if(p2.max == p.max){
              p2.offsetXmax++;
            }
          }
          prevRightLink = altLink;
        }
      }
      
      function setMaxStrate(strate){
        var absStrate = Math.abs(strate);
        me.maxLinksStrate = (me.maxLinksStrate<absStrate)?absStrate:me.maxLinksStrate;
      };
      
    };

    /**
     * sort the links by length..
     * @param links
     */
    depgraphlib.DepGraph.prototype.sortLinksByLength = function(links){
      var me = this;
      links.sort(function(a,b){
        return me.getLinkProperties(a).length-me.getLinkProperties(b).length;
      });
    };

    /**
     * lazy load the computed properties of a link.
     * Those properties are used to compute the position of the links in order
     * to minimize crossing
     * @param link
     * @returns the properties object
     */
    depgraphlib.DepGraph.prototype.getLinkProperties = function(link){
      var d = link.__data__;
      if(d['#properties'] == null){
        var properties = new Object();
        properties.nodeStart = this.getWordNodeByOriginalId(d.source);
        if(properties.nodeStart == null){
          properties.nodeStart = this.getChunkNodeByOriginalId(d.source);
        }
        properties.nodeEnd = this.getWordNodeByOriginalId(d.target);
        if(properties.nodeEnd == null){
          properties.nodeEnd = this.getChunkNodeByOriginalId(d.target);
        }
        var startPos = depgraphlib.getNodePosition(properties.nodeStart);
        var endPos = depgraphlib.getNodePosition(properties.nodeEnd);
        if(startPos == -1 || endPos == -1){ // this is the root edge
          properties.min = properties.max = (startPos!=-1)?startPos:endPos;
          properties.hdir = 1;
        }else{
          if(startPos<endPos){
            properties.min = startPos;
            properties.max = endPos;
            properties.hdir = 1;
          }else{
            properties.max = startPos;
            properties.min = endPos;
            properties.hdir = -1;
          }
        }
        properties.vdir = 1; // oriented top
        properties.offsetXmax = 0;
        properties.offsetXmin = 0;
        properties.strate = 0;
        properties.length = properties.max-properties.min;
        /*if(!properties.nodeStart){ // for orign arc to be processed first in anti crossing algo
          properties.length = 0;
        }*/
        properties.outer=0;
        d['#properties'] = properties;
      }
      return d['#properties'];
    };

    /**
     * Reset the properties of all links
     * @param links
     */
    depgraphlib.DepGraph.prototype.resetLinksProperties = function(links){
      links.each(function(d,i){
        d['#properties'] = null;
      });
      this.maxLinksStrate = 0;
    };




}(window.depgraphlib));

