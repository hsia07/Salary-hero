import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,initial,normalize,transition,todayTW,salaryAt} from './engine.mjs';

test('each attack mutates actual enemy HP and keeps salary separate',()=>{
 const start=initial(),after=transition(start,'attack',()=>0.4);
 assert.ok(after.enemy.hp<start.enemy.hp);
 assert.ok(after.gold>=0);
 assert.equal(start.enemy.hp,start.enemy.maxHp);
});
test('boss victory advances wave, grants chest and heals',()=>{
 let s=initial();s.wave=4;s.enemy={id:4,boss:true,name:'Boss',hp:1,maxHp:100,attack:10};s.heroHp=4;
 const after=transition(s,'attack',()=>0.8);
 assert.equal(after.wave,5);assert.ok(after.chests>=1);assert.equal(after.heroHp,after.maxHp);
});
test('shop purchase and equipment choice change damage and persist',()=>{
 let s=initial();s.gold=200;s=transition(s,{type:'buy',id:'laptop'});
 assert.equal(s.equipped,'laptop');assert.ok(s.owned.includes('laptop'));assert.equal(s.gold,110);
 assert.equal(normalize(JSON.parse(JSON.stringify(s))).equipped,'laptop');
});
test('daily encounter cannot mint reward more than once',()=>{
 const now=Date.parse('2026-11-09T03:00:00Z');
 let s=transition(initial(),'encounterStart',()=>0.5,now);
 assert.ok(s.encounterPending);const id=s.encounterPending;
 s=transition(s,{type:'encounterChoose',choice:0},()=>0.5,now);
 assert.equal(s.encounterPending,null);
 const gold=s.gold;
 s=transition(s,'encounterStart',()=>0.5,now);
 assert.equal(s.gold,gold);assert.equal(s.encounterPending,null);
 assert.equal(s.encounterHistory.length,1);
});
test('Taiwan payroll does not generate Sunday salary',()=>{
 const sun=Date.parse('2026-11-08T08:00:00Z');
 const p=salaryAt(sun,40000);
 assert.equal(p.on,false);assert.equal(p.today,0);assert.equal(todayTW(sun),'2026-11-08');
});
test('all equipment candidates have unique IDs',()=>assert.equal(new Set(ITEMS.map(x=>x.id)).size,ITEMS.length));
