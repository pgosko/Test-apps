/* ui/export.js — PNG export, grid sheet, print. */
/* ---------- export ---------- */
function download(canvas,name){
  canvas.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);},'image/png');
}
function viewCanvas(){
  const f=+S.exportScale||1,W=orig.width*f,H=orig.height*f,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.imageSmoothingQuality='high';drawScene(x,{x:0,y:0,w:W,h:H},Math.max(W,H)/800,{split:S.compare==='split'});return c;
}
function exportPNG(){if(!origData)return;download(viewCanvas(),`paintplan-${S.mode}-${fmtN(S.cw)}x${fmtN(S.ch)}${S.unit}.png`);}
function sheetCanvas(){
  const a=aspect(),L=1800;let W,H;if(a>=1){W=L;H=Math.round(L/a);}else{H=L;W=Math.round(L*a);}
  const M=110,top=190,hasV=(S.mode==='values'||S.mode==='notan')&&lastValues,hasP=S.mode==='palette'&&lastPalette,foot=(hasV||hasP)?190:60;
  const c=document.createElement('canvas');c.width=W+2*M;c.height=top+H+M+foot;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.imageSmoothingQuality='high';
  const R={x:M,y:top,w:W,h:H},g=gridGeom(),k=Math.max(W,H)/800;
  const saved=[S.grid,S.gridLabels];S.grid=true;S.gridLabels=true;
  drawScene(x,R,k,{sheet:true});S.grid=saved[0];S.gridLabels=saved[1];
  x.strokeStyle='#222';x.lineWidth=2;x.strokeRect(R.x,R.y,R.w,R.h);
  x.fillStyle='#111';x.textBaseline='alphabetic';x.font='600 40px system-ui,sans-serif';x.fillText('PaintPlan grid reference',M,58);
  x.font='26px system-ui,sans-serif';x.fillStyle='#444';
  x.fillText(`Canvas ${fmtN(S.cw)} × ${fmtN(S.ch)} ${S.unit} · ${g.cols} × ${g.rows} grid · cell ${fmtN(r2(g.cellW))} × ${fmtN(r2(g.cellH))} ${S.unit} · view: ${MODE_INFO[S.mode][0]}${S.flipH?' (mirrored)':''}`,M,100);
  let y=top+H+M*0.75;
  if(hasV){const v=lastValues,sw=Math.min(150,W/v.N);x.font='22px system-ui,sans-serif';
    for(let i=0;i<v.N;i++){const cc=local.util.l2s(v.outL[i]>8?Math.pow((v.outL[i]+16)/116,3):v.outL[i]/903.3);x.fillStyle=`rgb(${cc},${cc},${cc})`;x.fillRect(M+i*sw,y,sw,90);x.strokeStyle='#999';x.lineWidth=1;x.strokeRect(M+i*sw,y,sw,90);
      x.fillStyle=textOn(v.outL[i]);x.fillText(`${i+1} · ${Math.round(v.outL[i])}%`,M+i*sw+10,y+34);x.fillText(`${Math.round(v.counts[i]*100)}%`,M+i*sw+10,y+70);}}
  if(hasP){const cols=lastPalette.cols,sw=Math.min(150,W/cols.length);x.font='19px system-ui,sans-serif';
    cols.forEach((cl,i)=>{x.fillStyle=hex2(cl.rgb);x.fillRect(M+i*sw,y,sw-6,90);x.fillStyle='#222';x.fillText(hex2(cl.rgb),M+i*sw,y+116);x.fillText(`V ${Math.round(cl.L)}% · ${Math.round(cl.pct*100)}%`,M+i*sw,y+140);});}
  return c;
}
function exportSheet(){if(origData)download(sheetCanvas(),`paintplan-grid-${fmtN(S.cw)}x${fmtN(S.ch)}${S.unit}.png`);}
function printSheet(){if(!origData)return;const img=$('#printImg');img.onload=()=>{setTimeout(()=>window.print(),50);img.onload=null;};img.src=sheetCanvas().toDataURL('image/png');}
