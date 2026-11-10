/* V19.5 evil pantry mimic: independent illustrated poses and actual coffee splash FX.
 * The cup character itself is drawn ONLY from the shipped WebP poses.
 * This module draws detached coffee droplets/impact without moving the anatomy.
 */
export const COFFEE_HERO_HIT_MS=405;
export const COFFEE_ATTACK_START_MS=805;
export const COFFEE_SPRAY_LAUNCH_MS=1070;
export const COFFEE_SPRAY_IMPACT_MS=1215;
export const COFFEE_ATTACK_END_MS=1445;
export const COFFEE_ATTACK_POSE_MS=Object.freeze([130,135,95,115,165]);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function coffeeCombatPoseAt(elapsed,result){
 const t=Number(elapsed);
 if(!result||!Number.isFinite(t)||t<0)return {state:'idle',progress:0};
 if(result.type==='victory'){
   return t>=COFFEE_HERO_HIT_MS&&t<1100
     ?{state:'defeat',progress:clamp((t-COFFEE_HERO_HIT_MS)/620)}
     :{state:'idle',progress:0};
 }
 if(result.type!=='hit')return {state:'idle',progress:0};
 if(t>=COFFEE_HERO_HIT_MS&&t<805)
   return {state:'hurt',progress:clamp((t-COFFEE_HERO_HIT_MS)/400)};
 if(t>=COFFEE_ATTACK_START_MS&&t<COFFEE_ATTACK_END_MS&&Number(result.retaliationDamage)>0)
   return {state:'attack',progress:clamp((t-COFFEE_ATTACK_START_MS)/640)};
 return {state:'idle',progress:0};
}
export function coffeeSplashAt(elapsed,canRetaliate=true){
 const t=Number(elapsed);
 if(!canRetaliate||!Number.isFinite(t)||t<COFFEE_ATTACK_START_MS||t>=COFFEE_ATTACK_END_MS)
   return {active:false,charging:0,flight:0,spray:false,impact:0};
 const windup=clamp((t-COFFEE_ATTACK_START_MS)/(COFFEE_SPRAY_LAUNCH_MS-COFFEE_ATTACK_START_MS));
 const spray=t>=COFFEE_SPRAY_LAUNCH_MS&&t<COFFEE_SPRAY_IMPACT_MS;
 const flight=clamp((t-COFFEE_SPRAY_LAUNCH_MS)/(COFFEE_SPRAY_IMPACT_MS-COFFEE_SPRAY_LAUNCH_MS));
 const impact=t>=COFFEE_SPRAY_IMPACT_MS?clamp(1-(t-COFFEE_SPRAY_IMPACT_MS)/160):0;
 return {active:true,charging:Math.sin(Math.PI*windup),flight,spray,impact};
}
function coffeeDrop(ctx,x,y,r,alpha=1){
 ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle='#542512';ctx.strokeStyle='#dca06b';
 ctx.lineWidth=Math.max(1,r*.14);
 ctx.beginPath();ctx.ellipse(x,y,r,r*.65,-.27,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#f5cc99';ctx.globalAlpha*=.65;ctx.beginPath();
 ctx.ellipse(x-r*.23,y-r*.19,r*.20,r*.11,-.3,0,Math.PI*2);ctx.fill();ctx.restore();
}
export function drawCoffeeCombatFx(ctx,elapsed,{enemyX,enemyY,heroX,heroY,reducedMotion=false,canRetaliate=true}={}){
 const hitAge=elapsed-COFFEE_HERO_HIT_MS;
 if(hitAge>=0&&hitAge<170){
  const fade=1-hitAge/170;
  ctx.save();ctx.globalAlpha=fade;ctx.lineWidth=4.5;ctx.strokeStyle='#fff6dc';
  ctx.shadowColor='#ffb57b';ctx.shadowBlur=23;const x=enemyX+93,y=enemyY+140;
  ctx.beginPath();ctx.arc(x,y,18+hitAge*.14,0,Math.PI*2);ctx.stroke();
  for(let j=0;j<7;j++){const angle=j*Math.PI*2/7;
    ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*22,y+Math.sin(angle)*22);
    ctx.lineTo(x+Math.cos(angle)*(34+hitAge*.13),y+Math.sin(angle)*(34+hitAge*.13));ctx.stroke();
  }ctx.restore();
 }
 const p=coffeeSplashAt(elapsed,canRetaliate);if(!p.active)return;
 // The approved illustrated attack poses already include the initial brown jet.
 // This secondary detached, physically-travelling coffee splash heads LEFT.
 const launch={x:enemyX+43,y:enemyY+130},dest={x:heroX+166,y:heroY+134};
 if(p.charging>0){
  ctx.save();ctx.globalAlpha=p.charging*(reducedMotion?.55:1);
  for(let j=0;j<4;j++){let v=j*2.1+elapsed*.006;
   coffeeDrop(ctx,launch.x+Math.cos(v)*19,launch.y+Math.sin(v)*19,5+j%2*2,p.charging);
  }ctx.restore();
 }
 if(p.spray){
  ctx.save();ctx.globalAlpha=reducedMotion?.7:1;
  const u=1-Math.pow(1-p.flight,1.35);
  for(let j=0;j<9;j++){
   const offset=j/12,progress=clamp((u-offset)/(1-offset));
   const x=launch.x+(dest.x-launch.x)*progress;
   const y=launch.y+(dest.y-launch.y)*progress+Math.sin((p.flight+j*.13)*Math.PI)*(j%3-1)*11;
   coffeeDrop(ctx,x,y,7+(j%4)*3,(1-j/13)*.9);
  }ctx.restore();
 }
 if(p.impact>0){
  ctx.save();ctx.globalAlpha=p.impact;ctx.shadowColor='#df8d4b';ctx.shadowBlur=17;
  for(let j=0;j<12;j++){const angle=j*Math.PI*2/12;
   const radius=10+(1-p.impact)*42;
   coffeeDrop(ctx,dest.x+Math.cos(angle)*radius,dest.y+Math.sin(angle)*radius,3+(j%3)*2,p.impact);
  }ctx.restore();
 }
}
