import {loadWithConcurrency} from './download.js?v=20261005-screenpass29';
import {loadImage,assetURL} from './asset-loader.js?v=20261005-screenpass29';
import {assertCanonTransform} from './character-canon.js?v=20261005-screenpass29';
export const ASSET_FILES={
  xavierTitle:'assets/generated/polish/xavier-title-composed.3f00b6e575.svg',
  angelaWalk:'assets/generated/polish/angela-walk.7cc0c8c6f8.webp',
  xavierWalk:'assets/generated/polish/xavier-legs.9086529953.webp',
  angela:'assets/generated/polish/angela-atlas.b81f688b4a.webp',
  xavier:'assets/generated/polish/xavier-atlas.0b768c4202.webp',
  furniture:'assets/generated/polish/furniture-atlas.722369bbfc.webp',
  endings:'assets/generated/polish/endings-canon-shoes.8eaeaa1c27.webp',
};
export class Atlas {
  constructor(image,columns,rows,regions=null){
    this.image=image;this.columns=columns;this.rows=rows;this.frames=[];
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
    const {data}=c.getImageData(0,0,canvas.width,canvas.height),cw=canvas.width/columns,ch=canvas.height/rows;
    // Trim only the transparent atlas gutter at runtime. Original PNGs stay untouched.
    for(let n=0;n<columns*rows;n++){
      const region=regions?.[n],sx=region?.[0]??Math.floor(n%columns*cw),sy=region?.[1]??Math.floor(Math.floor(n/columns)*ch),rw=region?.[2]??cw,rh=region?.[3]??ch;let left=sx+rw,top=sy+rh,right=sx,bottom=sy;
      for(let y=sy+2;y<Math.min(canvas.height,sy+rh-2);y++)for(let x=sx+2;x<Math.min(canvas.width,sx+rw-2);x++)if(data[(y*canvas.width+x)*4+3]>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      this.frames.push(right>=left?{x:left,y:top,w:right-left+1,h:bottom-top+1}:{x:sx,y:sy,w:cw,h:ch});
    }
  }
  band(index,from,to){
    const f=this.frames[index],canvas=document.createElement('canvas');canvas.width=f.w;canvas.height=f.h;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(this.image,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const {data}=c.getImageData(0,0,f.w,f.h);let left=f.w,right=0;
    for(let y=Math.floor(f.h*from);y<Math.ceil(f.h*to);y++)for(let x=0;x<f.w;x++)if(data[(y*f.w+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);}
    return {center:(left+right)/2,width:Math.max(1,right-left)};
  }
  draw(c,index,x,y,w,h){assertCanonTransform(c,this.key,w,h);const f=this.frames[index];if(f)c.drawImage(this.image,f.x,f.y,f.w,f.h,x,y,w,h);}
  character(c,index,x,feet,height){const f=this.frames[index],w=height*f.w/f.h;this.draw(c,index,x-w/2,feet-height,w,height);}
}
export async function loadAssets(onProgress=()=>{}) {
  const result={},fractions={};
  await loadWithConcurrency(Object.entries(ASSET_FILES),async([key,url])=>{
    const image=await loadImage(assetURL(url,import.meta.url),{onProgress:({loaded,total})=>{
      fractions[key]=total?Math.min(.95,loaded/total):0;
      onProgress(Object.values(fractions).reduce((sum,n)=>sum+n,0)/Object.keys(ASSET_FILES).length);
    }});
    const walking=key.endsWith('Walk');
    const boundaries=key==='xavierWalk'?[0,362,724,1086]:[0,373,719,1086];
    const regions=walking?Array.from({length:12},(_,n)=>[key==='angelaWalk'?[70,410,740,1080][n%4]:Math.floor(n%4*image.naturalWidth/4),boundaries[Math.floor(n/4)],key==='angelaWalk'?[325,295,300,330][n%4]:Math.floor(image.naturalWidth/4),boundaries[Math.floor(n/4)+1]-boundaries[Math.floor(n/4)]]):key==='furniture'?[
      [6,70,355,265],[407,0,128,340],[572,85,350,260],[926,75,328,264],
      [85,337,184,318],[385,361,149,287],[633,383,267,272],[969,367,282,278],
      [0,670,358,270],[370,650,221,302],[641,652,260,291],[975,660,279,279],
      [0,973,338,270],[338,974,306,280],[653,946,286,283],[957,940,297,309],
    ]:null;
    result[key]=new Atlas(image,key==='xavierTitle'?1:key==='endings'?2:4,key==='xavierTitle'?1:key==='furniture'?4:walking?3:2,regions);result[key].key=key;fractions[key]=1;onProgress(Object.values(fractions).reduce((sum,n)=>sum+n,0)/Object.keys(ASSET_FILES).length);
  });
  // Match trouser waistband to the approved body's hip anchor, not PNG center.
  result.xavierLegAnchors=result.xavierWalk.frames.map((f,n)=>{
    const dir=n%4,original=result.xavier.frames[dir],hip=result.xavier.band(dir,dir<2?.65:.59,dir<2?.67:.61),waist=result.xavierWalk.band(n,.025,.07);
    return {source:waist.center,sourceWidth:waist.width,target:(hip.center-original.w/2)/original.h,targetWidth:hip.width/original.h};
  });
  return result;
}
