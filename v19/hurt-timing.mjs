/** Q-version independently illustrated recoil phases, not affine art transitions. */
export const CHIBI_HURT_MS=Object.freeze([75,110,100,135,130]);
export const CHIBI_HURT_TOTAL_MS=CHIBI_HURT_MS.reduce((a,b)=>a+b,0);
export const CHIBI_HURT_PHASES=Object.freeze(['reaction','impact','recoil','crouch','recover']);
export function hurtFrameAt(ms){
  let t=Math.max(0,Number(ms)||0);
  for(let i=0;i<CHIBI_HURT_MS.length;i++){if(t<CHIBI_HURT_MS[i])return i;t-=CHIBI_HURT_MS[i];}
  return -1;
}
export function validateHurtAtlas(w,h){
  if(w===2560&&h===512)return 512;
  if(w===1920&&h===384)return 384;
  return 0;
}
export function shouldRecoil(previousHp,latestHp,result){
 if(!result||result.type!=='hit')return false;
 // The combat engine may restore full HP immediately after a fatal hit.
 // Its recorded retaliationDamage remains the authoritative injury marker.
 if(Number(result.retaliationDamage)>0)return true;
 return Number.isFinite(previousHp) && Number.isFinite(latestHp) && latestHp<previousHp;
}
