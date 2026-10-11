/* core/placement.js — Non-destructive placement transform (S.place) + Position mode state. */
/* ---------- placement (non-destructive) ----------
   S.place: cx,cy = image centre as a fraction of canvas width/height; s = image width / canvas width;
   rot = degrees clockwise; fx,fy = ±1 flips in the image's own frame; auto = keep "fill" when the canvas changes. */
function placeScale(mode,rot){
  const A=aspect(),th=(rot===undefined?S.place.rot:rot)*Math.PI/180,c=Math.abs(Math.cos(th)),s=Math.abs(Math.sin(th)),W=src.natW,H=src.natH,Rh=1/A;
  const k=mode==='fit'?Math.min(1/(W*c+H*s),Rh/(W*s+H*c)):Math.max((c+Rh*s)/W,(s+Rh*c)/H);
  return k*W;}
function applyAuto(){S.place.cx=0.5;S.place.cy=0.5;S.place.s=placeScale('fill');}
const normRot=r=>{r=((r+180)%360+360)%360-180;return Math.abs(r)<1e-9?0:Math.round(r*1000)/1000;};
let placeT=0;
function placeChanged(immediate){placeDirty=true;syncPosBar();updateInfo();save();render();clearTimeout(placeT);placeT=setTimeout(buildWorking,immediate?0:200);}
function clampScale(){if(!src)return;const lo=placeScale('fit')/8,hi=placeScale('fill')*40;S.place.s=clamp(S.place.s,lo,hi);}
function snapPlace(mode){if(!src)return;const P=S.place;P.cx=0.5;P.cy=0.5;P.s=placeScale(mode);P.auto=mode==='fill';placeChanged(true);}
function rotatePlace(d){const P=S.place;P.rot=normRot(P.rot+d);if(P.auto)applyAuto();placeChanged(true);}
function flipPlace(axis){const P=S.place;P.rot=normRot(-P.rot);if(axis==='h')P.fx=-P.fx;else P.fy=-P.fy;placeChanged(true);}
function drawPlaced(c,R){
  const P=S.place,k=P.s*R.w/src.natW,need=k*src.natW*Math.abs(c.getTransform().a||1);
  let lv=src.levels[0];for(const l of src.levels){if(l.w>=need*0.95)lv=l;else break;}
  c.save();c.translate(R.x+P.cx*R.w,R.y+P.cy*R.h);c.rotate(P.rot*Math.PI/180);c.scale(P.fx*k,P.fy*k);
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(lv.c,-src.natW/2,-src.natH/2,src.natW,src.natH);c.restore();
}
function buildWorking(){
  if(!src)return;clearTimeout(placeT);placeDirty=false;
  const a=aspect(),L=+S.workRes;let w,h;if(a>=1){w=L;h=Math.max(1,Math.round(L/a));}else{h=L;w=Math.max(1,Math.round(L*a));}
  orig.width=w;orig.height=h;const x=orig.getContext('2d',{willReadFrequently:true});
  x.fillStyle=S.canvasColor;x.fillRect(0,0,w,h);drawPlaced(x,{x:0,y:0,w,h});
  origData=x.getImageData(0,0,w,h);imageId++;sendImage();
  if(S.mode==='photo'){procData=origData;disp=orig;labels=null;}
  lastProcKey=lastEdgeKey='';
  updateInfo();update();
}
function sendImage(){const buf=origData.data.slice().buffer;post({type:'setImage',id:imageId,w:orig.width,h:orig.height,data:buf},[buf]);}
function setPosMode(on){
  if(!src)return;posMode=on;$('#posbar').hidden=!on;$('#bPos').classList.toggle('on',on);$('#bPos').setAttribute('aria-pressed',String(on));
  document.body.classList.toggle('positioning',on);pickPt=null;$('#pick').hidden=true;
  if(!on&&placeDirty)buildWorking();
  syncPosBar();requestAnimationFrame(resize);
}
function syncPosBar(){
  if(!src)return;const P=S.place,fit=placeScale('fit'),fill=placeScale('fill');
  const sc=$('#posScale'),ro=$('#posRot');if(!sc)return;
  sc.value=clamp(Math.log2(P.s/fit),-2,4);$('#oPosScale').textContent=Math.round(P.s/fill*100)+'%';
  const fine=P.rot-90*Math.round(P.rot/90);ro.value=fine;$('#oPosRot').textContent=(Math.round(P.rot*10)/10)+'°';
}
function posRect(){const bar=$('#posbar'),bh=bar&&!bar.hidden?(bar.offsetHeight+12)*dpr:0,W=cv.width,H=Math.max(60,cv.height-bh),m=Math.max(22*dpr,Math.min(W,H)*0.07);
  return fitRect(aspect()*1000,1000,{x:0,y:0,w:W,h:H},m);}
