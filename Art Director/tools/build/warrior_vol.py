"""The Warrior as Blender volumes, in three variants (Perry, AD, 2026-10-31; Robin: "do another try from what you learned,
then present three variants"; "Colin's legs look like a diaper"). The construction is Colin, AD's (C:\\dev\\SG\\Art Director
\\out\\zite_hero\\zite_hero.py, made for Zite at Robin's request): each part balls swept along a path and voxel-merged into
one skin, bound to bones, legs by IK, four chosen tones in hard steps, the face projected onto the head. Changed here:
straight longer legs under the hips with the tunic ending at the belt (no flared hem below it, no lowered hips: the
diaper), the sword in the FAR hand so it stands clear ahead at three-quarter view (Colin's lesson), the near arm hanging
plainly, our upright stance with the feet apart, our big strike and hit, and three looks:
  A  soft: Colin's rounded hair cap with fringe locks, a plain blue tunic
  B  spiky: pointed locks swept back and up, a headband, a smaller head and longer legs
  C  cap: a leather cap with a red plume, short hair at the nape, shoulder pads
Character axes: faces -Y, +X is the side toward the camera, Z up, a metre tall; the rig turns him 50 degrees, facing left.
Writes <clip>_<nn>.png at 2x and meta.json in the studio's form (tools/pack.js takes it; tools/smear.js adds the trail).
    node tools/blender.js tools/build/warrior_vol.py -- <out dir> [stills|all|names] [--variant A|B|C]"""
import bpy, bmesh, math, os, sys, json
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else 'render'); WHICH = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else 'stills'
VAR = argv[argv.index('--variant') + 1] if '--variant' in argv else 'A'
PX_UNIT = 200; FW, FH = 2.6, 1.7; FEET_UP = 0.3; ELEV = 12.0; TURN = -50.0
INK = '#2b2320'
rad = math.radians
def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; vl = bpy.context.view_layer
CI = bpy.data.collections.new('Ink'); sc.collection.children.link(CI); CF = bpy.data.collections.new('Face'); sc.collection.children.link(CF)

# ---------------------------------------------------------------- materials: four chosen tones in hard steps
def toon(name, deep, dark, mid, light, cuts=(0.17, 0.42, 0.74)):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs[0].default_value = (0.8, 0.8, 0.8, 1)
    s = nt.nodes.new('ShaderNodeShaderToRGB'); r = nt.nodes.new('ShaderNodeValToRGB'); e = nt.nodes.new('ShaderNodeEmission'); cr = r.color_ramp; cr.interpolation = 'LINEAR'
    T = [deep, dark, mid, light]; stops = [(0.0, 0)]
    for i, c in enumerate(cuts): stops += [(c, i), (c + 0.018, i + 1)]
    stops.append((1.0, 3))
    while len(cr.elements) < len(stops): cr.elements.new(0.5)
    for el, (p, i) in zip(cr.elements, stops): el.position = p; el.color = srgb(T[i]) + (1,)
    nt.links.new(d.outputs[0], s.inputs[0]); nt.links.new(s.outputs[0], r.inputs[0]); nt.links.new(r.outputs[0], e.inputs[0]); nt.links.new(e.outputs[0], o.inputs[0]); return m
def flat(name, h):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); o = nt.nodes.new('ShaderNodeOutputMaterial'); e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = srgb(h) + (1,); nt.links.new(e.outputs[0], o.inputs[0]); return m
SKIN = toon('skin', '#b97f5c', '#dfa77c', '#f6cfa4', '#ffe4c6', cuts=(0.1, 0.3, 0.62))
HAIR = toon('hair', '#8a3413', '#c5531f', '#ec7a36', '#ffa55c', cuts=(0.16, 0.38, 0.72))
TUNIC = toon('tunic', '#1c3f78', '#2a5aa8', '#3f7fd8', '#6ea4ee')
CUFF = toon('cuff', '#16305e', '#20468a', '#2d62b4', '#4c86d8')
PANTS = toon('pants', '#4a3024', '#6b4a38', '#8c684e', '#aa8668')
BOOT = toon('boot', '#2c1a10', '#54311c', '#7a4a2a', '#a06a40')
LEATHER = toon('leather', '#4c2d14', '#744b26', '#9c6c38', '#c29254')
STEEL = toon('steel', '#9aa7b5', '#bcc8d4', '#e0e7ee', '#fbfdff', cuts=(0.03, 0.12, 0.4))
GOLD = toon('gold', '#7c5518', '#9c6f22', '#d9a84a', '#f6d87a')
RED = toon('red', '#6e1a1c', '#a8282c', '#d84a44', '#f08a7c')
BAND = toon('band', '#7a2010', '#b43a22', '#e05a3a', '#f29a7a')
F = {k: flat('f_' + k, v) for k, v in dict(white='#fffaf2', iris='#3b6fb0', irisd='#223f73', pupil='#1b1820', ink=INK, brow='#7e3a16', mouth='#7a2f2c', tongue='#d8695c', blush='#ffb3a0', lid='#e9b58c').items()}

# ---------------------------------------------------------------- volumes
def obj(name, bm, mat, coll=CI, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat); o = bpy.data.objects.new(name, me); coll.objects.link(o)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    return o
def add_ball(bm, c, r, s=(1, 1, 1)):
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=14, radius=1.0, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((r * s[0], r * s[1], r * s[2], 1)))
def add_path(bm, pts, rs, s=(1, 1, 1)):
    pts = [Vector(p) for p in pts]
    for i in range(len(pts) - 1):
        L = (pts[i + 1] - pts[i]).length; n = max(2, int(L / (min(rs[i], rs[i + 1]) * 0.6 + 0.004)))
        for k in range(n + 1):
            t = k / n; add_ball(bm, pts[i].lerp(pts[i + 1], t), max(0.003, rs[i] + (rs[i + 1] - rs[i]) * t), s)
def curve(ctrl, n=4):
    P = [Vector(p) for p in ctrl]; P = [P[0]] + P + [P[-1]]; o = []
    for i in range(1, len(P) - 2):
        for k in range(n):
            t = k / n; a, b, c, d = P[i - 1], P[i], P[i + 1], P[i + 2]
            o.append(0.5 * ((2 * b) + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t))
    o.append(P[-2]); return o
def lock(bm, ctrl, r0, tip=0.004, belly=0.3):
    pts = curve(ctrl); N = len(pts) - 1; rs = []
    for i in range(N + 1):
        t = i / N; rs.append(tip + (r0 - tip) * (1 - t) ** 0.8 * min(1.0, 0.72 + t / belly * 0.28))
    add_path(bm, pts, rs)
def merged(name, fill, mat, voxel=0.0065, smooth=8, fac=0.6):
    bm = bmesh.new(); fill(bm); o = obj(name, bm, mat)
    bpy.ops.object.select_all(action='DESELECT'); vl.objects.active = o; o.select_set(True)
    r = o.modifiers.new('r', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = voxel; r.use_smooth_shade = True; bpy.ops.object.modifier_apply(modifier='r')
    if smooth: s = o.modifiers.new('s', 'SMOOTH'); s.factor = fac; s.iterations = smooth; bpy.ops.object.modifier_apply(modifier='s')
    return o
def box(bm, x0, x1, y0, y1, z0, z1):
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) @ Matrix.Diagonal((x1 - x0, y1 - y0, z1 - z0, 1)))

# ---------------------------------------------------------------- proportions per variant
HEADR = {'A': 0.232, 'B': 0.215, 'C': 0.225}[VAR]; LEG = {'A': 0.20, 'B': 0.225, 'C': 0.205}[VAR]
HIPZ = 0.06 + LEG; HIP = Vector((0, 0, HIPZ + 0.01)); CHEST = Vector((0, 0, HIPZ + 0.085)); NECKZ = HIPZ + 0.2; HEADP = Vector((0, 0, NECKZ + 0.015)); HEAD = Vector((0, 0, NECKZ + 0.03 + HEADR))
SH = {'N': Vector((-0.128, 0, NECKZ - 0.04)), 'F': Vector((0.128, 0, NECKZ - 0.04))}; EL = {s: SH[s] + Vector((0.012 * (-1 if s == 'N' else 1), 0, -0.088)) for s in 'NF'}; WR = {s: EL[s] + Vector((0.004 * (-1 if s == 'N' else 1), 0, -0.08)) for s in 'NF'}
HJ = {'N': Vector((-0.062, 0, HIPZ)), 'F': Vector((0.062, 0, HIPZ))}; KN = {s: HJ[s] + Vector((0.006 * (-1 if s == 'N' else 1), -0.006, -LEG * 0.5)) for s in 'NF'}; AN = {s: HJ[s] + Vector((0.01 * (-1 if s == 'N' else 1), 0, -LEG + 0.06)) for s in 'NF'}
L1 = {s: (KN[s] - HJ[s]).length for s in 'NF'}; L2 = {s: (AN[s] - KN[s]).length for s in 'NF'}
HZ = HEAD.z

# ---------------------------------------------------------------- the figure
def fill_head(b):
    add_ball(b, HEAD, HEADR, (1.0, 0.96, 0.96)); add_ball(b, (0, -0.016, HZ - 0.075), HEADR * 0.74, (1.06, 0.92, 0.8))      # the skull and a soft wide jaw
    add_ball(b, (0, -HEADR * 0.96, HZ - 0.062), 0.017, (1.0, 0.9, 0.8))                                                      # the small nose
    add_ball(b, (HEADR, 0.012, HZ - 0.045), 0.04, (0.55, 0.85, 1.1)); add_ball(b, (-HEADR, 0.012, HZ - 0.045), 0.04, (0.55, 0.85, 1.1))   # the ears
def fill_hair_A(b):                                                                      # Colin's cap: set back so the forehead shows, five fringe locks curling to the near side, a lock before each ear
    add_ball(b, (0, 0.04, HZ + 0.065), HEADR * 1.08, (1.02, 0.98, 0.9))
    for x, y0, tipx, tipz, r in [(-0.15, -0.14, -0.19, HZ + 0.025, 0.062), (-0.07, -0.17, -0.09, HZ + 0.045, 0.064), (0.02, -0.18, 0.015, HZ + 0.03, 0.07), (0.1, -0.165, 0.125, HZ + 0.05, 0.062), (0.175, -0.11, 0.215, HZ - 0.01, 0.06)]:
        lock(b, [(x * 0.65, 0.0, HZ + 0.255), (x, y0, HZ + 0.205), (x * 1.04, y0 - 0.035, HZ + 0.12), (tipx, y0 - 0.025, tipz)], r)
    lock(b, [(0.2, 0.0, HZ + 0.13), (0.247, -0.015, HZ + 0.04), (0.255, -0.035, HZ - 0.05), (0.235, -0.06, HZ - 0.12)], 0.052)
    lock(b, [(-0.2, 0.0, HZ + 0.13), (-0.245, -0.02, HZ + 0.04), (-0.25, -0.04, HZ - 0.05), (-0.225, -0.06, HZ - 0.11)], 0.05)
def fill_hair_back_A(b):
    for x, z, ty, tz, r in [(0.17, HZ + 0.14, 0.31, HZ + 0.17, 0.07), (0.18, HZ + 0.01, 0.33, HZ + 0.02, 0.075), (0.15, HZ - 0.09, 0.27, HZ - 0.16, 0.065), (0.03, HZ + 0.19, 0.29, HZ + 0.26, 0.07), (-0.17, HZ + 0.09, 0.3, HZ + 0.13, 0.07)]:
        lock(b, [(x, 0.08, z), (x * 1.02, (0.08 + ty) * 0.55, z + (tz - z) * 0.3), (x * 0.96, ty, tz)], r, belly=0.2)
def fill_hair_B(b):                                                                      # pointed locks swept back and up from the crown, three down over the brow
    add_ball(b, (0, 0.03, HZ + 0.05), HEADR * 1.06, (1.0, 0.98, 0.92))
    for x, y, z, tx, ty, tz, r in [(-0.1, 0.02, HZ + 0.18, -0.17, 0.1, HZ + 0.33, 0.07), (0.02, 0.0, HZ + 0.2, 0.05, 0.16, HZ + 0.36, 0.075), (0.14, 0.02, HZ + 0.16, 0.26, 0.17, HZ + 0.29, 0.068), (0.2, 0.06, HZ + 0.06, 0.36, 0.2, HZ + 0.14, 0.066), (0.19, 0.08, HZ - 0.06, 0.34, 0.24, HZ - 0.03, 0.06), (-0.18, 0.02, HZ + 0.1, -0.3, 0.12, HZ + 0.22, 0.064)]:
        lock(b, [(x, y, z), ((x + tx) / 2, (y + ty) / 2 - 0.02, (z + tz) / 2 + 0.03), (tx, ty, tz)], r, belly=0.25)
    for x, tipx, tipz, r in [(-0.12, -0.16, HZ + 0.02, 0.06), (0.0, -0.02, HZ + 0.0, 0.064), (0.12, 0.15, HZ + 0.03, 0.06)]:
        lock(b, [(x * 0.6, -0.02, HZ + 0.24), (x, -0.17, HZ + 0.18), (tipx, -0.2, tipz)], r)
def fill_hair_C(b):                                                                      # short locks at the nape and temples under the cap
    for x, z, ty, tz, r in [(0.2, HZ - 0.02, 0.3, HZ - 0.1, 0.055), (0.1, HZ - 0.02, 0.26, HZ - 0.14, 0.055), (-0.15, HZ - 0.0, 0.26, HZ - 0.1, 0.052), (0.235, HZ - 0.06, 0.2, HZ - 0.15, 0.045)]:
        lock(b, [(x, 0.1, z), (x * 0.95, ty, tz)], r, belly=0.3)
    for x, tipx, tipz, r in [(-0.1, -0.15, HZ + 0.06, 0.05), (0.08, 0.12, HZ + 0.07, 0.05)]:
        lock(b, [(x, -0.14, HZ + 0.16), (tipx, -0.2, tipz)], r)
def fill_cap_C(b):                                                                       # a leather cap down to the brow, a rolled brim
    add_ball(b, (0, 0.02, HZ + 0.07), HEADR * 1.1, (1.0, 1.0, 0.9))
    bmesh.ops.bisect_plane(b, geom=b.verts[:] + b.edges[:] + b.faces[:], plane_co=Vector((0, 0, HZ + 0.035)), plane_no=Vector((0, 0, -1)), clear_inner=True)
    add_path(b, curve([(-0.25, 0.02, HZ + 0.035), (0, -0.245, HZ + 0.04), (0.25, 0.02, HZ + 0.035), (0, 0.26, HZ + 0.04), (-0.25, 0.02, HZ + 0.035)], n=5), [0.028] * 21, (1, 1, 1))
def fill_rim_C(b): add_path(b, curve([(-0.25, 0.02, HZ + 0.035), (0, -0.245, HZ + 0.04), (0.25, 0.02, HZ + 0.035), (0, 0.26, HZ + 0.04), (-0.25, 0.02, HZ + 0.035)], n=5), [0.03] * 21, (1, 1, 1))
def fill_plume_C(b): add_ball(b, (0.02, 0.05, HZ + 0.27), 0.05); lock(b, [(0.02, 0.05, HZ + 0.26), (0.1, 0.2, HZ + 0.4), (0.18, 0.38, HZ + 0.36), (0.24, 0.5, HZ + 0.26)], 0.055, belly=0.35)
def fill_band_B(b): add_path(b, curve([(-0.23, 0.0, HZ + 0.08), (0, -0.235, HZ + 0.09), (0.23, 0.0, HZ + 0.08), (0, 0.25, HZ + 0.1), (-0.23, 0.0, HZ + 0.08)], n=5), [0.022] * 21, (1, 1, 1))
def fill_torso(b):
    add_ball(b, (0, 0.0, CHEST.z + 0.045), 0.113, (1.08, 0.74, 0.8)); add_ball(b, (0, 0.0, HIPZ + 0.045), 0.108, (1.0, 0.74, 0.9))   # the chest and the waist; the tunic ends at the belt, nothing flares below it
def fill_neck(b): add_path(b, [(0, 0, NECKZ - 0.03), (0, -0.002, NECKZ + 0.045)], [0.05, 0.05], (1.0, 0.92, 1.0))
def fill_collar(b): add_path(b, curve([(-0.058, 0.01, NECKZ + 0.008), (0, -0.056, NECKZ - 0.01), (0.058, 0.01, NECKZ + 0.008), (0, 0.055, NECKZ + 0.015), (-0.058, 0.01, NECKZ + 0.008)], n=5), [0.02] * 21, (1, 1, 1))
def fill_belt(b): add_ball(b, (0, 0, HIPZ + 0.012), 0.112, (1.03, 0.77, 0.17))
def fill_buckle(b): box(b, 0.0, 0.07, -0.104, -0.078, HIPZ - 0.012, HIPZ + 0.036)
def fill_pad(s):
    k = -1 if s == 'N' else 1
    def f(b): add_ball(b, SH[s] + Vector((0.005 * k, 0, 0.012)), 0.054 if VAR != 'C' else 0.064, (1.0, 1.05, 0.6))
    return f
def fill_sleeve(s):
    def f(b): add_path(b, [SH[s], EL[s] + Vector((0, 0, 0.005))], [0.048, 0.044])
    return f
def fill_fore(s):
    def f(b): add_path(b, [EL[s] + Vector((0, 0, 0.012)), WR[s]], [0.036, 0.034])
    return f
def fill_bracer(s):
    def f(b): add_path(b, [EL[s] + Vector((0, 0, -0.026)), WR[s] + Vector((0, 0, 0.012))], [0.04, 0.042])
    return f
def fill_fist(s):
    def f(b): add_ball(b, WR[s] + Vector((0, 0, -0.032)), 0.046, (0.95, 1.05, 0.95))
    return f
def fingers(s):
    c = WR[s] + Vector((0, 0, -0.032)); bm = bmesh.new()
    for i, dy in enumerate((-0.032, -0.011, 0.011, 0.031)): add_path(bm, [c + Vector((0.038, dy, 0.022)), c + Vector((0.05, dy, -0.012)), c + Vector((0.03, dy, -0.036))], [0.0125, 0.0135, 0.012])
    return bm
def fill_leg(s):                                                                         # a straight trouser leg from the hip joint to the ankle, one width, nothing bulging at the top
    def f(b): add_path(b, [HJ[s] + Vector((0, 0, 0.03)), KN[s], AN[s] + Vector((0, 0, 0.02))], [0.058, 0.052, 0.048], (1, 1.03, 1))
    return f
def fill_boot(s):
    def f(b):
        a = AN[s]; add_path(b, [a + Vector((0, 0.008, 0.012)), a + Vector((0, 0.006, -0.03))], [0.056, 0.058])
        add_path(b, [a + Vector((0, 0.022, -0.043)), a + Vector((0, -0.04, -0.047)), a + Vector((0, -0.098, -0.044))], [0.038, 0.044, 0.04], (1.06, 1, 0.9))   # the foot, a toe forward, a flat sole
        bmesh.ops.bisect_plane(b, geom=b.verts[:] + b.edges[:] + b.faces[:], plane_co=Vector((0, 0, 0.002)), plane_no=Vector((0, 0, 1)), clear_inner=True)
    return f
def fill_cuff(s):
    def f(b): add_path(b, [AN[s] + Vector((0, 0.006, 0.03)), AN[s] + Vector((0, 0.006, 0.043))], [0.062, 0.062], (1, 1, 1))
    return f
# the sword: in the FAR fist, the hilt through it, the blade forward (-Y) while the arm hangs
G = WR['F'] + Vector((0.004, 0, -0.032))
def fill_blade(bm):
    y0, y1, y2 = -0.078, -0.43, -0.5; w = 0.037; t = 0.012
    cols = [(y0, w), (y1, w * 0.92), (y2, 0.0)]; ring = []
    for y, ww in cols: ring.append([bm.verts.new(G + Vector(v)) for v in ((0, y, ww), (t, y, 0), (0, y, -ww), (-t, y, 0))])
    for a, b in zip(ring, ring[1:]):
        for i in range(4): bm.faces.new((a[i], a[(i + 1) % 4], b[(i + 1) % 4], b[i]))
    bm.faces.new(ring[0]); bm.faces.new(ring[-1][::-1]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
def fill_guard(b): add_path(b, [G + Vector((0, -0.068, 0.072)), G + Vector((0, -0.068, 0)), G + Vector((0, -0.068, -0.072))], [0.015, 0.018, 0.015])
def fill_grip(b): add_path(b, [G + Vector((0, -0.068, 0)), G + Vector((0, 0.055, 0))], [0.017, 0.017])
def fill_pommel(b): add_ball(b, G + Vector((0, 0.07, 0)), 0.024)

# ---------------------------------------------------------------- make and bind
PARTS = {}
def rigid(o, bone): PARTS[o] = ('rigid', bone); return o
def chain(o, bones, joint, axis, blend=0.03): PARTS[o] = ('chain', bones, joint, axis, blend); return o
head = rigid(merged('head', fill_head, SKIN, voxel=0.005), 'head')
if VAR == 'A': rigid(merged('hair', fill_hair_A, HAIR, voxel=0.0045, smooth=4, fac=0.5), 'head'); rigid(merged('hair_back', fill_hair_back_A, HAIR, voxel=0.0045, smooth=4, fac=0.5), 'hair')
if VAR == 'B': rigid(merged('hair', fill_hair_B, HAIR, voxel=0.0045, smooth=4, fac=0.5), 'hair'); rigid(merged('band', fill_band_B, BAND, voxel=0.004, smooth=3), 'head')
if VAR == 'C': rigid(merged('hair', fill_hair_C, HAIR, voxel=0.0045, smooth=4, fac=0.5), 'hair'); rigid(merged('cap', fill_cap_C, STEEL, voxel=0.0045, smooth=4, fac=0.5), 'head'); rigid(merged('plume', fill_plume_C, RED, voxel=0.0045, smooth=4, fac=0.5), 'hair'); rigid(merged('rim', fill_rim_C, LEATHER, voxel=0.0045, smooth=3), 'head')
rigid(merged('neck', fill_neck, SKIN), 'chest')
chain(merged('torso', fill_torso, TUNIC), ('hips', 'chest'), Vector((0, 0, HIPZ + 0.06)), Vector((0, 0, 1)), 0.035)
rigid(merged('collar', fill_collar, CUFF, voxel=0.005, smooth=3), 'chest')
rigid(merged('belt', fill_belt, LEATHER, voxel=0.005, smooth=3), 'hips')
rigid(obj('buckle', (lambda b: (fill_buckle(b), b)[1])(bmesh.new()), GOLD, smooth=False), 'hips')
for s in 'NF':
    A, B, H = 'armU' + s, 'armL' + s, 'hand' + s
    rigid(merged('pad' + s, fill_pad(s), (LEATHER if VAR == 'C' else (TUNIC if s == 'F' else CUFF)), voxel=0.005), A)
    rigid(merged('sleeve' + s, fill_sleeve(s), TUNIC if s == 'F' else CUFF), A)
    rigid(merged('fore' + s, fill_fore(s), SKIN), B); rigid(merged('bracer' + s, fill_bracer(s), LEATHER), B)
    rigid(merged('fist' + s, fill_fist(s), SKIN, voxel=0.005), H); rigid(obj('fing' + s, fingers(s), SKIN), H)
    chain(merged('leg' + s, fill_leg(s), PANTS), ('legU' + s, 'legL' + s), KN[s], (AN[s] - HJ[s]).normalized(), 0.03)
    rigid(merged('boot' + s, fill_boot(s), BOOT, voxel=0.0055, smooth=4), 'foot' + s); rigid(merged('cuffb' + s, fill_cuff(s), LEATHER, voxel=0.005, smooth=3), 'foot' + s)
bm = bmesh.new(); fill_blade(bm); blade = obj('blade', bm, STEEL, smooth=False); rigid(blade, 'sword')
rigid(merged('guard', fill_guard, GOLD, voxel=0.0045), 'sword'); rigid(merged('grip', fill_grip, LEATHER, voxel=0.0045), 'sword'); rigid(merged('pommel', fill_pommel, GOLD, voxel=0.0045), 'sword')

# the face, projected along +Y onto the head from the front
dg = bpy.context.evaluated_depsgraph_get(); tree = BVHTree.FromObject(head, dg)
def on_head(x, z, lift):
    hit = tree.ray_cast(Vector((x, -2, z)), Vector((0, 1, 0)))
    if hit[0] is None:
        loc, n, _, _ = tree.find_nearest(Vector((x, -0.22, z))); return loc + Vector((0, -lift, 0))
    return hit[0] + Vector((0, -lift, 0))
FACES = {}
def poly(mood, name, mk, pts, lift):
    b = bmesh.new(); cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts); rings = []
    for k in (1.0, 0.72, 0.4): rings.append([b.verts.new(on_head(cx + (p[0] - cx) * k, cz + (p[1] - cz) * k, lift)) for p in pts])
    c = b.verts.new(on_head(cx, cz, lift)); n = len(pts)
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(n): b.faces.new((r0[i], r0[(i + 1) % n], r1[(i + 1) % n], r1[i]))
    for i in range(n): b.faces.new((rings[-1][i], rings[-1][(i + 1) % n], c))
    o = obj('%s_%s' % (mood, name), b, F[mk], CF, smooth=False); PARTS[o] = ('rigid', 'head'); FACES.setdefault(mood, []).append(o); return o
def oval(cx, cz, rx, rz, n=18, rot=0.0):
    c, s = math.cos(rot), math.sin(rot); return [(cx + c * rx * math.cos(2 * math.pi * i / n) - s * rz * math.sin(2 * math.pi * i / n), cz + s * rx * math.cos(2 * math.pi * i / n) + c * rz * math.sin(2 * math.pi * i / n)) for i in range(n)]
def stroke(mood, name, mk, pts, w0, w1, lift):
    n = len(pts); up = []; dn = []
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]; c = pts[min(n - 1, i + 1)]; dx, dz = c[0] - a[0], c[1] - a[1]; L = math.hypot(dx, dz) or 1; w = w0 * math.sin(math.pi * (i + 0.7) / (n + 0.4)) ** 0.6 + w1
        up.append((p[0] - dz / L * w, p[1] + dx / L * w)); dn.append((p[0] + dz / L * w, p[1] - dx / L * w))
    b = bmesh.new(); U = [b.verts.new(on_head(*q, lift)) for q in up]; D = [b.verts.new(on_head(*q, lift)) for q in dn]
    for i in range(n - 1): b.faces.new((U[i], D[i], D[i + 1], U[i + 1]))
    o = obj('%s_%s' % (mood, name), b, F[mk], CF, smooth=False); PARTS[o] = ('rigid', 'head'); FACES.setdefault(mood, []).append(o); return o
def arc(x0, x1, z, h, n=9, skew=0.0): return [(x0 + (x1 - x0) * i / (n - 1), z + h * math.sin(math.pi * i / (n - 1)) + skew * (i / (n - 1) - 0.5)) for i in range(n)]
EX, EZ = 0.1 * HEADR / 0.232, HZ - 0.042; ERX, ERZ = 0.06 * HEADR / 0.232, 0.08 * HEADR / 0.232; MZ = HZ - 0.126
def cheeks(m):
    for s in (-1, 1): poly(m, 'blush%d' % s, 'blush', oval(s * 0.158, HZ - 0.11, 0.035, 0.02), 0.002)
def eye(m, s, look=-0.006, wide=1.0, small=1.0):
    x = s * EX; rx, rz = ERX * wide, ERZ * wide; poly(m, 'white%d' % s, 'white', oval(x, EZ, rx, rz, 22), 0.002)
    ix = x + look; poly(m, 'iris%d' % s, 'iris', oval(ix, EZ - 0.006 * small, rx * 0.8 * small, rz * 0.82 * small), 0.004); poly(m, 'irisd%d' % s, 'irisd', oval(ix, EZ + 0.016 * small, rx * 0.74 * small, rz * 0.5 * small), 0.005); poly(m, 'pupil%d' % s, 'pupil', oval(ix, EZ - 0.002, rx * 0.45 * small, rz * 0.5 * small), 0.006)
    poly(m, 'catch%d' % s, 'white', oval(ix + 0.014, EZ + 0.024 * small, 0.0135 * small, 0.0165 * small), 0.008); poly(m, 'catchb%d' % s, 'white', oval(ix - 0.014, EZ - 0.022 * small, 0.0065 * small, 0.0075 * small), 0.008)
    stroke(m, 'lash%d' % s, 'ink', arc(x - rx * 1.06, x + rx * 1.06, EZ + rz * 0.8, rz * 0.3), 0.0085, 0.002, 0.009)
def brows(m, up=0.0, tilt=0.0):
    for s in (-1, 1): stroke(m, 'brow%d' % s, 'brow', [(s * (0.045 + 0.018 * i), EZ + 0.099 + up + tilt * (i - 2.5) * 0.008 + 0.013 * math.sin(math.pi * i / 5)) for i in range(6)], 0.0085, 0.002, 0.004)
def mouth_smile(m): stroke(m, 'mouth', 'mouth', [(-0.024 + 0.008 * i, MZ - 0.011 * math.sin(math.pi * i / 6)) for i in range(7)], 0.0045, 0.002, 0.003)
eye('open', -1); eye('open', 1); brows('open'); mouth_smile('open'); cheeks('open')
for s in (-1, 1): stroke('blink', 'shut%d' % s, 'ink', arc(s * EX - ERX, s * EX + ERX, EZ - 0.012, -0.018), 0.007, 0.002, 0.004)
brows('blink'); mouth_smile('blink'); cheeks('blink')
eye('grr', -1, wide=0.86); eye('grr', 1, wide=0.86)
for s in (-1, 1):
    poly('grr', 'lid%d' % s, 'lid', [(s * EX - 0.066, EZ + 0.066), (s * EX + 0.066, EZ + 0.066), (s * EX + 0.066, EZ + 0.022 + s * -0.012), (s * EX - 0.066, EZ + 0.022 + s * 0.012)], 0.0095)
    stroke('grr', 'browg%d' % s, 'brow', [(s * (0.03 + 0.024 * i), EZ + 0.037 + 0.012 * i) for i in range(6)], 0.012, 0.004, 0.01)
poly('grr', 'mouth', 'mouth', [(-0.034, MZ + 0.011), (0.034, MZ + 0.011), (0.028, MZ - 0.016), (-0.028, MZ - 0.016)], 0.003); poly('grr', 'teeth', 'white', [(-0.03, MZ + 0.008), (0.03, MZ + 0.008), (0.027, MZ - 0.005), (-0.027, MZ - 0.005)], 0.004); cheeks('grr')
eye('shock', -1, wide=1.14, small=0.55, look=0.0); eye('shock', 1, wide=1.14, small=0.55, look=0.0); brows('shock', up=0.03, tilt=-1.0)
poly('shock', 'mouth', 'mouth', oval(0, MZ - 0.012, 0.038, 0.042), 0.003); poly('shock', 'tongue', 'tongue', oval(0, MZ - 0.036, 0.026, 0.018), 0.004); cheeks('shock')
for s in (-1, 1):
    stroke('hurt', 'sa%d' % s, 'ink', [(s * (EX - 0.05 + 0.02 * i), EZ - 0.018 + 0.016 * i) for i in range(6)], 0.0065, 0.002, 0.004); stroke('hurt', 'sb%d' % s, 'ink', [(s * (EX - 0.05 + 0.02 * i), EZ + 0.022 - 0.008 * i) for i in range(6)], 0.0065, 0.002, 0.004)
brows('hurt', up=0.01, tilt=-1.0); poly('hurt', 'mouth', 'mouth', oval(0, MZ - 0.006, 0.026, 0.02), 0.003); cheeks('hurt')
for s in (-1, 1): stroke('dead', 'shut%d' % s, 'ink', arc(s * EX - ERX, s * EX + ERX, EZ + 0.004, 0.02), 0.007, 0.002, 0.004)
stroke('dead', 'mouth', 'mouth', [(-0.02 + 0.008 * i, MZ - 0.006 + 0.007 * math.sin(math.pi * i / 5)) for i in range(6)], 0.004, 0.002, 0.003); cheeks('dead')

# ---------------------------------------------------------------- the rig
PIV = {'hips': HIP, 'chest': CHEST, 'head': HEADP, 'hair': HEAD + Vector((0, 0.1, 0.05)), 'sword': G}
for s in 'NF': PIV.update({'armU' + s: SH[s], 'armL' + s: EL[s], 'hand' + s: WR[s], 'legU' + s: HJ[s], 'legL' + s: KN[s], 'foot' + s: AN[s]})
ad = bpy.data.armatures.new('rig'); rig = bpy.data.objects.new('rig', ad); sc.collection.objects.link(rig); vl.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
for n, p in PIV.items(): e = ad.edit_bones.new(n); e.head = p; e.tail = p + Vector((0, 0, 0.05)); e.use_deform = True
bpy.ops.object.mode_set(mode='OBJECT')
for o, rule in PARTS.items():
    m = o.modifiers.new('arm', 'ARMATURE'); m.object = rig
    if rule[0] == 'rigid':
        vg = o.vertex_groups.new(name=rule[1]); vg.add([v.index for v in o.data.vertices], 1.0, 'REPLACE')
    else:
        _, bones, joint, axis, blend = rule; a = o.vertex_groups.new(name=bones[0]); b = o.vertex_groups.new(name=bones[1]); up = Vector(axis)
        for v in o.data.vertices:
            t = (v.co - joint).dot(up) / blend; w = max(0.0, min(1.0, 0.5 + 0.5 * t)); w = w * w * (3 - 2 * w)
            hi, lo = (bones[1], bones[0]) if up.z > 0 else (bones[0], bones[1])
            o.vertex_groups[hi].add([v.index], w, 'REPLACE'); o.vertex_groups[lo].add([v.index], 1 - w, 'REPLACE')
rig.rotation_euler = (0, 0, rad(TURN))
for o in PARTS: o.parent = rig
def rot(rx=0, ry=0, rz=0): return Matrix.Rotation(rad(rz), 4, 'Z') @ Matrix.Rotation(rad(ry), 4, 'Y') @ Matrix.Rotation(rad(rx), 4, 'X')
def about(p, R): return Matrix.Translation(p) @ R @ Matrix.Translation(-p)
def pose(P):
    """P: world (rx, ry, rz) and x, y, z move the whole body about the feet; hip (y, z, rx, ry, rz); chest, head, hair (rx, ry, rz);
    armN / armF (forward, out, bend, wrist rx, wrist rz); footN / footF (x, y, z, pitch); sword: None in the far hand, else a matrix"""
    W = Matrix.Translation((P.get('x', 0), P.get('y', 0), P.get('z', 0))) @ rot(*P.get('world', (0, 0, 0)))
    hy, hz, hrx, hry, hrz = P.get('hip', (0, 0, 0, 0, 0)); Mh = Matrix.Translation((0, hy, hz)) @ about(HIP, rot(hrx, hry, hrz))
    Mc = Mh @ about(CHEST, rot(*P.get('chest', (0, 0, 0)))); Mhead = Mc @ about(HEADP, rot(*P.get('head', (0, 0, 0)))); Mhair = Mhead @ about(PIV['hair'], rot(*P.get('hair', (0, 0, 0))))
    M = {'hips': Mh, 'chest': Mc, 'head': Mhead, 'hair': Mhair}
    for s in 'NF':
        k = -1 if s == 'N' else 1; f, out, bend, wrx, wrz = P['arm' + s]
        Mu = Mc @ about(SH[s], rot(-f, -k * out, 0)); Ml = Mu @ about(EL[s], rot(-bend, 0, 0)); Mw = Ml @ about(WR[s], rot(wrx, 0, wrz)); M.update({'armU' + s: Mu, 'armL' + s: Ml, 'hand' + s: Mw})
        fx, fy, fz, fp = P['foot' + s]; ank = AN[s] + Vector((fx, fy, fz)); hipj = Mh @ HJ[s]; d = ank - hipj; L = d.length; a, b = L1[s], L2[s]; L = min(L, a + b - 1e-4); dn = d.normalized()
        ca = (a * a + L * L - b * b) / (2 * a * L); sa = math.sqrt(max(0.0, 1 - ca * ca)); side = Vector((0, -1, 0)); side = (side - dn * side.dot(dn)).normalized(); kn = hipj + dn * (a * ca) + side * (a * sa)
        r1 = (KN[s] - HJ[s]).normalized().rotation_difference((kn - hipj).normalized()).to_matrix().to_4x4(); r2 = (AN[s] - KN[s]).normalized().rotation_difference((hipj + dn * L - kn).normalized()).to_matrix().to_4x4()
        M['legU' + s] = Matrix.Translation(hipj - HJ[s]) @ about(HJ[s], r1); M['legL' + s] = Matrix.Translation(kn - KN[s]) @ about(KN[s], r2); M['foot' + s] = Matrix.Translation(hipj + dn * L - AN[s]) @ about(AN[s], rot(fp, 0, 0))
    M['sword'] = P['sword'] if P.get('sword') is not None else M['handF']
    for n, m in M.items():
        pb = rig.pose.bones[n]; pb.matrix = ((m if (n == 'sword' and P.get('sword') is not None) else W @ m)) @ ad.bones[n].matrix_local
    bpy.context.view_layer.update(); return W, M
def face(m):
    for k, L in FACES.items():
        for o in L: o.hide_render = (k != m); o.hide_viewport = (k != m)

# ---------------------------------------------------------------- the clips: upright, feet apart, the sword in the far hand held up and forward; our strike and hit
# arm: (forward, out, bend, wrist rx, wrist rz). The far arm's rest: forward a little, bent so the fist sits before the belt, the wrist turned so the blade stands up and forward.
REST = dict(hip=(0, 0, 3, 0, 4), chest=(2, 0, 4), head=(-4, 0, 12), hair=(0, 0, 0), armN=(-6, 10, 14, 0, 0), armF=(40, 50, 60, 72, 0), footN=(-0.012, -0.055, 0, 0), footF=(0.012, 0.045, 0, 0))
def P(**k): d = dict(REST); d.update(k); return d
CLIPS = {
 'stand': [(P(), 'open', 1),
           (P(hip=(0, 0.006, 3, 0, 4), chest=(3.5, 0, 6), head=(-3, 0, 10), hair=(-2, 0, 0), armN=(-5, 11, 15, 0, 0), armF=(41, 50, 60, 72, 0)), 'open', 1),
           (P(hip=(0, 0.012, 3, 0, 4), chest=(5, 0, 7), head=(-2, 0, 9), hair=(-4, 0, 0), armN=(-4, 12, 16, 0, 0), armF=(42, 50, 60, 72, 0)), 'blink', 1),
           (P(hip=(0, 0.006, 3, 0, 4), chest=(3.5, 0, 6), head=(-3, 0, 10), hair=(-2, 0, 0), armN=(-5, 11, 15, 0, 0), armF=(41, 50, 60, 72, 0)), 'open', 1)],
}
def walk(i):                                                                      # the Mixamo guide's numbers: thighs about 30 degrees each way, the hips lowest at contact, highest at the passing step
    t = i / 6 * 2 * math.pi; yN = -0.1 * math.cos(t); liftN = max(0, math.sin(t)) * 0.06; yF = 0.1 * math.cos(t); liftF = max(0, -math.sin(t)) * 0.06
    bob = -0.02 + 0.02 * abs(math.sin(t)); sw = math.cos(t)
    return P(hip=(0, bob, 6, 0, -4 + 6 * sw), chest=(5, 2 * sw, 8 - 6 * sw), head=(-6, 0, 8), hair=(-4 + 6 * abs(math.sin(t)), 0, 0), armN=(-6 - 26 * sw, 10, 20, 0, 0), armF=(40 + 10 * sw, 50, 60, 72, 0),
             footN=(-0.01, yN, liftN, -18 * (liftN > 0) * math.sin(t) + 10 * (yN < -0.08)), footF=(0.01, yF, liftF, -18 * (liftF > 0) * -math.sin(t) + 10 * (yF < -0.08))), 'open', 1
CLIPS['move'] = [walk(i) for i in range(6)]
# the overhead cut from the far hand: pulled back and up behind so the blade stands clear above the head on the far side, over the top, down low in front with the front foot lunging; the strike held two beats
CLIPS['attack1'] = [
 (P(hip=(0.02, 0, -6, 0, 6), chest=(-6, 0, -10), head=(2, 0, 14), hair=(4, 0, 0), armF=(100, 30, 30, 90, 0), armN=(10, 12, 20, 0, 0), footN=(-0.012, -0.06, 0, 0), footF=(0.012, 0.06, 0, 0)), 'grr', 1),
 (P(hip=(0.03, 0, -12, 0, 10), chest=(-12, 0, -12), head=(2, 0, 18), hair=(8, 0, 0), armF=(150, 20, 0, 90, 0), armN=(20, 14, 24, 0, 0), footN=(-0.012, -0.07, 0.03, 12), footF=(0.012, 0.07, 0, 0)), 'grr', 2),
 (P(hip=(-0.02, -0.01, 10, 0, 0), chest=(10, 0, 0), head=(-4, 0, 10), hair=(8, 0, 0), armF=(105, 10, 0, 60, 0), armN=(-10, 12, 22, 0, 0), footN=(-0.012, -0.14, 0.01, 6), footF=(0.012, 0.07, 0, 0)), 'grr', 1),
 (P(hip=(-0.07, -0.05, 24, 0, -6), chest=(16, 0, 12), head=(-30, 0, 6), hair=(12, 0, 0), armF=(52, 8, 0, 0, 0), armN=(-44, 20, 26, 0, 0), footN=(-0.012, -0.2, 0, 0), footF=(0.012, 0.1, 0.01, -20)), 'grr', 2),
 (P(hip=(-0.06, -0.045, 20, 0, -5), chest=(13, 0, 10), head=(-26, 0, 8), hair=(2, 0, 0), armF=(44, 8, 10, 0, 0), armN=(-36, 18, 26, 0, 0), footN=(-0.012, -0.19, 0, 0), footF=(0.012, 0.1, 0, -12)), 'grr', 1),
 (P(hip=(-0.02, -0.015, 8, 0, -4), chest=(6, 0, 6), head=(-7, 0, 8), hair=(-2, 0, 0), armF=(42, 40, 50, 50, 0), armN=(-14, 12, 20, 0, 0), footN=(-0.012, -0.1, 0, 0), footF=(0.012, 0.06, 0, 0)), 'open', 1)]
CLIPS['hit1'] = [(dict(world=(-14, 0, 0), x=0, y=0.03, z=0.08, hip=(0.03, 0.0, -10, 0, 8), chest=(-14, 4, 12), head=(-22, -5, 12), hair=(26, 0, 0), armN=(-60, 44, 18, 0, 0), armF=(130, 40, 0, 90, 0),
                       footN=(0.02, -0.12, 0.07, -32), footF=(-0.02, 0.06, 0.04, -14)), 'shock', 1)]
def sword_at(p, rx, ry=0): return Matrix.Translation(Vector(p)) @ rot(rx, ry, 0) @ Matrix.Translation(-G)
CLIPS['die1'] = [
 (P(hip=(0.03, -0.02, -10, 0, 6), chest=(-8, 0, 10), head=(-10, 0, 10), hair=(10, 0, 0), armF=(60, 30, 20, -20, 0), armN=(-20, 20, 22, 0, 0), footN=(-0.012, -0.06, 0, 0), footF=(0.012, 0.06, 0, 0)), 'hurt', 1),
 (P(world=(-14, 0, 0), y=0.03, hip=(0.07, -0.1, -18, 0, 8), chest=(-10, 0, 12), head=(-16, 0, 12), hair=(18, 0, 0), armF=(66, 44, 16, 0, 0), armN=(52, 40, 18, 0, 0), footN=(-0.012, -0.12, 0.012, 0), footF=(0.012, -0.02, 0.0, 0), sword=sword_at((0.1, -0.2, 0.46), 55)), 'hurt', 1),
 (P(world=(-44, 0, 0), y=0.12, z=0.09, hip=(0.04, -0.09, -12, 0, 8), chest=(-8, 0, 10), head=(-12, 0, 14), hair=(24, 0, 0), armF=(84, 40, 12, 0, 0), armN=(70, 36, 18, 0, 0), footN=(-0.012, -0.1, 0.03, -10), footF=(0.012, -0.04, 0.03, -10), sword=sword_at((0.12, -0.3, 0.2), 15, 25)), 'hurt', 1),
 (P(world=(-73, 0, 0), y=0.22, z=0.095, hip=(0, -0.012, -5, 0, 6), chest=(-3, 0, 8), head=(-4, 0, 22), hair=(-6, 0, 0), armF=(14, 22, 18, 0, 0), armN=(14, 20, 16, 0, 0), footN=(-0.012, -0.05, 0, -6), footF=(0.012, 0.03, 0, -6), sword=sword_at((0.14, -0.36, 0.035), 0, 62)), 'dead', 1),
 (P(world=(-70, 0, 0), y=0.22, z=0.135, hip=(0, 0.004, -3, 0, 6), chest=(0, 0, 8), head=(-8, 0, 22), hair=(6, 0, 0), armF=(26, 28, 14, 0, 0), armN=(24, 26, 12, 0, 0), footN=(-0.012, -0.05, 0.015, -6), footF=(0.012, 0.03, 0.015, -6), sword=sword_at((0.14, -0.36, 0.025), 0, 62)), 'dead', 1),
 (P(world=(-73, 0, 0), y=0.22, z=0.095, hip=(0, -0.012, -5, 0, 6), chest=(-3, 0, 8), head=(-4, 0, 22), hair=(-6, 0, 0), armF=(14, 22, 18, 0, 0), armN=(14, 20, 16, 0, 0), footN=(-0.012, -0.05, 0, -6), footF=(0.012, 0.03, 0, -6), sword=sword_at((0.14, -0.36, 0.025), 0, 62)), 'dead', 1)]
DELAY = {'stand': 100, 'move': 100, 'attack1': 67, 'hit1': 600, 'die1': 83, 'test': 100}; ALPHA = {'die1': [255, 255, 255, 255, 220, 120, 0]}
# a test clip: the windup's arm with the wrist turned four ways, and the over-the-top arm three ways, to read the rig's signs by eye
CLIPS['test'] = [(P(armF=(f, o, b, w, 0), armN=(20, 12, 20, 0, 0)), 'grr', 1) for (f, o, b, w) in [(70, 70, 100, 90), (40, 90, 90, 90), (100, 50, 80, 90), (60, 80, 60, 120), (40, 50, 60, 90), (90, 80, 110, 60), (120, 60, 40, 90), (50, 70, 120, 150)]]

# ---------------------------------------------------------------- the camera, the light, the line (the studio's ink at 2x)
cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = FW; cd.sensor_fit = 'HORIZONTAL'; cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam; e = rad(ELEV); aim = FH / 2 - FEET_UP
cam.location = (0, -12 * math.cos(e), aim + 12 * math.sin(e)); cam.rotation_euler = (math.pi / 2 - e, 0, 0); cd.clip_end = 100
sd = bpy.data.lights.new('s', 'SUN'); sd.energy = 3.92; sd.angle = 0; sd.use_shadow = False; sun = bpy.data.objects.new('s', sd); sc.collection.objects.link(sun); sun.rotation_euler = Vector((0.35, 0.5, -1.0)).to_track_quat('-Z', 'Y').to_euler()
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0, 0, 0, 1)
r = sc.render; r.engine = 'BLENDER_EEVEE'; r.resolution_x = int(FW * PX_UNIT); r.resolution_y = int(FH * PX_UNIT); r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.filter_size = 1.0
sc.eevee.taa_render_samples = 16; sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.display_settings.display_device = 'sRGB'
r.use_freestyle = True; r.line_thickness_mode = 'ABSOLUTE'; r.line_thickness = 1.0; vl.use_freestyle = True; fs = vl.freestyle_settings; fs.crease_angle = rad(40); fs.as_render_pass = False
for ls in list(fs.linesets): fs.linesets.remove(ls)
def lineset(name, th, outer, a=1.0):
    ls = fs.linesets.new(name); ls.select_external_contour = outer; ls.select_contour = False; ls.select_silhouette = not outer; ls.select_border = not outer; ls.select_crease = False; ls.select_material_boundary = not outer; ls.select_by_visibility = True; ls.visibility = 'VISIBLE'
    ls.select_by_collection = True; ls.collection = CI; st = ls.linestyle; st.color = srgb(INK); st.thickness = th; st.alpha = a; st.caps = 'ROUND'; st.use_chaining = True
lineset('outer', 2.5, True); lineset('inner', 1.6, False, 0.85)

# ---------------------------------------------------------------- render, writing the studio's meta (pack.js takes it; the box comes from the painted bounds)
def px_of(p):
    from bpy_extras.object_utils import world_to_camera_view as w2c
    c = w2c(sc, cam, p); return [round(c.x * r.resolution_x, 1), round((1 - c.y) * r.resolution_y, 1)]
vl.update(); os.makedirs(OUT, exist_ok=True); mp = os.path.join(OUT, 'meta.json'); meta = json.load(open(mp)) if os.path.exists(mp) else {}
meta.update(size=int(FH * PX_UNIT / 2), px=2, variant=VAR, origin=px_of(Vector((0, 0, 0)))); meta.setdefault('actions', {})
if WHICH == 'stills': names = ['stand_00', 'attack1_01', 'attack1_03', 'hit1_00']
elif WHICH == 'all': names = ['%s_%02d' % (c, i) for c, L in CLIPS.items() if c != 'test' for i in range(len(L))]
else: names = WHICH.split(',')
for n in names:
    c, i = n.rsplit('_', 1); i = int(i); Pz, m, hold = CLIPS[c][i]; face(m); W, Ms = pose(Pz); R = rig.matrix_world
    r.filepath = os.path.join(OUT, n + '.png'); bpy.ops.render.render(write_still=True)
    A = meta['actions'].setdefault(c, {'delay': DELAY[c], 'frames': [None] * len(CLIPS[c])})
    fr = {'file': n + '.png', 'delay': DELAY[c] * hold, 'head': px_of(R @ W @ Ms['head'] @ Vector((0, 0, HZ + HEADR * 1.3))), 'tip': px_of(R @ W @ Ms['sword'] @ (G + Vector((0, -0.5, 0)))), 'hilt': px_of(R @ W @ Ms['sword'] @ (G + Vector((0, -0.078, 0)))), 'shoulder': px_of(R @ W @ Ms['chest'] @ SH['F'])}
    if c in ALPHA: fr['a0'] = ALPHA[c][i]; fr['a1'] = ALPHA[c][min(i + 1, len(ALPHA[c]) - 1)]
    A['frames'][i] = fr; print('frame', n)
for c, A in meta['actions'].items(): A['frames'] = [f for f in A['frames'] if f]
json.dump(meta, open(mp, 'w'), indent=1); print('done', len(names), 'variant', VAR)
