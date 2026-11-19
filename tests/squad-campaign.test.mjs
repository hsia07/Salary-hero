import test from 'node:test';
import assert from 'node:assert/strict';
import {createFormationBattle,tickFormationBattle,castUltimate} from '../v19/formation-combat-runtime.mjs';
import {CHAPTER1,MONSTERS,waveEnemies,starsFor,normalizeCampaign,stageUnlocked,nextStage,rewardFor,lawyerUnit,enemyUnits} from '../v19/squad-campaign.mjs';
import {squadStats} from '../v19/v21-squad-core.mjs';
import {initial,normalize,transition} from '../v19/engine.mjs';
import {readFileSync} from 'node:fs';

const stat=L=>squadStats({slots:[{id:'t',job:'lawyer',level:L,stars:1}]},L)[0];

/** 與畫面相同的整關模擬：波次之間保留白律 HP 與能量；玩家能量滿就放大招（打 Boss／最高生命） */
function playStage(stage,L){
 let ally=lawyerUnit(stat(L),'law'),t=0;
 for(let w=0;w<stage.waves.length;w++){
  let b=createFormationBattle({allies:[ally],enemies:enemyUnits(waveEnemies(stage,w))});
  while(!b.winner&&t<600){
   if(b.allies[0].energy>=100)b=castUltimate(b,'law');
   if(!b.winner){b=tickFormationBattle(b,.1);t+=.1;}
  }
  if(b.winner!=='allies')return {won:false,t};
  ally={...ally,hp:b.allies[0].hp,energy:b.allies[0].energy};
 }
 return {won:true,t,hpRatio:ally.hp/ally.maxHp};
}

test('只使用 manifest 已核准的怪物美術',()=>{
 const m=JSON.parse(readFileSync(new URL('../art/v19/runtime/monsters/manifest.json',import.meta.url),'utf8')).monsters;
 for(const type of Object.keys(MONSTERS))assert.equal(m[type]?.approved,true,type);
 for(const s of CHAPTER1)for(const w of s.waves)for(const e of w)assert.ok(MONSTERS[e.type],e.type);
});

test('手動大招：自動模擬不會自己放；castUltimate 能量滿才成立並打指定目標',()=>{
 let b=createFormationBattle({allies:[{...lawyerUnit(stat(1),'law'),energy:100}],enemies:enemyUnits(waveEnemies(CHAPTER1[0],1))});
 for(let i=0;i<40;i++)b=tickFormationBattle(b,.1);
 assert.ok(!b.events.some(e=>e.type==='ultimate'));
 let none=castUltimate({...b,allies:b.allies.map(a=>({...a,energy:99}))},'law');
 assert.equal(none.events.length,0);
 const target=b.enemies[1].id,full={...b,allies:b.allies.map(a=>({...a,energy:100}))};
 const after=castUltimate(full,'law',target);
 assert.equal(after.events[0].type,'ultimate');assert.equal(after.events[0].targetId,target);
 assert.equal(after.allies[0].energy,0);
});

test('集火：一般攻擊改打玩家指定的敵人',()=>{
 let b=createFormationBattle({allies:[lawyerUnit(stat(1),'law')],enemies:enemyUnits(waveEnemies(CHAPTER1[0],1))});
 b={...b,focusTargetId:b.enemies[1].id};
 const hits=[];for(let i=0;i<60;i++){b=tickFormationBattle(b,.1);hits.push(...b.events.filter(e=>e.type==='attack'&&e.actorId==='law'));}
 assert.ok(hits.length>=2);
 assert.ok(hits.every(e=>e.targetId===b.enemies[1].id||b.enemies[1].hp===0));
});

test('星級與解鎖',()=>{
 assert.deepEqual(starsFor({won:false,hpRatio:1,seconds:1,par:40}),[false,false,false]);
 assert.deepEqual(starsFor({won:true,hpRatio:.6,seconds:50,par:40}),[true,true,false]);
 const c=normalizeCampaign({stars:{'1-1':[true,false,false],'1-3':[true,true,true],'bad':[true]}});
 assert.equal(stageUnlocked(c,'1-1'),true);assert.equal(stageUnlocked(c,'1-2'),true);assert.equal(stageUnlocked(c,'1-3'),false);
 assert.ok(!c.stars.bad);
 assert.equal(nextStage(normalizeCampaign(null)).id,'1-1');
});

test('獎勵：首通全額、重複 30%、只有新拿到的星給寶石',()=>{
 const s=CHAPTER1[0];
 const a=rewardFor(s,null,[true,true,false]);assert.equal(a.first,true);assert.equal(a.gems,2);assert.ok(a.trainingXp>0);
 const b=rewardFor(s,[true,true,false],[true,true,true]);assert.equal(b.first,false);assert.equal(b.gems,1);assert.equal(b.trainingXp,0);
 assert.equal(b.gold,Math.round(a.gold*.3));
});

test('引擎結算：寫入金幣、經驗、同事訓練經驗與進度；未解鎖關卡與無效星級不發獎勵；舊存檔可讀',()=>{
 const base=normalize({...initial(),gold:100});
 const bad=transition(base,{type:'squadStageClear',stage:'1-2',stars:[true,true,true]});
 assert.equal(bad.gold,100);assert.equal(bad.last.ok,false);
 const lose=transition(base,{type:'squadStageClear',stage:'1-1',stars:[false,false,false]});
 assert.equal(lose.gold,100);
 const ok=transition(base,{type:'squadStageClear',stage:'1-1',stars:[true,false,true]});
 assert.equal(ok.last.ok,true);assert.ok(ok.gold>100);assert.equal(ok.gems,base.gems+2);
 assert.ok(ok.colleagueProgress.materials.trainingXp>0);
 assert.deepEqual(ok.squadCampaign.stars['1-1'],[true,false,true]);
 const again=transition(ok,{type:'squadStageClear',stage:'1-1',stars:[true,true,false]});
 assert.deepEqual(again.squadCampaign.stars['1-1'],[true,true,true],'星級只會變好');
 const old={...initial()};delete old.squadCampaign;
 assert.deepEqual(normalize(old).squadCampaign,{version:1,stars:{}});
 assert.deepEqual(normalize(JSON.parse(JSON.stringify(again))).squadCampaign.stars['1-1'],[true,true,true],'存檔讀回不遺失');
});

test('平衡：1 級白律能打過 1-1～1-2；Boss 關 1 級打不過、需要養成',()=>{
 const r=CHAPTER1.map(s=>[s.id,playStage(s,1),playStage(s,20)]);
 const msg=JSON.stringify(r.map(([id,a,b])=>[id,a.won,Math.round(a.t),b.won,Math.round(b.t)]));
 assert.ok(r[0][1].won&&r[1][1].won,msg);
 assert.equal(r[5][1].won,false,msg);
 assert.ok(r.every(([,,b])=>b.won),msg);
});
