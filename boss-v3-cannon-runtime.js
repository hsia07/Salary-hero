(()=>{
'use strict';
if(!document.querySelector('#bossRig')||window.__salaryBossV2)return;window.__salaryBossV2=true;
clearInterval(combatTicker);if(frameTicker)clearInterval(frameTicker);if(stateTimer)clearTimeout(stateTimer);
const $=id=>document.getElementById(id),root=$('game'),rig=$('bossRig'),frame=$('bossFrame'),zone=$('bossZone'),team=[...document.querySelectorAll('.team-zone .unit')];
const bar=document.createElement('div');bar.id='bossEnergyHud';bar.innerHTML='<div class="energy-words"><span>魔力／怒氣</span><span id="energyText">0 / 100</span></div><div class="energy-track"><div id="energyFill"></div></div>';document.querySelector('.hud').append(bar);
const plane=document.createElement('div');plane.id='v2Plane';root.append(plane);const warning=document.createElement('div');warning.id='v2Warning';root.append(warning);
const status=document.createElement('div');status.id='v2Status';status.textContent='全程自動交戰｜Boss 怒氣大招';root.append(status);
document.querySelector('.footer .hint').textContent='終極加班砲：全隊預警 → 巨型魔砲蓄力 → 實際命中 → 加班灼燒；七人仍使用暫用角色素材';
const positions=[[18,62],[50,64],[82,62],[18,19],[50,21],[82,19],[50,76]];
const allies=Array(7).fill(100);team.forEach((u,i)=>{u.style.left=positions[i][0]+'%';u.style.top=positions[i][1]+'%';u.querySelector('.hp').innerHTML='<i class="v2Health"></i>'});
const clock={energy:0,hp:100,wave:1,rage:false,turn:0,pace:1,paused:false,done:false,busy:false,inUltimate:false};
let bossTimer,allyTimer;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms/clock.pace));
function center(el){let a=el.getBoundingClientRect(),g=root.getBoundingClientRect();return{x:a.left+a.width/2-g.left,y:a.top+a.height*.6-g.top}}
function pointBoss(){let a=zone.getBoundingClientRect(),g=root.getBoundingClientRect();return{x:a.left+a.width*.55-g.left,y:a.top+a.height*.68-g.top}}
function piece(tag,cls,x,y,url){const e=document.createElement(tag);e.className=cls;e.style.left=x+'px';e.style.top=y+'px';if(url)e.src=url;plane.append(e);setTimeout(()=>e.remove(),1100/clock.pace);return e}
function setEnergy(v){clock.energy=Math.max(0,Math.min(100,v));$('energyFill').style.width=clock.energy+'%';$('energyText').textContent=Math.round(clock.energy)+' / 100'}
function setHp(v){clock.hp=Math.max(0,v);hpFill.style.width=clock.hp+'%';hpText.textContent=Math.round(clock.hp)+'%';if(!clock.rage&&clock.hp<=60){clock.rage=true;root.classList.add('v2Rage');warning.textContent='狂暴化｜加班永無止境';warning.classList.add('active');setTimeout(()=>warning.classList.remove('active'),850);setEnergy(clock.energy+20)}}
function label(t,on=false){warning.textContent=t;warning.classList.toggle('active',on);status.textContent=t}
function ring(i,ult){const p=center(team[i]);let e=piece('div','v2Ring'+(ult?' ult':''),p.x,p.y);setTimeout(()=>e.remove(),1100/clock.pace)}
function flash(i,amt,heavy=false){if(allies[i]<=0)return;let unit=team[i],p=center(unit);piece('img','v2Slash',p.x,p.y-10,ART.parts.slash_fx);let n=piece('span','v2Dmg',p.x,p.y-20);n.textContent='-'+(amt*630).toLocaleString();allies[i]=Math.max(0,allies[i]-amt);unit.querySelector('.v2Health').style.width=allies[i]+'%';unit.classList.remove('v2Hit');void unit.offsetWidth;unit.classList.add('v2Hit');setTimeout(()=>unit.classList.remove('v2Hit'),580/clock.pace);if(!allies[i])unit.classList.add('v2Down')}
function shake(big=false){root.classList.remove('v2Shake','v2UltShake');void root.offsetWidth;root.classList.add(big?'v2UltShake':'v2Shake');setTimeout(()=>root.classList.remove('v2Shake','v2UltShake'),big?700:360)}
function effectTravel(i){let from=pointBoss(),to=center(team[i]);let dx=to.x-from.x,dy=to.y-from.y;let path=piece('div','v2Trail',from.x,from.y);path.style.width=Math.hypot(dx,dy)+'px';path.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';let p=piece('img','v2Paper',from.x,from.y,ART.parts.paper_stack);p.animate([{transform:'translate(-50%,-50%) scale(.12) rotate(-15deg)'},{transform:'translate('+(dx-40)+'px,'+(dy-40)+'px) scale(.38) rotate(290deg)'}],{duration:540/clock.pace,easing:'ease-in',fill:'forwards'})}
function available(list){return list.filter(i=>allies[i]>0)}
async function normal(){let variant=clock.turn%5;let target=variant===2?available([0,1,2]):available([0,1,2,3,4,5,6]).slice(0,1);if(!target.length)return;label(variant===2?'橫掃公文爪':variant===4?'牛角突頂':'巨爪拍擊');target.forEach(i=>ring(i,false));sequence('attack',110);await pause(310);if(clock.paused||clock.done)return;target.forEach(effectTravel);await pause(560);if(clock.paused||clock.done)return;target.forEach(i=>flash(i,variant===4?22:variant===2?12:17));shake(variant===4);setEnergy(clock.energy+26+(clock.rage?9:0))}
async function bombard(){label('文件轟炸｜全員警戒');const target=available([0,1,2,3,4,5,6]);target.forEach(i=>{ring(i,false);effectTravel(i)});sequence('attack',100);await pause(700);if(clock.paused||clock.done)return;target.forEach((i,k)=>setTimeout(()=>flash(i,7),k*58/clock.pace));shake();setEnergy(clock.energy+21+(clock.rage?9:0))}

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
    const reach=Math.min(1,elapsed/285);
    const ex=sx+(endX-sx)*reach,ey=sy+(endY-sy)*reach;
    const flare=(.78+.22*Math.sin(elapsedS*38))*(1-Math.max(0,p-.84)*2.8);
    const vector=v3ctx.createLinearGradient(sx,sy,endX,endY);
    vector.addColorStop(0,'#fff3ba');vector.addColorStop(.23,'#ffb3b3');vector.addColorStop(.73,'#ff447f');vector.addColorStop(1,'#ffe8c0');
    ctx.globalAlpha=.66*flare;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);
    ctx.strokeStyle='#e63183';ctx.shadowBlur=37;ctx.shadowColor='#f4216c';ctx.lineWidth=W*.66;ctx.lineCap='round';ctx.stroke();
    ctx.globalAlpha=.85*flare;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);
    ctx.strokeStyle='#ff658f';ctx.shadowBlur=25;ctx.shadowColor='#ffcfb0';ctx.lineWidth=W*.39;ctx.stroke();
    ctx.globalAlpha=1*flare;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);
    ctx.strokeStyle=vector;ctx.shadowBlur=12;ctx.shadowColor='#ffe8ba';ctx.lineWidth=W*.20;ctx.stroke();
    ctx.globalAlpha=.97*flare;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);
    ctx.strokeStyle='#fffcea';ctx.shadowBlur=6;ctx.shadowColor='#fffbd9';ctx.lineWidth=W*.059;ctx.stroke();
    ctx.globalAlpha=.78*flare;ctx.lineWidth=2.8;ctx.strokeStyle='#ffe1c1';ctx.shadowBlur=9;
    for(let n=0;n<5;n++)v3Trace(sx+(n-2)*9,sy,ex+(n-2)*18,ey,elapsed,n);
    if(reach>.68){
      const rad=20+(elapsedS*23%60);ctx.globalAlpha=.65*flare;
      ctx.strokeStyle='#ffebba';ctx.lineWidth=4;
      ctx.beginPath();ctx.ellipse(endX,endY,rad*3.2,rad*.86,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=.6*flare;ctx.strokeStyle='#ff8ba6';ctx.lineWidth=5;
      living.forEach((q,i)=>{ctx.beginPath();ctx.moveTo(endX,endY);ctx.lineTo(q.x,q.y);ctx.stroke();});
      ctx.globalAlpha=.9*flare;
      for(let i=0;i<32;i++){
        const a=i*2.39996+elapsedS*.2,r=(30+((i*39+elapsed*.31)%165));
        const x=endX+Math.cos(a)*r,y=endY+Math.sin(a)*r*.45;
        ctx.fillStyle=i%3===0?'#fff2c0':'#ff4d83';ctx.save();ctx.translate(x,y);ctx.rotate(a+elapsedS*3);
        ctx.fillRect(-2,-5,4,10);ctx.restore();
      }
    }
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
  label('魔王必殺・無限加班殲滅砲',true);
  root.classList.add('v2Ult');
  rig.classList.add('charging');
  v3Targets(targets);
  let hit=false,burn=false;
  try{
    v3Countdown.textContent='危險！七人全體鎖定';
    if(!await v3Play('warning',830,targets))return;
    if(myToken!==v3Token)return;
    v3Countdown.textContent='魔砲充能中 · 不可解除鎖定';
    sequence('attack',125);
    if(!await v3Play('charge',1250,targets))return;
    if(myToken!==v3Token)return;
    label('無限加班殲滅砲｜發射！',false);
    root.classList.add('v3CannonRecoil');
    v3Countdown.textContent='';
    if(!await v3Play('fire',1330,targets,(elapsed)=>{
      if(elapsed>=535&&!hit&&myToken===v3Token){
        hit=true;
        root.classList.remove('v3CannonImpact');void root.offsetWidth;
        root.classList.add('v3CannonImpact');
        v3Flash.classList.remove('on');void v3Flash.offsetWidth;v3Flash.classList.add('on');
        targets.forEach(i=>flash(i,clock.rage?34:27,true));
        shake(true);
      }
    }))return;
    if(myToken!==v3Token)return;
    label('燃燒的加班災域｜持續灼燒',false);
    if(!await v3Play('aftermath',1600,targets,(elapsed)=>{
      if(elapsed>=650&&!burn&&myToken===v3Token){
        burn=true;
        targets.filter(i=>allies[i]>0).forEach(i=>flash(i,clock.rage?6:4,false));
      }
    }))return;
    setEnergy(0);
  }finally{
    if(myToken===v3Token){rig.classList.remove('charging');root.classList.remove('v2Ult');v3Clean()}
    clock.inUltimate=false;
  }
}
async function bossStep(){if(clock.paused||clock.busy||clock.done)return;clock.busy=true;try{clock.turn++;if(clock.energy>=100)await ultimate();else if(clock.turn%4===0)await bombard();else await normal();if(clock.energy>=100&&!clock.paused&&!clock.done)await ultimate()}finally{clock.busy=false}}
function partyStep(){if(clock.paused||clock.done||clock.inUltimate)return;const living=available([0,1,2,3,4,5,6]);if(!living.length){clock.done=true;label('隊伍全滅｜請重新挑戰');return}let i=living[clock.turn%living.length],unit=team[i];unit.classList.remove('attack');void unit.offsetWidth;unit.classList.add('attack');setTimeout(()=>unit.classList.remove('attack'),500/clock.pace);
let damage=1+Math.round(Math.random());setHp(clock.hp-damage);let p=pointBoss(),n=piece('span','v2Dmg hero',p.x,p.y);n.textContent='-'+(damage*11900).toLocaleString();
if(clock.turn%7===0)allies.forEach((v,i)=>{if(v>0){allies[i]=Math.min(100,v+8);team[i].querySelector('.v2Health').style.width=allies[i]+'%'}});
if(clock.hp===0){if(clock.wave<4){clock.wave++;clock.rage=false;root.classList.remove('v2Rage');clock.hp=100;setHp(100);setEnergy(0);$('wave').textContent='第 '+clock.wave+' / 4 波';label('第 '+clock.wave+' 波・自動推進')}else{clock.done=true;clearInterval(bossTimer);clearInterval(allyTimer);$('wave').textContent='通關';label('地獄星期一｜挑戰成功')}}}
function restart(){++v3Token;v3Clean();clearInterval(bossTimer);clearInterval(allyTimer);Object.assign(clock,{energy:0,hp:100,wave:1,rage:false,turn:0,pace:1,paused:false,done:false,busy:false,inUltimate:false});allies.fill(100);team.forEach(u=>{u.classList.remove('v2Down','v2Hit');u.querySelector('.v2Health').style.width='100%'});root.classList.remove('paused','v2Ult','v2Rage');frame.hidden=true;rig.hidden=false;plane.replaceChildren();label('七人自動戰鬥｜怒氣滿自動發射無限加班殲滅砲');$('wave').textContent='第 1 / 4 波';setHp(100);setEnergy(0);$('speed').textContent='倍速 ×1';$('pace').textContent='×1';$('pause').textContent='暫停';run()}
function run(){clearInterval(bossTimer);clearInterval(allyTimer);bossTimer=setInterval(bossStep,2600/clock.pace);allyTimer=setInterval(partyStep,1100/clock.pace)}
for(let id of ['speed','pause','restart']){let old=$(id),newNode=old.cloneNode(true);old.replaceWith(newNode)}
$('speed').onclick=()=>{clock.pace=clock.pace===1?2:clock.pace===2?3:1;$('speed').textContent='倍速 ×'+clock.pace;$('pace').textContent='×'+clock.pace;run()};
$('pause').onclick=()=>{clock.paused=!clock.paused;root.classList.toggle('paused',clock.paused);$('pause').textContent=clock.paused?'繼續':'暫停'};
$('restart').onclick=restart;const v3Demo=document.createElement('button');v3Demo.id='v3DevUlt';v3Demo.textContent='開發驗收｜立即展示大招';root.append(v3Demo);
if(new URLSearchParams(location.search).get('dev')==='1')document.body.classList.add('v3-dev');
v3Demo.onclick=()=>{if(clock.busy||clock.done||clock.inUltimate)return;setEnergy(100);bossStep()};
restart();
})();