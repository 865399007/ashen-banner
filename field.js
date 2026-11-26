function placeField(scene){
  scene.back=scene.add.image(0,0,'ember-arena').setOrigin(0).setDisplaySize(960,600).setDepth(-10);
  drawGroundDetails(scene);
  scene.obstacles=[];
}

function drawGroundDetails(scene){
  const ink=scene.add.graphics().setDepth(-9);
  const pebbles=[
    [112,98,9,4],[255,76,6,3],[428,139,8,4],[672,89,10,5],[845,136,7,3],
    [191,241,7,4],[761,233,9,4],[94,337,8,4],[343,302,6,3],[862,350,10,4],
    [214,449,9,5],[535,418,7,3],[718,467,8,4],[377,535,8,4],[889,518,7,3]
  ];
  for(const [x,y,w,h] of pebbles){
    const outline=[
      {x,y},{x:x+w*.24,y:y-h*.76},{x:x+w*.61,y:y-h},
      {x:x+w,y:y-h*.28},{x:x+w*.77,y:y+h*.24}
    ];
    ink.fillStyle(0x796149,.16).fillEllipse(x+w*.54,y+.7,w+2,h*.65);
    ink.fillStyle(0xb29a7e,.62).fillPoints(outline,true);
    ink.lineStyle(.85,0x64523e,.48).strokePoints(outline,true);
    ink.lineStyle(.7,0xe2c9a3,.55).lineBetween(x+w*.25,y-h*.55,x+w*.6,y-h*.76);
  }

  const ridges=[[155,158,12],[345,116,10],[575,184,14],[817,189,10],
    [155,376,13],[471,353,9],[646,303,12],[320,473,11],[620,526,14],[809,434,10]];
  for(const [x,y,w] of ridges){
    ink.lineStyle(.85,0x74593e,.36).strokePoints([
      {x,y},{x:x+w*.24,y:y-1.5},{x:x+w*.48,y:y-2.5},
      {x:x+w*.73,y:y-1.7},{x:x+w,y:y-.2}
    ]);
    ink.lineStyle(.75,0xead0a5,.48).lineBetween(x+w*.34,y+.25,x+w*.73,y+.55);
  }
}

function resolveFootprint(scene,sprite,fromX,fromY,steer=false){
  const radius=sprite.displayWidth*.15;
  for(let pass=0;pass<3;pass++){
    let blocked=false;
    for(const o of scene.obstacles){
      const rx=o.rx+radius,ry=o.ry+radius*.72;
      let nx=(sprite.x-o.x)/rx,ny=(sprite.y-o.y)/ry;
      const d=Math.hypot(nx,ny);
      if(d>=1)continue;
      blocked=true;
      if(d>.0001){nx/=d;ny/=d}else{nx=0;ny=1}
      if(steer){
        // Give a head-on pursuer a tangent as well, so it can round a prop.
        const dx=sprite.x-fromX,dy=sprite.y-fromY;
        const cross=nx*dy-ny*dx;
        const turn=(cross<0?-1:1)*Math.min(.23,Math.hypot(dx,dy)/Math.max(rx,ry));
        const a=Math.atan2(ny,nx)+turn;
        nx=Math.cos(a);ny=Math.sin(a);
      }
      sprite.setPosition(o.x+nx*rx*1.001,o.y+ny*ry*1.001);
    }
    if(!blocked)break;
  }
}
