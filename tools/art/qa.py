"""透明 PNG 自動初檢（只做可量測的項目；美感與設計一致性仍需人工）。

檢查：
- alpha：是否真的有透明背景、四邊是否乾淨
- 主體數：主要不透明連通區塊數（>1 個大塊 → 可能是多人／展示板）
- 頭身比估計：從上往下找「頸部」（頭部下方寬度明顯收窄處），head_ratio = 頸部高度 / 全身高度
  2.5 頭身 ≈ 0.40；3 頭身 ≈ 0.33；容許 0.34–0.46
- 邊緣：半透明像素比例（毛邊指標）
"""
from PIL import Image
import numpy as np


def _components(mask):
    # 低解析度做連通區塊，避免太慢
    small = mask[::4, ::4]
    h, w = small.shape
    seen = np.zeros_like(small, dtype=bool)
    sizes = []
    for y in range(h):
        for x in range(w):
            if small[y, x] and not seen[y, x]:
                stack = [(y, x)]; seen[y, x] = True; n = 0
                while stack:
                    cy, cx = stack.pop(); n += 1
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; stack.append((ny, nx))
                sizes.append(n)
    sizes.sort(reverse=True)
    return sizes


def inspect(path):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)[:, :, 3]
    H, W = a.shape
    solid = a > 200
    r = {"size": [W, H]}
    if solid.sum() < H * W * 0.02:
        r.update(verdict="REJECT_EMPTY"); return r
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    r["border_opaque"] = round(float((border > 30).mean()), 3)
    sizes = _components(solid)
    big = [s for s in sizes if s > sizes[0] * 0.15]
    r["subjects"] = len(big)
    ys = np.where(solid.any(axis=1))[0]
    top, bot = int(ys[0]), int(ys[-1])
    body_h = bot - top + 1
    widths = solid[top:bot + 1].sum(axis=1).astype(float)
    k = max(3, body_h // 60)
    widths = np.convolve(widths, np.ones(k) / k, mode="same")
    # 頭部最寬處在上方 55% 內；頸部 = 其下方第一個寬度降到 ≤ 65% 頭寬的位置
    upper = widths[: int(body_h * 0.55)]
    head_w_i = int(upper.argmax())
    neck = None
    for i in range(head_w_i, int(body_h * 0.62)):
        if widths[i] <= upper.max() * 0.65:
            neck = i; break
    r["head_ratio"] = round(neck / body_h, 3) if neck else None
    semi = (a > 10) & (a < 245)
    edge = solid ^ np.roll(solid, 1, 0) | solid ^ np.roll(solid, 1, 1)
    r["fringe"] = round(float(semi.sum()) / max(1, float(edge.sum())), 2)
    problems = []
    if r["border_opaque"] > 0.02: problems.append("BORDER")          # 主體貼邊或背景沒去乾淨
    if r["subjects"] != 1: problems.append("MULTI")                  # 多主體／展示板嫌疑
    # 頭身指標只做參考：以使用者參考圖校準（2026-11-19）時，披風＋蓬髮造型會讓頸部偵測失效（回傳 None），
    # 故不再列入判定；比例改由人工對照 references/ 判斷。
    r["ratio_note"] = "info-only"
    r["problems"] = problems
    r["verdict"] = "PASS_AUTO" if not problems else "FLAG_" + "+".join(problems)
    return r


if __name__ == "__main__":
    import sys, json
    for p in sys.argv[1:]:
        print(p, json.dumps(inspect(p), ensure_ascii=False))
