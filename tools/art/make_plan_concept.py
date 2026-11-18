"""新角色設計探索（候選草稿）：以白律參考圖做「畫風轉移」(IP-Adapter style transfer)，內容依角色卡文字。
規則：角色狀態 PROPOSED 時只能產生候選草稿（FORMAL_ART_RULES §9），由使用者挑選後才寫鎖定檔。
用法：python tools/art/make_plan_concept.py <character_id> <out> > plan.json
"""
import json, sys
CID, OUT = sys.argv[1], sys.argv[2]
DESIGNS = {
 "steel-saint": {  # 依 docs/characters/steel-saint/DESIGN_BRIEF.md（小說細節）
  "base": ("1girl, solo, adult woman, tall, android, visible mechanical joints, (white and gold holy armor:1.2), layered breastplate, "
           "chest maintenance hatch panel, small blank metal plate hanging on chest, faint glowing blue cracks on armor, "
           "(glowing blue long hair:1.2), energy hair, (white metal mechanical wings:1.2), calm tired gentle expression, blue eyes"),
  "directions": {
   "shield": "holding large white-gold rescue shield with folding panels, standing guard",
   "shieldgun": "large white-gold rescue shield on one arm, compact energy gun in other hand, standing",
   "hatch": "one hand closing chest maintenance hatch, rescue shield on back, standing",
  },
 },
}
D = DESIGNS[CID]
STYLE = "chibi, (super deformed:1.1), big head, small body, detailed lineart, soft shading, game character art, full body, standing, feet, wide shot, three-quarter view, simple background, white background, masterpiece, high score, great score, absurdres"
NEG = ("lowres, bad anatomy, bad hands, missing fingers, extra digits, extra arms, text, signature, watermark, logo, cropped, blurry, "
       "worst quality, low quality, low score, bad score, average score, cropped legs, out of frame, upper body, portrait, close-up, "
       "multiple views, reference sheet, character sheet, collage, child, loli, male, 1boy, background, scenery, floor, shadow, "
       "nsfw, cleavage, revealing clothes, effects, particles, splash")
jobs = []
for dk, pose in D["directions"].items():
    for w in (0.7, 0.9):
        jobs.append({"id": f"{dk}-st{int(w*100)}", "prompt": f"{D['base']}, {pose}, {STYLE}", "cfg": 5.0, "steps": 28,
                     "sampler": "dpmpp_2m", "scheduler": "karras",
                     "ipa": {"image": "bailu_reference_white.png", "weight": w, "weight_type": "style transfer"},
                     "seeds": [11, 22, 33, 44]})
print(json.dumps({"out": OUT, "checkpoint": "animagine-xl-4.0-opt.safetensors", "width": 832, "height": 1216,
                  "negative": NEG, "rembg": True, "jobs": jobs}, ensure_ascii=False, indent=1))
