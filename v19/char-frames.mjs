/** 角色逐格動畫播放器（通用）。每個角色一份設定：圖集、格寬、各動作時序、命中格、突進方式。
 * 原則（使用者 2026-11-19）：每格都是重畫的完整姿勢；非等速；每個角色有自己的動作與節奏，不共用。
 * 動作優先序：ult > hurt > attack > walk > idle（高優先可打斷低優先；同級不打斷）。
 */
import {BAILU_ATTACK_MS,BAILU_IMPACT_MS,BAILU_CUTIN_MS,BAILU_ULT_MS,BAILU_ULT_IMPACT_MS,BAILU_IDLE_MS,BAILU_WALK_MS,bailuLungeAt,BAILU_LUNGE_PX} from './bailu-timing.mjs';
import {CHIBI_HURT_MS} from './hurt-timing.mjs';
import {hurtEffectAt,HIT_FEEDBACK_MS} from './hurt-effects.mjs';

const sum=a=>a.reduce((x,y)=>x+y,0);
export const CHAR_ANIMS=Object.freeze({
 lawyer:{
  base:'../art/characters/office-lawyer/animations/',
  drawSize:306,anchor:{x:25,y:298},           // 與預覽頁、薪奴相同的繪製尺寸與腳底偏移
  actions:{
   idle:  {file:'idle-4pose-384.png',cell:384,ms:BAILU_IDLE_MS,loop:true},
   walk:  {file:'walk-6pose-384.png',cell:384,ms:BAILU_WALK_MS,loop:true},
   attack:{file:'attack-7pose-512.png',cell:512,ms:BAILU_ATTACK_MS,impactMs:BAILU_IMPACT_MS,lunge:t=>bailuLungeAt(t)/BAILU_LUNGE_PX},
   hurt:  {file:'hurt-5pose-384.png',cell:384,ms:CHIBI_HURT_MS,hurtFx:true},
   ult:   {file:'ult-8pose-512.png',cell:512,ms:BAILU_ULT_MS,leadMs:BAILU_CUTIN_MS,impactMs:BAILU_ULT_IMPACT_MS},
  },
  cutin:'ult-cutin-800.webp',
 },
});
const PRIORITY={idle:0,walk:1,attack:2,hurt:3,ult:4};

export async function loadCharAnim(id){
 const cfg=CHAR_ANIMS[id];if(!cfg)throw new Error('沒有動畫設定：'+id);
 const load=s=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error('載入失敗 '+s));i.src=s;});
 const entries=await Promise.all(Object.entries(cfg.actions).map(async([k,a])=>[k,await load(cfg.base+a.file)]));
 return {cfg,img:Object.fromEntries(entries),cutin:cfg.cutin?await load(cfg.base+cfg.cutin):null};
}
function frameAt(ms,list,loop){
 let t=Math.max(0,ms);const total=sum(list);
 if(loop)t%=total;else if(t>=total)return -1;
 for(let i=0;i<list.length;i++){if(t<list[i])return i;t-=list[i];}
 return list.length-1;
}
/** 建立一個角色演員：play(action,{lungePx,onImpact}) 依優先序播放；draw(ctx,now,x,feetY) 畫出當前格 */
export function createFrameActor(anim){
 const {cfg,img}=anim;
 let cur='idle',start=performance.now(),opts={},fired=false,flashAt=-1e9;
 const off=document.createElement('canvas'),octx=off.getContext('2d');
 const actor={
  get action(){return cur;},
  get busy(){return cur!=='idle'&&cur!=='walk';},
  /** 出招中被打：不打斷動作，只做短暫紅閃（白→紅，與受擊同色） */
  flash(){flashAt=performance.now();},
  duration(a){const s=cfg.actions[a];return s?(s.leadMs||0)+sum(s.ms):0;},
  play(a,o={}){
   if(!cfg.actions[a])return false;
   if(a!=='idle'&&PRIORITY[a]<PRIORITY[cur]&&actor.busy)return false;
   if(a===cur&&actor.busy&&a!=='hurt')return false;
   cur=a;start=performance.now();opts=o;fired=false;return true;
  },
  /** 回傳此格的突進位移（px），供呼叫端同步其他物件 */
  draw(ctx,now,x,feetY){
   let a=cfg.actions[cur],t=now-start;
   if(cur==='hurt'&&t>=HIT_FEEDBACK_MS){cur='idle';a=cfg.actions.idle;t=now;}
   let f=0;
   if(cur!=='hurt'){
    const lead=a.leadMs||0;
    f=t<lead?0:frameAt(t-lead,a.ms,a.loop);
    if(f<0){cur='idle';a=cfg.actions.idle;f=frameAt(now,a.ms,true);t=now;}
   }
   if(a.impactMs&&!fired&&t>=a.impactMs){fired=true;opts.onImpact?.();}
   const lunge=a.lunge?a.lunge(t)*(opts.lungePx||0):0;
   const s=cfg.drawSize,dx=x-cfg.anchor.x+lunge,dy=feetY-cfg.anchor.y;
   if(cur==='hurt'){
    const e=hurtEffectAt(t);const hf=Math.max(0,e.frame);
    off.width=s;off.height=s;octx.clearRect(0,0,s,s);octx.drawImage(img.hurt,hf*a.cell,0,a.cell,a.cell,0,0,s,s);
    if(e.flashAlpha>0){octx.globalCompositeOperation='source-atop';octx.globalAlpha=e.flashAlpha;octx.fillStyle=e.flashColor;octx.fillRect(0,0,s,s);octx.globalAlpha=1;octx.globalCompositeOperation='source-over';}
    ctx.drawImage(off,dx+e.shakeX,dy+e.shakeY);
   }else{
    const ft=now-flashAt;
    if(ft<160){
     off.width=s;off.height=s;octx.clearRect(0,0,s,s);octx.drawImage(img[cur],f*a.cell,0,a.cell,a.cell,0,0,s,s);
     octx.globalCompositeOperation='source-atop';octx.globalAlpha=ft<30?.7:.6*(1-ft/160);octx.fillStyle=ft<30?'#fff2ee':'#ff4348';octx.fillRect(0,0,s,s);octx.globalAlpha=1;octx.globalCompositeOperation='source-over';
     ctx.drawImage(off,dx,dy);
    }else ctx.drawImage(img[cur],f*a.cell,0,a.cell,a.cell,dx,dy,s,s);
   }
   return {lunge,t,frame:f,action:cur};
  },
 };
 return actor;
}
