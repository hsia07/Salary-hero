#!/usr/bin/env python3
"""Actual 390px Chromium smoke check: normal monster variant renders the same
approved pose sheets, and cannot affect the user's real V19 save. Debug-only.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
KEY='salary-hero-v19-save-1'
DEST=Path(__file__).resolve().parents[1]/'art/v19/runtime/qa'
DEST.mkdir(parents=True,exist_ok=True)

def wait_art(page):
    page.wait_for_function("""() =>
      document.querySelector('#monster-art-status')?.dataset.loaded==='true' &&
      document.querySelector('#attack')?.disabled===false
    """,timeout=45000)

def main():
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':390,'height':844},
            device_scale_factor=2,is_mobile=True,has_touch=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        # Prove a tinted original action frame is drawn in Canvas2D, not only a
        # URL label or altered metadata.
        page.add_init_script("""(() => {
          window.__monsterSkinDraws=0;
          const proto=CanvasRenderingContext2D.prototype;
          const original=proto.drawImage;
          proto.drawImage=function(...args){
            if(typeof this.filter==='string' &&
                this.filter.includes('hue-rotate(') &&
                args.length===9)window.__monsterSkinDraws++;
            return original.apply(this,args);
          };
        })()""")
        page.goto(BASE+'/v19/play.html?training=paper-gremlin&skin=midnight-ink',
            wait_until='domcontentloaded')
        wait_art(page)
        page.wait_for_function("""() =>
            document.querySelector('#world')?.dataset.monsterVariant==='midnight-ink'
            && window.__monsterSkinDraws>0
        """,timeout=10000)
        assert '夜班紫墨紙妖' in page.locator('#enemy-name').inner_text()
        assert '普通怪共用動畫換皮試玩' in page.locator('#training-mode-notice').inner_text()
        assert '2/32' in page.locator('#monster-art-status').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth>innerWidth+3') is False
        page.evaluate('(key)=>localStorage.setItem(key,"ORIGINAL_SAVE_DO_NOT_CHANGE")',KEY)
        page.locator('#world').screenshot(path=str(DEST/'training-normal-skin-midnight.png'))
        before=page.evaluate('window.__monsterSkinDraws')
        page.locator('#attack').click()
        page.wait_for_function('(before)=>window.__monsterSkinDraws>before+3',arg=before,
            timeout=7000)
        assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='ORIGINAL_SAVE_DO_NOT_CHANGE'
        assert not errors,errors
        # A normal unmodified rehearsal must not inherit a previous variant.
        page.goto(BASE+'/v19/play.html?training=paper-gremlin',
            wait_until='domcontentloaded')
        wait_art(page)
        assert page.locator('#world').get_attribute('data-monster-variant') is None
        assert '夜班紫墨紙妖' not in page.locator('#enemy-name').inner_text()
        assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='ORIGINAL_SAVE_DO_NOT_CHANGE'
        browser.close()
    print('PASS: 390px real atlas skin frames, shared attack poses, separate UI, unchanged save and normal fallback.')

if __name__=='__main__':main()
