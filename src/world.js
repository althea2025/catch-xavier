export const WORLD = { width:1120, height:720, bounds:{x:42,y:70,w:1036,h:602}, scale:32 };
export const furniture = [
  {x:70,y:76,w:330,h:44,kind:'shelf',label:'藏書'},
  {x:595,y:76,w:200,h:44,kind:'shelf'},
  {x:250,y:208,w:60,h:185,passageInsetTop:24,kind:'shelf',label:'書架'},
  {x:468,y:170,w:62,h:186,passageInsetTop:24,kind:'shelf'},
  {x:792,y:182,w:214,h:78,kind:'desk',label:'書桌'},
  {x:535,y:484,w:174,h:66,kind:'sofa',label:'沙發'},
  {x:839,y:413,w:30,h:150,passageInsetTop:24,kind:'screen',label:'屏風'},
  {x:392,y:487,w:40,h:40,kind:'pillar'},
  {x:699,y:302,w:40,h:40,kind:'pillar'},
  {x:982,y:425,w:70,h:67,kind:'table',label:'茶桌'},
  {x:93,y:296,w:71,h:60,kind:'cabinet'},
];
export const rugs = [{x:80,y:400,w:245,h:222},{x:556,y:355,w:233,h:258},{x:768,y:282,w:256,h:105}];
export const stone = {x:913,y:90,w:163,h:554};
export const props = [
  {id:'book',x:280,y:224,name:'書本',sound:340,kind:'book'},
  {id:'paper',x:839,y:209,name:'紙張',sound:345,kind:'paper'},
  {id:'tea',x:1013,y:445,name:'茶具',sound:370,kind:'tea'},
  {id:'vase',x:493,y:193,name:'花瓶',sound:365,kind:'vase'},
];
export const stations = [
  {x:894,y:307,face:-Math.PI/2,name:'閱讀文件',duration:13},
  {x:350,y:285,face:Math.PI,name:'挑選一本書',duration:10},
  {x:630,y:439,face:Math.PI/2,name:'安靜看書',duration:15},
  {x:1001,y:352,face:0,name:'望向窗外',duration:11},
  {x:645,y:161,face:-Math.PI/2,name:'翻閱藏書',duration:10},
  {x:582,y:273,face:Math.PI,name:'停下思考',duration:8},
];
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export const angleDiff = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function inside(p,r) { return p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h; }
// The three tall furnishings project over open floor at their north ends.
// Movement uses their ground footprint; artwork and sight occlusion stay unchanged.
export function movementFootprint(o) {
  const inset=o.passageInsetTop||0;
  return {...o,y:o.y+inset,h:o.h-inset};
}
export function blocked(x,y,r=15) {
  const b=WORLD.bounds;
  if(x-r<b.x||x+r>b.x+b.w||y-r<b.y||y+r>b.y+b.h) return true;
  return furniture.map(movementFootprint).some(o=>Math.hypot(x-Math.max(o.x,Math.min(x,o.x+o.w)),y-Math.max(o.y,Math.min(y,o.y+o.h)))<r);
}
export function move(body,dx,dy,r=15) {
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
  for(let i=0;i<n;i++) { if(!blocked(body.x+dx/n,body.y,r)) body.x+=dx/n; if(!blocked(body.x,body.y+dy/n,r)) body.y+=dy/n; }
}
export function segmentRect(a,b,r) {
  let lo=0,hi=1;
  for(const [p,d,min,max] of [[a.x,b.x-a.x,r.x,r.x+r.w],[a.y,b.y-a.y,r.y,r.y+r.h]]) {
    if(Math.abs(d)<1e-9) { if(p<min||p>max) return false; }
    else {const t1=(min-p)/d,t2=(max-p)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;}
  }
  return true;
}
export function visible(a,b) {return !furniture.some(r=>segmentRect(a,b,r));}
export function surface(p) {return rugs.some(r=>inside(p,r))?{name:'柔軟地毯',noise:.45}:inside(p,stone)?{name:'石材地面',noise:1.4}:{name:'木地板',noise:1};}
// A* uses a collision-inflated 24 px navigation grid. Both actors share collision geometry.
export function route(from,to) {
  const size=24,cols=Math.ceil(WORLD.width/size),rows=Math.ceil(WORLD.height/size);
  const point=id=>({x:(id%cols)*size+size/2,y:Math.floor(id/cols)*size+size/2});
  const nearest=p=>{
    let best=-1,score=Infinity;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const id=y*cols+x,q=point(id),d=distance(p,q);if(d<score&&!blocked(q.x,q.y,18)&&!furniture.some(o=>segmentRect(p,q,movementFootprint(o)))){best=id;score=d;}}
    return best;
  };
  const start=nearest(from),end=nearest(to);if(start<0||end<0)return [];
  const open=new Set([start]),came=new Map(),g=new Map([[start,0]]),f=new Map([[start,distance(point(start),point(end))]]);
  while(open.size) {
    let current=[...open].reduce((a,b)=>f.get(a)<f.get(b)?a:b);
    if(current===end){const ids=[current];while(came.has(current)){current=came.get(current);ids.unshift(current);}const points=ids.map(point);if(!blocked(to.x,to.y,18))points.push({...to});return points;}
    open.delete(current);const cx=current%cols,cy=Math.floor(current/cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=cols||y>=rows)continue;
      const id=y*cols+x,p=point(id);if(blocked(p.x,p.y,18))continue;
      const cost=g.get(current)+size;
      if(cost<(g.get(id)??Infinity)){came.set(id,current);g.set(id,cost);f.set(id,cost+distance(p,point(end)));open.add(id);}
    }
  }
  return [];
}
