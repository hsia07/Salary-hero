// 無依賴的 Edge/Chrome 無頭驗收：開頁、執行 JS、連續截圖（動畫逐格證據）。
// 用法：node tools/cdp-shot.mjs <url> <outDir> [--w 375 --h 812 --wait 2500 --frames 0 --every 120 --js "..." --after "..."]
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const args=process.argv.slice(2),url=args[0],out=args[1];
const opt=(k,d)=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:d;};
const W=+opt('w',375),H=+opt('h',812),WAIT=+opt('wait',2500),FRAMES=+opt('frames',0),EVERY=+opt('every',120);
const JS=opt('js',''),AFTER=opt('after',''),CLIP=opt('clip','');
mkdirSync(out,{recursive:true});
const exe=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const port=9300+Math.floor(Math.random()*500);
const prof=join(process.env.TEMP||'.','cdp-prof-'+port);
const br=spawn(exe,['--headless=new','--disable-gpu','--hide-scrollbars','--mute-audio',`--remote-debugging-port=${port}`,`--user-data-dir=${prof}`,`--window-size=${W},${H}`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// 硬性逾時：任何步驟卡住都在 90 秒內結束並關掉瀏覽器
const hard=setTimeout(()=>{console.log(JSON.stringify({error:'timeout'}));try{br.kill();}catch{}process.exit(2);},Number(process.env.CDP_TIMEOUT||90000));
let targets;for(let i=0;i<50;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.length)break;}catch{}await sleep(200);}
const page=targets.find(t=>t.type==='page');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();const logs=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}
 if(m.method==='Runtime.consoleAPICalled')logs.push(m.params.type+': '+m.params.args.map(a=>a.value??a.description).join(' '));
 if(m.method==='Log.entryAdded')logs.push('LOG '+m.params.entry.level+': '+m.params.entry.text+' '+(m.params.entry.url||''));
 if(m.method==='Runtime.exceptionThrown')logs.push('EXCEPTION: '+m.params.exceptionDetails.exception?.description);};
const send=(method,params={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
const evalJS=async src=>{const r=await send('Runtime.evaluate',{expression:`(async()=>{${src}})()`,awaitPromise:true,returnByValue:true});return r.result?.result?.value??r.result?.exceptionDetails?.exception?.description;};
await send('Runtime.enable');await send('Page.enable');await send('Log.enable');
// 無頭模式下頁面可能被視為背景而暫停 requestAnimationFrame：帶到前景並模擬焦點
await send('Page.bringToFront');await send('Emulation.setFocusEmulationEnabled',{enabled:true});
await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:2,mobile:true});
await send('Page.navigate',{url});await sleep(WAIT);
// --clip x,y,w,h（CSS 像素）只擷取局部並用 JPEG，加快逐格擷取
const clip=CLIP?(([x,y,width,height])=>({x,y,width,height,scale:0.5}))(CLIP.split(',').map(Number)):undefined;
const shot=async name=>{const r=await send('Page.captureScreenshot',clip?{format:'jpeg',quality:80,clip}:{format:'png'});writeFileSync(join(out,name.replace('.png',clip?'.jpg':'.png')),Buffer.from(r.result.data,'base64'));};
const result={};
if(JS)result.js=await evalJS(JS);
await shot('00.png');
for(let i=1;i<=FRAMES;i++){await sleep(EVERY);await shot(String(i).padStart(2,'0')+'.png');}
if(AFTER)result.after=await evalJS(AFTER);
result.logs=logs.slice(-20);
console.log(JSON.stringify(result,null,1));
try{const b=await fetch(`http://127.0.0.1:${port}/json/version`).then(r=>r.json());const bw=new WebSocket(b.webSocketDebuggerUrl);await new Promise(r=>bw.onopen=r);bw.send(JSON.stringify({id:1,method:'Browser.close'}));await sleep(300);}catch{}
ws.close();br.kill();clearTimeout(hard);process.exit(0);
