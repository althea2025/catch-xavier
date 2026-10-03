// Pure presentation decisions. None of these functions mutate gameplay state.
export const SPRITE_POSES = {
  angela: { idle:0, back:1, left:2, right:3, sneak:4, run:5, magic:6, hug:7 },
  xavier: { idle:0, back:1, left:2, right:3, read:4, listen:5, turn:6, suspicious:5, found:6, hug:7 },
};
export function facing(angle) {
  const x=Math.cos(angle),y=Math.sin(angle);
  return Math.abs(y)>Math.abs(x)?(y<0?'back':'front'):(x<0?'left':'right');
}
export function poseFor(game,who,magicAge=99) {
  if(who==='angela') {
    if(game.result==='PERFECT'||game.result==='COUNTER-CATCH')return 'hug';
    if(game.result==='SO CLOSE')return 'hug';
    if(magicAge<.8)return 'magic';
    if(!game.player.moving)return 'idle';
    return game.mode==='sprint'?'run':game.mode==='sneak'?'sneak':'walk';
  }
  if(game.result==='PERFECT'||game.result==='COUNTER-CATCH')return 'hug';
  if(game.result)return 'found';
  if(game.warning||game.state==='SUSPICIOUS')return 'suspicious';
  if(game.interestTime>0)return 'listen';
  if(game.doubleCheck)return game.doubleCheck.pause>0?'listen':'turn';
  if(game.glance)return 'turn';
  if(game.path.length)return 'walk';
  if(game.distraction)return 'listen';
  return /閱讀|看書|翻閱/.test(game.behavior)?'read':'idle';
}
export function frameFor(who,pose,direction) {
  const poses=SPRITE_POSES[who];
  if(direction==='back')return poses.back;
  if(pose==='walk'||pose==='idle')return direction==='front'?poses.idle:poses[direction];
  return poses[pose]??poses.idle;
}
export function worldToScreen(p,camera) {return {x:(p.x-camera.x)*camera.zoom+560,y:(p.y-camera.y)*camera.zoom+360};}
export function screenToWorld(p,camera) {return {x:(p.x-560)/camera.zoom+camera.x,y:(p.y-360)/camera.zoom+camera.y};}
export function depthKey(item) {return item.kind==='actor'?item.y:item.y+item.h;}
export function endingStage(result,time) {
  if(result==='COUNTER-CATCH')return time<3.5?'success':time<6?'pause':'counter';
  if(result==='PERFECT')return time<.65?'approach':time<1.6?'surprise':'hug';
  if(result==='SO CLOSE')return time<.3?'reach':time<1?'turn':'standoff';
  return time<.3?'notice':'caught';
}
