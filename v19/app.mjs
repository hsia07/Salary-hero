/* Salary Hero V19 — scene renderer and interaction. Never draw home-master concept screenshot. */
import {ITEMS,ENCOUNTERS,STORAGE_KEY,initial,normalize,enemyFor,todayTW,transition,salaryAt,playerTitle,cleanPlayerName} from './engine.mjs';
import {HERO_STYLES,ALL_ENEMIES,COMMON_ENEMIES,ELITE_ENEMIES,BOSSES} from './roster.mjs';
import {SKINS,skinById} from './skins.mjs';
import {renderSkinPanel} from './skin-ui.mjs';
import {CHIBI_ATTACK_V2_TOTAL_MS,attackFrameAt,attackPhaseAt,validateAttackAtlas} from './attack-timing.mjs';
import {CHIBI_HURT_TOTAL_MS,hurtFrameAt,validateHurtAtlas,shouldRecoil} from './hurt-timing.mjs';
import {HIT_FEEDBACK_MS,HIT_SPARK_COUNT,hurtPlaybackAt} from './hurt-effects.mjs';
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
function paintEnemy(enemy,now){
 const w=enemy.boss?214:enemy.tier==='elite'?194:177,h=enemy.boss?258:enemy.tier==='elite'?248:240;
 const accent=enemy.accent||'#dfa6e6';
 const sprite=enemy.sprite==='printer'?images.boss:enemy.sprite==='paper'?images.minion:null;
 ctx.save();
 // Strong contrasting rim light prevents pale paper monsters vanishing against
 // the bright moon/window of the nighttime office scene.
 ctx.shadowColor='#130b24';
 ctx.shadowBlur=25;
 ctx.shadowOffsetY=8;
 if(sprite?.complete&&sprite.naturalWidth>0){
   ctx.drawImage(sprite,0,0,w,h);
 }else{
   // No reliance on emoji font availability (notably iOS Safari canvas).
   // A rounded, hand-drawn Q monster remains visible on every platform.
   ctx.fillStyle='#49324f';ctx.strokeStyle=accent;ctx.lineWidth=6;
   ctx.beginPath();
   ctx.moveTo(w*.16,h*.76);
   ctx.bezierCurveTo(-w*.01,h*.55,w*.11,h*.22,w*.33,h*.22);
   ctx.quadraticCurveTo(w*.49,-h*.025,w*.62,h*.21);
   ctx.bezierCurveTo(w*.91,h*.15,w*1.07,h*.57,w*.85,h*.78);
   ctx.quadraticCurveTo(w*.75,h*.96,w*.50,h*.90);
   ctx.quadraticCurveTo(w*.28,h*.98,w*.16,h*.76);
   ctx.closePath();ctx.fill();ctx.stroke();
   // Dark horns, little paws, eyes and expression read even on small screens.
   ctx.shadowBlur=0;ctx.shadowOffsetY=0;
   ctx.strokeStyle=accent;ctx.lineWidth=10;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(w*.21,h*.65);ctx.lineTo(w*.05,h*.77);
   ctx.moveTo(w*.79,h*.65);ctx.lineTo(w*.95,h*.77);ctx.stroke();
   ctx.fillStyle='#fff5dc';ctx.beginPath();
   ctx.ellipse(w*.36,h*.50,13,17,-.14,0,Math.PI*2);
   ctx.ellipse(w*.66,h*.50,13,17,.14,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#21132a';ctx.beginPath();
   ctx.arc(w*.39,h*.52,6,0,Math.PI*2);
   ctx.arc(w*.69,h*.52,6,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#f4b2be';ctx.lineWidth=5;ctx.beginPath();
   ctx.arc(w*.52,h*.66,18,.05,Math.PI-.05);ctx.stroke();
   // Elite monsters also get distinct silhouettes, not just a differently colored body.
   const shape=enemy.shape;
   if(shape==='knight'){
     ctx.fillStyle='#b7a3a9';ctx.strokeStyle=accent;ctx.lineWidth=5;
     ctx.beginPath();ctx.moveTo(w*.26,h*.31);ctx.lineTo(w*.33,h*.16);
     ctx.lineTo(w*.68,h*.16);ctx.lineTo(w*.78,h*.31);ctx.closePath();ctx.fill();ctx.stroke();
     ctx.fillStyle='#3b2c4f';ctx.fillRect(w*.30,h*.37,w*.44,h*.085);
   }else if(shape==='beast'){
     ctx.fillStyle='#41304a';ctx.strokeStyle=accent;ctx.lineWidth=5;
     for(const side of [-1,1]){
       ctx.beginPath();const x=w*(.5+side*.33);
       ctx.moveTo(x,h*.34);ctx.lineTo(x+side*w*.08,h*.04);
       ctx.lineTo(x-side*w*.11,h*.19);ctx.closePath();ctx.fill();ctx.stroke();
     }
   }else if(shape==='ghost'){
     ctx.strokeStyle=accent;ctx.lineWidth=6;ctx.beginPath();
     ctx.moveTo(w*.24,h*.30);ctx.quadraticCurveTo(w*.12,h*.07,w*.27,h*.05);
     ctx.moveTo(w*.76,h*.30);ctx.quadraticCurveTo(w*.88,h*.07,w*.73,h*.05);ctx.stroke();
     ctx.fillStyle='#e4b4f9';ctx.beginPath();
     ctx.moveTo(w*.50,h*.12);ctx.lineTo(w*.58,h*.23);ctx.lineTo(w*.50,h*.34);
     ctx.lineTo(w*.42,h*.23);ctx.closePath();ctx.fill();
   }else if(shape==='insect'){
     ctx.strokeStyle=accent;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();
     ctx.moveTo(w*.31,h*.28);ctx.lineTo(w*.13,h*.09);ctx.lineTo(w*.03,h*.19);
     ctx.moveTo(w*.69,h*.28);ctx.lineTo(w*.87,h*.09);ctx.lineTo(w*.97,h*.19);ctx.stroke();
     ctx.lineWidth=4;for(let i=0;i<3;i++){
       ctx.beginPath();ctx.moveTo(w*.22,h*(.60+i*.09));
       ctx.lineTo(w*.78,h*(.60+i*.09));ctx.stroke();
     }
   }
   // The roster's emoji is a badge on the monster, not its only body.
   ctx.font=(enemy.boss?43:37)+'px "Apple Color Emoji","Segoe UI Emoji",system-ui';
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(enemy.icon||'✦',w*.52,h*.32);
 }
 ctx.restore();
 if(enemy.tier==='elite'||enemy.tier==='boss'){
   ctx.save();ctx.strokeStyle=enemy.tier==='elite'?'#ffe3a0':accent;
   ctx.lineWidth=enemy.tier==='elite'?5:7;
   ctx.globalAlpha=.58+Math.sin(now/260)*.14;
   ctx.shadowColor=accent;ctx.shadowBlur=17;
   ctx.beginPath();ctx.ellipse(w*.50,h*.53,w*.56,h*.47,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle=accent;ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.font=enemy.tier==='boss'?'bold 38px system-ui':'bold 28px system-ui';
   ctx.fillText(enemy.tier==='boss'?'♛':'✦',w*.5,enemy.tier==='boss'?-13:5);
   ctx.restore();
 }
 if(enemy.trait==='guard'){
   ctx.save();ctx.globalAlpha=.33+.12*Math.sin(now/420);ctx.strokeStyle=accent;
   ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(w/2,h/2,w*.50,h*.49,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 if(enemy.trait==='leech'){
   ctx.save();ctx.globalAlpha=.30+.20*Math.sin(now/400);glow(w/2,h*.46,85,accent+'55');ctx.restore();
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
 const phase=fx?Math.min((now-fx.start)/1000,2):3;
 const animationMs=fx?Math.max(0,(now-fx.start)*state.speed):Infinity;
 const chibiV2Ready=chibiV2Mode&&Boolean(images.chibiIdle&&images.chibiAttackV2);
 const attackDurationMs=chibiV2Ready?CHIBI_ATTACK_V2_TOTAL_MS:680;
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
 const victory=fx?.result?.type==='victory'&&phase<.95;
 const hitWindow=chibiV2Ready?animationMs>=405&&animationMs<=580:phase>.25&&phase<.6;
 const enemyX=458+Math.sin(time*1.75)*4+(attacking&&hitWindow?Math.sin(now/22)*7:0);
 const enemyY=248+Math.sin(time*2)*5;
 // Crossfade the defeated monster with the next wave WITHOUT a single empty
 // frame: the sum of both alphas always stays >= 1 in the transition.
 const fadingOld=victory?Math.max(0,Math.min(1,(.78-phase)/.59)):0;
 const enteringNew=victory?Math.max(0,Math.min(1,(phase-.19)/.59)):1;
 const drawEnemy=(enemy,alpha)=>{
   if(!enemy||alpha<=0)return;
   ctx.save();
   ctx.globalAlpha=alpha;
   const pivotX=enemy.boss?107:enemy.tier==='elite'?97:88.5;
   const pivotY=enemy.boss?129:enemy.tier==='elite'?124:120;
   ctx.translate(enemyX+pivotX,enemyY+pivotY);
   ctx.rotate(Math.sin(time*1.1)*.03+(attacking&&hitWindow?.12:0));
   ctx.translate(-pivotX,-pivotY);
   paintEnemy(enemy,now);
   ctx.restore();
 };
 shadow(enemyX+90,525,state.enemy.boss?100:84,17);
 if(victory)drawEnemy(fx.oldEnemy,fadingOld);
 drawEnemy(state.enemy,enteringNew);
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
function render(){
 $('#gold').textContent=format(state.gold);$('#gems').textContent=format(state.gems);
 const ticketCounter=$('#skin-tickets');if(ticketCounter)ticketCounter.textContent=format(state.skinTickets);
 const enemyTier=state.enemy.tier||'normal';
 $('#wave').textContent='第 '+state.wave+' 關 · '+(enemyTier==='boss'?'👑 Boss 戰':enemyTier==='elite'?'✦ 菁英挑戰':'普通戰鬥');
 $('#wave').classList.toggle('boss',enemyTier==='boss');
 $('#wave').classList.toggle('elite',enemyTier==='elite');
 world.dataset.enemyTier=enemyTier;
 document.querySelector('.enemy-meter')?.classList.toggle('elite',enemyTier==='elite');
 document.querySelector('.enemy-meter')?.classList.toggle('boss',enemyTier==='boss');
 $('#level').textContent='Lv.'+state.level+' '+playerTitle(state);
 $('#hero-hp-text').textContent=Math.ceil(state.heroHp)+'/'+Math.ceil(state.maxHp);
 $('#hero-hp-fill').style.width=(state.heroHp/state.maxHp*100)+'%';
 $('#enemy-hp-fill').style.width=(state.enemy.hp/state.enemy.maxHp*100)+'%';
 $('#enemy-name').textContent=(enemyTier==='boss'?'👑 ':enemyTier==='elite'?'✦ ':'')+state.enemy.name;
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
 $('#attack').disabled=!ready;$('#claim').disabled=!ready||state.pendingDrops.length===0;$('#chest').disabled=!ready||state.chests===0;
 $('#claim').textContent='🎁 掉寶 ('+state.pendingDrops.length+')';
 $('#chest').textContent='📦 寶箱 ('+state.chests+')';
 if(currentPanel&&panel.open)renderPanel(currentPanel);
}
function commit(action){
 const type=typeof action==='string'?action:action?.type;
 if(!ready&&!['setName','toggleFavoriteStyle','equipSkin','drawSkin','claimSkinEvent'].includes(type))return;
 const oldEnemy={...state.enemy},wasWave=state.wave,oldHeroHp=state.heroHp;
 state=transition(state,action);
 if(action==='attack'){
   fx={start:performance.now(),result:state.last,oldEnemy,wave:wasWave,
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
 const headers={hero:'角色狀態',styles:'造型衣櫃・活動與抽獎',equipment:'裝備背包',adventure:'每日奇遇',collection:'怪物圖鑑',shop:'商店',salary:'薪資中心'};
 $('#panel-title').textContent=headers[type]||'薪水勇者';
 if(type==='hero'){
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
function attackCooldownMs(){
 const base=chibiV2Mode&&images.chibiAttackV2?CHIBI_ATTACK_V2_TOTAL_MS:680;
 return base+(fx?.retaliation?HIT_FEEDBACK_MS:0);
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
  if(state.auto&&(!hurtPreviewStart||now-hurtPreviewStart>=HIT_FEEDBACK_MS)
    &&now-lastAttack>1450/state.speed&&(!fx||now-fx.start>=attackCooldownMs()/state.speed))attack();
  drawStage(now);
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
}).catch(err=>{
 failure=String(err.message||err);$('#game-log').textContent='❌ 動態遊戲素材載入失敗：'+failure+'。請確認網頁是透過 HTTP(S) 開啟。';
 console.error(err);render();
});