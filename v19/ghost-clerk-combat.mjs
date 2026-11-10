/** The sixth base normal enemy is a HAUNTED HUMAN OFFICE CLERK.
 * Only independently illustrated atlas frames animate the body. Spell particles
 * below are detachable paper projectiles, NOT a fake actor made of geometry.
 */
export const CLERK_HERO_HIT_MS=405,CLERK_HURT_END_MS=850,CLERK_ATTACK_START_MS=865;
export const CLERK_REPORT_RELEASE_MS=1115,CLERK_REPORT_IMPACT_MS=1255,CLERK_ATTACK_END_MS=1550;
export const CLERK_FADE_START_MS=1510,CLERK_DEFEAT_END_MS=1770;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function clerkCombatPoseAt(elapsed,result){
 const t=Number(elapsed);
 if(!Number.isFinite(t)||t<0||!result)return {state:'idle',progress:0};
 if(result.type==='victory')
  return t>=CLERK_HERO_HIT_MS&&t<CLERK_DEFEAT_END_MS
   ?{state:'defeat',progress:clamp((t-CLERK_HERO_HIT_MS)/1295)}:{state:'idle',progress:0};
 if(result.type!=='hit')return {state:'idle',progress:0};
 if(t>=CLERK_HERO_HIT_MS&&t<CLERK_HURT_END_MS)
  return {state:'hurt',progress:clamp((t-CLERK_HERO_HIT_MS)/445)};
 if(t>=CLERK_ATTACK_START_MS&&t<CLERK_ATTACK_END_MS&&Number(result.retaliationDamage)>0)
  return {state:'attack',progress:clamp((t-CLERK_ATTACK_START_MS)/685)};
 return {state:'idle',progress:0};
}
export function clerkReportAt(elapsed,canRetaliate=true,{enemyX=458,enemyY=248,heroX=100,heroY=227}={}){
 const t=Number(elapsed),active=canRetaliate&&Number.isFinite(t)&&t>=CLERK_ATTACK_START_MS&&t<CLERK_ATTACK_END_MS;
 const charge=active&&t<CLERK_REPORT_RELEASE_MS?clamp((t-CLERK_ATTACK_START_MS)/(CLERK_REPORT_RELEASE_MS-CLERK_ATTACK_START_MS)):0;
 const projectile=active&&t>=CLERK_REPORT_RELEASE_MS&&t<CLERK_REPORT_IMPACT_MS;
 const flight=clamp((t-CLERK_REPORT_RELEASE_MS)/(CLERK_REPORT_IMPACT_MS-CLERK_REPORT_RELEASE_MS));
 const originX=enemyX+48,originY=enemyY+115,targetX=heroX+155,targetY=heroY+124;
 const p=1-Math.pow(1-flight,1.4);
 const impact=active&&t>=CLERK_REPORT_IMPACT_MS?clamp(1-(t-CLERK_REPORT_IMPACT_MS)/190):0;
 return {active,charge,projectile,flight,impact,originX,originY,targetX,targetY,
  x:originX+(targetX-originX)*p,y:originY+(targetY-originY)*p-28*Math.sin(p*Math.PI),
  travelsLeft:originX>targetX};
}
export function clerkHurtFlashAt(elapsed,{reducedMotion=false}={}){
 const age=Number(elapsed)-CLERK_HERO_HIT_MS;
 if(!Number.isFinite(age)||age<0||age>=300)return {active:false,white:0,red:0};
 const white=age<40?.92*(1-age/40):0;
 const red=age>=40?(age<220?.95-.21*(age-40)/180:.74*(1-(age-220)/80)):0;
 return {active:true,white:reducedMotion?white*.57:white,red:reducedMotion?red*.62:red};
}
const tintCache=new WeakMap();
function tinted(image,frame,index,color){
 let cache=tintCache.get(image);if(!cache){cache=new Map();tintCache.set(image,cache);}
 const key=frame.cell+':'+index+':'+color;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=frame.cell;canvas.height=frame.cell;
 const local=canvas.getContext('2d');
 local.drawImage(image,index*frame.cell,0,frame.cell,frame.cell,0,0,frame.cell,frame.cell);
 local.globalCompositeOperation='source-in';local.fillStyle=color;local.fillRect(0,0,frame.cell,frame.cell);
 cache.set(key,canvas);return canvas;
}
export function drawClerkHurtTint(ctx,image,frame,index,rect,elapsed,options={}){
 const effect=clerkHurtFlashAt(elapsed,options);
 if(!effect.active||!image||!frame||!rect)return false;
 for(const [amount,color] of [[effect.white,'#ffe9ff'],[effect.red,'#ff203c']]){
  if(amount<=0)continue;
  ctx.save();ctx.globalAlpha*=amount;
  ctx.drawImage(tinted(image,frame,index,color),rect.x,rect.y,rect.w,rect.h);
  ctx.restore();
 }
 return true;
}
/** Three cursed office reports fly from enemy RIGHT toward hero LEFT.
 * They do not affect the actor sprite, its positions or its frame animation.
 */
export function drawClerkReportFx(ctx,elapsed,options={}){
 const s=clerkReportAt(elapsed,options.canRetaliate!==false,options);
 if(!s.active)return;
 ctx.save();ctx.globalAlpha*=options.reducedMotion?.7:1;
 if(s.charge){
  ctx.globalAlpha*=s.charge;
  ctx.shadowColor='#c264ff';ctx.shadowBlur=19;
  ctx.strokeStyle='#f4b2ff';ctx.lineWidth=3;
  for(let i=0;i<3;i++){
   const a=elapsed/360+i*Math.PI*2/3;
   const x=s.originX+Math.cos(a)*(20+s.charge*20);
   const y=s.originY+Math.sin(a)*(18+s.charge*11);
   ctx.strokeRect(x-5,y-9,11,17);
  }
 }
 if(s.projectile){
  for(let i=0;i<3;i++){
   const x=s.x+i*21,y=s.y+Math.sin(elapsed/110+i)*13+i*8;
   ctx.save();ctx.translate(x,y);ctx.rotate(-.26+i*.2);
   ctx.shadowColor='#a85aff';ctx.shadowBlur=15;
   ctx.fillStyle='#f4e0ff';ctx.strokeStyle='#9a55db';ctx.lineWidth=2;
   ctx.fillRect(-13,-17,26,34);ctx.strokeRect(-13,-17,26,34);
   ctx.strokeStyle='#bb65ef';ctx.lineWidth=1.5;
   for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-8,-9+j*8);ctx.lineTo(8,-9+j*8);ctx.stroke();}
   ctx.restore();
  }
 }
 if(s.impact>0){
  ctx.globalAlpha*=s.impact;ctx.strokeStyle='#f5d6ff';ctx.lineWidth=4;
  ctx.shadowColor='#cf78ff';ctx.shadowBlur=22;
  for(let i=0;i<7;i++){
   const angle=i*Math.PI*2/7,r=20+(1-s.impact)*67;
   ctx.beginPath();ctx.moveTo(s.targetX+Math.cos(angle)*r*.55,s.targetY+Math.sin(angle)*r*.55);
   ctx.lineTo(s.targetX+Math.cos(angle)*r,s.targetY+Math.sin(angle)*r);ctx.stroke();
  }
 }
 ctx.restore();
}
