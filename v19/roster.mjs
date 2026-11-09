/** Salary Hero V19: expansion catalog, data only. Art shown as placeholder until individually approved. */
export const HERO_STYLES=Object.freeze([
 {id:'starter',name:'平凡社畜',family:'男性職員',icon:'👨🏻‍💼',description:'偏瘦、有點邋遢的日本大叔；亂黑髮、眼下疲憊、襯衫鬆垮與歪領帶；初始造型'},
 {id:'office-lady',name:'東京事務員',family:'女性職員',icon:'👩🏻‍💼',description:'俐落黑髮、深色套裝、平底鞋與滿手文件'},
 {id:'night-shift',name:'爆肝加班族',family:'社畜變體',icon:'🥱',description:'鬍渣、黑眼圈、鬆領帶、披毯式紅披風；後期解鎖方向'},
 {id:'suit-executive',name:'銀髮主管',family:'男性職員',icon:'🧑🏻‍💼',description:'冷靜、銀灰短髮、極整齊的細條紋西裝'},
 {id:'accountant',name:'會計魔女',family:'女性職員',icon:'🧙🏻‍♀️',description:'戴眼鏡的帳本魔法師；算盤法杖與報表書'},
 {id:'office-bot',name:'打卡機器人',family:'機器人',icon:'🤖',description:'方形金屬身體、員工證感應區、綠色 LED 眼睛'},
 {id:'android',name:'仿生秘書',family:'機器人',icon:'🦾',description:'人形仿生秘書、柔和光圈、透明顯示器袖口'},
 {id:'alien',name:'外星實習生',family:'外星人',icon:'👽',description:'薄荷綠皮膚、大眼睛、套上不合身的人類西裝'},
 {id:'cosmic-clerk',name:'銀河客服員',family:'外星人',icon:'🛸',description:'星雲色皮膚、四隻手臂、漂浮耳機與光幕'},
 {id:'slime',name:'史萊姆打工仔',family:'怪物',icon:'🟣',description:'紫色透明史萊姆、歪掉的領帶與小背包'},
 {id:'skeleton',name:'骷髏會計師',family:'怪物',icon:'💀',description:'小骷髏、條紋西裝、會發光的綠色帳本'},
 {id:'ghost',name:'透明加班靈',family:'怪物',icon:'👻',description:'半透明白色幽靈、漂浮電腦與打不完的報告'},
 {id:'vampire',name:'夜班吸血鬼',family:'怪物',icon:'🧛',description:'黑紅系西裝、披風、血紅咖啡與尖牙'},
 {id:'cat-office',name:'貓耳上班族',family:'獸人',icon:'🐱',description:'保留人形制服的貓耳與尾巴、會睡在鍵盤上'},
 {id:'dragon-office',name:'龍族人資',family:'獸人',icon:'🐲',description:'Q 版龍角、深色西裝、脖子掛著 HR 證件'},
 {id:'mushroom',name:'菇菇工讀生',family:'奇幻生物',icon:'🍄',description:'蘑菇頭頂、工牌掛在菌柄、踩小皮鞋'}
]);
export const COMMON_ENEMIES=Object.freeze([
 {id:'paper-gremlin',name:'暴走報表怪',icon:'📄',family:'文件精怪',trait:'none',traitText:'一般攻擊',sprite:'paper',accent:'#f4dfb1'},
 {id:'coffee-mimic',name:'咖啡杯擬態獸',icon:'☕',family:'辦公異獸',trait:'leech',traitText:'吸收傷害後回復少量生命',accent:'#e9ae72'},
 {id:'chair-golem',name:'人體工學椅魔像',icon:'🪑',family:'家具機兵',trait:'guard',traitText:'承受傷害降低 25%',accent:'#d69cc9'},
 {id:'meeting-ghost',name:'永無止境會議幽靈',icon:'👻',family:'怨念幽靈',trait:'rage',traitText:'反擊更猛烈',accent:'#b4a5fa'},
 {id:'deadline-clock',name:'期限倒數鐘魔',icon:'⏰',family:'時間魔物',trait:'rage',traitText:'反擊更猛烈',accent:'#f6ac6a'},
 {id:'keyboard-piranha',name:'吃字鍵盤獸',icon:'⌨️',family:'機械精怪',trait:'guard',traitText:'承受傷害降低 25%',accent:'#8bd5f4'},
 {id:'lunch-box',name:'過期便當惡魔',icon:'🍱',family:'異界食物',trait:'leech',traitText:'回復少量生命',accent:'#feb597'},
 {id:'file-crab',name:'碎紙機寄居蟹',icon:'🦀',family:'辦公異獸',trait:'guard',traitText:'硬殼護甲',accent:'#fd9585'},
 {id:'security-eye',name:'考勤監控眼球',icon:'👁️',family:'監控機兵',trait:'rage',traitText:'猛烈反擊',accent:'#c4a5fd'},
 {id:'wifi-slime',name:'斷線史萊姆',icon:'🫧',family:'數位史萊姆',trait:'leech',traitText:'資料自我修復',accent:'#94d9d9'},
 {id:'stamp-monster',name:'退件印章狂魔',icon:'🖋️',family:'文具怪物',trait:'none',traitText:'一般攻擊',accent:'#f3d17b'},
 {id:'printer-minion',name:'碳粉小惡魔',icon:'🖨️',family:'辦公機兵',trait:'guard',traitText:'外殼減傷',sprite:'printer',accent:'#bdc9de'},
 {id:'report-plant',name:'報表食人花',icon:'🌱',family:'植物魔物',trait:'leech',traitText:'吸收能量自癒',accent:'#91dd92'},
 {id:'alien-intern',name:'星際實習工蜂',icon:'👾',family:'外星魔物',trait:'rage',traitText:'加速攻擊',accent:'#ad8af4'},
 {id:'robot-auditor',name:'審核機器人',icon:'🤖',family:'機器人',trait:'guard',traitText:'鈦合金護甲',accent:'#7dc7ff'},
 {id:'night-moth',name:'熬夜小夜蛾',icon:'🦋',family:'奇幻生物',trait:'none',traitText:'一般攻擊',accent:'#deabf4'}
]);
export const BOSSES=Object.freeze([
 {id:'printer-overlord',name:'加班暴君・影印機',icon:'🖨️',family:'首領／機械',trait:'guard',traitText:'厚重護甲',sprite:'printer',accent:'#df9b9b'},
 {id:'hr-queen',name:'人資女王・請假審判',icon:'👑',family:'首領／魔法',trait:'leech',traitText:'吸取工作精力',accent:'#ffc77d'},
 {id:'deadline-dragon',name:'截止日巨龍',icon:'🐉',family:'首領／龍族',trait:'rage',traitText:'截止日前暴走',accent:'#d28bfb'},
 {id:'attendance-titan',name:'打卡鐘巨神',icon:'⏳',family:'首領／機械',trait:'guard',traitText:'古老鋼鐵身軀',accent:'#77d4e4'},
 {id:'office-ai',name:'無情考績主機',icon:'🧠',family:'首領／人工智慧',trait:'rage',traitText:'績效暴走',accent:'#92bafa'},
 {id:'alien-manager',name:'宇宙區域經理',icon:'🛸',family:'首領／外星',trait:'leech',traitText:'汲取工作能量',accent:'#b5ed9b'},
 {id:'overtime-reaper',name:'週末收割者',icon:'💀',family:'首領／幽靈',trait:'rage',traitText:'終極加班令',accent:'#ef91aa'},
 {id:'meeting-hydra',name:'八頭會議魔龍',icon:'🐲',family:'首領／魔獸',trait:'guard',traitText:'議程護盾',accent:'#e5a6fb'}
]);
/** Elite encounters are a separate enemy species pool, not palette-swapped commons.
 *  Every four floors: common, common, elite, boss. */
export const ELITE_ENEMIES=Object.freeze([
 {id:'audit-knight',name:'退件審判騎士',icon:'🛡️',family:'菁英／審核機兵',trait:'guard',traitText:'精鋼文件盾，承受傷害降低 25%',accent:'#ffc768',shape:'knight'},
 {id:'espresso-demon',name:'三倍濃縮咖啡魔',icon:'☕',family:'菁英／咖啡惡魔',trait:'rage',traitText:'咖啡因暴走，反擊更猛烈',accent:'#ff956c',shape:'beast'},
 {id:'deadline-hunter',name:'死線獵人',icon:'⏳',family:'菁英／時間獵手',trait:'rage',traitText:'時間追獵，反擊更猛烈',accent:'#c6a3ff',shape:'ghost'},
 {id:'shredder-mantis',name:'碎紙螳螂隊長',icon:'✂️',family:'菁英／刀刃機甲',trait:'guard',traitText:'刀刃裝甲，承受傷害降低 25%',accent:'#8ce5e0',shape:'insect'},
 {id:'presentation-siren',name:'簡報催眠妖姬',icon:'📊',family:'菁英／幻術魔物',trait:'leech',traitText:'吸走鬥志，持續回復生命',accent:'#ff9bd2',shape:'ghost'},
 {id:'overtime-hound',name:'加班地獄犬',icon:'🐺',family:'菁英／異界獵犬',trait:'rage',traitText:'加班狂吠，反擊更猛烈',accent:'#ff866e',shape:'beast'},
 {id:'server-lich',name:'伺服器巫妖',icon:'💾',family:'菁英／資料亡靈',trait:'leech',traitText:'記憶回收，持續回復生命',accent:'#9affb8',shape:'ghost'},
 {id:'clockwork-samurai',name:'打卡機武士',icon:'⚔️',family:'菁英／自動機武者',trait:'guard',traitText:'機械護甲，承受傷害降低 25%',accent:'#f7d18a',shape:'knight'}
]);
export const ENEMY_TIERS=Object.freeze({normal:'普通',elite:'菁英',boss:'首領'});
export const ALL_ENEMIES=Object.freeze([...COMMON_ENEMIES,...ELITE_ENEMIES,...BOSSES]);
export function tierForWave(wave){
 const w=Math.max(1,Math.floor(Number(wave)||1));
 return w%4===0?'boss':w%4===3?'elite':'normal';
}
export function enemyDesignFor(wave){
 const w=Math.max(1,Math.floor(Number(wave)||1)),tier=tierForWave(w);
 return tier==='boss'?BOSSES[(Math.floor(w/4)-1)%BOSSES.length]:
   tier==='elite'?ELITE_ENEMIES[Math.floor((w-3)/4)%ELITE_ENEMIES.length]:
   COMMON_ENEMIES[((w-1)*7+Math.floor((w-1)/4))%COMMON_ENEMIES.length];
}
