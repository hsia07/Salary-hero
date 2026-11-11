#!/usr/bin/env python3
"""Real phone Chromium UI smoke test of the in-game V21 research lab."""
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
    save={'version':19,'playerName':'研究試玩','level':12,'gold':895,'gems':17,'auto':False}
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,
            device_scale_factor=2,storage_state={'cookies':[],'origins':[{'origin':BASE,'localStorage':[
                {'name':KEY,'value':json.dumps(save,ensure_ascii=False)}]}]})
        page=context.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE+'/v19/play.html',wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=40000)
        before=page.evaluate('(key)=>({gold:JSON.parse(localStorage.getItem(key)).gold,gems:JSON.parse(localStorage.getItem(key)).gems,keys:Object.keys(localStorage).sort()})',KEY)
        page.locator('#v21-more-toggle').click()
        assert page.locator('#v21-open-research').is_visible()
        page.locator('#v21-open-research').click()
        assert page.locator('#panel').is_visible()
        assert '戰術研究室' in page.locator('#panel-title').inner_text()
        assert page.locator('.v21-lab-unit').count()==6
        assert page.locator('[data-lab-field="slot"]').count()==6
        assert page.locator('[data-lab-field="slot"]').first.locator('option').count()==13
        assert page.locator('#v21-lab-report').count()==0
        page.locator('button[data-lab-action="simulate"]').click()
        assert page.locator('#v21-lab-report').is_visible()
        assert '總傷害' in page.locator('#v21-lab-report').inner_text()
        page.locator('button[data-lab-action="save-a"]').click()
        # Fusion needs an extra mecha imprint. No item/trait touches real inventory.
        page.locator('.v21-lab-unit').nth(4).locator('summary').click()
        page.locator('[data-lab-field="imprint"]').nth(4).select_option('mecha')
        assert '1/2' in page.locator('.v21-lab-overview').inner_text()
        page.locator('[data-lab-field="fusion"]').select_option('perpetual-overtime')
        assert '永動加班' in page.locator('.v21-lab-section').nth(1).inner_text()
        page.locator('.v21-lab-unit').nth(5).locator('summary').click()
        page.locator('[data-lab-field="gear"]').nth(5).select_option('machine-manual')
        page.locator('button[data-lab-action="simulate"]').click()
        assert page.locator('#v21-lab-report').is_visible()
        page.locator('button[data-lab-action="save-b"]').click()
        page.locator('button[data-lab-action="compare"]').click()
        assert page.locator('#v21-lab-comparison').is_visible()
        assert '勝利場次' in page.locator('#v21-lab-comparison').inner_text()
        assert page.locator('#v21-lab-comparison tbody tr').count()==6
        # Switch boss to confirm battle laboratory has actual counter testing.
        page.locator('[data-lab-field="enemy"]').select_option('anti-summon')
        page.locator('button[data-lab-action="compare"]').click()
        assert '機甲拆解師' in page.locator('#v21-lab-comparison').inner_text()
        page.screenshot(path=str(OUT/'v21-research-lab-390-mobile.png'),animations='disabled',full_page=False)
        page.locator('#panel-close').click()
        after=page.evaluate('(key)=>({gold:JSON.parse(localStorage.getItem(key)).gold,gems:JSON.parse(localStorage.getItem(key)).gems,keys:Object.keys(localStorage).sort()})',KEY)
        assert before==after,(before,after)
        assert page.locator('#world').is_visible()
        assert page.evaluate('document.scrollingElement.scrollHeight<=innerHeight+2')
        page.set_viewport_size({'width':320,'height':568})
        page.locator('#v21-more-toggle').click()
        page.locator('#v21-open-research').click()
        assert page.locator('#panel').is_visible()
        assert page.locator('.v21-lab-unit').count()==6
        assert page.evaluate('document.scrollingElement.scrollHeight<=innerHeight+2'), 'home starts scrolling on narrow devices'
        assert page.evaluate('document.querySelector("#panel").scrollHeight>document.querySelector("#panel").clientHeight')
        page.screenshot(path=str(OUT/'v21-research-lab-320-mobile.png'),animations='disabled',full_page=False)
        assert not errors,errors
        context.close();browser.close()
        print('PASS V21 lab mobile 390x844 and 320x568: simulation, fusion, imprint, gear, A/B, salary/save isolation')
if __name__=='__main__': main()
