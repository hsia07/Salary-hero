/* V12.3 region expedition: deterministic encounters, boss milestones and rewards. */
(()=>{'use strict';
const SAVE='salary-hero-v51',KEY='salary-hero-region-v123';
const REGIONS=[
{name:'文書荒原',mobs:['催件哥布林','退件騎士'],boss:'千頁週報巨像',relic:'荒原封蠟'},
{name:'卡紙機械森林',mobs:['卡紙魔像','印表機怨靈'],boss:'紙匣之王',relic:'機械樹心'},
{name:'午休迷霧谷',mobs:['午休破壞者','咖啡因幽靈'],boss:'永不打烊的鬧鐘',relic:'迷霧茶葉'},
{name:'無盡會議高塔',mobs:['會議骷髏兵','報表九頭蛇'],boss:'議程吞噬者',relic:'高塔徽印'},
{name:'週五夕陽王城',mobs:['週報蝙蝠','摸魚企鵝'],boss:'夕陽守門人',relic:'落日王冠碎片'},
{name:'傳說加班深淵',mobs:['月底帳單惡魔','待辦事項增殖體'],boss:'無限加班魔龍',relic:'自由火種'}];
const hash=str=>{let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const taiwan=()=>{const a=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),p={};a.forEach(x=>p[x.type]=x.value);return {date:p.year+'-'+p.month+'-'+p.day,weekday:p.weekday,minutes:Math.max(0,Math.min(540,+p.hour*60+(+p.minute)-480))}};
let state;try{state=JSON.parse(localStorage.getItem(KEY))}catch{}
if(!state||!Array.isArray(state.cleared))state={cleared:[],history:[]};
const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x};
const css=el('style');css.textContent=`
.region-expedition{border:2px solid #9c855a;border-radius:15px;padding:16px;margin:12px 0;background:linear-gradient(145deg,#263b43,#152735);color:#f2e4cb}
.region-expedition h3{margin:0 0 10px;color:#f4d79b;font:700 19px Georgia,serif}
.region-expedition .region-line{margin:8px 0;font-size:13px;line-height:1.6}
.region-expedition .region-track{height:10px;border-radius:10px;background:#0b1b25;overflow:hidden;border:1px solid #566c70}
.region-expedition .region-track i{display:block;height:100%;background:linear-gradient(90deg,#789f8a,#e7c580)}
.region-expedition .region-boss{margin-top:12px;padding:12px;border:1px solid #826c4c;border-radius:10px;background:#182d37}
.region-expedition button{width:100%;min-height:44px;border-radius:9px;margin-top:9px;background:linear-gradient(#eed7a2,#b99a63);border:1px solid #f4dbad;color:#152735;font-weight:800}
.region-expedition button:disabled{opacity:.5}
.region-expedition .region-reward{color:#e9c989;font-size:12px}
.region-arena{position:relative;height:175px;overflow:hidden;margin-top:12px;border:1px solid #b89a68;border-radius:12px;background:radial-gradient(circle at 50% 10%,#647e87,#263d49 55%,#152936);isolation:isolate}
.region-arena:before{content:"";position:absolute;bottom:0;width:100%;height:42px;background:linear-gradient(#65735c,#314a45)}
.region-hero,.region-monster{position:absolute;bottom:32px;display:grid;place-items:center;transition:transform .18s}
.region-hero{left:12%;width:64px;height:95px;filter:drop-shadow(0 4px 3px #07151c)}
.region-monster{right:10%;width:105px;height:105px;filter:drop-shadow(0 5px 5px #0b1720)}
.region-hero svg,.region-monster svg{width:100%;height:100%}
.region-hero.strike{transform:translateX(85px)}
.region-monster.hurt{transform:translateX(9px) rotate(8deg);filter:brightness(1.6)}
.region-arena .hp-label{position:absolute;top:8px;left:8px;right:8px;font-size:12px;color:#f8e1ad;text-align:center;background:#152935c9;padding:6px;border-radius:7px}
.region-arena .hp-meter{height:6px;background:#18222b;border-radius:8px;margin-top:4px;overflow:hidden}
.region-arena .hp-meter i{display:block;height:100%;background:#d57c75}
.region-arena .battle-message{position:absolute;bottom:5px;left:8px;right:8px;text-align:center;font-size:11px;color:#fff0c9;text-shadow:0 2px 3px #07151c}
`;document.head.append(css);
let root,header,desc,track,boss,button,reward,arena,combatTimer=null,combatKey='',combatHp=0,combatMax=0,combatHits=0;
function mount(){if(root)return;const home=document.getElementById('home');if(!home)return;root=el('section',undefined,'region-expedition');root.setAttribute('aria-label','區域遠征');header=el('h3');desc=el('div',undefined,'region-line');track=el('div',undefined,'region-track');track.append(el('i'));boss=el('div',undefined,'region-boss');button=el('button');button.type='button';button.addEventListener('click',claim);reward=el('div',undefined,'region-reward');arena=el('div',undefined,'region-arena');arena.innerHTML='<div class="hp-label"><span id="region-hp-label">首領等待挑戰</span><div class="hp-meter"><i id="region-hp-fill" style="width:100%"></i></div></div><div class="region-hero" id="region-hero"><svg viewBox="0 0 70 100" aria-hidden="true"><path d="M17 95 21 52 10 38 23 24 48 24 60 38 49 52 53 95Z" fill="#7ca2a2" stroke="#e8d29a" stroke-width="3"/><circle cx="35" cy="20" r="17" fill="#e5bc96"/><path d="M18 18Q15 -1 35 3Q55 -1 52 18L43 11 27 11Z" fill="#253444"/><path d="M60 36 66 90" stroke="#e8e8dd" stroke-width="6"/><path d="M56 47 69 44" stroke="#cfae74" stroke-width="5"/></svg></div><div class="region-monster" id="region-monster"><svg viewBox="0 0 110 110" aria-hidden="true"><path d="M13 94Q-3 56 27 29L18 9 47 22Q61 13 77 25L96 9 91 40Q114 70 94 95Z" fill="#91658d" stroke="#e1b37e" stroke-width="4"/><circle cx="39" cy="56" r="6" fill="#f7e2ac"/><circle cx="72" cy="56" r="6" fill="#f7e2ac"/><path d="M43 77Q56 88 70 77" fill="none" stroke="#392e45" stroke-width="5"/></svg></div><div class="battle-message" id="region-battle-message">首領等待挑戰</div>';root.append(header,desc,track,boss,arena,button,reward);const discoveries=home.querySelector('.discovery-board');if(discoveries)discoveries.insertAdjacentElement('afterend',root);else home.append(root)}
function current(){const t=taiwan(),active=t.weekday!=='Sat'&&t.weekday!=='Sun',unlocked=active?Math.min(3,Math.floor(t.minutes/180)):0,stage=active?Array.from({length:3},(_,i)=>i).find(i=>i<unlocked&&!state.cleared.includes(t.date+':'+i))??Math.min(2,unlocked):0,idx=(hash('region:'+t.date)%REGIONS.length+stage)%REGIONS.length;return {t,active,stage,idx,region:REGIONS[idx],key:t.date+':'+stage,progress:active?Math.min(180,t.minutes-stage*180):0,ready:active&&stage<3&&t.minutes>=(stage+1)*180}}
function claim(){const d=current();if(!d.ready||state.cleared.includes(d.key)||combatTimer)return;startCombat(d)}
function startCombat(d){combatKey=d.key;combatMax=100+d.stage*55;combatHp=combatMax;combatHits=0;button.disabled=true;button.textContent='自動戰鬥進行中';const hero=document.getElementById('region-hero'),monster=document.getElementById('region-monster'),label=document.getElementById('region-hp-label'),fill=document.getElementById('region-hp-fill'),msg=document.getElementById('region-battle-message');msg.textContent='勇者自動迎戰 '+d.region.boss;label.textContent=d.region.boss+' · '+combatHp+' / '+combatMax;fill.style.width='100%';combatTimer=setInterval(()=>{if(document.hidden)return;const damage=15+(hash(combatKey+':'+combatHits)%16);combatHits++;combatHp=Math.max(0,combatHp-damage);hero.classList.add('strike');monster.classList.add('hurt');setTimeout(()=>{hero.classList.remove('strike');monster.classList.remove('hurt')},180);label.textContent=d.region.boss+' · '+combatHp+' / '+combatMax;fill.style.width=Math.round(combatHp/combatMax*100)+'%';msg.textContent='自動攻擊 · -'+damage+' HP';if(combatHp<=0){clearInterval(combatTimer);combatTimer=null;msg.textContent='首領討伐成功！正在結算戰利品';finishCombat(d)}},650)}
function finishCombat(d){if(state.cleared.includes(d.key))return;let save;try{save=JSON.parse(localStorage.getItem(SAVE)||'null')}catch{}if(!save||save.version!==51)return;const gold=45+d.stage*20,parts=2+d.stage;save.coins=(Number(save.coins)||0)+gold;save.materials=(Number(save.materials)||0)+parts;save.logs=Array.isArray(save.logs)?save.logs:[];save.logs.unshift('區域首領 '+d.region.boss+' 擊敗！+'+gold+' 金幣、+'+parts+' 零件');save.logs=save.logs.slice(0,12);try{localStorage.setItem(SAVE,JSON.stringify(save));state.cleared.push(d.key);state.history.unshift({key:d.key,region:d.region.name,boss:d.region.boss,relic:d.region.relic});state.history=state.history.slice(0,100);localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.error('Expedition reward save failed',e);return}render()}
function render(){mount();if(!root)return;const d=current(),done=state.cleared.includes(d.key),saveAvailable=!!localStorage.getItem(SAVE);header.textContent='區域遠征 · '+d.region.name;desc.textContent='區域敵人：'+d.region.mobs.join('、')+'。上班冒險時間自動推進遠征，每三小時完成一段區域。';track.firstElementChild.style.width=Math.round(d.progress/180*100)+'%';boss.textContent='區域首領：'+d.region.boss+' · '+(done?'已討伐':d.ready?'已達成遠征條件':d.active?'遠征進行中':'等待工作日');button.textContent=combatTimer?'自動戰鬥進行中':done?'本區域獎勵已領取':d.ready?'挑戰區域首領（自動戰鬥）':'遠征進度 '+Math.floor(d.progress)+' / 180 分鐘';button.disabled=!!combatTimer||done||!d.ready||!saveAvailable;reward.textContent='戰利品：'+d.region.relic+'（收藏紀錄） · 已完成 '+state.history.length+' 次區域遠征。獎勵會加入現有金幣與鍛造零件。'}
document.addEventListener('DOMContentLoaded',()=>{render();setInterval(render,15000)});
})();