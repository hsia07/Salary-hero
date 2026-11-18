/** 把分層骨架同事放上即時戰場（720×620 邏輯畫布之上的常駐 DOM 層）。
 * 只讀戰鬥狀態、不改任何結算：依 state.last 的實際事件播放動作。
 *  - colleagueActions 有該同事傷害 → 普攻（真的衝到敵人身上、筆尖接觸）
 *  - colleagueHits 命中該同事 → 有護盾則格擋，否則受擊紅閃；倒下 → 倒地
 *  - colleagueCounter（反擊條款）→ 反擊突刺
 *  - 敵人 nullifiedBy（無效條款）→ 每個敵人播一次驅散
 *  - 波次改變 → 走位
 * 常駐容器不會被 renderSquadStage 的 innerHTML 洗掉。
 */
import {loadRig,createRigActor,THRUST_ARM} from './rig-actor.mjs';
import {SQUAD_JOBS} from './v21-squad-core.mjs';
import {BATTLE_STAGE,v20EnemyArtBounds} from './v20-battle-stage.mjs';

// 邏輯畫布座標（720×620）：主角腳底約 x=161–283、y=525；白律站在主角左前方，不遮住主角臉部
const RIGS={lawyer:{base:'../art/characters/office-lawyer/layers/rig/',height:255,homeX:118,feetY:556}};
/** 最近 30 次實際播放的動作（驗收與除錯用，不影響遊戲） */
export const rigLog=[];
export const rigStats={sync:0,newLast:0,lastType:null,colleagueActions:null,actorIds:[]};
export const FOLLOW_UP_MS=420;
let layer=null,canvasEl=null,actors=new Map(),lastSeen=null,lastWave=null,loading=new Set(),dispelled=new Set();
/** 畫布為 object-fit:contain：計算內容實際縮放與留白，邏輯座標 → 圖層座標 */
function view(){
 if(!canvasEl)return {f:1,ox:0,oy:0};
 const W=canvasEl.clientWidth,H=canvasEl.clientHeight,f=Math.min(W/BATTLE_STAGE.width,H/BATTLE_STAGE.height);
 return {f,ox:(W-BATTLE_STAGE.width*f)/2,oy:(H-BATTLE_STAGE.height*f)/2};
}
const px=()=>view().f;

function ensureLayer(canvas){
 if(layer&&layer.isConnected)return layer;
 canvasEl=canvas;
 layer=document.createElement('div');
 layer.id='rig-actors';layer.setAttribute('aria-hidden','true');
 layer.style.cssText='position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:6;overflow:visible';
 canvas.insertAdjacentElement('afterend',layer);
 const fit=()=>{layer.style.height=canvas.clientHeight+'px';layer.style.top=canvas.offsetTop+'px';for(const a of actors.values())placeHome(a);};
 new ResizeObserver(fit).observe(canvas);fit();
 return layer;
}
function placeHome(entry){
 const v=view(),cfg=RIGS[entry.job];
 entry.homeFeetX=v.ox+cfg.homeX*v.f;
 entry.actor.setPosition(entry.homeFeetX,v.oy+cfg.feetY*v.f);
 // 只在閒置時量一次出筆姿勢的筆尖位置並快取，避免打斷進行中的動作
 if(!entry.actor.busy){entry.actor.pose({arm:THRUST_ARM,armX:30,armY:10,torso:12,lean:8});const tip=entry.actor.penTip();entry.actor.pose({});if(tip)entry.tipOffset=tip.x-entry.homeFeetX;}
}
/** 讓筆尖抵達敵人身體（以出筆姿勢實測筆尖，不憑估計） */
function reachToEnemy(entry,enemy){
 const v=view(),b=v20EnemyArtBounds({boss:!!enemy?.boss,elite:enemy?.tier==='elite'});
 // 筆尖刺入敵人身體：實測各怪物插畫主體偏中心右側，取中心再往右 25% 半寬（逐格截圖驗證）
 const target=v.ox+(b.center+(b.right-b.center)*.25)*v.f;
 return Math.max(0,target-(entry.homeFeetX+(entry.tipOffset??0)));
}
async function spawn(job,memberId){
 if(loading.has(memberId)||actors.has(memberId))return;
 loading.add(memberId);
 try{
  const cfg=RIGS[job],rig=await loadRig(cfg.base);
  const actor=createRigActor(layer,rig,cfg.base,{height:cfg.height*px()});
  const entry={job,memberId,actor};actors.set(memberId,entry);placeHome(entry);
  actor.play('walk',700);
 }catch(e){console.warn('rig actor 載入失敗',memberId,e);}
 finally{loading.delete(memberId);}
}
export function syncRigActors(state,{canvas}){
 if(!canvas)return;
 rigStats.sync++;
 ensureLayer(canvas);
 const slots=state?.colleagueFormation?.slots||[];
 const wanted=new Map(slots.filter(m=>m&&RIGS[m.job]).map(m=>[m.id,m.job]));
 for(const [id,entry] of actors)if(!wanted.has(id)){entry.actor.destroy();actors.delete(id);}
 for(const [id,job] of wanted)if(!actors.has(id))spawn(job,id);
 const last=state?.last;
 if(state?.wave!==lastWave){if(lastWave!==null)for(const e of actors.values())e.actor.play('walk',650);lastWave=state?.wave;}
 if(!last||last===lastSeen)return;
 lastSeen=last;rigStats.newLast++;rigStats.lastType=last.type;rigStats.colleagueActions=JSON.stringify(last.colleagueActions||null).slice(0,200);rigStats.actorIds=[...actors.keys()];
 const enemy=state.enemy;
 for(const [id,entry] of actors){
  const raw=entry.actor;
  const a={...raw,play:(n,o)=>{rigLog.push({t:Date.now(),id,action:n,wave:state.wave,reach:o?.reach!=null?Math.round(o.reach):undefined,busy:raw.busy});if(rigLog.length>30)rigLog.shift();return raw.play.call(raw,n,o);},el:raw.el};
  const unit=state.formationCombat?.battle?.allies?.find(u=>u.id===id);
  const hit=(last.colleagueHits||[]).find(e=>e.targetId===id&&e.type==='colleague-hit');
  const down=(last.colleagueHits||[]).some(e=>e.targetId===id&&e.type==='colleague-defeat');
  const acted=(last.colleagueActions||[]).find(x=>x.id===id&&x.damage>0);
  const enemyKey=enemy?(enemy.typeId||enemy.id)+'#'+state.wave:'';
  if(down){a.play('defeat');continue;}
  if(unit&&unit.hp>0&&a.el.style.opacity&&+a.el.style.opacity<1)a.play('revive');
  if(enemy?.nullifiedBy===id&&!dispelled.has(enemyKey)){dispelled.add(enemyKey);a.play('dispel');continue;}
  if(hit){
   if(hit.blocked>0)a.play('block');
   else a.play('hurt').then(()=>{if(last.colleagueCounter)a.play('attack',{reach:reachToEnemy(entry,enemy)});});
   continue;
  }
  // 主角命中後約 0.4 秒追擊，避免與主角突進同時發生而被擋住
  if(acted)setTimeout(()=>a.play('attack',{reach:reachToEnemy(entry,enemy)}),FOLLOW_UP_MS);
 }
}
export function rigJobs(){return SQUAD_JOBS.filter(j=>RIGS[j.id]).map(j=>j.id);}
/** 驗收用：以與實戰相同的路徑觸發動作（不改戰鬥狀態）。 */
export function debugRigPlay(state,id,action){
 const entry=actors.get(id);if(!entry)return null;
 const opts=action==='attack'?{reach:reachToEnemy(entry,state?.enemy)}:undefined;
 entry.actor.play(action,opts);
 return {reach:opts?.reach,tipOffset:entry.tipOffset,homeFeetX:entry.homeFeetX};
}
export function debugRigTip(id){const e=actors.get(id);return e?e.actor.penTip():null;}
