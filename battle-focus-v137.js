(()=>{'use strict';
function init(){
const shell=document.querySelector('#home .v134-shell');if(!shell)return;
const hero=shell.querySelector('.v134-hero');
const battleCard=shell.querySelector('.v134-duo .v134-panel:first-child');
const preview=battleCard?.querySelector('.v134-preview');
const live=preview?.querySelector('.v136-live');
const display=hero?.querySelector('.v136-hero-display');
if(!hero||!battleCard||!preview||!live||!display)return;
const css=document.createElement('style');css.textContent=`
#home .v134-hero{height:clamp(355px,102vw,510px)!important;min-height:355px!important;overflow:hidden!important;background:radial-gradient(ellipse at 50% 85%,#e5a66b66,transparent 60%),linear-gradient(180deg,#26345b,#454265 48%,#654057)!important}
#home .v134-hero:before{content:'⚔  勇者自動冒險中';font-size:14px;z-index:5;background:#241d36c9;padding:6px 10px;border:1px solid #d7a86d;border-radius:9px}
#home .v134-hero .v136-live{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:1!important;overflow:hidden!important}
#home .v134-hero .v136-live #adventureStage{width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;position:relative!important;overflow:hidden!important;border:0!important;box-shadow:none!important;background:transparent!important}
#home .v134-hero .v136-live .actor{width:46%!important;height:68%!important;bottom:10%!important}
#home .v134-hero .v136-live .hero-actor{left:4%!important}
#home .v134-hero .v136-live .mob-actor{right:1%!important}
#home .v134-hero .v136-live .stage-chip{font-size:11px!important;padding:5px 7px!important}
#home .v134-hero .v136-live .stage-top{top:55px!important;left:8px!important;right:8px!important}
#home .v134-hero .v136-live .stage-footer{font-size:11px!important;padding:7px 9px!important;background:#161d35bb!important;bottom:0!important}
#home .v134-hero aside{top:auto!important;bottom:48px!important;right:7px!important;width:39%!important;z-index:4!important}
#home .v134-hero .v136-salary-stamp{display:none!important}
#home .v134-hero:after{z-index:2;pointer-events:none}
#home .v134-duo .v134-panel:first-child .v134-preview{height:150px!important;background:linear-gradient(150deg,#263e5b,#543e56)!important}
#home .v134-duo .v134-panel:first-child h3{font-size:15px}
#home .v137-idle{position:relative;width:100%;height:100%;display:grid;place-items:end center;overflow:hidden}
#home .v137-idle .v136-hero-display{position:absolute!important;inset:0!important;display:grid!important;place-items:end center!important;pointer-events:none}
#home .v137-idle .v136-hero-display svg{height:94%!important;width:80%!important;max-width:none!important;filter:drop-shadow(0 4px 8px #111327)}
#home .v137-idle .v136-cat{font-size:31px!important;right:3%!important;bottom:5%!important}
#home .v137-idle-label{position:absolute;top:4px;left:5px;z-index:3;font-size:11px;background:#171c32d9;color:#ffe1a6;border:1px solid #ba935e;border-radius:7px;padding:4px 6px}
#home .v137-idle-caption{position:absolute;bottom:3px;left:3px;right:3px;text-align:center;font-size:10px;color:#f4d9b1;text-shadow:0 1px 3px #121322}
#home .v134-duo .v134-panel:first-child .v136-extra{margin-top:5px}
#home .v134-duo .v134-panel:first-child .v134-control{margin-top:5px}
#home .v134-duo .v134-panel:first-child .v134-control button{min-height:33px}
#home .v134-main-action{margin-top:-13px!important}
@media(max-width:400px){#home .v134-hero{height:370px!important;min-height:370px!important}#home .v134-hero .v136-live .actor{height:65%!important}#home .v134-hero .v136-live .stage-chip{font-size:9px!important}}
`;document.head.append(css);
hero.prepend(live);
const idle=document.createElement('div');idle.className='v137-idle';
const idleTitle=document.createElement('span');idleTitle.className='v137-idle-label';idleTitle.textContent='☕ 上班掛機中';
const idleCaption=document.createElement('span');idleCaption.className='v137-idle-caption';idleCaption.textContent='勇者摸魚中 · 薪水照常累積';
idle.append(display,idleTitle,idleCaption);preview.append(idle);
const heading=battleCard.querySelector('h3');if(heading)heading.textContent='☕ 上班掛機';
const status=hero.querySelector('aside strong');if(status)status.textContent='⚔ 即時戰況';
const hint=shell.querySelector('.v136-action-note');if(hint)hint.textContent='主畫面即時戰鬥 · 下方可切換自動戰鬥及 1～5 倍速';
const go=shell.querySelector('#v134Go');if(go)go.textContent='⚔ 手動出擊';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();