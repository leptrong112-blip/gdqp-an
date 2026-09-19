import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import type { createAuth, PublicAccount } from './auth';
import { ALL_BANK_MCQ, ALL_BANK_TF, ALL_BANK_ESSAY } from '../src/data';

const mcqMap = new Map(ALL_BANK_MCQ.map(q => [q.id, q]));
const tfMap = new Map(ALL_BANK_TF.map(tf => [tf.id, tf]));
const essayMap = new Map(ALL_BANK_ESSAY.map(es => [es.id, es]));

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

    // Kiểm tra phạm vi điểm số hợp lệ
    const rawScore = Number(data.score);
    if (data.score !== undefined && (isNaN(rawScore) || rawScore < 0 || rawScore > 10)) {
      return res.status(400).json({ error: 'Điểm số không hợp lệ (phải từ 0 đến 10).' });
    }

    const rawAccuracy = Number(data.accuracyPercent);
    if (data.accuracyPercent !== undefined && (isNaN(rawAccuracy) || rawAccuracy < 0 || rawAccuracy > 100)) {
      return res.status(400).json({ error: 'Tỷ lệ chính xác không hợp lệ (0-100%).' });
    }

    const allowedModes = ['grade_10', 'grade_11', 'grade_12', 'all'];
    const mode = allowedModes.includes(data.mode) ? data.mode : 'grade_10';

    const allowedFormats = ['full', 'mcq', 'true_false', 'essay'];
    const format = allowedFormats.includes(data.format) ? data.format : 'full';

    const details = Array.isArray(data.details) ? data.details.slice(0, 100) : [];
    const tfDetails = Array.isArray(data.tfDetails) ? data.tfDetails.slice(0, 100) : [];
    const essayDetails = Array.isArray(data.essayDetails) ? data.essayDetails.slice(0, 50) : [];

    const user: PublicAccount = res.locals.user;
    const cleanId = typeof data.id === 'string' && data.id.trim() ? data.id.trim().slice(0, 100) : `res_${randomUUID().slice(0, 8)}`;
    const cleanSessionId = typeof data.sessionId === 'string' && data.sessionId.trim() ? data.sessionId.trim().slice(0, 100) : `session_${Date.now()}`;

    // Xác thực câu trả lời trắc nghiệm dựa trên ngân hàng câu hỏi gốc
    let verifiedMcqCorrect = 0;
    let matchedMcqQuestions = 0;
    for (const item of details) {
      if (!item || typeof item !== 'object') continue;
      const orig = mcqMap.get(item.questionId);
      if (orig) {
        matchedMcqQuestions++;
        const correctText = orig.options[orig.correctAnswer];
        const selectedText = Array.isArray(item.options) && typeof item.selectedOption === 'number' && item.selectedOption >= 0
          ? item.options[item.selectedOption]
          : '';
        const isCorrect = Boolean(selectedText && selectedText === correctText);
        item.isCorrect = isCorrect;
        item.correctOption = Array.isArray(item.options) ? item.options.indexOf(correctText) : orig.correctAnswer;
        item.explanation = orig.explanation;
        if (isCorrect) verifiedMcqCorrect++;
      }
    }

    // Xác thực câu hỏi Đúng / Sai theo barem chuẩn Bộ GD&ĐT
    let verifiedTfPoints = 0;
    let matchedTfQuestions = 0;
    for (const tfItem of tfDetails) {
      if (!tfItem || typeof tfItem !== 'object') continue;
      const origTf = tfMap.get(tfItem.questionId);
      if (origTf) {
        matchedTfQuestions++;
        let correctInQ = 0;
        if (Array.isArray(tfItem.items)) {
          for (const it of tfItem.items) {
            if (!it || typeof it !== 'object') continue;
            const origStatement = origTf.items.find(s => s.id === it.id);
            if (origStatement) {
              const isStatementCorrect = typeof it.userChoice === 'boolean' && it.userChoice === origStatement.isCorrect;
              it.isCorrect = isStatementCorrect;
              it.correctChoice = origStatement.isCorrect;
              it.explanation = origStatement.explanation;
              if (isStatementCorrect) correctInQ++;
            }
          }
        }
        const pts = correctInQ === 1 ? 0.1 : correctInQ === 2 ? 0.25 : correctInQ === 3 ? 0.5 : correctInQ === 4 ? 1.0 : 0;
        tfItem.earnedPoints = pts;
        tfItem.correctCount = correctInQ;
        verifiedTfPoints += pts;
      }
    }

    // Xác thực câu hỏi tự luận theo barem thang điểm
    let verifiedEssayScore = 0;
    let matchedEssayQuestions = 0;
    for (const activeEs of essayDetails) {
      if (!activeEs || typeof activeEs !== 'object') continue;
      const origEs = essayMap.get(activeEs.questionId);
      if (origEs) {
        matchedEssayQuestions++;
        const userText = typeof activeEs.userResponse === 'string' ? activeEs.userResponse.trim() : '';
        let est = 0;
        if (userText.length > 250) est = Number((origEs.maxScore * 0.85).toFixed(1));
        else if (userText.length > 100) est = Number((origEs.maxScore * 0.6).toFixed(1));
        else if (userText.length > 20) est = Number((origEs.maxScore * 0.3).toFixed(1));
        const cleanEst = Math.min(origEs.maxScore, Math.max(0, Number(activeEs.estimatedScore) || est));
        activeEs.estimatedScore = cleanEst;
        activeEs.rubric = origEs.rubric;
        activeEs.suggestedAnswer = origEs.suggestedAnswer;
        verifiedEssayScore += cleanEst;
      }
    }

    let score = isNaN(rawScore) ? 0 : Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10));
    let accuracyPercent = isNaN(rawAccuracy) ? 0 : Math.max(0, Math.min(100, Math.round(rawAccuracy)));
    let xpGained = Math.max(0, Math.min(1000, Math.round(Number(data.xpGained) || 0)));
    let mcqScore = Math.max(0, Math.min(10, Math.round((Number(data.mcqScore) || 0) * 10) / 10));
    let tfScore = Math.max(0, Math.min(10, Math.round((Number(data.tfScore) || 0) * 10) / 10));
    let essayScore = Math.max(0, Math.min(10, Math.round((Number(data.essayScore) || 0) * 10) / 10));
    let correctCount = Math.max(0, Math.min(500, Math.floor(Number(data.correctCount) || 0)));
    const totalQuestions = Math.max(0, Math.min(500, Math.floor(Number(data.totalQuestions) || (details.length + tfDetails.length + essayDetails.length))));

    // Chấm lại và kiểm soát điểm số phía Server nếu dữ liệu chứa câu hỏi từ ngân hàng đề thi
    if (matchedMcqQuestions > 0 || matchedTfQuestions > 0 || matchedEssayQuestions > 0) {
      let maxPossibleScore = 0;
      if (format === 'full') {
        const calcMcq = matchedMcqQuestions > 0 ? (verifiedMcqCorrect / matchedMcqQuestions) * 3.0 : 0;
        const calcTf = Math.min(4.0, verifiedTfPoints);
        const calcEssay = Math.min(3.0, verifiedEssayScore);
        mcqScore = Math.round(calcMcq * 10) / 10;
        tfScore = Math.round(calcTf * 10) / 10;
        essayScore = Math.round(calcEssay * 10) / 10;
        maxPossibleScore = Math.min(10, Math.round((mcqScore + tfScore + essayScore) * 10) / 10);
      } else if (format === 'mcq') {
        mcqScore = matchedMcqQuestions > 0 ? Math.round(((verifiedMcqCorrect / matchedMcqQuestions) * 10) * 10) / 10 : 0;
        maxPossibleScore = mcqScore;
      } else if (format === 'true_false') {
        const maxTf = matchedTfQuestions * 1.0;
        tfScore = Math.round(verifiedTfPoints * 10) / 10;
        maxPossibleScore = maxTf > 0 ? Math.min(10, Math.round((verifiedTfPoints / maxTf) * 100) / 10) : 0;
      } else if (format === 'essay') {
        const maxEs = matchedEssayQuestions * 2.5;
        essayScore = Math.round(verifiedEssayScore * 10) / 10;
        maxPossibleScore = maxEs > 0 ? Math.min(10, Math.round((verifiedEssayScore / maxEs) * 100) / 10) : 0;
      }

      // Giới hạn điểm số không bao giờ được vượt quá kết quả chấm thực tế trên máy chủ
      score = Math.min(score, maxPossibleScore);
      correctCount = verifiedMcqCorrect;
      accuracyPercent = Math.min(accuracyPercent, Math.round((score / 10) * 100));

      const baseXP = verifiedMcqCorrect * 10 + Math.round(verifiedTfPoints * 15) + Math.round(verifiedEssayScore * 10);
      const bonusXP = score >= 9.0 ? 50 : score >= 8.0 ? 30 : 0;
      xpGained = Math.min(xpGained, baseXP + bonusXP);
    }

    const record = {
      id: cleanId,
      sessionId: cleanSessionId,
      studentId: user.id,
      studentUsername: user.username,
      studentName: user.name,
      studentClass: (typeof data.studentClass === 'string' ? data.studentClass : 'Chưa phân lớp').trim().slice(0, 50),
      mode,
      format,
      timeLimitMinutes: data.timeLimitMinutes === 0 ? 0 : Math.max(0, Math.min(300, Number(data.timeLimitMinutes) || 45)),
      examTypeTitle: (typeof data.examTypeTitle === 'string' ? data.examTypeTitle : 'Bài kiểm tra GDQP-AN').trim().slice(0, 100),
      submittedAt: typeof data.submittedAt === 'number' && data.submittedAt > 0 ? data.submittedAt : Date.now(),
      durationSpentSeconds: Math.max(0, Math.min(86400, Math.floor(Number(data.durationSpentSeconds) || 0))),
      score,
      accuracyPercent,
      xpGained,
      mcqScore,
      tfScore,
      essayScore,
      totalQuestions,
      correctCount,
      details,
      tfDetails,
      essayDetails,
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
