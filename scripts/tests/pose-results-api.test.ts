import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createAuth } from '../../server/auth';
import { createPoseResultsRouter } from '../../server/poseResults';
import { finalPoseSubmission, finalDrillSubmission } from './fixtures/pose/result';

test('Local Pose API shares authentication and matches Worker authorization, storage, filtering and duplicate behavior', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'gdqp-pose-test-'));
  const app = express(), auth = createAuth(directory);
  for (const role of ['admin', 'teacher', 'student'] as const) auth.sessions.set(`${role}-pose`, { user: { id: role, username: role, name: role, role }, expires: Date.now() + 3600_000 });
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/pose-results', createPoseResultsRouter(directory, auth));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/pose-results`;
  const call = (route = '', method = 'GET', role = '', data?: unknown, origin?: string) => fetch(base + route, {
    method, headers: { 'Content-Type': 'application/json', ...(role ? { Cookie: `gdqp_session=${role}-pose` } : {}), ...(origin ? { Origin: origin } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data) });
  try {
    for (const role of ['', 'student', 'teacher', 'admin']) {
      assert.equal((await call('', 'GET', role)).status, role === '' ? 401 : role === 'student' ? 403 : 200);
      assert.equal((await call('/export', 'GET', role)).status, role === '' ? 401 : role === 'admin' ? 200 : 403);
      assert.equal((await call('/attempt-fixture-001', 'GET', role)).status, role === '' ? 401 : role === 'student' ? 403 : 404);
      assert.equal((await call('/attempt-fixture-001', 'DELETE', role)).status, role === '' ? 401 : role === 'admin' ? 404 : 403);
    }
    const first = finalPoseSubmission();
    const submissions = await Promise.all([call('', 'POST', '', { ...first, rawLandmarks: 'secret', image: 'secret' }), call('', 'POST', '', first)]);
    assert.deepEqual(submissions.map(response => response.status).sort(), [200, 201]);
    for (const response of submissions) assert.equal((await response.json()).id, first.id);
    assert.equal((await call('', 'POST', '', { ...first, className: 'Other class' })).status, 409);
    assert.equal((await call('', 'POST', '', { ...first, score: 101 })).status, 400);
    assert.equal((await call('', 'POST', '', first, 'https://evil.test')).status, 403);
    assert.equal((await call('', 'POST', '', finalDrillSubmission())).status, 201);
    const second = finalPoseSubmission({ id: 'second-attempt-001', studentName: 'Trần Bảo', className: '11B2', score: 95, movementId: 'salute' });
    assert.equal((await call('', 'POST', 'student', second)).status, 201);
    const exported = await (await call('/export?studentName=' + encodeURIComponent('trần') + '&movementId=salute&className=11&assessment=pass', 'GET', 'admin')).json();
    assert.deepEqual(exported.results.map((record: any) => record.id), [second.id]);
    const teacher = await (await call('?className=10a1&movementId=attention', 'GET', 'teacher')).json();
    assert.deepEqual(teacher.results.map((record: any) => record.id), [first.id]);
    const raw = await readFile(path.join(directory, 'pose_results.jsonl'), 'utf8');
    assert.equal(raw.trim().split('\n').length, 3);
    assert.ok(!raw.includes('secret'));
    const detail = await (await call('/' + first.id, 'GET', 'teacher')).json();
    assert.equal(detail.result.rawLandmarks, undefined);
    assert.equal(detail.result.studentName, first.studentName);
    assert.equal((await call('/' + first.id, 'DELETE', 'admin')).status, 200);
    assert.equal((await call('/' + first.id, 'GET', 'teacher')).status, 404);
    const prepared = finalPoseSubmission({ id: 'precondition-local-001', movementId: 'atEase', score: 75,
      preconditionResult: { ...finalDrillSubmission().stepResults![0], score: 90 } });
    assert.equal((await call('', 'POST', '', prepared)).status, 201);
    const preparationDetail = await (await call('/' + prepared.id, 'GET', 'teacher')).json();
    assert.equal(preparationDetail.result.score, 75); assert.equal(preparationDetail.result.preconditionResult.score, 90);
    auth.sessions.get('teacher-pose')!.expires = 1;
    assert.equal((await call('', 'GET', 'teacher')).status, 401);
    // Re-created router reads durable data after a page refresh/process restart.
    const remaining = (await readFile(path.join(directory, 'pose_results.jsonl'), 'utf8')).trim().split('\n');
    assert.equal(remaining.length, 3);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('gdqp-pose-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});
