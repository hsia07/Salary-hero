import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,ENCOUNTERS,encounterOutcome,autoEncounterChoice,initial,normalize,transition,todayTW,salaryAt} from './engine.mjs';
import {shouldRecoil} from './hurt-timing.mjs';

test('each attack mutates actual enemy HP and keeps salary separate',()=>{
 const start=initial(),after=transition(start,'attack',()=>0.4);
 assert.ok(after.enemy.hp<start.enemy.hp);
 assert.ok(after.gold>=0);
 assert.equal(start.enemy.hp,start.enemy.maxHp);
});
test('weekday dungeon boss clear grants chest and heals',()=>{
 const now=Date.parse('2026-11-10T08:00:00Z');
 let s=transition(initial(),{type:'mode',id:'dungeon'},()=>.8,now);
 s.modeWaves.dungeon=4;s.wave=4;s.enemy={...loopEnemyFor(4,'dungeon',now),hp:1};s.heroHp=4;
 const after=transition(s,'attack',()=>.8,now);
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
import {enemyFor,loopEnemyFor,playerTitle,cleanPlayerName} from './engine.mjs';

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
test('weekday dungeon stand-in elite is stronger, gives equipment and a gem',()=>{
 const now=Date.parse('2026-11-10T08:00:00Z');
 const elite=loopEnemyFor(3,'dungeon',now),basic=loopEnemyFor(2,'dungeon',now);
 assert.ok(elite.hp>basic.hp);assert.ok(elite.attack>=basic.attack);
 let s=transition(initial(),{type:'mode',id:'dungeon'},()=>.99,now);
 s.wave=3;s.modeWaves.dungeon=3;s.enemy={...elite,hp:1};
 const win=transition(s,'attack',()=>.99,now);
 assert.equal(win.wave,4);assert.equal(win.enemy.tier,'boss');
 assert.equal(win.last.elite,true);assert.equal(win.last.tier,'elite');
 assert.equal(win.gems,1);assert.equal(win.pendingDrops.length,1);
 assert.ok(win.defeatedTypes.includes(elite.typeId));
});
test('weekday dungeon elite counterattack every third turn survives saves',()=>{
 const now=Date.parse('2026-11-10T08:00:00Z');
 let s=transition(initial(),{type:'mode',id:'dungeon'},()=>.9,now);
 s.wave=3;s.modeWaves.dungeon=3;s.enemy=loopEnemyFor(3,'dungeon',now);
 for(let n=1;n<=3;n++){
   s=transition(s,'attack',()=>.9,now);
   assert.equal(s.enemy.turns,n);
   assert.equal(Boolean(s.last.enemySkill),n===3);
 }
 assert.equal(s.last.enemySkill,'菁英反制');
 assert.ok(s.last.retaliationDamage>s.enemy.attack);
 assert.equal(normalize(JSON.parse(JSON.stringify(s)),now).enemy.turns,3);
});
test('weekday dungeon boss stand-in stays stronger and uses four-turn special',()=>{
 const now=Date.parse('2026-11-10T08:00:00Z');
 for(let w=4;w<=40;w+=4)
   assert.ok(loopEnemyFor(w,'dungeon',now).maxHp>loopEnemyFor(w-1,'dungeon',now).maxHp);
 let s=transition(initial(),{type:'mode',id:'dungeon'},()=>.9,now);
 s.wave=4;s.modeWaves.dungeon=4;s.enemy=loopEnemyFor(4,'dungeon',now);
 for(let n=1;n<=4;n++){
   s=transition(s,'attack',()=>.9,now);
   assert.equal(Boolean(s.last.enemySkill),n===4);
 }
 assert.equal(s.last.enemySkill,'首領狂暴');
});
test('existing V19 campaign save retains name, rewards and wave',()=>{
 const legacy=initial();legacy.activeMode='campaign';legacy.modeWaves.campaign=3;
 legacy.wave=3;legacy.gold=246;legacy.playerName='社畜';
 legacy.enemy={...loopEnemyFor(3),hp:20};
 const saved=normalize(JSON.parse(JSON.stringify(legacy)));
 assert.equal(saved.gold,246);assert.equal(saved.playerName,'社畜');
 assert.equal(saved.wave,3);assert.equal(saved.enemy.hp,20);
 assert.equal(saved.enemy.tier,'normal');
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
test('guarded recycled enemy actually mitigates damage',()=>{
 const a=initial();a.modeWaves.campaign=3;a.wave=3;a.enemy=loopEnemyFor(3);
 const b=transition(a,'attack',()=>.9);
 assert.equal(a.enemy.hp-b.enemy.hp,Math.round(18*.75));
});
test('healing recycled enemy actually restores HP between turns',()=>{
 const a=initial();a.modeWaves.campaign=2;a.wave=2;a.enemy=loopEnemyFor(2);
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

test('rage recycled enemy deals more damage than base attack',()=>{
 const a=initial();a.modeWaves.campaign=4;a.wave=4;a.enemy=loopEnemyFor(4);
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

test('encounter roster now has 8 distinct fantasy-office stories and genuine risk/safe routes',()=>{
 assert.equal(ENCOUNTERS.length,8);
 assert.equal(new Set(ENCOUNTERS.map(x=>x.id)).size,8);
 assert.ok(ENCOUNTERS.some(x=>x.theme==='alien'));
 assert.ok(ENCOUNTERS.some(x=>x.theme==='myth'));
 assert.ok(ENCOUNTERS.some(x=>x.theme==='mecha'));
 for(const story of ENCOUNTERS){
  assert.ok(story.text.length>18);
  assert.equal(story.choices.length,2);
  assert.ok(story.choices.every(choice=>choice.note));
 }
});
test('risk outcome is deterministic and has different successful and failed loot',()=>{
 const e=ENCOUNTERS.find(x=>x.id==='alien-shuttle');
 const success=encounterOutcome(e,0,()=>0.1);
 const failure=encounterOutcome(e,0,()=>0.9);
 const safe=encounterOutcome(e,1,()=>{throw Error('safe choice must not roll RNG')});
 assert.equal(success.outcome,'success');
 assert.equal(success.gold,155);assert.equal(success.damage,0);
 assert.equal(failure.outcome,'failure');
 assert.equal(failure.damage,26);assert.equal(failure.gold,0);
 assert.equal(safe.outcome,'certain');assert.equal(safe.gold,53);
 assert.equal(encounterOutcome(e,900,()=>0.5),null);
});
test('daily risk failure applies real damage without killing hero or duplicating ticket',()=>{
 const now=Date.parse('2026-11-14T08:00:00Z');
 const event=ENCOUNTERS.find(x=>x.id==='alien-shuttle');
 const start=initial();start.heroHp=8;start.encounterDay=todayTW(now);start.encounterPending=event.id;
 const fail=transition(start,{type:'encounterChoose',choice:0},()=>0.95,now);
 assert.equal(fail.heroHp,1);
 assert.equal(fail.skinTickets,1);
 assert.equal(fail.encounterPending,null);
 assert.equal(fail.last.outcome,'failure');
 assert.equal(fail.encounterHistory[0].outcome,'failure');
 const repeated=transition(fail,{type:'encounterChoose',choice:1},()=>0.02,now);
 assert.equal(repeated.gold,fail.gold);
 assert.equal(repeated.skinTickets,1);
 assert.equal(repeated.encounterHistory.length,1);
 assert.deepEqual(normalize(JSON.parse(JSON.stringify(fail))).encounterHistory,fail.encounterHistory);
});
test('winning hidden story risk earns item boosts and one ticket, safe choice does not roll',()=>{
 const now=Date.parse('2026-11-13T05:00:00Z');
 const event=ENCOUNTERS.find(x=>x.id==='clockwork-elevator');
 const start=initial();start.encounterDay=todayTW(now);start.encounterPending=event.id;
 const win=transition(start,{type:'encounterChoose',choice:0},()=>.01,now);
 assert.equal(win.last.outcome,'success');
 assert.equal(win.potions,3);assert.equal(win.gold,100);
 assert.equal(win.skinTickets,1);
 const next=transition(start,{type:'encounterChoose',choice:1},()=>{throw Error('safe story should not roll')},now);
 assert.equal(next.potions,2);assert.equal(next.gold,42);
 assert.equal(next.skinTickets,1);
});

test('balanced encounter trustee is opt-in and keeps old saves manual',()=>{
 const old=initial();delete old.autoEncounter;
 assert.equal(normalize(old).autoEncounter,false);
 const on=transition(old,{type:'autoEncounter',value:true});
 assert.equal(on.autoEncounter,true);
 assert.equal(normalize(JSON.parse(JSON.stringify(on))).autoEncounter,true);
 const off=transition(on,{type:'autoEncounter',value:false});
 assert.equal(off.autoEncounter,false);
});
test('balanced trustee prefers reliable outcomes unless risk has meaningful expected advantage',()=>{
 assert.equal(autoEncounterChoice(ENCOUNTERS.find(x=>x.id==='alien-shuttle')),1);
 assert.equal(autoEncounterChoice(ENCOUNTERS.find(x=>x.id==='monkey-scroll')),1);
 assert.equal(autoEncounterChoice(ENCOUNTERS.find(x=>x.id==='clockwork-elevator')),0);
 assert.equal(autoEncounterChoice(ENCOUNTERS.find(x=>x.id==='debug-cat')),0);
 assert.equal(autoEncounterChoice(ENCOUNTERS.find(x=>x.id==='dragon')),1);
 assert.equal(autoEncounterChoice({choices:[]}),-1);
});
test('daily history records HP lost even if rewards level hero up',()=>{
 const now=Date.parse('2026-11-13T05:00:00Z'),s=initial();
 s.heroHp=13;s.xp=79;s.encounterDay=todayTW(now);s.encounterPending='night-platform';
 const after=transition(s,{type:'encounterChoose',choice:0},()=>.99,now);
 assert.equal(after.last.outcome,'failure');
 assert.equal(after.encounterHistory[0].damage,12);
});
