import * as rules from './tieshi-combat-rules.mjs';
// Initialize combat rules BEFORE the classic battle runtime starts its timers.
window.__tieshiRules=rules;
const story=await import('./tieshi-story-progress.mjs');
window.__tieshiStory=story;
let storyState=story.readTieshiStory(localStorage);
window.__tieshiStoryState=()=>({...storyState});
window.addEventListener('salary-hero:story-event',event=>{
 const next=story.advanceTieshiStory(storyState,event.detail);
 storyState=story.saveTieshiStory(localStorage,next);
 window.__salaryBossV5?.setTieshiStoryAwakened(story.tieshiStoryAwakened(storyState));
});
try {
 await new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='./boss-v5-dungeon-runtime.js';
  script.onload=resolve;script.onerror=()=>reject(new Error('戰鬥主程式載入失敗'));
  document.body.append(script);
 });
 window.__salaryBossV5?.setTieshiStoryAwakened(story.tieshiStoryAwakened(storyState));
 await import('./tieshi-battle-clock.mjs');
 await import('./tieshi-spirit-bridge.mjs');
} catch(error){
 console.error('[Salary Hero] Tieshi battle bootstrap failed',error);
 const message=document.createElement('div');message.setAttribute('role','alert');
 message.textContent='戰鬥初始化失敗：'+error.message;
 message.style.cssText='position:fixed;z-index:99999;top:10px;left:10px;right:10px;background:#4b1724;color:white;padding:12px;border-radius:8px';
 document.body.append(message);
}
