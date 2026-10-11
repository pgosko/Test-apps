/* core/image.js — Loading the photo (file, IndexedDB restore); clearSaved(). */
/* ---------- image loading: the original is kept untouched; placement is a transform ---------- */
function buildLevels(img,w,h){const L=[{c:img,w}];let cur=img,cw=w,ch=h;
  while(cw>800&&ch>200){const nw=Math.round(cw/2),nh=Math.round(ch/2),c=document.createElement('canvas');c.width=nw;c.height=nh;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(cur,0,0,nw,nh);L.push({c,w:nw});cur=c;cw=nw;ch=nh;}
  return L;}
function setSource(img,natW,natH,opts={}){
  document.body.classList.remove('noimg');
  if(src&&src.url&&src.url!==opts.url)URL.revokeObjectURL(src.url);
  src={img,natW,natH,levels:buildLevels(img,natW,natH),name:opts.name||'',sample:!!opts.sample,url:opts.url||null};
  if(S.preset==='photo')applyPreset();
  if(!opts.keepPlace)S.place=Object.assign({},DEF.place);
  if(S.place.auto||!(S.place.s>0))applyAuto();
  view.zoom=1;view.px=view.py=0;pickPt=null;$('#pick').hidden=true;
  buildWorking();syncControls();syncPosBar();save();
}
function decodeImg(blob){return new Promise((res,rej)=>{const url=URL.createObjectURL(blob),im=new Image();im.onload=()=>res({im,url});im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('decode'));};im.src=url;});}
async function loadFile(f){
  if(!f)return;
  if(!/^image\//.test(f.type)&&!/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name||'')){alert('Please choose an image file (JPEG, PNG, WebP…).');return;}
  let d;try{d=await decodeImg(f);}catch(e){alert('This image format could not be decoded by the browser (HEIC may need converting to JPEG).');return;}
  setSource(d.im,d.im.naturalWidth,d.im.naturalHeight,{name:f.name||'photo',url:d.url});
  idb.put('image',{blob:f,name:f.name||'photo'}).catch(()=>{});
}
async function restoreImage(){
  let v=null;try{v=await idb.get('image');}catch(e){}
  if(v&&v.blob){try{const d=await decodeImg(v.blob);setSource(d.im,d.im.naturalWidth,d.im.naturalHeight,{name:v.name,url:d.url,keepPlace:true});return;}catch(e){}}
  if(THEME.sample){const c=makeSample();setSource(c,c.width,c.height,{sample:true,keepPlace:true});}else showEmpty();
}
function clearSaved(){if(THEME.sample){idb.del('image').catch(()=>{});loadSample();}else clearImage();}
