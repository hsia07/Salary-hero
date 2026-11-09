# Salary Hero — V19 真實素材缺口與交付狀態
更新：2026-11-09

> 本表以 `art/v18/runtime-manifest.json` 為基準，逐一查核 GitHub 上的檔案是否存在。此前生成的「V19 素材包總覽圖」是**示意圖，不是 186 個可用素材，也不代表已上傳**。任何素材未通過正式審核前不得標為完成。

## 目前缺少的 13 張正式 WebP

| 分類 | 目標路徑 | 狀態 |
|---|---|---|
| 場景 | `art/v18/runtime/backgrounds/office-corridor.webp` | MISSING |
| 場景 | `art/v18/runtime/backgrounds/office-desk.webp` | MISSING |
| 主角 | `art/v18/runtime/hero/idle.webp` | MISSING |
| 主角 | `art/v18/runtime/hero/attack.webp` | MISSING |
| 主角 | `art/v18/runtime/hero/hurt.webp` | MISSING |
| 主角 | `art/v18/runtime/hero/victory.webp` | MISSING |
| 主角 | `art/v18/runtime/hero/sleeping.webp` | MISSING |
| 敵人 | `art/v18/runtime/enemies/printer-idle.webp` | MISSING |
| 敵人 | `art/v18/runtime/enemies/printer-hurt.webp` | MISSING |
| 敵人 | `art/v18/runtime/enemies/printer-defeat.webp` | MISSING |
| 特效 | `art/v18/runtime/effects/slash.webp` | MISSING |
| 特效 | `art/v18/runtime/effects/impact.webp` | MISSING |
| 寵物 | `art/v18/runtime/pets/orange-cat.webp` | MISSING |

## 已提交、可以獨立讀取的 V19 候選素材

| 類型 | GitHub 原始檔案 | 遊戲使用 | 正式審核 |
|---|---|---|---|
| 青藍斬擊 | `art/v19/candidates/effects/slash.svg` | V19 Canvas 已接線 | 待視覺審查 |
| 金粉爆擊 | `art/v19/candidates/effects/impact.svg` | V19 Canvas 已接線 | 待視覺審查 |

這兩個 SVG 是**透明背景、獨立檔案**，不是完整遊戲截圖；正式美術品質尚待使用者驗收。它們沒有取代 V18 指定的 WebP，正式 WebP 清單仍保留 13 項缺口。

## 正式素材入庫規則

1. 分別產出背景、角色、敵人、特效。完整母版只能當參考圖，不可作為遊戲背景或精靈。
2. 角色與敵人必須有透明底、同視角、同基準線、固定尺寸，動畫逐格無人物殘影。
3. 檔案先放 `art/v19/candidates/`，通過尺寸、透明度、視覺驗收及遊戲實際載入測試後，才能移入 runtime。
4. GitHub 提交成功 ≠ 瀏覽器驗收成功。每張素材單獨標記：已生成、已提交、已通過靜態檢查、已通過實機驗收。
5. 不得將任何 UI 示意海報上的「已入庫」「已完成」或數字作為工程成果依據。
