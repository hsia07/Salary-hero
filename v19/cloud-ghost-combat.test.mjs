import test from 'node:test';import assert from 'node:assert/strict';
import {ALL_ENEMIES,COMMON_ENEMIES,enemyDesignFor} from './roster.mjs';
import {CLOUD_HERO_HIT_MS,CLOUD_HURT_END_MS,CLOUD_ATTACK_START_MS,
 CLOUD_CLOCK_LAUNCH_MS,CLOUD_CLOCK_IMPACT_MS,CLOUD_ATTACK_END_MS,CLOUD_DEFEAT_END_MS,
 cloudCombatPoseAt,cloudClockAt,cloudHurtFlashAt} from './cloud-ghost-combat.mjs';
test('the fifth is normal original species, not an elite or boss',()=>{
 assert.equal(ALL_ENEMIES.length,32);
 assert.equal(COMMON_ENEMIES.find(x=>x.id==='deadline-clock')?.name,'雲端資料專員靈');
 assert.equal(enemyDesignFor(6).id,'deadline-clock');
});
test('ghost has distinct hit/attack/defeat poses and no postmortem spell',()=>{
 const hit={type:'hit',retaliationDamage:5};
 assert.equal(cloudCombatPoseAt(404,hit).state,'idle');
 assert.equal(cloudCombatPoseAt(405,hit).state,'hurt');
 assert.equal(cloudCombatPoseAt(CLOUD_HURT_END_MS,hit).state,'idle');
 assert.equal(cloudCombatPoseAt(CLOUD_ATTACK_START_MS,hit).state,'attack');
 assert.equal(cloudCombatPoseAt(CLOUD_ATTACK_END_MS,hit).state,'idle');
 assert.equal(cloudCombatPoseAt(1100,{type:'hit',retaliationDamage:0}).state,'idle');
 assert.equal(cloudCombatPoseAt(405,{type:'victory'}).state,'defeat');
 assert.equal(cloudCombatPoseAt(CLOUD_DEFEAT_END_MS,{type:'victory'}).state,'idle');
});
test('clock launches from right, flies left and hits only at 1225 ms',()=>{
 assert.ok(CLOUD_CLOCK_LAUNCH_MS>CLOUD_ATTACK_START_MS);
 assert.ok(CLOUD_CLOCK_IMPACT_MS>CLOUD_CLOCK_LAUNCH_MS);
 assert.equal(cloudClockAt(CLOUD_CLOCK_LAUNCH_MS-1).projectile,false);
 const mid=cloudClockAt((CLOUD_CLOCK_LAUNCH_MS+CLOUD_CLOCK_IMPACT_MS)/2);
 assert.equal(mid.projectile,true);
 assert.ok(mid.originX>mid.x&&mid.x>mid.targetX);
 assert.equal(mid.travelsLeft,true);
 assert.equal(cloudClockAt(CLOUD_CLOCK_IMPACT_MS).impact,1);
 assert.equal(cloudClockAt(CLOUD_CLOCK_IMPACT_MS,false).active,false);
});
test('white then red flash lasts across low-FPS hit samples',()=>{
 assert.equal(cloudHurtFlashAt(CLOUD_HERO_HIT_MS-1).active,false);
 assert.ok(cloudHurtFlashAt(CLOUD_HERO_HIT_MS+12).white>.6);
 for(const age of [65,120,190,232,280])assert.ok(cloudHurtFlashAt(CLOUD_HERO_HIT_MS+age).red>.15);
 assert.equal(cloudHurtFlashAt(CLOUD_HERO_HIT_MS+310).active,false);
});
