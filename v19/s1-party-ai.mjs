/**
 * Salary Hero V5.9 — tactical targeting and support policies.
 * Pure logic; fully testable without DOM. HP stats in the current V5 battle
 * are normalized to a 100-HP reference, NOT the final RPG stat scale.
 */
export const ALLY_ROLES=Object.freeze([
 {id:"guard",name:"打卡守衛",tier:"SR",role:"guardian",attack:90,defense:155,maxHp:150,attackInterval:1.15,targeting:"frontline",skill:"intercept"},
 {id:"fighter",name:"逃班鬥士",tier:"R",role:"fighter",attack:128,defense:100,maxHp:118,attackInterval:.95,targeting:"nearest",skill:"rage"},
 {id:"assassin",name:"截止日刺客",tier:"SSR",role:"assassin",attack:173,defense:75,maxHp:88,attackInterval:1.10,targeting:"backline",skill:"execute"},
 {id:"medic",name:"咖啡醫官",tier:"SR",role:"healer",attack:83,defense:98,maxHp:106,attackInterval:1.20,targeting:"self-defense",skill:"triage"},
 {id:"mage",name:"試算表法師",tier:"SR",role:"mage",attack:148,defense:74,maxHp:92,attackInterval:1.25,targeting:"cluster",skill:"area"},
 {id:"engineer",name:"機械工程師",tier:"SR",role:"protector",attack:102,defense:126,maxHp:116,attackInterval:1.30,targeting:"shield-breaking",skill:"team-shield"},
 {id:"salary",name:"薪奴",tier:"PLAYER",role:"commander",attack:128,defense:116,maxHp:125,attackInterval:1.05,targeting:"adaptive",skill:"wave-rescue"}
]);
export const SUPPORT_RULES=Object.freeze({
 healer:{healPercentOfTargetMaxHp:.095,triggerBelow:.78,cooldownMs:7600},
 protector:{shieldPercentOfTargetMaxHp:.065,durationMs:8000,cooldownMs:13800,triggerLowHp:.8},
 waveRescue:{shieldPercentOfTargetMaxHp:.1,durationMs:12000},
 personalShieldCap:.25,
});
const enemyTypes=Object.freeze({
 "paper-gremlin":"melee","deadline-clock":"controller","coffee-mimic":"support",
 "keyboard-piranha":"ranged","meeting-ghost":"controller",
 "red-stamp-manager":"elite","chair-golem":"elite","deadline-overlord":"boss",
});
const roleThreat={ranged:12,controller:25,support:19,elite:16,boss:30,melee:0};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const distance=(a,b)=>Math.hypot((a.x??0)-(b.x??0),(a.y??0)-(b.y??0));
export function pickTarget(index,enemies,{heroPosition={x:50,y:50},reservations={}}={}){
 const hero=ALLY_ROLES[index];
 if(!hero)throw new RangeError("Invalid ally index");
 const alive=enemies.filter(e=>e&&e.alive!==false&&(e.hp??0)>0);
 if(!alive.length)return null;
 const positionOf=e=>({x:e.x??50,y:e.y??40});
 const maxDistance=Math.max(1,...alive.map(e=>distance(heroPosition,positionOf(e))));
 const cluster=e=>alive.filter(other=>other!==e&&distance(positionOf(e),positionOf(other))<30).length;
 const scored=alive.map((e,idx)=>{
  const type=enemyTypes[e.species]|| (e.elite?"elite":"melee");
  const hpRatio=clamp(e.hp/(e.maxHp||100),0,1);
  const proximity=1-distance(heroPosition,positionOf(e))/maxDistance;
  const reserve=Number(reservations[e.id]||0);
  let score=(roleThreat[type]||0)*.15;
  if(hero.role==="guardian")score+=proximity*38+(type==="melee"?14:0)+(type==="elite"?9:0);
  if(hero.role==="fighter")score+=proximity*25+(1-hpRatio)*22;
  if(hero.role==="assassin")score+=(type==="controller"||type==="support"||type==="ranged"?38:0)+(1-hpRatio)*35-(type==="elite"?12:0);
  if(hero.role==="healer")score+=proximity*22+(1-hpRatio)*7;
  if(hero.role==="mage")score+=cluster(e)*33+(type==="controller"?15:0)+(1-hpRatio)*5;
  if(hero.role==="protector")score+=(type==="controller"?22:0)+(type==="elite"?13:0)+proximity*13;
  if(hero.role==="commander")score+=proximity*16+(1-hpRatio)*18+(type==="support"?9:0);
  // Committed projectiles already in flight occupy target capacity.
  // Penalize concentration; use different bias for assassin finishers.
  score-=reserve*(hero.role==="assassin"?7:24);
  return {enemy:e,score,idx};
 });
 scored.sort((a,b)=>b.score-a.score||a.idx-b.idx);
 return scored[0].enemy;
}
export function pickCriticalAlly(health,maxHp=health.map(()=>100),shields=health.map(()=>0)){
 let best=-1,lowest=Infinity;
 for(let i=0;i<health.length;i++){
  if(health[i]<=0)continue;
  const effective=(health[i]+(shields[i]||0))/(maxHp[i]||100);
  if(effective<lowest){best=i;lowest=effective}
 }
 return best;
}
export function healForTarget(targetMaxHp,ratio=SUPPORT_RULES.healer.healPercentOfTargetMaxHp){
 return Math.max(0,Math.round(targetMaxHp*ratio*100)/100);
}
export function shieldForTarget(targetMaxHp,ratio=SUPPORT_RULES.protector.shieldPercentOfTargetMaxHp){
 return Math.max(0,Math.round(targetMaxHp*ratio*100)/100);
}
export function capShield(existing,additional,maxHp){
 return Math.min(maxHp*SUPPORT_RULES.personalShieldCap,Math.max(0,existing)+Math.max(0,additional));
}
export function absorbHit(health,shield,incoming){
 const consumed=Math.min(Math.max(0,shield),Math.max(0,incoming));
 return {health:Math.max(0,health-Math.max(0,incoming-consumed)),shield:Math.max(0,shield-consumed),absorbed:consumed};
}
