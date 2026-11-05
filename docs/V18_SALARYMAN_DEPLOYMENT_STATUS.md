# V18 社畜勇者：動畫驗收與部署狀態

## 已驗證
- 11 張候選 WebP 在本機素材包內：idle ×4、walk ×2、attack ×2、hurt ×2、sleep ×1。
- 每張 256×256，RGBA 透明度範圍含 0 和 255。
- 已產生獨立離線 HTML，將全部影格內嵌，可在無網路情況下切換五種動作。
- GitHub binary blob → tree → commit → branch ref 流程已成功用 96×96 測試圖驗證。

## 尚未完成（不得宣稱已完成）
- 11 張正式 256×256 影格尚未全部推送至 GitHub；目前線上僅 1 張測試圖。
- 角色圖片源自合成參考圖，邊緣與姿勢品質仍需人工審核。
- 原本 13 張場景／敵人／特效素材尚未齊備，v18/layered-battle.html 仍會 fail-closed。
- 尚未在 iPhone Safari 完成正式戰鬥實測。

## 下一個阻塞點
需要將本機 zip 的二進位內容送到 GitHub（可用現有 GitHub Release + Actions 匯入流程，或逐張 Git blob API）。建立文字版 workflow 不等於圖片已部署。

## 驗收規則
1. 檢查遠端 11 個 WebP URL 全部回應 200 且 MIME 為 image/webp。
2. 驗證 11 張 256×256 有透明 alpha；不得拿 96×96 測試圖冒充正式影格。
3. 在手機直式動畫頁逐一播放五種動作。
4. 完成 13 張基礎素材後，才驗證正式 V18 分層戰鬥。
5. 不得改動 V17 正式版。
