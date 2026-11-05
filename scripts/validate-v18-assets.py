#!/usr/bin/env python3
"""Fail closed on missing/invalid V18 production art; no external packages."""
import json, pathlib, struct, sys
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'art/v18/runtime-manifest.json').read_text(encoding='utf-8'))
paths=[]
def visit(node,key=''):
    if isinstance(node,str) and node.lower().endswith(('.webp','.png')):
        paths.append((key,node))
    elif isinstance(node,dict):
        for k,v in node.items():
            if k in ('status','referenceOnly'): continue
            visit(v,f'{key}.{k}' if key else k)
visit(manifest['assets'])
errors=[]
for key,rel in paths:
    p=root/rel
    if not p.is_file():
        errors.append(f'MISSING {rel}')
        continue
    data=p.read_bytes()
    valid_webp=data[:4]==b'RIFF' and data[8:12]==b'WEBP' and len(data)>=20
    valid_png=data[:8]==b'\x89PNG\r\n\x1a\n'
    if not (valid_webp or valid_png):
        errors.append(f'BAD FORMAT {rel}')
        continue
    if len(data)<4096:
        errors.append(f'TOO SMALL {rel}: {len(data)} bytes')
        continue
    # PNG supports alpha only in color types 4/6; WebP needs actual decode for alpha verification.
    if valid_png and not key.lower().startswith('battlebackground') and 'background' not in key.lower():
        if data[25] not in (4,6):
            errors.append(f'NO ALPHA CHANNEL {rel}')
    print(f'FOUND {rel} ({len(data):,} bytes)')
print(f'Checked {len(paths)} declared assets; {len(paths)-len(errors)} passed basic validation.')
if errors:
    print('\n'.join(errors),file=sys.stderr)
    sys.exit(1)
print('Basic validation passed; visual review and WebP alpha decode still required.')
