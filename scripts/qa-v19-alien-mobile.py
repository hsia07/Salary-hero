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
  assert '4/32' in page.locator('#monster-art-status').inner_text()
  assert '正式 16 格逐格美術・面向左' in page.locator('#training-mode-notice').inner_text()
  page.wait_for_function("""() => {
    const w=document.querySelector('#world'),label=document.querySelector('#monster-art-status');
    return w?.dataset.alienArt==='16-frames-loaded'&&w?.dataset.alienFacing==='left'&&
           label?.dataset.approved==='true'&&label.textContent.includes('4/32');
  }""",timeout=20000)
  dimensions=page.evaluate("""async()=>{
    const r={};for(const [state,frames] of Object.entries({idle:4,attack:5,hurt:3,defeat:4})){
      const image=new Image();image.src='../art/v19/runtime/monsters/meeting-ghost/'+state+'.webp';
      await image.decode();r[state]=[image.naturalWidth,image.naturalHeight];
    }return r;
  }""")
  assert dimensions=={s:[384*n,384] for s,n in [('idle',4),('attack',5),('hurt',3),('defeat',4)]},dimensions
  assert page.evaluate('document.documentElement.scrollWidth > window.innerWidth+3') is False
  page.evaluate('(k)=>localStorage.setItem(k,"ORIGINAL_SAVE_UNCHANGED")',KEY)
  initial=int(page.locator('#hero-hp-text').inner_text().split('/')[0])
  assert initial==900
  page.locator('#attack').click()
  snapshots=page.evaluate("""()=>new Promise((resolve,reject)=>{
    const canvas=document.querySelector('#world');
    const samples=[],goals=[530,1000,1150,1320];
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
            pose:canvas.dataset.alienPose,frame:Number(canvas.dataset.alienFrame),
            peakRed:Number(canvas.dataset.alienRedPeak||0),
            tintApplied:canvas.dataset.alienTintApplied==='true',
            spell});
          idx++;
        }
      }
      if(idx>=goals.length){clearTimeout(timer);resolve(samples);}
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })""")
  hurt,early,travel,contact=snapshots
  assert hurt['hp']==initial,hurt
  assert hurt['pose']=='hurt' and hurt['peakRed']>.3 and hurt['tintApplied'],hurt
  assert early['hp']==initial,early
  assert early['pose']=='attack',early
  assert travel['hp']==initial,travel
  assert travel['spell'].get('projectile') is True,travel
  assert travel['spell'].get('travelsLeft') is True,travel
  assert travel['spell']['originX']>travel['spell']['x']>travel['spell']['targetX'],travel
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
  page.locator('#world').screenshot(path=str(OUT/'training-fourth-alien-left-facing.png'))
  browser.close()
 print('PASS: alien practice wave 50, 1215ms projectile impact, delayed displayed HP, repeat finisher and unchanged official save. Now official fourth 16-frame illustrated alien, visual acceptance recorded.')

if __name__=='__main__':main()
