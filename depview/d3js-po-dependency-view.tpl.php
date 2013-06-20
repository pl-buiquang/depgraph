<?php
$basepath = drupal_get_path('module','d3js') . "/templates/";
drupal_add_css($basepath . "viewer/d3js_graph_viewer_template.css");
drupal_add_js($basepath . "viewer/d3js_graph_viewer_template.js");
drupal_add_js($basepath . "depview/depgraph.js");
drupal_add_js($basepath . "depview/frmg_parser_custom.js");
drupal_add_css($basepath . "depview/depgraph.css");
drupal_add_css(drupal_get_path('module','d3js') . "/js/jquery-contextMenu-master/jquery.contextMenu.css");
drupal_add_js(drupal_get_path('module','d3js') . '/js/jquery-contextMenu-master/jquery.contextMenu.js');
drupal_add_js(drupal_get_path('module','d3js') . '/js/d3.v2.js');
drupal_add_library('system', 'ui');
module_load_include("inc", "d3js", "templates/depview/depgraph_formats");

global $base_url;
//echo $options['gid'];
$ajson = array();
$json_data;
try{
  $json_data = depXML2depGraph($data['data']);
}catch(Exception $e){
  drupal_set_message(t('There seems to be an issue with the graph data. '), "warning");
  return;
}
$xml = new SimpleXMLElement($data['data']);
$uid = isset($xml['uid']) ? (string) $xml['uid'] : uniqid();
$sentence = htmlspecialchars_decode((string) $xml['sentence']);
$sentence = preg_replace("/'/","\'",$sentence);
$sentence = str_replace("\n", " ", $sentence);
$json_options = json_encode($options);

$title = preg_replace("/'/","\'",$data['title']);
$title = str_replace("\n", " ", $title);

$frmgserver_url = $base_url . '/frmgserver_proxy';

$sentence_link = getSentenceLink($data['sentence_id'],$sentence);
$refs = '<div><ul>';
foreach($data['refs'] as $ref){
  $refs .= '<li>' . l('node '.$ref,'/node/'.$ref.'#graph-'.$uid) . '</li>';
}
$refs .= '</ul></div>';


?>
<a id="graph-<?php echo $uid?>" name="graph-<?php echo $uid?>"></a><div id="graph-container-<?php echo $uid;?>"></div>
<div><?php if(!isset($options['wrapped'])) echo $data['title'];?></div>
<script>
  var viewer = new GraphViewer("<?php echo $uid;?>",jQuery("#graph-container-<?php echo $uid;?>"));
  var depGraph = new DepGraph(viewer,<?php echo $json_data; ?>,<?php echo $json_options;?>);
  <?php
    if(isset($options['edit-mode'])){
      echo "depGraph.sentence = '$sentence';
            frmgEditMode = new FRMGEditMode('$frmgserver_url');
            depGraph.editObject.addEditMode(frmgEditMode.mode);
            depGraph.editObject.setEditMode('frmg');
            depGraph.dataFormat = 'json';
            depGraph.editObject.defaultMode.save = save_default;
            viewer.setFixedToolbar();";
    }
  ?>
  viewer.noBorders();
  viewer.shrinkToContent(removeUnit(depGraph.data.graph['#style']['margin'].right),removeUnit(depGraph.data.graph['#style']['margin'].bottom)+20);

  depGraph.sentenceLink = '<?php echo $sentence_link; ?>';
  depGraph.refs = '<?php echo $refs ?>';
  
  if(<?php echo isset($options['wrapped'])?'true':'false';?>){
    var wrapper = viewer.addWrapper('<?php echo $title;?>');
    var div ='<div>Reference Infos :'
    + depGraph.refs
    +'</div>';
    div = jQuery(div);
      
    depGraph.viewer.container.append(div);
  }else{
    viewer.addToolbarButton('refs',showRefs,'left','refs');
}

  
  <?php
      if(!isset($options['edit-mode'])){
        echo "viewer.addToolbarButton('edit',function(){window.location = '" . $base_url . "/d3js/" . $options['gid'] . "/edit';},'left');";
      }
    ?>

  </script>

