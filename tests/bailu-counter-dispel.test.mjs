import test from 'node:test';
import assert from 'node:assert/strict';
import {createFormationBattle,tickFormationBattle} from '../v19/formation-combat-runtime.mjs';
const u=(id,role,extra={})=>({id,role,hp:100,maxHp:100,attack:20,row:'front',lane:1,attackInterval:1,...extra});
test('白律驅散：攻擊前解除目標護盾與增益，負面狀態保留',()=>{
 const s=createFormationBattle({allies:[u('bailu','caster',{dispelPower:1,dispelInterval:8})],
  enemies:[u('boss','tank',{shield:40,attack:1,attackInterval:99,cooldown:99,statuses:[{type:'enrage',duration:5},{type:'poison',duration:5,power:1}]})]});
 const n=tickFormationBattle(s,.1);
 const d=n.events.find(e=>e.type==='dispel');
 assert.ok(d);assert.equal(d.removedShield,40);assert.deepEqual(d.removedStatuses,['enrage']);
 const boss=n.enemies[0];
 assert.equal(boss.shield,0);assert.equal(boss.hp,80);
 assert.ok(boss.statuses.some(x=>x.type==='poison'));assert.ok(!boss.statuses.some(x=>x.type==='enrage'));
});
test('驅散有冷卻：冷卻中不再解除新護盾',()=>{
 let s=createFormationBattle({allies:[u('bailu','caster',{dispelPower:1,dispelInterval:8})],enemies:[u('boss','tank',{shield:10,hp:500,maxHp:500,attack:1,attackInterval:99,cooldown:99})]});
 s=tickFormationBattle(s,.1);
 s={...s,enemies:s.enemies.map(e=>({...e,shield:30}))};
 for(let i=0;i<12;i++)s=tickFormationBattle(s,.1);
 assert.equal(s.events.filter(e=>e.type==='dispel').length,0);
 assert.ok(s.enemies[0].shield<30);
});
test('沒有驅散能力的單位不會解除護盾（既有行為不變）',()=>{
 const n=tickFormationBattle(createFormationBattle({allies:[u('hero','melee')],enemies:[u('boss','tank',{shield:15,attack:1,attackInterval:99,cooldown:99})]}),.1);
 assert.ok(!n.events.some(e=>e.type==='dispel'));assert.equal(n.events[0].blocked,15);
});
test('白律反擊：被攻擊且存活時回擊攻擊者，倍率依 counter',()=>{
 const s=createFormationBattle({allies:[u('bailu','caster',{counter:.5,attack:30,attackInterval:99,cooldown:99})],enemies:[u('grunt','melee',{attack:10})]});
 const n=tickFormationBattle(s,.1);
 const c=n.events.find(e=>e.type==='counter');
 assert.ok(c);assert.equal(c.actorId,'bailu');assert.equal(c.targetId,'grunt');assert.equal(c.damage,15);
 assert.equal(n.enemies[0].hp,85);
});
test('反擊冷卻內不重複觸發，且被擊倒時不反擊',()=>{
 let s=createFormationBattle({allies:[u('bailu','caster',{counter:.5,counterInterval:1.5,attackInterval:99,cooldown:99})],enemies:[u('grunt','melee',{attack:10,attackInterval:.3,hp:1000,maxHp:1000})]});
 for(let i=0;i<10;i++)s=tickFormationBattle(s,.1);
 // 1 秒內敵人打了 4 次，反擊只會在 0 秒觸發一次
 assert.equal(s.allies[0].hp,60);
 const dead=tickFormationBattle(createFormationBattle({allies:[u('bailu','caster',{counter:.5,hp:5,attackInterval:99,cooldown:99})],enemies:[u('grunt','melee',{attack:10})]}),.1);
 assert.ok(!dead.events.some(e=>e.type==='counter'));
});
test('白律大招：能量滿 → 單體大傷害、解除全部護盾與增益、能量歸零',()=>{
 const s=createFormationBattle({allies:[u('bailu','caster',{energy:100,attack:20,ultimate:{multiplier:4,name:'終審判決'}})],
  enemies:[u('boss','tank',{hp:500,maxHp:500,boss:true,shield:30,attack:1,attackInterval:99,cooldown:99,statuses:[{type:'enrage',duration:5},{type:'fortify',duration:5},{type:'poison',duration:5,power:1}]}),
           u('grunt','melee',{hp:50,maxHp:50,attack:1,attackInterval:99,cooldown:99})]});
 const n=tickFormationBattle(s,.1);
 const e=n.events.find(x=>x.type==='ultimate');
 assert.ok(e);assert.equal(e.targetId,'boss');assert.equal(e.removedShield,30);assert.deepEqual(e.removedStatuses.sort(),['enrage','fortify']);
 assert.equal(e.damage,80);assert.equal(n.enemies[0].hp,420);assert.equal(n.allies[0].energy,0);
 assert.ok(n.enemies[0].statuses.some(x=>x.type==='poison'));
});
test('能量未滿時不放大招，照常普攻並累積能量',()=>{
 const n=tickFormationBattle(createFormationBattle({allies:[u('bailu','caster',{energy:50,ultimate:{multiplier:4}})],enemies:[u('boss','tank',{attack:1,attackInterval:99,cooldown:99})]}),.1);
 assert.ok(!n.events.some(x=>x.type==='ultimate'));assert.equal(n.allies[0].energy,58);
});
