/* Seven DISTINCT illustrated poses. Each pose is a hard cut, never a blurry cross-fade. */
export const CHIBI_ATTACK_V2_MS=Object.freeze([115,135,95,60,145,100,155]);
export const CHIBI_ATTACK_V2_TOTAL_MS=CHIBI_ATTACK_V2_MS.reduce((n,t)=>n+t,0);
export const CHIBI_ATTACK_V2_KEYS=Object.freeze(['ready','brace','windup','step','impact','followthrough','recover']);
export function attackFrameAt(elapsedMs){
 const elapsed=Math.max(0,Number(elapsedMs)||0);
 let time=elapsed;
 for(let i=0;i<CHIBI_ATTACK_V2_MS.length;i++){
   if(time<CHIBI_ATTACK_V2_MS[i])return i;
   time-=CHIBI_ATTACK_V2_MS[i];
 }
 return -1; // finished: draw idle, not the attack atlas
}
export function attackPhaseAt(elapsedMs){
 const elapsed=Math.max(0,Number(elapsedMs)||0);
 const frame=attackFrameAt(elapsed);
 return {frame,finished:frame<0,impact:frame===4,slash:frame===3||frame===4,
   hitProgress:Math.max(0,Math.min(1,(elapsed-405)/145))};
}
export function validateAttackAtlas(width,height){
 // Allow either the 7×512 transparent lossless master or the high-quality 384px WebP.
 if(width===3584&&height===512)return 512;
 if(width===2688&&height===384)return 384;
 return 0;
}
