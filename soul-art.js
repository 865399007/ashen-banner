// The codex and the battlefield share this drawing. The feet sit at (42, 68).
function drawGeneralSoul(c,general,pose=0){
  const colors={
    liubei:['#478a70','#294f53'],zhaoyun:['#abc8d2','#54768e'],
    huangzhong:['#b08a52','#65503e'],xuhuang:['#698aa1','#3b5269'],
    caoren:['#60768a','#344357'],zhugeliang:['#c1ccbb','#708982'],
    wuanguo:['#977767','#594d52'],dianwei:['#826963','#4d4753'],
    lvbu:['#b9695d','#654552'],guanyu:['#49866a','#2b5549']
  };
  const [cloth,shadow]=colors[general];
  const ink='#253b47',steel='#a7c8d2',edge='#e2f6ec',brass='#d5af72',skin='#dfbb93';
  const shape=(d,color,border=ink,width=.9)=>{
    const path=new Path2D(d);c.fillStyle=color;c.fill(path);
    if(border){c.strokeStyle=border;c.lineWidth=width;c.stroke(path)}
  };
  const line=(d,color,width)=>{
    c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(d));
  };
  const glow='#92dbdc';
  const rider=general==='guanyu',scholar=general==='zhugeliang';
  c.save();c.lineJoin='round';c.lineCap='round';
  // Two curling wisps form the lower silhouette of the apparition.
  shape('M15 67 Q24 70 38 62 Q51 59 62 64 Q54 64 46 69 Q32 77 23 73 Q31 73 34 69 Q24 72 15 67Z','#7cccca78',null);
  line('M19 65 Q28 68 37 62 M40 72 Q51 65 58 67','#b3ece595',.85);
  if(rider){
    const stride=pose*3;
    c.save();c.translate(0,-1);
    shape('M24 49 Q15 46 13 52 Q11 58 6 60 Q15 62 22 53Z','#62434b');
    line('M29 54 L24 61 L21 66 M48 54 L55 59 L59 58','#62434b',3.5);
    line('M25 55 L'+(30-stride)+' 61 L'+(27-stride)+' 69 M51 54 L'+(56+stride)+' 53 L'+(61+stride)+' 61','#9a6050',3.8);
    shape('M19 48 Q26 42 39 47 Q47 49 51 41 L55 33 L58 31 L58 27 L61 31 L64 29 L63 34 L69 40 L67 43 L61 42 L57 39 Q58 51 51 56 Q37 63 24 57 Q17 55 19 48Z','#af6e54');
    shape('M46 48 Q50 39 56 31 L59 31 Q54 36 53 45 L49 51Z','#65454a');
    shape('M27 46 L43 47 L40 57 L29 54Z','#41695e');
    line('M28 52 L40 55 M59 35 L65 41',brass,1.2);
    oval(c,62.2,35.8,.9,.85,ink);c.restore();
  }

  c.save();
  if(rider){c.translate(2,0);c.translate(40,44);c.scale(.88,.88);c.translate(-40,-54)}
  c.translate(pose*1.6,-Math.abs(pose)*.75);
  // Cape, legs and coat beneath the breastplate.
  shape('M32 36 Q27 39 26 48 Q23 57 17 60 L23 59 L20 63 Q31 62 36 51 L40 39Z',shadow);
  line('M24 59 Q30 55 32 46',glow,.9);
  shape('M34 53 L40 54 L37 65 L31 65 L33 61Z M43 52 L48 52 L49 62 L53 64 L52 66 L44 66Z',ink);
  shape('M33 35 Q40 32 46 35 L50 42 L47 49 L52 59 L44 61 L40 57 L37 62 L29 59 L33 48 L28 46Z',cloth);
  shape('M33 37 L38 42 L35 50 L31 57 L34 47 L30 45Z',shadow,null);
  if(scholar){
    line('M34 36 L41 42 L46 36 M41 42 L37 51',edge,1.8);
  }else{
    shape('M34 36 Q40 40 46 35 L47 45 L42 49 L35 46Z',shadow);
    line('M35 39 Q41 42 46 38 M35.5 42 Q41 45 46.6 41 M36 45 Q41 47.5 46.8 44',general==='zhaoyun'?edge:brass,1.1);
    shape('M28 39 L32 35 L37 36 L38 40 L29 43Z',cloth);
    line('M29 41 L36 39',brass,1.2);
    shape('M34 50 L40 51 L37 59 L31 57Z M42 51 L46 49 L49 57 L43 59Z',shadow);
    line('M33.6 54 L38 55 M43 54 L46.5 53',steel,.9);
  }
  line('M33 48 Q40 50 47 47','#66504a',2);
  shape('M39 48 L42 47.5 L42.6 50 L39.7 50.5Z',brass,null);

  shape('M34 24 Q39 20 46 23 L47 29 L49 31 L46.5 32 L46 34.5 Q45.4 36.2 43 36.3 L39 36.3 Q33.2 36.2 31.8 32 Q31.4 28.5 34 24Z',rider?'#bf8269':skin);
  if(rider||scholar||general==='liubei'||general==='dianwei'){
    shape('M32 29 Q30 22 35 19 Q41 17 46 22 L48 25 L41 25 L36 27 L34 32Z',rider?'#39735f':shadow);
    if(scholar){
      shape('M33 23 L32 16 L34 15 L34 11 L39 13 L42 11 L45 15 L45 22Z','#4b6163');
      line('M35 17 L42 16 M35 20 L44 19',edge,1);
    }else if(general==='liubei'){
      shape('M35 22 L35 17 L39 15 L42 17 L42 21Z',brass);
      line('M33 24 Q39 21 46 23',brass,1);
    }else{
      shape('M31 23 L44 21 L48 24 L34 26 L28 33 L30 27 L24 29Z',rider?'#65a382':'#7cb2b7');
    }
  }else{
    shape('M31 26 Q31 20 36 18 L39 16 L42 18 Q47 19 47 23 L50 25 L39 26 L36 32 L31 33Z',cloth);
    line('M32 25 Q39 22 47 23 M33 29 L36 28',general==='zhaoyun'?edge:brass,1.4);
    if(general==='lvbu'){
      line('M39 19 Q32 1 15 14 Q10 18 8 23 M41 18 Q43 2 57 8 Q62 11 65 16','#694552',2.8);
      line('M38 16 Q29 5 18 13 M44 12 Q51 4 60 11','#eed6a0',1.2);
    }else if(general==='zhaoyun'||general==='huangzhong'){
      shape('M40 18 Q33 10 26 16 L21 23 L26 21 L22 27 Q31 26 34 20Z',general==='zhaoyun'?'#e0f1e8':'#d0a465');
    }
  }
  line('M40 28 L44 27.4',ink,1);
  oval(c,43.4,29.6,.9,.85,ink);
  if(rider){
    shape('M35 31 L39 32.8 L43 32 L46 33 L48 32 Q48 39 44 46 L43 42 L39 48 Q40 42 36 38Z','#304342');
    line('M39 36 Q43 39 41 43','#607267',.85);
  }else if(scholar||general==='huangzhong'||general==='liubei'||general==='xuhuang'){
    shape('M37 32.4 Q41 35 44 32.5 L47 33.4 L46 37 L42 42 L41 38 L38 37Z',general==='huangzhong'?'#e7e3d1':'#435051');
  }

  // All weapon coordinates are relative to the front hand. Rotation keeps the grip attached.
  const metal=(d)=>shape(d,steel);
  const haft=(d)=>{line(d,ink,3.4);line(d,'#a78660',1.8)};
  const grip=()=>shape('M-3 -1 Q-1 -3 1 -2 L3 -1 L3 2 L0 3 L-3 2Z',skin);
  function sword(short=false){
    const tip=short?15:23;
    metal('M-1 -3 L-1.2 -'+(tip-5)+' L1 -'+tip+' L2 -'+(tip-5)+' L2 -3Z');
    line('M-3 -3 L4 -3',brass,1.6);line('M.5 -2 L.5 5','#72594f',1.8);
  }
  function shortJi(){
    haft('M0 6 L0 -15');
    metal('M-1.3 -13 L-1.7 -18 L.2 -23 L1.8 -18 L1.3 -13Z');
    metal('M0 -12 L4 -15 L6 -20 Q9 -12 2 -10 L0 -9Z');
    line('M-1.6 -8.5 L1.6 -8.5',brass,1.2);
  }
  c.save();
  const bow=general==='huangzhong',crossbow=scholar;
  const thrust=general==='zhaoyun';
  c.translate(48+(thrust?pose*4:0),43+(bow?0:pose));
  if(!bow&&!crossbow){
    const readyAngle=rider?.94:thrust?.69:.48;
    c.rotate(readyAngle+pose*(thrust?.71:.95));
  }
  switch(general){
    case 'zhaoyun':
      haft('M0 20 L0 -26');
      shape('M-1.7 -25 Q-6 -22 -5 -15 L-3 -17 L-4 -11 Q1 -17 1 -25Z','#be6258');
      metal('M-2 -26 L-2.8 -29 L0 -43 L3.2 -30 L1.3 -26Z');
      line('M0 -28 L.2 -39',edge,1.1);line('M-1.8 -25 L1.8 -25',brass,1.5);break;
    case 'guanyu':
      haft('M0 21 L0 -17');
      // Broad crescent belly, hooked spine and a dragon-head collar.
      shape('M-1.7 -17 L-4 -20 L-2 -23 L-4 -28 L-.8 -27 Q5 -34 3 -42 Q17 -32 12 -23 Q8 -17 2 -16Z','#8db7af');
      shape('M3 -42 Q18 -29 10 -20 L2 -16 Q9 -23 10 -27 Q11 -33 3 -42Z',edge,null);
      line('M.5 -20 Q7 -24 6 -30','#46786f',1.2);
      shape('M-2.4 -14 L-3.4 -19 L-.5 -18 L2.6 -22 L4 -21 L3 -18 L6 -18 L3 -15Z',brass);
      oval(c,1,-17.3,.7,.7,ink);break;
    case 'lvbu':
      haft('M0 20 L0 -29');metal('M-1.5 -24 L-1.8 -28 L0 -38 L2 -28 L1.4 -24Z');
      metal('M0 -18 Q9 -20 8 -32 Q14 -20 6 -17 L1 -15Z M0 -20 Q-8 -22 -7 -31 Q-13 -21 -6 -18 L0 -16Z');
      line('M-2 -15 L2 -15',brass,1.6);break;
    case 'xuhuang':
      haft('M0 13 L0 -24');
      metal('M-4 -24 L4 -23 Q7 -24 10 -29 Q17 -20 11 -13 Q6 -16 2 -18 L-3 -18Z');
      line('M10 -28 Q14 -21 11 -15',edge,1.4);break;
    case 'wuanguo':
      haft('M0 15 L0 -23');
      metal('M-8 -27 L-5 -30 L7 -29 L10 -26 L9 -19 L6 -17 L-6 -18 L-9 -21Z');
      shape('M-6 -26 L6 -25 L6 -20 L-6 -21Z','#718d98',null);
      line('M-5 -28 L6 -27',edge,1.3);break;
    case 'huangzhong':{
      c.rotate(-.13);
      const nock=-5-pose*9;
      line('M4 -20 Q16 -12 12 0 Q17 9 4 20','#5e5550',3.3);
      line('M4 -20 Q16 -12 12 0 Q17 9 4 20',brass,1.7);
      line('M4 -20 L'+nock+' 0 L4 20',edge,.85);
      line('M'+nock+' 0 L'+(nock+28)+' 0','#e2d5a5',1.3);
      metal('M'+(nock+25)+' -1.7 l6 1.7 -6 1.7Z');
      line('M0 1 L11 0',cloth,3);break;
    }
    case 'zhugeliang':
      c.rotate(-.23-pose*.11);c.translate(-pose*2,0);
      shape('M-8 1 L7 -1 L21 -1 L22 1 L4 3 L-7 7Z','#ac875a');
      shape('M-1 -7 L11 -7 L13 -1 L0 0Z',shadow);
      line('M1 -5 L10 -5 M2 -3 L11 -3',brass,.9);
      line('M13 -12 Q22 -1 15 11',brass,2.4);line('M13 -12 L3 1 L15 11',edge,.8);
      line('M2 0 L25 -1',steel,1.2);break;
    case 'caoren':
      sword(true);break;
    case 'liubei':
      sword();break;
    case 'dianwei':
      shortJi();break;
  }
  grip();c.restore();
  c.save();c.translate(32,45);
  if(general==='caoren'){
    c.rotate(pose*-.22);
    shape('M-8 -9 Q-2 -13 6 -10 L7 2 Q5 8 0 12 Q-6 9 -8 4Z',steel);
    shape('M-6 -8 Q0 -10 4 -8 L5 2 Q3 7 0 9 Q-4 6 -6 2Z',shadow);
    shape('M0 -5 L3 0 L0 5 L-3 0Z',brass);
  }else if(general==='liubei'||general==='dianwei'){
    c.rotate(-.85-pose*.65);
    if(general==='dianwei')shortJi();else sword();
    grip();
  }else{
    shape('M-3 -4 L1 -5 L4 -2 L2 2 L-2 2Z',cloth);
  }
  c.restore();c.restore();c.restore();
}

function generalSoulFrame(scene,type,frame){
  const key='soul-'+type.general+'-'+frame;
  if(!scene.textures.exists(key)){
    const poses=type.general==='huangzhong'?[0,.4,.85,1,-.35,-.1,0]:[0,-.22,-.42,.35,1,.55,0];
    paintTexture(scene,key,200,160,c=>{
      c.scale(2,2);drawGeneralSoul(c,type.general,poses[frame]);
    });
  }
  return key;
}
