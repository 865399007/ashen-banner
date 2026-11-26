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
function commanderIdleTexture(ms){
  return 'man6cloth'+(Math.floor(ms/100)%COMMANDER_CLOTH_FRAMES);
}
function bannerCommander(c,phase,swing=null,clothPhase=phase){
  // Draw in portrait coordinates; the feet remain the animation pivot.
  c.save();c.scale(.21875,.21875);
  const step=Math.sin(phase);
  function shape(path,left,right){
    const outline=new Path2D(path);
    const gradient=c.createLinearGradient(48,100,190,125);
    gradient.addColorStop(0,left);gradient.addColorStop(1,right||left);
    c.fillStyle=gradient;c.fill(outline);
  }
  shadow(c,124,221,34);
  for(const [x,side] of [[145,1],[93,-1]]){
    c.save();c.translate(x+step*side*9,step*side*6);
    shape('M-15 173 Q0 170 14 177 L17 212 Q10 219 -10 217 L-17 192 Z','#31231f','#493326');
    c.restore();
  }
  c.translate(step*2,-Math.abs(step)*4);
  shape('M78 109 Q116 96 150 110 L174 194 Q128 209 64 202 Z','#44231f','#632d27');
  shape('M93 108 Q121 99 146 109 L165 188 Q133 200 89 192 Z','#493327','#62412c');
  shape('M91 155 Q122 159 157 151 L159 162 Q121 170 89 165 Z','#b27b3c','#a16c35');
  shape('M146 120 Q157 120 166 132 L185 128 L191 146 Q172 154 151 149 Z','#503629','#38271e');
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
  c.restore();
  shape('M183 127 Q194 124 198 131 L196 147 Q190 155 180 149 L179 137 Z','#493024','#37261e');
  const capeWave=Math.sin(clothPhase+.8);
  const capeTip=Math.sin(clothPhase+.13);
  shape(`M79 110 Q99 111 105 123 Q102 173 ${94+capeWave*4} 215
    Q${66+capeWave*5} ${214+capeWave*4} ${34+capeTip*11} ${205-capeTip*6}
    Q${48+capeWave*8} 174 55 139 Z`,'#97483c','#622d29');
  shape('M94 107 Q99 115 108 119 L98 169 L92 209 Q96 155 88 146 Z','#78382f','#4c2724');
  c.save();
  c.translate(78,121);
  c.rotate(swing===null?.72:swing);
  shape('M-7 0 Q0 -9 9 -4 L31 11 L43 8 L47 18 L29 24 L1 15 Z','#674634','#483326');
  shape('M38 7 L36 -46 Q35 -57 40 -69 L45 -52 L45 7 Z','#92a4a7','#c8d2cc');
  shape('M38 5 L37 -49 L41 -66 L41 5 Z','#e3e7db');
  shape('M32 5 Q41 1 50 5 L48 10 L33 10 Z','#bd904e');
  c.beginPath();c.arc(42,26,4.1,0,TAU);c.strokeStyle='#c69a56';c.lineWidth=2.5;c.stroke();
  shape('M37 11 Q41 7 47 12 L46 22 Q40 26 35 20 Z','#684834','#493126');
  c.restore();
  shape('M126 91 Q142 82 155 91 Q164 98 168 114 Q161 123 142 122 L129 113 Z','#cfb998','#b49a7e');
  shape('M49 123 Q53 102 76 90 Q98 82 117 103 L128 120 Q118 132 98 129 L84 124 Q59 139 49 130 Z','#af947a','#927862');
  shape('M51 124 Q55 101 77 91 Q96 84 114 102 L125 116 Q102 111 84 122 L61 137 L47 134 Z','#4e5958','#859087');
  shape('M48 128 Q63 125 78 112 Q95 101 116 108 L120 112 Q95 108 80 119 L58 135 L46 135 Z','#ad8652','#d6b478');
  shape('M99 133 L124 124 L145 135 L141 153 L99 158 Z','#516063','#8b8d7d');
  shape('M100 142 L140 138 L140 141 L101 146 Z M99 151 L138 147 L137 150 L98 154 Z','#3b4748');
  oval(c,135,125,11,12,'#704a30');oval(c,135,122,10,10,'#e6bc73');
  shape('M96 62 Q112 43 138 56 L147 76 L145 99 Q134 110 114 104 L96 93 Z','#614539','#48352c');
  shape('M114 72 Q128 67 145 73 L145 96 Q142 106 120 103 Q114 99 114 92 Z','#dfb78b','#f0cda2');
  shape('M99 59 Q108 47 120 47 Q141 47 144 63 L140 77 L98 78 Z','#796254','#9a7d60');
  // A crested doumou helmet with a flared neck guard and a gilt brow.
  shape('M92 72 Q91 48 116 43 Q140 44 145 66 L151 73 Q121 72 96 84 L86 88 Z','#394449','#647170');
  shape('M93 72 L103 75 L109 100 L99 106 L86 99 Z','#535a57','#746b58');
  shape('M91 73 Q115 64 145 65 L152 71 Q126 71 98 80 Z','#a47a48','#e5c68b');
  shape('M111 66 Q117 52 116 43 L121 44 Q122 55 116 65 Z','#b58b52','#d4b174');
  shape('M115 47 Q111 38 101 39 Q85 42 75 33 Q88 37 94 30 Q108 21 119 37 L122 44 Z','#903c32','#be6651');
  shape('M98 96 L104 94 L104 96 L98 99 Z M92 90 L101 87 L102 89 L93 93 Z','#bb9d71');
  shape('M124 81 L130 80 L130 89 Q127 92 124 90 Z M139 79 L144 78 L144 87 Q141 90 139 88 Z','#35261f','#30231c');
  c.restore();
}
const mercSkins=[0,1,2,7,17,18,19,20,21,22];
function troopSkin(id,q=0){const skin=mercSkins[id];return q?skin+"tier"+q:skin}
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
  fill('M13 21 L26 21 L25 31 L16 29 L12 30 Z',ally?'#416879':'#943f32');
  fill('M14 27 L24 29 L24 31 L14 29 Z','#d4aa6c');
  fill('M17 12 Q21 9 25 13 L27 22 L17 24 L14 21 Z',ally?'#537775':'#824436');
  fill('M18 21 L25 21 L22 27 L21 30 L17 30 L18 25 Z','#49382f');
  oval(c,22,9,4,5,'#e2bb90');
  fill('M16 9 Q16 2 21 2 Q26 2 27 7 L26 9 L19 9 L18 12 L16 12 Z','#a59b90');
  fill('M16 7 Q17 1 22 2 Q26 3 27 7 L29 8 L18 9 L18 13 L14 14 Z',ally?'#556b6d':'#6a554d');
  fill('M18 3 Q15 0 11 2 L7 4 Q12 4 14 3 L19 5 Z',ally?'#47857b':'#ab5340');
  fill('M16 15 L24 13 L26 19 L17 21 Z','#74786c');
  fill('M16 17 L25 15 L25 16 L17 18 Z M17 20 L26 18 L26 19 L17 21 Z','#43483f');
  fill('M35 12 L40 13 L44 19 L41 20 L36 16 Z',ally?'#b39864':'#a07854');
  fill('M12 23 L15 24 L14 29 L11 28 Z M24 23 L27 22 L26 29 L23 30 Z','#715741');
  c.save();c.translate(21,20);c.rotate(pose*.55);c.translate(-21,-20);
  if(q){c.strokeStyle=ink;c.lineWidth=3.4;if(q===3){c.shadowColor=ink;c.shadowBlur=4}c.stroke(new Path2D('M21 20 L49 2'))}
  c.strokeStyle='#68472d';c.lineWidth=1.35;c.beginPath();c.moveTo(21,20);c.lineTo(45,5);c.stroke();
  fill('M42 6 L49 2 L46 7 L42 9 Z','#cac4ad');
  c.restore();oval(c,25,17,2,1.8,'#dbb18a');oval(c,40,15,1,.85,'#392820');
}
function miniature(c,p,id,phase=0,q=0,weaponInk,pose=0){
  if(id===8||id===22){mountedLancer(c,phase,id===22,q,weaponInk,pose);return}
  const recruit=id>=17&&id<=22;
  const recruitSkin=id;
  if(id===23)id=5;
  if(recruit)id=({17:10,18:2,19:14,20:9,21:11})[id];
  if(id===6){bannerCommander(c,phase);return}
  const weapon=id%3,enemy=(id>=3&&id<=5)||id>=9,step=Math.sin(phase);
  const coat=recruit?'#506975':['#615175','#923e32','#787044','#69503e','#873f34','#5a5141',null,'#875039',null,'#635273','#864437','#853d32','#615366','#92483b','#916b42','#844939','#63474a'][id];
  const trim=recruit?'#384957':['#40354f','#662d28','#514f34','#943f34','#582d29','#703e36',null,'#603727',null,'#473649','#55372e','#58332c','#423a49','#65352d','#674c35','#5b3930','#443137'][id];
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
  if(q>=2){
    const hem=3+step*1.4;
    paint('M12 14 Q7 15 7 19 L'+hem+' 31 Q7 33 11 30 L15 17 Z',q===3?'#913e30':'#685381');
    stroke('M7 20 L'+hem+' 31 L7 31',q===3?'#ebb767':'#ad92bd',1);
  }
  if(weapon===2&&id<9){
    stroke('M8 22 L3 12 M9 20 L5 10 M10 18 L8 10','#654627',1);
    paint('M3 14 L9 12 L13 22 Q10 25 8 24 Z','#5b412f');
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
  const allied=recruit||!enemy;
  const binding=allied?'#476b6a':'#8b4638';
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
    if(id===0){
      const blade='M23 21 L29 10 L34 5 L32 12 L26 23 Z';
      stroke(blade,weaponInk,2.6);
      paint(blade,wash(23,34,'#928984','#e4dac6'));
    }else if(id===1){
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
    paint('M20 14 L30 13 L30 28 L25 31 L20 28 Z',recruit?'#496477':'#8d4835');
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
      paint('M19 16.6 Q23 15 29 14.4 Q30 14.4 30 16 L29.7 28.8 Q27.4 31.7 19 31 Z',wash(19,30,'#a59587','#ddc7a8'));
      paint('M20.6 17.7 L28.3 16 L28 28.4 Q26 30 20.6 29.6 Z',wash(20,28,'#745540','#956e50'));
      paint('M23.2 21.5 L25.8 21 L26 24.6 L23.3 25.1 Z','#c2aa88');
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
  if(q && id===0){
    paint('M20 18 L28 16 L28 27 Q26 30 21 30 Z',['','#486569','#514065','#9d4330'][q]);
    stroke('M21 22 L24 25 L27 20','#edcf99',1.6);
    if(q===3)stroke('M21 25 L24 28 L27 23','#edcf99',1.4);
  }else if(q && id===1){
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
  commanderSwingAngles.forEach((angle,frame)=>{
    paintTexture(scene,'commanderSwing'+frame,112,112,c=>{
      c.scale(2,2);bannerCommander(c,0,angle,frame*.55);
    });
  });
  for(let frame=0;frame<COMMANDER_CLOTH_FRAMES;frame++){
    paintTexture(scene,'man6cloth'+frame,112,112,c=>{
      c.scale(2,2);bannerCommander(c,0,null,TAU*frame/COMMANDER_CLOTH_FRAMES);
    });
  }
  for(let id=0;id<=23;id++){
    const tiers=mercSkins.includes(id)?4:1;
    for(let q=0;q<tiers;q++){
      const key='man'+id+(q?'tier'+q:'');
      for(let frame=-1;frame<WALK_FRAMES;frame++){
        paintTexture(scene,frame<0?key:key+'walk'+frame,id===6?112:(id===8||id===22)?100:72,id===6?112:(id===8||id===22)?96:80,(c,p)=>{
          c.save();c.scale(2,2);miniature(c,p,id,frame<0?0:TAU*frame/WALK_FRAMES,q,rankColors[q]);c.restore();
        });
      }
    }
  }
}
