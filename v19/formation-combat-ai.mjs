/** Seven-unit fixed-formation combat targeting core.
 * Pure deterministic logic: no DOM, random choices, salary or save mutations.
 * Coordinates are abstract lanes; animations can dash and return to anchors.
 */
export const FORMATION_ANCHORS=Object.freeze([
 {slot:'front-left',row:'front',lane:0},{slot:'front-center',row:'front',lane:1},{slot:'front-right',row:'front',lane:2},
 {slot:'rear-left',row:'rear',lane:0},{slot:'rear-center',row:'rear',lane:1},{slot:'rear-right',row:'rear',lane:2},
 {slot:'hero',row:'hero',lane:1}
]);
const finite=(v,otherwise=0)=>Number.isFinite(Number(v))?Number(v):otherwise;
const alive=u=>u&&finite(u.hp)>0;
const ratio=u=>Math.max(0,Math.min(1,finite(u.hp)/Math.max(1,finite(u.maxHp,1))));
const lane=u=>Math.max(0,Math.min(2,finite(u.lane,1)));
const row=u=>['front','rear','hero'].includes(u.row)?u.row:'front';
const role=u=>u.role||'melee';
const distance=(a,b)=>Math.abs(lane(a)-lane(b))+(row(a)===row(b)?0:1.25);
const idOrder=(a,b)=>String(a.id).localeCompare(String(b.id),'en');
export function chooseAttackTarget(attacker,enemies,{focus={},tauntTargetId=null}={}){
 if(!alive(attacker)||!Array.isArray(enemies))return null;
 const pool=enemies.filter(alive);
 if(!pool.length)return null;
 const taunter=pool.find(x=>x.id===tauntTargetId||x.taunting===true);
 if(taunter&&!attacker.ignoreTaunt)return taunter;
 const scored=pool.map(target=>{
  const dist=distance(attacker,target);
  const rear=row(target)==='rear';
  const missing=1-ratio(target);
  const pressure=Math.max(0,finite(focus[target.id]));
  let score=50-dist*9+Math.min(16,finite(target.threat)*2);
  if(role(attacker)==='assassin')score+=rear?38:0;
  if(role(attacker)==='tank')score+=row(target)==='front'?22:0;
  if(role(attacker)==='caster')score+=Math.min(22,finite(target.nearbyAllies)*7);
  if(role(attacker)==='melee')score+=row(target)==='front'?10:0;
  score+=missing*(role(attacker)==='assassin'?22:10);
  // Saturation penalty encourages spreading attacks unless finishing a weak target.
  score-=pressure*(missing>.8?2:13);
  return {target,score};
 });
 scored.sort((a,b)=>b.score-a.score||idOrder(a.target,b.target));
 return scored[0].target;
}
export function chooseHealTarget(healer,allies,{critical=.35}={}){
 if(!alive(healer)||!Array.isArray(allies))return null;
 const pool=allies.filter(u=>alive(u)&&ratio(u)<1);
 if(!pool.length)return null;
 const scored=pool.map(target=>{
  const missing=1-ratio(target);
  const danger=ratio(target)<=critical?100:0;
  const expected=Math.min(finite(target.maxHp)-finite(target.hp),Math.max(1,finite(healer.healPower,20)));
  return {target,score:danger+missing*70+expected/Math.max(1,finite(target.maxHp))*20-distance(healer,target)*2};
 });
 scored.sort((a,b)=>b.score-a.score||idOrder(a.target,b.target));
 return scored[0].target;
}
export function chooseShieldTarget(caster,allies){
 if(!alive(caster)||!Array.isArray(allies))return null;
 const pool=allies.filter(alive);
 if(!pool.length)return null;
 const scored=pool.map(target=>({target,score:(1-ratio(target))*45+Math.min(30,finite(target.threat)*3)-finite(target.shield)/Math.max(1,finite(target.maxHp))*60+(row(target)==='front'?12:0)}));
 scored.sort((a,b)=>b.score-a.score||idOrder(a.target,b.target));
 return scored[0].target;
}
export function planFormationActions(allies,enemies){
 const focus={},actions=[];
 for(const actor of (Array.isArray(allies)?allies:[]).filter(alive)){
  if(role(actor)==='healer'){
   const target=chooseHealTarget(actor,allies);
   if(target){actions.push({actorId:actor.id,targetId:target.id,type:'heal'});continue;}
  }
  if(role(actor)==='support'&&actor.shieldReady){
   const target=chooseShieldTarget(actor,allies);
   if(target){actions.push({actorId:actor.id,targetId:target.id,type:'shield'});continue;}
  }
  const target=chooseAttackTarget(actor,enemies,{focus});
  if(target){actions.push({actorId:actor.id,targetId:target.id,type:'attack'});focus[target.id]=(focus[target.id]||0)+1;}
 }
 return actions;
}
