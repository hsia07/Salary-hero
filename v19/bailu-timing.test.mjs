import test from 'node:test';import assert from 'node:assert/strict';
import {BAILU_ATTACK_MS,BAILU_ATTACK_TOTAL_MS,bailuFrameAt,bailuLungeAt,BAILU_IMPACT_MS,BAILU_LUNGE_PX} from './bailu-timing.mjs';
test('白律七格非等速、總長與薪奴不同但同級',()=>{assert.equal(BAILU_ATTACK_MS.length,7);assert.ok(new Set(BAILU_ATTACK_MS).size>4);assert.ok(BAILU_ATTACK_TOTAL_MS>700&&BAILU_ATTACK_TOTAL_MS<1000);});
test('逐格硬切與結束回待機',()=>{assert.equal(bailuFrameAt(0),0);assert.equal(bailuFrameAt(BAILU_IMPACT_MS),4);assert.equal(bailuFrameAt(BAILU_ATTACK_TOTAL_MS+1),-1);});
test('命中時突進到位、結束時回原位',()=>{assert.equal(bailuLungeAt(BAILU_IMPACT_MS+10),BAILU_LUNGE_PX);assert.equal(bailuLungeAt(BAILU_ATTACK_TOTAL_MS),0);assert.ok(bailuLungeAt(300)<0);});
