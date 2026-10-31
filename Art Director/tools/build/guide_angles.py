"""Reads a motion clip as pose guides (Perry, AD, 2026-10-31; Robin's idea, Colin, AD's way: use Mixamo as a guide for the
poses, never shipped, read as angles rather than traced as pictures). Imports an FBX (Mixamo, Without Skin) and writes, per
frame, the figure's numbers in its own side view: the hips' height and forward shift, the torso's lean, each thigh's,
shin's, upper arm's and forearm's swing (0 hanging down, + forward), the head's tilt. Angles carry over to a chibi where
outlines do not. The FBX files stay in an ignored folder; so does this output.

  node tools/blender.js tools/build/guide_angles.py -- <clip.fbx> <out.json> [--step 1]"""
import bpy, os, sys, json, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; fbx, out = os.path.abspath(argv[0]), os.path.abspath(argv[1]); step = int(argv[argv.index('--step') + 1]) if '--step' in argv else 1
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx, automatic_bone_orientation=False, ignore_leaf_bones=True)
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
act = rig.animation_data.action; f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
B = {n: rig.pose.bones.get('mixamorig:' + n) for n in ['Hips', 'Spine', 'Spine2', 'Neck', 'Head', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm']}
def W(p): return rig.matrix_world @ p
def frame_axes():
    """the figure's own axes this frame: up, and forward (perpendicular to the line between the hips)"""
    up = Vector((0, 0, 1)); lat = (W(B['RightUpLeg'].head) - W(B['LeftUpLeg'].head)); lat.z = 0; lat.normalize()
    fwd = up.cross(lat); fwd.normalize()
    return up, fwd, lat
def swing(bone, up, fwd):
    """a bone's angle in the side plane: 0 hanging straight down, + its tip forward"""
    d = W(bone.tail) - W(bone.head); return math.degrees(math.atan2(d.dot(fwd), -d.dot(up)))
rows = []; base = None
for f in range(f0, f1 + 1, step):
    sc.frame_set(f); bpy.context.view_layer.update(); up, fwd, lat = frame_axes()
    hips = W(B['Hips'].head);
    if base is None: base = hips.copy(); fwd0 = fwd.copy()
    spine = (W(B['Neck'].head) - W(B['Hips'].head)); lean = math.degrees(math.atan2(spine.dot(fwd), spine.dot(up)))   # + leans forward
    head = W(B['Head'].tail) - W(B['Head'].head); tilt = math.degrees(math.atan2(head.dot(fwd), head.dot(up)))
    rows.append({'f': f, 'hipY': round((hips - base).z, 3), 'hipX': round((hips - base).dot(fwd0), 3), 'lean': round(lean, 1), 'head': round(tilt, 1),
                 'thighL': round(swing(B['LeftUpLeg'], up, fwd), 1), 'shinL': round(swing(B['LeftLeg'], up, fwd), 1), 'thighR': round(swing(B['RightUpLeg'], up, fwd), 1), 'shinR': round(swing(B['RightLeg'], up, fwd), 1),
                 'armL': round(swing(B['LeftArm'], up, fwd), 1), 'foreL': round(swing(B['LeftForeArm'], up, fwd), 1), 'armR': round(swing(B['RightArm'], up, fwd), 1), 'foreR': round(swing(B['RightForeArm'], up, fwd), 1),
                 'footL': round((W(B['LeftFoot'].head) - base).z, 3), 'footR': round((W(B['RightFoot'].head) - base).z, 3)})
height = (W(B['Head'].tail) - min([W(B['LeftFoot'].tail), W(B['RightFoot'].tail)], key=lambda v: v.z)).z
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as fh: json.dump({'clip': os.path.basename(fbx), 'fps': sc.render.fps, 'frames': rows, 'height': round(height, 3), 'legs': round((W(B['LeftUpLeg'].head) - W(B['LeftFoot'].tail)).z, 3)}, fh, indent=0)
print('wrote', out, len(rows), 'frames; figure', round(height, 2), 'tall')
