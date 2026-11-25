const $=id=>document.getElementById(id), roman=['Ⅰ','Ⅱ','Ⅲ','Ⅳ'];
// Calibrate the shared world scale against Rouge-main's 900-unit portrait view.
const portraitWorldWidth=270;
const referenceScale=portraitWorldWidth/900;
const startingSpeed=90;
const commanderAttackRange=63;
const troops=[['剑士',18,.8,31.5],['长枪兵',27,1.25,50],['长弓手',16,1.1,235*referenceScale],['斧兵',40,1.8,35]];
const itemIcons=['◆','♧','✦','➶','⚑'];
const items=[['粗磨刀石',0,'伤害 +8%',5],['行军靴',0,'移速 +6%',4],['斥候徽章',1,'幸运 +15',3],['穿甲箭袋',2,'小队伤害 +28%',2],['百战军旗',3,'生命上限 +60、伤害 +35%',1]];
const pick=a=>a[Math.floor(Math.random()*a.length)],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function tier(w,luck){let n=Math.random(),k=1+luck/100;
 return n<Math.min(.08,Math.max(0,w-7)*.0023*k)?3:n<Math.min(.25,Math.max(0,w-3)*.02*k)?2:n<Math.min(.6,Math.max(0,w-1)*.06*k)?1:0}
class Battle extends Phaser.Scene{
 preload(){
   for(const key of ['sand',...fieldProps.map(p=>p.key)])this.load.image(key,'assets/field/'+key+'.png');
 }
 create(){this.camp=new GreyCamp();$('camp').onclick=()=>this.camp.open(this);makeArt(this);this.footDust=this.add.group();prepareHitTextures(this);this.sfx=new CombatSound();placeField(this);this.mode='title';
 this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC');this.keys.ESC.on('down',()=>{if(!$('preferences').hidden)this.closeSettings();else this.pauseRun()});
 const fitViewport=()=>{
   const field=$('field'),width=field.clientWidth,height=field.clientHeight;
   if(!width||!height)return;
   // Fit a portrait combat view, revealing more terrain on the longer axis.
   // At the arena edges the finite background must still cover the canvas.
   const worldScale=Math.max(Math.min(width/portraitWorldWidth,height/480),width/960,height/600);
   const density=Math.min(window.devicePixelRatio||1,3,Math.sqrt(4000000/(width*height)));
   const pixelsW=Math.max(1,Math.round(width*density));
   const pixelsH=Math.max(1,Math.round(height*density));
   this.scale.resize(pixelsW,pixelsH);
   this.cameras.main.setSize(pixelsW,pixelsH).setZoom(worldScale*pixelsW/width,worldScale*pixelsH/height).setBounds(0,0,960,600).centerOn(this.hero?.x??480,this.hero?.y??300);
 };
 fitViewport();new ResizeObserver(fitViewport).observe($('field'));
 // Moving a desktop window between monitors can change DPR without resizing it.
 const watchDensity=()=>{
   matchMedia('(resolution: '+window.devicePixelRatio+'dppx)').addEventListener('change',()=>{
     fitViewport();watchDensity();
   },{once:true});
 };
 watchDensity();
 this.bindJoystick();
 const preferences=$('preferences');
 let previousMode;
 this.closeSettings=()=>{
   preferences.hidden=true;this.mode=previousMode;$('settings').setAttribute('aria-expanded','false');
   for(const id of ['modal','cover','pause'])$(id).inert=false;
   if(previousMode==='fight')this.tweens.resumeAll();
   $('settings').focus({preventScroll:true});
 };
 $('settings').onclick=()=>{
   if(!preferences.hidden){this.closeSettings();return}
   previousMode=this.mode;this.resetStick();this.mode='settings';preferences.hidden=false;
   if(previousMode==='fight')this.tweens.pauseAll();
   for(const id of ['modal','cover','pause'])$(id).inert=true;
   $('settings').setAttribute('aria-expanded','true');
   $('sound').focus({preventScroll:true});
 };
 $('settings-backdrop').onclick=()=>this.closeSettings();
 $('sound').onclick=()=>{
   this.sfx.muted=!this.sfx.muted;this.sfx.refreshGain();
   $('sound').textContent=this.sfx.muted?'声音：关':'声音：开';
   $('sound').setAttribute('aria-pressed',String(this.sfx.muted));
 };
 $('volume').oninput=()=>{this.sfx.volume=Number($('volume').value)/100;this.sfx.refreshGain()};
 const leaveRun=()=>{
   this.closeSettings();this.clearField();this.resetRun();this.hero=null;
   $('pause').setAttribute('aria-pressed','false');$('pause').setAttribute('aria-label','暂停');$('pause').title='暂停 / Esc';
   $('modal').hidden=true;$('wave').textContent='';this.mode='title';this.hud();
   this.cameras.main.centerOn(480,300);$('cover').hidden=false;
 };
 $('restart').onclick=()=>{leaveRun();this.startRun()};
 $('return-lobby').onclick=leaveRun;
 $('pause').onclick=()=>this.pauseRun();$('start').onclick=()=>this.startRun();this.resetRun();this.hud()}
 bindJoystick(){
   const surface=$('game'),pad=$('joystick'),knob=pad.firstElementChild;
   let finger=null,originX=0,originY=0;
   this.resetStick=()=>{
     const id=finger;finger=null;this.stickX=0;this.stickY=0;
     pad.hidden=true;knob.style.transform='';
     if(id!==null&&surface.hasPointerCapture(id))surface.releasePointerCapture(id);
   };
   this.resetStick();
   surface.addEventListener('pointerdown',e=>{
     if(this.mode!=='fight'||finger!==null||e.button!==0)return;
     e.preventDefault();finger=e.pointerId;originX=e.clientX;originY=e.clientY;
     const rect=surface.getBoundingClientRect();
     pad.hidden=false;
     const radius=pad.offsetWidth/2;
     pad.style.left=Phaser.Math.Clamp(originX-rect.left,radius,rect.width-radius)+'px';
     pad.style.top=Phaser.Math.Clamp(originY-rect.top,radius,rect.height-radius)+'px';
     surface.setPointerCapture(finger);
   });
   surface.addEventListener('pointermove',e=>{
     if(e.pointerId!==finger)return;
     const dx=e.clientX-originX,dy=e.clientY-originY,len=Math.hypot(dx,dy);
     const factor=Math.min(1,pad.offsetWidth*.32/(len||1));
     knob.style.transform='translate('+dx*factor+'px,'+dy*factor+'px)';
     this.stickX=len<6?0:dx/len;this.stickY=len<6?0:dy/len;
   });
   for(const event of ['pointerup','pointercancel','lostpointercapture'])
     surface.addEventListener(event,e=>{if(e.pointerId===finger)this.resetStick()});
   window.addEventListener('blur',this.resetStick);
   window.addEventListener('resize',this.resetStick);
   document.addEventListener('visibilitychange',this.resetStick);
 }
 resetRun(){Object.assign(this,{wave:1,earnedIron:0,eliteWins:[],hp:100+5*this.camp.level('vigor'),maxHP:100+5*this.camp.level('vigor'),gold:2*this.camp.level('supply'),kills:0,level:1,xp:0,pending:0,boxes:[],damage:1,speed:startingSpeed,luck:0,army:[],bag:items.map(()=>0),offers:[],enemies:[],drops:[],actors:[],cleared:0});}
 hud(){
 $('battle-hud').hidden=['title','camp'].includes(this.mode);
 $('experience').style.width=100*this.xp/this.need()+'%';
 for(const [id,value] of Object.entries({level:'Lv. '+this.level,money:this.gold}))$(id).textContent=value;
 $('life').style.width=100*this.hp/this.maxHP+'%';

}
 panel(title,desc){this.resetStick();$('cover').hidden=true;let m=$('modal');m.hidden=false;m.replaceChildren();m.scrollTop=0;let h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=desc;m.append(h,p);return m}
 button(parent,name,fn,disabled=false){let b=document.createElement('button');b.textContent=name;b.disabled=disabled;b.onclick=fn;parent.append(b);return b}
 startRun(){this.sfx.unlock();this.resetRun();$('cover').hidden=true;this.begin()}
 begin(){this.hitStop=0;this.nextImpactBeat=0;this.clearField();$('modal').hidden=true;this.mode='fight';this.timeLeft=30+5*(this.wave-1);this.spawnIn=.1;this.elapsed=0;this.invul=1;this.showInvulFade=false;this.dir=[1,0];this.hp=Math.min(this.maxHP,this.hp+15);
 this.actors=[{id:0,q:0,hero:true},...this.army].map((u,i)=>({...u,skin:u.hero?6:troopSkin(u.id,u.q),stride:0,cd:i*.12,s:this.add.image(480+i*12,300,'man'+(u.hero?6:troopSkin(u.id,u.q))).setOrigin(.5,.85).setScale((i?.5:.62)*2/3)}));
 this.hero=this.actors[0].s;this.cameras.main.centerOn(this.hero.x,this.hero.y);this.actors[0].skin=6;this.actors[0].stride=0;this.trail=[{x:360,y:300},{x:480,y:300}];this.actors.slice(1).forEach((unit,slot)=>{const pos=this.followPosition(slot);unit.s.setPosition(pos.x,pos.y)});if(this.wave===10)this.spawn(true);else if([4,8].includes(this.wave))this.spawn(false,true);this.hud()}
 clearField(){for(const prop of this.occluders)prop.image.setAlpha(1);this.showEnemyHealth(null);for(const enemy of this.enemies)enemy.footBar?.destroy();this.footDust.clear(true,true);for(let o of [...this.actors,...this.enemies,...this.drops])o.s.destroy();this.actors=[];this.enemies=[];this.drops=[]}
 spawn(boss=false,elite=false){let side=Math.floor(Math.random()*4),x=side<2?side*960:Math.random()*960,y=side<2?Math.random()*600:(side-2)*600;let type=Math.floor(Math.random()*3),hp=boss?1200:(13+this.wave*4+type*3)*(elite?5:1);if(this.camp.data.veteran)hp=Math.round(hp*1.25);
 const enemy={s:this.add.image(x,y,'man'+(3+type)).setOrigin(.5,.85).setScale((boss?1.15:elite?.8:.5)*2/3),skin:3+type,stride:Math.random(),hp,max:hp,boss,elite,speed:boss?42:31+type*8+this.wave*2};
 this.enemies.push(enemy);if(boss||elite){
   enemy.footBar=this.add.graphics().setDepth(1000);
   this.showEnemyHealth(enemy);
 }
 }
 positionFootBar(enemy){
   const sprite=enemy.s;
   enemy.footBar.setPosition(sprite.x,sprite.y+sprite.displayHeight*(1-sprite.originY)+2);
 }
 showEnemyHealth(enemy){
   if(enemy?.footBar){
     const width=enemy.boss?54:34;
     const remaining=Phaser.Math.Clamp(enemy.hp/enemy.max,0,1);
     enemy.footBar.clear().fillStyle(0x231818).fillRect(-width/2,0,width,6)
       .fillStyle(0xe65345).fillRect(1-width/2,1,(width-2)*remaining,4);
     this.positionFootBar(enemy);
   }
   const bar=$('enemy-health');bar.hidden=!enemy||enemy.hp<=0;
   if(bar.hidden)return;
   bar.querySelector('span').textContent=enemy.boss?'敌军统帅':'敌军精英';
   const meter=bar.querySelector('progress');meter.max=enemy.max;meter.value=enemy.hp;
 }
 walkEnemy(enemy,dt){
   const s=enemy.s, x=s.x,y=s.y;
   this.move(s,this.hero.x,this.hero.y,enemy.speed*dt);resolveFootprint(this,s,x,y,true);
   this.animateWalk(enemy,s.x-x,s.y-y,enemy.boss?48:22);
 }
 animateWalk(unit,dx,dy,stepLength){
   const s=unit.s,travel=Math.hypot(dx,dy);
   let key='man'+unit.skin;
   if(travel>.001){
     const next=unit.stride+travel/stepLength;
     if(Math.floor(next*2)>Math.floor(unit.stride*2)){
       this.footfall(unit,dx/travel,dy/travel,Math.floor(next*2)%2?1:-1);
     }
     unit.stride=next%1;
     key+='walk'+Math.floor(unit.stride*WALK_FRAMES);
     if(Math.abs(dx)>.001)s.setFlipX(dx<0);
   }
   if(s.texture.key!==key)s.setTexture(key);
 }
 footfall(unit,forwardX,forwardY,side){
   if(unit.dustPuff?.active)return;
   const size=Phaser.Math.Clamp(unit.s.displayHeight/64,.45,1.45),trail=8*size;
   const x=unit.s.x-trail*forwardX-3*forwardY*side;
   const y=unit.s.y-trail*forwardY+3*forwardX*side;
   const puff=this.add.container(x,y).setDepth(unit.s.y-1).setScale(size);
   const cloud=this.add.image(0,0,'dust-wisp').setScale(.43);
   const strand=this.add.image(0,1,'dust-wisp').setScale(.23).setAlpha(.78);
   cloud.setFlipX(forwardX<0);strand.setFlipX(forwardX<0);
   puff.add([cloud,strand]);unit.dustPuff=puff;this.footDust.add(puff);
   this.tweens.add({targets:puff,x:x-9*size*forwardX,y:y-size*(7*forwardY+5),
     alpha:0,duration:380,ease:'Sine.In',onUpdate:t=>{
       const spread=t.progress;
       strand.setPosition(-forwardX*10*spread,-forwardY*8*spread-2*spread);
       cloud.setScale(.43+.12*spread,.43+.035*spread);
     },onComplete:()=>{unit.dustPuff=null;puff.destroy()}});
 }
 move(s,x,y,len){let dx=x-s.x,dy=y-s.y,d=Math.hypot(dx,dy);if(d){s.x+=dx/d*Math.min(d,len);s.y+=dy/d*Math.min(d,len)}}
 recordTrail(){
   const last=this.trail[this.trail.length-1], gap=distance(this.hero,last);
   // Keep samples evenly spaced so movement speed and frame rate do not change the formation.
   for(let step=4;step<=gap;step+=4){
     this.trail.push({x:last.x+(this.hero.x-last.x)*step/gap,y:last.y+(this.hero.y-last.y)*step/gap});
   }
   if(this.trail.length>36)this.trail.splice(0,this.trail.length-36);
 }
 followPosition(slot){
   const row=Math.floor(slot/2), side=slot%2===0?-11:11;
   let remaining=22+row*18, front=this.hero;
   for(let i=this.trail.length-1;i>=0;i--){
     const back=this.trail[i], len=distance(front,back);
     if(len>=remaining){
       const dx=(front.x-back.x)/len,dy=(front.y-back.y)/len;
       return {x:Phaser.Math.Clamp(front.x-dx*remaining-dy*side,15,945),
               y:Phaser.Math.Clamp(front.y-dy*remaining+dx*side,33,590)};
     }
     remaining-=len;front=back;
   }
   return front;
 }
 follow(unit,slot,target,marching,dt){
   const anchor=this.followPosition(slot);
   const engage=!marching && target && unit.id!==2 && distance(target.s,this.hero)<105;
   const goal=engage?target.s:anchor, gap=distance(unit.s,goal);
   if(gap<.5){this.animateWalk(unit,0,0,35);return}
   const step=Math.min(dt*this.speed*1.65,gap*(1-Math.exp(-11*dt)));
   const oldX=unit.s.x,oldY=unit.s.y;
   this.move(unit.s,goal.x,goal.y,step);resolveFootprint(this,unit.s,oldX,oldY,true);
   this.animateWalk(unit,unit.s.x-oldX,unit.s.y-oldY,35);
 }
 weaponEffect(unit,enemy){
   const body=unit.s.height*(unit.hit?unit.hitBase:unit.s.scaleY);
   const x=unit.s.x,y=unit.s.y-body*.4;
   const targetHeight=enemy.s.height*(enemy.hit?enemy.hitBase:enemy.s.scaleY);
   const targetY=enemy.s.y-targetHeight*.4;
   const dx=enemy.s.x-x,dy=targetY-y;
   const angle=Math.atan2(dy,dx);
   const reach=Math.max(7,Math.hypot(dx,dy));
   const fx=this.add.graphics().setPosition(x,y).setRotation(angle).setDepth(1000);
   const rank=unit.hero?0:unit.q;
   const edge=[0xffecc5,0xc9e2de,0xe3ccef,0xffcf77][rank];
   if(unit.id===2){
     fx.setScale(body*.028);
     fx.lineStyle(2,0x795035).lineBetween(-13,0,0,0);
     fx.fillStyle(0xe6e0c7).fillTriangle(3,0,-2,-2,-2,2);
     fx.fillStyle(0xd6ae72).fillTriangle(-9,0,-15,-3,-13,0).fillTriangle(-9,0,-15,3,-13,0);
     if(rank){
       fx.fillStyle(edge,.85).fillTriangle(-8,-1.6,-19-rank*2,0,-8,1.6);
       if(rank>=2)fx.lineStyle(1.4,edge,.85).lineBetween(-11,-3,-19,-4).lineBetween(-11,3,-19,4);
       if(rank===3)fx.fillStyle(edge).fillTriangle(5,0,-3,-4,-1,0).fillTriangle(5,0,-1,0,-3,4);
     }
     this.tweens.add({targets:fx,x:x+dx,y:y+dy,duration:Math.max(65,reach*.75),onComplete:()=>fx.destroy()});
   }else if(unit.id===1){
     const length=body*.8, thrust=Math.min(reach,body*.35);
     fx.setPosition(enemy.s.x-thrust*Math.cos(angle),targetY-thrust*Math.sin(angle));
     fx.lineStyle(body*.065,0x9c7754).lineBetween(-length,0,-body*.2,0);
     fx.fillStyle(0xf3e9cb).fillTriangle(0,0,-body*.25,-body*.08,-body*.25,body*.08);
     if(rank){
       fx.fillStyle(edge,.85).fillTriangle(0,0,-length,-body*.05,-length,0);
       if(rank>=2)fx.lineStyle(body*.045,edge).lineBetween(-length,-body*.14,-length*.35,-body*.09);
       if(rank===3)fx.lineBetween(-length,body*.14,-length*.35,body*.09).fillStyle(edge).fillTriangle(body*.1,0,-body*.24,-body*.12,-body*.16,0);
     }
     this.tweens.add({targets:fx,x:enemy.s.x,y:targetY,duration:75,yoyo:true,onComplete:()=>fx.destroy()});
   }else{
     const axe=unit.id===3;
     const r=unit.hero?Phaser.Math.Clamp(reach*.8,10,24):body*(axe?.72:.54),arc=[];
     const thickness=unit.hero?2.6:body*(axe?.13:.075);
     const middle=r-thickness/2;
     fx.setPosition(enemy.s.x-middle*Math.cos(angle),targetY-middle*Math.sin(angle));
     for(let i=0;i<=14;i++){const t=-.65+i*1.3/14;arc.push({x:r*Math.cos(t),y:r*Math.sin(t)})}
     for(let i=14;i>=0;i--){const t=-.65+i*1.3/14,inner=r-thickness*Math.sin(i*Math.PI/14);arc.push({x:inner*Math.cos(t),y:inner*Math.sin(t)})}
     fx.fillStyle(edge,.9).fillPoints(arc,true);
     if(rank){
       const rim=r-thickness-body*.055;
       fx.lineStyle(body*.045,edge,.85).beginPath().arc(0,0,rim,-.52,.48).strokePath();
       if(rank>=2){
         if(axe)fx.fillStyle(edge).fillTriangle(r,-2,r+body*.22,0,r,2);
         else fx.lineStyle(body*.055,edge).lineBetween(r-body*.12,-body*.24,r+body*.1,body*.23);
       }
       if(rank===3){
         fx.lineStyle(body*.055,edge).lineBetween(r+2,-2,r+body*.25,-body*.24).lineBetween(r+2,2,r+body*.22,body*.16);
       }
     }
     const facing=fx.rotation;fx.rotation-=.55;
     this.tweens.add({targets:fx,rotation:facing+.45,alpha:0,duration:180,onComplete:()=>fx.destroy()});
   }
 }
 attack(a,e){
 if(a.hero){
   a.swingTime=.21;
   a.s.setFlipX(e.s.x<a.s.x).setTexture('commanderSwing0');
 }
 this.sfx.swing(a.id);this.weaponEffect(a,e);
 let allies=this.army.filter(u=>u.id===a.id).length;
 const critical=Math.random()<.05;
 const damage=(critical?1.5:1)*(a.hero?17:troops[a.id][1]*[1,1.32,1.72,2.22][a.q])*this.damage*(a.hero?1:1+.02*this.camp.level('arms'))*(a.hero?1:1+.13*Math.floor(allies/2));e.hp-=damage;if(e.elite||e.boss)this.showEnemyHealth(e);impact(this,a.s,e,damage,false,critical);
 if(e.hp<=0){e.footBar?.destroy();this.kills++;let {x,y}=e.s;const fallen=e.s;this.tweens.add({targets:fallen,alpha:0,duration:90,onComplete:()=>fallen.destroy()});this.enemies.splice(this.enemies.indexOf(e),1);
 if(e.boss){this.cleared=10;this.end(true);return}
 if(e.elite){this.earnedIron+=2;this.eliteWins.push(this.wave)}else if(e.skin===4&&this.kills%4===0)this.earnedIron++;
 const chest=e.elite||Math.random()<.006;
 const loot=chest?this.add.rectangle(x,y,12,9,0xf8c76a):this.add.image(x,y,'silver-coin').setScale(.62);
 this.drops.push({s:loot,chest,crateTier:e.elite?(this.wave>=8?3:2):undefined});
 if(Math.random()<.03){
   const pack=this.add.image(Phaser.Math.Clamp(x+12,8,952),Phaser.Math.Clamp(y,8,592),'field-dressing').setScale(.52);
   this.drops.push({s:pack,heal:15});
 }
 this.hud()}}
 update(_,ms){if(this.mode!=='fight')return;if(this.hitStop>0){this.hitStop-=ms;return}let dt=Math.min(ms/1000,.05),k=this.keys,h=this.hero;this.elapsed+=dt;this.timeLeft-=dt;this.invul-=dt;
 let x=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown),y=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
 if(!x&&!y){x=this.stickX;y=this.stickY}
 if(x||y)this.dir=[x/Math.hypot(x,y),y/Math.hypot(x,y)];
 const oldX=h.x,oldY=h.y;
 if(x||y){let v=dt*this.speed;h.x=Phaser.Math.Clamp(h.x+this.dir[0]*v,15,945);h.y=Phaser.Math.Clamp(h.y+this.dir[1]*v,33,590)}
 resolveFootprint(this,h,oldX,oldY);
 const commander=this.actors[0];
 if(commander.swingTime>0){
   commander.swingTime=Math.max(0,commander.swingTime-dt);
   const frame=Math.min(commanderSwingAngles.length-1,Math.floor((.21-commander.swingTime)/.03));
   h.setTexture('commanderSwing'+frame);
 }
 if(!commander.swingTime&&!commander.hit)this.animateWalk(commander,h.x-oldX,h.y-oldY,40);
 this.cameras.main.centerOn(h.x,h.y);this.recordTrail();
 advanceImpact(this.actors[0],dt);h.alpha=this.invul>0 && this.showInvulFade ? .72 : 1;this.spawnIn-=dt;if(this.spawnIn<=0&&this.enemies.length<90){this.spawn();this.spawnIn=Math.max(.24,.95-this.wave*.064)}
 for(let e of this.enemies){advanceImpact(e,dt);if(!e.hit)this.walkEnemy(e,dt);e.s.setDepth(e.s.y);if(e.footBar)this.positionFootBar(e);if(distance(e.s,h)<(e.boss?37:19)&&this.invul<=0){this.hp=Math.max(0,this.hp-(e.boss?22:7+this.wave));this.invul=.65;this.showInvulFade=true;impact(this,e.s,this.actors[0],e.boss?22:7+this.wave,true);this.hud();if(!this.hp){this.end(false);return}}}
 for(let [i,a] of this.actors.entries()){let target=null,d=Infinity;for(let e of this.enemies){let v=distance(a.s,e.s);if(v<d){target=e;d=v}}
 if(i)this.follow(a,i-1,target,x||y,dt);
 a.s.setDepth(a.s.y+1);a.cd-=dt;if(target&&d<(a.hero?commanderAttackRange:troops[a.id][3])&&a.cd<=0){this.attack(a,target);if(this.mode!=='fight')return;a.cd=troops[a.id][2]}}
 updatePropOpacity(this,dt);
 for(let drop of [...this.drops]){
   if(drop.heal&&this.hp>=this.maxHP)continue;
   const pullRadius=drop.chest?94:70*(1+.05*this.camp.level('sense'));
   if(distance(drop.s,h)<pullRadius)this.move(drop.s,h.x,h.y,dt*300);
   if(distance(drop.s,h)<17){this.collect(drop);this.drops.splice(this.drops.indexOf(drop),1);drop.s.destroy();this.hud()}}
 $('wave').textContent='第 '+this.wave+' / 10 波　 ·　'+(this.wave===10?'击败敌军统帅':Math.ceil(this.timeLeft)+' 秒');
 if(this.timeLeft<=0&&this.wave<10){this.cleared=this.wave;this.clearField();this.hud();this.mode='refit';this.refreshes=0;this.offers=this.offers.map(o=>o?.lock?o:null);this.reward()}}
 need(){return 5+this.level*2}
 collect(d){
   if(d.heal){this.hp=Math.min(this.maxHP,this.hp+d.heal);return}
   this.gold+=2;this.xp+=2;if(d.chest)this.boxes.push(d.crateTier??tier(this.wave,this.luck));while(this.xp>=this.need()){this.xp-=this.need();this.level++;this.pending++}}
 reward(){if(this.pending){let lv=this.level-this.pending+1,q=lv%5===0?(lv>=25?3:lv>=10?2:1):tier(lv,this.luck),n=q+1,m=this.panel('战后升级 · '+roman[q],'等级 '+lv+'　 /　剩余 '+this.pending+' 次强化');let options=[['体魄　生命 +'+10*n,()=>{this.maxHP+=10*n;this.hp+=10*n}],['力量　伤害 +'+8*n+'%',()=>this.damage+=.08*n],['步法　移速 +'+5*n,()=>this.speed+=5*n],['幸运　+'+8*n,()=>this.luck+=8*n]];
 const hand=document.createElement('div');hand.className='upgrade-hand';m.append(hand);
 const symbols=['♥','⚔','➶','♧'];
 Phaser.Utils.Array.Shuffle(options.map(([label,apply],i)=>({label,apply,symbol:symbols[i]}))).forEach(({label,apply,symbol},index)=>{
   const [name,effect]=label.split('　');
   const card=this.button(hand,'',()=>{apply();this.pending--;this.hud();this.reward()});
   card.className='upgrade-card';card.dataset.suit=name;card.style.setProperty('--delay',index*45+'ms');
   const icon=document.createElement('i'),title=document.createElement('strong'),value=document.createElement('span');
   icon.textContent=symbol;icon.setAttribute('aria-hidden','true');
   title.textContent=name;value.textContent=effect;card.append(icon,title,value);
 });
 return}
 if(this.boxes.length){
   const q=this.boxes.shift(),id=this.item(q);
   const m=this.panel('战利品宝箱',id<0?'该品质道具均已达到上限':items[id][0]+' '+roman[q]+' · '+items[id][2]);
   const icon=document.createElement('div'),actions=document.createElement('div');
   icon.className='loot-icon';icon.setAttribute('aria-hidden','true');
   icon.textContent=id<0?'🪙':itemIcons[id];
   m.querySelector('p').before(icon);
   actions.className='loot-actions';m.append(actions);
   if(id>=0)this.button(actions,'领取',()=>{this.applyItem(id);this.hud();this.reward()}).className='primary';
   this.button(actions,'回收 +8 银币',()=>{this.gold+=8;this.hud();this.reward()});
   return;
 }
 this.roll();this.shop()}
 item(q){return pick(items.map((it,i)=>it[1]===q&&this.bag[i]<it[3]?i:-1).filter(i=>i>=0))??-1}
 applyItem(id){this.bag[id]++;if(id===0)this.damage+=.08;if(id===1)this.speed*=1.06;if(id===2)this.luck+=15;if(id===3)this.damage+=.28;if(id===4){this.maxHP+=60;this.hp+=60;this.damage+=.35}}
 roll(){const pool=this.camp.data.axe?[0,1,2,3]:[0,1,2];let locked=this.offers.filter(o=>o?.lock),merc=locked.filter(o=>o.merc).length,gear=locked.length-merc;for(let i=0;i<4;i++){if(this.offers[i]?.lock)continue;let isMerc=this.wave<=2?(merc<2&&(gear>=2||Math.random()<.5)):this.wave<=5&&merc===0&&this.offers.slice(i+1).every(o=>o?.lock)&&i===3?true:Math.random()<.35;
 let q=tier(this.wave,this.luck),id=isMerc?pick([...pool,...this.army.map(a=>a.id)]):this.item(q);if(id<0){isMerc=true;id=pick(pool)}
 if(isMerc)merc++;else gear++;this.offers[i]={merc:isMerc,id,q,price:(isMerc?12:7)+q*9+this.wave,lock:false}}
 if(this.wave<=5&&!merc){let o=this.offers.find(o=>!o.lock);if(o)Object.assign(o,{merc:true,id:0,price:12+this.wave+o.q*9})}}
 shop(deal=true){this.hud();let m=this.panel('战地整备','第 '+this.wave+' 波已完成　 ·　军饷 '+this.gold+' 银币'),cards=document.createElement('div');cards.id='cards';cards.className=deal?'deal':'';m.append(cards);
 this.offers.forEach((o,i)=>{let c=document.createElement('div');cards.append(c);if(!o){c.textContent='已售出';return} const emblem=document.createElement('i'),name=document.createElement('strong'),detail=document.createElement('small');
 c.dataset.suit=o.merc?'佣兵':'道具';emblem.textContent=o.merc?['⚔','♜','➶','⚒'][o.id]:itemIcons[o.id];
 emblem.setAttribute('aria-hidden','true');
 name.textContent=(o.merc?troops[o.id][0]:items[o.id][0])+' '+roman[o.q];
 detail.textContent=o.merc?'佣兵':items[o.id][2];
 c.style.setProperty('--delay',i*45+'ms');c.classList.toggle('locked',o.lock);c.append(emblem,name,detail);const full=o.merc?this.army.length>=6:this.bag[o.id]>=items[o.id][3];
 const reason=full?(o.merc?'满编':'已满'):this.gold<o.price?'差 '+(o.price-this.gold)+' 银币':'';
 const price=document.createElement('span');
 price.className='offer-price';price.textContent=o.price+' 银币';c.append(price);
 const buy=this.button(c,'',()=>{if(this.offers[i]!==o)return;this.gold-=o.price;if(o.merc)this.army.push({id:o.id,q:o.q});else this.applyItem(o.id);this.offers[i]=null;this.shop(false)},Boolean(reason));buy.className='buy';buy.setAttribute('aria-label','购买'+name.textContent+'，'+o.price+'银币');buy.title=reason||buy.getAttribute('aria-label');this.button(c,o.lock?'解锁':'锁定',()=>{o.lock=!o.lock;this.shop(false)}).setAttribute('aria-pressed',String(o.lock))});
 const inventory=document.createElement('div');
 inventory.className='refit-inventory';
 for(const label of ['佣兵','道具']){
   const group=document.createElement('section'),heading=document.createElement('strong'),grid=document.createElement('div');
   heading.textContent=label;grid.className='refit-slots';
   if(label==='佣兵'){
     grid.setAttribute('aria-label',label);
     grid.classList.add('mercenary-slots');
     const actions=document.createElement('div');
     for(let i=0;i<6;i++){
       const unit=this.army[i];
       if(!unit){
         const empty=document.createElement('span');
         empty.setAttribute('aria-label','空位');grid.append(empty);continue;
       }
       const slot=this.button(grid,troops[unit.id][0]+roman[unit.q],()=>{
         const open=slot.getAttribute('aria-pressed')!=='true';
         for(const other of grid.querySelectorAll('button'))other.setAttribute('aria-pressed','false');
         actions.replaceChildren();
         if(!open)return;
         slot.setAttribute('aria-pressed','true');
         this.button(actions,'遣散',()=>{
           this.army.splice(i,1);this.shop(false);
         });
         const partner=this.army.findIndex(other=>other!==unit&&other.id===unit.id&&other.q===unit.q);
         const merge=this.button(actions,'合成',()=>{
           unit.q++;this.army.splice(partner,1);this.shop(false);
         },partner<0||unit.q>=3);
         merge.title=unit.q>=3?'已达最高品质':'需要两名同兵种、同品质佣兵';
       });
       const name=slot.textContent;
       const portrait=document.createElement('canvas');
       const source=this.textures.get('man'+troopSkin(unit.id,unit.q)).getSourceImage();
       portrait.width=source.width;portrait.height=source.height;
       portrait.getContext('2d').drawImage(source,0,0);
       portrait.setAttribute('aria-hidden','true');
       const rank=document.createElement('small');rank.textContent=roman[unit.q];
       slot.replaceChildren(portrait,rank);
       slot.title=name;slot.setAttribute('aria-label',name);
       slot.setAttribute('aria-pressed','false');
     }
     group.append(heading,grid,actions);inventory.append(group);continue;
   }else{
     this.bag.forEach((count,id)=>{
       if(!count)return;
       const slot=document.createElement('span');
       slot.textContent=items[id][0]+' ×'+count;slot.title=items[id][2];grid.append(slot);
     });
     if(!grid.childElementCount)grid.textContent='暂无道具';
   }
   group.append(heading,grid);inventory.append(group);
 }
 m.append(inventory);
 let cost=2+this.refreshes;this.button(m,'刷新 · '+cost,()=>{this.gold-=cost;this.refreshes++;this.roll();this.shop()},this.gold<cost);this.button(m,'下一波 →',()=>{this.wave++;this.begin()}).className='primary'}
 pauseRun(){
   const field=$('field'),modal=$('modal');
   if(this.mode==='paused'){
     this.mode='fight';field.classList.remove('pause-screen');modal.hidden=true;
     this.tweens.resumeAll();$('pause').focus();return;
   }
   if(this.mode!=='fight')return;
   this.resetStick();this.mode='paused';this.tweens.pauseAll();
   field.classList.add('pause-screen');modal.replaceChildren();modal.hidden=false;
   this.button(modal,'继续战斗',()=>this.pauseRun()).focus();
 }
 end(win){
   if(this.mode==='over')return;
   this.mode='over';this.clearField();this.hud();
   const reward=this.camp.settle(this,win);
   const m=this.panel(win?'突围成功':'灰旗倒下','完成 '+this.cleared+' 波　·　击破 '+this.kills+' 名敌军');
   const receipt=document.createElement('p');receipt.textContent=reward;m.append(receipt);
   this.button(m,'返回灰旗营地',()=>this.camp.open(this)).className='primary';
   this.button(m,'再次出征',()=>this.startRun());
 }
}
const game = new Phaser.Game({type:Phaser.CANVAS,loader:{imageLoadType:'HTMLImageElement'},parent:'game',width:960,height:600,pixelArt:false,audio:{noAudio:true},scene:Battle});
