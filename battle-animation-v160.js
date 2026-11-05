(()=>{'use strict';
function boot(){const stage=document.getElementById('adventureStage'),hero=document.getElementById('heroActor'),mob=document.getElementById('mobActor');if(!stage||!hero||!mob)return;
const css=document.createElement('style');css.textContent=`
#home #adventureStage .hero-actor,#home #adventureStage .mob-actor{transition:filter .16s ease;transform-origin:50% 85%}
#home #adventureStage .hero-actor.v16-attack{animation:v16-attack .42s cubic-bezier(.2,.6,.2,1) 1!important}
#home #adventureStage .mob-actor.v16-hurt{animation:v16-hurt .45s ease-out 1!important}
#home #adventureStage .mob-actor.v16-down{animation:v16-down .65s ease-in 1!important}
#home #adventureStage .hero-actor.v16-hurt{animation:v16-hero-hurt .4s ease-out 1!important}
#home #adventureStage .v16-impact{position:absolute;left:55%;top:33%;font-size:52px;z-index:8;pointer-events:none;animation:v16-impact .42s ease-out forwards;text-shadow:0 0 16px #ffe39b}
@keyframes v16-attack{0%{transform:translateX(0) rotate(0)}35%{transform:translateX(17%) rotate(-9deg)}60%{transform:translateX(48%) rotate(9deg)}100%{transform:translateX(0) rotate(0)}}
@keyframes v16-hurt{0%{transform:translateX(0);filter:brightness(1)}25%{transform:translateX(13%);filter:brightness(3) sepia(1)}55%{transform:translateX(-6%);filter:brightness(1.8)}100%{transform:translateX(0);filter:brightness(1)}}
@keyframes v16-down{0%{transform:rotate(0) scale(1);opacity:1}100%{transform:translateY(30%) rotate(65deg) scale(.7);opacity:.05}}
@keyframes v16-hero-hurt{30%{transform:translateX(-14%);filter:brightness(2)}100%{transform:translateX(0);filter:brightness(1)}}
@keyframes v16-impact{0%{transform:scale(.4) rotate(-25deg);opacity:0}35%{opacity:1}100%{transform:scale(1.8) rotate(25deg);opacity:0}}
@media(prefers-reduced-motion:reduce){#home #adventureStage .hero-actor,#home #adventureStage .mob-actor,#home #adventureStage .v16-impact{animation:none!important}}
`;document.head.append(css);
let previousKills=null,previousHp=null,previousWave=null,previousStatus=null,lastAttack=0,active=true;
const readNumber=id=>{const e=document.getElementById(id);if(!e)return null;const n=Number((e.textContent||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null};
const pulse=(el,cls,duration)=>{el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),duration)};
const hit=()=>{if(!active)return;const now=Date.now();if(now-lastAttack<330)return;lastAttack=now;pulse(hero,'v16-attack',460);pulse(mob,'v16-hurt',500);const fx=document.createElement('span');fx.className='v16-impact';fx.textContent='⚡';stage.append(fx);setTimeout(()=>fx.remove(),460)};
const down=()=>{if(active)pulse(mob,'v16-down',700)};
const tick=()=>{if(stage.parentElement?.dataset.combatEvents==='authoritative'||document.querySelector('#v150Stage[data-combat-events="authoritative"]'))return;const kills=readNumber('kills'),wave=document.getElementById('stageWave')?.textContent||'',status=document.getElementById('stageStatus')?.textContent||'',hp=document.getElementById('stageEnemyHp');const hpVal=hp?Math.round(hp.getBoundingClientRect().width*10)/10:null;
if(previousKills!==null&&kills!==null&&kills>previousKills){hit();setTimeout(down,140)}
else if(previousHp!==null&&hpVal!==null&&hpVal<previousHp-2){hit()}
else if(previousWave!==null&&wave!==previousWave&&/戰|攻|討伐|冒險/.test(status)){hit()}
if(previousStatus!==null&&status!==previousStatus&&/受傷|受擊|遭受/.test(status))pulse(hero,'v16-hurt',450);
previousKills=kills;previousHp=hpVal;previousWave=wave;previousStatus=status;
};
const toggle=document.getElementById('stageToggle');if(toggle)toggle.addEventListener('click',()=>{active=!/暫停/.test(toggle.textContent||'')},false);
tick();setInterval(tick,170);
window.salaryHeroArtEvents={attack:hit,hurt:()=>pulse(hero,'v16-hurt',450),defeat:down};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();