const gameFontFamily=typeof wx!=='undefined' && wx.loadFont
  ? (wx.loadFont('assets/fonts/banner-sans.ttf') || 'sans-serif')
  : '"Banner Sans", sans-serif';
const finalWave=15;
function startFinalGuards(){
  return {remaining:96,wait:.3};
}
function stepFinalGuards(guards,dt,enemies,spawn){
  if(!guards.remaining)return;
  guards.wait-=dt;
  if(guards.wait>0)return;
  guards.wait=.75+Math.random()*.4;
  const active=enemies.filter(e=>!e.boss&&!e.elite&&e.hp>0).length;
  if(active>=16)return;
  spawn();
  guards.remaining--;
}
function waveDurationSeconds(wave){
  const duration=30+5*(wave-1);
  return wave===finalWave?duration:Math.min(duration,60);
}
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
    wildlife:'wolf',
    event:'fire',
    name:'黄巾之乱',army:'黄巾军',boss:'张角',colors:{shadow:'#8c591d',base:'#cf8f26',light:'#f1bf4e'},
    bossMove:'rocks',bossSkin:5,pace:1,march:1,bossHP:4800
  },
  camp:{
    wildlife:'wolf',
    name:'官渡之战',army:'袁绍军',boss:'袁绍',colors:{shadow:'#6b3547',base:'#a55363',light:'#da8b83'},
    bossMove:'volley',bossSkin:23,pace:.95,march:1,bossHP:5600
  },
  pass:{
    wildlife:'snake',
    event:'rocks',
    name:'赤壁之战',army:'曹军水师',boss:'曹操',colors:{shadow:'#343e55',base:'#596785',light:'#96adc1'},
    bossMove:'rocks',bossSkin:14,pace:1.15,march:.95,bossHP:6600
  },
  keep:{
    wildlife:'wolf',
    event:'tower',
    name:'合肥之战',army:'合肥守军',boss:'张辽',colors:{shadow:'#374944',base:'#607565',light:'#a0af89'},
    bossMove:'cleave',bossSkin:10,pace:1,march:.95,bossHP:7400
  },
  pursuit:{
    predator:'tiger',wildlife:'boar',
    name:'夷陵之战',army:'东吴军',boss:'陆逊',colors:{shadow:'#783c2b',base:'#b65b3c',light:'#e39a62'},
    bossMove:'cleave',bossSkin:13,pace:.84,march:1.22,bossHP:4400
  },
  xiapi:{
    wildlife:'snake',
    name:'下邳之战',army:'并州军',boss:'吕布',colors:{shadow:'#5d3141',base:'#963e4d',light:'#e9bb7c'},
    bossMove:'cleave',bossSkin:9,pace:.96,march:1.03,bossHP:7600
  },
  tongguan:{
    wildlife:'boar',
    name:'潼关之战',army:'关西联军',boss:'马超',colors:{shadow:'#3c535b',base:'#738f94',light:'#e4e1cb'},
    bossMove:'cleave',bossSkin:11,pace:.92,march:1.15,bossHP:8000
  },
  dingjun:{
    predator:'bear',wildlife:'boar',
    name:'定军山之战',army:'汉中守军',boss:'夏侯渊',colors:{shadow:'#464931',base:'#797b45',light:'#d0b478'},
    event:'rocks',
    bossMove:'volley',bossSkin:5,pace:1,march:1.06,bossHP:8400
  },
  fancheng:{
    wildlife:'snake',
    name:'樊城之战',army:'樊城守军',boss:'曹仁',colors:{shadow:'#38445c',base:'#526e93',light:'#a8bfd4'},
    event:'tower',
    bossMove:'hammer',bossSkin:10,pace:.94,march:1,bossHP:9000
  },
  wuzhang:{
    wildlife:'wolf',
    name:'五丈原之战',army:'曹魏关中军',boss:'司马懿',colors:{shadow:'#403348',base:'#665474',light:'#b5a4bb'},
    bossMove:'rocks',bossSkin:14,pace:.90,march:1.08,bossHP:9600
  },
  bailang:{
    predator:'tiger',wildlife:'wolf',
    name:'白狼山之战',army:'乌桓骑军',boss:'蹋顿',colors:{shadow:'#61412e',base:'#94704e',light:'#dcc19b'},
    bossMove:'volley',bossSkin:5,pace:.91,march:1.15,bossHP:9900
  },
  changban:{
    wildlife:'wolf',
    name:'长坂坡之战',army:'虎豹骑',boss:'曹纯',colors:{shadow:'#343c49',base:'#596574',light:'#c49562'},
    bossMove:'cleave',bossSkin:11,pace:.88,march:1.18,bossHP:10400
  },
  jieting:{
    predator:'bear',wildlife:'boar',
    name:'街亭之战',army:'蜀汉守军',boss:'马谡',colors:{shadow:'#4c4630',base:'#7e794a',light:'#cbb480'},
    event:'rocks',bossMove:'rocks',bossSkin:14,pace:.92,march:1.09,bossHP:10900
  },
  shiting:{
    wildlife:'snake',
    name:'石亭之战',army:'曹魏东征军',boss:'曹休',colors:{shadow:'#5e3940',base:'#935457',light:'#cdad83'},
    bossMove:'volley',bossSkin:5,pace:.88,march:1.12,bossHP:11400
  },
  jiange:{
    predator:'bear',wildlife:'boar',
    name:'剑阁之战',army:'伐蜀魏军',boss:'钟会',colors:{shadow:'#414354',base:'#6a7286',light:'#b8b7a7'},
    event:'tower',bossMove:'cleave',bossSkin:10,pace:.86,march:1.12,bossHP:12000
  },
  jieqiao:{
    wildlife:'wolf',
    name:'界桥之战',army:'幽州骑军',boss:'公孙瓒',colors:{shadow:'#424f59',base:'#829295',light:'#e2dcd1'},
    roster:[8,8,4,11,5],
    bossMove:'cleave',bossSkin:11,pace:.88,march:1.14,bossHP:12500
  },
  chencang:{
    wildlife:'wolf',
    name:'陈仓之围',army:'凉州联军',boss:'王国',colors:{shadow:'#624537',base:'#ab7651',light:'#d5b389'},
    roster:[8,9,13,16,23],event:'fire',
    bossMove:'volley',bossSkin:5,pace:.85,march:1.13,bossHP:13000
  },
  jingxian:{
    predator:'tiger',wildlife:'boar',
    name:'泾县之战',army:'山越部众',boss:'祖郎',colors:{shadow:'#3b4c39',base:'#718457',light:'#bbbd86'},
    roster:[5,9,12,12,14],event:'rocks',
    bossMove:'cleave',bossSkin:9,pace:.86,march:1.17,bossHP:13600
  },
  xiangping:{
    wildlife:'snake',
    name:'襄平之战',army:'辽东守军',boss:'公孙渊',colors:{shadow:'#45394f',base:'#78627b',light:'#bcabb3'},
    roster:[10,10,11,5,23],event:'tower',
    bossMove:'volley',bossSkin:23,pace:.83,march:1.13,bossHP:14300
  },
  nanzhong:{
    predator:'tiger',wildlife:'snake',
    name:'南中之战',army:'南中部众',boss:'孟获',colors:{shadow:'#62423c',base:'#a06250',light:'#d5b474'},
    roster:[4,9,11,13,15],
    bossMove:'hammer',bossSkin:13,pace:.82,march:1.15,bossHP:15000
  }
};
const stageOrder=Object.keys(campaigns);
// Saddle coordinates are fractions of each mount's trimmed illustration.
const mountRoster=[
  ['taotie','饕餮','四凶',.45,.37],['qiongqi','穷奇','四凶',.46,.42],
  ['taowu','梼杌','四凶',.43,.34],['hundun','混沌','四凶',.51,.16],
  ['qinglong','青龙','四象',.40,.54],['baihu','白虎','四象',.49,.32],
  ['zhuque','朱雀','四象',.54,.53],['xuanwu','玄武','四象',.40,.31],
  ['bifang','毕方','山海异兽',.48,.42],
  ['jiuwei','九尾狐','山海异兽',.66,.54],
  ['zhulong','烛龙','山海异兽',.47,.54]
].map(([id,name,group,x,y])=>({id,name,group,x,y}));
const wildBeasts={
  tiger:{name:'山虎',speed:55,health:58,move:'pounce',habit:'伏低身躯后沿预警线扑出，向侧面移动可避开。'},
  bear:{name:'黑熊',speed:34,health:78,move:'swipe',habit:'抬起前爪后横扫身前，退出扇形即可躲避。'},
  wolf:{name:'山狼',speed:66,health:15,reach:12,damage:4,habit:'步伐快，会贴近指挥官撕咬。'},
  boar:{name:'野猪',speed:35,health:29,reach:14,damage:6,habit:'靠近时会低头蓄力，随后沿直线冲撞。'},
  snake:{name:'泽蛇',speed:44,health:12,reach:10,damage:4,habit:'贴地游动，近身后啮咬。'}
};
function wildlifeArrivals(wave,duration){
  if(wave===finalWave)return [];
  const first=duration-(7+Math.random()*5);
  return wave<=3?[first]:[first,duration*(.26+Math.random()*.12)];
}
const predatorWaves=[4,8,12];
function takeWildlife(arrivals,timeLeft,stageKey,wave){
  if(!arrivals.length||timeLeft>arrivals[0])return null;
  arrivals.shift();
  const campaign=campaigns[stageKey];
  if(campaign.predator&&!arrivals.length&&predatorWaves.includes(wave))return campaign.predator;
  return campaign.wildlife;
}
const firstEliteWave=6;
const eliteRecoverySeconds=6;
function eliteArrivalTimes(wave,duration){
  if(wave<firstEliteWave)return [];
  const count=wave<10?3:wave<13?4:5;
  const first=duration/2,last=5;
  const interval=(first-last)/(count-1);
  return Array.from({length:count},(_,i)=>first-i*interval);
}
function spawnDueElite(arrivals,timeLeft,enemies,spawn){
  if(!arrivals.length||timeLeft<4||timeLeft>arrivals[0])return;
  if(enemies.some(enemy=>enemy.elite))return;
  arrivals.shift();
  spawn();
}
function delayNextElite(arrivals,timeLeft){
  if(arrivals.length)arrivals[0]=Math.min(arrivals[0],timeLeft-eliteRecoverySeconds);
}
function campaignOpposition(campaign){
  return '敌军：'+campaign.army+'　·　主将：'+campaign.boss;
}
const commanders={
  banner:{name:"灰旗指挥官",weapon:0,skin:6,range:63,baseDamage:17,
    passives:[
      {name:'旗手号令',description:'每招募一名在队佣兵，主角伤害提高 5%。',
       damageMultiplier:scene=>1+.05*(scene.actors?.length?scene.actors.length-1:scene.army.length)},
      {name:'战地振奋',description:'小队每累计击败 5 名敌人，主角恢复 3 点生命。',
       onKill(scene){
         if(scene.kills%5===0)scene.healCommander(3);
       }}
    ]
  }
};
function bondTier(count){return Math.min(3,Math.floor((count||0)/2))}
const soulBaseRangePercent=28;
const soulSecondaryDamage=.6;
const soulAttackBonusPercent=[15,25,35,50];
function soulAttackMultiplier(level){return 1+soulAttackBonusPercent[level-1]/100}
const soulTypes=[
  {general:'liubei',name:'刘备',weapon:'雌雄双股剑',stat:'haste',label:'攻速',values:[6,12,20,30]},
  {general:'zhaoyun',name:'赵云',weapon:'龙胆亮银枪',stat:'reach',label:'射程',values:[8,15,25,35]},
  {general:'huangzhong',name:'黄忠',weapon:'长弓',stat:'crit',label:'暴击率',values:[4,8,14,20]},
  {general:'xuhuang',name:'徐晃',weapon:'开山大斧',stat:'power',label:'伤害',values:[8,15,25,40]},
  {general:'caoren',name:'曹仁',weapon:'大盾与佩刀',stat:'guard',label:'减伤',values:[6,12,20,30]},
  {general:'zhugeliang',name:'诸葛亮',weapon:'诸葛连弩',stat:'crit',label:'暴击率',values:[4,8,14,20]},
  {general:'wuanguo',name:'武安国',weapon:'长柄铁锤',stat:'power',label:'伤害',values:[8,15,25,40]},
  {general:'dianwei',name:'典韦',weapon:'双铁戟',stat:'haste',label:'攻速',values:[6,12,20,30]},
  {general:'lvbu',name:'吕布',weapon:'方天画戟',stat:'reach',label:'射程',values:[8,15,25,35]},
  {general:'guanyu',name:'关羽',weapon:'青龙偃月刀',stat:'power',label:'伤害',values:[8,15,25,40]},
  {general:'huatuo',name:'华佗',weapon:'药葫芦',stat:'healing',label:'医术治疗量',values:[10,18,26,35]}
];
function armySouls(army){
  const counts=troops.map(()=>0);
  for(const unit of army)if(unit.q===3)counts[unit.id]++;
  const souls=[];
  counts.forEach((count,id)=>{
    if(count<3)return;
    const level=count-2,type=soulTypes[id];
    souls.push({id,count,level,type,bonus:type.values[level-1]/100});
  });
  return souls;
}
const troopEmblems=['⚔','♜','➶','⚒','⬟','➴','⚒','⚔','⚑','♞','✧'];
const troops=[['剑士',18,.8,31.5],['长枪兵',27,1.25,50],['长弓手',16,1.1,320*referenceScale],['斧兵',40,1.8,35],['盾兵',11,1.4,29],['弩兵',30,2,78],['战锤兵',36,1.85,34],['双匕首兵',10,.65,28],['长戟兵',31,1.5,44],['轻骑兵',43,3.2,70],['医师',8,1.4,64]];
const medicId=10;
const medicTreatmentRange=112;
const medicTreatmentInterval=4.2;
function medicNeedlePower(count){return 1+.1*bondTier(count)}
function medicPulseCount(rank){return rank+1}
function medicPulseAmount(rank,hp,max){return rank===3&&hp<max*.4?4.4:2.6}
const jadeNeedle=36,medicineBook=37;
const medicineGear=[jadeNeedle,medicineBook];
function treatmentAmount(base,bag){return base+Number(!!bag[jadeNeedle])}
function treatmentPulses(count,bag){return count+Number(!!bag[medicineBook])}
const poisonTickSeconds=.5;
function applyPoison(enemy,now,potency){
  let status=enemy.poison;
  if(!status||status.until<now)status=enemy.poison={doses:[],next:now+poisonTickSeconds,rampSteps:0};
  if(status.doses.length===5)status.doses.shift();
  status.doses.push(potency);
  status.until=now+4;
}
function poisonTick(enemy,now){
  const status=enemy.poison;
  if(!status)return 0;
  if(now>=status.next&&status.next<=status.until+.00001){
    status.next+=poisonTickSeconds;
    const multiplier=1+status.rampSteps*.1;
    status.rampSteps=Math.min(10,status.rampSteps+1);
    return status.doses.reduce((total,dose)=>total+dose,0)*poisonTickSeconds*multiplier;
  }
  if(now>status.until)delete enemy.poison;
  return 0;
}
// Item IDs are also stored in saved blueprint lists. Append new equipment after the original set.
const bladeWrap=21,poleFerrule=22,heavyGrip=23,riderSpurs=24,
  finishingBlade=25,formationSpike=26,siegeHead=27,chargeStandard=28;
const herbPowder=29,coinPurse=30,scaleVest=31,fieldNeedles=32,tigerManual=33,heartMirror=34,guardSeal=35;
const footBlades=[0,4,7],polearms=[1,8],heavyWeapons=[3,6];
const weaponTroops={
  3:[2,5],5:[2,5],13:polearms,19:[4],20:[5],
  [bladeWrap]:footBlades,[finishingBlade]:footBlades,[poleFerrule]:polearms,[formationSpike]:polearms,
  [heavyGrip]:heavyWeapons,[siegeHead]:heavyWeapons,[riderSpurs]:[9],[chargeStandard]:[9],
  [jadeNeedle]:[medicId],[medicineBook]:[medicId]
};
const needsBlueprint=id=>id>=11&&id<=20;
function equippedFor(bag,item,troop){return bag[item]>0&&weaponTroops[item].includes(troop)}
const itemIcons=['whetstone','boots','badge','quiver','banner','reserve-arrows','chain-medal','satchel','bandage','permit','ward','horn','voucher','spear-socket','bounty','mark-flag','bracer','ration','pauldron','shield-order','crossbow','blade-wrap','pole-ferrule','heavy-grip','rider-spurs','finishing-blade','formation-spike','siege-head','charge-standard','herb-powder','coin-purse','scale-vest','field-needles','tiger-manual','heart-mirror','guard-seal','jade-needle','medicine-book'];
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
 ['旧皮护腕',0,'全队攻速 +5%，指挥官护甲 -1'],['军用干粮',0,'生命上限 +6，移速 -1%'],['铁制护肩',1,'指挥官减伤 +5%，移速 -3%'],['铁壁军令',2,'至少两名盾兵时护卫半径增至 70，护卫额外减伤 8%'],['破军重弩机',3,'每轮弩射追加 1 箭，装填间隔 +15%'],
 ['缠丝刀柄',2,'剑士、盾兵、双匕首兵攻速 +15%'],['雁翎枪箍',2,'长枪兵、长戟兵攻击距离 +18%'],
 ['配重铁芯',2,'斧兵、战锤兵伤害 +15%'],['鎏铜马镫',2,'轻骑兵冲锋间隔缩短 15%'],
 ['断锋宝刃',3,'剑士、盾兵、双匕首兵对半血及以下敌人伤害 +25%'],['破阵戟牙',3,'长枪兵、长戟兵一次攻击中对主目标以外的敌人伤害 +45%'],
 ['破城玄铁',3,'斧兵、战锤兵对精英和主将伤害 +35%'],['骁骑冲阵旗',3,'轻骑兵冲锋命中时，波及半径 +50%'],
 ['黄芪散',1,'拾取杜康酒坛时额外恢复 5 生命'],['军饷钱串',1,'每波开始获得 3 银币'],
 ['鱼鳞甲',2,'指挥官护甲 +2'],['行医针囊',2,'击杀精英时恢复 8 生命'],
 ['虎符兵书',3,'佣兵攻速 +10%'],['护心宝镜',3,'指挥官受击后的无敌时间延长 0.15 秒'],
 ['羽林将印',3,'全队暴击率 +4 个百分点'],
 ['玉柄金针',2,'医师、华佗每次基础治疗量 +1'],['青囊医书',3,'医师、华佗每轮施治追加 1 次治疗']];
const satchel=7,bandage=8,salvagePermit=9,lastStand=10;
const itemCap=id=>id>=bladeWrap&&id<=chargeStandard?1:({3:1,5:2,6:1,[satchel]:3,[bandage]:4,[salvagePermit]:3,[lastStand]:1,4:1,11:2,12:2,13:3,14:2,15:1,19:1,20:1,[herbPowder]:3,[coinPurse]:2,[scaleVest]:2,[fieldNeedles]:2,[tigerManual]:2,[heartMirror]:2,[guardSeal]:2,[jadeNeedle]:1,[medicineBook]:1}[id]??itemStackLimit);
const equipmentCapacity=12;
function equippedCount(bag){return Object.values(bag).filter(count=>count>0).length}
function canEquipItem(bag,id){return (bag[id]||0)<itemCap(id)&&(bag[id]>0||equippedCount(bag)<equipmentCapacity)}
const pick=a=>a[Math.floor(Math.random()*a.length)],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const troopBasePrices=[10,12,13,15,11,15,16,12,14,18,14],itemBasePrices=[7,8,12,22,36,16,24,9,8,10,39,18,17,16,26,28,9,8,16,25,42,23,24,25,24,39,41,42,40,14,16,25,24,41,42,40,24,40];
function refitPrice(merc,id,q,wave){
 const base=merc?troopBasePrices[id]+9*q:itemBasePrices[id];
 return Math.floor(base+wave+base*wave/10);
}
function itemSaleValue(id,wave){return Math.max(1,Math.floor(refitPrice(false,id,items[id][1],wave)/4))}
function equipmentSpeedFactor(bag){
 return 1.06**(bag[1]||0)*.99**((bag[salvagePermit]||0)+(bag[17]||0))*.98**(bag[11]||0)*.97**(bag[18]||0);
}
function refreshPrice(wave,previous){
 return Math.floor(.75*wave)+(previous+1)*Math.max(1,Math.floor(.4*wave));
}
function tier(w,luck){let n=Math.random(),k=1+luck/100;
 return n<Math.min(.08,Math.max(0,w-7)*.0023*k)?3:n<Math.min(.25,Math.max(0,w-3)*.02*k)?2:n<Math.min(.6,Math.max(0,w-1)*.06*k)?1:0}

function eliteChestTier(wave){
 const roll=Math.random();
 if(wave>=8)return roll<.30?3:roll<.80?2:1;
 return roll<(wave>=4?.55:.25)?2:1;
}

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
   const classes=['melee','pole','bow','melee','guard','bow','heavy','melee','pole','horse','medicine'];
   const weights=pool.map(id=>army.some(a=>a.id===id)?4:army.some(a=>classes[a.id]===classes[id])?1.35:1);
   let r=Math.random()*weights.reduce((a,b)=>a+b,0);
   return pool[weights.findIndex(w=>(r-=w)<0)]??pool[0];
 }
if(typeof module!=='undefined'&&module.exports)module.exports={mountRoster,medicTreatmentRange,medicTreatmentInterval,medicNeedlePower,medicineGear,treatmentAmount,treatmentPulses,medicId,medicPulseCount,medicPulseAmount,equipmentSpeedFactor,itemSaleValue,equipmentCapacity,equippedCount,canEquipItem,wildBeasts,wildlifeArrivals,takeWildlife,eliteArrivalTimes,spawnDueElite,delayNextElite,armyCapacity,purchaseMergeTarget,recruitMercenary,campaigns,recruitOffer,villageEnemy,troops,commanders,items,finalWave,startFinalGuards,stepFinalGuards,waveDurationSeconds,tier,refitPrice,refreshPrice,pick,distance};
