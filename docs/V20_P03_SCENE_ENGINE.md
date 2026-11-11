# 《薪水勇者》V20 P0.3｜真正替換引擎場景圖
日期：2026-11-11

## 發現的根本問題
V20 P0.1、P0.2 的 CSS 額外前景改善了裝飾，但戰鬥程式 `v19/app.mjs` 在 `drawStage()` 每幀先呼叫 `drawImageCover(images.bg)`，而原本的 `images.bg` 還是 V19 舊 `storybook-corridor.svg`；Canvas 不能單靠 CSS 背景變得精緻。

## 這次已接入的真實修改
- 新增完整主城背景 `art/v20/runtime/backgrounds/office-v20-painterly.svg`，960×560；保留原本透視並補上暖金燈光、彩色微粒、地面反射筆觸、微顆粒畫布質感，不含文字、角色、敵人、按鈕。
- 新增完整戰場背景 `art/v20/runtime/backgrounds/corridor-v20-painterly.svg`，720×620；補上柔和月光、金色燈暈、石地筆觸、書架折光、微粒與布料感，不含任何 UI、角色與敵人。
- `v19/app.mjs` **真正的戰鬥 Canvas 底圖**改成 V20，非練習模式才換；練習圖與正式戰鬥逐格動畫保持不變。以 `#world[data-scene-art=v20-painterly-loaded]` 表示成功載入，`fallback` 表示已回退舊底圖。
- `v19/v20-art-live.css` 的主城背景更新為新 V20，戰場 CSS 底色也同步更新以應付 Canvas 尚未就緒時。
- `v19/v20-art-live.test.mjs` 檢查真正引用、素材存在、尺寸與無預繪 UI。

## 待驗收與下一階段
這仍是高密度 SVG 視覺深化，**不是手繪大師級的完成原畫**；必須拿實際手機截圖比對使用者提供的母圖，不能以 CSS 或測試綠燈自行宣告美術完成。下一階段應優先製作正式高精度原畫材質（背景遠景／中景／前景、寶箱與道具、各頁面），配合既有分層保持可玩與可互動。
