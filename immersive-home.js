/* V12.8: adventure-first home. Existing modules remain functional. */
(()=>{'use strict';
function init(){
 const home=document.getElementById('home'),drawer=document.getElementById('adventureJournal'),contents=document.getElementById('adventureJournalContents'),toggle=document.getElementById('adventureJournalToggle');
 if(!home||!drawer||!contents||!toggle)return;
 const move=()=>{for(const selector of ['.discovery-board','.region-expedition']){const panel=home.querySelector(selector);if(panel&&panel.parentElement!==contents)contents.appendChild(panel)}};
 toggle.addEventListener('click',()=>{const open=drawer.hidden;drawer.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'關閉冒險手札':'冒險手札';if(open){move();drawer.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'})}});
 const observer=new MutationObserver(move);observer.observe(home,{childList:true,subtree:false});move();
 // Keep the playfield first. No game-state mutation or duplicate rewards.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();