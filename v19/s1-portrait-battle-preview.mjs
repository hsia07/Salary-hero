import {MONDAY_SCENE,buildBattleScene} from './s1-portrait-battle-scene.mjs';
const root=document.querySelector('#battle-stage');
const rosterA=['guard','fighter','assassin','caster','healer','engineer'];
const rosterB=['engineer','assassin','healer','guard','caster','fighter'];
const catalogue={
 guard:{name:'打卡守衛'},fighter:{name:'逃班鬥士'},assassin:{name:'截止日刺客'},
 caster:{name:'試算表法師'},healer:{name:'咖啡醫官'},engineer:{name:'機械工程師'}
};
let roster=0,flipped=false,playing=false,round=0;
let timer=null;
const img=(src,alt)=>{const el=document.createElement('img');el.src=src;el.alt=alt;el.draggable=false;return el};
const sceneEl=document.createElement('div');sceneEl.className='battle-world';root.append(sceneEl);
const background=document.createElement('div');background.className='world-background';background.style.backgroundImage=`linear-gradient(180deg,#200b21a8,#1a09169c),url("${MONDAY_SCENE.layers[0].src}")`;sceneEl.append(background);
const atmosphere=document.createElement('div');atmosphere.className='world-atmosphere';sceneEl.append(atmosphere);
const floor=document.createElement('div');floor.className='world-floor';sceneEl.append(floor);
const actors=document.createElement('div');actors.className='world-actors';sceneEl.append(actors);
const flash=document.createElement('div');flash.className='world-flash';sceneEl.append(flash);
const banner=document.createElement('div');banner.className='world-banner';banner.textContent='地獄星期一 · BOSS 戰';sceneEl.append(banner);
const bossHp=document.querySelector('#boss-hp');
let health=100;
function formation(){
 const arr=[...(roster?rosterB:rosterA)];
 if(flipped)return [...arr.slice(3),...arr.slice(0,3)];
 return arr;
}
function render(){
 const form=formation().map(id=>({id,...catalogue[id]}));
 const state=buildBattleScene({formation:form});
 actors.replaceChildren();
 const enemy=document.createElement('div');enemy.className='world-boss';enemy.dataset.actorId=state.enemy.id;
 enemy.append(img(state.enemy.src,'獨立敵方角色素材'));const enemyLabel=document.createElement('span');enemyLabel.textContent='截止日魔鐘';enemy.append(enemyLabel);actors.append(enemy);
 state.units.forEach((unit)=>{
  const a=document.createElement('div');a.className='world-unit '+unit.kind;a.dataset.actorId=unit.id;a.dataset.slot=unit.slot;
  a.style.left=(unit.x*100)+'%';a.style.top=(unit.y*100)+'%';a.style.zIndex=String(Math.round(unit.y*100));
  const body=document.createElement('div');body.className='world-body';
  if(unit.src){const sprite=img(unit.src,catalogue[unit.id]?.name||'薪奴');sprite.onerror=()=>{sprite.remove();body.classList.add('no-art');body.textContent='素材待製'};body.append(sprite)}
  else{body.classList.add('no-art');body.textContent='素材待製'}
  const name=document.createElement('small');name.textContent=catalogue[unit.id]?.name||'薪奴';a.append(body,name);actors.append(a);
 });
 document.querySelector('#team-status').textContent=(roster?'替補':'先發')+' · 6 位同事 + 薪奴';
}
function hit(){
 if(playing)return;playing=true;round++;
 const units=[...actors.querySelectorAll('.world-unit')];
 const attacker=units[(round-1)%units.length];
 const boss=actors.querySelector('.world-boss');
 attacker.classList.add('charging');boss.classList.add('hit');
 flash.classList.remove('pulse');void flash.offsetWidth;flash.classList.add('pulse');
 const damage=390+round*71;health=Math.max(0,health-3.7);bossHp.style.width=health+'%';
 document.querySelector('#damage-text').textContent='-'+damage.toLocaleString();
 document.querySelector('#damage-text').classList.remove('show');void document.querySelector('#damage-text').offsetWidth;document.querySelector('#damage-text').classList.add('show');
 setTimeout(()=>{attacker.classList.remove('charging');boss.classList.remove('hit');playing=false;if(health<=0){health=100;bossHp.style.width='100%'}},750);
}
document.querySelector('#swap').onclick=()=>{flipped=!flipped;render()};
document.querySelector('#roster').onclick=()=>{roster=1-roster;render()};
document.querySelector('#attack').onclick=hit;
document.querySelector('#auto').onclick=(e)=>{const b=e.currentTarget;const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));if(timer)clearInterval(timer);timer=on?setInterval(hit,1400):null};
render();