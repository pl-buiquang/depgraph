/**
 * @file First include of DepGraphLib, contains declaration of major classes
 * @author Paul Bui-Quang
 */

/**
 * The global namespace of the DepGraphLib Library
 * @namespace DepGraphLib
 */


(function(depgraphlib){
  
  /**
   * @class {object} DepGraph
   * @alias DepGraph
   * 
   * @desc This is the principal class of DepGraphLib.
   * This object handle the graph layout creation from the data and options passed as parameters.
   * 
   * @param {string|Object} container the dom ID or the jQuery selection object that will contain the graph
   * (will be directly passed to the GraphViewer constructor)
   * @param {DepGraphData} json_data the data object defining the graph 
   * @param {object} options the options of the graph
   * @return {object} the instance of the graph
   *
   * @memberof DepGraphLib
   */
  depgraphlib.DepGraph = function (container, json_data, options) {
    this.init(container, json_data, options);
  };
  
  
  /**
   * @class {object} GraphViewer
   * @alias GraphViewer
   * 
   * @desc This object handle the creation of the container layout in which the graph svg will be set in.
   * It is not intended to be constructed outside of the context of DepGraph object creation.
   *
   * @param {string|Object} container the dom ID or the jQuery selection object that will contain the graph
   * @param {string} [uid] an unique identifier
   * @return {Object} the instance of the container of the graph 
   * 
   * @memberof DepGraphLib
   */
  depgraphlib.GraphViewer = function (container,uid){
    this.init(container,uid);
  };
  
  /**
   * @class {object} EditObject
   * @alias EditObject
   * 
   * @desc This object handle the edition operation provided by an {@link EditMode} object
   * 
   * @param {object} depgraph The DepGraph object that will use this editobject
   * @return {object} the instance of the edit object
   * 
   * @memberof DepGraphLib
   * 
   * @see DepGraphLib.EditObject.DefaultMode
   */
  depgraphlib.EditObject = function (depgraph){
    this.init(depgraph);
  };
  
  /**
   * @class {object} Box
   * @alias Box
   * 
   * @desc A generic window box used to display about anything
   * 
   * @param {object} options
   * @return {object} the instance of the box window
   * 
   * @memberof DepGraphLib
   */
  depgraphlib.Box = function(options){
    this.init(options);
  };
    
}(window.depgraphlib = window.depgraphlib || {}));

/**
 * The json format for graph description used to construct the {@link DepGraphLib.DepGraph} class
 * @typedef {Object} DepGraphData
 * @property {DepGraphStyle} [#style=] object style define the global style of the graph. object style definition contain css-like style attributes
 * @property {DepGraphStyle} [#word-style=] object style define words style of the graph. these values can be overriden in word #style attribute definition. 
        object style definition contain css-like style attributes
 * @property {DepGraphStyle} [#link-style=] object style define links style of the graph. these values can be overriden in link #style attribute definition. 
        object style definition contain css-like style attributes
 * @property {DepGraphStyle} [#chunk-style=] object style define chunks style of the graph. these values can be overriden in chunk #style attribute definition. 
        object style definition contain css-like style attributes
 * @property {array.<DepGraphLink>} links array of links definition
 * @property {array.<DepGraphWord>} words array of words definition
 * @property {array.<DepGraphChunk>} chunks array of chunks definition
 * 
 */

/**
 * The object format for style description
 * @typedef {object} DepGraphStyle
 */

/**
 * The format of word in the {@link DepGraphData} object
 * @typedef {object} DepGraphWord
 * @property {string} id the id of the word
 * @property {string} label the label of the word
 * @property {array.<string>} [sublabels] array of sublabels
 * @property {DepGraphStyle} [#style] style object overridding global styles 
 */

/**
 * The format of link in the {@link DepGraphData} object 
 * @typedef {object} DepGraphLink
 * @property {string} source the id of the source word or chunk
 * @property {string} target the id of the target word or chunk
 * @property {string} label the label of the link 
 * @property {DepGraphStyle} [#style] style object overridding global styles 
 */

/**
 * The format of chunk in the {@link DepGraphData} object
 * @typedef {object} DepGraphChunk
 * @property {string} id the id of the chunk
 * @property {array.<string>} elements the array of words id bundled in this chunk
 * @property {string} label the label of the chunk
 * @property {array.<string>} [sublabels] array of sublabels  
 * @property {DepGraphStyle} [#style] style object overridding global styles 
 */

/**
 * The options object that can be passed to the DepGraph constructor
 * @typedef {object} DepGraphOptions
 * @property {string} [uid=] the uid of the graph
 * @property {string} [viewmode] the view mode of the graph. possible values are 'full', 'stretched', 'cropped'
 */

/**
 * Depgraphlib is a set of basic and utils function used by other scripts of DepGraph Library
 * If using requirejs, it define a convenient object containing usefull functions,
 * otherwise, it creates the global namespace that will contain every objects and function of DepGraph Library
 */
(function(depgraphlib){
  
  
  /**
   * @function setAttrPath
   * @desc set a value to a property of an object defined by a path and return the oldvalue
   * @param {object} obj - an javascript object
   * @param {string} path - a path to the property of the object in xpath style format (path is cut by slashes)
   * @param {*} value - the value to set the property to
   *
   * @memberof DepGraphLib
   *
   */
 depgraphlib.setAttrPath = function(obj,path,value){
    var pathComponents = path.split('/');
    var attr = obj;
    for(var k = 0 ; k < pathComponents.length-1; k++){
      var tmp = attr[pathComponents[k]];
      if(!tmp){
        attr[pathComponents[k]] = {};
        tmp = attr[pathComponents[k]];
      }
      attr = tmp;
    }
    var oldVal = depgraphlib.clone(attr[pathComponents[pathComponents.length-1]]);
    attr[pathComponents[pathComponents.length-1]] = value;
    return oldVal;
  };
  
  /**
   * Remove starting '#' of id, if there is one
   * @param {string} the string representing the id
   * @return {string} the clean string
   */
  depgraphlib.getDOMRawId = function(id){
    var cleanID = id;
    if(id.indexOf('#') == 0){
      if(id.length > 1){
        cleanID = id.substring(1);
      }else{
        cleanID = '';
        console.log('warning : returning empty id ( in func: depgraphlib.getDOMRawId)');
      }
    }
    return cleanID;
  };
  
  
  /**
   * Append '#' to DOM id if not present.
   * @param {string} the string representing the id
   * @return {string} the 'jquerized id'
   */
  depgraphlib.jQuerizeID = function(id){
    return (id.indexOf('#') == 0)?id:('#'+id);
  };
  
  
  
  depgraphlib.windowOpenPost = function(data,url){
    depgraphlib.windowOpenPostForm = '<form id="depgraphlibWindowOpenPostForm" method="post" action="'+url+'" target="_blank"></form>';
    var existingForm = jQuery('#depgraphlibWindowOpenPostForm');
    if(!existingForm.length){
      existingForm = jQuery(depgraphlib.windowOpenPostForm);
      jQuery('body').append(existingForm);
    }
    existingForm.html('');
    for(param in data){
      var stringdata = null;
      if(typeof data[param] == 'string'){
        stringdata = data[param];
      }else{
        stringdata = JSON.stringify(data[param]);
      }
      existingForm.append('<input type="hidden" name="'+param+'" value="">');
      existingForm[0][param].value = stringdata;
    }
    document.getElementById('depgraphlibWindowOpenPostForm').submit();
  };
  
  
  /**
   * clone an object
   */
  depgraphlib.clone = function(obj) {
    if (null == obj || "object" != typeof obj)
      return obj;

    if (obj instanceof Date) {
      var copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    if (obj instanceof Array) {
      var copy = [];
      for ( var i = 0, len = obj.length; i < len; i++) {
        copy[i] = depgraphlib.clone(obj[i]);
      }
      return copy;
    }

    if (obj instanceof Object) {
      var copy = {};
      for ( var attr in obj) {
        if (obj.hasOwnProperty(attr))
          copy[attr] = depgraphlib.clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  };
  
  /**
   * Set the position for a d3 selection of an SVGElement
   * @param x
   * @param y
   */
  depgraphlib.setGroupPosition = function(node,x,y){
    node.attr("transform","translate("+x+","+y+")");
  };

  /**
   * center a node in x in reference of an other
   * @param node
   * @param refNode
   */
  depgraphlib.center = function(node,refNode){
    var refbbox = refNode.node().getBBox();
    var bbox = node.node().getBBox();
    console.log(node);
    console.log(refbbox.width);
    console.log(bbox.width);
    node.attr('x',-bbox.width/2+refbbox.width/2);
  };

  /**
   * get the transform value of a  g svg element
   * @param elt
   * @returns {Object}
   */
  depgraphlib.getTransformValues = function (elt){
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
  };

  /**
   * resolve the references in a json object
   * the references are su objects id starting with a refPrefix 
   * (eg. '@15' for a object of id 15 and using '@' as a refPrefix  
   * @param obj
   * @param refPrefix
   */
  depgraphlib.JSONresolveReferences = function (obj,refPrefix){
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

  /**
   * remove the unit 'px' from a string an returns the number as a float number
   * @param value
   * @return {num} the value without unit
   */
  depgraphlib.removeUnit = function (value){
    var regex_px = /(-*)(\d+\.*\d*)px/;
    var match = regex_px.exec(value);
    if(match != null){
      var sign = (match[1].length%2==0)?'':'-';
      value = sign+match[2];
    }
    return parseFloat(value);
  };
  
  /**
   * add multiple arguments (number or string with units) and returns their sum in a string appended by 'px'
   * @returns {String}
   */
  depgraphlib.addPxs = function(){
    var sum = 0;
    for(var i=0; i<arguments.length;i++){
      var arg = depgraphlib.removeUnit(arguments[i]);
      sum += parseInt(arg);
    }
    return sum+'px';
  };

  /************************************************************/
  /**                      Colors                            **/
  /************************************************************/

  depgraphlib.rgbToHex = function(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  depgraphlib.hexToRgb  = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  };

   depgraphlib.rgbToHsl = function(r, g, b){
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
  };

  depgraphlib.hslToRgb = function(h, s, l){
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
  };
  
  
  
}(window.depgraphlib = window.depgraphlib || {}));


(function(depgraphlib){
  
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
   * - draggable : bool, 
   * - position : float,float, 
   * - title : string, # displat a title
   * - closeButton : bool # true display a close button,
   * - autodestroy : bool # destroy the box when click away
   * @param viewer [optional] a viewer to bind the box with
   * @return {depgraphlib.Box}
   */
  depgraphlib.Box.prototype.init = function(options){
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
      if(jQuery.contains( depgraphlib.Box.instances[i].object[0], elt)){
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
  
  
  
  
  
  
  
  
  
  
  
}(window.depgraphlib));
(function(depgraphlib){
  /**
   * @namespace UI
   * 
   * @desc This namespace gather some usefull html ui creation functino
   * 
   * @memberof DepGraphLib
   */
  depgraphlib.ui = {
    
    /**
     * @function addTextField 
     * @param {string} label 
     * @param {object} attrs - Object bundle of pairs of attribute name and value for the input tag
     * @returns {String} the html string of the field
     * 
     * @memberof DepGraphLib.UI
     */
    addTextField : function(label,attrs){
      var field = '<tr><td><label>'+label+'</label></td><td><input type="text" '; 
      for(var name in attrs){
        field += name + '="' + attrs[name] + '" ';
      }
      field += '></td></tr>';
      
      return field;
    },

    /**
     * @function addCustomField 
     * @param {string} label 
     * @param {string} customfield - html string of the custom field
     * @returns {String} the html string of the field
     * 
     * @memberof DepGraphLib.UI
     */
    addCustomField : function(label,customfield){
      var field = '<tr><td><label>'+label+'</label> </td><td>';
      field += customfield;
      field += '</td></tr>';
      return field;
    },
    
    /**
     * @function groupFields
     * @param {string} label
     * @param {object} attrs - Object bundle of pairs of attribute name and value for the input tag
     * @param {string|array.<string>} fields
     * @returns {String} the html string of the field
     * 
     * @memberof DepGraphLib.UI
     */
    groupFields : function(label,attrs,fields){
      var field = '<tr><td><label>'+label+'</label></td><td><table '; 
      for(var name in attrs){
        field += name + '="' + attrs[name] + '" ';
      }
      field += '>';
      if(typeof fields == 'string'){
        field += fields;
      }else if(typeof fields == 'array'){
        for(var i=0;i<fields.length;i++){
          field += fields[i];
        }
      }else{
        throw 'Wrong parameter type for fields in function groupFields'; 
      }
      
      field += '</table></td></tr>';
      
      return field;
    },
    
    
    /**
     * @function simpleColorPicker
     * @desc a simple color picker form
     * @param {string} name - the value of the name attribute of the input
     * @param {string} defaultColor - the color to init the input with
     * @returns {String} the html string of the color picker input
     * @memberof DepGraphLib.UI
     */
    simpleColorPicker : function(name,defaultColor,data_rel){
      var colorPicker = '<table name="simpleColorPicker" data-rel="'+data_rel+'"><tr><td><input type="text" name="'+name+'" value="'+defaultColor+'" onkeydown="jQuery(jQuery(jQuery(this).parent().parent().children()[1]).children()[0]).css(\'background-color\',this.value+String.fromCharCode(event.keyCode));"></td><td><div style="display:inline-block; width:30px; height:30px; background-color:'+defaultColor+';"></div></td></tr></table>';
      return colorPicker;
    },


    /**
     * @function makeTabs 
     * @desc Create tabs from a set of div
     * @param {array.<object.<string,string>>} tabs - array of object (name and content) tabs 
     * @returns {String} the html tabs window
     * @memberof DepGraphLib.UI
     */
    makeTabs : function(tabs){
      var tabmenus = '<div class="depgraphlib-tab-menus">';
      var tabwindows = '<div class="depgraphlib-tab-windows">';
      for(var i=0;i<tabs.length;i++){
        tabmenus += '<div class="depgraphlib-tab-menu" tab-index="'+i+'" onclick="depgraphlib.ui.changetab(this);">' + tabs[i].name + '</div>';
        tabwindows += '<div class="depgraphlib-tab-window">' + tabs[i].content + '</div>';
      }
      tabmenus += '</div>';
      tabwindows += '</div>';
      tabcontent = '<div class="depgraphlib-tabs-content">' + tabs[0].content + '</div>';
      var tab = '<div><div class="depgraphlib-tabs" selected="0">' + tabmenus + tabcontent + tabwindows + '</div></div>';
      return tab;
      
    },
    
    changetab : function(element){
      var i = element.getAttribute('tab-index');
      var parent = element.parentNode.parentNode;
      parent.firstChild.childNodes[parent.getAttribute('selected')].setAttribute('class','depgraphlib-tab-menu');
      parent.setAttribute('selected',i);
      parent.firstChild.childNodes[i].setAttribute('class','depgraphlib-tab-menu depgraphlib-tab-menu-on');
      var newContent = parent.childNodes[2].childNodes[i].cloneNode();
      var oldContent = parent.childNodes[1].firstChild;
      parent.childNodes[1].replaceChild(newContent,oldContent);
    },
    
    
    
    
    
    
  };
  
  
  
  
  
}(window.depgraphlib));
(function(depgraphlib){
  
  
  
}(window.depgraphlib));


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
      this.tooltip.draggable();
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
     * @return {object} the jquery selection of the toolbar button
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
    depgraphlib.GraphViewer.createDropDownMenu = function(name,items,autoslidedown,tooltip){
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

  
}(window.depgraphlib));


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
        var k = 1;
        while(true){
          if(table[k]==null){ // nothing exist at this strate : fill it and break
            table[k]=new Array();
            for(var j=p.min*2;j<p.max*2;j++){
              table[k][j]=link;
            }
            p.strate = k;
            setMaxStrate(k);
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
            if(this.crossed(link,crossing)){ // real crossing
              k=-1;
              while(true){
                if(table[k]==null){ // nothing exist at this strate : fill it and break
                  table[k]=new Array();
                  for(var j=p.min*2;j<p.max*2;j++){ // fill in the strate
                    table[k][j]=link;
                  }
                  p.strate = k; // set the strate
                  setMaxStrate(k);
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
                  setMaxStrate(k);
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
        if(depgraphlib.getNodePosition(properties.nodeStart)<depgraphlib.getNodePosition(properties.nodeEnd)){
          properties.min = depgraphlib.getNodePosition(properties.nodeStart);
          properties.max = depgraphlib.getNodePosition(properties.nodeEnd);
          properties.hdir = 1;
        }else{
          properties.max = depgraphlib.getNodePosition(properties.nodeStart);
          properties.min = depgraphlib.getNodePosition(properties.nodeEnd);
          properties.hdir = -1;
        }
        properties.vdir = 1; // oriented top
        properties.offsetXmax = 0;
        properties.offsetXmin = 0;
        properties.strate = 0;
        properties.length = properties.max-properties.min;
        if(!properties.nodeStart){ // for orign arc to be processed first in anti crossing algo
          properties.length = 0;
        }
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
    };

    /**
     * Switch on or off the highlight on mouseover (link and words)
     */
    depgraphlib.DepGraph.prototype.autoHighLightOnMouseOver = function(value){
      if(value==null || value){
        this.vis.selectAll('g.link').on("mouseover.autohighlight",function(){depgraphlib.DepGraph.highlightLink(this, true); });
        this.vis.selectAll('g.link').on("mouseout.autohighlight",function(){depgraphlib.DepGraph.highlightLink(this, false); });
        this.vis.selectAll('g.word').on("mouseover.autohighlight",function(){depgraphlib.DepGraph.highlightWord(this, true); });
        this.vis.selectAll('g.word').on("mouseout.autohighlight",function(){depgraphlib.DepGraph.highlightWord(this, false); });
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
      this.editObject.editModeInit();
    };

    /**
     * Clean added data (used for graph svg layout creation)
     * TODO(paul) clean other added data (#id)
     */
    depgraphlib.DepGraph.prototype.cleanData = function(){
      var links = this.vis.selectAll("g.link");
      this.resetLinksProperties(links);
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

    /**
     * Set the view mode (full | strechted | cropped)
     * Apply viewer mode and add scrollbar or proper scale if necessary
     * 
     * For values in %, make sure that the container wrapping the viewer is displayed as block and a size is set.
     */
    depgraphlib.DepGraph.prototype.setViewMode = function(){
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
    depgraphlib.DepGraph.prototype.createScrollBar = function(){
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
          var depgraph = depgraphlib.DepGraph.getInstance(this);
          depgraphlib.DepGraph.depgraphActive = '-' + depgraph.viewer.uid;
          depgraph.scrollMouseSelected = d3.event.clientX;
          d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
        });
        
        /*
        d3.select(this.viewer.chart[0]).on('mouseover',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(d3.event.originalTarget);
          depgraph.setFullViewMode();
        });
        
        d3.select(this.viewer.chart[0]).on('mouseout',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(d3.event.originalTarget);
          depgraph.setViewMode();
        });*/

        
        d3.select(document).on('click.focus',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(d3.event.originalTarget);
          if(depgraph){
            depgraphlib.DepGraph.depgraphActive = '-' + depgraph.viewer.uid;
          }else{
            depgraphlib.DepGraph.depgraphActive = null;
          }
        });
        
        d3.select(document).on('wheel.scrollbar',function(e){
          var depgraph = depgraphlib.DepGraph.getInstance(depgraphlib.DepGraph.depgraphActive);
          if(depgraph && depgraph.scrollbar){
            depgraph.translateGraph(3*d3.event.deltaY,0);
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
          }
        }
      });
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
      this.data.graph.chunks.splice(index,1);
      this.update();
      this.postProcesses();
      return true;
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
          sublabel
          .text(d.sublabel[i])
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
          var me = depgraphlib.DepGraph.getInstance(node);
          var middle = Math.floor(node.__data__['elements'].length/2);
          var middleNode = me.getWordNodeByOriginalId(node.__data__['elements'][middle]);
          return middleNode.__data__['#position'];
        }
      }else{
        return -1;
      }
    };

  
}(window.depgraphlib));



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
    this.editObject.editModeInit();
    this.autoHighLightOnMouseOver();
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
    this.editObject.editModeInit();
    this.autoHighLightOnMouseOver();
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
    color = color || 'black';
    var chunk = {
        label:label,
        sublabels:sublabels,
        elements:word_ids,
        '#style':{
          color:color
        },
        '#id':id,
        id : custom_id,
    };
    this.insertChunk(chunk);
    this.editObject.editModeInit();
    this.autoHighLightOnMouseOver();
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
(function(depgraphlib){
  /**
   * @namespace DefaultModeLib
   * 
   * @desc the default edit mode function library.
   * 
   * @memberof DepGraphLib.EditObject
   */
  depgraphlib.EditObject.DefaultModeLib = {
  
      /**
       * @function save
       * @desc on save callback for default mode (implemented for mgwiki).
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      save : function(depgraph){
        depgraph.cleanData();
        jQuery.ajax({
          type: 'POST', 
          url: depgraph.wsurl,
          data: {
            action:'save',
            format:depgraph.dataFormat,
            options: '',
            data:depgraph.data,
            uid:depgraph.options.uid
          },
          dataType : 'json',
          success: function(data, textStatus, jqXHR) {
            depgraph.editObject.lastSavedPtr = depgraph.editObject.currentPtr;
            depgraph.editObject.needToSaveState = false;
            depgraph.editObject.updateSaveState();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
          }
        });
      },
      
      
      
      /**
       * @function addLinkClick
       * @desc on word click callback for default edit mode
       * add a link if a previous selection was a word,
       * select a word otherwise
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {object.<object,number>} params - the graph data of the selected link and its index
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addLinkClick : function(depgraph,params){
        if(depgraph.editObject.previousSelectedObject == null || depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
          depgraphlib.EditObject.DefaultModeLib.selectObject.call(this,depgraph,params);
        }
        else{
          if(this.__data__['#id'] == depgraph.editObject.previousSelectedObject.__data__['#id']){ // don't create link when selecting twice the same node
            depgraph.editObject.clearSelection();
            return;
          }
          depgraphlib.EditObject.DefaultModeLib.addChunkSettings(depgraph,depgraph.editObject.previousSelectedObject,this,params);
        }
      },
      
      /**
       * @function selectObject
       * @desc select an object node word, link or chunk
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {object.<object,number>} params - the graph data of the selected link and its index
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      selectObject : function(depgraph,params){
        if(depgraph.editObject.highlightMode){
          var value = !depgraphlib.isObjectPermanentHighlighted(this);
          depgraphlib.DepGraph.highlightObject(this,value,true);
          depgraph.editObject.setNeedToSave();
          return;
        }
        depgraph.editObject.selectObject(this);
      },
      
      /**
       * @function editKeyDownDefault
       * @desc key down handler callback for the default edit mode
       * @param depgraph
       * @param params
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      editKeyDownDefault  : function(depgraph,params){
        if(params.keyCode == 46){
          if(depgraph.editObject.previousSelectedObject!= null){
            if(depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
              var link = depgraphlib.clone(depgraph.editObject.previousSelectedObject);
              link.color = depgraphlib.getStyleElement(depgraph.editObject.previousSelectedObject,'link-color','black');
              var success = removeLink(depgraph, depgraph.editObject.previousSelectedObject.__data__['#id']);
              depgraph.editObject.previousSelectedObject = null;
              if(success){
                return {baseAction:'linkRemoval',link:link};
              }
            }else if(depgraphlib.isAWord(depgraph.editObject.previousSelectedObject)){
              var word = depgraphlib.clone(depgraph.editObject.previousSelectedObject.__data__);
              var affectedLinks = removeWord(depgraph,depgraph.editObject.previousSelectedObject.__data__['#id']);
              depgraph.editObject.previousSelectedObject = null;
              return {baseAction:'wordRemoval',word:word,affectedLinks:affectedLinks};
            }
          }
        }

      },
      
      
      /**
       * @function defaultUndo
       * @desc undo callback for the default edit mode
       * @param depgraph
       * @param rollbackdata
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      defaultUndo : function(depgraph,rollbackdata){
        if(rollbackdata.baseAction == 'linkRemoval'){
          var link = rollbackdata.link;
          var source = depgraph.getWordNodeByOriginalId(link.__data__['source']);
          var target = depgraph.getWordNodeByOriginalId(link.__data__['target']);
          depgraph.addLink(source,target,link.__data__.label,link.color,link.__data__['#id']);
        }else if(rollbackdata.baseAction == 'linkAddition'){
          removeLink(depgraph,rollbackdata.addedLink['#id']);
        }else if(rollbackdata.baseAction == 'wordAddition'){
          removeWord(depgraph,rollbackdata.addedWord['#id']);
        }else if(rollbackdata.baseAction == 'wordRemoval'){
          var word = rollbackdata.word;
          depgraph.addWord(word);
          if(rollbackdata.affectedLinks!=null){
            for(var i=0;i<rollbackdata.affectedLinks.length;i++){
              var link = rollbackdata.affectedLinks[i];
              var source = depgraph.getWordNodeByOriginalId(link['source']);
              var target = depgraph.getWordNodeByOriginalId(link['target']);
              link.color = link['#style']['link-color']?link['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];
              depgraph.addLink(source,target,link.label,link.color,link['#id']);
            }
          }
        }else if(rollbackdata.baseAction == 'changeAttr'){
          var id = rollbackdata.obj['#id'];
          var obj = depgraph.getObjectById(id);
          depgraph.editObject.changeAttributes(obj,rollbackdata.oldAttrs);
          depgraph.update();
          depgraph.postProcesses();
        }
      },

      /**
       * @function defaultRedo
       * @desc redo callback for the default edit mode
       * TODO(paul) implement this
       * @param depgraph
       * @param actionData
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       defaultRedo : function(depgraph,actionData){
      },

      
      /**
       * @function addNewWord
       * @param depgraph
       * @param obj
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addNewWord : function(depgraph,obj){
        var coords = depgraph.viewer.screenCoordsForElt(obj[0]);
        var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
        var div = jQuery(depgraphlib.EditObject.DefaultModeLib.addWordPanel(depgraph));
        
        depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
      },
      
      /**
       * @function showEditPanel
       * @desc show edit properties panel for an object node (word, link or chunk)
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param obj
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      showEditPanel : function(depgraph,obj){
        var coords = depgraph.viewer.screenCoordsForElt(obj[0]);
        var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
        var div = depgraphlib.EditObject.DefaultModeLib.createEditPanel(depgraph,obj[0]);
        depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
      },
      

      /**
       * @function createEditPanel
       * @desc create the form allowing edition of properties of an object (word, link or chunk)
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {object} obj - the d3js node element
       * @return {object} a jquery selection of an edition panel
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       createEditPanel : function(depgraph,obj){
        var data = obj.__data__;
        var klass = '';
        if(obj.classList != null && obj.classList.length > 0){
          klass = obj.classList[0];
        }
        
        var tab0 = '<div><h3>HelloWorld</h3></div>';

        var div = '<div><div id="'+depgraph.viewer.appendOwnID(klass+'-save-properties-div')+'" onkeydown="if (event.keyCode == 13) {depgraphlib.EditObject.DefaultModeLib.saveProperties.call(this,arguments);}">'
          +'<h3 id="edit-info-title">Edit '+klass+' (original id: '+data.id+')</h3>'
          +'<table class="main-properties-table" ref="'+data['#id']+'">';
        
        if(klass == 'word'){
          div = depgraphlib.EditObject.DefaultModeLib.populateWordEditPanel(depgraph,div,data);
        }else if(klass == 'link'){
          div = depgraphlib.EditObject.DefaultModeLib.populateLinkEditPanel(depgraph,div,data);
        }else if(klass == 'chunk'){
          div = depgraphlib.EditObject.DefaultModeLib.populateChunkEditPanel(depgraph,div,data);
        }else{
          throw 'unknown object type : "' + klass + '"';
        }
        
        div += '</table>';
        div += '<input id="'+depgraph.viewer.appendOwnID(klass+'-save-properties')+'" type="button" value="Save" onclick="depgraphlib.EditObject.DefaultModeLib.saveProperties.call(this,arguments);">';
        div += '</div></div>';
        
        div = depgraphlib.ui.makeTabs([{'name':'firsTab','content':tab0},{'name':'secondTab','content':div}]);
        
        var jdiv = jQuery(div);
        return jdiv;
      },

      /**
       * @function populateLinkEditPanel
       * @desc fill in the edit properties panel for a link object
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {string} editDiv - the html string that will become a panel
       * @param {DepGraphLink} linkData - the link
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       populateLinkEditPanel : function(depgraph,editDiv,linkData){
        var color = (linkData['#style']!= null && linkData['#style']['link-color']!=null)?linkData['#style']['link-color']:depgraph.data.graph['#link-style']['link-color'];
        
        editDiv += depgraphlib.ui.addTextField('label',{name:'label',value:linkData.label,'data-rel':label});
        editDiv += depgraphlib.ui.addCustomField('source',depgraphlib.EditObject.DefaultModeLib.getOptionsListWords(depgraph,linkData.source,'source'));
        editDiv += depgraphlib.ui.addCustomField('target',depgraphlib.EditObject.DefaultModeLib.getOptionsListWords(depgraph,linkData.target,'target'));
        editDiv += depgraphlib.ui.addCustomField('color',depgraphlib.ui.simpleColorPicker('colorPicker',color,'#style/link-color'));
        return editDiv;
      },
      
      /**
       * @function populateWordEditPanel
       * @desc fill in the edit properties panel for a word object 
       * @param {DepGraphLib.Depgraph} depgraph - the graph object
       * @param {string} editDiv - the html string that will become a panel
       * @param {DepGraphWord} wordData - the word
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
       populateWordEditPanel : function(depgraph,editDiv,wordData){
        var dataModel = depgraph.editObject.dataModel;
        if(!dataModel.words){
          dataModel.words = [];
          dataModel.words[0] = {name:'label'};
          for(var i =0 ; wordData.sublabel &&  i< wordData.sublabel.length ; i++){
            dataModel.words[i+1] = {name: 'sublabel'+i};
          }
        }
        
        editDiv += depgraphlib.ui.addTextField(dataModel.words[0].name,{
          'id' : 'word-edit-' + dataModel.words[0].name,
          'data-rel':'label',
          'name':dataModel.words[0].name,
          'value':wordData.label,
        }); 
    /*    if(dataModel.words[0].values){
          $(document).ready(function(){
            $("#word-edit-" + dataModel.words[0].name).autocomplete({source: dataModel.words[0].values});}
          );
        }*/
        var sublabel_index = 0;
        for(var i=1;i<dataModel.words.length ; i++){
          var value;
          var data_rel;
          if(dataModel.words[i].hidden){
            value = (wordData['#data'])?wordData['#data'][dataModel.words[i].name]:'';
            data_rel = '#data/'+dataModel.words[i].name;
          }else{
            value = wordData.sublabel[sublabel_index];
            data_rel = 'sublabel/'+sublabel_index;
            sublabel_index++;
          }
          editDiv += depgraphlib.ui.addTextField(dataModel.words[i].name,{
            'id' : 'word-edit-' + dataModel.words[i].name,
            'data-rel':data_rel,
            'name':dataModel.words[i].name,
            'value':value,
          });
        }
        return editDiv;
      },


      populateChunkEditPanel : function (depgraph,editDiv,chunkData){
        var dataModel = depgraph.editObject.dataModel;
        if(!dataModel.chunks){
          dataModel.chunks = [];
          dataModel.chunks[0] = {name:'label'};
          for(var i =0 ; chunkData.sublabel && i< chunkData.sublabel.length ; i++){
            dataModel.chunks[i+1] = {name: 'sublabel'+i};
          }
        }
        
        editDiv += depgraphlib.ui.addTextField(dataModel.chunks[0].name,{
          'id' : 'chunk-edit-' + dataModel.chunks[0].name,
          'data-rel':'label',
          'name':dataModel.chunks[0].name,
          'value':chunkData.label,
        });
        
        var chunkRange = depgraph.getChunkRange(chunkData);
        var chunkRangeField = depgraphlib.ui.addCustomField('first element',depgraphlib.EditObject.DefaultModeLib.getOptionsListWords(depgraph,chunkRange.firstElement.id,'first-element'));
        chunkRangeField += depgraphlib.ui.addCustomField('last element',depgraphlib.EditObject.DefaultModeLib.getOptionsListWords(depgraph,chunkRange.lastElement.id,'last-element'));
        editDiv += depgraphlib.ui.groupFields('Elements Range',{'name':'chunkRange','data-rel':'elements'},chunkRangeField);
        
        var bgcolor = (chunkData['#style'] && chunkData['#style']['background-color'])?chunkData['#style']['background-color']:depgraph.data.graph['#chunk-style']['background-color'];
        editDiv += depgraphlib.ui.addCustomField('color',depgraphlib.ui.simpleColorPicker('colorPicker',bgcolor,'#style/background-color'));

    /*    if(dataModel.words[0].values){
          $(document).ready(function(){
            $("#word-edit-" + dataModel.words[0].name).autocomplete({source: dataModel.words[0].values});}
          );
        }*/
        var sublabel_index = 0;
        for(var i=1;i<dataModel.chunks.length ; i++){
          var value;
          var data_rel;
          if(dataModel.chunks[i].hidden){
            value = (wordData['#data'])?chunkData['#data'][dataModel.chunks[i].name]:'';
            data_rel = '#data/'+dataModel.chunks[i].name;
          }else{
            value = chunkData.sublabel[sublabel_index];
            data_rel = 'sublabel/'+sublabel_index;
            sublabel_index++;
          }
          editDiv += depgraphlib.ui.addTextField(dataModel.chunks[i].name,{
            'id' : 'chunk-edit-' + dataModel.chunks[i].name,
            'data-rel':data_rel,
            'name':dataModel.chunks[i].name,
            'value':value,
          });
        }
        return editDiv;
      },






      /**
       * @function saveProperties
       * 
       * @desc save the properties entered in the edit properties panel of an object
       * update the graph
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      saveProperties : function(){
        var depgraph = depgraphlib.DepGraph.getInstance(this);
        var form = jQuery(this).parent().find('table.main-properties-table');
        var obj = depgraph.getObjectById(form.attr('ref'));
        var rows = form[0].rows;
        var attrs = [];
        for(var i = 0 ; i < rows.length ; i++){
          var tr = rows[i];
          var cells = tr.cells;
          //var label = cells[0].firstChild.innerHTML;
          var value_form = cells[1].firstChild;
          var value;
          var path;
          var inputType = value_form.nodeName.toUpperCase();
          if(!value_form.getAttribute('data-rel')){
            throw 'missing attribute data-rel in edit form';
          }else{
            path = value_form.getAttribute('data-rel');
          }
          if(inputType == 'SELECT'){
            value = value_form.options[value_form.options.selectedIndex].value;
          }else if(inputType == 'INPUT'){
            value = value_form.value;
          }else {
            if(value_form.getAttribute('name') == 'simpleColorPicker'){
              value = value_form.firstChild.rows[0].cells[0].firstChild.value;
            }else if(value_form.getAttribute('name') == 'chunkRange'){
              var i1 = value_form.firstChild.rows[0].cells[1].firstChild.options.selectedIndex;
              var firstElement = value_form.firstChild.rows[0].cells[1].firstChild.options[i1].value;
              var i2 = value_form.firstChild.rows[1].cells[1].firstChild.options.selectedIndex;
              var lastElement = value_form.firstChild.rows[1].cells[1].firstChild.options[i2].value;
              value = [firstElement,lastElement];
            }
            else{
              throw 'unknown form element';
            }
          }
          attrs.push({path:path,value:value});
        }
        depgraph.editObject.changeAttributes(obj,attrs,true);
        depgraph.update();
        depgraph.postProcesses();
        var box = depgraphlib.Box.getBox(this);
        box.destroy();
      },
      
 

      /**
       * @function addChunkSettings
       * @param depgraph
       * @param obj1
       * @param obj2
       * @param params
       * 
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addChunkSettings : function(depgraph,obj1,obj2,params){
        var coords = depgraph.viewer.screenCoordsForElt(obj2);
        var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
        var div = '<div><table style="margin:5px 0px 0px 0px;">';
        div += depgraphlib.ui.addTextField('Chunk name :',{
          name:'chunk-name',
          'data-ref':'label',
        });
        div += '<tr><td colspant="2"><input id="chunk-settings'+depgraph.viewer.appendOwnID('')+'"  type="button" style="margin:0" value="Create Link"></td></tr>';
        div +='</table></div>';
        div = jQuery(div);
        
        var box = depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
        
        depgraph.editObject.clearSelection();
        
        jQuery('#chunk-settings'+depgraph.viewer.appendOwnID('')).click(function(){
          var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
          var chunk = depgraph.addChunk(value,[obj1.__data__.id,obj2.__data__.id]);
          var action = {baseAction:'chunkAddition',addedChunk:chunk};
          depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordSelect',params:params}});
          box.destroy();
        });
        
        
      },
      
      /**
       * @function getOptionsListWords
       * @desc return a form of list of words
       * @param depgraph
       * @param selectedOriginalId
       * @returns {String}
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      getOptionsListWords : function(depgraph,selectedOriginalId,data_rel){
        var optionList = '<select data-rel="'+data_rel+'">';
        for(var i=0;i<depgraph.data.graph.words.length;i++){
          var wordData = depgraph.data.graph.words[i];
          optionList += '<option value="'+wordData.id+'" ';
          optionList += ((wordData.id==selectedOriginalId)?'selected="true"':'');
          optionList += '>#' + wordData['#position'] + ' ' + wordData['label'] + ' (' + wordData.id +')';
          optionList += '</option>';
        }
        optionList += '</select>';
        
        return optionList;
      },
      
      /**
       * @function getOptionsPosition
       * @desc return a form of list of position for a newly added word
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      getOptionsPosition : function(depgraph,data_rel){
        var optionList = '<select data-rel="'+data_rel+'">';
        for(var i=0;i<depgraph.data.graph.words.length+1;i++){
          var wordData = (i>0 && i<depgraph.data.graph.words.length+1)?depgraph.data.graph.words[i-1]:{label:'^'};
          var nextWordData = (i<depgraph.data.graph.words.length)?depgraph.data.graph.words[i]:{label:'$'};
          optionList += '<option value="'+i+'" ';
          optionList += '>#' + i + ' (' + wordData['label'] + ' x ' + nextWordData['label'] +')';
          optionList += '</option>';
        }
        optionList += '</select>';
        
        return optionList;
      },
      
      /**
       * @function addWordPanel
       * @desc create a panel to add a new word
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addWordPanel : function(depgraph){
        var html = '';
        html += '<div><h3>Add a new word</h3>';
        html += '<table><tr>';
        html += '<td><label>Label</label></td>';
        html += '<td><input type="text" name="label"></td></tr>';
        html += '<tr><td><label>Sublabels (separated by commas, use \\, for commas)</label></td>';
        html += '<td><input type="text" name="sublabels"></td></tr>';
        html += '<tr><td><label>Position</label></td>';
        html += '<td>'+depgraphlib.EditObject.DefaultModeLib.getOptionsPosition(depgraph,'#position')+'</td></tr>';
        html += '</table></div>';
        return html;
      },
      

      /**
       * @function addLinkSettings
       * @desc open a link creation panel
       * @param depgraph
       * @param obj1
       * @param obj2
       * @param params
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addLinkSettings : function(depgraph,obj1,obj2,params){
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
        
        var box = depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);
        
        depgraph.editObject.clearSelection();
        
        jQuery('#link-settings'+depgraph.viewer.appendOwnID('')).click(function(){
          var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
          var color = this.parentNode.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0].value;
          var link = depgraph.addLink(obj1,obj2,value,color);
          var action = {baseAction:'linkAddition',addedLink:link};
          depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordSelect',params:params}});
          box.destroy();
        });
        
      },

      

      /**
       * @function addWordSettings
       * @desc open a word creation panel
       * @param depgraph
       * @param element
       * @param offset
       *
       * @memberof DepGraphLib.EditObject.DefaultModeLib
       */
      addWordSettings : function(depgraph,element,offset){
        var coords = depgraph.viewer.screenCoordsForElt(element);
        var point = {x:(coords.ne.x + coords.nw.x)/2,y:coords.nw.y};
        var div = '<div><table style="margin:5px 0px 0px 0px;">'
          + '<tr><td>Word label : </td>'
          +'<td><input type="text" name="word-label" value=""></td></tr>'
        +'<tr><td colspant="2"><input id="word-settings'+depgraph.viewer.appendOwnID('')+'"  type="button" style="margin:0" value="Insert Word"></td></tr>'
        +'</table></div>';
        div = jQuery(div);
        var box = depgraph.viewer.createBox({closeButton:true,draggable:true}).setContent(div).open(point);

        depgraph.editObject.clearSelection();
        
        jQuery('#word-settings'+depgraph.viewer.appendOwnID('')).click(function(){
          var value = this.parentNode.parentNode.parentNode.childNodes[0].childNodes[1].childNodes[0].value;
          if(value==null || value ==''){
            alert('you must fill all required fields');
            return;
          }
          var wordData = {label:value,sublabel:[],'#position':element.__data__['#position']+offset};
          var word = depgraph.addWord(wordData);
          var action = {baseAction:'wordAddition',addedWord:word};
          depgraph.editObject.pushAction({mode:depgraph.editObject.editMode,rollbackdata:action,data:{event:'onWordContext',params:element}});
          box.destroy();
        });
        
      },

     
      
  };
  
  
}(window.depgraphlib));
(function(depgraphlib){
  /**
   * @namespace DefaultMode
   * 
   * @desc default edit mode.
   * This default edit mode shows how to implement an edit mode.
   * 
   * @memberof DepGraphLib.EditObject
   */
  depgraphlib.EditObject.DefaultMode = {
      /**
       * @member {string} name
       * @desc [REQUIRED] the name of the mode
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      name : 'default',
      /**
       * @member {function} name
       * @desc called when the edit mode starts
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onInit : null,
      /**
       * @member {DepGraphLib.EditObject~objectselect} onWordSelect
       * @desc called when a word is clicked
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onWordSelect : depgraphlib.EditObject.DefaultModeLib.addLinkClick,
      /**
       * @member {DepGraphLib.EditObject~objectselect} onLinkSelect
       * @desc called when a link is clicked
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onLinkSelect : depgraphlib.EditObject.DefaultModeLib.selectObject,
      /**
       * @member {DepGraphLib.EditObject~objectselect} onChunkSelect
       * @desc called when a chunk is clicked
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onChunkSelect : depgraphlib.EditObject.DefaultModeLib.selectObject,
      /**
       * @member {object} onWordContext
       * @desc object of callback list used in the context menu of a word
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onGlobalContext : null,
      /**
       * @member {object} onWordContext
       * @desc object of callback list used in the context menu of a word
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onWordContext : {
        'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
          depgraphlib.EditObject.DefaultModeLib.showEditPanel(depgraph,element);
        },
        'Add Node to the left':function(depgraph,element){
          depgraphlib.EditObject.DefaultModeLib.addWordSettings(depgraph,element[0],0);
        },
        'Add Node to the right':function(depgraph,element){
          depgraphlib.EditObject.DefaultModeLib.addWordSettings(depgraph,element[0],1);
        },
        'Delete':function(depgraph,element){
          var word = depgraphlib.clone(element[0].__data__);
          var affectedLinks = depgraph.removeWord(element[0].__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          return {baseAction:'wordRemoval',word:word,affectedLinks:affectedLinks};
        }
      },
      /**
       * @member {object} onLinkContext
       * @desc object of callback list used in the context menu of a link
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onLinkContext : {
        'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
          depgraphlib.EditObject.DefaultModeLib.showEditPanel(depgraph,element);
        },
        'Delete' : function(depgraph,element){
          var link = depgraphlib.clone(element[0]);
          link.color = depgraphlib.getStyleElement(element[0],'link-color','black');
          var success = depgraph.removeLink(element[0].__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          if(success){
            return {baseAction:'linkRemoval',link:link};
          }
        }
      },
      /**
       * @member {object} onChunkContext
       * @desc object of callback list used in the context menu of a chunk
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onChunkContext : {
        'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
          depgraphlib.EditObject.DefaultModeLib.showEditPanel(depgraph,element);
        },
        'Delete' : function(depgraph,element){
          var chunk = depgraphlib.clone(element[0]);
          var success = depgraph.removeChunk(element[0].__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          if(success){
            return {baseAction:'chunkRemoval',chunk:chunk};
          }
        }
      },
      /**
       * @member {function} keyHandler
       * @desc handle any key pressed when editing.
       * (params of the callback are the current graph and an object that contains the keypressed event)
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      keyHandler : depgraphlib.EditObject.DefaultModeLib.editKeyDownDefault,
      /**
       * @member {function} save
       * @desc save the graph
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      save : null,
      /**
       * @member {function} undo
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      undo:depgraphlib.EditObject.DefaultModeLib.defaultUndo,
      /**
       * @member {function} redo
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      redo:null,
  };
  
}(window.depgraphlib));
/************************************************************/
/**                      Edition                           **/
/************************************************************/

/**
 * EditMode objects are bundles of callbacks used in edit mode.
 * @desc For more information see {@link DepGraphLib.EditObject.DefaultMode}
 * @typedef EditMode
 * 
 */

(function(depgraphlib){

      /**
       * @function init
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.init = function (depgraph){
        this.depgraph = depgraph; // reference to the graph
        
        this.editMode = false; // on/off boolean for edition
        this.mode = [];
        this.highlightMode = false;
        this.dataModel = {};
        
        this.previousSelectedObject = null; // last selected object
        this.actionsLog = []; // action log for rollback purposes
        this.currentPtr = -1; // pointer to the log if undo commands have been used
        this.lastSavedPtr = -1;
        
        this.addEditMode(depgraphlib.EditObject.DefaultMode);
      };
      
      /**
       * @function setDataModel
       * @desc
       * Set a data model to the edit object.
       * 
       * The data model must be an object with one or all of the following properties arrays :
       * - links
       * - words
       * - chunks
       * Each of these arrays (except links which is an array containing exactly 1 element) contains
       * objects that define labels model as following :
       * - name : name of the label
       * - values : (optional) array of possible values for label
       * - value-restrict : (optional, default false) boolean indicating if the user input is restricted to defined possible values
       * - onchange : (optional) user callback called after user submitted new value to this label field
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.setDataModel = function(dataModel){
        this.dataModel = dataModel;
      };

      /**
       * @function dataChanged
       * @desc returns true if data is different from original 
       * difference is computed by watching if edit actions has been logged
       * and if the current pointer on the action is equal to the pointer of the last saved state
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.dataChanged = function(){
        if(this.needToSaveState){
          return true;
        }
        if(this.actionsLog.length == 0){
          return false;
        }
        else{
          if(this.currentPtr != this.lastSavedPtr){
            return true;
          }else{
            return false;
          }
        }
      };

      /**
       * @function addEditMode
       * @desc add an edit mode
       * @param {object} mode - an edit mode
       * @see DepGraphLib.EditObject.DefaultMode
       * @memberof DepGraphLib.EditMode#
       */
      depgraphlib.EditObject.prototype.addEditMode = function(mode){
        this.mode[mode.name] = mode;
      };

      /**
       * @function setEditMode
       * @desc Enable or disable an edit mode.
       * @param {string} value - the name of an editmode defined in a editmode object
       * that was previously added (see {@link DepGraphLib.EditMode#addEditMode})
       * @memberof DepGraphLib.EditMode#
       */
      depgraphlib.EditObject.prototype.setEditMode = function(value){
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
        this.needToSaveState = false;
        
        if(value){
          window.onbeforeunload = function (e) {
            
            if(!me.dataChanged()){
              return;
            }
            
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
        this.editModeInit();
        this.initToolbar();
        
      };

      /**
       * @function initToolbar
       * @desc init the toolbar with the current edit mode
       * @memberof DepGraphLib.EditMode#
       */
      depgraphlib.EditObject.prototype.initToolbar = function(){
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
        
        /**
         * switch on/off the sub edit mode : highlight mode
         */
        function highlightmode(){
          var me = depgraph.editObject;
          me.highlightMode = !me.highlightMode;
          if(me.highlightMode){
            me.clearSelection();
            depgraph.viewer.getToolbarButton('highlight').removeClass('tab').addClass('tab_on');
          }else{
            depgraph.viewer.getToolbarButton('highlight').removeClass('tab_on').addClass('tab');
          }
        }
        
        /**
         * call the current editmode save callback
         */
        function save(){
          var me = depgraph.editObject;
          if(me.mode[me.editMode].save != null){
            me.mode[me.editMode].save(depgraph);
          }
        }
        
        /**
         * call the current editmode undo callback
         */
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
        
        /**
         * call the current editmode redo callback
         */
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
          div += 'Export Format : '
            + '<select name="type">'
          +'<option value="png">png</option>'
          +'<option value="json" selected>json</option>'
          +'<option value="depxml">depxml</option>'
          +'<option value="dep2pict">dep2pict</option>'
          +'<option value="conll">conll</option>'
          +'</select><br/>'
          +'<input id="export-data'+depgraph.viewer.appendOwnID('')+'"  type="button" value="Export"></div>';
          div = jQuery(div);
          var box = depgraph.viewer.createBox({closeButton:true,autodestroy:true});
          box.setContent(jQuery(div));
          jQuery('#export-data'+depgraph.viewer.appendOwnID('')).click(function(){
            var select = jQuery('select',this.parentNode);
            var format = select[0].options[select[0].selectedIndex].value;
            if(format == 'png'){
              exportPng();
            }else{
              //TODO(paul) : send raw parameter if not in custom edit mode
              depgraph.cleanData();
              depgraphlib.windowOpenPost(
                  {'action':'export',
                    'data':depgraph.data,
                    'source_format':'json',
                    'target_format':format},
                  depgraph.wsurl);
//              window.open('edit/export/'+format);
            }
            box.destroy();
          });
          
          box.open(point);
        }
        
        function exportPng(){
          d3.select('rect.export_bg').attr('width','100%').attr('height','100%');
          var svgBBox = depgraph.svg.node().getBBox();
          depgraph.svg.attr('width',svgBBox.width);
          depgraph.svg.attr('height',svgBBox.height);
          var svg_xml = (new XMLSerializer).serializeToString(depgraph.svg.node());

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
              depgraph.wsurl);
          
          d3.select('rect.export_bg').attr('width','0').attr('height','0');
        };

      };

      /**
       * @function setNeedToSave
       * @desc set the need the save icon to display a unsaved state
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.setNeedToSave = function(){
        this.needToSaveState = true;
        this.updateSaveState();
      };

      /**
       * @function updateSaveState
       * @desc
       * update the save state depending on the last saved pointer and the current pointer in the actions log
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.updateSaveState =function(){
        if(this.lastSavedPtr == this.currentPtr && !this.needToSaveState){
          this.depgraph.viewer.getToolbarButton('save').removeClass('save').addClass('saved');
        }else{
          this.depgraph.viewer.getToolbarButton('save').removeClass('saved').addClass('save');
        }
      };
      
      /**
       * @function editModeInit
       * @desc
       * init the edit object according to the current edit mode
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.editModeInit = function(){
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
        if(this.mode[this.editMode].onGlobalContext != null){
          var def = {};
          for(menu in this.mode[this.editMode].onGlobalContext){
            def[menu] = {
              menu : menu,
              click: function(element) {  // element is the jquery obj clicked on when context menu launched
                onContextClick('onGlobalContext',this,element);
              },
              klass: "menu-item-1" // a custom css class for this menu item (usable for styling)
            };
          }
          jQuery(this.depgraph.svg.node()).contextMenu('main-menu',def);
        }

        
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


      /**
       * @function pushAction
       * @desc push an action to the action log
       * the action must contain sufficient information for the undo/redo callback of the edit mode to
       * perform rollback actions
       * if the rollbackdata isn't set, the action won't be registered
       * @param {object} action
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.pushAction = function(action){
        if(action.rollbackdata != null && this.mode[action.mode].undo != null){
          this.depgraph.viewer.getToolbarButton('redo').hide();
          var button = this.depgraph.viewer.getToolbarButton('undo');
          button.show(); // TODO not to do everytime!
          this.actionsLog.splice(++this.currentPtr,this.actionsLog.length-this.currentPtr,action);
          this.updateSaveState();
        }
      };

      /**
       * @function clearSelection
       * @desc clear current selection
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.clearSelection = function(){
        if(this.previousSelectedObject != null){
          try {
            this.previousSelectedObject.selected = false;
            depgraphlib.DepGraph.highlightObject(this.previousSelectedObject,false); // sometimes the object doesn't exist anymore.
          }catch(e){
            
          }
          this.previousSelectedObject = null;
        }
      };

      /**
       * @funciton selectObject
       * @desc select an object node (word, chunk or link)
       * @param obj
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.selectObject =function(obj){
        if(this.previousSelectedObject == obj){
          this.clearSelection();
          return;
        }
        this.clearSelection();
        this.previousSelectedObject = obj;
        depgraphlib.DepGraph.highlightObject(this.previousSelectedObject,true);
        obj.selected = true;
      };

      /**
       * @function changeAtrributes
       * @desc change attributes of a object (link, chunk or word)
       * push the change in the action log
       * @param obj
       * @param attrs
       * @param pushAction
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.changeAttributes = function(obj,attrs,pushAction){
        var backup = depgraphlib.clone(obj);
        var oldAttrs = [];
        for(var i = 0; i < attrs.length ; i ++){
          var oldVal = depgraphlib.setAttrPath(obj,attrs[i].path,attrs[i].value);
          oldAttrs.push({path:attrs[i].path,value:oldVal});
        }
        if(pushAction != null && pushAction){
          var action = {mode:this.editMode,rollbackdata:{baseAction:'changeAttr',obj:backup,attrs:attrs,oldAttrs:oldAttrs}};
          this.pushAction(action);
        }
      };

      
      /**
       * @function addEditModeSwitcher
       * @desc Append a toolbar button allowing user to choose an edit mode among those registered
       * @todo rework this!
       * @memberof DepGraphLib.EditObject#
       */
      depgraphlib.EditObject.prototype.addEditModeSwitcher = function(){
        var me = this;
        this.depgraph.viewer.addToolbarButton('Custom Edit Mode',function(){
          var r=confirm("You will not be able to get back to frmg edit mode, are you sure you want to edit manually the graph?");
          if (r==true){
            depgraphlib.hideAltLinks(me.depgraph,me.depgraph.editObject.previousSelectedObject);
            me.setEditMode('default');
          }
        },'left');
      };

      
      /**
       * This callback is displayed as part of the EditObject class.
       * @callback DepGraphLib.EditObject~objectselect
       * @param {DepGraphLib.DepGraph} depgraph - The current graph being edited  
       * @param {object<DepGraphWord,number>|object<DepGraphLink,number>|object<DepGraphChunk,number>} params - the object being selected and its index
       */


      
      
  
}(window.depgraphlib));

/**
 * frmg_parser_custom.js
 * Defines FrMGWiki custom editobject
 */
(function(depgraphlib){



    depgraphlib.FRMGEditMode = function(urlFRMGServer){
      this.mode = {
          name : 'frmg',
          onWordSelect : showAltOnNodeClick,
          onLinkSelect : selectAlternative,
          onChunkSelect : depgraphlib.selectObject,
          onWordContext : {
            'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              depgraphlib.showEditPanel(depgraph,element);
            },
            'HighLight' : function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              processhighlightmode(depgraph,element);
            }
          },
          onLinkContext : {
            'Show Infos': function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              depgraphlib.showEditPanel(depgraph,element);
            },
            'HighLight' : function(depgraph,element) {  // element is the jquery obj clicked on when context menu launched
              processhighlightmode(depgraph,element);
            }
          },
          onChunkContext : null,
          keyHandler : editKeyDownFRMG,
          undo : frmgUndo,
          save:frmg_save,
          highlightInfos:null,
        };
      
      function frmg_save(depgraph){
        var params = getPreviousParams(depgraph);
        var highlightInfos = depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos;
        jQuery.ajax({
          type: 'POST', 
          url: depgraph.wsurl,
          data: {
            action:'save',
            format:'frmgserver',
            options: params,
            highlighting:highlightInfos,
            data:depgraph.sentence,
            uid:depgraph.options.uid
          },
          dataType : 'json',
          success: function(data, textStatus, jqXHR) {
            depgraph.editObject.lastSavedPtr = depgraph.editObject.currentPtr;
            depgraph.editObject.needToSaveState = false;
            depgraph.editObject.updateSaveState();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
          }
        });
      }
      
      function showAltOnNodeClick(depgraph,params){
        if(depgraph.editObject.previousSelectedObject != null && !depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
          hideAltLinks(depgraph,depgraph.editObject.previousSelectedObject);
        }
        
        if(processhighlightmode(depgraph,this)){
          return;
        }
        
        if(this == depgraph.editObject.previousSelectedObject){
          depgraph.editObject.clearSelection();
          return;
        }
        depgraph.editObject.selectObject(this);
        showAltLinks(depgraph,this);
      }

      function frmgUndo(depgraph,rollbackdata){
        if(rollbackdata.baseAction == 'removeEdge' || rollbackdata.baseAction == 'selectAlternative'){
          var param = rollbackdata.previousParams;
          if(param == ''){
            param = depgraph.original_data.graph.params;
          }
          getNewData(depgraph,depgraph.sentence,param);
        }
      }

      function editKeyDownFRMG (depgraph,params){
        if(params.keyCode == 46){
          if(depgraph.editObject.previousSelectedObject!= null){
            if(depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
              var params = removeLinkForNewData(depgraph,depgraph.sentence,depgraph.editObject.previousSelectedObject.__data__);
              return {baseAction:'removeEdge',previousParams:getPreviousParams(depgraph),currentParams:params};
            }
          }
        }
      }

      function selectAlternative(depgraph,params){
        if(depgraph.editObject.previousSelectedObject != null && !depgraphlib.isALink(depgraph.editObject.previousSelectedObject)){
          hideAltLinks(depgraph,depgraph.editObject.previousSelectedObject);
        }
        
        if(processhighlightmode(depgraph,this)){
          return;
        }
        
        if(depgraphlib.isALink(this) && true == this.__data__['#data'].virtual){
          var params = "";
          for(id  in this.__data__['ref_ids']){
            params += "eid=" + this.__data__['ref_ids'][id] + "&+8000";
            getNewData(depgraph,depgraph.sentence,params);
            return {baseAction:'selectAlternative',previousParams:getPreviousParams(depgraph),currentParams:params};
          }
        }
      }

      function getPreviousParams(depgraph){
        var eo = depgraph.editObject;
        if(eo.currentPtr == -1){
          return '';
        }else{
          var action = eo.actionsLog[eo.currentPtr];
          return action.rollbackdata.currentParams;
        }
      }
      
      depgraphlib.getPreviousParams = getPreviousParams;
      
      function processhighlightmode(depgraph,currentobj){
        if(depgraph.editObject.highlightMode){
          depgraph.editObject.clearSelection();
          var value = !depgraphlib.isObjectPermanentHighlighted(currentobj);
          depgraphlib.DepGraph.highlightObject(currentobj,value,true);
          
          if(depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos == null){
            depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos = depgraph.data.graph.highlighting?depgraph.data.graph.highlighting:[];
          }
          var infos = depgraph.editObject.mode[depgraph.editObject.editMode].highlightInfos;
          var index = infos.indexOf(currentobj.__data__.id);
          if(index != -1 && !value){
            infos.splice(index,1);
          }else if(index == -1 && value){
            infos.push(currentobj.__data__.id);
          }
          depgraph.editObject.setNeedToSave();
          return true;
        }else{
          return false;
        }
      }

      function removeLinkForNewData(depgraph,sentence,link){
        var source = depgraph.getWordByOriginalId(link.source);
        var target = depgraph.getWordByOriginalId(link.target);
        var source_data = source.__data__['#data'];
        var target_data = target.__data__['#data'];
        var param = "edge=" + 
          source_data['lemma'] + 
          "&" + source_data['cat'] + 
          "&" + link.label +
          "&" + target_data['lemma'] + 
          "&" + target_data['cat'] + 
          "&-8000";
        getNewData(depgraph,sentence,param);
        return param;
      }


      function createFRMGServerOptionData(sentence,desambigParams){
        if( Object.prototype.toString.call( desambigParams ) === '[object Array]' ) {
          desambigParams = desambigParams.join(" ");
        }
        return {
          sentence : sentence,
          options: 'xml ' + desambigParams,
          schema : 'dep',
          view: 'text',
          };
      }

      function getNewData(depgraph,sentence,options){
        var newdata;
        depgraph.viewer.ajaxStart();
        jQuery.ajax({
          type: 'GET', 
          url: urlFRMGServer,
          data: {
            sentence: sentence, 
            options: options,
            schema : 'dep',
            view : 'txt'
          },
          dataType : 'json',
          success: function(data, textStatus, jqXHR) {
            depgraph.resetData(data);
            depgraph.viewer.ajaxFinished();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
            depgraph.viewer.ajaxFinished();
          }
        });
      }
      
      depgraphlib.getNewData = getNewData;

      function showAltLinks(depgraph,node){
        for(link in node.__data__['#data']['alternatives']){
          depgraph.data.graph.links.push(node.__data__['#data']['alternatives'][link]);
        }
        depgraph.update();
        depgraph.postProcesses();
        depgraph.editObject.editModeInit();
        depgraph.autoHighLightOnMouseOver();
        allLinksToGrey(depgraph,node.__data__['#data']['alternatives']);
      }


      function allLinksToGrey(depgraph,exceptions){
        if(exceptions == null){
          exceptions = [];
        }
        depgraph.vis.selectAll('g.link').each(function(d,i){
          for(i in exceptions){
            if(exceptions[i]['#id'] == d['#id']){
              this.components.path.attr('stroke-dasharray',"5,5");
              return;
            }
          }
          this.components.path.attr('stroke','grey');
        });
      }


      function hideAltLinks(depgraph,node){
        if(!node){
          return;
        }
        for(i in node.__data__['#data']['alternatives']){
          var link = node.__data__['#data']['alternatives'][i];
          var index = depgraph.getLinkIndexByOriginalId(link.id);
          if(index == null){
            return false;
          }
          depgraph.data.graph.links.splice(index,1);
        }
        depgraph.update();
        depgraph.postProcesses();
      }
      
      depgraphlib.hideAltLinks = hideAltLinks;

      
    };
    
  
  
}(window.depgraphlib));


/**
 * mgwiki_graphs.js
 * This file contains javascript ajax function that will interact with FrMGWiki server functions,
 * and others convenient functions.
 */
(function(depgraphlib){

    /**
     * Callback to use in a toolbar button.
     * Display a box containing informations about the current graph.
     */
    depgraphlib.showRefs = function(){
      var me = depgraphlib.DepGraph.getInstance(this);
      var coords = this.getBoundingClientRect();
      var point = {x:coords.left,y:coords.top + coords.height + 2};
      var div ='<div>Reference Infos : <br>';
      div += 'Sentence : ' + fix_missing_a_closing_tag(me.sentenceLink) + '<br>'
      + 'Back Links : ' + me.refs
      +'</div>';
      div = jQuery(div);
      me.viewer.createBox({closeButton:true,position:point}).setContent(div).open();
    };

    function fix_missing_a_closing_tag(link){
      if(link.indexOf('</a>', link.length - 4) !== -1){
        return link;
      }else{
        return link + '</a>';
      }
    }


    depgraphlib.mgwiki_d3js_module_action = function(action,gid,wsurl){
      jQuery.ajax({
        type: 'POST', 
        url: wsurl,
        data: {
          gid:gid,
          action:'promote',
        },
        dataType : action,
        success: function(data, textStatus, jqXHR) {
          if(data.success){
            window.location = '';
          }else{
            alert(data.error);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          alert(textStatus);
        }
      });
    };
    
    depgraphlib.promote = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('promote',gid,url);
    };
    
    depgraphlib.reload = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('reload',gid,url);
    };

    depgraphlib.remove = function(gid,url){
      depgraphlib.mgwiki_d3js_module_action('remove',gid,url);
    };
  
}(window.depgraphlib));

