import test from 'node:test';
import assert from 'node:assert/strict';
import {portraitHomeMessage,portraitClock,portraitHomeState,PORTRAIT_HOME_LINES} from './portrait-home.mjs';
import {initial,salaryAt} from './engine.mjs';
test('portrait home has three interactive illustrated hotspots with multiple original reactions',()=>{
 assert.deepEqual(Object.keys(PORTRAIT_HOME_LINES).sort(),['cat','coffee','hero']);
 for(const name of Object.keys(PORTRAIT_HOME_LINES)){
   assert.ok(PORTRAIT_HOME_LINES[name].length>=3);
   assert.ok(portraitHomeMessage(name,0));
   assert.notEqual(portraitHomeMessage(name,0),portraitHomeMessage(name,1));
   assert.equal(portraitHomeMessage(name,1000),portraitHomeMessage(name,1000%PORTRAIT_HOME_LINES[name].length));
 }
 assert.equal(portraitHomeMessage('unknown'), '');
});
test('portrait status comes from real combat state not fake resource placeholders',()=>{
 const s=initial();s.level=38;s.playerName='真實社畜';s.activeMode='tower';s.wave=17;s.gold=1434;s.auto=true;
 const v=portraitHomeState(s);
 assert.deepEqual(v,{name:'真實社畜',level:38,mode:'無限之塔',wave:17,gold:1434,auto:true,loot:0});
 s.activeMode='dungeon';
 assert.equal(portraitHomeState(s).mode,'今日副本');
 s.activeMode='campaign';
 assert.equal(portraitHomeState(s).mode,'辦公室遠征');
});
test('portrait home truncates unsafe names and respects old missing saves',()=>{
 const plain=portraitHomeState({});
 assert.equal(plain.name,'平凡社畜');
 assert.equal(plain.level,1);
 assert.equal(plain.wave,1);
 const named=portraitHomeState({playerName:'12345678901234567',gold:-90,level:0,auto:1});
 assert.equal(named.name.length,12);
 assert.equal(named.gold,0);
 assert.equal(named.auto,false);
});
test('office wall clock shows actual Taiwan local time, not browser locale',()=>{
 assert.equal(portraitClock(Date.parse('2026-11-11T01:42:00Z')),'09:42');
 assert.equal(portraitClock(Date.parse('2026-11-10T16:00:00Z')),'00:00');
});
test('salary remains determined by existing 8–17 work clock; home does not affect it',()=>{
 const before=salaryAt(Date.parse('2026-11-11T02:00:00Z'),40000);
 const status=portraitHomeState({...initial(),wave:34});
 const after=salaryAt(Date.parse('2026-11-11T02:00:00Z'),40000);
 assert.equal(status.wave,34);
 assert.deepEqual(before,after);
});
