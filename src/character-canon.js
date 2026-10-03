// XAVIER_CANON_HAIR_ORIENTATION_LOCKED
// character-right eye = partially covered; character-left eye = fully visible.
// front: screen-left = longer fringe, screen-right = exposed eye.
// Never use whole-art mirroring to change facing or to repair a noncompliant asset.
export const XAVIER_CANON_HAIR_ORIENTATION_LOCKED = true;
export const XAVIER_LOCKED_ASSETS = new Set(['xavier','xavierTitle','xavierWalk','endings']);
export function assertCanonTransform(context,key,width,height) {
  if(!XAVIER_LOCKED_ASSETS.has(key))return;
  const {a,b,c,d}=context.getTransform();
  if(a*d-b*c<0 || width<0 || height<0)throw new Error(`XAVIER_CANON_HAIR_ORIENTATION_LOCKED: reflected artwork ${key}`);
}
