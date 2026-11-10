/* Salary Hero V19 — isolated, deterministic game rules. No UI or screenshot dependency. */
import {enemyDesignFor,tierForWave,ALL_ENEMIES,HERO_STYLES} from './roster.mjs';
import {SKINS,SKIN_EVENTS,skinById,drawPool,pickSkin,taiwanWeekKey,weekdayTaiwan} from './skins.mjs';
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
 {id:'dungeon',name:'📆 每日副本',description:'星期一至日七種副本，以台灣時間每日更換'}
]);
/** Seven fixed weekly dungeons. Weekday is Taiwan-local: 0=Sun, 1=Mon ... 6=Sat. */
export const DAILY_DUNGEONS=Object.freeze([
 {weekday:0,id:'sunday-dream',name:'星期日・週末夢境',icon:'🌙',theme:'dream',story:'週日午後的公司像在做夢，怪物也在半夢半醒地巡邏。',hpScale:.92,attackScale:.9,rewardScale:1.1,slackChance:.16},
 {weekday:1,id:'monday-hell',name:'星期一・地獄總部',icon:'🔥',theme:'hell',story:'地獄星期一，全公司警報齊鳴。怪物更硬、更兇，但獎金特別豐厚！',hpScale:1.65,attackScale:1.4,rewardScale:2,slackChance:0},
 {weekday:2,id:'tuesday-office',name:'星期二・失控影印室',icon:'🖨️',theme:'office',story:'星期二的文件失控了，長出尖牙的公文四處亂飛。',hpScale:1,attackScale:1,rewardScale:1,slackChance:.06},
 {weekday:3,id:'wednesday-alien',name:'星期三・銀河客服站',icon:'🛸',theme:'alien',story:'外星客訴跨星系而來，連打卡鐘都被改成宇宙時間。',hpScale:1.12,attackScale:1.08,rewardScale:1.18,slackChance:.08},
 {weekday:4,id:'thursday-data',name:'星期四・資料深淵',icon:'🌀',theme:'digital',story:'星期四伺服器陷入異界，報表與幽靈在資料流裡交戰。',hpScale:1.18,attackScale:1.1,rewardScale:1.25,slackChance:.1},
 {weekday:5,id:'friday-escape',name:'星期五・準時下班大逃亡',icon:'🏃',theme:'friday',story:'小兵上班滑手機，菁英只想關電腦，魔王甚至可能已經下班。',hpScale:.85,attackScale:.7,rewardScale:1.2,slackChance:.48,bossSkipChance:.55},
 {weekday:6,id:'saturday-night',name:'星期六・冥府夜班列車',icon:'🚉',theme:'night',story:'週六沒有人想值班，幽冥列車卻帶來一車又一車的夜班妖怪。',hpScale:1.22,attackScale:1.16,rewardScale:1.32,slackChance:.12}
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
 const prefix=daily?(tier==='boss'?(daily.weekday===5?'週五快閃魔王・':'代班魔王・'):tier==='elite'?(daily.weekday===5?'摸魚菁英・':'代班菁英・'):''):'';
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
export function enemyFor(wave){
 const n=Math.max(1,Math.floor(Number(wave)||1)),design=enemyDesignFor(n);
 const tier=tierForWave(n),boss=tier==='boss',elite=tier==='elite',scale=Math.floor((n-1)/4);
 const maxHp=boss?175+scale*75:elite?Math.round((44+n*10)*1.65):44+n*10;
 return {id:n,typeId:design.id,tier,boss,elite,name:design.name,icon:design.icon,family:design.family,faction:design.faction,
   sprite:design.sprite||null,shape:design.shape||null,accent:design.accent,trait:design.trait,traitText:design.traitText,
   hp:maxHp,maxHp,turns:0,attack:boss?10+scale*2:elite?7+Math.floor(n/3):3+Math.floor(n/3)};
}
export function initial(){
 return {version:19,level:1,xp:0,wave:1,cleared:0,gold:0,gems:0,heroHp:110,maxHp:110,
   playerName:'',styleWishlist:[],defeatedTypes:[],activeMode:'campaign',modeWaves:{campaign:1,tower:1,dungeon:1},skillCooldowns:{burst:0,guard:0,drain:0},dailyDungeonDay:todayTW(),fridayBossRolls:{},fridayNote:null,
   skinTickets:0,ownedSkins:['starter'],activeSkin:'starter',skinDraws:0,skinHistory:[],
   activityDaily:{day:'',wins:0,bosses:0},activityClaims:[],equipped:'briefcase',owned:['briefcase'],potions:2,chests:0,pendingDrops:[],enemy:loopEnemyFor(1),
   auto:true,speed:1,encounterDay:'',encounterPending:null,encounterHistory:[],autoEncounter:false,log:['勇者甦醒，開始第一場冒險。'],last:null};
}
export function normalize(raw,now=Date.now()){
 const fresh=initial();if(!raw||typeof raw!=='object'||raw.version!==19)return fresh;
 const n={...fresh,...raw};
 n.playerName=cleanPlayerName(raw.playerName);
 n.activeMode=GAME_MODES.some(m=>m.id===raw.activeMode)?raw.activeMode:'campaign';
 n.modeWaves=Object.fromEntries(GAME_MODES.map(m=>[m.id,Math.max(1,Math.min(100000,Math.floor(Number(raw.modeWaves?.[m.id])|| (m.id===n.activeMode?Number(raw.wave)||1:1))))]));
 const today=todayTW(now);
 const dungeonDayChanged=raw.dailyDungeonDay!==today;
 n.dailyDungeonDay=today;
 if(dungeonDayChanged)n.modeWaves.dungeon=1;
 n.fridayBossRolls=dungeonDayChanged?{}:Object.fromEntries(Object.entries(raw.fridayBossRolls||{}).filter(([k,v])=>k.startsWith(today+':')&&(v===true||v===false)).slice(-32));
 n.fridayNote=raw.fridayNote&&raw.fridayNote.day===today?raw.fridayNote:null;
 n.wave=n.modeWaves[n.activeMode];
 n.skillCooldowns=Object.fromEntries(GAME_SKILLS.map(k=>[k.id,Math.max(0,Math.min(k.cooldown,Math.floor(Number(raw.skillCooldowns?.[k.id])||0)))]));
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
 n.level=Math.max(1,Math.min(500,Math.floor(Number(n.level)||1)));
 for(const k of ['xp','gold','gems','potions','chests','cleared','wave'])n[k]=Math.max(k==='wave'?1:0,Math.floor(Number(n[k])||0));
 n.maxHp=Math.max(1,Number(n.maxHp)||110);
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
 const xp=Math.round(75*dailyDungeonFor(now).rewardScale);
 s.gold+=reward;s.cleared++;awardXP(s,xp);
 s.gems+=2;s.chests++;s.skinTickets++;s.heroHp=s.maxHp;
 const day=todayTW(now);
 if(s.activityDaily.day!==day)s.activityDaily={day,wins:0,bosses:0};
 s.activityDaily.wins++;s.activityDaily.bosses++;
 lootRoll(s,rng,true);
 const note={...FRIDAY_BOSS_NOTE,day,wave:skippedFloor,gold:reward,xp};
 s.fridayNote=note;
 s.wave++;s.modeWaves.dungeon=s.wave;
 s.enemy=loopEnemyFor(s.wave,'dungeon',now);
 notice(s,'📨 魔王只留下一封信：「下班去，下週一再戰」。你莫名其妙獲勝！+'+reward+' 金幣、+'+xp+' EXP，另有首領戰利品。');
 return note;
}
function notice(s,msg){s.log=[msg,...s.log].slice(0,12);}
function awardXP(s,amount){
 s.xp+=amount;
 while(s.xp>=50+s.level*30){s.xp-=50+s.level*30;s.level++;s.maxHp+=9;s.heroHp=Math.min(s.maxHp,s.heroHp+22);notice(s,'✨ 升到 Lv.'+s.level+'，生命上限增加！');}
}
function lootRoll(s,rng,guaranteed=false){
 const chance=Math.max(0,Math.min(0.999999,Number(rng())||0));
 if(guaranteed || chance<.23 || s.cleared%4===0){
   const id=s.cleared>=16&&chance<.025?'excalibur':s.cleared>=6&&chance<.10?'notice':'laptop';
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
   s.enemy=loopEnemyFor(s.wave,a.id,now);
   s.heroHp=s.maxHp;
   notice(s,'🗺️ 切換至 '+GAME_MODES.find(m=>m.id===a.id).name+'，進度獨立保存。');
   const fridayNote=maybeFridayBossEscaped(s,rng,now);
   s.last={type:'mode',id:a.id,fridayNote};break;
 }
 case 'refreshDungeon':{
   if(s.trainingIsolated)break;
   // normalize() above performs the Taiwan-local daily rollover and preserves
   // permanent campaign / tower / inventory progression.
   s.last={type:'dungeonRefresh',day:s.dailyDungeonDay};
   break;
 }
 case 'auto':s.auto=!!a.value;notice(s,s.auto?'⚙️ 自動託管開啟':'🛑 已暫停自動戰鬥');break;
 case 'autoEncounter':s.autoEncounter=!!a.value;notice(s,s.autoEncounter?'🗺️ 每日奇遇：智慧託管已開啟':'🗺️ 每日奇遇：已改為手動探索');break;
 case 'speed':s.speed=a.value===2?2:1;notice(s,'戰鬥速度 ×'+s.speed);break;
 case 'skill':
 case 'attack':{
   const skill=a.type==='skill'?GAME_SKILLS.find(k=>k.id===a.id):null;
   if(a.type==='skill'&&(!skill||s.skillCooldowns[skill.id]>0)){notice(s,'技能尚未準備好。');break;}
   const weapon=ITEMS.find(it=>it.id===s.equipped)||ITEMS[0];
   const crit=Number(rng())<.16,baseDamage=Math.round((weapon.attack+4+s.level*2)*(crit?1.7:1));
   const boosted=skill?.id==='burst'?baseDamage*2:baseDamage;
   const damage=s.enemy.trait==='guard'?Math.max(1,Math.round(boosted*.75)):boosted;
   for(const key of GAME_SKILLS)s.skillCooldowns[key.id]=Math.max(0,s.skillCooldowns[key.id]-1);
   if(skill)s.skillCooldowns[skill.id]=skill.cooldown;
   if(skill?.id==='drain')s.heroHp=Math.min(s.maxHp,s.heroHp+25);
   s.enemy.hp=Math.max(0,s.enemy.hp-damage);
   s.last={type:'hit',damage,crit,boss:s.enemy.boss,skill:skill?.id||null};
   notice(s,(crit?'⚡ 暴擊！':'⚔️ 攻擊！')+'對 '+s.enemy.name+' 造成 '+damage+' 傷害');
   if(s.enemy.hp===0){
     const dead=s.enemy,boss=dead.boss,elite=dead.tier==='elite';
     const baseReward=boss?70+s.wave*9:elite?36+s.wave*7:12+s.wave*4;
     const reward=Math.round(baseReward*(s.trainingIsolated||s.activeMode!=='dungeon'?1:dailyDungeonFor(now).rewardScale));
     if(!s.defeatedTypes.includes(dead.typeId))s.defeatedTypes.push(dead.typeId);
     s.gold+=reward;s.cleared++;
     const earnedXP=boss?75:elite?38+s.wave*4:12+s.wave*2;
     awardXP(s,Math.round(earnedXP*(s.trainingIsolated||s.activeMode!=='dungeon'?1:dailyDungeonFor(now).rewardScale)));
     const today=todayTW(now);
     if(s.activityDaily.day!==today)s.activityDaily={day:today,wins:0,bosses:0};
     s.activityDaily.wins++;
     if(boss){
       s.activityDaily.bosses++;
       s.gems+=2;s.chests+=1;s.skinTickets++;
       s.heroHp=s.maxHp;
       notice(s,'🏆 首領擊敗！生命回滿，獲得寶箱、寶石與 1 張造型券。');
     }
     if(elite){s.gems+=1;notice(s,'💠 菁英擊敗！獲得額外 1 顆寶石，必定掉落裝備。');}
     lootRoll(s,rng,elite);s.wave++;s.modeWaves[s.activeMode]=s.wave;
     if(s.activeMode==='tower'&&(s.wave-1)%4===0){s.heroHp=s.maxHp;s.chests++;notice(s,'🗼 四層突破！恢復全部生命，獲得寶箱。');}
     if(s.activeMode==='dungeon'&&(s.wave-1)%4===0){
       s.heroHp=s.maxHp;s.gems+=1;notice(s,'🏅 今日副本四關結算：生命回滿，寶石 +1。');
     }
     s.enemy=loopEnemyFor(s.wave,s.activeMode,now);
     notice(s,'✨ 過關！獲得 '+reward+' 金幣，前往第 '+s.wave+' 關。');
     const fridayNote=maybeFridayBossEscaped(s,rng,now);
     s.last={type:'victory',damage,crit,boss,elite,tier:dead.tier,gold:reward,newWave:s.wave,fridayNote};
     
   }else{
     // Enemy turns survive save/normalize, so special moves trigger consistently.
     s.enemy.turns=(s.enemy.turns||0)+1;
     const eliteSkill=s.enemy.tier==='elite'&&s.enemy.turns%3===0;
     const bossSkill=s.enemy.tier==='boss'&&s.enemy.turns%4===0;
     const baseRetaliation=s.enemy.attack+(s.enemy.trait==='rage'?Math.max(2,Math.floor(s.wave/3)):0);
     const retaliation=baseRetaliation+(eliteSkill?Math.max(3,Math.round(baseRetaliation*.45)):
       bossSkill?Math.max(5,Math.round(baseRetaliation*.65)):0);
     if(eliteSkill||bossSkill){
       s.last.enemySkill=eliteSkill?'菁英反制':'首領狂暴';
       notice(s,(eliteSkill?'✦ 菁英反制！':'👑 首領狂暴！')+' '+s.enemy.name+' 發動強力攻擊！');
     }
     const hpBeforeRetaliation=s.heroHp;
     const daily=s.activeMode==='dungeon'&&!s.trainingIsolated?dailyDungeonFor(now):null;
     const slackChance=daily?(daily.weekday===5?(s.enemy.tier==='elite'?.65:s.enemy.tier==='boss'?.22:daily.slackChance):daily.slackChance):0;
     const slacking=slackChance>0&&Number(rng())<slackChance;
     s.last.enemyIdle=slacking;
     if(slacking){
       const line=s.enemy.tier==='elite'?'📱 菁英主管看了眼打卡鐘：「剩三分鐘，我不打了。」':
         s.enemy.tier==='boss'?'📨 魔王一邊收公事包一邊假裝沒看到你。':
         ['😴 小兵趴在鍵盤上睡著，放棄攻擊。','🧋 小兵正在喝手搖飲：「有事週一再說。」','🧳 小兵急著下班，完全不想揍人。'][s.enemy.turns%3];
       notice(s,line);
     }
     s.heroHp=Math.max(0,s.heroHp-(slacking?0:skill?.id==='guard'?Math.ceil(retaliation/2):retaliation));
     // Persist the actual HP lost within this attack result. If the hero dies and
     // instantly respawns, comparing only before/after HP would miss the injury.
     s.last.retaliationDamage=hpBeforeRetaliation-s.heroHp;
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
   if(item&&s.owned.includes(item.id)){s.equipped=item.id;s.last={type:'equip',id:item.id};notice(s,'🛡️ 換裝：'+item.name+'，攻擊 '+item.attack);}
   break;
 case 'buy':
   if(item&&item.id!=='briefcase'&&!s.owned.includes(item.id)&&s.gold>=item.cost){s.gold-=item.cost;s.owned.push(item.id);s.equipped=item.id;s.last={type:'equip',id:item.id};notice(s,'🛒 買下並裝備 '+item.name);}
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
