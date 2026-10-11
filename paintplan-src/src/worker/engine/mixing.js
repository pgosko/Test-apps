  /* worker/engine/mixing.js — Limited palette: simulated paint mixing gamut, nearest mix, LUT. (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  /* --- limited-palette gamut: simulated paint mixing ---
     Weighted geometric mean of linear-RGB reflectance (a cheap stand-in for single-constant Kubelka-Munk). Recipe ratios are
     parts by volume; each paint's share is scaled by its relative tinting strength ts (from core/paint-library.js, 1 for custom
     colours) so strong pigments (phthalos, Prussian, dioxazine) dominate a mix the way they do on the palette. */
  const GC=new Map();
  function gamut(pigs,mix,S,maxN,ts){
    const T=pigs.map((_,i)=>ts&&ts[i]>0?+ts[i]:1),key=pigs.join(',')+'|'+mix+'|'+S+'|'+maxN+'|'+T.join(',');
    if(GC.has(key))return GC.get(key);
    if(GC.size>16)GC.clear();
    const P=pigs.length,lg=pigs.map(h=>hexLin(h).map(v=>Math.log(Math.max(v,0.0025))));
    let W=[];const cur=new Array(P).fill(0);
    if(!mix||P===1){for(let i=0;i<P;i++){cur.fill(0);cur[i]=S;W.push(cur.slice());}}
    else{
      (function rec(i,rem,nz){
        if(i===P-1){if(rem>0&&nz>=maxN)return;cur[i]=rem;W.push(cur.slice());cur[i]=0;return;}
        for(let v=0;v<=rem;v++){if(v>0&&nz>=maxN)break;cur[i]=v;rec(i+1,rem-v,nz+(v>0?1:0));}
        cur[i]=0;
      })(0,S,0);
      const nzc=a=>a.reduce((s,v)=>s+(v>0),0);
      W.sort((a,b)=>nzc(a)-nzc(b));
    }
    const seen=new Set(),ws=[],labs=[],rgbs=[],o=[0,0,0];
    for(const w of W){
      let tw=0;for(let i=0;i<P;i++)tw+=w[i]*T[i];
      const lin=[0,1,2].map(c=>{let s=0;for(let i=0;i<P;i++)if(w[i])s+=w[i]*T[i]/tw*lg[i][c];return Math.exp(s);});
      const rgb=lin.map(l2s),k=rgb.join(',');if(seen.has(k))continue;seen.add(k);
      toLab(lin[0],lin[1],lin[2],o);ws.push(w);labs.push(o[0],o[1],o[2]);rgbs.push(rgb);
    }
    const g={key,ws,lab:new Float32Array(labs),rgb:rgbs,S,lut:null};GC.set(key,g);return g;
  }
  function nearest(g,x,y,z){let best=0,bd=1e9;const L=g.lab,m=g.ws.length;for(let c=0;c<m;c++){const dx=x-L[3*c],dy=y-L[3*c+1],dz=z-L[3*c+2],d=dx*dx+dy*dy+dz*dz;if(d<bd){bd=d;best=c;}}return[best,Math.sqrt(bd)];}
  function lutOf(g){
    if(g.lut)return g.lut;const lut=new Uint16Array(32768),o=[0,0,0];
    for(let r=0;r<32;r++)for(let gg=0;gg<32;gg++)for(let b=0;b<32;b++){toLab(S2L[r*8+4],S2L[gg*8+4],S2L[b*8+4],o);lut[r<<10|gg<<5|b]=nearest(g,o[0],o[1],o[2])[0];}
    return g.lut=lut;
  }
