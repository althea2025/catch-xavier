import {heartbeatProximity} from './audio-proximity.js?v=20261002-holdsprint26';
import {TouchControls,guardGameSelection} from './touch-controls.js?v=20261002-holdsprint26';
import {DIFFICULTIES} from './difficulty.js?v=20261002-holdsprint26';
import {readProgress,isUnlocked,recordResult} from './progress.js?v=20261002-holdsprint26';
import {Game} from './engine.js?v=20261002-holdsprint26';
import {Renderer} from './render.js?v=20261002-holdsprint26';
import {Audio} from './audio.js?v=20261002-holdsprint26';
import {loadAssets} from './assets.js?v=20261002-holdsprint26';
import {props,distance,surface,route} from './world.js?v=20261002-holdsprint26';
const $=id=>document.getElementById(id),canvas=$('game');
const debugMode=false;
const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
let selectedDifficulty='CANON',progress=readProgress(storage),recorded=false;
const game=new Game(),renderer=new Renderer(canvas),audio=new Audio();
let assetsReady=false;
export const ready=loadAssets(progress=>{window.dispatchEvent(new Event('game-load-progress'));if($('fatal').hidden)$('start').textContent=`正在準備書房…… ${Math.round(progress*100)}%`;}).then(assets=>{renderer.setAssets(assets);assetsReady=true;});
const keys=new Set();let running=false,paused=false,last=0,accumulator=0,uiClock=0,attempt=0,endingShown=false;
const touch={x:0,y:0,sprint:false};
const touchControls=new TouchControls(touch);
guardGameSelection($('play'));
let walkPath=[];
let endingKey='';
function clearInput(){keys.clear();walkPath=[];game.walkTarget=null;touchControls.clear();}
function start(){if(!assetsReady)return;game.reset(selectedDifficulty);game.debugRun=debugMode;recorded=false;accumulator=0;renderer.reset();attempt++;running=true;paused=false;endingShown=false;endingKey='';clearInput();$('difficulty-dialog').hidden=true;$('title').hidden=true;$('tutorial').hidden=true;$('paused').hidden=true;$('ending').hidden=true;$('play').hidden=false;audio.lastHeart=0;canvas.focus({preventScroll:true});window.scrollTo(0,0);updateUI();}
function setPause(value){if(!running||game.phase!=='play')return;paused=value;clearInput();$('pause-difficulty').textContent=`目前難度：${game.difficulty.title}｜${game.difficulty.label}`;$('paused').hidden=!paused||!$('difficulty-dialog').hidden||!$('tutorial').hidden;if(!paused)canvas.focus();}
function showDifficulty(){
  if(running)paused=true;clearInput();$('paused').hidden=true;$('ending').hidden=true;
  progress=readProgress(storage);selectedDifficulty=game.difficulty.id;
  if(!debugMode&&!isUnlocked(selectedDifficulty,progress))selectedDifficulty='CANON';
  $('difficulty-dialog').hidden=false;renderDifficulty();$('difficulty-confirm').focus();
}
function renderDifficulty(){
 $('difficulty-options').replaceChildren(...Object.values(DIFFICULTIES).map(p=>{
  const button=document.createElement('button');button.className='difficulty-option';button.type='button';button.setAttribute('role','radio');button.setAttribute('aria-checked',String(p.id===selectedDifficulty));button.disabled=!debugMode&&!isUnlocked(p.id,progress);
  const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=`${p.icon} ${p.id==='XAVIER'?'XAVIER':p.label+' · '+p.title}${button.disabled?' · 未解鎖':''}`;small.textContent=p.description;button.append(strong,small);button.onclick=()=>{selectedDifficulty=p.id;renderDifficulty();$('difficulty-options').querySelector('[aria-checked="true"]').focus();};return button;
 }));
 $('difficulty-lock').textContent=progress.perfect.COMMANDER?'XAVIER 挑戰已解鎖。':'統帥 COMMANDER 達成 PERFECT 後，解鎖 XAVIER 挑戰。';
}
$('start').onclick=showDifficulty;
$('change-difficulty').onclick=showDifficulty;$('result-difficulty').onclick=showDifficulty;
$('difficulty-cancel').onclick=()=>{$('difficulty-dialog').hidden=true;selectedDifficulty=game.difficulty.id;if(running){if(game.result){$('ending').hidden=false;paused=false;}else setPause(true);}else $('start').focus();};
$('difficulty-confirm').onclick=()=>{if(!debugMode&&!isUnlocked(selectedDifficulty,progress))return;$('difficulty-dialog').hidden=true;$('tutorial').hidden=false;$('begin').focus();};
$('begin').onclick=start;$('retry').onclick=start;$('restart').onclick=start;
$('resume').onclick=()=>setPause(false);
function updateSound(){
  $('sound').textContent=!audio.enabled?'聲音・關':audio.context?.state!=='running'?'點一下啟用聲音':audio.musicState==='loading'?(audio.musicStage==='decode'?'正在處理音樂…':`${audio.musicAttempt>1?'重試下載':'音樂下載'}${audio.musicProgress===null?'中…':` ${audio.musicProgress}%`}`):audio.musicState==='error'?'音效・開／音樂未載入':'聲音・開';
  $('sound').title=audio.musicState==='error'?'背景音樂載入失敗，可關閉聲音再開啟重試。':'切換背景音樂與音效';
}
audio.onMusicState=updateSound;
// Restore interrupted output on user input without changing the user's sound preference.
window.addEventListener('pointerup',()=>audio.resumeFromGesture());
window.addEventListener('keydown',()=>audio.resumeFromGesture());
guardGameSelection($('sound'));
guardGameSelection(document.querySelector('.topbar .brand'));
touchControls.bind($('sound'),{action:()=>{try{if(audio.enabled&&audio.context?.state!=='running')audio.resumeFromGesture();else audio.toggle();updateSound();}catch{$('sound').textContent='此裝置無法播放聲音';}}});



$('skip').onclick=()=>{game.phase='result';game.resultTime=12;updateEnding();};
window.addEventListener('keydown',e=>{
  if(!running||!$('difficulty-dialog').hidden||!$('tutorial').hidden)return;
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab'].includes(k)&&!paused&&game.phase==='play')e.preventDefault();
  if(k==='escape'&&!e.repeat){setPause(!paused);return;}
  if(paused)return;
  if(game.phase!=='play'){if(k==='r'&&!e.repeat)start();return;}
  keys.add(k);
  if(!e.repeat){if(k==='c'){game.sneaking=!game.sneaking;}if(k==='q')game.magic();if(k==='e')game.interact();if(k==='tab')game.selectNext();}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{clearInput();setPause(true);});
window.addEventListener('pagehide',()=>{clearInput();setPause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();setPause(true);}});
const canControl=()=>running&&!paused&&game.phase==='play'&&$('difficulty-dialog').hidden&&$('tutorial').hidden;
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
for(const button of document.querySelectorAll('[data-move]'))touchControls.bind(button,{vector:dirs[button.dataset.move],enabled:canControl});
touchControls.bind($('sprint'),{sprint:true,enabled:canControl});
touchControls.bind($('sneak'),{action:()=>{game.sneaking=!game.sneaking;updateUI();},enabled:canControl});
touchControls.bind($('hug'),{action:()=>game.interact(),enabled:canControl});
touchControls.bind($('magic'),{action:()=>game.magic(),enabled:canControl});
touchControls.bind($('pause'),{action:()=>setPause(true),enabled:canControl});
for(const type of ['pointerup','pointercancel'])window.addEventListener(type,event=>touchControls.release(event.pointerId),true);
canvas.onpointerdown=e=>{
  if(!canControl()||e.button!==0)return;
  e.preventDefault();
  const r=canvas.getBoundingClientRect(),p=renderer.screenToWorld({x:(e.clientX-r.left)*1120/r.width,y:(e.clientY-r.top)*720/r.height});
  const target=props.find(o=>distance(o,p)<30);if(target){game.selected=target.id;if(distance(game.player,target)>310)game.notify('這個物件太遠了，先靠近一點。');else game.notify(`已選擇${target.name}，按 Q 讓它發聲。`);}else{walkPath=route(game.player,p);game.walkTarget=walkPath.at(-1)||null;}canvas.focus({preventScroll:true});
};
function updateUI(){
  if($('reaction').textContent!==game.bubble){$('reaction').textContent=game.bubble;$('reaction').classList.remove('reaction-pop');void $('reaction').offsetWidth;$('reaction').classList.add('reaction-pop');}$('behavior').textContent=game.behavior;
  $('floor').textContent=surface(game.player).name;$('mode').textContent={sneak:'躡手躡腳',walk:'普通移動',sprint:'快速移動'}[game.mode];
  $('sneak').classList.toggle('active',game.sneaking);
  $('hint').textContent=game.hugAvailable?'就是現在！按 E，抱住他。':game.warning?'他的手停住了……最後兩步，要果斷。':game.state==='SUSPICIOUS'?'他開始留意四周。躲到家具後，等他放鬆。':game.state==='DISTRACTED'?'他正查看聲音，趁機換個位置。':game.state==='CURIOUS'?'他被聲音吸引了，留意他的視線。':'先找掩護，觀察他轉頭的時機。';
  $('objective').textContent=game.hugAvailable?'E · 抱住他！':'繞到背後，按 E 抱住他';
  $('cooldown').textContent=game.cooldown>0?`冷卻 ${Math.ceil(game.cooldown)} 秒`:game.magicTarget?`${game.magicTarget.name} · 準備好了`:'靠近地圖上的 ✧ 物件';
  $('magic').disabled=game.cooldown>0||paused||game.phase!=='play';
  $('toast').textContent=game.toast;$('toast').classList.toggle('visible',game.toastTime>0&&game.phase==='play');
}
const endings={
  PERFECT:{label:'完美偷襲・一個擁抱到手',title:'PERFECT',symbol:'♡',lines:[['安潔拉','成功了！']],note:'他愣住的那一瞬間，妳已經得意地環住他的腰。'},
  'SO CLOSE':{label:'只差兩步・怎麼又被發現了',title:'SO CLOSE',symbol:'…',lines:[['安潔拉','……'],['澤維爾','……'],['安潔拉','你就不能假裝沒發現嗎？']],note:'手都已經伸出去了……下次一定抱得到。'},
  CAUGHT:{label:'偷襲露餡・他已經看見妳了',title:'CAUGHT',symbol:'？',lines:[['澤維爾','妳躲在那裡做什麼？']],note:'藏好腳步，也藏好那個太明顯的小計畫。'},
  'COUNTER-CATCH':{label:'SECRET ENDING',title:'CAUGHT YOU',symbol:'♡',lines:[['安潔拉','成功了！'],['安潔拉','……？'],['澤維爾','這樣算妳贏？']],note:'他的手覆上妳環在腰間的手。這次，算你們都贏。'},
};
function updateEnding(){
  if(!game.result)return;
  if(!recorded){const wasUnlocked=progress.perfect.COMMANDER;progress=recordResult(storage,game);recorded=true;$('unlock-note').textContent=!wasUnlocked&&progress.perfect.COMMANDER?'◆ XAVIER 挑戰已解鎖。':game.debugRun?'QA 練習局，不寫入通關紀錄。':'';}
  const data=endings[game.result],t=game.resultTime,secret=game.result==='COUNTER-CATCH';
  if(t<.12&&game.phase!=='result')return;
  if(!endingShown){$('ending').hidden=false;endingShown=true;$('skip').focus();clearInput();}
  const count=game.phase==='result'?data.lines.length:Math.min(data.lines.length,Math.max(1,Math.floor((t-1.8)/2.5)+1));
  const key=[game.result,secret?(t<3.5?0:t<6?1:2):0,count,t>6,game.phase].join(':');
  if(key===endingKey)return;endingKey=key;
  $('ending').classList.toggle('counter-reveal',secret&&t>=6);
  $('ending-label').textContent=secret&&t<6?'完美的一瞬間……大概吧？':data.label;
  $('ending-title').textContent=secret&&t<3.5?'SUCCESS':secret&&t<6?'……？':data.title;
  $('ending-symbol').textContent=data.symbol;
  $('dialogue').replaceChildren(...data.lines.slice(0,count).map(([name,text])=>{const row=document.createElement('div'),b=document.createElement('b');b.textContent=name;row.append(b,document.createTextNode(text));return row;}));
  $('result-note').textContent=t>6?data.note:secret&&t>3.5?'他已經握住了妳的手。':' ';
  $('result-stats').hidden=game.phase!=='result';$('result-difficulty').hidden=game.phase!=='result';
  const stats=[['難度',game.difficulty.title],['結果',game.result],['時間',`${Math.floor(game.time/60)}:${String(Math.floor(game.time%60)).padStart(2,'0')}`],['魔法干擾',`${game.magicUses} 次`],['引起注意／懷疑',`${game.noticeCount} 次`],['最近距離',`${(game.closest/32).toFixed(1)} 公尺`]];
  $('result-stats').replaceChildren(...stats.map(([k,v])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;row.append(dt,dd);return row;}));
  $('retry').hidden=game.phase!=='result';$('skip').hidden=game.phase==='result';
  if(game.phase==='result')$('retry').focus({preventScroll:true});
  $('ending-meta').textContent=game.phase==='result'?`第 ${attempt} 次偷襲 · ${Math.floor(game.time/60)}:${String(Math.floor(game.time%60)).padStart(2,'0')} · R 立即重試`:'一段小小的插曲 · 可跳過演出／按 R 直接重試';
}
function frame(now){
  const elapsed=Math.min((now-last)/1000||0,.1);last=now;
  if(running&&!paused){accumulator+=elapsed;while(accumulator>=1/60){
    let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+touch.x,y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+touch.y;
    if(x||y){walkPath=[];game.walkTarget=null;}else if(walkPath.length){while(walkPath.length&&distance(game.player,walkPath[0])<4)walkPath.shift();if(walkPath.length){x=walkPath[0].x-game.player.x;y=walkPath[0].y-game.player.y;}else game.walkTarget=null;}
    game.update(1/60,{x,y,sprint:keys.has('shift')||touch.sprint});accumulator-=1/60;
  }for(const event of game.events.splice(0)){audio.event(event);renderer.onEvent(event);}if(game.phase!=='play')updateEnding();}
  const audioActive=running&&!paused&&game.phase==='play',proximity=audioActive?heartbeatProximity(game):0;
  audio.setScene(proximity,audioActive);
  if(audioActive)audio.heartbeat(game.time,proximity);
  renderer.draw(game,elapsed,!paused);
  if(!running)renderer.drawTitle($('title-actors'),elapsed);
  if(game.result)renderer.drawEnding($('ending-canvas'),game);
  uiClock+=elapsed;if(uiClock>.1){updateUI();uiClock=0;}requestAnimationFrame(frame);
}
window.addEventListener('error' ,()=>{$('fatal').hidden=false;});
requestAnimationFrame(frame);
