/** Deterministic fixed-formation combat tick prototype.
 * Pure simulation; existing live combat and salary saves remain untouched.
 * A caller owns rendering, animations, persistence and frame scheduling.
 */
import {planFormationActions} from './formation-combat-ai.mjs';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
const copy=u=>{const maxHp=Math.max(1,Number(u.maxHp)||1);return {...u,maxHp,hp:clamp(u.hp??maxHp,0,maxHp),shield:Math.max(0,Number(u.shield)||0),energy:clamp(u.energy??0,0,100),cooldown:Math.max(0,Number(u.cooldown)||0),statuses:Array.isArray(u.statuses)?u.statuses.map(x=>({...x})):[]};};
export function createFormationBattle({allies=[],enemies=[]}={}){
 const normalize=(arr,side)=>arr.map((u,i)=>({...copy(u),id:String(u.id??side+i),side,attack:Math.max(1,Number(u.attack)||10),attackInterval:Math.max(.3,Number(u.attackInterval)||1.8)}));
 return {time:0,allies:normalize(allies,'ally'),enemies:normalize(enemies,'enemy'),events:[],winner:null};
}
const living=arr=>arr.filter(x=>x.hp>0);
// 可被驅散的增益狀態（負面狀態如 poison/stun/slow 不受影響）
export const BUFF_TYPES=new Set(['enrage','fortify','haste','regen','contract']);
function damage(target,amount){
 const armor=Math.max(0,Number(target.armor)||0);
 const raw=Math.max(1,Math.round(Math.max(1,amount)*(100/(100+armor)))),blocked=Math.min(target.shield,raw);
 target.shield-=blocked;
 const dealt=Math.min(target.hp,raw-blocked);
 target.hp-=dealt;
 return {dealt,blocked};
}
function applyUltimate(s,actor,pick){
 const buffs=pick.statuses.filter(x=>BUFF_TYPES.has(x.type));
 const removedShield=pick.shield;
 pick.shield=0;pick.statuses=pick.statuses.filter(x=>!BUFF_TYPES.has(x.type));
 const {dealt}=damage(pick,actor.attack*Math.max(1,Number(actor.ultimate.multiplier)||4));
 actor.energy=0;
 s.events.push({type:'ultimate',actorId:actor.id,targetId:pick.id,damage:dealt,removedShield,removedStatuses:buffs.map(x=>x.type),name:actor.ultimate.name||'ultimate'});
 if(pick.hp===0)s.events.push({type:'defeat',targetId:pick.id});
}
/** 玩家手動施放大招（能量滿才成立）。目標：指定的存活敵人；未指定則 Boss／最高生命優先。
 * 回傳新狀態，events 只含這次施放產生的事件；條件不成立時原樣回傳（events 為空）。 */
export function castUltimate(previous,actorId,targetId=null){
 const s={...previous,allies:previous.allies.map(copy),enemies:previous.enemies.map(copy),events:[]};
 if(previous.winner)return s;
 const actor=s.allies.find(u=>u.id===actorId);
 if(!actor||actor.hp<=0||!actor.ultimate||actor.energy<100)return s;
 const alive=s.enemies.filter(u=>u.hp>0);
 const pick=alive.find(u=>u.id===targetId)||alive.sort((x,y)=>(y.boss?1:0)-(x.boss?1:0)||y.maxHp-x.maxHp)[0];
 if(!pick)return s;
 applyUltimate(s,actor,pick);
 if(!s.enemies.some(u=>u.hp>0))s.winner='allies';
 return s;
}
export function tickFormationBattle(previous,dt=0.1){
 const elapsed=clamp(dt,0,1),s={...previous,time:previous.time+elapsed,allies:previous.allies.map(copy),enemies:previous.enemies.map(copy),events:[]};
 if(previous.winner||!elapsed)return {...s,winner:previous.winner};
 for(const u of [...s.allies,...s.enemies]){
  u.cooldown=Math.max(0,u.cooldown-elapsed);
  u.shieldCooldown=Math.max(0,(u.shieldCooldown||0)-elapsed);
  u.dispelCooldown=Math.max(0,(Number(u.dispelCooldown)||0)-elapsed);
  u.counterCooldown=Math.max(0,(Number(u.counterCooldown)||0)-elapsed);
  if(u.role==='support'&&u.shieldCooldown===0)u.shieldReady=true;
  const active=[];
  for(const status of u.statuses){
   const remaining=Math.max(0,(Number(status.duration)||0)-elapsed);
   const next={...status,duration:remaining};
   if((status.type==='poison'||status.type==='burn')&&u.hp>0){
    next.tickClock=(Number(status.tickClock)||0)+elapsed;
    while(next.tickClock>=2-1e-8){
     next.tickClock=Math.max(0,next.tickClock-2);
     const {dealt,blocked}=damage(u,(Number(status.power)||1)*Math.max(1,Math.min(10,Number(status.stacks)||1)));
     s.events.push({type:'dot',status:status.type,targetId:u.id,damage:dealt,blocked});
     if(u.hp===0){s.events.push({type:'defeat',targetId:u.id});break;}
    }
   }
   if(remaining>0)active.push(next);
  }
  u.statuses=active;
 }
 // Both teams plan from the same tick snapshot. An actor killed earlier in the
 // tick cannot perform its queued action.
 // 玩家集火：指定的敵人存活時，我方一般攻擊改打它（治療、護盾不受影響）
 const focus=s.enemies.find(u=>u.id===s.focusTargetId&&u.hp>0);
 const queue=[
  ...planFormationActions(s.allies.filter(u=>u.hp>0&&u.cooldown<=0&&!u.statuses.some(x=>x.type==='stun'&&x.duration>0)),s.enemies,s.allies).map(x=>({...x,side:'ally',...(focus&&x.type==='attack'?{targetId:focus.id}:{})})),
  ...planFormationActions(s.enemies.filter(u=>u.hp>0&&u.cooldown<=0&&!u.statuses.some(x=>x.type==='stun'&&x.duration>0)),s.allies,s.enemies).map(x=>({...x,side:'enemy'}))
 ];
 for(const action of queue){
  const own=action.side==='ally'?s.allies:s.enemies;
  const opponents=action.side==='ally'?s.enemies:s.allies;
  const actor=own.find(u=>u.id===action.actorId);
  const target=(action.type==='attack'?opponents:own).find(u=>u.id===action.targetId);
  if(!actor||actor.hp<=0||actor.cooldown>0||!target||target.hp<=0)continue;
  if(actor.statuses.some(x=>x.type==='stun'&&x.duration>0))continue;
  // Never execute an action selected for an ally on the opposing side.
  if(action.type==='attack'&&target.side===actor.side)continue;
  if(action.type!=='attack'&&target.side!==actor.side)continue;
  if(action.type==='heal'){
   const healed=Math.min(target.maxHp-target.hp,Math.max(1,Math.round(actor.healPower??actor.attack*1.1)));
   if(healed<=0)continue;
   target.hp+=healed;
   s.events.push({type:'heal',actorId:actor.id,targetId:target.id,amount:healed});
  }else if(action.type==='shield'){
   const amount=Math.max(1,Math.round(actor.shieldPower??actor.attack*1.2));
   const cap=Math.round(target.maxHp*.5);
   const added=Math.max(0,Math.min(amount,cap-target.shield));
   target.shield+=added;
   actor.shieldReady=false;
   actor.shieldCooldown=Math.max(1,Number(actor.shieldInterval)||8);
   s.events.push({type:'shield',actorId:actor.id,targetId:target.id,amount:added});
  }else if(actor.ultimate&&!actor.ultimate.manual&&actor.energy>=100){
   // 大招（白律「終審判決」：使用者 2026-11-19 裁決方案 A）：單體高倍率傷害，先解除目標全部護盾與增益。
   // 目標：敵方 Boss／最高威脅（maxHp 最高、存活）優先，不沿用一般選敵。
   const pick=opponents.filter(u=>u.hp>0).sort((x,y)=>(y.boss?1:0)-(x.boss?1:0)||y.maxHp-x.maxHp)[0]||target;
   applyUltimate(s,actor,pick);
  }else{
   // 驅散（白律「無效條款」）：攻擊前先解除目標護盾與增益狀態，有冷卻。
   if(actor.dispelPower>0&&actor.dispelCooldown<=0){
    const buffs=target.statuses.filter(x=>BUFF_TYPES.has(x.type));
    if(target.shield>0||buffs.length){
     const removedShield=target.shield;
     target.shield=0;
     target.statuses=target.statuses.filter(x=>!BUFF_TYPES.has(x.type));
     actor.dispelCooldown=Math.max(1,Number(actor.dispelInterval)||8);
     s.events.push({type:'dispel',actorId:actor.id,targetId:target.id,removedShield,removedStatuses:buffs.map(x=>x.type)});
    }
   }
   const {dealt,blocked}=damage(target,actor.attack);
   actor.energy=clamp(actor.energy+8,0,100);
   s.events.push({type:'attack',actorId:actor.id,targetId:target.id,damage:dealt,blocked});
   if(actor.lifeSteal&&dealt>0){
    const healed=Math.min(actor.maxHp-actor.hp,Math.floor(dealt*clamp(actor.lifeSteal,0,.5)));
    if(healed>0){actor.hp+=healed;s.events.push({type:'leech',actorId:actor.id,targetId:actor.id,amount:healed});}
   }
   if(target.hp===0)s.events.push({type:'defeat',targetId:target.id});
   // 反擊（白律「反擊條款」）：被攻擊且存活時立即回擊攻擊者，有冷卻；不會連鎖反擊。
   else if(target.counter>0&&target.counterCooldown<=0&&actor.hp>0){
    const hit=damage(actor,target.attack*clamp(target.counter,0,2));
    target.counterCooldown=Math.max(.5,Number(target.counterInterval)||1.5);
    s.events.push({type:'counter',actorId:target.id,targetId:actor.id,damage:hit.dealt,blocked:hit.blocked});
    if(actor.hp===0)s.events.push({type:'defeat',targetId:actor.id});
   }
  }
  actor.cooldown=actor.attackInterval*(actor.statuses.some(x=>x.type==='slow'&&x.duration>0)?1.35:1);
 }
 if(!living(s.enemies).length&&!living(s.allies).length)s.winner='draw';
 else if(!living(s.enemies).length)s.winner='allies';
 else if(!living(s.allies).length)s.winner='enemies';
 else s.winner=null;
 return s;
}
export function simulateFormationBattle(config,{step=.1,maxSeconds=180}={}){
 let state=createFormationBattle(config);
 const safeStep=clamp(step,.01,1);
 const count=Math.ceil(clamp(maxSeconds,0,3600)/safeStep);
 for(let i=0;i<count&&!state.winner;i++)state=tickFormationBattle(state,safeStep);
 return state;
}
