import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { chromium } from 'playwright-core';

const root=resolve(process.cwd());
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+path);
    if(!file.startsWith(root+'/')){res.writeHead(403);return res.end('Forbidden')}
    const bytes=readFileSync(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});
    res.end(bytes);
  }catch(err){res.writeHead(404);res.end(String(err.message))}
});
await new Promise(ok=>server.listen(8788,'127.0.0.1',ok));
let browser,stage='launch';
const errors=[];
try {
  const executablePath=process.env.CHROME_BIN||'/usr/bin/google-chrome';
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  // Browser console includes benign favicon 404s; record actual JS exceptions only.
  stage='navigation';
  await page.goto('http://127.0.0.1:8788/boss-v4-play.html?dev=1',{waitUntil:'domcontentloaded'});
  stage='runtime-loader';
  await page.waitForSelector('#v3Stage',{timeout:25000});
  await page.waitForSelector('#v3DevUlt',{state:'visible'});
  const initial=await page.evaluate(()=>({
    units:document.querySelectorAll('.team-zone .unit').length,
    bg:document.querySelector('.backdrop')!==null,
    cannon:document.querySelector('#v3Cannon img')!==null,
    energy:document.querySelector('#bossEnergyHud')!==null,
    button:document.querySelector('#v3DevUlt')?.textContent
  }));
  assert.equal(initial.units,7,'exactly seven combat actors should render');
  assert.ok(initial.bg && initial.cannon && initial.energy,'art, cannon and energy HUD must exist');
  stage='dev-trigger';
  await page.evaluate(()=>document.querySelector('#v3DevUlt').click());
  await page.waitForSelector('#v3Stage.warning',{timeout:4000});
  stage='charge-animation';
  await page.waitForSelector('#v3Stage.charge',{timeout:7000});
  const loaded=await page.evaluate(()=>({complete:document.querySelector('#v3Cannon img').complete,width:document.querySelector('#v3Cannon img').naturalWidth}));
  assert.ok(loaded.width>0,'cannon SVG must load as a real independent art asset');
  stage='fire-animation';
  await page.waitForSelector('#v3Stage.fire',{timeout:9000});
  mkdirSync('artifacts',{recursive:true});
  await page.screenshot({path:join('artifacts','boss-v4-fire.png')});
  stage='seven-individual-beam-hits';
  await page.waitForFunction(()=>window.__salaryBossV4?.ultimaHits?.length===7,null,{timeout:5500});
  const effects=await page.evaluate(()=>({beamCount:window.__salaryBossV4.beamCount,hits:window.__salaryBossV4.ultimaHits,status:window.__salaryBossV4.statuses,unitHP:window.__salaryBossV4.health}));
  assert.equal(effects.beamCount,7,'the cannon must draw seven separate beams');
  assert.deepEqual(effects.hits,[0,1,2,3,4,5,6],'all seven individual hits must register');
  assert.ok(effects.status[0].includes('stun'),'the front line should receive a real overwork stun');
  assert.ok(effects.status[3].includes('slow'),'a back line teammate should receive Monday slow');
  assert.ok(effects.status[6].includes('paycut'),'the final teammate receives delayed payroll healing debuff');
  assert.equal(effects.unitHP.filter(x=>x<100).length,7,'each beam must reduce its own teammate HP');
  stage='aftermath-animation';
  await page.waitForSelector('#v3Stage.aftermath',{timeout:9000});
  await page.screenshot({path:join('artifacts','boss-v4-aftermath.png')});
  const hp=await page.evaluate(()=>[...document.querySelectorAll('.team-zone .unit .v2Health')].map(el=>parseFloat(el.style.width)));
  assert.ok(hp.some(x=>x<100),'the cannon blast must damage actual teammate HP');
  await page.waitForFunction(()=>document.querySelector('#v3Stage').className==='',{timeout:9000});
  stage='runtime-errors';
  assert.deepEqual(errors,[],'no browser JS errors');
  console.log(JSON.stringify({result:'pass',scene:initial,beamChecks:effects,teammateHealth:hp,cannonSVG:loaded,stage:'completed'}));
}catch(err){
  mkdirSync('artifacts',{recursive:true});
  writeFileSync('artifacts/boss-v4-last-error.txt',`stage=${stage}\n${err.stack}\nerrors=${errors.join(' | ')}\n`);
  throw err;
}finally{
  if(browser)await browser.close();
  await new Promise(ok=>server.close(ok));
}
