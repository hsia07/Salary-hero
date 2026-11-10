import test from 'node:test';
import assert from 'node:assert/strict';
import {HIT_FEEDBACK_MS} from './hurt-effects.mjs';
import {CHIBI_ATTACK_V2_TOTAL_MS} from './attack-timing.mjs';
import {paperCombatPoseAt,paperHitFlashAt,paperAttackFxAt,drawPaperHitTint,
 PAPER_HERO_HIT_MS,PAPER_RETALIATE_START_MS,PAPER_PROJECTILE_LAUNCH_MS,
 PAPER_PROJECTILE_IMPACT_MS,PAPER_ATTACK_END_MS,PAPER_ATTACK_POSE_MS} from './paper-combat.mjs';
import {readFileSync} from 'node:fs';

const struck={type:'hit',retaliationDamage:6};
test('five illustrated attack frames have anticipation, held release and complete recovery',()=>{
 assert.equal(PAPER_ATTACK_POSE_MS.length,5);
 assert.equal(PAPER_ATTACK_POSE_MS.reduce((a,b)=>a+b,0),620);
 assert.ok(PAPER_ATTACK_POSE_MS[2]>=48,'impact frame must include brief hit stop');
 assert.equal(paperCombatPoseAt(350,struck).state,'idle');
 assert.equal(paperCombatPoseAt(405,struck).state,'hurt');
 assert.equal(paperCombatPoseAt(650,struck).state,'hurt');
 assert.equal(paperCombatPoseAt(PAPER_RETALIATE_START_MS,struck).state,'attack');
 assert.equal(paperCombatPoseAt(1200,struck).state,'attack');
 assert.equal(paperCombatPoseAt(PAPER_ATTACK_END_MS,struck).state,'idle');
 assert.equal(paperCombatPoseAt(900,{type:'hit',retaliationDamage:0}).state,'idle');
 assert.equal(paperCombatPoseAt(405,{type:'victory'}).state,'defeat');
 assert.equal(paperCombatPoseAt(1040,{type:'victory'}).state,'defeat');
 assert.equal(paperCombatPoseAt(1100,{type:'victory'}).state,'idle');
});
test('paper shuriken launches before impact and hero flashes only after projectile arrival',()=>{
 assert.ok(PAPER_RETALIATE_START_MS>=CHIBI_ATTACK_V2_TOTAL_MS);
 assert.ok(PAPER_PROJECTILE_LAUNCH_MS>PAPER_RETALIATE_START_MS);
 assert.ok(PAPER_PROJECTILE_IMPACT_MS>PAPER_PROJECTILE_LAUNCH_MS);
 const pre=paperAttackFxAt(PAPER_PROJECTILE_LAUNCH_MS-1);
 assert.equal(pre.projectile,false);
 const flight=paperAttackFxAt(PAPER_PROJECTILE_LAUNCH_MS+40);
 assert.equal(flight.projectile,true);
 assert.ok(flight.flight>0&&flight.flight<1);
 const impact=paperAttackFxAt(PAPER_PROJECTILE_IMPACT_MS);
 assert.equal(impact.projectile,false);
 assert.equal(impact.burst,1);
 assert.equal(paperAttackFxAt(PAPER_ATTACK_END_MS).active,false);
 assert.ok(PAPER_PROJECTILE_IMPACT_MS+HIT_FEEDBACK_MS+70>=1800,
   'next attack must not cut off advanced hero hurt');
});
test('the monster itself flashes silhouette white, then scarlet red twice, and recovers',()=>{
 assert.deepEqual(paperHitFlashAt(PAPER_HERO_HIT_MS-1),{white:0,red:0,burst:0,hitStop:false});
 const white=paperHitFlashAt(PAPER_HERO_HIT_MS+5);
 assert.ok(white.white>.5);
 assert.equal(white.red,0);
 assert.equal(white.hitStop,true);
 const red=paperHitFlashAt(PAPER_HERO_HIT_MS+70);
 assert.ok(red.red>.5);
 assert.equal(red.white,0);
 const rebound=paperHitFlashAt(PAPER_HERO_HIT_MS+165);
 assert.ok(rebound.red>.2);
 const done=paperHitFlashAt(PAPER_HERO_HIT_MS+246);
 assert.equal(done.red,0);assert.equal(done.white,0);
 assert.ok(paperHitFlashAt(PAPER_HERO_HIT_MS+70,{reducedMotion:true}).red<red.red);
});
test('white/red overlay uses source-in against only the illustrated monster alpha',()=>{
 const painted=[],overlays=[];
 const prior=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({
  drawImage:()=>{},fillRect:()=>{},set globalCompositeOperation(v){painted.push(v)},
  set fillStyle(v){painted.push(v)}
 })})};
 try{
  const screen={globalAlpha:1,save:()=>{},restore:()=>{},drawImage:(...args)=>overlays.push(args)};
  const img={};
  const rect={x:-44,y:12,w:282,h:282};
  assert.equal(drawPaperHitTint(screen,img,{cell:320},0,rect,PAPER_HERO_HIT_MS+7),true);
  assert.equal(drawPaperHitTint(screen,img,{cell:320},1,rect,PAPER_HERO_HIT_MS+64),true);
  assert.equal(drawPaperHitTint(screen,img,{cell:320},1,rect,PAPER_HERO_HIT_MS+400),false);
  assert.equal(overlays.length,2,'white and red must both reach the canvas');
  assert.ok(painted.includes('source-in'),'tint must follow actual PNG silhouette');
  assert.ok(painted.includes('#fff9f5'));
  assert.ok(painted.includes('#ff383e'));
 }finally{globalThis.document=prior;}
});
test('deployed monster data keeps actual PNG dimensions and timing aligned with combat',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
 const pose=manifest.monsters['paper-gremlin'];
 assert.deepEqual(pose.states.attack.durations,[150,130,70,90,180]);
 assert.deepEqual(pose.states.hurt.durations,[90,160,150]);
 assert.equal(pose.states.attack.frames,5);
 assert.equal(pose.states.hurt.frames,3);
});
