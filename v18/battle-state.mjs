/**
 * V18.6 independent combat prototype logic.
 * Never render animated units over home-master.webp: that image already contains units.
 * Battle scene must use a clean arena background before enabling character sprites.
 */
export class BattleState {
  constructor({onChange=()=>{}, random=Math.random}={}) {
    this.onChange=onChange; this.random=random;
    this.state={enabled:true,speed:1,wave:1,hero:{hp:100,maxHp:100,attack:12,equipment:'starter'},enemy:this.spawn(1),gold:0,kills:0,log:[]};
  }
  spawn(wave) {return {id:'enemy-'+wave,name:'加班印表機',hp:50+wave*12,maxHp:50+wave*12,attack:4+Math.floor(wave/3)};}
  equip(id) {const items={starter:{attack:12},iron:{attack:18},gold:{attack:26}};if(!items[id])throw new Error('Unknown equipment');this.state.hero.equipment=id;this.state.hero.attack=items[id].attack;this.emit();}
  setAuto(enabled) {this.state.enabled=!!enabled;this.emit();}
  setSpeed(speed) {this.state.speed=speed===2?2:1;this.emit();}
  tick({manual=false}={}) {
    const s=this.state;if(!s.enabled&&!manual)return false;
    const roll=Math.max(0,Math.min(0.999999,Number(this.random())||0));
    const damage=s.hero.attack+Math.floor(roll*6);
    s.enemy.hp=Math.max(0,s.enemy.hp-damage);
    s.log=[{type:'hit',target:s.enemy.id,damage},...s.log].slice(0,8);
    if(s.enemy.hp===0) {
      const defeated=s.enemy.id; const reward=10+s.wave*3;
      s.gold+=reward;s.kills++;s.wave++;s.enemy=this.spawn(s.wave);
      s.log.unshift({type:'defeat',target:defeated,reward});
    } else {
      s.hero.hp=Math.max(0,s.hero.hp-s.enemy.attack);
      if(s.hero.hp===0) {s.hero.hp=s.hero.maxHp;s.log.unshift({type:'recover'});}
    }
    this.emit();return true;
  }
  emit(){this.onChange(structuredClone(this.state));}
}
