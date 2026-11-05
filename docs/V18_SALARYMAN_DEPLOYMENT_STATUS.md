# V18 社畜勇者部署狀態（新版 512×512）

## 已完成
- 新版 11 張候選素材已在工作環境驗證：512×512 WebP、RGBA、透明度最小 0、最大 253–254。
- 動畫狀態及測試對齊新版分布：idle 2 / walk 3 / attack 3 / hurt 2 / sleep 1。
- GitHub Actions `.github/workflows/v18-import-salaryman-frames.yml` 已改為驗證這 11 張新版素材，透明度允許有損 WebP 的 alpha 最大值略低於 255。
- V18 動畫驗收頁 `v18/salaryman-preview.html` 會讀取動作設定檔，不需要另外硬編碼影格名稱。
- 先前已成功透過 Git blob/tree/commit 提交一張 **舊版 96×96 測試影格**，證明二進位提交能力。

## 尚未完成
- 新版 11 張 512×512 WebP 尚未部署 GitHub。線上 1/11 是舊測試影格，**不是新版素材**。
- 13 張基礎場景、敵人與特效素材仍缺，`v18/layered-battle.html` 尚不能啟動。
- 尚未進行手機 Safari 完整播放、效能與透明邊緣驗收。
- 這些影格是從新版設計圖裁切，不等同於原生獨立繪製的 1024×1024 正式角色。

## 一次匯入流程
1. 將已備妥的 11 張 512×512 WebP 打包為 `salaryman-frames.zip`，ZIP 根目錄須直接放 11 個 `idle-01.webp` 等影格，不要包資料夾。
2. 在 GitHub repository 建立 Release，附上檔名精確為 `salaryman-frames.zip` 的資產。
3. 於 Actions 執行 **Import V18 salaryman animation frames**，輸入 Release tag。
4. Workflow 驗證數量、名稱、尺寸、格式、透明度並 commit 到 `art/v18/runtime/hero/frames/`。
5. 在 `v18/salaryman-preview.html` 確認遠端顯示 11/11，再逐項驗收動畫。

此流程尚未端對端執行。不得把 workflow 存在視為圖片已部署。
