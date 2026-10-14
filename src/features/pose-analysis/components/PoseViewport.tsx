import { useRef, useState, type RefObject } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { PoseStage, AnalysisSnapshot } from '../types';
import { DRILL_LABELS } from '../scoring/basicDrill';
import type { PoseCommandText } from '../runtime/commandFlow';

export function PoseViewport({
  videoRef, canvasRef, mirrored, stage, progress, isFullscreen = false, onToggleFullscreen,
  autoCountdown = null, movementLabel = 'Đứng nghiêm', qualityPassed = true, pauseReason,
  drillProgress, dynamicProgress, diagnosticOverlay, handStatus, handReason, commandCue, workflow, saluteProgress, readinessStatus,
}: {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  mirrored: boolean;
  stage: PoseStage;
  progress: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  autoCountdown?: number | null;
  movementLabel?: string;
  qualityPassed?: boolean;
  pauseReason?: string;
  drillProgress?: AnalysisSnapshot['drillProgress'];
  dynamicProgress?: AnalysisSnapshot['dynamicProgress'];
  diagnosticOverlay?: React.ReactNode;
  readinessStatus?: React.ReactNode;
  handStatus?: AnalysisSnapshot['frame']['handStatus'];
  handReason?: string;
  commandCue?: { command: PoseCommandText } | null;
  workflow?: AnalysisSnapshot['workflow'];
  saluteProgress?: AnalysisSnapshot['saluteProgress'];
}) {
  const container = useRef<HTMLDivElement>(null), [localExpanded, setLocalExpanded] = useState(false);
  const expanded = isFullscreen || localExpanded;
  const preparing = ['quality-check', 'calibrating', 'waiting-precondition', 'precondition-scoring'].includes(stage);
  const performing = ['transition', 'scoring'].includes(stage);
  const finished = ['completed', 'result', 'blocked'].includes(stage);
  const active = preparing || performing || ['countdown','stop-command'].includes(stage);
  const countdown = Math.max(1, Math.ceil(3 * (1 - progress)));
  const holdSeconds = (progress * 3).toFixed(1);

  let title = '', detail = '';
  if (preparing) {
    title = `Tư thế chuẩn bị: ${workflow?.preconditionLabel ?? 'Đứng nghiêm'}`;
    detail = workflow?.message ?? (workflow?.status === 'WRONG_PRECONDITION' ? 'Vào tư thế chuẩn bị, chờ khẩu lệnh rồi mới thực hiện.'
      : workflow?.status === 'INSUFFICIENT_EVIDENCE' ? 'Camera đang nhận lại tư thế. Giữ toàn thân rõ trong hình.'
      : stage === 'calibrating' ? 'Giữ ổn định để camera đo tỷ lệ cơ thể.'
      : stage === 'precondition-scoring' ? 'Đang ghi nhận điểm tiền đề Đứng nghiêm · giữ ổn định.'
      : 'Buông tay tự nhiên, giữ vị trí và chờ đếm ngược.');
  } else if (stage === 'countdown') {
    title = qualityPassed ? `Chuẩn bị bắt đầu · ${movementLabel}` : 'Tạm dừng chuẩn bị';
    detail = qualityPassed ? `Giữ tư thế ${workflow?.preconditionLabel ?? 'chuẩn bị'}; chờ khẩu lệnh rồi mới thực hiện.`
      : pauseReason || 'Đứng lại trong vùng nhận diện.';
  } else if (performing) {
    title = stage === 'transition' ? `Đang ghi nhận ${movementLabel}`
      : dynamicProgress?.message ?? `Đang chấm · giữ tư thế (${holdSeconds} / 3.0s)`;
    detail = !qualityPassed ? pauseReason || 'Camera đang nhận lại hình. Giữ toàn thân rõ trong khung hình.'
      : saluteProgress ? saluteProgress.motionObserved ? 'Đã ghi nhận nâng tay · giữ Chào ổn định để chốt điểm.' : 'Nâng tay phải sau khẩu lệnh CHÀO.'
      : stage === 'transition' ? 'Thực hiện động tác sau khẩu lệnh, rồi giữ tư thế cuối.' : '';
  }
  if (commandCue) { title = commandCue.command; detail = commandCue.command === 'THÔI' ? 'Đã kết thúc lượt đánh giá.' : `Thực hiện ${movementLabel} ngay bây giờ.`; }
  if (autoCountdown !== null && stage === 'quality-check') detail = `Đã đủ vị trí · tự động hiệu chuẩn sau ${autoCountdown} giây.`;
  const handMessage = performing && !commandCue && handStatus
    ? handReason && handStatus !== 'observed' ? `Bàn tay: ${handReason}`
      : handStatus === 'loading' ? 'Đang tải nhận diện bàn tay…'
      : handStatus === 'unavailable' ? 'Chưa chạy được nhận diện bàn tay. Các tiêu chí cơ thể vẫn được đánh giá.'
      : handStatus === 'observed' ? 'Đã thấy bàn tay phải · giữ tư thế chào tự nhiên.'
      : handStatus === 'not-visible' ? 'Camera chưa thấy rõ chi tiết bàn tay phải; phần tay chưa được xác nhận.' : ''
    : stage === 'scoring' && saluteProgress && !saluteProgress.hand?.available
      ? 'Chưa đủ dữ liệu để đánh giá bàn tay. Giữ tay phải rõ trong khung hình.' : '';

  const handleToggle = async () => {
    if (onToggleFullscreen) onToggleFullscreen();
    else {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      else if (!localExpanded && container.current?.requestFullscreen) await container.current.requestFullscreen().catch(() => setLocalExpanded(true));
      else setLocalExpanded(!localExpanded);
    }
  };

  return (
    <div ref={container} className={`${isFullscreen ? 'relative h-full w-full' : localExpanded ? 'fixed inset-0 z-[100] h-dvh'
      : 'relative h-[62vh] min-h-[360px] lg:h-[75vh] xl:h-[78vh]'} flex flex-col overflow-hidden rounded-3xl bg-slate-950 border border-slate-700 shadow-2xl`}>
      <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-800 px-3 py-2 sm:px-4 sm:py-3">
        <span className="flex min-w-0 items-center gap-2 text-[11px] sm:text-xs font-semibold text-slate-200">
          <span className={`h-2 w-2 shrink-0 rounded-full ${finished ? 'bg-emerald-400' : active ? 'bg-red-500' : 'bg-slate-500'}`} />
          {finished ? 'Đã kết thúc lượt đánh giá' : active ? 'Camera đang bật · xử lý trên thiết bị' : stage === 'loading-model' ? 'Đang khởi tạo camera' : 'Camera đã tắt'}
        </span>
        <button aria-label={expanded ? 'Thu nhỏ khung hình' : 'Phóng to toàn màn hình'} onClick={handleToggle}
          className="shrink-0 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer">
          {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          <span className="hidden sm:inline">{expanded ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>
      </div>
      {/* Status is outside the image. Video and skeleton share the same contain geometry. */}
      <div data-pose-camera-region className="relative flex-1 min-h-0 w-full">
        <div className="absolute inset-0" style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-contain" aria-label="Hình ảnh trực tiếp từ camera" />
          <canvas ref={canvasRef} className="absolute inset-0 z-[1] h-full w-full pointer-events-none" aria-hidden="true" />
        </div>
        {stage === 'idle' && <div className="absolute inset-0 grid place-content-center px-6 text-center text-slate-300 pointer-events-none">
          <p className="text-lg font-bold">Sẵn sàng vào tư thế</p>
          <p className="mt-2 text-sm">Bật camera, đặt máy cố định thấy rõ từ đầu đến bàn chân.</p>
        </div>}
        {diagnosticOverlay}
      </div>
      {(title || drillProgress) && <div data-pose-status-strip className="shrink-0 max-h-[40%] overflow-y-auto border-t border-slate-700 bg-slate-900 px-3 py-2 sm:px-4 sm:py-3 text-white">
        {drillProgress && <ol aria-label="Tiến trình chuỗi" className="mb-2 flex flex-wrap gap-2 text-xs">
          {DRILL_LABELS.map((label,i) => <li key={label} aria-current={i === drillProgress.index ? 'step' : undefined}
            className={`rounded-lg px-2 py-1 ${i < drillProgress.completed ? 'bg-emerald-800' : i === drillProgress.index ? 'bg-amber-700' : 'bg-slate-800'}`}>
            {i < drillProgress.completed ? '✓' : i+1} {label}
          </li>)}
        </ol>}
        <div className="flex items-center gap-3" role="status" aria-live={commandCue ? 'assertive' : 'polite'} aria-label={commandCue ? `Khẩu lệnh ${commandCue.command}` : undefined}>
          {!commandCue && stage === 'countdown' && qualityPassed && <span className="shrink-0 text-5xl font-black tabular-nums text-amber-300">{countdown}</span>}
          <div className="min-w-0 flex-1 break-words">
            <p className={commandCue ? 'text-2xl sm:text-4xl font-black text-amber-300' : 'text-sm sm:text-base font-bold'}>{title}</p>
            {detail && <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300">{detail}</p>}
            {handMessage && <p className="mt-1 text-xs text-sky-200">{handMessage}</p>}
          </div>
        </div>
        {!commandCue && ['calibrating','waiting-precondition','precondition-scoring','scoring'].includes(stage) && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700" aria-hidden="true">
          <div className={`h-full transition-all duration-150 ${stage === 'scoring' ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{width:`${Math.max(0,Math.min(1,progress))*100}%`}} />
        </div>}
        {!commandCue && readinessStatus}
      </div>}
    </div>
  );
}
