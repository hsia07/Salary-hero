/** 小隊戰鬥（冒險頁入口，獨立全螢幕單屏戰場）。V21_SQUAD_COMBAT_REDESIGN：同事在此上場，首頁只有薪奴。
 * 第一版範圍（2026-11-19）：
 *  - 只有已完成正式逐格美術的同事會上場（目前：白律）；沒有美術的職業不上場，不以文字或色塊代替。
 *  - 薪奴為指揮官頭像，不佔格。
 *  - 結算以 formation-combat-runtime 純模擬為準；畫面上的血量、傷害數字延到命中格才顯示。
 *  - 不寫存檔、不發獎勵（試玩）。
 */
import {createFormationBattle,tickFormationBattle} from './formation-combat-runtime.mjs';
import {loadCharAnim,createFrameActor} from './char-frames.mjs?v=2';
import {BAILU_ULT_TOTAL_MS,BAILU_CUTIN_MS,BAILU_ULT_MS} from './bailu-timing.mjs';
import {ultPhases,drawUltBack,drawUltFront,ultCamera,drawCutin,loadUltVfx} from './bailu-ult-fx.mjs?v=5';
import {squadStats} from './v21-squad-core.mjs';

// 戰鬥世界座標沿用 720×620（與首頁、大招特效一致）；畫布為直式 720×940，世界往下平移填滿手機畫面
const W=720,H=1220,FLOOR=525,DY=455;
const ENEMY_SET=[ // 已核准的逐格怪物；格數由圖集寬高計算。fy＝前後景深（負值在後排）
 {type:'paper-gremlin',ext:'png',name:'暴走報表怪',x:430,fy:40,size:250,hpK:7,atkK:.35},
 {type:'chair-golem',ext:'webp',name:'椅子魔像',x:560,fy:-55,size:330,hpK:18,atkK:.5,boss:true},
 {type:'coffee-mimic',ext:'webp',name:'咖啡擬態怪',x:640,fy:70,size:250,hpK:7,atkK:.32},
];
const ART=['idle','attack','hurt','defeat'];
const load=s=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error('載入失敗 '+s));i.src=s;});
const UP=ultPhases(BAILU_CUTIN_MS,BAILU_ULT_MS);

let root=null;
export function squadBattleAvailable(draft){return (draft?.slots||[]).some(m=>m?.job==='lawyer');}

export async function openSquadBattle({draft,level=1,heroIdleSrc}){
 if(root)return;
 root=document.createElement('div');root.id='squad-battle';root.setAttribute('role','dialog');root.setAttribute('aria-label','小隊戰鬥');
 root.innerHTML=`<div class="sb-wrap"><canvas width="${W}" height="${H}" aria-label="小隊戰鬥畫面"></canvas>
  <div class="sb-bar"><figure class="sb-cmd"><img alt="" src="${heroIdleSrc}"><figcaption>指揮官</figcaption></figure>
   <div class="sb-unit"><strong>勞權律師・白律</strong><span class="sb-hp"><i></i></span><span class="sb-en"><i></i></span><small>能量滿自動施放「終審判決」</small></div>
   <button type="button" class="sb-exit">離開</button></div>
  <div class="sb-result" hidden><h2></h2><p></p><div><button type="button" class="sb-again">再戰一次</button><button type="button" class="sb-leave">返回</button></div></div></div>`;
 document.body.appendChild(root);
 const close=()=>{cancelAnimationFrame(raf);root?.remove();root=null;};
 root.querySelector('.sb-exit').onclick=close;root.querySelector('.sb-leave').onclick=close;
 const ctx=root.querySelector('canvas').getContext('2d');
 ctx.fillStyle='#120c1c';ctx.fillRect(0,0,W,H);ctx.fillStyle='#f3dfa0';ctx.font='24px serif';ctx.fillText('戰場準備中…',280,310);
 const [bg,anim,vfx,...mons]=await Promise.all([load('../art/v20/runtime/backgrounds/battle-library-v20-p10.webp'),loadCharAnim('lawyer'),loadUltVfx('../art/characters/office-lawyer/vfx/'),
  ...ENEMY_SET.flatMap(e=>ART.map(k=>load(`../art/v19/runtime/monsters/${e.type}/${k}.${e.ext}`)))]);
 const monArt=ENEMY_SET.map((e,i)=>Object.fromEntries(ART.map((k,j)=>[k,mons[i*4+j]])));
 const member=(draft.slots||[]).find(m=>m?.job==='lawyer');
 const stat=squadStats(draft,level).find(x=>x&&x.job==='lawyer');
 const bailu={x:120,actor:createFrameActor(anim)};
 let raf=0,battle,shownHp,enemyState,floating,ultUntil=0,ultStart=-1,ended=false;

 function reset(){
  battle=createFormationBattle({
   allies:[{id:member.id,name:'白律',role:'caster',row:'rear',lane:1,maxHp:stat.maxHp*4,hp:stat.maxHp*4,attack:stat.attack,attackInterval:1.8,energy:70,
     counter:stat.counter,counterInterval:1.5,dispelPower:1,dispelInterval:8,ultimate:{multiplier:5,name:'終審判決'}}],
   // 敵人數值依上場同事的攻擊力換算（試玩平衡：約 30 秒、2 次大招、勝利時約剩 40% HP）
   enemies:ENEMY_SET.map((e,i)=>({id:'e'+i,name:e.name,role:e.boss?'tank':'melee',row:'front',lane:i,maxHp:Math.round(stat.attack*e.hpK),hp:Math.round(stat.attack*e.hpK),attack:Math.round(stat.attack*e.atkK),attackInterval:e.boss?3.4:2.8,cooldown:1.2+i*.7,boss:!!e.boss,
     statuses:e.boss?[{type:'fortify',duration:999}]:[]}))
  });
  shownHp=Object.fromEntries([...battle.allies,...battle.enemies].map(u=>[u.id,u.hp]));
  enemyState=ENEMY_SET.map(()=>({anim:'idle',start:0,dead:false,deadAt:0,knock:0}));
  floating=[];ended=false;ultUntil=0;ultStart=-1;
  root.querySelector('.sb-result').hidden=true;
  bailu.actor.play('walk');setTimeout(()=>bailu.actor.busy||bailu.actor.play('idle'),900);
 }
 root.querySelector('.sb-again').onclick=reset;

 const ex=i=>ENEMY_SET[i].x,eIdx=id=>Number(String(id).slice(1));
 function num(x,y,text,kind='dmg'){floating.push({x,y,text,kind,t:performance.now()});}
 function enemyAnim(i,a){if(enemyState[i].dead)return;enemyState[i].anim=a;enemyState[i].start=performance.now();}
 function applyShown(id,hp){shownHp[id]=hp;}

 /** 依模擬事件啟動動畫；傷害與血條延到命中格 */
 function handle(events){
  for(const e of events){
   if(e.type==='attack'&&e.actorId===member.id){
    const i=eIdx(e.targetId),hp=battle.enemies[i].hp;
    bailu.actor.play('attack',{lungePx:Math.max(0,ex(i)-bailu.x-ENEMY_SET[i].size*.42-175),onImpact:()=>{applyShown(e.targetId,hp);num(ex(i),FLOOR+ENEMY_SET[i].fy-ENEMY_SET[i].size*.7,e.damage);enemyAnim(i,'hurt');enemyState[i].knock=performance.now();}});
   }else if(e.type==='counter'&&e.actorId===member.id){
    const i=eIdx(e.targetId),hp=battle.enemies[i].hp;
    setTimeout(()=>bailu.actor.play('attack',{lungePx:Math.max(0,ex(i)-bailu.x-ENEMY_SET[i].size*.42-175),onImpact:()=>{applyShown(e.targetId,hp);num(ex(i),FLOOR+ENEMY_SET[i].fy-ENEMY_SET[i].size*.7,'反擊 '+e.damage,'counter');enemyAnim(i,'hurt');}}),420);
   }else if(e.type==='dispel'){
    const i=eIdx(e.targetId);num(ex(i),FLOOR+ENEMY_SET[i].fy-ENEMY_SET[i].size*.7-40,'無效條款','word');
   }else if(e.type==='attack'&&e.targetId===member.id){
    const i=eIdx(e.actorId),hp=battle.allies[0].hp;enemyAnim(i,'attack');
    setTimeout(()=>{applyShown(member.id,hp);num(bailu.x+80,FLOOR-260,e.damage,'hurt');
     if(bailu.actor.action==='attack'||bailu.actor.action==='ult')bailu.actor.flash();else bailu.actor.play('hurt');},380);
   }else if(e.type==='ultimate'){
    const i=eIdx(e.targetId),hp=battle.enemies[i].hp;
    ultStart=performance.now();ultUntil=ultStart+BAILU_ULT_TOTAL_MS+400;ultTarget=i;
    bailu.actor.play('ult',{onImpact:()=>{applyShown(e.targetId,hp);num(ex(i),FLOOR+ENEMY_SET[i].fy-ENEMY_SET[i].size*.7-30,e.damage,'ult');enemyAnim(i,'hurt');enemyState[i].knock=performance.now();
     if(e.removedStatuses.length||e.removedShield)num(ex(i),FLOOR+ENEMY_SET[i].fy-ENEMY_SET[i].size*.7-80,'增益全數無效','word');}});
   }else if(e.type==='defeat'&&e.targetId!==member.id){
    const i=eIdx(e.targetId);const delay=ultUntil>performance.now()?ultUntil-performance.now()-300:520;
    setTimeout(()=>{enemyState[i].dead=true;enemyState[i].deadAt=performance.now();},delay);
   }
  }
 }
 let ultTarget=1,last=performance.now(),acc=0,syncAt=0;
 function frame(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(!ended&&now>=ultUntil){acc+=dt;while(acc>=.1){acc-=.1;battle=tickFormationBattle(battle,.1);handle(battle.events);
   if(battle.winner&&!ended){ended=true;setTimeout(()=>showResult(battle.winner),1500);} }}
  // 畫面
  const ut=ultStart>=0?now-ultStart:-1, inUlt=ut>=0&&ut<BAILU_ULT_TOTAL_MS+500;
  const tgtX=ex(ultTarget)-130;
  const cam=inUlt?ultCamera(ut,UP,{enemyX:tgtX,floor:FLOOR}):null;
  ctx.save();
  drawBackdrop();
  ctx.translate(0,DY);
  if(cam){ctx.translate(cam.cx+cam.shakeX,cam.cy+cam.shakeY);ctx.scale(cam.zoom,cam.zoom);ctx.translate(-cam.cx,-cam.cy);}
  if(inUlt)drawUltBack(ctx,ut,UP,{floor:FLOOR,enemyX:tgtX},vfx);
  [...ENEMY_SET.keys()].sort((a,b)=>ENEMY_SET[a].fy-ENEMY_SET[b].fy).forEach(i=>drawEnemy(i,now));
  bailu.actor.draw(ctx,now,bailu.x,FLOOR);
  if(inUlt)drawUltFront(ctx,ut,UP,{floor:FLOOR,enemyX:tgtX,penTip:{x:bailu.x+215,y:FLOOR-265}},vfx);
  ctx.restore();
  if(inUlt){ctx.save();ctx.translate(0,(H-620)/2);drawCutin(ctx,ut,UP,anim.cutin,vfx);ctx.restore();}
  ctx.save();ctx.translate(0,DY);drawFloating(now);ctx.restore();
  // 動作結束後把顯示血量與模擬對齊（避免被打斷的命中格沒有更新）
  if(!bailu.actor.busy&&now-syncAt>600){syncAt=now;for(const u of [...battle.allies,...battle.enemies])shownHp[u.id]=u.hp;}
  drawHud();
  raf=requestAnimationFrame(frame);
 }
 function drawEnemy(i,now){
  const e=ENEMY_SET[i],st=enemyState[i],art=monArt[i];
  let key=st.dead?'defeat':st.anim,img=art[key],n=Math.round(img.naturalWidth/img.naturalHeight),t=now-(st.dead?st.deadAt:st.start);
  let f;
  if(st.dead){f=Math.min(n-1,Math.floor(t/140));if(t>n*140+600)return;}
  else if(key==='idle')f=Math.floor(now/220+i)%n;
  else{f=Math.floor(t/110);if(f>=n){st.anim='idle';img=art.idle;n=Math.round(img.naturalWidth/img.naturalHeight);f=Math.floor(now/220+i)%n;}}
  const kb=st.knock?Math.max(0,1-(now-st.knock)/320)*22:0;
  const c=img.naturalHeight;
  ctx.save();if(st.dead)ctx.globalAlpha=Math.max(0,1-Math.max(0,t-n*140)/600);
  const fl=FLOOR+e.fy;ctx.drawImage(img,f*c,0,c,c,e.x-e.size/2+kb,fl-e.size+12,e.size,e.size);ctx.restore();
  if(!st.dead){const hp=shownHp['e'+i]/battle.enemies[i].maxHp;bar(e.x-40,fl-e.size*.78,80,7,hp,'#e25b4b');}
 }
 /** 背景：圖書館戰場等比放大鋪滿直式畫布，世界地板對齊原圖地板 */
 function drawBackdrop(){const s=H/620*1.02,w=720*s,x=(W-w)/2,y=DY-(620*s-620)*.62;ctx.drawImage(bg,x,y,w,620*s);
  ctx.fillStyle='#0b0712';ctx.fillRect(0,0,W,Math.max(0,y));}
 function bar(x,y,w,h,p,c){ctx.fillStyle='#0c0812';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle=c;ctx.fillRect(x,y,w*Math.max(0,Math.min(1,p)),h);ctx.strokeStyle='#d8b25a';ctx.lineWidth=1;ctx.strokeRect(x-1,y-1,w+2,h+2);}
 function drawFloating(now){
  floating=floating.filter(f=>now-f.t<900);
  for(const f of floating){const p=(now-f.t)/900;ctx.save();ctx.globalAlpha=1-p*p;
   const big=f.kind==='ult'?54:f.kind==='word'?26:32;ctx.font=`900 ${big}px "Noto Serif TC","Microsoft JhengHei",serif`;ctx.textAlign='center';
   ctx.lineWidth=f.kind==='ult'?8:5;ctx.strokeStyle='#2a1208';const y=f.y-p*50;ctx.strokeText(f.text,f.x,y);
   ctx.fillStyle=f.kind==='hurt'?'#ffb3a5':f.kind==='word'?'#fff6d6':f.kind==='ult'?'#fff1a8':'#fff3c9';ctx.fillText(f.text,f.x,y);ctx.restore();}
 }
 function drawHud(){
  const a=battle.allies[0];
  root.querySelector('.sb-hp i').style.width=(100*shownHp[member.id]/a.maxHp)+'%';
  root.querySelector('.sb-en i').style.width=Math.min(100,a.energy)+'%';
 }
 function showResult(w){
  const r=root.querySelector('.sb-result');r.hidden=false;
  r.querySelector('h2').textContent=w==='allies'?'勝訴':'敗訴';
  r.querySelector('p').textContent=w==='allies'?'所有敵人都被判決出局。（試玩：不寫存檔、不發獎勵）':'白律倒下了。（試玩：不寫存檔、不發獎勵）';
  if(w==='allies')bailu.actor.play('idle');
 }
 reset();
 raf=requestAnimationFrame(frame);
 window.__squad={get battle(){return battle;},bailu,enemyState};
}
