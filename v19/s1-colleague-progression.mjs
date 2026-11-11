/* S1 colleague progression: immutable transactions, compatible with V21 squad drafts.
 * No visual assets or battle-mode migration is implied by this module.
 */
import {colleagueCap,colleagueUpgradeCost,upgradeColleague,BREAK_CAPS} from './s1-progression.mjs';
import {normalizeSquadDraft} from './v21-squad-core.mjs';
export const BREAKTHROUGH_COSTS=Object.freeze([
 {coins:1000,seals:2,emblems:0},
 {coins:3000,seals:5,emblems:2},
 {coins:8000,seals:10,emblems:5},
 {coins:20000,seals:20,emblems:10}
]);
const clean=(n)=>Number.isSafeInteger(n)&&n>=0?n:0;
export function normalizeColleagueProgress(raw={},slaveLevel=1){
 const input=raw&&typeof raw==='object'?raw:{};
 const max=Math.max(1,Math.min(100,Math.floor(Number(slaveLevel)||1)));
 const original=Array.isArray(input.members)?input.members:[];
 const seen=new Set();
 const members=original.slice(0,24).flatMap(x=>{
  if(!x||typeof x.id!=='string'||!x.id.trim()||x.id.length>80||seen.has(x.id))return [];
  seen.add(x.id);
  const breakthrough=Math.max(0,Math.min(4,Math.floor(Number(x.breakthrough)||0)));
  return [{id:x.id,breakthrough,level:Math.max(1,Math.min(colleagueCap(max,breakthrough),Math.floor(Number(x.level)||1)))}];
 });
 const m=input.materials||{};
 return {version:1,members,materials:{trainingXp:clean(m.trainingXp),coins:clean(m.coins),seals:clean(m.seals),emblems:clean(m.emblems)}};
}
export function enrollColleague(raw,id,slaveLevel=1){
 const state=normalizeColleagueProgress(raw,slaveLevel);
 if(typeof id!=='string'||!id.trim()||id.length>80||state.members.some(m=>m.id===id)||state.members.length>=24)return {ok:false,reason:'invalid-member',state};
 return {ok:true,state:{...state,members:[...state.members,{id,level:1,breakthrough:0}]}};
}
export function trainColleague(raw,id,slaveLevel=1){
 const state=normalizeColleagueProgress(raw,slaveLevel);
 const index=state.members.findIndex(m=>m.id===id);
 if(index<0)return {ok:false,reason:'not-owned',state};
 const result=upgradeColleague(state.members[index],slaveLevel,state.materials);
 if(!result.ok)return {...result,state};
 const members=state.members.map((m,i)=>i===index?{...m,level:result.level}:m);
 return {ok:true,cost:result.cost,state:{...state,members,materials:result.materials}};
}
export function breakthroughColleague(raw,id,slaveLevel=1){
 const state=normalizeColleagueProgress(raw,slaveLevel);
 const index=state.members.findIndex(m=>m.id===id);
 if(index<0)return {ok:false,reason:'not-owned',state};
 const member=state.members[index];
 if(member.breakthrough>=4)return {ok:false,reason:'max-breakthrough',state};
 if(member.level<BREAK_CAPS[member.breakthrough])return {ok:false,reason:'level-requirement',state};
 const cost=BREAKTHROUGH_COSTS[member.breakthrough];
 if(Object.entries(cost).some(([key,value])=>state.materials[key]<value))return {ok:false,reason:'insufficient-materials',cost,state};
 return {ok:true,cost,state:{...state,
  members:state.members.map((m,i)=>i===index?{...m,breakthrough:m.breakthrough+1}:m),
  materials:Object.fromEntries(Object.entries(state.materials).map(([key,value])=>[key,value-(cost[key]||0)]))}};
}
export function applyProgressToSquad(draft,raw,slaveLevel=1){
 const state=normalizeColleagueProgress(raw,slaveLevel);
 const byId=new Map(state.members.map(m=>[m.id,m]));
 const sq=normalizeSquadDraft(draft);
 return {...sq,slots:sq.slots.map(m=>{
  if(!m)return null;
  const owned=byId.get(m.id);
  return owned?{...m,level:owned.level}:null;
 })};
}
export function trainingCostPreview(raw,id,slaveLevel=1){
 const state=normalizeColleagueProgress(raw,slaveLevel);
 const member=state.members.find(m=>m.id===id);
 if(!member)return null;
 return {member,cap:colleagueCap(slaveLevel,member.breakthrough),nextCost:colleagueUpgradeCost(member.level)};
}
