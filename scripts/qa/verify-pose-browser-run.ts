/** Verifies isolated browser QA records and downloaded workbooks. Never points at production. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import XLSX from 'xlsx';
import { finalDrillSubmission, finalPoseSubmission } from '../tests/fixtures/pose/result';
import { parsePoseResultSubmission, type PoseResultRecord } from '../../src/features/pose-analysis/results/poseResultTypes';
import { POSE_EXPORT_COLUMNS, poseExcelRows } from '../../src/features/pose-analysis/results/poseExcelExport';

const [base, action, ...files] = process.argv.slice(2);
assert.ok(/^http:\/\/127\.0\.0\.1:\d+$/.test(base), 'Only the isolated loopback QA server is allowed');
const out = path.resolve('artifacts/pose-workflow-qa');
await mkdir(out, { recursive: true });
async function login(role: string) {
  const response = await fetch(`${base}/api/survey/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `qapose_${role}`, password: 'PoseLocalQaOnly_2026!' }) });
  assert.equal(response.status, 200);
  return response.headers.get('set-cookie')!.split(';')[0];
}
async function call(route: string, method = 'GET', cookie = '', body?: unknown) {
  return fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
}
if (action === 'seed') {
  const draft = finalDrillSubmission();
  const stepResults = draft.stepResults!.map((step, index) => index ? step : {
    ...step, score: 20, passed: false, assessment: 'fail' as const, requiredCriteriaPassed: false,
    criteria: step.criteria.map(c => ({ ...c, points: 20, statusLevel: 'NOT_ACHIEVED' as const, feedback: 'QA: tiêu chí bắt buộc chưa đạt.' })),
    conciseFeedback: [{ criterionId: 'torso', label: 'Thân người thẳng', type: 'MOTION_ERROR' as const, message: 'Chưa đạt', required: true }],
  });
  const record = parsePoseResultSubmission({ ...draft, id: 'qa-formula-drill-001', studentName: '=1+1', className: '12C1',
    score: 67, passed: false, assessment: 'fail', requiredCriteriaPassed: false, stepResults,
    criteria: stepResults.flatMap(step => step.criteria.map(c => ({ ...c, id: `${step.movementId}:${c.id}` }))),
    conciseFeedback: [{ criterionId: 'attention:torso', label: 'Nghiêm: Thân người thẳng', type: 'MOTION_ERROR', message: 'Chưa đạt', required: true }],
  });
  assert.ok(record); const response = await call('/api/pose-results', 'POST', '', record);
  assert.equal(response.status, 201); console.log('PASS: seeded safe formula-like name + failed drill criterion, no real personal data.');
} else {
  const status = await (await call('/__qa/status')).json();
  const rows: PoseResultRecord[] = status.results;
  const a = rows.filter(row => row.studentName === 'Nguyễn Văn Test A');
  const b = rows.filter(row => row.studentName === 'Trần Văn Test B');
  assert.equal(a.length, 3); assert.ok(b.length >= 1);
  assert.ok(a.every(row => row.className === '12C1')); assert.ok(b.every(row => row.className === '12C2'));
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  const runtimeRows = rows.filter(row => row.id !== 'qa-formula-drill-001');
  assert.equal(status.evidence.length, runtimeRows.length);
  assert.deepEqual(status.evidence.map((item: any) => item.id).sort(), runtimeRows.map(row => row.id).sort());
  assert.ok(status.evidence.every((item: any) => item.immutable === true && item.lateEvents === 0));
  const requestCounts = a.map(row => ({ id: row.id, statuses: status.requests.filter((item: any) => item.id === row.id).map((item: any) => item.status) }));
  assert.deepEqual(requestCounts.map(item => item.statuses.length).sort(), [1, 1, 2]);
  assert.ok(requestCounts.some(item => item.statuses.join(',') === '503,201'));
  const pending = status.requests.find((item: any) => item.id === a[2].id);
  assert.ok(pending.finishedAt - pending.receivedAt >= 29_000);
  const transition = JSON.parse(await readFile(path.join(out, 'pending-transition.json'), 'utf8'));
  const switchedRequest = status.requests.find((item: any) => item.studentName === transition.from);
  assert.ok(switchedRequest.receivedAt < transition.switchedAt);
  assert.ok(transition.submittedAt < switchedRequest.finishedAt, 'Next student identity was submitted before previous save completed');
  assert.ok(rows.some(row => row.id === switchedRequest.id && row.studentName === transition.from && row.className === 'TEST-B'));
  assert.ok(!rows.some(row => row.id === switchedRequest.id && row.studentName === transition.to));
  const credentials = { admin: await login('admin'), teacher: await login('teacher'), student: await login('student') };
  const security: Record<string, unknown> = {};
  for (const role of ['anonymous', 'student', 'teacher', 'admin']) {
    const cookie = credentials[role as keyof typeof credentials] ?? '';
    const list = await call('/api/pose-results', 'GET', cookie), exported = await call('/api/pose-results/export', 'GET', cookie);
    const removed = await call('/api/pose-results/qa-does-not-exist', 'DELETE', cookie);
    assert.equal(list.status, role === 'anonymous' ? 401 : role === 'student' ? 403 : 200);
    assert.equal(exported.status, role === 'anonymous' ? 401 : role === 'admin' ? 200 : 403);
    assert.equal(removed.status, role === 'anonymous' ? 401 : role === 'admin' ? 404 : 403);
    security[role] = { list: list.status, export: exported.status, deleteMissing: removed.status };
  }
  const disposable = finalPoseSubmission({ id: 'qa-delete-only-001', studentName: 'QA disposable', className: 'TEST' });
  assert.equal((await call('/api/pose-results', 'POST', '', disposable)).status, 201);
  assert.equal((await call('/api/pose-results/' + disposable.id, 'DELETE', credentials.admin)).status, 200);
  assert.equal((await call('/api/pose-results/' + disposable.id, 'GET', credentials.admin)).status, 404);
  const { createdAt: _, ...same } = a[0];
  const duplicate = await call('/api/pose-results', 'POST', '', same);
  assert.equal(duplicate.status, 200); assert.equal((await duplicate.json()).duplicate, true);
  assert.equal((await call('/api/pose-results', 'POST', '', { ...same, className: 'wrong class' })).status, 409);
  const filtered = await (await call('/api/pose-results/export?className=12C1', 'GET', credentials.admin)).json();
  assert.equal(filtered.results.length, 4); assert.ok(filtered.results.every((row: PoseResultRecord) => row.className === '12C1'));
  const workbookProof: unknown[] = [];
  for (const [index, file] of files.entries()) {
    const bytes = await readFile(file), workbook = XLSX.read(bytes, { type: 'buffer' });
    const sheet = workbook.Sheets['Ket_qua_AI_Pose']; assert.ok(sheet);
    const table = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' });
    assert.deepEqual(table[0], Array.from(POSE_EXPORT_COLUMNS));
    const expected = rows.filter(row => row.className === (index === 0 ? '12C1' : '12C2'));
    assert.equal(table.length - 1, expected.length);
    for (const record of expected) {
      const actual = table.slice(1).find(row => row[16] === record.id); assert.ok(actual, record.id);
      assert.deepEqual(actual, poseExcelRows([record])[0]);
    }
    if (index === 0) {
      const formulaRow = table.findIndex(row => row[0] === '=1+1'); assert.ok(formulaRow > 0);
      const cell = sheet[XLSX.utils.encode_cell({ r: formulaRow, c: 0 })]; assert.equal(cell.t, 's'); assert.equal(cell.f, undefined);
      assert.deepEqual(table[formulaRow].slice(13, 16), [2, 9, 9]); assert.ok(String(table[formulaRow][5]).includes('Chưa đạt'));
    }
    for (const key of Object.keys(sheet)) if (!key.startsWith('!')) assert.equal(sheet[key].f, undefined);
    const encoded = JSON.stringify(table);
    for (const field of ['rawLandmarks', 'image', 'video', 'gdqp_session', 'sessionToken']) assert.ok(!encoded.includes(field));
    workbookProof.push({ file: path.basename(file), rows: expected.length, columns: table[0].length, reread: true, formulas: false });
  }
  assert.ok(files.length >= 1, 'Read at least one actual browser-downloaded XLSX');
  const proof = { status: 'PASS', qaUrl: base, synthetic: true, realWebcam: false, results: rows.map(row => ({ id: row.id, studentName: row.studentName,
    className: row.className, movementId: row.movementId, score: row.score, assessment: row.assessment, processingLatencyMs: row.processingLatencyMs })),
    requestCounts, security, workbookProof, finalizationEvidence: status.evidence,
    pendingStudentIsolationCoverage: { ...transition, previousSaveReceivedAt: switchedRequest.receivedAt, previousSaveFinishedAt: switchedRequest.finishedAt,
      identityPreserved: true, browserVerified: true } };
  await writeFile(path.join(out, 'verification.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof, null, 2));
}
