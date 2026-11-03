// ui_preview.js: judges the UI kit from its delivered atlases (Mitch, AD, 2026-11-01): the board's chrome at 412 by 915 with
// real nine-slices over the game's shot of the board, a modal bag sheet, and a contact sheet of every piece.
//   node tools/kit/ui_preview.js  -> out/ui/preview_phone.jpg, preview_sheet.jpg
const P = require('../paint.js'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..'), IN = path.join(ROOT, 'out/ui');
(async () => {
  const J = JSON.parse(fs.readFileSync(path.join(IN, 'ui.json'), 'utf8')), im = await P.loadImage(path.join(IN, 'ui.png')), JS = JSON.parse(fs.readFileSync(path.join(IN, 'ui_soft.json'), 'utf8')), is = await P.loadImage(path.join(IN, 'ui_soft.png'));
  const S = 2, W = 412, H = 915, FONT = 'Segoe UI';
  const img = (g, n, x, y, k = 1) => { const f = J.frames[n].frame; g.drawImage(im, f.x, f.y, f.w, f.h, x, y, f.w / 2 * k, f.h / 2 * k); };
  const nine = (g, n, x, y, w, h) => { const fr = J.frames[n], f = fr.frame, c = fr.nine, d = c / 2, sx = [f.x, f.x + c, f.x + f.w - c, f.x + f.w], sy = [f.y, f.y + c, f.y + f.h - c, f.y + f.h], dx = [x, x + d, x + w - d, x + w], dy = [y, y + d, y + h - d, y + h]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.drawImage(im, sx[i], sy[j], sx[i + 1] - sx[i], sy[j + 1] - sy[j], dx[i], dy[j], dx[i + 1] - dx[i], dy[j + 1] - dy[j]); };
  const txt = (g, t, x, y, size, col, o = {}) => P.label(g, t, x, y, size, col, { font: FONT, ...o });
  const CREAM = '#f7efdc', INK = '#2a2030';
  const board = await P.loadImage(path.join(ROOT, 'work/board_test/ingame-board.jpg'));
  const screen = sheet => { const cv = P.createCanvas(W * S, H * S), g = cv.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(board, 0, 100 * board.width / W, board.width, 640 * board.width / W, 0, 100, W, 640);
    nine(g, 'panel_hud', -4, -6, W + 8, 108); txt(g, 'Robin the Knight', 16, 20, 18, CREAM); img(g, 'mark_heart', 14, 34); nine(g, 'bar_frame', 40, 38, 150, 14); nine(g, 'bar_lost', 42, 40, 92, 10); nine(g, 'bar_hp', 42, 40, 70, 10); txt(g, '46/120', 198, 45, 12, CREAM); img(g, 'mark_drop', 14, 56); nine(g, 'bar_frame', 40, 60, 150, 14); nine(g, 'bar_mp', 42, 62, 146, 10); txt(g, '20/20', 198, 67, 12, CREAM); img(g, 'item_gold', 256, 30, 0.7); txt(g, '66', 288, 45, 14, CREAM); txt(g, 'Cloverfield Meadows', 16, 89, 12, '#f0dcb8', { weight: 'normal' });
    const f = JS.frames.die_glow.frame; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(is, f.x, f.y, f.w, f.h, 320, 2, 96, 96); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; img(g, 'die_5', 340, 22);
    nine(g, 'panel_bottom', -4, 734, W + 8, H - 730); nine(g, 'panel_message', 16, 750, W - 32, 44); txt(g, 'Tap Roll to move Robin. Tap any spot to hear about it.', W / 2, 770, 12, INK, { align: 'center', weight: 'normal' });
    [['Map', 14, 'idle'], ['World', 113, 'idle'], ['Bag', 212, 'pressed'], ['Log', 311, 'idle']].forEach(([t, x, st]) => { nine(g, 'btn_plain_small_' + st, x, 802, 88, 42); txt(g, t, x + 44, st === 'pressed' ? 825 : 820, 14, CREAM, { align: 'center' }); });
    nine(g, 'btn_action_big_idle', 56, 850, 300, 58); txt(g, 'Roll', 206, 875, 22, CREAM, { align: 'center' });
    if (sheet) { g.fillStyle = 'rgba(20,16,30,0.45)'; g.fillRect(0, 100, W, 634); nine(g, 'panel_sheet', 20, 124, W - 40, 590); txt(g, 'Bag', W / 2, 150, 20, INK, { align: 'center' });
      const slots = ['weapon', 'shield', 'helm', 'armour', 'gloves', 'boots', 'cape', 'trinket']; slots.forEach((n, i) => { const x = 46 + (i % 4) * 82, y = 176 + Math.floor(i / 4) * 66; img(g, 'slot_' + n, x, y, 1.2); }); img(g, 'frame_rare', 46 - 0, 176 - 0, 1);
      nine(g, 'row_bag_chosen', 36, 316, W - 72, 56); img(g, 'item_honey_tonic', 44, 324); txt(g, 'Honey Tonic', 94, 334, 15, INK); txt(g, 'Heals a good deal of HP', 94, 354, 12, '#5a5048', { weight: 'normal' });
      nine(g, 'row_bag_idle', 36, 378, W - 72, 56); img(g, 'item_moon_dew', 44, 386); txt(g, 'Moon Dew', 94, 396, 15, INK); txt(g, 'Restores mana', 94, 416, 12, '#5a5048', { weight: 'normal' });
      nine(g, 'row_bag_idle', 36, 440, W - 72, 56); img(g, 'item_do_over', 44, 448); txt(g, 'Do-Over', 94, 458, 15, INK); txt(g, 'Roll the die again', 94, 478, 12, '#5a5048', { weight: 'normal' });
      nine(g, 'btn_danger_small_idle', 40, 644, 110, 50); txt(g, 'Drop', 95, 666, 15, CREAM, { align: 'center' }); nine(g, 'btn_plain_small_dim', 156, 644, 100, 50); txt(g, 'Wear', 206, 666, 15, '#d8d4dc', { align: 'center' }); nine(g, 'btn_plain_small_idle', 262, 644, 110, 50); txt(g, 'Close', 317, 666, 15, CREAM, { align: 'center' }); }
    return cv; };
  const a = screen(false), b = screen(true), pv = P.createCanvas((W * 2 + 48), H + 40), g2 = pv.getContext('2d'); g2.fillStyle = '#1c1a22'; g2.fillRect(0, 0, pv.width, pv.height); g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = 'high'; g2.drawImage(a, 16, 20, W, H); g2.drawImage(b, W + 32, 20, W, H); fs.writeFileSync(path.join(IN, 'preview_phone.jpg'), pv.toBuffer('image/jpeg', 92));
  // the contact sheet at 1x, on a mid tone, in the atlas's order by family
  const names = Object.keys(J.frames).sort(), cols = 900, cv = P.createCanvas(cols * 2, 1060 * 2), g = cv.getContext('2d'); g.scale(2, 2); g.fillStyle = '#6f8f6a'; g.fillRect(0, 0, cols, 1060); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; let x = 10, y = 10, rh = 0; let last = ''; for (const n of names) { const fam = n.split(/[_/]/)[0]; const f = J.frames[n].frame, w = f.w / 2, h = f.h / 2; if (fam !== last && last) { x = 10; y += rh + 14; rh = 0; } last = fam; if (x + w + 8 > cols) { x = 10; y += rh + 8; rh = 0; } g.drawImage(im, f.x, f.y, f.w, f.h, x, y, w, h); x += w + 8; rh = Math.max(rh, h); } fs.writeFileSync(path.join(IN, 'preview_sheet.jpg'), cv.toBuffer('image/jpeg', 90)); console.log('previews written, sheet height', Math.round(y + rh));
})();
