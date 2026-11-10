import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,normalize,enemyFor,loopEnemyFor,transition} from './engine.mjs';
import {SKINS,SKIN_EVENTS,drawPool,SKIN_RARITIES} from './skins.mjs';

const monday=Date.parse('2026-11-09T05:00:00Z');
const friday=Date.parse('2026-11-13T05:00:00Z');
test('starter is the only default outfit, all other skins start locked',()=>{
 const s=initial();
 assert.deepEqual(s.ownedSkins,['starter']);
 assert.equal(s.activeSkin,'starter');
 assert.equal(SKINS.length,16);
 assert.equal(SKINS.filter(x=>x.source==='starter').length,1);
});
test('only activity or lottery sources are allowed for nonstarter styles',()=>{
 for(const style of SKINS.filter(s=>s.id!=='starter'))
   assert.ok(style.source==='draw'||SKIN_EVENTS.some(ev=>ev.id===style.source));
});
test('locked cosmetic cannot be equipped by direct action',()=>{
 const s=transition(initial(),{type:'equipSkin',id:'vampire'});
 assert.equal(s.activeSkin,'starter');
 assert.deepEqual(s.ownedSkins,['starter']);
});
test('tickets cannot be spent if empty and cannot be bought with game gold',()=>{
 const s=initial();s.gold=999999;
 assert.deepEqual(transition(s,'drawSkin',()=>0,monday).ownedSkins,['starter']);
 assert.equal(transition(s,{type:'buySkin',id:'alien'}).skinTickets,0);
});
test('boss battle grants one skin draw ticket',()=>{
 let s=transition(initial(),{type:'mode',id:'dungeon'},()=>.9,monday);
 s.wave=4;s.modeWaves.dungeon=4;s.enemy={...loopEnemyFor(4,'dungeon',monday),hp:1};
 const n=transition(s,'attack',()=>.9,monday);
 assert.equal(n.wave,5);assert.equal(n.skinTickets,1);assert.equal(n.activityDaily.wins,1);
});
test('daily encounter grants one ticket exactly once',()=>{
 let s=transition(initial(),'encounterStart',()=>.9,monday);
 s=transition(s,{type:'encounterChoose',choice:0},()=>.9,monday);
 assert.equal(s.skinTickets,1);
 const n=transition(s,'encounterStart',()=>.9,monday);
 assert.equal(n.skinTickets,1);
});
test('single draw consumes exactly one ticket and does not draw an event exclusive',()=>{
 const s=initial();s.skinTickets=2;
 const n=transition(s,'drawSkin',()=>.8,monday);
 assert.equal(n.skinTickets,1);assert.equal(n.skinDraws,1);
 assert.equal(n.ownedSkins.length,2);
 assert.ok(SKINS.some(x=>x.id===n.last.id&&x.source==='draw'));
});
test('draws are duplicate-free and tickets are not spent after pool completion',()=>{
 let s=initial();s.skinTickets=20;
 for(let i=0;i<13;i++)s=transition(s,'drawSkin',()=>.01,monday);
 assert.equal(s.ownedSkins.length,14);
 assert.equal(new Set(s.ownedSkins).size,14);
 assert.equal(s.skinTickets,7);
 const n=transition(s,'drawSkin',()=>.01,monday);
 assert.equal(n.skinTickets,7);
});
test('equipped skin and owned inventory persist in saves',()=>{
 let s=initial();s.skinTickets=1;
 s=transition(s,'drawSkin',()=>.01,monday);
 const id=s.last.id;
 s=transition(s,{type:'equipSkin',id});
 assert.equal(normalize(JSON.parse(JSON.stringify(s))).activeSkin,id);
});
test('Monday event requires Monday and three same-day victories',()=>{
 const s=initial();
 assert.equal(transition(s,{type:'claimSkinEvent',id:'monday-survival'},()=>.9,monday).ownedSkins.length,1);
 const ready={...s,activityDaily:{day:'2026-11-09',wins:3,bosses:0}};
 const claimed=transition(ready,{type:'claimSkinEvent',id:'monday-survival'},()=>.9,monday);
 assert.ok(claimed.ownedSkins.includes('night-shift'));
 const again=transition(claimed,{type:'claimSkinEvent',id:'monday-survival'},()=>.9,monday);
 assert.equal(again.skinTickets,0);assert.equal(again.activityClaims.length,1);
});
test('Friday event uses Friday-only quest and gives locked cat costume',()=>{
 const s={...initial(),activityDaily:{day:'2026-11-13',wins:4,bosses:0}};
 assert.ok(!transition(s,{type:'claimSkinEvent',id:'friday-weekend'},()=>.9,monday).ownedSkins.includes('cat-office'));
 assert.ok(transition(s,{type:'claimSkinEvent',id:'friday-weekend'},()=>.9,friday).ownedSkins.includes('cat-office'));
});
test('later activity repeat awards ticket instead of duplicate skin',()=>{
 const s={...initial(),ownedSkins:['starter','night-shift'],activityDaily:{day:'2026-11-09',wins:3,bosses:0}};
 const n=transition(s,{type:'claimSkinEvent',id:'monday-survival'},()=>.9,monday);
 assert.equal(n.skinTickets,1);assert.equal(n.ownedSkins.length,2);
});
test('weight disclosure corresponds to draw rules, excluding event skins',()=>{
 assert.deepEqual([SKIN_RARITIES.common.weight,SKIN_RARITIES.rare.weight,SKIN_RARITIES.epic.weight,SKIN_RARITIES.legendary.weight],[60,28,10,2]);
 assert.ok(drawPool(['starter']).every(x=>x.source==='draw'));
});
test('old V19 saves retain combat, nickname and pay independence',()=>{
 const old=initial();delete old.skinTickets;delete old.ownedSkins;delete old.activeSkin;delete old.modeWaves;delete old.activeMode;old.wave=11;old.gold=227;old.playerName='夏謙';
 const recovered=normalize(old);
 assert.equal(recovered.wave,11);assert.equal(recovered.gold,227);assert.equal(recovered.playerName,'夏謙');
 assert.deepEqual(recovered.ownedSkins,['starter']);
});
