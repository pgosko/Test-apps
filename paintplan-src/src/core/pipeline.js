/* core/pipeline.js — Image/processing state + update() pipeline; applies engine results to display canvases. */
/* ---------- state for images ---------- */
let src=null;                       // {c:canvas,w,h,natW,natH}
const orig=document.createElement('canvas'),proc=document.createElement('canvas'),hlc=document.createElement('canvas'),edgeC=document.createElement('canvas');
let origData=null,procData=null,labels=null,hl=-1,disp=orig,edgeMask=null,edgeReady=false,edgeColorKey='';
let imageId=0,lastProcKey='',lastEdgeKey='';
let lastValues=null,lastPalette=null,lastRemap=null;
const view={zoom:1,px:0,py:0};
let posMode=false,posGest=false,placeDirty=false,procImageId=-1,edgeImageId=-1,pickPt=null,curRect=null;
const fH=()=>S.flipH&&!posMode,fV=()=>S.flipV&&!posMode;

const aspect=()=>(S.cw>0&&S.ch>0)?S.cw/S.ch:1;
const vParams=()=>levelParams({steps:S.vSteps,black:S.vBlack,white:S.vWhite,mid:S.vMid,blur:S.vBlur,smooth:S.vSmooth},'values');
const nParams=()=>levelParams({steps:S.nThree?3:2,black:0,white:100,mid:S.nMid,blur:S.nBlur,smooth:S.nSmooth},'notan');
const pParams=()=>({k:S.pK,blur:S.pBlur,smooth:S.pSmooth});
function modeParams(){const m=S.mode;
  if(m==='squint')return{squint:S.squint};if(m==='values')return S.vColor?Object.assign(vParams(),{color:{style:S.vcStyle,out:S.vcOut,detail:S.vcDetail,strength:S.vcStrength,gamut:S.vcGamut}}):vParams();if(m==='notan')return nParams();
  if(m==='palette')return pParams();if(m==='remap')return{pigs:S.pigments.map(p=>p.c),ts:S.pigments.map(pigStrength),mix:S.rMix,blur:S.rBlur};
  if(m==='temp')return{s:S.tStrength};if(m==='chroma')return{s:S.cStrength};return{};}
function edgeParams(){return{src:S.lineSrc,blur:S.lineBlur,detail:S.lineDetail,clean:S.lineClean,thick:S.lineThick,
  v:S.lineSrc==='values'?(S.mode==='notan'?nParams():vParams()):null,pal:S.lineSrc==='colors'?pParams():null};}

function update(){
  if(origData){
    const pk=JSON.stringify([imageId,S.mode,modeParams()]);
    if(pk!==lastProcKey){lastProcKey=pk;if(S.mode==='photo'){procData=origData;labels=null;hl=-1;procImageId=imageId;rebuildDisplay();renderModeInfo();}else request('process');}
    const ek=S.lines==='off'?'off':JSON.stringify([imageId,edgeParams()]);
    if(ek!==lastEdgeKey){lastEdgeKey=ek;if(S.lines!=='off')request('edges');}
    if(edgeReady&&edgeColorKey!==S.lineColor)recolorEdges();
  }
  render();
}
function applyProcess(r){
  if(r.imageId!==imageId||r.mode!==S.mode||S.mode==='photo')return;
  procImageId=r.imageId;proc.width=r.w;proc.height=r.h;procData=new ImageData(new Uint8ClampedArray(r.rgba),r.w,r.h);
  proc.getContext('2d').putImageData(procData,0,0);
  labels=r.labels?(r.l16?new Uint16Array(r.labels):new Uint8Array(r.labels)):null;
  if(r.mode==='values'||r.mode==='notan'){lastValues=r.info;if(hl>=r.info.N)hl=-1;}
  if(r.mode==='palette'){lastPalette=r.info;if(hl>=r.info.cols.length)hl=-1;}
  if(r.mode==='remap'){lastRemap=r.info;if(hl>=0&&!r.info.mixes.some(m=>m.idx===hl))hl=-1;}
  rebuildDisplay();renderModeInfo();render();
  if(pickPt&&r.mode==='values'&&S.vColor)showPick();   // eyedropper shows the adjusted value of the new result
}
function applyEdges(r){
  if(r.imageId!==imageId)return;edgeImageId=r.imageId;edgeMask=new Uint8Array(r.mask);edgeC.width=r.w;edgeC.height=r.h;recolorEdges();edgeReady=true;render();
}
function recolorEdges(){
  if(!edgeMask)return;const [cr,cg,cb]=hexRgb(S.lineColor),id=new ImageData(edgeC.width,edgeC.height),d=id.data;
  for(let i=0,j=0;i<edgeMask.length;i++,j+=4){if(edgeMask[i]){d[j]=cr;d[j+1]=cg;d[j+2]=cb;d[j+3]=edgeMask[i];}}
  edgeC.getContext('2d').putImageData(id,0,0);edgeColorKey=S.lineColor;
}
function rebuildDisplay(){
  if(S.mode==='photo'||!procData){disp=orig;return;}
  if(hl<0||!labels){disp=proc;return;}
  hlc.width=proc.width;hlc.height=proc.height;
  const id=new ImageData(new Uint8ClampedArray(procData.data),proc.width,proc.height),d=id.data;
  for(let i=0,j=0;i<labels.length;i++,j+=4)if(labels[i]!==hl){d[j]=d[j]*0.2+102;d[j+1]=d[j+1]*0.2+102;d[j+2]=d[j+2]*0.2+102;}
  hlc.getContext('2d').putImageData(id,0,0);disp=hlc;
}
function setHL(i){hl=(hl===i?-1:i);rebuildDisplay();renderModeInfo();render();}
