<?php
$basepath = drupal_get_path('module','d3js') . "/templates/";
drupal_add_css($basepath . "viewer/d3js_graph_viewer_template.css");
drupal_add_js($basepath . "viewer/d3js_graph_viewer_template.js");
drupal_add_js($basepath . "depview/depgraph.js");
drupal_add_css($basepath . "depview/depgraph.css");
drupal_add_js(drupal_get_path('module','d3js') . '/js/d3.v2.js');
module_load_include("inc", "d3js", "templates/depview/depgraph_formats");

$uid = uniqid();
$json_options = json_encode(array());
//$xml = new SimpleXMLElement($data['data']);
$format = $data['format'];
$graph_data = $data['data'];
$json_data;
if(strtolower($format) == 'dep2pict'){
  $json_data = dep2pict2depGraph($graph_data);
}else if(strtolower($format) == 'conll'){
  $json_data = conll2depGraph($graph_data);
}else if(strtolower($format) == 'json'){
  $json_data = $graph_data;
}

//echo $json_data;
?>
<div id="graph-container-<?php echo $uid;?>"></div>
      <script>
        var viewer = new GraphViewer("<?php echo $uid;?>",jQuery("#graph-container-<?php echo $uid;?>"));
        var depGraph = new DepGraph(viewer,<?php echo $json_data;?>,<?php echo $json_options;?>);
        viewer.noBorders();
        //viewer.noDebugPanel();
        viewer.shrinkToContent(removeUnit(depGraph.data.graph['#style']['margin'].right),removeUnit(depGraph.data.graph['#style']['margin'].bottom)+20);

        var json_data = viewer.createDiv('json-code');
        viewer.extraDiv.append(json_data);
        json_data.html(JSON.stringify(<?php echo $json_data;?>));
        viewer.addToolbarButton('json-code',function(){GraphViewer.getInstance(this).viewAltContent('json-code');},'left');
        viewer.callbacks.showaltpanel.push({
          method:function(args){
            this.removeToolbarButton(args[0]);
          },
          caller:viewer,
          args:['json-code']
          }
        );
        viewer.callbacks.hidealtpanel.push({
          method:function(args){
            this.addToolbarButton(args[0],args[1],args[2],args[3]);
          },
          caller:viewer,
          args:['json-code',function(){GraphViewer.getInstance(this).viewAltContent('json-code');},'left']
          }
        );
      </script>