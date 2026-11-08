/* Salary Hero — deterministic, persisted encounter engine (separate from payroll). */
(()=>{'use strict';
const KEY='salary-hero-encounters-v1',DAY=86400000;
const EVENTS=[
{id:'printer',title:'失控的影印魔像',icon:'🖨️',rarity:'普通',text:'影印機吐出一張寫著「今天可以準時下班」的預言。',choices:[['相信預言',{gold:12,xp:8}],'拿去碎紙機',{gold:5,xp:15}]]},
{id:'coffee',title:'咖啡煉金術師',icon:'☕',rarity:'普通',text:'一位神祕同事提供能讓星期一變短的藥水。',choices:[['喝一口',{gold:8,xp:16}],'轉賣給主管',{gold:20,xp:3}]]},
{id:'meeting',title:'無盡會議迷宮',icon:'🌀',rarity:'稀有',text:'會議室的門通往另一間會議室。',choices:[['尋找出口',{gold:25,xp:24}],'直接宣布散會',{gold:38,xp:12}]]},
{id:'chest',title:'被遺忘的年終寶箱',icon:'🎁',rarity:'稀有',text:'角落出現刻著「預算審核通過」的古老寶箱。',choices:[['小心開箱',{gold:42,xp:20}],'交給財務部',{gold:18,xp:35}]]},
{id:'dragon',title:'傳說・截止日巨龍',icon:'🐉',rarity:'傳說',text:'巨龍守著一份永遠寫不完的週報。',choices:[['正面挑戰',{gold:120,xp:100}],'用範本封印',{gold:75,xp:130}]]}
];
const $=s=>document.querySelector(s);
let state;try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
if(!state||typeof state!=='object')state={gold:0,xp:0,history:[],pending:null,lastDay:''};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const date=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const hash=s=>[...s].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,2166136261);
function eventFor(day){const h=hash(day),r=h%100;return EVENTS[r<3?4:r<24?2+h%2:h%2]}
function award(choice){if(!state.pending)return;const e=EVENTS.find(x=>x.id===state.pending.id);if(!e)return;const c=e.choices[choice];if(!c)return;state.gold+=c[1].gold;state.xp+=c[1].xp;state.history.unshift({day:state.pending.day,id:e.id,choice,reward:c[1]});state.history=state.history.slice(0,90);state.pending=null;save();render()}
function open(){const d=$('#encounter-dialog');if(d&&!d.open)d.showModal();render()}
function render(){const d=$('#encounter-dialog');if(!d)return;const body=$('#encounter-body'),today=date();$('#encounter-status').textContent='奇遇金幣 '+state.gold+' · 經驗 '+state.xp;
if(state.pending){const e=EVENTS.find(x=>x.id===state.pending.id);if(!e){state.pending=null;save();return render()}body.innerHTML='<div class="enc-art">'+e.icon+'</div><strong>'+e.title+'</strong><p>'+e.text+'</p><small>'+e.rarity+'奇遇 · '+state.pending.day+'</small><div id="encounter-choices"></div>';const choices=$('#encounter-choices');e.choices.forEach((c,i)=>{const b=document.createElement('button');b.textContent=c[0]+' · +'+c[1].gold+'金 / +'+c[1].xp+'EXP';b.onclick=()=>award(i);choices.append(b)});return}
const done=state.lastDay===today;body.innerHTML='<div class="enc-art">📜</div><strong>'+(done?'今日奇遇已完成':'今天有新的奇遇')+'</strong><p>'+(done?'明天會出現不同的職場冒險。':'每日一次，選擇後永久記錄；不影響真實薪資。')+'</p>';if(!done){const b=document.createElement('button');b.textContent='探索今日奇遇';b.onclick=()=>{const e=eventFor(today);state.lastDay=today;state.pending={day:today,id:e.id};save();render()};body.append(b)}
const h=document.createElement('p');h.style.fontSize='12px';h.textContent='已完成 '+state.history.length+' 次奇遇';body.append(h);
}
function init(){const host=document.createElement('div');host.innerHTML='<button id="encounter-launch" type="button" aria-label="開啟奇遇系統">✦ 奇遇</button><dialog id="encounter-dialog" aria-label="奇遇系統"><header><b>✦ 職場奇遇</b><button id="encounter-close" type="button">✕</button></header><div id="encounter-status"></div><section id="encounter-body"></section></dialog><style>#encounter-launch{position:fixed;right:12px;bottom:68px;z-index:45;border:2px solid #edc879;border-radius:22px;padding:10px 16px;background:linear-gradient(140deg,#7d4569,#342144);color:#ffe7ad;font-weight:900;box-shadow:0 4px 16px #0009}#encounter-dialog{position:fixed;z-index:100;max-width:min(92vw,420px);width:92%;border:3px solid #e8b96c;border-radius:17px;background:radial-gradient(circle at top,#5b3a65,#21162e 75%);color:#ffe9c4;box-shadow:0 15px 70px #000a;padding:18px}#encounter-dialog::backdrop{background:#080511d9}#encounter-dialog header{display:flex;justify-content:space-between;align-items:center;font-size:20px;color:#ffda87}#encounter-dialog header button{width:auto;padding:3px 12px}#encounter-status{font-size:12px;color:#ffd792;margin:8px 0}#encounter-body{text-align:center}#encounter-body strong{display:block;font-size:19px}#encounter-body p{line-height:1.7}#encounter-body button{display:block;width:100%;margin:10px 0;border:1px solid #f3c47d;background:#644363;border-radius:10px;padding:11px;color:#fff0cf}.enc-art{font-size:76px;margin:15px auto;filter:drop-shadow(0 0 15px #f5b96d88);animation:enc-float 2.5s ease-in-out infinite alternate}@keyframes enc-float{to{transform:translateY(-8px)}}</style>';document.body.append(...host.childNodes);$('#encounter-launch').onclick=open;$('#encounter-close').onclick=()=>$('#encounter-dialog').close();render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();