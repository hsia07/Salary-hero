(()=>{
'use strict';
if(!document.querySelector('#bossRig')||window.__salaryBossV2)return;window.__salaryBossV2=true;
clearInterval(combatTicker);if(frameTicker)clearInterval(frameTicker);if(stateTimer)clearTimeout(stateTimer);
const $=id=>document.getElementById(id),root=$('game'),rig=$('bossRig'),frame=$('bossFrame'),zone=$('bossZone'),team=[...document.querySelectorAll('.team-zone .unit')];
const bar=document.createElement('div');bar.id='bossEnergyHud';bar.innerHTML='<div class="energy-words"><span>魔力／怒氣</span><span id="energyText">0 / 100</span></div><div class="energy-track"><div id="energyFill"></div></div>';document.querySelector('.hud').append(bar);
const plane=document.createElement('div');plane.id='v2Plane';root.append(plane);const warning=document.createElement('div');warning.id='v2Warning';root.append(warning);
const status=document.createElement('div');status.id='v2Status';status.textContent='全程自動交戰｜Boss 怒氣大招';root.append(status);
document.querySelector('.footer .hint').textContent='V6.0 四波副本｜護衛分攤／法師範圍／刺客背刺／醫官解控｜Lv.85 測試值';
// V5.8: actual seven visible units — 3 backline + 4 frontline, no duplicate center column.
const positions=[[12.5,75],[37.5,75],[87.5,75],[17.5,26],[50,26],[82.5,26],[62.5,75]];
const allies=Array(7).fill(100);
team.forEach((u,i)=>{
  u.style.left=positions[i][0]+'%';
  u.style.top=positions[i][1]+'%';
  u.style.width=(i<3||i===6?'22%':'28%');
  u.dataset.squadSlot=String(i+1);
  u.dataset.squadRow=(i<3||i===6?'front':'rear');
  u.querySelector('.hp').innerHTML='<i class="v2Health"></i>';
});
const clock={energy:0,hp:100,maxHp:165,wave:1,rage:false,turn:0,allyTurn:0,pace:1,paused:false,done:false,busy:false,inUltimate:false};

/* V4 status ailments use the battle clock, so pause and ×2/×3 speeds work. */
const v4Effects=[
  {id:'stun',name:'過勞',detail:'昏迷，不能行動',short:'💤 過勞'},
  {id:'slow',name:'週一開機失敗',detail:'行動頻率減半',short:'🐌 週一病'},
  {id:'paycut',name:'薪水延遲入帳',detail:'回復效果減半',short:'💸 薪延'}
];
const v4Status=Array.from({length:7},()=>new Map());
let v4Time=0,v4Wall=performance.now(),v4BeamCount=0,v4UltHits=[];
const v4Ribbon=document.createElement('div');v4Ribbon.id='v4StatusRibbon';v4Ribbon.textContent='Lv.85 測試隊伍・Boss Lv.85｜週一的痛苦即將來臨';root.append(v4Ribbon);
team.forEach((u,i)=>{const badge=document.createElement('span');badge.className='v4StatusBadge';badge.hidden=true;badge.setAttribute('data-slot',i);u.append(badge)});
function v4Has(i,id){return(v4Status[i].get(id)||0)>v4Time}
function v4UpdateBadges(){
 team.forEach((u,i)=>{
   const badge=u.querySelector('.v4StatusBadge');
   const ongoing=v4Effects.filter(e=>v4Has(i,e.id));
   if(!ongoing.length){badge.hidden=true;badge.textContent='';}
   else{
     const e=ongoing[0];const secs=Math.ceil((v4Status[i].get(e.id)-v4Time)/100)/10;
     badge.hidden=false;badge.textContent=e.short+' '+secs.toFixed(1)+'s';badge.title=ongoing.map(e=>e.name+'：'+e.detail).join('、');
   }
   u.classList.toggle('v4Stunned',v4Has(i,'stun'));
   let stunArt=u.querySelector('.v5StunArt');
   if(v4Has(i,'stun')&&allies[i]>0){
     if(!stunArt){stunArt=document.createElement('div');stunArt.className='v5StunArt';u.append(stunArt)}
   }else if(stunArt)stunArt.remove();
   for(const [id,cls] of [['slow','v5SlowArt'],['paycut','v5PaycutArt']]){
     let art=u.querySelector('.'+cls);
     if(v4Has(i,id)&&allies[i]>0){
       if(!art){art=document.createElement('div');art.className=cls;u.append(art)}
     }else if(art)art.remove();
   }
   u.classList.toggle('v4Slowed',v4Has(i,'slow'));
 });
}
function v4AddStatus(i,id,ms){
 if(allies[i]<=0)return;
 const e=v4Effects.find(e=>e.id===id);
 if(!e)return;
 v4Status[i].set(id,Math.max(v4Status[i].get(id)||0,v4Time+ms));
 v4Ribbon.textContent=e.name+'：'+e.detail+'（隊員 '+(i+1)+'）';
 v4UpdateBadges();
}
function v4ClearStatuses(){for(const a of v4Status)a.clear();v4Time=0;v4Wall=performance.now();v4UltHits=[];v4BeamCount=0;v4UpdateBadges()}
setInterval(()=>{
 const now=performance.now(),elapsed=Math.min(180,Math.max(0,now-v4Wall));v4Wall=now;
 if(!clock.paused&&!clock.done)v4Time+=elapsed*clock.pace;
 v4UpdateBadges();
 v59UpdateShields();
},100);
window.__salaryBossV4={get phase(){return v3Fx.className},get beamCount(){return v4BeamCount},get ultimaHits(){return [...v4UltHits]},get health(){return [...allies]},get statuses(){return v4Status.map((m,i)=>[...m].filter(([k])=>v4Has(i,k)).map(([k])=>k))},get wave(){return clock.wave},trigger:()=>{if(clock.busy||clock.done)return false;setEnergy(100);bossStep();return true;}};
let bossTimer,allyTimer;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms/clock.pace));
function center(el){let a=el.getBoundingClientRect(),g=root.getBoundingClientRect();return{x:a.left+a.width/2-g.left,y:a.top+a.height*.6-g.top}}
function pointBoss(){let a=zone.getBoundingClientRect(),g=root.getBoundingClientRect();return{x:a.left+a.width*.55-g.left,y:a.top+a.height*.68-g.top}}
function piece(tag,cls,x,y,url){const e=document.createElement(tag);e.className=cls;e.style.left=x+'px';e.style.top=y+'px';if(url)e.src=url;plane.append(e);setTimeout(()=>e.remove(),1100/clock.pace);return e}
function setEnergy(v){clock.energy=Math.max(0,Math.min(100,v));$('energyFill').style.width=clock.energy+'%';$('energyText').textContent=Math.round(clock.energy)+' / 100'}
function setHp(v){clock.hp=Math.max(0,v);const pct=100*clock.hp/(clock.maxHp||100);hpFill.style.width=pct+'%';hpText.textContent=Math.round(pct)+'%';if(!clock.rage&&clock.wave===4&&pct<=60){clock.rage=true;root.classList.add('v2Rage');warning.textContent='狂暴化｜加班永無止境';warning.classList.add('active');setTimeout(()=>warning.classList.remove('active'),850);setEnergy(clock.energy+20)}}
function label(t,on=false){warning.textContent=t;warning.classList.toggle('active',on);status.textContent=t}
function ring(i,ult){const p=center(team[i]);let e=piece('div','v2Ring'+(ult?' ult':''),p.x,p.y);setTimeout(()=>e.remove(),1100/clock.pace)}

/* V5.9 party skill controller: healer, engineer, and wave-win rescue.
   HP is currently normalized to 100 per character in this V5 sandbox.
   All formulas use target's own maxHP to support future RPG stat scale. */
let v59AI=null;
const v59MaxHp=Array(7).fill(100);
const v59Shields=Array.from({length:7},()=>({hp:0,expires:0,source:''}));
const v59Cooldown={heal:-Infinity,shield:-Infinity};
const v59Events=[],v59TargetEvents=[];
const v59Art='./art/s1/support-vfx/';
function v59Log(e){v59Events.push({...e,at:v4Time,wave:clock.wave});if(v59Events.length>100)v59Events.shift()}
team.forEach((u,i)=>{
 const meter=document.createElement('i');meter.className='v59ShieldMeter';
 u.querySelector('.hp').append(meter);
 u.dataset.role=['guardian','fighter','assassin','healer','mage','protector','commander'][i];
});
function v59AddLayer(unit,className,parts,duration){
 const wrap=document.createElement('div');wrap.className='v59Spell '+className;
 for(const part of parts){
  const img=document.createElement('img');img.alt='';img.className='v59SpellPart '+part.cls;
  img.src=v59Art+part.src;wrap.append(img);
 }
 unit.append(wrap);
 if(duration)setTimeout(()=>wrap.remove(),Math.max(500,duration)/Math.max(.2,clock.pace));
 return wrap;
}
function v59ShieldVisual(i){
 const u=team[i],data=v59Shields[i];
 const active=data.hp>0&&data.expires>v4Time&&allies[i]>0;
 const prev=u.querySelector('.v59ShieldPermanent');
 if(active&&!prev){
  v59AddLayer(u,'v59ShieldPermanent',[{src:'shield-glass.svg',cls:'v59Glass'},{src:'shield-runes.svg',cls:'v59Runes'}],0);
 }else if(!active&&prev){prev.remove()}
 const meter=u.querySelector('.v59ShieldMeter');
 if(meter)meter.style.width=active?Math.min(100,data.hp/v59MaxHp[i]*100)+'%':'0%';
}
function v59UpdateShields(){
 for(let i=0;i<7;i++){
  const d=v59Shields[i];
  if(d.hp>0&&(d.expires<=v4Time||allies[i]<=0)){d.hp=0;d.source='';}
  v59ShieldVisual(i);
 }
}
function v59ApplyShield(i,ratio,source,duration){
 if(allies[i]<=0)return 0;
 const before=v59Shields[i].hp;
 const add=v59AI.shieldForTarget(v59MaxHp[i],ratio);
 v59Shields[i].hp=v59AI.capShield(before,add,v59MaxHp[i]);
 v59Shields[i].expires=Math.max(v59Shields[i].expires,v4Time+duration);
 v59Shields[i].source=source;
 v59ShieldVisual(i);
 const gained=+(v59Shields[i].hp-before).toFixed(2);
 if(gained>0)v59Log({type:'shield',source,target:i,value:gained});
 return gained;
}
function v59Healing(i,ratio=.095){
 if(allies[i]<=0)return 0;
 const max=v59MaxHp[i],value=v59AI.healForTarget(max,ratio)*(v4Has(i,'paycut')?.5:1);
 const granted=Math.min(max-allies[i],value);
 if(granted<=0)return 0;
 allies[i]=Math.min(max,allies[i]+value);
 team[i].querySelector('.v2Health').style.width=(allies[i]/max*100)+'%';
 v59AddLayer(team[i],'v59Healing',[{src:'heal-cup.svg',cls:'v59Cup'},{src:'heal-petals.svg',cls:'v59Petals'}],920);
 const p=center(team[i]),n=piece('span','v2Dmg hero',p.x,p.y-24);
 n.textContent='+'+granted.toFixed(1)+' HP';
 v59Log({type:'heal',source:'咖啡醫官',target:i,value:+granted.toFixed(2)});
 return granted;
}
function v59TrySupport(i){
 if(!v59AI||allies[i]<=0||clock.paused||clock.done||v4Has(i,'stun'))return false;
 if(i===3&&v4Time-v59Cooldown.heal>=v59AI.SUPPORT_RULES.healer.cooldownMs){
  const shields=v59Shields.map(s=>s.hp);
  const target=v59AI.pickCriticalAlly(allies,v59MaxHp,shields);
  if(target>=0&&allies[target]/v59MaxHp[target]<=v59AI.SUPPORT_RULES.healer.triggerBelow){
   v59Cooldown.heal=v4Time;
   v59AddLayer(team[i],'v59CastingHeal',[{src:'heal-petals.svg',cls:'v59Petals'}],580);
   v59Healing(target);
   return true;
  }
 }
 if(i===5&&v4Time-v59Cooldown.shield>=v59AI.SUPPORT_RULES.protector.cooldownMs){
  const endangered=allies.filter((hp,j)=>hp>0&&hp/v59MaxHp[j]<v59AI.SUPPORT_RULES.protector.triggerLowHp).length;
  const urgent=clock.wave===4&&clock.energy>=65;
  if(endangered>=2||urgent){
   v59Cooldown.shield=v4Time;
   v59AddLayer(team[i],'v59CastingShield',[{src:'shield-runes.svg',cls:'v59Runes'}],820);
   const amount=[];
   for(let j=0;j<7;j++)if(allies[j]>0)amount.push(v59ApplyShield(j,v59AI.SUPPORT_RULES.protector.shieldPercentOfTargetMaxHp,'機械工程師・全隊護盾',v59AI.SUPPORT_RULES.protector.durationMs));
   v59Log({type:'team-shield-cast',source:'機械工程師',targets:amount.length});
   return true;
  }
 }
 return false;
}
function v59WaveRescue(){
 if(!v59AI)return;
 const target=v59AI.pickCriticalAlly(allies,v59MaxHp); // Victory: lowest HP percentage, regardless of existing shields.
 if(target<0)return;
 const gained=v59ApplyShield(target,v59AI.SUPPORT_RULES.waveRescue.shieldPercentOfTargetMaxHp,'薪奴・勝利護盾',v59AI.SUPPORT_RULES.waveRescue.durationMs);
 if(gained>0){v59Log({type:'wave-rescue',target,value:gained});v59AddLayer(team[target],'v59RescueGlow',[{src:'shield-impact.svg',cls:'v59Burst'}],800)}
}
function v59Reset(){
 for(const d of v59Shields){d.hp=0;d.expires=0;d.source=''}
 v59Cooldown.heal=-Infinity;v59Cooldown.shield=-Infinity;
 v59Events.length=0;v59TargetEvents.length=0;
 team.forEach(u=>u.querySelectorAll('.v59Spell').forEach(e=>e.remove()));
 v59UpdateShields();
}


/* V6.0 — gameplay-grade role skills with separate illustrated SVG layers.
   The current sandbox keeps 100HP reference values, not final RPG scaling. */
let v60AI=null;
const v60Cooldown={guard:-Infinity,mage:-Infinity,assassin:-Infinity,cleanse:-Infinity};
const v60Guard={target:-1,expires:0,guardIndex:0};
const v60Busy=new Set(),v60Events=[];
const v60Art='./art/s1/active-vfx/';
function v60Record(event){v60Events.push({...event,at:v4Time,wave:clock.wave});if(v60Events.length>120)v60Events.shift();}
function v60Fx(element,kind,parts,duration){
 if(!element)return null;
 const wrap=document.createElement('div');wrap.className='v60Vfx v60'+kind;wrap.setAttribute('aria-hidden','true');
 parts.forEach((part,i)=>{
  const img=document.createElement('img');img.className='v60Layer v60Part'+i;
  img.alt='';img.src=v60Art+part;wrap.append(img);
 });
 element.append(wrap);
 if(duration>0)setTimeout(()=>wrap.remove(),Math.max(230,duration)/Math.max(.2,clock.pace));
 return wrap;
}
function v60Reset(full=true){
 v60Guard.target=-1;v60Guard.expires=0;v60Busy.clear();
 team.forEach(u=>u.querySelectorAll('.v60Vfx').forEach(n=>n.remove()));
 v5Field.querySelectorAll('.v60Vfx').forEach(n=>n.remove());
 if(full){
  for(const k of Object.keys(v60Cooldown))v60Cooldown[k]=-Infinity;
  v60Events.length=0;
 }
}
function v60UseGuard(){
 if(clock.done||allies[0]<=35||v4Has(0,'stun')||v4Time-v60Cooldown.guard<v60AI.ACTIVE_SKILLS.guard.cooldownMs)return false;
 const candidate=v60AI.chooseGuardTarget(allies,v59Shields.map(x=>x.hp),0);
 const cfg=v60AI.ACTIVE_SKILLS.guard;
 if(candidate<0||allies[candidate]>=cfg.triggerBelow*100&&clock.energy<75)return false;
 v60Cooldown.guard=v4Time;
 v60Guard.target=candidate;v60Guard.expires=v4Time+cfg.durationMs;
 v60Fx(team[0],'GuardCast',['guard-watch-shield.svg','guard-escort-wings.svg'],650);
 v60Fx(team[candidate],'GuardLink',['guard-watch-shield.svg','guard-escort-wings.svg'],cfg.durationMs);
 v60Record({type:'guard-cast',caster:0,target:candidate,ratio:cfg.redirectRatio,duration:cfg.durationMs});
 label('打卡守衛｜打卡護衛！');
 return true;
}
function v60UseCleanse(){
 if(allies[3]<=0||v4Has(3,'stun')||v4Time-v60Cooldown.cleanse<v60AI.ACTIVE_SKILLS.cleanse.cooldownMs)return false;
 const statuses=v4Status.map((m,i)=>[...m.keys()].filter(k=>v4Has(i,k)));
 const target=v60AI.chooseCleanseTarget(statuses,allies);
 if(target<0)return false;
 const debuff=v60AI.DEBUFF_PRIORITY.find(id=>v4Has(target,id));
 if(!debuff)return false;
 v60Cooldown.cleanse=v4Time;
 v4Status[target].delete(debuff);v4UpdateBadges();
 v60Fx(team[3],'CleanseCast',['cleanse-steam-cup.svg','cleanse-starlight.svg'],820);
 v60Fx(team[target],'CleanseTarget',['cleanse-steam-cup.svg','cleanse-starlight.svg'],1000);
 v60Record({type:'cleanse',caster:3,target,removed:debuff});
 label('咖啡醫官｜下班醒腦咖啡・解除 '+debuff);
 return true;
}
function v60UseMage(){
 if(clock.wave>=4||!encounter||encounter.clearing||v60Busy.has(4)||v55Actions.has(4)||allies[4]<=0)return false;
 const cfg=v60AI.ACTIVE_SKILLS.mage;
 if(v4Time-v60Cooldown.mage<cfg.cooldownMs)return false;
 const alive=encounter.enemies.filter(e=>e.alive);
 if(alive.length<2)return false;
 const positions=alive.map(e=>{const p=center(e.node),rect=root.getBoundingClientRect();return {id:e.id,x:(p.x-rect.left)/rect.width*100,y:(p.y-rect.top)/rect.height*100,hp:e.hp,maxHp:e.maxHp,alive:e.alive,species:e.species};});
 const first=positions.reduce((best,e)=>{const score=positions.filter(x=>x.id!==e.id&&Math.hypot(x.x-e.x,x.y-e.y)<33).length;return score>best.score?{e,score}:best;},{e:positions[0],score:-1}).e;
 const victims=v60AI.chooseAoETargets(first,positions,cfg.maxTargets).map(p=>alive.find(e=>e.id===p.id)).filter(Boolean);
 if(victims.length<2)return false;
 const epoch=v5Epoch;
 v60Cooldown.mage=v4Time;v60Busy.add(4);
 v60Record({type:'mage-cast',caster:4,targets:victims.map(e=>e.id)});
 label('試算表法師｜矩陣散射！');
 v60Fx(team[4],'MageCast',['mage-ledger-array.svg','mage-ledger-blast.svg'],720);
 victims.forEach(e=>v60Fx(e.node,'MageTarget',['mage-ledger-array.svg','mage-ledger-blast.svg'],930));
 (async()=>{
  try{
   if(!await v5Sleep(cfg.castMs,epoch))return;
   if(clock.done||epoch!==v5Epoch||encounter?.clearing)return;
   for(let j=0;j<victims.length;j++){
    const target=victims[j];
    if(target.alive){
     const damage=+(v60AI.scaledDamage(21,v59AI.ALLY_ROLES[4].attack)*(j===0?cfg.primaryMultiplier:cfg.splashMultiplier)).toFixed(1);
     const p=center(target.node),t=piece('span','v2Dmg hero',p.x,p.y-18);
     t.textContent='-'+Math.round(damage*470).toLocaleString();
     v5Health(target,damage);
     v60Record({type:'mage-hit',caster:4,target:target.id,damage});
    }
    if(j<victims.length-1&&!await v5Sleep(70,epoch))return;
    if(clock.done||epoch!==v5Epoch||encounter?.clearing)return;
   }
  }finally{v60Busy.delete(4)}
 })();
 return true;
}
function v60UseAssassin(){
 if(clock.wave>=4||!encounter||encounter.clearing||v60Busy.has(2)||v55Actions.has(2)||allies[2]<=0)return false;
 const cfg=v60AI.ACTIVE_SKILLS.assassin;
 if(v4Time-v60Cooldown.assassin<cfg.cooldownMs)return false;
 const target=v60AI.chooseBacklineTarget(encounter.enemies.filter(e=>e.alive));
 if(!target)return false;
 v60Cooldown.assassin=v4Time;
 const damage=+(v60AI.scaledDamage(24,v59AI.ALLY_ROLES[2].attack)*cfg.damageMultiplier).toFixed(1);
 v60Fx(team[2],'AssassinCast',['assassin-audit-daggers.svg','assassin-shadow-ribbon.svg'],750);
 v60Fx(target.node,'AssassinTarget',['assassin-audit-daggers.svg','assassin-shadow-ribbon.svg'],850);
 label('截止日刺客｜背刺稽核！');
 v60Record({type:'assassin-cast',caster:2,target:target.id,damage});
 // The existing collision-synced lunge handles the actual hit/damage on impact.
 v55BeginHeroAttack(2,target,damage);
 return true;
}
function v60TrySkill(i){
 if(!v60AI||clock.done||clock.paused||allies[i]<=0||v4Has(i,'stun'))return false;
 if(i===0)return v60UseGuard();
 if(i===2)return v60UseAssassin();
 if(i===3)return v60UseCleanse();
 if(i===4)return v60UseMage();
 return false;
}
function v60Intercept(i,baseDamage){
 if(!v60AI||i===v60Guard.guardIndex||i!==v60Guard.target||v60Guard.expires<=v4Time||allies[0]<=0)return baseDamage;
 const split=v60AI.splitIntercept(baseDamage,v60AI.ACTIVE_SKILLS.guard.redirectRatio);
 v60Fx(team[0],'GuardImpact',['guard-watch-shield.svg','guard-escort-wings.svg'],520);
 v60Record({type:'guard-intercept',target:i,guard:0,redirected:split.guard});
 // Guard takes own share against own DEF/shield. Prevent recursive protection.
 flash(0,split.guard,false,true);
 return split.target;
}

function flash(i,amt,heavy=false,protectedPortion=false){
 if(allies[i]<=0)return;
 if(!protectedPortion)amt=v60Intercept(i,amt);
 amt=clock.wave===4?Math.round(amt*1.4*10)/10:amt;
 if(v60AI)amt=Math.round(amt*v60AI.damageDefenseModifier(v59AI.ALLY_ROLES[i].defense)*100)/100;
 let unit=team[i],p=center(unit);
 const shield=v59Shields[i];
 const active=shield.hp>0&&shield.expires>v4Time;
 let absorbed=0;
 if(active){
   const result=v59AI.absorbHit(allies[i],shield.hp,amt);
   absorbed=result.absorbed;shield.hp=result.shield;
   allies[i]=result.health;
   if(absorbed>0){
     const img=v59AddLayer(unit,'v59ShieldImpact',[{src:'shield-impact.svg',cls:'v59Burst'}],550);
     if(shield.hp<=0)v59Log({type:'shield-break',target:i,absorbed});
     v59Log({type:'absorb',target:i,value:absorbed});
   }
 }else allies[i]=Math.max(0,allies[i]-amt);
 const actual=Math.max(0,amt-absorbed);
 if(actual>0)piece('img','v2Slash',p.x,p.y-10,ART.parts.slash_fx);
 const n=piece('span','v2Dmg',p.x,p.y-20);
 n.textContent=(absorbed>0?'盾 '+absorbed.toFixed(1)+' / ':'')+'-'+(actual*630).toLocaleString();
 unit.querySelector('.v2Health').style.width=allies[i]/v59MaxHp[i]*100+'%';
 v59ShieldVisual(i);
 if(actual>0){
  unit.classList.remove('v2Hit');void unit.offsetWidth;unit.classList.add('v2Hit');
  setTimeout(()=>unit.classList.remove('v2Hit'),580/clock.pace);
 }
 if(!allies[i])unit.classList.add('v2Down');
}
function shake(big=false){root.classList.remove('v2Shake','v2UltShake');void root.offsetWidth;root.classList.add(big?'v2UltShake':'v2Shake');setTimeout(()=>root.classList.remove('v2Shake','v2UltShake'),big?700:360)}
function effectTravel(i){let from=pointBoss(),to=center(team[i]);let dx=to.x-from.x,dy=to.y-from.y;let path=piece('div','v2Trail',from.x,from.y);path.style.width=Math.hypot(dx,dy)+'px';path.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';let p=piece('img','v2Paper',from.x,from.y,ART.parts.paper_stack);p.animate([{transform:'translate(-50%,-50%) scale(.12) rotate(-15deg)'},{transform:'translate('+(dx-40)+'px,'+(dy-40)+'px) scale(.38) rotate(290deg)'}],{duration:540/clock.pace,easing:'ease-in',fill:'forwards'})}
function available(list){return list.filter(i=>allies[i]>0)}
async function normal(){let variant=clock.turn%5;let frontline=available([0,1,2]);let choices=frontline.length?frontline:available([0,1,2,3,4,5,6]);let target=variant===2?choices.slice():choices.length?[choices[(clock.turn-1)%choices.length]]:[];if(!target.length)return;label(variant===2?'橫掃公文爪':variant===4?'牛角突頂':'巨爪拍擊');target.forEach(i=>ring(i,false));sequence('attack',110);await pause(310);if(clock.paused||clock.done)return;target.forEach(effectTravel);await pause(560);if(clock.paused||clock.done)return;target.forEach(i=>{flash(i,variant===4?7:variant===2?4.5:6.5);if(variant===4)v4AddStatus(i,'stun',1000);});shake(variant===4);setEnergy(clock.energy+26+(clock.rage?9:0))}
async function bombard(){label('文件轟炸｜全員警戒');const target=available([0,1,2,3,4,5,6]);target.forEach(i=>{ring(i,false);effectTravel(i)});sequence('attack',100);await pause(700);if(clock.paused||clock.done)return;target.forEach((i,k)=>setTimeout(()=>{flash(i,2.5);if(i%3===1)v4AddStatus(i,'slow',2600)},k*58/clock.pace));shake();setEnergy(clock.energy+21+(clock.rage?9:0))}

// V3 cinematic: a separate authored cannon asset and a deterministic canvas effect layer.
// Canvas draws energy only; the Boss and seven allies remain independent sprites.
const v3Fx=document.createElement('div');v3Fx.id='v3Stage';
v3Fx.innerHTML='<div id="v3Tint"></div><canvas id="v3Canvas"></canvas><div id="v3Reticles"></div><div id="v3Cannon"><img src="./art/skills/hell-monday/overtime-cannon.svg" alt="文書牛魔召喚的獨立魔砲"><div class="v3Sigil"></div><div class="v3Muzzle"></div></div><div id="v3Caption"><b>OVERWORK ANNIHILATION</b>無限加班殲滅砲</div><div id="v3Countdown"></div><div id="v3Scorch"></div><div id="v3SkillNote">加班灼燒 · 持續傷害</div><div id="v3Flash"></div>';
root.append(v3Fx);
const v3Canvas=v3Fx.querySelector('#v3Canvas'),v3ctx=v3Canvas.getContext('2d',{alpha:true});
const v3Reticles=v3Fx.querySelector('#v3Reticles'),v3Countdown=v3Fx.querySelector('#v3Countdown'),v3Flash=v3Fx.querySelector('#v3Flash');
let v3Token=0,v3SizeW=0,v3SizeH=0;
function v3Resize(){
  const w=root.clientWidth,h=root.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
  if(v3SizeW===w&&v3SizeH===h&&v3Canvas.width===Math.round(w*dpr))return;
  v3SizeW=w;v3SizeH=h;v3Canvas.width=Math.round(w*dpr);v3Canvas.height=Math.round(h*dpr);
  v3ctx.setTransform(dpr,0,0,dpr,0,0);
}
function v3StageName(name){v3Fx.className=name;v3Resize()}
function v3Targets(indices){
  v3Reticles.replaceChildren();
  indices.forEach((i)=>{
    const p=center(team[i]),el=document.createElement('div');el.className='v3Reticle';el.style.left=p.x+'px';el.style.top=p.y+'px';v3Reticles.append(el);
  });
}
function v3Trace(x1,y1,x2,y2,t,n){
  const ctx=v3ctx,steps=11;ctx.beginPath();ctx.moveTo(x1,y1);
  for(let i=1;i<steps;i++){
    const q=i/steps;
    const wobble=Math.sin(t*.014+i*1.83+n*2.76)*10*(.4+q);
    ctx.lineTo(x1+(x2-x1)*q+wobble,y1+(y2-y1)*q+Math.cos(t*.021+i*1.9+n)*wobble*.42);
  }
  ctx.lineTo(x2,y2);ctx.stroke();
}
function v3Paint(phase,elapsed,duration,targets){
  v3Resize();const ctx=v3ctx,W=v3SizeW,H=v3SizeH;
  ctx.clearRect(0,0,W,H);
  if(!W||!H)return;
  const elapsedS=elapsed/1000,p=Math.min(1,elapsed/duration);
  const sx=W*.5,sy=H*.405;
  const living=targets.map(i=>center(team[i]));
  const endX=living.length?living.reduce((a,b)=>a+b.x,0)/living.length:W*.5;
  const endY=living.length?living.reduce((a,b)=>a+b.y,0)/living.length:H*.71;
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(phase==='warning'||phase==='charge'){
    const r=(phase==='charge'?48+elapsed*.13:50)+Math.sin(elapsedS*14)*5;
    for(let k=0;k<3;k++){
      ctx.beginPath();ctx.arc(sx,sy,r+k*21,0,Math.PI*2);
      ctx.strokeStyle=k===0?'#ffda9c':k===1?'#e3438b':'#9741bc';
      ctx.globalAlpha=(phase==='charge'?.36:.12)+(k===0?.25:0);
      ctx.lineWidth=k===0?3:2;ctx.shadowColor='#fa417e';ctx.shadowBlur=14;ctx.stroke();
    }
    for(let i=0;i<38;i++){
      let a=(i*2.39996323+elapsedS*(phase==='charge'?2.3:.3)),r0=21+(i%9)*8+(phase==='charge'?elapsed*.04:0);
      const x=sx+Math.cos(a)*r0,y=sy+Math.sin(a)*r0*.8;
      ctx.globalAlpha=.3+.5*Math.abs(Math.sin(elapsedS*3+i));
      ctx.fillStyle=i%4===0?'#fff5c5':i%3?'#ff507a':'#aa72ff';
      ctx.fillRect(x,y,i%4===0?4:2,i%4===0?6:4);
    }
  }
  if(phase==='fire'){
    // Seven actual independent rays. Each muzzle vent tracks one living actor's coordinates.
    // Unlike V3, no single oversized beam hides whether a party member was hit.
    const reach=Math.min(1,elapsed/390);
    const intensity=Math.max(.08,1-Math.max(0,p-.86)*4);
    v4BeamCount=living.length;
    const tint=['#fff4c1','#ffd2b3','#f7b0fd','#ffdfa6','#fff6cf','#ffc1d1','#fbc3ff'];
    living.forEach((q,i)=>{
      const fan=(i-(living.length-1)/2);
      const x0=sx+fan*(W*.023),y0=sy+Math.abs(fan)*1.3;
      const x1=x0+(q.x-x0)*reach,y1=y0+(q.y-y0)*reach;
      const cx=sx+(q.x-sx)*.52+fan*W*.051;
      const cy=sy+(q.y-sy)*.50-19-Math.abs(fan)*1.9;
      const jitter=Math.sin(elapsed*.024+i*2.12)*2.2;
      const path=()=>{ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(cx+jitter,cy,x1,y1)};
      ctx.lineCap='round';
      ctx.globalAlpha=.38*intensity;ctx.shadowBlur=26;ctx.shadowColor='#f02773';
      ctx.lineWidth=23;ctx.strokeStyle='#fa336e';path();ctx.stroke();
      ctx.globalAlpha=.78*intensity;ctx.shadowBlur=12;ctx.shadowColor='#ff91b0';
      ctx.lineWidth=10;ctx.strokeStyle=i%2?'#ff7095':'#ff9e90';path();ctx.stroke();
      ctx.globalAlpha=.95*intensity;ctx.shadowBlur=8;ctx.shadowColor='#fff3d0';
      ctx.lineWidth=4.5;ctx.strokeStyle=tint[i%tint.length];path();ctx.stroke();
      ctx.globalAlpha=.9*intensity;ctx.shadowBlur=0;ctx.lineWidth=1.5;
      ctx.strokeStyle='#fffdf1';path();ctx.stroke();
      if(reach>.85){
        const r=12+(elapsed*.075+i*11)%36;
        ctx.globalAlpha=.9*intensity;ctx.lineWidth=3;
        ctx.strokeStyle=i%2?'#fef0b7':'#ff9dbc';
        ctx.beginPath();ctx.ellipse(q.x,q.y,r*1.35,r*.38,0,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=.8*intensity;
        for(let k=0;k<5;k++){
          const angle=k*1.2566+elapsed*.003+i*.6;
          const x=q.x+Math.cos(angle)*(13+r*.42),y=q.y+Math.sin(angle)*(10+r*.22);
          ctx.fillStyle=(k+i)%2?'#fff8d6':'#ff7699';
          ctx.fillRect(x,y,3,5);
        }
      }
    });
    // A separate seven-port energy splitter is readable even before the rays reach the targets.
    ctx.globalAlpha=.7*intensity;ctx.lineWidth=2;ctx.strokeStyle='#ffe8c9';
    living.forEach((_,i)=>{
      const theta=(i-living.length/2)*.41+elapsed*.002;
      const r=22+3*Math.sin(elapsed*.03+i);
      ctx.beginPath();ctx.arc(sx+Math.cos(theta)*r,sy+Math.sin(theta)*r,7,0,Math.PI*2);ctx.stroke();
    });
  }
  if(phase==='aftermath'){
    ctx.globalAlpha=(1-p)*.72;
    for(let i=0;i<45;i++){
      const a=i*2.39996323,t=(elapsedS*(24+i%5*6)+i*29)%180;
      const x=endX+Math.cos(a)*(12+t),y=endY+Math.sin(a)*(8+t*.26)-t*.20;
      ctx.fillStyle=i%3===0?'#ffcc94':i%2===0?'#ff6788':'#bc4c94';
      ctx.save();ctx.translate(x,y);ctx.rotate(a+p*5);ctx.fillRect(-2,-4,4,8);ctx.restore();
    }
    ctx.globalAlpha=(1-p)*.75;ctx.strokeStyle='#ff5f83';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(endX,endY,42+p*145,17+p*45,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function v3Play(phase,duration,targets,onFrame){
  const token=v3Token;
  v3StageName(phase);
  let total=0,previous=0;
  return new Promise(resolve=>{
    function raf(now){
      if(token!==v3Token||clock.done){v3ctx.clearRect(0,0,v3SizeW,v3SizeH);resolve(false);return;}
      if(!previous)previous=now;
      const dt=Math.min(70,Math.max(0,now-previous));previous=now;
      if(!clock.paused){
        total+=dt*clock.pace;
        v3Paint(phase,total,duration,targets);
        if(onFrame)onFrame(total);
      }
      if(total>=duration){resolve(true);return}
      requestAnimationFrame(raf);
    }requestAnimationFrame(raf);
  });
}
function v3Clean(){
  v3Fx.className='';v3Reticles.replaceChildren();v3Countdown.textContent='';
  v3ctx.clearRect(0,0,v3SizeW,v3SizeH);
  root.classList.remove('v3CannonImpact','v3CannonRecoil');
}
async function ultimate(){
  if(clock.inUltimate||clock.done)return;
  clock.inUltimate=true;
  const myToken=++v3Token;
  const targets=available([0,1,2,3,4,5,6]);
  if(!targets.length){clock.inUltimate=false;return}
  label('魔王必殺・無限加班殲滅砲・七束鎖定',true);
  root.classList.add('v2Ult');
  rig.classList.add('charging');
  v3Targets(targets);
  const hitSlots=new Set();let burn=false;
  try{
    v3Countdown.textContent='全體危險！七道光束分別鎖定';
    if(!await v3Play('warning',830,targets))return;
    if(myToken!==v3Token)return;
    v3Countdown.textContent='魔砲充能中 · 不可解除鎖定';
    sequence('attack',125);
    if(!await v3Play('charge',1250,targets))return;
    if(myToken!==v3Token)return;
    label('無限加班殲滅砲｜七束齊射！',false);
    root.classList.add('v3CannonRecoil');
    v3Countdown.textContent='';
    if(!await v3Play('fire',1440,targets,(elapsed)=>{
      // Every individual beam must physically arrive at its target before damage.
      targets.forEach((i,k)=>{
        if(hitSlots.has(i)||elapsed<560+k*80||myToken!==v3Token)return;
        hitSlots.add(i);v4UltHits.push(i);
        flash(i,clock.rage?15:11,true);
        // Office comedy statuses have real gameplay effects (see partyStep below).
        if(i<=2)v4AddStatus(i,'stun',1000);
        else if(i<=5)v4AddStatus(i,'slow',3000);
        else v4AddStatus(i,'paycut',3500);
        if(k===0){
          root.classList.remove('v3CannonImpact');void root.offsetWidth;
          root.classList.add('v3CannonImpact');
          v3Flash.classList.remove('on');void v3Flash.offsetWidth;v3Flash.classList.add('on');
        }
      });
      if(hitSlots.size===targets.length&&targets.length)shake(true);
    }))return;
    if(myToken!==v3Token)return;
    label('加班災域｜燃燒＋過勞／週一病',false);
    if(!await v3Play('aftermath',1600,targets,(elapsed)=>{
      if(elapsed>=650&&!burn&&myToken===v3Token){
        burn=true;
        targets.filter(i=>allies[i]>0).forEach(i=>flash(i,clock.rage?1.2:.8,false));
      }
    }))return;
    setEnergy(0);
  }finally{
    if(myToken===v3Token){rig.classList.remove('charging');root.classList.remove('v2Ult');v3Clean()}
    clock.inUltimate=false;
  }
}

/* V5 Dungeon Director — real monster actors, boss loaded ONLY in wave 4.
   Image sheets contain separately drawn idle/attack/hurt/defeat poses.
   This supplements V4's boss battle without changing existing V4 files. */
let mondaySpec=null,mondaySpawn=null,encounter=null,v5Epoch=0,v5EnemyTurn=0,v5AnimationTimer=null,v5EliteSkills=[],v52Effects=[];
const v5VisualSpecs={
 'paper-gremlin':{ext:'png',cell:320},
 'coffee-mimic':{ext:'webp',cell:320},
 'deadline-clock':{ext:'webp',cell:384},
 'keyboard-piranha':{ext:'webp',cell:512},
 'chair-golem':{ext:'webp',cell:384},
 'meeting-ghost':{ext:'webp',cell:384},
 'red-stamp-manager':{ext:'webp',cell:256}
};
const v5Frames={idle:4,attack:5,hurt:3,defeat:4};
const v5Field=document.createElement('div');v5Field.id='v5EnemyField';root.append(v5Field);
const v5Hud=document.createElement('div');v5Hud.id='v5WaveHud';v5Hud.innerHTML='<div id="v5WaveTitle"></div><div id="v5EnemySummary"></div>';root.append(v5Hud);
const v5Global=document.createElement('div');v5Global.id='v5GlobalTag';v5Global.textContent='地獄星期一・全副本 HP ×1.65 / ATK ×1.4';root.append(v5Global);
const v5Transition=document.createElement('div');v5Transition.id='v5Transition';v5Transition.innerHTML='<strong></strong><small></small>';root.append(v5Transition);
const v5Complete=document.createElement('div');v5Complete.id='v5Complete';v5Complete.innerHTML='<h2>地獄星期一・通關！</h2><p>四波副本完成｜EXP ×2（規則），稀有掉率提升（數值待平衡）<br>本版為戰鬥與波次驗收，尚未接入正式掉寶結算。</p>';root.append(v5Complete);
const v5Skip=document.createElement('button');v5Skip.id='v5DevSkip';v5Skip.textContent='開發驗收｜下一波';root.append(v5Skip);
v5Skip.onclick=()=>{if(clock.done||!mondaySpec||clock.wave>=4)return;const next=clock.wave+1;v5AdvanceToWave(next,true)};
function v5Sleep(duration,epoch){
 let elapsed=0,last=0;
 return new Promise(resolve=>{
   function next(t){
     if(epoch!==v5Epoch||clock.done){resolve(false);return;}
     if(!last)last=t;
     if(!clock.paused)elapsed+=Math.max(0,Math.min(t-last,80))*clock.pace;
     last=t;
     if(elapsed>=duration){resolve(true);return;}
     requestAnimationFrame(next);
   }requestAnimationFrame(next);
 });
}
function v5SetBanner(title,sub){
 v5Transition.querySelector('strong').textContent=title;
 v5Transition.querySelector('small').textContent=sub;
 v5Transition.classList.add('show');
}
function v5HideBanner(){v5Transition.classList.remove('show')}
function v5CreateMonster(data,index,total){
 const actor={...data,hp:data.maxHp,maxHp:data.maxHp,alive:true,anim:'idle',animStarted:v4Time,animUntil:0,frameIndex:0,elite:data.kind==='elite'&&index===0,abilityCount:0,defeatedAt:null};
 const e=document.createElement('div');e.className='v5Enemy'+(actor.elite?' elite':'');
 const positions=total===4?[[13,42],[38,54],[63,42],[87,54]]:total===3?[[17,45],[50,53],[83,45]]:[[31,50],[69,50]];
 const p=positions[index]||[50,50];e.style.left=(actor.elite?24:p[0])+'%';e.style.top=p[1]+'%';
 e.innerHTML='<div class="v5Shadow"></div><div class="v5Visual"></div><div class="v5Name"></div><div class="v5Bar"><i></i></div>';
 e.querySelector('.v5Name').textContent=data.name;e.setAttribute('data-species',data.species);
 v5Field.append(e);actor.node=e;v5SetPose(actor,'idle',Infinity);return actor;
}
function v5SetPose(actor,state,duration){
 if(!actor?.node)return;
 const meta=v5VisualSpecs[actor.species];if(!meta)return;
 actor.anim=state;actor.animStarted=v4Time;actor.frameIndex=-1;actor.animUntil=Number.isFinite(duration)?v4Time+duration:Infinity;
 const visual=actor.node.querySelector('.v5Visual');
 const src='./art/v19/runtime/monsters/'+actor.species+'/'+state+'.'+meta.ext;
 visual.style.setProperty('--sheet','url("'+src+'")');visual.style.setProperty('--columns',v5Frames[state]*100+'%');
 visual.dataset.state=state;visual.style.backgroundPosition='0% 0%';
 actor.node.classList.toggle('hurt',state==='hurt');
 actor.node.classList.toggle('down',state==='defeat');
}
function v5AnimateMobs(){
 if(!encounter||encounter.kind==='boss'||clock.paused||clock.done)return;
 encounter.enemies.forEach(e=>{
  if(v4Time>=e.animUntil&&e.alive&&e.anim!=='idle')v5SetPose(e,'idle',Infinity);
  if(!e.node||!e.node.isConnected)return;
  if(!e.alive&&e.defeatedAt!==null){
   const deadFor=v4Time-e.defeatedAt;
   if(deadFor>=940)e.node.classList.add('v56Gone');
   if(deadFor>=1410){e.node.remove();return;}
  }
  const n=v5Frames[e.anim],advance=Math.floor(Math.max(0,v4Time-e.animStarted)/(e.anim==='attack'?160:e.anim==='defeat'?235:125));
  const frame=e.anim==='idle'?advance%n:Math.min(n-1,advance);
  if(frame===e.frameIndex)return;
  e.frameIndex=frame;e.node.querySelector('.v5Visual').style.backgroundPosition=(n===1?0:frame/(n-1)*100)+'% 0%';
 });
}
function v5Header(){
 const isBoss=encounter?.kind==='boss';
 const heading=root.querySelector('header .title');if(heading)heading.textContent=isBoss?'地獄星期一・魔王戰':'地獄星期一・副本戰';
 root.classList.toggle('v5Mobs',!isBoss);root.classList.toggle('v5Boss',Boolean(isBoss));
 zone.style.visibility=isBoss?'visible':'hidden';
 if(isBoss){rig.hidden=false;v5Hud.hidden=true;v5Global.style.visibility='visible';}
 else {rig.hidden=true;v5Hud.hidden=false;v5Global.style.visibility='hidden';}
 $('wave').textContent='第 '+clock.wave+' / 4 波';
 if(!isBoss){
  $('v5WaveTitle').textContent=encounter.name;
  $('v5EnemySummary').textContent=encounter.kind==='elite'?'精英警報・HP ×1.65 / 攻擊 ×1.4':'敵人 '+encounter.enemies.filter(e=>e.hp>0).length+' / '+encounter.enemies.length+'・HP ×1.65 / 攻擊 ×1.4';
 }else{
  v4Ribbon.textContent='最終魔王・加班狂課長｜Boss 怒氣與七光束現已啟用';
 }
}
function v5AdvanceToWave(next,forced=false){
 if(!mondaySpec||clock.done)return;
 v55ClearActions();
 v60Reset(false);
 v5Epoch++;v5EnemyTurn=0;v5EliteSkills=[];v52Effects=[];
 const fresh=mondaySpawn(next-1);clock.wave=next;clock.turn=0;clock.allyTurn=0;clock.rage=false;clock.busy=false;clock.inUltimate=false;
 root.classList.remove('v2Rage','v2Ult','v3CannonImpact');
 ++v3Token;v3Clean();v5Field.replaceChildren();v4Status.forEach(m=>m.clear());v4UpdateBadges();
 setEnergy(0);
 const isBoss=fresh.kind==='boss';
 encounter={kind:fresh.kind,name:fresh.name,wave:next,clearing:false,enemies:[]};
 if(isBoss){
  clock.maxHp=fresh.enemies[0].maxHp;
  setHp(clock.maxHp);
  v5SetBanner('魔王降臨','加班狂課長・文書牛魔');
 }else{
  encounter.enemies=fresh.enemies.map((e,i)=>v5CreateMonster(e,i,fresh.enemies.length));
  v5SetBanner(forced?'跳至下一波':fresh.name,isBoss?'':'怪物 HP ×1.65 ・ 攻擊 ×1.4');
  // The original Boss HUD is only meaningful when the boss actually exists.
 }
 v5Header();
 const own=v5Epoch;
 v5Sleep(forced?400:800,own).then(ok=>{if(ok)v5HideBanner()});
}
function v5Health(actor,damage){
 if(!actor||!actor.alive||clock.done)return;
 actor.hp=Math.max(0,actor.hp-damage);
 const percent=Math.max(0,100*actor.hp/actor.maxHp);
 actor.node.querySelector('.v5Bar i').style.width=percent+'%';
 if(actor.hp>0){v5SetPose(actor,'hurt',400);}
 else{
  actor.alive=false;actor.defeatedAt=v4Time;
  actor.node.classList.add('v56Dead');
  v5SetPose(actor,'defeat',950);
}
 v5Header();
 if(encounter.enemies.every(e=>!e.alive)&&!encounter.clearing)v5ClearWave();
}

/** Elite-only telegraph / hit VFX. The actual attached sprite moves with each target. */
const v52Art='./art/v19/runtime/monsters/red-stamp-manager/';
function v52SpawnArt(parent,name,cls,until=850){
 if(!parent)return null;
 const img=document.createElement('img');img.className='v52FX '+cls;img.src=v52Art+name;
 img.alt='';img.setAttribute('aria-hidden','true');parent.append(img);
 v52Effects.push({type:cls,target:parent.className,at:v4Time});
 setTimeout(()=>img.remove(),until/clock.pace);
 return img;
}
function v52StartTelegraph(actor,targets,kind){
 actor.node.classList.add('v52Casting');
 if(kind==='stamp')v52SpawnArt(actor.node,'stamp-impact.svg','v52Charge',490);
 if(kind==='meeting'){
   targets.forEach(i=>v52SpawnArt(team[i],'meeting-array.svg','v52Circle',1250));
   v52SpawnArt(actor.node,'meeting-array.svg','v52CasterGlyph',1150);
 }
 if(kind==='paper'){
  for(let p=0;p<3;p++)v52SpawnArt(actor.node,'paper-projectile.svg','v52PaperHalo v52PaperHalo'+p,600);
 }
}
function v52FinishTelegraph(actor){actor?.node?.classList.remove('v52Casting','v54Strike')}
/**
 * V5.3 battle-clock projectile movement. Hit location is the target's live
 * center, and projectile time follows pause + speed instead of the wall clock.
 */
function v53AnimateFlight(img,source,targetIndex,duration,delay,epoch){
 let elapsed=0,last=0;
 const loop=now=>{
  if(epoch!==v5Epoch||clock.done||!img.isConnected){img.remove();return}
  if(!last)last=now;
  const dt=Math.max(0,Math.min(55,now-last));
  last=now;
  if(!clock.paused)elapsed+=dt*clock.pace;
  const t=Math.max(0,Math.min(1,(elapsed-delay)/duration));
  const ease=t*t*(3-2*t);
  const dest=center(team[targetIndex]);
  img.style.left=(source.x+(dest.x-source.x)*ease)+'px';
  img.style.top=(source.y+(dest.y-source.y)*ease-Math.sin(t*Math.PI)*18)+'px';
  img.style.opacity=elapsed<delay?'0':String(Math.min(1,Math.max(0,t*5))*(t>=1?.85:1));
  const seal=img.classList.contains('v52FlyingSeal');
  img.style.transform='translate(-50%,-50%) rotate('+Math.round(seal?(-12+42*ease):(-20+235*ease))+'deg) scale('+(seal?(0.68+0.14*ease):(0.55+0.35*ease))+')';
  if(t>=1){img.remove();return;}
  requestAnimationFrame(loop);
 };
 requestAnimationFrame(loop);
}
function v52FlyPaper(actor,index,delay=0){
 if(!actor?.node||!team[index]||allies[index]<=0)return;
 const from=center(actor.node),epoch=v5Epoch;
 const img=document.createElement('img');
 img.className='v52FlyingDocument';img.src=v52Art+'paper-projectile.svg';img.alt='';
 img.style.left=from.x+'px';img.style.top=from.y+'px';plane.append(img);
 v52Effects.push({type:'flying-document',target:index,at:v4Time});
 v53AnimateFlight(img,{x:from.x+25,y:from.y-24},index,480,delay,epoch);
}
function v53FlySeal(actor,index){
 if(!actor?.node||!team[index]||allies[index]<=0)return;
 const from=center(actor.node),img=document.createElement('img');
 img.className='v52FlyingSeal';img.src=v52Art+'stamp-impact.svg';img.alt='';
 img.style.left=from.x+'px';img.style.top=from.y+'px';plane.append(img);
 v52Effects.push({type:'seal-travel',target:index,at:v4Time});
 v53AnimateFlight(img,{x:from.x+35,y:from.y-15},index,260,0,v5Epoch);
}
function v5StampContact(index,meeting=false){
 const node=team[index];if(!node||allies[index]<=0)return;
 const mark=document.createElement('img');
 mark.className='v5StampContact';mark.alt='';
 mark.src='./art/v19/runtime/monsters/red-stamp-manager/stamp-impact.svg';
 node.append(mark);
 mark.addEventListener('animationend',()=>mark.remove(),{once:true});
 setTimeout(()=>mark.remove(),1500/clock.pace);
 if(meeting){
  const ghost=document.createElement('div');ghost.className='v5MeetingAura';node.append(ghost);
  setTimeout(()=>ghost.remove(),1500/clock.pace);
 }
}
function v5MobAttackProjectile(actor,target){
 const from=center(actor.node),to=center(team[target]);
 const projectile=piece('img','v2Paper',from.x,from.y,ART.parts.paper_stack);
 const x=to.x-from.x,y=to.y-from.y;
 projectile.animate(
   [{transform:'translate(-50%,-50%) scale(.17) rotate(-14deg)',opacity:1},
    {transform:'translate('+(x-42)+'px,'+(y-42)+'px) scale(.35) rotate(280deg)',opacity:1}],
   {duration:450/clock.pace,fill:'forwards',easing:'ease-in'});
}
async function v5MobStep(){
 if(clock.paused||clock.busy||clock.done||encounter?.clearing||encounter?.kind==='boss')return;
 const living=encounter.enemies.filter(e=>e.alive);if(!living.length)return;
 clock.busy=true;const epoch=v5Epoch;
 const supervisor=living.find(e=>e.elite);
 const actor=supervisor&&v5EnemyTurn%2===0?supervisor:living[(v5EnemyTurn+1)%living.length];
 v5EnemyTurn++;clock.turn++;if(actor.elite)actor.abilityCount++;
 const candidates=available([0,1,2,3,4,5,6]);
 if(!candidates.length){v5Defeat();clock.busy=false;return}
 const main=candidates[(clock.turn+v5EnemyTurn*2)%candidates.length];
 const isElite=actor.species==='red-stamp-manager';
 const kind=isElite?(actor.abilityCount%3===2?'meeting':actor.abilityCount%3===0?'paper':'stamp'):'normal';
 const name=kind==='meeting'?'無限會議・全員留下！':kind==='paper'?'催件轟炸・不准退件！':'主管蓋章・立刻交件';
 const targets=kind==='meeting'?candidates.slice().sort((a,b)=>allies[a]-allies[b]).slice(0,3):
               kind==='paper'?candidates.filter(x=>x!==main).slice(0,3):[main];
 if(isElite){v5EliteSkills.push(name);v52Effects=[];label(actor.name+'｜'+name);}
 else label(actor.name+'｜怪物襲擊');
 v5SetPose(actor,'attack',kind==='normal'?710:1120);
 if(isElite)v52StartTelegraph(actor,targets,kind);else v5MobAttackProjectile(actor,main);
 try{
   // Stage 1: visible preparation. A paused game freezes the attack sequence.
   if(!await v5Sleep(isElite?560:460,epoch))return;
   if(!actor.alive||encounter?.kind==='boss'||clock.done||epoch!==v5Epoch)return;
   if(kind==='stamp'){
     actor.node.classList.add('v54Strike');
     setTimeout(()=>actor.node?.classList.remove('v54Strike'),380/clock.pace);
     const slash=v52SpawnArt(actor.node,'stamp-impact.svg','v52Slash',380);
     if(slash)v52Effects.push({type:'stamp-release',at:v4Time});
     v53FlySeal(actor,main);
     if(!await v5Sleep(280,epoch))return;
     if(!actor.alive||clock.done||epoch!==v5Epoch)return;
     v5StampContact(main);
     flash(main,actor.atk);
     shake(false);
   }else if(kind==='paper'){
     // Separate flight to three unique targets; each hit occurs after its own flight.
     for(let k=0;k<targets.length;k++)v52FlyPaper(actor,targets[k],k*105);
     if(!await v5Sleep(500,epoch))return;
     if(!actor.alive||clock.done||epoch!==v5Epoch)return;
     for(const [k,index] of targets.entries()){
       if(allies[index]>0){
         v5StampContact(index);
         flash(index,actor.atk*.47);
         // D32 "Monday startup": apply to the exact teammate on contact.
         if(k===0||k===2)v4AddStatus(index,'slow',2400);
       }
       if(k<targets.length-1){
        if(!await v5Sleep(105,epoch))return;
        if(!actor.alive||clock.done||epoch!==v5Epoch)return;
       }
     }
     shake(false);
   }else if(kind==='meeting'){
     // Real summoned meeting circles already attached to three individual units.
     if(!await v5Sleep(280,epoch))return;
     if(!actor.alive||clock.done||epoch!==v5Epoch)return;
     for(const [k,index] of targets.entries()){
       if(allies[index]<=0)continue;
       v5StampContact(index,true);
       flash(index,actor.atk*.28);
       v4AddStatus(index,k===0?'paycut':'slow',k===0?3100:2450);
     }
     shake(false);
   }else{
     flash(main,actor.atk);
     if(actor.species==='deadline-clock'&&clock.turn%3===0)v4AddStatus(main,'slow',1800);
   }
   if(!available([0,1,2,3,4,5,6]).length)v5Defeat();
 }finally{v52FinishTelegraph(actor);if(epoch===v5Epoch)clock.busy=false}
}
/* V5.5: attacks must physically touch an enemy before HP/damage text changes.
   Melee allies dash to the collision point; ranged allies send an illustrated
   projectile there. All motion respects pause, battle speed, wave/reset tokens. */
const v55Actions=new Map(),v55Contacts=[];
const v55HitArt='./art/v19/candidates/effects/impact.svg';
const v55SlashArt='./art/v19/candidates/effects/slash.svg';
function v55ClearActions(){
 for(const action of v55Actions.values())action.cleanup?.();
 v55Actions.clear();
}
function v55Impact(target,actorIndex,damage,role){
 if(!target?.alive||clock.done||encounter?.kind==='boss'||encounter?.clearing)return;
 const at=center(target.node);
 const img=piece('img','v55HitSpark',at.x,at.y,v55HitArt);
 img.alt='';img.style.width=(target.elite?75:56)+'px';
 img.style.height=(target.elite?75:56)+'px';
 let n=piece('span','v2Dmg hero',at.x,at.y-14);
 n.textContent='-'+Math.round(damage*470).toLocaleString();
 const actorRect=team[actorIndex].getBoundingClientRect(),enemyRect=target.node.getBoundingClientRect();
 const nameRect=target.node.querySelector('.v5Name')?.getBoundingClientRect();
 const barRect=target.node.querySelector('.v5Bar')?.getBoundingClientRect();
 const intersect=(a,b)=>Boolean(a&&b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top);
 const labelOverlap=role==='melee'&&intersect(actorRect,nameRect);
 const barOverlap=role==='melee'&&intersect(actorRect,barRect);
 const attackerPosition=center(team[actorIndex]);
 const gap=Math.hypot(attackerPosition.x-at.x,attackerPosition.y-at.y);
 const minimumSafeGap=enemyRect.width*.39+actorRect.width*.28;
 v55Contacts.push({actor:actorIndex,enemy:target.species,role,damage,at:v4Time,wave:clock.wave,gap,minimumSafeGap,labelOverlap,barOverlap});
 if(v55Contacts.length>80)v55Contacts.shift();
 v5Health(target,damage);
}
function v55BeginHeroAttack(index,target,damage){
 if(v55Actions.has(index)||!target?.alive||clock.done)return;
 const attacker=team[index],epoch=v5Epoch;
 // Keep specialized class roles: swords/guards dash; medics, mages, engineers cast.
 const caption=attacker.textContent||'';
 const ranged=[3,4,5].includes(index); // Actual party roles: assassin and fighter melee; support classes are ranged.
 const start=center(attacker);
 const end=center(target.node);
 const dx=end.x-start.x,dy=end.y-start.y;
 const enemyRect=target.node.getBoundingClientRect();
 const allyRect=attacker.getBoundingClientRect();
 const enemyWidth=enemyRect.width;
 const allyWidth=allyRect.width;
 const labelRect=target.node.querySelector('.v5Name')?.getBoundingClientRect();
 const hpRect=target.node.querySelector('.v5Bar')?.getBoundingClientRect();
 const blockingBottom=Math.max(labelRect?.bottom||enemyRect.bottom,hpRect?.bottom||enemyRect.bottom);
 // Character bodies cannot overlap monster nameplates and HP bars.
 const maxVerticalAdvance=Math.max(0,allyRect.top-blockingBottom-9);
 const stopDistance=Math.max(63,enemyWidth*.47+allyWidth*.37);
 const initialDistance=Math.hypot(dx,dy);
 const reachDistance=Math.max(0,initialDistance-stopDistance);
 const projectile=ranged?document.createElement('img'):null;
 if(projectile){
  projectile.className='v55HeroProjectile';projectile.alt='';projectile.src=v55SlashArt;
  plane.append(projectile);
 }
 attacker.classList.remove('attack');void attacker.offsetWidth;attacker.classList.add('attack');
 const originalTranslate=attacker.style.translate,originalZ=attacker.style.zIndex;
 let elapsed=0,last=0,hit=false,closed=false;
 const duration=ranged?510:720,impactFraction=ranged?.87:.61;
 function cleanup(){
  if(closed)return;closed=true;
  attacker.style.translate=originalTranslate;
  attacker.style.zIndex=originalZ;
  attacker.classList.remove('attack','v56Lunging');
  projectile?.remove();
  v55Actions.delete(index);
 }
 const action={cleanup,targetId:target.id};v55Actions.set(index,action);
 function frame(now){
  if(closed)return;
  if(epoch!==v5Epoch||clock.done||!attacker.isConnected||clock.wave===4){cleanup();return}
  if(!last)last=now;
  const dt=Math.max(0,Math.min(80,now-last));last=now;
  if(!clock.paused)elapsed+=dt*clock.pace;
  const t=Math.min(1,elapsed/duration);
  let dest;
  if(!target.alive)dest=encounter?.enemies.find(e=>e.alive);
  else dest=target;
  const position=dest?center(dest.node):end;
  if(ranged){
    const travel=Math.max(0,Math.min(1,(t-.15)/.72));
    const eased=travel*travel*(3-2*travel);
    if(projectile){
      projectile.style.left=(start.x+(position.x-start.x)*eased)+'px';
      projectile.style.top=(start.y+(position.y-start.y)*eased-Math.sin(Math.PI*travel)*32)+'px';
      projectile.style.opacity=t<.15?'0':t>.94?'0':'1';
      projectile.style.transform='translate(-50%,-50%) rotate('+Math.round(18+eased*270)+'deg) scale('+(0.56+0.12*travel)+')';
    }
  }else{
    // Wind-up → approach only to weapon range → brief attack contact → recoil.
    // Stop at the edge of the monster hitbox, never on top of its face/name.
    let dash;
    if(t<.14)dash=0;
    else if(t<.53){const u=(t-.14)/.39;dash=u*u*(3-2*u);}
    else if(t<.69)dash=1;
    else{const u=(t-.69)/.31;dash=1-u*u*(3-2*u);}
    const curDistance=Math.hypot(position.x-start.x,position.y-start.y);
    const reach=Math.max(0,Math.min(reachDistance,curDistance-stopDistance))*dash;
    const unitX=curDistance>0?(position.x-start.x)/curDistance:0;
    const unitY=curDistance>0?(position.y-start.y)/curDistance:0;
    const xMove=Math.max(-86,Math.min(86,unitX*reach));
    const yMove=Math.max(-maxVerticalAdvance,Math.min(38,unitY*reach));
    attacker.style.translate=Math.round(xMove)+'px '+Math.round(yMove)+'px';
    // Allies and enemies remain readable; attack FX is placed at true contact.
    attacker.style.zIndex='22';
    attacker.classList.toggle('v56Lunging',t>=.14&&t<.69);

  }
  if(!hit&&t>=impactFraction){
    hit=true;
    const struck=target.alive?target:encounter?.enemies.find(e=>e.alive);
    if(struck&&allies[index]>0&&epoch===v5Epoch)v55Impact(struck,index,damage,ranged?'ranged':'melee');
  }
  if(t<1)requestAnimationFrame(frame);else cleanup();
 }
 requestAnimationFrame(frame);
}
function v5PartyVsMobs(){
 if(clock.done||clock.paused||encounter?.clearing||encounter?.kind==='boss')return;
 const alive=available([0,1,2,3,4,5,6]);if(!alive.length){v5Defeat();return}
 const i=clock.allyTurn%7;clock.allyTurn++;
 if(allies[i]<=0||v4Has(i,'stun')||v55Actions.has(i))return;
 if(v4Has(i,'slow')&&Math.floor(clock.allyTurn/7)%2===1)return;
 const targets=encounter.enemies.filter(e=>e.alive);
 if(!targets.length)return;
 if(v60TrySkill(i))return;
 if(v59TrySupport(i))return;
 // Every class has independent target preferences; missiles in flight reserve
 // a portion of the enemy's attention to avoid unrealistic universal focus.
 const reservations={};
 for(const task of v55Actions.values())if(task.targetId)reservations[task.targetId]=(reservations[task.targetId]||0)+1;
 const heroP=center(team[i]),battleRect=root.getBoundingClientRect();
 const normalized=(p)=>({x:(p.x-battleRect.left)/battleRect.width*100,y:(p.y-battleRect.top)/battleRect.height*100});
 const choices=targets.map(e=>{const p=normalized(center(e.node));return {id:e.id,species:e.species,elite:e.elite,alive:e.alive,hp:e.hp,maxHp:e.maxHp,...p}});
 const choice=v59AI.pickTarget(i,choices,{heroPosition:normalized(heroP),reservations});
 const target=targets.find(e=>e.id===choice?.id)||targets[0];
 const hero=v59AI.ALLY_ROLES[i];
 const damage=Math.max(5,Math.round(24*hero.attack/128));
 v59TargetEvents.push({actor:i,role:hero.role,target:target.id,species:target.species,wave:clock.wave});
 if(v59TargetEvents.length>80)v59TargetEvents.shift();
 v55BeginHeroAttack(i,target,damage);
}
function v5ClearWave(){
 if(!encounter||encounter.clearing||clock.done)return;
 encounter.clearing=true;const epoch=v5Epoch,was=clock.wave;
 label('第 '+was+' 波完成！');
 v5SetBanner('階段突破！','存活隊友回復最大生命 12%，最低血量再獲得 10% 勝利護盾');
 v5Sleep(1200,epoch).then(ok=>{
  if(!ok||clock.done||clock.wave!==was)return;
  allies.forEach((hp,i)=>{if(hp>0){
    allies[i]=Math.min(100,hp+12);
    team[i].querySelector('.v2Health').style.width=allies[i]+'%';
  }});
  v59WaveRescue();
  v5AdvanceToWave(was+1);
 });
}
function v5Victory(){
 clock.done=true;clearInterval(bossTimer);clearInterval(allyTimer);
 v5Complete.classList.add('show');v5HideBanner();
 $('wave').textContent='全副本通關';
 label('地獄星期一｜副本挑戰成功');
}
function v5Defeat(){
 clock.done=true;clearInterval(bossTimer);clearInterval(allyTimer);
 v5SetBanner('隊伍全滅','按「重來」可從第一波再挑戰');
 label('地獄星期一｜挑戰失敗');
}
window.__salaryBossV5={
 get wave(){return clock.wave},
 get kind(){return encounter?.kind},
 get mobNames(){return encounter?.enemies.map(e=>e.name)||[]},
 get eliteSkills(){return [...v5EliteSkills]},
 get eliteEffects(){return [...v52Effects]},
 get heroContacts(){return [...v55Contacts]},
 get tacticalTargets(){return [...v59TargetEvents]},
 get supportEvents(){return [...v59Events]},
 get shields(){return v59Shields.map(s=>({hp:s.hp,source:s.source,expires:s.expires}))},
 get heroes(){return v59AI?.ALLY_ROLES||[]},
 get activeSkills(){return [...v60Events]},
 get guardState(){return {...v60Guard}},
 get skillCooldowns(){return {...v60Cooldown}},

 devSetHp:(i,value)=>{
  if(new URLSearchParams(location.search).get('dev')!=='1'||!Number.isInteger(i)||i<0||i>=7)return false;
  allies[i]=Math.max(1,Math.min(v59MaxHp[i],Number(value)||1));
  team[i].querySelector('.v2Health').style.width=(allies[i]/v59MaxHp[i]*100)+'%';
  return true;
 },
 devCastSupport:i=>{
  if(new URLSearchParams(location.search).get('dev')!=='1'||clock.done)return false;
  return v59TrySupport(i);
 },
 devWaveRescue:()=>{
  if(new URLSearchParams(location.search).get('dev')!=='1'||clock.done)return false;
  v59WaveRescue();return true;
 },
 devHit:(i,damage)=>{
  if(new URLSearchParams(location.search).get('dev')!=='1'||clock.done)return false;
  flash(i,damage);return true;
 },
 get health(){return [...allies]},

 get activeHeroAttacks(){return v55Actions.size},
 devDefeatElite:()=>{
  // An isolated art QA hook, available only in developer preview.
  if(new URLSearchParams(location.search).get('dev')!=='1'||clock.wave!==3||clock.done)return false;
  const elite=encounter?.enemies.find(e=>e.elite&&e.alive);
  if(!elite)return false;
  v5Health(elite,elite.hp);
  return true;
 },
 demoEliteSkill:(kind)=>{
  if(new URLSearchParams(location.search).get('dev')!=='1'||clock.wave!==3||clock.busy||clock.done)return false;
  const actor=encounter?.enemies.find(e=>e.elite&&e.alive);
  const order={stamp:0,meeting:1,paper:2};
  if(!actor||!(kind in order))return false;
  actor.abilityCount=order[kind];if(v5EnemyTurn%2===1)v5EnemyTurn++;
  bossStep();return true;
 },
 get eliteSprite(){return encounter?.enemies.find(e=>e.elite)?.node.querySelector('.v5Visual')?.style.getPropertyValue('--sheet')||''},
 get mobHP(){return encounter?.enemies.map(e=>e.hp)||[]},
 get bossVisible(){return clock.wave===4&&zone.style.visibility==='visible'},
 get done(){return clock.done},
 get partyHP(){return [...allies]},
 get global(){return mondaySpec?.global},
 get epoch(){return v5Epoch},
 get ultHits(){return [...v4UltHits]},
 skipTo:(wave)=>{if(!mondaySpec||!mondaySpawn||!Number.isInteger(wave)||wave<1||wave>4||clock.done)return false;v5AdvanceToWave(wave,true);return true}
};
v5AnimationTimer=setInterval(v5AnimateMobs,120);
async function bossStep(){if(clock.wave<4)return v5MobStep();if(clock.paused||clock.busy||clock.done)return;clock.busy=true;try{clock.turn++;if(clock.energy>=100)await ultimate();else if(clock.turn%4===0)await bombard();else await normal();if(clock.energy>=100&&!clock.paused&&!clock.done)await ultimate()}finally{clock.busy=false}}
function partyStep(){if(clock.wave<4)return v5PartyVsMobs();if(clock.paused||clock.done||clock.inUltimate)return;const living=available([0,1,2,3,4,5,6]);if(!living.length){clock.done=true;label('隊伍全滅｜請重新挑戰');return}// Every teammate acts in an independent round robin; debuffs can now stop a *real* action.
clock.allyTurn=(clock.allyTurn||0)+1;
const i=(clock.allyTurn-1)%7,unit=team[i];
if(allies[i]<=0)return;
if(v60TrySkill(i))return;
if(v59TrySupport(i))return;
if(v4Has(i,'stun')){v4Ribbon.textContent='💤 過勞昏迷：第 '+(i+1)+' 位同事無法行動';return;}
if(v4Has(i,'slow')&&Math.floor((clock.allyTurn-1)/7)%2===1){
  v4Ribbon.textContent='🐌 週一開機失敗：第 '+(i+1)+' 位同事出手延遲';return;
}
unit.classList.remove('attack');void unit.offsetWidth;unit.classList.add('attack');
setTimeout(()=>unit.classList.remove('attack'),500/clock.pace);
const damage=Math.max(4,Math.round(7*v59AI.ALLY_ROLES[i].attack/128)); // Preserve narrow Boss-win balance while applying each role's attack stat.
setHp(clock.hp-damage);
let p=pointBoss(),n=piece('span','v2Dmg hero',p.x,p.y);
n.textContent='-'+(damage*11900).toLocaleString();
// No phantom team regeneration: only real support skills restore health.
if(clock.hp<=0)v5Victory();}
function restart(){v55ClearActions();v59Reset();v60Reset();++v3Token;++v5Epoch;v3Clean();v4ClearStatuses();clearInterval(bossTimer);clearInterval(allyTimer);Object.assign(clock,{energy:0,hp:165,maxHp:165,wave:1,rage:false,turn:0,allyTurn:0,pace:1,paused:false,done:false,busy:false,inUltimate:false});allies.fill(100);team.forEach(u=>{u.classList.remove('v2Down','v2Hit');u.querySelector('.v2Health').style.width='100%'});v5Complete.classList.remove('show');v5HideBanner();root.classList.remove('paused','v2Ult','v2Rage');frame.hidden=true;rig.hidden=false;plane.replaceChildren();label('地獄星期一｜四波副本・真正小怪先出場');v4Ribbon.textContent='Lv.85 測試隊伍｜小怪→精英→魔王';setHp(165);setEnergy(0);$('speed').textContent='倍速 ×1';$('pace').textContent='×1';$('pause').textContent='暫停';v5AdvanceToWave(1);run()}
function run(){clearInterval(bossTimer);clearInterval(allyTimer);bossTimer=setInterval(bossStep,2600/clock.pace);allyTimer=setInterval(partyStep,1100/clock.pace)}
for(let id of ['speed','pause','restart']){let old=$(id),newNode=old.cloneNode(true);old.replaceWith(newNode)}
$('speed').onclick=()=>{clock.pace=clock.pace===1?2:clock.pace===2?3:1;$('speed').textContent='倍速 ×'+clock.pace;$('pace').textContent='×'+clock.pace;run()};
$('pause').onclick=()=>{clock.paused=!clock.paused;root.classList.toggle('paused',clock.paused);$('pause').textContent=clock.paused?'繼續':'暫停'};
$('restart').onclick=restart;// V4 test hook is exposed only on the development URL.
const v3Demo=document.createElement('button');v3Demo.id='v3DevUlt';v3Demo.textContent='開發驗收｜立即展示大招';root.append(v3Demo);
if(new URLSearchParams(location.search).get('dev')==='1')document.body.classList.add('v3-dev');
v3Demo.onclick=()=>{if(clock.wave!==4||clock.busy||clock.done||clock.inUltimate)return;setEnergy(100);bossStep()};
Promise.all([import('./v19/s1-hell-monday-dungeon.mjs'),import('./v19/s1-party-ai.mjs'),import('./v19/s1-hero-active-skills.mjs')])
 .then(([m,ai,skills])=>{mondaySpec=m.HELL_MONDAY;mondaySpawn=m.spawnMondayWave;v59AI=ai;v60AI=skills;restart();const q=new URLSearchParams(location.search);const w=Number(q.get('wave'));if(q.get('dev')==='1'&&Number.isInteger(w)&&w>1&&w<=4)v5AdvanceToWave(w,true);})
 .catch(e=>{console.error('Monday wave loading failed',e);v5SetBanner('副本載入失敗',e.message);});

})();