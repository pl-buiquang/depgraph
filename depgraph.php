<?php

class DepGraph{

  private $html = null;
  
  
  /**
   * Constructs the graph
   * @param unknown $data an associative array representing the graph
   * @param unknown $options an associative array containing the options for the graph
   */
  function __construct($data,$options){
    $this->options = $options;
    
    // set default options
    $this->options['uid'] = isset($options['uid'])?$options['uid']:uniqid();
    
    
    // construct the graph dom
    $this->setData($data);
    $this->constructLayout();
    $this->update();
    $this->postProcesses();
  }
  
  
  /**
   * Construct the layout container for the graph
   */
  function constructLayout(){
    $this->html = new DOMDocument();
    $root = $this->root = $this->html->createElement('div');
    $root->setAttribute("id", "graph-container-".$this->options['uid']);
    $this->html->appendChild($root);
    $chart = $this->chart = $this->html->createElement('div');
    $chart->setAttribute('id', 'chart-'.$this->options['uid']);
    $root->appendChild($chart);
    $this->svg = $this->html->createElement('svg');
    $this->svg->setAttribute('width', "100%");
    $this->svg->setAttribute('height', "100%");
    $chart->appendChild($this->svg);
    $this->vis = $this->html->createElement('g');
    $margin = $this->data['graph']['#style']['margin'];
    $transform = 'translate('.removeUnit($margin['left']).','.removeUnit($margin['top']).') scale(1)';
    $this->vis->setAttribute('transform', $transform);
    $this->svg->appendChild($this->vis);
    
    $this->setSVGDefs();
  }
  
  /**
   * Copy and prepare the data for graph html dom creation
   * @param unknown $data
   */
  function setData($data){
    $this->data = $data;
    $this->prepareData();
  }
  
  
  /**
   * Prepare the data setting default values and resolving formatting
   */
  function prepareData(){
    $this->resolveReferences($this->data);
    
    // setting internal ids, word position, and link properties
    $this->id = 0;
    $position=0;
    foreach($this->data['graph']['words'] as &$word){
      $word['#id'] = $this->id++;
      $word['#position'] = $position++;
    }
    
    foreach($this->data['graph']['links'] as &$link){
      $link['#id'] = $this->id++;
      $link['#properties'] = null;
    }
    
    if(isset($this->data['graph']['chunks'])){
      foreach($this->data['graph']['chunks'] as &$chunk){
        $chunk['#id'] = $this->id++;
      }
    }
    
    $this->data['graph']['#style'] = isset($this->data['graph']['#style'])?$this->data['graph']['#style']:array();
    $this->data['graph']['#word-style']=isset($this->data['graph']['#word-style'])?$this->data['graph']['#word-style']:array();
    $this->data['graph']['#link-style']=isset($this->data['graph']['#link-style'])?$this->data['graph']['#link-style']:array();
    $this->data['graph']['#chunk-style']=isset($this->data['graph']['#chunk-style'])?$this->data['graph']['#chunk-style']:array();
    
    $globalStyle = &$this->data['graph']['#style'];
    $wordStyle = &$this->data['graph']['#word-style'];
    $linkStyle = &$this->data['graph']['#link-style'];
    $chunkStyle = &$this->data['graph']['#chunk-style'];
    
    // Set default value for requiered fields
    // Global Style
    $globalStyle['margin'] = isset($globalStyle['margin'])?$globalStyle['margin']:array('top'=>'50px','right'=>'20px','bottom'=>'20px','left'=>'20px');
    $globalStyle['margin']['top'] = isset($globalStyle['margin-top'])?$globalStyle['margin-top']:$globalStyle['margin']['top'];
    $globalStyle['margin']['right'] = isset($globalStyle['margin-right'])?$globalStyle['margin-right']:$globalStyle['margin']['right'];
    $globalStyle['margin']['left'] = isset($globalStyle['margin-left'])?$globalStyle['margin-left']:$globalStyle['margin']['left'];
    $globalStyle['margin']['bottom'] = isset($globalStyle['margin-bottom'])?$globalStyle['margin-bottom']:$globalStyle['margin']['bottom'];
    $globalStyle['background-color'] = isset($globalStyle['background-color'])?$globalStyle['background-color']:'white';
    $globalStyle['font-family'] = isset($globalStyle['font-family'])?$globalStyle['font-family']:'inherit';
    
    // Words Style
    $wordStyle['margin'] = isset($wordStyle['margin'])?$wordStyle['margin']:array('top'=>'10px','right'=>'15px','bottom'=>'10px','left'=>'15px');
    $wordStyle['sub-margin'] = isset($wordStyle['sub-margin'])?$wordStyle['sub-margin']:array('top'=>'4px','right'=>'4px','bottom'=>'4px','left'=>'4px');
    $wordStyle['font-size'] = isset($wordStyle['font-size'])?$wordStyle['font-size']:'14px';
    $wordStyle['sub-font-size'] = isset($wordStyle['sub-font-size'])?$wordStyle['sub-font-size']:'10px';
    $wordStyle['color'] = isset($wordStyle['color'])?$wordStyle['color']:'black';
    $wordStyle['sub-color'] = isset($wordStyle['sub-color'])?$wordStyle['sub-color']:'black';
    $wordStyle['font-weight']=isset($wordStyle['font-weight'])?$wordStyle['font-weight']:'normal';
    $wordStyle['sub-font-weight']=isset($wordStyle['sub-font-weight'])?$wordStyle['sub-font-weight']:'normal';
    $wordStyle['font-style']=isset($wordStyle['font-style'])?$wordStyle['font-style']:'normal';
    $wordStyle['sub-font-style']=isset($wordStyle['sub-font-style'])?$wordStyle['sub-font-style']:'normal';
    
    // Links Style
    $linkStyle['margin'] = isset($linkStyle['margin'])?$linkStyle['margin']:array('top'=>'5px','right'=>'10px','bottom'=>'10px','left'=>'10px');
    $linkStyle['font-size'] = isset($linkStyle['font-size'])?$linkStyle['font-size']:'12px';
    $linkStyle['color'] = isset($linkStyle['color'])?$linkStyle['color']:'black';
    $linkStyle['link-color'] = isset($linkStyle['link-color'])?$linkStyle['link-color']:'#000000';
    $linkStyle['link-size'] = isset($linkStyle['link-size'])?$linkStyle['link-size']:'2px';
    $linkStyle['font-weight']= isset($linkStyle['font-weight'])?$linkStyle['font-weight']:'normal';
    $linkStyle['font-style']=isset($linkStyle['font-style'])?$linkStyle['font-style']:'normal';
    $linkStyle['oriented']=isset($linkStyle['oriented'])?$linkStyle['oriented']:true;
    $linkStyle['align']=isset($linkStyle['align'])?$linkStyle['align']:'center';
    $linkStyle['higlighted'] = false;
    
    // Chunks Style
    $chunkStyle['margin'] = isset($chunkStyle['margin'])?$chunkStyle['margin']:array('top'=>'10px','right'=>'10px','bottom'=>'10px','left'=>'10px');
    $chunkStyle['sub-margin'] = isset($chunkStyle['sub-margin'])?$chunkStyle['sub-margin']:array('top'=>'4px','right'=>'4px','bottom'=>'4px','left'=>'4px');
    $chunkStyle['font-size'] = isset($chunkStyle['font-size'])?$chunkStyle['font-size']:'12px';
    $chunkStyle['sub-font-size'] = isset($chunkStyle['sub-font-size'])?$chunkStyle['sub-font-size']:'10px';
    $chunkStyle['background-color'] = isset($chunkStyle['background-color'])?$chunkStyle['background-color']:'transparent';
    $chunkStyle['color'] = isset($chunkStyle['color'])?$chunkStyle['color']:'black';
    $chunkStyle['sub-color'] = isset($chunkStyle['sub-color'])?$chunkStyle['sub-color']:'black';
    $chunkStyle['border-color'] = isset($chunkStyle['border-color'])?$chunkStyle['border-color']:'black';
    $chunkStyle['font-weight']=isset($chunkStyle['font-weight'])?$chunkStyle['font-weight']:'normal';
    $chunkStyle['sub-font-weight']=isset($chunkStyle['sub-font-weight'])?$chunkStyle['sub-font-weight']:'normal';
    $chunkStyle['font-style']=isset($chunkStyle['font-style'])?$chunkStyle['font-style']:'normal';
    $chunkStyle['sub-font-style']=isset($chunkStyle['sub-font-style'])?$chunkStyle['sub-font-style']:'normal';
    $chunkStyle['border-size']=isset($chunkStyle['border-size'])?$chunkStyle['border-size']:'1px';
  }
  
  function setSVGDefs(){
    $defs = $this->html->createElement("defs");
    $this->svg->appendChild($defs);
    
    $marker = $this->html->createElement("marker");
    $defs->appendChild($marker);
    $marker->setAttribute('id', 'arrow-'.$this->options['uid']);
    $marker->setAttribute('viewBox', "0 0 10 10");
    $marker->setAttribute('refX', '8');
    $marker->setAttribute('refY', '5');
    $marker->setAttribute('markerUnits', 'strokeWidth');
    $marker->setAttribute('orient', 'auto');
    $marker->setAttribute('markerWidth', '3');
    $marker->setAttribute('markerHeight', '3');
    
    $polyline = $this->html->createElement('polyline');
    $marker->appendChild($polyline);
    $polyline->setAttribute('points', '0,0 10,5 0,10 1,5');
  }
  
  /**
   * Update the graph with the data
   */
  function update(){

    if(isset($this->data['graph']['chunks'])){
      $this->prepareChunks();
    }
    
    foreach($this->data['graph']['words'] as &$word){
      $this->createWord($word);
    }
    
    if(isset($this->data['graph']['chunks'])){
      foreach($this->data['graph']['chunks'] as &$chunk){
        $this->createChunk($chunk);
      }
    }
    
    $this->preprocessLinksPosition();
    foreach($this->data['graph']['links'] as &$link){
      $this->createLink($link);
    }
  }
  
  function postProcesses(){
    $margin = $this->data['graph']['#style']['margin'];
    $transform = 'translate('.removeUnit($margin['left']).','.(removeUnit($margin['top'])+removeUnit($margin['bottom'])+$this->absMaxLinkStrate*40).') scale(1)';
    $this->vis->setAttribute('transform', $transform);
    $bbox = $this->computeApproximateBBox();
    $this->width = $bbox['width'];
    $this->height = $bbox['height'];
    $this->svg->setAttribute("width", $bbox['width'].'px');
    $this->svg->setAttribute("height", $bbox['height'].'px');
    $this->setStyleAttr($this->chart, "width", $bbox['width'].'px');
    $this->setStyleAttr($this->chart, "height", $bbox['height'].'px');
    $this->setStyleAttr($this->chart, "display", 'block');
    $this->setStyleAttr($this->root, "display", 'block');
    $this->setStyleAttr($this->chart, "border", '1px solid black');
  }
  
  /**
   * Returns the style of a data element by searching inner style then global style and finally default value
   * @param unknown $element
   * @param unknown $property
   * @param unknown $defaultValue
   * @return Ambigous <NULL, unknown>
   */
  function getStyle($element,$property,$defaultValue = null){
    $value = null;
    if(isset($element['#style']) && isset($element['#style'][$property])){
      $value = $element['#style'][$property];
    }else {
      $classname = $this->getType($element);
      if($classname != 'undefined' && isset($this->data['graph']['#'.$classname.'-style'][$property])){
        $value = $this->data['graph']['#'.$classname.'-style'][$property];
      }else{
        $value = $defaultValue;
      }
    }
    return $value;
  }
  
  /**
   * return the type of an element
   * @param unknown $element
   * @return string (word,link,chunk) or undefined
   */
  function getType($element){
    if(isset($element['#position'])){
      return 'word';
    }else if(isset($element['source']) && isset($element['target'])){
      return 'link';
    }else if(isset($element['elements'])){
      return 'chunk';
    }else{
      return 'undefined';
    }
  }
  
  /**
   * Get a word by its original id
   * @param unknown $id
   * @return unknown|NULL
   */
  function &getWordNodeByOriginalId($id){
    $return = null;
    foreach ($this->data['graph']['words'] as $word){
      if($word['id'] == $id){
        return $word;
      }
    }
    
    return $return;
  }
  
  function &getChunkNodeByOriginalId($id){
    $return = null;
    foreach ($this->data['graph']['chunks'] as $chunk){
      if($chunk['id'] == $id){
        return $chunk;
      }
    }
    return $return;
  }
  
  /**
   * Resolve the graph data references (@...)
   * @param unknown $data
   */
  function resolveReferences($data){
    
  }
  
  /**
   * Get a word by its position (#position)
   * @param unknown $position
   */
  function &getWordByPosition($position){
    $return =null;
    foreach($this->data['graph']['words'] as &$word){
      if($word['#position'] == $position){
        return $word;
      }
    }
    return $return;
  }
  
  /**
   * returns the computed size of the box of an word svg element
   * @param unknown $element
   * @return array the bbox
   */
  function getWordBBox($element,$node=null,&$bbox = null){
    $yMagicNumber = -13;
    if(!$node){
      $node = $element['#node'];
    }
    
    if($bbox == null){
      $bbox = array('x'=>0,'y'=>0,'width'=>0,'height'=>0);
    }

    if(get_class($node) == 'DOMText' || $node->tagName == 'tspan'){
      $strlen;
      if(get_class($node) == 'DOMText'){
        $strlen = strlen($node->wholeText);
      }else{
        $strlen = strlen($node->nodeValue);
      }
      $fontSize = $this->getStyle($element, 'font-size', '12px');
      $unit = substr($fontSize, -2);
      $factor = 1;
      if($unit == 'em'){
        // no idea how to get the body default px size.. :/
        trigger_error("Cannot handle em unit to compute bbox size");
        $factor = 12 * substr($fontSize,0,strlen($fontSize)-2);
      }else if($unit == 'px'){
        $factor = round(substr($fontSize,0,strlen($fontSize)-2)/2);
      }else{
        $factor = round($fontSize/2);
      }
      $width = $factor * $strlen;
      $bbox['width'] = max($width,$bbox['width']);
      $yOffset = 15;//$node->getAttribute('dy');
      $bbox['height'] += $yOffset;
      $bbox['y'] = $yMagicNumber;
    }else if($node->tagName == 'g' && $node->hasChildNodes()){
      foreach($node->childNodes as $child){
        $this->getWordBBox($element,$child,$bbox);
      }
    }else if($node->tagName == 'text' && $node->hasChildNodes()){
      foreach($node->childNodes as $child){
        $this->getWordBBox($element,$child,$bbox);
      }
    }else {
      
    }
    return $bbox;
  }
  
  /**
   * returns the computed size of the box of an chunk svg element
   * @param unknown $chunk
   * @return array the bbox
   */
  function getChunkBBox($chunk){
    return $chunk['#bbox'];
    /*$totalBBox = array('x'=>0,'y'=>0,'width'=>0,'height'=>0);
    foreach($chunk['elements'] as $element){
      $bbox = $this->getWordBBox($element);
      $totalBBox['width'] += $bbox['width'];
    }
    $wordMargins = $this->data['graph']['#word-style']['margin'];
    $wordMargin = removeUnit($wordMargin['left'])+removeUnit($wordMargin['right']);
    $totalBBox['width'] += count($chunk['elements'])*$wordMargin;*/
  }
  
  /**
   * Set the a pair of key/value to the style attribute of a dom element 
   * @param unknown $element
   * @param unknown $key
   * @param unknown $value
   */
  function setStyleAttr(&$element,$key,$value){
    $style = $element->getAttribute('style');
    $count = 0;
    $style = preg_replace('/('.$key.':)(.*?);/', "$1$value;", $style, -1, $count);
    if(!$count){
      $style .= " ".$key.":".$value.";";
    }
    $element->setAttribute('style',$style);
  }
  
  /**
   * Add chunk groups before words (svg layers issue)
   */
  function prepareChunks(){
    foreach($this->data['graph']['chunks'] as &$chunk){
      // create the dom node
      $node = $chunk['#node'] = &$this->html->createElement('g');
      $node->setAttribute('class', 'chunk');
      $node->setAttribute('foo', $this->id++);
      $this->vis->appendChild($node);
    }
  }
  
  /**
   * Add a word node to the graph dom
   * @param unknown $word
   */
  function createWord(&$word){
    // create the dom node
    $node = $this->html->createElement('g');
    $node->setAttribute('class', 'word');
    $this->vis->appendChild($node);
    $word['#node'] = &$node;
    
    
    // retrieve style variables
    $fontSize = $this->getStyle($word,'font-size');
    $subfontSize = $this->getStyle($word,'sub-font-size');
    $color = $this->getStyle($word,'color');
    $subColor = $this->getStyle($word,'sub-color');
    $fontWeight = $this->getStyle($word,'font-weight');
    $subfontWeight = $this->getStyle($word,'sub-font-weight');
    $fontStyle = $this->getStyle($word,'font-style');
    $subfontStyle = $this->getStyle($word,'sub-font-style');
    $margin = $this->getStyle($word, 'margin');
    
    $rect = $this->html->createElement('rect');
    $node->appendChild($rect);
    
    $text = $this->html->createElement('text');
    $node->appendChild($text);
    $label = $this->html->createElement('tspan',$word['label']);
    $this->setStyleAttr($label,'fill',$color);
    $this->setStyleAttr($label, 'font-style', $fontStyle);
    $this->setStyleAttr($label, 'font-weight', $fontWeight);
    $this->setStyleAttr($label, 'font-size', $fontSize);
    $text->appendChild($label);
    $sublabels = array();
    foreach($word['sublabel'] as $sublabel){
      $item = &$sublabels[];
      $item = $this->html->createElement('tspan',$sublabel);
      $this->setStyleAttr($item, 'font-style', $subfontStyle);
      $this->setStyleAttr($item, 'font-size', $subfontSize);
      $this->setStyleAttr($item, 'font-weight', $subfontWeight);
      $this->setStyleAttr($item, 'fill', $subColor);
      $item->setAttribute('x', '0px');
      $item->setAttribute('dy', '1.25em');
      $text->appendChild($item);
    }
    
    $highlight = 'none';
    if($this->getStyle($word,'highlighted',false)){
      $highlight = 'yellow';
    }
    
    $bbox = $this->getWordBBox($word);
    $rect->setAttribute('x',0);
    $rect->setAttribute('y',$bbox['y']);
    $rect->setAttribute('rx',10);
    $rect->setAttribute('ry',10);
    $rect->setAttribute('width',$bbox['width']);
    $rect->setAttribute('height',$bbox['height']);
    $this->setStyleAttr($rect, 'stroke',"transparent");
    $this->setStyleAttr($rect, 'fill',$highlight);
    $this->setStyleAttr($rect, 'stroke-width',1);
    
    $previousSibling = $this->getWordByPosition($word['#position']-1);
    if($previousSibling){
      $transform = getTransformValues($previousSibling['#node']);
      $bbox = $this->getWordBBox($previousSibling);
      $x = removeUnit(addPxs(array($transform['translate'][0],$bbox['width'],$margin['right'],$margin['left'])));
      $y = removeUnit($margin['top']);
      setGroupPosition($node,$x,$y);
    }else{
      $x = removeUnit($margin['left']);
      $y = removeUnit($margin['top']);
      setGroupPosition($node,$x,$y);
    }
    
  }
  
  /**
   * Add a chunk node to the graph dom
   * @param unknown $chunk
   */
  function createChunk(&$chunk){
    // create the dom node
    $node = &$chunk['#node'];
    
    $rect = $this->html->createElement("rect");
    $min = array('x' => 99999, 'y' => 99999);
    $max = array('x'=>0,'y'=>0);
    $n = count($chunk['elements']);
    for($i=0;$i<$n;$i++){
      $word = $this->getWordNodeByOriginalId($chunk['elements'][$i]);
      $transform = getTransformValues($word['#node']);
      $coord = array('x'=>$transform['translate'][0],'y'=>$transform['translate'][1]);
      $bbox = $this->getWordBBox($word);
      if($coord['x']+$bbox['x']<$min['x']){
        $min['x']=$coord['x']+$bbox['x'];
      }
      if($coord['y']+$bbox['y']<$min['y']){
        $min['y']=$coord['y']+$bbox['y'];
      }
      if($coord['x']+$bbox['width']+$bbox['x']>$max['x']){
        $max['x'] = $coord['x']+$bbox['width']+$bbox['x'];
      }
      if($coord['y']+$bbox['height']+$bbox['y']>$max['y']){
        $max['y'] =$coord['y']+$bbox['height']+$bbox['y'];
      }
    }
    $node->appendChild($rect);
  
    $margin = $this->getStyle($chunk,'margin');
    $fontSize = $this->getStyle($chunk,'font-size');
    $subfontSize = $this->getStyle($chunk,'sub-font-size');
    $color = $this->getStyle($chunk,'color');
    $subColor = $this->getStyle($chunk,'sub-color');
    $fontWeight = $this->getStyle($chunk,'font-weight');
    $subfontWeight = $this->getStyle($chunk,'sub-font-weight');
    $fontStyle = $this->getStyle($chunk,'font-style');
    $subfontStyle = $this->getStyle($chunk,'sub-font-style');
    $backgroundColor = $this->getStyle($chunk,'background-color');
    $borderColor = $this->getStyle($chunk,'border-color');
    $borderSize = $this->getStyle($chunk,'border-size');
  
    $line = $this->html->createElement('line');
    $line->setAttribute('y1',addPxs(array($max['y'],2*removeUnit($margin['top']))));
    $line->setAttribute('x1',0);
    $line->setAttribute('y2',addPxs(array($max['y'],2*removeUnit($margin['top']))));
    $line->setAttribute('x2',$max['x']-$min['x']+removeUnit($margin['left'])+removeUnit($margin['right']));
    $this->setStyleAttr($line,'stroke',$borderColor);
    $this->setStyleAttr($line,'stroke-width',$borderSize);
    $node->appendChild($line);
  
    $text = $this->html->createElement("text");
    $text->setAttribute('y',addPxs(array(20,$max['y'],2*removeUnit($margin['top']))));
    $node->appendChild($text);
    $tspan = $this->html->createElement('tspan',$chunk['label']);
    $text->appendChild($tspan);
    $this->setStyleAttr($tspan, 'fill', $color);
    $this->setStyleAttr($tspan, 'font-style', $fontStyle);
    $this->setStyleAttr($tspan, 'font-weight', $fontWeight);
    $this->setStyleAttr($tspan, 'font-size', $fontSize);
    if(isset($chunk['sublabel']) && count($chunk['sublabel'])){
      foreach($chunk['sublabel'] as $sublabel){
        $subtspan = $this->html->createElement('tspan',$sublabel);
        $text->appendChild($subtspan);
        $this->setStyleAttr($subtspan,'font-size',$subfontSize);
        $this->setStyleAttr($subtspan,'font-style',$subfontStyle);
        $this->setStyleAttr($subtspan,'font-weight',$subfontWeight);
        $this->setStyleAttr($subtspan,'fill',$subColor);
        $subtspan->setAttribute('dx',-(strlen($sublabel)-1)*removeUnit($subfontSize));
        $subtspan->setAttribute('dy','1.25em');
      }
    }
    
    $offset = $bbox['height'];
    $width = $max['x']-$min['x']+removeUnit($margin['left'])+removeUnit($margin['right']);
    $heightPx= addPxs(array($max['y'],-$min['y'],$offset,2*removeUnit($margin['top']),20));
    
    $bbox = $this->getWordBBox($word,$text);
    $text->setAttribute('x',-$bbox['width']/2+$width/2);
  
    $rect->setAttribute('x',0);
    $rect->setAttribute('y',0);
    $rect->setAttribute('rx',10);
    $rect->setAttribute('ry',10);
    $rect->setAttribute('width',$width);
    $rect->setAttribute('height',$heightPx);
    $this->setStyleAttr($rect,'fill',$backgroundColor);
    $this->setStyleAttr($rect,'stroke',$borderColor);
    $this->setStyleAttr($rect,'stroke-width',$borderSize);
  
    $chunk['#bbox'] = array('x'=>0,'y'=>0,'width'=>$width,'height'=>removeUnit($heightPx));
    setGroupPosition($node,$min['x']-removeUnit($margin['left']),$min['y']-removeUnit($margin['top']));
  }
  
  
  /**
   * Add a link node to the graph dom
   * @param unknown $link
   */
  function createLink(&$link){
    // create the dom node
    $node = $this->html->createElement('g');
    $node->setAttribute('class', 'link');
    $this->vis->appendChild($node);
    $link['#node'] = &$node;
    $p = $this->getLinkProperties($link);
    
    // retrieve style variables 
    $margin = $this->getStyle($link,'margin');
    $fontSize = $this->getStyle($link,'font-size');
    $color = $this->getStyle($link,'color');
    $linkColor = $this->getStyle($link,'link-color');
    $linkSize = $this->getStyle($link,'link-size');
    $fontWeight = $this->getStyle($link,'font-weight');
    $fontStyle = $this->getStyle($link,'font-style');
    $oriented = $this->getStyle($link,'oriented');
    $align = $this->getStyle($link,'align');
    $highlighted = $this->getStyle($link,'highlighted',false);
    $strokeDasharray = $this->getStyle($link,'stroke-dasharray','none');
    
    // for origin arcs (nodestart == null)
    $originArc = false;
    if(!$p['nodeStart']){
      $p['nodeStart'] = $p['nodeEnd'];
      $originArc = true;
    }
    
    // Positionning
    $hdir = ($this->getNodePosition($p['nodeEnd'])-$this->getNodePosition($p['nodeStart'])>0)?1:-1;
    $vdir = ($p['strate']>0)?1:-1;
    $transf0 = getTransformValues($p['nodeStart']['#node']);
    $transf1 = getTransformValues($p['nodeEnd']['#node']);
    $X0 = $transf0['translate'];
    $X1 = $transf1['translate'];
    $SBBox=0;
    $EBBox=0;
    if($this->getType($p['nodeStart'])=='chunk'){
      $SBBox = $this->getChunkBBox($p['nodeStart']);
    }else{
      $SBBox = $this->getWordBBox($p['nodeStart']);
    }
    if($this->getType($p['nodeStart'])=='chunk'){
      $EBBox = $this->getChunkBBox($p['nodeEnd']);
    }else{
      $EBBox = $this->getWordBBox($p['nodeEnd']);
    }
    $Sdx = $SBBox['width']/2;
    $Edx = $EBBox['width']/2;
    $minOffset = 3;
    $SxOffset = ($hdir>0)?5*$p['offsetXmin']+$minOffset:-5*$p['offsetXmax']-$minOffset;
    $ExOffset = ($hdir>0)?-5*$p['offsetXmax']-$minOffset:5*$p['offsetXmin']+$minOffset;
    $arcSize = 5;
    $x0 = $X0[0]+$Sdx+$SxOffset;
    $x1 = $X1[0]+$Edx+$ExOffset;
    $h = $x1-$x0-$hdir*2*$arcSize;
    //For missing main label and constant labels height
    if(!isset($this->wordY) || $this->wordY==null){
      $this->wordY=0;
      $this->wordHeight=0;
      foreach($this->data['graph']['words'] as $word){
        $bbox = $this->getWordBBox($word);
        if($this->wordY>$bbox['y']){
          $this->wordY=$bbox['y'];
        }
        if($this->wordHeight<$bbox['height']){
          $this->wordHeight=$bbox['height'];
        }
      }
    }
    // end of dirty code
    $SchunkCase0 = ($this->getType($p['nodeStart'])=='chunk')?$SBBox['height']:$SBBox['height']+$this->wordY;
    $EchunkCase0 = ($this->getType($p['nodeEnd'])=='chunk')?$EBBox['height']:$EBBox['height']+$this->wordY;
    $SchunkCase1 = ($this->getType($p['nodeStart'])=='chunk')?0:$this->wordY;
    $EchunkCase1 = ($this->getType($p['nodeEnd'])=='chunk')?0:$this->wordY;
    $Syanchor = ($vdir>0)?$SchunkCase1:$SchunkCase0;
    $Eyanchor = ($vdir>0)?$EchunkCase1:$EchunkCase0;
    $y0 = $X0[1]+$Syanchor;
    $y1 = $X1[1]+$Eyanchor;
    $height = 15;
    $strateOffset = 30;
    $v0 = -$vdir*$height-$strateOffset*$p['strate'];//-SchunkCase;
    if($originArc){
      $v0 = -$vdir*$height-$strateOffset*$vdir*$this->absMaxLinkStrate;
    }
    $v1 = -($v0+$y0-$y1);
    $laf0 = (1+$hdir*$vdir)/2;
    $laf1 = (1+$hdir*$vdir)/2;
    
    if($highlighted){
      $color2 = 'yellow';
    }else{
      $color2 = 'none';
    }
    
    $highlightPath = $this->html->createElement('path');
    $node->appendChild($highlightPath);
    $path = $this->html->createElement('path');
    $node->appendChild($path);

    if($originArc){
      $highlightPath->setAttribute('d',"M ".$x0.",".($y0+$v0)." v ".(-$v0));
      $path->setAttribute('d',"M ".$x0.",".($y0+$v0)." v ".(-$v0));
    }else{
      $highlightPath->setAttribute('d',"M ".$x0.",".$y0." v ".$v0." a 5 5 0 0 ".$laf0." ".$hdir*$arcSize." ".(-$vdir*$arcSize)." h ".$h." a 5 5 0 0 ".$laf1." ".$hdir*$arcSize." ".$vdir*$arcSize." v ".$v1);
      $path->setAttribute('d',"M ".$x0.",".$y0." v ".$v0." a 5 5 0 0 ".$laf0." ".$hdir*$arcSize." ".(-$vdir*$arcSize)." h ".$h." a 5 5 0 0 ".$laf1." ".$hdir*$arcSize." ".$vdir*$arcSize." v ".$v1);
    }
    $highlightPath->setAttribute('stroke',$color2);
    $highlightPath->setAttribute('stroke-width',removeUnit($linkSize)+3);
    $highlightPath->setAttribute('fill','none');
    
    $path->setAttribute('stroke',$linkColor);
    $path->setAttribute('stroke-dasharray',$strokeDasharray);
    $path->setAttribute('stroke-width',$linkSize);
    $path->setAttribute('fill','none');
    if($oriented){
      $path->setAttribute('marker-end','url(#arrow-'.$this->options['uid'].')');
    }
    
    // Label
    if(isset($link['label'])){
      $text = $this->html->createElement('text',$link['label']);
      $node->appendChild($text);
      $this->setStyleAttr($text, 'fill', $color);
      $this->setStyleAttr($text, 'font-weight', $fontWeight);
      $this->setStyleAttr($text, 'font-style', $fontSize);
      $this->setStyleAttr($text, 'font-style', $fontStyle);
      $textBBox = $this->getWordBBox($link,$text);
      $text->setAttribute('x',-$textBBox['width']/2+$x0+$h/2+$hdir*$arcSize);
      $text->setAttribute('y',removeUnit(addPxs(array(-removeUnit($margin['top']),$y0,$v0,-$vdir*$arcSize))));
    }
  }

  
  /************************************************************/
  /**                      Crossing Algo                     **/
  /************************************************************/
  
  /**
   * returns true if a node (word or chunk) is outside a frame defined by a link set of properties,
   * false otherwise
   */
  function isOutside($object,$properties){
    // factor 2, in order to take into account left and right in the positions
    return $this->getNodePosition($object)*2< $properties['min']*2 || $this->getNodePosition($object)*2> $properties['max']*2;
  }
  
  /**
   * returns true if a node (word or chunk) is inside a frame defined by a link set of properties,
   * false otherwise
   */
  function isInside($object,$properties){
    // factor 2, in order to take into account left and right in the positions
    return $this->getNodePosition($object)*2> $properties['min']*2 && $this->getNodePosition($object)*2< $properties['max']*2;
  }
  
  /**
   * returns true if two link cross each other, false otherwise
   * @param link1
   * @param link2
   * @returns {Boolean}
   */
  function crossed($link1,$link2){
    $p1 = $this->getLinkProperties($link1);
    $p2= $this->getLinkProperties($link2);
    return ($this->isInside($p1['nodeStart'],$p2) && $this->isOutside($p1['nodeEnd'],$p2))
    || ($this->isInside($p1['nodeEnd'],$p2) && $this->isOutside($p1['nodeStart'],$p2));
  }
  
  /**
   * set up the links position and strate (height of the edge and "innerness")
   * @param links
   */
  function preprocessLinksPosition(){
    $links = &$this->data['graph']['links'];
    // factor 2, in order to take into account left and right in the positions
    $this->sortLinksByLength();
    $n = count($links);
    $table = array();
    for($i=0;$i<$n;++$i){
      $link = &$links[$i];
      $p = &$this->getLinkProperties($link);
      $k = 1;
      while(true){
        if(!isset($table[$k]) || $table[$k]==null){ // nothing exist at this strate : fill it and break
          $table[$k]= array();
          for($j=$p['min']*2;$j<$p['max']*2;$j++){
            $table[$k][$j]=$link;
          }
          $p['strate'] = $k;
          $this->setMaxStrate($k);
          break;
        }
        $crossing = null;
        for($j=$p['min']*2;$j<$p['max']*2;$j++){ // see if there is something where the link lies
          if(isset($table[$k][$j]) && $table[$k][$j]!=null){
            $crossing = $table[$k][$j];
            if($this->crossed($link,$crossing)){
              break;
            }
          }
        }
        if($crossing!=null){ // if there is something
          if($this->crossed($link,$crossing)){ // real crossing
            $k=-1;
            while(true){
              if(!isset($table[$k]) || $table[$k]==null){ // nothing exist at this strate : fill it and break
                $table[$k]=array();
                for($j=$p['min']*2;$j<$p['max']*2;$j++){ // fill in the strate
                  $table[$k][$j]=$link;
                }
                $p['strate'] = $k; // set the strate
                $this->setMaxStrate($k);
                break;
              }
              $dcrossing = null;
              for($j=$p['min']*2;$j<$p['max']*2;$j++){ // see if there is something where the link lies
                if(isset($table[$k][$j]) && $table[$k][$j]!=null){
                  $dcrossing = $table[$k][$j];
                  break;
                }
              }
              if($dcrossing!=null){ // even if real cross, just jump next line
                $k--;
              }else{
                for($j=$p['min']*2;$j<$p['max']*2;$j++){
                  $table[$k][$j]=$link;
                }
                $p['strate'] = $k;
                $this->setMaxStrate($k);
                break;
              }
            }
            break;
          }else{
            $k++;
          }
        }else{
          for($j=$p['min']*2;$j<$p['max']*2;$j++){ // fill in the table
            $table[$k][$j]=$link;
          }
          $p['strate'] = $k; // set the strate
          $this->setMaxStrate($k);
          break;
        }
      }
    }
  
    for($i =0;$i<$n;$i++){
      $link = &$links[$i];
      $p = &$this->getLinkProperties($link);
      $kstep;
      if($p['strate']>0){
        $kstep = -1;
      }else{
        $kstep = 1;
      }
      for($k = $p['strate'] ; $k!=0 ; $k+=$kstep){
        $altLink = &$table[$k][$p['min']*2];
        if($altLink!=null && $altLink!=$link){
          $p2 = &$this->getLinkProperties($altLink);
          if($p2['min'] == $p['min']){
            $p2['offsetXmin']++;
          }
        }
        $altLink = &$table[$k][$p['max']*2-1];
        if($altLink!=null && $altLink!=$link){
          $p2 = &$this->getLinkProperties($altLink);
          if($p2['max'] == $p['max']){
            $p2['offsetXmax']++;
          }
        }
      }
    }
  
  }
  
  function setMaxStrate($strate){
    if(!isset($this->absMaxLinkStrate)){
      $this->absMaxLinkStrate = 0;
      $this->minLinkStrate = 0;
      $this->maxLinkStrate = 0;
    }
    $absStrate = abs($strate);
    $this->absMaxLinkStrate = ($this->absMaxLinkStrate<$absStrate)?$absStrate:$this->absMaxLinkStrate;
    $this->minLinkStrate = ($this->minLinkStrate>$strate)?$strate:$this->minLinkStrate;
    $this->maxLinkStrate = ($this->maxLinkStrate<$strate)?$absStrate:$this->maxLinkStrate;
  }
  
  
  /**
   * sort the links by length..
   * @param links
   */
  function sortLinksByLength(){
    $me = $this;
    $links = &$this->data['graph']['links'];
    usort($links,function($a,$b) use ($me){
      $p1 = $me->getLinkProperties($a);
      $p2 = $me->getLinkProperties($b);
      return $p1['length']-$p2['length'];
    });
  }
  
  /**
   * lazy load the computed properties of a link.
   * Those properties are used to compute the position of the links in order
   * to minimize crossing
   * @param link
   * @returns the properties object
   */
  function &getLinkProperties(&$link){
    if($link['#properties'] == null){
      $properties = array();
      $properties['nodeStart'] = $this->getWordNodeByOriginalId($link['source']);
      if($properties['nodeStart'] == null){
        $properties['nodeStart'] = $this->getChunkNodeByOriginalId($link['source']);
      }
      $properties['nodeEnd'] = $this->getWordNodeByOriginalId($link['target']);
      if($properties['nodeEnd'] == null){
        $properties['nodeEnd'] = $this->getChunkNodeByOriginalId($link['target']);
      }
      if($this->getNodePosition($properties['nodeStart'])<$this->getNodePosition($properties['nodeEnd'])){
        $properties['min'] = $this->getNodePosition($properties['nodeStart']);
        $properties['max'] = $this->getNodePosition($properties['nodeEnd']);
        $properties['hdir'] = 1;
      }else{
        $properties['max'] = $this->getNodePosition($properties['nodeStart']);
        $properties['min'] = $this->getNodePosition($properties['nodeEnd']);
        $properties['hdir'] = -1;
      }
      $properties['vdir'] = 1; // oriented top
      $properties['offsetXmax'] = 0;
      $properties['offsetXmin'] = 0;
      $properties['strate'] = 0;
      $properties['length'] = $properties['max']-$properties['min'];
      if(!$properties['nodeStart']){ // for orign arc to be processed first in anti crossing algo
        $properties['length'] = 0;
      }
      $properties['outer']=0;
      $link['#properties'] = $properties;
    }
    return $link['#properties'];
  }
  
  /**
   * Returns the position of the node (word or chunk).
   * For the non trivial case of chunk, the node in middle of the chunk
   * is taken for the reference positon in the computing of links positionning
   * @param node
   * @returns integer (position of the node or -1 if origin : [node = null])
   */
  function getNodePosition($element){
    if($element){
      if(isset($element['#position'])){
        return $element['#position'];
      }else{ // we are dealing with a chunk
        $middle = floor(count($element['elements'])/2);
        $middleNode = $this->getWordNodeByOriginalId($element['elements'][$middle]);
        return $middleNode['#position'];
      }
    }else{
      return -1;
    }
  }
  
  
  function computeApproximateBBox(){
    $totalBBox = array('x'=>0,'y'=>0,'width'=>0,'height'=>0);
    foreach($this->data['graph']['words'] as $word){
      $bbox = $this->getWordBBox($word);
      $width = $bbox['width'];
      $totalBBox['width']+= $width;
    }
    $wordMargin = $this->data['graph']['#word-style']['margin'];
    $wordMargins = count($this->data['graph']['words'])*(removeUnit($wordMargin['left'])+removeUnit($wordMargin['right']));
    $totalBBox['width']+=$wordMargins;
    $chunkMargin = $this->data['graph']['#chunk-style']['margin'];
    $chunkMargins = count($this->data['graph']['#chunk-style']['margin'])*(removeUnit($chunkMargin['left'])+removeUnit($chunkMargin['right']));
    $totalBBox['width']+=$chunkMargins;
    
    $height = $this->wordHeight;
    if(isset($this->data['graph']['chunks'])){
      foreach($this->data['graph']['chunks'] as $chunk){
        $height = ($heigth<$chunk['#bbox']['height'])?$chunk['#bbox']['height']:$height;
      }
    }
    
    $globalMargins = $this->data['graph']['#style']['margin'];
    $hm = removeUnit($globalMargins['top'])+removeUnit($globalMargins['bottom']);
    $h = $hm + $height + (1+$this->maxLinkStrate - $this->minLinkStrate)*40 ;
    $totalBBox['height']+=$h;
    
   return $totalBBox;
  }
  
  /**
   * Returns the svg/html of the graph
   * @return string
   */
  function getHTML(){
    return $this->html->saveHTML(); 
  }
  
  /**
   * Create the image frame (title, etc.)
   */
  function surroundWithFrame($content){
    global $base_url; // retrieve the base url of the installation
    
    $title = isset($this->options['title'])?preg_replace("/'/","\'",$this->options['title']):'';
    $title = str_replace("\n", " ", $title);
    
    $prepend = '<a id="graph-' . $this->options['uid'] . '" name="graph-' . $this->options['uid'] . '"></a>';
    $append = '<div>' . ((!isset($this->options['wrapped']))? $title : '') . '</div>';
    
    return $prepend . $content . $append;
  }

  /**
   * Returns the img/html of the graph
   */
  function getHTMLImage($targetdir = 'tmp',$uid=null,$urlprepend = ''){
    $uid = $uid?$uid:uniqid();
    $svg_file = $targetdir."/svg_img_" . $uid;
    $svg_source = $this->html->saveXML($this->svg);
    
    file_put_contents($svg_file, $svg_source);
    $output = $targetdir."/png_image_".$uid.".png";
    $cmd = 'rsvg-convert '.$svg_file.' -o '.$output;
    
    shell_exec($cmd);
    
    $content = '<img src="'.$urlprepend.$output.'" width="'.$this->width.'" height="'.$this->height.'">';

    return $this->surroundWithFrame($content);
  }
  
}

/**
 * Get the content of the attribute transform in the form of an associative array
 * @param unknown $element
 * @return Ambigous <multitype:multitype: , unknown>
 */
function getTransformValues($element){
  $result = array();
  $value = $element->getAttribute('transform');
  static $pairRegex = "/(\w+)\((.*?)\)/";
  static $valuesRegex = "/(-*\w+\.*\w*)/";
  $matches = array();
  preg_match_all($pairRegex, $value, $matches, PREG_SET_ORDER);
  foreach($matches as $match){
    $result[trim($match[1])] = array();
    $values = array();
    preg_match_all($valuesRegex,$match[2],$values, PREG_SET_ORDER);
    foreach($values as $val){
      $result[trim($match[1])][] = $val[1];
    }
  }
  return $result;
}


/**
 * Set a svg group 'g' to a position
 * @param unknown $group
 * @param unknown $x
 * @param unknown $y
 */
function setGroupPosition(&$group,$x,$y){
  $group->setAttribute('transform','translate('.$x.','.$y.')');
}

/**
 * Remove unit to a value
 * @param unknown $value
 * @return mixed
 */
function removeUnit($value){
  static $units = "/px|pt|%|em/";
  return preg_replace($units, "", $value);
}

/**
 * Sum an array of values (with or without units)
 * @param unknown $args
 * @return number
 */
function addPxs($args){
  $sum = 0;
  foreach($args as $arg){
    $arg = removeUnit($arg);
    $sum += $arg;
  }
  return $sum.'px';
}

