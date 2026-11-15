import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD01_MAINLINE,WORLD01_SOURCE,WORLD01_STORY_BRANCHES,WORLD01_PROGRESS_KEY,normalizeWorld01Narrative,visitWorld01Source,world01NextMainline,readWorld01Narrative,saveWorld01Narrative} from '../v19/world01-story-route.mjs';
test('mainline retains 19 canonical source chapters and separate expanded editions',()=>{
 assert.equal(WORLD01_MAINLINE.length,19);
 assert.equal(new Set(WORLD01_MAINLINE).size,19);
 assert.equal(WORLD01_SOURCE.CH11.order,5);
 assert.equal(WORLD01_SOURCE.CH33.edition,'expanded');
 assert.equal(WORLD01_SOURCE.CH35.order,19);
});
test('optional stories never become mandatory B2 gates',()=>{
 const state=visitWorld01Source({},'world01/source/ch06');
 assert.equal(world01NextMainline(state).chapter,'CH01');
 assert.ok(WORLD01_STORY_BRANCHES.factory.includes('CH06'));
});
test('source visits are idempotent, reject unknown IDs and preserve order',()=>{
 let state=visitWorld01Source({},WORLD01_SOURCE.CH01.id);
 state=visitWorld01Source(state,WORLD01_SOURCE.CH01.id);
 state=visitWorld01Source(state,'world01/source/invalid');
 assert.deepEqual(state.visited,[WORLD01_SOURCE.CH01.id]);
 assert.equal(world01NextMainline(state).chapter,'CH02');
});
test('separate narrative save does not overwrite legacy Tieshi awakening key',()=>{
 const data=new Map([['salary-hero:tieshi-story:v1','legacy-save']]);
 const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 saveWorld01Narrative(storage,visitWorld01Source({},WORLD01_SOURCE.CH33.id));
 assert.equal(data.get('salary-hero:tieshi-story:v1'),'legacy-save');
 assert.equal(data.has(WORLD01_PROGRESS_KEY),true);
 assert.deepEqual(readWorld01Narrative(storage).visited,[WORLD01_SOURCE.CH33.id]);
});
test('invalid saves are safely normalized without granting story completion',()=>{
 assert.deepEqual(normalizeWorld01Narrative({visited:['world01/source/ch99',4]}).visited,[]);
 assert.deepEqual(readWorld01Narrative({getItem:()=>'{bad'}).visited,[]);
});
