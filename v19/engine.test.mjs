import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,initial,normalize,transition,todayTW,salaryAt} from './engine.mjs';
import {shouldRecoil} from './hurt-timing.mjs';

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

import {HERO_STYLES,ALL_ENEMIES,COMMON_ENEMIES,ELITE_ENEMIES,BOSSES,tierForWave} from './roster.mjs';
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
test('32 unique monster species: 16 normal, 8 elite, 8 bosses on four-floor cadence',()=>{
 assert.equal(COMMON_ENEMIES.length,16);assert.equal(ELITE_ENEMIES.length,8);assert.equal(BOSSES.length,8);
 assert.equal(new Set(ALL_ENEMIES.map(e=>e.id)).size,32);
 assert.equal(new Set(ALL_ENEMIES.map(e=>e.name)).size,32);
 const seen=new Set(Array.from({length:128},(_,n)=>enemyFor(n+1).typeId));
 assert.equal(seen.size,32);
 const order=['normal','normal','elite','boss'];
 for(let i=1;i<=128;i++){
   const expected=order[(i-1)%4],e=enemyFor(i);
   assert.equal(tierForWave(i),expected);
   assert.equal(e.tier,expected);
   assert.equal(e.boss,expected==='boss');
   assert.equal(e.elite,expected==='elite');
 }
});
test('elite monster is stronger, gives a guaranteed equipment drop and one gem',()=>{
 const elite=enemyFor(3),basic=enemyFor(2);
 assert.ok(elite.hp>basic.hp);assert.ok(elite.attack>basic.attack);
 const s=initial();s.wave=3;s.enemy={...elite,hp:1};s.gems=0;
 const win=transition(s,'attack',()=>.99);
 assert.equal(win.wave,4);assert.equal(win.enemy.tier,'boss');
 assert.equal(win.last.elite,true);assert.equal(win.last.tier,'elite');
 assert.equal(win.gems,1);assert.equal(win.pendingDrops.length,1);
 assert.ok(win.gold>12+3*4);
 assert.ok(win.defeatedTypes.includes(elite.typeId));
});
test('elite skill hits every third counterattack and survives save cycles',()=>{
 let s=initial();s.wave=3;s.enemy=enemyFor(3);
 for(let n=1;n<=3;n++){
   s=transition(s,'attack',()=>.9);
   assert.equal(s.enemy.turns,n);
   assert.equal(Boolean(s.last.enemySkill),n===3);
 }
 assert.equal(s.last.enemySkill,'菁英反制');
 assert.ok(s.last.retaliationDamage>s.enemy.attack);
 assert.equal(normalize(JSON.parse(JSON.stringify(s))).enemy.turns,3);
});
test('boss skill activates every fourth retaliation and remains stronger than previous elite',()=>{
 for(let w=4;w<=128;w+=4){
   assert.ok(enemyFor(w).maxHp>enemyFor(w-1).maxHp,'boss wave '+w+' is tougher than elite');
 }
 let s=initial();s.wave=4;s.enemy=enemyFor(4);
 for(let n=1;n<=4;n++){
   s=transition(s,'attack',()=>.9);
   assert.equal(Boolean(s.last.enemySkill),n===4);
 }
 assert.equal(s.last.enemySkill,'首領狂暴');
});
test('existing V19 save retains character/progress while adding elite metadata',()=>{
 const legacy=initial();legacy.wave=3;legacy.gold=246;legacy.playerName='社畜';
 legacy.enemy={...enemyFor(3),tier:undefined,elite:undefined,hp:20};
 const saved=normalize(JSON.parse(JSON.stringify(legacy)));
 assert.equal(saved.gold,246);assert.equal(saved.playerName,'社畜');
 assert.equal(saved.wave,3);assert.equal(saved.enemy.hp,20);
 assert.equal(saved.enemy.tier,'elite');assert.equal(saved.enemy.elite,true);
});
test('new players encounter the two illustrated characters in floor order',()=>{
 assert.equal(enemyFor(1).typeId,'paper-gremlin');
 assert.equal(enemyFor(2).typeId,'coffee-mimic');
 assert.equal(enemyFor(10).typeId,'file-crab'); // swapped, not removed
 assert.equal(enemyFor(3).tier,'elite');
 assert.equal(enemyFor(4).tier,'boss');
 assert.equal(enemyFor(5).typeId,'chair-golem'); // common security mech moved forward
 assert.equal(enemyFor(30).typeId,'alien-intern'); // displaced species retained
});
test('shield enemy actually mitigates damage',()=>{
 const a=initial();
 a.wave=10;a.enemy=enemyFor(10); // guarded crab retained in the rotation
 const b=transition(a,'attack',()=>.9);
 assert.equal(a.enemy.hp-b.enemy.hp,Math.round(18*.75));
});
test('healing enemy actually restores HP between turns',()=>{
 const a=initial();a.wave=2;a.enemy=enemyFor(2); // the evil coffee mimic has leech
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
 const a=initial();a.wave=30;a.enemy=enemyFor(30); // rage species displaced from floor 5, still in rotation
 const b=transition(a,'attack',()=>.9);
 assert.ok(a.heroHp-b.heroHp>a.enemy.attack);
});

test('real enemy retaliation records damage for hit flash but victory never flashes',()=>{
 const s=initial();s.heroHp=100;s.enemy={...s.enemy,hp:9999};
 const n=transition(s,'attack',()=>.9);
 assert.equal(n.last.type,'hit');
 assert.equal(n.last.retaliationDamage,100-n.heroHp);
 assert.ok(n.last.retaliationDamage>0);
 assert.equal(shouldRecoil(100,n.heroHp,n.last),true);
 const win=initial();win.enemy={...win.enemy,hp:1};
 const victor=transition(win,'attack',()=>.9);
 assert.equal(victor.last.type,'victory');
 assert.equal(shouldRecoil(win.heroHp,victor.heroHp,victor.last),false);
});
test('fatal retaliation still displays pain after instant auto-respawn',()=>{
 const s=initial();s.heroHp=1;s.enemy={...s.enemy,hp:9999};
 const n=transition(s,'attack',()=>.9);
 assert.equal(n.heroHp,n.maxHp);
 assert.equal(n.last.type,'hit');
 assert.equal(n.last.retaliationDamage,1);
 assert.equal(n.last.respawned,true);
 assert.equal(shouldRecoil(1,n.heroHp,n.last),true);
});
