import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALL_ENEMIES,ELITE_ENEMIES,BOSSES} from './roster.mjs';
import {validateMonsterAtlasRecord,validateMonsterAtlasManifest,validateSpritePixels,inspectAtlasFrameArt,
 spriteFrameIndex,drawMonsterAtlasFrame,selectMonsterAtlasAction,MIN_MONSTER_FRAMES} from './sprite-atlas.mjs';
const sample=(id='paper-gremlin',tier='normal')=>{
 const states={};
 const names=tier==='normal'?['idle','attack','hurt','defeat']:['idle','attack','hurt','defeat','special'];
 for(const state of names){const frames=MIN_MONSTER_FRAMES[state];states[state]={
  src:'../art/v19/runtime/monsters/'+id+'/'+state+'.png',
  frames,cell:512,durations:Array(frames).fill(100)};}
 return {id,approved:true,states};
};
test('invalid geometric/poster or missing actual sprite frames cannot be approved',()=>{
 assert.ok(validateMonsterAtlasRecord(null).length);
 assert.ok(validateMonsterAtlasRecord({id:'paper-gremlin',approved:true,states:{}}).length);
 const invalid=sample();invalid.states.attack.src='../art/poster.png';
 assert.ok(validateMonsterAtlasRecord(invalid).some(e=>e.includes('invalid artwork path')));
 const tooFew=sample();tooFew.states.attack.frames=1;
 assert.ok(validateMonsterAtlasRecord(tooFew).some(e=>e.includes('not enough actual drawn poses')));
 const unapproved=sample();unapproved.approved=false;
 assert.ok(validateMonsterAtlasRecord(unapproved).some(e=>e.includes('human approval')));
 assert.deepEqual(validateMonsterAtlasRecord(sample()),[]);
 assert.deepEqual(validateMonsterAtlasRecord(sample('audit-knight','elite'),'elite'),[]);
});
test('frame lookup uses durations, not whole-sprite wobble',()=>{
 assert.equal(spriteFrameIndex([100,90,110,120],0,true),0);
 assert.equal(spriteFrameIndex([100,90,110,120],105,false),1);
 assert.equal(spriteFrameIndex([100,90,110,120],192,false),2);
 assert.equal(spriteFrameIndex([100,90,110,120],500,false),3);
 assert.equal(spriteFrameIndex([100,90,110,120],500,true),0);
});
test('runtime image must decode real atlas pixels before playing',()=>{
 const r={cell:512,frames:5,durations:[100,100,100,100,100]},calls=[];
 const img={naturalWidth:2560,naturalHeight:512};
 assert.equal(validateSpritePixels({...img,naturalWidth:2559},r).ok,false);
 assert.equal(validateSpritePixels(img,r).ok,true);
 assert.equal(drawMonsterAtlasFrame({drawImage:(...args)=>calls.push(args)},img,r,8,11,111,222,380),true);
 assert.equal(calls.length,1);assert.equal(calls[0][1],1536);
});
test('pixel QA rejects duplicated or translated still frames',()=>{
 const r={cell:512,frames:5,durations:Array(5).fill(100)};
 const fakeImage={naturalWidth:2560,naturalHeight:512};
 // Mock five equally painted frames, representing a copied pose.
 const data=new Uint8ClampedArray(96*96*4);
 for(let y=12;y<84;y++)for(let x=14;x<82;x++){
  const p=(y*96+x)*4;data[p]=190;data[p+1]=140;data[p+2]=110;data[p+3]=255;
 }
 const factory=()=>({getContext:()=>({
  clearRect:()=>{},drawImage:()=>{},getImageData:()=>({data})
 })});
 const errors=inspectAtlasFrameArt(fakeImage,r,'attack',factory);
 assert.ok(errors.some(e=>e.includes('duplicated or rigidly translated')));
 assert.ok(!errors.some(e=>e.includes('blank/tiny')));
});
test('retaliation and hurt timing are sequenced after hero contact',()=>{
 assert.equal(selectMonsterAtlasAction({type:'hit',retaliationDamage:4},300).state,'idle');
 assert.equal(selectMonsterAtlasAction({type:'hit',retaliationDamage:4},500).state,'hurt');
 assert.equal(selectMonsterAtlasAction({type:'victory'},500).state,'defeat');
 assert.equal(selectMonsterAtlasAction({type:'hit',retaliationDamage:4},950).state,'attack');
 assert.equal(selectMonsterAtlasAction({type:'hit',enemySkill:'首領狂暴',retaliationDamage:4},950).state,'special');
});
test('do not silently promote 32 existing programmatic silhouettes',()=>{
 const m=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8'));
 const tiers=Object.fromEntries(ALL_ENEMIES.map(e=>[e.id,BOSSES.includes(e)?'boss':ELITE_ENEMIES.includes(e)?'elite':'normal']));
 assert.deepEqual(validateMonsterAtlasManifest(m,tiers),[]);
 assert.equal(Object.keys(m.monsters).length,0);
});
