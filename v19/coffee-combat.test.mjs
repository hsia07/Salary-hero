import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ALL_ENEMIES} from './roster.mjs';
import {validateMonsterAtlasRecord} from './sprite-atlas.mjs';
import {coffeeCombatPoseAt,coffeeSplashAt,COFFEE_HERO_HIT_MS,COFFEE_ATTACK_START_MS,COFFEE_SPRAY_LAUNCH_MS,COFFEE_SPRAY_IMPACT_MS,COFFEE_ATTACK_END_MS,COFFEE_ATTACK_POSE_MS} from './coffee-combat.mjs';
const expected={
 idle:{frames:4,digest:'9ec288d5312eb283c01a7b732f4fbd9dfc9229b6ae2991b6b28191a6fdfbe586'},
 attack:{frames:5,digest:'833357ab86895c7290188898b3d10e6e91da7580106b1db44a7f46534be87f37'},
 hurt:{frames:3,digest:'022efa49867a77413e7224bde156ea377c33a37b25fd03c903c49389ad7b9a9e'},
 defeat:{frames:4,digest:'8d3ed698ae91c7bd54ef8aefbd18516dfc28035737200ed5ee1929eff40bea9f'}
};
test('evil cup has four actual committed, verified WebP images (not cute placeholders)',()=>{
 for(const [state,{digest}] of Object.entries(expected)){
  const data=readFileSync(new URL('../art/v19/runtime/monsters/coffee-mimic/'+state+'.webp',import.meta.url));
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(data).digest('hex'),digest);
 }
});
test('evil cup is registered as the real second art species with four frame states',()=>{
 const m=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
 assert.equal(ALL_ENEMIES.find(e=>e.id==='coffee-mimic')?.name,'茶水間實習杯靈');
 assert.equal(Object.keys(m.monsters).length,6);
 const record=m.monsters['coffee-mimic'];assert.deepEqual(validateMonsterAtlasRecord(record,'normal'),[]);
 for(const [state,{frames}] of Object.entries(expected)){
  assert.equal(record.states[state].frames,frames);
  assert.equal(record.states[state].cell,320);
  assert.equal(record.states[state].ground_y,289);
  assert.ok(record.states[state].src.endsWith('/runtime/monsters/coffee-mimic/'+state+'.webp'));
 }
});
test('coffee mimic attacks with five different poses and shatters on defeat',()=>{
 assert.equal(COFFEE_ATTACK_POSE_MS.length,5);
 assert.equal(COFFEE_ATTACK_POSE_MS.reduce((a,b)=>a+b,0),640);
 const hit={type:'hit',retaliationDamage:5};
 assert.equal(coffeeCombatPoseAt(404,hit).state,'idle');
 assert.equal(coffeeCombatPoseAt(405,hit).state,'hurt');
 assert.equal(coffeeCombatPoseAt(730,hit).state,'hurt');
 assert.equal(coffeeCombatPoseAt(COFFEE_ATTACK_START_MS,hit).state,'attack');
 assert.equal(coffeeCombatPoseAt(1205,hit).state,'attack');
 assert.equal(coffeeCombatPoseAt(COFFEE_ATTACK_END_MS,hit).state,'idle');
 assert.equal(coffeeCombatPoseAt(990,{type:'hit',retaliationDamage:0}).state,'idle');
 assert.equal(coffeeCombatPoseAt(405,{type:'victory'}).state,'defeat');
 assert.equal(coffeeCombatPoseAt(1099,{type:'victory'}).state,'defeat');
});
test('coffee flyout reaches hero on time and never shoots during death',()=>{
 assert.ok(COFFEE_SPRAY_LAUNCH_MS>COFFEE_ATTACK_START_MS);
 assert.ok(COFFEE_SPRAY_IMPACT_MS>COFFEE_SPRAY_LAUNCH_MS);
 assert.equal(coffeeSplashAt(COFFEE_SPRAY_LAUNCH_MS-1).spray,false);
 const flying=coffeeSplashAt(COFFEE_SPRAY_LAUNCH_MS+45);
 assert.equal(flying.spray,true);
 assert.ok(flying.flight>0&&flying.flight<1);
 assert.equal(coffeeSplashAt(COFFEE_SPRAY_IMPACT_MS).impact,1);
 assert.equal(coffeeSplashAt(COFFEE_SPRAY_IMPACT_MS,false).active,false);
 assert.equal(coffeeSplashAt(COFFEE_ATTACK_END_MS).active,false);
 assert.equal(COFFEE_HERO_HIT_MS,405);
});