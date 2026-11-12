# 《薪水勇者》地獄星期一・文書牛魔 Boss 實戰 V2
狀態：工程可玩驗收版（2026-11-12）。非最終美術。GitHub 入口：`/boss-v2-play.html`。

## 固定規則
- 全程手機直式，首頁、副本、Boss 過場均不切換橫式；禁止垂直捲動。
- 戰鬥開始後陣容鎖定；自動戰鬥，僅開放倍速、暫停、重新挑戰。
- 固定使用使用者驗收通過的紅月辦公室背景 `art/s1/hell-monday/approved-background.webp`；任何角色與 Boss 都不能畫進背景。
- Boss 和七名隊友使用各自獨立影像節點。隊友目前是暫用素材，**不是第一季正式七人美術**。

## 已實作（`boss-v2-engine.js`）
- HP 3,200,000、藍色怒氣條 0–100%、怒氣積累（承受攻擊＋技能施放）。
- 普攻：巨爪拍擊（指定前排）、橫掃公文爪（前排多目標）、牛角突頂（單體）。
- 小技能：文件轟炸（指定多目標）、加班結界（疲勞狀態）。
- 大招「地獄加班裁決」：滿怒氣後預警地板 → Boss 蓄力/攻擊六格 → 特效逐一飛至七人位置 → 到達座標才扣血/紅閃/後仰/傷害數字 → 殘留 DOT。
- 玩家攻擊也以獨立斬擊素材飛到 Boss 接觸點才扣 Boss HP。
- HP <= 60% 進入狂暴，變更光效與怒氣累積率。
- 倒地、補血、敗北/通關、暫停與倍速。
- `window.__bossV2.status` 用於開發測試驗證命中計數、怒氣與大招次數。

## 素材位置
- `art/s1/hell-monday/boss/idle_01~04.webp`
- `art/s1/hell-monday/boss/attack_01~06.webp`
- `art/s1/hell-monday/boss/hurt_01~04.webp`
- `art/s1/hell-monday/boss/part_*.webp`（13 件獨立部件／特效）
- `art/s1/hell-monday/allies/*.webp`（7 張暫用角色）
- `art/s1/hell-monday/approved-background.webp`

## QA
- 桌面 Chromium 模擬 390×844 直式：七名角色與 Boss 圖片載入成功。
- 自動戰鬥能推進，測試記錄顯示真實命中 32 次、Boss 大招 2 次、狂暴 Phase 2。
- 暫停後 HP 不變；恢復、3 倍速可正常繼續；無 JavaScript pageerror；主畫面無垂直捲動。
- GitHub Pages workflow 成功；**尚未取得使用者 iPhone 的 V2 實機驗收**。

## 已知限制／後續
- Boss 原始攻擊影格是 V1 去背素材，仍有局部邊緣與造型漂移問題，需美術逐格修圖。
- 特效以已存在的透明 PNG/WebP 配合程式軌跡、警戒區與震屏，非完整專業逐幀粒子包。
- 同事暫用其他現有裁切素材，還沒完成六名同事正式高清動畫；這不代表遊戲美術驗收完成。
- 戰鬥是獨立 V2 驗收場，不寫入遊戲正式存檔；後續將相同戰鬥機制接入正式副本引擎。
