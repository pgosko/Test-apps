/* ui/histogram.js — Value histogram with draggable step boundaries (Values + Notan).
   Bands are shaded in each step's output value; handles are the boundaries between steps (44 px touch target).
   Dragging writes custom cuts (core/levels.js) and re-runs the engine live (fast path), full quality on release. */
let histDrag=null,histUpd=0;
function histCuts(v){                       // the boundaries to show: the dragged/custom ones if valid, else the engine's
  const m=S.mode,N=v.N;
  if(m==='notan'&&N===2&&!histDrag)return[S.nMid];
  if(levelCustom(m)&&S[levelKey(m)].length===N-1)return S[levelKey(m)];
  if(histDrag&&histDrag.cuts.length===N-1)return histDrag.cuts;
  return v.bounds.slice(1,N);
}
function cssVar(n,d){const v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return v||d;}
function drawHist(v){
  const c=$('#hist');if(!c||!v)return;const r=c.getBoundingClientRect(),dp=Math.min(window.devicePixelRatio||1,3);
  if(r.width>0){const W0=Math.round(r.width*dp),H0=Math.round(r.height*dp);if(c.width!==W0||c.height!==H0){c.width=W0;c.height=H0;}}
  const x=c.getContext('2d'),W=c.width,H=c.height,k=r.width>0?c.width/r.width:1,cuts=histCuts(v),N=v.N,B=[0,...cuts,100];
  x.clearRect(0,0,W,H);
  const gray=L=>local.util.l2s(L>8?Math.pow((L+16)/116,3):L/903.3);
  for(let i=0;i<N;i++){const g=gray(v.outL[i]),x0=B[i]/100*W,x1=B[i+1]/100*W;x.fillStyle=`rgb(${g},${g},${g})`;x.fillRect(x0,0,x1-x0+1,H);}
  const mx=Math.max(...v.hist)||1;
  for(let i=0,s=0;i<=100;i++){while(s<N-1&&i>=cuts[s])s++;const L=v.outL[s];       // bars contrast with their band
    const bh=Math.sqrt(v.hist[i]/mx)*(H-6*k);x.fillStyle=L>55?'rgba(0,0,0,.55)':'rgba(255,255,255,.5)';x.fillRect(i/101*W,H-bh,W/101+0.5,bh);}
  if(hl>=0&&hl<N){x.strokeStyle=cssVar('--accent','#c8b48f');x.lineWidth=2*k;x.strokeRect(B[hl]/100*W+k,k,(B[hl+1]-B[hl])/100*W-2*k,H-2*k);}
  const acc=cssVar('--accent','#c8b48f');
  cuts.forEach((b,i)=>{const px=b/100*W,act=histDrag&&histDrag.i===i,kw=(act?14:11)*k,kh=(act?34:28)*k;
    x.fillStyle='rgba(0,0,0,.6)';x.fillRect(px-2*k,0,4*k,H);x.fillStyle=acc;x.fillRect(px-1*k,0,2*k,H);
    x.beginPath();const ky=H/2-kh/2,rr=kw/2;x.moveTo(px-kw/2+rr,ky);x.arcTo(px+kw/2,ky,px+kw/2,ky+kh,rr);x.arcTo(px+kw/2,ky+kh,px-kw/2,ky+kh,rr);x.arcTo(px-kw/2,ky+kh,px-kw/2,ky,rr);x.arcTo(px-kw/2,ky,px+kw/2,ky,rr);x.closePath();
    x.fillStyle=acc;x.fill();x.lineWidth=1.5*k;x.strokeStyle='rgba(0,0,0,.65)';x.stroke();
    x.fillStyle='rgba(0,0,0,.55)';for(const d of[-5,0,5])x.fillRect(px-3*k,H/2+(d-0.5)*k,6*k,1*k);
    if(act){const t=`L* ${b.toFixed(1)}`;x.font=`600 ${12*k}px system-ui,sans-serif`;const tw=x.measureText(t).width+12*k,bx=Math.min(W-tw-2*k,Math.max(2*k,px-tw/2));
      x.fillStyle='rgba(0,0,0,.78)';x.fillRect(bx,3*k,tw,18*k);x.fillStyle='#fff';x.textBaseline='middle';x.fillText(t,bx+6*k,12*k);}});
}
function syncLevels(){
  const m=S.mode,info=$('#levelsInfo'),btn=$('#bLevelsAuto');if(!info)return;
  const two=m==='notan'&&!S.nThree,custom=!two&&levelCustom(m);
  info.textContent=two?'Drag the handle to move the threshold.':custom?'Custom levels (dragged).':'Auto levels — drag a handle to adjust.';
  btn.hidden=!custom;
  for(const id of['c_vBlack','c_vMid','c_vWhite']){const e=document.getElementById(id);if(e)e.closest('.row').classList.toggle('dim',m==='values'&&custom);}
}
function histX(e){const r=$('#hist').getBoundingClientRect();return{x:e.clientX-r.left,w:r.width};}
function histHit(e){
  const v=lastValues;if(!v||!(S.mode==='values'||S.mode==='notan'))return -1;const {x,w}=histX(e),cuts=histCuts(v);
  let best=-1,bd=22;cuts.forEach((b,i)=>{const d=Math.abs(b/100*w-x);if(d<=bd){bd=d;best=i;}});return best;   // 44 px wide hit area
}
function histSchedule(){if(histUpd)return;histUpd=requestAnimationFrame(()=>{histUpd=0;update();});}
function histApply(d){
  const m=S.mode,c=d.cuts;
  if(m==='notan'&&!S.nThree)S.nMid=Math.round(Math.min(95,Math.max(5,c[0])));   // 2-value notan: the threshold is nMid
  else S[levelKey(m)]=c.slice();
}
HOOKS.push(()=>{
  const c=$('#hist');if(!c)return;
  c.addEventListener('pointerdown',e=>{
    const i=histHit(e);if(i<0){histDrag={tap:true,x0:e.clientX};return;}
    e.preventDefault();try{c.setPointerCapture(e.pointerId);}catch(_){}
    histDrag={i,id:e.pointerId,cuts:histCuts(lastValues).slice(),moved:false,x0:e.clientX};levelLive=true;c.classList.add('dragging');drawHist(lastValues);
  });
  c.addEventListener('pointermove',e=>{
    if(!histDrag||histDrag.tap){c.classList.toggle('grab',histHit(e)>=0);return;}
    if(e.pointerId!==histDrag.id)return;const {x,w}=histX(e),d=histDrag;
    const nv=clampCut(d.cuts,d.i,x/w*100);if(nv===d.cuts[d.i])return;
    d.cuts[d.i]=m2(nv);d.moved=true;histApply(d);syncLevels();drawHist(lastValues);histSchedule();
    function m2(v){return S.mode==='notan'&&!S.nThree?Math.round(Math.min(95,Math.max(5,v))):v;}
  });
  const end=e=>{
    const d=histDrag;if(!d)return;histDrag=null;c.classList.remove('dragging');
    if(d.tap){if(e.type==='pointerup'&&Math.abs(e.clientX-d.x0)<6&&lastValues){const {x,w}=histX(e),B=[0,...histCuts(lastValues),100],u=x/w*100;
        const i=B.findIndex((b,j)=>j>0&&u<b)-1;setHL(i<0?lastValues.N-1:i);}return;}
    levelLive=false;if(d.moved){histApply(d);syncControls();save();}update();drawHist(lastValues);
  };
  c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);
  $('#bLevelsAuto').addEventListener('click',()=>{S[levelKey(S.mode)]=[];syncControls();save();update();});
  new ResizeObserver(()=>{if(lastValues&&(S.mode==='values'||S.mode==='notan'))drawHist(lastValues);}).observe(c);
});
