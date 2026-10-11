/* ui/picker.js — Colour picker (tap to sample) + suggested mix. */
function doPick(x,y){
  const R=curRect;if(!R||!origData)return;
  let u=(x-R.x)/R.w,v=(y-R.y)/R.h;if(u<0||v<0||u>1||v>1){if(S.compare==='side'){const a=sideRects()[0];u=(x-a.x)/a.w;v=(y-a.y)/a.h;if(u<0||v<0||u>1||v>1){closePick();return;}}else{closePick();return;}}
  if(S.flipH)u=1-u;if(S.flipV)v=1-v;pickPt={u,v};showPick();render();
}
function closePick(){pickPt=null;$('#pick').hidden=true;render();}
function showPick(){
  if(!pickPt||!origData)return;const w=orig.width,h=orig.height,px=clamp(Math.floor(pickPt.u*w),0,w-1),py=clamp(Math.floor(pickPt.v*h),0,h-1);
  // average 3x3 for a steadier reading
  let r=0,g=0,b=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=clamp(px+dx,0,w-1),yy=clamp(py+dy,0,h-1),j=(yy*w+xx)*4;r+=origData.data[j];g+=origData.data[j+1];b+=origData.data[j+2];n++;}
  const rgb=[r/n,g/n,b/n].map(Math.round),U=local.util,lin=rgb.map(c=>U.S2L[c]),lab=U.toLab(lin[0],lin[1],lin[2],[0,0,0]);
  const Ls=U.Lstar(0.2126*lin[0]+0.7152*lin[1]+0.0722*lin[2]),C=Math.hypot(lab[1],lab[2]),warm=lab[1]*0.5736+lab[2]*0.8192;
  const temp=C<0.02?'neutral':warm>0.012?'warm':warm<-0.012?'cool':'neutral';const chroma=C<0.035?'low':C<0.1?'medium':'high';
  let extra='';const lok=labels&&labels.length===w*h;if(lok&&(S.mode==='values'||S.mode==='notan')&&lastValues)extra=` · step <b>${labels[py*w+px]+1}</b> of ${lastValues.N}`;
  if(lok&&S.mode==='palette'&&lastPalette)extra=` · palette colour <b>${labels[py*w+px]+1}</b>`;
  let mixHtml='';
  if(S.pigments.length){const m=local({type:'suggest',pigs:S.pigments.map(p=>p.c),rgb}).res;const q=m.dE<3?'very close':m.dE<6?'close':m.dE<12?'approximate':'outside this palette';
    mixHtml=`<div style="margin-top:4px">Mix (${esc(PALS[S.rPreset]?PALS[S.rPreset][0].split(' (')[0]:'palette')}): <b>${recipe(m.w,S.pigments)}</b><br><span style="color:var(--muted)">simulated · ${q} (ΔE ${m.dE.toFixed(1)})</span></div>`;
    $('#pick').dataset.mix=hex2(m.rgb);}
  const hx=hex2(rgb);
  $('#pick').innerHTML=`<div class="pk-sw" title="Sample on neutral gray"><i style="background:${hx}"></i>${mixHtml?`<i style="background:${$('#pick').dataset.mix}" title="Suggested mix"></i>`:''}</div>
   <div class="pk-t"><b>${hx}</b> <span style="color:var(--muted)">rgb ${rgb.join(', ')}</span><br>Value <b>${Math.round(Ls)}%</b> (L*, ≈ Munsell ${(Ls/10).toFixed(1)})${extra}<br>Chroma ${chroma} · ${temp}${mixHtml}</div>
   <button class="pk-x" aria-label="Close">×</button>`;
  $('#pick').hidden=false;
}
