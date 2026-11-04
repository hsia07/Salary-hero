/* V12.2 — deterministic world discoveries; no background timer required. */
(()=>{'use strict';
const KEY='salary-hero-v122-discoveries',SAVE='salary-hero-v51';
const areas=[
 ['文書荒原','遺失的打卡鐘','在荒原深處找到一座停擺的打卡鐘。鐘面指向永遠的下午五點。','黃銅時針'],
 ['卡紙機械森林','會唱歌的印表機','一台古老印表機正在哼唱森林之歌，吐出一張神祕地圖。','森林路線圖'],
 ['午休迷霧谷','沒有菜單的酒館','迷霧裡的酒館只供應一種料理：今天最需要的安慰。','暖心餐券'],
 ['無盡會議高塔','消失的議程','塔頂藏著一份沒有任何待辦事項的議程，傳說能讓會議準時結束。','空白議程'],
 ['週五夕陽王城','落日郵差','夕陽下的郵差替你送來一封寫著「辛苦了」的信。','夕陽信箋'],
 ['傳說加班深淵','自由之門','深淵裂隙中浮現一道門，門後傳來下班鐘聲。','自由之門碎片']
];
const events=[
 ['迷路的小狐狸','你替一隻迷路的小狐狸指了方向，牠留下了一顆亮晶晶的石頭。','狐狸的謝禮'],
 ['神祕旅人','旅人說世界上最難擊敗的怪物叫做星期一，並交給你一枚徽章。','星期一徽章'],
 ['貓咪的藏寶圖','夥伴從草叢拖出一張皺巴巴的藏寶圖，背面寫著「明天見」。','皺巴巴的藏寶圖'],
 ['失眠的守衛','守衛終於睡著了。你替他蓋好披風，獲得一枚小小的感謝章。','守衛感謝章'],
 ['流星雨','一道流星落在前方，留下散發微光的玻璃碎片。','星光玻璃'],
 ['迷你商隊','商隊免費送你一枚旅行紀念幣，祝你今天準時下班。','旅行紀念幣'],
 ['古老路標','路標寫著「冒險不必趕路」，你拓印了這句話。','路標拓印'],
 ['午休精靈','精靈為你準備了一杯不會灑出來的熱茶。','精靈茶杯']
];
let state;try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
if(!state||!Array.isArray(state.records))state={records:[],seen:[]};
const pad=n=>String(n).padStart(2,'0');
const tw=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function minutes(){try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');return Math.max(0,Number(s?.minutes)||0)}catch{return 0}}
function persist(){localStorage.setItem(KEY,JSON.stringify(state))}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
const style=el('style');style.textContent=`
.discovery-board{position:relative;margin:12px 0;padding:14px;border:1px solid #a38b60;border-radius:15px;background:linear-gradient(150deg,#293c42,#172833);color:#f2e4c8;box-shadow:0 8px 20px #07131a55}
.discovery-board h3{margin:0 0 6px;color:#f4d397;font:700 18px Georgia,serif}
.discovery-board p{font-size:13px;line-height:1.65;margin:7px 0;color:#d9ded3}
.discovery-board .discovery-meta{font-size:11px;color:#b9cbbf}
.discovery-board button{width:100%;margin-top:10px;padding:12px;border-radius:10px;border:1px solid #e7c58d;background:linear-gradient(#e9d39e,#b99b64);color:#1d2b31;font-weight:750;min-height:44px}
.discovery-board button:disabled{opacity:.55}
.discovery-board .discovery-list{max-height:180px;overflow:auto;margin-top:10px}
.discovery-board .discovery-entry{border-top:1px solid #66746a66;padding:8px 0;font-size:12px;line-height:1.6}
.discovery-board .discovery-entry b{color:#efd39b}
`;document.head.append(style);
let board,details;
function mount(){if(board)return;const home=document.getElementById('home');if(!home)return;board=el('section','discovery-board');board.setAttribute('aria-label','世界奇遇');const title=el('h3',null,'世界奇遇 · 冒險發現');const status=el('p');status.id='discovery-status';details=el('div');const btn=el('button');btn.type='button';btn.id='discovery-claim';btn.addEventListener('click',claim);const log=el('div','discovery-list');log.id='discovery-list';board.append(title,status,details,btn,log);const canvas=home.querySelector('canvas');if(canvas?.parentElement)canvas.parentElement.insertAdjacentElement('afterend',board);else home.append(board)}
function next(){const day=tw(),m=minutes(),slot=Math.floor(m/45),key=day+':'+slot,idx=hash(key)%areas.length,extra=events[hash('event:'+key)%events.length];return {key,day,slot,idx,extra}}
function claim(){const d=next();if(d.slot<1||state.seen.includes(d.key))return;const base=areas[d.idx],special=d.slot%4===0;const entry={key:d.key,day:d.day,title:special?base[1]:d.extra[0],text:special?base[2]:d.extra[1],item:special?base[3]:d.extra[2],area:base[0]};state.records.unshift(entry);state.records=state.records.slice(0,120);state.seen.push(d.key);state.seen=state.seen.slice(-500);persist();render()}
function render(){mount();if(!board)return;const d=next(),base=areas[d.idx],ready=d.slot>=1&&!state.seen.includes(d.key),special=d.slot%4===0;const status=document.getElementById('discovery-status'),btn=document.getElementById('discovery-claim'),log=document.getElementById('discovery-list');status.textContent='今日探索地帶：'+base[0]+' · 累積上班冒險時間每 45 分鐘解鎖一次奇遇';details.textContent=ready?'新發現：'+(special?base[1]:d.extra[0]):'已收集 '+state.records.length+' 件奇遇紀念品。冒險會繼續，休息時再回來看看。';btn.textContent=ready?'查看本次奇遇並收藏':d.slot<1?'累積 45 分鐘後解鎖':'本次奇遇已收藏';btn.disabled=!ready;log.replaceChildren(...state.records.slice(0,5).map(r=>{const n=el('div','discovery-entry');n.append(el('b',null,r.title+' · '+r.item),el('div',null,r.text));return n}))}
document.addEventListener('DOMContentLoaded',()=>{render();setInterval(render,15000)});
})();
