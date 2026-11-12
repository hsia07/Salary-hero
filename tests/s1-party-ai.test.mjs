import test from 'node:test';import assert from 'node:assert/strict';
import {ALLY_ROLES,SUPPORT_RULES,pickTarget,pickCriticalAlly,healForTarget,shieldForTarget,capShield,absorbHit} from '../v19/s1-party-ai.mjs';
const enemies=[
 {id:'a',species:'red-stamp-manager',elite:true,hp:170,maxHp:170,x:12,y:40},
 {id:'b',species:'paper-gremlin',hp:34,maxHp:70,x:44,y:38},
 {id:'c',species:'meeting-ghost',hp:44,maxHp:70,x:70,y:40},
];
test('seven unique roles with specific stats, intervals and skills',()=>{
 assert.equal(ALLY_ROLES.length,7);assert.equal(new Set(ALLY_ROLES.map(x=>x.id)).size,7);
 for(const role of ALLY_ROLES){assert.ok(role.maxHp>0&&role.attack>0&&role.defense>0&&role.attackInterval>0&&role.skill)}
});
test('elite is not hardcoded as universal target; target roles vary',()=>{
 const picked=ALLY_ROLES.map((_,i)=>pickTarget(i,enemies,{heroPosition:{x:45,y:65}}).id);
 assert.ok(new Set(picked).size>=2,'not every profession may focus the same elite');
 assert.equal(picked[2],'c','assassin prioritizes enemy controller/backline');
 assert.notEqual(picked[0],picked[2],'tank and assassin should have differentiated goals');
});
test('each committed attack can shift focus away from its target',()=>{
 const first=pickTarget(1,enemies,{heroPosition:{x:45,y:65}});
 const after=pickTarget(1,enemies,{heroPosition:{x:45,y:65},reservations:{[first.id]:5}});
 assert.notEqual(after.id,first.id);
});
test('healer prioritizes lowest living proportional HP rather than lowest numeric HP',()=>{
 assert.equal(pickCriticalAlly([36,25,0],[100,50,70]),0);
 assert.equal(pickCriticalAlly([90,33,0],[100,100,70]),1);
 assert.equal(pickCriticalAlly([0,0]),-1);
});
test('shields protect first, do not overflow, and lowest effective health accounts for them',()=>{
 assert.equal(shieldForTarget(220,.1),22);
 assert.equal(capShield(50,100,200),50);
 assert.deepEqual(absorbHit(50,12,20),{health:42,shield:0,absorbed:12});
 assert.equal(pickCriticalAlly([30,40],[100,100],[25,0]),1);
});
test('heals use recipient maximum HP and are not arbitrary flat values',()=>{
 assert.equal(healForTarget(200,.1),20);
 assert.equal(SUPPORT_RULES.healer.triggerBelow,.78);
});
