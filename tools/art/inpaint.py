"""局部補畫被遮擋的部件區域（只改遮罩內像素，其他保持原圖）。
用法：python tools/art/inpaint.py <底圖.png> <遮罩.png(白=補畫)> <out_dir> --prompt "..." [--seeds 1,2,3] [--denoise 1.0] [--lora name:0.8] [--ref image.png]
輸出：<out_dir>/inpaint_<seed>.png（全圖，遮罩外與原圖相同）
"""
import json, sys, uuid, time, pathlib, shutil, urllib.request, urllib.parse, argparse

HOST = "http://127.0.0.1:8188"
COMFY_INPUT = pathlib.Path(r"D:\AI\ComfyUI_windows_portable\ComfyUI\input")
ap = argparse.ArgumentParser()
ap.add_argument("base"); ap.add_argument("mask"); ap.add_argument("out")
ap.add_argument("--prompt", required=True); ap.add_argument("--negative", default=(
    "lowres, bad anatomy, text, watermark, logo, blurry, worst quality, low quality, extra arms, extra hands, "
    "head, face, multiple views, background, scenery"))
ap.add_argument("--seeds", default="11,22,33"); ap.add_argument("--denoise", type=float, default=1.0)
ap.add_argument("--lora", default=""); ap.add_argument("--ref", default=""); ap.add_argument("--ref_weight", type=float, default=0.6)
ap.add_argument("--grow", type=int, default=8); ap.add_argument("--steps", type=int, default=30)
a = ap.parse_args()


def api(path, data=None):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


tag = uuid.uuid4().hex[:8]
for src, name in ((a.base, f"inp_base_{tag}.png"), (a.mask, f"inp_mask_{tag}.png")):
    shutil.copy(src, COMFY_INPUT / name)
if a.ref:
    shutil.copy(a.ref, COMFY_INPUT / f"inp_ref_{tag}.png")
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)

for seed in [int(s) for s in a.seeds.split(",")]:
    g = {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "animagine-xl-4.0-opt.safetensors"}},
        "2": {"class_type": "LoadImage", "inputs": {"image": f"inp_base_{tag}.png"}},
        "3": {"class_type": "LoadImageMask", "inputs": {"image": f"inp_mask_{tag}.png", "channel": "red"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": a.prompt}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": a.negative}},
        "6": {"class_type": "VAEEncodeForInpaint", "inputs": {"pixels": ["2", 0], "vae": ["1", 2], "mask": ["3", 0], "grow_mask_by": a.grow}},
        "7": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0],
              "seed": seed, "steps": a.steps, "cfg": 5.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": a.denoise}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["1", 2]}},
        # 只取遮罩內的新像素貼回原圖，遮罩外保持原樣
        "9": {"class_type": "ImageCompositeMasked", "inputs": {"destination": ["2", 0], "source": ["8", 0], "x": 0, "y": 0, "resize_source": False, "mask": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": f"inpaint_{tag}_{seed}"}},
    }
    model = ["1", 0]
    if a.lora:
        name, _, st = a.lora.partition(":")
        g["20"] = {"class_type": "LoraLoaderModelOnly", "inputs": {"model": model, "lora_name": name, "strength_model": float(st or 1)}}
        model = ["20", 0]
    if a.ref:
        g["30"] = {"class_type": "LoadImage", "inputs": {"image": f"inp_ref_{tag}.png"}}
        g["31"] = {"class_type": "IPAdapterUnifiedLoader", "inputs": {"model": model, "preset": "PLUS (high strength)"}}
        g["32"] = {"class_type": "IPAdapterAdvanced", "inputs": {"model": ["31", 0], "ipadapter": ["31", 1], "image": ["30", 0],
                   "weight": a.ref_weight, "weight_type": "style transfer", "combine_embeds": "concat", "start_at": 0.0, "end_at": 1.0, "embeds_scaling": "V only"}}
        model = ["32", 0]
    g["7"]["inputs"]["model"] = model
    resp = api("/prompt", {"prompt": g, "client_id": tag})
    if resp.get("node_errors"):
        sys.exit("節點錯誤：" + json.dumps(resp["node_errors"], ensure_ascii=False)[:500])
    pid = resp["prompt_id"]
    while pid not in (h := api(f"/history/{pid}")):
        time.sleep(1.5)
    for node in h[pid]["outputs"].values():
        for im in node.get("images", []):
            q = urllib.parse.urlencode({"filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im["type"]})
            with urllib.request.urlopen(f"{HOST}/view?{q}") as r:
                (out / f"inpaint_{seed}.png").write_bytes(r.read())
    print("ok", seed, flush=True)
