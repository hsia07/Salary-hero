import test from 'node:test';
import assert from 'node:assert/strict';
import {SQUAD_JOBS,memberIdFor,jobForMember,squadStats} from '../v19/v21-squad-core.mjs';
import {advanceLiveColleagues,routeLiveRetaliation,activeDispeller} from '../v19/s1-formation-live.mjs';
import {transition} from '../v19/engine.mjs';
const draft={version:1,commanderPath:'strategist',slots:[null,null,null,{id:'office-lawyer',job:'lawyer',level:5,stars:1},null,null]};
test('白律是 UR 具名同事，成員 id 為名冊 id，舊職業 id 不變（存檔相容）',()=>{
 const j=SQUAD_JOBS.find(x=>x.id==='lawyer');
 assert.equal(j.rarity,'UR');assert.equal(memberIdFor(j),'office-lawyer');
 assert.equal(memberIdFor('sentinel'),'starter-sentinel');assert.equal(jobForMember('office-lawyer').id,'lawyer');
 const s=squadStats(draft,10)[3];
 assert.equal(s.counter,.5);assert.equal(s.dispel,true);assert.equal(s.preferredRow,'rear');
});
test('即時戰鬥：白律被敵人打中且存活 → 回傳反擊傷害',()=>{
 const live=advanceLiveColleagues({draft,level:10,enemy:{id:'e',typeId:'e',hp:500,maxHp:500,wave:1},seconds:.2});
 const r=routeLiveRetaliation(live.state,20,{heroHp:100,heroMaxHp:100,targetId:'office-lawyer'});
 assert.equal(r.targetId,'office-lawyer');assert.ok(r.counterDamage>0);
 assert.ok(r.events.some(e=>e.type==='colleague-counter'));
 const hero=routeLiveRetaliation(live.state,20,{heroHp:100,heroMaxHp:100,targetId:'salary-hero'});
 assert.equal(hero.counterDamage,0);
});
test('無效條款：白律存活才算驅散者，倒下後失效',()=>{
 const live=advanceLiveColleagues({draft,level:10,enemy:{id:'e',typeId:'e',hp:500,maxHp:500,wave:1},seconds:.2});
 assert.equal(activeDispeller(draft,live.state)?.id,'office-lawyer');
 const dead={...live.state,battle:{...live.state.battle,allies:live.state.battle.allies.map(u=>({...u,hp:0}))}};
 assert.equal(activeDispeller(draft,dead),null);
});
test('引擎：可招募並部署白律，舊存檔不受影響',()=>{
 let s=transition({},{type:'s1RecruitColleague',id:'lawyer'});
 assert.ok(s.colleagueProgress.members.some(m=>m.id==='office-lawyer'));
 s=transition(s,{type:'s1DeployColleague',id:'lawyer',slot:3});
 assert.equal(s.colleagueFormation.slots[3]?.id,'office-lawyer');
 assert.equal(s.colleagueFormation.slots[3]?.job,'lawyer');
});
test('引擎：guard 敵人在白律部署時不再減傷（無效條款）',()=>{
 const base=transition({},{type:'s1RecruitColleague',id:'lawyer'});
 const mk=withLawyer=>{
  let s=withLawyer?transition(base,{type:'s1DeployColleague',id:'lawyer',slot:4}):base;
  s={...s,enemy:{...s.enemy,trait:'guard',traitText:'防禦',hp:100000,maxHp:100000,attack:0}};
  const r=transition(s,{type:'attack'},()=>.5);
  return 100000-r.enemy.hp-(r.last?.colleagueAssist||0);
 };
 const without=mk(false),withL=mk(true);
 assert.ok(withL>without,`有白律主角傷害 ${withL} 應大於無白律 ${without}`);
});
