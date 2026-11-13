/** Tieshi is one SR character. Awakening changes artwork and skills, never rarity. */
export const TIESHI=Object.freeze({id:'guard',name:'打卡守衛・鐵時',rarity:'SR',role:'tank',origin:'舊世企業',synergy:'鋼鐵契約',exclusiveWeapon:'終夜打卡盾',shieldClock:'08:59'});
export const TIESHI_CARDS=Object.freeze([
 Object.freeze({id:'tieshi-sr-original',rarity:'SR',title:'終夜打卡守衛',portrait:'original',requiresStoryAwakening:false}),
 Object.freeze({id:'tieshi-sr-awakened',rarity:'SR',title:'最後一道門',portrait:'awakened',requiresStoryAwakening:true})
]);
export const TIESHI_SKILLS=Object.freeze([
 {id:'shield-strike',name:'巡夜盾擊',kind:'attack',target:'enemy',animation:['anticipation','contact','recovery']},
 {id:'guard-link',name:'打卡護衛',kind:'guard',target:'lowest-health-ally',animation:['raise-shield','link','hold']},
 {id:'intercept',name:'強制代班',kind:'intercept',target:'guarded-ally',animation:['dash','block','counter']},
 {id:'night-watch',name:'08:59・終夜守衛',kind:'ultimate',target:'all-allies',shieldRatio:.05,durationMs:4000,animation:['clock-0859','shield-expand','shield-hold']},
 {id:'last-door',name:'09:00・最後一道門',kind:'awakened-ultimate',target:'all-allies',shieldRatio:.08,durationMs:6000,interceptRatio:.30,requiresStoryAwakening:true,animation:['clock-0859','clock-0900','gate-expand','team-protect']}
]);
export function tieshiVisibleCards(awakened=false){return TIESHI_CARDS.filter(c=>awakened||!c.requiresStoryAwakening)}
export function tieshiActiveCard(awakened=false){return TIESHI_CARDS[awakened?1:0]}
export function tieshiVisibleSkills(awakened=false){return TIESHI_SKILLS.filter(s=>awakened||!s.requiresStoryAwakening)}
