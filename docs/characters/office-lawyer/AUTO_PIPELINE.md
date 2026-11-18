# 白律自動施工流程（使用者 2026-11-19 授權）
授權原話：「好 自動流程跟畫到遊戲做出來」。每小時排程檢查會讀本檔決定下一步；**完成一階段就更新「目前狀態」**。

## 目前狀態
STAGE=2_EXPLORE（night1 批次 216 張執行中，log: `D:/AI/runs/night1.log`；ComfyUI 伺服器 log: `D:/AI/comfyui.log`）
- ComfyUI 若掛掉：`cd /d/AI/ComfyUI_windows_portable && ./python_embeded/python.exe -s ComfyUI/main.py --windows-standalone-build --listen 127.0.0.1 --port 8188 --disable-auto-launch`（背景執行）
- 批次若中斷：`python tools/art/comfy_batch.py D:/AI/plan-night1.json`（已完成的會自動跳過）
（0_DOWNLOAD → 1_INSTALL → 2_EXPLORE → 3_LOCK → 4_LORA → 5_ASSETS → 6_INTEGRATE → 7_REVIEW）

## 使用者早上驗收方式（2026-11-19 01:25 指示）
原話：「明天 我需要驗證的是 你覺得類似的風格 且已經開始製作的一些遊戲畫面 我覺得不對 就重做 所以你也要繼續有其他備用素材」
- **主方向**：探索結果中最接近現有美術的 1 組 → 推進到鎖定、LoRA、素材、遊戲畫面（分支 auto/bailu-v1）。
- **備用方向**：第 2、3 名各保留一套「同設定 12+ 張全身圖＋去背＋並排現有美術的戰鬥畫面截圖」，使用者否決主方向時可直接切換，不必從頭探索。
- 早上交付：①畫風挑選頁（主＋備用並列）②主方向已做的遊戲畫面截圖 ③目前進度與未完成項目。

## 路徑
- 工具：`D:\AI\ComfyUI_windows_portable\`（ComfyUI 在 http://127.0.0.1:8188）；下載暫存 `D:\AI\downloads\`
- 生圖紀錄：`D:\AI\runs\<run>\results.jsonl`、`raw/`、`cut/`
- 腳本：`tools/art/comfy_batch.py`（批次＋去背＋初檢）、`qa.py`、`make_plan_night1.py`

## 各階段完成條件
| 階段 | 做什麼 | 完成條件 |
|---|---|---|
| 0_DOWNLOAD | ComfyUI、Animagine 4.0、BiRefNet、IP-Adapter＋編碼器 | 檔案大小等於官方大小 |
| 1_INSTALL | 解壓、放模型、裝 IPAdapter_plus、試生 1 張 | 1 張 raw＋cut 成功 |
| 2_EXPLORE | 216 張畫風掃描（make_plan_night1）＋依結果第二輪 | 找到 ≥1 組設定：頭身 2.5（head_ratio 0.36–0.44）、單人、去背乾淨，且**與現有正式美術（v19 runtime 怪物、v20 背景）並排不違和** |
| 3_LOCK | 用最佳設定生 60+ 張同設定白律，挑 15–20 張臉最一致者 | 挑選清單寫入 ASSET_LEDGER |
| 4_LORA | sd-scripts 訓練白律 LoRA | LoRA 生 10 張，臉一致率目測 ≥8/10 |
| 5_ASSETS | 動作圖／分層部件（依 BAILU_DESIGN_LOCK §4、§5） | 全部 PASS_AUTO＋目視通過，入 `art/characters/office-lawyer/candidates/` |
| 6_INTEGRATE | 分支 `auto/bailu-v1`：roster 加白律、招募/編制/七人戰鬥、骨架動畫套圖 | `node tools/check.mjs` 全綠＋375px 截圖 |
| 7_REVIEW | 停下等使用者看 | 使用者同意才合併 main |

## 硬規則（自動流程也不得違反）
- 每次生圖前重讀 `docs/FORMAL_ART_RULES.md`；素材只入 candidates，不入 runtime，直到使用者核准。
- 遊戲改動只在 `auto/bailu-v1` 分支，不推 main 的遊戲檔；不清存檔。
- 不下載清單外的檔案（已同意清單見 CHANGELOG 2026-11-19 授權列）。
- 美感判斷不確定時保守：標 FLAG 留給使用者，不自稱正式。
