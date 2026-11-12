/** Pure battle rules: keep interception deterministic and independently testable. */
export function tieshiIntercept({damage, target, guardian=0, guardianAlive=true, awakened=false, guardLinkActive=false, guardLinkTarget=-1, guardLinkRatio=0}={}){
 const amount=Math.max(0,Number.isFinite(damage)?damage:0);
 if(target===guardian||!guardianAlive||amount===0)return {targetDamage:amount,guardianDamage:0,kind:'none'};
 if(awakened){const redirected=Math.round(amount*30)/100;return {targetDamage:Math.max(0,amount-redirected),guardianDamage:redirected,kind:'awakened'};}
 if(guardLinkActive&&target===guardLinkTarget){const ratio=Math.max(0,Math.min(1,guardLinkRatio));const redirected=Math.round(amount*ratio*100)/100;return {targetDamage:Math.max(0,amount-redirected),guardianDamage:redirected,kind:'guard-link'};}
 return {targetDamage:amount,guardianDamage:0,kind:'none'};
}
export function tieshiSkill({biographyCleared=false}={}){
 return biographyCleared?Object.freeze({id:'last-door',name:'09:00・最後一道門',shieldRatio:.08,shieldDurationMs:6000,interceptRatio:.30}):Object.freeze({id:'night-watch',name:'08:59・終夜守衛',shieldRatio:.05,shieldDurationMs:4000,interceptRatio:0});
}
