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

import {HERO_STYLES,ALL_ENEMIES,COMMON_ENEMIES,BOSSES} from './roster.mjs';
import {enemyFor,playerTitle,cleanPlayerName} from './engine.mjs';

test('nicknames use the chosen name and persist into the role prefix',()=>{
 const named=transition(initial(),{type:'setName',value:'小行星'});
 assert.equal(named.playerName,'小行星');
 assert.equal(playerTitle(named),'平凡社畜・小行星');
 assert.equal(playerTitle(normalize(JSON.parse(JSON.stringify(named)))),'平凡社畜・小行星');
});
test('nickname trimming, Unicode code points and empty rename protection',()=>{
 const input='  '+Array.from({length:14},()=> '𠮷').join('')+'  ';
 assert.equal(Array.from(cleanPlayerName(input)).length,12);
 assert.equal(cleanPlayerName('   '),'');
 const named=transition(initial(),{type:'setName',value:'小行星'});
 assert.equal(transition(named,{type:'setName',value:'   '}).playerName,'小行星');
});
test('expanded appearance concepts represent office men, women, monsters, robots and aliens',()=>{
 assert.equal(HERO_STYLES.length,16);
 for(const family of ['男性職員','女性職員','怪物','機器人','外星人'])
   assert.ok(HERO_STYLES.some(x=>x.family===family));
});
test('style favorites change save state without falsely equipping unapproved art',()=>{
 const s=transition(initial(),{type:'toggleFavoriteStyle',id:'alien'});
 assert.deepEqual(s.styleWishlist,['alien']);
 assert.deepEqual(normalize(s).styleWishlist,['alien']);
 assert.deepEqual(transition(s,{type:'toggleFavoriteStyle',id:'alien'}).styleWishlist,[]);
 assert.equal(s.equipped,'briefcase');
});
test('24 monster identities with deterministic rotating types and bosses every 4 waves',()=>{
 assert.equal(COMMON_ENEMIES.length,16);assert.equal(BOSSES.length,8);
 assert.equal(new Set(ALL_ENEMIES.map(e=>e.id)).size,24);
 assert.equal(new Set(ALL_ENEMIES.map(e=>e.name)).size,24);
 const seen=new Set(Array.from({length:100},(_,n)=>enemyFor(n+1).typeId));
 assert.equal(seen.size,24);
 for(let i=1;i<=80;i++)assert.equal(enemyFor(i).boss,i%4===0);
});
test('shield enemy actually mitigates damage',()=>{
 const a=initial();
 a.wave=2;a.enemy=enemyFor(2); // wave 2 is the guarded file crab
 const b=transition(a,'attack',()=>.9);
 assert.equal(a.enemy.hp-b.enemy.hp,Math.round(18*.75));
});
test('healing enemy actually restores HP between turns',()=>{
 const a=initial();a.wave=10;a.enemy=enemyFor(10); // coffee mimic has real leech trait
 const b=transition(a,'attack',()=>.9);
 assert.ok(b.enemy.hp>a.enemy.hp-18);
 assert.ok(b.enemy.hp<=a.enemy.maxHp);
});
test('defeated enemy species unlock in persistent bestiary',()=>{
 const a=initial();a.enemy={...enemyFor(1),hp:1};
 const b=transition(a,'attack',()=>.9);
 assert.ok(b.defeatedTypes.includes(a.enemy.typeId));
 assert.ok(normalize(b).defeatedTypes.includes(a.enemy.typeId));
});
test('weekly salary returns a finite amount on scheduled workday',()=>{
 const monday=Date.parse('2026-11-09T02:00:00Z'); // 10 AM Taiwan
 const p=salaryAt(monday,40000);
 assert.ok(Number.isFinite(p.today)&&p.today>0);
 assert.ok(Number.isFinite(p.week)&&p.week>=p.today);
 assert.ok(Number.isFinite(p.month)&&p.month>=p.today);
});

test('rage enemy deals more retaliation damage than its base attack',()=>{
 const a=initial();a.wave=5;a.enemy=enemyFor(5);
 const b=transition(a,'attack',()=>.9);
 assert.ok(a.heroHp-b.heroHp>a.enemy.attack);
});
