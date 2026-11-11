/* Salary Hero V21 S1 — independent, deterministic build-research lab.
 * This module NEVER reads/saves money or character progress, and cannot modify
 * the live V19 battle unless a future explicit migration imports it.
 * All event chains use a capped queue and proc events never proc themselves.
 */
import {SQUAD_JOBS,normalizeSquadDraft,squadStats} from './v21-squad-core.mjs';

export const LAB_TRAITS=Object.freeze([
 {id:'office',name:'社畜'}, {id:'mecha',name:'機械'},
 {id:'night',name:'夜班'}, {id:'shadow',name:'暗影'},
 {id:'shield',name:'守護'}, {id:'arcane',name:'奧術'},
 {id:'myth',name:'神話'}
]);
export const LAB_IMPRINT_CAP=2;
export const LAB_FUSIONS=Object.freeze([
 {id:'perpetual-overtime',name:'永動加班',traits:['office','mecha'],description:'每第三次普通攻擊啟動機械追擊；放棄原始社畜和機械的羈絆被動'},
 {id:'midnight-pact',name:'午夜死契',traits:['night','shadow'],description:'毒傷觸發暗影連鎖傷害，換取高額持續輸出'},
 {id:'aegis-circuit',name:'不屈迴路',traits:['shield','arcane'],description:'護盾吸收傷害後產生奧術反擊'},
 {id:'coffee-automation',name:'咖啡自動化',traits:['office','arcane'],description:'治療會生成指揮能量，換取更密集的主角必殺'},
 {id:'phantom-factory',name:'幻影工廠',traits:['mecha','shadow'],description:'召喚物攻擊附帶暗影毒素，但放棄原始兩種羈絆被動'},
 {id:'celestial-engine',name:'天工神機',traits:['mecha','myth'],description:'工程召喚物獲得神話爆發，提高單體破防能力'}
]);
export const LAB_GEAR=Object.freeze([
 {id:'toxic-ledger',name:'慢性過勞帳本',description:'普通攻擊附加可疊層毒傷'},
 {id:'overtime-clock',name:'強制加班鐘',description:'每第三次攻擊觸發一次較弱的追擊'},
 {id:'guardian-invoice',name:'守護保險單',description:'護盾被消耗時追加一次反擊'},
 {id:'coffee-reactor',name:'咖啡反應爐',description:'治療時替隊友補上額外護盾'},
 {id:'machine-manual',name:'召喚機械手冊',description:'工程師的召喚技能額外產生機械傷害'}
]);
export const LAB_ENEMIES=Object.freeze([
 {id:'training-dummy',name:'試算表魔像',hp:1550,attack:25,cooldown:3,shieldPierce:0,cleanse:false,summonResist:0},
 {id:'shield-breaker',name:'保險拒付總監',hp:1600,attack:34,cooldown:3,shieldPierce:.85,cleanse:false,summonResist:0},
 {id:'poison-auditor',name:'消毒稽核主管',hp:1550,attack:28,cooldown:3,shieldPierce:0,cleanse:true,summonResist:0},
 {id:'anti-summon',name:'機甲拆解師',hp:1750,attack:30,cooldown:3,shieldPierce:.15,cleanse:false,summonResist:.75},
 {id:'endurance-boss',name:'星期一魔王',hp:2300,attack:41,cooldown:2,shieldPierce:.30,cleanse:false,summonResist:.10}
]);
const jobs=new Map(SQUAD_JOBS.map(j=>[j.id,j]));
const gearIds=new Set(LAB_GEAR.map(g=>g.id));
const traitIds=new Set(LAB_TRAITS.map(t=>t.id));
const fusionById=new Map(LAB_FUSIONS.map(f=>[f.id,f]));
const bounded=(n,min,max,fallback=min)=>Number.isFinite(Number(n))?Math.max(min,Math.min(max,Number(n))):fallback;
const whole=(n,min,max,fallback=min)=>Math.floor(bounded(n,min,max,fallback));
const owned=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
function configs(options={}){
 const input=options&&typeof options==='object'?options:{};
 const rawImprints=input.imprints&&typeof input.imprints==='object'?input.imprints:{};
 const rawGear=input.gear&&typeof input.gear==='object'?input.gear:{};
 return {rawImprints,rawGear,requestedFusion:typeof input.fusion==='string'?input.fusion:null};
}
export function analyzeLabBuild(rawSquad={},options={}){
 const squad=normalizeSquadDraft(rawSquad),units=squadStats(squad).filter(Boolean);
 const cfg=configs(options),ids=new Set(units.map(u=>u.id));
 const imprints={},gear={};
 const counts={};const effective={};
 let imprintTotal=0;
 for(const unit of units){
  const base=jobs.get(unit.job).tags.slice();
  const value=cfg.rawImprints[unit.id];
  if(imprintTotal<LAB_IMPRINT_CAP&&typeof value==='string'&&traitIds.has(value)&&!base.includes(value)){
   base.push(value);imprints[unit.id]=value;imprintTotal++;
  }
  if(typeof cfg.rawGear[unit.id]==='string'&&gearIds.has(cfg.rawGear[unit.id]))gear[unit.id]=cfg.rawGear[unit.id];
  effective[unit.id]=base;
  for(const tag of base)counts[tag]=(counts[tag]||0)+1;
 }
 const active=Object.entries(counts).filter(([,n])=>n>=2)
  .map(([tag,n])=>({tag,count:n,tier:n>=4?2:1}))
  .sort((a,b)=>a.tag.localeCompare(b.tag));
 const candidate=fusionById.get(cfg.requestedFusion);
 const fusion=candidate&&candidate.traits.every(tag=>(counts[tag]||0)>=2)?candidate:null;
 const blocked=Boolean(cfg.requestedFusion&&!fusion);
 const suppressed=fusion?fusion.traits:[];
 return {version:1,squad,units,effective,imprints,gear,counts,active,
  fusion:fusion?{...fusion}:null,blockedFusion:blocked?cfg.requestedFusion:null,
  suppressed,imprintTotal,unusedImprints:LAB_IMPRINT_CAP-imprintTotal};
}
const seedRng=(seed)=>{
 let s=whole(seed,0,4294967295,1)>>>0;
 if(s===0)s=1;
 return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
};
const record=(unit)=>({id:unit.id,name:unit.name,job:unit.job,hp:unit.maxHp,maxHp:unit.maxHp,
 shield:0,attack:unit.attack,speed:unit.speed,effect:unit.effect,value:unit.value,
 actions:0,attacks:0,damage:0,healing:0,shieldGiven:0,absorbed:0,followups:0,summons:0,
 crits:0,gearHits:0,gear:null,traits:[]});
export function simulateLabBattle(rawSquad={},options={}){
 const input=options&&typeof options==='object'?options:{};
 const build=analyzeLabBuild(rawSquad,input);
 const enemyDef=LAB_ENEMIES.find(e=>e.id===input.enemy)||LAB_ENEMIES[0];
 const rng=seedRng(input.seed??1);
 const ticks=whole(input.ticks,1,240,90);
 const allies=build.units.map(unit=>{
  const state=record(unit);state.gear=build.gear[unit.id]||null;state.traits=build.effective[unit.id]||[];
  return state;
 });
 const enemy={id:enemyDef.id,name:enemyDef.name,hp:enemyDef.hp,maxHp:enemyDef.hp,poison:0,poisonLeft:0,turns:0};
 const metrics={damage:0,healing:0,shieldGiven:0,shieldAbsorbed:0,poisonDamage:0,
  followups:0,summonDamage:0,reflectDamage:0,commanderCasts:0,
  events:0,preventedEvents:0,maxEventsPerTick:0};
 const events=[];let energy=0,teamAttacks=0,clockworkCharge=0,commanderBuff=0,enemyWeaken=0;
 const flags=Object.fromEntries(build.active.filter(t=>!build.suppressed.includes(t.tag)).map(t=>[t.tag,t.tier]));
 const fused=build.fusion?.id||null;
 let winner='timeout',tick=0;
 const log=(type,detail)=>{if(events.length<80)events.push({tick,type,...detail});};
 const applyDamage=(target,source,amount,kind='attack')=>{
  const hit=Math.max(1,Math.round(amount));
  target.hp=Math.max(0,target.hp-hit);metrics.damage+=hit;
  if(source){source.damage+=hit;if(kind==='summon')source.summons++;}
  if(kind==='summon')metrics.summonDamage+=hit;
  if(kind==='reflect')metrics.reflectDamage+=hit;
  return hit;
 };
 for(tick=1;tick<=ticks;tick++){
  if(enemy.hp<=0||!allies.some(a=>a.hp>0))break;
  const queue=[];let eventCount=0;
  const push=e=>queue.push(e);
  const healing=(unit,amount)=>{
   if(unit.hp<=0)return 0;
   const gain=Math.min(unit.maxHp-unit.hp,Math.max(0,Math.round(amount)));
   unit.hp+=gain;unit.healing+=gain;metrics.healing+=gain;
   return gain;
  };
  const shield=(unit,amount,by)=>{
   if(unit.hp<=0)return;
   const gain=Math.min(Math.max(0,Math.round(amount)),Math.max(0,Math.round(unit.maxHp*.55)-unit.shield));
   unit.shield+=gain;metrics.shieldGiven+=gain;
   if(by)by.shieldGiven+=gain;
  };
  const poison=(stacks,duration=4)=>{
   enemy.poison=Math.min(8,enemy.poison+stacks);
   enemy.poisonLeft=Math.max(enemy.poisonLeft,duration);
  };
  // Event processing is bounded. Derived attacks are terminal and cannot spawn
  // further derived attacks, even when a fusion and mutation share a trigger.
  const process=()=>{
   while(queue.length){
    if(eventCount>=28){
     metrics.preventedEvents+=queue.length;queue.length=0;break;
    }
    const e=queue.shift();eventCount++;metrics.events++;
    if(enemy.hp<=0)continue;
    const actor=e.actor;
    if(e.type==='strike'){
     let amount=e.amount;
     if(e.kind==='attack'&&commanderBuff>0)amount*=1.20;
     if(e.kind==='attack'&&actor.effect==='lowhp'&&actor.hp<actor.maxHp*.5)amount*=1+actor.value;
     if(e.kind==='attack'&&actor.effect==='execution'&&enemy.hp<enemy.maxHp*.35)amount*=1+actor.value;
     if(e.kind==='attack'&&actor.effect==='backstab')amount*=1+actor.value*.6;
     if(e.kind==='attack'&&flags.shadow&&rng()<.19*flags.shadow){amount*=1.5;actor.crits++;}
     if(e.kind==='summon')amount*=1-enemyDef.summonResist;
     applyDamage(enemy,actor,amount,e.kind);
     if(e.kind==='attack'){
      actor.attacks++;teamAttacks++;energy=Math.min(100,energy+(flags.office?5:3));
      if(actor.effect==='leech')healing(actor,amount*actor.value);
      if(actor.effect==='poison'||actor.gear==='toxic-ledger'){poison(1);if(actor.gear==='toxic-ledger')actor.gearHits++;}
      if(actor.effect==='double'&&rng()<actor.value)push({type:'strike',actor,amount:actor.attack*.57,kind:'followup'});
      if(actor.gear==='overtime-clock'&&actor.attacks%3===0){
       push({type:'strike',actor,amount:actor.attack*.55,kind:'followup'});actor.gearHits++;
      }
      if(flags.office&&teamAttacks%5===0)push({type:'strike',actor,amount:actor.attack*.35,kind:'followup'});
      if(fused==='perpetual-overtime'&&teamAttacks%3===0){
       clockworkCharge++;
       if(clockworkCharge>=1){
        clockworkCharge=0;const engineer=allies.find(a=>a.hp>0&&a.job==='engineer')||actor;
        push({type:'strike',actor:engineer,amount:engineer.attack*.9,kind:'summon'});
       }
      }
      if(actor.effect==='charge')energy=Math.min(100,energy+actor.value);
      if(actor.effect==='splash')push({type:'strike',actor,amount:actor.attack*actor.value,kind:'followup'});
      if(actor.effect==='summon'&&actor.actions%3===0){
       push({type:'strike',actor,amount:actor.attack*(1+actor.value),kind:'summon'});
      }
      if(actor.effect==='overdrive'&&actor.actions%3===0){
       push({type:'strike',actor,amount:actor.attack*(1+actor.value),kind:'summon'});
      }
      if(actor.gear==='machine-manual'&&actor.job==='engineer'&&actor.actions%3===0){
       push({type:'strike',actor,amount:actor.attack*.75,kind:'summon'});actor.gearHits++;
      }
     }else if(e.kind==='followup'){
      actor.followups++;metrics.followups++;
     }else if(e.kind==='summon'){
      if(fused==='phantom-factory')poison(1);
      if(fused==='celestial-engine')push({type:'terminal-burst',actor,amount:actor.attack*.46});
     }
    }else if(e.type==='terminal-burst'){applyDamage(enemy,actor,e.amount,'summon');}
    else if(e.type==='heal'){
     const missing=allies.filter(a=>a.hp>0).sort((a,b)=>(a.hp/a.maxHp-b.hp/b.maxHp))[0];
     if(!missing)continue;
     const raw=Math.max(1,Math.round(e.amount));
     const healed=healing(missing,raw);
     if(e.actor.gear==='coffee-reactor'){shield(missing,raw*.35,e.actor);e.actor.gearHits++;}
     if(fused==='coffee-automation')energy=Math.min(100,energy+Math.max(4,Math.round(healed*.4)));
     if(e.actor.effect==='hybrid'&&enemy.hp>0)push({type:'terminal-burst',actor:e.actor,amount:raw*.3});
    }else if(e.type==='barrier'){
     const target=allies.filter(a=>a.hp>0).sort((a,b)=>(a.shield-a.hp/10)-(b.shield-b.hp/10))[0];
     if(target)shield(target,e.amount,e.actor);
    }
   }
  };
  if(enemy.poison>0&&enemy.poisonLeft>0){
   let damage=Math.max(1,Math.round(enemy.poison*6*(flags.night?1.18:1)));
   enemy.hp=Math.max(0,enemy.hp-damage);
   metrics.damage+=damage;metrics.poisonDamage+=damage;
   if(fused==='midnight-pact'&&enemy.hp>0){
    const bonus=Math.round(damage*.65);enemy.hp=Math.max(0,enemy.hp-bonus);
    metrics.damage+=bonus;metrics.poisonDamage+=bonus;
   }
   enemy.poisonLeft--;
   if(enemy.poisonLeft===0)enemy.poison=0;
  }
  // Auto-commander: the real game will eventually reuse commanderAction. Here
  // all three paths already have different combat consequences.
  if(energy>=100){
   metrics.commanderCasts++;energy=0;
   const role=build.squad.commanderPath;
   if(role==='overtime')commanderBuff=4;
   if(role==='strategist'){enemyWeaken=4;log('commander',{role,impact:'enemy-weaken'});}
   if(role==='logistics')for(const u of allies){healing(u,u.maxHp*.16);shield(u,u.maxHp*.09);}
   log('commander',{role});
  }
  if(enemy.hp<=0)break;
  const ready=allies.filter(a=>a.hp>0).filter(a=>tick%Math.max(1,Math.ceil(22/a.speed))===0);
  ready.sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id));
  for(const actor of ready){
   if(enemy.hp<=0)break;
   actor.actions++;
   if(actor.effect==='heal'&&actor.actions%2===0){
    push({type:'heal',actor,amount:actor.attack*(1+actor.value)*1.9});process();continue;
   }
   if(actor.effect==='barrier'&&actor.actions%2===0){
    push({type:'barrier',actor,amount:actor.attack*(1+actor.value)*1.65});process();continue;
   }
   if(actor.effect==='hybrid'&&actor.actions%2===0){
    push({type:'heal',actor,amount:actor.attack*(1+actor.value)});process();continue;
   }
   if(actor.effect==='buff'&&actor.actions%3===0)energy=Math.min(100,energy+14);
   const dmg=actor.attack*(actor.effect==='slow'?1.07:1);
   push({type:'strike',actor,amount:dmg,kind:'attack'});
   process();
  }
  if(enemy.hp<=0)break;
  if(flags.mecha&&tick%4===0){
   const engineer=allies.find(a=>a.job==='engineer'&&a.hp>0);
   if(engineer){push({type:'strike',actor:engineer,amount:engineer.attack*.48,kind:'summon'});process();}
  }
  if(enemy.hp<=0)break;
  if(tick%enemyDef.cooldown===0){
   const alive=allies.filter(a=>a.hp>0);
   let sorted=alive.slice().sort((a,b)=>{
    const ag=a.job==='sentinel'?-50:0,bg=b.job==='sentinel'?-50:0;
    return (ag+a.hp/a.maxHp*10)-(bg+b.hp/b.maxHp*10);
   });
   if(alive.length&&rng()<.15)sorted=alive.slice().sort((a,b)=>a.hp-b.hp);
   const target=sorted[0];
   if(target){
    const blocked=Math.round(target.shield*(1-enemyDef.shieldPierce));
    const reduction=(target.effect==='guard'?target.value:0)+(flags.shield?.10:0);
    const attempted=Math.max(1,Math.round(enemyDef.attack*(enemyWeaken>0?.79:1)*(1-reduction)));
    const absorbed=Math.min(blocked,attempted);
    target.shield=Math.max(0,target.shield-absorbed);
    target.absorbed+=absorbed;metrics.shieldAbsorbed+=absorbed;
    let suffered=Math.max(0,attempted-absorbed);
    target.hp=Math.max(0,target.hp-suffered);enemy.turns++;
    if(absorbed>0&&enemy.hp>0){
     if(target.gear==='guardian-invoice'){
      push({type:'terminal-burst',actor:target,amount:absorbed*.25});target.gearHits++;
     }
     if(fused==='aegis-circuit')push({type:'terminal-burst',actor:target,amount:absorbed*.72});
     if(target.effect==='reflect')push({type:'terminal-burst',actor:target,amount:attempted*target.value});
     process();
    }
    log('enemy-hit',{target:target.id,damage:suffered,absorbed});
   }
  }
  if(enemyDef.cleanse&&tick%6===0){enemy.poison=0;enemy.poisonLeft=0;}
  if(commanderBuff>0)commanderBuff--;
  if(enemyWeaken>0)enemyWeaken--;
  metrics.maxEventsPerTick=Math.max(metrics.maxEventsPerTick,eventCount);
 }
 const live=allies.filter(a=>a.hp>0);
 if(enemy.hp<=0)winner='team';
 else if(!live.length)winner='enemy';
 const byUnit=allies.map(a=>({
  id:a.id,hp:a.hp,maxHp:a.maxHp,shield:a.shield,damage:a.damage,healing:a.healing,
  shieldGiven:a.shieldGiven,absorbed:a.absorbed,attacks:a.attacks,
  followups:a.followups,summons:a.summons,gearHits:a.gearHits,crits:a.crits
 }));
 return {
  result:winner,enemy:enemy.id,enemyHp:enemy.hp,ticks:Math.min(tick,ticks),seed:whole(input.seed??1,0,4294967295,1),
  commander:build.squad.commanderPath,fusion:build.fusion?.id||null,
  activeTraits:build.active.map(x=>({tag:x.tag,count:x.count,tier:x.tier})),
  imprints:{...build.imprints},gear:{...build.gear},alive:live.length,
  metrics,byUnit,events
 };
}
export function compareLabBuilds(builds=[],options={}){
 return builds.slice(0,12).map((build,i)=>{
  const result=simulateLabBattle(build.squad??{}, {...options,...build.options});
  return {index:i,title:String(build.title??'陣容 '+(i+1)).slice(0,80),...result};
 });
}
