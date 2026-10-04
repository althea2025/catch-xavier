import {downloadBytes} from './download.js?v=20261005-passages28';
// Resolve from the module, never from the domain root or the document URL.
export const assetURL=(path,base=import.meta.url)=>new URL('../'+path,base);
export async function loadImage(url,{timeout=45000,attempts=2,imageFactory=()=>new Image(),fetchImpl,onProgress=()=>{}}={}){
 let failure;
 for(let attempt=1;attempt<=attempts;attempt++){
  const request=new URL(url);
  if(attempt>1)request.searchParams.set('retry',String(attempt));
  let objectURL;
  try{
   const {buffer,type}=await downloadBytes(request,{timeout,fetchImpl,onProgress});
   objectURL=URL.createObjectURL(new Blob([buffer],{type}));
   return await new Promise((resolve,reject)=>{
   const image=imageFactory();let settled=false;
   const finish=(error)=>{
    if(settled)return;settled=true;clearTimeout(timer);image.onload=image.onerror=null;
    if(error){image.src='';reject(new Error(`${request.href}: ${error}`));}else resolve(image);
   };
   const timer=setTimeout(()=>finish(`image load timed out after ${timeout} ms`),timeout);
   image.onload=()=>finish(image.naturalWidth&&image.naturalHeight?null:'empty image');
   image.onerror=()=>finish('image request or decoding failed (check Network status / MIME)');
   try{image.src=objectURL;}catch(error){finish(error.message);}
  });}catch(error){failure=error;console.warn('[Catch Xavier] Asset attempt failed',attempt,request.href,error);}finally{if(objectURL)URL.revokeObjectURL(objectURL);}
 }
 throw failure;
}
