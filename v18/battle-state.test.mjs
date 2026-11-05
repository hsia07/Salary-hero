import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleState} from './battle-state.mjs';

test('auto OFF blocks ticks and leaves HP and rewards unchanged',()=>{
 const b=new BattleState({random:()=>0}); b.setAuto(false);
 const before=structuredClone(b.state);
 assert.equal(b.tick(),false);assert.deepEqual(b.state,before);
});
test('manual tick does not secretly re-enable auto',()=>{
 const b=new BattleState({random:()=>0});b.setAuto(false);
 assert.equal(b.tick({manual:true}),true);assert.equal(b.state.enabled,false);
 assert.equal(b.state.enemy.hp,50);
});
test('equipment changes real damage and selected gear',()=>{
 const b=new BattleState({random:()=>0});b.equip('gold');
 assert.equal(b.state.hero.attack,26);assert.equal(b.state.hero.equipment,'gold');
 b.tick();assert.equal(b.state.enemy.hp,36);
});
test('defeated enemies are replaced and rewards only granted once',()=>{
 const b=new BattleState({random:()=>0});b.equip('gold');
 b.tick();b.tick();b.tick();
 assert.equal(b.state.kills,1);assert.equal(b.state.gold,13);
 assert.equal(b.state.wave,2);assert.equal(b.state.enemy.id,'enemy-2');
 assert.equal(b.state.enemy.hp,b.state.enemy.maxHp);
});
test('invalid equipment cannot change state',()=>{
 const b=new BattleState();const before=structuredClone(b.state);
 assert.throws(()=>b.equip('unknown'),/Unknown equipment/);
 assert.deepEqual(b.state,before);
});
test('speed is limited to 1 or 2',()=>{
 const b=new BattleState();b.setSpeed(999);assert.equal(b.state.speed,1);
 b.setSpeed(2);assert.equal(b.state.speed,2);
});
test('hero recovers when health reaches zero',()=>{
 const b=new BattleState({random:()=>0});
 for(let i=0;i<40;i++)b.tick();
 assert.ok(b.state.hero.hp>0&&b.state.hero.hp<=b.state.hero.maxHp);
});
