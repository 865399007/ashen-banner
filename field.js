// Original illustration coordinates. Each ellipse follows a solid footprint at ground level.
const fieldProps=[
  {key:'tree-ground',left:423,top:48,depth:-9,solids:[]},
  {key:'tree',left:423,top:48,feet:198,solids:[[539,191,14,9],[595,203,27,12]]},
  {key:'tent',left:1001,top:149,feet:314,solids:[[1175,284,75,28],[1090,294,21,14],[1241,278,10,9],[1185,339,11,5]]},
  {key:'cart',left:169,top:449,feet:522,solids:[[257,496,50,19],[301,511,30,8]]},
  {key:'wall',left:958,top:667,feet:766,solids:[[1099,738,38,16],[1033,761,28,13],[1113,779,14,7]]},
  {key:'boulder',left:141,top:410,feet:457,solids:[[213,449,27,13]]},
  {key:'stones',left:263,top:887,feet:926,solids:[[296,916,20,10]]},
  {key:'tent-stone',left:1293,top:266,feet:291,solids:[[1318,285,14,7]]},
  {key:'cart-stone',left:296,top:530,feet:552,solids:[[331,545,14,7]]},
  {key:'pebble',left:1040,top:67,feet:94,solids:[[1095,86,14,7]]}
];
const fieldScaleX=960/1738,fieldScaleY=600/1086;
// Packed 4-by-4 source-pixel coverage cells from the prop PNG alpha channels.
const fieldCoverage={
  'tree':'AAAAAAAAAAAAAAAAAAAAAAD+AwAAAACA/wcAAAAA4P8PAAAAAPD/HwAAAADw/x8AAAAA+P8/AAAAAPj/PwAAAAD4/z8AAAAA/P8/AAAAAP///wMAAID///8PAADA////DwAAwP///x8AAMD///8fAADg////HwAA4P///z8AAOD///8/AADA////HwAAwP///x8AAMD/+/8fAAAA////DwAAAAT//wcAAAAA/v8DAAAAAPyDAAAAAAD4AQAAAAAA+AAAAAAAAPgAAAAAAAD4AAAAAAAA/AAAAAAAAPwADgAAAAD8gD8AAAAA/MF/AAAAAP7h/wAAAAD+4/8BAAAAPvD/AQAAABv4/wMAAAAA/P8DAAAAAPj/AQAAAADw/wAAAAAA4B8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
  'tent':'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAPAAAAAAAAAAAHwAAAAAAAADA/wAAAAAAAADgPwAAAAAAAAD8BwAAAAAAAOD/AAAAAAAAAPw/AAAAAAAAwP8PAAAAAAAA8P8DAAAAAAAA/v8AAAAAAADg/z8AAAAAAAD+9w8AAAAAAOD//wMAAABAgP///wAAAAB4////PwAAAAD+////DwAAAOD/////AwAAAPj/////AAAAAPz///8/AAAAAP////8PAAAA4P////8DAAAA+P///58AAAAA/////wcAAADg/////wEAAAD4////fwAAAOD/////PwAAAP//////HwAA8P//////hwAA/P//////IQAA/v//////HkDA////////B1z8////////gf////////9/8P////////8H/////////z+A//7//////wMABvz/////fwAAAPj///+DAQAAAAD///8HAAAAAAD///8DAAAAAADwf/4AAAAAAAAA4H8AAAAAAAAA/w8AAAAAAADAPwAAAAAAAAD8DwAAAAAAAAD/AwAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  'cart':'AAAAAAAAAAAA4AMAAAAA/wEAAAD//wAAAOD/fwAAAP7/fwAA4P//PwAA8P//HwAA+P//DwAA+P//BwAA/P//wwH4/////QH+/////4D/////P+D/////AcD/////QQD+////AwD//8f/AwD+/8P7AQD8n/8BAACAww8AAAAA8AcAAAAA8AAAAA==',
  'wall':'AAAAAAAAAAAAAAAOAAAAAADgHwAAAAAA+B8AAAAAAPw/AAAAAAD+fwAAAAAA/z8AAAAAwP8fAAAAAPz/DwAAAAD+/wcAAAAA//8DAAAAgP//AQAAAMD//xAAAADg/38uAAAA+P//HwAAAPz//x8AAP////8PAOD/////AwDw////PwAA+P///w8AAPz///8BAID///+fAADg////AQBA+P///wAA6P////8DAPz/////AwD///8B/gHg////wf8B4P///8B/AMDD/x/AHwAAAPAAAAAAAAAAAAAAAAAAAAAAAAA=',
  'boulder':'AAAAAAAAAAAAAOAHAIDA/wAAF/8PAPz5fwjw///XwP//vw/+////4P///wcAAAAAAAAAAAAAAAAAAAAAAAA=',
  'stones':'AAAAAAAAfADAfwDwvwD+f+D/H/j/D/7/B///ATx4AAAAAAAA',
  'tent-stone':'AAAc4A//8X/+D/8AAAAA',
  'cart-stone':'gA/4h//5f/4f/wMAAAAAAA==',
  'pebble':'AAAAAAeA+AH+H/D/A/8//P/B/w/4BwAAAA=='
};
function placeField(scene){
  scene.back=scene.add.image(0,0,'sand').setOrigin(0).setDisplaySize(960,600).setDepth(-10);
  scene.obstacles=[];
  scene.occluders=[];
  for(const prop of fieldProps){
    const image=scene.add.image((145+prop.left)*fieldScaleX,prop.top*fieldScaleY,prop.key)
      .setOrigin(0).setScale(fieldScaleX,fieldScaleY).setDepth(prop.depth??prop.feet*fieldScaleY);
    if(fieldCoverage[prop.key]){
      scene.occluders.push({image,mask:atob(fieldCoverage[prop.key]),columns:Math.ceil(image.width/4)});
    }
    for(const [x,y,rx,ry] of prop.solids){
      scene.obstacles.push({x:(145+x)*fieldScaleX,y:y*fieldScaleY,rx:rx*fieldScaleX,ry:ry*fieldScaleY});
    }
  }
}

function propCoversActor(prop,actor){
  const image=prop.image,s=actor.s;
  if(!s.active||s.depth>=image.depth)return false;
  const x=s.x-image.x,y=s.y-image.y,w=s.displayWidth,h=s.displayHeight;
  if(x+w*.25<0||x-w*.25>=image.displayWidth||y<0||y-h*.74>=image.displayHeight)return false;
  // Probe the head, chest and legs, ignoring empty corners of the art.
  for(const level of [.70,.44,.16]){
    const py=(y-level*h)/fieldScaleY;
    if(py<0||py>=image.height)continue;
    for(const side of [0,-.17,.17]){
      const px=(x+w*side)/fieldScaleX;
      if(px<0||px>=image.width)continue;
      const bit=Math.floor(py/4)*prop.columns+Math.floor(px/4);
      if(prop.mask.charCodeAt(bit>>3)&(1<<(bit&7)))return true;
    }
  }
  return false;
}

function updatePropOpacity(scene,dt){
  const step=dt*5;
  for(const prop of scene.occluders){
    const covers=actor=>propCoversActor(prop,actor);
    const obscured=scene.actors.some(covers)||scene.enemies.some(covers);
    const target=obscured ? 0.5 : 1;
    const alpha=prop.image.alpha;
    if(alpha!==target)prop.image.setAlpha(alpha+Phaser.Math.Clamp(target-alpha,-step,step));
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
