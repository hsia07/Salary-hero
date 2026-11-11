/* Salary Hero V21: one large playable stage, two independently running views.
 * View selection is PRESENTATION ONLY: switching never pauses salary, combat,
 * drop rolls, state transitions, saves, auto battle, or Canvas rendering.
 */
export const V21_VIEWS=Object.freeze(['office','battle']);
export function v21View(value){return value==='office'?'office':'battle';}
export function v21Activity(state){
 const wave=Math.max(1,Number(state?.wave)||1);
 return {
  label:state?.auto?'⚔️ 自動冒險持續進行':'⏸ 自動冒險已暫停',
  detail:'第 '+wave+' 關',
  loot:Math.max(0,Number(state?.pendingDrops?.length)||0),
  chest:Math.max(0,Number(state?.chests)||0)+Math.max(0,Number(state?.specialChests)||0)
 };
}
export function initV21UnifiedStage({getState}={}){
 if(typeof document==='undefined')return {update(){}};
 const root=document.querySelector('#app');
 if(!root||root.hasAttribute('data-training'))return {update(){}};
 const office=document.getElementById('town-stage'),battle=document.getElementById('battle-deck');
 const officeTab=document.getElementById('v21-view-office');
 const battleTab=document.getElementById('v21-view-battle');
 const lootToggle=document.getElementById('v21-loot-toggle');
 const loot=document.querySelector('.battle-deck>.mini-actions');
 const moreToggle=document.getElementById('v21-more-toggle');
 const moreMenu=document.getElementById('v21-more-menu');
 const officeActivity=document.getElementById('v21-office-activity');
 const officeWave=document.getElementById('v21-office-wave');
 const lootNumber=document.getElementById('v21-loot-notice');
 const officeGo=document.getElementById('v21-office-go');
 let current='battle';
 function closeLoot(){
  root.dataset.v21Loot='closed';lootToggle?.setAttribute('aria-expanded','false');
  if(loot)loot.setAttribute('aria-hidden','true');
 }
 function closeMore(){
  root.dataset.v21More='closed';moreToggle?.setAttribute('aria-expanded','false');
  if(moreMenu)moreMenu.hidden=true;
 }
 function setView(view){
  current=v21View(view);
  root.dataset.v21View=current;
  if(office)office.inert=current!=='office';
  if(battle)battle.inert=current!=='battle';
  office?.setAttribute('aria-hidden',String(current!=='office'));
  battle?.setAttribute('aria-hidden',String(current!=='battle'));
  for(const [element,active] of [[officeTab,current==='office'],[battleTab,current==='battle']]){
   if(!element)continue;
   element.classList.toggle('is-active',active);
   element.setAttribute('aria-selected',String(active));
   element.setAttribute('aria-pressed',String(active));
  }
  closeLoot();closeMore();
 }
 officeTab?.addEventListener('click',()=>setView('office'));
 battleTab?.addEventListener('click',()=>setView('battle'));
 officeGo?.addEventListener('click',()=>setView('battle'));
 document.querySelector('.tabs button[data-home]')?.addEventListener('click',()=>setView('office'));
 lootToggle?.addEventListener('click',()=>{
  if(current!=='battle')setView('battle');
  const open=root.dataset.v21Loot!=='open';
  root.dataset.v21Loot=open?'open':'closed';
  lootToggle.setAttribute('aria-expanded',String(open));
  if(loot)loot.setAttribute('aria-hidden',String(!open));
 });
 moreToggle?.addEventListener('click',()=>{
  const open=root.dataset.v21More!=='open';
  root.dataset.v21More=open?'open':'closed';
  moreToggle.setAttribute('aria-expanded',String(open));
  if(moreMenu)moreMenu.hidden=!open;
  if(open)closeLoot();
 });
 moreMenu?.querySelectorAll('button[data-panel]').forEach(button=>{
  button.addEventListener('click',closeMore);
 });
 document.querySelector('#panel')?.addEventListener('close',closeMore);
 document.addEventListener('pointerdown',event=>{
  if(root.dataset.v21Loot==='open'&&!loot?.contains(event.target)&&!lootToggle?.contains(event.target))closeLoot();
  if(root.dataset.v21More==='open'&&!moreMenu?.contains(event.target)&&!moreToggle?.contains(event.target))closeMore();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeLoot();closeMore();}
 });
 function update(state=getState?.()){
  const activity=v21Activity(state);
  if(officeActivity)officeActivity.textContent=activity.label;
  if(officeWave)officeWave.textContent=activity.detail;
  if(lootNumber){
   const total=activity.loot+activity.chest;
   lootNumber.textContent=total?String(total):'';
   lootNumber.hidden=total===0;
  }
 }
 setView('battle');
 update();
 return {update,setView};
}
