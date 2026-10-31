#!/usr/bin/env node
// The studio's viewer server: serves viewer/ and out/ on http://localhost:8778 and lists the deliveries at /api/index.
//   node tools/serve.js [PORT]
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.argv[2] || 8778);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.md': 'text/plain; charset=utf-8', '.rb': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

function index() {
  const out = { music: [], sfx: [], groups: [] }, mdir = path.join(ROOT, 'out', 'music'), sdir = path.join(ROOT, 'out', 'sfx');
  let cat = { groups: [], tracks: {}, sounds: {} };                       // the studio's notes on each delivery (out/music/catalog.json)
  try { cat = JSON.parse(fs.readFileSync(path.join(mdir, 'catalog.json'), 'utf8')); } catch (e) {}
  out.groups = cat.groups || [];
  if (fs.existsSync(mdir)) for (const name of fs.readdirSync(mdir)) {
    const dir = path.join(mdir, name), mf = path.join(dir, 'manifest.json');
    if (!fs.existsSync(mf)) continue;
    const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
    const files = fs.readdirSync(dir);
    const c = (cat.tracks || {})[name] || {};
    out.music.push({ name, dir: `out/music/${name}`, manifest: m, group: c.group || 'Other', title: c.title || name, status: c.status || 'current', verdict: c.verdict || '', line: c.line || '', order: Object.keys(cat.tracks || {}).indexOf(name), notes: files.includes('NOTES.md') ? `out/music/${name}/NOTES.md` : null,
      before: files.includes('before.wav') ? `out/music/${name}/before.wav` : null,
      beforeDanger: files.includes('before_danger.wav') ? `out/music/${name}/before_danger.wav` : null,
      source: files.find(f => f.endsWith('.rb')) ? `out/music/${name}/${files.find(f => f.endsWith('.rb'))}` : null });
  }
  if (fs.existsSync(sdir)) for (const catName of fs.readdirSync(sdir)) {
    const dir = path.join(sdir, catName); if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) {
      const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const cs = (cat.sounds || {})[m.name] || {};
      out.sfx.push({ name: m.name, title: cs.title || m.name, status: cs.status || 'current', verdict: cs.verdict || '', category: catName, dir: `out/sfx/${catName}`, variations: m.variations || [],
        notes: fs.existsSync(path.join(dir, 'NOTES.md')) ? `out/sfx/${catName}/NOTES.md` : null });
    }
  }
  out.music.sort((a, b) => (a.order < 0 ? 99 : a.order) - (b.order < 0 ? 99 : b.order));
  return out;
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/api/index') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(index())); }
  let rel = url === '/' ? 'viewer/index.html' : url.replace(/^\//, '');
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const st = fs.statSync(file), type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {                       // ranges, so the browser can seek in a WAV
    const a = range[1] ? +range[1] : 0, b = range[2] ? +range[2] : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': b - a + 1, 'Accept-Ranges': 'bytes' });
    return fs.createReadStream(file, { start: a, end: b }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`Zite Sound viewer: http://localhost:${PORT}/`));
