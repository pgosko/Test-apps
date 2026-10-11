/* core/sample.js — Built-in procedural sample landscape (only for themes with THEME.sample=true). */
function makeSample(){
  const W=1400,H=1050,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});
  const hash=(i,j)=>{let h=(Math.imul(i,374761393)+Math.imul(j,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
  const vn=(px,py)=>{const i=Math.floor(px),j=Math.floor(py),fx=px-i,fy=py-j,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),a=hash(i,j),b=hash(i+1,j),cc=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*ux+(cc-a)*uy+(a-b-cc+d)*ux*uy;};
  const fbm=(px,py,o=5)=>{let s=0,a=0.5,f=1;for(let k=0;k<o;k++){s+=a*vn(px*f+k*17.3,py*f);f*=2;a*=0.5;}return s;};
  const ss=(a,b,v)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t);};
  const hz=Math.round(H*0.58),sunX=W*0.66,sunY=H*0.4,tx=W*0.36,hx=W*0.57;
  let g=x.createLinearGradient(0,0,0,hz);g.addColorStop(0,'#4a74a8');g.addColorStop(0.5,'#93b0cc');g.addColorStop(0.82,'#e9c9a2');g.addColorStop(1,'#f4d8b0');x.fillStyle=g;x.fillRect(0,0,W,hz);
  g=x.createRadialGradient(sunX,sunY,0,sunX,sunY,420);g.addColorStop(0,'rgba(255,244,214,1)');g.addColorStop(0.06,'rgba(255,238,200,.9)');g.addColorStop(0.3,'rgba(255,210,150,.35)');g.addColorStop(1,'rgba(255,200,150,0)');x.fillStyle=g;x.fillRect(0,0,W,hz);
  let id=x.getImageData(0,0,W,hz),d=id.data;
  for(let y=0;y<hz;y++)for(let X=0;X<W;X++){const n=fbm(X/300,y/85),cv=ss(0.5,0.72,n)*(1-y/hz*0.85);if(cv<=0.01)continue;
    const sh=ss(0.55,0.85,fbm(X/300,(y-14)/85)),j=(y*W+X)*4,cr=236-sh*70,cg=228-sh*62,cb=222-sh*40;
    d[j]+=(cr-d[j])*cv;d[j+1]+=(cg-d[j+1])*cv;d[j+2]+=(cb-d[j+2])*cv;}
  x.putImageData(id,0,0);
  const ridge=(base,amp,fr,col,sd,bottom)=>{x.beginPath();x.moveTo(0,bottom);for(let X=0;X<=W;X+=4)x.lineTo(X,base-amp*fbm(X/fr+sd,sd,4));x.lineTo(W,bottom);x.closePath();x.fillStyle=col;x.fill();};
  g=x.createLinearGradient(0,hz-200,0,hz);g.addColorStop(0,'#8796b4');g.addColorStop(1,'#a9b3c4');ridge(hz-30,230,340,g,3,hz);
  g=x.createLinearGradient(0,hz-140,0,hz);g.addColorStop(0,'#5e6f88');g.addColorStop(1,'#7d8aa0');ridge(hz+2,150,230,g,9,hz+2);
  ridge(hz+6,46,70,'#34452f',21,hz+6);
  g=x.createLinearGradient(0,hz,0,H);g.addColorStop(0,'#c5ccd0');g.addColorStop(0.25,'#8a9cad');g.addColorStop(1,'#34506a');x.fillStyle=g;x.fillRect(0,hz+6,W,H-hz-6);
  x.save();x.globalAlpha=0.5;
  for(let i=0;i<260;i++){const t=hash(i,7),y=hz+8+Math.pow(t,1.6)*(H-hz-8),wid=(30+hash(i,3)*160)*(0.4+(y-hz)/(H-hz));const cx=sunX+(hash(i,5)-0.5)*(60+(y-hz)*0.7);
    x.fillStyle=`rgba(255,${222+hash(i,9)*25|0},${170+hash(i,11)*40|0},${0.25+0.5*(1-t)})`;x.fillRect(cx-wid/2,y,wid,1.5+3*t);}
  x.restore();
  x.fillStyle='#6f675c';x.fillRect(hx,hz-22,34,30);x.fillStyle='#efe5d3';x.fillRect(hx+32,hz-22,58,30);
  x.fillStyle='#7d2f22';x.beginPath();x.moveTo(hx-6,hz-20);x.lineTo(hx+27,hz-48);x.lineTo(hx+96,hz-48);x.lineTo(hx+94,hz-20);x.fill();
  x.globalAlpha=0.35;x.fillStyle='#e8dcc8';x.fillRect(hx+32,hz+10,58,22);x.fillStyle='#5e5a52';x.fillRect(hx,hz+10,32,22);x.globalAlpha=1;
  x.beginPath();x.moveTo(0,H*0.66);x.bezierCurveTo(W*0.25,H*0.64,W*0.45,H*0.78,W*0.6,H);x.lineTo(0,H);x.closePath();
  g=x.createLinearGradient(0,H*0.64,0,H);g.addColorStop(0,'#7c8a3e');g.addColorStop(0.5,'#5d6a2c');g.addColorStop(1,'#3f4520');x.fillStyle=g;x.fill();
  x.beginPath();x.moveTo(W*0.22,H);x.bezierCurveTo(W*0.27,H*0.9,W*0.32,H*0.84,W*0.38,H*0.83);x.lineTo(W*0.41,H*0.845);x.bezierCurveTo(W*0.37,H*0.88,W*0.33,H*0.94,W*0.32,H);x.fillStyle='#b5a079';x.fill();
  x.fillStyle='rgba(20,26,14,.55)';x.beginPath();x.ellipse(tx+40,H*0.765,150,18,0,0,Math.PI*2);x.fill();
  x.fillStyle='#2b2118';x.beginPath();x.moveTo(tx-22,H*0.77);x.lineTo(tx-8,H*0.42);x.lineTo(tx+8,H*0.42);x.lineTo(tx+22,H*0.77);x.fill();
  for(let i=0;i<170;i++){const a=hash(i,31)*Math.PI*2,r=Math.sqrt(hash(i,37))*150,bx=tx+Math.cos(a)*r*1.1,by=H*0.3+Math.sin(a)*r*0.9,rr=24+hash(i,41)*32,lit=Math.max(0,(bx-tx+60)/240+(H*0.3+20-by)/380);
    const cg=x.createRadialGradient(bx+rr*0.3,by-rr*0.3,2,bx,by,rr);cg.addColorStop(0,`rgb(${70+lit*90|0},${92+lit*85|0},${36+lit*30|0})`);cg.addColorStop(1,'#1d2a15');
    x.fillStyle=cg;x.beginPath();x.arc(bx,by,rr,0,Math.PI*2);x.fill();}
  for(const [rx,ry,rw,rh] of [[W*0.62,H*0.86,120,46],[W*0.71,H*0.885,70,28],[W*0.52,H*0.92,90,32]]){g=x.createLinearGradient(rx,ry-rh,rx,ry+rh);g.addColorStop(0,'#a59a88');g.addColorStop(0.5,'#5b554c');g.addColorStop(1,'#2c2a27');x.fillStyle=g;x.beginPath();x.ellipse(rx,ry,rw/2,rh/2,0,Math.PI,0);x.fill();x.fillStyle='rgba(30,40,50,.45)';x.beginPath();x.ellipse(rx,ry+2,rw/2,rh/4,0,0,Math.PI);x.fill();}
  id=x.getImageData(0,0,W,H);d=id.data;
  for(let y=0;y<H;y++)for(let X=0;X<W;X++){const j=(y*W+X)*4,v=(fbm(X/45,y/45,3)-0.5)*9+(hash(X,y)-0.5)*5;d[j]+=v;d[j+1]+=v;d[j+2]+=v*0.9;}
  x.putImageData(id,0,0);
  return c;
}
function loadSample(){const c=makeSample();setSource(c,c.width,c.height,{sample:true});idb.del('image').catch(()=>{});}
