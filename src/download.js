// Timeout means a stalled transfer, not a total time budget for a slow connection.
export async function downloadBytes(url,{timeout=45000,fetchImpl=(...args)=>fetch(...args),onProgress=()=>{},maxDuration=0}={}){
 const controller=new AbortController();let timer,totalTimer,rejectStall;
 const stalled=new Promise((_,reject)=>{rejectStall=reject;});
 const progress=()=>{clearTimeout(timer);timer=setTimeout(()=>{controller.abort();rejectStall(new Error(`${url}: no download progress for ${timeout} ms`));},timeout);};
 progress();
 if(maxDuration>0)totalTimer=setTimeout(()=>{controller.abort();rejectStall(new Error(`${url}: download exceeded ${maxDuration} ms`));},maxDuration);
 try{return await Promise.race([(async()=>{
  const response=await fetchImpl(url,{signal:controller.signal});
  if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
  progress();
  const total=Number(response.headers?.get('content-length'))||0,type=response.headers?.get('content-type')||'';
  if(!response.body?.getReader){const buffer=await response.arrayBuffer();onProgress({loaded:buffer.byteLength,total});return {buffer,type};}
  const reader=response.body.getReader(),chunks=[];let loaded=0;
  while(true){const {done,value}=await reader.read();if(done)break;if(value.byteLength){chunks.push(value);loaded+=value.byteLength;progress();onProgress({loaded,total});}}
  const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return {buffer:bytes.buffer,type};
 })(),stalled]);}
 finally{clearTimeout(timer);clearTimeout(totalTimer);}
}
// Avoid launching every large atlas at once on constrained browser connections.
export async function loadWithConcurrency(items,load,limit=2){
 let next=0,failed=false;
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
  while(!failed&&next<items.length){const item=items[next++];try{await load(item);}catch(error){failed=true;throw error;}}
 }));
}
