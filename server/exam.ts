import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import type { createAuth, PublicAccount } from './auth';

export function createExamRouter(directory: string, auth: ReturnType<typeof createAuth>) {
  const router = Router();
  router.use(auth.protectRequest, auth.requireUser);
  const file = path.join(directory, 'exam_results.jsonl');
  let queue = Promise.resolve();

  async function records(): Promise<any[]> {
    try {
      const content = await readFile(file, 'utf8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  // GET /api/exam/results - Lấy toàn bộ danh sách kết quả bài kiểm tra của học sinh
  router.get('/results', auth.requireExamManager, async (_req: Request, res: Response) => {
    try {
      const list = await records();
      // Sắp xếp mới nhất lên đầu
      list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      res.json({ results: list });
    } catch (error) {
      console.error('Error reading exam results:', error);
      res.status(500).json({ error: 'Không đọc được dữ liệu kết quả học sinh.' });
    }
  });

  // POST /api/exam/results - Lưu kết quả bài làm mới của học sinh
  router.post('/results', async (req: Request, res: Response) => {
    const data = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        (data.studentClass !== undefined && typeof data.studentClass !== 'string')) {
      return res.status(400).json({ error: 'Dữ liệu kết quả không hợp lệ.' });
    }

    const user: PublicAccount = res.locals.user;
    const record = {
      id: data.id || `res_${randomUUID().slice(0, 8)}`,
      sessionId: data.sessionId || `session_${Date.now()}`,
      studentId: user.id,
      studentUsername: user.username,
      studentName: user.name,
      studentClass: (data.studentClass || 'Chưa phân lớp').trim(),
      mode: data.mode || 'grade_10',
      format: data.format || 'full',
      timeLimitMinutes: data.timeLimitMinutes === 0 ? 0 : Number(data.timeLimitMinutes) || 45,
      examTypeTitle: data.examTypeTitle || 'Bài kiểm tra GDQP-AN',
      submittedAt: data.submittedAt || Date.now(),
      durationSpentSeconds: Number(data.durationSpentSeconds) || 0,
      score: Number(data.score) || 0,
      accuracyPercent: Number(data.accuracyPercent) || 0,
      xpGained: Number(data.xpGained) || 0,
      mcqScore: Number(data.mcqScore) || 0,
      tfScore: Number(data.tfScore) || 0,
      essayScore: Number(data.essayScore) || 0,
      totalQuestions: Number(data.totalQuestions) || 0,
      correctCount: Number(data.correctCount) || 0,
      details: Array.isArray(data.details) ? data.details : [],
      tfDetails: Array.isArray(data.tfDetails) ? data.tfDetails : [],
      essayDetails: Array.isArray(data.essayDetails) ? data.essayDetails : [],
    };

    const save = queue.then(async () => {
      await mkdir(directory, { recursive: true });
      await appendFile(file, JSON.stringify(record) + '\n', 'utf8');
      res.status(201).json({ ok: true, result: record });
    });

    queue = save.catch(() => {});
    try {
      await save;
    } catch (err) {
      console.error('Error saving exam result:', err);
      res.status(500).json({ error: 'Không thể lưu kết quả kiểm tra.' });
    }
  });

  // DELETE /api/exam/results/:id - Xóa một bản ghi kết quả bài thi
  router.delete('/results/:id', auth.requireExamManager, async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Thiếu mã bài thi cần xóa.' });
    }

    const job = queue.then(async () => {
      const all = await records();
      const filtered = all.filter(r => r.id !== id);
      if (filtered.length === all.length) {
        res.status(404).json({ error: 'Không tìm thấy kết quả bài thi.' });
        return;
      }
      await mkdir(directory, { recursive: true });
      const newContent = filtered.map(r => JSON.stringify(r)).join('\n') + (filtered.length > 0 ? '\n' : '');
      await writeFile(file, newContent, 'utf8');
      res.json({ ok: true, message: 'Đã xóa kết quả thành công.' });
    });

    queue = job.catch(() => {});
    try {
      await job;
    } catch (err) {
      console.error('Error deleting exam result:', err);
      res.status(500).json({ error: 'Không thể xóa kết quả bài thi.' });
    }
  });

  return router;
}
