import test from 'node:test';import assert from 'node:assert/strict';import {TIESHI,TIESHI_CARDS,TIESHI_SKILLS,tieshiVisibleCards,tieshiActiveCard,tieshiVisibleSkills} from '../v19/tieshi-character-content.mjs';
import {TIESHI_FINAL_CLASS} from '../v19/tieshi-necromancer.mjs';
test('one character with fixed SSR rarity across both card artworks',()=>{assert.equal(TIESHI.id,'guard');assert.equal(TIESHI.rarity,'SSR');assert.equal(TIESHI_CARDS.length,2);assert.deepEqual(TIESHI_CARDS.map(c=>c.rarity),['SSR','SSR'])});
test('awakening swaps art without changing rarity',()=>{assert.equal(tieshiActiveCard(false).portrait,'original');assert.equal(tieshiActiveCard(true).portrait,'awakened');assert.equal(tieshiActiveCard(true).rarity,'SSR')});
test('awakened skill and card are hidden before story awakening',()=>{assert.equal(tieshiVisibleCards(false).length,1);assert.equal(tieshiVisibleCards(true).length,2);assert.equal(tieshiVisibleSkills(false).some(x=>x.id==='last-door'),false);assert.equal(tieshiVisibleSkills(true).some(x=>x.id==='last-door'),true)});
test('ultimate values match battle runtime',()=>{const base=TIESHI_SKILLS.find(x=>x.id==='night-watch'),awakened=TIESHI_SKILLS.find(x=>x.id==='last-door');assert.equal(base.shieldRatio,.05);assert.equal(base.durationMs,4000);assert.equal(awakened.shieldRatio,.08);assert.equal(awakened.interceptRatio,.30);assert.equal(awakened.durationMs,6000)});

test('legacy card IDs remain stable after SSR upgrade',()=>{assert.deepEqual(TIESHI_CARDS.map(c=>c.id),['tieshi-sr-original','tieshi-sr-awakened'])});
test('base, cards and final class share SSR rarity',()=>{assert.equal(TIESHI.rarity,'SSR');assert.ok(TIESHI_CARDS.every(c=>c.rarity===TIESHI.rarity));assert.equal(TIESHI_FINAL_CLASS.rarity,TIESHI.rarity)});
