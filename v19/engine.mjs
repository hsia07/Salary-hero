/* Salary Hero V19 — isolated, deterministic game rules. No UI or screenshot dependency. */
export const ITEMS = Object.freeze([
  {id:'briefcase',name:'破舊公事包',tier:'普通',attack:12,icon:'💼',cost:0},
  {id:'laptop',name:'鋼鐵加班筆電',tier:'稀有',attack:19,icon:'💻',cost:90},
  {id:'notice',name:'黃金離職通知書',tier:'史詩',attack:30,icon:'📜',cost:260},
  {id:'excalibur',name:'傳說・準時下班聖劍',tier:'傳說',attack:48,icon:'⚔️',cost:900}
]);
export const ENCOUNTERS = Object.freeze([
 {id:'printer',name:'失控的影印魔像',icon:'🖨️',text:'影印機吐出了明天的週報。你要怎麼做？',choices:[{text:'拔掉插頭',gold:25,xp:24},{text:'把它帶去會議室',gold:45,xp:8}]},
 {id:'coffee',name:'神祕咖啡鍊金師',icon:'☕',text:'陌生人送你一瓶濃縮咖啡。',choices:[{text:'喝下去恢復精神',gold:10,xp:35,heal:30},{text:'轉賣給主管',gold:60,xp:5}]},
 {id:'dragon',name:'傳說・截止日巨龍',icon:'🐉',text:'牠守著一份永遠寫不完的專案。',choices:[{text:'挑戰最後期限',gold:130,xp:100},{text:'召喚自動化魔法',gold:80,xp:145}]}
]);
export const STORAGE_KEY='salary-hero-v19-save-1';
export function todayTW(now=Date.now()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
 return [parts.year,parts.month,parts.day].join('-');
}
export function enemyFor(wave){
 const boss=wave%4===0,scale=Math.floor((wave-1)/4);
 return {id:wave,boss,name:boss?'加班暴君・影印機':'暴走報表怪',hp:boss?145+scale*48:44+wave*10,maxHp:boss?145+scale*48:44+wave*10,attack:boss?10+scale*2:3+Math.floor(wave/3)};
}
export function initial(){
 return {version:19,level:1,xp:0,wave:1,cleared:0,gold:0,gems:0,heroHp:110,maxHp:110,
   equipped:'briefcase',owned:['briefcase'],potions:2,chests:0,pendingDrops:[],enemy:enemyFor(1),
   auto:true,speed:1,encounterDay:'',encounterPending:null,encounterHistory:[],log:['勇者甦醒，開始第一場冒險。'],last:null};
}
export function normalize(raw){
 const fresh=initial();if(!raw||typeof raw!=='object'||raw.version!==19)return fresh;
 const n={...fresh,...raw};
 n.owned=[...new Set((Array.isArray(raw.owned)?raw.owned:[]).filter(x=>ITEMS.some(it=>it.id===x)).concat('briefcase'))];
 n.equipped=n.owned.includes(raw.equipped)?raw.equipped:'briefcase';
 n.level=Math.max(1,Math.min(500,Math.floor(Number(n.level)||1)));
 for(const k of ['xp','gold','gems','potions','chests','cleared','wave'])n[k]=Math.max(k==='wave'?1:0,Math.floor(Number(n[k])||0));
 n.maxHp=Math.max(1,Number(n.maxHp)||110);
 n.heroHp=Math.max(0,Math.min(n.maxHp,Number(n.heroHp)||0));
 n.enemy=raw.enemy&&Number(raw.enemy.id)===n.wave&&Number(raw.enemy.hp)>0
   ?{...enemyFor(n.wave),hp:Math.min(enemyFor(n.wave).maxHp,Number(raw.enemy.hp))}
   :enemyFor(n.wave);
 n.pendingDrops=Array.isArray(raw.pendingDrops)?raw.pendingDrops.filter(x=>ITEMS.some(it=>it.id===x)).slice(0,20):[];
 n.encounterHistory=Array.isArray(raw.encounterHistory)?raw.encounterHistory.slice(0,80):[];
 n.log=Array.isArray(raw.log)?raw.log.slice(0,12):fresh.log;
 n.auto=!!raw.auto;n.speed=raw.speed===2?2:1;
 return n;
}
function notice(s,msg){s.log=[msg,...s.log].slice(0,12);}
function awardXP(s,amount){
 s.xp+=amount;
 while(s.xp>=50+s.level*30){s.xp-=50+s.level*30;s.level++;s.maxHp+=9;s.heroHp=Math.min(s.maxHp,s.heroHp+22);notice(s,'✨ 升到 Lv.'+s.level+'，生命上限增加！');}
}
function lootRoll(s,rng){
 const chance=Math.max(0,Math.min(0.999999,Number(rng())||0));
 if(chance<.23 || s.cleared%4===0){
   const id=s.cleared>=16&&chance<.025?'excalibur':s.cleared>=6&&chance<.10?'notice':'laptop';
   s.pendingDrops.push(id);notice(s,'🎁 敵人掉落 '+ITEMS.find(it=>it.id===id).name+'！');
 }
}
export function transition(raw,action,rng=Math.random,now=Date.now()){
 const s=normalize(raw),a=typeof action==='string'?{type:action}:action||{},item=ITEMS.find(it=>it.id===a.id);
 s.last=null;
 switch(a.type){
 case 'auto':s.auto=!!a.value;notice(s,s.auto?'⚙️ 自動託管開啟':'🛑 已暫停自動戰鬥');break;
 case 'speed':s.speed=a.value===2?2:1;notice(s,'戰鬥速度 ×'+s.speed);break;
 case 'attack':{
   const weapon=ITEMS.find(it=>it.id===s.equipped)||ITEMS[0];
   const crit=Number(rng())<.16,damage=Math.round((weapon.attack+4+s.level*2)*(crit?1.7:1));
   s.enemy.hp=Math.max(0,s.enemy.hp-damage);
   s.last={type:'hit',damage,crit,boss:s.enemy.boss};
   notice(s,(crit?'⚡ 暴擊！':'⚔️ 攻擊！')+'對 '+s.enemy.name+' 造成 '+damage+' 傷害');
   if(s.enemy.hp===0){
     const dead=s.enemy,boss=dead.boss,reward=dead.boss?70+s.wave*9:12+s.wave*4;
     s.gold+=reward;s.cleared++;awardXP(s,boss?75:12+s.wave*2);
     if(boss){s.gems+=2;s.chests+=1;s.heroHp=s.maxHp;notice(s,'🏆 首領擊敗！全隊回滿血，獲得寶箱與寶石。');}
     lootRoll(s,rng);s.wave++;s.enemy=enemyFor(s.wave);
     s.last={type:'victory',damage,crit,boss,gold:reward,newWave:s.wave};
     notice(s,'✨ 過關！獲得 '+reward+' 金幣，前往第 '+s.wave+' 關。');
   }else{
     const retaliation=s.enemy.attack;
     s.heroHp=Math.max(0,s.heroHp-retaliation);
     if(!s.heroHp){s.heroHp=s.maxHp;const loss=Math.min(s.gold,10);s.gold-=loss;notice(s,'💫 勇者被打倒，自動復活，損失 '+loss+' 金幣。');}
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
   const e=ENCOUNTERS.find(x=>x.id===s.encounterPending),c=e?.choices[a.choice];
   if(!c)break;
   s.gold+=c.gold;awardXP(s,c.xp);if(c.heal)s.heroHp=Math.min(s.maxHp,s.heroHp+c.heal);
   s.encounterHistory.unshift({day:s.encounterDay,id:e.id,choice:a.choice});
   s.encounterHistory=s.encounterHistory.slice(0,80);
   s.encounterPending=null;s.last={type:'encounter',id:e.id};
   notice(s,'✨ 奇遇完成，獲得 '+c.gold+' 金幣、'+c.xp+' 經驗！');break;
 }
 default:break;
 }
 return s;
}
const TZ=8*3600000,HOUR=3600000;
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
