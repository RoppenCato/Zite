"""The Warrior, the first class character and our player (Perry, AD, 2026-10-31; Robin: the code-drawn stand-in looked
awful). The reference's proportions: a metre tall (100 CSS px), the head half the height, big eyes with catchlights, a
small body, stubby limbs; the body turned 35 degrees toward the camera as the reference draws its people, the face a
touch more. Built from primitives on pivot empties (hips, shoulders, the neck), keyed frame by frame, facing left (-X).

  node tools/blender.js tools/build/warrior_build.py -- work/warrior/source/warrior.blend

Actions: stand 4 at 220 ms (a breath), move 6 at 120 ms (a walk), attack1 6 at 90 ms (a sword swing), hit1 1 at 400 ms
(knocked back, eyes shut), die1 6 at 150 ms (a fall onto the back, fading)."""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; out = os.path.abspath(sys.argv[sys.argv.index('--') + 1])
M = toon.material
COL = {'skin': M('skin', '#ffdcb8', gloss=0.25), 'hair': M('hair', '#e8703a', gloss=0.45), 'tunic': M('tunic', '#3f7fd8', gloss=0.3), 'belt': M('belt', '#8a5a35', matte=True), 'pants': M('pants', '#3a2d2a', matte=True),
       'boot': M('boot', '#5a3a28', gloss=0.4), 'blade': M('blade', '#e8eef5', gloss=0.9), 'hilt': M('hilt', '#8a5a35', matte=True), 'guard': M('guard', '#d9a84a', gloss=0.6),
       'white': M('white', '#fff8f0', flat=True), 'ink': M('ink', '#2b2320', flat=True), 'pink': M('pink', '#ff9a86', flat=True), 'mouth': M('mouth', '#7a3a3a', flat=True), 'pauldron': M('pauldron', '#8aa0b8', gloss=0.7)}
def smooth(o): bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth(); o.select_set(False)
def parent_to(o, p):
    if p: o.parent = p; o.matrix_parent_inverse = p.matrix_world.inverted()
    return o
def empty(name, loc, parent=None):
    o = bpy.data.objects.new(name, None); sc.collection.objects.link(o); o.location = loc; bpy.context.view_layer.update(); return parent_to(o, parent)
def sphere(name, r, loc, mat, scale=(1, 1, 1), rot=(0, 0, 0), seg=28, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=max(8, seg // 2)); o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o); bpy.context.view_layer.update(); return parent_to(o, parent)
def cyl(name, r, h, loc, mat, rot=(0, 0, 0), r2=None, parent=None, verts=18):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, vertices=verts); o = bpy.context.object; o.name = name; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o); bpy.context.view_layer.update(); return parent_to(o, parent)
def box(name, size, loc, mat, bevel=0.02, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = name; o.scale = size; o.rotation_euler = rot; o.data.materials.append(mat)
    if bevel: b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 3; b.limit_method = 'NONE'
    smooth(o); bpy.context.view_layer.update(); return parent_to(o, parent)

# ---- the figure: a metre tall, the head half of it ----
TURN = math.radians(35)                                       # the whole body turned toward the camera: applied in pose(), after the parenting (a parent's turn set before binding is cancelled by the parent inverse)
root = empty('Root', (0, 0, 0)); bpy.context.view_layer.update()
hips = empty('Hips', (0, 0, 0.30), root)
torso = box('torso', (0.24, 0.3, 0.26), (0, 0, 0.42), COL['tunic'], bevel=0.05, parent=hips)
box('belt', (0.255, 0.315, 0.05), (0, 0, 0.315), COL['belt'], bevel=0.015, parent=hips)
sphere('buckle', 0.024, (-0.125, -0.04, 0.315), COL['guard'], scale=(0.5, 1, 1), seg=12, parent=hips)
for s in (-1, 1): sphere('pauldron%d' % (s + 1), 0.075, (0, s * 0.16, 0.53), COL['pauldron'], scale=(1, 1, 0.7), seg=18, parent=hips)
LEGS, ARMS = [], []
for s in (-1, 1):                                              # legs on hip pivots, arms on shoulder pivots; s = -1 is the near side (toward the camera, -Y), +1 the far
    hp = empty('hip%d' % (s + 1), (0, s * 0.07, 0.30), hips)
    cyl('leg%d' % (s + 1), 0.06, 0.2, (0, s * 0.07, 0.19), COL['pants'], parent=hp)
    sphere('boot%d' % (s + 1), 0.075, (-0.025, s * 0.07, 0.055), COL['boot'], scale=(1.5, 1, 0.8), seg=16, parent=hp)
    LEGS.append(hp)
    sp = empty('shoulder%d' % (s + 1), (0, s * 0.17, 0.5), hips)
    cyl('sleeve%d' % (s + 1), 0.052, 0.12, (0, s * 0.175, 0.44), COL['tunic'], parent=sp)
    cyl('arm%d' % (s + 1), 0.044, 0.12, (0, s * 0.175, 0.34), COL['skin'], parent=sp)
    sphere('hand%d' % (s + 1), 0.052, (0, s * 0.175, 0.28), COL['skin'], seg=14, parent=sp)
    ARMS.append(sp)
# the sword in the near hand (ARMS[0], toward the camera): a blade, a guard, a hilt, pointing up at rest
sw = empty('Sword', (0, -0.175, 0.28), ARMS[0])
box('blade', (0.05, 0.012, 0.48), (0, -0.175, 0.57), COL['blade'], bevel=0.006, parent=sw)
box('guard', (0.12, 0.028, 0.03), (0, -0.175, 0.33), COL['guard'], bevel=0.008, parent=sw)
cyl('hilt', 0.017, 0.1, (0, -0.175, 0.24), COL['hilt'], parent=sw); sphere('pommel', 0.026, (0, -0.175, 0.185), COL['guard'], seg=12, parent=sw)
# the head: a big ball (the reference's head is as wide as it is tall and half the figure), a cap of hair set back so the face
# shows, tousled bumps on top, a spiky fringe over the brow; the face turned a touch more toward the camera than the body
neck = empty('Neck', (0, 0, 0.52), hips)
head = sphere('head', 0.28, (0, 0, 0.76), COL['skin'], scale=(1.0, 1.05, 0.95), seg=40, parent=neck)
FACE = math.radians(22); D = Vector((-math.cos(FACE), -math.sin(FACE), 0)); S = Vector((-math.sin(FACE), math.cos(FACE), 0)); FROT = FACE + math.pi
sphere('hair_cap', 0.285, Vector((0, 0, 0.80)) - D * 0.06, COL['hair'], scale=(1.0, 1.05, 0.9), seg=40, parent=neck)
for i, (dx, dy, dz, r) in enumerate([(0.02, 0.0, 0.26, 0.11), (-0.1, -0.08, 0.23, 0.09), (0.12, 0.08, 0.22, 0.09), (0.0, 0.14, 0.24, 0.08)]):
    sphere('hair_bump%d' % i, r, (dx, dy, 0.76 + dz), COL['hair'], seg=16, parent=neck)
for i, (sx, dz, tilt) in enumerate([(-0.14, 0.17, 0.35), (-0.04, 0.2, 0.1), (0.07, 0.2, -0.1), (0.17, 0.17, -0.35), (-0.24, 0.13, 0.6), (0.26, 0.12, -0.6)]):   # the fringe: spikes down over the brow
    p = Vector((0, 0, 0.76)) + D * 0.235 + S * sx + Vector((0, 0, dz)); cyl('spike%d' % i, 0.05, 0.15, p, COL['hair'], rot=(tilt, -0.95, FROT), r2=0.006, parent=neck)
EYES, PUPILS = [], []
for s in (-1, 1):
    p = Vector((0, 0, 0.735)) + D * 0.274 + S * 0.105 * s
    EYES.append(sphere('eye%d' % (s + 1), 0.06, p, COL['white'], scale=(0.4, 1, 1.4), rot=(0, 0, FROT), seg=16, parent=neck))
    pu = sphere('pupil%d' % (s + 1), 0.034, p + D * 0.024, COL['ink'], scale=(0.5, 1, 1.3), rot=(0, 0, FROT), seg=14, parent=neck); PUPILS.append(pu)
    sphere('catch%d' % (s + 1), 0.012, p + D * 0.042 + S * 0.01 + Vector((0, 0, 0.018)), COL['white'], scale=(0.5, 1, 1), rot=(0, 0, FROT), seg=8, parent=pu)
    sphere('cheek%d' % (s + 1), 0.032, Vector((0, 0, 0.665)) + D * 0.262 + S * 0.165 * s, COL['pink'], scale=(0.3, 1, 0.6), rot=(0, 0, FROT), seg=10, parent=neck)
MOUTH = sphere('mouth', 0.03, Vector((0, 0, 0.648)) + D * 0.275, COL['mouth'], scale=(0.3, 1.1, 0.35), rot=(0, 0, FROT), seg=10, parent=neck)

# ---- the poses ----
def pose(f, bob=0.0, lean=0.0, x=0.0, z=0.0, legs=(0, 0), arms=(0, 0), sword=0.0, head_tilt=0.0, eye_z=1.0, mouth='smile', turn=TURN, hips_rot=0.0):
    """key every part for frame f. lean: degrees about Y (+ back). legs and arms: the pivots' swing in degrees (+ forward, toward
    the facing). sword: the near arm's extra swing. head_tilt: the head's nod. eye_z: 1 open, 0.15 shut. mouth: smile, o, flat."""
    sc.frame_set(f)
    root.location = (x, 0, z); root.rotation_euler = (0, math.radians(lean), turn); root.keyframe_insert('location', frame=f); root.keyframe_insert('rotation_euler', frame=f)
    hips.location = (0, 0, 0.30 + bob); hips.rotation_euler = (0, math.radians(hips_rot), 0); hips.keyframe_insert('location', frame=f); hips.keyframe_insert('rotation_euler', frame=f)
    for i, hp in enumerate(LEGS): hp.rotation_euler = (0, -math.radians(legs[i]), 0); hp.keyframe_insert('rotation_euler', frame=f)
    for i, sp in enumerate(ARMS): sp.rotation_euler = (0, -math.radians(arms[i] + (sword if i == 0 else 0)), 0); sp.keyframe_insert('rotation_euler', frame=f)   # arms[0] is the near arm, the sword's
    neck.rotation_euler = (0, math.radians(head_tilt), 0); neck.keyframe_insert('rotation_euler', frame=f)
    for e in EYES: e.scale = (0.4, 1, 1.35 * eye_z); e.keyframe_insert('scale', frame=f)
    for p in PUPILS: p.scale = (0.5, 1, 1.3 * (0.15 if eye_z < 0.3 else 1)); p.keyframe_insert('scale', frame=f)
    MOUTH.scale = {'smile': (0.3, 1.0, 0.35), 'o': (0.3, 1.1, 1.1), 'flat': (0.3, 1.2, 0.25), 'grr': (0.3, 1.6, 0.5)}[mouth]; MOUTH.keyframe_insert('scale', frame=f)
clips = {}; F = 1
def clip(name, delay, frames, alpha=None):
    global F
    clips[name] = {'start': F, 'frames': len(frames), 'delay': delay}
    if alpha: clips[name]['alpha'] = alpha
    for i, kw in enumerate(frames): pose(F + i, **kw)
    F += len(frames) + 4
clip('stand', 220, [dict(bob=0.0), dict(bob=0.008, arms=(2, -2)), dict(bob=0.012, arms=(3, -3), head_tilt=1), dict(bob=0.006, arms=(2, -2))])
clip('move', 120, [dict(legs=(28, -28), arms=(-22, 22), bob=0.0), dict(legs=(14, -14), arms=(-10, 10), bob=0.014, lean=-3), dict(legs=(-4, 4), arms=(2, -2), bob=0.02, lean=-3),
                   dict(legs=(-28, 28), arms=(22, -22), bob=0.0, lean=-3), dict(legs=(-14, 14), arms=(10, -10), bob=0.014, lean=-3), dict(legs=(4, -4), arms=(-2, 2), bob=0.02, lean=-3)])
clip('attack1', 90, [dict(lean=8, x=0.04, arms=(-60, 10), sword=-50, legs=(-10, 10), mouth='grr'), dict(lean=12, x=0.06, arms=(-80, 14), sword=-70, legs=(-12, 12), mouth='grr'),
                     dict(lean=-16, x=-0.14, arms=(60, -20), sword=40, legs=(20, -20), mouth='grr', hips_rot=-10), dict(lean=-24, x=-0.22, arms=(95, -26), sword=55, legs=(26, -26), mouth='grr', hips_rot=-14),
                     dict(lean=-18, x=-0.16, arms=(80, -18), sword=40, legs=(20, -20), mouth='flat', hips_rot=-8), dict(lean=-6, x=-0.06, arms=(30, -6), sword=10, legs=(8, -8))])
clip('hit1', 400, [dict(lean=16, x=0.12, arms=(-40, -40), sword=-20, legs=(8, -8), head_tilt=12, eye_z=0.15, mouth='o')])
clip('die1', 150, [dict(lean=10, x=0.04, eye_z=0.5, mouth='o'), dict(lean=28, x=0.1, arms=(-30, -30), eye_z=0.3, mouth='o'), dict(lean=55, x=0.2, z=0.14, arms=(-50, -50), legs=(20, 20), eye_z=0.15, mouth='flat'),
                   dict(lean=88, x=0.3, z=0.26, arms=(-70, -70), legs=(30, 30), eye_z=0.15, mouth='flat'), dict(lean=90, x=0.3, z=0.26, arms=(-75, -75), legs=(30, 30), eye_z=0.15, mouth='flat'), dict(lean=90, x=0.3, z=0.26, arms=(-75, -75), legs=(30, 30), eye_z=0.15, mouth='flat')],
     alpha=[255, 255, 255, 255, 255, 150, 0])
sc['clips'] = json.dumps(clips); sc['head'] = '*'; sc.frame_end = F
os.makedirs(os.path.dirname(out), exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=out); print('saved', out, json.dumps(clips))
