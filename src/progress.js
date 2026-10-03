const KEY='catch-xavier.progress.v1';
export function readProgress(storage){try{const v=JSON.parse(storage.getItem(KEY)||'{}');return {perfect:Object.fromEntries(['RELAXED','CANON','COMMANDER','XAVIER'].filter(id=>v.perfect?.[id]===true).map(id=>[id,true]))};}catch{return {perfect:{}};}}
export function isUnlocked(id,progress){return id!=='XAVIER'||progress.perfect.COMMANDER===true;}
export function recordResult(storage,game){
 const progress=readProgress(storage);
 if(!game.debugRun&&game.result==='PERFECT'){progress.perfect[game.difficulty.id]=true;try{storage.setItem(KEY,JSON.stringify(progress));}catch{/* Private browsing: the run still works. */}}
 return progress;
}
