/** World 01 formation battle adapter for the existing 32-monster roster.
 * Stable monster IDs and S1 squad definitions; does not mutate live saves.
 */
import {COMMON_ENEMIES,ELITE_ENEMIES,BOSSES} from './roster.mjs';
import {squadStats,normalizeSquadDraft} from './v21-squad-core.mjs';
import {createFormationBattle,tickFormationBattle} from './formation-combat-runtime.mjs';
export const WORLD01_MONSTERS=Object.freeze([...COMMON_ENEMIES,...ELITE_ENEMIES,...BOSSES]);
const byId=new Map(WORLD01_MONSTERS.map(m=>[m.id,m]));
const roleOf=m=>m.trait==='guard'?'tank':m.trait==='leech'?'melee':m.trait==='rage'?'assassin':'melee';
export function world01Enemy(id,{level=1,lane=1,row='front',index=0}={}){
 const m=byId.get(id);
 if(!m)return null;
 const tier=BOSSES.includes(m)?'boss':ELITE_ENEMIES.includes(m)?'elite':'normal';
 const multiplier=tier==='boss'?4:tier==='elite'?2:1;
 const lvl=Math.max(1,Math.min(100,Math.floor(Number(level)||1)));
 const hp=Math.round((95+lvl*14)*multiplier);
 return {id:id+'#'+index,monsterId:m.id,name:m.name,tier,role:roleOf(m),row,lane,
  hp,maxHp:hp,attack:Math.round((10+lvl*2)*Math.sqrt(multiplier)),
  attackInterval:m.trait==='rage'?1.4:1.8,threat:m.trait==='guard'?5:1,
  armor:m.trait==='guard'?Math.round(35*multiplier):0,
  lifeSteal:m.trait==='leech'?.25:0};
}
export function world01AllySquad(draft,{slaveLevel=1,hero=null}={}){
 const slots=squadStats(normalizeSquadDraft(draft),slaveLevel);
 const allies=slots.flatMap((m,i)=>{
  if(!m)return [];
  return [{id:m.id,name:m.name,role:m.role==='caster'?'caster':m.role,
   row:i<3?'front':'rear',lane:i%3,
   hp:m.maxHp,maxHp:m.maxHp,attack:m.attack,attackInterval:Math.max(.7,2.1-m.speed*.025),
   healPower:m.role==='healer'?Math.round(m.attack*1.5):0,
   shieldPower:m.role==='support'?Math.round(m.attack*1.4):0,shieldReady:m.role==='support'}];
 });
 if(hero){
  const maxHp=Math.max(1,Number(hero.maxHp)||100);
  allies.push({id:'salary-hero',name:'薪奴',role:hero.role||'melee',row:'hero',lane:1,
   hp:Math.max(0,Math.min(maxHp,Number(hero.hp??maxHp))),maxHp,attack:Math.max(1,Number(hero.attack)||20),attackInterval:Math.max(.5,Number(hero.attackInterval)||1.8)});
 }
 return allies;
}
export function createWorld01Encounter({draft,hero,monsterIds=['paper-gremlin'],level=1}={}){
 const enemies=monsterIds.map((id,index)=>world01Enemy(id,{level,index,lane:index%3,row:index<3?'front':'rear'})).filter(Boolean);
 return createFormationBattle({allies:world01AllySquad(draft,{slaveLevel:hero?.level??1,hero}),enemies});
}
export {tickFormationBattle};
