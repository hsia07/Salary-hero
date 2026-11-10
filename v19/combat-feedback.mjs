/** Synchronize HP bar presentation with illustrated contact.
 * Game mechanics and saved HP remain authoritative and are NEVER delayed.
 * A precomputed attack already changes the state; this hides premature visual
 * damage until the hero's blade / monster's projectile ACTUALLY connects.
 */
export const HERO_CONTACT_MS=405;
export function visibleCombatHealthAt(state,fx,elapsedMs,{
 heroContactMs=HERO_CONTACT_MS,retaliationContactMs=755
}={}){
 const heroActual=Math.max(0,Number(state?.heroHp)||0);
 const enemyActual=Math.max(0,Number(state?.enemy?.hp)||0);
 const maxHero=Math.max(1,Number(state?.maxHp)||1);
 const maxEnemy=Math.max(1,Number(state?.enemy?.maxHp)||1);
 const t=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):Infinity;
 if(fx?.result?.type!=='hit'){
   return {heroHp:heroActual,enemyHp:enemyActual,maxHero,maxEnemy};
 }
 let visibleEnemy=enemyActual,visibleHero=heroActual;
 // Only the same living enemy can be used as pre-contact presentation.
 if(t<heroContactMs&&fx.oldEnemy?.id===state.enemy?.id){
   visibleEnemy=Math.max(0,Number(fx.oldEnemy.hp)||0);
 }
 if(fx.retaliation&&t<retaliationContactMs&&Number.isFinite(fx.oldHeroHp)){
   visibleHero=Math.max(0,fx.oldHeroHp);
 }
 return {heroHp:visibleHero,enemyHp:visibleEnemy,maxHero,maxEnemy};
}