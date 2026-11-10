#!/usr/bin/env python3
"""Visual smoke test: real mobile browser paint, artwork load, click interaction and screenshot."""
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
 root=Path(__file__).resolve().parents[1]
 output=root/'art/v19/runtime/qa'
 output.mkdir(parents=True,exist_ok=True)
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,
                        is_mobile=True,has_touch=True)
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto('http://127.0.0.1:8766/v19/play.html',wait_until='domcontentloaded')
  page.locator('#name-dialog[open]').wait_for(timeout=15000)
  page.locator('#player-name-input').fill('藝術驗收')
  page.locator('#name-form button').click()
  page.wait_for_function("document.querySelector('#attack')?.disabled === false",timeout=20000)
  backing=page.locator('#world').evaluate('(canvas)=>[canvas.width,canvas.height]')
  if backing!=[1440,1240]:
   raise AssertionError(f'High-DPI canvas has incorrect backing resolution: {backing}')

  urls=[
   '/art/v19/runtime/backgrounds/office-night.svg',
   '/art/v19/runtime/foreground/cherry-filigree.svg',
   '/art/v19/runtime/weapons/ornate-briefcase.svg',
   '/art/v19/runtime/ui/ornate-theme.css'
  ]
  for url in urls:
   response=page.request.get('http://127.0.0.1:8766'+url)
   if response.status!=200:raise AssertionError(f'Art not loadable: {url}: {response.status}')
  page.locator('#auto').click()
  wave=page.locator('#wave').inner_text()
  hp_before=page.locator('#enemy-hp-fill').get_attribute('style')
  page.locator('#attack').click()
  # The illustrated hero does not physically hit until t=405ms. The UI
  # deliberately holds pre-hit HP until contact; don't test stale 280ms bars.
  page.wait_for_function("""(before) => {
    const style=document.querySelector('#enemy-hp-fill')?.getAttribute('style');
    const log=document.querySelector('#game-log')?.textContent || '';
    return style!==before || log.includes('過關');
  }""",arg=hp_before,timeout=7000)
  hp_after=page.locator('#enemy-hp-fill').get_attribute('style')
  log=page.locator('#game-log').inner_text()
  if hp_before==hp_after and '過關' not in log:
   raise AssertionError('Attacking did not update enemy state after weapon contact')
  if page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 3'):
   raise AssertionError('Horizontal overflow at 390px mobile viewport')
  if errors:raise AssertionError('JS runtime errors: '+'; '.join(errors[:8]))
  page.screenshot(path=str(output/'mobile-v19-scene.png'),full_page=True)
  page.locator('[data-panel="hero"]').click()
  page.locator('button[data-action="styles"]').click()
  if not page.locator('#panel-content').get_by_text('角色衣櫃').count():
   raise AssertionError('Cosmetic wardrobe not accessible')
  page.screenshot(path=str(output/'mobile-v19-wardrobe.png'),full_page=True)
  print('PASS: art HTTP, 1440x1240 Retina canvas, 390px layout, combat state, naming, wardrobe; '+wave)
  browser.close()

if __name__=='__main__':
 main()
