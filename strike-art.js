// Weapon accents use the wielder's world-space height so their footprint follows the sprite.
const strikeInks=[
  null,
  {shadow:0x397198,body:0x6cc5ee,light:0xdbf6ff},
  {shadow:0x674781,body:0xc395ef,light:0xf9e2ff},
  {shadow:0xad612b,body:0xffbd51,light:0xfff3c6}
];
function bladeRibbon(g,r,start,end,width,color){
  const points=[];
  for(let i=0;i<=14;i++){
    const t=start+(end-start)*i/14;
    points.push({x:Math.cos(t)*r,y:Math.sin(t)*r});
  }
  for(let i=14;i>=0;i--){
    const t=start+(end-start)*i/14,inner=r-width*Math.sin(Math.PI*i/14);
    points.push({x:Math.cos(t)*inner,y:Math.sin(t)*inner});
  }
  g.fillStyle(color).fillPoints(points,true);
}
function strikeShard(g,x,y,dx,dy,width,color){
  const length=Math.hypot(dx,dy),nx=-dy*width/length,ny=dx*width/length;
  g.fillStyle(color).fillPoints([{x,y},{x:x+dx*.38+nx,y:y+dy*.38+ny},
    {x:x+dx,y:y+dy},{x:x+dx*.38-nx,y:y+dy*.38-ny}],true);
}
function weaponAccent(scene,unit,x,y,angle,body,delay){
  const rank=unit.q,ink=strikeInks[rank],id=unit.id;
  const scale=body/30;
  const drawLayer=(layer)=>{
    const g=scene.add.graphics().setPosition(x,y).setDepth(1001).setRotation(angle);
    const color=layer===0?ink.body:layer===1?ink.light:ink.body;
    if(id===0||id===3||id===7||id===8){
      const radius=[14,0,0,18,0,0,0,10,20][id];
      const direction=layer===1?-1:1;
      g.setRotation(angle+direction*(layer===1?.65:-.35));
      const r=radius+layer*2;
      g.setPosition(x-r*scale*.65*Math.cos(angle),y-r*scale*.65*Math.sin(angle));
      bladeRibbon(g,r,-1.1,1.1,layer===0?4:2,color);
      if(id===7)bladeRibbon(g,r*.72,-1.45,.85,2,ink.light);
      if(id===8)strikeShard(g,-6,0,15,0,1.4,ink.light);
    }else if(id===1||id===9){
      const length=id===9?12:21;
      strikeShard(g,-length,0,length+6,0,2.8,color);
      if(layer>0||id===9)for(const side of [-1,1])strikeShard(g,1,side*2,6,side*5,1.3,color);
    }else if(id===2||id===5){
      const r=id===5?11:8;
      for(const side of [-1,1])strikeShard(g,1,side,-r,side*(4+layer*2),1.6,color);
      strikeShard(g,-6,0,13,0,id===5?2.3:1.3,ink.light);
    }else{
      const r=id===4?9:14;
      for(let i=0;i<(id===4?3:6);i++){
        const t=id===4?(i-1)*.62:i*Math.PI/3;
        strikeShard(g,2*Math.cos(t),2*Math.sin(t),r*Math.cos(t),r*Math.sin(t),2,color);
      }
    }
    if(layer===2){
      // Two engraved half-rings leave the centre open around the target.
      for(const offset of [0,Math.PI]){
        bladeRibbon(g,12,offset+.23,offset+2.6,1.5,ink.body);
      }
      strikeShard(g,0,-8,0,-8,2.3,ink.light);
      for(let i=0;i<5;i++){
        const t=(i+.35)*Math.PI*2/5,c=Math.cos(t),s=Math.sin(t);
        strikeShard(g,6*c,6*s,7*c,7*s,1.6,ink.light);
      }
    }
    const start=g.rotation,sweep=[0,3,7,8].includes(id);
    g.setScale(scale*.75).setAlpha(0);
    scene.tweens.add({targets:g,delay:delay+layer*42,alpha:1,scaleX:scale,scaleY:scale,
      rotation:start+(sweep?.26:0),duration:42,onComplete:()=>{
        scene.tweens.add({targets:g,alpha:0,scaleX:scale*1.16,scaleY:scale*1.16,
          rotation:g.rotation+(sweep?.34:0),duration:100+24*rank,onComplete:()=>g.destroy()});
      }});
  };
  for(let layer=0;layer<rank;layer++)drawLayer(layer);
}

// Colours and silhouettes follow the general's signature weapon.
const soulStrikes={
  liubei:    {form:'swords',color:0x53c99b},
  zhaoyun:   {form:'spear',color:0x72c8f0},
  huangzhong:{form:'arrow',color:0xeaa248},
  xuhuang:   {form:'axe',color:0x79accd},
  caoren:    {form:'shield',color:0x749fe0},
  zhugeliang:{form:'bolts',color:0x74cdb6},
  wuanguo:   {form:'hammer',color:0xe79a67},
  dianwei:   {form:'twinJi',color:0xc38ae1},
  lvbu:      {form:'halberd',color:0xf27152},
  guanyu:    {form:'crescent',color:0x58c798}
};

function drawSoulWeapon(g,form,color){
  const light=0xfff2ce;
  switch(form){
    case 'arrow':
    case 'bolts':{
      const lanes=form==='arrow'?[0]:[-6,0,6];
      for(const y of lanes){
        const x=y===0?0:-5,length=form==='arrow'?29:17;
        strikeShard(g,x-length,y,length,0,2,color);
        g.fillStyle(light).fillTriangle(x+4,y,x-3,y-2,x-3,y+2);
        g.lineStyle(1,color).lineBetween(x-length+4,y,x-length,y-2.5).lineBetween(x-length+4,y,x-length,y+2.5);
      }
      break;
    }
    case 'spear':
    case 'halberd':
      strikeShard(g,-31,0,36,0,3.4,color);
      strikeShard(g,-21,0,27,0,1.1,light);
      if(form==='halberd'){
        for(const side of [-1,1]){
          g.fillStyle(color).fillPoints([{x:-14,y:0},{x:-8,y:side*7},{x:1,y:side*10},{x:-4,y:side*4}],true);
        }
      }else{
        g.lineStyle(1.2,light).lineBetween(-24,-4,-10,-3).lineBetween(-29,4,-14,3);
      }
      break;
    case 'shield':
    case 'hammer':{
      if(form==='shield'){
        g.lineStyle(2,color).strokePoints([{x:-9,y:-10},{x:2,y:-9},{x:6,y:-4},{x:5,y:4},{x:-1,y:10},{x:-8,y:5}],true);
        strikeShard(g,-10,0,14,0,2,light);
      }else{
        g.lineStyle(2.4,color).lineBetween(-14,8,-2,-2);
        g.fillStyle(color).fillPoints([{x:-9,y:-6},{x:-5,y:-10},{x:6,y:-4},{x:3,y:2}],true);
        g.lineStyle(1.3,light).lineBetween(-5,-9,5,-4);
      }
      break;
    }
    default:{
      const broad=form==='crescent'||form==='axe',r=broad?23:18;
      g.save().translateCanvas(-r,0);
      bladeRibbon(g,r,-1.28,1.18,form==='axe'?9:5,color);
      bladeRibbon(g,r+1,-1.12,.94,1.6,light);
      if(form==='swords'||form==='twinJi'){
        g.translateCanvas(-4,form==='swords'?5:-6).rotateCanvas(form==='swords'?.46:-.6);
        bladeRibbon(g,r-2,-1.25,.97,3,color);
        if(form==='twinJi')strikeShard(g,r-7,-4,11,1,1.5,light);
      }else if(form==='crescent'){
        bladeRibbon(g,r-7,-1.47,.65,2.1,light);
      }
      g.restore();
    }
  }
}

function showSoulStrike(scene,soul,general,target){
  const {form,color}=soulStrikes[general],light=0xfff2ce;
  // The painted grip is eight drawing units forward and five above the belt anchor.
  const scale=soul.scaleX*2,side=soul.flipX?-1:1;
  const x=soul.x+side*8*scale,y=soul.y-5*scale;
  const dx=target.x-x,dy=target.y-target.displayHeight*.4-y;
  const angle=Math.atan2(dy,dx),reach=Math.hypot(dx,dy);
  const g=scene.add.graphics().setPosition(x,y).setRotation(angle).setDepth(998);
  const heavy=form==='hammer'||form==='shield'||form==='axe';
  const sweep=['swords','twinJi','crescent','axe'].includes(form);
  function paint(t){
    g.clear();
    const travel=Phaser.Math.Clamp((t-.12)/.5,0,1);
    const front=reach*(1-(1-travel)**2);
    if(t<.73){
      const fade=Phaser.Math.Clamp((.73-t)/.15,0,1);
      g.setAlpha(fade);
      const tail=Math.min(front,28);
      if(tail>1){
        // Two tapering streamers spiral in behind the travelling weapon.
        for(const sign of [-1,1]){
          const points=[];
          for(let i=0;i<=12;i++){
            const u=i/12,spread=Math.sin(Math.PI*u);
            const y=sign*spread*(4+2.5*Math.sin(5*u-7*t));
            points.push({x:front-tail*(1-u),y});
          }
          g.lineStyle(1,color,.8).strokePoints(points);
          const spark=points[sign>0?4:8],size=1.6*travel;
          strikeShard(g,spark.x-size,spark.y,size*2+.01,0,size*.7,light);
        }
        strikeShard(g,front-tail,0,tail,0,1.6,color);
      }
      g.save().translateCanvas(front,0).scaleCanvas(.55+.45*travel,.55+.45*travel);
      if(sweep)g.rotateCanvas(side*(-.75+travel*1.25));
      drawSoulWeapon(g,form,color);
      g.restore();
    }
    if(t>.5){
      const burst=(t-.5)*2,r=(heavy?25:17)*burst+2;
      g.setAlpha(1-burst).save().translateCanvas(reach,0);
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3+.24,u=Math.cos(a),v=Math.sin(a);
        strikeShard(g,r*u,r*v,(3+5*burst)*u,(3+5*burst)*v,1.3,i%2?light:color);
      }
      for(const a of [.3,Math.PI+.3])bladeRibbon(g,r,a+burst*.5,a+2.3+burst*.5,heavy?2.6:1.4,color);
      g.restore();
    }
  }
  paint(0);
  const animation=scene.tweens.addCounter({from:0,to:1,duration:heavy?390:330,
    onUpdate:tween=>paint(tween.getValue()),onComplete:()=>{soul.off('destroy',cancel);g.destroy()}});
  function cancel(){animation.remove();g.destroy()}
  soul.once('destroy',cancel);
}
