/** Annual seasonal event PLANNING catalog — 2027.
 * This file contains no live purchases, payment links or claim handlers.
 * Month-start/month-end dates are Taiwan local; rewards are concepts only.
 */
const drafts=[
 ['jan','新年社畜重開機','🎆','跨年倒數時，打卡機錯把所有員工升成傳說勇者。','每日免費新年任務、重開機徽章與登入寶箱','新春開工補給禮包'],
 ['feb','紅包大暴走','🧧','公司紅包被妖怪偷走，春節辦公室變成尋寶地城。','尋找紅包、收集紅包券與新春武器外觀','福氣招財外觀禮包'],
 ['mar','外星人才招聘季','👽','銀河獵頭公司開放跨星系面試，輸的人要當助理。','限時外星面試、解鎖異星裝飾','銀河職員造型禮包'],
 ['apr','幽靈請假申請書','👻','已離職的老員工回來補交請假單，整棟樓鬧鬼。','幽靈辦公室調查、限時劇情與名片','冥界通勤外觀禮包'],
 ['may','暴雨與失控雲端','🌧️','公司的雲端真的變成烏雲，所有檔案都被雷擊。','天候異常挑戰、雷電裝飾與免費資源','雷雨守護者造型禮包'],
 ['jun','粽子龍王總動員','🐉','龍王要全公司划龍舟加班，辦公大樓成為龍宮。','龍舟競速任務、神話武器外觀','龍宮探險外觀禮包'],
 ['jul','高溫爆肝夏令營','☀️','冷氣壞掉，資料中心溫度上升，電風扇自立為王。','暑期挑戰、冰咖啡資源與火熱徽章','冰火雙形態造型禮包'],
 ['aug','有薪戀愛七夕事件','💌','月老把公司紅線和網路線接反，員工全被配對。','雙人主題劇情（單人可玩）、愛心信封與裝飾','星河浪漫時裝禮包'],
 ['sep','開學實習生失控','📚','剛報到的實習生學會召喚怪物，上班第一天就出事。','校園辦公聯名風格任務、技能研讀補給','實習生成長外觀禮包'],
 ['oct','萬聖鬼主管夜班','🎃','董事長在萬聖節變成吸血鬼，要大家通宵開會。','鬼屋大樓限時挑戰、南瓜頭與幽靈稱號','暗夜吸血鬼造型禮包'],
 ['nov','雙十一採購地獄','🛍️','自動採購 AI 無止盡下單，物流怪物淹沒公司。','免費採購任務、物資獲取活動（無強制消費）','百貨寶藏外觀禮包'],
 ['dec','聖誕尾牙大逃亡','🎄','尾牙一開始，老闆宣布抽獎頭獎是再加班一年。','尾牙首領、聖誕裝飾、全年回顧紀念徽章','傳說尾牙限定外觀禮包']
];
export const ANNUAL_EVENTS_2027=Object.freeze(drafts.map((r,index)=>{
 const m=String(index+1).padStart(2,'0');
 const next=index===11?'2028-01-01':`2027-${String(index+2).padStart(2,'0')}-01`;
 return Object.freeze({id:`2027-${r[0]}`,year:2027,month:index+1,start:`2027-${m}-01`,endExclusive:next,
  title:r[1],icon:r[2],story:r[3],plannedFreeRewards:r[4],plannedPackName:r[5],
  stage:'draft',paymentsEnabled:false});
}));
export function plannedAnnualEvents(year=2027){return year===2027?ANNUAL_EVENTS_2027:[];}
export function plannedEventForTaiwanDate(day){const text=typeof day==='string'?day:
 (()=>{const t=new Date(Number(day??Date.now())+8*3600000);return t.toISOString().slice(0,10);})();
 return ANNUAL_EVENTS_2027.find(e=>text>=e.start&&text<e.endExclusive)||null;
}
