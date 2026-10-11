/* worker/client.js — Worker client: spawns the engine as a Blob worker (iOS-safe), main-thread fallback, job queue. */
/* ---------- engine / worker ---------- */
const local=ENGINE();
let worker=null;
function initWorker(){
  try{
    const code=ENGINE.toString()+';const H=ENGINE();onmessage=e=>{let r;try{r=H(e.data);}catch(err){r={res:{type:"error",kind:e.data.type,msg:String(err&&err.stack||err)},tr:[]};}postMessage(r.res,r.tr);};';
    const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
    worker=new Worker(url);
    worker.onmessage=e=>onResult(e.data);
    worker.onerror=e=>{e.preventDefault&&e.preventDefault();toFallback();};
  }catch(e){worker=null;}
}
function toFallback(){
  if(!worker)return;try{worker.terminate();}catch(e){}worker=null;
  for(const k in jobs){jobs[k].busy=false;jobs[k].pending=false;}
  if(origData){sendImage();lastProcKey=lastEdgeKey='';update();}
}
function post(msg,tr){
  if(worker){worker.postMessage(msg,tr||[]);return;}
  setTimeout(()=>{let r;try{r=local(msg);}catch(e){r={res:{type:'error',kind:msg.type,msg:String(e&&e.stack||e)}};}onResult(r.res);},0);
}
const jobs={process:{busy:false,pending:false},edges:{busy:false,pending:false}};
function request(kind){const j=jobs[kind];if(j.busy){j.pending=true;return;}dispatch(kind);setStatus();}
function dispatch(kind){jobs[kind].busy=true;post(kind==='process'?{type:'process',imageId,mode:S.mode,p:modeParams()}:{type:'edges',imageId,p:edgeParams()});}
function onResult(r){
  if(r.type==='ack')return;
  const j=jobs[r.kind];if(!j)return;j.busy=false;
  if(r.type==='process')applyProcess(r);else if(r.type==='edges')applyEdges(r);else if(r.type==='error')console.warn('engine:',r.msg);
  if(j.pending){j.pending=false;dispatch(r.kind);}
  setStatus();
}
let statusT=0;
function setStatus(){const busy=jobs.process.busy||jobs.edges.busy;clearTimeout(statusT);
  if(busy)statusT=setTimeout(()=>{const el=$('#status');el.textContent='Working\u2026';el.hidden=false;},180);else $('#status').hidden=true;}
