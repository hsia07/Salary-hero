import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMON_ENEMIES,ELITE_ENEMIES,BOSSES,ALL_ENEMIES} from './roster.mjs';
import {NORMAL_VARIANT_PREVIEWS,ORIGINAL_MONSTER_COUNT,normalVariantFor,validateNormalVariants,drawNormalVariantFrame} from './monster-variants.mjs';

test('original 32 species and boss/elite IDs are immutable while normal skin previews are separate',()=>{
 assert.equal(ORIGINAL_MONSTER_COUNT,32);
 assert.equal(ALL_ENEMIES.length,32);
 assert.equal(COMMON_ENEMIES.length,16);
 assert.equal(ELITE_ENEMIES.length,8);
 assert.equal(BOSSES.length,8);
 assert.equal(new Set(ALL_ENEMIES.map(e=>e.id)).size,32);
 assert.equal(validateNormalVariants().length,0);
 assert.ok(NORMAL_VARIANT_PREVIEWS.length>=4);
 for(const skin of NORMAL_VARIANT_PREVIEWS){
  assert.equal(skin.approved,false);
  assert.equal(skin.previewOnly,true);
  assert.ok(COMMON_ENEMIES.some(e=>e.id===skin.baseTypeId));
  assert.ok(!ALL_ENEMIES.some(e=>e.id===skin.id));
 }
});
test('only an actually loaded approved ordinary base enables any recolor rehearsal',()=>{
 const approved=['paper-gremlin','coffee-mimic'];
 assert.equal(normalVariantFor('paper-gremlin','midnight-ink',[]),null);
 assert.equal(normalVariantFor('chair-golem','midnight-ink',[...approved,'chair-golem']),null);
 assert.equal(normalVariantFor('paper-gremlin','missing',approved),null);
 assert.equal(normalVariantFor('audit-knight','midnight-ink',['audit-knight']),null);
 assert.equal(normalVariantFor('printer-overlord','midnight-ink',['printer-overlord']),null);
 const skin=normalVariantFor('paper-gremlin','midnight-ink',approved);
 assert.equal(skin.baseTypeId,'paper-gremlin');
 assert.match(skin.name,/夜班/);
 assert.equal(normalVariantFor('coffee-mimic','midnight-ink',approved),null);
 assert.match(normalVariantFor('coffee-mimic','moon-coffee',approved).name,/月光/);
});
test('invalid replacements and accidental boss/elite palette swaps are rejected',()=>{
 assert.ok(validateNormalVariants([
  {...NORMAL_VARIANT_PREVIEWS[0],baseTypeId:'audit-knight'},
  {...NORMAL_VARIANT_PREVIEWS[0],id:'midnight-ink'},
  {...NORMAL_VARIANT_PREVIEWS[0],approved:true}
 ]).some(x=>x.includes('not a common')));
});
test('palette scope is local and does not replace any original attack/defeat frame',()=>{
 const draws=[];
 const ctx={
  filter:'none',
  save(){this.lastFilter=this.filter;draws.push('save')},
  restore(){this.filter=this.lastFilter;draws.push('restore')},
  drawImage(...args){draws.push({args,filter:this.filter})}
 };
 const image={naturalWidth:5*384,naturalHeight:384};
 const frame={cell:384,frames:5,durations:[145,155,75,115,160]};
 const variant=NORMAL_VARIANT_PREVIEWS[0];
 assert.equal(drawNormalVariantFrame(ctx,image,frame,1,2,282,282,309,false,variant),true);
 const draw=draws.find(x=>typeof x==='object');
 assert.equal(draw.args[1],2*384,'third frame remains real source frame');
 assert.match(draw.filter,/hue-rotate/);
 assert.equal(ctx.filter,'none','no palette pollution of hero, background, HUD');
 assert.equal(drawNormalVariantFrame(ctx,image,frame,1,2,282,282,309,false),true);
 assert.equal(draws.filter(x=>typeof x==='object').at(-1).filter,'none');
 assert.equal(drawNormalVariantFrame(ctx,image,{...frame,frames:4},1,2,282,282,309,false,variant),false);
 assert.equal(ctx.filter,'none','style is restored even when frame validation fails');
});
