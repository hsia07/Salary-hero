"""以骨架姿勢（ControlNet OpenPose）＋角色 LoRA＋參考圖畫風，產生角色專屬動作的逐格圖。
一致性：全部格用同一組種子；之後由 color_match.py 對齊參考圖色彩。
用法：python tools/art/make_plan_pose.py <move_id> <lora> <out> > plan.json
"""
import json, sys, glob, os
MOVE, LORA, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
CHAR = {"bailu_pen_thrust": ("bailu_sh, 1boy, solo, chibi, mature male, silver hair, grey hair, messy hair, ahoge, grey eyes, half-closed eyes, mole under eye, "
        "dark green cape, gold trim, gold epaulettes, gold aiguillette, white stole, white collared shirt, green necktie, black vest, black suit, "
        "black gloves, black pants, black boots, dark leather briefcase with gold corners in one hand, large black fountain pen with gold nib in the other hand",
        "bailu_reference_white.png")}
ACT = {"ready": "standing, calm, pen pointed forward", "brace": "crouching slightly, knees bent, pulling pen back, focused",
       "windup": "leaning back, raising fountain pen high behind head, winding up, determined", "step": "stepping forward, leaning forward, about to strike",
       "impact": "lunging forward, thrusting fountain pen straight forward, arm fully extended, cape flowing behind, dynamic", 
       "followthrough": "deep lunge, arm extended, follow through, cape flowing", "recover": "returning to stance, pen raised, calm"}
base, ref = CHAR[MOVE]
STYLE = "facing right, looking right, three-quarter view, full body, detailed lineart, soft shading, game character art, simple background, white background, masterpiece, high score, great score"
NEG = ("lowres, bad anatomy, bad hands, extra arms, extra legs, extra pen, two pens, two briefcases, text, watermark, blurry, worst quality, low quality, "
       "purple hair, pink hair, black hair, red necktie, multiple views, background, scenery, effects, adult proportions, tall")
jobs = []
for f in sorted(glob.glob(fr"D:\AI\ComfyUI_windows_portable\ComfyUI\input\{MOVE}_*.png")):
    name = os.path.basename(f)[:-4]; key = name.split("_")[-1]
    jobs.append({"id": name, "prompt": f"{base}, {ACT[key]}, {STYLE}", "cfg": 5.5, "steps": 30, "sampler": "dpmpp_2m", "scheduler": "karras",
                 "width": 1024, "height": 1024, "lora": {"name": LORA, "strength": 0.9},
                 "controlnet": {"model": "controlnet-openpose-sdxl-xinsir.safetensors", "image": os.path.basename(f), "strength": 0.85, "end": 0.75},
                 "ipa": {"image": ref, "weight": 0.65, "weight_type": "style transfer"}, "seeds": [101, 202]})
print(json.dumps({"out": OUT, "checkpoint": "animagine-xl-4.0-opt.safetensors", "width": 1024, "height": 1024, "negative": NEG, "rembg": True, "jobs": jobs}, ensure_ascii=False, indent=1))
