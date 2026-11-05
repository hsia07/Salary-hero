// V18 production art loader: fail closed. No screenshot or geometric sprite fallback.
const ROOT=new URL('../',import.meta.url);
const IMAGE_EXT=/\.(?:png|webp)$/i;
function collect(node,prefix='',out=[]) {
  if(typeof node==='string'&&IMAGE_EXT.test(node))out.push({key:prefix,path:node});
  else if(node&&typeof node==='object')for(const [key,value]of Object.entries(node)){
    if(key==='status'||key==='referenceOnly')continue;
    collect(value,prefix?prefix+'.'+key:key,out);
  }
  return out;
}
export function declaredAssets(manifest) {
  if(!manifest?.renderPolicy?.neverUseReferenceAsBattleBackground)throw Error('Unsafe art policy');
  const assets=collect(manifest.assets);
  const unique=new Set(assets.map(x=>x.path));
  if(unique.size!==assets.length)throw Error('Duplicate runtime asset paths');
  if(assets.some(x=>x.path===manifest.referenceOnly))throw Error('Master reference cannot be runtime art');
  if(assets.some(x=>!x.path.startsWith('art/v18/runtime/')))throw Error('Runtime art outside isolated directory');
  return assets;
}
export async function preloadArt({manifestUrl=new URL('../art/v18/runtime-manifest.json',import.meta.url),fetcher=fetch,decoder=async blob=>createImageBitmap(blob)}={}) {
  const response=await fetcher(manifestUrl,{cache:'no-store'});
  if(!response.ok)throw Error('Manifest unavailable: '+response.status);
  const manifest=await response.json();
  const entries=declaredAssets(manifest);
  const images=new Map();
  try {
    for(const entry of entries){
      const url=new URL(entry.path,ROOT);
      const file=await fetcher(url,{cache:'no-store'});
      if(!file.ok)throw Error('Missing art '+entry.path+' ('+file.status+')');
      const bitmap=await decoder(await file.blob());
      if(!bitmap?.width||!bitmap?.height)throw Error('Invalid art dimensions: '+entry.path);
      images.set(entry.key,bitmap);
    }
    return {manifest,images,dispose(){for(const img of images.values())img.close?.();images.clear()}};
  }catch(error){
    for(const img of images.values())img.close?.();
    images.clear();throw error;
  }
}
