/* Salary Hero V21 — six-unit squad PROTOTYPE (pure mechanics only).
 * No import from app.mjs or engine.mjs; does not touch saves, salary or
 * currently live single-character combat until migration is explicitly done.
 */
export const SQUAD_SLOTS=Object.freeze([
 {id:'front-left',row:'front',x:0,y:0},{id:'front-right',row:'front',x:1,y:0},
 {id:'middle-left',row:'middle',x:0,y:1},{id:'middle-right',row:'middle',x:1,y:1},
 {id:'rear-left',row:'rear',x:0,y:2},{id:'rear-right',row:'rear',x:1,y:2}
]);
export const SQUAD_JOBS=Object.freeze([
 {id:'sentinel',name:'打卡守衛',role:'tank',tags:['office','shield'],hp:188,atk:16,spd:8,paths:[
  {id:'bulwark',name:'不動如山',effect:'guard',value:.19},
  {id:'thorns',name:'反彈公文',effect:'reflect',value:.26},
  {id:'decoy',name:'代班誘敵',effect:'taunt',value:.30}]},
 {id:'fighter',name:'逃班鬥士',role:'melee',tags:['office','night'],hp:139,atk:30,spd:11,paths:[
  {id:'rampage',name:'爆肝狂戰',effect:'lowhp',value:.35},
  {id:'duelist',name:'雙劍連斬',effect:'double',value:.23},
  {id:'reaper',name:'吸血加班',effect:'leech',value:.21}]},
 {id:'assassin',name:'截止日刺客',role:'assassin',tags:['night','shadow'],hp:105,atk:35,spd:15,paths:[
  {id:'execution',name:'最後一分鐘',effect:'execute',value:.42},
  {id:'poison',name:'慢性過勞',effect:'poison',value:.23},
  {id:'ambush',name:'影子摸魚',effect:'backstab',value:.27}]},
 {id:'mage',name:'試算表法師',role:'caster',tags:['arcane','myth'],hp:109,atk:32,spd:10,paths:[
  {id:'fire',name:'火力報表',effect:'splash',value:.29},
  {id:'frost',name:'冰封會議',effect:'slow',value:.25},
  {id:'arcane',name:'魔力稽核',effect:'charge',value:12}]},
 {id:'medic',name:'咖啡醫官',role:'healer',tags:['office','arcane'],hp:116,atk:17,spd:12,paths:[
  {id:'restoration',name:'補休療癒',effect:'heal',value:.30},
  {id:'barrier',name:'加班保險',effect:'barrier',value:.21},
  {id:'battlemedic',name:'戰地急救',effect:'hybrid',value:.27}]},
 {id:'engineer',name:'機械工程師',role:'support',tags:['office','mecha'],hp:128,atk:23,spd:10,paths:[
  {id:'turret',name:'自動砲台',effect:'summon',value:.27},
  {id:'overdrive',name:'超頻機兵',effect:'overdrive',value:.33},
  {id:'logistics',name:'資源調度',effect:'buff',value:.14}]}
]);
export const COMMANDER_PATHS=Object.freeze([
 {id:'overtime',name:'爆肝隊長',job:'團隊爆發',ability:'全隊提高傷害與追擊機會',cost:100},
 {id:'strategist',name:'摸魚軍師',job:'控制與轉場',ability:'打斷敵方技能並標記弱點',cost:100},
 {id:'logistics',name:'後勤主管',job:'治療與護盾',ability:'全隊恢復生命並給予護盾',cost:100}
]);
const roleRows={tank:'front',melee:'front',assassin:'middle',caster:'rear',healer:'rear',support:'middle'};
const job=id=>SQUAD_JOBS.find(x=>x.id===id);
const clamp=(x,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+x)?+x:min));
export function squadMember(raw={}){
 const input=raw&&typeof raw==='object'?raw:{};
 const definition=job(input.job);
 if(!definition||typeof input.id!=='string'||!input.id.trim()||input.id.length>80)return null;
 const path=definition.paths.find(x=>x.id===input.path)??definition.paths[0];
 return {id:input.id,job:definition.id,path:path.id,level:Math.floor(clamp(input.level,1,100)),
         stars:Math.floor(clamp(input.stars,1,6)),name:(typeof input.name==='string'&&input.name.trim())?input.name.slice(0,26):definition.name};
}
export function normalizeSquadDraft(raw={}){
 const original=Array.isArray(raw?.slots)?raw.slots:[];
 const seen=new Set();
 const slots=SQUAD_SLOTS.map((_,idx)=>{
  const member=squadMember(original[idx]);
  if(!member||seen.has(member.id))return null;
  seen.add(member.id);return member;
 });
 const commander=COMMANDER_PATHS.find(x=>x.id===raw?.commanderPath)?.id??'strategist';
 return {version:1,commanderPath:commander,slots};
}
export function canPlaceMember(draft,index,member){
 if(!Number.isInteger(index)||index<0||index>=SQUAD_SLOTS.length)return false;
 const normalized=squadMember(member);if(!normalized)return false;
 return !normalizeSquadDraft(draft).slots.some((x,i)=>i!==index&&x?.id===normalized.id);
}
export function assignSquadMember(draft,index,member){
 const normalized=normalizeSquadDraft(draft);
 if(member!==null&&!canPlaceMember(normalized,index,member))return normalized;
 if(!Number.isInteger(index)||index<0||index>5)return normalized;
 const slots=normalized.slots.slice();slots[index]=member===null?null:squadMember(member);
 return {version:1,commanderPath:normalized.commanderPath,slots};
}
export function squadSynergies(draft){
 const squad=normalizeSquadDraft(draft);
 const counter={};
 for(const member of squad.slots){
  if(!member)continue;
  for(const tag of job(member.job).tags)counter[tag]=(counter[tag]||0)+1;
 }
 return Object.entries(counter)
  .filter(([,count])=>count>=2)
  .map(([tag,count])=>({tag,count,tier:count>=4?2:1}))
  .sort((a,b)=>b.tier-a.tier||b.count-a.count||a.tag.localeCompare(b.tag));
}
export function squadStats(draft){
 const formation=normalizeSquadDraft(draft);
 const tagged=squadSynergies(formation);
 const officeBoost=tagged.find(s=>s.tag==='office')?.tier??0;
 return formation.slots.map((m,i)=>{
  if(!m)return null;
  const j=job(m.job),p=j.paths.find(x=>x.id===m.path);
  const multi=1+(m.level-1)*.055+(m.stars-1)*.11;
  const x={id:m.id,name:m.name,job:j.id,role:j.role,preferredRow:roleRows[j.role],
    slot:SQUAD_SLOTS[i].id,row:SQUAD_SLOTS[i].row,path:m.path,effect:p.effect,value:p.value,
    maxHp:Math.round(j.hp*multi),attack:Math.round(j.atk*multi*(1+officeBoost*.035)),
    speed:j.spd+(m.stars-1),shield:0};
  if(x.row!==x.preferredRow)x.formationHint='非典型站位：可組特殊陣容';
  return x;
 });
}
export function commanderAction(draft,{charge=0,allies=[],enemies=[]}={}){
 const sq=normalizeSquadDraft(draft);
 const ready=clamp(charge,0,100)>=100;
 const alive=Array.isArray(allies)?allies.filter(x=>x&&x.hp>0):[];
 const opponent=Array.isArray(enemies)?enemies.filter(x=>x&&x.hp>0):[];
 if(!ready)return {ready:false,path:sq.commanderPath,charge:clamp(charge,0,100),effects:[]};
 const path=sq.commanderPath;
 if(path==='overtime')return {ready:true,path,charge:0,effects:alive.map(x=>({target:x.id,type:'damage-buff',value:.20,duration:6}))};
 if(path==='logistics')return {ready:true,path,charge:0,effects:alive.map(x=>({
  target:x.id,type:'heal-shield',heal:Math.ceil((Number(x.maxHp)||0)*.18),shield:Math.ceil((Number(x.maxHp)||0)*.10)
 }))};
 return {ready:true,path,charge:0,effects:opponent.map(x=>({target:x.id,type:'interrupt-weaken',damageTaken:.16,duration:4}))};
}
export function squadPreview(draft){
 const squad=normalizeSquadDraft(draft);
 const units=squadStats(squad).filter(Boolean);
 const filled=units.length;
 const roles=Object.fromEntries(SQUAD_JOBS.map(x=>[x.role,units.filter(m=>m.role===x.role).length]));
 return {filled,empty:6-filled,units,roles,synergies:squadSynergies(squad),commander:squad.commanderPath,
  baseAttack:units.reduce((sum,m)=>sum+m.attack,0),baseHp:units.reduce((sum,m)=>sum+m.maxHp,0)};
}
