/**
 * V20 P0.9 battle staging.
 * Coordinates use the existing 720×620 logical Canvas. The real DOM
 * controls occupy the outer left/right rails, so art stays in the center.
 * This module NEVER changes encounter, damage, inventory or save state.
 */
export const BATTLE_STAGE = Object.freeze({
  width:720,height:620,groundY:525,
  heroHomeX:116,heroTrainingX:100,
  normalEnemyX:334,eliteEnemyX:320,bossEnemyX:299,
  enemyTrainingX:458
});
export function v20CombatAnchors({training=false,boss=false,elite=false}={}){
  return Object.freeze({
    heroX:training?BATTLE_STAGE.heroTrainingX:BATTLE_STAGE.heroHomeX,
    enemyX:training?BATTLE_STAGE.enemyTrainingX
       :boss?BATTLE_STAGE.bossEnemyX
       :elite?BATTLE_STAGE.eliteEnemyX
       :BATTLE_STAGE.normalEnemyX,
    floorY:BATTLE_STAGE.groundY
  });
}
export function v20EnemyArtBounds({boss=false,elite=false,training=false}={}){
  const a=v20CombatAnchors({boss,elite,training});
  const boxW=boss?214:elite?194:177;
  const artW=boss?316:elite?295:282;
  return {
    left:a.enemyX+(boxW-artW)/2,
    right:a.enemyX+(boxW+artW)/2,
    center:a.enemyX+boxW/2
  };
}
/**
 * Soft, elliptical contact shadows anchored to actual feet. Draw BEFORE
 * the independently animated actor sprites. Uses only fill primitives,
 * never a fake sprite wobble or a baked screenshot.
 */
export function drawV20ContactShadow(ctx,x,groundY,{width=86,opacity=1}={}){
  if(!ctx||typeof ctx.save!=='function')return;
  const cx=Number.isFinite(x)?x:360,cy=Number.isFinite(groundY)?groundY:525;
  const rx=Math.max(24,Math.min(142,Number(width)||86));
  const alpha=Math.max(0,Math.min(1,Number(opacity)||0));
  ctx.save();
  try{
    ctx.translate(cx,cy);
    // Wide diffuse shadow. Two small transparent radii retain the floor art.
    ctx.save();ctx.scale(rx*1.38,20);
    const diffuse=ctx.createRadialGradient(0,0,0,0,0,1);
    diffuse.addColorStop(0,'rgba(22,12,37,.43)');
    diffuse.addColorStop(.64,'rgba(27,15,45,.24)');
    diffuse.addColorStop(1,'rgba(24,15,40,0)');
    ctx.globalAlpha=alpha*.67;
    ctx.fillStyle=diffuse;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Ground contact band: feet read as attached to the detailed perspective.
    ctx.save();ctx.scale(rx*.77,8);
    const contact=ctx.createRadialGradient(0,0,0,0,0,1);
    contact.addColorStop(0,'rgba(14,11,26,.83)');
    contact.addColorStop(.54,'rgba(30,20,44,.52)');
    contact.addColorStop(1,'rgba(30,20,44,0)');
    ctx.globalAlpha=alpha*.79;
    ctx.fillStyle=contact;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Tiny amber floor edge catches warm lantern light without fake motion.
    ctx.globalAlpha=alpha*.21;ctx.strokeStyle='#ffdeb0';ctx.lineWidth=1.35;
    ctx.beginPath();ctx.ellipse(0,3,rx*.72,7,0,.18,Math.PI-.18);ctx.stroke();
  }finally{ctx.restore();}
}
