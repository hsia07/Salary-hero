/** 薪奴職業樹（六大主職／十二轉職）。正史：ARCHITECTURE §7（2026-11-20「全部照建議」）＋ V21_DEEP_RPG_ONE_YEAR_VISION §2。
 * - 只有薪奴轉職；職業決定薪奴站前排或後排。同事固定職業。
 * - 平凡社畜 → Lv20 一轉（6 職）→ Lv60 二轉（每職 2 支，共 12）→ Lv120 覺醒（未實作）。
 * - 永久解鎖、不永久鎖死：解鎖後可在主城／非戰鬥時切換（轉職試煉關卡尚未實作，目前以等級＋上一階已解鎖為條件）。
 * - role 對應戰鬥模擬的定位（tank/melee/assassin/caster/healer/support）；row 為站位。
 * - 站位與定位是依各職核心循環推定的初版，平衡測試後可調，但不得改職業名稱與樹狀關係。
 */
export const HERO_JOBS = Object.freeze([
  { id: 'commoner', name: '平凡社畜', tier: 0, parent: null, level: 1, row: 'front', role: 'melee', loop: '基礎技能試玩' },
  // 一轉
  { id: 'grinder', name: '社畜鬥士', tier: 1, parent: 'commoner', level: 20, row: 'front', role: 'melee', loop: '近戰硬拚' },
  { id: 'punch-ranger', name: '打卡遊俠', tier: 1, parent: 'commoner', level: 20, row: 'front', role: 'melee', loop: '連擊與機動' },
  { id: 'coffee-mage', name: '咖啡術師', tier: 1, parent: 'commoner', level: 20, row: 'rear', role: 'healer', loop: '回復與增益' },
  { id: 'meeting-mage', name: '會議法師', tier: 1, parent: 'commoner', level: 20, row: 'rear', role: 'caster', loop: '法術與冷卻' },
  { id: 'mech-tech', name: '機甲技師', tier: 1, parent: 'commoner', level: 20, row: 'rear', role: 'support', loop: '召喚與機械' },
  { id: 'nether-pact', name: '冥府契約者', tier: 1, parent: 'commoner', level: 20, row: 'rear', role: 'caster', loop: '印記與收割' },
  // 二轉
  { id: 'overtime-berserker', name: '爆肝狂戰士', tier: 2, parent: 'grinder', level: 60, row: 'front', role: 'melee', loop: '低血高暴擊' },
  { id: 'security-knight', name: '不屈保全騎士', tier: 2, parent: 'grinder', level: 60, row: 'front', role: 'tank', loop: '護盾反擊' },
  { id: 'punctual-saint', name: '準點劍聖', tier: 2, parent: 'punch-ranger', level: 60, row: 'front', role: 'melee', loop: '連擊收工斬' },
  { id: 'swift-agent', name: '疾行密探', tier: 2, parent: 'punch-ranger', level: 60, row: 'front', role: 'assassin', loop: '閃避背刺' },
  { id: 'life-alchemist', name: '續命煉金師', tier: 2, parent: 'coffee-mage', level: 60, row: 'rear', role: 'healer', loop: '回血／增益' },
  { id: 'poison-shaman', name: '毒咖巫醫', tier: 2, parent: 'coffee-mage', level: 60, row: 'rear', role: 'caster', loop: '毒傷擴散' },
  { id: 'chrono-chair', name: '時序議長', tier: 2, parent: 'meeting-mage', level: 60, row: 'rear', role: 'support', loop: '冷卻連鎖' },
  { id: 'silence-hexer', name: '禁言咒術師', tier: 2, parent: 'meeting-mage', level: 60, row: 'rear', role: 'caster', loop: '控場沉默' },
  { id: 'drone-commander', name: '無人機指揮官', tier: 2, parent: 'mech-tech', level: 60, row: 'rear', role: 'support', loop: '多召喚' },
  { id: 'heavy-mech', name: '重裝機兵師', tier: 2, parent: 'mech-tech', level: 60, row: 'front', role: 'tank', loop: '機甲共鳴' },
  { id: 'curse-executor', name: '詛咒執行官', tier: 2, parent: 'nether-pact', level: 60, row: 'front', role: 'melee', loop: '印記爆破' },
  { id: 'soul-reaper', name: '靈魂收割者', tier: 2, parent: 'nether-pact', level: 60, row: 'front', role: 'assassin', loop: '擊殺連鎖' },
]);
export const jobById = id => HERO_JOBS.find(j => j.id === id) || null;
export const FIRST_JOBS = HERO_JOBS.filter(j => j.tier === 1);
export const SECOND_JOBS = HERO_JOBS.filter(j => j.tier === 2);

/** 定位對戰鬥數值的倍率（初版，平衡用） */
const ROLE_MOD = {
  tank: { hp: 1.6, atk: 0.75, interval: 2.0 },
  melee: { hp: 1.2, atk: 1.0, interval: 1.6 },
  assassin: { hp: 0.95, atk: 1.25, interval: 1.4 },
  caster: { hp: 0.9, atk: 1.2, interval: 2.0 },
  healer: { hp: 1.0, atk: 0.7, interval: 2.1 },
  support: { hp: 1.0, atk: 0.9, interval: 1.9 },
};

/** 存檔欄位 heroJob：{ current, unlocked[] }。舊存檔沒有就從平凡社畜開始。 */
export function normalizeHeroJob(raw, level = 1) {
  const unlocked = new Set(['commoner']);
  for (const id of Array.isArray(raw?.unlocked) ? raw.unlocked : []) if (jobById(id)) unlocked.add(id);
  // 解鎖鏈必須完整：二轉需要其一轉
  for (const id of [...unlocked]) { const j = jobById(id); if (j.parent && !unlocked.has(j.parent)) unlocked.delete(id); }
  const current = unlocked.has(raw?.current) ? raw.current : 'commoner';
  return { version: 1, current, unlocked: HERO_JOBS.map(j => j.id).filter(id => unlocked.has(id)) };
}
/** 可解鎖：等級達標且上一階已解鎖（轉職試煉關卡實作後再加入通關條件） */
export function canUnlockJob(heroJob, id, level) {
  const j = jobById(id);
  if (!j || heroJob.unlocked.includes(id)) return false;
  return level >= j.level && (!j.parent || heroJob.unlocked.includes(j.parent));
}
/** 薪奴在小隊戰鬥中的單位。profile 來自 engine 的 heroCombatProfile（沿用既有傷害公式）。 */
export function heroUnit(profile, jobId, id = 'salary-hero') {
  const j = jobById(jobId) || HERO_JOBS[0], m = ROLE_MOD[j.role];
  // 小隊戰鬥以首頁單挑數值為基礎放大：與同事並肩作戰時的戰力換算（初版，平衡測試決定）
  const maxHp = Math.round(profile.maxHp * 3 * m.hp);
  return { id, name: '薪奴', job: j.id, jobName: j.name, role: j.role, row: j.row, lane: 1, maxHp, hp: maxHp,
    attack: Math.max(1, Math.round(profile.attack * 2.2 * m.atk)), armor: profile.armor || 0, lifeSteal: Math.min(0.3, profile.lifeSteal || 0),
    attackInterval: m.interval, energy: 40,
    // 大招需等薪奴大招逐格動畫與特效完成才開放（不以普攻動畫冒充大招）
    ultimate: profile.ultReady ? { multiplier: 4, name: '爆肝連擊', manual: true } : null };
}
