#!/usr/bin/env python3
"""End-to-end mobile QA of the REAL V19 combat training, no mocks or uploads.

Starts against two genuinely illustrated sprites and asserts the normal V19
localStorage save is byte-for-byte unchanged after attacking in rehearsal.
"""
from pathlib import Path
from base64 import b64decode
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
OUT=Path(__file__).resolve().parents[1]/'art/v19/runtime/qa'
OUT.mkdir(parents=True,exist_ok=True)
SAVE_KEY='salary-hero-v19-save-1'

def combat_age_at_least(page,t):
    page.wait_for_function("""(minimum) => {
      const raw=document.querySelector('#world')?.dataset?.hpTiming;
      if(!raw)return false;
      return Number(JSON.parse(raw).t)>=minimum;
    }""",arg=t,timeout=9000)

def capture_canvas(page,name):
    # Avoid Playwright's screenshot stability waits, which can advance combat
    # several seconds and make a "520ms" capture actually show t=3,189ms.
    b64=page.locator('#world').evaluate(
        '(c)=>c.toDataURL("image/png").split(",")[1]')
    (OUT/name).write_bytes(b64decode(b64))

def test_species(page,species,expected_name,expected_wave):
    page.goto(BASE+'/v19/play.html?training='+species,wait_until='domcontentloaded')
    page.wait_for_function("""() => {
      const status=document.querySelector('#monster-art-status');
      return status?.dataset?.loaded === 'true' &&
             document.querySelector('#attack')?.disabled === false;
    }""",timeout=35000)
    assert page.locator('#training-mode-notice').is_visible(),'training identity banner missing'
    assert expected_name in page.locator('#enemy-name').inner_text()
    assert '第 '+str(expected_wave)+' 關' in page.locator('#wave').inner_text()
    assert 'OFF' in page.locator('#auto').inner_text(),'training must not autoplay'
    assert page.evaluate('document.documentElement.scrollWidth > window.innerWidth+3') is False
    assert page.evaluate('(key)=>localStorage.getItem(key)',SAVE_KEY)=='UNCHANGED_REAL_PLAYER_SAVE'
    assert '5/32' in page.locator('#monster-art-status').inner_text()
    # Validate the actual raster art decodes in-browser, not just in a manifest.
    frames=page.evaluate("""async (name) => {
      const suffix=name==='coffee-mimic'?'.webp':'.png';
      const img=new Image();
      img.src='../art/v19/runtime/monsters/'+name+'/attack'+suffix;
      await img.decode();
      return [img.naturalWidth,img.naturalHeight];
    }""",species)
    assert frames==[1600,320],f'actual animation pixels missing {species}: {frames}'
    capture_canvas(page,'training-'+species+'-idle.png')
    hp_before=int(page.locator('#hero-hp-text').inner_text().split('/')[0])
    assert hp_before==900
    page.locator('#attack').click()
    # Sample and snapshot entirely INSIDE Chromium's rAF. IPC/screenshot
    # latency MUST NOT change which animation frame we claim to verify.
    samples=page.evaluate("""() => new Promise((resolve,reject) => {
      const canvas=document.querySelector('#world');
      const points=[['hero-hit',520],['counterattack',1090],['hurt-red-flash',1310]];
      const output=[];
      let index=0;
      const watchdog=setTimeout(()=>reject(Error('no combat timing frames')),9000);
      function sample(){
        const raw=canvas.dataset.hpTiming;
        if(raw){
          const d=JSON.parse(raw);
          if(d.t>=points[index][1]){
            const hp=Number(document.querySelector('#hero-hp-text').textContent.split('/')[0]);
            const image=canvas.toDataURL('image/png').split(',')[1];
            output.push({label:points[index][0],t:d.t,hp,image,debug:d});
            index++;
          }
        }
        if(index===points.length){clearTimeout(watchdog);resolve(output);}
        else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    })""")
    assert len(samples)==3
    for snap in samples:
        (OUT/('training-'+species+'-'+snap['label']+'.png')).write_bytes(b64decode(snap['image']))
    # Check the actual moment of the frame, not the time after a slow
    # Playwright screenshot returns to Python.
    before,flight,after=samples
    assert before['t']<1215 and before['hp']==hp_before, repr(before['debug'])
    assert flight['t']<1215 and flight['hp']==hp_before, repr(flight['debug'])
    assert after['t']>=1215 and after['hp']<hp_before, repr(after['debug'])
    assert page.evaluate('(key)=>localStorage.getItem(key)',SAVE_KEY)=='UNCHANGED_REAL_PLAYER_SAVE'

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        # Seed the sentinel INSIDE rehearsal; navigating away from a normal
        # gameplay tab could legitimately write its final save on pagehide.
        page.goto(BASE+'/v19/play.html?training=coffee-mimic',wait_until='domcontentloaded')
        page.evaluate('(key)=>localStorage.setItem(key,"UNCHANGED_REAL_PLAYER_SAVE")',SAVE_KEY)
        test_species(page,'coffee-mimic','茶水間實習杯靈',2)
        test_species(page,'paper-gremlin','影印室工讀紙妖',1)
        assert not errors, 'browser JS exceptions: '+repr(errors)
        assert page.evaluate('(key)=>localStorage.getItem(key)',SAVE_KEY)=='UNCHANGED_REAL_PLAYER_SAVE'
        browser.close()
        print('PASS: 390px mobile true artwork decoded, two combat rehearsals playable, no save mutation.')

if __name__=='__main__':main()
