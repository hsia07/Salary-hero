# V6.8 戰鬥載入順序修復

問題：V6.7 透過一般 script 先執行戰鬥 runtime，ES module 稍後才初始化 `window.__tieshiRules`，存在首輪戰鬥攔截失效的競態。

修復：`boss-v5-play.html` 改載入 `v19/tieshi-battle-bootstrap.mjs`，先以 ES module import 初始化純戰鬥規則，才動態載入舊版 classic runtime，最後載入時鐘視覺模組。戰鬥 runtime 計時器啟動前已具備攔截規則。

若主程式或視覺模組載入失敗，頁面會顯示錯誤提示，避免靜默失效。

限制：這是載入競態修正；尚未完成真實瀏覽器整合驗收、正式中期傳記存檔或正式分層美術。
