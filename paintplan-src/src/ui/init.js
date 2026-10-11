/* ui/init.js — Wiring: DOM events -> actions; init(). */
/* ---------- wiring ---------- */
function init(){
  buildPanel();syncControls();
  const pb=$('#panelBody');
  pb.addEventListener('input',e=>{if(e.target.dataset.pi!==undefined)onPig(e);else if(e.target.type!=='number'||e.target.value!=='')onControl(e);});
  pb.addEventListener('change',e=>{if(e.target.dataset.pi!==undefined)return;if(e.target.tagName==='SELECT'||e.target.type==='checkbox'||e.target.type==='number')onControl(e);});
  pb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.hl!==undefined)setHL(+b.dataset.hl);
    else if(b.dataset.pick!==undefined)openPaintPicker(+b.dataset.pick);
    else if(b.dataset.del!==undefined){if(S.pigments.length>1){S.pigments=S.pigments.filter((_,i)=>i!=b.dataset.del);S.rPreset='custom';syncControls();save();update();}}
    else if(b.id==='bAddPig'){if(S.pigments.length<12){S.pigments=S.pigments.concat([{n:'New paint',c:'#808080'}]);S.rPreset='custom';syncControls();save();update();openPaintPicker(S.pigments.length-1);}}
    else if(b.id==='bUsePal'){if(lastPalette){S.rPreset='extracted';applyPigPreset();setState('mode','remap');}}
    else if(b.id==='bCopyHex'){if(lastPalette){const t=lastPalette.cols.map(c=>hex2(c.rgb)).join(' ');(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy hex list',1500);},()=>prompt('Hex colours:',t));}}
    else if(b.id==='bPos2')setPosMode(true);else if(b.id==='bClearImg')clearSaved();
    else if(b.id==='bPng2')exportPNG();else if(b.id==='bSheet')exportSheet();else if(b.id==='bPrint')printSheet();
  });
  $('#modes').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)setState('mode',b.dataset.mode);});
  $('#file').addEventListener('change',e=>{loadFile(e.target.files[0]);e.target.value='';});
  if($('#bSample'))$('#bSample').onclick=loadSample;
  $('#bPos').onclick=()=>setPosMode(!posMode);
  document.getElementById('panelBody').addEventListener('change',e=>{if(e.target.id==='file2'){loadFile(e.target.files[0]);e.target.value='';}});
  $('#bMirror').onclick=()=>setState('flipH',!S.flipH);
  $('#bFit').onclick=resetView;
  $('#bPng').onclick=exportPNG;
  $('#bPanel').onclick=()=>{document.body.classList.toggle('nopanel');resize();};
  $('#posScale').addEventListener('input',e=>{const P=S.place;P.s=placeScale('fit')*Math.pow(2,+e.target.value);P.auto=false;clampScale();placeChanged(false);});
  $('#posRot').addEventListener('input',e=>{const P=S.place;P.rot=normRot(90*Math.round(P.rot/90)+(+e.target.value));if(P.auto)applyAuto();placeChanged(false);});
  $('#posRot').addEventListener('dblclick',()=>{const P=S.place;P.rot=normRot(90*Math.round(P.rot/90));if(P.auto)applyAuto();placeChanged(true);});
  $('#pFill').onclick=()=>snapPlace('fill');$('#pFit').onclick=()=>snapPlace('fit');
  $('#pCenter').onclick=()=>{S.place.cx=0.5;S.place.cy=0.5;placeChanged(true);};
  $('#pRotL').onclick=()=>rotatePlace(-90);$('#pRotR').onclick=()=>rotatePlace(90);
  $('#pFlipH').onclick=()=>flipPlace('h');$('#pFlipV').onclick=()=>flipPlace('v');
  $('#pDone').onclick=()=>setPosMode(false);
  $('#pick').addEventListener('click',e=>{if(e.target.closest('.pk-x'))closePick();});
  ['dragenter','dragover'].forEach(t=>window.addEventListener(t,e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){e.preventDefault();document.body.classList.add('dragging');}}));
  window.addEventListener('dragleave',e=>{if(!e.relatedTarget)document.body.classList.remove('dragging');});
  window.addEventListener('drop',e=>{e.preventDefault();document.body.classList.remove('dragging');const f=e.dataTransfer&&e.dataTransfer.files[0];if(f)loadFile(f);});
  window.addEventListener('paste',e=>{const it=[...(e.clipboardData||{}).items||[]].find(i=>i.type.startsWith('image/'));if(it)loadFile(it.getAsFile());});
  window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
    if(posMode&&src){const P=S.place,st=e.shiftKey?0.05:0.005;let hit=true;
      if(e.key==='ArrowLeft')P.cx-=st;else if(e.key==='ArrowRight')P.cx+=st;else if(e.key==='ArrowUp')P.cy-=st;else if(e.key==='ArrowDown')P.cy+=st;
      else if(e.key==='+'||e.key==='=')P.s*=1.03;else if(e.key==='-')P.s/=1.03;else if(e.key==='[')P.rot=normRot(P.rot-0.5);else if(e.key===']')P.rot=normRot(P.rot+0.5);
      else if(e.key==='Escape'||e.key==='Enter'||e.key==='p'||e.key==='P'){setPosMode(false);return;}else hit=false;
      if(hit){e.preventDefault();P.auto=false;clampScale();placeChanged(false);return;}}
    if(e.key==='m'||e.key==='M')setState('flipH',!S.flipH);else if(e.key==='p'||e.key==='P')setPosMode(true);else if(e.key==='0')resetView();else if(/^[1-9]$/.test(e.key))setState('mode',MODES[+e.key-1][0]);else if(e.key==='Escape')closePick();});
  if(window.matchMedia('(max-width:760px)').matches){$('#dComp').open=false;}
  new ResizeObserver(resize).observe(cv);resize();
  initWorker();
  restoreImage();
  HOOKS.forEach(f=>f());
}
