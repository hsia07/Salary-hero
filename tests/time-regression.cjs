// Core regression checklist (run with Node.js)
const assert = require('node:assert/strict');
const weekday=(y,m,d)=>new Date(Date.UTC(y,m-1,d)).getUTCDay();
const weekdays=(y,m)=>{let n=0;for(let d=1;d<=new Date(Date.UTC(y,m,0)).getUTCDate();d++)if(![0,6].includes(weekday(y,m,d)))n++;return n};
const workMinutes=(a,b)=>{let total=0,cur=Math.floor((a+28800000)/86400000)*86400000-28800000;for(let i=0;cur<b&&i<380;i++,cur+=86400000){const w=new Date(cur+28800000).getUTCDay();if(w===0||w===6)continue;total+=Math.max(0,Math.min(b,cur+17*3600000)-Math.max(a,cur+8*3600000))/60000}return total};
const ms=s=>Date.parse(s);const close=(a,b)=>assert.ok(Math.abs(a-b)<.01,a+' != '+b);
assert.equal(weekday(2026,11,1),0);
assert.equal(weekdays(2026,11),21);
assert.equal(weekdays(2026,12),23);
close(workMinutes(ms('2026-11-02T00:00:00Z'),ms('2026-11-02T09:00:00Z')),540);
close(workMinutes(ms('2026-11-07T00:00:00Z'),ms('2026-11-09T00:00:00Z')),0);
close(workMinutes(ms('2026-11-06T08:00:00Z'),ms('2026-11-09T02:00:00Z')),180);
console.log('Core time regression checks passed');
