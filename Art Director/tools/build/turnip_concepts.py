"""Three visions of the Turnip Grump as stills, for the concept board (Perry, AD, 2026-10-31; Robin, 2026-10-14 in the
Survival game: a new creature is its own idea, shown as stills before any rig). One collection each, built from the same
parts in three shapes, facing left, the face turned a little toward the camera (the reference's monsters cheat the face
toward the viewer while the body faces its way). Rendered by props_render.py with --views side.

  node tools/blender.js tools/build/turnip_concepts.py -- work/turnip/concepts/concepts.blend"""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; out = os.path.abspath(sys.argv[sys.argv.index('--') + 1])
M = toon.material
COL = {'cream': M('cream', '#f3e9d2'), 'violet': M('violet', '#9b5de5'), 'violet2': M('violet2', '#b47ff0'), 'leaf': M('leaf', '#5fb04a'), 'leaf2': M('leaf2', '#7ccf5a'),
       'white': M('white', '#fff8f0', flat=True), 'ink': M('ink', '#2b2320', flat=True), 'brow': M('brow', '#3d2e4f', flat=True), 'pink': M('pink', '#ff9a86', flat=True), 'mouth': M('mouth', '#5a2a3a', flat=True), 'root': M('root', '#e2cfa8')}
cur = None
def coll(name):
    global cur
    c = bpy.data.collections.new(name); sc.collection.children.link(c); cur = c; return c
def link(o):
    for c in list(o.users_collection): c.objects.unlink(o)
    cur.objects.link(o); return o
def smooth(o): bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth(); o.select_set(False)
def sphere(name, r, loc, mat, scale=(1, 1, 1), rot=(0, 0, 0), seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=max(8, seg // 2)); o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o); return link(o)
def cone(name, r, h, loc, mat, rot=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0.01, depth=h, location=loc, vertices=20); o = bpy.context.object; o.name = name; o.rotation_euler = rot; o.scale = scale; o.data.materials.append(mat); smooth(o); return link(o)
FACE = math.radians(58)                                  # the face turned toward the camera by this much (35 left the eyes hanging on the silhouette's edge)
D = Vector((-math.cos(FACE), -math.sin(FACE), 0)); S = Vector((-math.sin(FACE), math.cos(FACE), 0))   # the face's direction and its sideways
FROT = FACE + math.pi                                    # a face part's local x then points along D: its thin axis is the face's normal, so it lies flat on the face
def face(name, c, R, eye_r=0.085, eye_dz=0.0, sep=0.13, brow=True, mouth='pout', eye_scale=(0.45, 1, 1.25), cheeks=True):
    """eyes, pupils, brows, mouth and cheeks on a round body of centre c and radius R, turned toward the camera"""
    cz = c.z + eye_dz
    for s in (-1, 1):
        p = Vector((c.x, c.y, cz)) + D * R * 0.96 + S * sep * s
        e = sphere('%s_eye%d' % (name, s), eye_r, p, COL['white'], scale=eye_scale, rot=(0, 0, FROT))
        sphere('%s_pupil%d' % (name, s), eye_r * 0.5, p + D * eye_r * 0.42, COL['ink'], scale=(0.5, 1, 1.3), rot=(0, 0, FROT), seg=16)
        if brow:
            b = Vector((c.x, c.y, cz + eye_r * 1.9)) + D * R * 0.98 + S * sep * s
            sphere('%s_brow%d' % (name, s), eye_r * 0.9, b, COL['brow'], scale=(0.3, 1.1, 0.35), rot=(s * 0.35, 0, FROT), seg=12)
        if cheeks: sphere('%s_cheek%d' % (name, s), eye_r * 0.7, Vector((c.x, c.y, cz - eye_r * 1.6)) + D * R * 0.94 + S * (sep + 0.09) * s, COL['pink'], scale=(0.3, 1, 0.7), rot=(0, 0, FROT), seg=12)
    m = Vector((c.x, c.y, cz - eye_r * 2.2)) + D * R * 0.99
    if mouth == 'pout': sphere(name + '_mouth', eye_r * 0.6, m, COL['mouth'], scale=(0.3, 1.0, 0.45), rot=(0, 0, FROT), seg=12)
    elif mouth == 'grin': sphere(name + '_mouth', eye_r * 1.6, m, COL['mouth'], scale=(0.25, 1.0, 0.35), rot=(0, 0, FROT), seg=16); sphere(name + '_tooth', eye_r * 0.4, m + Vector((0, 0, eye_r * 0.1)) + D * 0.02, COL['white'], scale=(0.3, 0.8, 0.8), rot=(0, 0, FROT), seg=10)
def leaf(name, base, ang, tilt, length, mat, width=0.09):
    """a leaf: a flattened long ball on a pivot at its base, leaning out by ang (round Z) and tilt (from upright)"""
    piv = bpy.data.objects.new(name + '_pivot', None); sc.collection.objects.link(piv); piv.location = base; piv.rotation_euler = (math.radians(tilt) * math.cos(ang), math.radians(tilt) * math.sin(ang), 0); link(piv)
    o = sphere(name, 1.0, base + Vector((0, 0, length)), mat, scale=(width, width * 0.35, length), seg=20)
    o.parent = piv; o.matrix_parent_inverse = piv.matrix_world.inverted()
    return o

PROPS = {}
# A: round and grumpy: a ball turnip, violet top, three leaves straight up, heavy brows, stubby root feet
coll('A_round'); PROPS['A_round'] = {'size': 160}
c = Vector((0, 0, 0.40)); R = 0.38
sphere('A_body', R, c, COL['cream'], scale=(1, 0.95, 1.0), seg=40)
sphere('A_top', R * 0.98, c + Vector((0, 0, 0.12)), COL['violet'], scale=(1, 0.95, 0.72), seg=40)
cone('A_root', 0.09, 0.16, (0.02, 0, 0.05), COL['root'], rot=(math.pi, 0, 0))
for s in (-1, 1): sphere('A_foot%d' % s, 0.1, (s * 0.17, -0.06, 0.05), COL['root'], scale=(1.3, 1, 0.5), seg=14)
for i, (ang, tilt) in enumerate([(0, 0), (2.1, 22), (4.2, 22)]): leaf('A_leaf%d' % i, c + Vector((0, 0, R * 0.95)), ang, tilt, 0.30, COL['leaf' if i else 'leaf2'])
face('A', c, R, eye_r=0.1, eye_dz=0.0, sep=0.15, brow=True, mouth='pout')
# B: tall and leggy: a taller turnip with a long root tail, one big flopping leaf, long legs, a worried look
coll('B_tall'); PROPS['B_tall'] = {'size': 180}
c = Vector((0, 0, 0.62)); R = 0.30
sphere('B_body', R, c, COL['cream'], scale=(1, 0.9, 1.35), seg=40)
sphere('B_top', R * 0.98, c + Vector((0, 0, 0.22)), COL['violet2'], scale=(1, 0.9, 0.75), seg=40)
cone('B_tail', 0.08, 0.5, (0.25, 0.05, 0.45), COL['root'], rot=(0, math.radians(120), 0))
for s in (-1, 1):
    sphere('B_leg%d' % s, 0.065, (s * 0.12, -0.03, 0.14), COL['root'], scale=(1, 1, 2.4), seg=14); sphere('B_foot%d' % s, 0.1, (s * 0.12 - 0.04, -0.04, 0.05), COL['root'], scale=(1.5, 1, 0.5), seg=14)
leaf('B_leaf0', c + Vector((0, 0, R * 1.3)), 3.14, 70, 0.34, COL['leaf2'], width=0.13); leaf('B_leaf1', c + Vector((0, 0, R * 1.3)), 1.0, 12, 0.18, COL['leaf'])
face('B', c, R, eye_r=0.08, eye_dz=0.12, sep=0.11, brow=True, mouth='pout', eye_scale=(0.45, 1, 1.5))
# C: squat and wide: a flattened turnip, leaves as ears, a big grin with one tooth, no feet (it hops like a dropped turnip)
coll('C_squat'); PROPS['C_squat'] = {'size': 160}
c = Vector((0, 0, 0.30)); R = 0.44
sphere('C_body', R, c, COL['cream'], scale=(1, 0.95, 0.72), seg=40)
sphere('C_top', R * 0.97, c + Vector((0, 0, 0.1)), COL['violet'], scale=(1, 0.95, 0.5), seg=40)
cone('C_root', 0.07, 0.12, (0.0, 0, 0.04), COL['root'], rot=(math.pi, 0, 0))
for s in (-1, 1): leaf('C_ear%d' % s, c + Vector((s * 0.2, 0.0, R * 0.62)), 0 if s > 0 else 3.14, 48, 0.22, COL['leaf'] if s > 0 else COL['leaf2'], width=0.1)
leaf('C_leaf', c + Vector((0, 0, R * 0.68)), 1.5, 8, 0.14, COL['leaf2'], width=0.07)
face('C', c, R, eye_r=0.09, eye_dz=0.02, sep=0.15, brow=False, mouth='grin', eye_scale=(0.45, 1, 1.0))

sc['props'] = json.dumps(PROPS)
os.makedirs(os.path.dirname(out), exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=out); print('saved', out)
