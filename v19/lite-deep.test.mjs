import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,normalize,transition,loopEnemyFor} from './engine.mjs';
import {liteCreateItem} from './lite-equipment.mjs';
import {liteSkillCastBonus,liteSkillById,liteSkillSelection,liteSkillGrantUse,LITE_SKILL_PATHS} from './lite-skills.mjs';
import {liteLegendaryByTemplate,liteLegendaryEffects,LITE_LEGENDARIES} from './lite-legendaries.mjs';
import {liteSavePresetSnapshot,liteApplyPreset,liteNormalizePresets} from './lite-presets.mjs';
import {liteBuildScore} from './lite-idle.mjs';
const NOW=Date.parse('2026-11-11T00:00:00Z');
const noCrit=()=>.999;
const item=(name,rarity,id)=>liteCreateItem(name,rarity,12,id,()=>.4);
const make=()=>{const s=initial();s.auto=false;return s;};
function master(skill,choice){
 let s=make();s.liteSkillUses[skill]=6;s.liteSkillPaths[skill]=choice;return normalize(s,NOW);
}
function enemyTarget(s,now=NOW){
 s.enemy={...loopEnemyFor(1,'campaign',now),hp:15000,maxHp:15000,attack:20,trait:'none',tier:'normal'};
 // Training isolated only suppresses farming, not skill cast resolution.
 s.trainingIsolated=true;
 return s;
}
test('six skill branches exist, each with a real tradeoff',()=>{
 assert.deepEqual(LITE_SKILL_PATHS.map(x=>x.choices.length),[2,2,2]);
 assert.ok(liteSkillById('drain'));
 const heavy=liteSkillCastBonus(master('burst','heavy'),'burst');
 const quick=liteSkillCastBonus(master('burst','quick'),'burst');
 assert.ok(heavy.damageMultiplier>quick.damageMultiplier);
 assert.equal(heavy.cooldownOffset,1);
 assert.equal(quick.cooldownOffset,-1);
 assert.ok(quick.crit>heavy.crit);
 const safe=liteSkillCastBonus(master('guard','safe'),'guard');
 const counter=liteSkillCastBonus(master('guard','counter'),'guard');
 assert.ok(safe.guardReduction>0);assert.ok(counter.reflectMultiplier>0);
 const brew=liteSkillCastBonus(master('drain','brew'),'drain');
 const bitter=liteSkillCastBonus(master('drain','bitter'),'drain');
 assert.ok(brew.drainHeal>bitter.drainHeal);
 assert.ok(bitter.damageMultiplier>brew.damageMultiplier);
});
test('skill choices locked until six valid uses, no loophole from unearned choice in save',()=>{
 const s=make();s.liteSkillPaths.burst='heavy';
 assert.equal(liteSkillSelection(s,'burst'),null);
 let result=transition(s,{type:'liteChooseSkillPath',skill:'burst',id:'heavy'},noCrit,NOW);
 assert.equal(result.liteSkillPaths.burst,'heavy');
 assert.equal(liteSkillSelection(result,'burst'),null);
 result.liteSkillPaths.burst=null;
 result=transition(result,{type:'liteChooseSkillPath',skill:'burst',id:'heavy'},noCrit,NOW);
 assert.equal(result.liteSkillPaths.burst,null);
});
test('each successful skill cast gains usage and unlocks at 6, normal attack does not',()=>{
 let s=make();s=enemyTarget(s);
 // Actual isolated training does not farm progression.
 s=transition(s,{type:'skill',id:'burst'},noCrit,NOW);
 assert.equal(s.liteSkillUses.burst,0);
 s.trainingIsolated=false;
 s=normalize(s,NOW);
 s.enemy=loopEnemyFor(s.wave,s.activeMode,NOW);
 s.skillCooldowns.burst=0;
 s=transition(s,{type:'skill',id:'burst'},noCrit,NOW);
 assert.equal(s.liteSkillUses.burst,1);
 s.skillCooldowns.burst=0;s=transition(s,'attack',noCrit,NOW);
 assert.equal(s.liteSkillUses.burst,1);
 s.liteSkillUses.burst=5;s.skillCooldowns.burst=0;
 s=transition(s,{type:'skill',id:'burst'},noCrit,NOW);
 assert.equal(s.liteSkillUses.burst,6);
 assert.equal(s.last.skill,'burst');
});
test('clock-out skill specializations change burst damage and cooldown on same enemy',()=>{
 const src=enemyTarget(master('burst','heavy'));
 src.trainingIsolated=false;src.enemy=loopEnemyFor(1,'campaign',NOW);
 src.enemy.hp=15000;src.enemy.maxHp=15000;
 const heavy=transition(src,{type:'skill',id:'burst'},noCrit,NOW);
 const copy=JSON.parse(JSON.stringify(src));copy.liteSkillPaths.burst='quick';
 const quick=transition(copy,{type:'skill',id:'burst'},noCrit,NOW);
 assert.ok(heavy.last.damage>quick.last.damage,'heavy must increase real damage');
 assert.ok(heavy.skillCooldowns.burst>quick.skillCooldowns.burst,'quick must have shorter cooldown');
});
test('guard skill paths alter real incoming damage or reflect but cannot silently kill',()=>{
 const src=enemyTarget(master('guard','safe'));src.trainingIsolated=false;
 src.enemy=loopEnemyFor(1,'campaign',NOW);src.enemy.hp=500;src.enemy.maxHp=500;src.enemy.attack=20;
 const safe=transition(src,{type:'skill',id:'guard'},noCrit,NOW);
 const copy=JSON.parse(JSON.stringify(src));copy.liteSkillPaths.guard='counter';
 const counter=transition(copy,{type:'skill',id:'guard'},noCrit,NOW);
 assert.ok(safe.last.retaliationDamage<=counter.last.retaliationDamage);
 assert.ok((safe.last.guardRegen||0)>0);
 assert.ok((counter.last.reflected||0)>0);
 assert.ok(counter.enemy.hp>=1);
});
test('coffee skill path modifies healing vs damage in real combat',()=>{
 const src=enemyTarget(master('drain','brew'));src.trainingIsolated=false;
 src.enemy=loopEnemyFor(1,'campaign',NOW);src.enemy.hp=500;src.enemy.maxHp=500;src.heroHp=20;
 const brew=transition(src,{type:'skill',id:'drain'},noCrit,NOW);
 const copy=JSON.parse(JSON.stringify(src));copy.liteSkillPaths.drain='bitter';
 const bitter=transition(copy,{type:'skill',id:'drain'},noCrit,NOW);
 assert.ok(brew.last.damage<bitter.last.damage);
 assert.ok(brew.heroHp>bitter.heroHp);
});
test('eight unique legendary effects activate only when truly equipped at legendary rarity',()=>{
 assert.equal(LITE_LEGENDARIES.length,8);
 const s=make();s.liteInventory=[item('w-clockblade','epic',1),item('r-ticket','legendary',2)];
 s.liteLoadout={weapon:'li-1',armor:null,badge:null,relic:'li-2'};
 assert.deepEqual(liteLegendaryEffects(s).active,['r-ticket']);
 assert.ok(liteLegendaryEffects(s).clockoutMultiplier>1);
 s.liteInventory[0].rarity='legendary';
 assert.ok(liteLegendaryEffects(s).clockoutMultiplier>1.45);
 s.liteLoadout.weapon=null;
 assert.deepEqual(liteLegendaryEffects(s).active,['r-ticket']);
 assert.equal(liteLegendaryByTemplate('other'),null);
});
test('legendary clockout sword increases actual finisher damage, not just listed power',()=>{
 const source=make();source.liteActiveBuild='clockout';source.liteCombo=3;
 source.liteInventory=[item('w-clockblade','legendary',1)];
 source.liteLoadout={weapon:'li-1',armor:null,badge:null,relic:null};
 source.enemy=loopEnemyFor(1,'campaign',NOW);source.enemy.hp=15000;source.enemy.maxHp=15000;
 const powered=transition(source,'attack',noCrit,NOW);
 const weak=JSON.parse(JSON.stringify(source));weak.liteInventory[0].rarity='epic';
 const basic=transition(weak,'attack',noCrit,NOW);
 assert.ok(powered.last.damage>basic.last.damage);
 assert.ok(powered.last.buildDamage>basic.last.buildDamage);
});
test('legendary coffee staff boosts poison, bean boosts recovery',()=>{
 const s=make();s.liteActiveBuild='coffee';s.liteCombo=2;
 s.liteInventory=[item('w-cupstaff','legendary',1),item('r-bean','legendary',2)];
 s.liteLoadout={weapon:'li-1',armor:null,badge:null,relic:'li-2'};
 s.enemy=loopEnemyFor(1,'campaign',NOW);s.enemy.hp=10000;s.enemy.maxHp=10000;
 s.heroHp=30;
 const strong=transition(s,'attack',noCrit,NOW);
 const weak=JSON.parse(JSON.stringify(s));
 weak.liteInventory[0].rarity='epic';weak.liteInventory[1].rarity='epic';
 const regular=transition(weak,'attack',noCrit,NOW);
 assert.ok(strong.last.poisonDamage>regular.last.poisonDamage);
 assert.ok(strong.last.buildHeal>regular.last.buildHeal);
});
test('presets store TWO snapshots only; old saves keep empty safe slots',()=>{
 const empty=normalize(make(),NOW);
 assert.deepEqual(empty.litePresets,[null,null]);
 assert.deepEqual(liteNormalizePresets(null,[]),[null,null]);
 const s=make();s.liteActiveBuild='clockout';s.liteInventory=[item('w-clockblade','rare',1)];
 s.liteLoadout={weapon:'li-1',armor:null,badge:null,relic:null};
 const shot=liteSavePresetSnapshot(s,0);
 assert.equal(shot.loadout.weapon,'li-1');
 assert.equal(shot.build,'clockout');
 s.litePresets[0]=shot;
 const reloaded=normalize(JSON.parse(JSON.stringify(s)),NOW);
 assert.equal(reloaded.litePresets[0].loadout.weapon,'li-1');
 assert.equal(reloaded.litePresets.length,2);
});
test('loading a preset restores equipment and career without spending gold',()=>{
 let s=make();s.liteInventory=[item('w-clockblade','rare',1),item('w-cupstaff','rare',2)];
 s.liteActiveBuild='clockout';s.liteLoadout={weapon:'li-1',armor:null,badge:null,relic:null};
 s.gold=500;
 s=transition(s,{type:'liteSavePreset',index:0},noCrit,NOW);
 s=transition(s,{type:'liteChooseBuild',id:'coffee'},noCrit,NOW);
 s=transition(s,{type:'liteEquip',id:'li-2'},noCrit,NOW);
 s=transition(s,{type:'liteLoadPreset',index:0},noCrit,NOW);
 assert.equal(s.liteActiveBuild,'clockout');assert.equal(s.liteLoadout.weapon,'li-1');
 assert.equal(s.gold,500);assert.equal(s.liteInventory.length,2);
});
test('presets cannot resurrect salvaged items or invent skill choices before unlock',()=>{
 let s=make();s.liteActiveBuild='coffee';s.liteInventory=[item('w-cupstaff','rare',1)];
 s.liteLoadout={weapon:'li-1',armor:null,badge:null,relic:null};
 s.liteSkillPaths.burst='heavy';
 s.litePresets[1]=liteSavePresetSnapshot(s,1);
 s.liteLoadout.weapon=null;
 s.liteInventory=[];
 s.liteSkillPaths.burst=null;
 s=transition(s,{type:'liteLoadPreset',index:1},noCrit,NOW);
 assert.equal(s.liteLoadout.weapon,null);
 assert.equal(s.liteSkillPaths.burst,null);
 assert.equal(s.liteInventory.length,0);
});
test('mastery-gated second branch cannot be bypassed by preset',()=>{
 let s=make();s.liteActiveBuild='clockout';s.litePresets[0]={name:'a',build:'clockout',
   loadout:{weapon:null,armor:null,badge:null,relic:null},
   branches:{clockout:'execute',coffee:'venom'},skillPaths:{burst:'heavy'}};
 s=transition(s,{type:'liteLoadPreset',index:0},noCrit,NOW);
 assert.equal(s.liteBuildBranch.clockout,'rush');
 s.liteBuildProgress.clockout=5;
 s=transition(s,{type:'liteLoadPreset',index:0},noCrit,NOW);
 assert.equal(s.liteBuildBranch.clockout,'execute');
});
test('optimizer recognizes active Legendary power, not rarity color alone',()=>{
 const s=make();s.liteActiveBuild='clockout';
 s.liteInventory=[item('w-clockblade','legendary',1),item('w-resign','legendary',2)];
 const a={weapon:'li-1',armor:null,badge:null,relic:null};
 const b={weapon:'li-2',armor:null,badge:null,relic:null};
 assert.ok(liteBuildScore(s,a,'speed',12)>0);
 assert.notEqual(liteBuildScore(s,a,'speed',12),liteBuildScore(s,b,'speed',12));
});
test('new save fields survive normalization; malicious values are clamped or rejected',()=>{
 const s=make();s.liteSkillUses={burst:Infinity,guard:-4,drain:999999999};
 s.liteSkillPaths={burst:'cheat',guard:'counter',drain:null};
 s.litePresets=[{name:'Fake',build:'hacker',loadout:{weapon:'li-8'}},
 {name:'Valid',build:'coffee',loadout:{weapon:'li-5'}}];
 const sane=normalize(s,NOW);
 assert.deepEqual(sane.liteSkillUses,{burst:0,guard:0,drain:1000000});
 assert.deepEqual(sane.liteSkillPaths,{burst:null,guard:'counter',drain:null});
 assert.equal(sane.litePresets[0],null);
 assert.equal(sane.litePresets[1].loadout.weapon,null);
});
