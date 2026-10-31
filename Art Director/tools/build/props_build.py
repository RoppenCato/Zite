"""The Sunny Meadow's props, built by script in Blender (Perry, AD, 2026-10-31): one collection per prop, each standing
on z = 0 at the origin, a metre being our player's height (100 CSS px). props_render.py renders each one side on (for the
fight kit) and a touch from above (for the board kit) with the painted look. Chunky, rounded, few parts: a tree is a trunk
and a cluster of leaf balls, a house a bulging stem under a spotted cap.

  node tools/blender.js tools/build/props_build.py -- work/meadow/props/props.blend"""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
out = os.path.abspath(sys.argv[sys.argv.index('--') + 1])
M = lambda name, hexs, **k: toon.material(name, hexs, **k)
COL = {
    'trunk': M('trunk', '#8a5f3a'), 'leaf': M('leaf', '#6fc25c'), 'leaf2': M('leaf2', '#5fb04a'), 'leaf3': M('leaf3', '#83cf5e'),
    'cap': M('cap', '#e8503e'), 'spot': M('spot', '#fff4ea', flat=True), 'wall': M('wall', '#f6ecd8'), 'door': M('door', '#7a4a2a'), 'window': M('window', '#7fb3e8', flat=True),
    'wood': M('wood', '#c58a4a'), 'wood2': M('wood2', '#a8713a'), 'rock': M('rock', '#9aa0a8'), 'rock2': M('rock2', '#8a8f98'), 'hay': M('hay', '#e8c452'), 'hay2': M('hay2', '#d9ae3a'),
    'stump': M('stump', '#9c6a3e'), 'ring': M('ring', '#e2b887', matte=True), 'cap2': M('cap2', '#e0623c'), 'stem': M('stem', '#f2e6cf'), 'moss': M('moss', '#7fcf5a'),
}
cur = None
def coll(name):
    global cur
    c = bpy.data.collections.new(name); sc.collection.children.link(c); cur = c; return c
def link(o):
    for c in list(o.users_collection): c.objects.unlink(o)
    cur.objects.link(o); return o
def smooth(o):
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth(); o.select_set(False)
def sphere(name, r, loc, mat, scale=(1, 1, 1), seg=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=max(8, seg // 2))
    o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o); return link(o)
def cyl(name, r, h, loc, mat, scale=(1, 1, 1), rot=(0, 0, 0), verts=24, r2=None):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, vertices=verts)
    o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o)
    return link(o)
def box(name, size, loc, mat, bevel=0.03, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = name; o.scale = size; o.rotation_euler = rot; o.data.materials.append(mat)
    if bevel: b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 3; b.limit_method = 'NONE'
    smooth(o); return link(o)
def canopy(name, cx, cz, balls, mats):
    for i, (dx, dy, dz, r) in enumerate(balls): sphere('%s_leaf%d' % (name, i), r, (cx + dx, dy, cz + dz), mats[i % len(mats)])

PROPS = {}   # name -> the frame in CSS px (square), for the renderer
def prop(name, size): coll(name); PROPS[name] = {'size': size}

# a big round tree, about two players tall
prop('tree', 260)
cyl('tree_trunk', 0.16, 0.9, (0, 0, 0.45), COL['trunk'], r2=0.11)
for i, (dx, dy) in enumerate([(-0.16, 0.02), (0.14, -0.08), (0.02, 0.15)]): sphere('tree_root%d' % i, 0.11, (dx, dy, 0.03), COL['trunk'], scale=(1.4, 1.2, 0.5))
canopy('tree', 0, 1.42, [(0, 0, 0, 0.58), (-0.42, 0.05, -0.12, 0.40), (0.44, -0.05, -0.10, 0.40), (0.0, -0.1, 0.36, 0.40), (-0.22, -0.28, 0.1, 0.34), (0.25, 0.28, 0.12, 0.34)], [COL['leaf'], COL['leaf2'], COL['leaf3']])
# a small tree
prop('tree_small', 180)
cyl('tree_small_trunk', 0.12, 0.55, (0, 0, 0.27), COL['trunk'], r2=0.09)
canopy('tree_small', 0, 0.92, [(0, 0, 0, 0.40), (-0.3, 0.04, -0.08, 0.28), (0.3, -0.04, -0.06, 0.28), (0, 0, 0.26, 0.28)], [COL['leaf3'], COL['leaf'], COL['leaf2']])
# a round bush and a wide one
prop('bush', 110)
canopy('bush', 0, 0.3, [(0, 0, 0, 0.32), (-0.26, 0.05, -0.06, 0.24), (0.26, -0.05, -0.05, 0.24), (0.02, -0.08, 0.2, 0.22)], [COL['leaf2'], COL['leaf'], COL['leaf3']])
prop('bush_wide', 150)
canopy('bush_wide', 0, 0.24, [(0, 0, 0, 0.3), (-0.42, 0.04, -0.04, 0.24), (0.42, -0.04, -0.02, 0.24), (-0.2, -0.1, 0.16, 0.2), (0.2, 0.1, 0.16, 0.2), (0.66, 0.02, -0.06, 0.16), (-0.66, 0, -0.06, 0.16)], [COL['leaf'], COL['leaf3'], COL['leaf2']])
# the mushroom house: a bulging stem with a door and a window, a spotted cap
prop('house', 240)
sphere('house_stem', 0.62, (0, 0, 0.62), COL['wall'], scale=(1, 0.95, 1.1), seg=40)
sphere('house_base', 0.6, (0, 0, 0.1), COL['wall'], scale=(1.05, 1.0, 0.3), seg=32)
sphere('house_cap', 1.0, (0, 0, 1.28), COL['cap'], scale=(1.0, 1.0, 0.56), seg=48)
sphere('house_capedge', 0.98, (0, 0, 1.22), COL['cap'], scale=(1.0, 1.0, 0.18), seg=48)
for i, (x, y, z, r) in enumerate([(-0.5, -0.55, 1.55, 0.14), (0.3, -0.75, 1.5, 0.11), (0.0, -0.2, 1.8, 0.15), (-0.75, 0.3, 1.42, 0.12), (0.7, 0.35, 1.45, 0.12), (0.1, 0.8, 1.5, 0.11)]):
    sphere('house_spot%d' % i, r, (x, y, z), COL['spot'], scale=(1, 1, 0.45))
box('house_door', (0.3, 0.12, 0.52), (-0.1, -0.6, 0.28), COL['door'], bevel=0.06)
sphere('house_doortop', 0.15, (-0.1, -0.6, 0.54), COL['door'], scale=(1, 0.4, 1), seg=20)
sphere('house_window', 0.12, (0.33, -0.58, 0.68), COL['window'], scale=(1, 0.3, 1), seg=20)
cyl('house_frame', 0.145, 0.06, (0.33, -0.6, 0.68), COL['wood2'], rot=(math.pi / 2, 0, 0), verts=20)
sphere('house_knob', 0.03, (-0.0, -0.68, 0.32), COL['hay'], seg=10)
# the signpost: a chunky post on a stone, two boards
prop('signpost', 150)
sphere('sign_stone', 0.16, (0, 0, 0.04), COL['rock'], scale=(1.2, 1.1, 0.5))
cyl('sign_post', 0.06, 1.1, (0, 0, 0.55), COL['wood2'], verts=16)
box('sign_board1', (0.62, 0.07, 0.2), (-0.2, -0.03, 0.95), COL['wood'], bevel=0.03, rot=(0, 0, 0.0))
box('sign_board2', (0.5, 0.07, 0.18), (0.16, 0.04, 0.7), COL['wood'], bevel=0.03, rot=(0, 0, 0.0))
sphere('sign_tip1', 0.1, (-0.52, -0.03, 0.95), COL['wood'], scale=(1, 0.35, 1), seg=16)
sphere('sign_tip2', 0.09, (0.42, 0.04, 0.7), COL['wood'], scale=(1, 0.35, 1), seg=16)
# a fence piece: two posts and two rails, 1.2 m wide, pieces meet at the posts
prop('fence', 150)
for i, x in enumerate((-0.6, 0.6)):
    cyl('fence_post%d' % i, 0.07, 0.72, (x, 0, 0.36), COL['wood2'], verts=12); sphere('fence_top%d' % i, 0.08, (x, 0, 0.72), COL['wood2'], scale=(1, 1, 0.6), seg=12)
for i, z in enumerate((0.3, 0.56)): cyl('fence_rail%d' % i, 0.05, 1.34, (0, 0.0, z), COL['wood'], rot=(0, math.pi / 2, 0), verts=12)
# a rock
prop('rock', 120)
bpy.ops.mesh.primitive_ico_sphere_add(radius=0.42, subdivisions=3, location=(0, 0, 0.3)); o = bpy.context.object; o.name = 'rock_body'; o.scale = (1.2, 1.0, 0.75); o.data.materials.append(COL['rock']); smooth(o); link(o)
sphere('rock_small', 0.16, (0.5, -0.1, 0.12), COL['rock2'], scale=(1.2, 1, 0.8)); sphere('rock_moss', 0.2, (-0.15, -0.1, 0.56), COL['moss'], scale=(1.3, 1.1, 0.35))
# a stump with roots and a lighter top
prop('stump', 110)
cyl('stump_body', 0.3, 0.42, (0, 0, 0.21), COL['stump'], verts=24, r2=0.27)
cyl('stump_top', 0.24, 0.03, (0, 0, 0.43), COL['ring'], verts=24)
for i, a in enumerate((0.3, 1.9, 3.6, 5.0)): sphere('stump_root%d' % i, 0.1, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.04), COL['stump'], scale=(1.6, 1.1, 0.5), rot=(0, 0, a))
# a haystack
prop('haystack', 130)
sphere('hay_body', 0.52, (0, 0, 0.5), COL['hay'], scale=(1, 0.9, 0.95), seg=36); sphere('hay_top', 0.3, (0, 0, 0.9), COL['hay2'], scale=(1, 1, 0.7), seg=24)
for i, a in enumerate((0.5, 2.1, 3.9, 5.3)): sphere('hay_tuft%d' % i, 0.16, (math.cos(a) * 0.45, math.sin(a) * 0.4, 0.2 + i * 0.08), COL['hay2'], scale=(1.3, 1, 0.8))
# a cluster of three small mushrooms
prop('mushrooms', 90)
for i, (x, y, h, r) in enumerate([(-0.18, 0.05, 0.3, 0.17), (0.14, -0.06, 0.22, 0.13), (0.02, 0.18, 0.16, 0.1)]):
    cyl('mush_stem%d' % i, 0.06, h, (x, y, h / 2), COL['stem'], verts=14, r2=0.05); sphere('mush_cap%d' % i, r, (x, y, h), COL['cap2'], scale=(1, 1, 0.6), seg=24)
    sphere('mush_spot%d' % i, r * 0.3, (x - r * 0.4, y - r * 0.5, h + r * 0.35), COL['spot'], scale=(1, 1, 0.4), seg=12)

sc['props'] = json.dumps(PROPS)
os.makedirs(os.path.dirname(out), exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=out); print('saved', out, 'props:', ', '.join(PROPS))
