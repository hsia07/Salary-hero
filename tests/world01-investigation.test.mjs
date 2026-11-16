import test from 'node:test';
import assert from 'node:assert/strict';
import {initialB2Investigation,chooseB2Investigation,b2CurrentScene,loadB2Investigation,saveB2Investigation,B2_SAVE_KEY} from '../v19/world01-investigation.mjs';
test('B2 investigation requires evidence-safe conclusion',()=>{
 let s=initialB2Investigation();
 s=chooseB2Investigation(s,'inspect-door');
 s=chooseB2Investigation(s,'record-door');
 s=chooseB2Investigation(s,'compare');
 s=chooseB2Investigation(s,'locked');
 assert.equal(s.completed,false);
 assert.equal(s.step,'correction');
 s=chooseB2Investigation(s,'retry');
 s=chooseB2Investigation(s,'unknown');
 assert.equal(s.completed,true);
 assert.equal(b2CurrentScene(s).id,'complete');
});
test('unrecognized choices cannot skip investigation',()=>{
 const s=initialB2Investigation();
 assert.deepEqual(chooseB2Investigation(s,'unknown'),s);
});
test('B2 progress uses separate storage and does not touch legacy Tieshi saves',()=>{
 const m=new Map([['salary-hero:tieshi-story:v1','legacy']]);
 const storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 const s=chooseB2Investigation(initialB2Investigation(),'inspect-note');
 saveB2Investigation(storage,s);
 assert.equal(m.get('salary-hero:tieshi-story:v1'),'legacy');
 assert.equal(m.has(B2_SAVE_KEY),true);
 assert.equal(loadB2Investigation(storage).step,'note');
});
test('corrupt save safely returns opening',()=>assert.equal(loadB2Investigation({getItem:()=>'{oops'}).step,'corridor'));
