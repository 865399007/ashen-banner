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
    return i>=0&&(this.data.showDebugButtons===true||i===0||this.data.legacyStages?.includes(key)||Boolean(this.data.stages[stageOrder[i-1]]?.wins));
  }
  troopOpen(id){return id===3?this.data.axe:![5,9].includes(id)||this.data.contracts.includes(id)}
  itemOpen(id){return !needsBlueprint(id)||this.data.blueprints.includes(id)}
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
  chooseCampaign(game){
    const openCount=stageOrder.filter(key=>this.stageOpen(key)).length;
    const menu=game.panel('选择战役','可出征 '+openCount+' / '+stageOrder.length+'　·　点选战役即可出征',true);
    const track=document.createElement('div'),controls=document.createElement('div');
    track.className='campaign-track';track.id='campaign-track';
    track.setAttribute('role','group');track.setAttribute('aria-label','战役列表');
    controls.className='campaign-nav';menu.append(track,controls);
    for(const [i,key] of stageOrder.entries()){
      const campaign=campaigns[key],open=this.stageOpen(key);
      const card=game.button(track,'',()=>game.startRun(key),!open);
      card.className='campaign-card';card.style.setProperty('--army-color',campaign.colors.base);
      const icon=document.createElement('canvas'),name=document.createElement('strong');
      const boss=document.createElement('span'),status=document.createElement('small');
      icon.width=112;icon.height=112;icon.setAttribute('aria-hidden','true');
      const ctx=icon.getContext('2d');ctx.translate(6,7);ctx.scale(2.75,2.75);campaignGeneral(ctx,key,0);
      name.textContent=campaign.name;boss.textContent=campaign.army+' · '+campaign.boss;
      status.textContent=open?'出征':'通关「'+campaigns[stageOrder[i-1]].name+'」解锁';
      card.append(icon,name,boss,status);
    }
    game.button(controls,'返回',()=>{this.open(game);$('start').focus()});
    const last=track.children[stageOrder.indexOf(game.stageKey)];
    const focusCard=last&&!last.disabled?last:track.firstElementChild;
    focusCard.focus({preventScroll:true});track.scrollLeft=focusCard.offsetLeft-track.firstElementChild.offsetLeft;
  }
  open(game,section=null){
    game.mode='camp';game.hud();$('wave').textContent='';
    const d=this.data;
    if(!section){
      game.mode='title';game.hud();$('modal').hidden=true;$('cover').hidden=false;
      return;
    }
    if(section==='选择战役'){this.chooseCampaign(game);return}
    const m=game.panel(section,'营地银币 '+d.silver+'　·　铁料 '+d.iron+'　·　军功章 '+d.medals,true,()=>this.open(game));
    const body=document.createElement('div');body.className='camp-rows';m.append(body);
    const row=(title,info)=>{
      const box=document.createElement('div'),text=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small');
      name.textContent=title;detail.textContent=info;text.append(name,detail);box.append(text);body.append(box);return box;
    };
    if(section==='训练强化')for(const [key,title,effect] of drills){
      const level=this.level(key),price=8+level*6,box=row(title+'　'+level+'/5','每级'+effect);
      game.button(box,level===5?'已满级':price+' 银币',()=>{
        if(d.silver<price||this.level(key)!==level||level>=5)return;
        d.silver-=price;d.training[key]=level+1;this.save();this.open(game,section);
      },level===5||d.silver<price);
    }
    if(section==='佣兵契约'){
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
    if(section==='佣兵契约'){
      unlock(d.contracts,5,'弩兵契约','签约后加入商店佣兵池。',16,2);
      unlock(d.contracts,9,'轻骑兵契约','签约后加入商店佣兵池。',24,3);
    }
    if(section==='装备图纸'){
      for(let id=11;id<items.length;id++)if(needsBlueprint(id))
        unlock(d.blueprints,id,items[id][0]+'图纸',items[id][2]+'。解锁后可从商店或宝箱获得。',12+4*items[id][1],items[id][1]);
    }
    if(section==='战役记录'){
      for(const [index,key] of stageOrder.entries()){
        const record=d.stages[key],open=this.stageOpen(key);
        const progress=open?'最佳 '+(record?.best||0)+' 波 · 通关 '+(record?.wins||0)+' 次':'通关「'+campaigns[stageOrder[index-1]].name+'」解锁';
        row(campaigns[key].name,campaignOpposition(campaigns[key])+'　·　'+progress);
      }
      row('战役记录','最佳 '+d.best+'/'+finalWave+' 波　·　通关 '+d.victories+' 次。所有战役均在第 '+finalWave+' 波迎战统帅。');
      const box=row('老兵难度','通关后可消耗 1 枚军功章解锁。敌军生命 +25%，结算银币翻倍。');
      game.button(box,d.veteran?'切换普通':d.challenge?'切换老兵':'解锁老兵',()=>{
        if(!d.challenge){if(!d.victories||d.medals<1)return;d.medals--;d.challenge=true}
        d.veteran=!d.veteran;this.save();this.open(game,section);
      },!d.challenge&&(!d.victories||d.medals<1));
    }
    if(this.saveWarning){
      const warning=row('存档提示','浏览器存储不可用，本次进度仅在当前页面生效。');
      const notice=document.createElement('div');
      notice.className='camp-rows'; notice.append(warning); body.after(notice);
    }
    if(section==='兵种图鉴'){
      const pages=[
        ['兵种属性',()=>{
          const tactics=[
            '', '', '', '',
            '近身护卫使指挥官受伤降低 12%。',
            '对重装与精英首领增伤 25%。',
            '震退杂兵。',
            '每次连击两段。',
            '扇形横扫。',
            '短冲后攻击落点附近的敌人。',
            '指挥官受伤时倾葫施药，每次恢复 2.6 点。满血时从腰间针卷发出飞针。'
          ];
          for(const [i,[name,damage,interval,range]] of troops.entries()){
            const stats='伤害 '+damage+'　间隔 '+interval+' 秒　射程 '+range;
            row(name+(this.troopOpen(i)?'':' · 未招募'),stats+(tactics[i]?'　'+tactics[i]:''));
          }
        }],
        ['升阶技能',()=>{
          row('单人战役','高阶继承低阶技能。每名佣兵独立计算普攻轮数，追加攻击和齐射不会加快招牌技计数。');
          const skills=[
            ['连斩追加 55% 伤害','第二刀横扫最多 3 人','每第 3 轮以两道 80% 十字斩代替第二刀'],
            ['刺距 +15%，最多命中 3 人','回枪沿途造成 50% 伤害','每第 3 刺发出 1.6 倍距离的枪芒，最多贯穿 6 人'],
            ['双箭齐发，侧箭伤害 65%','每箭多穿 1 人，穿透伤害为该箭的 70%','三箭齐发，每第 4 轮金箭多穿 2 人'],
            ['追加 55% 回扫','回扫覆盖身周一圈','每第 3 轮追加 100% 地裂'],
            ['每第 2 轮追加 75% 盾撞并轻推杂兵','护卫时指挥官受击触发盾击，冷却 2 秒','反击扩大为指挥官身周 140% 震阵'],
            ['间隔 0.14 秒连射两发，第二发 70%','末发多穿 2 人，首个目标是精英或主将时该发增伤 25%','三连射，末发伤害 85%，多穿 3 人'],
            ['追加 50% 余震','主震范围 +25%，直接命中目标增伤 35%','每第 3 锤追加两道余震，分别为 65% 和 85%'],
            ['第二刀击杀可向另一目标补刺 80%','同一匕首兵对同一目标每命中 4 刀追加 90% 伤害','每第 3 轮四连刺，后两刺各 65%'],
            ['钩拢杂兵后补刺 50%','横扫扩大至 160°，补刺最多命中 3 人','每第 3 轮挥出 110% 月牙戟光'],
            ['沿途撞击 60%，每趟每敌一次','折返冲锋，回程伤害 65%','每第 3 次冲过目标，在落点造成 130% 范围伤害'],
            ['每轮连续治疗两次','每轮连续治疗三次','连续治疗四次，生命低于四成时每次恢复 4.4 点']
          ];
          skills.forEach((r,i)=>row(troops[i][0],r.map((v,j)=>roman[j+1]+' · '+v).join('　')));
        }],
        ['兵种羁绊',()=>{
          row('剑士羁绊','2 人攻速 +8%，4 人提高至 +16%，6 人累计攻击 4 次后全队剑士追加斩击。');
          row('长枪羁绊','2 人刺击距离 +10%，4 人多贯穿一名敌军，6 人可击退正在冲锋的骑兵。');
          row('长弓羁绊','2 人攻速 +8%，4 人追加一箭，6 人每 8 秒齐射。');
          row('斧兵羁绊','2 人范围 +8%，4 人伤害 +15%，6 人劈砍产生更远的扇形冲击。');
          row('新兵种羁绊','盾兵、弩兵、战锤兵、双匕首兵、长戟兵、轻骑兵和医师分别按同名人数计算，2 / 4 / 6 人分别增加 8% / 16% / 24% 攻速。');
        }],
        ['名将战魂',()=>{
          row('触发条件',`同兵种Ⅳ阶佣兵达到 3 名时，召唤对应名将。两种兵各有 3 名时，双战魂轮流代打，专属加成叠加。召唤期间指挥官基础射程额外增加 ${soulBaseRangePercent}%，只计一次。`);
          row('战魂普攻',`指挥官只做挥武动作，由战魂代为攻击。战魂继承指挥官的最终普攻伤害，再按 1～4 级提升 ${soulAttackBonusPercent.join(' / ')}%。技能每段按各自倍率结算，范围攻击的次目标受到该段伤害的 ${soulSecondaryDamage*100}%。整次攻击共用一次暴击判定。`);
          row('战魂描边光色','人物与武器使用同色描边：3 人 · 1 级白光，4 人 · 2 级蓝光，5 人 · 3 级紫光，6 人 · 4 级红光。');
          row('出招变化','1 级银光一闪；2 级双蓝流交织，命中绽开双月弧；3 级紫色兵影连出，三枚星芒旋开；4 级赤金焰尾破空，八道火芒伴随双重冲击波扩散。');
          for(const [i,type] of soulTypes.entries()){
            const entry=row(troops[i][0]+' · '+type.name,type.weapon+'　'+type.label+' +'+type.values.join(' / ')+'%');
            const progression=document.createElement('div');
            soulSkillGuide[type.general].forEach((skill,rank)=>{
              const line=document.createElement('small');line.textContent=roman[rank]+' · '+skill;progression.append(line);
            });
            entry.firstElementChild.append(progression);
            const portrait=document.createElement('canvas');
            const source=game.textures.get(generalSoulFrame(game,type,0)).getSourceImage();
            portrait.width=source.width;portrait.height=source.height;portrait.className='general-portrait';
            portrait.setAttribute('aria-hidden','true');
            const ctx=portrait.getContext('2d');
            if(type.general==='lvbu')ctx.drawImage(game.textures.get(lvbuPlumeFrame(game,0)).getSourceImage(),0,0);
            ctx.drawImage(source,0,0);
            entry.append(portrait);
          }
        }],
        ['编制与合成',()=>{
          row('佣兵甲胄','Ⅰ 阶布衣、Ⅱ 阶木甲、Ⅲ 阶普通盔甲、Ⅳ 阶禁军盔甲。');
          row('编制','同种佣兵按 2 / 4 / 6 人触发羁绊。');
          row('合成','两名同阶同名佣兵可手动合成，最高 Ⅳ 阶。');
        }]
      ];
      const nav=document.createElement('nav');
      nav.className='codex-pages';
      nav.setAttribute('aria-label','兵种图鉴分页');
      body.classList.add('codex-entries');
      body.id='codex-entries';
      body.before(nav);
      const showPage=index=>{
        for(const [i,button] of Array.from(nav.children).entries())button.setAttribute('aria-pressed',String(i===index));
        body.replaceChildren();
        pages[index][1]();
      };
      for(const [i,[name]] of pages.entries()){
        game.button(nav,name,()=>showPage(i)).setAttribute('aria-controls',body.id);
      }
      showPage(0);
    }
  }
}
