# 鐵時 V3｜實際戰鬥橋接
- `boss-v5-dungeon-runtime.js` 新增 `applyTieshiSpiritEffect`，可將小燈治療、阿誠護盾實際套入七人測試隊伍的 HP/護盾系統。
- `v19/tieshi-spirit-bridge.mjs` 每 250ms 依現有遊戲時鐘輪詢；僅在完成中期覺醒及最終亡者和解事件後生效。
- 以 `salary-hero:story-event` 的 `story-reconciled / tieshi-soul-reconciliation` 解鎖最終職業；`choose-spirit` 更換主導亡靈。
- 阿遠的減傷目前**尚未實際接入多敵人傷害結算**，不應顯示成已生效。
- 亡靈動畫僅派送 `tieshi:spirit-visual` 事件，尚無正式分層素材。
- 測試場上七名角色為既有戰鬥原型；尚未改成最終六人隊伍。
- 尚未進行手機實機驗證。
