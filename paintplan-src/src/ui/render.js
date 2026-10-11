/* ui/render.js — Main canvas rendering (view, compare, position view). */
/* ---------- rendering ---------- */
const cv=$('#view'),ctx=cv.getContext('2d');let dpr=1,rq=0;
function resize(){dpr=Math.min(window.devicePixelRatio||1,3);const r=cv.getBoundingClientRect();cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));draw();}
function render(){if(!rq)rq=requestAnimationFrame(()=>{rq=0;draw();});}
function fitRect(w,h,box,m){const s=Math.min((box.w-2*m)/w,(box.h-2*m)/h);return{x:box.x+(box.w-w*s)/2,y:box.y+(box.h-h*s)/2,w:w*s,h:h*s,s};}
function imageRect(){const f=fitRect(orig.width,orig.height,{x:0,y:0,w:cv.width,h:cv.height},10*dpr),s=f.s*view.zoom,w=orig.width*s,h=orig.height*s;return{x:(cv.width-w)/2+view.px,y:(cv.height-h)/2+view.py,w,h,s};}
function sideRects(){const W=cv.width,H=cv.height,m=8*dpr;if(W>=H)return[fitRect(orig.width,orig.height,{x:0,y:0,w:W/2,h:H},m),fitRect(orig.width,orig.height,{x:W/2,y:0,w:W/2,h:H},m)];
  return[fitRect(orig.width,orig.height,{x:0,y:0,w:W,h:H/2},m),fitRect(orig.width,orig.height,{x:0,y:H/2,w:W,h:H/2},m)];}
function draw(){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=S.stageBg;ctx.fillRect(0,0,cv.width,cv.height);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(posMode&&src){
    const R=posRect();curRect=null;
    ctx.save();ctx.globalAlpha=0.3;drawPlaced(ctx,R);ctx.restore();
    ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=14*dpr;ctx.fillStyle=S.canvasColor;ctx.fillRect(R.x,R.y,R.w,R.h);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(R.x,R.y,R.w,R.h);ctx.clip();
    const current=!posGest&&!placeDirty&&origData&&(S.mode==='photo'||procImageId===imageId);
    if(current)drawScene(ctx,R,dpr,{});else{drawPlaced(ctx,R);drawOverlays(ctx,R,dpr,{});}
    ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.5*dpr;ctx.strokeRect(R.x,R.y,R.w,R.h);
    const t=`${fmtN(S.cw)} × ${fmtN(S.ch)} ${S.unit} canvas`;ctx.font=`${12*dpr}px system-ui,sans-serif`;ctx.textBaseline='bottom';ctx.fillStyle='rgba(231,229,225,.85)';ctx.fillText(t,R.x,R.y-5*dpr);
    return;
  }
  if(!origData){if(!THEME.sample)return; /* themes without the sample show the #empty overlay */ctx.fillStyle='#aaa';ctx.font=`${15*dpr}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText('Open a photo, drop one here, or load the sample',cv.width/2,cv.height/2);ctx.textAlign='start';return;}
  if(S.compare==='side'){
    const [a,b]=sideRects();drawFlipped(ctx,orig,a);drawScene(ctx,b,dpr,{});curRect=b;
    ctx.font=`${11*dpr}px system-ui,sans-serif`;ctx.textBaseline='top';for(const [R,t] of [[a,'Photo'],[b,MODE_INFO[S.mode][0]]]){const tw=ctx.measureText(t).width;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(R.x+4*dpr,R.y+4*dpr,tw+10*dpr,17*dpr);ctx.fillStyle='#fff';ctx.fillText(t,R.x+9*dpr,R.y+7*dpr);}
  }else{const R=imageRect();curRect=R;drawScene(ctx,R,dpr,{split:S.compare==='split'});}
  if(pickPt&&curRect){const P=mapper(curRect);const [px,py]=P(pickPt.u,pickPt.v);ctx.lineWidth=2*dpr;ctx.strokeStyle='#000';ctx.beginPath();ctx.arc(px,py,8*dpr,0,7);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.2*dpr;ctx.beginPath();ctx.arc(px,py,8*dpr,0,7);ctx.stroke();}
}
function drawFlipped(c,img,R){const h=fH(),v=fV();c.save();c.translate(R.x+(h?R.w:0),R.y+(v?R.h:0));c.scale(h?-1:1,v?-1:1);c.drawImage(img,0,0,R.w,R.h);c.restore();}
function drawScene(c,R,k,o){
  if(S.lines==='only'){c.fillStyle='#fbfaf7';c.fillRect(R.x,R.y,R.w,R.h);}else drawFlipped(c,disp,R);
  if(S.lines!=='off'&&edgeReady&&(!posMode||edgeImageId===imageId)){c.save();c.globalAlpha=S.lineAlpha;drawFlipped(c,edgeC,R);c.restore();}
  if(o.split){const sx=R.x+R.w*S.split;c.save();c.beginPath();c.rect(R.x,R.y,sx-R.x,R.h);c.clip();drawFlipped(c,orig,R);c.restore();
    c.fillStyle='rgba(255,255,255,.9)';c.fillRect(sx-k,R.y,2*k,R.h);}
  drawOverlays(c,R,k,o);
}
function mapper(R){const h=fH(),vv=fV();return(u,v)=>[R.x+(h?1-u:u)*R.w,R.y+(vv?1-v:v)*R.h];}
