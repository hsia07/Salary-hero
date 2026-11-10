import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ALL_ENEMIES} from './roster.mjs';
import {validateMonsterAtlasRecord} from './sprite-atlas.mjs';

const base=new URL('../art/v19/runtime/monsters/paper-gremlin/',import.meta.url);
const expected={
 idle:{frames:4,sha:'6b4e00581de9ef5a37a2849e9e18574173908628df6e2d4824a4aeaf53b6a7ee'},
 attack:{frames:5,sha:'c5b97a9dd6d2746e8ac886bda2f3f0ef55fd17fde57f4de5e8c86cf38c93aadf'},
 hurt:{frames:3,sha:'84ee2147186ca75412fdde607397669223d86ef38da849e8d2ab8770888c3a9a'},
 defeat:{frames:4,sha:'6440aeef831d1b0b94224ed23317be4887811b2bbc6f99be7fd4c2be283371b9'}
};
test('paper gremlin has four actual committed PNG sprite strips, never a poster/vector placeholder',()=>{
 for(const [name,{frames,sha}] of Object.entries(expected)){
  const data=readFileSync(new URL(name+'.png',base));
  assert.ok(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),name+' not PNG');
  assert.equal(data.toString('ascii',12,16),'IHDR');
  assert.equal(data.readUInt32BE(16),320*frames,name+' width');
  assert.equal(data.readUInt32BE(20),320,name+' height');
  assert.equal(createHash('sha256').update(data).digest('hex'),sha,name+' byte integrity');
 }
});
test('the real first-wave enemy automatically resolves to deployed sprite sheet URLs',()=>{
 const all=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
 const record=all.monsters['paper-gremlin'];
 assert.ok(ALL_ENEMIES.some(e=>e.id==='paper-gremlin'));
 assert.deepEqual(validateMonsterAtlasRecord(record,'normal'),[]);
 for(const [name,{frames}] of Object.entries(expected)){
  const spec=record.states[name];
  assert.equal(spec.frames,frames);
  assert.equal(spec.cell,320);
  assert.equal(spec.ground_y,289);
  assert.ok(spec.src.endsWith('/paper-gremlin/'+name+'.png'));
  assert.equal(spec.durations.length,frames);
 }
});
