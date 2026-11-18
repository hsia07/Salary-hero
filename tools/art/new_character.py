"""建立角色美術資料庫的標準資料夾（60 名角色共用同一結構，使用者 2026-11-19 指定）。
用法：python tools/art/new_character.py <角色id> [<角色id> ...]
      python tools/art/new_character.py --all     # 依 ROSTER_60_CHARACTER_CARDS_V1.json 建立全部
已存在的檔案不覆寫，只補缺的資料夾與範本。

art/characters/<id>/
  references/  參考圖（使用者提供或核准的造型基準）
  incoming/    待驗收素材（生圖產出先放這裡）
  portrait/    收藏立繪
  layers/      角色分層
  weapons/     專武
  awakening/   覺醒
  animations/  動作動畫
  vfx/         專屬特效
docs/characters/<id>/
  DESIGN_LOCK.md  造型鎖定
  ASSET_LEDGER.md 素材帳（只追加）
  prompts/        生圖提示詞
  QA/             驗收紀錄
"""
import json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
ART_DIRS = ["references", "incoming", "portrait", "layers", "weapons", "awakening", "animations", "vfx"]
DOC_DIRS = ["prompts", "QA"]


def card(cid):
    cards = json.loads((ROOT / "docs/ROSTER_60_CHARACTER_CARDS_V1.json").read_text(encoding="utf-8"))["characters"]
    return next((c for c in cards if c["id"] == cid), None)


def rarity(cid):
    j = json.loads((ROOT / "docs/ROSTER_60_STORY_IMPORTANCE_RARITY_V2.json").read_text(encoding="utf-8"))
    found = []

    def walk(o):
        if isinstance(o, dict):
            if o.get("id") == cid and "rarity" in o:
                found.append(o["rarity"])
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(j)
    return found[0] if found else "?"


def make(cid):
    c = card(cid)
    if not c:
        raise SystemExit(f"名冊裡找不到 {cid}")
    art = ROOT / "art/characters" / cid
    doc = ROOT / "docs/characters" / cid
    for d in ART_DIRS:
        (art / d).mkdir(parents=True, exist_ok=True)
        keep = art / d / ".gitkeep"
        if not any(p.name != ".gitkeep" for p in (art / d).iterdir()):
            keep.touch()
    for d in DOC_DIRS:
        (doc / d).mkdir(parents=True, exist_ok=True)
        if not any((doc / d).iterdir()):
            (doc / d / ".gitkeep").touch()
    lock = doc / "DESIGN_LOCK.md"
    if not lock.exists():
        lock.write_text(f"""# {c['name']}（{cid}）｜造型鎖定
狀態：**PROPOSED**（使用者核准後改 DESIGN_APPROVED）。稀有度（正式）：{rarity(cid)}；定位：{c.get('role')}

## 每次生成前
先完整重讀 `docs/FORMAL_ART_RULES.md`，再讀本檔與 `ASSET_LEDGER.md`。任一無法取得就停止生成。
畫風依 `docs/ARCHITECTURE.md` §7「全角色畫風」（以白律參考圖為準）。

## 0. 正式造型參考圖
（待補：`art/characters/{cid}/references/`）

## 1. 角色卡既有設定
- 性別：{c.get('gender')}
- 外觀：{c.get('visual')}
- 生前：{c.get('past')}
- 伏筆：{c.get('secret')}
""", encoding="utf-8")
    ledger = doc / "ASSET_LEDGER.md"
    if not ledger.exists():
        ledger.write_text(f"# {c['name']}素材帳（只追加）\n欄位：日期｜asset_id｜檔案路徑｜尺寸｜來源｜判定標籤｜備註\n", encoding="utf-8")
    print("OK", cid)


if __name__ == "__main__":
    ids = sys.argv[1:]
    if ids == ["--all"]:
        ids = [c["id"] for c in json.loads((ROOT / "docs/ROSTER_60_CHARACTER_CARDS_V1.json").read_text(encoding="utf-8"))["characters"]]
    for i in ids:
        make(i)
