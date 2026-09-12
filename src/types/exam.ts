export type ExamMode = "grade_10" | "grade_11" | "grade_12" | "all";
export type ExamFormatMode = "full" | "mcq" | "true_false" | "essay";
export type ExamStatus = "in_progress" | "submitted" | "expired";

// ==========================================
// 1. DỮ LIỆU CÂU HỎI TRONG PHIÊN THI ĐANG LÀM
// (BẢO MẬT: Tuyệt đối không chứa đáp án đúng hay giải thích)
// ==========================================

// Phần 1: Trắc nghiệm ABCD
export interface ActiveExamQuestion {
  id: number;
  question: string;
  options: string[]; // 4 đáp án đã được xáo trộn vị trí
  grade?: number;
  lesson?: string;
}

// Phần 2: Trắc nghiệm Đúng / Sai (Mỗi câu gồm ngữ cảnh + 4 ý a, b, c, d)
export interface ActiveTrueFalseItem {
  id: string; // "a" | "b" | "c" | "d"
  statement: string;
}

export interface ActiveTrueFalseQuestion {
  id: number;
  context: string;
  items: ActiveTrueFalseItem[];
  grade?: number;
  lesson?: string;
}

// Phần 3: Tự luận (Đề bài + thang điểm + rubric)
export interface EssayRubricItem {
  criterion: string;
  points: number;
}

export interface ActiveEssayQuestion {
  id: number;
  prompt: string;
  maxScore: number;
  grade?: number;
  lesson?: string;
  rubric?: EssayRubricItem[];
}

// ==========================================
// 2. DỮ LIỆU PHIÊN THI LƯU TẠM LOCALSTORAGE
// ==========================================
export interface ActiveExamSession {
  sessionId: string;
  mode: ExamMode;
  format: ExamFormatMode;
  startedAt: number;          // Timestamp bắt đầu làm bài (ms)
  durationSeconds: number;    // Thời lượng làm bài (giây)
  
  // Thông tin học sinh & Đề thi theo yêu cầu của Thầy Cường
  studentName?: string;       // Họ và tên học sinh
  studentClass?: string;      // Lớp học sinh (vd: 10A1, 11B2)
  timeLimitMinutes?: number;  // Thời gian làm bài (15, 30, 45 phút hoặc 0: tự do)
  examTypeTitle?: string;     // Tên đề bài (vd: Đề kiểm tra 15 phút, Đề chuẩn 45 phút)

  // Phần I: Trắc nghiệm ABCD
  questions: ActiveExamQuestion[];
  userAnswers: Record<number, number>; // questionId -> option index (0..3)

  // Phần II: Đúng / Sai
  tfQuestions: ActiveTrueFalseQuestion[];
  tfAnswers: Record<number, Record<string, boolean>>; // questionId -> { "a": true/false, ... }

  // Phần III: Tự luận
  essayQuestions: ActiveEssayQuestion[];
  essayAnswers: Record<number, string>; // questionId -> text bài làm học sinh

  status: ExamStatus;
}

// ==========================================
// 3. CHI TIẾT KẾT QUẢ SAU KHI NỘP BÀI
// ==========================================

// Chi tiết 1 câu Phần I ABCD
export interface ExamAnswerDetail {
  questionId: number;
  question: string;
  options: string[];
  selectedOption: number;     // Index đáp án học sinh chọn (-1 nếu chưa chọn)
  correctOption: number;      // Index đáp án đúng
  isCorrect: boolean;
  explanation: string;        // Trích dẫn nguồn SGK và lời giải chi tiết
}

// Chi tiết từng ý a, b, c, d trong Phần II Đúng / Sai
export interface TrueFalseItemDetail {
  id: string;
  statement: string;
  userChoice: boolean | null; // true (Đúng), false (Sai), null (chưa trả lời)
  correctChoice: boolean;
  isCorrect: boolean;
  explanation: string;
}

// Chi tiết 1 câu Phần II Đúng / Sai
export interface TrueFalseResultDetail {
  questionId: number;
  context: string;
  items: TrueFalseItemDetail[];
  correctCount: number;       // Số ý làm đúng (0..4)
  earnedPoints: number;       // Điểm đạt theo barem Bộ GD&ĐT (0.1, 0.25, 0.5, 1.0)
  maxPoints: number;          // 1.0
}

// Chi tiết 1 câu Phần III Tự luận
export interface EssayResultDetail {
  questionId: number;
  prompt: string;
  userResponse: string;
  maxScore: number;
  rubric: EssayRubricItem[];
  suggestedAnswer: string;
  aiFeedback?: string;
  estimatedScore?: number;
}

// ==========================================
// 4. BẢN GHI KẾT QUẢ LƯU VÀO LỊCH SỬ THI
// ==========================================
export interface ExamResultRecord {
  studentId?: string;
  studentUsername?: string;
  id: string;
  sessionId: string;
  mode: ExamMode;
  format: ExamFormatMode;
  submittedAt: number;
  durationSpentSeconds: number;
  
  // Thông tin học sinh & Đề thi
  studentName: string;
  studentClass: string;
  timeLimitMinutes: number;
  examTypeTitle: string;

  // Thang điểm 10 chuẩn
  score: number;
  accuracyPercent: number;
  xpGained: number;

  // Điểm thành phần
  mcqScore: number;
  tfScore: number;
  essayScore?: number;

  // Thống kê câu hỏi
  totalQuestions: number;     // Tổng số đơn vị câu hỏi (MCQ + TF + Essay)
  correctCount: number;       // Số câu MCQ đúng

  // Chi tiết từng phần
  details: ExamAnswerDetail[];
  tfDetails: TrueFalseResultDetail[];
  essayDetails: EssayResultDetail[];
}
