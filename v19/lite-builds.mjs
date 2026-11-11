/* Salary Hero Lite V20 — two deeply distinct starter build tracks.
 * No purchases, no mandatory irreversible class decisions. Training mode never gains mastery.
 */
export const LITE_BUILD_TIERS=Object.freeze([0,5,18,48]);
export const LITE_BUILDS=Object.freeze([
 Object.freeze({
   id:'clockout',name:'打卡暴擊',title:'準點處刑者',icon:'⚡',accent:'#f9ca74',
   description:'暴擊與連擊取得打卡印記（上限 3），爆肝連擊消耗 2～3 印記打出超時結算；每四次攻擊另有專屬追擊。',
   options:Object.freeze([
     Object.freeze({id:'rush',name:'連環打卡',text:'每 3 次攻擊觸發小幅連擊追擊，適合速刷。'}),
     Object.freeze({id:'execute',name:'主管處刑',text:'每 4 次攻擊觸發更強的追擊，對魔王再增傷。'})
   ]),
   milestones:Object.freeze([
    '入門：暴擊率提升，連擊觸發專屬追擊',
    '專精 I：解鎖連環打卡／主管處刑二選一',
    '專精 II：追擊後縮短爆肝連擊技能冷卻',
    '專精 III：追擊基礎傷害進一步提升'
   ])
 }),
 Object.freeze({
   id:'coffee',name:'咖啡續命',title:'深夜煉金師',icon:'☕',accent:'#9ee4bf',
   description:'每次攻擊疊加毒素，每第三次攻擊回血；累積 2 層後使用咖啡技能，可萃取毒素打出額外傷害並讓普通敵人脫力。',
   options:Object.freeze([
     Object.freeze({id:'heal',name:'續杯本能',text:'每第三次攻擊回復更多生命，專打持久戰。'}),
     Object.freeze({id:'venom',name:'黑咖啡腐蝕',text:'放大毒素傷害，換取更快的擊殺速度。'})
   ]),
   milestones:Object.freeze([
    '入門：吸血增加，毒素疊層，每第三次攻擊回復生命',
    '專精 I：解鎖續杯本能／黑咖啡腐蝕二選一',
    '專精 II：毒素上限提升，增加續航',
    '專精 III：毒素傷害與回復量進一步強化'
   ])
 })
]);
export const LITE_BUILD_CHOICES=Object.freeze({clockout:'rush',coffee:'heal'});
const int=(v,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(v))?Math.floor(Number(v)):0));
export function liteBuildById(id){return LITE_BUILDS.find(b=>b.id===id)||null;}
export function liteMasteryRank(xp){
 const total=int(xp,10000000);
 return LITE_BUILD_TIERS.reduce((rank,req,i)=>total>=req?i:rank,0);
}
export function liteBuildProgress(raw){
 return Object.fromEntries(LITE_BUILDS.map(b=>[b.id,int(raw?.[b.id],10000000)]));
}
export function liteBuildBranch(raw){
 return Object.fromEntries(LITE_BUILDS.map(b=>{
   const valid=b.options.some(x=>x.id===raw?.[b.id]);
   return [b.id,valid?raw[b.id]:LITE_BUILD_CHOICES[b.id]];
 }));
}
export function liteBuildStats(state){
 const build=liteBuildById(state?.liteActiveBuild);
 if(!build)return {id:'none',rank:0,crit:0,lifeSteal:0,branch:null};
 const rank=liteMasteryRank(state.liteBuildProgress?.[build.id]);
 const branch=(state.liteBuildBranch||{})[build.id]||LITE_BUILD_CHOICES[build.id];
 return {id:build.id,rank,branch,
   crit:build.id==='clockout'?.055+.014*rank:0,
   lifeSteal:build.id==='coffee'?.045+.012*rank:0};
}
/** Pure hit modifiers. Caller provides the previous target's poison stack count.
 * Poison only affects enemies during this hit, not while the game is closed.
 */
export function liteBuildHit(state,baseDamage,enemy,combo){
 const tuned=liteBuildStats(state);
 const hpBase=Math.max(1,Number(baseDamage)||1),n=int(combo,10000000);
 if(tuned.id==='clockout'){
   const faster=tuned.rank>=1&&tuned.branch==='rush';
   const every=faster?3:4;
   const proc=n>0&&n%every===0;
   if(!proc)return {extra:0,heal:0,poison:0,stacks:0,proc:false,cooldownReduction:0};
   const multiplier=(faster?.30:.49)+.08*tuned.rank;
   const bossBonus=!faster&&tuned.rank>=1&&enemy?.tier==='boss'?1.35:1;
   const extra=Math.max(2,Math.ceil(hpBase*multiplier*bossBonus));
   return {extra,heal:0,poison:0,stacks:0,proc:true,cooldownReduction:tuned.rank>=2?1:0};
 }
 if(tuned.id==='coffee'){
   const maxStacks=tuned.rank>=2?5:3;
   const stacks=Math.min(maxStacks,int(state?.liteToxinStacks,5)+1);
   const toxicMultiplier=tuned.rank>=1&&tuned.branch==='venom'?1.65:1;
   const poison=Math.max(1,Math.round((3+Math.min(500,Number(state?.level)||1))*.20*stacks*toxicMultiplier*(1+.08*tuned.rank)));
   const heal=n>0&&n%3===0?8+3*tuned.rank+(tuned.rank>=1&&tuned.branch==='heal'?10:0):0;
   return {extra:poison,heal,poison,stacks,proc:heal>0,cooldownReduction:0};
 }
 return {extra:0,heal:0,poison:0,stacks:0,proc:false,cooldownReduction:0};
}
/** Mutates only the caller-owned transition copy, never a source save or practice stage. */
export function liteGrantMastery(s,tier='normal'){
 const id=liteBuildById(s?.liteActiveBuild)?.id;
 if(!id||s.trainingIsolated)return null;
 const xp=tier==='boss'?3:tier==='elite'?2:1;
 const previous=liteMasteryRank(s.liteBuildProgress[id]);
 s.liteBuildProgress[id]=Math.min(10000000,s.liteBuildProgress[id]+xp);
 const rank=liteMasteryRank(s.liteBuildProgress[id]);
 return {id,xp,rank,rankUp:rank>previous};
}
