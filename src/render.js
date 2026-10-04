import { furniture, stone, props, distance, visible } from './world.js?v=20261005-screenpass29';
import { roomRugs } from './room-layout.js?v=20261005-screenpass29';
import { facing, poseFor, frameFor, screenToWorld, depthKey, endingStage } from './presentation.js?v=20261005-screenpass29';
import { Locomotion } from './locomotion.js?v=20261005-screenpass29';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=v=>1-Math.pow(1-clamp(v,0,1),3);
export class Renderer {
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.assets=null;
    this.background=document.createElement('canvas');this.background.width=1120;this.background.height=720;
    this.debug=false;this.camera={x:560,y:360,zoom:1};this.reset();
  }
  reset(){this.gaits={angela:new Locomotion(),xavier:new Locomotion()};this.clock=0;this.magicAge=99;this.flash=0;this.freeze=0;this.camera={x:560,y:360,zoom:1};this.bubbleAge=9;this.lastBubble='';this.lastPose={};this.lastDirection={};this.switchAge={};this.previousFrame={};this.lastTime=-1;}
  setAssets(assets){this.assets=assets;this.paintRoom(this.background.getContext('2d'));}
  onEvent(e){if(e.type==='magic')this.magicAge=0;if(e.type==='notice'){this.bubbleAge=0;}if(e.type==='caught'){this.freeze=.09;this.flash=.32;}if(e.type==='success'){this.freeze=.065;this.flash=.18;}}
  screenToWorld(p){return screenToWorld(p,this.camera);}
  box(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  line(c,x,y,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
  ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
  text(c,text,x,y,size=12,color='#f5e8c8',align='center'){c.fillStyle=color;c.font=`${size}px Georgia, "Songti TC", serif`;c.textAlign=align;c.fillText(text,x,y);}
  pattern(c,index,size){const f=this.assets.furniture.frames[index],tile=document.createElement('canvas');tile.width=tile.height=size;const tc=tile.getContext('2d');tc.drawImage(this.assets.furniture.image,f.x+8,f.y+8,f.w-16,f.h-16,0,0,size,size);return c.createPattern(tile,'repeat');}
  paintRoom(c){
    const art=this.assets.furniture;
    c.clearRect(0,0,1120,720);this.box(c,0,0,1120,720,'#172637');
    // The original floor rectangles and furnishing footprints are unchanged.
    this.box(c,31,56,1058,625,'#b69a62',6);c.fillStyle=this.pattern(c,14,160);c.fillRect(42,70,1036,602);
    this.box(c,42,70,1036,602,'#1b233532');
    c.save();c.beginPath();c.rect(stone.x,stone.y,stone.w,stone.h);c.clip();c.fillStyle=this.pattern(c,15,104);c.fillRect(stone.x,stone.y,stone.w,stone.h);c.restore();
    for(const r of roomRugs){this.ellipse(c,r.x+r.w/2,r.y+r.h/2+4,r.w/2,r.h/2,'#13213744');art.draw(c,8,r.x,r.y,r.w,r.h);}
    // Visual-only north wall; furniture is drawn in front of it later.
    this.paintNorthWall(c);
    for(const y of [151,330,544]){this.box(c,1053,y-63,23,122,'#eadcbb',4);this.box(c,1058,y-57,15,109,'#bad3ce',2);this.line(c,1065,y-57,1065,y+52,'#f5e9c8',3);this.line(c,1056,y-3,1074,y-3,'#f5e9c8',3);}
    this.box(c,80,670,93,13,'#152237');this.line(c,80,674,173,674,'#c6ad7b',2);
  }
  paintNorthWall(c){
    // Architecture, not slots: one continuous walnut surface with broad joinery.
    // Keep all paint above the existing y=70 walkable boundary. No collider changes.
    c.save();c.beginPath();c.rect(31,12,1058,58);c.clip();
    const wood=c.createLinearGradient(0,12,0,70);
    wood.addColorStop(0,'#211d20');wood.addColorStop(.32,'#39302b');
    wood.addColorStop(.75,'#302925');wood.addColorStop(1,'#211e20');
    c.fillStyle=wood;c.fillRect(31,12,1058,58);
    // Very faint irregular grain unifies the wall rather than framing each bay.
    for(const [y,start,end,bend] of [[29,48,1065,2],[34,72,947,-1],[40,40,1074,1],[47,109,1030,-2],[54,45,1012,1]]){
      c.beginPath();c.moveTo(start,y);c.bezierCurveTo(start+190,y+bend,end-230,y-bend,end,y+.7);
      c.strokeStyle='#c0a4800a';c.lineWidth=.7;c.stroke();
    }
    // Joinery follows the shelving groups and the window-side bay, not a repeated grid.
    for(const x of [423,558,819]){
      this.line(c,x,25,x,61,'#16141770',1.5);
      this.line(c,x+2,25,x+2,61,'#a68b6715',1);
    }
    // Continuous cornice and lower rail: recessed shadow, wood lip, soft edge light.
    this.box(c,31,13,1058,7,'#19191e');
    this.box(c,31,20,1058,4,'#45392d');
    this.line(c,34,21,1086,21,'#b29a712e');
    this.line(c,34,25,1086,25,'#17161c80',2);
    this.box(c,31,61,1058,8,'#29231f');
    this.line(c,34,62,1086,62,'#8d775527');
    this.line(c,31,69,1089,69,'#14151c',2);
    // Window-side warmth stays subordinate to the painted bookshelves.
    const light=c.createLinearGradient(730,0,1089,0);
    light.addColorStop(0,'#d9b67a00');light.addColorStop(1,'#d9b67a0c');
    c.fillStyle=light;c.fillRect(730,26,359,35);
    c.restore();
  }
  furniture(c,o){
    const art=this.assets.furniture,{x,y,w,h,kind}=o;
    c.save();c.shadowColor='#090f205e';c.shadowBlur=13;c.shadowOffsetX=-5;c.shadowOffsetY=9;
    this.box(c,x+1,y+1,w-2,h-2,'#0b11213d',4);c.restore();
    if(kind==='shelf'&&w>h){const count=Math.round(w/105),unit=w/count;for(let n=0;n<count;n++)art.draw(c,0,x+n*unit,y-36,unit,h+36);}
    else if(kind==='shelf')art.draw(c,1,x,y-18,w,h+18);
    else if(kind==='desk'){
      // The chair and desk form one furnishing set within the original collider.
      art.draw(c,2,x+43,y-48,w-43,h+48);
      art.draw(c,10,x,y+19,49,h-19);
      art.draw(c,12,x+32,y+10,28,19);
    }
    else if(kind==='sofa')art.draw(c,3,x,y-40,w,h+40);
    else if(kind==='screen')art.draw(c,4,x-5,y-24,w+10,h+24);
    else if(kind==='pillar')art.draw(c,5,x,y-45,w,h+45);
    else if(kind==='table')art.draw(c,6,x,y-19,w,h+19);
    else if(kind==='cabinet')art.draw(c,7,x,y-24,w,h+24);
    // Reuse illustrated props on their existing sound-event positions.
    if(kind==='shelf'&&x===468)art.draw(c,11,480,155,29,42);
    if(kind==='shelf'&&x===250)art.draw(c,12,259,203,36,24);
  }
  atmosphere(c,t,foreground=false){
    if(!foreground){
      c.save();c.globalCompositeOperation='screen';
      for(const y of [151,330,544]){
        const light=c.createLinearGradient(1072,y,645,y+170);light.addColorStop(0,'#ffe7a432');light.addColorStop(1,'#ffe7a400');
        c.fillStyle=light;c.beginPath();c.moveTo(1076,y-56);c.lineTo(661,y+113);c.lineTo(738,y+214);c.lineTo(1076,y+54);c.closePath();c.fill();
        for(let k=0;k<3;k++){const off=k*35;c.fillStyle='#efdca70b';c.beginPath();c.moveTo(1066,y-45+off);c.lineTo(739,y+83+off);c.lineTo(753,y+100+off);c.lineTo(1066,y-29+off);c.fill();}
      }c.restore();
    }else{
      for(let i=0;i<22;i++){const x=740+(i*61%330)+Math.sin(t*.15+i)*10,y=95+(i*79+t*5)%535,alpha=(.12+Math.sin(t*.65+i)*.08);this.ellipse(c,x,y,1+(i%3)*.3,1+(i%3)*.3,`rgba(255,229,176,${alpha})`);}
      for(const y of [151,330,544]){const sway=Math.sin(t*.65+y)*1.1;c.save();c.translate(1055,y-75);c.rotate(sway*.012);this.assets.furniture.draw(c,9,-12,0,33,102);c.restore();}
    }
  }
  draw(game,dt=0,active=true){
    const c=this.ctx;
    if(!this.assets){this.box(c,0,0,1120,720,'#192a40');this.text(c,'正在準備午後的書房……',560,360,23);return;}
    if(game.time<this.lastTime)this.reset();this.lastTime=game.time;
    const frozen=this.freeze>0;this.freeze=Math.max(0,this.freeze-dt);this.flash=Math.max(0,this.flash-dt);
    if(active&&!frozen){this.clock+=dt;this.magicAge+=dt;this.bubbleAge+=dt;}
    const t=this.clock;
    const lastSteps=game.phase==='play'&&game.rear&&distance(game.player,game.xavier)<100;
    const targetZoom=game.phase==='play'?(lastSteps?1.035:1):1.075;
    const blend=1-Math.exp(-dt*5);this.camera.zoom+=(targetZoom-this.camera.zoom)*blend;
    const targetX=560+(game.xavier.x-560)*(lastSteps?.045:game.result?.065:0),targetY=360+(game.xavier.y-360)*(lastSteps?.045:0);
    this.camera.x+=(targetX-this.camera.x)*blend;this.camera.y+=(targetY-this.camera.y)*blend;
    c.clearRect(0,0,1120,720);c.save();c.translate(560,360);c.scale(this.camera.zoom,this.camera.zoom);c.translate(-this.camera.x,-this.camera.y);
    c.drawImage(this.background,0,0);this.atmosphere(c,t);
    if(game.phase==='play')this.vision(c,game);
    if(game.walkTarget&&game.phase==='play'){this.ellipse(c,game.walkTarget.x,game.walkTarget.y,5,2,'#f5deb28a');}
    // Sort by ground anchor, not the top of the PNG. No graphics enter collision logic.
    const entities=[...furniture,{kind:'actor',who:'xavier',x:game.xavier.x,y:game.xavier.y},{kind:'actor',who:'angela',x:game.player.x,y:game.player.y}].sort((a,b)=>depthKey(a)-depthKey(b));
    for(const item of entities){if(item.kind==='actor')this.actor(c,game,item.who,t);else this.furniture(c,item);}
    this.atmosphere(c,t,true);
    if(game.phase==='play')this.overlays(c,game,t);
    this.soundEffects(c,game,t);
    c.restore();
    if(lastSteps){const glow=c.createRadialGradient(560,360,230,560,360,660);glow.addColorStop(0,'#0000');glow.addColorStop(1,`rgba(121,53,77,${.1+game.tension*.16})`);c.fillStyle=glow;c.fillRect(0,0,1120,720);}
    if(this.flash>0){c.fillStyle=`rgba(255,236,218,${this.flash*.6})`;c.fillRect(0,0,1120,720);}
  }
  sprite(c,who,index,x,y,height,rotation=0,stretch=1,alpha=1){
    c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(rotation);c.scale(1,stretch);
    // XAVIER_CANON_HAIR_ORIENTATION_LOCKED: use authored directions, never reflect Xavier.
    if(who==='angela'&&index===2)c.scale(-1,1);
    this.assets[who].character(c,index,0,0,height);c.restore();
  }
  actor(c,game,who,t){
    const p=who==='angela'?game.player:game.xavier,pose=poseFor(game,who,this.magicAge);
    const gait=this.gaits[who].update(p,game.time,who==='angela'?game.mode:'walk',game.phase==='play');
    const dir=facing(gait.moving?gait.angle:p.angle),index=frameFor(who,pose,dir);
    const moving=gait.moving;
    this.ellipse(c,p.x+1,p.y+2,17,7,'#10162765');
    this.ellipse(c,p.x,p.y+1,11,4,'#10162728');
    if(moving||pose==='idle'||pose==='walk'){
      this.walkSprite(c,who,dir,gait,p.x,p.y);
    }else{
      // Stops and turns switch immediately: no stale walk frame or ghost crossfade.
      this.sprite(c,who,index,p.x,p.y-Math.sin(t*2)*.35,who==='xavier'?85:82,0,1+Math.sin(t*2)*.003);
    }
    // Tiny actual book prop and page flicker when reading away from the camera.
    if(pose==='read'&&dir==='back'){this.assets.furniture.draw(c,12,p.x+7,p.y-40,19,14);if(Math.sin(t*.8)>.85)this.line(c,p.x+17,p.y-40,p.x+18+Math.sin(t*8)*3,p.y-27,'#f5e9cc',1);}
    // Facing cue remains anchored to the collision body.
    c.strokeStyle=who==='angela'?'#e8ccd5a0':'#f5d58da0';c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y+1,20,p.angle-.2,p.angle+.2);c.stroke();
    if(who==='angela'&&this.magicAge<.85){const a=this.magicAge;for(let i=0;i<6;i++){const theta=i*TAU/6+a*2;this.spark(c,p.x+Math.cos(theta)*(17+a*20),p.y-40+Math.sin(theta)*(13+a*13),3*(1-a),'#baddec');}}
  }
  walkSprite(c,who,dir,gait,x,y){
    const art=this.assets[who+'Walk'],column={front:0,back:1,left:2,right:3}[dir];
    const h=who==='xavier'?85:82,mode=gait.mode;
    const phase=gait.phase*TAU,bob=(1-Math.cos(phase*2))*(mode==='sprint'?.75:mode==='sneak'?.15:.35);
    const row=gait.row,index=row*4+column,f=art.frames[index];
    
    c.save();c.translate(x,y-bob+(mode==='sneak'?1.4:0));
    const side=dir==='left'||dir==='right';
    // Only Angela's independently generated left column needs direction correction.
    // Xavier's authored left/right columns and back are never mirrored.
    if(who==='angela'&&dir==='left')c.scale(-1,1);
    const stride=mode==='sneak'?.62:mode==='sprint'?1.2:1;
    // Widen/compress ONLY below hips; the actual atlas keyframes alternate legs.
    const cut=who==='xavier'?.605:.72;
    c.save();c.beginPath();c.rect(-100,-h*(1-cut),200,h);c.clip();
    c.scale(side?stride:1,1);
    if(who==='xavier'){
      const anchor=this.assets.xavierLegAnchors[index],scaleX=h*anchor.targetWidth/anchor.sourceWidth;
      const height=h*.40,width=f.w*scaleX;
      art.draw(c,index,h*anchor.target-anchor.source*scaleX,-height,width,height);
    }else art.character(c,index,0,0,h);
    c.restore();
    c.save();c.beginPath();c.rect(-100,-h,200,h*cut+.8);c.clip();
    if(who==='xavier'){
      // Keep the entire approved original head AND torso together. Joining at the
      // trousers avoids neck seams and preserves the original head/body proportion.
      this.sprite(c,who,{front:0,back:1,left:2,right:3}[dir],0,0,h);
    }else{
      c.transform(1,0,side?(mode==='sprint'?-.055:mode==='sneak'?-.015:0):0,1,0,0);
      art.character(c,index,0,0,h);
    }
    c.restore();
    c.restore();
  }
  spark(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.28,y-r*.28);c.lineTo(x+r,y);c.lineTo(x+r*.28,y+r*.28);c.lineTo(x,y+r);c.lineTo(x-r*.28,y+r*.28);c.lineTo(x-r,y);c.lineTo(x-r*.28,y-r*.28);c.closePath();c.fill();}
  bubble(c,text,x,y,age){
    const a=clamp(age/.16,0,1),s=.82+.18*ease(a)+Math.sin(a*Math.PI)*.07;
    c.save();c.translate(x,y-(1-a)*6);c.scale(s,s);c.globalAlpha=a;
    c.shadowColor='#07122366';c.shadowBlur=9;this.box(c,-29,-20,58,30,'#f7eddb',12);c.shadowBlur=0;
    c.fillStyle='#f7eddb';c.beginPath();c.moveTo(-4,9);c.lineTo(1,16);c.lineTo(8,9);c.fill();
    this.text(c,text,0,1,19,'#423943');c.restore();
  }
  overlays(c,game,t){
    const g=game.xavier;
    for(const p of props){const available=distance(game.player,p)<=310,selected=game.magicTarget?.id===p.id;
      if(!available)continue;
      this.spark(c,p.x,p.y-7,selected?9:6,selected?'#fff0c5':'#d2dbd8b0');
      if(selected){c.strokeStyle='#ead6a070';c.lineWidth=1;c.beginPath();c.ellipse(p.x,p.y-7,16+Math.sin(t*2),11,0,0,TAU);c.stroke();this.text(c,p.name,p.x,p.y-29,11,'#f6e8c6');}
    }
    const bubble=game.warning?'……？':game.glance?'……':game.bubble;
    if(bubble!==this.lastBubble){this.lastBubble=bubble;this.bubbleAge=0;}
    if(bubble!=='……'||game.glance||game.doubleCheck||game.warning)this.bubble(c,bubble,g.x,Math.max(92,g.y-96),this.bubbleAge);
    if(game.hugAvailable){
      const y=Math.max(105,Math.min(game.player.y,g.y)-122),pulse=1+Math.sin(t*7)*.02;
      c.save();c.translate((game.player.x+g.x)/2,y);c.scale(pulse,pulse);c.shadowColor='#bb739866';c.shadowBlur=15;this.box(c,-85,-18,170,37,'#f3dfcf',18);c.shadowBlur=0;c.strokeStyle='#b68b56';c.lineWidth=1;c.beginPath();c.roundRect(-82,-15,164,31,15);c.stroke();this.text(c,'E  ♡  就是現在，抱住他',0,6,13,'#623b49');c.restore();
    }
  }
  soundEffects(c,game,t){
    for(const p of game.pulses){c.strokeStyle=p.magic?`rgba(171,211,235,${(1-p.age)*.65})`:`rgba(236,220,180,${(1-p.age)*.2})`;c.lineWidth=p.magic?1.7:1;c.beginPath();c.ellipse(p.x,p.y,7+p.age*Math.min(p.radius,110),4+p.age*Math.min(p.radius,70),0,0,TAU);c.stroke();if(p.magic)for(let i=0;i<5;i++)this.spark(c,p.x+Math.sin(i*2.4)*p.age*35,p.y-15-p.age*34+Math.cos(i)*14,3*(1-p.age),'#d8edf1');}
  }
  vision(c,game){
    const g=game.xavier,range=game.visionRange,half=game.visionAngle;
    const gradient=c.createRadialGradient(g.x,g.y,10,g.x,g.y,range);gradient.addColorStop(0,'#eace8e24');gradient.addColorStop(1,'#f2d7a004');c.fillStyle=gradient;c.beginPath();c.moveTo(g.x,g.y);
    for(let a=g.angle-half;a<=g.angle+half+.015;a+=.018){let d=8;for(;d<range;d+=7){const p={x:g.x+Math.cos(a)*d,y:g.y+Math.sin(a)*d};if(!visible(g,p)||p.x<42||p.x>1078||p.y<70||p.y>672)break;}c.lineTo(g.x+Math.cos(a)*d,g.y+Math.sin(a)*d);}c.closePath();c.fill();
  }
  drawEnding(canvas,game){
    if(!this.assets)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=game.resultTime,stage=endingStage(game.result,t);
    c.clearRect(0,0,w,h);const glow=c.createRadialGradient(w/2,h*.65,10,w/2,h*.65,w*.55);glow.addColorStop(0,'#fff6df');glow.addColorStop(.7,'#efe0bf');glow.addColorStop(1,'#d5b98600');c.fillStyle=glow;c.fillRect(0,0,w,h);
    this.ellipse(c,w/2,h-24,125,14,'#71624620');
    const successful=game.result==='PERFECT'||game.result==='COUNTER-CATCH';
    // An actual approach / turn beat precedes the illustrated contact key pose.
    if(t<.85){
      const progress=ease(t/.7),height=h-36;
      if(successful){this.sprite(c,'angela',7,w*(.23+.2*progress),h-20,height*.97);this.sprite(c,'xavier',t<.5?4:7,w*.59,h-20,height);}
      else if(game.result==='SO CLOSE'){this.sprite(c,'angela',7,w*(.24+.1*progress),h-20,height*.97);this.sprite(c,'xavier',t<.3?1:6,w*.68,h-20,height,0,1);}
      else{this.sprite(c,'xavier',6,w*.26,h-20,height);this.sprite(c,'angela',0,w*.76,h-20,height*.97,-.04);}
      if(t<.62)return;
      c.globalAlpha=ease((t-.62)/.23);
    }
    let cell=game.result==='PERFECT'?0:game.result==='SO CLOSE'?1:game.result==='CAUGHT'?2:stage==='counter'?3:0;
    const f=this.assets.endings.frames[cell],height=h-28,width=height*f.w/f.h;
    const arrival=game.result==='SO CLOSE'?Math.sin(Math.min(t/.3,1)*Math.PI)*5:0;
    c.save();c.translate(w/2+arrival,h-15);this.assets.endings.draw(c,cell,-width/2,-height,width,height);c.restore();c.globalAlpha=1;
    if(game.result==='PERFECT'&&t<1.65)this.bubble(c,'！',w*.48,43,Math.min(1,t-.65));
    if(game.result==='PERFECT'||game.result==='COUNTER-CATCH'){
      if(stage==='pause')this.bubble(c,'……？',w*.62,42,Math.min(1,t-3.5));
      else for(let i=0;i<5;i++){const age=(t*.25+i*.21)%1;c.globalAlpha=Math.sin(age*Math.PI)*.6;this.text(c,'♡',w*.5+Math.sin(i*5)*100,h*.6-age*130,16+i%2*5,'#ba798b');}c.globalAlpha=1;
      if(stage==='counter'){this.spark(c,w*.48,h*.62,5+Math.sin(t*3),'#bc9754');}
    }else if(game.result==='CAUGHT')this.bubble(c,'？',w*.64,44,Math.min(t,1));
    else if(t>.8){this.bubble(c,'……',w*.32,42,Math.min(t-.8,1));this.bubble(c,'……',w*.66,42,Math.min(t-.8,1));}
  }
  drawTitle(canvas,dt){
    if(!this.assets)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=this.clock;c.clearRect(0,0,w,h);
    this.ellipse(c,w*.55,h-20,160,16,'#0b162f50');
    const bounce=Math.sin(t*1.7)*2;
    this.sprite(c,'angela',4,w*.43,h-20+bounce,h*.79,Math.sin(t*1.3)*.006,1);
    // Title-only recomposition reuses the original head pixels and extends the body.
    // Foot-anchored breathing: preserve Canon orientation and the approved base proportions.
    const breath=(1-Math.cos(t*Math.PI/2))/2;
    c.save();c.translate(w*.68,h-20);
    // No whole-character rocking: keep his stance steady, with only quiet breathing.
    c.scale(1+breath*.003,1+breath*.012);
    this.assets.xavierTitle.character(c,0,0,0,h*.86);c.restore();
    this.text(c,'♡',w*.32,h*.19+Math.sin(t)*5,32,'#eed4cd');
    this.spark(c,w*.77,h*.19,5,'#f3dfb0');
  }
}
