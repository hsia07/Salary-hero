/** First playable World 01 investigation encounter. Pure state machine; no DOM or legacy save mutation. */
export const B2_SCENE_ID='world01/b2-west-door';
export const B2_STEPS=Object.freeze([
 {id:'corridor',title:'B2 西側走廊',description:'你站在事故前的地下二樓。門旁的報修貼紙翹起一角。',choices:[{id:'inspect-door',label:'檢查西側防火門',next:'door'},{id:'inspect-note',label:'查看未寄出的通報',next:'note'}]},
 {id:'door',title:'門上的痕跡',description:'你找到事故前的門況紀錄，但沒有火警當下的測試結果。',choices:[{id:'record-door',label:'記下紀錄的時間限制',next:'note'}]},
 {id:'note',title:'未寄出的通報',description:'草稿提到西側門異常。它能證明有人曾經擔憂，不能證明鐵時最後走了哪條路。',choices:[{id:'compare',label:'比對兩份線索',next:'comparison'}]},
 {id:'comparison',title:'線索比對',description:'請選擇目前證據真正支持的結論。',choices:[{id:'unknown',label:'火警時門況與鐵時路線仍未知',next:'complete'},{id:'locked',label:'火警時西門一定鎖住',next:'correction'},{id:'route',label:'鐵時一定從西門折返',next:'correction'}]},
 {id:'correction',title:'證據不足',description:'事故前的紀錄不能直接證明事故當下的狀態，也不能推定死者最後路線。',choices:[{id:'retry',label:'重新檢視結論',next:'comparison'}]},
 {id:'complete',title:'保留空白',description:'你把已知與未知分開記錄。調查沒有替鐵時編造最後一條路。',choices:[]}
]);
const BY_ID=Object.fromEntries(B2_STEPS.map(x=>[x.id,x]));
export function initialB2Investigation(){return {version:1,sceneId:B2_SCENE_ID,step:'corridor',visited:['corridor'],completed:false};}
export function normalizeB2Investigation(raw){const s=raw&&typeof raw==='object'?raw:{};const step=BY_ID[s.step]?s.step:'corridor';return {version:1,sceneId:B2_SCENE_ID,step,visited:[...new Set((Array.isArray(s.visited)?s.visited:[]).filter(x=>BY_ID[x]))],completed:step==='complete'};}
export function b2CurrentScene(raw){return BY_ID[normalizeB2Investigation(raw).step];}
export function chooseB2Investigation(raw,choiceId){const state=normalizeB2Investigation(raw);const choice=BY_ID[state.step].choices.find(x=>x.id===choiceId);if(!choice)return state;const step=choice.next;return {...state,step,visited:[...new Set([...state.visited,step])],completed:step==='complete'};}
export const B2_SAVE_KEY='salary-hero:world01-b2-investigation:v1';
export function loadB2Investigation(storage){try{return normalizeB2Investigation(JSON.parse(storage?.getItem?.(B2_SAVE_KEY)||'{}'))}catch{return initialB2Investigation();}}
export function saveB2Investigation(storage,state){const safe=normalizeB2Investigation(state);storage?.setItem?.(B2_SAVE_KEY,JSON.stringify(safe));return safe;}
