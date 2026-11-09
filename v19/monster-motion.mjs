/* Salary Hero V19.2 — independent procedural monster actors, not emoji stand-ins.
 * Every species has its own anatomy, attack timing/profile, injury, defeat and element FX.
 * This is the playable vector-animation pass; approved hand-illustrated frame art is separate. */
const RAW=[
 ['paper-gremlin','sheet','fling','flutter','scatter','paper'],
 ['coffee-mimic','cup','splash','sloshing','shatter','coffee'],
 ['chair-golem','guardbot','charge','sparks','collapse','steel'],
 ['meeting-ghost','alienclerk','blinkshot','phase','dissolve','plasma'],
 ['deadline-clock','cloud','pulse','glitch','pixel','binary'],
 ['keyboard-piranha','ghostclerk','haunt','shiver','dissolve','spirit'],
 ['lunch-box','lunch','toss','spill','collapse','soup'],
 ['file-crab','shrimp','pinch','recoil','scatter','water'],
 ['security-eye','pencil','stamp','bend','scatter','redink'],
 ['wifi-slime','bug','virus','glitch','pixel','binary'],
 ['stamp-monster','keybeast','bite','sparks','collapse','steel'],
 ['printer-minion','marsbee','sting','flutter','scatter','plasma'],
 ['report-plant','moonrabbit','potion','shiver','dissolve','moon'],
 ['alien-intern','skeleton','bone','rattle','scatter','bone'],
 ['robot-auditor','sandporter','sandwave','bend','dissolve','sand'],
 ['night-moth','monkey','staff','recoil','scatter','gold'],
 ['audit-knight','manager','redslash','bend','scatter','redink'],
 ['espresso-demon','espresso','rapidshot','sloshing','shatter','coffee'],
 ['deadline-hunter','erlang','trident','recoil','dissolve','lightning'],
 ['shredder-mantis','mantis','dualblade','sparks','collapse','steel'],
 ['presentation-siren','starwolf','beam','phase','dissolve','plasma'],
 ['overtime-hound','hound','pounce','recoil','dissolve','hellfire'],
 ['server-lich','lich','drain','glitch','pixel','binary'],
 ['clockwork-samurai','yaksha','whirltrident','bend','scatter','water'],
 ['printer-overlord','printer','storm','sparks','collapse','paper'],
 ['hr-queen','foodcart','banquet','spill','shatter','soup'],
 ['deadline-dragon','wukong','staffstorm','recoil','scatter','gold'],
 ['attendance-titan','titan','quake','sparks','collapse','steel'],
 ['office-ai','mainframe','judgment','glitch','pixel','binary'],
 ['alien-manager','ufo','abduct','phase','dissolve','plasma'],
 ['overtime-reaper','reaper','reap','shiver','dissolve','spirit'],
 ['meeting-hydra','dragonking','tidal','recoil','dissolve','water']
];
export const MONSTER_ANIMATIONS=Object.freeze(Object.fromEntries(RAW.map(([id,anatomy,attack,hurt,defeat,element],index)=>
 [id,Object.freeze({id,anatomy,attack,hurt,defeat,element,index})])));
export function monsterVisualFor(enemy){return MONSTER_ANIMATIONS[typeof enemy==='string'?enemy:(enemy?.typeId||enemy?.id)]||MONSTER_ANIMATIONS['paper-gremlin'];}
export const MONSTER_STATES=Object.freeze(['idle','attack','hurt','defeat','special']);
export function monsterAnimationState(enemy,attackElapsedMs,result){
 if(!result)return {state:'idle',progress:0};
 const elapsed=Number(attackElapsedMs);
 if(!Number.isFinite(elapsed)||elapsed<0)return {state:'idle',progress:0};
 if(result.type==='victory'){
   if(elapsed<405)return {state:'idle',progress:0};
   if(elapsed<895)return {state:'defeat',progress:Math.min(1,(elapsed-405)/490)};
   return {state:'idle',progress:0};
 }
 if(elapsed>=405&&elapsed<805)return {state:'hurt',progress:(elapsed-405)/400};
 if(elapsed>=805&&elapsed<1370&&result.retaliationDamage>0){
   return {state:result.enemySkill?'special':'attack',progress:(elapsed-805)/565};
 }
 return {state:'idle',progress:0};
}
const TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
function ellipse(c,x,y,rx,ry,fill,stroke=null,lw=3){
 c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);
 if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}
}
function box(c,x,y,w,h,r,fill,stroke='#231a35',lw=4){
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}
}
function line(c,pts,color='#2a243c',lw=6){
 c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 c.strokeStyle=color;c.lineWidth=lw;c.lineJoin='round';c.lineCap='round';c.stroke();
}
function poly(c,pts,fill,stroke='#2e203e',lw=3){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function face(c,eye='#fff9d6',pupil='#30213b',y=91){
 ellipse(c,76,y,11,13,eye);ellipse(c,121,y,11,13,eye);
 ellipse(c,79,y+1,5,7,pupil);ellipse(c,124,y+1,5,7,pupil);
 line(c,[[89,y+33],[102,y+38],[113,y+33]],'#30213b',4);
}
function legs(c,fill='#32213c'){
 line(c,[[70,172],[60,210]],fill,14);line(c,[[125,172],[136,210]],fill,14);
 ellipse(c,53,215,21,9,'#2c213e');ellipse(c,142,215,21,9,'#2c213e');
}
function badge(c,label,fill='#d8b368'){box(c,87,115,28,23,5,fill,'#2e203e',2);line(c,[[100,115],[100,106]],'#ede5e0',2);line(c,[[95,128],[105,128]],'#422b46',2);}
function hand(c,x,y,color='#e5caaa'){ellipse(c,x,y,13,12,color,'#2d213e',2);}
function stem(c){line(c,[[100,38],[100,15]],'#7a688e',7);ellipse(c,100,12,9,9,'#fbe6a2','#4f345b');}
function head(c,fill,stroke='#31213a'){ellipse(c,99,87,62,56,fill,stroke,5);}
function humanoid(c,fill,coat='#594160'){
 legs(c,coat);box(c,55,113,88,78,23,coat);ellipse(c,99,74,51,48,fill,'#34243f',5);
 line(c,[[60,128],[33,162]],coat,15);line(c,[[139,128],[168,162]],coat,15);hand(c,33,163,fill);hand(c,169,163,fill);face(c);
}
function drawAnatomy(c,enemy,m,t){
 const glow=enemy?.accent||'#f0c58a';
 const role=enemy?.tier||'normal';
 switch(m.anatomy){
 case 'sheet':
   legs(c,'#e0c6a1');poly(c,[[41,38],[133,38],[158,65],[158,182],[41,182]],'#fff3d7','#6e5165',6);
   poly(c,[[133,38],[133,66],[158,65]],'#d7c6b6','#6e5165',3);
   line(c,[[54,115],[33,131],[25,113]],'#e2c7a3',11);line(c,[[149,116],[174,125],[181,105]],'#e2c7a3',11);
   face(c,'#fff','#654565',95);for(let i=0;i<3;i++)line(c,[[65,135+i*14],[134,135+i*14]],'#b79b9b',3);break;
 case 'pencil':
   humanoid(c,'#bb91b7','#8c3e56');poly(c,[[75,28],[89,4],[105,30]],'#edc0a1');poly(c,[[111,26],[129,6],[141,34]],'#ff7878');
   line(c,[[164,146],[183,24]],'#be4f5a',14);poly(c,[[174,25],[192,23],[187,5]],'#e8d5ac');badge(c);break;
 case 'manager':
   humanoid(c,'#dfb88d','#5b3446');poly(c,[[70,111],[100,158],[129,111]],'#fff2db');
   line(c,[[99,120],[106,162]],'#c3404c',10);box(c,150,90,25,69,5,'#b74259');box(c,145,90,37,12,4,'#f3cb82');
   poly(c,[[56,54],[66,25],[140,25],[151,59]],'#49314a');face(c,'#fff7dc','#421c32',89);break;
 case 'printer':
   legs(c,'#808698');box(c,27,76,146,121,17,'#8d99a6','#3a3e57',7);box(c,38,34,123,75,12,'#d1cfcc','#56526a',6);
   box(c,51,7,96,48,7,'#f8e5c5','#756b73',4);line(c,[[62,19],[138,19]],'#9d8288',4);
   box(c,49,126,101,34,5,'#44344d');ellipse(c,75,141,16,10,'#f5ad73');ellipse(c,124,141,16,10,'#f5ad73');
   poly(c,[[70,165],[131,165],[118,226],[78,226]],'#f7e5c6');line(c,[[29,145],[6,113]],'#9697a9',15);break;
 case 'cup':
   legs(c,'#654149');box(c,42,75,111,105,20,'#d6ba9f','#694a56',6);line(c,[[148,98],[173,105],[171,141],[153,150]],'#ded0bb',13);
   ellipse(c,98,78,57,16,'#5e353b','#d6aa93',6);face(c,'#fff9dc','#322538',119);
   for(let i=0;i<3;i++)line(c,[[68+i*28,60],[62+i*30,45],[72+i*25,23]],'#e8d0bc',4);break;
 case 'lunch':
   legs(c,'#b77c63');box(c,34,78,133,100,13,'#efe0b5','#774855',6);box(c,41,105,118,50,5,'#c7787a','#674457',3);
   ellipse(c,100,74,68,19,'#9b454b','#f4d0a3',5);ellipse(c,80,67,15,9,'#e6c86e');ellipse(c,114,70,16,9,'#9fbf73');
   face(c,'#fff4e4','#472e45',121);line(c,[[40,100],[19,135]],'#b97870',10);break;
 case 'espresso':
   legs(c,'#774657');
   for(let i=0;i<3;i++){const xx=61+i*37,yy=84+(i%2)*7;
     box(c,xx-24,yy,51,91,8,i===1?'#a85253':'#d79a77','#482d43',4);
     ellipse(c,xx,yy,26,10,'#61332d','#e7b2a2',3);}
   face(c,'#fff1c9','#382238',121);line(c,[[46,52],[35,21],[51,4]],'#d6ae8f',5);
   line(c,[[154,52],[171,21],[155,4]],'#d6ae8f',5);break;
 case 'foodcart':
   box(c,22,93,157,98,12,'#ce875e','#5c3a4d',7);box(c,27,113,147,46,7,'#fae2bb','#68455d',4);
   ellipse(c,53,198,22,22,'#44405b','#caa67a',6);ellipse(c,152,198,22,22,'#44405b','#caa67a',6);
   box(c,37,41,131,61,12,'#dfab72','#50354b',5);
   poly(c,[[37,42],[52,20],[151,20],[167,42]],'#f8dbc1');face(c,'#ffe1bc','#65394a',76);
   for(let i=0;i<3;i++)ellipse(c,62+i*35,41,12,15,['#d36c75','#f0cb79','#93b78b'][i]);break;
 case 'guardbot':
   legs(c,'#6b7389');box(c,53,105,99,88,20,'#687f9b','#36465f',5);
   box(c,55,27,91,85,12,'#b5b9c6','#40485c',6);box(c,67,59,68,32,5,'#242944','#8bd9ee',4);
   ellipse(c,82,73,8,8,'#f8a1a1');ellipse(c,116,73,8,8,'#f8a1a1');
   line(c,[[53,119],[22,151]],'#8491ad',15);line(c,[[148,119],[173,151]],'#8491ad',15);stem(c);break;
 case 'keybeast':
   legs(c,'#4f4c69');box(c,30,70,142,112,18,'#4e536f','#9da2b8',7);
   for(let i=0;i<3;i++)for(let j=0;j<2;j++)box(c,46+i*38,91+j*33,26,23,5,'#c0c6d2','#6c667d',2);
   ellipse(c,81,65,12,8,'#ff7985');ellipse(c,122,65,12,8,'#ff7985');
   line(c,[[37,125],[12,101]],'#7d8ba6',10);line(c,[[167,125],[190,98]],'#7d8ba6',10);break;
 case 'mantis':
   legs(c,'#579b91');ellipse(c,99,131,49,70,'#518b80','#304e56',5);
   poly(c,[[69,69],[97,12],[126,69]],'#8ac7a0','#304e56',5);ellipse(c,83,72,13,10,'#f7d58c');ellipse(c,116,72,13,10,'#f7d58c');
   line(c,[[62,122],[25,67],[7,84]],'#64aaa7',12);line(c,[[138,122],[176,66],[196,85]],'#64aaa7',12);
   poly(c,[[7,84],[51,70],[18,45]],'#d5edf0');poly(c,[[196,85],[149,70],[184,44]],'#d5edf0');break;
 case 'titan':
   legs(c,'#555c70');box(c,30,75,141,130,20,'#73798a','#374559',8);
   box(c,52,19,94,95,17,'#d7c0a1','#594c62',6);
   ellipse(c,99,68,37,37,'#f2dcac','#4c5464',5);
   line(c,[[99,68],[99,43]],'#413746',6);line(c,[[99,68],[121,73]],'#413746',5);
   line(c,[[41,114],[10,165]],'#8389a1',23);line(c,[[160,114],[190,165]],'#8389a1',23);break;
 case 'alienclerk':
   humanoid(c,'#88caac','#665182');ellipse(c,74,84,14,18,'#222944');ellipse(c,125,84,14,18,'#222944');stem(c);badge(c);break;
 case 'marsbee':
   ellipse(c,99,126,57,68,'#b0a2d0','#42354e',5);
   ellipse(c,51,94,31,47,'#b9e1ef9a','#7c91bd',3);ellipse(c,148,94,31,47,'#b9e1ef9a','#7c91bd',3);
   ellipse(c,99,65,49,42,'#9aba99','#3f5260',5);ellipse(c,81,67,12,14,'#292943');ellipse(c,118,67,12,14,'#292943');
   for(let i=0;i<3;i++)line(c,[[58,119+i*18],[139,119+i*18]],'#e7c06d',11);stem(c);break;
 case 'starwolf':
   humanoid(c,'#9da7c7','#38476c');poly(c,[[49,64],[48,7],[89,41]],'#687aa5');poly(c,[[109,39],[157,7],[151,62]],'#687aa5');
   box(c,69,81,61,16,4,'#22243b','#c1c6eb',2);line(c,[[89,145],[109,145]],'#e0c184',6);break;
 case 'ufo':
   ellipse(c,99,143,91,46,'#a4acba','#40425c',7);ellipse(c,100,111,62,47,'#98cfd0b3','#86f9d8',5);
   ellipse(c,99,103,35,39,'#80c39a','#35465b',5);ellipse(c,88,101,8,13,'#263849');ellipse(c,111,101,8,13,'#263849');
   for(let i=0;i<5;i++)ellipse(c,38+i*31,148,7,7,i%2?'#fdd08a':'#90f9ea');
   poly(c,[[60,170],[138,170],[175,227],[24,227]],'#f1c77b44',null);break;
 case 'cloud':
   ellipse(c,71,133,43,47,'#8a9bb9','#38475d',5);ellipse(c,123,114,53,56,'#96a7c9','#38475d',5);
   ellipse(c,104,158,62,41,'#788aac','#38475d',5);face(c,'#e4fbff','#3a4264',120);
   for(let i=0;i<5;i++)line(c,[[60+i*20,183],[50+i*22,196]],'#b2d6f2',4);break;
 case 'bug':
   ellipse(c,99,133,65,65,'#678e85','#30465a',5);ellipse(c,99,80,51,45,'#70a8a4','#30465a',5);stem(c);
   for(let i=0;i<3;i++){line(c,[[46,109+i*25],[16,91+i*31]],'#9bbcb3',8);line(c,[[153,109+i*25],[184,91+i*31]],'#9bbcb3',8);}
   face(c,'#d8fff0','#25374f',74);break;
 case 'lich':
   humanoid(c,'#c6d1b4','#2f665f');box(c,59,30,78,64,11,'#485f69','#9bd6b9',6);
   for(let i=0;i<3;i++)line(c,[[70,43+i*12],[124,43+i*12]],'#a7e8c4',3);
   ellipse(c,80,90,9,10,'#84ffac');ellipse(c,119,90,9,10,'#84ffac');break;
 case 'mainframe':
   legs(c,'#596180');box(c,25,53,150,150,19,'#55617d','#a6b8d5',8);
   box(c,42,68,116,101,12,'#242d57','#a4daeb',5);
   for(let i=0;i<4;i++)ellipse(c,56+i*29,189,6,6,i%2?'#ffaeb2':'#8de7d8');
   ellipse(c,100,110,39,30,'#eaa2bd','#372a51',5);
   for(let i=0;i<3;i++)line(c,[[72,110+i*10],[127,107+i*10]],'#ffe9f1',3);stem(c);break;
 case 'ghostclerk':
   ellipse(c,100,108,60,76,'#d1c9e8be','#665a89',5);poly(c,[[42,146],[29,207],[58,187],[99,205],[143,189],[168,207],[157,147]],'#b9a9d4b8');
   face(c,'#fdf7ff','#423154',102);box(c,110,131,62,46,3,'#f7e2c7','#8b7a9b',3);break;
 case 'skeleton':
   legs(c,'#d2cabf');box(c,61,116,75,72,14,'#57506b','#474057');
   ellipse(c,100,82,52,50,'#ddd8ce','#5d5467',5);
   ellipse(c,80,78,15,17,'#39324a');ellipse(c,121,78,15,17,'#39324a');
   poly(c,[[100,96],[92,111],[108,111]],'#716073');for(let i=0;i<5;i++)line(c,[[79+i*10,126],[79+i*10,139]],'#e3ddc9',3);
   box(c,135,135,43,50,3,'#e8e0cd');break;
 case 'hound':
   ellipse(c,100,143,63,54,'#6e4a64','#33223b',6);ellipse(c,100,80,58,50,'#624354','#33223b',6);
   poly(c,[[52,61],[44,9],[82,43]],'#a65d65');poly(c,[[118,43],[159,9],[148,61]],'#a65d65');
   ellipse(c,81,80,12,10,'#ffb26b');ellipse(c,119,80,12,10,'#ffb26b');
   poly(c,[[85,111],[94,132],[101,110]],'#eee5d4');poly(c,[[105,111],[113,132],[122,108]],'#eee5d4');
   legs(c,'#5a354c');break;
 case 'reaper':
   legs(c,'#3c3050');poly(c,[[100,15],[49,60],[27,196],[168,196],[152,59]],'#4f355d','#1d1a35',7);
   ellipse(c,100,85,45,42,'#ded3df','#3c2b4c',6);ellipse(c,82,84,12,15,'#ff7d9b');ellipse(c,118,84,12,15,'#ff7d9b');
   line(c,[[160,178],[175,33]],'#b3a5b0',9);poly(c,[[175,34],[126,10],[179,6],[196,38]],'#b9d5e0','#4b4b6f',4);break;
 case 'monkey':
   humanoid(c,'#bb8c60','#aa7651');ellipse(c,65,86,17,24,'#d7aa75');ellipse(c,137,86,17,24,'#d7aa75');
   ellipse(c,99,105,29,20,'#e4ba8a');poly(c,[[63,46],[100,20],[136,46]],'#8a4e37');line(c,[[166,158],[180,123],[189,150]],'#aa7651',10);break;
 case 'sandporter':
   humanoid(c,'#c8a57b','#7c6353');box(c,50,94,97,92,23,'#ab906f','#7b5c52',5);
   box(c,130,54,57,65,10,'#d4ae73','#795d4f',5);line(c,[[135,67],[155,96]],'#937153',4);poly(c,[[70,38],[103,12],[139,39]],'#b28d63');break;
 case 'erlang':
   humanoid(c,'#e4bb8c','#557f94');ellipse(c,100,48,8,9,'#f7e39a','#7e5968',2);
   poly(c,[[67,43],[100,13],[136,43]],'#95c7dd','#394d65',5);
   line(c,[[169,194],[165,17]],'#e9d3a5',8);poly(c,[[144,35],[165,4],[186,35],[165,26]],'#cbddea');break;
 case 'wukong':
   humanoid(c,'#d3a06e','#bd744e');ellipse(c,61,89,19,24,'#edc094');ellipse(c,141,89,19,24,'#edc094');
   poly(c,[[48,48],[60,14],[139,14],[150,48]],'#dcbd5c','#8d473f',5);
   line(c,[[36,177],[185,68]],'#e9c16c',16);line(c,[[180,61],[191,54]],'#ffecaa',8);
   ellipse(c,100,110,26,19,'#e6b283');break;
 case 'shrimp':
   ellipse(c,102,122,48,73,'#f09d8c','#9a5160',7);poly(c,[[75,58],[93,21],[112,63]],'#f3ba9c');
   ellipse(c,76,83,17,21,'#fff9e5');ellipse(c,129,83,17,21,'#fff9e5');
   ellipse(c,80,83,8,10,'#34263e');ellipse(c,126,83,8,10,'#34263e');
   line(c,[[62,140],[18,111],[16,80]],'#da7a7b',11);line(c,[[142,140],[186,111],[187,80]],'#da7a7b',11);
   for(let i=0;i<4;i++)line(c,[[77,147+i*10],[129,147+i*10]],'#e8b6a5',3);break;
 case 'moonrabbit':
   humanoid(c,'#f4ede7','#b0a9d2');ellipse(c,73,30,19,56,'#faf3ef','#b6a6c9',5);
   ellipse(c,125,30,19,56,'#faf3ef','#b6a6c9',5);ellipse(c,75,31,10,44,'#e6b3c6');ellipse(c,124,31,10,44,'#e6b3c6');
   ellipse(c,99,115,9,7,'#f6bbd0');box(c,133,140,39,28,10,'#d5a6bc');line(c,[[154,135],[165,111]],'#e9d7ac',6);break;
 case 'yaksha':
   humanoid(c,'#7db0ba','#454e77');poly(c,[[61,54],[52,8],[89,45]],'#7acdd1');poly(c,[[116,45],[151,8],[138,56]],'#7acdd1');
   line(c,[[174,193],[169,25]],'#d6e2e3',9);poly(c,[[151,38],[169,4],[187,38]],'#83dee5','#405673',3);
   ellipse(c,82,95,12,11,'#f7e5be');ellipse(c,122,95,12,11,'#f7e5be');break;
 case 'dragonking':
   humanoid(c,'#80c4c5','#356081');
   poly(c,[[59,46],[46,7],[83,38]],'#e9c178');poly(c,[[119,37],[154,6],[139,48]],'#e9c178');
   for(let i=0;i<3;i++){line(c,[[65,112+i*9],[25,119+i*12]],'#d3e8dc',3);line(c,[[137,112+i*9],[175,119+i*12]],'#d3e8dc',3);}
   poly(c,[[50,41],[66,11],[100,27],[135,11],[154,42]],'#e0ba66','#8c5a4b',5);
   line(c,[[169,201],[174,42]],'#d8d9b6',9);ellipse(c,174,35,17,18,'#65d6dc','#5f8b9d',5);break;
 }
 if(role==='elite'){ellipse(c,98,219,52,5,glow+'33');}
 if(role==='boss'){line(c,[[53,216],[96,204],[147,216]],glow,4);}
}
function effectPiece(c,element,x,y,size,accent,i){
 c.save();c.translate(x,y);c.rotate(i*.85);
 switch(element){
 case 'paper':case 'redink':box(c,-size*.65,-size*.85,size*1.3,size*1.7,2,element==='paper'?'#fff0cb':'#c34a63',null);line(c,[[-size*.3,0],[size*.32,0]],accent,2);break;
 case 'coffee':case 'soup':ellipse(c,0,0,size*.7,size*1.25,element==='coffee'?'#965849':'#f3c179');break;
 case 'binary':box(c,-size*.6,-size*.6,size*1.2,size*1.2,2,i%2?'#8ae8bf':'#d1aaff',null);break;
 case 'steel':poly(c,[[0,-size],[-size*.7,size*.7],[size*.8,size*.3]],'#e8ecf1',accent,1);break;
 case 'plasma':case 'lightning':line(c,[[-size,0],[0,-size],[size*.4,0],[size,size*.5]],accent,Math.max(2,size*.3));break;
 case 'water':case 'moon':ellipse(c,0,0,size*.7,size*.9,element==='water'?'#80dbea':'#f5daed');break;
 case 'bone':box(c,-size*.9,-size*.27,size*1.8,size*.54,4,'#f5e5d1',null);break;
 case 'sand':ellipse(c,0,0,size*.8,size*.45,'#e7bb86');break;
 case 'gold':poly(c,[[0,-size],[size*.3,-size*.3],[size,0],[size*.2,size*.2],[0,size],[-size*.2,size*.2],[-size,0],[-size*.2,-size*.2]],'#ffe0a0');break;
 case 'hellfire':poly(c,[[-size*.6,size],[0,-size],[size*.7,size],[0,size*.3]],'#ff9b69','#dd5062',2);break;
 default:ellipse(c,0,0,size*.8,size*.8,'#d0b9f2');
 }
 c.restore();
}
export function drawMonsterActor(ctx,enemy,now,visual={state:'idle',progress:0}){
 const m=monsterVisualFor(enemy),state=MONSTER_STATES.includes(visual.state)?visual.state:'idle',p=clamp(visual.progress||0);
 const w=enemy.boss?214:enemy.tier==='elite'?194:177,h=enemy.boss?258:enemy.tier==='elite'?248:240;
 const phase=now/1000+ m.index*.73, bob=Math.sin(phase*2.3)*3;
 ctx.save();ctx.scale(w/200,h/240);ctx.translate(0,bob);
 if(state==='attack'||state==='special'){
   const peak=Math.sin(Math.PI*p),dir=m.index%2?-1:1;
   const mode=m.attack;
   const dx=/charge|pounce|bite|pinch|sting|staff|redslash|dualblade|trident|reap/.test(mode)?-19*peak:
     /blinkshot|abduct|virus|drain/.test(mode)?8*peak:-5*peak;
   ctx.translate(dx, /quake|stamp|banquet/.test(mode)?-9*peak:-4*peak);
   ctx.rotate(dir*(/sweep|staff|trident|reap|dualblade/.test(mode)?.15:.06)*peak);
   if(state==='special'){ctx.shadowColor=enemy.accent||'#ffe1ad';ctx.shadowBlur=30*peak;}
 }
 if(state==='hurt'){
   const f=Math.sin(p*Math.PI);
   if(m.hurt==='sloshing'||m.hurt==='spill')ctx.rotate(.14*f);
   if(m.hurt==='glitch'||m.hurt==='phase')ctx.translate(Math.sin(p*65)*7*f,0);
   if(m.hurt==='sparks'||m.hurt==='rattle')ctx.rotate(Math.sin(p*37)*.075*f);
   if(m.hurt==='bend'||m.hurt==='recoil')ctx.rotate(.2*f);
   if(m.hurt==='flutter'||m.hurt==='shiver')ctx.scale(1+.06*f,1-.07*f);
 }
 if(state==='defeat'){
   const f=Math.pow(p,1.4);
   ctx.globalAlpha*=1-f;
   if(m.defeat==='collapse')ctx.translate(0,45*f);
   if(m.defeat==='scatter')ctx.rotate(.22*f);
   if(m.defeat==='dissolve')ctx.translate(0,-65*f);
   if(m.defeat==='pixel')ctx.scale(1-.22*f,1-.20*f);
   if(m.defeat==='shatter')ctx.rotate(-.27*f);
 }
 ctx.shadowColor='#180e24';ctx.shadowBlur=13;ctx.shadowOffsetY=6;
 drawAnatomy(ctx,enemy,m,phase);
 ctx.restore();
 if(enemy.tier==='elite'||enemy.tier==='boss'){
   ctx.save();ctx.strokeStyle=enemy.tier==='boss'?'#ffe6aa':enemy.accent||'#f5d5aa';
   ctx.globalAlpha=.50+.16*Math.sin(now/340);ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=14;
   ctx.lineWidth=enemy.boss?5:4;ctx.beginPath();ctx.ellipse(w/2,h*.53,w*.54,h*.45,0,0,TAU);ctx.stroke();ctx.restore();
 }
}
export function drawMonsterVfx(ctx,enemy,state,progress,{enemyX=458,enemyY=248,heroX=230,heroY=355,now=0}={}){
 const m=monsterVisualFor(enemy),p=clamp(progress),accent=enemy.accent||'#ffdbb5';
 if(!['attack','hurt','defeat','special'].includes(state))return;
 ctx.save();
 const strong=state==='special',hit=state==='attack'||strong;
 const count=(strong?16:hit?9:state==='hurt'?8:17);
 const startX=enemyX+75,startY=enemyY+96;
 for(let i=0;i<count;i++){
   const angle=i*2.39996+m.index*.43;
   let x,y,size;
   if(hit){
     const flight=clamp((p-.17)/.58);
     const endX=heroX+45,endY=heroY+32;
     x=startX+(endX-startX)*flight+(Math.cos(angle)*(23+17*Math.sin(p*Math.PI)))*Math.sin(p*Math.PI);
     y=startY+(endY-startY)*flight+Math.sin(angle)*(15+12*Math.sin(p*Math.PI));
     size=(strong?12:9)*(1-Math.abs(flight-.6)*.5)+(i%3);
   }else{
     const radius=(state==='defeat'?15+p*125:19+p*35);
     x=startX+Math.cos(angle)*radius;
     y=startY+Math.sin(angle)*radius+(state==='defeat'?p*26:0);
     size=(8+i%4)*(1-p*.8);
   }
   ctx.globalAlpha=(hit?Math.sin(Math.PI*p):1-p)*(.45+(i%4)*.13);
   effectPiece(ctx,m.element,x,y,Math.max(1,size),accent,i);
 }
 if(hit){
   const flight=clamp((p-.17)/.58);
   ctx.globalAlpha=.16+.34*Math.sin(Math.PI*p);
   ctx.strokeStyle=accent;ctx.lineWidth=strong?9:5;ctx.shadowBlur=22;ctx.shadowColor=accent;
   ctx.beginPath();
   const endX=startX+(heroX+40-startX)*flight,endY=startY+(heroY+30-startY)*flight;
   if(/staff|trident|dualblade|redslash|reap|bite|pinch|pounce/.test(m.attack)){
     ctx.arc(endX,endY,strong?68:40,-2.25,1.1);ctx.stroke();
   }else if(/beam|judgment|abduct|blinkshot|pulse|drain|virus/.test(m.attack)){
     ctx.moveTo(startX,startY);ctx.lineTo(endX,endY);ctx.stroke();
   }else{
     ctx.ellipse(endX,endY,strong?55:31,strong?22:13,0,0,TAU);ctx.stroke();
   }
 }
 ctx.restore();
}
export function validateMonsterRoster(enemies){
 return Array.isArray(enemies)&&enemies.length===32&&new Set(enemies.map(x=>x.id)).size===32&&
  enemies.every(x=>MONSTER_ANIMATIONS[x.id]&&x.name&&x.faction);
}
