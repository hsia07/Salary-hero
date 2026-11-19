/** 白律 UR 大招「終審判決」演出（單體審判，使用者 2026-11-19 裁決 A）。
 * 所有特效都是繪製的正式素材（art/characters/office-lawyer/vfx/*.webp，黑底），以「濾色 screen」疊加；
 * 程式只做：位置、縮放、旋轉、透明度與時間順序。不畫任何幾何線條（使用者：「太幾何拼接」）。
 */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = { out: u => 1 - (1 - u) ** 3, in: u => u ** 3, io: u => u < .5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2, back: u => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2 };
export const VFX_NAMES = ['scales', 'sigil', 'contract', 'chain', 'pillar', 'seal', 'burst', 'slash', 'debris'];

export function ultPhases(cutinMs, frameMs) {
  const starts = []; let acc = cutinMs;
  for (const d of frameMs) { starts.push(acc); acc += d; }
  return { cutin: [0, cutinMs], frame: starts, end: acc, impact: starts[5] };
}
export async function loadUltVfx(base) {
  const load = n => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = base + n; });
  const ims = await Promise.all(VFX_NAMES.map((n, i) => load(`vfx_0${i + 1}_${n}.webp`)));
  return Object.fromEntries(VFX_NAMES.map((n, i) => [n, ims[i]]));
}
/** 以濾色疊加一張黑底特效圖（中心 x,y、寬 w，可旋轉、壓扁） */
function put(ctx, img, x, y, w, { a = 1, rot = 0, sy = 1, sx = 1 } = {}) {
  if (a <= 0 || w <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = clamp(a);
  // 先壓扁再旋轉：地面法陣是在「平躺的平面」上旋轉，不會立起來
  ctx.translate(x, y); ctx.scale(sx, sy); ctx.rotate(rot);
  ctx.drawImage(img, -w / 2, -w / 2, w, w); ctx.restore();
}

/** 背景層（角色、敵人之前）：領域變暗、巨大天秤、地面法陣 */
export function drawUltBack(ctx, t, P, { floor, enemyX }, V) {
  if (!V || t < 0 || t > P.end + 500) return;
  const ex = enemyX + 130;
  const dim = t < P.frame[0] ? 0 : t < P.end ? ease.out(seg(t, P.frame[0], P.frame[0] + 260)) : 1 - seg(t, P.end, P.end + 500);
  ctx.save(); ctx.globalAlpha = .62 * dim; ctx.fillStyle = '#0d0618'; ctx.fillRect(-200, -600, 1120, 1600); ctx.restore();
  // 天秤：開庭時由上方浮現、輕晃；蓄勢時往目標側傾；定讞時亮起
  const sa = dim * ease.out(seg(t, P.frame[1], P.frame[1] + 320));
  const tilt = t < P.frame[4] ? Math.sin(t / 420) * .03 : t < P.impact ? .12 * ease.io(seg(t, P.frame[4], P.impact)) : .16;
  const flare = t >= P.impact ? 1 - seg(t, P.impact, P.impact + 600) : 0;
  put(ctx, V.scales, 360, 175 - 30 * (1 - sa), 520, { a: (.55 + .45 * flare) * sa, rot: tilt });
  // 法陣：目標腳下展開並緩慢旋轉（壓扁成地面透視）
  const ra = dim * ease.out(seg(t, P.frame[1], P.frame[2]));
  put(ctx, V.sigil, ex, floor - 14, 330 * (0.6 + 0.4 * ra), { a: ra * (0.85 + 0.15 * flare), rot: t / 1600, sy: .34 });
}

/** 前景層（角色、敵人之後）：契約、鎖鏈、聚光、光柱、審判印、斬光、爆發、紙屑、白閃 */
export function drawUltFront(ctx, t, P, { floor, enemyX, penTip }, V) {
  if (!V || t < 0 || t > P.end + 600) return;
  const ex = enemyX + 130, ey = floor - 150, cx = ex + 10, cy = ey - 200;
  // 契約：抽契約時展開於目標上方；書寫時微微發亮；定讞時燃盡
  if (t >= P.frame[2]) {
    const open = ease.back(seg(t, P.frame[2], P.frame[2] + 280)), gone = seg(t, P.impact, P.impact + 220);
    const glow = t >= P.frame[3] && t < P.impact ? .15 * Math.sin(t / 60) : 0;
    put(ctx, V.contract, cx, cy - 10 * Math.sin(t / 500), 230 * open * (1 + gone * .4), { a: (1 - gone) * (.95 + glow) });
  }
  // 光鎖鏈：從契約延伸到目標身上（3 條），蓄勢時繃緊
  if (t >= P.frame[3] && t < P.impact + 160) {
    const p = ease.out(seg(t, P.frame[3] + 60, P.frame[4])), fade = 1 - seg(t, P.impact, P.impact + 160);
    for (const ox of [-80, 0, 80]) {
      const ax = cx + ox, ay = cy + 60, bx = ex + ox * .25, by = ey + 10;
      const len = Math.hypot(bx - ax, by - ay) * p, ang = Math.atan2(by - ay, bx - ax);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = fade;
      ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.beginPath(); ctx.rect(0, -60, len, 120); ctx.clip();          // 鎖鏈逐段伸出
      ctx.drawImage(V.chain, -40, -110, Math.max(len, 1) + 120, 220); ctx.restore();
    }
  }
  // 蓄勢：爆發素材縮小後在筆尖聚光、跳動
  if (t >= P.frame[4] && t < P.impact) {
    const p = seg(t, P.frame[4], P.impact);
    put(ctx, V.burst, penTip.x, penTip.y, 50 + 70 * p + 8 * Math.sin(t / 30), { a: .5 + .5 * p, rot: t / 200 });
  }
  if (t >= P.impact) {
    const h = t - P.impact;
    // 光柱從天而降（由上往下拉長）
    const drop = ease.out(seg(h, 0, 90)), pf = 1 - seg(h, 260, 700);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = pf;
    const pw = 300, ph = (floor + 30) * drop; ctx.drawImage(V.pillar, ex - pw / 2, floor + 30 - ph, pw, ph); ctx.restore();
    // 斬光：斜劃一刀
    put(ctx, V.slash, ex, ey, 420 * (0.85 + 0.25 * ease.out(seg(h, 0, 120))), { a: 1 - seg(h, 120, 360) });
    // 爆發
    put(ctx, V.burst, ex, ey + 10, 260 + 220 * ease.out(seg(h, 0, 260)), { a: 1 - seg(h, 120, 520), rot: h / 900 });
    // 審判印：蓋下（大→定位）後緩慢旋轉淡出
    const sp = seg(h, 0, 160);
    put(ctx, V.seal, ex, ey, 300 * (1.6 - .6 * ease.out(sp)), { a: (sp < 1 ? sp : 1) * (1 - seg(h, 500, 1000)), rot: -h / 1400 });
    // 紙屑：向外炸開再飄落
    for (const [k, ox, oy, rr] of [[0, -1, -1, .3], [1, 1, -1, -.4], [2, -1, .4, .8], [3, 1, .5, -.2]]) {
      const d = ease.out(seg(h, 0, 600)) * 150;
      put(ctx, V.debris, ex + ox * d, ey + oy * d * .6 + seg(h, 200, 1300) * 90, 170, { a: 1 - seg(h, 500, 1300), rot: rr + h / 700 * ox });
    }
  }
  // 白閃（短）
  if (t >= P.impact && t < P.impact + 100) { ctx.save(); ctx.globalAlpha = .5 * (1 - seg(t, P.impact, P.impact + 100)); ctx.fillStyle = '#fffbea'; ctx.fillRect(-200, -600, 1120, 1600); ctx.restore(); }
}

/** 鏡頭：蓄勢時推近目標，命中瞬間大震動 */
export function ultCamera(t, P, { enemyX, floor }) {
  if (t < P.frame[4] || t > P.end) return null;
  const ex = enemyX + 100, ey = floor - 160;
  const zin = ease.io(seg(t, P.frame[4], P.impact)), zout = ease.io(seg(t, P.impact + 250, P.end));
  const h = t - P.impact, k = h >= 0 && h < 360 ? 1 - h / 360 : 0;
  return { zoom: 1 + .14 * zin * (1 - zout), cx: ex, cy: ey, shakeX: Math.sin(h * .42) * 20 * k, shakeY: Math.cos(h * .57) * 9 * k };
}

/** 特寫：畫面轉暗、斬光素材當底、半身特寫滑入、招式名（遊戲 UI 文字） */
export function drawCutin(ctx, t, P, img, V, name = '終審判決') {
  const [a, b] = P.cutin; if (t < a || t > b + 120) return;
  const p = seg(t, a, b), out = seg(t, b - 120, b + 120);
  ctx.save(); ctx.fillStyle = '#05030a'; ctx.globalAlpha = .84 * (1 - out); ctx.fillRect(-200, -600, 1120, 1600); ctx.restore();
  const bar = 80 * ease.out(seg(t, a, a + 160)) * (1 - out);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 720, bar); ctx.fillRect(0, 620 - bar, 720, bar);
  const x = p < .2 ? 720 * (1 - ease.out(p / .2)) : -720 * ease.in(out);
  ctx.save(); ctx.translate(x, 0);
  if (V) { put(ctx, V.slash, 380, 310, 900, { a: .9, rot: -.62, sy: .55 }); put(ctx, V.burst, 470, 250, 360, { a: .35 }); }
  ctx.drawImage(img, 20, 130, 700, 350);
  const na = ease.out(seg(t, a + 160, a + 400)), y = 545 - (1 - na) * 20;
  ctx.globalAlpha = na; ctx.font = '900 58px "Noto Serif TC","Microsoft JhengHei",serif'; ctx.textAlign = 'left';
  ctx.lineWidth = 8; ctx.strokeStyle = '#2a1608'; ctx.strokeText(name, 40, y);
  const tg = ctx.createLinearGradient(0, 500, 0, 550); tg.addColorStop(0, '#fff6d6'); tg.addColorStop(1, '#e0b04e'); ctx.fillStyle = tg; ctx.fillText(name, 40, y);
  ctx.font = '700 20px "Noto Serif TC","Microsoft JhengHei",serif'; ctx.fillStyle = '#f3dfa0'; ctx.fillText('勞權律師・白律　UR', 44, y + 31);
  ctx.restore();
}
