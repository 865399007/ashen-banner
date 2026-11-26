// Coordinates are world-space landmark centres. The middle remains open for combat.
const stageOrder=['border','camp','pass','keep','pursuit'];
const stageScenery={
 border:[['cart',630,388],['tree',720,165]],
 camp:[['tent',348,201],['tower',650,250],['tent',560,423]],
 pass:[['boulder',325,215],['tree',585,182],['boulder',620,385],['tree',380,406]],
 keep:[['tower',358,245],['wall',655,225],['wall',580,408]],
 pursuit:[['wall',335,230],['standard',610,240],['wall',625,400],['standard',400,404]]
};
function drawLandmark(scene,key,x,y){
 const g=scene.add.graphics().setPosition(x,y).setDepth(y);
 const poly=(color,points)=>g.fillStyle(color).fillPoints(points.map(([x,y])=>({x,y})),true);
 g.fillStyle(0x775631,.28).fillEllipse(-4,1,39,8);
 if(key==='tower'){
   g.fillStyle(0x755436).fillRect(-11,-32,4,32).fillRect(9,-32,4,32);
   g.lineStyle(3,0x98714b).lineBetween(-9,-4,10,-26).lineBetween(10,-4,-9,-26);
   g.fillStyle(0xa67b4e).fillRect(-15,-35,31,11);
   poly(0x8b4a33,[[-19,-34],[0,-49],[19,-34]]);
 }else{
   g.fillStyle(0x775334).fillRect(-1,-34,3,35);
   poly(0x9d4436,[[1,-32],[19,-29],[16,-21],[19,-16],[1,-19]]);
   g.fillStyle(0xe9c58a).fillRect(6,-28,2,9).fillRect(3,-25,8,2);
 }
 return g;
}
function setupStage(scene){
 const key=scene.stageKey;
 scene.stageObjects=[];scene.stageTick=5;scene.stageEvent=0;
 const colors={border:0xffeac6,camp:0xf7d8af,pass:0xcdd7b7,keep:0xdacfc5,pursuit:0xe7c8b2};
 scene.back.setTint(colors[key]);
 scene.stageObstacleStart=scene.obstacles.length;scene.stageOccluderStart=scene.occluders.length;
 for(const [kind,x,y] of stageScenery[key]){
   let image;
   if(fieldCoverage[kind]){
     image=scene.add.image(x,y,kind).setOrigin(0).setScale(fieldScaleX,fieldScaleY);
     image.x-=image.displayWidth/2;image.y-=image.displayHeight*.85;image.setDepth(y);
     scene.occluders.push({image,mask:atob(fieldCoverage[kind]),columns:Math.ceil(image.width/4)});
   }else image=drawLandmark(scene,kind,x,y);
   scene.stageObjects.push(image);
   scene.obstacles.push({x,y,rx:kind==='standard'?3:13,ry:5});
 }

}
function clearStage(scene){
 for(const obj of scene.stageObjects??[])obj.destroy();
 scene.stageObjects=[];
 if(scene.stageObstacleStart!==undefined){
   scene.obstacles.length=scene.stageObstacleStart;scene.occluders.length=scene.stageOccluderStart;
 }
 const cast=scene.stageCaster?.cast;cast?.stones?.destroy();cast?.g.destroy();
 scene.stageCaster?.s.destroy();scene.stageCaster=null;scene.fire=null;
}
function stepStage(scene,dt){
 const key=scene.stageKey,h=scene.hero;
 if(scene.wave<=3&&key!=='camp'&&key!=='pursuit')return;
 if(scene.stageCaster){
   const caster=scene.stageCaster;
   stepEnemyMove(scene,caster,dt);
   if(!caster.cast){scene.stageCaster=null;caster.s.destroy()}
   return;
 }
 scene.stageTick-=dt;
 if(scene.stageTick>0)return;
 scene.stageEvent++;scene.stageTick=key==='camp'||key==='pursuit'?14:8;
 if(key==='camp'||key==='pursuit'){
   const guards=key==='pursuit';
   const label=scene.add.text(h.x,h.y-48,guards?'王城卫队':'警报 · 增援',{fontSize:'10px',color:'#fff0ca',stroke:'#704632',strokeThickness:2}).setOrigin(.5).setDepth(990);
   scene.tweens.add({targets:label,y:label.y-8,alpha:0,duration:1100,onComplete:()=>label.destroy()});
   for(let i=0;i<(guards?2:3)&&scene.enemies.length<90;i++)scene.spawn(false,false,guards?[10,13][i]:null);
   return;
 }
 if(key==='border'){
   const x=h.x,y=h.y,g=scene.add.graphics().setPosition(x,y).setDepth(y-2);
   scene.stageObjects.push(g);
   scene.fire={x,y,g,life:4};
   return;
 }
 const tower=key==='keep',x=tower?358:h.x-10,y=tower?245:h.y;
 // Towers fire from their actual platform, only while the commander is in range.
 if(tower&&Math.hypot(h.x-x,h.y-y)>enemyMoves.volley.reach){scene.stageTick=.5;return}
 const s=scene.add.image(x,y,tower?'man5':'man14').setScale(.25).setVisible(tower).setDepth(y+1);
 const caster={s,skin:tower?5:14,move:tower?'volley':'rocks',reload:0,stride:0};
 scene.stageCaster=caster;stepEnemyMove(scene,caster,dt);
}
function stepStageFire(scene,dt){
 const f=scene.fire;if(!f)return;
 f.life-=dt;const active=f.life<3;
 f.g.clear().fillStyle(0xbc5c28,active?.4:.16).fillRoundedRect(-31,-8,62,16,6);
 f.g.lineStyle(1,0xffbe6d,.9).strokeRoundedRect(-31,-8,62,16,6);
 if(active){
   for(let i=-2;i<=2;i++)f.g.fillStyle(0xffb54b,.8).fillTriangle(i*11-3,2,i*11+2,-5-3*Math.sin(f.life*8+i),i*11+4,2);
   if(Math.abs(scene.hero.x-f.x)<31&&Math.abs(scene.hero.y-f.y)<8)scene.enemyHit(f,6+scene.wave);
 }
 if(f.life<=0&&scene.fire){scene.stageObjects.splice(scene.stageObjects.indexOf(f.g),1);f.g.destroy();scene.fire=null}
}
