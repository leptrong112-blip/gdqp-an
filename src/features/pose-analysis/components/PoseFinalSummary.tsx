import { useState, type ReactNode } from 'react';
import type { ScoreResult } from '../scoring/scoringTypes';
import type { MovementId } from '../types';
import { EXERCISE_CATALOG } from '../scoring/movements';
import { concisePoseFeedback } from '../results/resultPresentation';
import { poseScoreOnTen } from '../results/scoreScale';
import { CAMERA_LIGHTING_HELP, CAMERA_FRAMING_HELP, CAMERA_DARKNESS_NOTICE } from './PoseCameraGuidance';
import { SaluteSequenceSummary } from './SaluteSequenceSummary';

export function PoseFinalSummary({ result, movementId, onRetry, children }: {
  result: ScoreResult; movementId: MovementId; onRetry?: () => void; children: ReactNode;
}) {
  const [showAll, setShowAll] = useState(false), [detailsOpen, setDetailsOpen] = useState(false);
  const feedback = concisePoseFeedback(result), errors = feedback.filter(item => item.type === 'MOTION_ERROR'), evidence = feedback.filter(item => item.type === 'INSUFFICIENT_EVIDENCE');
  const scored = result.status === 'scored' ? result : null;
  const incomplete = !scored || scored.assessment === 'incomplete' || (evidence.length > 0 && scored.assessment !== 'fail');
  const passed = !!scored && !incomplete && scored.total >= 65;
  const missing = result.drill ? result.drill.steps.reduce((sum, step) => sum + (step.result.status === 'scored' ? step.result.unassessedPoints ?? 0 : 100), 0) : scored?.unassessedPoints ?? 0;
  const label = incomplete ? 'Chưa đủ dữ liệu' : passed ? 'Đạt' : 'Chưa đạt';
  const tone = incomplete ? 'text-amber-600 dark:text-amber-400' : passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  return <section aria-label="Tóm tắt kết quả AI Pose" className="space-y-5">
    {result.precondition && <section aria-label="Tiền đề — Đứng nghiêm" className="rounded-xl border border-slate-300 p-3 text-sm dark:border-slate-700">
      <h4 className="font-bold">Tiền đề — Đứng nghiêm</h4>
      <p>{poseScoreOnTen(result.precondition.result.total)}/10 · {result.precondition.result.assessment === 'incomplete' ? 'Chưa đủ dữ liệu' : result.precondition.result.passed ? 'Đạt' : 'Chưa đạt'}</p>
      <details><summary className="cursor-pointer">Xem tiêu chí tiền đề</summary><ul>{result.precondition.result.criteria.map(c => <li key={c.id}>{c.label}: {poseScoreOnTen(c.points)}/{poseScoreOnTen(c.maximum)} · {c.specificFeedback ?? c.feedback}</li>)}</ul></details>
      <p className="mt-2 text-xs text-slate-500">Snapshot riêng; không cộng vào điểm động tác chính.</p>
    </section>}
    {result.precondition && <h4 className="font-bold">Động tác chính</h4>}
    <div className="flex items-start justify-between gap-4">
      <div><h3 className="text-lg font-black">{EXERCISE_CATALOG.find(item => item.id === movementId)?.name ?? 'AI Pose'}</h3><p className={`mt-2 font-bold ${tone}`}>{label}</p></div>
      <div className={`text-right ${tone}`}>
        <p className="text-3xl font-black">{scored ? `${poseScoreOnTen(scored.total)}/${poseScoreOnTen(100 - (result.drill ? missing / 3 : missing))}` : '—'}</p>
        <p className="text-xs">{missing > 0 && scored ? 'điểm ở phần đã đánh giá' : scored ? 'điểm' : 'chưa có điểm'}</p>
      </div>
    </div>
    <section aria-label="Cần sửa" className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <h4 className="font-black text-sm">Cần sửa</h4>
      {errors.length ? <ul className="mt-3 space-y-2 text-sm">{(showAll ? errors : errors.slice(0, 3)).map(item => <li key={item.criterionId}>
        <span className="font-semibold">{item.label}{item.required ? ' (bắt buộc)' : ''}</span><span className="text-red-600 dark:text-red-400"> → {item.message}</span>
      </li>)}</ul> : <p className="mt-2 text-sm text-slate-500">{incomplete ? 'Chưa đủ cơ sở kết luận động tác.' : 'Không ghi nhận tiêu chí cần sửa.'}</p>}
      {errors.length > 3 && <button type="button" onClick={() => setShowAll(value => !value)} className="mt-3 text-sm font-bold text-red-600">{showAll ? 'Thu gọn' : `Xem tất cả (${errors.length})`}</button>}
    </section>
    {evidence.length > 0 && <section aria-label="Dữ liệu camera" className="rounded-2xl bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
      <h4 className="font-bold text-amber-800 dark:text-amber-300">Camera chưa ghi nhận đủ</h4>
      <ul className="mt-2 space-y-1">{evidence.slice(0, 3).map(item => <li key={item.criterionId}>{item.label}{result.status === 'notScorable' ? `: ${item.message}` : ''}</li>)}</ul>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Giữ phần cơ thể cần đánh giá trong khung hình, đủ sáng rồi thử lại. Thiếu dữ liệu không đồng nghĩa với làm sai động tác.</p>
      {result.status === 'notScorable' && <details className="mt-3 text-xs leading-relaxed">
        <summary className="cursor-pointer font-semibold">Cách cải thiện ánh sáng và vị trí camera</summary>
        <ul className="mt-2 list-disc pl-4 space-y-2"><li>{CAMERA_LIGHTING_HELP}</li><li>{CAMERA_FRAMING_HELP}</li></ul>
        <p className="mt-2">{CAMERA_DARKNESS_NOTICE}</p>
      </details>}
    </section>}
    <SaluteSequenceSummary result={result} />
    <details onToggle={event => setDetailsOpen(event.currentTarget.open)} className="border-t border-slate-200 pt-3 dark:border-slate-700">
      <summary className="cursor-pointer text-sm font-semibold">Xem thông số chi tiết</summary>
      {detailsOpen && <div className="mt-4">{children}</div>}
    </details>
    {onRetry && <button type="button" onClick={onRetry} className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">Thực hiện lại</button>}
  </section>;
}
