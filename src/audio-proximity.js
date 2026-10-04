import {distance,visible,WORLD} from './world.js?v=20261005-passages28';
// Presentation only: never reuse visual suspicion as a heartbeat trigger.
export function heartbeatProximity(game){
  if(game.phase!=='play'||!game.rear||!visible(game.xavier,game.player))return 0;
  const radius=2.75*WORLD.scale,d=distance(game.player,game.xavier);
  if(d>=radius)return 0;
  return Math.min(1,Math.max(0,(radius-d)/(radius-game.difficulty.hugWindow)));
}
