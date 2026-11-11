import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {v20LightAt,drawV20FloorAtmosphere} from './v20-scene-light.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
test('P0.8 floor lighting is deterministic and safely handles bad time',()=>{
 assert.deepEqual(v20LightAt(3000),v20LightAt(3000));
 for(const time of [-1,0,1000,3000,80000,Infinity,NaN]){
  const x=v20LightAt(time);
  assert.ok(x.moon>=0&&x.moon<=1);
  assert.ok(x.amber>=0&&x.amber<=1);
  assert.ok(Number.isFinite(x.drift));
 }
 const zero=v20LightAt(0,true),late=v20LightAt(1000000,true);
 assert.deepEqual(zero,late,'reduced motion must be static');
});
test('P0.8 floor uses only drawing APIs; no app state, salary or saves',()=>{
 const lines=[];
 const gradient={addColorStop(){lines.push('stop')}};
 const ctx={
  save(){lines.push('save');},restore(){lines.push('restore');},
  beginPath(){},moveTo(){},lineTo(){},bezierCurveTo(){},closePath(){},
  clip(){},fillRect(){lines.push('fill');},stroke(){lines.push('stroke')},
  quadraticCurveTo(){},
  createRadialGradient(){return gradient}
 };
 drawV20FloorAtmosphere(ctx,3200);
 assert.equal(lines[0],'save');
 assert.equal(lines[lines.length-1],'restore');
 assert.ok(lines.filter(x=>x==='fill').length>=4);
 assert.ok(lines.filter(x=>x==='stroke').length>=10);
 assert.doesNotThrow(()=>drawV20FloorAtmosphere(null,0));
});
test('P0.8 painted material assets remain independent from controls and content',()=>{
 const app=readFileSync(resolve(dir,'app.mjs'),'utf8');
 const css=readFileSync(resolve(dir,'v20-royal-material.css'),'utf8');
 assert.match(app,/drawV20FloorAtmosphere\(ctx,now/);
 assert.match(css,/royal-nav-frame\.webp/);
 assert.match(css,/royal-pay-frame\.webp/);
 assert.match(css,/royal-loot-frame\.webp/);
 assert.doesNotMatch(css,/pointer-events\s*:\s*none\s*!important;\s*$/m);
 for(const name of ['royal-nav-frame','royal-pay-frame','royal-loot-frame']){
  const buf=readFileSync(resolve(dir,'../art/v20/runtime/ui/'+name+'.webp'));
  assert.equal(buf.toString('ascii',0,4),'RIFF');
  assert.equal(buf.toString('ascii',8,12),'WEBP');
  assert.ok(buf.length>1000 && buf.length<50000,'mobile-friendly frame');
 }
});
