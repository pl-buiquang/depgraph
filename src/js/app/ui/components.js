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