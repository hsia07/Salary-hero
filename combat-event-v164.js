(()=>{'use strict';function start(){const stage=document.querySelector('#v150Stage'),hero=document.getElementById('heroActor'),enemy=document.getElementById('mobActor');if(!stage||!hero||!enemy)return false;
const style=document.createElement('style');style.textContent=`
#home #v150Stage .v164-damage{position:absolute;top:30%;right:17%;z-index:30;color:#fff5c8;font:900 25px system-ui;text-shadow:2px 2px #451c3c,0 0 12px #eabb69;pointer-events:none;animation:v164-float .75s ease-out forwards}
#home #v150Stage .v164-damage.critical{color:#ffcf6c;font-size:31px}
#home #v150Stage .v164-damage.ally{right:auto;left:15%;color:#ff8b94}
#home #v150Stage .v164-strike{position:absolute;top:22%;left:37%;width:35%;height:60%;z-index:25;pointer-events:none;animation:v164-slash .42s ease-out forwards}
#home #v150Stage .v164-strike:before{content:'';position:absolute;left:35%;top:0;width:16%;height:95%;border-radius:50%;background:linear-gradient(90deg,transparent,#fff7ca,#80e8ff,transparent);transform:rotate(42deg);box-shadow:0 0 18px #a8e7ff}
@keyframes v164-float{0%{opacity:0;transform:translateY(15px) scale(.7)}25%{opacity:1}100%{opacity:0;transform:translateY(-48px) scale(1.15)}}
@keyframes v164-slash{0%{opacity:0;transform:scale(.5) rotate(-30deg)}25%{opacity:1}100%{opacity:0;transform:scale(1.25) rotate(25deg)}}
@media(prefers-reduced-motion:reduce){#home #v150Stage .v164-damage,#home #v150Stage .v164-strike{animation:none!important;opacity:1}}
`;document.head.append(style);
let events=0;const flash=(el,klass,ms)=>{el.classList.remove(klass);void el.offsetWidth;el.classList.add(klass);setTimeout(()=>el.classList.remove(klass),ms)};
const effect=(type,damage,critical)=>{const el=document.createElement('span');el.className='v164-damage'+(critical?' critical':'')+(type==='heroHurt'||type==='heroDown'?' ally':'');el.textContent=(critical?'暴擊 ':'')+'−'+Math.round(damage||0);stage.append(el);setTimeout(()=>el.remove(),850)};
const hit=()=>{const slash=document.createElement('div');slash.className='v164-strike';stage.append(slash);setTimeout(()=>slash.remove(),500)};
window.addEventListener('salaryhero:combat',e=>{const d=e.detail||{};events++;
if(d.type==='attack'){flash(hero,'v16-attack',450);flash(enemy,'v16-hurt',480);hit();effect(d.type,d.damage,d.critical);if(d.defeated)setTimeout(()=>flash(enemy,'v16-down',700),170)}
if(d.type==='heroHurt'||d.type==='heroDown'){flash(hero,'v16-hurt',450);effect(d.type,d.damage,false)}
const label=stage.querySelector('.v162-gear');if(label&&d.equipped){const w=d.equipped['武器'];if(w)label.title=w.name||''}
});
stage.dataset.combatEvents='authoritative';const ver=document.querySelector('.v150-version');if(ver)ver.textContent='V16.4 · 真實傷害事件連動';return true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!start()){let i=0,t=setInterval(()=>{if(start()||++i>25)clearInterval(t)},300)}});else if(!start()){let i=0,t=setInterval(()=>{if(start()||++i>25)clearInterval(t)},300)}
})();