import { Router, type Request, type Response, type NextFunction } from 'express';
import { mkdir, readFile, appendFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import type { createAuth } from './auth';
import { filterPoseResults, parsePoseResultFilters, parsePoseResultSubmission, type PoseResultRecord } from '../src/features/pose-analysis/results/poseResultTypes';
import { createPoseSubmissionLimiter, POSE_RESULT_BODY_LIMIT, POSE_RESULT_LIST_LIMIT } from './poseResultPolicy';

export function createPoseResultsRouter(directory: string, auth: ReturnType<typeof createAuth>) {
  const router = Router();
  const file = path.join(directory, 'pose_results.jsonl');
  let queue = Promise.resolve();
  const allowSubmission = createPoseSubmissionLimiter();
  router.use(auth.protectRequest);
  const requireManager = (req: Request, res: Response, next: NextFunction) => auth.requireUser(req, res, () => {
    if (!['teacher', 'admin'].includes(res.locals.user.role)) return res.status(403).json({ error: 'Chỉ giáo viên và Admin được xem kết quả AI Pose.' });
    next();
  });
  async function readRecords(): Promise<PoseResultRecord[]> {
    let content: string;
    try { content = await readFile(file, 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
    return content.split('\n').filter(line => line.trim()).map(line => {
      const saved = JSON.parse(line);
      const validated = parsePoseResultSubmission(saved);
      if (!validated || typeof saved.createdAt !== 'string') throw new Error('POSE_RESULT_STORAGE_INVALID');
      return { ...validated, createdAt: saved.createdAt };
    });
  }
  const reportError = (res: Response) => res.status(500).json({ error: 'Chưa đọc/lưu được kết quả AI Pose. Vui lòng thử lại.' });
  router.post('/', async (req, res) => {
    if (req.headers['sec-fetch-site'] === 'cross-site' || !req.is('application/json')) return res.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
    if (!allowSubmission(req.ip || req.socket.remoteAddress || 'unknown')) return res.status(429).setHeader('Retry-After', '600').json({ error: 'Đã gửi nhiều lượt quá nhanh. Vui lòng thử lại sau.' });
    if (Buffer.byteLength(JSON.stringify(req.body) || '', 'utf8') > POSE_RESULT_BODY_LIMIT) return res.status(413).json({ error: 'Dữ liệu kết quả AI Pose quá lớn.' });
    const submission = parsePoseResultSubmission(req.body);
    if (!submission) return res.status(400).json({ error: 'Dữ liệu kết quả AI Pose chưa hoàn tất hoặc không hợp lệ.' });
    const job = queue.then(async () => {
      const records = await readRecords();
      const existing = records.find(record => record.id === submission.id);
      if (existing) {
        const { createdAt: _, ...previous } = existing;
        if (JSON.stringify(previous) !== JSON.stringify(submission)) return res.status(409).json({ error: 'Mã lượt thực hiện đã được dùng cho một kết quả khác.' });
        return res.json({ ok: true, id: submission.id, duplicate: true });
      }
      await mkdir(directory, { recursive: true });
      await appendFile(file, `${JSON.stringify({ ...submission, createdAt: new Date().toISOString() })}\n`, { encoding: 'utf8', mode: 0o600 });
      return res.status(201).json({ ok: true, id: submission.id, duplicate: false });
    });
    queue = job.then(() => {}, () => {});
    try { await job; } catch { reportError(res); }
  });
  const list = async (req: Request, res: Response) => {
    try {
      await queue;
      const params = new URL(req.originalUrl, 'http://local.invalid').searchParams;
      const results = filterPoseResults(await readRecords(), parsePoseResultFilters(params));
      if (results.length > POSE_RESULT_LIST_LIMIT) return res.status(413).json({ error: 'Có quá nhiều kết quả. Vui lòng thu hẹp bộ lọc.' });
      return res.json({ results });
    } catch { return reportError(res); }
  };
  router.get('/export', auth.requireAdmin, list);
  router.get('/', requireManager, list);
  router.get('/:id', requireManager, async (req, res) => {
    try {
      await queue;
      const result = (await readRecords()).find(record => record.id === req.params.id);
      return result ? res.json({ result }) : res.status(404).json({ error: 'Không tìm thấy kết quả AI Pose.' });
    } catch { return reportError(res); }
  });
  router.delete('/:id', auth.requireAdmin, async (req, res) => {
    const job = queue.then(async () => {
      const records = await readRecords(), kept = records.filter(record => record.id !== req.params.id);
      if (kept.length === records.length) return res.status(404).json({ error: 'Không tìm thấy kết quả AI Pose.' });
      await mkdir(directory, { recursive: true });
      const temporary = file + '.tmp';
      await writeFile(temporary, kept.map(record => JSON.stringify(record)).join('\n') + (kept.length ? '\n' : ''), { encoding: 'utf8', mode: 0o600 });
      await rename(temporary, file);
      return res.json({ ok: true });
    });
    queue = job.then(() => {}, () => {});
    try { await job; } catch { reportError(res); }
  });
  return router;
}
