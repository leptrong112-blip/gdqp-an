import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createArcadeFlight, createGroundFlight, javascriptPhysics, physicsFromInstance, sampleTrajectoryPosition, type Vec3 } from '../../src/features/physics/projectile.ts';
import WasmCompatibilityNotice from '../../src/components/WasmCompatibilityNotice.tsx';

const bytes = readFileSync(new URL('../../src/features/physics/projectile.wasm', import.meta.url));
const module = new WebAssembly.Module(bytes);
const wasm = physicsFromInstance(new WebAssembly.Instance(module));
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('actual C++ binary has no platform imports and uses the expected ABI', () => {
  assert.deepEqual(WebAssembly.Module.imports(module), []);
  assert.equal(wasm.kind, 'wasm');
  close(wasm.positionAxis(1, 2, -4, 0.5), 1.5);
  assert.throws(() => physicsFromInstance({ exports: {} } as WebAssembly.Instance), /ABI/);
});

for (const engine of [wasm, javascriptPhysics]) {
  test(`${engine.kind}: analytical trajectory, apex and exact first ground contact`, () => {
    const path = createGroundFlight(engine, [0, 2, 0], [3, 4, -1], 0, 8);
    const point: Vec3 = [0, 0, 0];
    path.sample(0.5, point);
    assert.deepEqual(point, [1.5, 3, -0.5]);
    close(path.duration, (4 + Math.sqrt(48)) / 8);
    path.sample(path.duration, point);
    close(point[0], 3 * path.duration);
    assert.equal(point[1], 0);
    const landed = [...point];
    path.sample(path.duration + 10, point);
    assert.deepEqual(point, landed, 'no overshoot below the floor');
  });

  test(`${engine.kind}: ground launch upward, downward contact, invalid inputs`, () => {
    assert.equal(createGroundFlight(engine, [0, 0, 0], [0, -1, 0], 0, 8).duration, 0);
    close(createGroundFlight(engine, [0, 0, 0], [0, 4, 0], 0, 8).duration, 1);
    for (const gravity of [0, -1, NaN, Infinity]) {
      assert.throws(() => createGroundFlight(engine, [0, 1, 0], [0, 1, 0], 0, gravity), RangeError);
    }
    assert.throws(() => createGroundFlight(engine, [0, -1, 0], [0, 1, 0], 0, 8), RangeError);
    assert.throws(() => createArcadeFlight(engine, [0, 0, 0], [1, 1, 1], 0), RangeError);
    assert.throws(() => createArcadeFlight(engine, [NaN, 0, 0], [1, 1, 1], 1), RangeError);
  });

  test(`${engine.kind}: arcade keeps endpoints, adds a visual arc and owns launch data`, () => {
    const start: Vec3 = [1, 2, 3], end: Vec3 = [5, 4, -9];
    const path = createArcadeFlight(engine, start, end, 0.2, 0.3);
    start[0] = 999;
    assert.deepEqual(path.sample(-1, [0, 0, 0]), [1, 2, 3]);
    const mid = path.sample(0.1, [0, 0, 0]);
    close(mid[0], 3); close(mid[1], 3.3); close(mid[2], -3);
    path.sample(0.2, [0, 0, 0]).forEach((v, i) => close(v, end[i]));
    assert.throws(() => path.sample(NaN, [0, 0, 0]), RangeError);
  });

  test(`${engine.kind}: 30/60/144 FPS, pause and fresh attempts produce the same positions`, () => {
    const path = createGroundFlight(engine, [0, 2, 0], [3, 4, -1], 0, 8);
    const expected = path.sample(1, [0, 0, 0]);
    for (const fps of [30, 60, 144]) {
      const point: Vec3 = [0, 0, 0];
      for (let frame = 0; frame <= fps; frame++) path.sample(frame / fps, point);
      point.forEach((v, i) => close(v, expected[i]));
      assert.deepEqual(path.sample(1, point), expected, 'pause freezes simulation time');
    }
    const restarted = createGroundFlight(engine, [5, 1, 3], [0, 4, 0], 0, 8);
    assert.deepEqual(restarted.sample(0, [0, 0, 0]), [5, 1, 3]);
  });

  test(`${engine.kind}: batch trajectory snapshot matches endpoints, is monotonic and finite`, () => {
    const start: Vec3 = [0.2, 1.4, -0.5];
    const end: Vec3 = [10.5, 2.0, -150.0];
    const duration = 0.25;
    const lift = 0.3;
    const count = 64;

    const snapshot = engine.sampleArcadeTrajectory(start, end, duration, lift, count);
    assert.equal(snapshot.engine, engine.kind);
    assert.equal(snapshot.sampleCount, count);
    assert.equal(snapshot.stride, 4);
    assert.equal(snapshot.duration, duration);
    assert.ok(snapshot.sampleCount <= 128, 'does not exceed capacity');

    const s = snapshot.samples;
    const closeF32 = (actual: number, expected: number) =>
      assert.ok(Math.abs(actual - expected) < 1e-4, `${actual} != ${expected} (tol 1e-4)`);

    // First sample must match start within tolerance
    closeF32(s[0], 0); // time = 0
    closeF32(s[1], start[0]);
    closeF32(s[2], start[1]);
    closeF32(s[3], start[2]);

    // Last sample must match end within tolerance
    const lastIdx = (snapshot.sampleCount - 1) * snapshot.stride;
    closeF32(s[lastIdx + 0], duration); // time = duration
    closeF32(s[lastIdx + 1], end[0]);
    closeF32(s[lastIdx + 2], end[1]);
    closeF32(s[lastIdx + 3], end[2]);


    // Monotonicity and finiteness
    let prevT = -1;
    for (let i = 0; i < snapshot.sampleCount; i++) {
      const idx = i * snapshot.stride;
      const t = s[idx + 0];
      const x = s[idx + 1];
      const y = s[idx + 2];
      const z = s[idx + 3];

      assert.ok(Number.isFinite(t), `t at ${i} is finite`);
      assert.ok(Number.isFinite(x), `x at ${i} is finite`);
      assert.ok(Number.isFinite(y), `y at ${i} is finite`);
      assert.ok(Number.isFinite(z), `z at ${i} is finite`);
      assert.ok(t > prevT, `timestamp must be strictly monotonic: ${t} > ${prevT}`);
      prevT = t;
    }
  });
}

test('WASM and fallback agree across varied launches and directions', () => {
  for (let i = 0; i < 100; i++) {
    const angle = i * 0.2;
    const position: Vec3 = [i / 10, i % 7, -i / 20];
    const velocity: Vec3 = [3 * Math.cos(angle), i % 9 - 4, -3 * Math.sin(angle)];
    const native = createGroundFlight(wasm, position, velocity, -0.4, 8);
    const fallback = createGroundFlight(javascriptPhysics, position, velocity, -0.4, 8);
    close(native.duration, fallback.duration);
    for (const fraction of [0, 0.1, 0.5, 0.99, 1, 2]) {
      const time = native.duration * fraction;
      const a = native.sample(time, [0, 0, 0]), b = fallback.sample(time, [0, 0, 0]);
      a.forEach((v, axis) => close(v, b[axis]));
    }
  }
});

test('WASM and fallback generate identical batch trajectory snapshots', () => {
  const start: Vec3 = [-1.2, 0.8, -0.55];
  const end: Vec3 = [3.4, 1.2, -100];
  const nativeSnap = wasm.sampleArcadeTrajectory(start, end, 0.2, 0.15, 64);
  const fallbackSnap = javascriptPhysics.sampleArcadeTrajectory(start, end, 0.2, 0.15, 64);

  assert.equal(nativeSnap.sampleCount, fallbackSnap.sampleCount);
  assert.equal(nativeSnap.stride, fallbackSnap.stride);
  for (let i = 0; i < nativeSnap.samples.length; i++) {
    assert.ok(
      Math.abs(nativeSnap.samples[i] - fallbackSnap.samples[i]) < 1e-4,
      `Sample mismatch at index ${i}: wasm=${nativeSnap.samples[i]} fallback=${fallbackSnap.samples[i]}`
    );
  }
});

test('Flight object carries snapshot and sampleTrajectoryPosition matches analytical curve', () => {
  const start: Vec3 = [0, 1, -0.5];
  const end: Vec3 = [2, 1.5, -50];
  const flight = createArcadeFlight(wasm, start, end, 0.2, 0.2);
  assert.ok(flight.snapshot, 'snapshot must be present on arcade flight');
  assert.equal(flight.snapshot.sampleCount, 64);

  const analytical: Vec3 = [0, 0, 0];
  const fromSnapshot: Vec3 = [0, 0, 0];
  for (let f = 0; f <= 10; f++) {
    const t = (f / 10) * flight.duration;
    flight.sample(t, analytical);
    // Interpolated from snapshot
    sampleTrajectoryPosition(flight.snapshot, t, fromSnapshot);
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(
        Math.abs(analytical[axis] - fromSnapshot[axis]) < 0.05,
        `Interpolation error too large at t=${t}, axis=${axis}: analytical=${analytical[axis]}, interpolated=${fromSnapshot[axis]}`
      );
    }
  }
});

test('REGRESSION INVARIANT: native and fallback trajectories cannot change authoritative hit/miss or score', () => {
  // Target dimensions matching Bài 3 ("Thử thách đường bay", bia 8, 200m)
  const width = 0.5 * 11;
  const height = 1.0 * 11;
  const centerY = 2.5;
  const moving = true;
  const targetCount = 3;

  function calculateHit(endX: number, endY: number, time: number) {
    const y = endY - centerY;
    let hitLane = -1, localHitX = endX;
    for (let lane = 0; lane < targetCount; lane++) {
      // Formula from arcadeTargetX in arcadeRangeLogic.ts
      const targetLaneX = (lane - 1) * width * 1.65 + (moving ? Math.sin(time * 0.8 + lane * 1.7) * width * 0.42 : 0);
      const localX = endX - targetLaneX;
      if (Math.abs(localX) <= width / 2 && Math.abs(y) <= height / 2) {
        hitLane = lane;
        localHitX = localX;
        break;
      }
    }
    const isHit = hitLane >= 0;
    const score = isHit ? Math.max(5, 11 - Math.ceil(Math.max(Math.hypot(localHitX, y), 0.000001) / (Math.min(width, height) * 0.085))) : 0;
    return { isHit, score, hitLane };
  }

  for (let i = 0; i < 50; i++) {
    const endX = (i % 10 - 5) * 1.2;
    const endY = 1.5 + (i % 5) * 0.4;
    const endZ = -200;
    const time = 5.0 + i * 0.35;

    // Direct gameplay calculation
    const baseline = calculateHit(endX, endY, time);

    for (const engine of [wasm, javascriptPhysics]) {
      const flight = createArcadeFlight(engine, [0, 1.4, -0.55], [endX, endY, endZ], 0.2);
      const snap = flight.snapshot!;
      assert.equal(snap.engine, engine.kind);
      assert.equal(snap.end[0], endX);
      assert.equal(snap.end[1], endY);
      assert.equal(snap.end[2], endZ);

      const withFlightCam = calculateHit(snap.end[0], snap.end[1], time);
      assert.equal(withFlightCam.isHit, baseline.isHit, `${engine.kind} hit match on shot ${i}`);
      assert.equal(withFlightCam.score, baseline.score, `${engine.kind} score match on shot ${i}`);
      assert.equal(withFlightCam.hitLane, baseline.hitLane, `${engine.kind} lane match on shot ${i}`);
    }
  }
});

test('compatibility notice tells users the simulation and scoring remain available', () => {
  const html = renderToStaticMarkup(createElement(WasmCompatibilityNotice, { feature: 'physics' }));
  assert.match(html, /role="status"/);
  assert.match(html, /chế độ tương thích JavaScript/);
  assert.match(html, /cách tính điểm không thay đổi/);
});

test('WASM fallback: javascriptPhysics provides complete, functional trajectory when WASM is absent', () => {
  const start: Vec3 = [0, 1.5, -0.55];
  const end: Vec3 = [2, 1.8, -200];
  const duration = 0.25;

  const fallback = javascriptPhysics.sampleArcadeTrajectory(start, end, duration, 0.2, 64);
  assert.equal(fallback.sampleCount, 64);
  assert.equal(fallback.duration, duration);
  assert.equal(fallback.stride, 4);
  assert.equal(fallback.start[0], start[0]);
  assert.equal(fallback.end[0], end[0]);

  // Negative or zero duration throws RangeError
  assert.throws(() => javascriptPhysics.sampleArcadeTrajectory(start, end, 0), RangeError);
  assert.throws(() => javascriptPhysics.sampleArcadeTrajectory(start, end, -1), RangeError);
  assert.throws(() => javascriptPhysics.sampleArcadeTrajectory(start, end, 0.2, -0.1), RangeError);
  assert.throws(() => javascriptPhysics.sampleArcadeTrajectory(start, end, 0.2, 0.1, 1), RangeError);
});

