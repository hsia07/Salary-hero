import test from 'node:test';import assert from 'node:assert/strict';
import {ACTIVE_SKILLS,chooseGuardTarget,chooseCleanseTarget,chooseBacklineTarget,chooseAoETargets,splitIntercept,damageDefenseModifier,scaledDamage} from '../v19/s1-hero-active-skills.mjs';
test('all four abilities have bounded numerical parameters and cooldowns',()=>{
 assert.deepEqual(Object.keys(ACTIVE_SKILLS),['guard','mage','assassin','cleanse']);
 for(const skill of Object.values(ACTIVE_SKILLS))assert.ok(skill.cooldownMs>5000);
 assert.ok(ACTIVE_SKILLS.guard.redirectRatio<=.35);
 assert.ok(ACTIVE_SKILLS.mage.splashMultiplier<ACTIVE_SKILLS.mage.primaryMultiplier);
});
test('guard protects lowest living ally and cannot protect himself',()=>{
 assert.equal(chooseGuardTarget([10,25,0,60],[0,0,0,0]),1);
 assert.equal(chooseGuardTarget([90,48,9],[0,0,0]),2);
});
test('cleanse chooses stunned, then heal suppression, then slow',()=>{
 assert.equal(chooseCleanseTarget([[],['slow'],['stun'],['paycut']],[100,50,100,20]),2);
 assert.equal(chooseCleanseTarget([[],['slow'],['stun']],[100,50,0]),1);
 assert.equal(chooseCleanseTarget([[],[]],[100,60]),-1);
});
test('backline assassin prioritizes controller/ranged over elite threat',()=>{
 const monsters=[{id:'elite',species:'red-stamp-manager',elite:true,hp:120,maxHp:150},
 {id:'mage',species:'meeting-ghost',hp:40,maxHp:45},
 {id:'melee',species:'paper-gremlin',hp:3,maxHp:60}];
 assert.equal(chooseBacklineTarget(monsters).id,'mage');
});
test('AoE targets nearest living 3, not dead bystanders',()=>{
 const e=[{id:'a',hp:20,x:4,y:0},{id:'b',hp:30,x:10,y:0},{id:'c',hp:40,x:60,y:0},{id:'d',hp:0,x:6,y:0},{id:'e',hp:50,x:21,y:0}];
 assert.deepEqual(chooseAoETargets(e[0],e).map(x=>x.id),['a','b','e']);
});
test('redirect splits damage without amplification; defense gives moderate differences',()=>{
 const d=splitIntercept(10);assert.deepEqual(d,{target:7,guard:3});
 assert.equal(d.target+d.guard,10);
 assert.ok(damageDefenseModifier(155)<1&&damageDefenseModifier(74)>1);
 assert.ok(damageDefenseModifier(155)>=.75&&damageDefenseModifier(74)<=1.16);
 assert.equal(scaledDamage(20,128),20);
});
