/** Deterministic fixed-formation combat tick prototype.
 * Pure simulation; existing live combat and salary saves remain untouched.
 * A caller owns rendering, animations, persistence and frame scheduling.
 */
import {planFormationActions} from './formation-combat-ai.mjs';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
const copy=u=>{const maxHp=Math.max(1,Number(u.maxHp)||1);return {...u,maxHp,hp:clamp(u.hp??maxHp,0,maxHp),shield:Math.max(0,Number(u.shield)||0),energy:clamp(u.energy??0,0,100),cooldown:Math.max(0,Number(u.cooldown)||0)};};
export function createFormationBattle({allies=[],enemies=[]}={}){
 const normalize=(arr,side)=>arr.map((u,i)=>({...copy(u),id:String(u.id??side+i),side,attack:Math.max(1,Number(u.attack)||10),attackInterval:Math.max(.3,Number(u.attackInterval)||1.8)}));
 return {time:0,allies:normalize(allies,'ally'),enemies:normalize(enemies,'enemy'),events:[],winner:null};
}
const living=arr=>arr.filter(x=>x.hp>0);
function damage(target,amount){
 const armor=Math.max(0,Number(target.armor)||0);
 const raw=Math.max(1,Math.round(Math.max(1,amount)*(100/(100+armor)))),blocked=Math.min(target.shield,raw);
 target.shield-=blocked;
 const dealt=Math.min(target.hp,raw-blocked);
 target.hp-=dealt;
 return {dealt,blocked};
}
export function tickFormationBattle(previous,dt=0.1){
 const elapsed=clamp(dt,0,1),s={...previous,time:previous.time+elapsed,allies:previous.allies.map(copy),enemies:previous.enemies.map(copy),events:[]};
 if(previous.winner||!elapsed)return {...s,winner:previous.winner};
 for(const u of [...s.allies,...s.enemies]){u.cooldown=Math.max(0,u.cooldown-elapsed);u.shieldCooldown=Math.max(0,(u.shieldCooldown||0)-elapsed);if(u.role==='support'&&u.shieldCooldown===0)u.shieldReady=true;}
 // Both teams plan from the same tick snapshot. An actor killed earlier in the
 // tick cannot perform its queued action.
 const queue=[
  ...planFormationActions(s.allies,s.enemies).map(x=>({...x,side:'ally'})),
  ...planFormationActions(s.enemies,s.allies).map(x=>({...x,side:'enemy'}))
 ];
 for(const action of queue){
  const own=action.side==='ally'?s.allies:s.enemies;
  const opponents=action.side==='ally'?s.enemies:s.allies;
  const actor=own.find(u=>u.id===action.actorId);
  const target=(action.type==='attack'?opponents:own).find(u=>u.id===action.targetId);
  if(!actor||actor.hp<=0||actor.cooldown>0||!target||target.hp<=0)continue;
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
  }else{
   const {dealt,blocked}=damage(target,actor.attack);
   actor.energy=clamp(actor.energy+8,0,100);
   s.events.push({type:'attack',actorId:actor.id,targetId:target.id,damage:dealt,blocked});
   if(actor.lifeSteal&&dealt>0){
    const healed=Math.min(actor.maxHp-actor.hp,Math.floor(dealt*clamp(actor.lifeSteal,0,.5)));
    if(healed>0){actor.hp+=healed;s.events.push({type:'leech',actorId:actor.id,targetId:actor.id,amount:healed});}
   }
   if(target.hp===0)s.events.push({type:'defeat',targetId:target.id});
  }
  actor.cooldown=actor.attackInterval;
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
