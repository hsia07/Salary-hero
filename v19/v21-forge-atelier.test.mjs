import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {V21_FORGE_COST,V21_FORGE_MAX_LEVEL,v21ForgeViewModel,renderV21ForgeAtelier,v21ForgeInspect,v21ForgeSuccess} from './v21-forge-atelier.mjs';
const here=dirname(fileURLToPath(import.meta.url));
test('forge view depends exclusively on real upgraded state and real material costs',()=>{
 const state={forgeLevel:2,craftingMaterial:4,rareMaterials:1,equipped:'laptop'};
 const before=JSON.stringify(state),v=v21ForgeViewModel(state);
 assert.equal(v.canForge,true);assert.equal(v.bonus,4);assert.equal(v.nextBonus,6);
 assert.equal(v.weapon.name,'鋼鐵加班筆電');assert.deepEqual(V21_FORGE_COST,{material:3,ore:1});
 assert.equal(V21_FORGE_MAX_LEVEL,10);assert.equal(JSON.stringify(state),before);
 assert.equal(v21ForgeViewModel({...state,craftingMaterial:2}).canForge,false);
 assert.equal(v21ForgeViewModel({...state,rareMaterials:0}).canForge,false);
 assert.equal(v21ForgeViewModel({...state,forgeLevel:10}).canForge,false);
});
test('forge screen displays an original-painted environment plus actual weapon art, not duplicated currency',()=>{
 const html=renderV21ForgeAtelier({forgeLevel:3,craftingMaterial:8,rareMaterials:3,equipped:'excalibur'});
 assert.match(html,/smithy-diorama\.webp/);assert.match(html,/legend-blade\.svg/);
 assert.match(html,/鍛造升級至 \+4/);assert.match(html,/data-action="forge"/);
 assert.match(html,/data-forge-inspect/);assert.match(html,/v21-forge-sparks/);
 assert.equal((html.match(/class="is-complete"/g)||[]).length,3);
 assert.doesNotMatch(html,/id="today"|id="gold"|data-action="claim"/);
 const unavailable=renderV21ForgeAtelier({forgeLevel:10,craftingMaterial:900,rareMaterials:900});
 assert.match(unavailable,/已達最高鍛造等級/);assert.match(unavailable,/disabled/);
});
test('forge CSS has distinct flames, impact, sparks, weapon response and reduced-motion fallback',()=>{
 const css=readFileSync(resolve(here,'v21-forge-atelier.css'),'utf8');
 for(const t of ['v21-forge-furnace','v21-forge-impact','v21-forge-spark','v21-forge-weapon-rise','prefers-reduced-motion'])assert.ok(css.includes(t),t);
 const js=readFileSync(resolve(here,'app.mjs'),'utf8');
 assert.match(js,/renderV21ForgeAtelier/);assert.match(js,/v21ForgeSuccess/);
 assert.match(js,/case.*forge|act==='forge'/);
});
test('success effect never asserts an upgrade that did not actually happen',()=>{
 assert.equal(v21ForgeInspect(null),false);
 assert.equal(v21ForgeSuccess(null,1,1),false);
 assert.equal(v21ForgeSuccess(null,1,2),false);
});
