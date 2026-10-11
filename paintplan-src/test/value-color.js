// Value-linked colour (Values → "Apply to colour photo") on the PREVIEW build: fidelity (hue/chroma kept, value follows
// the levels), gamut handling, live handle drag, detail slider, compare, eyedropper, storage isolation; desktop + iPhone.
const fs = require('fs'), path = require('path'), os = require('os');
const { serve, launch, watch, idle, ok, failed, copyDir, ROOT } = require('./lib');
const PHOTO = path.join(__dirname, process.env.PP_PHOTO || (fs.existsSync(path.join(__dirname, 'real.jpg')) ? 'real.jpg' : 'photo.jpg')), OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/themes/preview/theme.json')));
// fidelity stats computed in the page from origData (before) and procData (after)
const STATS = () => {
  const U = local.util, a = origData.data, b = procData.data, n = a.length / 4, o1 = [0, 0, 0], o2 = [0, 0, 0], lab = labels, v = lastValues.outL;
  let sf = 0, sfc = 0, nh = 0, sh = 0, mh = 0, nin = 0, shIn = 0, sc = 0, nG = 0, sL = 0, mL = 0, nAll = 0;
  const Lst = d => U.Lstar(0.2126 * U.S2L[d[0]] + 0.7152 * U.S2L[d[1]] + 0.0722 * U.S2L[d[2]]);
  for (let i = 0; i < n; i += 3) {
    const j = i * 4, p = [a[j], a[j + 1], a[j + 2]], q = [b[j], b[j + 1], b[j + 2]];
    U.toLab(U.S2L[p[0]], U.S2L[p[1]], U.S2L[p[2]], o1); U.toLab(U.S2L[q[0]], U.S2L[q[1]], U.S2L[q[2]], o2);
    const C1 = Math.hypot(o1[1], o1[2]), C2 = Math.hypot(o2[1], o2[2]);
    if (C1 > 0.04 && C2 > 0.02) {
      let dh = Math.abs(Math.atan2(o1[2], o1[1]) - Math.atan2(o2[2], o2[1])) * 180 / Math.PI; if (dh > 180) dh = 360 - dh;
      nh++; sh += dh; mh = Math.max(mh, dh);
      if (C2 > C1 - 0.006) { nin++; shIn += dh; sc += Math.abs(C2 - C1);
        // 8-bit floor: the ideal colour (original a,b; OKLab L solved by bisection for the output's luminance) rounded to 8 bits
        const Yq = 0.2126 * U.S2L[q[0]] + 0.7152 * U.S2L[q[1]] + 0.0722 * U.S2L[q[2]], f = [0, 0, 0]; let lo = 0, hi = 1.2;
        for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; U.fromLab(mid, o1[1], o1[2], f); if (0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] < Yq) lo = mid; else hi = mid; }
        U.fromLab(lo, o1[1], o1[2], f); const r8 = f.map(x => U.l2s(Math.min(1, Math.max(0, x)))), o3 = [0, 0, 0]; U.toLab(U.S2L[r8[0]], U.S2L[r8[1]], U.S2L[r8[2]], o3);
        let df = Math.abs(Math.atan2(o1[2], o1[1]) - Math.atan2(o3[2], o3[1])) * 180 / Math.PI; if (df > 180) df = 360 - df; sf += df; sfc += Math.abs(Math.hypot(o3[1], o3[2]) - C1);
      } else nG++;
    }
    if (window.__target) { const t = window.__target(i, lab), d = Math.abs(Lst(q) - t); sL += d; mL = Math.max(mL, d); nAll++; }
  }
  return { floorHue: sf / nin, floorChroma: sfc / nin, hueAll: sh / nh, hueMax: mh, hueIn: shIn / nin, chromaIn: sc / nin, inFrac: nin / nh, gamutFrac: nG / nh, Lerr: nAll ? sL / nAll : null, LerrMax: nAll ? mL : null, gamutPct: lastValues.color && lastValues.color.gamutPct };
};
(async () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-vc-'));
  copyDir(path.join(ROOT, 'dist', 'preview'), path.join(site, 'Test-apps', T.deploy));
  const srv = await serve(site, 8735), browser = await launch(), errors = [];
  const url = 'http://127.0.0.1:8735/Test-apps/' + T.deploy;
  const fresh = async p => { await p.goto(url); await p.evaluate(() => { localStorage.clear(); return Promise.all(['paintplan', 'paintplan-preview'].map(n => new Promise(r => { const q = indexedDB.deleteDatabase(n); q.onsuccess = q.onerror = q.onblocked = () => r(); }))); }); await p.reload(); await p.waitForTimeout(500); await p.setInputFiles('#file', PHOTO); await idle(p); };
  const set = (p, k, v) => p.evaluate(([k, v]) => setState(k, v), [k, v]);
  const report = {};
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } }); const d = await ctx.newPage(); watch(d, errors); await fresh(d);
    await d.click('#modes [data-mode=values]'); await idle(d);
    ok(await d.evaluate(() => document.querySelector('[data-k=vColor]').offsetParent !== null && !document.getElementById('c_vcStyle').offsetParent), '"Apply to colour photo" toggle in Values; options hidden until on');
    const gray = await d.evaluate(() => procData.data.slice(0, 40).join());
    let t0 = Date.now(); await d.check('[data-k=vColor]'); await idle(d); report.fullMs = Date.now() - t0;
    ok(await d.evaluate(() => S.vColor && lastValues.color && document.getElementById('c_vcStyle').offsetParent !== null), `colour result shown (${report.fullMs} ms incl. UI, 1200 px)`);
    ok(await d.evaluate(g => { const x = procData.data; let c = 0; for (let i = 0; i < x.length; i += 4000) if (Math.abs(x[i] - x[i + 1]) > 6 || Math.abs(x[i + 1] - x[i + 2]) > 6) c++; return c > 20; }), 'output is colour, not the gray study');
    // --- stepped, flat (detail 0): L* must equal the step value; hue and chroma kept
    await set(d, 'vcDetail', 0); await idle(d);
    await d.evaluate(() => { window.__target = (i, lab) => lastValues.outL[lab[i]]; });
    let s = await d.evaluate(STATS); report.stepFlat = s;
    ok(s.Lerr < 0.6 && s.LerrMax < 3, `stepped/flat: value = step value (mean |ΔL*| ${s.Lerr.toFixed(2)}, max ${s.LerrMax.toFixed(2)})`);
    ok(s.hueIn < s.floorHue * 1.6 + 0.1 && s.chromaIn < s.floorChroma * 1.6 + 0.001, `stepped/flat: in-gamut pixels keep hue (mean |Δh| ${s.hueIn.toFixed(2)}°, 8-bit floor ${s.floorHue.toFixed(2)}°) and chroma (mean |ΔC| ${s.chromaIn.toFixed(4)}, floor ${s.floorChroma.toFixed(4)} OKLab)`);
    ok(s.hueAll < 1, `stepped/flat: hue kept on all chromatic pixels incl. gamut-reduced (mean |Δh| ${s.hueAll.toFixed(2)}°, ${(s.gamutFrac * 100).toFixed(1)}% lost chroma)`);
    // --- stepped with texture
    await set(d, 'vcDetail', 1); await idle(d); await d.evaluate(() => { window.__target = null; });
    const tex = await d.evaluate(() => { const U = local.util, b = procData.data, lab = labels, N = lastValues.N, m = new Float64Array(N), q = new Float64Array(N), c = new Float64Array(N); for (let i = 0; i < lab.length; i += 2) { const j = i * 4, L = U.Lstar(0.2126 * U.S2L[b[j]] + 0.7152 * U.S2L[b[j + 1]] + 0.0722 * U.S2L[b[j + 2]]); m[lab[i]] += L; q[lab[i]] += L * L; c[lab[i]]++; } let s = 0, k = 0; for (let i = 0; i < N; i++) if (c[i] > 100) { const mu = m[i] / c[i]; s += Math.sqrt(Math.max(0, q[i] / c[i] - mu * mu)); k++; } return s / k; });
    await set(d, 'vcDetail', 0); await idle(d);
    const flat = await d.evaluate(() => { const U = local.util, b = procData.data, lab = labels, N = lastValues.N, m = new Float64Array(N), q = new Float64Array(N), c = new Float64Array(N); for (let i = 0; i < lab.length; i += 2) { const j = i * 4, L = U.Lstar(0.2126 * U.S2L[b[j]] + 0.7152 * U.S2L[b[j + 1]] + 0.0722 * U.S2L[b[j + 2]]); m[lab[i]] += L; q[lab[i]] += L * L; c[lab[i]]++; } let s = 0, k = 0; for (let i = 0; i < N; i++) if (c[i] > 100) { const mu = m[i] / c[i]; s += Math.sqrt(Math.max(0, q[i] / c[i] - mu * mu)); k++; } return s / k; });
    report.texture = { flat, tex };
    ok(tex > flat * 3 && tex > flat + 0.5, `detail slider: within-step value texture σ ${flat.toFixed(2)} (0) → ${tex.toFixed(2)} L* (1)`);
    await set(d, 'vcDetail', 0.6); await idle(d);
    // --- smooth, auto levels at defaults + full texture = identity
    await set(d, 'vcStyle', 'smooth'); await set(d, 'vcDetail', 1); await idle(d);
    const idd = await d.evaluate(() => { const a = origData.data, b = procData.data; let s = 0, m = 0, n = 0; for (let i = 0; i < a.length; i += 4) for (let c = 0; c < 3; c++) { const x = Math.abs(a[i + c] - b[i + c]); s += x; m = Math.max(m, x); n++; } return { mean: s / n, max: m }; });
    report.identity = idd;
    ok(idd.mean < 0.8 && idd.max <= 3, `smooth with neutral levels = original (mean |Δ| ${idd.mean.toFixed(2)}, max ${idd.max} of 255)`);
    // smooth with a levels curve: value follows F(L), hue kept
    await set(d, 'vMid', 35); await idle(d); s = await d.evaluate(STATS); report.smoothMid35 = s;
    ok(s.hueIn < s.floorHue * 1.6 + 0.1 && s.chromaIn < s.floorChroma * 1.6 + 0.001, `smooth (midpoint 35): hue |Δh| ${s.hueIn.toFixed(2)}° (8-bit floor ${s.floorHue.toFixed(2)}°), |ΔC| ${s.chromaIn.toFixed(4)} (floor ${s.floorChroma.toFixed(4)}) on in-gamut pixels`);
    ok(await d.evaluate(() => { const a = origData.data, b = procData.data, U = local.util; let up = 0, n = 0; for (let i = 0; i < a.length; i += 400) { const L = j => U.Lstar(0.2126 * U.S2L[j[i]] + 0.7152 * U.S2L[j[i + 1]] + 0.0722 * U.S2L[j[i + 2]]); const la = L(a); if (la > 15 && la < 85) { n++; if (L(b) > la + 2) up++; } } return up / n > 0.8; }), 'smooth: midpoint 35 lifts the mid values (curve applied)');
    // gamut: strong lightening pushes saturated colours out of sRGB → chroma reduced, marked on request
    await set(d, 'vMid', 15); await idle(d); s = await d.evaluate(STATS); report.gamutHeavy = s;
    ok(s.gamutPct > 0.001 && s.hueAll < 1.5, `gamut: ${(s.gamutPct * 100).toFixed(1)}% of pixels lost chroma, hue still kept (mean |Δh| ${s.hueAll.toFixed(2)}°)`);
    ok(await d.evaluate(() => /lose some chroma/.test(document.getElementById('vcNote').textContent)), 'gamut note shown: ' + await d.evaluate(() => document.getElementById('vcNote').textContent));
    await d.check('[data-k=vcGamut]'); await idle(d);
    ok(await d.evaluate(() => { const b = procData.data; let m = 0; for (let i = 0; i < b.length; i += 4) if (b[i] > 200 && b[i + 1] < 90 && b[i + 2] > 140) m++; return m > 50; }), 'gamut overlay marks the reduced pixels (magenta hatching)');
    await d.uncheck('[data-k=vcGamut]'); await set(d, 'vMid', 50); await set(d, 'vcStyle', 'steps'); await set(d, 'vcDetail', 0.6); await idle(d);
    // --- live drag of a histogram handle updates the colour image
    const before = await d.evaluate(() => { let s = 0; const b = procData.data; for (let i = 0; i < b.length; i += 97) s += b[i]; return s; });
    const r = await d.locator('#hist').boundingBox(), bx = await d.evaluate(() => histCuts(lastValues)[1]);
    const hx = r.x + bx / 100 * r.width, hy = r.y + r.height / 2;
    await d.mouse.move(hx, hy); await d.mouse.down(); await d.mouse.move(hx + 50, hy, { steps: 6 }); await d.waitForTimeout(400);
    const live = await d.evaluate(() => ({ live: levelLive, colorLive: !!(lastValues.color && lastValues.color.live), sum: (() => { let s = 0; const b = procData.data; for (let i = 0; i < b.length; i += 97) s += b[i]; return s; })() }));
    ok(live.live && live.colorLive && live.sum !== before, 'dragging a histogram handle updates the colour image live (half-res preview)');
    await d.screenshot({ path: path.join(OUT, 'value-color-drag.png') });
    await d.mouse.up(); await idle(d);
    ok(await d.evaluate(() => !lastValues.color.live && S.vCustom.length === S.vSteps - 1), 'release → full-quality result with the custom levels');
    // timing of the full-quality colour pass alone (engine on main-thread fallback = worst case)
    report.engineMs = await d.evaluate(() => { const h = ENGINE(); const id = 99; h({ type: 'setImage', id, w: origData.width, h: origData.height, data: origData.data.slice().buffer }); const p = Object.assign(modeParams(), {}); const t = performance.now(); h({ type: 'process', imageId: id, mode: 'values', p }); const t1 = performance.now() - t; p.live = true; const t2s = performance.now(); h({ type: 'process', imageId: id, mode: 'values', p: Object.assign({}, p, { cuts: p.cuts.map(c => c + 0.5) }) }); return { full: Math.round(t1), live: Math.round(performance.now() - t2s), px: origData.width * origData.height }; });
    ok(report.engineMs.full < 1500, `engine time: full ${report.engineMs.full} ms (first run incl. base layer), live ${report.engineMs.live} ms for ${report.engineMs.px} px`);
    // --- eyedropper: original vs adjusted value
    const cv = await d.locator('#stage').boundingBox(); await d.mouse.click(cv.x + cv.width * 0.45, cv.y + cv.height * 0.55); await d.waitForTimeout(300);
    ok(await d.evaluate(() => /original/.test(document.getElementById('pick').textContent) && /adjusted \d+%/.test(document.getElementById('pick').textContent)), 'eyedropper: ' + (await d.evaluate(() => document.querySelector('#pick .pk-t').textContent)).split('Chroma')[0].trim());
    await d.evaluate(() => closePick());
    // --- compare before/after
    await set(d, 'compare', 'split'); await set(d, 'split', 0.5); await idle(d);
    await d.screenshot({ path: path.join(OUT, 'value-color-before-after.png') });
    ok(await d.evaluate(() => S.compare === 'split' && S.vColor), 'split compare with the photo works');
    await set(d, 'compare', 'off');
    // --- persistence + storage isolation from the live app
    await d.waitForTimeout(600); await d.reload(); await idle(d);
    const st = await d.evaluate(async () => ({ v: S.vColor && S.mode === 'values', keys: Object.keys(localStorage), dbs: indexedDB.databases ? (await indexedDB.databases()).map(x => x.name) : [] }));
    ok(st.v, 'setting persists after reload');
    ok(st.keys.includes('paintplan-preview.v1') && !st.keys.includes('paintplan.v1') && st.dbs.includes('paintplan-preview') && !st.dbs.includes('paintplan'), 'preview storage is isolated: ' + JSON.stringify(st.keys) + ' / ' + JSON.stringify(st.dbs));
    await ctx.close();
    // ---------- iPhone ----------
    const mc = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const m = await mc.newPage(); watch(m, errors); await fresh(m);
    await m.tap('#modes [data-mode=values]'); await idle(m);
    await m.evaluate(() => document.querySelector('[data-k=vColor]').scrollIntoView({ block: 'center' })); await m.tap('[data-k=vColor]'); await idle(m);
    ok(await m.evaluate(() => S.vColor && !!lastValues.color), 'phone: toggle on');
    await m.evaluate(() => document.getElementById('hist').scrollIntoView({ block: 'center' })); await m.waitForTimeout(300);
    const cdp = await mc.newCDPSession(m); const TT = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
    const mr = await m.locator('#hist').boundingBox(), mb = await m.evaluate(() => histCuts(lastValues)[2]); const mx = mr.x + mb / 100 * mr.width, my = mr.y + mr.height / 2;
    const s0 = await m.evaluate(() => { let s = 0; const b = procData.data; for (let i = 0; i < b.length; i += 97) s += b[i]; return s; });
    await TT('touchStart', [[mx, my]]); for (let k = 1; k <= 8; k++) await TT('touchMove', [[mx - k * 5, my]]); await m.waitForTimeout(300); await TT('touchEnd', []); await idle(m);
    ok(await m.evaluate(s0 => { let s = 0; const b = procData.data; for (let i = 0; i < b.length; i += 97) s += b[i]; return S.vCustom.length > 0 && s !== s0; }, s0), 'phone: touch-dragging a handle updates the colour image');
    await m.evaluate(() => document.querySelector('[data-k=vColor]').scrollIntoView({ block: 'start' })); await m.waitForTimeout(200);
    await m.screenshot({ path: path.join(OUT, 'value-color-mobile.png') });
    await mc.close();
  } catch (e) { ok(false, 'exception: ' + e.message.split('\n')[0]); }
  ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + JSON.stringify(errors) : ''));
  fs.writeFileSync(path.join(OUT, 'value-color-report.json'), JSON.stringify(report, null, 1));
  await browser.close(); srv.close(); fs.rmSync(site, { recursive: true, force: true });
  console.log(failed() ? `FAILED (${failed()})` : 'ALL PASSED'); process.exit(failed() ? 1 : 0);
})();
