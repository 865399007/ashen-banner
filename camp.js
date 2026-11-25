const campKey='ashen-banner.camp.v1';
const drills=[
  ['vigor','体能训练','指挥官生命上限 +5'],
  ['arms','战斗训练','佣兵伤害 +2%'],
  ['sense','战场嗅觉','银币吸附范围 +5%'],
  ['supply','补给准备','出发银币 +2']
];
class GreyCamp {
  constructor(){
    this.data={silver:0,iron:0,medals:0,victories:0,best:0,axe:false,veteran:false,firstElites:[],training:{},stages:{},contracts:[],blueprints:[]};
    try{
      const saved=JSON.parse(localStorage.getItem(campKey)||'null');
      if(saved){
        Object.assign(this.data,saved);
        if(!saved.contracts)this.data.contracts=[5,9];
        // Earlier saves had a global record only. Keep previously playable stages accessible.
        if(!saved.stages)this.data.legacyStages=['border','pass','pursuit'];
      }
    }catch{this.saveWarning=true}
  }
  stageOpen(key){
    const i=stageOrder.indexOf(key);
    return i===0||this.data.legacyStages?.includes(key)||Boolean(this.data.stages[stageOrder[i-1]]?.wins);
  }
  troopOpen(id){return id===3?this.data.axe:![5,9].includes(id)||this.data.contracts.includes(id)}
  itemOpen(id){return id<11||this.data.blueprints.includes(id)}
  save(){
    try{localStorage.setItem(campKey,JSON.stringify(this.data));this.saveWarning=false}catch{this.saveWarning=true}
  }
  level(key){return Math.min(5,Math.max(0,Number(this.data.training[key])||0))}
  settle(run,win){
    const d=this.data;
    const silver=(run.cleared*3+Math.floor(run.kills/4)+(win?15:0))*(d.veteran?2:1);
    const iron=run.earnedIron+(win?4:0);
    const first=run.eliteWins.map(w=>run.stageKey+'-'+w).filter(k=>!d.firstElites.includes(k));
    const medals=first.length+(win?1:0);
    d.firstElites.push(...first);d.silver+=silver;d.iron+=iron;d.medals+=medals;
    const record=d.stages[run.stageKey]??={best:0,wins:0};
    record.best=Math.max(record.best,run.cleared);if(win)record.wins++;
    d.best=Math.max(d.best,run.cleared);if(win)d.victories++;this.save();
    return '营地银币 +'+silver+'　铁料 +'+iron+'　军功章 +'+medals;
  }
  open(game,section=null){
    game.mode='camp';game.hud();$('wave').textContent='';
    const d=this.data;
    if(!section){
      game.mode='title';game.hud();$('modal').hidden=true;$('cover').hidden=false;
      return;
    }
    const m=game.panel(section,'营地银币 '+d.silver+'　·　铁料 '+d.iron+'　·　军功章 '+d.medals);
    game.button(m,'← 营地全景',()=>this.open(game));
    const body=document.createElement('div');body.className='camp-rows';m.append(body);
    const row=(title,info)=>{
      const box=document.createElement('div'),text=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small');
      name.textContent=title;detail.textContent=info;text.append(name,detail);box.append(text);body.append(box);return box;
    };
    if(section==='训练场')for(const [key,title,effect] of drills){
      const level=this.level(key),price=8+level*6,box=row(title+'　'+level+'/5','每级'+effect);
      game.button(box,level===5?'已满级':price+' 银币',()=>{
        if(d.silver<price||this.level(key)!==level||level>=5)return;
        d.silver-=price;d.training[key]=level+1;this.save();this.open(game,section);
      },level===5||d.silver<price);
    }
    if(section==='军需帐篷'){
      const box=row('斧兵契约','解锁后可在战地整备招募。单次伤害 40，间隔 1.8 秒。');
      game.button(box,d.axe?'已签约':'18 银币 · 2 铁料',()=>{
        if(d.axe||d.silver<18||d.iron<2)return;
        d.silver-=18;d.iron-=2;d.axe=true;this.save();this.open(game,section);
      },d.axe||d.silver<18||d.iron<2);
    }
    const unlock=(list,id,title,info,silver,iron)=>{
      const owned=list.includes(id),box=row(title,info);
      game.button(box,owned?'已解锁':silver+' 银币 · '+iron+' 铁料',()=>{
        if(list.includes(id)||d.silver<silver||d.iron<iron)return;
        d.silver-=silver;d.iron-=iron;list.push(id);this.save();this.open(game,section);
      },owned||d.silver<silver||d.iron<iron);
    };
    if(section==='军需帐篷'){
      unlock(d.contracts,5,'弩兵契约','签约后加入商店佣兵池。',16,2);
      unlock(d.contracts,9,'轻骑兵契约','签约后加入商店佣兵池。',24,3);
    }
    if(section==='铁匠铺'){
      for(let id=11;id<items.length;id++)
        unlock(d.blueprints,id,items[id][0]+'图纸',items[id][2]+'。解锁后可从商店或宝箱获得。',12+4*items[id][1],items[id][1]);
    }
    if(section==='指挥帐篷'){
      for(const [index,key] of stageOrder.entries()){
        const record=d.stages[key],open=this.stageOpen(key);
        const box=row(campaigns[key].name,open?'最佳 '+(record?.best||0)+' 波 · 通关 '+(record?.wins||0)+' 次':'通关「'+campaigns[stageOrder[index-1]].name+'」解锁');
        game.button(box,game.stageKey===key?'已选择':'选择',()=>{
          $('campaign-choice').value=key;$('campaign-choice').onchange();this.open(game,section);
        },!open||game.stageKey===key);
      }
      row('战役记录','最佳 '+d.best+'/'+finalWave+' 波　·　通关 '+d.victories+' 次。所有战役均在第 '+finalWave+' 波迎战统帅。');
      const box=row('老兵难度','通关后可消耗 1 枚军功章解锁。敌军生命 +25%，结算银币翻倍。');
      game.button(box,d.veteran?'切换普通':d.challenge?'切换老兵':'解锁老兵',()=>{
        if(!d.challenge){if(!d.victories||d.medals<1)return;d.medals--;d.challenge=true}
        d.veteran=!d.veteran;this.save();this.open(game,section);
      },!d.challenge&&(!d.victories||d.medals<1));
    }
    if(section==='军械库'){
      for(const [i,t] of troops.entries())row(t[0]+(!this.troopOpen(i)?' · 未签约':''),'伤害 '+t[1]+'　间隔 '+t[2]+' 秒　射程 '+t[3]);
      row('军魂附体','同种Ⅳ阶佣兵上阵 4 / 5 / 6 名时，主角获得蓝色军魂，射程增加 25%，并叠加对应兵种加成。'+soulTypes.map((t,i)=>troops[i][0]+'：'+t.label+' +'+t.values.join(' / ')+'%').join('；'));
      row('剑士羁绊','2 人攻速 +8%，4 人提高至 +16%，6 人累计攻击 4 次后全队剑士追加斩击。');
      row('长枪羁绊','2 人刺击距离 +10%，4 人多贯穿一名敌军，6 人可击退正在冲锋的骑兵。');
      row('长弓羁绊','2 人攻速 +8%，4 人追加一箭，6 人每 8 秒齐射。');
      row('斧兵羁绊','2 人范围 +8%，4 人伤害 +15%，6 人劈砍产生更远的扇形冲击。');
      row('新兵种战术','盾兵近身护卫使指挥官受伤降低 12%；弩兵对重装与精英首领增伤 25%；战锤震退杂兵；双匕首每次连击两段；长戟扇形横扫；轻骑短冲后攻击落点附近敌人。');
      row('新兵种羁绊','以上六种各自按同名人数计算，2 / 4 / 6 人分别增加 8% / 16% / 24% 攻速。');
      row('编制与合成','同种佣兵按 2 / 4 / 6 人触发羁绊。两名同阶同名佣兵可手动合成，最高 Ⅳ 阶。');
    }
    if(this.saveWarning)row('存档提示','浏览器存储不可用，本次进度仅在当前页面生效。');
    game.button(m,'出征 →',()=>game.startRun()).className='primary';
  }
}
