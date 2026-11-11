import test from 'node:test';
import assert from 'node:assert/strict';
import {LAB_TRAITS,LAB_IMPRINT_CAP,LAB_FUSIONS,LAB_GEAR,LAB_ENEMIES,
 analyzeLabBuild,simulateLabBattle,compareLabBuilds} from './v21-build-lab.mjs';

const squad={
 commanderPath:'strategist',
 slots:[
 {id:'guard',job:'sentinel',path:'bulwark',level:7,stars:2},
 {id:'fighter',job:'fighter',path:'duelist',level:7,stars:2},
 {id:'assassin',job:'assassin',path:'poison',level:7,stars:2},
 {id:'mage',job:'mage',path:'fire',level:7,stars:2},
 {id:'medic',job:'medic',path:'barrier',level:7,stars:2},
 {id:'engineer',job:'engineer',path:'turret',level:7,stars:2}
 ]};
const opts={enemy:'training-dummy',seed:72,ticks:80};
test('build research catalog: six six-person synergy fusions, imprint and enemy counter inventories',()=>{
 assert.equal(LAB_TRAITS.length,7);
 assert.equal(LAB_FUSIONS.length,6);
 assert.equal(LAB_GEAR.length,5);
 assert.equal(LAB_ENEMIES.length,5);
 assert.equal(LAB_IMPRINT_CAP,2);
 for(const fusion of LAB_FUSIONS)assert.equal(new Set(fusion.traits).size,2);
});
test('imprints change effective traits but do not mutate old squad / duplicate a native trait',()=>{
 const copy=JSON.stringify(squad);
 const base=analyzeLabBuild(squad);
 assert.equal(base.counts.office,4);
 assert.equal(base.counts.mecha,1);
 const imprint=analyzeLabBuild(squad,{imprints:{medic:'mecha',mage:'shadow',assassin:'night'},fusion:'perpetual-overtime'});
 assert.equal(imprint.imprintTotal,2);
 assert.equal(imprint.counts.mecha,2);
 assert.equal(imprint.counts.shadow,2);
 assert.equal(imprint.fusion.id,'perpetual-overtime');
 assert.deepEqual(imprint.suppressed,['office','mecha']);
 assert.equal(imprint.imprints.guard,undefined);
 // Oversubscribed imprints must NOT silently grant a third tag; the current
 // stable rule accepts at most two valid choices in existing team-slot order.
 const capped=analyzeLabBuild(squad,{imprints:{guard:'night',mage:'shadow',medic:'mecha'}});
 assert.equal(capped.imprintTotal,2);
 assert.equal(capped.imprints.guard,'night');
 assert.equal(capped.imprints.mage,'shadow');
 assert.equal(capped.imprints.medic,undefined);
 assert.equal(JSON.stringify(squad),copy);
 const invalid=analyzeLabBuild(squad,{imprints:{guard:'shield',mage:'???',medic:'office'},fusion:'perpetual-overtime'});
 assert.equal(invalid.imprintTotal,0);
 assert.equal(invalid.fusion,null);
 assert.equal(invalid.blockedFusion,'perpetual-overtime');
});
test('all six fusion formulas can be activated with at most two imprints in six playable slots',()=>{
 const examples=[
  ['perpetual-overtime',{medic:'mecha'}],
  ['midnight-pact',{mage:'shadow'}],
  ['aegis-circuit',{medic:'shield'}],
  ['coffee-automation',{}],
  ['phantom-factory',{medic:'mecha',fighter:'shadow'}],
  ['celestial-engine',{medic:'mecha',assassin:'myth'}]
 ];
 for(const [fusion,imprints] of examples){
  const x=analyzeLabBuild(squad,{fusion,imprints});
  assert.equal(x.fusion?.id,fusion,JSON.stringify({fusion,counts:x.counts}));
  assert.ok(x.imprintTotal<=2);
 }
});
test('fusion and gear actually change deterministic battle results, not just a passive label',()=>{
 const vanilla=simulateLabBattle(squad,opts);
 const fused=simulateLabBattle(squad,{...opts,fusion:'perpetual-overtime',imprints:{medic:'mecha'}});
 const hybrid=simulateLabBattle(squad,{...opts,fusion:'perpetual-overtime',imprints:{medic:'mecha'},gear:{engineer:'machine-manual'}});
 assert.equal(vanilla.fusion,null);
 assert.equal(fused.fusion,'perpetual-overtime');
 assert.ok(fused.metrics.summonDamage>vanilla.metrics.summonDamage,'fusion drives real extra summons');
 assert.ok(hybrid.byUnit.find(x=>x.id==='engineer').gearHits>0,'gear modifies actual attacks');
 assert.ok(hybrid.metrics.summonDamage>fused.metrics.summonDamage,'equipment plus fusion generate additional summon attacks');
 assert.deepEqual(simulateLabBattle(squad,{...opts,fusion:'perpetual-overtime',imprints:{medic:'mecha'}}),fused,'seeded combat is perfectly reproducible');
});
test('enemy counter profiles matter and poison-auditor punishes poisoning',()=>{
 const gear={assassin:'toxic-ledger'};
 const dummy=simulateLabBattle(squad,{...opts,gear});
 const purifier=simulateLabBattle(squad,{...opts,gear,enemy:'poison-auditor'});
 assert.ok(dummy.metrics.poisonDamage>0);
 assert.ok(purifier.metrics.poisonDamage<dummy.metrics.poisonDamage,'purge directly counters poison stack value');
 const summoner=simulateLabBattle(squad,{...opts,gear:{engineer:'machine-manual'},enemy:'training-dummy'});
 const dismantler=simulateLabBattle(squad,{...opts,gear:{engineer:'machine-manual'},enemy:'anti-summon'});
 assert.ok(dismantler.metrics.summonDamage<summoner.metrics.summonDamage,'anti-summon elite counters summon equipment');
});
test('three commander professions actually affect the fight without any salary accounting',()=>{
 const alternatives=['overtime','strategist','logistics'].map(commanderPath=>
  simulateLabBattle({...squad,commanderPath},{...opts,enemy:'endurance-boss',ticks:90})
 );
 assert.ok(alternatives.every(x=>x.metrics.commanderCasts>0),'all paths charge and cast');
 assert.ok(new Set(alternatives.map(x=>JSON.stringify([x.enemyHp,x.alive,x.metrics.healing,x.metrics.shieldGiven]))).size>1,
   'commander skills have different outcomes');
});
test('simulator remains bounded and non-mutating on adversarial inputs',()=>{
 const before=JSON.stringify(squad);
 const run=simulateLabBattle(squad,{enemy:'__no_such_enemy__',seed:3,ticks:1000000,
   fusion:'midnight-pact',imprints:{mage:'shadow'},gear:{assassin:'toxic-ledger'}});
 assert.equal(JSON.stringify(squad),before);
 assert.ok(run.ticks<=240);
 assert.ok(run.metrics.maxEventsPerTick<=28);
 assert.ok(Number.isFinite(run.enemyHp)&&run.enemyHp>=0);
 assert.ok(run.byUnit.every(x=>x.hp>=0&&x.shield>=0&&x.maxHp>=x.hp));
 assert.ok(run.events.length<=80);
 assert.ok(['team','enemy','timeout'].includes(run.result));
 const invalid=simulateLabBattle(null,{ticks:20});
 assert.equal(invalid.alive,0);
 assert.equal(invalid.result,'enemy');
});
test('comparison report supports same-seed controlled build research with an explicit twelve-build ceiling',()=>{
 const a=compareLabBuilds(Array.from({length:15},(_,i)=>({
  title:'方案 '+i,squad,options:i%2===0?{}:{fusion:'perpetual-overtime',imprints:{medic:'mecha'}}
 })),opts);
 assert.equal(a.length,12);
 assert.equal(a[0].index,0);
 assert.equal(a[1].fusion,'perpetual-overtime');
 assert.notEqual(a[0].metrics.summonDamage,a[1].metrics.summonDamage);
});
