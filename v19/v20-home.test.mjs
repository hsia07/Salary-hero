import test from 'node:test';
import assert from 'node:assert/strict';
import {initial} from './engine.mjs';
import {v20StageProgress,v20LootVisual} from './v20-home.mjs';

test('V20 wave beads represent the actual live four-wave cycle',()=>{
 for(const [wave,completed] of [[1,0],[2,1],[3,2],[4,3],[5,0],[8,3],[9,0],[101,0]]){
  const s={...initial(),wave};
  const result=v20StageProgress(s);
  assert.equal(result.cleared,completed,'wave '+wave);
  assert.equal(result.activeOrb,completed,'active wave '+wave);
  assert.equal(result.wave,wave);
 }
});
test('V20 tracker uses actual selected mode and enemy tier, without fake stars',()=>{
 const s=initial();s.wave=4;s.enemy.tier='boss';s.activeMode='dungeon';
 assert.deepEqual([v20StageProgress(s).mode,v20StageProgress(s).tier,v20StageProgress(s).activeOrb],['每日副本','boss',3]);
 s.activeMode='tower';s.enemy.tier='elite';
 assert.deepEqual([v20StageProgress(s).mode,v20StageProgress(s).tier],['無限之塔','elite']);
 s.activeMode='campaign';s.enemy.tier='normal';
 assert.equal(v20StageProgress(s).mode,'辦公室遠征');
});
test('V20 loot and chest buttons reflect real counts, never invent a payout',()=>{
 const s=initial();
 s.wave=28;s.pendingDrops=[{id:'loot1'},{id:'loot2'}];s.chests=3;s.petLevel=11;
 const before=JSON.stringify(s);
 const v=v20StageProgress(s);
 assert.equal(v.dropCount,2);
 assert.equal(v.chests,3);
 assert.equal(v.petLevel,11);
 assert.equal(JSON.stringify(s),before,'UI state accessor must be pure');
});
test('V20 old saves are safe, invalid or infinite values never leak into the HUD',()=>{
 const v=v20StageProgress({wave:Infinity,chests:-99,petLevel:null,pendingDrops:null});
 assert.equal(v.wave,1);assert.equal(v.chests,0);assert.equal(v.dropCount,0);
 assert.equal(v.petLevel,1);
 const v2=v20StageProgress({wave:'23',chests:'8',petLevel:'7',pendingDrops:[1]});
 assert.deepEqual([v2.wave,v2.chests,v2.petLevel,v2.dropCount],[23,8,7,1]);
});
test('V20 keeps completed-wave tracker independent from salary and currencies',()=>{
 const s=initial();s.wave=24;s.gold=1000;s.gems=42;s.petFood=9;s.chests=2;
 const before=structuredClone(s);
 v20StageProgress(s);
 assert.deepEqual(s,before);
});

test('V20 actual loot sprite tracks real item metadata without fake payouts',()=>{
 const items=[
 ['briefcase','worn-briefcase.svg','common'],
 ['laptop','enchanted-laptop.svg','rare'],
 ['notice','resignation-scroll.svg','epic'],
 ['excalibur','legend-blade.svg','legendary']
 ];
 for(const [id,art,tier] of items){
  const state={pendingDrops:[id]};
  const before=JSON.stringify(state);
  const result=v20LootVisual(state);
  assert.equal(result.id,id);
  assert.equal(result.art,art);
  assert.equal(result.tier,tier);
  assert.equal(result.count,1);
  assert.equal(JSON.stringify(state),before);
 }
 assert.deepEqual(v20LootVisual({pendingDrops:[]}),{
  id:'none',name:'裝備',tier:'none',art:'worn-briefcase.svg',count:0
 });
 assert.equal(v20LootVisual({pendingDrops:['evil/../../file.svg']}).art,'worn-briefcase.svg');
 assert.equal(v20LootVisual({pendingDrops:[{id:'laptop'},'notice']}).count,2);
});
