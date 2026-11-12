import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.cwd());
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{
 try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+rel);if(!file.startsWith(root+'/')){res.writeHead(403);return res.end('Forbidden')}
  const bytes=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch(e){res.writeHead(404);res.end(String(e.message))}
});
await new Promise(ok=>server.listen(8788,'127.0.0.1',ok));
let browser,page,stage='launch';const errors=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 page.on('pageerror',e=>errors.push(e.message));
 stage='open';
 await page.goto('http://127.0.0.1:8788/boss-v5-play.html?dev=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__salaryBossV5?.kind==='mob',null,{timeout:22000});
 stage='wave1';
 const w1=await page.evaluate(()=>({wave:__salaryBossV5.wave,kind:__salaryBossV5.kind,count:document.querySelectorAll('.v5Enemy').length,boss:__salaryBossV5.bossVisible,heroCount:document.querySelectorAll('.team-zone .unit').length,global:__salaryBossV5.global}));
 assert.equal(w1.wave,1);assert.equal(w1.kind,'mob');assert.equal(w1.boss,false);
 assert.equal(w1.count,3);assert.equal(w1.heroCount,7);
 assert.equal(w1.global.enemyHp,1.65);assert.equal(w1.global.enemyAttack,1.4);

 stage='seven-visible-slots';
 async function checkPortraitTeamLayout(width,height){
  await page.setViewportSize({width,height});
  const layout=await page.evaluate(()=>{
   const zone=document.querySelector('.team-zone').getBoundingClientRect();
   const units=[...document.querySelectorAll('.team-zone .unit')];
   const rects=units.map((u,i)=>{
    const keep=u.style.translate;u.style.translate='0px 0px';
    const r=u.getBoundingClientRect();u.style.translate=keep;
    return {index:i,slot:u.dataset.squadSlot,row:u.dataset.squadRow,name:u.querySelector('small')?.textContent||'',
      left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
   });
   return {zone:{left:zone.left,right:zone.right,top:zone.top,bottom:zone.bottom},rects};
  });
  const {rects,zone}=layout;
  assert.equal(rects.length,7,'all seven actual teammates must occupy the screen');
  assert.deepEqual(rects.map(r=>r.slot),['1','2','3','4','5','6','7']);
  assert.equal(rects.filter(r=>r.row==='front').length,4,'front row must have four members');
  assert.equal(rects.filter(r=>r.row==='rear').length,3,'rear row must have three members');
  assert.equal(new Set(rects.map(r=>r.name)).size,7,'all teammate labels must be distinct');
  for(const r of rects){
   assert.ok(r.left>=zone.left-2&&r.right<=zone.right+2,'unit '+(r.index+1)+' horizontally within party bounds at '+width+'x'+height);
   assert.ok(r.top>=zone.top-2&&r.bottom<=zone.bottom+2,'unit '+(r.index+1)+' vertically within party bounds at '+width+'x'+height);
  }
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
    const a=rects[i],b=rects[j];
    const overlapW=Math.min(a.right,b.right)-Math.max(a.left,b.left);
    const overlapH=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    assert.ok(overlapW<=2||overlapH<=2,'teammates '+(i+1)+'/'+(j+1)+' overlap at '+width+'x'+height);
  }
  return layout;
 }
 const normalLayout=await checkPortraitTeamLayout(390,844);
 const smallLayout=await checkPortraitTeamLayout(320,690);
 await page.setViewportSize({width:390,height:844});

 const art=await page.evaluate(async()=>{
  const im=new Image();im.src='./art/v19/runtime/monsters/paper-gremlin/idle.png';await im.decode();
  return {w:im.naturalWidth,h:im.naturalHeight};
 });
 assert.ok(art.w>500&&art.h>200,'real illustrated monster sprite sheet must load');
 mkdirSync('artifacts',{recursive:true});
 await page.screenshot({path:join('artifacts','boss-v5-first-wave.png')});
 stage='wave2';
 await page.evaluate(()=>__salaryBossV5.skipTo(2));
 await page.waitForFunction(()=>__salaryBossV5.wave===2&&document.querySelectorAll('.v5Enemy').length===4);
 assert.equal(await page.evaluate(()=>__salaryBossV5.bossVisible),false);
 await page.screenshot({path:join('artifacts','boss-v5-second-wave.png')});
 stage='elite';
 await page.evaluate(()=>__salaryBossV5.skipTo(3));
 await page.waitForFunction(()=>__salaryBossV5.wave===3&&document.querySelector('.v5Enemy.elite')!==null);
 assert.equal(await page.evaluate(()=>__salaryBossV5.bossVisible),false);
 await page.screenshot({path:join('artifacts','boss-v5-elite-wave.png')});
 stage='boss';
 await page.evaluate(()=>__salaryBossV5.skipTo(4));
 await page.waitForFunction(()=>__salaryBossV5.wave===4&&__salaryBossV5.kind==='boss'&&__salaryBossV5.bossVisible);
 assert.equal(await page.evaluate(()=>document.querySelectorAll('.v5Enemy').length),0);
 assert.ok(await page.locator('#bossEnergyHud').count()>0,'boss-only energy HUD appears');
 await page.screenshot({path:join('artifacts','boss-v5-real-boss.png')});
 stage='boss-ultimate';
 await page.evaluate(()=>document.querySelector('#v3DevUlt')?.click());
 await page.waitForSelector('#v3Stage.charge',{timeout:8000});
 await page.waitForSelector('#v3Stage.fire',{timeout:8500});
 await page.screenshot({path:join('artifacts','boss-v5-seven-beams.png')});
 await page.waitForFunction(()=>window.__salaryBossV5.ultHits.length===7,null,{timeout:9000});
 const damage=await page.evaluate(()=>window.__salaryBossV5.partyHP);
 assert.ok(damage.every(x=>x<100),'seven independently targeted rays should damage all living slots');
 stage='js-errors';
 assert.deepEqual(errors,[],'no uncaught browser JS errors');
 console.log(JSON.stringify({result:'pass',firstWave:w1,art,bossHP:165,afterUltimateTeamHP:damage}));
}catch(err){
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/boss-v5-last-error.txt','stage='+stage+'\n'+err.stack+'\npageerrors='+errors.join(' | ')+'\n');
 if(page)await page.screenshot({path:join('artifacts','boss-v5-last-screen.png')}).catch(()=>{});
 throw err;
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
