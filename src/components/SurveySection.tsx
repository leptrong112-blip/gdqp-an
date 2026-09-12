import { useEffect, useState } from 'react';
import { useAccount, accountApi } from './AccountGate';
import { ClipboardCheck, CheckCircle2, ArrowRight, MessageSquareQuote, GraduationCap, UserCheck, ShieldAlert } from 'lucide-react';
import { surveyQuestions, roleLabel, phaseLabel, type SurveyRole, type SurveyPhase } from '../data/survey';

export const surveyPanel = 'rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-7';
export const surveyInput = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white';
export const surveyButton = 'rounded-xl bg-red-600 hover:bg-red-700 px-5 py-3 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed';
export const surveyApi = accountApi;

const quickClasses = ['10A1', '10A2', '10A3', '11B1', '11B2', '11B3', '12C1', '12C2', '12C3'];
const quickPositions = ['Giáo viên GDQP-AN', 'Tổ trưởng chuyên môn', 'Giáo viên chủ nhiệm', 'Cán bộ quản lý'];

export default function SurveySection() {
  const account = useAccount();
  const user = account?.user || null;

  const [role, setRole] = useState<SurveyRole>(user?.role === 'teacher' ? 'teacher' : 'student');
  const [phase, setPhase] = useState<SurveyPhase>('before');

  // Thông tin người làm khảo sát (tự nhập hoặc tự điền từ tài khoản)
  const [name, setName] = useState(user?.name || '');
  const [className, setClassName] = useState('11B1');
  const [position, setPosition] = useState('Giáo viên GDQP-AN');
  const [school, setSchool] = useState('Trường THPT');

  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Trạng thái đợt khảo sát
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    // Tự động điền thông tin nếu có tài khoản
    if (user) {
      setName(user.name);
      if (user.role === 'teacher') {
        setRole('teacher');
      }
    }
    // Kiểm tra cấu hình đợt khảo sát
    fetch('/api/survey/config')
      .then(res => res.json())
      .then(data => {
        if (typeof data.isOpen === 'boolean') setIsOpen(data.isOpen);
      })
      .catch(() => {});
  }, [user]);

  const questions = surveyQuestions(role, phase);
  const completed = questions.filter(q => answers[q.id]?.length).length;

  function reset() {
    setAnswers({});
    setFeedback('');
    setError('');
    setDone(false);
  }

  if (done) {
    return (
      <section className={`${surveyPanel} max-w-2xl mx-auto text-center space-y-5 my-6 animate-fade-in`}>
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">Đã ghi nhận phản hồi khảo sát!</h2>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm space-y-1">
          <p><strong>Người khảo sát:</strong> {name} ({roleLabel[role]})</p>
          <p><strong>Đơn vị:</strong> {role === 'student' ? `Lớp ${className}` : position} · {school}</p>
          <p><strong>Giai đoạn:</strong> {phaseLabel[phase]}</p>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Cảm ơn bạn đã đóng góp ý kiến quý báu để nâng cao chất lượng dạy và học thực hành GDQP-AN! Phản hồi đã được chuyển về trang Báo cáo kết quả của Thầy Cô.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {phase === 'before' ? (
            <button
              className={surveyButton}
              onClick={() => {
                reset();
                setPhase('after');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Mở khảo sát sau trải nghiệm
            </button>
          ) : (
            <button
              className={surveyButton}
              onClick={() => {
                reset();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Làm lại khảo sát mới
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      {/* Banner tiêu đề khảo sát */}
      <div className="rounded-3xl bg-gradient-to-br from-red-700 via-rose-700 to-red-800 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-bold mb-3 backdrop-blur-sm">
              <ClipboardCheck className="w-4 h-4" /> Phiếu khảo sát thực nghiệm GDQP-AN
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">Khảo sát trải nghiệm phần mềm</h2>
            <p className="mt-2 text-red-50 text-sm max-w-xl leading-relaxed">
              Dành cho Thầy Cô và các em học sinh. <strong>Không cần tạo tài khoản hay đăng nhập</strong> — chỉ cần điền tên và trả lời trong khoảng 2–3 phút để phục vụ đề tài nghiên cứu.
            </p>
          </div>
        </div>
      </div>

      {/* Thông báo nếu đợt khảo sát tạm đóng */}
      {!isOpen && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-5 flex items-start gap-4 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-base">Đợt khảo sát hiện đang tạm đóng</p>
            <p>Hệ thống đã tạm dừng nhận thêm phản hồi để quản trị viên tổng hợp báo cáo.</p>
          </div>
        </div>
      )}

      {/* ═════════ 2 THẺ / TAB CHỌN ĐỐI TƯỢNG (HỌC SINH & GIÁO VIÊN) ═════════ */}
      {/* ═════════ 2 THẺ / TAB CHỌN ĐỐI TƯỢNG (HỌC SINH & GIÁO VIÊN) ═════════ */}
      <div className="grid grid-cols-2 gap-3 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => { setRole('student'); reset(); }}
          className={`py-3 px-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
            role === 'student'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-500'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-5 h-5 shrink-0 text-amber-300" />
          <div className="text-center sm:text-left">
            <div className="font-black text-sm sm:text-base leading-tight">Khảo sát Học sinh</div>
            <div className="text-[11px] opacity-85 hidden sm:block">Dành cho học sinh các lớp 10, 11, 12</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setRole('teacher'); reset(); }}
          className={`py-3 px-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
            role === 'teacher'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-500'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-5 h-5 shrink-0 text-amber-300" />
          <div className="text-center sm:text-left">
            <div className="font-black text-sm sm:text-base leading-tight">Khảo sát Giáo viên</div>
            <div className="text-[11px] opacity-85 hidden sm:block">Dành cho Thầy/Cô &amp; Cán bộ quản lý</div>
          </div>
        </button>
      </div>

      <form
        className="space-y-6"
        onSubmit={async event => {
          event.preventDefault();
          if (!name.trim()) {
            setError('Vui lòng nhập họ và tên của bạn.');
            return;
          }
          setBusy(true);
          setError('');
          try {
            await surveyApi('responses', {
              method: 'POST',
              body: JSON.stringify({
                role,
                phase,
                name: name.trim(),
                school: school.trim(),
                className: role === 'student' ? className.trim() : undefined,
                position: role === 'teacher' ? position.trim() : undefined,
                answers,
                feedback: feedback.trim()
              })
            });
            setDone(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {/* ═════════ KHUNG NHẬP THÔNG TIN ĐỊNH DANH ═════════ */}
        <fieldset disabled={busy} className={`${surveyPanel} space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
              {role === 'student' ? <GraduationCap className="w-5 h-5 text-red-600" /> : <UserCheck className="w-5 h-5 text-red-600" />}
              Thông tin người tham gia ({roleLabel[role]})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Tự điền nhanh</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="survey-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên <span className="text-red-600">*</span>
              </label>
              <input
                id="survey-name"
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={role === 'student' ? 'Ví dụ: Nguyễn Văn An' : 'Ví dụ: Thầy Hoàng Văn Cường'}
                className={surveyInput}
              />
            </div>

            {role === 'student' ? (
              <div>
                <label htmlFor="survey-class" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lớp học <span className="text-red-600">*</span>
                </label>
                <input
                  id="survey-class"
                  required
                  type="text"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="Ví dụ: 11B1"
                  className={surveyInput}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickClasses.map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassName(cls)}
                      className={`text-xs px-2 py-1 rounded-lg border font-mono transition-all ${
                        className === cls
                          ? 'bg-red-600 text-white border-red-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-400'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="survey-pos" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chức vụ / Chuyên môn <span className="text-red-600">*</span>
                </label>
                <input
                  id="survey-pos"
                  required
                  type="text"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="Ví dụ: Giáo viên GDQP-AN"
                  className={surveyInput}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickPositions.map(pos => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                        position === pos
                          ? 'bg-red-600 text-white border-red-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="survey-school" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Trường THPT / Đơn vị công tác
              </label>
              <input
                id="survey-school"
                type="text"
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="Nhập tên trường THPT..."
                className={surveyInput}
              />
            </div>

            <div>
              <label htmlFor="survey-phase" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Thời điểm khảo sát <span className="text-red-600">*</span>
              </label>
              <select
                id="survey-phase"
                className={surveyInput}
                value={phase}
                onChange={e => {
                  setPhase(e.target.value as SurveyPhase);
                  reset();
                }}
              >
                {Object.entries(phaseLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Thanh tiến độ làm bài */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
            <span>{phaseLabel[phase]} · {questions.length} câu hỏi trắc nghiệm</span>
            <span className="text-red-600">{completed}/{questions.length} đã chọn</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={questions.length}>
            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(completed / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* ═════════ DANH SÁCH CÂU HỎI ═════════ */}
        {questions.map((q, i) => {
          const isExclusive = q.exclusiveLast ?? (q.options[q.options.length - 1]?.toLowerCase().includes('không') || q.options[q.options.length - 1]?.toLowerCase().includes('chưa'));
          const exclusive = q.options.length - 1;
          return (
            <div key={`${role}-${phase}-${q.id}`} className="space-y-4">
              {/* Banner phân đoạn B dành riêng cho giáo viên sau trải nghiệm (khớp 100% ảnh của Thầy) */}
              {role === 'teacher' && phase === 'after' && i === 5 && (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-slate-900 p-4 sm:p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Đánh giá sư phạm &amp; Ứng dụng thực tế</span>
                  <h3 className="text-base sm:text-lg font-black text-red-900 dark:text-red-200 mt-1">
                    B. Khảo sát dành cho giáo viên (sau khi xem hoặc cho học sinh dùng thử)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Đánh giá khả năng hỗ trợ giảng dạy phần thực hành GDQP, giải quyết khó khăn thực tế và khả năng sẵn sàng áp dụng.
                  </p>
                </div>
              )}

              <fieldset disabled={busy} className={surveyPanel}>
                <legend className="sr-only">Câu {i + 1}: {q.text}</legend>
                <h3 className="font-bold mb-4 leading-relaxed text-slate-900 dark:text-white">
                  <span className="text-red-600 mr-2">{i + 1}.</span>{q.text} <span className="text-red-600">*</span>
                </h3>
                <div className="space-y-2">
                  {q.options.map((option, index) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3 transition-colors ${
                        answers[q.id]?.includes(index)
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/30 font-medium'
                          : 'border-slate-200 dark:border-slate-700 hover:border-red-300'
                      }`}
                    >
                      <input
                        className="accent-red-600 w-4 h-4 shrink-0"
                        type={q.multiple ? 'checkbox' : 'radio'}
                        name={q.id}
                        required={!q.multiple && (!answers[q.id] || answers[q.id].length === 0)}
                        checked={answers[q.id]?.includes(index) || false}
                        onChange={() => setAnswers(previous => {
                          const old = previous[q.id] || [];
                          const next = !q.multiple
                            ? [index]
                            : old.includes(index)
                            ? old.filter(v => v !== index)
                            : (isExclusive && index === exclusive)
                            ? [index]
                            : isExclusive
                            ? [...old.filter(v => v !== exclusive), index]
                            : [...old, index];
                          return { ...previous, [q.id]: next };
                        })}
                      />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          );
        })}

        {/* ═════════ MỤC TỰ LUẬN / GÓP Ý & ĐỀ XUẤT ═════════ */}
        <fieldset disabled={busy} className={surveyPanel}>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="survey-feedback" className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <MessageSquareQuote className="w-5 h-5 text-red-600 shrink-0" />
              Ý kiến đóng góp &amp; Đề xuất giải pháp (Tự luận)
              <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">Tùy chọn</span>
            </label>
            <span className={`text-xs ${feedback.length > 900 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
              {feedback.length}/1000
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            {role === 'teacher'
              ? 'Thầy/Cô có thể chia sẻ thêm về thuận lợi, khó khăn thực tế khi giảng dạy hoặc đề xuất các động tác, mô hình 3D, tính năng cần bổ sung để nâng cao chất lượng dạy thực hành GDQP-AN.'
              : 'Em hãy chia sẻ cảm nghĩ, những điểm thích hoặc chưa thích, và mong muốn ứng dụng cải tiến điều gì (nội dung bài giảng 3D, WebAR, câu hỏi trắc nghiệm...) để việc học thực hành hào hứng hơn.'}
          </p>
          <textarea
            id="survey-feedback"
            className={`${surveyInput} min-h-[110px] resize-y leading-relaxed text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500`}
            maxLength={1000}
            rows={4}
            placeholder={
              role === 'teacher'
                ? 'Nhập ý kiến đóng góp, đề xuất giải pháp giảng dạy hoặc giải thích chi tiết mục "Khác: ..." của Thầy/Cô tại đây (không bắt buộc)...'
                : 'Nhập chia sẻ, cảm nhận hoặc mong muốn cải tiến của em tại đây (không bắt buộc)...'
            }
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </fieldset>

        {error && <p role="alert" className="rounded-xl bg-red-50 text-red-700 p-4 text-sm font-semibold">{error}</p>}

        <div className="flex flex-wrap justify-between items-center gap-4 pb-12">
          <span className="text-xs sm:text-sm text-slate-500">Vui lòng chọn đầy đủ các câu hỏi có dấu *.</span>
          <button
            disabled={busy || completed !== questions.length}
            className={`${surveyButton} flex items-center gap-2 text-base px-7 py-3.5 shadow-lg shadow-red-600/30`}
          >
            {busy ? 'Đang gửi phản hồi…' : 'Gửi khảo sát'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>

    </section>
  );
}
