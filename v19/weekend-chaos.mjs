/** Weekend shared dungeon event catalog. Pure data and deterministic picker.
 * Weekend is Saturday 00:00 through Monday 00:00, Taiwan local time.
 * Approved ordinary monster art is reused; these are gameplay events,
 * not a claim that new sprite animation sets have been painted.
 */
export const WEEKEND_CHAOS_EVENTS=Object.freeze([
 Object.freeze({id:'empty',name:'全員下班・空無一人',icon:'🪑',weight:18,story:'推開門，只有一封「我已下班」的便條。你不戰而勝，撿走桌上零錢。'}),
 Object.freeze({id:'coffee',name:'免費咖啡大放送',icon:'☕',weight:22,story:'販賣機公告：全公司停業，庫存免費！勇者恢復生命並獲得藥水。'}),
 Object.freeze({id:'confetti',name:'彩紙風暴失控',icon:'🎊',weight:22,story:'慶祝機關失控，紙花塞滿怪物的眼睛。這一關有較高機率閃避反擊。'}),
 Object.freeze({id:'goldrush',name:'老闆忘記鎖金庫',icon:'🪙',weight:20,story:'公司金庫大開，這層怪物掉落的金幣直接翻倍！'}),
 Object.freeze({id:'rogue-ai',name:'代理主管 AI 暴走',icon:'🤖',weight:18,story:'週末值班 AI 自動升職，敵人攻擊提高；打倒它可獲得額外寶石。'})
]);
export function weekendChaosDraw(roll){
 const total=WEEKEND_CHAOS_EVENTS.reduce((n,x)=>n+x.weight,0);
 const n=Math.max(0,Math.min(.999999,Number(roll)||0))*total;
 let current=0;
 for(const e of WEEKEND_CHAOS_EVENTS){current+=e.weight;if(n<current)return e;}
 return WEEKEND_CHAOS_EVENTS[WEEKEND_CHAOS_EVENTS.length-1];
}
export function weekendChaosById(id){return WEEKEND_CHAOS_EVENTS.find(e=>e.id===id)||null;}
