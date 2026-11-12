import test from 'node:test';
import assert from 'node:assert/strict';
import { tieshiClockTime } from '../v19/tieshi-clock.mjs';
// Validate independent, deterministic clock gating while the battle runtime is browser-only.
test('09:00 never appears without biography clear and an active ultimate',()=>{
 for(const biographyCleared of [false,true])for(const awakenedUltimateActive of [false,true]){
  const expected=biographyCleared&&awakenedUltimateActive?'09:00':'08:59';
  assert.equal(tieshiClockTime({biographyCleared,awakenedUltimateActive}),expected);
 }
});
