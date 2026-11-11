/* Meaningful unique Legendary effects. They activate ONLY when that instance
 * is genuinely equipped and of legendary rarity; cosmetic skins do not grant stats.
 * Every description below has matching battle logic in engine.mjs.
 */
export const LITE_LEGENDARIES=Object.freeze([
 Object.freeze({templateId:'w-clockblade',name:'五點鐘響',description:'打卡流派追擊和兩件套收工斬傷害 +45%。'}),
 Object.freeze({templateId:'r-ticket',name:'末班車狂奔',description:'打卡流派追擊傷害 +25%。'}),
 Object.freeze({templateId:'w-cupstaff',name:'永夜濃縮',description:'咖啡流派毒素傷害 +50%。'}),
 Object.freeze({templateId:'r-bean',name:'咖啡因永動機',description:'咖啡流派每次續杯時額外回復 12 生命。'}),
 Object.freeze({templateId:'a-heavy',name:'不倒保全',description:'受到的傷害額外減少 8%。'}),
 Object.freeze({templateId:'b-security',name:'工牌防火牆',description:'每次實際承受反擊後回復 6 生命。'}),
 Object.freeze({templateId:'b-galaxy',name:'總部特權',description:'所有流派的暴擊機率 +5%。'}),
 Object.freeze({templateId:'w-resign',name:'辭職決意',description:'所有流派的基礎攻擊傷害 +15%。'})
]);
export function liteLegendaryByTemplate(id){return LITE_LEGENDARIES.find(e=>e.templateId===id)||null;}
export function liteLegendaryEffects(state){
 const out={clockoutMultiplier:1,coffeePoisonMultiplier:1,coffeeBonusHeal:0,
   damageReduction:0,guardRegen:0,crit:0,attackMultiplier:1,active:[]};
 const inventory=state?.liteInventory||[],loadout=state?.liteLoadout||{};
 for(const id of Object.values(loadout)){
   const item=inventory.find(v=>v.instanceId===id);
   if(!item||item.rarity!=='legendary')continue;
   const spec=liteLegendaryByTemplate(item.templateId);
   if(!spec)continue;
   out.active.push(spec.templateId);
   if(spec.templateId==='w-clockblade')out.clockoutMultiplier*=1.45;
   else if(spec.templateId==='r-ticket')out.clockoutMultiplier*=1.25;
   else if(spec.templateId==='w-cupstaff')out.coffeePoisonMultiplier*=1.5;
   else if(spec.templateId==='r-bean')out.coffeeBonusHeal+=12;
   else if(spec.templateId==='a-heavy')out.damageReduction+=.08;
   else if(spec.templateId==='b-security')out.guardRegen+=6;
   else if(spec.templateId==='b-galaxy')out.crit+=.05;
   else if(spec.templateId==='w-resign')out.attackMultiplier*=1.15;
 }
 return out;
}
