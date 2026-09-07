"""Build the authored, metre-scale training environment with Blender 4.3+ / 5.x.

Run from any directory:
    blender -b -P scripts/blender/build_training_ground.py
Optional args after --: --preview, --skip-character, --output /absolute/file.glb

All layout coordinates below are glTF/Three Y-up: (x, height, z). The scene is
converted to Blender Z-up once at mesh creation and back by the glTF exporter.
No textures, downloads or third-party Python modules are required. Vertex colour
variation is baked into glTF-compatible COLOR_0 + Principled BSDF materials.
"""
import argparse
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("--preview", action="store_true")
parser.add_argument("--skip-character", action="store_true")
parser.add_argument("--output", type=Path, default=ROOT / "public/models/training/training-ground.glb")
OPTIONS = parser.parse_args(ARGS)
RNG = random.Random(24681)
TAU = math.tau

# The pedestrian route, parade ground, and observation circles are level y=0.
OBSERVATION_POINTS = {
    "formationArea": [-15, 0, 4], "movementArea": [0, 0, 10],
    "vegetationArea": [-16, 0, -9], "wallArea": [8, 0, -3],
    "sandbagArea": [18, 0, -1], "trenchArea": [15, 0, -10],
    "openArea": [22, 0, 12],
}
ZONE_CENTERS = {
    "formationArea": [-15, 0, 4], "movementArea": [0, 0, 10],
    "vegetationArea": [-18, 0, -14], "wallArea": [8, 0, -7],
    "sandbagArea": [18, 0, -5], "trenchArea": [15, -0.9, -16],
    "openArea": [22, 0, 12],
}
TRENCH_PATH = [(7, -18), (11, -18), (13.8, -15.5), (18, -15.5), (20, -18), (24, -18)]


def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x-a)/(b-a)))
    return t*t*(3-2*t)


def noise2(x, z):
    return (math.sin(x*.37+math.sin(z*.19))*.47 + math.cos(z*.41-x*.13)*.28
            + math.sin(x*.91+z*.72)*.14 + math.cos(x*1.83-z*1.51)*.07)


def distance_segment(x, z, a, b):
    dx, dz = b[0]-a[0], b[1]-a[1]
    t = max(0, min(1, ((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
    return math.hypot(x-a[0]-t*dx, z-a[1]-t*dz)


def trench_distance(x, z):
    return min(distance_segment(x, z, a, b) for a, b in zip(TRENCH_PATH, TRENCH_PATH[1:]))


def height_at(x, z):
    """Deterministic source of truth, mirrored by the exported sample grid."""
    h = .13 + .13*noise2(x, z) + .22*math.exp(-((x+5)**2+(z+18)**2)/37)
    # Quiet earth mounds behind the training area and to the right of the trench.
    h += .85*math.exp(-((x-27)**2/13+(z+13)**2/19))
    h += .48*math.exp(-((x+26)**2/24+(z+17)**2/22))
    parade = max(-26-x, x+6, -4-z, z-13, 0)
    h *= smoothstep(0, 1.8, parade)
    lane = max(-8-x, x-10, abs(z-10)-1.8, 0)
    h *= smoothstep(0, 1.0, lane)
    for px, _, pz in OBSERVATION_POINTS.values():
        h *= smoothstep(1.8, 3.1, math.hypot(x-px, z-pz))
    d = trench_distance(x, z)
    depression = 1-smoothstep(.58, 1.18, d)
    h = h*(1-depression)-1.08*depression
    h += .25*math.exp(-((d-1.55)/.42)**2)
    return h


def blender_point(p):
    return (p[0], -p[2], p[1])


def tint(color, factor):
    return tuple(min(1, max(0, c*factor)) for c in color[:3]) + (1,)


MATERIALS = {}
BATCHES = {}


def material(name, color, roughness=.94, metallic=0, vertex=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color[:3], 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if vertex:
        attr = mat.node_tree.nodes.new("ShaderNodeVertexColor")
        attr.layer_name = "Col"
        mat.node_tree.links.new(attr.outputs["Color"], shader.inputs["Base Color"])
    mat.diffuse_color = (*color[:3], 1)
    MATERIALS[name] = mat
    return mat


class Batch:
    def __init__(self, name, mat, smooth=True):
        self.name, self.mat, self.smooth = name, mat, smooth
        self.verts, self.faces, self.colors = [], [], []

    def add(self, verts, faces, color=(1, 1, 1, 1), colors=None):
        off = len(self.verts)
        self.verts.extend(verts)
        self.faces.extend(tuple(i+off for i in f) for f in faces)
        self.colors.extend(colors if colors else [color]*len(verts))

    def finish(self):
        if not self.faces:
            return None
        mesh = bpy.data.meshes.new(self.name+"_mesh")
        mesh.from_pydata([blender_point(v) for v in self.verts], [], self.faces)
        mesh.materials.append(MATERIALS[self.mat])
        mesh.update()
        if MATERIALS[self.mat].node_tree.nodes.get("Vertex Color"):
            attr = mesh.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
            for i, c in enumerate(self.colors):
                attr.data[i].color = c
        for polygon in mesh.polygons:
            polygon.use_smooth = self.smooth
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.collection.objects.link(obj)
        obj["zone"] = self.name.split("_")[0]
        obj["units"] = "metres"
        return obj


def batch(name, mat="organic", smooth=True):
    key = (name, mat, smooth)
    if key not in BATCHES:
        BATCHES[key] = Batch(name, mat, smooth)
    return BATCHES[key]


def foliage(target, center, scale, color, seed, rings=7, segments=11, turn=0):
    verts, faces, colors = [], [], []
    # A continuous rippled canopy rather than intersecting perfect spheres.
    for j in range(rings+1):
        phi = math.pi*j/rings
        for i in range(segments):
            theta = TAU*i/segments
            ripple = 1 + .13*math.sin(3*theta+seed+2*phi) + .085*math.cos(5*phi+seed)
            dx = math.sin(phi)*math.cos(theta)*scale[0]*ripple
            dz = math.sin(phi)*math.sin(theta)*scale[2]*ripple
            dy = math.cos(phi)*scale[1]*(1+.065*math.sin(4*theta+seed))
            verts.append((center[0]+dx*math.cos(turn)-dz*math.sin(turn), center[1]+dy,
                          center[2]+dx*math.sin(turn)+dz*math.cos(turn)))
            value = .86+.13*(math.cos(phi)+1)/2+.09*math.sin(theta*3+phi*4+seed)
            colors.append(tint(color, value))
    for j in range(rings):
        for i in range(segments):
            a=j*segments+i; b=j*segments+(i+1)%segments
            faces.append((a, b, b+segments, a+segments))
    target.add(verts, faces, colors=colors)


def rod(target, a, b, radius, color, radius_top=None, sides=9):
    axis=Vector(b)-Vector(a)
    direction=axis.normalized()
    ref=Vector((0,1,0)) if abs(direction.y)<.9 else Vector((1,0,0))
    u=direction.cross(ref).normalized(); v=direction.cross(u).normalized()
    radius_top=radius if radius_top is None else radius_top
    verts=[]
    for p,r in ((a,radius),(b,radius_top)):
        for i in range(sides):
            vec=Vector(p)+(u*math.cos(TAU*i/sides)+v*math.sin(TAU*i/sides))*r
            verts.append(tuple(vec))
    faces=[tuple(reversed(range(sides))),tuple(range(sides,2*sides))]
    faces.extend((i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides))
    target.add(verts,faces,color)


def block(target, center, size, color, bevel=.04, yaw=0):
    """Rounded cuboid with true curved edge geometry, shared across prop batches."""
    h=[s/2 for s in size]; r=min(bevel, min(h)*.8)
    verts=[]; faces=[]
    for axis in range(3):
        u=(axis+1)%3; v=(axis+2)%3
        for sign in (-1,1):
            off=len(verts)
            for j in range(4):
                for i in range(4):
                    p=[0,0,0]
                    p[axis]=sign*h[axis]
                    p[u]=[-h[u],-h[u]+r,h[u]-r,h[u]][i]
                    p[v]=[-h[v],-h[v]+r,h[v]-r,h[v]][j]
                    core=[max(-h[k]+r,min(h[k]-r,p[k])) for k in range(3)]
                    delta=Vector([p[k]-core[k] for k in range(3)])
                    q=Vector(core)+delta.normalized()*r
                    x=q.x*math.cos(yaw)-q.z*math.sin(yaw)
                    z=q.x*math.sin(yaw)+q.z*math.cos(yaw)
                    verts.append((center[0]+x,center[1]+q.y,center[2]+z))
            for j in range(3):
                for i in range(3):
                    a=off+j*4+i
                    face=(a,a+1,a+5,a+4)
                    faces.append(face if sign>0 else tuple(reversed(face)))
    target.add(verts,faces,color)


def ground_color(x,z):
    n=noise2(x*.7,z*.7)
    dry=smoothstep(.02,.6,noise2(x*.32+17,z*.31-21))
    grass=(.135,.218,.075)
    soil=(.21,.225,.105)
    col=tuple(grass[i]*(1-dry*.5)+soil[i]*dry*.5 for i in range(3))
    d=trench_distance(x,z)
    if d<2.25:
        t=1-smoothstep(1.7,2.25,d)
        earth=(.245,.171,.093)
        col=tuple(col[i]*(1-t)+earth[i]*t for i in range(3))
    return tint(col,1+n*.12)


def build_terrain():
    b=batch("terrain_sculpted_surface")
    nx,nz=280,220  # 25 cm grid makes the depressed trench geometric and continuous.
    verts=[];colors=[];faces=[]
    for j in range(nz+1):
        z=-27.5+55*j/nz
        for i in range(nx+1):
            x=-35+70*i/nx
            verts.append((x,height_at(x,z),z));colors.append(ground_color(x,z))
    for j in range(nz):
        for i in range(nx):
            a=j*(nx+1)+i
            faces.append((a,a+nx+1,a+nx+2,a+1))
    b.add(verts,faces,colors=colors)
    # An earth profile gives a finished island silhouette from orbital views.
    b=batch("terrain_earth_profile", "organic", False)
    perimeter=[]
    for i in range(141):perimeter.append((-35+i*.5,-27.5))
    for j in range(1,111):perimeter.append((35,-27.5+j*.5))
    for i in range(1,141):perimeter.append((35-i*.5,27.5))
    for j in range(1,110):perimeter.append((-35,27.5-j*.5))
    for k,(x,z) in enumerate(perimeter):
        xx,zz=perimeter[(k+1)%len(perimeter)]
        b.add([(x,height_at(x,z)-.015,z),(xx,height_at(xx,zz)-.015,zz),(xx,-1.6,zz),(x,-1.6,z)],[(0,1,2,3)],tint((.16,.119,.077),.92+.1*math.sin(k*.29)))
    block(batch("terrain_lower_foundation","organic",False),(0,-1.65,0),(70.06,.14,55.06),(.11,.097,.066,1),.06)


def path_strip(name, points, width, color):
    b=batch(name)
    verts=[];colors=[];faces=[]
    sampled=[]
    for a,c in zip(points,points[1:]):
        count=max(2,math.ceil(math.dist(a,c)/.5))
        for i in range(count):
            t=i/count;sampled.append((a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t))
    sampled.append(points[-1])
    for k,(x,z) in enumerate(sampled):
        a=sampled[max(0,k-1)];c=sampled[min(len(sampled)-1,k+1)]
        dx,dz=c[0]-a[0],c[1]-a[1];l=math.hypot(dx,dz)
        for u in (-1,-.83,0,.83,1):
            edge=width*.5*(1+.025*math.sin(k*.41))*u
            xx=x-dz/l*edge;zz=z+dx/l*edge
            verts.append((xx,height_at(xx,zz)+.022,zz))
            variation=1+.04*noise2(xx*2,zz*2)
            col=tint(color,variation)
            if abs(u)==1:
                gc=ground_color(xx,zz)
                col=tuple(col[i]*.52+gc[i]*.48 for i in range(3))+(1,)
            colors.append(col)
    for k in range(len(sampled)-1):
        for j in range(4):
            a=k*5+j;faces.append((a,a+5,a+6,a+1))
    b.add(verts,faces,colors=colors)


def flat_patch(name,center,radii,color):
    b=batch(name)
    x,z=center
    verts=[(x,height_at(x,z)+.026,z)];colors=[(*color,1)];faces=[]
    count=64
    for ring in (.33,.66,1):
        for i in range(count):
            t=TAU*i/count;wiggle=1+.065*math.sin(t*5)+.04*math.sin(t*9)
            xx=x+math.cos(t)*radii[0]*ring*wiggle;zz=z+math.sin(t)*radii[1]*ring*wiggle
            verts.append((xx,height_at(xx,zz)+.027,zz))
            col=tint(color,1+.035*noise2(xx*2,zz*2))
            if ring==1:
                gc=ground_color(xx,zz);col=tuple(gc[k]*.7+col[k]*.3 for k in range(3))+(1,)
            colors.append(col)
    for i in range(count):faces.append((0,1+(i+1)%count,1+i))
    for ring in range(2):
        for i in range(count):
            a=1+ring*count+i;bidx=1+ring*count+(i+1)%count
            faces.append((a,bidx,bidx+count,a+count))
    b.add(verts,faces,colors=colors)


def text_object(name,text,position,size=.27,color="chalk",rotation=(math.pi/2,0,0)):
    curve=bpy.data.curves.new(name,"FONT");curve.body=text;curve.size=size
    curve.align_x="CENTER";curve.align_y="CENTER";curve.extrude=.002
    curve.materials.append(MATERIALS[color])
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj)
    obj.location=blender_point(position);obj.rotation_euler=rotation
    obj["zone"]=name.split("_")[0]
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    bpy.ops.object.convert(target="MESH");obj.select_set(False)
    return obj


def sign(zone,x,z,title,subtitle=None,width=3.1):
    y=height_at(x,z)
    metal=batch(zone+"_sign_supports","metal")
    for dx in (-width*.37,width*.37):block(metal,(x+dx,y+.9,z),(.075,1.8,.075),(.1,.13,.12,1),.014)
    block(batch(zone+"_sign_panels","sign"),(x,y+1.55,z),(width,.78,.10),(.07,.13,.10,1),.045)
    block(batch(zone+"_sign_trim","gold"),(x,y+1.875,z+.057),(width-.18,.025,.014),(.7,.5,.16,1),.006)
    text_object(zone+"_label",title,(x,y+1.64,z+.066),.21)
    if subtitle:text_object(zone+"_subtitle",subtitle,(x,y+1.36,z+.066),.105)


def build_parade():
    # Concrete panel seams, not a single featureless plane.
    slab=batch("formation_paving","organic",False)
    for j in range(8):
        for i in range(10):
            x=-25+2*i;z=-2.94+2*j
            block(slab,(x,-.075,z),(1.984,.15,1.984),tint((.30,.315,.28),RNG.uniform(.94,1.05)),.009)
    chalk=batch("formation_white_markings","chalk",False)
    for x in (-25.45,-6.55):block(chalk,(x,.009,4.1),(.055,.008,14.5), (1,1,1,1),.002)
    for z in (-3.1,11.2):block(chalk,(-16,.01,z),(18.9,.009,.055),(1,1,1,1),.002)
    for row in range(4):
        for col in range(8):
            x=-23.6+2.15*col;z=.1+2.6*row
            block(chalk,(x,.013,z),(.62,.009,.055),(1,1,1,1),.001)
            block(chalk,(x-.28,.013,z+.11),(.055,.009,.27),(1,1,1,1),.001)
    # Raised flag plinth at the north edge, 7.2m pole and a subtly waving flag.
    for i in range(3):block(batch("formation_flag_plinth","concrete"),(-23,.12+i*.17,-5.7),(2.1-i*.38,.24,1.8-i*.32),(.38,.4,.36,1),.035)
    rod(batch("formation_flagpole","metal"),(-23,.52,-5.7),(-23,7.5,-5.7),.047,(.49,.52,.50,1),.027,12)
    foliage(batch("formation_flag_finial","gold"),(-23,7.56,-5.7),(.095,.095,.095),(.73,.46,.05),2,5,9)
    verts=[];faces=[]
    for j in range(5):
        for i in range(14):
            u=i/13;v=j/4
            verts.append((-23+u*2.25,7.3-v*1.42,-5.7+.16*math.sin(u*6.7+v*.8)*u))
    for j in range(4):
        for i in range(13):a=j*14+i;faces.append((a,a+1,a+15,a+14))
    batch("formation_vietnam_flag","flag",True).add(verts,faces)
    star=[]
    for i in range(10):
        t=math.pi/2+i*math.pi/5;r=.38 if i%2==0 else .15
        x=-21.94+math.cos(t)*r;y=6.60+math.sin(t)*r
        u=(x+23)/2.25;v=(7.3-y)/1.42
        star.append((x,y,-5.7+.16*math.sin(u*6.7+v*.8)*u+.012))
    batch("formation_flag_star","gold",False).add(star,[tuple(range(10))])
    sign("formation",-15,-5.8,"01 / SAN DOI NGU","KY LUAT  -  DOAN KET  -  REN LUYEN",3.7)
    for x in (-26.5,-5.5):
        for z in (-3.5,12.6):
            y=height_at(x,z)
            block(batch("formation_boundary_posts","chalk"),(x,y+.31,z),(.17,.62,.17),(1,1,1,1),.026)
            block(batch("formation_post_caps","red"),(x,y+.6,z),(.18,.13,.18),(1,1,1,1),.025)


TREE_TYPES = [
    {"height":6.8,"spread":1.45,"leaf":(.08,.195,.065),"shape":(1.12,.8,1)},
    {"height":8.2,"spread":1.1,"leaf":(.10,.23,.09),"shape":(.86,1.18,.84)},
    {"height":5.6,"spread":1.62,"leaf":(.18,.27,.095),"shape":(1.12,.64,1.1)},
]


def tree(x,z,kind,index,scale=1):
    spec=TREE_TYPES[kind];ground=height_at(x,z);h=spec["height"]*scale
    wood=batch("vegetation_Tree_"+"ABC"[kind]+"_branching","organic")
    leaves=batch("vegetation_Tree_"+"ABC"[kind]+"_canopies","organic")
    bark=(.16,.112,.066,1);r=.17*scale
    base=(x,ground,z);fork=(x+.08*scale,ground+h*.54,z-.12*scale)
    rod(wood,base,fork,r,bark,r*.64,11)
    # Five visible roots, seven reaching branches, multiple overlapping leaf lobes.
    for j in range(5):
        a=j*TAU/5+index
        rod(wood,(x+math.cos(a)*.6*scale,ground+.025,z+math.sin(a)*.6*scale),(x,ground+.6*scale,z),.065*scale,bark,.085*scale,7)
    for j in range(8):
        a=j*2.39996+index*.7;level=.51+.045*j
        reach=spec["spread"]*scale*(.65+.25*math.sin(j+1))
        anchor=(x,ground+h*(.35+.042*j),z)
        tip=(x+math.cos(a)*reach,ground+h*level,z+math.sin(a)*reach)
        rod(wood,anchor,tip,.08*scale,tint(bark,.94+.07*math.sin(j)),.023*scale,8)
        twig=(tip[0]+math.cos(a+.8)*.45,tip[1]+.7*scale,tip[2]+math.sin(a+.8)*.45)
        rod(wood,tip,twig,.026*scale,bark,.009*scale,6)
        cluster=(tip[0],tip[1]+.5*scale,tip[2])
        sz=tuple(v*(.82+RNG.random()*.3)*scale for v in spec["shape"])
        foliage(leaves,cluster,sz,spec["leaf"],index*3+j,8,12,a)
    foliage(leaves,(x+.1,ground+h*.92,z-.1),(.98*scale,.87*scale,.91*scale),spec["leaf"],index+9,8,12)


def bush(x,z,size,index):
    b=batch("vegetation_Bush_"+("Small" if size<.7 else "Medium" if size<1.1 else "Large"))
    y=height_at(x,z)
    for i in range(8):
        theta=i*2.39996+index;spread=size*(.15+.45*math.sqrt(i/7))
        px=x+math.cos(theta)*spread;pz=z+math.sin(theta)*spread
        scale=(size*(.45+RNG.random()*.19),size*(.38+RNG.random()*.18),size*(.4+RNG.random()*.18))
        foliage(b,(px,y+size*.35+RNG.random()*.24,pz),scale,(.095,.215,.069),index*7+i,6,10,theta)


def build_vegetation():
    trees=[(-30,-20),(-26,-23),(-20,-24),(-13,-23),(-6,-23),(1,-24),(28,-22),(31,-17),
           (31,-7),(32,0),(32,9),(29,19),(22,23),(13,23),(3,24),(-7,23),(-19,23),(-29,20),
           (-32,11),(-32,1),(-31,-9),(-24,-15),(-19,-17),(-15,-16),(-21,-11),(-10,-14),
           (-5,-15),(27,-5)]
    for i,(x,z) in enumerate(trees):tree(x,z,i%3,i,RNG.uniform(.85,1.12))
    shrubs=[(-20,-12,1.2),(-18.5,-12.9,.85),(-17.2,-13.8,1),(-16.4,-12,.8),(-22.5,-13.5,1.25),
            (-12,-13,1),(-25,-19,1.2),(-29,-12,1.4),(-30,-3,.7),(-31,6,.8),(-29,17,1.15),
            (-21,21,1),(-16,22,1.3),(-6,21,1),(7,22,.9),(24,21,1.3),(29,16,.8),(30,3,1.2),
            (29,-9,1.3),(27,-19,1.1),(3,-22,.8),(-4,-21,1.1),(-9,-22,.9),(26,-1,.75)]
    for i,(x,z,s) in enumerate(shrubs):bush(x,z,s,i)
    grass=batch("vegetation_grass_clumps","organic",False)
    for i in range(1350):
        x=RNG.uniform(-33.5,33.5);z=RNG.uniform(-26,26)
        # Keep the parade, pedestrian route, trench, and observation pads legible.
        if (-27<x<-5 and -5<z<14) or (-9<x<12 and 6.5<z<13.5):continue
        if trench_distance(x,z)<2.3:continue
        if any(math.hypot(x-p[0],z-p[2])<2.0 for p in OBSERVATION_POINTS.values()):continue
        if noise2(x*.3,z*.3)<-.15:continue
        y=height_at(x,z);size=RNG.uniform(.13,.37)
        for j in range(6):
            theta=RNG.uniform(0,TAU);r=RNG.uniform(.01,.14)
            px=x+math.cos(theta)*r;pz=z+math.sin(theta)*r
            w=size*.10;h=size*RNG.uniform(.6,1.4)
            lean=RNG.uniform(.03,.16)
            grass.add([(px-w*math.cos(theta),y,pz-w*math.sin(theta)),
                       (px+w*math.cos(theta),y,pz+w*math.sin(theta)),
                       (px+math.cos(theta+.8)*lean,y+h,pz+math.sin(theta+.8)*lean)],
                      [(0,1,2)],tint((.19,.28,.073),RNG.uniform(.8,1.2)))
    sign("vegetation",-10.5,-9,"03 / KHU DIA HINH","QUAN SAT DIA HINH - DIA VAT",3.5)


def build_walls():
    # Render-scale bevels remain visible close to the character.
    x,z=7.4,-7.4;y=height_at(x,z)
    block(batch("wall_concrete_footing","concrete"),(x,y+.1,z),(5.1,.2,.88),(.31,.33,.30,1),.045)
    wall=batch("wall_concrete_panels","organic",False)
    for i in range(3):
        xx=x-1.65+i*1.65
        block(wall,(xx,y+.86,z),(1.61,1.5,.29),tint((.31,.33,.30),1+i*.025),.045)
        block(batch("wall_concrete_cap","concrete"),(xx,y+1.64,z),(1.64,.11,.39),(.39,.40,.36,1),.024)
    for i in range(4):
        xx=x-2.48+i*1.65
        block(batch("wall_reinforced_posts","concrete"),(xx,y+.92,z),(.20,1.72,.42),(.31,.33,.30,1),.026)
    # Brick segment offset to the left, with visible mortar and staggered bonds.
    x,z=1.1,-6.8;y=height_at(x,z)
    block(batch("wall_brick_footing","concrete"),(x,y+.07,z),(4.7,.14,.72),(.31,.33,.30,1),.035)
    block(batch("wall_mortar_core","mortar"),(x,y+.66,z),(4.28,1.20,.255),(1,1,1,1),.022)
    bricks=batch("wall_individual_beveled_bricks","organic",False)
    for row in range(6):
        for col in range(10):
            xx=x-2.10+col*.443+(.22 if row%2 else 0)
            if xx>x+2.1:continue
            block(bricks,(xx,y+.205+row*.201,z),(.423,.184,.31),tint((.34,.14,.075),RNG.uniform(.84,1.14)),.018)
    block(batch("wall_brick_cap","concrete"),(x,y+1.37,z),(4.62,.11,.43),(.34,.35,.31,1),.025)
    sign("wall",5.0,-4.3,"TUONG GACH / BE TONG","NHAN BIET VAT LIEU VA HINH DANG",3.6)


def sandbag(target,center,angle,seed):
    # Superellipsoid cotton sack: elongated, flattened, rounded, and irregular.
    verts=[];colors=[];faces=[];rings=7;segments=12
    def sp(v,p):return math.copysign(abs(v)**p,v)
    for j in range(rings+1):
        phi=-math.pi/2+math.pi*j/rings
        for i in range(segments):
            t=TAU*i/segments
            x=.405*sp(math.cos(phi),.52)*sp(math.cos(t),.60)
            z=.245*sp(math.cos(phi),.52)*sp(math.sin(t),.60)
            y=.142*sp(math.sin(phi),.62)
            warp=1+.045*math.sin(t*3+seed)+.025*math.cos(phi*5+seed)
            x*=warp;z*=warp;y+=.008*math.sin(x*7+seed)*math.cos(phi)
            verts.append((center[0]+x*math.cos(angle)-z*math.sin(angle),center[1]+y,center[2]+x*math.sin(angle)+z*math.cos(angle)))
            colors.append(tint((.43,.351,.19),.89+.13*(math.sin(seed)+1)/2+.04*math.sin(t*4+seed)))
    for j in range(rings):
        for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,a+segments,b+segments,b))
    target.add(verts,faces,colors=colors)


def build_sandbags():
    b=batch("sandbag_staggered_rounded_sacks")
    seams=batch("sandbag_stitched_edges","stitch")
    # Four staggered courses and short returns form a complete educational prop.
    for row in range(4):
        for col in range(8):
            x=15.2+col*.78+(row%2)*.36;z=-5.5
            y=height_at(x,z)+.145+row*.27
            yaw=RNG.uniform(-.065,.065)
            sandbag(b,(x,y,z),yaw,row*10+col)
            rod(seams,(x-.30,y+.023,z+.239),(x+.30,y+.023,z+.239),.006,(.24,.20,.12,1),sides=4)
        for side in (0,1):
            for i in range(2):
                x=15.0+side*6.15;z=-6.1-i*.73+(row%2)*.21
                sandbag(b,(x,height_at(x,z)+.145+row*.27,z),math.pi/2+RNG.uniform(-.05,.05),90+row*8+side*2+i)
    flat_patch("sandbag_compacted_pad",(18,-5.9),(4.5,2.9),(.30,.243,.14))
    sign("sandbag",21.8,-2.3,"BAO CAT","MO HINH QUAN SAT",2.15)


def build_trench():
    # Actual depression is cut into the subdivided terrain by height_at().
    # Timber boards and battens clarify the bed and two side walls in close view.
    floor=batch("trench_timber_floor","organic",False)
    retaining=batch("trench_retaining_boards","organic",False)
    for a,c in zip(TRENCH_PATH,TRENCH_PATH[1:]):
        length=math.dist(a,c);dx=(c[0]-a[0])/length;dz=(c[1]-a[1])/length
        angle=math.atan2(dz,dx);count=max(2,int(length/.36))
        for i in range(count):
            t=(i+.5)/count;x=a[0]+(c[0]-a[0])*t;z=a[1]+(c[1]-a[1])*t
            block(floor,(x,-1.025,z),(.31,.095,1.06),tint((.195,.136,.072),RNG.uniform(.88,1.08)),.014,angle)
        for side in (-1,1):
            xx=(a[0]+c[0])/2-dz*.83*side;zz=(a[1]+c[1])/2+dx*.83*side
            for j in range(4):
                block(retaining,(xx,-.75+j*.22,zz),(length-.06,.17,.058),tint((.245,.174,.095),.88+j*.06),.012,angle)
            for i in range(math.ceil(length/1.35)+1):
                t=min(1,i*1.35/length);x=a[0]+(c[0]-a[0])*t-dz*.79*side;z=a[1]+(c[1]-a[1])*t+dx*.79*side
                rod(batch("trench_uprights","organic"),(x,-.95,z),(x,.11,z),.055,(.16,.109,.061,1),.049,7)
    # Accessible visual transition at each end rather than a black hole.
    for end,(x,z) in enumerate((TRENCH_PATH[0],TRENCH_PATH[-1])):
        for i in range(4):
            direction=-1 if end==0 else 1
            block(floor,(x+direction*(.3+i*.32),-.84+i*.245,z),(.32,.13,1.0),(.23,.17,.095,1),.014)
    sign("trench",20.5,-12.2,"HAO MO PHONG","QUAN SAT CAU TRUC DIA HINH",3.1)


def build_props():
    path_strip("movement_compacted_lane",[(-8,10),(0,10),(10,10),(17,15),(25,15)],3.2,(.34,.279,.171))
    path_strip("terrain_perimeter_path",[(-28,17),(-6,17),(6,17),(18,18),(27,16),(28,5),(27,-4)],1.4,(.29,.246,.159))
    path_strip("terrain_observation_path",[(-8,8),(-5,3),(-4,-1),(5,-2),(14,-1),(22,1)],1.8,(.31,.256,.159))
    path_strip("terrain_trench_approach",[(14,-1),(16,-7),(15,-10),(13,-12)],1.35,(.30,.245,.151))
    path_strip("vegetation_approach",[(-5,3),(-8,-3),(-13,-6),(-16,-9)],1.35,(.29,.243,.153))
    flat_patch("open_bare_observation_ground",(22,12),(5.8,5.1),(.275,.261,.148))
    flat_patch("movement_obstacle_pad",(5,5),(5.1,2.3),(.285,.241,.148))
    # Start / finish markers and low balance obstacles outside the walking line.
    for x,word in ((-7.3,"XUAT PHAT"),(9.1,"DICH")):
        for z in (8.05,11.95):
            y=height_at(x,z)
            block(batch("movement_lane_posts","chalk"),(x,y+.37,z),(.16,.74,.16),(1,1,1,1),.026)
            block(batch("movement_red_post_tops","red"),(x,y+.72,z),(.17,.18,.17),(1,1,1,1),.024)
        block(batch("movement_lane_marking","chalk",False),(x,.03,10),(.065,.008,3.05),(1,1,1,1),.002)
        text_object("movement_"+word,word,(x,.041,10),.28,rotation=(0,0,math.pi/2))
    for i in range(3):
        x=1.5+i*3.0;z=4.8;y=height_at(x,z)
        for dz in (-.65,.65):block(batch("movement_low_obstacle_posts","wood"),(x,y+.34,z+dz),(.16,.68,.16),(1,1,1,1),.027)
        rod(batch("movement_low_obstacle_beams","wood"),(x,y+.67,z-.83),(x,y+.67,z+.83),.095,(.28,.193,.092,1),sides=12)
    sign("movement",1,13.5,"02 / DUONG VAN DONG","DI BO - CHAY - REN LUYEN THE LUC",3.6)
    sign("open",25,7,"04 / KHU QUAN SAT","KHONG GIAN MO",3.0)
    # Open fence rhythm frames the back, with a deliberate entrance at the front.
    wood=batch("terrain_perimeter_fence","wood")
    for a,c in [((-33,-25.5),(33,-25.5)),((-33,-25.5),(-33,23)),((33,-25.5),(33,23)),((-33,23),(-5,23)),((6,23),(33,23))]:
        n=math.ceil(math.dist(a,c)/3)
        for i in range(n+1):
            x=a[0]+(c[0]-a[0])*i/n;z=a[1]+(c[1]-a[1])*i/n;y=height_at(x,z)
            block(wood,(x,y+.57,z),(.115,1.14,.115),(.22,.161,.087,1),.026)
            if i<n:
                xx=a[0]+(c[0]-a[0])*(i+1)/n;zz=a[1]+(c[1]-a[1])*(i+1)/n;yy=height_at(xx,zz)
                for level in (.4,.82):rod(wood,(x,y+level,z),(xx,yy+level,zz),.037,(.22,.161,.087,1),sides=7)
    # Discrete stones, notice board, benches, and distances bring human scale.
    for i in range(100):
        x=RNG.uniform(-32,32);z=RNG.uniform(-25,24)
        if (-27<x<-5 and -5<z<14) or abs(z-10)<2.5 or trench_distance(x,z)<2:continue
        s=RNG.uniform(.08,.24)
        foliage(batch("terrain_scattered_stones"),(x,height_at(x,z)+s*.25,z),(s,s*.47,s*.73),(.27,.27,.23),i,4,7,RNG.random()*TAU)
    for x,z in [(-3,18),(10,20),(-28,8)]:
        y=height_at(x,z)
        for dx in (-.75,.75):
            for dz in (-.22,.22):block(batch("terrain_bench_frames","metal"),(x+dx,y+.28,z+dz),(.055,.56,.055),(1,1,1,1),.009)
        for j in range(3):block(batch("terrain_bench_timber","wood"),(x,y+.55,z-.25+j*.25),(1.95,.075,.205),(1,1,1,1),.018)
        for j in range(2):block(batch("terrain_bench_timber","wood"),(x,y+.93+j*.17,z-.37),(1.95,.13,.06),(1,1,1,1),.015)


def import_character_preview():
    path=ROOT/"public/models/training/soldier-animated.glb"
    if not path.exists():path=ROOT/"public/models/vietnam_people_army_clean.glb"
    if not path.exists() or OPTIONS.skip_character:return
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported=set(bpy.data.objects)-before
    roots=[o for o in imported if o.parent not in imported]
    parent=bpy.data.objects.new("Soldier_preview_only_not_exported",None)
    bpy.context.collection.objects.link(parent)
    for obj in roots:obj.parent=parent
    mesh_objects=[o for o in imported if o.type=="MESH"]
    corners=[o.matrix_world@Vector(v) for o in mesh_objects for v in o.bound_box]
    if corners:
        lo=min(p.z for p in corners);hi=max(p.z for p in corners)
        s=1.75/max(.01,hi-lo)
        parent.scale=(s,s,s);parent.location=(-15,-4,-lo*s)
    parent["note"]="Source character preserved for Blender preview; separate GLB is loaded by web."


def setup_preview():
    world=bpy.data.worlds.new("Outdoor soft blue grey")
    bpy.context.scene.world=world;world.use_nodes=True
    world.node_tree.nodes["Background"].inputs[0].default_value=(.43,.56,.69,1)
    world.node_tree.nodes["Background"].inputs[1].default_value=.45
    sun_data=bpy.data.lights.new("Afternoon sun","SUN");sun_data.energy=2.5;sun_data.angle=.18
    sun=bpy.data.objects.new("Afternoon sun",sun_data);bpy.context.collection.objects.link(sun)
    sun.rotation_euler=(math.radians(29),math.radians(-24),math.radians(-38))
    area_data=bpy.data.lights.new("Sky fill","AREA");area_data.energy=2200;area_data.shape="DISK";area_data.size=35
    area=bpy.data.objects.new("Sky fill",area_data);bpy.context.collection.objects.link(area);area.location=(-12,-8,25)
    camera_data=bpy.data.cameras.new("Training ground overview")
    camera=bpy.data.objects.new("Training ground overview",camera_data);bpy.context.collection.objects.link(camera)
    camera.location=blender_point((55,46,65));target=Vector(blender_point((0,.5,0)))
    camera.rotation_euler=(target-camera.location).to_track_quat("-Z","Y").to_euler()
    camera_data.type="ORTHO";camera_data.ortho_scale=89;camera_data.lens=48
    scene=bpy.context.scene;scene.camera=camera
    scene.render.engine="CYCLES";scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=1600;scene.render.resolution_y=1150;scene.render.resolution_percentage=100
    scene.view_settings.view_transform="AgX"
    scene.render.image_settings.file_format="PNG"
    scene.render.filepath=str(ROOT/"assets/blender/training-ground-preview.png")


def main():
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    for name in ("meshes","materials","curves","cameras","lights"):
        for datablock in list(getattr(bpy.data,name)):
            if datablock.users==0:getattr(bpy.data,name).remove(datablock)
    bpy.context.scene.unit_settings.system="METRIC"
    material("organic",(1,1,1),vertex=True)
    material("chalk",(.75,.77,.66));material("concrete",(.35,.37,.33))
    material("mortar",(.23,.235,.205));material("wood",(.225,.155,.075))
    material("metal",(.13,.17,.15),.55,.5);material("sign",(.036,.080,.056),.7)
    material("gold",(.83,.54,.045),.65,.1);material("red",(.50,.027,.015))
    flag=material("flag",(.58,.014,.022),.95);flag.surface_render_method="DITHERED" if hasattr(flag,"surface_render_method") else None
    flag.use_backface_culling=False
    material("stitch",(.22,.177,.098))
    print("BUILD: subdivided terrain and paths",flush=True)
    build_terrain();build_parade();build_props()
    print("BUILD: three tree families, clustered shrubs and grasses",flush=True)
    build_vegetation();build_walls();build_sandbags();build_trench()
    for b in BATCHES.values():b.finish()
    environment=[o for o in bpy.context.scene.objects if o.type=="MESH"]
    triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in environment)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in environment:obj.select_set(True)
    bpy.context.view_layer.objects.active=environment[0]
    OPTIONS.output.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(OPTIONS.output),export_format="GLB",use_selection=True,
        export_animations=False,export_lights=False,export_cameras=False,export_extras=True,
        export_yup=True,export_apply=True,export_normals=True,export_texcoords=False)
    manifest={"asset":"training-ground.glb","generator":"Blender "+bpy.app.version_string,
        "seed":24681,"units":"metres","upAxis":"Y","dimensions":[70,55],
        "meshCount":len(environment),"triangles":triangles,"zoneCenters":ZONE_CENTERS,
        "observationPoints":OBSERVATION_POINTS,"trenchPath":TRENCH_PATH,
        "heightGrid":{"minX":-35,"minZ":-27.5,"step":.5,"columns":141,"rows":111,
            "values":[round(height_at(-35+i*.5,-27.5+j*.5),4) for j in range(111) for i in range(141)]},
        "notes":["Training lane and observation points y=0.","Environment exported separately from character.",
                 "Trench depression is part of the terrain mesh, maximum depth 1.08m.",
                 "Color variation baked into COLOR_0, no external textures."]}
    (OPTIONS.output.parent/"training-ground.manifest.json").write_text(json.dumps(manifest,separators=(",",":")),encoding="utf-8")
    print(f"EXPORTED: {OPTIONS.output} / {len(environment)} meshes / {triangles:,} triangles",flush=True)
    bpy.ops.object.select_all(action="DESELECT")
    import_character_preview();setup_preview()
    out=ROOT/"assets/blender/training-ground.blend";out.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out))
    if OPTIONS.preview:bpy.ops.render.render(write_still=True)
    print("COMPLETE: saved .blend, GLB, layout + height manifest" ,flush=True)


if __name__=="__main__":main()
