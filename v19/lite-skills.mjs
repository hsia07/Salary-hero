/* Salary Hero Lite skill choices: unlocked by use, not books, payments or forced dailies.
 * Pure modifiers; the engine applies them only on a VALID cast of the skill.
 */
export const LITE_SKILL_UNLOCK_USES=6;
export const LITE_SKILL_PATHS=Object.freeze([
 Object.freeze({id:'burst',name:'⚡ 爆肝連擊',choices:Object.freeze([
  Object.freeze({id:'heavy',name:'最後通牒',description:'強化本次爆發傷害 30%，但冷卻增加 1 回合。'}),
  Object.freeze({id:'quick',name:'摸魚快攻',description:'本次技能額外 +12% 暴擊率、冷卻減少 1 回合。'})
 ])}),
 Object.freeze({id:'guard',name:'🛡️ 摸魚防護',choices:Object.freeze([
  Object.freeze({id:'safe',name:'帶薪喘息',description:'本次反擊再減傷 25%，並在受擊後恢復 8 生命。'}),
  Object.freeze({id:'counter',name:'公事包反擊',description:'反彈實際所受傷害的 35% 給敵人（不會直接擊殺）。'})
 ])}),
 Object.freeze({id:'drain',name:'☕ 咖啡續命',choices:Object.freeze([
  Object.freeze({id:'brew',name:'無限續杯',description:'咖啡回血額外 +22。'}),
  Object.freeze({id:'bitter',name:'苦澀濃縮',description:'本次傷害 +25%、咖啡回血減少 12。'})
 ])})
]);
export function liteSkillById(id){return LITE_SKILL_PATHS.find(v=>v.id===id)||null;}
const clamp=(v,max)=>Math.min(max,Math.max(0,Number.isFinite(Number(v))?Math.floor(Number(v)):0));
export function liteSkillUses(raw){
 return Object.fromEntries(LITE_SKILL_PATHS.map(x=>[x.id,clamp(raw?.[x.id],1000000)]));
}
export function liteSkillPaths(raw){
 return Object.fromEntries(LITE_SKILL_PATHS.map(x=>[x.id,
    x.choices.some(v=>v.id===raw?.[x.id])?raw[x.id]:null]));
}
export function liteSkillSelection(state,id){
 const spec=liteSkillById(id),uses=state?.liteSkillUses?.[id]||0;
 if(!spec||uses<LITE_SKILL_UNLOCK_USES)return null;
 return spec.choices.find(v=>v.id===state?.liteSkillPaths?.[id])?.id||null;
}
export function liteSkillCastBonus(state,id){
 const choice=liteSkillSelection(state,id);
 return {
  choice,crit:choice==='quick'?.12:0,
  damageMultiplier:choice==='heavy'?1.3:choice==='bitter'?1.25:1,
  cooldownOffset:choice==='heavy'?1:choice==='quick'?-1:0,
  guardReduction:choice==='safe'?.25:0,
  guardHeal:choice==='safe'?8:0,
  reflectMultiplier:choice==='counter'?.35:0,
  drainHeal:choice==='brew'?22:choice==='bitter'?-12:0
 };
}
/** Called after a legal cast; never in the no-cost trial battle. */
export function liteSkillGrantUse(state,id){
 if(!liteSkillById(id)||state?.trainingIsolated)return null;
 const before=state.liteSkillUses[id]||0;
 state.liteSkillUses[id]=Math.min(1000000,before+1);
 return {id,uses:state.liteSkillUses[id],unlocked:before<LITE_SKILL_UNLOCK_USES&&state.liteSkillUses[id]>=LITE_SKILL_UNLOCK_USES};
}
