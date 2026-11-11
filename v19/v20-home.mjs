/* Salary Hero V20 — live reference-inspired stage bar and loot column.
 * Presentation only. No fabricated currency, no duplicate chest rolls.
 */
const LOOT_SPRITES=Object.freeze({
 briefcase:{id:'briefcase',name:'破舊公事包',tier:'common',art:'worn-briefcase.svg'},
 laptop:{id:'laptop',name:'鋼鐵加班筆電',tier:'rare',art:'enchanted-laptop.svg'},
 notice:{id:'notice',name:'黃金離職通知書',tier:'epic',art:'resignation-scroll.svg'},
 excalibur:{id:'excalibur',name:'準時下班聖劍',tier:'legendary',art:'legend-blade.svg'}
});
export function v20LootVisual(state){
 const pending=Array.isArray(state?.pendingDrops)?state.pendingDrops:[];
 const raw=pending[0],key=typeof raw==='string'?raw:raw&&typeof raw.id==='string'?raw.id:'';
 const item=LOOT_SPRITES[key];
 return item?{...item,count:pending.length}:{id:'none',name:'裝備',tier:'none',art:'worn-briefcase.svg',count:pending.length};
}

export function v20StageProgress(state){
 const wave=Number.isFinite(Number(state?.wave))?Math.max(1,Math.min(1000000,Math.floor(Number(state.wave)))):1;
 const cleared=(wave-1)%4;
 const tier=state?.enemy?.tier;
 const mode=state?.activeMode==='dungeon'?'每日副本':state?.activeMode==='tower'?'無限之塔':'辦公室遠征';
 const dropCount=Math.max(0,Number.isFinite(Number(state?.pendingDrops?.length))?state.pendingDrops.length:0);
 const chests=Math.max(0,Number.isFinite(Number(state?.chests))?Math.floor(state.chests):0);
 const petLevel=Math.max(1,Number.isFinite(Number(state?.petLevel))?Math.floor(state.petLevel):1);
 return {wave,cleared,activeOrb:cleared,mode,tier:tier==='boss'?'boss':tier==='elite'?'elite':'normal',
  dropCount,chests,petLevel,phaseText:tier==='boss'?'魔王關卡':tier==='elite'?'菁英出現':'第 '+wave+' 關'};
}
export function initV20Home({getState}={}){
 const root=document.getElementById('app');
 const progress=document.getElementById('v20-stage-progress');
 const orbs=[...document.querySelectorAll('#v20-stage-pips .v20-stage-pip')];
 const loot=document.getElementById('v20-loot-preview');
 const previewCount=document.getElementById('v20-loot-count');
 const previewArt=document.getElementById('v20-loot-item-art');
 const previewLabel=document.getElementById('v20-loot-item-label');
 let lastDropCount=null;
 const chest=document.getElementById('v20-stage-chest');
 const waveText=document.getElementById('v20-wave-text');
 const pet=document.getElementById('v20-pet-level');
 if(!root||!progress||!waveText||orbs.length!==4)return {update(){}};
 const update=(s=getState?.())=>{
  const v=v20StageProgress(s);
  progress.setAttribute('aria-label',v.mode+'第 '+v.wave+' 關，本輪已通過 '+v.cleared+' 關，共 4 關');
  progress.dataset.tier=v.tier;
  waveText.textContent=v.mode+' · 第 '+v.wave+' 關';
  for(let i=0;i<orbs.length;i++){
   const el=orbs[i];
   el.classList.toggle('is-done',i<v.cleared);
   el.classList.toggle('is-current',i===v.activeOrb);
   el.classList.toggle('is-boss',i===3&&v.tier==='boss');
   el.setAttribute('aria-label','第 '+(i+1)+' 波'+(i<v.cleared?'已完成':i===v.activeOrb?'進行中':'未完成'));
  }
  const visual=v20LootVisual(s);
  if(previewCount)previewCount.textContent=v.dropCount;
  if(previewLabel)previewLabel.textContent=visual.id==='none'?'裝備':visual.name;
  if(previewArt){
   const artUrl=new URL('../art/v20/runtime/items/'+visual.art,import.meta.url).href;
   if(previewArt.src!==artUrl)previewArt.src=artUrl;
  }
  if(loot){
   loot.dataset.lootTier=visual.tier;
   loot.dataset.lootItem=visual.id;
   loot.setAttribute('aria-label',v.dropCount>0?'查看待領取戰利品：'+visual.name+'等 '+v.dropCount+' 件':'查看裝備背包，目前沒有待領取掉落');
   if(lastDropCount!==null&&v.dropCount>lastDropCount){
    loot.classList.remove('is-loot-new');
    void loot.offsetWidth;
    loot.classList.add('is-loot-new');
   }
  }
  lastDropCount=v.dropCount;
  if(chest){
   chest.disabled=v.chests===0;
   chest.title=v.chests>0?'開啟寶箱（目前 '+v.chests+' 個）':'目前沒有可以開啟的寶箱';
   chest.setAttribute('aria-label',chest.title);
  }
  if(pet)pet.textContent='Lv.'+v.petLevel;
  root.dataset.v20StageTier=v.tier;
 };
 loot?.addEventListener('animationend',event=>{if(event.animationName==='v20-loot-arrival')loot.classList.remove('is-loot-new');});
 // Reuse exactly the existing chest click handler and state machine.
 chest?.addEventListener('click',()=>{
  if(!chest.disabled)document.getElementById('chest')?.click();
 });
 update(getState?.());
 return {update};
}
