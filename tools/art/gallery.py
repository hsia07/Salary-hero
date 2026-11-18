"""把一次批次結果整理成「給使用者挑圖」的 HTML 圖庫（單張獨立顯示，不拼成展示板）。
用法：python tools/art/gallery.py D:/AI/runs/bailu-night1 [--top 30]
輸出：<run>/gallery/index.html ＋ 縮圖。依自動初檢與參數組排序；每組附設定。
並把同一畫面放一張遊戲現有怪物＋背景，方便判斷是否違和。
"""
import json, sys, pathlib, shutil, base64, io as _io
from collections import defaultdict
from PIL import Image

run = pathlib.Path(sys.argv[1])
top = int(sys.argv[sys.argv.index("--top") + 1]) if "--top" in sys.argv else 30
repo = pathlib.Path(__file__).resolve().parents[2]
recs = [json.loads(l) for l in (run / "results.jsonl").read_text(encoding="utf-8").splitlines()]
ok = [r for r in recs if "files" in r and r["files"].get("cut")]


def score(r):
    q = r["qa"]; s = 0.0
    if q.get("verdict") == "PASS_AUTO": s += 3
    hr = q.get("head_ratio") or 0
    s -= abs(hr - 0.40) * 10
    s -= q.get("border_opaque", 1) * 20
    s -= max(0, q.get("subjects", 2) - 1) * 2
    return s


groups = defaultdict(list)
for r in ok:
    groups[r["job"]].append(r)
ranked_groups = sorted(groups.items(), key=lambda kv: -sum(sorted((score(x) for x in kv[1]), reverse=True)[:3]))

g = run / "gallery"; g.mkdir(parents=True, exist_ok=True)


def uri(im, q=82):
    """圖片直接嵌進 HTML（webp data URI），App 預覽與手機都能顯示，不依賴旁邊的檔案。"""
    b = _io.BytesIO(); im.save(b, "WEBP", quality=q)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()


bg = Image.open(repo / "art/v20/runtime/backgrounds/battle-library-v20-p10.webp").convert("RGB")
bg.thumbnail((440, 380)); BG_URI = uri(bg, 70)
golem = Image.open(repo / "art/v19/runtime/monsters/chair-golem/idle.webp").convert("RGBA").crop((0, 0, 384, 384))
golem.thumbnail((240, 240)); GOLEM_URI = uri(golem)

cards, shown = [], 0
for job, rs in ranked_groups:
    if shown >= top:
        break
    rs = sorted(rs, key=score, reverse=True)[:4]
    items = []
    for r in rs:
        fn = f"{r['job']}_{r['seed']}.png"
        im = Image.open(r["files"]["cut"]).convert("RGBA")
        im.thumbnail((360, 520)); src = uri(im)
        q = r["qa"]
        items.append(f'<figure><div class="stage"><img class="hero" src="{src}"><img class="foe" src="{GOLEM_URI}"></div>'
                     f'<figcaption>{r["job"]} · seed {r["seed"]}<br>頭身指標 {q.get("head_ratio")} · {q.get("verdict")}</figcaption></figure>')
        shown += 1
    p = rs[0]["params"]
    cards.append(f'<section><h2>{job}</h2><p class="cfg">CFG {p.get("cfg")} · {p.get("steps")} 步 · {p.get("sampler")}</p>'
                 f'<div class="row">{"".join(items)}</div><details><summary>提示詞</summary><code>{p["prompt"]}</code></details></section>')

html = f"""<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>白律 畫風挑選</title><style>
body{{margin:0;background:#140d1f;color:#efe6d2;font-family:"Noto Serif TC","Microsoft JhengHei",serif;padding:16px}}
h1{{color:#f3dfa0;font-size:20px}} h2{{font-size:15px;color:#f3dfa0;margin:20px 0 2px}} .cfg{{margin:0 0 8px;color:#b9aecb;font-size:12px}}
.row{{display:flex;gap:10px;overflow-x:auto}} figure{{margin:0;flex:0 0 220px}}
.stage{{position:relative;width:220px;height:260px;background:url({BG_URI}) center 70%/cover;border:1px solid #d8b25a;border-radius:6px;overflow:hidden}}
.hero{{position:absolute;left:4px;bottom:6px;height:170px}} .foe{{position:absolute;right:-6px;bottom:4px;height:120px}}
figcaption{{font-size:11px;color:#b9aecb;margin-top:4px}} code{{font-size:11px;color:#b9aecb;white-space:pre-wrap}}
</style><h1>白律｜第一晚畫風探索（{len(ok)} 張中依自動初檢排序）</h1>
<p>每格左邊是新生成的白律，右邊是遊戲現有的椅子魔像、背景是現有圖書館戰場：請挑「放在一起最不違和、最精緻」的組別。</p>
{''.join(cards)}</html>"""
(g / "index.html").write_text(html, encoding="utf-8")
print(g / "index.html", "groups", len(groups), "shown", shown)
