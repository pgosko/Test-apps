/* core/storage.js — IndexedDB key/value store (saved photo blob). */
const idb={p:null,
  db(){if(!this.p)this.p=new Promise((res,rej)=>{try{const r=indexedDB.open('paintplan',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}});return this.p;},
  async op(mode,fn){const db=await this.db();return new Promise((res,rej)=>{const t=db.transaction('kv',mode);const rq=fn(t.objectStore('kv'));t.oncomplete=()=>res(rq&&rq.result);t.onerror=t.onabort=()=>rej(t.error);});},
  get(k){return this.op('readonly',s=>s.get(k));},put(k,v){return this.op('readwrite',s=>s.put(v,k));},del(k){return this.op('readwrite',s=>s.delete(k));}};
