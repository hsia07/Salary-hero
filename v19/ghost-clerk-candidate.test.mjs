import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {COMMON_ENEMIES,ALL_ENEMIES} from './roster.mjs';
import {validateSpritePixels,validateMonsterAtlasRecord} from './sprite-atlas.mjs';

const root=new URL('../art/v19/candidates/monsters/keyboard-piranha/',import.meta.url);
const record=JSON.parse(readFileSync(new URL('manifest-candidate.json',root),'utf8'));
const live=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
test('sixth monster is an independent human ghost office worker, never a palette swap or boss',()=>{
 assert.equal(ALL_ENEMIES.length,32);
 assert.equal(COMMON_ENEMIES.length,16);
 assert.equal(COMMON_ENEMIES.find(x=>x.id==='keyboard-piranha').name,'加班遊魂文員');
 assert.equal(record.id,'keyboard-piranha');
 assert.equal(record.tier,'normal');
 assert.equal(record.approved,false);
 assert.equal(record.previewOnly,true);
 assert.equal(record.facing,'left');
 assert.equal(Object.keys(live.monsters).length,6);
 const approved=live.monsters['keyboard-piranha'];
 assert.equal(approved.facing,'left');
 assert.deepEqual(validateMonsterAtlasRecord(approved,'normal'),[]);
});
test('four actual transparent WebP sprite strips hold 16 uniquely illustrated frames',()=>{
 const expected={idle:4,attack:5,hurt:3,defeat:4};
 assert.equal(Object.values(expected).reduce((a,b)=>a+b,0),16);
 for(const [name,frames] of Object.entries(expected)){
  const f=record.states[name];
  assert.equal(f.frames,frames);
  assert.equal(f.cell,384);
  assert.equal(f.durations.length,frames);
  assert.equal(f.ground_y,337);
  assert.ok(f.src.includes('/keyboard-piranha/'+name+'.webp'));
  const bytes=readFileSync(new URL(name+'.webp',root));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
  assert.equal(validateSpritePixels({naturalWidth:384*frames,naturalHeight:384},f).ok,true);
 }
});

test('high definition redrawn clerk really has 16 independently illustrated 512px transparent frames',()=>{
 const hdRoot=new URL('../art/v19/candidates/monsters/keyboard-piranha/hd/',import.meta.url);
 const hd=JSON.parse(readFileSync(new URL('manifest-hd-candidate.json',hdRoot),'utf8'));
 assert.equal(hd.id,'keyboard-piranha');
 assert.equal(hd.approved,false);
 assert.equal(hd.previewOnly,true);
 assert.equal(hd.facing,'left');
 let total=0;
 for(const [state,frame] of Object.entries(hd.states)){
   const bytes=readFileSync(new URL(state+'.webp',hdRoot));
   const liveFrame=live.monsters[hd.id].states[state];
   const liveURL=new URL(liveFrame.src,import.meta.url);
   assert.deepEqual(liveFrame,{...frame,src:'../art/v19/runtime/monsters/keyboard-piranha/'+state+'.webp'});
   assert.deepEqual(readFileSync(liveURL),bytes);
   assert.notDeepEqual(bytes,readFileSync(new URL(state+'.webp',root)));
   assert.equal(frame.cell,512);
   assert.equal(frame.frames,record.states[state].frames);
   assert.equal(frame.durations.length,frame.frames);
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert.equal(createHash('sha256').update(bytes).digest('hex'),frame.sha256);
   assert.equal(validateSpritePixels({naturalWidth:512*frame.frames,naturalHeight:512},frame).ok,true);
   total+=frame.frames;
 }
 assert.equal(total,16);
});
