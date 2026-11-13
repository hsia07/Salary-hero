# 鐵時 V6.9｜中期故事進度存檔與解鎖閘門
- 新增 `v19/tieshi-story-progress.mjs`：localStorage 儲存角色傳記進度，損壞存檔安全回退。
- **正式解鎖條件必須全部滿足**：主線中期節點 `main-midgame-tieshi` → 依序完成傳記三章 `last-minute` / `not-clocked-out` / `nine-oclock` → 擊敗故事首領 `midnight-lockdown`。
- 戰鬥啟動時從進度存檔決定是否開放 09:00，非開發模式不再只能永遠鎖定。
- 未達條件只使用 08:59 必殺；升級、升星、突破、專武均無法替代故事條件。
- 提供 `salary-hero:story-event` 事件橋接，主線／傳記完成時發送 `CustomEvent`，`detail` 格式 `{type:'main-milestone'|'chapter-cleared'|'boss-cleared',id:'...'}`。
- **尚未完成**：實際可玩的主線中期劇情、三章傳記與午夜封鎖者首領關卡。事件橋接與持久化已備妥，但尚無正式遊戲流程發出事件。
- 開發模式可暫時模擬解鎖，不會寫入正式存檔；尚未做瀏覽器整合測試。
