/* core/levels.js — Value-step thresholds ("levels"): auto (black/mid/white curve) or custom boundaries dragged on the
   histogram. Custom cuts are N-1 ascending input L* values stored in S.vCustom (Values) / S.nCustom (Notan, 3 values);
   an empty array means auto. Notan with 2 values has one threshold, which simply is S.nMid. */
const LEVEL_GAP=1;          // min distance between neighbouring boundaries (L*)
let levelLive=false;        // true while a handle is being dragged → engine uses its fast preview path
const levelKey=m=>m==='notan'?'nCustom':'vCustom';
const levelSteps=m=>m==='notan'?(S.nThree?3:2):S.vSteps;
function validCuts(c,N){return Array.isArray(c)&&c.length===N-1&&c.every((v,i)=>typeof v==='number'&&isFinite(v)&&v>0&&v<100&&(i===0||v>c[i-1]));}
function levelCustom(m){return levelSteps(m)>2||m==='values'?validCuts(S[levelKey(m)],levelSteps(m)):false;}
function levelParams(p,m){if(levelCustom(m))p.cuts=S[levelKey(m)].slice();if(levelLive)p.live=true;return p;}
/* clamp boundary i of cuts to its neighbours (keeps order, LEVEL_GAP apart, inside 0–100) */
function clampCut(c,i,v){const lo=(i>0?c[i-1]:0)+LEVEL_GAP,hi=(i<c.length-1?c[i+1]:100)-LEVEL_GAP;return Math.round(Math.min(hi,Math.max(lo,v))*10)/10;}
/* resample custom boundaries to a new step count, keeping their shape (piecewise-linear in step fraction) */
function resampleCuts(c,N){
  const pts=[0,...c,100],M=pts.length-1,out=[];
  for(let j=1;j<N;j++){const t=j/N*M,i=Math.min(M-1,Math.floor(t)),f=t-i;out.push(Math.round((pts[i]+(pts[i+1]-pts[i])*f)*10)/10);}
  for(let j=0;j<out.length;j++)out[j]=clampCut(out,j,out[j]);
  return validCuts(out,N)?out:[];
}
/* called by setState for every change: keeps levels consistent with the sliders */
function levelsOnSetState(k,old){
  if(['vBlack','vMid','vWhite'].includes(k))S.vCustom=[];                       // a parametric slider → back to auto
  else if(k==='vSteps'&&validCuts(S.vCustom,old))S.vCustom=resampleCuts(S.vCustom,S.vSteps);   // custom stays custom, redistributed
  else if(k==='nThree')S.nCustom=[];                                            // 2 ↔ 3 notan values: back to auto
  else if(k==='nMid')S.nCustom=[];
}
