import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import type { QualityReport } from '../../src/features/pose-analysis/types';
import { PoseStepDashboard } from '../../src/features/pose-analysis/components/PoseStepDashboard';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';

test('B1 REPRODUCTION: starting a second session after an interval must not fail with frame gap on frame 1', () => {
  const session = new SessionProcessor();

  // Run session 1 from t = 0 to t = 3500ms (calibration complete)
  for (let t = 0; t <= 3500; t += 100) {
    if (t === 500) session.command('startCalibration');
    session.process(attentionFrame(t), goodLighting, 20);
  }

  // User waits 10 seconds before starting attempt 2 (t = 15000ms)
  session.command('reset');
  session.command('startCalibration');

  // Frame 1 of attempt 2 arrives at t = 15000ms
  const events = session.process(attentionFrame(15000), goodLighting, 20);

  // If lastTime was NOT reset, continuous is false and it emits notScorable error immediately
  const notScorable = events.find(e => e.type === 'score' && e.result.status === 'notScorable');
  assert.equal(notScorable, undefined, 'Second attempt must not fail on frame 1 due to gap from previous session');

  const snapshot = events.find(e => e.type === 'analysis');
  assert.ok(snapshot && snapshot.type === 'analysis');
  assert.equal(snapshot.snapshot.stage, 'calibrating');
  assert.equal(snapshot.snapshot.quality.checks.every(c => c.passed), true, 'All raw quality checks pass on frame 1');

  // After 1.2s warmup (t = 16200ms), quality.passed becomes true and calibration proceeds
  let calibratedEvents: any[] = [];
  for (let t = 15100; t <= 17000; t += 100) {
    calibratedEvents.push(...session.process(attentionFrame(t), goodLighting, 20));
  }
  const lastSnapshot = calibratedEvents.filter(e => e.type === 'analysis').pop();
  assert.ok(lastSnapshot);
  assert.equal(lastSnapshot.snapshot.quality.passed, true, 'Quality must pass after warmup');
});

test('B1 INVARIANT: stale/decreasing timestamps within the same session must still be rejected', () => {
  const session = new SessionProcessor();
  session.command('startCalibration');

  // First frame at t = 1000
  const ev1 = session.process(attentionFrame(1000), goodLighting, 20);
  assert.ok(ev1.length > 0);

  // Stale frame at t = 800 (decreasing timestamp) must be rejected
  const evStale = session.process(attentionFrame(800), goodLighting, 20);
  assert.equal(evStale.length, 0, 'Decreasing timestamp must be dropped');

  // Duplicate frame at t = 1000 must be rejected
  const evDup = session.process(attentionFrame(1000), goodLighting, 20);
  assert.equal(evDup.length, 0, 'Duplicate timestamp must be dropped');

  // Normal frame at t = 1033 must be accepted
  const evNext = session.process(attentionFrame(1033), goodLighting, 20);
  assert.ok(evNext.length > 0);
});

function renderDashboard(report: QualityReport | null | undefined): string {
  return renderToStaticMarkup(
    createElement(PoseStepDashboard, {
      stage: 'quality-check',
      report: report as any,
      ready: false,
      progress: 0,
      result: null,
      onStart: () => {},
      onStop: () => {},
      onCalibrate: () => {},
    })
  );
}

function getCheckItemPassed(html: string, checkId: string): boolean {
  const match = html.match(new RegExp(`data-check-id="${checkId}"\\s+data-passed="([^"]+)"`));
  assert.ok(match, `Check item ${checkId} must be rendered in DOM`);
  return match[1] === 'true';
}

test('B3: checks bị đảo thứ tự - maps strictly by ID, not by index', () => {
  const reversedChecksReport: QualityReport = {
    passed: false,
    reasons: ['Ánh sáng không đủ.'],
    checks: [
      { id: 'orientation', label: 'Nhìn chính diện', passed: true, message: 'OK' },
      { id: 'stability', label: 'Ổn định', passed: true, message: 'OK' },
      { id: 'reliability', label: 'Khớp rõ ràng', passed: true, message: 'OK' },
      { id: 'framing', label: 'Thấy toàn thân', passed: true, message: 'OK' },
      { id: 'person', label: 'Một người', passed: true, message: 'OK' },
      { id: 'lighting', label: 'Ánh sáng', passed: false, message: 'Ánh sáng quá tối' },
    ],
    metrics: {
      coverage: 1,
      meanConfidence: 0.9,
      rootMovement: 0,
      scaleVariation: 0,
      lighting: goodLighting,
    },
  };

  const html = renderDashboard(reversedChecksReport);
  // Item 0 is 'lighting' (must be false)
  // If index fallback was used, check[0] ('orientation' = true) would falsely mark lighting as true!
  assert.equal(getCheckItemPassed(html, 'lighting'), false, 'lighting check must show not passed');
  assert.equal(getCheckItemPassed(html, 'person'), true, 'person check must show passed');
  assert.equal(getCheckItemPassed(html, 'orientation'), true, 'orientation check must show passed');
});

test('B3: thiếu lighting - missing check must NOT grab other checks or display ĐẠT', () => {
  const missingLightingReport: QualityReport = {
    passed: false,
    reasons: ['Không có kiểm tra ánh sáng.'],
    checks: [
      // lighting is missing completely; index 0 is person with passed: true
      { id: 'person', label: 'Một người', passed: true, message: 'OK' },
      { id: 'framing', label: 'Thấy toàn thân', passed: true, message: 'OK' },
      { id: 'reliability', label: 'Khớp rõ ràng', passed: true, message: 'OK' },
      { id: 'stability', label: 'Ổn định', passed: true, message: 'OK' },
      { id: 'orientation', label: 'Nhìn chính diện', passed: true, message: 'OK' },
    ],
    metrics: { coverage: 1, meanConfidence: 0.9, rootMovement: 0, scaleVariation: 0, lighting: goodLighting },
  };

  const html = renderDashboard(missingLightingReport);
  // If fallback report.checks[index] was active, item 0 ('lighting') would grab checks[0] ('person', passed: true)
  assert.equal(getCheckItemPassed(html, 'lighting'), false, 'missing lighting must be false / CHƯA');
  assert.equal(getCheckItemPassed(html, 'person'), true, 'present person must be true / ĐẠT');
});

test('B3: thiếu person - missing check must NOT grab other checks or display ĐẠT', () => {
  const missingPersonReport: QualityReport = {
    passed: false,
    reasons: ['Không có kiểm tra người.'],
    checks: [
      { id: 'lighting', label: 'Ánh sáng', passed: true, message: 'OK' },
      // person is missing completely; index 1 is framing with passed: true
      { id: 'framing', label: 'Thấy toàn thân', passed: true, message: 'OK' },
      { id: 'reliability', label: 'Khớp rõ ràng', passed: true, message: 'OK' },
      { id: 'stability', label: 'Ổn định', passed: true, message: 'OK' },
      { id: 'orientation', label: 'Nhìn chính diện', passed: true, message: 'OK' },
    ],
    metrics: { coverage: 1, meanConfidence: 0.9, rootMovement: 0, scaleVariation: 0, lighting: goodLighting },
  };

  const html = renderDashboard(missingPersonReport);
  assert.equal(getCheckItemPassed(html, 'person'), false, 'missing person must be false / CHƯA');
  assert.equal(getCheckItemPassed(html, 'lighting'), true, 'present lighting must be true / ĐẠT');
});

test('B3: checks rỗng - all 6 items must show unconfirmed / CHƯA, never ĐẠT', () => {
  const emptyChecksReport: QualityReport = {
    passed: false,
    reasons: ['Chưa có kiểm tra.'],
    checks: [],
    metrics: { coverage: 0, meanConfidence: 0, rootMovement: 0, scaleVariation: 0, lighting: goodLighting },
  };

  const html = renderDashboard(emptyChecksReport);
  const checklistIds = ['lighting', 'person', 'framing', 'reliability', 'stability', 'orientation'];
  for (const id of checklistIds) {
    assert.equal(getCheckItemPassed(html, id), false, `${id} must be false when checks is empty`);
  }
  // Ensure no 'ĐẠT' badge is rendered
  assert.ok(!html.includes('>ĐẠT<'), 'No check should display ĐẠT when checks array is empty');
});

test('B3: không có report - all 6 items must show unconfirmed / CHƯA, never ĐẠT or crash', () => {
  const checklistIds = ['lighting', 'person', 'framing', 'reliability', 'stability', 'orientation'];

  for (const emptyReport of [null, undefined]) {
    const html = renderDashboard(emptyReport);
    for (const id of checklistIds) {
      assert.equal(getCheckItemPassed(html, id), false, `${id} must be false when report is ${emptyReport}`);
    }
    assert.ok(!html.includes('>ĐẠT<'), `No check should display ĐẠT when report is ${emptyReport}`);
  }
});
