import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AnimationMixer, Bone, SkinnedMesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { SOLDIER_ANIMATIONS, SoldierAnimationPlayback } from '../../src/components/training/animationController';
import { MOVEMENT_ROUTE_LENGTH, sampleMovementRoute, SQUAD_SPACING_METERS } from '../../src/components/training/trainingMotion';

function near(actual: number, expected: number, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

// Keep the real vertex, skeleton and animation buffers; strip material references
// so Three's GLTFLoader can run headlessly without a browser image decoder.
const bytes = await readFile(new URL('../../public/models/training/soldier-animated.glb', import.meta.url));
assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
const jsonLength = bytes.readUInt32LE(12);
const document = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
for (const mesh of document.meshes) {
  for (const primitive of mesh.primitives) delete primitive.material;
}
delete document.materials;
delete document.textures;
delete document.images;
const encoded = Buffer.from(JSON.stringify(document));
const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
encoded.copy(padded);
const binaryChunk = bytes.subarray(20 + jsonLength);
const header = Buffer.alloc(20);
header.write('glTF');
header.writeUInt32LE(2, 4);
header.writeUInt32LE(20 + padded.length + binaryChunk.length, 8);
header.writeUInt32LE(padded.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const headlessAsset = Buffer.concat([header, padded, binaryChunk]);
const gltf = await new GLTFLoader().parseAsync(
  headlessAsset.buffer.slice(headlessAsset.byteOffset, headlessAsset.byteOffset + headlessAsset.byteLength), '',
);
for (const name of SOLDIER_ANIMATIONS) {
  const clip = gltf.animations.find((item) => item.name === name);
  assert.ok(clip && clip.duration > 0 && clip.tracks.length > 0, `Missing playable ${name}`);
}
console.log('PASS: exported GLB contains all eleven playable authored clips.');

function subject() {
  const model = clone(gltf.scene);
  const mixer = new AnimationMixer(model);
  const actions = Object.fromEntries(gltf.animations.map((clip) => [clip.name, mixer.clipAction(clip)]));
  const controller = new SoldierAnimationPlayback(actions, mixer);
  const bones: Bone[] = [];
  model.traverse((object) => { if (object instanceof Bone) bones.push(object); });
  assert.ok(bones.length >= 20, 'The supplied soldier rig must be preserved');
  const pose = () => bones.flatMap((bone) => [...bone.position.toArray(), ...bone.quaternion.toArray(), ...bone.scale.toArray()]);
  const advance = (seconds: number) => {
    let remaining = seconds;
    while (remaining > 1e-9) {
      const delta = Math.min(remaining, 1 / 60);
      controller.update(delta);
      mixer.update(delta);
      remaining -= delta;
    }
  };
  return { model, bones, actions, mixer, controller, pose, advance };
}

{
  const actor = subject();
  actor.controller.select('Idle');
  actor.advance(0.3);
  actor.controller.select('Walk');
  actor.advance(0.08);
  const before = actor.pose();
  const weights = [actor.actions.Idle.getEffectiveWeight(), actor.actions.Walk.getEffectiveWeight()];
  actor.controller.select('Salute');
  assert.deepEqual(actor.pose(), before, 'Interrupting a blend must preserve its visible pose');
  near(actor.actions.Idle.getEffectiveWeight(), weights[0]);
  near(actor.actions.Walk.getEffectiveWeight(), weights[1]);
  actor.advance(0.06);
  actor.controller.select('Run');
  actor.advance(0.4);
  near(actor.actions.Run.getEffectiveWeight(), 1);
  assert.equal(actor.actions.Idle.isScheduled(), false);
  assert.equal(actor.actions.Walk.isScheduled(), false);
  assert.equal(actor.actions.Salute.isScheduled(), false);
  actor.controller.dispose();
}
console.log('PASS: rapid interrupted crossfades preserve the pose and retire obsolete actions.');

{
  const actor = subject();
  actor.controller.select('TurnLeft');
  actor.advance(0.5);
  actor.controller.setPlayback(true, 1);
  const pausedPose = actor.pose();
  const pausedTime = actor.actions.TurnLeft.time;
  actor.advance(1);
  near(actor.actions.TurnLeft.time, pausedTime);
  assert.deepEqual(actor.pose(), pausedPose);
  actor.controller.select('TurnLeft');
  near(actor.actions.TurnLeft.time, 0);
  actor.advance(0.3);
  near(actor.actions.TurnLeft.time, 0);
  actor.controller.setPlayback(false, 1);
  actor.advance(3);
  near(actor.actions.TurnLeft.time, actor.actions.TurnLeft.getClip().duration);
  assert.equal(actor.actions.TurnLeft.paused, true);
  const finalPose = actor.pose();
  actor.advance(2);
  assert.deepEqual(actor.pose(), finalPose, 'One-shot actions must hold their final pose');
  actor.controller.select('TurnLeft');
  assert.equal(actor.actions.TurnLeft.paused, false);
  near(actor.actions.TurnLeft.time, 0);
  actor.advance(0.2);
  assert.ok(actor.actions.TurnLeft.time > 0);
  actor.controller.dispose();
}
console.log('PASS: pause, replay while paused, resume, terminal hold and repeated one-shot playback.');

{
  const actor = subject();
  actor.controller.select('Walk');
  actor.controller.setPlayback(false, 2);
  actor.advance(0.2);
  near(actor.actions.Walk.time, 0.4);
  actor.advance(3);
  assert.ok(actor.actions.Walk.time < actor.actions.Walk.getClip().duration);
  assert.equal(actor.actions.Walk.paused, false);
  actor.controller.select('SitDown');
  actor.advance(2);
  const seated = actor.pose();
  actor.advance(1);
  assert.deepEqual(actor.pose(), seated);
  actor.controller.select('StandUp', 0);
  const standStart = actor.pose();
  standStart.forEach((value, index) => near(value, seated[index], 2e-4));
  actor.controller.dispose();
}
console.log('PASS: speed affects playback, loops repeat and StandUp begins at the seated end pose.');

{
  const first = subject();
  const second = subject();
  assert.notEqual(first.bones[0], second.bones[0]);
  const sourceBones: Bone[] = [];
  gltf.scene.traverse((object) => { if (object instanceof Bone) sourceBones.push(object); });
  assert.notEqual(first.bones[0], sourceBones[0]);
  first.model.traverse((object) => {
    if (object instanceof SkinnedMesh) {
      assert.ok(object.skeleton.bones.every((bone) => first.bones.includes(bone)));
    }
  });
  second.controller.select('Idle');
  second.advance(0.2);
  const secondPose = second.pose();
  first.controller.select('Salute');
  first.advance(1);
  assert.deepEqual(second.pose(), secondPose, 'One mixer must never animate another soldier');
  first.controller.dispose();
  second.controller.dispose();
}
console.log('PASS: cloned soldiers own separate skeletons and mixers.');

{
  const boundaries = [0, 14, 14 + Math.PI * 0.8, 28 + Math.PI * 0.8, MOVEMENT_ROUTE_LENGTH];
  for (const distance of boundaries) {
    const before = sampleMovementRoute(distance - 1e-5);
    const after = sampleMovementRoute(distance + 1e-5);
    assert.ok(Math.hypot(after.position[0] - before.position[0], after.position[2] - before.position[2]) < 2.1e-5);
    assert.ok(Math.cos(after.yaw - before.yaw) > 0.999999);
  }
  for (let distance = -5; distance < 2 * MOVEMENT_ROUTE_LENGTH; distance += 0.07) {
    for (let actor = 0; actor < 3; actor++) {
      const d = distance - actor * SQUAD_SPACING_METERS;
      const pose = sampleMovementRoute(d);
      assert.ok(pose.position[0] >= -6.800001 && pose.position[0] <= 8.800001);
      assert.ok(pose.position[2] >= 9.199999 && pose.position[2] <= 10.800001);
      near(pose.position[1], 0);
      const ahead = sampleMovementRoute(d + 1e-5);
      const dx = (ahead.position[0] - pose.position[0]) / 1e-5;
      const dz = (ahead.position[2] - pose.position[2]) / 1e-5;
      near(Math.hypot(dx, dz), 1, 2e-4);
      assert.ok(dx * Math.sin(pose.yaw) + dz * Math.cos(pose.yaw) > 0.9999);
    }
  }
}
console.log('PASS: route joins are continuous, all three actors stay on-lane and face their travel direction.');
