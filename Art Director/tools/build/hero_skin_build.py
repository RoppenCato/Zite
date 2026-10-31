"""The Warrior as one sculpted surface (Perry, AD, 2026-10-31): Colin, AD's cure for the doll, a radius skeleton skinned
into one body (tools/build/skin.py, the Survival studio's construction, copied with its name), the hair a second skinned
mass with spikes, the face parts on the front, the sword in the near hand. A still, for the two-ways board: the body
turned a quarter toward the camera (applied to the root after the parenting), the face a touch more.

  node tools/blender.js tools/build/hero_skin_build.py -- work/hero_skin/source/hero_skin.blend"""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon, skin
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; coll = sc.collection; out = os.path.abspath(sys.argv[sys.argv.index('--') + 1])
M = toon.material
mats = {'skin': M('skin', '#f7d2a8', gloss=0.2), 'hair': M('hair', '#ec7238', gloss=0.35), 'tunic': M('tunic', '#3f7fd8', gloss=0.25), 'pants': M('pants', '#3e3330', matte=True), 'boot': M('boot', '#5e3c26', gloss=0.3)}
COL = {'white': M('white', '#fff8f0', flat=True), 'ink': M('ink', '#2b2320', flat=True), 'pink': M('pink', '#ff9a86', flat=True), 'mouth': M('mouth', '#7a3a3a', flat=True), 'blade': M('blade', '#e8eef5', gloss=0.8), 'gold': M('gold', '#d9a84a', gloss=0.5), 'hilt': M('hilt', '#6a4228', matte=True), 'belt': M('belt', '#8a5a35', matte=True)}
def smooth(o): bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth(); o.select_set(False)
def parent_to(o, p):
    if p: o.parent = p; o.matrix_parent_inverse = p.matrix_world.inverted()
    return o
def sphere(name, r, loc, mat, scale=(1, 1, 1), rot=(0, 0, 0), seg=24, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=max(8, seg // 2)); o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o); bpy.context.view_layer.update(); return parent_to(o, parent)
def box(name, size, loc, mat, bevel=0.01, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = name; o.scale = size; o.rotation_euler = rot; o.data.materials.append(mat)
    if bevel: b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 3; b.limit_method = 'NONE'
    smooth(o); bpy.context.view_layer.update(); return parent_to(o, parent)

root = bpy.data.objects.new('Root', None); coll.objects.link(root); bpy.context.view_layer.update()
# the body: one stick figure with a radius at every joint, sculpted into one surface
st = skin.Stick()
hips = st.add((0, 0, 0.30), 0.10, root=True, mat='tunic'); chest = st.add((0, 0, 0.47), 0.125, hips, 'tunic'); neck = st.add((0, 0, 0.57), 0.07, chest, 'skin'); head = st.add((0, 0, 0.76), 0.27, neck, 'skin')
for s in (-1, 1):
    hip = st.add((0, s * 0.07, 0.26), 0.065, hips, 'pants'); knee = st.add((0, s * 0.075, 0.15), 0.06, hip, 'pants'); ankle = st.add((0, s * 0.075, 0.07), 0.058, knee, 'boot'); st.add((-0.07, s * 0.075, 0.045), 0.05, ankle, 'boot')
    sh = st.add((0, s * 0.165, 0.5), 0.06, chest, 'tunic'); elb = st.add((-0.02, s * 0.2, 0.4), 0.045, sh, 'skin'); st.add((-0.07, s * 0.2, 0.3), 0.055, elb, 'skin')
body = st.build('body', coll, mats, subdiv=2); parent_to(body, root)
box('belt', (0.27, 0.34, 0.045), (0, 0, 0.31), COL['belt'], bevel=0.01, parent=root); sphere('buckle', 0.024, (-0.14, -0.05, 0.31), COL['gold'], scale=(0.5, 1, 1), seg=12, parent=root)
# the hair: one mass set back on the head so the face shows, a crown, spikes over the brow and one at the nape
FACE = math.radians(22); D = Vector((-math.cos(FACE), -math.sin(FACE), 0)); S = Vector((-math.sin(FACE), math.cos(FACE), 0)); FROT = FACE + math.pi
hs = skin.Stick(); h0 = hs.add((Vector((0, 0, 0.81)) - D * 0.06), 0.265, root=True, mat='hair'); h1 = hs.add((Vector((0, 0, 0.88)) - D * 0.04), 0.2, h0, 'hair'); hs.add((Vector((0.02, 0, 0.98))), 0.07, h1, 'hair')
for sx, dz in [(-0.16, 0.0), (-0.05, 0.02), (0.07, 0.02), (0.18, 0.0), (-0.25, -0.04), (0.27, -0.04)]:
    base = Vector((0, 0, 0.76 + 0.14 + dz)) + D * 0.2 + S * sx; tip = base + D * 0.1 + Vector((0, 0, -0.12)); b = hs.add(base, 0.05, root=True, mat='hair'); hs.add(tip, 0.012, b, 'hair')
nb = hs.add(Vector((0.2, 0.0, 0.72)), 0.05, root=True, mat='hair'); hs.add(Vector((0.3, 0.02, 0.62)), 0.012, nb, 'hair')
hair = hs.build('hair', coll, mats, subdiv=2); parent_to(hair, root)
# the face: big eyes clear of the edge, pupils with a catchlight, brows, cheeks, a smile
for s in (-1, 1):
    p = Vector((0, 0, 0.74)) + D * 0.265 + S * 0.105 * s
    sphere('eye%d' % (s + 1), 0.06, p, COL['white'], scale=(0.4, 1, 1.4), rot=(0, 0, FROT), seg=16, parent=root)
    pu = sphere('pupil%d' % (s + 1), 0.034, p + D * 0.024, COL['ink'], scale=(0.5, 1, 1.3), rot=(0, 0, FROT), seg=14, parent=root)
    sphere('catch%d' % (s + 1), 0.012, p + D * 0.042 + S * 0.01 + Vector((0, 0, 0.018)), COL['white'], scale=(0.5, 1, 1), rot=(0, 0, FROT), seg=8, parent=root)
    sphere('brow%d' % (s + 1), 0.05, Vector((0, 0, 0.84)) + D * 0.255 + S * 0.105 * s, mats['hair'], scale=(0.3, 1.1, 0.3), rot=(s * 0.25, 0, FROT), seg=10, parent=root)
    sphere('cheek%d' % (s + 1), 0.032, Vector((0, 0, 0.67)) + D * 0.255 + S * 0.165 * s, COL['pink'], scale=(0.3, 1, 0.6), rot=(0, 0, FROT), seg=10, parent=root)
sphere('mouth', 0.03, Vector((0, 0, 0.65)) + D * 0.268, COL['mouth'], scale=(0.3, 1.1, 0.35), rot=(0, 0, FROT), seg=10, parent=root)
# the sword in the near hand, resting down and forward
hand = Vector((-0.07, -0.2, 0.3))
box('blade', (0.05, 0.012, 0.46), hand + Vector((-0.12, 0, -0.2)), COL['blade'], bevel=0.006, rot=(0, math.radians(-28), 0), parent=root)
box('guard', (0.12, 0.028, 0.03), hand + Vector((-0.02, 0, -0.01)), COL['gold'], bevel=0.008, rot=(0, math.radians(-28), 0), parent=root)
box('hilt', (0.03, 0.03, 0.1), hand + Vector((0.03, 0, 0.06)), COL['hilt'], bevel=0.006, rot=(0, math.radians(-28), 0), parent=root)
TURN = math.radians(35); root.rotation_euler = (0, 0, TURN); bpy.context.view_layer.update()
sc['clips'] = json.dumps({'stand': {'start': 1, 'frames': 1, 'delay': 200}}); sc['head'] = '*'; sc.frame_end = 2
os.makedirs(os.path.dirname(out), exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=out); print('saved', out)
