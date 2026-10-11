  /* worker/engine/image-cache.js — Current working image (planes) + per-image memo cache; setImage(). (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  let img=null;
  function cached(key,fn){let v=img.cache.get(key);if(v===undefined){if(img.cache.size>40)img.cache.clear();v=fn();img.cache.set(key,v);}return v;}

  function setImage(m){
    const w=m.w,h=m.h,n=w*h,rgba=new Uint8ClampedArray(m.data);
    const L=new Float32Array(n),A=new Float32Array(n),B=new Float32Array(n),C=new Float32Array(n),o=[0,0,0];
    for(let i=0,j=0;i<n;i++,j+=4){
      const r=S2L[rgba[j]],g=S2L[rgba[j+1]],b=S2L[rgba[j+2]];
      L[i]=Lstar(0.2126*r+0.7152*g+0.0722*b);
      toLab(r,g,b,o);A[i]=o[0];B[i]=o[1];C[i]=o[2];
    }
    img={id:m.id,w,h,rgba,L,oL:A,oA:B,oB:C,cache:new Map()};
  }
