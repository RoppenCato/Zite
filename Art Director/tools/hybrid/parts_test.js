// parts_test.js: the per-part alignment test (Mitch, AD, 2026-11-01). One outfit (a hat, a coat of plate, leather boots, a sword) is rendered as eight
// atlases that share frames, delays and pivots, stacked back in order, and compared with the whole figure drawn directly.
//   node tools/hybrid/parts_test.js  -> work/parts/<layer>/, work/parts/report.json, compare.jpg
const P = require('../paint.js'); const R = require('./rig.js'); const path = require('path'); const fs = require('fs'); const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), WORK = path.join(ROOT, 'work/parts'); fs.rmSync(WORK, { recursive: true, force: true });
const O = { head: 'hat', torso: 'plate', hands: 'bare', boots: 'leather', back: null, weapon: 'sword', offhand: null }, ORDER = ['body', 'coat', 'far_front', 'head', 'hat', 'arm', 'sword', 'hand'];
const FW = 640, FH = 500, OX = 320, OY = 460, UNIT = 3;
const canvas = J => { const cv = P.createCanvas(FW, FH), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.translate(OX, OY); g.scale(-UNIT, UNIT); if (J.rot || J.drop) { g.translate(0, J.drop || 0); g.rotate((J.rot || 0) * Math.PI / 180); } return [cv, g]; };
(async () => {
  await R.loadMasters(); const CL = R.clipsFor(O), sizes = {};
  for (const L of ORDER) { const dir = path.join(WORK, L, 'render'); fs.mkdirSync(dir, { recursive: true }); const meta = { origin: [OX, OY], size: FW, px: 1, actions: {} };
    for (const [act, A] of Object.entries(CL)) { meta.actions[act] = { delay: A.delay, frames: [] }; A.frames.forEach((J, i) => { const [cv, g] = canvas(J); R.LAYERS[L](g, J, O); const file = `${act}_${String(i).padStart(2, '0')}.png`; P.save(cv, path.join(dir, file)); meta.actions[act].frames.push({ file, delay: (A.delays || [])[i] || A.delay }); }); }
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta)); const r = spawnSync('node', [path.join(ROOT, 'tools/pack.js'), 'part_' + L, dir, path.join(WORK, L, 'out')], { encoding: 'utf8' }); if (r.status) throw new Error(r.stderr); const m = r.stdout.match(/\((\d+x\d+), (\d+) KB\)/); sizes[L] = m ? m[1] : '?'; }
  const AT = {}; for (const L of ORDER) { const J = JSON.parse(fs.readFileSync(path.join(WORK, L, 'out', `part_${L}.json`), 'utf8')); AT[L] = { J, im: await P.loadImage(path.join(WORK, L, 'out', J.meta.image)) }; }
  let worst = { pct: 0 }, sum = 0, n = 0; const rows = [];
  for (const [act, A] of Object.entries(CL)) for (let i = 0; i < A.frames.length; i++) { const J = A.frames[i];
    const stacked = P.createCanvas(FW, FH), sg = stacked.getContext('2d'); for (const L of ORDER) { const F = AT[L].J.actions[act].frames[i], fr = AT[L].J.frames[F.name].frame; sg.drawImage(AT[L].im, fr.x, fr.y, fr.w, fr.h, OX - F.origin.x, OY - F.origin.y, fr.w, fr.h); }
    const [whole, wg] = canvas(J); R.drawOutfit(wg, J, O); P.harden(whole);
    const a = sg.getImageData(0, 0, FW, FH).data, b = whole.getContext('2d').getImageData(0, 0, FW, FH).data; let diff = 0, ink = 0; for (let p = 0; p < a.length; p += 4) { const on = a[p + 3] > 127 || b[p + 3] > 127; if (!on) continue; ink++; if ((a[p + 3] > 127) !== (b[p + 3] > 127) || Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2]) > 90) diff++; }
    const pct = +(100 * diff / Math.max(1, ink)).toFixed(2); sum += pct; n++; if (pct > worst.pct) worst = { pct, act, i }; rows.push({ act, i, pct, stacked, whole }); }
  const report = { frames: n, meanPct: +(sum / n).toFixed(2), worst, sizes }; fs.writeFileSync(path.join(WORK, 'report.json'), JSON.stringify(report, null, 1)); console.log(JSON.stringify(report));
  const pick = [rows[0], rows.find(r => r.act === 'move' && r.i === 1), rows.find(r => r.act === 'attack1' && r.i === 1), rows.find(r => r.act === 'attack1' && r.i === 3), rows.find(r => r.act === 'hit1'), rows.find(r => r.act === worst.act && r.i === worst.i)];
  const cv = P.createCanvas(pick.length * 240 + 20, 640), g = cv.getContext('2d'); g.fillStyle = '#8fd164'; g.fillRect(0, 0, cv.width, 640); pick.forEach((r, k) => { g.drawImage(r.stacked, 20, 40, 600, 460, 10 + k * 240, 10, 240, 184 * 1.6); g.drawImage(r.whole, 20, 40, 600, 460, 10 + k * 240, 320, 240, 184 * 1.6); P.label(g, `${r.act} ${r.i + 1}: ${r.pct}%`, 130 + k * 240, 312, 12, '#2a2030', { align: 'center' }); }); fs.writeFileSync(path.join(WORK, 'compare.jpg'), cv.toBuffer('image/jpeg', 90));
})();
