/* Salary Hero V19 — scene renderer and interaction. Never draw home-master concept screenshot. */
import {ITEMS,ENCOUNTERS,STORAGE_KEY,initial,normalize,enemyFor,todayTW,transition,salaryAt,playerTitle,cleanPlayerName,autoEncounterChoice,GAME_MODES,GAME_SKILLS} from './engine.mjs';
import {HERO_STYLES,ALL_ENEMIES,COMMON_ENEMIES,ELITE_ENEMIES,BOSSES} from './roster.mjs';
import {SKINS,skinById} from './skins.mjs';
import {renderSkinPanel} from './skin-ui.mjs';
import {CHIBI_ATTACK_V2_TOTAL_MS,attackFrameAt,attackPhaseAt,validateAttackAtlas} from './attack-timing.mjs';
import {drawMonsterActor,drawMonsterVfx,monsterAnimationState} from './monster-motion.mjs';
import {validateMonsterAtlasManifest,validateSpritePixels,inspectAtlasFrameArt,drawMonsterAtlasFrame,spriteFrameIndex} from './sprite-atlas.mjs';
import {normalVariantFor,drawNormalVariantFrame,NORMAL_VARIANT_PREVIEWS} from './monster-variants.mjs?v=normal-loop-v19-24';
import {paperCombatPoseAt,paperHitFlashAt,drawPaperHitTint,drawPaperCombatFx,PAPER_PROJECTILE_IMPACT_MS} from './paper-combat.mjs?v=guard-extended-red-v19-8';
import {coffeeCombatPoseAt,drawCoffeeCombatFx,COFFEE_SPRAY_IMPACT_MS} from './coffee-combat.mjs';
import {guardCombatPoseAt,drawGuardCombatFx,GUARD_BEAM_IMPACT_MS,GUARD_DEFEAT_FADE_START_MS,GUARD_DEFEAT_END_MS,guardArmorFlashAt,drawGuardArmorTint,guardCombatCaptionAt} from './guard-combat.mjs?v=armor-red-v19-12';
import {alienCombatPoseAt,drawAlienStampFx,alienStampAt,alienStampRouteAt,alienInjuryAt,drawAlienInjuryTint,ALIEN_STAMP_IMPACT_MS,ALIEN_DEFEAT_END_MS} from './alien-combat.mjs?v=alien-facing-left-v19-17';
import {cloudCombatPoseAt,cloudClockAt,drawCloudClockFx,cloudHurtFlashAt,drawCloudHurtTint,CLOUD_CLOCK_IMPACT_MS,CLOUD_FADE_START_MS,CLOUD_DEFEAT_END_MS} from './cloud-ghost-combat.mjs?v=cloud-v19-18';
import {clerkCombatPoseAt,clerkReportAt,drawClerkReportFx,clerkHurtFlashAt,drawClerkHurtTint,CLERK_REPORT_IMPACT_MS,CLERK_FADE_START_MS,CLERK_DEFEAT_END_MS} from './ghost-clerk-combat.mjs?v=clerk-original-v19-21';
import {CHIBI_HURT_TOTAL_MS,hurtFrameAt,validateHurtAtlas,shouldRecoil} from './hurt-timing.mjs';
import {HIT_FEEDBACK_MS,HIT_SPARK_COUNT,hurtPlaybackAt} from './hurt-effects.mjs';
import {trainingWaveFor,trainingStateFor,repeatTrainingEnemy,primeTrainingFinisher} from './training-mode.mjs';
import {visibleCombatHealthAt} from './combat-feedback.mjs';
const $=s=>document.querySelector(s);
const world=$('#world'),ctx=world.getContext('2d');
const LOGICAL_WIDTH=720,LOGICAL_HEIGHT=620;
const PIXEL_SCALE=Math.max(1,Math.min(2,Math.ceil(window.devicePixelRatio||1)));
world.width=LOGICAL_WIDTH*PIXEL_SCALE;
world.height=LOGICAL_HEIGHT*PIXEL_SCALE;
const panel=$('#panel'),body=$('#panel-content');
const trainingSpecies=new URLSearchParams(location.search).get('training');
const trainingWave=trainingWaveFor(trainingSpecies);
// Costume experiments are explicitly training-only. Never change save, wave,
// enemy ID, rarity, monster production approval, or player's inventory.
const requestedNormalVariant=new URLSearchParams(location.search).get('skin');
let activeNormalVariant=null;
function liveVariantFor(enemy){
 if(trainingWave!==null)return activeNormalVariant?.baseTypeId===enemy.typeId?activeNormalVariant:null;
 if(Math.floor((state.wave-1)/6)%2===0)return null;
 const match=NORMAL_VARIANT_PREVIEWS.find(v=>v.baseTypeId===enemy.typeId);
 return match?normalVariantFor(enemy.typeId,match.id,[...approvedMonsterArt.keys()]):null;
}
const save=()=>{
 // Art rehearsal is an entirely separate simulated battle. It MUST NOT modify
 // salary, inventory, currency, unlocks, level or any official save.
 if(trainingWave!==null)return;
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){console.warn('存檔失敗',e)}
};
const format=n=>Number(n||0).toLocaleString('zh-TW');
const money=(n,d=0)=>'NT$'+Number(n||0).toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d});
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadGame(){
 if(trainingWave!==null)return trainingStateFor(trainingSpecies,initial,enemyFor);
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
const trainingNotice=$('#training-mode-notice');
if(trainingNotice&&trainingWave!==null){
 trainingNotice.hidden=false;
 const name=trainingSpecies==='coffee-mimic'?'茶水間邪惡杯靈':trainingSpecies==='chair-golem'?'打卡保全機兵（正式美術）':trainingSpecies==='meeting-ghost'?'星際打卡實習生（正式 16 格逐格美術・面向左）':trainingSpecies==='deadline-clock'?'雲端資料專員靈（正式 16 格・面向左）':trainingSpecies==='keyboard-piranha'?'加班遊魂文員（512px 高清 16 格正式美術）':'影印室工讀紙妖';
 const label=$('#training-monster-name');
 if(label)label.textContent=name;
 const readout=$('#training-animation-readout');
 if(readout)readout.hidden=!['chair-golem','meeting-ghost','deadline-clock','keyboard-piranha'].includes(trainingSpecies);
}
let currentPanel='',ready=false,lastAttack=0,fx=null,images={},failure='',lastFrame=0;
$('#training-finish')?.addEventListener('click',()=>{
 if(trainingWave===null||!ready)return;
 state=primeTrainingFinisher(state,trainingSpecies);
 fx=null; // begin a clean illustrated hit sequence on the NEXT manual strike
 render();
});
let approvedMonsterArt=new Map();
let trainingCandidateArt=new Map();
const hasIllustratedMonster=(id)=>approvedMonsterArt.has(id)||trainingCandidateArt.has(id);
async function loadTrainingCandidateArt(){
 // This 16-pose elite sprite may ONLY appear under the explicit, save-isolated
 // training URL. It is NOT in the approved 2/32 production monster manifest.
 if(trainingSpecies!=='chair-golem'||approvedMonsterArt.has('chair-golem'))return;
 const url=new URL('../art/v19/candidates/monsters/chair-golem/manifest-candidate.json?v=security-20261110',import.meta.url);
 const candidate=await fetch(url).then(r=>{if(!r.ok)throw new Error('security candidate manifest HTTP '+r.status);return r.json()});
 if(candidate.id!=='chair-golem'||candidate.approved!==false||candidate.previewOnly!==true)
   throw new Error('Candidate safety check failed: not a genuine unapproved training-only monster');
 const frames={};
 for(const state of ['idle','attack','hurt','defeat']){
   const frame=candidate.states?.[state];
   if(!frame||frame.cell!==384||!frame.src.includes('/candidates/monsters/chair-golem/'))
     throw new Error('Invalid security-mech candidate path/atlas for '+state);
   const image=await imageFrom(frame.src);
   const size=validateSpritePixels(image,frame);
   if(!size.ok)throw new Error('Bad security-mech '+state+': '+size.reason);
   const artErrors=inspectAtlasFrameArt(image,frame,state);
   if(artErrors.length)throw new Error('Unusable security-mech '+state+': '+artErrors.join('; '));
   frames[state]={image,frame};
 }
 trainingCandidateArt.set('chair-golem',frames);
 const status=$('#monster-art-status');
 if(status){
   status.dataset.candidate='true';
   status.textContent='🧪 打卡保全機兵（普通怪物）16 格候選美術已載入，可在第 5 關練習實戰；正式核准仍為 2／32，等待你確認攻擊與受傷效果。';
 }
}
async function loadAlienCandidateArt(){
 if(trainingSpecies!=='meeting-ghost'||approvedMonsterArt.has('meeting-ghost'))return;
 const url=new URL('../art/v19/candidates/monsters/meeting-ghost/manifest-candidate.json?v=alien-left-v19-17',import.meta.url);
 const record=await fetch(url).then(r=>{if(!r.ok)throw new Error('外星人候選素材 HTTP '+r.status);return r.json()});
 if(record.id!=='meeting-ghost'||record.approved!==false||record.previewOnly!==true||
    record.facing!=='left'||record.target!=='hero-on-left'||record.tier!=='normal')
   throw new Error('外星人素材朝向或候選核准狀態不正確');
 const poses={};
 for(const state of ['idle','attack','hurt','defeat']){
   const frame=record.states?.[state];
   if(!frame||frame.cell!==384||!frame.src.startsWith('../art/v19/candidates/monsters/meeting-ghost/'))
     throw new Error('外星人圖集來源不正確：'+state);
   const image=await imageFrom(frame.src);
   const pixels=validateSpritePixels(image,frame);
   if(!pixels.ok)throw new Error('外星人圖集格式錯誤 '+state+': '+pixels.reason);
   const issues=inspectAtlasFrameArt(image,frame,state);
   if(issues.length)throw new Error('外星人姿勢不合格 '+state+': '+issues.join('; '));
   poses[state]={image,frame};
 }
 trainingCandidateArt.set('meeting-ghost',poses);
 world.dataset.alienFacing='left';
 world.dataset.alienArt='16-frames-loaded';
 const notice=$('#monster-art-status');
 if(notice){
   notice.dataset.candidate='true';
   notice.textContent='🛸 星際打卡實習生已載入 16 格朝左透明候選動畫（待機 4／攻擊 5／受擊 3／死亡 4），面向左側勇者。正式完成仍為 3/32，這隻尚未美術核准。';
 }
}
async function loadCloudGhostCandidateArt(){
 if(trainingSpecies!=='deadline-clock'||approvedMonsterArt.has('deadline-clock'))return;
 const url=new URL('../art/v19/candidates/monsters/deadline-clock/manifest-candidate.json?v=ghost-v19-18',import.meta.url);
 const record=await fetch(url).then(r=>{if(!r.ok)throw new Error('雲端幽靈候選素材 HTTP '+r.status);return r.json()});
 if(record.id!=='deadline-clock'||record.tier!=='normal'||record.approved!==false||
    record.previewOnly!==true||record.facing!=='left'||record.target!=='hero-on-left')
  throw new Error('第五隻必須是面向左側的普通怪候選，不能當作菁英／Boss');
 const poses={};
 for(const state of ['idle','attack','hurt','defeat']){
  const frame=record.states?.[state];
  if(!frame||frame.cell!==384||!frame.src.startsWith('../art/v19/candidates/monsters/deadline-clock/'))
   throw new Error('雲端幽靈圖集路徑無效：'+state);
  const image=await imageFrom(frame.src);
  const pixels=validateSpritePixels(image,frame);
  if(!pixels.ok)throw new Error('雲端幽靈 '+state+' 圖片尺寸錯誤：'+pixels.reason);
  const issues=inspectAtlasFrameArt(image,frame,state);
  if(issues.length)throw new Error('雲端幽靈 '+state+' 缺少獨立畫格：'+issues.join('; '));
  poses[state]={image,frame};
 }
 trainingCandidateArt.set('deadline-clock',poses);
 world.dataset.cloudArt='16-original-frames-loaded';
 world.dataset.cloudFacing='left';
 const notice=$('#monster-art-status');
 if(notice){
  notice.dataset.candidate='true';
  notice.textContent='☁️ 雲端資料專員靈的 16 格透明逐格候選已載入（待機4／攻擊5／受擊3／死亡4），第 6 關朝左側勇者出招。正式已有 4/32。';
 }
}
async function loadApprovedMonsterArt(){
 const manifestURL=new URL('../art/v19/runtime/monsters/manifest.json?art=clerk-official-v19-23',import.meta.url);
 const manifest=await fetch(manifestURL).then(r=>{if(!r.ok)throw new Error('monster manifest HTTP '+r.status);return r.json()});
 const tierById=Object.fromEntries(ALL_ENEMIES.map(e=>[e.id,
   BOSSES.some(b=>b.id===e.id)?'boss':ELITE_ENEMIES.some(b=>b.id===e.id)?'elite':'normal']));
 const errors=validateMonsterAtlasManifest(manifest,tierById);
 if(errors.length)throw new Error('未核准的怪物素材：'+errors.join('; '));
 const approved=new Map();
 for(const [id,record] of Object.entries(manifest.monsters||{})){
   const frames={};let ok=true;
   for(const [state,frame] of Object.entries(record.states)){
     const image=await imageFrom(frame.src);
     const pixels=validateSpritePixels(image,frame);
     if(!pixels.ok){console.warn('怪物逐格圖片尺寸不符：',id,state,pixels.reason);ok=false;break;}
     const artErrors=inspectAtlasFrameArt(image,frame,state);
     if(artErrors.length){console.warn('怪物逐格美術未通過：',id,state,artErrors);ok=false;break;}
     frames[state]={image,frame};
   }
   if(ok)approved.set(id,frames);
 }
 approvedMonsterArt=approved;
 if(approved.has('keyboard-piranha')){
  world.dataset.clerkArt='16-original-frames-loaded';
  world.dataset.clerkFacing='left';
  world.dataset.clerkApproval='official';
 }
 if(trainingSpecies==='meeting-ghost'&&approved.has('meeting-ghost')){
  world.dataset.alienArt='16-frames-loaded';
  world.dataset.alienFacing='left';
  world.dataset.alienApproval='official';
 }
 if(trainingSpecies==='deadline-clock'&&approved.has('deadline-clock')){
  world.dataset.cloudArt='16-original-frames-loaded';
  world.dataset.cloudFacing='left';
  world.dataset.cloudApproval='official';
 }
 activeNormalVariant=trainingWave!==null
  ?normalVariantFor(trainingSpecies,requestedNormalVariant,[...approved.keys()]):null;
 if(activeNormalVariant){
   world.dataset.monsterVariant=activeNormalVariant.id;
   const t=$('#training-monster-name');
   if(t)t.textContent=activeNormalVariant.name+'（普通怪共用動畫換皮試玩）';
 }else{
   delete world.dataset.monsterVariant;
 }
 const notice=$('#monster-art-status');
 if(notice){
   notice.dataset.loaded=String(approved.size===Object.keys(manifest.monsters).length);
   notice.dataset.approved=approved.has('chair-golem')&&approved.has('meeting-ghost')&&approved.has('deadline-clock')?'true':'false';
   const count=approved.size;
   notice.textContent='✓ 已載入獨立繪製怪物 '+count+'/32：'+[...approved.keys()].map(id=>id==='paper-gremlin'?'影印室工讀紙妖':id==='coffee-mimic'?'茶水間邪惡杯靈':id==='chair-golem'?'打卡保全機兵':id==='meeting-ghost'?'星際打卡實習生':id==='deadline-clock'?'雲端資料專員靈':id==='keyboard-piranha'?'加班遊魂文員':id).join('、')+'。無須下載圖片；其餘怪物仍是工程替身。'+
    (activeNormalVariant?' 🔬 實驗換皮：'+activeNormalVariant.name+'，完全共用正式逐格動畫；不增加 32 種完成數。':'');
 }
 if(activeNormalVariant)render();
}
const artMode=new URLSearchParams(location.search).get('art');
// High-resolution Q版 is now the normal V19 hero art, not a hidden opt-in.
// A temporary ?art=legacy escape hatch exists only to troubleshoot old saves/browsers.
const chibiV2Mode=artMode!=='legacy';
const chibiArtPreview=chibiV2Mode;
const CHIBI_V2_STORAGE='salary-hero-v19-local-chibi-v2-atlas';
const CHIBI_HURT_STORAGE='salary-hero-v19-local-chibi-hurt-v1';
let hostedAttackSprite=null,hostedHurtSprite=null;
let hurtPreviewStart=0;
const motionReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;
const hurtTintCanvas=document.createElement('canvas');
const hurtTintCtx=hurtTintCanvas.getContext('2d');
/** Tint is composited on an isolated transparent sprite, never over the scene or HUD. */
function drawHurtTintedSprite(image,sx,sy,sw,sh,dx,dy,dw,dh,effect){
 if(!effect?.active||effect.flashAlpha<.01||!hurtTintCtx){
   ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);return;
 }
 if(hurtTintCanvas.width!==sw||hurtTintCanvas.height!==sh){
   hurtTintCanvas.width=sw;hurtTintCanvas.height=sh;
 }
 hurtTintCtx.clearRect(0,0,sw,sh);
 hurtTintCtx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
 hurtTintCtx.save();
 hurtTintCtx.globalCompositeOperation='source-atop';
 hurtTintCtx.globalAlpha=effect.flashAlpha;
 hurtTintCtx.fillStyle=effect.flashColor;
 hurtTintCtx.fillRect(0,0,sw,sh);
 hurtTintCtx.restore();
 ctx.drawImage(hurtTintCanvas,dx,dy,dw,dh);
}
/** Small red-orange starburst at the hero's shoulder, never full-screen. */
function drawHurtSparks(x,y,effect){
 if(!effect.active||effect.sparkAlpha<=.01)return;
 const t=effect.sparkProgress;
 ctx.save();
 ctx.translate(x,y);
 ctx.globalAlpha=effect.sparkAlpha;
 const radius=11+t*24;
 const halo=ctx.createRadialGradient(0,0,1,0,0,radius*1.65);
 halo.addColorStop(0,'#fff8db');halo.addColorStop(.17,'#ffeaaa');
 halo.addColorStop(.42,'#ff7051a0');halo.addColorStop(1,'#ff353000');
 ctx.fillStyle=halo;
 ctx.beginPath();ctx.arc(0,0,radius*1.65,0,Math.PI*2);ctx.fill();
 for(let i=0;i<HIT_SPARK_COUNT;i++){
   const angle=i*Math.PI*2/HIT_SPARK_COUNT+.16;
   const near=7+t*5,far=17+t*(18+(i%3)*8);
   ctx.strokeStyle=i%3===0?'#fff5d2':i%2===0?'#ffb15c':'#ff505a';
   ctx.lineWidth=i%3===0?4:2.6;ctx.lineCap='round';
   ctx.beginPath();
   ctx.moveTo(Math.cos(angle)*near,Math.sin(angle)*near);
   ctx.lineTo(Math.cos(angle)*far,Math.sin(angle)*far);
   ctx.stroke();
 }
 ctx.restore();
}
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
if(chibiV2Mode){
 assetPaths.chibiIdle='../art/v19/candidates/characters/starter/chibi/idle-candidate.webp';
 // These are REAL binaries committed to main, not 404 placeholders / 128px previews.
 assetPaths.chibiAttackV2='../art/v19/candidates/characters/starter/chibi/attack-v2-7pose-512.png?v=5ae7bb6';
 assetPaths.chibiHurtV1='../art/v19/candidates/characters/starter/chibi/hurt-v1-5pose-384.webp?v=5ae7bb6';
 const sub=$('.subtitle');
 if(sub)sub.textContent+=' · 高清 Q版七姿勢攻擊・五姿勢受傷';
}
function imageFrom(url){
 return new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('無法載入 '+url));img.src=url.startsWith('data:')?url:new URL(url,import.meta.url).href;
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
 if(item.id==='briefcase'&&images.weaponBriefcase){ctx.drawImage(images.weaponBriefcase,-43,-20,79,85);}
 else if(item.id==='excalibur'){ctx.drawImage(images.weapon,-32,-88,85,100);}
 else {ctx.font='bold 53px system-ui';ctx.textAlign='center';ctx.fillText(item.icon,0,5);}
 ctx.restore();
}
/** A drawable body is mandatory for EVERY wave, including emoji-only roster entries.
 *  The first wave loads the paper monster SVG; all other waves receive a Q版
 *  illustrated monster silhouette when they have no dedicated sprite yet. */
// 32 real monster actors: per-species anatomy/poses, not shared emoji bodies.
function paintEnemy(enemy,now,visual={state:'idle',progress:0},combatMs=Infinity){
 const illustrated=approvedMonsterArt.get(enemy.typeId)||trainingCandidateArt.get(enemy.typeId);
 if(illustrated){
   const pose=illustrated[visual?.state]||illustrated.idle;
   if(pose){
     const {image,frame}=pose,durations=frame.durations;
     const duration=durations.reduce((a,b)=>a+b,0);
     const elapsed=visual?.state==='idle'?now:duration*Math.max(0,Math.min(1,visual?.progress||0));
     // Production art uses a square transparent canvas. Ground its FOOT baseline
     // at the arena floor instead of positioning the image's top like the old
     // placeholder actor (which made approved sprites appear to float).
     const boxW=enemy.boss?214:enemy.tier==='elite'?194:177;
     const displaySize=enemy.boss?316:enemy.tier==='elite'?295:282;
     const sourceFloor=Number.isFinite(frame.ground_y)?frame.ground_y:frame.cell*.903125;
     const frameX=(boxW-displaySize)*.5;
     const frameY=525-248-displaySize*sourceFloor/frame.cell;
     const skin=liveVariantFor(enemy);
     if(drawNormalVariantFrame(ctx,image,frame,frameX,frameY,displaySize,displaySize,elapsed,visual?.state==='idle',skin)){
        if(trainingSpecies==='keyboard-piranha'&&enemy.typeId==='keyboard-piranha'&&
           !(fx?.result?.type==='victory'&&visual?.state==='idle')){
          world.dataset.clerkPose=visual?.state||'idle';
          world.dataset.clerkFrame=String(spriteFrameIndex(frame.durations,elapsed,visual?.state==='idle'));
          const flash=clerkHurtFlashAt(combatMs,{reducedMotion:motionReduced});
          world.dataset.clerkFlash=JSON.stringify(flash);
          world.dataset.clerkPeakRed=String(Math.max(Number(world.dataset.clerkPeakRed)||0,flash.red));
        }
        if(trainingSpecies==='deadline-clock'&&enemy.typeId==='deadline-clock'&&
           !(fx?.result?.type==='victory'&&visual?.state==='idle')){
          world.dataset.cloudPose=visual?.state||'idle';
          world.dataset.cloudFrame=String(spriteFrameIndex(frame.durations,elapsed,visual?.state==='idle'));
          const flash=cloudHurtFlashAt(combatMs,{reducedMotion:motionReduced});
          world.dataset.cloudFlash=JSON.stringify(flash);
          world.dataset.cloudPeakRed=String(Math.max(Number(world.dataset.cloudPeakRed)||0,flash.red));
        }
        if(trainingSpecies==='meeting-ghost'&&enemy.typeId==='meeting-ghost'&&
           !(fx?.result?.type==='victory'&&visual?.state==='idle')){
          world.dataset.alienPose=visual?.state||'idle';
          world.dataset.alienFrame=String(spriteFrameIndex(frame.durations,elapsed,visual?.state==='idle'));
          const flash=alienInjuryAt(combatMs,{reducedMotion:motionReduced});
          world.dataset.alienFlash=JSON.stringify(flash);
          world.dataset.alienRedPeak=String(Math.max(Number(world.dataset.alienRedPeak)||0,flash.red));
        }
       if(trainingSpecies==='chair-golem'&&enemy.typeId==='chair-golem'&&
          // During the crossfade both outgoing and incoming are the SAME
          // species. Track the still-visible dying mech, not the freshly
          // spawned idle mech drawn on top during its first transparent frames.
          !(fx?.result?.type==='victory'&&visual?.state==='idle')){
         // Browser QA reports what the player ACTUALLY sees, not a guessed timer.
         world.dataset.guardPose=visual?.state||'idle';
         world.dataset.guardFrame=String(spriteFrameIndex(frame.durations,elapsed,visual?.state==='idle'));
         const visualFlash=guardArmorFlashAt(combatMs,{reducedMotion:motionReduced});
         world.dataset.guardFlash=JSON.stringify(visualFlash);
         world.dataset.guardPeakRed=String(Math.max(Number(world.dataset.guardPeakRed)||0,visualFlash.red));
       }
       // Alpha-masked, silhouette-perfect white → scarlet → fade. Only on an
       // actual hit/defeat; never tint the entire arena or the idle actor.
       if((enemy.typeId==='paper-gremlin'||enemy.typeId==='coffee-mimic'||enemy.typeId==='chair-golem'||enemy.typeId==='meeting-ghost'||enemy.typeId==='deadline-clock'||enemy.typeId==='keyboard-piranha')&&(visual?.state==='hurt'||visual?.state==='defeat')){
         const frameIndex=spriteFrameIndex(frame.durations,elapsed,visual?.state==='idle');
         const rect={x:frameX,y:frameY,w:displaySize,h:displaySize};
         if(enemy.typeId==='keyboard-piranha'){
           const tinted=drawClerkHurtTint(ctx,image,frame,frameIndex,rect,combatMs,{reducedMotion:motionReduced});
           if(trainingSpecies==='keyboard-piranha'&&tinted)world.dataset.clerkTintApplied='true';
         }else if(enemy.typeId==='chair-golem'){
           const tinted=drawGuardArmorTint(ctx,image,frame,frameIndex,rect,combatMs,{reducedMotion:motionReduced});
           if(trainingSpecies==='chair-golem'&&tinted)world.dataset.guardTintApplied='true';
         }else if(enemy.typeId==='deadline-clock'){
           const tinted=drawCloudHurtTint(ctx,image,frame,frameIndex,rect,combatMs,{reducedMotion:motionReduced});
           if(trainingSpecies==='deadline-clock'&&tinted)world.dataset.cloudTintApplied='true';
         }else if(enemy.typeId==='meeting-ghost'){
           const tinted=drawAlienInjuryTint(ctx,image,frame,frameIndex,rect,combatMs,{reducedMotion:motionReduced});
           if(trainingSpecies==='meeting-ghost'&&tinted)world.dataset.alienTintApplied='true';
         }else{
           drawPaperHitTint(ctx,image,frame,frameIndex,rect,combatMs,{reducedMotion:motionReduced});
         }
       }
       return;
     }
   }
 }
 // Unapproved prototype only; do not call this a sprite animation.
 drawMonsterActor(ctx,enemy,now,visual);
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
 const phase=fx?Math.min((now-fx.start)/1000,2):3;
 const animationMs=fx?Math.max(0,(now-fx.start)*state.speed):Infinity;
 const chibiV2Ready=chibiV2Mode&&Boolean(images.chibiIdle&&images.chibiAttackV2);
 // The paper caster needs time to visibly launch its projectile BEFORE the
 // hero reacts. Damage is computed by the engine; only the feedback is delayed.
 const illustratedCaster=fx?.result?.type==='hit'&&fx?.retaliationDamage>0&&
  ((fx?.oldEnemy?.typeId==='paper-gremlin'&&approvedMonsterArt.has('paper-gremlin'))||
   (fx?.oldEnemy?.typeId==='coffee-mimic'&&approvedMonsterArt.has('coffee-mimic'))||
   (fx?.oldEnemy?.typeId==='chair-golem'&&approvedMonsterArt.has('chair-golem'))||
   (fx?.oldEnemy?.typeId==='meeting-ghost'&&approvedMonsterArt.has('meeting-ghost'))||
   (fx?.oldEnemy?.typeId==='deadline-clock'&&approvedMonsterArt.has('deadline-clock'))||
   (fx?.oldEnemy?.typeId==='keyboard-piranha'&&approvedMonsterArt.has('keyboard-piranha')));
 const attackDurationMs=illustratedCaster?(fx?.oldEnemy?.typeId==='keyboard-piranha'?CLERK_REPORT_IMPACT_MS:fx?.oldEnemy?.typeId==='deadline-clock'?CLOUD_CLOCK_IMPACT_MS:fx?.oldEnemy?.typeId==='meeting-ghost'?ALIEN_STAMP_IMPACT_MS:fx?.oldEnemy?.typeId==='chair-golem'?GUARD_BEAM_IMPACT_MS:fx?.oldEnemy?.typeId==='coffee-mimic'?COFFEE_SPRAY_IMPACT_MS:PAPER_PROJECTILE_IMPACT_MS):(chibiV2Ready?CHIBI_ATTACK_V2_TOTAL_MS:680);
 const hurtAtlas=chibiV2Mode?images.chibiHurtV1:null;
 const hurtCell=hurtAtlas?validateHurtAtlas(hurtAtlas.naturalWidth,hurtAtlas.naturalHeight):0;
 const hurtVfx=hurtPlaybackAt(now,fx?.start??now,state.speed,attackDurationMs,
   !!fx?.retaliation,hurtPreviewStart,{reducedMotion:motionReduced});
 const hurtPoseIndex=hurtVfx.active&&hurtCell?hurtVfx.frame:-1;
 const attacking=Boolean(fx&&typeof fx.wave==='number')&&
    (chibiV2Ready?attackFrameAt(animationMs)>=0:chibiArtPreview?animationMs<680:phase<.7);
 // Chibi motion comes from distinct pixel poses, NOT moving/rotating a single static sprite.
 const chibiReady=Boolean(chibiV2Mode&&images.chibiIdle);
 // The hero must physically close the distance before contact, even with illustrated Q版 frames.
 // Keep a full-contact position through impact, then retreat during recovery.
 const lunge=chibiReady&&chibiV2Ready&&attacking
   ?(animationMs<345?0:animationMs<405?(animationMs-345)/60*106:
     animationMs<650?106:106*Math.max(0,1-(animationMs-650)/155))
   :(attacking?(phase<.20?phase/.20*86:phase<.39?86:86*Math.max(0,1-(phase-.39)/.27)):0);
 const heroX=100+lunge,heroY=227+(chibiReady?0:Math.sin(time*3.2)*4);
 shadow(heroX+133,515,110,17);
 ctx.save();ctx.translate(heroX+120+hurtVfx.shakeX,heroY+148+hurtVfx.shakeY);
 ctx.rotate(chibiReady?0:(attacking&&phase<.32?-.09:Math.sin(time*1.4)*.018));
 ctx.translate(-120,-148);
 // Approved atlas is drawn facing away from the opponent; mirror the actor only.
 // The opponent and the whole arena stay in their original world coordinates.
 if(chibiReady){ctx.translate(240,0);ctx.scale(-1,1);}
 const pose=hurtVfx.active?images.heroHurt:(attacking
   ?(fx?.result?.type==='victory'&&phase>.42?images.heroVictory:images.heroAttack)
   :(!state.auto?images.heroSleep:images.hero));
 if(chibiReady){
  // The new V2 sprites never stretch, ghost/cross-fade or translate the whole character.
  // Original art was 7 genuinely different limb/briefcase poses; target dimensions are square.
  if(hurtPoseIndex>=0&&hurtCell){
   // These five drawings change arms, head, legs, expression and briefcase position.
   drawHurtTintedSprite(hurtAtlas,hurtPoseIndex*hurtCell,0,hurtCell,hurtCell,-25,8,306,306,hurtVfx);
  }else if(attacking&&chibiV2Ready){
   const frameIndex=attackFrameAt(animationMs);
   const cell=validateAttackAtlas(images.chibiAttackV2.naturalWidth,images.chibiAttackV2.naturalHeight);
   if(cell>0)ctx.drawImage(images.chibiAttackV2,frameIndex*cell,0,cell,cell,-25,8,306,306);
   else ctx.drawImage(images.chibiIdle,-7,44,270,270);
  }else{
   // Missing HD atlas must never silently fall back to a blurry 128×128 AVIF.
   drawHurtTintedSprite(images.chibiIdle,0,0,images.chibiIdle.naturalWidth,
     images.chibiIdle.naturalHeight,-7,44,270,270,hurtVfx);
  }
 }else{
  drawHurtTintedSprite(pose,0,0,pose.naturalWidth,pose.naturalHeight,0,0,236,306,hurtVfx);
 }
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
 if(!chibiReady&&!hurtVfx.active)drawWeapon(heroX+188,heroY+222,phase);
 if(hurtVfx.active){
   drawHurtSparks(heroX+159,heroY+136,hurtVfx);
   if(hurtVfx.source==='retaliation'&&fx?.retaliationDamage>0){
     ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,(HIT_FEEDBACK_MS-(animationMs-attackDurationMs))/240));
     ctx.textAlign='center';ctx.font='900 28px system-ui';
     ctx.lineWidth=5;ctx.strokeStyle='#34111d';ctx.fillStyle='#ff8f83';
     ctx.strokeText('-'+fx.retaliationDamage,heroX+142,heroY+28);
     ctx.fillText('-'+fx.retaliationDamage,heroX+142,heroY+28);
     ctx.restore();
   }
 }
 // Party pet is independently animated, not baked into the background.
 ctx.save();ctx.translate(55,478+Math.sin(time*2)*4);ctx.font='55px system-ui';ctx.fillText('🐈',0,0);ctx.restore();
 const guardVictoryHold=fx?.oldEnemy?.typeId==='chair-golem'&&approvedMonsterArt.has('chair-golem');
 const alienVictoryHold=fx?.oldEnemy?.typeId==='meeting-ghost'&&approvedMonsterArt.has('meeting-ghost');
 const cloudVictoryHold=fx?.oldEnemy?.typeId==='deadline-clock'&&approvedMonsterArt.has('deadline-clock');
 const clerkVictoryHold=fx?.oldEnemy?.typeId==='keyboard-piranha'&&approvedMonsterArt.has('keyboard-piranha');
 const victory=fx?.result?.type==='victory'&&animationMs<(clerkVictoryHold?CLERK_DEFEAT_END_MS:cloudVictoryHold?CLOUD_DEFEAT_END_MS:guardVictoryHold?GUARD_DEFEAT_END_MS:alienVictoryHold?ALIEN_DEFEAT_END_MS:1100);
 const hitWindow=chibiV2Ready?animationMs>=405&&animationMs<=580:phase>.25&&phase<.6;
 const illustratedPaperInScene=hasIllustratedMonster(state.enemy?.typeId)||
   (victory&&hasIllustratedMonster(fx?.oldEnemy?.typeId));
 // No rigid-body bobble/shake on approved, separately illustrated poses.
 const enemyX=458+(illustratedPaperInScene?0:Math.sin(time*1.75)*4)+(attacking&&hitWindow&&!illustratedPaperInScene?Math.sin(now/22)*7:0);
 const enemyY=248+(illustratedPaperInScene?0:Math.sin(time*2)*5);
 // The defeated actor plays its own disintegration, while the next species
 // materializes in the SAME slot with no empty frame between waves.
 const guardShattering=victory&&guardVictoryHold;
 const alienShattering=victory&&alienVictoryHold;
 const cloudShattering=victory&&cloudVictoryHold;
 const clerkShattering=victory&&clerkVictoryHold;
 const fadeStart=clerkShattering?CLERK_FADE_START_MS:cloudShattering?CLOUD_FADE_START_MS:guardShattering?GUARD_DEFEAT_FADE_START_MS:alienShattering?1450:900;
 const fadeEnd=clerkShattering?CLERK_DEFEAT_END_MS:cloudShattering?CLOUD_DEFEAT_END_MS:guardShattering?GUARD_DEFEAT_END_MS:alienShattering?ALIEN_DEFEAT_END_MS:1100;
 const enteringNew=victory?Math.max(0,Math.min(1,(animationMs-fadeStart)/(fadeEnd-fadeStart))):1;
 const fadingOld=victory?1-enteringNew:0;
 const visualFor=(enemy,result)=>{
   const hitResult=result?{...result,retaliationDamage:fx?.retaliationDamage||0}:null;
   if(enemy?.typeId==='paper-gremlin'&&approvedMonsterArt.has('paper-gremlin'))return paperCombatPoseAt(animationMs,hitResult);
   if(enemy?.typeId==='coffee-mimic'&&approvedMonsterArt.has('coffee-mimic'))return coffeeCombatPoseAt(animationMs,hitResult);
   if(enemy?.typeId==='chair-golem'&&approvedMonsterArt.has('chair-golem'))return guardCombatPoseAt(animationMs,hitResult);
   if(enemy?.typeId==='meeting-ghost'&&approvedMonsterArt.has('meeting-ghost'))
     return alienCombatPoseAt(animationMs,hitResult);
   if(enemy?.typeId==='deadline-clock'&&approvedMonsterArt.has('deadline-clock'))
     return cloudCombatPoseAt(animationMs,hitResult);
   if(enemy?.typeId==='keyboard-piranha'&&approvedMonsterArt.has('keyboard-piranha'))
     return clerkCombatPoseAt(animationMs,hitResult);
   return monsterAnimationState(enemy,animationMs,hitResult);
 };
 const oldVisual=victory?visualFor(fx.oldEnemy,fx.result):null;
 const currentVisual=!victory&&fx?.result?.type==='hit'
   ?visualFor(state.enemy,fx.result):{state:'idle',progress:0};
 const drawEnemy=(enemy,alpha,visual)=>{
   if(!enemy||alpha<=0)return;
   const pivotX=enemy.boss?107:enemy.tier==='elite'?97:88.5;
   const pivotY=enemy.boss?129:enemy.tier==='elite'?124:120;
   ctx.save();ctx.globalAlpha=alpha;
   ctx.translate(enemyX+pivotX,enemyY+pivotY);
   const hasIndividualArt=hasIllustratedMonster(enemy.typeId);
   if(!hasIndividualArt)ctx.rotate(Math.sin(time*1.1)*.018);
   ctx.translate(-pivotX,-pivotY);
   paintEnemy(enemy,now,visual,animationMs);
   ctx.restore();
   if(visual?.state!=='idle'&&visual?.state&&!hasIllustratedMonster(enemy?.typeId)){
     ctx.save();ctx.globalAlpha=alpha;
     drawMonsterVfx(ctx,enemy,visual.state,visual.progress,
       {enemyX,enemyY,heroX:heroX+70,heroY:heroY+110,now});
     ctx.restore();
   }
 };
 shadow(enemyX+90,525,state.enemy.boss?100:84,17);
 if(victory)drawEnemy(fx.oldEnemy,fadingOld,oldVisual);
 drawEnemy(state.enemy,enteringNew,currentVisual);
 if(fx?.wave&&approvedMonsterArt.has('paper-gremlin')&&
   (fx?.oldEnemy?.typeId==='paper-gremlin')&&
   (fx.result?.type==='hit'||fx.result?.type==='victory')){
   drawPaperCombatFx(ctx,animationMs,{
     enemyX,enemyY,heroX,heroY,reducedMotion:motionReduced,
     attackAllowed:fx.result.type==='hit'&&fx.retaliationDamage>0
   });
 }
 if(fx?.wave&&approvedMonsterArt.has('coffee-mimic')&&fx?.oldEnemy?.typeId==='coffee-mimic'&&
    (fx.result?.type==='hit'||fx.result?.type==='victory')){
   drawCoffeeCombatFx(ctx,animationMs,{enemyX,enemyY,heroX,heroY,reducedMotion:motionReduced,
     canRetaliate:fx.result.type==='hit'&&fx.retaliationDamage>0});
 }
 if(fx?.wave&&approvedMonsterArt.has('chair-golem')&&fx?.oldEnemy?.typeId==='chair-golem'&&
    (fx.result?.type==='hit'||fx.result?.type==='victory')){
   drawGuardCombatFx(ctx,animationMs,{enemyX,enemyY,heroX,heroY,reducedMotion:motionReduced,
     canRetaliate:fx.result.type==='hit'&&fx.retaliationDamage>0,
     eliteSkill:fx.result.enemySkill==='菁英反制'});
 }
 // Fourth species rehearsal: separate purple stamp charge, projectile and
 // impact. The alien's actor art is NOT promoted or counted in the 3/32.
 if(fx?.wave&&approvedMonsterArt.has('meeting-ghost')&&fx?.oldEnemy?.typeId==='meeting-ghost'&&
    fx.result?.type==='hit'){
   drawAlienStampFx(ctx,animationMs,{enemyX,enemyY,heroX,heroY,
      reducedMotion:motionReduced,canRetaliate:fx.retaliationDamage>0});
   const stamp=alienStampAt(animationMs,fx.retaliationDamage>0);
   const route=alienStampRouteAt(animationMs,{enemyX,enemyY,heroX,heroY});
   world.dataset.alienStamp=JSON.stringify({elapsed:Math.floor(animationMs),
      charge:stamp.charge,projectile:stamp.projectile,impact:stamp.impact,
      originX:route.originX,targetX:route.targetX,x:route.x,travelsLeft:route.travelsLeft});
 }
 // Fifth cloud spirit: time-dial projectile toward hero, never fake body animation.
 if(fx?.wave&&approvedMonsterArt.has('deadline-clock')&&fx?.oldEnemy?.typeId==='deadline-clock'&&
    fx.result?.type==='hit'){
   drawCloudClockFx(ctx,animationMs,{enemyX,enemyY,heroX,heroY,
     canRetaliate:fx.retaliationDamage>0,reducedMotion:motionReduced});
   const clock=cloudClockAt(animationMs,fx.retaliationDamage>0,{enemyX,enemyY,heroX,heroY});
   world.dataset.cloudClock=JSON.stringify({elapsed:Math.floor(animationMs),
     projectile:clock.projectile,impact:clock.impact,charge:clock.charge,
     x:clock.x,originX:clock.originX,targetX:clock.targetX,travelsLeft:clock.travelsLeft});
 }
 // Human ghost clerk, floor 26: haunted documents fired from enemy right to hero left.
 if(fx?.wave&&fx?.oldEnemy?.typeId==='keyboard-piranha'&&
    approvedMonsterArt.has('keyboard-piranha')&&fx.result?.type==='hit'){
  drawClerkReportFx(ctx,animationMs,{enemyX,enemyY,heroX,heroY,
     canRetaliate:fx.retaliationDamage>0,reducedMotion:motionReduced});
  const papers=clerkReportAt(animationMs,fx.retaliationDamage>0,{enemyX,enemyY,heroX,heroY});
  world.dataset.clerkPaper=JSON.stringify({elapsed:Math.floor(animationMs),
    charge:papers.charge,projectile:papers.projectile,impact:papers.impact,
    x:papers.x,originX:papers.originX,targetX:papers.targetX,travelsLeft:papers.travelsLeft});
 }
 const slashActive=attacking&&(chibiV2Ready?(animationMs>=345&&animationMs<550):(phase>.17&&phase<.55));
 const impactActive=attacking&&(chibiV2Ready?(animationMs>=405&&animationMs<600):(phase>.27&&phase<.68));
 if(slashActive){
   ctx.save();ctx.globalAlpha=chibiV2Ready?Math.max(0,1-(animationMs-345)/205):Math.max(0,Math.min(1,(.55-phase)*3.2));ctx.translate(chibiV2Ready?heroX+226:343,287);ctx.rotate(-.2);
   ctx.drawImage(images.slash,-85,-80,286,240);ctx.restore();
 }
 if(impactActive){
   const strength=chibiV2Ready?Math.max(0,1-(animationMs-405)/195):Math.max(0,Math.min(1,(.68-phase)*4));ctx.save();ctx.globalAlpha=strength;
   ctx.drawImage(images.impact,enemyX+18,enemyY+38,156,156);ctx.restore();
 }
 if(slashActive){
   const alpha=chibiV2Ready?Math.max(0,1-(animationMs-345)/205):(.55-phase)/.38;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#aafaff';ctx.shadowColor='#55dbff';ctx.shadowBlur=25;ctx.lineWidth=20;
   ctx.beginPath();ctx.arc(chibiV2Ready?heroX+270:395,370,110,-1.4,1.3);ctx.stroke();ctx.lineWidth=6;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(chibiV2Ready?heroX+275:400,366,124,-1.4,1.3);ctx.stroke();ctx.restore();
 }
 if(fx&&(fx.result?.type==='hit'||fx.result?.type==='victory')&&phase<1.05&&(!chibiV2Ready||animationMs>=405)){
  const y=335-phase*80;ctx.save();ctx.globalAlpha=Math.min(1,(1.05-phase)*3);ctx.font='900 43px system-ui';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2d163c';ctx.strokeText('-'+fx.result.damage,546,y);ctx.fillStyle=fx.result.crit?'#fff3a9':'#ff8a9e';ctx.fillText('-'+fx.result.damage,546,y);ctx.restore();
 }
 if(hurtVfx.active&&fx?.result?.enemySkill){
   ctx.save();ctx.globalAlpha=Math.min(1,hurtVfx.flashAlpha+.4);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 25px system-ui';
   ctx.strokeStyle='#2b1232';ctx.lineWidth=5;ctx.fillStyle='#ffde97';
   ctx.strokeText(fx.result.enemySkill,548,212);
   ctx.fillText(fx.result.enemySkill,548,212);ctx.restore();
 }
 if(victory&&phase<1.35){ctx.save();ctx.globalAlpha=Math.min(1,(1.35-phase)*2);ctx.textAlign='center';ctx.font='bold 32px system-ui';ctx.fillStyle='#ffdb88';ctx.strokeStyle='#32132e';ctx.lineWidth=5;ctx.strokeText('勝利！ +'+fx.result.gold+' 🪙',365,170);ctx.fillText('勝利！ +'+fx.result.gold+' 🪙',365,170);ctx.restore();}
 // Art is rendered in physical layers: background, moving actors, combat FX,
 // independent cherry blossom / gilded foreground, then free-floating lights.
 ctx.save();
 ctx.globalAlpha=.94;
 if(images.foreground)ctx.drawImage(images.foreground,Math.cos(time*.30)*4,0,W,H);
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
let lastCombatBarKey='';
function attackInCooldown(now){
 return Boolean(fx&&(now-fx.start)<attackCooldownMs()/state.speed);
}
function renderCombatBars(now){
 $('#attack').disabled=!ready||attackInCooldown(now);
 const elapsed=fx?Math.max(0,(now-fx.start)*state.speed):Infinity;
 const caster=fx?.oldEnemy?.typeId;
 const illustrated=fx?.retaliation&&(hasIllustratedMonster(caster)||
   (caster==='meeting-ghost'&&approvedMonsterArt.has('meeting-ghost'))||
   (caster==='deadline-clock'&&approvedMonsterArt.has('deadline-clock')));
 const contactMs=illustrated&&['paper-gremlin','coffee-mimic','chair-golem','meeting-ghost','deadline-clock','keyboard-piranha'].includes(caster)
   ?(caster==='keyboard-piranha'?CLERK_REPORT_IMPACT_MS:caster==='deadline-clock'?CLOUD_CLOCK_IMPACT_MS:caster==='meeting-ghost'?ALIEN_STAMP_IMPACT_MS:caster==='chair-golem'?GUARD_BEAM_IMPACT_MS:caster==='coffee-mimic'?COFFEE_SPRAY_IMPACT_MS:PAPER_PROJECTILE_IMPACT_MS)
   :(chibiV2Mode&&images.chibiAttackV2?CHIBI_ATTACK_V2_TOTAL_MS:680);
 const view=visibleCombatHealthAt(state,fx,elapsed,{retaliationContactMs:contactMs});
 if(trainingWave!==null)world.dataset.hpTiming=JSON.stringify({t:Math.floor(elapsed),stateType:fx?.result?.type||null,retaliation:!!fx?.retaliation,caster,illustrated:!!illustrated,contactMs,oldHeroHp:fx?.oldHeroHp,realHeroHp:state.heroHp,visibleHeroHp:view.heroHp});
 const key=[view.heroHp,view.enemyHp,view.maxHero,view.maxEnemy].join('|');
 if(key===lastCombatBarKey)return;
 lastCombatBarKey=key;
 $('#hero-hp-text').textContent=Math.ceil(view.heroHp)+'/'+Math.ceil(view.maxHero);
 $('#hero-hp-fill').style.width=(view.heroHp/view.maxHero*100)+'%';
 $('#enemy-hp-fill').style.width=(view.enemyHp/view.maxEnemy*100)+'%';
}
function render(){
 $('#gold').textContent=format(state.gold);$('#gems').textContent=format(state.gems);
 const ticketCounter=$('#skin-tickets');if(ticketCounter)ticketCounter.textContent=format(state.skinTickets);
 const enemyTier=state.enemy.tier||'normal';
 $('#wave').textContent=(GAME_MODES.find(m=>m.id===state.activeMode)?.name||'社畜遠征')+' · 第 '+state.wave+' 關'+(trainingWave!==null?'（練習）':'');
 $('#wave').classList.toggle('boss',enemyTier==='boss');
 $('#wave').classList.toggle('elite',enemyTier==='elite');
 world.dataset.enemyTier=enemyTier;
 document.querySelector('.enemy-meter')?.classList.toggle('elite',enemyTier==='elite');
 document.querySelector('.enemy-meter')?.classList.toggle('boss',enemyTier==='boss');
 $('#level').textContent='Lv.'+state.level+' '+playerTitle(state);
 renderCombatBars(performance.now());
 $('#enemy-name').textContent=(enemyTier==='boss'?'👑 ':enemyTier==='elite'?'✦ ':'')+(liveVariantFor(state.enemy)?.name||state.enemy.name);
 const trait=$('#enemy-trait');
 if(trait){
   const skillCharge=enemyTier==='elite'?' · 反制 '+(state.enemy.turns||0)%3+'/3':
     enemyTier==='boss'?' · 狂暴 '+(state.enemy.turns||0)%4+'/4':'';
   trait.textContent=state.enemy.family+' · '+state.enemy.traitText+skillCharge;
 }
 $('#game-log').textContent=state.log[0]||'冒險中';
 $('#auto').textContent='🤖 自動 '+(state.auto?'ON':'OFF');
 $('#auto').setAttribute('aria-pressed',String(state.auto));
 $('#speed').textContent='⏩ 速度 ×'+state.speed;
 $('#heal').textContent='❤️ 治療 ×'+state.potions;
 $('#heal').disabled=!ready||state.potions===0||state.heroHp===state.maxHp;
 $('#attack').disabled=!ready||attackInCooldown(performance.now());$('#claim').disabled=!ready||state.pendingDrops.length===0;$('#chest').disabled=!ready||state.chests===0;
 $('#claim').textContent='🎁 掉寶 ('+state.pendingDrops.length+')';
 $('#chest').textContent='📦 寶箱 ('+state.chests+')';
 if(currentPanel&&panel.open)renderPanel(currentPanel);
}
function commit(action){
 const type=typeof action==='string'?action:action?.type;
 if(!ready&&!['setName','toggleFavoriteStyle','equipSkin','drawSkin','claimSkinEvent'].includes(type))return;
 const oldEnemy={...state.enemy},wasWave=state.wave,oldHeroHp=state.heroHp;
 state=transition(state,action);
 if(trainingWave!==null&&(type==='attack'||type==='skill')&&state.last?.type==='victory'){
   // Victory/defeat animation still uses fx.oldEnemy. The new combatant fades
   // back in after the 16-pose shatter; no persistent progress is awarded.
   state=repeatTrainingEnemy(state,trainingSpecies,enemyFor);
 }
 if(type==='attack'||type==='skill'){
   if(trainingSpecies==='chair-golem'){world.dataset.guardPeakRed='0';world.dataset.guardTintApplied='false';}
   if(trainingSpecies==='meeting-ghost'){world.dataset.alienRedPeak='0';world.dataset.alienTintApplied='false';}
   if(trainingSpecies==='keyboard-piranha'){world.dataset.clerkPeakRed='0';world.dataset.clerkTintApplied='false';}
   fx={start:performance.now(),result:state.last,oldEnemy,oldHeroHp,wave:wasWave,
      retaliation:shouldRecoil(oldHeroHp,state.heroHp,state.last),
      retaliationDamage:Math.max(0,Number(state.last?.retaliationDamage??(oldHeroHp-state.heroHp)))};
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
 const headers={modes:'冒險模式',skills:'戰鬥技能',hero:'角色狀態',styles:'造型衣櫃・活動與抽獎',equipment:'裝備背包',adventure:'每日奇遇',collection:'怪物圖鑑',shop:'商店',salary:'薪資中心'};
 $('#panel-title').textContent=headers[type]||'薪水勇者';
 if(type==='modes'){
  body.innerHTML='<p>已開放普通怪循環版本：首領與菁英怪暫不進入正式戰鬥。每個模式各自紀錄關卡，裝備、等級與貨幣共用。</p>'+
   GAME_MODES.map(mode=>'<div class="item"><div class="detail"><strong>'+mode.name+'</strong><small>'+mode.description+' · 第 '+state.modeWaves[mode.id]+' 關</small></div>'+btn(state.activeMode===mode.id?'進行中':'進入','mode',mode.id,state.activeMode===mode.id)+'</div>').join('');
 }else if(type==='skills'){
  body.innerHTML='<p>技能在實際戰鬥中生效，使用後依攻擊次數冷卻；自動模式會優先施放可使用的技能。</p>'+
   GAME_SKILLS.map(skill=>'<div class="item"><div class="detail"><strong>'+skill.name+'</strong><small>'+skill.description+' · 冷卻 '+skill.cooldown+' 回合</small></div>'+btn(state.skillCooldowns[skill.id]?'冷卻 '+state.skillCooldowns[skill.id]:'施放','skill',skill.id,!!state.skillCooldowns[skill.id])+'</div>').join('');
 }else if(type==='hero'){
  const it=ITEMS.find(x=>x.id===state.equipped);
  body.innerHTML='<div class="center"><span class="large-symbol">🧑‍💼</span><h3>Lv.'+state.level+' '+escapeHTML(playerTitle(state))+'</h3></div><div class="item"><div class="detail"><strong>生命 '+Math.ceil(state.heroHp)+'/'+state.maxHp+'</strong><small>經驗 '+state.xp+'/'+(50+state.level*30)+' · 已擊敗 '+state.cleared+' 隻</small><small>第 '+state.wave+' 關 · 普通→普通→菁英→Boss，Boss 勝利回滿血</small></div></div><div class="item"><span class="symbol">'+it.icon+'</span><div class="detail"><strong>'+it.name+'</strong><small>目前攻擊 '+it.attack+' · 藥水 '+state.potions+'</small></div></div>'+'<div class="item"><div class="detail"><strong>目前選用：'+escapeHTML(skinById(state.activeSkin)?.name||'平凡社畜')+'</strong><small>已取得 '+state.ownedSkins.length+'/'+SKINS.length+' 套造型 · 🎟️ '+state.skinTickets+' 張造型券</small></div></div>'
  +btn('✎ 修改遊戲名稱','rename')+btn('🎭 造型衣櫃與活動抽獎','styles')+btn('治療 +65 HP','heal','',!state.potions||state.heroHp===state.maxHp);
 } else if(type==='styles'){
  body.innerHTML=renderSkinPanel(state);
 } else if(type==='equipment'){
  body.innerHTML='<p>更換裝備立即影響實際傷害，戰場中的武器外觀也會切換。</p>'+ITEMS.map(it=>itemRow(it,'equip')).join('')+(state.pendingDrops.length?'<p>有 '+state.pendingDrops.length+' 件掉寶待領取。</p>'+btn('領取掉寶','claim'):'');
 } else if(type==='shop'){
  body.innerHTML='<p>目前持有 <b>🪙 '+format(state.gold)+'</b>。購買立即扣款並裝備；進度會存檔。</p>'+ITEMS.filter(it=>it.cost).map(it=>itemRow(it,'shop')).join('');
 } else if(type==='adventure'){
  const event=ENCOUNTERS.find(x=>x.id===state.encounterPending),today=todayTW();
  const history=state.encounterHistory||[];
  if(event){
   const eventArt='<div class="encounter-diorama encounter-tone-'+escapeHTML(event.theme||'office')+'"><span class="encounter-type">'+escapeHTML(event.rarity||'神祕奇遇')+'</span><div class="encounter-emblem" aria-hidden="true">'+event.icon+'</div><h3>'+escapeHTML(event.name)+'</h3><p>'+escapeHTML(event.text)+'</p></div>';
   const options=event.choices.map((choice,i)=>{
     const hint=choice.risk
       ?'🎲 成功率 '+Math.round(choice.risk.chance*100)+'% · '+escapeHTML(choice.note||'有風險的抉擇')
       :'🛡️ 安全選擇 · '+escapeHTML(choice.note||('金幣 '+choice.gold+' / 經驗 '+choice.xp));
     return '<button class="encounter-choice" data-action="choice" data-value="'+i+'"><strong>'+escapeHTML(choice.text)+'</strong><small>'+hint+'</small></button>';
   }).join('');
   body.innerHTML=eventArt+'<p class="encounter-instruction">選擇將真正影響冒險結果。失敗可能扣除 HP，今日僅可領獎一次。</p><div class="choices encounter-choices">'+options+'</div>';
  }else if(state.encounterDay===today){
   const latest=history.find(x=>x.day===today);
   const result=latest?.outcome==='failure'?'冒險失敗・保住了性命':latest?.outcome==='success'?'冒險成功・帶回神祕戰利品':'今日奇遇完成';
   const gains=latest?('🪙 '+(latest.gold||0)+' · EXP '+(latest.xp||0)+(latest.heal?' · ❤️ +'+latest.heal:'')+(latest.damage?' · ❤️ -'+latest.damage:'')+(latest.gems?' · 💎 +'+latest.gems:'')+(latest.potions?' · 🧪 +'+latest.potions:'')):'';
   body.innerHTML='<div class="encounter-diorama encounter-complete"><span class="encounter-type">今日冒險紀錄</span><div class="encounter-emblem" aria-hidden="true">📜</div><h3>'+result+'</h3><p>'+gains+'</p><p>今日獎勵已領取。明天會遇到新的奇遇，不會重複領獎。</p></div>';
  }else{
   body.innerHTML='<div class="encounter-diorama encounter-ready"><span class="encounter-type">每日隱藏劇情</span><div class="encounter-emblem" aria-hidden="true">🗝️</div><h3>冒險之門已開啟</h3><p>穿過結界，可能遇到外星人、妖怪、機械主管或失控的辦公室怪談。</p></div>'+btn('✦ 探索今日奇遇','encounterStart');
  }
  body.innerHTML='<div class="encounter-trustee"><button class="encounter-auto-toggle" data-action="autoEncounter" aria-pressed="'+String(state.autoEncounter)+'">🤖 智慧平衡託管 '+(state.autoEncounter?'ON':'OFF')+'</button><small>'+(state.autoEncounter?'開啟遊戲期間，每日自動探索並挑選風險適中的路線。':'手動探索不會自動消耗每日奇遇。')+'</small></div>'+body.innerHTML;
  body.innerHTML+='<h3 class="encounter-journal-title">冒險手札 · '+history.length+' 次</h3>'+
    history.slice(0,5).map(x=>{
      const info=ENCOUNTERS.find(e=>e.id===x.id);
      const marker=x.outcome==='success'?'🌟':x.outcome==='failure'?'💥':'📜';
      return '<div class="encounter-history"><span>'+marker+'</span><div><strong>'+escapeHTML(info?.name||'未知的奇遇')+'</strong><small>'+escapeHTML(x.day||'')+' · '+(x.outcome==='success'?'成功':x.outcome==='failure'?'失敗':'已完成')+(Number.isFinite(x.gold)?' · 🪙'+x.gold:'')+'</small></div></div>';
    }).join('');
 }else if(type==='collection'){
  const defeated=state.defeatedTypes||[];
  const groups=[['👾 普通怪',COMMON_ENEMIES],['✦ 菁英怪',ELITE_ENEMIES],['👑 Boss',BOSSES]];
  body.innerHTML='<p>圖鑑進度 '+defeated.length+'/'+ALL_ENEMIES.length+' 種（普通 16、菁英 8、Boss 8）。四關一循環：普通→普通→菁英→Boss。未知種族保留剪影；部分專屬美術仍在製作。</p>'
    +groups.map(([heading,monsters])=>'<h3>'+heading+'　'+monsters.filter(e=>defeated.includes(e.id)).length+'/'+monsters.length+'</h3>'
      +monsters.map(e=>{
        const known=defeated.includes(e.id);
        return '<div class="item '+(known?'':'muted')+'"><span class="symbol">'+(known?e.icon:'◼️')+'</span><div class="detail"><strong>'+(known?escapeHTML(e.name):'??? 未發現敵人')+'</strong><small>'+(known?escapeHTML(e.family+' · '+e.traitText):'擊敗後解鎖資料')+'</small></div></div>';
      }).join('')).join('')
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
 if(act==='mode')commit({type:'mode',id:b.dataset.value});
 else if(act==='skill')skillAttack(b.dataset.value);
 else if(act==='rename')openNameEditor();
 else if(act==='styles')renderPanel('styles');
 else if(act==='equipSkin')commit({type:'equipSkin',id:b.dataset.value});
 else if(act==='claimSkinEvent')commit({type:'claimSkinEvent',id:b.dataset.value});
 else if(act==='drawSkin')commit('drawSkin');
 else if(act==='favoriteStyle')commit({type:'toggleFavoriteStyle',id:b.dataset.value});
 else if(act==='choice')commit({type:'encounterChoose',choice:Number(b.dataset.value)});
 else if(act==='autoEncounter')commit({type:'autoEncounter',value:!state.autoEncounter});
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
function attackCooldownMs(){
 if(fx?.oldEnemy?.typeId==='keyboard-piranha'&&approvedMonsterArt.has('keyboard-piranha')){
   if(fx.result?.type==='victory')return CLERK_DEFEAT_END_MS;
   if(fx.retaliation)return CLERK_REPORT_IMPACT_MS+HIT_FEEDBACK_MS;
 }
 const base=chibiV2Mode&&images.chibiAttackV2?CHIBI_ATTACK_V2_TOTAL_MS:680;
 if(fx?.result?.type==='victory'&&fx.oldEnemy?.typeId==='chair-golem'&&approvedMonsterArt.has('chair-golem'))
   return GUARD_DEFEAT_END_MS+40; // Never skip the final disintegrated pose.
 if(fx?.retaliation&&((fx?.oldEnemy?.typeId==='paper-gremlin'&&approvedMonsterArt.has('paper-gremlin'))||
   (fx?.oldEnemy?.typeId==='coffee-mimic'&&approvedMonsterArt.has('coffee-mimic'))||
   (fx?.oldEnemy?.typeId==='chair-golem'&&approvedMonsterArt.has('chair-golem'))))
   return (fx.oldEnemy.typeId==='chair-golem'?GUARD_BEAM_IMPACT_MS:PAPER_PROJECTILE_IMPACT_MS)+HIT_FEEDBACK_MS+70;
 return base+(fx?.retaliation?HIT_FEEDBACK_MS:0);
}
function skillAttack(id){
 if(!ready||state.skillCooldowns[id]>0)return;
 const now=performance.now();
 if(fx&&now-fx.start<attackCooldownMs()/state.speed)return;
 commit({type:'skill',id});
}
function attack(){
 if(!ready)return;
 const now=performance.now();
 if(hurtPreviewStart&&now-hurtPreviewStart<HIT_FEEDBACK_MS)return;
 if(fx&&now-fx.start<attackCooldownMs()/state.speed)return;
 commit('attack');
}
async function initChibiV2Lab(){
 // GitHub now serves both high-quality original sprite binaries. File inputs
 // are optional art overrides for comparison only; local game saves are untouched.
 const lab=$('#chibi-v2-lab'),input=$('#chibi-v2-file'),message=$('#chibi-v2-status');
 if(!lab||!input||!message)return;
 lab.hidden=false;
 const store=CHIBI_V2_STORAGE;
 const report=text=>{message.textContent=text};
 async function install(dataUrl,persist){
   const image=await imageFrom(dataUrl);
   const cell=validateAttackAtlas(image.naturalWidth,image.naturalHeight);
   if(!cell)throw new Error('需要 7×512 的 PNG，或 7×384 的 WebP；實際尺寸為 '+image.naturalWidth+'×'+image.naturalHeight);
   // Rendering should only use atlases with an actual transparent perimeter.
   const testCanvas=document.createElement('canvas');testCanvas.width=3;testCanvas.height=3;
   const t=testCanvas.getContext('2d',{willReadFrequently:true});
   t.drawImage(image,0,0,1,1,0,0,1,1);
   if(t.getImageData(0,0,1,1).data[3]>3)throw new Error('圖片左上角不透明，可能是整張展示圖而不是透明素材。');
   images.chibiAttackV2=image;
   world.dataset.art='chibi-7pose';
   if(persist){
     try{localStorage.setItem(store,dataUrl);}
     catch(err){console.warn('這個瀏覽器無法長期保存美術測試圖；本次仍可使用',err);}
   }
   report('✓ 已啟用七姿勢動畫：'+(image.naturalWidth)+'×'+image.naturalHeight+'、每格 '+cell+' px。按「手動攻擊」即可檢查。');
 }
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];if(!file)return;
  if(file.size>5000000){report('檔案過大。請選擇高品質 384px WebP，或小於 5MB 的 512px PNG。');return;}
  report('正在解碼 '+file.name+'……');
  try{
    const dataUrl=await new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);
    });
    await install(dataUrl,true);
  }catch(error){report('❌ '+String(error.message||error));}
 });

 const hurtInput=$('#chibi-hurt-file'),hurtMsg=$('#chibi-hurt-status'),hurtDemo=$('#chibi-hurt-demo');
 async function installHurt(dataUrl,persist){
   const img=await imageFrom(dataUrl);
   const cell=validateHurtAtlas(img.naturalWidth,img.naturalHeight);
   if(!cell)throw new Error('受傷圖組尺寸不正確：請使用 2560×512 PNG 或 1920×384 WebP，實際為 '+img.naturalWidth+'×'+img.naturalHeight);
   const check=document.createElement('canvas');check.width=2;check.height=2;
   const cx=check.getContext('2d',{willReadFrequently:true});
   cx.drawImage(img,0,0,1,1,0,0,1,1);
   if(cx.getImageData(0,0,1,1).data[3]>3)throw new Error('圖片左上角不透明，無法當透明精靈。');
   images.chibiHurtV1=img;
   if(hurtDemo)hurtDemo.disabled=false;
   if(hurtMsg)hurtMsg.textContent='✓ 已載入 5 張不同受傷姿勢（每格 '+cell+'px）。下一次敵人反擊時會播放。';
   if(persist){
     try{localStorage.setItem(CHIBI_HURT_STORAGE,dataUrl)}
     catch(error){console.warn('受傷素材未能寫入本機快取，但本次仍可使用',error)}
   }
 }
 if(hurtInput)hurtInput.addEventListener('change',async()=>{
   const file=hurtInput.files?.[0];if(!file)return;
   if(file.size>5000000){hurtMsg.textContent='圖片超過 5 MB，請使用素材包中的 WebP';return;}
   try{
     const url=await new Promise((resolve,reject)=>{
       const reader=new FileReader();reader.onload=()=>resolve(reader.result);
       reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);
     });
     await installHurt(url,true);
   }catch(err){hurtMsg.textContent='❌ '+String(err.message||err)}
 });
 const previewHurt=()=>{
   hurtPreviewStart=performance.now();
   if(hurtMsg)hurtMsg.textContent=images.chibiHurtV1
     ?'💥 正在播放五姿勢受傷＋紅白閃、48ms 停頓與局部火花（不扣血）'
     :'⚠️ 受傷圖組未載入：僅播放受擊特效，人物姿勢無法切換。';
   // Visual only: never call transition()/commit() or touch HP, salary or progress.
 };
 if(hurtDemo)hurtDemo.addEventListener('click',previewHurt);
 $('#hurt-demo-quick')?.addEventListener('click',previewHurt);
 // If the website has real deployed art, never replace it with an outdated
 // cached cutout from the old manual-upload demo.
 if(!images.chibiHurtV1){
   try{
     const savedHurt=localStorage.getItem(CHIBI_HURT_STORAGE);
     if(savedHurt)await installHurt(savedHurt,false);
   }catch(err){console.warn('還原受傷候選素材失敗',err)}
 }
  $('#chibi-v2-clear')?.addEventListener('click',()=>{
   try{localStorage.removeItem(store);localStorage.removeItem(CHIBI_HURT_STORAGE)}catch{}
   // Reset LOCAL overrides only; keep the deployed HD binaries in active use.
   images.chibiAttackV2=hostedAttackSprite;
   images.chibiHurtV1=hostedHurtSprite;
   hurtPreviewStart=0;
   if(hurtInput)hurtInput.value='';
   if(hurtDemo)hurtDemo.disabled=false;
   if(hurtMsg)hurtMsg.textContent=images.chibiHurtV1?'已還原網站內建五姿勢受傷圖片。':'圖片未載入，仍可預覽紅閃與火花。';
   world.dataset.art=images.chibiAttackV2&&images.chibiHurtV1?'chibi-hd-ready':'chibi-hd-incomplete';
   input.value='';
   report('已清除本機覆寫，還原網站內建高解析度攻擊與受傷圖；遊戲進度和薪資資料不受影響。');
 });
 if(images.chibiAttackV2){
   report('✓ 已自動載入 7×512px 高畫質攻擊；不需上傳。下方檔案欄位僅供比較候選圖片。');
   return;
 }
 try{
   if(!images.chibiAttackV2){
     const cached=localStorage.getItem(store);
     if(cached){await install(cached,false);return;}
   }
 }catch(error){console.warn('讀取本機美術測試圖失敗',error)}
 report('✓ 網站已內建高解析度七姿勢攻擊。可直接點「手動攻擊」，不需要上傳檔案。');
}
function runDailyEncounterTrustee(){
 if(trainingWave!==null||!ready||!state.autoEncounter)return;
 const day=todayTW();
 if(state.encounterDay!==day)commit('encounterStart');
 const event=ENCOUNTERS.find(x=>x.id===state.encounterPending);
 if(event){
   const choice=autoEncounterChoice(event);
   if(choice>=0)commit({type:'encounterChoose',choice});
 }
}
function payRender(){
 runDailyEncounterTrustee();
 const p=salaryAt(Date.now(),40000);
 $('#today').textContent=money(p.today,2);
 $('#pay-status').textContent='台灣時間 · '+p.status;
 $('#pay-month').textContent='本週 '+money(p.week)+' · 本月 '+money(p.month);
 $('#work-time').textContent=p.on?'🟢 上班 '+p.workedHours.toFixed(2)+' h':'08:00–17:00';
 if(currentPanel==='salary'&&panel.open)renderPanel('salary');
}
function frame(now){
 if(!document.hidden&&ready){
  if(state.auto&&(!hurtPreviewStart||now-hurtPreviewStart>=HIT_FEEDBACK_MS)
    &&now-lastAttack>1450/state.speed&&(!fx||now-fx.start>=attackCooldownMs()/state.speed)){
      if(state.pendingDrops.length){commit('claim');lastAttack=now;}
      else if(state.chests>0){commit('chest');lastAttack=now;}
      else if(state.heroHp<state.maxHp*.32&&state.potions>0){commit('heal');lastAttack=now;}
      else {
      const pick=state.heroHp<state.maxHp*.6&&state.skillCooldowns.drain===0?'drain':
       state.heroHp<state.maxHp*.35&&state.skillCooldowns.guard===0?'guard':
       state.skillCooldowns.burst===0?'burst':null;
      if(pick)skillAttack(pick);else attack();
      }
    }
  drawStage(now);
  renderCombatBars(now);
  if(trainingSpecies==='keyboard-piranha'){
    const readout=$('#training-animation-readout');
    if(readout){
      const ms=fx?.wave?Math.max(0,(now-fx.start)*state.speed):Infinity;
      const report=clerkReportAt(ms,fx?.retaliationDamage>0);
      const inScene=Number.isFinite(ms)&&ms<CLERK_DEFEAT_END_MS;
      const cue=!inScene?'待機巡邏':fx.result?.type==='victory'?'人形怨靈逐格消散':
        report.projectile?'詛咒報表飛向左邊':report.impact>0?'報表命中勇者':
        report.charge>0?'報表詠唱':ms<405?'勇者揮擊':ms<850?'紅色受擊':'收招';
      const pose=world.dataset.clerkPose||'idle',frame=1+Number(world.dataset.clerkFrame||0);
      const red=Math.round(100*Number(JSON.parse(world.dataset.clerkFlash||'{}').red||0));
      const message='👻 第六隻｜'+cue+'｜'+pose+' #'+frame+(red?'｜受擊紅閃 '+red+'%':'')+'｜16 格正式美術';
      if(readout.textContent!==message)readout.textContent=message;
    }
  }
  if(trainingSpecies==='deadline-clock'){
    const readout=$('#training-animation-readout');
    if(readout){
      const ms=fx?.wave?Math.max(0,(now-fx.start)*state.speed):Infinity;
      const clock=cloudClockAt(ms,fx?.retaliationDamage>0);
      const active=Number.isFinite(ms)&&ms<CLOUD_DEFEAT_END_MS;
      const cue=!active?'巡邏待機':fx.result?.type==='victory'?'逐格消散':
        clock.projectile?'魔法時鐘飛向左邊':clock.impact>0?'時鐘命中勇者':
        clock.charge>0?'時鐘蓄能':ms<405?'勇者出招':ms<840?'受傷閃紅':'準備下次攻擊';
      const pose=world.dataset.cloudPose||'idle',frame=1+Number(world.dataset.cloudFrame||0);
      const flash=Math.round(100*Number(JSON.parse(world.dataset.cloudFlash||'{}').red||0));
      const msg='☁️ '+cue+'｜'+pose+' #'+frame+(flash?'｜全身紅閃 '+flash+'%':'')+'｜16 格正式美術';
      if(readout.textContent!==msg)readout.textContent=msg;
    }
  }
  if(trainingSpecies==='meeting-ghost'){
    const readout=$('#training-animation-readout');
    if(readout){
      const ms=fx?.wave?Math.max(0,(now-fx.start)*state.speed):Infinity;
      const inFlight=Number.isFinite(ms)&&ms<ALIEN_DEFEAT_END_MS;
      const activeStamp=alienStampAt(ms,fx?.retaliationDamage>0);
      const cue=!inFlight?'待機':fx.result?.type==='victory'?'擊倒':
        activeStamp.projectile?'印章飛行中':activeStamp.impact>0?'印章命中勇者':
        activeStamp.charge>0?'蓄力詠唱':ms<405?'勇者出手':ms<845?'外星人受擊':'動作收招';
      const pose=world.dataset.alienPose||'idle';
      const spriteIndex=1+Number(world.dataset.alienFrame||0);
      const flash=Math.round(100*Number(JSON.parse(world.dataset.alienFlash||'{}').red||0));
      const label='🛸 朝左｜'+cue+'｜'+pose+' #'+spriteIndex+(flash?'｜全身紅閃 '+flash+'%':'')+
        (approvedMonsterArt.has('meeting-ghost')?'｜16 格正式圖集已載入':'｜正式圖集載入中');
      if(readout.textContent!==label)readout.textContent=label;
    }
  }
  if(trainingSpecies==='chair-golem'){
    const readout=$('#training-animation-readout');
    if(readout){
      const elapsed=fx?.wave?Math.max(0,(now-fx.start)*state.speed):Infinity;
      const active=Number.isFinite(elapsed)&&elapsed<GUARD_DEFEAT_END_MS;
      const cue=guardCombatCaptionAt(elapsed,active?fx?.result:null);
      const pose=active?(world.dataset.guardPose||'idle'):'idle';
      const index=active?Number(world.dataset.guardFrame||0)+1:1;
      const flash=active?JSON.parse(world.dataset.guardFlash||'{}'):null;
      const strength=Math.round(100*Math.max(0,Number(flash?.red)||0));
      const status='🚨 '+cue+'｜動作 '+pose+' #'+index+(strength>0?'｜全身紅閃 '+strength+'%':'');
      if(readout.textContent!==status)readout.textContent=status;
    }
  }
 }
 requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)lastAttack=performance.now()});
window.addEventListener('pagehide',save);
render();payRender();setInterval(payRender,1000);requestAnimationFrame(frame);
if(!state.playerName)openNameEditor();
Promise.all(Object.entries(assetPaths).map(async ([k,url])=>{
 try{images[k]=await imageFrom(url);}
 catch(error){
   if(k==='bg'){images[k]=await imageFrom('../art/enchanted-office.svg');console.warn('Using fallback office background:',error);}
   else if(k==='foreground'||k==='weaponBriefcase'||k==='minion'||k==='boss'||k==='chibiIdle'||k==='chibiAttackV2'||k==='chibiHurtV1'){
     images[k]=null;console.warn('Optional art preview layer skipped:',k,error);
   }else throw error;
 }
})).then(()=>{
 ready=true;lastAttack=performance.now();
 // Do not mislabel a missing/invalid image as fully functional.
 const attackCell=images.chibiAttackV2?validateAttackAtlas(images.chibiAttackV2.naturalWidth,images.chibiAttackV2.naturalHeight):0;
 const hurtCell=images.chibiHurtV1?validateHurtAtlas(images.chibiHurtV1.naturalWidth,images.chibiHurtV1.naturalHeight):0;
 if(images.chibiAttackV2&&!attackCell)images.chibiAttackV2=null;
 if(images.chibiHurtV1&&!hurtCell)images.chibiHurtV1=null;
 world.dataset.art=chibiV2Mode?(images.chibiIdle&&attackCell&&hurtCell?'chibi-hd-ready':'chibi-hd-incomplete'):'legacy';
 const artNotice=$('#chibi-art-state');
 if(artNotice){
   artNotice.hidden=!chibiV2Mode;
   const ok=world.dataset.art==='chibi-hd-ready';
   artNotice.dataset.quality=ok?'ready':'missing';
   artNotice.textContent=ok
     ?'✓ 高畫質主角已載入：攻擊 7×512px、受傷 5×384px（受傷時自動播放）'
     :'⚠️ 高清角色素材載入不完整：攻擊 '+(attackCell?'✓':'✕')+'、受傷 '+(hurtCell?'✓':'✕')+'。為避免糊化，停用低解析度攻擊素材。請重整畫面或檢查部署。';
 }
 if(chibiV2Mode){
   hostedAttackSprite=images.chibiAttackV2;
   hostedHurtSprite=images.chibiHurtV1;
   initChibiV2Lab();
 }
 render();
 loadApprovedMonsterArt().then(()=>Promise.all([loadTrainingCandidateArt(),loadAlienCandidateArt(),loadCloudGhostCandidateArt()])).catch(err=>{
   console.warn('正式或候選怪物逐格素材載入失敗，保留工程替身：',err);
   const notice=$('#monster-art-status');
   if(notice)notice.textContent='⚠️ 怪物圖片未成功載入：'+String(err.message||err)+'。目前只顯示工程替身。';
 });
}).catch(err=>{
 failure=String(err.message||err);$('#game-log').textContent='❌ 動態遊戲素材載入失敗：'+failure+'。請確認網頁是透過 HTTP(S) 開啟。';
 console.error(err);render();
});