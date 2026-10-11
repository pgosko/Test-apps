/* ui/gestures.js — Pointer/touch/wheel interaction (view pan/zoom, position drag/pinch). */
/* ---------- interaction ----------
   Normal: 1 finger pans the VIEW, pinch/scroll zooms the view, tap samples a colour.
   Position mode: 1 finger moves the IMAGE behind the fixed canvas, pinch scales + rotates it, scroll scales (Shift/Alt+scroll rotates). */
const ptrs=new Map();let gest=null,lastTap=0,wheelT=0;
const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*dpr,y:(e.clientY-r.top)*dpr};};
function zoomAt(ax,ay,z){if(!origData)return;z=clamp(z,0.5,12);const R=imageRect(),ix=(ax-R.x)/R.s,iy=(ay-R.y)/R.s;view.zoom=z;const R2=imageRect();view.px+=ax-(R2.x+ix*R2.s);view.py+=ay-(R2.y+iy*R2.s);render();}
function resetView(){view.zoom=1;view.px=view.py=0;render();}
/* similarity transform of the placed image about a screen anchor (f = scale factor, da = radians) */
function placeAbout(ax,ay,f,da,dx,dy){
  const P=S.place,R=posRect(),cx=R.x+P.cx*R.w,cy=R.y+P.cy*R.h,vx=cx-ax,vy=cy-ay,co=Math.cos(da),si=Math.sin(da);
  const nx=ax+(dx||0)+f*(vx*co-vy*si),ny=ay+(dy||0)+f*(vx*si+vy*co);
  P.cx=(nx-R.x)/R.w;P.cy=(ny-R.y)/R.h;P.s*=f;P.rot=normRot(P.rot+da*180/Math.PI);P.auto=false;clampScale();
}
cv.addEventListener('pointerdown',e=>{
  try{cv.setPointerCapture(e.pointerId);}catch(_){}const p=pos(e);ptrs.set(e.pointerId,p);
  if(ptrs.size===1)gest={type:'one',sx:p.x,sy:p.y,lx:p.x,ly:p.y,t:performance.now(),moved:false};
  else if(ptrs.size===2){const ids=[...ptrs.keys()].slice(0,2),a=ptrs.get(ids[0]),b=ptrs.get(ids[1]);
    gest={type:'two',ids,pa:{...a},pb:{...b},d0:Math.hypot(a.x-b.x,a.y-b.y)||1,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,z0:view.zoom,acc:0,rotOn:false,moved:true};}
  if(posMode){posGest=true;}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId)||!gest)return;const p=pos(e);ptrs.set(e.pointerId,p);
  if(gest.type==='one'){const dx=p.x-gest.lx,dy=p.y-gest.ly;gest.lx=p.x;gest.ly=p.y;
    if(!gest.moved&&Math.hypot(p.x-gest.sx,p.y-gest.sy)>6*dpr)gest.moved=true;if(!gest.moved)return;
    if(posMode&&src){const R=posRect();S.place.cx+=dx/R.w;S.place.cy+=dy/R.h;S.place.auto=false;syncPosBar();}
    else{view.px+=dx;view.py+=dy;}
    render();}
  else if(gest.type==='two'){const a=ptrs.get(gest.ids[0]),b=ptrs.get(gest.ids[1]);if(!a||!b)return;
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    if(posMode&&src){const pa=gest.pa,pb=gest.pb,d0=Math.hypot(pb.x-pa.x,pb.y-pa.y)||1,d1=Math.hypot(b.x-a.x,b.y-a.y)||1;
      let da=Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(pb.y-pa.y,pb.x-pa.x);if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;
      gest.acc+=da;if(!gest.rotOn&&Math.abs(gest.acc)>0.1)gest.rotOn=true;   // ~6° dead zone so pure pinches don't rotate
      placeAbout((pa.x+pb.x)/2,(pa.y+pb.y)/2,d1/d0,gest.rotOn?da:0,mx-(pa.x+pb.x)/2,my-(pa.y+pb.y)/2);
      gest.pa={...a};gest.pb={...b};syncPosBar();render();}
    else{view.px+=mx-gest.mx;view.py+=my-gest.my;zoomAt(mx,my,gest.z0*Math.hypot(a.x-b.x,a.y-b.y)/gest.d0);}
    gest.mx=mx;gest.my=my;}
});
function endPtr(e){
  if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId);ptrs.delete(e.pointerId);
  if(gest&&gest.type==='one'&&!gest.moved&&!posMode&&performance.now()-gest.t<600&&e.type==='pointerup'){
    const now=performance.now();if(now-lastTap<320){resetView();lastTap=0;}else{lastTap=now;doPick(p.x,p.y);}}
  const wasMoved=gest&&gest.moved;
  if(ptrs.size===1){const q=[...ptrs.values()][0];gest={type:'one',sx:q.x,sy:q.y,lx:q.x,ly:q.y,t:0,moved:true};}
  else if(ptrs.size===0){gest=null;if(posMode){posGest=false;if(wasMoved)placeChanged(true);else render();}}
}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e),dy=e.deltaY*(e.deltaMode?33:1);
  if(posMode&&src){posGest=true;if(e.shiftKey||e.altKey)placeAbout(p.x,p.y,1,clamp(-dy,-60,60)*0.0015,0,0);else placeAbout(p.x,p.y,Math.exp(-dy*0.0015),0,0,0);
    syncPosBar();render();clearTimeout(wheelT);wheelT=setTimeout(()=>{posGest=false;placeChanged(true);},250);}
  else zoomAt(p.x,p.y,view.zoom*Math.exp(-dy*0.0015));},{passive:false});
