/** Tieshi midgame story gate; never infer awakening from levels, rarity or ascension. */
export const TIESHI_STORY_KEY='salary-hero:tieshi-story:v1';
export const TIESHI_REQUIRED_CHAPTERS=Object.freeze(['last-minute','not-clocked-out','nine-oclock']);
export const TIESHI_MIDGAME_MILESTONE='main-midgame-tieshi';
export const TIESHI_FINAL_BOSS='midnight-lockdown';
export function normalizeTieshiStory(raw={}){
 const chapters=Array.isArray(raw.chapters)?[...new Set(raw.chapters.filter(x=>TIESHI_REQUIRED_CHAPTERS.includes(x)))]:[];
 return {mainMilestone:raw.mainMilestone===TIESHI_MIDGAME_MILESTONE?TIESHI_MIDGAME_MILESTONE:null,chapters,finalBossCleared:raw.finalBossCleared===true};
}
export function tieshiStoryAwakened(raw={}){
 const p=normalizeTieshiStory(raw);
 return p.mainMilestone===TIESHI_MIDGAME_MILESTONE&&TIESHI_REQUIRED_CHAPTERS.every(c=>p.chapters.includes(c))&&p.finalBossCleared;
}
export function readTieshiStory(storage){
 try{return normalizeTieshiStory(JSON.parse(storage.getItem(TIESHI_STORY_KEY)||'{}'))}catch{return normalizeTieshiStory()}
}
export function saveTieshiStory(storage,raw){
 const p=normalizeTieshiStory(raw);storage.setItem(TIESHI_STORY_KEY,JSON.stringify(p));return p;
}
export function advanceTieshiStory(state,event){
 const p=normalizeTieshiStory(state);
 if(event?.type==='main-milestone'&&event.id===TIESHI_MIDGAME_MILESTONE)p.mainMilestone=TIESHI_MIDGAME_MILESTONE;
 if(event?.type==='chapter-cleared'&&TIESHI_REQUIRED_CHAPTERS.includes(event.id)&&p.mainMilestone){
  const index=TIESHI_REQUIRED_CHAPTERS.indexOf(event.id);
  if(index===0||p.chapters.includes(TIESHI_REQUIRED_CHAPTERS[index-1]))p.chapters=[...new Set([...p.chapters,event.id])];
 }
 if(event?.type==='boss-cleared'&&event.id===TIESHI_FINAL_BOSS&&p.chapters.length===3)p.finalBossCleared=true;
 return p;
}
