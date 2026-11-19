// 無頭 Edge 即時錄影（CDP screencast）→ 逐格 JPEG + 時間戳，供合成動畫給使用者看。
// 用法：node tools/cdp-record.mjs <url> <outDir> --seconds 8 [--setup file.js] [--js "..."] [--w 375 --h 812]
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const a=process.argv.slice(2),url=a[0],out=a[1];
const opt=(k,d)=>{const i=a.indexOf('--'+k);return i>=0?a[i+1]:d;};
const W=+opt('w',375),H=+opt('h',812),SEC=+opt('seconds',8),WAIT=+opt('wait',3500);
const SETUP=opt('setup','')?readFileSync(opt('setup'),'utf8'):'',JS=opt('js','');
mkdirSync(out,{recursive:true});
const exe=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const port=9800+Math.floor(Math.random()*150),prof=join(process.env.TEMP||'.','cdp-rec-'+port);
const br=spawn(exe,['--headless=new','--disable-gpu','--hide-scrollbars','--mute-audio',`--remote-debugging-port=${port}`,`--user-data-dir=${prof}`,`--window-size=${W},${H}`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hard=setTimeout(()=>{try{br.kill();}catch{}process.exit(2);},(SEC+60)*1000);
let t;for(let i=0;i<50;i++){try{t=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(t.length)break;}catch{}await sleep(200);}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map(),frames=[];let rec=false;
const send=(m,p={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}));});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);}
 if(m.method==='Page.screencastFrame'){if(rec)frames.push({t:m.params.metadata.timestamp,d:m.params.data});send('Page.screencastFrameAck',{sessionId:m.params.sessionId});}};
const ev=async s=>{const r=await send('Runtime.evaluate',{expression:`(async()=>{${s}})()`,awaitPromise:true,returnByValue:true});return r.result?.result?.value??r.result?.exceptionDetails?.exception?.description;};
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url});await sleep(WAIT);
const setup=SETUP?await ev(SETUP):null;
await send('Page.startScreencast',{format:'jpeg',quality:82,everyNthFrame:1});
rec=true;const js=JS?ev(JS):null;
await sleep(SEC*1000);rec=false;await send('Page.stopScreencast');
frames.forEach((f,i)=>writeFileSync(join(out,String(i).padStart(4,'0')+'.jpg'),Buffer.from(f.d,'base64')));
writeFileSync(join(out,'times.json'),JSON.stringify(frames.map(f=>f.t)));
console.log(JSON.stringify({setup,frames:frames.length,js:js?await js:null}));
try{const b=await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();const bw=new WebSocket(b.webSocketDebuggerUrl);await new Promise(r=>bw.onopen=r);bw.send(JSON.stringify({id:1,method:'Browser.close'}));await sleep(300);}catch{}
ws.close();br.kill();clearTimeout(hard);process.exit(0);
