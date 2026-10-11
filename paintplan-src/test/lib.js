// Shared test helpers: tiny static server (GitHub-Pages-like caching headers), browser, waits.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
function serve(root, port) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(root, p);
    if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); } f = path.join(f, 'index.html'); }
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
    const buf = fs.readFileSync(f), etag = '"' + crypto.createHash('md5').update(buf).digest('hex') + '"';
    const h = { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=600', ETag: etag };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    res.writeHead(200, h); res.end(buf);
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r(srv)));
}
const launch = () => chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
function watch(p, errors) {
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('requestfailed', r => errors.push('requestfailed: ' + r.url().slice(0, 120) + ' ' + (r.failure() || {}).errorText));
}
const idle = p => p.waitForFunction(() => typeof src !== 'undefined' && src && origData && !placeDirty && !jobs.process.busy && !jobs.edges.busy && !jobs.process.pending && !jobs.edges.pending, null, { timeout: 30000 }).then(() => p.waitForTimeout(250));
const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && e.offsetParent !== null && getComputedStyle(e).display !== 'none'; }, sel);
let fails = 0;
const ok = (c, m) => { if (c) console.log('  ok -', m); else { fails++; console.log('  FAIL -', m); } return c; };
const failed = () => fails;
const copyDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { const x = path.join(a, e.name), y = path.join(b, e.name); e.isDirectory() ? copyDir(x, y) : fs.copyFileSync(x, y); } };
module.exports = { serve, launch, watch, idle, vis, ok, failed, copyDir, ROOT: path.resolve(__dirname, '..') };
