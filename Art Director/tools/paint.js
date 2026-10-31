// paint.js: the studio's canvas helpers (Perry, AD, 2026-10-31). Everything painted in code goes through these: the canvas
// library, a seeded random, gradients, the ink line, soft blobs, seamless drawing (a brush drawn at the wrapped offsets too),
// trimming to the painted pixels, hardening alpha to the crisp sprite edge the direction asks for, tiling a piece 3 by 3.
const { createCanvas, loadImage, Image } = require('C:/dev/SG/Game Developer/node_modules/@napi-rs/canvas');
const fs = require('fs'); const path = require('path');
const INK = '#2b2320';
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function rad(g, x, y, x2, y2, r, stops) { const gr = g.createRadialGradient(x, y, 0, x2, y2, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function ink(g, w = 2.5, col = INK) { g.lineWidth = w; g.strokeStyle = col; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function rr(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// colours
function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k); }
function alpha(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }
function lighten(h, k) { return mix(h, '#ffffff', k); }
function darken(h, k) { return mix(h, '#000000', k); }
// a soft round blob (a brush dab): colour at the centre fading out
function dab(g, x, y, r, col, a = 1, soft = 0.55) { g.fillStyle = rad(g, x, y, x, y, r, [[0, alpha(col, a)], [soft, alpha(col, a * 0.7)], [1, alpha(col, 0)]]); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
// draw fn at every wrapped offset so the picture repeats seamlessly (wrapX, wrapY: the repeat sizes, or 0)
function wrapped(g, wrapX, wrapY, fn) { const xs = wrapX ? [-wrapX, 0, wrapX] : [0], ys = wrapY ? [-wrapY, 0, wrapY] : [0]; for (const dx of xs) for (const dy of ys) { g.save(); g.translate(dx, dy); fn(); g.restore(); } }
// a wobbly closed path round a centre (for bushes, canopies, patches): n bumps of radius r with wobble k
function blobPath(g, x, y, rx, ry, n, k, r) { g.beginPath(); for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2, w = 1 + (r() - 0.5) * k; const px = x + Math.cos(t) * rx * w, py = y + Math.sin(t) * ry * w; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); }
// the painted pixels' bounds (alpha above t), or null
function bounds(cv, t = 8) { const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data; let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1; for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > t) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; }
function trim(cv, pad = 0, t = 8) { const b = bounds(cv, t); if (!b) return { cv: createCanvas(1, 1), x: 0, y: 0 }; const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad), w = Math.min(cv.width - x, b.w + pad * 2), h = Math.min(cv.height - y, b.h + pad * 2); const o = createCanvas(w, h); o.getContext('2d').drawImage(cv, x, y, w, h, 0, 0, w, h); return { cv: o, x, y }; }
// crisp sprite edges: alpha at or above t becomes opaque, below becomes clear (the direction: monsters fully opaque, hard edges)
function harden(cv, t = 120) { const g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), d = im.data; for (let i = 3; i < d.length; i += 4) { if (d[i] >= t) { const k = 255 / d[i]; d[i - 3] = Math.min(255, d[i - 3] * k); d[i - 2] = Math.min(255, d[i - 2] * k); d[i - 1] = Math.min(255, d[i - 1] * k); d[i] = 255; } else d[i] = 0; } g.putImageData(im, 0, 0); return cv; }
// the canvas library stores straight (unpremultiplied) pixels in getImageData, so the k above is only right for an opaque
// expectation; where a fringe shows, draw the piece on its background instead and look.
function tile3(cv, scale = 1) { const o = createCanvas(cv.width * 3 * scale, cv.height * 3 * scale), g = o.getContext('2d'); g.imageSmoothingEnabled = false; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.drawImage(cv, i * cv.width * scale, j * cv.height * scale, cv.width * scale, cv.height * scale); return o; }
function save(cv, file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, cv.toBuffer('image/png')); return file; }
function label(g, text, x, y, size, color, o = {}) { g.save(); g.font = `${o.weight || 'bold'} ${size}px ${o.font || 'Arial'}`; g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; if (o.stroke) { g.lineWidth = o.strokeW || 4; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(text, x, y); } g.fillStyle = color; g.fillText(text, x, y); g.restore(); }
function tag(g, text, x, y, size = 12) { g.save(); g.font = `bold ${size}px Arial`; const w = g.measureText(text).width; g.fillStyle = 'rgba(43,35,32,0.7)'; g.beginPath(); rr(g, x - 4, y - size * 0.8, w + 8, size * 1.6, 4); g.fill(); g.fillStyle = '#f6efe0'; g.textBaseline = 'middle'; g.fillText(text, x, y); g.restore(); }
module.exports = { createCanvas, loadImage, Image, INK, rng, lin, rad, ink, rr, hex2rgb, rgb2hex, mix, alpha, lighten, darken, dab, wrapped, blobPath, bounds, trim, harden, tile3, save, label, tag };
