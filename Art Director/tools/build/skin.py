"""Bodies sculpted from a radius-skeleton (2026-10-14, the studio; Robin: the väsen look like wooden dolls, they need complete
redesigns). The old way built a figure from spheres and tapered tubes with a ball at every joint: a mannequin, whatever the
finish. Here a figure is a stick figure with a radius at every joint (Blender's Skin modifier, then subdivision): one
continuous surface, limbs flowing into the torso, thick where the figure is heavy and thin where it is lean, no seams and
no balls. Each stick edge carries a material, and every face of the sculpted surface takes the material of the nearest edge,
so a mail shirt, bare arms and a hide skirt are one body. Hair, weed, fingers, beards and tails are thin chains of the same
kind. A concept is posed by placing the joints where they are; a model to animate is built in its rest pose and bound to a
rig by the same nearest-edge rule (weights blended at the joints)."""
import bpy, bmesh, math
from mathutils import Vector, Matrix

class Stick:
    """vertices with radii, edges with materials; build() sculpts it"""
    def __init__(self):
        self.v = []; self.r = []; self.e = []; self.em = []; self.root = []
    def add(self, p, r, parent=None, mat='skin', root=False):
        self.v.append(Vector(p)); self.r.append(r if isinstance(r, (tuple, list)) else (r, r)); i = len(self.v) - 1
        if parent is not None: self.e.append((parent, i)); self.em.append(mat)
        if root or parent is None: self.root.append(i)
        return i
    def chain(self, pts, radii, parent=None, mat='skin'):
        """a run of joints: pts[k] with radii[k] (a list or a (start, end) pair tapered); returns the last index"""
        n = len(pts)
        if len(radii) == 2 and n != 2: radii = [radii[0] + (radii[1] - radii[0]) * k / (n - 1) for k in range(n)]
        last = parent
        for p, r in zip(pts, radii): last = self.add(p, r, last, mat)
        return last
    def build(self, name, coll, mats, subdiv=2, smooth=True, branch=0.4, parent=None, skin_only=False):
        """mats: name -> material. Returns the sculpted mesh object (the stick itself is thrown away)."""
        me = bpy.data.meshes.new(name + '_stick'); bm = bmesh.new(); lay = bm.verts.layers.skin.verify()
        bv = []
        for p, r in zip(self.v, self.r):
            v = bm.verts.new(p); v[lay].radius = (r[0], r[1]); bv.append(v)
        for i in self.root: bv[i][lay].use_root = True
        for a, b in self.e: bm.edges.new((bv[a], bv[b]))
        bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new(name + '_stick', me); coll.objects.link(o)
        sk = o.modifiers.new('Skin', 'SKIN'); sk.use_smooth_shade = smooth; sk.branch_smoothing = branch
        if not skin_only: sb = o.modifiers.new('Sub', 'SUBSURF'); sb.levels = subdiv; sb.render_levels = subdiv
        bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
        me2 = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); me2.name = name
        bpy.data.objects.remove(o); bpy.data.meshes.remove(me)
        o2 = bpy.data.objects.new(name, me2); coll.objects.link(o2)
        names = sorted(set(self.em)); idx = {n: k for k, n in enumerate(names)}
        for n in names: me2.materials.append(mats[n])
        segs = [(self.v[a], self.v[b], self.em[k]) for k, (a, b) in enumerate(self.e)]
        for poly in me2.polygons:
            c = poly.center; best = None; bd = 1e9
            for (p, q, m) in segs:
                d = q - p; L2 = d.length_squared; t = 0.0 if L2 < 1e-9 else max(0.0, min(1.0, (c - p).dot(d) / L2)); dd = (c - (p + d * t)).length
                if dd < bd: bd = dd; best = m
            poly.material_index = idx[best]; poly.use_smooth = smooth
        if parent is not None: o2.parent = parent
        return o2

def loft(name, coll, mats, rings, seg=16, smooth=True, ring_mat=None, wave=None, parent=None, closed=True, arc=None, edge=None, flip=False):
    """rings: (center (x, y, z), rx, ry) lying flat, stacked; wave(k, a) perturbs a ring's radius by the angle round it (a
    ragged hem, a fold); ring_mat the material name per band and cap. arc: (a0, a1) or a function of the row giving the angles
    an open strip runs between (a dress mouldered away at the back, a hollow trunk); edge(k, i, n) perturbs the strip's two
    edges (a ragged rim); flip turns the faces inward (the inside of a hollow)."""
    bm = bmesh.new(); R = []
    for k, ring in enumerate(rings):
        c, rx, ry = Vector(ring[0]), ring[1], ring[2]; row = []
        if arc:
            a0, a1 = arc(k) if callable(arc) else arc; angs = [a0 + (a1 - a0) * i / seg for i in range(seg + 1)]
        else: angs = [2 * math.pi * (i + 0.5) / seg for i in range(seg)]
        for i, a in enumerate(angs):
            w = (wave(k, a) if wave else 1.0) * (edge(k, i, len(angs)) if edge else 1.0)
            row.append(bm.verts.new(c + Vector((math.cos(a) * rx * w, math.sin(a) * ry * w, 0))))
        R.append(row)
    names = sorted(set(ring_mat)) if ring_mat else [None]; n = len(R[0]); wrap = not arc
    for ri, (a, b) in enumerate(zip(R, R[1:])):
        for i in range(n if wrap else n - 1):
            f = bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
            if ring_mat: f.material_index = names.index(ring_mat[ri])
    if closed and wrap:
        f0 = bm.faces.new(R[0][::-1]); f1 = bm.faces.new(R[-1])
        if ring_mat: f0.material_index = names.index(ring_mat[0]); f1.material_index = names.index(ring_mat[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if flip: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o)
    if ring_mat:
        for n in names: me.materials.append(mats[n])
    else: me.materials.append(mats)
    if parent is not None: o.parent = parent
    return o

def ball(name, coll, mat, c, r, sx=1.0, sy=1.0, sz=1.0, seg=14, rings=10, rot=None, parent=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        p = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
        if rot is not None: p = rot @ p
        v.co = p + Vector(c)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); coll.objects.link(o)
    if parent is not None: o.parent = parent
    return o

def cap(name, coll, mat, c, r, plane_point, plane_normal, sx=1.0, sy=1.0, sz=1.0, seg=14, rings=10, parent=None):
    """a sphere with one side cut away (a cap of hair that leaves the face clear: hero2_build's cap)"""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector(plane_point), plane_no=Vector(plane_normal).normalized(), clear_inner=True)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); coll.objects.link(o)
    if parent is not None: o.parent = parent
    return o

def face_uvs(o):
    """the painted face's UV maps on a head (hero2_build.py's): the head's own box seen from the front, and the depth for the mask"""
    me = o.data; xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    x0, x1, y0, y1, z0, z1 = min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)
    uf = me.uv_layers.new(name='face'); ub = me.uv_layers.new(name='facefront')
    for lp in me.loops:
        v = me.vertices[lp.vertex_index].co
        uf.data[lp.index].uv = ((v.x - x0) / (x1 - x0), (v.z - z0) / (z1 - z0)); ub.data[lp.index].uv = ((v.y - y0) / (y1 - y0), 0.0)

def head(name, coll, mat, c, r, tilt=0.0, turn=0.0, sx=0.92, sy=1.0, sz=1.08, parent=None):
    """an egg of a head with the face decal, pitched down by tilt degrees and turned by turn; the box is taken before the turn"""
    o = ball(name, coll, mat, (0, 0, 0), r, sx, sy, sz, 16, 12, parent=parent); face_uvs(o)
    o.rotation_euler = (math.radians(-tilt), 0, math.radians(turn)); o.location = c
    return o

def poly_blade(name, coll, mat, pts, t, origin, U, V, W, parent=None):
    """a flat shape cut from an outline (pts in the U, V plane, scale 1), thick t along W, at origin"""
    bm = bmesh.new(); a = [bm.verts.new(origin + U * u + V * v + W * (t / 2)) for (u, v) in pts]; b = [bm.verts.new(origin + U * u + V * v - W * (t / 2)) for (u, v) in pts]
    n = len(pts); fa = bm.faces.new(a); fb = bm.faces.new(b[::-1])
    for i in range(n): bm.faces.new((a[i], b[i], b[(i + 1) % n], a[(i + 1) % n]))
    bmesh.ops.triangulate(bm, faces=[fa, fb]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    o = bpy.data.objects.new(name, me); coll.objects.link(o)
    if parent is not None: o.parent = parent
    return o
