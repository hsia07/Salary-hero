import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingWaveFor,trainingStateFor,repeatTrainingEnemy,primeTrainingFinisher} from './training-mode.mjs';
import {initial,enemyFor,transition} from './engine.mjs';

test('training admits three approved monsters and one isolated fourth timing candidate',()=>{
 assert.equal(trainingWaveFor('paper-gremlin'),1);
 assert.equal(trainingWaveFor('coffee-mimic'),2);
 assert.equal(trainingWaveFor('chair-golem'),5);
 assert.equal(trainingWaveFor('meeting-ghost'),50);
 assert.equal(trainingWaveFor('deadline-clock'),6);
 for(const invalid of ['',null,'../../secrets','printer-minion','paper-gremlin?x=1','__proto__']){
   assert.equal(trainingWaveFor(invalid),null);
   assert.equal(trainingStateFor(invalid,initial,enemyFor),null);
 }
});
test('safe practice starts in front of the correct illustrated enemy with auto OFF and high HP',()=>{
 const paper=trainingStateFor('paper-gremlin',initial,enemyFor);
 const coffee=trainingStateFor('coffee-mimic',initial,enemyFor);
 const guard=trainingStateFor('chair-golem',initial,enemyFor);
 const alien=trainingStateFor('meeting-ghost',initial,enemyFor);
 assert.equal(paper.wave,1);
 assert.equal(paper.enemy.typeId,'paper-gremlin');
 assert.equal(coffee.wave,2);
 assert.equal(coffee.enemy.typeId,'coffee-mimic');
 assert.equal(guard.wave,5);
 assert.equal(guard.enemy.typeId,'chair-golem');
 assert.equal(guard.enemy.tier,'normal');
 assert.equal(alien.enemy.typeId,'meeting-ghost');
 assert.equal(alien.wave,50);
 assert.equal(alien.auto,false);
 assert.equal(coffee.auto,false);
 assert.equal(coffee.speed,1);
 assert.equal(coffee.playerName,'練習勇者');
 assert.ok(coffee.heroHp>=500);
 assert.equal(coffee.enemy.hp,126);
});
test('a real gameplay transition damages practice opponents and retaliates without affecting an original state',()=>{
 const original=initial();
 const training=trainingStateFor('coffee-mimic',initial,enemyFor);
 const next=transition(training,'attack',()=>.999);
 assert.ok(next.enemy.hp<training.enemy.hp);
 assert.equal(original.wave,1);
 assert.equal(original.gold,0);
 assert.equal(original.heroHp,110);
 assert.equal(training.enemy.hp,126);
});
test('victory loops back to training enemy without deleting last defeat animation result',()=>{
 const old=trainingStateFor('coffee-mimic',initial,enemyFor);
 const fatal={...old,enemy:{...old.enemy,hp:1}};
 const beat=transition(fatal,'attack',()=>.9);
 assert.equal(beat.last.type,'victory');
 assert.notEqual(beat.wave,old.wave);
 const renewed=repeatTrainingEnemy(beat,'coffee-mimic',enemyFor);
 assert.equal(renewed.wave,2);
 assert.equal(renewed.enemy.typeId,'coffee-mimic');
 assert.equal(renewed.enemy.hp,126);
 assert.equal(renewed.last.type,'victory');
 assert.equal(renewed.heroHp,900);
 const preview=repeatTrainingEnemy(beat,'chair-golem',enemyFor);
 assert.equal(preview.enemy.typeId,'chair-golem');
 assert.equal(preview.wave,5);
 assert.equal(repeatTrainingEnemy(beat,'printer-minion',enemyFor),beat);
});
test('one-tap finisher is a genuine normal engine victory only inside an approved training species',()=>{
 const saved=initial(),original=trainingStateFor('chair-golem',initial,enemyFor);
 const primed=primeTrainingFinisher(original,'chair-golem');
 assert.equal(primed.enemy.hp,1);
 assert.equal(primed.wave,5);
 assert.equal(primed.auto,false);
 assert.equal(original.enemy.hp,126);
 assert.deepEqual(saved,initial(),'real game state must not mutate');
 const after=transition(primed,'attack',()=>.999);
 assert.equal(after.last.type,'victory');
 const repeated=repeatTrainingEnemy(after,'chair-golem',enemyFor);
 assert.equal(repeated.wave,5);
 assert.equal(repeated.enemy.hp,126);
 assert.equal(repeated.last.type,'victory');
 assert.equal(primeTrainingFinisher(original,'another-id'),original);
 const mismatched={...original,wave:2};
 assert.equal(primeTrainingFinisher(mismatched,'chair-golem'),mismatched);
});

test('alien rehearsals attack and finish at correct original species without saving progress',()=>{
 const real=initial(),practice=trainingStateFor('meeting-ghost',initial,enemyFor);
 assert.equal(practice.wave,50);assert.equal(practice.enemy.typeId,'meeting-ghost');
 const hit=transition(practice,'attack',()=>.95);
 assert.ok(hit.enemy.hp<practice.enemy.hp);
 const primed=primeTrainingFinisher(practice,'meeting-ghost');
 const win=transition(primed,'attack',()=>.95);
 assert.equal(win.last.type,'victory');
 const renewed=repeatTrainingEnemy(win,'meeting-ghost',enemyFor);
 assert.equal(renewed.wave,50);assert.equal(renewed.enemy.hp,126);
 assert.equal(real.wave,1);assert.equal(real.gold,0);
});

test('fifth ghost has isolated wave 6 training with real attack/victory and no save mutation',()=>{
 const real=initial(),practice=trainingStateFor('deadline-clock',initial,enemyFor);
 assert.equal(practice.wave,6);assert.equal(practice.enemy.typeId,'deadline-clock');
 assert.equal(practice.enemy.tier,'normal');assert.equal(practice.auto,false);
 const hit=transition(practice,'attack',()=>.98);
 assert.ok(hit.enemy.hp<practice.enemy.hp);
 const primed=primeTrainingFinisher(practice,'deadline-clock');
 const won=transition(primed,'attack',()=>.98);
 assert.equal(won.last.type,'victory');
 const repeat=repeatTrainingEnemy(won,'deadline-clock',enemyFor);
 assert.equal(repeat.wave,6);assert.equal(repeat.enemy.typeId,'deadline-clock');
 assert.equal(repeat.enemy.hp,126);assert.equal(real.wave,1);assert.equal(real.gold,0);
});
