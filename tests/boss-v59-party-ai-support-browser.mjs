import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.cwd()),mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{try{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+rel);
 if(!file.startsWith(root+'/')){res.writeHead(403);return res.end('Forbidden')}
 const buffer=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(buffer);
 }catch(e){res.writeHead(404);res.end(String(e.message))}});
await new Promise(ok=>server.listen(8787,'127.0.0.1',ok));
let browser,page,stage='launch';const errors=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8787/boss-v5-play.html?dev=1&wave=3',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__salaryBossV5?.wave===3&&window.__salaryBossV5?.heroes?.length===7,null,{timeout:23000});
 stage='support-verification';
 // Perform all trigger actions together, before an autonomous turn can alter HP/CD.
 const data=await page.evaluate(()=>{
  const battle=window.__salaryBossV5;
  battle.devSetHp(0,40);battle.devSetHp(1,50);battle.devSetHp(2,68);
  const before=battle.health[0];
  const heal=battle.devCastSupport(3);
  const healed=battle.health[0];
  const shield=battle.devCastSupport(5);
  const castShields=battle.shields.map(x=>x.hp);
  const layers=[...document.querySelectorAll('.team-zone .unit')].map(u=>({
    shield:u.querySelectorAll('.v59ShieldPermanent .v59SpellPart').length,
    heal:u.querySelectorAll('.v59Healing .v59SpellPart').length,
    meter:u.querySelector('.v59ShieldMeter')?.style.width,
  }));
  const hp1=battle.health[1],beforeShield=battle.shields[1].hp;
  battle.devHit(1,3);
  const hpAfter=battle.health[1],afterShield=battle.shields[1].hp;
  battle.devSetHp(2,4);
  const beforeRescue=battle.shields[2].hp;
  battle.devWaveRescue();
  const afterRescue=battle.shields[2].hp;
  return {heal,shield,before,healed,castShields,layers,hp1,hpAfter,beforeShield,afterShield,beforeRescue,afterRescue,events:battle.supportEvents,profiles:battle.heroes};
 });
 assert.equal(data.heal,true,'coffee medic must really use their healing skill');
 assert.ok(data.healed>data.before,'healing must restore target HP');
 assert.equal(data.healed-data.before,9.5,'healer amount = target maximum HP ×9.5%');
 assert.equal(data.shield,true,'engineer must cast a shield for the entire squad');
 assert.ok(data.castShields.every(x=>x>=6.49),'all seven units must receive their own max-HP-scaled shield');
 assert.ok(data.layers.every(x=>x.shield===2),'two distinct illustrated shield layers must be attached per unit');
 assert.equal(data.layers[0].heal,2,'healed teammate must receive two separate illustrated healing layers');
 assert.equal(data.hpAfter,data.hp1,'damage is fully absorbed by shield before HP decreases');
 assert.equal(+(data.beforeShield-data.afterShield).toFixed(2),3,'shield HP must be consumed by a real enemy attack');
 assert.equal(+(data.afterRescue-data.beforeRescue).toFixed(2),10,'wave-win shield grants the lowest target 10% of its max HP');
 assert.equal(data.profiles.length,7,'each teammate must have role and stat definition');
 assert.ok(data.events.some(e=>e.type==='wave-rescue'&&e.target===2));
 stage='asset-decode';
 const assets=await page.evaluate(async()=>{
   const paths=['heal-cup.svg','heal-petals.svg','shield-glass.svg','shield-runes.svg','shield-impact.svg'];
   const dimensions=[];
   for(const name of paths){
    const img=new Image();img.src='./art/s1/support-vfx/'+name;await img.decode();
    dimensions.push({name,width:img.naturalWidth,height:img.naturalHeight});
   }return dimensions;
 });
 assert.ok(assets.every(x=>x.width>=280),'original VFX layers must decode as independent real illustrated image assets');
 mkdirSync('artifacts',{recursive:true});
 await page.screenshot({path:join('artifacts','boss-v59-healing-and-shields.png')});
 stage='no-browser-errors';
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,heal:data.healed-data.before,shields:data.castShields,art:assets,events:data.events.map(e=>e.type)}));
}catch(e){
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/boss-v59-support-error.txt','stage='+stage+'\n'+e.stack+'\nBrowser errors='+errors.join(' | '));
 if(page)await page.screenshot({path:join('artifacts','boss-v59-support-failure.png')}).catch(()=>{});
 throw e;
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
