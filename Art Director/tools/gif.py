"""Makes a GIF from a list of frames, each a stack of pictures pasted at positions, at real delays (Perry, AD,
2026-10-31; PIL is the one image library on this PC's Python). A spec in JSON:

  python tools/gif.py spec.json out.gif
  spec: {"w": 412, "h": 300, "bg": "#8fd84a" or "path.png", "scale": 1.0,
         "frames": [{"delay": 130, "layers": [{"file": "a.png", "x": 10, "y": 20, "alpha": 255}, ...]}, ...]}

Layers are pasted top-left at (x, y) in the frame's pixels before scaling; a layer's alpha (0..255) fades it. The GIF's
palette is built per frame (adaptive, 255 colours), so painted art keeps its colours well enough to judge motion."""
import json, sys
from PIL import Image, ImageDraw

spec = json.load(open(sys.argv[1])); out = sys.argv[2]
W, H = int(spec['w']), int(spec['h']); scale = float(spec.get('scale', 1.0))
bg = spec.get('bg', '#ffffff')
cache = {}
def load(p):
    if p not in cache: cache[p] = Image.open(p).convert('RGBA')
    return cache[p]
frames, delays = [], []
for fr in spec['frames']:
    im = load(bg).resize((W, H)).copy() if bg.lower().endswith('.png') else Image.new('RGBA', (W, H), bg)
    for L in fr.get('layers', []):
        pic = load(L['file'])
        if L.get('scale') and L['scale'] != 1: pic = pic.resize((max(1, round(pic.width * L['scale'])), max(1, round(pic.height * L['scale']))), Image.LANCZOS)
        if L.get('alpha', 255) < 255:
            a = pic.split()[3].point(lambda v: v * L['alpha'] // 255); pic = pic.copy(); pic.putalpha(a)
        im.alpha_composite(pic, (int(round(L['x'])), int(round(L['y']))))
    if fr.get('text'):
        d = ImageDraw.Draw(im); d.text((6, 4), fr['text'], fill=(40, 30, 24, 255))
    if scale != 1: im = im.resize((round(W * scale), round(H * scale)), Image.LANCZOS)
    frames.append(im.convert('RGB').quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)); delays.append(int(fr.get('delay', 100)))
frames[0].save(out, save_all=True, append_images=frames[1:], duration=delays, loop=0, optimize=False, disposal=1)
print('wrote', out, len(frames), 'frames', sum(delays), 'ms')
