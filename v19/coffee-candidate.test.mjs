import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ALL_ENEMIES} from './roster.mjs';
import {validateSpritePixels} from './sprite-atlas.mjs';
const root=new URL('../art/v19/candidates/monsters/coffee-mimic/',import.meta.url);
const expected={
 idle:{frames:4,sha256:'a690dfb7e9ff3a92178fd6a8202cc8ed8684b4945444701a2e0184bec0444975'},
 attack:{frames:5,sha256:'ec7a17ef32c4f77890c566cef479ffdd5c97de8dc2fcee0b47ea15f73888e7ba'},
 hurt:{frames:3,sha256:'ab5c0abb76b2e59172d28cafad5085dcd61aa0e71855825e295cf6ee5d03790c'},
 defeat:{frames:4,sha256:'f125bd29d6d9f9dbf5f5aa904536df80b266627c92803ce8c4fa0a35aa7a5aa1'}
};
test('the candidate cup monster has 16 real transparent raster pose frames committed to GitHub',()=>{
 const m=JSON.parse(readFileSync(new URL('manifest-candidate.json',root),'utf8'));
 assert.equal(m.id,'coffee-mimic');assert.equal(m.approved,false);
 assert.ok(ALL_ENEMIES.some(e=>e.id===m.id));
 for(const [state,e] of Object.entries(expected)){
  const f=m.states[state];assert.equal(f.frames,e.frames);assert.equal(f.cell,320);
  assert.equal(f.durations.length,e.frames);
  assert.equal(f.sha256,e.sha256);
  assert.ok(f.src.endsWith('/coffee-mimic/'+state+'.png'));
  const data=readFileSync(new URL(state+'.png',root));
  assert.ok(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  assert.equal(data.readUInt32BE(16),320*e.frames);
  assert.equal(data.readUInt32BE(20),320);
  assert.equal(createHash('sha256').update(data).digest('hex'),e.sha256);
  assert.equal(validateSpritePixels({naturalWidth:320*e.frames,naturalHeight:320},f).ok,true);
 }
});
test('old cute cup is archived as rejected candidate; only new evil cup ships officially',()=>{
 const old=JSON.parse(readFileSync(new URL('manifest-candidate.json',root),'utf8'));
 assert.equal(old.approved,false);
 const m=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(m.monsters).length,4); // third guard officially approved
 assert.ok(m.monsters['paper-gremlin']);
 assert.equal(m.monsters['coffee-mimic'].approved,true);
 assert.ok(m.monsters['coffee-mimic'].states.attack.src.endsWith('/runtime/monsters/coffee-mimic/attack.webp'));
});
