// Service-worker update tests over http (GitHub-Pages-like caching: max-age=600 + ETag).
//  A) per theme: deploy v1 → load → deploy v2 → reload shows v2; deploy v3 while open → "Updated" toast → reload shows v3; offline reload works.
//  B) migration from the old cache-first SW (backup of the published files): preview page shows the new build within ≤2 reloads.
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const { serve, launch, watch, ok, failed, copyDir, ROOT } = require('./lib');
const LEGACY_SITE = process.env.PP_LEGACY || '/workspace/_backup_pre_refactor/test-apps-paintplan';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-sw-'));
const build = mark => { const out = path.join(tmp, mark); execFileSync('node', [path.join(ROOT, 'build.mjs'), '--out', out, '--mark', mark], { stdio: 'pipe' }); return out; };
const theme = t => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/themes', t, 'theme.json')));
const buildOf = (dir, t) => (fs.readFileSync(path.join(dir, t, 'index.html'), 'utf8').match(/name="paintplan-build" content="[^@]+@(\w+)"/) || [])[1];
const pageBuild = p => p.evaluate(() => { const m = document.querySelector('meta[name=paintplan-build]'); return m ? m.content.split('@')[1] : 'legacy'; });
const deploy = (dir, site) => { for (const t of ['classic', 'liquid-glass']) copyDir(path.join(dir, t), path.join(site, 'Test-apps', theme(t).deploy)); };
const waitCtl = p => p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
(async () => {
  const V = { v1: build('v1'), v2: build('v2'), v3: build('v3') };
  const browser = await launch();
  let port = 8720;
  for (const t of ['classic', 'liquid-glass']) {
    console.log('## A', t);
    const site = path.join(tmp, 'siteA-' + t); deploy(V.v1, site); const srv = await serve(site, ++port);
    const url = `http://127.0.0.1:${port}/Test-apps/${theme(t).deploy}`; const errors = [];
    const ctx = await browser.newContext(); const p = await ctx.newPage(); watch(p, errors);
    await p.goto(url); await waitCtl(p);
    ok(await pageBuild(p) === buildOf(V.v1, t), 'v1 loaded and controlled by its SW');
    ok(await p.evaluate(() => navigator.serviceWorker.controller.scriptURL.endsWith(location.pathname + 'sw.js')), 'controlled by its own sw.js (' + theme(t).deploy + 'sw.js)');
    deploy(V.v2, site); await p.reload(); await p.waitForTimeout(1500);
    ok(await pageBuild(p) === buildOf(V.v2, t), 'deploy v2 → plain reload shows v2');
    ok(!(await p.locator('#toast').count()), 'no toast when the page is already current');
    deploy(V.v3, site);
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    await p.waitForSelector('#toast', { timeout: 15000 }).catch(() => {});
    ok(await p.locator('#toast').isVisible().catch(() => false), 'deploy v3 while open → "Updated — reload" toast');
    await Promise.all([p.waitForNavigation(), p.click('#toastReload')]).catch(() => {});
    await p.waitForTimeout(800);
    ok(await pageBuild(p) === buildOf(V.v3, t), 'toast Reload → v3');
    await ctx.setOffline(true); await p.reload().catch(() => {}); await p.waitForTimeout(800);
    ok(await pageBuild(p) === buildOf(V.v3, t) && await p.evaluate(() => !!document.getElementById('view')), 'offline reload serves cached v3');
    await ctx.setOffline(false);
    const keys = await p.evaluate(() => caches.keys());
    ok(keys.filter(k => k.startsWith('paintplan-' + t + '-')).length === 1, 'old caches cleaned up: ' + JSON.stringify(keys));
    ok(errors.filter(e => !/ERR_INTERNET_DISCONNECTED|net::ERR_FAILED/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors));
    await ctx.close(); srv.close();
  }
  // B) migration from the published (old) files
  console.log('## B migration from old cache-first SW');
  if (!fs.existsSync(LEGACY_SITE)) ok(false, 'legacy site missing'); else {
    const site = path.join(tmp, 'siteB'); copyDir(LEGACY_SITE, path.join(site, 'Test-apps', 'paintplan')); const srv = await serve(site, ++port);
    const base = `http://127.0.0.1:${port}/Test-apps/paintplan/`, prev = base + 'proposals/liquid-glass/';
    const ctx = await browser.newContext(); const p = await ctx.newPage();
    await p.goto(base); await waitCtl(p); await p.goto(prev); await p.waitForTimeout(500);
    ok(await pageBuild(p) === 'legacy', 'old SW installed, preview cached (legacy build)');
    deploy(V.v3, site);
    let n = 0, b = '';
    for (; n < 4; n++) { await (n ? p.reload() : p.goto(prev)); await p.waitForTimeout(n ? 1500 : 5000); b = await pageBuild(p); console.log('   load', n + 1, b, await p.evaluate(async () => { const c = navigator.serviceWorker.controller; const k = await caches.keys(); return (c ? c.scriptURL.replace(location.origin, '') : 'none') + ' ' + JSON.stringify(k); })); if (b === buildOf(V.v3, 'liquid-glass')) break; }
    ok(b === buildOf(V.v3, 'liquid-glass'), `preview shows the new build after opening it ${n + 1}× (i.e. ${n} reload${n === 1 ? '' : 's'})`);
    ok(n <= 2, 'needs at most 2 reloads');
    const keys = await p.evaluate(() => caches.keys());
    ok(!keys.includes('paintplan-v1'), 'legacy cache paintplan-v1 deleted: ' + JSON.stringify(keys));
    await p.goto(base); await p.waitForTimeout(1500);
    if (await pageBuild(p) !== buildOf(V.v3, 'classic')) { await p.reload(); await p.waitForTimeout(1000); }
    ok(await pageBuild(p) === buildOf(V.v3, 'classic'), 'main app shows new build');
    await ctx.close(); srv.close();
  }
  await browser.close(); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(failed() ? `FAILED (${failed()})` : 'ALL PASSED'); process.exit(failed() ? 1 : 0);
})();
