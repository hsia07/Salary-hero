import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ALL_ENEMIES} from './roster.mjs';
import {validateSpritePixels} from './sprite-atlas.mjs';
import {paperHitFlashAt,PAPER_HERO_HIT_MS} from './paper-combat.mjs';
import {guardCombatPoseAt,guardBeamAt,GUARD_HERO_HIT_MS,GUARD_ATTACK_START_MS,GUARD_BEAM_LAUNCH_MS,GUARD_BEAM_IMPACT_MS,GUARD_ATTACK_END_MS,GUARD_ATTACK_POSE_MS,GUARD_DEFEAT_FADE_START_MS,GUARD_DEFEAT_END_MS,GUARD_LOCK_START_MS,guardTargetLockAt,guardCombatCaptionAt} from './guard-combat.mjs';

const root=new URL('../art/v19/candidates/monsters/chair-golem/',import.meta.url);
const source={
 idle:{frames:4,sha:'20cd175c8d316cb4c7a4fb55d60b3f24875c422073a5cb0364de61e4dbb686ad'},
 attack:{frames:5,sha:'8a845134b5bb8ab84e1b5f62fde99ea74188912a9d691b7bf4104e2289e09c17'},
 hurt:{frames:3,sha:'c987520bc047819ee4854b48153946b199cb2b7a4812f5d63af20b795df1a22b'},
 defeat:{frames:4,sha:'473bc976630711e15aa435380bae66db9d5578c3c734b07e38ed1f24a5e001ac'}
};
test('16 original mech sprite poses really exist as four WebP binary atlases',()=>{
 for(const [name,{sha}] of Object.entries(source)){
  const data=readFileSync(new URL(name+'.webp',root));
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(data).digest('hex'),sha);
 }
});
test('normal-tier mech is candidate ONLY, never fake approved 3/32',()=>{
 const c=JSON.parse(readFileSync(new URL('manifest-candidate.json',root),'utf8'));
 const m=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
 assert.ok(ALL_ENEMIES.find(e=>e.id==='chair-golem'&&e.name==='打卡保全機兵'));
 assert.equal(c.id,'chair-golem');assert.equal(c.approved,false);assert.equal(c.previewOnly,true);
 assert.equal(c.tier,'normal');assert.equal(c.special,undefined);
 assert.equal(m.monsters['chair-golem'],undefined);assert.equal(Object.keys(m.monsters).length,2);
 for(const [name,{frames,sha}] of Object.entries(source)){
  const f=c.states[name];
  assert.equal(f.frames,frames);assert.equal(f.cell,384);assert.equal(f.ground_y,342);
  assert.equal(f.durations.length,frames);assert.equal(f.sha256,sha);
  assert.ok(f.src.endsWith('/chair-golem/'+name+'.webp'));
  assert.equal(validateSpritePixels({naturalWidth:384*frames,naturalHeight:384},f).ok,true);
 }
});
test('guard plays unique attack/hurt/shatter poses with no projectile on victory',()=>{
 const hit={type:'hit',retaliationDamage:7};
 assert.equal(GUARD_ATTACK_POSE_MS.length,5);
 assert.equal(GUARD_ATTACK_POSE_MS.reduce((a,b)=>a+b,0),650);
 assert.equal(guardCombatPoseAt(404,hit).state,'idle');
 assert.equal(guardCombatPoseAt(405,hit).state,'hurt');
 assert.equal(guardCombatPoseAt(803,hit).state,'hurt');
 assert.equal(guardCombatPoseAt(GUARD_ATTACK_START_MS,hit).state,'attack');
 assert.equal(guardCombatPoseAt(1200,hit).state,'attack');
 assert.equal(guardCombatPoseAt(GUARD_ATTACK_END_MS,hit).state,'idle');
 assert.equal(guardCombatPoseAt(950,{type:'hit',retaliationDamage:0}).state,'idle');
 assert.equal(guardCombatPoseAt(405,{type:'victory'}).state,'defeat');
 assert.equal(guardCombatPoseAt(1189,{type:'victory'}).state,'defeat');
 assert.equal(guardCombatPoseAt(1190,{type:'victory'}).state,'defeat');
 assert.equal(guardCombatPoseAt(1300,{type:'victory'}).progress,1);
 assert.ok(GUARD_DEFEAT_FADE_START_MS>1100,'dead mech should hold intact for review before fading');
 assert.equal(guardCombatPoseAt(GUARD_DEFEAT_END_MS-1,{type:'victory'}).state,'defeat');
 assert.equal(guardCombatPoseAt(GUARD_DEFEAT_END_MS,{type:'victory'}).state,'idle');
});
test('red scanner has actual launch, travel and impact with no postmortem beam',()=>{
 assert.ok(GUARD_BEAM_LAUNCH_MS>GUARD_ATTACK_START_MS);
 assert.ok(GUARD_BEAM_IMPACT_MS>GUARD_BEAM_LAUNCH_MS);
 assert.equal(guardBeamAt(GUARD_BEAM_LAUNCH_MS-1).projectile,false);
 const flight=guardBeamAt(GUARD_BEAM_LAUNCH_MS+35);
 assert.equal(flight.projectile,true);assert.ok(flight.beam>0&&flight.beam<1);
 assert.equal(guardBeamAt(GUARD_BEAM_IMPACT_MS).impact,1);
 assert.equal(guardBeamAt(GUARD_BEAM_IMPACT_MS,false).active,false);
 assert.equal(guardBeamAt(GUARD_ATTACK_END_MS).active,false);
 assert.equal(GUARD_HERO_HIT_MS,405);
});

test('low-FPS security armor has continuous red impact while approved paper/cup pulses remain unchanged',()=>{
 const age=136;
 const original=paperHitFlashAt(PAPER_HERO_HIT_MS+age);
 const guard=paperHitFlashAt(PAPER_HERO_HIT_MS+age,{extendedRed:true});
 assert.equal(original.red,0,'original paper and coffee retain the approved two-flash gap');
 assert.ok(guard.red>.5,'mechanical armor must still be visibly red at sparse mobile frame');
 assert.ok(paperHitFlashAt(PAPER_HERO_HIT_MS+190,{extendedRed:true}).red>0);
 assert.equal(paperHitFlashAt(PAPER_HERO_HIT_MS+226,{extendedRed:true}).red,0);
 assert.ok(paperHitFlashAt(PAPER_HERO_HIT_MS+136,{extendedRed:true,reducedMotion:true}).red<guard.red);
});

test('security target-lock is a separately animated warning that ends on actual beam contact',()=>{
 assert.equal(guardTargetLockAt(GUARD_LOCK_START_MS-1).active,false);
 const entering=guardTargetLockAt(GUARD_LOCK_START_MS);
 assert.equal(entering.active,true);assert.ok(entering.strength>0);
 const charging=guardTargetLockAt(1015),flying=guardTargetLockAt(1135);
 assert.ok(charging.closing>entering.closing);
 assert.ok(flying.closing>charging.closing);
 assert.equal(guardTargetLockAt(GUARD_BEAM_IMPACT_MS).active,false);
 assert.equal(guardTargetLockAt(1015,false).active,false);
 assert.equal(guardCombatCaptionAt(500,{type:'hit',retaliationDamage:8}),'機兵受擊・紅白閃爍');
 assert.match(guardCombatCaptionAt(1015,{type:'hit',retaliationDamage:8}),/鎖定/);
 assert.match(guardCombatCaptionAt(1135,{type:'hit',retaliationDamage:8}),/飛行中/);
 assert.match(guardCombatCaptionAt(1260,{type:'hit',retaliationDamage:8}),/勇者受擊/);
 assert.match(guardCombatCaptionAt(1320,{type:'victory'}),/最後一格/);
 assert.equal(guardCombatCaptionAt(1320,{type:'hit',retaliationDamage:0}),'反擊未觸發・等待下一擊');
});
