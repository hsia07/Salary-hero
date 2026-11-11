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
          'petFood':2,'petLevel':2,'skinTickets':4,'chests':1}
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,
            is_mobile=True,has_touch=True,storage_state={'cookies':[],'origins':[{
                'origin':BASE,'localStorage':[{'name':KEY,'value':json.dumps(seed,ensure_ascii=False)}]}]})
        page=context.new_page()
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(BASE+'/v19/play.html?dev=1',wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#attack")?.disabled===false',timeout=40000)
        assert page.locator('#app').get_attribute('data-home-version')=='v20-reference-layout'
        assert page.locator('#town-stage').is_visible()
        assert page.locator('#world').is_visible()
        assert page.locator('.battle-deck').is_visible()
        assert page.locator('#v20-stage-progress').is_visible()
        assert page.locator('#v20-stage-pips .v20-stage-pip').count()==4
        assert page.locator('#v20-stage-pips .is-current').count()==1
        assert '第 1 關' in page.locator('#v20-wave-text').inner_text()
        assert page.locator('#v20-pet-level').inner_text()=='Lv.2'
        assert page.locator('#v20-loot-count').inner_text()=='0'
        assert page.locator('#v20-stage-chest').is_enabled()
        assert page.locator('#v20-loot-preview').is_visible()
        assert page.evaluate("""() => {
          const rail=document.querySelector('.mini-actions').getBoundingClientRect();
          const hp=document.querySelector('.battle-deck .bars').getBoundingClientRect();
          return rail.bottom<=hp.top+6;
        }"""),'right loot panel obscures the live HP bars'
        assert page.locator('#v20-loot-item-art').get_attribute('src').endswith('worn-briefcase.svg')
        assert page.locator('#v20-loot-preview').get_attribute('data-loot-tier')=='none'
        assert page.evaluate("""() => {
          const scene=document.querySelector('.battle-deck .scene').getBoundingClientRect();
          const stage=document.querySelector('#v20-stage-progress').getBoundingClientRect();
          const battle=document.querySelector('#battle-deck').getBoundingClientRect();
          const dock=document.querySelector('.tabs').getBoundingClientRect();
          return stage.bottom<=battle.top+2 && battle.bottom<=dock.top+2
              && scene.height>180;
        }"""),'stage tracker, battle, or dock overlaps'
        assert page.locator('.tabs button').count()==8
        assert page.locator('.storybook-nav-art').count()==8
        assert page.evaluate("""() => getComputedStyle(document.querySelector('.tabs button')).borderImageSource.includes('royal-nav-frame.webp')"""),'hand-painted nav frame missing'
        assert page.evaluate("""() => getComputedStyle(document.querySelector('.town-stage .pay')).borderImageSource.includes('royal-pay-frame.webp')"""),'salary frame missing'
        assert page.evaluate("""() => getComputedStyle(document.querySelector('.mini-actions')).borderImageSource.includes('royal-loot-frame.webp')"""),'loot rail frame missing'

        assert page.locator('#world').get_attribute('data-scene-art')=='v20-library-p10-loaded', 'Canvas uses fallback rather than new WebP art'
        assert page.evaluate("""() => getComputedStyle(document.querySelector('#town-stage')).backgroundImage.includes('town-library-v20-p11.webp')""")
        assert page.evaluate("""() => [...document.querySelectorAll('.tabs .storybook-nav-art use')].every(x=>(x.getAttribute('href')||'').startsWith('#storybook-'))""")
        # iOS Safari requires local inline symbols rather than external SVG <use>.
        assert page.locator('#storybook-inline-symbols symbol[id^="storybook-"]').count()==8
        assert page.locator('#storybook-inline-symbols symbol[id^="v20-"]').count()==5
        assert page.evaluate("""() => [...document.querySelectorAll('#storybook-inline-symbols [id]')].every(e=>e.id==='storybook-inline-symbols'||e.id.startsWith('storybook-')||e.id.startsWith('v20-'))"""),'SVG names must never collide with application state IDs'
        assert page.evaluate("""() => [...document.querySelectorAll('.tabs .storybook-nav-art use')].every(x=>
           document.getElementById((x.getAttribute('href')||'').slice(1))
        )""")
        # A 200 OK SVG can still be invalid or render an empty <use> icon.
        assets=page.evaluate("""async () => {
          const urls=[
            '../art/v20/runtime/backgrounds/town-library-v20-p11.webp',
            '../art/v20/runtime/backgrounds/battle-library-v20-p10.webp',
            '../art/v19/runtime/ui/storybook-icons.svg'
          ];
          const decoded=[];
          for(const url of urls){
            const image=new Image();image.src=url;
            await image.decode();
            decoded.push([image.naturalWidth,image.naturalHeight]);
          }
          return decoded;
        }""")
        assert assets[0]==[960,560],('P0.11 town painting dimensions',assets)
        assert assets[1]==[720,620],('P0.10 battle painting dimensions',assets)
        assert all(w>10 and h>10 for w,h in assets),assets
        nav_bounds=page.evaluate("""() => [...document.querySelectorAll('.tabs .storybook-nav-art')].map(svg=>{
           const b=svg.getBBox();return [b.width,b.height];
        })""")
        assert all(w>10 and h>10 for w,h in nav_bounds),nav_bounds

        assert page.locator('#today').inner_text().startswith('NT$')
        assert '試玩勇者' in page.locator('#town-player-name').inner_text()
        # This one-screen home must display text values as well as currency icons.
        assert page.evaluate("""() => document.querySelectorAll('[id="gold"]').length===1 &&
           document.querySelector('#gold').tagName.toLowerCase()==='b'"""),'SVG ID collision with real gold'
        assert page.locator('#gold').inner_text().strip()=='895','real 895 gold count was hijacked by SVG defs'
        assert page.locator('.v20-resource-icon').count()==3
        assert page.locator('#gold').is_visible()
        assert page.locator('#gems').is_visible()
        assert page.locator('#skin-tickets').is_visible()
        assert page.evaluate("""() => ['gold','gems','skin-tickets'].every(id=>{
          const e=document.getElementById(id),r=e.getBoundingClientRect();
          return r.width>=8&&r.height>=8;
        })""")
        # Synthetic report exercises ONLY layout, never grants or changes rewards.
        page.evaluate("""() => {const e=document.querySelector('#lite-offline-report');
          e.hidden=false;document.querySelector('#lite-offline-summary').textContent='🌙 離線 +78 金幣';
        }""")
        assert page.evaluate("""() => {
          const p=document.querySelector('#lite-offline-report').getBoundingClientRect();
          const h=document.querySelector('.battle-heading').getBoundingClientRect();
          const scene=document.querySelector('.scene').getBoundingClientRect();
          return p.top>=h.top-1 && p.bottom<=h.bottom+2 && p.bottom<=scene.top+2;
        }"""),'offline report overlaps live actors'
        page.screenshot(path=str(OUT/'portrait-compact-offline-hud.png'),full_page=False)
        page.evaluate("""() => document.querySelector('#lite-offline-report').hidden=true""")
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+3'), 'portrait horizontal overflow'
        assert page.evaluate('document.querySelector("#town-stage").getBoundingClientRect().height >=190')
        assert page.evaluate('document.querySelector("#v20-stage-progress").getBoundingClientRect().height>=30')
        assert page.locator('#town-clock-time').inner_text().count(':')==1
        assert page.locator('.town-star').count()>=4
        assert not page.locator('.dev-gallery').is_visible()
        def no_scroll():
            return page.evaluate("""() => {
              const h=innerHeight;
              const app=document.querySelector('#app').getBoundingClientRect();
              const dock=document.querySelector('.tabs').getBoundingClientRect();
              const battle=document.querySelector('#battle-deck').getBoundingClientRect();
              const town=document.querySelector('#town-stage').getBoundingClientRect();
              return {
                height:h,
                scrollHeight:document.scrollingElement.scrollHeight,
                horizontal:document.scrollingElement.scrollWidth,
                appTop:app.top,
                appBottom:app.bottom,
                dockTop:dock.top,
                dockBottom:dock.bottom,
                townHeight:town.height,
                battleHeight:battle.height,
                controlsVisible:document.querySelector('#attack').getBoundingClientRect().bottom<=battle.bottom
              };
            }""")
        metrics=no_scroll()
        assert metrics['scrollHeight']<=metrics['height']+2,metrics
        assert metrics['appBottom']<=metrics['height']+2,metrics
        assert metrics['dockBottom']<=metrics['height']+2,metrics
        assert metrics['dockTop']>=0,metrics
        assert metrics['controlsVisible'],metrics

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
        page.locator('#v20-stage-entry').click()
        assert '冒險' in page.locator('#panel-title').inner_text()
        page.locator('#panel-close').click()
        page.locator('#v20-loot-preview').click()
        assert '裝備' in page.locator('#panel-title').inner_text()
        page.locator('#panel-close').click()
        page.locator('#v20-pet-shortcut').click()
        assert '寵物' in page.locator('#panel-title').inner_text()
        page.locator('#panel-close').click()
        # The stage chest shortcut delegates to the real chest open action once.
        chest_before=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).chests',KEY)
        page.locator('#v20-stage-chest').click()
        chest_after=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).chests',KEY)
        assert chest_after==chest_before-1,(chest_before,chest_after)
        assert page.locator('#v20-stage-chest').is_disabled()
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
        assert page.evaluate("""() => {
          const scene=document.querySelector('.battle-deck .scene').getBoundingClientRect();
          const ticker=document.querySelector('#game-log').getBoundingClientRect();
          return ticker.top>=scene.bottom-2 && ticker.height>=15 && ticker.height<=25;
        }"""),'combat message ticker overlaps actor HP bars'
        assert 'NT$' in page.locator('#today').inner_text()
        assert page.locator('#monster-art-status').is_hidden()
        page.locator('#portrait-dev-toggle').click()
        assert page.locator('.dev-gallery').is_visible()
        assert page.locator('#portrait-dev-toggle').get_attribute('aria-expanded')=='true'
        page.locator('#portrait-dev-toggle').click()
        assert page.locator('.dev-gallery').is_hidden()

        page.screenshot(path=str(OUT/'portrait-home-390-mobile.png'),full_page=False,animations='disabled')
        page.screenshot(path=str(OUT/'portrait-home-full-scroll.png'),full_page=True,animations='disabled')
        # The home remains exactly one screen in short in-app browsers as well.
        for width,height in [(375,667),(320,568)]:
            page.set_viewport_size({'width':width,'height':height})
            page.wait_for_timeout(120)
            metrics=no_scroll()
            assert metrics['scrollHeight']<=metrics['height']+2,(width,height,metrics)
            assert metrics['dockBottom']<=metrics['height']+2,(width,height,metrics)
            assert metrics['townHeight']>=110,(width,height,metrics)
            assert metrics['battleHeight']>=240,(width,height,metrics)
            assert metrics['controlsVisible'],(width,height,metrics)
            assert page.evaluate('document.scrollingElement.scrollWidth<=innerWidth+3')
            assert page.locator('#attack').is_visible()
            assert page.locator('#town-cat').is_visible()
            assert page.locator('.tabs button').count()==8
            assert page.locator('#v20-stage-progress').is_visible()
            assert page.locator('#v20-stage-pips .v20-stage-pip').count()==4
            assert page.evaluate("""() => {
              const stage=document.querySelector('#v20-stage-progress').getBoundingClientRect();
              const battle=document.querySelector('#battle-deck').getBoundingClientRect();
              const dock=document.querySelector('.tabs').getBoundingClientRect();
              const left=document.querySelector('#auto').getBoundingClientRect();
              const right=document.querySelector('#v20-loot-preview').getBoundingClientRect();
              return stage.bottom<=battle.top+2 && battle.bottom<=dock.top+2
                 && left.right<right.left && left.top>=battle.top && right.top>=battle.top;
            }"""),(width,height,'left/right controls overlap' )
            if width==320:
                assert page.evaluate('getComputedStyle(document.querySelector(".tabs")).gridTemplateRows.split(" ").length')==1
                page.locator('#town-stage .pay').click()
                assert '薪資' in page.locator('#panel-title').inner_text()
                page.locator('#panel-close').click()
            page.screenshot(path=str(OUT/f'portrait-one-screen-{width}x{height}.png'),full_page=False)
        page.set_viewport_size({'width':390,'height':844})
        page.screenshot(path=str(OUT/'portrait-one-screen-390x844.png'),full_page=False)
        # Real art must load in the browser.
        for url in [
            '/art/v19/runtime/portrait/cat-companion.svg',
            '/art/v19/runtime/portrait/coffee-mug.svg',
            '/art/v19/candidates/characters/starter/chibi/idle-candidate.webp',
            '/v19/portrait-one-screen.css',
            '/v19/storybook-skin.css',
            '/v19/iphone-hud-fixes.css',
            '/v19/v20-home.css',
            '/v19/v20-royal-material.css',
            '/v19/v20-scene-light.mjs',
            '/v19/v20-battle-stage.mjs',
            '/v19/v20-p09-composition.css',
            '/v19/v20-p11-town.css',
            '/art/v20/runtime/backgrounds/town-library-v20-p11.webp',
            '/art/v20/runtime/ui/royal-nav-frame.webp',
            '/art/v20/runtime/ui/royal-pay-frame.webp',
            '/art/v20/runtime/ui/royal-loot-frame.webp',
            '/art/v20/runtime/backgrounds/battle-library-v20-p10.webp',
            '/v19/v20-home.mjs',
            '/art/v19/runtime/backgrounds/storybook-office.svg',
            '/art/v19/runtime/backgrounds/storybook-corridor.svg',
            '/art/v19/runtime/ui/storybook-icons.svg',
            '/v19/portrait-home.css',
            '/v19/portrait-home.mjs']:
            resp=page.request.get(BASE+url)
            assert resp.status==200,url
        assert not errors,errors
        browser.close()
    print('PASS: V20 five-zone single-screen, real four-wave tracker/chest, loot panel, salary, combat and eight-nav QA on 390,375,320px')
if __name__=='__main__':
    main()
