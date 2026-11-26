const TAU = Math.PI * 2;

function paintTexture(scene, key, width, height, paint) {
  const texture = scene.textures.createCanvas(key, width, height);
  const c = texture.context;
  const polygon = (points, color) => {
    c.beginPath();
    points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
    c.closePath(); c.fillStyle = color; c.fill();
  };
  paint(c, polygon);
  texture.refresh();
}

function oval(c,x,y,rx,ry,color,rotation=0){
  c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fillStyle=color;c.fill();
}
function solid(c,x,y,rings,colors){
  const radius=Math.max(...rings.map(([r])=>r));
  const shade=c.createLinearGradient(x-radius,y,x+radius,y);
  colors.forEach((color,i)=>shade.addColorStop(i/(colors.length-1),color));
  const first=rings[0],last=rings[rings.length-1];
  c.beginPath();c.moveTo(x-first[0],y-first[1]);
  c.ellipse(x,y-first[1],first[0],first[0]*.48,0,Math.PI,0,true);
  for(const [r,h] of rings)c.lineTo(x+r,y-h);
  c.ellipse(x,y-last[1],last[0],last[0]*.48,0,0,Math.PI,true);
  for(const [r,h] of rings.slice().reverse())c.lineTo(x-r,y-h);
  c.closePath();c.fillStyle=shade;c.fill();
  oval(c,x,y-last[1],last[0],last[0]*.48,shade);
}
function shadow(c,x,y,size){
  c.save();c.translate(x-size*.58,y+size*.18);c.rotate(-.28);c.scale(1,.31);
  const r=size*1.65,g=c.createRadialGradient(0,0,0,0,0,r);
  g.addColorStop(0,'#40392ab0');g.addColorStop(.65,'#413a2a65');g.addColorStop(1,'#413a2a00');
  oval(c,0,0,r,r,g);c.restore();
}
function tree(c,x,y,s){
  shadow(c,x,y,s);
  solid(c,x,y,[[s*.21,0],[s*.13,s*1.6]],['#493d2e','#907456']);
  const drawCluster=(cx,cy,r)=>{
    const g=c.createRadialGradient(cx+r*.33,cy-r*.45,0,cx,cy,r);
    g.addColorStop(0,'#99a465');g.addColorStop(.42,'#76864e');g.addColorStop(.82,'#52663f');g.addColorStop(1,'#40563a');
    oval(c,cx,cy,r,r*.89,g);
  };
  for(let i=0;i<12;i++){
    const a=i*2.39996,r=s*(.43+.14*Math.cos(i*7+x));
    drawCluster(x+Math.cos(a)*s*.66,y-s*1.4+Math.sin(a)*s*.85,r);
  }
  for(let i=0;i<48;i++){
    const a=i*2.39996,r=s*Math.sqrt(i/48);
    oval(c,x+r*Math.cos(a),y-s*1.45+r*Math.sin(a),s*.09,s*.035,i%3?'#c1c58070':'#364d3d66',-.6);
  }
}
function keep(c,p,x,y,s) {
  c.save();c.translate(x,y);c.scale(s,s);
  const stone=['#61564a','#827968','#aaa28a','#c4b99d'];
  const roof=['#782f28','#973a2d','#b74732','#ce573b'];
  shadow(c,0,0,89);
  function turret(a,b,r,h) {
    solid(c,a,b,[[r*1.13,0],[r*1.13,8],[r,13],[r,h-8],[r*1.12,h-5],[r*1.12,h]],stone);
    c.save();c.lineWidth=.52;c.strokeStyle='#463d384e';
    for(let row=0;row<(h-14)/5;row++){
      const yy=b-h+10+row*5;
      c.beginPath();c.moveTo(a-r,yy);c.quadraticCurveTo(a,yy+r*.55,a+r,yy);c.stroke();
      for(let k=1;k<7;k++){
        const u=(k-.5*(row%2))/7,xx=a-r*Math.cos(u*Math.PI),joint=yy+2*r*.55*u*(1-u);
        c.beginPath();c.moveTo(xx,joint);c.lineTo(xx+.35,joint+4);c.stroke();
      }
    }
    c.restore();
    p([[a-3,b-h+12],[a+2,b-h+13],[a+2,b-h+24],[a-3,b-h+23]],'#38382f');
    solid(c,a,b,[[r*1.24,h],[r*1.26,h+3],[r*.08,h+r*1.35]],roof);
    for(let j=1;j<7;j++){
      const t=j/7,w=r*1.21*t,yy=b-h-r*1.35*(1-t);
      c.beginPath();c.moveTo(a-w,yy);c.quadraticCurveTo(a,yy+w*.55,a+w,yy);
      c.strokeStyle='#642d2c85';c.lineWidth=.8;c.stroke();
      for(let tile=-2;tile<=2;tile++){
        const xx=a+w*(tile+(j%2)*.3)/3;
        c.beginPath();c.moveTo(xx,yy+w*.19);c.lineTo(xx+(xx-a)*.1,yy+w*.19+2);
        c.stroke();
      }
    }
    const top=b-h-r*1.35;
    p([[a-1,top],[a+1,top],[a+1,top-20],[a-1,top-20]],'#514335');
    p([[a+1,top-20],[a+26,top-17],[a+15,top-14],[a+1,top-12]],'#a2392a');
  }
  turret(-43,-18,19,63);turret(43,-18,19,60);
  solid(c,0,0,[[56,0],[55,45],[59,48],[59,53]],stone);
  turret(0,-5,31,91);turret(-43,14,18,45);turret(44,14,18,43);
  p([[-9,25],[9,25],[9,10],[4,5],[-4,5],[-9,10]],'#423d32');
  c.restore();
}
function farm(c,p,x,y,s,rand,mill) {
  c.save();c.translate(x,y);c.scale(s,s);
  const field=(a,b,w,h)=>{
    c.fillStyle='#776b48';c.fillRect(a-2,b+2,w+3,h+2);
    c.fillStyle='#cead68';c.fillRect(a,b,w,h);
    for(let row=2;row<h;row+=4){
      c.fillStyle=row%3?'#b5965c':'#e3c178';c.fillRect(a,b+row,w,1);
      for(let col=2;col<w;col+=3){
        const xx=a+col+rand()*2,yy=b+row+rand()*2;
        p([[xx,yy],[xx-.7,yy-2-rand()*2],[xx+1,yy-1]],rand()<.34?'#81683f':'#edd194');
      }
    }
  };
  field(-57,-24,34,28);field(-20,-24,40,28);field(23,-24,32,28);
  field(-57,8,34,30);field(-20,8,40,30);field(23,8,32,30);
  if(mill){
    shadow(c,0,12,18);
    solid(c,0,14,[[14,0],[13,8],[10,37]],['#a88868','#c8ac83','#ecd4a1']);
    solid(c,0,14,[[14,33],[14,35],[3,45]],['#65505b','#806371','#947585']);
    p([[-2,16],[4,15],[4,7],[-2,8]],'#533e35');
    c.save();c.translate(-6,-15);c.rotate(-.48);
    for(let i=0;i<4;i++){c.rotate(Math.PI/2);p([[0,0],[1,-28],[-.8,-28],[-1,0]],'#69503b');
      p([[0,-10],[6,-12],[5,-27],[0,-26]],'#d9c49c');
      for(let j=12;j<27;j+=4)p([[0,-j],[5,-j-1],[5,-j],[0,1-j]],'#977d59');
    }c.restore();
  }else{
    p([[-12,9],[8,10],[15,5],[15,-6],[-12,-5]],'#e0bf92');
    p([[-15,-5],[-8,-15],[11,-15],[17,-6],[7,-4]],'#775965');
    c.fillStyle='#644638';c.fillRect(-4,2,4,7);
  }
  c.restore();
}
function meadow(c,p,cover) {
  let seed=6352;
  const rand=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
  const lawn=c.createLinearGradient(0,0,800,600);
  lawn.addColorStop(0,'#969363');lawn.addColorStop(.6,'#aaa16b');lawn.addColorStop(1,'#918e64');
  c.fillStyle=lawn;c.fillRect(0,0,960,600);
  const road=[[0,440],[150,402],[277,417],[425,362],[560,344],[712,258],[960,227]];
  for(const [offset,width,col] of [[0,34,'#b39775'],[-9,5,'#aa896c'],[9,5,'#aa896c']]){
    c.beginPath();road.forEach(([x,y],i)=>i?c.lineTo(x,y+offset):c.moveTo(x,y+offset));c.lineWidth=width;c.lineJoin='round';c.strokeStyle=col;c.stroke();
  }
  for(let i=0;i<240;i++){const x=rand()*960,y=rand()*600,h=1+rand()*3;
    p([[x,y],[x-1,y-h],[x+2,y-1],[x+4,y-h*.6],[x+3,y+1]],'#737f443e')}
  for(let i=0;i<240;i++){
    const x=rand()*960,y=rand()*600;
    for(let j=0;j<10;j++){
      const xx=x+(rand()-.5)*24,yy=y+(rand()-.5)*10,h=1+rand()*4;
      c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+.3,yy-h*.6,xx+1.6,yy-h);
      c.strokeStyle=j%3?'#74804b50':'#d3c68555';c.lineWidth=.75;c.stroke();
      if(i%21===0&&j%3===0)oval(c,xx+1.5,yy-h,1.3,.85,'#eadead');
    }
  }
  const props=[];
  for(const [cx,cy,n] of [[54,75,6],[355,35,4],[914,90,8],[42,550,6],[800,550,7],[900,400,4],[218,156,3]]){
    for(let j=0;j<n;j++){let x=cx+(rand()-.5)*115,y=cy+(rand()-.5)*65,s=4+rand()*9;
      props.push({y,draw:()=>tree(c,x,y,s)})}
  }
  for(let i=0;i<42;i++){let x=rand()*960,y=rand()*600,r=2+rand()*5;props.push({y,draw:()=>solid(c,x,y,[[r,0],[r*.8,r*.65],[r*.32,r]],['#716f56','#8d8970','#bbb496'],6)})}
  props.push({y:128,draw:()=>farm(c,p,121,121,1.14,rand,true)},{y:495,draw:()=>farm(c,p,884,489,.9,rand,false)});
  if(cover)props.push({y:331,draw:()=>keep(c,p,680,331,1.87)});
  props.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
  if(cover){const fade=c.createLinearGradient(0,560,505,130);fade.addColorStop(0,'#263224e8');fade.addColorStop(.8,'#24302242');fade.addColorStop(1,'#24302200');c.fillStyle=fade;c.fillRect(0,0,960,600)}
}
const WALK_FRAMES=12;
const commanderSwingAngles=[-.8,-.52,.15,.98,1.38,1.08,.7];
const COMMANDER_CLOTH_FRAMES=12;
const COMMANDER_BATTLE_SCALE=.34;
const commanderForms=[
  {name:'布衣民兵'}, {name:'铜札战甲'}, {name:'银钢明铠'}, {name:'玄甲虎卫'}, {name:'金钢统帅'}
];
function commanderForm(level){return Math.min(4,Math.floor(level/5))}
function commanderIdleTexture(ms,base='man6'){
  return base+'cloth'+(Math.floor(ms/100)%COMMANDER_CLOTH_FRAMES);
}
const bannerUniforms=[
  {cape:'#515264',lining:'#383948',metal:'#a64e39',shade:'#73392d',light:'#bc6046',trim:'#e5c89a'},
  {cape:'#a24b36',lining:'#672e2b',metal:'#b9894c',shade:'#755231',light:'#edc987',trim:'#e9b762'},
  {cape:'#365c78',lining:'#273e53',metal:'#97b1bd',shade:'#506d7d',light:'#e4edf0',trim:'#d9c395'},
  {cape:'#773836',lining:'#4c292f',metal:'#414b54',shade:'#242e37',light:'#77828a',trim:'#dfae5e'},
  {cape:'#a03d35',lining:'#692f30',metal:'#d9a246',shade:'#8d612f',light:'#ffe494',trim:'#f6d383'}
];
function bannerCommander(c,phase,swing=null,clothPhase=phase,rank=0,walking=false){
  const u=bannerUniforms[rank],step=Math.sin(phase),wind=Math.sin(clothPhase-.55);
  const torsoX=step*1.3,torsoY=-3.4*step*step;
  const clothAmplitude=walking?.7:.17;
  const plumeSwing=walking?Math.sin(phase-1.05):0;
  c.save();c.scale(.21875,.21875);c.lineJoin='round';c.lineCap='round';
  function fill(path,color){c.fillStyle=color;c.fill(new Path2D(path))}
  function line(path,color,width){c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path))}
  function glaze(top,bottom,y1,y2){
    const g=c.createLinearGradient(0,y1,0,y2);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;
  }
  const gold=glaze('#ffe198','#b77d3d',105,140);
  const helmGold=glaze('#f8d886','#a97636',49,77);
  const skin=glaze('#ffe1b4','#e4af7a',70,152);
  const metal=glaze(u.light,u.metal,94,152);
  const leather='#654431',hair='#3e302e';
  shadow(c,128,219,32);

  // Pin the collar to the shoulders. The same bend carries through the folds and lining.
  function capePoint(x,y){
    const depth=Math.max(0,(y-110)/92);
    const wave=clothPhase-.45-1.2*depth;
    const sway=12*clothAmplitude*depth*Math.sin(wave);
    const lift=3*clothAmplitude*depth*depth*Math.cos(wave);
    return `${x+sway} ${y+lift}`;
  }
  c.save();c.translate(torsoX,torsoY);
  fill(`M107 96 Q117 91 147 98 Q${capePoint(152,122)} ${capePoint(155,146)}
    L${capePoint(163,194)} Q${capePoint(146,189)} ${capePoint(132,195)}
    Q${capePoint(111,204)} ${capePoint(91,198)} Q${capePoint(76,191)} ${capePoint(52,201)}
    Q${capePoint(73,167)} ${capePoint(79,134)} Q85 107 107 96Z`,glaze(u.cape,u.lining,99,204));
  fill(`M106 99 Q${capePoint(96,142)} ${capePoint(76,194)} L${capePoint(55,200)}
    Q${capePoint(73,162)} ${capePoint(80,129)} Q87 107 106 99Z`,u.cape);
  fill(`M141 101 Q${capePoint(146,149)} ${capePoint(157,192)} L${capePoint(147,191)}
    Q${capePoint(137,149)} ${capePoint(133,112)}Z`,u.lining);
  c.restore();

  for(const [x,side] of [[145,1],[105,-1]]){
    c.save();c.translate(x+step*side*6,side*step*3);
    fill('M-9 172 L10 173 L9 197 L7 207 L-8 207 L-12 189Z','#514237');
    fill('M-9 188 L9 186 L7 205 L-7 205Z',rank?u.metal:'#b19a79');
    line('M-7 193 L7 197 M-7 200 L7 195',rank?u.shade:'#806b54',1.6);
    fill('M-8 202 Q0 199 8 201 L10 210 Q17 212 17 217 Q5 220 -12 218 Q-13 211 -8 202Z',rank===2||rank===3?'#303840':'#503c32');
    fill('M-12 215 Q2 217 16 214 L17 218 Q5 221 -12 219Z','#322a26');
    if(rank)fill('M-9 190 L10 187 L10 192 L-9 195Z',u.trim);
    c.restore();
  }

  // Shift weight over the planted foot without pitching the spine.
  c.translate(torsoX,torsoY);
  fill('M99 135 L147 135 L158 182 Q146 187 134 186 L130 176 L127 187 L86 186 Q90 165 99 135Z',glaze(rank?u.metal:'#a45139',rank?u.shade:'#873e2d',142,188));
  if(rank){
    const skirt=rank===4?'#f1e1bd':u.shade;
    for(const [x,dir] of [[94,1],[139,-1]]){
      c.save();c.translate(x,148);c.transform(1,0,-dir*.15,1,0,0);
      fill('M0 0 L14 0 L15 30 L-2 33Z',u.trim);
      fill('M2 2 L12 1 L13 27 L1 29Z',skirt);
      line('M4 7 L12 6 M3 13 L12 12',u.metal,1.8);c.restore();
    }
    fill('M112 145 L137 144 L139 180 L126 190 L111 181Z',u.trim);
    fill('M115 147 L134 146 L136 179 L126 186 L114 179Z',rank===2?'#507389':rank===4?'#a44e39':u.shade);
    fill('M115 165 L126 174 L136 162 L135 169 L126 180 L115 171Z',rank===2?'#f0f2ed':u.trim);
  }else{
    line('M102 150 L97 175 M141 149 L145 175','#743a30',2);
  }

  // Right arm and standard share a wrist so the grasp stays closed on every frame.
  c.save();c.translate(151,111);c.rotate(step*.043);c.translate(-151,-111);
  fill('M145 106 Q156 103 163 116 L167 124 L178 123 L183 137 Q166 143 155 133 L145 122Z',rank?u.shade:'#a4503a');
  fill('M164 124 L178 122 L181 135 L167 138Z',rank?metal:'#ddbf95');
  fill('M168 121 L176 122 L178 137 L170 137Z','#4d382e');
  line('M170 124 L171 133',rank?u.trim:'#987252',1.7);
  c.save();c.translate(179,134);c.rotate(-step*.04);c.translate(-179,-134);
  line('M173 216 L190 19','#55392a',6.4);
  line('M174 213 L191 18','#8c6443',2.1);
  oval(c,191,16,4.9,6.1,'#805331');oval(c,192,14,2.1,2.5,'#a97649');
  c.save();c.translate(190,30);c.rotate(wind*.026);c.translate(-190,-30);
  fill('M174 30 L216 36 L210 109 L190 104 L185 94 L182 103 L170 101Z',glaze('#b54e37','#923927',33,110));
  fill('M174 32 L180 31 L176 99 L170 101Z','#a44531');
  fill('M179 69 Q182 55 192 54 Q190 48 197 46 Q203 45 203 51 Q203 55 199 55 Q202 52 199 50 Q196 49 197 54 Q200 59 192 60 Q184 60 179 69Z M179 77 Q184 69 201 67 L198 73 Q186 72 179 77Z','#f4cb7b');
  c.restore();
  line('M167 26 L220 37','#563c30',6);line('M172 27 L215 36','#9b6c42',4.5);
  line('M176 28 L181 29 M199 32 L205 34','#ac4934',5.7);
  fill('M172 127 Q175 122 179 123 L184 123 Q189 124 186 128 Q190 130 186 133 Q189 136 185 138 Q187 142 181 143 L174 141 L171 136Z',skin);
  line('M180 128 L185 128 M180 133 L185 133 M180 138 L184 138','#b98059',1);
  c.restore();c.restore();

  // Chest, gorget and belt sit under the weapon arm, keeping the blade in front.
  fill('M97 101 Q105 94 121 97 L144 94 Q155 98 158 118 L152 144 Q124 150 90 144 L91 118Z',rank?u.shade:glaze('#ab5341','#8d4032',101,147));
  if(!rank){
    line('M141 102 Q133 116 109 143','#63372f',2.5);
    line('M99 104 L124 124','#753c30',1.6);
  }else{
    const faceMetal=rank===4?'#fbf1d9':u.light;
    const midMetal=rank===4?'#cebf9f':u.metal;
    fill('M102 105 Q109 101 118 105 L130 112 L126 125 L116 129 L101 122 L97 115Z',glaze(faceMetal,midMetal,105,126));
    fill('M133 113 L147 101 Q154 100 155 111 L152 121 L137 127 L130 123Z',glaze(faceMetal,midMetal,102,129));
    fill('M98 124 L115 131 L127 127 L137 131 L151 123 L149 136 L130 144 L119 140 L103 139Z',glaze(faceMetal,midMetal,126,145));
    fill('M102 122 L115 126 L124 123 L122 126 L116 129Z M136 126 L151 119 L149 123 L137 129Z',u.shade);
    fill('M101 114 L107 106 L118 107 L125 112 L113 110Z M134 114 L145 104 L150 104 L144 108Z',rank===4?'#fff8df':u.light);
    fill('M104 126 L113 132 L123 130 L118 138 L109 136Z',midMetal);
    line('M106 139 L118 141 L126 140 M136 139 L148 135',u.shade,1.4);
    line('M108 101 Q119 105 129 111 L148 99',u.trim,2.8);
    fill('M124 108 L132 101 L139 109 L135 118 L130 122 L123 115Z',gold);
    fill('M127 109 L132 105 L135 110 L131 116Z',rank===3?'#63859a':'#fff0bb');
  }
  fill('M91 140 Q121 145 153 138 L154 146 Q120 152 90 148Z',leather);
  if(!rank){
    fill('M121 142 L134 141 L135 146 L122 148Z','#b58953');
    fill('M124 143 L132 142 L132 145 L125 146Z','#806041');
  }else{
    fill('M119 143 L129 137 L139 142 L137 150 L129 155 L120 150Z',gold);
    fill('M124 144 L129 140 L134 144 L129 150Z',rank===4?'#ecd280':u.metal);
  }

  // Resting blade drops toward the forward boot. Hand, guard and blade share the wrist.
  c.save();c.translate(94,111);c.rotate(swing===null?step*.09:swing-1.22);
  fill('M-8 -3 Q2 -8 9 0 L6 13 L-1 25 L-16 22Z',rank?u.shade:'#a34c37');
  fill('M-13 15 Q-8 13 2 20 L-3 36 L-17 38 L-20 33Z',glaze('#fae5bf','#cfb48b',14,40));
  if(rank){
    fill('M-17 22 Q-11 18 -1 23 L-4 37 L-19 36Z',glaze(rank===4?'#fff3d9':u.light,rank===4?'#e2cba5':u.metal,20,39));
  }
  fill('M-20 33 Q-13 31 -3 36 L-4 42 L-20 39Z',rank===4?gold:rank?u.shade:'#91402c');
  c.save();c.translate(-13,41);c.rotate(.77);
  line('M-4 0 L14 0','#825830',4.8);
  fill('M10 -3 L84 -4 L102 0 L87 5 L10 4Z','#7f9099');
  fill('M10 -3 L84 -4 L102 0 L14 .6Z',glaze('#f8fcf9','#cfdae0',-4,2));
  fill('M14 .6 L102 0 L87 5 L16 3Z','#aab9c2');
  line('M12 -10 Q16 -3 11 5 L10 12','#af7936',4.5);
  line('M12 -10 Q15 -3 11 4 L10 10','#f8ce70',2.8);
  oval(c,12,-10,2.8,3,'#efc165');oval(c,10,12,2.8,3,'#d9a14c');
  c.restore();
  fill('M-20 38 Q-16 35 -11 37 L-7 39 Q-5 41 -7 45 L-10 48 Q-13 49 -16 46 Q-20 47 -22 43Z',skin);
  line('M-17 44 L-17 41 M-14 46 L-13 42','#c28f67',1);c.restore();

  if(!rank){
    fill('M88 107 Q94 94 111 91 Q126 98 143 92 Q150 94 155 108 Q143 118 130 117 Q108 113 100 110 L84 118Z',glaze('#537f99','#32536c',95,118));
    line('M97 102 Q116 110 132 111 L148 104','#7091a2',2.3);
  }else{
    for(const far of [true,false]){
      c.save();
      if(far){c.translate(205,19);c.scale(-.50,.80)}
      fill('M78 113 Q82 99 94 94 Q109 91 119 103 L118 110 Q107 119 98 120 L76 124Z',u.shade);
      fill('M81 110 Q87 99 96 97 Q105 95 115 104 L111 110 L100 114Z',glaze(rank===4?'#fff9ea':u.light,rank===4?'#e2cfb5':u.metal,96,116));
      fill('M77 113 Q91 118 100 116 L116 106 L117 111 L102 121 Q89 123 75 118Z',gold);
      line('M82 110 Q88 100 97 99 L108 101',rank===4?'#f9e3b3':u.light,1.5);
      line('M103 120 L114 113',u.shade,1.2);
      line('M78 123 Q89 126 99 123',u.metal,2);
      c.restore();
    }
  }

  if(walking){
    // Let the head settle after each footfall while keeping the eye line level.
    c.translate(0,1.1*Math.sin(2*phase-.6));
  }
  if(!rank){
    fill('M109 68 Q111 53 131 53 Q151 53 155 69 L154 84 Q153 91 147 95 C143 98 139 101 134 101 C128 101 121 97.5 115 94 Q108 90 107 84 Q106 77 109 68Z',skin);
    oval(c,111,82,4.2,5.5,'#d9a57c');
    // Keep the arch at the tie still. The bend travels down the loose hair.
    const middle=6*clothAmplitude*Math.sin(clothPhase-.55);
    const lower=10*clothAmplitude*Math.sin(clothPhase-1.1);
    const tip=15*clothAmplitude*Math.sin(clothPhase-1.65);
    const lift=3*clothAmplitude*Math.cos(clothPhase-1.65);
    c.save();c.translate(103,49);
    fill(`M4 2 C-4 -15 -16 -17 -23 -8
      C-30 1 -30 10 ${-29+middle} 23
      C${-28+middle} 37 ${-35+lower} 47 ${-44+tip} ${54+lift}
      Q${-37+tip} ${57+lift} ${-30+lower} 50
      Q${-34+lower} 59 ${-43+tip} ${63+lift}
      C${-29+tip} ${61+lift} ${-21+lower} 55 ${-16+lower} 46
      C${-9+middle} 32 ${-17+middle} 22 -15 11
      Q-14 5 -9 2 Q-2 -2 3 9Z`,glaze('#55423e','#302827',-14,62));
    fill('M-25 9 Q-25 -7 -16 -10 Q-10 -11 -6 -5 Q-19 -9 -25 9Z','#70534b');
    c.restore();
    // A raised crown flows into the high tie, with a swept fringe above the eyes.
    fill('M99 73 Q92 59 99 47 Q104 37 118 34 L114 31 Q128 28 138 36 Q145 36 152 45 Q159 52 158 65 L156 76 Q152 74 148 67 Q146 72 141 74 L141 68 Q134 72 124 74 L126 69 Q119 74 117 81 L117 89 Q111 86 110 79 L109 73 L103 77Z',glaze('#59453e',hair,32,82));
    fill('M103 56 Q109 39 121 37 Q130 34 139 41 Q130 38 122 42 Q111 47 103 56Z','#70554a');
    fill('M122 61 Q133 46 144 46 Q151 47 154 55 Q147 49 141 52 Q134 53 122 61Z','#624b42');
    line('M97 49 Q99 43 104 41','#a23a30',4.6);line('M97 47 Q99 43 102 42','#dc7050',1.6);
  }else{
    fill('M103 67 Q102 49 125 48 Q151 46 158 66 L156 84 Q155 91 148 96 C143 99 139 102 134 102 C127 102 119 98 113 94 Q106 90 106 84Z',skin);
    oval(c,107,84,5.4,6.5,'#d9a57c');
    const plume=rank===2?'#fffdf6':'#bc4937';
    c.save();c.translate(119,48);c.rotate(wind*.025+plumeSwing*.14);c.translate(-119,-48);
    if(rank===4){
      fill('M122 49 Q109 27 91 34 Q72 54 56 49 Q70 63 84 53 Q78 61 69 62 Q91 66 103 48 Q113 38 120 53Z',glaze('#ede1c9','#c5ac8a',33,61));
      fill('M123 47 Q112 18 91 22 Q77 24 65 41 Q51 62 36 50 Q47 68 64 58 Q73 54 84 43 Q98 29 119 50Z',glaze('#cb5c42','#933a30',22,58));
    }else{
      const end=rank===2?54:77;
      fill(`M122 49 Q116 20 99 19 Q91 18 87 23 L90 23 Q80 28 77 36 Q71 45 ${end} 47 Q${end+5} 53 86 47 Q81 53 75 54 Q92 58 101 44 Q110 33 119 51Z`,glaze(plume,rank===2?'#b9b8b8':'#973b30',19,54));
      line('M116 37 Q110 22 98 23 Q91 24 88 28',rank===2?'#fffdf8':'#ca5840',1.9);
    }
    c.restore();
    fill('M99 72 Q96 55 110 45 Q119 38 127 40 Q145 42 153 60 L157 72 L150 75 L145 69 L133 65 L111 75 L107 91 L98 91Z',glaze(u.light,u.metal,40,80));
    fill('M103 65 Q103 51 117 45 Q112 51 111 59 L106 65Z',glaze(u.light,u.metal,43,67));
    line('M102 67 Q101 52 116 45',u.shade,1.15);
    fill('M99 66 L111 71 L113 80 L109 93 L98 97 L90 92 L97 86Z',glaze(u.metal,u.shade,66,96));
    fill('M149 66 L155 65 Q160 75 161 86 L159 94 L156 91 L155 76Z',u.shade);
    fill('M98 77 Q101 72 106 72 L109 81 L105 88 L96 90 L100 84Z',u.metal);
    line('M94 90 L102 92 L108 88',u.trim,1.8);
    fill('M99 68 L114 66 L132 55 L150 61 L156 69 L153 72 L147 66 L134 64 L114 72 L103 76Z',rank===2?'#b29b6a':helmGold);
    fill('M113 46 L121 40 L125 39 L134 56 L128 59Z',glaze(u.light,u.shade,39,59));
    if(rank>=2){
      fill('M123 43 L130 27 L139 39 L146 57 L139 66 L134 57Z',glaze(rank===4?'#fff29c':u.light,u.metal,29,63));
      fill('M130 29 L138 40 L143 58 L139 57Z',u.shade);
      line('M123 44 L134 57 L139 64',u.trim,2.1);
    }
    if(rank>=3){
      fill('M108 70 L97 63 L88 45 L103 55 L110 61 L108 49 L120 62 L117 70Z',helmGold);
      fill('M143 61 L150 42 L155 58 L155 69 L151 64Z',helmGold);
    }
    fill('M132 61 L140 52 L147 61 L140 72Z',helmGold);
    fill('M137 61 L140 56 L143 61 L140 66Z',rank===2?'#a0e0f0':'#fff0ba');
    oval(c,118,42,4,3,u.trim);line('M116 41 L120 40',u.shade,1.3);
  }
  // At battlefield scale each eye needs its own clear patch of skin.
  const eyeCenters=rank?[125,145]:[126,144];
  for(const x of eyeCenters){
    fill(`M${x-3.4} 81.4 a3.4 3.4 0 0 1 6.8 0 v${rank?5.2:4.2} a3.4 3.4 0 0 1 -6.8 0Z`,'#352922');
  }
  c.restore();
}
const mercSkins=[0,1,2,7,17,18,19,20,21,22];
function troopSkin(id,q=0){const skin=mercSkins[id];return "merc"+skin+(q?"tier"+q:"")}
// Shared by standing soldiers and riders so that each rank has the same silhouette.
function mercenaryUniform(c,rank,coat,trim,step){
  const fill=(path,color)=>{c.fillStyle=color;c.fill(new Path2D(path))};
  const line=(path,color,width)=>{
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(path));
  };
  const steel=rank===2;
  const guard=rank===3;
  const edge=guard?'#dfb568':'#a7b7af';
  const dark=guard?'#293637':'#485b60';
  const plate=guard?'#435555':'#778b8b';

  if(guard){
    const tail=3+step*1.2;
    fill('M12 14 Q6 14 6 20 L'+tail+' 30 L6 29 L7 32 L12 29 L16 16 Z','#853c35');
    line('M6 29 L7 30 L10 28','#c89c56',.9);
  }
  // Crossed collar, sleeves and split hem remain visible underneath heavier equipment.
  fill('M9 15 Q14 13 20 14 L23 18 L22 23 L20 22 L23 29 L17 30 L15 27 L13 30 L7 29 L10 21 L6 22 L6 18 Z',coat);
  fill('M9 16 L12 16 L13 22 L10 28 L7 28 L10 21 L6 22 L6 19 Z',trim);
  line('M11 15 L15 19 L19 15 M15 19 L12 22','#c6b699',1);
  if(rank===1){
    // Wide vertical wooden slats with two dark lashings.
    fill('M10 15 L20 14 L22 23 L10 24 Z','#493527');
    fill('M10.6 16 L13 16 L13.4 22.6 L11.3 22.8 Z','#bb8955');
    fill('M13.9 16 L16.6 15.7 L17 22.2 L14.5 22.6 Z','#a97445');
    fill('M17.4 15.4 L19.6 15 L21 21.8 L18 22.2 Z','#c79359');
    line('M10.7 17.9 Q16 18.5 20.2 16.8 M11 21 Q16 21.6 21 19.9','#62452f',.85);
    fill('M6 16 L10 14 L13 16 L12 18 L6 20 Z','#926438');
    line('M7 17 L11.5 15.7','#d4ab71',.9);
  }
  if(steel||guard){
    fill('M9 15 Q15 17 21 14 L22 22 L17 24 L10 23 Z',dark);
    fill('M10 16 Q15 18 20.5 15 L21 20.8 Q16.5 23.2 10.6 21.8 Z',plate);
    fill('M9 23 L15.5 24 L14 30.5 L7.5 29 Z M16.5 24 L21 22.8 L23.5 28.8 L17 30 Z',dark);
    line('M10.5 18.5 Q16 20.2 20.6 17.6 M11 21 Q17 22.4 21 20 M9.8 26 L14 27 M17.6 26.5 L21.1 25.3',edge,.8);
    fill('M5.2 16.2 L9.8 13.4 L14 15.4 L13.3 18.9 L5.4 20 Z',dark);
    fill('M6.4 16.5 L10 14.6 L13 15.9 L12.4 17.2 L6.3 18.5 Z',plate);
    line('M6 19 L13 17.8',edge,1);
    if(guard){
      fill('M13.5 16 L16 17.1 L14.7 20.6 L12.3 19.8 Z M17.1 17 L20 15.5 L20.5 19.2 L17.8 20.2 Z','#d6a554');
      fill('M13.3 23 L17 23 L17.7 29.2 L15.3 31.8 L12.9 29.4 Z','#a34337');
      line('M14.4 25 L15.2 29.4 L16.2 27.3','#e4bb70',.8);
    }
  }
  fill('M9.2 22.3 Q15 23.4 21.5 21.5 L22 23.4 Q15 25.3 9 24 Z','#4d3931');
  if(rank)fill('M15 22.8 L17.5 22.5 L17.7 24 L15.2 24.4 Z',guard?'#edc578':'#b5996c');

  fill('M10.8 7 Q14 4.4 21 6.6 L21.4 12.6 C21 14.6 18.9 16 16.6 16 C13.6 16 10.3 15.3 9.7 12.7 Q9.3 10.9 10.8 7Z','#e2b98f');
  if(rank<2){
    fill('M8.7 9.6 Q8 3.8 14.3 3.2 Q20.2 2.6 22 7 L21 8.8 L13 9.6 L11.4 13.5 L8.7 14 Z','#473b34');
    oval(c,14,2.7,2.9,2.2,'#473b34');
    fill('M8.4 7.7 Q14 7.5 21.1 5.9 L22 7.9 L10.8 9.8 L8 13.6 L5 14.8 L7.6 10 Z',rank===1?'#806043':trim);
    line('M12 4 L16 3.8','#b6986c',.7);
  }else{
    fill('M7.3 9 Q7.7 4.1 14.1 2 L16.2 1.5 Q21.6 2.9 22.4 6.9 L24 8.5 L14.2 10 L12.1 14.7 L7.4 16 Z',dark);
    fill('M9.1 7.4 Q10.2 3.7 15.6 2.8 Q19.8 3.4 21.5 6.7 L14 7.1 Z',plate);
    line('M8.3 8.9 Q15.4 7.2 22.6 7.7 M8.7 12.1 L12 11.4',edge,1);
    if(guard){
      fill('M17.7 3.7 Q15 .1 10.9 .4 Q5.4 .3 2.4 6.5 L6.2 5.4 L3.2 10.2 Q9.1 8.7 11.8 4.8 Q14.4 3.6 17.7 4.6 Z','#ae493d');
      line('M6.1 4.1 Q10.9 .5 15.2 2.8','#d78758',.85);
      fill('M15 4.1 L17 2.9 L18 6.6 L16.1 8 Z','#dfb568');
    }
  }
  fill('M16.6 10.8 L17.8 10.6 L17.8 12.6 L16.6 12.8 Z M20.1 10.4 L21.1 10.2 L21.1 12 L20.1 12.2 Z','#332a23');
}
function mountedLancer(c,phase,ally,q,ink,pose,enemyCloth){
  const step=Math.sin(phase);
  const fill=(path,color)=>{c.fillStyle=color;c.fill(new Path2D(path))};
  shadow(c,23,40,13);
  for(const [x,side] of [[12,-1],[31,1],[16,1],[28,-1]]){
    c.save();c.translate(x,29);c.rotate(side*step*.33);
    fill('M-2 0 L2 0 L1 7 L3 10 L2 12 L-1 12 L-2 8 Z',side<0?'#50372c':'#79503a');
    c.restore();
  }
  c.translate(0,-Math.abs(step)*1.2);
  fill('M10 22 Q5 20 3 26 L1 34 Q6 33 9 28 Z','#48332c');
  fill('M8 23 Q14 18 25 22 Q30 21 32 14 L35 11 L36 7 L39 11 L41 9 L41 14 L46 20 Q45 24 41 23 L36 20 Q36 29 31 32 Q24 35 13 32 Q6 32 8 23 Z','#98683f');
  fill('M28 23 Q31 13 35 11 L38 12 L34 17 L32 26 Z','#49342c');
  fill('M13 21 L26 21 L25 31 L16 29 L12 30 Z',ally?'#416879':enemyCloth.base);
  fill('M14 27 L24 29 L24 31 L14 29 Z','#d4aa6c');
  if(ally){
    fill('M17 20 L25 21 L22 27 L21 30 L17 30 L18 25 Z','#49382f');
    c.save();c.translate(8.2,1.4);c.scale(.85,.83);
    mercenaryUniform(c,q,'#537775','#395554',step);
    c.restore();
  }else{
    fill('M17 12 Q21 9 25 13 L27 22 L17 24 L14 21 Z',enemyCloth.base);
    fill('M18 21 L25 21 L22 27 L21 30 L17 30 L18 25 Z','#49382f');
    fill('M17 8 Q17.2 4 22 4 Q26 4.2 26 9 C26 12.7 24.5 14.5 22.3 14.5 Q20.6 14.5 19.3 13.6 Q16.8 13 16.8 10.2Z','#e2bb90');
    fill('M16 9 Q16 2 21 2 Q26 2 27 7 L26 9 L19 9 L18 12 L16 12 Z','#a59b90');
    fill('M16 7 Q17 1 22 2 Q26 3 27 7 L29 8 L18 9 L18 13 L14 14 Z','#6a554d');
    fill('M18 3 Q15 0 11 2 L7 4 Q12 4 14 3 L19 5 Z',enemyCloth.base);
    fill('M16 15 L24 13 L26 19 L17 21 Z','#74786c');
    fill('M16 17 L25 15 L25 16 L17 18 Z M17 20 L26 18 L26 19 L17 21 Z','#43483f');
  }
  fill('M35 12 L40 13 L44 19 L41 20 L36 16 Z',ally?'#b39864':'#a07854');
  fill('M12 23 L15 24 L14 29 L11 28 Z M24 23 L27 22 L26 29 L23 30 Z','#715741');
  if(!ally){
    // Overlapping neck plates and a forked lance pennon identify the hostile cavalry.
    fill('M28 21 L34 14 L38 16 L35 21 L32 25 L27 27 Z','#424647');
    fill('M30 21 L34 17 L37 17 L34 19 Z M28 24 L32 20 L35 20 L32 23 Z','#918779');
    fill('M12 22 L24 24 L22 34 L18 31 L15 33 L13 30 Z',enemyCloth.base);
    fill('M17 24 L21 25 L18 28 L15 26 Z','#dbac6b');
    fill('M14 14 L19 12 L23 15 L20 19 L12 20 Z','#383f42');
    fill('M13 16 L20 14 L22 15 L13 18 Z','#af9980');
    fill('M16 6 L27 5 L29 7 L21 8 L18 12 L15 12 Z','#343b3c');
    fill('M39 9 L45 5 L42 10 L37 14 L38 11 L34 13 Z',enemyCloth.base);
  }
  c.save();c.translate(21,20);c.rotate(pose*.55);c.translate(-21,-20);
  if(q){c.strokeStyle=ink;c.lineWidth=3.4;if(q===3){c.shadowColor=ink;c.shadowBlur=4}c.stroke(new Path2D('M21 20 L49 2'))}
  c.strokeStyle='#68472d';c.lineWidth=1.35;c.beginPath();c.moveTo(21,20);c.lineTo(45,5);c.stroke();
  fill('M42 6 L49 2 L46 7 L42 9 Z','#cac4ad');
  c.restore();oval(c,25,17,2,1.8,'#dbb18a');oval(c,40,15,1,.85,'#392820');
}
function miniature(c,p,id,phase=0,q=0,weaponInk,pose=0,variant='',enemyCloth=campaigns.border.colors){
  const mercenary=variant==='mercenary';
  if(id===8||id===22){mountedLancer(c,phase,id===22,q,weaponInk,pose,enemyCloth);return}
  const recruit=id>=17&&id<=22;
  const recruitSkin=id;
  if(id===23)id=5;
  if(recruit)id=({17:10,18:2,19:14,20:9,21:11})[id];
  if(id===6){bannerCommander(c,phase);return}
  const weapon=id%3,enemy=(id>=3&&id<=5)||id>=9,step=Math.sin(phase);
  const allied=recruit||!enemy;
  const coat=recruit?'#506975':allied?({0:'#615175',1:'#923e32',2:'#787044',7:'#875039'})[id]:enemyCloth.base;
  const trim=recruit?'#384957':allied?({0:'#40354f',1:'#662d28',2:'#514f34',7:'#603727'})[id]:enemyCloth.shadow;
  const paint=(path,color)=>{c.fillStyle=color;c.fill(new Path2D(path))};
  const stroke=(path,color,width)=>{
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(path));
  };
  function wash(x,end,dark,light){
    const g=c.createLinearGradient(x,0,end,4);g.addColorStop(0,dark);g.addColorStop(1,light);return g;
  }
  shadow(c,15,34,7);
  for(const side of [-1,1]){
    c.save();c.translate(15+side*3.4+side*step*2.1,side*step*2);
    paint('M-2.7 25 Q0 24 2.4 26 L2.9 33.6 Q.8 35 -2.7 34.3 Z',wash(-3,3,'#382b26','#624c3b'));c.restore();
  }
  c.translate(step*.65,-Math.abs(step)*1.1);
  if(weapon===2&&id<9){
    stroke('M8 22 L3 12 M9 20 L5 10 M10 18 L8 10','#654627',1);
    paint('M3 14 L9 12 L13 22 Q10 25 8 24 Z','#5b412f');
  }
  if(mercenary){
    mercenaryUniform(c,q,coat,trim,step);
  }else{
    if(q>=2){
      const hem=3+step*1.4;
      paint('M12 14 Q7 15 7 19 L'+hem+' 31 Q7 33 11 30 L15 17 Z',q===3?'#913e30':'#685381');
      stroke('M7 20 L'+hem+' 31 L7 31',q===3?'#ebb767':'#ad92bd',1);
    }
    paint('M10 15 Q15 13 20 15 L23 28 Q17 30.5 7 28.7 Z',wash(7,23,trim,coat));
    paint('M8.7 22 Q16 23 21.3 21 L21.9 23.1 Q16 25 8.4 24.1 Z','#493328');
    paint('M8.7 15.8 Q13 12.8 20 14.6 L21.7 17.4 L17 19.8 L12 17.6 L8 18.8 Z',trim);
    if(q){
      const plate=['',['#405960','#a6c2bf'],['#41445f','#a69ab7'],['#85552f','#e8ba6e']][q];
      paint('M11 15 Q16 17 20 14 L22 21 Q17 25 10 22 Z',wash(10,22,...plate));
      if(q===1)stroke('M11 16 L19 22','#dbc8a0',2.2);
      if(q>=2){
        paint('M11 23 L20 22 L22 29 L17 28 L14 31 L10 29 Z',q===2?'#47375b':'#8a332d');
        stroke('M14 24 L15 28 L18 24',plate[1],1.5);
      }
    }
    paint('M11 7 Q14 4.2 21 6.8 L21 13.5 C20.5 15.1 18.5 16 16.4 16 C13.5 16 10.3 15.2 9.6 12.9 Q9.4 10.1 11 7Z',wash(11,21,'#ba9167','#ebc79a'));
    // Cloth wraps and tied hair give light troops a different silhouette from armored ranks.
    const lightTroop=[0,2,3,5,9,12,16].includes(id);
    const binding=allied?'#476b6a':enemyCloth.base;
    const brass=q===3?'#ebc789':'#bc9b66';
    if(lightTroop){
      paint('M9 10 Q8 4 14 3 Q20 2 22 7 L21 9 L14 9 L12 13 L9 14 Z',wash(8,22,'#3a302d','#625048'));
      oval(c,13.6,2.8,3.1,2.3,'#443631');
      stroke('M11 4 L16 3.8',brass,.85);
      paint('M8 8 Q14 7 21 6 L22 8 L11 10 L8 14 L4 16 L7 10 Z',binding);
    }else{
      paint('M8 9 Q9 3.5 15 2 L16 .6 L18 2.6 Q22 4 22 7 L24 8 L14 10 L12 15 L7 16 Z',wash(7,24,'#454c4c','#92998c'));
      stroke('M8.5 9 Q15 7 22 7.4',brass,1);
      stroke('M8.8 12 L12 11.4 M8.5 14 L11.5 13.5','#b1a082',.65);
    }
    if(lightTroop){
      paint('M10 15 L14 15 L20 20 L18 21 Z',brass);
      stroke('M19 15 L12 22',allied?'#c8be9e':'#c39278',1.35);
      paint('M10 24 L14 24 L13 30 L10 29 Z',binding);
    }else{
      paint('M10 16 Q15 18 21 15 L22 22 Q17 24 10 22 Z',wash(9,22,'#454c49','#838877'));
      stroke('M10.5 18.5 Q16 20 21 17.8 M11 21 Q16 22 21.5 20','#b9ab88',.68);
      paint('M10 24 L15 25 L14 30 L8 29 Z M16 25 L21 24 L23 29 L16 30 Z',trim);
    }
    if([10,13,14].includes(id)){
      for(const x of [13,18.4]){
        oval(c,x,18.9,2.3,2.6,'#514635');
        oval(c,x+.15,18.5,1.8,1.95,brass);
      }
    }
    if(!allied){
      // The iron shoulder silhouette and ochre waist tab read even on the smallest sprites.
      paint('M5.5 15.4 L10.5 12.6 L15.4 15 L13.3 19.3 L5 20.4 Z',wash(5,15,'#343839','#646966'));
      stroke('M6.5 16.1 L10.6 14.3 L14 15.8','#b9ab8e',1.05);
      paint('M8 23 L22 21.6 L22.5 24 L17 25 L15.7 31.5 L12.4 29.7 L10.8 31 L11 25 L7.6 25 Z',enemyCloth.light);
      paint('M13.3 22.7 L16.8 22.1 L17 24 L13.5 24.7 Z','#d0ad70');
      if(lightTroop){
        paint('M8 8.5 Q13 6 22 6 L22.8 8.8 L11.8 10.5 L7.5 14.5 L3 16 L5.6 12.8 L2 13.2 Z',enemyCloth.light);
        paint('M10.5 7.8 L19 6.4 L21 8.1 L12.5 9.6 Z','#535956');
        paint('M11 12 L16.2 13.2 L21.4 12 L20.8 15.2 C19.6 16.5 18 17.1 16.4 17.1 C14.1 17.1 12 16.4 10.8 14.8Z','#483e3a');
        stroke('M12 17 L21 20.4 M12.7 19.5 L20.8 22','#666763',1.4);
      }else{
        paint('M7.4 9 Q8 3.4 15.4 2 L18 2.5 Q22 4 23 7 L25 8.7 L15 9.8 L13.5 15 L8 16.2 Z',wash(7,23,'#343a3d','#717875'));
        paint('M13.3 4 Q9 1 4 3 L1.6 5.7 L6 4.9 L3 8.4 Q10 7.8 15 4.7 Z',enemyCloth.light);
        stroke('M9 9 Q15 7 22.8 7.8','#c7a572',1);
        paint('M10 24.8 L14 25.2 L12.5 30.4 L7.2 29 Z M17.3 25 L21.7 24 L24 28.7 L17 30 Z','#464746');
      }
    }
    if(recruitSkin===23){
      paint('M10 7 L12 2 L15 1 L18 4 L17 7 Z','#6e4435');
      stroke('M10 5 L18 4',brass,.9);
    }
    paint('M16.5 10.9 L17.7 10.7 L17.7 12.8 L16.5 13 Z M20 10.4 L21 10.1 L21 12.1 L20 12.4 Z','#30271f');
    if(q){
      const metal=q===3?['#a2733d','#f0cc83']:['#536979','#bbccd1'];
      paint('M7 18 Q8 12 13 14 L15 17 L12 20 Z',wash(7,15,...metal));
      stroke('M10 10 Q16 11 21 9',metal[1],1.3);
      if(q===2){
        paint('M18 5 Q13 1 8 3 Q5 4 3 11 L8 9 L7 12 Q12 10 14 6 Z',wash(3,18,'#514568','#b29abd'));
      }
      if(q===3){
        paint('M19 5 Q16 0 10 1 Q5 1 2 8 L6 7 L2 14 Q9 12 12 7 Q15 5 19 6 Z',wash(2,19,'#92352e','#ed9758'));
        stroke('M9 9 Q15 7 22 7',brass,1.45);
        stroke('M10 26 Q16 28 21 25','#eac279',1.5);
      }
    }
  }
  c.save();
  c.translate(20,21);if(id===1)c.translate(5*pose,0);
  const swing=recruit?(recruitSkin===18?.18:1.05):id===1?1.02:id===7?1.8:id===0?.96:0;
  c.rotate(step*.10+pose*swing);c.translate(-20,-21);
  const lightEdge=q===3&&!recruit?({
    0:'M23 19 L33 6',
    1:'M28 7 L31.5 1.5',
    2:'M25.5 9 Q36.5 17 26.6 28',
    7:'M31 12 Q30 15 34 15 Q33 19 28 20'
  })[id]:null;
  if(recruit&&q){
    const outline={17:'M18 12 L32 10 L33 29 L25 34 L17 30 Z',18:'M18 25 L33 14 M22 12 Q33 14 35 25',19:'M20 13 L27 6 L34 12 L28 19 Z',20:'M3 14 L7 21 M23 20 L32 12',21:'M26 10 L31 1 L34 7 L30 14'};
    c.save();
    if(q===3){c.shadowColor=weaponInk;c.shadowBlur=5}
    stroke(outline[recruitSkin],weaponInk,3.1);c.restore();
  }
  if(lightEdge){
    c.save();
    c.shadowColor='#ffbd42';c.shadowBlur=6;
    stroke(lightEdge,'rgba(255,192,72,.7)',4.8);
    c.restore();
  }
  if(q>0&&!recruit){
    if(id===1){
      stroke('M20.3 34 L29 5',weaponInk,4);
      stroke('M27.3 7.6 L29.4 2.5 L32 .5 L31.5 6.3 L29 8.8 Z',weaponInk,2.6);
    }else if(id===2){
      stroke('M25.5 9 Q36.5 17 26.6 28',weaponInk,4.4);
    }else if(id===7){
      stroke('M21 29 L28 10',weaponInk,4);
      stroke('M27 10 L31 11 Q30 15 35 15 Q33 22 27 20 L25 15 Z',weaponInk,2.6);
    }
  }
  if(recruitSkin===18||recruitSkin===23){
    stroke('M16 25 L32 15','#68492f',3);
    stroke('M20 12 Q32 14 35 25','#847465',2);
    stroke('M20 12 L20 22 L35 25','#c7b69a',.7);
    stroke('M19 23 L34 14','#cfb997',1);
  }else if(recruitSkin===19){
    stroke('M18 30 L29 10','#775333',2.4);
    paint('M21 8 L26 5 L35 11 L31 17 L21 12 Z',wash(21,35,'#716768','#d2c6bb'));
  }else if(id===13){ // Two-handed greatsword
    stroke('M18 27 L24 17','#61402b',2.3);
    paint('M20 20 L29 5 L35 1 L33 8 L24 22 Z',wash(20,34,'#88878d','#e9dfcc'));
    stroke('M18 18 L26 23','#caa369',1.8);
    oval(c,19,25,2,1.6,'#dab38a');
  }else if(id===14){ // War pick
    stroke('M18 31 L28 8','#715033',2.2);
    paint('M17 8 Q25 6 29 8 Q34 11 35 18 Q29 13 26 12 L19 12 Z',wash(17,35,'#827773','#d1c7b6'));
    paint('M4 16 L9 15 L10 24 L4 25 Z','#8a623b');
  }else if(id===15){ // Flail
    stroke('M20 24 L24 8','#744e31',2);
    const sway=Math.sin(phase)*2;
    stroke('M24 8 Q'+(31+sway)+' 6 '+(31+sway)+' 18','#645951',1);
    c.save();c.translate(31+sway,20);
    paint('M0 -6 L2 -3 L5 -4 L4 -1 L6 1 L3 2 L2 5 L0 3 L-3 5 L-3 2 L-5 0 L-3 -2 L-4 -4 L-1 -3 Z','#817776');
    oval(c,0,-.5,2.3,2.3,'#c3b6aa');c.restore();
  }else if(id===16){ // Torch raider
    paint('M11 8 Q8 12 3 11 L6 14 L3 16 Q9 15 12 10 Z','#a35d42');
    stroke('M23 25 L28 11','#694331',2.3);
    paint('M25 13 Q20 9 25 4 L26 7 Q30 5 29 1 Q36 8 30 13 Z','#da7035');
    paint('M26 12 Q24 9 28 7 L29 5 Q31 10 29 12 Z','#ffdc80');
    paint('M5 25 L11 22 L14 23 L8 27 Z','#c9bbab');
  }else if(id===9){
    stroke('M7 25 L2 13 M22 24 L32 11','#59402f',2);
    paint('M3 19 L1 10 L4 13 L7 21 Z M23 20 L33 7 L32 13 L26 22 Z',wash(1,32,'#ada3aa','#f4dfbe'));
  }else if(id===10){
    paint('M18 12 L32 10 L33 29 L25 34 L17 30 Z','#aea097');
    paint('M20 14 L30 13 L30 28 L25 31 L20 28 Z',recruit?'#496477':enemyCloth.shadow);
    stroke('M21 20 Q21 17 24 18 Q28 20 28 16 M22 25 Q26 26 28 22','#e3bf86',1.3);
  }else if(id===11){
    stroke('M20 34 L29 5','#654826',2);
    paint('M26 9 L30 1 L32 1 L31 7 L34 5 Q36 11 30 14 L30 10 Z',wash(26,35,'#938782','#e7d3b4'));
    paint('M27 10 L18 11 L17 16 L25 13 Z','#ad4e37');
  }else if(id===12){
    paint('M9 7 L21 6 L22 8 L10 10 L4 13 L6 10 L3 10 Z','#514956');
    paint('M10 15 Q6 20 2 27 L7 25 L5 29 L14 23 Z','#776272');
    stroke('M18 24 L25 20','#5e4331',2);
    paint('M23 20 L32 14 L29 20 L25 23 Z','#d4c9b2');
  }else if(id===7){
    stroke('M21 29 L28 10','#704a31',1.8);
    paint('M27 10 L31 11 Q30 15 35 15 Q33 22 27 20 L25 15 Z',wash(25,34,'#767374','#d5c9b5'));
  }else if(weapon===0){
    if(enemy){
      paint('M21 22 L29 16 L33 15 L30 19.3 L22 24 Z',wash(21,33,'#918882','#ded5c5'));
      stroke('M19 25 L23 21','#5a4030',1.8);
      paint('M18 18 L21 18.5 L23 21.4 L20.3 23 L17.8 21 Z','#cfaa80');
    }else{
      const blade='M22.5 19.7 L29.5 8.8 L34 5 L32.4 11.2 L25 21.5 Z';
      if(q)stroke(blade,weaponInk,2.2);
      paint(blade,wash(22,34,'#859399','#e5dfcc'));
      stroke('M24 19.5 L32.5 7.5','#e4e8db',.8);
      stroke('M20.2 25.4 L24 20.1','#594033',1.9);
      stroke('M21.4 18.8 L26.6 22',q>=2?'#e1b774':'#ab885c',1.6);
      paint('M16.7 18.4 Q18.2 17.6 19.7 19 L20.8 21.5 Q22.8 20.4 23.6 22.1 L22.4 24.2 Q19.6 24.8 18.4 22.8 Z','#cea780');
    }
  }else if(weapon===1){
    stroke('M20.3 34 L29 5','#694831',1.65);
    paint('M27.3 7.6 L29.4 2.5 L32 .5 L31.5 6.3 L29 8.8 Z',wash(27,32,'#887d78','#dfd2bd'));
    paint('M18.4 17.6 Q20 16.6 21.7 18.4 L23.9 19 L25 17.3 Q27.6 16.8 27.1 20 L25 22.4 L20 21.3 Z','#d8b78b');
  }else{
    stroke('M25.5 9 Q36.5 17 26.6 28','#694527',1.5);
    const nock=21.4-6*pose;
    stroke('M25.5 9 L'+nock+' 18 L26.6 28','#b9a483',.48);
    paint('M15 17.3 L24 17.8 L28.8 16.7 L29.5 19 L25.6 20.5 L16 20.2 Z',wash(15,29,'#987455','#e3be91'));
    c.save();c.translate(-6*pose,0);
    stroke('M16 18 L33 17.1','#63482b',.72);
    p([[32,16.2],[35,17],[32,18.1]],'#776953');c.restore();
  }
  if(q && id===1){
    paint('M28 8 Q24 8 22 7 L'+(23-q*3)+' '+(10+q*2)+' Q22 13 27 12 Z',['','#527371','#695477','#a84c34'][q]);
  }else if(q && id===2&&!recruit){
    stroke('M26 9 Q32 11 32 16 M32 22 Q31 26 27 28',['','#adc8bd','#b8a1c4','#efc47a'][q],1.8);
    if(q>=2)paint('M25 9 L22 5 L29 8 L30 12 Z M27 27 L24 32 L30 29 L31 24 Z',q===3?'#ddb16c':'#a59bb0');
  }else if(q && id===7){
    paint('M27 11 Q23 12 21 9 Q19 15 23 18 L27 16 Z',['','#859d9b','#958ba7','#d4a368'][q]);
    if(q>=2)stroke('M29 18 Q32 18 34 15',q===3?'#ffe0a0':'#e0cfe5',1.6);
  }
  if(lightEdge)stroke(lightEdge,'#fff1ac',1.25);
  c.restore();
  if(weapon!==2){
    paint('M9 17 Q11.3 16.7 12.5 19 L10.3 23.1 L6.4 22 Z','#ceae89');
    paint('M6.4 21.6 L10.5 22.5 L9.6 25.7 L5.8 25 Z','#614836');
  }
}
function campaignGeneral(c,stageKey,phase){
  const cloth=campaigns[stageKey].colors,step=Math.sin(phase);
  const fill=(d,color)=>{c.fillStyle=color;c.fill(new Path2D(d))};
  const line=(d,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(d))};
  c.lineJoin='round';c.lineCap='round';
  const priest=stageKey==='border';
  const helmet=['keep','xiapi','tongguan','dingjun','fancheng'].includes(stageKey);
  const armored=helmet||stageKey==='camp';
  shadow(c,16,34,8);
  for(const side of [-1,1]){
    c.save();c.translate(side*(3+step*1.6),side*step);
    fill('M13 25 L18 25 L18 32 L20 33 L20 34 L13 34Z','#41332e');c.restore();
  }
  c.translate(step*.32,-Math.abs(step)*.65);
  fill('M11 15 Q6 16 6 22 L2 30 Q7 29 11 31 L17 18Z',cloth.shadow);
  fill('M11 14 Q16 13 21 15 L23 20 L21 23 L24 30 L18 31 L16 28 L14 31 L7 30 L10 21 L7 21Z',cloth.base);
  fill('M10 17 L13 16 L15 24 L11 30 L8 29Z',cloth.shadow);
  line('M12 15 L16 19 L21 15 M16 19 L13 24',priest?'#f8df87':'#e3c7a1',1.25);
  if(armored){
    fill('M10 16 Q15 19 21 16 L21 22 L16 24 L10 22Z','#52565a');
    line('M11 18 Q16 20 20 18 M11 21 Q16 23 20 20','#c3ae87',.9);
    fill('M7 17 Q10 13 13 16 L13 18 L7 20Z',cloth.light);
  }
  fill('M10 22 Q15 23 21 21.8 L21.5 24 Q16 25 10 24Z','#513c32');
  fill('M15 22.5 L18 22.3 L18 24 L15 24.3Z','#e1b56c');
  fill('M11 8 Q14 4 20 6 L22 9 L21.8 12.5 Q21 15.3 17 15.6 Q12 16 10.6 12.2Z','#e8bf96');
  fill('M16 10 L17.2 10 L17.2 12.1 L16 12.2Z M20 9.7 L21 9.6 L21 11.8 L20 12Z','#352a23');
  if(priest){
    fill('M9 8 Q9 3 13 3 L15 0.8 L18 3 Q22 3 22.5 7 L12 10 L10 14 L7 14Z','#b77e2c');
    fill('M9 7 L22 5.5 L23 7.8 L12 9.4 L8 14 L4 15 L7.5 10 L4 11Z','#f4c34d');
    fill('M12 12 L15 14 L19 13.5 L21 12.4 L20 16 L16 20 L15 17 L13 17Z','#6d5740');
  }else if(helmet){
    const silver=stageKey==='tongguan';
    fill('M8 9 Q8 4 14 3 L16 1 L19 3 Q23 4 23 7 L24 8 L14 9 L12 14 L8 15Z',silver?'#bfcbd0':'#444d52');
    if(stageKey==='xiapi'){
      line('M14 5 Q9 -2 4 2 L1 7 M16 4 Q15 0 9 .8 Q6 1 4 5','#da7353',1.6);
      fill('M11 6 L13 2 L15 5 L18 2 L20 5 L22 4 L21 7 L13 8Z','#e4b669');
    }else if(stageKey==='fancheng'){
      fill('M8 8 L12 9 L11 15 L7 15Z M20 7 L23 7 L24 13 L22 13Z','#68798b');
      line('M14 3 L17 2 L19 6','#c5ab72',1.3);
    }else if(stageKey==='dingjun'){
      fill('M9 6 Q5 6 3 11 L7 10 L5 14 Q11 11 12 7Z',cloth.light);
    }else{
      fill('M15 3 Q10 -1 5 2 L2 6 L6 5 L4 8 Q11 7 15 3Z',silver?'#f4efe3':'#b75844');
    }
    line('M10 8 L22 6.5',silver?'#f1dec2':'#d4ad64',1);
  }else{
    fill('M10 9 Q9 5 13 4 L19 3 L22 6 L22 8 L14 8 L12 13 L10 13Z','#3e3432');
    if(stageKey==='camp'){
      fill('M11 6 L12.5 2 Q13.5 .3 15 .5 L19 1.4 L20.5 5.6Z','#ba9057');
      line('M14 2 L13.3 5 M16.8 2 L16 5 M9.5 5.3 L22.3 4.6','#efcb88',.8);
      line('M11 6 L21 5.5','#ffe09b',1.2);
    }else if(stageKey==='wuzhang'){
      fill('M9 7 L10 2 L13 3 L14 .5 L20 1 L22 7Z','#35313e');
      line('M10 6 L21 5 M15 2 L15 5','#aa9c99',.8);
    }else if(stageKey==='pass'){
      fill('M10 6 L10 3 L13 3 L13 1 L18 1 L21 4 L21 6Z','#38383c');
      line('M10 6 L21 5.5','#c4a16d',1);
    }else{
      fill('M9 6 L10 2 Q15 -.5 20 2 L21 6 L17 5 L13 7Z','#655144');
      line('M10 3 Q15 2 19 3','#e8c99e',1);
    }
    if(stageKey!=='pursuit')fill('M14 13.2 Q17 15.3 21 13 L20 15.6 L17 18 L15 16Z','#493931');
  }
  c.save();c.translate(22,21);c.rotate(step*.05);
  if(priest){
    line('M1 10 L4 -16 L7 -18','#69462b',1.8);
    oval(c,6,-18,1.6,1.6,'#ebc270');
    fill('M4 -14 L8 -13 L7 -7 L3.5 -8Z','#f4d67b');
    line('M5 -12 L6.5 -11 L5 -9','#a44b37',.7);
  }else if(stageKey==='xiapi'){
    line('M-4 13 L9 -16','#734c37',1.6);
    fill('M7 -12 L11 -20 L10 -13 L8 -10Z M7 -10 Q12 -11 11 -16 Q16 -11 8 -8Z','#d7dfd8');
    line('M6 -9 L10 -8','#d6ab62',1);
  }else if(stageKey==='tongguan'){
    line('M-4 13 L8 -14','#695047',1.5);
    fill('M6 -12 L8 -17 L11 -20 L10 -14 L8 -11Z','#f0eeea');
    fill('M7 -12 Q4 -10 3 -6 L6 -8 L5 -5 L9 -11Z','#b75644');
  }else if(stageKey==='dingjun'){
    line('M1 -11 Q13 -2 7 10','#ad804a',1.8);
    line('M1 -11 L2 -1 L7 10','#e4ceab',.65);
    line('M-1 1 L11 -3','#d8cbb3',.9);
  }else if(stageKey==='fancheng'){
    fill('M0 -7 L9 -8 L12 -5 L10 3 L6 7 L0 3 L-2 -3Z','#b79a65');
    fill('M1 -5 L8 -6 L10 -4 L8 2 L6 4 L2 2Z','#455773');
    line('M4 -4 L7 1 M7 -4 L4 1','#b9bbc0',.9);
  }else if(stageKey==='wuzhang'){
    line('M0 2 L5 -6','#78593c',1.3);
    fill('M4 -4 Q0 -8 2 -12 L5 -10 Q5 -15 8 -16 L9 -12 L12 -14 Q13 -8 6 -4Z','#d9d6c7');
    line('M5 -5 L8 -12','#969589',.8);
  }else if(stageKey==='keep'){
    line('M-3 11 L8 -14','#6e513d',1.5);
    fill('M7 -11 L8 -19 L10 -16 L9 -13 L13 -15 Q12 -9 7 -9Z','#d5d8c9');
  }else{
    fill('M1 -1 L11 -13 L12 -16 L12 -11 L3 .8Z','#d3d9d4');
    line('M-.5 -2 L4 1','#d5ad61',1.5);
  }
  c.restore();
  fill('M17 17 L20 16.5 L21.5 19.5 L24.5 19 L25 21.5 Q21 23 18.5 21Z',cloth.light);
  oval(c,24.7,20.2,1.7,1.5,'#e7bd93');
}

function unitFrames(scene,id,key,paint){
  const rider=id===8||id===22;
  for(let frame=-1;frame<WALK_FRAMES;frame++){
    paintTexture(scene,frame<0?key:key+'walk'+frame,rider?100:72,rider?96:80,(c,p)=>{
      c.scale(2,2);
      paint(c,p,frame<0?0:TAU*frame/WALK_FRAMES);
    });
  }
}

function enemyTexture(scene,stageKey,id,boss=false){
  const key='man-'+stageKey+'-'+(boss?'boss':id);
  if(!scene.textures.exists(key)){
    unitFrames(scene,id,key,(c,p,phase)=>{
      if(boss)campaignGeneral(c,stageKey,phase);
      else miniature(c,p,id,phase,0,null,0,'',campaigns[stageKey].colors);
    });
  }
  return key;
}

function makeArt(scene){
  const theme=getComputedStyle(document.documentElement);
  const rankColors=[0,1,2,3].map(q=>theme.getPropertyValue('--tier-'+q).trim());
  paintTexture(scene,'loot-coffer',28,24,(c,p)=>{
    p([[2,8],[8,3],[25,6],[26,16],[19,21],[2,17]],'#845431');
    p([[2,8],[8,3],[25,6],[19,12]],'#ebbd62');
    p([[2,10],[19,14],[26,9],[26,12],[19,17],[2,13]],'#d69d40');
    c.fillStyle='#ffe4a2';c.fillRect(10,11,4,6);
  });
  paintTexture(scene,'silver-coin',32,26,c=>{
    oval(c,16,21,11,2.7,'rgba(68,45,31,.28)');
    const face=new Path2D('M5 14 Q4 10 8 7 L13 5 Q19 4 24 7 Q28 9 27 13 L25 17 Q22 21 15 21 Q7 20 5 14 Z');
    c.fillStyle='#59564f';c.fill(face);
    c.lineWidth=1.3;c.strokeStyle='#43382e';c.stroke(face);

    const rim=new Path2D('M5 12 Q5 8 9 6 L15 4 Q21 4 25 7 Q28 10 25 14 L21 17 Q16 19 10 17 Q6 16 5 12 Z');
    c.fillStyle='#d6d1c3';c.fill(rim);
    c.strokeStyle='#51463b';c.stroke(rim);
    c.fillStyle='#a6a79c';
    c.fill(new Path2D('M8 12 Q8 8 14 7 Q20 5 24 9 Q24 12 20 15 Q16 17 11 15 Z'));
    c.lineCap='round';c.lineWidth=1;c.strokeStyle='#eee7d6';
    c.stroke(new Path2D('M8 10 Q11 6 17 6'));
    c.strokeStyle='#62635b';
    c.stroke(new Path2D('M13 15 L16 7 M16 8 Q19 9 21 8 L20 11 Q18 12 15 11'));
  });
  paintTexture(scene,'medicine-pouch',72,70,c=>{
    c.scale(2,2);
    c.lineJoin='round';c.lineCap='round';
    const fill=(path,color)=>{c.fillStyle=color;c.fill(new Path2D(path))};
    const stroke=(path,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path))};
    oval(c,18,30.4,14.8,2.6,'rgba(68,45,31,.28)');
    // A rolled dressing is tucked under the two loops on the medicine bag.
    stroke('M8 11 L24 6','#594236',7);
    stroke('M8 11 L24 6','#e6ceb1',5);
    stroke('M12 8 L13 12 M20 5.5 L21 9.5','#8c6347',2);
    const bag='M5 13 Q6 10 11 10 L27 8 Q30 8 30.5 12 L33 24 Q33 27 29 28.5 L11 31 Q6 31 5 27 L3.5 18 Q3 15 5 13Z';
    fill(bag,'#567083');stroke(bag,'#4b3831',1.8);
    fill('M5 21 Q8 23 12 22 L28 18 L30 11 L32 24 Q32 27 28 28 L11 30 Q7 30 6 27Z','#364d60');
    fill('M5 13 Q7 10 12 10 L26 8.5 L28.5 12.5 L27 21 Q24 24 15 25 L9 24Z','#843d32');
    fill('M5.5 12.8 L26 9 L27.5 12.5 L25 20.5 Q19 23.5 10 22.5Z','#ad513b');
    stroke('M7 13 L25 10','#d58b63',1);
    // A large ivory stitch remains readable on the small battlefield sprite.
    fill('M14.5 11.8 L18.5 11.2 L19.1 15 L24.4 14.2 L25 17.7 L19.6 18.5 L20.2 22.1 L16.2 22.7 L15.6 19.1 L10.4 19.9 L9.9 16.4 L15.1 15.6Z','#fff0ce');
    stroke('M8 27 Q9 28.5 12 28 L26 25.8','#8f9a94',1);
  });
  paintTexture(scene,'dust-wisp',48,24,c=>{
    const haze=c.createLinearGradient(0,3,0,23);
    haze.addColorStop(0,'rgba(255,237,202,.92)');
    haze.addColorStop(.62,'rgba(233,208,172,.76)');
    haze.addColorStop(1,'rgba(168,139,111,.18)');
    c.fillStyle=haze;c.fill(new Path2D('M2 18 Q9 19 14 14 Q12 9 18 8 Q20 2 26 4 Q32 4 33 10 Q39 7 41 13 Q45 13 46 17 Q42 21 34 19 Q28 23 23 19 Q18 22 15 18 Q8 22 2 18Z'));
  });
  for(const [type,id] of mercSkins.entries()){
    for(let q=0;q<4;q++){
      unitFrames(scene,id,'man'+troopSkin(type,q),(c,p,phase)=>{
        miniature(c,p,id,phase,q,rankColors[q],0,'mercenary');
      });
    }
  }
  commanderTexture(scene,1);
}

// Cache a promoted uniform only once a commander reaches that level.
function commanderTexture(scene,level){
  const rank=commanderForm(level),base='man'+commanders.banner.skin+(rank?'form'+rank:'');
  if(scene.textures.exists(base))return base;
  function frame(key,phase,swing=null,cloth=phase,walking=false){
    paintTexture(scene,key,112,112,c=>{
      c.scale(2,2);
      bannerCommander(c,phase,swing,cloth,rank,walking);
    });
  }
  frame(base,0);
  for(let i=0;i<WALK_FRAMES;i++){
    const phase=TAU*i/WALK_FRAMES;
    frame(base+'walk'+i,phase,null,phase,true);
  }
  for(let i=0;i<COMMANDER_CLOTH_FRAMES;i++)frame(base+'cloth'+i,0,null,TAU*i/COMMANDER_CLOTH_FRAMES);
  commanderSwingAngles.forEach((angle,i)=>frame(base+'swing'+i,0,angle,i*.55));
  return base;
}
