<?php

require_once "depview/depgraph_formats.inc";

$depgraphdata = "1	Jean	Jean	N	NPP	n=s|g=m	2	suj	_	_
2	aime	aimer	V	V	n=s|p=3|m=i|t=p	0	root	_	_
3	autant	autant	ADV	ADV	_	2	mod	_	_
4	le	le	D	D	n=s|g=m	5	det	_	_
5	chocolat	chocolat	N	N	n=s|g=m	2	obj	_	_
6	que	que	C	CS	sem=void	3	S:arg_comp	_	_
7	Marie	Marie	N	NPP	n=s|g=f	6|7.5	S:obj_cpl|D:suj	_	_
7.5	_e(2)_	ε	EPS	EPS	_	3	D:arg_comp	2	ref
8	la	le	D	D	n=s|g=f	9	det	_	_
9	glace	glace	N	N	n=s|p=3|m=i|t=p	6|7.5	S:obj_cpl|D:obj	_	_";

$dep2pict = '[GRAPH] { background=#C7F6C7; scale = 200; fontname="Arial";  margin_left=20; margin_right=20}
[WORDS] { 
N_0 {  word="Paul"; subword="N";  }
N_1 {  word="veut"; subword="V";  }
N_2 {  word="être"; subword="V"; forecolor=red; subcolor=red}
N_3 {  word="photographié"; subword="V";  }
N_4 {  word="par"; subword="P"; forecolor=red; subcolor=red}
N_5 {  word="le"; subword="D";}
N_6 {  word="paparazzi"; subword="N";}
} 
[EDGES] { 
N_1 -> N_0 { label = "suj"; }
N_3 -> N_0 { label = "suj : obj";color=blue;forecolor=blue; bottom }
N_1 -> N_3 { label = "obj";  }
N_3 -> N_2 { label = "aux_pass";color=red;forecolor=red; }
N_3 -> N_4 { label = "p-obj_agt : suj";color=red;forecolor=red; }
N_4 -> N_6 { label = "obj_prep";color=red;forecolor=red; }
N_6 -> N_5 { label = "det";  }
N_3 -> N_6 { label = "p-obj_agt : suj";color=blue;forecolor=blue; bottom}
}
</format>
<format dep2pict>
[GRAPH] { background=#C7F6C7;  scale = 200; fontname="Arial";  margin_left=20; margin_right=20}
[WORDS] { 
N_0 {  word="Paul"; subword="N";  }
N_1 {  word="est"; subword="V"; forecolor=red; subcolor=red}
N_2 {  word="encouragé"; subword="V";  }
N_3 {  word="à"; subword="P"; forecolor=red; subcolor=red}
N_4 {  word="partir"; subword="V";}
} 
[EDGES] { 
N_2 -> N_0 { label = "suj : obj"; }
N_4 -> N_0 { label = "suj";color=blue;forecolor=blue; bottom }
N_2 -> N_4 { label = "a-obj";color=blue;forecolor=blue; bottom }
N_2 -> N_1 { label = "aux_pass";color=red;forecolor=red; }
N_2 -> N_3 { label = "a-obj";color=red;forecolor=red; }
N_3 -> N_4 { label = "obj_prep";color=red;forecolor=red; }
}';

$depgraph = dep2pict2depGraph($dep2pict);

echo $depgraph;

$depgraph_format = conll2depGraph($depgraphdata);

$depgraph_format = json_decode($depgraph_format,true);

$outputdata = depGraph2conll($depgraph_format);

echo conllToHTML($outputdata);

global $log;
echo $log;