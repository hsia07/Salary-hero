import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
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
let browser;
try {
  const executablePath=process.env.CHROME_BIN||'/usr/bin/google-chrome';
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
  await page.goto('http://127.0.0.1:8788/boss-v3-play.html?dev=1',{waitUntil:'domcontentloaded'});
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
  await page.evaluate(()=>document.querySelector('#v3DevUlt').click());
  await page.waitForSelector('#v3Stage.warning',{timeout:4000});
  await page.waitForSelector('#v3Stage.charge',{timeout:7000});
  const loaded=await page.evaluate(()=>({complete:document.querySelector('#v3Cannon img').complete,width:document.querySelector('#v3Cannon img').naturalWidth}));
  assert.ok(loaded.width>0,'cannon SVG must load as a real independent art asset');
  await page.waitForSelector('#v3Stage.fire',{timeout:9000});
  mkdirSync('artifacts',{recursive:true});
  await page.screenshot({path:join('artifacts','boss-v3-fire.png')});
  await page.waitForSelector('#v3Stage.aftermath',{timeout:9000});
  await page.screenshot({path:join('artifacts','boss-v3-aftermath.png')});
  const hp=await page.evaluate(()=>[...document.querySelectorAll('.team-zone .unit .v2Health')].map(el=>parseFloat(el.style.width)));
  assert.ok(hp.some(x=>x<100),'the cannon blast must damage actual teammate HP');
  await page.waitForFunction(()=>document.querySelector('#v3Stage').className==='',{timeout:9000});
  assert.deepEqual(errors,[],'no browser JS/CSS asset errors');
  console.log(JSON.stringify({result:'pass',scene:initial,teammateHealth:hp,cannonSVG:loaded,stage:'completed'}));
}finally{
  if(browser)await browser.close();
  await new Promise(ok=>server.close(ok));
}
