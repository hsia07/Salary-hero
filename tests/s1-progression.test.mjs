import test from "node:test";
import assert from "node:assert/strict";
import { xpToNext, gainSlaveXp, slaveStats, teamAura, colleagueCap, colleagueUpgradeCost, upgradeColleague, xpReward, proposeSettlement } from "../v19/s1-progression.mjs";
test("XP curve and stats", () => {
  assert.equal(xpToNext(1), 100);
  assert.equal(xpToNext(10), 480);
  assert.equal(xpToNext(20), 1320);
  assert.equal(xpToNext(50), 6480);
  assert.equal(xpToNext(99), 23422);
  assert.equal(xpToNext(100), 0);
  assert.deepEqual(slaveStats(1), { hp: 1000, attack: 100, defense: 40 });
  assert.equal(teamAura(50), 1.0735);
});
test("multiple levels and max level", () => {
  assert.deepEqual(gainSlaveXp({level:1,xp:0}, 101), {level:2,xp:1,levelsGained:1});
  assert.equal(gainSlaveXp({level:99,xp:0}, 999999).level,100);
  assert.equal(gainSlaveXp({level:100,xp:0}, 500).xp,0);
});
test("colleague level is gated by slave and breakthrough", () => {
  assert.equal(colleagueCap(37,1),37);
  assert.equal(colleagueCap(38,1),38);
  assert.equal(colleagueCap(99,0),20);
  const cost = colleagueUpgradeCost(37);
  const blocked = upgradeColleague({level:37,breakthrough:1},37,{trainingXp:999999,coins:999999});
  assert.equal(blocked.reason,"level-cap");
  const allowed = upgradeColleague({level:37,breakthrough:1},38,{trainingXp:cost.trainingXp,coins:cost.coins});
  assert.equal(allowed.level,38);
  assert.equal(allowed.materials.trainingXp,0);
  assert.equal(allowed.materials.coins,0);
});
test("missing materials do not spend", () => {
  const input={trainingXp:0,coins:0};
  assert.equal(upgradeColleague({level:1},5,input).reason,"insufficient-materials");
  assert.deepEqual(input,{trainingXp:0,coins:0});
});
test("rewards are additive and duplicate settlements blocked", () => {
  assert.deepEqual(xpReward({normal:8,elite:2,boss:1,clear:true,firstClear:true}), {combat:1140,completion:400,firstClear:600,total:2140});
  const first=proposeSettlement({claimedIds:[],id:"battle-1",reward:100});
  assert.equal(first.accepted,true);
  assert.equal(proposeSettlement({claimedIds:first.claimedIds,id:"battle-1",reward:100}).accepted,false);
});
test("invalid input rejected", () => {
  assert.throws(()=>colleagueCap(10,5));
  assert.throws(()=>xpReward({normal:-1}));
  assert.throws(()=>xpReward({firstClear:true}));
  assert.throws(()=>gainSlaveXp({level:1},-1));
});
