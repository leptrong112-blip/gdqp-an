import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Trash2, Layers, Plus, CheckCircle2, History } from 'lucide-react';
import { type SurveyResponse, type SurveyRound, type SurveyRole, type SurveyPhase, phaseLabel, roleLabel } from '../data/survey';
import { filterRound, roundComparison } from '../data/surveyRounds';
import { surveyApi, surveyButton, surveyInput, surveyPanel } from './SurveySection';

export default function SurveyRoundsPanel({ rounds, allRows, selected, activeId, onSelect, onRefresh }: {
  rounds: SurveyRound[]; allRows: SurveyResponse[]; selected: string; activeId: string;
  onSelect: (id: string) => void; onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [role, setRole] = useState<SurveyRole>('student');
  const [phase, setPhase] = useState<SurveyPhase>('after');
  const [grade, setGrade] = useState('all');

  const activeRounds = rounds.filter(r => !r.deletedAt);
  const deletedRounds = rounds.filter(r => !!r.deletedAt);

  const left = activeRounds.find(r => r.id === leftId) || activeRounds[0];
  const right = activeRounds.find(r => r.id === rightId) || activeRounds.at(-1);
  const report = left && right && left.id !== right.id ? roundComparison(allRows, left.id, right.id, role, phase, grade) : [];
  const value = (v: number | null, unit: string) => v === null ? 'Chưa có dữ liệu' : `${v.toFixed(2)}${unit}`;
  const difference = (a: number | null, b: number | null, unit: string) => a === null || b === null ? '—' : `${b - a > 0 ? '+' : ''}${(b - a).toFixed(2)} ${unit === '%' ? 'điểm %' : 'điểm'}`;

  async function action(fn: () => Promise<void>) {
    setBusy(true); setError('');
    try { await fn(); await onRefresh(); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const activeRound = activeRounds.find(r => r.id === activeId) || rounds.find(r => r.id === activeId);

  return (
    <section className={`${surveyPanel} space-y-5 print:hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <History className="w-5 h-5 text-red-600" />
            Lịch sử &amp; Quản lý các đợt khảo sát
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Mỗi đợt lưu riêng kết quả của từng phiên bản website. Tạo đợt mới không xóa hay ghi đè dữ liệu cũ. “Trước/Sau trải nghiệm” vẫn là hai phần trong mỗi đợt.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Đợt đang nhận phiếu: <strong>{activeRound?.name || 'Đang tải...'}</strong></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Layers className="w-4 h-4 text-blue-500" />
          <span>Báo cáo đang xem:</span>
          <select 
            className={`${surveyInput} w-auto py-1.5 text-xs font-bold`} 
            value={selected} 
            onChange={e => onSelect(e.target.value)}
          >
            <option value="all">Tất cả các đợt (tổng hợp)</option>
            {activeRounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <span className="text-[11px] text-slate-400">
          (Biểu đồ, AI tổng hợp, danh sách góp ý và file xuất Excel phía dưới áp dụng cho đợt được chọn)
        </span>
      </div>

      {/* Danh sách các đợt đang hoạt động */}
      <div className="space-y-2.5">
        {activeRounds.map(r => {
          const isActive = r.id === activeId;
          const isSelected = r.id === selected;
          const countAfter = filterRound(allRows, r.id).filter(row => row.phase === 'after').length;
          const countTotal = filterRound(allRows, r.id).length;

          return (
            <div 
              key={r.id} 
              onClick={() => onSelect(r.id)}
              className={`rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 border transition-all cursor-pointer ${
                isSelected 
                  ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 ring-2 ring-emerald-500 shadow-md' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className={`text-sm font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>{r.name}</strong>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-xs">
                      ✓ Đang xem số liệu
                    </span>
                  )}
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Đang nhận phiếu
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tạo: {new Date(r.createdAt).toLocaleString('vi-VN')} · <strong className="text-slate-700 dark:text-slate-300">{countAfter} phiếu sau</strong> (Tổng {countTotal} phiếu)
                </p>
                {r.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap italic mt-1">
                    "{r.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                {!isActive && (
                  <button
                    type="button"
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800/80 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm(`Mở nhận phiếu cho "${r.name}"? Phiếu đang điền ở đợt khác sẽ cần tải lại. Lịch sử vẫn giữ nguyên.`)) return;
                      void action(async () => {
                        await surveyApi('config', { method: 'POST', body: JSON.stringify({ activeRoundId: r.id, isOpen: true }) });
                        onSelect(r.id);
                      });
                    }}
                    title="Kích hoạt đợt này để học sinh và giáo viên điền phiếu"
                  >
                    Mở nhận phiếu đợt này
                  </button>
                )}

                {activeRounds.length > 1 && (
                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-all cursor-pointer"
                    disabled={busy}
                    title={`Xóa đợt "${r.name}"`}
                    onClick={() => {
                      const count = filterRound(allRows, r.id).length;
                      const isZero = count === 0;
                      const prompt = isZero 
                        ? `Bạn có chắc chắn muốn xóa đợt khảo sát "${r.name}" không?` 
                        : `Đợt "${r.name}" đang có ${count} phiếu khảo sát. Bạn có chắc chắn muốn xóa không?\n(Dữ liệu sẽ được lưu an toàn trong Thùng rác).`;
                      if (!window.confirm(prompt)) return;
                      void action(async () => {
                        const endpoint = isZero ? `rounds/${r.id}?permanent=true` : `rounds/${r.id}`;
                        await surveyApi(endpoint, { method: 'DELETE' });
                        if (selected === r.id) {
                          const remaining = activeRounds.filter(item => item.id !== r.id);
                          if (remaining.length > 0) onSelect(remaining[0].id);
                        }
                      });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Thùng rác các đợt đã xóa */}
      {deletedRounds.length > 0 && (
        <details className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-900/40">
          <summary className="font-bold text-xs cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-slate-400" />
              Thùng rác ({deletedRounds.length} đợt đã xóa)
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Nhấp để xem / khôi phục</span>
          </summary>
          <div className="mt-3 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {deletedRounds.map(r => {
              const countTotal = filterRound(allRows, r.id).length;
              return (
                <div key={r.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 line-through mr-2">{r.name}</strong>
                    <span className="text-slate-400 text-[11px]">
                      (Đã xóa: {r.deletedAt ? new Date(r.deletedAt).toLocaleString('vi-VN') : '—'} · {countTotal} phiếu)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void action(async () => {
                          await surveyApi(`rounds/${r.id}/restore`, { method: 'POST' });
                        });
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg cursor-pointer transition-all"
                    >
                      Khôi phục
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(`Xóa vĩnh viễn đợt "${r.name}"? Dữ liệu không thể khôi phục sau khi xóa.`)) return;
                        void action(async () => {
                          await surveyApi(`rounds/${r.id}?permanent=true`, { method: 'DELETE' });
                        });
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-lg cursor-pointer transition-all"
                    >
                      Xóa vĩnh viễn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Form tạo đợt mới */}
      <details className="group border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 transition-all">
        <summary className="font-bold text-xs cursor-pointer text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-red-500" />
            Tạo thêm đợt khảo sát mới (giữ nguyên dữ liệu cũ)
          </span>
          <span className="text-[11px] text-slate-400 group-open:hidden">+ Bấm để mở</span>
        </summary>

        <form 
          className="space-y-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800" 
          onSubmit={e => {
            e.preventDefault();
            void action(async () => {
              await surveyApi('rounds', { method: 'POST', body: JSON.stringify({ name, notes }) });
              setName('');
              setNotes('');
            });
          }}
        >
          <label className="block text-xs font-bold">
            Tên đợt mới
            <input 
              className={`${surveyInput} mt-1 text-xs`} 
              required 
              maxLength={100} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ví dụ: Đợt 2 — sau cải tiến website và bổ sung bài giảng 3D" 
            />
          </label>
          <label className="block text-xs font-bold">
            Ghi chú / Phiên bản web đã cải tiến
            <textarea 
              className={`${surveyInput} mt-1 text-xs`} 
              maxLength={2000} 
              rows={2}
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Ví dụ: Tối ưu thời gian tải 3D, bổ sung tính năng chấm điểm AI camera..." 
            />
          </label>
          <div className="flex items-center gap-3">
            <button 
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50" 
              disabled={busy || !name.trim()}
            >
              {busy ? 'Đang tạo...' : 'Tạo đợt mới — giữ nguyên lịch sử'}
            </button>
            <span className="text-[11px] text-slate-400">
              Sau khi tạo, bạn có thể bấm "Mở nhận phiếu đợt này" khi sẵn sàng.
            </span>
          </div>
        </form>
      </details>

      {error && <p role="alert" className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900">{error}</p>}

      {/* Đối chiếu giữa 2 đợt */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
        <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          So sánh kết quả giữa 2 đợt khảo sát (Trước &amp; Sau cải tiến website)
        </h4>
        {activeRounds.length < 2 ? (
          <p className="text-xs text-slate-400 italic">Cần ít nhất hai đợt khảo sát để thực hiện so sánh đối chiếu.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <label className="space-y-1 font-bold">
                Đợt gốc:
                <select className={`${surveyInput} py-1.5 text-xs`} value={left?.id} onChange={e => setLeftId(e.target.value)}>
                  {activeRounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 font-bold">
                Đợt đối chiếu:
                <select className={`${surveyInput} py-1.5 text-xs`} value={right?.id} onChange={e => setRightId(e.target.value)}>
                  {activeRounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 font-bold">
                Đối tượng:
                <select className={`${surveyInput} py-1.5 text-xs`} value={role} onChange={e => setRole(e.target.value as SurveyRole)}>
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                </select>
              </label>
              <label className="space-y-1 font-bold">
                Phần câu hỏi:
                <select className={`${surveyInput} py-1.5 text-xs`} value={phase} onChange={e => setPhase(e.target.value as SurveyPhase)}>
                  <option value="after">Sau trải nghiệm (đánh giá web)</option>
                  <option value="before">Trước trải nghiệm</option>
                </select>
              </label>
              {role === 'student' && (
                <label className="space-y-1 font-bold">
                  Khối lớp:
                  <select className={`${surveyInput} py-1.5 text-xs`} value={grade} onChange={e => setGrade(e.target.value)}>
                    {['all', '10', '11', '12'].map(g => <option key={g} value={g}>{g === 'all' ? 'Tất cả khối' : `Khối ${g}`}</option>)}
                  </select>
                </label>
              )}
            </div>

            {left?.id === right?.id ? (
              <p role="alert" className="text-xs text-amber-600 dark:text-amber-400">Hãy chọn hai đợt khác nhau để so sánh.</p>
            ) : (
              <>
                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-slate-500">So sánh theo cùng câu hỏi, đối tượng và phần trải nghiệm.</p>
                  <button 
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs" 
                    onClick={() => {
                      const wb = XLSX.utils.book_new();
                      const table = [
                        [`So sánh: ${left?.name} → ${right?.name}`], 
                        [roleLabel[role], phaseLabel[phase], role === 'student' ? `Khối: ${grade}` : ''], 
                        ['Tiêu chí', left?.name, 'Số phiếu', right?.name, 'Số phiếu', 'Chênh lệch'],
                        ...report.map(r => [r.label, value(r.left.value, r.unit), r.left.n, value(r.right.value, r.unit), r.right.n, difference(r.left.value, r.right.value, r.unit)])
                      ];
                      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(table), 'So_sanh_cac_dot');
                      XLSX.writeFile(wb, `so-sanh-dot-${new Date().toISOString().slice(0, 10)}.xlsx`);
                    }}
                  >
                    Xuất Excel so sánh hai đợt (.xlsx)
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Tiêu chí</th>
                        <th className="p-2.5">{left?.name}</th>
                        <th className="p-2.5">{right?.name}</th>
                        <th className="p-2.5">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map(r => (
                        <tr key={r.key} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="p-2.5 min-w-56 font-medium">{r.label}</td>
                          <td className="p-2.5">{value(r.left.value, r.unit)}<small className="block text-slate-400">n = {r.left.n}</small></td>
                          <td className="p-2.5">{value(r.right.value, r.unit)}<small className="block text-slate-400">n = {r.right.n}</small></td>
                          <td className="p-2.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">{difference(r.left.value, r.right.value, r.unit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
