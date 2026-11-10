#!/usr/bin/env python3
"""Real Chromium QA: the 16-frame third mech exists ONLY in practice.

This is NOT a 3/32 signoff. The monster is a COMMON species; user's visual approval is still pending.
"""
from pathlib import Path
from base64 import b64decode
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
DEST=Path(__file__).resolve().parents[1]/'art/v19/runtime/qa'
DEST.mkdir(parents=True,exist_ok=True)
KEY='salary-hero-v19-save-1'

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto(BASE+'/v19/play.html?training=chair-golem',wait_until='domcontentloaded')
  page.evaluate('(key)=>localStorage.setItem(key,"TRUE_PLAYER_SAVE_UNCHANGED")',KEY)
  page.wait_for_function("""() => {
    const s=document.querySelector('#monster-art-status');
    return s?.dataset?.loaded==='true' && s?.dataset?.candidate==='true' &&
      document.querySelector('#attack')?.disabled===false;
  }""",timeout=40000)
  assert '打卡保全機兵' in page.locator('#enemy-name').inner_text()
  assert '第 5 關' in page.locator('#wave').inner_text()
  assert 'OFF' in page.locator('#auto').inner_text()
  assert '候選' in page.locator('#monster-art-status').inner_text()
  assert '2／32' in page.locator('#monster-art-status').inner_text()
  assert '候選' in page.locator('#training-mode-notice').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth>window.innerWidth+3') is False
  image_size=page.evaluate("""async () => {
    const im=new Image();im.src='../art/v19/candidates/monsters/chair-golem/attack.webp';
    await im.decode();return [im.naturalWidth,im.naturalHeight];
  }""")
  assert image_size==[1920,384],f'not genuine 5×384 WebP: {image_size}'
  before=int(page.locator('#hero-hp-text').inner_text().split('/')[0])
  assert before==900
  # All capture and associated HP assertions occur within rAF in the browser.
  page.locator('#attack').click()
  results=page.evaluate("""() => new Promise((resolve,reject)=>{
    const c=document.querySelector('#world');
    const stages=[['hero-slash',520],['blade-windup',1000],['barrier-impact',1320]];
    const samples=[];
    let i=0;
    const timeout=setTimeout(()=>reject(Error('guard action did not finish')),9000);
    function tick(){
      const raw=c.dataset.hpTiming;
      if(raw){
        const info=JSON.parse(raw);
        if(info.t>=stages[i][1]){
          samples.push({stage:stages[i][0],hp:Number(document.querySelector('#hero-hp-text').textContent.split('/')[0]),
            t:info.t,canvas:c.toDataURL('image/png').split(',')[1],timing:info});
          i++;
        }
      }
      if(i>=stages.length){clearTimeout(timeout);resolve(samples);}
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })""")
  assert len(results)==3
  for row in results:
    (DEST/('training-chair-golem-'+row['stage']+'.png')).write_bytes(b64decode(row['canvas']))
  pre,mid,post=results
  assert pre['t']<1160 and pre['hp']==before,pre['timing']
  assert mid['t']<1160 and mid['hp']==before,mid['timing']
  assert post['t']>=1160 and post['hp']<before,post['timing']
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='TRUE_PLAYER_SAVE_UNCHANGED'

  # This one-tap setup changes only the temporary training opponent's HP.
  # The subsequent strike is a REAL engine victory, showing the real
  # three injury stages and the fourth, collapsed final frame in the arena.
  page.locator('#training-finish').click()
  assert '下一擊' in page.locator('#game-log').inner_text()
  page.locator('#attack').click()
  finish=page.evaluate("""() => new Promise((resolve,reject)=>{
    const c=document.querySelector('#world');
    const stages=[['red-hit',475],['shattered-last-frame',1120],['held-last-frame',1250]];
    const samples=[];let i=0;
    const watchdog=setTimeout(()=>reject(Error('guard defeat frames not delivered')),9000);
    function draw(){
      const raw=c.dataset.hpTiming;
      if(raw){
        const timing=JSON.parse(raw);
        if(timing.t>=stages[i][1]){
          samples.push({
            point:stages[i][0],t:timing.t,pose:c.dataset.guardPose,
            frame:Number(c.dataset.guardFrame),flash:JSON.parse(c.dataset.guardFlash||'{}'),
            peakRed:Number(c.dataset.guardPeakRed||0),
            image:c.toDataURL('image/png').split(',')[1]
          });
          i++;
        }
      }
      if(i===stages.length){clearTimeout(watchdog);resolve(samples);}
      else requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })""")
  assert len(finish)==3
  for snap in finish:
    (DEST/('training-chair-golem-'+snap['point']+'.png')).write_bytes(b64decode(snap['image']))
  red,final_pose,held=finish
  assert red['pose']=='defeat' and red['peakRed']>0.3, {k:v for k,v in red.items() if k!='image'}
  assert final_pose['pose']=='defeat' and final_pose['frame']==3,{k:v for k,v in final_pose.items() if k!='image'}
  assert held['pose']=='defeat' and held['frame']==3,{k:v for k,v in held.items() if k!='image'}
  assert '第 5 關' in page.locator('#wave').inner_text()
  assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='TRUE_PLAYER_SAVE_UNCHANGED'
  assert not errors,'browser runtime errors: '+repr(errors)
  browser.close()
  print('PASS: 390px browser, true 16-frame mech battle, red body flash, final shattered frame held, beam-impact HP timing, no actual save writes; candidate only.')

if __name__=='__main__': main()
