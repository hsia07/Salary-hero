import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,normalize,transition,loopEnemyFor} from './engine.mjs';
import {LITE_ITEM_BASES,LITE_SLOTS,LITE_RARITIES,liteBase,liteCreateItem,liteNormalizeInventory,liteNormalizeLoadout,liteEquipmentStats,liteRollDrop,liteStatLine} from './lite-equipment.mjs';
const NOW=Date.parse('2026-11-10T09:00:00Z');
const fixed=(v)=>()=>v;
function item(id,rare='rare',seq=1,level=10){return liteCreateItem(id,rare,level,seq,fixed(.35));}
function loaded(items,loadout={}){
 const s=initial();s.liteInventory=items;s.liteItemSeq=items.length;s.liteLoadout={weapon:null,armor:null,badge:null,relic:null,...loadout};
 return normalize(s,NOW);
}
test('Lite has 30 unique item templates across exactly four slots',()=>{
 assert.equal(LITE_ITEM_BASES.length,30);
 assert.equal(new Set(LITE_ITEM_BASES.map(x=>x.id)).size,30);
 assert.deepEqual([...new Set(LITE_ITEM_BASES.map(x=>x.slot))].sort(),LITE_SLOTS.map(s=>s.id).sort());
 assert.equal(LITE_RARITIES.length,5);
});
test('RNG creates item instances with tier-based unique, legal affixes',()=>{
 for(let tier of LITE_RARITIES){
  const it=liteCreateItem('w-clockblade',tier.id,42,99,fixed(.37));
  assert.equal(it.instanceId,'li-99');assert.equal(it.rarity,tier.id);
  assert.equal(it.affixes.length,tier.affixes);
  assert.equal(new Set(it.affixes.map(x=>x.id)).size,tier.affixes);
  assert.ok(liteStatLine(it).includes('攻擊'));
 }
});
test('corrupted save cannot inject fake templates, duplicates, forged slot, tier or unsafe numeric buffs',()=>{
 const valid=item('a-coat','rare',7);
 const bad=[valid,{...valid},{...valid,instanceId:'../../bad'}, {...valid,instanceId:'li-8',templateId:'phantom'},
   {...valid,instanceId:'li-9',rarity:'mythical',affixes:[{id:'crit',value:9999},{id:'attack',value:-100}]}];
 const sane=liteNormalizeInventory(bad);
 assert.equal(sane.length,2);
 assert.equal(sane[1].rarity,'common');
 assert.equal(sane[1].affixes.length,0);
 assert.equal(liteNormalizeLoadout({weapon:'li-7',armor:'li-7'},sane).weapon,null);
 assert.equal(liteNormalizeLoadout({weapon:'li-7',armor:'li-7'},sane).armor,'li-7');
});
test('Old V19 save migrates without removing weapon, wage state or level',()=>{
 const s=initial();s.level=17;s.equipped='laptop';s.owned=['briefcase','laptop'];s.gold=802;s.baseMaxHp=undefined;
 delete s.liteInventory;delete s.liteLoadout;delete s.liteItemSeq;delete s.liteCombo;
 const migrated=normalize(s,NOW);
 assert.equal(migrated.level,17);assert.equal(migrated.equipped,'laptop');
 assert.equal(migrated.gold,802);assert.deepEqual(migrated.liteInventory,[]);
 assert.deepEqual(migrated.liteLoadout,{weapon:null,armor:null,badge:null,relic:null});
 assert.equal(migrated.baseMaxHp,110);
});
test('LITE equips in their own slot and survives JSON restart',()=>{
 let s=loaded([item('w-clockblade','rare',1),item('a-coat','rare',2),item('b-early','rare',3),item('r-ticket','rare',4)]);
 for(const id of ['li-1','li-2','li-3','li-4'])s=transition(s,{type:'liteEquip',id},fixed(.4),NOW);
 assert.deepEqual(s.liteLoadout,{weapon:'li-1',armor:'li-2',badge:'li-3',relic:'li-4'});
 assert.ok(s.maxHp>110);
 const reloaded=normalize(JSON.parse(JSON.stringify(s)),NOW);
 assert.deepEqual(reloaded.liteLoadout,s.liteLoadout);
 assert.equal(reloaded.maxHp,s.maxHp);
 assert.equal(reloaded.liteItemSeq,4);
});
test('equipping weapon changes actual attacks while legacy gear remains available',()=>{
 const baseline=loaded([item('w-clockblade','rare',1)]);
 const standard=transition(baseline,'attack',fixed(.9),NOW);
 const armed=transition(transition(baseline,{type:'liteEquip',id:'li-1'},fixed(.9),NOW),'attack',fixed(.9),NOW);
 assert.ok(armed.last.damage>standard.last.damage);
 assert.equal(armed.equipped,'briefcase');
});
test('two clockout items create exactly fifth-hit finisher, not after third hit',()=>{
 let s=loaded([item('w-stapler','rare',1),item('b-early','rare',2)],{weapon:'li-1',badge:'li-2'});
 assert.equal(liteEquipmentStats(s).clockout,true);
 const boss=loopEnemyFor(4,'dungeon',NOW);
 s.wave=4;s.modeWaves.campaign=4;
 // Long-lived training target while exercising the same battle logic.
 s.enemy={...boss,id:4,typeId:loopEnemyFor(4,'campaign',NOW).typeId,hp:10000,maxHp:10000,attack:1,trait:'none',tier:'normal',boss:false,elite:false};
 s.trainingIsolated=true;
 for(let i=1;i<=5;i++){
  s=transition(s,'attack',fixed(.999),NOW);
  assert.equal(Boolean(s.last?.finisher),i===5);
 }
});
test('two coffee items give lifesteal and fourth-hit HP recovery',()=>{
 let s=loaded([item('w-cupstaff','rare',1),item('r-mug','rare',2)],{weapon:'li-1',relic:'li-2'});
 assert.equal(liteEquipmentStats(s).coffee,true);
 assert.ok(liteEquipmentStats(s).lifeSteal>=.1);
 s.heroHp=20;
 s.enemy={...loopEnemyFor(1,'campaign',NOW),hp:10000,maxHp:10000,attack:1,trait:'none'};
 s.trainingIsolated=true;
 let increased=false;
 for(let i=0;i<4;i++){
  const before=s.heroHp;s=transition(s,'attack',fixed(.999),NOW);
  if(s.heroHp>before)increased=true;
 }
 assert.ok(increased);assert.equal(s.last.coffeeHeal,true);
});
test('armor can reduce actual retaliation without making guard buffs infinite',()=>{
 const shielded=loaded([item('a-heavy','epic',1),item('b-security','rare',2)],{armor:'li-1',badge:'li-2'});
 const bare=loaded([]);
 shielded.enemy.attack=20;bare.enemy.attack=20;
 const a=transition(shielded,'attack',fixed(.999),NOW),b=transition(bare,'attack',fixed(.999),NOW);
 assert.ok(a.last.retaliationDamage<b.last.retaliationDamage);
 assert.ok(a.heroHp>0);
});
test('salvage is prevented for equipped or locked gear and pays exactly once',()=>{
 let s=loaded([item('a-coat','rare',1),item('b-card','rare',2)],{armor:'li-1'});
 const before=s.gold;
 s=transition(s,{type:'liteSalvage',id:'li-1'},fixed(.4),NOW);
 assert.equal(s.liteInventory.length,2);assert.equal(s.gold,before);
 s=transition(s,{type:'liteLock',id:'li-2'},fixed(.4),NOW);
 s=transition(s,{type:'liteSalvage',id:'li-2'},fixed(.4),NOW);
 assert.equal(s.liteInventory.length,2);
 s=transition(s,{type:'liteLock',id:'li-2'},fixed(.4),NOW);
 s=transition(s,{type:'liteSalvage',id:'li-2'},fixed(.4),NOW);
 assert.equal(s.liteInventory.length,1);assert.ok(s.gold>before);
 const paid=s.gold;s=transition(s,{type:'liteSalvage',id:'li-2'},fixed(.4),NOW);
 assert.equal(s.gold,paid);
});
test('enemy victories produce actual independent loot instances and do not clone on reload',()=>{
 let s=initial();s.modeWaves.campaign=1;s.enemy={...loopEnemyFor(1,'campaign',NOW),hp:1};
 s=transition(s,'attack',fixed(.001),NOW);
 assert.equal(s.liteInventory.length,1);
 assert.equal(s.liteInventory[0].instanceId,'li-1');
 const after=normalize(JSON.parse(JSON.stringify(s)),NOW);
 assert.equal(after.liteInventory.length,1);
 s={...after,enemy:{...after.enemy,hp:1}};
 s=transition(s,'attack',fixed(.001),NOW);
 assert.equal(s.liteInventory.length,2);
 assert.deepEqual(s.liteInventory.map(it=>it.instanceId),['li-1','li-2']);
});
test('full inventory cannot leak instances or overwrite locked player items',()=>{
 let s=initial();
 for(let i=1;i<=120;i++)s.liteInventory.push(item('w-stapler','common',i));
 s.liteItemSeq=120;s.liteInventory[0].locked=true;
 const got=liteRollDrop(s,fixed(0),'boss',true);
 assert.equal(got,null);
 assert.equal(s.liteInventory.length,120);assert.equal(s.liteItemSeq,120);
 assert.equal(s.liteInventory[0].locked,true);
});
