/** Color-only pass on the CURRENT GLB. Never runs the scene generator. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filename = path.join(root, 'public/models/training/training-ground.glb');
const palette = JSON.parse(fs.readFileSync(path.join(root, 'scripts/training-material-palette.json'), 'utf8'));
const input = fs.readFileSync(filename);
assert.equal(input.readUInt32LE(0), 0x46546c67);
assert.equal(input.readUInt32LE(4), 2);
const jsonLength = input.readUInt32LE(12);
const doc = JSON.parse(input.toString('utf8', 20, 20 + jsonLength));
const originalStructure = JSON.stringify({ nodes: doc.nodes, scenes: doc.scenes });
const binStart = 28 + jsonLength;
const originalBin = input.subarray(binStart, binStart + input.readUInt32LE(20 + jsonLength));
let bin = Buffer.from(originalBin);
const ownedColorViews = doc.accessors.filter((a) => a.extras?.trainingMaterialFinish).map((a) => doc.bufferViews[a.bufferView]);
const artifactDir = path.join(root, 'artifacts/training');
fs.mkdirSync(artifactDir, { recursive: true });
const backup = path.join(artifactDir, 'training-ground-before-materials.glb');
if (!fs.existsSync(backup)) fs.copyFileSync(filename, backup);
const linear = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const rgb = (hex) => [1, 3, 5].map((i) => linear(parseInt(hex.slice(i, i + 2), 16) / 255));
const colors = Object.fromEntries(Object.entries(palette).map(([key, value]) => [key, rgb(value.color)]));
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a.map((value, i) => value + (b[i] - value) * clamp(t));
const noise = (x, y, z) => Math.sin(x * .41 + z * .27) * .43 + Math.cos(z * .73 - x * .18 + y * .6) * .3 + Math.sin(x * 2.3 + z * 1.7 + y) * .17;
const hash = (value) => { let h = 2166136261; for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; };
const paths = JSON.parse(fs.readFileSync(path.join(root, 'public/models/training/training-ground.manifest.json'), 'utf8')).trenchPath;
function trenchDistance(x, z) {
  return Math.min(...paths.slice(1).map((end, i) => {
    const start = paths[i], dx = end[0] - start[0], dz = end[1] - start[1];
    const t = clamp(((x - start[0]) * dx + (z - start[1]) * dz) / (dx * dx + dz * dz));
    return Math.hypot(x - start[0] - t * dx, z - start[1] - t * dz);
  }));
}
function category(name, material) {
  if (name === 'terrain_sculpted_surface_mesh') return 'grass';
  if (/earth_profile|lower_foundation/.test(name)) return 'earth';
  if (/compacted_lane/.test(name)) return 'movement';
  if (/bare_observation/.test(name)) return 'openGround';
  if (/obstacle_pad|compacted_pad/.test(name)) return 'dirt';
  if (/path|approach/.test(name)) return 'path';
  if (/formation_paving/.test(name)) return 'paving';
  if (/Tree_A_canopies/.test(name)) return 'treeA';
  if (/Tree_B_canopies/.test(name)) return 'treeB';
  if (/Tree_C_canopies/.test(name)) return 'treeC';
  if (/branching/.test(name)) return 'bark';
  if (/Bush_Large/.test(name)) return 'bushLarge';
  if (/Bush_Medium/.test(name)) return 'bushMedium';
  if (/grass_clumps/.test(name)) return 'grassClump';
  if (/trench_.*(timber|boards|uprights)/.test(name)) return 'trenchWood';
  if (/rounded_sacks/.test(name)) return 'sandbag';
  if (/beveled_bricks/.test(name)) return 'brick';
  if (/scattered_stones/.test(name)) return 'stone';
  if (/flagpole/.test(name)) return 'flagpole';
  if (/concrete_panels/.test(name)) return 'concrete';
  return material.extras?.trainingFinishCategory ?? (palette[material.name] ? material.name : null);
}
function positions(index) {
  const a = doc.accessors[index], view = doc.bufferViews[a.bufferView];
  assert.equal(a.componentType, 5126);
  assert.equal(a.type, 'VEC3');
  return Array.from({ length: a.count }, (_, i) => {
    const offset = (view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * (view.byteStride ?? 12);
    return [0, 4, 8].map((axis) => bin.readFloatLE(offset + axis));
  });
}
function boundaryVertices(primitive) {
  if (primitive.indices === undefined) return new Set();
  const accessor = doc.accessors[primitive.indices], view = doc.bufferViews[accessor.bufferView];
  const size = accessor.componentType === 5125 ? 4 : accessor.componentType === 5123 ? 2 : 1;
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const indices = Array.from({ length: accessor.count }, (_, i) => bin.readUIntLE(offset + i * size, size));
  const edges = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [[indices[i], indices[i + 1]], [indices[i + 1], indices[i + 2]], [indices[i + 2], indices[i]]]) {
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  return new Set([...edges].filter(([, count]) => count === 1).flatMap(([key]) => key.split(',').map(Number)));
}
function vertexColor(key, name, p) {
  const [x, y, z] = p;
  let color = colors[key];
  let variation = 1 + noise(x, y, z) * .08;
  if (key === 'grass') {
    // All existing ground heights stay untouched; only paint its surface.
    color = mix(colors.grass, colors.openGround, .11 + .15 * noise(x * .6, 0, z * .6));
    const d = trenchDistance(x, z);
    const earthMix = Math.max(1 - smooth(1.25, 2.35, d), 1 - smooth(-.1, .08, y));
    color = mix(color, colors.earth, earthMix);
    variation = 1 + noise(x, y, z) * .12 + noise(x * 3, y, z * 3) * .035;
  } else if (/tree|bush|grassClump/.test(key)) {
    const assetTone = hash(`${name}:${Math.floor(x / 3)}:${Math.floor(z / 3)}`) - .5;
    variation = .9 + .14 * smooth(0, 7, y) + assetTone * .15 + noise(x, y * 2, z) * .09;
  } else if (key === 'wood' || key === 'trenchWood' || key === 'bark') {
    variation = .98 + noise(x * .5, y, z * .5) * .12 + Math.sin(x * 18 + y * .9 + z * 11) * .035;
  } else if (key === 'sandbag' || key === 'brick' || key === 'paving') {
    const repeat = key === 'brick' ? .24 : key === 'sandbag' ? .6 : 1;
    variation = .95 + .12 * hash(`${name}:${Math.floor(x / repeat)}:${Math.floor(y / .2)}:${Math.floor(z / repeat)}`) + noise(x, y, z) * .035;
  } else if (['chalk', 'sign', 'metal', 'flagpole', 'gold', 'flag', 'red'].includes(key)) {
    variation = 1;
  }
  return [...color.map((c) => clamp(c * variation)), 1];
}

const summary = [];
const materialCache = new Map();
for (const mesh of doc.meshes) {
  for (const primitive of mesh.primitives) {
    const source = doc.materials[primitive.material];
    const key = category(mesh.name, source);
    if (!key) continue; // Leave unfamiliar/manual material assignments intact.
    const existing = primitive.attributes.COLOR_0;
    if (existing !== undefined && !doc.accessors[existing].extras?.trainingMaterialFinish) continue;
    const cacheKey = `${primitive.material}:${key}`;
    let materialIndex = source.extras?.trainingFinishCategory === key ? primitive.material : materialCache.get(cacheKey);
    if (materialIndex === undefined) {
      const mat = structuredClone(source), finish = palette[key];
      mat.name = `Training_${key}`;
      mat.pbrMetallicRoughness = { ...mat.pbrMetallicRoughness, baseColorFactor: [1, 1, 1, 1], metallicFactor: finish.metallic ?? 0, roughnessFactor: finish.roughness };
      mat.extras = { ...mat.extras, trainingFinishCategory: key, sourceMaterial: source.name };
      materialIndex = doc.materials.push(mat) - 1; materialCache.set(cacheKey, materialIndex);
    }
    primitive.material = materialIndex;
    const vertices = positions(primitive.attributes.POSITION);
    const softenedEdge = ['path', 'movement', 'dirt', 'openGround'].includes(key) ? boundaryVertices(primitive) : new Set();
    // Normalized uint16 avoids banding in dark foliage, at 8 bytes per vertex.
    const bytes = Buffer.alloc(vertices.length * 8);
    vertices.forEach((p, index) => {
      const color = vertexColor(key, mesh.name, p);
      if (softenedEdge.has(index)) {
        const edge = mix(color, vertexColor('grass', mesh.name, p), .52);
        color.splice(0, 3, ...edge.slice(0, 3));
      }
      color.forEach((value, component) => bytes.writeUInt16LE(Math.round(value * 65535), index * 8 + component * 2));
    });
    if (existing !== undefined) {
      const view = doc.bufferViews[doc.accessors[existing].bufferView];
      assert.equal(view.byteLength, bytes.length); bytes.copy(bin, view.byteOffset);
    } else {
      const offset = bin.length;
      bin = Buffer.concat([bin, bytes]);
      const view = doc.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target: 34962 }) - 1;
      primitive.attributes.COLOR_0 = doc.accessors.push({ bufferView: view, componentType: 5123, normalized: true, count: vertices.length, type: 'VEC4', extras: { trainingMaterialFinish: true } }) - 1;
    }
    summary.push({ mesh: mesh.name, material: key, vertices: vertices.length });
  }
}
doc.buffers[0].byteLength = bin.length;
assert.equal(JSON.stringify({ nodes: doc.nodes, scenes: doc.scenes }), originalStructure);
// A rerun may update only color ranges previously owned by this script.
const beforeGeometry = Buffer.from(originalBin), afterGeometry = Buffer.from(bin.subarray(0, originalBin.length));
for (const view of ownedColorViews) {
  beforeGeometry.fill(0, view.byteOffset, view.byteOffset + view.byteLength);
  afterGeometry.fill(0, view.byteOffset, view.byteOffset + view.byteLength);
}
assert.deepEqual(afterGeometry, beforeGeometry, 'Existing geometry buffer must remain byte-identical');
const json = Buffer.from(JSON.stringify(doc));
const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJson.length + bin.length, 8); header.writeUInt32LE(paddedJson.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(filename, Buffer.concat([header, paddedJson, binHeader, bin]));
fs.writeFileSync(path.join(artifactDir, 'material-polish-report.json'), JSON.stringify({ source: filename, backup, meshes: summary.length, originalBytes: input.length, outputBytes: fs.statSync(filename).size, preserved: 'All nodes, transforms, indices, positions, normals and existing attributes', palette, assignments: summary }, null, 2));
console.log(`Material pass: ${summary.length} meshes; ${(fs.statSync(filename).size / 1e6).toFixed(2)} MB; geometry buffer unchanged.`);
