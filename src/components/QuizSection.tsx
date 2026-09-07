import { useState } from "react";
import { QuizQuestion, GradeLevel } from "../types";
import { GDQP_QUIZZES } from "../data";
import { Award, CheckCircle2, XCircle, RotateCcw, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGamification } from "../context/GamificationContext";

interface QuizSectionProps {
  initialGrade: GradeLevel;
}

export default function QuizSection({ initialGrade }: QuizSectionProps) {
  const { recordQuizScore, fireXPToast } = useGamification();
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(initialGrade);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  
  // High scores tracking in LocalStorage
  const [highScores, setHighScores] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem("gqd_highscores");
    return saved ? JSON.parse(saved) : { 10: 0, 11: 0, 12: 0 };
  });

  const questionPool = GDQP_QUIZZES[selectedGrade] || [];
  const currentQuestion = questionPool[currentIndex];

  const handleSelectAnswer = (optionIdx: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(optionIdx);
    setAnsweredCount((prev) => prev + 1);

    const isCorrect = optionIdx === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextMessage = () => {
    setSelectedAnswer(null);
    if (currentIndex < questionPool.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const finalScore = score;
      const prevHigh = highScores[selectedGrade] || 0;
      if (finalScore > prevHigh) {
        const newHighs = { ...highScores, [selectedGrade]: finalScore };
        setHighScores(newHighs);
        localStorage.setItem("gqd_highscores", JSON.stringify(newHighs));
      }
      
      const { xpGained } = recordQuizScore(selectedGrade, finalScore, questionPool.length);
      if (xpGained > 0) {
        fireXPToast(xpGained, `Quiz Lớp ${selectedGrade}`);
      }

      setQuizFinished(true);
    }
  };

  const resetQuiz = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setAnsweredCount(0);
  };

  const getReviewEvaluation = (score: number, total: number) => {
    const ratio = score / total;
    if (ratio === 1) {
      return {
        rank: "Chiến Sĩ Ưu Tú (Xuất Sắc)",
        title: "Danh Hiệu Anh Hùng Học Đường",
        color: "text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
        message: "Xuất chúng! Em đã chứng minh bản thân nắm vững từng chi tiết điều lệ và pháp luật quốc phòng quốc gia. Đây là nền tảng tuyệt vời cho những nhà lãnh đạo tương lai!"
      };
    } else if (ratio >= 0.8) {
      return {
        rank: "Chiến Sĩ Cấp 1 (Giỏi)",
        title: "Tác Phong Chuẩn Chỉ",
        color: "text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40",
        message: "Cực kỳ xuất sắc! Kiến thức vững vàng, tư duy quyết đoán, hành trình của em ghi nhận tài chí dũng cảm đáng tự hào."
      };
    } else if (ratio >= 0.5) {
      return {
        rank: "Chiến Sĩ Dự Bị (Khá)",
        title: "Đạt Chỉ Tiêu Cơ Bản",
        color: "text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30",
        message: "Rất tốt, đạt yêu cầu quân huấn dã chiến. Em chỉ cần lưu ý đọc kỹ những chi tiết luật và tính năng kĩ thuật vũ khí để tối đa điểm số."
      };
    } else {
      return {
        rank: "Học Viên Huấn Luyện (Trung Bình/Yếu)",
        title: "Cần Tăng Cường Rèn Luyện",
        color: "text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40",
        message: "Chưa đạt yêu cầu tối ưu quân trường. Hãy quay lại học kỹ từng bài trong Thư Viện Bài Giảng Lớp " + selectedGrade + " và rèn luyện trí nhớ sắc bén hơn nhé!"
      };
    }
  };

  const evaluation = getReviewEvaluation(score, questionPool.length);

  return (
    <div id="quiz-section-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Cột Trái: Chọn lớp huấn luyện & Thông số tích lũy */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-white">Phòng Trắc Nghiệm</h3>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Lựa chọn ngân hàng câu hỏi sát cấu trúc thi học kỳ, các kỳ thi chất lượng cao tại nhà trường của cả 3 cấp lớp để thử lửa.
            </p>

            <div className="space-y-2.5">
              {([10, 11, 12] as GradeLevel[]).map((g) => (
                <button
                  key={g}
                  id={`quiz-grade-select-${g}`}
                  onClick={() => resetQuiz(g)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left font-medium transition-all duration-200 cursor-pointer ${
                    selectedGrade === g
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-xs"
                      : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="text-sm font-semibold">Trắc nghiệm Lớp {g}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
                      Kỷ lục: {highScores[g] || 0}/{GDQP_QUIZZES[g].length}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bảng Vinh Danh Binh Nhất */}
        <div className="bg-emerald-50/50 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-5 space-y-3.5 transition-colors">
          <h4 className="text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Quy chế Học và Thi
          </h4>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed list-disc list-inside font-sans">
            <li>Mỗi đề thi cấu trúc chuẩn hóa khách quan 8 câu hỏi cốt lõi.</li>
            <li>Không giới hạn lượt làm bài, học sinh thoải mái ôn đi ôn lại.</li>
            <li>Học sinh trả lời sai lập tức nhận bình chú hướng dẫn giải thích học tập bổ ích từ thầy cô giáo.</li>
          </ul>
        </div>
      </div>

      {/* Cột Phải: Bàn làm thi hoặc Kết quả */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {!quizFinished ? (
            <motion.div
              key={`question-${selectedGrade}-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm relative transition-colors"
            >
              {/* Status Header */}
              <div className="flex justify-between items-center text-xs pb-4 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                  Bài Huấn Luyện Lớp {selectedGrade}
                </span>
                <span>
                  Câu hỏi <strong className="text-slate-800 dark:text-white font-mono font-bold">{currentIndex + 1}</strong> của {questionPool.length}
                </span>
              </div>

              {/* Tiến độ sọc bập bùng */}
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questionPool.length) * 100}%` }}
                ></div>
              </div>

              {/* Nội dung câu hỏi */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQuestion?.question}
                </h3>
              </div>

              {/* Danh sách các Đáp án */}
              <div className="space-y-3 pt-2">
                {currentQuestion?.options.map((option, idx) => {
                  const isChoice = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correctAnswer;
                  const isWrongChoice = isChoice && !isCorrect;

                  let cardStyle = "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100";
                  if (selectedAnswer !== null) {
                    if (isCorrect) {
                      cardStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold";
                    } else if (isWrongChoice) {
                      cardStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-200";
                    } else {
                      cardStyle = "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 pointer-events-none";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      id={`quiz-option-${idx}`}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleSelectAnswer(idx)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left text-sm transition-all duration-200 cursor-pointer ${cardStyle}`}
                    >
                      <span>{option}</span>
                      {selectedAnswer !== null && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
                      )}
                      {selectedAnswer !== null && isWrongChoice && (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Lời giải thích */}
              <AnimatePresence>
                {selectedAnswer !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4.5 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Lời phê của Giảng viên giải thích
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {currentQuestion?.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nút Chuyển câu tiếp theo */}
              <div className="pt-4 flex justify-end">
                <button
                  id="quiz-next-question-btn"
                  disabled={selectedAnswer === null}
                  onClick={handleNextMessage}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {currentIndex < questionPool.length - 1 ? "Câu Tiếp Theo →" : "Xem Kết Quả Hoàn Thành 🏆"}
                </button>
              </div>
            </motion.div>
          ) : (
            /* Kết quả hoàn thành */
            <motion.div
              key="quiz-results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  {evaluation.title}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {evaluation.rank}
                </h2>
              </div>

              <div className="py-4 border-y border-slate-100 dark:border-slate-800 flex justify-center gap-12">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Điểm số</div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {score} / {questionPool.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Tỷ lệ đúng</div>
                  <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                    {Math.round((score / questionPool.length) * 100)}%
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${evaluation.color}`}>
                <p className="text-xs leading-relaxed font-sans">{evaluation.message}</p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => resetQuiz(selectedGrade)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Làm Lại Bài Quiz
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
