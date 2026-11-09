import test from 'node:test';
import assert from 'node:assert/strict';
import {CHIBI_ATTACK_V2_MS,CHIBI_ATTACK_V2_TOTAL_MS,attackFrameAt,attackPhaseAt,validateAttackAtlas} from './attack-timing.mjs';

test('seven separate poses, and a complete 805ms visual cadence',()=>{
 assert.deepEqual(CHIBI_ATTACK_V2_MS,[115,135,95,60,145,100,155]);
 assert.equal(CHIBI_ATTACK_V2_TOTAL_MS,805);
});
test('frame transitions use exact boundaries with no blended source images',()=>{
 const times=[0,114,115,249,250,344,345,404,405,549,550,649,650,804,805,900];
 const expected=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,-1,-1];
 assert.deepEqual(times.map(attackFrameAt),expected);
});
test('frame four is the impact, frame three is the forward swing',()=>{
 assert.deepEqual([attackPhaseAt(360).frame,attackPhaseAt(450).frame,attackPhaseAt(650).frame],[3,4,6]);
 assert.equal(attackPhaseAt(450).impact,true);
 assert.equal(attackPhaseAt(360).slash,true);
 assert.equal(attackPhaseAt(804).finished,false);
 assert.equal(attackPhaseAt(805).finished,true);
});
test('invalid and corrupt atlas shapes are rejected before rendering',()=>{
 assert.equal(validateAttackAtlas(3584,512),512);
 assert.equal(validateAttackAtlas(2688,384),384);
 for(const [w,h] of [[640,128],[512,512],[1774,887],[2688,512],[0,0]])
  assert.equal(validateAttackAtlas(w,h),0);
});
test('NaN, negative and undefined elapsed times cannot break animation',()=>{
 assert.equal(attackFrameAt(-100),0);
 assert.equal(attackFrameAt(undefined),0);
 assert.equal(attackFrameAt(NaN),0);
});
