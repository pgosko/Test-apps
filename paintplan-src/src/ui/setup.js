/* ui/setup.js — "Setup" toggle (themes with THEME.setup). Pure presentation: shows/hides panel sections,
   nothing is persisted. Which sections belong to Setup is theme config (theme.json → setup.sections / setup.hide);
   build.mjs turns that list into CSS (body:not(.setup) #section{display:none}) appended to the theme's styles. */
HOOKS.push(()=>{
  const C=THEME.setup,B=document.body,bS=$('#bSetup');if(!C||!bS)return;
  const first=document.getElementById(C.sections[0]);
  first.insertAdjacentHTML('beforebegin',`<section class="sec" id="secSetup"><div class="su-head"><h3>${esc(C.title)}</h3><button id="bSetupDone" class="on">Done</button></div><p class="hint">${esc(C.hint)}</p></section>\n`);
  function setSetup(on){
    B.classList.toggle('setup',on);bS.classList.toggle('on',on);bS.setAttribute('aria-pressed',String(on));
    if(on){B.classList.remove('nopanel');(C.open||[]).forEach(id=>{const d=document.getElementById(id);if(d)d.open=true;});const pb=$('#panelBody');if(pb)pb.scrollTop=0;}
    resize();
  }
  window.setSetup=setSetup;
  bS.onclick=()=>setSetup(!(B.classList.contains('setup')&&!B.classList.contains('nopanel')));
  $('#panelBody').addEventListener('click',e=>{if(e.target.closest('#bSetupDone'))setSetup(false);});
  $('#modes').addEventListener('click',e=>{if(e.target.closest('[data-mode]'))setSetup(false);});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&B.classList.contains('setup')&&!B.classList.contains('positioning')&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))setSetup(false);});
});
