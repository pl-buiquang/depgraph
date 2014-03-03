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
        if(attr == '#properties'){
          continue;
        }
        if (obj.hasOwnProperty(attr)){
          try
          {
            copy[attr] = depgraphlib.clone(obj[attr]);
          }
        catch(err)
          {
            console.log("couldn't copy "+attr);
          }
          
          
        }
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

