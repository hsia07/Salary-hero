#!/usr/bin/env python3
"""Check a real independent image candidate: dimensions, transparency, margins and visual provenance."""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art/v19/candidates/characters/starter/chibi/idle-candidate.webp'
MANIFEST=ROOT/'art/v19/candidates/characters/starter/manifest.json'

def inspect():
  if not SRC.is_file(): raise AssertionError(f'Missing chibi image {SRC}')
  with Image.open(SRC) as file:
    decoded_format=file.format
    image=file.convert('RGBA')
  if decoded_format!='WEBP': raise AssertionError('Not a decoded WebP')
  if image.size!=(384,384): raise AssertionError(f'Wrong resolution: {image.size}')
  alpha=image.getchannel('A')
  amin,amax=alpha.getextrema()
  if amin!=0 or amax!=255:raise AssertionError(f'Alpha range should include 0 and 255: {(amin,amax)}')
  box=alpha.getbbox()
  if box is None:raise AssertionError('Transparent image contains no character')
  l,t,r,b=box
  if not (l>=8 and t>=8 and r<=376 and b<=376):
    raise AssertionError(f'Character may touch or be cropped at canvas edge: {box}')
  for px in ((0,0),(383,0),(0,383),(383,383)):
    if image.getpixel(px)[3]!=0:raise AssertionError('Opaque matting at canvas corner')
  metadata=json.loads(MANIFEST.read_text('utf8'))
  idle=next(x for x in metadata['spriteSlots'] if x['id']=='idle')
  assert idle['path']=='art/v19/candidates/characters/starter/chibi/idle-candidate.webp'
  assert idle['approved'] is False, 'Cannot promote a cutout to final animated sprite'
  assert metadata['approved'] is False
  result={'asset':str(SRC.relative_to(ROOT)), 'size':list(image.size),
          'alpha':[amin,amax], 'alpha_bbox':[l,t,r,b],
          'status':'passed pixel/alpha/margins technical QA ONLY',
          'art_approval':'not approved', 'animation':'idle still only'}
  print(json.dumps(result,ensure_ascii=False))
  return result

if __name__=='__main__':inspect()
