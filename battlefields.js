// Each plate uses the same 960 × 600 ground scale as the combat simulation.
const battlefieldPlates = {
  camp: { earth:'#c0a085', draw({patch,trail,mark}) {
    patch('trampled','M-22 74 Q134 25 282 77 L341 153 L270 214 L-22 228Z');
    patch('trampled','M678 349 Q823 304 982 370 V562 L680 514 L621 432Z');
    trail('cart','M-24 126 C259 172 287 283 489 303 S779 413 994 425',48);
    mark('sacks',149,125,1.18); mark('wheel',189,148); mark('sacks',728,384);
    mark('sacks',748,393,.83); mark('wheel',539,326,.72);
  }},
  pass: { earth:'#bbab8f', draw({patch,trail,mark}) {
    patch('water','M-15 -20 H991 V45 Q870 83 777 68 T559 99 Q459 133 345 99 T112 131 Q45 151 -15 145Z');
    patch('shingle','M-20 157 Q177 85 299 118 T596 113 Q343 192 240 168 T-20 205Z');
    trail('foot','M-32 440 C200 396 320 221 522 242 S751 373 987 253',31);
    mark('skiff',288,122,1.35,-.14); mark('oar',325,151,1,-.21);
    mark('oar',521,228,.85,.38); mark('reeds',83,152); mark('reeds',835,79);
  }},
  keep: { earth:'#b2a493', draw({patch,trail,mark}) {
    patch('paving','M-20 186 L284 178 L573 212 L996 198 V280 L567 283 L281 244 L-20 264Z');
    patch('paving','M544 -20 L614 -20 L534 213 L498 288 L379 628 H310 L428 275Z');
    mark('masonry',149,188,1.2); mark('masonry',647,218); mark('shield',495,287,.83);
    mark('masonry',368,494,1.25); mark('shield',340,476);
  }},
  pursuit: { earth:'#b29276', draw({patch,trail,mark}) {
    patch('ash','M-10 0 H495 Q438 103 351 109 T190 216 Q98 253 -10 221Z');
    patch('ash','M580 622 Q578 483 686 429 T852 353 Q919 337 982 257 V622Z');
    trail('foot','M202 626 Q237 425 443 335 T698 -32',44);
    mark('stump',186,139,1.2); mark('branch',225,155,1.25); mark('stump',373,99,.74);
    mark('branch',538,295); mark('stump',750,431,1.06); mark('branch',798,426);
  }},
  xiapi: { earth:'#ac9e84', draw({patch,trail,mark}) {
    patch('mud','M-20 175 Q173 248 256 205 T484 190 Q360 234 329 262 T103 282 L-20 244Z');
    patch('water','M-15 325 Q97 294 168 311 T311 307 Q230 358 144 354 T-15 402Z');
    patch('water','M977 124 Q869 160 849 221 T724 324 Q793 259 788 213 T850 127 Q920 98 977 75Z');
    trail('cart','M200 625 C371 471 310 364 483 286 S679 121 707 -20',37);
    mark('fascine',199,306); mark('wheel',392,355,.8); mark('reeds',806,221);
    mark('fascine',845,168,1.1); mark('reeds',99,351);
  }},
  tongguan: { earth:'#ccb18a', draw({patch,trail,mark}) {
    patch('bluff','M-20 -20 H573 L533 37 L439 58 L385 101 L279 105 L228 150 L98 165 L-20 226Z');
    patch('bluff','M999 284 L891 333 L803 348 L731 402 L625 443 L578 532 L462 625 H999Z');
    trail('foot','M-30 401 Q257 338 421 260 T719 177 L991 87',48);
    mark('cairn',272,118,1.1); mark('cairn',679,438,1.3); mark('shard',542,238,.9); mark('shard',212,318);
  }},
  dingjun: { earth:'#a6ad86', draw({patch,trail,mark}) {
    patch('moss','M-22 8 Q179 -26 311 92 T526 142 Q448 196 307 150 T96 149 L-22 199Z');
    patch('moss','M-20 478 Q104 430 233 488 T478 501 Q588 451 666 477 L583 622 H-20Z');
    trail('foot','M-32 364 C105 277 266 361 371 294 S493 98 603 142 S751 268 984 175',33);
    mark('pine',190,103,1.2); mark('pine',217,111,.78); mark('pine',399,148);
    mark('needles',505,238,1.2); mark('pine',317,527,.94); mark('needles',678,210);
  }},
  fancheng: { earth:'#9ea99c', draw({patch,trail,mark}) {
    patch('water','M-10 360 Q139 346 243 414 T444 449 Q567 426 652 450 T973 427 V638 H-10Z');
    patch('mud','M-10 318 Q168 328 239 380 T461 416 Q565 385 672 418 Q517 405 448 438 T223 400 T-10 351Z');
    patch('paving','M-10 210 Q257 200 418 275 T762 321 L982 269 V306 L765 358 Q570 372 408 305 T-10 249Z');
    mark('gauge',232,406,1.15); mark('reeds',716,461); mark('masonry',607,318,1.1);
    mark('fascine',431,415,1.25); mark('gauge',809,446,.8);
  }},
  wuzhang: { earth:'#b5aa92', draw({patch,trail,mark}) {
    patch('terrace','M-18 14 Q142 177 314 126 T569 76 Q684 96 752 -15 H-18Z');
    patch('terrace','M-10 586 Q133 464 303 487 T578 465 Q704 408 865 425 L985 397 V627 H-10Z');
    trail('foot','M-25 354 Q156 276 308 305 T564 310 Q726 275 989 304',32);
    mark('lamps',384,237,1.05); mark('cairn',671,441,.9); mark('cloth',232,480);
    mark('cairn',219,137,1.05);
  }},
  bailang: { earth:'#b5b18a', draw({patch,trail,mark}) {
    patch('steppe','M-10 314 Q98 212 211 222 T452 156 Q554 71 730 64 T982 21 V-20 H-10Z');
    patch('steppe','M175 625 Q279 510 441 489 T694 397 Q821 321 980 343 V625Z');
    trail('hoof','M-26 437 C228 433 341 273 530 276 S787 173 989 152',32);
    mark('antler',179,243); mark('cairn',761,88,1.25); mark('grass',588,319);
    mark('grass',244,406); mark('antler',709,436,.82); mark('grass',807,388,1.3);
  }},
  changban: { earth:'#c3a377', draw({patch,trail,mark}) {
    patch('mud','M-10 37 Q140 104 284 74 T556 91 Q386 90 292 136 T-10 112Z');
    patch('water','M761 -15 Q709 82 745 159 T799 299 Q787 370 888 421 T976 515 V461 Q958 421 902 390 T830 280 Q837 215 789 147 T803 -15Z');
    trail('hoof','M-35 490 C144 481 341 306 482 309 S699 244 976 94',40);
    mark('bridge',789,210,1.45,-.32); mark('wheel',354,353,.96); mark('wheel',372,349,.54);
    mark('reeds',746,118); mark('sacks',158,436,.8);
  }},
  jieting: { earth:'#c5a184', draw({patch,trail,mark}) {
    patch('terrace','M-15 -16 H774 Q617 41 597 127 T433 224 Q320 219 263 294 T98 369 L-15 381Z');
    patch('drybed','M69 628 Q139 481 289 454 T482 391 Q610 304 691 338 T987 250 L982 296 Q856 386 706 373 T498 422 Q396 493 304 486 T114 628Z');
    mark('shard',302,472,1.3); mark('drywell',542,362,1.12); mark('cairn',380,221);
    mark('shard',775,356); mark('cairn',137,344,.75);
  }},
  shiting: { earth:'#aba98a', draw({patch,trail,mark}) {
    patch('water','M-20 56 Q116 105 202 96 T396 137 Q284 123 190 151 T-20 146Z');
    patch('water','M685 621 Q691 494 784 457 T921 341 Q943 307 988 282 V621Z');
    patch('shingle','M-20 160 Q125 213 234 168 T444 151 Q371 132 234 189 T-20 194Z');
    trail('foot','M-20 289 Q186 246 360 308 T661 315 Q768 277 984 259',38);
    mark('pavilion',313,140,1.15); mark('reeds',253,143,1.15); mark('reeds',735,510); mark('reeds',841,436,1.2);
    mark('masonry',524,334,.7);
  }},
  jiange: { earth:'#a7a598', draw({patch,trail,mark}) {
    patch('slate','M-10 -10 H373 L347 78 L292 126 L309 190 L252 249 L179 282 L148 357 L49 409 L-10 475Z');
    patch('slate','M982 60 L897 102 L855 164 L742 199 L704 270 L635 326 L633 388 L541 451 L489 524 L386 625 H982Z');
    trail('foot','M22 623 L157 483 Q245 385 333 355 T493 257 Q574 140 662 110 L844 -22',40);
    mark('planks',311,367,1.2,-.41); mark('planks',482,267,.96,-.89); mark('pine',218,236);
    mark('cairn',659,332,1.15); mark('pine',718,288,.85);
  }},
  jieqiao: { earth:'#b9ae90', draw({patch,trail,mark}) {
    patch('steppe','M-12 10 H407 Q337 68 225 89 T-12 201Z');
    patch('water','M339 -18 Q283 103 362 244 T381 448 Q349 523 404 621 H459 Q397 522 431 446 T405 234 Q322 91 397 -18Z');
    trail('hoof','M-20 389 Q178 344 389 302 T691 250 L983 117',35);
    mark('bridge',409,297,1.36,-.22); mark('reeds',357,215); mark('shield',608,269,.8);
    mark('grass',145,107,1.2); mark('reeds',416,486);
  }},
  chencang: { earth:'#c2a084', draw({patch,trail,mark}) {
    patch('bluff','M-15 -12 H776 L695 39 L510 45 L397 102 L269 94 L172 162 L-15 193Z');
    patch('ash','M741 620 Q637 498 680 423 T807 378 Q894 357 986 365 V620Z');
    trail('cart','M986 464 Q742 512 575 384 T277 249 Q100 226 -20 261',53);
    mark('fascine',575,368,1.15,.25); mark('wheel',604,402,1.1); mark('stump',775,472);
    mark('masonry',237,236); mark('sacks',127,202); mark('branch',761,489);
  }},
  jingxian: { earth:'#9faa85', draw({patch,trail,mark}) {
    patch('moss','M-10 -10 H746 Q664 140 518 109 T262 181 Q151 239 -10 187Z');
    patch('slate','M604 624 Q630 497 712 459 L763 371 L869 342 L986 225 V624Z');
    trail('foot','M42 630 Q90 401 287 377 T504 266 Q542 184 681 186 T987 82',29);
    mark('bamboo',217,166,1.3); mark('bamboo',243,170,.78); mark('bamboo',536,216);
    mark('bamboo',764,405,1.15); mark('branch',651,462); mark('cairn',874,351);
  }},
  xiangping: { earth:'#a8aea4', draw({patch,trail,mark}) {
    patch('paving','M228 -15 H974 V221 L597 190 L318 180Z');
    patch('water','M154 -16 H209 L303 194 L610 208 L979 250 V293 L584 245 L272 232Z');
    patch('mud','M-14 506 Q141 451 241 485 T412 494 Q263 559 165 528 T-14 572Z');
    trail('cart','M113 632 Q265 437 421 339 T692 175',32);
    mark('bridge',605,229,1.04,-.95); mark('masonry',488,175,1.26); mark('gauge',347,232);
    mark('reeds',828,267); mark('shield',462,331,.85);
  }},
  nanzhong: { earth:'#b2a382', draw({patch,trail,mark}) {
    patch('terrace','M-12 40 Q128 21 243 115 T472 166 Q384 248 267 188 T81 166 L-12 197Z');
    patch('water','M-15 540 Q159 570 281 471 T519 422 Q641 450 777 368 T987 345 V399 Q901 374 795 425 T507 471 Q385 452 309 516 T-15 602Z');
    trail('foot','M-22 265 Q160 327 328 283 T616 299 Q783 375 982 225',40);
    mark('drum',404,248,1.16); mark('bamboo',164,138); mark('skiff',597,438,.9,-.08);
    mark('bamboo',717,351,.9); mark('reeds',275,492); mark('oar',612,426,.82);
  }}
};

const groundMaterials = {
  stubble:['#a99058','#dec083'], trampled:['#a08064','#dbc3a2'],
  water:['#8caaa1','#d5d8b8'], shingle:['#b0a68e','#ded5b8'],
  paving:['#a29887','#d3c7ae'], ash:['#8c8172','#beb09c'],
  mud:['#97927b','#c4bd9d'], bluff:['#b68e67','#e1c294'],
  moss:['#899572','#b9be95'], terrace:['#a6997f','#d1c3a1'],
  steppe:['#9fa47e','#c8c89c'], drybed:['#b19c88','#ddc7a9'], slate:['#878e85','#b8baab']
};

function groundRandom(key){
  let seed=1;
  for(const ch of key)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
}

function groundStroke(c,path,color,width=1){
  c.strokeStyle=color;c.lineWidth=width;c.stroke(path instanceof Path2D?path:new Path2D(path));
}

function paintGroundPatch(c,kind,outline,random){
  const shape=new Path2D(outline),[shade,light]=groundMaterials[kind];
  c.save();c.clip(shape);
  c.globalAlpha=.69;c.fillStyle=shade;c.fillRect(0,0,960,600);
  // Follow the silhouette inwards to model the bank or the cut of the hillside.
  const rock=['bluff','slate','terrace'].includes(kind);
  if(rock||kind==='water'){
    c.globalAlpha=.53;groundStroke(c,shape,light,rock?15:6);
    c.translate(rock?-6:0,rock?-12:-4);
    c.globalAlpha=.37;groundStroke(c,shape,shade,rock?4:1.5);
    if(rock){c.translate(-3,-13);groundStroke(c,shape,light,2)}
    c.setTransform(1,0,0,1,0,0);
  }
  c.globalAlpha=.42;
  if(kind==='stubble'){
    for(let x=-1100;x<1100;x+=13+random()*7){
      c.setLineDash([18+random()*27,3+random()*8]);
      groundStroke(c,'M'+x+' 0 q355 146 1040 625',light,2.1);
    }
    c.setLineDash([]);
  }
  if(kind==='paving'){
    for(let row=0;row<63;row++){
      const y=row*10,start=row%2?4:18;
      groundStroke(c,'M0 '+y+' q480 5 960 -1',shade,1.5);
      for(let x=start;x<960;x+=26+Math.floor(random()*9)){
        if(random()>.25)groundStroke(c,'M'+x+' '+(y+2)+' l-2 6',light,1);
      }
    }
  }
  for(let i=0;i<1050;i++){
    const x=random()*960,y=random()*600;
    if(!c.isPointInPath(shape,x,y))continue;
    c.save();c.translate(x,y);c.scale(.5+random(),.55+random()*.7);
    switch(kind){
      case 'water': groundStroke(c,'M-10 0 q6 1.4 12 0 l5 -.2',light,1.1);break;
      case 'steppe': case 'moss': case 'stubble':
        groundStroke(c,'M-3 -2 l3 3 2 -5 M2 1 l4 -3',light,.9);break;
      case 'drybed': groundStroke(c,'M-5 -3 l3 2 3 -1 4 3 M1 -2 l1 -2',shade,.95);break;
      case 'slate': case 'bluff': case 'terrace':
        groundStroke(c,'M-7 2 l5 -2 6 .6 4 -2',light,1);break;
      case 'ash': groundStroke(c,'M-4 1 l6 -2 m1 0 3 -1','#645d55',1.3);break;
      default: groundStroke(c,'M-2 0 l3 -1 2 1',light,1.1);
    }
    c.restore();
  }
  c.restore();
}

function paintTrail(c,kind,outline,width,random){
  const path=new Path2D(outline);
  // Scuff through the trail wash to let the field show through worn shoulders and bends.
  const layer=document.createElement('canvas');layer.width=960;layer.height=600;
  const wash=layer.getContext('2d');
  for(const [extra,alpha] of [[16,.035],[9,.045],[2,.065],[-7,.055]]){
    wash.globalAlpha=alpha;groundStroke(wash,path,'#f3dbb2',width+extra);
  }
  wash.lineWidth=width+38;wash.globalCompositeOperation='destination-out';
  for(let i=0;i<1650;i++){
    const x=random()*960,y=random()*600;
    if(!wash.isPointInStroke(path,x,y))continue;
    wash.globalAlpha=.15+random()*.54;
    oval(wash,x,y,3+random()*18,1.1+random()*3.2,'#fff',random()*.4-.2);
  }
  c.drawImage(layer,0,0);
  c.save();
  if(kind==='cart'||kind==='hoof'){
    for(const offset of [-6,6]){
      c.save();c.translate(0,offset);
      c.setLineDash(kind==='cart'?[54,8,22,15]:[2.5,9,3,12]);
      c.globalAlpha=kind==='cart'?.26:.34;groundStroke(c,path,'#846e52',kind==='cart'?1.6:2.5);
      c.restore();
    }
  }
  c.restore();
}

// Low relief landmarks: warm rim light, a muted local color and a short cast shadow.
const groundMarks={
  bamboo(f,s){
    s('M-4 1 L-7 -18 M0 1 L1 -24 M3 0 L8 -17','#747f55',1.6);
    s('M-7 -13 l2 -.4 M0 -16 h2 M5 -10 l2 .4','#b3ad7d');
    f('M0 -13 Q-5 -19 -9 -19 Q-7 -14 0 -13Z M1 -18 Q4 -24 9 -24 Q8 -20 1 -18Z M6 -9 Q11 -15 15 -14 Q12 -10 6 -9Z','#829266');
  },
  drum(f,s){
    f('M-9 -9 Q0 -14 9 -10 L8 -2 Q0 3 -8 -1Z','#9c7458');
    f('M-9 -9 Q-1 -15 9 -10 Q4 -4 -9 -9Z','#c6a771');
    s('M-7 -7 L-4 -2 L-1 -6 L3 -2 L6 -7 M-9 1 L10 3','#836e50',1.1);
  },
  sheaf(f,s){
    f('M-12 1 Q-8 -3 -5 -11 L-6 -13 L-3 -11 L0 -18 L1 -14 L4 -16 L4 -11 Q9 -4 12 1 Q0 5 -12 1Z','#b48b48');
    s('M-8 0 L-2 -11 M-3 0 L0 -9 M4 0 L2 -10 M8 0 L4 -6','#dfc080',1.2);
    s('M-5 -8 Q0 -6 5 -8','#816444',1.8);
  },
  sickle(f,s){s('M-7 2 l10 -7','#83664a',2.2);f('M1 -5 Q8 -13 12 -7 Q9 -8 3 -3Z','#b3ada0')},
  cloth(f,s){f('M-11 -2 L-1 -6 L11 -4 L5 -1 L10 0 L1 2Z','#b99350');s('M-5 -2 L2 -4 L6 -3','#d4b575')},
  sacks(f,s){
    f('M-14 1 Q-16 -3 -12 -9 L-14 -11 L-9 -12 L-7 -10 Q0 -9 1 -2 Q0 3 -14 1Z','#b29169');
    f('M-1 1 Q-1 -5 5 -9 L4 -11 L10 -10 L9 -8 Q15 -4 13 0 Q9 4 -1 1Z','#c6a97d');
    s('M-12 -9 L-8 -10 M4 -8 L9 -8 M-12 -2 Q-9 1 -4 0','#89704f');
  },
  wheel(f,s){
    f('M-12 1 L14 -3 L15 -1 L-11 4Z','#917455');
    const rim=new Path2D();rim.ellipse(0,-4,8.5,6.4,-.23,0,Math.PI*2);
    s(rim,'#826747',2.7);s(rim,'#b89a70',1);
    s('M-7 -4 L7 -4 M-4 -9 L4 1 M-4 1 L4 -9','#917455',1.3);
    f('M-2 -4 L0 -6 L2 -4 L0 -2Z','#776652');
  },
  skiff(f,s){
    f('M-20 -2 Q-6 3 20 -7 Q16 2 1 5 Q-13 7 -20 -2Z','#876c51');
    f('M-17 -2 Q-4 -5 17 -7 Q3 2 -12 2Z','#ad9672');
    s('M-18 -2 Q-2 -1 17 -7 M-7 -1 l1 3 M4 -4 l2 3','#d0b78e',1.1);
  },
  oar(f,s){s('M-11 3 L7 -4','#8e7555',1.7);f('M3 -3 L12 -8 L15 -7 L13 -4 L5 -1Z','#a28460')},
  reeds(f,s){
    s('M-6 1 Q-7 -4 -10 -8 M0 1 Q0 -8 3 -14 M2 1 Q6 -6 11 -10 M-2 0 L-4 -12','#82815c',1.3);
    s('M-4 -11 l-.7 -4 M3 -13 l1 -4 M10 -9 l2 -3','#a48a60',2.1);
    f('M-3 1 Q-8 -6 -12 -6 Q-7 -5 -4 2Z M4 2 Q9 -3 14 -3 L6 2Z','#989469');
  },
  masonry(f,s){
    f('M-15 -5 L-3 -9 L11 -6 L13 -1 L0 3 L-14 0Z','#969285');
    f('M-15 -5 L-3 -9 L11 -6 L-1 -2Z','#bdb5a1');
    s('M-1 -2 L0 2 M-9 -6 L-5 -5 M3 -2 l3 -1','#8d877a');
    f('M13 2 L17 -1 L21 0 L19 3Z','#afa692');
  },
  shield(f,s){
    f('M-8 -4 L4 -8 L11 -5 L9 0 L2 4 L-4 2Z','#9d8462');
    s('M-6 -4 L4 -7 L9 -5 L7 0 L2 2Z','#c3aa80');
    s('M-1 -4 L4 0 M-7 4 L9 -9','#85735c',1.2);
  },
  stump(f,s){
    f('M-9 2 L-5 -3 L-5 -11 L-2 -9 L0 -14 L2 -10 L5 -12 L5 -2 L10 1 L3 1 L0 3Z','#716357');
    f('M-4 -10 L-2 -8 L0 -12 L3 -10 L2 -7 L-3 -6Z','#ad9579');
    s('M-2 -5 L-3 0 M3 -6 L3 -2','#99836c');
  },
  branch(f,s){s('M-13 2 L-2 -2 L4 -2 L13 -6 M-2 -2 L-7 -7 M5 -3 L6 -8','#776859',2);s('M-12 1 L-3 -2','#b0987d')},
  fascine(f,s){
    for(let i=0;i<4;i++)s('M-14 '+i+' l28 -6','#9b8061',1.6);
    s('M-7 -2 l2 4 M5 -4 l2 4','#756851',1.7);
  },
  cairn(f,s){
    f('M-11 1 L-8 -4 L-2 -6 L7 -5 L11 -1 L6 2Z','#918476');
    f('M-6 -5 L-5 -9 L2 -12 L7 -9 L6 -6Z','#a49683');
    f('M-4 -10 L-2 -14 L2 -15 L4 -12 L2 -10Z','#b8aa92');
    s('M-8 -3 L-3 -5 L3 -5 M-4 -8 L1 -10','#cfbda0',1);
  },
  shard(f,s){f('M-7 2 L-4 -3 L4 -4 L9 -1 L3 2Z','#aa9681');s('M-5 -2 L2 -4 L5 -3','#d1bda0')},
  pine(f,s){
    f('M-1 1 L-1 -7 L2 -7 L3 2Z','#796d56');
    f('M-10 -5 L-5 -11 L-7 -11 L-2 -17 L-3 -17 L0 -23 L5 -15 L3 -15 L8 -9 L5 -9 L11 -5 L3 -3Z','#77856c');
    f('M-9 -5 L-3 -12 L-5 -11 L0 -20 L2 -15 L0 -15 L3 -11 L-1 -11 L2 -7Z','#93a082');
  },
  needles(f,s){s('M-10 2 L10 -4 M-5 1 L-7 -3 M0 -1 L-1 -5 M4 -2 L5 -6 M2 -1 L-1 3 M7 -3 L6 1','#7e8366',1.2)},
  gauge(f,s){
    f('M-2 1 L-2 -17 L1 -19 L3 -17 L2 1Z','#957a59');
    s('M-1 -12 L2 -12 M-1 -8 L1 -8 M-1 -4 L2 -4','#cfc09a',1.1);
    s('M-6 2 Q0 4 8 1','#cecbb0',1);
  },
  lamps(f,s){
    for(const [x,y] of [[-16,-3],[-11,-10],[-4,-8],[0,-2],[7,0],[12,5],[19,6]]){
      f('M'+(x-2)+' '+y+' q1 4 5 0 l-2 0Z','#947957');
      s('M'+x+' '+(y-.5)+' l.4 -2','#dfbb77',1.3);
    }
  },
  antler(f,s){s('M-10 2 Q1 1 10 -9 M-4 1 L-7 -5 M0 -1 L-1 -7 M5 -5 L4 -10 M7 -6 L12 -6','#d2c3a1',1.8)},
  grass(f,s){f('M-10 0 L-15 -6 L-6 -2 L-7 -9 L-1 -3 L4 -12 L3 -3 L13 -7 L6 1Z','#949671');s('M-2 0 L1 -5 M3 0 L8 -4','#c4bb92')},
  bridge(f,s){
    f('M-33 -8 L31 -9 L32 7 L-32 9Z','#907a61');
    for(let x=-31;x<30;x+=6){f('M'+x+' -8 l5 -.5 1 15 -5 1Z','#b79b76')}
    s('M-33 -9 L32 -10 M-32 9 L32 7','#826c52',1.5);
    for(const x of [-29,28])s('M'+x+' -8 l0 -5 M'+x+' 8 l0 -4','#927859',2.7);
  },
  drywell(f,s){
    f('M-11 -2 L-5 -6 L6 -6 L11 -3 L9 2 L2 4 L-8 2Z','#a08d74');
    f('M-8 -2 L-4 -4 L5 -4 L8 -2 L3 0 L-4 0Z','#7f705e');
    s('M-10 -2 L-4 -5 L5 -5 L10 -3 M-6 0 L-5 2 M5 1 L5 3','#c2af8e',1.4);
  },
  pavilion(f,s){
    f('M-13 0 L0 -4 L13 -1 L0 3Z','#a49b83');
    s('M-9 -1 L-9 -11 M8 0 L8 -11','#8b775d',2.4);
    f('M-16 -10 Q-8 -11 -2 -18 L1 -20 Q6 -13 16 -11 L10 -9 L-9 -8Z','#778074');
    s('M-13 -10 Q-4 -10 0 -17 M2 -17 Q6 -12 12 -11','#a3a48c');
  },
  planks(f,s){
    s('M-15 -6 L16 -6 M-15 6 L16 6','#897b63',2.3);
    for(let x=-14;x<16;x+=5){
      f('M'+x+' -8 l4 .5 .4 14 -4 1Z','#ad9b7f');
      s('M'+(x+1)+' -7 l.5 12','#c3b091',.8);
    }
  }
};

function paintBattlefield(c,paper,key){
  const plate=battlefieldPlates[key],random=groundRandom(key);
  c.save();c.drawImage(paper,0,0,960,600);
  c.fillStyle=plate.earth;c.globalAlpha=.72;c.fillRect(0,0,960,600);c.globalAlpha=1;
  c.lineJoin='round';c.lineCap='round';
  const fill=(d,color)=>{c.fillStyle=color;c.fill(new Path2D(d))};
  const stroke=(d,color,width)=>groundStroke(c,d,color,width);
  function mark(kind,x,y,scale=1,angle=0){
    c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);
    oval(c,-1,1,8,2,'rgba(84,68,50,.15)');
    groundMarks[kind](fill,stroke);c.restore();
  }
  plate.draw({
    patch:(kind,d)=>paintGroundPatch(c,kind,d,random),
    trail:(kind,d,width)=>paintTrail(c,kind,d,width,random),mark
  });
  // Break up the washes with short ink ridges and small, irregular stone clusters.
  for(let row=0;row<5;row++)for(let col=0;col<8;col++){
    const x=(col+.15+random()*.7)*120,y=(row+.15+random()*.7)*120;
    c.save();c.translate(x,y);c.scale(.55+random()*.45,.55+random()*.38);
    if(random()<.52){
      fill('M-4 1 L-2 -2 L1 -3.4 L4 -2.4 L6 -.2 L4 1Z','rgba(144,121,95,.48)');
      stroke('M-4 1 L-2 -2 L1 -3.4 L4 -2.4','rgba(92,77,58,.45)',.85);
      stroke('M-1.7 -1.8 L1 -2.8','rgba(240,220,182,.68)',.85);
      if(random()>.5)fill('M8 1 L10 -.6 L12 .6 L10 2Z','rgba(135,119,91,.4)');
    }else{
      stroke('M-5 1 Q-2 -2 2 -1.5 L6 0','rgba(98,83,60,.34)',.85);
      stroke('M-1 .6 Q2 -.1 5 .7','rgba(238,218,180,.56)',.8);
    }
    c.restore();
  }
  // Broad, dilute brush marks tie the worn paths and clear ground together.
  for(let i=0;i<230;i++){
    const x=random()*960,y=random()*600,w=7+random()*35,h=2+random()*8;
    c.save();c.translate(x,y);c.scale(w,h);c.rotate(random()*.24-.12);
    const color=i%3?'241,224,185':'99,83,63',wash=c.createRadialGradient(0,0,0,0,0,1);
    wash.addColorStop(0,'rgba('+color+',.075)');wash.addColorStop(1,'rgba('+color+',0)');
    c.fillStyle=wash;c.fillRect(-1,-1,2,2);c.restore();
  }
  // The original arena supplies paper grain and its subtle edge all the way across the plate.
  c.globalCompositeOperation='soft-light';c.globalAlpha=.38;c.drawImage(paper,0,0,960,600);
  c.restore();
}
