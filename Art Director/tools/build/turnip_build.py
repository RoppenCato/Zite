"""The Turnip Grump, the Sunny Meadow's first monster (Perry, AD, 2026-10-31): a round cream turnip with a violet top,
three leaves on its crown, heavy brows and a pout, stubby root feet; about 0.8 of the player's height. Built by script,
posed by empties (no armature: a blob creature squashes and leans as a whole, its leaves lag behind), every action keyed
frame by frame on the timeline, facing left (-X), the face turned a little toward the camera.

  node tools/blender.js tools/build/turnip_build.py -- work/turnip/source/turnip.blend

The actions and their frame counts are the reference's (docs/direction.md section 3): stand 6 at 130 ms, move 6 at
140 ms (a hop), hit1 1 at 600 ms (the most exaggerated pose: flattened, knocked back, leaves splayed, eyes popped),
die1 8 at 150 ms (a wobble, a topple onto its back, a bounce, a fade), attack1 12 at 120 ms (a headbutt: windup,
lunge, impact, recovery). Leaves whip late; the feet stay on the ground unless it leaves it."""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; out = os.path.abspath(sys.argv[sys.argv.index('--') + 1])
M = toon.material
# the cream in chosen warm tones (Colin, AD: the body was a muddy grey)
COL = {'cream': M('cream', '#f8e6c0', gloss=0.5, tones_={'deep': '#b89468', 'shade': '#dcbf90', 'base': '#f8e6c0', 'light': '#fff1d6', 'hi': '#fffaf0'}), 'violet': M('violet', '#9b5de5', gloss=0.7), 'leaf': M('leaf', '#5fb04a', gloss=0.3), 'leaf2': M('leaf2', '#7ccf5a', gloss=0.3), 'white': M('white', '#fff8f0', flat=True),
       'ink': M('ink', '#2b2320', flat=True), 'brow': M('brow', '#3d2e4f', flat=True), 'pink': M('pink', '#ff9a86', flat=True), 'mouth': M('mouth', '#5a2a3a', flat=True), 'root': M('root', '#e2cfa8', gloss=0.2)}
def smooth(o): bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth(); o.select_set(False)
def empty(name, loc, parent=None):
    o = bpy.data.objects.new(name, None); sc.collection.objects.link(o); o.location = loc
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o
def sphere(name, r, loc, mat, scale=(1, 1, 1), rot=(0, 0, 0), seg=32, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=max(8, seg // 2)); o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o)
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o
def cone(name, r, h, loc, mat, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0.01, depth=h, location=loc, vertices=20); o = bpy.context.object; o.name = name; o.rotation_euler = rot; o.data.materials.append(mat); smooth(o)
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o

# ---- the model ----
FACE = math.radians(58); D = Vector((-math.cos(FACE), -math.sin(FACE), 0)); S = Vector((-math.sin(FACE), math.cos(FACE), 0))   # the face turned toward the camera, as the reference's monsters cheat it; 35 left the eyes on the edge
FROT = FACE + math.pi                                  # a face part's local x then points along D, so its thin axis is the face's normal and it lies flat on the face (with -FACE the eyes stuck out like eggs)
C = Vector((0, 0, 0.40)); R = 0.38
root = empty('Root', (0, 0, 0))                                         # the whole creature: squash, lean, hop, topple
sphere('body', R, C, COL['cream'], scale=(1, 0.95, 1.0), seg=40, parent=root)
sphere('top', R * 0.98, C + Vector((0, 0, 0.12)), COL['violet'], scale=(1, 0.95, 0.72), seg=40, parent=root)
cone('taproot', 0.09, 0.16, (0.02, 0, 0.05), COL['root'], rot=(math.pi, 0, 0), parent=root)
for s in (-1, 1): sphere('foot%d' % (s + 1), 0.1, (s * 0.17, -0.06, 0.05), COL['root'], scale=(1.3, 1, 0.5), seg=14, parent=root)
leaves = empty('Leaves', C + Vector((0, 0, R * 0.95)), parent=root)    # the crown: sways and lags as one
LEAF = []
for i, (ang, tilt) in enumerate([(0, 0), (2.1, 22), (4.2, 22)]):
    piv = empty('leafpivot%d' % i, leaves.location, parent=leaves)       # each leaf tilts outward from the crown
    o = sphere('leaf%d' % i, 1.0, leaves.location + Vector((0, 0, 0.30)), COL['leaf' if i else 'leaf2'], scale=(0.09, 0.09 * 0.35, 0.30), seg=20, parent=piv)
    LEAF.append((piv, ang, tilt))
face = empty('Face', C, parent=root)
EYES, PUPILS, BROWS, CHEEKS = [], [], [], []
for s in (-1, 1):
    p = Vector((C.x, C.y, C.z)) + D * R * 0.96 + S * 0.15 * s
    EYES.append(sphere('eye%d' % (s + 1), 0.1, p, COL['white'], scale=(0.45, 1, 1.25), rot=(0, 0, FROT), parent=face))
    pu = sphere('pupil%d' % (s + 1), 0.05, p + D * 0.042, COL['ink'], scale=(0.5, 1, 1.3), rot=(0, 0, FROT), seg=16, parent=face); PUPILS.append(pu)
    sphere('catch%d' % (s + 1), 0.016, p + D * 0.066 + S * 0.016 + Vector((0, 0, 0.024)), COL['white'], scale=(0.5, 1, 1), rot=(0, 0, FROT), seg=10, parent=pu)   # the catchlight: the reference's eyes all have one (the Slime's, the Mushroom's)
    b = Vector((C.x, C.y, C.z + 0.19)) + D * R * 0.98 + S * 0.15 * s
    BROWS.append(sphere('brow%d' % (s + 1), 0.09, b, COL['brow'], scale=(0.3, 1.1, 0.35), rot=(s * 0.35, 0, FROT), seg=12, parent=face))
    CHEEKS.append(sphere('cheek%d' % (s + 1), 0.07, Vector((C.x, C.y, C.z - 0.16)) + D * R * 0.94 + S * 0.25 * s, COL['pink'], scale=(0.3, 1, 0.7), rot=(0, 0, FROT), seg=12, parent=face))
MOUTH = sphere('mouth', 0.06, Vector((C.x, C.y, C.z - 0.22)) + D * R * 0.99, COL['mouth'], scale=(0.3, 1.0, 0.45), rot=(0, 0, FROT), seg=12, parent=face)

# ---- the poses ----
BASE = {'eye': (0.45, 1, 1.25), 'pupil': (0.5, 1, 1.3), 'brow': (0.3, 1.1, 0.35), 'mouth': (0.3, 1.0, 0.45)}
def pose(f, scale=(1, 1, 1), lean=0.0, x=0.0, z=0.0, leaves_tilt=0.0, splay=0.0, eye=1.0, eye_z=None, pupil=1.0, brow_up=0.0, brow_angry=0.0, mouth='pout', face_dz=0.0, eye_sep=1.0):
    """set every part for frame f and key it. lean: degrees about Y (+ leans back, away from the facing). leaves_tilt: the crown's
    lag about Y (+ back). splay: extra outward tilt of each leaf. eye: the eyes' size; eye_z squashes them (a blink, shut).
    brow_up lifts the brows; brow_angry turns their inner ends down. mouth: pout, o, grr, flat."""
    sc.frame_set(f)
    root.scale = scale; root.rotation_euler = (0, math.radians(lean), 0); root.location = (x, 0, z)
    for o in (root,): o.keyframe_insert('scale', frame=f); o.keyframe_insert('rotation_euler', frame=f); o.keyframe_insert('location', frame=f)
    leaves.rotation_euler = (0, math.radians(leaves_tilt), 0); leaves.keyframe_insert('rotation_euler', frame=f)
    for piv, ang, tilt in LEAF:
        t = math.radians(tilt + splay); piv.rotation_euler = (t * math.cos(ang), t * math.sin(ang), 0); piv.keyframe_insert('rotation_euler', frame=f)
    ez = eye if eye_z is None else eye_z
    for i, e in enumerate(EYES):
        s = -1 if i == 0 else 1; e.scale = (BASE['eye'][0], BASE['eye'][1] * eye, BASE['eye'][2] * ez); e.delta_location = S * 0.15 * s * (eye_sep - 1); e.keyframe_insert('scale', frame=f); e.keyframe_insert('delta_location', frame=f)
    for i, p in enumerate(PUPILS):
        s = -1 if i == 0 else 1; p.scale = (BASE['pupil'][0], BASE['pupil'][1] * pupil, BASE['pupil'][2] * pupil * (0.15 if ez < 0.3 else 1.0)); p.delta_location = S * 0.15 * s * (eye_sep - 1); p.keyframe_insert('scale', frame=f); p.keyframe_insert('delta_location', frame=f)
    for i, b in enumerate(BROWS):
        s = -1 if i == 0 else 1
        b.rotation_euler = (s * (0.35 - brow_angry * 0.9 + brow_up * 0.3), 0, FROT); b.delta_location = (0, 0, brow_up * 0.07); b.keyframe_insert('rotation_euler', frame=f); b.keyframe_insert('delta_location', frame=f)   # the slant turns about the face's normal (Euler XYZ: X first, then the turn to the face)
    ms = {'pout': (0.3, 1.0, 0.45), 'o': (0.3, 1.2, 1.3), 'grr': (0.3, 1.9, 0.5), 'flat': (0.3, 1.5, 0.25)}[mouth]
    MOUTH.scale = ms; MOUTH.keyframe_insert('scale', frame=f)
    face.delta_location = (0, 0, face_dz); face.keyframe_insert('delta_location', frame=f)

clips = {}; F = 1
def clip(name, delay, frames, alpha=None):
    global F
    clips[name] = {'start': F, 'frames': len(frames), 'delay': delay}
    if alpha: clips[name]['alpha'] = alpha
    for i, kw in enumerate(frames): pose(F + i, **kw)
    F += len(frames) + 4
# stand: a breath, the crown sways, a blink on the fifth frame
clip('stand', 130, [dict(scale=(1 - 0.02 * math.sin(a), 1 - 0.02 * math.sin(a), 1 + 0.035 * math.sin(a)), leaves_tilt=4 * math.sin(a + 1.0), eye_z=0.12 if i == 4 else None) for i, a in [(i, 2 * math.pi * i / 6) for i in range(6)]])
# move: a hop in place; crouch, launch, air, fall, land, settle; the crown lags
clip('move', 140, [dict(scale=(1.08, 1.08, 0.86), leaves_tilt=10, brow_angry=0.3), dict(scale=(0.94, 0.94, 1.14), z=0.06, lean=-8, leaves_tilt=18, brow_angry=0.3),
                    dict(scale=(0.97, 0.97, 1.06), z=0.18, lean=-10, leaves_tilt=8, brow_angry=0.3), dict(scale=(1, 1, 1), z=0.16, lean=-4, leaves_tilt=-6, brow_angry=0.3),
                    dict(scale=(1.12, 1.12, 0.84), leaves_tilt=-18, brow_angry=0.3), dict(scale=(1.03, 1.03, 0.97), leaves_tilt=-6, brow_angry=0.3)])
# hit1: flattened, knocked back, the leaves splayed straight out, the eyes popped, an O mouth
clip('hit1', 600, [dict(scale=(1.3, 1.3, 0.72), x=0.08, lean=12, leaves_tilt=-10, splay=18, eye=1.4, eye_sep=1.35, pupil=0.7, brow_up=1.0, mouth='o')])
# die1: a wobble, a nod, a lean back, then it sinks and squashes flat (the Slime's melt; a topple showed the crown's seam and lost the face), the crown drooping, fading at the end
clip('die1', 150, [dict(scale=(1.05, 1.05, 0.95), lean=6), dict(lean=-8, eye_z=0.5), dict(lean=14, leaves_tilt=12, eye_z=0.5), dict(scale=(1.15, 1.15, 0.8), leaves_tilt=30, eye_z=0.3, mouth='flat'),
                    dict(scale=(1.3, 1.3, 0.58), leaves_tilt=50, splay=14, eye_z=0.15, mouth='flat'), dict(scale=(1.42, 1.42, 0.42), leaves_tilt=66, splay=20, eye_z=0.15, mouth='flat'),
                    dict(scale=(1.48, 1.48, 0.34), leaves_tilt=74, splay=22, eye_z=0.15, mouth='flat'), dict(scale=(1.5, 1.5, 0.3), leaves_tilt=78, splay=22, eye_z=0.15, mouth='flat')],
     alpha=[255, 255, 255, 255, 255, 255, 180, 90, 0])
# attack1: the headbutt; four of windup leaning back, the launch, the lunge, the impact, a hold, four of recovery
clip('attack1', 120, [dict(lean=6, x=0.03, scale=(1.04, 1.04, 0.94), leaves_tilt=14, brow_angry=1.0, mouth='grr'), dict(lean=14, x=0.07, scale=(1.08, 1.08, 0.9), leaves_tilt=24, brow_angry=1.0, mouth='grr'),
                       dict(lean=22, x=0.10, scale=(1.11, 1.11, 0.87), leaves_tilt=32, brow_angry=1.0, mouth='grr'), dict(lean=26, x=0.12, scale=(1.13, 1.13, 0.85), leaves_tilt=36, brow_angry=1.0, mouth='grr'),
                       dict(lean=-5, x=0.0, scale=(0.9, 0.9, 1.15), leaves_tilt=42, brow_angry=1.0, mouth='grr'), dict(lean=-22, x=-0.32, scale=(1.18, 1.0, 0.92), leaves_tilt=32, brow_angry=1.0, mouth='grr'),
                       dict(lean=-28, x=-0.45, scale=(1.25, 1.0, 0.85), leaves_tilt=-22, splay=10, brow_angry=1.0, eye_z=0.15, mouth='grr'), dict(lean=-24, x=-0.42, scale=(1.15, 1.0, 0.9), leaves_tilt=-32, splay=8, brow_angry=1.0, eye_z=0.15, mouth='grr'),
                       dict(lean=-14, x=-0.30, scale=(1.06, 1.0, 0.96), leaves_tilt=-18, brow_angry=0.7, mouth='flat'), dict(lean=-8, x=-0.18, leaves_tilt=-8, brow_angry=0.4), dict(lean=-3, x=-0.08, leaves_tilt=4, brow_angry=0.2), dict(lean=0, x=0.0, leaves_tilt=2)])
sc['clips'] = json.dumps(clips); sc['head'] = '*'; sc.frame_end = F
os.makedirs(os.path.dirname(out), exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=out); print('saved', out, json.dumps(clips))
