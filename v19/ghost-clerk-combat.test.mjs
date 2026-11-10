import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_ENEMIES,COMMON_ENEMIES,enemyDesignFor} from './roster.mjs';
import {
 CLERK_HERO_HIT_MS,CLERK_HURT_END_MS,CLERK_ATTACK_START_MS,CLERK_REPORT_RELEASE_MS,
 CLERK_REPORT_IMPACT_MS,CLERK_ATTACK_END_MS,CLERK_DEFEAT_END_MS,
 clerkCombatPoseAt,clerkReportAt,clerkHurtFlashAt
} from './ghost-clerk-combat.mjs';
test('sixth ghost clerk is an independent registered normal enemy on floor 26',()=>{
 assert.equal(ALL_ENEMIES.length,32);
 assert.equal(COMMON_ENEMIES.find(x=>x.id==='keyboard-piranha')?.name,'加班遊魂文員');
 assert.equal(enemyDesignFor(26).id,'keyboard-piranha');
});
test('sixth has separately illustrated hit, curse attack and defeat windows',()=>{
 const hit={type:'hit',retaliationDamage:5};
 assert.equal(clerkCombatPoseAt(404,hit).state,'idle');
 assert.equal(clerkCombatPoseAt(405,hit).state,'hurt');
 assert.equal(clerkCombatPoseAt(CLERK_HURT_END_MS,hit).state,'idle');
 assert.equal(clerkCombatPoseAt(CLERK_ATTACK_START_MS,hit).state,'attack');
 assert.equal(clerkCombatPoseAt(CLERK_ATTACK_END_MS,hit).state,'idle');
 assert.equal(clerkCombatPoseAt(1200,{type:'hit',retaliationDamage:0}).state,'idle');
 assert.equal(clerkCombatPoseAt(1100,{type:'victory'}).state,'defeat');
 assert.equal(clerkCombatPoseAt(CLERK_DEFEAT_END_MS,{type:'victory'}).state,'idle');
});
test('haunted reports actually fly left from office clerk to hero at 1255ms',()=>{
 assert.ok(CLERK_REPORT_RELEASE_MS>CLERK_ATTACK_START_MS);
 assert.equal(clerkReportAt(CLERK_REPORT_RELEASE_MS-1).projectile,false);
 const p=clerkReportAt((CLERK_REPORT_RELEASE_MS+CLERK_REPORT_IMPACT_MS)/2);
 assert.equal(p.projectile,true);assert.equal(p.travelsLeft,true);
 assert.ok(p.originX>p.x&&p.x>p.targetX);
 assert.equal(clerkReportAt(CLERK_REPORT_IMPACT_MS).impact,1);
 assert.equal(clerkReportAt(CLERK_REPORT_IMPACT_MS,false).active,false);
});
test('silhouette red flash is visible at low FPS only after authentic hero impact',()=>{
 assert.equal(clerkHurtFlashAt(CLERK_HERO_HIT_MS-1).active,false);
 assert.ok(clerkHurtFlashAt(CLERK_HERO_HIT_MS+14).white>.5);
 for(const age of [45,85,135,205,260])assert.ok(clerkHurtFlashAt(CLERK_HERO_HIT_MS+age).red>.15);
 assert.equal(clerkHurtFlashAt(CLERK_HERO_HIT_MS+300).active,false);
});
