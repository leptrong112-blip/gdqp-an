import { createHash } from 'node:crypto';
import { filterPoseResults, parsePoseResultFilters, parsePoseResultSubmission, type PoseResultRecord } from '../src/features/pose-analysis/results/poseResultTypes';
import { createPoseSubmissionLimiter, POSE_RESULT_BODY_LIMIT, POSE_RESULT_LIST_LIMIT } from '../server/poseResultPolicy';

type Viewer = { role: 'admin' | 'teacher' | 'student' };
interface PoseResultRow {
  id: string; student_name: string; class_name: string; movement_id: string; movement_label: string;
  score: number; passed: number; assessment: string; required_passed: number | null;
  criteria_json: string; feedback_json: string; quality_json: string | null; step_results_json: string | null;
  started_at: string; finished_at: string; processing_latency_ms: number | null; rubric_version: string; created_at: string;
}
const json = (value: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }
});
const allowSubmission = createPoseSubmissionLimiter();
const columns = `id, student_name, class_name, movement_id, movement_label, score, passed, assessment, required_passed,
  criteria_json, feedback_json, quality_json, step_results_json, started_at, finished_at, processing_latency_ms, rubric_version, created_at`;
function recordFor(row: PoseResultRow): PoseResultRecord {
  const sequence = row.step_results_json ? JSON.parse(row.step_results_json) : null;
  const record = parsePoseResultSubmission({
    id: row.id, studentName: row.student_name, className: row.class_name, movementId: row.movement_id, movementLabel: row.movement_label,
    score: row.score, passed: Boolean(row.passed), assessment: row.assessment, requiredCriteriaPassed: row.required_passed === null ? null : Boolean(row.required_passed),
    criteria: JSON.parse(row.criteria_json), conciseFeedback: JSON.parse(row.feedback_json),
    ...(row.quality_json ? { quality: JSON.parse(row.quality_json) } : {}),
    ...(Array.isArray(sequence) ? { stepResults: sequence } : sequence ?? {}),
    startedAt: row.started_at, finishedAt: row.finished_at, processingLatencyMs: row.processing_latency_ms, rubricVersion: row.rubric_version
  });
  if (!record) throw new Error('POSE_RESULT_STORAGE_INVALID');
  return { ...record, createdAt: row.created_at };
}
/** Uses the existing account session resolver; all result reads remain authenticated. */
export async function poseResultsApi(request: Request, env: Env, userFor: (request: Request, env: Env) => Promise<Viewer | null>): Promise<Response> {
  const url = new URL(request.url), method = request.method.toUpperCase();
  const route = url.pathname.slice('/api/pose-results'.length) || '/';
  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin && origin !== env.APP_URL) || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Yêu cầu không hợp lệ.' }, 403);
  const isCollection = route === '/' || route === '';
  if (method === 'POST' && isCollection) {
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return json({ error: 'Yêu cầu không hợp lệ.' }, 403);
    const clientKey = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!allowSubmission(clientKey)) return json({ error: 'Đã gửi nhiều lượt quá nhanh. Vui lòng thử lại sau.' }, 429, { 'Retry-After': '600' });
    if (Number(request.headers.get('content-length')) > POSE_RESULT_BODY_LIMIT) return json({ error: 'Dữ liệu kết quả AI Pose quá lớn.' }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > POSE_RESULT_BODY_LIMIT) return json({ error: 'Dữ liệu kết quả AI Pose quá lớn.' }, 413);
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return json({ error: 'Dữ liệu kết quả AI Pose không hợp lệ.' }, 400); }
    const result = parsePoseResultSubmission(input);
    if (!result) return json({ error: 'Dữ liệu kết quả AI Pose chưa hoàn tất hoặc không hợp lệ.' }, 400);
    const hash = createHash('sha256').update(JSON.stringify(result)).digest('hex');
    const saved = await env.DB.prepare(`INSERT INTO pose_results
      (${columns}, content_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING`).bind(result.id, result.studentName, result.className, result.movementId, result.movementLabel,
      result.score, Number(result.passed), result.assessment, result.requiredCriteriaPassed === null ? null : Number(result.requiredCriteriaPassed),
      JSON.stringify(result.criteria), JSON.stringify(result.conciseFeedback), result.quality ? JSON.stringify(result.quality) : null,
      result.preconditionResult ? JSON.stringify({ preconditionResult: result.preconditionResult }) : result.stepResults ? JSON.stringify(result.stepResults) : null,
      result.startedAt, result.finishedAt, result.processingLatencyMs, result.rubricVersion,
      new Date().toISOString(), hash).run();
    const duplicate = !saved.meta.changes;
    if (duplicate) {
      const previous = await env.DB.prepare('SELECT content_hash FROM pose_results WHERE id = ?').bind(result.id).first<{ content_hash: string }>();
      if (!previous || previous.content_hash !== hash) return json({ error: 'Mã lượt thực hiện đã được dùng cho một kết quả khác.' }, 409);
    }
    return json({ ok: true, id: result.id, duplicate }, duplicate ? 200 : 201);
  }
  const user = await userFor(request, env);
  if (!user) return json({ error: 'Vui lòng đăng nhập tài khoản.' }, 401);
  const adminAction = route === '/export' || method === 'DELETE';
  if (adminAction && user.role !== 'admin') return json({ error: 'Chỉ Admin được xuất hoặc xóa kết quả AI Pose.' }, 403);
  if (!adminAction && !['teacher', 'admin'].includes(user.role)) return json({ error: 'Chỉ giáo viên và Admin được xem kết quả AI Pose.' }, 403);
  if (method === 'GET' && (isCollection || route === '/export')) {
    const filters = parsePoseResultFilters(url.searchParams);
    // Keep SQL bounded while retaining Unicode name filtering in the shared helper.
    const where: string[] = [], values: string[] = [];
    for (const [column, value, operator] of [
      ['movement_id', filters.movementId, '='], ['assessment', filters.assessment, '='],
      ['finished_at', filters.from, '>='], ['finished_at', filters.to, '<=']
    ]) if (value) { where.push(`${column} ${operator} ?`); values.push(value); }
    const query = `SELECT ${columns} FROM pose_results${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY finished_at DESC LIMIT ${POSE_RESULT_LIST_LIMIT + 1}`;
    const selected = await env.DB.prepare(query).bind(...values).all<PoseResultRow>();
    if (selected.results.length > POSE_RESULT_LIST_LIMIT) return json({ error: 'Có quá nhiều kết quả. Vui lòng thu hẹp khoảng thời gian hoặc động tác.' }, 413);
    return json({ results: filterPoseResults(selected.results.map(recordFor), filters) });
  }
  const idMatch = route.match(/^\/([a-zA-Z0-9_-]{8,100})$/);
  if (idMatch && method === 'GET') {
    const row = await env.DB.prepare(`SELECT ${columns} FROM pose_results WHERE id = ?`).bind(idMatch[1]).first<PoseResultRow>();
    return row ? json({ result: recordFor(row) }) : json({ error: 'Không tìm thấy kết quả AI Pose.' }, 404);
  }
  if (idMatch && method === 'DELETE') {
    const deleted = await env.DB.prepare('DELETE FROM pose_results WHERE id = ?').bind(idMatch[1]).run();
    return deleted.meta.changes ? json({ ok: true }) : json({ error: 'Không tìm thấy kết quả AI Pose.' }, 404);
  }
  return json({ error: 'Không tìm thấy API kết quả AI Pose.' }, 404);
}
