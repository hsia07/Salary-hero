#!/usr/bin/env python3
"""Quality-gate the REAL default V19 HD attack, not retired 128px prototype.

The previous gate checked a superseded 5x128 AVIF from the rejected engineering
candidate folder. The game has shipped 7x512 illustrated PNG poses for months;
do not let a retired asset stand in for production QA.
"""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SPRITES=ROOT/'art/v19/candidates/characters/starter/chibi'
SOURCE=SPRITES/'attack-v2-7pose-512.png'
SIZE,FRAMES=512,7

def main():
    with Image.open(SOURCE) as source:
        if source.format!='PNG':raise AssertionError('Deployed HD attack must be PNG, not low-res AVIF')
        image=source.convert('RGBA')
    if image.size!=(SIZE*FRAMES,SIZE):
        raise AssertionError(f'Expected 3584×512 actual pixels, decoded {image.size}')
    frames=[]
    boxes=[]
    for i in range(FRAMES):
        frame=np.asarray(image.crop((i*SIZE,0,(i+1)*SIZE,SIZE)),dtype=np.uint8)
        alpha=frame[:,:,3]
        if int(alpha.min())!=0 or int(alpha.max())!=255:
            raise AssertionError(f'HD attack [{i}]: transparent alpha invalid')
        if any(int(alpha[y,x])>12 for y,x in [(0,0),(0,SIZE-1),(SIZE-1,0),(SIZE-1,SIZE-1)]):
            raise AssertionError(f'HD attack [{i}]: opaque corners or clipped sprite')
        ys,xs=np.nonzero(alpha>20)
        if len(xs)<SIZE*SIZE*.035:
            raise AssertionError(f'HD attack [{i}]: missing character or limbs')
        box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
        if min(box[0],box[1],SIZE-box[2],SIZE-box[3])<4:
            raise AssertionError(f'HD attack [{i}]: cropped sprite/weapon: {box}')
        boxes.append(box);frames.append(frame)
    differences=[]
    for i in range(FRAMES-1):
        # Reject duplicate/rigidly translated full-body stills, not just JPEG bytes.
        a,b=frames[i].astype(np.int16),frames[i+1].astype(np.int16)
        visible=(a[:,:,3]>20)|(b[:,:,3]>20)
        delta=np.abs(a-b).max(axis=2)
        changed=float(np.mean(delta[visible]>20)) if visible.any() else 0
        if changed<.12:
            raise AssertionError(f'HD attack {i}->{i+1}: poses too similar ({changed:.1%})')
        differences.append(round(changed,4))
    app=(ROOT/'v19/app.mjs').read_text('utf-8')
    if 'attack-5pose-128.avif' in app:
        raise AssertionError('App regressed to rejected 128px blur source')
    if 'attack-v2-7pose-512.png' not in app:
        raise AssertionError('App does not reference the actual HD attack art')
    report={'technical':'PASSED','production_asset':'7 individually illustrated 512px poses',
      'source':str(SOURCE.relative_to(ROOT)),'decoded':[image.width,image.height],
      'frames':FRAMES,'frame_boxes':boxes,'consecutive_visible_pixel_change':differences,
      'retired_5x128_avif':'NOT A PRODUCTION GATE',
      'visual_approval':'PENDING independent final art signoff'}
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
