"""Shrinks the PNGs of a delivery for the phone (Perry, AD, 2026-10-31; Robin: Zite's art must stay small, unlike the Survival
game's): every PNG under a folder is quantised to a 255-colour palette with its transparency kept (what pngquant does;
PIL here), which cuts a painted sprite's file to about a third with no visible change at phone size. Prints the before and
after sizes. Run it on out/<name>/ after packing; the originals in work/ stay untouched.

  python tools/shrink.py <folder> [--colors 255] [--dry]"""
import os, sys
from PIL import Image
args = sys.argv[1:]; folder = args[0]; colors = int(args[args.index('--colors') + 1]) if '--colors' in args else 255; dry = '--dry' in args
before = after = 0; n = 0
for root, _, files in os.walk(folder):
    for f in files:
        if not f.lower().endswith('.png'): continue
        p = os.path.join(root, f); b = os.path.getsize(p); before += b
        im = Image.open(p)
        if im.mode == 'P': after += b; continue
        im = im.convert('RGBA'); q = im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        if not dry: q.save(p, optimize=True)
        a = os.path.getsize(p) if not dry else b; after += a; n += 1
print('%d files: %.1f MB -> %.1f MB' % (n, before / 1e6, after / 1e6))
