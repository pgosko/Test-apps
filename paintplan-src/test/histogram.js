// Draggable histogram levels (Values + Notan), both themes, desktop mouse + iPhone touch.
const fs = require('fs'), path = require('path'), os = require('os');
const { serve, launch, watch, idle, vis, ok, failed, copyDir, ROOT } = require('./lib');
const PHOTO = path.join(__dirname, 'photo.jpg'), OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const theme = t => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/themes', t, 'theme.json')));
(async () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-h-'));
  for (const t of ['classic', 'liquid-glass']) copyDir(path.join(ROOT, 'dist', t), path.join(site, 'Test-apps', theme(t).deploy));
  const srv = await serve(site, 8731), browser = await launch();
  for (const t of ['classic', 'liquid-glass']) {
    const url = 'http://127.0.0.1:8731/Test-apps/' + theme(t).deploy, glass = !theme(t).runtime.sample; const errors = [];
    console.log('##', t);
    const fresh = async p => { await p.goto(url); await p.evaluate(() => { localStorage.clear(); return new Promise(r => { const q = indexedDB.deleteDatabase('paintplan'); q.onsuccess = q.onerror = q.onblocked = () => r(); }); }); await p.reload(); await p.waitForTimeout(500); if (glass) { await p.setInputFiles('#file', PHOTO); } await idle(p); };
    const handleX = async (p, i) => { const r = await p.locator('#hist').boundingBox(); const b = await p.evaluate(i => histCuts(lastValues)[i], i); return { x: r.x + b / 100 * r.width, y: r.y + r.height / 2, r }; };
    try {
      // ---------- desktop ----------
      const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } }); const d = await ctx.newPage(); watch(d, errors); await fresh(d);
      await d.click('#modes [data-mode=values]'); await idle(d);
      ok(await d.evaluate(() => S.vCustom.length === 0 && !lastValues.custom), 'starts in auto levels');
      ok(await d.evaluate(() => document.getElementById('bLevelsAuto').hidden && /Auto levels/.test(document.getElementById('levelsInfo').textContent)), 'auto status shown, reset hidden');
      ok((await d.locator('#hist').boundingBox()).height >= 95, 'histogram is taller (≥95 px)');
      const before = await d.evaluate(() => ({ b: lastValues.bounds.slice(), c: lastValues.counts.slice(), id: procImageId }));
      let h = await handleX(d, 1);
      await d.mouse.move(h.x + 3, h.y); await d.mouse.down(); await d.mouse.move(h.x + 40, h.y, { steps: 5 }); await d.waitForTimeout(250);
      ok(await d.evaluate(() => histDrag && levelLive && S.vCustom.length === 4), 'dragging → custom levels, live preview path');
      await d.screenshot({ path: path.join(OUT, `hist-drag-desktop-${t === 'classic' ? 'classic' : 'glass'}.png`) });
      await d.mouse.move(h.x + 60, h.y, { steps: 3 }); await d.mouse.up(); await idle(d);
      const after = await d.evaluate(() => ({ b: lastValues.bounds.slice(), c: lastValues.counts.slice(), cuts: S.vCustom.slice(), custom: lastValues.custom, live: levelLive, title: document.querySelector('#strip .step:nth-child(2)').title }));
      ok(after.custom && !after.live && after.cuts[1] > before.b[2] + 5, `threshold moved ${before.b[2].toFixed(1)} → ${after.cuts[1]} (full-quality result after release)`);
      ok(after.c[1] > before.c[1] && after.c[2] < before.c[2], `coverage updated: step2 ${(before.c[1] * 100).toFixed(0)}%→${(after.c[1] * 100).toFixed(0)}%, step3 ${(before.c[2] * 100).toFixed(0)}%→${(after.c[2] * 100).toFixed(0)}%`);
      ok(new RegExp('–' + Math.round(after.cuts[1])).test(after.title), 'value strip shows custom range: ' + after.title);
      ok(await d.evaluate(() => !document.getElementById('bLevelsAuto').hidden && document.getElementById('c_vBlack').closest('.row').classList.contains('dim')), 'custom: Reset button shown, black/mid/white dimmed');
      // no crossing
      h = await handleX(d, 1); await d.mouse.move(h.x, h.y); await d.mouse.down(); await d.mouse.move(h.r.x + h.r.width - 2, h.y, { steps: 8 }); await d.mouse.up(); await idle(d);
      ok(await d.evaluate(() => { const c = S.vCustom; return c[1] <= c[2] - 1 && c.every((v, i) => !i || v > c[i - 1]); }), 'boundaries cannot cross: ' + JSON.stringify(await d.evaluate(() => S.vCustom)));
      // strip tap highlight still works; band tap highlights
      await d.click('#strip .step:nth-child(3)'); ok(await d.evaluate(() => hl === 2), 'strip tap highlights step');
      await d.click('#strip .step:nth-child(3)');
      const bandX = await d.evaluate(() => { const c = histCuts(lastValues); return (0 + c[0]) / 2; }); const r = await d.locator('#hist').boundingBox();
      await d.mouse.click(r.x + bandX / 100 * r.width, r.y + 10); ok(await d.evaluate(() => hl === 0), 'tap on a histogram band highlights it');
      await d.mouse.click(r.x + bandX / 100 * r.width, r.y + 10);
      // step count: custom boundaries are redistributed (stay custom)
      const c5 = await d.evaluate(() => S.vCustom.slice());
      await d.evaluate(() => { const e = document.getElementById('c_vSteps'); e.value = '7'; e.dispatchEvent(new Event('input', { bubbles: true })); }); await idle(d);
      ok(await d.evaluate(() => S.vSteps === 7 && S.vCustom.length === 6 && lastValues.custom && lastValues.N === 7), 'steps 5→7 keeps custom shape: ' + JSON.stringify(c5) + ' → ' + JSON.stringify(await d.evaluate(() => S.vCustom)));
      // persists after reload
      await d.waitForTimeout(600); const saved = await d.evaluate(() => S.vCustom.slice()); await d.reload(); await idle(d);
      ok(await d.evaluate(s => JSON.stringify(S.vCustom) === JSON.stringify(s) && lastValues.custom && S.mode === 'values', saved), 'custom levels persist after reload');
      // reset
      await d.click('#bLevelsAuto'); await idle(d);
      ok(await d.evaluate(() => S.vCustom.length === 0 && !lastValues.custom && document.getElementById('bLevelsAuto').hidden), 'Reset to auto');
      // parametric slider returns to auto
      h = await handleX(d, 0); await d.mouse.move(h.x, h.y); await d.mouse.down(); await d.mouse.move(h.x + 20, h.y, { steps: 3 }); await d.mouse.up(); await idle(d);
      await d.evaluate(() => { const e = document.getElementById('c_vMid'); e.value = '40'; e.dispatchEvent(new Event('input', { bubbles: true })); }); await idle(d);
      ok(await d.evaluate(() => S.vCustom.length === 0 && !lastValues.custom), 'moving Midpoint slider switches back to auto');
      // notan
      await d.click('#modes [data-mode=notan]'); await idle(d);
      const m0 = await d.evaluate(() => S.nMid); h = await handleX(d, 0);
      await d.mouse.move(h.x, h.y); await d.mouse.down(); await d.mouse.move(h.x - 50, h.y, { steps: 4 }); await d.mouse.up(); await idle(d);
      ok(await d.evaluate(m0 => S.nMid < m0 - 5 && +document.getElementById('c_nMid').value === S.nMid, m0), 'notan (2 values): handle drives the Threshold slider');
      await d.check('[data-k=nThree]'); await idle(d);
      h = await handleX(d, 1); await d.mouse.move(h.x, h.y); await d.mouse.down(); await d.mouse.move(h.x + 30, h.y, { steps: 4 }); await d.mouse.up(); await idle(d);
      ok(await d.evaluate(() => S.nCustom.length === 2 && lastValues.custom && lastValues.N === 3), 'notan (3 values): custom boundaries');
      await d.click('#bLevelsAuto'); await idle(d); ok(await d.evaluate(() => S.nCustom.length === 0), 'notan reset');
      await ctx.close();
      // ---------- iPhone touch ----------
      const mc = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const m = await mc.newPage(); watch(m, errors); await fresh(m);
      await m.tap('#modes [data-mode=values]'); await idle(m);
      await m.evaluate(() => document.getElementById('hist').scrollIntoView({ block: 'center' })); await m.waitForTimeout(300);
      ok((await m.locator('#hist').boundingBox()).height >= 115, 'phone: histogram ≥115 px tall');
      const cdp = await mc.newCDPSession(m); const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
      const b0 = await m.evaluate(() => lastValues.bounds[2]); h = await handleX(m, 1);
      await T('touchStart', [[h.x + 15, h.y]]);   // 15 px off the line: still inside the 44 px target
      for (let k = 1; k <= 8; k++) await T('touchMove', [[h.x + 15 + k * 6, h.y + k * 0.5]]);
      await m.waitForTimeout(300);
      await m.screenshot({ path: path.join(OUT, `hist-drag-mobile-${t === 'classic' ? 'classic' : 'glass'}.png`) });
      await T('touchEnd', []); await idle(m);
      ok(await m.evaluate(b0 => S.vCustom.length === 4 && S.vCustom[1] > b0 + 8 && S.vCustom[1] <= S.vCustom[2] - 1 && lastValues.custom, b0), 'phone: touch drag moves the boundary (' + (await m.evaluate(() => JSON.stringify(S.vCustom))) + ')');
      await mc.close();
    } catch (e) { ok(false, 'exception: ' + e.message.split('\n')[0]); }
    ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + JSON.stringify(errors) : ''));
  }
  await browser.close(); srv.close(); fs.rmSync(site, { recursive: true, force: true });
  console.log(failed() ? `FAILED (${failed()})` : 'ALL PASSED'); process.exit(failed() ? 1 : 0);
})();
