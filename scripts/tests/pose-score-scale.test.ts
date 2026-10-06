import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { poseScoreOnTen } from '../../src/features/pose-analysis/results/scoreScale';
import { ScoreResults } from '../../src/features/pose-analysis/components/ScoreResults';
import { PoseFinalSummary } from '../../src/features/pose-analysis/components/PoseFinalSummary';
import { poseExcelRows } from '../../src/features/pose-analysis/results/poseExcelExport';
import { finalDrillSubmission } from './fixtures/pose/result';
import { parsePoseResultSubmission } from '../../src/features/pose-analysis/results/poseResultTypes';
import type { ScoreResult } from '../../src/features/pose-analysis/scoring/scoringTypes';

test('ten-point conversion preserves proportions, fractional criteria, missing coverage and signed deltas', () => {
  assert.equal(poseScoreOnTen(86), 8.6);
  assert.equal(poseScoreOnTen(25), 2.5);
  assert.equal(poseScoreOnTen(64.9), 6.49);
  assert.equal(poseScoreOnTen(-7), -0.7);
  assert.equal(poseScoreOnTen(300, 300), 10);
  assert.equal(poseScoreOnTen(270, 300), 9);
  assert.equal(poseScoreOnTen(0), 0);
});

test('student result shows ten-point scores while retaining original score and assessment', () => {
  const result: ScoreResult = { status: 'scored', total: 86, passed: true, assessment: 'pass', confidence: .99,
    criteria: [{ id: 'torso', label: 'Thân thẳng', points: 25, maximum: 25, status: 'good', statusLevel: 'PASS', required: true, feedback: 'Đạt', mistakes: [], measurements: [] }], corrections: [] };
  const before = JSON.stringify(result);
  const html = renderToStaticMarkup(React.createElement(ScoreResults, { result, movementId: 'turnLeft', scoreComparison: { previous: 79, delta: 7 } }));
  assert.match(html, /8\.6/); assert.match(html, /Thang điểm 10/); assert.match(html, /2\.5 \/ 2\.5/); assert.match(html, /\+0\.7 đ/);
  assert.doesNotMatch(html, /Thang điểm 100|86%|86\/100/);
  const summary = renderToStaticMarkup(React.createElement(PoseFinalSummary, { result, movementId: 'attention', children: null }));
  assert.match(summary, /8\.6\/10/);
  assert.equal(JSON.stringify(result), before);
});

test('export converts normalized overall and each drill step once without changing stored records', () => {
  const record = parsePoseResultSubmission(finalDrillSubmission())!;
  const before = JSON.stringify(record);
  const row = poseExcelRows([{ ...record, createdAt: record.finishedAt }])[0];
  assert.equal(row[3], 9); assert.deepEqual(row.slice(13, 16), [9, 9, 9]);
  assert.equal(JSON.stringify(record), before);
});
