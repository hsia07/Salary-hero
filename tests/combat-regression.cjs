// V5.17 combat regression checks. Run: node tests/combat-regression.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8');
function extract(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a,'missing '+start);return source.slice(a,b)}
const state={tower:1,kills:0,coins:0};
const encounters=[],replays=[];
const context={s:state,ENEMIES:['加班史萊姆','卡紙魔像','催件哥布林','週報蝙蝠'],stats:()=>({hp:100}),resolveFight:c=>{encounters.push({...c});return {win:true,enemyName:c.name,heroHp:Math.max(1,(c.startHp??100)-10),events:[]}},replayTower:r=>replays.push(r),xp:()=>{},loot:()=>{},rarity:()=>0,message:()=>{},log:()=>{},save:()=>{},render:()=>{},replayActive:false,replayQueue:[],lastCombat:null,Math};
vm.runInNewContext(extract('function combat(','function wildEncounter(')+extract('function towerCombat(','function todayType('),context);
vm.runInNewContext('towerCombat(2)',context);
assert.equal(state.tower,3);
assert.equal(encounters.length,7,'floor 1 has 4 waves, floor 2 has 3');
assert.deepEqual(encounters.map(e=>e.startHp),[100,90,80,70,100,90,80],'HP carries within floor, resets on next floor');
assert.equal(state.kills,7);
assert.equal(replays.length,7);
assert.equal(replays[0].wave,1);
assert.equal(replays[3].totalWaves,4);
assert.equal(replays[4].floorStart,true);
const before=encounters.length;context.replayActive=true;vm.runInNewContext('towerCombat(1)',context);assert.equal(encounters.length,before,'no overlap while replay active');
console.log('PASS tower waves, HP persistence/reset, rewards, replay queue and overlap guard');
