"""Copy the CURRENT polished GLB materials onto the CURRENT authored .blend.

No scene generation, mesh edits, origin operations, or object operators. The
original .blend is read-only; the result is saved as training-ground-materials.blend.
Run: D:/Blender/blender.exe -b --python-exit-code 1 -P scripts/blender/apply_training_materials.py
"""
import array
import hashlib
import json
import math
import struct
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets/blender/training-ground.blend"
OUTPUT = ROOT / "assets/blender/training-ground-materials.blend"
GLB = ROOT / "public/models/training/training-ground.glb"
REPORT = ROOT / "artifacts/training/blender-material-polish-verification.json"
COLOR_LAYER = "TrainingFinish"


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def sha_file(filename):
    return hashlib.sha256(filename.read_bytes()).hexdigest()


def read_glb(filename):
    data = filename.read_bytes()
    require(struct.unpack_from("<III", data) == (0x46546C67, 2, len(data)), "Invalid GLB header")
    offset = 12
    document = binary = None
    while offset < len(data):
        length, kind = struct.unpack_from("<II", data, offset)
        end = offset + 8 + length
        require(end <= len(data), "Invalid GLB chunk bounds")
        chunk = data[offset + 8:end]
        if kind == 0x4E4F534A:
            document = json.loads(chunk)
        elif kind == 0x004E4942:
            binary = chunk
        offset = end
    require(document is not None and binary is not None, "Missing GLB JSON/BIN chunks")
    return document, binary


def accessor(document, binary, index):
    item = document["accessors"][index]
    require("sparse" not in item, "Sparse attributes are not supported for source synchronization")
    view = document["bufferViews"][item["bufferView"]]
    require(view.get("buffer", 0) == 0, "Only embedded GLB attributes are supported")
    types = {5126: ("f", 4, 1), 5123: ("H", 2, 65535), 5121: ("B", 1, 255)}
    require(item["componentType"] in types, "Unexpected GLB attribute component type")
    code, size, divisor = types[item["componentType"]]
    widths = {"VEC3": 3, "VEC4": 4}
    require(item["type"] in widths, "Unexpected GLB attribute width")
    width = widths[item["type"]]
    stride = view.get("byteStride", size * width)
    start = view.get("byteOffset", 0) + item.get("byteOffset", 0)
    end = start + (item["count"] - 1) * stride + size * width
    require(end <= len(binary) and end <= view.get("byteOffset", 0) + view["byteLength"], "GLB accessor bounds")
    unpack = struct.Struct("<" + code * width).unpack_from
    normalized = item.get("normalized", False)
    values = []
    for i in range(item["count"]):
        value = unpack(binary, start + i * stride)
        if normalized:
            value = tuple(component / divisor for component in value)
        require(all(math.isfinite(component) for component in value), "Non-finite GLB attribute")
        values.append(value)
    return values


def position_key(position):
    # Both Blender's vertex positions and exported GLB positions are float32.
    # Canonical zero handles the harmless +0/-0 difference of the Y-up rotation.
    return struct.pack("<fff", *(0.0 if value == 0 else value for value in position))


def collection_bytes(items, name, width, code):
    values = array.array(code, [0]) * (len(items) * width)
    items.foreach_get(name, values)
    return values.tobytes()


def geometry_and_structure():
    """Hash actual mesh coordinates/topology and all object placement, not colors."""
    geometry = hashlib.sha256()
    mesh_counts = {}
    for mesh in sorted(bpy.data.meshes, key=lambda item: item.name):
        geometry.update(mesh.name.encode("utf-8"))
        for items, field, width, code in [
            (mesh.vertices, "co", 3, "f"),
            (mesh.edges, "vertices", 2, "i"),
            (mesh.loops, "vertex_index", 1, "i"),
            (mesh.loops, "edge_index", 1, "i"),
            (mesh.polygons, "loop_start", 1, "i"),
            (mesh.polygons, "loop_total", 1, "i"),
            (mesh.polygons, "material_index", 1, "i"),
        ]:
            geometry.update(collection_bytes(items, field, width, code))
        geometry.update(bytes(int(polygon.use_smooth) for polygon in mesh.polygons))
        mesh_counts[mesh.name] = [len(mesh.vertices), len(mesh.edges), len(mesh.polygons)]
    objects = []
    for obj in sorted(bpy.data.objects, key=lambda item: item.name):
        objects.append({
            "name": obj.name, "type": obj.type, "data": obj.data.name if obj.data else None,
            "parent": obj.parent.name if obj.parent else None,
            "parent_type": obj.parent_type, "parent_bone": obj.parent_bone,
            "collections": sorted(collection.name for collection in obj.users_collection),
            "matrix_world": [tuple(row) for row in obj.matrix_world],
            "matrix_local": [tuple(row) for row in obj.matrix_local],
            "matrix_basis": [tuple(row) for row in obj.matrix_basis],
            "matrix_parent_inverse": [tuple(row) for row in obj.matrix_parent_inverse],
            "hide_render": obj.hide_render, "hide_viewport": obj.hide_viewport,
        })
    scenes = [{"name": scene.name, "camera": scene.camera.name if scene.camera else None,
               "world": scene.world.name if scene.world else None,
               "objects": sorted(obj.name for obj in scene.objects)} for scene in bpy.data.scenes]
    return {"geometry_sha256": geometry.hexdigest(), "mesh_counts": mesh_counts,
            "objects_sha256": hashlib.sha256(json.dumps(objects, sort_keys=True).encode()).hexdigest(),
            "scenes_sha256": hashlib.sha256(json.dumps(scenes, sort_keys=True).encode()).hexdigest(),
            "object_count": len(objects), "mesh_count": len(mesh_counts)}


def unaffected_material_state(target_names):
    state = {}
    for obj in bpy.data.objects:
        if obj.name in target_names or obj.type != "MESH":
            continue
        attrs = []
        for attribute in obj.data.color_attributes:
            raw = collection_bytes(attribute.data, "color", 4, "f")
            attrs.append((attribute.name, attribute.domain, attribute.data_type, hashlib.sha256(raw).hexdigest()))
        state[obj.name] = {"materials": [slot.material.name if slot.material else None for slot in obj.material_slots], "colors": attrs}
    return state


def preflight(document, binary):
    plans = []
    seen_meshes = set()
    for node in document["nodes"]:
        if "mesh" not in node:
            continue
        gltf_mesh = document["meshes"][node["mesh"]]
        primitives = gltf_mesh["primitives"]
        polished = [p for p in primitives if document["materials"][p["material"]].get("extras", {}).get("trainingFinishCategory")]
        if not polished:
            continue
        require(len(primitives) == 1, f"{node['name']}: multi-material geometry requires manual review")
        obj = bpy.data.objects.get(node["name"])
        require(obj is not None and obj.type == "MESH", f"{node['name']}: current Blender mesh missing")
        mesh = obj.data
        require(mesh.users == 1, f"{obj.name}: shared mesh datablock cannot be colored independently")
        require(mesh.name not in seen_meshes, f"{obj.name}: repeated mesh datablock")
        seen_meshes.add(mesh.name)
        require(len(mesh.materials) == 1 and mesh.materials[0] is not None, f"{obj.name}: unexpected current material slots")
        require(all(p.material_index == 0 for p in mesh.polygons), f"{obj.name}: unexpected polygon materials")
        primitive = primitives[0]
        require("COLOR_0" in primitive["attributes"], f"{obj.name}: polished GLB lacks COLOR_0")
        positions = accessor(document, binary, primitive["attributes"]["POSITION"])
        colors = accessor(document, binary, primitive["attributes"]["COLOR_0"])
        require(len(positions) == len(colors), f"{obj.name}: GLB color/position mismatch")
        color_by_position = {}
        for position, color in zip(positions, colors):
            require(all(0 <= channel <= 1 for channel in color), f"{obj.name}: invalid color range")
            color = (*color, 1) if len(color) == 3 else color
            key = position_key(position)
            if key in color_by_position:
                require(max(abs(a-b) for a, b in zip(color_by_position[key], color)) < 0.00002,
                        f"{obj.name}: split-vertex colors require corner-domain synchronization")
            color_by_position[key] = color
        vertex_colors = []
        source_keys = set()
        for vertex in mesh.vertices:
            key = position_key((vertex.co.x, vertex.co.z, -vertex.co.y))
            require(key in color_by_position, f"{obj.name}: current vertex {vertex.index} differs from GLB; source untouched")
            source_keys.add(key)
            vertex_colors.extend(color_by_position[key])
        require(source_keys == set(color_by_position), f"{obj.name}: current Blender and GLB positions differ")
        index_count = document["accessors"][primitive["indices"]]["count"] if "indices" in primitive else len(positions)
        require((primitive.get("mode", 4) == 4 and index_count == sum(len(p.vertices)-2 for p in mesh.polygons)*3),
                f"{obj.name}: current triangulated face count differs from GLB")
        material = document["materials"][primitive["material"]]
        pbr = material.get("pbrMetallicRoughness", {})
        require(pbr.get("baseColorFactor", [1, 1, 1, 1]) == [1, 1, 1, 1], f"{obj.name}: unexpected base color multiplier")
        require(not any(key.endswith("Texture") for key in pbr), f"{obj.name}: textured material sync is unsupported")
        source = mesh.materials[0]
        require(source.use_nodes, f"{obj.name}: expected current node material")
        require(sum(node.bl_idname == "ShaderNodeBsdfPrincipled" for node in source.node_tree.nodes) == 1,
                f"{obj.name}: ambiguous source shader graph")
        existing = mesh.color_attributes.get(COLOR_LAYER)
        require(existing is None or (existing.domain == "POINT" and existing.data_type == "FLOAT_COLOR"),
                f"{obj.name}: incompatible existing finish color layer")
        plans.append({"object": obj, "material": material, "colors": vertex_colors})
    require(plans, "No polished material assignments found")
    return plans


def apply(plans):
    materials = {}
    for plan in plans:
        obj, gltf_material, colors = plan["object"], plan["material"], plan["colors"]
        mesh = obj.data
        attribute = mesh.color_attributes.get(COLOR_LAYER)
        if attribute is None:
            attribute = mesh.color_attributes.new(name=COLOR_LAYER, type="FLOAT_COLOR", domain="POINT")
        attribute.data.foreach_set("color", colors)
        source = mesh.materials[0]
        cache_key = (source.name, gltf_material["name"])
        if cache_key not in materials:
            material = source.copy()
            material.name = gltf_material["name"]
            shader = next(node for node in material.node_tree.nodes if node.bl_idname == "ShaderNodeBsdfPrincipled")
            nodes, links = material.node_tree.nodes, material.node_tree.links
            color_node = nodes.new("ShaderNodeVertexColor")
            color_node.layer_name = COLOR_LAYER
            color_node.label = "Polished GLB vertex colors"
            for link in list(shader.inputs["Base Color"].links):
                links.remove(link)
            links.new(color_node.outputs["Color"], shader.inputs["Base Color"])
            pbr = gltf_material.get("pbrMetallicRoughness", {})
            shader.inputs["Roughness"].default_value = pbr.get("roughnessFactor", 1)
            shader.inputs["Metallic"].default_value = pbr.get("metallicFactor", 1)
            shader.inputs["Alpha"].default_value = 1
            count = len(colors)//4
            material.diffuse_color = tuple(sum(colors[channel::4])/count for channel in range(3)) + (1,)
            material.use_backface_culling = not gltf_material.get("doubleSided", False)
            material["trainingFinishCategory"] = gltf_material["extras"]["trainingFinishCategory"]
            material["trainingFinishSource"] = "public/models/training/training-ground.glb"
            materials[cache_key] = material
        mesh.materials[0] = materials[cache_key]
    return len(materials)


def main():
    require(SOURCE.resolve() != OUTPUT.resolve(), "Output must differ from original Blender source")
    source_sha, glb_sha = sha_file(SOURCE), sha_file(GLB)
    document, binary = read_glb(GLB)
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    before = geometry_and_structure()
    plans = preflight(document, binary)
    target_names = {plan["object"].name for plan in plans}
    unaffected_before = unaffected_material_state(target_names)
    print(f"MATERIAL SYNC: validated {len(plans)} current mesh geometries before applying colors", flush=True)
    material_count = apply(plans)
    after = geometry_and_structure()
    require(before == after, "Geometry, hierarchy or transforms changed; refusing to save")
    require(unaffected_before == unaffected_material_state(target_names), "Unmatched object materials changed; refusing to save")
    require(sha_file(SOURCE) == source_sha, "Original Blender file changed during synchronization")
    require(sha_file(GLB) == glb_sha, "Polished GLB changed during synchronization; rerun with final colors")
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT), check_existing=False, copy=True)
    require(sha_file(SOURCE) == source_sha, "Original Blender file changed during save")
    require(before == geometry_and_structure(), "Geometry or structure changed during save")
    report = {"passed": True, "source": str(SOURCE), "output": str(OUTPUT), "glb": str(GLB),
              "sourceSha256Before": source_sha, "sourceSha256After": sha_file(SOURCE), "glbSha256": glb_sha,
              "outputSha256": sha_file(OUTPUT), "matchedEnvironmentMeshes": len(plans),
              "createdMaterials": material_count, "colorLayer": COLOR_LAYER,
              "unchangedObjects": len(bpy.data.objects)-len(plans),
              "geometryAndTransformsBefore": before, "geometryAndTransformsAfter": after,
              "unknownObjectMaterialsPreserved": True,
              "sourceUntouched": True}
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(plans)} environment meshes colored, {material_count} material copies; all geometry/transforms exact", flush=True)
    print(f"SAVED SEPARATE COPY: {OUTPUT}", flush=True)


if __name__ == "__main__":
    main()
