# 白律自動施工流程（使用者 2026-11-19 授權）
授權原話：「好 自動流程跟畫到遊戲做出來」。每小時排程檢查會讀本檔決定下一步；**完成一階段就更新「目前狀態」**。

## 目前狀態
STAGE=7_REVIEW（白律，2026-11-19 03:10）：等使用者看。
  - 分層：7 層（頭、身體、持筆手、提包手＋袖、雙腿），來自使用者頭部/服裝候選＋由參考圖/全身候選切出；全部 CANDIDATE
  - 遊戲：分支 auto/bailu-v1（commit 534db5e）— 招募、編隊、反擊條款、無效條款、場上骨架角色（走位/普攻接觸/受擊紅閃/格擋/驅散/倒地）
  - 預覽：嘗試在 main 加獨立預覽資料夾被安全檢查擋下（視為未經核准上線），已撤回；使用者看錄影或本機 http://localhost:8767/v19/play.html
  - LoRA v1：新姿勢服裝一致，但約 3 頭身偏高、偶有雙公文包/多餘特效 → 可輔助、未達正式
  - 下一位：steel-saint 設計探索候選（D:/AI/runs/saint-concept1），狀態 PROPOSED，待使用者挑設計
舊 4_LORA 紀錄：2_EXPLORE 結論（2026-11-19 03:00）：底模 Animagine 4.0 無法自行畫出參考圖畫風——
  - 純文字/IP-Adapter：臉偏萌、髮塌、紋章糊（`D:/AI/runs/ipa-dpm`）；img2img 只在 denoise≤0.35 保住畫風，0.5 即劣化（`D:/AI/runs/i2i-dpm`）
  - 取樣器 euler_ancestral 會造成雜訊顆粒 → 一律改 dpmpp_2m + karras
  - 現行：用使用者 4 張圖＋裁切＋4 張低 denoise 變體訓練 LoRA `D:/AI/lora/bailu/out/bailu_sh_v1*.safetensors`（log: `D:/AI/lora/bailu/train.log`）
  - **LoRA 通過條件（先定）**：不加參考圖、換 3 種新姿勢各生 4 張，≥6/12 張在臉（成熟、灰眼、淚痣）、蓬髮、披風＋聖帶、公文包紋章上與參考圖同級；否則改走「缺件清單＋ChatGPT 提示詞」備案
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
- 腳本：`tools/art/comfy_batch.py`（批次＋去背＋初檢）、`qa.py`、`make_plan_night1.py`（舊）、`make_plan_bailu_ref.py`（依參考圖）、`gallery.py`、`new_character.py`

## 各階段完成條件
| 階段 | 做什麼 | 完成條件 |
|---|---|---|
| 0_DOWNLOAD | ComfyUI、Animagine 4.0、BiRefNet、IP-Adapter＋編碼器 | 檔案大小等於官方大小 |
| 1_INSTALL | 解壓、放模型、裝 IPAdapter_plus、試生 1 張 | 1 張 raw＋cut 成功 |
| 2_EXPLORE | 以參考圖為基準（IP-Adapter／img2img／LoRA 實驗）找能穩定重現此畫風的設定 | **與 `references/bailu_reference.png` 並排時：臉型成熟、灰眼、線稿精細度與配色同級**（人工目視判定；PASS_AUTO 只代表去背/單人/不貼邊，不代表畫風達標） |
| 3_LOCK | 用最佳設定生 60+ 張同設定白律，挑 15–20 張臉最一致者 | 挑選清單寫入 ASSET_LEDGER |
| 4_LORA | sd-scripts 訓練白律 LoRA | LoRA 生 10 張，臉一致率目測 ≥8/10 |
| 5_ASSETS | 動作圖／分層部件（依 DESIGN_LOCK §4、§5） | 全部 PASS_AUTO＋目視通過，入 `art/characters/office-lawyer/incoming/`（驗收通過再分入 layers/、portrait/ 等） |
| 6_INTEGRATE | 分支 `auto/bailu-v1`：roster 加白律、招募/編制/七人戰鬥、骨架動畫套圖 | `node tools/check.mjs` 全綠＋375px 截圖 |
| 7_REVIEW | 停下等使用者看 | 使用者同意才合併 main |

## 硬規則（自動流程也不得違反）
- **不得只憑 PASS_AUTO 進入 3_LOCK 以後**；必須人工對照參考圖達標。本機達不到就照實回報，並改走「缺件清單＋ChatGPT 提示詞」備案，不量產次一級畫風。
- 頭身自動指標已停用（參考圖本身偵測失效），比例以人工對照 references/ 判斷。
- 每次生圖前重讀 `docs/FORMAL_ART_RULES.md`；素材只入 `art/characters/<id>/incoming/`，不入 runtime，直到使用者核准。
- 遊戲改動只在 `auto/bailu-v1` 分支，不推 main 的遊戲檔；不清存檔。
- 不下載清單外的檔案（已同意清單見 CHANGELOG 2026-11-19 授權列）。
- 美感判斷不確定時保守：標 FLAG 留給使用者，不自稱正式。
