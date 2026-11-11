#!/usr/bin/env python3
"""True 390x844 portrait-home browser QA, no fake screenshots or altered user save."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art/v19/runtime/qa'
OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:8766'
KEY='salary-hero-v19-save-1'
def main():
    errors=[]
    seed={'version':19,'playerName':'試玩勇者','auto':False,'level':13,'gold':895,'gems':17,
          'petFood':2,'petLevel':2,'skinTickets':4}
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,
            is_mobile=True,has_touch=True,storage_state={'cookies':[],'origins':[{
                'origin':BASE,'localStorage':[{'name':KEY,'value':json.dumps(seed,ensure_ascii=False)}]}]})
        page=context.new_page()
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(BASE+'/v19/play.html',wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=40000)
        assert page.locator('#app').get_attribute('data-home-version')=='portrait-v19-34'
        assert page.locator('#town-stage').is_visible()
        assert page.locator('#world').is_visible()
        assert page.locator('.battle-deck').is_visible()
        assert page.locator('.tabs button').count()==8
        assert page.locator('#today').inner_text().startswith('NT$')
        assert '試玩勇者' in page.locator('#town-player-name').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+3'), 'portrait horizontal overflow'
        assert page.evaluate('document.querySelector("#town-stage").getBoundingClientRect().height >=200')
        assert page.locator('#town-clock-time').inner_text().count(':')==1
        assert page.locator('.town-star').count()>=4
        assert not page.locator('.dev-gallery').is_visible()

        # Every main scene hotspot is an accessible, actual button.
        page.locator('#town-cat').click()
        assert page.locator('#town-speech').is_visible()
        assert '喵' in page.locator('#town-speech').inner_text()
        page.locator('#town-coffee').click()
        assert page.locator('#town-toast').is_visible()
        assert page.locator('#town-toast').inner_text().find('不扣藥水')>=0
        page.locator('#town-hero').click()
        assert '角色' in page.locator('#panel-title').inner_text()
        page.locator('#panel-close').click()
        page.locator('#town-clock').click()
        assert '薪資' in page.locator('#panel-title').inner_text()
        assert 'NT$' in page.locator('#panel-content').inner_text()
        page.locator('#panel-close').click()
        page.locator('#town-task').click()
        assert '奇遇' in page.locator('#panel-title').inner_text()
        page.locator('#panel-close').click()
        page.locator('.battle-bestiary').click()
        assert '圖鑑' in page.locator('#panel-title').inner_text()
        page.locator('#panel-close').click()

        # Portrait nav is not merely decorative.
        for name,keyword in [('hero','角色'),('modes','冒險'),('equipment','裝備'),('forge','鍛造'),
                             ('pets','寵物'),('guild','公會'),('shop','商店')]:
            page.locator(f'.tabs button[data-panel="{name}"]').click()
            assert page.locator('#panel').is_visible(),name
            assert keyword in page.locator('#panel-title').inner_text(),name
            page.locator('#panel-close').click()
        # The pet screen is wired to the existing REAL pet feeding game rules.
        page.locator('.tabs button[data-panel="pets"]').click()
        before=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        page.locator('#panel-content button[data-action="feedPet"]').click()
        after=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        assert after['petFood']==before['petFood']-1
        assert after['petXp']>before['petXp']
        page.locator('#panel-close').click()
        page.locator('.tabs button[data-panel="forge"]').click()
        assert page.locator('#panel-content button[data-action="forge"]').count()==1
        page.locator('#panel-close').click()
        page.locator('.tabs button[data-home]').click()
        assert page.locator('.tabs button[data-home]').get_attribute('aria-current')=='page'
        assert page.locator('.tabs button.is-active').count()==1

        # Old combat is still live, not baked into the background.
        hp=page.locator('#enemy-hp-fill').get_attribute('style')
        page.locator('#attack').click()
        page.wait_for_function('() => document.querySelector("#world")?.dataset.art!==undefined',timeout=12000)
        assert page.locator('#world').get_attribute('width') is not None
        assert page.locator('#attack').is_visible()
        assert 'NT$' in page.locator('#today').inner_text()
        assert page.locator('#monster-art-status').is_hidden()
        page.locator('#portrait-dev-toggle').click()
        assert page.locator('.dev-gallery').is_visible()
        assert page.locator('#portrait-dev-toggle').get_attribute('aria-expanded')=='true'
        page.locator('#portrait-dev-toggle').click()
        assert page.locator('.dev-gallery').is_hidden()

        page.screenshot(path=str(OUT/'portrait-home-390-mobile.png'),full_page=False,animations='disabled')
        page.screenshot(path=str(OUT/'portrait-home-full-scroll.png'),full_page=True,animations='disabled')
        # Real art must load in the browser.
        for url in [
            '/art/v19/runtime/portrait/cat-companion.svg',
            '/art/v19/runtime/portrait/coffee-mug.svg',
            '/art/v19/candidates/characters/starter/chibi/idle-candidate.webp',
            '/v19/portrait-home.css',
            '/v19/portrait-home.mjs']:
            resp=page.request.get(BASE+url)
            assert resp.status==200,url
        assert not errors,errors
        browser.close()
    print('PASS: portrait mobile 390px, salary, interactive office, eight nav pages, real pet feeding, live combat, QA drawer and no JS errors')
if __name__=='__main__':
    main()
