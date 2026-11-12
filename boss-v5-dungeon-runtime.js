(()=>{
'use strict';
if(!document.querySelector('#bossRig')||window.__salaryBossV2)return;window.__salaryBossV2=true;
clearInterval(combatTicker);if(frameTicker)clearInterval(frameTicker);if(stateTimer)clearTimeout(stateTimer);
const $=id=>document.getElementById(id),root=$('game'),rig=$('bossRig'),frame=$('bossFrame'),zone=$('bossZone'),team=[...document.querySelectorAll('.team-zone .unit')];
const bar=document.createElement('div');bar.id='bossEnergyHud';bar.innerHTML='<div class="energy-words"><span>魔力／怒氣</span><span id="energyText">0 / 100</span></div><div class="energy-track"><div id="energyFill"></div></div>';document.querySelector('.hud').append(bar);
const plane=document.createElement('div');plane.id='v2Plane';root.append(plane);const warning=document.createElement('div');warning.id='v2Warning';root.append(warning);
const status=document.createElement('div');status.id='v2Status';status.textContent='全程自動交戰｜Boss 怒氣大招';root.append(status);
document.querySelector('.footer .hint').textContent='V4 七光束＋過勞昏迷／週一病／薪延｜Lv.85 數值僅供驗收';
const positions=[[18,62],[50,64],[82,62],[18,19],[50,21],[82,19],[50,76]];
const allies=Array(7).fill(100);team.forEach((u,i)=>{u.style.left=positions[i][0]+'%';u.style.top=positions[i][1]+'%';u.querySelector('.hp').innerHTML='<i class="v2Health"></i>'});
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
function flash(i,amt,heavy=false){if(allies[i]<=0)return;amt=clock.wave===4?Math.round(amt*1.4*10)/10:amt;let unit=team[i],p=center(unit);piece('img','v2Slash',p.x,p.y-10,ART.parts.slash_fx);let n=piece('span','v2Dmg',p.x,p.y-20);n.textContent='-'+(amt*630).toLocaleString();allies[i]=Math.max(0,allies[i]-amt);unit.querySelector('.v2Health').style.width=allies[i]+'%';unit.classList.remove('v2Hit');void unit.offsetWidth;unit.classList.add('v2Hit');setTimeout(()=>unit.classList.remove('v2Hit'),580/clock.pace);if(!allies[i])unit.classList.add('v2Down')}
function shake(big=false){root.classList.remove('v2Shake','v2UltShake');void root.offsetWidth;root.classList.add(big?'v2UltShake':'v2Shake');setTimeout(()=>root.classList.remove('v2Shake','v2UltShake'),big?700:360)}
function effectTravel(i){let from=pointBoss(),to=center(team[i]);let dx=to.x-from.x,dy=to.y-from.y;let path=piece('div','v2Trail',from.x,from.y);path.style.width=Math.hypot(dx,dy)+'px';path.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';let p=piece('img','v2Paper',from.x,from.y,ART.parts.paper_stack);p.animate([{transform:'translate(-50%,-50%) scale(.12) rotate(-15deg)'},{transform:'translate('+(dx-40)+'px,'+(dy-40)+'px) scale(.38) rotate(290deg)'}],{duration:540/clock.pace,easing:'ease-in',fill:'forwards'})}
function available(list){return list.filter(i=>allies[i]>0)}
async function normal(){let variant=clock.turn%5;let frontline=available([0,1,2]);let choices=frontline.length?frontline:available([0,1,2,3,4,5,6]);let target=variant===2?choices.slice():choices.length?[choices[(clock.turn-1)%choices.length]]:[];if(!target.length)return;label(variant===2?'橫掃公文爪':variant===4?'牛角突頂':'巨爪拍擊');target.forEach(i=>ring(i,false));sequence('attack',110);await pause(310);if(clock.paused||clock.done)return;target.forEach(effectTravel);await pause(560);if(clock.paused||clock.done)return;target.forEach(i=>{flash(i,variant===4?9:variant===2?6:8);if(variant===4)v4AddStatus(i,'stun',1000);});shake(variant===4);setEnergy(clock.energy+26+(clock.rage?9:0))}
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
        flash(i,clock.rage?18:14,true);
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
        targets.filter(i=>allies[i]>0).forEach(i=>flash(i,clock.rage?1.5:1,false));
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
let mondaySpec=null,mondaySpawn=null,encounter=null,v5Epoch=0,v5EnemyTurn=0,v5AnimationTimer=null;
const v5VisualSpecs={
 'paper-gremlin':{ext:'png',cell:320},
 'coffee-mimic':{ext:'webp',cell:320},
 'deadline-clock':{ext:'webp',cell:384},
 'keyboard-piranha':{ext:'webp',cell:512},
 'chair-golem':{ext:'webp',cell:384},
 'meeting-ghost':{ext:'webp',cell:384}
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
 const actor={...data,hp:data.maxHp,maxHp:data.maxHp,alive:true,anim:'idle',animStarted:v4Time,animUntil:0,frameIndex:0,elite:data.kind==='elite'&&index===0};
 const e=document.createElement('div');e.className='v5Enemy'+(actor.elite?' elite':'');
 const positions=total===4?[[13,42],[38,54],[63,42],[87,54]]:total===3?[[17,45],[50,53],[83,45]]:[[31,50],[69,50]];
 const p=positions[index]||[50,50];e.style.left=p[0]+'%';e.style.top=p[1]+'%';
 e.innerHTML='<div class="v5Shadow"></div><div class="v5Visual"></div><div class="v5Name"></div><div class="v5Bar"><i></i></div>';
 e.querySelector('.v5Name').textContent=data.name;e.setAttribute('data-species',data.species);
 v5Field.append(e);actor.node=e;v5SetPose(actor,'idle',Infinity);return actor;
}
function v5SetPose(actor,state,duration){
 if(!actor?.node)return;
 const meta=v5VisualSpecs[actor.species];if(!meta)return;
 actor.anim=state;actor.animStarted=v4Time;actor.animUntil=Number.isFinite(duration)?v4Time+duration:Infinity;
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
  if(!e.node)return;
  const n=v5Frames[e.anim],frame=Math.floor(Math.max(0,v4Time-e.animStarted)/125)%n;
  if(frame===e.frameIndex)return;
  e.frameIndex=frame;e.node.querySelector('.v5Visual').style.backgroundPosition=(n===1?0:frame/(n-1)*100)+'% 0%';
 });
}
function v5Header(){
 const isBoss=encounter?.kind==='boss';
 root.classList.toggle('v5Mobs',!isBoss);root.classList.toggle('v5Boss',Boolean(isBoss));
 zone.style.visibility=isBoss?'visible':'hidden';
 if(isBoss){rig.hidden=false;v5Hud.hidden=true;v5Global.style.visibility='visible';}
 else {rig.hidden=true;v5Hud.hidden=false;v5Global.style.visibility='visible';}
 $('wave').textContent='第 '+clock.wave+' / 4 波';
 if(!isBoss){
  $('v5WaveTitle').textContent=encounter.name;
  $('v5EnemySummary').textContent=encounter.kind==='elite'?'精英警報｜催件主管登場':'敵人 '+encounter.enemies.filter(e=>e.hp>0).length+' / '+encounter.enemies.length+' 隻';
 }else{
  v4Ribbon.textContent='最終魔王・加班狂課長｜Boss 怒氣與七光束現已啟用';
 }
}
function v5AdvanceToWave(next,forced=false){
 if(!mondaySpec||clock.done)return;
 v5Epoch++;v5EnemyTurn=0;
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
 else{actor.alive=false;v5SetPose(actor,'defeat',950);}
 v5Header();
 if(encounter.enemies.every(e=>!e.alive)&&!encounter.clearing)v5ClearWave();
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
 const actor=living[v5EnemyTurn++%living.length];clock.turn++;
 const candidates=available([0,1,2,3,4,5,6]);if(!candidates.length){v5Defeat();clock.busy=false;return}
 const target=candidates[(clock.turn+v5EnemyTurn*2)%candidates.length];
 label(actor.name+'｜'+(actor.elite?'主管催件':'怪物襲擊'));
 v5SetPose(actor,'attack',710);v5MobAttackProjectile(actor,target);
 try{
  const ok=await v5Sleep(460,epoch);
  if(!ok||encounter?.kind==='boss'||clock.done)return;
  // Global ATK ×1.4 is already reflected in actor.atk; never multiply again.
  flash(target,actor.atk);
  if(actor.species==='deadline-clock'&&clock.turn%3===0)v4AddStatus(target,'slow',1800);
  if(actor.elite&&clock.turn%2===0)v4AddStatus(target,'slow',2600);
  if(!available([0,1,2,3,4,5,6]).length)v5Defeat();
 }finally{if(epoch===v5Epoch)clock.busy=false}
}
function v5PartyVsMobs(){
 if(clock.done||clock.paused||encounter?.clearing)return;
 const alive=available([0,1,2,3,4,5,6]);if(!alive.length){v5Defeat();return;}
 const targetIndex=clock.allyTurn%7;clock.allyTurn++;
 if(allies[targetIndex]<=0||v4Has(targetIndex,'stun'))return;
 if(v4Has(targetIndex,'slow')&&Math.floor(clock.allyTurn/7)%2===1)return;
 const monsters=encounter.enemies.filter(e=>e.alive);
 if(!monsters.length)return;
 // Auto-target rule: elite first, otherwise weakest remaining; never strike a dead enemy.
 const target=monsters.find(e=>e.elite)||monsters.slice().sort((a,b)=>a.hp-b.hp)[0];
 const attacker=team[targetIndex];
 attacker.classList.remove('attack');void attacker.offsetWidth;attacker.classList.add('attack');
 setTimeout(()=>attacker.classList.remove('attack'),500/clock.pace);
 const damage=21+(targetIndex%3)*3;
 const p=center(target.node);let n=piece('span','v2Dmg hero',p.x,p.y-16);
 n.textContent='-'+Math.round(damage*470).toLocaleString();
 v5Health(target,damage);
 if(clock.allyTurn%7===0){
  allies.forEach((v,j)=>{if(v>0){
   allies[j]=Math.min(100,v+(v4Has(j,'paycut')?1.5:3));
   team[j].querySelector('.v2Health').style.width=allies[j]+'%';
  }});
 }
}
function v5ClearWave(){
 if(!encounter||encounter.clearing||clock.done)return;
 encounter.clearing=true;const epoch=v5Epoch,was=clock.wave;
 label('第 '+was+' 波完成！');
 v5SetBanner('階段突破！','存活隊友回復最大生命 10%');
 v5Sleep(1200,epoch).then(ok=>{
  if(!ok||clock.done||clock.wave!==was)return;
  allies.forEach((hp,i)=>{if(hp>0){
    allies[i]=Math.min(100,hp+10);
    team[i].querySelector('.v2Health').style.width=allies[i]+'%';
  }});
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
 get mobHP(){return encounter?.enemies.map(e=>e.hp)||[]},
 get bossVisible(){return clock.wave===4&&zone.style.visibility==='visible'},
 get done(){return clock.done},
 get partyHP(){return [...allies]},
 get global(){return mondaySpec?.global},
 get epoch(){return v5Epoch},
 get ultHits(){return [...v4UltHits]},
 skipTo:(wave)=>{if(!Number.isInteger(wave)||wave<1||wave>4||clock.done)return false;v5AdvanceToWave(wave,true);return true}
};
v5AnimationTimer=setInterval(v5AnimateMobs,120);
async function bossStep(){if(clock.wave<4)return v5MobStep();if(clock.paused||clock.busy||clock.done)return;clock.busy=true;try{clock.turn++;if(clock.energy>=100)await ultimate();else if(clock.turn%4===0)await bombard();else await normal();if(clock.energy>=100&&!clock.paused&&!clock.done)await ultimate()}finally{clock.busy=false}}
function partyStep(){if(clock.wave<4)return v5PartyVsMobs();if(clock.paused||clock.done||clock.inUltimate)return;const living=available([0,1,2,3,4,5,6]);if(!living.length){clock.done=true;label('隊伍全滅｜請重新挑戰');return}// Every teammate acts in an independent round robin; debuffs can now stop a *real* action.
clock.allyTurn=(clock.allyTurn||0)+1;
const i=(clock.allyTurn-1)%7,unit=team[i];
if(allies[i]<=0)return;
if(v4Has(i,'stun')){v4Ribbon.textContent='💤 過勞昏迷：第 '+(i+1)+' 位同事無法行動';return;}
if(v4Has(i,'slow')&&Math.floor((clock.allyTurn-1)/7)%2===1){
  v4Ribbon.textContent='🐌 週一開機失敗：第 '+(i+1)+' 位同事出手延遲';return;
}
unit.classList.remove('attack');void unit.offsetWidth;unit.classList.add('attack');
setTimeout(()=>unit.classList.remove('attack'),500/clock.pace);
const damage=7+((clock.allyTurn%3)===0?1:0);
setHp(clock.hp-damage);
let p=pointBoss(),n=piece('span','v2Dmg hero',p.x,p.y);
n.textContent='-'+(damage*11900).toLocaleString();
if(clock.allyTurn%7===0){
  allies.forEach((v,j)=>{
    if(v>0){
      const heal=v4Has(j,'paycut')?6:12;
      allies[j]=Math.min(100,v+heal);
      team[j].querySelector('.v2Health').style.width=allies[j]+'%';
    }
  });
}
if(clock.hp<=0)v5Victory();}
function restart(){++v3Token;++v5Epoch;v3Clean();v4ClearStatuses();clearInterval(bossTimer);clearInterval(allyTimer);Object.assign(clock,{energy:0,hp:165,maxHp:165,wave:1,rage:false,turn:0,allyTurn:0,pace:1,paused:false,done:false,busy:false,inUltimate:false});allies.fill(100);team.forEach(u=>{u.classList.remove('v2Down','v2Hit');u.querySelector('.v2Health').style.width='100%'});v5Complete.classList.remove('show');v5HideBanner();root.classList.remove('paused','v2Ult','v2Rage');frame.hidden=true;rig.hidden=false;plane.replaceChildren();label('地獄星期一｜四波副本・真正小怪先出場');v4Ribbon.textContent='Lv.85 測試隊伍｜小怪→精英→魔王';setHp(165);setEnergy(0);$('speed').textContent='倍速 ×1';$('pace').textContent='×1';$('pause').textContent='暫停';v5AdvanceToWave(1);run()}
function run(){clearInterval(bossTimer);clearInterval(allyTimer);bossTimer=setInterval(bossStep,2600/clock.pace);allyTimer=setInterval(partyStep,1100/clock.pace)}
for(let id of ['speed','pause','restart']){let old=$(id),newNode=old.cloneNode(true);old.replaceWith(newNode)}
$('speed').onclick=()=>{clock.pace=clock.pace===1?2:clock.pace===2?3:1;$('speed').textContent='倍速 ×'+clock.pace;$('pace').textContent='×'+clock.pace;run()};
$('pause').onclick=()=>{clock.paused=!clock.paused;root.classList.toggle('paused',clock.paused);$('pause').textContent=clock.paused?'繼續':'暫停'};
$('restart').onclick=restart;// V4 test hook is exposed only on the development URL.
const v3Demo=document.createElement('button');v3Demo.id='v3DevUlt';v3Demo.textContent='開發驗收｜立即展示大招';root.append(v3Demo);
if(new URLSearchParams(location.search).get('dev')==='1')document.body.classList.add('v3-dev');
v3Demo.onclick=()=>{if(clock.wave!==4||clock.busy||clock.done||clock.inUltimate)return;setEnergy(100);bossStep()};
import('./v19/s1-hell-monday-dungeon.mjs')
 .then(m=>{mondaySpec=m.HELL_MONDAY;mondaySpawn=m.spawnMondayWave;restart();})
 .catch(e=>{console.error('Monday wave loading failed',e);v5SetBanner('副本載入失敗',e.message);});

})();