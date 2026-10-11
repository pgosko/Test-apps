  /* worker/engine/values.js — Value study: posterised CIE L* steps + histogram. (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  /* --- value study (posterised CIE L*) --- */
  function valueSteps(p){
    return cached('vs'+JSON.stringify(p),()=>{
      const {w,h}=img,n=w*h,N=Math.max(1,p.steps|0),b=p.black,wl=Math.max(p.white,b+1);
      const m=Math.min(Math.max(p.mid,b+0.5),wl-0.5),g=Math.log(0.5)/Math.log((m-b)/(wl-b));
      const L=Lb(p.blur),lut=new Uint8Array(1001);
      for(let i=0;i<=1000;i++){let t=(i/10-b)/(wl-b);t=t<0?0:t>1?1:t;t=Math.pow(t,g);let s=Math.floor(t*N);if(s>=N)s=N-1;lut[i]=s;}
      let lab=new Uint8Array(n);
      for(let i=0;i<n;i++){const v=L[i];lab[i]=lut[v<=0?0:v>=100?1000:(v*10+0.5)|0];}
      if(p.smooth>0)lab=modeFilter(lab,w,h,N,Math.max(1,Math.round(p.smooth*scl()*1.5)),2);
      const counts=new Array(N).fill(0);for(let i=0;i<n;i++)counts[lab[i]]++;
      const bounds=[];for(let i=0;i<=N;i++)bounds.push(b+(wl-b)*Math.pow(i/N,1/g));
      const outL=[];for(let i=0;i<N;i++)outL.push(N>1?i/(N-1)*100:50);
      return {lab,N,counts:counts.map(c=>c/n),bounds,outL};
    });
  }
  function histL(){return cached('hist',()=>{const h=new Array(101).fill(0),n=img.L.length;for(let i=0;i<n;i++)h[Math.max(0,Math.min(100,Math.round(img.L[i])))]++;return h.map(v=>v/n);});}
