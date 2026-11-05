(()=>{'use strict';
const ROOT='./art/v4/',COUNT={hero_idle:6,hero_walk:6,hero_attack:6,hero_hurt:3,hero_down:3,monster_idle:4,monster_attack:6,monster_hurt:3,cat_idle:4,cat_motion:6};
const file=(key,n)=>ROOT+key+'_'+String(n).padStart(2,'0')+'.png';
function init(){const stage=document.getElementById('v150Stage'),hero=document.getElementById('heroActor'),mob=document.getElementById('mobActor');if(!stage||!hero||!mob)return false;
const style=document.createElement('style');style.textContent=`
#home #v150Stage .v165-sprite{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:auto;pointer-events:none;z-index:2;filter:drop-shadow(0 6px 8px #0009)}
#home #v150Stage .v165-sprite-ready>svg{visibility:hidden!important}
#home #v150Stage .v165-sprite-ready>.v162-weapon{z-index:9}
#home #v150Stage .v165-asset-warning{position:absolute;right:6px;bottom:5px;z-index:40;color:#f4d9a6;background:#201728cf;padding:2px 5px;border-radius:4px;font-size:9px}
@media(prefers-reduced-motion:reduce){#home #v150Stage .v165-sprite{transition:none!important}}
`;document.head.append(style);
const chars={hero:{host:hero,action:'hero_idle',until:0},monster:{host:mob,action:'monster_idle',until:0}};
let assetReady=false,failed=false,raf=0;
function assign(ch,key,index){const src=file(key,index);if(ch.current===src)return;ch.current=src;ch.img.src=src}
function animate(type,ms){const c=chars[type.startsWith('hero')?'hero':'monster'];if(!COUNT[type])return;c.action=type;c.until=performance.now()+ms;c.frame=0;c.current=''}
const probe=new Image();probe.onload=()=>{assetReady=true;for(const [key,ch] of Object.entries(chars)){const img=new Image();img.className='v165-sprite';img.alt=key==='hero'?'勇者動畫':'怪物動畫';img.onload=()=>ch.host.classList.add('v165-sprite-ready');img.onerror=()=>{ch.host.classList.remove('v165-sprite-ready');ch.current='';failed=true};ch.img=img;ch.host.prepend(img)}
const idle=document.getElementById('v150Idle');if(idle){const bg=new Image();bg.onload=()=>{idle.style.backgroundImage='url("'+ROOT+'sleeping_hero_scene.png")';idle.style.backgroundSize='cover';idle.style.backgroundPosition='center'};bg.src=ROOT+'sleeping_hero_scene.png'}
let last=0;function draw(t){if(!document.contains(stage))return;if(t-last>110){last=t;for(const ch of Object.values(chars)){if(t>ch.until&&ch.action!== (ch===chars.hero?'hero_idle':'monster_idle')){ch.action=ch===chars.hero?'hero_idle':'monster_idle';ch.frame=0;ch.current=''}const count=COUNT[ch.action],frame=Math.floor(ch.frame++/(ch.action.includes('attack')?1:2))%count;assign(ch,ch.action,frame)}}raf=requestAnimationFrame(draw)}raf=requestAnimationFrame(draw);
stage.dataset.spriteStatus='ready';};
probe.onerror=()=>{stage.dataset.spriteStatus='missing';const warn=document.createElement('span');warn.className='v165-asset-warning';warn.textContent='角色素材尚未部署 · 顯示舊版';stage.append(warn)};
probe.src=file('hero_idle',0);
window.addEventListener('salaryhero:combat',e=>{if(!assetReady)return;const d=e.detail||{};if(d.type==='attack'){animate('hero_attack',680);animate('monster_hurt',480);if(d.defeated)setTimeout(()=>animate('monster_hurt',500),180)}else if(d.type==='heroHurt'){animate('hero_hurt',460);animate('monster_attack',500)}else if(d.type==='heroDown'){animate('hero_down',1900);animate('monster_attack',500)}});
window.salaryHeroSpriteStatus=()=>({ready:assetReady,failed,actions:Object.fromEntries(Object.entries(chars).map(([k,v])=>[k,v.action]))});
return true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!init()){let n=0,t=setInterval(()=>{if(init()||++n>25)clearInterval(t)},300)}});else if(!init()){let n=0,t=setInterval(()=>{if(init()||++n>25)clearInterval(t)},300)}
})();