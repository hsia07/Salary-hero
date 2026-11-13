# 鐵時死靈護衛 V2：戰鬥整合介面
`v19/tieshi-spirit-runtime.mjs` 提供引擎無關的可測試戰鬥狀態：`createSpiritBattle`, `spiritProtect`, `spiritTick`, `spiritVisual`, `spiritUltimate`。
三魂一盾：亡靈不佔隊伍欄位、不新增血條、不可成為敵人目標。只有主導亡靈按冷卻觸發短暫演出。低血量目標按生命比例選擇；阿遠選攻擊最高的存活敵人。
下一步將 effect 轉換為現有 battle runtime 的 heal/shield/debuff，並將 visual 映射正式分層圖層。這次**未**接入 boss-v5 戰鬥迴圈，未完成正式美術；不可宣稱已能在主遊戲使用。
