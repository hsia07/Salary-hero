/* Salary Hero: earn-only cosmetic closet and themed event UI. */
import {SKINS,SKIN_EVENTS,SKIN_RARITIES,drawPool,weekdayTaiwan,taiwanWeekKey,skinById} from './skins.mjs';
import {todayTW} from './engine.mjs';
const h=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
export function renderSkinPanel(state){
 const pool=drawPool(state.ownedSkins),total=SKINS.length,parts=[];
 const won=state.last?.type==='skinDraw'?skinById(state.last.id):null;
 parts.push('<p>🎟️ 造型券：<b>'+state.skinTickets+'</b> · 已解鎖 '+state.ownedSkins.length+'/'+total+' 套</p>');
 parts.push('<p>除預設「平凡社畜」外，所有角色造型都必須透過<b>活動或抽獎</b>取得。造型券只由遊戲玩法產生，不使用真實金錢。</p>');
 if(won)parts.push('<div class="skin-reveal" role="status">✨ 恭喜獲得 '+won.icon+' <b>'+h(won.name)+'</b>！</div>');
 parts.push('<button class="panel-button" data-action="drawSkin" '+(state.skinTickets<1||pool.length===0?'disabled':'')+'>'+(pool.length?'🎰 抽一次（1 張券）':'抽獎池已收齊')+'</button>');
 parts.push('<small>每件造型的抽取權重：普通 60、稀有 28、史詩 10、傳說 2；只從尚未取得的抽獎造型中選取，因此實際機率會隨剩餘清單改變，活動限定造型不會進抽獎池。無重複獎品。</small>');
 parts.push('<h3>🎊 限時活動</h3>');
 const today=todayTW(),weekday=weekdayTaiwan(),week=taiwanWeekKey();
 const wins=state.activityDaily.day===today?state.activityDaily.wins:0;
 for(const ev of SKIN_EVENTS){
   const active=weekday===ev.weekday,claimed=state.activityClaims.includes(ev.id+':'+week),eligible=active&&wins>=ev.requiredWins&&!claimed;
   const reward=skinById(ev.skinId),already=state.ownedSkins.includes(ev.skinId);
   const status=claimed?'本週已領取':active?'今日勝利：'+wins+'/'+ev.requiredWins:'每週'+(ev.weekday===1?'一':'五')+'開放';
   parts.push('<div class="item"><span class="symbol">'+(ev.weekday===1?'😵':'🎉')+'</span><div class="detail"><strong>'+h(ev.name)+'</strong><small>'+h(status)+'</small><small>'+h(already?'已擁有造型，領獎改為 1 張券':'活動獎品：'+reward.name)+'</small></div><button type="button" data-action="claimSkinEvent" data-value="'+h(ev.id)+'" '+(eligible?'':'disabled')+'>'+(claimed?'已領取':'領取')+'</button></div>');
 }
 parts.push('<h3>🎭 角色衣櫃</h3><p><small>已取得的造型才可選用。目前多數造型尚無通過美術驗收的獨立動畫；選用後先在戰場顯示外觀標記，正式角色換裝會待素材完成後接入。</small></p>');
 for(const skin of SKINS){
   const owned=state.ownedSkins.includes(skin.id),active=state.activeSkin===skin.id;
   const source=skin.source==='starter'?'起始免費':skin.source==='draw'?'抽獎限定':'活動限定';
   parts.push('<div class="item '+(owned?'':'muted')+'"><span class="symbol">'+(owned?skin.icon:'◼️')+'</span><div class="detail"><strong>'+h(skin.name)+'</strong><small>'+h(skin.family)+' · '+h(SKIN_RARITIES[skin.rarity].label)+' · '+source+'</small><small>'+(owned?'已解鎖／正式造型美術待製作':'🔒 未取得')+'</small></div><button type="button" data-action="equipSkin" data-value="'+h(skin.id)+'" '+(owned&&!active?'':'disabled')+'>'+(active?'使用中':owned?'選用':'🔒')+'</button></div>');
 }
 return parts.join('');
}
