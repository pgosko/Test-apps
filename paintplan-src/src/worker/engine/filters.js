  /* worker/engine/filters.js — Blur (3-pass box ~ gaussian) and majority/mode filter for label maps. (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  /* --- blur: 3-pass box blur ≈ gaussian --- */
  function boxH(s,d,w,h,r){const k=1/(2*r+1);for(let y=0;y<h;y++){const o=y*w;let acc=0;for(let i=-r;i<=r;i++)acc+=s[o+(i<0?0:i>=w?w-1:i)];for(let x=0;x<w;x++){d[o+x]=acc*k;const xa=x+r+1,xr=x-r;acc+=s[o+(xa>=w?w-1:xa)]-s[o+(xr<0?0:xr)];}}}
  function boxV(s,d,w,h,r){const k=1/(2*r+1);for(let x=0;x<w;x++){let acc=0;for(let i=-r;i<=r;i++)acc+=s[(i<0?0:i>=h?h-1:i)*w+x];for(let y=0;y<h;y++){d[y*w+x]=acc*k;const ya=y+r+1,yr=y-r;acc+=s[(ya>=h?h-1:ya)*w+x]-s[(yr<0?0:yr)*w+x];}}}
  function blur1(src,w,h,sigma){
    if(!(sigma>0.35))return src;
    const r=Math.max(1,Math.round((Math.sqrt(4*sigma*sigma+1)-1)/2));
    const a=new Float32Array(src),b=new Float32Array(src.length);
    for(let p=0;p<3;p++){boxH(a,b,w,h,r);boxV(b,a,w,h,r);}
    return a;
  }
  const scl=()=>Math.max(img.w,img.h)/1000;
  const Lb=s=>s>0?cached('L'+s,()=>blur1(img.L,img.w,img.h,s*scl())):img.L;
  const labB=s=>s>0?cached('lab'+s,()=>[blur1(img.oL,img.w,img.h,s*scl()),blur1(img.oA,img.w,img.h,s*scl()),blur1(img.oB,img.w,img.h,s*scl())]):[img.oL,img.oA,img.oB];
  function rgbB(sigpx){
    const base=cached('rgb0',()=>{const n=img.w*img.h,R=new Float32Array(n),G=new Float32Array(n),B=new Float32Array(n);for(let i=0,j=0;i<n;i++,j+=4){R[i]=img.rgba[j];G[i]=img.rgba[j+1];B[i]=img.rgba[j+2];}return[R,G,B];});
    if(!(sigpx>0.35))return base;
    return cached('rgb'+sigpx,()=>base.map(c=>blur1(c,img.w,img.h,sigpx)));
  }

  /* --- majority (mode) filter on small label maps: removes speckles, simplifies shapes --- */
  function modeFilter(lab,w,h,K,r,iters){
    let src=lab,dst=new Uint8Array(lab.length);const hist=new Int32Array(K);
    for(let it=0;it<iters;it++){
      for(let y=0;y<h;y++){
        hist.fill(0);const y0=Math.max(0,y-r),y1=Math.min(h-1,y+r);
        for(let x=0;x<=r&&x<w;x++)for(let yy=y0;yy<=y1;yy++)hist[src[yy*w+x]]++;
        for(let x=0;x<w;x++){
          const i=y*w+x;let best=src[i],bc=hist[best];
          for(let k=0;k<K;k++)if(hist[k]>bc){bc=hist[k];best=k;}
          dst[i]=best;
          const xo=x-r,xi=x+r+1;
          if(xo>=0)for(let yy=y0;yy<=y1;yy++)hist[src[yy*w+xo]]--;
          if(xi<w)for(let yy=y0;yy<=y1;yy++)hist[src[yy*w+xi]]++;
        }
      }
      const t=src;src=dst;dst=t===lab?new Uint8Array(lab.length):t;
    }
    return src;
  }
