/** Read-only GLB structure, rig and animation validation. No extra packages. */
import fs from 'node:fs';
import path from 'node:path';

const requested = ['Idle', 'Attention', 'AtEase', 'Walk', 'Run', 'TurnLeft', 'TurnRight', 'Salute', 'SitDown', 'StandUp', 'LookAround'];
const files = process.argv.slice(2).length ? process.argv.slice(2) : [
  'public/models/vietnam_people_army_clean.glb',
  'public/models/vietnam_people_army_rigged.glb',
  'public/models/training/soldier-animated.glb',
];
const output = [];
for (const file of files) {
  const bytes = fs.readFileSync(file);
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`${file}: invalid GLB header`);
  const jsonLength = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const binStart = 28 + jsonLength;
  const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const components = { 5120: [1, 'readInt8'], 5121: [1, 'readUInt8'], 5122: [2, 'readInt16LE'], 5123: [2, 'readUInt16LE'], 5125: [4, 'readUInt32LE'], 5126: [4, 'readFloatLE'] };
  function read(index) {
    const a = doc.accessors[index];
    const view = doc.bufferViews[a.bufferView];
    const [size, reader] = components[a.componentType];
    const count = width[a.type];
    const stride = view.byteStride || count * size;
    const start = binStart + (view.byteOffset || 0) + (a.byteOffset || 0);
    if (start + (a.count - 1) * stride + count * size > binStart + view.byteOffset + view.byteLength) throw new Error(`${file}: accessor ${index} out of bounds`);
    return Array.from({ length: a.count }, (_, i) => Array.from({ length: count }, (_, j) => bytes[reader](start + i * stride + j * size)));
  }
  let vertices = 0, triangles = 0;
  const meshes = (doc.meshes || []).map(m => ({
    name: m.name,
    primitives: m.primitives.map(p => {
      const vertexCount = doc.accessors[p.attributes.POSITION].count;
      const triangleCount = (p.indices === undefined ? vertexCount : doc.accessors[p.indices].count) / 3;
      vertices += vertexCount; triangles += triangleCount;
      return { vertices: vertexCount, triangles: triangleCount, material: doc.materials?.[p.material]?.name, attributes: Object.keys(p.attributes) };
    }),
  }));
  const parent = new Map();
  doc.nodes?.forEach((n, index) => n.children?.forEach(child => parent.set(child, index)));
  const clips = (doc.animations || []).map(a => {
    let duration = 0, largestLoopEndpointDifference = 0;
    for (const channel of a.channels) {
      if (!doc.nodes[channel.target.node]) throw new Error(`Unknown animation target in ${a.name}`);
      const sampler = a.samplers[channel.sampler];
      const times = read(sampler.input).flat();
      const values = read(sampler.output);
      if (!times.every((time, i) => Number.isFinite(time) && (i === 0 || time > times[i - 1]))) throw new Error(`${a.name}: nonincreasing time`);
      if (!values.flat().every(Number.isFinite)) throw new Error(`${a.name}: nonfinite value`);
      duration = Math.max(duration, times.at(-1));
      const first = values[0], last = values.at(-1);
      let diff = Math.max(...first.map((v, i) => Math.abs(v - last[i])));
      if (channel.target.path === 'rotation') diff = Math.min(diff, Math.max(...first.map((v, i) => Math.abs(v + last[i]))));
      largestLoopEndpointDifference = Math.max(largestLoopEndpointDifference, diff);
    }
    return { name: a.name, duration, channels: a.channels.length, loop: a.extras?.loop ?? null, largestLoopEndpointDifference };
  });
  const skins = (doc.skins || []).map(s => ({
    name: s.name, skeleton: doc.nodes[s.skeleton]?.name,
    bones: s.joints.map(i => ({ index: i, name: doc.nodes[i].name, parent: doc.nodes[parent.get(i)]?.name || null })),
    inverseBindMatrixCount: doc.accessors[s.inverseBindMatrices].count,
  }));
  const hierarchy = doc.nodes.map((node, index) => ({ index, name: node.name, parent: parent.get(index) ?? null, mesh: node.mesh ?? null, skin: node.skin ?? null, translation: node.translation, scale: node.scale }));
  const report = { file, bytes: bytes.length, megabytes: +(bytes.length / 1e6).toFixed(2), generator: doc.asset.generator, scenes: doc.scenes.map(s => s.name || '(unnamed)'), meshCount: meshes.length, vertices, triangles, textureCount: doc.images?.length || 0, skins, clips, meshes, hierarchy };
  if (file.includes('soldier-animated')) {
    const missing = requested.filter(name => !clips.some(c => c.name === name));
    if (missing.length) throw new Error(`Missing clips: ${missing.join(', ')}`);
    if (skins.length !== 1 || skins[0].bones.length !== 20) throw new Error('Original 20-joint skeleton was not preserved');
    for (const name of ['Idle', 'Attention', 'AtEase', 'Walk', 'Run', 'LookAround']) {
      if (clips.find(c => c.name === name).largestLoopEndpointDifference > .001) throw new Error(`${name}: loop discontinuity`);
    }
    report.validation = { requiredClips: '11/11', preservedRig: '20/20 joints', loopEndpoints: 'continuous', finiteValues: true, accessorsWithinBounds: true };
  }
  output.push(report);
  console.log(`${file}: ${(bytes.length / 1e6).toFixed(2)} MB, ${meshes.length} meshes, ${triangles} triangles, ${skins[0]?.bones.length || 0} bones`);
  console.log(`  clips: ${clips.map(c => `${c.name} (${c.duration.toFixed(3)}s)`).join(', ') || 'none'}`);
}
fs.mkdirSync('artifacts/training', { recursive: true });
fs.writeFileSync(path.resolve('artifacts/training/soldier-inspection.json'), JSON.stringify(output, null, 2) + '\n');
