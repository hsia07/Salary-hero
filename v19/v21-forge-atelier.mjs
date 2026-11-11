/* Salary Hero V21: illustrated interactive forge, backed by V19 game rules.
 * This module ONLY renders and animates. V19 engine remains the sole authority
 * for materials, forge level, attack bonus and persistent save transitions.
 */
export const V21_FORGE_MAX_LEVEL=10;
export const V21_FORGE_COST=Object.freeze({material:3,ore:1});
const WEAPONS=Object.freeze({
 briefcase:{name:'破舊公事包',art:'../art/v20/runtime/items/worn-briefcase.svg'},
 laptop:{name:'鋼鐵加班筆電',art:'../art/v20/runtime/items/enchanted-laptop.svg'},
 notice:{name:'黃金離職通知書',art:'../art/v20/runtime/items/resignation-scroll.svg'},
 excalibur:{name:'準時下班聖劍',art:'../art/v20/runtime/items/legend-blade.svg'}
});
const cleanInt=n=>Math.max(0,Math.floor(Number.isFinite(Number(n))?Number(n):0));
const esc=value=>String(value??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
export function v21ForgeViewModel(state={}){
 const level=Math.min(V21_FORGE_MAX_LEVEL,cleanInt(state?.forgeLevel));
 const material=cleanInt(state?.craftingMaterial),ore=cleanInt(state?.rareMaterials);
 const weapon=WEAPONS[state?.equipped]||WEAPONS.briefcase;
 const canForge=level<V21_FORGE_MAX_LEVEL&&material>=V21_FORGE_COST.material&&ore>=V21_FORGE_COST.ore;
 return Object.freeze({level,maxLevel:V21_FORGE_MAX_LEVEL,material,ore,weapon,
  bonus:level*2,nextBonus:Math.min(V21_FORGE_MAX_LEVEL,level+1)*2,
  canForge,missingMaterial:Math.max(0,V21_FORGE_COST.material-material),
  missingOre:Math.max(0,V21_FORGE_COST.ore-ore),maxed:level>=V21_FORGE_MAX_LEVEL});
}
export function renderV21ForgeAtelier(state={}){
 const v=v21ForgeViewModel(state);
 const sparks=Array.from({length:12},(_,i)=>`<i class="v21-forge-spark" style="--i:${i};--dx:${Math.round((i-5.5)*17)}px;--dy:${-18-(i%4)*15}px;--rot:${i*43}deg" aria-hidden="true"></i>`).join('');
 const milestones=Array.from({length:V21_FORGE_MAX_LEVEL},(_,i)=>`<span class="${i<v.level?'is-complete':''}" aria-hidden="true"></span>`).join('');
 return `<div class="v21-forge-atelier" id="v21-forge-atelier" data-forge-level="${v.level}">
 <section class="v21-forge-diorama" aria-label="有火焰、鐵匠與鍛造演出的魔法工坊">
  <img class="v21-forge-painting" src="../art/v21/runtime/forge/smithy-diorama.webp?v=1" width="660" height="434" loading="eager" alt="鍛造鐵匠在燃燒的魔法爐前敲擊鐵砧，暖金火花四濺"/>
  <div class="v21-forge-furnace-glow" aria-hidden="true"></div>
  <div class="v21-forge-forged-light" aria-hidden="true"></div>
  <div class="v21-forge-sparks" aria-hidden="true">${sparks}</div>
  <div class="v21-forge-scene-caption"><small>FORGE ATELIER</small><strong>夜班的魔法鐵匠</strong></div>
  <button class="v21-forge-inspect" type="button" data-forge-inspect aria-label="觀察工坊鍛造火花">✦ 觀察爐火</button>
 </section>
 <section class="v21-forge-weapon-showcase" aria-label="正在鍛造的武器">
  <div class="v21-forge-weapon-portrait">
   <div class="v21-forge-weapon-aura" aria-hidden="true"></div>
   <img class="v21-forge-weapon-icon" src="${v.weapon.art}" alt="${esc(v.weapon.name)}" width="104" height="104"/>
  </div>
  <div class="v21-forge-weapon-detail">
   <span class="v21-forge-kicker">CURRENT EQUIPMENT</span>
   <h3>${esc(v.weapon.name)}</h3>
   <div class="v21-forge-rank">鍛造 <strong>+${v.level}</strong> <small>/ ${v.maxLevel}</small></div>
   <div class="v21-forge-level-pips" aria-label="已達成 ${v.level} / ${v.maxLevel} 階">${milestones}</div>
   <p>目前攻擊加成 <strong>+${v.bonus}</strong>　${v.maxed?'已達最高鍛造階級':`鍛造後 <b>+${v.nextBonus}</b>`}</p>
  </div>
 </section>
 <section class="v21-forge-materials" aria-label="現有鍛造材料">
  <div class="v21-forge-material ${v.missingMaterial?'is-short':''}"><span class="v21-forge-material-art" aria-hidden="true">⚙️</span><div><b>強化材料</b><small>每次需要 3</small></div><strong>${v.material}</strong></div>
  <div class="v21-forge-material ${v.missingOre?'is-short':''}"><span class="v21-forge-material-art" aria-hidden="true">💎</span><div><b>黎明礦石</b><small>每次需要 1</small></div><strong>${v.ore}</strong></div>
 </section>
 <div class="v21-forge-caption" role="status" id="v21-forge-caption">${v.maxed?'✦ 這件工坊的鍛造增幅已達最高階。':v.canForge?'✦ 爐火已就緒。敲擊鐵砧，實際升級你的戰鬥鍛造強化。':`還缺 ${v.missingMaterial?`強化材料 ${v.missingMaterial} `:''}${v.missingOre?`黎明礦石 ${v.missingOre}`:''}，請前往副本取得。`}</div>
 <div class="v21-forge-actions">
  <button class="v21-forge-hammer" type="button" data-action="forge" ${v.canForge?'':'disabled'}><span class="v21-forge-hammer-icon" aria-hidden="true">⚒</span><span>${v.maxed?'已達最高鍛造等級':v.canForge?`鍛造升級至 +${v.level+1}`:'材料不足・無法鍛造'}</span></button>
  <button class="v21-forge-inventory" type="button" data-action="openPanel" data-value="equipment">查看裝備背包</button>
 </div>
 <p class="v21-forge-rule-note">使用的是原本真實素材與鍛造升級規則。成功後立即存檔、增加攻擊；觀察爐火不會扣素材，也不會贈送獎勵。</p>
 </div>`;
}
function trigger(host,kind){
 const root=host?.querySelector?.('#v21-forge-atelier');
 if(!root)return false;
 const scene=root.querySelector('.v21-forge-diorama');
 if(!scene)return false;
 // Restarts independent light, weapon and particle-frame choreography.
 scene.classList.remove('is-striking','is-forged');
 void scene.offsetWidth;
 scene.classList.add(kind==='success'?'is-forged':'is-striking');
 const onEnd=ev=>{
  if(ev.target===scene||ev.animationName==='v21-forge-impact')scene.classList.remove('is-striking','is-forged');
 };
 scene.addEventListener('animationend',onEnd,{once:true});
 return true;
}
export function v21ForgeInspect(host){return trigger(host,'preview');}
export function v21ForgeSuccess(host,oldLevel,newLevel){
 if(cleanInt(newLevel)<=cleanInt(oldLevel))return false;
 const root=host?.querySelector?.('#v21-forge-atelier');
 if(root){const label=root.querySelector('#v21-forge-caption');if(label)label.textContent=`✦ 鍛造成功！提升至 +${cleanInt(newLevel)}，實際攻擊加成 +${cleanInt(newLevel)*2}。`;}
 return trigger(host,'success');
}
