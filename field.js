function placeField(scene){
  scene.back=scene.add.image(0,0,'ember-arena').setOrigin(0).setDisplaySize(960,600).setDepth(-10);
  scene.obstacles=[];
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
