import test from 'node:test';
import assert from 'node:assert/strict';
import {SQUAD_SLOTS,SQUAD_JOBS,COMMANDER_PATHS,squadMember,normalizeSquadDraft,
 canPlaceMember,assignSquadMember,squadStats,squadSynergies,squadPreview,commanderAction} from './v21-squad-core.mjs';
const m=(id,job,path)=>({id,job,path,level:12,stars:2});
test('six actual tactical slots, every profession has three distinct paths, and protagonist is a seventh COMMAND role, not a forced party slot',()=>{
 assert.equal(SQUAD_SLOTS.length,6);
 assert.deepEqual(SQUAD_SLOTS.map(x=>x.row),['front','front','middle','middle','rear','rear']);
 assert.equal(SQUAD_JOBS.length,6);
 for(const j of SQUAD_JOBS){
  assert.equal(j.paths.length,3);
  assert.equal(new Set(j.paths.map(x=>x.id)).size,3);
  assert.equal(new Set(j.paths.map(x=>x.effect)).size,3);
 }
 assert.equal(COMMANDER_PATHS.length,3);
});
test('squad migration draft cannot duplicate a character or break original state data',()=>{
 const raw={slots:[m('a','sentinel','bulwark'),m('a','medic','restoration'),m('c','mage','fire'),null],commanderPath:'strange'};
 const original=JSON.stringify(raw);
 const fixed=normalizeSquadDraft(raw);
 assert.equal(fixed.slots.length,6);assert.equal(fixed.slots[0].id,'a');
 assert.equal(fixed.slots[1],null);assert.equal(fixed.commanderPath,'strategist');
 assert.equal(JSON.stringify(raw),original);
 assert.equal(canPlaceMember(fixed,2,m('a','mage','fire')),false);
 assert.equal(squadPreview(assignSquadMember(fixed,1,m('b','medic','restoration'))).filled,3);
 assert.equal(squadPreview(assignSquadMember(fixed,6,m('z','medic','restoration'))).filled,2);
 assert.equal(squadMember({id:'evil',job:'unknown'}),null);
});
test('distinct path and role choices produce different preview and balanced synergies',()=>{
 let squad=normalizeSquadDraft({slots:[]});
 for(const [i,id,jobId,path] of [[0,'g','sentinel','bulwark'],[1,'f','fighter','duelist'],
   [2,'a','assassin','poison'],[3,'e','engineer','turret'],
   [4,'m','medic','restoration'],[5,'x','mage','fire']]){
  squad=assignSquadMember(squad,i,m(id,jobId,path));
 }
 const v=squadPreview(squad);
 assert.equal(v.filled,6);assert.equal(v.empty,0);
 assert.ok(v.baseAttack>0&&v.baseHp>0);
 assert.ok(squadSynergies(squad).some(x=>x.tag==='office'&&x.tier===2));
 assert.equal(squadStats(squad)[2].effect,'poison');
 assert.equal(squadStats(squad)[3].effect,'summon');
 const before=JSON.stringify(squad);
 squadPreview(squad);assert.equal(JSON.stringify(squad),before);
});
test('commander paths have differentiated team effects and do not require paying real salary',()=>{
 const allies=[{id:'a',hp:40,maxHp:100},{id:'b',hp:90,maxHp:110}];
 const enemies=[{id:'e',hp:120}];
 for(const [path,type] of [['overtime','damage-buff'],['strategist','interrupt-weaken'],['logistics','heal-shield']]){
  const s={commanderPath:path};
  assert.equal(commanderAction(s,{charge:99,allies,enemies}).ready,false);
  const cmd=commanderAction(s,{charge:100,allies,enemies});
  assert.equal(cmd.ready,true);assert.equal(cmd.charge,0);
  assert.ok(cmd.effects.every(x=>x.type===type));
 }
 assert.equal(allies[0].hp,40);
});
