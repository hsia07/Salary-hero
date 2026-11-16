import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATION_ANCHORS,chooseAttackTarget,chooseHealTarget,chooseShieldTarget,planFormationActions} from '../v19/formation-combat-ai.mjs';
const unit=(id,role,row,lane,hp=100)=>({id,role,row,lane,hp,maxHp:100});
test('formation has six colleagues and independent hero',()=>{assert.equal(FORMATION_ANCHORS.length,7);assert.equal(FORMATION_ANCHORS.filter(x=>x.row==='front').length,3);assert.equal(FORMATION_ANCHORS.filter(x=>x.row==='rear').length,3);});
test('assassin prioritizes vulnerable rear and tank guards front',()=>{
 const front=unit('front','tank','front',1),rear=unit('rear','caster','rear',1);
 assert.equal(chooseAttackTarget(unit('a','assassin','front',1),[front,rear]).id,'rear');
 assert.equal(chooseAttackTarget(unit('t','tank','front',1),[front,rear]).id,'front');
});
test('taunt redirects attacks except explicit immunity',()=>{
 const enemies=[unit('near','melee','front',1),{...unit('far','tank','rear',0),taunting:true}];
 assert.equal(chooseAttackTarget(unit('a','assassin','front',1),enemies).id,'far');
 assert.equal(chooseAttackTarget({...unit('a','melee','front',1),ignoreTaunt:true},enemies).id,'near');
});
test('healing selects critical living ally, never dead or full',()=>{
 const medic=unit('medic','healer','rear',1);
 const target=chooseHealTarget(medic,[medic,unit('dead','tank','front',1,0),unit('critical','tank','front',1,20),unit('fine','melee','front',1,80)]);
 assert.equal(target.id,'critical');
});
test('shields prioritize threatened unshielded frontliners',()=>{
 const caster=unit('caster','support','rear',1);
 const front={...unit('front','tank','front',1,60),threat:8,shield:0};
 const rear={...unit('rear','caster','rear',1,60),shield:90};
 assert.equal(chooseShieldTarget(caster,[front,rear]).id,'front');
});
test('planning uses distinct support actions and distributes targets under saturation',()=>{
 const allies=[unit('one','melee','front',0),unit('two','melee','front',1),unit('three','melee','front',2),unit('medic','healer','rear',1),{...unit('support','support','rear',2),shieldReady:true}];
 allies[0].hp=30;
 const enemies=[unit('left','melee','front',0),unit('right','melee','front',2)];
 const actions=planFormationActions(allies,enemies);
 assert.equal(actions.length,5);
 assert.equal(actions.find(x=>x.actorId==='medic').type,'heal');
 assert.equal(actions.find(x=>x.actorId==='support').type,'shield');
 assert.equal(new Set(actions.filter(x=>x.type==='attack').map(x=>x.targetId)).size,2);
});
