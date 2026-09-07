/** Node-side Three.js rig/mixer check; textures omitted only in the memory copy.
 * The shipped GLB is never changed. Use browser verification for texture/GPU checks.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { AnimationMixer, Box3, LoopOnce, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const source = fs.readFileSync('public/models/training/soldier-animated.glb');
const jsonLength = source.readUInt32LE(12);
const doc = JSON.parse(source.toString('utf8', 20, 20 + jsonLength));
doc.materials = doc.materials.map(material => ({ name: material.name, doubleSided: material.doubleSided, pbrMetallicRoughness: { baseColorFactor: [.5, .5, .5, 1] } }));
delete doc.images;
delete doc.textures;
delete doc.samplers;
const raw = Buffer.from(JSON.stringify(doc));
const json = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20);
raw.copy(json);
const bin = source.subarray(20 + jsonLength);
const glb = Buffer.alloc(20 + json.length + bin.length);
glb.writeUInt32LE(0x46546c67, 0);
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(glb.length, 8);
glb.writeUInt32LE(json.length, 12);
glb.writeUInt32LE(0x4e4f534a, 16);
json.copy(glb, 20);
bin.copy(glb, 20 + json.length);
const result = await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '');
const actor = clone(result.scene);
const mixer = new AnimationMixer(actor);
const skinnedMeshes = [];
actor.traverse(object => { if (object.isSkinnedMesh) skinnedMeshes.push(object); });
assert.equal(skinnedMeshes.length, 44);
assert.equal(skinnedMeshes[0].skeleton.bones.length, 20);
assert.ok(skinnedMeshes.every(mesh => mesh.skeleton.boneInverses.length === 20));
const originalMesh = result.scene.getObjectByName(skinnedMeshes[0].name);
assert.notEqual(skinnedMeshes[0].skeleton, originalMesh.skeleton, 'Clones need independent skeleton state');

function activate(name) {
  mixer.stopAllAction();
  const clip = result.animations.find(animation => animation.name === name);
  assert.ok(clip, `Missing ${name}`);
  const action = mixer.clipAction(clip);
  action.setLoop(LoopOnce, 1);
  action.clampWhenFinished = true;
  action.reset().play();
  return { clip, action };
}
function sample(name, fraction) {
  const { clip } = activate(name);
  mixer.setTime(clip.duration * fraction);
  actor.updateMatrixWorld(true);
  for (const mesh of skinnedMeshes) {
    mesh.skeleton.update();
    mesh.computeBoundingBox();
  }
  const foot = actor.getObjectByName('LeftFoot').getWorldPosition(new Vector3());
  const bounds = new Box3().setFromObject(actor);
  assert.ok([...foot.toArray(), ...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
  return { fraction, time: clip.duration * fraction, leftFoot: foot.toArray(), bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() } };
}
const standing = sample('Idle', 0);
assert.ok(Math.abs(standing.bounds.min[1]) < .005);
assert.ok(Math.abs(standing.bounds.max[1] - 1.75) < .01);
const locomotion = [];
for (const [name, duty] of [['Walk', .60], ['Run', .48]]) {
  const samples = [.04, duty / 2, duty - .04].map(fraction => sample(name, fraction));
  const start = samples[0], end = samples.at(-1);
  const plantedFootBackwardSpeed = (start.leftFoot[2] - end.leftFoot[2]) / (end.time - start.time);
  locomotion.push({ name, duration: result.animations.find(c => c.name === name).duration, stanceFraction: duty, plantedFootBackwardSpeed, recommendedForwardSpeed: +plantedFootBackwardSpeed.toFixed(2), samples });
}
const poses = result.animations.map(clip => ({ name: clip.name, sample: sample(clip.name, .5) }));
const { action: previous } = activate('Walk');
mixer.update(.3);
const next = mixer.clipAction(result.animations.find(clip => clip.name === 'Run'));
previous.fadeOut(.25);
next.reset().fadeIn(.25).play();
mixer.update(.125);
assert.ok(previous.getEffectiveWeight() > 0 && next.getEffectiveWeight() > 0, 'Crossfade must overlap');
mixer.update(.2);
assert.ok(previous.getEffectiveWeight() < .001 && next.getEffectiveWeight() > .999, 'Crossfade must finish');
const report = { status: 'passed', scope: 'Three GLTFLoader, SkeletonUtils.clone, skin bindings, AnimationMixer and crossfade; textures/GPU require browser checks', skinnedMeshes: 44, joints: 20, clips: poses.length, standing, locomotion, poses };
fs.mkdirSync('artifacts/training', { recursive: true });
fs.writeFileSync('artifacts/training/soldier-three-verification.json', JSON.stringify(report, null, 2) + '\n');
console.log('Three GLTFLoader / skeleton cloning / 17 clips / crossfade: PASS');
for (const entry of locomotion) console.log(`${entry.name}: planted foot stroke speed ${entry.plantedFootBackwardSpeed.toFixed(4)} m/s; recommended parent translation ${entry.recommendedForwardSpeed} m/s at action timeScale=1`);
