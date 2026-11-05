#!/usr/bin/env python3
"""Import only manifest-declared V18 artwork from a local ZIP, safely."""
import argparse, json, pathlib, shutil, sys, tempfile, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'art/v18/runtime-manifest.json').read_text(encoding='utf-8'))
def collect(node):
    if isinstance(node,str) and node.endswith(('.webp','.png')): yield node
    elif isinstance(node,dict):
        for key,value in node.items():
            if key not in ('status','referenceOnly'): yield from collect(value)
EXPECTED=set(collect(manifest['assets']))
def main():
    p=argparse.ArgumentParser()
    p.add_argument('zipfile',type=pathlib.Path)
    args=p.parse_args()
    with zipfile.ZipFile(args.zipfile) as z:
        infos=z.infolist()
        names=[i.filename for i in infos if not i.is_dir()]
        if len(names)!=len(set(names)): raise ValueError('Duplicate ZIP paths')
        # Accept exactly the declared 13 files; no metadata, scripts, or surprises.
        if set(names)!=EXPECTED:
            raise ValueError('ZIP paths mismatch: missing='+str(sorted(EXPECTED-set(names)))+' extra='+str(sorted(set(names)-EXPECTED)))
        if any(i.file_size>16*1024*1024 for i in infos): raise ValueError('Individual image exceeds 16 MiB')
        if sum(i.file_size for i in infos)>100*1024*1024: raise ValueError('ZIP expands beyond 100 MiB')
        with tempfile.TemporaryDirectory() as td:
            stage=pathlib.Path(td)
            for i in infos:
                if i.is_dir():continue
                if i.flag_bits & 1:raise ValueError('Encrypted ZIP not supported')
                # Reject symbolic links and nonregular UNIX file types.
                mode=(i.external_attr>>16)&0o170000
                if mode not in (0,0o100000):raise ValueError('Nonregular entry: '+i.filename)
                data=z.read(i)
                if len(data)<4096:raise ValueError('Image too small: '+i.filename)
                if i.filename.endswith('.webp') and not(data[:4]==b'RIFF' and data[8:12]==b'WEBP'):raise ValueError('Invalid WebP: '+i.filename)
                if i.filename.endswith('.png') and data[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Invalid PNG: '+i.filename)
                target=stage/i.filename;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
            for rel in sorted(EXPECTED):
                dest=ROOT/rel;dest.parent.mkdir(parents=True,exist_ok=True)
                shutil.copyfile(stage/rel,dest)
    print(f'Imported {len(EXPECTED)} files. Run validation and visual review before production use.')
if __name__=='__main__':
    try:main()
    except (ValueError,zipfile.BadZipFile) as exc:
        print('IMPORT FAILED:',exc,file=sys.stderr);sys.exit(1)
