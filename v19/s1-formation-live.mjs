/** Incremental live-combat adapter. The existing hero attack, loot and wave
 * transitions remain authoritative; colleagues now have independent HP,
 * cooldowns and action targets instead of an unconditional damage bonus.
 */
import {squadStats} from './v21-squad-core.mjs';
import {chooseAttackTarget} from './formation-combat-ai.mjs';
import {createFormationBattle,tickFormationBattle} from './formation-combat-runtime.mjs';
export function advanceLiveColleagues({draft,level=1,enemy,previous=null,seconds=1.8}={}){
 const members=squadStats(draft,level).filter(Boolean);
 if(!members.length)return {state:null,damage:0,heal:0,shield:0,actions:[],events:[]};
 const key=String(enemy?.typeId??enemy?.id??'enemy');
 const enemyMaxHp=Math.max(1,Number(enemy?.maxHp)||1);
 const reset=!previous||previous.enemyKey!==key||previous.enemyMaxHp!==enemyMaxHp||
  previous.units.join('|')!==members.map(m=>m.id).join('|')||previous.wave!==enemy?.wave;
 let battle;
 if(reset){
  const allies=members.map(m=>({
   id:m.id,name:m.name,role:m.role,row:m.slot?.startsWith('rear')?'rear':'front',
   lane:Math.max(0,Math.min(2,(squadStats(draft,level).findIndex(x=>x?.id===m.id))%3)),maxHp:m.maxHp,hp:m.maxHp,attack:m.attack,
   attackInterval:Math.max(.7,2.1-m.speed*.025),
   healPower:m.role==='healer'?Math.round(m.attack*1.5):0,
   shieldPower:m.role==='support'?Math.round(m.attack*1.4):0,
   shieldReady:m.role==='support',shieldInterval:8
  }));
  // Enemy retaliation is handled by the legacy battle until full migration.
  // The formation opponent is a target-only proxy, never an extra attacker.
  battle=createFormationBattle({allies,enemies:[{
   id:'live-enemy',name:enemy?.name||'敵人',role:'tank',row:'front',lane:1,
   hp:Math.max(1,Number(enemy?.hp)||1),maxHp:enemyMaxHp,
   attack:1,attackInterval:999999,cooldown:999999
  }]});
 }else{
  battle={...previous.battle,allies:previous.battle.allies.map(u=>({...u,statuses:u.statuses?.map(x=>({...x}))||[]})),
   enemies:previous.battle.enemies.map(u=>({...u,statuses:u.statuses?.map(x=>({...x}))||[]})),events:[],winner:null};
  battle.enemies[0].hp=Math.max(1,Math.min(enemyMaxHp,Number(enemy?.hp)||1));
 }
 const events=[];
 const total=Math.max(.1,Math.min(5,Number.isFinite(Number(seconds))?Number(seconds):1.8));
 for(let t=0;t<total-1e-8;t+=.1){
  battle=tickFormationBattle(battle,Math.min(.1,total-t));
  events.push(...battle.events);
  if(battle.winner)break;
 }
 const damage=events.filter(x=>x.type==='attack'&&x.actorId!=='live-enemy').reduce((sum,x)=>sum+x.damage,0);
 const actions=members.map(m=>{
  const e=events.filter(x=>x.actorId===m.id);
  return {id:m.id,damage:e.filter(x=>x.type==='attack').reduce((a,x)=>a+x.damage,0),
   heal:e.filter(x=>x.type==='heal').reduce((a,x)=>a+x.amount,0),
   shield:e.filter(x=>x.type==='shield').reduce((a,x)=>a+x.amount,0)};
 });
 return {state:{battle,enemyKey:key,enemyMaxHp,units:members.map(m=>m.id),wave:enemy?.wave},
  damage,heal:0,shield:0,actions,events};
}

/** Apply a portion of a real enemy retaliation as splash against deployed
 * colleagues. This never changes the legacy hero's HP or rewards.
 * Defeated colleagues remain inactive until the next encounter.
 */
export function applyColleagueRetaliation(previous,damage,{enemyRole='melee',targetId=null}={}){
 if(!previous?.battle||!(Number(damage)>0))return {state:previous,events:[]};
 const battle={...previous.battle,allies:previous.battle.allies.map(u=>({...u,statuses:(u.statuses||[]).map(x=>({...x}))})),
  enemies:previous.battle.enemies.map(u=>({...u})),events:[]};
 const living=battle.allies.filter(u=>u.hp>0);
 if(!living.length)return {state:previous,events:[]};
 // The enemy chooses a real target, respecting taunt, row and assassin priorities.
 // targetId is reserved for deterministic scripted boss mechanics.
 const enemy={id:'live-enemy',role:enemyRole,row:'front',lane:1,hp:1,maxHp:1};
 const chosen=targetId?living.find(u=>u.id===targetId):null;
 const target=chosen||chooseAttackTarget(enemy,living);
 if(!target)return {state:previous,events:[]};
 const amount=Math.max(1,Math.round(Number(damage)*.35));
 const blocked=Math.min(target.shield||0,amount);
 target.shield=Math.max(0,(target.shield||0)-blocked);
 const lost=Math.min(target.hp,amount-blocked);
 target.hp-=lost;
 const events=[{type:'colleague-hit',actorId:'live-enemy',targetId:target.id,damage:lost,blocked}];
 if(target.hp===0)events.push({type:'colleague-defeat',targetId:target.id});
 return {state:{...previous,battle},events};
}

/** Resolve ONE enemy retaliation target across hero and deployed colleagues.
 * Existing hero mitigation is calculated upstream; no secondary splash hit.
 * A colleague's shield absorbs damage before HP, and the original state is immutable.
 */
export function routeLiveRetaliation(previous,damage,{heroHp=0,heroMaxHp=1,enemyRole='melee',targetId=null}={}){
 const amount=Math.max(0,Math.round(Number(damage)||0));
 if(!amount)return {state:previous,heroDamage:0,events:[],targetId:null};
 const units=previous?.battle?.allies||[];
 const hero={id:'salary-hero',role:'melee',row:'hero',lane:1,hp:Math.max(0,Number(heroHp)||0),maxHp:Math.max(1,Number(heroMaxHp)||1)};
 const living=[...units.filter(x=>x.hp>0),...(hero.hp>0?[hero]:[])];
 if(!living.length)return {state:previous,heroDamage:0,events:[],targetId:null};
 const attacker={id:'live-enemy',role:enemyRole,row:'front',lane:1,hp:1,maxHp:1};
 const target=(targetId&&living.find(x=>x.id===targetId))||chooseAttackTarget(attacker,living);
 if(!target)return {state:previous,heroDamage:0,events:[],targetId:null};
 if(target.id==='salary-hero'){
  return {state:previous,heroDamage:Math.min(hero.hp,amount),
   events:[{type:'hero-hit',actorId:attacker.id,targetId:hero.id,damage:Math.min(hero.hp,amount)}],targetId:hero.id};
 }
 const battle={...previous.battle,allies:units.map(x=>({...x,statuses:(x.statuses||[]).map(y=>({...y}))})),
  enemies:previous.battle.enemies.map(x=>({...x})),events:[]};
 const victim=battle.allies.find(x=>x.id===target.id);
 const blocked=Math.min(Math.max(0,victim.shield||0),amount);
 victim.shield=Math.max(0,(victim.shield||0)-blocked);
 const dealt=Math.min(victim.hp,amount-blocked);
 victim.hp-=dealt;
 const events=[{type:'colleague-hit',actorId:attacker.id,targetId:victim.id,damage:dealt,blocked}];
 if(victim.hp===0)events.push({type:'colleague-defeat',targetId:victim.id});
 return {state:{...previous,battle},heroDamage:0,events,targetId:victim.id};
}
