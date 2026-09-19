import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createAuth, makeAccount, saveAccounts } from '../../server/auth';
import { createSurveyRouter } from '../../server/survey';
import { createExamRouter } from '../../server/exam';

test('Exam API shares account sessions, enforces roles and persists server identity', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'gdqp-exam-test-'));
  const password = 'exam-test-password';
  const accounts = ['admin', 'teacher', 'student'].map(role =>
    makeAccount(role, `Name ${role}`, role as 'admin' | 'teacher' | 'student', password));
  const app = express();
  const auth = createAuth(directory);
  app.use(express.json());
  app.use('/api/survey', createSurveyRouter(directory, auth));
  app.use('/api/exam', createExamRouter(directory, auth));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const request = (route: string, method = 'GET', cookie = '', body?: unknown, origin?: string) =>
    fetch(base + '/api/' + route, { method, headers: { Cookie: cookie,
      'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body) });
  try {
    await saveAccounts(directory, accounts);
    for (const cookie of ['', 'gdqp_session=forged']) {
      for (const method of ['GET', 'POST', 'DELETE']) {
        const res = await request('exam/results' + (method === 'DELETE' ? '/missing' : ''), method, cookie, method === 'POST' ? {} : undefined);
        assert.equal(res.status, 401);
        assert.equal(res.headers.get('cache-control'), 'no-store');
      }
    }
    const cookies: Record<string, string> = {};
    for (const account of accounts) {
      const res = await request('survey/login', 'POST', '', { username: account.username, password });
      assert.equal(res.status, 200);
      cookies[account.role] = res.headers.get('set-cookie')!.split(';')[0];
    }
    assert.equal((await request('exam/results', 'GET', cookies.student)).status, 403);
    assert.equal((await request('exam/results/missing', 'DELETE', cookies.student)).status, 403);
    for (const role of ['admin', 'teacher']) {
      const res = await request('exam/results', 'GET', cookies[role]);
      assert.equal(res.status, 200);
      assert.deepEqual((await res.json()).results, []);
    }
    for (const body of [[], { studentClass: 123 }, { score: 15 }, { score: -2 }, { accuracyPercent: 150 }]) {
      assert.equal((await request('exam/results', 'POST', cookies.student, body)).status, 400);
    }
    for (const account of accounts) {
      const payload = { id: `result-${account.role}`, studentId: 'forged', studentUsername: 'forged',
        studentName: { malicious: true }, studentClass: ' 10A1 ', mode: 'grade_10', format: 'full',
        timeLimitMinutes: 0, score: 8, details: [{ questionId: 1 }], tfDetails: [], essayDetails: [] };
      const res = await request('exam/results', 'POST', cookies[account.role], payload);
      assert.equal(res.status, 201);
      const { result } = await res.json();
      assert.equal(result.studentId, account.id);
      assert.equal(result.studentUsername, account.username);
      assert.equal(result.studentName, account.name);
      assert.equal(result.studentClass, '10A1');
      assert.equal(result.timeLimitMinutes, 0);
      assert.equal(result.score, 8);
      assert.deepEqual(result.details, payload.details);
      assert.equal(result.hash, undefined);
    }

    // Chống gian lận điểm thi (Server-side score validation):
    // Học sinh chọn sai câu 1001 nhưng gửi fake score 10.0 và fake isCorrect: true
    const tamperedPayload = {
      id: 'result-tampered',
      studentClass: '10A1',
      mode: 'grade_10',
      format: 'mcq',
      timeLimitMinutes: 15,
      score: 10.0,
      xpGained: 1000,
      accuracyPercent: 100,
      details: [{
        questionId: 1001,
        selectedOption: 2, // Sai: "02/09/1945" (Đáp án đúng là "22/12/1944", index 0)
        options: ["22/12/1944", "19/08/1945", "02/09/1945", "22/12/1946"],
        isCorrect: true
      }],
      tfDetails: [],
      essayDetails: []
    };
    const tamperedRes = await request('exam/results', 'POST', cookies.student, tamperedPayload);
    assert.equal(tamperedRes.status, 201);
    const { result: tamperedResult } = await tamperedRes.json();
    assert.equal(tamperedResult.score, 0);
    assert.equal(tamperedResult.accuracyPercent, 0);
    assert.equal(tamperedResult.correctCount, 0);
    assert.equal(tamperedResult.details[0].isCorrect, false);
    assert.equal(tamperedResult.details[0].correctOption, 0);

    const persisted = (await readFile(path.join(directory, 'exam_results.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(persisted.length, 4);
    assert.ok(persisted.every(r => accounts.some(a => a.id === r.studentId && a.name === r.studentName)));
    assert.equal((await request('exam/results/result-student', 'DELETE', cookies.student)).status, 403);
    assert.equal((await request('exam/results', 'POST', cookies.student, {}, 'https://other.invalid')).status, 403);
    assert.equal((await request('exam/results/result-student', 'DELETE', cookies.teacher, undefined, 'https://other.invalid')).status, 403);
    assert.equal((await request('exam/results/result-student', 'DELETE', cookies.teacher)).status, 200);
    assert.equal((await request('exam/results/result-tampered', 'DELETE', cookies.teacher)).status, 200);
    assert.equal((await request('exam/results/result-admin', 'DELETE', cookies.admin)).status, 200);
    assert.equal((await request('exam/results/missing', 'DELETE', cookies.teacher)).status, 404);
    const remaining = await request('exam/results', 'GET', cookies.teacher);
    assert.deepEqual((await remaining.json()).results.map(r => r.id), ['result-teacher']);
    await request('survey/logout', 'POST', cookies.student, {});
    assert.equal((await request('exam/results', 'POST', cookies.student, {})).status, 401);
    const now = Date.now;
    try {
      Date.now = () => now() + 9 * 3600_000;
      assert.equal((await request('exam/results', 'GET', cookies.teacher)).status, 401);
      assert.equal((await request('exam/results/result-teacher', 'DELETE', cookies.admin)).status, 401);
      assert.equal((await request('exam/results', 'POST', cookies.teacher, {})).status, 401);
    } finally { Date.now = now; }
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('gdqp-exam-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});
