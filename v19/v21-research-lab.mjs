/* V21 S2 — In-game tactical build lab; never writes live saves or currency. */
import {SQUAD_JOBS,COMMANDER_PATHS} from './v21-squad-core.mjs';
import {LAB_TRAITS,LAB_FUSIONS,LAB_GEAR,LAB_ENEMIES,analyzeLabBuild,simulateLabBattle} from './v21-build-lab.mjs';

export const RESEARCH_ROSTER=Object.freeze([
 {id:'guard-a',name:'睏倦保全',job:'sentinel',path:'bulwark'},
 {id:'guard-b',name:'碎紙盾衛',job:'sentinel',path:'thorns'},
 {id:'fighter-a',name:'逃班劍士',job:'fighter',path:'duelist'},
 {id:'fighter-b',name:'爆肝狂戰士',job:'fighter',path:'rampage'},
 {id:'assassin-a',name:'死線刺客',job:'assassin',path:'poison'},
 {id:'assassin-b',name:'夜班忍者',job:'assassin',path:'execution'},
 {id:'mage-a',name:'報表魔法師',job:'mage',path:'fire'},
 {id:'mage-b',name:'冷氣女巫',job:'mage',path:'frost'},
 {id:'medic-a',name:'咖啡醫官',job:'medic',path:'barrier'},
 {id:'medic-b',name:'補休藥師',job:'medic',path:'restoration'},
 {id:'engineer-a',name:'機關工程師',job:'engineer',path:'turret'},
 {id:'engineer-b',name:'超頻技師',job:'engineer',path:'overdrive'}
]);
const jobById=new Map(SQUAD_JOBS.map(j=>[j.id,j]));
const byId=new Map(RESEARCH_ROSTER.map(u=>[u.id,u]));
const traitIds=new Set(LAB_TRAITS.map(t=>t.id));
const gearIds=new Set(LAB_GEAR.map(t=>t.id));
const fusionIds=new Set(LAB_FUSIONS.map(t=>t.id));
const enemyIds=new Set(LAB_ENEMIES.map(t=>t.id));
const commanderIds=new Set(COMMANDER_PATHS.map(t=>t.id));
const initialIds=['guard-a','fighter-a','assassin-a','mage-a','medic-a','engineer-a'];
const clone=obj=>JSON.parse(JSON.stringify(obj));
const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const bound=(n,min,max,defaultValue)=>Number.isFinite(Number(n))?Math.min(max,Math.max(min,Math.floor(Number(n)))):defaultValue;
const fmt=n=>Math.round(Number(n)||0).toLocaleString('zh-TW');
export function researchDefaultDraft(){
 return {slots:initialIds.map(id=>({id,path:byId.get(id).path})),imprints:{},gear:{},fusion:'',
  commanderPath:'strategist',enemy:'training-dummy',seed:72,ticks:90};
}
export function normalizeResearchDraft(input={}){
 const src=input&&typeof input==='object'?input:{};
 const used=new Set(),imprints={},gear={};
 const slots=Array.from({length:6},(_,i)=>{
  const raw=Array.isArray(src.slots)?src.slots[i]:null;
  const unit=byId.get(raw?.id);
  if(!unit||used.has(unit.id))return null;
  used.add(unit.id);
  const job=jobById.get(unit.job);
  return {id:unit.id,path:job.paths.some(p=>p.id===raw?.path)?raw.path:unit.path};
 });
 for(const s of slots){
  if(!s)continue;
  const own=jobById.get(byId.get(s.id).job).tags;
  const imprint=src.imprints?.[s.id];
  if(Object.keys(imprints).length<2&&traitIds.has(imprint)&&!own.includes(imprint))imprints[s.id]=imprint;
  if(gearIds.has(src.gear?.[s.id]))gear[s.id]=src.gear[s.id];
 }
 return {slots,imprints,gear,fusion:fusionIds.has(src.fusion)?src.fusion:'',
  commanderPath:commanderIds.has(src.commanderPath)?src.commanderPath:'strategist',
  enemy:enemyIds.has(src.enemy)?src.enemy:'training-dummy',
  seed:bound(src.seed,1,4294967295,72),ticks:bound(src.ticks,30,200,90)};
}
export function researchToSquad(raw){
 const d=normalizeResearchDraft(raw);
 return {version:1,commanderPath:d.commanderPath,slots:d.slots.map(s=>{
  if(!s)return null;
  const u=byId.get(s.id);
  return {id:s.id,name:u.name,job:u.job,path:s.path,level:7,stars:2};
 })};
}
export function researchSnapshot(raw){
 const d=normalizeResearchDraft(raw);
 return {squad:researchToSquad(d),options:{imprints:clone(d.imprints),gear:clone(d.gear),fusion:d.fusion||null}};
}
export function researchCompare(a,b,{enemy='training-dummy',seed=72,ticks=90,samples=5}={}){
 const target=enemyIds.has(enemy)?enemy:'training-dummy';
 const base=bound(seed,1,4294967295,72),length=bound(ticks,30,200,90),n=bound(samples,1,20,5);
 const run=snapshot=>{
  const results=Array.from({length:n},(_,i)=>simulateLabBattle(snapshot.squad,{
   ...snapshot.options,enemy:target,seed:base+i,ticks:length
  }));
  const avg=fn=>results.reduce((total,r)=>total+fn(r),0)/results.length;
  const wins=results.filter(r=>r.result==='team').length;
  return {wins,avgDamage:Math.round(avg(r=>r.metrics.damage)),
   avgHealing:Math.round(avg(r=>r.metrics.healing)),
   avgSummon:Math.round(avg(r=>r.metrics.summonDamage)),
   avgSurvivors:Number(avg(r=>r.alive).toFixed(1)),
   avgEnemyHp:Math.round(avg(r=>r.enemyHp))};
 };
 return {enemy:target,seed:base,ticks:length,samples:n,A:run(a),B:run(b)};
}
const optionsHtml=(items,selected,empty=null,disabled=[])=>
 (empty===null?'':`<option value="">${safe(empty)}</option>`)+items.map(item=>
  `<option value="${safe(item.id)}" ${item.id===selected?'selected':''} ${disabled.includes(item.id)?'disabled':''}>${safe(item.name)}</option>`).join('');
const traitName=id=>LAB_TRAITS.find(t=>t.id===id)?.name??id;
export function initV21ResearchLab(){
 let host=null,draft=researchDefaultDraft(),last=null,savedA=null,savedB=null,compared=null,message='';
 const snapshot=()=>researchSnapshot(draft);
 const currentBuild=()=>{const s=snapshot();return analyzeLabBuild(s.squad,s.options);};
 function render(){
  if(!host)return;
  const d=normalizeResearchDraft(draft),build=currentBuild();
  const count=d.slots.filter(Boolean).length;
  const activated=build.active.map(t=>`${traitName(t.tag)} ${t.count}人${build.suppressed.includes(t.tag)?'（鍊成替代）':''}`);
  const cards=d.slots.map((s,i)=>{
   const unit=s?byId.get(s.id):null;
   const job=unit?jobById.get(unit.job):null;
   const taken=d.slots.filter((other,j)=>j!==i&&other).map(other=>other.id);
   const path=unit?`<label>流派<select data-lab-field="path" data-index="${i}">${optionsHtml(job.paths.map(p=>({id:p.id,name:p.name})),s.path)}</select></label>`:'<p class="v21-lab-hint">先選一名隊員</p>';
   const tags=job?.tags||[];
   const imprint=unit?`<label>移植印記<select data-lab-field="imprint" data-index="${i}">${optionsHtml(LAB_TRAITS.filter(t=>!tags.includes(t.id)),d.imprints[s.id],'不移植')}</select></label>`:'';
   const gear=unit?`<label>變異裝備<select data-lab-field="gear" data-index="${i}">${optionsHtml(LAB_GEAR,d.gear[s.id],'不裝備')}</select></label>`:'';
   return `<article class="v21-lab-unit"><div class="v21-lab-unit-title"><b>${i+1}</b><span>${safe(job?.name??'待招募')}</span></div>
    <label>隊員<select data-lab-field="slot" data-index="${i}">${optionsHtml(RESEARCH_ROSTER,s?.id,'空位',taken)}</select></label>
    <p class="v21-lab-unit-tags">${tags.map(t=>`<span>${safe(traitName(t))}</span>`).join('')||'<span>尚未加入隊伍</span>'}</p>
    ${path}<details class="v21-lab-unit-details"><summary>印記／裝備 ${unit&&(d.imprints[s.id]||d.gear[s.id])?'✦':''}</summary><div>${imprint}${gear}</div></details></article>`;
  }).join('');
  const readyFusions=LAB_FUSIONS.map(f=>({id:f.id,name:f.name+(f.traits.every(t=>(build.counts[t]||0)>=2)?'':'（未達條件）')}));
  const disabledFusions=LAB_FUSIONS.filter(f=>!f.traits.every(t=>(build.counts[t]||0)>=2)).map(f=>f.id);
  const battle=last?`<section class="v21-lab-report" id="v21-lab-report"><h3>⚔️ 真實規則模擬戰報</h3>
   <p><b>${last.result==='team'?'🏆 勝利':last.result==='enemy'?'💀 全滅':'⏳ 超時'}</b> ・${last.ticks} 回合 ・種子 ${last.seed}</p>
   <div class="v21-lab-metrics">${[
     ['總傷害',fmt(last.metrics.damage)],['剩餘敵 HP',fmt(last.enemyHp)],['存活隊員',last.alive+'/6'],
     ['指揮技能',last.metrics.commanderCasts+' 次'],['毒傷',fmt(last.metrics.poisonDamage)],
     ['召喚輸出',fmt(last.metrics.summonDamage)],['追擊',last.metrics.followups+' 次'],
     ['護盾吸傷',fmt(last.metrics.shieldAbsorbed)]
    ].map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('')}</div>
    <h4>角色傷害統計</h4><div class="v21-lab-damage">${last.byUnit.map(member=>
     `<div><span>${safe(byId.get(member.id)?.name??member.id)}</span><meter min="0" max="${Math.max(1,...last.byUnit.map(x=>x.damage))}" value="${member.damage}"></meter><b>${fmt(member.damage)}</b></div>`).join('')}</div>
   </section>`:'';
  const comparison=compared?`<section class="v21-lab-report" id="v21-lab-comparison"><h3>📊 A／B 同條件比較</h3>
   <p>同一敵人：${safe(LAB_ENEMIES.find(e=>e.id===compared.enemy)?.name)}・每隊各 ${compared.samples} 場・相同種子</p>
   <table><thead><tr><th>指標</th><th>A</th><th>B</th></tr></thead><tbody>
   ${[['勝利場次','wins'],['平均傷害','avgDamage'],['平均治療','avgHealing'],['召喚輸出','avgSummon'],['平均存活','avgSurvivors'],['敵人剩餘 HP','avgEnemyHp']]
    .map(([label,k])=>`<tr><td>${label}</td><td>${compared.A[k]}</td><td>${compared.B[k]}</td></tr>`).join('')}
   </tbody></table><small>五場是小樣本模擬，並非遊戲正式勝率。</small></section>`:'';
  host.innerHTML=`<div class="v21-research-lab" id="v21-research-lab">
   <div class="v21-lab-intro"><small>TACTICS LAB · S2</small><h3>⚜ 六人羈絆研究室</h3>
    <p>六人配隊、羈絆移植、融合鍊成與技能變異。<b>所有戰鬥只作研究，不消耗正式存檔或薪資。</b></p></div>
   <div class="v21-lab-overview"><span>隊員 <b>${count}/6</b></span><span>移植 <b>${Object.keys(d.imprints).length}/2</b></span><span>啟動羈絆 <b>${activated.length}</b></span></div>
   <section class="v21-lab-section"><h3>Ⅰ. 六人編隊 <small>同職業可以重複，角色不能重複</small></h3><div class="v21-lab-roster">${cards}</div></section>
   <section class="v21-lab-section"><h3>Ⅱ. 羈絆融合</h3><div class="v21-lab-traits">${activated.map(x=>`<span>${safe(x)}</span>`).join('')||'<span>尚未啟動</span>'}</div>
    <label>主要融合羈絆<select data-lab-field="fusion">${optionsHtml(readyFusions,d.fusion,'不融合・保留原羈絆',disabledFusions)}</select></label>
    <p class="v21-lab-hint">${build.fusion?'✦ '+safe(build.fusion.description):'需要指定的兩種羈絆各至少 2 人；融合會取代來源羈絆的部分被動。'}</p>
   </section>
   <section class="v21-lab-section"><h3>Ⅲ. 主角指揮與試戰設定</h3><div class="v21-lab-settings">
    <label>指揮官職階<select data-lab-field="commanderPath">${optionsHtml(COMMANDER_PATHS,d.commanderPath)}</select></label>
    <label>敵人機制<select data-lab-field="enemy">${optionsHtml(LAB_ENEMIES,d.enemy)}</select></label>
    <label>隨機種子<input data-lab-field="seed" type="number" min="1" max="4294967295" value="${d.seed}"></label>
    <label>回合上限<select data-lab-field="ticks">${[60,90,120,160,200].map(n=>`<option value="${n}" ${n===d.ticks?'selected':''}>${n} 回合</option>`).join('')}</select></label>
   </div></section>
   <p id="v21-lab-message" class="v21-lab-message" role="status">${safe(message)}</p>
   <div class="v21-lab-actions"><button type="button" class="v21-lab-primary" data-lab-action="simulate" ${count?'':'disabled'}>⚔️ 開始模擬戰鬥</button>
    <button type="button" data-lab-action="save-a">保存陣容 A ${savedA?'✓':''}</button>
    <button type="button" data-lab-action="save-b">保存陣容 B ${savedB?'✓':''}</button>
    <button type="button" data-lab-action="compare" ${savedA&&savedB?'':'disabled'}>📊 比較 A／B</button>
    <button type="button" class="v21-lab-secondary" data-lab-action="reset">重設測試隊伍</button></div>
   ${battle}${comparison}
   <p class="v21-lab-disclaimer">目前提供 12 名研究用角色原型、6 種融合、5 件變異裝備、5 種敵人。此頁不是正式招募／戰鬥，A、B 僅在這次開啟期間暫存。</p>
   </div>`;
 }
 function change(field,index,value){
  const d=normalizeResearchDraft(draft),slot=d.slots[index];message='';
  if(field==='slot'){
   const next=byId.get(value);
   if(value&&(!next||d.slots.some((s,j)=>j!==index&&s?.id===value))){message='同一名角色不能重複上場，請選另一名隊員。';}
   else d.slots[index]=next?{id:next.id,path:next.path}:null;
  }else if(field==='path'&&slot){
   if(jobById.get(byId.get(slot.id).job).paths.some(p=>p.id===value))slot.path=value;
  }else if(field==='imprint'&&slot){
   if(!value)delete d.imprints[slot.id];
   else if(!traitIds.has(value)||jobById.get(byId.get(slot.id).job).tags.includes(value))message='不能移植角色原本的羈絆。';
   else if(Object.keys(d.imprints).filter(id=>id!==slot.id).length>=2)message='移植上限為兩個，請先移除另一名隊員的印記。';
   else d.imprints[slot.id]=value;
  }else if(field==='gear'&&slot){
   if(!value)delete d.gear[slot.id];else if(gearIds.has(value))d.gear[slot.id]=value;
  }else if(field==='fusion')d.fusion=fusionIds.has(value)?value:'';
  else if(field==='commanderPath'&&commanderIds.has(value))d.commanderPath=value;
  else if(field==='enemy'&&enemyIds.has(value))d.enemy=value;
  else if(field==='seed')d.seed=bound(value,1,4294967295,72);
  else if(field==='ticks')d.ticks=bound(value,30,200,90);
  draft=d;last=null;compared=null;
  if(d.fusion&&!currentBuild().fusion)message='此融合尚未達條件，請更換隊員或移植印記。';
  render();
 }
 function action(command){
  const d=normalizeResearchDraft(draft);message='';
  if(command==='reset'){
   draft=researchDefaultDraft();last=null;compared=null;
   message='已重設研究隊伍；正式存檔完全不變。';
  }else if(command==='simulate'){
   const snap=snapshot();last=simulateLabBattle(snap.squad,{...snap.options,enemy:d.enemy,seed:d.seed,ticks:d.ticks});
   compared=null;message='完成一場可重現的六人模擬，未發放任何獎勵。';
  }else if(command==='save-a'){
   savedA=clone(snapshot());message='陣容 A 已暫存；現在可更換流派、徽章或角色，再保存 B。';
  }else if(command==='save-b'){
   savedB=clone(snapshot());message='陣容 B 已暫存，可以使用相同敵人與亂數種子比較。';
  }else if(command==='compare'){
   if(savedA&&savedB){compared=researchCompare(savedA,savedB,{enemy:d.enemy,seed:d.seed,ticks:d.ticks,samples:5});
    message='完成五組同條件 A／B 模擬。';}
   else message='請先保存陣容 A 與 B。';
  }
  render();
  if(command==='simulate'||command==='compare'){
   host.querySelector(command==='compare'?'#v21-lab-comparison':'#v21-lab-report')?.scrollIntoView({block:'nearest',behavior:'auto'});
  }
 }
 function onChange(event){
  const control=event.target.closest('[data-lab-field]');
  if(control)change(control.dataset.labField,Number(control.dataset.index),control.value);
 }
 function onClick(event){
  const button=event.target.closest('button[data-lab-action]');
  if(button&&!button.disabled)action(button.dataset.labAction);
 }
 return {mount(container){
  if(host){host.removeEventListener('change',onChange);host.removeEventListener('click',onClick);}
  host=container;if(!host)return;
  host.addEventListener('change',onChange);host.addEventListener('click',onClick);render();
 },getDraft:()=>clone(draft),getSnapshot:()=>clone(snapshot())};
}
