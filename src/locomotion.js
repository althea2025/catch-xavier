// Presentation only: integrate distance travelled, never intended velocity or AI path length.
export class Locomotion {
  constructor(){this.previous=null;this.phase=0;this.moving=false;this.mode='idle';}
  update(p,time,mode='walk',enabled=true){
    const previous=this.previous;this.previous={x:p.x,y:p.y,time};
    if(!previous)return this;
    const dt=time-previous.time,travel=Math.hypot(p.x-previous.x,p.y-previous.y);
    if(!enabled||dt<0||travel>80){this.phase=0;this.moving=false;this.mode='idle';return this;}
    if(dt===0)return this;
    this.moving=travel>.01;this.mode=this.moving?mode:'idle';
    if(this.moving)this.angle=Math.atan2(p.y-previous.y,p.x-previous.x);
    if(!this.moving)this.phase=0;
    else this.phase=(this.phase+travel/({sneak:24,walk:40,sprint:52}[mode]||40))%1;
    return this;
  }
  get row(){return [1,0,1,2][Math.floor(this.phase*4)%4];}
}
