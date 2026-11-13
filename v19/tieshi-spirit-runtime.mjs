import {TIESHI_SPIRITS,tieshiSpiritAction,tieshiWill,tieshiWillShieldMultiplier} from './tieshi-necromancer.mjs';
/** Engine-independent combat state. Only one spirit is active; no extra targetable units. */
export function createSpiritBattle({primarySpirit='engineer'}={}){
 return {primarySpirit:Object.hasOwn(TIESHI_SPIRITS,primarySpirit)?primarySpirit:'engineer',will:0,lastTriggeredAt:-Infinity,visualUntil:0,visual:null};
}
export function spiritProtect(state,{blocks=1}={}){
 return {...state,will:tieshiWill(state.will,blocks)};
}
export function spiritTick(state,{now,allies=[],enemies=[],unlocked=false}={}){
 if(!unlocked||!Number.isFinite(now))return {state,effect:null};
 const spirit=state.primarySpirit;
 const liveAllies=allies.map((unit,index)=>({...unit,index})).filter(unit=>unit.hp>0&&unit.maxHp>0);
 if(!liveAllies.length)return {state,effect:null};
 const weakest=liveAllies.reduce((best,unit)=>unit.hp/unit.maxHp<best.hp/best.maxHp?unit:best);
 const enemy=enemies.map((unit,index)=>({...unit,index})).filter(unit=>unit.hp>0).sort((a,b)=>(b.atk||0)-(a.atk||0))[0];
 if(spirit==='scout'&&!enemy)return {state,effect:null};
 const action=tieshiSpiritAction({spirit,now,lastTriggeredAt:state.lastTriggeredAt,targetMaxHp:weakest.maxHp,enabled:true});
 if(!action)return {state,effect:null};
 const target=action.kind==='weaken'?enemy:weakest;
 const effect={...action,targetIndex:target.index,spirit,source:'tieshi',shieldMultiplier:action.kind==='shield'?tieshiWillShieldMultiplier(state.will):1};
 if(effect.kind==='shield')effect.amount=Math.round(effect.amount*effect.shieldMultiplier);
 return {state:{...state,lastTriggeredAt:now,visual:action.visual,visualUntil:now+action.durationMs},effect};
}
export function spiritVisual(state,now){return now<state.visualUntil?state.visual:null;}
export function spiritUltimate(state,{allies=[]}={}){
 if(state.will<6)return {state,effect:null};
 return {state:{...state,will:0,visual:'three-spirits',visualUntil:3000},effect:{kind:'team-protect',source:'tieshi',durationMs:3000,protectLethalOnce:true,targetIndices:allies.map((_,i)=>i)}};
}
