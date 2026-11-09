#!/usr/bin/env python3
"""Assert that *deployed* V19 art is seven 512px attack poses and five 384px hurt poses.
This catches the original bug: only the loader had been committed, leaving live
V19 to display the old blurry 128px attack and zero hurt body animation.
"""
from pathlib import Path
import json
from PIL import Image,ImageChops

ROOT=Path(__file__).resolve().parents[1]
SHEET_DIR=ROOT/'art/v19/candidates/characters/starter/chibi'
SETS=[
 ('attack',SHEET_DIR/'attack-v2-7pose-512.png',(3584,512),7,512,'PNG'),
 ('hurt',SHEET_DIR/'hurt-v1-5pose-384.webp',(1920,384),5,384,'WEBP')
]

def run():
 result={}
 for name,path,expected,count,cell,fmt in SETS:
  if not path.is_file():
   raise AssertionError(f'{name}: ACTUAL binary art not committed: {path}')
  with Image.open(path) as im:
   if im.format!=fmt:
    raise AssertionError(f'{name}: unexpected encoded image format: {im.format}')
   img=im.convert('RGBA')
  if img.size!=expected:
   raise AssertionError(f'{name}: low-res / wrong atlas: {img.size} vs {expected}')
  amin,amax=img.getchannel('A').getextrema()
  if (amin,amax)!=(0,255):
   raise AssertionError(f'{name}: invalid transparent alpha: {amin}–{amax}')
  bounding=[]
  for n in range(count):
   frame=img.crop((n*cell,0,(n+1)*cell,cell))
   bb=frame.getchannel('A').getbbox()
   if not bb:raise AssertionError(f'{name}[{n}]: blank frame')
   l,t,r,b=bb
   if min(l,t,cell-r,cell-b)<4:
    raise AssertionError(f'{name}[{n}]: hair, feet or briefcase cropped: {bb}')
   if n>0:
    diff=ImageChops.difference(frame,previous)
    if diff.getbbox() is None:
     raise AssertionError(f'{name}[{n}]: repeated frame: fake animation')
   previous=frame
   bounding.append(bb)
  result[name]={'path':str(path.relative_to(ROOT)),'size':list(img.size),
                'frames':count,'cell':cell,'alpha':[amin,amax],
                'bbox_by_frame':bounding,'bytes':path.stat().st_size}
 src=(ROOT/'v19/app.mjs').read_text('utf8')
 html=(ROOT/'v19/play.html').read_text('utf8')
 for p in (v['path'] for v in result.values()):
  if p.split('/')[-1] not in src:
   raise AssertionError('V19 does not point to the deployed asset: '+p)
 if "attack-5pose-128.avif" in src:
  raise AssertionError('V19 still directly loads blurred legacy 128px atlas!')
 if "chibiV2Mode=artMode!=='legacy'" not in src:
  raise AssertionError('new high-resolution Q-version is not enabled by default')
 if 'id="chibi-art-state"' not in html:
  raise AssertionError('user cannot tell if art failed to load')
 if 'hurt-demo-quick' not in html:
  raise AssertionError('no one-tap damage-only injury preview')
 print(json.dumps({'checks':'PASSED actual binary art & runtime wiring','sprites':result},ensure_ascii=False,indent=2))

if __name__=='__main__':
 run()
