import test from 'node:test';
import assert from 'node:assert/strict';
import {DAILY_DUNGEONS,dailyDungeonFor,FRIDAY_BOSS_NOTE,loopEnemyFor,initial,normalize,transition,todayTW} from './engine.mjs';
const date=s=>Date.parse(s);
const MON=date('2026-11-09T08:00:00Z');
const TUE=date('2026-11-10T08:00:00Z');
const FRI=date('2026-11-13T08:00:00Z');
const SAT=date('2026-11-14T08:00:00Z');

function enterDaily(now,rng=()=>.99){
 return transition(initial(),{type:'mode',id:'dungeon'},rng,now);
}
function atFloor(state,floor,now){
 return {...state,wave:floor,modeWaves:{...state.modeWaves,dungeon:floor},
  enemy:loopEnemyFor(floor,'dungeon',now)};
}
test('six dungeons: five weekdays plus ONE shared Saturday/Sunday dungeon',()=>{
 assert.equal(DAILY_DUNGEONS.length,7); // weekday lookup slots, not 7 distinct dungeons
 assert.equal(new Set(DAILY_DUNGEONS.map(x=>x.id)).size,6);
 assert.equal(dailyDungeonFor(MON).id,'monday-hell');
 assert.equal(dailyDungeonFor(FRI).id,'friday-escape');
 assert.equal(dailyDungeonFor(SAT).id,'weekend-chaos');
 assert.equal(dailyDungeonFor(date('2026-11-15T08:00:00Z')).id,'weekend-chaos');
 assert.strictEqual(DAILY_DUNGEONS[0],DAILY_DUNGEONS[6]);
 assert.equal(dailyDungeonFor(date('2026-11-12T15:59:59Z')).weekday,4);
 assert.equal(dailyDungeonFor(date('2026-11-12T16:00:00Z')).weekday,5);
});
test('Monday has harder enemies, double XP, higher rare-drop rate and gold bonus',()=>{
 const harder=loopEnemyFor(1,'dungeon',MON),basic=loopEnemyFor(1,'dungeon',TUE);
 assert.ok(harder.maxHp>basic.maxHp);
 assert.ok(harder.attack>basic.attack);
 assert.equal(dailyDungeonFor(MON).xpScale,2);
 let monday=enterDaily(MON),tuesday=enterDaily(TUE);
 monday.enemy.hp=1;tuesday.enemy.hp=1;
 const m=transition(monday,'attack',()=>.99,MON),t=transition(tuesday,'attack',()=>.99,TUE);
 assert.ok(m.gold>t.gold);assert.ok(m.xp>t.xp);
});
test('Monday 厭世 applies exact enemy and XP modifiers',()=>{
 const rule=dailyDungeonFor(MON);
 assert.equal(rule.name,'星期一・厭世');
 assert.equal(rule.hpScale,1.65);
 assert.equal(rule.attackScale,1.4);
 assert.equal(rule.xpScale,2);
});
test('Monday 厭世 really increases epic and legendary drop tier odds',()=>{
 const fight=(now,wave,cleared,roll)=>{
   let s=enterDaily(now);
   s.wave=wave;s.modeWaves.dungeon=wave;s.cleared=cleared;
   s.enemy={...loopEnemyFor(wave,'dungeon',now),hp:1};
   return transition(s,'attack',()=>roll,now);
 };
 const mondayEpic=fight(MON,7,6,.15);
 const tuesdayEpic=fight(TUE,7,6,.15);
 assert.ok(mondayEpic.pendingDrops.includes('notice'));
 assert.ok(!tuesdayEpic.pendingDrops.includes('notice'));
 const mondayLegend=fight(MON,17,16,.04);
 const tuesdayLegend=fight(TUE,17,16,.04);
 assert.ok(mondayLegend.pendingDrops.includes('excalibur'));
 assert.ok(!tuesdayLegend.pendingDrops.includes('excalibur'));
});
test('weekday dungeons have stand-in elite on 3 and stand-in boss on 4',()=>{
 assert.equal(loopEnemyFor(1,'dungeon',TUE).tier,'normal');
 assert.equal(loopEnemyFor(2,'dungeon',TUE).tier,'normal');
 const elite=loopEnemyFor(3,'dungeon',TUE),boss=loopEnemyFor(4,'dungeon',TUE);
 assert.equal(elite.tier,'elite');assert.equal(boss.tier,'boss');
 assert.equal(elite.standIn,true);assert.equal(boss.standIn,true);
 assert.ok(boss.maxHp>elite.maxHp);
 assert.equal(loopEnemyFor(5,'dungeon',TUE).tier,'normal');
});
test('Friday small fry and elites sometimes ignore retaliation',()=>{
 let s=enterDaily(FRI);
 let after=transition(s,'attack',()=>0,FRI);
 assert.equal(after.last.enemyIdle,true);
 assert.equal(after.last.retaliationDamage,0);
 s=atFloor(s,3,FRI);
 after=transition(s,'attack',()=>0,FRI);
 assert.equal(after.last.enemyIdle,true);
 assert.equal(after.last.retaliationDamage,0);
});
test('Friday skipped boss writes a letter and awards an actual win',()=>{
 let s=atFloor(enterDaily(FRI),3,FRI);
 s.enemy.hp=1;
 const result=transition(s,'attack',()=>.01,FRI);
 assert.equal(result.wave,5);
 assert.equal(result.fridayNote.headline,FRIDAY_BOSS_NOTE.headline);
 assert.equal(result.fridayNote.message,'下週一再戰');
 assert.equal(result.last.fridayNote.wave,4);
 assert.ok(result.fridayNote.gold>0);
 assert.ok(result.gems>=3); // defeated elite gem + absentee boss gems
 assert.ok(result.skinTickets>=1&&result.chests>=1);
 assert.equal(result.heroHp,result.maxHp);
 assert.equal(result.activityDaily.bosses,1);
 assert.equal(result.fridayBossRolls[todayTW(FRI)+':4'],true);
});
test('absent boss can never be farmed again by switching modes',()=>{
 let s=atFloor(enterDaily(FRI),3,FRI);s.enemy.hp=1;
 s=transition(s,'attack',()=>.01,FRI);
 const before={gold:s.gold,cleared:s.cleared,chests:s.chests,skinTickets:s.skinTickets};
 s=transition(s,{type:'mode',id:'campaign'},()=>0,FRI);
 s=transition(s,{type:'mode',id:'dungeon'},()=>0,FRI);
 assert.deepEqual({gold:s.gold,cleared:s.cleared,chests:s.chests,skinTickets:s.skinTickets},before);
 assert.equal(s.wave,5);
});
test('boss sometimes stays and fights: chance has one roll per floor',()=>{
 let s=atFloor(enterDaily(FRI),3,FRI);s.enemy.hp=1;
 s=transition(s,'attack',()=>.99,FRI);
 assert.equal(s.wave,4);assert.equal(s.enemy.boss,true);
 assert.equal(s.fridayBossRolls[todayTW(FRI)+':4'],false);
 s=transition(s,{type:'mode',id:'campaign'},()=>0,FRI);
 s=transition(s,{type:'mode',id:'dungeon'},()=>0,FRI);
 assert.equal(s.wave,4);assert.equal(s.fridayNote,null);
});
test('Taiwan midnight resets daily only, preserves salary-independent inventory and other modes',()=>{
 let s=atFloor(enterDaily(FRI),18,FRI);
 s.gold=350;s.gems=8;s.modeWaves.campaign=9;s.modeWaves.tower=13;
 s=transition(s,'refreshDungeon',()=>.99,SAT);
 assert.equal(s.wave,1);
 assert.equal(s.enemy.dungeonId,'weekend-chaos');
 assert.equal(s.gold,350);assert.equal(s.gems,8);
 assert.equal(s.modeWaves.campaign,9);assert.equal(s.modeWaves.tower,13);
 assert.equal(s.dailyDungeonDay,todayTW(SAT));
});

test('Monday first boss clear guarantees epic equipment only once per day',()=>{
 let s=atFloor(enterDaily(MON),4,MON);s.enemy.hp=1;
 const first=transition(s,'attack',()=>.99,MON);
 assert.ok(first.pendingDrops.includes('notice'));
 assert.ok(first.weeklyDungeonClaims.includes('monday-epic:'+todayTW(MON)));
 s=atFloor(first,8,MON);s.enemy.hp=1;
 const second=transition(s,'attack',()=>.99,MON);
 assert.equal(second.weeklyDungeonClaims.filter(x=>x.startsWith('monday-epic:')).length,1);
});
test('Tuesday four-stage clear awards skill book and studying it improves skill rank',()=>{
 let s=atFloor(enterDaily(TUE),4,TUE);s.enemy.hp=1;
 s=transition(s,'attack',()=>.99,TUE);
 assert.equal(s.skillBooks,1);
 s=transition(s,'studySkillBook',()=>.99,TUE);
 assert.equal(s.skillBooks,0);assert.equal(s.skillRank,1);
});
test('Wednesday pet earns real XP from combat',()=>{
 const WED=date('2026-11-11T08:00:00Z');
 let s=enterDaily(WED);s.enemy.hp=1;
 s=transition(s,'attack',()=>.99,WED);
 assert.ok(s.petXp>0||s.petLevel>1);
});
test('Thursday forging consumes earned materials and raises attack',()=>{
 const THU=date('2026-11-12T08:00:00Z');
 let s=atFloor(enterDaily(THU),4,THU);s.enemy.hp=1;
 s=transition(s,'attack',()=>.99,THU);
 assert.ok(s.craftingMaterial>0&&s.rareMaterials>0);
 s.craftingMaterial=3;
 const oldLevel=s.forgeLevel;
 s=transition(s,'forge',()=>.99,THU);
 assert.equal(s.forgeLevel,oldLevel+1);assert.equal(s.craftingMaterial,0);
});
test('Friday absentee reward includes unique weekend chest and opening truly consumes it',()=>{
 let s=atFloor(enterDaily(FRI),3,FRI);s.enemy.hp=1;
 s=transition(s,'attack',()=>.01,FRI);
 assert.equal(s.specialChests,1);
 const gold=s.gold;
 s=transition(s,'weekendChest',()=>.99,FRI);
 assert.equal(s.specialChests,0);assert.equal(s.gold,gold+160);assert.ok(s.pendingDrops.length>0);
});
