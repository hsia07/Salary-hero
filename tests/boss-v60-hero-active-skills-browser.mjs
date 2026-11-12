import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.cwd()),mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{try{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+rel);
 if(!file.startsWith(root+'/')){res.writeHead(403);return res.end('Forbidden')}
 const bytes=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch(e){res.writeHead(404);res.end(String(e.message))}});
await new Promise(ok=>server.listen(8796,'127.0.0.1',ok));
let browser,page,step='launch';const errors=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8796/boss-v5-play.html?dev=1&wave=2',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__salaryBossV5?.wave===2&&window.__salaryBossV5?.heroes.length===7,null,{timeout:22000});
 step='guard-and-cleanse';
 const outputs=await page.evaluate(()=>{
  const b=__salaryBossV5;
  b.devSetHp(1,45);
  const initial=b.health;
  const guardCast=b.devCastClassSkill(0);
  const protection=b.guardState;
  b.devHit(1,12);
  const after=b.health;
  b.devAddDebuff(2,'stun',4200);
  const hadStun=b.debuffs[2].includes('stun');
  const cleanseCast=b.devCastClassSkill(3);
  const cleared=!b.debuffs[2].includes('stun');
  const guardLayer=document.querySelectorAll('.v60GuardLink img').length;
  const cleanseLayer=document.querySelectorAll('.v60CleanseTarget img').length;
  return {initial,after,guardCast,protection,hadStun,cleanseCast,cleared,guardLayer,cleanseLayer,events:b.activeSkills};
 });
 assert.equal(outputs.guardCast,true,'guardian must actually cast timed protection');
 assert.equal(outputs.protection.target,1,'lowest allied HP should receive guard');
 assert.ok(outputs.after[1]<outputs.initial[1]&&outputs.after[0]<outputs.initial[0],'guard and target should each take assigned share');
 assert.ok(Math.abs((outputs.initial[1]-outputs.after[1])-8.4)<1,'guard redirects 30% of incoming raw damage');
 assert.ok(outputs.after[0]>95,'guard DEF should reduce intercepted damage');
 assert.equal(outputs.hadStun,true);
 assert.equal(outputs.cleanseCast,true,'coffee medic actually removes crowd-control');
 assert.equal(outputs.cleared,true,'stun is removed in status engine');
 assert.equal(outputs.guardLayer,2);
 assert.equal(outputs.cleanseLayer,2);
 mkdirSync('artifacts',{recursive:true});
 await page.screenshot({path:join('artifacts','boss-v60-protection-and-cleanse.png')});
 step='assassin-and-mage';
 const start=await page.evaluate(()=>{
   const b=__salaryBossV5;
   return {assassin:b.devCastClassSkill(2),mage:b.devCastClassSkill(4)};
 });
 assert.equal(start.assassin,true,'assassin should use backline skill');
 assert.equal(start.mage,true,'spreadsheet mage should use 3-target AoE');
 await page.waitForFunction(()=>__salaryBossV5.activeSkills.filter(e=>e.type==='mage-hit').length>=2,null,{timeout:9000});
 const actions=await page.evaluate(()=>({
   events:__salaryBossV5.activeSkills,
   enemyHP:__salaryBossV5.mobHP,
   layered:[...document.querySelectorAll('.v60Vfx')].map(n=>({name:n.className,layers:n.querySelectorAll('img').length}))
 }));
 assert.ok(actions.events.some(e=>e.type==='assassin-cast'&&e.target));
 assert.ok(actions.events.filter(e=>e.type==='mage-hit').length>=2,'mage must hurt multiple separately tracked enemies');
 assert.ok(actions.layered.every(a=>a.layers===2),'every active skill VFX is made of two separate illustrated parts');
 await page.screenshot({path:join('artifacts','boss-v60-assassin-and-aoe.png')});
 step='asset-integrity';
 const assets=await page.evaluate(async()=>{
  const files=['guard-watch-shield.svg','guard-escort-wings.svg','mage-ledger-array.svg','mage-ledger-blast.svg','assassin-audit-daggers.svg','assassin-shadow-ribbon.svg','cleanse-steam-cup.svg','cleanse-starlight.svg'];
  const out=[];
  for(const f of files){const im=new Image();im.src='./art/s1/active-vfx/'+f;await im.decode();out.push({name:f,w:im.naturalWidth,h:im.naturalHeight})}
  return out;
 });
 assert.ok(assets.length===8&&assets.every(x=>x.w>100&&x.h>100),'all eight illustrated transparent VFX image layers must decode');
 assert.deepEqual(errors,[],'no JS exceptions on mobile');
 console.log(JSON.stringify({pass:true,guard:outputs.protection,interceptHealth:[outputs.initial.slice(0,2),outputs.after.slice(0,2)],cleared:outputs.cleared,skillTypes:[...new Set(actions.events.map(x=>x.type))],assets:assets.length}));
}catch(e){
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/boss-v60-skill-error.txt',step+'\n'+e.stack+'\npage errors='+errors.join(' | '));
 if(page)await page.screenshot({path:join('artifacts','boss-v60-skill-failure.png')}).catch(()=>{});
 throw e;
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
