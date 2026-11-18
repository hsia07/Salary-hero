"""白律 LoRA 驗收測試：參考圖裡沒有的 3 種新姿勢 × 4 種子，不加參考圖約束。
通過條件（AUTO_PIPELINE 已先定）：≥6/12 張在臉（成熟、灰眼、淚痣）、蓬髮、披風＋聖帶、公文包紋章上與參考圖同級。
用法：python tools/art/make_plan_bailu_lora_test.py <lora檔名> <strength> <out>
"""
import json, sys
LORA, STRENGTH, OUT = sys.argv[1], float(sys.argv[2]), sys.argv[3]
BASE = ("bailu_sh, 1boy, solo, chibi, mature male, silver hair, messy hair, ahoge, grey eyes, half-closed eyes, mole under eye, "
        "expressionless, dark green cape, gold trim, gold epaulettes, gold aiguillette, white stole, scale emblem, white collared shirt, "
        "green necktie, black vest, black suit, belt, black gloves, id card, black pants, black boots")
POSES = {
    "front": "full body, standing, front view, looking at viewer, holding briefcase with both hands",
    "walk": "full body, walking, from side, holding fountain pen, cape flowing",
    "battle": "full body, fighting stance, raising fountain pen overhead, dynamic pose, holding briefcase",
}
STYLE = "detailed lineart, soft shading, game character art, simple background, white background, masterpiece, high score, great score, absurdres"
NEG = ("lowres, bad anatomy, bad hands, missing fingers, extra digits, extra arms, text, signature, watermark, logo, cropped, blurry, "
       "worst quality, low quality, low score, bad score, average score, cropped legs, out of frame, upper body, portrait, "
       "multiple views, reference sheet, character sheet, collage, female, child, red eyes, moe, background, scenery, floor, shadow")
jobs = [{"id": f"{k}-s{int(STRENGTH*100)}", "prompt": f"{BASE}, {pose}, {STYLE}", "cfg": 5.0, "steps": 28,
         "sampler": "dpmpp_2m", "scheduler": "karras", "seeds": [101, 202, 303, 404]} for k, pose in POSES.items()]
print(json.dumps({"out": OUT, "checkpoint": "animagine-xl-4.0-opt.safetensors", "width": 832, "height": 1216,
                  "negative": NEG, "rembg": True, "lora": {"name": LORA, "strength": STRENGTH}, "jobs": jobs}, ensure_ascii=False, indent=1))
