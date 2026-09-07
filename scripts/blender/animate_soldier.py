"""Preserve the supplied VPA rig and author neutral training animations with bpy.

Run: blender -b -P scripts/blender/animate_soldier.py
Optional arguments after --: --input path --output path --preview
The original GLBs are never modified. No external animation/texture downloads.
"""
import argparse
import json
import math
import re
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[2]
FPS = 24
SPECS = {
    "Idle": (72, True), "Attention": (48, True), "AtEase": (72, True),
    "Walk": (32, True), "Run": (20, True), "TurnLeft": (30, False),
    "TurnRight": (30, False), "Salute": (60, False), "SitDown": (48, False),
    "StandUp": (48, False), "LookAround": (96, True),
}


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "public/models/vietnam_people_army_rigged.glb")
    parser.add_argument("--output", type=Path, default=ROOT / "public/models/training/soldier-animated.glb")
    parser.add_argument("--preview", action="store_true")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def key(name):
    return re.sub(r"[^a-z0-9]", "", name.lower().replace("mixamorig:", ""))


def map_bones(rig):
    """Match custom GDQP, Mixamo, Blender and common humanoid aliases."""
    aliases = {
        "root": ["armature", "root", "rootbone"], "hips": ["hips", "pelvis", "bip01pelvis"],
        "spine": ["spine", "spine01", "spine1"], "chest": ["chest", "spine2", "spine02", "upperchest"],
        "neck": ["neck", "neck1", "neck01"], "head": ["head", "head01"],
    }
    for side, letter in (("left", "l"), ("right", "r")):
        for role, stems in {
            "upperarm": ["upperarm", "arm", "uparm"], "forearm": ["forearm", "lowerarm", "loarm"],
            "hand": ["hand", "wrist"], "thigh": ["upleg", "thigh", "upperleg"],
            "shin": ["leg", "shin", "calf", "lowerleg"], "foot": ["foot", "ankle"],
            "toe": ["toebase", "toe", "toe0"],
        }.items():
            aliases[f"{letter}_{role}"] = [v for stem in stems for v in (side + stem, stem + letter, letter + stem, "bip01" + letter + stem)]
    candidates = {key(b.name): b for b in rig.pose.bones}
    result = {}
    for role, names in aliases.items():
        result[role] = next((candidates[n] for n in names if n in candidates), None)
        if result[role] is None:
            result[role] = next((b for n, b in candidates.items() if any(n.endswith(a) for a in names if len(a) > 4)), None)
        if result[role] is None:
            print(f"WARNING: no {role} bone; related channels will be omitted")
    if not result["hips"] or not result["head"]:
        raise RuntimeError("The supplied armature needs identifiable hips and head bones")
    return result


def use_action(rig, action):
    rig.animation_data_create()
    rig.animation_data.action = action
    if action and hasattr(action, "slots") and len(action.slots):
        rig.animation_data.action_slot = action.slots[0]


def snapshot(rig):
    return {b.name: (b.location.copy(), b.rotation_quaternion.copy(), b.scale.copy()) for b in rig.pose.bones}


def restore(rig, pose):
    for bone in rig.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.location, bone.rotation_quaternion, bone.scale = pose[bone.name]


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def author_actions(rig, bones, originals):
    # Importer keeps the supplied skin's bind matrices. Work only on pose bones.
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    for bone in rig.pose.bones:
        bone.rotation_mode = "QUATERNION"
    rest = snapshot(rig)
    attention_source = next((a for a in originals if a.name in ("Nghiem", "Attention")), None)
    if attention_source:
        use_action(rig, attention_source)
        bpy.context.scene.frame_set(int(math.ceil(attention_source.frame_range[1])))
        bpy.context.view_layer.update()
    base = snapshot(rig)
    ease_source = next((a for a in originals if a.name in ("Nghi", "AtEase")), None)
    if ease_source:
        use_action(rig, ease_source)
        bpy.context.scene.frame_set(int(math.ceil(ease_source.frame_range[1])))
        bpy.context.view_layer.update()
    ease_pose = snapshot(rig) if ease_source else base
    use_action(rig, None)

    # Solve the arm toward the temple from the supplied rest proportions. This
    # also works when an importer changes the local orientation of arm bones.
    restore(rig, base)
    bpy.context.view_layer.update()
    upper, forearm, hand = (bones.get("r_" + part) for part in ("upperarm", "forearm", "hand"))
    if all((upper, forearm, hand)):
        shoulder, elbow, wrist = upper.head.copy(), forearm.head.copy(), hand.head.copy()
        target = bones["head"].head + Vector((-.065, -.04, .015))
        axis = (target - shoulder).normalized()
        a, b, distance = (elbow-shoulder).length, (wrist-elbow).length, (target-shoulder).length
        distance = min(distance, a+b-.001)
        along = (a*a-b*b+distance*distance)/(2*distance)
        pole = Vector((-1, -.15, -.05))
        pole = (pole - axis * pole.dot(axis)).normalized()
        wanted_elbow = shoulder + axis*along + pole*math.sqrt(max(0, a*a-along*along))
        delta = (elbow-shoulder).rotation_difference(wanted_elbow-shoulder)
        matrix = upper.matrix.copy()
        location = matrix.translation.copy()
        matrix = delta.to_matrix().to_4x4() @ matrix
        matrix.translation = location
        upper.matrix = matrix
        bpy.context.view_layer.update()
        delta = (hand.head-forearm.head).rotation_difference(target-forearm.head)
        matrix = forearm.matrix.copy()
        location = matrix.translation.copy()
        matrix = delta.to_matrix().to_4x4() @ matrix
        matrix.translation = location
        forearm.matrix = matrix
        bpy.context.view_layer.update()
    salute_pose = snapshot(rig)

    def turn(role, x=0, y=0, z=0):
        bone = bones.get(role)
        if bone is None:
            return
        # Anatomical axes: right +X, up +Z, forward -Y in Blender, +Z in glTF.
        # Convert these armature-space axes to the original bone's rest basis.
        inv = bone.bone.matrix_local.to_quaternion().inverted()
        for axis, angle in ((Vector((1, 0, 0)), x), (Vector((0, 0, 1)), y), (Vector((0, -1, 0)), z)):
            if angle:
                bone.rotation_quaternion = Quaternion(inv @ axis, angle) @ bone.rotation_quaternion

    def translate(role, xyz):
        bone = bones.get(role)
        if bone:
            delta = Vector((xyz[0], -xyz[2], xyz[1]))
            bone.location += bone.bone.matrix_local.to_quaternion().inverted() @ delta

    def leg(side, forward, lift, hip_lower):
        thigh, shin, foot = (bones.get(f"{side}_{p}") for p in ("thigh", "shin", "foot"))
        if not all((thigh, shin, foot)):
            return
        a = (shin.bone.head_local - thigh.bone.head_local).length
        b = (foot.bone.head_local - shin.bone.head_local).length
        down = a + b - hip_lower - lift
        distance = min(a + b - .0001, math.hypot(down, forward))
        knee = math.acos(max(-1.0, min(1.0, (distance * distance - a * a - b * b) / (2 * a * b))))
        hip = math.atan2(-forward, down) - math.atan2(b * math.sin(knee), a + b * math.cos(knee))
        turn(f"{side}_thigh", x=hip)
        turn(f"{side}_shin", x=knee)
        turn(f"{side}_foot", x=-hip-knee)

    created = []
    for name, (frames, loop) in SPECS.items():
        action = bpy.data.actions.new(name=name)
        action.use_fake_user = True
        action["loop"] = loop
        action["inPlace"] = True
        action["educational"] = "Neutral posture and physical movement; no weapon interaction"
        action["sourceRig"] = rig.name
        use_action(rig, action)
        for frame in range(frames + 1):
            bpy.context.scene.frame_set(frame)
            restore(rig, ease_pose if name == "AtEase" else base)
            t = frame / frames
            phase = math.tau * t
            if name in ("Idle", "AtEase", "LookAround"):
                turn("chest", x=.008 * math.sin(phase))
                turn("spine", z=.006 * math.sin(phase))
                turn("l_upperarm", x=.01 * math.sin(phase))
                turn("r_upperarm", x=-.01 * math.sin(phase))
                turn("head", x=.006 * math.sin(phase + .2))
            if name == "LookAround":
                turn("head", y=.42 * math.sin(phase))
                turn("neck", y=.10 * math.sin(phase))
                turn("chest", y=.04 * math.sin(phase))
            if name in ("Walk", "Run"):
                running = name == "Run"
                stride = .16 if running else .105
                lift = .105 if running else .052
                duty = .48 if running else .60
                lower = .042 if running else .025
                translate("hips", (0, -lower, 0))
                for side, offset in (("l", 0), ("r", .5)):
                    p = (t + offset) % 1
                    if p < duty:
                        forward, height = stride * (1 - 2 * p / duty), 0
                    else:
                        swing = (p - duty) / (1 - duty)
                        forward = stride * (-1 + 2 * smooth(swing))
                        height = lift * math.sin(math.pi * swing)
                    leg(side, forward, height, lower)
                    swing_arm = (.50 if running else .28) * math.sin(math.tau * p)
                    turn(f"{side}_upperarm", x=swing_arm)
                    turn(f"{side}_forearm", x=-.68 if running else -.12)
                turn("hips", y=.023 * math.sin(phase))
                turn("chest", y=-.035 * math.sin(phase), x=.04 if running else .012)
                turn("head", x=-.018 if running else 0)
            if name in ("TurnLeft", "TurnRight"):
                amount = smooth((t - .10) / .72)
                turn("root" if bones.get("root") else "hips", y=(1 if name == "TurnLeft" else -1) * math.pi / 2 * amount)
                lift = .028 * math.sin(math.pi * t) ** 2
                leg("l", 0, lift, .01)
                leg("r", 0, lift * .5, .01)
                translate("hips", (0, -.01, 0))
                turn("chest", y=.035 * math.sin(phase))
            if name == "Salute":
                amount = smooth(t / .26) * (1 - smooth((t - .72) / .28))
                for role in ("r_upperarm", "r_forearm", "r_hand"):
                    bone = bones.get(role)
                    if bone:
                        bone.rotation_quaternion = base[bone.name][1].slerp(salute_pose[bone.name][1], amount)
                turn("head", y=-.035 * amount)
                turn("chest", x=-.015 * amount)
            if name in ("SitDown", "StandUp"):
                amount = smooth(t if name == "SitDown" else 1 - t)
                # Squat to a stable seated-height pose, both soles remain planted.
                angle = .95 * amount
                lower = .60 * (1 - math.cos(angle))
                translate("hips", (0, -lower, -.03 * amount))
                for side in ("l", "r"):
                    leg(side, .03 * amount, 0, lower)
                    turn(f"{side}_upperarm", x=-.48 * amount)
                    turn(f"{side}_forearm", x=-.52 * amount)
                turn("spine", x=.12 * amount)
                turn("head", x=-.07 * amount)
            for bone in rig.pose.bones:
                bone.keyframe_insert("rotation_quaternion", frame=frame, group=bone.name)
                bone.keyframe_insert("location", frame=frame, group=bone.name)
                bone.keyframe_insert("scale", frame=frame, group=bone.name)
        created.append(action)
        print(f"AUTHORED {name}: {frames / FPS:.3f}s; {'loop' if loop else 'one shot'}")
    use_action(rig, next(a for a in created if a.name == "Idle"))
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()
    return created


def optimize_textures():
    changes = []
    for img in bpy.data.images:
        if img.type != "IMAGE" or not img.size[0] or img.name == "Render Result":
            continue
        old = tuple(img.size)
        longest = max(old)
        if longest > 1024:
            factor = 1024 / longest
            img.scale(max(1, round(old[0] * factor)), max(1, round(old[1] * factor)))
            img.pack()
        changes.append({"name": img.name, "originalSize": old, "exportSize": tuple(img.size)})
    return changes


def bounds(objects):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in objects:
        if obj.type == "MESH":
            evaluated = obj.evaluated_get(depsgraph)
            points.extend(evaluated.matrix_world @ Vector(p) for p in evaluated.bound_box)
    return [min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)]


def preview(rig, actions, folder):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.render.resolution_x = 560
    scene.render.resolution_y = 700
    scene.render.resolution_percentage = 100
    if not scene.world:
        scene.world = bpy.data.worlds.new("PreviewWorld")
    scene.world.color = (.3, .3, .3)
    bpy.ops.mesh.primitive_plane_add(size=200)
    plane = bpy.context.object
    plane.name = "PreviewFloor"
    plane.location.z = -.005
    material = bpy.data.materials.new("PreviewFloorMaterial")
    material.diffuse_color = (.19, .22, .20, 1)
    plane.data.materials.append(material)
    for location, power, size in [((3,-4,6), 850, 5), ((-3,1,4), 500, 4)]:
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp = bpy.context.object
        lamp.data.energy, lamp.data.shape, lamp.data.size = power, "DISK", size
        lamp.rotation_euler = (Vector((0,0,1)) - lamp.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=(2.5, -4.5, 2.2))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0,0,.88)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type, camera.data.ortho_scale = "ORTHO", 2.18
    scene.camera = camera
    for name, fraction in [("Idle", 0), ("Walk", .22), ("Run", .22), ("Salute", .5), ("SitDown", 1)]:
        use_action(rig, next(a for a in actions if a.name == name))
        scene.frame_set(round(SPECS[name][0] * fraction))
        scene.render.filepath = str(folder / ("soldier-" + name.lower() + ".png"))
        bpy.ops.render.render(write_still=True)


def main():
    args = arguments()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    source_dir = ROOT / "assets/blender"
    source_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    bpy.ops.import_scene.gltf(filepath=str(args.input))
    # Blender's importer creates hidden bone-display meshes. They are editor
    # helpers, not part of the character, and must not affect height or export.
    helpers = set()
    for obj in scene.objects:
        if obj.type == "ARMATURE":
            for bone in obj.pose.bones:
                if bone.custom_shape:
                    helpers.add(bone.custom_shape)
                    bone.custom_shape = None
    for helper in helpers:
        bpy.data.objects.remove(helper, do_unlink=True)
    imported = list(scene.objects)
    rigs = [o for o in imported if o.type == "ARMATURE"]
    if not rigs:
        raise RuntimeError("No armature in the supplied GLB. Original file was left unchanged.")
    rig = max(rigs, key=lambda o: len(o.data.bones))
    originals = list(bpy.data.actions)
    for action in originals:
        action.use_fake_user = True
    bones = map_bones(rig)
    created = author_actions(rig, bones, originals)
    low, high = bounds(imported)
    factor = 1.75 / (high[2] - low[2])
    wrapper = bpy.data.objects.new("Soldier_1_75m", None)
    scene.collection.objects.link(wrapper)
    for obj in imported:
        if obj.parent is None:
            obj.parent = wrapper
    wrapper.scale = (factor,) * 3
    wrapper.location.z = -low[2] * factor
    wrapper["heightMeters"] = 1.75
    wrapper["forward"] = "+Z in glTF"
    wrapper["sourceAsset"] = args.input.name
    wrapper["animationContract"] = "In place; turns retain +/-90 degrees; SitDown holds end pose"
    texture_changes = optimize_textures()
    bpy.context.view_layer.update()
    scene.name = "Vietnamese Soldier - Training Animations"
    scene.frame_start, scene.frame_end = 0, 96
    bpy.ops.wm.save_as_mainfile(filepath=str(source_dir / "soldier-animated.blend"))
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    options = dict(filepath=str(args.output), export_format="GLB", export_yup=True,
                   export_animations=True, export_skins=True, export_extras=True,
                   export_animation_mode="ACTIONS", export_nla_strips=True,
                   export_force_sampling=False, export_frame_range=False,
                   export_optimize_animation_size=True, export_image_format="JPEG",
                   export_jpeg_quality=85, export_image_quality=85,
                   export_cameras=False, export_lights=False)
    bpy.ops.export_scene.gltf(**{k:v for k,v in options.items() if k in props})
    report = {
        "input": str(args.input.relative_to(ROOT)) if args.input.is_relative_to(ROOT) else str(args.input),
        "output": str(args.output), "blender": bpy.app.version_string,
        "armature": rig.name, "boneMapping": {k:v.name if v else None for k,v in bones.items()},
        "bones": [{"name": b.name, "parent": b.parent.name if b.parent else None} for b in rig.data.bones],
        "preservedClips": [{"name": a.name, "duration": (a.frame_range[1]-a.frame_range[0])/FPS} for a in originals],
        "authoredClips": [{"name": n, "duration": f/FPS, "loop": loop} for n,(f,loop) in SPECS.items()],
        "meshCount": len([o for o in imported if o.type == "MESH"]),
        "vertices": sum(len(o.data.vertices) for o in imported if o.type == "MESH"),
        "triangles": sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in imported if o.type == "MESH"),
        "textureChanges": texture_changes, "normalizationScale": factor,
        "heightMeters": 1.75, "feetY": 0, "up": "+Y", "forward": "+Z",
        "notes": ["Original supplied skin and vertex groups retained; no re-rigging or decimation.",
                  "New walk/run use analytic two-link leg placement; source weight quality limits deformation quality.",
                  "SitDown is a seat-height squat with feet planted; no chair asset required.",
                  "Original six actions remain available alongside the eleven English actions."],
    }
    (args.output.parent / "soldier-authoring-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("EXPORTED", args.output, args.output.stat().st_size, "bytes")
    if args.preview:
        folder = ROOT / "artifacts/training"
        folder.mkdir(parents=True, exist_ok=True)
        preview(rig, created, folder)


if __name__ == "__main__":
    main()
