const campKey='ashen-banner.camp.v1';
const drills=[
  ['vigor','体能训练','指挥官生命上限 +5'],
  ['arms','战斗训练','佣兵伤害 +2%'],
  ['sense','战场嗅觉','银币吸附范围 +5%'],
  ['supply','补给准备','出发银币 +2']
];
class GreyCamp {
  constructor(){
    this.data={silver:0,iron:0,medals:0,victories:0,best:0,axe:false,veteran:false,firstElites:[],training:{}};
    try{Object.assign(this.data,JSON.parse(localStorage.getItem(campKey)||'{}'))}catch{this.saveWarning=true}
  }
  save(){
    try{localStorage.setItem(campKey,JSON.stringify(this.data));this.saveWarning=false}catch{this.saveWarning=true}
  }
  level(key){return Math.min(5,Math.max(0,Number(this.data.training[key])||0))}
  settle(run,win){
    const d=this.data;
    const silver=(run.cleared*3+Math.floor(run.kills/4)+(win?15:0))*(d.veteran?2:1);
    const iron=run.earnedIron+(win?4:0);
    const first=run.eliteWins.filter(w=>!d.firstElites.includes(w));
    const medals=first.length+(win?1:0);
    d.firstElites.push(...first);d.silver+=silver;d.iron+=iron;d.medals+=medals;
    d.best=Math.max(d.best,run.cleared);if(win)d.victories++;this.save();
    return '营地银币 +'+silver+'　铁料 +'+iron+'　军功章 +'+medals;
  }
  open(game,section='训练场'){
    game.mode='camp';game.hud();$('wave').textContent='';
    const d=this.data;
    const m=game.panel('灰旗营地','营地银币 '+d.silver+'　·　铁料 '+d.iron+'　·　军功章 '+d.medals);
    const nav=document.createElement('nav');nav.className='camp-tabs';m.append(nav);
    for(const tab of ['训练场','军需帐篷','指挥帐篷','军械库']){
      const btn=game.button(nav,tab,()=>this.open(game,tab));btn.setAttribute('aria-pressed',String(tab===section));
    }
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
    if(section==='指挥帐篷'){
      row('战役记录','最佳 '+d.best+'/'+finalWave+' 波　·　通关 '+d.victories+' 次。所有战役均在第 '+finalWave+' 波迎战统帅。');
      const box=row('老兵难度','通关后可消耗 1 枚军功章解锁。敌军生命 +25%，结算银币翻倍。');
      game.button(box,d.veteran?'切换普通':d.challenge?'切换老兵':'解锁老兵',()=>{
        if(!d.challenge){if(!d.victories||d.medals<1)return;d.medals--;d.challenge=true}
        d.veteran=!d.veteran;this.save();this.open(game,section);
      },!d.challenge&&(!d.victories||d.medals<1));
    }
    if(section==='军械库'){
      for(const [i,t] of troops.entries())row(t[0]+(i===3&&!d.axe?' · 未签约':''),'伤害 '+t[1]+'　间隔 '+t[2]+' 秒　射程 '+t[3]);
      row('军魂附体','同种Ⅳ阶佣兵上阵 4 / 5 / 6 名时，主角获得蓝色军魂，射程增加 25%，并叠加对应兵种加成。'+soulTypes.map((t,i)=>troops[i][0]+'：'+t.label+' +'+t.values.join(' / ')+'%').join('；'));
      row('编制与合成','同名佣兵每 2 名提升一档羁绊。两名同阶同名佣兵可手动合成，最高 Ⅳ 阶。');
    }
    if(this.saveWarning)row('存档提示','浏览器存储不可用，本次进度仅在当前页面生效。');
    game.button(m,'出征 →',()=>game.startRun()).className='primary';
  }
}
