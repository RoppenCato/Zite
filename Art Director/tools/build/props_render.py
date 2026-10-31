"""Renders every prop of a props .blend twice (Perry, AD, 2026-10-31): side on for the fight kit and a touch from above
(elevation 30) for the board kit, each in its own square frame at 2x with the painted look, and writes meta.json with
where the foot (the world origin) lands in each picture. props_finish.js trims them, hardens the edge, adds the contact
shadow and writes them into the kit with their data.

  node tools/blender.js tools/build/props_render.py -- work/meadow/props/props.blend work/meadow/props/render [--only tree,bush] [--views side,board] [--elev 30]"""
import bpy, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
blend, out = os.path.abspath(argv[0]), os.path.abspath(argv[1])
opt = {'only': '', 'views': 'side,board', 'elev': '30', 'px': '2', 'samples': '16', 'boardscale': '0.6'}   # boardscale: the board's camera is pulled back; its pieces are drawn at this fraction of the fight's scale (mine, 2026-10-31, as the mock-up had it)
i = 2
while i < len(argv):
    opt[argv[i].lstrip('-')] = argv[i + 1]; i += 2
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; vl = bpy.context.view_layer
props = json.loads(sc['props']); only = [p for p in opt['only'].split(',') if p]
PX = int(opt['px']); views = {'side': 0.0, 'board': float(opt['elev'])}
os.makedirs(out, exist_ok=True); meta = {}
for name, spec in props.items():
    if only and name not in only: continue
    for c in sc.collection.children: c.hide_render = c.name != name
    size = int(spec['size']); ortho = size / 100.0          # 100 CSS px a metre
    meta[name] = {'size': size}
    for view in opt['views'].split(','):
        elev = views[view]; aim_z = ortho * 0.5 - 0.12       # the foot sits 12 CSS px above the frame's bottom
        k = 1.0 if view == 'side' else float(opt['boardscale']); vs = int(round(size * k))   # the same frame in metres, fewer pixels for the board
        cam = toon.stage(sc, vl, vs, vs, PX, elev, ortho, aim_z, 0.0, int(opt['samples']), line=1.0 if k == 1 else 0.8)
        vl.update(); o = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
        sc.render.filepath = os.path.join(out, '%s_%s.png' % (name, view)); bpy.ops.render.render(write_still=True)
        meta[name][view] = {'file': '%s_%s.png' % (name, view), 'foot': [round(o.x * vs * PX, 1), round((1 - o.y) * vs * PX, 1)], 'elev': elev, 'scale': k}
        print('rendered', name, view)
with open(os.path.join(out, 'meta.json'), 'w') as fh: json.dump(meta, fh, indent=1)
print('rendered', len(meta), 'props into', out)
