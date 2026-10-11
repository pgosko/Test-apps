// Limited palette paint library + picker: both themes, desktop + iPhone. Search by name/code, pick → swatch + remap,
// recipes with names, presets, custom colour, legacy migration, persistence, no console errors.
const fs = require('fs'), path = require('path'), os = require('os');
const { serve, launch, watch, idle, ok, failed, copyDir, ROOT } = require('./lib');
const PHOTO = path.join(__dirname, 'photo.jpg'), OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const theme = t => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/themes', t, 'theme.json')));
(async () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-p-'));
  for (const t of ['classic', 'liquid-glass']) copyDir(path.join(ROOT, 'dist', t), path.join(site, 'Test-apps', theme(t).deploy));
  const srv = await serve(site, 8733), browser = await launch();
  for (const t of ['classic', 'liquid-glass']) {
    const url = 'http://127.0.0.1:8733/Test-apps/' + theme(t).deploy, glass = !theme(t).runtime.sample, errors = [];
    console.log('##', t);
    const fresh = async (p, ls) => { await p.goto(url); await p.evaluate(ls => { localStorage.clear(); if (ls) localStorage.setItem('paintplan.v1', ls); return new Promise(r => { const q = indexedDB.deleteDatabase('paintplan'); q.onsuccess = q.onerror = q.onblocked = () => r(); }); }, ls); await p.reload(); await p.waitForTimeout(500); if (glass) await p.setInputFiles('#file', PHOTO); await idle(p); };
    const results = p => p.$$eval('#psList .prow[data-pid]', a => a.map(b => b.dataset.pid));
    const sheetOpen = p => p.evaluate(() => { const e = document.getElementById('paintSheet'); return !!e && !e.hidden; });
    try {
      // ---------- desktop ----------
      const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } }); const d = await ctx.newPage(); watch(d, errors); await fresh(d);
      await d.click('#modes [data-mode=remap]'); await idle(d);
      ok(await d.evaluate(() => PAINTS.length >= 40 && PAINTS.every(p => p.n && p.code && /^#[0-9a-f]{6}$/.test(p.c) && p.f && p.op && p.src)), 'library loaded: ' + await d.evaluate(() => PAINTS.length) + ' paints, all with name/code/colour/family/opacity/source');
      ok(await d.evaluate(() => S.pigments.map(p => p.id).join() === 'titanium-white,yellow-ochre,cadmium-red-light,ivory-black' && S.pigments.every(p => p.c === PAINT_BY_ID[p.id].c)), 'default Zorn preset uses library paints');
      ok(await d.evaluate(() => [...document.querySelectorAll('#pigList .pig-name b')].map(b => b.textContent).join('|') === 'Titanium White|Yellow Ochre|Cadmium Red Light|Ivory Black'), 'slots show paint names');
      ok(await d.evaluate(() => /PY4[23]/.test(document.querySelector('#pigList [data-pick="1"] small').textContent) && /opaque/.test(document.querySelector('#pigList [data-pick="1"] small').textContent)), 'slot shows pigment code + opacity: ' + await d.evaluate(() => document.querySelector('#pigList [data-pick="1"] small').textContent));
      ok(await d.evaluate(() => /Titanium White/.test(document.getElementById('mixes').textContent) && /Yellow Ochre|Cadmium Red Light|Ivory Black/.test(document.getElementById('mixes').textContent)), 'recipes show paint names');
      ok(await d.evaluate(() => /approximate/i.test(document.getElementById('remapNote').textContent)), 'recipes labelled approximate');
      // picker: open, search by name / code
      await d.click('#pigList [data-pick="3"]'); await d.waitForTimeout(150);
      ok(await sheetOpen(d) && await d.evaluate(() => document.activeElement.id === 'psQ'), 'picker opens with search focused');
      ok(await d.evaluate(() => [...document.querySelectorAll('#psList .ps-gh')].map(e => e.textContent).join(',') === PAINT_FAMILIES.map(f => f[1]).join(',')), 'grouped by family: ' + await d.evaluate(() => [...document.querySelectorAll('#psList .ps-gh')].map(e => e.textContent).join(', ')));
      ok(await d.evaluate(() => { const r = document.querySelector('#psList .prow.cur'); return r && r.dataset.pid === 'ivory-black' && !!r.querySelector('.ps-sw') && !!r.querySelector('.ps-op'); }), 'rows: swatch, name, code, opacity tag; current paint marked');
      await d.fill('#psQ', 'phthalo'); let r = await results(d);
      ok(r.length === 4 && r.every(x => /phthalo/.test(x)), 'search "phthalo" → ' + r.join(', '));
      await d.fill('#psQ', 'burnt'); r = await results(d); ok(r.join() === 'burnt-sienna,burnt-umber', 'search "burnt" → ' + r.join(', '));
      await d.fill('#psQ', 'PB29'); r = await results(d); ok(r[0] === 'ultramarine-blue' && r.includes('paynes-gray') && !r.includes('phthalo-blue-gs'), 'search code "PB29" → ' + r.join(', '));
      await d.fill('#psQ', 'pb 15:3'); r = await results(d); ok(r[0] === 'phthalo-blue-gs', 'search code "pb 15:3" → ' + r.join(', '));
      await d.fill('#psQ', 'PR108'); r = await results(d); ok(r.length === 3 && r.every(x => /cadmium-red/.test(x)), 'search code "PR108" → ' + r.join(', '));
      await d.fill('#psQ', 'french'); r = await results(d); ok(r[0] === 'ultramarine-blue', 'alias search "french" → ' + r.join(', '));
      await d.fill('#psQ', 'zzqx'); ok(await d.evaluate(() => !!document.querySelector('.ps-empty') && !!document.querySelector('[data-act=name]')), 'no match: message + "Use as custom name"');
      // pick with keyboard: type + Enter → first result
      const before = await d.evaluate(() => ({ id: procImageId, mixes: JSON.stringify(lastRemap.mixes.map(m => m.rgb)) }));
      await d.fill('#psQ', 'ultramarine blue'); await d.keyboard.press('Enter'); await idle(d);
      const after = await d.evaluate(() => ({ p: S.pigments[3], v: document.querySelector('#pigList input[data-pi="3"]').value, id: procImageId, mixes: JSON.stringify(lastRemap.mixes.map(m => m.rgb)), preset: S.rPreset, txt: document.getElementById('mixes').textContent, open: !document.getElementById('paintSheet').hidden }));
      ok(!after.open && after.p.id === 'ultramarine-blue' && after.p.n === 'Ultramarine Blue', 'Enter picks the first match and closes');
      ok(after.v === await d.evaluate(() => PAINT_BY_ID['ultramarine-blue'].c), 'swatch set automatically to library colour ' + after.v);
      ok(after.mixes !== before.mixes && after.preset === 'custom', 'remap re-ran with the new paint (preset → custom)');
      ok(/Ultramarine Blue/.test(after.txt), 'recipes show the new paint name');
      // pick by click
      await d.click('#pigList [data-pick="2"]'); await d.fill('#psQ', 'alizarin'); await d.click('#psList [data-pid="permanent-alizarin"]'); await idle(d);
      ok(await d.evaluate(() => S.pigments[2].id === 'permanent-alizarin' && /approx/.test(document.querySelector('#pigList [data-pick="2"] small').textContent)), 'click picks paint; approximate entries tagged "approx"');
      // Escape closes without change
      await d.click('#pigList [data-pick="0"]'); await d.keyboard.press('Escape'); ok(!(await sheetOpen(d)) && await d.evaluate(() => S.pigments[0].id === 'titanium-white'), 'Escape closes, no change');
      // custom name
      await d.click('#pigList [data-pick="0"]'); await d.fill('#psQ', 'My white'); await d.click('[data-act=name]'); await idle(d);
      ok(await d.evaluate(() => S.pigments[0].n === 'My white' && !S.pigments[0].id && S.pigments[0].c === PAINT_BY_ID['titanium-white'].c), 'custom name keeps colour, drops library link');
      // manual colour
      await d.evaluate(() => { const e = document.querySelector('#pigList input[data-pi="1"]'); e.value = '#33aa55'; e.dispatchEvent(new Event('input', { bubbles: true })); }); await idle(d);
      ok(await d.evaluate(() => S.pigments[1].c === '#33aa55' && !S.pigments[1].id && /custom colour/.test(document.querySelector('#pigList [data-pick="1"] small').textContent)), 'manual colour input still works (slot becomes custom colour)');
      // persistence
      await d.waitForTimeout(600); const saved = await d.evaluate(() => JSON.stringify(S.pigments)); await d.reload(); await idle(d);
      ok(await d.evaluate(s => JSON.stringify(S.pigments) === s && S.mode === 'remap' && document.querySelector('#pigList [data-pick="3"] b').textContent === 'Ultramarine Blue', saved), 'paints persist after reload');
      // presets
      for (const [id, names] of await d.evaluate(() => Object.entries(PALS).filter(e => e[1][1]).map(e => [e[0], e[1][1]]))) {
        await d.selectOption('#c_rPreset', id); await idle(d);
        ok(await d.evaluate(n => S.pigments.map(p => p.n).join('|') === n.join('|') && S.pigments.every(p => PAINT_BY_ID[p.id] && p.c === PAINT_BY_ID[p.id].c) && lastRemap && document.querySelectorAll('#pigList .pig').length === n.length, names), `preset ${id} loads library paints (${names.length})`);
      }
      // add paint opens picker
      await d.click('#bAddPig'); ok(await sheetOpen(d) && await d.evaluate(() => S.pigments.length === 3), '+ Add paint opens the picker for the new slot');
      await d.fill('#psQ', 'cadmium yellow light'); await d.keyboard.press('Enter'); await idle(d);
      ok(await d.evaluate(() => S.pigments[2].id === 'cadmium-yellow-light'), 'new slot set from picker');
      await d.selectOption('#c_rPreset', 'zorn'); await idle(d);
      await d.evaluate(() => document.getElementById('c_rPreset').scrollIntoView({ block: 'start' })); await d.waitForTimeout(200);
      await d.screenshot({ path: path.join(OUT, t === 'classic' ? 'limited-palette-names.png' : 'limited-palette-names-glass.png') });
      // mixing model: tinting strength makes phthalo dominate white
      ok(await d.evaluate(() => { const w = PAINT_BY_ID['titanium-white'], b = PAINT_BY_ID['phthalo-blue-gs']; const a = local({ type: 'suggest', pigs: [w.c, b.c], ts: [1, 1], rgb: [200, 210, 240] }).res, s = local({ type: 'suggest', pigs: [w.c, b.c], ts: [w.ts, b.ts], rgb: [200, 210, 240] }).res; const pw = x => x.w[0] / (x.w[0] + x.w[1]); return pw(s) > pw(a); }), 'strong pigment needs more white for the same light tint (tinting strength in mixing model)');
      // legacy saved palette migrates to library paints
      await fresh(d, JSON.stringify({ mode: 'remap', rPreset: 'custom', pigments: [{ n: 'Titanium White', c: '#f4f2ec' }, { n: 'Burnt Umber', c: '#4b3223' }, { n: 'Mine', c: '#123456' }] }));
      ok(await d.evaluate(() => S.pigments[0].id === 'titanium-white' && S.pigments[1].id === 'burnt-umber' && !S.pigments[2].id && S.pigments[2].c === '#123456'), 'old saved palette: preset paints upgraded to library, custom kept');
      await ctx.close();
      // ---------- iPhone ----------
      const mc = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const m = await mc.newPage(); watch(m, errors); await fresh(m);
      await m.tap('#modes [data-mode=remap]'); await idle(m);
      await m.evaluate(() => document.querySelector('#pigList [data-pick="1"]').scrollIntoView({ block: 'center' })); await m.waitForTimeout(200);
      ok((await m.locator('#pigList [data-pick="1"]').boundingBox()).height >= 43, 'phone: slot name button ≥44 px');
      await m.tap('#pigList [data-pick="1"]'); await m.waitForTimeout(300);
      const geo = await m.evaluate(() => { const c = document.querySelector('.ps-card').getBoundingClientRect(), q = document.getElementById('psQ'), rows = [...document.querySelectorAll('#psList .prow')].slice(0, 8).map(r => r.getBoundingClientRect().height); return { bottom: c.bottom, top: c.top, w: c.width, fs: parseFloat(getComputedStyle(q).fontSize), qh: q.getBoundingClientRect().height, rows, focus: document.activeElement === q }; });
      ok(Math.abs(geo.bottom - 844) < 2 && geo.w >= 389 && geo.top > 60, `phone: bottom sheet (top ${Math.round(geo.top)}, full width)`);
      ok(geo.fs >= 16 && geo.qh >= 43 && !geo.focus, `phone: search field ${geo.qh}px, ${geo.fs}px font (no zoom), keyboard not forced open`);
      ok(geo.rows.every(h => h >= 50), 'phone: rows ≥ 50 px tap targets: ' + geo.rows.map(Math.round).join(','));
      await m.screenshot({ path: path.join(OUT, `paint-picker-mobile-${glass ? 'glass' : 'classic'}.png`) });
      await m.tap('#psQ'); await m.keyboard.type('raw si'); await m.waitForTimeout(150);
      r = await results(m); ok(r[0] === 'raw-sienna', 'phone: type-ahead "raw si" → ' + r.join(', '));
      await m.screenshot({ path: path.join(OUT, `paint-picker-mobile-${glass ? 'glass' : 'classic'}-search.png`) });
      await m.tap('#psList [data-pid="raw-sienna"]'); await idle(m);
      ok(!(await sheetOpen(m)) && await m.evaluate(() => S.pigments[1].id === 'raw-sienna' && document.querySelector('#pigList input[data-pi="1"]').value === PAINT_BY_ID['raw-sienna'].c && /Raw Sienna/.test(document.getElementById('mixes').textContent)), 'phone: tap selects, swatch + recipes update');
      await m.tap('#pigList [data-pick="0"]'); await m.waitForTimeout(200); await m.tap('#psDone'); ok(!(await sheetOpen(m)), 'phone: Done closes sheet');
      await m.waitForTimeout(600); await m.reload(); await idle(m);
      ok(await m.evaluate(() => S.pigments[1].id === 'raw-sienna'), 'phone: persists after reload');
      await mc.close();
    } catch (e) { ok(false, 'exception: ' + e.message.split('\n')[0]); }
    ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + JSON.stringify(errors) : ''));
  }
  await browser.close(); srv.close(); fs.rmSync(site, { recursive: true, force: true });
  console.log(failed() ? `FAILED (${failed()})` : 'ALL PASSED'); process.exit(failed() ? 1 : 0);
})();
