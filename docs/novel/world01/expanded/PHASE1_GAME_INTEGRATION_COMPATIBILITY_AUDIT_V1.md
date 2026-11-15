# 第一世界｜第一階段遊戲接入相容性稽核 V1

狀態：**已直接讀取現有程式與文件；只建立遷移約束，尚未修改執行中遊戲**。

## 本次直接檢查的來源

- `v19/tieshi-story-progress.mjs`：進度鍵、資料結構、事件順序。
- `v19/tieshi-battle-bootstrap.mjs`：瀏覽器事件接收與寫入。
- `v19/tieshi-spirit-bridge.mjs`：後續覺醒門檻的依賴。
- `v19/tieshi-character-content.mjs`：鐵時角色資料與覺醒卡。
- `tests/tieshi-story-progress.test.mjs`：現有單元測試。
- `docs/TIESHI_STORY_GATE_V6_9.md`、`docs/ROSTER_60_STORY_IMPORTANCE_RARITY_V2.md`、`docs/novel/world01/PHASE1_LOCKED_CONTINUITY_AND_ADAPTATION_V1.md`。

## 已確認的實際相容性風險

| 類別 | 現行實作 | 正式劇情／新規格 | 風險與裁決 |
|---|---|---|---|
| 鐵時稀有度 | `v19/tieshi-character-content.mjs` 仍將鐵時定為 **SR**，且兩張覺醒卡均為 SR | 60 角色稀有度 V2 定為 **SSR** | **P0：實作與設定衝突**；第二階段必須統一角色基礎資料、卡片、抽取與戰力，而不是只改顯示字串 |
| 故事存檔 | `salary-hero:tieshi-story:v1`；欄位 `mainMilestone`、`chapters`、`finalBossCleared` | 新 B2 主線採來源章節路由，不是原三章傳記 ID | **不得直接覆蓋舊鍵或將 CH 章號塞入 `chapters`**；新路由須用獨立版本與遷移器 |
| 覺醒條件 | `main-midgame-tieshi` → `last-minute` → `not-clocked-out` → `nine-oclock` → `midnight-lockdown` | 新小說 CH01～35 是文學來源，並非已實作的遊戲事件 | **不能把小說章號當已可玩的關卡**；須先設計場景、觸發與遊玩驗收 |
| 事件橋接 | `salary-hero:story-event` 的 `CustomEvent.detail` 含 `type`、`id` | 主線與人物篇會共存 | 新章節事件必須命名空間化，避免意外觸發鐵時覺醒；不得改寫舊 ID |
| 存檔防護 | `normalizeTieshiStory` 只保留白名單三章，錯誤 JSON 回退安全 | 玩家可能已有舊進度 | 必須做舊存檔回歸、重複事件冪等測試；**禁止清空玩家存檔** |
| 遊戲劇情狀態 | V6.9 規格明記中期主線、三章傳記與首領關卡**尚未可玩** | 小說已擴充但未等於遊戲可玩 | 不得宣稱第一世界已實裝 |

## 正式接入規範（第二／四階段執行）

1. **文學來源 ID 與遊戲進度 ID 分離**：使用穩定 `world01/source/chXX` 類來源索引；遊戲章節另用不依賴展示順序的穩定鍵。不要以「第17章」這類會重編的顯示名稱作存檔鍵。
2. **人物篇不阻斷 B2 主線**：不要求抽到 UR 白律或 SSR 鐵時才能理解 B2 事件；抽到角色可開個人補充劇情。
3. **保留舊鐵時進度**：新路由啟用前先寫可逆／冪等遷移與測試，維持舊 `salary-hero:tieshi-story:v1` 讀取。
4. **稀有度與強度一致**：白律 UR 應有較高主線重要性與更強的角色上限；鐵時 SSR，千式 SR 等以 V2 正式表為準。必須驗證抽卡、技能、升階、隊伍數值、圖鑑等使用的真實來源。
5. **遊戲化不是靜態文字表單**：各關要有正式分層美術、場景互動、動畫與戰鬥／調查玩法；本稽核不宣稱美術完成。

## 第一階段驗收結論

**已找到一個具體 P0 衝突**：鐵時在現行遊戲角色模組中仍是 SR，與正式 SSR 稀有度不一致。**已找到存檔遷移風險**：舊覺醒進度使用固定 ID，不能直接拿新小說章號取代。

尚未完成全專案硬編碼掃描，也尚未執行測試或瀏覽器實機驗證；本文件不得被解讀為遊戲相容性全面通過。
