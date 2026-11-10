#!/usr/bin/env python3
"""Chromium mobile end-to-end: fifth Q-version cloud ghost is a genuine 16-frame
player-approved fifth official illustrated species. Real battle & save isolated."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
KEY='salary-hero-v19-save-1'
OUT=Path(__file__).resolve().parents[1]/'art/v19/runtime/qa'
OUT.mkdir(parents=True,exist_ok=True)

def main():
 errors=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/v19/play.html?training=deadline-clock',wait_until='domcontentloaded')
  page.wait_for_function("""() => {
   const s=document.querySelector('#monster-art-status'),w=document.querySelector('#world');
   return s?.dataset.loaded==='true'&&s?.dataset.approved==='true'&&
    w?.dataset.cloudArt==='16-original-frames-loaded'&&w?.dataset.cloudFacing==='left'&&
    document.querySelector('#attack')?.disabled===false;
  }""",timeout=45000)
  assert '雲端資料專員靈' in page.locator('#enemy-name').inner_text()
  assert '第 6 關' in page.locator('#wave').inner_text()
  assert 'OFF' in page.locator('#auto').inner_text()
  assert '5/32' in page.locator('#monster-art-status').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth>innerWidth+3') is False
  sizes=page.evaluate("""async()=>{
   const out={};
   for(const [k,n] of Object.entries({idle:4,attack:5,hurt:3,defeat:4})){
    const im=new Image();
    im.src='../art/v19/runtime/monsters/deadline-clock/'+k+'.webp';
    await im.decode();
    out[k]=[im.naturalWidth,im.naturalHeight];
   }
   return out;
  }""")
  assert sizes=={'idle':[1536,384],'attack':[1920,384],'hurt':[1152,384],'defeat':[1536,384]},sizes
  page.evaluate('(key)=>localStorage.setItem(key,"REAL_SAVE_UNCHANGED")',KEY)
  initial=int(page.locator('#hero-hp-text').inner_text().split('/')[0]);assert initial==900
  page.locator('#attack').click()
  captures=page.evaluate("""()=>new Promise((resolve,reject)=>{
   const c=document.querySelector('#world'),goals=[530,940,1150,1330];
   const results=[];let index=0;
   const stop=setTimeout(()=>reject(Error('ghost hit/clock not sampled')),8500);
   function snap(){
    const info=JSON.parse(c.dataset.hpTiming||'null');
    if(info&&info.t>=goals[index]){
     results.push({t:info.t,hp:Number(document.querySelector('#hero-hp-text').textContent.split('/')[0]),
      pose:c.dataset.cloudPose,frame:Number(c.dataset.cloudFrame),
      peakRed:Number(c.dataset.cloudPeakRed||0),
      tinted:c.dataset.cloudTintApplied==='true',
      clock:JSON.parse(c.dataset.cloudClock||'{}'),
      contactMs:info.contactMs});
     index++;
    }
    if(index===goals.length){clearTimeout(stop);resolve(results)}
    else requestAnimationFrame(snap);
   }
   requestAnimationFrame(snap);
  })""")
  assert len(captures)==4,len(captures)
  hurt,windup,travel,contact=captures
  # Persist a real screenshot only AFTER time-sensitive measurements finish.
  page.locator('#world').screenshot(path=str(OUT/'training-cloud-deadline-contact.png'))
  assert hurt['pose']=='hurt' and hurt['peakRed']>.3 and hurt['tinted'],{k:v for k,v in hurt.items() if k!='canvas'}
  assert hurt['hp']==initial and windup['hp']==initial and travel['hp']==initial,[(x['t'],x['hp'],x['contactMs']) for x in captures]
  assert windup['pose']=='attack'
  assert travel['clock'].get('projectile') is True,travel['clock']
  assert travel['clock'].get('travelsLeft') is True,travel['clock']
  assert travel['clock']['originX']>travel['clock']['x']>travel['clock']['targetX'],travel['clock']
  assert contact['contactMs']==1225 and contact['hp']<initial,contact['hp']
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='REAL_SAVE_UNCHANGED'
  page.locator('#training-finish').click()
  page.locator('#attack').click()
  page.wait_for_function("""()=>
    document.querySelector('#game-log')?.textContent?.includes('重新練習')
  """,timeout=6500)
  assert '第 6 關' in page.locator('#wave').inner_text()
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='REAL_SAVE_UNCHANGED'
  assert not errors,errors
  browser.close()
 print('PASS: 390px real cloud ghost 16 original atlas frames, red/white silhouette hit, 1225ms left-going clock, HP timing and isolated save. Official fifth monster 5/32.')

if __name__=='__main__':main()
