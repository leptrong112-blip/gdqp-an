import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { MovementId } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import { ScoreResults } from './ScoreResults';

export function PoseResultDialog({ result, movementId, open, onClose, onRetry, scoreComparison }: {
  result: ScoreResult | null;
  movementId: MovementId;
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  scoreComparison?: { previous: number; delta: number } | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
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
      {result && <ScoreResults result={result} movementId={movementId} onRetry={onRetry} scoreComparison={scoreComparison} />}
    </div>
  </dialog>;
}
