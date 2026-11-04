(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
function start(){
const home=$('#home'),old=$('.v134-shell',home),stage=$('#adventureStage');if(!home||!old||!stage)return;
const style=document.createElement('style');style.textContent=`
body{background:#14101f!important;color:#ffe5bb!important}
body>header{display:none!important}
#home .v134-shell{display:none!important}
#home .v150{position:relative;max-width:540px;margin:0 auto;padding:10px 10px 20px;min-height:100vh;background:radial-gradient(ellipse at 50% 10%,#4c3152 0,#231c34 50%,#15152b 100%);color:#ffe4ad;font-family:system-ui,"Noto Sans TC",sans-serif}
#home .v150 button{cursor:pointer;color:inherit;font:inherit}
#home .v150-top{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
#home .v150-brand{font-family:serif;font-weight:1000;font-size:clamp(27px,8vw,39px);letter-spacing:2px;color:#ffe2a1;text-shadow:0 2px #54241d,0 0 12px #e99b45}
#home .v150-sub{font-size:10px;color:#e4bc85}
#home .v150-currencies{display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap}
#home .v150-chip{background:linear-gradient(#3c2b3e,#1a1728);border:1px solid #be8a4c;border-radius:25px;padding:5px 7px;font-size:11px;box-shadow:inset 0 1px #f1b87577}
#home .v150-profile{display:flex;align-items:center;gap:9px;margin:8px 0 12px}
#home .v150-avatar{width:47px;height:47px;border:2px solid #f3c16d;border-radius:50%;background:radial-gradient(circle,#a26d6c,#30213c);display:grid;place-items:center;font-size:27px}
#home .v150-progress{height:8px;background:#171526;border:1px solid #c3925d;border-radius:10px;overflow:hidden;margin-top:5px}
#home .v150-progress i{display:block;height:100%;width:35%;background:linear-gradient(90deg,#2edacb,#b9fff4)}
#home .v150-income{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:8px 0 13px}
#home .v150-income button{padding:10px 2px;background:linear-gradient(135deg,#59354a,#241b32);border:2px ridge #e9ac60;border-radius:13px;box-shadow:0 0 10px #e6a14e66,inset 0 1px #ffe1a566;min-width:0}
#home .v150-income small{display:block;font-size:11px}
#home .v150-income b{display:block;font-size:clamp(11px,3.4vw,16px);white-space:nowrap}
#home .v150-panel{border:2px ridge #e2a85d;border-radius:15px;background:linear-gradient(145deg,#48304d,#211c33);box-shadow:0 0 0 2px #372136,0 5px 20px #0c091999,inset 0 1px #ffd38a55;overflow:hidden}
#home .v150-panel-title{text-align:center;background:linear-gradient(90deg,#312037,#66435b,#312037);padding:7px;font-weight:900;color:#ffdc93;text-shadow:0 2px #2d1b2a}
#home .v150-battle{height:clamp(300px,87vw,450px);position:relative;background:radial-gradient(ellipse at 50% 70%,#b5836c55,transparent 65%),linear-gradient(180deg,#252d51,#55405a 65%,#34263d)}
#home .v150-battle #adventureStage{width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;position:relative!important;border:0!important;margin:0!important;box-shadow:none!important;background:transparent!important}
#home .v150-battle .actor{height:63%!important;width:43%!important;bottom:12%!important;position:absolute!important}
#home .v150-battle .hero-actor{left:1%!important}
#home .v150-battle .mob-actor{right:1%!important}
#home .v150-battle .stage-top{top:12px!important;left:8px!important;right:8px!important;z-index:4!important}
#home .v150-battle .stage-footer{bottom:0!important;left:0!important;right:0!important;z-index:4!important;font-size:11px!important}
#home .v150-actions{display:flex;gap:6px;padding:8px;align-items:center;justify-content:center;flex-wrap:wrap}
#home .v150-actions button,#home .v150-dock button{border:1px solid #d9a65b;border-radius:10px;background:linear-gradient(#593d4e,#29243d);padding:8px 10px;font-weight:800}
#home .v150-actions button[aria-pressed=true]{background:linear-gradient(#4b9157,#245b42)}
#home .v150-primary{display:block;width:85%;margin:12px auto 14px;padding:13px 8px;border:3px ridge #ffde89;border-radius:14px;background:linear-gradient(#e0a257,#9d5138 55%,#692e39);box-shadow:0 0 16px #f4a45299;color:#fff1b7!important;font-size:24px!important;font-weight:1000!important;text-shadow:0 2px #5b2924}
#home .v150-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
#home .v150-mini{height:150px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 80%,#94686d,#252b47)}
#home .v150-mini svg{width:100%;height:100%;object-fit:contain}
#home .v150-cat{position:absolute;right:6px;bottom:7px;font-size:35px}
#home .v150-gear{display:flex;justify-content:center;align-items:center;height:150px;background:radial-gradient(circle,#615277,#24243e)}
#home .v150-gear svg{max-width:100%;height:100%}
#home .v150-dock{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:12px}
#home .v150-dock button{padding:8px 1px;font-size:11px;min-width:0}
#home .v150-dock span{display:block;font-size:23px}
#home .v150-version{text-align:center;font-size:10px;opacity:.7;margin-top:9px}
body>.tabs{display:none!important} body:has(#home[hidden])>.tabs,body:has(#home[style*='display: none'])>.tabs{display:flex!important} #home .v150{isolation:isolate} #home .v150-battle:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#f7cb7b12 1px,transparent 1px),linear-gradient(#e3ac6a0c 1px,transparent 1px);background-size:48px 48px;pointer-events:none} #home .v150-panel-title{letter-spacing:1px} #home .v150-dock button:active,#home .v150-actions button:active{transform:translateY(2px);filter:brightness(1.2)}
@media(max-width:390px){#home .v150-brand{font-size:28px}#home .v150-battle{height:340px}}
`;document.head.append(style);
const root=document.createElement('div');root.className='v150';root.innerHTML=`
<div class="v150-top"><div><div class="v150-brand">⚜ 薪水勇者</div><div class="v150-sub">Salary Hero · 社畜異世界冒險</div></div><div class="v150-currencies"><span class="v150-chip">🪙 <b id="v150Coins">—</b></span><span class="v150-chip">💎 <b id="v150Gems">—</b></span></div></div>
<div class="v150-profile"><div class="v150-avatar">🧑🏻‍💼</div><div style="flex:1"><b id="v150Level">社畜勇者 · 夏</b><div class="v150-progress"><i id="v150Exp"></i></div></div><button class="v150-chip" data-nav="more">⚙️ 設定</button></div>
<div class="v150-income"><button data-salary><small>💰 今日已賺</small><b id="v150Today">NT$ 0</b></button><button data-salary><small>📅 本週已賺</small><b id="v150Week">NT$ 0</b></button><button data-salary><small>📆 本月已賺</small><b id="v150Month">NT$ 0</b></button></div>
<section class="v150-panel"><div class="v150-panel-title">⚔ 即時戰鬥 · 自動冒險</div><div class="v150-battle" id="v150Stage"></div><div class="v150-actions"><button id="v150Auto">⚔ 自動戰鬥</button><button id="v150Speed">⏩ ×1</button><button data-nav="battle">📜 副本</button></div></section>
<button class="v150-primary" id="v150Go">⚔ 出擊戰鬥</button>
<div class="v150-grid"><section class="v150-panel"><div class="v150-panel-title">☕ 上班掛機中</div><div class="v150-mini" id="v150Idle"><span class="v150-cat">🐈</span></div><div class="v150-actions"><button data-salary>💰 薪資明細</button></div></section><section class="v150-panel"><div class="v150-panel-title">🛡 裝備預覽</div><div class="v150-gear" id="v150Gear"></div><div class="v150-actions"><button data-nav="bag">背包</button><button data-nav="forge">鍛造</button></div></section></div>
<nav class="v150-dock"><button data-nav="home"><span>🏠</span>首頁</button><button data-nav="battle"><span>⚔️</span>副本</button><button data-nav="bag"><span>🎒</span>背包</button><button data-nav="forge"><span>⚒️</span>鍛造</button><button data-nav="more"><span>⚙️</span>更多</button></nav>
<div class="v150-version">V15.0 · 手機 RPG 首頁重製</div>`;
home.prepend(root);$('#v150Stage',root).append(stage);
const hero=$('#heroActor svg',stage);if(hero){$('#v150Idle',root).prepend(hero.cloneNode(true));$('#v150Gear',root).append(hero.cloneNode(true))} const equipArt=$('.v135-equip-svg svg')||$('#heroEquipmentArt svg')||$('#heroPreview svg');if(equipArt)$('#v150Gear',root).replaceChildren(equipArt.cloneNode(true));
function nav(id){const b=document.querySelector('.tabs [data-tab="'+id+'"]');if(b){b.click();window.scrollTo({top:0,behavior:'smooth'})}}
root.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
root.querySelectorAll('[data-salary]').forEach(b=>b.onclick=()=>{const btn=$('.v134-money button');if(btn){btn.click();return}const toggle=$('#adventureJournalToggle'),journal=$('#adventureJournal');if(journal){journal.hidden=false;toggle?.setAttribute('aria-expanded','true');journal.scrollIntoView({behavior:'smooth'});return}nav('more')});
$('#v150Go',root).onclick=()=>{nav('battle');requestAnimationFrame(()=>$('#gameViewport')?.scrollIntoView({behavior:'smooth',block:'center'}))};
$('#v150Auto',root).onclick=()=>{const auto=$('#gameAuto');if(auto)auto.click();else nav('battle')};
$('#v150Speed',root).onclick=()=>{const speed=$('#worldSpeedBtn');if(speed)speed.click();else nav('battle')};
function sync(){for(const [a,b]of [['earned','v150Today'],['weekEarned','v150Week'],['monthEarned','v150Month']]){const x=$('#'+a),y=$('#'+b,root);if(x&&y)y.textContent=x.textContent}const auto=$('#gameAuto')?.textContent||'';const on=/ON|開|自動中/.test(auto)&&!/OFF|關|停止/.test(auto);$('#v150Auto',root).textContent=on?'⚔ 自動 ON':'⚔ 自動 OFF';$('#v150Auto',root).setAttribute('aria-pressed',String(on));$('#v150Speed',root).textContent='⏩ ×'+(window.salaryHeroBattleSpeed||1);const level=$('#heroLevel')||$('#level');if(level)$('#v150Level',root).textContent='社畜勇者 · '+level.textContent;const gear=$('.v135-equip-svg svg')||$('#heroEquipmentArt svg')||$('#heroPreview svg');if(gear){const dest=$('#v150Gear',root),old=dest?.querySelector('svg');if(dest&&(!old||old.outerHTML!==gear.outerHTML))dest.replaceChildren(gear.cloneNode(true))}const coins=$('#coins')||$('#gold');if(coins)$('#v150Coins',root).textContent=coins.textContent;const gems=$('#gems')||$('#diamonds');if(gems)$('#v150Gems',root).textContent=gems.textContent;}
sync();setInterval(sync,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();