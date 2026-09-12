import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submitExamResultToServer, fetchExamResultsFromServer, deleteExamResultOnServer } from '../../src/utils/examEngine';
import type { ExamResultRecord } from '../../src/types/exam';

test('Exam client sends session credentials, omits identity and exposes API failures', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const events: string[] = [];
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    dispatchEvent: (event: Event) => { events.push(event.type); return true; },
  } });
  try {
    globalThis.fetch = async (_input, options) => {
      assert.equal(options?.credentials, 'same-origin');
      const body = JSON.parse(options!.body as string);
      assert.equal(body.studentName, undefined);
      assert.equal(body.studentId, undefined);
      assert.equal(body.studentUsername, undefined);
      assert.equal(body.studentClass, '10A1');
      assert.equal(body.score, 8);
      return Response.json({ ok: true }, { status: 201 });
    };
    assert.equal(await submitExamResultToServer({ studentName: 'Forged', studentId: 'forged',
      studentUsername: 'forged', studentClass: '10A1', score: 8 } as ExamResultRecord), true);
    for (const status of [401, 403, 500]) {
      globalThis.fetch = async () => Response.json({ error: `Failure ${status}` }, { status });
      for (const action of [() => fetchExamResultsFromServer(), () => deleteExamResultOnServer('id'),
        () => submitExamResultToServer({} as ExamResultRecord)]) {
        await assert.rejects(action, new RegExp(`Failure ${status}`));
      }
    }
    assert.deepEqual(events, Array(3).fill('gdqp-session-expired'));
    globalThis.fetch = async () => Response.json({ results: [] });
    assert.deepEqual(await fetchExamResultsFromServer(), []);
    globalThis.fetch = async () => { throw new Error('Offline'); };
    await assert.rejects(fetchExamResultsFromServer, /Offline/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
