'use strict';
const crypto=require('node:crypto');
const {wildBeasts,wildlifeArrivals,takeWildlife,eliteArrivalTimes,spawnDueElite,delayNextElite,recruitMercenary,campaigns,recruitOffer,villageEnemy,troops,commanders,items,finalWave,tier,refitPrice,refreshPrice,pick,distance}=require('./rules');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function move(a,b,amount){
  const d=distance(a,b);if(!d)return;
  const k=Math.min(1,amount/d);a.x+=(b.x-a.x)*k;a.y+=(b.y-a.y)*k;
}
function nearest(a,units){return units.reduce((best,b)=>!best||distance(a,b)<distance(a,best)?b:best,null)}
function player(hero,index){
  return {hero:Object.hasOwn(commanders,hero)?hero:'banner',index,token:crypto.randomUUID(),seen:Date.now(),seq:0,revision:0,
    x:470+index*22,y:300,dx:0,dy:0,hp:100,max:100,down:0,rescue:0,cd:0,invul:0,speed:120,power:1,luck:0,gold:0,
    army:[],bag:{},pending:0,choices:[],boxes:[],offers:[],refresh:0,ready:false};
}
function room(code){return {code,phase:'lobby',wave:1,level:1,xp:0,time:0,spawn:0,serial:0,players:[],enemies:[],loot:[],effects:[],clock:0}}
function start(r){
  r.phase='fight';r.time=30+5*(r.wave-1);r.spawn=0;r.enemies=[];r.loot=[];r.effects=[];
  for(const p of r.players){p.ready=false;p.hp=clamp(p.hp+15,1,p.max);p.invul=1;p.down=p.rescue=p.dx=p.dy=0;p.revision++}
  if(r.wave===finalWave)spawn(r,true);
  r.wildlifeArrivals=wildlifeArrivals(r.wave,r.time);
  r.eliteArrivals=eliteArrivalTimes(r.wave,r.time);
}
function spawn(r,boss=false,elite=false,wildlife=null){
  const h=pick(r.players.filter(p=>p.hp>0));if(!h)return;
  const angle=Math.random()*Math.PI*2;
  const hp=wildlife?wildBeasts[wildlife].health+3*r.wave:boss?Math.round(campaigns.border.bossHP*1.5):(14+4*r.wave)*(elite?5:1);
  r.enemies.push({id:++r.serial,skin:wildlife??(boss?campaigns.border.bossSkin:elite?pick([3,4,5]):villageEnemy(r.wave)),x:clamp(h.x+140*Math.cos(angle),10,950),y:clamp(h.y+140*Math.sin(angle),20,585),hp,max:hp,boss,elite});
}
function hand(p){p.choices=['体魄','力量','步法','幸运','恢复'];for(let i=4;i>0;i--){let j=Math.floor(Math.random()*(i+1));[p.choices[i],p.choices[j]]=[p.choices[j],p.choices[i]]}p.choices.length=4}
const goods=[0,1,2,17];
function roll(r,p){
 const offers=p.offers||[];let m=offers.filter(o=>o?.lock&&o.merc).length;
 let n=offers.filter(o=>o?.lock&&!o.merc).length;
 for(let i=0;i<4;i++){if(offers[i]?.lock)continue;
   const merc=r.wave<=2?Math.random()<(2-m)/(4-m-n):Math.random()<.35;
   const id=merc?recruitOffer(troops.map((_,id)=>id),p.army):pick(goods);
   const q=merc?tier(r.wave,p.luck):items[id][1];
   offers[i]={merc,id,q,price:refitPrice(merc,id,q,r.wave),lock:false};if(merc)m++;else n++;
 }
 p.offers=offers;
}
function refit(r){
 r.phase='refit';r.refitTime=25;r.enemies=[];r.loot=[];
 for(const p of r.players){p.refresh=0;p.ready=false;p.offers=p.offers.map(o=>o?.lock?o:null);roll(r,p);if(p.pending)hand(p);p.revision++}
}
function item(p,id){
 p.bag[id]=(p.bag[id]||0)+1;
 if(id===0)p.power+=.08;
 if(id===1)p.speed*=1.06;
 if(id===2)p.luck+=15;
 if(id===17){p.max+=6;p.hp=Math.min(p.max,p.hp+6);p.speed*=.99}
}
function hit(r,p,a,e,damage){
 r.effects.push({id:++r.serial,x:e.x,y:e.y,fromX:a.x,fromY:a.y,weapon:a===p?commanders.banner.weapon:a.id,q:a.q||0,until:r.clock+.24});
 e.hp-=damage;
 if(e.hp>0)return;
 r.enemies.splice(r.enemies.indexOf(e),1);
 if(e.boss){r.phase='won';return}
 if(e.elite)delayNextElite(r.eliteArrivals,r.time);
 r.loot.push({id:++r.serial,x:e.x,y:e.y,box:Math.random()<.015});
}
function tick(r,dt,now=Date.now()){
 if(r.players.some(p=>now-p.seen>2500))return;
 if(r.phase==='refit'&&r.players.every(p=>!p.pending&&!p.boxes.length)){
   r.refitTime-=dt;if(r.refitTime<=0){r.wave++;start(r)}return;
 }
 if(r.phase!=='fight')return;
 r.clock+=dt;r.time-=dt;r.spawn-=dt;r.effects=r.effects.filter(f=>f.until>r.clock);
 spawnDueElite(r.eliteArrivals,r.time,r.enemies,()=>spawn(r,false,true));
 if(r.spawn<=0&&r.enemies.length<75){spawn(r,false,false,takeWildlife(r.wildlifeArrivals,r.time,'border',r.wave));r.spawn=Math.max(.32,.85-r.wave*.035)}
 for(const p of r.players){
   if(p.hp<=0)continue;
   const d=Math.max(1,Math.hypot(p.dx,p.dy));p.x=clamp(p.x+p.dx/d*p.speed*dt,12,948);p.y=clamp(p.y+p.dy/d*p.speed*dt,24,584);
   p.invul-=dt;
   for(const [i,a] of [p,...p.army].entries()){
     const stats=i?troops[a.id]:null;
     if(i){const angle=2*Math.PI*(i-1)/p.army.length;move(a,{x:p.x+31*Math.cos(angle),y:p.y+31*Math.sin(angle)},210*dt)}
     a.cd-=dt;const e=nearest(a,r.enemies);
     const c=commanders.banner;
     if(e&&a.cd<=0&&distance(a,e)<(stats?stats[3]:c.range)){
       hit(r,p,a,e,(stats?stats[1]*[1,1.32,1.72,2.22][a.q]:c.baseDamage)*p.power);
       a.cd=(stats?stats[2]:troops[c.weapon][2])*.75;if(r.phase!=='fight')return;
     }
   }
 }
 for(const e of r.enemies){
   const p=nearest(e,r.players.filter(p=>p.hp>0));if(!p)break;
   const beast=wildBeasts[e.skin];
   move(e,p,(beast?beast.speed+r.wave:(27+r.wave)*1.4)*dt);
   if(distance(e,p)<(beast?.reach??15)&&p.invul<=0){p.hp=Math.max(0,p.hp-(e.boss?22:(beast?.damage??6)+r.wave));p.invul=.5;if(!p.hp){p.down=15;p.rescue=0}}
 }
 if(r.players.every(p=>p.hp<=0)){r.phase='lost';return}
 for(const p of r.players.filter(p=>p.hp<=0)){
   p.down-=dt;const ally=r.players[1-p.index];
   p.rescue=ally.hp>0&&distance(p,ally)<=30?p.rescue+dt:0;
   if(p.rescue>=3){p.hp=Math.ceil(p.max*.3);p.invul=1.5;p.rescue=p.down=0}
   else if(p.down<=0){r.phase='lost';return}
 }
 for(let i=r.loot.length-1;i>=0;i--){
   const l=r.loot[i],p=nearest(l,r.players.filter(p=>p.hp>0));if(!p)continue;
   if(distance(l,p)<70)move(l,p,220*dt);
   if(distance(l,p)>13)continue;
   r.loot.splice(i,1);p.gold+=2;if(l.box)p.boxes.push(pick(goods));r.xp++;
   if(r.xp>=8+r.level*3){r.xp-=8+r.level*3;r.level++;for(const teammate of r.players)teammate.pending++}
 }
 if(r.time<=0&&r.wave<finalWave&&r.players.every(p=>p.hp>0))refit(r);
}
function action(r,p,a){
 if(!a||!Number.isSafeInteger(a.seq)||a.seq<=p.seq)return;
 p.seq=a.seq;
 if(a.type==='leave'){r.phase='closed';return}
 if(a.rev!==p.revision)return;
 if(a.type==='ready'&&r.players.length===2&&(r.phase==='lobby'||(r.phase==='refit'&&!p.pending&&!p.boxes.length))){
   p.ready=true;p.revision++;
   if(r.players.every(p=>p.ready)){if(r.phase==='refit')r.wave++;start(r)}return;
 }
 if(r.phase!=='refit'||p.ready)return;
 const i=a.slot;if(!Number.isInteger(i)||i<0||i>5)return;
 if(p.pending){
   if(a.type!=='choose'||!p.choices[i])return;
   switch(p.choices[i]){case '体魄':p.max+=10;p.hp+=10;break;case '力量':p.power+=.08;break;case '步法':p.speed+=5;break;case '幸运':p.luck+=8;break;case '恢复':p.hp=Math.min(p.max,p.hp+25);break}
   p.pending--;if(p.pending)hand(p);
 }else if(p.boxes.length){
   if(!['claim','recycle'].includes(a.type))return;
   const id=p.boxes[0];if(a.type==='claim'&&(p.bag[id]||0)>=6)return;
   p.boxes.shift();if(a.type==='claim')item(p,id);else p.gold+=Math.max(1,Math.floor(refitPrice(false,id,0,r.wave)/4));
 }else if(a.type==='refresh'){
   const price=refreshPrice(r.wave,p.refresh);if(p.gold<price)return;p.gold-=price;p.refresh++;roll(r,p);
 }else if(a.type==='merge'){
   const u=p.army[i];if(!u||u.q>=3)return;
   const j=p.army.findIndex((b,k)=>k!==i&&b.id===u.id&&b.q===u.q);if(j<0)return;u.q++;p.army.splice(j,1);
 }else if(a.type==='dismiss'){if(!p.army[i])return;p.army.splice(i,1)}
 else{
   const o=p.offers[i];if(!o)return;
   if(a.type==='lock')o.lock=!o.lock;
   else if(a.type==='buy'){
     if(p.gold<o.price)return;
     if(o.merc){
       if(!recruitMercenary(p.army,o,{x:p.x,y:p.y,cd:.2}))return;
     }else{
       if((p.bag[o.id]||0)>=6)return;
       item(p,o.id);
     }
     p.gold-=o.price;p.offers[i]=null;
   }else return;
 }
 p.revision++;
}
function snapshot(r,p){
 return {code:r.code,phase:r.phase,wave:r.wave,time:r.time,refitTime:r.refitTime,level:r.level,xp:r.xp,you:p.index,seq:p.seq,revision:p.revision,
   players:r.players.map(({token,offers,choices,boxes,bag,...v})=>({...v,online:Date.now()-v.seen<=2500})),
   me:{gold:p.gold,offers:p.offers,choices:p.choices,pending:p.pending,boxes:p.boxes,refresh:p.refresh,bag:p.bag},
   enemies:r.enemies,loot:r.loot,effects:r.effects};
}
module.exports={room,player,tick,action,snapshot};
