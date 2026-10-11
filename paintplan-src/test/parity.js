// Visual parity: screenshots of the pre-refactor files vs the new builds under identical steps, then a pixel diff.
// node test/parity.js   → test/out/parity/<theme>-<scenario>-{before,after,diff}.png + summary
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { launch, idle, ok, failed, ROOT } = require('./lib');
const BK = process.env.PP_BEFORE || '/workspace/_backup_pre_refactor/paintplan';
const OUT = path.join(__dirname, 'out', 'parity'); fs.mkdirSync(OUT, { recursive: true });
const PHOTO = path.join(__dirname, 'photo.jpg');
const SRC = {
  classic: { before: BK + '/index.html', after: ROOT + '/dist/classic/index.html' },
  'liquid-glass': { before: BK + '/proposals/liquid-glass/index.html', after: ROOT + '/dist/liquid-glass/index.html' },
};
const D = { viewport: { width: 1400, height: 900 } }, M = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const photo = async p => { await p.setInputFiles('#file', PHOTO); await idle(p); };
const SCEN = {
  classic: {
    'desktop-default': [D, async p => { await idle(p); }],
    'desktop-values': [D, async p => { await idle(p); await p.click('#modes [data-mode=values]'); await idle(p); }],
    'desktop-palette': [D, async p => { await idle(p); await p.click('#modes [data-mode=palette]'); await idle(p); await p.click('#swatches .sw:nth-child(2)'); await p.waitForTimeout(300); }],
    'desktop-position': [D, async p => { await idle(p); await p.click('#bPos'); await p.waitForTimeout(400); }],
    'mobile-default': [M, async p => { await idle(p); }],
    'mobile-values': [M, async p => { await idle(p); await p.tap('#modes [data-mode=values]'); await idle(p); }],
    'mobile-position': [M, async p => { await idle(p); await p.tap('#bPos'); await p.waitForTimeout(400); }],
  },
  'liquid-glass': {
    'desktop-empty': [D, async p => { await p.waitForTimeout(600); }],
    'desktop-setup': [D, async p => { await photo(p); await p.click('#bSetup'); await p.check('#dComp input[data-k=phi]'); await p.click('#dGrid summary'); await p.check('#dGrid input[data-k=grid]'); await idle(p); await p.evaluate(() => { document.getElementById('panelBody').scrollTop = 0; document.getElementById('panel').scrollTop = 0; }); await p.waitForTimeout(200); }],
    'desktop-values': [D, async p => { await photo(p); await p.click('#modes [data-mode=values]'); await idle(p); }],
    'mobile-empty': [M, async p => { await p.waitForTimeout(600); }],
    'mobile-values': [M, async p => { await photo(p); await p.tap('#modes [data-mode=values]'); await idle(p); }],
    'mobile-setup': [M, async p => { await photo(p); await p.tap('#bSetup'); await p.waitForTimeout(400); }],
    'mobile-position': [M, async p => { await photo(p); await p.tap('#bPos'); await p.waitForTimeout(400); }],
  },
};
(async () => {
  const browser = await launch(); const pairs = [];
  for (const t of Object.keys(SCEN)) for (const [name, [vp, steps]] of Object.entries(SCEN[t])) {
    for (const which of ['before', 'after']) {
      const ctx = await browser.newContext(vp); const p = await ctx.newPage();
      await p.goto('file://' + SRC[t][which]); await steps(p);
      await p.screenshot({ path: path.join(OUT, `${t}-${name}-${which}.png`) }); await ctx.close();
    }
    pairs.push(`${t}-${name}`);
  }
  await browser.close();
  const res = JSON.parse(execFileSync('python3', [path.join(__dirname, 'imgdiff.py'), OUT, ...pairs]).toString());
  for (const r of res) ok(r.diff === 0, `${r.name}: ${r.diff} differing pixels of ${r.total}` + (r.diff ? ` (max channel delta ${r.max})` : ''));
  console.log(failed() ? `FAILED (${failed()})` : 'ALL PASSED — pixel-identical'); process.exit(failed() ? 1 : 0);
})();
