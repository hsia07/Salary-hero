import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO_JOBS,FIRST_JOBS,SECOND_JOBS,jobById,normalizeHeroJob,canUnlockJob,heroUnit} from '../v19/hero-jobs.mjs';
import {initial,normalize,transition,heroCombatProfile} from '../v19/engine.mjs';
import {chooseAttackTarget} from '../v19/formation-combat-ai.mjs';

test('職業樹：平凡社畜→6 一轉→12 二轉，名稱照 V21 願景 §2',()=>{
 assert.deepEqual(FIRST_JOBS.map(j=>j.name),['社畜鬥士','打卡遊俠','咖啡術師','會議法師','機甲技師','冥府契約者']);
 assert.equal(SECOND_JOBS.length,12);
 for(const f of FIRST_JOBS)assert.equal(SECOND_JOBS.filter(s=>s.parent===f.id).length,2,f.name);
 assert.deepEqual(SECOND_JOBS.map(j=>j.name),['爆肝狂戰士','不屈保全騎士','準點劍聖','疾行密探','續命煉金師','毒咖巫醫','時序議長','禁言咒術師','無人機指揮官','重裝機兵師','詛咒執行官','靈魂收割者']);
 assert.ok(HERO_JOBS.every(j=>['front','rear'].includes(j.row)));
 assert.ok(FIRST_JOBS.every(j=>j.level===20)&&SECOND_JOBS.every(j=>j.level===60));
});

test('解鎖條件：等級＋上一階；存檔正規化會補齊解鎖鏈',()=>{
 const h=normalizeHeroJob(null);
 assert.equal(h.current,'commoner');
 assert.equal(canUnlockJob(h,'grinder',19),false);
 assert.equal(canUnlockJob(h,'grinder',20),true);
 assert.equal(canUnlockJob(h,'security-knight',60),false,'沒有一轉不能二轉');
 const bad=normalizeHeroJob({current:'security-knight',unlocked:['security-knight']});
 assert.deepEqual(bad.unlocked,['commoner']);assert.equal(bad.current,'commoner');
});

test('引擎：解鎖與切換職業寫入存檔；薪奴站位與戰鬥定位跟著職業變',()=>{
 let s=normalize({...initial(),level:20});
 s=transition(s,{type:'heroSetJob',id:'coffee-mage'});assert.equal(s.last.ok,false,'未解鎖不能切');
 s=transition(s,{type:'heroUnlockJob',id:'coffee-mage'});assert.equal(s.last.ok,true);
 s=transition(s,{type:'heroSetJob',id:'coffee-mage'});assert.equal(s.heroJob.current,'coffee-mage');
 const u=heroUnit(heroCombatProfile(s),s.heroJob.current);
 assert.equal(u.row,'rear');assert.equal(u.role,'healer');
 assert.equal(heroUnit(heroCombatProfile(s),'commoner').row,'front');
 const old={...initial()};delete old.heroJob;
 assert.equal(normalize(old).heroJob.current,'commoner','舊存檔可讀');
 assert.equal(normalize(JSON.parse(JSON.stringify(s))).heroJob.current,'coffee-mage','存檔讀回不遺失');
});

test('薪奴大招未開放：沒有大招動畫素材前不給假大招',()=>{
 assert.equal(heroUnit(heroCombatProfile(normalize(initial())),'commoner').ultimate,null);
});

test('前排保護後排：前排有人時近戰不打後排，刺客例外',()=>{
 const front={id:'f',row:'front',lane:0,hp:100,maxHp:100},rear={id:'r',row:'rear',lane:1,hp:10,maxHp:100};
 const melee={id:'m',row:'front',lane:1,hp:50,maxHp:50,role:'melee'},assassin={...melee,id:'a',role:'assassin'};
 assert.equal(chooseAttackTarget(melee,[front,rear]).id,'f');
 assert.equal(chooseAttackTarget(assassin,[front,rear]).id,'r');
 assert.equal(chooseAttackTarget(melee,[{...front,hp:0},rear]).id,'r','前排倒光才打後排');
});
