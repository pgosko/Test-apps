/* ui/overlays.js — Draws composition overlays + grid onto a 2D context. */
function drawOverlays(c,R,k,o){
  const P=mapper(R);c.save();c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.rect(R.x,R.y,R.w,R.h);c.clip();
  const L=(u1,v1,u2,v2)=>{const a=P(u1,v1),b=P(u2,v2);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);};
  if(S.grid){const g=gridGeom();c.beginPath();
    for(const u of g.us)L(u,0,u,1);for(const v of g.vs)L(0,v,1,v);
    if(S.gridDiag)for(let i=0;i<g.us.length-1;i++)for(let j=0;j<g.vs.length-1;j++){L(g.us[i],g.vs[j],g.us[i+1],g.vs[j+1]);L(g.us[i+1],g.vs[j],g.us[i],g.vs[j+1]);}
    if(o.sheet){c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=S.gridWidth*k*2.6;c.stroke();c.strokeStyle='rgba(20,20,20,.9)';c.lineWidth=S.gridWidth*k;c.stroke();}
    else{c.strokeStyle=rgba(S.gridColor,S.gridAlpha);c.lineWidth=S.gridWidth*k;c.stroke();}}
  c.strokeStyle=rgba(S.compColor,S.compAlpha);c.lineWidth=S.compWidth*k;c.beginPath();
  if(S.thirds){L(1/3,0,1/3,1);L(2/3,0,2/3,1);L(0,1/3,1,1/3);L(0,2/3,1,2/3);}
  if(S.phi){const a=1/(PHI*PHI),b=1/PHI;L(a,0,a,1);L(b,0,b,1);L(0,a,1,a);L(0,b,1,b);}
  if(S.center){L(0.5,0,0.5,1);L(0,0.5,1,0.5);}
  const A=aspect(),dg=S.diag;
  if(dg==='both'||dg==='baroque')L(0,1,1,0);
  if(dg==='both'||dg==='sinister')L(0,0,1,1);
  if(S.recip){const ray=(X0,Y0,dx,dy)=>{let t=Infinity;if(dx>0)t=Math.min(t,(A-X0)/dx);if(dx<0)t=Math.min(t,-X0/dx);if(dy>0)t=Math.min(t,(1-Y0)/dy);if(dy<0)t=Math.min(t,-Y0/dy);L(X0/A,Y0,(X0+dx*t)/A,Y0+dy*t);};
    if(dg!=='sinister'){ray(0,0,1,A);ray(A,1,-1,-A);}
    if(dg!=='baroque'){ray(A,0,-1,A);ray(0,1,1,-A);}}
  if(S.armature){L(0,0,1,0.5);L(0,0,0.5,1);L(1,0,0,0.5);L(1,0,0.5,1);L(0,1,1,0.5);L(0,1,0.5,0);L(1,1,0,0.5);L(1,1,0.5,0);
    L(0.5,0,1,0.5);L(1,0.5,0.5,1);L(0.5,1,0,0.5);L(0,0.5,0.5,0);}
  c.stroke();
  if(S.spiral){const rot=((+S.spiralRot)+(A<1?1:0))%4;
    const T=(u,v)=>{if(S.spiralFlip)u=1-u;if(rot===1)[u,v]=[1-v,u];else if(rot===2)[u,v]=[1-u,1-v];else if(rot===3)[u,v]=[v,1-u];return P(u,v);};
    if(S.spiralSq){c.save();c.globalAlpha=0.55;c.lineWidth=Math.max(0.5,S.compWidth*0.6)*k;c.beginPath();
      for(const [x,y,sw,sh] of SPIRAL.sq.slice(0,9)){const p=[T(x,y),T(x+sw,y),T(x+sw,y+sh),T(x,y+sh)];c.moveTo(p[0][0],p[0][1]);for(let i=1;i<4;i++)c.lineTo(p[i][0],p[i][1]);c.closePath();}
      c.stroke();c.restore();}
    c.beginPath();SPIRAL.pts.forEach(([u,v],i)=>{const p=T(u,v);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.stroke();}
  c.restore();
  if(S.grid&&S.gridLabels){const g=gridGeom(),fs=Math.max(9,11*k/(o.sheet?1:1));c.save();c.font=`${o.sheet?fs*1.6:fs}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';
    const pill=(t,x,y)=>{if(o.sheet){c.fillStyle='#222';c.fillText(t,x,y);return;}const w=c.measureText(t).width+6*k,h=fs+4*k;c.fillStyle='rgba(0,0,0,.6)';c.fillRect(x-w/2,y-h/2,w,h);c.fillStyle='#fff';c.fillText(t,x,y);};
    const off=o.sheet?-fs*1.6:fs*0.9;
    for(const [u,t] of g.colL){const [x]=P(u,0);pill(t,x,R.y+off);if(o.sheet)pill(t,x,R.y+R.h-off);}
    for(const [v,t] of g.rowL){const [,y]=P(0,v);pill(t,R.x+(o.sheet?-fs*2:fs*1.1),y);if(o.sheet)pill(t,R.x+R.w+fs*2,y);}
    c.restore();}
}
