import {BattleState} from './battle-state.mjs';
import {preloadArt} from './art-loader.mjs';
import {animationFrame, SALARYMAN_ANIMATIONS} from './salaryman-animation.mjs';
const canvas=document.querySelector('#battle');
const ctx=canvas.getContext('2d');
const status=document.querySelector('#status');
const wave=document.querySelector('#wave');
const gold=document.querySelector('#gold');
const hp=document.querySelector('#hp');
const toggle=document.querySelector('#toggle');
const speed=document.querySelector('#speed');
const attack=document.querySelector('#attack');
let characterFrames=null;
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
async function loadOptionalCharacterFrames(){
 const root=new URL('../art/v18/runtime/hero/frames/',import.meta.url);
 const loaded=new Map();
 const names=[...new Set(Object.values(SALARYMAN_ANIMATIONS).flatMap(animation=>animation.frames))];
 try{
  for(const name of names){
   const response=await fetch(new URL(name+'.webp',root),{cache:'no-store'});
   if(!response.ok)return null;
   const image=await createImageBitmap(await response.blob());
   if(!image.width||!image.height){image.close?.();return null;}
   loaded.set(name,image);
  }
  return loaded;
 }catch(error){
  console.warn('Optional salaryman frames unavailable:',error);
  return null;
 }finally{
  if(loaded.size!==names.length)for(const image of loaded.values())image.close?.();
 }
}
function paint(now){
 if(!active)return;
 frame=requestAnimationFrame(paint);
 if(!art)return;
 const W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);
 // Portrait composition: office 0–29%, arena 29–78%, controls live in DOM below.
 const officeH=Math.round(H*.29), arenaH=H-officeH;
 sprite('office.background',0,0,W,officeH);
 const deskBob=Math.sin(now/850)*1.5;
 sprite('office.sleepingHero',W*.29,officeH*.24+deskBob,W*.43,officeH*.67);
 sprite('office.cat',W*.72,officeH*.52,W*.2,officeH*.33);
 sprite('battleBackground.path',0,officeH,W,arenaH);
 ctx.save();ctx.translate(0,officeH);ctx.scale(W/600,arenaH/420);
 const t=(now-phaseAt)/1000;
 const bob=Math.sin(now/280)*3;
 const heroX=phase==='attack'?125+Math.min(Math.max(t,0)/.18,1)*85:125;
 const enemyX=now>=impactAt&&now-impactAt<250?400+Math.sin(now/32)*7:400;
 const heroPose=phase==='attack'?'hero.attack':phase==='victory'?'hero.victory':phase==='hurt'?'hero.hurt':'hero.idle';
 const frameAction=phase==='attack'?'attack':phase==='hurt'?'hurt':phase==='victory'?'sleep':'idle';
 const chosen=characterFrames?.get(animationFrame(frameAction,now-phaseAt));
 if(chosen)ctx.drawImage(chosen,heroX,175+bob,145,190);
 else sprite(heroPose,heroX,175+bob,145,190);
 if(now<defeatUntil){ctx.save();ctx.globalAlpha=Math.max(0,(defeatUntil-now)/450);sprite('enemy.defeat',enemyX,180,155,170);ctx.restore();}else{sprite(now>=impactAt&&now-impactAt<250?'enemy.hurt':'enemy.idle',enemyX,180,155,170);}
 if(phase==='attack'&&t<.35)sprite('effects.slash',heroX+95,175,195,185);
 if(now>=impactAt&&now-impactAt<280)sprite('effects.impact',enemyX-25,205,130,130);
 if(phase!=='idle'&&t>.52){phase='idle';phaseAt=now;}
 ctx.restore();
 if(game.state.enabled&&now-lastTick>1100/game.state.speed&&now>=defeatUntil){
  lastTick=now;strike(now);
 }
}
function strike(now=performance.now()){
 if(!art||now<defeatUntil)return;
 const prev=game.state.kills;
 game.tick({manual:true});
 const defeated=game.state.kills>prev;
 phase=defeated?'victory':'attack';
 phaseAt=now;impactAt=now+160;
 if(defeated)defeatUntil=now+600;
}
toggle.onclick=()=>game.setAuto(!game.state.enabled);
speed.onclick=()=>game.setSpeed(game.state.speed===1?2:1);
attack.onclick=()=>strike();
document.querySelector('#equip').onchange=e=>game.equip(e.target.value);
renderHud(game.state);
try{
 art=await preloadArt();
 characterFrames=await loadOptionalCharacterFrames();
 status.textContent=characterFrames?'已載入 13 張基礎素材與 11 張社畜動畫影格；V18 測試版。':'已載入 13 張基礎素材；社畜動畫影格尚未齊全，沿用原分層角色。';
 status.dataset.ready='true';
 frame=requestAnimationFrame(paint);
}catch(error){
 status.textContent='無法啟動美術戰鬥：'+error.message+'。禁止使用完整母版或假角色替代。';
 toggle.disabled=speed.disabled=attack.disabled=document.querySelector('#equip').disabled=true;
}
window.addEventListener('pagehide',()=>{active=false;cancelAnimationFrame(frame);art?.dispose();for(const image of characterFrames?.values()??[])image.close?.()},{once:true});
