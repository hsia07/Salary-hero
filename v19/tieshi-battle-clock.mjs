import * as tieshiRules from './tieshi-combat-rules.mjs';
window.__tieshiRules=tieshiRules;
import { tieshiClockTime } from './tieshi-clock.mjs';
/** V6.2 battle-facing visual proof of concept. No character art is replaced. */
const STYLE_ID='tieshi-battle-clock-style';
if(!document.getElementById(STYLE_ID)){
 const style=document.createElement('style');style.id=STYLE_ID;
 style.textContent=`#tieshi-clock{position:absolute;left:50%;top:-13px;transform:translateX(-50%);z-index:30;pointer-events:none;background:#100c19;border:2px solid #b58a47;border-radius:5px;padding:2px 4px;color:#f0d5ff;font:800 11px/1 monospace;letter-spacing:0;text-shadow:0 0 4px #b25dff;white-space:nowrap}#tieshi-clock.awakened{color:#fff0b1;border-color:#ffe09a;box-shadow:0 0 13px #f8b647}#tieshi-battle-dev{position:fixed;bottom:12px;right:12px;z-index:9999;background:#35283c;border:1px solid #ba985c;border-radius:8px;color:#fff0cf;padding:8px;font-size:11px}#tieshi-battle-note{position:fixed;bottom:51px;right:12px;z-index:9999;color:#ffe0a2;font-size:11px;background:#17101cbb;padding:4px;border-radius:4px}`;
 document.head.append(style);
}
const params=new URLSearchParams(location.search);
let biographyCleared=false,active=false;
let guardian=null,digits=null,dev=null,note=null;
function ensure(){
 const current=document.querySelector('.team-zone .unit[data-role="guardian"]')||document.querySelector('.team-zone .unit');
 if(!current)return false;
 if(current!==guardian){guardian=current;digits=document.createElement('span');digits.id='tieshi-clock';digits.setAttribute('aria-label','鐵時的終夜打卡盾時間');guardian.append(digits)}
 if(params.get('dev')==='1'&&!dev){dev=document.createElement('button');dev.id='tieshi-battle-dev';dev.type='button';dev.textContent='傳記：未通關';note=document.createElement('div');note.id='tieshi-battle-note';note.textContent='開發測試：切換傳記通關狀態';document.body.append(dev,note);dev.onclick=()=>{biographyCleared=!biographyCleared;dev.textContent='傳記：'+(biographyCleared?'已通關':'未通關');window.__salaryBossV5?.devTieshiBiography(biographyCleared);if(biographyCleared)window.__salaryBossV5?.devTieshiEnergy(100);else active=false;render()};const cast=document.createElement('button');cast.id='tieshi-cast-dev';cast.type='button';cast.textContent='鐵時覺醒';cast.style.cssText='position:fixed;bottom:90px;right:12px;z-index:9999;background:#68491d;color:#fff;border:1px solid #edb950;border-radius:8px;padding:8px;font-size:11px';cast.onclick=()=>{window.__salaryBossV5?.devTieshiEnergy(100);window.__salaryBossV5?.devTieshiCast()};document.body.append(cast)}
 return true;
}
function render(){if(!digits)return;const time=tieshiClockTime({biographyCleared,awakenedUltimateActive:active});digits.textContent=time;digits.classList.toggle('awakened',time==='09:00');if(note)note.textContent=active?'09:00 覺醒演出（測試）':'盾牌時鐘 '+time+'｜守衛攻擊觸發演出';}
function tick(){if(!ensure())return;const state=window.__salaryBossV5?.tieshiAwakening;if(state){biographyCleared=state.biographyCleared;active=state.activeUntil>0&&state.activeUntil>window.__salaryBossV5.skillTime}render()}
document.addEventListener('tieshi:awakened-ultimate:start',()=>{active=true;render()});
document.addEventListener('tieshi:awakened-ultimate:end',()=>{active=false;render()});
const ticker=setInterval(tick,80);
window.__tieshiBattleClockDev={get state(){return{biographyCleared,active,time:tieshiClockTime({biographyCleared,awakenedUltimateActive:active})}},setBiographyCleared(value){biographyCleared=Boolean(value);if(!biographyCleared)active=false;render()},stop(){clearInterval(ticker);dev?.remove();note?.remove();digits?.remove()}};
