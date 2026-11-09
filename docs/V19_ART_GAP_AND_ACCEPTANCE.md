# 薪水勇者：正式素材缺口與候選庫（2026-11-09）

## 已確認事實

- **V18 指定的 13 張正式 WebP：13/13 仍缺**。逐一查驗 `art/v18/runtime-manifest.json` 所列路徑均得到 404。
- **V19 已收集 13 張「分離的 SVG 美術候選」**，保存在 `art/v19/candidates/`，並有 `manifest.json`。它們是可讀取的向量來源，不是 13 張正式 WebP，也不代表已通過美術審核。
- 另外，`art/v18/runtime/hero/frames/` 的 **11 個逐格 WebP 檔都已存在**：idle ×2、walk ×2、attack ×3、hurt ×2、sleep ×2。存在不等於透明度、角色一致性、影格連續性已驗收。
- `art/v18/home-master.webp` 是完整概念圖、**只能作為參考**；禁止用整圖或裁切其內的人物／敵人／HUD 當正式分層素材。
- 自動生成的「素材包總覽海報」也僅供構想參考，海報上聲稱的上傳數量／完成度不得視為 repo 的真實狀態；這種海報未被登錄成可遊玩素材。

## 正式 WebP 缺口 13 件

| 正式目標 | 新增／既有的 V19 SVG 候選 | 美術審核 |
|---|---|---|
| `art/v18/runtime/backgrounds/office-corridor.webp` | `art/v19/candidates/backgrounds/office-corridor.svg` | 待驗收 |
| `art/v18/runtime/backgrounds/office-desk.webp` | `art/v19/candidates/backgrounds/office-desk.svg` | 待驗收 |
| `art/v18/runtime/hero/idle.webp` | `art/v19/candidates/hero/idle.svg` | 待驗收 |
| `art/v18/runtime/hero/attack.webp` | `art/v19/candidates/hero/attack.svg` | 待驗收 |
| `art/v18/runtime/hero/hurt.webp` | `art/v19/candidates/hero/hurt.svg` | 待驗收 |
| `art/v18/runtime/hero/victory.webp` | `art/v19/candidates/hero/victory.svg` | 待驗收 |
| `art/v18/runtime/hero/sleeping.webp` | `art/v19/candidates/hero/sleeping.svg` | 待驗收 |
| `art/v18/runtime/enemies/printer-idle.webp` | `art/v19/candidates/enemies/printer-idle.svg` | 待驗收 |
| `art/v18/runtime/enemies/printer-hurt.webp` | `art/v19/candidates/enemies/printer-hurt.svg` | 待驗收 |
| `art/v18/runtime/enemies/printer-defeat.webp` | `art/v19/candidates/enemies/printer-defeat.svg` | 待驗收 |
| `art/v18/runtime/effects/slash.webp` | `art/v19/candidates/effects/slash.svg` | 待驗收 |
| `art/v18/runtime/effects/impact.webp` | `art/v19/candidates/effects/impact.svg` | 待驗收 |
| `art/v18/runtime/pets/orange-cat.webp` | `art/v19/candidates/pets/orange-cat.svg` | 待驗收 |

## V19 SVG 候選性質

1. 場景、人物、敵人、特效、寵物分別獨立存檔，避免在整張場景圖裡預先畫死動態人物。
2. 主角為白襯衫、紅領帶、識別證、紅披風、疲倦棕髮；SVG 是新製的向量風格候選，**尚未達到使用者 V18 截圖的高細節繪製品質**。
3. 影印機候選是基於 repo 原有的 `art/printer-boss.svg` 延伸姿勢；劍氣、命中特效 SVG 已存在於目標候選目錄並被保留。不可宣稱全部是新生成或全部來自 AI 繪畫。
4. 候選根目錄 `art/v19/candidates/`，預覽檢查 `v19/art-review.html`。

## 正式轉用門檻（尚未通過）

- [ ] 人工比對 V18 正式美術：角色形象、顏色、燈光、視角與精緻程度。
- [ ] 角色、敵人、特效、橘貓逐張透明底檢驗；背景完整不透明且不含預繪角色、敵人與文字。
- [ ] 全部主角動作定位一致、腳底基準一致；倒地不溢出畫布；沒有鬼影。
- [ ] 從 SVG 或獨立正式原畫分別輸出實際 `WebP`；檢查尺寸、alpha 與瀏覽器解碼。
- [ ] 整合到 Canvas，驗證死亡移除、技能命中、角色換裝、關卡切換、手機 Safari 顯示。
- [ ] 使用者審圖確認後，才可將正式 WebP 匯入 `art/v18/runtime/`，並變更原 manifest 的 `status`。

## 仍需要延伸製作

- 角色動畫真正的連續中間影格、裝備獨立覆蓋圖層與換裝外觀；
- 其他小怪、首領、奇遇 NPC、怪物受傷／死亡影格；
- 場景前景、互動物件、寶箱打開／關閉、獎勵跳字、技能連續特效；
- 裝備圖鑑、寵物動態影格、事件插畫、完整裝飾 UI 元件；
- 自動化檔案檢查、人工美術評審與手機上即時動畫驗收。

**規則：** 「生成」≠「已上傳」≠「已通過驗收」≠「已整合進可玩的遊戲」。每個階段保留獨立記錄。
