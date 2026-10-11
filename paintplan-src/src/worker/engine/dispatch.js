  /* worker/engine/dispatch.js — Message handler: process()/handle(); exposes handle.util. (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  function process(m){
    const {w,h}=img,n=w*h,out=new Uint8ClampedArray(n*4),p=m.p||{},sc=scl();let labels=null,info=null;
    const put=(i,r,g,b)=>{const j=i*4;out[j]=r;out[j+1]=g;out[j+2]=b;out[j+3]=255;};
    switch(m.mode){
      case 'gray':for(let i=0;i<n;i++){const g=grayOfL(img.L[i]);put(i,g,g,g);}break;
      case 'squint':{const [R,G,B]=rgbB(p.squint*3*sc);for(let i=0;i<n;i++)put(i,R[i],G[i],B[i]);break;}
      case 'values':case 'notan':{
        const r=valueSteps(p),g=r.outL.map(grayOfL);
        for(let i=0;i<n;i++){const v=g[r.lab[i]];put(i,v,v,v);}
        labels=r.lab.slice();info={N:r.N,counts:r.counts,bounds:r.bounds,outL:r.outL,hist:histL(),black:p.black,white:p.white,custom:!!(p.cuts&&p.cuts.length===r.N-1)};break;}
      case 'palette':{
        const r=paletteLabels(p);
        for(let i=0;i<n;i++){const c=r.cols[r.labels[i]].rgb;put(i,c[0],c[1],c[2]);}
        labels=r.labels.slice();info={cols:r.cols.map(c=>({rgb:c.rgb,L:c.L,pct:c.pct}))};break;}
      case 'remap':{
        const g=gamut(p.pigs,p.mix,p.mix?(p.pigs.length>8?6:8):1,3),lut=lutOf(g);
        const [R,G,B]=rgbB(p.blur*sc),l16=new Uint16Array(n),cnt=new Uint32Array(g.ws.length);
        for(let i=0;i<n;i++){const k=lut[(R[i]>>3)<<10|(G[i]>>3)<<5|(B[i]>>3)];l16[i]=k;cnt[k]++;const c=g.rgb[k];put(i,c[0],c[1],c[2]);}
        const idx=[];for(let k=0;k<cnt.length;k++)if(cnt[k]>0)idx.push(k);
        idx.sort((a,b)=>cnt[b]-cnt[a]);
        info={gamutSize:g.ws.length,S:g.S,used:idx.length,mixes:idx.slice(0,12).map(k=>({idx:k,w:g.ws[k],rgb:g.rgb[k],pct:cnt[k]/n}))};
        labels=l16;break;}
      case 'temp':{
        const s=p.s||1;
        for(let i=0;i<n;i++){const a=img.oA[i],b=img.oB[i];let v=(a*0.5736+b*0.8192)/0.11*s;v=v<-1?-1:v>1?1:v;
          const g=grayOfL(img.L[i]),t=Math.pow(Math.abs(v),0.8),c=v>0?[232,122,38]:[62,122,224];
          put(i,g+(c[0]-g)*t,g+(c[1]-g)*t,g+(c[2]-g)*t);}break;}
      case 'chroma':{
        const s=p.s||1;
        for(let i=0;i<n;i++){const C=Math.hypot(img.oA[i],img.oB[i]);let v=C/0.22*s;v=v>1?1:v;const g=255*Math.sqrt(v);put(i,g,g,g*0.92+20*(1-v));}break;}
      default:out.set(img.rgba);
    }
    const tr=[out.buffer];if(labels)tr.push(labels.buffer);
    return {res:{type:'process',kind:'process',imageId:img.id,mode:m.mode,w,h,rgba:out.buffer,labels:labels?labels.buffer:null,l16:labels instanceof Uint16Array,info},tr};
  }

  function handle(m){
    if(m.type==='setImage'){setImage(m);return {res:{type:'ack'},tr:[]};}
    if(m.type==='suggest'){
      const g=gamut(m.pigs,true,10,3),o=toLab(S2L[m.rgb[0]],S2L[m.rgb[1]],S2L[m.rgb[2]],[0,0,0]),[k,d]=nearest(g,o[0],o[1],o[2]);
      return {res:{type:'suggest',w:g.ws[k],rgb:g.rgb[k],dE:d*100,S:10},tr:[]};
    }
    if(!img||img.id!==m.imageId)return {res:{type:'stale',kind:m.type},tr:[]};
    if(m.type==='process')return process(m);
    if(m.type==='edges')return edges(m);
    return {res:{type:'error',kind:m.type,msg:'unknown'},tr:[]};
  }
  handle.util={toLab,fromLab,Lstar,S2L,l2s};
  return handle;
