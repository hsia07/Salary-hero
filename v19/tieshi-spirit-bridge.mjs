import {readTieshiStory,tieshiStoryAwakened} from './tieshi-story-progress.mjs';
import {TIESHI_FINAL_KEY,tieshiFinalState,tieshiFinalAdvance,tieshiFinalUnlocked} from './tieshi-necromancer.mjs';
import {createSpiritBattle,spiritTick,spiritProtect} from './tieshi-spirit-runtime.mjs';
let finalState;
try{finalState=tieshiFinalState(JSON.parse(localStorage.getItem(TIESHI_FINAL_KEY)||'{}'))}catch{finalState=tieshiFinalState()}
let battle=createSpiritBattle({primarySpirit:finalState.primarySpirit});
const api=()=>window.__salaryBossV5;
const unlocked=()=>tieshiFinalUnlocked({midgameAwakened:tieshiStoryAwakened(readTieshiStory(localStorage)),finalEvent:finalState.finalEvent});
function snapshot(){return {unlocked:unlocked(),primarySpirit:battle.primarySpirit,will:battle.will,visual:battle.visual}}
window.__tieshiSpiritBridge={snapshot};
window.addEventListener('salary-hero:story-event',e=>{
 const next=tieshiFinalAdvance(finalState,e.detail,{midgameAwakened:tieshiStoryAwakened(readTieshiStory(localStorage))});
 finalState=next;localStorage.setItem(TIESHI_FINAL_KEY,JSON.stringify(next));
 battle={...battle,primarySpirit:next.primarySpirit};
});
document.addEventListener('tieshi:protected-ally',e=>{if(unlocked())battle=spiritProtect(battle,{blocks:e.detail?.blocks||1})});
let previousWave=null;
setInterval(()=>{
 const game=api();if(!game||!unlocked())return;
 const wave=game.wave;
 if(wave!==previousWave){previousWave=wave;battle=createSpiritBattle({primarySpirit:finalState.primarySpirit})}
 const allies=window.__salaryBossV4?.health?.map(hp=>({hp,maxHp:100}))||[];
 const enemies=game.mobNames.map(()=>({hp:1,atk:1}));
 const now=game.skillTime;
 const result=spiritTick(battle,{now,allies,enemies,unlocked:true});
 if(result.effect&&game.applyTieshiSpiritEffect(result.effect))battle=result.state;
},250);
