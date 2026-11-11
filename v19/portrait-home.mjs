/* Salary Hero V19.34 — a living, clickable portrait HOME (not a baked UI image).
 * Keep every action wired to existing game state or an explicitly non-economic
 * decorative interaction; never mint resources by tapping decorative objects.
 */
export const PORTRAIT_HOME_LINES=Object.freeze({
 hero:Object.freeze([
  '主管說五分鐘開會，已經開了兩小時……',
  '今天如果打到傳說裝備，我就準時下班。',
  '咖啡是我的藍條，便當是我的血條。',
  '這公事包今天也要拯救世界。'
 ]),
 cat:Object.freeze([
  '喵～牠說今天拒絕加班。',
  '貓咪翻了個身，當作你今天有請到假。',
  '喵！牠睡得比主管準時。'
 ]),
 coffee:Object.freeze([
  '☕ 熱咖啡香氣飄出來了。',
  '☕ 這杯是精神續命，不會消耗藥水。',
  '☕ 咖啡蒸氣正在飄散……'
 ])
});
export function portraitHomeMessage(kind,index=0){
 const lines=PORTRAIT_HOME_LINES[kind]||[];
 if(!lines.length)return '';
 return lines[Math.abs(Number.isInteger(index)?index:0)%lines.length];
}
export function portraitClock(now=Date.now()){
 const bits=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(now));
 return bits;
}
export function portraitHomeState(s){
 const name=typeof s?.playerName==='string'&&s.playerName.trim()?s.playerName.trim().slice(0,12):'平凡社畜';
 const mode=s?.activeMode==='tower'?'無限之塔':s?.activeMode==='dungeon'?'今日副本':'辦公室遠征';
 const wave=Math.max(1,Math.floor(Number(s?.wave)||1));
 return {name,level:Math.max(1,Math.floor(Number(s?.level)||1)),mode,wave,
  gold:Math.max(0,Math.floor(Number(s?.gold)||0)),
  auto:s?.auto===true,
  loot:Math.max(0,(s?.pendingDrops||[]).length+(s?.liteInventory||[]).length)
 };
}
export function initPortraitHome({getState,openPanel,goHome}){
 const root=document.querySelector('#app'),town=document.querySelector('#town-stage');
 if(!root||!town)return {update(){},updateClock(){}};
 // The engineering drawer exists for reviewers at ?dev=1, not on the player's HUD.
 root.dataset.devEnabled=new URLSearchParams(location.search).get('dev')==='1'?'true':'false';
 const stageName=document.querySelector('#town-player-name');
 const level=document.querySelector('#town-player-level');
 const speech=document.querySelector('#town-speech');
 const toast=document.querySelector('#town-toast');
 const hero=document.querySelector('#town-hero');
 const cat=document.querySelector('#town-cat');
 const coffee=document.querySelector('#town-coffee');
 const clock=document.querySelector('#town-clock');
 const clockTime=document.querySelector('#town-clock-time');
 const clockHand=document.querySelector('#town-clock-hand');
 const townMode=document.querySelector('#town-mode-label');
 const nav=document.querySelector('.tabs');
 const panel=document.querySelector('#panel');
 const buttons=[...document.querySelectorAll('.tabs button')];
 let timer=0,clearCat=0,counters={hero:0,cat:0,coffee:0},lastState=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function tell(text,kind='hero'){
   if(timer)clearTimeout(timer);
   speech.textContent=text;speech.hidden=false;
   speech.classList.remove('is-appearing');
   void speech.offsetWidth;speech.classList.add('is-appearing');
   timer=setTimeout(()=>{speech.hidden=true;},3700);
   if(kind==='cat'){
     cat.dataset.playing='true';
     if(clearCat)clearTimeout(clearCat);
     clearCat=setTimeout(()=>{cat.dataset.playing='false'},1050);
   }
 }
 function flash(text){
   toast.textContent=text;toast.hidden=false;
   toast.getAnimations().forEach(animation=>animation.cancel());
   if(!reduced)toast.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});
   setTimeout(()=>{toast.hidden=true;},2100);
 }
 function line(kind){
   tell(portraitHomeMessage(kind,counters[kind]++),kind);
 }
 hero?.addEventListener('click',()=>{line('hero');openPanel('hero')});
 cat?.addEventListener('click',()=>{line('cat')});
 coffee?.addEventListener('click',()=>{line('coffee');flash('☕ 咖啡彩蛋 · 不扣藥水，也不增加遊戲資源')});
 clock?.addEventListener('click',()=>{flash('台灣時間 '+portraitClock());openPanel('salary')});
 // The existing game panel dispatcher owns the town-task adventure button.
 const homeButton=document.querySelector('.tabs button[data-home]');
 const chooseTab=(button)=>{
   for(const b of buttons){
     const active=b===button;
     b.classList.toggle('is-active',active);
     if(active)b.setAttribute('aria-current','page');
     else b.removeAttribute('aria-current');
   }
 };
 homeButton?.addEventListener('click',()=>{
   if(panel.open)panel.close();
   chooseTab(homeButton);
   goHome?.();
   // Home has no document scrolling; switching tabs is entirely in place.
 });
 for(const b of buttons.filter(v=>v.hasAttribute('data-panel')))b.addEventListener('click',()=>chooseTab(b));
 panel?.addEventListener('close',()=>chooseTab(homeButton));
 document.querySelector('#portrait-dev-toggle')?.addEventListener('click',()=>{
   root.dataset.devVisible=root.dataset.devVisible==='true'?'false':'true';
   const button=document.querySelector('#portrait-dev-toggle');
   button.setAttribute('aria-expanded',String(root.dataset.devVisible==='true'));
 });
 // Parallax remains purely decorative; real battle runs independently.
 if(!reduced){
   let pending=false,looking=50;
   town.addEventListener('pointermove',e=>{
     const r=town.getBoundingClientRect();
     looking=Math.max(44,Math.min(56,50+(e.clientX-r.left-r.width/2)/r.width*7));
     if(pending)return;
     pending=true;
     requestAnimationFrame(()=>{town.style.backgroundPosition=looking+'% 31%';pending=false});
   },{passive:true});
   town.addEventListener('pointerleave',()=>{town.style.backgroundPosition='50% 31%'},{passive:true});
 }
 function update(s=getState()){
   const v=portraitHomeState(s);
   if(stageName&&stageName.textContent!==v.name)stageName.textContent=v.name;
   if(level)level.textContent='Lv.'+v.level+' · '+(v.auto?'自動冒險中':'待命中');
   if(townMode)townMode.textContent=v.mode+' · 第 '+v.wave+' 關';
   if(lastState&&lastState.gold<v.gold){
     const gold=document.querySelector('#gold')?.closest('.currency');
     if(gold&&!reduced){
       gold.animate([{filter:'brightness(1.5)',transform:'scale(1.08)'},{filter:'brightness(1)',transform:'scale(1)'}],{duration:420});
     }
   }
   // Don't spam dialogue when auto-combat triggers dozens of redraws.
   if(lastState&&v.wave>lastState.wave&&v.wave%4===1)flash('✦ 關卡推進！第 '+v.wave+' 關');
   const lootTab=document.querySelector('.tabs button[data-panel="equipment"]');
   if(lootTab)lootTab.classList.toggle('has-notice',Boolean((s?.pendingDrops||[]).length));
   lastState=v;
 }
 function updateClock(now=Date.now()){
   const time=portraitClock(now);
   if(clockTime&&clockTime.textContent!==time)clockTime.textContent=time;
   if(clockHand)clockHand.style.transform='rotate('+((Number(time.slice(-2))||0)*6+180)+'deg)';
 }
 update(getState());updateClock();
 return {update,updateClock};
}
