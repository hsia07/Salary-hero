/** 正式小隊戰鬥（GAME_V2：薪奴親自上場＋前排 3／後排 3 同事，共 7 人；ARCHITECTURE §7 2026-11-20）。
 * - 薪奴有獨立欄位，站前排或後排由他的職業決定（hero-jobs.mjs）；同事依編隊前後排。
 * - 只有已完成正式逐格美術的角色會上場（目前：薪奴現行素材、白律）；沒有美術的同事不上場，不以色塊代替。
 * - 第一章 6 關（squad-campaign.mjs），波次、Boss、三星；結算由引擎 squadStageClear 寫入存檔（onClear 由 app 提供）。
 * - 玩家操作：點下方角色卡（能量滿時發亮）＝放該角色大招；點敵人＝集火。
 * - 畫面上的血量、傷害數字延到命中格才顯示；放大招期間模擬暫停。
 */
import {createFormationBattle,tickFormationBattle,castUltimate} from './formation-combat-runtime.mjs?v=2';
import {loadCharAnim,createFrameActor} from './char-frames.mjs?v=3';
import {BAILU_ULT_TOTAL_MS,BAILU_CUTIN_MS,BAILU_ULT_MS} from './bailu-timing.mjs';
import {ultPhases,drawUltBack,drawUltFront,ultCamera,drawCutin,loadUltVfx} from './bailu-ult-fx.mjs?v=5';
import {CHAPTER1,MONSTERS,waveEnemies,starsFor,STAR_RULES,normalizeCampaign,stageUnlocked,nextStage,enemyUnits} from './squad-campaign.mjs?v=2';

// 戰鬥世界座標沿用 720×620（與首頁、大招特效一致）；畫布為直式，世界往下平移填滿手機畫面
const W=720,H=1220,FLOOR=525,DY=455;
const ART=['idle','attack','hurt','defeat'];
const load=s=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error('載入失敗 '+s));i.src=s;});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STARS=st=>[0,1,2].map(i=>`<span class="sb-star" data-on="${!!st?.[i]}">★</span>`).join('');
/** 7 人站位：前排 3 道、後排 3 道（同道後排略高、偏左）。我方縮放 0.82，讓 7 人與敵人同屏。 */
const K=.82,LANES=[-55,15,85]; // 依道（0 上、1 中、2 下）的景深；中道優先入座
const slotPos=(row,lane)=>row==='rear'?{x:10,fy:LANES[lane]-28}:{x:150,fy:LANES[lane]};
/** 有大招演出素材的角色（繪製特效、特寫）；沒有的角色不開放大招 */
const ULT_FX={lawyer:{phases:ultPhases(BAILU_CUTIN_MS,BAILU_ULT_MS),total:BAILU_ULT_TOTAL_MS}};

let root=null;
export function squadBattleAvailable(){return true;}

/** party：[{id,name,sub,portrait,anim,unit,trial}]，第一個是薪奴；campaign：存檔中的 squadCampaign */
export async function openSquadBattle({party,campaign:rawCampaign,onClear}){
 if(root)return;
 let campaign=normalizeCampaign(rawCampaign);
 root=document.createElement('div');root.id='squad-battle';root.setAttribute('role','dialog');root.setAttribute('aria-label','小隊戰鬥');
 root.innerHTML=`<div class="sb-wrap"><canvas width="${W}" height="${H}" aria-label="小隊戰鬥畫面，點敵人可集火"></canvas>
  <div class="sb-top" hidden><span class="sb-stage"></span><span class="sb-wave"></span><span class="sb-time"></span></div>
  <div class="sb-bar"><div class="sb-party"></div><button type="button" class="sb-exit" aria-label="離開">離開</button></div>
  <div class="sb-select"></div>
  <div class="sb-result" hidden></div></div>`;
 document.body.appendChild(root);
 const $=s=>root.querySelector(s);
 const close=()=>{cancelAnimationFrame(raf);root?.remove();root=null;delete window.__squad;};
 $('.sb-exit').onclick=close;
 const canvas=$('canvas'),ctx=canvas.getContext('2d');
 ctx.fillStyle='#120c1c';ctx.fillRect(0,0,W,H);ctx.fillStyle='#f3dfa0';ctx.font='24px serif';ctx.fillText('戰場準備中…',280,310);
 const types=Object.keys(MONSTERS),animIds=[...new Set(party.map(p=>p.anim))];
 const [bg,vfx,anims,...mons]=await Promise.all([load('../art/v20/runtime/backgrounds/battle-library-v20-p10.webp'),loadUltVfx('../art/characters/office-lawyer/vfx/'),
  Promise.all(animIds.map(loadCharAnim)),...types.flatMap(t=>ART.map(k=>load(`../art/v19/runtime/monsters/${t}/${k}.${MONSTERS[t].ext}`)))]);
 if(!root)return;
 const animOf=Object.fromEntries(animIds.map((id,i)=>[id,anims[i]]));
 const monArt=Object.fromEntries(types.map((t,i)=>[t,Object.fromEntries(ART.map((k,j)=>[k,mons[i*4+j]]))]));
 // 站位：依各自 row 排入該排的道（中央優先）
 const used={front:0,rear:0};
 const members=party.map(p=>{
  const row=p.unit.row==='rear'?'rear':'front',lane=[1,0,2][used[row]++]??1;
  const pos=slotPos(row,lane),fx=ULT_FX[p.anim]||null;
  return {...p,row,lane,...pos,fx,actor:createFrameActor(animOf[p.anim]),cutin:animOf[p.anim].cutin,
   unit:{...p.unit,row,lane,ultimate:fx?p.unit.ultimate:null}};
 });
 const mem=id=>members.find(m=>m.id===id);
 renderParty();

 // ── 狀態 ──
 let raf=0,mode='select',stage=nextStage(campaign),waveIdx=0,battle=null,foes=[],shownHp={},enemyState={},floating=[],deadAt={};
 let ult=null,ultUntil=0,focusId=null,simSeconds=0,carry=null,waveAt=0,ended=false,waveDone=false;

 function renderParty(){
  $('.sb-party').innerHTML=members.map(m=>`<button type="button" class="sb-pc" data-id="${esc(m.id)}" data-row="${m.row}" ${m.fx?'':'data-noult="true"'} aria-label="${esc(m.name)}${m.fx?'，能量滿時點擊放大招':''}">
   <img alt="" src="${esc(m.portrait)}"><b>${esc(m.name)}</b><small>${esc(m.sub)}</small><span class="sb-hp"><i></i></span><span class="sb-en"><i></i></span></button>`).join('');
  root.querySelectorAll('.sb-pc').forEach(b=>b.onclick=()=>castUlt(b.dataset.id));
 }

 // ── 選關（第一章）：章節地圖美術完成前的暫用介面 ──
 function renderSelect(){
  const i=CHAPTER1.indexOf(stage),open=stageUnlocked(campaign,stage.id),st=campaign.stars[stage.id];
  const kinds=[...new Set(stage.waves.flat().map(e=>MONSTERS[e.type].name))];
  const trial=members.filter(m=>m.trial).map(m=>m.name);
  $('.sb-select').innerHTML=`<div class="sb-card">
   <p class="sb-chapter">第一章　辦公室遠征</p>
   <div class="sb-nav"><button type="button" data-step="-1" ${i===0?'disabled':''} aria-label="上一關">‹</button>
    <h2>${esc(stage.id)}　${esc(stage.name)}${stage.boss?'<b>BOSS</b>':''}</h2>
    <button type="button" data-step="1" ${i===CHAPTER1.length-1?'disabled':''} aria-label="下一關">›</button></div>
   <div class="sb-dots">${CHAPTER1.map(s=>`<i data-state="${campaign.stars[s.id]?'clear':stageUnlocked(campaign,s.id)?'open':'lock'}" data-cur="${s===stage}"></i>`).join('')}</div>
   <p class="sb-meta">${stage.waves.length} 波・${esc(kinds.join('、'))}</p>
   <ul class="sb-rules">${STAR_RULES.map((r,k)=>`<li data-on="${!!st?.[k]}"><span class="sb-star" data-on="${!!st?.[k]}">★</span>${esc(k===2?r+'（'+stage.par+' 秒）':r)}</li>`).join('')}</ul>
   ${open?`<button type="button" class="sb-go">出　戰</button>`:`<p class="sb-lock">先通關 ${esc(CHAPTER1[i-1].id)} 才能挑戰</p>`}
   ${trial.length?`<p class="sb-note">${esc(trial.join('、'))}尚未招募：以 1 級客串上場。到「角色 → 同事招募與養成」招募並升級後，會用你的同事出戰。</p>`:''}
  </div>`;
  root.querySelectorAll('.sb-nav button').forEach(b=>b.onclick=()=>{stage=CHAPTER1[Math.max(0,Math.min(CHAPTER1.length-1,i+Number(b.dataset.step)))];renderSelect();});
  $('.sb-go')?.addEventListener('click',startStage);
 }
 function showSelect(){
  mode='select';$('.sb-select').hidden=false;$('.sb-result').hidden=true;$('.sb-top').hidden=true;
  battle=null;foes=[];deadAt={};members.forEach(m=>m.actor.play('idle'));renderSelect();
 }

 // ── 戰鬥流程 ──
 function startStage(){
  mode='battle';$('.sb-select').hidden=true;$('.sb-result').hidden=true;$('.sb-top').hidden=false;
  waveIdx=0;simSeconds=0;carry=null;focusId=null;ended=false;floating=[];ult=null;ultUntil=0;deadAt={};
  startWave();members.forEach(m=>{m.actor.play('walk');setTimeout(()=>m.actor.busy||m.actor.play('idle'),900);});
 }
 function startWave(){
  foes=waveEnemies(stage,waveIdx);
  const allies=members.map(m=>{const u={...m.unit};if(carry?.[m.id]){u.hp=carry[m.id].hp;u.energy=carry[m.id].energy;}return u;}).filter(u=>u.hp>0);
  battle=createFormationBattle({allies,enemies:enemyUnits(foes)});
  shownHp=Object.fromEntries([...battle.allies,...battle.enemies].map(u=>[u.id,u.hp]));
  for(const m of members)if(!battle.allies.some(u=>u.id===m.id))shownHp[m.id]=0;
  enemyState=Object.fromEntries(foes.map(f=>[f.id,{anim:'idle',start:0,dead:false,deadAt:0,knock:0}]));
  focusId=null;waveAt=performance.now();waveDone=false;
  $('.sb-stage').textContent=stage.id+' '+stage.name;
  $('.sb-wave').textContent=(waveIdx===stage.waves.length-1&&stage.boss?'BOSS ':'')+'第 '+(waveIdx+1)+'/'+stage.waves.length+' 波';
 }
 const foe=id=>foes.find(f=>f.id===id),fl=f=>FLOOR+f.fy;
 const headY=f=>fl(f)-f.size*.7;
 function num(x,y,text,kind='dmg'){floating.push({x,y,text,kind,t:performance.now()});}
 function enemyAnim(id,a){const s=enemyState[id];if(!s||s.dead)return;s.anim=a;s.start=performance.now();}
 // 突進距離（世界座標）：讓武器在命中格碰到目標；actor 以 K 縮放，換回角色座標
 const lungeTo=(m,f)=>Math.max(0,(f.x-f.size*.42-(m.x+175*K))/K);
 const unitHp=id=>battle.allies.find(u=>u.id===id)?.hp??0;

 /** 依模擬事件啟動動畫；傷害與血條延到命中格 */
 function handle(events){
  for(const e of events){
   const am=mem(e.actorId),tm=mem(e.targetId);
   if((e.type==='attack'||e.type==='counter')&&am){
    const f=foe(e.targetId);if(!f)continue;const hp=battle.enemies.find(u=>u.id===e.targetId).hp;
    const go=()=>am.actor.play('attack',{lungePx:lungeTo(am,f),onImpact:()=>{shownHp[e.targetId]=hp;num(f.x,headY(f),(e.type==='counter'?'反擊 ':'')+e.damage,e.type==='counter'?'counter':'dmg');enemyAnim(f.id,'hurt');enemyState[f.id].knock=performance.now();}});
    e.type==='counter'?setTimeout(go,420):go();
   }else if(e.type==='dispel'){
    const f=foe(e.targetId);if(f)num(f.x,headY(f)-40,'無效條款','word');
   }else if(e.type==='attack'&&tm){
    const f=foe(e.actorId),hp=unitHp(tm.id);if(f)enemyAnim(f.id,'attack');
    setTimeout(()=>{shownHp[tm.id]=hp;num(tm.x+90,FLOOR+tm.fy-230,e.damage,'hurt');
     if(tm.actor.action==='attack'||tm.actor.action==='ult')tm.actor.flash();else tm.actor.play('hurt');},380);
   }else if((e.type==='heal'||e.type==='leech')&&tm){
    setTimeout(()=>{shownHp[tm.id]=unitHp(tm.id);num(tm.x+90,FLOOR+tm.fy-230,'+'+e.amount,'heal');},200);
   }else if(e.type==='ultimate'&&am){
    const f=foe(e.targetId),hp=battle.enemies.find(u=>u.id===e.targetId).hp;
    ult={m:am,f,start:performance.now()};ultUntil=ult.start+am.fx.total+400;
    am.actor.play('ult',{onImpact:()=>{shownHp[e.targetId]=hp;num(f.x,headY(f)-30,e.damage,'ult');enemyAnim(f.id,'hurt');enemyState[f.id].knock=performance.now();
     if(e.removedStatuses.length||e.removedShield)num(f.x,headY(f)-80,'增益全數無效','word');}});
   }else if(e.type==='defeat'){
    const id=e.targetId,delay=ultUntil>performance.now()?ultUntil-performance.now()-300:520;
    if(mem(id)){setTimeout(()=>{deadAt[id]=performance.now();},420);continue;}
    if(focusId===id)focusId=null;
    setTimeout(()=>{if(enemyState[id]){enemyState[id].dead=true;enemyState[id].deadAt=performance.now();}},delay);
   }
  }
 }
 function castUlt(id){
  if(mode!=='battle'||!battle||battle.winner||performance.now()<ultUntil||!mem(id)?.fx)return;
  const next=castUltimate(battle,id,focusId);
  if(!next.events.length)return;
  battle=next;handle(battle.events);
 }
 canvas.addEventListener('pointerdown',ev=>{
  if(mode!=='battle'||!battle)return;
  const r=canvas.getBoundingClientRect(),x=(ev.clientX-r.left)*W/r.width,y=(ev.clientY-r.top)*H/r.height-DY;
  const hit=foes.filter(f=>!enemyState[f.id]?.dead&&Math.abs(x-f.x)<f.size*.42&&y>fl(f)-f.size*.95&&y<fl(f)+20).sort((a,b)=>b.fy-a.fy)[0];
  if(!hit)return;
  focusId=focusId===hit.id?null:hit.id;
  battle={...battle,focusTargetId:focusId};
 });

 function onBattleEnd(winner){
  if(winner==='allies'&&waveIdx<stage.waves.length-1){
   carry=Object.fromEntries(members.map(m=>{const u=battle.allies.find(x=>x.id===m.id);return [m.id,{hp:u?.hp??0,energy:u?.energy??0}];}));
   setTimeout(()=>{if(mode!=='battle')return;waveIdx++;startWave();},1400);
   return;
  }
  ended=true;
  setTimeout(()=>showResult(winner==='allies'),1500);
 }
 function showResult(won){
  mode='result';
  const hp=battle.allies.reduce((n,u)=>n+u.hp,0),max=members.reduce((n,m)=>n+m.unit.maxHp,0);
  const stars=starsFor({won,hpRatio:hp/max,seconds:simSeconds,par:stage.par});
  let r=null;
  if(won){r=onClear?.(stage.id,stars)||null;if(r?.ok)campaign.stars[stage.id]=(campaign.stars[stage.id]||[false,false,false]).map((x,i)=>x||stars[i]);members.forEach(m=>deadAt[m.id]||m.actor.play('idle'));}
  const i=CHAPTER1.indexOf(stage),next=CHAPTER1[i+1];
  const canNext=won&&next&&stageUnlocked(campaign,next.id);
  const loot=r?.ok?[['金幣',r.gold],['EXP',r.xp],['同事訓練經驗',r.trainingXp],['寶石',r.gems]].filter(([,v])=>v>0):[];
  $('.sb-result').innerHTML=`<div class="sb-card">
   <h2>${won?'勝　利':'戰　敗'}</h2>
   <p class="sb-chapter">${esc(stage.id)}　${esc(stage.name)}・${Math.floor(simSeconds)} 秒</p>
   ${won?`<div class="sb-stars">${STARS(stars)}</div><ul class="sb-rules">${STAR_RULES.map((t,k)=>`<li data-on="${stars[k]}"><span class="sb-star" data-on="${stars[k]}">★</span>${esc(k===2?t+'（'+stage.par+' 秒）':t)}</li>`).join('')}</ul>`:
    `<p class="sb-meta">小隊全數倒下。升級薪奴與同事、轉職，或多集火、抓時機放大招。</p>`}
   ${loot.length?`<p class="sb-loot-title">${r.first?'首次通關獎勵':'重複挑戰獎勵'}</p><ul class="sb-loot">${loot.map(([k,v])=>`<li><b>+${v}</b>${esc(k)}</li>`).join('')}</ul>`:''}
   ${won&&!r?.ok&&onClear?'<p class="sb-meta">結算失敗，這場沒有寫入存檔。</p>':''}
   <div class="sb-actions"><button type="button" class="sb-again">再戰一次</button>${canNext?'<button type="button" class="sb-next">下一關</button>':''}<button type="button" class="sb-back">選關</button></div></div>`;
  $('.sb-result').hidden=false;
  $('.sb-again').onclick=startStage;$('.sb-back').onclick=showSelect;
  if(canNext)$('.sb-next').onclick=()=>{stage=next;startStage();};
 }

 // ── 每格 ──
 let last=performance.now(),acc=0,syncAt=0;
 function frame(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(mode==='battle'&&battle&&!ended&&now>=ultUntil&&now-waveAt>700){
   acc+=dt;
   while(acc>=.1&&!battle.winner){acc-=.1;simSeconds+=.1;battle=tickFormationBattle(battle,.1);handle(battle.events);}
  }
  // 波次結束只在這裡判定（一般攻擊或大招擊倒最後一隻都一樣），並等大招演出播完
  if(mode==='battle'&&battle?.winner&&!waveDone&&now>=ultUntil){waveDone=true;onBattleEnd(battle.winner);}
  const ut=ult?now-ult.start:-1,inUlt=ult&&ut<ult.m.fx.total+500,P=ult?.m.fx.phases;
  const tgtX=(ult?.f.x??560)-130;
  const cam=inUlt?ultCamera(ut,P,{enemyX:tgtX,floor:FLOOR}):null;
  ctx.save();
  drawBackdrop();
  ctx.translate(0,DY);
  if(cam){ctx.translate(cam.cx+cam.shakeX,cam.cy+cam.shakeY);ctx.scale(cam.zoom,cam.zoom);ctx.translate(-cam.cx,-cam.cy);}
  if(inUlt)drawUltBack(ctx,ut,P,{floor:FLOOR,enemyX:tgtX},vfx);
  // 集火標記：審判法陣（正式繪製特效素材）壓扁在目標腳下
  const ff=focusId&&foe(focusId);
  if(ff&&!inUlt){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.75+.2*Math.sin(now/180);ctx.translate(ff.x,fl(ff)-6);ctx.scale(1,.32);ctx.rotate(now/1400);const w=ff.size*.95;ctx.drawImage(vfx.sigil,-w/2,-w/2,w,w);ctx.restore();}
  // 前後景深一起排序：fy 小（後方）先畫
  const draws=[...foes.map(f=>({fy:f.fy,d:()=>drawEnemy(f,now)})),...members.map(m=>({fy:m.fy,d:()=>drawMember(m,now)}))];
  draws.sort((a,b)=>a.fy-b.fy).forEach(x=>x.d());
  if(inUlt)drawUltFront(ctx,ut,P,{floor:FLOOR,enemyX:tgtX,penTip:{x:ult.m.x+215*K,y:FLOOR+ult.m.fy-265*K}},vfx);
  ctx.restore();
  if(inUlt&&ult.m.cutin){ctx.save();ctx.translate(0,(H-620)/2);drawCutin(ctx,ut,P,ult.m.cutin,vfx);ctx.restore();}
  if(!inUlt&&ult&&now>ultUntil)ult=null;
  ctx.save();ctx.translate(0,DY);drawFloating(now);ctx.restore();
  if(battle&&!members.some(m=>m.actor.busy)&&now-syncAt>600){syncAt=now;for(const u of [...battle.allies,...battle.enemies])shownHp[u.id]=u.hp;}
  drawHud(now);
  raf=requestAnimationFrame(frame);
 }
 function drawMember(m,now){
  const d=deadAt[m.id];if(d&&now-d>650)return;
  ctx.save();if(d)ctx.globalAlpha=Math.max(0,1-(now-d)/650);
  ctx.translate(m.x,FLOOR+m.fy);ctx.scale(K,K);m.actor.draw(ctx,now,0,0);ctx.restore();
 }
 function drawEnemy(f,now){
  const st=enemyState[f.id],art=monArt[f.type];if(!st)return;
  let key=st.dead?'defeat':st.anim,img=art[key],n=Math.round(img.naturalWidth/img.naturalHeight),t=now-(st.dead?st.deadAt:st.start),fr;
  if(st.dead){fr=Math.min(n-1,Math.floor(t/140));if(t>n*140+600)return;}
  else if(key==='idle')fr=Math.floor(now/220+f.x)%n;
  else{fr=Math.floor(t/110);if(fr>=n){st.anim='idle';img=art.idle;n=Math.round(img.naturalWidth/img.naturalHeight);fr=Math.floor(now/220+f.x)%n;}}
  const kb=st.knock?Math.max(0,1-(now-st.knock)/320)*22:0;
  const enter=Math.max(0,1-(now-waveAt)/650),slide=enter*enter*420; // 新一波從右側進場
  const c=img.naturalHeight,y=fl(f);
  ctx.save();if(st.dead)ctx.globalAlpha=Math.max(0,1-Math.max(0,t-n*140)/600);
  ctx.drawImage(img,fr*c,0,c,c,f.x-f.size/2+kb+slide,y-f.size+12,f.size,f.size);ctx.restore();
  if(!st.dead&&battle){const u=battle.enemies.find(e=>e.id===f.id);bar(f.x-40+slide,y-f.size*.78,80,7,shownHp[f.id]/u.maxHp,f.boss?'#ff8a3c':'#e25b4b');}
 }
 function drawBackdrop(){const s=H/620*1.02,w=720*s,x=(W-w)/2,y=DY-(620*s-620)*.62;ctx.drawImage(bg,x,y,w,620*s);
  ctx.fillStyle='#0b0712';ctx.fillRect(0,0,W,Math.max(0,y));}
 function bar(x,y,w,h,p,c){ctx.fillStyle='#0c0812';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle=c;ctx.fillRect(x,y,w*Math.max(0,Math.min(1,p)),h);ctx.strokeStyle='#d8b25a';ctx.lineWidth=1;ctx.strokeRect(x-1,y-1,w+2,h+2);}
 function drawFloating(now){
  floating=floating.filter(f=>now-f.t<900);
  for(const f of floating){const p=(now-f.t)/900;ctx.save();ctx.globalAlpha=1-p*p;
   const big=f.kind==='ult'?54:f.kind==='word'?26:32;ctx.font=`900 ${big}px "Noto Serif TC","Microsoft JhengHei",serif`;ctx.textAlign='center';
   ctx.lineWidth=f.kind==='ult'?8:5;ctx.strokeStyle='#2a1208';const y=f.y-p*50;ctx.strokeText(f.text,f.x,y);
   ctx.fillStyle=f.kind==='hurt'?'#ffb3a5':f.kind==='heal'?'#b9f5c4':f.kind==='word'?'#fff6d6':f.kind==='ult'?'#fff1a8':'#fff3c9';ctx.fillText(f.text,f.x,y);ctx.restore();}
 }
 function drawHud(now){
  for(const m of members){
   const card=root.querySelector(`.sb-pc[data-id="${CSS.escape(m.id)}"]`);if(!card)continue;
   const u=battle?.allies.find(x=>x.id===m.id),max=m.unit.maxHp;
   card.querySelector('.sb-hp i').style.width=(battle?100*(shownHp[m.id]??0)/max:100)+'%';
   card.querySelector('.sb-en i').style.width=(u&&m.fx?Math.min(100,u.energy):0)+'%';
   const ready=!!(mode==='battle'&&u&&u.hp>0&&m.fx&&u.energy>=100&&!battle.winner&&now>=ultUntil);
   if(card.dataset.ready!==String(ready))card.dataset.ready=String(ready);
   const down=!!(battle&&(!u||u.hp<=0));if(card.dataset.down!==String(down))card.dataset.down=String(down);
  }
  if(mode==='battle')$('.sb-time').textContent=Math.floor(simSeconds)+' / '+stage.par+' 秒';
 }
 showSelect();
 raf=requestAnimationFrame(frame);
 window.__squad={get battle(){return battle;},get mode(){return mode;},get stage(){return stage;},get foes(){return foes;},get focusId(){return focusId;},get simSeconds(){return simSeconds;},members,castUlt};
}
