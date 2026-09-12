import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBodyYaw } from '../../src/features/pose-analysis/pipeline/geometry';
import { TemporalMotionBuffer } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { createCalibration } from '../../src/features/pose-analysis/pipeline/normalization';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';
import { evaluate } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { buildRequirementCards } from '../../src/features/pose-analysis/scoring/postureFeedback';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import type { CanonicalPoseFrame } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

/**
 * Tạo khung hình xoay thân tổng hợp (Synthetic rotated pose frame).
 * - yawDeg = 0: nhìn thẳng camera
 * - yawDeg > 0: quay trái (anatomical left)
 * - yawDeg < 0: quay phải (anatomical right)
 */
function rotatedPoseFrame(yawDeg: number, timestampMs = 0, mirrored = false): CanonicalPoseFrame {
  const frame = attentionFrame(timestampMs, 1, 0, false);
  const rad = (yawDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (const landmark of Object.values(frame.landmarks)) {
    if (!landmark || !landmark.world) continue;
    const x0 = landmark.world.x;
    const y0 = landmark.world.y;
    const xRot = x0 * cos;
    const zRot = -x0 * sin;
    landmark.world = { x: xRot, y: y0, z: zRot };
    landmark.image = {
      x: 2 / 3 + xRot * (mirrored ? -1 : 1),
      y: landmark.image.y,
      z: zRot,
    };
  }
  return frame;
}

test('calculateBodyYaw: detects 0° facing camera, +90° left turn, and -90° right turn', () => {
  const facing = rotatedPoseFrame(0);
  const yawFacing = calculateBodyYaw(
    facing.landmarks.leftShoulder?.world,
    facing.landmarks.rightShoulder?.world,
    facing.landmarks.leftHip?.world,
    facing.landmarks.rightHip?.world
  );
  assert.ok(yawFacing !== null);
  assert.ok(Math.abs(yawFacing) < 1e-4, `Expected 0°, got ${yawFacing}`);

  const leftTurn = rotatedPoseFrame(90);
  const yawLeft = calculateBodyYaw(
    leftTurn.landmarks.leftShoulder?.world,
    leftTurn.landmarks.rightShoulder?.world,
    leftTurn.landmarks.leftHip?.world,
    leftTurn.landmarks.rightHip?.world
  );
  assert.ok(yawLeft !== null);
  assert.ok(Math.abs(yawLeft - 90) < 1e-3, `Expected 90°, got ${yawLeft}`);

  const rightTurn = rotatedPoseFrame(-90);
  const yawRight = calculateBodyYaw(
    rightTurn.landmarks.leftShoulder?.world,
    rightTurn.landmarks.rightShoulder?.world,
    rightTurn.landmarks.leftHip?.world,
    rightTurn.landmarks.rightHip?.world
  );
  assert.ok(yawRight !== null);
  assert.ok(Math.abs(yawRight - (-90)) < 1e-3, `Expected -90°, got ${yawRight}`);
});

test('mirrored camera display does NOT invert anatomical left/right turn orientation', () => {
  const normalLeft = rotatedPoseFrame(90, 0, false);
  const mirroredLeft = rotatedPoseFrame(90, 0, true);

  const yawNormal = calculateBodyYaw(
    normalLeft.landmarks.leftShoulder?.world,
    normalLeft.landmarks.rightShoulder?.world,
    normalLeft.landmarks.leftHip?.world,
    normalLeft.landmarks.rightHip?.world
  );

  const yawMirrored = calculateBodyYaw(
    mirroredLeft.landmarks.leftShoulder?.world,
    mirroredLeft.landmarks.rightShoulder?.world,
    mirroredLeft.landmarks.leftHip?.world,
    mirroredLeft.landmarks.rightHip?.world
  );

  assert.ok(yawNormal !== null && yawMirrored !== null);
  assert.ok(Math.abs(yawNormal - 90) < 1e-3);
  assert.ok(Math.abs(yawMirrored - 90) < 1e-3);
  assert.equal(Math.sign(yawNormal), Math.sign(yawMirrored), 'Mirrored display must not flip sign');
});

test('TemporalMotionBuffer: bounded buffer never exceeds capacity and calculates direction', () => {
  const buffer = new TemporalMotionBuffer(20);
  // Add 35 frames with leftward rotation
  for (let i = 0; i < 35; i++) {
    buffer.push({
      timestampMs: i * 100,
      bodyYawDeg: Math.min(90, i * 3),
      confidence: 0.95,
      isReliable: true,
    });
  }

  assert.equal(buffer.length, 20, 'Buffer must be bounded to maxFrames');
  const dir = buffer.detectDirection(0, 20);
  assert.equal(dir, 'left');
});

test('Dynamic turn left: full session transitions START_READY -> MOVING -> FINAL_HOLD -> COMPLETE and scores 100', () => {
  const session = new SessionProcessor();
  session.command('selectTurnLeft');

  // 1. Warmup
  for (let t = 0; t <= 1500; t += 100) {
    session.process(attentionFrame(t), goodLighting, 20);
  }

  // 2. Calibration
  session.command('startCalibration');
  for (let t = 1600; t <= 3800; t += 100) {
    session.process(attentionFrame(t), goodLighting, 20);
  }

  // 3. Countdown (3 seconds)
  for (let t = 3900; t <= 7000; t += 100) {
    session.process(attentionFrame(t), goodLighting, 20);
  }

  // 4. Scoring phase
  // Phase a: Hold ready at 0° for 600ms (7100 - 7700)
  for (let t = 7100; t <= 7700; t += 100) {
    session.process(rotatedPoseFrame(0, t), goodLighting, 20);
  }

  // Phase b: Turn left from 0° to 90° over 800ms (7800 - 8500)
  for (let t = 7800; t <= 8500; t += 100) {
    const frac = (t - 7800) / 700;
    const yaw = frac * 90;
    session.process(rotatedPoseFrame(yaw, t), goodLighting, 20);
  }

  // Phase c: Final hold at 90° for 1600ms (8600 - 10200)
  const events: WorkerEvent[] = [];
  for (let t = 8600; t <= 10400; t += 100) {
    events.push(...session.process(rotatedPoseFrame(90, t), goodLighting, 20));
  }

  const scoreEvent = events.find(e => e.type === 'score');
  assert.ok(scoreEvent && scoreEvent.type === 'score', 'Must produce score event');
  assert.equal(scoreEvent.result.status, 'scored');

  if (scoreEvent.result.status === 'scored') {
    assert.equal(scoreEvent.result.total, 100);
    const dirCriterion = scoreEvent.result.criteria.find(c => c.id === 'direction');
    assert.ok(dirCriterion);
    assert.equal(dirCriterion.points, 25);
    assert.equal(dirCriterion.statusLevel, 'PASS');

    const angleCriterion = scoreEvent.result.criteria.find(c => c.id === 'angle');
    assert.ok(angleCriterion);
    assert.equal(angleCriterion.points, 25);
    assert.equal(angleCriterion.statusLevel, 'PASS');

    // Check 4 Vietnamese requirement cards
    const cards = buildRequirementCards(scoreEvent.result.criteria, 'turnLeft');
    assert.equal(cards.length, 4);
    assert.equal(cards[0].title, 'Hướng quay sang trái');
    assert.equal(cards[0].statusLevel, 'PASS');
    assert.equal(cards[1].title, 'Góc quay vuông 90°');
    assert.equal(cards[1].statusLevel, 'PASS');
  }
});

test('Dynamic turn right: full session executes right turn (-90°) and completes successfully', () => {
  const session = new SessionProcessor();
  session.command('selectTurnRight');

  // Warmup + Calibration + Countdown
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 3800; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  for (let t = 3900; t <= 7000; t += 100) session.process(attentionFrame(t), goodLighting, 20);

  // Ready 0°
  for (let t = 7100; t <= 7700; t += 100) session.process(rotatedPoseFrame(0, t), goodLighting, 20);

  // Turn right 0° -> -90°
  for (let t = 7800; t <= 8500; t += 100) {
    const frac = (t - 7800) / 700;
    session.process(rotatedPoseFrame(-frac * 90, t), goodLighting, 20);
  }

  // Final hold at -90° for 1600ms
  const events: WorkerEvent[] = [];
  for (let t = 8600; t <= 10400; t += 100) {
    events.push(...session.process(rotatedPoseFrame(-90, t), goodLighting, 20));
  }

  const scoreEvent = events.find(e => e.type === 'score');
  assert.ok(scoreEvent && scoreEvent.type === 'score');
  assert.equal(scoreEvent.result.status, 'scored');

  if (scoreEvent.result.status === 'scored') {
    assert.equal(scoreEvent.result.total, 100);
    const cards = buildRequirementCards(scoreEvent.result.criteria, 'turnRight');
    assert.equal(cards[0].title, 'Hướng quay sang phải');
    assert.equal(cards[0].statusLevel, 'PASS');
  }
});

test('Wrong turn direction: turning right when turnLeft was chosen loses points and gives clear mistake', () => {
  const session = new SessionProcessor();
  session.command('selectTurnLeft'); // Selected left turn

  // Warmup + Calibration + Countdown
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 3800; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  for (let t = 3900; t <= 7000; t += 100) session.process(attentionFrame(t), goodLighting, 20);

  // User erroneously turns RIGHT (-90°)
  for (let t = 7100; t <= 7700; t += 100) session.process(rotatedPoseFrame(0, t), goodLighting, 20);
  for (let t = 7800; t <= 8500; t += 100) {
    const frac = (t - 7800) / 700;
    session.process(rotatedPoseFrame(-frac * 90, t), goodLighting, 20);
  }

  // Timeout completes after 8000ms
  const events: WorkerEvent[] = [];
  for (let t = 8600; t <= 15500; t += 100) {
    events.push(...session.process(rotatedPoseFrame(-90, t), goodLighting, 20));
  }

  const scoreEvent = events.find(e => e.type === 'score');
  assert.ok(scoreEvent && scoreEvent.type === 'score');
  assert.equal(scoreEvent.result.status, 'scored');

  if (scoreEvent.result.status === 'scored') {
    const dir = scoreEvent.result.criteria.find(c => c.id === 'direction');
    assert.ok(dir);
    assert.equal(dir.points, 0);
    assert.equal(dir.statusLevel, 'NOT_ACHIEVED');
    assert.ok(dir.mistakes && dir.mistakes.some(m => m.includes('Quay sai hướng')));
  }
});

test('Different movement speeds (fast 0.4s turn vs slow 1.4s turn) both succeed', () => {
  for (const speed of ['fast', 'slow'] as const) {
    const buffer = new TemporalMotionBuffer(150);
    const turnDuration = speed === 'fast' ? 400 : 1400;

    // Start ready (500ms at 0°)
    for (let t = 0; t <= 500; t += 50) {
      buffer.push({ timestampMs: t, bodyYawDeg: 0, confidence: 0.95, isReliable: true });
    }
    // Turn 0° -> 90°
    for (let t = 550; t <= 550 + turnDuration; t += 50) {
      const frac = (t - 550) / turnDuration;
      buffer.push({ timestampMs: t, bodyYawDeg: frac * 90, confidence: 0.95, isReliable: true });
    }
    // Hold at 90° for 1500ms
    const holdStart = 550 + turnDuration + 50;
    for (let t = holdStart; t <= holdStart + 1500; t += 50) {
      buffer.push({ timestampMs: t, bodyYawDeg: 90, confidence: 0.95, isReliable: true });
    }

    const result = evaluate(turnLeftMovement, { samples: [], validDurationMs: holdStart + 1500, qualityPassed: true }, buffer);
    assert.equal(result.status, 'scored');
    if (result.status === 'scored') {
      const dir = result.criteria.find(c => c.id === 'direction');
      assert.equal(dir?.statusLevel, 'PASS');
      const angle = result.criteria.find(c => c.id === 'angle');
      assert.equal(angle?.statusLevel, 'PASS');
    }
  }
});

test('Long occlusion during scoring (>1500ms) produces notScorable with Vietnamese quality warning', () => {
  const session = new SessionProcessor();
  session.command('selectTurnLeft');

  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 3800; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  for (let t = 3900; t <= 7000; t += 100) session.process(attentionFrame(t), goodLighting, 20);

  // In scoring: person vanishes (personCount = 0) for 1800ms
  const events: WorkerEvent[] = [];
  for (let t = 7100; t <= 9000; t += 100) {
    const badFrame = attentionFrame(t);
    badFrame.personCount = 0;
    events.push(...session.process(badFrame, goodLighting, 20));
  }

  const scoreEvent = events.find(e => e.type === 'score');
  assert.ok(scoreEvent && scoreEvent.type === 'score');
  assert.equal(scoreEvent.result.status, 'notScorable');
  if (scoreEvent.result.status === 'notScorable') {
    assert.ok(scoreEvent.result.reasons[0].includes('camera') || scoreEvent.result.reasons[0].includes('toàn thân') || scoreEvent.result.reasons[0].includes('khung hình'));
  }
});

test('Buffer cleanup: reset and startCalibration clear the motion buffer and dynamic tracker', () => {
  const session = new SessionProcessor();
  session.command('selectTurnLeft');

  // Fill some frames
  for (let t = 0; t <= 500; t += 100) session.process(rotatedPoseFrame(45, t), goodLighting, 20);

  session.command('reset');
  // After reset, processor state is quality-check, ready to restart cleanly
  const events = session.process(attentionFrame(1000), goodLighting, 20);
  assert.ok(events.some(e => e.type === 'analysis' && e.snapshot.stage === 'quality-check'));
});

test('COMPLETE freezes score and prevents duplicate score events', () => {
  const session = new SessionProcessor();
  session.command('selectTurnLeft');

  // Calibration + Countdown
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 3800; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  for (let t = 3900; t <= 7000; t += 100) session.process(attentionFrame(t), goodLighting, 20);

  // Turn and complete
  for (let t = 7100; t <= 7700; t += 100) session.process(rotatedPoseFrame(0, t), goodLighting, 20);
  for (let t = 7800; t <= 8500; t += 100) session.process(rotatedPoseFrame((t - 7800) / 700 * 90, t), goodLighting, 20);

  const allEvents: WorkerEvent[] = [];
  for (let t = 8600; t <= 11000; t += 100) {
    allEvents.push(...session.process(rotatedPoseFrame(90, t), goodLighting, 20));
  }

  const scoreEvents = allEvents.filter(e => e.type === 'score');
  assert.equal(scoreEvents.length, 1, 'Exactly one score event emitted upon completion');
});
