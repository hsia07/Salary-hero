// Salary Hero S1 progression math v0.1. Pure, side-effect-free functions.
// Provisional balance numbers; V19 battle and S1 colleague flows use this module.
export const MAX_LEVEL = 100;
export const BREAK_CAPS = Object.freeze([20, 40, 60, 80, 100]);
const integer = (n) => Number.isSafeInteger(n) && n >= 0;
const assertLevel = (level) => {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) throw new RangeError("invalid level");
};
const assertAmount = (amount) => {
  if (!integer(amount)) throw new RangeError("invalid nonnegative integer");
};
export function xpToNext(level) {
  assertLevel(level);
  return level === MAX_LEVEL ? 0 : Math.round(80 + 18 * level + 2.2 * level * level);
}
export function gainSlaveXp({ level, xp = 0 }, amount) {
  assertLevel(level); assertAmount(xp); assertAmount(amount);
  let nextLevel = level, remaining = xp + amount;
  if (!Number.isSafeInteger(remaining)) throw new RangeError("xp overflow");
  while (nextLevel < MAX_LEVEL && remaining >= xpToNext(nextLevel)) {
    remaining -= xpToNext(nextLevel++);
  }
  if (nextLevel === MAX_LEVEL) remaining = 0;
  return { level: nextLevel, xp: remaining, levelsGained: nextLevel - level };
}
export function slaveStats(level) {
  assertLevel(level);
  return {
    hp: Math.round(1000 * (1 + 0.055 * (level - 1))),
    attack: Math.round(100 * (1 + 0.04 * (level - 1))),
    defense: Math.round(40 * (1 + 0.03 * (level - 1)))
  };
}
export function teamAura(level) {
  assertLevel(level);
  return 1 + 0.0015 * (level - 1);
}
export function colleagueCap(slaveLevel, breakthrough = 0) {
  assertLevel(slaveLevel);
  if (!Number.isInteger(breakthrough) || breakthrough < 0 || breakthrough >= BREAK_CAPS.length) throw new RangeError("invalid breakthrough");
  return Math.min(slaveLevel, BREAK_CAPS[breakthrough]);
}
export function colleagueUpgradeCost(level) {
  assertLevel(level);
  if (level === MAX_LEVEL) return null;
  return {
    trainingXp: Math.round(20 + 5 * level + 0.5 * level * level),
    coins: Math.round(30 + 8 * level + 0.8 * level * level)
  };
}
export function upgradeColleague({ level, breakthrough = 0 }, slaveLevel, materials) {
  assertLevel(level);
  const cap = colleagueCap(slaveLevel, breakthrough);
  if (level >= cap) return { ok: false, reason: "level-cap" };
  const cost = colleagueUpgradeCost(level);
  if (!materials || !integer(materials.trainingXp) || !integer(materials.coins)) return { ok: false, reason: "invalid-materials" };
  if (materials.trainingXp < cost.trainingXp || materials.coins < cost.coins) return { ok: false, reason: "insufficient-materials", cost };
  return { ok: true, level: level + 1, cost, materials: { ...materials, trainingXp: materials.trainingXp - cost.trainingXp, coins: materials.coins - cost.coins } };
}
export function xpReward({ normal = 0, elite = 0, boss = 0, stageFactor = 1, clear = false, firstClear = false }) {
  for (const count of [normal, elite, boss]) assertAmount(count);
  if (!Number.isFinite(stageFactor) || stageFactor <= 0) throw new RangeError("invalid stage factor");
  if (firstClear && !clear) throw new RangeError("first clear requires clear");
  const combat = Math.round((normal * 40 + elite * 160 + boss * 500) * stageFactor);
  const completion = clear ? Math.round(400 * stageFactor) : 0;
  const first = firstClear ? Math.round(600 * stageFactor) : 0;
  return { combat, completion, firstClear: first, total: combat + completion + first };
}
// Settlement requires caller to persist IDs atomically alongside EXP. Returns immutable proposal only.
export function proposeSettlement({ claimedIds, id, reward }) {
  if (!id || typeof id !== "string") throw new TypeError("settlement id required");
  if (!Array.isArray(claimedIds)) throw new TypeError("claimedIds must be an array");
  assertAmount(reward);
  if (claimedIds.includes(id)) return { accepted: false, reward: 0, claimedIds: [...claimedIds] };
  return { accepted: true, reward, claimedIds: [...claimedIds, id] };
}
