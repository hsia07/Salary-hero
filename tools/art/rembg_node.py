"""產生 ComfyUI 本機去背節點（BiRefNet，內建 LoadBackgroundRemovalModel + RemoveBackground）。
只用本機節點；Bria / Recraft 等雲端付費節點一律不用。
INVERT：JoinImageWithAlpha 會把 MASK 反轉成 alpha，若實測主體變透明就切換此旗標。
"""
INVERT = True


def make_rembg_node(object_info):
    for need in ("LoadBackgroundRemovalModel", "RemoveBackground", "JoinImageWithAlpha", "SaveImage"):
        if need not in object_info:
            raise RuntimeError(f"ComfyUI 缺少節點 {need}")
    spec = object_info["LoadBackgroundRemovalModel"]["input"]["required"]["bg_removal_name"]
    # 舊格式 [[選項...], {...}]；新格式 ["COMBO", {"options": [...]}]
    models = spec[0] if isinstance(spec[0], list) else spec[1].get("options", [])
    if not models:
        raise RuntimeError("找不到去背模型（models/background_removal）")
    name = next((m for m in models if "birefnet" in m.lower()), models[0])

    def build(image_ref, prefix):
        g = {
            "20": {"class_type": "LoadBackgroundRemovalModel", "inputs": {"bg_removal_name": name}},
            "21": {"class_type": "RemoveBackground", "inputs": {"bg_removal_model": ["20", 0], "image": image_ref}},
        }
        mask = ["21", 0]
        if INVERT:
            g["22"] = {"class_type": "InvertMask", "inputs": {"mask": mask}}
            mask = ["22", 0]
        g["23"] = {"class_type": "JoinImageWithAlpha", "inputs": {"image": image_ref, "alpha": mask}}
        g["24"] = {"class_type": "SaveImage", "inputs": {"images": ["23", 0], "filename_prefix": prefix}}
        return g
    return build
