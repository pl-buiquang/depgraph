(function(depgraphlib){
  
  /**
   * @function prepareData
   * @desc
   * - Fill all requiered values to data with default/auto-generated values
   * - resolve json references (@)
   * - set up #id and #position, reset #properties
   * @todo(paul) validate data => set error message if failed validation
   * 
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.prepareData = function() {
    // Resolve references
    depgraphlib.JSONresolveReferences(this.data,'@');
    
    // Assign #id (and #position for words)
    this.id = 0;
    this.data.graph.words = this.data.graph.words || [];
    this.data.graph.links = this.data.graph.links || [];
    this.data.graph.chunks = this.data.graph.chunks || [];
    for(var i = 0 ; i<this.data.graph.words.length ; i++){
      var word = this.data.graph.words[i]; 
      word['#id']=this.id++;
      word['#position']=i;
      if(!word.sublabel){
        word.sublabel = [];
      }
    }
    for(var i = 0 ; i<this.data.graph.links.length ; i++){
      this.data.graph.links[i]['#id']=this.id++;
      this.data.graph.links[i]['#properties']=null;
    }
    for(var i = 0 ; i<this.data.graph.chunks.length ; i++){
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
   * @function isALink
   * @param {object} obj - the object which type is to be tested
   * @return {boolean}
   * @memberof DepGraphLib
   */
  depgraphlib.isALink = function(obj){
    return obj.__data__.target != null && obj.__data__.source != null;
  };

  /**
   * @function isAWord
   * @param {object} obj - the object which type is to be tested
   * @return {boolean}
   * @memberof DepGraphLib
   */
  depgraphlib.isAWord = function(obj){
    return obj.__data__['#position'] != null;
  };
  
  /**
   * @function isAChunk
   * @param {object} obj - the object which type is to be tested
   * @return {boolean}
   * @memberof DepGraphLib
   */
  depgraphlib.isAChunk = function(obj){
    return obj.elements != null;
  };
  
  
  /**
   * @function getWordNodeByPosition
   * @desc Search and returns a word by its position
   * @param {number} position - the position of the word in the sentence
   * (starting from 0)
   * @returns {object|null} a word svg element
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getWordNodeByPosition = function(position){
    var nodes = this.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['#position'] == position)
        return nodes[0][i];
    }
    return null;
  };

  /**
   * @function getWordNodeByOriginalId
   * @desc Search and returns a word by its original id (id)
   * @param {string} id - the original id of the word
   * @returns {object|null} a word svg element
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getWordNodeByOriginalId = function(id){
    var nodes = this.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['id'] == id)
        return nodes[0][i];
    }
  };

  /**
   * @function getChunkNodeByOriginalId
   * @desc Search and return a chunk by its original id (id)
   * @param {string} id - the original id of the chunk
   * @returns {object|null} a chunk svg element
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getChunkNodeByOriginalId = function(id){
    var nodes = this.vis.selectAll('g.chunk');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['id'] == id)
        return nodes[0][i];
    }
  };

  /**
   * @function getWordNodeById
   * @desc Search and return a word node by its #id
   * @param {string} id - the internal id (#id) of the word
   * @returns {object|null} a word svg element
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getWordNodeById = function(id){
    var nodes = this.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['#id'] == id)
        return nodes[0][i];
    }
  };
  
  /**
   * @function getWordNodeById
   * @desc Search and return a word by its original id
   * @param {string} id - the original id of the word
   * @returns {object|null} a word data
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getWordByOriginalId = function(id){
    for(var i in this.data.graph.words){
      if(this.data.graph.words[i]['id'] == id){
        return this.data.graph.words[i];
      }
    }
  };

  /**
   * @function getWordIndexById
   * @desc Search and return a word index from its #id
   * @param {string} id - the internal id of the word
   * @returns {number|null} the index of the word in the words data list
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getWordIndexById = function(id){
    for(var i in this.data.graph.words){
      if(this.data.graph.words[i]['#id'] == id){
        return i;
      }
    }
  };

  /**
   * @function getLinkById
   * @desc Search and return a link by its #id
   * @param {string} id - the internal id of the link
   * @returns {DepGraphLink|null} the link
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getLinkById = function(id){
    for(var i in this.data.graph.links){
      if(this.data.graph.links[i]['#id'] == id){
        return this.data.graph.links[i];
      }
    }
  };

  /**
   * @function getLinkNodeById
   * @desc Search and return a link node by its #id
   * @param {string} id - the internal id of the link
   * @returns {object|null} the link svg node
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getLinkNodeById = function(id){
    var nodes = this.vis.selectAll('g.link');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['#id'] == id)
        return nodes[0][i];
    }
  };

  /**
   * @function getLinkIndexById
   * @desc Search and return a link index by its #id
   * @param {string} id - the internal id of the link
   * @returns {number|null} the link index in the links data list
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getLinkIndexById = function(id){
    for(var i in this.data.graph.links){
      if(this.data.graph.links[i]['#id'] == id){
        return i;
      }
    }
  };

  /**
   * @function getLinkIndexByOriginalId
   * @desc Search and return a link by its original id (id), provided there is one set.
   * (Original id for link is not required)
   * @param {string} id - the original id of the link
   * @returns {number|null} a link index in the links data list
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getLinkIndexByOriginalId = function(id){
    for(var i in this.data.graph.links){
      if(this.data.graph.links[i].id == id){
        return i;
      }
    }
  };
  
  /**
   * @function getChunkIndexById
   * @desc Search and return a chunk index by its #id
   * @param {string} id - the internal id of the chunk
   * @returns {number|null} the link index in the chunks data list
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getChunkIndexById = function(id){
    for(var i in this.data.graph.chunks){
      if(this.data.graph.chunks[i]['#id'] == id){
        return i;
      }
    }
  };
  
  

  /**
   * @function getObjectById
   * @desc Search and return an object (link, word or chunk) by its #id
   * @param {string} id - the internal id of the object
   * @returns {DepGraphLink|DepGraphWord|DepGraphChunk|null} an object data from the links,words or chunks data list
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getObjectById = function(id){
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
   * @function getObjectNodeByOriginalId
   * @desc Search and return an object node (link, word or chunk) by its #id
   * @param {string} id - the internal id of the object
   * @returns {object|null} an object node from the links,words or chunks data list
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getObjectNodeByOriginalId = function(id){
    var nodes = this.vis.selectAll('g.word');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['id'] == id)
        return nodes[0][i];
    }
    nodes = this.vis.selectAll('g.chunk');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['id'] == id)
        return nodes[0][i];
    }
    nodes = this.vis.selectAll('g.link');
    for(var i = 0; i<nodes[0].length; i++){
      if(nodes[0][i].__data__['id'] == id)
        return nodes[0][i];
    }
  };
  
  /**
   * @function getObjectNodeFromObject
   * @desc Search and return an object node (link node, word node or chunk node) by its #id
   * @param {string} id - the internal id of the object
   * @returns {object|null} an object svg element from the links,words or chunks nodes selections
   * @todo not implemented yet !
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getObjectNodeFromObject = function(id){
    //TODO (check object type (isALink, isAChunk, isAWord, else) then search in corresponding
    // lists the #id
  };

  /**
   * @function getStyleElement
   * @param {object} elt - the d3js node element
   * @param {string} property - the style property ask for
   * @param {object} [defaultValue] - the default value if no style was found
   * @desc return the style of an svg element, looking in data.#style, or a default value or null
   * @return the style or default value of the elt 
   * @memberof DepGraphLib
   * @todo make it a member of DepGraph class and watch for global and type styles
   * @see SVGElement#getStyle
   */
  depgraphlib.getStyleElement = function(elt,property,defaultValue){
    if(elt.__data__['#style']!=null && elt.__data__['#style'][property] != null){
      return elt.__data__['#style'][property];
    };
    return defaultValue;
  };

  /**
   * @function getStyle
   * @desc get style class method for svg element,
   * return a property searching for embed style, or class style or a default value or null
   * @param {string} property - the property searched for
   * @param {object} [defaultValue] the default value if no style for this element was defined
   * @return {object|null} the property searched for or a default value or null
   * @memberof! SVGElement#
   */
  SVGElement.prototype.getStyle = function(property,defaultValue){
    var me = depgraphlib.DepGraph.getInstance(this);
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
   * @function setStyle
   * @desc set a property style in data.#style
   * @param {object} element - the d3js node considered
   * @param {string} property - the name of the property to be changed
   * @param {object} [value] - the value to set to the property
   * @memberof DepGraphLib
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
  
  
  /**
   * @function addWord
   * @desc add a word
   * @param depgraph
   * @param wordData
   * @return {DepGraphWord} a copy of the word added
   * 
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.addWord = function(wordData){
    var position = wordData['#position'] || this.data.words.length;
    this.insertWord(wordData,position);
    return depgraphlib.clone(wordData);
  };
  
  
  /**
   * @function addLink
   * @desc add a link
   * @param depgraph
   * @param d1
   * @param d2
   * @param label
   * @param color
   * @param id
   * @return {DepGraphLink}
   *
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.addLink = function(d1,d2,label,color,id){
    if(color == null){
      color = 'black';
    }
    if(id == null){
      id = this.id++;
    }
    d1 = d1.__data__;
    d2 = d2.__data__;
    var link = new Object();
    link.source = d1.id;
    link.target = d2.id;
    link['#style'] = {'link-color' :color};  
    link.label = label;
    link['#id'] = id;
    this.insertLink(link);
    return link;
  };
  
  /**
   * @function addChunk
   * @param label
   * @param {array.<string>} word_ids - the list of the elements in the chunk or simply the first and last element of the chunk
   * @param sublabels
   * @param color
   * @param id
   * @param custom_id
   * @returns {DepGraphChunk}
   * 
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.addChunk = function(label,word_ids,sublabels,color,id,custom_id){
    if(!label || !word_ids || word_ids.length == 0){
      throw 'Missing required field.';
    }
    id = id || this.id++;
    custom_id = custom_id || id;
    color = color || 'transparent';
    var chunk = {
        label:label,
        sublabels:sublabels,
        elements:word_ids,
        '#style':{
          'background-color':color
        },
        '#id':id,
        id : custom_id,
    };
    this.insertChunk(chunk);
    return chunk;
  };
  
  /**
   * @function getChunkRange
   * @param {DepGraphChunk} chunk
   * @returns {object.<DepGraphWord,DepGraphWord>} the first and last element of the chunk element range
   * @memberof DepGraphLib.DepGraph#
   */
  depgraphlib.DepGraph.prototype.getChunkRange = function(chunk){
    var range = {'firstElement':null,'lastElement':null};
    var min = this.data.graph.words.length;
    var max = 0;
    for(var i = 0 ; i < chunk.elements.length ; i++){
      var word = this.getWordByOriginalId(chunk.elements[i]);
      if(word['#position']<=min){
        range.firstElement = word;
        min = word['#position'];
      }
      if(word['#position']>=max){
        range.lastElement = word;
        max = word['#position'];
      }
    }
    return range;
  };
  
  
}(window.depgraphlib));