"""白律｜依使用者 2026-11-19 提供的正式參考圖重寫的探索計畫（文字版；參考圖存檔後改用 IP-Adapter 版）。
參考圖特徵：凌亂銀白髮＋呆毛、灰眼半睜、眼下淚痣、面無表情；墨綠披風金邊＋金色肩章與金繩飾、
白色長聖帶（天秤紋）；白襯衫綠領帶、黑背心黑西裝、皮帶、黑手套、識別證；深色皮革公文包金色包角＋天秤紋；
金尖鋼筆指向前方；黑靴；約 2.5 頭身、精細線稿、日系手遊 Q 版。
用法：python tools/art/make_plan_bailu_ref.py D:/AI/runs/bailu-ref1 > plan.json
"""
import json, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "D:/AI/runs/bailu-ref1"

CHAR = ("1boy, solo, (mature male:1.2), adult, sharp features, silver hair, messy hair, ahoge, hair between eyes, grey eyes, half-closed eyes, "
        "mole under eye, expressionless, closed mouth, "
        "(dark green cape:1.2), gold trim, gold epaulettes, gold aiguillette, (white stole:1.3), long white sash over shoulder, scale emblem, "
        "white collared shirt, green necktie, black vest, black suit, belt, black gloves, id card lanyard, "
        "black pants, black boots, "
        "holding briefcase, dark leather briefcase, gold corners, "
        "holding fountain pen, gold nib, arm extended, "
        "(full body:1.3), standing, feet, wide shot, small character centered, empty space around character, "
        "three-quarter view, looking to the side")
BG = "simple background, white background"
QUALITY = "masterpiece, high score, great score, absurdres"

CHIBI = {
    "c12": "(chibi:1.2), big head, small body",
    "c14": "(chibi:1.4), super deformed, big head, small body, short legs",
    "c16": "(chibi:1.6), (super deformed:1.2), big head, small body, short legs",
}
STYLE = {  # 參考圖：精細線稿＋柔和漸層上色、細緻布料紋理
    "line": "detailed lineart, clean lineart, soft shading, detailed clothes, game character art",
    "paint": "(thick painting:0.6), detailed shading, glossy highlights, detailed clothes, game cg",
    "gacha": "official art, gacha game, detailed, intricate details, soft gradient shading",
}
CFGS = [4.0, 5.0, 6.0]
SEEDS = [101, 202, 303, 404, 505, 606]

NEG = ("lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, extra arms, "
       "text, signature, watermark, username, logo, error, cropped, blurry, jpeg artifacts, "
       "worst quality, low quality, low score, bad score, average score, "
       "cropped legs, out of frame, close-up, upper body, portrait, cowboy shot, "
       "effects, swirl, leaves, petals, aura, tree, branches, plant, "
       "trench coat, metal briefcase, silver briefcase, "
       "multiple views, reference sheet, character sheet, turnaround, comic, 2koma, 4koma, collage, "
       "female, 1girl, child, loli, shota, muscular, old man, "
       "background, scenery, floor, shadow, gradient background")

jobs = [{"id": f"{ck}-{sk}-cfg{int(cfg)}", "prompt": f"{chibi}, {CHAR}, {style}, {BG}, {QUALITY}",
         "cfg": cfg, "steps": 28, "sampler": "euler_ancestral", "scheduler": "normal", "seeds": SEEDS}
        for ck, chibi in CHIBI.items() for sk, style in STYLE.items() for cfg in CFGS]

print(json.dumps({"out": OUT, "checkpoint": "animagine-xl-4.0-opt.safetensors", "width": 832, "height": 1216,
                  "negative": NEG, "rembg": True, "jobs": jobs}, ensure_ascii=False, indent=1))
