/**
 * Hell Monday Dungeon V5 — data-driven wave setup.
 * All enemy stat modifiers apply exactly once at spawn.
 * The final boss is a separate stage with a two-phase controller.
 */
export const HELL_MONDAY=Object.freeze({
 id:'hell-monday',title:'地獄星期一',weekday:1,
 global:Object.freeze({enemyHp:1.65,enemyAttack:1.4,exp:2,rareDrop:'bonus-pending-balancing'}),
 waves:Object.freeze([
  {id:'clock-in',name:'第一波・上班打卡',kind:'mob',
    enemies:[['paper-gremlin','文件小鬼',42,4],['paper-gremlin','影印文件小鬼',42,4],['deadline-clock','催命鬧鐘',55,5]]},
  {id:'overtime-queue',name:'第二波・工作量暴增',kind:'mixed',
    enemies:[['coffee-mimic','失控咖啡怪',48,4],['paper-gremlin','文件小鬼',42,4],['keyboard-piranha','鍵盤食人魚',56,5],['deadline-clock','截止日鐘',54,5]]},
  {id:'supervisor',name:'第三波・主管來催件',kind:'elite',
    enemies:[['chair-golem','催件主管・打卡機兵',115,7],['meeting-ghost','無限會議幽靈',50,5],['paper-gremlin','碎紙傳令兵',42,4]]},
  {id:'boss',name:'第四波・地獄加班決戰',kind:'boss',
    enemies:[['deadline-overlord','加班狂課長・文書牛魔',100,12]]}
 ]),
});
export function defineMondayEnemy(waveIndex,index){
 const w=HELL_MONDAY.waves[waveIndex];if(!w||!w.enemies[index])return null;
 const [species,name,baseHp,baseAtk]=w.enemies[index];
 return Object.freeze({
   id:`${w.id}:${index}`,waveId:w.id,kind:w.kind,species,name,
   baseHp,baseAtk,
   maxHp:Math.round(baseHp*HELL_MONDAY.global.enemyHp*100)/100,
   atk:Math.round(baseAtk*HELL_MONDAY.global.enemyAttack*100)/100
 });
}
export function spawnMondayWave(waveIndex){
 const wave=HELL_MONDAY.waves[waveIndex];
 if(!wave||!Number.isInteger(waveIndex))throw new RangeError('invalid Monday wave');
 return {wave:waveIndex+1,id:wave.id,name:wave.name,kind:wave.kind,
   enemies:wave.enemies.map((_,index)=>({...defineMondayEnemy(waveIndex,index)})),
   global:{...HELL_MONDAY.global}};
}
export function clearWaveRecovery(currentHp,maxHp,extraPercent=10){
 const h=Math.max(0,Math.min(maxHp,Number(currentHp)||0));
 if(h===0)return 0;
 return Math.min(maxHp,h+Math.round(maxHp*extraPercent)/100);
}
export function isDungeonComplete(waveIndex,remainingAlive){
 return waveIndex===HELL_MONDAY.waves.length-1&&remainingAlive===0;
}
