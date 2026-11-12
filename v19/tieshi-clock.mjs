/** Tieshi clock: deterministic, independent of wall-clock time. */
export const TIESHI_TIME = Object.freeze({ locked: '08:59', awakened: '09:00' });
export function tieshiClockTime({ biographyCleared = false, awakenedUltimateActive = false } = {}) {
  return biographyCleared && awakenedUltimateActive ? TIESHI_TIME.awakened : TIESHI_TIME.locked;
}
export function tieshiClockDigits(state = {}) {
  const time = tieshiClockTime(state);
  return Object.freeze({ hours: time.slice(0, 2), minutes: time.slice(3), separator: ':', time });
}
export function canTriggerTieshiAwakenedUltimate({ biographyCleared = false, energy = 0, cooldownRemaining = 0, alive = true } = {}) {
  return Boolean(biographyCleared && alive && energy >= 100 && cooldownRemaining <= 0);
}
