import {downloadBytes} from './download.js?v=20261005-passages28';
// Original locally rendered piano BGM + independent gameplay SFX. No noise ambience.
// Presentation mixing never changes sound detection.
export class Audio {
  constructor({fetchMusic=(...args)=>fetch(...args),musicTimeout=30000,musicMaxDuration=60000,musicDecodeTimeout=15000}={}){
    this.enabled=false;this.context=null;this.lastHeart=0;this.tension=0;this.sceneActive=false;
    this.musicMaxDuration=musicMaxDuration;this.musicDecodeTimeout=musicDecodeTimeout;this.musicProgress=0;this.musicStage='idle';this.musicAttempt=0;
    this.fetchMusic=fetchMusic;this.musicTimeout=musicTimeout;this.musicState='idle';this.onMusicState=()=>{};
  }
  init(){
    if(this.context)return;
    const c=this.context=new (window.AudioContext||window.webkitAudioContext)();
    this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
    c.onstatechange=()=>this.onMusicState();
    this.music=c.createGain();this.music.gain.value=0;this.music.connect(this.master);
  }
  loadMusic(){
    if(this.musicBuffer||this.musicState==='loading')return this.musicReady;
    const musicURL=new URL('../assets/audio/afternoon-mischief.m4a',import.meta.url);
    this.musicState='loading';this.musicError=null;this.onMusicState();
    this.musicReady=(async()=>{
      for(let attempt=0;attempt<2;attempt++){
        const url=new URL(musicURL);if(attempt)url.searchParams.set('retry',String(attempt));
        this.musicAttempt=attempt+1;this.musicStage='download';this.musicProgress=0;this.onMusicState();
        try{
          const {buffer}=await downloadBytes(url,{timeout:this.musicTimeout,fetchImpl:this.fetchMusic,maxDuration:this.musicMaxDuration,onProgress:({loaded,total})=>{this.musicProgress=total?Math.min(100,Math.floor(loaded/total*100)):null;this.onMusicState();}});
          this.musicStage='decode';this.onMusicState();
          let decodeTimer;
          try{this.musicBuffer=await Promise.race([this.context.decodeAudioData(buffer),new Promise((_,reject)=>{decodeTimer=setTimeout(()=>reject(new Error(`BGM decode timed out: ${url.href}`)),this.musicDecodeTimeout);})]);}
          finally{clearTimeout(decodeTimer);}
          this.musicState='ready';this.musicError=null;this.startMusic();this.onMusicState();return;
        }catch(error){this.musicError=error.message;console.warn('[Catch Xavier] BGM attempt failed',url.href,error);}

      }
      this.musicState='error';this.onMusicState();
    })();
    return this.musicReady;
  }
  startMusic(){
    if(!this.enabled||!this.musicBuffer||this.musicSource)return;
    const source=this.context.createBufferSource();source.buffer=this.musicBuffer;
    source.loop=true;source.loopStart=0;source.loopEnd=this.musicBuffer.duration;
    source.connect(this.music);source.start();this.musicSource=source;
  }
  resumeFromGesture(){
    if(!this.enabled||!this.context||this.context.state==='running')return;
    // Retry only from a real input event, including after Safari interrupts audio.
    try{
      this.context.resume().then(()=>{this.onMusicState();this.startMusic();}).catch(error=>{
        console.warn('[Catch Xavier] AudioContext resume failed',this.context.state,error);
        this.onMusicState();
      });
    }catch(error){console.warn('[Catch Xavier] AudioContext resume failed',error);this.onMusicState();}
  }
  toggle(){
    this.init();this.enabled=!this.enabled;
    if(this.enabled){this.resumeFromGesture();this.loadMusic();this.startMusic();}
    this.master.gain.setTargetAtTime(this.enabled?.6:0,this.context.currentTime,.06);
    return this.enabled;
  }
  setScene(tension,active){
    this.tension=Math.max(0,Math.min(1,tension));this.sceneActive=active;
    // Same romantic score throughout; proximity only ducks it by at most 28%.
    if(this.context)this.music.gain.setTargetAtTime(active?.35*(1-this.tension*.28):0,this.context.currentTime,.4);
  }
  tone(frequency,duration=.15,volume=.06,type='sine',delay=0){if(!this.enabled||!this.context)return;const c=this.context,osc=c.createOscillator(),gain=c.createGain(),now=c.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(frequency,now);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(this.master);osc.start(now);osc.stop(now+duration);}
  event(e){
    if(e.type==='step'){const v=(e.mode==='sneak'?.022:.035)*(1+this.tension*.8);// Short shoe taps stay above the heartbeat's bass register, including on phone speakers.
      this.tone(e.mode==='sprint'?280:340,.035,v*.65,'triangle');this.tone(820,.018,v*.18,'sine',.006);}
    if(e.type==='magic')[659,880,1174].forEach((n,i)=>this.tone(n,.38,.047,'sine',i*.08));
    if(e.type==='notice'){this.tone(523,.12,.023);this.tone(698,.19,.018,'sine',.07);}
    if(e.type==='caught'){this.tone(65,.14,.13);this.tone(59,.13,.09,'sine',.13);this.tone(220,.29,.06);this.tone(164,.45,.045,'sine',.18);}
    if(e.type==='success')[523,659,784,1046].forEach((n,i)=>this.tone(n,.65,.065,'sine',i*.13));
  }
  heartbeat(time,tension){if(tension>.02&&time-this.lastHeart>(1.2-tension*.55)){this.lastHeart=time;this.tone(70,.14,.045+tension*.06);this.tone(62,.12,.025+tension*.045,'sine',.17);}}
}
