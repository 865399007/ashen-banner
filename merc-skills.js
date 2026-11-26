// Follow-ups use combat time, so pause, hit stop and wave changes affect them like normal attacks.
function followUp(scene,unit,delay,run){
  unit.followUps.push({at:scene.elapsed+delay,run});
}
function runFollowUps(scene,unit){
  if(!unit.followUps.length)return;
  for(const event of unit.followUps.filter(event=>event.at<=scene.elapsed)){
    unit.followUps.splice(unit.followUps.indexOf(event),1);
    if(scene.mode==='fight')event.run();
  }
}
function pointOf(sprite){return {x:sprite.x,y:sprite.y}}
function heading(from,to){return Math.atan2(to.y-from.y,to.x-from.x)}
function areaTargets(scene,origin,angle,length,width,shape){
  const dx=Math.cos(angle),dy=Math.sin(angle);
  return scene.enemies.filter(e=>{
    const x=e.s.x-origin.x,y=e.s.y-origin.y,d=Math.hypot(x,y);
    if(shape==='ring')return d<=length;
    const along=x*dx+y*dy;
    if(shape==='line')return along>=0&&along<=length&&Math.abs(x*dy-y*dx)<=width;
    return d<=length&&along>=d*Math.cos(width);
  }).sort((a,b)=>distance(origin,a.s)-distance(origin,b.s));
}
function skillMark(scene,unit,origin,angle,size,kind){
  const gold=unit.q===3?0xffcd6d:0xe3dbb0;
  const g=scene.add.graphics().setPosition(origin.x,origin.y-4).setRotation(angle).setDepth(998);
  g.lineStyle(1.5,gold,.88);
  if(kind==='ring'){
    g.strokeEllipse(0,0,size*2,size*1.5);
  }else if(kind==='sweep'||kind==='moon'){
    bladeRibbon(g,size,-1.22,1.22,kind==='moon'?5:3,gold);
  }else if(kind==='crack'){
    g.strokePoints([{x:0,y:0},{x:size*.35,y:-3},{x:size*.47,y:3},{x:size*.75,y:-2},{x:size,y:0}]);
    g.lineBetween(size*.47,3,size*.7,9);
  }else if(kind==='cross'){
    g.lineBetween(-7,-8,7,8).lineBetween(-7,8,7,-8);
  }else{
    strikeShard(g,0,0,size,0,kind==='spear'?3:1.6,gold);
  }
  g.setScale(kind==='ring'?.45:.85);
  scene.tweens.add({targets:g,x:g.x+(kind==='moon'?Math.cos(angle)*size*.5:0),
    y:g.y+(kind==='moon'?Math.sin(angle)*size*.5:0),scaleX:1,scaleY:1,alpha:0,duration:210,onComplete:()=>g.destroy()});
}
function skillArea(scene,a,primary,origin,angle,radius,width,shape,power,kind,limit=Infinity){
  const hits=areaTargets(scene,origin,angle,radius,width,shape).slice(0,limit);
  skillMark(scene,a,kind==='cross'&&hits.length?hits[0].s:origin,angle,radius,kind);
  for(const victim of hits){
    if(scene.mode!=='fight')break;
    scene.mercHit(a,victim,primary,power);
  }
  return hits;
}
function fireRankedArrow(scene,a,target,power,pierce,options={}){
  const {fanAngle,heavy=false,golden=false,offset=0,exclude}=options;
  const origin=a.s,range=scene.mercRange(a);
  const angle=fanAngle??heading(origin,target.s);
  const aim={x:origin.x+range*Math.cos(angle),y:origin.y+range*Math.sin(angle),height:origin.height,scaleY:origin.scaleY};
  const line=pierce||fanAngle!==undefined?areaTargets(scene,origin,angle,range,5,'line'):[];
  const hits=fanAngle===undefined?[target,...line.filter(e=>e!==target&&distance(origin,e.s)>=distance(origin,target.s))]:line.filter(e=>e!==exclude);
  const victims=hits.slice(0,1+pierce);
  const blocked=victims.findIndex(e=>e.skin===10&&shieldFront(e,a.s));
  if(blocked>=0)victims.length=blocked+1;
  const end=victims.at(-1)??{s:aim};
  scene.weaponEffect(a,end,{heavy,golden,offset});
  for(const [i,e] of victims.entries()){
    if(scene.mode!=='fight'||scene.arrowBlocked(a,e))break;
    const force=power*(scene.bag[3]?.9:1)*(a.id===2&&i>0?.7:1)*(heavy&&i===0&&(e.boss||e.elite)?1.25:1);
    scene.mercHit(a,e,victims[0],force);
  }
}
function rangedRound(scene,a,e){
  const bagPierce=Number(scene.bag[3]>0),reserve=a.shots%5===0?scene.bag[5]:0;
  if(a.id===5){
    const count=1+Number(a.q>=1)+Number(a.q===3)+scene.bag[20]+reserve;
    for(let i=0;i<count;i++){
      const fire=()=>{
        const target=e.hp>0&&distance(a.s,e.s)<=scene.mercRange(a)?e:scene.closestInRange(a);
        if(!target)return;
        const heavy=a.q>=2&&i===count-1;
        fireRankedArrow(scene,a,target,i===1&&a.q>=1?.7:heavy&&a.q===3?.85:1,
          bagPierce+(heavy?(a.q===3?3:2):0),{heavy});
      };
      if(i&&a.q)followUp(scene,a,i*.14,fire);else if(scene.mode==='fight')fire();
    }
    return;
  }
  const golden=a.q===3&&a.shots%4===0;
  const sides=Number(a.q>=1)+Number(a.q===3);
  const count=1+sides+Number(scene.bondCounts[2]>=4)+reserve;
  const pierce=bagPierce+(golden?2:Number(a.q>=2));
  const angle=heading(a.s,e.s),range=scene.mercRange(a);
  const used=new Set([e]);let refocused=false;
  for(let i=0;i<count&&scene.mode==='fight';i++){
    let target=i===0?e:scene.enemies.filter(v=>!used.has(v)&&distance(a.s,v.s)<=range)
      .sort((l,r)=>distance(l.s,e.s)-distance(r.s,e.s))[0];
    let fanAngle;
    if(!target){
      if((!refocused||!a.q)&&e.hp>0){target=e;refocused=true}
      else fanAngle=angle+(i%2?1:-1)*(.28+.09*i);
    }
    if(target)used.add(target);
    fireRankedArrow(scene,a,target,i>0&&i<=sides?.65:1,pierce,{fanAngle,golden,offset:i===0?0:(i%2?2:-2),exclude:e});
  }
}
function meleeRound(scene,a,e){
  const range=scene.mercRange(a),origin=pointOf(a.s),center=pointOf(e.s),angle=heading(origin,center);
  const signature=a.q===3&&a.shots%3===0;
  const again=(power,cross=false)=>{
    const target=e.hp>0&&distance(a.s,e.s)<=range?e:scene.closestInRange(a);
    if(!target)return;
    if(cross)skillMark(scene,a,target.s,angle,12,'cross');
    scene.weaponStrike(a,target,power);
    if(power===1&&a.id===7&&a.q>=1&&target.hp<=0&&scene.mode==='fight'){
      const next=scene.closestInRange(a);
      if(next)scene.weaponStrike(a,next,.8);
    }
  };
  scene.weaponStrike(a,e,1,signature&&a.id===1);
  if(scene.mode!=='fight')return;
  if(a.id===7){
    if(a.q)followUp(scene,a,.07,()=>again(1));else again(1);
    if(signature)for(const delay of [.14,.21])followUp(scene,a,delay,()=>again(.65,true));
  }
  if(!a.q)return;
  const area=(delay,at,r,w,shape,power,kind,limit)=>followUp(scene,a,delay,()=>{
    skillArea(scene,a,e,at,angle,r,w,shape,power,kind,limit);
  });
  switch(a.id){
    case 0:
      if(a.q===1)followUp(scene,a,.1,()=>again(.55));
      else{
        area(.1,origin,range,1.1,'cone',signature?.8:.55,signature?'cross':'sweep',3);
        if(signature)area(.19,origin,range,1.1,'cone',.8,'cross',3);
      }
      break;
    case 1:
      if(a.q>=2)area(.11,origin,signature?range*1.6:range,6,'line',.5,'spear',signature?6:3+(scene.bondCounts[1]>=4?1:0));
      break;
    case 3:
      area(.12,origin,range,1.05,a.q>=2?'ring':'cone',.55,a.q>=2?'ring':'sweep');
      if(signature)area(.20,origin,range*1.4,.40,'cone',1,'crack');
      break;
    case 4:
      if(a.shots%2===0)followUp(scene,a,.1,()=>{
        const hits=skillArea(scene,a,e,origin,angle,range,1,'cone',.75,'sweep');
        for(const v of hits)if(v.hp>0&&!v.boss&&!v.elite)scene.move(v.s,Phaser.Math.Clamp(v.s.x+4*Math.cos(angle),10,950),Phaser.Math.Clamp(v.s.y+4*Math.sin(angle),24,592),4);
      });
      break;
    case 6:{
      const r=17*(a.q>=2?1.25:1);
      area(.14,center,r,0,'ring',signature?.65:.5,'ring');
      if(signature)area(.29,center,r*1.3,0,'ring',.85,'ring');
      break;
    }
    case 8:
      for(const v of areaTargets(scene,origin,angle,range,a.q>=2?1.40:1.05,'cone')){
        if(!v.boss&&!v.elite){
          const d=distance(origin,v.s)*.8;
          scene.move(v.s,origin.x+d*Math.cos(angle),origin.y+d*Math.sin(angle),6);
        }
      }
      area(.1,origin,range,6,'line',.5,'spear',a.q>=2?3:1);
      if(signature)area(.18,origin,range*1.5,.85,'cone',1.1,'moon');
      break;
  }
}
function startCavalryRush(scene,a,e){
  const origin=pointOf(a.s),angle=heading(origin,e.s);
  const signature=a.q===3&&a.shots%3===0,advance=signature?19:4;
  a.rush={x:Phaser.Math.Clamp(e.s.x+advance*Math.cos(angle),12,948),
    y:Phaser.Math.Clamp(e.s.y+advance*Math.sin(angle),24,584),origin,target:e,angle,
    signature,returning:false,trampled:new Set()};
}
function stepCavalryRush(scene,a,dt){
  const rush=a.rush,from=pointOf(a.s);
  scene.move(a.s,rush.x,rush.y,360*dt);
  scene.animateWalk(a,a.s.x-from.x,a.s.y-from.y,12);a.s.setDepth(a.s.y+1);
  if(a.q>=1){
    const angle=heading(from,a.s),len=distance(from,a.s);
    for(const e of areaTargets(scene,from,angle,len+1,6,'line')){
      if(rush.trampled.has(e))continue;
      rush.trampled.add(e);scene.mercHit(a,e,rush.target,rush.returning?.65:.6);
      if(scene.mode!=='fight')return;
    }
  }
  if(distance(a.s,rush)>1)return;
  if(!rush.returning){
    const target=scene.closestInRange(a);
    if(rush.signature){
      skillArea(scene,a,rush.target,pointOf(a.s),rush.angle,scene.bag[chargeStandard]?28.5:19,0,'ring',1.3,'ring');
    }else if(target&&distance(a.s,target.s)<22)scene.weaponStrike(a,target);
    if(a.q>=2&&scene.mode==='fight'){
      Object.assign(rush,rush.origin,{returning:true});rush.trampled.clear();return;
    }
  }
  a.rush=null;
}
