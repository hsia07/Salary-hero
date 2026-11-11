/* Salary Hero Lite — predictable offline earnings and conservative equipment optimization.
 * Pure decisions only. The engine owns persistence, actual payouts and save validation.
 */
import {LITE_SLOTS,liteBase,liteEquipmentStats} from './lite-equipment.mjs';
export const LITE_STRATEGIES=Object.freeze([
 Object.freeze({id:'balanced',name:'智慧平衡',description:'兼顧攻擊、續航與二件套效果'}),
 Object.freeze({id:'survival',name:'高塔保命',description:'優先生命、護甲、吸血與防禦套裝'}),
 Object.freeze({id:'speed',name:'速刷掉寶',description:'優先攻擊、暴擊與收工斬連擊'})
]);
const safe=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
export function liteOfflineEstimate(state,now=Date.now()){
 const saved=safe(state?.liteLastSeenAt,0),current=safe(now,0);
 const delta=current-saved;
 // No prior timestamp, backwards clocks, tiny gaps or a disabled trustee earn nothing.
 if(!state?.auto||!saved||!Number.isSafeInteger(Math.floor(current))||delta<60000)return null;
 const minutes=Math.min(480,Math.floor(delta/60000));
 if(minutes<1)return null;
 const level=Math.max(1,Math.min(500,Math.floor(safe(state.level,1))));
 // Simulated patrol rewards: no full boss wins, no high-tier guaranteed loot,
 // no actual background animation, daily activity claims or dungeon floors.
 const gold=minutes*(2+Math.floor(level/12));
 const xp=Math.floor(minutes*(1+Math.min(5,Math.floor(level/20))));
 const itemCount=Math.min(6,Math.floor(minutes/45));
 return {from:saved,to:current,minutes,gold,xp,itemCount};
}
export function liteBuildScore(state,loadout,strategy='balanced',legacyAttack=12){
 const s=liteEquipmentStats({...state,liteLoadout:loadout});
 const atk=(s.weaponAttack||Math.max(1,Number(legacyAttack)||12))+s.attack;
 const life=s.hp, armor=s.armor,crit=s.crit,dr=s.damageReduction,leech=s.lifeSteal;
 const weights=strategy==='survival'
   ?{atk:.70,life:.5,armor:4,crit:48,dr:180,leech:200,clockout:12,coffee:75,guardian:60}
   :strategy==='speed'
    ?{atk:2,life:.05,armor:.7,crit:190,dr:35,leech:20,clockout:70,coffee:8,guardian:3}
    :{atk:1.3,life:.25,armor:2,crit:110,dr:105,leech:95,clockout:40,coffee:36,guardian:23};
 return atk*weights.atk+life*weights.life+armor*weights.armor+
  crit*weights.crit+dr*weights.dr+leech*weights.leech+
  (s.clockout?weights.clockout:0)+(s.coffee?weights.coffee:0)+(s.guardian?weights.guardian:0);
}
export function liteAutoPlan(state,strategy='balanced',legacyAttack=12){
 const chosen=LITE_STRATEGIES.some(x=>x.id===strategy)?strategy:'balanced';
 const inventory=Array.isArray(state?.liteInventory)?state.liteInventory:[];
 const current={weapon:null,armor:null,badge:null,relic:null,...state?.liteLoadout};
 const lists=LITE_SLOTS.map(slot=>{
   const equipped=inventory.find(it=>it.instanceId===current[slot.id]);
   // Lock is a pin: auto gear cannot remove an equipped locked item.
   if(equipped?.locked)return [equipped.instanceId];
   const candidates=inventory.filter(it=>liteBase(it.templateId)?.slot===slot.id);
   const strength=it=>{
     const b=liteBase(it.templateId);
     const raw=Number(it.itemLevel)||1;
     const rarity={common:1,uncommon:1.12,rare:1.3,epic:1.62,legendary:2}[it.rarity]||1;
     return (b.attack*2+b.hp*.25+b.armor*2+raw*.12)*rarity+
       (it.affixes?.length||0)*4;
   };
   const ranked=candidates.sort((a,b)=>strength(b)-strength(a)).slice(0,6).map(it=>it.instanceId);
   // Keep the currently worn item even if not top-six, and allow empty slots.
   return [...new Set([current[slot.id],...ranked,null])];
 });
 let best=current,bestScore=liteBuildScore(state,current,chosen,legacyAttack);
 const baseline=bestScore;
 for(const weapon of lists[0])
 for(const armor of lists[1])
 for(const badge of lists[2])
 for(const relic of lists[3]){
   const plan={weapon,armor,badge,relic};
   const score=liteBuildScore(state,plan,chosen,legacyAttack);
   if(score>bestScore+1e-7){bestScore=score;best=plan;}
 }
 // Do not churn between near-equivalent builds.
 const changed=LITE_SLOTS.some(slot=>best[slot.id]!==current[slot.id]);
 return {strategy:chosen,changed:changed&&bestScore>baseline+1,score:bestScore,gain:bestScore-baseline,
   loadout:changed&&bestScore>baseline+1?best:current};
}
