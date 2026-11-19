/** 白律專屬普攻「審判筆突刺」時序（與薪奴 attack-timing 相同的逐格硬切方式，數值為白律自己的節奏）。
 * 白律的蓄力較長、出手更快（筆比公文包輕），突進距離較短（筆的攻擊距離較長）。 */
export const BAILU_ATTACK_MS=Object.freeze([130,150,125,45,165,110,150]);
export const BAILU_ATTACK_KEYS=Object.freeze(['ready','brace','windup','step','impact','followthrough','recover']);
export const BAILU_ATTACK_TOTAL_MS=BAILU_ATTACK_MS.reduce((a,b)=>a+b,0);
export const BAILU_IMPACT_FRAME=4;
export const BAILU_LUNGE_PX=52;
export function bailuFrameAt(ms){let t=Math.max(0,Number(ms)||0);for(let i=0;i<BAILU_ATTACK_MS.length;i++){if(t<BAILU_ATTACK_MS[i])return i;t-=BAILU_ATTACK_MS[i];}return -1;}
const startOf=i=>BAILU_ATTACK_MS.slice(0,i).reduce((a,b)=>a+b,0);
export const BAILU_IMPACT_MS=startOf(BAILU_IMPACT_FRAME);
/** 突進：蓄力時微退、跨步時快速前衝、命中停住、收招後退回。 */
export function bailuLungeAt(ms){
 const s3=startOf(3),s4=startOf(4),s6=startOf(6);
 if(ms<startOf(1))return 0;
 if(ms<s3)return -8*Math.min(1,(ms-startOf(1))/(s3-startOf(1)));
 if(ms<s4)return -8+(BAILU_LUNGE_PX+8)*((ms-s3)/(s4-s3));
 if(ms<s6)return BAILU_LUNGE_PX;
 return BAILU_LUNGE_PX*Math.max(0,1-(ms-s6)/BAILU_ATTACK_MS[6]);
}
/** 大招「終審判決」：先放 0.7 秒半身特寫（cut-in），再播 8 格；第 6 格（定讞）為命中。 */
// UR 大招：特寫 0.9 秒＋8 格 2.09 秒（蓄勢格放慢做慢動作，定讞格極短做爆發）
export const BAILU_CUTIN_MS=900;
export const BAILU_ULT_MS=Object.freeze([170,240,240,380,420,120,300,220]);
export const BAILU_ULT_TOTAL_MS=BAILU_CUTIN_MS+BAILU_ULT_MS.reduce((a,b)=>a+b,0);
export const BAILU_ULT_IMPACT_FRAME=5;
export const BAILU_ULT_IMPACT_MS=BAILU_CUTIN_MS+BAILU_ULT_MS.slice(0,5).reduce((a,b)=>a+b,0);
export function bailuUltFrameAt(ms){let t=(Number(ms)||0)-BAILU_CUTIN_MS;if(t<0)return -2;for(let i=0;i<BAILU_ULT_MS.length;i++){if(t<BAILU_ULT_MS[i])return i;t-=BAILU_ULT_MS[i];}return -1;}
/** 待機「冷靜等候」4 格循環（非等速：吸氣慢、眨眼快）；移動「快步赴庭」6 格循環 */
export const BAILU_IDLE_MS=Object.freeze([360,300,140,320]);
export const BAILU_WALK_MS=Object.freeze([105,95,110,105,95,110]);
export function loopFrameAt(ms,list){const total=list.reduce((a,b)=>a+b,0);let t=((Number(ms)||0)%total+total)%total;for(let i=0;i<list.length;i++){if(t<list[i])return i;t-=list[i];}return 0;}
