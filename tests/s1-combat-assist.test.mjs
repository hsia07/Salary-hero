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
 const deployed=transition(recruited,{type:'s1DeployColleague',id:'fighter',slot:0});
 const assisted=strike(deployed);
 assert.equal(assisted.last.type,'hit');
 assert.ok(assisted.last.colleagueAssist>0);
 assert.equal(assisted.last.damage,solo.last.damage+assisted.last.colleagueAssist);
});
test('training changes teammate contribution without exceeding slave level',()=>{
 let state=transition(initial(),{type:'s1RecruitColleague',id:'fighter'});
 state.level=10;
 state.gold=10000;
 state.colleagueProgress.materials.trainingXp=10000;
 state=transition(state,{type:'s1DeployColleague',id:'fighter',slot:0});
 const before=strike(state).last.colleagueAssist;
 state=transition(state,{type:'s1TrainColleague',id:'starter-fighter'});
 assert.equal(state.last.ok,true);
 const after=strike(state).last.colleagueAssist;
 assert.ok(after>=before);
 assert.equal(state.colleagueProgress.members[0].level,2);
});

test('deployment persists, swaps unique member, and removal cancels combat assist',()=>{
 let s=transition(initial(),{type:'s1RecruitColleague',id:'fighter'});
 assert.equal(strike(s).last.colleagueAssist,0);
 s=transition(s,{type:'s1DeployColleague',id:'fighter',slot:0});
 assert.equal(s.last.ok,true);
 assert.ok(strike(s).last.colleagueAssist>0);
 s=transition(s,{type:'s1DeployColleague',id:'fighter',slot:5});
 assert.equal(s.colleagueFormation.slots[0],null);
 assert.equal(s.colleagueFormation.slots[5].id,'starter-fighter');
 s=transition(s,{type:'s1RemoveColleague',slot:5});
 assert.equal(strike(s).last.colleagueAssist,0);
});
