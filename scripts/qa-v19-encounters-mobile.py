#!/usr/bin/env python3
"""Mobile Chromium end-to-end QA for the real V19 daily encounter storybook.

Two independent browser profiles prove manual/automatic modes, one-day reward
protection, journal persistence and the original salary/monster surface.
Never edits a real player's localStorage or GitHub Pages production save.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
KEY='salary-hero-v19-save-1'
ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'art/v19/runtime/qa'
QA.mkdir(parents=True,exist_ok=True)

def context(browser,auto_encounter=False):
    seed={
        'version':19,'playerName':'奇遇測試勇者','auto':False,
        'autoEncounter':auto_encounter,'heroHp':110,'maxHp':110,
        'encounterDay':'','encounterPending':None,'encounterHistory':[],
        'skinTickets':0
    }
    return browser.new_context(
        viewport={'width':390,'height':844},device_scale_factor=2,
        is_mobile=True,has_touch=True,
        storage_state={'cookies':[],'origins':[{
            'origin':BASE,
            'localStorage':[{'name':KEY,'value':json.dumps(seed,ensure_ascii=False)}]
        }]}
    )

def state(page):
    return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))',KEY)

def ready(page):
    page.goto(BASE+'/v19/play.html',wait_until='domcontentloaded')
    page.wait_for_function("""() => {
      const btn=document.querySelector('#attack');
      const art=document.querySelector('#monster-art-status');
      return btn && btn.disabled===false && art?.dataset?.loaded==='true';
    }""",timeout=40000)
    assert not page.locator('#name-dialog').evaluate('(d)=>d.open'),'test nickname not restored'
    assert page.evaluate('document.documentElement.scrollWidth > innerWidth+3') is False

def main():
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        manual_context=context(browser,False)
        page=manual_context.new_page()
        page.on('pageerror',lambda err:errors.append(str(err)))
        ready(page)
        # V21 has one stage: daily office encounters are reached after switching
        # to the office view; combat and real salary continue in the background.
        page.locator('#v21-view-office').click()
        assert page.locator('#town-stage').is_visible()
        assert 'NT
        page.locator('button[data-panel="adventure"]').click()
        assert '智慧平衡託管 OFF' in page.locator('#panel-content').inner_text()
        assert page.locator('#panel-content .encounter-diorama').is_visible()
        page.locator('#panel-content button[data-action="encounterStart"]').click()
        assert page.locator('.encounter-choice').count()==2
        assert page.locator('.encounter-diorama h3').inner_text().strip()
        # Capture the mobile story scene without downloading or uploading user art.
        page.locator('#panel').screenshot(path=str(QA/'encounter-storybook-mobile.png'),
             animations='disabled')
        page.locator('.encounter-choice').nth(1).click()
        complete=state(page)
        assert complete['encounterPending'] is None
        assert len(complete['encounterHistory'])==1
        assert complete['skinTickets']==1
        assert complete['autoEncounter'] is False
        assert '今日冒險紀錄' in page.locator('#panel-content').inner_text()
        assert page.locator('#panel-content button[data-action="encounterStart"]').count()==0
        # Opening this same panel again does not award a second ticket.
        page.locator('#panel-close').click()
        page.locator('button[data-panel="adventure"]').click()
        assert state(page)['skinTickets']==1
        page.locator('.encounter-auto-toggle').click()
        assert state(page)['autoEncounter'] is True
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false')
        persisted=state(page)
        assert persisted['autoEncounter'] is True
        assert len(persisted['encounterHistory'])==1
        assert persisted['skinTickets']==1
        manual_context.close()

        # Separate simulated mobile player's storage: auto must complete once,
        # but only when explicitly opted in, and with combat auto disabled.
        auto_context=context(browser,True)
        automatic=auto_context.new_page()
        automatic.on('pageerror',lambda err:errors.append(str(err)))
        ready(automatic)
        automatic.wait_for_function("""(key) => {
          const s=JSON.parse(localStorage.getItem(key)||'null');
          return s?.encounterDay && !s.encounterPending && s.encounterHistory?.length===1;
        }""",arg=KEY,timeout=10000)
        auto_state=state(automatic)
        assert auto_state['autoEncounter'] is True
        assert auto_state['skinTickets']==1
        assert auto_state['auto'] is False
        automatic.wait_for_timeout(1250)
        assert state(automatic)['skinTickets']==1,'auto minted duplicate daily ticket'
        assert len(state(automatic)['encounterHistory'])==1
        assert 'NT$' in automatic.locator('#today').inner_text()
        auto_context.close()
        assert not errors,'JavaScript runtime error: '+repr(errors)
        browser.close()
    print('PASS: mobile storybook scene, eight-route gameplay, manual opt-in, risk journal, persisted save, auto daily exactly once, salary preserved.')

if __name__=='__main__':
    main()
 in page.locator('#today').inner_text()
        page.locator('button[data-panel="adventure"]').click()
        assert '智慧平衡託管 OFF' in page.locator('#panel-content').inner_text()
        assert page.locator('#panel-content .encounter-diorama').is_visible()
        page.locator('#panel-content button[data-action="encounterStart"]').click()
        assert page.locator('.encounter-choice').count()==2
        assert page.locator('.encounter-diorama h3').inner_text().strip()
        # Capture the mobile story scene without downloading or uploading user art.
        page.locator('#panel').screenshot(path=str(QA/'encounter-storybook-mobile.png'),
             animations='disabled')
        page.locator('.encounter-choice').nth(1).click()
        complete=state(page)
        assert complete['encounterPending'] is None
        assert len(complete['encounterHistory'])==1
        assert complete['skinTickets']==1
        assert complete['autoEncounter'] is False
        assert '今日冒險紀錄' in page.locator('#panel-content').inner_text()
        assert page.locator('#panel-content button[data-action="encounterStart"]').count()==0
        # Opening this same panel again does not award a second ticket.
        page.locator('#panel-close').click()
        page.locator('button[data-panel="adventure"]').click()
        assert state(page)['skinTickets']==1
        page.locator('.encounter-auto-toggle').click()
        assert state(page)['autoEncounter'] is True
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false')
        persisted=state(page)
        assert persisted['autoEncounter'] is True
        assert len(persisted['encounterHistory'])==1
        assert persisted['skinTickets']==1
        manual_context.close()

        # Separate simulated mobile player's storage: auto must complete once,
        # but only when explicitly opted in, and with combat auto disabled.
        auto_context=context(browser,True)
        automatic=auto_context.new_page()
        automatic.on('pageerror',lambda err:errors.append(str(err)))
        ready(automatic)
        automatic.wait_for_function("""(key) => {
          const s=JSON.parse(localStorage.getItem(key)||'null');
          return s?.encounterDay && !s.encounterPending && s.encounterHistory?.length===1;
        }""",arg=KEY,timeout=10000)
        auto_state=state(automatic)
        assert auto_state['autoEncounter'] is True
        assert auto_state['skinTickets']==1
        assert auto_state['auto'] is False
        automatic.wait_for_timeout(1250)
        assert state(automatic)['skinTickets']==1,'auto minted duplicate daily ticket'
        assert len(state(automatic)['encounterHistory'])==1
        assert 'NT$' in automatic.locator('#today').inner_text()
        auto_context.close()
        assert not errors,'JavaScript runtime error: '+repr(errors)
        browser.close()
    print('PASS: mobile storybook scene, eight-route gameplay, manual opt-in, risk journal, persisted save, auto daily exactly once, salary preserved.')

if __name__=='__main__':
    main()
