# 薪水勇者｜架構地圖
最後更新：2026-11-18（main e521a54 之後；遊戲版號見 §6）

## 1. 技術與執行
- 純靜態 HTML + ES Modules，無 build、無 package.json。GitHub Pages 部署**整個 repo**（workflow `tieshi-immersive-pages`），所以**不要搬動或改名任何檔案**——網址、CI 路徑過濾、`node --check` 清單都綁固定路徑。
- 入口：`index.html` → `location.replace('./v19/play.html')`。試玩 https://hsia07.github.io/Salary-hero/v19/play.html
- 本機檢查：`node tools/check.mjs`（約 20 秒，語法 + 全部單元測試 + 4 個舊回歸）。
- 瀏覽器手機 QA：`scripts/qa-*.py`（Python playwright，390px）；CI 也跑。

## 2. 資料夾
| 目錄 | 內容 |
|---|---|
| `v19/` | **現行遊戲**。play.html + ~60 個 .mjs/.css（v20*/v21* 檔名的模組也在這）+ 39 個 `*.test.mjs` |
| `tests/` | s1-*/tieshi-*/world01-*/formation-* 單元測試；boss-v* 瀏覽器驗收；4 個 `.cjs` 測根目錄 game.js |
| `docs/` | 規格、正史、名冊（ROSTER_60_*）、美術規範；`docs/novel/world01/` 小說正文與鎖定檔 |
| `art/` | v4 SVG、v18、v19 `runtime/`（正式）與 `candidates/`（候選）、v20、v21、s1 |
| `scripts/` | Python 素材建置與手機 QA |
| `tools/` | `check.mjs`、素材匯入、`story/check_world01_novel.py` |
| 根目錄 | 舊版遺產（game.js v51、legacy-v17、play-v14、boss-v1~v5、*-v13x.js）——**不要讀，不要刪** |
| `art/characters/<id>/` | **角色美術資料庫**（60 人同結構）：references 參考圖、incoming 待驗收、portrait 立繪、layers 分層、weapons 專武、awakening 覺醒、animations 動作、vfx 特效 |
| `docs/characters/<id>/` | DESIGN_LOCK.md 造型鎖定、ASSET_LEDGER.md 素材帳、prompts/ 提示詞、QA/ 驗收紀錄。新角色用 `python tools/art/new_character.py <id>` 建立 |
| `v18/`、`tieshi-immersive/` | 舊版頁面／鐵時 demo，僅維護 |

## 3. 模組地圖（v19）
- `play.html` 載入 `app.mjs` 與 `v20-art-live.mjs`。
- `app.mjs`（116KB，UI 主控）→ engine、s1-progression、v21-squad-core、roster、skins、lite-*（equipment/idle/builds/skills/legendaries/armor-poses/tactics）、portrait-home、v20-home、v21-unified-stage、v21-research-lab、v21-forge-atelier、v20-scene-light、v20-battle-stage、skin-ui、attack-timing、monster-motion、sprite-atlas、monster-variants、各怪 *-combat、hurt-*、training-mode、combat-feedback。
- `engine.mjs`（67KB，狀態機＋存檔）→ weekend-chaos、lite-presets、s1-colleague-progression、`s1-formation-live` → `formation-combat-ai` + `formation-combat-runtime`（七人站位戰鬥）。
- **尚未接入 play.html**：tieshi-*（9）、world01-*（3）、annual-events、s1-hell-monday-dungeon、s1-hero-active-skills、s1-party-ai、s1-status-effects、s1-portrait-battle-*。只被測試與 boss-v5/預覽頁使用。
- `roster.mjs` 尚無 `office-lawyer`（白律未進遊戲）。
- 大檔定位：`grep -n "^export function\|^function " v19/app.mjs | grep 關鍵字`，不要整檔讀。

## 4. 存檔（localStorage）
- 現行：`salary-hero-v19-save-1`（engine.mjs `KEY`）。
- 劇情：`salary-hero:tieshi-story:v1`（**舊事件 ID 與進度必須保留**）、`salary-hero:tieshi-necromancer:v1`、`salary-hero:world01-b2-investigation:v1`、`salary-hero:world01-narrative:v1`、`salary-hero:story-event`。
- 本機素材：`salary-hero-v19-local-chibi-hurt-v1`、`salary-hero-v19-local-chibi-v2-atlas`。
- 舊版 key（game.js 等）不得清除。

## 5. CI（.github/workflows，17 個，皆 push main 觸發＋路徑過濾）
v19-gameplay-ci（主）、formation-combat-ci、tieshi-regression、v19-art-runtime-ci、v19-encounters-mobile、v19-illustrated-training-mobile、v21-forge-mobile、v21-research-lab-mobile、boss-v3/v4/v5、v18-*、v19-render-hero-assets（會 commit QA json）、tieshi-immersive-pages（部署）。
查結果：`curl -s "https://api.github.com/repos/hsia07/Salary-hero/actions/runs?per_page=20"`（公開 API，免 gh）。

## 6. 版號
沒有統一版號常數；快取破壞靠 `play.html` 與 `app.mjs` 內 import 的 `?v=` 字串（如 `app.mjs?v=v21-art-forge-1`）。**改了某模組就要同步改引用它的 `?v=`**，否則手機吃舊快取。查：`grep -n "?v=" v19/play.html v19/app.mjs`。

## 7. 正史裁決對照（新舊衝突時以左欄為準）
| 主題 | 現行裁決 | 已過時寫法 |
|---|---|---|
| 稀有度 | `ROSTER_60_STORY_IMPORTANCE_RARITY_V2.json`（實算 60 人：UR7 SSR12 SR23 R15 N3） | ART_LORE_RULES_V1、DEEP_PRODUCTION_BIBLE_V2 的稀有度欄 |
| 白律 | **UR**・反擊驅散，第一位正式製作 | 上述兩檔寫 SSR |
| 鐵時 | **SSR**（新正史） | TIESHI_FIXED_SR_RARITY_V7_1、FORMAL_ART_RULES §5、RARITY_REBALANCE_V1 寫 SR |
| UR 製作順序 | office-lawyer → steel-saint → alien-siren → myth-wukong → myth-lotus → nether-singer → anomaly-angel | — |
| 世界分組 | `ROSTER_60_ORIGIN_WORLD_GROUPS_V3` | V2 |
| 小說基線 | `docs/novel/world01/expanded/PHASE1_CANONICAL_STORY_MANIFEST_2026_11_15.md`（凍結，不無限微修） | 早期 24 個暫稱（保全哥等） |
| 專武覺醒階數 | **未定案**：聊天提 N/R基礎、SR專屬、SSR二階、UR三階 vs DEEP_PRODUCTION_RULES_V2 的 0–4 階 | 不得擅自覆寫 |
| 全角色畫風 | **以白律參考圖的畫風為準**：日系手遊 Q 版、精細線稿＋柔和漸層上色、約 2.5 頭身（使用者 2026-11-19：「其他人物也都按這個風格來」） | 程式繪製向量風（已否決） |
| 戰鬥頭身 | **2.5 頭身**（使用者 2026-11-18 裁決，含白律） | 聊天曾提 3.5 頭身 |
