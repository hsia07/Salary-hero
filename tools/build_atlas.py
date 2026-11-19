"""把逐格姿勢圖組成與薪奴相同規格的圖集（不改薪奴檔案）。
- 每格統一縮放：以「頭頂到腳底」高度對齊參考格（第 0 格），避免角色忽大忽小
- 腳底錨點：每格腳底中心對齊到同一點（cell 底部留白固定），避免動畫跳動
- 輸出：<out>/attack-7pose-512.png（3584×512）與 hurt-5pose-384.png（1920×384），格式同 validateAttackAtlas / validateHurtAtlas
用法：python tools/art/build_atlas.py <picks.json> <out_dir>
picks.json：{"attack":[7 個透明 PNG 路徑], "hurt":[5 個透明 PNG 路徑]}
"""
import json, sys, pathlib
import numpy as np
from PIL import Image

picks = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)


def feet_x(im):
    """腳底中心：最下方 6% 不透明像素的水平中心。"""
    a = np.asarray(im)[:, :, 3] > 40
    ys = np.where(a.any(axis=1))[0]
    bottom = ys[-1]; band = a[max(0, bottom - int(im.height * .06)):bottom + 1]
    xs = np.where(band.any(axis=0))[0]
    return (xs[0] + xs[-1]) / 2, bottom


def build(paths, cell, name):
    ims = [Image.open(p).convert("RGBA") for p in paths]
    crops = [im.crop(im.getbbox()) for im in ims]
    # 以第 0 格身高為準；其他格依「身高」比例縮放，但下蹲格不放大（只縮不放，最多與第 0 格同比例）
    ref_h = crops[0].height
    target_h = int(cell * .86)
    k0 = target_h / ref_h
    sheet = Image.new("RGBA", (cell * len(crops), cell), (0, 0, 0, 0))
    foot_y = int(cell * .965)
    report = []
    for i, c in enumerate(crops):
        s = c.resize((max(1, int(c.width * k0)), max(1, int(c.height * k0))), Image.LANCZOS)
        fx, fb = feet_x(s)
        x = int(cell / 2 - fx); y = int(foot_y - fb)
        x = max(-s.width // 3, min(x, cell - s.width * 2 // 3))
        sheet.alpha_composite(s, (i * cell + max(0, x), max(0, y)), (max(0, -x), max(0, -y)))
        report.append({"frame": i, "w": s.width, "h": s.height, "foot_x": round(i * cell + x + fx), "foot_y": foot_y})
    sheet.save(out / name)
    return report


r = {"attack": build(picks["attack"], 512, "attack-7pose-512.png"), "hurt": build(picks["hurt"], 384, "hurt-5pose-384.png")}
(out / "atlas_report.json").write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps(r, ensure_ascii=False)[:400])
