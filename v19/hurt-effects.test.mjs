import test from 'node:test';
import assert from 'node:assert/strict';
import {HIT_STOP_MS,HIT_FEEDBACK_MS,HIT_SPARK_COUNT,hurtEffectAt,hurtPlaybackAt} from './hurt-effects.mjs';

test('total injury response includes a short 48ms frozen pose followed by five real hurt frames',()=>{
 assert.equal(HIT_STOP_MS,48);
 assert.equal(HIT_FEEDBACK_MS,598);
 assert.equal(HIT_SPARK_COUNT,8);
 for(const t of [0,12,22,47]){
   const v=hurtEffectAt(t);
   assert.equal(v.frame,0);
   assert.equal(v.hitStop,true);
   assert.equal(v.shakeX,0);
 }
 assert.equal(hurtEffectAt(48).hitStop,false);
 assert.equal(hurtEffectAt(48).frame,0);
 assert.equal(hurtEffectAt(122).frame,0);
 assert.equal(hurtEffectAt(123).frame,1);
 assert.equal(hurtEffectAt(598).active,false);
 assert.equal(hurtEffectAt(598).frame,-1);
});
test('red-white flash is momentary and confined to the damage window',()=>{
 const initial=hurtEffectAt(5),red=hurtEffectAt(28),tail=hurtEffectAt(120),cleared=hurtEffectAt(175);
 assert.equal(initial.flashColor,'#fff2ee');
 assert.ok(initial.flashAlpha>.6);
 assert.equal(red.flashColor,'#ff4348');
 assert.ok(red.flashAlpha>.45);
 assert.equal(tail.flashColor,'#cf2d47');
 assert.ok(tail.flashAlpha<red.flashAlpha);
 assert.equal(cleared.flashAlpha,0);
 assert.equal(hurtEffectAt(500).flashAlpha,0);
});
test('shake is 12px max, only after hitstop, fades quickly and respects reduced motion',()=>{
 const freeze=hurtEffectAt(25);
 assert.equal(freeze.shakeX,0);
 for(let t=0;t<150;t++){
   const fx=hurtEffectAt(t);
   assert.ok(Math.abs(fx.shakeX)<=12.001);
   assert.ok(Math.abs(fx.shakeY)<=4.801);
 }
 assert.equal(hurtEffectAt(160).shakeX,0);
 assert.equal(hurtEffectAt(160).shakeY,0);
 const reduced=hurtEffectAt(80,{reducedMotion:true});
 assert.equal(reduced.shakeX,0);
 assert.equal(reduced.shakeY,0);
 assert.ok(reduced.flashAlpha<=.35);
});
test('localized impact sparks are brief and fade out before 175ms',()=>{
 assert.ok(hurtEffectAt(20).sparkAlpha>0);
 assert.ok(hurtEffectAt(100).sparkAlpha>hurtEffectAt(150).sparkAlpha);
 assert.equal(hurtEffectAt(175).sparkAlpha,0);
 assert.equal(hurtEffectAt(590).sparkAlpha,0);
});
test('only a real retaliation starts automatic hurt visual; manual preview is isolated',()=>{
 const start=2000,attackMs=805,now=start+attackMs;
 assert.equal(hurtPlaybackAt(now,start,1,attackMs,false).active,false);
 assert.equal(hurtPlaybackAt(now,start,1,attackMs,true).source,'retaliation');
 assert.equal(hurtPlaybackAt(now,start,1,attackMs,true).hitStop,true);
 assert.equal(hurtPlaybackAt(start+attackMs-1,start,1,attackMs,true).active,false);
 assert.equal(hurtPlaybackAt(start+attackMs+598,start,1,attackMs,true).active,false);
 assert.equal(hurtPlaybackAt(2300,1800,1,805,false,2200).source,'manual');
 assert.equal(hurtPlaybackAt(2500,1800,1,805,false,0).source,'none');
});
test('2x speed timing is consistent with 1x; visual-only preview is real-time',()=>{
 const start=1000,attack=805;
 assert.equal(hurtPlaybackAt(start+attack/2,start,2,attack,true).hitStop,true);
 assert.equal(hurtPlaybackAt(start+(attack+200)/2,start,2,attack,true).frame,
              hurtPlaybackAt(start+attack+200,start,1,attack,true).frame);
 assert.equal(hurtPlaybackAt(start+(attack+598)/2,start,2,attack,true).active,false);
 const visual=hurtPlaybackAt(1300,900,2,805,false,1250);
 assert.equal(visual.source,'manual');
 assert.equal(visual.frame,0);
});
test('NaN/Infinity/negative inputs do not expose an endless hit effect',()=>{
 assert.equal(hurtEffectAt(Infinity).active,false);
 assert.equal(hurtEffectAt(NaN).active,false);
 assert.equal(hurtEffectAt(-3).frame,0);
 assert.equal(hurtPlaybackAt(1,NaN,1,805,true).active,false);
});
