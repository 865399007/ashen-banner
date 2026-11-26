// The codex and the battlefield share a bust, drawn around its belt at (40, 48).
function drawGeneralSoul(c,general,pose=0){
  const colors={
    liubei:['#478a70','#294f53'],zhaoyun:['#abc8d2','#54768e'],
    huangzhong:['#b08a52','#65503e'],xuhuang:['#698aa1','#3b5269'],
    caoren:['#60768a','#344357'],zhugeliang:['#c1ccbb','#708982'],
    wuanguo:['#977767','#594d52'],dianwei:['#826963','#4d4753'],
    lvbu:['#a64640','#61363e'],guanyu:['#49866a','#2b5549']
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
  // The cloak and tunic taper into wisps just below the belt.
  shape('M33 36 Q28 39 27 44 Q25 49 21 51 Q27 51 31 47 Q29 51 27 53 Q35 51 39 44 L40 37Z',shadow);
  line('M25 50 Q30 48 32 43',glow,.9);
  shape('M33 35 Q40 32 46 35 L50 42 L47 46 Q46 49 42 51 Q43 49 42 48 Q38 52 33 53 Q35 50 34 48 L29 46Z',cloth);
  shape('M33 37 L38 42 Q36 48 33 50 L34 46 L30 45Z',shadow,null);
  if(scholar){
    line('M34 36 L41 42 L46 36 M41 42 L38 48',edge,1.8);
  }else if(general==='lvbu'){
    shape('M33 36 L38 38 L41 40 L46 36 L48 39 L46 46 L41 48 L34 45Z','#444959');
    line('M34 38 L40.5 42 L46 38 M35 43 L41 46 L46 42',brass,1.1);
    shape('M26 39 Q28 34 33 34 L38 36 L35 41 L29 43 L25 42Z','#bd894e');
    shape('M26 39 Q30 35 35 36 L32 38 L34 39 L29 40Z','#f2d79a',null);
    line('M37 35 L40.8 38.4 L46 35',cloth,2);
  }else{
    shape('M34 36 Q40 40 46 35 L47 45 L42 49 L35 46Z',shadow);
    line('M35 39 Q41 42 46 38 M35.5 42 Q41 45 46.6 41 M36 45 Q41 47.5 46.8 44',general==='zhaoyun'?edge:brass,1.1);
    shape('M28 39 L32 35 L37 36 L38 40 L29 43Z',cloth);
    line('M29 41 L36 39',brass,1.2);
  }
  line('M33 48 Q40 50 47 47','#66504a',2);
  shape('M39 48 L42 47.5 L42.6 50 L39.7 50.5Z',brass,null);

  shape('M34 24 Q39 20 46 23 L47 29 L49 31 L46.5 32 L46 34.5 C45.4 36.1 43.4 37.2 41 37.2 C36.7 37.2 33.2 35.9 31.8 32 Q31.4 28.5 34 24Z',rider?'#bf8269':skin);
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
  }else if(general==='lvbu'){
    shape('M32 27 Q28 27 28 33 L24 37 Q30 37 33 33 L35.5 28Z','#34343e');
    shape('M32 29 Q30 24 33 21 Q38 17 44 20 Q47 21 47 24 L43 24 L38 25 L35 30 L34 32Z','#35343c');
    shape('M35 19 Q33 16 35 14.8 Q38 12.8 40 15 L41 19Z','#3d3537');
    shape('M32 23 L33 17 L36.8 19 L39.3 14.8 L41.4 18.8 L45 16.6 L45.3 20.5 L47 22.2 L42 22.2 L38 23.6 L34 26Z','#d6a254');
    line('M33.6 23.2 Q38 20.8 44.9 20.7','#f8d995',1.1);
    shape('M37.3 21.2 L39.4 18.3 L41 20.5 L39.3 22.8Z','#923c35',null);
  }else{
    shape('M31 26 Q31 20 36 18 L39 16 L42 18 Q47 19 47 23 L50 25 L39 26 L36 32 L31 33Z',cloth);
    line('M32 25 Q39 22 47 23 M33 29 L36 28',general==='zhaoyun'?edge:brass,1.4);
    if(general==='zhaoyun'||general==='huangzhong'){
      shape('M40 18 Q33 10 26 16 L21 23 L26 21 L22 27 Q31 26 34 20Z',general==='zhaoyun'?'#e0f1e8':'#d0a465');
    }
  }
  if(general==='lvbu'){
    line('M38.6 26.6 L43.8 28',ink,1.3);
    line('M43 33.2 L45.5 32.8','#895d50',.8);
  }else line('M40 28 L44 27.4',ink,1);
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
    const readyAngle=rider?.88:thrust?.69:.48;
    c.rotate(readyAngle+pose*(rider||thrust?.71:.95));
  }
  switch(general){
    case 'zhaoyun':
      haft('M0 20 L0 -26');
      shape('M-1.7 -25 Q-6 -22 -5 -15 L-3 -17 L-4 -11 Q1 -17 1 -25Z','#be6258');
      metal('M-2 -26 L-2.8 -29 L0 -43 L3.2 -30 L1.3 -26Z');
      line('M0 -28 L.2 -39',edge,1.1);line('M-1.8 -25 L1.8 -25',brass,1.5);break;
    case 'guanyu':
      haft('M0 21 L0 -15');
      // A single deep notch breaks the concave spine below the upswept tip.
      shape('M-1.4 -14 Q.3 -18.8 -1.8 -23.9 C-2.6 -26 -6.4 -28.5 -5.4 -30.9 Q.6 -29.7 -.9 -35.8 Q-2.2 -40.2 -8.8 -43.9 C-3.2 -44 3.8 -39.3 6.9 -34 C10.2 -28.4 6.9 -21.8 3.5 -16 Q2.4 -14.6 1.4 -14Z','#76a9a3');
      shape('M-8.8 -43.9 C-3.2 -44 3.8 -39.3 6.9 -34 C10.2 -28.4 6.9 -21.8 3.5 -16 Q7.5 -26.6 4.9 -32.9 Q1.4 -39.6 -8.8 -43.9Z',edge,null);
      line('M1.2 -20.1 Q4 -25 2.9 -29.8','#46786f',1);
      shape('M-2.2 -12.6 L-3.4 -16.4 L-5 -19.4 L-1.6 -18 L-2.6 -21.4 L1.5 -18.8 L3.8 -19 L5.4 -16.6 L2 -15.5 L1.6 -12.6Z',brass);
      oval(c,2,-17.6,.65,.65,ink);
      shape('M-2 -12.8 Q-5 -11 -6 -7 L-4.4 -8 Q-5 -5 -7 -3 Q-1.8 -5 -1.2 -12Z','#b96050',null);break;
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
  c.restore();c.restore();
}

function generalSoulFrame(scene,type,frame){
  const key='soul-'+type.general+'-'+frame;
  if(!scene.textures.exists(key)){
    const poses=type.general==='huangzhong'?[0,.4,.85,1,-.35,-.1,0]:[0,-.22,-.42,.35,1,.55,0];
    paintTexture(scene,key,224,140,c=>{
      // Center the belt horizontally so a flipped weapon pose uses the same attachment.
      c.scale(2,2);c.translate(16,0);drawGeneralSoul(c,type.general,poses[frame]);
    });
  }
  return key;
}


const plumeFrameCount=24;
function lvbuPlumeFrame(scene,frame){
  const key='lvbu-plumes-'+frame;
  if(scene.textures.exists(key))return key;
  const phase=frame*TAU/plumeFrameCount;
  paintTexture(scene,key,224,140,c=>{
    c.scale(2,2);c.translate(16,0);c.lineJoin='round';c.lineCap='round';
    // Both shafts are clamped at the crown. The wave travels toward the flexible tips.
    function feather(rootX,rootY,controlX,controlY,bendX,bendY,tipX,tipY,width,lag,base,light){
      const shaft=t=>{
        const u=1-t,flex=t*t,wave=phase-3.2*t+lag;
        return {
          x:u*u*u*rootX+3*u*u*t*controlX+3*u*t*t*bendX+t*t*t*tipX+flex*1.5*Math.cos(wave),
          y:u*u*u*rootY+3*u*u*t*controlY+3*u*t*t*bendY+t*t*t*tipY+flex*2.7*Math.sin(wave)
        };
      };
      const points=[];
      for(let i=0;i<=40;i++){
        const t=i/40,p=shaft(t),a=shaft(Math.max(0,t-.005)),b=shaft(Math.min(1,t+.005));
        const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
        const breadth=width*Math.pow(Math.sin(Math.PI*t),.72)*(.59+.72*t);
        points.push({x:p.x,y:p.y,nx:-dy/length*breadth,ny:dx/length*breadth});
      }
      function edge(i,side){
        const p=points[i];
        const notch=i>9&&i<36&&(i+(side>0?2:0))%8===0 ? .65 : 1;
        return [p.x+side*notch*p.nx,p.y+side*notch*p.ny];
      }
      c.beginPath();c.moveTo(rootX,rootY);
      for(let i=1;i<=40;i++)c.lineTo(...edge(i,1));
      for(let i=39;i>=0;i--)c.lineTo(...edge(i,-1));
      c.closePath();c.fillStyle=base;c.fill();
      c.strokeStyle='#593b3e';c.lineWidth=.65;c.stroke();
      // Oblique paired bars follow the changing normal of the vane.
      for(const i of [10,17,24,31]){
        const p=points[i];
        c.beginPath();c.moveTo(...edge(i+3,1));c.lineTo(p.x,p.y);c.lineTo(...edge(i+4,-1));
        c.lineTo(...edge(i+2,-1));c.lineTo(points[i-2].x,points[i-2].y);c.lineTo(...edge(i+1,1));
        c.closePath();c.fillStyle=light;c.fill();
      }
      c.beginPath();c.moveTo(rootX,rootY);
      for(const p of points.slice(1,-2))c.lineTo(p.x,p.y);
      c.strokeStyle='#ecc48a';c.lineWidth=.5;c.stroke();
    }
    feather(35.5,20,25,6,10,12,1,32,2.1,.8,'#93514a','#d79973');
    feather(40,18.7,29,1,9,2,-9,20,2.45,0,'#ba5041','#f0a067');
  });
  return key;
}
