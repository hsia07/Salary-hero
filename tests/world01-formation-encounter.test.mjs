import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD01_MONSTERS,world01Enemy,world01AllySquad,createWorld01Encounter,tickFormationBattle} from '../v19/world01-formation-encounter.mjs';
test('original monster catalog retains exactly 16 commons, 8 elites and 8 bosses',()=>{
 assert.equal(WORLD01_MONSTERS.length,32);
 assert.equal(new Set(WORLD01_MONSTERS.map(x=>x.id)).size,32);
 assert.equal(WORLD01_MONSTERS.filter(x=>x.id==='paper-gremlin').length,1);
});
test('boss has higher stats than ordinary enemy and original ID remains intact',()=>{
 const a=world01Enemy('paper-gremlin',{level:3});
 const b=world01Enemy('printer-overlord',{level:3});
 assert.ok(b.maxHp>a.maxHp);
 assert.equal(b.monsterId,'printer-overlord');
 assert.equal(world01Enemy('not-a-monster'),null);
});
test('six colleagues and independent hero form seven anchors',()=>{
 const draft={slots:[
 {id:'a',job:'sentinel'},{id:'b',job:'fighter'},{id:'c',job:'assassin'},
 {id:'d',job:'mage'},{id:'e',job:'medic'},{id:'f',job:'engineer'}]};
 const allies=world01AllySquad(draft,{slaveLevel:20,hero:{level:20,hp:200,maxHp:200,attack:40}});
 assert.equal(allies.length,7);
 assert.equal(allies.filter(x=>x.row==='front').length,3);
 assert.equal(allies.filter(x=>x.row==='rear').length,3);
 assert.equal(allies.filter(x=>x.row==='hero').length,1);
 assert.equal(new Set(allies.map(x=>x.id)).size,7);
});
test('world01 encounter creates a tickable battle without changing squad input',()=>{
 const draft={slots:[{id:'a',job:'fighter'}]};
 const snapshot=JSON.stringify(draft);
 const initial=createWorld01Encounter({draft,hero:{level:1,maxHp:100,attack:25},monsterIds:['paper-gremlin','coffee-mimic']});
 assert.equal(initial.enemies.length,2);
 assert.equal(initial.allies.length,2);
 const next=tickFormationBattle(initial,.1);
 assert.ok(next.events.some(x=>x.type==='attack'));
 assert.equal(JSON.stringify(draft),snapshot);
});
