# V18 美術 ZIP 一次匯入

此流程已建立，**但尚未製作 13 張正式素材**。只有真正的分層圖檔能通過驗收；完整遊戲截圖不可作為素材。

## 素材包格式

建立名為 `v18-art.zip` 的 ZIP。ZIP 根目錄必須直接包含以下 13 個檔案路徑（不可多包一層資料夾）：

```text
art/v18/runtime/backgrounds/office-corridor.webp
art/v18/runtime/backgrounds/office-desk.webp
art/v18/runtime/hero/idle.webp
art/v18/runtime/hero/attack.webp
art/v18/runtime/hero/hurt.webp
art/v18/runtime/hero/victory.webp
art/v18/runtime/hero/sleeping.webp
art/v18/runtime/enemies/printer-idle.webp
art/v18/runtime/enemies/printer-hurt.webp
art/v18/runtime/enemies/printer-defeat.webp
art/v18/runtime/effects/slash.webp
art/v18/runtime/effects/impact.webp
art/v18/runtime/pets/orange-cat.webp
```

每張圖片至少 4 KiB，最多 16 MiB；整包解壓後最多 100 MiB。角色、怪物、特效、寵物需真正透明去背，背景不能含預繪角色、敵人、劍光、文字或 UI。人工檢查與瀏覽器 alpha 抽樣仍不可省略。

## 匯入操作

1. 在 GitHub 專案 **Releases** 建立新 release，例如 tag `v18-art-001`。
2. 上傳名稱**完全相同**的附件 `v18-art.zip` 並發布 release。
3. 進入專案 **Actions** → **Import V18 art ZIP from GitHub Release** → **Run workflow**。
4. 輸入剛建立的 release tag，執行。
5. Workflow 下載 ZIP、檢查 13 張素材、執行測試，再提交至 `main`。若驗證失敗，不會提交素材。
6. 檢查 `https://hsia07.github.io/Salary-hero/v18/art-audit.html`，確認檔案載入；再進行人工視覺與動畫審核。

注意：GitHub repository 的 Actions 權限必須允許 workflow 寫入 contents；分支保護也可能禁止直接 push。這個流程只處理素材匯入，不會自動生成圖片或把尚未完成的正式戰鬥介面標記為完成。
