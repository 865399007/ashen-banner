const finalWave=15;
const $=id=>document.getElementById(id), roman=['Ⅰ','Ⅱ','Ⅲ','Ⅳ'];
function cardRank(tier){
  const label=document.createElement('span');
  label.className='card-rank';
  label.textContent=roman[tier]+' 阶';
  return label;
}
// Calibrate the shared world scale against Rouge-main's 900-unit portrait view.
const portraitWorldWidth=270;
const referenceScale=portraitWorldWidth/900;
const startingSpeed=90;
const campaigns={
  border:{
    name:'黄巾之乱',army:'黄巾军',boss:'张角',colors:{shadow:'#8c591d',base:'#cf8f26',light:'#f1bf4e'},
    bossMove:'rocks',bossSkin:5,elites:[4,8],pace:1,march:1,bossHP:4800
  },
  camp:{
    name:'官渡之战',army:'袁绍军',boss:'袁绍',colors:{shadow:'#6b3547',base:'#a55363',light:'#da8b83'},
    bossMove:'volley',bossSkin:23,elites:[4,9],pace:.95,march:1,bossHP:5600
  },
  pass:{
    name:'赤壁之战',army:'曹军水师',boss:'曹操',colors:{shadow:'#343e55',base:'#596785',light:'#96adc1'},
    bossMove:'rocks',bossSkin:14,elites:[3,6,9],pace:1.15,march:.95,bossHP:6600
  },
  keep:{
    name:'合肥之战',army:'合肥守军',boss:'张辽',colors:{shadow:'#374944',base:'#607565',light:'#a0af89'},
    bossMove:'cleave',bossSkin:10,elites:[4,8,12],pace:1,march:.95,bossHP:7400
  },
  pursuit:{
    name:'夷陵之战',army:'东吴军',boss:'陆逊',colors:{shadow:'#783c2b',base:'#b65b3c',light:'#e39a62'},
    bossMove:'cleave',bossSkin:13,elites:[5,8],pace:.84,march:1.22,bossHP:4400
  }
};
function campaignOpposition(campaign){
  return '敌军：'+campaign.army+'　·　主将：'+campaign.boss;
}
const commanders={
  banner:{name:"灰旗指挥官",weapon:0,skin:6,range:63,baseDamage:17,
    passives:[
      {name:'旗手号令',description:'每招募一名在队佣兵，主角伤害提高 5%。',
       damageMultiplier:scene=>1+.05*scene.army.length},
      {name:'战地振奋',description:'小队每累计击败 5 名敌人，主角恢复 3 点生命。',
       onKill(scene){
         if(scene.kills%5===0)scene.healCommander(3);
       }}
    ]
  }
};
const soulTypes=[
  {general:'liubei',name:'刘备',weapon:'雌雄双股剑',stat:'haste',label:'攻速',values:[12,20,30]},
  {general:'zhaoyun',name:'赵云',weapon:'龙胆亮银枪',stat:'reach',label:'射程',values:[15,25,35]},
  {general:'huangzhong',name:'黄忠',weapon:'长弓',stat:'crit',label:'暴击率',values:[8,14,20]},
  {general:'xuhuang',name:'徐晃',weapon:'开山大斧',stat:'power',label:'伤害',values:[15,25,40]},
  {general:'caoren',name:'曹仁',weapon:'大盾与佩刀',stat:'guard',label:'减伤',values:[12,20,30]},
  {general:'zhugeliang',name:'诸葛亮',weapon:'诸葛连弩',stat:'crit',label:'暴击率',values:[8,14,20]},
  {general:'wuanguo',name:'武安国',weapon:'长柄铁锤',stat:'power',label:'伤害',values:[15,25,40]},
  {general:'dianwei',name:'典韦',weapon:'双铁戟',stat:'haste',label:'攻速',values:[12,20,30]},
  {general:'lvbu',name:'吕布',weapon:'方天画戟',stat:'reach',label:'射程',values:[15,25,35]},
  {general:'guanyu',name:'关羽',weapon:'青龙偃月刀',stat:'power',label:'伤害',values:[15,25,40]}
];
function armySoul(army){
  const counts=troops.map(()=>0);
  for(const unit of army)if(unit.q===3)counts[unit.id]++;
  const id=counts.findIndex(n=>n>=4);
  if(id<0)return null;
  const count=counts[id],type=soulTypes[id];
  return {id,count,type,bonus:type.values[count-4]/100};
}
const troopEmblems=['⚔','♜','➶','⚒','⬟','➴','⚒','⚔','⚑','♞'];
const troops=[['剑士',18,.8,31.5],['长枪兵',27,1.25,50],['长弓手',16,1.1,255*referenceScale],['斧兵',40,1.8,35],['盾兵',9,1.4,29],['弩兵',34,2,83],['战锤兵',36,1.85,34],['双匕首兵',10,.65,28],['长戟兵',31,1.5,44],['轻骑兵',43,3.5,57]];
const itemIcons=['whetstone','boots','badge','quiver','banner','reserve-arrows','chain-medal','satchel','bandage','permit','ward','horn','voucher','spear-socket','bounty','mark-flag','bracer','ration','pauldron','shield-order','crossbow'];
function itemIcon(id){
  const image=document.createElement('img');
  image.className='item-icon';image.alt='';image.src='assets/items/'+itemIcons[id]+'.svg';
  return image;
}
const itemStackLimit=6;
const items=[['粗磨刀石',0,'伤害 +8%'],['行军靴',0,'移速 +6%'],['斥候徽章',1,'幸运 +15'],['穿甲箭袋',2,'箭矢穿透 1 人，箭伤 -10%'],['百战军旗',3,'每击杀 12 名敌人，佣兵攻速 +20%，持续 5 秒'],['后备箭袋',1,'每第 5 次普通射击追加箭矢'],['连击勋章',2,'同一敌人累计受佣兵命中 5 次，追加一次伤害'],
 ['轻型行囊',0,'拾取范围 +20%'],['临时绷带',0,'每波开始恢复 6 生命'],
 ['拾荒许可',0,'拾取宝箱 +8 银币，移速 -1%'],['不屈战魂',3,'每波首次致命受击保留 1 生命'],
 ['战术号角',1,'羁绊协同冷却 -12%，移速 -2%'],['军需凭证',1,'下次整备免费刷新，佣兵伤害 -3%'],['短枪加固套',1,'长柄射程 +15%，攻击间隔 +5%'],['军功悬赏令',2,'本波首次击杀精英 +12 银币'],['战术标记旗',2,'命中首领 10 次，使其受到伤害 +12%，持续 4 秒'],
 ['旧皮护腕',0,'全队攻速 +5%，指挥官护甲 -1'],['军用干粮',0,'生命上限 +6，移速 -1%'],['铁制护肩',1,'指挥官减伤 +5%，移速 -3%'],['铁壁军令',2,'至少两名盾兵时护卫半径增至 70，护卫额外减伤 8%'],['破军重弩机',3,'每轮弩射追加 1 箭，装填间隔 +15%']];
const satchel=7,bandage=8,salvagePermit=9,lastStand=10;
const itemCap=id=>({3:1,5:2,6:1,[satchel]:3,[bandage]:4,[salvagePermit]:3,[lastStand]:1,4:1,11:2,12:2,13:3,14:2,15:1,19:1,20:1}[id]??itemStackLimit);
const pick=a=>a[Math.floor(Math.random()*a.length)],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const troopBasePrices=[10,12,13,15,11,15,16,12,14,18],itemBasePrices=[7,8,12,22,36,16,24,9,8,10,39,18,17,16,26,28,9,8,16,25,42];
function refitPrice(merc,id,q,wave){
 const base=merc?troopBasePrices[id]+9*q:itemBasePrices[id];
 return Math.floor(base+wave+base*wave/10);
}
function refreshPrice(wave,previous){
 return Math.floor(.75*wave)+(previous+1)*Math.max(1,Math.floor(.4*wave));
}
function tier(w,luck){let n=Math.random(),k=1+luck/100;
 return n<Math.min(.08,Math.max(0,w-7)*.0023*k)?3:n<Math.min(.25,Math.max(0,w-3)*.02*k)?2:n<Math.min(.6,Math.max(0,w-1)*.06*k)?1:0}

// Each row is a weighted patrol for the village, starting at the listed wave.
const villagePatrols=[
  [1,[3]],
  [2,[3,3,4]],
  [3,[3,3,4,9]],
  [5,[3,4,9,11,5]],
  [7,[4,5,9,11,10,12,8]],
  [10,[5,8,10,11,13,14,16]],
  [13,[5,8,10,13,14,15,16,23]]
];
function villageEnemy(wave){
  const patrol=villagePatrols.reduce((current,row)=>wave>=row[0]?row:current,villagePatrols[0]);
  return pick(patrol[1]);
}
const armyCapacity=6;
function purchaseMergeTarget(army,offer){
  if(!offer.merc||offer.q>=3)return null;
  if(army.length<armyCapacity && !(army.length===armyCapacity-1 && offer.q===2))return null;
  for(let i=army.length-1;i>=0;i--){
    const unit=army[i];
    if(unit.id===offer.id && unit.q===offer.q)return unit;
  }
  return null;
}
function recruitMercenary(army,offer,position){
  const target=purchaseMergeTarget(army,offer);
  if(target)target.q++;
  else if(army.length<armyCapacity)army.push({id:offer.id,q:offer.q,...position});
  else return false;
  return true;
}
function recruitOffer(pool,army){
   const classes=['melee','pole','bow','melee','guard','bow','heavy','melee','pole','horse'];
   const weights=pool.map(id=>army.some(a=>a.id===id)?4:army.some(a=>classes[a.id]===classes[id])?1.35:1);
   let r=Math.random()*weights.reduce((a,b)=>a+b,0);
   return pool[weights.findIndex(w=>(r-=w)<0)]??pool[0];
 }
if(typeof module!=='undefined'&&module.exports)module.exports={armyCapacity,purchaseMergeTarget,recruitMercenary,campaigns,recruitOffer,villageEnemy,troops,commanders,items,finalWave,tier,refitPrice,refreshPrice,pick,distance};
