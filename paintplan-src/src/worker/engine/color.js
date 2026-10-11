  /* worker/engine/color.js — Colour science: sRGB <-> linear, CIE L*, OKLab, gray LUTs. (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  const S2L=new Float32Array(256);
  for(let i=0;i<256;i++){const c=i/255;S2L[i]=c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
  const L2S=new Uint8Array(4097);
  for(let i=0;i<=4096;i++){const v=i/4096;L2S[i]=Math.round(255*(v<=0.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-0.055));}
  const l2s=v=>L2S[v<=0?0:v>=1?4096:(v*4096+0.5)|0];
  function toLab(r,g,b,o){
    const l=0.4122214708*r+0.5363325363*g+0.0514459929*b,m=0.2119034982*r+0.6806995451*g+0.1073969566*b,s=0.0883024619*r+0.2817188376*g+0.6299787005*b;
    const l_=Math.cbrt(l),m_=Math.cbrt(m),s_=Math.cbrt(s);
    o[0]=0.2104542553*l_+0.7936177850*m_-0.0040720468*s_;
    o[1]=1.9779984951*l_-2.4285922050*m_+0.4505937099*s_;
    o[2]=0.0259040371*l_+0.7827717662*m_-0.8086757660*s_;return o;
  }
  function fromLab(L,a,b,o){
    const l_=L+0.3963377774*a+0.2158037573*b,m_=L-0.1055613458*a-0.0638541728*b,s_=L-0.0894841775*a-1.2914855480*b;
    const l=l_*l_*l_,m=m_*m_*m_,s=s_*s_*s_;
    o[0]=4.0767416621*l-3.3077115913*m+0.2309699292*s;
    o[1]=-1.2684380046*l+2.6097574011*m-0.3413193965*s;
    o[2]=-0.0041960863*l-0.7034186147*m+1.7076147010*s;return o;
  }
  const Lstar=Y=>Y>0.008856?116*Math.cbrt(Y)-16:903.3*Y;
  const YofL=L=>L>8?Math.pow((L+16)/116,3):L/903.3;
  const GRAY=new Uint8Array(1001);for(let i=0;i<=1000;i++)GRAY[i]=l2s(YofL(i/10));
  const grayOfL=L=>GRAY[L<=0?0:L>=100?1000:(L*10+0.5)|0];
  const hexLin=h=>{const v=parseInt(h.slice(1),16);return[S2L[v>>16&255],S2L[v>>8&255],S2L[v&255]];};
