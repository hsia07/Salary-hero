import test from 'node:test';
import assert from 'node:assert/strict';
import {animationFrame,validateAnimationImages,SALARYMAN_ANIMATIONS} from './salaryman-animation.mjs';
test('idle cycles two frames',()=>{
 assert.equal(animationFrame('idle',0),'idle-01');
 assert.equal(animationFrame('idle',340),'idle-02');
 assert.equal(animationFrame('idle',680),'idle-01');
});
test('approved walk alternates two frames',()=>{assert.equal(animationFrame('walk',0),'walk-01');assert.equal(animationFrame('walk',180),'walk-02');assert.equal(animationFrame('walk',360),'walk-01')});
test('approved sleep alternates two frames',()=>{assert.equal(animationFrame('sleep',0),'sleep-01');assert.equal(animationFrame('sleep',500),'sleep-02')});
test('attack holds last frame',()=>assert.equal(animationFrame('attack',999),'attack-03'));
test('rejects invalid actions',()=>assert.throws(()=>animationFrame('missing',0),/Unknown animation/));
test('rejects incomplete sprite sets',()=>assert.equal(validateAnimationImages(new Map()).ready,false));
test('accepts all eleven named frames',()=>{
 const images=new Map(Object.values(SALARYMAN_ANIMATIONS).flatMap(a=>a.frames).map(f=>[f,{}]));
 assert.equal(validateAnimationImages(images).ready,true);
});
