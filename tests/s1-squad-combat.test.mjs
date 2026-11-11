import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSquadAssist} from '../v19/s1-squad-combat.mjs';
const draft=(jobs)=>({slots:Array.from({length:6},(_,i)=>jobs[i]?{id:'u'+i,job:jobs[i],level:10,stars:1}:null)});
test('empty squad contributes nothing',()=>{
 const result=resolveSquadAssist(draft([]),10,{heroHp:50,heroMaxHp:100});
 assert.equal(result.damage,0);
 assert.equal(result.heal,0);
 assert.equal(result.units,0);
});
test('roles have distinct effects and medic healing respects missing HP',()=>{
 const result=resolveSquadAssist(draft(['sentinel','fighter','assassin','mage','medic','engineer']),10,{heroHp:99,heroMaxHp:100,enemyHp:80,turn:3});
 assert.equal(result.units,6);
 assert.equal(result.breakdown.length,6);
 assert.equal(result.heal,1);
 assert.ok(result.damage>0);
 assert.ok(result.breakdown.find(x=>x.role==='tank').shield>0);
 assert.ok(result.breakdown.find(x=>x.role==='caster').slow);
 assert.ok(result.breakdown.find(x=>x.role==='healer').heal>0);
});
test('slave level cap and formation govern assist damage',()=>{
 const solo=resolveSquadAssist(draft(['fighter']),1);
 const stronger=resolveSquadAssist(draft(['fighter']),30);
 assert.ok(stronger.damage>=solo.damage);
 assert.equal(resolveSquadAssist(draft([]),30).damage,0);
});
