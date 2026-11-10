/* Salary Hero Lite — deterministic instance loot, four active slots and compatible save data.
 * Art is NOT included here. Equipment changes actual battle calculations.
 */
export const LITE_SLOTS=Object.freeze([
 Object.freeze({id:'weapon',name:'主武器'}),
 Object.freeze({id:'armor',name:'上衣'}),
 Object.freeze({id:'badge',name:'工牌'}),
 Object.freeze({id:'relic',name:'遺物'})
]);
export const LITE_RARITIES=Object.freeze([
 Object.freeze({id:'common',name:'普通',color:'#ded0bb',scale:1,affixes:0}),
 Object.freeze({id:'uncommon',name:'優良',color:'#a4e5bd',scale:1.12,affixes:1}),
 Object.freeze({id:'rare',name:'稀有',color:'#9aceff',scale:1.3,affixes:2}),
 Object.freeze({id:'epic',name:'史詩',color:'#dfabff',scale:1.62,affixes:3}),
 Object.freeze({id:'legendary',name:'傳說',color:'#ffcb79',scale:2,affixes:3})
]);
export const LITE_AFFIXES=Object.freeze([
 Object.freeze({id:'attack',name:'勇氣',stat:'attack',min:1,max:4}),
 Object.freeze({id:'hp',name:'不屈',stat:'hp',min:3,max:10}),
 Object.freeze({id:'crit',name:'精準',stat:'crit',min:.015,max:.045}),
 Object.freeze({id:'damageReduction',name:'堅忍',stat:'damageReduction',min:.012,max:.04}),
 Object.freeze({id:'lifeSteal',name:'續命',stat:'lifeSteal',min:.015,max:.045})
]);
const B=[
 ['w-briefcase','weapon','破舊的通勤公事包',12,0,0,'clockout','💼'],
 ['w-stapler','weapon','釘書機處決者',15,0,0,'clockout','⚔️'],
 ['w-buspass','weapon','末班電車月票劍',18,0,0,'clockout','🗡️'],
 ['w-clockblade','weapon','五點整打卡妖刀',23,0,0,'clockout','⚔️'],
 ['w-cupstaff','weapon','濃縮咖啡法杖',14,0,0,'coffee','☕'],
 ['w-coffeegrinder','weapon','黑咖啡研磨砲',20,0,0,'coffee','🪄'],
 ['w-report','weapon','週報鎖鏈',24,0,0,'guardian','⛓️'],
 ['w-robot','weapon','機甲保全伸縮棍',26,0,0,'guardian','🔨'],
 ['w-resign','weapon','辭職通知書・斬',30,0,0,null,'📜'],
 ['a-shirt','armor','皺巴巴的白襯衫',0,9,1,'clockout','👕'],
 ['a-coat','armor','末班車防風外套',0,16,2,'clockout','🧥'],
 ['a-vest','armor','午夜巡邏背心',0,21,3,'guardian','🦺'],
 ['a-heavy','armor','保全鋼鐵甲',0,28,5,'guardian','🛡️'],
 ['a-barista','armor','續命咖啡圍裙',0,17,2,'coffee','☕'],
 ['a-chemist','armor','焦糖煉金長袍',0,20,2,'coffee','🥼'],
 ['a-nebula','armor','星際員工防護衣',0,31,4,null,'🌌'],
 ['a-myth','armor','不朽社畜披風',0,34,4,null,'🦇'],
 ['b-card','badge','見習員工識別證',1,4,0,'clockout','🪪'],
 ['b-early','badge','準時下班通行證',2,4,0,'clockout','🪪'],
 ['b-coffee','badge','咖啡無限續杯證',1,7,0,'coffee','🪪'],
 ['b-brewer','badge','深夜咖啡師勳章',2,8,0,'coffee','🏵️'],
 ['b-guard','badge','零事故考勤工牌',1,12,1,'guardian','🪪'],
 ['b-security','badge','保全班長徽章',2,14,1,'guardian','🎖️'],
 ['b-galaxy','badge','銀河總部免加班證',4,10,0,null,'🌟'],
 ['r-alarm','relic','不響的鬧鐘',1,3,0,'clockout','⏰'],
 ['r-ticket','relic','永恆末班車車票',2,4,0,'clockout','🎫'],
 ['r-mug','relic','第七杯特濃咖啡',1,8,0,'coffee','☕'],
 ['r-bean','relic','萬年不敗咖啡豆',2,9,0,'coffee','🫘'],
 ['r-shield','relic','永不退件的報告',1,12,1,'guardian','📋'],
 ['r-moon','relic','夜班守護月石',2,13,1,'guardian','🌙']
];
export const LITE_ITEM_BASES=Object.freeze(B.map(x=>Object.freeze({
 id:x[0],slot:x[1],name:x[2],attack:x[3],hp:x[4],armor:x[5],setId:x[6],icon:x[7]
})));
export const LITE_SETS=Object.freeze([
 Object.freeze({id:'clockout',name:'準時下班協定',description:'2件：暴擊率 +12%；每第 5 次攻擊觸發收工斬（額外傷害）'}),
 Object.freeze({id:'coffee',name:'咖啡續命循環',description:'2件：生命吸取 +10%；每第 4 次攻擊恢復 15 生命'}),
 Object.freeze({id:'guardian',name:'加班保全守則',description:'2件：所受傷害再減少 8%'})
]);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
const chance=(rng)=>clamp(rng(),0,.999999999);
export function liteBase(id){return LITE_ITEM_BASES.find(x=>x.id===id)||null;}
export function liteRarity(id){return LITE_RARITIES.find(x=>x.id===id)||LITE_RARITIES[0];}
export function liteCreateItem(templateId,rarityId,itemLevel,seq,rng=Math.random){
 const base=liteBase(templateId);if(!base)return null;
 const tier=liteRarity(rarityId),level=Math.floor(clamp(itemLevel,1,500));
 const id='li-'+Math.max(1,Math.floor(clamp(seq,1,1000000000)));
 const available=[...LITE_AFFIXES],affixes=[];
 for(let i=0;i<tier.affixes;i++){
   const n=Math.floor(chance(rng)*available.length);
   const a=available.splice(n,1)[0],power=chance(rng);
   affixes.push({id:a.id,value:Number((a.min+(a.max-a.min)*power)*(1+Math.min(level,150)/100)).toFixed(a.stat==='attack'||a.stat==='hp'?0:4)*1});
 }
 return {instanceId:id,templateId:base.id,rarity:tier.id,itemLevel:level,affixes,locked:false};
}
export function liteNormalizeInventory(value){
 const seen=new Set(),out=[];
 if(!Array.isArray(value))return out;
 for(const item of value.slice(0,200)){
   if(!item||typeof item!=='object'||!liteBase(item.templateId)||!/^li-[1-9]\d{0,9}$/.test(item.instanceId||'')||seen.has(item.instanceId))continue;
   seen.add(item.instanceId);const rarity=liteRarity(item.rarity);
   const used=new Set(),affixes=[];
   for(const val of Array.isArray(item.affixes)?item.affixes:[]){
     const allowed=LITE_AFFIXES.find(x=>x.id===val?.id);
     if(!allowed||used.has(allowed.id)||affixes.length>=rarity.affixes)continue;
     used.add(allowed.id);
     affixes.push({id:allowed.id,value:Number(clamp(val.value,allowed.min*.5,allowed.max*8).toFixed(4))});
   }
   out.push({instanceId:item.instanceId,templateId:item.templateId,rarity:rarity.id,itemLevel:Math.floor(clamp(item.itemLevel,1,500)),affixes,locked:item.locked===true});
   if(out.length>=120)break;
 }
 return out;
}
export function liteNormalizeLoadout(raw,inventory){
 const ids=new Set(inventory.map(it=>it.instanceId)),out={weapon:null,armor:null,badge:null,relic:null};
 for(const slot of LITE_SLOTS){
   const id=raw?.[slot.id],it=inventory.find(v=>v.instanceId===id);
   if(ids.has(id)&&it&&liteBase(it.templateId).slot===slot.id)out[slot.id]=id;
 }
 return out;
}
export function liteStatLine(item){
 const base=liteBase(item?.templateId);if(!base)return '';
 const multiplier=liteRarity(item.rarity).scale*(1+Math.min(item.itemLevel,150)/110);
 const attack=Math.floor(base.attack*multiplier);
 const hp=Math.floor(base.hp*multiplier);
 const armor=Math.floor(base.armor*multiplier);
 return [attack?'攻擊 +'+attack:'',hp?'生命 +'+hp:'',armor?'護甲 +'+armor:''].filter(Boolean).join(' · ');
}
export function liteAffixLine(item){
 if(!item)return '';
 return (item.affixes||[]).map(x=>{
   const a=LITE_AFFIXES.find(y=>y.id===x.id);
   if(!a)return '';
   const percentage=['crit','damageReduction','lifeSteal'].includes(a.stat);
   return a.name+' '+(percentage?(x.value*100).toFixed(1)+'%':'+'+x.value);
 }).filter(Boolean).join(' · ');
}
export function liteEquipmentStats(state){
 const inventory=state?.liteInventory||[],loadout=state?.liteLoadout||{},stats={
  attack:0,weaponAttack:0,hp:0,armor:0,crit:0,damageReduction:0,lifeSteal:0,
  clockout:false,coffee:false,guardian:false,sets:{}
 };
 for(const slot of LITE_SLOTS){
   const it=inventory.find(x=>x.instanceId===loadout[slot.id]);if(!it)continue;
   const base=liteBase(it.templateId);if(!base||base.slot!==slot.id)continue;
   const scale=liteRarity(it.rarity).scale*(1+Math.min(it.itemLevel,150)/110);
   const att=Math.floor(base.attack*scale);
   if(slot==='weapon')stats.weaponAttack=att;else stats.attack+=att;
   stats.hp+=Math.floor(base.hp*scale);
   stats.armor+=Math.floor(base.armor*scale);
   for(const x of it.affixes||[]){
     const a=LITE_AFFIXES.find(y=>y.id===x.id);if(!a)continue;
     stats[a.stat]+=x.value;
   }
   if(base.setId)stats.sets[base.setId]=(stats.sets[base.setId]||0)+1;
 }
 stats.clockout=(stats.sets.clockout||0)>=2;
 stats.coffee=(stats.sets.coffee||0)>=2;
 stats.guardian=(stats.sets.guardian||0)>=2;
 if(stats.clockout)stats.crit+=.12;
 if(stats.coffee)stats.lifeSteal+=.10;
 if(stats.guardian)stats.damageReduction+=.08;
 stats.crit=clamp(stats.crit,0,.59);
 stats.lifeSteal=clamp(stats.lifeSteal,0,.35);
 stats.damageReduction=clamp(stats.damageReduction,0,.5);
 return stats;
}
/** Make an optional, RNG-controlled battle drop. Never consumes RNG if the bag is full. */
export function liteRollDrop(state,rng=Math.random,enemyTier='normal',nowMonday=false){
 if((state.liteInventory||[]).length>=120)return null;
 const dropChance=enemyTier==='boss'?1:enemyTier==='elite'?.75:nowMonday?.52:.3;
 if(chance(rng)>=dropChance)return null;
 const base=LITE_ITEM_BASES[Math.floor(chance(rng)*LITE_ITEM_BASES.length)];
 const rarityRoll=chance(rng);
 const rareBoost=enemyTier==='boss'?.12:enemyTier==='elite'?.06:0;
 const modified=Math.max(0,rarityRoll-rareBoost-(nowMonday?.06:0));
 const rarity=modified<.017?'legendary':modified<.10?'epic':modified<.33?'rare':modified<.65?'uncommon':'common';
 const seq=Math.max(1,Math.floor(Number(state.liteItemSeq)||0)+1);
 const item=liteCreateItem(base.id,rarity,Math.max(1,Math.floor(state.wave||1)),seq,rng);
 state.liteItemSeq=seq;
 state.liteInventory.push(item);
 return item;
}
