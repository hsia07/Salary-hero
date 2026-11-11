import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,transition,normalize} from '../v19/engine.mjs';
test('recruit starter colleague, save, and train using battle-earned materials',()=>{
 let s=initial();
 s=transition(s,{type:'s1RecruitColleague',id:'fighter'},()=>0.5);
 assert.equal(s.last.ok,true);
 assert.equal(s.colleagueProgress.members.length,1);
 assert.equal(s.colleagueProgress.members[0].id,'starter-fighter');
 assert.equal(transition(s,{type:'s1RecruitColleague',id:'fighter'},()=>0.5).last.ok,false);
 s.level=2;s.gold=1000;s.colleagueProgress.materials.trainingXp=100;
 const trained=transition(s,{type:'s1TrainColleague',id:'starter-fighter'},()=>0.5);
 assert.equal(trained.last.ok,true);
 assert.equal(trained.colleagueProgress.members[0].level,2);
 assert.ok(trained.gold<1000);
 assert.equal(normalize(trained).colleagueProgress.members[0].level,2);
});
test('no training past slave level and no spending on failure',()=>{
 let s=transition(initial(),{type:'s1RecruitColleague',id:'medic'},()=>0.5);
 s.gold=1000;s.colleagueProgress.materials.trainingXp=1000;
 const out=transition(s,{type:'s1TrainColleague',id:'starter-medic'},()=>0.5);
 assert.equal(out.last.ok,false);
 assert.equal(out.gold,1000);
});
test('invalid job cannot recruit and training mode cannot mutate colleague progression',()=>{
 let s=transition(initial(),{type:'s1RecruitColleague',id:'made-up'},()=>0.5);
 assert.equal(s.last.ok,false);
 assert.equal(s.colleagueProgress.members.length,0);
 s.trainingIsolated=true;
 const out=transition(s,{type:'s1RecruitColleague',id:'fighter'},()=>0.5);
 assert.equal(out.colleagueProgress.members.length,0);
});
