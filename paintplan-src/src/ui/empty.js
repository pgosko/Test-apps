/* ui/empty.js — Empty state for themes without the built-in sample (THEME.sample=false).
   The theme template provides <button id="empty">…</button> inside #stage; body.noimg shows it. */
function showEmpty(){document.body.classList.add('noimg');render();}
function clearImage(){idb.del('image').catch(()=>{});if(posMode)setPosMode(false);if(src&&src.url)URL.revokeObjectURL(src.url);src=null;origData=null;procData=null;labels=null;edgeMask=null;edgeReady=false;lastValues=lastPalette=lastRemap=null;hl=-1;imageId++;procImageId=edgeImageId=-1;lastProcKey=lastEdgeKey='';for(const k in jobs)jobs[k].pending=false;['strip','swatches','mixes'].forEach(i=>{const e=document.getElementById(i);if(e)e.innerHTML='';});const hc=document.getElementById('hist');if(hc)hc.getContext('2d').clearRect(0,0,hc.width,hc.height);closePick();updateInfo();showEmpty();}
HOOKS.push(()=>{const e=$('#empty');if(e)e.addEventListener('click',()=>$('#file').click());});
