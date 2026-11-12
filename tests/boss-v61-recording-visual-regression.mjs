import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.cwd());
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{try{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+rel);
 if(!file.startsWith(root+'/')){res.writeHead(403);return res.end('Forbidden')}
 const data=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);
}catch(e){res.writeHead(404);res.end(e.message)}});
await new Promise(ok=>server.listen(8789,'127.0.0.1',ok));
let browser,page,stage='start';const errors=[];
const overlap=(a,b)=>Boolean(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top);
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8789/boss-v5-play.html?dev=1&wave=3',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__salaryBossV5?.wave===3&&document.querySelectorAll('.team-zone .unit').length===7,null,{timeout:22000});
 const record=async(width,height,which)=>{
  await page.setViewportSize({width,height});
  await page.waitForTimeout(170);
  return await page.evaluate((which)=>{
   const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const boss=document.querySelector('.boss-zone');
   const units=[...document.querySelectorAll('.team-zone .unit')].map(rect);
   const dev=document.querySelector(which==='boss'?'#v3DevUlt':'#v5DevSkip');
   return {boss:rect(boss),party:rect(document.querySelector('.team-zone')),units,developer:rect(dev),devDisplay:getComputedStyle(dev).display,footer:rect(document.querySelector('.footer')),
   bossVisible:getComputedStyle(boss).visibility,scene:document.querySelector('#game').className,
   devCount:document.querySelectorAll('body.v3-dev').length};
  },which);
 };
 mkdirSync('artifacts',{recursive:true});
 for(const [width,height] of [[390,844],[320,690]]){
   stage='elite-'+width;
   const geometry=await record(width,height,'elite');
   assert.notEqual(geometry.devDisplay,'none','development next wave button should be visible in ?dev=1');
   assert.ok(geometry.developer.width<=32&&geometry.developer.height<=32,'developer button must stay a compact title-bar icon');
   assert.ok(geometry.developer.top<geometry.party.top-30,'development next-wave control belongs in header, not over party');
   for(const [i,unit] of geometry.units.entries())assert.equal(overlap(geometry.developer,unit),false,'development control overlaps teammate '+i);
   await page.screenshot({path:join('artifacts','boss-v61-elite-'+width+'.png')});
 }
 stage='assassin-vfx';
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__salaryBossV5?.devCastClassSkill(2),null,{timeout:10000});
 await page.waitForSelector('.v60AssassinTarget',{state:'attached',timeout:5000});
 const assassin=await page.evaluate(()=>{
   const fx=document.querySelector('.v60AssassinTarget');const parent=fx.closest('.v5Enemy');
   const f=fx.getBoundingClientRect(),p=parent.getBoundingClientRect();
   return {fxWidth:f.width,enemyWidth:p.width,layers:fx.querySelectorAll('img').length};
 });
 assert.ok(assassin.fxWidth<=assassin.enemyWidth*.91,'assassin skill must no longer overwhelm monster silhouette');
 assert.equal(assassin.layers,2,'assassin must keep 2 independent illustrated layers');
 await page.screenshot({path:join('artifacts','boss-v61-assassin-fx.png')});
 stage='elite-paper';
 await page.waitForFunction(()=>window.__salaryBossV5?.demoEliteSkill('paper'),null,{timeout:12000});
 await page.waitForSelector('.v52PaperHalo',{state:'attached',timeout:6000});
 const paperWidth=await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.v52PaperHalo')).width));
 assert.ok(paperWidth<=41,'three small papers must not cover supervisor face');
 await page.screenshot({path:join('artifacts','boss-v61-paper-scale.png')});
 stage='boss';
 await page.evaluate(()=>window.__salaryBossV5.skipTo(4));
 await page.waitForFunction(()=>window.__salaryBossV5?.wave===4,null,{timeout:8000});
 for(const [width,height] of [[390,844],[320,690]]){
   const geometry=await record(width,height,'boss');
   assert.equal(geometry.devDisplay,'block','boss debug control must be visible as compact icon in developer mode');
   assert.ok(geometry.developer.top<geometry.party.top-30,'boss ultimate test icon must be in header');
   assert.ok(geometry.boss.bottom<=geometry.party.top-3,'boss art region should not overlap ally team region');
   assert.ok(geometry.units.every((unit,i)=>!overlap(geometry.developer,unit)),'ultimate dev control must not cover party portraits');
   await page.screenshot({path:join('artifacts','boss-v61-boss-'+width+'.png')});
 }
 assert.deepEqual(errors,[],'no browser JS errors');
 console.log(JSON.stringify({pass:true,assassin,paperWidth,bossSeparated:true,phoneWidths:[390,320]}));
}catch(e){
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/boss-v61-layout-error.txt','stage='+stage+'\n'+e.stack+'\nJS errors='+errors.join(' | '));
 if(page)await page.screenshot({path:join('artifacts','boss-v61-layout-failure.png')}).catch(()=>{});
 throw e;
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
