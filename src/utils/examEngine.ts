import { GDQP_QUIZZES } from "../data";
import { QuizQuestion } from "../types";
import {
  ActiveExamQuestion,
  ActiveExamSession,
  ExamAnswerDetail,
  ExamMode,
  ExamResultRecord,
} from "../types/exam";

const ACTIVE_SESSION_KEY = "gqd_active_exam_session_v1";
const HISTORY_KEY = "gqd_exam_history_v1";
const MAX_HISTORY_ITEMS = 10;

/**
 * Hàm xáo trộn mảng Fisher-Yates (Thao tác trên bản sao, KHÔNG mutate mảng gốc)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Khởi tạo phiên làm bài thi mới (ActiveExamSession)
 * BẢO MẬT: Tuyệt đối không chứa correctAnswer hay explanation trong Active Session
 */
export function createExamSession(mode: ExamMode): ActiveExamSession {
  let sourceQuestions: QuizQuestion[] = [];
  let durationSeconds = 900; // Mặc định theo lớp: 15 phút (900s)

  if (mode === "grade_10") {
    sourceQuestions = GDQP_QUIZZES[10] || [];
  } else if (mode === "grade_11") {
    sourceQuestions = GDQP_QUIZZES[11] || [];
  } else if (mode === "grade_12") {
    sourceQuestions = GDQP_QUIZZES[12] || [];
  } else {
    // Mode "all": Gộp toàn bộ 24 câu hỏi từ cả 3 khối lớp
    sourceQuestions = [
      ...(GDQP_QUIZZES[10] || []),
      ...(GDQP_QUIZZES[11] || []),
      ...(GDQP_QUIZZES[12] || []),
    ];
    durationSeconds = 1800; // Đề tổng hợp: 30 phút (1800s)
  }

  // Shuffle thứ tự các câu hỏi
  const shuffledQuestions = shuffleArray(sourceQuestions);

  // Tạo các ActiveExamQuestion (chỉ bao gồm id, question, options đã đảo)
  const questions: ActiveExamQuestion[] = shuffledQuestions.map((q) => ({
    id: q.id,
    question: q.question,
    options: shuffleArray([...q.options]), // Đảo vị trí 4 đáp án
  }));

  const session: ActiveExamSession = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    mode,
    startedAt: Date.now(),
    durationSeconds,
    questions,
    userAnswers: {},
    status: "in_progress",
  };

  saveActiveSession(session);
  return session;
}

/**
 * Lưu phiên thi đang diễn ra vào localStorage (try/catch an toàn)
 */
export function saveActiveSession(session: ActiveExamSession): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Lỗi khi lưu ActiveExamSession:", e);
  }
}

/**
 * Tải phiên thi đang diễn ra từ localStorage
 */
export function loadActiveSession(): ActiveExamSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveExamSession;
  } catch (e) {
    console.error("Lỗi khi tải ActiveExamSession:", e);
    return null;
  }
}

/**
 * Xóa phiên thi active sau khi đã hoàn thành hoặc hết hiệu lực
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {
    console.error("Lỗi khi xóa ActiveExamSession:", e);
  }
}

/**
 * Chấm điểm bài thi dựa trên Answer Identity (Đối chiếu trực tiếp với dữ liệu gốc quiz.ts)
 * Thang điểm 10, tính XP tương thích, xuất chi tiết kết quả kèm giải thích
 */
export function evaluateExam(session: ActiveExamSession): ExamResultRecord {
  // Tìm lại tất cả câu hỏi gốc từ quiz.ts
  const allOriginalQuestions: QuizQuestion[] = [
    ...(GDQP_QUIZZES[10] || []),
    ...(GDQP_QUIZZES[11] || []),
    ...(GDQP_QUIZZES[12] || []),
  ];

  const originalMap = new Map<number, QuizQuestion>();
  allOriginalQuestions.forEach((q) => originalMap.set(q.id, q));

  let correctCount = 0;
  const details: ExamAnswerDetail[] = [];

  session.questions.forEach((activeQ) => {
    const origQ = originalMap.get(activeQ.id);
    if (!origQ) return;

    const correctText = origQ.options[origQ.correctAnswer];
    const selectedIdx = session.userAnswers[activeQ.id] ?? -1;
    const selectedText = selectedIdx >= 0 ? activeQ.options[selectedIdx] : "";

    const isCorrect = selectedText === correctText;
    if (isCorrect) correctCount++;

    // Tìm vị trí đáp án đúng trong mảng options đã shuffle của activeQ
    const correctOptionInActive = activeQ.options.indexOf(correctText);

    details.push({
      questionId: activeQ.id,
      question: activeQ.question,
      options: activeQ.options,
      selectedOption: selectedIdx,
      correctOption: correctOptionInActive >= 0 ? correctOptionInActive : 0,
      isCorrect,
      explanation: origQ.explanation,
    });
  });

  const totalQuestions = session.questions.length;
  const rawScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 10 : 0;
  const score = Math.round(rawScore * 10) / 10; // Làm tròn 1 chữ số thập phân
  const accuracyPercent = Math.round((correctCount / (totalQuestions || 1)) * 100);

  // Tính XP tương thích: 10 XP mỗi câu đúng + 50 XP bonus nếu 100% điểm
  const xpFromCorrect = correctCount * 10;
  const xpBonus = accuracyPercent === 100 ? 50 : 0;
  const xpGained = xpFromCorrect + xpBonus;

  const durationSpentSeconds = Math.min(
    session.durationSeconds,
    Math.max(1, Math.floor((Date.now() - session.startedAt) / 1000))
  );

  const resultRecord: ExamResultRecord = {
    id: `exam_rec_${Date.now()}`,
    sessionId: session.sessionId,
    mode: session.mode,
    submittedAt: Date.now(),
    durationSpentSeconds,
    totalQuestions,
    correctCount,
    score,
    accuracyPercent,
    xpGained,
    details,
  };

  // Lưu lịch sử thi & dọn dẹp active session
  saveExamHistory(resultRecord);
  clearActiveSession();

  return resultRecord;
}

/**
 * Lưu bản ghi kết quả thi vào lịch sử gqd_exam_history_v1 (Tối đa 10 lượt thi gần nhất)
 */
export function saveExamHistory(record: ExamResultRecord): void {
  try {
    const history = loadExamHistory();
    // Giữ tối đa 10 lượt thi gần nhất (đưa bản ghi mới lên đầu)
    const updated = [record, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Lỗi khi lưu Exam History:", e);
  }
}

/**
 * Lấy danh sách lịch sử thi từ localStorage
 */
export function loadExamHistory(): ExamResultRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExamResultRecord[];
  } catch (e) {
    console.error("Lỗi khi tải Exam History:", e);
    return [];
  }
}
