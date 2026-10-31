"""The painted look for everything rendered from Blender (Perry, AD, 2026-10-31; adapted from the Survival game's toon.py,
whose cel finish Robin chose there; here the painted one is the point: docs/direction.md section 1).

The look: soft shading in several gentle steps (a colour ramp with eased stops: deep shade, shade, base, light, highlight,
each a chosen colour from the base, the shade cooler and the light warmer), a faint mottle in the fill, a soft darkening
toward the silhouette so round things look round, a thin dark Freestyle line, light from above and a little from the
front left. Materials are unlit (emission), so the colours on the sheet are the colours chosen.

A material remembers its colour (custom property 'hex'); restyle() rebuilds every material's nodes at render time, so a
builder only names colours. The camera is orthographic: side on (elevation 0) for fight sprites, a touch from above
(elevation about 30) for board props. The sun points down, a little to the right and away, so the light comes from the
upper left in front: tops bright, undersides dark, the same side lit whatever faces the camera."""
import bpy, math, colorsys
from mathutils import Vector

INK = '#2b2320'                                      # the warm dark line (the mock-ups' ink)
SUN_DIR = Vector((0.30, 0.22, -0.93)).normalized()  # travels down, a little to the right and away: light from above, upper left, in front
SUN_ENERGY = 3.3                                     # in EEVEE the diffuse value is about energy * cos / pi: at 3.3 a face square to the sun reads 1.0
AMBIENT = (0.26, 0.27, 0.32)                        # the world's light on the unlit side (cool, so shade tones show, never black)
COOL = (0.22, 0.24, 0.48)                            # mixed into the shade tones (a cool shadow, never the same hue darkened)
WARM = (1.0, 0.96, 0.82)                             # mixed into the light tones
STEPS = {'deep': -0.24, 'shade': -0.12, 'base': 0.0, 'light': 0.10, 'hi': 0.19}   # lightness change per tone (hi was 0.24: the cap's top went pastel)
MOTTLE = 0.04                                        # the painted texture in the fill (0 flat)
TURN = 0.14                                          # darkening toward the silhouette (0 none)
GLOSS = 0.55                                         # the glossy highlight where the sun reflects to the camera (the reference's monsters shine: the Slime, the Mushroom's cap); 0 matte
GLOSS_ROUGH = 0.32

def srgb(hexs):
    h = hexs.lstrip('#'); v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in v)
def hex_of(rgb): return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c * 255)))) for c in rgb)
def tones(hexs, sat=1.0):
    """the five tones of a base colour, as sRGB hex: deep and shade darker, more saturated and cooler; light and highlight
    lighter and warmer. A builder may give its own 'tones' on a material instead."""
    h = hexs.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)); hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    out = {}
    for name, dl in STEPS.items():
        l2 = max(0.03, min(0.97, ll + dl)); s2 = min(1.0, ss * (1.10 if dl < 0 else 0.96 if dl > 0 else 1.0) * sat)
        c = colorsys.hls_to_rgb(hh, l2, s2)
        if dl < 0: k = 0.30 if name == 'deep' else 0.16; c = tuple(c[i] * (1 - k) + COOL[i] * k * min(1.0, ll / 0.45 + 0.3) for i in range(3))
        if dl > 0: k = 0.22 if name == 'hi' else 0.10; c = tuple(c[i] * (1 - k) + WARM[i] * k for i in range(3))
        out[name] = hex_of(c)
    return out

def _sock(node, name, kind, outputs=False):
    for s in (node.outputs if outputs else node.inputs):
        if s.name == name and s.type == kind: return s
    raise KeyError(name + ' ' + kind)
def _is_sock(v): return hasattr(v, 'is_output')
def _mix(n, L, blend, fac, a, b):
    m = n.new('ShaderNodeMix'); m.data_type = 'RGBA'; m.blend_type = blend
    for sock, v in ((m.inputs['Factor'], fac), (_sock(m, 'A', 'RGBA'), a), (_sock(m, 'B', 'RGBA'), b)):
        if _is_sock(v): L.new(v, sock)
        elif isinstance(v, (int, float)): sock.default_value = v
        else: sock.default_value = (*v, 1)
    return _sock(m, 'Result', 'RGBA', True)
def _math(n, L, op, a, b):
    m = n.new('ShaderNodeMath'); m.operation = op
    for sock, v in ((m.inputs[0], a), (m.inputs[1], b)):
        if _is_sock(v): L.new(v, sock)
        else: sock.default_value = v
    return m.outputs[0]
def _gray(n, L, v):
    c = n.new('ShaderNodeCombineColor'); L.new(v, c.inputs[0]); L.new(v, c.inputs[1]); L.new(v, c.inputs[2]); return c.outputs[0]
def _light(n, L):
    """the diffuse light on the surface as one value"""
    dif = n.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
    rgb = n.new('ShaderNodeShaderToRGB'); L.new(dif.outputs[0], rgb.inputs[0])
    val = n.new('ShaderNodeRGBToBW'); L.new(rgb.outputs['Color'], val.inputs['Color'])
    return val.outputs[0]

def build_nodes(m):
    """the painted ramp: the light value through eased stops, each tone a plateau with a soft edge between"""
    t = m.get('tones') or tones(m['hex'], m.get('sat', 1.0))
    m.use_nodes = True; nt = m.node_tree; n, L = nt.nodes, nt.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial'); em = n.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    v = _light(n, L)
    ramp = n.new('ShaderNodeValToRGB'); cr = ramp.color_ramp; cr.interpolation = 'EASE'
    stops = [(0.00, 'deep'), (0.24, 'deep'), (0.28, 'shade'), (0.48, 'shade'), (0.52, 'base'), (0.74, 'base'), (0.78, 'light'), (0.92, 'light'), (0.95, 'hi')]   # harder steps (Colin, AD: the monster was soft where the painted things are hard; one hand)
    if m.get('flat'): stops = [(0.0, 'base'), (1.0, 'base')]            # eyes' whites, a glow: one tone, no shading
    if m.get('matte'): stops = [s for s in stops if s[1] != 'hi']        # no highlight (cloth, earth)
    while len(cr.elements) > 1: cr.elements.remove(cr.elements[-1])
    cr.elements[0].position = stops[0][0]; cr.elements[0].color = (*srgb(t[stops[0][1]]), 1)
    for pos, name in stops[1:]:
        e = cr.elements.new(pos); e.color = (*srgb(t[name]), 1)
    L.new(v, ramp.inputs['Fac']); col = ramp.outputs['Color']
    if MOTTLE and not m.get('flat'):                                     # the painted fill: a soft mottle, never grain
        tc = n.new('ShaderNodeTexCoord'); nz = n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 5.5; nz.inputs['Detail'].default_value = 3; nz.inputs['Roughness'].default_value = 0.6
        L.new(tc.outputs['Object'], nz.inputs['Vector'])
        mot = _math(n, L, 'ADD', _math(n, L, 'MULTIPLY', _math(n, L, 'SUBTRACT', nz.outputs['Fac'], 0.5), MOTTLE * 2), 1.0)
        col = _mix(n, L, 'MULTIPLY', 1.0, col, _gray(n, L, mot))
    if TURN and not m.get('flat'):                                       # darker where the surface turns away: the chunky, round look
        lw = n.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.6
        turn = _math(n, L, 'SUBTRACT', 1.0, _math(n, L, 'MULTIPLY', _math(n, L, 'POWER', lw.outputs['Fresnel'], 2.0), TURN))
        col = _mix(n, L, 'MULTIPLY', 1.0, col, _gray(n, L, turn))
    gloss = m.get('gloss', GLOSS)
    if gloss and not m.get('flat') and not m.get('matte'):                # the shine: a glossy reflection of the sun, eased in, laid as a pale warm spot
        gl = n.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = GLOSS_ROUGH; gl.inputs['Color'].default_value = (1, 1, 1, 1)
        grgb = n.new('ShaderNodeShaderToRGB'); L.new(gl.outputs[0], grgb.inputs[0]); gbw = n.new('ShaderNodeRGBToBW'); L.new(grgb.outputs['Color'], gbw.inputs['Color'])
        k = n.new('ShaderNodeMapRange'); k.inputs['From Min'].default_value = 0.35; k.inputs['From Max'].default_value = 1.1; k.interpolation_type = 'SMOOTHSTEP'; L.new(gbw.outputs[0], k.inputs['Value'])
        shine = tuple(min(1.0, c * 0.5 + 0.5) for c in srgb(t['hi']))
        col = _mix(n, L, 'MIX', _math(n, L, 'MULTIPLY', k.outputs['Result'], gloss), col, shine)
    L.new(col, em.inputs['Color']); L.new(em.outputs[0], out.inputs['Surface'])

def material(name, hexs, flat=False, matte=False, sat=1.0, tones_=None, gloss=None):
    """a named colour. flat: one tone, unshaded (eye whites, glows). matte: no highlight, no shine. gloss: the shine's strength (GLOSS by default). tones_: the five tones by hand."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m['hex'] = hexs
    if flat: m['flat'] = 1
    if matte: m['matte'] = 1
    if gloss is not None: m['gloss'] = gloss
    if sat != 1.0: m['sat'] = sat
    if tones_: m['tones'] = tones_
    build_nodes(m); m.diffuse_color = (*srgb(hexs), 1)
    return m
def restyle():
    for m in bpy.data.materials:
        if 'hex' in m: build_nodes(m)

def sun(scene):
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = SUN_ENERGY; d.angle = math.radians(6)   # a slightly soft shadow edge
    o = bpy.data.objects.new('Sun', d); scene.collection.objects.link(o)
    o.rotation_euler = SUN_DIR.to_track_quat('-Z', 'Y').to_euler()
    return o
def camera(scene, elev_deg=0, ortho=1.6, aim_z=0.5, aim_x=0.0):
    """orthographic, looking along +Y from -Y; elev_deg above the ground; ortho the frame's width in metres; aim_z the frame's centre height"""
    d = bpy.data.cameras.new('Camera'); d.type = 'ORTHO'; d.ortho_scale = ortho; d.clip_start = 0.1; d.clip_end = 100
    o = bpy.data.objects.new('Camera', d); scene.collection.objects.link(o)
    e = math.radians(elev_deg); dist = 20
    o.location = (aim_x, -dist * math.cos(e), aim_z + dist * math.sin(e)); o.rotation_euler = (math.pi / 2 - e, 0, 0)
    scene.camera = o
    return o
def world(scene):
    w = bpy.data.worlds.get('World') or bpy.data.worlds.new('World'); scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (*AMBIENT, 1); bg.inputs[1].default_value = 1.0
def freestyle(scene, view_layer, px, weight=1.0, collection=None):
    """the thin dark line: the outer contour a little heavier, an inner line at silhouettes, borders and where two colours
    meet (eyes, spots, a belt); none on creases of a smooth blob. px is the file scale (2 for our 2x files)."""
    r = scene.render; r.use_freestyle = True; r.line_thickness_mode = 'ABSOLUTE'; r.line_thickness = 1.0
    view_layer.use_freestyle = True
    fs = view_layer.freestyle_settings; fs.crease_angle = math.radians(110); fs.as_render_pass = False
    for ls in list(fs.linesets): fs.linesets.remove(ls)
    def lineset(name, thick, outer):
        ls = fs.linesets.new(name)
        ls.select_silhouette = not outer; ls.select_border = not outer; ls.select_crease = False; ls.select_material_boundary = not outer
        ls.select_external_contour = outer; ls.select_contour = False; ls.select_by_visibility = True; ls.visibility = 'VISIBLE'
        if collection is not None: ls.select_by_collection = True; ls.collection = collection
        st = ls.linestyle; st.color = srgb(INK); st.thickness = thick * px * weight; st.alpha = 1.0; st.caps = 'ROUND'; st.use_chaining = True; st.chaining = 'PLAIN'
        return st
    lineset('contour', 1.35, True)
    lineset('inner', 0.95, False)
    return fs
def setup_render(scene, w, h, px, samples=16):
    r = scene.render; r.engine = 'BLENDER_EEVEE'; r.resolution_x = w * px; r.resolution_y = h * px; r.resolution_percentage = 100
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.image_settings.color_depth = '8'
    r.filter_size = 1.0
    scene.eevee.taa_render_samples = samples
    scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
    scene.display_settings.display_device = 'sRGB'
def stage(scene, view_layer, w, h, px, elev=0, ortho=1.6, aim_z=0.5, aim_x=0.0, samples=16, line=1.0):
    """everything a render needs: the look on every material, the world, the sun, the camera, the line, the output"""
    for o in list(scene.objects):
        if o.type in ('LIGHT', 'CAMERA'): bpy.data.objects.remove(o)
    restyle(); world(scene); sun(scene); cam = camera(scene, elev, ortho, aim_z, aim_x); freestyle(scene, view_layer, px, line); setup_render(scene, w, h, px, samples)
    return cam
