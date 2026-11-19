// 無頭驗收：建立測試存檔 → 招募並部署白律 → 冒險面板 → 小隊戰鬥
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const btn=t=>[...document.querySelectorAll('button')].find(b=>b.offsetParent&&(b.textContent.trim()===t||b.dataset.value===t||b.textContent.includes(t)));
const inp=[...document.querySelectorAll('input')].find(i=>i.offsetParent);
if(inp){inp.focus();inp.value='測試員';inp.dispatchEvent(new Event('input',{bubbles:true}));}
btn('開始我的冒險')?.click();await sleep(800);
btn('角色')?.click();await sleep(400);btn('colleagues')?.click();await sleep(500);
document.querySelector('.s1-colleague-card[data-rarity=UR] button[data-action=s1RecruitColleague]')?.click();await sleep(400);
document.querySelector('button[data-action=s1DeployColleague][data-slot="4"][data-value=lawyer]')?.click();await sleep(400);
[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='✕'&&b.offsetParent)?.click();await sleep(300);
document.querySelector('nav.tabs button[data-panel=modes]')?.click();await sleep(600);
const entry=document.querySelector('button[data-action=openSquadBattle]');
const r={entry:!!entry,disabled:entry?.disabled};
entry?.click();await sleep(2500);
r.overlay=!!document.getElementById('squad-battle');
return r;
