#!/usr/bin/env python3
"""Audit actual rasterization, transparency and dimensions of Salary Hero layered runtime art."""
from __future__ import annotations
import io
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
ART={
 'background':('art/v19/runtime/backgrounds/office-night.svg',(720,620),False),
 'foreground':('art/v19/runtime/foreground/cherry-filigree.svg',(720,620),True),
 'weapon':('art/v19/runtime/weapons/ornate-briefcase.svg',(256,256),True),
}
def main():
 try:
  import cairosvg
  from PIL import Image
 except ImportError as exc:
  raise SystemExit('Install dependencies: pip install cairosvg Pillow') from exc
 results=[]
 source=(ROOT/'v19/app.mjs').read_text('utf8')
 for kind,(filename,dims,transparent) in ART.items():
  path=ROOT/filename
  raw=path.read_bytes()
  doc=ET.fromstring(raw)
  if doc.tag!='{http://www.w3.org/2000/svg}svg':
   raise ValueError(filename+': not an SVG root')
  declared=(int(doc.get('width','0')),int(doc.get('height','0')))
  if declared!=dims:
   raise ValueError(f'{filename}: declared {declared}, expected {dims}')
  if doc.get('viewBox')!=f'0 0 {dims[0]} {dims[1]}':
   raise ValueError(filename+': mismatched viewBox')
  if any(tag.tag.rsplit('}',1)[-1] in ('text','image','foreignObject','script') for tag in doc.iter()):
   raise ValueError(filename+': baked text, image or script element')
  if ('../'+filename) not in source:
   raise ValueError(filename+': game renderer does not load this layer')
  png=cairosvg.svg2png(bytestring=raw,output_width=dims[0],output_height=dims[1])
  with Image.open(io.BytesIO(png)) as src:
   image=src.convert('RGBA')
  if image.size!=dims:raise ValueError(filename+': output pixel dimensions mismatch')
  alpha=image.getchannel('A');low,high=alpha.getextrema()
  if transparent and (low!=0 or high<=225):raise ValueError(filename+': no valid alpha range')
  if not transparent and high<225:raise ValueError(filename+': background too transparent')
  box=alpha.getbbox()
  if transparent and (not box or box[0]<=0 or box[1]<=0 or box[2]>=dims[0] or box[3]>=dims[1]):
   raise ValueError(f'{filename}: possible clipping at canvas edge {box}')
  if transparent and kind=='foreground':
   center_alpha=image.getpixel((dims[0]//2,dims[1]//2))[3]
   if center_alpha>40:raise ValueError('Foreground occludes main battle area')
  results.append({'asset':kind,'file':filename,'raster_px':list(image.size),
                  'alpha_range':[low,high],'art_bounds':box,'technical':'passed'})
 report={'technical_validation':'passed','art_direction_human_approval':'not-claimed',
         'browser_validation':'separate CI stage','results':results}
 output=ROOT/'art/v19/runtime/qa'
 output.mkdir(parents=True,exist_ok=True)
 (output/'raster-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf8')
 print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':
 main()
