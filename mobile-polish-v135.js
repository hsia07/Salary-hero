(()=>{'use strict';
function boot(){
const home=document.getElementById('home'),shell=home?.querySelector('.v134-shell');if(!shell)return;
const css=document.createElement('style');css.textContent=`
body{background:#141523}
#home .v134-shell{max-width:540px;margin:0 auto;padding:8px 9px 13px;background:linear-gradient(175deg,#241b34,#20243b 44%,#19192c);border:1px solid #d6a45f;box-shadow:0 0 0 2px #53344a,inset 0 0 24px #ce89512e}
#home .v134-header{padding:3px 5px 6px}.v134-logo{font-family:Georgia,serif;letter-spacing:1px;text-shadow:0 2px 1px #24141d,0 0 12px #d6a152}.v134-money{margin:8px 0;gap:4px}.v134-money button{border:2px ridge #d6a05f;box-shadow:inset 0 0 11px #b36e4855,0 2px 6px #0b0a18}.v134-money b{font-variant-numeric:tabular-nums}
#home .v134-hero{height:330px;min-height:330px;align-items:flex-end;background:radial-gradient(ellipse at 55% 70%,#d19a646b,transparent 55%),linear-gradient(180deg,#273d60 0%,#35405e 48%,#51394c 100%);box-shadow:inset 0 0 35px #080e26}
#home .v134-hero:after{content:'';position:absolute;inset:auto 0 0;height:27%;background:linear-gradient(transparent,#1a1728b0);pointer-events:none}
#home .v134-hero>img{width:85%;max-width:420px;height:100%;max-height:none;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 8px 15px #130e26)}
#home .v134-hero aside{z-index:1;top:12px;right:8px;width:39%;font-size:11px;background:#271f32e8;box-shadow:0 2px 10px #0006}
#home .v134-main-action{position:relative;z-index:2;width:87%;display:block;margin:-19px auto 12px;box-shadow:0 0 0 2px #59352c,0 5px 19px #d9854677;font-family:Georgia,serif;letter-spacing:2px}
#home .v134-panel{min-height:235px;padding:8px;background:linear-gradient(145deg,#423147,#1c2138);box-shadow:inset 0 0 12px #b7854540}
#home .v134-panel h3{margin-bottom:7px;font-family:Georgia,serif;font-size:16px}
#home .v134-preview{height:145px;background:#22283e;border:1px solid #987a57}
#home .v134-preview img{object-fit:contain}
#home .v134-dock{grid-template-columns:repeat(4,minmax(0,1fr));margin-top:13px}
#home .v134-dock button{font-size:12px;min-height:60px}
#home .v134-dock button span{font-size:24px}
#home .v134-control{gap:5px}
#home .v134-control button{min-height:32px}
.v135-salary-sheet{position:fixed;z-index:9999;inset:0;background:#090d1bcc;display:grid;place-items:center;padding:18px}
.v135-salary-sheet[hidden]{display:none}
.v135-salary-card{max-width:420px;width:100%;background:linear-gradient(145deg,#46334c,#192b3d);color:#ffe6b7;border:2px solid #d5a461;border-radius:18px;padding:22px;box-shadow:0 12px 50px #0009}
.v135-salary-card h2{margin:0 0 14px;color:#ffdf9e}.v135-salary-card dl{display:grid;grid-template-columns:1fr auto;gap:12px}.v135-salary-card dd{margin:0;font-variant-numeric:tabular-nums;font-weight:800}.v135-salary-card button{width:100%;margin-top:12px;padding:12px;border:1px solid #ffe0a2;border-radius:12px;background:#a9794c;color:#fff;font-weight:800}
.v135-equip-svg{width:100%;height:100%;display:grid;place-items:center;overflow:hidden}.v135-equip-svg svg{max-height:145px;width:auto;max-width:100%}
.v135-meta{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:5px 0;font-size:11px;color:#e9c992}
.v135-meta span{background:#181d31;border:1px solid #86664d;padding:4px 7px;border-radius:12px}
.v135-toast{position:fixed;bottom:85px;left:50%;transform:translateX(-50%);z-index:9999;padding:10px 15px;border:1px solid #efc583;border-radius:12px;background:#202d42;color:#fff0c8;max-width:90vw;text-align:center}
@media(max-width:390px){#home .v134-hero{height:295px;min-height:295px}#home .v134-preview{height:125px}#home .v134-panel{min-height:216px}}
`;document.head.append(css);
const hero=home.querySelector('.v134-hero'),portrait=hero?.querySelector('img'),stage=document.getElementById('heroActor');
if(portrait){portrait.src='./art/world-guild-v12.svg';portrait.alt='勇者冒險場景';}
const equip=home.querySelector('.v134-duo .v134-panel:nth-child(2) .v134-preview');if(equip){equip.innerHTML='<div class="v135-equip-svg" aria-label="目前裝備的勇者外觀"></div>';const box=equip.firstElementChild;function syncHero(){const source=document.querySelector('#heroActor svg');if(source){box.replaceChildren(source.cloneNode(true))}else if(!box.children.length){box.textContent='勇者裝備載入中'}}syncHero();const observer=new MutationObserver(syncHero);if(stage)observer.observe(stage,{childList:true,subtree:true,attributes:true});}
const meta=document.createElement('div');meta.className='v135-meta';meta.innerHTML='<span id="v135Level">Lv.1</span><span id="v135Power">戰力 0</span><span id="v135Kills">討伐 0</span>';hero.after(meta);
const dock=shell.querySelector('.v134-dock');if(dock){dock.innerHTML='';const items=[['🏠','首頁','home'],['👤','角色','bag'],['⚔️','副本','battle'],['🎒','背包','bag'],['⚒️','鍛造','forge'],['📖','圖鑑','more'],['🐱','寵物','more'],['🏪','商店','more']];for(const [emoji,label,dest]of items){const b=document.createElement('button');b.type='button';b.innerHTML='<span>'+emoji+'</span>'+label;b.dataset.dest=dest;if(dest==='home')b.setAttribute('aria-current','page');b.onclick=()=>{document.querySelector('.tabs [data-tab="'+dest+'"]')?.click();if(label==='圖鑑'||label==='寵物'||label==='商店'){const panel=document.getElementById('more');panel?.querySelector('.v13-details')?.setAttribute('open','');const match=Array.from(panel?.querySelectorAll('h2,h3,summary')||[]).find(el=>el.textContent.includes(label));match?.scrollIntoView({behavior:'smooth',block:'start'});if(!match)notify(label+'功能目前集中在更多頁，尚待獨立製作')}};dock.append(b)}}
function notify(message){let toast=document.querySelector('.v135-toast');if(!toast){toast=document.createElement('div');toast.className='v135-toast';document.body.append(toast)}toast.textContent=message;toast.hidden=false;setTimeout(()=>{toast.hidden=true},2400)}
const modal=document.createElement('div');modal.className='v135-salary-sheet';modal.hidden=true;modal.innerHTML='<div class="v135-salary-card" role="dialog" aria-modal="true" aria-label="薪資明細"><h2>💰 薪資明細</h2><dl><dt>今日已賺</dt><dd id="v135Day"></dd><dt>本週已賺</dt><dd id="v135Week"></dd><dt>本月已賺</dt><dd id="v135Month"></dd><dt>目前時薪</dt><dd id="v135Rate"></dd><dt>上班時間</dt><dd id="v135Clock"></dd></dl><button type="button">返回冒險</button></div>';document.body.append(modal);modal.querySelector('button').onclick=()=>modal.hidden=true;modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.hidden=true});
shell.querySelectorAll('[data-salary]').forEach(b=>b.onclick=()=>{for(const [src,dst]of [['earned','v135Day'],['weekEarned','v135Week'],['monthEarned','v135Month'],['rate','v135Rate'],['clock','v135Clock']]){modal.querySelector('#'+dst).textContent=document.getElementById(src)?.textContent||'—'}modal.hidden=false;modal.querySelector('button').focus()});
function refresh(){for(const [from,to]of [['level','v135Level'],['power','v135Power'],['kills','v135Kills']]){const a=document.getElementById(from),b=document.getElementById(to);if(a&&b)b.textContent=(to==='v135Power'?'戰力 ':to==='v135Kills'?'討伐 ':'')+a.textContent}const zone=document.getElementById('gameZone');const status=document.getElementById('v134Status');if(zone&&status)status.textContent=zone.textContent}
refresh();setInterval(refresh,1500);
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();