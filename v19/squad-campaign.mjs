/** 小隊戰鬥・第一章關卡（純資料與規則，無 DOM、無存檔副作用）。
 * 第一版真正遊戲循環（使用者 2026-11-19「照這個範圍做」）：關卡 → 分波次戰鬥 → 星級 → 獎勵寫入存檔 → 養成 → 下一關。
 * 只使用 manifest 已核准的逐格怪物；沒有正式美術的怪物不上場。
 * 敵人數值是固定值（以白律 1 級攻擊 31 為基準校準），同事升級後關卡會變簡單——養成才有意義。
 */
export const MONSTERS = Object.freeze({
  'paper-gremlin': { name: '影印室工讀紙妖', ext: 'png', size: 250, hp: 200, atk: 11, interval: 2.8 },
  'coffee-mimic': { name: '茶水間實習杯靈', ext: 'webp', size: 250, hp: 190, atk: 10, interval: 2.6 },
  'meeting-ghost': { name: '星際打卡實習生', ext: 'webp', size: 280, hp: 240, atk: 13, interval: 3.0 },
  'deadline-clock': { name: '雲端資料專員靈', ext: 'webp', size: 280, hp: 260, atk: 15, interval: 3.2 },
  'keyboard-piranha': { name: '加班遊魂文員', ext: 'webp', size: 300, hp: 300, atk: 14, interval: 2.9 },
  'chair-golem': { name: '打卡保全機兵', ext: 'webp', size: 340, hp: 560, atk: 18, interval: 3.4 },
});

const W = (...types) => types.map(t => (typeof t === 'string' ? { type: t } : t));
const BOSS = type => ({ type, boss: true });
/** 第一章「辦公室遠征」。mul＝該關敵人強度倍率；par＝三星時限（秒） */
export const CHAPTER1 = Object.freeze([
  { id: '1-1', name: '影印室走廊', mul: 1.0, par: 30, waves: [W('paper-gremlin'), W('paper-gremlin', 'paper-gremlin')] },
  { id: '1-2', name: '茶水間', mul: 1.1, par: 35, waves: [W('coffee-mimic'), W('paper-gremlin', 'coffee-mimic')] },
  { id: '1-3', name: '會議室', mul: 1.2, par: 55, waves: [W('meeting-ghost'), W('meeting-ghost', 'paper-gremlin'), W('coffee-mimic', 'meeting-ghost')] },
  { id: '1-4', name: '死線檔案庫', mul: 1.35, par: 60, waves: [W('deadline-clock'), W('deadline-clock', 'paper-gremlin'), W('meeting-ghost', 'deadline-clock')] },
  { id: '1-5', name: '深夜加班區', mul: 1.5, par: 65, waves: [W('keyboard-piranha'), W('keyboard-piranha', 'coffee-mimic'), W('deadline-clock', 'keyboard-piranha', 'meeting-ghost')] },
  { id: '1-6', name: '打卡閘門', mul: 1.65, par: 80, boss: true, waves: [W('paper-gremlin', 'coffee-mimic'), W('meeting-ghost', 'deadline-clock'), [BOSS('chair-golem'), { type: 'keyboard-piranha' }]] },
]);
export const stageById = id => CHAPTER1.find(s => s.id === id) || null;

/** 一波敵人的站位：依數量排開；fy＝前後景深（負值在後排） */
const SLOTS = { 1: [[540, 20]], 2: [[470, 45], [620, -35]], 3: [[430, 40], [560, -55], [650, 70]] };
export function waveEnemies(stage, waveIndex) {
  const wave = stage.waves[waveIndex] || [];
  const slots = SLOTS[wave.length] || SLOTS[3];
  // Boss 固定站中間後排
  const order = wave.length === 2 && wave[0].boss ? [1, 0] : wave.map((_, i) => i);
  return wave.map((w, i) => {
    const m = MONSTERS[w.type], k = stage.mul;
    const [x, fy] = slots[order[i]];
    return {
      id: `w${waveIndex}e${i}`, type: w.type, name: m.name, boss: !!w.boss, ext: m.ext,
      x: w.boss ? 560 : x, fy: w.boss ? -55 : fy, size: m.size,
      maxHp: Math.round(m.hp * k), attack: Math.round(m.atk * k), attackInterval: m.interval,
    };
  });
}

/** 星級：★1 勝利；★2 白律剩餘 HP ≥ 50%；★3 在時限內通關 */
export const STAR_RULES = Object.freeze(['擊敗所有敵人', '同事剩餘生命 ≥ 50%', '時限內通關']);
export function starsFor({ won, hpRatio, seconds, par }) {
  if (!won) return [false, false, false];
  return [true, hpRatio >= 0.5, seconds <= par];
}

/** 進度：{ version:1, stars:{ '1-1':[true,false,true] } }；獨立欄位，舊存檔沒有就從零開始 */
export function normalizeCampaign(raw) {
  const out = { version: 1, stars: {} };
  const src = raw && typeof raw === 'object' && raw.stars && typeof raw.stars === 'object' ? raw.stars : {};
  for (const s of CHAPTER1) {
    const v = src[s.id];
    if (Array.isArray(v) && v[0] === true) out.stars[s.id] = [true, v[1] === true, v[2] === true];
  }
  return out;
}
export const starCount = st => (st || []).filter(Boolean).length;
export function stageUnlocked(campaign, id) {
  const i = CHAPTER1.findIndex(s => s.id === id);
  if (i < 0) return false;
  return i === 0 || !!campaign.stars[CHAPTER1[i - 1].id];
}
/** 下一個該打的關：第一個未通關的已解鎖關卡；全通關則回到最後一關 */
export function nextStage(campaign) {
  return CHAPTER1.find(s => !campaign.stars[s.id]) || CHAPTER1[CHAPTER1.length - 1];
}

/** 獎勵：首通全額；重複挑戰 30%（只給金幣、經驗）；每顆「第一次拿到的星」給 1 顆寶石 */
export function rewardFor(stage, previousStars, newStars) {
  const i = CHAPTER1.indexOf(stage), first = !previousStars;
  const base = { gold: 90 + 45 * i, xp: 40 + 22 * i, trainingXp: 30 + 15 * i };
  if (stage.boss) { base.gold *= 2; base.xp *= 2; base.trainingXp *= 2; }
  const gainedStars = [0, 1, 2].filter(k => newStars[k] && !(previousStars && previousStars[k])).length;
  if (first) return { first: true, gold: base.gold, xp: base.xp, trainingXp: base.trainingXp, gems: gainedStars };
  return { first: false, gold: Math.round(base.gold * 0.3), xp: Math.round(base.xp * 0.3), trainingXp: 0, gems: gainedStars };
}

/** 白律上場數值（畫面與平衡測試共用）。hp×4：單人上場的試玩補正，之後多人上場時再調。大招為手動施放。 */
export function lawyerUnit(stat, id) {
  return { id, name: '白律', role: 'caster', row: 'rear', lane: 1, maxHp: stat.maxHp * 4, hp: stat.maxHp * 4, attack: stat.attack, attackInterval: 1.8, energy: 70,
    counter: stat.counter, counterInterval: 1.5, dispelPower: 1, dispelInterval: 8, ultimate: { multiplier: 5, name: '終審判決', manual: true } };
}
/** 一波敵人轉成模擬單位（Boss 帶「強化」增益，可被終審判決解除） */
export function enemyUnits(list) {
  return list.map((e, i) => ({ id: e.id, name: e.name, role: e.boss ? 'tank' : 'melee', row: 'front', lane: i, maxHp: e.maxHp, hp: e.maxHp,
    attack: e.attack, attackInterval: e.attackInterval, cooldown: 1.2 + i * 0.7, boss: e.boss, statuses: e.boss ? [{ type: 'fortify', duration: 999 }] : [] }));
}
