import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,normalize,transition,loopEnemyFor,salaryAt} from './engine.mjs';
import {liteTacticalHit,liteTacticalHint} from './lite-tactics.mjs';
import {LITE_ARMOR_POSES,liteArmorPose,liteArmorAsset} from './lite-armor-poses.mjs';
import {liteBase,liteCreateItem} from './lite-equipment.mjs';
const NOW=Date.parse('2026-11-11T00:00:00Z'),noCrit=()=>.999;
const hero=(build)=>{const s=initial();s.auto=false;s.liteActiveBuild=build;s.liteToxinKey='campaign:1';return s;};
test('real-poses outfit attachment metadata covers all 7 attack, 5 hurt and idle frames',()=>{
 assert.equal(LITE_ARMOR_POSES.attack.length,7);
 assert.equal(LITE_ARMOR_POSES.hurt.length,5);
 assert.ok(liteArmorPose('idle').width>0);
 for(const group of ['attack','hurt'])for(const x of LITE_ARMOR_POSES[group]){
   assert.ok(x.x>=0&&x.y>=0&&x.width>0&&x.height>0);
   assert.ok(Math.abs(x.rotation)<.5);
 }
 assert.deepEqual(liteArmorPose('hurt',999),LITE_ARMOR_POSES.hurt[4]);
 assert.deepEqual(liteArmorPose('attack',-3),LITE_ARMOR_POSES.attack[0]);
 assert.equal(liteArmorAsset({instanceId:'li-1'},liteBase('a-chemist')),'armorCoffee');
 assert.equal(liteArmorAsset({instanceId:'li-1'},liteBase('a-coat')),'armorClockout');
 assert.equal(liteArmorAsset({instanceId:'li-1'},liteBase('a-heavy')),'armorGuardian');
 assert.equal(liteArmorAsset(null,liteBase('a-coat')),null);
 assert.equal(liteArmorAsset({instanceId:'li-1'},liteBase('w-stapler')),null);
});
test('clock-out stamps from crits and finishers, not from every attack',()=>{
 let s=hero('clockout');s.liteMarks=0;
 assert.equal(liteTacticalHit(s,{damage:40,skill:null}).marks,0);
 assert.equal(liteTacticalHit(s,{damage:40,crit:true}).marks,1);
 assert.equal(liteTacticalHit(s,{damage:40,buildProc:true}).marks,1);
 assert.equal(liteTacticalHit(s,{damage:40,crit:true,buildProc:true}).marks,2);
 s.liteMarks=3;
 assert.equal(liteTacticalHit(s,{damage:50,crit:true,buildProc:true}).marks,3);
});
test('burst deliberately spends old stamps, never spends stamps earned by the same hit',()=>{
 let s=hero('clockout');s.liteMarks=1;
 let a=liteTacticalHit(s,{skill:'burst',damage:100,crit:true});
 assert.equal(a.spent,0);assert.equal(a.marks,2);
 s.liteMarks=2;a=liteTacticalHit(s,{skill:'burst',damage:100,crit:true});
 assert.equal(a.spent,2);assert.ok(a.extra>0);assert.equal(a.marks,1);
 s.liteMarks=3;const b=liteTacticalHit(s,{skill:'burst',damage:100});
 assert.ok(b.extra>a.extra);assert.equal(b.marks,0);
});
test('coffee can hold stacks for high-power extraction; boss needs at least 4 for interrupt',()=>{
 let s=hero('coffee');s.liteToxinStacks=3;
 const regular=liteTacticalHit(s,{skill:'drain',damage:100,enemyTier:'normal'});
 assert.equal(regular.extracted,3);
 assert.equal(regular.stacks,1);
 assert.ok(regular.extra>0&&regular.heal>0);
 assert.equal(regular.skipRetaliation,true);
 const boss=liteTacticalHit(s,{skill:'drain',damage:100,enemyTier:'boss'});
 assert.equal(boss.skipRetaliation,false);
 s.liteToxinStacks=4;
 const lateBoss=liteTacticalHit(s,{skill:'drain',damage:100,enemyTier:'boss'});
 assert.equal(lateBoss.skipRetaliation,true);
});
test('tactical helper is pure; no currencies, inventory or source mutations',()=>{
 let s=hero('coffee');s.liteToxinStacks=2;s.gold=417;
 const before=JSON.stringify(s);
 const result=liteTacticalHit(s,{skill:'drain',damage:80});
 assert.equal(result.extracted,2);assert.equal(JSON.stringify(s),before);
});
test('real engine attack adds stamp marks, burst spends pre-existing marks',()=>{
 const base=hero('clockout');base.liteMarks=3;
 base.enemy={...loopEnemyFor(1,'campaign',NOW),hp:3000,maxHp:3000,attack:9,trait:'none'};
 const withStamp=transition(base,{type:'skill',id:'burst'},noCrit,NOW);
 assert.ok(withStamp.last.tacticalSpent>=2);
 assert.ok(withStamp.last.tacticalExtra>0);
 assert.equal(withStamp.liteMarks,0);
 const empty=structuredClone(base);empty.liteMarks=0;
 const withoutStamp=transition(empty,{type:'skill',id:'burst'},noCrit,NOW);
 assert.ok(withStamp.last.damage>withoutStamp.last.damage);
 assert.equal(withoutStamp.last.tacticalSpent,0);
});
test('real engine coffee extraction trades stored toxin for healing and a free hit',()=>{
 const s=hero('coffee');s.liteToxinStacks=3;
 s.enemy={...loopEnemyFor(1,'campaign',NOW),hp:3000,maxHp:3000,attack:18,trait:'none'};
 s.heroHp=33;
 const after=transition(s,{type:'skill',id:'drain'},noCrit,NOW);
 assert.equal(after.last.tacticalExtracted,3);
 assert.ok(after.last.tacticalHeal>0);
 assert.equal(after.last.enemyIdle,true);
 assert.equal(after.last.retaliationDamage,0);
 assert.equal(after.liteToxinStacks,1);
 assert.ok(after.heroHp>33);
});
test('mode and class switching reset temporary stamps without losing permanent mastery',()=>{
 let s=hero('clockout');s.liteMarks=3;s.liteBuildProgress.clockout=20;
 s=transition(s,{type:'mode',id:'tower'},noCrit,NOW);
 assert.equal(s.liteMarks,0);
 s.liteMarks=3;
 s=transition(s,{type:'liteChooseBuild',id:'coffee'},noCrit,NOW);
 assert.equal(s.liteMarks,0);
 assert.equal(s.liteBuildProgress.clockout,20);
});
test('old save and loaded presets never create stamp charges',()=>{
 let s=hero('clockout');delete s.liteMarks;
 s=normalize(JSON.parse(JSON.stringify(s)),NOW);
 assert.equal(s.liteMarks,0);
 s.liteMarks=3;s.litePresets[0]={name:'X',build:'clockout',
   loadout:{weapon:null,armor:null,badge:null,relic:null},
   branches:{clockout:'rush',coffee:'heal'},skillPaths:{burst:null,guard:null,drain:null}};
 s=transition(s,{type:'liteLoadPreset',index:0},noCrit,NOW);
 assert.equal(s.liteMarks,0);
 assert.equal(liteTacticalHint(s).count,0);
});
test('poison status is visible as progress; salary remains isolated',()=>{
 const s=hero('coffee');s.liteToxinStacks=3;s.liteBuildProgress.coffee=18;
 assert.equal(liteTacticalHint(s).count,3);
 assert.equal(liteTacticalHint(s).max,5);
 const prior=salaryAt(NOW,40000);liteTacticalHit(s,{skill:'drain',damage:50});
 assert.deepEqual(salaryAt(NOW,40000),prior);
});
