import test from 'node:test';
import assert from 'node:assert/strict';
import {StatusEngine, STATUS_DEFS} from '../v19/s1-status-effects.mjs';

test('metadata: seven statuses, each with its own independent art file',()=>{
  assert.equal(Object.keys(STATUS_DEFS).length,7);
  const names=Object.values(STATUS_DEFS).map(e=>e.icon);
  assert.equal(new Set(names).size,7);
});
test('stun prevents action; burn first increases stun duration by 50%',()=>{
  const s=new StatusEngine(7);
  s.apply(0,'burn');const applied=s.apply(0,'stun');
  assert.equal(applied.duration,3300);assert.equal(s.modifiers(0).canAct,false);
  const dots=s.advance(1000);
  assert.equal(dots[0].damage,6);
  s.advance(2400);assert.equal(s.modifiers(0).canAct,true);
});
test('coffee removes stun and slow, increases attack frequency',()=>{
  const s=new StatusEngine(7);s.apply(1,'stun');s.apply(1,'slow');s.apply(1,'coffee');
  assert.equal(s.has(1,'stun'),false);assert.equal(s.has(1,'slow'),false);
  assert.equal(s.modifiers(1).speed,1.5);
});
test('shield mitigates incoming damage and blocks exactly one stun',()=>{
  const s=new StatusEngine(7);s.apply(2,'shield');
  assert.equal(s.incoming(2,20),13);
  assert.equal(s.apply(2,'stun').blockedBy,'shield');
  assert.equal(s.has(2,'stun'),false);
  assert.equal(s.apply(2,'stun').applied,true);
  assert.equal(s.modifiers(2).canAct,false);
});
test('rally stacks with coffee in damage output; payroll halves healing',()=>{
  const s=new StatusEngine(7);s.apply(3,'rally');s.apply(3,'coffee');
  assert.equal(s.attack(3,100),135);
  s.apply(3,'paycut');assert.equal(s.healing(3,50),25);
});
test('burn ticks, shield attenuates DOT, expiration and reset are deterministic',()=>{
  const s=new StatusEngine(7);s.apply(4,'burn');s.apply(4,'shield');
  assert.equal(s.advance(1000)[0].damage,2.6);
  assert.equal(s.advance(1000)[0].damage,2.6);
  s.advance(4500);
  assert.equal(s.has(4,'burn'),false);
  s.clearAll();assert.equal(s.now,0);assert.deepEqual(s.list(4),[]);
});
test('speed multiplier: coffee plus slow cancel numerically, not visually only',()=>{
  const s=new StatusEngine(7);s.apply(5,'coffee');s.apply(5,'slow');
  assert.equal(s.modifiers(5).speed,.75);
});
