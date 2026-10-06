import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { MovementId } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import { ScoreResults } from './ScoreResults';
import type { PoseStudentSession } from '../results/studentSession';
import type { PoseSaveState } from '../results/resultSaver';
import { poseNowMs, type PoseFinalAttempt } from '../runtime/attemptTiming';

export function PoseResultDialog({ result, movementId, open, onClose, onRetry, scoreComparison, student, attempt, processingLatencyMs, saveState, onSaveRetry, onChangeStudent, onPresented }: {
  result: ScoreResult | null;
  movementId: MovementId;
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  scoreComparison?: { previous: number; delta: number } | null;
  student?: PoseStudentSession | null;
  attempt?: PoseFinalAttempt | null;
  processingLatencyMs?: number | null;
  saveState?: PoseSaveState | null;
  onSaveRetry?: () => void;
  onChangeStudent?: () => void;
  onPresented?: (renderedAtMs: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const presented = useRef<ScoreResult | null>(null);
  const presentedCallback = useRef(onPresented);
  presentedCallback.current = onPresented;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open || !result) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    // Native modal top layer also sits above the header and fullscreen camera.
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.scrollTop = 0;
    headingRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, result]);

  useEffect(() => {
    if (!open || !result || presented.current === result) return;
    const frame = requestAnimationFrame(() => {
      presented.current = result;
      presentedCallback.current?.(poseNowMs());
    });
    return () => cancelAnimationFrame(frame);
  }, [open, result]);

  return <dialog
    ref={dialogRef}
    aria-labelledby={titleId}
    aria-modal="true"
    onCancel={event => { event.preventDefault(); onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-3xl border border-slate-300 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  >
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
      <h2 ref={headingRef} tabIndex={-1} id={titleId} className="font-black text-lg outline-none">
        {result?.status === 'scored' ? 'Kết quả đánh giá' : 'Chưa có kết quả chấm điểm'}
      </h2>
      <button type="button" onClick={onClose} aria-label="Đóng kết quả" className="shrink-0 rounded-xl p-3 hover:bg-slate-100 focus-visible:outline-2 dark:hover:bg-slate-800">
        <X size={20} />
      </button>
    </div>
    <div className="p-3 sm:p-5">
      {student && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
        <p><strong>{student.studentName}</strong> · Lớp {student.className}</p>
        {processingLatencyMs != null && <p className="text-xs text-slate-500 dark:text-slate-400">Sau hoàn thành: {Math.round(processingLatencyMs)} ms</p>}
      </div>}
      {result && <ScoreResults result={result} movementId={movementId} onRetry={onRetry} scoreComparison={scoreComparison} concise />}
      {result?.status === 'scored' && student && <div className="mt-4 text-sm" aria-live="polite">
        {saveState?.status === 'saved' ? <p className="text-emerald-600 dark:text-emerald-400">✓ Kết quả đã được lưu</p> : saveState?.status === 'error' ? <>
          <p className="text-amber-700 dark:text-amber-300">Kết quả đã chấm nhưng chưa lưu được.</p>
          <p className="mt-1 text-xs text-slate-500">{saveState.error}</p>
          {onSaveRetry && <button type="button" onClick={onSaveRetry} className="mt-2 rounded-xl border border-amber-500 px-4 py-2 font-bold">Lưu lại kết quả</button>}
        </> : <p className="text-slate-500">Đang lưu kết quả…</p>}
      </div>}
      {attempt && <details className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer">Thời gian xử lý</summary>
        <dl className="mt-2 space-y-1">
          <div>Suy luận khung hình cuối: {attempt.timing.inferenceMs.toFixed(1)} ms</div>
          <div>Truyền kết quả từ runtime: {attempt.timing.workerLatencyMs?.toFixed(1) ?? '—'} ms</div>
          <div>Chốt điểm: {attempt.timing.finalizationMs.toFixed(1)} ms</div>
          <div>UI nhận → hiển thị: {attempt.timing.uiReceivedAtMs && processingLatencyMs != null && attempt.timing.scoringWindowFinishedAtMs ? Math.max(0, attempt.timing.scoringWindowFinishedAtMs + processingLatencyMs - attempt.timing.uiReceivedAtMs).toFixed(1) : '—'} ms</div>
        </dl>
      </details>}
      {onChangeStudent && <button type="button" onClick={onChangeStudent} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">Đổi học sinh</button>}
    </div>
  </dialog>;
}
