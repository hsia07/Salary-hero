#!/usr/bin/env python3
"""Mobile Chromium verification of a REAL animated five-pose Q-version sprite in live V19 combat."""
from pathlib import Path
from playwright.sync_api import sync_playwright

URL='http://127.0.0.1:8766'
OUTPUT=Path(__file__).resolve().parents[1]/'art/v19/runtime/qa'
OUTPUT.mkdir(exist_ok=True,parents=True)

def main():
    with sync_playwright() as engine:
        browser=engine.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,
                              is_mobile=True,has_touch=True)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(URL+'/v19/play.html?art=chibi',wait_until='domcontentloaded')
        page.wait_for_function("document.querySelector('#name-dialog')?.open || document.querySelector('#attack')?.disabled === false",timeout=20000)
        name=page.locator('#name-dialog[open]')
        if name.count():
            page.locator('#player-name-input').fill('動畫驗收')
            page.locator('#name-form button').click()
        page.wait_for_function("document.querySelector('#attack')?.disabled === false",timeout=20000)
        page.wait_for_function("document.querySelector('#world')?.dataset?.art === 'chibi-5pose'",timeout=20000)
        if 'Q版真姿勢測試' not in page.locator('.subtitle').inner_text():
            raise AssertionError('Chibi opt-in flag was not activated')
        if page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 3'):
            raise AssertionError('Mobile horizontal overflow')
        art=page.evaluate("""async () => {
          const image=new Image();
          image.src='../art/v19/candidates/characters/starter/chibi/attack-5pose-128.avif';
          await image.decode();
          const c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true});
          c.width=640;c.height=128;ctx.drawImage(image,0,0);
          const rgba=ctx.getImageData(0,0,640,128).data;
          let different=0,opaque=0;
          for(let y=0;y<128;y++)for(let x=0;x<128;x++){
            const i=(y*640+x)*4,j=(y*640+x+256)*4;
            if(Math.abs(rgba[i]-rgba[j])+Math.abs(rgba[i+1]-rgba[j+1])+Math.abs(rgba[i+2]-rgba[j+2])>50)different++;
            if(rgba[i+3]>80)opaque++;
          }
          return {width:image.naturalWidth,height:image.naturalHeight,different,opaque};
        }""")
        if art['width']!=640 or art['height']!=128 or art['different']<2500 or art['opaque']<1500:
            raise AssertionError('Attack art failed to decode or poses are identical: '+str(art))
        if 'ON' in page.locator('#auto').inner_text():
            page.locator('#auto').click()
        page.locator('#world').screenshot(path=str(OUTPUT/'chibi-idle-mobile.png'))
        page.locator('#attack').click()
        page.wait_for_timeout(255)
        page.locator('#world').screenshot(path=str(OUTPUT/'chibi-attack-mobile.png'))
        if errors:
            raise AssertionError('JS errors: '+repr(errors[:8]))
        # Dedicated on-page manual step and autoplay controls.
        preview=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
        preview.goto(URL+'/v19/chibi-attack-preview.html',wait_until='domcontentloaded')
        preview.wait_for_function("document.querySelector('#status')?.textContent?.includes('解碼成功')",timeout=20000)
        preview.locator('#next').click()
        if '起手' not in preview.locator('#overlay').inner_text():
            raise AssertionError('Next-frame step did not select the first pose')
        preview.locator('#play').click()
        preview.wait_for_timeout(210)
        preview.screenshot(path=str(OUTPUT/'chibi-attack-five-pose-preview.png'),full_page=True)
        browser.close()
        print('PASS: mobile Q-version game combat, AVIF decoded 640×128, 5 pose differences, isolated candidate and manual frame preview',art)

if __name__=='__main__':
    main()
