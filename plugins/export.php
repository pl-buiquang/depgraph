<?php

$svg_source;

if(isset($_POST['data'])){
  $svg_source = $_POST['data'];
}


$uid = uniqid();
$svg_file = "../tmp/svg_img_" . $uid;
file_put_contents($svg_file, $svg_source);
$output = "../tmp/png_image_".$uid.".png";
$cmd = 'rsvg-convert '.$svg_file.' -o '.$output;

shell_exec($cmd);
//echo $cmd;

$actual_link = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

header( 'Location: http://localhost/depgraph/tmp/png_image_'.$uid.'.png' );


