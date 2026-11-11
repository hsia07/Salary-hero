/* In-combat decisions, beyond passive percentages:
 * Clock-out stores 0–3 work-stamp marks from criticals & combo finishers.
 * Burst skill spends 2–3 PRE-EXISTING marks for a large extra strike.
 * Coffee accumulates 0–5 toxin stacks; Drain skill can extract them,
 * convert them into damage/healing and interrupt normal monsters.
 * Bosses resist interruption until >=4 stacks.
 * Pure helper: engine applies it ONCE per valid action and clears on enemy change.
 */
const clamp=(v,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(v))?Math.floor(Number(v)):0));
export function liteTacticalHit(s,{skill=null,crit=false,buildProc=false,damage=0,enemyTier='normal'}={}){
 const base=Math.max(1,clamp(damage,100000000));
 if(s?.liteActiveBuild==='clockout'){
   const old=clamp(s.liteMarks,3);
   const spent=skill==='burst'&&old>=2?old:0;
   const gained=(crit?1:0)+(buildProc?1:0);
   const marks=Math.min(3,old-spent+gained);
   const extra=spent?Math.max(5,Math.round(base*(spent===3?.90:.65))):0;
   return {id:'clockout',marks,stacks:0,extra,heal:0,spent,extracted:0,skipRetaliation:false};
 }
 if(s?.liteActiveBuild==='coffee'){
   const old=clamp(s.liteToxinStacks,5);
   const extracted=skill==='drain'&&old>=2?old:0;
   const extra=extracted?Math.max(3,Math.round((5+clamp(s.level,500)*.25)*extracted)):0;
   const heal=extracted?Math.round(extracted*(3+Math.min(3,clamp(s.level,500)/40))):0;
   const skipRetaliation=extracted>=2&&(enemyTier!=='boss'||extracted>=4);
   // Consumption after hitting starts the next stack at one.
   const maxStacks=(s?.liteBuildProgress?.coffee||0)>=18?5:3;
   const stacks=extracted?1:Math.min(maxStacks,old+1);
   return {id:'coffee',marks:0,stacks,extra,heal,spent:0,extracted,skipRetaliation};
 }
 return {id:'none',marks:0,stacks:0,extra:0,heal:0,spent:0,extracted:0,skipRetaliation:false};
}
export function liteTacticalHint(s){
 if(s?.liteActiveBuild==='clockout'){
   const count=clamp(s.liteMarks,3);
   return {id:'clockout',label:'⚡ 打卡印記 '+count+'/3'+(count>=2?' · 爆肝連擊可收工爆發':' · 暴擊或連擊能獲得印記'),count,max:3};
 }
 if(s?.liteActiveBuild==='coffee'){
   const max=(s?.liteBuildProgress?.coffee||0)>=18?5:3;
   const count=clamp(s.liteToxinStacks,max);
   return {id:'coffee',label:'☕ 黑咖啡毒素 '+count+'/'+max+(count>=2?' · 咖啡續命可萃取':' · 連續擊中累積毒素'),count,max};
 }
 return {id:'none',label:'🏵️ 選擇流派，解鎖戰術連攜',count:0,max:0};
}
