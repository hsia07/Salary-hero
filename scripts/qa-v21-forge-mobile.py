#!/usr/bin/env python3
"""Real mobile QA: illustrated forge and genuine V19 save transition, no fake rewards."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art/v19/runtime/qa'
OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:8766'
KEY='salary-hero-v19-save-1'

def main():
    exceptions=[]
    save={'version':19,'playerName':'鍛造驗收勇者','auto':False,
          'equipped':'excalibur','forgeLevel':2,'craftingMaterial':8,'rareMaterials':4}
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,
            is_mobile=True,has_touch=True,storage_state={'cookies':[],'origins':[
                {'origin':BASE,'localStorage':[{'name':KEY,'value':json.dumps(save,ensure_ascii=False)}]}
            ]})
        page=context.new_page()
        page.on('pageerror',lambda err:exceptions.append(str(err)))
        page.goto(BASE+'/v19/play.html?dev=1',wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=45000)
        assert page.locator('#today').is_visible(),'salary counter must stay on home'
        assert page.locator('#world').is_visible(),'live combat stage must remain'
        page.locator('#v21-more-toggle').click()
        page.locator('#v21-more-menu button[data-panel="forge"]').click()
        assert page.locator('#panel').is_visible()
        assert page.locator('#v21-forge-atelier').is_visible()
        assert page.locator('.v21-forge-weapon-icon').get_attribute('src').endswith('legend-blade.svg')
        assert page.locator('#v21-forge-atelier').get_attribute('data-forge-level')=='2'
        img=page.locator('.v21-forge-painting')
        assert img.is_visible()
        painted=page.evaluate('''async () => { const img=document.querySelector('.v21-forge-painting'); await img.decode();
          return {width:img.naturalWidth,height:img.naturalHeight,loaded:img.complete}; }''')
        assert painted['width']>=500 and painted['height']>=320,painted
        assert page.locator('.v21-forge-spark').count()==12
        assert page.locator('.v21-forge-hammer').is_enabled()
        page.locator('#panel').screenshot(path=str(OUT/'v21-forge-atelier-390.png'))
        page.locator('.v21-forge-inspect').click()
        assert page.locator('.v21-forge-diorama').evaluate("e=>e.classList.contains('is-striking')"), 'inspect is a real VFX action'
        page.locator('.v21-forge-hammer').click()
        page.wait_for_function('() => document.querySelector("#v21-forge-atelier")?.dataset.forgeLevel==="3"',timeout=5000)
        assert page.locator('.v21-forge-weapon-detail').inner_text().find('+3')>=0
        assert page.locator('.v21-forge-weapon-detail').inner_text().find('+6')>=0
        assert page.locator('.v21-forge-diorama').evaluate("e=>e.classList.contains('is-forged')"), 'successful forge shows a distinct hit+spark animation'
        page.wait_for_timeout(250)
        page.locator('#panel').screenshot(path=str(OUT/'v21-forge-atelier-success-390.png'))
        page.wait_for_function('() => { const s=JSON.parse(localStorage.getItem("salary-hero-v19-save-1")||"{}"); return s.forgeLevel===3&&s.craftingMaterial===5&&s.rareMaterials===3; }',timeout=8000)
        for width,height in [(375,667),(320,568)]:
            page.set_viewport_size({'width':width,'height':height})
            assert page.locator('#v21-forge-atelier').is_visible()
            assert page.locator('.v21-forge-painting').is_visible()
            assert page.evaluate('''() => {const p=document.querySelector('#panel'),b=p.getBoundingClientRect();
                 return b.width<=innerWidth+2&&p.scrollWidth<=p.clientWidth+7&&document.documentElement.scrollWidth<=innerWidth+7;}'''),f'horizontal overflow at {width}'
            if width==320:page.locator('#panel').screenshot(path=str(OUT/'v21-forge-atelier-320.png'))
        assert not exceptions,exceptions
        browser.close()
        print('PASS: 390/375/320 real illustrated forge image, live sparks and true saved upgrade 2->3, no horizontal overflow')

if __name__=='__main__':main()
