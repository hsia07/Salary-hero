#!/usr/bin/env python3
"""Stage or promote one reviewed illustrated monster (not programmatic sprites).

Usage:
  python tools/install-paper-sprite.py path/to/薪水勇者_影印室工讀紙妖_16格動畫候選.zip
  python tools/install-paper-sprite.py path/to/zip --approve   # ONLY after owner approval

Does not touch saves, salary rules, or unrelated monsters.
"""
from __future__ import annotations
import argparse
import io
import json
from pathlib import Path
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parents[1]
ID='paper-gremlin'
FRAMES={'idle':4,'attack':5,'hurt':3,'defeat':4}
DURATIONS={'idle':[240,180,240,140],'attack':[110,140,105,130,180],
           'hurt':[140,210,230],'defeat':[190,190,230,420]}
CELL=320

def inspect(raw,kind):
    try:
        from PIL import Image,ImageChops
    except ImportError as err:
        raise RuntimeError('pip install Pillow before importing animation PNGs') from err
    with Image.open(io.BytesIO(raw)) as opened:
        if opened.format!='PNG':
            raise ValueError(kind+': must be PNG, not a mislabeled poster')
        image=opened.convert('RGBA')
    count=FRAMES[kind]
    if image.size!=(CELL*count,CELL):
        raise ValueError(f'{kind}: actual decoded pixels {image.size}, expected {(CELL*count,CELL)}')
    previous=None
    min_change={'idle':.008,'attack':.040,'hurt':.024,'defeat':.040}[kind]
    for i in range(count):
        frame=image.crop((CELL*i,0,CELL*(i+1),CELL))
        if frame.getchannel('A').getextrema()!=(0,255):
            raise ValueError(kind+': transparency missing in frame '+str(i))
        for xy in ((0,0),(319,0),(0,319),(319,319)):
            if frame.getpixel(xy)[3]>12:
                raise ValueError(kind+': opaque or cropped sprite corner in frame '+str(i))
        thumb=frame.resize((64,64),Image.Resampling.BILINEAR)
        bbox=thumb.getchannel('A').getbbox()
        if not bbox or (bbox[2]-bbox[0])<12 or (bbox[3]-bbox[1])<12:
            raise ValueError(kind+': blank/cropped frame '+str(i))
        normalized=thumb.crop(bbox).resize((48,48),Image.Resampling.BILINEAR)
        if previous is not None:
            diff=ImageChops.difference(normalized,previous)
            from PIL import ImageStat
            change=sum(ImageStat.Stat(diff).mean)/4/255
            if change<min_change:
                raise ValueError(f'{kind} frame {i} appears duplicated or only moved ({change:.3f})')
        previous=normalized
    return raw

def install(zip_path:Path,approve=False):
    if not zip_path.is_file():raise FileNotFoundError(zip_path)
    data={}
    with ZipFile(zip_path) as z:
        for state in FRAMES:
            key='animation/'+state+'.png'
            if key not in z.namelist():raise ValueError('Missing '+key)
            data[state]=inspect(z.read(key),state)
    parent=ROOT/('art/v19/runtime/monsters' if approve else 'art/v19/candidates/monsters')/ID
    parent.mkdir(parents=True,exist_ok=True)
    for state,raw in data.items():
        (parent/(state+'.png')).write_bytes(raw)
    manifest=ROOT/'art/v19/runtime/monsters/manifest.json'
    if approve:
        existing=json.loads(manifest.read_text('utf-8'))
        if existing.get('version')!=1:raise ValueError('Unknown monster manifest version')
        record={'id':ID,'approved':True,'states':{}}
        for state,count in FRAMES.items():
            record['states'][state]={
              'src':'../art/v19/runtime/monsters/'+ID+'/'+state+'.png',
              'cell':CELL,'frames':count,'ground_y':289,'durations':DURATIONS[state]}
        existing.setdefault('monsters',{})[ID]=record
        manifest.write_text(json.dumps(existing,indent=2,ensure_ascii=False)+'\n','utf-8')
        print('APPROVED AND STAGED:',parent)
        print('Now run node --test v19/sprite-atlas.test.mjs and browser QA before git commit/push.')
    else:
        (parent/'manifest-candidate.json').write_text(json.dumps({
         'id':ID,'approved':False,'cell':CELL,'frames':FRAMES,
         'durations':DURATIONS,'review_status':'awaiting-human-approval'
        },indent=2,ensure_ascii=False)+'\n','utf-8')
        print('CANDIDATE ONLY:',parent)
        print('Official monster manifest unchanged; no false art completion claims.')
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zip_path',type=Path)
    parser.add_argument('--approve',action='store_true')
    args=parser.parse_args()
    install(args.zip_path,args.approve)
