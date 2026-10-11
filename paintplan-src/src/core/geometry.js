/* core/geometry.js — Composition geometry: golden spiral, drawing grid. */
/* golden spiral in a φ×1 rectangle, normalised to unit square */
const SPIRAL=(()=>{let x=0,y=0,w=PHI,h=1;const pts=[],sq=[];
  for(let i=0;i<14;i++){const d=i%4;let s,cx,cy,a0;
    if(d===0){s=h;sq.push([x,y,s]);cx=x+s;cy=y+s;a0=Math.PI;x+=s;w-=s;}
    else if(d===1){s=w;sq.push([x,y,s]);cx=x;cy=y+s;a0=1.5*Math.PI;y+=s;h-=s;}
    else if(d===2){s=h;sq.push([x+w-s,y,s]);cx=x+w-s;cy=y;a0=0;w-=s;}
    else{s=w;sq.push([x,y+h-s,s]);cx=x+w;cy=y+h-s;a0=0.5*Math.PI;h-=s;}
    for(let t=i?1:0;t<=24;t++){const a=a0+t/24*Math.PI/2;pts.push([(cx+s*Math.cos(a))/PHI,cy+s*Math.sin(a)]);}}
  return{pts,sq:sq.map(([a,b,s])=>[a/PHI,b,s/PHI,s])};})();
function gridGeom(){
  const a=aspect();let us=[],vs=[],cols,rows,cellW,cellH,colL=[],rowL=[];
  if(S.gridMode==='spacing'){const sp=Math.max(0.05,S.gridSpacing);cols=Math.ceil(S.cw/sp-1e-6);rows=Math.ceil(S.ch/sp-1e-6);cellW=cellH=sp;
    for(let i=0;i<=cols;i++){const u=Math.min(1,i*sp/S.cw);us.push(u);if(i>0&&i*sp<S.cw-1e-6)colL.push([u,fmtN(r2(i*sp))]);}
    for(let j=0;j<=rows;j++){const v=Math.min(1,j*sp/S.ch);vs.push(v);if(j>0&&j*sp<S.ch-1e-6)rowL.push([v,fmtN(r2(j*sp))]);}
  }else{cols=Math.max(1,S.gridCols|0);rows=S.gridSquare?Math.max(1,Math.round(cols/a)):Math.max(1,S.gridRows|0);cellW=S.cw/cols;cellH=S.ch/rows;
    for(let i=0;i<=cols;i++)us.push(i/cols);for(let j=0;j<=rows;j++)vs.push(j/rows);
    for(let i=0;i<cols;i++)colL.push([(i+0.5)/cols,String(i+1)]);
    for(let j=0;j<rows;j++)rowL.push([(j+0.5)/rows,j<26?String.fromCharCode(65+j):'A'+String.fromCharCode(65+j-26)]);}
  return{us,vs,cols,rows,cellW,cellH,colL,rowL};
}
