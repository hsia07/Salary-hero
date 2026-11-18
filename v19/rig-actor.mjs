/** 分層骨架角色（正式分層素材驅動，非整張圖平移）。
 * rig.json：parts（各部件位置）、pivots（關節樞紐）、order（後→前）。
 * 層級：root（位移、整體傾斜，以腳底為軸）> legs（膝蓋擺動） + torso 群組（呼吸、前傾）> head / 右臂筆 / 公文包。
 * 動作：idle、walk、attack（實際衝到目標、筆尖接觸、命中停頓、收招）、hurt（姿態反應＋紅閃）、block（公文包移到受擊方向）、dispel、victory、defeat。
 */
const EASE={lin:u=>u,out:u=>1-(1-u)**3,in:u=>u**3,io:u=>u<.5?4*u**3:1-(-2*u+2)**3/2,back:u=>1+2.7*(u-1)**3+1.7*(u-1)**2};
const REST=Object.freeze({x:0,y:0,lean:0,sq:1,torso:0,head:0,arm:0,armX:0,armY:0,case:0,caseX:0,caseY:0,legL:0,legR:0,legLy:0,legRy:0,red:0,alpha:1});
/** 出筆角度：持筆手原圖筆尖朝右上約 35°，順時針轉回水平前刺 */
export const THRUST_ARM=34;
const TORSO=new Set(['arm_r_pen','case_sleeve','body','case_front','head']);

export async function loadRig(base){
 const r=await fetch(base+'rig.json',{cache:'no-cache'});
 if(!r.ok)throw new Error('rig.json '+r.status);
 return r.json();
}

export function createRigActor(mount,rig,base,{height=180,facing=1}={}){
 const scale=height/rig.height;
 const root=document.createElement('div');
 root.className='rig-actor';
 root.style.cssText=`position:absolute;left:0;top:0;width:${rig.width}px;height:${rig.height}px;transform-origin:${rig.pivots.body[0]}px ${rig.pivots.body[1]}px;will-change:transform;pointer-events:none`;
 const torso=document.createElement('div');
 torso.style.cssText=`position:absolute;inset:0;transform-origin:${rig.pivots.body[0]}px ${rig.pivots.leg_l?.[1]??rig.height*.8}px`;
 const el={};
 for(const name of rig.order){
  const p=rig.parts[name];
  const img=new Image();img.src=base+name+'.webp';img.alt='';img.decoding='async';img.draggable=false;
  const pv=rig.pivots[name]||[p.x+p.w/2,p.y+p.h/2];
  img.style.cssText=`position:absolute;left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;transform-origin:${pv[0]-p.x}px ${pv[1]-p.y}px;user-select:none`;
  el[name]=img;(TORSO.has(name)?torso:root).appendChild(img);
 }
 // 腿在軀幹後面：先放腿，再放軀幹群組（軀幹群組內部維持 order 的前後關係）
 root.appendChild(torso);
 for(const leg of ['leg_l','leg_r'])if(el[leg])root.insertBefore(el[leg],torso);
 if(el.arm_r_pen)torso.insertBefore(el.arm_r_pen,torso.firstChild);
 mount.appendChild(root);

 const P={...REST};let queued=null,busy=false,face=facing,base0={x:0,y:0},t0=performance.now(),hitstop=0,raf=0,walking=false;
 function frame(now){apply(now);raf=requestAnimationFrame(frame);}
 function apply(now){
  const t=(now-t0)/1000,idle=busy?.3:1,br=Math.sin(t*2.2),sw=Math.sin(t*1.25+.6);
  const walk=walking?Math.sin(t*9):0,wb=walking?Math.abs(Math.cos(t*9)):0;
  root.style.transform=`translate(${base0.x+P.x*face}px,${base0.y+P.y-wb*3}px) scale(${scale*face},${scale}) rotate(${P.lean}deg) scaleY(${P.sq+br*.008*idle})`;
  root.style.opacity=P.alpha;
  torso.style.transform=`rotate(${P.torso+br*.6*idle}deg)`;
  el.head&&(el.head.style.transform=`rotate(${P.head+sw*1.8*idle}deg)`);
  el.arm_r_pen&&(el.arm_r_pen.style.transform=`translate(${P.armX}px,${P.armY}px) rotate(${P.arm+br*2*idle}deg)`);
  el.case_front&&(el.case_front.style.transform=`translate(${P.caseX}px,${P.caseY}px) rotate(${P.case+sw*2.2*idle}deg)`);
  el.leg_l&&(el.leg_l.style.transform=`translateY(${P.legLy-(walk>0?walk*6:0)}px) rotate(${P.legL+walk*9}deg)`);
  el.leg_r&&(el.leg_r.style.transform=`translateY(${P.legRy-(walk<0?-walk*6:0)}px) rotate(${P.legR-walk*9}deg)`);
  root.style.filter=P.red>0?`drop-shadow(0 0 0 transparent) sepia(${P.red}) saturate(${1+P.red*5}) hue-rotate(${-50*P.red}deg) brightness(${1+P.red*.25})`:'';
 }
 apply(performance.now());
 raf=requestAnimationFrame(frame);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function to(target,ms,ease='out'){return new Promise(res=>{const from={...P},s=performance.now();(function step(n){
  if(hitstop>n){requestAnimationFrame(step);return;}
  const u=Math.min(1,(n-s)/ms),e=EASE[ease](u);for(const k in target)P[k]=from[k]+(target[k]-from[k])*e;u<1?requestAnimationFrame(step):res();})(s);});}
 /** 筆尖在 mount 座標中的位置（用於確認攻擊實際接觸目標） */
 function penTip(){
  const r=el.arm_r_pen?.getBoundingClientRect(),m=mount.getBoundingClientRect();
  if(!r)return null;return face>0?{x:r.right-m.left,y:r.top-m.top+r.height*.08}:{x:r.left-m.left,y:r.top-m.top+r.height*.08};
 }
 const actions={
  async walk(ms=900){walking=true;await wait(ms);walking=false;},
  /** reach：需要前進的距離（mount 像素），讓筆尖抵達目標身體 */
  async attack({reach=80,onHit}={}){
   await to({lean:-6,torso:-8,arm:-22,armX:-12,armY:-4,legL:8,legR:-6,x:-6,sq:.97},150,'out');   // 預備：舉筆收肘
   walking=true;await to({x:reach,lean:8,torso:10,legL:22,legR:-26},170,'in');walking=false;      // 突進
   await to({arm:THRUST_ARM,armX:30,armY:10,torso:12,head:-3},80,'out');                                // 出筆：筆尖水平前刺
   hitstop=performance.now()+70;onHit?.(penTip());await wait(110);                                       // 命中停頓
   await to({x:(reach-12),arm:-8,armX:8,torso:4,lean:2},120,'out');                               // 收招
   walking=true;await to({x:0,y:0,lean:-3,legL:-10,legR:12},240,'io');walking=false;                   // 退回
   await to(REST,180,'out');
  },
  async hurt(){
   await to({x:-14,lean:-12,torso:-10,head:14,arm:22,case:-14,legL:-10,legR:10,red:1,sq:.95},110,'out');
   await wait(120);await to({red:0,x:-6,lean:-4,torso:-3,head:5,sq:1},200,'io');await to(REST,220,'io');
  },
  async block({onBlock}={}){
   await to({case:-58,caseX:46,caseY:-58,lean:5,torso:6,legL:10,legR:-10,arm:16,sq:.97},200,'back');       // 公文包盾移到受擊方向
   onBlock?.();hitstop=performance.now()+60;await to({x:-10,case:-52},90,'out');
   await wait(140);await to(REST,240,'io');
  },
  async dispel({onSeal}={}){
   await to({arm:-70,armX:10,armY:-18,head:-8,torso:-6,lean:-3},260,'out');                              // 舉筆
   await wait(100);onSeal?.(penTip());
   await to({arm:24,armX:18,torso:10,lean:6},150,'in');await wait(260);await to(REST,260,'io');            // 落筆一劃
  },
  async victory(){await to({arm:-60,armY:-14,head:-6,torso:-4,y:-10},300,'back');await wait(700);await to(REST,300,'io');},
  async defeat(){await to({lean:-70,y:20,torso:-14,head:20,alpha:.85},500,'in');},
  async revive(){await to(REST,300,'out');}
 };
 return {
  el:root,penTip,
  /** 以腳底為準放置：(x,y) 為 mount 內的腳底座標 */
  setPosition(x,y){base0={x:x-rig.pivots.body[0],y:y-rig.pivots.body[1]};apply(performance.now());},
  setFacing(f){face=f<0?-1:1;},
  get busy(){return busy;},
  /** 忙碌時不丟棄：保留最新一個請求，目前動作結束後立即播放（超過 1.5 秒的舊請求作廢） */
  async play(name,opts){
   if(!actions[name])return false;
   if(busy){queued={name,opts,at:performance.now()};return false;}
   busy=true;
   try{await actions[name](opts);}finally{if(name!=='defeat')Object.assign(P,REST);busy=false;}
   const next=queued;queued=null;
   if(next&&performance.now()-next.at<1500)return this.play(next.name,next.opts);
   return true;
  },
  /** 除錯：直接定格到指定姿勢（逐格截圖驗收用） */
  pose(values){const was=busy;Object.assign(P,REST,values);busy=true;apply(t0);busy=was;},
  /** 目前縮放（mount 像素 / 原始 rig 像素） */
  get scale(){return scale;},
  destroy(){cancelAnimationFrame(raf);root.remove();}
 };
}
