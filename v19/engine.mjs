/* Salary Hero V19 — isolated, deterministic game rules. No UI or screenshot dependency. */
import {enemyDesignFor,tierForWave,ALL_ENEMIES,HERO_STYLES} from './roster.mjs';
import {SKINS,SKIN_EVENTS,skinById,drawPool,pickSkin,taiwanWeekKey,weekdayTaiwan} from './skins.mjs';
import {WEEKEND_CHAOS_EVENTS,weekendChaosDraw,weekendChaosById} from './weekend-chaos.mjs';
import {LITE_SLOTS,liteBase,liteRarity,liteNormalizeInventory,liteNormalizeLoadout,liteEquipmentStats,liteRollDrop} from './lite-equipment.mjs';
import {LITE_STRATEGIES,liteOfflineEstimate,liteAutoPlan} from './lite-idle.mjs';
import {LITE_BUILDS,liteBuildById,liteBuildProgress,liteBuildBranch,liteMasteryRank,liteBuildStats,liteBuildHit,liteGrantMastery} from './lite-builds.mjs';
import {LITE_SKILL_PATHS,liteSkillUses,liteSkillPaths,liteSkillById,liteSkillSelection,liteSkillCastBonus,liteSkillGrantUse,LITE_SKILL_UNLOCK_USES} from './lite-skills.mjs';
import {liteLegendaryEffects} from './lite-legendaries.mjs';
import {LITE_PRESET_COUNT,liteNormalizePresets,liteSavePresetSnapshot,liteApplyPreset} from './lite-presets.mjs';
import {liteTacticalHit} from './lite-tactics.mjs';
export {WEEKEND_CHAOS_EVENTS} from './weekend-chaos.mjs';
export const PLAYER_TITLE='平凡社畜・';
export function cleanPlayerName(value){
 const text=String(value??'').normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu,'').trim();
 return Array.from(text).slice(0,12).join('');
}
export function playerTitle(state){return PLAYER_TITLE+(cleanPlayerName(state?.playerName)||'未命名');}
export const ITEMS = Object.freeze([
  {id:'briefcase',name:'破舊公事包',tier:'普通',attack:12,icon:'💼',cost:0},
  {id:'laptop',name:'鋼鐵加班筆電',tier:'稀有',attack:19,icon:'💻',cost:90},
  {id:'notice',name:'黃金離職通知書',tier:'史詩',attack:30,icon:'📜',cost:260},
  {id:'excalibur',name:'傳說・準時下班聖劍',tier:'傳說',attack:48,icon:'⚔️',cost:900}
]);
export const ENCOUNTERS = Object.freeze([
 {id:'printer',name:'失控的影印魔像',icon:'🖨️',theme:'office',rarity:'辦公室異變',text:'凌晨的影印機吐出了明天的週報，墨水卻在地板上拼出求救訊號。',choices:[
  {text:'拔掉插頭，拯救被困的文件精靈',gold:25,xp:24,note:'穩定獎勵'},
  {text:'把它帶去會議室對抗主管',gold:45,xp:8,note:'換取更多金幣'}
 ]},
 {id:'coffee',name:'神祕咖啡鍊金師',icon:'☕',theme:'pantry',rarity:'茶水間傳聞',text:'茶水間有一位陌生鍊金師，遞來一瓶會發光的三倍濃縮咖啡。',choices:[
  {text:'喝下去，讓疲憊的身體恢復精神',gold:10,xp:35,heal:30,note:'額外恢復 30 生命'},
  {text:'拿去找主管交換早退通行證',gold:60,xp:5,note:'較多金幣'}
 ]},
 {id:'dragon',name:'傳說・截止日巨龍',icon:'🐉',theme:'myth',rarity:'神話級邂逅',text:'深夜的天台裂開一道火紅裂隙，巨龍盤踞在一份永遠寫不完的專案上。',choices:[
  {text:'挑戰最後期限，搶回被吞噬的時間',gold:130,xp:100,note:'高額金幣與經驗'},
  {text:'召喚自動化法術，從空中繞過巨龍',gold:80,xp:145,note:'大量經驗'}
 ]},
 {id:'alien-shuttle',name:'銀河末班接駁船',icon:'🛸',theme:'alien',rarity:'異星奇遇',text:'外星企業的接駁船停在公司頂樓。船上所有時鐘都停在下班前一分鐘。',choices:[
  {text:'潛入貨艙，竊取永不加班的時鐘',risk:{chance:.55,success:{gold:155,xp:48},failure:{gold:0,xp:24,damage:26}},note:'成功獲得大量金幣；失敗損失 26 生命'},
  {text:'協助外星實習生解讀勞動契約',gold:53,xp:50,note:'安全而穩定'}
 ]},
 {id:'monkey-scroll',name:'花果山的神祕請假卷軸',icon:'🐒',theme:'myth',rarity:'西遊祕寶',text:'一隻戴工牌的猴兵擋住道路，身後的石門刻著「今日誰都不准加班」。',choices:[
  {text:'試著闖過石門，取走神猴卷軸',risk:{chance:.43,success:{gold:175,xp:95,heal:18},failure:{gold:0,xp:35,damage:30}},note:'高風險，成功時恢復生命'},
  {text:'幫猴兵完成輪班，取得通行符',gold:55,xp:65,heal:12,note:'恢復 12 生命'}
 ]},
 {id:'clockwork-elevator',name:'機械主管的禁忌電梯',icon:'🤖',theme:'mecha',rarity:'機械警報',text:'打卡後，電梯竟出現地下第 99 層。門內傳來機械主管的倒數聲。',choices:[
  {text:'入侵控制核心，破解加班協定',risk:{chance:.65,success:{gold:100,xp:88,potions:1},failure:{gold:9,xp:25,damage:22}},note:'成功額外取得一瓶藥水'},
  {text:'啟動緊急返回，把資料帶回辦公室',gold:42,xp:58,note:'安全離開'}
 ]},
 {id:'night-platform',name:'冥府末班通勤列車',icon:'🚉',theme:'nether',rarity:'幽冥事件',text:'月台上的電子告示牌寫著「加班終點站」，一班沒有駕駛的列車正在等候。',choices:[
  {text:'踏上幽冥列車，尋找失落的薪水',risk:{chance:.52,success:{gold:135,xp:90},failure:{gold:5,xp:25,damage:32}},note:'成功帶回大量金幣；失敗受到驚嚇'},
  {text:'守住月台，替徬徨的幽靈指路',gold:45,xp:75,heal:15,note:'額外恢復 15 生命'}
 ]},
 {id:'debug-cat',name:'午夜系統中的黑貓',icon:'🐈‍⬛',theme:'digital',rarity:'數位裂隙',text:'辦公電腦冒出一隻黑貓，牠尾巴一甩，整座公司像程式碼一樣散開。',choices:[
  {text:'跟著黑貓跳進錯誤訊息的裂縫',risk:{chance:.60,success:{gold:90,xp:105,gems:1},failure:{gold:0,xp:28,damage:17}},note:'成功找到一顆寶石'},
  {text:'留下來修補系統，幫黑貓找回家',gold:42,xp:62,heal:20,note:'額外恢復 20 生命'}
 ]}
]);
/** Calculate a single event outcome with one RNG call at most. Pure and testable. */
export function encounterOutcome(event,choiceIndex,rng=Math.random){
 const choice=event?.choices?.[choiceIndex];
 if(!choice)return null;
 const risk=choice.risk;
 const roll=risk?Math.max(0,Math.min(.999999,Number(rng())||0)):null;
 const won=risk?roll<risk.chance:true;
 const reward=risk?(won?risk.success:risk.failure):choice;
 const clean=(key)=>Math.max(0,Math.floor(Number(reward?.[key])||0));
 return {outcome:risk?(won?'success':'failure'):'certain',
  chance:risk?risk.chance:null,roll,
  gold:clean('gold'),xp:clean('xp'),heal:clean('heal'),
  damage:clean('damage'),potions:clean('potions'),gems:clean('gems'),
  choiceText:choice.text};
}
/** Balanced auto trustee: deterministic, prefer reliable rewards, take risks only
 * when their expected value clearly beats the safe route. */
export function autoEncounterChoice(event){
 if(!event?.choices?.length)return -1;
 const utility=(r)=>Math.max(0,Number(r?.gold)||0)*.30+
  Math.max(0,Number(r?.xp)||0)*.50+
  Math.max(0,Number(r?.heal)||0)*.35+
  Math.max(0,Number(r?.potions)||0)*25+
  Math.max(0,Number(r?.gems)||0)*40-
  Math.max(0,Number(r?.damage)||0)*1.80;
 const scores=event.choices.map(c=>{
   if(!c.risk)return utility(c);
   const p=c.risk.chance;
   const expected=p*utility(c.risk.success)+(1-p)*utility(c.risk.failure);
   // A conservative strategy: never take an under-60% speculative adventure.
   return p>=.6?expected/1.25:-Infinity;
 });
 let best=0;
 for(let i=1;i<scores.length;i++)if(scores[i]>scores[best])best=i;
 return best;
}
export const GAME_MODES=Object.freeze([
 {id:'campaign',name:'🏙️ 社畜遠征',description:'一般冒險 · 普通怪循環，永久推進'},
 {id:'tower',name:'🗼 無限之塔',description:'每四波補滿生命，持續挑戰更高樓層'},
 {id:'dungeon',name:'📆 每日副本',description:'平日五種獨立副本，週六與週日共用一個瘋狂週末副本'}
]);
/** Six distinct weekly dungeons in seven weekday slots; Sat and Sun share one. */
const WEEKEND_DUNGEON=Object.freeze({weekday:6,weekend:true,id:'weekend-chaos',name:'週末・全員下班！無人公司大暴走',icon:'🎪',theme:'weekend',story:'全公司下班，只剩升職失控的自動化機器！每層可能空蕩蕩、免費咖啡、彩紙風暴、金庫大開，甚至 AI 主管失控。週六、週日接續同一份進度。',hpScale:1.08,attackScale:1.06,rewardScale:1.35,xpScale:1.25,slackChance:.14});
export const DAILY_DUNGEONS=Object.freeze([
 WEEKEND_DUNGEON,
 {weekday:1,id:'monday-hell',name:'星期一・厭世',icon:'🔥',theme:'hell',story:'厭世氣息籠罩整棟公司：怪物血量 ×1.65、攻擊 ×1.4，經驗值翻倍，稀有與史詩裝備掉率提高。首通魔王保證一件史詩裝備。',hpScale:1.65,attackScale:1.4,rewardScale:1.25,xpScale:2,slackChance:0},
 {weekday:2,id:'tuesday-meeting',name:'星期二・永無止境的會議',icon:'📋',theme:'office',story:'怪物血量 ×1.1、攻擊 ×1，經驗 ×1.15。20% 機率被臨時會議延遲技能冷卻；普通怪有 15% 機率掉技能書碎片，魔王通關必得技能書。',hpScale:1.1,attackScale:1,rewardScale:1,xpScale:1.15,slackChance:.06},
 {weekday:3,id:'wednesday-breakdown',name:'星期三・精神崩潰邊緣',icon:'🫠',theme:'alien',story:'怪物血量 ×1.2、攻擊 ×1.15，經驗 ×1.25；勇者生命低於 50% 時暴擊率 +25 個百分點。寵物經驗翻倍、掉落寵物食物，怪物偶爾哭到放棄攻擊。',hpScale:1.2,attackScale:1.15,rewardScale:1.08,xpScale:1.25,slackChance:.12},
 {weekday:4,id:'thursday-overtime',name:'星期四・黎明前的加班',icon:'🌃',theme:'digital',story:'怪物血量 ×1.35、攻擊 ×1.2，經驗 ×1.3、金幣 ×1.25。每 4 回合觸發趕死線，敵方反擊 +20%；素材翻倍，魔王必掉稀有鍛造材料。',hpScale:1.35,attackScale:1.2,rewardScale:1.25,xpScale:1.3,slackChance:.08},
 {weekday:5,id:'friday-escape',name:'星期五・週末越獄大作戰',icon:'🏃',theme:'friday',story:'魔王「我只想下班」可能只留張紙條就跑路；小兵、菁英也只想摸魚。金幣 +200%、週五特殊寶箱與限定造型。',hpScale:.85,attackScale:.7,rewardScale:3,xpScale:1.1,slackChance:.48,bossSkipChance:.55},
 WEEKEND_DUNGEON
]);
export function dailyDungeonFor(now=Date.now()){return DAILY_DUNGEONS[weekdayTaiwan(now)];}
export const FRIDAY_BOSS_NOTE=Object.freeze({headline:'下班去',message:'下週一再戰',signature:'— 魔王（已經打卡）'});
export const GAME_SKILLS=Object.freeze([
 {id:'burst',name:'⚡ 爆肝連擊',cooldown:4,description:'下次攻擊造成 2 倍傷害'},
 {id:'guard',name:'🛡️ 摸魚防護',cooldown:5,description:'本次反擊傷害減半'},
 {id:'drain',name:'☕ 咖啡續命',cooldown:6,description:'攻擊時恢復 25 生命'}
]);
const LOOP_IDS=['paper-gremlin','coffee-mimic','chair-golem','meeting-ghost','deadline-clock','keyboard-piranha'];
export function loopEnemyFor(wave,mode='campaign',now=Date.now()){
 const n=Math.max(1,Math.floor(Number(wave)||1));
 const daily=mode==='dungeon'?dailyDungeonFor(now):null;
 // Six approved normal-monster animation sets are temporarily shared by
 // ordinary, stand-in elite and stand-in boss stages. Do not claim new boss art.
 const id=LOOP_IDS[(n-1+(daily?daily.weekday*2:0))%LOOP_IDS.length];
 const design=ALL_ENEMIES.find(x=>x.id===id)||ALL_ENEMIES[0];
 const tier=daily?(n%4===3?'elite':n%4===0?'boss':'normal'):'normal';
 const multiplier=(tier==='elite'?1.65:tier==='boss'?2.65:1);
 const hp=Math.max(12,Math.round((45+n*9)*(mode==='tower'?1.15:daily?daily.hpScale:1)*multiplier));
 const atk=Math.max(1,Math.round((3+Math.floor(n/4)+(mode==='tower'?2:0))*(daily?.attackScale||1)*(tier==='boss'?1.5:tier==='elite'?1.2:1)));
 const prefix=daily?(daily.weekend?(tier==='boss'?'週末代理 AI・':tier==='elite'?'臨時升職機兵・':'無人值班・'):(tier==='boss'?(daily.weekday===5?'我只想下班・':'代班魔王・'):tier==='elite'?(daily.weekday===5?'摸魚菁英・':'代班菁英・'):'')):'';
 return {id:n,typeId:design.id,tier,boss:tier==='boss',elite:tier==='elite',name:prefix+design.name,icon:design.icon,
  family:design.family,faction:design.faction,sprite:design.sprite||null,shape:design.shape||null,
  accent:design.accent,trait:design.trait,traitText:design.traitText,
  hp,maxHp:hp,turns:0,attack:atk,dungeonId:daily?.id||null,standIn:!!daily&&tier!=='normal'};
}
export const STORAGE_KEY='salary-hero-v19-save-1';
export function todayTW(now=Date.now()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
 return [parts.year,parts.month,parts.day].join('-');
}
/** Sat and Sun share one period key: the Saturday Taiwan-local date. */
export function dungeonPeriodKey(now=Date.now()){
 const day=todayTW(now);
 return weekdayTaiwan(now)===0?new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10):day;
}
export function enemyFor(wave){
 const n=Math.max(1,Math.floor(Number(wave)||1)),design=enemyDesignFor(n);
 const tier=tierForWave(n),boss=tier==='boss',elite=tier==='elite',scale=Math.floor((n-1)/4);
 const maxHp=boss?175+scale*75:elite?Math.round((44+n*10)*1.65):44+n*10;
 return {id:n,typeId:design.id,tier,boss,elite,name:design.name,icon:design.icon,family:design.family,faction:design.faction,
   sprite:design.sprite||null,shape:design.shape||null,accent:design.accent,trait:design.trait,traitText:design.traitText,
   hp:maxHp,maxHp,turns:0,attack:boss?10+scale*2:elite?7+Math.floor(n/3):3+Math.floor(n/3)};
}
export function initial(){
 return {version:19,level:1,xp:0,wave:1,cleared:0,gold:0,gems:0,heroHp:110,maxHp:110,baseMaxHp:110,
   playerName:'',styleWishlist:[],defeatedTypes:[],activeMode:'campaign',modeWaves:{campaign:1,tower:1,dungeon:1},skillCooldowns:{burst:0,guard:0,drain:0},dailyDungeonDay:todayTW(),dailyDungeonKey:dungeonPeriodKey(),fridayBossRolls:{},fridayNote:null,weekendChaosRolls:{},weekendChaosEvent:null,weekendChaosHistory:[],weeklyDungeonClaims:[],weeklyDungeonProgress:{week:taiwanWeekKey(),completed:[]},specialChests:0,skillBooks:0,skillFragments:0,skillRank:0,petXp:0,petFood:0,petLevel:1,craftingMaterial:0,rareMaterials:0,forgeLevel:0,
   skinTickets:0,ownedSkins:['starter'],activeSkin:'starter',skinDraws:0,skinHistory:[],
   activityDaily:{day:'',wins:0,bosses:0},activityClaims:[],equipped:'briefcase',owned:['briefcase'],liteInventory:[],liteLoadout:{weapon:null,armor:null,badge:null,relic:null},liteItemSeq:0,liteCombo:0,liteAutoEquip:false,liteAutoStrategy:'balanced',liteLastSeenAt:0,liteOfflineReport:null,liteActiveBuild:'none',liteBuildProgress:{clockout:0,coffee:0},liteBuildBranch:{clockout:'rush',coffee:'heal'},liteToxinStacks:0,liteToxinKey:'',liteMarks:0,liteSkillUses:{burst:0,guard:0,drain:0},liteSkillPaths:{burst:null,guard:null,drain:null},litePresets:[null,null],potions:2,chests:0,pendingDrops:[],enemy:loopEnemyFor(1),
   auto:true,speed:1,encounterDay:'',encounterPending:null,encounterHistory:[],autoEncounter:false,log:['勇者甦醒，開始第一場冒險。'],last:null};
}
export function normalize(raw,now=Date.now()){
 const fresh=initial();if(!raw||typeof raw!=='object'||raw.version!==19)return fresh;
 const n={...fresh,...raw};
 n.playerName=cleanPlayerName(raw.playerName);
 n.activeMode=GAME_MODES.some(m=>m.id===raw.activeMode)?raw.activeMode:'campaign';
 n.modeWaves=Object.fromEntries(GAME_MODES.map(m=>[m.id,Math.max(1,Math.min(100000,Math.floor(Number(raw.modeWaves?.[m.id])|| (m.id===n.activeMode?Number(raw.wave)||1:1))))]));
 const today=todayTW(now);
 const period=dungeonPeriodKey(now);
 // Old saves only carried a date; Sunday must not wipe Saturday's progress.
 const previousPeriod=raw.dailyDungeonKey||((weekdayTaiwan(now)===0&&[period,today].includes(raw.dailyDungeonDay))?period:raw.dailyDungeonDay);
 const dungeonDayChanged=previousPeriod!==period;
 n.dailyDungeonDay=today;n.dailyDungeonKey=period;
 if(dungeonDayChanged)n.modeWaves.dungeon=1;
 n.weekendChaosRolls=dungeonDayChanged?{}:Object.fromEntries(Object.entries(raw.weekendChaosRolls||{}).filter(([k,v])=>k.startsWith(period+':')&&!!weekendChaosById(v)).slice(-120));
 n.weekendChaosEvent=!dungeonDayChanged&&raw.weekendChaosEvent?.period===period&&raw.weekendChaosEvent?.floor===n.modeWaves.dungeon&&weekendChaosById(raw.weekendChaosEvent.id)?raw.weekendChaosEvent:null;
 n.weekendChaosHistory=dungeonDayChanged?[]:(Array.isArray(raw.weekendChaosHistory)?raw.weekendChaosHistory.filter(x=>x&&x.period===period&&weekendChaosById(x.id)).slice(0,20):[]);
 n.fridayBossRolls=dungeonDayChanged?{}:Object.fromEntries(Object.entries(raw.fridayBossRolls||{}).filter(([k,v])=>k.startsWith(today+':')&&(v===true||v===false)).slice(-32));
 n.fridayNote=raw.fridayNote&&raw.fridayNote.day===today?raw.fridayNote:null;
 n.weeklyDungeonClaims=[...new Set((Array.isArray(raw.weeklyDungeonClaims)?raw.weeklyDungeonClaims:[]).filter(x=>typeof x==='string'&&x.length<=50))].slice(-60);
 const week=taiwanWeekKey(now);
 n.weeklyDungeonProgress={week,completed:raw.weeklyDungeonProgress?.week===week?[...new Set((Array.isArray(raw.weeklyDungeonProgress.completed)?raw.weeklyDungeonProgress.completed:[]).filter(id=>new Set(DAILY_DUNGEONS.map(x=>x.id)).has(id)))]:[]};
 n.wave=n.modeWaves[n.activeMode];
 n.skillCooldowns=Object.fromEntries(GAME_SKILLS.map(k=>[k.id,Math.max(0,Math.min(k.cooldown+1,Math.floor(Number(raw.skillCooldowns?.[k.id])||0)))]));
 n.styleWishlist=[...new Set((Array.isArray(raw.styleWishlist)?raw.styleWishlist:[]).filter(id=>HERO_STYLES.some(s=>s.id===id)))];
 n.defeatedTypes=[...new Set((Array.isArray(raw.defeatedTypes)?raw.defeatedTypes:[]).filter(id=>ALL_ENEMIES.some(s=>s.id===id)))];
 n.ownedSkins=[...new Set(['starter',...(Array.isArray(raw.ownedSkins)?raw.ownedSkins:[]).filter(id=>SKINS.some(s=>s.id===id))])];
 n.activeSkin=n.ownedSkins.includes(raw.activeSkin)?raw.activeSkin:'starter';
 n.skinTickets=Math.max(0,Math.floor(Number(raw.skinTickets)||0));
 n.skinDraws=Math.max(0,Math.floor(Number(raw.skinDraws)||0));
 n.skinHistory=Array.isArray(raw.skinHistory)?raw.skinHistory.filter(x=>x&&skinById(x.id)).slice(0,60):[];
 n.activityClaims=[...new Set((Array.isArray(raw.activityClaims)?raw.activityClaims:[]).filter(x=>typeof x==='string'&&x.length<90))].slice(-104);
 n.activityDaily=raw.activityDaily&&typeof raw.activityDaily==='object'
   ?{day:String(raw.activityDaily.day||''),wins:Math.max(0,Math.floor(Number(raw.activityDaily.wins)||0)),bosses:Math.max(0,Math.floor(Number(raw.activityDaily.bosses)||0))}
   :{day:'',wins:0,bosses:0};
 n.owned=[...new Set((Array.isArray(raw.owned)?raw.owned:[]).filter(x=>ITEMS.some(it=>it.id===x)).concat('briefcase'))];
 n.equipped=n.owned.includes(raw.equipped)?raw.equipped:'briefcase';
 // Additive V19 Lite schema: migrate existing saves without replacing legacy items.
 n.liteInventory=liteNormalizeInventory(raw.liteInventory);
 n.liteLoadout=liteNormalizeLoadout(raw.liteLoadout,n.liteInventory);
 n.liteItemSeq=Math.max(...n.liteInventory.map(x=>Number(x.instanceId.slice(3))||0),Math.max(0,Math.floor(Number(raw.liteItemSeq)||0)));
 n.liteCombo=Math.max(0,Math.min(100000,Math.floor(Number(raw.liteCombo)||0)));
 n.liteActiveBuild=liteBuildById(raw.liteActiveBuild)?.id||'none';
 n.liteBuildProgress=liteBuildProgress(raw.liteBuildProgress);
 n.liteBuildBranch=liteBuildBranch(raw.liteBuildBranch);
 n.liteMarks=n.liteActiveBuild==='clockout'&&Number.isFinite(Number(raw.liteMarks))?Math.max(0,Math.min(3,Math.floor(Number(raw.liteMarks)))):0;
 n.liteSkillUses=liteSkillUses(raw.liteSkillUses);
 n.liteSkillPaths=liteSkillPaths(raw.liteSkillPaths);
 n.litePresets=liteNormalizePresets(raw.litePresets,n.liteInventory);
 n.liteToxinKey=typeof raw.liteToxinKey==='string'?raw.liteToxinKey.slice(0,35):'';
 n.liteToxinStacks=n.liteToxinKey===n.activeMode+':'+n.wave?Math.max(0,Math.min(5,Math.floor(Number(raw.liteToxinStacks)||0))):0;
 n.liteAutoEquip=raw.liteAutoEquip===true;
 n.liteAutoStrategy=LITE_STRATEGIES.some(x=>x.id===raw.liteAutoStrategy)?raw.liteAutoStrategy:'balanced';
 n.liteLastSeenAt=Number.isFinite(Number(raw.liteLastSeenAt))&&Number(raw.liteLastSeenAt)>0?Math.floor(Number(raw.liteLastSeenAt)):now;
 n.liteOfflineReport=raw.liteOfflineReport&&typeof raw.liteOfflineReport==='object'&&Number.isFinite(raw.liteOfflineReport.gold)?{
   minutes:Math.max(0,Math.floor(Number(raw.liteOfflineReport.minutes)||0)),
   gold:Math.max(0,Math.floor(Number(raw.liteOfflineReport.gold)||0)),
   xp:Math.max(0,Math.floor(Number(raw.liteOfflineReport.xp)||0)),
   items:Math.max(0,Math.min(6,Math.floor(Number(raw.liteOfflineReport.items)||0)))
 }:null;
 n.level=Math.max(1,Math.min(500,Math.floor(Number(n.level)||1)));
 for(const k of ['xp','gold','gems','potions','chests','specialChests','skillBooks','skillFragments','petXp','petFood','craftingMaterial','rareMaterials','cleared','wave'])n[k]=Math.max(k==='wave'?1:0,Math.floor(Number(n[k])||0));
 n.skillRank=Math.max(0,Math.min(5,Math.floor(Number(raw.skillRank)||0)));
 n.forgeLevel=Math.max(0,Math.min(10,Math.floor(Number(raw.forgeLevel)||0)));
 n.petLevel=Math.max(1,Math.min(50,Math.floor(Number(raw.petLevel)||1)));
 n.baseMaxHp=Math.max(1,Math.floor(Number(raw.baseMaxHp)||Number(raw.maxHp)||110));
 n.maxHp=n.baseMaxHp+liteEquipmentStats(n).hp;
 n.heroHp=Math.max(0,Math.min(n.maxHp,Number(n.heroHp)||0));
 if(raw.trainingIsolated===true&&raw.enemy&&Number(raw.enemy.hp)>0){
   n.trainingIsolated=true;
   n.wave=Math.max(1,Math.floor(Number(raw.wave)||1));
   n.modeWaves[n.activeMode]=n.wave;
   n.enemy={...enemyFor(n.wave),...raw.enemy};
   n.enemy.hp=Math.min(n.enemy.maxHp,Math.max(1,Number(raw.enemy.hp)||1));
   n.log=Array.isArray(raw.log)?raw.log.slice(0,12):fresh.log;
   n.auto=!!raw.auto;n.speed=raw.speed===2?2:1;
   return n;
 }
 const baseEnemy=loopEnemyFor(n.wave,n.activeMode,now);
 n.enemy=(n.activeMode!=='dungeon'||!dungeonDayChanged)&&raw.enemy&&Number(raw.enemy.id)===n.wave&&raw.enemy.typeId===baseEnemy.typeId&&Number(raw.enemy.hp)>0
   ?{...baseEnemy,hp:Math.min(baseEnemy.maxHp,Number(raw.enemy.hp)),turns:Math.max(0,Math.floor(Number(raw.enemy.turns)||0))}
   :baseEnemy;
 n.pendingDrops=Array.isArray(raw.pendingDrops)?raw.pendingDrops.filter(x=>ITEMS.some(it=>it.id===x)).slice(0,20):[];
 n.encounterHistory=Array.isArray(raw.encounterHistory)?raw.encounterHistory.slice(0,80):[];
 n.autoEncounter=raw.autoEncounter===true;
 n.log=Array.isArray(raw.log)?raw.log.slice(0,12):fresh.log;
 n.auto=!!raw.auto;n.speed=raw.speed===2?2:1;
 return n;
}
function markWeeklyDungeonClear(s,now){
 if(s.trainingIsolated||s.activeMode!=='dungeon')return;
 const id=dailyDungeonFor(now).id,week=taiwanWeekKey(now);
 if(s.weeklyDungeonProgress?.week!==week)s.weeklyDungeonProgress={week,completed:[]};
 if(!s.weeklyDungeonProgress.completed.includes(id)){
   s.weeklyDungeonProgress.completed.push(id);
   notice(s,'📅 本週社畜生存挑戰 +1：'+s.weeklyDungeonProgress.completed.length+'/6 個副本通關。');
 }
}
/** Each weekend floor gets one persisted, non-farmable chaos draw.
 * Event effects apply on entering the floor; the empty-office event
 * grants a small victory without combat, but never skips a boss floor.
 */
function maybeWeekendChaos(s,rng,now){
 const daily=s.activeMode==='dungeon'&&!s.trainingIsolated?dailyDungeonFor(now):null;
 if(!daily?.weekend)return null;
 const period=dungeonPeriodKey(now),key=period+':'+s.wave;
 if(Object.prototype.hasOwnProperty.call(s.weekendChaosRolls,key)){
   const id=s.weekendChaosRolls[key];
   if(!s.weekendChaosEvent||s.weekendChaosEvent.floor!==s.wave)
     s.weekendChaosEvent={id,period,floor:s.wave};
   return null;
 }
 let event=weekendChaosDraw(rng());
 // Real/placeholder boss battle stays playable; no free boss skip on weekends.
 if(event.id==='empty'&&s.enemy.boss)event=weekendChaosById('rogue-ai');
 const floor=s.wave;
 const rec={id:event.id,period,floor};
 s.weekendChaosRolls[key]=event.id;s.weekendChaosEvent=rec;
 s.weekendChaosHistory=[{...rec,day:todayTW(now)},...(s.weekendChaosHistory||[])].slice(0,20);
 notice(s,event.icon+' '+event.name+'：'+event.story);
 if(event.id==='empty'){
   const gold=Math.round((12+floor*4)*daily.rewardScale);
   const xp=Math.round((12+floor*2)*daily.xpScale);
   s.gold+=gold;s.cleared++;awardXP(s,xp);
   const day=todayTW(now);
   if(s.activityDaily.day!==day)s.activityDaily={day,wins:0,bosses:0};
   s.activityDaily.wins++;
   s.wave++;s.modeWaves.dungeon=s.wave;
   s.enemy=loopEnemyFor(s.wave,'dungeon',now);s.weekendChaosEvent=null;
   notice(s,'🪑 第 '+floor+' 樓全員下班，直接過關！金幣 +'+gold+'、EXP +'+xp+'。');
   return {...rec,name:event.name,icon:event.icon,story:event.story,gold,xp,skipped:true};
 }
 if(event.id==='coffee'){
   const restored=Math.min(s.maxHp-s.heroHp,45);
   s.heroHp+=restored;s.potions++;
   notice(s,'☕ 自動販賣機白送咖啡：恢復 '+restored+' HP、藥水 +1！');
 }
 return {...rec,name:event.name,icon:event.icon,story:event.story,skipped:false};
}
/** At Friday's boss gate there is a one-time 55% absentee roll per gate.
 * Absence counts as a clear and pays the ordinary boss reward without fighting.
 * Uses injected RNG and time so it is reproducible in tests.
 */
function maybeFridayBossEscaped(s,rng,now){
 if(s.trainingIsolated||s.activeMode!=='dungeon'||weekdayTaiwan(now)!==5||s.wave%4!==0)return null;
 const key=todayTW(now)+':'+s.wave;
 if(Object.prototype.hasOwnProperty.call(s.fridayBossRolls,key))return null;
 const gone=Number(rng())<dailyDungeonFor(now).bossSkipChance;
 s.fridayBossRolls[key]=gone;
 if(!gone){notice(s,'👑 魔王今天居然沒溜！牠一邊看手錶一邊準備應戰。');return null;}
 const skippedFloor=s.wave;
 const reward=Math.round((70+skippedFloor*9)*dailyDungeonFor(now).rewardScale);
 const xp=Math.round(75*dailyDungeonFor(now).xpScale);
 s.gold+=reward;s.cleared++;awardXP(s,xp);
 s.gems+=2;s.chests++;s.skinTickets++;s.specialChests++;s.heroHp=s.maxHp;
 const day=todayTW(now);
 if(s.activityDaily.day!==day)s.activityDaily={day,wins:0,bosses:0};
 s.activityDaily.wins++;s.activityDaily.bosses++;
 markWeeklyDungeonClear(s,now);
 lootRoll(s,rng,true,now);
 const note={...FRIDAY_BOSS_NOTE,day,wave:skippedFloor,gold:reward,xp};
 s.fridayNote=note;
 s.wave++;s.modeWaves.dungeon=s.wave;
 s.enemy=loopEnemyFor(s.wave,'dungeon',now);
 notice(s,'📨 魔王只留下一封信：「下班去，下週一再戰」。你莫名其妙獲勝！+'+reward+' 金幣、+'+xp+' EXP，另有首領戰利品。');
 return note;
}
function notice(s,msg){s.log=[msg,...s.log].slice(0,12);}
function recalcLiteHp(s){
 const previous=s.maxHp;
 s.maxHp=s.baseMaxHp+liteEquipmentStats(s).hp;
 s.heroHp=Math.min(s.maxHp,Math.max(0,s.heroHp+Math.max(0,s.maxHp-previous)));
}
function awardXP(s,amount){
 s.xp+=amount;
 while(s.xp>=50+s.level*30){s.xp-=50+s.level*30;s.level++;s.baseMaxHp+=9;s.maxHp+=9;s.heroHp=Math.min(s.maxHp,s.heroHp+22);notice(s,'✨ 升到 Lv.'+s.level+'，生命上限增加！');}
}
function awardPetXP(s,amount){
 s.petXp+=amount;
 while(s.petLevel<50&&s.petXp>=50+s.petLevel*30){
   s.petXp-=50+s.petLevel*30;s.petLevel++;
   notice(s,'🐾 寵物升到 Lv.'+s.petLevel+'，支援攻擊提升！');
 }
}
function lootRoll(s,rng,guaranteed=false,now=Date.now()){
 const mondayRare=s.activeMode==='dungeon'&&!s.trainingIsolated&&weekdayTaiwan(now)===1;
 const chance=Math.max(0,Math.min(0.999999,Number(rng())||0));
 if(guaranteed || chance<(mondayRare?.48:.23) || s.cleared%4===0){
   // Monday boosts both the total drop rate and the chance of truly rare tiers.
   const id=s.cleared>=16&&chance<(mondayRare?.06:.025)?'excalibur':s.cleared>=6&&chance<(mondayRare?.22:.10)?'notice':'laptop';
   s.pendingDrops.push(id);notice(s,'🎁 敵人掉落 '+ITEMS.find(it=>it.id===id).name+'！');
 }
}
export function transition(raw,action,rng=Math.random,now=Date.now()){
 const s=normalize(raw,now),a=typeof action==='string'?{type:action}:action||{},item=ITEMS.find(it=>it.id===a.id);
 s.last=null;
 switch(a.type){
 case 'setName':{
   const nickname=cleanPlayerName(a.value);
   if(!nickname){notice(s,'請輸入 1–12 個字的遊戲名稱。');break;}
   s.playerName=nickname;s.last={type:'rename',name:nickname};
   notice(s,'📛 角色名稱已更新：'+playerTitle(s));break;
 }
 case 'toggleFavoriteStyle':{
   const style=HERO_STYLES.find(x=>x.id===a.id);
   if(!style)break;
   if(s.styleWishlist.includes(style.id)){
     s.styleWishlist=s.styleWishlist.filter(id=>id!==style.id);
     notice(s,'已從造型願望清單移除：'+style.name);
   }else{
     s.styleWishlist.push(style.id);
     notice(s,'⭐ 已收藏造型概念：'+style.name);
   }
   s.last={type:'favoriteStyle',id:style.id};break;
 }
 case 'equipSkin':{
   const skin=skinById(a.id);
   if(!skin||!s.ownedSkins.includes(skin.id)){notice(s,'🔒 尚未取得這個造型，無法裝備。');break;}
   s.activeSkin=skin.id;s.last={type:'skinEquipped',id:skin.id};
   notice(s,'🎭 已選用造型：'+skin.name+'（正式角色動畫仍待製作）');break;
 }
 case 'drawSkin':{
   const pool=drawPool(s.ownedSkins);
   if(s.skinTickets<1){notice(s,'🎟️ 抽獎券不足：挑戰首領或完成每日奇遇取得。');break;}
   if(!pool.length){notice(s,'🏅 可抽取造型已全部收齊，不扣抽獎券。');break;}
   const skin=pickSkin(pool,rng);
   if(!skin)break;
   s.skinTickets--;s.skinDraws++;
   s.ownedSkins.push(skin.id);
   s.skinHistory.unshift({id:skin.id,source:'draw',at:new Date(now).toISOString()});
   s.skinHistory=s.skinHistory.slice(0,60);
   s.last={type:'skinDraw',id:skin.id,rarity:skin.rarity};
   notice(s,'🎊 抽到新造型：'+skin.name+'！已加入衣櫃。');break;
 }
 case 'claimSkinEvent':{
   const event=SKIN_EVENTS.find(x=>x.id===a.id);
   const weekday=weekdayTaiwan(now),day=todayTW(now),week=taiwanWeekKey(now);
   if(!event||weekday!==event.weekday){notice(s,'目前不是這項活動的開放日期。');break;}
   const key=event.id+':'+week;
   if(s.activityClaims.includes(key)){notice(s,'本週活動獎勵已領取。');break;}
   if(s.activityDaily.day!==day||s.activityDaily.wins<event.requiredWins){
      notice(s,'還沒有達成本日活動目標。');break;
   }
   s.activityClaims.push(key);
   const skin=skinById(event.skinId);
   if(s.ownedSkins.includes(skin.id)){
      s.skinTickets++;s.last={type:'eventTicket',id:event.id};
      notice(s,'🎟️ 本週活動完成：重複造型改領 1 張造型券。');
   }else{
      s.ownedSkins.push(skin.id);
      s.skinHistory.unshift({id:skin.id,source:'event',at:new Date(now).toISOString()});
      s.skinHistory=s.skinHistory.slice(0,60);
      s.last={type:'skinEvent',id:skin.id};
      notice(s,'🎉 活動解鎖造型：'+skin.name+'！');
   }
   break;
 }
 case 'mode':{
   if(!GAME_MODES.some(m=>m.id===a.id))break;
   if(a.id===s.activeMode)break;
   s.modeWaves[s.activeMode]=s.wave;
   s.activeMode=a.id;s.wave=s.modeWaves[a.id];
   s.liteToxinKey=a.id+':'+s.wave;s.liteToxinStacks=0;s.liteMarks=0;
   s.enemy=loopEnemyFor(s.wave,a.id,now);
   s.heroHp=s.maxHp;
   notice(s,'🗺️ 切換至 '+GAME_MODES.find(m=>m.id===a.id).name+'，進度獨立保存。');
   const fridayNote=maybeFridayBossEscaped(s,rng,now);
   const weekendEvent=maybeWeekendChaos(s,rng,now);
   s.last={type:'mode',id:a.id,fridayNote,weekendEvent};break;
 }
 case 'refreshDungeon':{
   if(s.trainingIsolated)break;
   // normalize() above performs the Taiwan-local daily rollover and preserves
   // permanent campaign / tower / inventory progression.
   const weekendEvent=maybeWeekendChaos(s,rng,now);
   s.last={type:'dungeonRefresh',day:s.dailyDungeonDay,weekendEvent};
   break;
 }
 case 'claimWeeklySurvivor':{
   const week=taiwanWeekKey(now),key='weekly-survivor:'+week;
   if(s.trainingIsolated||s.weeklyDungeonProgress?.week!==week||s.weeklyDungeonProgress.completed.length<6){notice(s,'📅 需完成本週六大副本各一次四關循環才能領獎。');break;}
   if(s.weeklyDungeonClaims.includes(key)){notice(s,'📅 本週豪華生存寶箱已領取。');break;}
   s.weeklyDungeonClaims.push(key);s.gold+=300;s.gems+=5;s.skinTickets+=2;s.specialChests++;
   s.last={type:'weeklySurvivor',week};notice(s,'🏆 完成六大副本！獲得金幣 300、寶石 5、造型券 2、特殊副本寶箱 1。');break;
 }
 case 'feedPet':{
   if(s.petFood<=0){notice(s,'🐾 目前沒有寵物食物。');break;}
   s.petFood--;awardPetXP(s,45);s.last={type:'petFed'};
   notice(s,'🐾 餵食寵物，獲得 45 寵物經驗！');break;
 }
 case 'liteChooseSkillPath':{
   const skill=liteSkillById(a.skill),branch=skill?.choices.find(x=>x.id===a.id);
   if(!skill||!branch||s.trainingIsolated||(s.liteSkillUses[skill.id]||0)<LITE_SKILL_UNLOCK_USES){
     notice(s,'技能變形尚未解鎖，先使用該技能累積熟練度。');break;
   }
   s.liteSkillPaths[skill.id]=branch.id;
   s.last={type:'liteSkillPath',skill:skill.id,branch:branch.id};
   notice(s,'✨ '+skill.name+' 已切換變形：「'+branch.name+'」。');break;
 }
 case 'liteSavePreset':{
   const index=Number(a.index),snapshot=liteSavePresetSnapshot(s,index);
   if(!snapshot||s.trainingIsolated){notice(s,'請先選擇流派，才能保存快速配裝。');break;}
   s.litePresets[index]=snapshot;
   s.last={type:'liteSavePreset',index};notice(s,'📋 已保存 '+snapshot.name+'，包含流派、裝備和技能變形。');break;
 }
 case 'liteLoadPreset':{
   const index=Number(a.index),snapshot=s.trainingIsolated?null:liteApplyPreset(s,index);
   if(!snapshot){notice(s,'這一格尚未保存配裝。');break;}
   recalcLiteHp(s);
   s.last={type:'liteLoadPreset',index};notice(s,'📋 已切換 '+snapshot.name+'，未獲得的裝備不會被憑空生成。');break;
 }
 case 'liteChooseBuild':{
   const build=liteBuildById(a.id);if(!build||s.trainingIsolated)break;
   if(s.liteActiveBuild===build.id){notice(s,'目前已使用 '+build.name+' 流派。');break;}
   s.liteActiveBuild=build.id;s.liteCombo=0;s.liteToxinStacks=0;s.liteMarks=0;
   s.liteToxinKey=s.activeMode+':'+s.wave;
   s.last={type:'liteBuild',id:build.id};
   notice(s,'🏵️ 已切換至 '+build.name+'！各流派的熟練度會獨立永久保存。');break;
 }
 case 'liteChooseBranch':{
   const build=liteBuildById(s.liteActiveBuild);
   if(!build||s.trainingIsolated||liteMasteryRank(s.liteBuildProgress[build.id])<1||!build.options.some(x=>x.id===a.id)){
     notice(s,'此專精路線尚未解鎖。');break;
   }
   s.liteBuildBranch[build.id]=a.id;
   s.last={type:'liteBranch',build:build.id,branch:a.id};
   notice(s,'✦ '+build.name+' 已改用「'+build.options.find(x=>x.id===a.id).name+'」。');break;
 }
 case 'liteEquip':{
   const it=s.liteInventory.find(x=>x.instanceId===a.id),base=liteBase(it?.templateId);
   if(!it||!base)break;
   s.liteLoadout[base.slot]=it.instanceId;recalcLiteHp(s);
   s.last={type:'liteEquip',id:it.instanceId};notice(s,'🛡️ 已穿上 '+liteRarity(it.rarity).name+'・'+base.name);break;
 }
 case 'liteUnequip':{
   const slot=LITE_SLOTS.find(x=>x.id===a.id);if(!slot||!s.liteLoadout[slot.id])break;
   s.liteLoadout[slot.id]=null;recalcLiteHp(s);
   s.last={type:'liteUnequip',slot:slot.id};notice(s,'已卸下 '+slot.name);break;
 }
 case 'liteLock':{
   const it=s.liteInventory.find(x=>x.instanceId===a.id);if(!it)break;
   it.locked=!it.locked;s.last={type:'liteLock',id:it.instanceId,locked:it.locked};
   notice(s,it.locked?'🔒 裝備已鎖定。':'🔓 裝備已解鎖。');break;
 }
 case 'liteSalvage':{
   const index=s.liteInventory.findIndex(x=>x.instanceId===a.id);if(index<0)break;
   const it=s.liteInventory[index];
   if(it.locked||Object.values(s.liteLoadout).includes(it.instanceId)){
     notice(s,'裝備已鎖定或正在使用，無法分解。');break;
   }
   const reward=Math.floor((8+it.itemLevel*2)*liteRarity(it.rarity).scale);
   s.liteInventory.splice(index,1);s.gold+=reward;
   s.last={type:'liteSalvage',id:a.id,gold:reward};
   notice(s,'⚒️ 分解 '+liteBase(it.templateId).name+'，獲得 '+reward+' 金幣。');break;
 }
 case 'liteSetAuto':{
   s.liteAutoEquip=a.value===true;
   s.last={type:'liteAuto',enabled:s.liteAutoEquip};
   notice(s,s.liteAutoEquip?'🤖 智慧換裝已開啟：只替換有顯著改善的裝備，不分解物品。':'🤖 智慧換裝已關閉。');break;
 }
 case 'liteSetStrategy':{
   if(!LITE_STRATEGIES.some(x=>x.id===a.id))break;
   s.liteAutoStrategy=a.id;s.last={type:'liteStrategy',strategy:a.id};
   notice(s,'🤖 換裝目標：'+LITE_STRATEGIES.find(x=>x.id===a.id).name);break;
 }
 case 'liteAutoOptimize':{
   const oldWeapon=ITEMS.find(it=>it.id===s.equipped)?.attack||12;
   const plan=liteAutoPlan(s,s.liteAutoStrategy,oldWeapon);
   if(plan.changed){s.liteLoadout=plan.loadout;recalcLiteHp(s);
     notice(s,'🤖 已套用 '+LITE_STRATEGIES.find(x=>x.id===plan.strategy).name+' 配裝，套裝與戰力一起評估。');
   }else notice(s,'🤖 目前已是適合此策略的配置，沒有強行換裝。');
   s.last={type:'liteAutoOptimize',changed:plan.changed,strategy:plan.strategy};break;
 }
 case 'liteOffline':{
   // Only a previously recorded timestamp can mint an offline payout.
   const report=liteOfflineEstimate(s,now);
   s.liteLastSeenAt=now;
   if(!report){s.last={type:'liteOffline',credited:false};break;}
   s.gold+=report.gold;awardXP(s,report.xp);
   let items=0;
   let seed=(Math.floor(report.from/60000)^report.minutes^s.wave)>>>0;
   const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   for(let i=0;i<report.itemCount;i++){
     let first=true;
     const rng=()=>{if(first){first=false;return 0;}return random();};
     if(liteRollDrop(s,rng,'normal',false))items++;
   }
   s.liteOfflineReport={minutes:report.minutes,gold:report.gold,xp:report.xp,items};
   s.last={type:'liteOffline',credited:true,...s.liteOfflineReport};
   notice(s,'🌙 離線巡邏 '+report.minutes+' 分鐘：金幣 +'+report.gold+'、EXP +'+report.xp+'、裝備 '+items+' 件。');break;
 }
 case 'liteDismissOffline':{
   s.liteOfflineReport=null;s.last={type:'liteDismissOffline'};break;
 }
 case 'studySkillBook':{
   if(!s.skillBooks||s.skillRank>=5){notice(s,'技能書不足或技能專精已滿。');break;}
   s.skillBooks--;s.skillRank++;s.last={type:'study',rank:s.skillRank};
   notice(s,'📕 技能專精升級！目前 +'+s.skillRank+' 階，主動技能效果提升。');break;
 }
 case 'forge':{
   if(s.forgeLevel>=10||s.craftingMaterial<3||s.rareMaterials<1){
     notice(s,'鍛造需要強化素材 ×3、黎明礦石 ×1（最多 10 階）。');break;
   }
   s.craftingMaterial-=3;s.rareMaterials--;s.forgeLevel++;
   s.last={type:'forge',rank:s.forgeLevel};
   notice(s,'⚒️ 裝備鍛造成 +'+s.forgeLevel+'！每次攻擊額外增加 '+s.forgeLevel*2+' 基礎傷害。');break;
 }
 case 'weekendChest':{
   if(s.specialChests<=0){notice(s,'目前沒有特殊副本寶箱。');break;}
   s.specialChests--;s.gold+=160;s.gems+=2;s.potions++;
   const epic=Number(rng())<.3;
   s.pendingDrops.push(epic?'notice':'laptop');
   s.last={type:'weekendChest',epic};
   notice(s,'🎁 副本特殊寶箱！金幣 +160、寶石 +2、藥水 +1，另獲'+(epic?'史詩':'稀有')+'裝備。');
   break;
 }
 case 'auto':s.auto=!!a.value;notice(s,s.auto?'⚙️ 自動託管開啟':'🛑 已暫停自動戰鬥');break;
 case 'autoEncounter':s.autoEncounter=!!a.value;notice(s,s.autoEncounter?'🗺️ 每日奇遇：智慧託管已開啟':'🗺️ 每日奇遇：已改為手動探索');break;
 case 'speed':s.speed=a.value===2?2:1;notice(s,'戰鬥速度 ×'+s.speed);break;
 case 'skill':
 case 'attack':{
   const firstWeekendEvent=maybeWeekendChaos(s,rng,now);
   if(firstWeekendEvent?.skipped){s.last={type:'weekendEvent',weekendEvent:firstWeekendEvent};break;}
   const skill=a.type==='skill'?GAME_SKILLS.find(k=>k.id===a.id):null;
   if(a.type==='skill'&&(!skill||s.skillCooldowns[skill.id]>0)){notice(s,'技能尚未準備好。');break;}
   const weapon=ITEMS.find(it=>it.id===s.equipped)||ITEMS[0];
   const liteStats=liteEquipmentStats(s);
   const liteSpecialist=liteBuildStats(s);
   const legend=liteLegendaryEffects(s);
   const skillMods=liteSkillCastBonus(s,skill?.id);
   const currentDungeon=s.activeMode==='dungeon'&&!s.trainingIsolated?dailyDungeonFor(now):null;
   const wednesdayRage=currentDungeon?.weekday===3&&s.heroHp<s.maxHp*.5;
   const crit=Number(rng())<Math.min(.75,.16+liteStats.crit+liteSpecialist.crit+legend.crit+skillMods.crit+(wednesdayRage?.25:0));
   const attackValue=(liteStats.weaponAttack||weapon.attack)+liteStats.attack;
   const baseDamage=Math.round((attackValue+4+s.level*2+s.forgeLevel*2+s.petLevel-1)*(crit?1.7:1)*legend.attackMultiplier);
   const boosted=skill?.id==='burst'?Math.round(baseDamage*(2+s.skillRank*.15)*skillMods.damageMultiplier):Math.round(baseDamage*skillMods.damageMultiplier);
   let damage=s.enemy.trait==='guard'?Math.max(1,Math.round(boosted*.75)):boosted;
   s.liteCombo++;
   const specialistHit=liteBuildHit(s,damage,s.enemy,s.liteCombo);
   const tactical=liteTacticalHit(s,{
     skill:skill?.id||null,crit,buildProc:specialistHit.proc,
     damage,enemyTier:s.enemy.tier
   });
   if(liteSpecialist.id==='clockout')specialistHit.extra=Math.ceil(specialistHit.extra*legend.clockoutMultiplier);
   if(liteSpecialist.id==='coffee'){
     specialistHit.extra=Math.ceil(specialistHit.extra*legend.coffeePoisonMultiplier);
     specialistHit.poison=specialistHit.extra;
     if(specialistHit.heal)specialistHit.heal+=legend.coffeeBonusHeal;
   }
   s.liteMarks=tactical.marks;
   if(liteSpecialist.id==='coffee'){
     s.liteToxinKey=s.activeMode+':'+s.wave;
     s.liteToxinStacks=tactical.stacks;
   }else s.liteToxinStacks=0;
   damage+=specialistHit.extra+tactical.extra;
   if(tactical.heal)s.heroHp=Math.min(s.maxHp,s.heroHp+tactical.heal);
   if(tactical.spent)notice(s,'⚡ 超時結算！消耗 '+tactical.spent+' 打卡印記，額外斬擊 '+tactical.extra+'！');
   if(tactical.extracted)notice(s,'☕ 咖啡萃取！消耗 '+tactical.extracted+' 毒素，額外傷害 '+tactical.extra+'、回復 '+tactical.heal+'！');
   if(specialistHit.heal)s.heroHp=Math.min(s.maxHp,s.heroHp+specialistHit.heal);
   if(specialistHit.proc){
     notice(s,liteSpecialist.id==='coffee'?'☕ 續杯本能：恢復 '+specialistHit.heal+' HP。':'⚡ 打卡專精：追加 '+specialistHit.extra+' 傷害！');
   }
   if(specialistHit.poison)notice(s,'☕ 黑咖啡毒素 ×'+specialistHit.stacks+'：腐蝕 '+specialistHit.poison+' 傷害！');
   const finisher=liteStats.clockout&&s.liteCombo%5===0;
   const coffeeHeal=liteStats.coffee&&s.liteCombo%4===0;
   if(finisher){const extra=Math.max(3,Math.round(damage*.6*legend.clockoutMultiplier));damage+=extra;
     notice(s,'⚡ 準時下班協定：收工斬 +'+extra+'！');}
   if(coffeeHeal){s.heroHp=Math.min(s.maxHp,s.heroHp+15);
     notice(s,'☕ 咖啡續命：恢復 15 生命！');}
   for(const key of GAME_SKILLS)s.skillCooldowns[key.id]=Math.max(0,s.skillCooldowns[key.id]-1);
   if(skill){
     s.skillCooldowns[skill.id]=Math.max(1,skill.cooldown+skillMods.cooldownOffset);
     const trained=liteSkillGrantUse(s,skill.id);
     if(trained?.unlocked)notice(s,'📕 '+skill.name+' 已使用六次，解鎖技能變形二選一！');
   }
   if(specialistHit.cooldownReduction)s.skillCooldowns.burst=Math.max(0,s.skillCooldowns.burst-specialistHit.cooldownReduction);
   if(skill?.id==='drain')s.heroHp=Math.min(s.maxHp,s.heroHp+Math.max(1,25+s.skillRank*5+skillMods.drainHeal));
   const enemyHpBefore=s.enemy.hp;
   s.enemy.hp=Math.max(0,s.enemy.hp-damage);
   const lifeSteal=Math.floor(Math.min(damage,enemyHpBefore)*Math.min(.35,liteStats.lifeSteal+liteSpecialist.lifeSteal));
   if(lifeSteal)s.heroHp=Math.min(s.maxHp,s.heroHp+lifeSteal);
   s.last={type:'hit',damage,crit,boss:s.enemy.boss,skill:skill?.id||null,skillPath:skillMods.choice,lifeSteal,finisher,coffeeHeal,
     tacticalExtra:tactical.extra,tacticalHeal:tactical.heal,tacticalSpent:tactical.spent,tacticalExtracted:tactical.extracted,tacticalStun:tactical.skipRetaliation,
     liteBuild:liteSpecialist.id,buildProc:specialistHit.proc,buildDamage:specialistHit.extra,
     poisonDamage:specialistHit.poison,buildHeal:specialistHit.heal};
   notice(s,(wednesdayRage?'🫠 厭世崩潰・暴擊率上升！ ':'')+(crit?'⚡ 暴擊！':'⚔️ 攻擊！')+'對 '+s.enemy.name+' 造成 '+damage+' 傷害');
   if(s.enemy.hp===0){
     const dead=s.enemy,boss=dead.boss,elite=dead.tier==='elite';
     const baseReward=boss?70+s.wave*9:elite?36+s.wave*7:12+s.wave*4;
     const dungeon=s.activeMode==='dungeon'&&!s.trainingIsolated?dailyDungeonFor(now):null;
     const activeChaos=dungeon?.weekend&&s.weekendChaosEvent?.floor===s.wave?weekendChaosById(s.weekendChaosEvent.id):null;
     const reward=Math.round(baseReward*(dungeon?.rewardScale||1)*(activeChaos?.id==='goldrush'?2:1));
     if(!s.defeatedTypes.includes(dead.typeId))s.defeatedTypes.push(dead.typeId);
     s.gold+=reward;s.cleared++;
     const mastery=liteGrantMastery(s,dead.tier);
     if(mastery?.rankUp)notice(s,'🏵️ 流派熟練度升階！'+liteBuildById(mastery.id).name+' 專精 '+mastery.rank+' 階，解鎖新能力。');
     const earnedXP=boss?75:elite?38+s.wave*4:12+s.wave*2;
     awardXP(s,Math.round(earnedXP*(dungeon?.xpScale||1)));
     if(dungeon?.weekday===4)s.craftingMaterial+=2;
     if(dungeon?.weekday===3)awardPetXP(s,24);
     if(dungeon?.weekday===2&&dead.tier==='normal'&&Number(rng())<.15){
       s.skillFragments++;notice(s,'📄 掉落技能書碎片 1/4！');
       if(s.skillFragments>=4){s.skillFragments-=4;s.skillBooks++;notice(s,'📕 四片碎片自動合成技能書 +1！');}
     }
     if(activeChaos?.id==='rogue-ai'){s.gems++;notice(s,'🤖 代理主管 AI 被打敗，額外獲得 1 顆寶石！');}
     const today=todayTW(now);
     if(s.activityDaily.day!==today)s.activityDaily={day:today,wins:0,bosses:0};
     s.activityDaily.wins++;
     if(boss){
       s.activityDaily.bosses++;
       s.gems+=2;s.chests+=1;s.skinTickets++;
       if(dungeon?.weekday===5){s.specialChests++;notice(s,'🎁 週五越獄寶箱 +1！');}
       if(dungeon?.weekend){s.specialChests++;notice(s,'🎪 週末狂歡寶箱 +1！');}
       if(dungeon?.weekday===4){s.rareMaterials++;notice(s,'🔧 黎明礦石 +1！');}
       if(dungeon?.weekday===1){
         const key='monday-epic:'+todayTW(now);
         if(!s.weeklyDungeonClaims.includes(key)){
           s.weeklyDungeonClaims.push(key);s.pendingDrops.push('notice');
           notice(s,'🔥 厭世星期一首通！保證史詩：黃金離職通知書。');
         }
       }
       s.heroHp=s.maxHp;
       notice(s,'🏆 首領擊敗！生命回滿，獲得寶箱、寶石與 1 張造型券。');
     }
     if(elite){s.gems+=1;notice(s,'💠 菁英擊敗！獲得額外 1 顆寶石，必定掉落裝備。');}
     lootRoll(s,rng,elite,now);
     let liteDrop=null;
     if(!s.trainingIsolated){
       liteDrop=liteRollDrop(s,rng,dead.tier,dungeon?.weekday===1);
       if(liteDrop){const base=liteBase(liteDrop.templateId);
         notice(s,'✨ 新裝備：'+liteRarity(liteDrop.rarity).name+'・'+base.name+'（'+LITE_SLOTS.find(x=>x.id===base.slot).name+'），已放入背包。');
         if(s.liteAutoEquip){
           const legacyAttack=ITEMS.find(it=>it.id===s.equipped)?.attack||12;
           const plan=liteAutoPlan(s,s.liteAutoStrategy,legacyAttack);
           if(plan.changed){s.liteLoadout=plan.loadout;recalcLiteHp(s);
             notice(s,'🤖 智慧換裝已依 '+LITE_STRATEGIES.find(x=>x.id===plan.strategy).name+' 更新配裝。');}
         }
       }
     }
     s.wave++;s.modeWaves[s.activeMode]=s.wave;
     if(s.activeMode==='tower'&&(s.wave-1)%4===0){s.heroHp=s.maxHp;s.chests++;notice(s,'🗼 四層突破！恢復全部生命，獲得寶箱。');}
     if(s.activeMode==='dungeon'&&(s.wave-1)%4===0){
       s.heroHp=s.maxHp;s.gems+=1;
       if(dungeon?.weekday===2){s.skillBooks++;notice(s,'📕 會議室技能書 +1！');}
       if(dungeon?.weekday===3){s.craftingMaterial+=2;s.petFood+=2;awardPetXP(s,60);notice(s,'🐾 寵物經驗 +60、寵物食物 +2、強化材料 +2！');}
       if(dungeon?.weekday===4){s.rareMaterials++;notice(s,'⚒️ 副本結算：稀有材料 +1！');}
       if(dungeon)markWeeklyDungeonClear(s,now);
       notice(s,'🏅 今日副本四關結算：生命回滿，寶石 +1。');
     }
     s.liteToxinStacks=0;s.liteMarks=0;s.liteToxinKey=s.activeMode+':'+s.wave;
     s.enemy=loopEnemyFor(s.wave,s.activeMode,now);s.weekendChaosEvent=null;
     notice(s,'✨ 過關！獲得 '+reward+' 金幣，前往第 '+s.wave+' 關。');
     const fridayNote=maybeFridayBossEscaped(s,rng,now);
     const weekendEvent=maybeWeekendChaos(s,rng,now);
     s.last={type:'victory',damage,crit,boss,elite,tier:dead.tier,gold:reward,newWave:s.wave,fridayNote,weekendEvent,liteDrop:liteDrop?.instanceId||null,
       liteBuild:liteSpecialist.id,buildProc:specialistHit.proc,buildDamage:specialistHit.extra,
       poisonDamage:specialistHit.poison,buildHeal:specialistHit.heal,mastery,
       tacticalExtra:tactical.extra,tacticalHeal:tactical.heal,tacticalSpent:tactical.spent,tacticalExtracted:tactical.extracted,tacticalStun:tactical.skipRetaliation};
     
   }else{
     // Enemy turns survive save/normalize, so special moves trigger consistently.
     s.enemy.turns=(s.enemy.turns||0)+1;
     const eliteSkill=s.enemy.tier==='elite'&&s.enemy.turns%3===0;
     const bossSkill=s.enemy.tier==='boss'&&s.enemy.turns%4===0;
     const baseRetaliation=s.enemy.attack+(s.enemy.trait==='rage'?Math.max(2,Math.floor(s.wave/3)):0);
     const retaliationBase=baseRetaliation+(eliteSkill?Math.max(3,Math.round(baseRetaliation*.45)):
       bossSkill?Math.max(5,Math.round(baseRetaliation*.65)):0);
     const weekendChaos=s.activeMode==='dungeon'&&!s.trainingIsolated&&dailyDungeonFor(now).weekend&&s.weekendChaosEvent?.floor===s.wave?weekendChaosById(s.weekendChaosEvent.id):null;
     const isDeadlineSurge=currentDungeon?.weekday===4&&s.enemy.turns%4===0;
     const retaliation=weekendChaos?.id==='rogue-ai'?Math.ceil(retaliationBase*1.5):isDeadlineSurge?Math.ceil(retaliationBase*1.2):retaliationBase;
     if(isDeadlineSurge){s.last.deadlineSurge=true;notice(s,'🌃 趕死線！怪物第 4 次反擊傷害提升 20%！');}
     if(eliteSkill||bossSkill){
       s.last.enemySkill=eliteSkill?'菁英反制':'首領狂暴';
       notice(s,(eliteSkill?'✦ 菁英反制！':'👑 首領狂暴！')+' '+s.enemy.name+' 發動強力攻擊！');
     }
     const hpBeforeRetaliation=s.heroHp;
     const daily=s.activeMode==='dungeon'&&!s.trainingIsolated?dailyDungeonFor(now):null;
     const slackChance=weekendChaos?.id==='confetti'?.67:daily?(daily.weekday===5?(s.enemy.tier==='elite'?.65:s.enemy.tier==='boss'?.22:daily.slackChance):daily.slackChance):0;
     const slacking=tactical.skipRetaliation||(slackChance>0&&Number(rng())<slackChance);
     if(tactical.skipRetaliation)notice(s,'☕ 咖啡毒素萃取讓敵人短暫脫力，本回合無法反擊！');
     if(currentDungeon?.weekday===2&&Object.values(s.skillCooldowns).some(cd=>cd>0)&&Number(rng())<.20){
       const pending=GAME_SKILLS.filter(k=>s.skillCooldowns[k.id]>0).sort((x,y)=>s.skillCooldowns[y.id]-s.skillCooldowns[x.id])[0];
       s.skillCooldowns[pending.id]=Math.min(pending.cooldown+1,s.skillCooldowns[pending.id]+1);
       s.last.meetingDelay=pending.id;
       notice(s,'📋 臨時追加會議！'+pending.name+' 冷卻延後 1 回合。');
     }
     s.last.enemyIdle=slacking;
     if(slacking){
       const line=currentDungeon?.weekday===3?'🫠 怪物忽然跪地痛哭：「週末到底還要多久……」，放棄反擊。':weekendChaos?.id==='confetti'?'🎊 彩紙吹進敵人的臉，它胡亂揮了一拳，完全打空！':s.enemy.tier==='elite'?'📱 菁英主管看了眼打卡鐘：「剩三分鐘，我不打了。」':
         s.enemy.tier==='boss'?'📨 魔王一邊收公事包一邊假裝沒看到你。':
         ['😴 小兵趴在鍵盤上睡著，放棄攻擊。','🧋 小兵正在喝手搖飲：「有事週一再說。」','🧳 小兵急著下班，完全不想揍人。'][s.enemy.turns%3];
       notice(s,line);
     }
     const reduced=Math.max(1,Math.ceil(retaliation*(1-Math.min(.72,liteStats.damageReduction+legend.damageReduction))*85/(85+liteStats.armor)));
     const reduction=skill?.id==='guard'?Math.max(.1,Math.max(.25,.5-.05*s.skillRank)-skillMods.guardReduction):1;
     s.heroHp=Math.max(0,s.heroHp-(slacking?0:Math.max(1,Math.ceil(reduced*reduction))));
     // Persist the actual HP lost within this attack result. If the hero dies and
     // instantly respawns, comparing only before/after HP would miss the injury.
     s.last.retaliationDamage=hpBeforeRetaliation-s.heroHp;
     if(s.last.retaliationDamage>0){
       const regen=(skill?.id==='guard'?skillMods.guardHeal:0)+legend.guardRegen;
       if(regen){s.heroHp=Math.min(s.maxHp,s.heroHp+regen);s.last.guardRegen=regen;notice(s,'🛡️ 護衛裝備：承傷後恢復 '+regen+' HP。');}
       if(skill?.id==='guard'&&skillMods.reflectMultiplier){
         const reflected=Math.min(s.enemy.hp-1,Math.max(1,Math.round(s.last.retaliationDamage*skillMods.reflectMultiplier)));
         if(reflected>0){s.enemy.hp-=reflected;s.last.reflected=reflected;notice(s,'🛡️ 公事包反擊！反彈 '+reflected+' 傷害！');}
       }
     }
     if(s.enemy.trait==='leech'){
       const healed=Math.min(s.enemy.maxHp-s.enemy.hp,Math.max(2,Math.ceil(s.enemy.maxHp*.06)));
       s.enemy.hp+=healed;
       if(healed>0)notice(s,'🩹 '+s.enemy.name+' 回復 '+healed+' HP！');
     }
     if(!s.heroHp){s.last.respawned=true;s.heroHp=s.maxHp;const loss=Math.min(s.gold,10);s.gold-=loss;notice(s,'💫 勇者被打倒，自動復活，損失 '+loss+' 金幣。');}
   }
   break;
 }
 case 'heal':
   if(s.heroHp>=s.maxHp){notice(s,'生命值已滿，不需使用藥水。');break;}
   if(s.potions<=0){notice(s,'治療藥水不足。');break;}
   s.potions--;s.heroHp=Math.min(s.maxHp,s.heroHp+65);s.last={type:'heal'};notice(s,'❤️ 使用治療藥水，恢復生命。');break;
 case 'claim':{
   const id=s.pendingDrops.shift();if(!id){notice(s,'目前沒有待領取的掉寶。');break;}
   if(s.owned.includes(id)){const extra=ITEMS.find(it=>it.id===id)?.cost/3||10;s.gold+=Math.floor(extra);notice(s,'重複裝備轉為 '+Math.floor(extra)+' 金幣。');}
   else{s.owned.push(id);notice(s,'🎉 新裝備入庫：'+ITEMS.find(it=>it.id===id).name);}
   s.last={type:'loot',id};break;
 }
 case 'equip':
   if(item&&s.owned.includes(item.id)){s.equipped=item.id;s.liteLoadout.weapon=null;recalcLiteHp(s);s.last={type:'equip',id:item.id};notice(s,'🛡️ 換裝：'+item.name+'，攻擊 '+item.attack);}
   break;
 case 'buy':
   if(item&&item.id!=='briefcase'&&!s.owned.includes(item.id)&&s.gold>=item.cost){s.gold-=item.cost;s.owned.push(item.id);s.equipped=item.id;s.liteLoadout.weapon=null;recalcLiteHp(s);s.last={type:'equip',id:item.id};notice(s,'🛒 買下並裝備 '+item.name);}
   else notice(s,'金幣不足或已擁有該裝備。');
   break;
 case 'chest':
   if(s.chests<=0){notice(s,'沒有可以開啟的寶箱。');break;}
   s.chests--;s.gold+=80;s.gems+=1;s.potions+=1;
   s.last={type:'chest'};notice(s,'📦 寶箱開啟！+80 金幣、+1 寶石、+1 藥水。');break;
 case 'encounterStart':{
   const day=todayTW(now);
   if(s.encounterDay===day)break;
   const index=Number(day.replaceAll('-',''))%ENCOUNTERS.length;
   s.encounterDay=day;s.encounterPending=ENCOUNTERS[index].id;
   notice(s,'✦ 遇到奇遇：'+ENCOUNTERS[index].name);break;
 }
 case 'encounterChoose':{
   const e=ENCOUNTERS.find(x=>x.id===s.encounterPending);
   // Invalid input cannot mint rewards or resolve another player's daily event.
   if(!e||!Number.isInteger(a.choice))break;
   const result=encounterOutcome(e,a.choice,rng);
   if(!result)break;
   const oldHp=s.heroHp;
   const injury=Math.min(Math.max(0,oldHp-1),result.damage);
   // Encounter injuries never defeat or auto-respawn the hero; this is a risky
   // side adventure, not a hidden battle. Level-up healing still works normally.
   if(result.damage)s.heroHp=Math.max(1,s.heroHp-result.damage);
   if(result.heal)s.heroHp=Math.min(s.maxHp,s.heroHp+result.heal);
   s.gold+=result.gold;s.potions+=result.potions;s.gems+=result.gems;
   awardXP(s,result.xp);
   s.encounterHistory.unshift({day:s.encounterDay,id:e.id,choice:a.choice,
    outcome:result.outcome,gold:result.gold,xp:result.xp,
    damage:injury,heal:result.heal,potions:result.potions,gems:result.gems});
   s.encounterHistory=s.encounterHistory.slice(0,80);
   s.encounterPending=null;
   s.skinTickets++; // Exactly one ticket/day, even after a failed risk.
   s.last={type:'encounter',id:e.id,...result};
   const resultText=result.outcome==='failure'?'💥 冒險失敗，勉強逃回辦公室！':
     result.outcome==='success'?'🌟 奇遇成功，帶著寶物返回！':'✨ 奇遇完成！';
   notice(s,resultText+' 🪙'+result.gold+'、EXP '+result.xp+
      (result.damage?'，受傷 '+result.damage:'')+(result.heal?'，恢復 '+result.heal:'')+
      (result.potions?'，藥水 +'+result.potions:'')+(result.gems?'，寶石 +'+result.gems:'')+'，造型券 +1。');
   break;
 }
 default:break;
 }
 return s;
}
const TZ=8*3600000,HOUR=3600000,DAY=24*HOUR;
function localStamp(y,m,d,h){return Date.UTC(y,m-1,d,h)-TZ;}
function workday(y,m,d){const w=new Date(Date.UTC(y,m-1,d)).getUTCDay();return w!==0&&w!==6;}
function daysInMonth(y,m){return new Date(Date.UTC(y,m,0)).getUTCDate();}
function countWorkdays(y,m){let n=0;for(let d=1;d<=daysInMonth(y,m);d++)if(workday(y,m,d))n++;return n;}
function workedUntil(y,m,d,ms){if(!workday(y,m,d))return 0;return Math.min(9*HOUR,Math.max(0,ms-localStamp(y,m,d,8)));}
export function salaryAt(now=Date.now(),monthly=40000){
 const local=new Date(now+TZ),y=local.getUTCFullYear(),m=local.getUTCMonth()+1,d=local.getUTCDate(),w=local.getUTCDay();
 const n=countWorkdays(y,m),rate=monthly/(Math.max(1,n)*9*HOUR);
 let today=workedUntil(y,m,d,now)*rate,month=0,week=0;
 for(let day=1;day<=d;day++)month+=workedUntil(y,m,day,now)*rate;
 const monday=Date.UTC(y,m-1,d)-(w+6)%7*DAY;
 for(let i=0;i<7;i++){
   const dt=new Date(monday+i*DAY),Y=dt.getUTCFullYear(),M=dt.getUTCMonth()+1,D=dt.getUTCDate();
   const ts=localStamp(Y,M,D,0);if(ts>now)break;
   week+=workedUntil(Y,M,D,now)*monthly/(Math.max(1,countWorkdays(Y,M))*9*HOUR);
 }
 const on=workday(y,m,d)&&now>=localStamp(y,m,d,8)&&now<localStamp(y,m,d,17);
 return {today,week,month,monthly,day:d,monthNumber:m,year:y,on,workedHours:workedUntil(y,m,d,now)/HOUR,
   status:on?'計薪中':workday(y,m,d)&&now>=localStamp(y,m,d,17)?'已下班':workday(y,m,d)?'等待上班':'休息日'};
}
