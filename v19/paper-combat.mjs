/* V19.4 — illustrated paper-gremlin combat timing and composited ink FX.
 * Actual character poses come ONLY from committed PNG artwork.
 * No rotation, translation or geometry rigging is used to fake anatomy. */
export const PAPER_HERO_HIT_MS=405;
export const PAPER_RETALIATE_START_MS=805;
export const PAPER_PROJECTILE_LAUNCH_MS=1090;
export const PAPER_PROJECTILE_IMPACT_MS=1215;
export const PAPER_ATTACK_END_MS=1430;
export const PAPER_HURT_END_MS=805;
export const PAPER_ATTACK_POSE_MS=Object.freeze([150,130,70,90,180]);
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
export function paperCombatPoseAt(elapsed,hitResult){
 const t=Number(elapsed);
 if(!hitResult||!Number.isFinite(t)||t<0)return {state:'idle',progress:0};
 if(hitResult.type==='victory'){
  return t>=PAPER_HERO_HIT_MS&&t<1100?{state:'defeat',progress:clamp((t-PAPER_HERO_HIT_MS)/490)}:{state:'idle',progress:0};
 }
 if(hitResult.type!=='hit')return {state:'idle',progress:0};
 if(t>=PAPER_HERO_HIT_MS&&t<PAPER_HURT_END_MS)
  return {state:'hurt',progress:clamp((t-PAPER_HERO_HIT_MS)/(PAPER_HURT_END_MS-PAPER_HERO_HIT_MS))};
 if(t>=PAPER_RETALIATE_START_MS&&t<PAPER_ATTACK_END_MS&&Number(hitResult.retaliationDamage)>0)
  return {state:'attack',progress:clamp((t-PAPER_RETALIATE_START_MS)/PAPER_ATTACK_POSE_MS.reduce((a,b)=>a+b,0))};
 return {state:'idle',progress:0};
}
export function paperHitFlashAt(elapsed,{reducedMotion=false}={}){
 const t=Number(elapsed)-PAPER_HERO_HIT_MS;
 if(!Number.isFinite(t)||t<0||t>245)return {white:0,red:0,burst:0,hitStop:false};
 let white=0,red=0;
 if(t<35)white=.82*(1-t/35);
 if(t>=35&&t<115)red=.86*(1-(t-35)/80*.32);
 if(t>=153&&t<203)red=.50*(1-(t-153)/50);
 return {white:reducedMotion?white*.45:white,red:reducedMotion?red*.45:red,
  burst:reducedMotion?0:clamp(1-t/155),hitStop:t<48};
}
export function paperAttackFxAt(elapsed){
 const t=Number(elapsed);
 if(!Number.isFinite(t)||t<PAPER_RETALIATE_START_MS||t>=PAPER_ATTACK_END_MS)
  return {active:false,charge:0,flight:0,burst:0,projectile:false};
 const phase=t-PAPER_RETALIATE_START_MS;
 const charge=phase<285?Math.sin(Math.PI*clamp(phase/285))*.9:0;
 const flight=clamp((t-PAPER_PROJECTILE_LAUNCH_MS)/(PAPER_PROJECTILE_IMPACT_MS-PAPER_PROJECTILE_LAUNCH_MS));
 const projectile=t>=PAPER_PROJECTILE_LAUNCH_MS&&t<PAPER_PROJECTILE_IMPACT_MS;
 const burst=t>=PAPER_PROJECTILE_IMPACT_MS?clamp(1-(t-PAPER_PROJECTILE_IMPACT_MS)/170):0;
 return {active:true,charge,flight,burst,projectile};
}
// Silhouette-perfect white → scarlet overlays. Alpha preserved via source-in.
const tintCache=new WeakMap();
function tintedPose(image,frame,frameIndex,color){
 let m=tintCache.get(image);
 if(!m){m=new Map();tintCache.set(image,m);}
 const key=frameIndex+':'+color;
 if(m.has(key))return m.get(key);
 const canvas=document.createElement('canvas');
 canvas.width=frame.cell;canvas.height=frame.cell;
 const c=canvas.getContext('2d');
 c.drawImage(image,frameIndex*frame.cell,0,frame.cell,frame.cell,0,0,frame.cell,frame.cell);
 c.globalCompositeOperation='source-in';
 c.fillStyle=color;c.fillRect(0,0,frame.cell,frame.cell);
 m.set(key,canvas);
 return canvas;
}
export function drawPaperHitTint(ctx,image,frame,frameIndex,rect,elapsed,options={}){
 const flash=paperHitFlashAt(elapsed,options);
 if(flash.white<=0&&flash.red<=0)return false;
 ctx.save();
 if(flash.white>0){
  ctx.globalAlpha=flash.white;
  ctx.drawImage(tintedPose(image,frame,frameIndex,'#fff9f5'),rect.x,rect.y,rect.w,rect.h);
 }
 if(flash.red>0){
  ctx.globalAlpha=flash.red;
  ctx.drawImage(tintedPose(image,frame,frameIndex,'#ff383e'),rect.x,rect.y,rect.w,rect.h);
 }
 ctx.restore();return true;
}
function shard(ctx,x,y,scale,angle,alpha=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.globalAlpha*=alpha;
 ctx.shadowColor='#ffeab8';ctx.shadowBlur=9;
 ctx.lineWidth=2.2;ctx.strokeStyle='#8a7082';
 ctx.fillStyle='#fff9e8';ctx.beginPath();
 ctx.moveTo(-15,-11);ctx.quadraticCurveTo(1,-19,17,-9);
 ctx.lineTo(15,12);ctx.quadraticCurveTo(0,18,-15,9);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.strokeStyle='#d1b0ab';ctx.lineWidth=2;ctx.beginPath();
 ctx.moveTo(-10,-1);ctx.lineTo(9,-1);ctx.moveTo(-9,5);ctx.lineTo(5,5);ctx.stroke();
 ctx.restore();
}
export function drawPaperCombatFx(ctx,elapsed,{enemyX,enemyY,heroX,heroY,reducedMotion=false}){
 const hit=paperHitFlashAt(elapsed,{reducedMotion});
 const actorX=enemyX+85,actorY=enemyY+130;
 if(hit.burst>0){
  ctx.save();ctx.globalAlpha=hit.burst*.9;ctx.translate(actorX-7,actorY-12);
  ctx.strokeStyle='#fff9ec';ctx.lineWidth=6;ctx.shadowColor='#ffe1c4';ctx.shadowBlur=26;
  ctx.beginPath();ctx.arc(0,0,17+(1-hit.burst)*27,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<7;i++){const a=(i/7)*Math.PI*2;
   const r=24+(1-hit.burst)*30;
   ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
   ctx.lineTo(Math.cos(a)*(r+10),Math.sin(a)*(r+10));ctx.stroke();
  }ctx.restore();
 }
 const fx=paperAttackFxAt(elapsed);if(!fx.active)return;
 const fromX=enemyX+43,fromY=enemyY+133,toX=heroX+167,toY=heroY+135;
 if(fx.charge>0){
  ctx.save();ctx.globalAlpha=fx.charge*(reducedMotion?.45:1);
  for(let i=0;i<3;i++){const a=i*2.09+elapsed*.009;
   shard(ctx,fromX+Math.cos(a)*26,fromY+Math.sin(a)*29,.45,a,fx.charge);
  }ctx.restore();
 }
 if(fx.projectile){
  const p=fx.flight,ease=1-Math.pow(1-p,2);
  for(let i=0;i<3;i++){
   const lag=i*.14,portion=clamp((ease-lag)/(1-lag));
   const x=fromX+(toX-fromX)*portion,y=fromY+(toY-fromY)*portion+Math.sin((p+i*.20)*Math.PI)*((i-1)*17);
   ctx.save();ctx.globalAlpha=(1-i*.19)*(reducedMotion?.65:1);
   ctx.strokeStyle=i===0?'#fff4c6':'#f5d1de';ctx.lineWidth=i===0?4:2;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(x+22,y+3);ctx.lineTo(x+49+i*13,y+(i-1)*6);ctx.stroke();
   ctx.restore();
   shard(ctx,x,y,i===0?1:.68,-p*7-i*.8,1-i*.22);
  }
 }
 if(fx.burst>0){
  ctx.save();ctx.globalAlpha=fx.burst;ctx.strokeStyle='#fff8ed';ctx.lineWidth=6;
  ctx.shadowColor='#ffcc9f';ctx.shadowBlur=21;
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const r=11+(1-fx.burst)*32;
   ctx.beginPath();ctx.moveTo(toX+Math.cos(a)*r,toY+Math.sin(a)*r);
   ctx.lineTo(toX+Math.cos(a)*(r+14),toY+Math.sin(a)*(r+14));ctx.stroke();
  }ctx.restore();
 }
}
