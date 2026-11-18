"""薪水勇者｜本機 ComfyUI 批次生圖＋自動初檢。

用法：
  python tools/art/comfy_batch.py plan.json            # 依計畫排程生圖，結果寫到 plan 指定的 out 目錄
  python tools/art/comfy_batch.py plan.json --dry-run  # 只印出會生成幾張

plan.json 格式：
{
  "out": "D:/AI/runs/bailu-night1",
  "checkpoint": "animagine-xl-4.0-opt.safetensors",
  "width": 832, "height": 1216,
  "negative": "...",
  "rembg": true,
  "jobs": [ {"id":"A01","prompt":"...","cfg":5,"steps":28,"sampler":"euler_ancestral","scheduler":"normal","seeds":[1,2,3]} ]
}
每張圖都是獨立請求（不共享上下文），參數完全記錄在 results.jsonl，可重現。
已完成的 (job, seed) 會跳過，所以中斷後重跑會續做。
"""
import json, sys, time, uuid, urllib.request, urllib.parse, urllib.error, pathlib

HOST = "http://127.0.0.1:8188"


def api(path, data=None):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def fetch(filename, subfolder, typ):
    q = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": typ})
    with urllib.request.urlopen(f"{HOST}/view?{q}", timeout=60) as r:
        return r.read()


def workflow(plan, job, seed, rembg_node):
    w, h = job.get("width", plan["width"]), job.get("height", plan["height"])
    g = {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": job.get("checkpoint", plan["checkpoint"])}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": job["prompt"]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": job.get("negative", plan["negative"])}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "5": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0],
            "seed": seed, "steps": job.get("steps", 28), "cfg": job.get("cfg", 5.0),
            "sampler_name": job.get("sampler", "euler_ancestral"), "scheduler": job.get("scheduler", "normal"), "denoise": 1.0}},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": f"raw_{job['id']}_{seed}"}},
    }
    lora = job.get("lora", plan.get("lora"))
    if lora:  # 角色專屬 LoRA（放在 ComfyUI/models/loras）
        g["50"] = {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": lora["name"], "strength_model": lora.get("strength", 1.0)}}
        g["5"]["inputs"]["model"] = ["50", 0]
    init = job.get("init_image")
    if init:  # img2img：從參考圖出發，denoise 越低越像原圖
        g["40"] = {"class_type": "LoadImage", "inputs": {"image": init}}
        g["41"] = {"class_type": "ImageScale", "inputs": {"image": ["40", 0], "upscale_method": "lanczos", "width": w, "height": h, "crop": "center"}}
        g["42"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["41", 0], "vae": ["1", 2]}}
        g["5"]["inputs"]["latent_image"] = ["42", 0]
        g["5"]["inputs"]["denoise"] = job.get("denoise", 0.5)
        del g["4"]
    ipa = job.get("ipa", plan.get("ipa"))
    if ipa:  # 參考圖約束（IP-Adapter）：image 為 ComfyUI/input 內的檔名
        g["30"] = {"class_type": "LoadImage", "inputs": {"image": ipa["image"]}}
        g["31"] = {"class_type": "IPAdapterUnifiedLoader", "inputs": {"model": g["5"]["inputs"]["model"], "preset": ipa.get("preset", "PLUS (high strength)")}}
        g["32"] = {"class_type": "IPAdapterAdvanced", "inputs": {
            "model": ["31", 0], "ipadapter": ["31", 1], "image": ["30", 0],
            "weight": ipa.get("weight", 0.7), "weight_type": ipa.get("weight_type", "linear"),
            "combine_embeds": "concat", "start_at": ipa.get("start_at", 0.0), "end_at": ipa.get("end_at", 1.0),
            "embeds_scaling": ipa.get("embeds_scaling", "V only")}}
        g["5"]["inputs"]["model"] = ["32", 0]
    if rembg_node:
        g.update(rembg_node(["6", 0], f"cut_{job['id']}_{seed}"))
    return g


def run_one(plan, job, seed, rembg_node, out):
    try:
        resp = api("/prompt", {"prompt": workflow(plan, job, seed, rembg_node), "client_id": str(uuid.uuid4())})
    except urllib.error.HTTPError as e:
        raise RuntimeError("prompt 被拒：" + e.read().decode("utf-8", "replace")[:400])
    if resp.get("node_errors"):
        raise RuntimeError("節點驗證失敗：" + json.dumps(resp["node_errors"], ensure_ascii=False)[:400])
    pid = resp["prompt_id"]
    t0 = time.time()
    while True:
        hist = api(f"/history/{pid}")
        if pid in hist:
            break
        if time.time() - t0 > 600:
            raise TimeoutError(pid)
        time.sleep(1.5)
    h = hist[pid]
    if h.get("status", {}).get("status_str") == "error":
        raise RuntimeError(json.dumps(h["status"].get("messages", [])[-1:], ensure_ascii=False)[:400])
    files = {}
    for node in h["outputs"].values():
        for im in node.get("images", []):
            if im.get("type") != "output":
                continue
            data = fetch(im["filename"], im.get("subfolder", ""), im["type"])
            kind = "cut" if im["filename"].startswith("cut_") else "raw"
            p = out / kind / f"{job['id']}_{seed}.png"
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
            files[kind] = str(p)
    return files, round(time.time() - t0, 1)


def main():
    plan_path = pathlib.Path(sys.argv[1])
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    out = pathlib.Path(plan["out"]); out.mkdir(parents=True, exist_ok=True)
    todo = [(j, s) for j in plan["jobs"] for s in j["seeds"]]
    if "--dry-run" in sys.argv:
        print(f"{len(todo)} 張"); return
    log = out / "results.jsonl"
    done = set()
    if log.exists():
        for line in log.read_text(encoding="utf-8").splitlines():
            r = json.loads(line); done.add((r["job"], r["seed"]))
    rembg_node = None
    if plan.get("rembg"):
        from rembg_node import make_rembg_node  # 依 ComfyUI 實際節點名稱產生去背節點
        rembg_node = make_rembg_node(api("/object_info"))
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    from qa import inspect
    for i, (job, seed) in enumerate(todo, 1):
        if (job["id"], seed) in done:
            continue
        try:
            files, sec = run_one(plan, job, seed, rembg_node, out)
            metrics = inspect(files.get("cut")) if files.get("cut") else {}
            rec = {"job": job["id"], "seed": seed, "sec": sec, "files": files, "qa": metrics,
                   "params": {k: v for k, v in job.items() if k not in ("seeds",)}}
        except Exception as e:  # 單張失敗不停整晚
            rec = {"job": job["id"], "seed": seed, "error": str(e)[:400]}
        with log.open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        print(f"[{i}/{len(todo)}] {job['id']} seed={seed} {rec.get('sec','ERR')}s {rec.get('qa',{}).get('verdict', rec.get('error',''))}", flush=True)


if __name__ == "__main__":
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    main()
