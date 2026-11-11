import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,transition,normalize} from './engine.mjs';
import {liteCreateItem,liteEquipmentStats} from './lite-equipment.mjs';
import {liteOfflineEstimate,liteAutoPlan,liteBuildScore,LITE_STRATEGIES} from './lite-idle.mjs';
const NOW=Date.parse('2026-11-11T08:00:00Z'); // Taiwan local Wednesday 16:00
function item(id,rare,seq){return liteCreateItem(id,rare,12,seq,()=>.35);}
function idle(minutes,auto=true){
 const s=initial();
 s.auto=auto;s.liteLastSeenAt=NOW-minutes*60000;
 return s;
}
test('offline rewards are capped at eight hours, no matter how long away',()=>{
 const report=liteOfflineEstimate(idle(30000),NOW);
 assert.equal(report.minutes,480);
 assert.equal(report.gold,960);
 assert.equal(report.xp,480);
 assert.equal(report.itemCount,6);
});
test('one-minute minimum and backwards clocks never mint resources',()=>{
 assert.equal(liteOfflineEstimate(idle(.7),NOW),null);
 assert.equal(liteOfflineEstimate(idle(-60),NOW),null);
 assert.equal(liteOfflineEstimate({...idle(100),liteLastSeenAt:0},NOW),null);
 assert.equal(liteOfflineEstimate(idle(120,false),NOW),null);
});
test('actual offline settlement credits gold, XP, gear without daily boss claims or wave movement',()=>{
 const s=idle(120),beforeWave=s.wave;
 const paid=transition(s,'liteOffline',()=>.99,NOW);
 assert.equal(paid.liteOfflineReport.minutes,120);
 assert.equal(paid.liteOfflineReport.gold,240);
 assert.equal(paid.liteOfflineReport.items,2);
 assert.equal(paid.liteInventory.length,2);
 assert.ok(paid.level>1);
 assert.equal(paid.wave,beforeWave);
 assert.equal(paid.weeklyDungeonClaims.length,0);
 assert.equal(paid.activityDaily.wins,0);
 assert.equal(paid.liteLastSeenAt,NOW);
});
test('repeated reload and same-time foreground resumes do not duplicate offline loot',()=>{
 const once=transition(idle(120),'liteOffline',()=>.33,NOW);
 const twice=transition(JSON.parse(JSON.stringify(once)),'liteOffline',()=>.33,NOW);
 assert.equal(twice.gold,once.gold);
 assert.equal(twice.xp,once.xp);
 assert.deepEqual(twice.liteInventory,once.liteInventory);
 assert.equal(twice.last.credited,false);
 const cleared=transition(twice,'liteDismissOffline',()=>.5,NOW);
 assert.equal(cleared.liteOfflineReport,null);
 assert.equal(transition(cleared,'liteOffline',()=>.5,NOW).gold,once.gold);
});
test('not opting into auto patrol never deposits offline rewards',()=>{
 const s=idle(480,false);
 const after=transition(s,'liteOffline',()=>0,NOW);
 assert.equal(after.gold,0);assert.equal(after.liteInventory.length,0);
 assert.equal(after.liteLastSeenAt,NOW);
});
test('auto strategy list has balanced, survival and speed only',()=>{
 assert.deepEqual(LITE_STRATEGIES.map(s=>s.id),['balanced','survival','speed']);
});
test('optimizer considers entire loadout including set bonuses',()=>{
 const s=initial();
 s.liteInventory=[item('w-clockblade','rare',1),item('b-early','rare',2),item('w-resign','rare',3),item('a-shirt','rare',4)];
 s.liteLoadout={weapon:'li-1',armor:null,badge:'li-2',relic:null};
 const plan=liteAutoPlan(s,'speed',12);
 const upgraded=liteBuildScore(s,plan.loadout,'speed',12);
 const current=liteBuildScore(s,s.liteLoadout,'speed',12);
 assert.ok(upgraded>=current);
 assert.equal(plan.loadout.badge,'li-2');
});
test('equipped locked item is a pin even when newer legendary in same slot exists',()=>{
 const worn=item('w-stapler','common',1);
 worn.locked=true;
 const s=initial();
 s.liteInventory=[worn,item('w-resign','legendary',2),item('a-heavy','legendary',3)];
 s.liteLoadout={weapon:'li-1',armor:null,badge:null,relic:null};
 const plan=liteAutoPlan(s,'speed',12);
 assert.equal(plan.loadout.weapon,'li-1');
 assert.equal(s.liteLoadout.weapon,'li-1');
});
test('auto equip is opt-in, saved, strategy-switchable and respects protected gear',()=>{
 let s=initial();
 s.liteInventory=[item('w-stapler','common',1),item('w-resign','legendary',2)];
 s.liteItemSeq=2;
 s=transition(s,{type:'liteEquip',id:'li-1'},()=>.99,NOW);
 s=transition(s,{type:'liteLock',id:'li-1'},()=>.99,NOW);
 s=transition(s,{type:'liteSetAuto',value:true},()=>.99,NOW);
 s=transition(s,{type:'liteSetStrategy',id:'speed'},()=>.99,NOW);
 s=transition(s,'liteAutoOptimize',()=>.99,NOW);
 assert.equal(s.liteAutoEquip,true);
 assert.equal(s.liteAutoStrategy,'speed');
 assert.equal(s.liteLoadout.weapon,'li-1');
 assert.equal(normalize(JSON.parse(JSON.stringify(s)),NOW).liteAutoEquip,true);
});
test('optimizer never spends, decomposes or destroys unselected items',()=>{
 const a=item('w-stapler','rare',1),b=item('w-clockblade','epic',2);
 const state=initial();
 state.liteInventory=[a,b];state.liteItemSeq=2;
 const before=JSON.stringify(state);
 const plan=liteAutoPlan(state,'balanced',12);
 assert.equal(JSON.stringify(state),before);
 assert.ok(plan.loadout.weapon===null||['li-1','li-2'].includes(plan.loadout.weapon));
});
test('offline report is restored safely but cannot be re-claimed twice',()=>{
 const s=transition(idle(45),'liteOffline',()=>.8,NOW);
 const reloaded=normalize(JSON.parse(JSON.stringify(s)),NOW);
 assert.deepEqual(reloaded.liteOfflineReport,s.liteOfflineReport);
 const again=transition(reloaded,'liteOffline',()=>.8,NOW);
 assert.equal(again.gold,s.gold);
 assert.equal(again.liteInventory.length,s.liteInventory.length);
});
