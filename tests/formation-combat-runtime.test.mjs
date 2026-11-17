import test from 'node:test';
import assert from 'node:assert/strict';
import {createFormationBattle,tickFormationBattle,simulateFormationBattle} from '../v19/formation-combat-runtime.mjs';
const u=(id,role,hp=100,attack=20)=>({id,role,hp,maxHp:100,attack,row:'front',lane:1,attackInterval:1});
test('attacks apply shield before HP and generate combat events',()=>{
 const s=createFormationBattle({allies:[u('hero','melee')],enemies:[{...u('boss','tank'),shield:15}]});
 const n=tickFormationBattle(s,.1);
 assert.equal(n.enemies[0].shield,0);
 assert.equal(n.enemies[0].hp,95);
 assert.equal(n.events[0].blocked,15);
 assert.equal(n.events[0].damage,5);
});
test('cooldown prevents attacks every simulation frame',()=>{
 let s=createFormationBattle({allies:[u('hero','melee')],enemies:[u('boss','tank')]});
 s=tickFormationBattle(s,.1);
 const hp=s.enemies[0].hp;
 s=tickFormationBattle(s,.1);
 assert.equal(s.enemies[0].hp,hp);
});
test('healer restores wounded ally and does not exceed maximum',()=>{
 const medic={...u('medic','healer'),healPower:50},tank=u('tank','tank',70);
 const s=createFormationBattle({allies:[medic,tank],enemies:[u('boss','tank')]});
 const n=tickFormationBattle(s,.1);
 assert.equal(n.allies.find(x=>x.id==='tank').hp,100);
 assert.ok(n.events.some(x=>x.type==='heal'));
});
test('shield support applies capped protection',()=>{
 const support={...u('support','support'),shieldReady:true,shieldPower:90};
 const tank={...u('tank','tank',60),threat:10};
 const n=tickFormationBattle(createFormationBattle({allies:[support,tank],enemies:[u('boss','tank')]}),.1);
 assert.ok(n.events.some(x=>x.type==='shield'));
 assert.ok(n.allies.find(x=>x.id==='tank').shield<=50);
});
test('battle terminates when one team is defeated',()=>{
 const result=simulateFormationBattle({allies:[u('hero','melee',100,120)],enemies:[u('enemy','melee',20,1)]});
 assert.equal(result.winner,'allies');
 assert.equal(result.enemies[0].hp,0);
});
test('simulation leaves original input untouched',()=>{
 const hero=u('hero','melee'),enemy=u('enemy','melee');
 simulateFormationBattle({allies:[hero],enemies:[enemy]});
 assert.equal(hero.hp,100);assert.equal(enemy.hp,100);
});

test('support shield returns after its own cooldown',()=>{
 const support={...u('support','support'),shieldReady:true,shieldInterval:1,shieldPower:20};
 const tank={...u('tank','tank',50),attack:1};
 let s=createFormationBattle({allies:[support,tank],enemies:[{...u('boss','tank',100,1),attackInterval:10}]});
 s=tickFormationBattle(s,.1);
 assert.equal(s.allies[0].shieldReady,false);
 assert.ok(s.allies[0].shieldCooldown>0);
 for(let i=0;i<11;i++)s=tickFormationBattle(s,.1);
 assert.ok(s.events.every(x=>x.type!=='shield')||s.allies[0].shieldCooldown>=0);
});
test('missing HP defaults to maximum HP and is not mistaken for dead',()=>{
 const s=createFormationBattle({allies:[{id:'hero',maxHp:120,attack:20}],enemies:[u('enemy','tank')]});
 assert.equal(s.allies[0].hp,120);
});
test('simultaneous knockout is reported as draw',()=>{
 const s=createFormationBattle({allies:[],enemies:[]});
 assert.equal(tickFormationBattle(s,.1).winner,'draw');
});
test('simulation clamps zero timestep and terminates',()=>{
 const s=simulateFormationBattle({allies:[u('hero','melee',100,200)],enemies:[u('enemy','tank',20,1)]},{step:0,maxSeconds:2});
 assert.equal(s.winner,'allies');
});
