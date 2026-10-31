// guide_sheet.js: the pose guides as grey stick figures (Perry, AD, 2026-10-31): the frames a clip's numbers describe, drawn
// side on at our chibi's proportions, with the key frames picked (the extremes of the legs' or arm's swing), so my hand
// poses can be judged against the weight shift, lean and timing. For the studio's eyes only; never delivered.
//   node tools/guide_sheet.js <guide.json> <out.png> [--pick 6] [--every 3]
const P = require('./paint.js'); const fs = require('fs'); const path = require('path');
const a = process.argv.slice(2); const [file, out] = a; const opt = k => a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : null;
const G = JSON.parse(fs.readFileSync(file, 'utf8')), F = G.frames, rad = d => d * Math.PI / 180;
function pick(n) {                                               // the extremes: where the thigh spread or the right arm's swing turns round, plus the ends
  const s = F.map(r => Math.abs(r.thighL - r.thighR) + Math.abs(r.armR) * 0.5); const keys = [0];
  for (let i = 1; i < F.length - 1; i++) if ((s[i] > s[i - 1] && s[i] >= s[i + 1]) || (s[i] < s[i - 1] && s[i] <= s[i + 1])) keys.push(i);
  keys.push(F.length - 1); const uniq = [...new Set(keys)].sort((x, y) => x - y);
  while (uniq.length > n) { let bi = 1, bd = 1e9; for (let i = 1; i < uniq.length - 1; i++) { const d = Math.min(uniq[i] - uniq[i - 1], uniq[i + 1] - uniq[i]); if (d < bd) { bd = d; bi = i; } } uniq.splice(bi, 1); }
  return uniq;
}
function stick(g, x, y, r, k) {                                  // the chibi's proportions: a metre is 200 px at 2x; legs 0.26, torso 0.26, head 0.5
  const L = 52, T = 52, A = 44; g.lineCap = 'round'; g.lineWidth = 10; g.strokeStyle = '#6a6a6a';
  const hip = [x + r.hipX * 120 * k, y - L - r.hipY * 200 * k];
  for (const [th, sh, col] of [[r.thighR, r.shinR, '#8a8a8a'], [r.thighL, r.shinL, '#4a4a4a']]) {
    const kx = hip[0] - Math.sin(rad(th * k)) * L * 0.55, ky = hip[1] + Math.cos(rad(th * k)) * L * 0.55; const fx = kx - Math.sin(rad(sh * k)) * L * 0.45, fy = ky + Math.cos(rad(sh * k)) * L * 0.45;
    g.strokeStyle = col; g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
  }
  const nx = hip[0] - Math.sin(rad(r.lean * k)) * T, ny = hip[1] - Math.cos(rad(r.lean * k)) * T; g.strokeStyle = '#6a6a6a'; g.lineWidth = 14; g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(nx, ny); g.stroke();
  for (const [ar, fr, col] of [[r.armL, r.foreL, '#4a4a4a'], [r.armR, r.foreR, '#8a8a8a']]) {
    const ex = nx - Math.sin(rad(ar * k)) * A * 0.5, ey = ny + Math.cos(rad(ar * k)) * A * 0.5; const hx = ex - Math.sin(rad(fr * k)) * A * 0.5, hy = ey + Math.cos(rad(fr * k)) * A * 0.5;
    g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.moveTo(nx, ny); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
  }
  const hx = nx - Math.sin(rad(r.head * k)) * 30, hy = ny - Math.cos(rad(r.head * k)) * 30; g.fillStyle = '#7a7a7a'; g.beginPath(); g.ellipse(hx, hy, 46, 42, 0, 0, 7); g.fill();
  g.fillStyle = '#2b2320'; g.beginPath(); g.arc(hx - 26, hy, 5, 0, 7); g.fill();   // the eye marks the facing
}
const keys = opt('pick') ? pick(+opt('pick')) : F.map((_, i) => i).filter(i => i % (+(opt('every') || 3)) === 0);
const cell = 240, cv = P.createCanvas(Math.min(keys.length, 8) * cell, Math.ceil(keys.length / 8) * 360 + 40), g = cv.getContext('2d'); g.fillStyle = '#8fd84a'; g.fillRect(0, 0, cv.width, cv.height);
keys.forEach((i, n) => { const x = (n % 8) * cell + cell / 2, y = 40 + Math.floor(n / 8) * 360 + 300; g.strokeStyle = 'rgba(43,35,32,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - cell / 2, y); g.lineTo(x + cell / 2, y); g.stroke(); stick(g, x, y, F[i], 1.0); P.tag(g, `f${F[i].f}  lean ${F[i].lean}  thigh ${F[i].thighR}/${F[i].thighL}  arm ${F[i].armR}/${F[i].foreR}  hip ${F[i].hipY}`, x - cell / 2 + 4, y + 18, 9); });
P.tag(g, `${G.clip}: ${keys.length} of ${F.length} frames, the figure's own angles at our proportions, drawn 1:1 (no exaggeration)`, 6, 14, 12);
P.save(cv, out); console.log('wrote', out, 'keys', keys.map(i => F[i].f).join(','));
