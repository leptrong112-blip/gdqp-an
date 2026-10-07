import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as XLSX from 'xlsx';
import { PoseAdminView, PoseRecordDetail, poseAdminStats, poseObservedScore } from '../../src/features/pose-analysis/admin/PoseAdminSection';
import { deletePoseResult, getPoseExportResults, getPoseResult, listPoseResults, poseResultQuery, savePoseResult } from '../../src/features/pose-analysis/results/poseResultsApi';
import { exportPoseResultsToExcel, POSE_EXPORT_COLUMNS, poseExcelRows } from '../../src/features/pose-analysis/results/poseExcelExport';
import type { PoseResultRecord } from '../../src/features/pose-analysis/results/poseResultTypes';

const record = (overrides: Partial<PoseResultRecord> = {}): PoseResultRecord => ({
  id: 'pose-test-0001', studentName: 'Nguyễn Văn An', className: '10A1', movementId: 'attention', movementLabel: 'Đứng nghiêm',
  score: 85, passed: true, assessment: 'pass', requiredCriteriaPassed: true,
  criteria: [{ id: 'torso', label: 'Thân thẳng', points: 25, maximum: 25, statusLevel: 'PASS', required: true, feedback: 'Giữ thân thẳng.' }],
  conciseFeedback: [], quality: { confidence: .9, unassessedPoints: 0 },
  startedAt: '2026-10-04T01:00:00.000Z', finishedAt: '2026-10-04T01:00:10.000Z', createdAt: '2026-10-04T01:00:10.500Z',
  processingLatencyMs: 115, rubricVersion: 'test-rubric', ...overrides,
});
const noop = () => {};

test('teacher view renders result filters/details but never exports, downloads, prints or deletes', () => {
  const props = { results: [record()], filters: {}, onFilters: noop, onRefresh: noop, onExport: noop, onDetail: noop, onDelete: noop };
  const teacher = renderToStaticMarkup(React.createElement(PoseAdminView, { ...props, role: 'teacher' }));
  assert.match(teacher, /Kết quả AI Pose học sinh/); assert.match(teacher, /Nguyễn Văn An/); assert.match(teacher, /Tất cả động tác/);
  assert.doesNotMatch(teacher, /Xuất kết quả|FileSpreadsheet|\.xlsx|\.csv|\.pdf|\.json|Xóa kết quả của|In báo cáo/);
  const admin = renderToStaticMarkup(React.createElement(PoseAdminView, { ...props, role: 'admin' }));
  assert.match(admin, /Xuất kết quả AI Pose Excel/); assert.match(admin, /Xóa kết quả của/);
});

test('insufficient evidence remains distinct from motion failure in management summaries and details', () => {
  const unknown = record({ id: 'pose-unknown-01', score: 30, assessment: 'incomplete', passed: false, requiredCriteriaPassed: null, processingLatencyMs: null,
    criteria: [{ id: 'arm', label: 'Tay phải', points: 0, maximum: 10, statusLevel: 'NOT_SCORABLE', feedback: 'Camera chưa quan sát đủ.', required: true }],
    conciseFeedback: [{ criterionId: 'arm', label: 'Tay phải', type: 'INSUFFICIENT_EVIDENCE', message: 'Camera chưa quan sát đủ.' }] });
  assert.deepEqual(poseAdminStats([record(), record({ assessment: 'fail', passed: false, score: 55 }), unknown]), { total: 3, average: 70, passed: 1, failed: 1, incomplete: 1, passRate: 50 });
  const html = renderToStaticMarkup(React.createElement(PoseRecordDetail, { record: unknown }));
  assert.match(html, /Camera chưa đủ dữ liệu/); assert.match(html, /Chưa đo được/); assert.doesNotMatch(html, />0 \/ 10|Bạn làm sai/);
});

test('incomplete list, detail and drill steps show observed score without implying missing evidence is zero', () => {
  const partial = record({ score: 86, assessment: 'incomplete', passed: false, quality: { unassessedPoints: 10 } });
  assert.deepEqual(poseObservedScore(partial), { score: 8.6, maximum: 9, partial: true });
  const list = renderToStaticMarkup(React.createElement(PoseAdminView, { role: 'teacher', results: [partial], filters: {}, onFilters: noop, onRefresh: noop, onExport: noop, onDetail: noop, onDelete: noop }));
  assert.match(list, /8\.6<span[^>]*>\/9<\/span>/); assert.match(list, /Phần đã đánh giá/); assert.doesNotMatch(list, /86\/100|86%/);
  const drill = record({ ...partial, movementId: 'basicDrill', stepResults: [{ movementId: 'salute', movementLabel: 'Chào', score: 86, passed: false, assessment: 'incomplete', requiredCriteriaPassed: null, criteria: [], conciseFeedback: [], quality: { unassessedPoints: 10 } }] });
  const detail = renderToStaticMarkup(React.createElement(PoseRecordDetail, { record: drill }));
  assert.equal((detail.match(/\/9<\/span>/g) ?? []).length, 2); assert.doesNotMatch(detail, /86\/100|86%/);
});

test('Pose API uses session credentials, preserves attempt identity and sends local-day filters to export endpoint', async () => {
  const original = globalThis.fetch;
  const queries: string[] = [];
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(init?.credentials, 'same-origin'); queries.push(String(url));
      if (init?.method === 'POST') { const body = JSON.parse(init.body as string); assert.equal(body.id, 'pose-test-0001'); return Response.json({ ok: true, id: body.id, duplicate: false }); }
      if (init?.method === 'DELETE') return Response.json({ ok: true });
      return String(url).includes('pose-test') ? Response.json({ result: record() }) : Response.json({ results: [record()] });
    };
    assert.equal((await savePoseResult(record())).id, record().id);
    assert.equal((await listPoseResults()).length, 1); assert.equal((await getPoseResult(record().id)).id, record().id);
    await deletePoseResult(record().id);
    assert.equal((await getPoseExportResults({ className: '10A1', studentName: 'Nguyễn', movementId: 'attention', assessment: 'pass', from: '2026-10-04', to: '2026-10-04', sort: 'score' })).length, 1);
    const url = new URL(queries.at(-1)!, 'http://localhost');
    assert.equal(url.pathname, '/api/pose-results/export'); assert.equal(url.searchParams.get('className'), '10A1');
    assert.equal(url.searchParams.get('from'), '2026-10-04T00:00:00.000+07:00'); assert.equal(url.searchParams.get('to'), '2026-10-04T23:59:59.999+07:00');
    assert.equal(poseResultQuery({}), '');
    globalThis.fetch = async () => Response.json({ error: 'Chỉ Admin được xuất.' }, { status: 403 });
    await assert.rejects(getPoseExportResults(), /Chỉ Admin được xuất/);
    globalThis.fetch = async () => { throw new Error('Offline'); };
    await assert.rejects(listPoseResults(), /Offline/);
  } finally { globalThis.fetch = original; }
});

test('save/delete require a positive server acknowledgement instead of trusting an HTTP 200 body', async () => {
  const original = globalThis.fetch;
  try {
    for (const body of [null, {}, { error: 'Storage unavailable' }, { ok: true }, { ok: true, id: 'different-attempt', duplicate: false }, { ok: true, id: record().id, duplicate: 'false' }]) {
      globalThis.fetch = async () => Response.json(body);
      await assert.rejects(savePoseResult(record()), /chưa xác nhận đã lưu đúng lượt/);
    }
    globalThis.fetch = async () => new Response('<html>Fallback page</html>', { status: 200 });
    await assert.rejects(savePoseResult(record()), /chưa xác nhận đã lưu đúng lượt/);
    for (const body of [null, {}, { error: 'Not deleted' }, { ok: false }]) {
      globalThis.fetch = async () => Response.json(body);
      await assert.rejects(deletePoseResult(record().id), /chưa xác nhận đã xóa/);
    }
  } finally { globalThis.fetch = original; }
});

test('Excel projection preserves sequence step scores and excludes incidental image/video/landmark data', () => {
  const source = record({ movementId: 'basicDrill', stepResults: ['attention', 'atEase', 'salute'].map((id, i) => ({
    movementId: id as 'attention' | 'atEase' | 'salute', movementLabel: id, score: 70 + i * 10, passed: true, assessment: 'pass', requiredCriteriaPassed: true,
    criteria: record().criteria, conciseFeedback: [],
  })) });
  Object.assign(source, { rawLandmarks: ['PRIVATE-LANDMARK'], image: 'PRIVATE-IMAGE', video: 'PRIVATE-VIDEO' });
  const rows = poseExcelRows([source]);
  assert.equal(rows[0].length, POSE_EXPORT_COLUMNS.length); assert.deepEqual(rows[0].slice(13, 16), [7, 8, 9]);
  assert.doesNotMatch(JSON.stringify(rows), /PRIVATE-|rawLandmarks|image|video/);
});

test('Excel required criteria retain recorded statuses instead of reclassifying with a 60 percent threshold', () => {
  const source = record({ criteria: [
    { id: 'direction', label: 'Hướng quay', points: 25, maximum: 25, statusLevel: 'PASS', required: true, feedback: 'Đạt' },
    { id: 'angle', label: 'Góc quay', points: 20, maximum: 25, statusLevel: 'NEEDS_ADJUSTMENT', required: true, feedback: 'Cần điều chỉnh' },
    { id: 'torso', label: 'Thân thẳng', points: 13, maximum: 20, statusLevel: 'NOT_ACHIEVED', required: true, feedback: 'Chưa đạt' },
    { id: 'feet', label: 'Bàn chân', points: 0, maximum: 5, statusLevel: 'NOT_SCORABLE', required: true, feedback: 'Chưa đủ dữ liệu' },
  ] });
  const row = poseExcelRows([source])[0];
  assert.equal(row[7], 'Hướng quay: Đạt; Góc quay: Cần điều chỉnh; Thân thẳng: Chưa đạt; Bàn chân: Chưa đủ dữ liệu');
  assert.equal(row[3], 8.5, 'export does not alter the overall score');
  assert.equal(row[4], 'Đạt', 'export does not change the stored overall conclusion');
});

test('management detail and Excel keep preparation and main scores separate without recomputing a combined score', () => {
  const prepared = record({ movementId: 'atEase', score: 75, preconditionResult: {
    movementId: 'attention', movementLabel: 'Đứng nghiêm', score: 90, passed: true, assessment: 'pass', requiredCriteriaPassed: true,
    criteria: record().criteria, conciseFeedback: [], quality: { confidence: .95, unassessedPoints: 0 },
  } });
  const row = poseExcelRows([prepared])[0];
  assert.equal(row[3], 7.5); assert.deepEqual(row.slice(-2), [9, 'Đạt']);
  const html = renderToStaticMarkup(React.createElement(PoseRecordDetail, { record: prepared }));
  assert.match(html, /Tiền đề — Đứng nghiêm/); assert.match(html, /Động tác chính/); assert.match(html, /7\.5/);
});

test('Admin export creates a readable workbook using only server-filtered rows and rechecks authorization', async () => {
  await assert.rejects(exportPoseResultsToExcel([record()], () => false), /Chỉ Admin/);
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  let blob: Blob | null = null, clicked = false, removed = false, filename = '';
  try {
    URL.createObjectURL = value => { blob = value as Blob; return 'blob:test'; };
    URL.revokeObjectURL = noop;
    Object.defineProperty(globalThis, 'document', { configurable: true, value: {
      body: { appendChild: noop }, createElement: () => ({ href: '', set download(value: string) { filename = value; }, click() { clicked = true; }, remove() { removed = true; } }),
    } });
    await exportPoseResultsToExcel([record({ studentName: '=1+1' })], () => true);
    assert.ok(clicked && removed && blob); assert.match(filename, /ket-qua-ai-pose-.*\.xlsx$/);
    const workbook = XLSX.read(await blob!.arrayBuffer(), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Ket_qua_AI_Pose, { header: 1 }) as unknown[][];
    assert.equal(rows.length, 2); assert.equal(rows[1][0], '=1+1'); assert.equal(rows[1][3], 8.5);
    assert.equal(workbook.Sheets.Ket_qua_AI_Pose.A2.t, 's'); assert.equal(workbook.Sheets.Ket_qua_AI_Pose.A2.f, undefined);
    clicked = false;
    let checks = 0;
    await assert.rejects(exportPoseResultsToExcel([record()], () => ++checks === 1), /Quyền xuất/);
    assert.equal(clicked, false);
    const cancellation = new AbortController();
    const pending = exportPoseResultsToExcel([record()], () => !cancellation.signal.aborted);
    cancellation.abort();
    await assert.rejects(pending, /Quyền xuất/);
    assert.equal(clicked, false, 'changing filters during the lazy XLSX import cancels the old download');
  } finally {
    URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke;
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument); else Reflect.deleteProperty(globalThis, 'document');
  }
});
