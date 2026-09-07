export type ExamMode = "grade_10" | "grade_11" | "grade_12" | "all";
export type ExamStatus = "in_progress" | "submitted" | "expired";

// Câu hỏi trong phiên thi đang diễn ra (BẢO MẬT: KHÔNG CHỨA correctAnswer HAY explanation)
export interface ActiveExamQuestion {
  id: number;
  question: string;
  options: string[]; // 4 đáp án đã được xáo trộn vị trí
}

// Dữ liệu phiên thi lưu tạm trong localStorage ("gqd_active_exam_session_v1")
export interface ActiveExamSession {
  sessionId: string;
  mode: ExamMode;
  startedAt: number;          // Timestamp bắt đầu làm bài (ms)
  durationSeconds: number;    // Thời lượng làm bài (900s hoặc 1800s)
  questions: ActiveExamQuestion[];
  userAnswers: Record<number, number>; // questionId -> index lựa chọn (0..3)
  status: ExamStatus;
}

// Chi tiết 1 câu hỏi trong kết quả (chỉ có sau khi đã nộp bài)
export interface ExamAnswerDetail {
  questionId: number;
  question: string;
  options: string[];
  selectedOption: number;     // Index đáp án học sinh chọn (-1 nếu chưa chọn)
  correctOption: number;      // Index đáp án đúng
  isCorrect: boolean;
  explanation: string;        // Giải thích từ dữ liệu gốc quiz.ts
}

// Bản ghi kết quả lưu vào lịch sử thi ("gqd_exam_history_v1")
export interface ExamResultRecord {
  id: string;
  sessionId: string;
  mode: ExamMode;
  submittedAt: number;
  durationSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  score: number;              // Thang điểm 10
  accuracyPercent: number;
  xpGained: number;
  details: ExamAnswerDetail[];
}
