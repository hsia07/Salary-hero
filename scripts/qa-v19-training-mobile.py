#!/usr/bin/env python3
"""End-to-end mobile QA of the REAL V19 combat training, no mocks or uploads.

Starts against two genuinely illustrated sprites and asserts the normal V19
localStorage save is byte-for-byte unchanged after attacking in rehearsal.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
OUT=Path(__file__).resolve().parents[1]/'art/v19/runtime/qa'
OUT.mkdir(parents=True,exist_ok=True)
SAVE_KEY='salary-hero-v19-save-1'

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
    assert '2/32' in page.locator('#monster-art-status').inner_text()
    # Validate the actual raster art decodes in-browser, not just in a manifest.
    frames=page.evaluate("""async (name) => {
      const suffix=name==='coffee-mimic'?'.webp':'.png';
      const img=new Image();
      img.src='../art/v19/runtime/monsters/'+name+'/attack'+suffix;
      await img.decode();
      return [img.naturalWidth,img.naturalHeight];
    }""",species)
    assert frames==[1600,320],f'actual animation pixels missing {species}: {frames}'
    page.locator('#world').screenshot(path=str(OUT/('training-'+species+'-idle.png')))
    hp_before=int(page.locator('#hero-hp-text').inner_text().split('/')[0])
    assert hp_before==900
    page.locator('#attack').click()
    page.wait_for_timeout(520)
    page.locator('#world').screenshot(path=str(OUT/('training-'+species+'-hero-hit.png')))
    assert int(page.locator('#hero-hp-text').inner_text().split('/')[0])==hp_before, 'premature HP loss before projectile flies: '+str(page.locator('#world').get_attribute('data-hp-timing'))
    page.wait_for_timeout(610)
    page.locator('#world').screenshot(path=str(OUT/('training-'+species+'-counterattack.png')))
    assert int(page.locator('#hero-hp-text').inner_text().split('/')[0])==hp_before, 'HP changed before coffee/paper projectile contact: '+str(page.locator('#world').get_attribute('data-hp-timing'))
    page.wait_for_timeout(180)
    page.locator('#world').screenshot(path=str(OUT/('training-'+species+'-hurt-red-flash.png')))
    assert int(page.locator('#hero-hp-text').inner_text().split('/')[0])<hp_before, 'visible HP should change AFTER projectile impact'
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
