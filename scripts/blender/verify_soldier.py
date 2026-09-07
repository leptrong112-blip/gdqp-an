"""Reimport the delivered GLB and sample deformed mesh bounds for every action."""
import json
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 24
bpy.ops.import_scene.gltf(filepath=str(ROOT / "public/models/training/soldier-animated.glb"))
rig = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and any(m.type == "ARMATURE" for m in o.modifiers)]
for track in rig.animation_data.nla_tracks:
    track.mute = True
report = []
for action in bpy.data.actions:
    rig.animation_data.action = action
    if hasattr(action, "slots") and len(action.slots):
        rig.animation_data.action_slot = action.slots[0]
    samples = []
    for fraction in (0, .125, .25, .5, .75, .875, 1):
        frame = action.frame_range[0] + (action.frame_range[1] - action.frame_range[0]) * fraction
        bpy.context.scene.frame_set(int(frame), subframe=frame % 1)
        bpy.context.view_layer.update()
        graph = bpy.context.evaluated_depsgraph_get()
        points = []
        footpoints = []
        for mesh in meshes:
            evaluated = mesh.evaluated_get(graph)
            shape = evaluated.to_mesh()
            world = [evaluated.matrix_world @ vertex.co for vertex in shape.vertices]
            points.extend(world)
            if mesh.name.startswith("body.smd_mp_VPA_black_boots"):
                footpoints.extend(world)
            evaluated.to_mesh_clear()
        low = [min(p[i] for p in points) for i in range(3)]
        high = [max(p[i] for p in points) for i in range(3)]
        samples.append({"fraction": fraction, "min": low, "max": high, "lowestBoot": min(p.z for p in footpoints) if footpoints else None})
    report.append({"name": action.name, "duration": (action.frame_range[1]-action.frame_range[0])/24, "samples": samples})
    print("VERIFIED", action.name, "floor", round(min(s["min"][2] for s in samples), 4), "top", round(max(s["max"][2] for s in samples), 4))
idle = next(a for a in report if a["name"] == "Idle")
assert abs(idle["samples"][0]["min"][2]) < .005, "Standing feet are not on the ground"
assert abs(idle["samples"][0]["max"][2] - 1.75) < .01, "Soldier scale is incorrect"
assert len(rig.data.bones) == 20, "Rig was changed"
required = {"Idle", "Attention", "AtEase", "Walk", "Run", "TurnLeft", "TurnRight", "Salute", "SitDown", "StandUp", "LookAround"}
assert required.issubset({a["name"] for a in report}), "Missing animation"
assert all(s["min"][2] > -.065 for a in report if a["name"] in required for s in a["samples"]), "Animation penetrates the ground excessively"
target = ROOT / "artifacts/training/soldier-reimport-verification.json"
target.write_text(json.dumps({"status": "passed", "blender": bpy.app.version_string, "heightMeters": 1.75, "rigBones": len(rig.data.bones), "meshCount": len(meshes), "actions": report}, indent=2), encoding="utf-8")
print("REIMPORT VERIFICATION PASSED", target)
