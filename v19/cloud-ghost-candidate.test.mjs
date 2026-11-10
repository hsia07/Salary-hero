import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ALL_ENEMIES,COMMON_ENEMIES} from './roster.mjs';
import {validateSpritePixels} from './sprite-atlas.mjs';
const root=new URL('../art/v19/candidates/monsters/deadline-clock/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest-candidate.json',root),'utf8'));
test('fifth cloud ghost is separate real original normal species, not boss or recolor',()=>{
 assert.equal(ALL_ENEMIES.length,32);
 assert.equal(COMMON_ENEMIES.length,16);
 assert.equal(COMMON_ENEMIES.find(x=>x.id==='deadline-clock')?.name,'雲端資料專員靈');
 assert.equal(manifest.id,'deadline-clock');
 assert.equal(manifest.tier,'normal');
 assert.equal(manifest.approved,false);
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.facing,'left');
 assert.equal(manifest.target,'hero-on-left');
});
test('candidate actually includes 16 committed WebP original poses with proper alpha atlas size',()=>{
 const lengths={idle:4,attack:5,hurt:3,defeat:4};
 assert.equal(Object.values(lengths).reduce((a,b)=>a+b,0),16);
 for(const [name,n] of Object.entries(lengths)){
   const record=manifest.states[name];
   assert.equal(record.frames,n);
   assert.equal(record.cell,384);
   assert.equal(record.durations.length,n);
   assert.ok(record.src.endsWith('/deadline-clock/'+name+'.webp'));
   const bytes=readFileSync(new URL(name+'.webp',root));
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
   assert.equal(validateSpritePixels({naturalWidth:384*n,naturalHeight:384},record).ok,true);
 }
});
test('fifth creature is candidate ONLY, official 3/32 unchanged',()=>{
 const official=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(official.monsters).length,3);
 assert.equal(official.monsters['deadline-clock'],undefined);
});
