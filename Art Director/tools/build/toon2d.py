"""Approach 2 of three (Mitch, AD, 2026-11-01): the Warrior and the Slime as ONE-SKIN figures in Blender, rendered flat.
A figure is a stick skeleton with a radius at every joint, sculpted into one continuous surface (skin.py, copied from the
Survival game's studio): no balls at the joints, limbs flowing into the torso. The look is two chosen tones per material
(a flat fill and one cooler shade, no gradient, no 3D shine) and a Freestyle ink line that is thick-thin like a nib
(calligraphy) and tapers along each stroke. Animated later on bones: every frame is the same surface posed, so nothing
flickers. Side view, the Warrior facing +X (screen right), the Slime facing -X (screen left), orthographic.
  node tools/blender.js tools/build/toon2d.py -- <out dir>
"""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from skin import Stick, ball, cap, poly_blade
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else 'work/approaches/blender'); os.makedirs(OUT, exist_ok=True)
PX = 1; SIZE = 720   # the render is 720 px square; the figure a metre tall is about 550 px of it

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; vl = bpy.context.view_layer
WAR = bpy.data.collections.new('Warrior'); sc.collection.children.link(WAR)
SLI = bpy.data.collections.new('Slime'); sc.collection.children.link(SLI)

def srgb(h):
    h = h.lstrip('#'); v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in v)
def mixhex(a, b, k):
    A = [int(a.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]; B = [int(b.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    return '#' + ''.join('%02x' % round(A[i] + (B[i] - A[i]) * k) for i in range(3))
SUN_DIR = Vector((0.18, 0.55, -0.80)).normalized()   # down and away from the camera, a touch to the right: the light from above and in front, so tops are lit and undersides shaded

MATS = {}
def material(name, hexs, flat=False, shade=None, light=None):
    """two tones: the fill, and one cooler shade where the light does not reach; flat=True gives one tone (eye whites, ink)"""
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; n = m.node_tree.nodes; L = m.node_tree.links
    for x in list(n): n.remove(x)
    out = n.new('ShaderNodeOutputMaterial'); em = n.new('ShaderNodeEmission'); L.new(em.outputs[0], out.inputs[0])
    if flat:
        em.inputs['Color'].default_value = (*srgb(hexs), 1)
    else:
        dif = n.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
        rgb = n.new('ShaderNodeShaderToRGB'); L.new(dif.outputs[0], rgb.inputs[0])
        bw = n.new('ShaderNodeRGBToBW'); L.new(rgb.outputs['Color'], bw.inputs['Color'])
        ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
        sh = shade or mixhex(mixhex(hexs, '#000000', 0.28), '#4a3a9a', 0.22); li = light or mixhex(hexs, '#ffffff', 0.22)
        e = ramp.color_ramp.elements; e[0].position = 0.0; e[0].color = (*srgb(sh), 1); e[1].position = 0.30; e[1].color = (*srgb(hexs), 1)
        e2 = e.new(0.92); e2.color = (*srgb(li), 1)
        L.new(bw.outputs[0], ramp.inputs['Fac']); L.new(ramp.outputs['Color'], em.inputs['Color'])
    m.diffuse_color = (*srgb(hexs), 1); MATS[name] = m; return m

C = {}
def mats(d):
    for k, v in d.items(): C[k] = material(k, v[0], v[1], v[2] if len(v) > 2 else None)

def facing_ball(name, coll, mat, c, r, normal, flat=0.45, sz=1.0, parent=None):
    """a ball flattened along the face's normal: an eye, a brow, a mouth, a cheek"""
    nrm = Vector(normal).normalized(); rot = nrm.to_track_quat('X', 'Z').to_matrix()
    return ball(name, coll, mat, c, r, sx=flat, sy=1.0, sz=sz, rot=rot, parent=parent)

# ---------------------------------------------------------------- the Warrior: one skin, facing +X; a metre tall to the hair's top
def warrior():
    mats({'skin': ('#ffe2c2', False, '#f0b092'), 'hair': ('#ff6b3a', False, '#c8432a'), 'tunic': ('#3d7de4', False, '#2a56b0'), 'belt': ('#8a5a3a', False), 'trousers': ('#9a6a44', False, '#6e4a30'), 'boots': ('#5c3b2b', False, '#3a2418'),
          'steel': ('#eef2f8', False), 'gold': ('#f4c14a', False), 'white': ('#ffffff', True), 'ink': ('#2a2030', True), 'iris': ('#2d8f4e', True), 'cheek': ('#ffb0a0', True)})
    coll = WAR; S = Stick()
    hipsB = S.add((0.00, 0, 0.27), 0.145, mat='belt'); hips = S.add((0.00, 0, 0.31), 0.14, hipsB, 'tunic'); chest = S.add((0.01, 0, 0.46), (0.15, 0.13), hips, 'tunic')
    neck = S.add((0.02, 0, 0.56), 0.06, chest, 'skin'); S.add((0.02, 0, 0.60), 0.055, neck, 'skin')
    # the near arm (toward the camera, -Y) forward with the sword; the far arm hanging
    shF = S.add((0.04, -0.13, 0.52), 0.065, chest, 'tunic'); elF = S.add((0.14, -0.16, 0.43), 0.055, shF, 'tunic'); wrF = S.add((0.23, -0.13, 0.37), 0.045, elF, 'skin'); haF = S.add((0.27, -0.12, 0.36), 0.055, wrF, 'skin')
    shB = S.add((-0.04, 0.13, 0.52), 0.065, chest, 'tunic'); elB = S.add((-0.11, 0.15, 0.43), 0.055, shB, 'tunic'); wrB = S.add((-0.09, 0.12, 0.35), 0.045, elB, 'skin'); S.add((-0.08, 0.11, 0.32), 0.052, wrB, 'skin')
    for sy in (-1, 1):
        hip = S.add((0.02, sy * 0.07, 0.25), 0.075, hipsB, 'trousers'); kn = S.add((0.04, sy * 0.075, 0.15), 0.062, hip, 'trousers'); an = S.add((0.05, sy * 0.075, 0.06), 0.055, kn, 'boots'); S.add((0.14, sy * 0.075, 0.035), (0.05, 0.035), an, 'boots')
    body = S.build('warrior_body', coll, C, subdiv=2)
    # the head: an egg, slightly wider than tall
    hc = Vector((0.03, 0, 0.78)); ball('head', coll, C['skin'], hc, 0.235, sx=1.0, sy=0.98, sz=1.0, seg=24, rings=16)
    # the hair: a cap over the skull with the face cut clear, then big swept spikes to the back and three locks over the brow, one mass
    cap('hair_cap', coll, C['hair'], hc + Vector((-0.02, 0, 0.03)), 0.255, hc + Vector((0.05, -0.05, 0.02)), (-0.7, 0.55, 0.45), seg=24, rings=16)
    H = Stick()
    for (p, q, r0, r1) in [((-0.06, 0.02, 0.98), (-0.36, 0.06, 1.02), 0.085, 0.012), ((-0.12, -0.05, 0.92), (-0.42, -0.08, 0.84), 0.08, 0.012), ((-0.10, 0.07, 0.84), (-0.36, 0.11, 0.68), 0.07, 0.012),
                           ((0.03, 0.0, 1.00), (-0.16, 0.02, 1.12), 0.08, 0.012), ((0.12, -0.10, 0.97), (0.17, -0.17, 0.89), 0.05, 0.01), ((0.17, 0.00, 0.97), (0.23, -0.05, 0.89), 0.05, 0.01), ((0.08, -0.18, 0.95), (0.10, -0.24, 0.87), 0.045, 0.01)]:
        H.chain([p, ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2 + 0.015), q], (r0, r1), None, 'hair')
    H.build('hair_spikes', coll, C, subdiv=2)
    # the face: the near eye big, the far eye smaller, both looking forward; brows; a small mouth; a cheek
    for (ex, ey, r, k) in ((-0.03, -0.30, 0.055, 'F'), (0.19, -0.15, 0.046, 'B')):
        p = hc + Vector((ex, ey, 0.0)); n = (p - hc).normalized(); p = hc + n * 0.235
        facing_ball('eye' + k, coll, C['white'], p, r, n, flat=0.35, sz=1.35)
        facing_ball('iris' + k, coll, C['iris'], p + n * 0.012 + Vector((0.006, 0, -0.004)), r * 0.62, n, flat=0.3, sz=1.3)
        facing_ball('pupil' + k, coll, C['ink'], p + n * 0.02 + Vector((0.008, 0, -0.006)), r * 0.36, n, flat=0.3, sz=1.3)
        facing_ball('glint' + k, coll, C['white'], p + n * 0.028 + Vector((-0.006, 0, 0.022)), r * 0.2, n, flat=0.3)
        facing_ball('lid' + k, coll, C['skin'], p + n * 0.02 + Vector((0, 0, 0.055)), r * 1.0, n, flat=0.3, sz=0.32)   # the heavy upper lid: skin over the eye's top
        facing_ball('brow' + k, coll, C['hair'], p + n * 0.01 + Vector((0, 0, 0.1)), r * 0.9, n, flat=0.3, sz=0.22)
    mp = hc + Vector((0.10, -0.20, -0.12)); facing_ball('mouth', coll, C['ink'], mp, 0.028, (mp - hc), flat=0.3, sz=0.35)
    cp = hc + Vector((0.14, -0.20, -0.05)); facing_ball('cheek', coll, C['cheek'], cp, 0.04, (cp - hc), flat=0.2, sz=0.6)
    ep = hc + Vector((-0.06, -0.3, -0.04)); facing_ball('ear', coll, C['skin'], hc + (ep - hc).normalized() * 0.235, 0.032, (ep - hc), flat=0.4, sz=1.1)
    # the sword from the near hand: the blade up and forward, a guard, a pommel
    hand = Vector((0.27, -0.12, 0.36)); U = Vector((0.55, 0, 0.83)); V = Vector((0.83, 0, -0.55)); Wd = Vector((0, 1, 0))
    poly_blade('blade', coll, C['steel'], [(0.0, -0.028), (0.38, -0.022), (0.47, 0.0), (0.38, 0.022), (0.0, 0.028)], 0.012, hand + U * 0.05, U, V, Wd)
    poly_blade('guard', coll, C['gold'], [(-0.015, -0.07), (0.015, -0.07), (0.015, 0.07), (-0.015, 0.07)], 0.03, hand + U * 0.045, U, V, Wd)
    G = Stick(); G.chain([tuple(hand - U * 0.02), tuple(hand - U * 0.09)], (0.02, 0.024), None, 'belt'); G.build('grip', coll, C, subdiv=1)

# ---------------------------------------------------------------- the Slime: one squashed ball with a drip, the face big on its front; faces -X
def slime():
    mats({'slime': ('#78dc52', False, '#3f9a3a'), 'white': ('#ffffff', True), 'ink': ('#2a2030', True), 'mouth': ('#8a2a3e', True), 'tongue': ('#ff8aa0', True), 'cheek': ('#ffb0a0', True)})
    coll = SLI; c = Vector((0, 0, 0.42))
    ball('slime_body', coll, C['slime'], c, 0.47, sx=1.08, sy=1.0, sz=0.9, seg=28, rings=18)
    D = Stick(); D.chain([(0.06, 0.0, 0.80), (0.10, 0.0, 0.86), (0.12, 0.0, 0.92)], (0.07, 0.012), None, 'slime'); D.build('drip', coll, C, subdiv=2)
    for (ey, r, k) in ((-0.22, 0.11, 'F'), (0.08, 0.095, 'B')):
        d = Vector((-0.30, ey - 0.25, 0.08)).normalized(); p = c + Vector((d.x * 0.47 * 1.08, d.y * 0.47, d.z * 0.47 * 0.9))
        facing_ball('s_eye' + k, coll, C['white'], p, r, d, flat=0.3, sz=1.3)
        facing_ball('s_pupil' + k, coll, C['ink'], p + d * 0.02 + Vector((-0.02, -0.01, 0)), r * 0.62, d, flat=0.3, sz=1.25)
        facing_ball('s_glint' + k, coll, C['white'], p + d * 0.03 + Vector((-0.03, -0.01, 0.04)), r * 0.25, d, flat=0.3)
    d = Vector((-0.45, -0.75, -0.25)).normalized(); p = c + Vector((d.x * 0.47 * 1.08, d.y * 0.47, d.z * 0.47 * 0.9))
    facing_ball('s_mouth', coll, C['mouth'], p, 0.13, d, flat=0.25, sz=0.55); facing_ball('s_tongue', coll, C['tongue'], p + d * 0.01 + Vector((0, 0, -0.03)), 0.06, d, flat=0.25, sz=0.5)
    for ey in (-0.42, 0.26):
        d = Vector((-0.2, ey - 0.3, 0.0)).normalized(); p = c + Vector((d.x * 0.47 * 1.08, d.y * 0.47, d.z * 0.47 * 0.9)); facing_ball('s_cheek%d' % (ey > 0), coll, C['cheek'], p, 0.055, d, flat=0.2, sz=0.6)

# ---------------------------------------------------------------- the light, the camera, the line, the render
def setup():
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = 3.0; d.angle = 0.0; o = bpy.data.objects.new('Sun', d); sc.collection.objects.link(o)
    o.rotation_euler = SUN_DIR.to_track_quat('-Z', 'Y').to_euler()
    w = bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.12, 0.12, 0.13, 1)
    cd = bpy.data.cameras.new('Camera'); cd.type = 'ORTHO'; cd.ortho_scale = 1.3; co = bpy.data.objects.new('Camera', cd); sc.collection.objects.link(co)
    co.location = (0, -12, 0.55); co.rotation_euler = (math.pi / 2, 0, 0); sc.camera = co
    r = sc.render; r.engine = 'BLENDER_EEVEE'; r.resolution_x = r.resolution_y = SIZE; r.resolution_percentage = 100; r.film_transparent = True
    r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.filter_size = 1.0; sc.eevee.taa_render_samples = 24
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    r.use_freestyle = True; r.line_thickness_mode = 'ABSOLUTE'; r.line_thickness = 1.0; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = math.radians(110); fs.as_render_pass = False
    for ls in list(fs.linesets): fs.linesets.remove(ls)
    def lineset(name, thick, outer):
        ls = fs.linesets.new(name); ls.select_silhouette = not outer; ls.select_border = not outer; ls.select_crease = not outer
        ls.select_external_contour = outer; ls.select_contour = False; ls.select_by_visibility = True; ls.visibility = 'VISIBLE'
        st = ls.linestyle; st.color = srgb('#2a2030'); st.thickness = thick; st.alpha = 1.0; st.caps = 'ROUND'; st.use_chaining = True; st.chaining = 'PLAIN'
        cal = st.thickness_modifiers.new('nib', 'CALLIGRAPHY'); cal.orientation = math.radians(40); cal.thickness_min = thick * 0.45; cal.thickness_max = thick * 1.5
        al = st.thickness_modifiers.new('taper', 'ALONG_STROKE'); al.value_min = thick * 0.35; al.value_max = thick * 1.0; al.blend = 'MULTIPLY'; al.influence = 0.6
        return st
    lineset('contour', 2.8, True); lineset('inner', 1.3, False)

def render(coll_on, coll_off, name):
    coll_off.hide_render = True; coll_on.hide_render = False
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)

warrior(); slime(); setup()
render(WAR, SLI, 'warrior'); render(SLI, WAR, 'slime')
print('wrote', OUT)
