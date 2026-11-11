import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeColleagueProgress,enrollColleague,trainColleague,breakthroughColleague,applyProgressToSquad} from '../v19/s1-colleague-progression.mjs';
test('enroll, train and spend resources atomically',()=>{
 let s=enrollColleague({materials:{trainingXp:10000,coins:10000}},'a',37).state;
 const before=s.materials.trainingXp;
 const result=trainColleague(s,'a',37);
 assert.equal(result.ok,true);
 assert.equal(result.state.members[0].level,2);
 assert.ok(result.state.materials.trainingXp<before);
 assert.equal(s.members[0].level,1);
});
test('slave level cap blocks spending',()=>{
 const s=normalizeColleagueProgress({members:[{id:'a',level:37,breakthrough:1}],materials:{trainingXp:100000,coins:100000}},37);
 const r=trainColleague(s,'a',37);
 assert.equal(r.ok,false);
 assert.equal(r.reason,'level-cap');
 assert.deepEqual(r.state.materials,s.materials);
 assert.equal(trainColleague(s,'a',38).ok,true);
});
test('breakthrough requires threshold and material, and does not level automatically',()=>{
 const s=normalizeColleagueProgress({members:[{id:'a',level:20,breakthrough:0}],materials:{seals:2,coins:1000}},20);
 const r=breakthroughColleague(s,'a',20);
 assert.equal(r.ok,true);
 assert.equal(r.state.members[0].level,20);
 assert.equal(r.state.members[0].breakthrough,1);
 assert.equal(r.state.materials.seals,0);
 assert.equal(trainColleague(r.state,'a',20).reason,'level-cap');
});
test('legacy data clamped and squad derives owned levels',()=>{
 const s=normalizeColleagueProgress({members:[{id:'a',level:90,breakthrough:4},{id:'a',level:99}]},37);
 assert.equal(s.members.length,1);
 assert.equal(s.members[0].level,37);
 const squad=applyProgressToSquad({slots:[{id:'a',job:'fighter',level:100},{id:'b',job:'mage',level:99}]},s,37);
 assert.equal(squad.slots[0].level,37);
 assert.equal(squad.slots[1],null);
});
