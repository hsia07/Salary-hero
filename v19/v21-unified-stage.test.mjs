import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {V21_VIEWS,v21View,v21Activity,initV21UnifiedStage} from './v21-unified-stage.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
test('V21 views are presentation-only and defaults to the actual battle scene',()=>{
 assert.deepEqual(V21_VIEWS,['office','battle']);
 assert.equal(v21View('office'),'office');
 assert.equal(v21View('battle'),'battle');
 assert.equal(v21View('oops'),'battle');
 assert.doesNotThrow(()=>initV21UnifiedStage({getState:()=>({})}));
});
test('V21 status uses live state, no invented rewards and no mutation',()=>{
 const s={auto:true,wave:27,pendingDrops:['laptop'],chests:2,specialChests:1};
 const before=JSON.stringify(s),v=v21Activity(s);
 assert.equal(v.detail,'第 27 關');assert.equal(v.loot,1);assert.equal(v.chest,3);
 assert.match(v.label,/自動冒險/);assert.equal(JSON.stringify(s),before);
 assert.match(v21Activity({auto:false}).label,/暫停/);
});
test('V21 single-stage DOM still contains real salary, battle and other screens',()=>{
 const html=readFileSync(resolve(dir,'play.html'),'utf8');
 const css=readFileSync(resolve(dir,'v21-unified-stage.css'),'utf8');
 for(const id of ['v21-salary-bar','v21-view-office','v21-view-battle','v21-more-toggle','v21-more-menu','v21-loot-toggle','v21-office-status',
 'town-stage','battle-deck','world','today','pay-month','auto','speed','attack','heal','claim','chest','weekend-chest']){
  assert.ok(html.includes('id="'+id+'"'),'missing '+id);
 }
 assert.match(css,/grid-row:5/);
 assert.match(css,/data-v21-view="office"/);
 assert.match(css,/data-v21-view="battle"/);
 assert.match(html,/v21-unified-stage\.css/);
 const app=readFileSync(resolve(dir,'app.mjs'),'utf8');
 assert.match(app,/v21-unified-stage\.mjs/);
 assert.equal((html.match(/id="today"/g)||[]).length,1,'never clone salary counters');
});
