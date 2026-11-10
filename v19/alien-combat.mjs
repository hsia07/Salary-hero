/** 第 4 隻｜星際打卡實習生 (meeting-ghost) — 独立攻擊時序候選。
 * Art cannot be promoted until the Q 版 16-frame transparent sprite sheet
 * passes visual/real-browser review. This module draws ONLY separate spell FX
 * and never pretends an emoji, geometry or rigid transform is actor animation.
 */
export const ALIEN_HERO_HIT_MS=405;
export const ALIEN_HURT_END_MS=830;
export const ALIEN_ATTACK_START_MS=845;
export const ALIEN_STAMP_RAISE_MS=1045;
export const ALIEN_STAMP_RELEASE_MS=1125;
export const ALIEN_STAMP_IMPACT_MS=1215;
export const ALIEN_ATTACK_END_MS=1505;
export const ALIEN_DEFEAT_END_MS=1700;
export const ALIEN_ATTACK_DURATIONS=Object.freeze([155,125,100,95,185]);
const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
/** Enemy positioned right of the hero. The projectile MUST travel to the left. */
export function alienStampRouteAt(elapsed,{enemyX=458,enemyY=248,heroX=100,heroY=227}={}){
 const flight=alienStampAt(elapsed).flight;
 const originX=enemyX+35,originY=enemyY+115;
 const targetX=heroX+155,targetY=heroY+105;
 const u=1-Math.pow(1-flight,1.8);
 return {originX,originY,targetX,targetY,x:originX+(targetX-originX)*u,
   y:originY+(targetY-originY)*u-25*Math.sin(Math.PI*u),travelsLeft:targetX<originX};
}
/** Draw an original alpha-masked white/scarlet reaction on alien frames only. */
const alienTintCache=new WeakMap();
function tintedAlienFrame(image,frame,index,color){
 let cache=alienTintCache.get(image);
 if(!cache){cache=new Map();alienTintCache.set(image,cache);}
 const key=index+':'+color;
 if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');
 canvas.width=frame.cell;canvas.height=frame.cell;
 const c=canvas.getContext('2d');
 c.drawImage(image,index*frame.cell,0,frame.cell,frame.cell,0,0,frame.cell,frame.cell);
 c.globalCompositeOperation='source-in';c.fillStyle=color;
 c.fillRect(0,0,frame.cell,frame.cell);
 cache.set(key,canvas);return canvas;
}
export function drawAlienInjuryTint(ctx,image,frame,index,rect,elapsed,options={}){
 const flash=alienInjuryAt(elapsed,options);
 if(!flash.active||!image||!rect)return false;
 for(const [amount,color] of [[flash.white,'#fff5f8'],[flash.red,'#ff2347']]){
   if(amount<=0)continue;
   ctx.save();ctx.globalAlpha*=amount;
   ctx.drawImage(tintedAlienFrame(image,frame,index,color),rect.x,rect.y,rect.w,rect.h);
   ctx.restore();
 }
 return true;
}
/** State must select genuinely separately illustrated arms/antennae/face/tentacle
 * poses when the image manifest is added. This function never rotates sprites. */
export function alienCombatPoseAt(elapsed,result){
 const t=Number(elapsed);
 if(!Number.isFinite(t)||!result||t<0)return {state:'idle',progress:0};
 if(result.type==='victory')
  return t>=ALIEN_HERO_HIT_MS&&t<ALIEN_DEFEAT_END_MS
   ?{state:'defeat',progress:clamp((t-ALIEN_HERO_HIT_MS)/935)}:{state:'idle',progress:0};
 if(result.type!=='hit')return {state:'idle',progress:0};
 if(t>=ALIEN_HERO_HIT_MS&&t<ALIEN_HURT_END_MS)
  return {state:'hurt',progress:clamp((t-ALIEN_HERO_HIT_MS)/(ALIEN_HURT_END_MS-ALIEN_HERO_HIT_MS))};
 if(t>=ALIEN_ATTACK_START_MS&&t<ALIEN_ATTACK_END_MS&&Number(result.retaliationDamage)>0)
  return {state:'attack',progress:clamp((t-ALIEN_ATTACK_START_MS)/(ALIEN_ATTACK_END_MS-ALIEN_ATTACK_START_MS))};
 return {state:'idle',progress:0};
}
/** Chromatic stamp moves only AFTER the tentacle release frame, and actually
 * contacts the hero at 1215ms. In a winning strike it never fires. */
export function alienStampAt(elapsed,canRetaliate=true){
 const t=Number(elapsed);
 if(!canRetaliate||!Number.isFinite(t)||t<ALIEN_ATTACK_START_MS||t>=ALIEN_ATTACK_END_MS)
  return {active:false,charge:0,flight:0,projectile:false,impact:0};
 const charge=t<ALIEN_STAMP_RELEASE_MS
  ?clamp((t-ALIEN_ATTACK_START_MS)/(ALIEN_STAMP_RELEASE_MS-ALIEN_ATTACK_START_MS)):0;
 const projectile=t>=ALIEN_STAMP_RELEASE_MS&&t<ALIEN_STAMP_IMPACT_MS;
 const flight=clamp((t-ALIEN_STAMP_RELEASE_MS)/(ALIEN_STAMP_IMPACT_MS-ALIEN_STAMP_RELEASE_MS));
 const impact=t>=ALIEN_STAMP_IMPACT_MS?clamp(1-(t-ALIEN_STAMP_IMPACT_MS)/200):0;
 return {active:true,charge,flight,projectile,impact};
}
export function alienInjuryAt(elapsed,{reducedMotion=false}={}){
 const age=Number(elapsed)-ALIEN_HERO_HIT_MS;
 if(!Number.isFinite(age)||age<0||age>=290)return {active:false,white:0,red:0};
 const white=age<44?(1-age/44)*.83:0;
 const red=age>=44?(age<216?.86-.25*(age-44)/172:.61*(1-(age-216)/74)):0;
 return {active:true,white:reducedMotion?white*.5:white,red:reducedMotion?red*.58:red};
}
/** Separated attack FX: no body drawing. The actual chibi body MUST be an
 * independently illustrated sprite atlas before this gets enabled in-game. */
export function drawAlienStampFx(ctx,elapsed,{enemyX=0,enemyY=0,heroX=0,heroY=0,canRetaliate=true,reducedMotion=false}={}){
 const stamp=alienStampAt(elapsed,canRetaliate);
 if(!stamp.active)return;
 const route=alienStampRouteAt(elapsed,{enemyX,enemyY,heroX,heroY});
 const {originX,originY,targetX,targetY}=route;
 ctx.save();
 ctx.globalAlpha*=reducedMotion?.65:1;
 if(stamp.charge>0){
   const power=stamp.charge;
   ctx.strokeStyle='#d98fff';ctx.shadowColor='#a826ff';ctx.shadowBlur=25;
   ctx.lineWidth=4;
   for(let i=0;i<3;i++){
    ctx.beginPath();ctx.ellipse(originX,originY,15+power*26+i*9,7+power*15,0,0,Math.PI*2);ctx.stroke();
   }
 }
 if(stamp.projectile){
   const {x,y}=route;
   ctx.shadowColor='#d653ff';ctx.shadowBlur=20;
   ctx.fillStyle='#9c3def';ctx.fillRect(x-19,y-14,38,28);
   ctx.lineWidth=3;ctx.strokeStyle='#ffe8ff';ctx.strokeRect(x-17,y-12,34,24);
   ctx.fillStyle='#fff';ctx.fillRect(x-6,y-6,12,12);
 }
 if(stamp.impact>0){
   const alpha=stamp.impact;
   ctx.globalAlpha*=alpha;ctx.strokeStyle='#eeb5ff';ctx.lineWidth=5;
   ctx.shadowColor='#ac39ff';ctx.shadowBlur=22;
   for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;const d=18+(1-alpha)*50;
    ctx.beginPath();ctx.moveTo(targetX+Math.cos(a)*d,targetY+Math.sin(a)*d);
    ctx.lineTo(targetX+Math.cos(a)*(d+15),targetY+Math.sin(a)*(d+15));ctx.stroke();
   }
 }
 ctx.restore();
}
