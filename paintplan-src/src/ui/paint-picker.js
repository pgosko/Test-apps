/* ui/paint-picker.js — Searchable paint picker for Limited Palette slots (library: core/paint-library.js).
   Desktop: centred dialog. Phones (≤760px): bottom sheet with a search field and 52px rows. Type-ahead matches name, aliases
   and Colour Index codes ("pb29", "PB 15:3", "phthalo"); results are grouped by family. Picking a paint sets the slot's name +
   colour; "Custom colour…" opens the slot's colour input; a typed name with no match can be kept as a custom label. */
const PAINT_OPA={O:'opaque',SO:'semi-opaque',ST:'semi-transparent',T:'transparent'};
const normQ=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2019']/g,'');
const codeKey=s=>normQ(s).replace(/[^a-z0-9]/g,'');
const PAINT_INDEX=PAINTS.map(p=>({p,txt:normQ(p.n+' '+(p.al||'')+' '+p.f),code:codeKey(p.code)}));
function searchPaints(q){
  const cq=codeKey(q),toks=/^p[a-z]{1,2}\d+$/.test(cq)?[cq]:normQ(q).split(/[\s,]+/).filter(Boolean);if(!toks.length)return PAINTS.slice();   // "PB 15:3" → one code token
  const hits=[];
  for(const x of PAINT_INDEX){let score=0,ok=true;
    for(const t of toks){const ct=codeKey(t);
      if(x.txt.includes(t))score+=normQ(x.p.n).startsWith(t)?3:(' '+x.txt).includes(' '+t)?2:1;
      else if(ct&&/[a-z]{1,3}\d/.test(ct)&&x.code.includes(ct))score+=x.code===ct?6:x.code.split(/(?=p[a-z]{1,2}\d)/).some(c=>c.startsWith(ct))?4:2;
      else{ok=false;break;}}
    if(ok)hits.push([score,x.p]);}
  return hits.sort((a,b)=>b[0]-a[0]).map(h=>h[1]);
}
let ppSlot=-1,ppActive=0;
function ppEl(){
  let el=document.getElementById('paintSheet');if(el)return el;
  el=document.createElement('div');el.id='paintSheet';el.className='psheet';el.hidden=true;
  el.innerHTML=`<div class="ps-card" role="dialog" aria-modal="true" aria-labelledby="psTitle"><div class="ps-grab" aria-hidden="true"></div>
    <div class="ps-hd"><b id="psTitle">Choose paint</b><button type="button" id="psDone">Done</button></div>
    <div class="ps-search"><input type="search" id="psQ" placeholder="Search name or pigment code (e.g. PB29)" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search paints" aria-controls="psList"></div>
    <div class="ps-list" id="psList" role="listbox" aria-label="Paints"></div>
    <p class="ps-foot">Colours are reference values (brand averages or estimates, see research notes). Real tubes vary; mixes are simulated.</p></div>`;
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)closePaintPicker();const b=e.target.closest('button');if(!b)return;
    if(b.id==='psDone')closePaintPicker();else if(b.dataset.pid)pickPaint(b.dataset.pid);
    else if(b.dataset.act==='color')pickCustomColour();else if(b.dataset.act==='name')pickCustomName();});
  const q=el.querySelector('#psQ');
  q.addEventListener('input',()=>{ppActive=0;renderPaintList();});
  el.addEventListener('keydown',e=>{e.stopPropagation();   // keep app shortcuts (and Setup's Escape) out of the sheet
    const rows=[...el.querySelectorAll('.prow')];
    if(e.key==='Escape'){e.preventDefault();closePaintPicker();}
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!rows.length)return;ppActive=clamp(ppActive+(e.key==='ArrowDown'?1:-1),0,rows.length-1);ppMark(rows);}
    else if(e.key==='Enter'&&e.target===q){e.preventDefault();const r=rows[ppActive];if(r)r.click();}
  });
  return el;
}
function ppMark(rows){rows.forEach((r,i)=>{r.classList.toggle('act',i===ppActive);r.setAttribute('aria-selected',i===ppActive);});const r=rows[ppActive];if(r)r.scrollIntoView({block:'nearest'});}
function paintRow(p,cur){
  const sw=p.mass?`<i class="ps-sw" style="background:linear-gradient(135deg,${p.c} 0 62%,${p.mass} 62%)" title="Reference colour · corner: approx. masstone"></i>`:`<i class="ps-sw" style="background:${p.c}"></i>`;
  return`<button type="button" class="prow${cur?' cur':''}" role="option" data-pid="${p.id}">${sw}<span class="ps-n"><b>${esc(p.n)}</b><small>${esc(p.code)}${p.src==='approx'?' · approx colour':''}</small></span><span class="ps-op ps-op-${p.op}">${PAINT_OPA[p.op]||''}</span></button>`;
}
function renderPaintList(){
  const el=ppEl(),q=el.querySelector('#psQ').value.trim(),list=searchPaints(q),cur=(S.pigments[ppSlot]||{}).id;
  let h='';
  const exact=q&&list.some(p=>normQ(p.n)===normQ(q));
  h+=`<div class="ps-grp ps-custom"><button type="button" class="prow" data-act="color"><i class="ps-sw ps-sw-custom" style="background:${(S.pigments[ppSlot]||{}).c||'#808080'}"></i><span class="ps-n"><b>Custom colour…</b><small>pick any colour by hand</small></span></button>${q&&!exact?`<button type="button" class="prow" data-act="name"><i class="ps-sw ps-sw-custom" style="background:${(S.pigments[ppSlot]||{}).c||'#808080'}"></i><span class="ps-n"><b>Use “${esc(q)}”</b><small>keep the current colour, custom name</small></span></button>`:''}</div>`;
  if(q){h+=list.length?'':`<p class="ps-empty">No paint matches “${esc(q)}”.</p>`;}
  const fams=q?[...new Set(list.map(p=>p.f))].map(f=>PAINT_FAMILIES.find(x=>x[0]===f)):PAINT_FAMILIES;   // searching: the group with the best match comes first
  for(const [f,label] of fams){const ps=list.filter(p=>p.f===f);if(!ps.length)continue;
    h+=`<div class="ps-grp" role="group" aria-label="${label}"><div class="ps-gh">${label}</div>${ps.map(p=>paintRow(p,p.id===cur)).join('')}</div>`;}
  const L=el.querySelector('#psList');L.innerHTML=h;
  const rows=[...L.querySelectorAll('.prow')];if(q){const first=rows.findIndex(r=>r.dataset.pid);ppActive=Math.max(ppActive,first);}ppMark(rows);
  if(!q){const c=L.querySelector('.prow.cur');if(c)c.scrollIntoView({block:'center'});}
}
function openPaintPicker(i){
  if(!S.pigments[i])return;ppSlot=i;ppActive=0;
  const el=ppEl(),q=el.querySelector('#psQ');q.value='';
  el.querySelector('#psTitle').textContent=`Paint ${i+1} of ${S.pigments.length}`;
  el.hidden=false;document.body.classList.add('psheet-open');renderPaintList();
  if(!matchMedia('(pointer:coarse)').matches)q.focus();
}
function closePaintPicker(){const el=document.getElementById('paintSheet');if(!el||el.hidden)return;el.hidden=true;document.body.classList.remove('psheet-open');
  const b=document.querySelector(`#pigList [data-pick="${ppSlot}"]`);if(b)b.focus({preventScroll:true});}
function setPigment(i,obj){
  S.pigments=S.pigments.map((p,j)=>j===i?obj:p);S.rPreset='custom';syncControls();save();update();renderModeInfo();
}
function pickPaint(id){const p=PAINT_BY_ID[id];if(!p)return;const i=ppSlot;closePaintPicker();setPigment(i,paintSlot(p));}
function pickCustomName(){const q=$('#psQ').value.trim();const i=ppSlot,c=S.pigments[i].c;closePaintPicker();if(q)setPigment(i,{n:q,c});}
function pickCustomColour(){const i=ppSlot;closePaintPicker();const inp=document.querySelector(`#pigList input[data-pi="${i}"][data-f="c"]`);if(inp){try{inp.showPicker?inp.showPicker():inp.click();}catch(e){inp.click();}}}
