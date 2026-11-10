import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,transition,normalize,loopEnemyFor,GAME_MODES,GAME_SKILLS} from './engine.mjs';

test('campaign and tower recycle normal illustrated monsters without bosses or elites',()=>{
 for(const mode of GAME_MODES.filter(m=>m.id!=='dungeon')){
  for(let wave=1;wave<=120;wave++){
   const enemy=loopEnemyFor(wave,mode.id);
   assert.equal(enemy.tier,'normal');assert.equal(enemy.boss,false);assert.equal(enemy.elite,false);
   assert.ok(enemy.hp>0&&enemy.attack>0);
  }
 }
});
test('non-daily modes retain their independent wave progress',()=>{
 let s=initial();
 s=transition(s,{type:'mode',id:'tower'},()=>.9,Date.parse('2026-11-11T08:00:00Z'));
 assert.equal(s.wave,1);
 s.enemy.hp=1;s=transition(s,'attack',()=>.9,Date.parse('2026-11-11T08:00:00Z'));
 assert.equal(s.wave,2);
 s=transition(s,{type:'mode',id:'dungeon'},()=>.9,Date.parse('2026-11-11T08:00:00Z'));
 assert.equal(s.wave,1);
 s=transition(s,{type:'mode',id:'tower'},()=>.9,Date.parse('2026-11-11T08:00:00Z'));
 assert.equal(s.wave,2);
 assert.equal(normalize(JSON.parse(JSON.stringify(s)),Date.parse('2026-11-11T08:00:00Z')).wave,2);
});
test('skill cooldown prevents free repeat casting, and ticks on attacks',()=>{
 let s=initial();
 s=transition(s,{type:'skill',id:'burst'},()=>.9);
 assert.equal(s.skillCooldowns.burst,GAME_SKILLS.find(x=>x.id==='burst').cooldown);
 const before=s.enemy.hp;
 const noCast=transition(s,{type:'skill',id:'burst'},()=>.9);
 assert.equal(noCast.enemy.hp,before);
 s=transition(noCast,'attack',()=>.9);
 assert.equal(s.skillCooldowns.burst,3);
});
test('tower four-wave checkpoint grants chest and restores HP',()=>{
 let s=initial();s=transition(s,{type:'mode',id:'tower'});
 for(let i=0;i<4;i++){s.enemy.hp=1;s=transition(s,'attack',()=>.9);}
 assert.equal(s.wave,5);assert.equal(s.heroHp,s.maxHp);assert.ok(s.chests>=1);
});
test('invalid mode and skill cannot create resources',()=>{
 const s=initial();
 const a=transition(s,{type:'mode',id:'boss'});
 const b=transition(a,{type:'skill',id:'unknown'});
 assert.equal(b.activeMode,'campaign');assert.equal(b.gold,0);
});
