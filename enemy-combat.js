const enemyMoves={
  bow:{reach:100,wind:.48,reload:1.65,speed:132,damage:5},
  bolt:{reach:112,wind:.82,reload:2.5,speed:181,damage:9},
  hammer:{reach:29,wind:.72,reload:1.35,radius:31,damage:12},
  volley:{reach:135,wind:.95,reload:2.3,speed:151,damage:14},
  rocks:{reach:115,wind:1.05,reload:2.6,radius:19,damage:18},
  cleave:{reach:53,wind:.83,reload:1.4,radius:59,damage:17}
};
function shieldFront(defender,source){
  const dx=source.x-defender.s.x,dy=source.y-defender.s.y;
  const facing=defender.facing??(defender.s.flipX?Math.PI:0);
  return dx*Math.cos(facing)+dy*Math.sin(facing)>=Math.hypot(dx,dy)*.5;
}
function shieldSpark(scene,s){
  const spark=scene.add.graphics().setPosition(s.x,s.y-8).setDepth(1030);
  spark.lineStyle(1.4,0xffe4a2).lineBetween(-4,-2,-7,-4).lineBetween(1,-4,2,-8).lineBetween(4,0,8,1);
  scene.tweens.add({targets:spark,alpha:0,duration:140,onComplete:()=>spark.destroy()});
}
function makeEnemyCast(scene,e){
  const move=enemyMoves[e.move],s=e.s,h=scene.hero;
  const angle=Math.atan2(h.y-s.y,h.x-s.x),directions=e.move==='volley'?[angle-.24,angle,angle+.24]:[angle];
  const marks=e.move==='rocks'?[-1,0,1].map(i=>({x:h.x-i*34*Math.sin(angle),y:h.y+i*34*Math.cos(angle)})):[{x:s.x,y:s.y}];
  const g=scene.add.graphics().setDepth(s.y-2);
  g.fillStyle(0xb4422d,.2).lineStyle(1.4,0xffb170,.9);
  if(move.speed){
    if(e.move!=='bow')for(const dir of directions)g.lineBetween(s.x,s.y,s.x+Math.cos(dir)*(move.reach+18),s.y+Math.sin(dir)*(move.reach+18));
  }else if(e.move==='cleave'){
    g.beginPath().moveTo(s.x,s.y).arc(s.x,s.y,move.radius,angle-1.05,angle+1.05).closePath().fillPath().strokePath();
  }else{
    for(const m of marks)g.fillCircle(m.x,m.y,move.radius).strokeCircle(m.x,m.y,move.radius);
  }
  const stones=e.move==='rocks'?scene.add.graphics().setDepth(999):null;
  e.facing=angle;s.setFlipX(Math.cos(angle)<0);
  return {x:s.x,y:s.y,angle,directions,marks,g,stones,aimRange:Math.max(1,distance(s,h)),left:move.wind};
}
function stepEnemyMove(scene,e,dt){
  const move=enemyMoves[e.move];
  e.reload=Math.max(0,e.reload-dt);
  if(!e.cast){
    const gap=distance(e.s,scene.hero);
    if(gap>move.reach)return false;
    if(e.reload>0)return true;
    scene.animateWalk(e,0,0,32);
    e.cast=makeEnemyCast(scene,e);
  }
  const cast=e.cast;
  cast.left-=dt;
  if(cast.stones){
    cast.stones.clear();
    const height=50*Math.max(0,cast.left)/move.wind;
    for(const m of cast.marks){
      cast.stones.fillStyle(0x82674f).fillCircle(m.x,m.y-height,5);
      cast.stones.fillStyle(0xc29b74).fillEllipse(m.x-1,m.y-height-2,6,3);
    }
  }
  cast.g.setAlpha(.62+.38*Math.abs(Math.sin(9*cast.left)));
  e.s.setAngle((e.s.flipX?-1:1)*(move.speed?4:10)*(1-Math.max(0,cast.left)/move.wind));
  if(cast.left>0)return true;
  cast.stones?.destroy();
  e.cast=null;e.reload=move.reload;e.s.setAngle(0);
  const damage=move.damage+scene.wave;
  if(move.speed){
    cast.g.destroy();
    for(const dir of cast.directions){
      const g=scene.add.graphics().setPosition(cast.x,cast.y-6).setRotation(dir).setDepth(995);
      g.lineStyle(e.move==='bolt'?2:1.4,0x634632).lineBetween(-7,0,0,0);
      g.fillStyle(0xffe0ab).fillTriangle(3,0,-1,-1.7,-1,1.7);
      const range=e.move==='bow'?cast.aimRange:move.reach+18;
      const shot={g,x:cast.x,y:cast.y,dx:Math.cos(dir),dy:Math.sin(dir),left:range,range,
        peak:e.move==='bow'?Math.min(25,range*.28):0,speed:move.speed,damage};
      if(e.move==='bow')shot.trail=scene.add.graphics().setDepth(994);
      positionHostileShot(shot);
      scene.hostileShots.push(shot);
    }
  }else{
    cast.g.setAlpha(1);
    scene.tweens.add({targets:cast.g,alpha:0,duration:160,onComplete:()=>cast.g.destroy()});
    const h=scene.hero;
    const inside=cast.marks.some(m=>distance(h,m)<=move.radius);
    const dir=Math.atan2(h.y-cast.y,h.x-cast.x);
    if(inside&&(e.move!=='cleave'||Math.cos(dir-cast.angle)>=Math.cos(1.05)))scene.enemyHit(cast,damage);
  }
  return true;
}
function positionHostileShot(shot){
  const t=1-shot.left/shot.range;
  const height=4*shot.peak*t*(1-t);
  const slope=4*shot.peak*(1-2*t)/shot.range;
  shot.g.setPosition(shot.x,shot.y-6-height).setRotation(Math.atan2(shot.dy-slope,shot.dx));
  if(!shot.trail)return;
  const trail=shot.trail.clear(),flown=shot.range-shot.left;
  const length=Math.min(flown,shot.speed*.15);
  let x=shot.x,y=shot.y-6-height;
  for(let i=1;i<=6&&length>0;i++){
    const back=length*i/6,u=(flown-back)/shot.range;
    const px=shot.x-back*shot.dx,py=shot.y-back*shot.dy-6-4*shot.peak*u*(1-u);
    const fade=(7-i)/6;
    trail.lineStyle(2.4*fade,0xb66c38,.58*fade).lineBetween(x,y,px,py);
    trail.lineStyle(1.2*fade,0xffe4a6,.92*fade).lineBetween(x,y,px,py);
    x=px;y=py;
  }
}
function stepHostileShots(scene,dt){
  for(let i=scene.hostileShots.length-1;i>=0;i--){
    const shot=scene.hostileShots[i],travel=Math.min(shot.left,shot.speed*dt);
    let first=Infinity,blocked=null;
    for(const unit of scene.actors){
      if(!unit.hero&&(unit.id!==4||!shieldFront(unit,shot)))continue;
      const x=unit.s.x-shot.x,y=unit.s.y-shot.y;
      const along=x*shot.dx+y*shot.dy,side=x*shot.dy-y*shot.dx,r=unit.hero?6:9;
      if(Math.abs(side)>r)continue;
      const span=Math.sqrt(r*r-side*side),exit=Math.min(travel,along+span);
      let entry=Math.max(0,along-span);
      // Above shoulder height the arrow can pass over a unit, even across a long frame.
      const clearance=unit.s.displayHeight*.7-6;
      if(shot.peak>0&&shot.peak>clearance){
        const lowEnd=shot.range*(1-Math.sqrt(1-Math.max(0,clearance)/shot.peak))/2;
        const flown=shot.range-shot.left;
        if(flown+entry>lowEnd)entry=Math.max(entry,shot.range-lowEnd-flown);
      }
      if(entry<=exit&&entry<first){first=entry;blocked=unit}
    }
    const step=blocked?first:travel;
    shot.x+=shot.dx*step;shot.y+=shot.dy*step;shot.left-=step;
    positionHostileShot(shot);
    if(!blocked&&shot.left>0)continue;
    shot.trail?.destroy();shot.g.destroy();scene.hostileShots.splice(i,1);
    if(blocked?.hero){scene.enemyHit({x:shot.x-shot.dx*8,y:shot.y-shot.dy*8},shot.damage);if(scene.mode!=='fight')return}
    else if(blocked)shieldSpark(scene,blocked.s);
  }
}
