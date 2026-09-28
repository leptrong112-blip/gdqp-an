import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker';
import { pairedResponses, surveyQuestions, type SurveyResponse } from '../../src/data/survey';
import { roundComparison, validSurveyAnswers } from '../../src/data/surveyRounds';

const answers = (phase: 'before' | 'after', score = 2) => Object.fromEntries(surveyQuestions('student', phase).map(q => [q.id, [q.multiple ? 0 : score]]));

test('D1 rounds preserve history, isolate submissions/AI and accept another round per account', async () => {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys = ON');
  sql.exec(readFileSync('migrations/0001_initial.sql', 'utf8'));
  sql.prepare(`INSERT INTO survey_responses (id, code, role, phase, createdAt, answers, feedback) VALUES ('old', 'old', 'student', 'after', '2026-09-01T00:00:00Z', ?, 'tải chậm')`).run(JSON.stringify(answers('after')));
  const original = sql.prepare('SELECT * FROM survey_responses').get();
  sql.exec(readFileSync('migrations/0002_survey_rounds.sql', 'utf8'));
  const migrated = sql.prepare('SELECT * FROM survey_responses').get()!;
  assert.equal(migrated.roundId, 'legacy');
  const { roundId, ...preserved } = migrated;
  assert.deepEqual(preserved, { ...original });
  sql.exec(`INSERT INTO accounts VALUES ('student1', 'student1', 'Test', 'student', 'unused', 'unused');
    INSERT INTO sessions SELECT 'admin-session', id, 9999999999999 FROM accounts WHERE role = 'admin';
    INSERT INTO sessions VALUES ('student-session', 'student1', 9999999999999);`);
  // SQLite adapter executes the actual Worker SQL, including conditional inserts.
  const prepare = (query: string, values: any[] = []): any => ({
    bind: (...bound: any[]) => prepare(query, bound),
    first: async () => sql.prepare(query).get(...values) || null,
    all: async () => ({ results: sql.prepare(query).all(...values) }),
    run: async () => ({ meta: { changes: sql.prepare(query).run(...values).changes } })
  });
  const env = { DB: { prepare } } as any;
  async function call(route: string, data?: unknown, cookie = '', method = data ? 'POST' : 'GET') {
    return worker.fetch(new Request(`https://test.invalid/api/survey/${route}`, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie ? `gdqp_session=${cookie}` : '' }, body: data ? JSON.stringify(data) : undefined }), env);
  }
  const payload = { role: 'student', name: 'Test', roundId: 'legacy', beforeAnswers: answers('before'), afterAnswers: answers('after'), feedback: 'khó thao tác' };
  try {
    assert.equal((await call('rounds')).status, 401);
    assert.equal((await call('rounds', { name: 'bad' }, 'student-session')).status, 403);
    assert.equal((await call('submissions', { ...payload, afterAnswers: {} })).status, 400);
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM survey_responses').get()!.n, 1);
    assert.equal((await call('submissions', payload, 'student-session')).status, 201);
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM survey_responses').get()!.n, 3);
    assert.equal((await call('submissions', payload, 'student-session')).status, 409);
    const round = (await (await call('rounds', { name: 'Đợt 2', notes: 'Cải tiến' }, 'admin-session')).json() as any).round;
    assert.equal((await (await call('config')).json() as any).activeRoundId, 'legacy');
    assert.equal((await call('config', { activeRoundId: round.id, isOpen: true }, 'admin-session')).status, 200);
    assert.equal((await call('submissions', payload, 'student-session')).status, 409);
    assert.equal((await call('submissions', { ...payload, roundId: round.id, feedback: 'rất tốt' }, 'student-session')).status, 201);
    assert.equal((await call('submissions', { ...payload, roundId: round.id }, '', 'POST')).status, 201);
    const rows = (await (await call('responses', undefined, 'admin-session')).json() as any).responses;
    assert.equal(rows.length, 7);
    assert.equal(rows.filter((r: SurveyResponse) => r.roundId === 'legacy').length, 3);
    assert.equal(pairedResponses(rows).length, 3);
    assert.equal((await call('responses/all', undefined, 'admin-session', 'DELETE')).status, 409);
    const a = await (await call('feedback-analysis?roundId=legacy', { force: false }, 'admin-session')).json() as any;
    const b = await (await call(`feedback-analysis?roundId=${round.id}`, { force: false }, 'admin-session')).json() as any;
    assert.equal(a.analysis.analyzedCount, 2);
    assert.equal(b.analysis.analyzedCount, 2);
    assert.notEqual(a.analysis.signature, b.analysis.signature);
    assert.equal((await (await call('feedback-analysis?roundId=legacy', undefined, 'admin-session')).json() as any).analysis.signature, a.analysis.signature);
    await call('config', { isOpen: false }, 'admin-session');
    assert.equal((await call('submissions', { ...payload, roundId: round.id })).status, 403);
  } finally { sql.close(); }
});

test('comparison keeps roles, phases and missing data separate; pairing never crosses rounds', () => {
  const row = (id: string, roundId: string, phase: 'before' | 'after', score: number): SurveyResponse => ({ id, roundId, code: 'same-person', role: 'student', phase, createdAt: '', answers: answers(phase, score) });
  const rows = [row('a', 'legacy', 'before', 0), row('b', 'round2', 'after', 4), row('c', 'legacy', 'after', 1)];
  assert.equal(pairedResponses(rows)[0].after.id, 'c');
  const result = roundComparison(rows, 'legacy', 'round2', 'student', 'after');
  assert.equal(result[0].left.value, 2);
  assert.equal(result[0].right.value, 5);
  assert.equal(roundComparison(rows, 'legacy', 'round2', 'teacher', 'after')[0].left.value, null);
  assert.equal(validSurveyAnswers('student', 'after', { ...answers('after'), technical: [0, 4] }), false);
});
