"""第一晚：白律畫風探索計畫（Animagine XL 4.0，純文字提示，無參考圖）。
掃描三個方向：Q 版程度 × 畫風描述 × CFG，每組 6 個種子。輸出 plan JSON。
用法：python tools/art/make_plan_night1.py D:/AI/runs/bailu-night1 > plan.json
"""
import json, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "D:/AI/runs/bailu-night1"

CHAR = ("1boy, solo, mature male, middle-aged man, slender, grey hair, white hair, short hair, side part, "
        "tired eyes, dark circles, calm expression, closed mouth, "
        "dark green trench coat, long coat, open coat, white collared shirt, grey necktie, black pants, black shoes, "
        "holding briefcase, silver metal briefcase, holding pen, oversized fountain pen, "
        "full body, standing, three-quarter view, facing right, looking at viewer")
BG = "simple background, white background"
QUALITY = "masterpiece, high score, great score, absurdres"

CHIBI = {  # 頭身控制
    "c06": "(chibi:0.6)",
    "c08": "(chibi:0.8)",
    "c10": "chibi, big head",
    "c12": "(chibi:1.2), big head, small body",
}
STYLE = {
    "anime": "anime coloring, clean lineart, cel shading",
    "game": "official art, game cg, soft shading, detailed",
    "dark": "dark fantasy, muted colors, rim light, detailed",
}
CFGS = [4.0, 5.0, 6.0]
SEEDS = [101, 202, 303, 404, 505, 606]

NEG = ("lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, extra arms, "
       "text, signature, watermark, username, logo, error, cropped, blurry, jpeg artifacts, "
       "worst quality, low quality, low score, bad score, average score, "
       "multiple views, reference sheet, character sheet, turnaround, comic, 2koma, 4koma, collage, "
       "female, 1girl, child, loli, shota, muscular, old man, "
       "background, scenery, floor, shadow, gradient background")

jobs = []
for ck, chibi in CHIBI.items():
    for sk, style in STYLE.items():
        for cfg in CFGS:
            jobs.append({"id": f"{ck}-{sk}-cfg{int(cfg)}",
                         "prompt": f"{chibi}, {CHAR}, {style}, {BG}, {QUALITY}",
                         "cfg": cfg, "steps": 28, "sampler": "euler_ancestral", "scheduler": "normal",
                         "seeds": SEEDS})

print(json.dumps({"out": OUT, "checkpoint": "animagine-xl-4.0-opt.safetensors",
                  "width": 832, "height": 1216, "negative": NEG, "rembg": True, "jobs": jobs},
                 ensure_ascii=False, indent=1))
