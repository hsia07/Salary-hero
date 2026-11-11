# 《薪水勇者》V20 P0.8｜手繪金框材質 + 戰場地面即時反射

**工程狀態**：美術工程已接入可點擊遊戲；必須通過 iPhone Safari 與使用者參考圖比對，不能宣稱全站正式美術完成。

## 原創點陣材質

素材位於 art/v20/runtime/ui，來源為本專案自行生成的奇幻 RPG 參考原畫。使用透明遮罩移除角色、內容與數值，只保留真正畫出的金屬邊框：

- royal-nav-frame.webp：127×150 透明 WebP；八個主選單及戰鬥按鈕使用 border-image 九宮格縮放。
- royal-pay-frame.webp：331×267 透明 WebP；裝飾動態薪資牌。薪資數值依然由正式程式與 DOM 顯示。
- royal-loot-frame.webp：232×384 透明 WebP；裝飾右側掉寶欄，不把掉寶數值烘焙成靜態圖片。

圖片合計約 27.5 KiB。樣式位於 v19/v20-royal-material.css，保留原本可互動的 button 節點、獎勵狀態與鍵盤 focus 樣式。

## 戰場地面即時反射

新增 v19/v20-scene-light.mjs，正式戰鬥 Canvas 在背景與角色之間加上獨立動態地面反射：

- 月光、燈光在地面的柔和反光；低成本獨立繪製，不需要每幀解碼高密度 SVG。
- 零星可緩慢移動的高光，減少平面牆紙質感。所有裝飾限制在畫面下方的地面區。
- 不更動傷害、HP、薪資、掉寶、技能 CD、存檔或原本 Q 版逐格動畫；訓練模式不受影響，尊重 reduced-motion。

## 回歸及未完成

Node：node --test v19/v20-scene-light.test.mjs v19/v20-home.test.mjs v19/v20-art-live.test.mjs

GitHub Actions：Gameplay and Cosmetic Regression、Layered Art and Mobile Rendering、Real Adventure Encounters Mobile、Illustrated Monster Real Combat。

下一階段仍需正式高品質場景原畫、全部內頁材質與物品細節。**不能將自動化測試通過等同美術驗收通過。**

硬規則：主角仍為已核准的厭世偏瘦 Q 版日本社畜大叔，不要換成少年勇者；手機 100dvh 一屏不捲動；不更動存檔。
