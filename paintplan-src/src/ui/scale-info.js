/* ui/scale-info.js — Canvas scale readout (#scaleInfo). */
function unitPx(){return orig.width/S.cw;}
function updateInfo(){
  const el=$('#scaleInfo');if(!el)return;
  const a=aspect(),u=S.unit;
  let t=`<b>${fmtN(S.cw)} × ${fmtN(S.ch)} ${u}</b> · aspect ${a>=1?fmtN(r2(a))+' : 1':'1 : '+fmtN(r2(1/a))}`;
  if(origData){t+=`<br>Working image ${orig.width} × ${orig.height} px<br><b>1 ${u} on canvas = ${(orig.width/S.cw).toFixed(1)} px</b> (1 px = ${(S.cw/orig.width*(u==='cm'?10:1)).toFixed(3)} ${u==='cm'?'mm':'in'})`;
    if(src){const P=S.place;t+=`<br>Photo ${src.natW} × ${src.natH} px${src.sample?' (sample)':''} · <b>${Math.round(src.natW/(P.s*S.cw))} original px per ${u}</b><br>Placement: ${Math.round(P.s/placeScale('fill')*100)}% of fill · ${fmtN(r2(P.rot))}°${P.fx<0||P.fy<0?' · flipped':''}${P.auto?' · auto-fill':''}`;}}
  el.innerHTML=t;
  const g=gridGeom(),gi=$('#gridInfo');
  if(gi)gi.innerHTML=`<b>${g.cols} × ${g.rows}</b> cells · cell ${fmtN(r2(g.cellW))} × ${fmtN(r2(g.cellH))} ${u}${origData?` (${Math.round(g.cellW*unitPx())} px)`:''}${S.gridMode==='spacing'?'<br>Last row/column may be partial.':''}`;
}
