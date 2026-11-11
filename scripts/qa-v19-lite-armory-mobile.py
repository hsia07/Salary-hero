#!/usr/bin/env python3
"""390px mobile Chromium real-interaction QA for the first Salary Hero Lite loot armory.
Uses throwaway browser storage; never touches the player's production save.
"""
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
KEY='salary-hero-v19-save-1'
ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'art/v19/runtime/qa'
QA.mkdir(parents=True,exist_ok=True)

def make_item(i,template,rarity='rare'):
    return {'instanceId':f'li-{i}', 'templateId':template, 'rarity':rarity,
      'itemLevel':10, 'affixes':[{'id':'attack','value':2},{'id':'crit','value':.025}], 'locked':False}

def main():
    items=[make_item(1,'w-clockblade'),make_item(2,'b-early'),make_item(3,'a-coat')]
    items += [make_item(i,'r-ticket') for i in range(4,26)]
    seed={'version':19,'playerName':'裝備驗收勇者','auto':False,'heroHp':110,'maxHp':110,
      'baseMaxHp':110,'liteInventory':items,'liteItemSeq':25,
      'liteLoadout':{'weapon':None,'armor':None,'badge':None,'relic':None}}
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,
          is_mobile=True,has_touch=True,
          storage_state={'cookies':[],'origins':[{'origin':BASE,
             'localStorage':[{'name':KEY,'value':json.dumps(seed,ensure_ascii=False)}]}]})
        page=context.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE+'/v19/play.html',wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=40000)
        assert not page.locator('#name-dialog').evaluate('(d)=>d.open')
        assert page.evaluate('document.documentElement.scrollWidth > innerWidth+3') is False
        assert 'NT$' in page.locator('#today').inner_text()
        page.locator('button[data-panel="equipment"]').click()
        assert page.locator('#panel').is_visible()
        assert '25/120' in page.locator('.lite-armory-title').inner_text()
        assert page.locator('.lite-item').count()==20
        assert page.locator('button[data-action="liteNext"]').count()==1
        page.locator('button[data-action="liteNext"]').click()
        assert page.locator('.lite-item').count()==5
        # Oldest items are on page 2: verify a player can equip them there.
        page.locator('button[data-action="liteEquip"][data-value="li-1"]').click()
        page.locator('button[data-action="liteEquip"][data-value="li-2"]').click()
        text=page.locator('#panel-content').inner_text()
        assert '準時下班協定' in text
        state=lambda: page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        assert state()['liteLoadout']['weapon']=='li-1'
        assert state()['liteLoadout']['badge']=='li-2'
        page.locator('.lite-armory').screenshot(path=str(QA/'lite-armory-mobile.png'),animations='disabled')
        page.locator('button[data-action="liteLock"][data-value="li-3"]').click()
        assert state()['liteInventory'][2]['locked'] is True
        assert page.locator('button[data-action="liteSalvage"][data-value="li-3"]').is_disabled()
        page.locator('button[data-action="liteLock"][data-value="li-3"]').click()
        before=state()['gold']
        page.locator('button[data-action="liteSalvage"][data-value="li-3"]').click()
        assert state()['gold']==before,'first salvage tap must not destroy item'
        assert '確定分解' in page.locator('button[data-action="liteSalvage"][data-value="li-3"]').inner_text()
        page.locator('button[data-action="liteSalvage"][data-value="li-3"]').click()
        assert state()['gold']>before
        assert len(state()['liteInventory'])==24
        page.locator('button[data-action="litePrevious"]').click()
        assert page.locator('.lite-item').count()==20
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=40000)
        assert state()['liteLoadout']['weapon']=='li-1'
        assert state()['liteLoadout']['badge']=='li-2'
        assert len(state()['liteInventory'])==24
        assert 'NT$' in page.locator('#today').inner_text()
        assert not errors,errors
        context.close()

        # A second isolated phone resumes after two hours offline.
        offline_seed={'version':19,'playerName':'離線驗收勇者','auto':True,
          'liteLastSeenAt':int(time.time()*1000)-120*60000}
        offline_context=browser.new_context(viewport={'width':390,'height':844},
          device_scale_factor=2,is_mobile=True,has_touch=True,
          storage_state={'cookies':[],'origins':[{'origin':BASE,
            'localStorage':[{'name':KEY,'value':json.dumps(offline_seed,ensure_ascii=False)}]}]})
        offline=offline_context.new_page()
        offline.on('pageerror',lambda e:errors.append(str(e)))
        offline.goto(BASE+'/v19/play.html',wait_until='domcontentloaded')
        offline.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=40000)
        report=offline.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        assert report['liteOfflineReport'] is not None,'offline payout must be persisted'
        assert report['liteOfflineReport']['minutes']>=120
        assert report['liteOfflineReport']['gold']>=240
        assert report['liteOfflineReport']['items']==2
        assert offline.locator('#lite-offline-report').is_visible()
        if 'ON' in offline.locator('#auto').inner_text():
            offline.locator('#auto').click()
        offline.locator('#lite-offline-dismiss').click()
        assert offline.locator('#lite-offline-report').is_hidden()
        offline.locator('button[data-panel="equipment"]').click()
        offline.locator('button[data-action="liteSetAuto"]').click()
        offline.locator('button[data-action="liteSetStrategy"][data-value="survival"]').click()
        offline.locator('button[data-action="liteAutoOptimize"]').click()
        configured=offline.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        assert configured['liteAutoEquip'] is True
        assert configured['liteAutoStrategy']=='survival'
        assert configured['liteOfflineReport'] is None
        assert 'NT$' in offline.locator('#today').inner_text()
        offline.locator('#panel-close').click()
        offline.reload(wait_until='domcontentloaded')
        offline.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=40000)
        reloaded=offline.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        assert reloaded['liteOfflineReport'] is None
        assert len(reloaded['liteInventory'])==len(configured['liteInventory'])
        assert reloaded['gold']==configured['gold'],'offline payout must never duplicate on reload'
        assert reloaded['liteAutoEquip'] is True
        assert reloaded['liteAutoStrategy']=='survival'
        assert not errors,errors
        offline_context.close()
        browser.close()
    print('PASS: mobile gear, lock/salvage, paging, two-hour offline payout exactly once, dismiss, trustee strategies and salary display.')

if __name__=='__main__':
    main()
