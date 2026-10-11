/* ui/panel.js — Control panel: builds the settings markup, syncs controls <-> S, setState(). */
/* ---------- panel UI ---------- */
const FMT={compAlpha:'%',gridAlpha:'%',lineAlpha:'%',split:'%',tStrength:'x',cStrength:'x'};
function sl(k,label,min,max,step){return`<div class="row"><label for="c_${k}">${label}</label><input type="range" id="c_${k}" data-k="${k}" min="${min}" max="${max}" step="${step}"><output id="o_${k}"></output></div>`;}
function ck(k,label){return`<label class="ck"><input type="checkbox" data-k="${k}"> ${label}</label>`;}
function se(k,label,opts){return`<div class="row"><label for="c_${k}">${label}</label><select id="c_${k}" data-k="${k}">${opts.map(o=>`<option value="${o[0]}">${esc(o[1])}</option>`).join('')}</select></div>`;}
function co(k,label){return`<div class="row"><label for="c_${k}">${label}</label><input type="color" id="c_${k}" data-k="${k}"></div>`;}
function mi(k){const i=MODE_INFO[k];return'';}
function buildPanel(){
  $('#modes').innerHTML=MODES.map(m=>`<button data-mode="${m[0]}">${m[1]}</button>`).join('');
  $('#panelBody').innerHTML=`
<section class="sec" id="secMode">
  <h3 id="modeTitle"></h3><p class="hint" id="modeHint"></p>
  <div data-for="squint">${sl('squint','Squint amount',0.5,8,0.25)}</div>
  <div data-for="values">${sl('vSteps','Steps',2,9,1)}${sl('vBlack','Black level',0,60,1)}${sl('vMid','Midpoint',5,95,1)}${sl('vWhite','White level',40,100,1)}${sl('vBlur','Pre-blur',0,8,0.25)}${sl('vSmooth','Simplify shapes',0,6,0.5)}</div>
  <div data-for="notan">${ck('nThree','3 values (dark / mid / light)')}${sl('nMid','Threshold',5,95,1)}${sl('nBlur','Pre-blur',0,10,0.25)}${sl('nSmooth','Simplify shapes',0,8,0.5)}</div>
  <div data-for="values notan"><div class="strip" id="strip"></div><canvas class="hist" id="hist" width="600" height="112"></canvas><p class="hint">Strip: step · output value · input L* range · coverage. Histogram = reference values with step boundaries.</p></div>
  <div data-for="palette">${sl('pK','Colours',2,16,1)}${sl('pBlur','Pre-blur',0,8,0.25)}${sl('pSmooth','Simplify shapes',0,6,0.5)}<div class="sws" id="swatches"></div>
    <div class="btns"><button id="bUsePal">Use as limited palette</button><button id="bCopyHex">Copy hex list</button></div></div>
  <div data-for="remap">${se('rPreset','Palette',Object.entries(PALS).map(([k,v])=>[k,v[0]]))}<div id="pigList"></div>
    <div class="btns"><button id="bAddPig">+ Add paint</button></div>
    ${ck('rMix','Simulate mixing (up to 3 paints)')}${sl('rBlur','Pre-blur',0,8,0.25)}
    <div class="sub">Most-used mixes</div><div class="sws" id="mixes"></div><p class="hint" id="remapNote"></p></div>
  <div data-for="temp">${sl('tStrength','Strength',0.25,4,0.25)}</div>
  <div data-for="chroma">${sl('cStrength','Strength',0.25,4,0.25)}</div>
</section>
<details id="dCanvas" open><summary>Canvas &amp; image</summary><div>
  ${se('preset','Preset',PRESETS.map(p=>[p[0],p[1]]))}
  <div class="row"><label>Size</label><input type="number" id="c_cw" data-k="cw" min="0.5" step="0.1" inputmode="decimal" aria-label="Width"> × <input type="number" id="c_ch" data-k="ch" min="0.5" step="0.1" inputmode="decimal" aria-label="Height">
    <select id="c_unit" data-k="unit" style="flex:0 0 auto"><option value="in">in</option><option value="cm">cm</option></select></div>
  ${se('orient','Orientation',[['portrait','Portrait'],['landscape','Landscape']])}
  ${co('canvasColor','Empty canvas')}
  <div class="btns"><button id="bPos2">Position image…</button><label class="btn">Replace photo<input type="file" id="file2" accept="image/*" hidden></label><button id="bClearImg" title="${THEME.sample?'Forget the saved photo and load the sample':'Forget the saved photo'}">Clear saved photo</button></div>
  <div class="info" id="scaleInfo"></div>
</div></details>
<details id="dComp" open><summary>Composition</summary><div>
  <div class="cks">${ck('spiral','Golden spiral')}${ck('phi','Phi grid')}${ck('thirds','Rule of thirds')}${ck('center','Centre lines')}</div>
  <div data-show="spiral">${se('spiralRot','Spiral turn',[[0,'0°'],[1,'90°'],[2,'180°'],[3,'270°']])}<div class="cks">${ck('spiralFlip','Flip spiral')}${ck('spiralSq','Golden squares')}</div></div>
  <div class="sub">Dynamic symmetry</div>
  ${se('diag','Diagonals',[['off','Off'],['both','Both'],['baroque','Baroque ( / )'],['sinister','Sinister ( \\ )']])}
  <div class="cks">${ck('recip','Reciprocals')}${ck('armature','Harmonic armature')}</div>
  <div class="sub">Line style</div>
  ${co('compColor','Colour')}${sl('compAlpha','Opacity',0.1,1,0.05)}${sl('compWidth','Thickness',0.5,6,0.5)}
</div></details>
<details id="dGrid"><summary>Drawing grid</summary><div>
  ${ck('grid','Show grid')}
  ${se('gridMode','Mode',[['count','Columns × rows'],['spacing','Every X units']])}
  <div data-show="gridMode=count">${sl('gridCols','Columns',1,24,1)}${ck('gridSquare','Near-square cells (auto rows)')}<div data-show="!gridSquare">${sl('gridRows','Rows',1,24,1)}</div></div>
  <div data-show="gridMode=spacing"><div class="row"><label for="c_gridSpacing">Spacing</label><input type="number" id="c_gridSpacing" data-k="gridSpacing" min="0.1" step="0.1" inputmode="decimal"><span class="hint" id="gridUnit"></span></div></div>
  <div class="cks">${ck('gridLabels','Labels')}${ck('gridDiag','Cell diagonals')}</div>
  ${co('gridColor','Colour')}${sl('gridAlpha','Opacity',0.1,1,0.05)}${sl('gridWidth','Thickness',0.5,5,0.5)}
  <div class="info" id="gridInfo"></div>
</div></details>
<details id="dLines"><summary>Contour lines</summary><div>
  ${se('lines','Show',[['off','Off'],['over','Over image'],['only','Lines only (on white)']])}
  ${se('lineSrc','Source',[['edges','Photo edges (Canny-style)'],['values','Simplified: value shapes'],['colors','Simplified: colour shapes']])}
  <div data-show="lineSrc=edges">${sl('lineBlur','Smoothing',0.5,8,0.25)}${sl('lineDetail','Detail',1,100,1)}</div>
  <p class="hint" data-show="!lineSrc=edges">Outlines the regions of the Values (or Notan) / Palette settings above.</p>
  ${sl('lineClean','Remove short bits',0,200,5)}${sl('lineThick','Thickness',1,4,1)}${co('lineColor','Colour')}${sl('lineAlpha','Opacity',0.1,1,0.05)}
</div></details>
<details id="dView"><summary>View &amp; compare</summary><div>
  <div class="cks">${ck('flipH','Mirror (left/right)')}${ck('flipV','Flip upside down')}</div>
  ${se('compare','Compare',[['off','Off'],['split','Split with photo'],['side','Side by side']])}
  <div data-show="compare=split">${sl('split','Split position',0,1,0.01)}</div>
  ${se('stageBg','Background',[['#3a3a3a','Dark gray'],['#808080','Mid gray (neutral)'],['#1a1a1a','Near black'],['#f2f2f0','White']])}
  ${se('workRes','Working size',[[800,'800 px (fastest)'],[1200,'1200 px'],[1600,'1600 px'],[2000,'2000 px (slow phones)']])}
  <p class="hint">Pinch or scroll to zoom, drag to pan, double-tap to fit. Keys: <kbd>M</kbd> mirror, <kbd>0</kbd> fit, <kbd>1</kbd>–<kbd>9</kbd> modes.</p>
</div></details>
<details id="dExport"><summary>Export &amp; print</summary><div>
  ${se('exportScale','PNG size',[[1,'1× working size'],[2,'2× (sharper lines)']])}
  <div class="btns"><button id="bPng2">Download view PNG</button><button id="bSheet">Grid sheet PNG</button><button id="bPrint">Print grid sheet</button></div>
  <p class="hint">The grid sheet puts the current view on white with the grid, labels outside the edges, canvas size, and the value scale / palette when available.</p>
</div></details>
<details id="dTips"><summary>Painting workflow tips</summary><div class="hint">
  <p>1. Pick the canvas size first, then Position the image behind it (compose against the spiral / grid). 2. Check the design with Notan and Values (3–5 steps). 3. Squint to see big masses. 4. Use Palette / Limited to plan mixes. 5. Transfer with the grid; use contour lines for a simple line drawing. 6. Mirror the view to catch drawing errors with fresh eyes.</p>
  <p>Everything runs locally in the browser; photos never leave the device.</p></div></details>`;
}
function typeOf(k){return typeof DEF[k];}
function syncControls(except){
  document.querySelectorAll('#panelBody [data-k]').forEach(el=>{
    if(el===except)return;const k=el.dataset.k,v=S[k];
    if(el.type==='checkbox')el.checked=!!v;else el.value=String(v);
    const o=document.getElementById('o_'+k);if(o)o.textContent=fmtVal(k,v);
  });
  document.querySelectorAll('#modes [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===S.mode));
  document.querySelectorAll('#secMode [data-for]').forEach(el=>el.hidden=!el.dataset.for.split(' ').includes(S.mode));
  document.querySelectorAll('[data-show]').forEach(el=>{let c=el.dataset.show,neg=c[0]==='!';if(neg)c=c.slice(1);const [k,val]=c.split('=');let on=val===undefined?!!S[k]:String(S[k])===val;el.hidden=neg?on:!on;});
  const mi=MODE_INFO[S.mode];$('#modeTitle').textContent=mi[0];$('#modeHint').textContent=mi[1];
  $('#bMirror').setAttribute('aria-pressed',String(S.flipH));
  $('#gridUnit').textContent=S.unit;
  document.documentElement.style.setProperty('--stage',S.stageBg);
  renderPigs();updateInfo();
}
function fmtVal(k,v){const f=FMT[k];if(f==='%')return Math.round(v*100)+'%';if(f==='x')return fmtN(v)+'×';return fmtN(v);}
function onControl(e){
  const el=e.target,k=el.dataset.k;if(!k)return;
  let v;const t=typeOf(k);
  if(el.type==='checkbox')v=el.checked;else if(t==='number'){v=parseFloat(el.value);if(!isFinite(v))return;}else v=el.value;
  if((k==='cw'||k==='ch'||k==='gridSpacing')&&!(v>0))return;
  setState(k,v,el);
}
let rebuildT=0;
function setState(k,v,el){
  const old=S[k];S[k]=v;
  if(k==='unit'&&old!==v){const f=v==='cm'?2.54:1/2.54;S.cw=r2(S.cw*f);S.ch=r2(S.ch*f);S.gridSpacing=r2(S.gridSpacing*f);el=null;}
  if(k==='preset')applyPreset();
  if(k==='orient'){if((v==='landscape')!==(S.cw>S.ch)&&S.cw!==S.ch){const t=S.cw;S.cw=S.ch;S.ch=t;}}
  if(k==='cw'||k==='ch'){S.preset='custom';if(S.cw!==S.ch)S.orient=S.cw>S.ch?'landscape':'portrait';}
  if(k==='rPreset')applyPigPreset();
  if(k==='mode'){hl=-1;rebuildDisplay();}
  if(k==='spiral'&&v)S.spiral=true;
  syncControls(el);save();
  if(['cw','ch','unit','preset','orient','workRes','canvasColor'].includes(k)){clearTimeout(rebuildT);rebuildT=setTimeout(()=>{if(src&&S.place.auto)applyAuto();buildWorking();},k==='cw'||k==='ch'?350:0);}
  if(k==='mode')renderModeInfo();
  update();
}
function applyPreset(){
  const p=PRESETS.find(x=>x[0]===S.preset);if(!p||p[0]==='custom')return;
  if(p[0]==='photo'){if(!src)return;const long=S.unit==='in'?12:30,odd=Math.abs(Math.round(S.place.rot/90))%2===1,a=odd?src.natH/src.natW:src.natW/src.natH;if(a>=1){S.cw=long;S.ch=r2(long/a);}else{S.ch=long;S.cw=r2(long*a);}S.orient=a>=1?'landscape':'portrait';return;}
  let w=p[2],h=p[3];const f=p[4]===S.unit?1:(S.unit==='cm'?2.54:1/2.54);w=r2(w*f);h=r2(h*f);
  if(S.orient==='landscape'){S.cw=Math.max(w,h);S.ch=Math.min(w,h);}else{S.cw=Math.min(w,h);S.ch=Math.max(w,h);}
}
function applyPigPreset(){
  const id=S.rPreset;
  if(id==='extracted'){if(lastPalette)S.pigments=lastPalette.cols.map((c,i)=>({n:'Colour '+(i+1),c:hex2(c.rgb)}));}
  else if(PALS[id][1])S.pigments=pigsOf(id);
}
function renderPigs(){
  const el=$('#pigList');if(!el)return;
  const sig=JSON.stringify(S.pigments);if(el.dataset.sig===sig)return;el.dataset.sig=sig;
  el.innerHTML=S.pigments.map((p,i)=>`<div class="pig"><input type="color" value="${p.c}" data-pi="${i}" data-f="c" aria-label="Paint colour"><input type="text" value="${esc(p.n)}" data-pi="${i}" data-f="n" aria-label="Paint name"><button data-del="${i}" title="Remove" aria-label="Remove paint">×</button></div>`).join('');
}
function onPig(e){
  const el=e.target,i=el.dataset.pi;if(i===undefined)return;
  S.pigments=S.pigments.map((p,j)=>j==i?Object.assign({},p,{[el.dataset.f]:el.value}):p);
  S.rPreset='custom';$('#pigList').dataset.sig=JSON.stringify(S.pigments);syncControls();save();
  if(el.dataset.f==='c')update();else renderModeInfo();
}
