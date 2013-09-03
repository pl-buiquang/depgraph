(function(depgraphlib, $, undefined){

  document.write('<form id="export_png" method="post" action="plugins/export.php" target="_blank">'+
'<input type="hidden" name="data" value="" />'+
'</form>');
  
  depgraphlib.DepGraph.prototype.getExportableSVG = function(){
    var svgBBox = this.svg.node().getBBox();
    this.svg.attr('width',svgBBox.width);
    this.svg.attr('height',svgBBox.height);
    return this.svg.node();
  };
  
  depgraphlib.DepGraph.prototype.addExportFeature = function(){
    var me = this;
    this.viewer.addToolbarButton('export png',function(){me.exportPng();},'right',null,'Export to PNG');
  };
  
  depgraphlib.DepGraph.prototype.exportPng = function(){
    var svgBBox = this.svg.node().getBBox();
    this.svg.attr('width',svgBBox.width);
    this.svg.attr('height',svgBBox.height);
    var svg_xml = (new XMLSerializer).serializeToString(this.svg.node());

    var form = document.getElementById("export_png");
    if(!form){
      document.write('<form id="export_png" method="post" action="plugins/export.php" target="_blank">'+
          '<input type="hidden" name="data" value="" />'+
          '</form>');
      form = document.getElementById("export_png");
    }
    form['data'].value = svg_xml ;
    form.submit();
  };
  
  
  
  
}(window.depgraphlib = window.depgraphlib || {}, jQuery));
