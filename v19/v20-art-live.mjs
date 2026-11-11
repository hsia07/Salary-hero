/* V20 P0 / Live illustration layer.
 * Independent canvas animation over real scenes: no text, heroes, monsters,
 * rewards or controls are baked into a screenshot. Purely decorative.
 * Uses a capped 30fps, 1.5 DPR budget for older mobile Safari.
 */
export const V20_ART_COUNTS = Object.freeze({town:15,battle:24});
const fract = value => value - Math.floor(value);
export function v20ArtParticle(index,time,kind='town'){
 const n=Number.isFinite(Number(index)) ? Math.max(0,Math.floor(Number(index))) : 0;
 const t=Number.isFinite(Number(time)) ? Math.max(0,Number(time))/1000 : 0;
 const seed=fract(n*0.61803398875+0.17);
 const step=fract(n*0.41421356237+0.39);
 const kindOffset=kind==='battle'?.18:0;
 const speed=.009+(n%5)*.003;
 return {
  x:fract(seed+Math.sin(t*(.11+n%4*.028)+n)*.032+kindOffset),
  y:fract(1-step-t*speed),
  phase:step*Math.PI*2+t*(.4+(n%3)*.17),
  size:(n%7===0?5.5:1.6+(n%5)*.49),
  type:n%9===0?'paper':n%5===0?'petal':'mote'
 };
}
function paint(ctx,w,h,kind,time,bursts){
 const count=V20_ART_COUNTS[kind];
 ctx.clearRect(0,0,w,h);
 for(let i=0;i<count;i++){
  const p=v20ArtParticle(i,time,kind);
  const x=p.x*w,y=p.y*h;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(p.phase)*.4);
  if(p.type==='paper'){
   ctx.rotate(p.phase*.42);
   ctx.fillStyle=kind==='battle'?'rgba(255,237,204,.38)':'rgba(252,224,185,.27)';
   ctx.strokeStyle='rgba(255,240,212,.5)';ctx.lineWidth=.65;
   ctx.beginPath();ctx.moveTo(-p.size,-p.size*.8);
   ctx.quadraticCurveTo(p.size*.2,-p.size*1.3,p.size,p.size*.2);
   ctx.lineTo(p.size*.25,p.size*.9);ctx.lineTo(-p.size,p.size*.45);ctx.closePath();
   ctx.fill();ctx.stroke();
  }else if(p.type==='petal'){
   ctx.fillStyle=i%2?'rgba(255,181,221,.46)':'rgba(241,202,247,.47)';
   ctx.beginPath();ctx.moveTo(0,-p.size*1.1);
   ctx.bezierCurveTo(p.size*1.25,-p.size*.65,p.size*1.1,p.size*.8,0,p.size*1.3);
   ctx.bezierCurveTo(-p.size*1.1,p.size*.65,-p.size*.8,-p.size*.9,0,-p.size*1.1);
   ctx.fill();
  }else{
   const r=kind==='battle'?p.size*2.8:p.size*2.2;
   const halo=ctx.createRadialGradient(0,0,0,0,0,r);
   halo.addColorStop(0,'rgba(255,250,221,.92)');
   halo.addColorStop(.26,kind==='battle'?'rgba(165,189,255,.56)':'rgba(255,206,142,.55)');
   halo.addColorStop(1,'rgba(192,148,227,0)');
   ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
   if(i%4===0){
    ctx.strokeStyle='rgba(255,239,196,.45)';ctx.lineWidth=.65;
    ctx.beginPath();ctx.moveTo(-r*1.5,0);ctx.lineTo(r*1.5,0);
    ctx.moveTo(0,-r*1.5);ctx.lineTo(0,r*1.5);ctx.stroke();
   }
  }
  ctx.restore();
 }
 // Two hand-drawn rising steam wisps stay anchored to the actual coffee cup.
 if(kind==='town'){
  const cx=w*.656,cy=h*.67;
  for(let i=0;i<2;i++){
   ctx.save();
   ctx.translate(cx+i*9-5,cy);
   ctx.globalAlpha=.22+.13*Math.sin(time/800+i);
   ctx.strokeStyle='#fff2d9';ctx.lineWidth=1.9;ctx.lineCap='round';
   ctx.beginPath();
   for(let j=0;j<19;j++){
    const y=-j*2.4, x=Math.sin(j*.42+time/1100+i)*4.5+(j*.1);
    if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   ctx.stroke();ctx.restore();
  }
 }
 const now=time;
 for(let i=bursts.length-1;i>=0;i--){
  const b=bursts[i],age=(now-b.start)/630;
  if(age>=1){bursts.splice(i,1);continue;}
  ctx.save();ctx.globalAlpha=1-age;ctx.translate(b.x*w,b.y*h);
  const r=age*(kind==='town'?25:38);
  for(let j=0;j<6;j++){
   const a=j*Math.PI/3+b.seed;
   const x=Math.cos(a)*r,y=Math.sin(a)*r;
   ctx.fillStyle=j%2?'#fff2d4':'#a4c5ff';
   ctx.beginPath();ctx.ellipse(x,y,Math.max(.5,2.5*(1-age)),Math.max(.5,5*(1-age)),a,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
}
export function initV20ArtLive(){
 if(typeof document==='undefined'||typeof window==='undefined')return null;
 if(new URLSearchParams(location.search).has('training'))return null;
 const root=document.getElementById('app');
 if(!root)return null;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
 const descriptors=[
  {kind:'town',element:document.getElementById('v20-town-ambient'),host:document.getElementById('town-stage')},
  {kind:'battle',element:document.getElementById('v20-battle-ambient'),host:document.querySelector('.battle-deck .scene')}
 ].filter(x=>x.element&&x.host).map(x=>({...x,ctx:x.element.getContext('2d',{alpha:true}),width:0,height:0,bursts:[]}));
 if(!descriptors.length)return null;
 function measure(s){
  const rect=s.host.getBoundingClientRect();
  if(rect.width<1||rect.height<1)return false;
  const dpr=Math.min(1.5,window.devicePixelRatio||1);
  const physicalWidth=Math.max(1,Math.round(rect.width*dpr));
  const physicalHeight=Math.max(1,Math.round(rect.height*dpr));
  if(s.element.width!==physicalWidth||s.element.height!==physicalHeight){
   s.element.width=physicalWidth;s.element.height=physicalHeight;
   s.ctx?.setTransform(dpr,0,0,dpr,0,0);
  }
  s.width=rect.width;s.height=rect.height;
  return true;
 }
 function draw(now){
  for(const s of descriptors)if(s.ctx&&measure(s))paint(s.ctx,s.width,s.height,s.kind,now,s.bursts);
 }
 let raf=0,last=0,ended=false;
 function tick(now){
  raf=0;
  if(ended||document.hidden)return;
  if(now-last>=32){draw(now);last=now;}
  raf=requestAnimationFrame(tick);
 }
 function schedule(){
  if(!reduced&&!ended&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);
 }
 function burst(kind,event){
  if(reduced)return;
  const s=descriptors.find(x=>x.kind===kind);
  if(!s)return;
  const rect=s.host.getBoundingClientRect();
  const targetRect=event.currentTarget.getBoundingClientRect();
  const x=(targetRect.left+targetRect.width/2-rect.left)/Math.max(rect.width,1);
  const y=(targetRect.top+targetRect.height/2-rect.top)/Math.max(rect.height,1);
  s.bursts.push({x,y,start:performance.now(),seed:s.bursts.length*.73});
  if(s.bursts.length>5)s.bursts.shift();
  schedule();
 }
 const listeners=[];
 for(const [selector,kind] of [['#town-cat','town'],['#town-coffee','town'],['#v20-stage-chest','battle'],['#attack','battle']]){
  const node=document.querySelector(selector);
  if(node){const handler=event=>burst(kind,event);node.addEventListener('click',handler);listeners.push([node,handler]);}
 }
 const observe=typeof ResizeObserver!=='undefined' ? new ResizeObserver(()=>{draw(performance.now());schedule();}) : null;
 for(const s of descriptors)observe?.observe(s.host);
 const onVisibility=()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else schedule();};
 const onResize=()=>{draw(performance.now());schedule();};
 document.addEventListener('visibilitychange',onVisibility);
 window.addEventListener('resize',onResize,{passive:true});
 draw(performance.now());schedule();
 return {destroy(){
  ended=true;if(raf)cancelAnimationFrame(raf);
  observe?.disconnect();
  document.removeEventListener('visibilitychange',onVisibility);
  window.removeEventListener('resize',onResize);
  for(const [n,fn] of listeners)n.removeEventListener('click',fn);
 }};
}
if(typeof document!=='undefined')initV20ArtLive();
