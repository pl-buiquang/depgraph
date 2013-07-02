<!DOCTYPE html> 
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!-- Lib includes js -->
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
<script type="text/javascript" src="http://code.jquery.com/ui/1.10.2/jquery-ui.js"></script>
<script type="text/javascript" src="lib/colorbox/jquery.colorbox-min.js"></script>
<script type="text/javascript" src="lib/jquery-contextMenu-master/jquery.contextMenu.js"></script>
<script type="text/javascript" src="lib/d3.v2.min.js"></script>

<!-- DepGraph Lib js-->
<script type="text/javascript" src="depgraph.js"></script>

<!-- DepGraph Plugins js -->
<script type="text/javascript" src="plugins/frmg_parser_custom.js"></script>

<!-- Lib includes css -->
<link rel="stylesheet" media="screen" type="text/css"
href="lib/jquery-contextMenu-master/jquery.contextMenu.css" />
<link rel="stylesheet" media="screen" type="text/css"
href="http://code.jquery.com/ui/1.10.2/themes/smoothness/jquery-ui.css" />

<!-- DepGraph Lib css -->
<link rel="stylesheet" media="screen" type="text/css"
href="depgraph.css" />

</head>
<body>
<div id="graph-container"></div>
<script>
  var json_data = <?php 
  require_once 'depgraph_formats.inc';
    $data = '[GRAPH] {
    background=#F9F9F9;
    scale=150;
}
 
[WORDS] {
    ITALIC { word="ITALIC"; italic; subword="red"; subcolor=red;}
    BOLD { word="BOLD"; bold; subword="green"; subcolor=green;}
    BOTH { word="BOTH"; bold; italic; subword="violet"; subcolor=violet; }
    RED { word="RED"; forecolor=red; subword="red"; }
    GREEN { word="GREEN"; forecolor=green; subword="green"; }
    BLUE { word="BLUE"; forecolor=blue; subword="blue"; }
    YELLOW { word="YELLOW"; forecolor=yellow; subword="yellow"; }
    BROWN { word="BROWN"; forecolor=brown; subword="brown"; }
}
 
 
[EDGES] { 
 
    ITALIC -> BROWN { color=green; style=dot; forecolor=gray; label="color=green; style=dot; forecolor=gray;"; }
    ITALIC -> BOTH { }
    ITALIC -> BOTH { bottom; }
    ITALIC -> BOTH { bottom; }
    ITALIC -> BOLD { label="simple";}
    ITALIC -> YELLOW { bottom; color=blue; label="simple"; }
    ITALIC -> GREEN { style=dot; label="big edge"; bottom; color=green; }
 
    BOLD -> ITALIC { label="red label"; forecolor=red; }
 
    BOTH -> BOLD { label="red label"; forecolor=red; }
    BOTH -> BOLD { label="red label"; forecolor=red; }
    BOTH -> BLUE { label="red edge"; color=red; }
    BOTH -> GREEN { label="red label"; forecolor=red; }
    BOTH -> RED { label="all red"; color=red; forecolor=red; }
    BOTH -> GREEN { label="red label"; forecolor=red; bottom; }
    BOTH -> GREEN { label="red label"; forecolor=red; bottom; }
    BOTH -> RED { label="all red"; color=red; forecolor=red; bottom; }
    BOTH -> RED { label="all red"; color=red; forecolor=red; bottom; }
 
    BLUE -> BROWN { label="dashed edge"; style=dash; color=pink; }
    BLUE -> YELLOW { label="dashed dot"; style=dot; color=green; }
    BLUE -> BROWN { label="dashed edge"; style=dash; color=pink; bottom; }
    BLUE -> BROWN { label="dashed edge"; style=dash; color=pink; bottom; }
    BLUE -> YELLOW { label="dashed dot"; style=dot; color=green; bottom; }
    BLUE -> YELLOW { label="dashed dot"; style=dot; color=green; bottom; }
 
    YELLOW -> ITALIC {  label="simple"; color=blue; bottom; }
    YELLOW -> ITALIC {  label="simple"; color=blue; bottom; }
 
    BROWN -> BLUE { label="solid edge"; color=brown; bottom; }
    BROWN -> BLUE { label="solid edge"; color=brown; }
    BROWN -> BOLD { label="red edge"; color=red; bottom; }
    BROWN -> BOLD { label="red edge"; color=red; bottom; }
 
}';
    echo dep2pict2depGraph($data);
  ?>;
  var depGraph = new depgraphlib.DepGraph(jQuery("#graph-container"),json_data,{viewmode:'streched',viewsize:'500px'});
  depGraph.viewer.setImageMode(true);
  </script>
<div id="graph-container2"></div>
<script>
  var json_data = <?php 
  require_once 'depgraph_formats.inc';
    $data = '[GR_GRAPH] {
    background=#F9F9F9;
    scale=150;
    edge_label_size=8;
}
 
[WORDS] {
  w1 { word = "En"; subword = "1"; }
  w2 { word = "quelle"; subword = "2"; }
  w3 { word = "année"; subword = "3"; }
  w4 { word = "Desmond"; subword = "4"; }
  w5 { word = "Mpilo"; subword = "5"; }
  w6 { word = "Tutu"; subword = "6"; }
  w7 { word = "a"; subword = "7"; }
  w8 { word = "-t-il"; subword = "8"; }
  w9 { word = "reçu"; subword = "9"; }
  w10 { word = "le";  subword = "10"; }
  w11 { word = "prix"; subword = "11"; }
  w12 { word = "Nobel"; subword = "12"; }
  w13 { word = "de"; subword = "13"; }
  w14 { word = "la"; subword = "14"; }
  w15 { word = "paix"; subword = "15"; }
  w16 { word = "?"; subword = "16"; }
}
 
[GROUPS]
{
 GP1 { words = [w1..w3]; subword = "GP1"; background=#ADDFFF; }
 GN2 { words = [w4..w6]; subword = "GN2"; background=#EEAD90;}
 NV3 { words = [w7..w8]; subword = "NV3"; background=#90EE90; }
 NV4 { words = [w9..w9]; subword = "NV4"; background=#90EE90;}
 GN5 { words = [w10..w11]; subword = "GN5";  background=#EEAD90;}
 GN6 { words = [w12..w12]; subword = "GN6";  background=#EEAD90;}
 GP7 { words = [w13..w15]; subword = "GP7"; background=#ADDFFF;}
}
 
[EDGES] { 
 GN2 -> w7 {label = "SUJ_V"; }
 w8 -> w7 {label = "SUJ_V"; }
 w7 -> w9 {label = "AUX_V"; }
 GN5 -> NV4 { label = "COD_V"; }
 GP1 -> NV4 { label = "CPL_V"; }
 GP7 -> w11 { label = "MOD_N"; }
 GN6 -> GN5 { label = "MOD_N"; }
}';
    echo dep2pict2depGraph($data);
  ?>;
  var depGraph = new depgraphlib.DepGraph(jQuery("#graph-container2"),json_data,{viewmode:'cropped',viewsize:'600px'});
  depGraph.viewer.setImageMode(true);
  </script>
</body>
</html>