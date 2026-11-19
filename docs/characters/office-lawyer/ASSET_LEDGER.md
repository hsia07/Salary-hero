# 白律素材帳（只追加）
欄位：日期｜asset_id｜檔案路徑｜尺寸｜來源｜判定標籤｜備註

2026-11-18｜bailu_ref_fullbody_front｜（未入庫）｜—｜先前聊天生成｜QA_PENDING｜需使用者提供原檔
2026-11-18｜bailu_head｜（未入庫）｜—｜先前聊天生成｜QA_PENDING｜未接合驗收，需原檔
2026-11-18｜bailu_torso（舊）｜（未入庫）｜—｜先前聊天生成｜REJECTED_SHOWCASE 類｜混入腿與披風，作廢
2026-11-18｜bailu_ref_fullbody_front（試生 1）｜art/characters/office-lawyer/incoming/bailu_ref_fullbody_front_try1_thumb133.png（僅 133×200 縮圖；原圖 1664×2496 在 Canva 媒體 MAHbR_33qYw，未能直接下載）｜1664×2496｜Canva generate-image｜REJECTED_ART｜單人、灰底、無展示板、設計元素齊全；但目測約 3.5–4 頭身，不符鎖定的 2.5 頭身。已重讀 ART-RULES-1.0
2026-11-19｜bailu_reference｜art/characters/office-lawyer/references/bailu_reference.png｜1312×1199｜使用者提供（ChatGPT 先前生成）｜REFERENCE（造型基準）｜真透明；深/淺底邊緣乾淨、無色溢；約 2.3–2.5 頭身。小瑕疵：呆毛右上一小塊白色雜點。全角色畫風以此為準
2026-11-19｜bailu_ref_fullbody_front｜art/characters/office-lawyer/incoming/bailu_fullbody_candidate.png｜1312×1199｜使用者提供｜CANDIDATE_FLAT｜與 reference 同造型另一版（聖帶較長、筆舉較高）；單張扁平圖，不能當分層
2026-11-19｜bailu_head｜art/characters/office-lawyer/incoming/bailu_head_candidate.png｜1312×1199｜使用者提供｜QA_PENDING（分層候選）｜單一部件：頭＋髮＋耳，無頸；邊緣乾淨。待補：頸部接合面、錨點；與身體比例待接合驗證
2026-11-19｜bailu_clothing｜art/characters/office-lawyer/incoming/bailu_clothing_candidate.png｜1230×1278｜使用者提供｜REJECTED_RIG（作造型參考保留）｜無頭服裝全身：軀幹＋披風＋聖帶＋腿＋靴混在一張且無手臂，不符一圖一部件；保留作服裝正面結構參考
2026-11-19｜bailu_body｜art/characters/office-lawyer/layers/bailu_body.png（rig/body.webp 去除膝下）｜1230×1278｜使用者服裝候選｜CANDIDATE（分層）｜無頭無臂身體；膝下另拆為腿層
2026-11-19｜bailu_head｜layers/bailu_head.png（rig/head.webp）｜1312×1183｜使用者頭部候選｜CANDIDATE（分層）｜樞紐在頸部；缺頸部接合面（由衣領遮蔽）
2026-11-19｜bailu_arm_r_pen｜layers/bailu_arm_r_pen.png（rig/arm_r_pen.webp）｜346×338｜由全身候選切出持筆前臂＋手＋筆｜CANDIDATE（切圖）｜根部藏於披風下；上臂未補繪（被身體遮擋）
2026-11-19｜bailu_arm_l_case｜layers/bailu_arm_l_case.png（rig/case_sleeve＋case_front）｜448×473｜由參考圖切出提包手＋公文包｜CANDIDATE（切圖）｜把手圈內披風已挖空；公文包後方遮擋面未補繪
2026-11-19｜bailu_leg_l／leg_r｜rig/leg_l.webp、leg_r.webp｜—｜由服裝候選膝下切出｜CANDIDATE（切圖）｜樞紐在膝蓋，上緣藏於披風下擺
2026-11-19｜rig 驗收｜QA/2026-11-19_*｜—｜—｜QA_PENDING（待使用者核准）｜375px 無頭 Edge 逐格：普攻筆尖接觸敵人、受擊紅閃、格擋、驅散；未在實機手機測
2026-11-19｜rig 修正｜rig/rig.json｜—｜使用者回饋「頭接在奇怪的地方」｜CANDIDATE｜頭部右移 38、下移 6（rig 像素），下巴對準衣領；頸部樞紐同步；rig.json 改存 UTF-8
2026-11-19｜rig v2｜layers/rig/*.webp（原始全尺寸：layers/v2_src/）｜—｜全部由 references/bailu_reference.png 拆出；頸部、公文包後方以本機 inpaint 補畫（LoRA 0.7＋IPA 0.6，seed 33），遮罩內輪廓取參考圖｜CANDIDATE｜組回與參考圖平均像素差 0.18；使用者回饋「頭完全接歪」已解決（同一張圖角度一致）；v1 保留於 layers/rig_v1
2026-11-19｜bailu attack 7 / hurt 5（逐格）｜art/characters/office-lawyer/animations/attack-7pose-512.png、hurt-5pose-384.png｜3584×512、1920×384｜本機 img2img：以薪奴 7＋5 姿勢為構圖、白律 LoRA 0.9＋參考圖畫風 0.6、denoise 0.72；每格挑 3 版之一；build_atlas.py 統一身高與腳底錨點｜CANDIDATE｜沿用遊戲 attack-timing [115,135,95,60,145,100,155]、hurt-timing、hurt-effects 與 app.mjs 突進曲線；薪奴檔案未修改。待修：普攻沿用薪奴「公文包揮擊」動作，白律專屬「審判筆突刺」7 格尚未製作
2026-11-19｜bailu attack 7（審判筆突刺，白律專屬）｜animations/attack-7pose-512.png（取代借用薪奴動作的版本）｜3584×512｜分層白律擺 7 個突刺構圖 → 本機 img2img 重繪（denoise 0.55、LoRA 0.85、參考圖畫風 0.6）｜CANDIDATE｜白律專屬時序 v19/bailu-timing.mjs [130,150,125,45,165,110,150]、突進 52px；受擊 5 格沿用上一版
2026-11-19｜bailu attack 7（ChatGPT v1，審判筆突刺）｜animations/attack-7pose-512.png；原檔 animations/chatgpt_v1/｜7×512 RGBA，腳底距底 18px｜使用者以 ChatGPT＋防跑提示詞生成並由 ChatGPT 切格打包 zip｜CANDIDATE｜畫風一致、全身動作明確；缺陷：第 3、5 格缺公文包（已備修正提示詞）
2026-11-19｜bailu attack 7（ChatGPT v2，更可愛＋薪奴頭身比）｜animations/attack-7pose-512.png；原檔 animations/chatgpt_v2/｜7×512｜使用者以 ChatGPT v2 提示詞生成並打包｜CANDIDATE｜審查：7 格都有公文包、畫風一致、頭身比接近薪奴（頭寬/身高 0.57 vs 薪奴 0.56）；縮到薪奴身高 410px、同腳底線。小缺陷：第 6 格白色聖帶消失；部分格頭髮偏淡紫
2026-11-19｜bailu attack 7（ChatGPT v2）｜animations/attack-7pose-512.png｜—｜—｜APPROVED_BY_USER（突刺動作）｜使用者：「定案」「沒人會注意到那一幀」（第 6 格聖帶缺漏接受）
2026-11-19｜bailu hurt 5（ChatGPT v1，以公文包護身）｜animations/hurt-5pose-384.png；原檔 animations/chatgpt_hurt_v1/｜5×384｜使用者以 ChatGPT＋受擊提示詞生成並打包（bailu_hurt_retry.zip）｜CANDIDATE｜審查：5 格畫風與突刺一致、白律專屬擋擊動作明確；縮放 0.932 與攻擊同身高、同腳底線；沿用遊戲 hurt-timing／hurt-effects（紅閃、停頓、震動）
2026-11-19｜bailu hurt 5（ChatGPT v1）｜animations/hurt-5pose-384.png｜—｜—｜APPROVED_BY_USER（受擊動作）｜使用者：「定案」
