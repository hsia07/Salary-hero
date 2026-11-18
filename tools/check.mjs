#!/usr/bin/env node
// 一次跑完：語法檢查 + 全部單元測試 + 舊 game.js 回歸。用法：node tools/check.mjs [--quick]
// --quick 只跑語法檢查與 v19/tests 單元測試，略過 .cjs 回歸。
// 輸出只有摘要與失敗明細，方便 AI 省 token。
import {readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const quick=process.argv.includes('--quick');
const ls=(dir,re)=>readdirSync(join(root,dir)).filter(f=>re.test(f)).map(f=>join(dir,f));
const run=(args)=>spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
const fails=[];

// 1. 語法
const syntax=[...ls('v19',/\.mjs$/),...ls('tests',/\.(mjs|cjs)$/),...ls('.',/\.js$/),...ls('tools',/\.mjs$/)];
let bad=0;
for(const f of syntax){const r=run(['--check',f]);if(r.status!==0){bad++;fails.push(`SYNTAX ${f}\n${(r.stderr||'').split('\n').slice(0,4).join('\n')}`);}}
console.log(`語法  ${syntax.length-bad}/${syntax.length} OK`);

// 2. 單元測試（逐檔跑，避免 node --test 目錄參數在 Windows/Node24 失效）
for(const dir of ['tests','v19']){
 let pass=0,fail=0,files=0;
 for(const f of ls(dir,/\.test\.mjs$/)){
  files++;const r=run(['--test',f]);const out=r.stdout+r.stderr;
  const p=+(out.match(/ℹ pass (\d+)/)||[0,0])[1],x=+(out.match(/ℹ fail (\d+)/)||[0,1])[1];
  pass+=p;fail+=x;
  if(r.status!==0||x)fails.push(`TEST ${f}\n`+out.split('\n').filter(l=>/✖|Error|expected|actual/.test(l)).slice(0,8).join('\n'));
 }
 console.log(`${dir.padEnd(5)} ${files} 檔  pass ${pass}  fail ${fail}`);
}

// 3. 舊 game.js 回歸（CI 沒跑，這裡補上）
if(!quick){
 for(const f of ls('tests',/-regression\.cjs$/)){
  const r=run([f]);
  console.log(`${r.status===0?'PASS':'FAIL'}  ${f}`);
  if(r.status!==0)fails.push(`REGRESSION ${f}\n${(r.stderr||'').split('\n').filter(Boolean).slice(-4).join('\n')}`);
 }
}

if(fails.length){console.log('\n── 失敗明細 ──\n'+fails.join('\n\n'));process.exit(1);}
console.log('\nALL GREEN');
