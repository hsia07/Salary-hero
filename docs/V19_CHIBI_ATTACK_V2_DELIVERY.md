# V19 七姿勢高清攻擊｜實際部署紀錄

更新：2026-11-09。

**問題根因：** 過去只提交動畫播放程式，沒有提交高解析度圖片；`?art=chibi-v2` 指向不存在的 WebP，於是畫面回退到 128×128 AVIF，造成模糊與怪異姿勢切換。使用者看到的問題屬實。

## 已修正

- 真正將 **7×512px** 的原始 PNG 圖組（3584×512、RGBA）提交到 GitHub `main`。
- 二進位路徑：`art/v19/candidates/characters/starter/chibi/attack-v2-7pose-512.png`。
- Git blob SHA：`718c1f02fcea8930b66029a326b646a1e625819a`。
- `v19/app.mjs` 的**預設**場景使用高清 Q 版主角和此攻擊 PNG，不須手動選檔或輸入 `?art=chibi-v2`。
- 已刪除遊戲對舊 `attack-5pose-128.avif` 的直接載入引用；高清檔缺失時顯示失敗告警，不以 128px 圖假裝通過。
- `v19/play.html` 顯示高清素材載入狀態與一鍵受傷動畫測試；加上模組 URL 版本號避免 iPhone 持續使用舊的 JavaScript。
- 正式動作節奏：`[115,135,95,60,145,100,155]`ms（總長 805ms），有七張不同公事包姿勢；不是單張圖位移。

## 已執行的驗證

在檔案產生環境以 Pillow 解碼：3584×512、RGBA alpha 0–255；7 格像素範圍互不相同、人物與公事包均有邊界留白。GitHub 已回讀相同二進位 blob SHA。已新增 `scripts/qa-v19-hd-battle-art.py` 和真正預設遊戲的瀏覽器回歸測試。

**仍需實機驗證：** GitHub Pages 是否已完成部署、Safari 播放是否順暢，以及正式美術品質是否達使用者最終標準；不能以程式碼或 PNG 尺寸通過取代真實手機畫面確認。
