/* S1 interim combat squad tactics. Deterministic, stat-based effects.
 * The live battle still uses a single enemy and one action cycle; this module
 * does not claim to provide seven independent animated combatants.
 */
import {squadStats,squadSynergies} from './v21-squad-core.mjs';
export function resolveSquadAssist(draft,slaveLevel,{enemyHp=0,heroHp=0,heroMaxHp=0,turn=1}={}){
 const allies=squadStats(draft,slaveLevel).filter(Boolean);
 const result={units:allies.length,damage:0,heal:0,shield:0,slow:false,breakdown:[]};
 if(!allies.length)return result;
 for(const ally of allies){
  let damage=Math.max(1,Math.round(ally.attack*.13));
  let heal=0,shield=0,slow=false;
  if(ally.role==='tank'){shield=Math.max(1,Math.round(ally.maxHp*.025));damage=Math.round(damage*.7);}
  if(ally.role==='melee')damage=Math.round(damage*1.35);
  if(ally.role==='assassin'&&enemyHp>0&&enemyHp<100)damage=Math.round(damage*1.5);
  if(ally.role==='caster'){damage=Math.round(damage*1.15);slow=turn%3===0;}
  if(ally.role==='healer'){heal=Math.max(1,Math.round(ally.attack*.45));damage=Math.round(damage*.5);}
  if(ally.role==='support')damage=Math.round(damage*1.12);
  if(ally.effect==='double'&&turn%3===0)damage+=Math.round(ally.attack*.12);
  if(ally.effect==='heal'&&turn%2===0)heal+=Math.round(ally.attack*.2);
  if(ally.effect==='guard')shield+=Math.round(ally.maxHp*.02);
  damage=Math.max(1,damage);
  result.damage+=damage;result.heal+=heal;result.shield+=shield;result.slow ||=slow;
  result.breakdown.push({id:ally.id,job:ally.job,role:ally.role,damage,heal,shield,slow});
 }
 result.heal=Math.min(result.heal,Math.max(0,heroMaxHp-heroHp));
 // Shield is provisional defensive reduction for the current enemy retaliation,
 // not a persistent extra-HP pool.
 return result;
}
