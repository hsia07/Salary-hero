# 薪水勇者 Salary Hero｜AI 施工入口
手機直式單屏日式 Q 版 RPG（紫金暗色、頹廢職場 × 奇幻）。全程繁體中文；壞消息直說；不把規格、候選圖、未跑的測試說成完成。目標：可玩一年以上的深度 RPG。使用者說「繼續」= 依計畫實際施工，不重講規劃。

## 開工只讀
1. 本檔 → 2. `docs/ARCHITECTURE.md`（檔案地圖、存檔、CI、版號、**正史裁決對照 §7**）→ 3. `docs/CHANGELOG.md` 檔尾 10 行
4. 需要背景時才讀：`docs/CLAUDE_HANDOFF_2026-11-18.md`（使用者硬需求原文）
5. 做該主題才讀對應規格（用 Grep 定位，>10KB 的檔用 offset/limit）

## 不要讀（大檔／遺產）
`boss-v1-play.html`(2.4MB)、`docs/ROSTER_60_DEEP_PRODUCTION_BIBLE_V2.json`(843KB，用 node 取單一 id)、`game.js`、`legacy-v17.html`、`play-v14.html`、根目錄 *-v13x.js、`v18/`、`art/**` 二進位檔、`docs/novel/**/QA_*`（只在審稿時讀）

## 硬規則
- 不搬、不改名、不刪既有檔案（Pages 部署整個 repo，CI 綁路徑）；不清存檔、不改舊 localStorage key 與舊事件 ID。
- 不重做或簡化既有功能；新舊文件衝突 → 看 ARCHITECTURE §7，沒有裁決就問使用者。
- 遊戲功能必須正式美術＋動畫，禁止 emoji、CSS/SVG 幾何拼接、表單冒充。
- **每次生圖前**完整重讀 `docs/FORMAL_ART_RULES.md`（不能用摘要代替）＋角色規格；一次一個部件、透明 PNG、禁止展示板。Claude 自己不能生成點陣圖 → 寫單部件提示詞給使用者生圖，收圖後驗收。
- 正式角色製作順序 UR → SSR → SR → R → N（UR 名單見 §7）。
- 每次施工：改 → `node tools/check.mjs` → commit → push → 查 CI → 記 CHANGELOG。

## 常做的事
| 事 | 怎麼做 |
|---|---|
| 全部檢查 | `node tools/check.mjs`（`--quick` 略過舊回歸） |
| 單檔測試 | `node --test v19/xxx.test.mjs` |
| 查 CI | `curl -s "https://api.github.com/repos/hsia07/Salary-hero/actions/runs?per_page=15"` 取 name/conclusion/head_sha |
| 取名冊單一角色 | `node -e "const j=require('./docs/ROSTER_60_CHARACTER_PRODUCTION_SPECS_V1.json');console.log(JSON.stringify(j.characters.find(c=>c.id==='office-lawyer'),null,1))"` |
| 稀有度 | `docs/ROSTER_60_STORY_IMPORTANCE_RARITY_V2.json` |
| 改模組後快取 | 同步 `v19/play.html`、`v19/app.mjs` 的 `?v=` |
| 小說結構檢查 | `python tools/story/check_world01_novel.py` |
| 手機 QA | `python scripts/qa-v19-mobile-smoke.py`（需 playwright） |
| 白律美術進度 | `docs/characters/office-lawyer/` |

## 施工流程與分工（`.claude/agents/`）
| 段 | 誰 | 可並行 |
|---|---|---|
| 盤點／找定義 | `Explore` | 是 |
| 改程式 | 主對話 | — |
| 跑全部測試＋手機 QA，只回通過/失敗 | `tester` | 與內容審查並行 |
| 新劇情／角色文字對照正史 | `lore-checker` | 是 |
| 使用者給的新圖：alpha、毛邊、尺寸、深淺底 | `art-intake` | 是 |
小事不派；助手回報由主對話轉述。
