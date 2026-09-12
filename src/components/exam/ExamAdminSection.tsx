import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchExamResultsFromServer,
  deleteExamResultOnServer,
} from '../../utils/examEngine';
import { ExamResultRecord } from '../../types/exam';
import ExamResultModal from './ExamResultModal';
import {
  BarChart3,
  Download,
  Printer,
  Search,
  Filter,
  Trash2,
  Eye,
  Award,
  Clock,
  UserCheck,
  RefreshCw,
  ArrowUpDown,
  GraduationCap,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function ExamAdminSection({ onBack }: { onBack?: () => void }) {
  const [results, setResults] = useState<ExamResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [selectedRecord, setSelectedRecord] = useState<ExamResultRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const serverResults = await fetchExamResultsFromServer();
      setResults(serverResults);
    } catch (e) {
      setResults([]);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Danh sách các lớp xuất hiện trong dữ liệu
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => {
      if (r.studentClass) set.add(r.studentClass);
    });
    return Array.from(set).sort();
  }, [results]);

  // Bộ lọc và tìm kiếm
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // Tìm theo tên học sinh
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const name = (item.studentName || '').toLowerCase();
        const studentClass = (item.studentClass || '').toLowerCase();
        if (!name.includes(query) && !studentClass.includes(query)) return false;
      }

      // Lọc theo lớp
      if (selectedClass !== 'all' && item.studentClass !== selectedClass) {
        return false;
      }

      // Lọc theo khối
      if (selectedGrade !== 'all') {
        if (selectedGrade === '10' && item.mode !== 'grade_10') return false;
        if (selectedGrade === '11' && item.mode !== 'grade_11') return false;
        if (selectedGrade === '12' && item.mode !== 'grade_12') return false;
        if (selectedGrade === 'thpt' && item.mode !== 'all') return false;
      }

      // Lọc theo thời lượng làm bài
      if (selectedTimeFilter !== 'all') {
        const limit = item.timeLimitMinutes || 45;
        if (selectedTimeFilter === '15' && limit !== 15) return false;
        if (selectedTimeFilter === '30' && limit !== 30) return false;
        if (selectedTimeFilter === '45' && limit !== 45) return false;
        if (selectedTimeFilter === 'free' && limit !== 0) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'highest') return b.score - a.score;
      if (sortBy === 'lowest') return a.score - b.score;
      return b.submittedAt - a.submittedAt; // 'newest'
    });
  }, [results, searchQuery, selectedClass, selectedGrade, selectedTimeFilter, sortBy]);

  // Thống kê tổng hợp (KPI)
  const stats = useMemo(() => {
    const total = filteredResults.length;
    if (total === 0) {
      return { total: 0, avg: 0, excellent: 0, good: 0, average: 0, weak: 0 };
    }

    const sum = filteredResults.reduce((acc, cur) => acc + cur.score, 0);
    const avg = Number((sum / total).toFixed(2));

    const excellent = filteredResults.filter(r => r.score >= 8.0).length;
    const good = filteredResults.filter(r => r.score >= 6.5 && r.score < 8.0).length;
    const average = filteredResults.filter(r => r.score >= 5.0 && r.score < 6.5).length;
    const weak = filteredResults.filter(r => r.score < 5.0).length;

    return { total, avg, excellent, good, average, weak };
  }, [filteredResults]);

  // Hàm xếp loại học lực
  const getRankBadge = (score: number) => {
    if (score >= 8.0) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">Giỏi</span>;
    }
    if (score >= 6.5) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300">Khá</span>;
    }
    if (score >= 5.0) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300">Trung bình</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300">Chưa đạt</span>;
  };

  // Xuất file CSV / Excel với BOM UTF-8 không lỗi font tiếng Việt
  const handleExportCsv = () => {
    if (filteredResults.length === 0) {
      alert('Không có dữ liệu để xuất file.');
      return;
    }

    const headers = [
      'STT',
      'Họ và tên học sinh',
      'Lớp',
      'Khối lớp',
      'Tên bài kiểm tra',
      'Thời lượng đề (phút)',
      'Thời gian làm (giây)',
      'Điểm số (thang 10)',
      'Điểm MCQ',
      'Điểm Đúng/Sai',
      'Điểm Tự luận',
      'Xếp loại',
      'Độ chính xác (%)',
      'Thời gian nộp bài',
    ];

    const rows = filteredResults.map((r, idx) => [
      idx + 1,
      r.studentName || 'Học sinh',
      r.studentClass || 'Chưa phân lớp',
      r.mode === 'all' ? 'Tổng hợp THPT' : `Lớp ${r.mode.replace('grade_', '')}`,
      r.examTypeTitle || 'Bài kiểm tra GDQP-AN',
      r.timeLimitMinutes || 45,
      r.durationSpentSeconds || 0,
      r.score,
      r.mcqScore,
      r.tfScore,
      r.essayScore || 0,
      r.score >= 8.0 ? 'Giỏi' : r.score >= 6.5 ? 'Khá' : r.score >= 5.0 ? 'Trung bình' : 'Chưa đạt',
      `${r.accuracyPercent}%`,
      new Date(r.submittedAt).toLocaleString('vi-VN'),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    // Thêm BOM (\uFEFF) để Excel nhận dạng tiếng Việt có dấu chuẩn
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bang-diem-gdqp-an-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Xóa kết quả bài thi
  const handleDeleteResult = async (id: string) => {
    try {
      await deleteExamResultOnServer(id);
      setResults(prev => prev.filter(r => r.id !== id));
      setDeleteConfirmId(null);
    } catch (e) {
      alert('Không thể xóa bài thi này.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {/* HEADER QUẢN LÝ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white uppercase tracking-wider">
              Dành Cho Giáo Viên & Admin
            </span>
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer"
              >
                ‹ Quay lại đề thi
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-red-600" /> Quản Lý Kết Quả Kiểm Tra Học Sinh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp điểm số, theo dõi tiến độ thi thử và quản lý chất lượng học tập GDQP-AN theo từng lớp
          </p>
        </div>

        {/* NÚT TÁC VỤ NHANH */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-all"
            title="Xuất bảng điểm ra file Excel/CSV chuẩn tiếng Việt"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel / CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 shadow-md cursor-pointer transition-all"
            title="In bảng điểm danh sách học sinh"
          >
            <Printer className="w-4 h-4" />
            In Bảng Điểm
          </button>
        </div>
      </div>

      {/* THỐNG KÊ TỔNG HỢP (KPI CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tổng Lượt Thi</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{stats.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Điểm Trung Bình</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">{stats.avg}/10</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Học lực Giỏi (≥ 8.0)</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {stats.excellent} <span className="text-xs font-sans font-medium text-emerald-700/80">({stats.total ? Math.round(stats.excellent/stats.total*100) : 0}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Học lực Khá (6.5 - 7.9)</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {stats.good} <span className="text-xs font-sans font-medium text-blue-700/80">({stats.total ? Math.round(stats.good/stats.total*100) : 0}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Trung Bình (5.0 - 6.4)</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {stats.average} <span className="text-xs font-sans font-medium text-amber-700/80">({stats.total ? Math.round(stats.average/stats.total*100) : 0}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 shadow-xs">
          <div className="text-[11px] font-bold text-red-700 dark:text-red-300">Chưa Đạt (&lt; 5.0)</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono mt-1">
            {stats.weak} <span className="text-xs font-sans font-medium text-red-700/80">({stats.total ? Math.round(stats.weak/stats.total*100) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC ĐA NĂNG */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Ô tìm kiếm theo tên/lớp */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo họ tên học sinh hoặc lớp..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          {/* Lọc theo lớp */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Lớp:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Tất cả các lớp</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Lọc theo khối */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Khối:</span>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Tất cả khối</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
              <option value="thpt">Tổng hợp THPT</option>
            </select>
          </div>

          {/* Lọc theo thời lượng */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Thời gian:</span>
            <select
              value={selectedTimeFilter}
              onChange={e => setSelectedTimeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Tất cả đề</option>
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="45">45 phút</option>
              <option value="free">Luyện tập tự do</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="newest">Mới nộp nhất</option>
              <option value="highest">Điểm cao nhất</option>
              <option value="lowest">Điểm thấp nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH BÀI LÀM CỦA HỌC SINH */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>Danh sách kết quả</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredResults.length} bài nộp
            </span>
          </h3>
        </div>

        {filteredResults.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto opacity-40 text-amber-500" />
            <p className="text-sm font-semibold">Chưa có kết quả bài kiểm tra nào phù hợp với bộ lọc.</p>
            <p className="text-xs text-slate-500">Học sinh làm bài thi thử trên website sẽ tự động xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">STT</th>
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-4">Lớp</th>
                  <th className="py-3.5 px-4">Khối</th>
                  <th className="py-3.5 px-4">Bài thi / Đề</th>
                  <th className="py-3.5 px-4 text-center">Điểm số</th>
                  <th className="py-3.5 px-4 text-center">Xếp loại</th>
                  <th className="py-3.5 px-4 text-center">Thời gian làm</th>
                  <th className="py-3.5 px-4">Ngày giờ nộp</th>
                  <th className="py-3.5 px-4 text-center print:hidden">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResults.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {r.studentName || 'Học sinh'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs border border-blue-200 dark:border-blue-900">
                        {r.studentClass || '10A1'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {r.mode === 'all' ? 'Tổng hợp THPT' : `Lớp ${r.mode.replace('grade_', '')}`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>{r.examTypeTitle || 'Đề kiểm tra'}</div>
                      <div className="text-[10px] text-slate-400">
                        {r.format === 'full' ? 'Đề chuẩn 3 Phần' : r.format === 'true_false' ? 'Đúng/Sai' : r.format === 'essay' ? 'Tự luận' : 'Trắc nghiệm ABCD'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        {r.score}
                      </span>
                      <span className="text-[10px] text-slate-400">/10</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getRankBadge(r.score)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                      {Math.floor((r.durationSpentSeconds || 0) / 60)}p {Math.floor((r.durationSpentSeconds || 0) % 60)}s
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {new Date(r.submittedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Xem chi tiết bài làm của học sinh"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(r.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Xóa bài thi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT BÀI LÀM CỦA HỌC SINH */}
      {selectedRecord && (
        <ExamResultModal
          result={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* MODAL XÁC NHẬN XÓA BẢN GHI */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Xác nhận xóa kết quả?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa bản ghi kết quả bài kiểm tra này? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDeleteResult(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
