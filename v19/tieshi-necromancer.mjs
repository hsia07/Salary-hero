/** Tieshi's optional final hidden class. Pure combat helpers; no DOM dependency. */
export const TIESHI_FINAL_KEY='salary-hero:tieshi-necromancer:v1';
export const TIESHI_FINAL_EVENT='tieshi-soul-reconciliation';
export const TIESHI_SPIRITS=Object.freeze({
 lantern:Object.freeze({id:'lantern',name:'小燈',role:'heal',cooldownMs:5000,healMaxHpRatio:.05}),
 engineer:Object.freeze({id:'engineer',name:'阿誠',role:'shield',cooldownMs:8000,shieldMaxHpRatio:.08}),
 scout:Object.freeze({id:'scout',name:'阿遠',role:'weaken',cooldownMs:10000,damageReductionRatio:.12,durationMs:4000})
});
export const TIESHI_FINAL_CLASS=Object.freeze({id:'necromantic-guardian',name:'死靈護衛',rarity:'SR',clock:'09:00',bond:'不滅的交班',maxWill:6});
export function tieshiFinalUnlocked({midgameAwakened=false,finalEvent=false}={}){return midgameAwakened===true&&finalEvent===true;}
export function tieshiFinalState(raw={}){return {finalEvent:raw?.finalEvent===true,primarySpirit:Object.hasOwn(TIESHI_SPIRITS,raw?.primarySpirit)?raw.primarySpirit:'engineer'};}
export function tieshiFinalAdvance(raw,event,{midgameAwakened=false}={}){
 const state=tieshiFinalState(raw);
 if(midgameAwakened&&event?.type==='story-reconciled'&&event.id===TIESHI_FINAL_EVENT)state.finalEvent=true;
 if(event?.type==='choose-spirit'&&Object.hasOwn(TIESHI_SPIRITS,event.id))state.primarySpirit=event.id;
 return state;
}
export function tieshiWill(stacks=0,blocks=0){return Math.max(0,Math.min(6,Math.floor(stacks)+Math.max(0,Math.floor(blocks))));}
export function tieshiWillShieldMultiplier(stacks=0){return 1+.03*tieshiWill(stacks);}
export function tieshiSpiritAction({spirit='engineer',now=0,lastTriggeredAt=-Infinity,targetMaxHp=1,enabled=true}={}){
 const s=TIESHI_SPIRITS[spirit];if(!enabled||!s||now-lastTriggeredAt<s.cooldownMs)return null;
 const maxHp=Math.max(0,Number(targetMaxHp)||0);
 if(s.role==='heal')return {kind:'heal',amount:Math.round(maxHp*s.healMaxHpRatio),visual:'spirit-lantern',durationMs:500};
 if(s.role==='shield')return {kind:'shield',amount:Math.round(maxHp*s.shieldMaxHpRatio),visual:'spirit-engineer',durationMs:600};
 return {kind:'weaken',damageReductionRatio:s.damageReductionRatio,effectDurationMs:s.durationMs,visual:'spirit-scout',durationMs:400};
}
export const TIESHI_FINAL_SCENE=Object.freeze([
 {atMs:0,line:'那扇門……還是鎖著。',shot:'burned-hall'},
 {atMs:4700,line:'鐵時，你已經守得夠久了。',shot:'coworkers-appear'},
 {atMs:9000,line:'你可以下班了。',shot:'shield-lowered'},
 {atMs:15000,line:'這次，換我們陪你走吧。',shot:'coworkers-reach'},
 {atMs:21500,line:'09:00',shot:'clock-changes'},
 {atMs:26000,line:'隱藏職業解鎖・死靈護衛',shot:'final-card'}
]);
