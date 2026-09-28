// Read-only geometry/animation verification. Textures are omitted in memory only;
// verify actual materials and GPU rendering in the browser as well.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { AnimationMixer, Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DEFAULT_AK_MODEL, EXTENDED_AK_MODEL, getAKModelPath, getAKClipTime } from '../src/data/ak47ProcedureAsset.ts';

for (const section of ['structure', 'procedure']) {
  for (const mode of ['thao', 'lap']) {
    for (let step = -1; step < 6; step++) {
      const extended = section === 'procedure' && mode === 'thao' && (step === 4 || step === 5);
      assert.equal(getAKModelPath(section, mode, step), extended ? EXTENDED_AK_MODEL : DEFAULT_AK_MODEL);
    }
  }
}
for (const time of [0, 3.5, 5.83, 9.17, 11, 13.42, 15.42]) {
  assert.equal(getAKClipTime(DEFAULT_AK_MODEL, time), time);
}
assert.equal(getAKClipTime(EXTENDED_AK_MODEL, 11), 11);
assert.equal(getAKClipTime(EXTENDED_AK_MODEL, 13.42), 382 / 24);
assert.equal(getAKClipTime(EXTENDED_AK_MODEL, 15.42), 430 / 24);

const paths = ['public/models/ak47.glb', 'public/models/gun ak47 (2).glb'];
const results = [];
for (const path of paths) {
  const source = fs.readFileSync(path);
  assert.equal(source.readUInt32LE(0), 0x46546c67);
  assert.equal(source.readUInt32LE(8), source.length);
  const length = source.readUInt32LE(12);
  const doc = JSON.parse(source.toString('utf8', 20, 20 + length));
  const materials = JSON.stringify(doc.materials);
  const imageCount = doc.images?.length ?? 0;
  assert.ok(doc.images.every(image => image.bufferView !== undefined), 'Embedded textures');
  doc.materials = doc.materials.map(material => ({ name: material.name }));
  delete doc.images;
  delete doc.textures;
  delete doc.samplers;
  const raw = Buffer.from(JSON.stringify(doc));
  const json = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20);
  raw.copy(json);
  const bin = source.subarray(20 + length);
  const glb = Buffer.alloc(20 + json.length + bin.length);
  source.copy(glb, 0, 0, 20);
  glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(json.length, 12);
  json.copy(glb, 20);
  bin.copy(glb, 20 + json.length);
  const { scene, animations } = await new GLTFLoader().parseAsync(glb.buffer, '');
  assert.equal(animations.length, 1);
  assert.ok(animations[0].duration >= 13.42);
  const mixer = new AnimationMixer(scene);
  const action = mixer.clipAction(animations[0]);
  action.play();
  action.paused = true;
  const samples = [0, 11, 13.42, 15.42].map(time => {
    action.time = time;
    mixer.update(0);
    scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3()).toArray();
    const center = box.getCenter(new Vector3()).toArray();
    assert.ok([...size, ...center].every(Number.isFinite));
    return { time, size, center };
  });
  if (path === paths[1]) {
    const bolt = scene.getObjectByName('vtulk_low_mat1_0');
    const tube = scene.getObjectByName('pd3_low001');
    assert.ok(bolt && tube, 'Authored animation targets exist');
    function pose(procedureTime) {
      action.time = Math.min(animations[0].duration, getAKClipTime(EXTENDED_AK_MODEL, procedureTime));
      mixer.update(0);
      return { bolt: bolt.position.clone(), tube: tube.position.clone(), tubeRotation: tube.quaternion.clone() };
    }
    const start = pose(11), step5 = pose(13.42), step6 = pose(15.42);
    assert.ok(step5.bolt.distanceTo(start.bolt) > 0.5, 'Step 5 plays the added separation');
    assert.ok(step5.tubeRotation.angleTo(start.tubeRotation) < 0.001, 'Step 5 does not play step 6 rotation');
    assert.ok(step6.bolt.distanceTo(step5.bolt) < 1e-6, 'Step 6 retains separation');
    assert.ok(step6.tube.distanceTo(step5.tube) > 100, 'Step 6 reaches the authored final pose');
    assert.ok(pose(13.42).bolt.distanceTo(step5.bolt) < 1e-6, 'Back from step 6 preserves step 5');
    assert.ok(pose(11).bolt.distanceTo(start.bolt) < 1e-6, 'Backward scrubbing restores pose');
  }
  results.push({ path, materials, imageCount, samples, clip: animations[0].name, duration: animations[0].duration, tracks: animations[0].tracks.length });
}
assert.equal(results[0].materials, results[1].materials, 'Preserve authored materials');
for (let i = 0; i < results[0].samples.length; i++) {
  const before = results[0].samples[i], after = results[1].samples[i];
  for (let axis = 0; axis < 3; axis++) {
    assert.ok(Math.abs(before.size[axis] - after.size[axis]) < 0.1, 'Compatible model scale');
    assert.ok(Math.abs(before.center[axis] - after.center[axis]) < 0.1, 'Compatible framing');
  }
}
console.log(JSON.stringify(results.map(({ materials, ...result }) => result), null, 2));
console.log('PASS: GLTFLoader, embedded textures, material definitions, timeline range and framing.');
