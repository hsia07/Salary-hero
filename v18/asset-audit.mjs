/**
 * V18 art gate: inspect real files, never treat a reference screenshot as a runtime sprite.
 * Browser-side image decoding and sampled alpha checks are best-effort preflight,
 * not substitutes for human visual review of baked-in characters.
 */
export async function auditAssets(manifestUrl='../art/v18/runtime-manifest.json') {
  const response=await fetch(manifestUrl,{cache:'no-store'});
  if(!response.ok)throw new Error('Manifest HTTP '+response.status);
  const manifest=await response.json();
  const entries=[];
  const walk=(node,key='')=>{
    if(typeof node==='string' && /\.(png|webp)$/i.test(node)) entries.push({key,path:node});
    else if(node && typeof node==='object') for(const [k,v] of Object.entries(node)){
      if(k==='status'||k==='referenceOnly')continue;
      walk(v,key?key+'.'+k:k);
    }
  };
  walk(manifest.assets);
  const results=await Promise.all(entries.map(async ({key,path})=>{
    const url=new URL('../'+path,import.meta.url);
    try {
      const r=await fetch(url,{cache:'no-store'});
      if(!r.ok)return {key,path,ok:false,reason:'HTTP '+r.status};
      const blob=await r.blob();
      const bitmap=await createImageBitmap(blob);
      let alpha='not-required';
      if(!key.toLowerCase().includes('background')){
        const c=document.createElement('canvas');c.width=32;c.height=32;
        const ctx=c.getContext('2d',{willReadFrequently:true});
        if(!ctx){bitmap.close();return {key,path,ok:false,reason:'Canvas unavailable'};}
        ctx.clearRect(0,0,32,32);ctx.drawImage(bitmap,0,0,32,32);
        const px=ctx.getImageData(0,0,32,32).data;
        let transparent=0;for(let i=3;i<px.length;i+=4)if(px[i]<250)transparent++;
        alpha=transparent>0?'sampled-transparent':'opaque-sample';
      }
      const width=bitmap.width,height=bitmap.height;bitmap.close();
      return {key,path,ok:alpha!=='opaque-sample',width,height,alpha,reason:alpha==='opaque-sample'?'No transparency detected in sample':'loaded'};
    } catch(e){return {key,path,ok:false,reason:String(e.message||e)};}
  }));
  return {manifestVersion:manifest.version,ready:results.length>0&&results.every(x=>x.ok),results};
}
