import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  BarChart3, Download, MessageSquareQuote, ArrowLeft, ToggleLeft, ToggleRight, Trash2, 
  LockKeyhole, Sparkles, TrendingUp, ShieldCheck, Award, Users, CheckCircle2, 
  Compass, Brain, Printer, RefreshCw, Layers, ArrowUpRight, Flame, Target, BookOpen,
  Eye, HeartHandshake, BookMarked, ThumbsUp, GitCompare, GraduationCap, School,
  Activity, Check, HelpCircle, FileSpreadsheet
} from 'lucide-react';
import AccountManagement from './AccountManagement';
import { useAccount } from './AccountGate';
import { surveyQuestions, roleLabel, phaseLabel, pairedResponses, type SurveyResponse, type SurveyRole, type SurveyPhase } from '../data/survey';
import { surveyApi, surveyButton, surveyInput, surveyPanel } from './SurveySection';
import { exportSurveyReportToExcel } from '../utils/excelExport';

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const display = (value: number | null) => value === null ? 'Chưa có dữ liệu' : `${value.toFixed(2)}/5`;
type FeedbackInsight = { id: string; label: string; description: string; kind: 'positive' | 'improvement'; mentions: number; percentage: number; examples: string[] };
type FeedbackAnalysis = { generatedAt: string; source: 'ai' | 'local'; model?: string; analyzedCount: number; summary: string; positives: FeedbackInsight[]; priorities: FeedbackInsight[]; suggestions: string[] };

function downloadCsv(rows: SurveyResponse[], prefix: string = 'bao-cao-khao-sat') {
  const header = ['Mã phản hồi', 'Mã người làm', 'Họ tên', 'Đơn vị / Lớp', 'Trường', 'Đối tượng', 'Giai đoạn', 'Thời gian', 'Ý kiến đóng góp (Tự luận)', 'Câu hỏi', 'Trả lời'];
  const lines = rows.flatMap(r => surveyQuestions(r.role, r.phase).map(q => [
    r.id,
    r.code,
    r.name || r.username || '',
    r.className || r.position || '',
    r.school || '',
    roleLabel[r.role],
    phaseLabel[r.phase],
    r.createdAt,
    r.feedback || '',
    q.text,
    r.answers[q.id]?.map(v => q.options[v]).join('; ') || ''
  ]));
  const csv = [header, ...lines].map(row => row.map(value => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: BIỂU ĐỒ RADAR KHẢO SÁT 5 TIÊU CHÍ (THANG 5 ĐIỂM LIKERT)
// ════════════════════════════════════════════════════════════════════════════
function CompetencyRadarChart({ 
  axes,
  beforeValues, 
  afterValues,
  visiblePhase,
  beforeLabel = 'Khảo sát Trước',
  afterLabel = 'Khảo sát Sau'
}: { 
  axes: string[];
  beforeValues: number[]; 
  afterValues: number[];
  visiblePhase: SurveyPhase;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const size = 260;
  const center = size / 2;
  const radius = 90;
  const count = axes.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const distance = (Math.min(5, Math.max(0, value)) / 5) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle)
    };
  };

  const beforePoints = beforeValues.map((val, idx) => getCoordinates(idx, val)).map(p => `${p.x},${p.y}`).join(' ');
  const afterPoints = afterValues.map((val, idx) => getCoordinates(idx, val)).map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Rings (1 to 5 points) */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * level}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeDasharray={i % 2 === 1 ? "3 3" : undefined}
            strokeWidth="1"
          />
        ))}

        {/* Radar Spoke Lines */}
        {axes.map((_, idx) => {
          const pt = getCoordinates(idx, 5);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={pt.x}
              y2={pt.y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />
          );
        })}

        {/* Polygon 1: TRƯỚC TRẢI NGHIỆM (Dashed Slate) */}
        {visiblePhase === 'before' && <polygon
          points={beforePoints}
          fill="rgba(148, 163, 184, 0.25)"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 4"
        />}

        {/* Polygon 2: SAU TRẢI NGHIỆM (Red/Emerald Glow) */}
        {visiblePhase === 'after' && <polygon
          points={afterPoints}
          fill="rgba(239, 68, 68, 0.25)"
          stroke="#ef4444"
          strokeWidth="2.5"
        />}

        {/* Point Markers */}
        {(visiblePhase === 'after' ? afterValues : beforeValues).map((val, idx) => {
          const pt = getCoordinates(idx, val);
          return (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="4"
              className={`${visiblePhase === 'after' ? 'fill-red-500' : 'fill-slate-400'} stroke-white stroke-2`}
            />
          );
        })}

        {/* Axis Labels */}
        {axes.map((label, idx) => {
          const pt = getCoordinates(idx, 5.8);
          return (
            <text
              key={idx}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9.5px] font-extrabold fill-slate-300 font-sans"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[11px] font-bold">
        {visiblePhase === 'before' ? (
          <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" /> {beforeLabel}</span>
        ) : (
          <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-1 bg-red-500 rounded-full inline-block" /> {afterLabel}</span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function SurveyAdminSection({ onBack }: { onBack?: () => void }) {
  const { user, openLogin } = useAccount();
  const [rows, setRows] = useState<SurveyResponse[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  // Tab chính: Học sinh (Trước vs Sau) | Giáo viên (Trước vs Sau) | So sánh đối chiếu
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'comparison'>('student');
  
  // Bộ lọc phụ
  const [role, setRole] = useState<SurveyRole>('student');
  const [phase, setPhase] = useState<SurveyPhase>('after');
  const [chartPhase, setChartPhase] = useState<SurveyPhase>('before');
  const [mode, setMode] = useState<'paired' | 'all'>('paired');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | '10' | '11' | '12'>('all');

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<FeedbackAnalysis | null>(null);
  const [feedbackAiBusy, setFeedbackAiBusy] = useState(false);
  const [feedbackAiError, setFeedbackAiError] = useState('');
  const feedbackAutoRequestKey = useRef('');

  // Tự động đồng bộ role khi chuyển Tab
  const handleTabChange = (tab: 'student' | 'teacher' | 'comparison') => {
    setActiveTab(tab);
    if (tab === 'student') setRole('student');
    if (tab === 'teacher') setRole('teacher');
  };

  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const res = await surveyApi('responses');
      setRows(res.responses);
    } catch (e) {
      setRows(null);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadFeedbackAnalysis(force = false) {
    setFeedbackAiBusy(true);
    setFeedbackAiError('');
    try {
      if (!force) {
        const cached = await surveyApi('feedback-analysis');
        if (cached.analysis) {
          setFeedbackAnalysis(cached.analysis);
          return;
        }
      }
      const result = await surveyApi('feedback-analysis', { method: 'POST', body: JSON.stringify({ force }) });
      setFeedbackAnalysis(result.analysis);
    } catch (e) {
      setFeedbackAiError((e as Error).message);
    } finally {
      setFeedbackAiBusy(false);
    }
  }

  useEffect(() => {
    if (user?.role !== 'admin') return;
    void refresh();
    fetch('/api/survey/config')
      .then(res => res.json())
      .then(data => { if (typeof data.isOpen === 'boolean') setIsOpen(data.isOpen); })
      .catch(() => {});
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin' || !rows) return;
    const nextKey = rows.filter(row => row.feedback?.trim()).map(row => `${row.id}:${row.feedback}`).join('|');
    if (feedbackAutoRequestKey.current === nextKey) return;
    feedbackAutoRequestKey.current = nextKey;
    void loadFeedbackAnalysis();
  }, [user?.role, rows]);

  const toggleSurveyBatch = async () => {
    const next = !isOpen;
    try {
      await surveyApi('config', { method: 'POST', body: JSON.stringify({ isOpen: next }) });
      setIsOpen(next);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // Xóa toàn bộ phiếu khảo sát
  const handleClearAll = async () => {
    if (!window.confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ các phản hồi khảo sát hiện có trong hệ thống. Bạn có chắc chắn muốn xóa không?')) return;
    setBusy(true);
    setActionMessage('Đang dọn sạch dữ liệu…');
    try {
      await surveyApi('responses/all', { method: 'DELETE' });
      setActionMessage('✅ Đã xóa sạch toàn bộ phản hồi khảo sát.');
      await refresh();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Không thể xóa dữ liệu.');
      setActionMessage(null);
    } finally {
      setBusy(false);
    }
  };

  const deleteResponse = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phản hồi của "${name}" không?`)) return;
    try {
      await surveyApi(`responses/${id}`, { method: 'DELETE' });
      setRows(prev => prev ? prev.filter(r => r.id !== id) : null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // 1. TÍNH TOÁN DỮ LIỆU KHẢO SÁT HỌC SINH (STUDENT ANALYTICS)
  // ════════════════════════════════════════════════════════════════════════
  const studentAnalytics = useMemo(() => {
    const studentRows = (rows || []).filter(r => r.role === 'student');
    const filteredRows = studentRows.filter(r => {
      if (selectedGradeFilter === 'all') return true;
      return r.className?.includes(selectedGradeFilter) || r.code?.includes(selectedGradeFilter);
    });

    const pairs = pairedResponses(filteredRows);
    const beforeResps = mode === 'paired' && pairs.length > 0 ? pairs.map(p => p.before) : filteredRows.filter(r => r.phase === 'before');
    const afterResps = mode === 'paired' && pairs.length > 0 ? pairs.map(p => p.after) : filteredRows.filter(r => r.phase === 'after');

    const computeAvg = (resps: SurveyResponse[], qId: string) => {
      const vals = resps
        .map(r => (r.answers[qId]?.[0] !== undefined ? r.answers[qId][0] + 1 : null))
        .filter((v): v is number => v !== null);
      return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    };

    // 4 tiêu chí cốt lõi
    const c1Before = computeAvg(beforeResps, 'understanding');
    const c1After = computeAvg(afterResps, 'understanding');

    const c2Before = computeAvg(beforeResps, 'visualization');
    const c2After = computeAvg(afterResps, 'visualization');

    const c3Before = computeAvg(beforeResps, 'interest');
    const c3After = computeAvg(afterResps, 'interest');

    const c4Before = computeAvg(beforeResps, 'review');
    const c4After = computeAvg(afterResps, 'review');

    const beforeAvg = Number(((c1Before + c2Before + c3Before + c4Before) / 4).toFixed(2));
    const afterAvg = Number(((c1After + c2After + c3After + c4After) / 4).toFixed(2));
    const percentGrowth = beforeAvg > 0 ? Number((((afterAvg - beforeAvg) / beforeAvg) * 100).toFixed(1)) : 0;
    const change = (before: number, after: number) => before > 0 ? `${after >= before ? '+' : ''}${(((after - before) / before) * 100).toFixed(1)}%` : 'Chưa đủ dữ liệu';

    // Đánh giá tích cực (Tốt hơn & Tốt hơn nhiều)
    const effectAnswers = afterResps.map(r => r.answers['effectiveness']?.[0]).filter(v => v !== undefined);
    const positiveCount = effectAnswers.filter(idx => idx >= 3).length;
    const positiveRate = effectAnswers.length ? Math.round((positiveCount / effectAnswers.length) * 100) : 0;

    // Tỷ lệ muốn tiếp tục sử dụng (intention: Có / Chắc chắn có)
    const intentionAnswers = afterResps.map(r => r.answers['intention']?.[0]).filter(v => v !== undefined);
    const intentionCount = intentionAnswers.filter(idx => idx >= 3).length;
    const intentionRate = intentionAnswers.length ? Math.round((intentionCount / intentionAnswers.length) * 100) : 0;

    return {
      countTotal: filteredRows.length,
      countBefore: beforeResps.length,
      countAfter: afterResps.length,
      countPairs: pairs.length,
      beforeAvg,
      afterAvg,
      percentGrowth,
      positiveRate,
      intentionRate,
      criteriaList: [
        {
          id: 'understanding',
          title: '1. Mức độ hiểu và ghi nhớ nội dung thực hành',
          desc: 'Câu hỏi: Em hiểu và ghi nhớ nội dung thực hành GDQP-AN ở mức nào?',
          before: c1Before,
          after: c1After,
          change: change(c1Before, c1After),
          icon: <BookOpen className="w-4 h-4 text-blue-400" />
        },
        {
          id: 'visualization',
          title: '2. Khả năng trực quan hóa & hình dung rõ động tác',
          desc: 'Câu hỏi: Em hình dung rõ các động tác và tình huống thực hành ở mức nào?',
          before: c2Before,
          after: c2After,
          change: change(c2Before, c2After),
          icon: <Eye className="w-4 h-4 text-emerald-400" />
        },
        {
          id: 'interest',
          title: '3. Mức độ hứng thú & yêu thích môn học GDQP-AN',
          desc: 'Câu hỏi: Mức độ hứng thú của em với việc học thực hành GDQP-AN hiện nay?',
          before: c3Before,
          after: c3After,
          change: change(c3Before, c3After),
          icon: <Flame className="w-4 h-4 text-amber-400" />
        },
        {
          id: 'review',
          title: '4. Khả năng tự học & tự ôn tập ngoài giờ lên lớp',
          desc: 'Câu hỏi: Khả năng tự ôn tập nội dung thực hành ngoài giờ học của em?',
          before: c4Before,
          after: c4After,
          change: change(c4Before, c4After),
          icon: <BookMarked className="w-4 h-4 text-purple-400" />
        }
      ],
      radarAxes: ['Hiểu & Ghi nhớ', 'Hình dung động tác', 'Hứng thú học tập', 'Tự ôn tập ngoài giờ', 'Điểm tổng hợp'],
      radarBefore: [c1Before, c2Before, c3Before, c4Before, beforeAvg],
      radarAfter: [c1After, c2After, c3After, c4After, afterAvg],
    };
  }, [rows, selectedGradeFilter, mode]);

  // ════════════════════════════════════════════════════════════════════════
  // 2. TÍNH TOÁN DỮ LIỆU KHẢO SÁT GIÁO VIÊN (TEACHER ANALYTICS)
  // ════════════════════════════════════════════════════════════════════════
  const teacherAnalytics = useMemo(() => {
    const teacherRows = (rows || []).filter(r => r.role === 'teacher');
    const pairs = pairedResponses(teacherRows);
    const beforeResps = mode === 'paired' && pairs.length > 0 ? pairs.map(p => p.before) : teacherRows.filter(r => r.phase === 'before');
    const afterResps = mode === 'paired' && pairs.length > 0 ? pairs.map(p => p.after) : teacherRows.filter(r => r.phase === 'after');

    const computeAvg = (resps: SurveyResponse[], qId: string) => {
      const vals = resps
        .map(r => (r.answers[qId]?.[0] !== undefined ? r.answers[qId][0] + 1 : null))
        .filter((v): v is number => v !== null);
      return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    };

    // 4 tiêu chí sư phạm
    const t1Before = computeAvg(beforeResps, 'understanding');
    const t1After = computeAvg(afterResps, 'understanding');

    const t2Before = computeAvg(beforeResps, 'visualization');
    const t2After = computeAvg(afterResps, 'visualization');

    const t3Before = computeAvg(beforeResps, 'interest');
    const t3After = computeAvg(afterResps, 'interest');

    const t4Before = computeAvg(beforeResps, 'review');
    const t4After = computeAvg(afterResps, 'review');

    const beforeAvg = Number(((t1Before + t2Before + t3Before + t4Before) / 4).toFixed(2));
    const afterAvg = Number(((t1After + t2After + t3After + t4After) / 4).toFixed(2));
    const percentGrowth = beforeAvg > 0 ? Number((((afterAvg - beforeAvg) / beforeAvg) * 100).toFixed(1)) : 0;
    const change = (before: number, after: number) => before > 0 ? `${after >= before ? '+' : ''}${(((after - before) / before) * 100).toFixed(1)}%` : 'Chưa đủ dữ liệu';

    // Tỷ lệ Thầy/Cô sẵn sàng giới thiệu hoặc ứng dụng vào giảng dạy (intention: Có / Chắc chắn có)
    const intentionAnswers = afterResps.map(r => r.answers['intention']?.[0]).filter(v => v !== undefined);
    const readyCount = intentionAnswers.filter(idx => idx >= 3).length;
    const readyRate = intentionAnswers.length ? Math.round((readyCount / intentionAnswers.length) * 100) : 0;

    // Tỷ lệ đánh giá hỗ trợ giảng dạy Tốt / Rất tốt (effectiveness)
    const effectAnswers = afterResps.map(r => r.answers['effectiveness']?.[0]).filter(v => v !== undefined);
    const supportPositive = effectAnswers.filter(idx => idx >= 3).length;
    const teachingSupportRate = effectAnswers.length ? Math.round((supportPositive / effectAnswers.length) * 100) : 0;

    return {
      countTotal: teacherRows.length,
      countBefore: beforeResps.length,
      countAfter: afterResps.length,
      countPairs: pairs.length,
      beforeAvg,
      afterAvg,
      percentGrowth,
      readyRate,
      teachingSupportRate,
      criteriaList: [
        {
          id: 'understanding',
          title: '1. Đánh giá mức độ học sinh hiểu và nhớ nội dung',
          desc: 'Câu hỏi: Thầy/Cô đánh giá mức độ học sinh hiểu và ghi nhớ nội dung thực hành như thế nào?',
          before: t1Before,
          after: t1After,
          change: change(t1Before, t1After),
          icon: <BookOpen className="w-4 h-4 text-blue-400" />
        },
        {
          id: 'visualization',
          title: '2. Khả năng minh họa trực quan các động tác khó',
          desc: 'Câu hỏi: Thầy/Cô có thể minh họa rõ các động tác và tình huống thực hành ở mức nào?',
          before: t2Before,
          after: t2After,
          change: change(t2Before, t2After),
          icon: <Eye className="w-4 h-4 text-emerald-400" />
        },
        {
          id: 'interest',
          title: '3. Đánh giá mức độ hứng thú học tập của học sinh',
          desc: 'Câu hỏi: Thầy/Cô đánh giá mức độ hứng thú của học sinh với việc học thực hành hiện nay?',
          before: t3Before,
          after: t3After,
          change: change(t3Before, t3After),
          icon: <Flame className="w-4 h-4 text-amber-400" />
        },
        {
          id: 'review',
          title: '4. Khả năng hỗ trợ học sinh ôn tập thực hành ngoài giờ',
          desc: 'Câu hỏi: Khả năng hỗ trợ học sinh ôn tập thực hành ngoài giờ của Thầy/Cô ở mức nào?',
          before: t4Before,
          after: t4After,
          change: change(t4Before, t4After),
          icon: <BookMarked className="w-4 h-4 text-purple-400" />
        }
      ],
      radarAxes: ['Hiểu bài của trò', 'Minh họa động tác', 'Hứng thú lớp học', 'Hỗ trợ ôn ngoài giờ', 'Điểm tổng hợp'],
      radarBefore: [t1Before, t2Before, t3Before, t4Before, beforeAvg],
      radarAfter: [t1After, t2After, t3After, t4After, afterAvg],
    };
  }, [rows, mode]);

  // ════════════════════════════════════════════════════════════════════════
  // 3. ĐỐI CHIẾU SO SÁNH HỌC SINH VS GIÁO VIÊN (COMPARISON ANALYTICS)
  // ════════════════════════════════════════════════════════════════════════
  const comparisonAnalytics = useMemo(() => {
    const s = studentAnalytics;
    const t = teacherAnalytics;

    const commonCriteria = [
      {
        id: 'understanding',
        label: 'Hiểu & Ghi nhớ kiến thức',
        studentBefore: s.criteriaList[0].before,
        studentAfter: s.criteriaList[0].after,
        teacherBefore: t.criteriaList[0].before,
        teacherAfter: t.criteriaList[0].after,
        deltaStudent: s.criteriaList[0].change,
        deltaTeacher: t.criteriaList[0].change,
      },
      {
        id: 'visualization',
        label: 'Trực quan hóa & Minh họa động tác',
        studentBefore: s.criteriaList[1].before,
        studentAfter: s.criteriaList[1].after,
        teacherBefore: t.criteriaList[1].before,
        teacherAfter: t.criteriaList[1].after,
        deltaStudent: s.criteriaList[1].change,
        deltaTeacher: t.criteriaList[1].change,
      },
      {
        id: 'interest',
        label: 'Mức độ hứng thú với GDQP-AN',
        studentBefore: s.criteriaList[2].before,
        studentAfter: s.criteriaList[2].after,
        teacherBefore: t.criteriaList[2].before,
        teacherAfter: t.criteriaList[2].after,
        deltaStudent: s.criteriaList[2].change,
        deltaTeacher: t.criteriaList[2].change,
      },
      {
        id: 'review',
        label: 'Tự học & Hỗ trợ ôn ngoài giờ',
        studentBefore: s.criteriaList[3].before,
        studentAfter: s.criteriaList[3].after,
        teacherBefore: t.criteriaList[3].before,
        teacherAfter: t.criteriaList[3].after,
        deltaStudent: s.criteriaList[3].change,
        deltaTeacher: t.criteriaList[3].change,
      }
    ];

    // Mức đồng thuận được suy ra trực tiếp từ chênh lệch điểm sau trải nghiệm.
    const alignment = (phase: SurveyPhase) => {
      const hasData = phase === 'before'
        ? s.countBefore > 0 && t.countBefore > 0
        : s.countAfter > 0 && t.countAfter > 0;
      if (!hasData) return 0;
      const differences = commonCriteria.map(item => Math.abs(
        phase === 'before' ? item.studentBefore - item.teacherBefore : item.studentAfter - item.teacherAfter
      ));
      return Number((100 - (differences.reduce((sum, value) => sum + value, 0) / differences.length / 4) * 100).toFixed(1));
    };

    return {
      commonCriteria,
      alignmentBefore: alignment('before'),
      alignmentAfter: alignment('after'),
      studentBeforeAvg: s.beforeAvg,
      studentAfterAvg: s.afterAvg,
      teacherBeforeAvg: t.beforeAvg,
      teacherAfterAvg: t.afterAvg,
      studentGrowth: s.percentGrowth,
      teacherGrowth: t.percentGrowth,
    };
  }, [studentAnalytics, teacherAnalytics]);

  const visibleAlignmentRate = chartPhase === 'before' ? comparisonAnalytics.alignmentBefore : comparisonAnalytics.alignmentAfter;
  const visibleStudentAvg = chartPhase === 'before' ? comparisonAnalytics.studentBeforeAvg : comparisonAnalytics.studentAfterAvg;
  const visibleTeacherAvg = chartPhase === 'before' ? comparisonAnalytics.teacherBeforeAvg : comparisonAnalytics.teacherAfterAvg;

  // ════════════════════════════════════════════════════════════════════════
  // KIỂM SOÁT QUYỀN TRUY CẬP: CHỈ ADMIN MỚI ĐƯỢC XEM
  // ════════════════════════════════════════════════════════════════════════
  if (user && user.role !== 'admin') {
    return (
      <section className={`${surveyPanel} max-w-md mx-auto text-center space-y-5 my-10 shadow-xl border-red-200 dark:border-red-900/50`}>
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
          <LockKeyhole className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Giới Hạn Quyền Truy Cập</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Khu vực Báo Cáo Khảo Sát Quản Trị chỉ dành riêng cho tài khoản <strong>Quản trị viên (Admin)</strong>.
          </p>
          <p className="text-xs text-slate-400">
            Bạn hiện đang đăng nhập bằng tài khoản: <strong className="text-slate-700 dark:text-slate-200">{user.name}</strong> ({roleLabel[user.role as SurveyRole] || 'Học sinh'}).
          </p>
        </div>
        <div className="pt-2 space-y-2">
          <button
            onClick={openLogin}
            className={`${surveyButton} w-full`}
          >
            Đăng nhập tài khoản Admin
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full text-xs text-slate-500 hover:text-slate-700 underline pt-2"
            >
              Quay lại làm Khảo sát
            </button>
          )}
        </div>
      </section>
    );
  }

  // Nếu chưa tải được dữ liệu quản trị
  if (rows === null) {
    return (
      <section className={`${surveyPanel} max-w-md mx-auto text-center space-y-5 my-10 shadow-xl`}>
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
          <LockKeyhole className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Báo cáo khảo sát quản trị</h3>
          <p role="status" className="text-sm text-slate-500">{busy ? 'Đang tải dữ liệu…' : (error || 'Chỉ tài khoản Quản trị viên (Admin) đã đăng nhập mới xem được báo cáo.')}</p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {!busy && <button className="text-xs text-slate-500 hover:text-slate-700 underline" onClick={refresh}>Thử tải lại</button>}
          {onBack && (
            <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-700 underline">
              Quay lại khảo sát
            </button>
          )}
        </div>
      </section>
    );
  }

  const group = rows.filter(r => r.role === role);
  const selected = group.filter(r => r.phase === phase);
  const pairs = pairedResponses(group);
  const before = mode === 'paired' ? pairs.map(p => p.before) : group.filter(r => r.phase === 'before');
  const after = mode === 'paired' ? pairs.map(p => p.after) : group.filter(r => r.phase === 'after');

  return (
    <section className="max-w-6xl mx-auto flex flex-col gap-8 print:text-black">
      {/* Header bar */}
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Quay lại khảo sát"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 text-xs font-extrabold border border-red-500/20 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Báo Cáo Khảo Sát Thực Nghiệm · Cổng Quản Trị Viên (Admin)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5 text-slate-900 dark:text-white">
              <BarChart3 className="text-red-600 w-8 h-8 shrink-0" /> Phân Tích Khảo Sát Học Sinh &amp; Giáo Viên
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Hệ thống biểu đồ so sánh Trước &amp; Sau trải nghiệm mô phỏng 3D cho cả Học sinh lẫn Thầy Cô
            </p>
          </div>
        </div>

        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap gap-2.5 print:hidden items-center">
          <button
            onClick={toggleSurveyBatch}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {isOpen ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-amber-600" />}
            {isOpen ? 'Đợt khảo sát: Đang Mở' : 'Đợt khảo sát: Đang Đóng'}
          </button>
          
          <button
            onClick={handleClearAll}
            disabled={busy}
            title="Xóa toàn bộ phản hồi khảo sát"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Dọn sạch
          </button>

          <button className={`${surveyButton} flex items-center gap-1.5 cursor-pointer`} disabled={busy} onClick={refresh}>
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={() => exportSurveyReportToExcel(rows, { role, mode, grade: selectedGradeFilter })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
            title="Xuất toàn bộ báo cáo phân tích và dữ liệu chi tiết ra file Excel chuẩn (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            Xuất Báo Cáo Excel (.xlsx)
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {actionMessage}
        </div>
      )}

      {error && <p role="alert" className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-200">{error}</p>}

      {/* ════════════════════════════════════════════════════════════════════════
          HỆ THỐNG BIỂU ĐỒ PHÂN TÍCH TỰ ĐỘNG DỰA TRÊN KẾT QUẢ CÂU HỎI KHẢO SÁT
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="order-1 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0b0f19] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 space-y-8">
          
          {/* Header Title with 3 Main Tabs */}
          <div className="space-y-4 border-b border-slate-800/80 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  Biểu Đồ Phân Tích Thực Nghiệm Khảo Sát
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <TrendingUp className="text-red-500 w-6 h-6" />
                  Kết Quả Khảo Sát Trước &amp; Sau Trải Nghiệm (Học Sinh &amp; Giáo Viên)
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Dữ liệu tự động tính toán từ các câu hỏi khảo sát theo thang đo chuẩn Likert 5 mức độ (1: Rất thấp ➔ 5: Rất cao)
                </p>
              </div>

              {/* Mode Toggle (Paired vs All) */}
              <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold text-slate-300">
                <span className="text-[11px] text-slate-400 pl-2">Cách so sánh:</span>
                <button
                  type="button"
                  onClick={() => setMode('paired')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${mode === 'paired' ? 'bg-red-600 text-white' : 'hover:text-white'}`}
                >
                  Ghép cặp (Trước & Sau)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${mode === 'all' ? 'bg-red-600 text-white' : 'hover:text-white'}`}
                >
                  Toàn bộ phản hồi
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-2">
              <span className="px-2 text-xs font-bold text-slate-400">Tách biểu đồ theo giai đoạn:</span>
              <button
                type="button"
                onClick={() => setChartPhase('before')}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${chartPhase === 'before' ? 'bg-slate-200 text-slate-900 shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Biểu đồ Trước trải nghiệm
              </button>
              <button
                type="button"
                onClick={() => setChartPhase('after')}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${chartPhase === 'after' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Biểu đồ Sau trải nghiệm
              </button>
            </div>

            {/* 3 CHẾ ĐỘ PHÂN TÍCH TABS */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleTabChange('student')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                🎓 Khảo Sát Học Sinh (Trước vs Sau)
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 ml-1">
                  {studentAnalytics.countTotal} phiếu
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('teacher')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                  activeTab === 'teacher'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <School className="w-4 h-4" />
                👨‍🏫 Khảo Sát Giáo Viên (Trước vs Sau)
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 ml-1">
                  {teacherAnalytics.countTotal} phiếu
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('comparison')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                  activeTab === 'comparison'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <GitCompare className="w-4 h-4" />
                ⚖️ Đối Chiếu Học Sinh &amp; Giáo Viên
              </button>
            </div>

            {/* Filter sub-bar for Students */}
            {activeTab === 'student' && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-bold">Lọc theo khối lớp:</span>
                  {[
                    { id: 'all', label: 'Tất cả khối' },
                    { id: '10', label: 'Khối 10' },
                    { id: '11', label: 'Khối 11' },
                    { id: '12', label: 'Khối 12' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGradeFilter(g.id as any)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        selectedGradeFilter === g.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="text-slate-400">
                  Đã ghép cặp: <strong className="text-blue-400">{studentAnalytics.countPairs} học sinh</strong> (Trước: {studentAnalytics.countBefore} · Sau: {studentAnalytics.countAfter})
                </div>
              </div>
            )}

            {/* Sub-bar for Teachers */}
            {activeTab === 'teacher' && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-purple-400" />
                  <span>Đối tượng khảo sát: <strong>Giáo viên bộ môn GDQP-AN &amp; Tổ trưởng chuyên môn</strong></span>
                </div>
                <div>
                  Đã ghép cặp: <strong className="text-purple-400">{teacherAnalytics.countPairs} giáo viên</strong> (Trước: {teacherAnalytics.countBefore} · Sau: {teacherAnalytics.countAfter})
                </div>
              </div>
            )}

            {/* Sub-bar for Comparison */}
            {activeTab === 'comparison' && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  <span>Đối chiếu đa chiều giữa <strong>Góc nhìn của Người học</strong> và <strong>Đánh giá của Thầy Cô</strong></span>
                </div>
                <div className="text-emerald-400 font-bold">
                  Mức độ đồng thuận sư phạm: {visibleAlignmentRate}%
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              NỘI DUNG TAB 1: KHẢO SÁT HỌC SINH (TRƯỚC VS SAU)
             ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'student' && (
            <div className="space-y-8 animate-fade-in">
              {/* 4 STAT CARDS CHO HỌC SINH */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Điểm Khảo Sát (Trước)</span>
                    <span className="p-1 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px] uppercase">Trước 3D</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-300 font-mono">
                    {studentAnalytics.beforeAvg} / 5
                  </div>
                  <p className="text-[11px] text-slate-500">Mức độ tự đánh giá ban đầu</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Điểm Khảo Sát (Sau)</span>
                    <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><TrendingUp className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-red-400 font-mono">
                    {studentAnalytics.afterAvg} / 5
                  </div>
                  <p className="text-[11px] text-slate-500">Sau khi học với mô phỏng 3D</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Mức Độ Tăng Trưởng</span>
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs">Tăng</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    +{studentAnalytics.percentGrowth}%
                  </div>
                  <p className="text-[11px] text-slate-500">Nâng cao hiệu quả tiếp thu</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Đánh Giá Tốt / Rất Tốt</span>
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><ThumbsUp className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
                    {studentAnalytics.positiveRate}%
                  </div>
                  <p className="text-[11px] text-slate-500">Ưu việt hơn phương pháp cũ</p>
                </div>
              </div>

              {/* MAIN 2-COLUMNS: STUDENT BAR CHARTS + RADAR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* LEFT: 4 LIKERT COMPARATIVE BARS (COL-SPAN-7) */}
                <div className="lg:col-span-7 bg-slate-950/70 p-6 rounded-2xl border border-slate-800/80 space-y-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Biểu Đồ Học Sinh · {chartPhase === 'before' ? 'Trước trải nghiệm' : 'Sau trải nghiệm'} (Thang 5.0)
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">Thang Likert 1-5</span>
                    </div>

                    <div className="space-y-5">
                      {studentAnalytics.criteriaList.map((item) => {
                        const beforeWidth = (item.before / 5) * 100;
                        const afterWidth = (item.after / 5) * 100;

                        return (
                          <div key={item.id} className="space-y-2">
                            <div className="flex items-start justify-between text-xs gap-2">
                              <div>
                                <span className="font-bold text-slate-200 flex items-center gap-2">
                                  {item.icon}
                                  {item.title}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                              </div>
                              {chartPhase === 'after' && <span className="font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                                {item.change}
                              </span>}
                            </div>

                            {/* Bar 1: TRƯỚC TRẢI NGHIỆM */}
                            {chartPhase === 'before' && <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Trước khi học 3D</span>
                                <span className="font-mono font-bold">{item.before} / 5</span>
                              </div>
                              <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-slate-500 rounded-full transition-all duration-700"
                                  style={{ width: `${beforeWidth}%` }}
                                />
                              </div>
                            </div>}

                            {/* Bar 2: SAU TRẢI NGHIỆM */}
                            {chartPhase === 'after' && <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-300">
                                <span className="font-bold text-blue-400">Sau khi học với 3D</span>
                                <span className="font-mono font-bold text-blue-400">{item.after} / 5</span>
                              </div>
                              <div className="h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700 shadow-sm"
                                  style={{ width: `${afterWidth}%` }}
                                />
                              </div>
                            </div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>* Tính toán trực tiếp từ câu trả lời của các phiếu khảo sát Học sinh</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Thang đo Likert 5 mức
                    </span>
                  </div>
                </div>

                {/* RIGHT: STUDENT RADAR + AI SUMMARY (COL-SPAN-5) */}
                <div className="lg:col-span-5 bg-slate-950/70 p-6 rounded-2xl border border-slate-800/80 space-y-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-blue-400" />
                      Radar Năng Lực Học Sinh Đa Chiều (Thang 5.0)
                    </h4>

                    <CompetencyRadarChart
                      axes={studentAnalytics.radarAxes}
                      beforeValues={studentAnalytics.radarBefore}
                      afterValues={studentAnalytics.radarAfter}
                      visiblePhase={chartPhase}
                      beforeLabel="Học sinh (Trước)"
                      afterLabel="Học sinh (Sau)"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      Nhận Xét Từ Dữ Liệu Khảo Sát Học Sinh:
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {studentAnalytics.countBefore > 0 && studentAnalytics.countAfter > 0 ? <>
                        Điểm trung bình từ lựa chọn của học sinh thay đổi từ <strong className="text-slate-300">{studentAnalytics.beforeAvg}/5</strong> lên <strong className="text-blue-400">{studentAnalytics.afterAvg}/5</strong> ({studentAnalytics.percentGrowth >= 0 ? 'tăng' : 'giảm'} <strong className="text-emerald-400">{Math.abs(studentAnalytics.percentGrowth)}%</strong>). Có <strong className="text-blue-400">{studentAnalytics.positiveRate}%</strong> học sinh chọn mức tích cực về hiệu quả 3D và <strong className="text-emerald-400">{studentAnalytics.intentionRate}%</strong> muốn tiếp tục sử dụng.
                      </> : 'Chưa đủ lựa chọn trước và sau trải nghiệm để tạo nhận xét.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              NỘI DUNG TAB 2: KHẢO SÁT GIÁO VIÊN (TRƯỚC VS SAU)
             ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'teacher' && (
            <div className="space-y-8 animate-fade-in">
              {/* 4 STAT CARDS CHO GIÁO VIÊN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Đánh Giá Ban Đầu</span>
                    <span className="p-1 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px] uppercase">Thầy Cô (Trước)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-300 font-mono">
                    {teacherAnalytics.beforeAvg} / 5
                  </div>
                  <p className="text-[11px] text-slate-500">Đánh giá theo phương pháp truyền thống</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Đánh Giá Khi Có 3D</span>
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><School className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
                    {teacherAnalytics.afterAvg} / 5
                  </div>
                  <p className="text-[11px] text-slate-500">Khi sử dụng mô phỏng 3D giảng dạy</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Cải Thiện Sư Phạm</span>
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs">Tăng</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    +{teacherAnalytics.percentGrowth}%
                  </div>
                  <p className="text-[11px] text-slate-500">Gia tăng hiệu quả truyền đạt</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Sẵn Sàng Ứng Dụng</span>
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><Award className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
                    {teacherAnalytics.readyRate}%
                  </div>
                  <p className="text-[11px] text-slate-500">Giáo viên sẵn sàng đưa vào chính khóa</p>
                </div>
              </div>

              {/* MAIN 2-COLUMNS: TEACHER BAR CHARTS + RADAR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* LEFT: 4 TEACHER LIKERT COMPARATIVE BARS (COL-SPAN-7) */}
                <div className="lg:col-span-7 bg-slate-950/70 p-6 rounded-2xl border border-slate-800/80 space-y-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-400" />
                        Biểu Đồ Giáo Viên · {chartPhase === 'before' ? 'Trước trải nghiệm' : 'Sau trải nghiệm'} (Thang 5.0)
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">Thang Likert 1-5</span>
                    </div>

                    <div className="space-y-5">
                      {teacherAnalytics.criteriaList.map((item) => {
                        const beforeWidth = (item.before / 5) * 100;
                        const afterWidth = (item.after / 5) * 100;

                        return (
                          <div key={item.id} className="space-y-2">
                            <div className="flex items-start justify-between text-xs gap-2">
                              <div>
                                <span className="font-bold text-slate-200 flex items-center gap-2">
                                  {item.icon}
                                  {item.title}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                              </div>
                              {chartPhase === 'after' && <span className="font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                                {item.change}
                              </span>}
                            </div>

                            {/* Bar 1: TRƯỚC TRẢI NGHIỆM */}
                            {chartPhase === 'before' && <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Thầy/Cô đánh giá (Trước khi có 3D)</span>
                                <span className="font-mono font-bold">{item.before} / 5</span>
                              </div>
                              <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-slate-500 rounded-full transition-all duration-700"
                                  style={{ width: `${beforeWidth}%` }}
                                />
                              </div>
                            </div>}

                            {/* Bar 2: SAU TRẢI NGHIỆM */}
                            {chartPhase === 'after' && <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-300">
                                <span className="font-bold text-purple-400">Thầy/Cô đánh giá (Sau khi có 3D)</span>
                                <span className="font-mono font-bold text-purple-400">{item.after} / 5</span>
                              </div>
                              <div className="h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 rounded-full transition-all duration-700 shadow-sm"
                                  style={{ width: `${afterWidth}%` }}
                                />
                              </div>
                            </div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>* Tính toán từ phiếu khảo sát của các Thầy Cô giáo viên GDQP-AN</span>
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn sư phạm phổ thông
                    </span>
                  </div>
                </div>

                {/* RIGHT: TEACHER RADAR + AI SUMMARY (COL-SPAN-5) */}
                <div className="lg:col-span-5 bg-slate-950/70 p-6 rounded-2xl border border-slate-800/80 space-y-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-purple-400" />
                      Radar Tác Động Sư Phạm Của Giáo Viên (Thang 5.0)
                    </h4>

                    <CompetencyRadarChart
                      axes={teacherAnalytics.radarAxes}
                      beforeValues={teacherAnalytics.radarBefore}
                      afterValues={teacherAnalytics.radarAfter}
                      visiblePhase={chartPhase}
                      beforeLabel="Giáo viên (Trước)"
                      afterLabel="Giáo viên (Sau)"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Nhận Xét Từ Đánh Giá Của Giáo Viên:
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {teacherAnalytics.countBefore > 0 && teacherAnalytics.countAfter > 0 ? <>
                        Điểm trung bình từ lựa chọn của giáo viên thay đổi từ <strong className="text-slate-300">{teacherAnalytics.beforeAvg}/5</strong> lên <strong className="text-purple-400">{teacherAnalytics.afterAvg}/5</strong> ({teacherAnalytics.percentGrowth >= 0 ? 'tăng' : 'giảm'} <strong className="text-emerald-400">{Math.abs(teacherAnalytics.percentGrowth)}%</strong>). Có <strong className="text-purple-400">{teacherAnalytics.teachingSupportRate}%</strong> giáo viên chọn mức hỗ trợ giảng dạy tích cực và <strong className="text-purple-400">{teacherAnalytics.readyRate}%</strong> sẵn sàng ứng dụng công nghệ này.
                      </> : 'Chưa đủ lựa chọn trước và sau trải nghiệm để tạo nhận xét.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              NỘI DUNG TAB 3: ĐỐI CHIẾU HỌC SINH & GIÁO VIÊN
             ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'comparison' && (
            <div className="space-y-8 animate-fade-in">
              {/* TOP SUMMARY CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Điểm Học Sinh · {chartPhase === 'before' ? 'Trước' : 'Sau'}</span>
                    <span className="p-1 rounded-md bg-blue-500/10 text-blue-400 font-bold text-xs">🎓 Học sinh</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
                    {visibleStudentAvg} / 5
                  </div>
                  <p className="text-[11px] text-slate-500">{chartPhase === 'after' ? `Thay đổi ${comparisonAnalytics.studentGrowth}%` : 'Điểm nền trước trải nghiệm'}</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Điểm Giáo Viên · {chartPhase === 'before' ? 'Trước' : 'Sau'}</span>
                    <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 font-bold text-xs">👨‍🏫 Giáo viên</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
                    {visibleTeacherAvg} / 5
                  </div>
                  <p className="text-[11px] text-slate-500">{chartPhase === 'after' ? `Thay đổi ${comparisonAnalytics.teacherGrowth}%` : 'Điểm nền trước trải nghiệm'}</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Mức Độ Đồng Thuận</span>
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs">Tương quan</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {visibleAlignmentRate}%
                  </div>
                  <p className="text-[11px] text-slate-500">{visibleAlignmentRate > 0 ? `Tính từ lựa chọn ${chartPhase === 'before' ? 'trước' : 'sau'} trải nghiệm` : 'Chưa đủ dữ liệu của cả hai nhóm'}</p>
                </div>

                <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">Tổng Số Người Tham Gia</span>
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Users className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                    {rows.length} phiếu
                  </div>
                  <p className="text-[11px] text-slate-500">Học sinh &amp; Giáo viên đã khảo sát</p>
                </div>
              </div>

              {/* SIDE-BY-SIDE GROUPED BARS FOR EACH COMMON CRITERION */}
              <div className="bg-slate-950/70 p-6 sm:p-8 rounded-2xl border border-slate-800/80 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="font-black text-lg text-white flex items-center gap-2">
                      <GitCompare className="w-5 h-5 text-emerald-400" />
                      Đối Chiếu Đánh Giá Giữa Học Sinh (Người Học) và Giáo Viên (Người Dạy)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      So sánh lựa chọn {chartPhase === 'before' ? 'trước' : 'sau'} trải nghiệm của 4 tiêu chí dùng chung trên thang 5.0
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 🎓 Học sinh
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> 👨‍🏫 Giáo viên
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {comparisonAnalytics.commonCriteria.map((item, idx) => {
                    return (
                      <div key={item.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-200">
                            {idx + 1}. {item.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">Thang 5.0</span>
                        </div>

                        {/* Học sinh Section */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span className="flex items-center gap-1.5 font-bold text-blue-400">
                              🎓 Học sinh:
                            </span>
                            <span className="font-mono text-xs">
                              <strong className="text-blue-400">{chartPhase === 'before' ? item.studentBefore : item.studentAfter} / 5</strong>
                            </span>
                          </div>
                          <div>
                            <div className="text-[10px] text-blue-300 mb-0.5 font-bold">{chartPhase === 'before' ? 'Trước' : 'Sau'}: {chartPhase === 'before' ? item.studentBefore : item.studentAfter}</div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${chartPhase === 'before' ? 'bg-slate-500' : 'bg-blue-500'}`} style={{ width: `${((chartPhase === 'before' ? item.studentBefore : item.studentAfter) / 5) * 100}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Giáo viên Section */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span className="flex items-center gap-1.5 font-bold text-purple-400">
                              👨‍🏫 Giáo viên:
                            </span>
                            <span className="font-mono text-xs">
                              <strong className="text-purple-400">{chartPhase === 'before' ? item.teacherBefore : item.teacherAfter} / 5</strong>
                            </span>
                          </div>
                          <div>
                            <div className="text-[10px] text-purple-300 mb-0.5 font-bold">{chartPhase === 'before' ? 'Trước' : 'Sau'}: {chartPhase === 'before' ? item.teacherBefore : item.teacherAfter}</div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${chartPhase === 'before' ? 'bg-slate-500' : 'bg-purple-500'}`} style={{ width: `${((chartPhase === 'before' ? item.teacherBefore : item.teacherAfter) / 5) * 100}%` }} />
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Synthesis Conclusion Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/30 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h5 className="font-extrabold text-sm text-emerald-300">
                      Kết Luận Thực Nghiệm Sư Phạm Độc Lập
                    </h5>
                    <p className="text-slate-300 leading-relaxed">
                      {visibleAlignmentRate > 0
                        ? `Mức đồng thuận giữa lựa chọn của học sinh và giáo viên ở giai đoạn ${chartPhase === 'before' ? 'trước' : 'sau'} trải nghiệm là ${visibleAlignmentRate}%. Kết luận này được tính trực tiếp từ dữ liệu người dùng đã gửi.`
                        : 'Chưa đủ phản hồi thật từ cả học sinh và giáo viên để đưa ra kết luận đối chiếu.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* KPI Cards (Hỗ trợ bấm trực tiếp để chuyển xem Học sinh / Giáo viên) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={surveyPanel}>
          <p className="text-sm text-slate-500">Tổng phản hồi khảo sát</p>
          <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{rows.length}</p>
        </div>
        <button
          type="button"
          onClick={() => handleTabChange('student')}
          className={`${surveyPanel} text-left cursor-pointer transition-all hover:border-blue-500 ${role === 'student' ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">🎓 Học sinh THPT</p>
            {role === 'student' && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Đang xem</span>}
          </div>
          <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{rows.filter(r => r.role === 'student').length}</p>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('teacher')}
          className={`${surveyPanel} text-left cursor-pointer transition-all hover:border-purple-500 ${role === 'teacher' ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-purple-600 dark:text-purple-400">👨‍🏫 Giáo viên GDQP</p>
            {role === 'teacher' && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">Đang xem</span>}
          </div>
          <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{rows.filter(r => r.role === 'teacher').length}</p>
        </button>
        <div className={surveyPanel}>
          <p className="text-sm text-slate-500">Cặp trước–sau ghép</p>
          <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{pairedResponses(rows).length}</p>
        </div>
      </div>

      {/* Bộ lọc và xuất file */}
      <div className={`${surveyPanel} flex flex-wrap items-end gap-4`}>
        <label className="space-y-2 flex-1 min-w-40">
          <span className="text-xs font-bold">Đang xem số liệu của:</span>
          <select value={role} className={surveyInput} onChange={e => {
            const nextRole = e.target.value as SurveyRole;
            setRole(nextRole);
            setActiveTab(nextRole);
          }}>
            {Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="space-y-2 flex-1 min-w-40">
          <span className="text-xs font-bold">Cách so sánh</span>
          <select value={mode} className={surveyInput} onChange={e => setMode(e.target.value as 'paired' | 'all')}>
            <option value="paired">Cùng người (ghép cặp)</option>
            <option value="all">Tất cả phản hồi trong nhóm</option>
          </select>
        </label>
        <button
          className="flex items-center gap-2 border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-3 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 print:hidden cursor-pointer shadow-xs transition-all active:scale-95"
          onClick={() => exportSurveyReportToExcel(rows, { role, mode, grade: selectedGradeFilter })}
          title="Xuất toàn bộ báo cáo tổng hợp và chi tiết ra file Excel (.xlsx)"
        >
          <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" />
          Xuất Báo Cáo Excel (.xlsx) · {roleLabel[role]}
        </button>
        <button
          className="flex items-center gap-1.5 border rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 print:hidden cursor-pointer"
          onClick={() => downloadCsv(group, `bao-cao-khao-sat-${role}`)}
          title="Tải tệp định dạng CSV"
        >
          <Download size={15} /> CSV
        </button>
        <button
          className="flex items-center gap-2 border rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 print:hidden cursor-pointer"
          onClick={() => window.print()}
        >
          <Printer size={17} className="text-slate-600 dark:text-slate-300" /> In Báo Cáo Phân Tích
        </button>
      </div>

      {group.length === 0 && (
        <div className={`${surveyPanel} text-center py-10 space-y-3 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800`}>
          <p className="text-base font-bold text-amber-900 dark:text-amber-200">
            Hiện chưa có phản hồi nào từ {roleLabel[role]} (Số lượng: 0).
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {role === 'teacher'
              ? 'Để điền phiếu khảo sát dành cho Giáo viên, Thầy hãy quay lại tab [Khảo sát] và chọn mục "Khảo sát Giáo viên" để trả lời câu hỏi và gửi phản hồi.'
              : 'Chưa có dữ liệu khảo sát của nhóm này.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-3 text-xs font-bold border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                📝 Quay lại làm Khảo sát
              </button>
            )}
          </div>
        </div>
      )}

      {/* So sánh trước - sau từng câu hỏi Likert chi tiết */}
      <div className={surveyPanel}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết từng câu hỏi trong phiếu khảo sát · {roleLabel[role]}</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          {mode === 'paired' ? `${pairs.length} người có đủ hai lần trả lời.` : 'Hai nhóm phản hồi có thể gồm những người khác nhau.'} Trước: {before.length} · Sau: {after.length}. Điểm trung bình từ 1 (rất thấp) đến 5 (rất cao).
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {surveyQuestions(role, 'before').slice(0, 4).map(q => {
            const pre = average(before.map(r => r.answers[q.id]?.[0] !== undefined ? r.answers[q.id][0] + 1 : 0).filter(Boolean));
            const post = average(after.map(r => r.answers[q.id]?.[0] !== undefined ? r.answers[q.id][0] + 1 : 0).filter(Boolean));
            return (
              <div key={q.id} className="space-y-3">
                <h4 className="text-sm font-semibold min-h-10 text-slate-800 dark:text-slate-200">{q.text}</h4>
                {[
                  { label: 'Trước', value: pre, color: 'bg-slate-400' },
                  { label: 'Sau', value: post, color: role === 'teacher' ? 'bg-purple-600' : 'bg-red-600' }
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.label}</span>
                      <span className="font-bold">{display(item.value)}</span>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                      <div className={`h-full ${item.color} transition-all`} style={{ width: `${(item.value || 0) * 20}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Chênh lệch: {pre !== null && post !== null ? `${post - pre > 0 ? '+' : ''}${(post - pre).toFixed(2)} điểm` : 'Chưa đủ dữ liệu'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phân bố câu trả lời */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold">Phân bố câu trả lời chi tiết</h3>
        <label className="text-xs font-bold flex items-center gap-2">
          Giai đoạn:
          <select className={`${surveyInput} w-auto py-1.5`} value={phase} onChange={e => setPhase(e.target.value as SurveyPhase)}>
            {Object.entries(phaseLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-slate-500">
        {roleLabel[role]} · {phaseLabel[phase]} · {selected.length} phản hồi đã ghi nhận.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {surveyQuestions(role, phase).map((q, i) => (
          <div key={q.id} className={`${surveyPanel} break-inside-avoid`}>
            <h4 className="font-bold mb-4 text-sm text-slate-900 dark:text-white">
              {i + 1}. {q.text}
            </h4>
            <div className="space-y-3">
              {q.options.map((option, index) => {
                const count = selected.filter(r => r.answers[q.id]?.includes(index)).length;
                const percent = selected.length ? (count / selected.length) * 100 : 0;
                return (
                  <div key={option}>
                    <div className="flex justify-between gap-3 text-xs mb-1">
                      <span>{option}</span>
                      <span className="shrink-0 text-slate-500 font-mono">{count} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${role === 'teacher' ? 'bg-purple-500' : 'bg-red-500'} transition-all`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Khu vực hiển thị ý kiến đóng góp & đề xuất tự luận */}
      <div className={surveyPanel}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <MessageSquareQuote className="w-5 h-5 text-red-600 shrink-0" />
              Ý kiến đóng góp &amp; Đề xuất tự luận ({selected.filter(r => r.feedback?.trim()).length})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tổng hợp các đề xuất cải tiến và chia sẻ từ {roleLabel[role].toLowerCase()} ({phaseLabel[phase].toLowerCase()})
            </p>
          </div>
        </div>
        {selected.filter(r => r.feedback?.trim()).length === 0 ? (
          <p className="text-sm text-slate-400 italic py-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            Chưa có ý kiến đóng góp tự luận nào trong nhóm và giai đoạn này.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {selected.filter(r => r.feedback?.trim()).map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{r.name || r.username || r.code}</span>
                    <span className="text-slate-500 font-medium">({r.className || r.position || roleLabel[r.role]})</span>
                  </div>
                  <time className="text-slate-400 text-[11px] whitespace-nowrap">{new Date(r.createdAt).toLocaleString('vi-VN')}</time>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed italic bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  "{r.feedback}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI tổng hợp toàn bộ góp ý thật, đặt ngay trước khu biểu đồ phân tích. */}
      <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 sm:p-7 shadow-sm dark:border-violet-900/60 dark:from-violet-950/30 dark:via-slate-900 dark:to-blue-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-lg font-black">AI tổng hợp góp ý</h3>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Tự động gom nhóm toàn bộ phản hồi tự luận, tìm vấn đề được nhắc nhiều nhất và đề xuất thứ tự ưu tiên cải thiện. Tên, tài khoản, email và số điện thoại không được đưa vào nội dung phân tích.
            </p>
          </div>
          <button
            type="button"
            disabled={feedbackAiBusy}
            onClick={() => void loadFeedbackAnalysis(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${feedbackAiBusy ? 'animate-spin' : ''}`} />
            {feedbackAiBusy ? 'Đang đọc và tổng hợp…' : 'Phân tích lại bằng AI'}
          </button>
        </div>

        {feedbackAiError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{feedbackAiError}</p>}
        {feedbackAiBusy && !feedbackAnalysis && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-violet-200 bg-white/70 p-5 text-sm text-slate-600 dark:border-violet-900 dark:bg-slate-950/40 dark:text-slate-300">
            <RefreshCw className="h-5 w-5 animate-spin text-violet-500" /> AI đang phân loại các phản hồi và tính tần suất chủ đề…
          </div>
        )}
        {!feedbackAiBusy && !feedbackAnalysis && !feedbackAiError && (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">Chưa có góp ý tự luận để tổng hợp.</p>
        )}

        {feedbackAnalysis && (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-violet-200 bg-white/80 p-4 dark:border-violet-900/60 dark:bg-slate-950/50">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700 dark:bg-violet-950 dark:text-violet-300">{feedbackAnalysis.analyzedCount} góp ý đã phân tích</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{feedbackAnalysis.source === 'ai' ? `Google Gemini · ${feedbackAnalysis.model || 'gemini-3.5-flash'}` : 'Thống kê dự phòng cục bộ'}</span>
                <time className="text-slate-400">{new Date(feedbackAnalysis.generatedAt).toLocaleString('vi-VN')}</time>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{feedbackAnalysis.summary}</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-rose-700 dark:text-rose-300"><Target className="h-4 w-4" /> Vấn đề cần ưu tiên cải thiện</h4>
                <div className="space-y-3">
                  {feedbackAnalysis.priorities.length ? feedbackAnalysis.priorities.map((topic, index) => (
                    <div key={topic.id} className="rounded-2xl border border-rose-100 bg-white/80 p-4 dark:border-rose-950 dark:bg-slate-950/50">
                      <div className="flex items-start justify-between gap-3">
                        <div><span className="mr-2 text-xs font-black text-rose-500">#{index + 1}</span><strong className="text-sm text-slate-800 dark:text-white">{topic.label}</strong><p className="mt-1 text-xs text-slate-500">{topic.description}</p></div>
                        <span className="shrink-0 rounded-lg bg-rose-100 px-2 py-1 text-xs font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">{topic.mentions} lượt · {topic.percentage}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: `${Math.min(100, topic.percentage)}%` }} /></div>
                      {topic.examples[0] && <p className="mt-2 line-clamp-2 text-[11px] italic text-slate-500">“{topic.examples[0]}”</p>}
                    </div>
                  )) : <p className="rounded-xl border border-dashed p-4 text-xs text-slate-500">Chưa phát hiện vấn đề cải thiện nổi bật.</p>}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300"><ThumbsUp className="h-4 w-4" /> Điểm tích cực được nhắc đến</h4>
                  <div className="flex flex-wrap gap-2">
                    {feedbackAnalysis.positives.length ? feedbackAnalysis.positives.map(topic => (
                      <span key={topic.id} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{topic.label} · {topic.mentions} lượt ({topic.percentage}%)</span>
                    )) : <span className="text-xs text-slate-500">Chưa đủ dữ liệu để xác định điểm tích cực nổi bật.</span>}
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <h4 className="mb-3 text-sm font-black text-blue-800 dark:text-blue-300">Đề xuất hành động</h4>
                  {feedbackAnalysis.suggestions.length ? <ol className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {feedbackAnalysis.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`} className="flex gap-2"><span className="font-black text-blue-600">{index + 1}.</span><span>{suggestion}</span></li>)}
                  </ol> : <p className="text-xs text-slate-500">Chưa có đề xuất vì dữ liệu hiện còn ít.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="order-2"><AccountManagement /></div>

      {/* Bảng chi tiết toàn bộ phản hồi */}
      <details className={`${surveyPanel} order-2`}>
        <summary className="font-bold cursor-pointer text-slate-900 dark:text-white">
          Danh sách phản hồi chi tiết ({selected.length})
        </summary>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                <th className="p-2">Người khảo sát</th>
                <th className="p-2">Lớp / Đơn vị</th>
                <th className="p-2">Thời gian</th>
                <th className="p-2">Câu trả lời</th>
                <th className="p-2">Ý kiến đóng góp</th>
                <th className="p-2 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {selected.map(r => (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2 font-bold align-top">
                    {r.name || r.username || r.code}
                    {r.school && <p className="text-[11px] font-normal text-slate-400">{r.school}</p>}
                  </td>
                  <td className="p-2 align-top text-xs font-mono">{r.className || r.position || '—'}</td>
                  <td className="p-2 align-top whitespace-nowrap text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 min-w-64 text-xs">
                    {surveyQuestions(role, phase).map((q, i) => (
                      <p key={q.id} className="mb-1">
                        <strong>{i + 1}.</strong> {r.answers[q.id]?.map(v => q.options[v]).join(', ') || '—'}
                      </p>
                    ))}
                  </td>
                  <td className="p-2 min-w-48 align-top">
                    {r.feedback ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 text-xs whitespace-pre-wrap">
                        {r.feedback}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-2 align-top text-right">
                    <button
                      onClick={() => deleteResponse(r.id, r.name || r.code)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Xóa phản hồi này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
