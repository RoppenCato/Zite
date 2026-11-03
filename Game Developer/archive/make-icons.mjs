// Makes the PWA icon placeholders (a die on a dark square) as PNG files, with no image library.
// Run: npm run icons. Writes client/public/pwa-192x192.png and pwa-512x512.png.
// The Art Director's real icon replaces these files; nothing else changes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const OUT = join(import.meta.dirname, '..', 'client', 'public');
const BG = [0x1b, 0x1f, 0x2a];
const DIE = [0xe8, 0xe4, 0xd8];
const PIP = [0x1b, 0x1f, 0x2a];

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundedRect(px, py, x, y, w, h, r) {
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function draw(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const die = { x: size * 0.19, y: size * 0.19, w: size * 0.62, h: size * 0.62, r: size * 0.12 };
  const pipRadius = size * 0.055;
  const pips = [
    [0.33, 0.33],
    [0.67, 0.33],
    [0.5, 0.5],
    [0.33, 0.67],
    [0.67, 0.67],
  ].map(([a, b]) => [a * size, b * size]);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let c = BG;
      if (inRoundedRect(px, py, die.x, die.y, die.w, die.h, die.r)) {
        c = DIE;
        for (const [cx, cy] of pips) {
          if ((px - cx) ** 2 + (py - cy) ** 2 <= pipRadius * pipRadius) {
            c = PIP;
            break;
          }
        }
      }
      const i = (y * size + x) * 4;
      rgba[i] = c[0];
      rgba[i + 1] = c[1];
      rgba[i + 2] = c[2];
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

mkdirSync(OUT, { recursive: true });
for (const size of [192, 512]) {
  const file = join(OUT, `pwa-${size}x${size}.png`);
  writeFileSync(file, png(size, draw(size)));
  console.log(`wrote ${file}`);
}
