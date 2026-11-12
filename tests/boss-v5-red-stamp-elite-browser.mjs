import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.cwd());
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const srv=createServer((req,res)=>{
 try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=resolve(root,'.'+path);if(!file.startsWith(root+'/')){res.writeHead(403);return res.end('Forbidden')}
 const bytes=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch(err){res.writeHead(404);res.end(String(err.message))}
});
await new Promise(ok=>srv.listen(8795,'127.0.0.1',ok));
let browser,page,stage='launch';const errors=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 page.on('pageerror',e=>errors.push(e.message));
 stage='load';
 await page.goto('http://127.0.0.1:8795/boss-v5-play.html?dev=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__salaryBossV5?.wave===1,null,{timeout:25000});
 stage='stage3';
 await page.evaluate(()=>__salaryBossV5.skipTo(3));
 await page.waitForFunction(()=>__salaryBossV5.kind==='elite'&&document.querySelector('.v5Enemy.elite[data-species="red-stamp-manager"]'),null,{timeout:12000});
 const info=await page.evaluate(async()=>{
  const actor=document.querySelector('.v5Enemy.elite');
  const base='./art/v19/runtime/monsters/red-stamp-manager/';
  const states={idle:4,attack:5,hurt:3,defeat:4};
  const assets={};
  for(const [name,frames] of Object.entries(states)){
    const im=new Image();im.src=base+name+'.webp';await im.decode();
    assets[name]={width:im.naturalWidth,height:im.naturalHeight,frames};
  }
  const s=new Image();s.src=base+'stun-stars.svg';await s.decode();
  const stamp=new Image();stamp.src=base+'stamp-impact.svg';await stamp.decode();
  return {name:actor.querySelector('.v5Name')?.textContent,species:actor.dataset.species,art:actor.querySelector('.v5Visual')?.style.getPropertyValue('--sheet'),assets,stars:s.naturalWidth,stamp:stamp.naturalWidth};
 });
 assert.equal(info.species,'red-stamp-manager');
 assert.match(info.name,/赤印判官/);assert.ok(info.art.includes('idle.webp'),'battle renderer should show the real illustrated atlas, not old SVG');
 assert.deepEqual(Object.values(info.assets).map(x=>x.frames),[4,5,3,4]);
 for(const d of Object.values(info.assets))assert.equal(d.width,d.frames*256,'real HD WebP spritesheets have equal 256px cells');
 assert.ok(info.stars>0&&info.stamp>0,'both impact overlays are actual loaded art');
 mkdirSync('artifacts',{recursive:true});
 await page.screenshot({path:join('artifacts','boss-v5-red-stamp-elite-idle.png')});
 stage='paper-attack';
 await page.waitForFunction((kind)=>window.__salaryBossV5?.demoEliteSkill(kind),'paper',{timeout:9000});
 await page.waitForSelector('.v52FlyingDocument',{state:'attached',timeout:8000});
 await page.screenshot({path:join('artifacts','boss-v5-red-stamp-elite-paper-attack.png')});
 await page.waitForFunction(()=>__salaryBossV5.eliteEffects.some(e=>e.type==='flying-document'),null,{timeout:7000});
 await page.waitForTimeout(1200);
 stage='meeting';
 await page.waitForFunction((kind)=>window.__salaryBossV5?.demoEliteSkill(kind),'meeting',{timeout:9000});
 await page.waitForSelector('.v52Circle',{state:'attached',timeout:6000});
 await page.screenshot({path:join('artifacts','boss-v5-red-stamp-elite-meeting.png')});
 await page.waitForTimeout(1300);
 stage='stamp';
 await page.waitForFunction((kind)=>window.__salaryBossV5?.demoEliteSkill(kind),'stamp',{timeout:9000});
 await page.waitForSelector('.v5StampContact',{state:'attached',timeout:6000});
 await page.screenshot({path:join('artifacts','boss-v5-red-stamp-elite-stamp.png')});
 const recorded=await page.evaluate(()=>__salaryBossV5.eliteSkills);
 assert.ok(recorded.some(s=>s.includes('主管蓋章')),'stamp attack logged');
 assert.ok(recorded.some(s=>s.includes('無限會議')),'meeting debuff logged');
 assert.ok(recorded.some(s=>s.includes('催件轟炸')),'triple paper skill logged');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,elite:info,skills:recorded}));
}catch(e){
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/boss-v5-red-stamp-error.txt','stage='+stage+'\n'+e.stack+'\nJS errors='+errors.join(' | '));
 if(page)await page.screenshot({path:join('artifacts','boss-v5-red-stamp-failure.png')}).catch(()=>{});
 throw e;
}finally{if(browser)await browser.close();await new Promise(ok=>srv.close(ok))}
