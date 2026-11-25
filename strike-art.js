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
