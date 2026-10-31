"""Renders a monster (or a character) from its .blend to frames with their data (Perry, AD, 2026-10-31): every action the
builder keyed, frame by frame, as transparent PNGs at our 2x file scale, facing left, side on; and beside them meta.json
with, for every frame, the origin (the feet, where the model's world origin lands), the delay, the hit box (the body's
bounds) and the head (the top of the 'head' part), all in the render's pixels. tools/pack.js trims the frames and
turns these into the game's numbers.

  node tools/blender.js tools/build/render.py -- <blend> <out dir> [--actions stand,move] [--size 160] [--px 2]
      [--elev 0] [--ortho 1.6] [--aim 0.5] [--samples 16] [--line 1.0] [--keep 1]

The builder leaves on the scene: scene['clips'] = JSON {action: {start, frames, delay, alpha?}} (delay in ms a frame,
alpha an optional list of per-frame opacities 0..255 for fades); scene['head'] = the name of the part whose top is the
head; scene['body'] = a comma list of parts that make the hit box (default: every mesh not named fx*). A part named
'Origin' is not needed: the feet are the world origin, the model stands on z = 0, facing -X (screen left)."""
import bpy, math, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
blend, out = os.path.abspath(argv[0]), os.path.abspath(argv[1])
opt = {'actions': '', 'size': '160', 'px': '2', 'elev': '0', 'ortho': '1.6', 'aim': '0.5', 'samples': '16', 'line': '1.0', 'keep': '0', 'aimx': '0'}
i = 2
while i < len(argv):
    k = argv[i].lstrip('-'); opt[k] = argv[i + 1]; i += 2
SIZE, PX = int(opt['size']), int(opt['px'])

bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; vl = bpy.context.view_layer
clips = json.loads(sc['clips']) if isinstance(sc.get('clips'), str) else dict(sc['clips'])
actions = [a for a in opt['actions'].split(',') if a] or list(clips.keys())
cam = toon.stage(sc, vl, SIZE, SIZE, PX, float(opt['elev']), float(opt['ortho']), float(opt['aim']), float(opt['aimx']), int(opt['samples']), float(opt['line']))
HEAD = sc.get('head', 'head')
BODY = [n for n in (sc.get('body') or '').split(',') if n]

def px_of(p):
    v = world_to_camera_view(sc, cam, p); return [round(v.x * SIZE * PX, 1), round((1 - v.y) * SIZE * PX, 1)]
def bounds(objs):
    xs, ys = [], []
    for o in objs:
        for c in o.bound_box:
            x, y = px_of(o.matrix_world @ Vector(c)); xs.append(x); ys.append(y)
    return [min(xs), min(ys)], [max(xs), max(ys)]
def body_objects():
    if BODY: return [sc.objects[n] for n in BODY if n in sc.objects]
    return [o for o in sc.objects if o.type == 'MESH' and not o.hide_render and not o.name.lower().startswith('fx')]

os.makedirs(out, exist_ok=True)
vl.update()                                   # the camera was just made: without this its transform is still identity and the origin lands at the frame's centre (the trial's first packs were 110 px off)
origin = px_of(Vector((0, 0, 0)))
meta = {'size': SIZE, 'px': PX, 'elev': float(opt['elev']), 'ortho': float(opt['ortho']), 'origin': origin, 'actions': {}}
n = 0
for act in actions:
    c = clips[act]; frames = []
    for f in range(int(c['frames'])):
        sc.frame_set(int(c['start']) + f); vl.update()
        file = '%s_%02d.png' % (act, f); sc.render.filepath = os.path.join(out, file)
        if not (opt['keep'] == '1' and os.path.exists(sc.render.filepath)): bpy.ops.render.render(write_still=True)
        lt, rb = bounds(body_objects())
        head = sc.objects.get(HEAD)
        top = px_of(head.matrix_world @ Vector(max(head.bound_box, key=lambda c: (head.matrix_world @ Vector(c)).z))) if head else [origin[0], lt[1]]
        fr = {'file': file, 'delay': int(c['delay']), 'lt': lt, 'rb': rb, 'head': top}
        if c.get('alpha'):
            al = c['alpha']; fr['a0'] = int(al[f]); fr['a1'] = int(al[min(f + 1, len(al) - 1)])
        frames.append(fr); n += 1
    meta['actions'][act] = {'frames': frames, 'delay': int(c['delay'])}
with open(os.path.join(out, 'meta.json'), 'w') as fh: json.dump(meta, fh, indent=1)
print('rendered', n, 'frames to', out, 'origin', origin)
