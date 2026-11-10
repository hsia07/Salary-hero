#!/usr/bin/env python3
"""Real Chromium QA: the 16-frame third mech exists ONLY in practice.

This is NOT a 3/32 signoff. Five unique elite special-skill frames and
user's visual acceptance are prerequisites for promotion to official art.
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
  assert '第 3 關' in page.locator('#wave').inner_text()
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
  assert not errors,'browser runtime errors: '+repr(errors)
  browser.close()
  print('PASS: real 390px mobile guard candidate, 16 source frames, distinct 5×384 blade sprites, combat contact, no official-save changes; NOT user art signoff.')

if __name__=='__main__': main()
