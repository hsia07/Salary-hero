#!/usr/bin/env python3
"""Validate V18 images by decoding pixels, not merely checking file headers."""
import json, pathlib, sys
from PIL import Image, UnidentifiedImageError

ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'art/v18/runtime-manifest.json').read_text(encoding='utf-8'))
entries=[]
def collect(node,key=''):
    if isinstance(node,str) and node.lower().endswith(('.webp','.png')):
        entries.append((key,node))
    elif isinstance(node,dict):
        for k,v in node.items():
            if k not in ('status','referenceOnly'):
                collect(v,f'{key}.{k}' if key else k)
collect(manifest['assets'])
errors=[]
for key,rel in entries:
    path=ROOT/rel
    if not path.is_file():
        errors.append('MISSING '+rel)
        continue
    try:
        with Image.open(path) as im:
            im.load()
            w,h=im.size
            if w<128 or h<128: errors.append(f'LOW RESOLUTION {rel}: {w}x{h}')
            if w>8192 or h>8192: errors.append(f'OVERSIZED {rel}: {w}x{h}')
            if path.stat().st_size<4096: errors.append('TOO SMALL '+rel)
            is_background=('background' in key.lower())
            if not is_background:
                if 'A' not in im.getbands():
                    errors.append('NO ALPHA CHANNEL '+rel)
                else:
                    alpha=im.getchannel('A')
                    lo,hi=alpha.getextrema()
                    if lo>=250: errors.append('NO TRANSPARENT PIXELS '+rel)
                    if hi<200: errors.append('NO VISIBLE OPAQUE PIXELS '+rel)
                    # Sample border: transparent canvas must not be a solid screenshot.
                    border=[alpha.crop((0,0,w,1)),alpha.crop((0,h-1,w,h)),alpha.crop((0,0,1,h)),alpha.crop((w-1,0,w,h))]
                    if all(b.getextrema()[0]>=250 for b in border):
                        errors.append('OPAQUE BORDER / POSSIBLE SCREENSHOT '+rel)
            print(f'CHECKED {rel}: {w}x{h}, mode={im.mode}, bytes={path.stat().st_size}')
    except (OSError,ValueError,UnidentifiedImageError) as exc:
        errors.append(f'UNREADABLE {rel}: {exc}')
print(f'Checked {len(entries)} assets; errors={len(errors)}.')
if errors:
    print('\n'.join(errors),file=sys.stderr)
    sys.exit(1)
print('Decoded asset validation passed. Human art review is still required.')
