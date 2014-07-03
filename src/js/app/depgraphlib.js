/**
 * @file First include of DepGraphLib, contains declaration of major classes
 * @author Paul Bui-Quang
 */

/**
 * The global namespace of the DepGraphLib Library
 * @namespace DepGraphLib
 */


(function(depgraphlib){
  
 depgraphlib.helpurl = "content/helpdepgraph";

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
 * @property {DepGraphStyle} [#style] object style define the global style of the graph. object style definition contain css-like style attributes
 * @property {DepGraphStyle} [#word-style] object style define words style of the graph. these values can be overriden in word #style attribute definition. 
        object style definition contain css-like style attributes
 * @property {DepGraphStyle} [#link-style] object style define links style of the graph. these values can be overriden in link #style attribute definition. 
        object style definition contain css-like style attributes
 * @property {DepGraphStyle} [#chunk-style] object style define chunks style of the graph. these values can be overriden in chunk #style attribute definition. 
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
 * @property {string} [uid] the uid of the graph
 * @property {string} [viewmode] the view mode of the graph. possible values are 'full', 'stretched', 'cropped'
 */
