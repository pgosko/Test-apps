/* ui/mode-info.js — Mode info: value strip/histogram, palette swatches, mixes. */
/* ---------- mode info panels ---------- */
function recipe(w,pigs,S0){
  const nz=w.map((v,i)=>[v,i]).filter(a=>a[0]>0);if(!nz.length)return'';
  const g=nz.reduce((a,b)=>{let x=a,y=b[0];while(y){[x,y]=[y,x%y];}return x;},0);
  if(nz.length===1)return esc((pigs[nz[0][1]]||{n:'?'}).n);
  return nz.sort((a,b)=>b[0]-a[0]).map(a=>`${a[0]/g} ${esc((pigs[a[1]]||{n:'?'}).n)}`).join(' + ');
}
function textOn(L){return L>55?'#111':'#f4f4f4';}
function renderModeInfo(){
  const m=S.mode;
  if((m==='values'||m==='notan')&&lastValues){
    const v=lastValues,N=v.N;let h='';
    for(let i=0;i<N;i++){const g=Math.round(v.outL[i]),lo=i===0?0:v.bounds[i],hi=i===N-1?100:v.bounds[i+1];
      const c=local.util.l2s(v.outL[i]>8?Math.pow((v.outL[i]+16)/116,3):v.outL[i]/903.3);
      h+=`<button class="step${hl===i?' sel':''}" data-hl="${i}" style="background:rgb(${c},${c},${c});color:${textOn(v.outL[i])}" title="Step ${i+1}: input L* ${Math.round(lo)}–${Math.round(hi)}, ${Math.round(v.counts[i]*100)}% of image"><b>${i+1}</b><span>${g}%</span><small>${Math.round(lo)}–${Math.round(hi)}</small><small>${Math.round(v.counts[i]*100)}%</small></button>`;}
    $('#strip').innerHTML=h;drawHist(v);
    const vn=$('#vcNote');if(vn)vn.textContent=v.color?`Only lightness changes: hue and chroma are kept (OKLab). ${v.color.gamutPct>0.0005?`${(v.color.gamutPct*100).toFixed(1)}% of pixels had to lose some chroma to stay displayable (hue and value still exact).`:'Every pixel kept its full chroma.'}${v.color.live?' Preview…':''}`:'';
  }
  if(m==='palette'&&lastPalette){
    $('#swatches').innerHTML=lastPalette.cols.map((c,i)=>`<button class="sw${hl===i?' sel':''}" data-hl="${i}" title="Tap to highlight where this colour appears"><i style="background:${hex2(c.rgb)}"></i><b>${hex2(c.rgb)}</b><span>Value ${Math.round(c.L)}% · ${(c.pct*100).toFixed(1)}%</span></button>`).join('');
  }
  if(m==='remap'&&lastRemap){
    const r=lastRemap;
    $('#mixes').innerHTML=r.mixes.map(x=>{const L=local.util.Lstar(0.2126*local.util.S2L[x.rgb[0]]+0.7152*local.util.S2L[x.rgb[1]]+0.0722*local.util.S2L[x.rgb[2]]);
      return`<button class="sw wide${hl===x.idx?' sel':''}" data-hl="${x.idx}"><i style="background:${hex2(x.rgb)}"></i><span><b>${recipe(x.w,S.pigments)}</b><br>${hex2(x.rgb)} · value ${Math.round(L)}% · ${(x.pct*100).toFixed(1)}%</span></button>`;}).join('');
    $('#remapNote').textContent=`${r.used} distinct mixes used (of ${r.gamutSize} possible${S.rMix?`, ratios in ${r.S}ths`:''}). Recipes are approximate: a simulated mix (reflectance blend weighted by each paint’s typical tinting strength) using reference colours; real tubes vary — treat it as a starting point.`;
  }
}
