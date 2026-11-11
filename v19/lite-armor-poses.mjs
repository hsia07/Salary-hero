/* Manually registered attachment poses for the approved 7-attack / 5-hurt chibi sprite atlases.
 * Coordinates are inside the existing 240x306 mirrored hero drawing local space.
 * These are conservative torso masks: sleeves, hands, neck and face stay original art.
 * The movement comes from actual atlas frames, never from wobbling an idle sprite.
 */
const pose=(x,y,width,height,rotation=0,shoulder=1)=>Object.freeze({x,y,width,height,rotation,shoulder});
export const LITE_ARMOR_POSES=Object.freeze({
 idle:pose(129,226,96,78,-.02),
 attack:Object.freeze([
  pose(132,225,94,78,0),
  pose(135,220,94,77,-.08),
  pose(141,211,94,77,-.13),
  pose(147,212,88,76,-.18),
  pose(150,211,87,76,-.23),
  pose(146,221,92,76,-.09),
  pose(133,226,96,78,0)
 ]),
 hurt:Object.freeze([
  pose(128,215,92,77,0),
  pose(125,220,92,77,-.10),
  pose(139,204,89,75,-.17),
  pose(140,234,85,73,-.17),
  pose(114,227,87,73,.14)
 ])
});
export function liteArmorPose(kind,index=0){
 if(kind==='idle')return LITE_ARMOR_POSES.idle;
 const frames=LITE_ARMOR_POSES[kind];
 if(!Array.isArray(frames))return LITE_ARMOR_POSES.idle;
 const n=Number.isInteger(index)?Math.max(0,Math.min(frames.length-1,index)):0;
 return frames[n];
}
export function liteArmorAsset(item,base){
 if(!item||!base||base.slot!=='armor')return null;
 const set=base.setId;
 if(set==='clockout')return 'armorClockout';
 if(set==='coffee')return 'armorCoffee';
 if(set==='guardian')return 'armorGuardian';
 // Unrepresented armor models retain the original actor sprite rather than invent
 // a fake tint or implying nonexistent hand-drawn equipment.
 return null;
}
