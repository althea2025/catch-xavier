import {difficultyProfile} from './difficulty.js?v=20261002-holdsprint26';
import {WORLD,blocked,furniture,inside,segmentRect,props,stations,distance,angleDiff,move,visible,surface,route} from './world.js?v=20261002-holdsprint26';
export class Game {
  constructor(random=Math.random,difficulty='CANON'){this.random=random;this.reset(difficulty);}
  reset(difficulty=this.difficulty?.id||'CANON'){
    this.difficulty=difficultyProfile(difficulty);this.debugRun=false;this.magicUses=0;this.noticeCount=0;this.lastNotice=-Infinity;
    this.doubleCheck=null;this.lingeringAlert=0;this.patternAwareness=0;this.intuitionRate=0;
    this.player={x:116,y:591,angle:-Math.PI/2,moving:false};
    const initial=[0,2,3,4][Math.floor(this.random()*4)],station=stations[initial];
    this.xavier={x:station.x,y:station.y,angle:station.face,targetAngle:station.face};
    this.state='CALM';this.time=0;this.cooldown=0;this.exposure=0;this.intuition=0;this.tension=0;
    this.sneaking=false;this.mode='walk';this.phase='play';this.result=null;this.resultTime=0;
    this.destination=initial;this.path=[];this.dwell=station.duration*(.85+this.random()*.35);this.behavior=station.name;
    this.glanceIn=this.nextLook();this.glance=null;this.interest=null;this.interestTime=0;this.suspicion=0;
    this.soundClock=0;this.events=[];this.pulses=[];this.selected=null;this.lastMagic=null;this.closest=Infinity;
    this.warning=false;this.bubble='……';this.toast='先繞過書架，再找機會靠近。';this.toastTime=4;this.attemptSteps=0;
    this.distraction=null;this.magicHistory=[];this.magicTipShown=false;
    this.pattern=Math.floor(this.random()*3);this.patternStep=0;
  }
  nextLook(){const [a,b]=this.difficulty.randomLookFrequency;return (a+this.random()*(b-a))*(this.state==='SUSPICIOUS'||this.lingeringAlert>0?this.difficulty.suspiciousLookScale:1);}
  get visionRange(){return this.difficulty.visionRange*(this.state==='SUSPICIOUS'?this.difficulty.suspiciousVisionScale:1);}
  get visionAngle(){return this.difficulty.visionAngle*(this.state==='SUSPICIOUS'?this.difficulty.suspiciousAngleScale:1);}
  get reactionTime(){return this.difficulty.visualReactionTime/(this.lingeringAlert>0?this.difficulty.falseRelaxationSensitivity:1);}
  notice(){if(this.time-this.lastNotice>=this.difficulty.noticeCooldown){this.noticeCount++;this.lastNotice=this.time;}this.events.push({type:'notice'});}
  afterInvestigation(source){
    const p=this.difficulty;this.lingeringAlert=p.falseRelaxationDuration;this.glanceIn=Math.min(this.glanceIn,this.nextLook());
    if(source&&this.random()<p.doubleCheckProbability){this.doubleCheck={pause:p.doubleCheckTelegraph,remaining:p.doubleCheckSweep,angle:Math.atan2(source.y-this.xavier.y,source.x-this.xavier.x)+Math.PI*.7};this.bubble='……';this.behavior='準備離開，卻又停住了';}
  }
  notify(text){this.toast=text;this.toastTime=3;}
  get rear(){return Math.abs(angleDiff(Math.atan2(this.player.y-this.xavier.y,this.player.x-this.xavier.x),this.xavier.angle))>this.difficulty.hugRearAngle;}
  get hugAvailable(){const d=distance(this.player,this.xavier);return this.phase==='play'&&d<=this.difficulty.hugWindow&&d>=this.difficulty.hugMinDistance&&this.rear&&visible(this.player,this.xavier);}
  get nearby(){return props.filter(p=>distance(this.player,p)<=this.difficulty.magicRange);}
  get magicTarget(){return this.nearby.find(p=>p.id===this.selected)||this.nearby.sort((a,b)=>distance(this.player,a)-distance(this.player,b))[0];}
  selectNext(){const items=this.nearby;if(!items.length){this.notify('再靠近一點，才能讓物件發聲。');return;}this.selected=items[(items.findIndex(p=>p.id===this.selected)+1)%items.length].id;}
  magic(){
    if(this.phase!=='play')return false;
    if(this.cooldown>0){this.notify('魔法還需要一點時間。');return false;}
    const target=this.magicTarget;if(!target){this.notify('附近沒有能干擾的物件，靠近 ✧ 再試。');return false;}
    this.magicUses++;this.cooldown=this.difficulty.magicCooldown;this.lastMagic=target;this.selected=target.id;const heard=this.emitSound(target,target.sound,true);
    this.events.push({type:'magic'});
    if(!heard)this.notify('聲音太遠或被家具擋住，他沒有注意到。');
    else if(!this.magicTipShown){this.notify('趁他查看聲音時換個位置。');this.magicTipShown=true;}
    else this.notify(this.state==='DISTRACTED'?`${target.name}輕響……他過去查看了。`:'他注意到聲音了，但似乎有些起疑。');
    return true;
  }
  emitSound(p,radius,magic=false){
    this.pulses.push({x:p.x,y:p.y,radius,age:0,magic});
    const d=distance(p,this.xavier),walls=magic?furniture.filter(o=>!inside(p,o)&&segmentRect(p,this.xavier,o)).length:0;
    const occlusion=magic?Math.pow(this.difficulty.occlusionAttenuation,walls):(visible(p,this.xavier)?1:this.difficulty.occlusionAttenuation);
    const sensitivity=this.difficulty.hearingSensitivity*(magic?1:this.difficulty.footstepSensitivity[this.mode])*(this.lingeringAlert>0?this.difficulty.falseRelaxationSensitivity:1);
    if(d>radius*occlusion*sensitivity)return false;
    if(magic){this.beginDistraction(p);return true;}
    // Quiet incidental steps do not steal focus. A loud sprint still interrupts.
    if(this.distraction&&radius<this.difficulty.quietInterruptRadius)return false;
    if(this.distraction)this.endDistraction(false);
    this.doubleCheck=null;
    const was=this.state;
    // Sound gives a direction, not knowledge of Angela's exact identity.
    this.state=was==='CALM'?'CURIOUS':'SUSPICIOUS';
    this.suspicion=this.state==='SUSPICIOUS'?this.difficulty.suspiciousDuration:this.difficulty.curiousDuration;
    this.interest={x:p.x,y:p.y};this.interestTime=this.difficulty.curiousDuration*.36;
    this.xavier.targetAngle=Math.atan2(p.y-this.xavier.y,p.x-this.xavier.x);
    this.bubble=this.state==='CURIOUS'?'？':'……？';this.behavior=magic?'側耳聽著聲音':'停步，注意四周';
    this.glance=null;this.notice();return true;
  }
  beginDistraction(source){
    const saved=this.distraction?.saved||{destination:this.destination,dwell:this.dwell};
    this.magicHistory=this.magicHistory.filter(t=>this.time-t<this.difficulty.magicMemory);this.magicHistory.push(this.time);
    this.patternAwareness=1+(this.magicHistory.length-1)*this.difficulty.patternAwarenessRate;
    const tier=Math.max(this.patternAwareness>=this.difficulty.patternTierThree?3:this.patternAwareness>=this.difficulty.patternTierTwo?2:1,this.state==='SUSPICIOUS'?3:1);
    this.doubleCheck=null;
    this.state=['','DISTRACTED','CURIOUS','SUSPICIOUS'][tier];
    this.suspicion=tier===1?0:tier===2?this.difficulty.curiousDuration:this.difficulty.suspiciousDuration;
    this.interest=null;this.interestTime=0;this.glance=null;
    // Pick an accessible inspection spot, never the collider containing the prop.
    // Each profile budgets travel and a readable inspection pause inside its window.
    const patternFactor=this.difficulty.patternDurations[tier-1]/(1+Math.max(0,this.patternAwareness-tier)*this.difficulty.patternPenalty);
    const budget=this.difficulty.distractionInvestigationDistance*patternFactor;let best=null;
    for(const radius of this.difficulty.inspectionRadii)for(let a=0;a<Math.PI*2;a+=Math.PI/4){
      const point={x:source.x+Math.cos(a)*radius,y:source.y+Math.sin(a)*radius};
      if(blocked(point.x,point.y,18))continue;
      const path=route(this.xavier,point);if(!path.length)continue;
      let cost=0,prev=this.xavier;for(const p of path){cost+=distance(prev,p);prev=p;}
      if(cost>budget)continue;
      const score=radius+cost*.18;if(!best||score<best.score)best={path,score};
    }
    this.path=best?.path||[];
    this.distraction={source:{x:source.x,y:source.y},saved,tier,elapsed:0,pause:this.difficulty.investigationPause,remaining:Math.max(this.difficulty.minDistractionDuration,this.difficulty.distractedDuration*patternFactor),look:0};
    this.xavier.targetAngle=Math.atan2(source.y-this.xavier.y,source.x-this.xavier.x);
    this.bubble=tier===1?'？':'……？';this.behavior='停下，循聲查看';this.notice();
  }
  endDistraction(check=true){
    if(!this.distraction)return;
    const {saved,tier,source}=this.distraction;this.distraction=null;
    this.destination=saved.destination;this.dwell=saved.dwell;this.path=route(this.xavier,stations[this.destination]);
    this.glanceIn=this.nextLook();
    if(tier===1){this.state='CALM';this.bubble='……';}
    this.behavior='回到剛才的事情';if(check)this.afterInvestigation(source);
  }
  updateDistraction(dt){
    const d=this.distraction,g=this.xavier;d.elapsed+=dt;d.remaining-=dt;
    g.targetAngle=Math.atan2(d.source.y-g.y,d.source.x-g.x);
    if(d.pause>0)d.pause-=dt;
    else if(this.path.length){
      const next=this.path[0],length=distance(g,next);
      if(length<2)this.path.shift();else move(g,(next.x-g.x)/length*Math.min(length,this.difficulty.investigationSpeed*dt),(next.y-g.y)/length*Math.min(length,this.difficulty.investigationSpeed*dt),17);
      this.behavior='走近聲音來源查看';
    }else{d.look+=dt;this.behavior=d.tier===3?'這些聲響……不太自然。':'查看物件，暫時沒有回頭';
      // Any reverse check is telegraphed after investigation, not an instant scan.
    }
    const delta=angleDiff(g.targetAngle,g.angle);g.angle+=Math.sign(delta)*Math.min(Math.abs(delta),dt*this.difficulty.investigationTurnSpeed);
    this.bubble=d.tier===1?'？':'……？';
    if(d.remaining<=0||(d.look>=this.difficulty.investigationDwell&&d.elapsed>=this.difficulty.distractedDuration*.77))this.endDistraction();
  }
  interact(){
    if(this.phase!=='play')return false;
    if(this.hugAvailable){this.finish(this.random()<this.difficulty.secretProbability?'COUNTER-CATCH':'PERFECT');return true;}
    this.notify(distance(this.player,this.xavier)<90?'再近兩步，從他的背後抱住他。':'先悄悄繞到他背後。');return false;
  }
  finish(result){
    if(this.phase!=='play')return;
    this.closest=Math.min(this.closest,distance(this.player,this.xavier));
    if(result==='CAUGHT'||result==='SO CLOSE')this.notice();
    this.result=result;this.phase='ending';this.resultTime=0;this.state=result==='PERFECT'||result==='COUNTER-CATCH'?this.state:'CAUGHT';
    this.events.push({type:result==='PERFECT'||result==='COUNTER-CATCH'?'success':'caught'});
  }
  chooseActivity(){
    // Three short, branching habits; reselect during the run, never a fixed patrol.
    const patterns=[[0,4,1,5],[2,1,5,0],[3,0,2,4]];
    if(this.random()<this.difficulty.activityVariation){this.pattern=Math.floor(this.random()*3);this.patternStep=Math.floor(this.random()*4);}
    let next=patterns[this.pattern][this.patternStep++%4];
    if(next===this.destination)next=(next+1+Math.floor(this.random()*4))%stations.length;
    this.destination=next;this.path=route(this.xavier,stations[next]);this.behavior=['走向書桌','走向書架','走到沙發旁','走向窗邊','走向藏書','慢步思考'][next];
    this.dwell=stations[next].duration*(this.difficulty.activityDwell[0]+this.random()*(this.difficulty.activityDwell[1]-this.difficulty.activityDwell[0]));
  }
  update(dt,input={}){
    dt=Math.min(Math.max(dt,0),.05);
    if(this.phase==='ending'){this.resultTime+=dt;if(this.resultTime>=12)this.phase='result';return;}
    if(this.phase!=='play')return;
    this.time+=dt;this.magicHistory=this.magicHistory.filter(t=>this.time-t<this.difficulty.magicMemory);this.patternAwareness=this.magicHistory.length?1+(this.magicHistory.length-1)*this.difficulty.patternAwarenessRate:0;this.lingeringAlert=Math.max(0,this.lingeringAlert-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.toastTime-=dt;
    this.pulses=this.pulses.filter(p=>(p.age+=dt)<1.05);
    const p=this.player,g=this.xavier;
    this.mode=input.sprint?'sprint':this.sneaking?'sneak':'walk';
    let dx=input.x||0,dy=input.y||0,len=Math.hypot(dx,dy);p.moving=len>0;
    if(len){dx/=len;dy/=len;p.angle=Math.atan2(dy,dx);const speed={sneak:47,walk:100,sprint:172}[this.mode];
      const old={...p};move(p,dx*speed*dt,dy*speed*dt);p.moving=distance(old,p)>.1;
      if(p.moving){this.attemptSteps+=speed*dt;this.soundClock-=dt;if(this.soundClock<=0){this.soundClock={sneak:.68,walk:.46,sprint:.28}[this.mode];this.emitSound(p,{sneak:17,walk:115,sprint:265}[this.mode]*surface(p).noise);this.events.push({type:'step',mode:this.mode});}}
    }else this.soundClock=Math.min(this.soundClock,.18);
    if(input.magic)this.magic();if(input.interact&&this.interact())return;
    this.updateAI(dt);
    const d=distance(p,g),los=visible(g,p),angle=Math.abs(angleDiff(Math.atan2(p.y-g.y,p.x-g.x),g.angle));
    this.closest=Math.min(this.closest,d);
    const inVision=los&&d<this.visionRange&&angle<this.visionAngle;
    this.exposure=Math.max(0,this.exposure+(inVision?dt: -dt*this.difficulty.exposureRecovery));
    // Passive, non-magical battle intuition. A slow approach gets a readable warning.
    const close=los&&d<this.difficulty.closeRangeRadius;
    const pressure=this.difficulty.intuitionOuterPressure+(1-this.difficulty.intuitionOuterPressure)*Math.min(1,Math.max(0,(this.difficulty.closeRangeRadius-d)/(this.difficulty.closeRangeRadius-this.difficulty.hugWindow)));
    this.intuitionRate=close?this.difficulty.closeRangeIntuitionRate[this.mode]*pressure*(d<this.difficulty.nearIntuitionRadius?this.difficulty.nearIntuitionScale:1)*(this.distraction?this.difficulty.distractionEffectiveness:1)*(this.lingeringAlert>0?this.difficulty.falseRelaxationSensitivity:1):0;
    if(close)this.intuition+=dt*this.intuitionRate;else this.intuition=Math.max(0,this.intuition-dt*this.difficulty.intuitionRecovery);
    this.warning=close&&this.intuition>this.difficulty.intuitionWarning;
    if(this.warning){this.bubble='……？';this.behavior='他的手停住了……';}
    this.tension=close?Math.min(1,(this.difficulty.closeRangeRadius-d)/(this.difficulty.closeRangeRadius-this.difficulty.hugWindow)+this.intuition*.2):inVision?.5:0;
    if(this.intuition>this.difficulty.intuitionTurn&&close){if(this.distraction)this.endDistraction(false);this.doubleCheck=null;this.interest={x:p.x,y:p.y};this.interestTime=.8;g.targetAngle=Math.atan2(p.y-g.y,p.x-g.x);if(this.state!=='SUSPICIOUS')this.notice();this.state='SUSPICIOUS';this.suspicion=Math.max(this.suspicion,this.difficulty.suspiciousDuration);}
    if(this.exposure>this.reactionTime||(close&&this.intuition>this.difficulty.intuitionCatch)||(los&&d<this.difficulty.contactRadius)){
      g.angle=Math.atan2(p.y-g.y,p.x-g.x);this.finish(d<=this.difficulty.soCloseRange?'SO CLOSE':'CAUGHT');
    }
  }
  updateAI(dt){
    const g=this.xavier;
    if(this.distraction){this.updateDistraction(dt);return;}
    this.suspicion=Math.max(0,this.suspicion-dt);
    if(this.suspicion<=0&&this.state!=='CALM'){this.state='CALM';this.bubble='……';this.lingeringAlert=this.difficulty.falseRelaxationDuration;this.glanceIn=Math.min(this.glanceIn,this.nextLook());}
    if(this.doubleCheck){const check=this.doubleCheck;if(check.pause>0){check.pause-=dt;this.bubble='……';this.behavior='準備離開，卻又停住了';return;}check.remaining-=dt;g.targetAngle=check.angle;this.behavior='再次確認四周';if(check.remaining<=0){this.doubleCheck=null;this.glanceIn=this.nextLook();}}
    else if(this.interestTime>0){this.interestTime-=dt;g.targetAngle=Math.atan2(this.interest.y-g.y,this.interest.x-g.x);if(this.interestTime<=0){const source=this.interest;this.interest=null;this.glanceIn=this.nextLook();this.afterInvestigation(source);if(this.state==='SUSPICIOUS'&&this.random()<.6)this.chooseActivity();}}
    else if(this.glance){
      this.glance.time-=dt;
      if(this.glance.time>this.difficulty.glanceSweep){this.behavior='他似乎要回頭了';this.bubble='……';}
      else {g.targetAngle=this.glance.angle;this.behavior='短暫回頭';}
      if(this.glance.time<=0){this.glance=null;this.glanceIn=this.nextLook();}
    }else{
      this.glanceIn-=dt;
      if(this.glanceIn<=0){this.glance={time:this.difficulty.glanceTelegraph+this.difficulty.glanceSweep,angle:g.angle+(this.random()<.5?-1:1)*(1.2+this.random()*.9)};}
      else if(this.path.length){
        const target=this.path[0],d=distance(g,target);
        if(d<3)this.path.shift();else {g.targetAngle=Math.atan2(target.y-g.y,target.x-g.x);const speed=this.state==='SUSPICIOUS'?this.difficulty.suspiciousSpeed:this.difficulty.activitySpeed;move(g,Math.cos(g.targetAngle)*Math.min(d,speed*dt),Math.sin(g.targetAngle)*Math.min(d,speed*dt),17);}
      }else {g.targetAngle=stations[this.destination].face;this.behavior=stations[this.destination].name;this.dwell-=dt;if(this.dwell<=0)this.chooseActivity();}
    }
    const delta=angleDiff(g.targetAngle,g.angle);g.angle+=Math.sign(delta)*Math.min(Math.abs(delta),dt*(this.state==='CALM'?this.difficulty.calmTurnSpeed:this.difficulty.turnSpeed));
    if(!this.warning&&!this.glance)this.bubble=this.state==='CALM'?'……':this.state==='CURIOUS'?'？':'……？';
  }
}
