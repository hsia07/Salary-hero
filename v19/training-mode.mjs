/** Salary Hero V19 — ephemeral art/battle rehearsal.
 * No mutation of the player's actual save. Three approved species and the fourth alien timing-only candidate
 * can be opened; query values never select arbitrary species or files.
 */
const TRAINING_WAVES=Object.freeze({'paper-gremlin':1,'coffee-mimic':2,'chair-golem':5,'meeting-ghost':50,'deadline-clock':6});
export function trainingWaveFor(value){
 return Object.prototype.hasOwnProperty.call(TRAINING_WAVES,value)?TRAINING_WAVES[value]:null;
}
export function trainingStateFor(species,initial,enemyFor){
 const wave=trainingWaveFor(species);
 if(wave===null)return null;
 const s=initial();
 const target=enemyFor(wave);
 const maxHp=126;
 return {...s,playerName:'練習勇者',auto:false,speed:1,wave,heroHp:900,maxHp:900,
  enemy:{...target,hp:maxHp,maxHp},potions:3,log:['🎮 實戰練習：測試 '+target.name+'；不會修改正式遊戲存檔。'],
  last:null};
}
export function repeatTrainingEnemy(state,species,enemyFor){
 const wave=trainingWaveFor(species);
 if(wave===null||!state?.last||state.last.type!=='victory')return state;
 const target=enemyFor(wave),maxHp=126;
 return {...state,wave,enemy:{...target,hp:maxHp,maxHp,turns:0},
   heroHp:900,maxHp:900,log:['🎮 已擊倒，準備重新練習 '+target.name+'；正式存檔未更動。',...state.log].slice(0,20)};
}
/** Prepare one lethal REAL engine attack inside isolated practice only.
 * Keeps all combat calculations, crits, rewards and death sprites unchanged.
 * The app never saves this temporary training state to the player's slot.
 */
export function primeTrainingFinisher(state,species){
 const wave=trainingWaveFor(species);
 if(wave===null||!state||state.wave!==wave||state.enemy?.hp<=0)return state;
 return {...state,enemy:{...state.enemy,hp:1},auto:false,
  log:['🎯 練習下一擊：已把測試怪物生命設為 1。按攻擊可播放完整擊敗動畫；正式存檔不受影響。',...(state.log||[])].slice(0,20)};
}
