#!/usr/bin/env node
// Reusable CI importer: decodes connector-committed base64 payloads into runtime art.
// Does not fabricate missing images. Run with: node tools/v18-import-art-bundle.mjs
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,dirname,resolve} from 'node:path';
const root=resolve(process.cwd());
const staging=join(root,'art/v18/staging');
const manifest=JSON.parse(await readFile(join(staging,'manifest.json'),'utf8'));
if(!Array.isArray(manifest.files)||!manifest.files.length)throw Error('No staged files');
const seen=new Set();
for(const item of manifest.files){
 const {path,sha256,parts}=item;
 if(typeof path!=='string'||!/^art\/v18\/runtime\/[a-z0-9/_-]+\.webp$/.test(path)||path.includes('..'))throw Error('Unsafe output path: '+path);
 if(seen.has(path))throw Error('Duplicate output: '+path);seen.add(path);
 if(!/^[0-9a-f]{64}$/.test(sha256)||!Number.isSafeInteger(parts)||parts<1||parts>100)throw Error('Invalid manifest entry: '+path);
 const id=createHash('sha256').update(path).digest('hex').slice(0,16);
 const chunks=[];
 for(let i=0;i<parts;i++){
  const chunk=(await readFile(join(staging,id+'.'+String(i).padStart(3,'0')+'.b64'),'utf8')).trim();
  if(!/^[A-Za-z0-9+/=]+$/.test(chunk))throw Error('Invalid base64 chunk');
  chunks.push(chunk);
 }
 const bytes=Buffer.from(chunks.join(''),'base64');
 if(bytes.length<32||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Not WebP: '+path);
 if(createHash('sha256').update(bytes).digest('hex')!==sha256)throw Error('SHA mismatch: '+path);
 const dest=join(root,path);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);
 console.log('Imported '+path+' ('+bytes.length+' bytes)');
}
