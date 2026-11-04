// V5.31 replay timing and lifecycle regression tests. Run: node tests/replay-regression.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const a=source.indexOf('let replayTimer=null,'),b=source.indexOf('\nfunction towerCombat(',a);
assert(a>=0&&b>a,'replay implementation missing');
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{id,style:{width:'',setProperty(){}},dataset:{},className:'',innerHTML:'',textContent:'',offsetWidth:1,classList:{add(){},remove(){},toggle(){}},setAttribute(){}});return nodes.get(id)}
const jobs=new Map();let next=1;function schedule(fn,ms,kind){const id=next++;jobs.set(id,{fn,ms,kind});return id}
const ctx={$:node,document:{hidden:false,addEventListener(){}},window:{matchMedia:()=>({matches:true})},setInterval:(fn,ms)=>schedule(fn,ms,'interval'),clearInterval:id=>jobs.delete(id),setTimeout:(fn,ms)=>schedule(fn,ms,'timeout'),clearTimeout:id=>jobs.delete(id),monsterSprite:name=>'<img alt="'+name+'">',monsterLook:()=>({tone:'slime'}),battleParticles(){},battleSound(){},message(){},Math};
vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);
const get=x=>vm.runInContext(x,ctx);
assert.equal(get('replayFrameBudget(4)'),480);
assert.equal(get('replayFrameBudget(60)'),233);
assert.equal(get('replayFrameBudget(120)'),150);
const result={floor:2,wave:1,totalWaves:3,enemyName:'加班史萊姆',win:true,startHp:100,heroHp:80,maxHeroHp:100,enemyHp:0,maxHp:100,events:[{who:'hero',type:'slash',damage:100,hp:0}]};
vm.runInContext('replayTower',ctx)(result);
assert.equal(get('replayActive'),true);
assert.equal(get('replayFrameMs()'),480);
vm.runInContext('replayTick()',ctx); // finish wave and schedule next wave
assert.equal(get('replayAtEnd'),true);
assert.ok([...jobs.values()].some(j=>j.kind==='timeout'),'end-of-wave delay should exist');
vm.runInContext('toggleReplayPause()',ctx);
assert.equal(get('replayPaused'),true);
assert.equal(jobs.size,0,'pause must clear pending next-wave delay');
vm.runInContext('toggleReplayPause()',ctx);
assert.equal(get('replayPaused'),false);
assert.ok([...jobs.values()].some(j=>j.kind==='timeout'),'resume must schedule next-wave delay, not skip the queue');
vm.runInContext('skipBattleReplay()',ctx);
assert.equal(get('replayActive'),false);
assert.equal(jobs.size,0);
assert.equal(node('towerEnemyLive').style.width,'0%');
assert.equal(node('towerHeroLive').style.width,'80%');
assert.match(node('towerArenaName').textContent,/加班史萊姆/);
console.log('PASS replay pacing, end-of-wave pause/resume, skip lifecycle and final HUD');
