import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cameraGuidance, PoseCameraGuidance } from '../../src/features/pose-analysis/components/PoseCameraGuidance';
import { PoseStepDashboard } from '../../src/features/pose-analysis/components/PoseStepDashboard';
import { ScoreResults } from '../../src/features/pose-analysis/components/ScoreResults';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting, rotatedPoseFrame } from './fixtures/pose/attention';
import type { QualityReport } from '../../src/features/pose-analysis/types';

function readyReport(): QualityReport {
  const checker = new QualityChecker();
  checker.check(attentionFrame(0), goodLighting);
  return checker.check(attentionFrame(1100), goodLighting);
}

test('darkness and glare use existing lighting gate and distinct actionable guidance', () => {
  const dark = new QualityChecker().check({ ...attentionFrame(), personCount: 0, landmarks: {} }, { mean: 0, darkRatio: 1, brightRatio: 0 });
  const guidance = cameraGuidance(dark);
  assert.equal(guidance.id, 'lighting'); // Light first, even when person cannot be detected.
  assert.match(guidance.title, /thiếu sáng/);
  assert.match(guidance.tips.join(' '), /phía trước/);
  const bright = new QualityChecker().check(attentionFrame(), { mean: 250, darkRatio: 0, brightRatio: .8 });
  assert.match(cameraGuidance(bright).title, /chói/);
  assert.match(cameraGuidance(bright).tips.join(' '), /Giảm đèn/);
  assert.equal(dark.passed, false);
  assert.equal(bright.passed, false);
});

test('cropped or low-confidence landmarks are not described as wrong movements', () => {
  for (const crop of [true, false]) {
    const frame = attentionFrame();
    if (crop) frame.landmarks.leftFootIndex!.image.y = 1;
    else frame.landmarks.leftWrist!.confidence = .1;
    const report = new QualityChecker().check(frame, goodLighting);
    const guidance = cameraGuidance(report);
    assert.equal(guidance.id, 'visibility');
    assert.match(guidance.tips.join(' '), /không có nghĩa là bạn làm sai/);
    assert.match(guidance.tips.join(' '), /tiến gần hơn/);
  }
});

test('guidance follows recovery warmup without changing quality or side-on turn acceptance', () => {
  const checker = new QualityChecker();
  assert.equal(cameraGuidance(checker.check(attentionFrame(0), goodLighting)).id, 'settling');
  assert.equal(cameraGuidance(checker.check(attentionFrame(1100), goodLighting)).id, 'ready');
  const turn = checker.check(rotatedPoseFrame(90, 1200, true), goodLighting, undefined, { allowTurn: true });
  assert.equal(turn.passed, true);
  assert.equal(cameraGuidance(turn).id, 'ready');
});

test('camera instructions remain visible on step 2 and do not appear over commands or scoring', () => {
  const report = new QualityChecker().check(attentionFrame(), { mean: 10, darkRatio: 1, brightRatio: 0 });
  const html = renderToStaticMarkup(React.createElement(PoseStepDashboard, {
    stage: 'quality-check', activeStep: 2, report, ready: false, progress: 0, result: null,
    onStart() {}, onStop() {}, onCalibrate() {},
  }));
  assert.match(html, /data-camera-guidance="lighting"/);
  assert.match(html, /không nhìn được trong bóng tối hoàn toàn/);
  for (const stage of ['countdown', 'transition', 'scoring', 'stop-command', 'result'] as const) {
    assert.equal(renderToStaticMarkup(React.createElement(PoseCameraGuidance, { report, stage })), '');
  }
  assert.equal(cameraGuidance(readyReport()).id, 'ready');
});

test('camera setup help is available before detection and after a not-scorable result', () => {
  const initial = renderToStaticMarkup(React.createElement(PoseCameraGuidance, { stage: 'idle' }));
  assert.match(initial, /Kiểm tra hình ảnh trước khi tập/);
  assert.match(initial, /gót và mũi chân/);
  for (const concise of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(ScoreResults, {
      result: { status: 'notScorable', reasons: ['Chất lượng hình ảnh chưa đủ.'] }, concise,
    }));
    assert.match(html, /Cách cải thiện ánh sáng và vị trí camera/);
    assert.match(html, /bổ sung ánh sáng thật/);
    assert.match(html, /không đồng nghĩa/);
  }
});

test('insufficient light prevents countdown and cannot produce a grade', () => {
  const processor = new SessionProcessor();
  processor.command('startCalibration');
  const events = Array.from({ length: 100 }, (_, i) => processor.process(attentionFrame(i * 100), { mean: 10, darkRatio: 1, brightRatio: 0 }, 0)).flat();
  assert.equal(events.some(event => (event.type === 'commandCue' && event.command !== 'THÔI') || (event.type === 'score' && event.result.status === 'scored')), false);
  assert.equal(events.some(event => event.type === 'analysis' && ['countdown', 'scoring'].includes(event.snapshot.stage)), false);
});
