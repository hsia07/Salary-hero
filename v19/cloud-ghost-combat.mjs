/** Fifth ordinary enemy: cloud-deadline ghost. Actual body poses come ONLY
 * from its original transparent WebP candidate, never Canvas substitutes. */
export const CLOUD_HERO_HIT_MS=405,CLOUD_HURT_END_MS=840,CLOUD_ATTACK_START_MS=850;
export const CLOUD_CLOCK_LAUNCH_MS=1135,CLOUD_CLOCK_IMPACT_MS=1225,CLOUD_ATTACK_END_MS=1550;
export const CLOUD_FADE_START_MS=1510,CLOUD_DEFEAT_END_MS=1740;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function cloudCombatPoseAt(elapsed,result){
 const t=Number(elapsed);
 if(!Number.isFinite(t)||t<0||!result)return {state:'idle',progress:0};
 if(result.type==='victory')return t>=CLOUD_HERO_HIT_MS&&t<CLOUD_DEFEAT_END_MS
  ?{state:'defeat',progress:clamp((t-CLOUD_HERO_HIT_MS)/1180)}:{state:'idle',progress:0};
 if(result.type!=='hit')return {state:'idle',progress:0};
 if(t>=CLOUD_HERO_HIT_MS&&t<CLOUD_HURT_END_MS)return {state:'hurt',progress:clamp((t-CLOUD_HERO_HIT_MS)/435)};
 if(t>=CLOUD_ATTACK_START_MS&&t<CLOUD_ATTACK_END_MS&&Number(result.retaliationDamage)>0)
  return {state:'attack',progress:clamp((t-CLOUD_ATTACK_START_MS)/670)};
 return {state:'idle',progress:0};
}
export function cloudClockAt(elapsed,canRetaliate=true,{enemyX=458,enemyY=248,heroX=100,heroY=227}={}){
 const t=Number(elapsed),active=canRetaliate&&Number.isFinite(t)&&t>=CLOUD_ATTACK_START_MS&&t<CLOUD_ATTACK_END_MS;
 const charge=active&&t<CLOUD_CLOCK_LAUNCH_MS?clamp((t-CLOUD_ATTACK_START_MS)/(CLOUD_CLOCK_LAUNCH_MS-CLOUD_ATTACK_START_MS)):0;
 const projectile=active&&t>=CLOUD_CLOCK_LAUNCH_MS&&t<CLOUD_CLOCK_IMPACT_MS;
 const flight=clamp((t-CLOUD_CLOCK_LAUNCH_MS)/(CLOUD_CLOCK_IMPACT_MS-CLOUD_CLOCK_LAUNCH_MS));
 const hit=t>=CLOUD_CLOCK_IMPACT_MS?clamp(1-(t-CLOUD_CLOCK_IMPACT_MS)/190):0;
 const originX=enemyX+52,originY=enemyY+94,targetX=heroX+148,targetY=heroY+115;
 const u=1-Math.pow(1-flight,1.6);
 return {active,charge,projectile,flight,impact:active?hit:0,
  originX,originY,targetX,targetY,x:originX+(targetX-originX)*u,
  y:originY+(targetY-originY)*u-26*Math.sin(Math.PI*u),travelsLeft:targetX<originX};
}
export function cloudHurtFlashAt(elapsed,{reducedMotion=false}={}){
 const age=Number(elapsed)-CLOUD_HERO_HIT_MS;
 if(!Number.isFinite(age)||age<0||age>=310)return {active:false,white:0,red:0};
 const white=age<45?.94*(1-age/45):0;
 const red=age>=45?(age<215?.85-.14*(age-45)/170:.71*(1-(age-215)/95)):0;
 return {active:true,white:reducedMotion?white*.60:white,red:reducedMotion?red*.65:red};
}
const tintCache=new WeakMap();
function makeTint(image,frame,index,color){
 let cache=tintCache.get(image);if(!cache){cache=new Map();tintCache.set(image,cache)}
 const key=frame.cell+':'+index+':'+color;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=frame.cell;canvas.height=frame.cell;
 const c=canvas.getContext('2d');
 c.drawImage(image,index*frame.cell,0,frame.cell,frame.cell,0,0,frame.cell,frame.cell);
 c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,frame.cell,frame.cell);
 cache.set(key,canvas);return canvas;
}
export function drawCloudHurtTint(ctx,image,frame,index,rect,elapsed,options={}){
 const flash=cloudHurtFlashAt(elapsed,options);
 if(!flash.active||!image||!frame||!rect)return false;
 for(const [alpha,color] of [[flash.white,'#fff2ff'],[flash.red,'#ff294a']]){
  if(alpha<=0)continue;
  ctx.save();ctx.globalAlpha*=alpha;
  ctx.drawImage(makeTint(image,frame,index,color),rect.x,rect.y,rect.w,rect.h);
  ctx.restore();
 }
 return true;
}
/** Deliberately geometric ONLY for a SPELL projectile, never for the monster. */
export function drawCloudClockFx(ctx,elapsed,options={}){
 const s=cloudClockAt(elapsed,options.canRetaliate!==false,options);
 if(!s.active)return;
 ctx.save();ctx.globalAlpha*=options.reducedMotion?.7:1;
 if(s.charge>0){
  ctx.strokeStyle='#dc99fa';ctx.shadowColor='#b64afd';ctx.shadowBlur=21;ctx.lineWidth=4;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(s.originX,s.originY,14+i*11+s.charge*10,
   -1.1+elapsed/610,1.7+elapsed/610);ctx.stroke();}
 }
 if(s.projectile||s.impact>0){
  ctx.globalAlpha*=s.projectile?1:s.impact;
  const x=s.projectile?s.x:s.targetX,y=s.projectile?s.y:s.targetY,r=s.projectile?25:25+(1-s.impact)*38;
  if(s.projectile){ctx.strokeStyle='#af7bff';ctx.lineWidth=10;ctx.shadowColor='#a65cff';ctx.shadowBlur=18;
   ctx.beginPath();ctx.moveTo(x+14,y);ctx.lineTo(x+53,y+5);ctx.stroke();}
  ctx.strokeStyle='#ead2ff';ctx.lineWidth=5;ctx.shadowColor='#a95dff';ctx.shadowBlur=20;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
  if(s.projectile){ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.shadowBlur=0;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y-13);ctx.lineTo(x+12,y+6);ctx.stroke();}
 }
 ctx.restore();
}
