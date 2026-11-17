import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceLiveColleagues} from '../v19/s1-formation-live.mjs';
const draft={slots:[
 {id:'starter-fighter',job:'fighter',level:10,stars:1},
 {id:'starter-medic',job:'medic',level:10,stars:1},
 {id:'starter-engineer',job:'engineer',level:10,stars:1},
 null,null,null
]};
const enemy={typeId:'paper-gremlin',name:'影印室工讀紙妖',hp:2000,maxHp:2000,wave:1};
test('live colleague turns have separate actions and persistent cooldown',()=>{
 const first=advanceLiveColleagues({draft,level:10,enemy,seconds:.1});
 assert.equal(first.state.battle.allies.length,3);
 assert.ok(first.damage>0);
 assert.ok(first.events.some(x=>x.type==='attack'));
 assert.ok(first.events.some(x=>x.type==='shield'));
 const second=advanceLiveColleagues({draft,level:10,enemy,previous:first.state,seconds:.1});
 assert.equal(second.state.battle.allies.length,3);
 assert.equal(second.damage,0);
 assert.ok(second.state.battle.time>first.state.battle.time);
});
test('new wave resets colleague battle without changing roster',()=>{
 const first=advanceLiveColleagues({draft,level:10,enemy,seconds:.1});
 const next=advanceLiveColleagues({draft,level:10,enemy:{...enemy,wave:2},previous:first.state,seconds:.1});
 assert.ok(next.state.battle.time<first.state.battle.time+.11);
 assert.equal(next.state.wave,2);
});
test('empty formation has no phantom damage',()=>{
 const result=advanceLiveColleagues({draft:{slots:[]},enemy});
 assert.equal(result.damage,0);
 assert.equal(result.state,null);
});
