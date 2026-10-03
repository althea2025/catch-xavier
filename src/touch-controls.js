// Each pointer owns its own press. Releasing one finger cannot cancel another.
export class TouchControls {
  constructor(state){this.state=state;this.pointers=new Map();this.buttons=new Set();}
  sync(){
    let x=0,y=0,sprint=false;
    for(const press of this.pointers.values()){
      x+=press.vector?.[0]||0;y+=press.vector?.[1]||0;sprint||=!!press.sprint;
    }
    Object.assign(this.state,{x:Math.sign(x),y:Math.sign(y),sprint});
    for(const button of this.buttons)button.classList.toggle('pressed',[...this.pointers.values()].some(p=>p.button===button));
  }
  release(id){
    const press=this.pointers.get(id);if(!press)return;
    this.pointers.delete(id);this.sync();
    try{if(press.button.hasPointerCapture(id))press.button.releasePointerCapture(id);}catch{/* The browser may already have cancelled capture. */}
  }
  clear(){for(const id of [...this.pointers.keys()])this.release(id);this.sync();}
  bind(button,{vector,sprint=false,action,enabled=()=>true}={}){
    this.buttons.add(button);
    // Safari text gestures also have Touch Events defaults. Cancel them only on
    // controls; Pointer Events remain the sole source of gameplay actions.
    guardGameSelection(button);
    for(const type of ['touchstart','touchmove'])button.addEventListener(type,event=>{
      if(event.cancelable)event.preventDefault();
    },{passive:false});
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0||button.disabled||!enabled())return;
      event.preventDefault();
      this.pointers.set(event.pointerId,{button,vector,sprint});
      try{button.setPointerCapture(event.pointerId);}catch{this.release(event.pointerId);return;}
      this.sync();action?.();
    },{passive:false});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>this.release(event.pointerId));
    // Pointer actions already ran on down. Keep keyboard/assistive activation once.
    button.addEventListener('click',event=>{
      event.preventDefault();
      if(event.detail===0&&!event.pointerType&&!button.disabled&&enabled())action?.();
    });
  }
}
export function guardGameSelection(region){
  for(const type of ['selectstart','contextmenu','dragstart'])region.addEventListener(type,event=>event.preventDefault(),{passive:false});
}
