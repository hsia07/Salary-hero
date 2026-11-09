/* Salary Hero — production-only enemy sprite sheets.
 * Canvas vector actors are NOT animation assets. Only manually reviewed,
 * independent PNG/WebP frame artwork may enter this pipeline. */
export const REQUIRED_MONSTER_STATES=Object.freeze(['idle','attack','hurt','defeat']);
export const MIN_MONSTER_FRAMES=Object.freeze({idle:4,attack:5,hurt:3,defeat:4,special:5});
export const SPRITE_SPEC_VERSION=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function validateMonsterAtlasRecord(record,tier='normal'){
 const errors=[];
 if(!record||typeof record!=='object')return ['missing sprite record'];
 if(record.approved!==true)errors.push('human approval missing');
 if(!/^[a-z0-9-]+$/.test(String(record.id||'')))errors.push('invalid enemy ID');
 const states=record.states||{};
 const needed=[...REQUIRED_MONSTER_STATES,...(tier==='normal'?[]:['special'])];
 for(const state of needed){
   const r=states[state];
   if(!r||typeof r!=='object'){errors.push('missing pose '+state);continue;}
   if(!/^(?:\.\/|\.\.\/|\/)?[a-z0-9_./-]+\.(png|webp)$/i.test(String(r.src||''))||
      !String(r.src).includes('/runtime/monsters/'))errors.push('invalid artwork path for '+state);
   if(!Number.isInteger(r.frames)||r.frames<MIN_MONSTER_FRAMES[state]||r.frames>24)
     errors.push('not enough actual drawn poses for '+state);
   if(!Number.isInteger(r.cell)||r.cell<256||r.cell>1024)errors.push('cell resolution too small for '+state);
   if(!Array.isArray(r.durations)||r.durations.length!==r.frames||r.durations.some(x=>!Number.isFinite(x)||x<35||x>1200))
     errors.push('invalid per-frame timings '+state);
 }
 return errors;
}
export function spriteFrameIndex(durations,elapsed,loop=false){
 if(!durations?.length)return 0;
 const total=durations.reduce((s,v)=>s+v,0);
 if(!(total>0))return 0;
 let time=loop?Math.max(0,elapsed)%total:clamp(elapsed,0,total-.001);
 for(let i=0;i<durations.length;i++){if(time<durations[i])return i;time-=durations[i];}
 return durations.length-1;
}
export function validateSpritePixels(image,frame){
 if(!image||!frame||image.naturalWidth!==frame.cell*frame.frames||image.naturalHeight!==frame.cell)
   return {ok:false,reason:'wrong decoded dimensions'};
 // Real image dimensions are mandatory; a filename or metadata-only declaration
 // is never evidence of actual sprites.
 return {ok:true,reason:'dimensions decoded'};
}
/** Actual image pixel audit: reject blank/opaque-background/identical frame strips.
 *  Compare content after normalizing the transparent silhouette's bounding box;
 *  this catches simple translation of one still image pretending to be animation.
 *  Smaller idle expression changes are allowed, combat poses need larger changes. */
export function inspectAtlasFrameArt(image,frame,state,createCanvas=()=>{
 if(typeof document==='undefined')throw new Error('Canvas factory required');
 return document.createElement('canvas');
}){
 const errors=[],decoded=validateSpritePixels(image,frame);
 if(!decoded.ok)return [decoded.reason];
 const canvas=createCanvas();canvas.width=96;canvas.height=96;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 if(!c)return ['2D canvas unavailable'];
 let previous=null;
 const threshold=state==='idle'?.008:state==='hurt'?.024:.040;
 for(let i=0;i<frame.frames;i++){
   c.clearRect(0,0,96,96);
   c.drawImage(image,i*frame.cell,0,frame.cell,frame.cell,0,0,96,96);
   const d=c.getImageData(0,0,96,96).data;
   if([0,95,95*96,96*96-1].some(k=>d[k*4+3]>12))errors.push(state+' frame '+i+' has opaque/cropped corner');
   let x0=96,y0=96,x1=-1,y1=-1,occupied=0;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++){
     if(d[(y*96+x)*4+3]>48){occupied++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
   }
   if(occupied<300){errors.push(state+' frame '+i+' is blank/tiny');continue;}
   if(x0<3||y0<3||x1>92||y1>92)errors.push(state+' frame '+i+' cropped at edge');
   // 48x48 sample of normalized actual colored artwork, not geometric transforms.
   const signature=new Uint8Array(48*48*4);
   for(let y=0;y<48;y++)for(let x=0;x<48;x++){
     const sx=Math.min(95,Math.floor(x0+(x+.5)*(x1-x0+1)/48));
     const sy=Math.min(95,Math.floor(y0+(y+.5)*(y1-y0+1)/48));
     const p=(sy*96+sx)*4,q=(y*48+x)*4;
     for(let k=0;k<4;k++)signature[q+k]=d[p+k];
   }
   if(previous){
     let diff=0;
     for(let j=0;j<signature.length;j++)diff+=Math.abs(signature[j]-previous[j]);
     diff/=signature.length*255;
     if(diff<threshold)errors.push(state+' frame '+i+' is duplicated or rigidly translated ('+diff.toFixed(3)+')');
   }
   previous=signature;
 }
 return errors;
}
export function drawMonsterAtlasFrame(ctx,image,frame,x,y,w,h,elapsed,loop=false){
 const valid=validateSpritePixels(image,frame);
 if(!valid.ok)return false;
 const index=spriteFrameIndex(frame.durations,elapsed,loop);
 ctx.drawImage(image,index*frame.cell,0,frame.cell,frame.cell,x,y,w,h);
 return true;
}
export function selectMonsterAtlasAction(result,elapsed,speed=1){
 const t=Math.max(0,elapsed*speed);
 if(!result||!['hit','victory'].includes(result.type))return {state:'idle',elapsed:t,loop:true};
 // The hero lands the blow at 405ms, after distinct windup and contact frames.
 if(t>=405&&t<805)return {state:result.type==='victory'?'defeat':'hurt',elapsed:t-405,loop:false};
 if(result.type==='hit'&&t>=805&&t<1370&&result.retaliationDamage>0){
   return {state:result.enemySkill?'special':'attack',elapsed:t-805,loop:false};
 }
 return {state:'idle',elapsed:t,loop:true};
}
export function validateMonsterAtlasManifest(manifest,monsterTiers={}){
 if(manifest?.version!==SPRITE_SPEC_VERSION)return ['unsupported manifest version'];
 const records=manifest.monsters||{};
 const errors=[];
 for(const [id,record] of Object.entries(records)){
   if(record.id!==id)errors.push('mismatched monster ID '+id);
   for(const err of validateMonsterAtlasRecord(record,monsterTiers[id]||'normal'))errors.push(id+': '+err);
 }
 return errors;
}
