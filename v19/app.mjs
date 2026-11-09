/* Salary Hero V19 — scene renderer and interaction. Never draw home-master concept screenshot. */
import {ITEMS,ENCOUNTERS,STORAGE_KEY,initial,normalize,enemyFor,todayTW,transition,salaryAt,playerTitle,cleanPlayerName} from './engine.mjs';
import {HERO_STYLES,ALL_ENEMIES} from './roster.mjs';
import {SKINS,skinById} from './skins.mjs';
import {renderSkinPanel} from './skin-ui.mjs';
const $=s=>document.querySelector(s);
const world=$('#world'),ctx=world.getContext('2d');
const LOGICAL_WIDTH=720,LOGICAL_HEIGHT=620;
const PIXEL_SCALE=Math.max(1,Math.min(2,Math.ceil(window.devicePixelRatio||1)));
world.width=LOGICAL_WIDTH*PIXEL_SCALE;
world.height=LOGICAL_HEIGHT*PIXEL_SCALE;
const panel=$('#panel'),body=$('#panel-content');
const save=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){console.warn('存檔失敗',e)}};
const format=n=>Number(n||0).toLocaleString('zh-TW');
const money=(n,d=0)=>'NT$'+Number(n||0).toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d});
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadGame(){
 let raw;try{raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{}
 if(raw?.version===19)return normalize(raw);
 const s=initial();
 // One-time migration: keep genuine V18 combat progress and work-shop unlocks.
 try{
  const old=JSON.parse(localStorage.getItem('salary-hero-v18-battle-save-v1')||'null');
  if(old&&typeof old==='object'){
   s.gold=Math.max(0,Math.floor(Number(old.gold)||0));
   s.cleared=Math.max(0,Math.floor(Number(old.kills)||0));
   s.wave=Math.max(1,Math.floor(Number(old.wave)||1));
   s.enemy=enemyFor(s.wave);
   s.log=['♻️ 已繼承 V18 的關卡、金幣和擊敗數。',...s.log];
   if(Number(old.paper)>0)s.log.unshift('舊版神祕文件 '+Math.floor(Number(old.paper))+' 張保留於原版存檔。');
  }
  const oldShop=JSON.parse(localStorage.getItem('salary-hero-work-shop-v1')||'null');
  if(oldShop?.owned){
   const map={iron:'laptop',gold:'notice'};
   for(const id of oldShop.owned){if(map[id]&&!s.owned.includes(map[id]))s.owned.push(map[id]);}
   if(map[oldShop.equipped])s.equipped=map[oldShop.equipped];
  }
 }catch(e){console.warn('舊存檔無法轉入',e)}
 return normalize(s);
}
let state=loadGame();save();
let currentPanel='',ready=false,lastAttack=0,fx=null,images={},failure='',lastFrame=0;
const assetPaths={
 bg:'../art/v19/runtime/backgrounds/office-night.svg',
 foreground:'../art/v19/runtime/foreground/cherry-filigree.svg',
 weaponBriefcase:'../art/v19/runtime/weapons/ornate-briefcase.svg',
 hero:'../art/v19/candidates/hero/idle.svg',
 heroAttack:'../art/v19/candidates/hero/attack.svg',
 heroHurt:'../art/v19/candidates/hero/hurt.svg',
 heroVictory:'../art/v19/candidates/hero/victory.svg',
 heroSleep:'../art/v19/candidates/hero/sleep.svg',
 minion:'../art/paper-minion.svg',
 boss:'../art/printer-boss.svg',
 weapon:'../art/equipment-weapon.svg',
 slash:'../art/v19/candidates/effects/slash.svg',
 impact:'../art/v19/candidates/effects/impact.svg'
};
function imageFrom(url){
 return new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('無法載入 '+url));img.src=new URL(url,import.meta.url).href;
 });
}
function drawImageCover(img,offset){
 const W=LOGICAL_WIDTH,H=LOGICAL_HEIGHT,ratio=Math.max(W/img.width,H/img.height),w=img.width*ratio,h=img.height*ratio;
 ctx.drawImage(img,(W-w)/2+offset,(H-h)/2-25,w,h);
}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function glow(x,y,r,col){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function shadow(x,y,rx,ry){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);circle(0,0,1,'#110a25aa');ctx.restore()}
function drawWeapon(x,y,t){
 const item=ITEMS.find(x=>x.id===state.equipped)||ITEMS[0];
 ctx.save();ctx.translate(x,y);ctx.rotate((t<.3?.3:-.15)+Math.sin(performance.now()/510)*.08);
 ctx.shadowBlur=item.id==='excalibur'?28:item.id==='notice'?18:8;
 ctx.shadowColor=item.id==='excalibur'?'#77f5ff':item.id==='notice'?'#ffe787':'#d9a9ff';
 if(item.id==='briefcase'){ctx.drawImage(images.weaponBriefcase,-43,-20,79,85);}
 else if(item.id==='excalibur'){ctx.drawImage(images.weapon,-32,-88,85,100);}
 else {ctx.font='bold 53px system-ui';ctx.textAlign='center';ctx.fillText(item.icon,0,5);}
 ctx.restore();
}
function paintEnemy(enemy,now){
 const w=enemy.boss?198:177,h=enemy.boss?230:240;
 const sprite=enemy.sprite==='printer'?images.boss:enemy.sprite==='paper'?images.minion:null;
 if(sprite)ctx.drawImage(sprite,0,0,w,h);
 else{
   ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.shadowBlur=22;ctx.shadowColor=enemy.accent||'#d8b3fb';
   ctx.font=(enemy.boss?142:127)+'px "Apple Color Emoji","Segoe UI Emoji",system-ui';
   ctx.fillText(enemy.icon||'❔',w/2,h*.51);
   ctx.restore();
 }
 if(enemy.trait==='guard'){
   ctx.save();ctx.globalAlpha=.33+.12*Math.sin(now/420);ctx.strokeStyle=enemy.accent||'#aee6ff';
   ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(w/2,h/2,w*.50,h*.49,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 if(enemy.trait==='leech'){
   ctx.save();ctx.globalAlpha=.30+.20*Math.sin(now/400);glow(w/2,h*.46,85,enemy.accent?enemy.accent+'55':'#8fe8bb55');ctx.restore();
 }
}
function drawStage(now){
 if(!ready)return;
 const W=LOGICAL_WIDTH,H=LOGICAL_HEIGHT,time=now/1000,bgShift=Math.sin(time*.35)*10;
 ctx.setTransform(PIXEL_SCALE,0,0,PIXEL_SCALE,0,0);
 ctx.clearRect(0,0,W,H);
 drawImageCover(images.bg,bgShift);
 const dim=ctx.createLinearGradient(0,0,0,H);dim.addColorStop(0,'#120b2919');dim.addColorStop(.65,'#160e254d');dim.addColorStop(1,'#120b27de');ctx.fillStyle=dim;ctx.fillRect(0,0,W,H);
 // Living environment: separate floating light sources, mist, floor and sparks.
 for(let i=0;i<14;i++){const x=(i*113+Math.sin(time*.3+i)*13)%W,y=(i*79+Math.sin(time*.8+i)*14)%(H-60);glow(x,y,7+i%4*4,i%3?'#ffc4703b':'#aa8bff48');}
 glow(126,88,135,'#ffd58a34');glow(614,165,175,'#a575ff35');
 ctx.fillStyle='#382148aa';ctx.beginPath();ctx.ellipse(365,550,380,81,0,0,Math.PI*2);ctx.fill();
 const phase=fx?Math.min((now-fx.start)/1000,2):3,attacking=fx&&phase<.7;
 const lunge=attacking?(phase<.20?phase/.20*86:phase<.39?86:86*Math.max(0,1-(phase-.39)/.27)):0;
 const heroX=100+lunge,heroY=227+Math.sin(time*3.2)*4;
 shadow(heroX+133,515,110,17);
 ctx.save();ctx.translate(heroX+120,heroY+148);ctx.rotate(attacking&&phase<.32?-.09:Math.sin(time*1.4)*.018);ctx.translate(-120,-148);
 const pose=attacking
   ?(fx?.result?.type==='victory'&&phase>.42?images.heroVictory:phase>.53&&phase<.75?images.heroHurt:images.heroAttack)
   :(!state.auto?images.heroSleep:images.hero);
 ctx.drawImage(pose,0,0,236,306);
 // Engineering preview only: nondefault outfits have no approved animation sprites yet.
 if(state.activeSkin!=='starter'){
   const selected=skinById(state.activeSkin);
   if(selected){
     ctx.save();ctx.font='36px "Apple Color Emoji","Segoe UI Emoji",system-ui';
     ctx.textAlign='center';ctx.fillText(selected.icon,218,16);ctx.restore();
   }
 }
 ctx.restore();
 glow(heroX+162,heroY+163,state.equipped==='excalibur'?105:46,state.equipped==='excalibur'?'#73ddff50':'#ffd28b25');
 drawWeapon(heroX+188,heroY+222,phase);
 // Party pet is independently animated, not baked into the background.
 ctx.save();ctx.translate(55,478+Math.sin(time*2)*4);ctx.font='55px system-ui';ctx.fillText('🐈',0,0);ctx.restore();
 const victory=fx?.result?.type==='victory'&&phase<.95;
 const victim=victory&&phase<.69?fx.oldEnemy:state.enemy;
 const opacity=victory?(phase<.69?Math.max(0,1-Math.max(0,phase-.31)*2.6):Math.min(1,(phase-.69)*5)):1;
 const enemyX=474+Math.sin(time*1.75)*4+(attacking&&phase>.25&&phase<.6?Math.sin(now/22)*11:0);
 const enemyY=260+Math.sin(time*2)*7;
 shadow(enemyX+75,525,victim.boss?100:84,17);
 ctx.save();ctx.globalAlpha=opacity;ctx.translate(enemyX+88,enemyY+121);ctx.rotate(Math.sin(time*1.1)*.03+(attacking&&phase>.3&&phase<.53?.12:0));ctx.translate(-88,-121);
 paintEnemy(victim,now);
 ctx.restore();
 if(victory&&phase>.7&&phase<1.2){
  const fade=Math.min(1,(phase-.7)*3);ctx.save();ctx.globalAlpha=fade;
  ctx.translate(enemyX,enemyY);paintEnemy(state.enemy,now);ctx.restore();
 }
 if(attacking&&phase>.17&&phase<.55){
   ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(.55-phase)*3.2));ctx.translate(343,287);ctx.rotate(-.2);
   ctx.drawImage(images.slash,-85,-80,286,240);ctx.restore();
 }
 if(attacking&&phase>.27&&phase<.68){
   const strength=Math.max(0,Math.min(1,(.68-phase)*4));ctx.save();ctx.globalAlpha=strength;
   ctx.drawImage(images.impact,enemyX+18,enemyY+38,156,156);ctx.restore();
 }
 if(attacking&&phase>.17&&phase<.55){
   const alpha=(.55-phase)/.38;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#aafaff';ctx.shadowColor='#55dbff';ctx.shadowBlur=25;ctx.lineWidth=20;
   ctx.beginPath();ctx.arc(395,370,110,-1.4,1.3);ctx.stroke();ctx.lineWidth=6;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(400,366,124,-1.4,1.3);ctx.stroke();ctx.restore();
 }
 if(fx&&(fx.result?.type==='hit'||fx.result?.type==='victory')&&phase<1.05){
  const y=335-phase*80;ctx.save();ctx.globalAlpha=Math.min(1,(1.05-phase)*3);ctx.font='900 43px system-ui';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2d163c';ctx.strokeText('-'+fx.result.damage,546,y);ctx.fillStyle=fx.result.crit?'#fff3a9':'#ff8a9e';ctx.fillText('-'+fx.result.damage,546,y);ctx.restore();
 }
 if(victory&&phase<1.35){ctx.save();ctx.globalAlpha=Math.min(1,(1.35-phase)*2);ctx.textAlign='center';ctx.font='bold 32px system-ui';ctx.fillStyle='#ffdb88';ctx.strokeStyle='#32132e';ctx.lineWidth=5;ctx.strokeText('勝利！ +'+fx.result.gold+' 🪙',365,170);ctx.fillText('勝利！ +'+fx.result.gold+' 🪙',365,170);ctx.restore();}
 // Art is rendered in physical layers: background, moving actors, combat FX,
 // independent cherry blossom / gilded foreground, then free-floating lights.
 ctx.save();
 ctx.globalAlpha=.94;
 ctx.drawImage(images.foreground,Math.cos(time*.30)*4,0,W,H);
 ctx.restore();
 for(let i=0;i<18;i++){
  const speed=10+(i%4)*7;
  const x=(i*109+Math.sin(time*.38+i*.6)*25+W)%W;
  const y=(H+((i*97-time*speed)%(H+90)))%(H+90)-30;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time*1.5+i)*.3);
  const col=i%5===0?'#c7b4ff':i%3===0?'#ffdba9':'#ffb9d8';
  ctx.fillStyle=col;ctx.globalAlpha=.22+(Math.sin(time*2+i)+1)*.14;
  ctx.beginPath();ctx.ellipse(0,0,3+i%3,5+i%4,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
 }
}
function render(){
 $('#gold').textContent=format(state.gold);$('#gems').textContent=format(state.gems);
 const ticketCounter=$('#skin-tickets');if(ticketCounter)ticketCounter.textContent=format(state.skinTickets);
 $('#wave').textContent='第 '+state.wave+' 關 · '+(state.enemy.boss?'首領戰':'辦公室走廊');
 $('#wave').classList.toggle('boss',state.enemy.boss);
 $('#level').textContent='Lv.'+state.level+' '+playerTitle(state);
 $('#hero-hp-text').textContent=Math.ceil(state.heroHp)+'/'+Math.ceil(state.maxHp);
 $('#hero-hp-fill').style.width=(state.heroHp/state.maxHp*100)+'%';
 $('#enemy-hp-fill').style.width=(state.enemy.hp/state.enemy.maxHp*100)+'%';
 $('#enemy-name').textContent=state.enemy.name;
 const trait=$('#enemy-trait');if(trait)trait.textContent=state.enemy.family+' · '+state.enemy.traitText;
 $('#game-log').textContent=state.log[0]||'冒險中';
 $('#auto').textContent='🤖 自動 '+(state.auto?'ON':'OFF');
 $('#auto').setAttribute('aria-pressed',String(state.auto));
 $('#speed').textContent='⏩ 速度 ×'+state.speed;
 $('#heal').textContent='❤️ 治療 ×'+state.potions;
 $('#heal').disabled=!ready||state.potions===0||state.heroHp===state.maxHp;
 $('#attack').disabled=!ready;$('#claim').disabled=!ready||state.pendingDrops.length===0;$('#chest').disabled=!ready||state.chests===0;
 $('#claim').textContent='🎁 掉寶 ('+state.pendingDrops.length+')';
 $('#chest').textContent='📦 寶箱 ('+state.chests+')';
 if(currentPanel&&panel.open)renderPanel(currentPanel);
}
function commit(action){
 const type=typeof action==='string'?action:action?.type;
 if(!ready&&!['setName','toggleFavoriteStyle','equipSkin','drawSkin','claimSkinEvent'].includes(type))return;
 const oldEnemy={...state.enemy},wasWave=state.wave;
 state=transition(state,action);
 if(action==='attack'){
   fx={start:performance.now(),result:state.last,oldEnemy,wave:wasWave};
   lastAttack=performance.now();
 }else if(state.last?.type==='heal'||state.last?.type==='chest')fx={start:performance.now(),result:state.last,oldEnemy};
 save();render();
}
const btn=(label,act,payload='',disabled=false)=>'<button class="panel-button" data-action="'+act+'" data-value="'+payload+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
function itemRow(it,kind){
 const owned=state.owned.includes(it.id),equipped=it.id===state.equipped;
 const action=kind==='shop'?'buy':'equip',disabled=kind==='shop'?(owned||it.cost>state.gold):(!owned||equipped);
 const text=kind==='shop'?(owned?'已擁有':'購買 '+it.cost+'🪙'):(equipped?'裝備中':owned?'穿上':'未解鎖');
 return '<div class="item '+(!owned&&kind!=='shop'?'muted':'')+'"><div class="symbol">'+(owned?it.icon:'◈')+'</div><div class="detail"><strong>'+it.name+'</strong><small>'+it.tier+' · ⚔️ 攻擊 '+it.attack+'</small></div><button data-action="'+action+'" data-value="'+it.id+'" '+(disabled?'disabled':'')+'>'+text+'</button></div>';
}
function renderPanel(type){
 currentPanel=type;
 const headers={hero:'角色狀態',styles:'造型衣櫃・活動與抽獎',equipment:'裝備背包',adventure:'每日奇遇',collection:'怪物圖鑑',shop:'商店',salary:'薪資中心'};
 $('#panel-title').textContent=headers[type]||'薪水勇者';
 if(type==='hero'){
  const it=ITEMS.find(x=>x.id===state.equipped);
  body.innerHTML='<div class="center"><span class="large-symbol">🧑‍💼</span><h3>Lv.'+state.level+' '+escapeHTML(playerTitle(state))+'</h3></div><div class="item"><div class="detail"><strong>生命 '+Math.ceil(state.heroHp)+'/'+state.maxHp+'</strong><small>經驗 '+state.xp+'/'+(50+state.level*30)+' · 已擊敗 '+state.cleared+' 隻</small><small>第 '+state.wave+' 關 · 每四關為首領戰，勝利回滿血</small></div></div><div class="item"><span class="symbol">'+it.icon+'</span><div class="detail"><strong>'+it.name+'</strong><small>目前攻擊 '+it.attack+' · 藥水 '+state.potions+'</small></div></div>'+'<div class="item"><div class="detail"><strong>目前選用：'+escapeHTML(skinById(state.activeSkin)?.name||'平凡社畜')+'</strong><small>已取得 '+state.ownedSkins.length+'/'+SKINS.length+' 套造型 · 🎟️ '+state.skinTickets+' 張造型券</small></div></div>'
  +btn('✎ 修改遊戲名稱','rename')+btn('🎭 造型衣櫃與活動抽獎','styles')+btn('治療 +65 HP','heal','',!state.potions||state.heroHp===state.maxHp);
 } else if(type==='styles'){
  body.innerHTML=renderSkinPanel(state);
 } else if(type==='equipment'){
  body.innerHTML='<p>更換裝備立即影響實際傷害，戰場中的武器外觀也會切換。</p>'+ITEMS.map(it=>itemRow(it,'equip')).join('')+(state.pendingDrops.length?'<p>有 '+state.pendingDrops.length+' 件掉寶待領取。</p>'+btn('領取掉寶','claim'):'');
 } else if(type==='shop'){
  body.innerHTML='<p>目前持有 <b>🪙 '+format(state.gold)+'</b>。購買立即扣款並裝備；進度會存檔。</p>'+ITEMS.filter(it=>it.cost).map(it=>itemRow(it,'shop')).join('');
 } else if(type==='adventure'){
  const e=ENCOUNTERS.find(x=>x.id===state.encounterPending),today=todayTW();
  if(e){
   body.innerHTML='<div class="center"><span class="large-symbol">'+e.icon+'</span><h3>'+e.name+'</h3><p>'+e.text+'</p><small>今日奇遇：'+state.encounterDay+'</small></div><div class="choices">'+e.choices.map((c,i)=>'<button data-action="choice" data-value="'+i+'">'+c.text+'　(+🪙'+c.gold+' / EXP '+c.xp+')</button>').join('')+'</div>';
  }else if(state.encounterDay===today){
   body.innerHTML='<div class="center"><span class="large-symbol">📜</span><h3>今天的奇遇已完成</h3><p>每天可以體驗一次新事件，無法重複領取獎勵。</p></div>';
  }else{
   body.innerHTML='<div class="center"><span class="large-symbol">🗺️</span><h3>今天有新的奇遇</h3><p>不同選擇會影響金幣、經驗與生命值。</p></div>'+btn('✦ 探索今日奇遇','encounterStart');
  }
  body.innerHTML+='<p>累積奇遇完成：'+state.encounterHistory.length+' 次</p>'+state.encounterHistory.slice(0,4).map(x=>'<div class="item"><span>'+x.day+'</span><small>'+ENCOUNTERS.find(e=>e.id===x.id)?.name+'</small></div>').join('');
 }else if(type==='collection'){
  const defeated=state.defeatedTypes||[];
  body.innerHTML='<p>目前已發現 '+defeated.length+'/'+ALL_ENEMIES.length+' 種敵人（含 8 種首領）。每四關一場首領戰；未擊敗前顯示剪影。部分敵人戰場圖示仍是暫用圖示，尚未有合格正式精靈。</p>'
    +ALL_ENEMIES.map(e=>{
      const known=defeated.includes(e.id);
      return '<div class="item '+(known?'':'muted')+'"><span class="symbol">'+(known?e.icon:'◼️')+'</span><div class="detail"><strong>'+(known?escapeHTML(e.name):'??? 未發現敵人')+'</strong><small>'+(known?escapeHTML(e.family+' · '+e.traitText):'擊敗後解鎖資料')+'</small></div></div>';
    }).join('')
    +'<h3>📦 裝備收藏</h3>'+ITEMS.map(it=>'<div class="item '+(!state.owned.includes(it.id)?'muted':'')+'"><span class="symbol">'+(state.owned.includes(it.id)?it.icon:'◼️')+'</span><div class="detail"><strong>'+(state.owned.includes(it.id)?it.name:'??? 尚未取得')+'</strong><small>'+it.tier+'裝備</small></div></div>').join('');
 }else if(type==='salary'){
  const p=salaryAt();
  body.innerHTML='<div class="center"><h3>'+p.year+'/'+p.monthNumber+'/'+p.day+' · '+p.status+'</h3><p>今日 <strong>'+money(p.today,2)+'</strong></p></div><div class="item"><span>本週累積</span><strong>'+money(p.week)+'</strong></div><div class="item"><span>本月累積</span><strong>'+money(p.month)+'</strong></div><div class="item"><span>月薪設定</span><strong>'+money(p.monthly)+'</strong></div><p>依台灣時間週一至週五 08:00–17:00、午休計薪推估。未納入國定假日、請假、稅費與加班，與遊戲金幣完全獨立。</p><a href="../salary-center-v2.html" target="_blank" rel="noopener">開啟原有詳細薪資設定中心</a>';
 }
}
function openPanel(type){renderPanel(type);if(!panel.open)panel.showModal();}
$('#panel-close').onclick=()=>panel.close();panel.addEventListener('close',()=>{currentPanel=''});
body.addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b||b.disabled)return;
 const act=b.dataset.action;
 if(act==='rename')openNameEditor();
 else if(act==='styles')renderPanel('styles');
 else if(act==='equipSkin')commit({type:'equipSkin',id:b.dataset.value});
 else if(act==='claimSkinEvent')commit({type:'claimSkinEvent',id:b.dataset.value});
 else if(act==='drawSkin')commit('drawSkin');
 else if(act==='favoriteStyle')commit({type:'toggleFavoriteStyle',id:b.dataset.value});
 else if(act==='choice')commit({type:'encounterChoose',choice:Number(b.dataset.value)});
 else if(act==='equip'||act==='buy')commit({type:act,id:b.dataset.value});
 else commit(act);
});
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));
$('#pay-details').onclick=()=>openPanel('salary');
const nameDialog=$('#name-dialog'),nameInput=$('#player-name-input'),nameMessage=$('#name-message'),namePreview=$('#name-preview');
function openNameEditor(){
 if(panel.open)panel.close();
 nameInput.value=state.playerName||'';
 namePreview.textContent='平凡社畜・'+(cleanPlayerName(nameInput.value)||'你的名字');
 nameMessage.textContent='';
 if(!nameDialog.open)nameDialog.showModal();
 nameInput.focus();
}
nameInput.addEventListener('input',()=>{
 namePreview.textContent='平凡社畜・'+(cleanPlayerName(nameInput.value)||'你的名字');
 nameMessage.textContent=Array.from(nameInput.value).length>12?'最多 12 個字（超出的部分會被截斷）':'';
});
$('#name-form').addEventListener('submit',event=>{
 event.preventDefault();
 const nickname=cleanPlayerName(nameInput.value);
 if(!nickname){nameMessage.textContent='請輸入至少 1 個字的遊戲名。';return;}
 commit({type:'setName',value:nickname});
 if(!state.playerName){nameMessage.textContent='存檔失敗，請再試一次。';return;}
 nameDialog.close();
 render();
});
nameDialog.addEventListener('cancel',event=>{if(!state.playerName)event.preventDefault()});
nameDialog.addEventListener('close',()=>{if(!state.playerName)openNameEditor()});
$('#attack').onclick=()=>attack();
$('#auto').onclick=()=>commit({type:'auto',value:!state.auto});
$('#speed').onclick=()=>commit({type:'speed',value:state.speed===1?2:1});
$('#heal').onclick=()=>commit('heal');
$('#claim').onclick=()=>commit('claim');
$('#chest').onclick=()=>commit('chest');
world.addEventListener('pointerup',e=>{
 const rect=world.getBoundingClientRect();
 const x=(e.clientX-rect.left)/rect.width;
 if(x>.48)attack();
});
function attack(){
 if(!ready)return;
 const now=performance.now();
 if(fx&&now-fx.start<680/state.speed)return;
 commit('attack');
}
function payRender(){
 const p=salaryAt(Date.now(),40000);
 $('#today').textContent=money(p.today,2);
 $('#pay-status').textContent='台灣時間 · '+p.status;
 $('#pay-month').textContent='本週 '+money(p.week)+' · 本月 '+money(p.month);
 $('#work-time').textContent=p.on?'🟢 上班 '+p.workedHours.toFixed(2)+' h':'08:00–17:00';
 if(currentPanel==='salary'&&panel.open)renderPanel('salary');
}
function frame(now){
 if(!document.hidden&&ready){
  if(state.auto&&now-lastAttack>1450/state.speed&&(!fx||now-fx.start>=680/state.speed))attack();
  drawStage(now);
 }
 requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)lastAttack=performance.now()});
window.addEventListener('pagehide',save);
render();payRender();setInterval(payRender,1000);requestAnimationFrame(frame);
if(!state.playerName)openNameEditor();
Promise.all(Object.entries(assetPaths).map(async ([k,url])=>{images[k]=await imageFrom(url)})).then(()=>{
 ready=true;lastAttack=performance.now();render();
}).catch(err=>{
 failure=String(err.message||err);$('#game-log').textContent='❌ 動態遊戲素材載入失敗：'+failure+'。請確認網頁是透過 HTTP(S) 開啟。';
 console.error(err);render();
});