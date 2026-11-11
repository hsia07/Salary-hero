import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,transition,slaveProgress} from '../v19/engine.mjs';
import {squadStats,squadPreview} from '../v19/v21-squad-core.mjs';

test('live V19 battle XP routes through S1 curve without changing save version',()=>{
 const start=initial();
 const after=transition(start,{type:'encounter'},()=>0.5);
 assert.equal(after.version,19);
 assert.equal(slaveProgress(start).xpRequired,100);
 assert.equal(slaveProgress(start).teamAura,1);
});
test('V21 squad receives slave aura and respects slave-level cap when supplied',()=>{
 const draft={slots:[{id:'a',job:'fighter',level:60,stars:1},null,null,null,null,null]};
 const legacy=squadStats(draft)[0];
 const level1=squadStats(draft,1)[0];
 const level20=squadStats(draft,20)[0];
 assert.ok(legacy.attack>level20.attack);
 assert.ok(level20.attack>level1.attack);
 assert.equal(squadPreview(draft,20).filled,1);
});
