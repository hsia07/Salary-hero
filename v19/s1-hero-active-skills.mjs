/**
 * Salary Hero V6.0 — ability rules, pure calculations and target policies.
 * The V5 combat sandbox still normalizes each hero's HP to 100; values
 * here are genuine gameplay rules within that sandbox, not final RPG scaling.
 */
export const ACTIVE_SKILLS=Object.freeze({
 guard:{id:'stamp-guard',name:'打卡護衛',cooldownMs:11800,durationMs:5200,redirectRatio:.30,triggerBelow:.70},
 mage:{id:'spreadsheet-storm',name:'試算表矩陣・散射',cooldownMs:9900,castMs:460,primaryMultiplier:.68,splashMultiplier:.37,maxTargets:3},
 assassin:{id:'backline-audit',name:'背刺稽核',cooldownMs:10700,castMs:510,damageMultiplier:1.48},
 cleanse:{id:'coffee-cleanse',name:'下班醒腦咖啡',cooldownMs:13700,castMs:330,removes:1}
});
export const DEBUFF_PRIORITY=Object.freeze(['stun','paycut','slow']);
export function chooseGuardTarget(health,shields=[],guardIndex=0,maxHp=[]){
 let choice=-1,lowest=Infinity;
 for(let i=0;i<health.length;i++){
  if(i===guardIndex||!Number.isFinite(health[i])||health[i]<=0)continue;
  // Compare effective health fractions, not raw HP. The fourth argument is
  // optional so V6's 100-HP sandbox and existing callers remain compatible.
  const maximum=Number.isFinite(maxHp[i])&&maxHp[i]>0?maxHp[i]:100;
  const shield=Number.isFinite(shields[i])?Math.max(0,shields[i]):0;
  const effective=(health[i]+Math.min(shield,maximum*.1))/maximum;
  if(effective<lowest){choice=i;lowest=effective}
 }
 return choice;
}
export function chooseCleanseTarget(statuses,health){
 let target=-1,best=-1;
 for(let i=0;i<health.length;i++){
  if(health[i]<=0)continue;
  for(const status of statuses[i]||[]){
   const rank=DEBUFF_PRIORITY.indexOf(status);
   if(rank<0)continue;
   const score=(DEBUFF_PRIORITY.length-rank)*100+(100-health[i])*.3;
   if(score>best){best=score;target=i;}
  }
 }
 return target;
}
export function chooseBacklineTarget(enemies){
 const valid=enemies.filter(e=>e.alive!==false&&e.hp>0);
 if(!valid.length)return null;
 const priority={ 'meeting-ghost':50,'keyboard-piranha':47,'coffee-mimic':44,'deadline-clock':30 };
 const candidates=valid.map(e=>{
  const score=(priority[e.species]||0)+(1-e.hp/e.maxHp)*15-(e.elite?10:0);
  return {e,score};
 });
 candidates.sort((a,b)=>b.score-a.score);
 return candidates[0].e;
}
export function chooseAoETargets(selected,enemies,maxTargets=3){
 if(!selected||!enemies?.length)return [];
 const valid=enemies.filter(e=>e.alive!==false&&e.hp>0);
 const others=valid.filter(e=>e.id!==selected.id).map(e=>{
  const dist=Math.hypot((e.x??50)-(selected.x??50),(e.y??50)-(selected.y??50));
  return {e,dist};
 }).sort((a,b)=>a.dist-b.dist).slice(0,Math.max(0,maxTargets-1)).map(x=>x.e);
 return [valid.find(e=>e.id===selected.id),...others].filter(Boolean);
}
export function splitIntercept(incoming,ratio=.30){
 if(!Number.isFinite(incoming)||incoming<=0)return {target:0,guard:0};
 return {target:Math.round(incoming*(1-ratio)*100)/100,guard:Math.round(incoming*ratio*100)/100};
}
export function damageDefenseModifier(defense){
 const safe=Math.max(20,Number(defense)||100);
 return Math.max(.75,Math.min(1.16,200/(100+safe)));
}
export function scaledDamage(base,attack,denom=128){
 return Math.max(1,Math.round(base*attack/denom*10)/10);
}
