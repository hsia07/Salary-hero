import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,normalize,transition,dungeonPeriodKey,loopEnemyFor,dailyDungeonFor,todayTW} from './engine.mjs';
import {WEEKEND_CHAOS_EVENTS,weekendChaosDraw} from './weekend-chaos.mjs';
const SAT=Date.parse('2026-11-14T08:00:00Z');
const SUN=Date.parse('2026-11-15T08:00:00Z');
const MON=Date.parse('2026-11-16T08:00:00Z');
const enter=(chance)=>transition(initial(),{type:'mode',id:'dungeon'},()=>chance,SAT);

test('Saturday and Sunday share exactly one dungeon and one progression period',()=>{
 assert.equal(dailyDungeonFor(SAT).id,'weekend-chaos');
 assert.strictEqual(dailyDungeonFor(SAT),dailyDungeonFor(SUN));
 assert.equal(dungeonPeriodKey(SAT),dungeonPeriodKey(SUN));
 assert.notEqual(dungeonPeriodKey(SAT),dungeonPeriodKey(MON));
 let s=enter(.5); // confetti, not an empty floor
 s.modeWaves.dungeon=3;s.wave=3;s.enemy=loopEnemyFor(3,'dungeon',SAT);
 s.weekendChaosEvent=null;
 const sun=normalize(s,SUN);
 assert.equal(sun.wave,3);
 assert.equal(sun.enemy.typeId,s.enemy.typeId);
 assert.equal(sun.dailyDungeonDay,todayTW(SUN));
 assert.equal(sun.dailyDungeonKey,dungeonPeriodKey(SUN));
 const monday=normalize(sun,MON);
 assert.equal(monday.modeWaves.dungeon,1);
 assert.equal(monday.weekendChaosEvent,null);
});
test('chaos event picker has five genuinely different deterministic outcomes',()=>{
 assert.equal(WEEKEND_CHAOS_EVENTS.length,5);
 assert.deepEqual([.01,.20,.5,.70,.95].map(n=>weekendChaosDraw(n).id),
   ['empty','coffee','confetti','goldrush','rogue-ai']);
 assert.equal(WEEKEND_CHAOS_EVENTS.reduce((sum,e)=>sum+e.weight,0),100);
});
test('unoccupied floor clears without hitting enemy, grants gold+XP exactly once',()=>{
 let s=enter(.01);
 assert.equal(s.weekendChaosHistory[0].id,'empty');
 assert.equal(s.wave,2);
 assert.ok(s.gold>0&&s.xp>0&&s.cleared===1);
 assert.equal(s.weekendChaosRolls[dungeonPeriodKey(SAT)+':1'],'empty');
 const before={gold:s.gold,xp:s.xp,cleared:s.cleared};
 s=normalize(JSON.parse(JSON.stringify(s)),SAT);
 assert.deepEqual({gold:s.gold,xp:s.xp,cleared:s.cleared},before);
 s=normalize(s,SUN);
 assert.deepEqual({gold:s.gold,xp:s.xp,cleared:s.cleared},before);
});
test('free coffee refills some HP and gives potion, no repeat on refresh',()=>{
 let s=initial();s.activeMode='dungeon';s.heroHp=25;
 s=transition(s,'refreshDungeon',()=>.25,SAT);
 assert.equal(s.weekendChaosEvent.id,'coffee');
 assert.equal(s.heroHp,70);assert.equal(s.potions,3);
 s=transition(s,'refreshDungeon',()=>.25,SAT);
 assert.equal(s.heroHp,70);assert.equal(s.potions,3);
});
test('confetti blocks retaliation and produces a real zero-damage dodge',()=>{
 let s=enter(.5);
 assert.equal(s.weekendChaosEvent.id,'confetti');
 const hp=s.heroHp;
 s=transition(s,'attack',()=>.1,SAT);
 assert.equal(s.last.type,'hit');
 assert.equal(s.last.enemyIdle,true);
 assert.equal(s.last.retaliationDamage,0);
 assert.equal(s.heroHp,hp);
});
test('goldrush doubles floor gold but does not double all future floors',()=>{
 let s=enter(.70);
 assert.equal(s.weekendChaosEvent.id,'goldrush');
 s.enemy.hp=1;
 const reward=Math.round((12+s.wave*4)*dailyDungeonFor(SAT).rewardScale*2);
 const after=transition(s,'attack',()=>.95,SAT);
 assert.equal(after.gold,reward);assert.equal(after.wave,2);
 assert.equal(after.last.gold,reward);
});
test('rogue AI deals more damage, pays extra gem and boss floor cannot be skipped',()=>{
 let s=enter(.95);
 assert.equal(s.weekendChaosEvent.id,'rogue-ai');
 const before=s.heroHp;
 const hit=transition(s,'attack',()=>.95,SAT);
 assert.ok(before-hit.heroHp>hit.enemy.attack);
 let boss=initial();
 boss.modeWaves.dungeon=4;boss.dailyDungeonKey=dungeonPeriodKey(SAT);boss.dailyDungeonDay=todayTW(SAT);
 boss=transition(boss,{type:'mode',id:'dungeon'},()=>0,SAT);
 assert.equal(boss.wave,4);
 assert.equal(boss.enemy.boss,true);
 assert.equal(boss.weekendChaosEvent.id,'rogue-ai');
 boss.enemy.hp=1;
 boss=transition(boss,'attack',()=>.99,SAT);
 assert.ok(boss.gems>=3); // boss 2 + AI bonus 1, plus normal dungeon clear bonus
 assert.equal(boss.specialChests,1);
});
test('Friday escaped boss still works unchanged and weekend cannot revive Friday rolls',()=>{
 const FRI=Date.parse('2026-11-13T08:00:00Z');
 let s=initial();s.modeWaves.dungeon=4;s.dailyDungeonKey=dungeonPeriodKey(FRI);s.dailyDungeonDay=todayTW(FRI);
 s=transition(s,{type:'mode',id:'dungeon'},()=>0,FRI);
 assert.equal(s.wave,5);
 assert.ok(s.fridayNote);
 s=transition(s,'refreshDungeon',()=>.95,SAT);
 assert.equal(s.fridayNote,null);
 assert.equal(s.enemy.dungeonId,'weekend-chaos');
});
