class Battle extends Phaser.Scene{
 preload(){
   for(const key of ['sand',...fieldProps.map(p=>p.key)])this.load.image(key,'assets/field/'+key+'.png');
 }
 create(){
 this.camp=new GreyCamp();
 for(const [id,entries] of [['hero-choice',commanders],['campaign-choice',campaigns]]){
   for(const [key,entry] of (id==='campaign-choice'?stageOrder.map(key=>[key,entries[key]]):Object.entries(entries)))$(id).add(new Option(entry.name,key));
 }
 const selectLoadout=()=>{
 this.commander=commanders[$('hero-choice').value];
 this.stageKey=$('campaign-choice').value;this.campaign=campaigns[this.stageKey];
 $('campaign-brief').textContent=this.campaign.brief;
 $('commander-passives').replaceChildren();
 for(const passive of this.commander.passives){
   const line=document.createElement('div');
   line.textContent=passive.name+' · '+passive.description;
   $('commander-passives').append(line);
 }
 };
 $('hero-choice').onchange=$('campaign-choice').onchange=selectLoadout;selectLoadout();
 this.syncStages();
 for(const [name,key] of [['训练场','training'],['指挥帐篷','command'],['铁匠铺','forge'],['军需帐篷','supply'],['军械库','armory']]){
   const button=this.button($('camp-buildings'),name,()=>this.camp.open(this,name));
   const image=document.createElement('img');image.alt='';image.src='assets/camp/'+key+'.webp';
   button.prepend(image);
 }
 makeArt(this);this.footDust=this.add.group();prepareHitTextures(this);this.sfx=new CombatSound();placeField(this);this.mode='title';
 this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC');this.keys.ESC.on('down',()=>{if(!$('preferences').hidden)this.closeSettings();else this.pauseRun()});
 window.addEventListener('keydown',event=>{
   if(event.code!=='Space'||(this.mode!=='fight'&&this.mode!=='paused'))return;
   event.preventDefault();
   if(!event.repeat)this.pauseRun();
 });
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
 this.bindJoystick();installCoop(this);
 troops.forEach(([name],id)=>{
   const btn=this.button($('test-army'),name,()=>{
     if(this.mode!=='fight')return;
     this.army=Array.from({length:6},()=>({id,q:3}));
     this.deployMercenaries();this.hud();
   });
   btn.title='测试：6 名Ⅳ阶'+name;
 });
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
     if(!['fight','coopFight'].includes(this.mode)||finger!==null||e.button!==0)return;
     if(e.pointerType==='mouse')e.preventDefault();
     finger=e.pointerId;originX=e.clientX;originY=e.clientY;
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
 resetRun(){Object.assign(this,{wave:1,flagKills:0,earnedIron:0,eliteWins:[],hp:100+5*this.camp.level('vigor'),maxHP:100+5*this.camp.level('vigor'),gold:2*this.camp.level('supply'),kills:0,level:1,xp:0,pending:0,upgradeRefreshes:0,mercHaste:0,critBonus:0,armor:0,boxes:[],damage:1,speed:startingSpeed+this.commander.passives.reduce((v,p)=>v+(p.speedBonus??0),0),luck:0,army:[],bag:items.map(()=>0),offers:[],enemies:[],drops:[],actors:[],cleared:0});}
 hud(){
   if(this.mode==='title')$('camp-wallet').textContent='银币 '+this.camp.data.silver+'　·　铁料 '+this.camp.data.iron+'　·　军功章 '+this.camp.data.medals;
   $('field').classList.toggle('low-health',this.mode==='fight'&&this.hp>0&&this.hp<=this.maxHP*.25);
 $('battle-hud').hidden=['title','camp'].includes(this.mode);
 $('experience').style.width=100*this.xp/this.need()+'%';
 for(const [id,value] of Object.entries({level:'Lv. '+this.level,money:this.gold}))$(id).textContent=value;
 $('life').style.width=100*this.hp/this.maxHP+'%';

}
 panel(title,desc){this.resetStick();$('cover').hidden=true;let m=$('modal');m.hidden=false;m.replaceChildren();m.scrollTop=0;let h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=desc;m.append(h,p);return m}
 button(parent,name,fn,disabled=false){let b=document.createElement('button');b.textContent=name;b.disabled=disabled;b.onclick=fn;parent.append(b);return b}
 syncStages(){
   for(const option of $('campaign-choice').options){
     const open=this.camp.stageOpen(option.value);
     option.disabled=!open;option.textContent=campaigns[option.value].name+(open?'':' · 未解锁');
   }
 }
 startRun(){if(!this.camp.stageOpen(this.stageKey))return;this.sfx.unlock();this.resetRun();$('cover').hidden=true;this.begin()}
 begin(){this.ordinarySpawns=0;this.healDropsRemaining=Phaser.Math.Between(2,3);this.hitStop=0;this.nextImpactBeat=0;this.clearField();$('modal').hidden=true;this.mode='fight';this.timeLeft=30+5*(this.wave-1);this.spawnIn=.1;this.elapsed=0;this.invul=1;this.showInvulFade=false;this.dir=[1,0];this.lastStandSpent=false;this.hp=Math.min(this.maxHP,this.hp+15+6*this.bag[bandage]);
 this.actors=[this.createActor({id:this.commander.weapon,q:0,hero:true},0)];
 this.hero=this.actors[0].s;
 setupStage(this);this.flagUntil=0;this.bountyTaken=false;
 this.deployMercenaries();
 this.cameras.main.centerOn(this.hero.x,this.hero.y);
 if(this.wave===finalWave)this.spawn(true);else if(this.campaign.elites.includes(this.wave))this.spawn(false,true);
 this.hud()
 }
 createActor(unit,index){
   const skin=unit.hero?this.commander.skin:troopSkin(unit.id,unit.q);
   const s=this.add.image(480,300,'man'+skin).setOrigin(.5,.85).setScale((unit.hero?.62:.5)*2/3);
   return {...unit,skin,stride:0,shots:0,cd:index*.12,s};
 }
 deployMercenaries(){
   for(const unit of this.actors.splice(1))unit.s.destroy();
   this.bondCounts=troops.map((_,id)=>this.army.filter(unit=>unit.id===id).length);
   this.swordHits=0;this.volleyIn=8*(1-.12*this.bag[11]);
   this.army.forEach((unit,i)=>this.actors.push(this.createActor(unit,i+1)));
   this.soulImage?.destroy();this.soulImage=null;
 this.soul=armySoul(this.army);
 if(this.soul){
   this.soulStrike=0;
   const {id,count}=this.soul,key='soul-'+id;
   const skin=mercSkins[id];
   const ink=getComputedStyle(document.documentElement).getPropertyValue('--tier-3').trim();
   const poses=id===2?[0,.4,.85,1,-.35,-.1,0]:[0,-.22,-.42,.35,1,.55,0];
   poses.forEach((pose,frame)=>{
     const frameKey=key+'-'+frame;
     if(this.textures.exists(frameKey))return;
     paintTexture(this,frameKey,120,112,(ctx,polygon)=>{
       ctx.save();ctx.translate(24,16);ctx.scale(2,2);
       miniature(ctx,polygon,skin,0,3,ink,pose);
       ctx.restore();
       const pixels=ctx.getImageData(0,0,120,112);
       const rgba=pixels.data;
       // Map the original shading to navy shadows, azure midtones and ice-blue highlights.
       const palette=[[30,94,135],[84,185,244],[177,224,251]];
       for(let i=0;i<rgba.length;i+=4){
         const light=Math.min(1,(rgba[i]*.30+rgba[i+1]*.59+rgba[i+2]*.11)/220);
         const band=light<.5?0:1,blend=light*2-band;
         for(let channel=0;channel<3;channel++){
           rgba[i+channel]=palette[band][channel]*(1-blend)+palette[band+1][channel]*blend;
         }
       }
       ctx.putImageData(pixels,0,0);
     });
   });
   this.soulImage=this.add.image(this.hero.x,this.hero.y-12,key+'-0').setOrigin(.5,84/112)
     .setScale(.68+.045*(count-4)).setAlpha(0.75).setDepth(this.hero.y-1);
 }
 this.actors.slice(1).forEach((unit,slot)=>{
   const pos=this.followPosition(slot);
   unit.s.setPosition(pos.x,pos.y);
   const variation=(slot*.618+Math.random()*.08)%1;
   unit.stride=(variation+.25)%1;
   unit.stepLength=32+variation*7;
   unit.reaction=.025+variation*.16;
   unit.followResponse=10+variation*4;
   unit.followGoal=pos;
   unit.goalHistory=[];
 });
   Array.from($('test-army').children).forEach((btn,id)=>btn.setAttribute('aria-pressed',String(this.soul?.count===6&&this.soul.id===id)));
 }
 clearField(){clearStage(this);for(const shot of this.hostileShots??[]){shot.trail?.destroy();shot.g.destroy()}this.hostileShots=[];this.soulImage?.destroy();this.soulImage=null;this.soul=null;$('field').classList.remove('low-health');for(const prop of this.occluders)prop.image.setAlpha(1);for(const enemy of this.enemies){enemy.cast?.stones?.destroy();enemy.cast?.g.destroy();enemy.footBar?.destroy();}this.footDust.clear(true,true);for(let o of [...this.actors,...this.enemies,...this.drops])o.s.destroy();this.actors=[];this.enemies=[];this.drops=[]}
 spawn(boss=false,elite=false,forcedSkin=null){
   const camera=this.cameras.main;
   const width=Math.min(960,camera.width/camera.zoomX),height=Math.min(600,camera.height/camera.zoomY);
   const left=Phaser.Math.Clamp(this.hero.x-width/2,0,960-width);
   const top=Phaser.Math.Clamp(this.hero.y-height/2,0,600-height);
   const margin=boss?56:elite?40:26;
   const alongX=left+Math.random()*width,alongY=top+Math.random()*height;
   const edges=[[left-margin,alongY],[left+width+margin,alongY],
                [alongX,top-margin],[alongX,top+height+margin]];
   const inside=edges.filter(([x,y])=>x>=0&&x<=960&&y>=0&&y<=600);
   const [x,y]=pick(inside.length?inside:edges);
   const mounted=!boss&&!elite&&++this.ordinarySpawns%8===5;
   const type=mounted?3:Math.floor(Math.random()*3);
   // Alternate infantry reinforcements with the existing patrols.
   const reinforcement=!boss&&!elite&&this.ordinarySpawns%2===0;
   const variant=(this.ordinarySpawns/2-1)%8;
   const villageSkin=this.stageKey==='border'&&!boss&&!elite?villageEnemy(this.wave):null;
   const skin=forcedSkin??villageSkin??(boss?this.campaign.bossSkin:reinforcement&&variant===7&&this.wave>=2&&this.ordinarySpawns%32===16?23:reinforcement?9+variant:mounted?8:3+type);
   const infantry=skin>=9&&skin<=16?skin-9:-1;
   const baseType=skin>=3&&skin<=5?skin-3:skin===8?3:type;
   const pace=infantry>=0?[47,24,33,58,29,38,32,54][infantry]:skin===23?54:31+baseType*8;
   const toughness=infantry>=0?[2,15,7,-2,12,6,9,0][infantry]:skin===23?9:baseType*3;
   let hp=boss?this.campaign.bossHP:(13+this.wave*4+toughness)*(elite?5:1);if(this.camp.data.veteran)hp=Math.round(hp*1.25);
 const enemy={s:this.add.image(x,y,'man'+skin).setOrigin(.5,.85).setScale((boss?1.15:elite?.8:.5)*2/3),skin,stride:Math.random(),hp,max:hp,boss,elite,speed:(boss?42:pace+this.wave*2)*this.campaign.march};
 enemy.move=boss?this.campaign.bossMove:({5:'bow',23:'bolt',13:'hammer',14:'hammer',15:'hammer'})[skin];
 enemy.reload=.25+Math.random()*.55;
 if(skin===8)enemy.charge={phase:"ready",remaining:.45};
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
   const width=enemy.boss?54:34;
   const fill=(width-2)*Phaser.Math.Clamp(enemy.hp/enemy.max,0,1);
   const bar=enemy.footBar;
   bar.clear().fillStyle(0x231818).fillRoundedRect(-width/2,0,width,6,3);
   if(fill>0)bar.fillStyle(0xe65345).fillRoundedRect(1-width/2,1,fill,4,Math.min(2,fill/2));
   this.positionFootBar(enemy);
 }
 advanceCharge(enemy,dt){
   const charge=enemy.charge,s=enemy.s;
   charge.remaining-=dt;
   if(charge.phase==='ready'){
     const gap=distance(s,this.hero);
     if(charge.remaining>0||gap<28||gap>56)return false;
     const dx=(this.hero.x-s.x)/gap,dy=(this.hero.y-s.y)/gap;
     charge.x=Phaser.Math.Clamp(s.x+dx*Math.min(56,gap+8),0,960);
     charge.y=Phaser.Math.Clamp(s.y+dy*Math.min(56,gap+8),0,600);
     charge.phase='aim';charge.remaining=.55;
     s.setFlipX(dx<0).setAngle(dx<0?-8:8);
   }else if(charge.phase==='aim'&&charge.remaining<=0){
     charge.phase='dash';s.setAngle(0);
   }else if(charge.phase==='dash'){
     const x=s.x,y=s.y;
     this.move(s,charge.x,charge.y,dt*290);
     this.animateWalk(enemy,s.x-x,s.y-y,20);
     if(Math.hypot(s.x-charge.x,s.y-charge.y)<.1){
       charge.phase='recover';charge.remaining=.45;
       this.animateWalk(enemy,0,0,30);
     }
   }else if(charge.phase==='recover'&&charge.remaining<=0){
     charge.phase='ready';charge.remaining=3;
   }
   return true;
 }
 walkEnemy(enemy,dt){
   if(enemy.move&&stepEnemyMove(this,enemy,dt))return;
   if(enemy.charge&&this.advanceCharge(enemy,dt))return;
   const s=enemy.s, x=s.x,y=s.y;
   enemy.facing=Math.atan2(this.hero.y-y,this.hero.x-x);
   this.move(s,this.hero.x,this.hero.y,enemy.speed*dt);
   if(enemy.elite||enemy.boss)resolveFootprint(this,s,x,y,true);
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
   const sprint=unit.rush||unit.charge?.phase==='dash';
   if(!sprint&&unit.dustPuff?.active)return;
   const size=Phaser.Math.Clamp(unit.s.displayHeight/64,.45,1.45),trail=8*size;
   const x=unit.s.x-trail*forwardX-3*forwardY*side;
   const y=unit.s.y-trail*forwardY+3*forwardX*side;
   const puff=this.add.container(x,y).setDepth(unit.s.y-1).setScale(size);
   const cloud=this.add.image(0,0,'dust-wisp').setScale(.43);
   const strand=this.add.image(0,1,'dust-wisp').setScale(.23).setAlpha(.78);
   cloud.setFlipX(forwardX<0);strand.setFlipX(forwardX<0);
   puff.add([cloud,strand]);if(!sprint)unit.dustPuff=puff;this.footDust.add(puff);
   this.tweens.add({targets:puff,x:x-(sprint?25:9)*size*forwardX,y:y-size*((sprint?25:7)*forwardY+5),
     alpha:0,duration:sprint?580:380,ease:'Sine.In',onUpdate:t=>{
       const spread=t.progress;
       strand.setPosition(-forwardX*10*spread,-forwardY*8*spread-2*spread);
       cloud.setScale(.43+.12*spread,.43+.035*spread);
     },onComplete:()=>{if(unit.dustPuff===puff)unit.dustPuff=null;puff.destroy()}});
 }
 move(s,x,y,len){let dx=x-s.x,dy=y-s.y,d=Math.hypot(dx,dy);if(d){s.x+=dx/d*Math.min(d,len);s.y+=dy/d*Math.min(d,len)}}
 followPosition(slot){
   const count=this.actors.length-1;
   const radius=34;
   const angle=Math.PI+slot*2*Math.PI/count;
   const centerX=Phaser.Math.Clamp(this.hero.x,15+radius,945-radius);
   const centerY=Phaser.Math.Clamp(this.hero.y,33+radius,590-radius);
   return {x:centerX+Math.cos(angle)*radius,y:centerY+Math.sin(angle)*radius};
 }
 follow(unit,slot,target,marching,dt){
   const engage=!marching && target && ![2,5].includes(unit.id) && distance(target.s,this.hero)<105;
   const wanted=engage?target.s:this.followPosition(slot);
   const history=unit.goalHistory;
   // Snapshot moving targets so that each soldier reacts on its own beat.
   history.push({x:wanted.x,y:wanted.y,time:this.elapsed});
   while(history.length && history[0].time<=this.elapsed-unit.reaction){
     unit.followGoal=history.shift();
   }
   const goal=unit.followGoal,gap=distance(unit.s,goal);
   const step=Math.min(dt*this.speed*1.65,gap*(1-Math.exp(-unit.followResponse*dt)));
   const oldX=unit.s.x,oldY=unit.s.y;
   if(gap>=.5)this.move(unit.s,goal.x,goal.y,step);
   const hero=this.hero,clearance=31;
   const dx=unit.s.x-hero.x,dy=unit.s.y-hero.y;
   if(Math.hypot(dx,dy)<clearance){
     const gx=goal.x-hero.x,gy=goal.y-hero.y;
     let angle=dx||dy?Math.atan2(dy,dx):Math.PI+slot*2*Math.PI/(this.actors.length-1);
     if(Math.hypot(gx,gy)>clearance){
       const turn=Phaser.Math.Angle.Wrap(Math.atan2(gy,gx)-angle);
       angle+=Phaser.Math.Clamp(turn,-step/clearance,step/clearance);
     }
     let offsetX=clearance*Math.cos(angle),offsetY=clearance*Math.sin(angle);
     if(hero.x+offsetX<15||hero.x+offsetX>945)offsetX=-offsetX;
     if(hero.y+offsetY<33||hero.y+offsetY>590)offsetY=-offsetY;
     unit.s.setPosition(hero.x+offsetX,hero.y+offsetY);
   }
   this.animateWalk(unit,unit.s.x-oldX,unit.s.y-oldY,unit.stepLength);
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
   const edge=rank?strikeInks[rank].body:0xffecc5;
   const flight=Math.max(65,reach*.75);
   if(rank)weaponAccent(this,unit,enemy.s.x,targetY,angle,body,[2,5].includes(unit.id)?flight:0);
   if(!unit.hero&&unit.id===3&&this.bondCounts[3]===6){
     const radius=this.mercRange(unit)*1.4;
     const wave=this.add.graphics().setPosition(x,y).setRotation(angle).setDepth(999);
     wave.lineStyle(1.3,edge,.8).beginPath().arc(0,0,radius,-Math.PI/3,Math.PI/3).strokePath();
     wave.setScale(.55);
     this.tweens.add({targets:wave,scaleX:1,scaleY:1,alpha:0,duration:150,onComplete:()=>wave.destroy()});
   }
   if(unit.id===2||unit.id===5){
     fx.setScale(body*.028);
     fx.lineStyle(2,0x795035).lineBetween(-13,0,0,0);
     fx.fillStyle(0xe6e0c7).fillTriangle(3,0,-2,-2,-2,2);
     fx.fillStyle(0xd6ae72).fillTriangle(-9,0,-15,-3,-13,0).fillTriangle(-9,0,-15,3,-13,0);
     if(rank){
       const tail=13+rank*8;
       strikeShard(fx,-tail,0,tail,0,rank+1,strikeInks[rank].shadow);
       strikeShard(fx,-tail+3,0,tail-2,0,rank*.65,strikeInks[rank].light);
       fx.fillStyle(edge,.85).fillTriangle(-8,-1.6,-19-rank*2,0,-8,1.6);
       if(rank>=2)fx.lineStyle(1.4,edge,.85).lineBetween(-11,-3,-19,-4).lineBetween(-11,3,-19,4);
       if(rank===3)fx.fillStyle(edge).fillTriangle(5,0,-3,-4,-1,0).fillTriangle(5,0,-1,0,-3,4);
     }
     this.tweens.add({targets:fx,x:x+dx,y:y+dy,duration:flight,onComplete:()=>fx.destroy()});
   }else if(unit.id===1||unit.id===8){
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
 soulBonus(stat){return this.soul?.type.stat===stat?this.soul.bonus:0}
 attack(a,e){
 if(a.hero){
   a.s.setFlipX(e.s.x<a.s.x);
   if(this.soulImage){
     this.soulStrike=.22;
     this.soulFacesLeft=e.s.x<a.s.x;
   }
 }
 if(a.hero&&a.skin===6){
   a.swingTime=.21;
   if(!a.hit)a.s.setTexture('commanderSwing0');
 }
 this.sfx.swing(a.id===5?2:a.id);
 if(a.hero){this.weaponEffect(a,e);if(!this.arrowBlocked(a,e))this.dealHit(a,e,1);return}
 const count=this.bondCounts[a.id];
 if(a.id===9){
   const angle=Math.atan2(e.s.y-a.s.y,e.s.x-a.s.x);
   a.rush={x:e.s.x+4*Math.cos(angle),y:e.s.y+4*Math.sin(angle),time:.20};return;
 }
 if(a.id===2||a.id===5){
   a.shots++;
   const arrows=1+(a.id===5?this.bag[20]:0)+Number(a.id===2&&count>=4)+(a.shots%5===0?this.bag[5]:0);
   for(let i=0;i<arrows&&this.mode==='fight';i++){
     const target=i===0?e:this.closestInRange(a);
     if(target)this.weaponStrike(a,target);
   }
 }else{
   this.weaponStrike(a,e);
   if(a.id===7&&this.mode==='fight'){
     const second=e.hp>0?e:this.closestInRange(a);
     if(second)this.weaponStrike(a,second);
   }
   if(this.mode==='fight'&&a.id===0&&count===6&&++this.swordHits%4===0)this.groupStrike(0);
 }
 }
 attackInterval(a){
   if(a.hero)return troops[a.id][2]/(1+this.soulBonus('haste')+.05*this.bag[16]);
   const count=this.bondCounts[a.id];
   let haste=this.mercHaste+.05*this.bag[16]+(this.elapsed<this.flagUntil?.20:0);
   if((a.id===0||a.id===2)&&count>=2)haste+=a.id===0&&count>=4?.16:.08;
   if(a.id>=4)haste+=Math.floor(count/2)*.08;
   return troops[a.id][2]*(a.id===5?1+.15*this.bag[20]:1)*([1,8].includes(a.id)?1+.05*this.bag[13]:1)/(1+haste);
 }
 mercRange(a){
   const count=this.bondCounts[a.id];
   return troops[a.id][3]*([1,8].includes(a.id)?1+.15*this.bag[13]:1)*(a.id===1&&count>=2?1.1:a.id===3&&count>=2?1.08:1);
 }
 closestInRange(a){
   let target=null,limit=this.mercRange(a);
   for(const enemy of this.enemies){
     const d=distance(a.s,enemy.s);
     if(d<=limit){limit=d;target=enemy}
   }
   return target;
 }
 groupStrike(id){
   for(const unit of this.actors){
     if(this.mode!=='fight')break;
     if(unit.hero||unit.id!==id)continue;
     const enemy=this.closestInRange(unit);
     if(enemy)this.weaponStrike(unit,enemy);
   }
 }
 weaponStrike(a,e){
   const count=this.bondCounts[a.id],r=this.mercRange(a);
   const angle=Math.atan2(e.s.y-a.s.y,e.s.x-a.s.x);
   const dx=Math.cos(angle),dy=Math.sin(angle);
   const hits=[e],piercing=[2,5].includes(a.id)&&this.bag[3]>0;
   const sweeping=[3,6,8,9].includes(a.id);
   if(a.id===1||sweeping||piercing){
     const extra=[];
     for(const other of this.enemies){
       if(other===e)continue;
       const x=other.s.x-a.s.x,y=other.s.y-a.s.y;
       const along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);
       if(sweeping){
         const radius=a.id===9?19:a.id===3&&count===6?r*1.4:r;
         if(a.id===9||a.id===6){if(distance(other.s,e.s)<=(a.id===6?17:radius))extra.push(other);continue}
         if(along>=Math.hypot(x,y)*.5&&Math.hypot(x,y)<=radius)extra.push(other);
       }else if(along>0&&along<=r&&side<=6&&(!piercing||along>=distance(a.s,e.s)))extra.push(other);
     }
     extra.sort((l,h)=>distance(a.s,l.s)-distance(a.s,h.s));
     hits.push(...(sweeping?extra:extra.slice(0,piercing?1:count>=4?2:1)));
   }
   this.weaponEffect(a,piercing?hits[hits.length-1]:e);
   for(const victim of hits){
     if(this.arrowBlocked(a,victim))break;
     if(this.mode!=='fight')break;
     if(a.id===1&&count===6&&victim.charge?.phase==='dash'){
       victim.charge.phase='recover';victim.charge.remaining=.75;
       victim.s.x=Phaser.Math.Clamp(victim.s.x+dx*7,8,952);
       victim.s.y=Phaser.Math.Clamp(victim.s.y+dy*7,8,592);
     }
     if(a.id===6&&!victim.boss&&!victim.elite){
       victim.s.x=Phaser.Math.Clamp(victim.s.x+dx*5,8,952);
       victim.s.y=Phaser.Math.Clamp(victim.s.y+dy*5,8,592);
     }
     const heavy=victim.boss||victim.elite||[4,8,10,13].includes(victim.skin);
     const power=(piercing?.9:1)*(a.id===5&&heavy?1.25:a.id===3&&count>=4?1.15:1);
     this.dealHit(a,victim,power);
     if(this.mode==='fight'&&victim.hp>0&&this.bag[6]){
       victim.comboHits=(victim.comboHits||0)+1;
       if(victim.comboHits%5===0)this.dealHit(a,victim,power);
     }
   }
 }
 arrowBlocked(a,e){
   if((a.id!==2&&a.id!==5)||e.skin!==10||!shieldFront(e,a.s))return false;
   shieldSpark(this,e.s);return true;
 }
 dealHit(a,e,power){
 const critical=Math.random()<.05+this.critBonus+(a.hero?this.soulBonus('crit'):0);
 if(e.boss&&this.bag[15]&&((e.markHits=(e.markHits||0)+1)%10===0))e.markUntil=this.elapsed+4;
 const damage=(critical?1.5:1)*(a.hero?this.commander.baseDamage*(1+this.soulBonus('power'))*this.commander.passives.reduce((factor,p)=>factor*(p.damageMultiplier?.(this)??1),1):troops[a.id][1]*[1,1.32,1.72,2.22][a.q])*this.damage*(a.hero?1:1+.02*this.camp.level('arms'))*power*(a.hero?1:1-.03*this.bag[12])*(this.elapsed<e.markUntil?1.12:1);e.hp-=damage;if(e.elite||e.boss)this.showEnemyHealth(e);impact(this,a.s,e,damage,false,critical);
 if(e.hp<=0){e.cast?.stones?.destroy();e.cast?.g.destroy();e.footBar?.destroy();this.kills++;if(this.bag[4]&&++this.flagKills%12===0)this.flagUntil=this.elapsed+5;for(const passive of this.commander.passives)passive.onKill?.(this);let {x,y}=e.s;const fallen=e.s;this.tweens.add({targets:fallen,alpha:0,duration:90,onComplete:()=>fallen.destroy()});this.enemies.splice(this.enemies.indexOf(e),1);
 if(e.boss){this.cleared=this.wave;this.end(true);return}
 if(e.elite){if(!this.bountyTaken){this.gold+=12*this.bag[14];this.bountyTaken=true}this.earnedIron+=2;this.eliteWins.push(this.wave)}else if(e.skin===4&&this.kills%4===0)this.earnedIron++;
 const chest=e.elite||Math.random()<.006;
 const loot=chest?this.add.rectangle(x,y,12,9,0xf8c76a):this.add.image(x,y,'silver-coin').setScale(.62);
 this.drops.push({s:loot,chest,crateTier:e.elite?(this.wave>=8?3:2):undefined});
 if(this.healDropsRemaining>0&&Math.random()<.008){
   const pack=this.add.image(Phaser.Math.Clamp(x+12,8,952),Phaser.Math.Clamp(y,8,592),'field-dressing').setScale(.52);
   this.drops.push({s:pack,heal:15});
   this.healDropsRemaining--;
 }
 this.hud()}}
 update(_,ms){if(this.mode==='coopFight'){this.coopFrame?.(ms);return}if(this.mode!=='fight')return;if(this.hitStop>0){this.hitStop-=ms;return}let dt=Math.min(ms/1000,.05),k=this.keys,h=this.hero;this.elapsed+=dt;this.timeLeft-=dt;this.invul-=dt;
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
   if(!commander.hit)h.setTexture('commanderSwing'+frame);
 }
 if(!commander.swingTime&&!commander.hit)this.animateWalk(commander,h.x-oldX,h.y-oldY,40);
 this.cameras.main.centerOn(h.x,h.y);
 advanceImpact(this.actors[0],dt);h.alpha=this.invul>0 && this.showInvulFade ? .72 : 1;this.spawnIn-=dt;if(this.spawnIn<=0&&this.enemies.length<90){this.spawn();this.spawnIn=Math.max(.24,.95-this.wave*.064)*this.campaign.pace}
 for(const e of this.enemies){
   advanceImpact(e,dt);
   if(!e.hit)this.walkEnemy(e,dt);
   if(this.mode!=='fight')return;
   e.s.setDepth(e.s.y);
   if(e.footBar)this.positionFootBar(e);
   if(!e.move&&distance(e.s,h)<19)this.enemyHit(e.s,7+this.wave);
   if(this.mode!=='fight')return;
 }
 stepStage(this,dt);if(this.mode!=='fight')return;stepStageFire(this,dt);if(this.mode!=='fight')return;
 stepHostileShots(this,dt);
 if(this.mode!=='fight')return;
 const defending=!x&&!y;
 const nearby=defending?this.enemies.filter(e=>distance(e.s,h)<105):[];
 for(let [i,a] of this.actors.entries()){
   if(a.rush){
     const rush=a.rush,ox=a.s.x,oy=a.s.y;
     this.move(a.s,rush.x,rush.y,360*dt);rush.time-=dt;
     this.animateWalk(a,a.s.x-ox,a.s.y-oy,12);
     a.s.setDepth(a.s.y+1);
     if(distance(a.s,rush)<1||rush.time<=0){
       a.rush=null;
       const victim=this.closestInRange(a);
       if(victim&&distance(victim.s,a.s)<22)this.weaponStrike(a,victim);
       if(this.mode!=='fight')return;
     }
     continue;
   }
   const candidates=i&&![2,5].includes(a.id)&&nearby.length?nearby:this.enemies;
   let target=null,d=Infinity;
   for(const e of candidates){const v=distance(a.s,e.s);if(v<d){target=e;d=v}}
 if(a.hero&&a.cd<=0&&(!target||d>this.commander.range)){
   const box=this.containers.find(b=>distance(a.s,b.s)<=this.commander.range);
   if(box){
     this.sfx.swing(a.id);box.s.setAlpha(.62);a.cd=troops[a.id][2];
     if(--box.hp<=0){
       const {x,y}=box.s;box.s.destroy();this.containers.splice(this.containers.indexOf(box),1);
       const chest=Math.random()<.04;
       this.drops.push({chest,s:chest?this.add.rectangle(x,y,12,9,0xf8c76a):this.add.image(x,y,'silver-coin').setScale(.62)});
     }
   }
 }
 if(i)this.follow(a,i-1,target,x||y,dt);
 if(i&&a.id===4&&target){a.facing=Math.atan2(target.s.y-a.s.y,target.s.x-a.s.x);a.s.setFlipX(Math.cos(a.facing)<0)}
 a.s.setDepth(a.s.y+1);a.cd-=dt;if(target&&d<(a.hero?this.commander.range*(1+(this.soul ? .25 : 0)+this.soulBonus('reach')):this.mercRange(a))&&a.cd<=0){this.attack(a,target);if(this.mode!=='fight')return;a.cd=this.attackInterval(a)}}
 if(this.bondCounts[2]===6&&(this.volleyIn-=dt)<=0){
   this.volleyIn+=8*(1-.12*this.bag[11]);this.groupStrike(2);
   if(this.mode!=='fight')return;
 }
 if(this.soulImage){
   const frame=this.soulStrike>0?Math.min(6,Math.floor((1-this.soulStrike/.22)*7)):0;
   const left=this.soulStrike>0?this.soulFacesLeft:h.flipX;
   this.soulImage.setTexture('soul-'+this.soul.id+'-'+frame)
     .setPosition(h.x+(left?8:-8),h.y-12+Math.sin(this.elapsed*3)*1.3)
     .setFlipX(left).setDepth(h.y-.5);
   this.soulStrike=Math.max(0,this.soulStrike-dt);
 }
 updatePropOpacity(this,dt);
 for(let drop of [...this.drops]){
   const pullRadius=(drop.chest?94:70*(1+.05*this.camp.level('sense')))*(1+.20*this.bag[satchel]);
   if(distance(drop.s,h)<pullRadius)this.move(drop.s,h.x,h.y,dt*300);
   if(distance(drop.s,h)<17){this.collect(drop);this.drops.splice(this.drops.indexOf(drop),1);drop.s.destroy();this.hud()}}
 $('wave').textContent='第 '+this.wave+' / '+finalWave+' 波　 ·　'+(this.wave===finalWave?'击败敌军统帅':Math.ceil(this.timeLeft)+' 秒');
 if(this.timeLeft<=0&&this.wave<finalWave){this.cleared=this.wave;this.clearField();this.hud();this.mode='refit';this.refreshes=0;this.freeRefreshes=this.bag[12];this.offers=this.offers.map(o=>o?.lock?o:null);this.reward()}}
 enemyHit(source,raw){
   if(this.invul>0)return;
   const edict=this.bag[19]&&this.bondCounts[4]>=2;
   const guarded=this.actors.some(a=>!a.hero&&a.id===4&&distance(a.s,this.hero)<(edict?70:50));
   const damage=Math.max(1,Math.round(raw*15/(15+this.armor)*(1-this.soulBonus('guard'))*(1-.05*this.bag[18])*(guarded?(edict?.80:.88):1)));
   this.takeCommanderDamage(damage);this.invul=.65;this.showInvulFade=true;
   impact(this,source,this.actors[0],damage,true);this.hud();
   if(!this.hp)this.end(false);
 }
 takeCommanderDamage(amount){
   this.hp=Math.max(0,this.hp-amount);
   if(this.hp===0&&this.bag[lastStand]&&!this.lastStandSpent){
     this.hp=1;this.lastStandSpent=true;
   }
 }
 need(){return 8+this.level*3}
 collect(d){
   if(d.heal){this.hp=Math.min(this.maxHP,this.hp+d.heal);return}
   this.gold+=2;this.xp+=1;if(d.chest){this.gold+=8*this.bag[salvagePermit];this.boxes.push(d.crateTier??tier(this.wave,this.luck))}while(this.xp>=this.need()){this.xp-=this.need();this.level++;this.pending++}}
 reward(keptTier){if(this.pending){let lv=this.level-this.pending+1,q=keptTier??(lv%5===0?(lv>=25?3:lv>=10?2:1):tier(lv,this.luck)),n=q+1,m=this.panel('战后升级 · '+roman[q],'等级 '+lv+'　 /　剩余 '+this.pending+' 次强化');let options=[['体魄　生命 +'+10*n,()=>{this.maxHP+=10*n;this.hp+=10*n}],['力量　伤害 +'+8*n+'%',()=>this.damage+=.08*n],['步法　移速 +'+5*n,()=>this.speed+=5*n],['幸运　+'+8*n,()=>this.luck+=8*n],
 ['操练　佣兵攻速 +'+5*n+'%',()=>this.mercHaste+=.05*n],
 ['锐眼　暴击率 +'+(1+2*n)+'%',()=>this.critBonus+=(1+2*n)/100],
 ['铁甲　护甲 +'+n,()=>this.armor+=n]];
 const hand=document.createElement('div');hand.className='upgrade-hand';m.append(hand);
 const symbols=['♥','⚔','➶','♧','⚑','✦','⬟'];
 Phaser.Utils.Array.Shuffle(options.map(([label,apply],i)=>({label,apply,symbol:symbols[i]}))).slice(0,4).forEach(({label,apply,symbol},index)=>{
   const [name,effect]=label.split('　');
   const card=this.button(hand,'',()=>{apply();this.upgradeRefreshes=0;this.pending--;this.hud();this.reward()});
   card.className='upgrade-card';card.dataset.tier=q;card.style.setProperty('--delay',index*45+'ms');
   const icon=document.createElement('i'),title=document.createElement('strong'),value=document.createElement('span');
   icon.textContent=symbol;icon.setAttribute('aria-hidden','true');
   title.textContent=name;value.textContent=effect;card.append(cardRank(q),icon,title,value);
 });
 const cost=refreshPrice(this.wave,this.upgradeRefreshes);
 this.button(m,'重抽 · '+cost+' 银币',()=>{
   if(this.gold<cost)return;
   this.gold-=cost;this.upgradeRefreshes++;this.hud();this.reward(q);
 },this.gold<cost);
 return}
 if(this.boxes.length){
   const q=this.boxes.shift(),id=this.item(q);
   const m=this.panel('战利品宝箱',id<0?'该品质道具均已达到上限':items[id][0]+' '+roman[q]+' · '+items[id][2]);
   const icon=document.createElement('div'),actions=document.createElement('div');
   icon.className='loot-icon';icon.setAttribute('aria-hidden','true');
   if(id<0)icon.textContent='🪙';else icon.append(itemIcon(id));
   m.querySelector('p').before(icon);
   actions.className='loot-actions';m.append(actions);
   if(id>=0)this.button(actions,'领取',()=>{this.applyItem(id);this.hud();this.reward()}).className='primary';
   const salvage=id<0?4*(q+1):Math.max(1,Math.floor(refitPrice(false,id,q,this.wave)*.25));
   this.button(actions,'回收 +'+salvage+' 银币',()=>{this.gold+=salvage;this.hud();this.reward()});
   return;
 }
 this.roll();this.shop()}
 item(q,bias=false){
   const pool=items.map((it,i)=>it[1]===q&&this.camp.itemOpen(i)&&this.bag[i]<itemCap(i)?i:-1).filter(i=>i>=0);
   const tags={3:[2,5],5:[2,5],6:[0,7],11:[0,2],13:[1,8],15:[2,5,7],16:[0,7],18:[4,6],19:[4],20:[5]};
   if(bias&&Math.random()<.05){
     const match=pool.filter(i=>this.army.some(a=>tags[i]?.includes(a.id)));
     if(match.length)return pick(match);
   }
   return pick(pool)??-1;
 }
 recruitOffer(pool){
   const classes=['melee','pole','bow','melee','guard','bow','heavy','melee','pole','horse'];
   const weights=pool.map(id=>this.army.some(a=>a.id===id)?2:this.army.some(a=>classes[a.id]===classes[id])?1.35:1);
   let r=Math.random()*weights.reduce((a,b)=>a+b,0);
   return pool[weights.findIndex(w=>(r-=w)<0)]??pool[0];
 }
 applyItem(id){if(this.bag[id]>=itemCap(id))return;this.bag[id]++;if(id===0)this.damage+=.08;if(id===1)this.speed*=1.06;if(id===salvagePermit)this.speed*=.99;if(id===2)this.luck+=15;if(id===11)this.speed*=.98;if(id===16)this.armor--;if(id===17){this.maxHP+=6;this.hp+=6;this.speed*=.99}if(id===18)this.speed*=.97;}
 roll(){const pool=troops.map((_,id)=>id).filter(id=>this.camp.troopOpen(id));let locked=this.offers.filter(o=>o?.lock),merc=locked.filter(o=>o.merc).length,gear=locked.length-merc;for(let i=0;i<4;i++){if(this.offers[i]?.lock)continue;let isMerc=this.wave<=2?(merc<2&&(gear>=2||Math.random()<(2-merc)/(4-merc-gear))):this.wave<=5&&merc===0&&this.offers.slice(i+1).every(o=>o?.lock)&&i===3?true:Math.random()<.35;
 let q=tier(this.wave,this.luck),id=isMerc?this.recruitOffer(pool):this.item(q,true);if(id<0&&this.wave<=2){this.offers[i]=null;gear++;continue}if(id<0){isMerc=true;id=pick(pool)}
 if(isMerc)merc++;else gear++;this.offers[i]={merc:isMerc,id,q,price:refitPrice(isMerc,id,q,this.wave),lock:false}}
 if(this.wave<=5&&!merc){let o=this.offers.find(o=>!o.lock);if(o)Object.assign(o,{merc:true,id:0,price:refitPrice(true,0,o.q,this.wave)})}}
 shop(deal=true){this.hud();let m=this.panel('战地整备','第 '+this.wave+' 波已完成　 ·　军饷 '+this.gold+' 银币'),cards=document.createElement('div');cards.id='cards';cards.className=deal?'deal':'';m.append(cards);
 this.offers.forEach((o,i)=>{let c=document.createElement('div');cards.append(c);if(!o){c.textContent='已售出';return} const emblem=document.createElement('i'),name=document.createElement('strong'),detail=document.createElement('small');
 c.dataset.tier=o.q;c.dataset.suit=o.merc?'佣兵':'道具';if(o.merc)emblem.textContent=troopEmblems[o.id];else emblem.append(itemIcon(o.id));
 emblem.setAttribute('aria-hidden','true');
 name.textContent=o.merc?troops[o.id][0]:items[o.id][0];
 detail.textContent=o.merc?'佣兵':items[o.id][2];
 c.style.setProperty('--delay',i*45+'ms');c.classList.toggle('locked',o.lock);c.append(cardRank(o.q),emblem,name,detail);const full=o.merc?this.army.length>=6:this.bag[o.id]>=itemCap(o.id);
 const reason=full?(o.merc?'满编':'已满'):this.gold<o.price?'差 '+(o.price-this.gold)+' 银币':'';
 const price=document.createElement('span');
 price.className='offer-price';price.textContent=o.price+' 银币';c.append(price);
 const buy=this.button(c,'',()=>{if(this.offers[i]!==o)return;this.gold-=o.price;if(o.merc)this.army.push({id:o.id,q:o.q});else this.applyItem(o.id);this.offers[i]=null;this.shop(false)},Boolean(reason));buy.className='buy';buy.setAttribute('aria-label','购买'+name.textContent+' '+roman[o.q]+'阶，'+o.price+'银币');buy.title=reason||buy.getAttribute('aria-label');this.button(c,o.lock?'解锁':'锁定',()=>{o.lock=!o.lock;this.shop(false)}).setAttribute('aria-pressed',String(o.lock))});
 const inventory=document.createElement('div');
 inventory.className='refit-inventory';
 for(const label of ['佣兵','道具']){
   const group=document.createElement('section'),heading=document.createElement('strong'),grid=document.createElement('div');
   heading.textContent=label;grid.className='refit-slots';
   if(label==='佣兵'){
     grid.setAttribute('aria-label',label);
     grid.classList.add('mercenary-slots');
     const actions=document.createElement('div');actions.className='mercenary-actions';
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
         const partner=this.army.findIndex(other=>other!==unit&&other.id===unit.id&&other.q===unit.q);
         const merge=this.button(actions,'合成',()=>{
           unit.q++;this.army.splice(partner,1);this.shop(false);
         },partner<0||unit.q>=3);
         merge.title=unit.q>=3?'已达最高品质':'需要两名同兵种、同品质佣兵';
         const refund=Math.floor(refitPrice(true,unit.id,unit.q,this.wave)/4);
         const dismiss=this.button(actions,'遣散',()=>{
           this.gold+=refund;
           this.army.splice(i,1);this.shop(false);
         });
         dismiss.title='遣散返还 '+refund+' 银币';
         const value=document.createElement('small');
         value.textContent='+'+refund+' 银币';dismiss.append(value);
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
       slot.append(itemIcon(id),items[id][0]+' ×'+count);slot.title=items[id][2];grid.append(slot);
     });
     if(!grid.childElementCount)grid.textContent='暂无道具';
   }
   group.append(heading,grid);inventory.append(group);
 }
 m.append(inventory);
 let cost=this.freeRefreshes?0:refreshPrice(this.wave,this.refreshes);this.button(m,cost?'刷新 · '+cost:'免费刷新',()=>{this.gold-=cost;if(this.freeRefreshes)this.freeRefreshes--;else this.refreshes++;this.roll();this.shop()},this.gold<cost);this.button(m,'下一波 →',()=>{this.wave++;this.begin()}).className='primary'}
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
   const reward=this.camp.settle(this,win);this.syncStages();
   const m=this.panel(win?'突围成功':'灰旗倒下','完成 '+this.cleared+' 波　·　击破 '+this.kills+' 名敌军');
   const receipt=document.createElement('p');receipt.textContent=reward;m.append(receipt);
   this.button(m,'返回灰旗营地',()=>this.camp.open(this)).className='primary';
   this.button(m,'再次出征',()=>this.startRun());
 }
}
const game = new Phaser.Game({type:Phaser.CANVAS,input:{touch:false},loader:{imageLoadType:'HTMLImageElement'},parent:'game',width:960,height:600,pixelArt:false,audio:{noAudio:true},scene:Battle});
