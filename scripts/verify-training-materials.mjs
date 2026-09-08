/** Check the material pass against the exact current-state snapshot, without editing assets. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const beforePath = path.resolve(root, process.argv[2] || 'artifacts/training/training-ground-before-materials.glb');
const afterPath = path.resolve(root, process.argv[3] || 'public/models/training/training-ground.glb');
const reportPath = path.resolve(root, 'artifacts/training/material-polish-verification.json');
const componentInfo = {
  5120: [1, 'readInt8', 127], 5121: [1, 'readUInt8', 255],
  5122: [2, 'readInt16LE', 32767], 5123: [2, 'readUInt16LE', 65535],
  5125: [4, 'readUInt32LE', 4294967295], 5126: [4, 'readFloatLE', 1],
};
const componentCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function readGlb(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, `${file}: GLB magic`);
  assert.equal(bytes.readUInt32LE(4), 2, `${file}: GLB version`);
  assert.equal(bytes.readUInt32LE(8), bytes.length, `${file}: GLB byte length`);
  let doc, bin;
  for (let offset = 12; offset < bytes.length;) {
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + length;
    assert.ok(end <= bytes.length && length % 4 === 0, `${file}: chunk bounds/alignment`);
    if (type === 0x4e4f534a) doc = JSON.parse(bytes.toString('utf8', offset + 8, end));
    if (type === 0x004e4942) bin = bytes.subarray(offset + 8, end);
    offset = end;
  }
  assert.ok(doc && bin, `${file}: JSON and BIN chunks required`);
  assert.equal(doc.buffers.length, 1, `${file}: embedded buffer count`);
  assert.ok(!doc.buffers[0].uri, `${file}: buffer must be embedded`);
  assert.ok(doc.buffers[0].byteLength <= bin.length, `${file}: embedded buffer bounds`);
  return { file, bytes, doc, bin };
}

function accessorInfo(glb, index) {
  const accessor = glb.doc.accessors[index];
  assert.ok(accessor && !accessor.sparse, `Accessor ${index}: supported dense accessor`);
  const view = glb.doc.bufferViews[accessor.bufferView];
  assert.ok(view && (view.buffer ?? 0) === 0, `Accessor ${index}: embedded buffer view`);
  const info = componentInfo[accessor.componentType], width = componentCount[accessor.type];
  assert.ok(info && width, `Accessor ${index}: supported component/type`);
  const [size, reader, normalize] = info;
  const stride = view.byteStride || size * width;
  const start = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const end = start + Math.max(0, accessor.count - 1) * stride + size * width;
  assert.ok(stride >= size * width, `Accessor ${index}: valid stride`);
  assert.ok(end <= (view.byteOffset || 0) + view.byteLength && end <= glb.doc.buffers[0].byteLength,
    `Accessor ${index}: byte range in buffer`);
  return { accessor, size, reader, normalize, width, stride, start };
}

function readAccessor(glb, index) {
  const info = accessorInfo(glb, index);
  const values = new Float64Array(info.accessor.count * info.width);
  for (let row = 0; row < info.accessor.count; row++) {
    for (let col = 0; col < info.width; col++) {
      let value = glb.bin[info.reader](info.start + row * info.stride + col * info.size);
      if (info.accessor.normalized) value = Math.max(-1, value / info.normalize);
      assert.ok(Number.isFinite(value), `Accessor ${index}: finite values`);
      values[row * info.width + col] = value;
    }
  }
  return { values, ...info };
}

function compareAccessorBytes(before, after, index, label) {
  assert.deepEqual(after.doc.accessors[index], before.doc.accessors[index], `${label}: accessor metadata`);
  const a = accessorInfo(before, index), b = accessorInfo(after, index);
  for (let row = 0; row < a.accessor.count; row++) {
    const aStart = a.start + row * a.stride, bStart = b.start + row * b.stride;
    assert.ok(before.bin.subarray(aStart, aStart + a.size * a.width).equals(
      after.bin.subarray(bStart, bStart + b.size * b.width)), `${label}: row ${row} bytes unchanged`);
  }
}

function meshWithoutMaterialsAndColors(mesh) {
  const clean = structuredClone(mesh);
  for (const primitive of clean.primitives) {
    delete primitive.material;
    for (const attribute of Object.keys(primitive.attributes)) {
      if (/^COLOR_/.test(attribute)) delete primitive.attributes[attribute];
    }
  }
  return clean;
}

async function verify() {
  const before = readGlb(beforePath), after = readGlb(afterPath);
  assert.deepEqual(after.doc.nodes, before.doc.nodes, 'All nodes, transforms, names, extras and placements preserved');
  assert.deepEqual(after.doc.scenes, before.doc.scenes, 'Scene hierarchy preserved');
  assert.equal(after.doc.scene, before.doc.scene, 'Default scene preserved');
  for (const key of ['animations', 'skins', 'cameras', 'images', 'textures']) {
    assert.deepEqual(after.doc[key], before.doc[key], `${key} preserved`);
  }
  assert.equal(after.doc.meshes.length, before.doc.meshes.length, 'Mesh count preserved');
  assert.deepEqual(after.doc.accessors.slice(0, before.doc.accessors.length), before.doc.accessors,
    'Every original accessor preserved');
  assert.deepEqual(after.doc.bufferViews.slice(0, before.doc.bufferViews.length), before.doc.bufferViews,
    'Every original buffer view preserved');
  const originalBinary = before.bin.subarray(0, before.doc.buffers[0].byteLength);
  assert.ok(after.bin.subarray(0, originalBinary.length).equals(originalBinary), 'Original binary geometry data preserved byte-for-byte');

  let vertices = 0, triangles = 0, primitives = 0, unchangedAttributes = 0, expectedColoredPrimitives = 0;
  const coloredMeshes = [];
  for (let meshIndex = 0; meshIndex < before.doc.meshes.length; meshIndex++) {
    const oldMesh = before.doc.meshes[meshIndex], mesh = after.doc.meshes[meshIndex];
    assert.deepEqual(meshWithoutMaterialsAndColors(mesh), meshWithoutMaterialsAndColors(oldMesh),
      `${oldMesh.name}: topology and mesh metadata preserved`);
    for (let primitiveIndex = 0; primitiveIndex < oldMesh.primitives.length; primitiveIndex++) {
      const oldPrimitive = oldMesh.primitives[primitiveIndex], primitive = mesh.primitives[primitiveIndex];
      const label = `${oldMesh.name}/${primitiveIndex}`;
      primitives++;
      for (const [name, index] of Object.entries(oldPrimitive.attributes)) {
        if (/^COLOR_/.test(name)) continue;
        assert.equal(primitive.attributes[name], index, `${label}: ${name} accessor preserved`);
        compareAccessorBytes(before, after, index, `${label}/${name}`);
        unchangedAttributes++;
      }
      if (oldPrimitive.indices !== undefined) compareAccessorBytes(before, after, oldPrimitive.indices, `${label}/indices`);
      const position = before.doc.accessors[oldPrimitive.attributes.POSITION];
      vertices += position.count;
      if ((oldPrimitive.mode ?? 4) === 4) triangles += (oldPrimitive.indices === undefined ? position.count : before.doc.accessors[oldPrimitive.indices].count) / 3;
      const oldMaterial = before.doc.materials[oldPrimitive.material];
      const material = after.doc.materials[primitive.material];
      assert.ok(material, `${label}: material exists`);
      if (oldMaterial?.name === 'organic') {
        expectedColoredPrimitives++;
        assert.ok(primitive.attributes.COLOR_0 !== undefined, `${label}: missing organic colors restored`);
        assert.notEqual(material.name, 'organic', `${label}: semantic material assigned`);
      }
      if (primitive.attributes.COLOR_0 === undefined) continue;
      const color = readAccessor(after, primitive.attributes.COLOR_0);
      assert.ok(color.width === 3 || color.width === 4, `${label}: RGB/RGBA color format`);
      assert.equal(color.accessor.count, position.count, `${label}: color/vertex counts match`);
      assert.ok(color.accessor.componentType === 5126 || ([5121, 5123].includes(color.accessor.componentType) && color.accessor.normalized),
        `${label}: glTF color component format`);
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      let allWhite = true;
      for (let i = 0; i < color.values.length; i += color.width) {
        for (let channel = 0; channel < color.width; channel++) {
          const value = color.values[i + channel];
          assert.ok(value >= 0 && value <= 1, `${label}: color within [0,1]`);
          if (channel < 3) {
            min[channel] = Math.min(min[channel], value);
            max[channel] = Math.max(max[channel], value);
            if (value < .98) allWhite = false;
          }
        }
      }
      const factor = material.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1];
      assert.ok(!allWhite || factor.slice(0, 3).some(value => value < .95), `${label}: effective base color is not white blockout`);
      const maximumChannelRange = Math.max(...max.map((value, channel) => value - min[channel]));
      if (/terrain_sculpted_surface|vegetation_(Tree|Bush|grass)|formation_paving|sandbag_staggered|wall_individual/.test(mesh.name)) {
        assert.ok(maximumChannelRange > .001, `${label}: visible material variation present`);
      }
      coloredMeshes.push({ name: mesh.name, primitive: primitiveIndex, material: material.name,
        vertices: position.count, minimumRgb: min, maximumRgb: max, maximumChannelRange });
    }
  }
  assert.ok(expectedColoredPrimitives > 0, 'Snapshot contains organic blockout meshes');
  for (let index = 0; index < after.doc.accessors.length; index++) accessorInfo(after, index);

  const arrayBuffer = after.bytes.buffer.slice(after.bytes.byteOffset, after.bytes.byteOffset + after.bytes.byteLength);
  const loaded = await new GLTFLoader().parseAsync(arrayBuffer, '');
  let loadedMeshes = 0, loadedColorMeshes = 0;
  loaded.scene.traverse(object => {
    if (!object.isMesh) return;
    loadedMeshes++;
    if (!object.geometry.getAttribute('color')) return;
    loadedColorMeshes++;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    assert.ok(materials.every(material => material.isMeshStandardMaterial && material.vertexColors),
      `${object.name}: GLTFLoader enables material vertex colors`);
    assert.equal(object.geometry.getAttribute('color').count, object.geometry.getAttribute('position').count,
      `${object.name}: runtime color attribute count`);
  });
  assert.equal(loadedMeshes, primitives, 'Runtime GLTFLoader mesh count');
  assert.equal(loadedColorMeshes, coloredMeshes.length, 'Runtime GLTFLoader color mesh count');
  return {
    passed: true,
    before: { file: path.relative(root, beforePath), bytes: before.bytes.length, sha256: hash(before.bytes) },
    after: { file: path.relative(root, afterPath), bytes: after.bytes.length, sha256: hash(after.bytes) },
    preservation: { nodeCount: before.doc.nodes.length, meshCount: before.doc.meshes.length, primitives, vertices, triangles,
      originalBinaryBytes: originalBinary.length, originalBinarySha256: hash(originalBinary),
      originalAccessors: before.doc.accessors.length, originalBufferViews: before.doc.bufferViews.length, unchangedAttributes,
      nodesAndTransforms: 'exact', scenesAndHierarchy: 'exact', originalGeometryBytes: 'exact', topologyAndBounds: 'exact' },
    materials: { restoredOrganicPrimitives: expectedColoredPrimitives, coloredPrimitives: coloredMeshes.length,
      finiteNormalizedColors: true, variationVerified: true, whiteOrganicMaterialUse: false, meshes: coloredMeshes },
    runtime: { loader: 'Three.js GLTFLoader', meshes: loadedMeshes, vertexColorMeshes: loadedColorMeshes, vertexColorsEnabled: true },
  };
}

try {
  const report = await verify();
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`PASS: ${report.preservation.nodeCount} nodes / ${report.preservation.meshCount} meshes / ${report.preservation.triangles.toLocaleString()} triangles preserved exactly.`);
  console.log(`PASS: ${report.preservation.originalBinaryBytes.toLocaleString()} original geometry bytes unchanged; ${report.materials.restoredOrganicPrimitives} organic meshes restored, ${report.runtime.vertexColorMeshes} runtime vertex-color meshes.`);
  console.log(`Report: ${path.relative(root, reportPath)}`);
} catch (error) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify({ passed: false, before: beforePath, after: afterPath, error: error.message }, null, 2)}\n`);
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
