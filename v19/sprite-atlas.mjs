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
