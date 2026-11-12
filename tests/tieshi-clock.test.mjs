import test from 'node:test';
import assert from 'node:assert/strict';
import { tieshiClockTime, tieshiClockDigits, canTriggerTieshiAwakenedUltimate } from '../v19/tieshi-clock.mjs';
test('clock always displays 08:59 before biography completion', () => {
  assert.equal(tieshiClockTime(), '08:59');
  assert.equal(tieshiClockTime({awakenedUltimateActive:true}), '08:59');
});
test('09:00 is temporary and gated behind biography clear plus ultimate', () => {
  assert.equal(tieshiClockTime({biographyCleared:true}), '08:59');
  assert.equal(tieshiClockTime({biographyCleared:true,awakenedUltimateActive:true}), '09:00');
  assert.equal(tieshiClockTime({biographyCleared:true,awakenedUltimateActive:false}), '08:59');
});
test('digits are available as separate layers', () => {
  assert.deepEqual({...tieshiClockDigits({biographyCleared:true,awakenedUltimateActive:true})}, {hours:'09',minutes:'00',separator:':',time:'09:00'});
});
test('ultimate requires clear, energy, cooldown and life', () => {
  assert.equal(canTriggerTieshiAwakenedUltimate({biographyCleared:true,energy:100}), true);
  assert.equal(canTriggerTieshiAwakenedUltimate({biographyCleared:false,energy:100}), false);
  assert.equal(canTriggerTieshiAwakenedUltimate({biographyCleared:true,energy:99}), false);
  assert.equal(canTriggerTieshiAwakenedUltimate({biographyCleared:true,energy:100,cooldownRemaining:1}), false);
  assert.equal(canTriggerTieshiAwakenedUltimate({biographyCleared:true,energy:100,alive:false}), false);
});
