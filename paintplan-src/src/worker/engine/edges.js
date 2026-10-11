  /* worker/engine/edges.js — Contours: Canny-like edges or simplified region outlines; cleanup. (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  /* --- edges: Canny-like (blur → Sobel → non-max suppression → hysteresis) or region outlines --- */
  function removeSmall(mask,w,h,min){
    const n=w*h,seen=new Uint8Array(n),st=new Int32Array(n),comp=new Int32Array(n);
    for(let i=0;i<n;i++){
      if(!mask[i]||seen[i])continue;let sp=0,cn=0;st[sp++]=i;seen[i]=1;
      while(sp){const k=st[--sp];comp[cn++]=k;const x=k%w,y=(k-x)/w;
        for(let dy=-1;dy<=1;dy++){const ny=y+dy;if(ny<0||ny>=h)continue;for(let dx=-1;dx<=1;dx++){const nx=x+dx;if(nx<0||nx>=w)continue;const j=ny*w+nx;if(mask[j]&&!seen[j]){seen[j]=1;st[sp++]=j;}}}}
      if(cn<min)for(let c=0;c<cn;c++)mask[comp[c]]=0;
    }
  }
  function dilate(m,w,h,r){
    const t=new Uint8Array(m.length),o=new Uint8Array(m.length);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let k=-r;k<=r&&!v;k++){const xx=x+k;if(xx>=0&&xx<w)v=m[y*w+xx];}t[y*w+x]=v;}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let k=-r;k<=r&&!v;k++){const yy=y+k;if(yy>=0&&yy<h)v=t[yy*w+x];}o[y*w+x]=v;}
    return o;
  }
  function edges(m){
    const p=m.p,{w,h}=img,n=w*h,sc=scl();let mask=new Uint8Array(n);
    if(p.src==='edges'){
      const sg=Math.max(0.4,p.blur*sc),chans=[blur1(img.L,w,h,sg)];
      if(p.color!==false){chans.push(blur1(img.oA.map(v=>v*110),w,h,sg),blur1(img.oB.map(v=>v*110),w,h,sg));}
      const mag=new Float32Array(n),dir=new Uint8Array(n),nms=new Float32Array(n);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;let s2=0,bm=-1,bgx=0,bgy=0;
        for(const L of chans){
          const gx=(L[i-w+1]+2*L[i+1]+L[i+w+1])-(L[i-w-1]+2*L[i-1]+L[i+w-1]);
          const gy=(L[i+w-1]+2*L[i+w]+L[i+w+1])-(L[i-w-1]+2*L[i-w]+L[i-w+1]);
          const m2=gx*gx+gy*gy;s2+=m2;if(m2>bm){bm=m2;bgx=gx;bgy=gy;}}
        mag[i]=Math.sqrt(s2);const ax=Math.abs(bgx),ay=Math.abs(bgy);
        dir[i]=ay<=ax*0.4142?0:ay>=ax*2.4142?2:(bgx*bgy>0?1:3);}
      let max=0;
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,v=mag[i];if(v<0.5)continue;const d=dir[i];let a,b;
        if(d===0){a=mag[i-1];b=mag[i+1];}else if(d===2){a=mag[i-w];b=mag[i+w];}else if(d===1){a=mag[i-w-1];b=mag[i+w+1];}else{a=mag[i-w+1];b=mag[i+w-1];}
        if(v>a&&v>=b){nms[i]=v;if(v>max)max=v;}}
      const BINS=2048,hist=new Uint32Array(BINS);let tot=0;
      for(let i=0;i<n;i++)if(nms[i]>0){hist[Math.min(BINS-1,(nms[i]/max*BINS)|0)]++;tot++;}
      const frac=0.004+Math.pow(p.detail/100,2)*0.6;let acc=0,hb=BINS-1;
      for(;hb>0;hb--){acc+=hist[hb];if(acc>=tot*frac)break;}
      const high=Math.max(6,hb/BINS*max),low=high*0.45,st=new Int32Array(n);let sp=0;
      for(let i=0;i<n;i++){if(nms[i]>=high&&!mask[i]){mask[i]=255;st[sp++]=i;
        while(sp){const k=st[--sp];const x=k%w,y=(k-x)/w;
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const j=ny*w+nx;if(!mask[j]&&nms[j]>=low){mask[j]=255;st[sp++]=j;}}}}}
    }else{
      const lab=p.src==='values'?valueSteps(p.v).lab:paletteLabels(p.pal).labels;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if((x<w-1&&lab[i]!==lab[i+1])||(y<h-1&&lab[i]!==lab[i+w]))mask[i]=255;}
    }
    if(p.clean>0)removeSmall(mask,w,h,Math.round(p.clean*sc));
    if(p.thick>1)mask=dilate(mask,w,h,p.thick-1);
    return {res:{type:'edges',kind:'edges',imageId:img.id,w,h,mask:mask.buffer},tr:[mask.buffer]};
  }
