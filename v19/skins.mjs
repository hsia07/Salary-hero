/* Salary Hero V19 — cosmetics are earnable only. No real-money purchase or tradable prize. */
import {HERO_STYLES} from './roster.mjs';
export const SKIN_RARITIES=Object.freeze({
  free:{label:'初始',weight:0},
  common:{label:'普通',weight:60},
  rare:{label:'稀有',weight:28},
  epic:{label:'史詩',weight:10},
  legendary:{label:'傳說',weight:2},
  event:{label:'活動限定',weight:0}
});
const details={
  starter:['free','starter'],
  'office-lady':['common','draw'],
  'night-shift':['event','monday-survival'],
  'suit-executive':['rare','draw'],
  accountant:['rare','draw'],
  'office-bot':['common','draw'],
  android:['epic','draw'],
  alien:['common','draw'],
  'cosmic-clerk':['rare','draw'],
  slime:['common','draw'],
  skeleton:['epic','draw'],
  ghost:['rare','draw'],
  vampire:['legendary','draw'],
  'cat-office':['event','friday-weekend'],
  'dragon-office':['legendary','draw'],
  mushroom:['common','draw']
};
export const SKINS=Object.freeze(HERO_STYLES.map(style=>{
  const [rarity,source]=details[style.id]||[];
  if(!rarity||!SKIN_RARITIES[rarity])throw Error('Missing skin metadata: '+style.id);
  return Object.freeze({...style,rarity,source,assetStatus:'concept-only'});
}));
export const SKIN_EVENTS=Object.freeze([
  Object.freeze({id:'monday-survival',name:'地獄星期一',weekday:1,requiredWins:3,skinId:'night-shift',
    description:'週一擊敗 3 隻敵人，領取「爆肝加班族」；已獲得者改領 1 張造型券'}),
  Object.freeze({id:'friday-weekend',name:'週五迎接週末',weekday:5,requiredWins:4,skinId:'cat-office',
    description:'週五擊敗 4 隻敵人，領取「貓耳上班族」；已獲得者改領 1 張造型券'})
]);
export function skinById(id){return SKINS.find(x=>x.id===id)||null;}
export function weekdayTaiwan(now=Date.now()){return new Date(now+8*3600000).getUTCDay();}
export function taiwanWeekKey(now=Date.now()){
 const date=new Date(now+8*3600000);
 const day=date.getUTCDay(),monday=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()-(day+6)%7);
 return new Date(monday).toISOString().slice(0,10);
}
export function drawPool(owned=[]){const set=new Set(owned);return SKINS.filter(s=>s.source==='draw'&&!set.has(s.id));}
export function pickSkin(pool,rng=Math.random){
 if(!pool.length)return null;
 const weighted=pool.map(s=>({skin:s,weight:SKIN_RARITIES[s.rarity].weight}));
 const total=weighted.reduce((n,x)=>n+x.weight,0);
 if(total<=0)return null;
 const random=Math.max(0,Math.min(0.999999999,Number(rng())||0))*total;
 let cursor=0;
 for(const item of weighted){cursor+=item.weight;if(random<cursor)return item.skin;}
 return weighted[weighted.length-1].skin;
}
