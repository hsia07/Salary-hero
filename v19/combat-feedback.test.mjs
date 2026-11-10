import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleCombatHealthAt,HERO_CONTACT_MS} from './combat-feedback.mjs';
import {PAPER_PROJECTILE_IMPACT_MS} from './paper-combat.mjs';
import {COFFEE_SPRAY_IMPACT_MS} from './coffee-combat.mjs';
const original={enemy:{id:2,hp:126,maxHp:126},heroHp:900,maxHp:900};
const after={enemy:{id:2,hp:108,maxHp:126},heroHp:897,maxHp:900};
const fx={result:{type:'hit',retaliationDamage:3},oldEnemy:original.enemy,oldHeroHp:900,retaliation:true};
test('damage is shown only after actual weapon contact, not when engine precomputes attack',()=>{
 assert.deepEqual(visibleCombatHealthAt(after,fx,HERO_CONTACT_MS-1,{retaliationContactMs:COFFEE_SPRAY_IMPACT_MS}),
   {heroHp:900,enemyHp:126,maxHero:900,maxEnemy:126});
 assert.deepEqual(visibleCombatHealthAt(after,fx,HERO_CONTACT_MS,{retaliationContactMs:COFFEE_SPRAY_IMPACT_MS}),
   {heroHp:900,enemyHp:108,maxHero:900,maxEnemy:126});
});
test('coffee and paper retaliation cannot visually deduct HP until actual projectile arrival',()=>{
 assert.equal(COFFEE_SPRAY_IMPACT_MS,PAPER_PROJECTILE_IMPACT_MS);
 for(const impact of [COFFEE_SPRAY_IMPACT_MS,PAPER_PROJECTILE_IMPACT_MS]){
  assert.equal(visibleCombatHealthAt(after,fx,impact-1,{retaliationContactMs:impact}).heroHp,900);
  assert.equal(visibleCombatHealthAt(after,fx,impact,{retaliationContactMs:impact}).heroHp,897);
 }
});
test('victory, healing and static state never fake historical HP',()=>{
 const none=visibleCombatHealthAt(after,null,100);
 assert.equal(none.heroHp,897);assert.equal(none.enemyHp,108);
 assert.equal(visibleCombatHealthAt(after,{...fx,result:{type:'victory'}},10).heroHp,897);
 assert.equal(visibleCombatHealthAt(after,{...fx,retaliation:false},10).heroHp,897);
});
test('visual staging cannot mutate actual save or engine state',()=>{
 const a=structuredClone(after),b=structuredClone(fx);
 visibleCombatHealthAt(after,fx,25,{retaliationContactMs:COFFEE_SPRAY_IMPACT_MS});
 assert.deepEqual(after,a);assert.deepEqual(fx,b);
});
