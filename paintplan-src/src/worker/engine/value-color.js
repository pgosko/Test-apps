  /* worker/engine/value-color.js — Value-linked colour: the Values level settings drive a lightness remap of the colour
     photo. Only lightness changes: OKLab a,b (hue + chroma) are kept, OKLab L is solved so the pixel's luminance hits the
     target value (CIE L*, the same scale as the value study). Out-of-gamut results lose chroma at constant hue and
     luminance (binary search). Detail: the remap is applied to an edge-preserving base layer (self-guided filter) and the
     texture (L - base) is added back. See research/value-linked-color.md. (fragment: concatenated inside function ENGINE(){…}) */
  // luminance Y as a function of OKLab l_,m_,s_ (cubed): Y = YW·(l,m,s)
  const YW=[0.2126*4.0767416621+0.7152*-1.2684380046+0.0722*-0.0041960863,0.2126*-3.3077115913+0.7152*2.6097574011+0.0722*-0.7034186147,0.2126*0.2309699292+0.7152*-0.3413193965+0.0722*1.7076147010];
  /* OKLab lightness L that gives luminance Yt at fixed a,b (Y is a cubic in L → Newton converges in a few steps) */
  function solveL(L,a,b,Yt,it){
    const ka=0.3963377774*a+0.2158037573*b,km=-0.1055613458*a-0.0638541728*b,ks=-0.0894841775*a-1.2914855480*b;
    for(let k=0;k<it;k++){
      const l=L+ka,m=L+km,s=L+ks,Y=YW[0]*l*l*l+YW[1]*m*m*m+YW[2]*s*s*s,d=3*(YW[0]*l*l+YW[1]*m*m+YW[2]*s*s);
      if(!(d>1e-7))break;const st=(Y-Yt)/d;L-=st;if(L<0)L=0;else if(L>1.2)L=1.2;if(st<1e-7&&st>-1e-7)break;
    }
    return L;
  }
  const inG=o=>o[0]>=-1e-4&&o[0]<=1.0001&&o[1]>=-1e-4&&o[1]<=1.0001&&o[2]>=-1e-4&&o[2]<=1.0001;
  /* fine linear → sRGB (0–255 float) table for dithered output */
  const L2SF=new Float32Array(16385);for(let i=0;i<=16384;i++){const v=i/16384;L2SF[i]=255*(v<=0.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-0.055);}
  const l2sf=v=>L2SF[v<=0?0:v>=1?16384:(v*16384+0.5)|0];
  /* triangular-PDF dither in [-1,1] LSB from an integer hash (deterministic per pixel/channel) */
  const hU=(i,k)=>((Math.imul((i*3+k)^0x9e3779b9,2654435761)>>>8)&65535)/65535;
  const tpdf=(i,k)=>hU(i,k)+hU(i+7919,k)-1;
  /* exact box mean (two 1-D passes) */
  function boxMean(s,w,h,r){const t=new Float32Array(s.length),d=new Float32Array(s.length);boxH(s,t,w,h,r);boxV(t,d,w,h,r);return d;}
  /* self-guided filter (He et al. 2010) on L*: edge-preserving base layer, O(n) for any radius */
  function guidedBase(r,eps){
    return cached('gb'+r+'|'+eps,()=>{
      const {w,h}=img,n=w*h,I=img.L,II=new Float32Array(n);for(let i=0;i<n;i++)II[i]=I[i]*I[i];
      const mI=boxMean(I,w,h,r),mII=boxMean(II,w,h,r),A=new Float32Array(n),B=new Float32Array(n);
      for(let i=0;i<n;i++){const v=mII[i]-mI[i]*mI[i],a=v/(v+eps);A[i]=a;B[i]=mI[i]-a*mI[i];}
      const mA=boxMean(A,w,h,r),mB=boxMean(B,w,h,r),q=new Float32Array(n);
      for(let i=0;i<n;i++)q[i]=mA[i]*I[i]+mB[i];
      return q;
    });
  }
  /* continuous tone curve F (input L* → output L*, 1001-entry LUT + slope) through the level settings:
     auto = the black/mid/white levels curve; custom = monotone cubic (Fritsch–Carlson) through boundary j → j/N */
  function toneCurve(p,N,bounds,cuts){
    const F=new Float32Array(1001),D=new Float32Array(1001);
    if(!cuts){const b=p.black,wl=Math.max(p.white,b+1),m=Math.min(Math.max(p.mid,b+0.5),wl-0.5),g=Math.log(0.5)/Math.log((m-b)/(wl-b));
      for(let i=0;i<=1000;i++){let t=(i/10-b)/(wl-b);t=t<0?0:t>1?1:t;F[i]=100*Math.pow(t,g);}}
    else{
      const x=bounds,y=x.map((_,j)=>100*j/N),K=x.length,dl=[],mt=new Array(K).fill(0);
      for(let j=0;j<K-1;j++)dl.push((y[j+1]-y[j])/(x[j+1]-x[j]));
      mt[0]=dl[0];mt[K-1]=dl[K-2];for(let j=1;j<K-1;j++)mt[j]=dl[j-1]*dl[j]<=0?0:(dl[j-1]+dl[j])/2;
      for(let j=0;j<K-1;j++){if(dl[j]===0){mt[j]=mt[j+1]=0;continue;}const a=mt[j]/dl[j],bb=mt[j+1]/dl[j],s=a*a+bb*bb;if(s>9){const t=3/Math.sqrt(s);mt[j]=t*a*dl[j];mt[j+1]=t*bb*dl[j];}}
      let j=0;for(let i=0;i<=1000;i++){const v=i/10;while(j<K-2&&v>x[j+1])j++;const hh=x[j+1]-x[j],t=Math.min(1,Math.max(0,(v-x[j])/hh)),t2=t*t,t3=t2*t;
        F[i]=(2*t3-3*t2+1)*y[j]+(t3-2*t2+t)*hh*mt[j]+(-2*t3+3*t2)*y[j+1]+(t3-t2)*hh*mt[j+1];}
    }
    for(let i=0;i<=1000;i++){const a=F[Math.max(0,i-1)],b=F[Math.min(1000,i+1)];let d=(b-a)/((Math.min(1000,i+1)-Math.max(0,i-1))/10);D[i]=d<0?0:d>3?3:d;}
    return{F,D};
  }
  /* writes the colour result into out (RGBA); r = valueSteps(p) result (labels, bounds, outL) */
  function valueColor(p,r,out){
    const c=p.color,{w,h}=img,n=w*h,N=r.N,L0=img.L,A=img.oA,Bb=img.oB,OL=img.oL,sc=scl();
    const det=Math.min(1,Math.max(0,+c.detail||0)),str=Math.min(1,Math.max(0,c.strength==null?1:+c.strength)),smooth=c.style==='smooth';
    const base=guidedBase(Math.max(2,Math.round((2+1.5*(p.blur||0))*sc)),36);
    const cuts=Array.isArray(p.cuts)&&p.cuts.length===N-1?p.cuts:null;
    let v=null,T=null;
    if(!smooth){v=new Float32Array(N);
      if(c.out==='study')for(let s=0;s<N;s++)v[s]=r.outL[s];
      else if(c.out==='avg'){const sm=new Float64Array(N),cn=new Float64Array(N);for(let i=0;i<n;i++){sm[r.lab[i]]+=L0[i];cn[r.lab[i]]++;}for(let s=0;s<N;s++)v[s]=cn[s]?sm[s]/cn[s]:(s+0.5)/N*100;}
      else for(let s=0;s<N;s++)v[s]=(s+0.5)/N*100;}
    else T=toneCurve(p,N,r.bounds,cuts);
    const live=!!p.live,step=live?2:1,o=[0,0,0],gflag=p.color.gamut?new Uint8Array(n):null;let gcount=0,done=0;
    for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){
      const i=y*w+x,Lin=L0[i],Bs=base[i],Dt=Lin-Bs;let Lo;
      if(!smooth)Lo=v[r.lab[i]]+det*Dt;
      else{const k=Bs<=0?0:Bs>=100?1000:(Bs*10+0.5)|0;Lo=T.F[k]+Dt*(det+(1-det)*T.D[k]);}
      let Lt=Lin+str*(Lo-Lin);Lt=Lt<0?0:Lt>100?100:Lt;
      const Yt=YofL(Lt),Yo=YofL(Lin),a=A[i],b=Bb[i];
      let L=Yo>1e-6?OL[i]*Math.cbrt(Yt/Yo):Math.cbrt(Yt);
      L=solveL(L,a,b,Yt,6);fromLab(L,a,b,o);
      let gm=0;
      if(!inG(o)){gm=1;let lo=0,hi=1,Lk=L;
        for(let it=0;it<12;it++){const k=(lo+hi)/2;Lk=solveL(Lk,a*k,b*k,Yt,3);fromLab(Lk,a*k,b*k,o);if(inG(o))lo=k;else hi=k;}
        Lk=solveL(Lk,a*lo,b*lo,Yt,4);fromLab(Lk,a*lo,b*lo,o);}
      if(gm)gcount++;done++;
      // dithered 8-bit output (TPDF, ±1 LSB) avoids banding in smooth gradients
      const nz=tpdf(i,1),R=l2sf(o[0])+nz,G=l2sf(o[1])+nz,B=l2sf(o[2])+nz;   // one noise value for all channels → dithers lightness, not hue
      let q0=R,q1=G,q2=B;if(gflag&&gm&&((x+y)&7)<3){q0=R*0.35+255*0.65;q1=G*0.35;q2=B*0.35+200*0.65;}
      q0=q0<0?0:q0>255?255:q0+0.5|0;q1=q1<0?0:q1>255?255:q1+0.5|0;q2=q2<0?0:q2>255?255:q2+0.5|0;
      for(let yy=y;yy<Math.min(h,y+step);yy++)for(let xx=x;xx<Math.min(w,x+step);xx++){const j=(yy*w+xx)*4;out[j]=q0;out[j+1]=q1;out[j+2]=q2;out[j+3]=255;}
    }
    return{gamutPct:done?gcount/done:0,style:smooth?'smooth':'steps',outL:v?Array.from(v):r.outL,live};
  }
