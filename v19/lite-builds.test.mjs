import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,normalize,transition,loopEnemyFor,salaryAt} from './engine.mjs';
import {LITE_BUILDS,LITE_BUILD_TIERS,liteBuildById,liteBuildProgress,liteBuildBranch,liteBuildStats,liteBuildHit,liteMasteryRank,liteGrantMastery} from './lite-builds.mjs';
const NOW=Date.parse('2026-11-11T00:00:00Z');
const rng=()=>.99;
const state=()=>{const s=initial();s.auto=false;return s;};
test('two Lite builds and three rank milestones are deterministic',()=>{
 assert.deepEqual(LITE_BUILDS.map(x=>x.id),['clockout','coffee']);
 assert.deepEqual(LITE_BUILD_TIERS,[0,5,18,48]);
 assert.equal(liteMasteryRank(0),0);
 assert.equal(liteMasteryRank(4),0);
 assert.equal(liteMasteryRank(5),1);
 assert.equal(liteMasteryRank(18),2);
 assert.equal(liteMasteryRank(48),3);
 assert.equal(liteMasteryRank(1000),3);
 assert.equal(liteBuildById('other'),null);
});
test('old V19 save loads with default unchosen build and zero mastery',()=>{
 const s=state();delete s.liteActiveBuild;delete s.liteBuildProgress;delete s.liteBuildBranch;
 const restored=normalize(JSON.parse(JSON.stringify(s)),NOW);
 assert.equal(restored.liteActiveBuild,'none');
 assert.deepEqual(restored.liteBuildProgress,{clockout:0,coffee:0});
 assert.deepEqual(restored.liteBuildBranch,{clockout:'rush',coffee:'heal'});
 assert.equal(liteBuildStats(restored).crit,0);
});
test('players can switch freely and each build keeps its previous mastery',()=>{
 let s=transition(state(),{type:'liteChooseBuild',id:'clockout'},rng,NOW);
 assert.equal(s.liteActiveBuild,'clockout');
 s.liteBuildProgress.clockout=7;
 s=transition(s,{type:'liteChooseBuild',id:'coffee'},rng,NOW);
 assert.equal(s.liteActiveBuild,'coffee');
 assert.equal(s.liteBuildProgress.clockout,7);
 s=transition(s,{type:'liteChooseBuild',id:'clockout'},rng,NOW);
 assert.equal(liteBuildStats(s).rank,1);
 assert.equal(normalize(JSON.parse(JSON.stringify(s)),NOW).liteActiveBuild,'clockout');
});
test('ranked branch only, invalid options cannot override current choice',()=>{
 let s=transition(state(),{type:'liteChooseBuild',id:'clockout'},rng,NOW);
 s=transition(s,{type:'liteChooseBranch',id:'execute'},rng,NOW);
 assert.equal(s.liteBuildBranch.clockout,'rush');
 s.liteBuildProgress.clockout=5;
 s=transition(s,{type:'liteChooseBranch',id:'execute'},rng,NOW);
 assert.equal(s.liteBuildBranch.clockout,'execute');
 s=transition(s,{type:'liteChooseBranch',id:'venom'},rng,NOW);
 assert.equal(s.liteBuildBranch.clockout,'execute');
});
test('clockout produces a real fourth-hit execution and an advanced rush third-hit option',()=>{
 let s=transition(state(),{type:'liteChooseBuild',id:'clockout'},rng,NOW);
 const enemy=loopEnemyFor(20,'campaign',NOW);
 s.wave=20;s.modeWaves.campaign=20;s.enemy={...enemy,hp:3000,maxHp:3000,attack:1};
 for(let n=1;n<=4;n++){
   s=transition(s,'attack',rng,NOW);
   assert.equal(Boolean(s.last.buildProc),n===4);
 }
 assert.ok(s.last.buildDamage>0);
 assert.equal(s.last.liteBuild,'clockout');
 // Pure helper validates a distinct rapid cadence without 3 actual fights.
 s.liteBuildProgress.clockout=5;s.liteBuildBranch.clockout='rush';
 assert.equal(liteBuildHit(s,100,enemy,3).proc,true);
 assert.equal(liteBuildHit(s,100,enemy,4).proc,false);
});
test('coffee stacks poison and recovers on third strike, with actual extra damage',()=>{
 let s=transition(state(),{type:'liteChooseBuild',id:'coffee'},rng,NOW);
 const enemy=loopEnemyFor(18,'campaign',NOW);
 s.wave=18;s.modeWaves.campaign=18;s.enemy={...enemy,hp:3000,maxHp:3000,attack:1};
 s.heroHp=25;
 for(let n=1;n<=3;n++){
   const prior=s.liteToxinStacks;
   s=transition(s,'attack',rng,NOW);
   assert.equal(s.liteToxinStacks,prior+1);
   assert.ok(s.last.poisonDamage>0);
   assert.equal(Boolean(s.last.buildHeal),n===3);
 }
 assert.equal(s.last.liteBuild,'coffee');
 assert.equal(s.liteToxinStacks,3);
});
test('elite and boss victories reward more career mastery; training cannot farm',()=>{
 const s=state();s.liteActiveBuild='clockout';
 const one=liteGrantMastery(s,'normal'),two=liteGrantMastery(s,'elite'),three=liteGrantMastery(s,'boss');
 assert.deepEqual([one.xp,two.xp,three.xp],[1,2,3]);
 assert.equal(s.liteBuildProgress.clockout,6);
 assert.equal(three.rank,1);
 assert.equal(three.rankUp,true);
 s.trainingIsolated=true;
 assert.equal(liteGrantMastery(s,'boss'),null);
 assert.equal(s.liteBuildProgress.clockout,6);
});
test('victory stores mastery and clears toxin for the next opponent',()=>{
 let s=transition(state(),{type:'liteChooseBuild',id:'coffee'},rng,NOW);
 s.enemy={...s.enemy,hp:1};
 s=transition(s,'attack',rng,NOW);
 assert.equal(s.last.type,'victory');
 assert.equal(s.liteBuildProgress.coffee,1);
 assert.equal(s.liteToxinStacks,0);
 assert.equal(s.last.mastery.id,'coffee');
});
test('mode change clears old poison and keeps mastery',()=>{
 let s=transition(state(),{type:'liteChooseBuild',id:'coffee'},rng,NOW);
 s.liteToxinStacks=3;s.liteToxinKey='campaign:1';s.liteBuildProgress.coffee=14;
 s=transition(s,{type:'mode',id:'tower'},rng,NOW);
 assert.equal(s.liteToxinStacks,0);
 assert.equal(s.liteBuildProgress.coffee,14);
});
test('execute path deals more than rush on the same boss, but less frequently',()=>{
 const s=state();s.liteActiveBuild='clockout';s.liteBuildProgress.clockout=20;
 const boss={tier:'boss'};
 s.liteBuildBranch.clockout='rush';const rush=liteBuildHit(s,100,boss,12);
 s.liteBuildBranch.clockout='execute';const execute=liteBuildHit(s,100,boss,12);
 assert.ok(execute.extra>rush.extra);
 assert.equal(execute.cooldownReduction,1);
});
test('coffee branches offer actual heal-versus-poison choice',()=>{
 const s=state();s.liteActiveBuild='coffee';s.liteBuildProgress.coffee=5;s.liteToxinStacks=2;
 s.liteBuildBranch.coffee='heal';const healed=liteBuildHit(s,100,{tier:'normal'},3);
 s.liteBuildBranch.coffee='venom';const poisoned=liteBuildHit(s,100,{tier:'normal'},3);
 assert.ok(healed.heal>poisoned.heal);
 assert.ok(poisoned.poison>healed.poison);
});
test('switching builds never touches salary money, level or inventory',()=>{
 let s=state();s.gold=45;s.level=9;s.owned=['briefcase','laptop'];s.liteBuildProgress.clockout=99;
 const before=salaryAt(NOW,40000);
 s=transition(s,{type:'liteChooseBuild',id:'clockout'},rng,NOW);
 s=transition(s,{type:'liteChooseBuild',id:'coffee'},rng,NOW);
 assert.equal(s.gold,45);assert.equal(s.level,9);assert.deepEqual(s.owned,['briefcase','laptop']);
 assert.deepEqual(salaryAt(NOW,40000),before);
});
test('injected invalid mastery, unknown build and rogue branches normalize safely',()=>{
 const s=state();s.liteActiveBuild='administrator';s.liteBuildProgress={clockout:Infinity,coffee:-1000};
 s.liteBuildBranch={clockout:'instant-win',coffee:'venom'};
 const sane=normalize(s,NOW);
 assert.equal(sane.liteActiveBuild,'none');
 assert.deepEqual(sane.liteBuildProgress,{clockout:0,coffee:0});
 assert.deepEqual(sane.liteBuildBranch,{clockout:'rush',coffee:'venom'});
});
