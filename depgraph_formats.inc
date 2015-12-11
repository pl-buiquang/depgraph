<?php

if(function_exists('module_load_include')){
  module_load_include("inc", "mgwiki","mgwiki.utils");
}


function convertGraph($data,$sourceformat,$targetformat){
  $json;
  $formateddata;
  switch ($sourceformat){
    case 'depconll':
      $json = depconll2depGraph($data);
      break;
    case 'conll':
      $json = conll2depGraph($data);
      break;
    case 'depxml':
      $json = depXML2depGraph($data);
      break;
    case 'json':
      $json = $data;
      break;
    case 'dep2pict':
      $json = dep2pict2depGraph($data);
      break;
    case 'passage':
      $json = passage2depGraph($data);
      break;
    case 'udep':
      $json = udep2depGraph($data);
      break;
  }
  switch ($targetformat){
    case 'depconll':
      $formateddata = depGraph2depconll($json);
      break;
    case 'conll':
      $formateddata = depGraph2conll($json);
      break;
    case 'depxml':
      $formateddata = depGraph2depXML($json);
      break;
    case 'json':
      $formateddata = $json;
      break;
    case 'dep2pict':
      $formateddata = depGraph2dep2pict($json);
      break;
    case 'tikz-dep':
      $formateddata = depGraph2tikz($json);
      break;
    case 'udep':
      $formateddata = depGraph2udep($json);
      break;
  }
  
  return $formateddata;
  
}

/*********************************************************/
/*                    depgraph                           */
/*********************************************************/

function getSentence($graph){
  // TODO for now I assume that the label is the token, but it depends... of the format and more if original format is json
  $data = json_decode($graph,true);
  $sentence = "";
  if(isset($data) && isset($data['graph']) && isset($data['graph']['words'])){
    foreach ($data['graph']['words'] as $word){
      $sentence .= " " . $word['label'];
    }  
  }
  if($sentence === ""){
    return "could'nt retrieve sentence content!";
  }
  return trim($sentence);
}

/*********************************************************/
/*              latex | tikz-dependency                  */
/*********************************************************/

function tikz2depGraph($data){
  
}

function depGraph2tikz($data){
  if(is_string($data)){
    $data = json_decode($data,true);
  }
  
  $ref_ids = array();
  $lines = array();
  
  $options = array(
    "font"=>"scriptsize",
    "colmargin"=>"0.005em"
  );
  
  $lines[] = "\\begin{dependency}\n\\begin{deptext}[column sep=".$options["colmargin"].",font=".$options['font']."]";
  $line1 = &$lines[];
  $line2 = &$lines[];
  $line3 = &$lines[];
  $line1 = array();
  $line2 = array();
  $line3 = array();
  $i=1;
  foreach($data['graph']['words'] as $word){
    $ref_ids[$word['id']]=$i++;
    $line1[] = $word['label'];
    $line2[] = $word['sublabel'][0];
    $line3[] = $word['sublabel'][1];
  }
  $line1 = implode("\\&",$line1);
  $line1 .= "\\\\";
  if(!isset($line2[0])){
    $line2 = "";
  }else{
    $line2 = implode("\\&",$line2);
    $line2 .= "\\\\";
  }
  
  if(!isset($line3[0])){
    $line3 = "";
  }else{
    $line3 = implode("\\&",$line3);
    $line3 .= "\\\\";
  }
  
  
  
  
  
  $lines[] = "\\end{deptext}";
  foreach($data['graph']['links'] as $link){
    $type = (isset($link["#data"]) && isset($link["#data"]['type']))?$link["#data"]['type']:"";
    $target = isset($ref_ids[$link['target']])?"{".$ref_ids[$link['target']]."}":"";
    $source = isset($ref_ids[$link['source']])?"{".$ref_ids[$link['source']]."}":""; 
    $lines[]="\\depedge[".$type."]".$source.$target."{".latexQuote($link['label'])."}";
  }
  $lines[]="\\end{dependency}";
  return implode("\n",$lines);
}

function latexQuote($text){
  return $text;
}


/*********************************************************/
/*                      conll                            */
/*********************************************************/

function conll2depGraph($data){
  if(is_string($data)){
    $data = preg_replace("/^#(.*?)\n/m", '', $data);
    $data = preg_split('/\n/',$data);
  }
  
  $graph['words'] = array();
  $graph['links'] = array();
  $graph['chunks'] = array();

  foreach($data as $line){
    
    $line = trim($line,"\n ");
    
    if($line == ""){
      continue;
    }
    
    $items = preg_split('/\t/', $line);
    
  
    if(count($items)<8){
      $items = preg_split('/\s+/', $line);//   throw new Exception('Le format semble être incorrect');
    }
    
    $features = array();
    $heads = array();
    $relations = array();
    $regex_feature = '/(\w+)\s*=\s*(\w+)\s*\|*\s*/';
    $regex_rel = '/([A-Za-z0-9_\-\+:\.]+)\s*\|*\s*/';
    preg_match_all($regex_feature, $items[5], $features, PREG_SET_ORDER);
    preg_match_all($regex_rel, $items[6], $heads);
    preg_match_all($regex_rel, $items[7], $relations);
    
    $word = &$graph['words'][];
    $word['id'] = $items[0];
    $word['#data'] = array();
    $word['label'] = $items[1];
    $word['sublabel'][] = $items[2];
    $word['sublabel'][] = $items[3];
    $word['#data']['token'] = $items[1];
    $word['#data']['lemma'] = $items[2];
    $word['#data']['cpos'] = $items[3];
    $word['#data']['pos'] = $items[4];
    foreach($features as $feat){
      $word['#data']['feat'][trim($feat[1])] = trim($feat[2]);
    }

    $n;
    if(($n = count($heads[1])) != count($relations[1])){
      echo 'error';
      //watchdog('debug',count($heads[1]) . '__' . count($relations[1]));
      //      throw new Exception('Le format semble être incorrect');
    }
    for($i = 0; $i< $n ; ++$i){
      $rel = $relations[1][$i];
      $source = $heads[1][$i];
      if($source === '0'){
        $link = &$graph['links'][];
        $link['source'] = $source;
        $link['target'] = $items[0];
        $link['label'] = $rel;
        continue;
      }
      $link = &$graph['links'][];
      $link['source'] = $source;
      $link['target'] = $items[0];
      $link['label'] = $rel;
      if(!strncmp($rel, "S:", 2)){
        $link['#style'] = array('link-color' => 'red','color' => 'red');
      }else if(!strncmp($rel, "D:", 2)){
        $link['#style'] = array('link-color' => 'blue','color' => 'blue');
      }
    }
    }
    
    $dep_graph_array['graph'] = $graph;
    return json_encode($dep_graph_array);

}

function depGraph2conll($data){
  if(is_string($data)){
    $data = json_decode($data,true);
  }
  
  $ref_ids = array();
  $lines = array();
  foreach($data['graph']['words'] as $word){
    $line = &$lines[];
    $ref_ids[$word['id']] = &$line;
    $line = array();
    $line[0]=isset($word['id'])?$word['id']:'_';
    $line[1]=isset($word['label'])?$word['label']:'_';
    $line[2]=isset($word['#data']['lemma'])?$word['#data']['lemma']:'_';
    $line[3]=isset($word['#data']['cpos'])?$word['#data']['cpos']:'_';
    $line[4]=isset($word['#data']['pos'])?$word['#data']['pos']:'_';
    $line[5]=isset($word['#data']['feat'])?conllFeatures($word['#data']['feat']):'_';
  }
  foreach($data['graph']['links'] as $link){
    if($link['target']==0 || (isset($ref_ids[$link['target']]) && $ref_ids[$link['target']]!=null)){
      $line = &$ref_ids[$link['target']];
      if(isset($line[6]) && $line[6] != null){ // case append
        $line[6] .= '|' . $link['source'];
        $line[7] .= '|' . $link['label'];
      }else{ // case create
        $line[6] = $link['source'];
        $line[7] = $link['label'];
      }
    }else{
      throw new Exception('Couldn\'t find word with id : ' . $link['target']);
    }
  }
  foreach($lines as &$line){
    $line = implode("\t",$line);
  }
  return implode("\n",$lines);
}

function depconll2depGraph($data){
  if(is_string($data)){
    $data = preg_replace("/^#(.*?)\n/m", '', $data);
    $data = preg_split('/\n/',$data);
  }
  
  $graph['words'] = array();
  $graph['links'] = array();
  $graph['chunks'] = array();

  foreach($data as $line){
    
    $line = trim($line,"\n ");
    
    if($line == ""){
      continue;
    }
    
    $items = preg_split('/\t/', $line);
    
  
    if(count($items)<8){
      $items = preg_split('/\s+/', $line);//   throw new Exception('Le format semble être incorrect');
    }
    
    $features = array();
    $heads = array();
    $relations = array();
    $regex_feature = '/(\w+)\s*=\s*(\w+)\s*\|*\s*/';
    $regex_rel = '/([A-Za-z0-9_\-\+:\.]+)\s*\|*\s*/';
    preg_match_all($regex_feature, $items[4], $features, PREG_SET_ORDER);
    preg_match_all($regex_rel, $items[5], $heads);
    preg_match_all($regex_rel, $items[6], $relations);
    
    $word = &$graph['words'][];
    $word['id'] = $items[0];
    $word['#data'] = array();
    $word['label'] = $items[1];
    $word['sublabel'][] = $items[2];
    $word['sublabel'][] = $items[3];
    $word['#data']['token'] = $items[1];
    $word['#data']['lemma'] = $items[2];
    $word['#data']['cat'] = $items[3];
    foreach($features as $feat){
      $word['#data']['feat'][trim($feat[1])] = trim($feat[2]);
    }

    $n;
    if(($n = count($heads[1])) != count($relations[1])){
      echo 'error';
      //watchdog('debug',count($heads[1]) . '__' . count($relations[1]));
      //      throw new Exception('Le format semble être incorrect');
    }
    for($i = 0; $i< $n ; ++$i){
      $rel = $relations[1][$i];
      $source = $heads[1][$i];
      if($source === '0'){
        $link = &$graph['links'][];
        $link['source'] = $source;
        $link['target'] = $items[0];
        $link['label'] = $rel;
        continue;
      }
      $link = &$graph['links'][];
      $link['source'] = $source;
      $link['target'] = $items[0];
      $link['label'] = $rel;
      if(!strncmp($rel, "S:", 2)){
        $link['#style'] = array('link-color' => 'red','color' => 'red');
      }else if(!strncmp($rel, "D:", 2)){
        $link['#style'] = array('link-color' => 'blue','color' => 'blue');
      }
    }
    }
    
    $dep_graph_array['graph'] = $graph;
    return json_encode($dep_graph_array);

}

function depGraph2depconll($data){
  if(is_string($data)){
    $data = json_decode($data,true);
  }
  
  $ref_ids = array();
  $lines = array();
  foreach($data['graph']['words'] as $word){
    $line = &$lines[];
    $ref_ids[$word['id']] = &$line;
    $line = array();
    $line[0]=isset($word['id'])?$word['id']:'_';
    $line[1]=isset($word['label'])?$word['label']:'_';
    $line[2]=isset($word['#data']['lemma'])?$word['#data']['lemma']:'_';
    $line[3]=isset($word['#data']['cat'])?$word['#data']['cat']:'_';
    $line[4]=isset($word['#data']['feat'])?conllFeatures($word['#data']['feat']):'_';
  }
  foreach($data['graph']['links'] as $link){
    if($link['target']==0 || (isset($ref_ids[$link['target']]) && $ref_ids[$link['target']]!=null)){
      $line = &$ref_ids[$link['target']];
      if(isset($line[6]) && $line[6] != null){ // case append
        $line[5] .= '|' . $link['source'];
        $line[6] .= '|' . $link['label'];
      }else{ // case create
        $line[5] = $link['source'];
        $line[6] = $link['label'];
      }
    }else{
      throw new Exception('Couldn\'t find word with id : ' . $link['target']);
    }
  }
  foreach($lines as &$line){
    $line = implode("\t",$line);
  }
  return implode("\n",$lines);
}


/*********************************************************/
/*                      conll                            */
/*********************************************************/

function udep2depGraph($data){
  if(is_string($data)){
    $data = preg_replace("/^#(.*?)\n/m", '', $data);
    $data = preg_split('/\n/',$data);
  }
  
  $graph['words'] = array();
  $graph['links'] = array();
  $graph['chunks'] = array();

  $aggl = array();
  
  foreach($data as $line){
    
    $line = trim($line,"\n ");
    
    if($line == ""){
      continue;
    }
    
    $items = preg_split('/\t/', $line);
    
  
    if(count($items)<8){
      $items = preg_split('/\s+/', $line);//   throw new Exception('Le format semble être incorrect');
    }

    $indexes = preg_split('/-/',$items[0]);
    
    if (count($indexes) == 2) {
            /* extra line for agglutinates */
        $min = $indexes[0];
        $max = $indexes[1];
        if ($min < $max) {
            $aggl[$min] = $items[1];
            for($i = $min; $i < $max; $i++ ) {
                $aggl[$i+1] = '_';
                    /* add a segmentation link */
                $link = &$graph['links'][];
                $link['source'] = $min;
                $link['target'] = $i+1;
                $link['label'] = "";
                $link['#style']['link-color'] = getTypeColor("ellipsis");
                $link['#style']['oriented'] = false;
                $link['#style']['stroke-dasharray'] = "5,5,1,5";
                $link['#data']['type'] = "segmentation";
            }
        }
        continue;
    } 
    
    $features = array();
    $heads = array();
    $relations = array();
    $regex_feature = '/(\w+)\s*=\s*(\w+)\s*\|*\s*/';
    $regex_rel = '/([A-Za-z0-9_\-\+:\.]+)\s*\|*\s*/';
    preg_match_all($regex_feature, $items[5], $features, PREG_SET_ORDER);
    preg_match_all($regex_rel, $items[6], $heads);
    preg_match_all($regex_rel, $items[7], $relations);
    
    $word = &$graph['words'][];
    $word['id'] = $items[0];
    $word['#data'] = array();
    $word['label'] = $items[1];
    if (isset($aggl[$items[0]])) {
        $word['label'] = $aggl[$items[0]];
    }
    $word['sublabel'][] = $items[2];
    $word['sublabel'][] = $items[3];
    $word['#data']['token'] = $items[1];
    $word['#data']['lemma'] = $items[2];
    $word['#data']['cpos'] = $items[3];
    $word['#data']['pos'] = $items[4];
    foreach($features as $feat){
      $word['#data']['feat'][trim($feat[1])] = trim($feat[2]);
    }

    $n;
    if(($n = count($heads[1])) != count($relations[1])){
      echo 'error';
      //watchdog('debug',count($heads[1]) . '__' . count($relations[1]));
      //      throw new Exception('Le format semble être incorrect');
    }
    for($i = 0; $i< $n ; ++$i){
      $rel = $relations[1][$i];
      $source = $heads[1][$i];
      if($source === '0'){
        $link = &$graph['links'][];
        $link['source'] = $source;
        $link['target'] = $items[0];
        $link['label'] = $rel;
        continue;
      }
      $link = &$graph['links'][];
      $link['source'] = $source;
      $link['target'] = $items[0];
      $link['label'] = $rel;
      if(!strncmp($rel, "S:", 2)){
        $link['#style'] = array('link-color' => 'red','color' => 'red');
      }else if(!strncmp($rel, "D:", 2)){
        $link['#style'] = array('link-color' => 'blue','color' => 'blue');
      }
    }
    }
    
    $dep_graph_array['graph'] = $graph;
    return json_encode($dep_graph_array);

}

function depGraph2udep($data){
  if(is_string($data)){
    $data = json_decode($data,true);
  }
  
  $ref_ids = array();
  $lines = array();
  foreach($data['graph']['words'] as $word){
    $line = &$lines[];
    $ref_ids[$word['id']] = &$line;
    $line = array();
    $line[0]=isset($word['id'])?$word['id']:'_';
    $line[1]=isset($word['label'])?$word['label']:'_';
    $line[2]=isset($word['#data']['lemma'])?$word['#data']['lemma']:'_';
    $line[3]=isset($word['#data']['cpos'])?$word['#data']['cpos']:'_';
    $line[4]=isset($word['#data']['pos'])?$word['#data']['pos']:'_';
    $line[5]=isset($word['#data']['feat'])?conllFeatures($word['#data']['feat']):'_';
  }
  foreach($data['graph']['links'] as $link){
    if($link['target']==0 || (isset($ref_ids[$link['target']]) && $ref_ids[$link['target']]!=null)){
      $line = &$ref_ids[$link['target']];
      if(isset($line[6]) && $line[6] != null){ // case append
        $line[6] .= '|' . $link['source'];
        $line[7] .= '|' . $link['label'];
      }else{ // case create
        $line[6] = $link['source'];
        $line[7] = $link['label'];
      }
    }else{
      throw new Exception('Couldn\'t find word with id : ' . $link['target']);
    }
  }
  foreach($lines as &$line){
    $line = implode("\t",$line);
  }
  return implode("\n",$lines);
}


/**
 * Create feature cell of conll format from depgraph feat attribute of words
 */
function conllFeatures($features){
  $cell = "";
  foreach($features as $key => $value){
    $cell = $key . '=' . $value . '|';
  }
  return trim($cell,'|');
}

/**
 * transform \t and \n to html equivalent
 * @param unknown $data
 */
function conllToHTML($data){
  $data = preg_replace("/\\\\t/", "&#09;", $data);
  $data = preg_replace("/\\\\n/", "<br>", $data);
  return $data;
}

function htmlToConll($data){
  
}


/*********************************************************/
/*                    dep2pict                           */
/*********************************************************/

//TODO
// word label sublabel
// style
// ...


function depGraph2dep2pict($data){
  if(is_string($data)){
    $data = json_decode($data,true);
  }

  $graph = "[GRAPH]{}\n";
  $words = "[WORDS]{\n";
  $links = "[EDGES]{\n";

  foreach($data['graph']['words'] as $word){
    $words .= $word['id'] . '{word="' . $word['label'] . '"; ';
    if(isset($word['sublabel'])){
      $words.= 'subword="'.implode("#", $word['sublabel']).'";';
    }
    if(isset($word['#style']['color'])){
      $words.= 'forecolor="'.$word['#style']['color'].'";';
    }
    $words .= "}\n";
  }

  $words .= "}\n";

  foreach($data['graph']['links'] as $link){
    $links .= $link['source'] . " -&gt; " . $link['target'] . '{ label="' . $link['label'] . '"; ';
    if(isset($link['#style']['color'])){
      $links.= 'forecolor="'.$link['#style']['color'].'";';
    }
    if(isset($link['#style']['link-color'])){
      $links.= 'color="'.$link['#style']['link-color'].'";';
    }
    
    $links .= "}\n";
  }

  $links .= "}\n";
  
  /*foreach($data['graph']['chunks'] as $chunks){

  }*/

  $graph .= $words;
  $graph .= $links;
  
  $graph = preg_replace("/\n/", "<br>", $graph);
  
  return $graph;
}

function dep2pict2depGraph($data){
  $graph = parseObjects($data);
  $dep_graph_array['graph'] = $graph;
  return json_encode($dep_graph_array);
}

function parseObjects($data){
  $graph['#style'] = array();
  $graph['words'] = array();
  $graph['links'] = array();
  $graph['chunks'] = array();
  $data = str_replace("\n", "", $data);
  $graph_match = array();
  preg_match_all("/\[(\w+)\]\s*{([^{]*?)}/m", $data, $graph_match, PREG_SET_ORDER);
  $params = array();
  preg_match_all("/(.*?)=(.*?);/m", $graph_match[0][2], $params, PREG_SET_ORDER);
  foreach($params as $param){
    attributeTranslate($graph,trim($param[1]),trim($param[2]," \""));
  }
  
  $data = preg_replace("/(\w+)\s*(->|-&gt;)\s*(\w+)\s*{/m", "{ target = $3; source = $1; ", $data);
  $data = preg_replace("/{([^{]*?)}/m", "--object-begin--$1--object-end--", $data);
  $matches = array();
  preg_match_all("/\[(\w+)\]\s*{([^{]*?)}/m", $data, $matches, PREG_SET_ORDER);
  foreach($matches as $match){
    $objects = array();
    preg_match_all("/(\w*)\s*--object-begin--(.*?)--object-end--/m", $match[2], $objects, PREG_SET_ORDER);
    if($match[1] == 'WORDS'){
      $bundle = &$graph['words'];
    }else if($match[1] == 'GROUPS'){
      $bundle = &$graph['chunks'];
    }else if($match[1] == 'EDGES'){
      $bundle = &$graph['links'];
    }
    foreach ($objects as $object){
      $params = array();
      $item = &$bundle[];
      preg_match_all('/(.*?)\s*(=\s*("(.*?)"|.*?))?\s*(;|$)/m', $object[2], $params, PREG_SET_ORDER);
      if($object[1]!=""){
        $item['id'] = trim($object[1]);
      }
      foreach($params as $param){
        $param[1] = trim($param[1]);
        if($param[1] == ""){
          continue;
        }
        $param[4] = trim($param[4]);
        $param[3] = trim($param[3]);
        $param[4]=($param[4]=="")?(($param[3]!="")?$param[3]:true):$param[4];
        attributeTranslate($item,trim($param[1]),trim($param[4]));
      }
    }
    
  }
  foreach($graph['chunks'] as &$chunk){
    $chunk['elements'] = getChunk($graph['words'],$chunk['words']);
    $chunk['label'] = $chunk['id'];
    $chunk['sublabel'] = explode('#', $chunk['subword']);
    if(isset($chunk['background']))
      $chunk['#style']['background-color']=$chunk['background'];
    unset($chunk['words']);
    unset($chunk['subword']);
  }
  foreach($graph['words'] as &$word){
    if(isset($word['subword'])){
      $word['sublabel'] = explode('#', $word['subword']);
    }
    if(isset($word['word'])){
      $word['label'] = $word['word'];
    }
    unset($word['word']);
    unset($word['subword']);
  }
  return $graph;
}

function getSubLabels($subWordString){
  $matches = array();
  
  
}

function getChunk($words,$chunkString){
  $group = array();
  $matches = array();
  preg_match("/(\w+)\.\.(\w+)/", $chunkString, $matches);
  $group = array($matches[1],$matches[2]);
  /*$append = false;
  foreach($words as $word){
    if($word['id']==trim($matches[1])){
      $append = true;
    }
    if($append){
      $group[]=$word['id'];
    }
    if($word['id'] == trim($matches[2])){
      return $group;
    }
  }*/
  return $group;
}

function attributeTranslate(&$item,$attr,$value){
  if($attr == 'forecolor'){
    $item['#style']['color'] = $value;
  }else if($attr == 'subcolor'){
    $item['#style']['sub-color'] = $value;
  }else if($attr == 'italic'){
    $item['#style']['font-style'] = 'italic';
  }else if($attr == 'bold'){
    $item['#style']['font-weight'] = 'bold';
  }else if($attr == 'background'){
    $item['#style']['background-color'] = $value;
  }else if($attr == 'bordercolor'){
    $item['#style']['border-color'] = $value;
  }else if($attr == 'color'){
    $item['#style']['link-color'] = $value;
  }else if($attr == 'fontname'){
    $item['#style']['font-family'] = $value;
  }else if($attr == 'margin_left'){
    $item['#style']['margin-left'] = $value;
  }else if($attr == 'margin_right'){
    $item['#style']['margin-right'] = $value;
  }else if($attr == 'margin_top'){
    $item['#style']['margin-top'] = $value;
  }else if($attr == 'margin_bottom'){
    $item['#style']['margin-bottom'] = $value;
  }else if($attr == 'margin'){
    $item['#style']['margin'] = $value;
  }else if($attr == 'style'){
    $item['#style']['stroke-dasharray'] = ($value=='dot')?'1,1':(($value=='dash')?'5,5':'none');
  }else{
    $item[$attr] = $value;
  }
}

/*********************************************************/
/*                    depxml                             */
/*********************************************************/


function depGraph2depXML($data){
  if(function_exists('module_load_include')){
    module_load_include("inc", "mgwiki","mgwiki.utils");
    module_load_include('module','parser');
  }else{
    return null;
  }
  
  return $data;
}

function comp_node_position($a,$b){
  if($a["#data"]['left']==$b["#data"]['left']){
    if($a["#data"]['right']==$b["#data"]['right']){
      if($a['id']<$b['id']){
        return -1;
      }else{
        return 1;
      }
    }else if($a["#data"]['right']<$b["#data"]['right']){
      return -1;
    }else{
      return 1;
    }
  }else if($a["#data"]['left']<$b["#data"]['left']){
    return -1;
  }else{
    return 1;
  }
}

function depXML2depGraph($xml_data){
  $edge_used_keys = array('label','source','target');
  $graph = &$dep_graph_array['graph'];
  $graph['words'] = array();
  $graph['links'] = array();
  if(is_string($xml_data)){
    $xml_data = new SimpleXMLElement($xml_data);    
  }
  if(isset($xml_data['options']) && (string)$xml_data['options'] != ''){
    $graph['options'] = (string) $xml_data['options'];
    if(!isset($graph['#style'])){
      $graph['#style'] = array();
    }
    $graph['#style']['background-color'] = '#fff3da';
  }else{
    $graph['params'] = '';
  }
  
  if(isset($xml_data['highlighting'])){
    $graph['highlighting'] = (string) $xml_data['highlighting'];
    $graph['highlighting'] = preg_split("/,/", $graph['highlighting']);
  }
  
  
  $duplicatedTokenEdgeIndex = 0;
  foreach($xml_data->cluster as $cluster){
    $cluster;
  }
  
  
  $clusters = array();
  $merged_nodes = array();
  
  $i = 0;
  foreach($xml_data->node as $node){
    $node_obj = &$graph['words'][];
    $node_obj['sublabel'] = array();
    foreach($node->attributes() as $key => $value) {
      $value = "$value";
      if($key == "cluster"){
        $node_obj["#data"][$key] = $value;
        
        // merge some nodes
        /*$node_ids = array_keys($clusters,$value);
        $mergeHappened = false;
        foreach($node_ids as $nodeid){
          $mergeCond = $graph['words'][$nodeid]['#data']['cat'] == (string)$node['cat'];
          if($mergeCond){
            unset($graph['words'][$i]);
            $merged_nodes[(string)$node['id']] = $graph['words'][$nodeid]['id'];
            $mergeHappened = true;
            break;
          }
        }
        if($mergeHappened){
           break;
        }else{
          $clusters[$i] = $value; 
        }*/
        
        
        $associated_clusters = $xml_data->xpath("//cluster[@id = '$value']");
        
        foreach($associated_clusters as $cluster){ // should be only one
          if(count($associated_clusters)>1 && (string)$cluster['token']!=(string)$node['form']){
            continue;
          }
          foreach($cluster->attributes() as $ckey => $cvalue){
            if($ckey == 'id'){ 
              continue;
            }else{
              $node_obj["#data"][$ckey] = "$cvalue";
            }
          }
        }
        continue;
      }
      if($key=='id'){
        //$node_obj['label'] = $value;
        $node_obj[$key] = $value;
      }else if($key == 'lemma'){
        $node_obj['sublabel'][] = $value;
        $node_obj["#data"][$key] = $value;
      }
      else if($key == 'cat'){
        $node_obj['sublabel'][] = $value;
        $node_obj["#data"][$key] = $value;
      }else{
        $node_obj["#data"][$key] = $value;
      }
    }
    highlighting($graph,$node_obj);
    if(!isset($node_obj['label']) || $node_obj['label'] == ""){
      $node_obj['label'] = "_";
    }
    if(count($node_obj['sublabel']) != 2){
      for($i=count($node_obj['sublabel']);$i<2;$i++){
        $node_obj['sublabel'][] = "_";
      }
    }
    foreach($node_obj['sublabel'] as &$sublabel){
      if($sublabel == ""){
          $sublabel = "_";
      }
    }
    $node_obj['sublabel'] = array_reverse($node_obj['sublabel']);
    $i++;
  }
  usort($graph['words'],'comp_node_position');
  
  $tokens = array();
  foreach($graph['words'] as &$word){
    $lex = $word['#data']['lex'];
    $lexparts = preg_split("/\|/",$lex);
    if($lexparts == null || count($lexparts)<2){
      $word['label'] = $word['#data']['token'];
    }
    
    if(!isset($tokens[$lexparts[0]]) || empty($lexparts[0])){
      $tokens[$lexparts[0]] = $word['id'];
      if(count($lexparts) ==2){
        $word['label'] = $lexparts[1];
      }else{
        $word['label'] = $word['#data']['token'];
      }
    }else{
      $duplicatedTokenEdge = $xml_data->addChild("edge");
      $duplicatedTokenEdge->addAttribute("label","");
      $duplicatedTokenEdge->addAttribute("id","C".$duplicatedTokenEdgeIndex++);
      $duplicatedTokenEdge->addAttribute("source",$tokens[$lexparts[0]]);
      $duplicatedTokenEdge->addAttribute("target",$word['id']);
      
      // type of the duplicated token (ellipsis or segmentation)
      $nodeA = getTheOnlyEltInArrayOrReturnFalse($xml_data->xpath("//node[@id = '".$tokens[$lexparts[0]]."']"));
      $nodeB = getTheOnlyEltInArrayOrReturnFalse($xml_data->xpath("//node[@id = '".$tokens[$lexparts[0]]."']"));
      $type = "ellipsis";
      if($nodeA === false || $nodeB === false){
        Logger::Log("error when retrieving nodes for type duplicated token type specification");
      }else{
        if((string) $nodeA['form'] != (string) $nodeB['form'] ){
          $type = "segmentation";
        }
      }
      
      
      $duplicatedTokenEdge->addAttribute("type",$type);
      $word['label'] = "_";
    }
  }
  
  $n= count($graph['words']);
  for($i = 0;$i<$n; $i++){
    $node_obj = &$graph['words'][$i];
    $node_obj['#position'] = $i; 
  }
  foreach($xml_data->edge as $edge){
    $link_obj = &$graph['links'][];
    foreach($edge->attributes() as $key => $value) {
      $value = "$value";
      if($key=='id'){
        $link_obj[$key] = $value;
      }else if(array_search($key, $edge_used_keys)!==false){
        if($key == "source" || $key == "target"){
          /*foreach($merged_nodes as $origin => $target){
            if($origin == $value){
              $value = $target;
              break;
            }
          }*/
        }
        $link_obj[$key] = $value;
      }else{
        if($key=='type'){
          if(!isset($link_obj['#style'])){
            $link_obj['#style'] = array();
          }
          $color = getTypeColor($value);
          if($value=="ellipsis"){
            $link_obj['#style']['oriented'] = false;
            $link_obj['#style']['stroke-dasharray'] = "5, 5, 1, 5"; // dash <dash-length>,<gap-length>,... if not pair then the list is concatenated with itself
          }
          $link_obj['#style']['link-color'] = $color;
        }
        $link_obj["#data"][$key] = $value;
      }
    }
    highlighting($graph,$link_obj);
  }
  
  // handle alternatives
  foreach($xml_data->cost as $cost){
    if((string) $cost['kept'] == 'yes'){
      continue; // skip, this edge is already in the graph
    }
    if(substr($cost['eid'],0,4) == 'root'){
      continue; //TODO handle root edges
    }
    $id =  (string) $cost['eid'];
    $info = trim((string)$cost['info'],"[]");
    $info = preg_split("/,/", $info);
    $target_nodes = retrieveCorrespondingNodes($graph['words'], $cost['target']);
    $source_node = retrieveBestCorrespondingNode($graph['words'], $cost['source'], $info[1]);
    foreach($target_nodes as &$node){
      $alternative = null;
      if(isset($node['#data']['alternatives'])){
        foreach($node['#data']['alternatives'] as $alt){
          if($alt['source']==$source_node['id'] && $alt['target'] == $node['id'] && $info[2] == $alt['label']){
            $alternative = $alt;
            break;
          }
        }
      }
      if($alternative != null){
        $found = false;
        foreach ($alternative['ref_ids'] as $ref_ids){
          if($ref_ids == $id){
            $found = true;
            break;
          }
        }
        if(!$found){
          $alternative['ref_ids'][] = $id;
        }
        continue;
      }
      if($source_node['id'] == null){
        // TODO SHOULD NOT HAPPEND
        //Logger::Log($id,"source node id is null");
      }
      $type = (string) $info[3];
      $node['#data']['alternatives'][] = array(
          'id' => $id,
          'ref_ids' => array($id),
          '#data' => array(
            'w' => (string) $cost['w'],
            'virtual' => true
          ),
          '#style' => array(
              'link-color' => getTypeColor($type)
          ),
          'label' => $info[2],
          'source' => $source_node['id'],
          'target' => $node['id'],
      );
    }
  }
  return json_encode($dep_graph_array);
}

function highlighting($graph,&$obj){
  if(isset($graph['highlighting']) && $graph['highlighting'] != null){
    foreach($graph['highlighting'] as $id){
      if($obj['id'] == $id){
        if(!isset($obj['#style'])){
          $obj['#style'] = array();
        }
        $obj['#style']['highlighted'] = true;
        break;
      }
    }
  }
}

function getTypeColor($type){
  $color = 'black';
  if($type == 'subst'){
    $color = '#409AFF';
  }else if($type == 'lexical'){
    $color = '#FF73E4';
  }else if($type == 'skip'){
    $color = '#FF73E4';
  }else if($type == 'adj'){
    $color = '#FF4040';
  }else if($type == 'ellipsis'){
    $color = '#AAAAAA';
  }
  return $color;
}

function retrieveBestCorrespondingNode($words,$cluster_id,$cat){
  $best = null;
  $parts = preg_split("/_/",$cluster_id);
  $i = 0;
  foreach($words as $word){
    $bounds = preg_split("/_/", $word['#data']['cluster']);
    $cond = ($bounds[1]>= $parts[1] && $bounds[1] < $parts[2]) || ($bounds[2]> $parts[1] && $bounds[2] <= $parts[2]);
    if($parts[1] == $parts[2]){
      $cond = $bounds[1] == $parts[1] && $bounds[2] == $parts[2];
    }
    if($cond){
      $best = $word;
      if($word['#data']['cat'] == $cat){
        return $word;
      }
    }
  }
  return $best;
}

function retrieveCorrespondingNodes(&$words,$cluster_id){
  $nodes = array();
  $parts = preg_split("/_/",$cluster_id);
  foreach($words as &$word){
    $bounds = preg_split("/_/", $word['#data']['cluster']);
    $cond = ($bounds[1]>= $parts[1] && $bounds[1] < $parts[2]) || ($bounds[2]> $parts[1] && $bounds[2] <= $parts[2]);
    if($parts[1] == $parts[2]){
      $cond = $bounds[1] == $parts[1] && $bounds[2] == $parts[2];
    }
    if($cond){
      $nodes[] = &$word;
    }
  }
  return $nodes;
}


/*********************************************************/
/*                    PASSAGE                            */
/*********************************************************/


function passage2depGraph($xml_data){
  $edge_used_keys = array('label','source','target');
  $graph = &$dep_graph_array['graph'];
  $graph['words'] = array();
  $graph['links'] = array();
  $graph['chunks'] = array();
  $tokens = array();


  if(is_string($xml_data)){
    $xml_data = new SimpleXMLElement($xml_data);    
  }
  
  if(isset($xml_data['highlighting'])){
    $graph['highlighting'] = (string) $xml_data['highlighting'];
    $graph['highlighting'] = preg_split("/,/", $graph['highlighting']);
  }
  
  
  $result = $xml_data->xpath("//T");
  foreach($result as $token){
    $tokens[(string)$token['id']] = trim((string)$token);
  }
  
  $result = $xml_data->xpath("//W");
  foreach($result as $node){
    $node_obj = &$graph['words'][];
    $node_obj['label'] = passageGetTokens((string)$node['tokens'],$tokens);
    $node_obj['sublabel'] = array();
    $node_obj['sublabel'][] = (string)$node["lemma"];
    $node_obj['sublabel'][] = (string)$node["pos"];
    $node_obj['#data'] = array(
      "pos"=>(string)$node["pos"],
      "lemma"=>(string)$node["lemma"]
    );
    $node_obj['id'] = (string)$node['id'];
  }

  $result = $xml_data->xpath("//G");
  foreach($result as $chunk){
    $chunk_obj = &$graph['chunks'][];
    $chunk_obj['label'] = (string)$chunk['type'];
    $chunk_obj['id'] = (string)$chunk['id'];
    $chunk_obj['elements'] = array();
    foreach ($chunk->W as $node) {
      $chunk_obj['elements'][] = (string)$node['id'];
    }
  }

  $result = $xml_data->xpath("//R");
  $n = count($result);
  foreach($result as $link){
    passageGetLink($link,$graph['links'],$n);
  }

  return json_encode($dep_graph_array);
}

function passageGetLink($link,&$graphlinks,&$maxlinks){
  $edge = array();
  $edge['id'] = (string)$link['id'];
  $edgeType = (string)$link["type"];
  $edge['label'] = $edgeType;
  if($edgeType =="COORD"){
    $id = (string)$link['id'];
    $id2 = "";
    $maxlinks++;
    
    $id2 = preg_replace("/.*?R(\d+)/", $maxlinks, $id);
    
    $edge_obj1 = array();
    $edge_obj2 = array();
    $edge_obj1["id"] =  $id;
    $edge_obj1["label"] = "COORD-G";
    $edge_obj2["id"] =  $id2;
    $edge_obj2["label"] = "COORD-D";
    
    $source = $link->coordonnant[0];
    $target = (count($link->{"coord-g"})>0)?$link->{"coord-g"}[0]:null;
    if($target != null && $source != null){
      $edge_obj1["source"]= (string)$source['ref'];
      $edge_obj1["target"]= (string)$target['ref'];
      $graphlinks[] = $edge_obj1;
      
    }
    
    $target = (count($link->{"coord-d"})>0)?$link->{"coord-d"}[0]:null;
    if($target != null && $source != null){
      $edge_obj2["source"]= (string)$source['ref'];
      $edge_obj2["target"]= (string)$target['ref'];
      $graphlinks[] = $edge_obj2;
      
    }       
    
    
    return;
  }else if($edgeType =="SUJ-V"){
    $sourceKey = "verbe";
    $targetKey = "sujet";
  }else if($edgeType =="CPL-V"){
    $sourceKey = "verbe";
    $targetKey = "complement";
  }else if($edgeType =="MOD-N"){
    $sourceKey = "nom";
    $targetKey = "modifieur";
  }else if($edgeType =="AUX-V"){
    $sourceKey = "verbe";
    $targetKey = "auxiliaire";
  }else if($edgeType =="COD-V"){
    $sourceKey = "verbe";
    $targetKey = "cod";
  }else if($edgeType =="MOD-V"){
    $sourceKey = "verbe";
    $targetKey = "modifieur";
  }else if($edgeType =="COMP"){
    $sourceKey = "verbe";
    $targetKey = "complementeur";
  }else if($edgeType =="MOD-A"){
    $sourceKey = "adjectif";
    $targetKey = "modifieur";
  }else if($edgeType =="APPOS"){
    $sourceKey = "premier";
    $targetKey = "appose";
  }else if($edgeType =="JUXT"){
    $sourceKey = "premier";
    $targetKey = "suivant";
  }else if($edgeType =="MOD-R"){
    $sourceKey = "adverbe";
    $targetKey = "modifieur";
  }else if($edgeType =="MOD-P"){
    $sourceKey = "preposition";
    $targetKey = "modifieur";
  }else if($edgeType =="ATB-SO"){
    $sourceKey = "verbe";
    $targetKey = "attribut";
    //@todo keep s-o information
  }else{

  }
  $edge['target'] = (count($link->{$targetKey})>0)?$link->{$targetKey}[0]:null;
  $edge['source'] = (count($link->{$sourceKey})>0)?$link->{$sourceKey}[0]:null;
  $edge['target'] = (string)$edge['target']['ref'];
  $edge['source'] = (string)$edge['source']['ref'];
  $graphlinks[] = $edge;
}

function passageGetTokens($tokens_id,$tokens){
  $tokens_id_array = explode(" ", $tokens_id);
  $tokenstring = "";
  for($i=0;$i<count($tokens_id_array);$i++){
    $tokenstring.= " " . $tokens[$tokens_id_array[$i]];
  }
  return trim($tokenstring);
}