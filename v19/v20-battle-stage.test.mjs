import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BATTLE_STAGE,v20CombatAnchors,v20EnemyArtBounds,drawV20ContactShadow} from './v20-battle-stage.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
test('P0.9 real game actors occupy the battle center without invading right controls',()=>{
  const a=v20CombatAnchors();
  assert.equal(a.heroX,116);
  assert.equal(a.enemyX,334);
  for(const variant of [{},{elite:true},{boss:true}]){
    const b=v20EnemyArtBounds(variant);
    assert.ok(b.left>230,'enemy moved off center');
    assert.ok(b.right<=566,'art must not be hidden by right loot rail');
    assert.ok(b.center>360,'enemy faces the hero from the right');
  }
});
test('P0.9 HD training remains pixel-for-pixel at original stage positions',()=>{
  const t=v20CombatAnchors({training:true,boss:true});
  assert.equal(t.heroX,100);
  assert.equal(t.enemyX,458);
  assert.equal(t.floorY,525);
  assert.equal(BATTLE_STAGE.width,720);
  assert.equal(BATTLE_STAGE.height,620);
});
test('P0.9 contact shadows are correctly balanced and never change game state',()=>{
 let depth=0,fills=0,strokes=0;
 const g={addColorStop(){}};
 const ctx={
  save(){depth++},restore(){depth--},translate(){},scale(){},
  createRadialGradient(){return g},beginPath(){},arc(){},fill(){fills++},
  ellipse(){},stroke(){strokes++}
 };
 drawV20ContactShadow(ctx,300,525,{width:100,opacity:1});
 assert.equal(depth,0);
 assert.equal(fills,2);assert.equal(strokes,1);
 assert.doesNotThrow(()=>drawV20ContactShadow(null,0,0));
});
test('P0.9 damage popup and FX follow the relocated enemy, not fixed x=546',()=>{
 const code=readFileSync(resolve(dir,'app.mjs'),'utf8');
 const css=readFileSync(resolve(dir,'v20-p09-composition.css'),'utf8');
 assert.match(code,/v20CombatAnchors/);
 assert.match(code,/drawV20ContactShadow/);
 assert.match(code,/enemyX\+90,y/);
 assert.doesNotMatch(code,/strokeText\('-'\+fx\.result\.damage,546,y\)/);
 assert.match(css,/mini-actions/);
 assert.match(css,/\.bars/);
});
