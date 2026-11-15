import test from 'node:test';import assert from 'node:assert/strict';import {advanceTieshiStory,tieshiStoryAwakened,normalizeTieshiStory,readTieshiStory,saveTieshiStory,TIESHI_MIDGAME_MILESTONE,TIESHI_REQUIRED_CHAPTERS,TIESHI_FINAL_BOSS} from '../v19/tieshi-story-progress.mjs';
test('no awakening on empty or forged level/star data',()=>{assert.equal(tieshiStoryAwakened({level:300,stars:30,finalBossCleared:true}),false)});
test('must pass midgame, three chapters in order and final boss',()=>{let p={};p=advanceTieshiStory(p,{type:'chapter-cleared',id:TIESHI_REQUIRED_CHAPTERS[0]});assert.equal(p.chapters.length,0);p=advanceTieshiStory(p,{type:'main-milestone',id:TIESHI_MIDGAME_MILESTONE});p=advanceTieshiStory(p,{type:'chapter-cleared',id:TIESHI_REQUIRED_CHAPTERS[2]});assert.equal(p.chapters.length,0);for(const id of TIESHI_REQUIRED_CHAPTERS)p=advanceTieshiStory(p,{type:'chapter-cleared',id});assert.equal(tieshiStoryAwakened(p),false);p=advanceTieshiStory(p,{type:'boss-cleared',id:TIESHI_FINAL_BOSS});assert.equal(tieshiStoryAwakened(p),true)});
test('invalid save falls back safely',()=>{const storage={getItem:()=>'{bad'};assert.equal(tieshiStoryAwakened(readTieshiStory(storage)),false)});
test('saved story persists normalized fields only',()=>{let value='';const storage={setItem:(_,v)=>value=v,getItem:()=>value};saveTieshiStory(storage,{mainMilestone:TIESHI_MIDGAME_MILESTONE,chapters:['last-minute','bogus'],level:999});assert.deepEqual(readTieshiStory(storage),normalizeTieshiStory({mainMilestone:TIESHI_MIDGAME_MILESTONE,chapters:['last-minute']}))});

test('legacy awakened save survives a read/write roundtrip',()=>{
 const data={mainMilestone:TIESHI_MIDGAME_MILESTONE,chapters:[...TIESHI_REQUIRED_CHAPTERS],finalBossCleared:true};
 let stored=JSON.stringify(data);
 const storage={getItem:key=>key==='salary-hero:tieshi-story:v1'?stored:null,setItem:(key,value)=>{assert.equal(key,'salary-hero:tieshi-story:v1');stored=value}};
 assert.equal(tieshiStoryAwakened(readTieshiStory(storage)),true);
 saveTieshiStory(storage,readTieshiStory(storage));
 assert.equal(tieshiStoryAwakened(readTieshiStory(storage)),true);
});
test('new world01 chapter events cannot silently unlock legacy Tieshi awakening',()=>{
 let p=advanceTieshiStory({}, {type:'main-milestone',id:'world01/main/CH15'});
 for(const id of ['world01/source/CH11','world01/source/CH12','world01/source/CH33'])p=advanceTieshiStory(p,{type:'chapter-cleared',id});
 p=advanceTieshiStory(p,{type:'boss-cleared',id:'world01/b2-boss'});
 assert.equal(tieshiStoryAwakened(p),false);
 assert.deepEqual(p,normalizeTieshiStory());
});
test('duplicate legacy events are idempotent and out-of-order boss cannot awaken',()=>{
 let p=advanceTieshiStory({}, {type:'main-milestone',id:TIESHI_MIDGAME_MILESTONE});
 p=advanceTieshiStory(p,{type:'boss-cleared',id:TIESHI_FINAL_BOSS});
 assert.equal(p.finalBossCleared,false);
 for(const id of TIESHI_REQUIRED_CHAPTERS){p=advanceTieshiStory(p,{type:'chapter-cleared',id});p=advanceTieshiStory(p,{type:'chapter-cleared',id});}
 assert.deepEqual(p.chapters,TIESHI_REQUIRED_CHAPTERS);
 assert.equal(tieshiStoryAwakened(p),false);
 p=advanceTieshiStory(p,{type:'boss-cleared',id:TIESHI_FINAL_BOSS});
 assert.equal(tieshiStoryAwakened(p),true);
});
