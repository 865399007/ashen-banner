// Each spirit owns its round counter and follow-up queue. Damage and criticals
// are rolled once per commander attack, including all parts of that attack.
const soulSkillGuide={
  huatuo:['倾葫为指挥官治疗两次，每次基础回复 2.6 点。葫口射出毒针，每第三针在落点留下 2 秒毒圈。毒针命中或进入毒圈会中毒 4 秒，最多 5 层，每 0.5 秒扣血一次，每层首跳造成战魂伤害的 21%。连续中毒每跳追加基础毒伤的 10%，最高翻倍，续毒保留增幅，断毒重置','追加第三次治疗','生命低于四成时，每次治疗翻倍。毒针首次结算毒伤时可传给附近 1 名未中毒敌人，传染毒伤减半，仅传一跳','每第三轮追加三次急救治疗，传染目标上限提高到 2 名'],
  liubei:['双剑交叉，两剑可击中同一敌人','副剑延迟追斩，伤害提高','原目标阵亡，余剑转向近敌','每第三轮追加身后双斩'],
  zhaoyun:['长枪贯穿一列敌人','沿原路收枪回刺','从枪尖最远命中处透出枪芒','每第三轮再追加两刺'],
  huangzhong:['重箭瞄准射程内最远敌人','重箭多穿一人','连续两箭命中同一目标，下一箭射弱点','弱点箭在目标身后分裂为三箭'],
  xuhuang:['向前挥斧劈砍','斧刃外缘破甲，目标受伤提高 15%，持续 3 秒','再劈中破甲目标时向后裂地','地裂击中精英或主将，在其脚下追加崩击'],
  caoren:['盾击推开杂兵','盾击后补一刀','每第三轮获得一次格挡，有效 2 秒','格挡成功后环身反击并推开杂兵'],
  zhugeliang:['连射两矢','三连射，原目标阵亡后自动转火','同一轮连续三矢命中同一目标留下弩印','下一轮命中弩印，从两侧各补一矢'],
  wuanguo:['砸地震伤近敌','锤击后激起外扩震波','震波边缘使杂兵眩晕 0.55 秒','震波回拢，再次击中锤心'],
  dianwei:['双戟左右连劈','两戟连中同一敌人后追加肘击','目标阵亡，剩余连击转向最近敌人','每完成两套连击，下一轮六段猛攻'],
  lvbu:['方天画戟横扫前方','月牙钩回扫击边缘的杂兵','钩扫后直刺，贯穿聚拢的敌人','每第三轮以环身大扫收尾'],
  guanyu:['偃月刀大弧横扫','刀尖扫得更远','每第三刀送出向前推进的刀气','刀气尽头追加纵劈']
};

function soulOffset(point,angle,length){
  return {x:point.x+Math.cos(angle)*length,y:point.y+Math.sin(angle)*length};
}
function soulLine(origin,angle,length,halfWidth){
  return {...origin,angle,length,halfWidth,shape:'line'};
}
function soulCircle(center,radius){
  return {...center,angle:0,radius,shape:'circle'};
}
function moveSoulVictim(scene,enemy,point){
  if(enemy.hp<=0||enemy.boss||enemy.elite)return;
  scene.move(enemy.s,Phaser.Math.Clamp(point.x,10,950),Phaser.Math.Clamp(point.y,24,592),18);
}
function pushSoulVictim(scene,enemy,origin){
  moveSoulVictim(scene,enemy,soulOffset(enemy.s,heading(origin,enemy.s),14));
}
function soulAreaFor(general,level,origin,center){
  const area=soulStrikeArea(general,origin,center);
  if(general==='lvbu')return {...origin,shape:'sector',angle:heading(origin,center),radius:distance(origin,center)+18,halfAngle:1.24};
  if(general==='guanyu'&&level>=2)area.radius+=20;
  return area;
}
function startSoulRound(scene,spirit,actor,target){
  const {level,type}=spirit,general=type.general;
  const origin=pointOf(actor.s),range=scene.commanderAttackRange();
  if(general==='huangzhong'){
    for(const e of scene.enemies){
      const gap=distance(origin,e.s);
      if(gap<=range&&gap>distance(origin,target.s))target=e;
    }
  }
  const center=pointOf(target.s),angle=heading(origin,center);
  const area=soulAreaFor(general,level,origin,center);
  const roll=scene.rollAttackDamage(actor),damage=roll.damage*soulAttackMultiplier(level);
  const color=Phaser.Display.Color.HexStringToColor(soulRimColors[level-1]).color;
  const round=++spirit.round;
  const active=()=>scene.mode==='fight'&&spirit.image.active;
  const inReach=e=>e&&e.hp>0&&distance(actor.s,e.s)<=range+18;
  function nextEnemy(){
    return scene.enemies.filter(inReach).sort((a,b)=>distance(actor.s,a.s)-distance(actor.s,b.s))[0];
  }
  function hit(e,power){
    if(!active()||!e||e.hp<=0||scene.arrowBlocked(actor,e))return false;
    scene.applyHitDamage(spirit.image,e,damage*power,roll.critical);
    return true;
  }
  function sweep(zone,power,filter=()=>true){
    const victims=scene.enemies.filter(e=>soulStrikeContains(zone,e.s)&&filter(e));
    return victims.filter(e=>hit(e,power*(e===target?1:soulSecondaryDamage)));
  }
  function mark(at,direction,size,kind){
    skillMark(scene,actor,at,direction,size,kind,color);
  }
  function later(delay,action){followUp(scene,spirit,delay,action)}
  function single(e,power,kind='cross'){
    if(!inReach(e))return false;
    mark(e.s,heading(actor.s,e.s),12,kind);
    return hit(e,power);
  }
  const attack={scene,spirit,level,round,target,origin,center,angle,area,range,damage,critical:roll.critical,
    inReach,nextEnemy,hit,sweep,mark,later,single};
  showSoulStrike(scene,spirit,target.s,area,()=>{
    if(active())soulTechniques[general](attack);
  });
}

function stepPoisonCircles(scene){
  for(let i=scene.poisonCircles.length-1;i>=0;i--){
    const zone=scene.poisonCircles[i],remaining=zone.until-scene.elapsed;
    if(remaining<=0){
      zone.image.destroy();scene.poisonCircles.splice(i,1);continue;
    }
    zone.image.setAlpha(Math.min(1,remaining/.3));
    for(const enemy of scene.enemies){
      if(enemy.hp<=0||zone.exposed.has(enemy)||distance(enemy.s,zone.center)>zone.radius)continue;
      zone.exposed.add(enemy);applyPoison(enemy,scene.elapsed,zone.potency);
    }
  }
}

function spreadNeedlePoison(scene,source){
  const spread=source.poison?.spread;
  if(!spread)return;
  // Consume the single opportunity even when nobody is within reach.
  source.poison.spread=null;
  const nearby=scene.enemies.filter(e=>e!==source&&e.hp>0&&
    !(e.poison?.until>=scene.elapsed)&&distance(source.s,e.s)<=44);
  nearby.sort((a,b)=>distance(source.s,a.s)-distance(source.s,b.s));
  for(const enemy of nearby.slice(0,spread.limit))applyPoison(enemy,scene.elapsed,spread.potency);
}

const soulTechniques={
  huatuo({scene,spirit,level,round,target,center,damage,inReach,later}){
    const potency=damage*.42,landed=inReach(target);
    if(landed){
      applyPoison(target,scene.elapsed,potency);
      if(level>=3&&target.poison.spread===undefined){
        target.poison.spread={limit:level-2,potency:potency*.5};
      }
    }
    if(round%3===0){
      const radius=24+5*(level-1);
      scene.poisonCircles.push({center,radius,potency,until:scene.elapsed+2,
        exposed:new Set(landed?[target]:[]),image:drawPoisonCircle(scene,center,radius,level)});
    }
    const pulse=()=>medicinePulse(scene,huatuoSpout(spirit.image),level>=3&&scene.hp<scene.maxHP*.4?5.2:2.6);
    const count=level===4&&round%3===0?6:level>=2?3:2;
    const pulses=treatmentPulses(count,scene.bag);
    spirit.gourdUntil=Math.max(spirit.gourdUntil,scene.elapsed+.19*(pulses-1)+.12);
    pulse();
    for(let i=1;i<pulses;i++)later(.19*i,pulse);
  },
  liubei({level,round,target,origin,angle,range,nextEnemy,single,later,sweep,mark}){
    single(target,.65);
    const second=()=>single(target.hp<=0&&level>=3?nextEnemy():target,level>=2?.78:.55);
    if(level>=2)later(.13,second);else second();
    if(level===4&&round%3===0){
      for(const delay of [.23,.35])later(delay,()=>{
        mark(origin,angle+Math.PI,range*.8,'sweep');
        sweep({...origin,angle:angle+Math.PI,shape:'sector',halfAngle:1.45,radius:range*.8},.65);
      });
    }
  },
  zhaoyun({level,round,area,angle,origin,sweep,mark,later}){
    const victims=sweep(area,1);
    if(level>=2)later(.13,()=>{
      mark(soulOffset(origin,angle,area.length),angle+Math.PI,area.length,'spear');sweep(area,.55);
    });
    if(level>=3&&victims.length){
      const farthest=victims.reduce((a,b)=>distance(origin,a.s)>distance(origin,b.s)?a:b);
      const tip=pointOf(farthest.s);
      later(.09,()=>{
        mark(tip,angle,48,'spear');sweep(soulLine(tip,angle,48,8),.7,e=>e!==farthest);
      });
    }
    if(level===4&&round%3===0)for(const delay of [.24,.35])later(delay,()=>{
      mark(origin,angle,area.length,'spear');sweep(area,.65);
    });
  },
  huangzhong({scene,spirit,level,target,origin,angle,area,hit,mark,later}){
    const weak=level>=3&&spirit.focus===target&&spirit.focusHits>=2;
    const contact=pointOf(target.s);
    if(target.hp<=0||!soulStrikeContains(area,target.s)||!hit(target,weak?1.65:1)){
      spirit.focus=null;spirit.focusHits=0;return;
    }
    spirit.focusHits=weak?0:spirit.focus===target?spirit.focusHits+1:1;spirit.focus=target;
    if(weak)mark(contact,angle,16,'cross');
    const behind=soulLine(contact,angle,48,7);
    if(level>=2){
      const second=scene.enemies.filter(e=>e!==target&&soulStrikeContains(behind,e.s))
        .sort((a,b)=>distance(contact,a.s)-distance(contact,b.s))[0];
      if(second){mark(contact,angle,distance(contact,second.s),'spear');hit(second,.7)}
    }
    if(weak&&level===4)later(.1,()=>{
      const struck=new Set([target]);
      for(const direction of [angle,angle-.38,angle+.38]){
        mark(contact,direction,64,'spear');
        const ray=soulLine(contact,direction,64,7);
        const e=scene.enemies.filter(v=>!struck.has(v)&&soulStrikeContains(ray,v.s))
          .sort((a,b)=>distance(contact,a.s)-distance(contact,b.s))[0];
        if(e){struck.add(e);hit(e,.65)}
      }
    });
  },
  xuhuang({scene,level,area,origin,angle,range,sweep,mark,later}){
    const broken=new Set(scene.enemies.filter(e=>scene.elapsed<e.soulArmorBreakUntil));
    const victims=sweep(area,1);
    let fissure;
    for(const e of victims){
      if(level>=2&&distance(origin,e.s)>=Math.min(area.radius*.70,range*.65))e.soulArmorBreakUntil=scene.elapsed+3;
      if(level>=3&&broken.has(e)&&!fissure)fissure=pointOf(e.s);
    }
    if(fissure)later(.12,()=>{
      mark(fissure,angle,55,'crack');
      // Include the enemy standing over the start of the fissure.
      const hits=sweep(soulLine(soulOffset(fissure,angle,-8),angle,63,11),.75);
      if(level===4)for(const e of hits.filter(v=>v.elite||v.boss)){
        const at=pointOf(e.s);
        later(.14,()=>{mark(at,0,21,'ring');sweep(soulCircle(at,21),.85)});
      }
    });
  },
  caoren({scene,spirit,level,round,area,origin,target,sweep,single,later,damage,critical,mark}){
    for(const e of sweep(area,1))pushSoulVictim(scene,e,origin);
    if(level>=2)later(.16,()=>single(target,.65,'sweep'));
    if(level>=3&&round%3===0){
      spirit.guard={until:scene.elapsed+2,damage,critical};
      mark(scene.hero,0,19,'ring');
    }
  },
  zhugeliang({spirit,level,round,target,inReach,nextEnemy,single,later,mark,hit,angle}){
    const count=level>=2?3:2;
    let aim=target,previous,streak=0;
    function bolt(){
      if(level>=2&&aim?.hp<=0)aim=nextEnemy();
      if(!inReach(aim)||!single(aim,.55,'spear')){streak=0;return}
      if(level===4&&spirit.boltMark?.enemy===aim&&spirit.boltMark.round===round-1){
        spirit.boltMark=null;
        const marked=aim;
        for(const side of [-1,1])later(side===-1?.055:.11,()=>{
          if(!inReach(marked))return;
          const direction=angle+side*Math.PI/2;
          mark(soulOffset(marked.s,direction,-22),direction,22,'spear');hit(marked,.45);
        });
      }
      streak=aim===previous?streak+1:1;previous=aim;
      if(level>=3&&streak===3&&aim.hp>0){spirit.boltMark={enemy:aim,round};mark(aim.s,angle,14,'cross')}
    }
    bolt();for(let i=1;i<count;i++)later(i*.13,bolt);
  },
  wuanguo({scene,level,area,center,sweep,mark,later}){
    sweep(area,1);
    if(level>=2)later(.13,()=>{
      mark(center,0,48,'ring');
      for(const e of sweep(soulCircle(center,48),.55)){
        if(level>=3&&!e.elite&&!e.boss&&distance(center,e.s)>=32)e.soulStunUntil=scene.elapsed+.55;
      }
    });
    if(level===4)later(.30,()=>{
      mark(center,0,29,'inward');sweep(soulCircle(center,29),.9);
    });
  },
  dianwei({spirit,level,target,inReach,nextEnemy,single,later}){
    const rage=level===4&&spirit.combos>=2;
    if(rage)spirit.combos=0;
    let aim=target,firstVictim,completed=true;
    const count=rage?6:2;
    function swing(i){
      if(level>=3&&aim?.hp<=0)aim=nextEnemy();
      const landed=inReach(aim)&&single(aim,rage?.47:.65);
      if(!landed)completed=false;
      if(i===0&&landed)firstVictim=aim;
      if(i===1&&level>=2&&landed&&aim===firstVictim){
        const victim=aim;
        later(.045,()=>single(level>=3&&victim.hp<=0?nextEnemy():victim,.45,'sweep'));
      }
      if(i===count-1&&completed&&!rage)spirit.combos=(spirit.combos||0)+1;
    }
    swing(0);for(let i=1;i<count;i++)later(i*.085,()=>swing(i));
  },
  lvbu({scene,level,round,area,angle,range,origin,sweep,mark,later}){
    const victims=sweep(area,1);
    if(level>=2){
      for(const e of victims){
        const side=heading(origin,e.s)-angle;
        if(distance(origin,e.s)<area.radius*.65&&Math.cos(side)>.78)continue;
        moveSoulVictim(scene,e,soulOffset(origin,angle,distance(origin,e.s)*.62));
      }
    }
    if(level>=3)later(.14,()=>{
      mark(origin,angle,range+20,'spear');sweep(soulLine(origin,angle,range+20,12),.7);
    });
    if(level===4&&round%3===0)later(.28,()=>{
      const center=pointOf(scene.hero);mark(center,0,range*.8,'ring');sweep(soulCircle(center,range*.8),.85);
    });
  },
  guanyu({level,round,area,origin,angle,sweep,mark,later}){
    sweep(area,1);
    if(level<3||round%3!==0)return;
    const step=(area.radius+30)/3,seen=new Set();
    for(let i=0;i<3;i++)later(.09*(i+1),()=>{
      const at=soulOffset(origin,angle,step*i);
      mark(at,angle,step,'moon');
      for(const e of sweep(soulLine(at,angle,step+2,16),.8,e=>!seen.has(e)))seen.add(e);
    });
    if(level===4)later(.39,()=>{
      const tip=soulOffset(origin,angle,step*3);
      mark(soulOffset(tip,Math.PI/2,-22),Math.PI/2,44,'crack');sweep(soulCircle(tip,23),1.05);
    });
  }
};
function blockWithCaoRen(scene){
  const spirit=scene.souls.find(s=>s.guard?.until>scene.elapsed);
  if(!spirit)return false;
  const {damage,critical}=spirit.guard;spirit.guard=null;
  shieldSpark(scene,scene.hero);
  // Enemy contact is tested every frame. Give the blocked blow its usual recovery.
  scene.invul=.65+.15*scene.bag[heartMirror];scene.showInvulFade=true;
  if(spirit.level===4){
    const center=pointOf(scene.hero),radius=54;
    skillMark(scene,scene.actors[0],center,0,radius,'ring',0xffab79);
    for(const e of [...scene.enemies]){
      if(scene.mode!=='fight')break;
      if(distance(center,e.s)>radius||e.hp<=0)continue;
      scene.applyHitDamage(spirit.image,e,damage*.8,critical);pushSoulVictim(scene,e,center);
    }
  }
  return true;
}
