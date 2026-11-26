function installCoop(scene){
 const key='greyflag.coop.session';
 let session=null,state=null,timer=0,pending=null,menuKey='',lastEffect=0,running=false;
 const sprites=new Map();
 const status=document.createElement('output');
 status.className='coop-status';status.hidden=true;$('field').append(status);
 const exit=document.createElement('button');
 exit.type='button';exit.className='coop-exit';exit.textContent='退出';
 exit.setAttribute('aria-label','退出联机房间');exit.hidden=true;$('field').append(exit);
 exit.onclick=()=>{
   if(!session)return;
   const action={type:'leave',seq:Math.max(state?.seq||0,pending?.seq||0)+1,rev:state?.revision||0};
   fetch('/room',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({...session,action}),keepalive:true}).catch(()=>{});
   stop();
 };
 const panel=(title,info,homePage=false)=>scene.panel(title,info,homePage);
 function stop(){
   exit.hidden=true;clearTimeout(timer);session=null;pending=null;state=null;menuKey='';lastEffect=0;
   scene.fallenEnemies.clear(true,true);sessionStorage.removeItem(key);for(const s of sprites.values())s.destroy();sprites.clear();
   status.hidden=true;scene.resetStick();scene.hero=null;scene.mode='title';scene.hud();
   $('modal').hidden=true;$('cover').hidden=false;$('wave').textContent='';
   $('field').classList.remove('cooperative');scene.cameras.main.centerOn(480,300);
 }
 function queue(type,slot=0){
   if(!state||pending)return;
   pending={type,slot,seq:state.seq+1,rev:state.revision};
 }
 async function api(body){
   const response=await fetch('/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(4000)});
   const result=await response.json();
   if(!response.ok){const error=new Error(result.error);error.status=response.status;throw error}return result;
 }
 function node(tag,cls,text){
   const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;
 }
 function portrait(){
   const canvas=node('canvas','seat-portrait');canvas.width=300;canvas.height=300;
   const c=canvas.getContext('2d');
   c.scale(5.4,5.4);bannerCommander(c,0);
   canvas.setAttribute('aria-hidden','true');return canvas;
 }
 function partyRoom(){
   const m=panel('出征备战',campaigns.border.name+' · '+campaignOpposition(campaigns.border),true);
   const hall=node('div','party-hall');
   const seats=node('div','party-seats');hall.append(seats);
   const tools=node('div','party-tools'),code=node('b','party-code',state.code);
   tools.append(node('span','','房间号'),code);
   async function invite(){
     const number=code.textContent;
     const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
     const url=new URL(location.href);url.search='';url.searchParams.set('coop','1');url.searchParams.set('room',number);
     const text=local?number:url.href;
     try{
       if(!navigator.clipboard?.writeText)throw Error();
       await navigator.clipboard.writeText(text);
       notice.textContent=local?'房间号已复制':'邀请链接已复制';
     }catch{
       const field=node('input','invite-copy');field.readOnly=true;field.value=text;
       field.setAttribute('aria-label','复制邀请');notice.replaceChildren(field);field.focus();field.select();
       if(document.execCommand('copy'))notice.textContent=local?'房间号已复制':'邀请链接已复制';
     }
   }
   for(let i=0;i<2;i++){
     const player=state.players[i],seat=node('div','party-seat seat-'+i+(player?'':' vacant'));
     seat.append(node('span','seat-role',i===0?'房主':'队友'));
     if(player){
       seat.append(portrait(),node('strong','seat-name',commanders.banner.name),
         node('small','seat-state'+(player.ready?' ready':''),(i===state.you?'你 · ':'')+(!player.online?'重连中':player.ready?'已准备':'备战中')));
     }else{
       const add=scene.button(seat,'＋',invite);
       add.className='invite-seat';add.setAttribute('aria-label','邀请队友');
       seat.append(node('strong','seat-name','空缺席位'),node('small','seat-state','邀请队友加入'));
     }
     seats.append(seat);
   }
   scene.button(tools,'复制邀请',invite);hall.append(tools);
   const notice=node('div','invite-note');notice.setAttribute('aria-live','polite');hall.append(notice);
   const self=state.players[state.you],full=state.players.length===2;
   const proceed=scene.button(hall,!full?'等待队友加入':self.ready?'已准备 · 等待队友':'准备出征',()=>queue('ready'),!full||self.ready);
   proceed.className='party-ready';m.append(hall);
 }
 function showLobby(message=''){
   scene.mode='coopMenu';$('field').classList.add('cooperative');
   const m=panel('双人合作',message||'创建房间，或输入队友的六位房间号。',true);
   const input=document.createElement('input');input.value=new URLSearchParams(location.search).get('room')?.match(/^\d{6}$/)?.[0]||'';input.className='party-room-code';input.maxLength=6;input.inputMode='numeric';input.placeholder='六位房间号';input.setAttribute('aria-label','房间号');m.append(input);
   async function enter(op){
     if(running)return;scene.sfx.unlock();
     if(op==='join'&&!/^\d{6}$/.test(input.value)){m.querySelector('p').textContent='请输入六位数字';return}
     running=true;
     try{
       const r=await api({op,code:input.value,hero:'banner'});
       session={code:r.code,token:r.token};sessionStorage.setItem(key,JSON.stringify(session));
       state=r.state;paint();poll();
     }catch(e){showLobby(e.message)}finally{running=false}
   }
   scene.button(m,'创建房间',()=>enter('create')).className='party-create';
   scene.button(m,'加入房间',()=>enter('join'));
   scene.button(m,'返回',()=>{if(!running)stop()});
 }
 $('coop-entry').onclick=()=>{
   if(location.hostname.endsWith('.github.io')){
     const m=panel('局域网合作','两台设备连接同一路由器后，请打开房主电脑的局域网地址，端口为 8767。',true);
     scene.button(m,'返回',stop);return;
   }
   if(location.port!=='8767'){location.href=location.protocol+'//'+location.hostname+':8767/?coop=1';return}
   showLobby();
 };
 let received=0,interval=65,roundTrip=0,lastInput={x:0,y:0},local=null;
 function input(){
   const k=scene.keys;
   const x=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown);
   const y=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
   if(x||y)return {x,y};
   return {x:scene.stickX||0,y:scene.stickY||0};
 }
 function sprite(key,x,y,texture,scale){
   let s=sprites.get(key);
   if(!s){
     s=scene.add.image(x,y,texture).setOrigin(.5,.85).setScale(scale);
     sprites.set(key,s);
   }else if(s.bannerCommander&&s.baseTexture!==texture){
     showCommanderPromotion(scene,s);
   }
   s.fromX=s.x;s.fromY=s.y;s.toX=x;s.toY=y;s.baseTexture=texture;
   return s;
 }
 function stepVisual(s,x,y,now){
   const dx=x-s.x,dy=y-s.y,moving=Math.abs(dx)+Math.abs(dy)>.025;
   let tex=s.baseTexture;
   if(moving&&(tex.startsWith('man')||tex.startsWith('wild-')))tex+='walk'+Math.floor(now/90)%WALK_FRAMES;
   else if(s.bannerCommander&&s.angle===0)tex=commanderIdleTexture(now,tex);
   if(now<s.redFlashUntil)tex=hitTexture(scene,tex,true);
   if(s.texture.key!==tex)s.setTexture(tex);
   if(moving){s.setPosition(x,y);if(Math.abs(dx)>.025)s.setFlipX(dx<0)}
   if(s.depth!==y)s.setDepth(y);
   s.bossName?.setPosition(s.x,s.y-s.nameOffset);
 }
 scene.coopFrame=(ms)=>{
   if(!state||!local)return;
   const now=performance.now(),age=now-received,dt=Math.min(ms,50)/1000;
   const t=Math.min(1,age/interval);
   for(const s of sprites.values()){
     if(s===scene.hero)continue;
     stepVisual(s,s.fromX+(s.toX-s.fromX)*t,s.fromY+(s.toY-s.fromY)*t,now);
   }
   const p=state.players[state.you],other=state.players[1-state.you],dir=input();
   const canMove=age<250&&!p.down&&other?.online;
   const norm=Math.max(1,Math.hypot(dir.x,dir.y));
   const adjust=1-Math.exp(-dt*14);
   const cx=local.errorX*adjust,cy=local.errorY*adjust;
   local.errorX-=cx;local.errorY-=cy;
   const x=Phaser.Math.Clamp(scene.hero.x+cx+(canMove?dir.x/norm*p.speed*dt:0),12,948);
   const y=Phaser.Math.Clamp(scene.hero.y+cy+(canMove?dir.y/norm*p.speed*dt:0),24,584);
   stepVisual(scene.hero,x,y,now);scene.cameras.main.centerOn(x,y);
 };
 function localEnemyHit(s,lost,boss,dead,hit){
   // Animate a display-only copy so network interpolation keeps its own coordinates.
   const ghost=scene.add.image(s.x,s.y,s.texture.key).setOrigin(s.originX,s.originY)
     .setScale(s.scaleX,s.scaleY).setFlipX(s.flipX).setDepth(s.depth+1);
   s.hitGhost?.destroy();s.hitGhost=ghost;s.setVisible(false);
   const victim={s:ghost,boss};
   const attacker=hit?{x:hit.fromX,y:hit.fromY}:(scene.hero||s);
   if(dead&&boss)victim.nameOffset=attachBossName(scene,ghost,campaigns.border.boss);
   const damageLabel=impact(scene,attacker,victim,lost);
   if(dead){fadeDefeatedEnemy(scene,victim,damageLabel);return}
   const dir=Math.atan2(ghost.y-attacker.y,ghost.x-attacker.x);
   const push=boss?2:5;
   scene.tweens.addCounter({from:0,to:1,duration:180,onUpdate:tween=>{
     if(!ghost.active)return;
     const t=tween.getValue(),k=Math.sin(Math.PI*t)*push;
     if(s.active)ghost.setPosition(s.x,s.y);
     else ghost.setPosition(hit?.x??s.toX,hit?.y??s.toY);
     ghost.x+=Math.cos(dir)*k;ghost.y+=Math.sin(dir)*k;
     const squeeze=victim.hit.amplitude*Math.cos(t*2*Math.PI)*(1-t);
     ghost.setScale(victim.hitBase*(1+squeeze),victim.hitBase*(1-squeeze));
     if(t>.4)ghost.setTexture(victim.normalTexture);
   },onComplete:()=>{
     if(s.hitGhost===ghost){s.hitGhost=null;if(s.active)s.setVisible(true)}
     if(ghost.active)ghost.destroy();
   }});
 }
 function drawWorld(){
   const now=performance.now(),gap=now-received;
   const continuingFight=!!local;
   const reset=!continuingFight||gap>400;
   if(!reset)interval=Math.min(160,Math.max(35,interval*.75+gap*.25));
   received=now;
   const keys=new Set();
   const draw=(k,...args)=>{keys.add(k);return sprite(k,...args)};
   for(const p of state.players){
     const u=draw('p'+p.index,p.x,p.y,commanderTexture(scene,state.level),COMMANDER_BATTLE_SCALE);
     u.bannerCommander=true;
     if(u.previousHealth!==undefined&&p.hp>u.previousHealth)showHealing(scene,u,p.hp-u.previousHealth);
     if(!reset&&p.hp<u.previousHealth)u.redFlashUntil=now+hitFlashMs;
     u.previousHealth=p.hp;
     u.setAlpha(p.down>0?.5:1).setAngle(p.down>0?70:0);
     if(p.index===state.you){scene.hero=u;
       const n=Math.max(1,Math.hypot(lastInput.x,lastInput.y));
       const lead=p.down?0:Math.min(roundTrip/2,60)*p.speed/1000/n;
       local={errorX:p.x+lastInput.x*lead-u.x,errorY:p.y+lastInput.y*lead-u.y};
       if(reset||Math.hypot(local.errorX,local.errorY)>42){u.setPosition(p.x,p.y);local.errorX=local.errorY=0}
}
     else u.setTint(0xc9e5ff);
     p.army.forEach((a,i)=>draw('a'+p.index+'-'+i,a.x,a.y,'man'+troopSkin(a.id,a.q),.333));
   }
   const fresh=state.effects.filter(f=>f.id>lastEffect);
   const nearestHit=(x,y)=>fresh.reduce((best,f)=>!best||Math.hypot(f.x-x,f.y-y)<Math.hypot(best.x-x,best.y-y)?f:best,null);
   for(const e of state.enemies){
     const s=draw('e'+e.id,e.x,e.y,enemyTexture(scene,'border',e.skin,e.boss),e.boss?BOSS_BATTLE_SCALE:e.elite?ELITE_BATTLE_SCALE:.33);
     if(e.boss&&!s.bossName)s.nameOffset=attachBossName(scene,s,campaigns.border.boss);
     const lost=(s.lastHp??e.max)-e.hp;
     if(lost>0&&!reset)localEnemyHit(s,lost,e.boss,false,nearestHit(e.x,e.y));
     s.lastHp=e.hp;s.wasBoss=e.boss;
   }
   for(const l of state.loot){
     const s=draw('l'+l.id,l.x,l.y,'silver-coin',l.box?.85:.55);
     if(l.box)s.setTint(0xffbd52);
   }
   for(const [k,s] of sprites)if(!keys.has(k)){
     if(k.startsWith('e')&&continuingFight&&s.lastHp>0)localEnemyHit(s,s.lastHp,s.wasBoss,true,nearestHit(s.toX,s.toY));
     s.destroy();sprites.delete(k);
   }
   for(const f of state.effects){
     if(f.id<=lastEffect)continue;lastEffect=f.id;
     scene.weaponEffect({id:f.weapon,q:f.q,s:{x:f.fromX,y:f.fromY,height:64,scaleY:.38}},
       {s:{x:f.x,y:f.y,height:64,scaleY:.33}});
   }
 }
 function showText(node,value){if(node.textContent!==value)node.textContent=value}
 function paint(){
   const p=state.players[state.you],other=state.players[1-state.you],me=state.me;
   $('field').classList.add('cooperative');
   status.hidden=state.phase==='lobby';exit.hidden=!['lobby','fight','refit'].includes(state.phase);
   showText(status,'房间 '+state.code+' · '+(state.you+1)+'P'+(other&&!other.online?' · 等待队友重连':''));
   if(state.phase==='fight'){
     showBattlefield(scene,'border');
     scene.mode='coopFight';$('modal').hidden=true;$('cover').hidden=true;$('battle-hud').hidden=false;menuKey='';
     showText($('level'),'Lv. '+state.level);showText($('money'),String(p.gold));
     $('life').style.width=100*p.hp/p.max+'%';$('experience').style.width=100*state.xp/(8+3*state.level)+'%';
     showText($('wave'),'第 '+state.wave+' / '+finalWave+' 波 · '+(state.wave===finalWave?'击败'+campaigns.border.boss:campaigns.border.army+' · '+Math.max(0,Math.ceil(state.time))+' 秒'));
     if(p.down||other?.down){const down=p.down?p:other;status.textContent=(p.down?'等待队友救援':'靠近倒地队友救援')+' · '+Math.ceil(down.down)+' 秒 · '+Math.floor(down.rescue/3*100)+'%'}
     drawWorld();return;
   }
   if(state.phase==='won'&&local)drawWorld();
   local=null;
   if((state.phase==='won'||state.phase==='refit')&&scene.fallenEnemies.getLength())return;
   for(const s of sprites.values())s.bossName?.setVisible(false);
   scene.mode='coopMenu';$('battle-hud').hidden=true;$('wave').textContent='';
   const id=[state.phase,state.wave,state.revision,state.players.length,other?.ready,other?.online,p.ready].join('/');
   if(state.phase==='refit'&&state.players.every(p=>!p.pending)&&!me.boxes.length&&other?.online)status.textContent+=' · 整备 '+Math.ceil(state.refitTime)+' 秒';
   if(menuKey===id)return;menuKey=id;
   const button=(m,name,type,slot,disabled)=>scene.button(m,name,()=>queue(type,slot),disabled);
   if(state.phase==='lobby'){
     status.hidden=true;partyRoom();
     return;
   }
   if(state.phase==='refit'){
     const title=me.pending?'战后升级':me.boxes.length?'战利品宝箱':'战地整备';
     const m=panel(title,'第 '+state.wave+' 波完成 · '+p.gold+' 银币');
     if(me.pending){
       const hand=document.createElement('div');hand.className='upgrade-hand';m.append(hand);
       const symbols={'体魄':'♥','力量':'⚔','步法':'➶','幸运':'♧','恢复':'✚'};
       me.choices.forEach((choice,i)=>{
         const card=button(hand,'','choose',i);card.className='upgrade-card';
         const icon=node('i','',symbols[choice]);icon.setAttribute('aria-hidden','true');
         card.append(icon,node('strong','',choice));
       });return;
     }
     if(me.boxes.length){const icon=node('div','loot-icon');icon.append(itemIcon(me.boxes[0]));m.querySelector('p').before(icon);m.querySelector('p').textContent=items[me.boxes[0]][0];button(m,'领取','claim',0,(me.bag[me.boxes[0]]||0)>=6);button(m,'回收','recycle',0);return}
     if(!p.ready){
       const cards=document.createElement('div');cards.id='cards';m.append(cards);
       me.offers.forEach((o,i)=>{
         const c=document.createElement('div');cards.append(c);if(!o){c.textContent='已售出';return}
         c.dataset.tier=o.q;
         const name=node('strong','',(o.merc?troops:items)[o.id][0]);
         const emblem=node('i','');emblem.setAttribute('aria-hidden','true');
         emblem.append(o.merc?mercenaryPortrait(scene,o):itemIcon(o.id));
         c.append(cardRank(o.q),emblem,name);
         const target=purchaseMergeTarget(p.army,o);
         if(target)c.append(node('small','','购买合成 '+roman[o.q+1]+' 阶'));
         const price=node('span','offer-price');price.textContent=o.price+' 银币';c.append(price);
         const buy=button(c,'','buy',i,p.gold<o.price||(o.merc?p.army.length>=armyCapacity&&!target:(me.bag[o.id]||0)>=6));buy.className='buy';buy.setAttribute('aria-label',(target?'购买合成':'购买')+name.textContent);
         button(c,o.lock?'解锁':'锁定','lock',i).setAttribute('aria-pressed',String(o.lock));
       });
       p.army.forEach((u,i)=>{
         const merge=p.army.some((v,j)=>j!==i&&v.id===u.id&&v.q===u.q)&&u.q<3;
         button(m,(merge?'合成 ':'遣散 ')+troops[u.id][0]+roman[u.q],merge?'merge':'dismiss',i);
       });
       const cost=refreshPrice(state.wave,me.refresh);button(m,'刷新 · '+cost,'refresh',0,p.gold<cost);
     }
     button(m,p.ready?'已准备 · 等待队友':'准备下一波','ready',0,p.ready);
     const hero=commanders.banner;
     appendCommanderStats(m,hero.name,[['团队等级',state.level],['装束',commanderForms[commanderForm(state.level)].name],['团队经验',state.xp],['生命',statNumber(p.hp)+' / '+p.max],
       ['普攻伤害',statNumber(hero.baseDamage*p.power)],['攻击间隔',statNumber(troops[hero.weapon][2]*.75)+' 秒'],
       ['攻击距离',hero.range],['移速',statNumber(p.speed)],['幸运',p.luck]]);
     return;
   }
   const m=panel(state.phase==='won'?campaigns.border.name+' · 合作告捷':state.phase==='closed'?'队友已退出房间':'小队倒下','第 '+state.wave+' 波 · 团队等级 '+state.level);
   scene.button(m,'返回主界面',stop);
 }
 async function poll(){
   if(!session)return;
   const active=session;
   const sent=performance.now();
   try{
     lastInput=input();
     const r=await api({...session,dx:lastInput.x,dy:lastInput.y,action:pending});
     roundTrip=performance.now()-sent;
     if(session!==active)return;state=r.state;if(pending&&state.seq>=pending.seq)pending=null;
     paint();
   }catch(e){
     if(session!==active)return;
     if(e.status===403||e.status===404){stop();showLobby(e.message);return}
     status.hidden=false;status.textContent='连接中断 · 正在恢复房间';
   }
   if(session){
     const period=state?.phase==='fight'?60:220;
     const delay=performance.now()-sent;
     timer=setTimeout(poll,delay>2000?350:Math.max(8,period-delay));
   }
 }
 scene.bondCounts=troops.map(()=>0);
 if(location.port==='8766'||location.port==='8767'){
   try{session=JSON.parse(sessionStorage.getItem(key))}catch{}
   if(session){exit.hidden=false;setTimeout(poll,0)}
   else if(new URLSearchParams(location.search).has('coop'))setTimeout(()=>$('coop-entry').click(),0);
 }
}
