"""白律｜以使用者參考圖（references/bailu_reference.png）為 IP-Adapter 基準的探索計畫。
掃描：參考圖權重 × 權重模式 × Q 版強度，每組 4 個種子。
主方向＝最像參考圖者；第 2、3 名留作備用（使用者否決時直接切換）。
用法：python tools/art/make_plan_bailu_ipa.py D:/AI/runs/bailu-ipa1 > plan.json
前置：參考圖已鋪白底存到 ComfyUI/input/bailu_reference_white.png
"""
import json, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "D:/AI/runs/bailu-ipa1"
sys.path.insert(0, __file__.rsplit("\\", 1)[0].rsplit("/", 1)[0])
from make_plan_bailu_ref import CHAR, BG, QUALITY, NEG  # 文字描述沿用參考圖特徵版

CHIBI = {
    "c12": "(chibi:1.2), big head, small body",
    "c14": "(chibi:1.4), super deformed, big head, small body, short legs",
}
# 試生：臉偏萌、眼變紅、色偏藍綠 → 補眼色與成熟臉、壓低萌感與藍色
FACE = "(grey eyes:1.3), (narrow eyes:1.1), (mature face:1.2), thick eyebrows, "
STYLE = "detailed lineart, clean lineart, soft shading, muted colors, detailed clothes, game character art"
NEG_EXTRA = ", red eyes, pink eyes, purple eyes, moe, cute face, round eyes, sparkling eyes, blue cape, teal"
IPA = {  # 權重越高越像參考圖、但姿勢越容易被鎖死
    "w55": {"weight": 0.55, "weight_type": "linear"},
    "w75": {"weight": 0.75, "weight_type": "linear"},
    "w90": {"weight": 0.9, "weight_type": "linear"},
    "st80": {"weight": 0.8, "weight_type": "style transfer"},
    "sc70": {"weight": 0.7, "weight_type": "style and composition"},
}
SEEDS = [101, 202, 303, 404]

jobs = []
for ik, ipa in IPA.items():
    for ck, chibi in CHIBI.items():
        jobs.append({"id": f"{ik}-{ck}", "prompt": f"{chibi}, {FACE}{CHAR}, {STYLE}, {BG}, {QUALITY}", "negative": NEG + NEG_EXTRA,
                     "cfg": 5.0, "steps": 28, "sampler": "euler_ancestral", "scheduler": "normal",
                     "ipa": dict(ipa, image="bailu_reference_white.png"), "seeds": SEEDS})

print(json.dumps({"out": OUT, "checkpoint": "animagine-xl-4.0-opt.safetensors", "width": 832, "height": 1216,
                  "negative": NEG, "rembg": True, "jobs": jobs}, ensure_ascii=False, indent=1))
