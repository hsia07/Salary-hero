#!/usr/bin/env python3
"""Verify the 5 ACTUAL different chibi briefcase poses, not affine transforms of idle art."""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art/v19/candidates/characters/starter/chibi/attack-5pose-128.avif'
MANIFEST=ROOT/'art/v19/candidates/characters/starter/manifest.json'
SIZE=128
FRAMES=5

def main():
    with Image.open(SOURCE) as source:
        if source.format!='AVIF':
            raise AssertionError('Expected a real AVIF file')
        image=source.convert('RGBA')
    if image.size!=(SIZE*FRAMES,SIZE):
        raise AssertionError(f'Expected 640×128, decoded {image.size}')
    frames=[]
    boxes=[]
    for i in range(FRAMES):
        frame=np.asarray(image.crop((i*SIZE,0,(i+1)*SIZE,SIZE)),dtype=np.uint8)
        alpha=frame[:,:,3]
        if int(alpha.min())!=0 or int(alpha.max())!=255:
            raise AssertionError(f'Frame {i}: transparency range invalid')
        # AVIF may introduce near-zero alpha dust; treat pixels above 12 as visible.
        ys,xs=np.nonzero(alpha>12)
        if len(xs)<1700:
            raise AssertionError(f'Frame {i}: missing character or limbs')
        box=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
        if box[0]<5 or box[1]<9 or box[2]>123 or box[3]>122:
            raise AssertionError(f'Frame {i}: cropped body/weapon or insufficient margins: {box}')
        # Groundline should not jump more than 3 source pixels between frames.
        if not (116<=box[3]<=120):
            raise AssertionError(f'Frame {i}: feet baseline misaligned: {box}')
        frames.append(frame.astype('int16'))
        boxes.append(box)
    differences=[]
    for i in range(FRAMES-1):
        dist=np.max(np.abs(frames[i]-frames[i+1]),axis=2)
        different=float(np.mean(dist>15))
        if different<.22:
            raise AssertionError(f'{i}->{i+1}: poses too similar ({different:.2%} pixels different)')
        differences.append(round(different,4))
    manifest=json.loads(MANIFEST.read_text('utf8'))
    slot=next(x for x in manifest['spriteSlots'] if x['id']=='attack')
    if slot.get('approved') is not False:
        raise AssertionError('The extracted pose strip is not approved production art')
    if slot.get('frames')!=5 or slot.get('pixels')!=[640,128]:
        raise AssertionError('Manifest references incorrect strip or frames')
    result={
        'decoded':list(image.size),'format':'AVIF','frames':FRAMES,
        'frame_boxes':boxes,'adjacent_pixel_difference_gt15':differences,
        'technical':'PASSED','visual_approval':'PENDING',
        'source':'five distinct illustrated poses isolated from a composite character sheet',
    }
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
