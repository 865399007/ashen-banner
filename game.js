const healDropInterval=()=>Phaser.Math.Between(18,36);
function attachBossName(scene,sprite,name){
 const label=scene.add.text(0,0,name,{
   fontFamily:gameFontFamily,fontSize:'7px',fontStyle:'bold',
   color:'#ffe7aa',stroke:'#36251c',strokeThickness:2,resolution:3
 }).setOrigin(.5,1).setDepth(1001);
 const offset=sprite.displayHeight*sprite.originY;
 sprite.bossName=label.setPosition(sprite.x,sprite.y-offset);
 sprite.once('destroy',()=>label.destroy());
 return offset;
}
function mercenaryPortrait(scene,unit){
 const source=scene.textures.get('man'+troopSkin(unit.id,unit.q)).getSourceImage();
 const canvas=document.createElement('canvas');
 canvas.width=source.width;canvas.height=source.height;
 canvas.getContext('2d').drawImage(source,0,0);
 canvas.setAttribute('aria-hidden','true');
 return canvas;
}
function addItemSaleButtons(scene,grid,bag,wave,onSell){
 const actions=document.createElement('div');actions.className='item-actions';
 for(const [key,count] of Object.entries(bag)){
   if(!count)continue;
   const id=Number(key),name=items[id][0];
   const slot=scene.button(grid,'',()=>{
     const open=slot.getAttribute('aria-pressed')!=='true';
     for(const other of grid.querySelectorAll('button'))other.setAttribute('aria-pressed','false');
     actions.replaceChildren();
     if(!open)return;
     slot.setAttribute('aria-pressed','true');
     const detail=document.createElement('small');detail.textContent=name+' · '+items[id][2];
     actions.append(detail);
     const sell=scene.button(actions,'卖出 1 件 · +'+itemSaleValue(id,wave)+' 银币',()=>{
       sell.disabled=true;onSell(id);
     });
   });
   slot.append(itemIcon(id),name+' ×'+count);slot.title=items[id][2];slot.setAttribute('aria-pressed','false');
 }
 if(grid.childElementCount){
   grid.classList.add('item-slots');
   grid.setAttribute('role','group');grid.setAttribute('aria-label','已装备道具');
 }else grid.textContent='暂无道具';
 return actions;
}
function appendCommanderStats(panel,name,rows){
 const section=document.createElement('section'),title=document.createElement('h3'),list=document.createElement('dl');
 section.className='commander-stats';title.textContent=name;
 for(const [label,value] of rows){
   const cell=document.createElement('div'),term=document.createElement('dt'),amount=document.createElement('dd');
   term.textContent=label;amount.textContent=value;cell.append(term,amount);list.append(cell);
 }
 section.append(title,list);panel.append(section);
}
const statNumber=value=>Number(value.toFixed(2));
class Battle extends Phaser.Scene{
 preload(){
   this.load.image('ember-arena','assets/field/ember-arena.webp?v=ground-detail');
 }
 create(){
 this.camp=new GreyCamp();
 this.commander=commanders.banner;
 this.stageKey=stageOrder[0];this.campaign=campaigns[this.stageKey];
 const skills=$('commander-passives');
 skills.replaceChildren();
 for(const {name,description} of this.commander.passives){
   const line=document.createElement('li'), title=document.createElement('strong');
   title.textContent=name;
   line.append(title,' · '+description);
   skills.append(line);
 }

 for(const button of $('camp-actions').querySelectorAll('[data-camp-section]')){
   button.onclick=()=>this.camp.open(this,button.dataset.campSection);
 }
 makeArt(this);
 const silverIcon=$('silver-icon').getContext('2d');
 silverIcon.drawImage(this.textures.get('silver-coin').getSourceImage(),0,0);
 this.fallenEnemies=this.add.group();this.footDust=this.add.group();this.sfx=new CombatSound();placeField(this);this.mode='title';
 // Browsers allow the camp theme to start after the first tap or keyboard action.
 const wakeAudio=()=>{if(this.sfx.ctx?.state!=='running')this.sfx.unlock()};
 const syncMusic=()=>this.sfx.updateMusic(this.mode);
 document.addEventListener('click',wakeAudio,true);
 document.addEventListener('keydown',wakeAudio,true);
 document.addEventListener('visibilitychange',syncMusic);
 this.events.once('shutdown',()=>{
   document.removeEventListener('click',wakeAudio,true);
   document.removeEventListener('keydown',wakeAudio,true);
   document.removeEventListener('visibilitychange',syncMusic);
   this.sfx.updateMusic('over');
 });
 this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC',false);this.keys.ESC.on('down',()=>{if(!$('preferences').hidden)this.closeSettings();else if(this.mode==='camp'&&$('modal').querySelector('.campaign-track')){this.camp.open(this);$('start').focus()}else this.pauseRun()});
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
   const fitScale=Math.max(Math.min(width/portraitWorldWidth,height/480),width/960,height/600);
   const phoneLandscape=typeof wx!=='undefined'&&typeof wx.createCanvas==='function'&&width>height&&height<=540;
   const worldScale=phoneLandscape?fitScale*1.4:fitScale;
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
 const debugToggle=$('toggle-debug');
 const showDebugButtons=visible=>{
   const portrait=$('home-commander'),ctx=portrait.getContext('2d');
   ctx.clearRect(0,0,portrait.width,portrait.height);
   ctx.drawImage(this.textures.get(commanderTexture(this,this.startingLevel)).getSourceImage(),0,0);
   $('test-army').hidden=!visible;
   $('debug-final-wave').hidden=!visible;
   debugToggle.setAttribute('aria-pressed',String(visible));
   debugToggle.textContent=visible?'调试按钮：显示':'调试按钮：隐藏';
 };
 showDebugButtons(this.camp.data.showDebugButtons===true);
 debugToggle.onclick=()=>{
   const visible=$('test-army').hidden;
   this.camp.data.showDebugButtons=visible;this.camp.save();
   showDebugButtons(visible);
   if(visible&&['fight','paused','refit'].includes(previousMode)&&this.level<this.startingLevel){
     this.level=this.startingLevel;
     this.updateCommanderForm();
     this.hud();
     if(previousMode==='refit'&&$('modal').querySelector('.commander-stats'))this.shop(false);
   }
   if(previousMode==='camp'){
     const section=$('modal').querySelector('h2')?.textContent;
     if(section==='战役记录'||section==='选择战役'){
       this.camp.open(this,section);this.mode='settings';
     }
   }
 };
 $('debug-final-wave').onclick=()=>{
   if(this.mode!=='fight'||this.camp.data.showDebugButtons!==true||this.wave>=finalWave)return;
   this.resetStick();this.wave=finalWave;this.begin();
 };
 const preferences=$('preferences');
 let previousMode;
 this.closeSettings=()=>{
   preferences.hidden=true;this.mode=previousMode;$('settings').setAttribute('aria-expanded','false');
   for(const id of ['modal','cover','pause'])$(id).inert=false;
   if(previousMode==='fight'||previousMode==='finishing')this.tweens.resumeAll();
   $('settings').focus({preventScroll:true});
 };
 $('settings').onclick=()=>{
   if(!preferences.hidden){this.closeSettings();return}
   previousMode=this.mode;this.resetStick();this.mode='settings';preferences.hidden=false;
   if(previousMode==='fight'||previousMode==='finishing')this.tweens.pauseAll();
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
 $('volume').oninput=event=>{
   const value=event.currentTarget.value;
   $('volume-value').value=value+'%';
   this.sfx.volume=Number(value)/100;
   this.sfx.refreshGain();
 };
 const leaveRun=()=>{
   this.closeSettings();this.clearField();this.resetRun();this.hero=null;
   $('pause').setAttribute('aria-pressed','false');$('pause').setAttribute('aria-label','暂停');$('pause').title='暂停 / Esc';
   $('modal').hidden=true;$('wave').textContent='';this.mode='title';this.hud();
   this.cameras.main.centerOn(480,300);$('cover').hidden=false;
 };
 $('restart').onclick=()=>{leaveRun();this.startRun()};
 $('return-lobby').onclick=leaveRun;
 $('pause').onclick=()=>this.pauseRun();$('start').onclick=()=>this.camp.open(this,'选择战役');this.resetRun();this.hud()}
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
 get startingLevel(){return this.camp.data.showDebugButtons===true?20:1}
 resetRun(){Object.assign(this,{wave:1,souls:[],flagKills:0,earnedIron:0,eliteWins:[],hp:100+5*this.camp.level('vigor'),maxHP:100+5*this.camp.level('vigor'),gold:2*this.camp.level('supply'),kills:0,level:this.startingLevel,xp:0,pendingLevels:[],upgradeRefreshes:0,mercHaste:0,critBonus:0,armor:0,boxes:[],damage:1,speed:startingSpeed+this.commander.passives.reduce((v,p)=>v+(p.speedBonus??0),0),luck:0,army:[],bag:items.map(()=>0),offers:[],enemies:[],drops:[],actors:[],cleared:0});}
 hud(){
   if(this.mode==='title')$('camp-wallet').textContent='银币 '+this.camp.data.silver+'　·　铁料 '+this.camp.data.iron+'　·　军功章 '+this.camp.data.medals;
   $('field').classList.toggle('low-health',this.mode==='fight'&&this.hp>0&&this.hp<=this.maxHP*.25);
 $('battle-hud').hidden=['title','camp'].includes(this.mode);
 $('experience').style.width=100*this.xp/this.need()+'%';
 for(const [id,value] of Object.entries({level:'Lv. '+this.level,money:this.gold}))$(id).textContent=value;
 $('life').style.width=100*this.hp/this.maxHP+'%';

}
 panel(title,desc,homePage=false,onBack){
   this.resetStick();$('cover').hidden=true;
   const m=$('modal');m.classList.toggle('home-subpage',homePage);
   m.hidden=false;m.replaceChildren();m.scrollTop=0;
   const h=document.createElement('h2'),p=document.createElement('p');
   h.textContent=title;p.textContent=desc;m.append(h);
   if(onBack){
     const summary=document.createElement('div');summary.className='camp-page-summary';
     summary.append(p);this.button(summary,'返回',onBack);m.append(summary);
   }else m.append(p);
   return m;
 }
 button(parent,name,fn,disabled=false){let b=document.createElement('button');b.textContent=name;b.disabled=disabled;b.onclick=fn;parent.append(b);return b}
 startRun(key=this.stageKey){
   if(!this.camp.stageOpen(key)){this.camp.open(this,'选择战役');return}
   this.stageKey=key;this.campaign=campaigns[key];
   this.sfx.unlock();this.resetRun();$('cover').hidden=true;this.begin();
 }
 begin(){this.ordinarySpawns=0;this.healDropsRemaining=Phaser.Math.Between(2,3);this.killsUntilHeal=healDropInterval();this.hitStop=0;this.nextImpactBeat=0;this.clearField();$('modal').hidden=true;this.mode='fight';this.timeLeft=waveDurationSeconds(this.wave);this.spawnIn=.1;this.wildlifeArrivals=wildlifeArrivals(this.wave,this.timeLeft);this.elapsed=0;this.invul=1;this.showInvulFade=false;this.dir=[1,0];this.lastStandSpent=false;
 this.actors=[this.createActor({id:this.commander.weapon,q:0,hero:true},0)];
 this.hero=this.actors[0].s;
 this.healCommander(15+6*this.bag[bandage]);
 setupStage(this);this.gold+=3*this.bag[coinPurse];this.flagUntil=0;this.eliteDefeated=false;
 this.deployMercenaries();
 this.cameras.main.centerOn(this.hero.x,this.hero.y);
 $('debug-final-wave').disabled=this.wave>=finalWave;
 if(this.wave===finalWave)this.spawn(true);
 this.eliteArrivals=eliteArrivalTimes(this.wave,this.timeLeft);
 this.hud()
 }
 createActor(unit,index){
   const skin=unit.hero?this.commander.skin:troopSkin(unit.id,unit.q);
   const baseTexture=unit.hero?commanderTexture(this,this.level):'man'+skin;
   const s=this.add.image(480,300,baseTexture).setOrigin(.5,.85).setScale(unit.hero?COMMANDER_BATTLE_SCALE:1/3);
   return {...unit,skin,baseTexture,stride:0,shots:0,followUps:[],wounds:new WeakMap(),cd:index*.12,s};
 }
 deployMercenaries(){
   for(const unit of this.actors.splice(1))unit.s.destroy();
   this.bondCounts=troops.map((_,id)=>this.army.filter(unit=>unit.id===id).length);
   this.swordHits=0;this.volleyIn=8*(1-.12*this.bag[11]);
   this.army.forEach((unit,i)=>this.actors.push(this.createActor(unit,i+1)));
   this.clearSouls();
   this.souls=armySouls(this.army);
   this.nextSoulIndex=0;
   for(const spirit of this.souls){
     const {type,level}=spirit;
     spirit.frames=Array.from({length:7},(_,frame)=>generalSoulFrame(this,type,frame,level-1));
     const image=this.add.image(this.hero.x,this.hero.y,spirit.frames[0]).setOrigin(.5,soulBeltOriginY)
       .setScale(.34+.02*(level-1)).setAlpha(.86);
     spirit.image=image;
     spirit.strikeTime=0;
     spirit.round=0;spirit.followUps=[];
     if(type.general==='lvbu'){
       image.plumes=this.add.image(0,0,lvbuPlumeFrame(this,0,level-1)).setOrigin(.5,soulBeltOriginY)
         .setScale(image.scaleX).setAlpha(image.alpha);
       image.once('destroy',()=>image.plumes.destroy());
     }
   }
   this.positionSouls();
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
   Array.from($('test-army').children).forEach((btn,id)=>btn.setAttribute('aria-pressed',String(this.souls.some(s=>s.count===6&&s.id===id))));
 }
 clearField(){this.finishBattleTransition=null;this.fallenEnemies.clear(true,true);clearStage(this);for(const shot of this.hostileShots??[]){shot.trail?.destroy();shot.g.destroy()}this.hostileShots=[];this.clearSouls();$('field').classList.remove('low-health');for(const enemy of this.enemies){enemy.cast?.stones?.destroy();enemy.cast?.g.destroy();enemy.footBar?.destroy();}this.footDust.clear(true,true);for(let o of [...this.actors,...this.enemies,...this.drops])o.s.destroy();this.actors=[];this.enemies=[];this.drops=[]}
 spawnWaveElites(){
   spawnDueElite(this.eliteArrivals,this.timeLeft,this.enemies,()=>this.spawn(false,true));
 }
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
   const beast=wildBeasts[forcedSkin];
   if(beast){
     const baseTexture=enemyTexture(this,this.stageKey,forcedSkin);
     const s=this.add.image(x,y,baseTexture).setOrigin(.5,.85).setScale(1/3);
     const hp=Math.round((beast.health+3*this.wave)*(this.camp.data.veteran?1.25:1));
     const enemy={s,skin:forcedSkin,beast,baseTexture,stride:Math.random(),hp,max:hp,
       speed:beast.speed+this.wave,elite:false,boss:false};
     if(beast.move){enemy.move=beast.move;enemy.reload=.5}
     if(forcedSkin==='boar')enemy.charge={phase:'ready',remaining:.6};
     this.enemies.push(enemy);return;
   }
   const mounted=!boss&&!elite&&++this.ordinarySpawns%8===5;
   const type=mounted?3:Math.floor(Math.random()*3);
   // Alternate infantry reinforcements with the existing patrols.
   const reinforcement=!boss&&!elite&&this.ordinarySpawns%2===0;
   const variant=(this.ordinarySpawns/2-1)%8;
   let patrolSkin=null;
   if(!boss&&!elite&&forcedSkin==null){
     if(this.stageKey==='border')patrolSkin=villageEnemy(this.wave);
     else if(this.campaign.roster)patrolSkin=pick(this.campaign.roster);
   }
   const skin=forcedSkin??patrolSkin??(boss?this.campaign.bossSkin:reinforcement&&variant===7&&this.wave>=2&&this.ordinarySpawns%32===16?23:reinforcement?9+variant:mounted?8:3+type);
   const infantry=skin>=9&&skin<=16?skin-9:-1;
   const baseType=skin>=3&&skin<=5?skin-3:skin===8?3:type;
   const pace=infantry>=0?[47,24,33,58,29,38,32,54][infantry]:skin===23?54:31+baseType*8;
   const toughness=infantry>=0?[2,15,7,-2,12,6,9,0][infantry]:skin===23?9:baseType*3;
   let hp=boss?this.campaign.bossHP:(13+this.wave*4+toughness)*(elite?5:1);if(this.camp.data.veteran)hp=Math.round(hp*1.25);
 const baseTexture=enemyTexture(this,this.stageKey,skin,boss);
 const enemy={baseTexture,s:this.add.image(x,y,baseTexture).setOrigin(.5,.85).setScale(boss?BOSS_BATTLE_SCALE:elite?ELITE_BATTLE_SCALE:1/3),skin,stride:Math.random(),hp,max:hp,boss,elite,speed:(boss?42:pace+this.wave*2)*this.campaign.march};
 enemy.move=boss?this.campaign.bossMove:({5:'bow',23:'bolt',13:'hammer',14:'hammer',15:'hammer'})[skin];
 enemy.reload=.25+Math.random()*.55;
 if(skin===8)enemy.charge={phase:"ready",remaining:.45};
 this.enemies.push(enemy);if(boss||elite){
   // Foot bars sit above ground details (-9) and below every combatant.
   enemy.footBar=this.add.graphics().setDepth(-8);
   if(boss)enemy.nameOffset=attachBossName(this,enemy.s,this.campaign.boss);
   this.showEnemyHealth(enemy);
 }
 }
 positionFootBar(enemy){
   const sprite=enemy.s;
   sprite.bossName?.setPosition(sprite.x,sprite.y-enemy.nameOffset);
   enemy.footBar.setPosition(sprite.x,sprite.y+sprite.displayHeight*(1-sprite.originY)+2);
 }
 showEnemyHealth(enemy){
   const width=enemy.boss?36:30;
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
   this.animateWalk(enemy,s.x-x,s.y-y,enemy.boss?48:enemy.beast?14:22);
 }
 animateWalk(unit,dx,dy,stepLength){
   const s=unit.s,travel=Math.hypot(dx,dy);
   let key=unit.baseTexture??('man'+unit.skin+(unit.boss?'boss':''));
   if(travel>.001){
     const next=unit.stride+travel/stepLength;
     if(Math.floor(next*2)>Math.floor(unit.stride*2)){
       this.footfall(unit,dx/travel,dy/travel,Math.floor(next*2)%2?1:-1);
     }
     unit.stride=next%1;
     key+='walk'+Math.floor(unit.stride*WALK_FRAMES);
     if(Math.abs(dx)>.001)s.setFlipX(dx<0);
   }else if(unit.hero&&unit.skin===6){
     key=commanderIdleTexture(this.elapsed*1000,unit.baseTexture);
   }
   if(s.pourUntil)key=medicPose(s,unit.baseTexture,key,this.time.now);
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
   const engage=!marching && target && ![2,5,medicId].includes(unit.id) && distance(target.s,this.hero)<105;
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
 weaponEffect(unit,enemy,{heavy=false,golden=false,offset=0}={}){
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
     fx.setPosition(x-Math.sin(angle)*offset,y+Math.cos(angle)*offset);
     fx.setScale(body*(heavy?.042:.028));
     if(golden)strikeShard(fx,-38,0,40,0,3.6,0xffd063);
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
     if(unit.id===8){
       const crescent=[[-.13,-.022],[-.14,-.16],[-.085,-.22],[-.23,-.20],[-.31,-.13],[-.34,0],[-.28,0],[-.25,-.09],[-.2,-.13],[-.16,-.14],[-.17,-.022]];
       fx.fillStyle(rank?edge:0xe1dbc6).fillPoints(crescent.map(([x,y])=>({x:x*body,y:y*body})),true);
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
 clearSouls(){
   for(const zone of this.poisonCircles??[])zone.image.destroy();
   this.poisonCircles=[];
   for(const spirit of this.souls)spirit.image?.destroy();
   this.souls=[];
 }
 positionSouls(){
   const h=this.hero,back=h.flipX?1:-1;
   this.souls.forEach(({image,level},i)=>{
     const offset=this.souls.length===1 ? .14 : (i===0 ? .44 : -.24);
     image.setPosition(h.x+back*h.displayWidth*offset,h.y-h.displayHeight*(.55+.17*i))
       .setFlipX(h.flipX).setDepth(h.depth-.5-.1*i);
     if(image.plumes){
       const phase=Math.floor(this.elapsed*15)%plumeFrameCount;
       image.plumes.setTexture(lvbuPlumeFrame(this,phase,level-1)).setPosition(image.x,image.y)
         .setFlipX(image.flipX).setDepth(image.depth-.01);
     }
   });
 }
 soulBonus(stat){return this.souls.reduce((sum,s)=>sum+(s.type.stat===stat?s.bonus:0),0)}
 commanderAttackRange(){
   const baseBonus=this.souls.length?soulBaseRangePercent/100:0;
   return this.commander.range*(1+baseBonus+this.soulBonus('reach'));
 }
 commanderDamage(){
   const passive=this.commander.passives.reduce((factor,p)=>factor*(p.damageMultiplier?.(this)??1),1);
   return this.commander.baseDamage*(1+this.soulBonus('power'))*this.damage*passive;
 }
 soulAttack(a,target){
   const spirit=this.souls[this.nextSoulIndex];
   this.nextSoulIndex=(this.nextSoulIndex+1)%this.souls.length;
   spirit.strikeTime=this.elapsed < spirit.gourdUntil ? .14 : .22;
   if(spirit.type.general==='huatuo')spirit.gourdUntil=Math.max(spirit.gourdUntil??0,this.elapsed+.25);
   this.positionSouls();
   startSoulRound(this,spirit,a,target);
 }
 attack(a,e){
 if(a.hero){
   a.s.setFlipX(e.s.x<a.s.x);
 }
 if(a.hero&&a.skin===6){
   a.swingTime=.21;
   if(!a.hit)a.s.setTexture(a.baseTexture+'swing0');
 }
 this.sfx.swing(a.id===5?2:a.id);
 if(a.hero){
   if(this.souls.length)this.soulAttack(a,e);
   else{
     this.weaponEffect(a,e);
     if(!this.arrowBlocked(a,e))this.dealHit(a,e,1);
   }
   return;
 }
 const count=this.bondCounts[a.id];
 a.shots++;
 if(a.id===medicId){fieldMedicineRound(this,a,e);return}
 if(a.id===9){startCavalryRush(this,a,e);return}
 if(a.id===2||a.id===5){rangedRound(this,a,e);return}
 meleeRound(this,a,e);
 if(this.mode==='fight'&&a.id===0&&count===6&&++this.swordHits%4===0)this.groupStrike(0);
 }

 attackInterval(a){
   if(a.hero)return troops[a.id][2]/(1+this.soulBonus('haste')+.05*this.bag[16]);
   const count=this.bondCounts[a.id];
   let haste=this.mercHaste+.05*this.bag[16]+(this.elapsed<this.flagUntil?.20:0);
   if((a.id===0||a.id===2)&&count>=2)haste+=a.id===0&&count>=4?.16:.08;
   if(equippedFor(this.bag,bladeWrap,a.id))haste+=.15;
   if(a.id>=4)haste+=Math.floor(count/2)*.08;
   return troops[a.id][2]*(equippedFor(this.bag,riderSpurs,a.id)?.85:1)*(a.id===5?1+.15*this.bag[20]:1)*([1,8].includes(a.id)?1+.05*this.bag[13]:1)/(1+haste);
 }
 mercRange(a){
   const count=this.bondCounts[a.id];
   return troops[a.id][3]*(a.id===1&&a.q>=1?1.15:1)*(equippedFor(this.bag,poleFerrule,a.id)?1.18:1)*([1,8].includes(a.id)?1+.15*this.bag[13]:1)*(a.id===1&&count>=2?1.1:a.id===3&&count>=2?1.08:1);
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
 weaponStrike(a,e,strength=1,longThrust=false){
   if(a.id===2||a.id===5){
     const pierce=Number(this.bag[3]>0)+Number(a.id===2&&a.q>=2);
     fireRankedArrow(this,a,e,strength,pierce);return;
   }
   const count=this.bondCounts[a.id],r=this.mercRange(a)*(longThrust?1.6:1);
   const angle=Math.atan2(e.s.y-a.s.y,e.s.x-a.s.x);
   const dx=Math.cos(angle),dy=Math.sin(angle);
   const hits=[e];
   const sweeping=[3,6,8,9].includes(a.id);
   if(a.id===1||sweeping){
     const extra=[];
     for(const other of this.enemies){
       if(other===e)continue;
       const x=other.s.x-a.s.x,y=other.s.y-a.s.y;
       const along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);
       if(sweeping){
         const radius=a.id===9?(this.bag[chargeStandard]?28.5:19):a.id===3&&count===6?r*1.4:r;
         if(a.id===9||a.id===6){if(distance(other.s,e.s)<=(a.id===6?(a.q>=2?21.25:17):radius))extra.push(other);continue}
         if(along>=Math.hypot(x,y)*(a.id===8&&a.q>=2?Math.cos(80*Math.PI/180):.5)&&Math.hypot(x,y)<=radius)extra.push(other);
       }else if(along>0&&along<=r&&side<=6)extra.push(other);
     }
     extra.sort((l,h)=>distance(a.s,l.s)-distance(a.s,h.s));
     hits.push(...(sweeping?extra:extra.slice(0,longThrust?5:1+Number(count>=4)+Number(a.q>=1))));
   }
   if(longThrust)skillMark(this,a,a.s,angle,r,'spear');
   this.weaponEffect(a,e);
   for(const victim of hits){
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
     this.mercHit(a,victim,e,strength*(a.id===6&&a.q>=2&&victim===e?1.35:1));
   }
 }
 mercHit(a,victim,primary,strength){
   if(this.mode!=='fight'||victim.hp<=0)return;
   const heavy=victim.boss||victim.elite||[4,8,10,13].includes(victim.skin);
   let power=strength*(a.id===5&&heavy?1.25:a.id===3&&this.bondCounts[3]>=4?1.15:1);
   if(equippedFor(this.bag,heavyGrip,a.id))power*=1.15;
   if(equippedFor(this.bag,finishingBlade,a.id)&&victim.hp<=victim.max*.5)power*=1.35;
   if(equippedFor(this.bag,formationSpike,a.id)&&victim!==primary)power*=1.45;
   if(equippedFor(this.bag,siegeHead,a.id)&&(victim.elite||victim.boss))power*=1.35;
   this.dealHit(a,victim,power);
   if(this.mode==='fight'&&victim.hp>0&&this.bag[6]){
     victim.comboHits=(victim.comboHits||0)+1;
     if(victim.comboHits%5===0)this.dealHit(a,victim,power);
   }
   if(a.id===7&&a.q>=2&&victim.hp>0&&this.mode==='fight'){
     const n=(a.wounds.get(victim)||0)+1;a.wounds.set(victim,n%4);
     if(n===4){
       skillMark(this,a,victim.s,0,8,'cross');
       this.dealHit(a,victim,.9*(power/strength));
     }
   }
 }

 arrowBlocked(a,e){
   if((a.id!==2&&a.id!==5)||e.skin!==10||!shieldFront(e,a.s))return false;
   shieldSpark(this,e.s);return true;
 }
 rollAttackDamage(a){
   const critical=Math.random()<.05+this.critBonus+(a.hero?this.soulBonus('crit'):0);
   const base=a.hero?this.commanderDamage():troops[a.id][1]*[1,1.32,1.72,2.22][a.q]
     *this.damage*(1+.02*this.camp.level('arms'))*(1-.03*this.bag[12]);
   return {damage:base*(critical?1.5:1),critical};
 }
 dealHit(a,e,power){
   if(e.hp<=0)return;
   const hit=this.rollAttackDamage(a);
   this.applyHitDamage(a.s,e,hit.damage*power,hit.critical);
 }
 applyHitDamage(attacker,e,damage,critical,periodic=false){
 if(this.elapsed<e.soulArmorBreakUntil)damage*=1.15;
 if(!periodic&&e.boss&&this.bag[15]&&((e.markHits=(e.markHits||0)+1)%10===0))e.markUntil=this.elapsed+4;
 if(this.elapsed<e.markUntil)damage*=1.12;
 e.hp-=damage;if(e.elite||e.boss)this.showEnemyHealth(e);
 if(periodic&&e.hp>0)return;
 const hitBurst=impact(this,attacker,e,damage,false,critical);
 if(e.hp<=0){e.cast?.stones?.destroy();e.cast?.g.destroy();e.footBar?.destroy();this.kills++;if(this.bag[4]&&++this.flagKills%12===0)this.flagUntil=this.elapsed+5;for(const passive of this.commander.passives)passive.onKill?.(this);
 const {x,y}=e.s;
 this.enemies.splice(this.enemies.indexOf(e),1);
 fadeDefeatedEnemy(this,e,hitBurst);
 if(e.boss){this.cleared=this.wave;this.end(true);return}
 const firstElite=e.elite&&!this.eliteDefeated;
 if(e.elite){
   delayNextElite(this.eliteArrivals,this.timeLeft);
   if(firstElite)this.gold+=12*this.bag[14];
   this.eliteDefeated=true;this.earnedIron+=2;
   if(this.bag[fieldNeedles])this.healCommander(8*this.bag[fieldNeedles]);
   if(!this.eliteWins.includes(this.wave))this.eliteWins.push(this.wave);
 }else if(e.skin===4&&this.kills%4===0)this.earnedIron++;
 const chest=firstElite||Math.random()<(e.elite?.25:.006);
 const loot=chest?this.add.rectangle(x,y,12,9,0xf8c76a):this.add.image(x,y,'silver-coin').setScale(.62);
 this.drops.push({s:loot,chest,crateTier:chest&&e.elite?eliteChestTier(this.wave):undefined});
 if(this.healDropsRemaining>0&&--this.killsUntilHeal===0){
   const jar=this.add.image(Phaser.Math.Clamp(x+12,8,952),Phaser.Math.Clamp(y,8,592),'dukang-wine-jar').setScale(.26).setDepth(y+2);
   this.drops.push({s:jar,heal:15,collectAfter:this.elapsed+.45});
   this.healDropsRemaining--;
   this.killsUntilHeal=healDropInterval();
 }
 this.hud()}}
 afterEnemyDefeats(complete){
   if(!this.fallenEnemies.getLength()){complete();return}
   this.mode='finishing';this.finishBattleTransition=complete;
 }
 update(_,ms){
 this.sfx?.updateMusic(this.mode);
 if(this.mode==='finishing'){if(!this.fallenEnemies.getLength())this.finishBattleTransition();return}
 if(this.mode==='coopFight'){this.coopFrame?.(ms);return}if(this.mode!=='fight')return;if(this.hitStop>0){this.hitStop-=ms;return}let dt=Math.min(ms/1000,.05),k=this.keys,h=this.hero;this.elapsed+=dt;this.timeLeft-=dt;this.invul-=dt;
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
   if(!commander.hit)h.setTexture(commander.baseTexture+'swing'+frame);
 }
 if(!commander.swingTime&&!commander.hit)this.animateWalk(commander,h.x-oldX,h.y-oldY,40);
 this.cameras.main.centerOn(h.x,h.y);
 advanceImpact(this.actors[0],dt);h.alpha=this.invul>0 && this.showInvulFade ? .72 : 1;this.spawnIn-=dt;if(this.spawnIn<=0&&this.enemies.length<90){this.spawn(false,false,takeWildlife(this.wildlifeArrivals,this.timeLeft,this.stageKey,this.wave));this.spawnIn=Math.max(.24,.95-this.wave*.064)*this.campaign.pace}
 this.spawnWaveElites();
 stepPoisonCircles(this);
 for(const e of [...this.enemies]){
   const damage=poisonTick(e,this.elapsed);
   if(damage){
     showPoisonTick(this,e.s);
     this.applyHitDamage(this.hero,e,damage,false,true);
     if(this.mode!=='fight')return;
   }
 }
 for(const e of this.enemies){
   advanceImpact(e,dt);
   const stunned=this.elapsed<e.soulStunUntil;
   if(!stunned&&!e.hit)this.walkEnemy(e,dt);
   if(this.mode!=='fight')return;
   e.s.setDepth(e.s.y);
   if(e.footBar)this.positionFootBar(e);
   if(!stunned&&!e.move&&distance(e.s,h)<(e.beast?.reach??19))this.enemyHit(e.s,(e.beast?.damage??7)+this.wave);
   if(this.mode!=='fight')return;
 }
 stepStage(this,dt);if(this.mode!=='fight')return;stepStageFire(this,dt);if(this.mode!=='fight')return;
 stepHostileShots(this,dt);
 if(this.mode!=='fight')return;
 for(const spirit of this.souls){
   runFollowUps(this,spirit);
   if(this.mode!=='fight')return;
 }
 const defending=!x&&!y;
 const nearby=defending?this.enemies.filter(e=>distance(e.s,h)<105):[];
 for(let [i,a] of this.actors.entries()){
   runFollowUps(this,a);
   if(this.mode!=='fight')return;
   if(a.rush){
     stepCavalryRush(this,a,dt);
     if(this.mode!=='fight')return;
     continue;
   }
   const candidates=i&&![2,5,medicId].includes(a.id)&&nearby.length?nearby:this.enemies;
   let target=null,d=Infinity;
   for(const e of candidates){const v=distance(a.s,e.s);if(v<d){target=e;d=v}}
 const range=a.hero?this.commanderAttackRange():this.mercRange(a);
 if(i)this.follow(a,i-1,target,x||y,dt);
 if(i&&a.id===4&&target){a.facing=Math.atan2(target.s.y-a.s.y,target.s.x-a.s.x);a.s.setFlipX(Math.cos(a.facing)<0)}
 a.s.setDepth(a.s.y+1);a.cd-=dt;
 const needsTreatment=a.id===medicId&&this.hp<this.maxHP;
 if(a.cd<=0&&(needsTreatment||(target&&d<range))){this.attack(a,d<range?target:null);if(this.mode!=='fight')return;a.cd=this.attackInterval(a)}}
 if(this.bondCounts[2]===6&&(this.volleyIn-=dt)<=0){
   this.volleyIn+=8*(1-.12*this.bag[11]);this.groupStrike(2);
   if(this.mode!=='fight')return;
 }
 if(this.souls.length){
   for(const s of this.souls){
     if(this.elapsed<s.gourdUntil&&s.strikeTime<.14)s.strikeTime=.14;
     const frame=s.strikeTime>0?Math.min(6,Math.floor((1-s.strikeTime/.22)*7)):0;
     s.image.setTexture(s.frames[frame]);
     s.strikeTime=Math.max(0,s.strikeTime-dt);
   }
   this.positionSouls();
 }
 for(let drop of [...this.drops]){
   if(this.elapsed<(drop.collectAfter??0))continue;
   const pullRadius=(drop.chest?94:70*(1+.05*this.camp.level('sense')))*(1+.20*this.bag[satchel]);
   if(distance(drop.s,h)<pullRadius)this.move(drop.s,h.x,h.y,dt*300);
   if(distance(drop.s,h)<17){this.collect(drop);this.drops.splice(this.drops.indexOf(drop),1);drop.s.destroy();this.hud()}}
 $('wave').textContent='第 '+this.wave+' / '+finalWave+' 波　 ·　'+(this.wave===finalWave?'击败'+this.campaign.boss:this.campaign.army+' · '+Math.ceil(this.timeLeft)+' 秒');
 if(this.timeLeft<=0&&this.wave<finalWave){
   this.cleared=this.wave;
   this.afterEnemyDefeats(()=>{
     this.clearField();this.hud();this.mode='refit';this.refreshes=0;
     this.freeRefreshes=this.bag[12];this.offers=this.offers.map(o=>o?.lock?o:null);this.reward();
   });
 }
 }
 enemyHit(source,raw){
   if(this.invul>0||blockWithCaoRen(this))return;
   const edict=this.bag[19]&&this.bondCounts[4]>=2;
   const guarded=this.actors.some(a=>!a.hero&&a.id===4&&distance(a.s,this.hero)<(edict?70:50));
   const damage=Math.max(1,Math.round(raw*15/(15+this.armor)*(1-this.soulBonus('guard'))*(1-.05*this.bag[18])*(guarded?(edict?.80:.88):1)));
   this.takeCommanderDamage(damage);this.invul=.65+.15*this.bag[heartMirror];this.showInvulFade=true;
   impact(this,source,this.actors[0],damage,true);this.hud();
   if(!this.hp){this.end(false);return}
   if(guarded){
     for(const guard of this.actors){
       if(guard.hero||guard.id!==4||guard.q<2||distance(guard.s,this.hero)>=(edict?70:50)||this.elapsed<(guard.counterAt||0))continue;
       guard.counterAt=this.elapsed+2;
       const ring=guard.q===3,origin=pointOf(ring?this.hero:guard.s);
       skillArea(this,guard,null,origin,heading(origin,source),ring?50:this.mercRange(guard),1,ring?'ring':'cone',ring?1.4:.75,ring?'ring':'sweep');
       if(this.mode!=='fight')break;
     }
   }
 }
 takeCommanderDamage(amount){
   this.hp=Math.max(0,this.hp-amount);
   if(this.hp===0&&this.bag[lastStand]&&!this.lastStandSpent){
     this.hp=1;this.lastStandSpent=true;
   }
 }
 healCommander(amount){
   const before=this.hp;
   this.hp=Math.min(this.maxHP,before+amount);
   showHealing(this,this.hero,this.hp-before);
 }
 need(){return 8+this.level*3}
 collect(d){
   if(d.heal){this.healCommander(d.heal+5*this.bag[herbPowder]);return}
   const previousLevel=this.level;
   this.gold+=2;this.xp+=1;if(d.chest){this.gold+=8*this.bag[salvagePermit];this.boxes.push(d.crateTier??tier(this.wave,this.luck))}while(this.xp>=this.need()){this.xp-=this.need();this.pendingLevels.push(++this.level)}
   if(commanderForm(this.level)!==commanderForm(previousLevel))this.updateCommanderForm();
 }
 updateCommanderForm(){
   const hero=this.actors[0];
   if(!hero)return;
   const oldBase=hero.baseTexture;
   const pose=hero.hit?hero.normalTexture:hero.s.texture.key;
   hero.baseTexture=commanderTexture(this,this.level);
   const key=hero.baseTexture+pose.slice(oldBase.length);
   if(hero.hit)hero.normalTexture=key;
   hero.s.setTexture(hero.hit&&hero.hit.age<hitFlashMs/1000?hitTexture(this,key,true):key);
   showCommanderPromotion(this,hero.s);
 }
 reward(keptTier){if(this.pendingLevels.length){let lv=this.pendingLevels[0],q=keptTier??(lv%5===0?(lv>=25?3:lv>=10?2:1):tier(lv,this.luck)),n=q+1,m=this.panel('战后升级 · '+roman[q],'等级 '+lv+'　 /　剩余 '+this.pendingLevels.length+' 次强化');let options=[['体魄　生命 +'+10*n,()=>{this.maxHP+=10*n;this.hp+=10*n}],['力量　伤害 +'+8*n+'%',()=>this.damage+=.08*n],['步法　移速 +'+5*n,()=>this.speed+=5*n*equipmentSpeedFactor(this.bag)],['幸运　+'+8*n,()=>this.luck+=8*n],
 ['操练　佣兵攻速 +'+5*n+'%',()=>this.mercHaste+=.05*n],
 ['锐眼　暴击率 +'+(1+2*n)+'%',()=>this.critBonus+=(1+2*n)/100],
 ['铁甲　护甲 +'+n,()=>this.armor+=n]];
 const hand=document.createElement('div');hand.className='upgrade-hand';m.append(hand);
 const symbols=['♥','⚔','➶','♧','⚑','✦','⬟'];
 Phaser.Utils.Array.Shuffle(options.map(([label,apply],i)=>({label,apply,symbol:symbols[i]}))).slice(0,4).forEach(({label,apply,symbol},index)=>{
   const [name,effect]=label.split('　');
   const card=this.button(hand,'',()=>{apply();this.upgradeRefreshes=0;this.pendingLevels.shift();this.hud();this.reward()});
   card.className='upgrade-card';card.dataset.tier=q;card.style.setProperty('--delay',index*45+'ms');
   const icon=document.createElement('i'),title=document.createElement('strong'),value=document.createElement('span');
   icon.textContent=symbol;icon.setAttribute('aria-hidden','true');
   title.textContent=name;value.textContent=effect;card.append(cardRank(q),icon,title,value);
 });
 const cost=refreshPrice(this.wave,this.upgradeRefreshes);
 this.button(m,'刷新 · '+cost+' 银币',()=>{
   if(this.gold<cost)return;
   this.gold-=cost;this.upgradeRefreshes++;this.hud();this.reward(q);
 },this.gold<cost);
 return}
 let recycled=0;
 while(this.boxes.length){
   const chestTier=this.boxes.shift();
   let q=chestTier,id=this.item(q);
   while(id<0&&q>0)id=this.item(--q);
   if(id<0){
     const silver=4*(chestTier+1);
     this.gold+=silver;recycled+=silver;
     continue;
   }
   const fallback=q<chestTier?roman[chestTier]+' 阶已领满 · ':'';
   const m=this.panel('战利品宝箱',fallback+items[id][0]+' '+roman[q]+' · '+items[id][2]+'　·　已装备 '+equippedCount(this.bag)+' / '+equipmentCapacity);
   if(recycled)m.querySelector('p').append('　·　此前宝箱已折合 '+recycled+' 银币');
   const icon=document.createElement('div'),actions=document.createElement('div');
   icon.className='loot-icon';icon.setAttribute('aria-hidden','true');icon.append(itemIcon(id));
   m.querySelector('p').before(icon);
   actions.className='loot-actions';m.append(actions);
   this.button(actions,'领取',()=>{this.applyItem(id);this.hud();this.reward()}).className='primary';
   const salvage=Math.max(q<chestTier?4*(chestTier+1):1,Math.floor(refitPrice(false,id,q,this.wave)*.25));
   this.button(actions,'回收 +'+salvage+' 银币',()=>{this.gold+=salvage;this.hud();this.reward()});
   this.hud();return;
 }
 this.roll();this.shop();
 if(recycled)$('modal').querySelector('p').append('　·　宝箱已折合 '+recycled+' 银币');
 }
 item(q,bias=false){
   if(equippedCount(this.bag)>=equipmentCapacity)return -1;
   const pool=items.map((it,i)=>it[1]===q&&this.camp.itemOpen(i)&&this.bag[i]<itemCap(i)?i:-1).filter(i=>i>=0);
   if(q>=2&&pool.length&&this.army.length){
     // Favour weapons the player fields, while keeping off-build cards possible.
     const weighted=pool.flatMap(id=>{
       const units=weaponTroops[id];
       const copies=units?(this.army.some(a=>units.includes(a.id))?6:1):3;
       return Array(copies).fill(id);
     });
     return pick(weighted);
   }
   const tags={3:[2,5],5:[2,5],6:[0,7],11:[0,2],13:[1,8],15:[2,5,7],16:[0,7],18:[4,6],19:[4],20:[5]};
   if(bias&&Math.random()<.05){
     const match=pool.filter(i=>this.army.some(a=>tags[i]?.includes(a.id)));
     if(match.length)return pick(match);
   }
   return pick(pool)??-1;
 }
 applyItem(id){
   if(!canEquipItem(this.bag,id))return false;
   this.changeItem(id,1);return true;
 }
 changeItem(id,delta){
   const oldSpeedFactor=equipmentSpeedFactor(this.bag);
   this.bag[id]+=delta;
   this.speed*=equipmentSpeedFactor(this.bag)/oldSpeedFactor;
   if(id===0)this.damage+=.08*delta;
   if(id===2)this.luck+=15*delta;
   if(id===16)this.armor-=delta;
   if(id===17){this.maxHP+=6*delta;this.hp=Phaser.Math.Clamp(this.hp+6*delta,1,this.maxHP)}
   if(id===scaleVest)this.armor+=2*delta;
   if(id===tigerManual)this.mercHaste+=.10*delta;
   if(id===guardSeal)this.critBonus+=.04*delta;
   if(id===12&&delta<0)this.freeRefreshes=Math.min(this.freeRefreshes||0,this.bag[id]);
 }
 roll(){const gearFull=equippedCount(this.bag)>=equipmentCapacity;const pool=troops.map((_,id)=>id).filter(id=>this.camp.troopOpen(id));let locked=this.offers.filter(o=>o?.lock),merc=locked.filter(o=>o.merc).length,gear=locked.length-merc;for(let i=0;i<4;i++){if(this.offers[i]?.lock)continue;let isMerc=gearFull||(this.wave<=2?(merc<2&&(gear>=2||Math.random()<(2-merc)/(4-merc-gear))):this.wave<=5&&merc===0&&this.offers.slice(i+1).every(o=>o?.lock)&&i===3?true:Math.random()<.35);
 let q=tier(this.wave,this.luck),id=isMerc?recruitOffer(pool,this.army):this.item(q,true);if(id<0&&this.wave<=2){this.offers[i]=null;gear++;continue}if(id<0){isMerc=true;id=recruitOffer(pool,this.army)}
 if(isMerc)merc++;else gear++;this.offers[i]={merc:isMerc,id,q,price:refitPrice(isMerc,id,q,this.wave),lock:false}}
 if(this.wave<=5&&!merc){let o=this.offers.find(o=>o&&!o.lock);if(o){const id=recruitOffer(pool,this.army);Object.assign(o,{merc:true,id,price:refitPrice(true,id,o.q,this.wave)})}}}
 showCommanderStats(panel){
   const c=this.commander,percent=value=>statNumber(value*100)+'%';
   const damage=this.commanderDamage()*(this.souls.length?soulAttackMultiplier(this.souls[0].level):1);
   const interval=this.attackInterval({hero:true,id:c.weapon});
   const reduction=1-15/(15+this.armor)*(1-this.soulBonus('guard'))*(1-.05*this.bag[18]);
   appendCommanderStats(panel,c.name,[
     ...this.souls.map(s=>['战魂',s.type.name+' · '+s.level+' 级 · '+s.type.label+' +'+s.type.values[s.level-1]+'%']),
     ['等级',this.level],['装束',commanderForms[commanderForm(this.level)].name],['经验',this.xp+' / '+this.need()],['生命',statNumber(this.hp)+' / '+this.maxHP],
     ['普攻伤害',statNumber(damage)],['攻击间隔',statNumber(interval)+' 秒'],['攻击距离',statNumber(this.commanderAttackRange())],
     ['暴击率',percent(Math.min(1,.05+this.critBonus+this.soulBonus('crit')))],['暴击伤害','150%'],['护甲',this.armor],['常驻减伤',percent(reduction)],
     ['移速',statNumber(this.speed)],['幸运',this.luck],['拾取范围',statNumber(70*(1+.05*this.camp.level('sense'))*(1+.2*this.bag[satchel]))],
     ['宝箱拾取范围',statNumber(94*(1+.2*this.bag[satchel]))],['开波恢复',15+6*this.bag[bandage]],['佣兵攻速加成',percent(this.mercHaste)]
   ]);
 }
 shop(deal=true){this.souls=armySouls(this.army);this.hud();let m=this.panel('战地整备','第 '+this.wave+' 波已完成　 ·　军饷 '+this.gold+' 银币'),cards=document.createElement('div');cards.id='cards';cards.className=deal?'deal':'';m.append(cards);
 this.offers.forEach((o,i)=>{let c=document.createElement('div');cards.append(c);if(!o){c.textContent='已售出';return} const emblem=document.createElement('i'),name=document.createElement('strong'),detail=document.createElement('small');
 c.dataset.tier=o.q;c.dataset.suit=o.merc?'佣兵':'道具';emblem.append(o.merc?mercenaryPortrait(this,o):itemIcon(o.id));
 emblem.setAttribute('aria-hidden','true');
 name.textContent=o.merc?troops[o.id][0]:items[o.id][0];
 const target=purchaseMergeTarget(this.army,o);
 detail.textContent=target?'购买合成 '+roman[o.q+1]+' 阶':o.merc?'佣兵':items[o.id][2];
 c.style.setProperty('--delay',i*45+'ms');c.classList.toggle('locked',o.lock);c.append(cardRank(o.q),emblem,name,detail);const full=o.merc?this.army.length>=armyCapacity&&!target:!canEquipItem(this.bag,o.id);
 const reason=full?(o.merc?'满编':'已满'):this.gold<o.price?'差 '+(o.price-this.gold)+' 银币':'';
 const price=document.createElement('span');
 price.className='offer-price';price.textContent=o.price+' 银币';c.append(price);if(reason){price.textContent+=' · '+reason;}
 const buy=this.button(c,'',()=>{
   if(this.offers[i]!==o||this.gold<o.price)return;
   if(o.merc){
     if(!recruitMercenary(this.army,o))return;
   }else if(!this.applyItem(o.id))return;
   this.gold-=o.price;this.offers[i]=null;this.shop(false);
 },Boolean(reason));
 buy.className='buy';buy.setAttribute('aria-label',(target?'购买合成':'购买')+name.textContent+' '+roman[o.q]+'阶，'+o.price+'银币');buy.title=reason||buy.getAttribute('aria-label');this.button(c,o.lock?'解锁':'锁定',()=>{o.lock=!o.lock;this.shop(false)}).setAttribute('aria-pressed',String(o.lock))});
 const inventory=document.createElement('div');
 inventory.className='refit-inventory';
 for(const label of ['佣兵','道具']){
   const group=document.createElement('section'),heading=document.createElement('strong'),grid=document.createElement('div');
   heading.textContent=label;grid.className='refit-slots';
   if(label==='佣兵'){
     grid.setAttribute('aria-label',label);
     grid.classList.add('mercenary-slots');
     const actions=document.createElement('div');actions.className='mercenary-actions';
     for(let i=0;i<armyCapacity;i++){
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
         merge.className='merge-unit';
         merge.title=unit.q>=3?'已达最高品质':'需要两名同兵种、同品质佣兵';
         const refund=Math.floor(refitPrice(true,unit.id,unit.q,this.wave)/4);
         const dismiss=this.button(actions,'遣散',()=>{
           this.gold+=refund;
           this.army.splice(i,1);this.shop(false);
         });
         dismiss.className='dismiss-unit';
         dismiss.title='遣散返还 '+refund+' 银币';
         const value=document.createElement('small');
         value.textContent='+'+refund+' 银币';dismiss.append(value);
       });
       const name=slot.textContent;
       const portrait=mercenaryPortrait(this,unit);
       const rank=document.createElement('small');rank.textContent=roman[unit.q];
       slot.replaceChildren(portrait,rank);
       slot.title=name;slot.setAttribute('aria-label',name);
       slot.setAttribute('aria-pressed','false');
     }
     group.append(heading,grid,actions);inventory.append(group);
   }else{
     heading.textContent='道具 '+equippedCount(this.bag)+' / '+equipmentCapacity;
     const actions=addItemSaleButtons(this,grid,this.bag,this.wave,id=>{
       if(!this.bag[id])return;
       this.changeItem(id,-1);this.gold+=itemSaleValue(id,this.wave);this.shop(false);
     });
     group.append(heading,grid,actions);inventory.append(group);

   }
 }
 m.append(inventory);
 const controls=document.createElement('div');controls.className='refit-controls';m.append(controls);
 let cost=this.freeRefreshes?0:refreshPrice(this.wave,this.refreshes);this.button(controls,cost?'刷新 · '+cost:'免费刷新',()=>{this.gold-=cost;if(this.freeRefreshes)this.freeRefreshes--;else this.refreshes++;this.roll();this.shop()},this.gold<cost);this.button(controls,'下一波',()=>{this.wave++;this.begin()}).className='primary';this.showCommanderStats(m)}
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
   if(this.mode==='over'||this.mode==='finishing')return;
   const reward=this.camp.settle(this,win);
   const showResult=()=>{
     this.mode='over';this.clearField();this.hud();
     const m=this.panel(win?this.campaign.name+' · 告捷':'灰旗倒下',(win?'击败'+this.campaign.boss:this.campaign.name)+' · '+'完成 '+this.cleared+' 波　·　击破 '+this.kills+' 名敌军');
     const receipt=document.createElement('p');receipt.textContent=reward;m.append(receipt);
     this.button(m,'返回首页',()=>this.camp.open(this)).className='primary';
     this.button(m,'再次出征',()=>this.startRun());
   };
   if(win)this.afterEnemyDefeats(showResult);else showResult();
 }
}
const game = new Phaser.Game({type:Phaser.CANVAS,input:{touch:false},loader:{imageLoadType:'HTMLImageElement'},parent:'game',width:960,height:600,pixelArt:false,audio:{noAudio:true},scene:Battle});
