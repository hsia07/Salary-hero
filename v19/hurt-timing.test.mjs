import test from 'node:test';
import assert from 'node:assert/strict';
import {CHIBI_HURT_MS,CHIBI_HURT_TOTAL_MS,hurtFrameAt,validateHurtAtlas,shouldRecoil} from './hurt-timing.mjs';
test('five independent hurt poses have exactly 550ms duration',()=>{
 assert.deepEqual(CHIBI_HURT_MS,[75,110,100,135,130]);
 assert.equal(CHIBI_HURT_TOTAL_MS,550);
});
test('the hurt frames switch at correct boundaries without cross-fading',()=>{
 const t=[0,74,75,184,185,284,285,419,420,549,550,999,-3,NaN];
 assert.deepEqual(t.map(hurtFrameAt),[0,0,1,1,2,2,3,3,4,4,-1,-1,0,0]);
});
test('both full-quality 512 and 384 WebP atlas sizes accepted, wrong sizes rejected',()=>{
 assert.equal(validateHurtAtlas(2560,512),512);
 assert.equal(validateHurtAtlas(1920,384),384);
 for(const [w,h] of [[128,128],[640,128],[2560,384],[2048,512],[0,0]])
  assert.equal(validateHurtAtlas(w,h),0);
});
test('recoil only happens after actual enemy retaliation damage',()=>{
 assert.equal(shouldRecoil(100,93,{type:'hit'}),true);
 assert.equal(shouldRecoil(100,100,{type:'hit'}),false);
 assert.equal(shouldRecoil(100,110,{type:'hit'}),false);
 assert.equal(shouldRecoil(100,93,{type:'victory'}),false);
 assert.equal(shouldRecoil(NaN,93,{type:'hit'}),false);
 assert.equal(shouldRecoil(100,93,null),false);
});
