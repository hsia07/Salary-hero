(()=>{'use strict';function init(){const home=document.getElementById('home'),shell=home?.querySelector('.v134-shell');if(!shell)return;const style=document.createElement('style');style.textContent=`
#home .v134-duo{grid-template-columns:1fr 1fr}
#home .v134-duo .v134-panel:first-child .v134-preview{overflow:hidden;background:linear-gradient(160deg,#344d77,#4c3a5a 65%,#302b41)}
#home #v134Live{display:none}
#home .v136-live{position:relative;width:100%;height:100%;overflow:hidden}
#home .v136-live .adventure-stage{width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;transform:none!important;display:block!important;position:relative!important;background:transparent!important;box-shadow:none!important;border:0!important}
#home .v136-live .actor{position:absolute!important;bottom:12%!important;width:43%!important;height:72%!important;display:block!important;transform-origin:center bottom}
#home .v136-live .hero-actor{left:2%!important}
#home .v136-live .mob-actor{right:0!important}
#home .v136-live .actor svg{height:100%!important;width:100%!important;overflow:visible}
#home .v136-live .stage-top{position:absolute!important;top:3px!important;left:3px!important;right:3px!important;z-index:2!important;display:flex!important;justify-content:space-between!important;gap:3px!important}
#home .v136-live .stage-chip{font-size:8px!important;padding:2px 3px!important}
#home .v136-live .stage-footer{position:absolute!important;bottom:0!important;left:0!important;right:0!important;font-size:8px!important;display:flex!important;justify-content:space-between!important;z-index:2!important}
#home .v136-live .mini-hp{height:5px!important}
#home .v136-extra{display:flex;justify-content:center;gap:6px;margin-top:7px}
#home .v136-extra button{font-size:11px;padding:7px;border:1px solid #d8aa70;border-radius:10px;background:linear-gradient(#684d4c,#352a40);color:#ffe6b2}
#home .v136-hero-display{position:absolute;inset:0;display:grid;place-items:end center;pointer-events:none}
#home .v136-hero-display svg{height:95%;width:75%;max-width:350px;filter:drop-shadow(0 6px 12px #100e24)}
#home .v136-hero-display .v136-cat{position:absolute;right:6%;bottom:8%;font-size:58px;filter:drop-shadow(0 3px 4px #151421);animation:v136bob 3s ease-in-out infinite}
@keyframes v136bob{50%{transform:translateY(-5px)}}
#home .v136-salary-stamp{position:absolute;left:9px;bottom:9px;z-index:2;max-width:38%;padding:7px;background:#f0d8a9;color:#382b2e;border:3px ridge #a8794c;border-radius:8px;box-shadow:0 2px 8px #120e20}
#home .v136-salary-stamp strong{display:block;font-size:13px}.v136-salary-stamp small{font-size:10px}
#home .v136-action-note{font-size:11px;color:#ffe5b4;text-align:center;margin:-4px 0 9px}
#home .v134-hero:before{z-index:3}
#home .v134-hero>img{display:none}
@media(max-width:400px){#home .v136-hero-display .v136-cat{font-size:44px}#home .v136-salary-stamp strong{font-size:11px}}
`;document.head.append(style);
const preview=shell.querySelector('.v134-duo .v134-panel:first-child .v134-preview'),stage=document.getElementById('adventureStage');if(preview&&stage){const wrap=document.createElement('div');wrap.className='v136-live';preview.append(wrap);wrap.append(stage)}
const hero=shell.querySelector('.v134-hero');if(hero){const display=document.createElement('div');display.className='v136-hero-display';display.innerHTML='<span class="v136-cat" aria-label="橘貓夥伴">🐈</span>';hero.prepend(display);const stamp=document.createElement('div');stamp.className='v136-salary-stamp';stamp.innerHTML='<strong>☕ 上班中…</strong><small>薪水持續累積</small>';hero.append(stamp);const source=document.getElementById('heroActor');function sync(){const svg=source?.querySelector('svg');if(svg){const old=display.querySelector('svg');if(old)old.remove();display.prepend(svg.cloneNode(true))}}sync();if(source)new MutationObserver(sync).observe(source,{childList:true,subtree:true})}
const go=shell.querySelector('#v134Go');if(go){go.textContent='⚔ 出擊戰鬥';go.onclick=()=>{const fight=document.getElementById('fight');if(fight){fight.click();go.textContent='⚔ 勇者出擊！';setTimeout(()=>go.textContent='⚔ 出擊戰鬥',1100)}else document.querySelector('.tabs [data-tab="battle"]')?.click()}}
const controls=shell.querySelector('.v134-duo .v134-panel:first-child');if(controls){const extra=document.createElement('div');extra.className='v136-extra';extra.innerHTML='<button type="button" id="v136Chest">🎁 開寶箱</button><button type="button" id="v136Dungeon">📜 副本</button>';controls.append(extra);extra.querySelector('#v136Chest').onclick=()=>document.getElementById('chest')?.click();extra.querySelector('#v136Dungeon').onclick=()=>document.querySelector('.tabs [data-tab="battle"]')?.click()}
const note=document.createElement('p');note.className='v136-action-note';note.textContent='點擊出擊可進行真實戰鬥；開箱、裝備與薪資沿用原有存檔';shell.querySelector('.v134-duo')?.before(note);
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();