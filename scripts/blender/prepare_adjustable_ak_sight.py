"""Split only reviewed, original triangles. Run from project root with Blender -b -P.
Input: public/models/akm.glb; output: public/models/ak47_adjustable.glb.
Selection is fingerprinted and matched by world-space triangle coordinates, never names alone.
"""
import bpy, json, hashlib, os, subprocess
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'public/models/akm.glb'
OUTPUT = ROOT / 'public/models/ak47_adjustable.glb'
ART = ROOT / 'artifacts/ak-sight'
selection = json.loads((ART / 'selection.json').read_text())
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == selection['sourceSha256'], 'Source changed; inspect again'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE), merge_vertices=False)
bpy.context.view_layer.update()

def signature(coords):
    return tuple(sorted(tuple(round(float(x), 5) for x in p) for p in coords))
wanted = {signature(t) for t in selection['triangles']}
assert len(wanted) == 556
tree=KDTree(len(selection['triangles']))
for i,t in enumerate(selection['triangles']): tree.insert(sum((Vector(v) for v in t),Vector())/3,i)
tree.balance()
matched_ids=set()
matches = []
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH': continue
    chosen=[]
    for poly in obj.data.polygons:
        # Blender Z-up to GLTF Y-up, matching the inspected world coordinates.
        points=[obj.matrix_world @ obj.data.vertices[i].co for i in poly.vertices]
        coords=[Vector((v.x,v.z,-v.y)) for v in points]
        if len(coords)!=3: continue
        candidates=tree.find_range(sum(coords,Vector())/3,0.000002)
        exact=[i for _,i,_ in candidates if all(min((v-Vector(w)).length for w in selection['triangles'][i])<0.000002 for v in coords)]
        assert len(exact)<=1, 'Ambiguous triangle'
        if exact:
            assert exact[0] not in matched_ids, 'Duplicate triangle'
            matched_ids.add(exact[0]); chosen.append(poly.index)
    if chosen: matches.append((obj,chosen))
print('MATCHES',[(o.name,len(f)) for o,f in matches])
assert len(matches)==1 and len(matches[0][1])==556, 'Ambiguous or incomplete selection; refusing export'
body, chosen=matches[0]
before=sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True); bpy.context.view_layer.objects.active=body
bpy.context.tool_settings.mesh_select_mode=(False,False,True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
for p in body.data.polygons: p.select=p.index in chosen
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.separate(type='SELECTED')
bpy.ops.object.mode_set(mode='OBJECT')
sight=next(o for o in bpy.context.selected_objects if o != body)
assert len(sight.data.polygons)==556 and len(body.data.polygons)==10790
sight.name='RearSight'; sight.data.name='RearSightGeometry'
# Recenter origin at the reviewed forward end of the leaf, without moving vertices.
pivot=Vector((0, .2592953, .1255))  # Blender world coordinates, visual pivot only.
old_world=sight.matrix_world.copy()
new_world=Matrix.Translation(pivot)
sight.data.transform(new_world.inverted() @ old_world)
sight.matrix_world=new_world
# Preserve the imported weapon hierarchy; keep the local basis aligned to Blender.
sight['role']='rear-sight-visual'; sight['sourceTriangles']=556
bpy.context.view_layer.update()
assert sight.parent is not None
assert sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')==before
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format='GLB',export_extras=True,export_yup=True,export_animations=False,export_tangents=True)
subprocess.run(['node',str(ROOT/'scripts/finalize-ak-sight.mjs')],cwd=str(ROOT),check=True)

# Diagnostic renders do not alter exported materials or add geometry to the asset.
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=12
scene.render.resolution_x=1100; scene.render.resolution_y=760; scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('DiagnosticWorld'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.25,.3,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
for loc,energy,size in [((.25,.15,.6),40,.5),((-.2,.3,.4),25,.3)]:
    data=bpy.data.lights.new('DiagnosticLight','AREA'); data.energy=energy; data.shape='DISK'; data.size=size
    obj=bpy.data.objects.new('DiagnosticLight',data); scene.collection.objects.link(obj); obj.location=loc
    obj.rotation_euler=(Vector((0,.23,.12))-obj.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.objects.new('DiagnosticCamera',bpy.data.cameras.new('DiagnosticCamera')); scene.collection.objects.link(cam); scene.camera=cam
cam.location=(.12,.10,.23); target=Vector((0,.232,.12)); cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=.155
scene.render.filepath=str(ART/'rear-sight-original.png'); bpy.ops.render.render(write_still=True)
highlight=bpy.data.materials.new('DiagnosticSelection'); highlight.diffuse_color=(1,.15,.015,1); highlight.use_nodes=True
highlight.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(1,.15,.015,1)
sight.data.materials.clear(); sight.data.materials.append(highlight)
for p in sight.data.polygons:p.material_index=0
scene.render.filepath=str(ART/'rear-sight-selected.png'); bpy.ops.render.render(write_still=True)
print('EXPORTED',OUTPUT,'selected',len(chosen),'total',before)
