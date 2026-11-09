#!/usr/bin/env python3
"""Render and audit V19 standalone hero candidates. Fail closed on incorrect art."""
from __future__ import annotations
import hashlib
import json
import re
import sys
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    import cairosvg
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Install the required libraries: pip install cairosvg Pillow") from exc

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art/v19/candidates/hero"
OUTPUT = ROOT / "art/v19/candidates/hero-webp"
REPORT = ROOT / "docs/V19_HERO_ASSET_QA.json"
POSES = ("idle", "attack", "hurt", "victory", "sleep")
CANVAS = (512, 512)

def check_one(name: str) -> dict:
    svg_path = SOURCE / f"{name}.svg"
    raw = svg_path.read_bytes()
    root = ET.fromstring(raw)
    if not root.tag.endswith("svg"):
        raise ValueError(f"{name}: invalid SVG root")
    if root.get("width") != "512" or root.get("height") != "512":
        raise ValueError(f"{name}: canvas must declare 512x512, got {root.get('width')}x{root.get('height')}")
    if root.get("viewBox") != "-30 0 360 360":
        raise ValueError(f"{name}: unexpected viewBox")
    if re.search(rb"<\s*(?:image|foreignObject)\b", raw, flags=re.I):
        raise ValueError(f"{name}: embedded raster or foreign content prohibited")
    # Lossless rasterization verifies ACTUAL 512x512 dimensions, not just metadata.
    png = cairosvg.svg2png(bytestring=raw, output_width=512, output_height=512)
    with Image.open(BytesIO(png)) as src:
        img = src.convert("RGBA")
    if img.size != CANVAS:
        raise ValueError(f"{name}: raster dimensions mismatch {img.size}")
    alpha = img.getchannel("A")
    lo, hi = alpha.getextrema()
    if lo != 0 or hi < 225:
        raise ValueError(f"{name}: transparency/opacity invalid ({lo}, {hi})")
    box = alpha.getbbox()
    if not box:
        raise ValueError(f"{name}: blank image")
    if box[0] <= 1 or box[1] <= 1 or box[2] >= 511 or box[3] >= 511:
        raise ValueError(f"{name}: art touches canvas edge; possible cropped sprite: {box}")
    out = OUTPUT / f"{name}.webp"
    img.save(out, "WEBP", lossless=True, method=6)
    with Image.open(out) as encoded:
        if encoded.size != CANVAS:
            raise ValueError(f"{name}: WebP re-decode dimension mismatch")
        if encoded.convert("RGBA").getchannel("A").getextrema()[0] != 0:
            raise ValueError(f"{name}: transparency lost during WebP conversion")
    return {"pose": name, "source": svg_path.relative_to(ROOT).as_posix(),
            "raster": out.relative_to(ROOT).as_posix(), "width":512, "height":512,
            "alpha_min":lo, "alpha_max":hi, "nontransparent_bbox":list(box),
            "source_sha256":hashlib.sha256(raw).hexdigest(),
            "webp_sha256":hashlib.sha256(out.read_bytes()).hexdigest(), "webp_bytes":out.stat().st_size,
            "status": "pass-technical-validation-only"}

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    results = [check_one(p) for p in POSES]
    if len({x["webp_sha256"] for x in results}) != len(POSES):
        raise ValueError("Duplicate images detected between distinct hero poses")
    report = {"version":"v19", "production_status":"candidate-visual-review-required",
              "checks":["xml","512x512-raster","transparent-alpha","edge-cropping","lossless-webp-redecode","distinct-poses"],
              "results":results}
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"status":"PASS","files":len(results),
        "size":"512x512","bytes":[x["webp_bytes"] for x in results],
        "bbox":[x["nontransparent_bbox"] for x in results]},ensure_ascii=False))
if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("ART QA FAIL: "+str(exc),file=sys.stderr)
        sys.exit(1)
