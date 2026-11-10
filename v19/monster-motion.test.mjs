import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_ENEMIES,COMMON_ENEMIES,ELITE_ENEMIES,BOSSES} from './roster.mjs';
import {enemyFor,initial,normalize,transition} from './engine.mjs';
import {MONSTER_ANIMATIONS,MONSTER_STATES,monsterVisualFor,monsterAnimationState,drawMonsterActor,drawMonsterVfx,validateMonsterRoster} from './monster-motion.mjs';

test('every enemy has a unique name, an actual actor, and a unique attack direction',()=>{
 assert.equal(ALL_ENEMIES.length,32);
 assert.equal(COMMON_ENEMIES.length,16);
 assert.equal(ELITE_ENEMIES.length,8);
 assert.equal(BOSSES.length,8);
 assert.equal(validateMonsterRoster(ALL_ENEMIES),true);
 assert.equal(Object.keys(MONSTER_ANIMATIONS).length,32);
 assert.equal(new Set(ALL_ENEMIES.map(e=>e.name)).size,32);
 assert.equal(new Set(Object.values(MONSTER_ANIMATIONS).map(m=>m.attack)).size,32);
 assert.equal(new Set(ALL_ENEMIES.map(e=>e.faction)).size,8);
 for(const e of ALL_ENEMIES){
  const m=monsterVisualFor(e.id);
  assert.equal(monsterVisualFor(e).id,e.id,'gallery lookup via roster object fails');
  for(const property of ['anatomy','attack','hurt','defeat','element'])
   assert.ok(m[property]&&typeof m[property]==='string',e.id+' missing '+property);
 }
});
test('each enemy is associated with its correct art and rank after repeated save loads',()=>{
 for(let i=1;i<=128;i++){
  const enemy=enemyFor(i);
  const e=ALL_ENEMIES.find(x=>x.id===enemy.typeId);
  assert.ok(e);
  assert.equal(enemy.faction,e.faction);
  assert.equal(monsterVisualFor(enemy).id,enemy.typeId);
  const state=initial();state.wave=i;state.enemy=enemy;
  const reloaded=normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(reloaded.enemy.typeId,enemy.typeId);
  assert.equal(reloaded.enemy.faction,enemy.faction);
 }
});
test('each individual monster visual runs all real animation states in a canvas-like context',()=>{
 for(const e of ALL_ENEMIES){
  let ops=0,depth=0;
  const record=()=>{ops++};
  const ctx=new Proxy({globalAlpha:1},{
   get(target,prop){
    if(prop in target)return target[prop];
    if(prop==='save')return ()=>{depth++;record()};
    if(prop==='restore')return ()=>{depth--;assert.ok(depth>=0);record()};
    return record;
   },
   set(target,prop,value){target[prop]=value;return true;}
  });
  const enemy={...e,tier:ELITE_ENEMIES.includes(e)?'elite':BOSSES.includes(e)?'boss':'normal',boss:BOSSES.includes(e),typeId:e.id};
  for(const state of MONSTER_STATES){
   drawMonsterActor(ctx,enemy,9000,{state,progress:.5});
   if(state!=='idle')drawMonsterVfx(ctx,enemy,state,.55,
     {enemyX:455,enemyY:248,heroX:180,heroY:330,now:9000});
  }
  assert.equal(depth,0,'unbalanced canvas save/restore for '+e.id);
  assert.ok(ops>20,'no visible draw operations for '+e.id);
 }
});
test('enemy visual injury, death and retaliation do not occur before combat contact',()=>{
 const enemy=enemyFor(3);
 assert.equal(monsterAnimationState(enemy,300,{type:'hit',retaliationDamage:12}).state,'idle');
 assert.equal(monsterAnimationState(enemy,500,{type:'hit',retaliationDamage:12}).state,'hurt');
 assert.equal(monsterAnimationState(enemy,950,{type:'hit',retaliationDamage:12}).state,'attack');
 assert.equal(monsterAnimationState(enemy,950,{type:'hit',retaliationDamage:12,enemySkill:'菁英反制'}).state,'special');
 assert.equal(monsterAnimationState(enemy,950,{type:'hit',retaliationDamage:0}).state,'idle');
 assert.equal(monsterAnimationState(enemy,500,{type:'victory'}).state,'defeat');
 assert.equal(monsterAnimationState(enemy,300,{type:'victory'}).state,'idle');
 assert.equal(monsterAnimationState(enemy,950,{type:'victory'}).state,'defeat');
 assert.equal(monsterAnimationState(enemy,950,{type:'victory'}).progress,1);
 assert.equal(monsterAnimationState(enemy,1100,{type:'victory'}).state,'idle');
});
test('boss and elite attack damage still comes from engine and never from visual effects',()=>{
 const s=initial();s.wave=3;s.enemy=enemyFor(3);
 const n=transition(s,'attack',()=>.99);
 assert.equal(n.enemy.hp<s.enemy.hp,true);
 assert.equal(n.wave,3);
 assert.equal(s.enemy.turns,0);
 assert.equal(n.enemy.turns,1);
});
