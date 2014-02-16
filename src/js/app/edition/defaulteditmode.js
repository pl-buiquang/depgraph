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
      onChunkSelect : depgraphlib.EditObject.DefaultModeLib.addLinkClick,
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
        'Add Root Edge':function(depgraph,element){
          depgraphlib.EditObject.DefaultModeLib.addRootEdge(depgraph,element[0]);
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
          var link = depgraphlib.clone(element[0].__data__);
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
          var chunk = depgraphlib.clone(element[0].__data__);
          var affectedLinks = depgraph.removeChunk(element[0].__data__['#id']);
          depgraph.editObject.previousSelectedObject = null;
          return {baseAction:'chunkRemoval',chunk:chunk,affectedLinks:affectedLinks};
        }
      },
      /**
       * @member {function} onKeyDown
       * @desc handle any key pressed when editing.
       * (params of the callback are the current graph and an object that contains the keypressed event)
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onKeyDown : depgraphlib.EditObject.DefaultModeLib.editKeyDownDefault,
      /**
       * @member {function} onKeyPress
       * @desc handle any key pressed when editing.
       * (params of the callback are the current graph and an object that contains the keypressed event)
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onKeyPress : null,
      /**
       * @member {function} onKeyUp
       * @desc handle any key pressed when editing.
       * (params of the callback are the current graph and an object that contains the keypressed event)
       * @memberof DepGraphLib.EditObject.DefaultMode
       */
      onKeyUp : null,
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
      redo:depgraphlib.EditObject.DefaultModeLib.defaultRedo,
  };
  
}(window.depgraphlib));