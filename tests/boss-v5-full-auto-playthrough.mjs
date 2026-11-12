import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {chromium} from 'playwright-core';
const cwd=resolve(process.cwd());
const mimes={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{try{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(cwd,'.'+rel);
 if(!file.startsWith(cwd+'/')){res.writeHead(403);return res.end('Forbidden')}
 const bytes=readFileSync(file);res.writeHead(200,{'Content-Type':mimes[extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch(e){res.writeHead(404);res.end(e.message)}});
await new Promise(ok=>server.listen(8790,'127.0.0.1',ok));
let browser,page;const errors=[],waves=[];let step='start';
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8790/boss-v5-play.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__salaryBossV5?.kind==='mob',null,{timeout:25000});
 await page.locator('#speed').click();await page.locator('#speed').click();
 assert.ok((await page.locator('#speed').textContent()).includes('3'));
 step='natural-auto-advance';
 const start=Date.now(),limit=90000;let last=0;
 while(Date.now()-start<limit){
  const v=await page.evaluate(()=>({wave:window.__salaryBossV5?.wave||0,kind:window.__salaryBossV5?.kind,done:window.__salaryBossV5?.done,party:window.__salaryBossV5?.partyHP,win:document.getElementById('v5Complete')?.classList.contains('show'),bossHP:window.__salaryBossV5?.bossHP}));
  if(v.wave!==last){waves.push({wave:v.wave,kind:v.kind,alive:v.party.filter(x=>x>0).length});last=v.wave}
  if(v.done){console.log('FINAL_DUNGEON_RESULT='+JSON.stringify({waves,win:v.win,partyHP:v.party,elapsed:(Date.now()-start)/1000,bossHP:v.bossHP,skills:await page.evaluate(()=>__salaryBossV5.activeSkills.map(x=>x.type))}));assert.equal(v.win,true,'full automatic battle should eventually defeat boss, not wipe out');break}
  await page.waitForTimeout(650);
 }
 assert.deepEqual(waves.map(w=>w.wave),[1,2,3,4],'each wave should auto-clear without dev skipping');
 assert.equal(await page.evaluate(()=>window.__salaryBossV5.done),true,'dungeon must finish within test window');
 assert.deepEqual(errors,[],'no uncaught JS errors during entire run');
 mkdirSync('artifacts',{recursive:true});
 await page.screenshot({path:join('artifacts','boss-v5-auto-victory.png')});
 console.log(JSON.stringify({pass:true,walkthrough:waves,seconds:(Date.now()-start)/1000}));
}catch(e){
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/boss-v5-natural-playthrough-error.txt',step+'\n'+e.stack+'\nseen='+JSON.stringify(waves)+'\npageerrors='+errors.join(' | '));
 if(page)await page.screenshot({path:join('artifacts','boss-v5-natural-failure.png')}).catch(()=>{});
 throw e;
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
