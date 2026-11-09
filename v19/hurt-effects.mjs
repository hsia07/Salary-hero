/** V19: deterministic damage-only feedback for the five independent Q版 injury poses.
 * This module knows no DOM or player state. It never animates during victory/healing.
 */
import {CHIBI_HURT_TOTAL_MS,hurtFrameAt} from './hurt-timing.mjs';

export const HIT_STOP_MS=48;
export const HIT_FEEDBACK_MS=HIT_STOP_MS+CHIBI_HURT_TOTAL_MS;
export const HIT_SPARK_COUNT=8;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));

/** Time in *gameplay* milliseconds since retaliation actually struck. */
export function hurtEffectAt(elapsedMs,{reducedMotion=false}={}){
 const elapsed=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):Infinity;
 if(elapsed>=HIT_FEEDBACK_MS){
  return {active:false,frame:-1,hitStop:false,flashAlpha:0,flashColor:'#ff514b',
   shakeX:0,shakeY:0,sparkAlpha:0,sparkProgress:1};
 }
 const poseMs=Math.max(0,elapsed-HIT_STOP_MS);
 const frame=hurtFrameAt(poseMs);
 // Fast white-pink highlight, then scarlet, then a very short red afterglow.
 let flashAlpha=0,flashColor='#ff4543';
 if(elapsed<20){
   flashColor='#fff2ee';flashAlpha=.78;
 }else if(elapsed<76){
   flashColor='#ff4348';flashAlpha=.80-(elapsed-20)/56*.30;
 }else if(elapsed<156){
   flashColor='#cf2d47';flashAlpha=.38*(1-(elapsed-76)/80);
 }
 if(reducedMotion)flashAlpha=Math.min(flashAlpha,.35);
 // Freeze animation pose for 48ms, THEN one quick shake, not a constant blur.
 const shakeAge=elapsed-HIT_STOP_MS;
 const envelope=(shakeAge>=0&&shakeAge<112&&!reducedMotion)?(1-shakeAge/112):0;
 const shakeX=envelope*12*Math.sin(shakeAge*.30);
 const shakeY=envelope*4.8*Math.sin(shakeAge*.48+.6);
 // Standalone, localized red-orange burst, never tint the whole screen.
 const sparkAge=Math.max(0,elapsed-20);
 const sparkAlpha=elapsed<175?clamp(1-sparkAge/155,0,1):0;
 return {active:true,frame,hitStop:elapsed<HIT_STOP_MS,flashAlpha,flashColor,
   shakeX,shakeY,sparkAlpha:reducedMotion?sparkAlpha*.60:sparkAlpha,
   sparkProgress:clamp(elapsed/175,0,1)};
}

/** Called ONLY if HP actually decreased or by the separate stat-free preview button. */
export function hurtPlaybackAt(now,attackStart,gameSpeed,attackDuration,wasRetaliated,
 previewStart=0,options={}){
 const manual=previewStart>0?now-previewStart:Infinity;
 if(manual>=0&&manual<HIT_FEEDBACK_MS)return {...hurtEffectAt(manual,options),source:'manual'};
 const speed=gameSpeed===2?2:1;
 const hitElapsed=(now-attackStart)*speed-attackDuration;
 if(wasRetaliated&&Number.isFinite(hitElapsed)&&hitElapsed>=0&&hitElapsed<HIT_FEEDBACK_MS)
   return {...hurtEffectAt(hitElapsed,options),source:'retaliation'};
 return {...hurtEffectAt(Infinity,options),source:'none'};
}
