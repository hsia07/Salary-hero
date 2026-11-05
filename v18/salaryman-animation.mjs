/**
 * V18 character animation sequencing. Each frame is a separate transparent image.
 * Deliberately independent of combat logic and the concept screenshot.
 */
export const SALARYMAN_ANIMATIONS=Object.freeze({
 idle:{frames:['idle-01','idle-02','idle-03','idle-04'],ms:340,loop:true},
 walk:{frames:['walk-01','walk-02'],ms:180,loop:true},
 attack:{frames:['attack-01','attack-02'],ms:150,loop:false},
 hurt:{frames:['hurt-01','hurt-02'],ms:220,loop:false},
 sleep:{frames:['sleep-01'],ms:500,loop:true}
});
export function animationFrame(action,elapsedMs,definitions=SALARYMAN_ANIMATIONS){
 const animation=definitions[action];
 if(!animation)throw Error('Unknown animation: '+action);
 const index=Math.max(0,Math.floor(Math.max(0,elapsedMs)/animation.ms));
 const position=animation.loop?index%animation.frames.length:Math.min(index,animation.frames.length-1);
 return animation.frames[position];
}
export function validateAnimationImages(images,definitions=SALARYMAN_ANIMATIONS){
 const missing=[];
 for(const action of Object.values(definitions))
  for(const frame of action.frames)
   if(!images.has(frame))missing.push(frame);
 return {ready:missing.length===0,missing};
}
