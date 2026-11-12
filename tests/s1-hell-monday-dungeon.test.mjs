import test from 'node:test';import assert from 'node:assert/strict';
import {HELL_MONDAY,defineMondayEnemy,spawnMondayWave,clearWaveRecovery,isDungeonComplete} from '../v19/s1-hell-monday-dungeon.mjs';
test('first three waves are real mob/elite encounters; only final wave spawns boss',()=>{
 assert.deepEqual(HELL_MONDAY.waves.map(w=>w.kind),['mob','mixed','elite','boss']);
 for(let i=0;i<3;i++)assert.equal(spawnMondayWave(i).enemies.some(e=>e.species==='deadline-overlord'),false);
 assert.equal(spawnMondayWave(3).enemies[0].species,'deadline-overlord');
});
test('Monday global HP ×1.65, ATK ×1.4 applies once on base stats',()=>{
 const m=defineMondayEnemy(0,0);
 assert.equal(m.baseHp,42);assert.equal(m.maxHp,69.3);
 assert.equal(m.baseAtk,4);assert.equal(m.atk,5.6);
 assert.equal(spawnMondayWave(3).enemies[0].maxHp,165);
});
test('each wave has stable distinct enemy IDs',()=>{
 const unique=new Set();
 HELL_MONDAY.waves.forEach((w,i)=>spawnMondayWave(i).enemies.forEach(e=>{assert.equal(unique.has(e.id),false);unique.add(e.id)}));
 assert.equal(unique.size,11);
});
test('cross-wave recovery heals living only and cannot exceed max HP',()=>{
 assert.equal(clearWaveRecovery(25,100),35);
 assert.equal(clearWaveRecovery(98,100),100);
 assert.equal(clearWaveRecovery(0,100),0);
});
test('winning a mob wave is not dungeon victory',()=>{
 assert.equal(isDungeonComplete(0,0),false);
 assert.equal(isDungeonComplete(2,0),false);
 assert.equal(isDungeonComplete(3,0),true);
});