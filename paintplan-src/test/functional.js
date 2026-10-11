// Functional tests for every built theme (dist/<theme>), served over http like GitHub Pages.
// node test/functional.js [classic] [liquid-glass]
const fs = require('fs'), path = require('path'), os = require('os');
const { serve, launch, watch, idle, vis, ok, failed, copyDir, ROOT } = require('./lib');
const themes = process.argv.slice(2).length ? process.argv.slice(2) : ['classic', 'liquid-glass'];
const PHOTO = path.join(__dirname, 'photo.jpg'), REPL = path.join(__dirname, 'replace.jpg');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-site-'));
  for (const t of themes) { const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/themes', t, 'theme.json'))); copyDir(path.join(ROOT, 'dist', t), path.join(site, 'Test-apps', T.deploy)); }
  const srv = await serve(site, 8711), browser = await launch();
  for (const t of themes) {
    const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/themes', t, 'theme.json')));
    const url = 'http://127.0.0.1:8711/Test-apps/' + T.deploy, glass = !T.runtime.sample;
    console.log('##', t, url); const errors = [];
    const fresh = async p => { await p.goto(url); await p.evaluate(() => { localStorage.clear(); return new Promise(r => { const q = indexedDB.deleteDatabase('paintplan'); q.onsuccess = q.onerror = q.onblocked = () => r(); }); }); await p.reload(); await p.waitForTimeout(500); };
    const loadPhoto = async (p, tap) => { const [fc] = await Promise.all([p.waitForEvent('filechooser'), tap ? p.tap('#empty .em-card') : p.click('#empty')]); await fc.setFiles(PHOTO); await idle(p); };
    try {
      const dctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true }); const d = await dctx.newPage(); watch(d, errors); await fresh(d);
      if (glass) {
        ok(await d.evaluate(() => !src && document.body.classList.contains('noimg') && typeof makeSample === 'undefined'), 'starts empty, no sample code');
        ok(await d.locator('#bSample').count() === 0, 'no Sample button');
        await loadPhoto(d);
      } else { await idle(d); ok(await d.evaluate(() => src && src.sample), 'classic: sample loaded'); }
      ok(await d.evaluate(() => !!navigator.serviceWorker), 'service worker API present');
      // all modes
      for (const m of await d.evaluate(() => MODES.map(x => x[0]))) {
        await d.click(`#modes [data-mode=${m}]`); await idle(d);
        ok(await d.evaluate(m => S.mode === m && (m === 'photo' || procImageId === imageId) && document.querySelector(`#modes [data-mode=${m}]`).classList.contains('on'), m), 'mode ' + m);
      }
      await d.click('#modes [data-mode=values]'); await idle(d);
      ok(await d.evaluate(() => document.querySelectorAll('#strip .step').length === S.vSteps), 'values strip');
      await d.click('#strip .step:nth-child(2)'); ok(await d.evaluate(() => hl === 1), 'value step highlight');
      await d.click('#modes [data-mode=palette]'); await idle(d);
      ok(await d.evaluate(() => document.querySelectorAll('#swatches .sw').length === S.pK), 'palette swatches');
      await d.click('#modes [data-mode=remap]'); await idle(d);
      ok(await d.evaluate(() => document.querySelectorAll('#mixes .sw').length > 0), 'limited palette mixes');
      // contours (Contour lines section is visible outside Setup in both themes)
      if (!(await d.evaluate(() => document.getElementById('dLines').open))) await d.click('#dLines summary');
      await d.selectOption('#c_lines', 'over'); await idle(d);
      ok(await d.evaluate(() => edgeImageId === imageId && edgeReady), 'contour lines computed');
      await d.selectOption('#c_lines', 'off'); await idle(d);
      // colour pick
      await d.click('#modes [data-mode=photo]'); await idle(d);
      const vb = await d.locator('#view').boundingBox(); await d.mouse.click(vb.x + vb.width / 2, vb.y + vb.height / 2); await d.waitForTimeout(300);
      ok(await vis(d, '#pick'), 'tap samples a colour'); await d.keyboard.press('Escape');
      // setup (glass) — then composition settings
      if (glass) {
        for (const s of ['#dCanvas', '#dComp', '#dGrid']) ok(!(await vis(d, s)), 'setup off hides ' + s);
        await d.click('#bSetup'); await d.waitForTimeout(150);
        for (const s of ['#secSetup', '#dCanvas', '#dComp', '#dGrid', '#dExport', '#dTips']) ok(await vis(d, s), 'setup on shows ' + s);
        for (const s of ['#secMode', '#dLines', '#dView']) ok(!(await vis(d, s)), 'setup on hides ' + s);
      }
      await d.selectOption('#c_spiralRot', '2'); await d.check('#dComp input[data-k=phi]'); await idle(d);
      // position
      await d.click(glass ? '#bPos2' : '#bPos'); await d.waitForTimeout(200);
      ok(await d.evaluate(() => posMode && !document.querySelector('#posbar').hidden), 'position mode');
      const p0 = await d.evaluate(() => S.place.cx);
      await d.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2); await d.mouse.down(); await d.mouse.move(vb.x + vb.width / 2 - 80, vb.y + vb.height / 2, { steps: 6 }); await d.mouse.up(); await idle(d);
      ok(await d.evaluate(p0 => S.place.cx < p0 && procImageId === imageId, p0), 'drag repositions image');
      await d.click('#pDone'); await idle(d);
      if (glass) { ok(await d.evaluate(() => document.body.classList.contains('setup')), 'Done returns to Setup'); await d.click('#bSetupDone'); ok(await d.evaluate(() => !document.body.classList.contains('setup')), 'Setup closes'); }
      const sig = () => d.evaluate(() => { const x = document.getElementById('view').toDataURL(); let h = 0; for (let i = 0; i < x.length; i += 7) h = (h * 31 + x.charCodeAt(i)) >>> 0; return h; });
      const a = await sig(); await d.evaluate(() => setState('phi', false)); await d.waitForTimeout(300); const b = await sig(); await d.evaluate(() => setState('phi', true)); await d.waitForTimeout(300);
      ok(a !== b, 'overlays render on canvas');
      // replace photo keeps settings
      if (glass) await d.click('#bSetup');
      await d.setInputFiles('#file2', REPL); await idle(d);
      ok(await d.evaluate(() => src.natW === 2000 && S.spiralRot == 2 && S.phi), 'replace photo keeps settings');
      if (glass) await d.click('#bSetupDone');
      // export
      for (const id of ['#bPng', '#bSheet']) {
        if (id === '#bSheet' && glass) await d.click('#bSetup');
        if (id === '#bSheet' && !(await d.evaluate(() => document.getElementById('dExport').open))) await d.click('#dExport summary');
        const [dl] = await Promise.all([d.waitForEvent('download'), d.click(id)]); const f = path.join(OUT, `${t}-${dl.suggestedFilename()}`); await dl.saveAs(f);
        ok(/\.png$/.test(dl.suggestedFilename()) && fs.statSync(f).size > 10000, 'export ' + id + ' → ' + dl.suggestedFilename());
      }
      if (glass) await d.click('#bSetupDone');
      // persistence
      await d.waitForTimeout(600); await d.reload(); await idle(d);
      ok(await d.evaluate(() => src.natW === 2000 && S.spiralRot == 2 && S.phi && !document.body.classList.contains('noimg')), 'reload restores photo + settings');
      // clear saved photo
      if (glass) await d.click('#bSetup');
      await d.click('#bClearImg'); await d.waitForTimeout(500);
      ok(glass ? await d.evaluate(() => !src && document.body.classList.contains('noimg')) && await vis(d, '#empty') : await d.evaluate(() => src && src.sample), glass ? 'clear → empty state' : 'clear → sample');
      await d.screenshot({ path: path.join(OUT, `${t}-desktop-final.png`) });
      await dctx.close();
      // mobile
      const mc = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const m = await mc.newPage(); watch(m, errors); await fresh(m);
      if (glass) await loadPhoto(m, true); else await idle(m);
      for (const id of [...(glass ? ['#bSetup'] : ['#bSample']), '#bPos', '#bMirror', '#bPng', '#bPanel']) ok(await m.locator(id).isVisible(), 'mobile visible ' + id);
      await m.tap('#modes [data-mode=values]'); await idle(m);
      ok(await m.evaluate(() => S.mode === 'values' && document.getElementById('panelBody').offsetHeight > 80), 'mobile values + panel');
      if (glass) { await m.tap('#bPanel'); await m.tap('#bSetup'); await m.waitForTimeout(200); ok(await m.evaluate(() => document.body.classList.contains('setup') && document.getElementById('panelBody').offsetHeight > 80), 'mobile Setup opens sheet'); }
      await m.tap(glass ? '#bPos2' : '#bPos'); await m.waitForTimeout(250);
      const cdp = await mc.newCDPSession(m); const T2 = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
      const vm = await m.locator('#view').boundingBox(), cx = vm.x + vm.width / 2, cy = vm.y + vm.height * 0.4, s0 = await m.evaluate(() => S.place.s);
      await T2('touchStart', [[cx - 50, cy], [cx + 50, cy]]); for (let k = 1; k <= 8; k++) await T2('touchMove', [[cx - 50 - k * 5, cy], [cx + 50 + k * 5, cy]]); await T2('touchEnd', []); await idle(m);
      ok(await m.evaluate(s0 => posMode && S.place.s > s0 * 1.2, s0), 'mobile pinch scales in position mode');
      await m.tap('#pDone'); await idle(m);
      await m.screenshot({ path: path.join(OUT, `${t}-mobile-final.png`) });
      await mc.close();
    } catch (e) { ok(false, 'exception: ' + e.message.split('\n')[0]); }
    ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + JSON.stringify(errors) : ''));
  }
  await browser.close(); srv.close(); fs.rmSync(site, { recursive: true, force: true });
  console.log(failed() ? `FAILED (${failed()})` : 'ALL PASSED'); process.exit(failed() ? 1 : 0);
})();
