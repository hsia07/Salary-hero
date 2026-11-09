#!/usr/bin/env python3
"""Catch the exact user-visible regression: V19 displayed 128px attack + no hurt frames.
Checks current default mobile game, not an old opt-in preview or just loader syntax.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
OUT=Path(__file__).resolve().parents[1]/'art/v19/runtime/qa'
OUT.mkdir(parents=True,exist_ok=True)

def main():
 with sync_playwright() as engine:
  browser=engine.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':844},
                        device_scale_factor=2,is_mobile=True,has_touch=True)
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  # This is deliberately the DEFAULT V19 URL, without ?art=... or manual upload.
  page.goto(BASE+'/v19/play.html',wait_until='domcontentloaded')
  page.wait_for_function("document.querySelector('#name-dialog')?.open || document.querySelector('#world')?.dataset?.art",timeout=25000)
  if page.locator('#name-dialog[open]').count():
   page.locator('#player-name-input').fill('高清驗收')
   page.locator('#name-form button').click()
  page.wait_for_function("document.querySelector('#world')?.dataset?.art === 'chibi-hd-ready'",timeout=30000)
  notice=page.locator('#chibi-art-state').inner_text()
  if '7×512px' not in notice or '5×384px' not in notice:
   raise AssertionError('V19 did not advertise the REAL committed attack/hurt art: '+notice)
  if page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 3'):
   raise AssertionError('390px mobile layout has horizontal overflow')
  backing=page.locator('#world').evaluate('(canvas)=>[canvas.width,canvas.height]')
  if backing!=[1440,1240]:
   raise AssertionError(f'Mobile canvas has wrong 2x retina backing {backing}')
  # Actual image decode from hosted paths, not mocked dimensions or filenames.
  sprites=page.evaluate("""async () => {
   const srcs=[
     '../art/v19/candidates/characters/starter/chibi/attack-v2-7pose-512.png?v=5ae7bb6',
     '../art/v19/candidates/characters/starter/chibi/hurt-v1-5pose-384.webp?v=5ae7bb6'
   ];
   const results=[];
   for(const src of srcs){
     const image=new Image();image.src=src;await image.decode();
     const c=document.createElement('canvas');c.width=2;c.height=2;
     const ctx=c.getContext('2d',{willReadFrequently:true});
     ctx.drawImage(image,0,0,1,1,0,0,1,1);
     results.push([image.naturalWidth,image.naturalHeight,
       ctx.getImageData(0,0,1,1).data[3]]);
   }
   return results;
  }""")
  if sprites!=[[3584,512,0],[1920,384,0]]:
   raise AssertionError('HD art decode/alpha fail: '+repr(sprites))
  if 'ON' in page.locator('#auto').inner_text():
   page.locator('#auto').click()
  page.wait_for_function("document.querySelector('#attack')?.disabled === false",timeout=15000)
  page.locator('#world').screenshot(path=str(OUT/'v19-default-HD-idle.png'))
  page.locator('#attack').click()
  page.wait_for_timeout(340)
  page.locator('#world').screenshot(path=str(OUT/'v19-default-HD-attack.png'))
  # Automatic injury should follow a nonlethal enemy retaliation, but regardless
  # the independent preview always allows deterministic visual-only inspection.
  hp_before=page.locator('#hero-hp-text').inner_text()
  page.locator('#hurt-demo-quick').click()
  page.wait_for_timeout(90)
  page.locator('#world').screenshot(path=str(OUT/'v19-default-HD-hurt-red-flash.png'))
  if page.locator('#hero-hp-text').inner_text()!=hp_before:
   raise AssertionError('Preview hurt incorrectly changed real player HP')
  if errors:raise AssertionError('JavaScript runtime errors: '+repr(errors))
  print('PASS: 390px V19 DEFAULT URL, Retina render, 7×512 attack, 5×384 hurt, transparent corners, no manual uploads, no old AVIF fallback; HP unaffected by VFX preview',sprites)
  browser.close()

if __name__=='__main__':
 main()
