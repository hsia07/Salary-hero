import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceLiveColleagues,applyColleagueRetaliation} from '../v19/s1-formation-live.mjs';
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

test('retaliation damages a frontline colleague without mutating previous state',()=>{
 const first=advanceLiveColleagues({draft,level:10,enemy,seconds:.1});
 const before=first.state.battle.allies.map(x=>x.hp);
 const hit=applyColleagueRetaliation(first.state,60);
 assert.ok(hit.events.some(x=>x.type==='colleague-hit'));
 assert.ok(hit.state.battle.allies.some((x,i)=>x.hp<before[i]));
 assert.deepEqual(first.state.battle.allies.map(x=>x.hp),before);
});
test('shield absorbs colleague retaliation before HP',()=>{
 const first=advanceLiveColleagues({draft,level:10,enemy,seconds:.1});
 const before=first.state.battle.allies;
 const guarded=before.find(x=>x.row==='front');
 const shielded={...first.state,battle:{...first.state.battle,allies:before.map(x=>x.id===guarded.id?{...x,shield:1000}:x)}};
 const hit=applyColleagueRetaliation(shielded,30,{targetId:guarded.id});
 assert.ok(hit.events.some(x=>x.blocked>0));
 assert.equal(hit.state.battle.allies.find(x=>x.id===guarded.id).hp,guarded.hp);
});
test('defeated colleague stays down within the encounter',()=>{
 let current=advanceLiveColleagues({draft,level:10,enemy,seconds:.1}).state;
 for(let i=0;i<10;i++)current=applyColleagueRetaliation(current,10000).state;
 assert.ok(current.battle.allies.every(x=>x.hp===0));
 const next=advanceLiveColleagues({draft,level:10,enemy,previous:current,seconds:.1});
 assert.equal(next.damage,0);
});

test('scripted retaliation targets the selected colleague only',()=>{
 const first=advanceLiveColleagues({draft,level:10,enemy,seconds:.1});
 const target=first.state.battle.allies.find(x=>x.role==='healer');
 const hit=applyColleagueRetaliation(first.state,100,{targetId:target.id});
 assert.equal(hit.events[0].targetId,target.id);
 for(const unit of first.state.battle.allies.filter(x=>x.id!==target.id)){
  assert.equal(hit.state.battle.allies.find(x=>x.id===unit.id).hp,unit.hp);
 }
});
test('assassin retaliation prioritizes vulnerable rear over frontline',()=>{
 const first=advanceLiveColleagues({draft,level:10,enemy,seconds:.1});
 const battle={...first.state.battle,allies:first.state.battle.allies.map((u,i)=>({...u,row:i===2?'rear':'front',lane:1}))};
 const hit=applyColleagueRetaliation({...first.state,battle},60,{enemyRole:'assassin'});
 assert.equal(hit.events[0].targetId,battle.allies[2].id);
});
test('retaliation ignores defeated units when selecting a target',()=>{
 const first=advanceLiveColleagues({draft,level:10,enemy,seconds:.1});
 const battle={...first.state.battle,allies:first.state.battle.allies.map((u,i)=>({...u,hp:i===0?0:u.hp}))};
 const hit=applyColleagueRetaliation({...first.state,battle},60);
 assert.notEqual(hit.events[0].targetId,battle.allies[0].id);
});
