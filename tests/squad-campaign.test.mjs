import test from 'node:test';
import assert from 'node:assert/strict';
import {createFormationBattle,tickFormationBattle,castUltimate} from '../v19/formation-combat-runtime.mjs';
import {CHAPTER1,MONSTERS,waveEnemies,starsFor,normalizeCampaign,stageUnlocked,nextStage,rewardFor,lawyerUnit,enemyUnits} from '../v19/squad-campaign.mjs';
import {squadStats} from '../v19/v21-squad-core.mjs';
import {initial,normalize,transition,heroCombatProfile} from '../v19/engine.mjs';
import {heroUnit} from '../v19/hero-jobs.mjs';
import {readFileSync} from 'node:fs';

const stat=L=>squadStats({slots:[{id:'t',job:'lawyer',level:L,stars:1}]},L)[0];

/** 與畫面相同的整關模擬：薪奴＋白律；波次之間保留 HP 與能量；能量滿就放大招 */
function party(hL,lL){const s=normalize({...initial(),level:hL,maxHp:110+(hL-1)*8});return [heroUnit(heroCombatProfile(s),'commoner'),{...lawyerUnit(stat(lL),'law'),row:'rear'}];}
function playStage(stage,P){
 let units=P.map(u=>({...u})),t=0;
 for(let w=0;w<stage.waves.length;w++){
  let b=createFormationBattle({allies:units.filter(u=>u.hp>0),enemies:enemyUnits(waveEnemies(stage,w))});
  while(!b.winner&&t<600){
   for(const a of b.allies)if(a.ultimate&&a.energy>=100&&a.hp>0)b=castUltimate(b,a.id);
   if(!b.winner){b=tickFormationBattle(b,.1);t+=.1;}
  }
  if(b.winner!=='allies')return {won:false,t};
  units=units.map(u=>{const x=b.allies.find(a=>a.id===u.id);return {...u,hp:x?.hp??0,energy:x?.energy??u.energy};});
 }
 return {won:true,t};
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

test('平衡（薪奴＋白律）：1 級能打過 1-1～1-2；Boss 關 1 級打不過、薪奴 20／白律 15 級全通',()=>{
 const low=CHAPTER1.map(s=>playStage(s,party(1,1))),high=CHAPTER1.map(s=>playStage(s,party(20,15)));
 const msg=JSON.stringify([low.map(r=>r.won),high.map(r=>r.won)]);
 assert.ok(low[0].won&&low[1].won,msg);
 assert.equal(low[5].won,false,msg);
 assert.ok(high.every(r=>r.won),msg);
});

test('集火後排的大招：castUltimate 指定目標優先於預設選敵',()=>{
 const b=createFormationBattle({allies:[{...lawyerUnit(stat(1),'law'),energy:100}],enemies:enemyUnits(waveEnemies(CHAPTER1[5],2))});
 const boss=b.enemies.find(e=>e.boss),other=b.enemies.find(e=>!e.boss);
 assert.equal(castUltimate(b,'law').events[0].targetId,boss.id,'預設打 Boss');
 assert.equal(castUltimate(b,'law',other.id).events[0].targetId,other.id,'集火時打指定目標');
});
