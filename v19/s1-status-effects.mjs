/**
 * Salary Hero — status effects and numeric interactions.
 * Pure state engine: no DOM, audio, or browser dependencies.
 * Times are battle-clock milliseconds (pause / speed are controlled by caller).
 */
export const STATUS_DEFS = Object.freeze({
  stun: {name:"過勞昏迷",kind:"debuff",duration:2200,icon:"stun-stars.svg",detail:"行動完全中斷"},
  slow: {name:"週一開機失敗",kind:"debuff",duration:4400,icon:"slow-clock.svg",detail:"行動速度 -50%"},
  paycut: {name:"薪水延遲入帳",kind:"debuff",duration:5200,icon:"payroll-drain.svg",detail:"受到治療 -50%"},
  burn: {name:"加班火燒屁股",kind:"debuff",duration:5000,icon:"overtime-fire.svg",detail:"每秒受到 4 HP 傷害"},
  coffee: {name:"咖啡因續命",kind:"buff",duration:6200,icon:"coffee-spiral.svg",detail:"攻速 +50%，解除過勞與週一病"},
  shield: {name:"準時下班結界",kind:"buff",duration:6500,icon:"clockout-shield.svg",detail:"受到傷害 -35%，抵擋一次暈眩"},
  rally: {name:"同事情義相挺",kind:"buff",duration:7000,icon:"team-morale.svg",detail:"攻擊 +25%，搭配咖啡再 +10%"},
});
export class StatusEngine {
  constructor(count=7) {
    if (!Number.isInteger(count)||count<1)throw new Error("invalid team size");
    this.now=0;
    this.slots=Array.from({length:count},()=>new Map());
  }
  check(i){if(!Number.isInteger(i)||i<0||i>=this.slots.length)throw new RangeError("invalid party slot")}
  has(i,id){this.check(i);const effect=this.slots[i].get(id);return Boolean(effect&&effect.expires>this.now)}
  list(i){
    this.check(i);
    return [...this.slots[i]].filter(([id,e])=>e.expires>this.now)
      .map(([id,e])=>({id,name:STATUS_DEFS[id].name,kind:STATUS_DEFS[id].kind,icon:STATUS_DEFS[id].icon,remaining:Math.max(0,e.expires-this.now)}));
  }
  clear(i,id){this.check(i);return this.slots[i].delete(id)}
  clearAll(){this.now=0;this.slots.forEach(m=>m.clear())}
  apply(i,id,duration=STATUS_DEFS[id]?.duration){
    this.check(i);
    if(!STATUS_DEFS[id])throw new Error("unknown status "+id);
    if(!Number.isFinite(duration)||duration<=0)throw new Error("invalid status duration");
    const slot=this.slots[i],events=[];
    if(id==='stun'&&this.has(i,'shield')){
      const shield=slot.get('shield');
      if(!shield.stunBlocked){shield.stunBlocked=true;return{applied:false,blockedBy:'shield',events:['準時下班結界擋下過勞']}}
    }
    if(id==='coffee'){
      for(const debuff of ['stun','slow'])if(slot.delete(debuff))events.push('咖啡因解除'+STATUS_DEFS[debuff].name);
    }
    if(id==='stun'&&this.has(i,'burn')){
      duration*=1.5;events.push('加班火燒屁股＋過勞：暈眩時間 +50%');
    }
    const previous=slot.get(id);
    slot.set(id,{expires:Math.max(previous?.expires||0,this.now+duration),nextTick:previous?.nextTick||this.now+1000,stunBlocked:previous?.stunBlocked||false});
    if(id==='rally'&&this.has(i,'coffee'))events.push('團隊鼓舞＋咖啡因：攻擊再 +10%');
    if(id==='coffee'&&this.has(i,'rally'))events.push('咖啡因＋同事情義相挺：攻擊再 +10%');
    return{applied:true,duration,events};
  }
  modifiers(i){
    this.check(i);
    const coffee=this.has(i,'coffee'),rally=this.has(i,'rally'),shield=this.has(i,'shield');
    return{
      canAct:!this.has(i,'stun'),
      speed: (coffee?1.5:1)*(this.has(i,'slow')?.5:1),
      attack:(rally?1.25:1)*(coffee&&rally?1.08:1),
      damageTaken:shield?.65:1,
      healingReceived:this.has(i,'paycut')?.5:1,
      burnPerSecond:this.has(i,'burn')?4*(this.has(i,'stun')?1.5:1):0
    };
  }
  attack(i,base){return Math.round(base*this.modifiers(i).attack*100)/100}
  incoming(i,base){return Math.round(base*this.modifiers(i).damageTaken*100)/100}
  healing(i,base){return Math.round(base*this.modifiers(i).healingReceived*100)/100}
  advance(ms){
    if(!Number.isFinite(ms)||ms<0||ms>30000)throw new Error("invalid battle time step");
    const until=this.now+ms,events=[];
    this.slots.forEach((slot,i)=>{
      const burn=slot.get('burn');
      if(burn)while(burn.nextTick<=until&&burn.nextTick<burn.expires){
        // Test stun and shield at burn tick time, not the end of this frame.
        const active=(id)=>{const s=slot.get(id);return Boolean(s&&s.expires>burn.nextTick)};
        const dmg=4*(active('stun')?1.5:1)*(active('shield')?.65:1);
        events.push({slot:i,type:'dot',id:'burn',damage:Math.round(dmg*100)/100,time:burn.nextTick});
        burn.nextTick+=1000;
      }
      for(const [id,e] of slot)if(e.expires<=until)slot.delete(id);
    });
    this.now=until;
    return events;
  }
}