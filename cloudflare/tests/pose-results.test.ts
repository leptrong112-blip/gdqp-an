import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker';
import { finalPoseSubmission, finalDrillSubmission } from '../../scripts/tests/fixtures/pose/result';

test('Pose D1 migration and Worker API preserve prior data, enforce roles, immutable ids and filtered admin export', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const migration of ['0001_initial', '0002_survey_rounds', '0003_survey_round_trash']) db.exec(readFileSync(`migrations/${migration}.sql`, 'utf8'));
  const oldAccount = db.prepare('SELECT * FROM accounts').get();
  db.exec(readFileSync('migrations/0004_pose_results.sql', 'utf8'));
  assert.deepEqual(db.prepare('SELECT * FROM accounts').get(), oldAccount);
  db.exec(`INSERT INTO accounts VALUES ('teacher1','teacher1','Teacher','teacher','unused','unused');
    INSERT INTO accounts VALUES ('student1','student1','Student','student','unused','unused');
    INSERT INTO sessions SELECT 'admin-pose',id,9999999999999 FROM accounts WHERE role='admin';
    INSERT INTO sessions VALUES ('teacher-pose','teacher1',9999999999999);
    INSERT INTO sessions VALUES ('student-pose','student1',9999999999999);`);
  const prepare = (query: string, args: any[] = []): any => ({ bind: (...values: any[]) => prepare(query, values),
    first: async () => db.prepare(query).get(...args) || null, all: async () => ({ results: db.prepare(query).all(...args) }),
    run: async () => ({ meta: { changes: db.prepare(query).run(...args).changes } }) });
  const env = { DB: { prepare }, ASSETS: { fetch: () => { throw new Error('API must not fall through to static assets'); } } } as any;
  const call = (route = '', method = 'GET', role = '', data?: unknown, origin?: string) => worker.fetch(new Request(`https://pose.test/api/pose-results${route}`, {
    method, headers: { 'Content-Type': 'application/json', ...(role ? { Cookie: `gdqp_session=${role}-pose` } : {}), ...(origin ? { Origin: origin } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data) }), env);
  try {
    for (const role of ['', 'student', 'teacher', 'admin']) {
      const read = await call('', 'GET', role), detail = await call('/attempt-fixture-001', 'GET', role), exported = await call('/export', 'GET', role);
      assert.equal(read.status, role === '' ? 401 : role === 'student' ? 403 : 200);
      assert.equal(detail.status, role === '' ? 401 : role === 'student' ? 403 : 404);
      assert.equal(exported.status, role === '' ? 401 : role === 'admin' ? 200 : 403);
      assert.equal(exported.headers.get('cache-control'), 'no-store');
      assert.equal((await call('/attempt-fixture-001', 'DELETE', role)).status, role === '' ? 401 : role === 'admin' ? 404 : 403);
    }
    const first = finalPoseSubmission();
    assert.equal((await call('', 'POST', '', { ...first, rawLandmarks: [{ secret: true }], image: 'secret' })).status, 201);
    const repeated = await call('', 'POST', '', first);
    assert.equal(repeated.status, 200);
    assert.deepEqual(await repeated.json(), { ok: true, id: first.id, duplicate: true });
    assert.equal((await call('', 'POST', '', { ...first, studentName: 'Other student' })).status, 409);
    assert.equal((await call('', 'POST', '', { ...first, id: 'second-attempt-001', score: 101 })).status, 400);
    assert.equal((await call('', 'POST', '', { ...first, id: 'second-attempt-001' }, 'https://evil.test')).status, 403);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM pose_results').get()!.n, 1);
    const second = finalPoseSubmission({ id: 'second-attempt-001', studentName: 'Trần Bảo', className: '11B2', score: 95, movementId: 'salute',
      finishedAt: '2026-10-05T23:59:59.999Z' });
    assert.equal((await call('', 'POST', 'student', second)).status, 201);
    assert.equal((await call('', 'POST', '', finalDrillSubmission())).status, 201);
    const list = await (await call('?className=10a1&movementId=attention&from=2026-10-04&to=2026-10-04', 'GET', 'teacher')).json() as any;
    assert.equal(list.results.length, 1);
    assert.equal(list.results[0].studentName, first.studentName);
    const exported = await (await call('/export?studentName=' + encodeURIComponent('trần') + '&className=11&assessment=pass&sort=score', 'GET', 'admin')).json() as any;
    assert.deepEqual(exported.results.map((result: any) => result.id), [second.id]);
    assert.equal((await call("?studentName=' OR 1=1 --", 'GET', 'teacher')).status, 200);
    const persisted = db.prepare('SELECT * FROM pose_results WHERE id=?').get(first.id)!;
    assert.equal(persisted.rawLandmarks, undefined);
    assert.ok(!JSON.stringify(persisted).includes('secret'));
    const detail = await (await call('/' + first.id, 'GET', 'teacher')).json() as any;
    assert.equal(detail.result.image, undefined);
    assert.equal(detail.result.content_hash, undefined);
    assert.equal(detail.result.score, 90);
    assert.equal((await call('/' + first.id, 'DELETE', 'teacher')).status, 403);
    assert.equal((await call('/' + first.id, 'DELETE', 'admin')).status, 200);
    assert.equal((await call('/' + first.id, 'GET', 'admin')).status, 404);
    const withPreparation = finalPoseSubmission({ id: 'precondition-step-001', movementId: 'atEase', score: 75,
      preconditionResult: { ...finalDrillSubmission().stepResults![0], score: 90 } });
    assert.equal((await call('', 'POST', '', withPreparation)).status, 201);
    const storedPreparation = await (await call('/' + withPreparation.id, 'GET', 'teacher')).json() as any;
    assert.equal(storedPreparation.result.preconditionResult.score, 90);
    assert.equal(storedPreparation.result.score, 75);
    assert.equal((await call('', 'POST', '', withPreparation)).status, 200);
    db.prepare('UPDATE sessions SET expires_at=1 WHERE token=?').run('teacher-pose');
    assert.equal((await call('', 'GET', 'teacher')).status, 401);
    assert.equal((await worker.fetch(new Request('https://pose.test/api/exam/results'), env)).status, 501);
  } finally { db.close(); }
});
