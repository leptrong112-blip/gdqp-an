import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { evaluate, ruleScore } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { attentionFrame } from './fixtures/pose/attention';
import type { FeatureWindow } from '../../src/features/pose-analysis/types';
function window(): FeatureWindow { const frame = attentionFrame(), profile = createCalibration(Array(20).fill(frame))!; return { samples: Array.from({ length: 30 }, (_, i) => extractFeatures(normalizePose(attentionFrame(i * 100), profile)!)), validDurationMs: 3000, qualityPassed: true }; }
test('ideal posture earns exactly 100 points with six criteria', () => { const result = evaluate(attentionMovement, window()); assert.equal(result.status, 'scored'); if (result.status === 'scored') { assert.equal(result.total, 100); assert.equal(result.criteria.length, 6); } });
test('linear bands and overall feedback follow weighted deficits', () => {
  const rule = attentionMovement.criteria[0].rules[0]; assert.equal(ruleScore(7, rule), 1); assert.equal(ruleScore(25, rule), 0); assert.equal(ruleScore(16, rule), 0.5);
  const data = window(); data.samples.forEach(s => { s.values.torsoTilt!.value = 25; s.values.headOffset!.value = 0.4; });
  const result = evaluate(attentionMovement, data); if (result.status !== 'scored') assert.fail('Expected a scored window');
  assert.equal(result.total, 70); assert.equal(result.corrections[0], attentionMovement.criteria[0].feedback);
});
test('missing features, low confidence, poor quality, or insufficient frames never get a number', () => {
  for (const kind of ['missing', 'confidence', 'quality', 'duration', 'samples']) {
    const data = window();
    if (kind === 'missing') data.samples.forEach(s => delete s.values.footOpeningAngle);
    if (kind === 'confidence') data.samples.forEach(s => { s.values.leftKneeAngle!.confidence = 0.2; });
    if (kind === 'quality') data.qualityPassed = false;
    if (kind === 'duration') data.validDurationMs = 2000;
    if (kind === 'samples') data.samples = data.samples.slice(0, 5);
    assert.equal(evaluate(attentionMovement, data).status, 'notScorable', kind);
  }
});
test('a single correct frame cannot hide poor posture over the hold', () => {
  const data = window(); data.samples.slice(1).forEach(s => { s.values.torsoTilt!.value = 40; });
  const result = evaluate(attentionMovement, data); assert.ok(result.status === 'scored' && result.total < 80);
});

test('diagnoses specific Vietnamese actionable feedback and builds 4 requirement cards', async () => {
  const { buildRequirementCards, extractTopCorrections } = await import('../../src/features/pose-analysis/scoring/postureFeedback');
  const data = window();
  // Simulate arm lệch nhẹ and heel gap
  data.samples.forEach(s => {
    // A clearly displaced arm still needs feedback; a mild single-rule error is now tolerated.
    s.values.leftWristHipDistance!.value = 0.9;
    s.values.heelGapRatio!.value = 0.35;
  });
  const result = evaluate(attentionMovement, data);
  assert.equal(result.status, 'scored');
  if (result.status === 'scored') {
    const cards = buildRequirementCards(result.criteria);
    assert.equal(cards.length, 4);
    assert.equal(cards[0].number, 1);
    assert.equal(cards[0].title, '2 gót chân đặt sát vào nhau, 2 mũi bàn chân mở rộng 45 độ.');
    assert.equal(cards[0].statusLevel, 'NEEDS_ADJUSTMENT');
    assert.ok(cards[0].mistakes.includes('Hai gót chân chưa đủ gần nhau.'));

    assert.equal(cards[2].number, 3);
    assert.equal(cards[2].title, 'Hai tay buông thẳng dọc thân');
    assert.equal(cards[2].statusLevel, 'NEEDS_ADJUSTMENT');
    assert.ok(cards[2].mistakes.includes('Tay trái đang hơi cách thân.'));

    const top = extractTopCorrections(result.criteria);
    assert.ok(top.length >= 1 && top.length <= 2);
    assert.ok(top.some(t => t.includes('gót') || t.includes('Tay')));
  }
});

test('atEaseMovement: ideal resting posture earns 100 points and builds 4 correct cards', async () => {
  const { atEaseMovement } = await import('../../src/features/pose-analysis/scoring/atEaseMovement');
  const { buildRequirementCards } = await import('../../src/features/pose-analysis/scoring/postureFeedback');
  const data = window();
  // Simulate chùng chân trái (155°), chân phải thẳng làm trụ (176°)
  data.samples.forEach(s => {
    s.values.leftKneeAngle = { value: 155, confidence: 0.95 };
    s.values.rightKneeAngle = { value: 176, confidence: 0.95 };
    s.values.minKneeAngle = { value: 155, confidence: 0.95 };
    s.values.maxKneeAngle = { value: 176, confidence: 0.95 };
    s.values.kneeAngleDiff = { value: 21, confidence: 0.95 };
  });

  const result = evaluate(atEaseMovement, data);
  assert.equal(result.status, 'scored');
  if (result.status === 'scored') {
    assert.equal(result.total, 100);
    const cards = buildRequirementCards(result.criteria, 'atEase');
    assert.equal(cards.length, 4);
    assert.equal(cards[0].title, 'Hai gót giữ vị trí, mũi mở 45°');
    assert.equal(cards[0].statusLevel, 'PASS');
    assert.equal(cards[1].title, 'Chùng một chân, chân trụ thẳng');
    assert.equal(cards[1].statusLevel, 'PASS');
    assert.equal(cards[2].title, 'Thân người ngay ngắn, vai cân');
    assert.equal(cards[2].statusLevel, 'PASS');
    assert.equal(cards[3].title, 'Hai tay buông tự nhiên, mắt nhìn thẳng');
    assert.equal(cards[3].statusLevel, 'PASS');
  }
});

test('atEaseMovement: standing with both straight knees loses points on leg flexion rule', async () => {
  const { atEaseMovement } = await import('../../src/features/pose-analysis/scoring/atEaseMovement');
  const { buildRequirementCards } = await import('../../src/features/pose-analysis/scoring/postureFeedback');
  const data = window();
  // Cả hai chân đều thẳng (176°), không chùng chân nào
  data.samples.forEach(s => {
    s.values.leftKneeAngle = { value: 176, confidence: 0.95 };
    s.values.rightKneeAngle = { value: 176, confidence: 0.95 };
    s.values.minKneeAngle = { value: 176, confidence: 0.95 };
    s.values.maxKneeAngle = { value: 176, confidence: 0.95 };
    s.values.kneeAngleDiff = { value: 0, confidence: 0.95 };
  });

  const result = evaluate(atEaseMovement, data);
  assert.equal(result.status, 'scored');
  if (result.status === 'scored') {
    assert.ok(result.total < 100);
    const cards = buildRequirementCards(result.criteria, 'atEase');
    assert.equal(cards[1].number, 2);
    assert.equal(cards[1].title, 'Chùng một chân, chân trụ thẳng');
    assert.notEqual(cards[1].statusLevel, 'PASS');
    assert.ok(cards[1].mistakes.some(m => m.includes('chùng')));
  }
});

test('saluteMovement: ideal salute with observed fingers earns 100 points and builds 5 correct cards', async () => {
  const { saluteMovement } = await import('../../src/features/pose-analysis/scoring/saluteMovement');
  const { buildRequirementCards } = await import('../../src/features/pose-analysis/scoring/postureFeedback');
  const data = window();
  // Simulate tay phải chào: gập khuỷu tay 48°, tay chạm đầu/tai (rightWristHeadDistance 0.22)
  data.samples.forEach(s => {
    s.saluteHand = { extension:175, spread:5, thumbGap:.2, wristBend:10, tipHeadDistance:.2 };
    s.values.rightWristHeadDistance = { value: 0.22, confidence: 0.95 };
    s.values.rightElbowAngle = { value: 48, confidence: 0.95 };
    s.values.leftElbowAngle = { value: 172, confidence: 0.95 };
    s.values.leftWristHipDistance = { value: 0.35, confidence: 0.95 };
    s.values.torsoTilt = { value: 3, confidence: 0.95 };
    s.values.shoulderTilt = { value: 2, confidence: 0.95 };
    s.values.leftKneeAngle = { value: 175, confidence: 0.95 };
    s.values.rightKneeAngle = { value: 175, confidence: 0.95 };
    s.values.heelGapRatio = { value: 0.12, confidence: 0.95 };
    s.values.footOpeningAngle = { value: 44, confidence: 0.95 };
    s.values.headOffset = { value: 0.05, confidence: 0.95 };
  });

  const result = evaluate(saluteMovement, data);
  assert.equal(result.status, 'scored');
  if (result.status === 'scored') {
    assert.equal(result.total, 100);
    const cards = buildRequirementCards(result.criteria, 'salute');
    assert.equal(cards.length, 5);
    assert.equal(cards[0].title, 'Tay phải giơ lên chào tự nhiên');
    assert.equal(cards[0].statusLevel, 'PASS');
    assert.equal(cards[1].title, 'Tay trái buông tự nhiên dọc thân');
    assert.equal(cards[1].statusLevel, 'PASS');
    assert.equal(cards[2].title, 'Thân người ngay ngắn & Đứng thẳng');
    assert.equal(cards[2].statusLevel, 'PASS');
    assert.equal(cards[3].title, 'Đầu ngay ngắn, mắt nhìn thẳng');
    assert.equal(cards[3].statusLevel, 'PASS');
  }
});

test('saluteMovement: hand not raised to head loses points with specific Vietnamese feedback', async () => {
  const { saluteMovement } = await import('../../src/features/pose-analysis/scoring/saluteMovement');
  const { buildRequirementCards } = await import('../../src/features/pose-analysis/scoring/postureFeedback');
  const data = window();
  // Tay phải chưa giơ lên đầu (rightWristHeadDistance 1.25) và khuỷu tay thẳng (160°)
  data.samples.forEach(s => {
    s.values.rightWristHeadDistance = { value: 1.25, confidence: 0.95 };
    s.values.rightElbowAngle = { value: 160, confidence: 0.95 };
  });

  const result = evaluate(saluteMovement, data);
  assert.equal(result.status, 'scored');
  if (result.status === 'scored') {
    assert.ok(result.total < 100);
    const cards = buildRequirementCards(result.criteria, 'salute');
    assert.equal(cards[0].title, 'Tay phải giơ lên chào tự nhiên');
    assert.notEqual(cards[0].statusLevel, 'PASS');
    assert.ok(cards[0].mistakes.some(m => m.includes('Tay phải') || m.includes('Khuỷu tay')));
  }
});

test('real-world webcam attention: natural arm hang (158°) and jacket/body wrist distance (0.62) earns 100 points with 0 mistakes', async () => {
  const { buildRequirementCards } = await import('../../src/features/pose-analysis/scoring/postureFeedback');
  const data = window();
  data.samples.forEach(s => {
    // Natural human relaxed arm hang (not stiffened backward)
    s.values.leftElbowAngle = { value: 158, confidence: 0.95 };
    s.values.rightElbowAngle = { value: 161, confidence: 0.95 };
    // Normal body proportions / military jacket fabric width
    s.values.leftWristHipDistance = { value: 0.62, confidence: 0.95 };
    s.values.rightWristHipDistance = { value: 0.60, confidence: 0.95 };
  });

  const result = evaluate(attentionMovement, data);
  assert.equal(result.status, 'scored');
  if (result.status === 'scored') {
    assert.equal(result.total, 100);
    assert.equal(result.passed, true);
    const cards = buildRequirementCards(result.criteria, 'attention');
    const armCard = cards.find(c => c.id === 'card-arms')!;
    assert.equal(armCard.statusLevel, 'PASS');
    assert.deepEqual(armCard.mistakes, []);
  }
});

test('real-world 3D ground plane foot angle extracts correctly when depth is present', () => {
  const frame = attentionFrame();
  const profile = createCalibration(Array(20).fill(frame))!;
  // Simulate 3D metric world landmarks on floor plane with depth (Z)
  frame.landmarks.leftHeel!.world = { x: -0.05, y: 0.8, z: 0.0 };
  frame.landmarks.rightHeel!.world = { x: 0.05, y: 0.8, z: 0.0 };
  // Both feet point forward into -Z with 45° total opening (22.5° each)
  // tan(22.5°) ~ 0.414. If dZ = -0.20, dX = 0.414 * 0.20 = 0.0828
  frame.landmarks.leftFootIndex!.world = { x: -0.05 - 0.0828, y: 0.8, z: -0.20 };
  frame.landmarks.rightFootIndex!.world = { x: 0.05 + 0.0828, y: 0.8, z: -0.20 };

  const norm = normalizePose(frame, profile)!;
  const sample = extractFeatures(norm);
  assert.ok(sample.values.footOpeningAngle);
  const angle = sample.values.footOpeningAngle!.value;
  // Should measure close to 45°
  assert.ok(angle >= 40 && angle <= 50, `Expected ~45° but got ${angle}`);
});

test('atEase discrimination: strict separation between Nghiêm, slumped/squat, and genuine Nghỉ', async () => {
  const { atEaseMovement } = await import('../../src/features/pose-analysis/scoring/atEaseMovement');
  const { buildRequirementCards } = await import('../../src/features/pose-analysis/scoring/postureFeedback');

  // Case 1: Đứng Nghiêm (both legs straight, e.g. 175° & 175°) fails atEase
  const dataNghiem = window();
  dataNghiem.samples.forEach(s => {
    s.values.leftKneeAngle = { value: 175, confidence: 0.95 };
    s.values.rightKneeAngle = { value: 175, confidence: 0.95 };
    s.values.minKneeAngle = { value: 175, confidence: 0.95 };
    s.values.maxKneeAngle = { value: 175, confidence: 0.95 };
    s.values.kneeAngleDiff = { value: 0, confidence: 0.95 };
  });
  const resNghiem = evaluate(atEaseMovement, dataNghiem);
  assert.equal(resNghiem.status, 'scored');
  if (resNghiem.status === 'scored') {
    assert.equal(resNghiem.passed, resNghiem.total >= 65);
    const legs = resNghiem.criteria.find(c => c.id === 'legs')!;
    assert.ok(legs.points < 25);
    const cards = buildRequirementCards(resNghiem.criteria, 'atEase');
    assert.notEqual(cards[1].statusLevel, 'PASS');
  }

  // Case 2: Slumping / Squatting (both legs bent, e.g. 150° & 145°) fails atEase
  const dataSlump = window();
  dataSlump.samples.forEach(s => {
    s.values.leftKneeAngle = { value: 145, confidence: 0.95 };
    s.values.rightKneeAngle = { value: 150, confidence: 0.95 };
    s.values.minKneeAngle = { value: 145, confidence: 0.95 };
    s.values.maxKneeAngle = { value: 150, confidence: 0.95 };
    s.values.kneeAngleDiff = { value: 5, confidence: 0.95 };
  });
  const resSlump = evaluate(atEaseMovement, dataSlump);
  assert.equal(resSlump.status, 'scored');
  if (resSlump.status === 'scored') {
    assert.equal(resSlump.passed, resSlump.total >= 65);
  }

  // Case 3: Genuine Nghỉ (support straight 173°, resting bent 150°, diff 23°) passes 100% with 0 mistakes
  const dataNghi = window();
  dataNghi.samples.forEach(s => {
    s.values.leftKneeAngle = { value: 150, confidence: 0.95 };
    s.values.rightKneeAngle = { value: 173, confidence: 0.95 };
    s.values.minKneeAngle = { value: 150, confidence: 0.95 };
    s.values.maxKneeAngle = { value: 173, confidence: 0.95 };
    s.values.kneeAngleDiff = { value: 23, confidence: 0.95 };
  });
  const resNghi = evaluate(atEaseMovement, dataNghi);
  assert.equal(resNghi.status, 'scored');
  if (resNghi.status === 'scored') {
    assert.equal(resNghi.total, 100);
    assert.equal(resNghi.passed, true);
    const cards = buildRequirementCards(resNghi.criteria, 'atEase');
    const legCard = cards.find(c => c.id === 'card-legs')!;
    assert.equal(legCard.statusLevel, 'PASS');
    assert.deepEqual(legCard.mistakes, []);
  }
});


