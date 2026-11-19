/** 分層骨架角色（正式分層素材驅動，非整張圖平移）。
 * rig.json：parts（各部件位置）、pivots（關節樞紐）、order（後→前）。
 * 層級：root（位移、整體傾斜，以腳底為軸）> legs（膝蓋擺動） + torso 群組（呼吸、前傾）> head / 右臂筆 / 公文包。
 * 動作：idle、walk、attack（實際衝到目標、筆尖接觸、命中停頓、收招）、hurt（姿態反應＋紅閃）、block（公文包移到受擊方向）、dispel、victory、defeat。
 */
const EASE={lin:u=>u,out:u=>1-(1-u)**3,in:u=>u**3,io:u=>u<.5?4*u**3:1-(-2*u+2)**3/2,back:u=>1+2.7*(u-1)**3+1.7*(u-1)**2};
const REST=Object.freeze({x:0,y:0,lean:0,sq:1,torso:0,head:0,arm:0,armX:0,armY:0,case:0,caseX:0,caseY:0,legL:0,legR:0,legLy:0,legRy:0,red:0,alpha:1});
/** 出筆角度：持筆手原圖筆尖朝右上約 35°，順時針轉回水平前刺 */
export const THRUST_ARM=34;
let thrust=THRUST_ARM;
const TORSO=new Set(['arm_r_pen','case_sleeve','body','case_front','head']);

export async function loadRig(base){
 const r=await fetch(base+'rig.json',{cache:'no-cache'});
 if(!r.ok)throw new Error('rig.json '+r.status);
 return r.json();
}

export function createRigActor(mount,rig,base,{height=180,facing=1}={}){
 const scale=height/rig.height;thrust=rig.thrustArm??THRUST_ARM;
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
 if(el.arm_r_pen&&!rig.armFront)torso.insertBefore(el.arm_r_pen,torso.firstChild);
 mount.appendChild(root);

 const P={...REST};let queued=null,busy=false,face=facing,base0={x:0,y:0},t0=performance.now(),hitstop=0,raf=0,walking=false;
 function frame(now){apply(now);raf=requestAnimationFrame(frame);}
 function apply(now){
  const t=(now-t0)/1000,idle=busy?.3:1,br=Math.sin(t*2.2),sw=Math.sin(t*1.25+.6);
  const walk=walking?Math.sin(t*9):0,wb=walking?Math.abs(Math.cos(t*9)):0;
  root.style.transform=`translate(${base0.x+P.x*face}px,${base0.y+P.y-wb*6}px) scale(${scale*face},${scale}) rotate(${P.lean}deg) scaleY(${P.sq+br*.008*idle})`;
  root.style.opacity=P.alpha;
  torso.style.transform=`rotate(${P.torso+br*.6*idle}deg)`;
  el.head&&(el.head.style.transform=`rotate(${P.head+sw*1.8*idle}deg)`);
  el.arm_r_pen&&(el.arm_r_pen.style.transform=`translate(${P.armX}px,${P.armY}px) rotate(${P.arm+br*2*idle}deg)`);
  el.case_front&&(el.case_front.style.transform=`translate(${P.caseX}px,${P.caseY}px) rotate(${P.case+sw*2.2*idle}deg)`);
  el.leg_l&&(el.leg_l.style.transform=`translateY(${P.legLy-(walk>0?walk*6:0)}px) rotate(${P.legL+walk*9}deg)`);
  el.leg_r&&(el.leg_r.style.transform=`translateY(${P.legRy-(walk<0?-walk*6:0)}px) rotate(${P.legR-walk*9}deg)`);
  root.style.filter=P.red>0?`sepia(${P.red*.55}) saturate(${1+P.red*2.2}) hue-rotate(${-38*P.red}deg) brightness(${1+P.red*.18})`:'';
 }
 apply(performance.now());
 raf=requestAnimationFrame(frame);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 /** 突進殘影：複製目前外觀，淡出 */
 function ghost(n){for(let i=0;i<n;i++)setTimeout(()=>{const g=root.cloneNode(true);g.style.opacity='.35';g.style.filter='brightness(1.6) saturate(.4)';g.style.transition='opacity .22s linear';mount.insertBefore(g,root);requestAnimationFrame(()=>g.style.opacity='0');setTimeout(()=>g.remove(),240);},i*35);}
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
  // 手遊 Q 版切片動畫原則：身體保持直立（整體傾斜 ≤6°），用位移、壓縮伸展、小角度擺臂表現力道；
  // 手臂旋轉 ≤30° 以免露出未繪製的關節；被公文包擋住的身體區域不大幅揭露。
  async attack({reach=80,onHit}={}){
   await to({x:-10,y:2,sq:.93,torso:-4,head:3,arm:-28,armX:-16,armY:-4,legL:6,legR:-6},150,'out');           // 蓄力：下蹲、收肘
   await wait(50);
   ghost(3);walking=true;await to({x:reach*.9,y:-4,sq:1.04,torso:3,lean:4,arm:-8,legL:18,legR:-20},110,'in');walking=false; // 突進（殘影）
   await to({x:reach,y:0,sq:.98,arm:thrust,armX:30,armY:6,torso:5,lean:5,head:-2},50,'lin');                   // 直刺
   hitstop=performance.now()+110;onHit?.(penTip());await wait(140);                                           // 命中停頓
   await to({x:reach-14,sq:1,arm:thrust-6,armX:14,torso:2,lean:2},130,'out');                                  // 收招
   walking=true;await to({x:0,y:-6,lean:-2,legL:-8,legR:10},200,'io');walking=false;await to({y:0,sq:.96},70,'in');
   await to(REST,150,'out');
  },
  async hurt(){
   await to({x:-16,y:-2,sq:.92,lean:-5,torso:-5,head:8,arm:14,case:-8,red:1},90,'out');                      // 被擊退：後仰小幅＋壓縮
   await to({red:.55},90,'lin');await to({red:0,x:-8,sq:1,lean:-2,head:3},180,'io');await to(REST,200,'io');
  },
  async block({onBlock}={}){
   await to({x:-6,sq:.95,case:-16,caseX:22,caseY:-26,torso:3,arm:10,legL:8,legR:-8},150,'back');              // 公文包往前頂（不大幅舉起）
   onBlock?.();hitstop=performance.now()+70;await to({x:-16,case:-12,sq:.97},90,'out');
   await wait(120);await to(REST,220,'io');
  },
  async dispel({onSeal}={}){
   await to({y:-4,sq:1.03,arm:-30,armX:6,armY:-10,head:-4,torso:-3},240,'out');                              // 舉筆
   await wait(90);onSeal?.(penTip());
   await to({y:0,sq:.97,arm:12,armX:16,torso:4,lean:3},120,'in');await wait(240);await to(REST,240,'io');     // 落筆一劃
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
