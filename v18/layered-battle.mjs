import {BattleState} from './battle-state.mjs';
import {preloadArt} from './art-loader.mjs';
const canvas=document.querySelector('#battle');
const ctx=canvas.getContext('2d');
const status=document.querySelector('#status');
const wave=document.querySelector('#wave');
const gold=document.querySelector('#gold');
const hp=document.querySelector('#hp');
const toggle=document.querySelector('#toggle');
const speed=document.querySelector('#speed');
const attack=document.querySelector('#attack');
let art=null,active=true,phase='idle',phaseAt=0,impactAt=0,frame=0,lastTick=0,defeatUntil=0;
const game=new BattleState({onChange:renderHud});
function renderHud(s){
 wave.textContent=s.wave;gold.textContent=s.gold;hp.textContent=Math.round(s.hero.hp/s.hero.maxHp*100)+'%';
 toggle.textContent=s.enabled?'自動戰鬥：開':'自動戰鬥：關';
 speed.textContent='速度：'+s.speed+'×';
}
function sprite(key,x,y,w,h){
 const image=art.images.get(key);
 if(!image)throw Error('Missing preloaded sprite: '+key);
 ctx.drawImage(image,x,y,w,h);
}
function paint(now){
 if(!active)return;
 frame=requestAnimationFrame(paint);
 if(!art)return;
 const W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);
 sprite('battleBackground.path',0,0,W,H);
 const t=(now-phaseAt)/1000;
 const bob=Math.sin(now/280)*3;
 const heroX=phase==='attack'?125+Math.min(t/.18,1)*85:125;
 const enemyX=now>=impactAt&&now-impactAt<250?400+Math.sin(now/32)*7:400;
 const heroPose=phase==='attack'?'hero.attack':phase==='victory'?'hero.victory':phase==='hurt'?'hero.hurt':'hero.idle';
 sprite(heroPose,heroX,175+bob,145,190);
 if(now<defeatUntil){ctx.save();ctx.globalAlpha=Math.max(0,(defeatUntil-now)/450);sprite('enemy.defeat',enemyX,180,155,170);ctx.restore();}else{sprite(now>=impactAt&&now-impactAt<250?'enemy.hurt':'enemy.idle',enemyX,180,155,170);}
 if(phase==='attack'&&t<.35)sprite('effects.slash',heroX+95,175,195,185);
 if(now>=impactAt&&now-impactAt<280)sprite('effects.impact',enemyX-25,205,130,130);
 if(phase!=='idle'&&t>.52){phase='idle';phaseAt=now;}
 if(game.state.enabled&&now-lastTick>1100/game.state.speed&&now>=defeatUntil){
  lastTick=now;strike(now);
 }
}
function strike(now=performance.now()){
 const prev=game.state.kills;
 game.tick({manual:true});
 const defeated=game.state.kills>prev;
 phase=defeated?'victory':'attack';
 phaseAt=now;impactAt=now+160;
 if(defeated)defeatUntil=now+450;
}
toggle.onclick=()=>game.setAuto(!game.state.enabled);
speed.onclick=()=>game.setSpeed(game.state.speed===1?2:1);
attack.onclick=()=>strike();
document.querySelector('#equip').onchange=e=>game.equip(e.target.value);
renderHud(game.state);
try{
 art=await preloadArt();
 status.textContent='13 張獨立素材已載入。此頁為獨立動畫整合測試，尚未取代 V17 正式版。';
 status.dataset.ready='true';
 frame=requestAnimationFrame(paint);
}catch(error){
 status.textContent='無法啟動美術戰鬥：'+error.message+'。禁止使用完整母版或假角色替代。';
 toggle.disabled=speed.disabled=attack.disabled=document.querySelector('#equip').disabled=true;
}
window.addEventListener('pagehide',()=>{active=false;cancelAnimationFrame(frame);art?.dispose()},{once:true});
