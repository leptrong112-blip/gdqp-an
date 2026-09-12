import {
  BANK_MCQ_10,
  BANK_MCQ_11,
  BANK_MCQ_12,
  ALL_BANK_MCQ,
  BANK_TF_10,
  BANK_TF_11,
  BANK_TF_12,
  ALL_BANK_TF,
  BANK_ESSAY_10,
  BANK_ESSAY_11,
  BANK_ESSAY_12,
  ALL_BANK_ESSAY,
} from "../data";
import {
  MultipleChoiceQuestion,
  TrueFalseQuestionSource,
  EssayQuestionSource,
} from "../types";
import {
  ActiveExamQuestion,
  ActiveTrueFalseQuestion,
  ActiveEssayQuestion,
  ActiveExamSession,
  ExamAnswerDetail,
  TrueFalseItemDetail,
  TrueFalseResultDetail,
  EssayResultDetail,
  ExamFormatMode,
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
 * Lấy danh sách câu hỏi theo khối lớp
 */
function getSourceDataByMode(mode: ExamMode) {
  let mcqList: MultipleChoiceQuestion[] = [];
  let tfList: TrueFalseQuestionSource[] = [];
  let essayList: EssayQuestionSource[] = [];

  if (mode === "grade_10") {
    mcqList = BANK_MCQ_10;
    tfList = BANK_TF_10;
    essayList = BANK_ESSAY_10;
  } else if (mode === "grade_11") {
    mcqList = BANK_MCQ_11;
    tfList = BANK_TF_11;
    essayList = BANK_ESSAY_11;
  } else if (mode === "grade_12") {
    mcqList = BANK_MCQ_12;
    tfList = BANK_TF_12;
    essayList = BANK_ESSAY_12;
  } else {
    // Mode "all": Gộp toàn bộ cả 3 khối lớp
    mcqList = ALL_BANK_MCQ;
    tfList = ALL_BANK_TF;
    essayList = ALL_BANK_ESSAY;
  }

  return { mcqList, tfList, essayList };
}

/**
 * Khởi tạo phiên làm bài thi mới (ActiveExamSession)
 * BẢO MẬT TUYỆT ĐỐI: Không chứa correctAnswer, isCorrect hay explanation trong phiên thi
 */
export function createExamSession(
  mode: ExamMode,
  format: ExamFormatMode = "full",
  options?: {
    studentName?: string;
    studentClass?: string;
    timeLimitMinutes?: number; // 15, 30, 45, hoặc 0 (tự do)
    examTypeTitle?: string;
  }
): ActiveExamSession {
  const { mcqList, tfList, essayList } = getSourceDataByMode(mode);

  let activeMcq: ActiveExamQuestion[] = [];
  let activeTf: ActiveTrueFalseQuestion[] = [];
  let activeEssay: ActiveEssayQuestion[] = [];

  const timeLimit = options?.timeLimitMinutes !== undefined ? options.timeLimitMinutes : (format === "full" ? 45 : 20);
  let durationSeconds = timeLimit === 0 ? 86400 : timeLimit * 60; // 0 = tự do không giới hạn thời gian (86400s)

  if (format === "full") {
    // Đề chuẩn Bộ GD&ĐT 3 Phần:
    // Căn chỉnh số lượng câu hỏi phù hợp với thời gian
    let mcqCount = 12;
    let tfCount = 4;
    let essayCount = 1;

    if (timeLimit === 15) {
      mcqCount = 8;
      tfCount = 2;
      essayCount = 0;
    } else if (timeLimit === 30) {
      mcqCount = 10;
      tfCount = 3;
      essayCount = 1;
    } else {
      mcqCount = mode === "all" ? 16 : 12;
      tfCount = 4;
      essayCount = 1;
    }

    const sampledMCQ = shuffleArray(mcqList).slice(0, mcqCount);
    activeMcq = sampledMCQ.map((q) => ({
      id: q.id,
      question: q.question,
      options: shuffleArray([...q.options]), // Đảo ngẫu nhiên vị trí các đáp án
      grade: q.grade,
      lesson: q.lesson,
    }));

    const sampledTF = shuffleArray(tfList).slice(0, tfCount);
    activeTf = sampledTF.map((tf) => ({
      id: tf.id,
      context: tf.context,
      items: tf.items.map((it) => ({
        id: it.id,
        statement: it.statement,
      })),
      grade: tf.grade,
      lesson: tf.lesson,
    }));

    if (essayCount > 0) {
      const sampledEssay = shuffleArray(essayList).slice(0, essayCount);
      activeEssay = sampledEssay.map((es) => ({
        id: es.id,
        prompt: es.prompt,
        maxScore: es.maxScore,
        grade: es.grade,
        lesson: es.lesson,
        rubric: es.rubric,
      }));
    }
  } else if (format === "mcq") {
    // Chuyên đề Phần 1: Trắc nghiệm ABCD
    let targetCount = 15;
    if (timeLimit === 15) targetCount = 12;
    else if (timeLimit === 30) targetCount = 20;
    else if (timeLimit >= 45 || timeLimit === 0) targetCount = mode === "all" ? 30 : 25;

    const sampledMCQ = shuffleArray(mcqList).slice(0, targetCount);
    activeMcq = sampledMCQ.map((q) => ({
      id: q.id,
      question: q.question,
      options: shuffleArray([...q.options]),
      grade: q.grade,
      lesson: q.lesson,
    }));
  } else if (format === "true_false") {
    // Chuyên đề Phần 2: Đúng / Sai
    let tfCount = 5;
    if (timeLimit === 15) tfCount = 3;
    else if (timeLimit === 30) tfCount = 6;
    else if (timeLimit >= 45 || timeLimit === 0) tfCount = 8;

    const sampledTF = shuffleArray(tfList).slice(0, tfCount);
    activeTf = sampledTF.map((tf) => ({
      id: tf.id,
      context: tf.context,
      items: tf.items.map((it) => ({
        id: it.id,
        statement: it.statement,
      })),
      grade: tf.grade,
      lesson: tf.lesson,
    }));
  } else if (format === "essay") {
    // Chuyên đề Phần 3: Tự luận
    let essayCount = timeLimit === 15 ? 1 : 2;
    const sampledEssay = shuffleArray(essayList).slice(0, essayCount);

    activeEssay = sampledEssay.map((es) => ({
      id: es.id,
      prompt: es.prompt,
      maxScore: es.maxScore,
      grade: es.grade,
      lesson: es.lesson,
      rubric: es.rubric,
    }));
  }

  const session: ActiveExamSession = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    mode,
    format,
    studentName: options?.studentName || "Học sinh",
    studentClass: options?.studentClass || "10A1",
    timeLimitMinutes: timeLimit,
    examTypeTitle: options?.examTypeTitle || (timeLimit === 0 ? "Luyện tập tự do" : `Đề kiểm tra ${timeLimit} phút`),
    startedAt: Date.now(),
    durationSeconds,
    questions: activeMcq,
    userAnswers: {},
    tfQuestions: activeTf,
    tfAnswers: {},
    essayQuestions: activeEssay,
    essayAnswers: {},
    status: "in_progress",
  };

  saveActiveSession(session);
  return session;
}

/**
 * Lưu phiên thi đang diễn ra vào localStorage
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
 * Xóa phiên thi active sau khi đã hoàn thành hoặc hủy bỏ
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {
    console.error("Lỗi khi xóa ActiveExamSession:", e);
  }
}

/**
 * Quy chế chấm điểm trắc nghiệm Đúng/Sai của Bộ GD&ĐT (Chương trình GDPT 2018):
 * - Thí sinh chọn đúng 1 ý trong 1 câu: 0.10 điểm
 * - Thí sinh chọn đúng 2 ý trong 1 câu: 0.25 điểm
 * - Thí sinh chọn đúng 3 ý trong 1 câu: 0.50 điểm
 * - Thí sinh chọn đúng cả 4 ý trong 1 câu: 1.00 điểm
 */
export function calculateMoetTrueFalsePoints(numCorrect: number): number {
  switch (numCorrect) {
    case 1:
      return 0.1;
    case 2:
      return 0.25;
    case 3:
      return 0.5;
    case 4:
      return 1.0;
    default:
      return 0.0;
  }
}

/**
 * Chấm điểm bài thi tổng thể dựa trên dữ liệu gốc của Ngân hàng câu hỏi
 */
export function evaluateExam(session: ActiveExamSession): ExamResultRecord {
  // 1. CHẤM PHẦN I: TRẮC NGHIỆM ABCD
  const mcqMap = new Map<number, MultipleChoiceQuestion>();
  ALL_BANK_MCQ.forEach((q) => mcqMap.set(q.id, q));

  let mcqCorrectCount = 0;
  const mcqDetails: ExamAnswerDetail[] = [];

  const sessionQuestions = session.questions || [];
  sessionQuestions.forEach((activeQ) => {
    const origQ = mcqMap.get(activeQ.id);
    if (!origQ) return;

    const correctText = origQ.options[origQ.correctAnswer];
    const selectedIdx = session.userAnswers ? session.userAnswers[activeQ.id] ?? -1 : -1;
    const selectedText = selectedIdx >= 0 ? activeQ.options[selectedIdx] : "";

    const isCorrect = selectedText === correctText;
    if (isCorrect) mcqCorrectCount++;

    const correctOptionInActive = activeQ.options.indexOf(correctText);

    mcqDetails.push({
      questionId: activeQ.id,
      question: activeQ.question,
      options: activeQ.options,
      selectedOption: selectedIdx,
      correctOption: correctOptionInActive >= 0 ? correctOptionInActive : 0,
      isCorrect,
      explanation: origQ.explanation,
    });
  });

  // 2. CHẤM PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (THEO CHUẨN BỘ GD&ĐT)
  const tfMap = new Map<number, TrueFalseQuestionSource>();
  ALL_BANK_TF.forEach((tf) => tfMap.set(tf.id, tf));

  let tfTotalEarnedPoints = 0;
  let tfCorrectStatementsCount = 0;
  const tfDetails: TrueFalseResultDetail[] = [];

  const sessionTf = session.tfQuestions || [];
  sessionTf.forEach((activeTfQ) => {
    const origTf = tfMap.get(activeTfQ.id);
    if (!origTf) return;

    const userAnswersForQ = session.tfAnswers ? session.tfAnswers[activeTfQ.id] || {} : {};
    let countCorrectInQuestion = 0;

    const itemsDetail: TrueFalseItemDetail[] = origTf.items.map((origItem) => {
      const userVal = userAnswersForQ[origItem.id];
      const hasAnswered = typeof userVal === "boolean";
      const isItemCorrect = hasAnswered && userVal === origItem.isCorrect;

      if (isItemCorrect) {
        countCorrectInQuestion++;
        tfCorrectStatementsCount++;
      }

      return {
        id: origItem.id,
        statement: origItem.statement,
        userChoice: hasAnswered ? userVal : null,
        correctChoice: origItem.isCorrect,
        isCorrect: isItemCorrect,
        explanation: origItem.explanation,
      };
    });

    const earnedPoints = calculateMoetTrueFalsePoints(countCorrectInQuestion);
    tfTotalEarnedPoints += earnedPoints;

    tfDetails.push({
      questionId: activeTfQ.id,
      context: activeTfQ.context,
      items: itemsDetail,
      correctCount: countCorrectInQuestion,
      earnedPoints,
      maxPoints: 1.0,
    });
  });

  // 3. TỰ LUẬN (PHẦN III):
  const essayMap = new Map<number, EssayQuestionSource>();
  ALL_BANK_ESSAY.forEach((es) => essayMap.set(es.id, es));

  const essayDetails: EssayResultDetail[] = [];
  let essayTotalScore = 0;

  const sessionEssay = session.essayQuestions || [];
  sessionEssay.forEach((activeEs) => {
    const origEs = essayMap.get(activeEs.id);
    if (!origEs) return;

    const userText = session.essayAnswers ? session.essayAnswers[activeEs.id] || "" : "";
    const trimmed = userText.trim();
    
    // Ước tính điểm tự luận sơ bộ dựa trên dung lượng và độ hoàn chỉnh bài viết
    let estimatedScore = 0;
    if (trimmed.length > 250) {
      estimatedScore = Number((origEs.maxScore * 0.85).toFixed(1)); // Đạt yêu cầu đầy đủ
    } else if (trimmed.length > 100) {
      estimatedScore = Number((origEs.maxScore * 0.6).toFixed(1)); // Đạt tương đối
    } else if (trimmed.length > 20) {
      estimatedScore = Number((origEs.maxScore * 0.3).toFixed(1)); // Có làm bài
    }

    essayTotalScore += estimatedScore;

    essayDetails.push({
      questionId: activeEs.id,
      prompt: activeEs.prompt,
      userResponse: userText,
      maxScore: origEs.maxScore,
      rubric: origEs.rubric,
      suggestedAnswer: origEs.suggestedAnswer,
      estimatedScore,
    });
  });

  // 4. TÍNH ĐIỂM TỔNG HỢP THEO FORMAT
  let finalScore = 0;
  let accuracyPercent = 0;
  let mcqScore = 0;
  let tfScore = tfTotalEarnedPoints;

  const totalMcq = sessionQuestions.length;
  const totalTf = sessionTf.length;
  const totalEssay = sessionEssay.length;

  if (session.format === "full") {
    // Đề chuẩn Bộ GD&ĐT:
    // Phần I: Tối đa 3.0 điểm (12 câu -> mỗi câu 0.25đ)
    // Phần II: Tối đa 4.0 điểm (4 câu -> mỗi câu 1.0đ)
    // Phần III: Tối đa 3.0 điểm (1 câu tự luận)
    // Tổng = 10.0 điểm
    const mcqRatio = totalMcq > 0 ? (mcqCorrectCount / totalMcq) * 3.0 : 0;
    mcqScore = Math.round(mcqRatio * 10) / 10;
    tfScore = Math.round(tfTotalEarnedPoints * 10) / 10;
    
    finalScore = Math.min(10, Math.round((mcqScore + tfScore + essayTotalScore) * 10) / 10);
    accuracyPercent = Math.round((finalScore / 10) * 100);
  } else if (session.format === "mcq") {
    // Chuyên đề MCQ: Thang 10
    mcqScore = totalMcq > 0 ? Math.round(((mcqCorrectCount / totalMcq) * 10) * 10) / 10 : 0;
    finalScore = mcqScore;
    accuracyPercent = Math.round((mcqCorrectCount / (totalMcq || 1)) * 100);
  } else if (session.format === "true_false") {
    // Chuyên đề Đúng/Sai: Thang 10 (tổng điểm / số câu * 10/số câu)
    const maxTf = totalTf * 1.0;
    tfScore = Math.round(tfTotalEarnedPoints * 10) / 10;
    finalScore = maxTf > 0 ? Math.min(10, Math.round((tfTotalEarnedPoints / maxTf) * 100) / 10) : 0;
    accuracyPercent = Math.round((finalScore / 10) * 100);
  } else if (session.format === "essay") {
    // Chuyên đề Tự luận: Thang 10
    const maxEs = sessionEssay.reduce((sum, e) => sum + e.maxScore, 0);
    finalScore = maxEs > 0 ? Math.min(10, Math.round((essayTotalScore / maxEs) * 100) / 10) : 0;
    accuracyPercent = Math.round((finalScore / 10) * 100);
  }

  // 5. TÍNH ĐIỂM THƯỞNG XP CHO GAMIFICATION
  const baseXP = mcqCorrectCount * 10 + Math.round(tfTotalEarnedPoints * 15) + Math.round(essayTotalScore * 10);
  const bonusXP = finalScore >= 9.0 ? 50 : finalScore >= 8.0 ? 30 : 0;
  const xpGained = baseXP + bonusXP;

  const durationSpentSeconds = Math.min(
    session.durationSeconds,
    Math.max(1, Math.floor((Date.now() - session.startedAt) / 1000))
  );

  const resultRecord: ExamResultRecord = {
    id: `exam_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId: session.sessionId,
    mode: session.mode,
    format: session.format,
    studentName: session.studentName || "Học sinh",
    studentClass: session.studentClass || "10A1",
    timeLimitMinutes: session.timeLimitMinutes || Math.round(session.durationSeconds / 60),
    examTypeTitle: session.examTypeTitle || "Bài kiểm tra GDQP-AN",
    submittedAt: Date.now(),
    durationSpentSeconds,
    totalQuestions: totalMcq + totalTf + totalEssay,
    correctCount: mcqCorrectCount,
    score: finalScore,
    accuracyPercent,
    xpGained,
    mcqScore,
    tfScore,
    essayScore: essayTotalScore,
    details: mcqDetails,
    tfDetails,
    essayDetails,
  };

  saveExamHistory(resultRecord);
  clearActiveSession();

  // Tự động gửi kết quả lên máy chủ để Giáo viên và Admin quản lý
  submitExamResultToServer(resultRecord).catch(err => {
    window.alert(`${err.message} Kết quả vẫn được lưu trong lịch sử trên thiết bị này.`);
  });

  return resultRecord;
}

/**
 * Lưu kết quả vào lịch sử thi (tối đa 10 lượt gần nhất)
 */
export function saveExamHistory(record: ExamResultRecord): void {
  try {
    const history = loadExamHistory();
    const updated = [record, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Lỗi khi lưu Exam History:", e);
  }
}

/**
 * Tải lịch sử thi từ localStorage
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

/**
 * Gửi kết quả bài kiểm tra lên máy chủ để Giáo viên & Admin quản lý
 */
export async function submitExamResultToServer(record: ExamResultRecord): Promise<boolean> {
    const { studentName, studentId, studentUsername, ...payload } = record;
    await examApi("/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
}

async function examApi(route: string, options?: RequestInit) {
  const res = await fetch(`/api/exam${route}`, { ...options, credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event('gdqp-session-expired'));
    throw new Error(data.error || 'Không thực hiện được yêu cầu kết quả thi.');
  }
  return data;
}

/**
 * Lấy danh sách kết quả bài kiểm tra từ máy chủ (phục vụ Admin/Giáo viên)
 */
export async function fetchExamResultsFromServer(): Promise<ExamResultRecord[]> {
  const data = await examApi('/results');
  return data.results || [];
}

/**
 * Xóa kết quả bài kiểm tra trên máy chủ
 */
export async function deleteExamResultOnServer(id: string): Promise<boolean> {
    await examApi(`/results/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return true;
}
