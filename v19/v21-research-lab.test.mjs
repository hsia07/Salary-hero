import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {RESEARCH_ROSTER,researchDefaultDraft,normalizeResearchDraft,
 researchToSquad,researchSnapshot,researchCompare,initV21ResearchLab} from './v21-research-lab.mjs';
import {analyzeLabBuild,simulateLabBattle} from './v21-build-lab.mjs';
const root=dirname(fileURLToPath(import.meta.url));
test('research prototype has 12 unique recruits and a six-unit default lineup',()=>{
 assert.equal(RESEARCH_ROSTER.length,12);
 assert.equal(new Set(RESEARCH_ROSTER.map(x=>x.id)).size,12);
 const d=researchDefaultDraft();
 assert.equal(d.slots.length,6);
 assert.equal(d.slots.filter(Boolean).length,6);
 assert.equal(researchToSquad(d).slots.filter(Boolean).length,6);
 assert.doesNotThrow(()=>initV21ResearchLab());
});
test('invalid selections and duplicate heroes are rejected without mutating input',()=>{
 const d=researchDefaultDraft();
 d.slots[1].id=d.slots[0].id;
 d.slots[2]={id:'injected-id',path:'anything'};
 d.imprints={'guard-a':'shield','fighter-a':'mecha','assassin-a':'arcane','mage-a':'shadow','medic-a':'night'};
 d.gear={'guard-a':'not-real','fighter-a':'toxic-ledger'};
 d.fusion='no-such-fusion';d.commanderPath='bad';d.enemy='not-an-enemy';d.seed=-10;d.ticks=100000;
 const before=JSON.stringify(d),result=normalizeResearchDraft(d);
 assert.equal(result.slots[1],null);
 assert.equal(result.slots[2],null);
 assert.equal(result.fusion,'');assert.equal(result.commanderPath,'strategist');
 assert.equal(result.enemy,'training-dummy');
 assert.equal(result.seed,1);assert.equal(result.ticks,200);
 assert.deepEqual(result.imprints,{'fighter-a':'mecha'});
 assert.deepEqual(result.gear,{'fighter-a':'toxic-ledger'});
 assert.equal(JSON.stringify(d),before);
});
test('research imprint, actual fusion and equipment drive different simulator events',()=>{
 const draft=researchDefaultDraft();
 const base=researchSnapshot(draft);
 const normal=simulateLabBattle(base.squad,{...base.options,enemy:draft.enemy,seed:72,ticks:90});
 draft.imprints['medic-a']='mecha';
 draft.gear['engineer-a']='machine-manual';
 draft.fusion='perpetual-overtime';
 const snapshot=researchSnapshot(draft);
 const build=analyzeLabBuild(snapshot.squad,snapshot.options);
 assert.equal(build.fusion.id,'perpetual-overtime');
 const variant=simulateLabBattle(snapshot.squad,{...snapshot.options,enemy:draft.enemy,seed:72,ticks:90});
 assert.ok(variant.metrics.summonDamage>normal.metrics.summonDamage);
 assert.ok(variant.byUnit.some(x=>x.id==='engineer-a'&&x.gearHits>0));
});
test('A/B comparison reuses same enemy and random seeds with five honest reports',()=>{
 const baseline=researchDefaultDraft();
 const alternative=researchDefaultDraft();
 alternative.fusion='perpetual-overtime';alternative.imprints['medic-a']='mecha';
 alternative.gear['engineer-a']='machine-manual';
 const before=JSON.stringify(alternative);
 const a=researchSnapshot(baseline),b=researchSnapshot(alternative);
 const compared=researchCompare(a,b,{enemy:'anti-summon',seed:35,ticks:90,samples:5});
 assert.equal(compared.samples,5);assert.equal(compared.enemy,'anti-summon');
 assert.ok(compared.A.wins>=0&&compared.A.wins<=5);
 assert.ok(compared.B.wins>=0&&compared.B.wins<=5);
 assert.notEqual(compared.A.avgSummon,compared.B.avgSummon);
 assert.deepEqual(compared,researchCompare(a,b,{enemy:'anti-summon',seed:35,ticks:90,samples:5}));
 assert.equal(JSON.stringify(alternative),before);
});
test('research UI is actually linked inside game, not a screenshot; live salary and autosave remain separate',()=>{
 const h=readFileSync(resolve(root,'play.html'),'utf8');
 const app=readFileSync(resolve(root,'app.mjs'),'utf8');
 const css=readFileSync(resolve(root,'v21-research-lab.css'),'utf8');
 assert.match(h,/data-panel="research"/);
 assert.match(h,/v21-research-lab\.css/);
 assert.match(app,/v21-research-lab\.mjs/);
 assert.match(app,/labUI\.mount\(body\)/);
 assert.match(app,/currentPanel!=='research'/);
 for(const id of ['today','pay-month','gold','world','town-cat','attack']){
  assert.equal((h.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(css,/#panel:has\(\.v21-research-lab\)/);
 const source=readFileSync(resolve(root,'v21-research-lab.mjs'),'utf8');
 assert.doesNotMatch(source,/\blocalStorage\b|\btransition\(/);
});
