import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {COMMON_ENEMIES,ELITE_ENEMIES,BOSSES} from './roster.mjs';
import {validateSpritePixels} from './sprite-atlas.mjs';

const root=new URL('../art/v19/candidates/monsters/meeting-ghost/',import.meta.url);
const record=JSON.parse(readFileSync(new URL('manifest-candidate.json',root),'utf8'));
const official=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
const hashes={
 idle:'9dd3074f148f4da72e627199a4bbf93dabc6355a84e453de35c8c3398606b2f3',
 attack:'65d57b939ec9fb70af324ad84d09f3178541225d59928a360cf21d6e13fa1c41',
 hurt:'2d0f1e9b4028259b2bd1bdb35e46adb8f31f43e4b8eb75bbb1917bd93c359ac2',
 defeat:'dd4a1270a057dc3ea0e355a001204c6bda9938b640da281067dc5e02634a95cb'
};
test('left-facing fourth candidate preserves original 16 hand-drawn poses and immutable roster',()=>{
 assert.equal(record.id,'meeting-ghost');
 assert.equal(record.facing,'left');
 assert.equal(record.target,'hero-on-left');
 assert.equal(record.tier,'normal');
 assert.equal(record.approved,false);
 assert.equal(record.previewOnly,true);
 assert.equal(COMMON_ENEMIES.length,16);
 assert.equal(ELITE_ENEMIES.length,8);
 assert.equal(BOSSES.length,8);
 assert.equal(COMMON_ENEMIES.find(e=>e.id==='meeting-ghost')?.name,'星際打卡實習生');
 assert.equal(Object.keys(official.monsters).length,4);
 assert.equal(official.monsters['meeting-ghost'].approved,true);
 assert.deepEqual(Object.entries(record.states).map(([s,f])=>[s,f.frames]),[
  ['idle',4],['attack',5],['hurt',3],['defeat',4]
 ]);
 for(const [state,sha] of Object.entries(hashes)){
  const frame=record.states[state];
  const bytes=readFileSync(new URL(state+'.webp',root));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
  assert.equal(frame.sha256,sha);
  assert.equal(frame.cell,384);
  assert.equal(frame.ground_y,342);
  assert.equal(frame.durations.length,frame.frames);
  assert.equal(validateSpritePixels({naturalWidth:384*frame.frames,naturalHeight:384},frame).ok,true);
  const live=official.monsters['meeting-ghost'].states[state];
  assert.equal(live.frames,frame.frames);assert.equal(live.cell,384);
  assert.ok(live.src.includes('/runtime/monsters/meeting-ghost/'));
  const binary=readFileSync(new URL('../art/v19/runtime/monsters/meeting-ghost/'+state+'.webp',import.meta.url));
  assert.deepEqual(binary,bytes,'official sprites preserve all sixteen original drawn frames');
  assert.equal(createHash('sha256').update(binary).digest('hex'),sha);
 }
});
