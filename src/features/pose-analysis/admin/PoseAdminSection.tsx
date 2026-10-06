import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, ChevronLeft, Eye, FileSpreadsheet, Filter, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useAccount } from '../../../components/AccountGate';
import { deletePoseResult, getPoseExportResults, getPoseResult, listPoseResults } from '../results/poseResultsApi';
import type { PoseResultFilters, PoseResultRecord } from '../results/poseResultTypes';
import { EXERCISE_CATALOG } from '../scoring/movements';
import { poseScoreOnTen } from '../results/scoreScale';

type ManagementRole = 'admin' | 'teacher';
const panel = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-900';
const input = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-2 focus:outline-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const button = 'flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
const labels = { pass: 'Đạt', fail: 'Chưa đạt', incomplete: 'Chưa đủ dữ liệu' };
const criterionLabels = { PASS: 'Đạt', NEEDS_ADJUSTMENT: 'Cần điều chỉnh', NOT_ACHIEVED: 'Chưa đạt', NOT_SCORABLE: 'Chưa đủ dữ liệu' };
const time = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' });
type ObservedScore = Pick<PoseResultRecord, 'score' | 'quality'>;
export function poseObservedScore({ score, quality }: ObservedScore) {
  const missing = quality?.unassessedPoints ?? 0;
  return { score: poseScoreOnTen(score), maximum: poseScoreOnTen(Math.max(0, 100 - missing)), partial: missing > 0 };
}
function RecordedScore({ record, large = false }: { record: ObservedScore; large?: boolean }) {
  const value = poseObservedScore(record);
  const maximum = value.maximum;
  return <span className="inline-block"><span className={large ? 'block text-3xl font-black' : 'block whitespace-nowrap font-bold'}>{value.score}<span className={large ? 'text-sm text-slate-500' : ''}>/{maximum}</span></span>{value.partial && <span className="mt-1 block text-[11px] font-normal text-amber-700 dark:text-amber-300">Phần đã đánh giá</span>}</span>;
}

export function PoseAssessmentBadge({ assessment }: { assessment: PoseResultRecord['assessment'] }) {
  const color = assessment === 'pass' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : assessment === 'fail' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300';
  return <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-bold ${color}`}>{labels[assessment]}</span>;
}

export function poseAdminStats(results: PoseResultRecord[]) {
  const complete = results.filter(record => record.assessment !== 'incomplete');
  const passed = results.filter(record => record.assessment === 'pass').length;
  return { total: results.length, average: complete.length ? Number((complete.reduce((sum, record) => sum + record.score, 0) / complete.length).toFixed(1)) : null,
    passed, failed: results.filter(record => record.assessment === 'fail').length, incomplete: results.length - complete.length,
    passRate: complete.length ? Math.round(passed / complete.length * 100) : null };
}

interface ViewProps {
  role: ManagementRole;
  results: PoseResultRecord[];
  filters: Partial<PoseResultFilters>;
  onFilters: (filters: Partial<PoseResultFilters>) => void;
  loading?: boolean;
  exporting?: boolean;
  busyId?: string;
  error?: string;
  onRefresh: () => void;
  onExport: () => void;
  onDetail: (record: PoseResultRecord) => void;
  onDelete: (record: PoseResultRecord) => void;
  onBack?: () => void;
}

/** Presentation is isolated so role-specific actions can be verified without a login session. */
export function PoseAdminView({ role, results, filters, onFilters, loading, exporting, busyId, error, onRefresh, onExport, onDetail, onDelete, onBack }: ViewProps) {
  const stats = useMemo(() => poseAdminStats(results), [results]);
  const fields = useId();
  const change = (key: keyof PoseResultFilters, value: string) => onFilters({ ...filters, [key]: value || undefined });
  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3"><span className="rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold text-white">Giáo viên & Admin</span>{onBack && <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600"><ChevronLeft size={14} />Quay lại AI Pose</button>}</div>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl"><Camera className="shrink-0 text-red-600" />Kết quả AI Pose học sinh</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Theo dõi các lượt thực hành đã hoàn thành theo học sinh, lớp và động tác.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRefresh} disabled={loading} className={button}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Làm mới</button>
        {role === 'admin' && <button type="button" onClick={onExport} disabled={loading || exporting || !results.length} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><FileSpreadsheet size={17} />{exporting ? 'Đang xuất…' : 'Xuất kết quả AI Pose Excel (.xlsx)'}</button>}
      </div>
    </header>
    {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"><AlertCircle size={18} className="shrink-0" />{error}</p>}
    <section aria-label="Thống kê theo bộ lọc" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {[
        ['Tổng lượt thực hiện', stats.total, 'Theo bộ lọc hiện tại'],
        ['Điểm trung bình', stats.average == null ? '—' : `${poseScoreOnTen(stats.average)}/10`, 'Các lượt có kết luận'],
        ['Số lượt đạt', stats.passed, 'Đã xác nhận đạt'],
        ['Số lượt chưa đạt', stats.failed, 'Đã xác nhận cần sửa'],
        ['Tỷ lệ đạt', stats.passRate == null ? '—' : `${stats.passRate}%`, 'Các lượt có kết luận'],
      ].map(([label, value, caption]) => <div key={label} className={panel}><p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{caption}</p></div>)}
    </section>
    {stats.incomplete > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{stats.incomplete} lượt chưa đủ dữ liệu để kết luận; không tính vào tỷ lệ đạt hoặc điểm trung bình.</p>}
    <section className={panel} aria-labelledby={`${fields}-filter-title`}>
      <h2 id={`${fields}-filter-title`} className="mb-4 flex items-center gap-2 text-sm font-bold"><Filter size={17} className="text-red-600" />Tìm kiếm và lọc kết quả</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Họ tên<div className="relative mt-1.5"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className={`${input} pl-9`} maxLength={120} placeholder="Tìm học sinh" value={filters.studentName ?? ''} onChange={event => change('studentName', event.target.value)} /></div></label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Lớp<input className={`${input} mt-1.5`} maxLength={40} placeholder="Ví dụ: 10A1" value={filters.className ?? ''} onChange={event => change('className', event.target.value)} /></label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Động tác<select className={`${input} mt-1.5`} value={filters.movementId ?? ''} onChange={event => change('movementId', event.target.value)}><option value="">Tất cả động tác</option>{EXERCISE_CATALOG.filter(item => item.available).map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Kết luận<select className={`${input} mt-1.5`} value={filters.assessment ?? ''} onChange={event => change('assessment', event.target.value)}><option value="">Tất cả kết quả</option><option value="pass">Đạt</option><option value="fail">Chưa đạt</option><option value="incomplete">Chưa đủ dữ liệu</option></select></label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Từ ngày<input type="date" className={`${input} mt-1.5`} value={filters.from ?? ''} onChange={event => change('from', event.target.value)} /></label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Đến ngày<input type="date" className={`${input} mt-1.5`} value={filters.to ?? ''} min={filters.from} onChange={event => change('to', event.target.value)} /></label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Sắp xếp<select className={`${input} mt-1.5`} value={filters.sort ?? 'newest'} onChange={event => change('sort', event.target.value)}><option value="newest">Mới nhất</option><option value="score">Điểm cao nhất</option></select></label>
        <button type="button" className={`${button} self-end`} onClick={() => onFilters({ sort: 'newest' })}>Xóa bộ lọc</button>
      </div>
    </section>
    <section className={`${panel} overflow-hidden p-0`} aria-label="Danh sách lượt thực hiện">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700"><h2 className="font-bold">Danh sách kết quả</h2><span className="text-xs text-slate-500">{results.length} lượt</span></div>
      {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Đang tải kết quả AI Pose…</p> : !results.length ? <p className="p-10 text-center text-sm text-slate-500">Chưa có kết quả phù hợp với bộ lọc.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr>{['Họ tên', 'Lớp', 'Động tác', 'Điểm', 'Kết luận', 'Thời gian', 'Chi tiết'].map(label => <th scope="col" key={label} className="whitespace-nowrap px-4 py-3">{label}</th>)}{role === 'admin' && <th scope="col" className="px-4 py-3">Xóa</th>}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{results.map(record => <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="px-4 py-3 font-bold">{record.studentName}</td><td className="px-4 py-3">{record.className}</td><td className="px-4 py-3">{record.movementLabel}</td><td className="px-4 py-3"><RecordedScore record={record} /></td><td className="px-4 py-3"><PoseAssessmentBadge assessment={record.assessment} /></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{time(record.finishedAt)}</td><td className="px-4 py-3"><button type="button" className={button} disabled={busyId === record.id} onClick={() => onDetail(record)} aria-label={`Xem kết quả của ${record.studentName}`}><Eye size={15} />Xem</button></td>{role === 'admin' && <td className="px-4 py-3"><button type="button" disabled={busyId === record.id} onClick={() => onDelete(record)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950" aria-label={`Xóa kết quả của ${record.studentName}`}><Trash2 size={17} /></button></td>}</tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function CriteriaDetail({ criteria }: { criteria: PoseResultRecord['criteria'] }) {
  return <div className="divide-y divide-slate-200 dark:divide-slate-700">{criteria.map(item => <div className="py-3" key={item.id}><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.label}{item.required && <span className="ml-2 text-[10px] text-red-600">Bắt buộc</span>}</p><p className="shrink-0 font-bold">{item.statusLevel === 'NOT_SCORABLE' ? '—' : poseScoreOnTen(item.points)} / {poseScoreOnTen(item.maximum)}</p></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{criterionLabels[item.statusLevel]} · {item.feedback}</p></div>)}</div>;
}

export function PoseRecordDetail({ record }: { record: PoseResultRecord }) {
  const fixes = record.conciseFeedback.filter(item => item.type === 'MOTION_ERROR');
  const missing = record.conciseFeedback.filter(item => item.type === 'INSUFFICIENT_EVIDENCE');
  return <div className="space-y-5 p-5 text-sm">
    {record.preconditionResult && <section aria-label="Tiền đề — Đứng nghiêm" className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
      <h4 className="font-black">Tiền đề — Đứng nghiêm</h4><RecordedScore record={record.preconditionResult} /><PoseAssessmentBadge assessment={record.preconditionResult.assessment} />
      <CriteriaDetail criteria={record.preconditionResult.criteria} /><p className="text-xs text-slate-500">Điểm riêng, không cộng vào điểm động tác chính.</p>
    </section>}
    {record.preconditionResult && <h4 className="font-black">Động tác chính</h4>}
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-black">{record.studentName}</h3><p className="mt-1 text-slate-500">Lớp {record.className} · {record.movementLabel}</p></div><div className="space-y-2 text-right"><RecordedScore record={record} large /><PoseAssessmentBadge assessment={record.assessment} /></div></div>
    <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 sm:grid-cols-2">
      <div><dt className="text-xs text-slate-500">Tiêu chí bắt buộc</dt><dd className="mt-1 font-bold">{record.requiredCriteriaPassed == null ? 'Chưa đủ dữ liệu' : record.requiredCriteriaPassed ? 'Đạt' : 'Chưa đạt'}</dd></div>
      <div><dt className="text-xs text-slate-500">Xử lý sau khi hoàn thành</dt><dd className="mt-1 font-bold">{record.processingLatencyMs == null ? 'Chưa đo được' : `${record.processingLatencyMs} ms`}</dd></div>
      <div><dt className="text-xs text-slate-500">Bắt đầu</dt><dd className="mt-1">{time(record.startedAt)}</dd></div><div><dt className="text-xs text-slate-500">Hoàn thành</dt><dd className="mt-1">{time(record.finishedAt)}</dd></div>
      {record.quality?.confidence != null && <div><dt className="text-xs text-slate-500">Độ tin cậy dữ liệu khớp</dt><dd className="mt-1">{Math.round(record.quality.confidence * 100)}%</dd></div>}
      {(record.quality?.unassessedPoints ?? 0) > 0 && <div><dt className="text-xs text-slate-500">Điểm tiêu chí chưa đánh giá</dt><dd className="mt-1">{poseScoreOnTen(record.quality!.unassessedPoints!)} điểm</dd></div>}
    </dl>
    <section><h4 className="font-black">Cần sửa</h4>{fixes.length ? <ul className="mt-2 space-y-2">{fixes.map((item, index) => <li key={`${item.criterionId}-${index}`} className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200"><span className="font-bold">{item.label}</span> → {item.message}</li>)}</ul> : <p className="mt-2 flex items-center gap-2 text-slate-500"><CheckCircle2 size={16} />Chưa ghi nhận lỗi động tác cần sửa.</p>}</section>
    {missing.length > 0 && <section><h4 className="font-black">Camera chưa đủ dữ liệu</h4><ul className="mt-2 space-y-2">{missing.map((item, index) => <li key={`${item.criterionId}-${index}`} className="rounded-xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><span className="font-bold">{item.label}</span> → {item.message}</li>)}</ul></section>}
    <section><h4 className="font-black">Chi tiết tiêu chí</h4><CriteriaDetail criteria={record.criteria} /></section>
    {record.stepResults?.length ? <section className="space-y-3"><h4 className="font-black">Kết quả từng bước</h4>{record.stepResults.map(step => <details className="rounded-xl border border-slate-200 p-3 dark:border-slate-700" key={step.movementId}><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-bold"><span>{step.movementLabel}</span><RecordedScore record={step} /><PoseAssessmentBadge assessment={step.assessment} /></summary><CriteriaDetail criteria={step.criteria} /></details>)}</section> : null}
    <p className="text-xs text-slate-500">Mã lượt: {record.id} · Phiên bản: {record.rubricVersion}</p>
  </div>;
}

function DetailDialog({ record, onClose }: { record: PoseResultRecord | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const title = useId();
  useEffect(() => {
    if (!record || !ref.current) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current.showModal(); heading.current?.focus();
    return () => { ref.current?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [record]);
  return <dialog ref={ref} aria-labelledby={title} onCancel={event => { event.preventDefault(); onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-700 dark:bg-slate-900"><h2 ref={heading} tabIndex={-1} id={title} className="font-black outline-none">Chi tiết kết quả AI Pose</h2><button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button></div>{record && <PoseRecordDetail record={record} />}</dialog>;
}

export default function PoseAdminSection({ onBack }: { onBack?: () => void }) {
  const { user, loading: accountLoading, openLogin } = useAccount();
  const currentUser = useRef(user); currentUser.current = user;
  const allowed = user?.role === 'teacher' || user?.role === 'admin';
  const [filters, setFilters] = useState<Partial<PoseResultFilters>>({ sort: 'newest' });
  const [results, setResults] = useState<PoseResultRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<PoseResultRecord | null>(null);
  const [refresh, setRefresh] = useState(0);
  const detailRequest = useRef<AbortController | null>(null);
  const exportRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    setResults([]); setSelected(null); setBusyId(''); setError('');
    detailRequest.current?.abort(); exportRequest.current?.abort();
    if (!allowed || accountLoading) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    const delay = setTimeout(() => {
      listPoseResults(filters, controller.signal).then(data => { if (!controller.signal.aborted) setResults(data); })
        .catch(cause => { if (!controller.signal.aborted) setError((cause as Error).message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, filters.studentName || filters.className ? 250 : 0);
    return () => { clearTimeout(delay); controller.abort(); };
  }, [allowed, accountLoading, user?.id, user?.role, filters, refresh]);
  useEffect(() => () => { detailRequest.current?.abort(); exportRequest.current?.abort(); }, []);

  async function showDetail(record: PoseResultRecord) {
    detailRequest.current?.abort();
    const controller = new AbortController(); detailRequest.current = controller;
    setBusyId(record.id); setError('');
    try { const detail = await getPoseResult(record.id, controller.signal); if (!controller.signal.aborted) setSelected(detail); }
    catch (cause) { if (!controller.signal.aborted) setError((cause as Error).message); }
    finally { if (!controller.signal.aborted) setBusyId(''); }
  }
  async function remove(record: PoseResultRecord) {
    if (currentUser.current?.role !== 'admin' || !window.confirm(`Xóa lượt ${record.movementLabel} của ${record.studentName}, lớp ${record.className}?`)) return;
    setBusyId(record.id); setError('');
    try { await deletePoseResult(record.id); if (currentUser.current?.role === 'admin') setRefresh(value => value + 1); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusyId(''); }
  }
  async function exportResults() {
    const adminId = currentUser.current?.role === 'admin' ? currentUser.current.id : null;
    if (!adminId || exporting) return;
    const controller = new AbortController(); exportRequest.current = controller;
    const isAdmin = () => !controller.signal.aborted && currentUser.current?.id === adminId && currentUser.current.role === 'admin';
    setExporting(true); setError('');
    try {
      const records = await getPoseExportResults(filters, controller.signal);
      if (controller.signal.aborted || !isAdmin()) return;
      const { exportPoseResultsToExcel } = await import('../results/poseExcelExport');
      if (!controller.signal.aborted) await exportPoseResultsToExcel(records, isAdmin);
    } catch (cause) { if (!controller.signal.aborted) setError((cause as Error).message); }
    finally { setExporting(false); }
  }

  if (accountLoading) return <p role="status" className="p-12 text-center text-sm text-slate-500">Đang kiểm tra tài khoản…</p>;
  if (!allowed) return <div className={`${panel} mx-auto max-w-xl text-center`}><Camera size={30} className="mx-auto text-red-600" /><h1 className="mt-3 text-xl font-black">Kết quả AI Pose học sinh</h1><p className="mt-3 text-sm text-slate-500">Chỉ giáo viên và Admin được xem trang quản lý kết quả.</p>{!user && <button type="button" onClick={openLogin} className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white">Đăng nhập</button>}{onBack && <button type="button" onClick={onBack} className="mt-4 block w-full text-sm text-slate-500">Quay lại AI Pose</button>}</div>;
  return <><PoseAdminView role={user.role as ManagementRole} results={results} filters={filters} onFilters={setFilters} loading={loading} exporting={exporting} busyId={busyId} error={error} onRefresh={() => setRefresh(value => value + 1)} onExport={exportResults} onDetail={showDetail} onDelete={remove} onBack={onBack} /><DetailDialog record={selected} onClose={() => setSelected(null)} /></>;
}
