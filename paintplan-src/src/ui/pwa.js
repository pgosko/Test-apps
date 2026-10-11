/* ui/pwa.js — Service worker registration + "Updated — reload" toast.
   THEME.build is the content hash stamped by build.mjs; sw.js knows the same hash. When a new service worker
   takes control and reports a different build than this page, a small toast offers a reload. */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  const SWC=navigator.serviceWorker,hadCtl=!!SWC.controller;let reg=null,lastCheck=Date.now();
  const swBuild=sw=>new Promise(res=>{try{const ch=new MessageChannel();ch.port1.onmessage=e=>res(e.data&&e.data.build);sw.postMessage({type:'build'},[ch.port2]);setTimeout(()=>res(null),3000);}catch(e){res(null);}});
  function updToast(){
    if(document.getElementById('toast'))return;
    const t=document.createElement('div');t.id='toast';t.setAttribute('role','status');
    t.innerHTML='<span>PaintPlan was updated.</span><button id="toastReload" class="on">Reload</button><button id="toastX" aria-label="Dismiss">\u00d7</button>';
    document.body.appendChild(t);
    t.addEventListener('click',e=>{if(e.target.id==='toastReload')location.reload();else if(e.target.id==='toastX')t.remove();});
  }
  SWC.addEventListener('controllerchange',async()=>{if(!hadCtl||!SWC.controller)return;const b=await swBuild(SWC.controller);if(b&&b!==THEME.build)updToast();});
  addEventListener('load',()=>{SWC.register('sw.js').then(r=>{reg=r;}).catch(e=>console.warn('SW registration failed',e));});
  // installed iPhone apps can stay open for days: look for a new version when the app comes back to the foreground
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&reg&&Date.now()-lastCheck>60000){lastCheck=Date.now();reg.update().catch(()=>{});}});
}
