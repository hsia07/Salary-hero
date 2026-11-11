/* Salary Hero V20 P0.8: scene lighting that lives BETWEEN the background
 * and character sprites. Pure visual effect; never mutates combat or salary.
 * Reference painting cannot be a flattened interactive screenshot.
 */
const TAU = Math.PI * 2;
function clamp01(v){return Math.max(0,Math.min(1,v));}
export function v20LightAt(ms,reducedMotion=false){
 const t=Number.isFinite(Number(ms))?Math.max(0,Number(ms))/1000:0;
 if(reducedMotion)return {moon:.20,amber:.20,drift:0,phase:0};
 return {
  moon:.19+.038*Math.sin(t*.82),
  amber:.20+.043*Math.sin(t*.56+1.1),
  drift:Math.sin(t*.36)*8,
  phase:t
 };
}
function radial(ctx,x,y,r,col,alpha){
 const g=ctx.createRadialGradient(x,y,1,x,y,r);
 g.addColorStop(0,col);
 g.addColorStop(1,'rgba(0,0,0,0)');
 ctx.globalAlpha=alpha;
 ctx.fillStyle=g;
 ctx.fillRect(x-r,y-r,r*2,r*2);
}
export function drawV20FloorAtmosphere(ctx,ms,{reducedMotion=false}={}){
 if(!ctx||typeof ctx.save!=='function')return;
 const p=v20LightAt(ms,reducedMotion);
 ctx.save();
 try{
  // The visible ground is the lower perspective plane. NEVER paint over
  // the windows, actors, their attack frames, battle text or real DOM buttons.
  ctx.beginPath();ctx.moveTo(0,434);
  ctx.bezierCurveTo(195,391,500,394,720,433);
  ctx.lineTo(720,620);ctx.lineTo(0,620);ctx.closePath();ctx.clip();
  ctx.globalCompositeOperation='screen';
  radial(ctx,360+p.drift,526,224,'rgba(160,193,255,1)',p.moon);
  radial(ctx,120,565,156,'rgba(255,177,97,1)',p.amber);
  radial(ctx,592,555,161,'rgba(255,188,118,1)',p.amber*.95);
  radial(ctx,375-p.drift*.65,602,163,'rgba(178,106,238,1)',.14);
  // Moonlight glances off the uneven painted tile, not a repeated flat grid.
  for(let i=0;i<11;i++){
   const row=Math.floor(i/3),x=70+(i*199%585);
   const y=453+row*42+(i%3)*19;
   const drift=reducedMotion?0:Math.sin(p.phase*.46+i*1.72)*4;
   const len=12+(i%4)*9;
   const a=.12+(i%3)*.043;
   ctx.globalAlpha=a;
   ctx.lineWidth=i%3===0?2.1:1.1;
   ctx.strokeStyle=i%4===0?'#d0e4ff':'#ffdeb0';
   ctx.beginPath();ctx.moveTo(x+drift,y);
   ctx.quadraticCurveTo(x+len*.56,y-2.6,x+len,y+.7);
   ctx.stroke();
  }
  // Slowly drifting reflected stars across the *floor* only.
  for(let i=0;i<7;i++){
   const cycle=p.phase*.11+i*.157;
   const v=cycle-Math.floor(cycle);
   const x=85+i*87+Math.sin(p.phase*.18+i)*7;
   const y=456+(i%4)*33+v*26;
   const size=1.4+i%3;
   ctx.globalAlpha=(.11+.13*(1-Math.abs(v-.5)*2));
   ctx.strokeStyle=i%2?'#fbe0b3':'#d0c8ff';
   ctx.lineWidth=.8;
   ctx.beginPath();ctx.moveTo(x-size*2,y);ctx.lineTo(x+size*2,y);
   ctx.moveTo(x,y-size*2);ctx.lineTo(x,y+size*2);ctx.stroke();
  }
 }finally{ctx.restore();}
}
