/* Two named, player-controlled loadout presets for quick coffee/burst swapping.
 * Snapshots never include inventory/XP/money; loading cannot spawn items.
 */
import {liteNormalizeLoadout} from './lite-equipment.mjs';
import {liteBuildById,liteBuildBranch,liteMasteryRank} from './lite-builds.mjs';
import {liteSkillPaths,LITE_SKILL_UNLOCK_USES} from './lite-skills.mjs';
export const LITE_PRESET_COUNT=2;
const names=['速刷配置','高塔配置'];
export function liteNormalizePreset(raw,inventory){
 if(!raw||typeof raw!=='object'||!liteBuildById(raw.build))return null;
 return {name:typeof raw.name==='string'?raw.name.slice(0,16):'配裝',
   build:raw.build,
   loadout:liteNormalizeLoadout(raw.loadout,inventory),
   branches:liteBuildBranch(raw.branches),
   skillPaths:liteSkillPaths(raw.skillPaths)};
}
export function liteNormalizePresets(raw,inventory){
 return Array.from({length:LITE_PRESET_COUNT},(_,i)=>liteNormalizePreset(Array.isArray(raw)?raw[i]:null,inventory));
}
export function liteSavePresetSnapshot(state,index){
 if(!Number.isInteger(index)||index<0||index>=LITE_PRESET_COUNT)return null;
 if(!liteBuildById(state.liteActiveBuild))return null;
 return {name:names[index],build:state.liteActiveBuild,
  loadout:liteNormalizeLoadout(state.liteLoadout,state.liteInventory),
  branches:liteBuildBranch(state.liteBuildBranch),
  skillPaths:liteSkillPaths(state.liteSkillPaths)};
}
export function liteApplyPreset(state,index){
 if(!Number.isInteger(index)||index<0||index>=LITE_PRESET_COUNT)return null;
 const raw=state?.litePresets?.[index];
 const preset=liteNormalizePreset(raw,state.liteInventory||[]);
 if(!preset)return null;
 state.liteActiveBuild=preset.build;
 state.liteLoadout=preset.loadout;
 // Presets cannot unlock progression that has not been earned.
 const branches=liteBuildBranch(state.liteBuildBranch);
 if(liteMasteryRank(state.liteBuildProgress[preset.build]||0)>=1)branches[preset.build]=preset.branches[preset.build];
 state.liteBuildBranch=branches;
 for(const [id,value] of Object.entries(preset.skillPaths)){
   if((state.liteSkillUses[id]||0)>=LITE_SKILL_UNLOCK_USES)state.liteSkillPaths[id]=value;
 }
 state.liteCombo=0;state.liteToxinStacks=0;
 return preset;
}
