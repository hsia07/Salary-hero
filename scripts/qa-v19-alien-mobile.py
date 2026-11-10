#!/usr/bin/env python3
"""Real 390px Chromium verification of alien's fourth-monster COMBAT TIMELINE,
not an art approval. Exercises the real engine while preserving real save."""
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
  page=browser.new_page(viewport={'width':390,'height':844},
    device_scale_factor=2,is_mobile=True,has_touch=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/v19/play.html?training=meeting-ghost',wait_until='domcontentloaded')
  page.wait_for_function("""()=>
     document.querySelector('#attack')?.disabled===false &&
     document.querySelector('#monster-art-status')?.dataset?.loaded==='true'
  """,timeout=45000)
  assert '星際打卡實習生' in page.locator('#enemy-name').inner_text()
  assert '第 50 關' in page.locator('#wave').inner_text()
  assert 'OFF' in page.locator('#auto').inner_text()
  assert '3/32' in page.locator('#monster-art-status').inner_text()
  assert '正式美術尚未整合' in page.locator('#training-mode-notice').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth > window.innerWidth+3') is False
  page.evaluate('(k)=>localStorage.setItem(k,"ORIGINAL_SAVE_UNCHANGED")',KEY)
  initial=int(page.locator('#hero-hp-text').inner_text().split('/')[0])
  assert initial==900
  page.locator('#attack').click()
  snapshots=page.evaluate("""()=>new Promise((resolve,reject)=>{
    const canvas=document.querySelector('#world');
    const samples=[],goals=[1000,1150,1320];
    let idx=0;
    const timer=setTimeout(()=>reject(Error('alien combat timed out')),9000);
    function frame(){
      const raw=canvas.dataset.hpTiming;
      if(raw){
        const timing=JSON.parse(raw);
        if(timing.t>=goals[idx]){
          const spell=JSON.parse(canvas.dataset.alienStamp||'{}');
          samples.push({t:timing.t,contactMs:timing.contactMs,
            hp:Number(document.querySelector('#hero-hp-text').textContent.split('/')[0]),
            spell});
          idx++;
        }
      }
      if(idx>=goals.length){clearTimeout(timer);resolve(samples);}
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })""")
  early,travel,contact=snapshots
  assert early['hp']==initial,early
  assert travel['hp']==initial,travel
  assert travel['spell'].get('projectile') is True,travel
  assert contact['hp']<initial,contact
  assert contact['contactMs']==1215,contact
  assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)=='ORIGINAL_SAVE_UNCHANGED'
  assert not errors,'JS errors: '+repr(errors)
  page.locator('#training-finish').click()
  page.locator('#attack').click()
  page.wait_for_function("""()=>
     document.querySelector('#game-log')?.textContent?.includes('重新練習')
  """,timeout=5000)
  assert '第 50 關' in page.locator('#wave').inner_text()
  assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)=='ORIGINAL_SAVE_UNCHANGED'
  page.locator('#world').screenshot(path=str(OUT/'training-fourth-alien-timing.png'))
  browser.close()
 print('PASS: alien practice wave 50, 1215ms projectile impact, delayed displayed HP, repeat finisher and unchanged official save. Artwork NOT approved.')

if __name__=='__main__':main()
