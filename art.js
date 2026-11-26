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
const commanderForms=[
  {name:'初阵'},
  {name:'铜札战甲',metal:'#a06542',light:'#d7a570',edge:'#f0c388',cloth:'#853d35'},
  {name:'银翎明铠',metal:'#5f8297',light:'#c9dce1',edge:'#eff5ed',cloth:'#34586c'},
  {name:'玄甲虎卫',metal:'#303e49',light:'#66717a',edge:'#d9a44e',cloth:'#652e39'},
  {name:'金翎统帅',metal:'#946327',light:'#dfb765',edge:'#fff0b1',cloth:'#983e38'}
];
function commanderForm(level){return Math.min(4,Math.floor(level/5))}
function commanderIdleTexture(ms,base='man6'){
  return base+'cloth'+(Math.floor(ms/100)%COMMANDER_CLOTH_FRAMES);
}
// Draw the shoulder insignia in local coordinates so it fits each commander's build.
function commandPauldron(c,rank){
  const {metal,light,edge}=commanderForms[rank];
  const fill=(path,color)=>{c.fillStyle=color;c.fill(new Path2D(path))};
  if(rank===1){
    fill('M1 7 L11 1 L22 2 L28 8 L22 12 L12 11 L2 16 Z',metal);
    fill('M2 8 L11 3 L21 4 L23 6 L12 6 L2 12 Z M5 13 L14 8 L24 8 L22 10 L14 10 L5 15 Z',light);
  }else if(rank===2){
    fill('M0 11 Q4 3 15 0 L25 2 L31 8 L20 9 L11 13 L2 18 Z',metal);
    fill('M2 10 L12 3 L23 3 L16 6 L6 13 Z M6 14 L19 7 L26 7 L17 11 L5 17 Z',light);
  }else if(rank===3){
    fill('M0 8 L4 0 L10 3 L18 1 L24 0 L28 8 L25 16 L20 11 L14 17 L8 13 L3 18 Z',metal);
    fill('M3 4 L10 5 L13 9 L5 7 Z M16 8 L20 4 L25 4 L23 7 Z M8 10 L14 12 L20 9 L15 15 Z',edge);
  }else{
    fill('M0 1 L12 5 L9 0 L25 4 L31 9 L17 14 L3 20 L8 12 L1 14 L6 8 Z',metal);
    fill('M1 2 L16 7 L11 2 L24 5 L29 8 L16 10 Z',light);
    fill('M3 14 L13 8 L24 8 L14 11 Z M5 18 L16 12 L22 11 L14 15 Z',edge);
  }
}
function bannerCommander(c,phase,swing=null,clothPhase=phase,rank=0){
  const form=commanderForms[rank];
  // Draw in portrait coordinates; the feet remain the animation pivot.
  c.save();c.scale(.21875,.21875);
  const step=Math.sin(phase);
  function shape(path,left,right){
    const outline=new Path2D(path);
    const gradient=c.createLinearGradient(48,100,190,125);
    gradient.addColorStop(0,left);gradient.addColorStop(1,right||left);
    c.fillStyle=gradient;c.fill(outline);
  }
  const sleeveLight='#b9474a',sleeveShade='#92313e',cuff='#682838',cuffEdge='#c69a60';
  const handSkin='#ddb58b',knuckleLight='#edc9a0',fingerShade='#b98865';
  shadow(c,124,221,28);
  for(const [x,side] of [[138,1],[102,-1]]){
    c.save();c.translate(x+step*side*9,step*side*6);
    shape('M-11 170 Q0 168 11 174 L13 213 Q7 219 -8 217 L-12 190 Z','#31231f','#493326');
    // Each greave follows its boot, with the ankle exposed below the metal rim.
    shape('M-11 181 Q-1 176 10 181 L11 203 L7 210 L-6 208 L-10 201 Z',form.metal||'#516063',form.light||'#8b8d7d');
    shape('M0 184 L8 181 L8 201 L5 206 L1 203 Z','#859087');
    shape('M-11 186 Q0 190 10 184 L10 188 Q0 194 -11 190 Z','#3b4748');
    shape('M-8 201 Q0 206 10 200 L9 204 Q1 210 -7 205 Z',form.edge||'#ad8652',form.edge||'#d6b478');
    c.restore();
  }
  c.translate(step*2,-Math.abs(step)*4);
  shape('M89 109 Q116 97 146 110 L149 148 L158 187 Q126 199 80 191 L94 153 Z','#44231f','#632d27');
  shape('M97 108 Q121 100 142 109 L143 148 L151 182 Q129 191 95 185 L102 153 Z','#493327','#62412c');
  // Split thigh plates sit beneath the belt and overlap the greaves.
  shape('M96 155 L121 157 L116 188 L107 193 L87 188 Z',form.metal||'#516063',form.light||'#8b8d7d');
  shape('M125 157 L148 151 L156 183 L148 189 L122 186 Z',form.metal||'#516063',form.light||'#8b8d7d');
  shape('M93 166 L119 169 L118 172 L92 169 Z M90 177 L117 180 L116 183 L90 180 Z M125 167 L151 161 L152 164 L124 171 Z M124 178 L153 172 L154 175 L123 182 Z','#3b4748');
  shape('M88 185 L107 189 L116 185 L116 188 L107 193 L87 188 Z M123 183 L147 185 L155 180 L156 183 L148 189 L122 186 Z',form.edge||'#ad8652',form.edge||'#d6b478');
  if(rank){
    shape('M111 157 L130 157 L132 187 L120 200 L108 189 Z',form.cloth);
    shape('M114 165 L120 174 L127 163 L124 178 L120 185 L115 179 Z',form.edge);
  }
  shape('M94 150 Q121 155 149 147 L150 156 Q122 164 93 159 Z','#b27b3c','#a16c35');
  shape('M147 118 Q158 120 166 132 L182 129 L185 145 Q171 153 153 148 Z',sleeveLight,sleeveShade);
  shape('M174 131 L181 129 L184 146 L177 148 Z',cuff);
  shape('M174 131 L176 130.5 L179 147.5 L177 148 Z',cuffEdge);
  c.save();c.translate(183,141);c.rotate(step*.047);c.translate(-183,-141);
  shape('M188 7 Q192 0 198 6 L187 218 Q183 225 177 219 Z','#513727','#7b5436');
  const flagWave=Math.sin(clothPhase-.54);
  const flagTip=Math.sin(clothPhase-1.1);
  shape(`M170 22 L219 30 Q${219+flagWave*7} 66 ${213+flagTip*11} ${120+flagWave*4}
    Q${198+flagTip*7} 116 ${189+flagTip*5} 103 L186 83 L${182+flagWave*4} ${111+flagTip*3}
    L${166+flagWave*5} 104 Q${167+flagWave*3} 64 170 22 Z`,'#803a2c','#aa5239');
  shape(`M207 34 Q${215+flagWave*5} 63 ${207+flagTip*7} 103
    Q${215+flagTip*7} 83 ${213+flagWave*5} 53 Z`,'#a4523a','#b46144');
  shape('M178 60 Q183 48 193 52 Q190 42 200 43 Q207 44 204 51 Q201 55 197 51 Q203 52 201 47 Q197 45 197 52 Q200 61 190 61 Q182 60 178 69 Z M181 72 Q194 64 204 67 L201 72 Q191 71 180 78 Z','#cc9660','#e7bb7c');
  shape('M164 13 Q167 10 172 14 L222 26 Q228 28 224 36 L165 24 Q160 22 164 13 Z','#583827','#6e4932');
  shape('M174 15 L187 18 L187 26 L172 23 Z M202 22 L216 24 L215 32 L201 29 Z','#a9583d','#b66d4a');
  if(rank>=2){
    shape(`M171 28 L175 29 Q176 65 ${171+flagWave*4} 101 L${167+flagWave*4} 100 Z`,form.edge);
    if(rank===4)shape(`M201 32 Q209 35 216 33 Q${224+flagTip*5} 55 ${232+flagTip*5} 61 Q217 56 212 47 L214 61 Q204 48 201 32 Z`,form.edge);
  }
  // The fingers wrap in front of the pole and move with it.
  shape('M180 134 Q180 129 185 128 L188 129 Q195 126 198 132 L197 143 Q196 150 189 150 L182 148 Q179 146 179 141 Z',handSkin);
  shape('M181 135 Q182 129 186 130 L190 133 L189 136 L185 134 L181 138 Z',knuckleLight);
  shape('M192 138 L197 137 L197 139 L192 140 Z M192 143 L197 142 L196 144 L192 145 Z',fingerShade);
  c.restore();
  const capeWave=Math.sin(clothPhase+.8);
  const capeTip=Math.sin(clothPhase+.13);
  shape(`M87 110 Q99 111 105 123 Q101 168 ${94+capeWave*3} 203
    Q${75+capeWave*4} ${202+capeWave*3} ${56+capeTip*9} ${196-capeTip*5}
    Q${67+capeWave*5} 169 70 138 Z`,form.cloth||'#97483c',rank===2?'#243e4f':'#622d29');
  shape('M94 107 Q99 115 108 119 L98 164 L92 201 Q96 155 88 146 Z','#78382f','#4c2724');
  // Align the rib cage over the belt. Keep the helmet and saber rigid at their joints.
  c.save();c.transform(1,0,-.14,1,155*.14,0);
  // Bring the pauldrons closer to the neck while keeping the helmet proportions.
  c.save();c.translate(118,0);c.scale(.78,1);c.translate(-118,0);
  shape('M126 91 Q142 82 155 91 Q164 98 168 114 Q161 123 142 122 L129 113 Z',sleeveLight,sleeveShade);
  shape('M49 123 Q53 102 76 90 Q98 82 117 103 L128 120 Q118 132 98 129 L84 124 Q59 139 49 130 Z',sleeveLight,sleeveShade);
  shape('M51 124 Q55 101 77 91 Q96 84 114 102 L125 116 Q102 111 84 122 L61 137 L47 134 Z','#4e5958','#859087');
  shape('M48 128 Q63 125 78 112 Q95 101 116 108 L120 112 Q95 108 80 119 L58 135 L46 135 Z',form.edge||'#ad8652',form.edge||'#d6b478');
  if(rank){
    c.save();c.translate(46,89);c.scale(2.5,2.5);commandPauldron(c,rank);c.restore();
  }
  c.restore();
  shape('M99 133 L124 124 L145 135 L141 153 L99 158 Z',form.metal||'#516063',form.light||'#8b8d7d');
  shape('M100 142 L140 138 L140 141 L101 146 Z M99 151 L138 147 L137 150 L98 154 Z','#3b4748');
  oval(c,135,125,11,12,'#704a30');oval(c,135,122,10,10,'#e6bc73');
  c.restore();
  // Lift the chin slightly around the collar and keep the helmet over the shoulders.
  c.save();c.translate(122,102);c.rotate(-.055);c.translate(-120,-103);
  shape('M96 62 Q112 43 138 56 L147 76 L145 99 Q134 110 114 104 L96 93 Z','#614539','#48352c');
  shape('M114 72 Q128 67 145 73 L145 96 Q142 106 120 103 Q114 99 114 92 Z','#dfb78b','#f0cda2');
  shape('M99 59 Q108 47 120 47 Q141 47 144 63 L140 77 L98 78 Z','#796254','#9a7d60');
  // A crested doumou helmet with a flared neck guard and a gilt brow.
  shape('M92 72 Q91 48 116 43 Q140 44 145 66 L151 73 Q121 72 96 84 L86 88 Z',form.metal||'#394449',form.light||'#647170');
  shape('M93 72 L103 75 L109 100 L99 106 L86 99 Z','#535a57','#746b58');
  shape('M91 73 Q115 64 145 65 L152 71 Q126 71 98 80 Z','#a47a48','#e5c68b');
  shape('M111 66 Q117 52 116 43 L121 44 Q122 55 116 65 Z','#b58b52','#d4b174');
  shape('M115 47 Q111 38 101 39 Q85 42 75 33 Q88 37 94 30 Q108 21 119 37 L122 44 Z','#903c32','#be6651');
  if(rank===1)shape('M97 72 L98 54 L103 47 L106 66 L121 60 L115 67 Z',form.light,form.edge);
  if(rank===2)shape('M119 45 Q112 19 87 26 Q72 37 60 32 Q71 45 88 38 L76 46 Q96 46 105 36 L116 48 Z',form.light,form.edge);
  if(rank===3)shape('M92 73 L83 47 L98 56 L95 40 L110 52 L111 64 Z M124 50 L132 36 L133 52 L143 45 L138 62 Z',form.metal,form.edge);
  if(rank===4){
    shape('M114 48 Q85 -5 47 31 Q35 44 20 44 Q37 53 59 33 Q83 14 111 52 Z','#a74c41',form.edge);
    shape('M119 47 Q117 17 137 12 Q151 9 164 19 Q141 14 132 27 Q126 37 125 50 Z',form.edge);
    shape('M91 74 L84 48 L99 59 L94 39 L111 53 L118 47 L123 60 L110 69 Z',form.light,form.edge);
  }
  shape('M98 96 L104 94 L104 96 L98 99 Z M92 90 L101 87 L102 89 L93 93 Z','#bb9d71');
  shape('M124 81 L130 80 L130 89 Q127 92 124 90 Z M139 79 L144 78 L144 87 Q141 90 139 88 Z','#35261f','#30231c');
  c.restore();
  // The near arm and saber pass in front of the armor during the swing.
  c.save();
  c.translate(91,119);
  c.rotate(swing===null?.72:swing);
  shape('M-7 0 Q0 -9 9 -4 L29 10 L36 9 L38 19 L29 24 L1 15 Z',sleeveLight,sleeveShade);
  shape('M26 9 L33 10 L37 21 L30 24 Z',cuff);
  shape('M26 9 L28 9.3 L32 23.1 L30 24 Z',cuffEdge);
  shape('M38 7 L36 -46 Q35 -57 40 -69 L45 -52 L45 7 Z','#92a4a7','#c8d2cc');
  shape('M38 5 L37 -49 L41 -66 L41 5 Z','#e3e7db');
  shape('M32 5 Q41 1 50 5 L48 10 L33 10 Z','#bd904e');
  c.beginPath();c.arc(42,26,4.1,0,TAU);c.strokeStyle='#c69a56';c.lineWidth=2.5;c.stroke();
  shape('M35 12 Q37 8 42 9 L47 11 Q50 13 48 18 L46 23 Q40 26 35 22 L33 17 Z',handSkin);
  shape('M35 12 Q38 9 42 10 L46 12 L45 14 L39 13 L35 16 Z',knuckleLight);
  shape('M44 16 L48 15 L48 17 L44 18 Z M43 20 L47 19 L46 21 L43 22 Z',fingerShade);
  c.restore();
  c.restore();
}
const mercSkins=[0,1,2,7,17,18,19,20,21,22];
function troopSkin(id,q=0){const skin=mercSkins[id];return "merc"+skin+(q?"tier"+q:"")}
const enemyCloth={shadow:'#8c591d',base:'#cf8f26',light:'#e9ad3f'};
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

  fill('M10.8 7 Q14 4.4 21 6.6 L21.4 12.6 Q19 15.8 14 15 L11 13.2 Z','#e2b98f');
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
function mountedLancer(c,phase,ally=false,q=0,ink,pose=0){
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
    oval(c,22,9,4,5,'#e2bb90');
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
function miniature(c,p,id,phase=0,q=0,weaponInk,pose=0,variant='',formRank=0){
  const boss=variant==='boss',mercenary=variant==='mercenary';
  if(id===8||id===22){mountedLancer(c,phase,id===22,q,weaponInk,pose);return}
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
  if(boss){
    stroke('M12 23 L8 2','#514132',1.2);
    paint('M8 2 L2 4 L1 14 L4 12 L6 15 L10 12 Z',enemyCloth.light);
    stroke('M3 6 L7 5 M3 8 L7 7','#eac278',1.1);
  }
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
    paint('M11 7 Q14 4.2 21 6.8 L21 13.5 Q18 16.2 13 14.8 L10.8 13 Z',wash(11,21,'#ba9167','#ebc79a'));
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
        paint('M12 12 L16.2 13.2 L21.4 12 L20.8 15.2 L16 17.1 L11.8 15 Z','#483e3a');
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
  if(formRank){
    const form=commanderForms[formRank];
    paint('M9 15 L14 16 L11 28 L9 31 L3 30 L6 22 Z',form.cloth);
    paint('M12 16 Q17 18 21 15 L22 21 L17 24 L12 22 Z',wash(12,22,form.metal,form.light));
    stroke('M12 19 Q16 21 21 18 M14 25 L13 29 M18 25 L19 28',form.edge,.85);
    c.save();c.translate(4.4,13.6);c.scale(.34,.34);commandPauldron(c,formRank);c.restore();
    paint('M8 8 Q10 3 16 2 L19 3 L22.5 7 L24 8 L14 9 L11 14 L7 15 Z',wash(7,22,form.metal,form.light));
    stroke('M8 9 Q14 7 22 7.6',form.edge,1);
    if(formRank===2)paint('M17 4 Q11 .2 7 3 L2 9 L6 8 L3 12 Q10 10 13 5 Z',form.light);
    if(formRank===3)paint('M8 9 L5 2 L10 5 L9 1 L15 4 L16 7 Z',form.edge);
    if(formRank===4){
      paint('M16 4 Q8 -1 4 3 Q2 6 1 10 Q6 7 8 4 Q11 2 16 6 Z M17 4 Q20 .2 24 1 Q27 2 28 5 Q23 2 20 5 Z',form.edge);
      paint('M8 10 L5 4 L10 6 L9 2 L15 5 L16 7 Z',form.light);
    }
  }
  c.save();c.translate(20,21);if(id===1)c.translate(5*pose,0);
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
  paintTexture(scene,'dust-wisp',48,24,c=>{
    const haze=c.createLinearGradient(0,3,0,23);
    haze.addColorStop(0,'rgba(255,237,202,.92)');
    haze.addColorStop(.62,'rgba(233,208,172,.76)');
    haze.addColorStop(1,'rgba(168,139,111,.18)');
    c.fillStyle=haze;c.fill(new Path2D('M2 18 Q9 19 14 14 Q12 9 18 8 Q20 2 26 4 Q32 4 33 10 Q39 7 41 13 Q45 13 46 17 Q42 21 34 19 Q28 23 23 19 Q18 22 15 18 Q8 22 2 18Z'));
  });
  const leaderSkins=new Set(Object.values(campaigns).map(stage=>stage.bossSkin));
  function unitFrames(id,key,q,variant){
    const rider=id===8||id===22;
    const width=id===6?112:rider?100:72,height=id===6?112:rider?96:80;
    for(let frame=-1;frame<WALK_FRAMES;frame++){
      paintTexture(scene,frame<0?key:key+'walk'+frame,width,height,(c,p)=>{
        c.save();c.scale(2,2);
        miniature(c,p,id,frame<0?0:TAU*frame/WALK_FRAMES,q,rankColors[q],0,variant);
        c.restore();
      });
    }
  }
  for(const [type,id] of mercSkins.entries()){
    for(let q=0;q<4;q++)unitFrames(id,'man'+troopSkin(type,q),q,'mercenary');
  }
  for(const hero of Object.values(commanders))commanderTexture(scene,hero.skin,1);
  for(let id=0;id<=23;id++){
    if(id===6||mercSkins.includes(id))continue;
    unitFrames(id,'man'+id,0);
    if(leaderSkins.has(id))unitFrames(id,'man'+id+'boss',0,'boss');
  }
}

// Cache a promoted uniform only once a commander reaches that level.
function commanderTexture(scene,skin,level){
  const rank=commanderForm(level),base='man'+skin+(rank?'form'+rank:'');
  if(scene.textures.exists(base))return base;
  const banner=skin===commanders.banner.skin,scout=skin===commanders.scout.skin;
  const q=scout?2:3;
  const ink=getComputedStyle(document.documentElement).getPropertyValue('--tier-'+q).trim();
  function frame(key,phase,swing=null,cloth=phase){
    paintTexture(scene,key,banner?112:72,banner?112:80,(c,p)=>{
      c.scale(2,2);
      if(banner)bannerCommander(c,phase,swing,cloth,rank);
      else miniature(c,p,scout?2:1,phase,q,ink,0,'',rank);
    });
  }
  frame(base,0);
  for(let i=0;i<WALK_FRAMES;i++)frame(base+'walk'+i,TAU*i/WALK_FRAMES);
  if(banner){
    for(let i=0;i<COMMANDER_CLOTH_FRAMES;i++)frame(base+'cloth'+i,0,null,TAU*i/COMMANDER_CLOTH_FRAMES);
    commanderSwingAngles.forEach((angle,i)=>frame(base+'swing'+i,0,angle,i*.55));
  }
  return base;
}
