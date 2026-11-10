/** Salary Hero V19: low-cost NORMAL monster reskin pipeline.
 * 32 fixed original species remain immutable. Preview is allowed only for
 * already-approved ordinary enemies; boss / elite / unfinished candidate art
 * cannot borrow a generic animated body.
 *
 * Color treatment is a lightweight PREVIEW of the skin architecture, not a
 * replacement for the finished cosmetic layers (clothes, faces, accessories).
 */
import {COMMON_ENEMIES,ELITE_ENEMIES,BOSSES} from './roster.mjs';
import {drawMonsterAtlasFrame} from './sprite-atlas.mjs';

const PREVIEW_VARIANTS=[
 {id:'midnight-ink',baseTypeId:'paper-gremlin',name:'夜班紫墨紙妖',
  hue:212,saturation:1.35,brightness:1.05,accent:'#af8aff',
  description:'紫黑夜班制服與神祕紫墨（正式裝備部件尚未繪製）'},
 {id:'fire-report',baseTypeId:'paper-gremlin',name:'熔岩加班紙妖',
  hue:332,saturation:1.48,brightness:1.08,accent:'#ff9562',
  description:'灼熱紅墨與火焰公文（正式火焰部件尚未繪製）'},
 {id:'moon-coffee',baseTypeId:'coffee-mimic',name:'月光濃縮杯靈',
  hue:175,saturation:1.33,brightness:1.05,accent:'#9bbdff',
  description:'夜藍咖啡杯與月光能量（正式杯身部件尚未繪製）'},
 {id:'venom-coffee',baseTypeId:'coffee-mimic',name:'毒霧夜班杯靈',
  hue:82,saturation:1.43,brightness:.99,accent:'#9be5aa',
  description:'綠色藥劑杯靈（正式毒霧部件尚未繪製）'}
 ,
 {id:'hazard-mech',baseTypeId:'chair-golem',name:'警報赤紅保全機兵',hue:110,saturation:1.4,brightness:1.05,accent:'#ff7a8c',description:'換色機兵試玩版'},
 {id:'void-intern',baseTypeId:'meeting-ghost',name:'虛空外星實習生',hue:120,saturation:1.25,brightness:.94,accent:'#d28aff',description:'異星幽光換色版'},
 {id:'frost-cloud',baseTypeId:'deadline-clock',name:'霜藍雲端專員靈',hue:170,saturation:1.3,brightness:1.06,accent:'#9adfff',description:'冰霜資料換色版'},
 {id:'cursed-clerk',baseTypeId:'keyboard-piranha',name:'詛咒赤影遊魂文員',hue:300,saturation:1.3,brightness:.98,accent:'#ff8fa8',description:'幽冥換色試玩版'}
];
export const NORMAL_VARIANT_PREVIEWS=Object.freeze(
 PREVIEW_VARIANTS.map(record=>Object.freeze({...record,previewOnly:true,approved:false})));

const NORMAL_IDS=new Set(COMMON_ENEMIES.map(e=>e.id));
const NON_NORMAL_IDS=new Set([...ELITE_ENEMIES,...BOSSES].map(e=>e.id));
export const ORIGINAL_MONSTER_COUNT=NORMAL_IDS.size+NON_NORMAL_IDS.size;

/** Never infer "approved" from a URL. Callers must pass the actual loaded,
 * validated official atlas IDs. Unapproved candidates always return null. */
export function normalVariantFor(baseTypeId,variantId,approvedMonsterIds=[]){
 if(!NORMAL_IDS.has(baseTypeId)||NON_NORMAL_IDS.has(baseTypeId))return null;
 if(!approvedMonsterIds||typeof approvedMonsterIds.includes!=='function'||
    !approvedMonsterIds.includes(baseTypeId))return null;
 return NORMAL_VARIANT_PREVIEWS.find(item=>
   item.baseTypeId===baseTypeId&&item.id===variantId)||null;
}
export function validateNormalVariants(variants=NORMAL_VARIANT_PREVIEWS){
 const errors=[],ids=new Set();
 for(const record of variants){
  if(!record||!/^[-a-z0-9]+$/.test(String(record.id||'')))
   errors.push('invalid variant ID');
  if(ids.has(record.id))errors.push('duplicate variant '+record.id);
  ids.add(record.id);
  if(!NORMAL_IDS.has(record.baseTypeId)||NON_NORMAL_IDS.has(record.baseTypeId))
   errors.push('not a common monster: '+record.baseTypeId);
  if(!record.name||record.name.length<4)errors.push('variant needs a visible name');
  if(!Number.isFinite(record.hue)||record.hue<0||record.hue>360||
      !Number.isFinite(record.saturation)||record.saturation<.5||record.saturation>2||
      !Number.isFinite(record.brightness)||record.brightness<.6||record.brightness>1.4)
   errors.push('unsafe palette: '+record.id);
  if(record.previewOnly!==true||record.approved!==false)
   errors.push('variant improperly marked official: '+record.id);
 }
 return errors;
}
/** Draw the SAME independently-illustrated action frame under a scoped palette
 * adjustment. Skin filters NEVER move, stretch, blur, jitter, or replace poses.
 * Finishing layers (uniform, weapon, face, attachments) can be composited after
 * this call with one aligned atlas per cosmetic slot.
 *
 * On older Canvas2D implementations lacking ctx.filter, fall back to original
 * approved art. The source image and the caller's canvas style are untouched.
 */
export function drawNormalVariantFrame(ctx,image,frame,x,y,w,h,elapsed,loop=false,variant=null){
 if(!variant)return drawMonsterAtlasFrame(ctx,image,frame,x,y,w,h,elapsed,loop);
 if(!NORMAL_IDS.has(variant.baseTypeId)||variant.previewOnly!==true)
  return drawMonsterAtlasFrame(ctx,image,frame,x,y,w,h,elapsed,loop);
 ctx.save();
 try{
  if('filter' in ctx)
   ctx.filter='hue-rotate('+variant.hue+'deg) saturate('+variant.saturation+
    ') brightness('+variant.brightness+')';
  return drawMonsterAtlasFrame(ctx,image,frame,x,y,w,h,elapsed,loop);
 }finally{ctx.restore();}
}
