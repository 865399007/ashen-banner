function showHealing(scene,sprite,amount){
  if(amount<=0)return;
  const torsoY=()=>sprite.y+(.55-sprite.originY)*sprite.displayHeight;
  const label=scene.add.text(sprite.x,torsoY(),'+'+Number(amount.toFixed(1)),{
    fontFamily:gameFontFamily,fontSize:'15px',fontStyle:'bold',color:'#85f79a',stroke:'#214a2c',strokeThickness:3
  }).setOrigin(.5).setDepth(1101).setScale(.8);
  scene.tweens.add({targets:label,alpha:0,duration:720,
    onUpdate:()=>{
      if(sprite.active)label.setPosition(sprite.x,torsoY());
      else label.setVisible(false);
    },
    onComplete:()=>label.destroy()});
}

function showCommanderPromotion(scene,sprite){
  const light=scene.add.graphics();
  function draw(t){
    if(!sprite.active){light.setVisible(false);return}
    light.clear().setPosition(sprite.x,sprite.y).setDepth(sprite.y+.5);
    const spread=1-(1-t)*(1-t);
    light.lineStyle(1.4,0xfbd174,1-t);
    light.strokeEllipse(0,-1,18+27*spread,6+9*spread);
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3+.2;
      const x=Math.cos(angle)*(9+9*spread);
      const y=Math.sin(angle)*4-4-spread*(i%2?24:16);
      const size=(1-t)*(i%2?2.1:1.6);
      light.fillStyle(i%2?0xffedae:0xeab35c,1-t);
      light.beginPath();light.moveTo(x,y-2*size);light.lineTo(x+size,y);
      light.lineTo(x,y+2*size);light.lineTo(x-size,y);light.closePath();light.fillPath();
    }
  }
  draw(0);
  scene.tweens.addCounter({from:0,to:1,duration:540,
    onUpdate:tween=>draw(tween.getValue()),onComplete:()=>light.destroy()});
}

const hitFlashMs=95;
function hitTexture(scene,key,hero=false){
  const hitKey=(hero?'hit-red-':'hit-white-')+key;
  if(!scene.textures.exists(hitKey)){
    const source=scene.textures.get(key).getSourceImage();
    const flash=scene.textures.createCanvas(hitKey,source.width,source.height);
    flash.context.drawImage(source,0,0);
    flash.context.globalCompositeOperation='source-in';
    flash.context.fillStyle=hero?'#ff4842':'#ffffff';
    flash.context.fillRect(0,0,source.width,source.height);
    flash.refresh();
  }
  return hitKey;
}

class CombatSound {
  constructor(){
    this.volume=.35;this.muted=false;
    this.tracks={camp:{offset:0},battle:{offset:0}};
  }
  refreshGain(){if(this.master)this.master.gain.value=this.muted?0:this.volume}
  unlock(){
    try{
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)return;
      if(!this.ctx){
        this.ctx=new Context();
        this.output=this.ctx.createDynamicsCompressor();
        this.output.threshold.value=-10;
        this.output.knee.value=5;
        this.output.ratio.value=12;
        this.output.attack.value=.002;
        this.output.release.value=.08;
        const master=this.ctx.createGain();
        this.master=master;this.refreshGain();
        this.output.connect(master);master.connect(this.ctx.destination);
        this.noise=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*.18),this.ctx.sampleRate);
        const samples=this.noise.getChannelData(0);
        for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      }
      this.ctx.resume().catch(()=>{});
    }catch{}
  }
  async loadTheme(name){
    const track=this.tracks[name];
    track.loading=true;
    try{
      const response=await fetch('assets/music/'+name+'-theme.mp3');
      if(!response.ok)throw Error('Music load failed: '+response.status);
      track.buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());
    }catch{
      track.retryAt=performance.now()+10000;
    }finally{
      track.loading=false;
    }
  }
  updateMusic(mode){
    const c=this.ctx;
    if(!c)return;
    const quiet=document.hidden||this.muted||this.volume===0||mode==='paused'||mode==='settings'||mode==='over';
    const name=mode==='fight'||mode==='coopFight'?'battle':'camp';
    const active=this.music,now=c.currentTime;
    if(active&&(quiet||active.name!==name)){
      const track=this.tracks[active.name];
      track.offset=(track.offset+now-active.started)%track.buffer.duration;
      active.gain.gain.setTargetAtTime(0,now,.035);
      active.source.stop(now+.18);
      this.music=null;
    }
    if(quiet||this.music||c.state!=='running')return;
    const track=this.tracks[name];
    if(!track.buffer){
      if(!track.loading&&!(track.retryAt>performance.now()))this.loadTheme(name);
      return;
    }
    const source=c.createBufferSource(),gain=c.createGain();
    source.buffer=track.buffer;source.loop=true;
    gain.gain.setValueAtTime(0,now);
    gain.gain.setTargetAtTime(name==='battle'?.45:.50,now,.09);
    source.connect(gain);gain.connect(this.output);
    source.onended=()=>{source.disconnect();gain.disconnect()};
    source.start(now,track.offset);
    this.music={name,source,gain,started:now};
  }
  play(freq,endFreq,length,volume,noise=false){
    const c=this.ctx;
    if(this.muted||!c||c.state!=='running')return;
    const time=c.currentTime, gain=c.createGain(), filter=c.createBiquadFilter();
    const source=noise?c.createBufferSource():c.createOscillator();
    if(noise)source.buffer=this.noise;
    else{source.type='triangle';source.frequency.setValueAtTime(freq,time);source.frequency.exponentialRampToValueAtTime(endFreq,time+length)}
    filter.type='lowpass';filter.frequency.setValueAtTime(noise?freq:2200,time);
    if(noise)filter.frequency.exponentialRampToValueAtTime(endFreq,time+length);
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.004);
    gain.gain.exponentialRampToValueAtTime(volume*.55,time+length*.36);
    gain.gain.exponentialRampToValueAtTime(.0001,time+length);
    source.connect(filter);filter.connect(gain);gain.connect(this.output);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};
    source.start(time);source.stop(time+length);
  }
  swing(id){
    if(id===2)this.play(580,160,.095,.27);
    else this.play(id===1?3100:5200,650,.09,.46,true);
  }
  hit(hero){this.play(hero?132:195,47,hero?.16:.09,.58);this.play(2250,380,.06,.38,true)}
}

function impact(scene,attacker,victim,damage,hero=false,critical=false,showNumber=true){
  const sprite=victim.s,dx=sprite.x-attacker.x,dy=sprite.y-attacker.y;
  const angle=Math.atan2(dy,dx),heavy=critical||hero||damage>=30;
  scene.sfx.hit(hero);
  if(scene.time.now>=(scene.nextImpactBeat||0)){
    scene.hitStop=heavy?48:26;scene.nextImpactBeat=scene.time.now+150;
    const camera=scene.cameras.main;
    const amplitude=critical?1.1:heavy?1.5:.65;
    // Phaser multiplies by camera zoom when sampling the offset and again
    // when translating the camera matrix. Express the limit in CSS pixels.
    const display=scene.scale.canvas.getBoundingClientRect();
    if(display.width&&display.height)camera.shake(heavy?110:65,{
      x:amplitude/(display.width*camera.zoom*camera.zoomX),
      y:amplitude/(display.height*camera.zoom*camera.zoomY)
    });
  }
  const bodyHeight=sprite.height*(victim.hit?victim.hitBase:sprite.scaleY);
  const burstScale=Phaser.Math.Clamp(bodyHeight/38,.55,1.15);
  const burst=scene.add.graphics().setPosition(sprite.x,sprite.y).setScale(burstScale).setDepth(1045);
  const cx=0,cy=-bodyHeight*.4/burstScale;
  const floorY=0;
  const chips=Array.from({length:heavy?6:4},(_,i)=>{
    const direction=angle+(i%2?1:-1)*(.2+Math.random()*.95);
    const reach=(heavy?24:16)+Math.random()*7;
    return {dx:Math.cos(direction)*reach,dy:Math.sin(direction)*reach,
      lift:7+Math.random()*8,size:2+Math.random()*1.8,spin:Math.random()*4};
  });
  function drawBurst(t){
    burst.clear();
    const spread=1-(1-t)*(1-t),fade=1-t;
    for(let i=0;i<3;i++){
      const drift=spread*(5+i*3),x=cx+Math.cos(angle)*drift+(i-1)*4;
      const y=floorY+Math.sin(angle)*drift*.45-i*1.4-5*t;
      const radius=(3+i+spread*5);
      burst.fillStyle(0xa47c55,fade*.64).fillEllipse(x,y+1,radius*2,radius);
      burst.fillStyle(0xe2bd87,fade*.86).fillEllipse(x+1,y-1,radius*1.8,radius);
    }
    for(const [i,chip] of chips.entries()){
      const x=cx+chip.dx*spread,y=cy+chip.dy*spread-4*chip.lift*t*fade+10*t*t;
      const r=chip.size*(1-.55*t),turn=chip.spin+3*t;
      const u=Math.cos(turn)*r,v=Math.sin(turn)*r;
      burst.fillStyle(hero?0x87513c:0x685747,fade);
      burst.fillTriangle(x-u,y-v,x+u,y+v,x-v,y+u);
      burst.fillStyle(i%2?0xe5c69b:0xb3a695,fade);
      burst.fillTriangle(x-u,y-v,x+v*.7,y-u*.7,x+u,y+v);
    }
  }
  drawBurst(0);
  scene.tweens.addCounter({from:0,to:1,duration:heavy?320:260,
    onUpdate:tween=>drawBurst(tween.getValue()),onComplete:()=>burst.destroy()});
  if(showNumber){
    const label=scene.add.text(sprite.x+Phaser.Math.Between(-6,6),sprite.y-bodyHeight*.78,String(Math.round(damage)),{
      resolution:Phaser.Math.Clamp(Math.ceil(scene.cameras.main.zoom),1,4),
      fontFamily:gameFontFamily,fontSize:heavy?'16px':'13px',fontStyle:'bold',color:critical?'#ff983f':hero?'#ffac92':'#fff1c5',stroke:'#443326',strokeThickness:2
    }).setOrigin(.5,1).setDepth(1100).setScale(.68);
    scene.tweens.chain({targets:label,tweens:[
      {scale:1.18,duration:45,ease:'Quad.Out'},{scale:1,duration:55,ease:'Quad.InOut'},
      {y:label.y-26,duration:390,ease:'Cubic.Out',onStart:()=>scene.tweens.add({targets:label,alpha:0,delay:175,duration:215})}
    ],onComplete:()=>label.destroy()});
  }
  if(!victim.hit){
    victim.hitBase=sprite.scaleX;
    victim.normalTexture=sprite.texture.key;
  }
  const amplitude=victim.boss ? 0.15 : victim.elite ? 0.18 : 0.23;
  victim.hit={amplitude,age:0,dx:Math.cos(angle),dy:Math.sin(angle),last:0,force:hero?3:victim.boss?4:10};
  sprite.setTexture(hitTexture(scene,victim.normalTexture,hero));
  sprite.setScale(victim.hitBase*(1+amplitude),victim.hitBase*(1-amplitude));
  return burst;
}

function fadeDefeatedEnemy(scene,victim,hitBurst){
  const sprite=victim.s;
  victim.hit.force*=0.8;
  scene.fallenEnemies.add(sprite);
  scene.tweens.addCounter({from:0,to:.2,duration:200,onUpdate:tween=>{
    if(!sprite.active||!victim.hit)return;
    advanceImpact(victim,tween.getValue()-victim.hit.age);
    sprite.setDepth(sprite.y);
    sprite.bossName?.setPosition(sprite.x,sprite.y-victim.nameOffset);
  }});
  hitBurst.once('destroy',()=>{
    if(!sprite.active)return;
    const targets=sprite.bossName?[sprite,sprite.bossName]:[sprite];
    scene.tweens.add({targets,alpha:0,duration:320,ease:'Sine.InOut',onComplete:()=>sprite.destroy()});
  });
}

function advanceImpact(victim,dt){
  const hit=victim.hit;
  if(!hit)return;
  const sprite=victim.s;
  hit.age+=dt;
  const t=Math.min(1,hit.age/.2);
  const displacement=hit.force*(t<.44?Math.sin(t/.44*Math.PI/2):1-.38*Math.sin((t-.44)/.56*Math.PI/2));
  const fromX=sprite.x,fromY=sprite.y;
  sprite.x=Phaser.Math.Clamp(sprite.x+hit.dx*(displacement-hit.last),10,950);
  sprite.y=Phaser.Math.Clamp(sprite.y+hit.dy*(displacement-hit.last),24,592);
  if(victim.hero||victim.elite||victim.boss)resolveFootprint(sprite.scene,sprite,fromX,fromY);
  hit.last=displacement;
  const squeeze=hit.amplitude*Math.cos(t*Math.PI*2)*(1-t);
  sprite.setScale(victim.hitBase*(1+squeeze),victim.hitBase*(1-squeeze));
  if(hit.age>=hitFlashMs/1000)sprite.setTexture(victim.normalTexture);
  if(t===1)victim.hit=null;
}
