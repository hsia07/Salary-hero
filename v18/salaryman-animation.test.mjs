import test from 'node:test';
import assert from 'node:assert/strict';
import {animationFrame,validateAnimationImages,SALARYMAN_ANIMATIONS} from './salaryman-animation.mjs';
test('idle cycles two frames',()=>{
 assert.equal(animationFrame('idle',0),'idle-01');
 assert.equal(animationFrame('idle',340),'idle-02');
 assert.equal(animationFrame('idle',680),'idle-01');
});
test('attack holds last frame',()=>assert.equal(animationFrame('attack',999),'attack-03'));
test('rejects invalid actions',()=>assert.throws(()=>animationFrame('missing',0),/Unknown animation/));
test('rejects incomplete sprite sets',()=>assert.equal(validateAnimationImages(new Map()).ready,false));
test('accepts all eleven named frames',()=>{
 const images=new Map(Object.values(SALARYMAN_ANIMATIONS).flatMap(a=>a.frames).map(f=>[f,{}]));
 assert.equal(validateAnimationImages(images).ready,true);
});
