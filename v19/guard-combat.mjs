/* V19.7 — EVIL CLOCK-IN SECURITY MECH (candidate rehearsal only)
 * Anatomy always comes from 16 independently illustrated WebP poses.
 * Detatched scan beams, hazard-bar swing trail, and impact sparks are FX,
 * not fake whole-body scale/jitter/rotation.
 * This is a normal-tier monster (guard trait), NOT an elite that needs special poses.
 */
export const GUARD_HERO_HIT_MS=405;
export const GUARD_ATTACK_START_MS=805;
export const GUARD_BEAM_LAUNCH_MS=1080;
export const GUARD_BEAM_IMPACT_MS=1160;
export const GUARD_ATTACK_END_MS=1455;
export const GUARD_DEFEAT_FADE_START_MS=1280;
export const GUARD_DEFEAT_END_MS=1550;
export const GUARD_ATTACK_POSE_MS=Object.freeze([145,155,75,115,160]);
export const GUARD_LOCK_START_MS=930;
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
export function guardCombatPoseAt(elapsed,result){
 const t=Number(elapsed);
 if(!result||!Number.isFinite(t)||t<0)return {state:'idle',progress:0};
 if(result.type==='victory')return t>=GUARD_HERO_HIT_MS&&t<GUARD_DEFEAT_END_MS
  ?{state:'defeat',progress:clamp((t-GUARD_HERO_HIT_MS)/895)}:{state:'idle',progress:0};
 if(result.type!=='hit')return {state:'idle',progress:0};
 if(t>=GUARD_HERO_HIT_MS&&t<GUARD_ATTACK_START_MS)
  return {state:'hurt',progress:clamp((t-GUARD_HERO_HIT_MS)/400)};
 if(t>=GUARD_ATTACK_START_MS&&t<GUARD_ATTACK_END_MS&&Number(result.retaliationDamage)>0)
  return {state:'attack',progress:clamp((t-GUARD_ATTACK_START_MS)/650)};
 return {state:'idle',progress:0};
}
export function guardBeamAt(elapsed,canRetaliate=true){
 const t=Number(elapsed);
 if(!canRetaliate||!Number.isFinite(t)||t<GUARD_ATTACK_START_MS||t>=GUARD_ATTACK_END_MS)
  return {active:false,charging:0,beam:0,projectile:false,impact:0};
 const charge=t<GUARD_BEAM_LAUNCH_MS?Math.sin(Math.PI*clamp((t-GUARD_ATTACK_START_MS)/(GUARD_BEAM_LAUNCH_MS-GUARD_ATTACK_START_MS))):0;
 const projectile=t>=GUARD_BEAM_LAUNCH_MS&&t<GUARD_BEAM_IMPACT_MS;
 const beam=clamp((t-GUARD_BEAM_LAUNCH_MS)/(GUARD_BEAM_IMPACT_MS-GUARD_BEAM_LAUNCH_MS));
 const impact=t>=GUARD_BEAM_IMPACT_MS?clamp(1-(t-GUARD_BEAM_IMPACT_MS)/170):0;
 return {active:true,charging:charge,beam,projectile,impact};
}
/** A separate animated targeting lock. This is attack FX, never a substitute for
 * the five hand-drawn attack sprites or three distinct injured sprites. */
export function guardTargetLockAt(elapsed,canRetaliate=true){
 const t=Number(elapsed);
 if(!canRetaliate||!Number.isFinite(t)||t<GUARD_LOCK_START_MS||t>=GUARD_BEAM_IMPACT_MS)
  return {active:false,strength:0,closing:0};
 const charge=clamp((t-GUARD_LOCK_START_MS)/(GUARD_BEAM_LAUNCH_MS-GUARD_LOCK_START_MS));
 const flight=clamp((t-GUARD_BEAM_LAUNCH_MS)/(GUARD_BEAM_IMPACT_MS-GUARD_BEAM_LAUNCH_MS));
 return {active:true,strength:Math.min(1,.32+charge*.55+flight*.13),closing:charge*.65+flight*.35};
}
/** Human-readable live battle cue in isolated art rehearsal only. */
export function guardCombatCaptionAt(elapsed,result){
 const t=Number(elapsed);
 if(!result||!Number.isFinite(t))return '機兵巡邏・等待交戰';
 if(t<GUARD_HERO_HIT_MS)return '勇者蓄力・即將命中';
 if(result.type==='victory'){
  if(t<GUARD_DEFEAT_FADE_START_MS)return '機兵受創・機體分段崩解';
  if(t<GUARD_DEFEAT_END_MS)return '最後一格碎裂姿勢・定格';
  return '機兵重新進場';
 }
 if(result.type!=='hit')return '機兵巡邏・等待交戰';
 if(t<GUARD_ATTACK_START_MS)return '機兵受擊・紅白閃爍';
 if(Number(result.retaliationDamage)<=0)return '反擊未觸發・等待下一擊';
 if(t<GUARD_LOCK_START_MS)return '機兵反擊・聚集紅色能量';
 if(t<GUARD_BEAM_LAUNCH_MS)return '危險！紅色掃描鎖定勇者';
 if(t<GUARD_BEAM_IMPACT_MS)return '警報！掃描光束飛行中';
 if(t<GUARD_ATTACK_END_MS)return '光束命中・勇者受擊';
 return '機兵巡邏・等待交戰';
}
function spark(ctx,x,y,size,alpha){
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);
 ctx.lineCap='round';ctx.strokeStyle='#fff5cc';ctx.shadowColor='#ff394d';ctx.shadowBlur=16;
 ctx.lineWidth=Math.max(2,size*.19);
 for(let i=0;i<4;i++){const theta=i*Math.PI/2+.3;
   ctx.beginPath();ctx.moveTo(Math.cos(theta)*size*.38,Math.sin(theta)*size*.38);
   ctx.lineTo(Math.cos(theta)*size,Math.sin(theta)*size);ctx.stroke();
 }
 ctx.restore();
}
function scanLine(ctx,x1,y1,x2,y2,alpha,thickness=7){
 ctx.save();ctx.globalAlpha*=alpha;ctx.lineCap='round';
 ctx.shadowColor='#ff304e';ctx.shadowBlur=24;
 ctx.strokeStyle='#ff4863';ctx.lineWidth=thickness*2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
 ctx.strokeStyle='#fff0db';ctx.lineWidth=Math.max(2,thickness*.4);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
 ctx.restore();
}
export function drawGuardCombatFx(ctx,elapsed,{enemyX,enemyY,heroX,heroY,reducedMotion=false,canRetaliate=true,eliteSkill=false}={}){
 if(!Number.isFinite(Number(elapsed)))return;
 const t=Number(elapsed);
 const bodyX=enemyX+113,bodyY=enemyY+142;
 const hitAge=t-GUARD_HERO_HIT_MS;
 if(hitAge>=0&&hitAge<195){
   const a=clamp(1-hitAge/195);
   ctx.save();ctx.globalAlpha=a*(reducedMotion?.55:1);
   spark(ctx,bodyX-11,bodyY-18,22+hitAge*.18,1);
   for(let i=0;i<6;i++){const th=i*Math.PI/3;
     const r=17+(1-a)*39;
     spark(ctx,bodyX+Math.cos(th)*r,bodyY+Math.sin(th)*r,8,a);
   }ctx.restore();
 }
 const p=guardBeamAt(t,canRetaliate);
 if(!p.active)return;
 const startX=enemyX+40,startY=enemyY+148;
 const endX=heroX+169,endY=heroY+130;
 // Animate the lock ON THE HERO before the laser strikes. No fake actor motion.
 const lock=guardTargetLockAt(t,canRetaliate);
 if(lock.active){
   ctx.save();ctx.translate(endX,endY);
   ctx.globalAlpha*=lock.strength*(reducedMotion?.48:1);
   ctx.strokeStyle='#ff344e';ctx.shadowColor='#ff123e';ctx.shadowBlur=19;
   ctx.lineWidth=3.5;const radius=42-lock.closing*20;
   ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffe7d7';ctx.lineWidth=2;
   for(let i=0;i<4;i++){
     const a=i*Math.PI/2;
     ctx.beginPath();
     ctx.moveTo(Math.cos(a)*(radius+6),Math.sin(a)*(radius+6));
     ctx.lineTo(Math.cos(a)*(radius-9),Math.sin(a)*(radius-9));ctx.stroke();
   }
   ctx.restore();
 }
 if(p.charging>0){
   ctx.save();ctx.globalAlpha=p.charging*(reducedMotion?.45:1);
   ctx.strokeStyle='#ff4c5f';ctx.lineWidth=3;ctx.shadowColor='#f22';ctx.shadowBlur=13;
   ctx.beginPath();ctx.arc(bodyX-55,bodyY-21,15+24*p.charging,-1.5,1.5);ctx.stroke();
   for(let i=0;i<4;i++)spark(ctx,startX+(i-2)*12,startY+(i%2?16:-12),5+i,p.charging);
   ctx.restore();
 }
 if(p.projectile){
   const u=1-Math.pow(1-p.beam,1.6);
   const x=startX+(endX-startX)*u,y=startY+(endY-startY)*u;
   // Scanning energy travels right-to-left from the enemy in the arena.
   scanLine(ctx,startX,startY,x,y,(reducedMotion?.65:1)*(.72+.28*p.beam),7);
   ctx.save();ctx.globalAlpha=.8;ctx.fillStyle='#ffe3d0';
   ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.restore();
   if(eliteSkill&&!reducedMotion){
     scanLine(ctx,startX,startY-11,x,y-13,.43,3);
     scanLine(ctx,startX,startY+11,x,y+13,.43,3);
   }
 }
 if(p.impact>0){
   const a=p.impact;
   ctx.save();ctx.globalAlpha=a*(reducedMotion?.55:1);
   ctx.strokeStyle='#f9d9a6';ctx.lineWidth=5;ctx.shadowColor='#ff233e';ctx.shadowBlur=22;
   ctx.beginPath();ctx.arc(endX,endY,10+(1-a)*36,0,Math.PI*2);ctx.stroke();
   for(let j=0;j<8;j++){const th=j*Math.PI/4;
      const dist=18+(1-a)*27;
      spark(ctx,endX+Math.cos(th)*dist,endY+Math.sin(th)*dist,8+j%3*2,a);
   }ctx.restore();
 }
}
