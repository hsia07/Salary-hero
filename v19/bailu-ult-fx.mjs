/** 白律 UR 大招「終審判決」演出（程式繪製的獨立特效層，不畫在角色圖上）。
 * 分鏡（時間由 bailu-timing.mjs 的 8 格決定）：
 *  0  特寫：上下黑邊＋金線帶＋半身特寫滑入，招式名
 *  1  開庭：畫面轉暗紫、法庭領域展開——背後巨大金色天秤浮現、地面審判法陣
 *  2  抽契約：發光契約在敵人頭上展開，金色條文逐行亮起（抽象線條，不是真文字）
 *  3  書寫：筆尖拖出金色光痕，契約射出光鎖鏈綁住敵人
 *  4  蓄勢：慢動作，光芒向筆尖聚集，天秤傾斜
 *  5  定讞：巨大光柱從天而降、審判印蓋下、衝擊波、碎紙、全螢幕白閃、鏡頭推近＋大震動、巨大傷害數字
 *  6–7 餘韻：金色紙片落下、法陣收束、領域退去
 */
const TAU = Math.PI * 2;
const ease = { out: u => 1 - (1 - u) ** 3, in: u => u * u * u, io: u => u < .5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));

export function ultPhases(cutinMs, frameMs) {
  const starts = []; let acc = cutinMs;
  for (const d of frameMs) { starts.push(acc); acc += d; }
  return { cutin: [0, cutinMs], frame: starts, end: acc, impact: starts[5] };
}

function glowLine(ctx, pts, w, color = '#fff3c4', glow = '#f3d27a', blur = 18) {
  ctx.save(); ctx.strokeStyle = color; ctx.shadowColor = glow; ctx.shadowBlur = blur; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}

/** 天秤剪影（金色線條），tilt>0 右側下沉 */
function scales(ctx, cx, cy, s, tilt, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.strokeStyle = '#f6dc8a'; ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 30; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(0, 150); ctx.moveTo(-70, 150); ctx.lineTo(70, 150); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -160, 14, 0, TAU); ctx.stroke();
  ctx.rotate(tilt);
  ctx.beginPath(); ctx.moveTo(-170, -110); ctx.lineTo(170, -110); ctx.stroke();
  for (const sx of [-170, 170]) {
    ctx.save(); ctx.translate(sx, -110); ctx.rotate(-tilt);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-45, 95); ctx.moveTo(0, 0); ctx.lineTo(45, 95); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 100, 55, 14, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** 地面法陣（透視壓扁的同心環＋刻度＋六芒） */
function sigil(ctx, cx, cy, r, rot, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.scale(1, .32); ctx.rotate(rot);
  ctx.strokeStyle = '#f6dc8a'; ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 20;
  ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, r * .78, 0, TAU); ctx.stroke();
  for (let i = 0; i < 36; i++) { const q = i / 36 * TAU, k = i % 3 ? .9 : .82; ctx.beginPath(); ctx.moveTo(Math.cos(q) * r * k, Math.sin(q) * r * k); ctx.lineTo(Math.cos(q) * r * .97, Math.sin(q) * r * .97); ctx.stroke(); }
  ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i < 7; i++) { const q = i / 6 * TAU * 2 - Math.PI / 2; const x = Math.cos(q) * r * .7, y = Math.sin(q) * r * .7; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.restore();
}

/** 浮空契約：羊皮紙＋金邊＋逐行亮起的抽象條文（線段，不是文字） */
function contract(ctx, cx, cy, open, lines, a) {
  const w = 230 * open, h = 150;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy);
  ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 26;
  ctx.fillStyle = 'rgba(255,246,220,.92)'; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowBlur = 0; ctx.strokeStyle = '#c9963a'; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
  if (open > .95) {
    ctx.strokeStyle = '#b07a2a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const p = clamp(lines * 6 - i); if (p <= 0) continue;
      const y = -h / 2 + 26 + i * 19, len = (w - 60) * (i === 5 ? .45 : .8 + .15 * Math.sin(i * 3)) * p;
      ctx.beginPath(); ctx.moveTo(-w / 2 + 30, y); ctx.lineTo(-w / 2 + 30 + len, y); ctx.stroke();
    }
    if (lines > .95) { ctx.fillStyle = '#b8322a'; ctx.beginPath(); ctx.arc(w / 2 - 38, h / 2 - 30, 15, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

/** 光鎖鏈：從 a 到 b 的一串發光環 */
function chain(ctx, ax, ay, bx, by, p, sway) {
  const n = 14, m = Math.floor(n * p);
  for (let i = 0; i < m; i++) {
    const u = i / n, x = ax + (bx - ax) * u + Math.sin(u * 6 + sway) * 10, y = ay + (by - ay) * u + Math.cos(u * 5 + sway) * 6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(by - ay, bx - ax) + (i % 2) * Math.PI / 2);
    ctx.strokeStyle = '#fff3c4'; ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 14; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 6, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
}

const papers = Array.from({ length: 26 }, (_, i) => ({ x: (i * 97) % 720, s: .6 + (i * 37 % 10) / 15, r: i * 1.7, v: 120 + (i * 53) % 90 }));

/** 背景層：在角色與敵人之前畫 */
export function drawUltBack(ctx, t, P, { heroX, floor, enemyX }) {
  if (t < 0 || t > P.end + 500) return;
  const ex = enemyX + 130, ey = floor - 150;
  const dim = t < P.frame[0] ? 0 : t < P.end ? ease.out(seg(t, P.frame[0], P.frame[0] + 260)) : 1 - seg(t, P.end, P.end + 500);
  // 領域：暗紫＋金色放射光
  ctx.save(); ctx.globalAlpha = .7 * dim; ctx.fillStyle = '#140a24'; ctx.fillRect(0, 0, 720, 620);
  const g = ctx.createRadialGradient(360, 170, 20, 360, 170, 420); g.addColorStop(0, 'rgba(255,226,150,.55)'); g.addColorStop(1, 'rgba(255,226,150,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 620);
  ctx.globalAlpha = .25 * dim; ctx.strokeStyle = '#f6dc8a'; ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const q = i / 18 * TAU + t / 2400; ctx.beginPath(); ctx.moveTo(360, 170); ctx.lineTo(360 + Math.cos(q) * 900, 170 + Math.sin(q) * 900); ctx.stroke(); }
  ctx.restore();
  // 巨大天秤：開庭時浮現，蓄勢時往敵人那側傾斜，定讞時重重落下
  const sa = dim * ease.out(seg(t, P.frame[1], P.frame[1] + 300));
  const tilt = t < P.frame[4] ? Math.sin(t / 380) * .05 : t < P.impact ? .18 * ease.io(seg(t, P.frame[4], P.impact)) : .32;
  if (sa > 0) scales(ctx, 360, 190, 1.05, tilt, .55 * sa);
  // 地面法陣：敵人腳下
  const ra = dim * ease.out(seg(t, P.frame[1], P.frame[2]));
  if (ra > 0) sigil(ctx, ex, floor - 18, 150 + 20 * Math.sin(t / 300), t / 900, .9 * ra);
}

/** 前景層：在角色與敵人之後畫。回傳鏡頭參數（推近、震動）給呼叫端套用到下一幀 */
export function drawUltFront(ctx, t, P, { heroX, floor, enemyX, penTip }) {
  if (t < 0 || t > P.end + 500) return;
  const ex = enemyX + 130, ey = floor - 150, cx = ex + 30, cy = ey - 190;
  // 契約：抽契約時出現在敵人上方，書寫時條文逐行亮起
  const co = ease.out(seg(t, P.frame[2], P.frame[2] + 220)), cl = seg(t, P.frame[3], P.frame[4] + 120);
  const ca = t < P.impact ? 1 : 1 - seg(t, P.impact, P.impact + 160);
  if (t >= P.frame[2]) contract(ctx, cx, cy, co, cl, ca);
  // 筆尖光痕（書寫）
  if (t >= P.frame[3] && t < P.frame[4] + 80) {
    const p = seg(t, P.frame[3], P.frame[4]), pts = [];
    for (let i = 0; i <= 30 * p; i++) { const u = i / 30; pts.push([penTip.x + u * 160 + Math.sin(u * 9) * 26, penTip.y - 40 + u * 50 + Math.cos(u * 7) * 20]); }
    if (pts.length > 1) glowLine(ctx, pts, 7);
  }
  // 光鎖鏈綁住敵人
  if (t >= P.frame[3] && t < P.impact + 120) {
    const p = ease.out(seg(t, P.frame[3] + 80, P.frame[4]));
    for (const [ox, oy] of [[-90, 40], [90, 40], [0, 60]]) chain(ctx, cx + ox, cy + oy, ex + ox * .3, ey + 20, p, t / 120 + ox);
  }
  // 蓄勢：光芒往筆尖聚集
  if (t >= P.frame[4] && t < P.impact) {
    const p = seg(t, P.frame[4], P.impact);
    for (let i = 0; i < 14; i++) {
      const q = i / 14 * TAU + p * 2, r = (1 - p) * 140 + 8;
      ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = '#fff3c4'; ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(penTip.x + Math.cos(q) * r, penTip.y + Math.sin(q) * r, 3 + p * 2, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = .5 + p * .5; const rg = ctx.createRadialGradient(penTip.x, penTip.y, 0, penTip.x, penTip.y, 30 + p * 40);
    rg.addColorStop(0, '#fffef6'); rg.addColorStop(1, 'rgba(246,220,138,0)'); ctx.fillStyle = rg; ctx.fillRect(penTip.x - 80, penTip.y - 80, 160, 160); ctx.restore();
  }
  // 定讞：光柱＋審判印＋衝擊波＋碎紙
  if (t >= P.impact) {
    const h = t - P.impact;
    const pa = 1 - seg(h, 180, 650);
    if (pa > 0) { // 光柱
      const w = 90 + 60 * ease.out(seg(h, 0, 120));
      const lg = ctx.createLinearGradient(ex - w, 0, ex + w, 0); lg.addColorStop(0, 'rgba(255,240,190,0)'); lg.addColorStop(.5, 'rgba(255,253,240,.95)'); lg.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = lg; ctx.fillRect(ex - w, -20, w * 2, floor + 20); ctx.restore();
    }
    const sp = seg(h, 0, 700); // 審判印（立面，蓋在敵人身上）
    ctx.save(); ctx.globalAlpha = 1 - sp * .9; ctx.translate(ex, ey); ctx.rotate(-sp * .5);
    ctx.strokeStyle = '#fff3c4'; ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 26;
    for (const [r, w] of [[70, 7], [52, 3]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, r + sp * 80, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 16; i++) { const q = i / 16 * TAU, r = 84 + sp * 90; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Math.cos(q) * r, Math.sin(q) * r); ctx.lineTo(Math.cos(q) * (r + 18), Math.sin(q) * (r + 18)); ctx.stroke(); }
    ctx.restore();
    const wv = seg(h, 0, 520); // 地面衝擊波
    ctx.save(); ctx.globalAlpha = 1 - wv; ctx.translate(ex, floor - 10); ctx.scale(1, .3);
    ctx.strokeStyle = '#fff3c4'; ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 20; ctx.lineWidth = 14 * (1 - wv) + 2;
    ctx.beginPath(); ctx.arc(0, 0, 60 + wv * 420, 0, TAU); ctx.stroke(); ctx.restore();
    const sl = 1 - seg(h, 40, 300); // 斜劃
    if (sl > 0) glowLine(ctx, [[ex - 230, ey - 190], [ex + 210, ey + 170]], 20 * sl + 3, '#fffdf2', '#f6dc8a', 28);
    // 碎紙與金屑
    for (let i = 0; i < 18; i++) {
      const q = i / 18 * TAU, d = ease.out(seg(h, 0, 700)) * (120 + (i * 37) % 90);
      ctx.save(); ctx.globalAlpha = 1 - seg(h, 300, 900); ctx.translate(ex + Math.cos(q) * d, ey + Math.sin(q) * d * .7 + seg(h, 0, 900) * 60); ctx.rotate(q + h / 120);
      ctx.fillStyle = i % 3 ? '#fff6dc' : '#f3d27a'; ctx.fillRect(-7, -9, 14, 18); ctx.restore();
    }
  }
  // 餘韻：金色紙片從天飄落
  if (t >= P.impact + 150) {
    const p = seg(t, P.impact + 150, P.end + 500);
    for (const f of papers) {
      const y = -30 + (t - P.impact) / 1000 * f.v, x = f.x + Math.sin(y / 40 + f.r) * 18;
      ctx.save(); ctx.globalAlpha = .85 * (1 - p); ctx.translate(x, y); ctx.rotate(f.r + y / 60); ctx.scale(f.s, f.s);
      ctx.fillStyle = '#fff1c8'; ctx.strokeStyle = '#d7a542'; ctx.lineWidth = 1.5; ctx.fillRect(-8, -11, 16, 22); ctx.strokeRect(-8, -11, 16, 22); ctx.restore();
    }
  }
  // 白閃
  if (t >= P.impact && t < P.impact + 110) { ctx.save(); ctx.globalAlpha = .6 * (1 - seg(t, P.impact, P.impact + 110)); ctx.fillStyle = '#fffbea'; ctx.fillRect(0, 0, 720, 620); ctx.restore(); }
}

/** 鏡頭：定讞前推近敵人，命中瞬間大震動 */
export function ultCamera(t, P, { enemyX, floor }) {
  if (t < P.frame[4] || t > P.end) return null;
  const ex = enemyX + 100, ey = floor - 160;
  const zin = ease.io(seg(t, P.frame[4], P.impact)), zout = ease.io(seg(t, P.impact + 250, P.end));
  const z = 1 + .16 * zin * (1 - zout);
  const h = t - P.impact, k = h >= 0 && h < 360 ? 1 - h / 360 : 0;
  return { zoom: z, cx: ex, cy: ey, shakeX: Math.sin(h * .42) * 22 * k, shakeY: Math.cos(h * .57) * 10 * k };
}

/** 特寫層：上下黑邊、金線帶、半身特寫、招式名（遊戲 UI 文字） */
export function drawCutin(ctx, t, P, img, name = '終審判決') {
  const [a, b] = P.cutin; if (t < a || t > b + 120) return;
  const p = seg(t, a, b), out = seg(t, b - 120, b + 120);
  const bar = 90 * ease.out(seg(t, a, a + 160)) * (1 - out);
  ctx.save(); ctx.fillStyle = '#05030a'; ctx.globalAlpha = .82 * (1 - out); ctx.fillRect(0, 0, 720, 620); ctx.restore();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 720, bar); ctx.fillRect(0, 620 - bar, 720, bar);
  const x = p < .2 ? 720 * (1 - ease.out(p / .2)) : -720 * ease.in(out);
  ctx.save(); ctx.translate(x, 0);
  for (let i = 0; i < 9; i++) { ctx.globalAlpha = .35; ctx.fillStyle = '#f6dc8a'; ctx.fillRect(((t / 2 + i * 97) % 820) - 100, 140 + i * 38, 160 + i * 9, 3); } // 速度線
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 150, 0, 470); g.addColorStop(0, 'rgba(243,210,122,0)'); g.addColorStop(.5, 'rgba(243,210,122,.4)'); g.addColorStop(1, 'rgba(243,210,122,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 200); ctx.lineTo(720, 150); ctx.lineTo(720, 430); ctx.lineTo(0, 470); ctx.fill();
  ctx.strokeStyle = '#f6dc8a'; ctx.lineWidth = 4; ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(0, 200); ctx.lineTo(720, 150); ctx.moveTo(0, 470); ctx.lineTo(720, 430); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.drawImage(img, 20, 130, 700, 350);
  // 招式名
  const na = ease.out(seg(t, a + 150, a + 380));
  ctx.globalAlpha = na; ctx.font = '900 58px "Noto Serif TC","Microsoft JhengHei",serif'; ctx.textAlign = 'left';
  ctx.lineWidth = 8; ctx.strokeStyle = '#2a1608'; ctx.strokeText(name, 40, 545 - (1 - na) * 20);
  const tg = ctx.createLinearGradient(0, 500, 0, 550); tg.addColorStop(0, '#fff6d6'); tg.addColorStop(1, '#e0b04e'); ctx.fillStyle = tg; ctx.fillText(name, 40, 545 - (1 - na) * 20);
  ctx.font = '700 20px "Noto Serif TC","Microsoft JhengHei",serif'; ctx.fillStyle = '#f3dfa0'; ctx.fillText('勞權律師・白律　UR', 44, 576 - (1 - na) * 20);
  ctx.restore();
}
