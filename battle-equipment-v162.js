(()=>{'use strict';
const KEY='salary-hero-v51',RAR=['普通','精良','稀有','史詩','傳說','神話'],COLORS=['#c4c7cf','#70d9de','#8f9fff','#c78bff','#ffbb65','#fff0a5'];
const $=s=>document.querySelector(s);
function init(){const stage=$('#v150Stage'),hero=$('#heroActor'),mob=$('#mobActor');if(!stage||!hero||!mob)return false;
const css=document.createElement('style');css.textContent=`
#home #v150Stage{--v162-rarity:#c4c7cf}
#home #v150Stage .v162-gear{position:absolute;bottom:6%;left:3%;z-index:9;padding:4px 7px;border:1px solid var(--v162-rarity);border-radius:8px;background:#1b1529e8;color:var(--v162-rarity);font-size:11px;max-width:46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 0 5px #000}
#home #v150Stage .hero-actor{filter:drop-shadow(0 5px 8px #0009) drop-shadow(0 0 12px var(--v162-rarity))!important}
#home #v150Stage .v162-skill{position:absolute;left:47%;top:28%;z-index:12;pointer-events:none;font-size:42px;color:var(--v162-rarity);filter:drop-shadow(0 0 8px var(--v162-rarity));animation:v162-skill .52s ease-out both}
#home #v150Stage .v162-skill:before{content:'✧';position:absolute;left:-20px;top:-12px;font-size:22px}
@keyframes v162-skill{0%{opacity:0;transform:scale(.25) rotate(-40deg)}30%{opacity:1;transform:scale(1.2) rotate(0)}100%{opacity:0;transform:scale(1.8) rotate(40deg)}}
#home #v150Stage .v162-weapon{position:absolute;right:0;bottom:19%;width:23px;height:65px;transform:rotate(27deg);z-index:8;filter:drop-shadow(0 0 7px var(--v162-rarity));pointer-events:none}
#home #v150Stage .v162-weapon svg{width:100%;height:100%}
@media(prefers-reduced-motion:reduce){#home #v150Stage .v162-skill{animation:none!important;opacity:1}}
`;document.head.append(css);
const gear=document.createElement('span');gear.className='v162-gear';stage.append(gear);
const weapon=document.createElement('div');weapon.className='v162-weapon';hero.append(weapon);
let equipped={},lastSignature='',lastKills=null,lastHp=null,fxAt=0,weaponType='劍',rarity=0;
const icons={劍:'<path d="M12 4L19 0L23 8L17 52L10 54L7 48Z" fill="#e6f5ff" stroke="#9ad5ed" stroke-width="3"/><path d="M0 53L27 48" stroke="#e9b66c" stroke-width="8"/><path d="M13 52L16 78" stroke="#774653" stroke-width="8"/>',法杖:'<path d="M12 22L16 80" stroke="#986a55" stroke-width="8"/><circle cx="11" cy="13" r="13" fill="#7be6ff" stroke="#f1c26c" stroke-width="5"/>',弓:'<path d="M9 3Q45 39 8 79" fill="none" stroke="#d5a25d" stroke-width="8"/><path d="M9 3L9 79" stroke="#fff0bd" stroke-width="2"/><path d="M2 44H27" stroke="#b8e6ff" stroke-width="4"/>',斧:'<path d="M14 10L16 80" stroke="#b28b67" stroke-width="8"/><path d="M14 10Q-18 1 1 45L14 37Z" fill="#d7eaff" stroke="#e4b86b" stroke-width="4"/>',槍:'<path d="M12 27L15 80" stroke="#b48c61" stroke-width="7"/><path d="M12 0L22 25L12 35L2 25Z" fill="#d6e9ff" stroke="#f2c56b" stroke-width="4"/>',匕首:'<path d="M12 15L22 0L25 25L13 46Z" fill="#e4f1ff" stroke="#c6a068" stroke-width="4"/><path d="M2 46L27 40" stroke="#dcb46c" stroke-width="6"/><path d="M15 44L17 75" stroke="#73505a" stroke-width="8"/>'};
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function sync(){const data=read(),eq=data?.equipped||{},signature=JSON.stringify(eq);if(signature===lastSignature)return;lastSignature=signature;equipped=eq;
const items=Object.values(eq).filter(Boolean),w=eq['武器'];rarity=Math.max(0,Math.min(5,items.reduce((m,x)=>Math.max(m,Number(x.r)||0),0)));
const name=String(w?.name||'');weaponType=/法杖|魔杖/.test(name)?'法杖':/弓|箭/.test(name)?'弓':/斧|錘|槌/.test(name)?'斧':/長槍|矛/.test(name)?'槍':/匕首/.test(name)?'匕首':'劍';
stage.style.setProperty('--v162-rarity',COLORS[rarity]);gear.textContent=RAR[rarity]+' · '+(w?.name||'新手武器');weapon.innerHTML='<svg viewBox="0 0 30 82" aria-hidden="true">'+icons[weaponType]+'</svg>';
stage.dataset.rarity=String(rarity);stage.dataset.weapon=weaponType;
}
function effect(){const now=performance.now();if(now-fxAt<330)return;fxAt=now;const el=document.createElement('span');el.className='v162-skill';el.textContent=weaponType==='法杖'?'✺':weaponType==='弓'?'➶':weaponType==='斧'?'✹':'⚔';stage.append(el);setTimeout(()=>el.remove(),560)}
sync();setInterval(()=>{sync();const kills=Number($('#kills')?.textContent||'0'),hp=$('#stageEnemyHp')?.getBoundingClientRect().width;if(lastKills!==null&&kills>lastKills)effect();else if(lastHp!==null&&hp!==undefined&&hp<lastHp-2)effect();lastKills=kills;lastHp=hp},350);
const old=window.salaryHeroArtEvents||{};window.salaryHeroArtEvents={...old,attack:()=>{old.attack?.();effect()}};
return true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!init()){let i=0,t=setInterval(()=>{if(init()||++i>30)clearInterval(t)},300)}});else if(!init()){let i=0,t=setInterval(()=>{if(init()||++i>30)clearInterval(t)},300)}
})();