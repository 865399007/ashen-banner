'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {mountRoster}=require('./rules');
const {room,player,tick,action,snapshot}=require('./coop-room.cjs');
const rooms=new Map();
// Advance by elapsed monotonic time even when the OS delivers a timer late.
const step=1/30;
let last=performance.now(),carry=0;
setInterval(()=>{
 const current=performance.now(),now=Date.now();
 carry=Math.min(.25,carry+(current-last)/1000);last=current;
 const steps=Math.floor(carry/step);carry-=steps*step;
 for(const [key,r] of rooms){
   if(r.players.every(p=>now-p.seen>600000)){rooms.delete(key);continue}
   for(let i=0;i<steps;i++)tick(r,step,now);
 }
},16);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
const publicFiles=new Set(['index.html','style.css','assets/fonts/banner-sans.css','assets/fonts/banner-sans.ttf',...Array.from(fs.readFileSync(path.join(__dirname,'index.html'),'utf8').matchAll(/<script src="([^"?]+)/g),m=>m[1])]);
http.createServer(async(req,res)=>{
 const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
 try{
 const route=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'&&route==='/room'){
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'来源无效'});
   let data='';for await(const chunk of req){data+=chunk;if(data.length>4096)return send(413,{error:'请求太大'})}
   const b=JSON.parse(data);let r=rooms.get(b.code),p;
   if(b.op==='create'){
     if(rooms.size>=128)return send(503,{error:'房间已满'});
     let code;do{code=crypto.randomInt(100000,1000000).toString()}while(rooms.has(code));
     r=room(code);rooms.set(code,r);
   }
   if(!r)return send(404,{error:'房间不存在或已过期'});
   if(b.op==='create'||b.op==='join'){
     if(r.phase!=='lobby'||r.players.length>=2)return send(409,{error:'房间已满或已开战'});
     p=player(b.hero,r.players.length);p.mount=mountRoster.find(m=>m.id===b.mount)?.id||null;r.players.push(p);
     return send(200,{code:r.code,token:p.token,state:snapshot(r,p)});
   }
   p=r.players.find(p=>p.token===b.token);if(!p)return send(403,{error:'重连凭证无效'});
   p.seen=Date.now();p.dx=Number.isFinite(b.dx)?Math.max(-1,Math.min(1,b.dx)):0;p.dy=Number.isFinite(b.dy)?Math.max(-1,Math.min(1,b.dy)):0;
   action(r,p,b.action);return send(200,{state:snapshot(r,p)});
 }
 const file=route==='/'?'index.html':decodeURIComponent(route.slice(1));
 if(req.method!=='GET'||(!publicFiles.has(file)&&!/^assets\/[\w/-]+\.(png|svg)$/.test(file)))return send(404,{error:'未找到'});
 const loc=path.join(__dirname,file);if(!fs.existsSync(loc))return send(404,{error:'未找到'});
 res.writeHead(200,{'Content-Type':mime[path.extname(loc)],'Cache-Control':'no-cache'});fs.createReadStream(loc).pipe(res);
 }catch{if(!res.headersSent)send(400,{error:'请求无效'});else res.end()}
}).listen(Number(process.env.COOP_PORT||8767),'0.0.0.0',()=>console.log('Local co-op listening'));
