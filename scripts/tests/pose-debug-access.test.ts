import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PoseAdminOnly } from '../../src/features/pose-analysis/components/PoseAdminOnly';
import { PoseReadinessStatus } from '../../src/features/pose-analysis/components/PoseReadinessStatus';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';

test('pose debug is absent for guests, teachers and students even when requested', () => {
  // An enabled URL/stored HUD preference supplies children, not authorization.
  function DebugContent(): never { throw new Error('Unauthorized debug must not mount'); }
  for (const user of [null, { role: 'student' }, { role: 'teacher' }] as const) {
    assert.equal(renderToStaticMarkup(React.createElement(PoseAdminOnly, {
      user, loading: false, children: React.createElement(DebugContent),
    })), '');
  }
});

test('pose debug fails closed while account verification is loading', () => {
  assert.equal(renderToStaticMarkup(React.createElement(PoseAdminOnly, {
    user: { role: 'admin' }, loading: true, children: 'Developer HUD',
  })), '');
});

test('readiness diagnostics are visible only for the current verified admin', () => {
  const processor = new SessionProcessor();
  const event = processor.process(attentionFrame(1000), goodLighting, 0).find(e => e.type === 'analysis');
  assert.ok(event?.type === 'analysis');
  const children = React.createElement(PoseReadinessStatus, {
    snapshot: event.snapshot, stage: 'quality-check', autoCalibrate: true,
  });
  const render = (user: { role: 'admin' | 'teacher' | 'student' } | null) => renderToStaticMarkup(
    React.createElement(PoseAdminOnly, { user, loading: false, children }),
  );
  assert.match(render({ role: 'admin' }), /Chi tiết để quay video/);
  // The same diagnostic content disappears on logout or account change.
  assert.equal(render(null), '');
  assert.equal(render({ role: 'teacher' }), '');
  assert.equal(render({ role: 'student' }), '');
  assert.match(render({ role: 'admin' }), /FPS/);
});
