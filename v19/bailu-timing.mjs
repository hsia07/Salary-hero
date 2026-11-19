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
