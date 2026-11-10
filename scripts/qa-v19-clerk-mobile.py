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
  page.clock.install()
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
  # Inspect REAL decoded alpha pixels: full 16 unique poses, with sufficient
  # air around the headband, hair and purple ghost flames on all four edges.
  # This prevents accidental re-introduction of cropped 384px sprite sheets.
  quality=page.evaluate("""async()=>{
    const results={};
    for(const [state,frames] of Object.entries({idle:4,attack:5,hurt:3,defeat:4})){
      const image=new Image();
      image.src='../art/v19/candidates/monsters/keyboard-piranha/hd/'+state+'.webp';
      await image.decode();
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const keys=[],bounds=[];
      for(let k=0;k<frames;k++){
        ctx.clearRect(0,0,512,512);
        ctx.drawImage(image,k*512,0,512,512,0,0,512,512);
        const a=ctx.getImageData(0,0,512,512).data;
        let minX=512,minY=512,maxX=-1,maxY=-1,visible=0,hash=2166136261;
        for(let y=0;y<512;y+=4)for(let x=0;x<512;x+=4){
          const p=4*(y*512+x),alpha=a[p+3];
          if(alpha>55){
            visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);
            maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
          }
          // Sample foreground and hair details to verify animation frames
          // are materially different, not repeated resized single images.
          hash=Math.imul(hash^a[p],16777619)>>>0;
          hash=Math.imul(hash^a[p+1],16777619)>>>0;
          hash=Math.imul(hash^a[p+2],16777619)>>>0;
          hash=Math.imul(hash^alpha,16777619)>>>0;
        }
        keys.push(hash);bounds.push({minX,minY,maxX,maxY,visible});
      }
      results[state]={unique:(new Set(keys)).size,bounds};
    }
    return results;
  }""")
  for state,expected in {'idle':4,'attack':5,'hurt':3,'defeat':4}.items():
   group=quality[state]
   assert group['unique']==expected,(state,group)
   for frame in group['bounds']:
    assert frame['minX']>=12 and frame['minY']>=12,(state,frame)
    assert frame['maxX']<=499 and frame['maxY']<=499,(state,frame)
    assert frame['visible']>1500,(state,frame)

  page.evaluate('(key)=>localStorage.setItem(key,"SIXTH_PLAYER_SAVE_UNCHANGED")',KEY)
  initial=int(page.locator('#hero-hp-text').inner_text().split('/')[0]);assert initial==900
  # Advance Chromium's animation clock through the short projectile window.
  # Slow CI frames can jump directly from windup to impact on a wall clock.
  page.clock.pause_at(page.evaluate('Date.now()')+1000)
  attack=page.locator('#attack')
  assert attack.is_enabled()
  attack.dispatch_event('click')
  captures=[]
  for delta in (560,480,160,80):
   page.clock.run_for(delta)
   captures.append(page.evaluate("""()=>{
    const canvas=document.querySelector('#world');
    return {
     ...JSON.parse(canvas.dataset.hpTiming),
     hp:Number(document.querySelector('#hero-hp-text').textContent.split('/')[0]),
     pose:canvas.dataset.clerkPose,
     peakRed:Number(canvas.dataset.clerkPeakRed||0),
     tinted:canvas.dataset.clerkTintApplied==='true',
     paper:JSON.parse(canvas.dataset.clerkPaper),
     attackLocked:document.querySelector('#attack').disabled,
    };
   }"""))
  early,windup,flight,contact=captures
  assert early['hp']==initial and early['pose']=='hurt',early
  assert early['peakRed']>.3 and early['tinted'],early
  assert windup['hp']==initial and flight['hp']==initial,captures
  assert windup['pose']=='attack',windup
  assert flight['paper'].get('projectile') is True,flight
  assert flight['paper'].get('travelsLeft') is True,flight
  assert flight['paper']['originX']>flight['paper']['x']>flight['paper']['targetX'],flight
  assert flight['t']<1255<=contact['t'],captures
  assert contact['contactMs']==1255 and contact['paper']['impact']>0,contact
  assert contact['hp']<initial,contact
  assert contact['attackLocked'],contact
  b64=page.locator('#world').evaluate('(canvas)=>canvas.toDataURL("image/png").split(",")[1]')
  (OUT/'training-sixth-clerk-reports.png').write_bytes(b64decode(b64))
  page.clock.run_for(900)
  assert attack.is_enabled()
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='SIXTH_PLAYER_SAVE_UNCHANGED'
  page.locator('#training-finish').dispatch_event('click')
  assert attack.is_enabled()
  attack.dispatch_event('click')
  page.clock.run_for(1650)
  assert page.locator('#world').get_attribute('data-clerk-pose')=='defeat'
  assert page.locator('#world').get_attribute('data-clerk-frame')=='3'
  assert attack.is_disabled()
  page.clock.run_for(200)
  assert attack.is_enabled()
  assert '重新練習' in page.locator('#game-log').inner_text()
  assert '第 26 關' in page.locator('#wave').inner_text()
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='SIXTH_PLAYER_SAVE_UNCHANGED'
  assert not errors,errors
  browser.close()
 print('PASS sixth ghost: original 16 human chibi sprite frames, paper to LEFT hits at 1255ms, real silhouette red flash, victory replay, official save preserved; still candidate 5/32.')

if __name__=='__main__':main()
