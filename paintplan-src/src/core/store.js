/* core/store.js — Settings state S (persisted to localStorage) + save(). */
const STORE_NS=THEME.storage||'paintplan';   // a preview build uses its own namespace so it can't touch the live app's saved state
const SAVE_KEY=STORE_NS+'.v1';
function loadSaved(){try{const o=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');const r={};for(const k in DEF)if(k in o&&typeof o[k]===typeof DEF[k])r[k]=o[k];return r;}catch(e){return{};}}
const S=Object.assign(JSON.parse(JSON.stringify(DEF)),loadSaved());
if(Array.isArray(S.pigments)){S.pigments=migratePigs(S.pigments);if(!S.pigments.length)S.pigments=pigsOf('zorn');}
let saveT=0;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}},400);}
