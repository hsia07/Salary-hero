/** World 01 narrative route: editorial sources, not playable level IDs.
 * Isolated from legacy Tieshi awakening and salary saves.
 */
export const WORLD01_MAINLINE=Object.freeze([
 'CH01','CH02','CH05','CH09','CH11','CH12','CH13','CH14','CH15',
 'CH16','CH17','CH21','CH23','CH24','CH25','CH29','CH33','CH34','CH35'
]);
export const WORLD01_SOURCE=Object.freeze(Object.fromEntries(
 WORLD01_MAINLINE.map((chapter,index)=>[chapter,Object.freeze({
  id:'world01/source/'+chapter.toLowerCase(),
  chapter,order:index+1,
  edition:['CH29','CH33','CH34','CH35'].includes(chapter)?'expanded':'original'
 })])
));
export const WORLD01_STORY_BRANCHES=Object.freeze({
 factory:Object.freeze(['CH06','CH07','CH08','CH10','CH19','CH26','CH27','CH31']),
 performance:Object.freeze(['CH03','CH04','CH18','CH20','CH22','CH28','CH32']),
 wuming:Object.freeze(['CH30'])
});
const sourceIds=new Set([
 ...Object.values(WORLD01_SOURCE).map(x=>x.id),
 ...Object.values(WORLD01_STORY_BRANCHES).flat().map(x=>'world01/source/'+x.toLowerCase())
]);
export const WORLD01_PROGRESS_KEY='salary-hero:world01-narrative:v1';
export function normalizeWorld01Narrative(raw={}){
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const visited=Array.isArray(o.visited)?o.visited:[];
 return {version:1,visited:[...new Set(visited.filter(id=>typeof id==='string'&&sourceIds.has(id)))].sort()};
}
export function visitWorld01Source(raw,sourceId){
 const state=normalizeWorld01Narrative(raw);
 if(!sourceIds.has(sourceId)||state.visited.includes(sourceId))return state;
 return normalizeWorld01Narrative({...state,visited:[...state.visited,sourceId]});
}
export function world01NextMainline(raw){
 const seen=new Set(normalizeWorld01Narrative(raw).visited);
 return WORLD01_MAINLINE.map(ch=>WORLD01_SOURCE[ch]).find(x=>!seen.has(x.id))??null;
}
export function readWorld01Narrative(storage){
 try{return normalizeWorld01Narrative(JSON.parse(storage?.getItem?.(WORLD01_PROGRESS_KEY)||'{}'))}
 catch{return normalizeWorld01Narrative()}
}
export function saveWorld01Narrative(storage,raw){
 const state=normalizeWorld01Narrative(raw);
 storage?.setItem?.(WORLD01_PROGRESS_KEY,JSON.stringify(state));
 return state;
}
