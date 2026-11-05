import test from 'node:test';
import assert from 'node:assert/strict';
import {declaredAssets,preloadArt} from './art-loader.mjs';
const manifest={referenceOnly:'art/v18/home-master.webp',renderPolicy:{neverUseReferenceAsBattleBackground:true},assets:{battleBackground:{path:'art/v18/runtime/backgrounds/arena.webp'},hero:{idle:'art/v18/runtime/hero/idle.webp'}}};
test('accepts isolated production art paths',()=>assert.equal(declaredAssets(manifest).length,2));
test('rejects concept master used as live sprite',()=>assert.throws(()=>declaredAssets({...manifest,assets:{hero:{idle:manifest.referenceOnly}}}),/Master reference/));
test('rejects assets outside runtime folder',()=>assert.throws(()=>declaredAssets({...manifest,assets:{hero:{idle:'art/hero-idle.svg'}}}),/outside isolated directory|Duplicate/));
test('rejects duplicated image paths',()=>assert.throws(()=>declaredAssets({...manifest,assets:{a:'art/v18/runtime/a.webp',b:'art/v18/runtime/a.webp'}}),/Duplicate/));
test('missing art fails atomically and releases loaded bitmaps',async()=>{
 let released=0;
 const fetcher=async url=>{
  const path=String(url);
  if(path.endsWith('runtime-manifest.json'))return {ok:true,json:async()=>manifest};
  if(path.endsWith('/hero/idle.webp'))return {ok:false,status:404};
  return {ok:true,blob:async()=>({})};
 };
 await assert.rejects(preloadArt({fetcher,decoder:async()=>({width:100,height:100,close(){released++}})}),/Missing art/);
 assert.equal(released,1);
});
test('successful load exposes and disposes both assets',async()=>{
 let released=0;
 const fetcher=async url=>String(url).endsWith('runtime-manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,blob:async()=>({})};
 const pack=await preloadArt({fetcher,decoder:async()=>({width:64,height:64,close(){released++}})});
 assert.equal(pack.images.size,2);pack.dispose();assert.equal(released,2);
});
