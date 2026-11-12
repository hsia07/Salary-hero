// Salary Hero: dynamic portrait battlefield scene graph (S1).
// Environment assets NEVER contain baked-in heroes, colleagues or enemies.
export const MONDAY_SCENE={
 id:'hell-monday',ratio:9/16,
 layers:[
  {id:'sky',src:'../art/v19/runtime/backgrounds/storybook-office.svg',depth:0,parallax:0.012},
  {id:'back-atmosphere',kind:'atmosphere',depth:1,parallax:0.025},
  {id:'ground',kind:'ground',depth:2,parallax:0},
  {id:'front-atmosphere',kind:'embers',depth:6,parallax:0.06}
 ],
 boss:{id:'deadline-clock',src:'../art/v19/runtime/monsters/deadline-clock/idle.webp'},
 hero:{id:'salary-slave',src:'../art/v19/candidates/characters/starter/chibi/idle-candidate.webp'}
};
export const PORTRAIT_SLOTS=Object.freeze([
 {id:'front_1',x:.17,y:.72},{id:'front_2',x:.5,y:.75},{id:'front_3',x:.83,y:.72},
 {id:'back_1',x:.17,y:.58},{id:'back_2',x:.5,y:.60},{id:'back_3',x:.83,y:.58},
 {id:'hero',x:.5,y:.88}
]);
export function buildBattleScene({formation=[],hero=MONDAY_SCENE.hero,boss=MONDAY_SCENE.boss,assets={}}={}){
 const units=PORTRAIT_SLOTS.map((slot,i)=>{
  const id=i===6?hero?.id:formation[i]?.id;
  if(!id)return null;
  const entry=i===6?hero:(assets[id]||formation[i]);
  return {id,slot:slot.id,x:slot.x,y:slot.y,src:entry?.src||null,kind:i===6?'hero':'colleague'};
 }).filter(Boolean);
 const enemy=boss?{...boss,x:.5,y:.31,kind:'enemy'}:null;
 return {environment:MONDAY_SCENE.layers,units:units.sort((a,b)=>a.y-b.y),enemy};
}
export function actorAnimation(kind){
 const states={idle:{duration:900},run:{duration:320},attack:{duration:500},hurt:{duration:240,redFlash:true},defeat:{duration:700}};
 return states[kind]||states.idle;
}
