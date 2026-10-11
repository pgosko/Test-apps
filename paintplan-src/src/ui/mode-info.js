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
  }
  if(m==='palette'&&lastPalette){
    $('#swatches').innerHTML=lastPalette.cols.map((c,i)=>`<button class="sw${hl===i?' sel':''}" data-hl="${i}" title="Tap to highlight where this colour appears"><i style="background:${hex2(c.rgb)}"></i><b>${hex2(c.rgb)}</b><span>Value ${Math.round(c.L)}% · ${(c.pct*100).toFixed(1)}%</span></button>`).join('');
  }
  if(m==='remap'&&lastRemap){
    const r=lastRemap;
    $('#mixes').innerHTML=r.mixes.map(x=>{const L=local.util.Lstar(0.2126*local.util.S2L[x.rgb[0]]+0.7152*local.util.S2L[x.rgb[1]]+0.0722*local.util.S2L[x.rgb[2]]);
      return`<button class="sw wide${hl===x.idx?' sel':''}" data-hl="${x.idx}"><i style="background:${hex2(x.rgb)}"></i><span><b>${recipe(x.w,S.pigments)}</b><br>${hex2(x.rgb)} · value ${Math.round(L)}% · ${(x.pct*100).toFixed(1)}%</span></button>`;}).join('');
    $('#remapNote').textContent=`${r.used} distinct mixes used (of ${r.gamutSize} possible${S.rMix?`, ratios in ${r.S}ths`:''}). Mixing is a simple simulation; real pigments vary — treat it as a starting point.`;
  }
}
function drawHist(v){
  const c=$('#hist'),x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);
  for(let i=0;i<v.N;i++){const lo=i===0?0:v.bounds[i],hi=i===v.N-1?100:v.bounds[i+1],g=Math.round(30+i/(Math.max(1,v.N-1))*50);x.fillStyle=`hsl(40,6%,${g}%)`;x.fillRect(lo/100*W,0,(hi-lo)/100*W+1,H);}
  const mx=Math.max(...v.hist)||1;x.fillStyle='rgba(20,20,20,.85)';
  for(let i=0;i<=100;i++){const bh=Math.sqrt(v.hist[i]/mx)*(H-4);x.fillRect(i/101*W,H-bh,W/101+0.5,bh);}
  x.fillStyle='#c8b48f';for(let i=1;i<v.N;i++)x.fillRect(v.bounds[i]/100*W-1,0,2,H);
}
