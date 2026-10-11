/* core/util.js — Tiny helpers ($, clamp, number/colour formatting) + HOOKS (theme modules register init hooks). */
/* ===== App ===== */
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const PHI=(1+Math.sqrt(5))/2;
const r2=v=>Math.round(v*100)/100;
const fmtN=v=>{const s=(+v).toFixed(2);return s.replace(/\.?0+$/,'');};
const hex2=rgb=>'#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const hexRgb=h=>{const v=parseInt(h.slice(1),16);return[v>>16&255,v>>8&255,v&255];};
const rgba=(h,a)=>{const c=hexRgb(h);return`rgba(${c[0]},${c[1]},${c[2]},${a})`;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const HOOKS=[];   // functions run at the end of init() (theme/optional modules push here)
