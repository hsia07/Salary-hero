import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingWaveFor,trainingStateFor,repeatTrainingEnemy} from './training-mode.mjs';
import {initial,enemyFor,transition} from './engine.mjs';

test('training only accepts exactly two illustrated combat opponents',()=>{
 assert.equal(trainingWaveFor('paper-gremlin'),1);
 assert.equal(trainingWaveFor('coffee-mimic'),2);
 for(const invalid of ['',null,'../../secrets','chair-golem','paper-gremlin?x=1','__proto__']){
   assert.equal(trainingWaveFor(invalid),null);
   assert.equal(trainingStateFor(invalid,initial,enemyFor),null);
 }
});
test('safe practice starts in front of the correct illustrated enemy with auto OFF and high HP',()=>{
 const paper=trainingStateFor('paper-gremlin',initial,enemyFor);
 const coffee=trainingStateFor('coffee-mimic',initial,enemyFor);
 assert.equal(paper.wave,1);
 assert.equal(paper.enemy.typeId,'paper-gremlin');
 assert.equal(coffee.wave,2);
 assert.equal(coffee.enemy.typeId,'coffee-mimic');
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
 assert.equal(repeatTrainingEnemy(beat,'chair-golem',enemyFor),beat);
});