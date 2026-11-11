import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,transition} from '../v19/engine.mjs';

function strike(state){
 return transition(state,{type:'attack'},()=>0.99,Date.parse('2026-11-12T04:00:00Z'));
}
test('recruited colleague increases actual attack damage without breaking solo play',()=>{
 const base=initial();
 const solo=strike(base);
 assert.equal(solo.last.type,'hit');
 assert.equal(solo.last.colleagueAssist,0);
 const recruited=transition(base,{type:'s1RecruitColleague',id:'fighter'});
 const assisted=strike(recruited);
 assert.equal(assisted.last.type,'hit');
 assert.ok(assisted.last.colleagueAssist>0);
 assert.equal(assisted.last.damage,solo.last.damage+assisted.last.colleagueAssist);
});
test('training changes teammate contribution without exceeding slave level',()=>{
 let state=transition(initial(),{type:'s1RecruitColleague',id:'fighter'});
 state.level=10;
 state.gold=10000;
 state.colleagueProgress.materials.trainingXp=10000;
 const before=strike(state).last.colleagueAssist;
 state=transition(state,{type:'s1TrainColleague',id:'starter-fighter'});
 assert.equal(state.last.ok,true);
 const after=strike(state).last.colleagueAssist;
 assert.ok(after>=before);
 assert.equal(state.colleagueProgress.members[0].level,2);
});
