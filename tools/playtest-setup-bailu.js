// 無頭驗收用：建立測試存檔、招募並部署白律到後排左、進入冒險戰鬥（只在本機預覽來源執行）
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const btn=t=>[...document.querySelectorAll('button')].find(b=>b.offsetParent&&(b.textContent.trim()===t||b.dataset.value===t||b.textContent.includes(t)));
const inp=[...document.querySelectorAll('input')].find(i=>i.offsetParent);
if(inp){inp.focus();inp.value='測試員';inp.dispatchEvent(new Event('input',{bubbles:true}));}
btn('開始我的冒險')?.click();await sleep(800);
btn('角色')?.click();await sleep(400);btn('colleagues')?.click();await sleep(500);
document.querySelector('.s1-colleague-card[data-rarity=UR] button[data-action=s1RecruitColleague]')?.click();await sleep(400);
document.querySelector('button[data-action=s1DeployColleague][data-slot="4"][data-value=lawyer]')?.click();await sleep(400);
[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='✕'&&b.offsetParent)?.click();await sleep(300);
btn('冒險戰鬥')?.click();await sleep(500);
return {actors:document.querySelectorAll('#rig-actors .rig-actor').length};
