const stageOrder=['border','camp','pass','keep','pursuit'];
const keepTower={x:358,y:245};

function setupStage(scene){
 const key=scene.stageKey;
 scene.stageObjects=[];scene.stageTick=5;scene.stageEvent=0;
 const colors={border:0xfff4df,camp:0xffebd2,pass:0xe8f0d7,keep:0xe9e5e0,pursuit:0xffe7d9};
 scene.back.setTint(colors[key]);
 if(key!=='keep')return;

 // The active archer tower marks the source of the keep's volley.
 const {x,y}=keepTower;
 const g=scene.add.graphics().setPosition(x,y).setDepth(y);
 g.fillStyle(0x775631,.28).fillEllipse(-4,1,39,8);
 g.fillStyle(0x755436).fillRect(-11,-32,4,32).fillRect(9,-32,4,32);
 g.lineStyle(3,0x98714b).lineBetween(-9,-4,10,-26).lineBetween(10,-4,-9,-26);
 g.fillStyle(0xa67b4e).fillRect(-15,-35,31,11);
 g.fillStyle(0x8b4a33).fillTriangle(-19,-34,0,-49,19,-34);
 scene.stageObjects.push(g);
 scene.obstacles.push({x,y,rx:13,ry:5});
}
function clearStage(scene){
 for(const obj of scene.stageObjects??[])obj.destroy();
 scene.stageObjects=[];
 scene.obstacles.length=0;
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
 const tower=key==='keep',x=tower?keepTower.x:h.x-10,y=tower?keepTower.y:h.y;
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
