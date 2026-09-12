import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createSurveyRouter } from '../server/survey';
import { makeAccount, saveAccounts } from '../server/auth';
import { surveyQuestions, pairedResponses } from '../src/data/survey';

test('Account roles, isolation, persistence, survey validation and admin reporting', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'gdqp-survey-test-'));
  const password = 'test-password-123456';
  await saveAccounts(directory, [makeAccount('admin', 'Admin', 'admin', password), makeAccount('teacher', 'Teacher', 'teacher', password), makeAccount('student', 'Student', 'student', password)]);
  assert.ok(!(await readFile(path.join(directory, 'accounts.json'), 'utf8')).includes(password));
  const app = express(); app.use(express.json()); app.use('/api/survey', createSurveyRouter(directory));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/survey`;
  const request = (route: string, body?: unknown, cookie = '') => fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
  async function login(username: string) {
    const result = await request('/login', { username, password }); assert.equal(result.status, 200);
    assert.match(result.headers.get('set-cookie')!, /HttpOnly/);
    const body = await result.json(); assert.equal(body.user.username, username); assert.equal(body.user.hash, undefined);
    return result.headers.get('set-cookie')!.split(';')[0];
  }
  try {
    for (const route of ['/me', '/responses', '/accounts', '/my-responses']) assert.equal((await request(route)).status, 401);
    assert.equal((await request('/responses', {})).status, 401);
    assert.equal((await request('/login', { username: 'admin', password: 'wrong' })).status, 401);
    const admin = await login('admin'); const teacher = await login('teacher'); const student = await login('student');
    for (const cookie of [student, teacher]) {
      assert.equal((await request('/responses', undefined, cookie)).status, 403);
      assert.equal((await request('/accounts', undefined, cookie)).status, 403);
      assert.equal((await request('/accounts', { username: 'hacker', name: 'Hacker', role: 'admin' }, cookie)).status, 403);
    }
    const before = { phase: 'before', answers: Object.fromEntries(surveyQuestions('student', 'before').map(q => [q.id, [0]])) };
    assert.equal((await request('/responses', before, admin)).status, 403);
    assert.equal((await request('/responses', { ...before, role: 'teacher' }, student)).status, 403);
    assert.equal((await request('/responses', { ...before, answers: {} }, student)).status, 400);
    assert.equal((await request('/responses', { ...before, answers: { ...before.answers, barriers: [0, 5] } }, student)).status, 400);
    assert.equal((await request('/responses', { ...before, feedback: 12345 }, student)).status, 400);
    assert.equal((await request('/responses', { ...before, code: 'FORGED123' }, student)).status, 201);
    assert.equal((await request('/responses', before, student)).status, 409);
    const after = { phase: 'after', answers: Object.fromEntries(surveyQuestions('student', 'after').map(q => [q.id, [1]])), feedback: 'Cần thêm tính năng bắn súng 3D' };
    const concurrent = await Promise.all([request('/responses', after, student), request('/responses', after, student)]);
    assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 409]);
    const teacherAfter = { phase: 'after', answers: Object.fromEntries(surveyQuestions('teacher', 'after').map(q => [q.id, [0]])), feedback: 'Rất hữu ích cho dạy học thực hành' };
    assert.equal((await request('/responses', teacherAfter, teacher)).status, 201);
    const mine = await (await request('/my-responses', undefined, student)).json();
    assert.equal(mine.responses.length, 2); assert.ok(mine.responses.every(r => r.username === 'student' && r.code !== 'FORGED123'));
    assert.equal(mine.responses.find((r: { phase: string }) => r.phase === 'after').feedback, 'Cần thêm tính năng bắn súng 3D');
    const data = await (await request('/responses', undefined, admin)).json();
    assert.equal(data.responses.length, 3); assert.equal(pairedResponses(data.responses).length, 1);
    assert.equal(data.responses.find((r: { role: string; phase: string }) => r.role === 'teacher' && r.phase === 'after').feedback, 'Rất hữu ích cho dạy học thực hành');
    const created = await request('/accounts', { username: 'student02', name: 'Student 02', role: 'student' }, admin);
    assert.equal(created.status, 201); const account = await created.json(); assert.ok(account.password.length >= 12);
    const newLogin = await request('/login', { username: 'student02', password: account.password });
    const secondStudent = newLogin.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await (await request('/my-responses', undefined, secondStudent)).json()).responses.length, 0);
    assert.equal((await request('/accounts', { username: 'student02', name: 'Duplicate', role: 'student' }, admin)).status, 409);
    const list = await (await request('/accounts', undefined, admin)).json(); assert.equal(list.accounts.length, 4); assert.ok(list.accounts.every(a => !a.hash && !a.salt && !a.password));
    const crossOrigin = await fetch(base + '/accounts', { method: 'POST', headers: { Cookie: admin, Origin: 'https://other.invalid', 'Content-Type': 'application/json' }, body: '{}' }); assert.equal(crossOrigin.status, 403);
    for (const role of ['student', 'teacher'] as const) for (const phase of ['before', 'after'] as const) {
      const qs = surveyQuestions(role, phase); assert.ok(qs.length >= 5 && qs.length <= 10);
    }
    // Test public submission without login
    const publicStudent = {
      role: 'student',
      phase: 'before',
      name: 'Trần Văn Nam',
      school: 'THPT Chu Văn An',
      className: '11A1',
      answers: Object.fromEntries(surveyQuestions('student', 'before').map(q => [q.id, [0]])),
      feedback: 'Em rất thích bài 3D này'
    };
    const pubRes = await request('/responses', publicStudent);
    assert.equal(pubRes.status, 201);

    // Test access via x-admin-pin
    const pinRes = await fetch(base + '/responses', { headers: { 'x-admin-pin': '123456' } });
    assert.equal(pinRes.status, 200);
    const pinData = await pinRes.json();
    assert.equal(pinData.responses.length, 4);
    assert.ok(pinData.responses.some((r: { name?: string; className?: string }) => r.name === 'Trần Văn Nam' && r.className === '11A1'));

    // Test change-password via old password
    const changeRes = await request('/change-password', { targetUsername: 'teacher', oldPassword: password, newPassword: 'new-teacher-password' });
    assert.equal(changeRes.status, 200);
    const checkOld = await request('/login', { username: 'teacher', password });
    assert.equal(checkOld.status, 401);
    const checkNew = await request('/login', { username: 'teacher', password: 'new-teacher-password' });
    assert.equal(checkNew.status, 200);

    // Test change-password via Admin PIN (without login or old password)
    const pinResetRes = await request('/change-password', { targetUsername: 'admin', pin: '123456', newPassword: 'brand-new-admin-pass' });
    assert.equal(pinResetRes.status, 200);
    const checkAdminNew = await request('/login', { username: 'admin', password: 'brand-new-admin-pass' });
    assert.equal(checkAdminNew.status, 200);
    // Reset back for subsequent tests
    await request('/change-password', { targetUsername: 'admin', pin: '123456', newPassword: password });

    await request('/logout', {}, admin); assert.equal((await request('/responses', undefined, admin)).status, 401);
    const second = express(); second.use(express.json()); second.use('/api/survey', createSurveyRouter(directory));
    const restarted = second.listen(0, '127.0.0.1'); await new Promise<void>(resolve => restarted.once('listening', resolve));
    try {
      const url = `http://127.0.0.1:${(restarted.address() as { port: number }).port}/api/survey`;
      const auth = await fetch(url + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password }) });
      assert.equal(auth.status, 200);
      const stored = await fetch(url + '/responses', { headers: { Cookie: auth.headers.get('set-cookie')!.split(';')[0] } });
      assert.equal((await stored.json()).responses.length, 4);
    } finally { restarted.closeAllConnections(); await new Promise<void>(resolve => restarted.close(() => resolve())); }
  } finally {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('gdqp-survey-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});
