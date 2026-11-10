#!/usr/bin/env python3
"""Real 390px Chromium QA for sixth ORIGINAL human ghost office worker.
Candidate only. Its report projectile must land at 1255ms; no save mutation.
"""
from base64 import b64decode
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:8766'
KEY='salary-hero-v19-save-1'
OUT=ROOT/'art/v19/runtime/qa'
OUT.mkdir(parents=True,exist_ok=True)

def main():
 errors=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/v19/play.html?training=keyboard-piranha',wait_until='domcontentloaded')
  page.wait_for_function("""()=>{
   const s=document.querySelector('#monster-art-status'),w=document.querySelector('#world');
   return s?.dataset.loaded==='true'&&s?.dataset.candidate==='true'&&
    w?.dataset.clerkArt==='16-original-frames-loaded'&&w?.dataset.clerkFacing==='left'&&
    document.querySelector('#attack')?.disabled===false;
  }""",timeout=45000)
  assert '加班遊魂文員' in page.locator('#enemy-name').inner_text()
  assert '第 26 關' in page.locator('#wave').inner_text()
  assert 'OFF' in page.locator('#auto').inner_text()
  assert '5/32' in page.locator('#monster-art-status').inner_text()
  assert '512px 高清 16 格人形怨靈候選' in page.locator('#training-mode-notice').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth>innerWidth+3') is False
  dimensions=page.evaluate("""async()=>{
   const dims={};
   for(const [s,n] of Object.entries({idle:4,attack:5,hurt:3,defeat:4})){
    const im=new Image();im.src='../art/v19/candidates/monsters/keyboard-piranha/hd/'+s+'.webp';
    await im.decode();dims[s]=[im.naturalWidth,im.naturalHeight];
   }return dims;
  }""")
  assert dimensions=={'idle':[2048,512],'attack':[2560,512],'hurt':[1536,512],'defeat':[2048,512]},dimensions
  page.evaluate('(key)=>localStorage.setItem(key,"SIXTH_PLAYER_SAVE_UNCHANGED")',KEY)
  initial=int(page.locator('#hero-hp-text').inner_text().split('/')[0]);assert initial==900
  page.locator('#attack').click()
  captures=page.evaluate("""()=>new Promise((resolve,reject)=>{
   const c=document.querySelector('#world'),goals=[550,1040,1200,1390],results=[];let i=0;
   const watchdog=setTimeout(()=>reject(Error('sixth report hit not sampled')),9000);
   function frame(){
    const raw=c.dataset.hpTiming;
    if(raw){
     const t=JSON.parse(raw);
     if(t.t>=goals[i]){
      const r=JSON.parse(c.dataset.clerkPaper||'{}');
      results.push({t:t.t,hp:Number(document.querySelector('#hero-hp-text').textContent.split('/')[0]),
       contactMs:t.contactMs,pose:c.dataset.clerkPose,frame:Number(c.dataset.clerkFrame),
       peakRed:Number(c.dataset.clerkPeakRed||0),tinted:c.dataset.clerkTintApplied==='true',paper:r});
      i++;
     }
    }
    if(i===goals.length){clearTimeout(watchdog);resolve(results);}
    else requestAnimationFrame(frame);
   }
   requestAnimationFrame(frame);
  })""")
  early,windup,flight,contact=captures
  assert early['hp']==initial and early['pose']=='hurt',early
  assert early['peakRed']>.3 and early['tinted'],early
  assert windup['hp']==initial and flight['hp']==initial,captures
  assert windup['pose']=='attack',windup
  assert flight['paper'].get('projectile') is True,flight
  assert flight['paper'].get('travelsLeft') is True,flight
  assert flight['paper']['originX']>flight['paper']['x']>flight['paper']['targetX'],flight
  assert contact['contactMs']==1255,contact
  assert contact['hp']<initial,contact
  b64=page.locator('#world').evaluate('(canvas)=>canvas.toDataURL("image/png").split(",")[1]')
  (OUT/'training-sixth-clerk-reports.png').write_bytes(b64decode(b64))
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='SIXTH_PLAYER_SAVE_UNCHANGED'
  page.locator('#training-finish').click()
  page.locator('#attack').click()
  page.wait_for_function("""()=>document.querySelector('#game-log')?.textContent?.includes('重新練習')""",timeout=6500)
  assert '第 26 關' in page.locator('#wave').inner_text()
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='SIXTH_PLAYER_SAVE_UNCHANGED'
  assert not errors,errors
  browser.close()
 print('PASS sixth ghost: original 16 human chibi sprite frames, paper to LEFT hits at 1255ms, real silhouette red flash, victory replay, official save preserved; still candidate 5/32.')

if __name__=='__main__':main()
