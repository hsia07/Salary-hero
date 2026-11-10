import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMON_ENEMIES,ALL_ENEMIES,enemyDesignFor} from './roster.mjs';
import {ALIEN_HERO_HIT_MS,ALIEN_ATTACK_START_MS,ALIEN_STAMP_RELEASE_MS,ALIEN_STAMP_IMPACT_MS,ALIEN_ATTACK_END_MS,ALIEN_DEFEAT_END_MS,ALIEN_ATTACK_DURATIONS,alienCombatPoseAt,alienStampAt,alienInjuryAt} from './alien-combat.mjs';

test('fourth monster is its own registered original ordinary species, not a reused cup or boss skin',()=>{
 const e=COMMON_ENEMIES.find(x=>x.id==='meeting-ghost');
 assert.equal(e.name,'星際打卡實習生');
 assert.equal(e.faction,'alien');
 assert.equal(ALL_ENEMIES.length,32);
 assert.equal(enemyDesignFor(50).id,'meeting-ghost');
});
test('alien hit/attack/death have distinct, correctly ordered sprite timelines',()=>{
 const hit={type:'hit',retaliationDamage:6};
 assert.equal(ALIEN_ATTACK_DURATIONS.length,5);
 assert.equal(ALIEN_ATTACK_DURATIONS.reduce((a,b)=>a+b,0),660);
 assert.equal(alienCombatPoseAt(404,hit).state,'idle');
 assert.equal(alienCombatPoseAt(405,hit).state,'hurt');
 assert.equal(alienCombatPoseAt(842,hit).state,'idle');
 assert.equal(alienCombatPoseAt(845,hit).state,'attack');
 assert.equal(alienCombatPoseAt(1400,hit).state,'attack');
 assert.equal(alienCombatPoseAt(1505,hit).state,'idle');
 assert.equal(alienCombatPoseAt(1400,{type:'hit',retaliationDamage:0}).state,'idle');
 assert.equal(alienCombatPoseAt(1100,{type:'victory'}).state,'defeat');
 assert.equal(alienCombatPoseAt(ALIEN_DEFEAT_END_MS,{type:'victory'}).state,'idle');
});
test('the alien stamp actually flies and strikes hero only after real casting',()=>{
 assert.ok(ALIEN_STAMP_RELEASE_MS>ALIEN_ATTACK_START_MS);
 assert.ok(ALIEN_STAMP_IMPACT_MS>ALIEN_STAMP_RELEASE_MS);
 assert.equal(alienStampAt(ALIEN_STAMP_RELEASE_MS-1).projectile,false);
 const mid=alienStampAt((ALIEN_STAMP_RELEASE_MS+ALIEN_STAMP_IMPACT_MS)/2);
 assert.equal(mid.projectile,true);assert.ok(mid.flight>.2&&mid.flight<.8);
 assert.equal(alienStampAt(ALIEN_STAMP_IMPACT_MS).impact,1);
 assert.equal(alienStampAt(ALIEN_STAMP_IMPACT_MS,false).active,false);
});
test('alien skin red flash is visible on low FPS and never fires before a real hit',()=>{
 assert.equal(alienInjuryAt(ALIEN_HERO_HIT_MS-1).active,false);
 assert.ok(alienInjuryAt(ALIEN_HERO_HIT_MS+22).white>.3);
 for(const age of [45,85,145,200,250])assert.ok(alienInjuryAt(ALIEN_HERO_HIT_MS+age).red>.2);
 assert.equal(alienInjuryAt(ALIEN_HERO_HIT_MS+290).active,false);
 assert.ok(alienInjuryAt(ALIEN_HERO_HIT_MS+160,{reducedMotion:true}).red<
   alienInjuryAt(ALIEN_HERO_HIT_MS+160).red);
});
