import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {V20_ART_COUNTS,v20ArtParticle,initV20ArtLive} from './v20-art-live.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const read=path=>readFileSync(resolve(here,path),'utf8');

test('V20 ambient illustration never requires DOM in the pure Node rules tests',()=>{
 assert.equal(initV20ArtLive(),null);
 assert.deepEqual(Object.keys(V20_ART_COUNTS),['town','battle']);
 assert.ok(V20_ART_COUNTS.town>0&&V20_ART_COUNTS.battle>0);
});
test('V20 ambient particles remain deterministic, in-bounds, independent of rewards',()=>{
 for(const kind of ['town','battle'])for(const time of [0,400,3000,60000,3600000]){
  for(let i=0;i<V20_ART_COUNTS[kind];i++){
   const p=v20ArtParticle(i,time,kind);
   assert.deepEqual(p,v20ArtParticle(i,time,kind));
   assert.ok(p.x>=0&&p.x<1,'x '+kind+' '+i);
   assert.ok(p.y>=0&&p.y<1,'y '+kind+' '+i);
   assert.ok(p.size>0);
   assert.ok(['mote','paper','petal'].includes(p.type));
   assert.equal(Object.hasOwn(p,'gold'),false);
  }
 }
});
test('V20 production page uses separate art layers, no full reference screenshot',()=>{
 const html=read('./play.html');
 const css=read('./v20-art-live.css');
 assert.match(html,/id="v20-town-ambient"/);
 assert.match(html,/id="v20-battle-ambient"/);
 assert.match(html,/v20-ornament-town/);
 assert.match(html,/v20-ornament-battle/);
 assert.match(html,/v20-battle-furnishings/);
 assert.match(html,/v20-art-live\.mjs/);
 assert.match(html,/v20-art-live\.css/);
 assert.match(css,/office-blooms\.svg/);
 assert.match(css,/battle-arcane\.svg/);
 assert.match(css,/battle-furnishings\.svg/);
 assert.doesNotMatch(css,/portrait-home-master\.webp|home-master\.webp/);
 assert.ok(html.includes('id="today"')&&html.includes('id="world"')&&html.includes('id="town-hero"'));
});
test('V20 illustrated props are transparent images, no painted-on characters or labels',()=>{
 for(const path of [
  '../art/v20/runtime/foreground/office-blooms.svg',
  '../art/v20/runtime/foreground/battle-arcane.svg',
  '../art/v20/runtime/foreground/battle-furnishings.svg'
 ]){
  const svg=read(path);
  assert.match(svg,/^<svg /);
  assert.match(svg,/<\/svg>$/);
  assert.doesNotMatch(svg,/<rect[^>]*width="(?:720|960)"[^>]*height="(?:560|620)"/);
  assert.doesNotMatch(svg,/<text\b|foreignObject\b/);
 }
});

test('V20 painted backgrounds are actual game runtime files and never baked screenshots',()=>{
 const app=read('./app.mjs');
 const css=read('./v20-art-live.css');
 const battle=read('../art/v20/runtime/backgrounds/corridor-v20-painterly.svg');
 const town=read('../art/v20/runtime/backgrounds/office-v20-painterly.svg');
 assert.match(app,/bg:trainingWave!==null\?.*corridor-v20-painterly\.svg/);
 assert.match(css,/office-v20-painterly\.svg/);
 assert.match(css,/corridor-v20-painterly\.svg/);
 assert.match(app,/world\.dataset\.sceneArt/);
 for(const [source,width,height] of [[town,960,560],[battle,720,620]]){
  assert.match(source,new RegExp('viewBox="0 0 '+width+' '+height+'"'));
  assert.match(source,/id="v20-illustration-pass"/);
  assert.match(source,/id="v20-fantasy-window"/);
  assert.match(source,/id="v20-castle-clip"/);
  assert.match(source,/v20-pigment/);
  assert.doesNotMatch(source,/<text[\s>]|<foreignObject[\s>]/);
 }
});
